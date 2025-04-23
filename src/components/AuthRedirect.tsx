"use client";

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isUserLoggedIn } from '@/lib/auth';

interface AuthRedirectProps {
  children: ReactNode;
}

export default function AuthRedirect({ children }: AuthRedirectProps) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    // Skip auth check for login page
    if (pathname === '/login') {
      setIsLoading(false);
      return;
    }
    
    // Check if user is logged in
    const loggedIn = isUserLoggedIn();
    
    if (!loggedIn) {
      // Redirect to login if not logged in
      router.push('/login');
    } else {
      setIsLoading(false);
    }
  }, [pathname, router]);
  
  if (isLoading && pathname !== '/login') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">checking session...</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}
