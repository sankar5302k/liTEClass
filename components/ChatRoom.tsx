import { useEffect, useState, useRef } from 'react';
import { Socket } from 'socket.io-client';

interface Message {
    id: string;
    sender: string;
    text: string;
    time: string;
    isSelf: boolean;
}

interface ChatRoomProps {
    roomId: string;
    socket: Socket | null;
    userName: string;
}

export default function ChatRoom({ roomId, socket, userName }: ChatRoomProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!socket) return;

        socket.on('receive-message', (message: Message) => {
            setMessages((prev) => [...prev, { ...message, isSelf: message.sender === userName }]);
        });

        return () => {
            socket.off('receive-message');
        };
    }, [socket, userName]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !socket) return;

        const messageData = {
            roomId,
            text: input,
            sender: userName,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            id: Date.now().toString(),
        };


        setMessages((prev) => [...prev, { ...messageData, isSelf: true }]);

        socket.emit('send-message', messageData);
        setInput('');
    };

    return (
        <div className="flex flex-col h-full bg-gray-900/50 backdrop-blur-sm">
            {/* Header - Optional if covered by tabs, but good to have context */}
            <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Live Chat</h3>
                <span className="text-xs text-gray-500">{messages.length} messages</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 mb-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                        </svg>
                        <p className="text-sm">No messages yet. Say hi!</p>
                    </div>
                )}
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm ${msg.isSelf
                            ? 'bg-blue-600 text-white rounded-br-none bg-gradient-to-br from-blue-500 to-blue-700 border border-blue-400/20'
                            : 'bg-gray-700/80 text-gray-200 rounded-bl-none border border-white/5 backdrop-blur-sm'
                            }`}>
                            {!msg.isSelf && <p className="text-[10px] text-blue-300 font-bold mb-1 uppercase tracking-wide">{msg.sender}</p>}
                            <p className="leading-relaxed">{msg.text}</p>
                        </div>
                        <span className="text-[10px] text-gray-500 mt-1 px-1">{msg.time}</span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-white/10 bg-gray-900/80 backdrop-blur-md">
                <form onSubmit={sendMessage} className="flex gap-2 items-center relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full bg-gray-800/50 border border-gray-700/50 text-white rounded-full pl-5 pr-12 py-3 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-gray-800 transition-all shadow-inner placeholder:text-gray-500"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full transition-all disabled:opacity-0 disabled:scale-75 shadow-lg shadow-blue-500/20"
                            disabled={!input.trim()}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 transform rotate-0 mt-0.5 ml-0.5">
                                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                            </svg>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
