import { useState, useRef } from 'react';

interface ControlBarProps {
    isMuted: boolean;
    toggleMute: () => void;
    isHost: boolean;
    endMeeting: () => void;
    roomId: string;
    onMaterialUploaded: () => void;
    onToggleChat: () => void;
    onToggleParticipants: () => void;
    onSendReaction: (emoji: string) => void;
    onToggleWhiteboard: () => void;
}

export default function ControlBar({ isMuted, toggleMute, isHost, endMeeting, roomId, onMaterialUploaded, onToggleChat, onToggleParticipants, onSendReaction, onToggleWhiteboard }: ControlBarProps) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('hostId', localStorage.getItem('hostId') || '');

        try {
            const res = await fetch(`/api/rooms/${roomId}/materials`, {
                method: 'POST',
                body: formData,
            });
            if (res.ok) {
                onMaterialUploaded();
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
                alert('Upload failed');
            }
        } catch (err) {
            console.error(err);
            alert('Upload error');
        } finally {
            setUploading(false);
        }
    };

    const [showReactions, setShowReactions] = useState(false);
    const reactions = ['👍', '👏', '🎉', '😂', '😮', '😢', '❤️'];

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:bottom-8 bg-black/90 md:bg-gray-900/60 backdrop-blur-2xl border border-white/10 md:border-white/10 rounded-3xl p-2 md:px-6 md:py-3 flex justify-between md:gap-8 items-center text-white z-[60] shadow-2xl transition-all duration-300 ring-1 ring-white/5">

            {showReactions && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 flex gap-2 shadow-2xl animate-in slide-in-from-bottom-2 fade-in duration-200 z-[70]">
                    {reactions.map(emoji => (
                        <button
                            key={emoji}
                            onClick={() => {
                                onSendReaction(emoji);
                                setShowReactions(false);
                            }}
                            className="text-2xl hover:scale-125 transition transform active:scale-95 p-1"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}

            {/* Mobile: Left Audio Toggle (contents to be part of main flex) */}
            <div className="contents md:hidden">
                <button
                    onClick={toggleMute}
                    className={`p-2 rounded-xl transition-all duration-200 ${isMuted ? 'bg-red-500/80 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 hover:bg-white/10 text-white'}`}
                >
                    {isMuted ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Desktop: Audio Toggle */}
            <div className="hidden md:block">
                <button
                    onClick={toggleMute}
                    className={`p-4 rounded-full transition-all duration-200 ${isMuted ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30' : 'bg-gray-700/50 hover:bg-gray-700 border border-white/5'}`}
                    title={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                        </svg>
                    )}
                </button>
            </div>


            {/* Center Controls */}
            <div className="contents md:flex md:gap-4 md:items-center">
                <button
                    onClick={onToggleWhiteboard}
                    className="p-2 md:p-4 rounded-xl md:rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors border border-transparent hover:border-white/10"
                    title="Whiteboard"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-6 md:h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
                    </svg>
                </button>

                <button
                    onClick={() => setShowReactions(!showReactions)}
                    className={`p-2 md:p-4 rounded-xl md:rounded-full transition-colors border border-transparent hover:border-white/10 ${showReactions ? 'bg-blue-600/20 text-blue-400' : 'bg-white/5 hover:bg-white/10 text-white'}`}
                    title="Reactions"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-6 md:h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
                    </svg>
                </button>

                <button
                    onClick={onToggleParticipants}
                    className="p-2 md:p-4 rounded-xl md:rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors border border-transparent hover:border-white/10 md:hidden"
                    title="Participants"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                    </svg>
                </button>

                <button
                    onClick={onToggleChat}
                    className="p-2 md:p-4 rounded-xl md:rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors border border-transparent hover:border-white/10 md:hidden block relative"
                    title="Chat"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                    </svg>
                </button>
            </div>

            {/* Right Group / Host Controls */}
            <div className="contents md:flex md:items-center md:gap-3">
                {isHost && (
                    <>
                        <div className="contents md:relative md:flex md:items-center">
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                onChange={handleUpload}
                                ref={fileInputRef}
                                disabled={uploading}
                            />
                            <label
                                htmlFor="file-upload"
                                className={`cursor-pointer w-8 h-8 md:w-auto md:h-auto md:px-5 md:py-2.5 rounded-xl md:rounded-full bg-blue-600/90 hover:bg-blue-600 text-white text-sm font-semibold transition flex items-center justify-center border border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 ${uploading ? 'opacity-50' : ''}`}
                                title="Share Material"
                            >
                                {uploading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:mr-2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                        </svg>
                                        <span className="hidden md:inline">Share</span>
                                    </>
                                )}
                            </label>
                        </div>

                        <button
                            onClick={endMeeting}
                            className="w-8 h-8 md:w-auto md:h-auto md:px-5 md:py-2.5 rounded-xl md:rounded-full bg-red-600/90 hover:bg-red-600 text-white text-sm font-semibold transition flex items-center justify-center border border-red-500/50 hover:shadow-lg hover:shadow-red-500/20"
                            title="End Meeting"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:mr-2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9" />
                            </svg>
                            <span className="hidden md:inline">End</span>
                        </button>
                    </>
                )}
                {!isHost && (
                    <a href="/" className="px-4 py-2 rounded-full bg-gray-700/80 hover:bg-gray-600 text-xs font-semibold transition border border-white/5 hover:border-white/10 md:px-5 md:py-2.5 md:text-sm">
                        Leave
                    </a>
                )}
            </div>
        </div>
    );
}
