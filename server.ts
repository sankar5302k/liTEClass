import 'dotenv/config';
import { createServer as createHttpServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer, Socket } from 'socket.io';
import dbConnect from './lib/db.ts';
import Room from './models/Room.ts';
import Material from './models/Material.ts';
import WhiteboardLog from './models/WhiteboardLog.ts';
import Poll from './models/Poll.ts';
import fs from 'fs';
import path from 'path';
import { verifyToken } from './lib/auth.ts';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    let server: ReturnType<typeof createHttpServer> | ReturnType<typeof createHttpsServer>;
    const certPath = path.join(process.cwd(), 'cert.pem');
    const keyPath = path.join(process.cwd(), 'key.pem');
    const useHttps = fs.existsSync(certPath) && fs.existsSync(keyPath);

    if (useHttps) {
        console.log("> Found SSL certificates. Starting HTTPS server...");
        const httpsOptions = {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
        };
        server = createHttpsServer(httpsOptions, async (req, res) => {
            try {
                const parsedUrl = parse(req.url!, true);
                await handle(req, res, parsedUrl);
            } catch (err) {
                console.error('Error occurred handling', req.url, err);
                res.statusCode = 500;
                res.end('internal server error');
            }
        });
    } else {
        console.log("> No SSL certificates found. Starting HTTP server...");
        server = createHttpServer(async (req, res) => {
            try {
                const parsedUrl = parse(req.url!, true);
                await handle(req, res, parsedUrl);
            } catch (err) {
                console.error('Error occurred handling', req.url, err);
                res.statusCode = 500;
                res.end('internal server error');
            }
        });
    }

    const io = new SocketIOServer(server, {
        path: '/socket.io',
        addTrailingSlash: false,
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true
        }
    });


    io.use((socket, next) => {
        try {
            const cookieHeader = socket.request.headers.cookie;
            console.log("Socket Auth: Cookie Header present?", !!cookieHeader);

            if (!cookieHeader) {
                console.error("Socket Auth: No cookie header");
                return next(new Error("Authentication error: No cookie"));
            }

            const getCookie = (name: string) => {
                const value = `; ${cookieHeader}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop()?.split(';').shift();
            }

            const token = getCookie('token');


            if (token) {
                const payload = verifyToken(token);
                if (payload) {
                    console.log("Socket Auth: User verified", (payload as any).email);
                    socket.data.user = payload;
                    return next();
                } else {
                    console.error("Socket Auth: Invalid token verification. Token:", token.substring(0, 10) + "...");
                }
            } else {
                console.error("Socket Auth: Token not found in cookie");
            }
            next(new Error("Authentication error: Invalid session"));
        } catch (e) {
            console.error("Socket Auth: Exception", e);
            next(new Error("Authentication error"));
        }
    });

    io.on('connection', (socket: Socket) => {
        const user = socket.data.user;


        socket.on('join-room', async ({ roomId }) => {
            console.log(`[Server] join-room received from ${socket.id} for room ${roomId}`);
            const user = socket.data.user;

            if (!user) {
                console.error(`[Server] User not authenticated for socket ${socket.id}`);
                socket.emit('error', 'Authentication required to join room');
                return;
            }
            try {
                await dbConnect();
                const room = await Room.findOne({ code: roomId });

                if (!room || !room.active) {
                    console.error(`[Server] Room ${roomId} not found or inactive`);
                    socket.emit('error', 'Room not found or inactive');
                    return;
                }

                const isHost = room.hostId === user.email;
                // Check if already participant or is host
                const isApproved = isHost || room.participants.includes(user.email);

                if (isApproved) {
                    // Cleanup waiting room if they were there
                    if (room.waitingRoom.includes(user.email)) {
                        await Room.updateOne({ code: roomId }, { $pull: { waitingRoom: user.email } });
                    }

                    // STANDARD JOIN
                    socket.join(roomId);
                    console.log(`[Server] Socket ${socket.id} joined room ${roomId}`);

                    await Room.updateOne(
                        { code: roomId },
                        { $addToSet: { participants: user.email } }
                    );

                    // Notify room
                    socket.to(roomId).emit('user-connected', { userId: socket.id, user, isHost });

                    // Send WB permissions
                    const wbAccess = room.whiteboardAccess || [];
                    const canWrite = isHost || wbAccess.includes(user.email);
                    socket.emit('wb-permissions-update', { canWrite });

                    await broadcastRoomUpdate(io, roomId);
                    console.log(`User ${user.email} joined room ${roomId}`);

                } else {
                    // WAITING ROOM
                    console.log(`[Server] User ${user.email} added to waiting room for ${roomId}`);
                    await Room.updateOne(
                        { code: roomId },
                        { $addToSet: { waitingRoom: user.email } }
                    );
                    socket.join(`${roomId}-waiting`); // Join waiting channel for updates if needed (or just direct socket)
                    socket.emit('waiting-for-approval');

                    // Notify Host
                    await notifyHostOfWaitingList(io, roomId);
                }

            } catch (e) {
                console.error("Join error", e);
            }
        });

        socket.on('host-action', async (data) => {
            const { action, roomId, targetId, targetEmail } = data; // targetId is socketId if available, targetEmail for DB ops
            const user = socket.data.user;
            if (!user) return;

            await dbConnect();
            const room = await Room.findOne({ code: roomId });
            if (!room || room.hostId !== user.email) {
                socket.emit('error', 'Unauthorized host action');
                return;
            }

            if (action === 'approve-user') {
                await Room.updateOne({ code: roomId }, {
                    $pull: { waitingRoom: targetEmail },
                    $addToSet: { participants: targetEmail }
                });

                // Find socket of waiting user? 
                // They haven't joined the room yet, so we can't search room.
                // But we can try to find by user.email in connected sockets if we tracked them, 
                // OR rely on them re-joining or listen to a specific event?
                // Better: We stored them in waitingRoom list. 
                // They are connected and stuck in 'waiting-for-approval'.
                // Use io.fetchSockets() to find them? Or just broadcast to `${roomId}-waiting`?
                // We need to target specific user.
                // Wait, we don't know their socketId easily unless we store it.
                // BUT, if they are in `${roomId}-waiting`, we can find them there.

                const waitingSockets = await io.in(`${roomId}-waiting`).fetchSockets();
                const targetSocket = waitingSockets.find(s => s.data.user?.email === targetEmail);

                if (targetSocket) {
                    targetSocket.leave(`${roomId}-waiting`);
                    // Emit granted, client will re-emit 'join-room' or we force join here?
                    // Client re-emit is safer for state sync.
                    targetSocket.emit('access-granted');
                }

                await notifyHostOfWaitingList(io, roomId);

            } else if (action === 'deny-user') {
                await Room.updateOne({ code: roomId }, { $pull: { waitingRoom: targetEmail } });
                const waitingSockets = await io.in(`${roomId}-waiting`).fetchSockets();
                const targetSocket = waitingSockets.find(s => s.data.user?.email === targetEmail);
                if (targetSocket) {
                    targetSocket.emit('access-denied');
                    targetSocket.disconnect();
                }
                await notifyHostOfWaitingList(io, roomId);

            } else if (action === 'kick-user') {
                await Room.updateOne({ code: roomId }, {
                    $pull: { participants: targetEmail, whiteboardAccess: targetEmail }
                });

                const roomSockets = await io.in(roomId).fetchSockets();
                const targetSocket = roomSockets.find(s => s.id === targetId || s.data.user?.email === targetEmail);

                if (targetSocket) {
                    targetSocket.emit('kicked');
                    targetSocket.disconnect();
                }
                await broadcastRoomUpdate(io, roomId);

            } else if (action === 'toggle-wb-access') {
                const isAllowed = room.whiteboardAccess.includes(targetEmail);
                if (isAllowed) {
                    await Room.updateOne({ code: roomId }, { $pull: { whiteboardAccess: targetEmail } });
                } else {
                    await Room.updateOne({ code: roomId }, { $addToSet: { whiteboardAccess: targetEmail } });
                }

                // Notify specific user
                const roomSockets = await io.in(roomId).fetchSockets();
                const targetSocket = roomSockets.find(s => s.data.user?.email === targetEmail);
                if (targetSocket) {
                    targetSocket.emit('wb-permissions-update', { canWrite: !isAllowed });
                }
                // Notify host/room of updated permissions if needed? 
                // Maybe just broadcast room update to refresh participant lists which might show icons
                await broadcastRoomUpdate(io, roomId);
            } else if (action === 'mute-user') {
                // Force mute a user
                const roomSockets = await io.in(roomId).fetchSockets();
                const targetSocket = roomSockets.find(s => s.id === targetId);
                if (targetSocket) {
                    targetSocket.data.isMuted = true;
                    targetSocket.emit('force-mute');
                    // Broadcast update
                    io.to(roomId).emit('user-toggled-mute', {
                        socketId: targetSocket.id,
                        isMuted: true
                    });
                }
            }
        });


        socket.on('signal', (data) => {
            console.log(`[Signal] ${socket.id} -> ${data.target} type=${data.signal.type}`);
            io.to(data.target).emit('signal', {
                signal: data.signal,
                callerID: data.callerID
            });
        });

        socket.on('refresh-materials', ({ roomId }) => {
            io.to(roomId).emit('materials-updated');
        });

        socket.on('toggle-mute', ({ roomId, isMuted }) => {
            socket.data.isMuted = isMuted;
            socket.to(roomId).emit('user-toggled-mute', {
                socketId: socket.id,
                isMuted
            });
        });

        socket.on('send-reaction', ({ roomId, reaction }) => {
            const user = socket.data.user;
            io.to(roomId).emit('reaction-received', {
                socketId: socket.id,
                reaction,
                user: user ? { name: user.name, picture: user.picture } : undefined
            });
        });

        socket.on('send-message', (data) => {

            socket.to(data.roomId).emit('receive-message', data);
        });


        socket.on('wb-join', async ({ roomId }) => {
            try {
                await dbConnect();

                const logs = await WhiteboardLog.find({ roomId }).sort({ timestamp: 1 });
                socket.emit('wb-history', logs);
            } catch (e) {
                console.error("Whiteboard join error", e);
            }
        });

        socket.on('wb-event', async (eventData) => {
            const { roomId } = eventData;

            socket.to(roomId).emit('wb-event', eventData);


            try {
                await dbConnect();

                if (eventData.type === 'erase_object') {

                    await WhiteboardLog.deleteOne({
                        roomId: eventData.roomId,
                        'data.id': eventData.data.strokeId
                    });

                } else {
                    await WhiteboardLog.create({
                        roomId: eventData.roomId,
                        userId: eventData.userId || socket.data.user?.email,
                        type: eventData.type,
                        data: eventData.data
                    });
                }
            } catch (e) {
                console.error("Whiteboard save error", e);
            }
        });

        socket.on('wb-clear', async ({ roomId }) => {

            try {
                await dbConnect();
                await WhiteboardLog.deleteMany({ roomId });
                io.to(roomId).emit('wb-clear');
            } catch (e) {
                console.error("Whiteboard clear error", e);
            }
        });

        // --- Poll Events ---
        socket.on('create-poll', async (pollData) => {
            try {
                await dbConnect();
                // Validate host is nice but trusting client for now based on room logic
                // Ideally check room.hostId === socket.data.user.email

                const newPoll = await Poll.create({
                    roomId: pollData.roomId,
                    question: pollData.question,
                    options: pollData.options,
                    duration: pollData.duration,
                    correctOptionIndex: pollData.correctOptionIndex,
                    isActive: true,
                    votes: []
                });

                // Broadcast start
                io.to(pollData.roomId).emit('poll-started', {
                    id: newPoll._id,
                    question: newPoll.question,
                    options: newPoll.options,
                    duration: newPoll.duration,
                    correctOptionIndex: newPoll.correctOptionIndex
                });

                // Auto end poll
                setTimeout(async () => {
                    const poll = await Poll.findById(newPoll._id);
                    if (poll && poll.isActive) {
                        poll.isActive = false;
                        await poll.save();

                        // Aggregate results
                        const votes = poll.votes || [];
                        const results = new Array(poll.options.length).fill(0);
                        votes.forEach((v: any) => {
                            if (v.optionIndex >= 0 && v.optionIndex < results.length) {
                                results[v.optionIndex]++;
                            }
                        });

                        io.to(pollData.roomId).emit('poll-ended', {
                            id: newPoll._id,
                            results,
                            totalVotes: votes.length
                        });
                    }
                }, pollData.duration * 1000);

            } catch (e) {
                console.error("Create poll error", e);
            }
        });

        socket.on('submit-vote', async ({ pollId, optionIndex }) => {
            try {
                await dbConnect();
                const poll = await Poll.findById(pollId);
                if (poll && poll.isActive) {
                    const userId = socket.data.user?.email || socket.id; // Use email if logged in, else socketId

                    // Check if already voted
                    const hasVoted = poll.votes.some((v: any) => v.userId === userId);
                    if (hasVoted) return;

                    poll.votes.push({ userId, optionIndex });
                    await poll.save();
                }
            } catch (e) {
                console.error("Vote error", e);
            }
        });

        socket.on('end-poll-manual', async ({ pollId, roomId }) => {
            try {
                await dbConnect();
                const poll = await Poll.findById(pollId);
                if (poll && poll.isActive) {
                    poll.isActive = false;
                    await poll.save();

                    const votes = poll.votes || [];
                    const results = new Array(poll.options.length).fill(0);
                    votes.forEach((v: any) => {
                        if (v.optionIndex >= 0 && v.optionIndex < results.length) {
                            results[v.optionIndex]++;
                        }
                    });

                    io.to(roomId).emit('poll-ended', {
                        id: poll._id,
                        results,
                        totalVotes: votes.length
                    });
                }
            } catch (e) {
                console.error("End poll manual error", e);
            }
        });

        // Handling late joiners
        socket.on('get-active-poll', async ({ roomId }) => {
            try {
                await dbConnect();
                // Find the most recent active poll
                const poll = await Poll.findOne({ roomId, isActive: true }).sort({ createdAt: -1 });
                if (poll) {
                    // Calculate remaining time? Client can just resync or receive duration. 
                    // Ideally we send remaining time.
                    const elapsed = (Date.now() - new Date(poll.createdAt).getTime()) / 1000;
                    const remaining = Math.max(0, poll.duration - elapsed);

                    if (remaining > 0) {
                        socket.emit('poll-started', {
                            id: poll._id,
                            question: poll.question,
                            options: poll.options,
                            duration: remaining, // Send remaining sec so client timer matches roughly
                            correctOptionIndex: poll.correctOptionIndex
                        });
                    } else {
                        // Should have ended.
                        poll.isActive = false;
                        await poll.save();
                    }
                }
            } catch (e) {
                console.error("Get active poll error", e);
            }
        });

        socket.on('disconnecting', async () => {
            const rooms = socket.rooms;
            rooms.forEach(async (roomId) => {
                if (roomId !== socket.id && !roomId.endsWith('-waiting')) {
                    socket.to(roomId).emit('user-disconnected', socket.id);
                    // Also trigger update
                    // We need io here, but socket.to(roomId) works. 
                    // To do full broadcastRoomUpdate, we need the function. 
                    // Inside callback, we can't easily access 'io' unless we pass it or capture it. 'io' is in scope.
                    broadcastRoomUpdate(io, roomId);
                }


                // Old update logic removed in favor of broadcastRoomUpdate call above

            });
        });

        socket.on('end-meeting', async ({ roomId }) => {
            try {
                await dbConnect();
                const room = await Room.findOne({ code: roomId });
                if (!room) return;

                if (room.hostId === user.email) {

                    await Room.deleteOne({ code: roomId });
                    await Material.deleteMany({ roomId });
                    await WhiteboardLog.deleteMany({ roomId });

                    io.to(roomId).emit('meeting-ended');
                    io.to(roomId).disconnectSockets();
                    console.log(`Meeting ${roomId} ended by host`);
                } else {
                    socket.emit('error', 'Unauthorized to end meeting');
                }
            } catch (e) {
                console.error(e);
            }
        });
    });

    server.listen(port, hostname, () => {
        const proto = useHttps ? 'https' : 'http';
        console.log(`> Ready on ${proto}://${hostname}:${port}`);
    });
});

