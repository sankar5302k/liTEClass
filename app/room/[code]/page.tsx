'use client';
import { useEffect, useState, use } from 'react';
import { useWebRTC } from '@/hooks/useWebRTC';
import ControlBar from '@/components/ControlBar';
import MaterialViewer from '@/components/MaterialViewer';
import AudioVisualizer from '@/components/AudioVisualizer';

export default function RoomPage({ params }: { params: Promise<{ code: string }> }) {
    const resolvedParams = use(params);
    const { code } = resolvedParams;
    const { peers, myStream, toggleMute, isMuted, endMeeting, socket } = useWebRTC(code);
    const [isHost, setIsHost] = useState(false);
    const [monitorSelf, setMonitorSelf] = useState(false);

    useEffect(() => {
        const storedHostId = localStorage.getItem('hostId');
        setIsHost(!!storedHostId);
    }, []);

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

                {/* Audio Grid */}
                <div className="flex-1 p-4 pt-16 overflow-y-auto flex flex-wrap content-start items-start justify-center gap-4">
                    {/* Self */}
                    <AudioVisualizer
                        stream={myStream || undefined}
                        isMuted={isMuted}
                        label="You"
                        isSelf={true}
                        forceEnableAudio={monitorSelf}
                    />

                    {/* Peers */}
                    {peers.map((peer) => (
                        <AudioVisualizer
                            key={peer.id}
                            stream={peer.stream}
                            isMuted={false}
                            label={`Peer ${peer.id.slice(0, 4)}`}
                        />
                    ))}

                    {peers.length === 0 && (
                        <div className="w-full text-center mt-20 text-gray-600">
                            <p>Waiting for others to join...</p>
                            <p className="text-sm mt-2">Share the code: <span className="font-mono text-gray-400">{code}</span></p>
                        </div>
                    )}
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
