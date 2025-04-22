"use client";

import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, addDays, subDays } from 'date-fns';
import { getHours, getSpecialHoursByDate, RestaurantHours } from '@/lib/api';

interface DateNavigatorProps {
  onDateChange?: (date: Date | null) => void;
}

const DateNavigator: React.FC<DateNavigatorProps> = ({ onDateChange }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [hours, setHours] = useState<RestaurantHours[]>([]);
  const [specialHours, setSpecialHours] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchHours();
  }, []);

  useEffect(() => {
    fetchSpecialHours();
    // Call onDateChange callback if provided
    if (onDateChange) {
      onDateChange(selectedDate);
    }
  }, [selectedDate, onDateChange]);

  const fetchHours = async () => {
    try {
      setLoading(true);
      const data = await getHours();
      setHours(data);
    } catch (err) {
      console.error('Error fetching hours:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialHours = async () => {
    try {
      setLoading(true);
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const data = await getSpecialHoursByDate(formattedDate);
      setSpecialHours(data);
    } catch (err) {
      console.error('Error fetching special hours:', err);
      setSpecialHours(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevDay = () => {
    setSelectedDate(prevDate => subDays(prevDate, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(prevDate => addDays(prevDate, 1));
  };

  const getDayHours = () => {
    // First check for special hours
    if (specialHours) {
      if (specialHours.is_closed) {
        return { status: 'closed', hours: 'Closed (Special Day)' };
      }
      return {
        status: 'special',
        hours: `${specialHours.open_time.slice(0, 5)} - ${specialHours.close_time.slice(0, 5)} (${specialHours.name})`,
        name: specialHours.name
      };
    }

    // Otherwise check regular hours
    const dayOfWeek = selectedDate.getDay();
    // Convert to 0-6 where Monday is 0
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const dayHours = hours.find(h => h.day_of_week === adjustedDay);

    if (!dayHours) {
      return { status: 'closed', hours: 'Closed' };
    }

    return {
      status: 'open',
      hours: `${dayHours.open_time.slice(0, 5)} - ${dayHours.close_time.slice(0, 5)}`
    };
  };

  const dayInfo = getDayHours();

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={handlePrevDay}
          className="p-2 rounded-full hover:bg-gray-100"
          aria-label="Previous day"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        
        <div className="relative">
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null) => {
              if (date) {
                setSelectedDate(date);
              }
            }}
            customInput={
              <button className="text-xl font-bold px-4 py-2 rounded hover:bg-gray-100">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </button>
            }
          />
        </div>
        
        <button 
          onClick={handleNextDay}
          className="p-2 rounded-full hover:bg-gray-100"
          aria-label="Next day"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
      
      <div className="mt-3 text-center">
        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
          dayInfo.status === 'closed' 
            ? 'bg-red-100 text-red-800' 
            : dayInfo.status === 'special'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-green-100 text-green-800'
        }`}>
          {dayInfo.status === 'closed' 
            ? 'Closed Today' 
            : `Open: ${dayInfo.hours}`}
        </div>
        
        {dayInfo.status === 'special' && (
          <div className="mt-2 text-sm text-gray-600">
            {specialHours?.description}
          </div>
        )}
      </div>
    </div>
  );
};

export default DateNavigator;