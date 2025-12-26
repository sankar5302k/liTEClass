import { useState, useRef } from 'react';

interface ControlBarProps {
    isMuted: boolean;
    toggleMute: () => void;
    isHost: boolean;
    endMeeting: () => void;
    roomId: string;
    onMaterialUploaded: () => void;
}

export default function ControlBar({ isMuted, toggleMute, isHost, endMeeting, roomId, onMaterialUploaded }: ControlBarProps) {
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

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 flex justify-between items-center text-white">
            <div className="flex gap-4">
                <button
                    onClick={toggleMute}
                    className={`p-3 rounded-full ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    {isMuted ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.75-4.75 6.91-6.91L21 3m-18 18 18-18" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                        </svg>
                    )}
                </button>
            </div>

            <div className="flex gap-4">
                {isHost && (
                    <>
                        <div className="relative">
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
                                className={`cursor-pointer px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-sm font-medium ${uploading ? 'opacity-50' : ''}`}
                            >
                                {uploading ? 'Uploading...' : 'Share Material'}
                            </label>
                        </div>

                        <button
                            onClick={endMeeting}
                            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-sm font-medium"
                        >
                            End Meeting
                        </button>
                    </>
                )}
                {!isHost && (
                    <a href="/" className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm font-medium">
                        Leave
                    </a>
                )}
            </div>
        </div>
    );
}
