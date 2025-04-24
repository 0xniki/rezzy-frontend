"use client";

import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format } from 'date-fns';
import { 
  checkAvailability, 
  createReservation,
  getHours,
  RestaurantHours,
  getSpecialHoursByDate
} from '@/lib/api';

interface ReservationFormProps {
  onCancel: () => void;
  selectedDate: Date;
}

export default function ReservationForm({ onCancel, selectedDate }: ReservationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hours, setHours] = useState<RestaurantHours[]>([]);
  const [availableTables, setAvailableTables] = useState<any[]>([]);
  const [isValidTime, setIsValidTime] = useState(true);
  const [checkedAvailability, setCheckedAvailability] = useState(false);
  const [hoursLoaded, setHoursLoaded] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    date: selectedDate,
    time: '',
    duration: 90,
    party_size: 2,
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    notes: '',
    selectedTables: [] as string[]
  });
  
  // Time slots
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  
  // First load hours, then generate time slots
  useEffect(() => {
    fetchHours();
  }, []);
  
  // When hours are loaded or date changes, generate time slots
  useEffect(() => {
    if (hoursLoaded) {
      generateTimeSlots(selectedDate);
    }
  }, [selectedDate, hoursLoaded]);
  
  const fetchHours = async () => {
    try {
      const data = await getHours();
      setHours(data);
      setHoursLoaded(true);
    } catch (err) {
      console.error('Error fetching hours:', err);
      setError('Failed to load restaurant hours. Please try again.');
    }
  };
  
  const generateTimeSlots = async (date: Date) => {
    try {
      setError(null);
      const dayOfWeek = date.getDay();
      // Convert to 0-6 where Monday is 0
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      // Check if this is a special day
      const formattedDate = format(date, 'yyyy-MM-dd');
      const specialHours = await getSpecialHoursByDate(formattedDate);
      
      if (specialHours) {
        if (specialHours.is_closed) {
          setTimeSlots([]);
          setError('Restaurant is closed on this day.');
          return;
        }
        
        // Use special hours
        generateTimeSlotsFromHours(
          specialHours.open_time!,
          specialHours.last_reservation_time!
        );
        return;
      }
      
      // Use regular hours
      const dayHours = hours.find(h => h.day_of_week === adjustedDay);
      
      if (!dayHours) {
        setTimeSlots([]);
        setError('No hours set for this day of the week.');
        return;
      }
      
      generateTimeSlotsFromHours(
        dayHours.open_time,
        dayHours.last_reservation_time
      );
    } catch (err) {
      console.error('Error generating time slots:', err);
      setError('Failed to load available time slots.');
    }
  };
  
  const generateTimeSlotsFromHours = (openTime: string, lastReservationTime: string) => {
    const slots: string[] = [];
    
    // Parse times
    const [openHour, openMinute] = openTime.split(':').map(Number);
    const [lastHour, lastMinute] = lastReservationTime.split(':').map(Number);
    
    // Generate slots every 30 minutes
    let currentHour = openHour;
    let currentMinute = openMinute;
    
    while (
      currentHour < lastHour || 
      (currentHour === lastHour && currentMinute <= lastMinute)
    ) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      slots.push(timeString);
      
      // Increment by 30 minutes
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute = 0;
      }
    }
    
    setTimeSlots(slots);
  };
  
  const handleCheckAvailability = async () => {
    if (!formData.time) {
      setError('Please select a time.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await checkAvailability({
        party_size: formData.party_size,
        reservation_date: format(formData.date, 'yyyy-MM-dd'),
        start_time: formData.time,
        duration_minutes: formData.duration
      });
      
      setIsValidTime(response.is_valid_time);
      setAvailableTables(response.available_tables);
      setCheckedAvailability(true);
      
      if (!response.is_valid_time) {
        setError('Selected time is outside restaurant operating hours.');
      } else if (response.available_tables.length === 0) {
        setError('No tables available for the selected time and party size.');
      } else {
        // Auto-select the most appropriate table(s)
        const sortedTables = [...response.available_tables].sort((a, b) => {
          // Prefer tables closest to party size
          const aDiff = a.max_capacity - formData.party_size;
          const bDiff = b.max_capacity - formData.party_size;
          return aDiff - bDiff;
        });
        
        // Select the first table that fits
        const selectedTableIds = [sortedTables[0].id];
        setFormData({
          ...formData,
          selectedTables: selectedTableIds
        });
      }
    } catch (err) {
      console.error('Error checking availability:', err);
      setError('Failed to check availability. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!checkedAvailability) {
      setError('Please check availability first.');
      return;
    }
    
    if (formData.selectedTables.length === 0) {
      setError('Please select at least one table.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Validate required fields before submission
      if (!formData.customer_name) {
        setError('Customer name is required');
        setLoading(false);
        return;
      }
      
      // For small parties, contact info is optional due to our backend changes
      const isSmallParty = formData.party_size < 6;
      
      if (!isSmallParty && !formData.customer_email && !formData.customer_phone) {
        setError('Either email or phone is required for parties of 6 or more');
        setLoading(false);
        return;
      }
      
      await createReservation({
        party_size: formData.party_size,
        reservation_date: format(formData.date, 'yyyy-MM-dd'),
        start_time: formData.time,
        duration_minutes: formData.duration,
        notes: formData.notes,
        customer: {
          name: formData.customer_name,
          email: formData.customer_email || undefined,
          phone: formData.customer_phone || undefined,
          notes: ''
        },
        table_ids: formData.selectedTables
      }).catch(error => {
        console.error('Create reservation error:', error);
        throw error;
      });
      
      setSuccess(true);
      
      // Reset form after successful submission
      setTimeout(() => {
        onCancel();
      }, 2000);
    } catch (err) {
      console.error('Error creating reservation:', err);
      setError('Failed to create reservation. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleTableSelection = (tableId: string) => {
    if (formData.selectedTables.includes(tableId)) {
      setFormData({
        ...formData,
        selectedTables: formData.selectedTables.filter(id => id !== tableId)
      });
    } else {
      setFormData({
        ...formData,
        selectedTables: [...formData.selectedTables, tableId]
      });
    }
  };
  
  if (success) {
    return (
      <div className="text-center py-8">
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <h3 className="text-xl font-semibold mb-2">reservation created!</h3>
        <p className="mb-4">The reservation has been successfully created.</p>
      </div>
    );
  }
  
  return (
    <div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">reservation details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">date</label>
                <DatePicker
                  selected={formData.date}
                  onChange={(date) => {
                    if (date) {
                      setFormData({...formData, date, time: ''});
                      generateTimeSlots(date);
                      setCheckedAvailability(false);
                      setAvailableTables([]);
                    }
                  }}
                  className="w-full p-2 border rounded"
                  dateFormat="MMMM d, yyyy"
                  minDate={new Date()}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">time</label>
                <select
                  value={formData.time}
                  onChange={(e) => {
                    setFormData({...formData, time: e.target.value});
                    setCheckedAvailability(false);
                    setAvailableTables([]);
                  }}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select a time</option>
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">party size</label>
                <input
                  type="number"
                  min="1"
                  value={formData.party_size}
                  onChange={(e) => {
                    setFormData({...formData, party_size: parseInt(e.target.value)});
                    setCheckedAvailability(false);
                    setAvailableTables([]);
                  }}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">duration (minutes)</label>
                <select
                  value={formData.duration}
                  onChange={(e) => {
                    setFormData({...formData, duration: parseInt(e.target.value)});
                    setCheckedAvailability(false);
                    setAvailableTables([]);
                  }}
                  className="w-full p-2 border rounded"
                >
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                  <option value="120">120 minutes</option>
                  <option value="150">150 minutes</option>
                  <option value="180">180 minutes</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">notes (optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full p-2 border rounded"
                  rows={2}
                />
              </div>
              
              <div>
                <button
                  type="button"
                  onClick={handleCheckAvailability}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                  disabled={loading || !formData.time}
                >
                  {loading ? 'checking...' : 'check availability'}
                </button>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">customer information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">name</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">email</label>
                <input
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <p className="text-xs text-gray-500 mt-1">Either email or phone is required</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">phone</label>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              {checkedAvailability && availableTables.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1">select table(s)</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {availableTables.map(table => (
                      <div 
                        key={table.id}
                        className={`p-2 border rounded cursor-pointer ${
                          formData.selectedTables.includes(table.id)
                            ? 'bg-indigo-100 border-indigo-400'
                            : 'bg-gray-50'
                        }`}
                        onClick={() => toggleTableSelection(table.id)}
                      >
                        <div className="font-medium">{table.table_number}</div>
                        <div className="text-xs">
                          Capacity: {table.min_capacity}-{table.max_capacity}
                          {table.is_shared && " (Shared)"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex space-x-2">
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            disabled={loading || !checkedAvailability || formData.selectedTables.length === 0}
          >
            {loading ? 'creating...' : 'create reservation'}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            cancel
          </button>
        </div>
      </form>
    </div>
  );
}