async function broadcastRoomUpdate(io: any, roomId: string) {
    await dbConnect();
    const room = await Room.findOne({ code: roomId });
    if (!room) return;

    const sockets = await io.in(roomId).fetchSockets();
    // Get WB access list
    const wbAccess = room.whiteboardAccess || [];

    const participants = sockets.map((s: any) => ({
        socketId: s.id,
        user: s.data.user,
        isHost: room.hostId === s.data.user.email,
        isMuted: s.data.isMuted || false,
        canWriteWb: (room.hostId === s.data.user.email) || wbAccess.includes(s.data.user.email)
    }));

    io.to(roomId).emit('participants-update', participants);
}

async function notifyHostOfWaitingList(io: any, roomId: string) {
    await dbConnect();
    const room = await Room.findOne({ code: roomId });
    if (!room) return;

    const waitingUsersEntries = room.waitingRoom || [];
    // We want to send full user info if possible, but waitingRoom only has emails.
    // For now, send emails. The host UI can toggle based on email or we might need to fetch user details?
    // User details are better. But we don't have a Users collection easily accessible or we have to query sockets?
    // Waiting sockets are in `${roomId}-waiting`.
    const waitingSockets = await io.in(`${roomId}-waiting`).fetchSockets();
    const waitingList = waitingSockets.map((s: any) => ({
        socketId: s.id,
        user: s.data.user
    }));

    // Find host socket
    const roomSockets = await io.in(roomId).fetchSockets();
    const hostSocket = roomSockets.find((s: any) => s.data.user.email === room.hostId);

    if (hostSocket) {
        hostSocket.emit('waiting-list-update', waitingList);
    }
}
