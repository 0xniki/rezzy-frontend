"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logoutUser, isUserLoggedIn } from '@/lib/auth';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  
  useEffect(() => {
    // Check login status when component mounts or pathname changes
    setIsLoggedIn(isUserLoggedIn());
    
    // Add scroll event listener
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);
  
  const handleLogout = () => {
    logoutUser();
    router.push('/login');
  };

  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    
    // Dispatch custom event for other components to listen to
    const event = new CustomEvent('toggle-sidebar', { 
      detail: { isOpen: newState } 
    });
    window.dispatchEvent(event);
  };
  
  // Don't show navbar on login page
  if (pathname === '/login') {
    return null;
  }
  
  return (
    <nav className="bg-indigo-600 text-white p-4 z-50 relative">
      <div className="container mx-auto flex justify-between items-center">
        {isLoggedIn && (
          <button 
            onClick={toggleSidebar} 
            className="text-indigo-100 hover:text-white sidebar-toggle absolute left-0"
            aria-label="Toggle sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        )}
        
        <div className="flex items-center space-x-4 mx-auto md:mx-0">
          <Link href="/" className="text-xl font-bold">rezzy</Link>
          
          {isLoggedIn && (
            <div className="hidden md:flex space-x-6 ml-10">
              <Link 
                href="/dashboard" 
                className={`nav-link ${pathname === '/dashboard' ? 'active' : 'text-indigo-100 hover:text-white'}`}
              >
                dashboard
              </Link>
              <Link 
                href="/reservations" 
                className={`nav-link ${pathname === '/reservations' ? 'active' : 'text-indigo-100 hover:text-white'}`}
              >
                reservations
              </Link>
              <Link 
                href="/setup" 
                className={`nav-link ${pathname === '/setup' ? 'active' : 'text-indigo-100 hover:text-white'}`}
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
