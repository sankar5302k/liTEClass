'use client';
import { useEffect, useState, use } from 'react';
import { useWebRTC } from '@/hooks/useWebRTC';
import ControlBar from '@/components/ControlBar';
import MaterialViewer from '@/components/MaterialViewer';
import AudioVisualizer from '@/components/AudioVisualizer';
import ChatRoom from '@/components/ChatRoom';
import ReactionOverlay from '@/components/ReactionOverlay';
import Whiteboard from '@/components/Whiteboard';

export default function RoomPage({ params }: { params: Promise<{ code: string }> }) {
    const resolvedParams = use(params);
    const { code } = resolvedParams;
    const { peers, participants, myStream, toggleMute, isMuted, endMeeting, socket, sendReaction, lastReaction } = useWebRTC(code);
    const [isHost, setIsHost] = useState(false);
    const [monitorSelf, setMonitorSelf] = useState(false);
    const [userName, setUserName] = useState<string>('Me');
    const [showWhiteboard, setShowWhiteboard] = useState(false);

    // Unified Sidebar state
    // Default to 'chat' on desktop for better engagement, closed on mobile
    const [activeTab, setActiveTab] = useState<'chat' | 'materials' | 'participants' | null>(null);

    useEffect(() => {
        // Auto-open chat on desktop on load if desired, or keep closed.
        // Let's check screen size.
        if (typeof window !== 'undefined' && window.innerWidth >= 768) {
            setActiveTab('chat');
        }
    }, []);

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
        setActiveTab('materials');
    };

    const toggleTab = (tab: 'chat' | 'materials' | 'participants') => {
        setActiveTab(prev => prev === tab ? null : tab);
    };

    return (
        <div className="flex flex-col h-screen bg-black text-white overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Header */}
            <header className="flex justify-between items-center px-4 md:px-6 py-3 md:py-4 border-b border-white/5 bg-gray-950/50 backdrop-blur-md z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">LiteClass</h1>
                </div>
                <div className="flex items-center gap-3 bg-white/5 px-3 py-1 md:py-1.5 rounded-full border border-white/5">
                    <span className="text-gray-400 text-[10px] md:text-xs uppercase tracking-wider font-semibold">Code</span>
                    <span className="font-mono text-sm md:text-base text-white tracking-widest">{code}</span>
                    <button
                        onClick={() => navigator.clipboard.writeText(code)}
                        className="ml-2 text-gray-400 hover:text-white transition"
                        title="Copy Code"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 md:w-4 md:h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                        </svg>
                    </button>
                </div>
                {/* Desktop Sidebar Toggle */}
                <button
                    onClick={() => setActiveTab(prev => prev ? null : 'chat')}
                    className={`hidden md:flex p-2 rounded-lg transition border ${activeTab ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'}`}
                    title="Toggle Sidebar"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Main Content Area (Video Grid) */}
                <div className={`flex-1 flex flex-col relative transition-all duration-300 ${activeTab && window.innerWidth >= 768 ? 'mr-0' : ''}`}>
                    <div className="absolute top-4 left-4 z-20">
                        <div className="flex items-center gap-2 bg-gray-900/80 backdrop-blur px-3 py-2 rounded-lg border border-white/10 hover:border-white/20 transition cursor-pointer group" onClick={() => setMonitorSelf(!monitorSelf)}>
                            <div className={`w-3 h-3 rounded-full ${monitorSelf ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-600'}`} />
                            <span className="text-xs text-gray-300 font-medium group-hover:text-white transition">Mic Test</span>
                        </div>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto flex flex-col items-center justify-center gap-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-800">
                        {/* Video Grid */}
                        <div className="flex flex-wrap content-center items-center justify-center gap-4 w-full">
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
                        </div>

                        {peers.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-8 text-center opacity-70 mt-4 md:mt-8 bg-gray-900/50 rounded-2xl border border-white/5 backdrop-blur-sm max-w-sm mx-auto">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 animate-pulse">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-400">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-200">Waiting for participants</h3>
                                <p className="text-sm text-gray-400 mt-2">Share the room code to invite others.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Unified Sidebar */}
                {/* Mobile: Fixed overlay. Desktop: Static sidebar */}
                {activeTab && (
                    <div className="fixed inset-0 z-40 md:static md:z-0 w-full md:w-[380px] lg:w-[420px] flex flex-col bg-gray-900 md:border-l md:border-white/5 shadow-2xl transition-all duration-300 animate-in slide-in-from-right-10 md:animate-none">

                        {/* Sidebar Header / Tabs */}
                        <div className="flex items-center gap-1 p-2 border-b border-white/5 bg-gray-900/95 shrink-0 pt-16 md:pt-2"> {/* Mobile padding top for header */}
                            {[
                                { id: 'chat', label: 'Chat', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg> },
                                { id: 'participants', label: `People ${participants.length > 0 ? `(${participants.length})` : ''}`, icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg> },
                                { id: 'materials', label: 'Materials', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg> },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs md:text-sm font-medium rounded-lg transition-all ${activeTab === tab.id
                                        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {tab.icon}
                                    <span>{tab.label}</span>
                                </button>
                            ))}

                            <button
                                onClick={() => setActiveTab(null)}
                                className="p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 ml-1 md:hidden"
                                title="Close Sidebar"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setActiveTab(null)}
                                className="p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 ml-1 hidden md:block"
                                title="Close Sidebar"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Sidebar Content */}
                        <div className="flex-1 overflow-hidden relative bg-gray-900">
                            {/* Materials Tab */}
                            <div className={`absolute inset-0 flex flex-col transition-opacity duration-300 ${activeTab === 'materials' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                                <MaterialViewer roomId={code} socket={socket} />
                                <div className="h-24 md:hidden shrink-0" />
                            </div>

                            {/* Chat Tab */}
                            <div className={`absolute inset-0 flex flex-col transition-opacity duration-300 ${activeTab === 'chat' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                                <ChatRoom roomId={code} socket={socket} userName={userName} />
                                {/* Padding for ControlBar on Mobile */}
                                <div className="h-24 md:hidden shrink-0" />
                            </div>

                            {/* Participants Tab */}
                            <div className={`absolute inset-0 overflow-y-auto p-0 transition-opacity duration-300 ${activeTab === 'participants' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                                <div className="p-4">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 px-2">Participants</h3>
                                    <ul className="space-y-1">
                                        {participants.map((p) => (
                                            <li key={p.socketId} className="flex items-center justify-between group p-2 hover:bg-white/5 rounded-xl transition">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-sm font-bold text-white shadow-inner border border-white/5 overflow-hidden">
                                                            {p.user?.picture ?
                                                                <img src={p.user.picture} alt={p.user.name} className="w-full h-full object-cover" />
                                                                : p.user?.name?.[0]?.toUpperCase()
                                                            }
                                                        </div>
                                                        {/* Status Indicator */}
                                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-gray-900 rounded-full ${p.socketId === socket?.id ? 'bg-green-500' : 'bg-green-500/50'}`}></div>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-gray-200 flex items-center gap-2">
                                                            {p.user?.name || 'Unknown'}
                                                            {p.isHost && <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">HOST</span>}
                                                            {p.socketId === socket?.id && <span className="text-[10px] text-gray-500">(You)</span>}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {p.isMuted && 'Muted'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {p.isMuted ? (
                                                        <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                                <path d="M9.383 3.076A1 1 0 0 1 10 4v12a1 1 0 0 1-1.707.707L4.586 13H2a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h2.586l3.707-3.707a1 1 0 0 1 1.09-.217ZM14.657 2.929a1 1 0 0 1 1.414 0A9.972 9.972 0 0 1 19 10a9.972 9.972 0 0 1-2.929 7.071 1 1 0 0 1-1.414-1.414A7.971 7.971 0 0 0 17 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 0 1 0-1.414Zm-2.829 2.828a1 1 0 0 1 1.415 0A5.983 5.983 0 0 1 15 10a5.984 5.984 0 0 1-1.757 4.243 1 1 0 0 1-1.415-1.415A3.984 3.984 0 0 0 13 10a3.983 3.983 0 0 0-1.172-2.828 1 1 0 0 1 0-1.415Z" />
                                                            </svg>
                                                        </div>
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center animate-pulse">
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                                <path d="M10 2a6 6 0 0 0-6 6v3.586l-.707.707A1 1 0 0 0 4 14h12a1 1 0 0 0 .707-1.707L16 11.586V8a6 6 0 0 0-6-6Z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="h-24 md:hidden shrink-0" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ReactionOverlay lastReaction={lastReaction} />

            {showWhiteboard && (
                <div className="fixed inset-0 z-50 md:static md:inset-auto md:w-1/3 md:border-l md:border-gray-800 md:flex flex-col bg-white text-black">
                    {/* Close button for whiteboard if full screen */}
                    <div className="md:hidden absolute top-4 right-4 z-50">
                        <button onClick={() => setShowWhiteboard(false)} className="p-2 bg-black/10 rounded-full hover:bg-black/20 transition">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <Whiteboard
                        roomId={code}
                        socket={socket}
                        user={{ email: socket?.id, name: userName }}
                        onClose={() => setShowWhiteboard(false)}
                        isHost={isHost}
                    />
                </div>
            )}

            {showWhiteboard && <div className="fixed inset-0 z-[45] bg-black/50 md:hidden" onClick={() => setShowWhiteboard(false)} />}


            {/* Control Bar Spacer for Desktop (Mobile handles padding via Sidebar padding) */}
            <div className={`h-20 md:h-24 shrink-0 bg-transparent ${activeTab ? 'hidden md:block' : 'block'}`} />

            <ControlBar
                isMuted={isMuted}
                toggleMute={toggleMute}
                isHost={isHost}
                endMeeting={endMeeting}
                roomId={code}
                onMaterialUploaded={handleMaterialUploaded}
                onToggleChat={() => toggleTab('chat')}
                onToggleParticipants={() => toggleTab('participants')}
                onSendReaction={sendReaction}
                onToggleWhiteboard={() => setShowWhiteboard(prev => !prev)}
            />
        </div>
    );
}
