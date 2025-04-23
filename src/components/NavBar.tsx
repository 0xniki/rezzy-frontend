"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logoutUser, isUserLoggedIn } from '@/lib/auth';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  
  useEffect(() => {
    // Check login status when component mounts or pathname changes
    setIsLoggedIn(isUserLoggedIn());
  }, [pathname]);
  
  const handleLogout = () => {
    logoutUser();
    router.push('/login');
  };
  
  // Don't show navbar on login page
  if (pathname === '/login') {
    return null;
  }
  
  return (
    <nav className="bg-indigo-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-xl font-bold">rezzy</Link>
          
          {isLoggedIn && (
            <div className="hidden md:flex space-x-4">
              <Link 
                href="/dashboard" 
                className={`${pathname === '/dashboard' ? 'text-white font-semibold' : 'text-indigo-100 hover:text-white'}`}
              >
                dashboard
              </Link>
              <Link 
                href="/reservations" 
                className={`${pathname === '/reservations' ? 'text-white font-semibold' : 'text-indigo-100 hover:text-white'}`}
              >
                reservations
              </Link>
              <Link 
                href="/setup" 
                className={`${pathname === '/setup' ? 'text-white font-semibold' : 'text-indigo-100 hover:text-white'}`}
              >
                setup
              </Link>
            </div>
          )}
        </div>
        
        {isLoggedIn && (
          <button 
            onClick={handleLogout}
            className="text-sm bg-indigo-500 hover:bg-indigo-400 px-3 py-1 rounded"
          >
            logout
          </button>
        )}
      </div>
    </nav>
  );
}
