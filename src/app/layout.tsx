import './globals.css';
import type { Metadata } from 'next';
import Navbar from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'Rezzy',
  description: 'Restaurant reservation management system',
};

export const viewport = {
  themeColor: '#0f0f0f',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
      </head>
      <body>
        <main className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="container mx-auto p-4">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
