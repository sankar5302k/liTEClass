'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { IWhiteboardLog } from '@/models/WhiteboardLog';

interface WhiteboardProps {
    roomId: string;
    socket: Socket | null;
    user: any;
    onClose: () => void;
    isHost?: boolean;
    canWrite: boolean;
}

interface Point {
    x: number;
    y: number;
}

interface Stroke {
    id: string;
    points: Point[];
    color: string;
    width: number;
    userId?: string;
}

export default function Whiteboard({ roomId, socket, user, onClose, isHost, canWrite }: WhiteboardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [color, setColor] = useState('#000000');
    const [isErasing, setIsErasing] = useState(false);
    const [width, setWidth] = useState(2);
    const [isSaving, setIsSaving] = useState(false);

    const strokesRef = useRef<Stroke[]>([]);
    const [renderTrigger, setRenderTrigger] = useState(0);

    const isDrawing = useRef(false);
    const currentStroke = useRef<Stroke | null>(null);

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

    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;


        ctx.clearRect(0, 0, canvas.width, canvas.height);

        strokesRef.current.forEach(stroke => {
            if (stroke.points.length < 2) return;
            ctx.beginPath();
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.moveTo(stroke.points[0].x * canvas.width, stroke.points[0].y * canvas.height);
            for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x * canvas.width, stroke.points[i].y * canvas.height);
            }
            ctx.stroke();
        });

        if (currentStroke.current && currentStroke.current.points.length > 0) {
            const stroke = currentStroke.current;
            ctx.beginPath();
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.moveTo(stroke.points[0].x * canvas.width, stroke.points[0].y * canvas.height);
            for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x * canvas.width, stroke.points[i].y * canvas.height);
            }
            ctx.stroke();
        }
    }, []);

    useEffect(() => {
        let animationFrameId: number;
        const loop = () => {
            renderCanvas();
            animationFrameId = requestAnimationFrame(loop);
        };
        loop();
        return () => cancelAnimationFrame(animationFrameId);
    }, [renderCanvas]);


    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!canWrite && !isHost) return;
        e.preventDefault();
        const pos = getNormalizedPos(e);

        if (isErasing) {
            isDrawing.current = true;
            checkEraserHit(pos);
            return;
        }

        isDrawing.current = true;
        currentStroke.current = {
            id: `stroke_${socket?.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            points: [pos],
            color: color,
            width: width,
            userId: user?.email
        };
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        if (!isDrawing.current) return;
        const pos = getNormalizedPos(e);

        if (isErasing) {
            checkEraserHit(pos);
            return;
        }

        if (currentStroke.current) {
            currentStroke.current.points.push(pos);
        }
    };

    const stopDrawing = () => {
        if (!isDrawing.current) return;
        isDrawing.current = false;

        if (isErasing) {
            return;
        }

        const stroke = currentStroke.current;
        if (stroke) {

            strokesRef.current.push(stroke);
            currentStroke.current = null;

            socket?.emit('wb-event', {
                roomId,
                userId: user?.email,
                type: 'draw_stroke',
                data: stroke
            });
        }
    };

    const checkEraserHit = (pos: Point) => {
        const threshold = 0.02;
        const strokes = strokesRef.current;
        const idsToDelete: string[] = [];

        for (let i = strokes.length - 1; i >= 0; i--) {
            const stroke = strokes[i];
            for (const p of stroke.points) {
                const dist = Math.sqrt(Math.pow(p.x - pos.x, 2) + Math.pow(p.y - pos.y, 2));
                if (dist < threshold) {
                    idsToDelete.push(stroke.id);
                    break;
                }
            }
        }

        if (idsToDelete.length > 0) {
            strokesRef.current = strokesRef.current.filter(s => !idsToDelete.includes(s.id));

            idsToDelete.forEach(id => {
                socket?.emit('wb-event', {
                    roomId,
                    userId: user?.email,
                    type: 'erase_object',
                    data: { strokeId: id }
                });
            });
        }
    };

    const clearBoard = () => {
        if (socket) {
            socket.emit('wb-clear', { roomId });
            strokesRef.current = [];
        }
    };

    const saveAndClear = async () => {
        if (!socket || !isHost) return;
        setIsSaving(true);
        try {
            const data = JSON.stringify(strokesRef.current);
            const blob = new Blob([data], { type: 'application/json' });
            const file = new File([blob], `whiteboard_${new Date().toISOString()}.json`, { type: 'application/json' });

            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(`/api/rooms/${roomId}/materials`, {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                socket.emit('wb-clear', { roomId });
                socket.emit('refresh-materials', { roomId });
                alert('Whiteboard saved to Materials and cleared.');
            } else {
                alert('Failed to save whiteboard.');
            }
        } catch (e) {
            console.error(e);
            alert('Error saving whiteboard.');
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        if (!socket) return;

        const handleRemoteEvent = (event: { roomId: string; userId?: string; type: string; data: any }) => {
            if (event.roomId !== roomId) return;
            if (event.userId === user?.email) return;

            if (event.type === 'draw_stroke') {
                const stroke = event.data as Stroke;
                strokesRef.current.push(stroke);
            } else if (event.type === 'erase_object') {
                const { strokeId } = event.data;
                strokesRef.current = strokesRef.current.filter(s => s.id !== strokeId);
            }
        };

        const handleHistory = (logs: IWhiteboardLog[]) => {
            const newStrokes: Stroke[] = [];
            const deletedStrokeIds = new Set<string>();

            logs.forEach(log => {
                if (log.type === 'draw_stroke') {
                    newStrokes.push(log.data as unknown as Stroke);
                } else if (log.type === 'erase_object') {
                    const { strokeId } = log.data as any;
                    const index = newStrokes.findIndex(s => s.id === strokeId);
                    if (index !== -1) newStrokes.splice(index, 1);
                } else if (log.type === 'draw_line') {
                    const d = log.data as any;
                    newStrokes.push({
                        id: `legacy_${Math.random()}`,
                        points: [{ x: d.fromX, y: d.fromY }, { x: d.toX, y: d.toY }],
                        color: d.color,
                        width: d.width
                    });
                }
            });
            strokesRef.current = newStrokes;
        };

        const handleClear = () => {
            strokesRef.current = [];
        };

        socket.on('wb-event', handleRemoteEvent);
        socket.on('wb-history', handleHistory);
        socket.on('wb-clear', handleClear);

        socket.emit('wb-join', { roomId });

        return () => {
            socket.off('wb-event', handleRemoteEvent);
            socket.off('wb-history', handleHistory);
            socket.off('wb-clear', handleClear);
        };
    }, [socket, roomId, user]);

    useEffect(() => {
        const resize = () => {
            if (canvasRef.current) {
                const parent = canvasRef.current.parentElement;
                if (parent) {
                    canvasRef.current.width = parent.clientWidth;
                    canvasRef.current.height = parent.clientHeight;
                }
            }
        };
        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    return (
        <div className="absolute inset-0 bg-white z-50 flex flex-col">
            <div className="bg-gray-100 border-b p-2 flex gap-4 items-center justify-between">
                <div className="flex gap-2 items-center">
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => { setColor(e.target.value); setIsErasing(false); }}
                        className="w-8 h-8 cursor-pointer border-none p-0 bg-transparent"
                        title="Pen Color"
                    />
                    {isHost && (
                        <>
                            <button
                                onClick={() => setIsErasing(false)}
                                className={`px-3 py-1 rounded text-sm font-medium transition ${!isErasing ? 'bg-blue-600 text-white shadow-inner' : 'bg-white text-gray-700 hover:bg-gray-200'}`}
                            >
                                Pen
                            </button>
                            <button
                                onClick={() => setIsErasing(true)}
                                className={`px-3 py-1 rounded text-sm font-medium transition ${isErasing ? 'bg-blue-600 text-white shadow-inner' : 'bg-white text-gray-700 hover:bg-gray-200'}`}
                            >
                                Eraser
                            </button>
                        </>
                    )}
                    {!isErasing && (
                        <div className="flex items-center gap-2 border-l border-gray-300 pl-2">
                            <span className="text-xs text-gray-500">Size</span>
                            <input
                                type="range"
                                min="1" max="10"
                                value={width}
                                onChange={(e) => setWidth(Number(e.target.value))}
                                className="w-20"
                            />
                        </div>

                    )}
                </div>
                <div className="flex gap-2">
                    {!canWrite && !isHost && (
                        <span className="text-gray-500 text-sm font-medium self-center mr-2">(View Only)</span>
                    )}
                    {isHost && (
                        <button
                            onClick={saveAndClear}
                            disabled={isSaving}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : 'Save & Clear'}
                        </button>
                    )}
                    {isHost && (
                        <button onClick={clearBoard} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">Clear</button>
                    )}
                    <button onClick={onClose} className="bg-gray-800 hover:bg-gray-900 text-white px-3 py-1 rounded text-sm">Close</button>
                </div>
            </div>

            <div className="flex-1 relative cursor-crosshair touch-none bg-white">
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
