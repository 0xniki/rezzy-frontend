"use client";

import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, parseISO } from 'date-fns';
import { 
  getSpecialHours, 
  getSpecialHoursByDate, 
  setSpecialHours, 
  deleteSpecialHours,
  SpecialHours
} from '@/lib/api';

export default function SpecialHoursSetup() {
  const [specialDays, setSpecialDays] = useState<SpecialHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_closed: false,
    open_time: '09:00',
    close_time: '22:00',
    last_reservation_time: '21:00'
  });
  
  // Filter state
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;
  
  useEffect(() => {
    fetchSpecialHours();
  }, [startDate, endDate]);
  
  const fetchSpecialHours = async () => {
    try {
      setLoading(true);
      let dateFrom = startDate ? format(startDate, 'yyyy-MM-dd') : undefined;
      let dateTo = endDate ? format(endDate, 'yyyy-MM-dd') : undefined;
      
      const data = await getSpecialHours(dateFrom, dateTo);
      setSpecialDays(data);
    } catch (err) {
      setError('Failed to load special days. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDateSelect = async (date: Date | null) => {
    if (!date) return;
    
    setSelectedDate(date);
    
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const existingHours = await getSpecialHoursByDate(formattedDate);
      
      if (existingHours) {
        // Edit existing hours
        setFormMode('edit');
        setFormData({
          name: existingHours.name,
          description: existingHours.description || '',
          is_closed: existingHours.is_closed,
          open_time: existingHours.open_time ? existingHours.open_time.slice(0, 5) : '09:00',
          close_time: existingHours.close_time ? existingHours.close_time.slice(0, 5) : '22:00',
          last_reservation_time: existingHours.last_reservation_time 
            ? existingHours.last_reservation_time.slice(0, 5) 
            : '21:00'
        });
      } else {
        // Create new hours
        setFormMode('create');
        setFormData({
          name: '',
          description: '',
          is_closed: false,
          open_time: '09:00',
          close_time: '22:00',
          last_reservation_time: '21:00'
        });
      }
    } catch (err) {
      console.error('Error checking existing hours:', err);
    }
  };
  
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate) {
      setError('Please select a date first');
      return;
    }
    
    try {
      setLoading(true);
      
      const specialHoursData = {
        date: format(selectedDate, 'yyyy-MM-dd'),
        name: formData.name,
        description: formData.description || null,
        is_closed: formData.is_closed,
        open_time: !formData.is_closed ? formData.open_time : null,
        close_time: !formData.is_closed ? formData.close_time : null,
        last_reservation_time: !formData.is_closed ? formData.last_reservation_time : null
      };
      
      await setSpecialHours(specialHoursData);
      
      // Reset form and refresh list
      setSelectedDate(null);
      setFormData({
        name: '',
        description: '',
        is_closed: false,
        open_time: '09:00',
        close_time: '22:00',
        last_reservation_time: '21:00'
      });
      
      await fetchSpecialHours();
      setError(null);
    } catch (err) {
      setError('Failed to save special hours. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteHours = async (id: string) => {
    if (!confirm('are you sure you want to delete these special hours?')) {
      return;
    }
    
    try {
      setLoading(true);
      await deleteSpecialHours(id);
      
      // Reset form if we're currently editing this entry
      if (formMode === 'edit') {
        setSelectedDate(null);
        setFormData({
          name: '',
          description: '',
          is_closed: false,
          open_time: '09:00',
          close_time: '22:00',
          last_reservation_time: '21:00'
        });
      }
      
      await fetchSpecialHours();
    } catch (err) {
      setError('Failed to delete special hours. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && specialDays.length === 0) {
    return <div className="text-center py-4"></div>;
  }
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">special days & holiday hours</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-medium mb-3">select date</h3>
          
          <div className="mb-4">
            <DatePicker
              selected={selectedDate}
              onChange={handleDateSelect}
              inline
              highlightDates={specialDays.map(day => parseISO(day.date))}
              placeholderText="Select date for special hours"
            />
          </div>
          
          {selectedDate && (
            <form onSubmit={handleFormSubmit}>
              <h3 className="font-medium mb-3">
                {formMode === 'create' 
                  ? `set special hours for ${format(selectedDate, 'MMMM d, yyyy')}` 
                  : `edit special hours for ${format(selectedDate, 'MMMM d, yyyy')}`
                }
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., New Year's Day, Private Event"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">description (optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="Additional details"
                    rows={2}
                  />
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_closed}
                      onChange={(e) => setFormData({...formData, is_closed: e.target.checked})}
                      className="mr-2"
                    />
                    <span>closed on this day</span>
                  </label>
                </div>
                
                {!formData.is_closed && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">open time</label>
                      <input
                        type="time"
                        value={formData.open_time}
                        onChange={(e) => setFormData({...formData, open_time: e.target.value})}
                        className="w-full p-2 border rounded"
                        required={!formData.is_closed}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">close time</label>
                      <input
                        type="time"
                        value={formData.close_time}
                        onChange={(e) => setFormData({...formData, close_time: e.target.value})}
                        className="w-full p-2 border rounded"
                        required={!formData.is_closed}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">last reservation</label>
                      <input
                        type="time"
                        value={formData.last_reservation_time}
                        onChange={(e) => setFormData({...formData, last_reservation_time: e.target.value})}
                        className="w-full p-2 border rounded"
                        required={!formData.is_closed}
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'saving...' : formMode === 'create' ? 'save special hours' : 'update special hours'}
                  </button>
                  
                  <button
                    type="button"
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                    onClick={() => {
                      setSelectedDate(null);
                      setFormData({
                        name: '',
                        description: '',
                        is_closed: false,
                        open_time: '09:00',
                        close_time: '22:00',
                        last_reservation_time: '21:00'
                      });
                    }}
                  >
                    cancel
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
        
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-medium mb-3">special days</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">filter by date range (optional)</label>
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={(update) => setDateRange(update)}
              className="w-full p-2 border rounded"
              placeholderText="Select date range"
            />
          </div>
          
          {specialDays.length === 0 ? (
            <p className="text-gray-500">no special days set yet</p>
          ) : (
            <div className="overflow-y-auto max-h-96">
              {specialDays.map(day => (
                <div key={day.id} className="border-b py-3 last:border-b-0">
                  <div className="flex justify-between">
                    <div className="font-medium">{format(parseISO(day.date), 'MMMM d, yyyy')}</div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDateSelect(parseISO(day.date))}
                        className="text-indigo-600 hover:text-indigo-800 text-sm"
                      >
                        edit
                      </button>
                      <button
                        onClick={() => handleDeleteHours(day.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        delete
                      </button>
                    </div>
                  </div>
                  <div className="text-sm font-semibold mt-1">{day.name}</div>
                  {day.description && <div className="text-sm text-gray-600 mt-1">{day.description}</div>}
                  <div className="text-sm text-gray-600 mt-1">
                    {day.is_closed ? (
                      <span className="text-red-600">closed</span>
                    ) : (
                      <>
                        Open: {day.open_time?.slice(0, 5)} - {day.close_time?.slice(0, 5)}
                        (Last reservation: {day.last_reservation_time?.slice(0, 5)})
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
