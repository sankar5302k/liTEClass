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
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket: Socket) => {
        // console.log('Client connected:', socket.id);

        socket.on('join-room', async ({ roomId, hostId }) => {
            try {
                await dbConnect();
                const room = await Room.findOne({ code: roomId });

                if (!room || !room.active) {
                    socket.emit('error', 'Room not found or inactive');
                    return;
                }

                const isHost = room.hostId === hostId;

                socket.join(roomId);
                // Identify if host joined? 
                // We might want to know if the host is online, but for P2P audio, 
                // everyone connects to everyone.

                // Notify others
                // "user-connected" payload: socketId, isHost status (optional)
                socket.to(roomId).emit('user-connected', { userId: socket.id, isHost });

                // Also send existing users to the new joiner?
                // In mesh, usually new joiner initiates or existing initiate.
                // Simple mesh: Existing users call the new user.
                // So notifying existing users "user-connected" is enough if they initiate.
                // OR: new user calls all existing users.
                // Let's stick to: Socket.io broadcast (except sender) "user-connected".
                // Receivers initiate call.

                console.log(`User ${socket.id} joined room ${roomId} (Host: ${isHost})`);
            } catch (e) {
                console.error("Join error", e);
            }
        });

        // Signaling for WebRTC
        socket.on('signal', (data) => {
            // payload: { signal, target, callerId }
            io.to(data.target).emit('signal', {
                signal: data.signal,
                callerID: data.callerID
            });
        });

        socket.on('refresh-materials', ({ roomId }) => {
            socket.to(roomId).emit('materials-updated');
        });

        socket.on('disconnecting', () => {
            const rooms = socket.rooms;
            rooms.forEach((roomId) => {
                if (roomId !== socket.id) {
                    socket.to(roomId).emit('user-disconnected', socket.id);
                }
            });
        });

        socket.on('end-meeting', async ({ roomId, hostId }) => {
            try {
                await dbConnect();
                const room = await Room.findOne({ code: roomId });
                if (!room) return;

                if (room.hostId === hostId) {
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
