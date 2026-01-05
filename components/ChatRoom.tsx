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

        // Optimistic update
        setMessages((prev) => [...prev, { ...messageData, isSelf: true }]);

        socket.emit('send-message', messageData);
        setInput('');
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 border-l border-gray-800">
            <div className="p-3 border-b border-gray-800 bg-gray-850">
                <h3 className="text-lg font-semibold text-white">Chat</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${msg.isSelf
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-gray-700 text-gray-200 rounded-bl-none'
                            }`}>
                            {!msg.isSelf && <p className="text-xs text-blue-300 font-bold mb-1">{msg.sender}</p>}
                            <p>{msg.text}</p>
                        </div>
                        <span className="text-[10px] text-gray-500 mt-1">{msg.time}</span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-3 border-t border-gray-800 bg-gray-900">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition disabled:opacity-50"
                        disabled={!input.trim()}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    );
}
