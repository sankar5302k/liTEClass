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

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
      }
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-12 gap-4">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">LiteClass</h1>
        <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-end">
          <div className="flex items-center gap-3">
            <img src={user?.picture} alt={user?.name} className="w-10 h-10 rounded-full border-2 border-primary object-cover" referrerPolicy="no-referrer" />
            <span className="hidden sm:block font-medium">{user?.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="ml-auto md:ml-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition shadow-md whitespace-nowrap"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

        <div
          className="group bg-gray-800 p-6 md:p-8 rounded-2xl shadow-xl hover:bg-gray-750 transition duration-300 cursor-pointer border border-gray-700 hover:border-blue-500 transform hover:-translate-y-1"
          onClick={createMeeting}
        >
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:shadow-blue-500/30 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl md:text-2xl font-bold mb-2">New Meeting</h2>
          <p className="text-gray-400 text-sm md:text-base">Create a new meeting instantly and invite others to join.</p>
        </div>


        <div className="bg-gray-800 p-6 md:p-8 rounded-2xl shadow-xl border border-gray-700">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-xl md:text-2xl font-bold mb-4">Join Meeting</h2>
          <form onSubmit={joinMeeting} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Enter room code"
              className="flex-1 bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent px-4 py-3 outline-none transition w-full"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
            />
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition shadow-lg sm:w-auto w-full"
            >
              Join
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
