"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTables } from '@/lib/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (isLoggedIn) {
      checkTablesAndRedirect();
    }
  }, []);

  const checkTablesAndRedirect = async () => {
    try {
      setIsLoading(true);
      const tables = await getTables();
      
      if (tables.length > 0) {
        router.push('/dashboard');
      } else {
        router.push('/setup');
      }
    } catch (error) {
      console.error('Error checking tables:', error);
      router.push('/setup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For this demo, we'll use a simple hardcoded credential check
    // In a real app, this would be a server-side authentication
    if (username === 'admin' && password === 'password') {
      setIsLoading(true);
      setError(null);
      
      // Set logged in status in localStorage
      localStorage.setItem('isLoggedIn', 'true');
      
      // Check tables and redirect to appropriate page
      await checkTablesAndRedirect();
    } else {
      setError('invalid username or password');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-indigo-600">rezzy</h1>
            <p className="text-gray-600 mt-2">restaurant reservation system</p>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                id="username"
                type="text"
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                required
              />
            </div>
            
            <div className="mb-6">
              <input
                id="password"
                type="password"
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white p-3 rounded font-medium hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'logging in...' : 'log in'}
            </button>
          </form>
          
        </div>
      </div>
    </div>
  );
}
