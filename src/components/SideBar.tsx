"use client";

import { useState, useEffect } from 'react';
import { format, subMinutes, isAfter } from 'date-fns';
import { getReservations } from '@/lib/api';

interface ReservationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
}

export default function ReservationSidebar({ isOpen, onClose, selectedDate }: ReservationSidebarProps) {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchReservations();
    }
  }, [isOpen, selectedDate]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      const data = await getReservations({
        date_from: formattedDate,
        date_to: formattedDate
      });
      
      // Filter for reservations from 30 minutes ago to the end of day
      const thirtyMinsAgo = subMinutes(new Date(), 30);
      const filteredData = data.filter(reservation => {
        const reservationDateTime = new Date(
          `${reservation.reservation_date}T${reservation.start_time}`
        );
        return isAfter(reservationDateTime, thirtyMinsAgo) || 
               (reservation.status !== 'completed' && 
                reservation.status !== 'cancelled' && 
                reservation.status !== 'no_show');
      });
      
      // Sort by time
      filteredData.sort((a, b) => {
        return a.start_time.localeCompare(b.start_time);
      });
      
      setReservations(filteredData);
      setError(null);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError('failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'seated':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'no_show':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      {/* Backdrop for mobile/tablet */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-35 sidebar-backdrop"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`sidebar bg-card-background border-r border-border ${isOpen ? 'open' : ''}`}
      >
        <div className="sidebar-content">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">today's reservations</h2>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center py-2">{error}</div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-4 text-gray-500">no upcoming reservations</div>
            ) : (
              <div className="space-y-3 pb-16">
                {reservations.map(reservation => (
                  <div key={reservation.id} className="border border-border rounded p-3">
                    <div className="flex justify-between items-start">
                      <div className="font-medium">{reservation.start_time.slice(0, 5)}</div>
                      <span 
                        className={`inline-block px-2 py-1 text-xs rounded-full border ${getStatusBadgeClass(reservation.status)}`}
                      >
                        {reservation.status}
                      </span>
                    </div>
                    
                    <div className="mt-1 text-sm">{reservation.customer_name}</div>
                    <div className="text-sm text-gray-500">
                      {reservation.party_size} people · {reservation.duration_minutes} mins
                    </div>
                    
                    <div className="mt-1 flex flex-wrap gap-1">
                      {reservation.tables.map((table: any) => (
                        <span 
                          key={table.id}
                          className="inline-block bg-gray-700 rounded-full px-2 py-1 text-xs"
                        >
                          {table.table_number}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
