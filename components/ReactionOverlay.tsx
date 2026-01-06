'use client';
import { useEffect, useState } from 'react';

interface ReactionOverlayProps {
    lastReaction: { socketId: string, reaction: string, user?: any } | null;
}

export default function ReactionOverlay({ lastReaction }: ReactionOverlayProps) {
    const [visibleReactions, setVisibleReactions] = useState<{ id: number, emoji: string, left: number }[]>([]);

    useEffect(() => {
        if (lastReaction) {
            const id = Date.now();
            const left = Math.random() * 80 + 10; 

            setVisibleReactions(prev => [...prev, { id, emoji: lastReaction.reaction, left }]);


            setTimeout(() => {
                setVisibleReactions(prev => prev.filter(r => r.id !== id));
            }, 2000);
        }
    }, [lastReaction]);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
            {visibleReactions.map((r) => (
                <div
                    key={r.id}
                    className="absolute bottom-20 text-4xl animate-float-up opacity-0"
                    style={{ left: `${r.left}%` }}
                >
                    {r.emoji}
                </div>
            ))}
            <style jsx>{`
                @keyframes float-up {
                    0% { transform: translateY(0) scale(0.5); opacity: 0; }
                    10% { opacity: 1; transform: translateY(-20px) scale(1.2); }
                    100% { transform: translateY(-200px) scale(1); opacity: 0; }
                }
                .animate-float-up {
                    animation: float-up 2s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
