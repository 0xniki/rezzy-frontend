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
