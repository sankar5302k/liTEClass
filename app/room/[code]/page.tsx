'use client';
import { useEffect, useState, use } from 'react';
import { useWebRTC } from '@/hooks/useWebRTC';
import ControlBar from '@/components/ControlBar';
import MaterialViewer from '@/components/MaterialViewer';
import AudioVisualizer from '@/components/AudioVisualizer';
import ChatRoom from '@/components/ChatRoom';
import ReactionOverlay from '@/components/ReactionOverlay';
import Whiteboard from '@/components/Whiteboard';
import { useRef } from 'react';

export default function RoomPage({ params }: { params: Promise<{ code: string }> }) {
    const resolvedParams = use(params);
    const { code } = resolvedParams;
    const { peers, participants, myStream, toggleMute, isMuted, endMeeting, socket, sendReaction, lastReaction } = useWebRTC(code);
    const [isHost, setIsHost] = useState(false);
    const [monitorSelf, setMonitorSelf] = useState(false);
    const [userName, setUserName] = useState<string>('Me');
    const [mobileTab, setMobileTab] = useState<'chat' | 'participants' | null>(null);
    const [showWhiteboard, setShowWhiteboard] = useState(false);

    useEffect(() => {
        if (socket && participants.length > 0) {
            const me = participants.find(p => p.socketId === socket.id);
            if (me) {
                setIsHost(me.isHost);
                setUserName(me.user?.name || 'Me');
            }
        }
    }, [participants, socket]);

    const handleMaterialUploaded = () => {
        socket?.emit('refresh-materials', { roomId: code });
    };

    return (
        <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
            <header className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-900">
                <h1 className="text-xl font-bold text-blue-400">LiteClass</h1>
                <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Room Code:</span>
                    <span className="font-mono text-lg bg-gray-800 px-3 py-1 rounded tracking-widest text-white border border-gray-700">
                        {code}
                    </span>
                </div>
            </header>


            <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
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

                <div className="flex-1 p-4 pt-16 overflow-y-auto flex gap-4">
                    <div className="flex-1 flex flex-wrap content-start items-start justify-center gap-4">
                        <AudioVisualizer
                            stream={myStream || undefined}
                            isMuted={isMuted}
                            label="You"
                            isSelf={true}
                            forceEnableAudio={monitorSelf}
                        />

                        {peers.map((peer) => {
                            // @ts-ignore
                            const participantInfo = participants.find(p => p.socketId === peer.id);
                            const peerName = participantInfo?.user?.name || (peer as any).user?.name || `Peer ${peer.id.slice(0, 4)}`;
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

                    <div className={`${mobileTab === 'participants' ? 'fixed inset-0 z-50 bg-gray-900 p-4' : 'hidden md:block w-64 bg-gray-800 rounded-lg p-4 border border-gray-700 h-fit'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-200">Participants</h3>
                            <button
                                onClick={() => setMobileTab(null)}
                                className="md:hidden text-gray-400 hover:text-white"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <ul className="space-y-2">
                            {participants && participants.map((p) => (
                                <li key={p.socketId} className="flex items-center gap-2 text-sm text-gray-300">
                                    <div className="w-8 h-8 rounded-full bg-gray-600 overflow-hidden">
                                        {p.user?.picture ? <img src={p.user.picture} alt={p.user.name} referrerPolicy="no-referrer" /> : <div className="w-full h-full flex items-center justify-center text-xs">{p.user?.name?.[0]}</div>}
                                    </div>
                                    <span>{p.user?.name || 'Unknown'}</span>
                                    {p.isHost && <span className="text-xs bg-blue-900 text-blue-200 px-1 rounded">Host</span>}
                                    {p.isMuted && <span className="text-xs text-red-400 bg-red-900/30 px-1 rounded border border-red-900">Muted</span>}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>


                <div className={`${mobileTab === 'chat' ? 'fixed inset-0 z-50 bg-gray-900 flex flex-col' : 'hidden md:flex w-full md:w-1/3 flex-col bg-gray-900 border-l border-gray-800 h-full'}`}>
                    <div className="md:hidden flex justify-between items-center p-4 border-b border-gray-800 bg-gray-850">
                        <h3 className="text-lg font-semibold text-white">Materials & Chat</h3>
                        <button
                            onClick={() => setMobileTab(null)}
                            className="text-gray-400 hover:text-white"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-hidden h-1/2">
                        <MaterialViewer roomId={code} socket={socket} />
                    </div>
                    <div className="flex-1 overflow-hidden h-1/2 border-t border-gray-800">
                        <ChatRoom roomId={code} socket={socket} userName={userName} />
                    </div>
                </div>
            </div>

            <ReactionOverlay lastReaction={lastReaction} />

            {showWhiteboard && (
                <div className="fixed inset-0 z-40 md:static md:inset-auto md:w-1/3 md:border-l md:border-gray-800 md:flex flex-col bg-white text-black">

                    <Whiteboard
                        roomId={code}
                        socket={socket}
                        user={{ email: socket?.id, name: userName }} 
                        onClose={() => setShowWhiteboard(false)}
                        isHost={isHost}
                    />
                </div>
            )}

            {showWhiteboard && <div className="fixed inset-0 z-[39] bg-black/50 md:hidden" onClick={() => setShowWhiteboard(false)} />}


            <div className="h-20"> </div>
            <ControlBar
                isMuted={isMuted}
                toggleMute={toggleMute}
                isHost={isHost}
                endMeeting={endMeeting}
                roomId={code}
                onMaterialUploaded={handleMaterialUploaded}
                onToggleChat={() => setMobileTab(prev => prev === 'chat' ? null : 'chat')}
                onToggleParticipants={() => setMobileTab(prev => prev === 'participants' ? null : 'participants')}
                onSendReaction={sendReaction}
                onToggleWhiteboard={() => setShowWhiteboard(prev => !prev)}
            />
        </div>
    );
}
