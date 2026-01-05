import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
    stream?: MediaStream;
    isMuted?: boolean;
    label: string;
    isSelf?: boolean;
    forceEnableAudio?: boolean;
}

export default function AudioVisualizer({ stream, isMuted, label, isSelf, forceEnableAudio }: AudioVisualizerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (audioRef.current && stream) {
            // Log for debugging
            console.log(`[AudioVisualizer] Setting stream for ${label}. Tracks:`, stream.getAudioTracks().length);
            stream.getAudioTracks().forEach(t => console.log(`Track ${t.id}: enabled=${t.enabled}, muted=${t.muted}, readyState=${t.readyState}`));

            if (!isSelf || forceEnableAudio) {
                console.log(`[AudioVisualizer] Attaching stream to audio element for ${label}`);
                audioRef.current.srcObject = stream;

                // Explicitly call play to handle AutoPlay restrictions
                audioRef.current.play().catch(e => console.error("Error playing audio:", e));
            } else {
                audioRef.current.srcObject = null;
            }
        }
    }, [stream, isSelf, forceEnableAudio, label]);

    return (
        <div className={`flex flex-col items-center justify-center p-4 m-2 bg-gray-800 rounded-lg w-32 h-32 relative ${isSelf ? 'border-2 border-blue-500' : ''}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-600' : 'bg-green-700 animate-pulse'}`}>
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
                    <span className="text-2xl font-bold text-white uppercase">{label.charAt(0)}</span>
                )}
            </div>
            <span className="mt-2 text-sm text-gray-300 truncate w-full text-center">{label}</span>
            {isMuted && <span className="absolute top-2 right-2 text-red-500 text-xs">Muted</span>}
            <audio
                ref={audioRef}
                autoPlay
                playsInline
                // Don't use muted attribute if monitoring is on.
                // If isSelf AND !forceEnableAudio, we just don't set srcObject above, so safe.
                muted={isSelf && !forceEnableAudio}
            />
        </div >
    );
}
