"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTables } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndTables = async () => {
      // Check if the user is logged in
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      
      if (!isLoggedIn) {
        // Not logged in, redirect to login
        router.push('/login');
        return;
      }
      
      try {
        // Check if any tables exist to determine where to send the user
        const tables = await getTables();
        
        if (tables.length > 0) {
          // Tables exist, send to dashboard
          router.push('/dashboard');
        } else {
          // No tables, send to setup
          router.push('/setup');
        }
      } catch (error) {
        console.error('Error checking tables:', error);
        // On error, default to setup
        router.push('/setup');
      }
    };
    
    checkAuthAndTables();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">rezzy</h1>
        <p className="mb-4">restaurant reservation system</p>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">redirecting...</p>
      </div>
    </div>
  );
}
