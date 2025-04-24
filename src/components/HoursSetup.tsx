"use client";

import { useState, useEffect } from 'react';
import { getHours, setHours, RestaurantHours, RestaurantHoursCreate } from '@/lib/api';

const dayNames = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export default function HoursSetup() {
  const [hours, setHoursState] = useState<RestaurantHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'weekday' | 'weekend'>('weekday');

  // Default hours
  const defaultWeekdayHours = {
    open_time: '09:00',
    close_time: '22:00',
    last_reservation_time: '21:00'
  };

  const defaultWeekendHours = {
    open_time: '10:00',
    close_time: '23:00',
    last_reservation_time: '22:00'
  };

  // Temporary state for form values
  const [weekdayHours, setWeekdayHours] = useState(defaultWeekdayHours);
  const [saturdayHours, setSaturdayHours] = useState(defaultWeekendHours);
  const [sundayHours, setSundayHours] = useState(defaultWeekendHours);

  useEffect(() => {
    fetchHours();
  }, []);

  const fetchHours = async () => {
    try {
      setLoading(true);
      const data = await getHours();
      setHoursState(data);
      
      // If we have existing hours, populate the form
      if (data.length > 0) {
        // Get weekday hours (use Monday as reference)
        const weekday = data.find(h => h.day_of_week === 0);
        if (weekday) {
          setWeekdayHours({
            open_time: weekday.open_time.slice(0, 5),
            close_time: weekday.close_time.slice(0, 5),
            last_reservation_time: weekday.last_reservation_time.slice(0, 5)
          });
        }
        
        // Get Saturday hours
        const saturday = data.find(h => h.day_of_week === 5);
        if (saturday) {
          setSaturdayHours({
            open_time: saturday.open_time.slice(0, 5),
            close_time: saturday.close_time.slice(0, 5),
            last_reservation_time: saturday.last_reservation_time.slice(0, 5)
          });
        }
        
        // Get Sunday hours
        const sunday = data.find(h => h.day_of_week === 6);
        if (sunday) {
          setSundayHours({
            open_time: sunday.open_time.slice(0, 5),
            close_time: sunday.close_time.slice(0, 5),
            last_reservation_time: sunday.last_reservation_time.slice(0, 5)
          });
        }
      }
    } catch (err) {
      setError('Failed to load hours. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWeekdaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      // Set hours for Monday-Friday (0-4)
      for (let day = 0; day < 5; day++) {
        const hoursData: RestaurantHoursCreate = {
          day_of_week: day,
          open_time: weekdayHours.open_time,
          close_time: weekdayHours.close_time,
          last_reservation_time: weekdayHours.last_reservation_time
        };
        
        await setHours(hoursData);
      }
      
      await fetchHours();
      setError(null);
    } catch (err) {
      setError('Failed to save weekday hours. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaturdaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const hoursData: RestaurantHoursCreate = {
        day_of_week: 5, // Saturday
        open_time: saturdayHours.open_time,
        close_time: saturdayHours.close_time,
        last_reservation_time: saturdayHours.last_reservation_time
      };
      
      await setHours(hoursData);
      await fetchHours();
      setError(null);
    } catch (err) {
      setError('Failed to save Saturday hours. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSundaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const hoursData: RestaurantHoursCreate = {
        day_of_week: 6, // Sunday
        open_time: sundayHours.open_time,
        close_time: sundayHours.close_time,
        last_reservation_time: sundayHours.last_reservation_time
      };
      
      await setHours(hoursData);
      await fetchHours();
      setError(null);
    } catch (err) {
      setError('Failed to save Sunday hours. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && hours.length === 0) {
    return <div className="text-center py-4"></div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">restaurant hours</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="flex mb-4 space-x-2">
        <button
          className={`px-4 py-2 rounded ${activeTab === 'weekday' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('weekday')}
        >
          monday-friday
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'weekend' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('weekend')}
        >
          weekend
        </button>
      </div>
      
      <div className="bg-gray-50 p-4 rounded">
        {activeTab === 'weekday' ? (
          <form onSubmit={handleWeekdaySubmit}>
            <h3 className="font-medium mb-3">monday-friday hours</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">open time</label>
                <input
                  type="time"
                  value={weekdayHours.open_time}
                  onChange={(e) => setWeekdayHours({...weekdayHours, open_time: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">close time</label>
                <input
                  type="time"
                  value={weekdayHours.close_time}
                  onChange={(e) => setWeekdayHours({...weekdayHours, close_time: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">last reservation</label>
                <input
                  type="time"
                  value={weekdayHours.last_reservation_time}
                  onChange={(e) => setWeekdayHours({...weekdayHours, last_reservation_time: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'saving...' : 'save weekday hours'}
            </button>
          </form>
        ) : (
          <div className="space-y-8">
            <form onSubmit={handleSaturdaySubmit}>
              <h3 className="font-medium mb-3">saturday hours</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">open time</label>
                  <input
                    type="time"
                    value={saturdayHours.open_time}
                    onChange={(e) => setSaturdayHours({...saturdayHours, open_time: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">close time</label>
                  <input
                    type="time"
                    value={saturdayHours.close_time}
                    onChange={(e) => setSaturdayHours({...saturdayHours, close_time: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">last reservation</label>
                  <input
                    type="time"
                    value={saturdayHours.last_reservation_time}
                    onChange={(e) => setSaturdayHours({...saturdayHours, last_reservation_time: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'saving...' : 'save saturday hours'}
              </button>
            </form>
            
            <form onSubmit={handleSundaySubmit}>
              <h3 className="font-medium mb-3">sunday hours</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">open time</label>
                  <input
                    type="time"
                    value={sundayHours.open_time}
                    onChange={(e) => setSundayHours({...sundayHours, open_time: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">close time</label>
                  <input
                    type="time"
                    value={sundayHours.close_time}
                    onChange={(e) => setSundayHours({...sundayHours, close_time: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">last reservation</label>
                  <input
                    type="time"
                    value={sundayHours.last_reservation_time}
                    onChange={(e) => setSundayHours({...sundayHours, last_reservation_time: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'saving...' : 'save sunday hours'}
              </button>
            </form>
          </div>
        )}
      </div>
      
      <div className="mt-6">
        <h3 className="font-medium mb-2">current hours</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left">day</th>
                <th className="py-2 px-4 text-left">open</th>
                <th className="py-2 px-4 text-left">close</th>
                <th className="py-2 px-4 text-left">last reservation</th>
              </tr>
            </thead>
            <tbody>
              {dayNames.map((day, index) => {
                const dayHours = hours.find(h => h.day_of_week === index);
                
                return (
                  <tr key={index} className="border-t">
                    <td className="py-2 px-4">{day}</td>
                    <td className="py-2 px-4">
                      {dayHours ? dayHours.open_time.slice(0, 5) : 'not set'}
                    </td>
                    <td className="py-2 px-4">
                      {dayHours ? dayHours.close_time.slice(0, 5) : 'not set'}
                    </td>
                    <td className="py-2 px-4">
                      {dayHours ? dayHours.last_reservation_time.slice(0, 5) : 'not set'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
