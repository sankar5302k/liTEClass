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
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-2 md:p-4 flex justify-between items-center text-white z-50">
            {/* Reactions Popover */}
            {showReactions && (
                <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 flex gap-2 shadow-xl animate-scale-up origin-bottom">
                    {reactions.map(emoji => (
                        <button
                            key={emoji}
                            onClick={() => {
                                onSendReaction(emoji);
                                setShowReactions(false);
                            }}
                            className="text-2xl hover:scale-125 transition transform"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex gap-4">
                <button
                    onClick={toggleMute}
                    className={`p-3 rounded-full ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    {isMuted ? (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-8 h-8 text-white"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 10.5V6a3 3 0 10-6 0v4.5M19.5 10.5a7.5 7.5 0 01-15 0M12 18v3m0 0h3m-3 0H9"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 3l18 18"
                            />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Center Controls */}
            <div className="hidden md:flex gap-4 absolute left-1/2 transform -translate-x-1/2">
                <button
                    onClick={onToggleWhiteboard}
                    className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white"
                    title="Whiteboard"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
                    </svg>
                </button>

                <button
                    onClick={() => setShowReactions(!showReactions)}
                    className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white relative"
                    title="Reactions"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
                    </svg>
                </button>
            </div>

            {/* Mobile Toggles */}
            <div className="flex gap-2 md:gap-4 md:hidden">
                <button
                    onClick={onToggleWhiteboard}
                    className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
                    </svg>
                </button>
                <button
                    onClick={() => setShowReactions(!showReactions)}
                    className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
                    </svg>
                </button>
                <button
                    onClick={onToggleParticipants}
                    className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                    </svg>
                </button>
                <button
                    onClick={onToggleChat}
                    className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                    </svg>
                </button>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                {isHost && (
                    <>
                        <div className="relative flex items-center">
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
                                className={`cursor-pointer px-3 md:px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-xs md:text-sm font-medium transition flex items-center justify-center ${uploading ? 'opacity-50' : ''}`}
                            >
                                {uploading ? '...' : <><span className="md:hidden">Share</span><span className="hidden md:inline">Share Material</span></>}
                            </label>
                        </div>

                        <button
                            onClick={endMeeting}
                            className="px-3 md:px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-xs md:text-sm font-medium transition flex items-center"
                        >
                            <span className="md:hidden">End</span><span className="hidden md:inline">End Meeting</span>
                        </button>
                    </>
                )}
                {!isHost && (
                    <a href="/" className="px-3 md:px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-xs md:text-sm font-medium transition">
                        Leave
                    </a>
                )}
            </div>
        </div>
    );
}
