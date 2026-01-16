'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from '@/components/Dashboard';
import LandingPage from '@/components/LandingPage';

interface User {
  name: string;
  email: string;
  picture: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
        setUser(null);
        setLoading(false);
      });
  }, [router]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setUser(null);
        router.refresh();
      }
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  return <LandingPage />;
}
