'use client';
import { useEffect, useState, use } from 'react';
import { useWebRTC } from '@/hooks/useWebRTC';
import ControlBar from '@/components/ControlBar';
import MaterialViewer from '@/components/MaterialViewer';
import AudioVisualizer from '@/components/AudioVisualizer';

export default function RoomPage({ params }: { params: Promise<{ code: string }> }) {
    const resolvedParams = use(params);
    const { code } = resolvedParams;
    const { peers, participants, myStream, toggleMute, isMuted, endMeeting, socket } = useWebRTC(code);
    const [isHost, setIsHost] = useState(false);
    const [monitorSelf, setMonitorSelf] = useState(false);

    useEffect(() => {
        if (socket && participants.length > 0) {
            const me = participants.find(p => p.socketId === socket.id);
            if (me) {
                setIsHost(me.isHost);
            }
        }
    }, [participants, socket]);

    const handleMaterialUploaded = () => {
        socket?.emit('refresh-materials', { roomId: code });
    };

    return (
        <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
            {/* Header */}
            <header className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-900">
                <h1 className="text-xl font-bold text-blue-400">LiteClass</h1>
                <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Room Code:</span>
                    <span className="font-mono text-lg bg-gray-800 px-3 py-1 rounded tracking-widest text-white border border-gray-700">
                        {code}
                    </span>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Mic Test Controls */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                    <div className="flex items-center gap-2 bg-gray-800 p-2 rounded opacity-80 hover:opacity-100 transition border border-gray-700">
                        <input
                            type="checkbox"
                            id="hear-myself"
                            checked={monitorSelf}
                            onChange={(e) => setMonitorSelf(e.target.checked)}
                            className="w-4 h-4 cursor-pointer"
                        />
                        <label htmlFor="hear-myself" className="text-xs text-gray-300 cursor-pointer select-none font-medium">
                            Hear Myself (Test)
                        </label>
                    </div>
                </div>

                {/* Audio Grid and Participants */}
                <div className="flex-1 p-4 pt-16 overflow-y-auto flex gap-4">
                    <div className="flex-1 flex flex-wrap content-start items-start justify-center gap-4">
                        {/* Self */}
                        <AudioVisualizer
                            stream={myStream || undefined}
                            isMuted={isMuted}
                            label="You"
                            isSelf={true}
                            forceEnableAudio={monitorSelf}
                        />

                        {/* Peers */}
                        {peers.map((peer) => {
                            // Find user info for this peer
                            // We don't have direct mapping in 'peer' object yet unless we added it in useWebRTC 'user-connected'
                            // But we passed 'user' to peers state in useWebRTC.
                            // @ts-ignore
                            const peerName = peer.user?.name || `Peer ${peer.id.slice(0, 4)}`;
                            return (
                                <AudioVisualizer
                                    key={peer.id}
                                    stream={peer.stream}
                                    isMuted={peer.isMuted}
                                    label={peerName}
                                />
                            );
                        })}

                        {peers.length === 0 && (
                            <div className="w-full text-center mt-20 text-gray-600">
                                <p>Waiting for others to join...</p>
                                <p className="text-sm mt-2">Share the code: <span className="font-mono text-gray-400">{code}</span></p>
                            </div>
                        )}
                    </div>

                    {/* Participants Sidebar */}
                    <div className="w-64 bg-gray-800 rounded-lg p-4 border border-gray-700 hidden md:block">
                        <h3 className="text-lg font-semibold mb-4 text-gray-200">Participants</h3>
                        <ul className="space-y-2">
                            {/* @ts-ignore */}
                            {participants && participants.map((p) => (
                                <li key={p.socketId} className="flex items-center gap-2 text-sm text-gray-300">
                                    <div className="w-8 h-8 rounded-full bg-gray-600 overflow-hidden">
                                        {p.user?.picture ? <img src={p.user.picture} alt={p.user.name} /> : <div className="w-full h-full flex items-center justify-center text-xs">{p.user?.name?.[0]}</div>}
                                    </div>
                                    <span>{p.user?.name || 'Unknown'}</span>
                                    {p.isHost && <span className="text-xs bg-blue-900 text-blue-200 px-1 rounded">Host</span>}
                                    {p.isMuted && <span className="text-xs text-red-400 bg-red-900/30 px-1 rounded border border-red-900">Muted</span>}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Sidebar */}
                <MaterialViewer roomId={code} socket={socket} />
            </div>

            {/* Control Bar */}
            <div className="h-20"> {/* Spacer */} </div>
            <ControlBar
                isMuted={isMuted}
                toggleMute={toggleMute}
                isHost={isHost}
                endMeeting={endMeeting}
                roomId={code}
                onMaterialUploaded={handleMaterialUploaded}
            />
        </div>
    );
}
