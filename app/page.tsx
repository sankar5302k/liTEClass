'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const createRoom = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/rooms', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        // Store hostId
        localStorage.setItem('hostId', data.hostId);
        router.push(`/room/${data.code}`);
      } else {
        alert('Failed to create room');
      }
    } catch (e) {
      console.error(e);
      alert('Error creating room');
    } finally {
      setCreating(false);
    }
  };

  const joinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode) return;
    setJoining(true);
    try {
      const res = await fetch(`/api/rooms/${joinCode}`);
      if (res.ok) {
        // Clear hostId if any, as we are joining as student
        localStorage.removeItem('hostId');
        router.push(`/room/${joinCode}`);
      } else {
        alert('Room not found or inactive');
      }
    } catch (e) {
      alert('Error joining room');
    } finally {
      setJoining(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4">
      <div className="w-full max-w-md p-8 bg-gray-900 rounded-lg shadow-xl border border-gray-800">
        <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          LiteClass
        </h1>

        <div className="space-y-6">
          <div>
            <button
              onClick={createRoom}
              disabled={creating}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create New Room'}
            </button>
            <p className="text-center text-sm text-gray-500 mt-2">Start a session as Host</p>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="flex-shrink mx-4 text-gray-400">OR</span>
            <div className="flex-grow border-t border-gray-700"></div>
          </div>

          <form onSubmit={joinRoom} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-400 mb-1">
                Room Code
              </label>
              <input
                type="text"
                id="code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Ex: A1B2C3"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-gray-600 text-center tracking-widest uppercase font-mono"
                maxLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={joining || !joinCode}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {joining ? 'Joining...' : 'Join Room'}
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-gray-600 max-w-sm">
        <p>Low-bandwidth audio-only environment.</p>
        <p>No video. No persistent data.</p>
      </div>
    </main>
  );
}
