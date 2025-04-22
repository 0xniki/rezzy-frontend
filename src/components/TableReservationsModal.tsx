"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getReservations } from '@/lib/api';

interface TableReservationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
  tableNumber: string;
  date: Date;
}

const TableReservationsModal = ({ 
  isOpen, 
  onClose, 
  tableId, 
  tableNumber,
  date 
}: TableReservationsModalProps) => {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchReservations();
    }
  }, [isOpen, tableId, date]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      const data = await getReservations({
        date_from: formattedDate,
        date_to: formattedDate,
        table_id: tableId
      });
      
      setReservations(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching table reservations:', err);
      setError('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              reservations for table {tableNumber}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              &times;
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">loading reservations...</p>
            </div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">no reservations found for this table on {format(date, 'MMMM d, yyyy')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 text-left">time</th>
                    <th className="py-2 px-4 text-left">customer</th>
                    <th className="py-2 px-4 text-left">party</th>
                    <th className="py-2 px-4 text-left">status</th>
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
                        <span 
                          className={`inline-block px-2 py-1 text-xs rounded-full border ${getStatusBadgeClass(reservation.status)}`}
                        >
                          {reservation.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableReservationsModal;