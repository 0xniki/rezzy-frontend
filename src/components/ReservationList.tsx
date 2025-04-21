"use client";

import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format } from 'date-fns';
import { getReservations, updateReservationStatus, deleteReservation } from '@/lib/api';

interface ReservationListProps {
  onCreateNew: () => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function ReservationList({ 
  onCreateNew, 
  selectedDate, 
  onDateChange 
}: ReservationListProps) {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  useEffect(() => {
    fetchReservations();
  }, [selectedDate, statusFilter]);
  
  const fetchReservations = async () => {
    try {
      setLoading(true);
      
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const params: any = {
        date_from: formattedDate,
        date_to: formattedDate,
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const data = await getReservations(params);
      setReservations(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError('Failed to load reservations. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleStatusChange = async (reservationId: string, newStatus: string) => {
    try {
      await updateReservationStatus(reservationId, newStatus);
      // Refresh reservations
      fetchReservations();
    } catch (err) {
      console.error('Error updating reservation status:', err);
      setError('Failed to update reservation status. Please try again.');
    }
  };
  
  const handleDeleteReservation = async (reservationId: string) => {
    if (!confirm('Are you sure you want to delete this reservation?')) {
      return;
    }
    
    try {
      await deleteReservation(reservationId);
      // Refresh reservations
      fetchReservations();
    } catch (err) {
      console.error('Error deleting reservation:', err);
      setError('Failed to delete reservation. Please try again.');
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
  
  if (loading && reservations.length === 0) {
    return <div className="text-center py-4">loading reservations...</div>;
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">reservations</h2>
        <button
          onClick={onCreateNew}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          new reservation
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">date</label>
          <DatePicker
            selected={selectedDate}
            onChange={(date) => {
              if (date) {
                onDateChange(date);
              }
            }}
            className="w-full p-2 border rounded"
            dateFormat="MMMM d, yyyy"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">status filter</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="seated">Seated</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
        </div>
        
        <div className="flex items-end">
          <button
            onClick={fetchReservations}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            refresh
          </button>
        </div>
      </div>
      
      {reservations.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No reservations found for the selected date and filters.</p>
          <button
            onClick={onCreateNew}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            create new reservation
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left">time</th>
                <th className="py-2 px-4 text-left">customer</th>
                <th className="py-2 px-4 text-left">party</th>
                <th className="py-2 px-4 text-left">tables</th>
                <th className="py-2 px-4 text-left">status</th>
                <th className="py-2 px-4 text-left">actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation.id} className="border-t">
                  <td className="py-3 px-4">
                    <div className="font-medium">{reservation.start_time.slice(0, 5)}</div>
                    <div className="text-xs text-gray-500">{reservation.duration_minutes} mins</div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="font-medium">{reservation.customer_name}</div>
                    <div className="text-xs text-gray-500">
                      {reservation.customer_phone || reservation.customer_email}
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    {reservation.party_size} people
                  </td>
                  
                  <td className="py-3 px-4">
                    {reservation.tables.map((table: any) => (
                      <span 
                        key={table.id}
                        className="inline-block bg-gray-100 rounded-full px-2 py-1 text-xs mr-1 mb-1"
                      >
                        {table.table_number}
                      </span>
                    ))}
                  </td>
                  
                  <td className="py-3 px-4">
                    <span 
                      className={`inline-block px-2 py-1 text-xs rounded-full border ${getStatusBadgeClass(reservation.status)}`}
                    >
                      {reservation.status}
                    </span>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="flex flex-col space-y-1">
                      <select
                        value={reservation.status}
                        onChange={(e) => handleStatusChange(reservation.id, e.target.value)}
                        className="text-sm p-1 border rounded"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirm</option>
                        <option value="seated">Seat</option>
                        <option value="completed">Complete</option>
                        <option value="cancelled">Cancel</option>
                        <option value="no_show">No Show</option>
                      </select>
                      
                      <button
                        onClick={() => handleDeleteReservation(reservation.id)}
                        className="text-red-600 text-sm hover:text-red-800"
                      >
                        delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
