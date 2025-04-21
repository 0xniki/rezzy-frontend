"use client";

import { useState } from 'react';
import Link from 'next/link';
import ReservationForm from '@/components/ReservationForm';
import ReservationList from '@/components/ReservationList';

export default function ReservationsPage() {
  const [activeView, setActiveView] = useState<'list' | 'create'>('list');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">reservations</h1>
        <div className="flex space-x-2">
          <Link 
            href="/dashboard" 
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            back to dashboard
          </Link>
        </div>
      </div>
      
      <div className="flex mb-4 space-x-2">
        <button
          className={`px-4 py-2 rounded ${activeView === 'list' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveView('list')}
        >
          view reservations
        </button>
        <button
          className={`px-4 py-2 rounded ${activeView === 'create' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveView('create')}
        >
          create reservation
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        {activeView === 'list' ? (
          <ReservationList 
            onCreateNew={() => setActiveView('create')} 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        ) : (
          <ReservationForm 
            onCancel={() => setActiveView('list')}
            selectedDate={selectedDate}
          />
        )}
      </div>
    </div>
  );
}
