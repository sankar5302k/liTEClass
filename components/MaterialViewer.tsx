import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

interface Material {
    _id: string;
    filename: string;
    size: number;
}

interface MaterialViewerProps {
    roomId: string;
    socket: Socket | null;
}

export default function MaterialViewer({ roomId, socket }: MaterialViewerProps) {
    const [materials, setMaterials] = useState<Material[]>([]);

    const fetchMaterials = async () => {
        try {
            const res = await fetch(`/api/rooms/${roomId}/materials`);
            if (res.ok) {
                const data = await res.json();
                setMaterials(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchMaterials();

        socket?.on('materials-updated', () => {
            fetchMaterials();
        });

        return () => {
            socket?.off('materials-updated');
        };
    }, [roomId, socket]);

    return (
        <div className="w-full h-full bg-gray-900 p-4 overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-white">Classroom Materials</h3>
            {materials.length === 0 ? (
                <p className="text-gray-500 italic">No materials uploaded yet.</p>
            ) : (
                <ul className="space-y-3">
                    {materials.map((m) => (
                        <li key={m._id} className="bg-gray-800 rounded p-3 hover:bg-gray-750 transition flex justify-between items-center">
                            <span className="text-gray-200 truncate pr-2" title={m.filename}>{m.filename}</span>
                            <a
                                href={`/api/rooms/${roomId}/materials/${m._id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                                View
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
