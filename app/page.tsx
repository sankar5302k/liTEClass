'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  name: string;
  email: string;
  picture: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    // Ideally fetch /api/auth/me or verify via client cookie if accessible (not httpOnly)
    // For now we assume if the API call below fails, we redirect.
    // However, since we used httpOnly cookies, we need an endpoint to check auth status.
    // Let's create a quick check.

    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not authenticated');
      })
      .then(data => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        // router.push('/login'); 
        // Don't auto-redirect here to avoid loops if needed, but usually yes.
        router.push('/login');
      });
  }, [router]);

  const createMeeting = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rooms/create', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        router.push(`/room/${data.code}`);
      } else {
        console.error("Failed to create room");
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const joinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      router.push(`/room/${joinCode.trim()}`);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <header className="flex justify-between items-center mb-12">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">LiteClass</h1>
        <div className="flex items-center gap-4">
          <img src={user?.picture} alt={user?.name} className="w-10 h-10 rounded-full border-2 border-primary" />
          <span className="hidden md:block">{user?.name}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
        {/* Create Meeting */}
        <div className="bg-gray-800 p-8 rounded-2xl shadow-xl hover:bg-gray-750 transition duration-300 cursor-pointer border border-gray-700 hover:border-blue-500" onClick={createMeeting}>
          <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2">New Meeting</h2>
          <p className="text-gray-400">Create a new meeting and invite others to join.</p>
        </div>

        {/* Join Meeting */}
        <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
          <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-4">Join Meeting</h2>
          <form onSubmit={joinMeeting} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter room code"
              className="flex-1 bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-purple-500 px-4 py-2"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
            />
            <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition">
              Join
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
