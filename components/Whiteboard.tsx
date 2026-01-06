'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { IWhiteboardLog } from '@/models/WhiteboardLog';

interface WhiteboardProps {
    roomId: string;
    socket: Socket | null;
    user: any;
    onClose: () => void;
}

interface Point {
    x: number;
    y: number;
}

interface DrawEvent {
    type: 'draw_start' | 'draw_move' | 'draw_end';
    x: number;
    y: number;
    color: string;
    width: number;
    userId?: string;
}

export default function Whiteboard({ roomId, socket, user, onClose }: WhiteboardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [color, setColor] = useState('#000000');
    const [isErasing, setIsErasing] = useState(false);
    const [width, setWidth] = useState(2);

    // State for local drawing
    const isDrawing = useRef(false);
    const lastPoint = useRef<Point | null>(null);

    // Throttle buffer
    const pendingEvents = useRef<DrawEvent[]>([]);
    const lastSendTime = useRef(0);
    const THROTTLE_MS = 100; // Send events max every 100ms

    // Helper to normalize coordinates (0-1)
    const getNormalizedPos = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as MouseEvent).clientX;
            clientY = (e as MouseEvent).clientY;
        }

        return {
            x: (clientX - rect.left) / rect.width,
            y: (clientY - rect.top) / rect.height
        };
    };

    // Helper to denormalize for rendering
    const drawLine = (start: Point, end: Point, strokeColor: string, strokeWidth: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.beginPath();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
        ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
        ctx.stroke();
    };

    const flushEvents = useCallback(() => {
        if (!socket || pendingEvents.current.length === 0) return;

        pendingEvents.current.forEach(evt => {
            socket.emit('wb-event', {
                roomId,
                userId: user?.email,
                type: evt.type,
                data: {
                    x: evt.x,
                    y: evt.y,
                    color: evt.color,
                    width: evt.width
                }
            });
        });
        pendingEvents.current = [];
        lastSendTime.current = Date.now();
    }, [socket, roomId, user]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (Date.now() - lastSendTime.current >= THROTTLE_MS) {
                flushEvents();
            }
        }, THROTTLE_MS);
        return () => clearInterval(interval);
    }, [flushEvents]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault(); 
        if (!canvasRef.current) return;
        isDrawing.current = true;
        const pos = getNormalizedPos(e);
        lastPoint.current = pos;

        
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        if (!isDrawing.current || !lastPoint.current) return;

        const currentPoint = getNormalizedPos(e);
        const currentColor = isErasing ? '#ffffff' : color;
        const currentWidth = isErasing ? 20 : width;

        drawLine(lastPoint.current, currentPoint, currentColor, currentWidth);

        pendingEvents.current.push({
            type: 'draw_move',
            x: currentPoint.x,
            y: currentPoint.y,
            color: currentColor,
            width: currentWidth,
            userId: user?.email
        });



        socket?.emit('wb-event', {
            roomId,
            userId: user?.email,
            type: 'draw_line', 
            data: {
                fromX: lastPoint.current.x,
                fromY: lastPoint.current.y,
                toX: currentPoint.x,
                toY: currentPoint.y,
                color: currentColor,
                width: currentWidth
            }
        });



        lastPoint.current = currentPoint;
    };

    const stopDrawing = () => {
        isDrawing.current = false;
        lastPoint.current = null;
    };

    const clearBoard = () => {
        if (socket) {
            socket.emit('wb-clear', { roomId });
        }
    };

    // Socket Listeners
    useEffect(() => {
        if (!socket || !canvasRef.current) return;

        const handleRemoteEvent = (event: { roomId: string; userId?: string; type: string; data: any }) => {
            if (event.roomId !== roomId) return;
            if (event.userId === user?.email) return;

            if (event.type === 'draw_line') {
                const { fromX, fromY, toX, toY, color, width } = event.data;
                drawLine({ x: fromX, y: fromY }, { x: toX, y: toY }, color, width);
            }
        };

        const handleHistory = (logs: IWhiteboardLog[]) => {
            logs.forEach(log => {
                if (log.type === 'draw_line') {
                    const data = log.data as any;
                    const { fromX, fromY, toX, toY, color, width } = data;
                    drawLine({ x: fromX, y: fromY }, { x: toX, y: toY }, color, width);
                }
            });
        };

        const handleClear = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
        };

        socket.on('wb-event', handleRemoteEvent);
        socket.on('wb-history', handleHistory);
        socket.on('wb-clear', handleClear);

        // Request history
        socket.emit('wb-join', { roomId });

        return () => {
            socket.off('wb-event', handleRemoteEvent);
            socket.off('wb-history', handleHistory);
            socket.off('wb-clear', handleClear);
        };
    }, [socket, roomId, user]);

    // Resize handling
    useEffect(() => {
        const resize = () => {
            if (canvasRef.current) {
            
                const parent = canvasRef.current.parentElement;
                if (parent) {
                    canvasRef.current.width = parent.clientWidth;
                    canvasRef.current.height = parent.clientHeight;
                }
                socket?.emit('wb-join', { roomId });
            }
        };
        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, [socket, roomId]);

    return (
        <div className="absolute inset-0 bg-white z-50 flex flex-col">
            <div className="bg-gray-100 border-b p-2 flex gap-4 items-center justify-between">
                <div className="flex gap-2">
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => { setColor(e.target.value); setIsErasing(false); }}
                        className="w-8 h-8 cursor-pointer"
                        title="Pen Color"
                    />
                    <button
                        onClick={() => setIsErasing(!isErasing)}
                        className={`px-3 py-1 rounded ${isErasing ? 'bg-red-200' : 'bg-gray-200'}`}
                    >
                        {isErasing ? 'Eraser' : 'Pen'}
                    </button>
                    <input
                        type="range"
                        min="1" max="10"
                        value={width}
                        onChange={(e) => setWidth(Number(e.target.value))}
                        className="w-24"
                    />
                </div>
                <div className="flex gap-2">
                    <button onClick={clearBoard} className="bg-red-500 text-white px-3 py-1 rounded">Clear</button>
                    <button onClick={onClose} className="bg-gray-800 text-white px-3 py-1 rounded">Close</button>
                </div>
            </div>

            <div className="flex-1 relative cursor-crosshair touch-none">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-full block"
                />
            </div>
        </div>
    );
}
