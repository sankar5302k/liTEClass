import 'dotenv/config'; // Load env vars before anything else
import { createServer as createHttpServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer, Socket } from 'socket.io';
import dbConnect from './lib/db.ts';
import Room from './models/Room.ts';
import Material from './models/Material.ts';
import fs from 'fs';
import path from 'path';
import { verifyToken } from './lib/auth.ts';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    let server: any; // Type 'any' to accommodate both http and https server variants
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
            origin: "http://localhost:3000", // Strictly allow localhost for dev
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Middleware for Auth
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
            // verifyToken is already imported at the top

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
        // console.log('Client connected:', user?.email);

        socket.on('join-room', async ({ roomId }) => {
            console.log(`[Server] join-room received from ${socket.id} for room ${roomId}`);
            const user = socket.data.user;

            if (!user) {
                console.error(`[Server] User not authenticated for socket ${socket.id}`);
                socket.emit('error', 'Authentication required to join room');
                return;
            }
            try {
                // console.log("debug: calling dbConnect");
                await dbConnect();
                // console.log("debug: db connected, finding room");
                const room = await Room.findOne({ code: roomId });

                if (!room || !room.active) {
                    console.error(`[Server] Room ${roomId} not found or inactive`);
                    socket.emit('error', 'Room not found or inactive');
                    return;
                }

                socket.join(roomId);
                console.log(`[Server] Socket ${socket.id} joined room ${roomId}`);

                // Add to participants in DB
                await Room.updateOne(
                    { code: roomId },
                    { $addToSet: { participants: user.email } }
                );
                console.log(`[Server] DB updated for room ${roomId}`);

                const isHost = room.hostId === user.email;

                // Notify others
                console.log(`[Join] notifying room ${roomId} about ${user.email} (${socket.id})`);
                socket.to(roomId).emit('user-connected', { userId: socket.id, user, isHost });

                // Emit active participants
                const sockets = await io.in(roomId).fetchSockets();
                const participants = sockets.map(s => ({
                    socketId: s.id,
                    user: s.data.user,
                    isHost: room.hostId === s.data.user.email,
                    isMuted: s.data.isMuted || false
                }));

                io.to(roomId).emit('participants-update', participants);

                console.log(`User ${user.email} joined room ${roomId}`);
            } catch (e) {
                console.error("Join error", e);
            }
        });

        // Signaling for WebRTC
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

        socket.on('disconnecting', async () => {
            const rooms = socket.rooms;
            rooms.forEach(async (roomId) => {
                if (roomId !== socket.id) {
                    socket.to(roomId).emit('user-disconnected', socket.id);

                    // Update participants list for others
                    const sockets = await io.in(roomId).fetchSockets();
                    const participants = sockets
                        .filter(s => s.id !== socket.id) // Filter out self
                        .map(s => ({
                            socketId: s.id,
                            user: s.data.user,
                            isHost: false, // We can't easily check DB here without query, but name/email is enough
                            isMuted: s.data.isMuted || false
                        }));
                    io.to(roomId).emit('participants-update', participants);
                }
            });
        });

        socket.on('end-meeting', async ({ roomId }) => {
            try {
                await dbConnect();
                const room = await Room.findOne({ code: roomId });
                if (!room) return;

                if (room.hostId === user.email) {
                    // Delete room and materials
                    await Room.deleteOne({ code: roomId });
                    await Material.deleteMany({ roomId });

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
