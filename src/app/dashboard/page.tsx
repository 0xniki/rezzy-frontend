"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { getTables, getHours, getSpecialHoursByDate, Table, RestaurantHours } from '@/lib/api';
import DateNavigator from '@/components/DateNavigator';
import TableReservationsModal from '@/components/TableReservationsModal';
import TableLayout from '@/components/TableLayout';
import ReservationSidebar from '@/components/SideBar';

export default function Dashboard() {
  const [tables, setTables] = useState<Table[]>([]);
  const [hours, setHours] = useState<RestaurantHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const [weeklyHours, setWeeklyHours] = useState<any[]>([]);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    
    fetchData();

    // Listen for sidebar toggle events from navbar
    const handleSidebarToggle = (e: CustomEvent) => {
      setIsSidebarOpen(e.detail.isOpen);
    };

    window.addEventListener('toggle-sidebar' as any, handleSidebarToggle);
    
    return () => {
      window.removeEventListener('toggle-sidebar' as any, handleSidebarToggle);
    };
  }, [router]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    
    // Dispatch event for other components to react
    const event = new CustomEvent('toggle-sidebar', { 
      detail: { isOpen: !isSidebarOpen } 
    });
    window.dispatchEvent(event);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tablesData, hoursData] = await Promise.all([
        getTables(),
        getHours()
      ]);
      
      // Add coordinates for visualization
      const tablesWithCoords = tablesData.map(table => {
        if (table.location) {
          try {
            const [x, y] = table.location.split(',').map(Number);
            return {
              ...table,
              x,
              y
            };
          } catch (err) {
            return {
              ...table,
              x: Math.random() * 400 + 100,
              y: Math.random() * 300 + 100
            };
          }
        } else {
          return {
            ...table,
            x: Math.random() * 400 + 100,
            y: Math.random() * 300 + 100
          };
        }
      });
      
      setTables(tablesWithCoords);
      setHours(hoursData);
      
      // Also fetch the weekly hours for the selected date
      await fetchWeeklyHours(selectedDate);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyHours = async (date: Date) => {
    try {
      const regularHours = await getHours();
      
      // Get start of week (Monday)
      const dayOfWeek = date.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Sunday
      const monday = new Date(date);
      monday.setDate(date.getDate() - diff);
      
      // Get all dates for the week
      const weekDates = Array.from({length: 7}, (_, i) => {
        const currentDate = new Date(monday);
        currentDate.setDate(monday.getDate() + i);
        return format(currentDate, 'yyyy-MM-dd');
      });
      
      // Batch fetch all special hours for the week
      const specialDaysPromises = weekDates.map(date => getSpecialHoursByDate(date));
      const specialDays = await Promise.all(specialDaysPromises);
      
      // Initialize weekly hours with regular hours
      const weekHours = [];
      
      // For each day of the week
      for (let i = 0; i < 7; i++) {
        const specialDay = specialDays[i];
        
        if (specialDay) {
          // Use special hours
          weekHours.push({
            day: i,
            date: weekDates[i],
            isSpecial: true,
            name: specialDay.name,
            isClosed: specialDay.is_closed,
            openTime: specialDay.is_closed ? null : specialDay.open_time,
            closeTime: specialDay.is_closed ? null : specialDay.close_time
          });
        } else {
          // Use regular hours
          const dayHours = regularHours.find(h => h.day_of_week === i);
          weekHours.push({
            day: i,
            date: weekDates[i],
            isSpecial: false,
            name: null,
            isClosed: !dayHours,
            openTime: dayHours ? dayHours.open_time : null,
            closeTime: dayHours ? dayHours.close_time : null
          });
        }
      }
      
      setWeeklyHours(weekHours);
    } catch (err) {
      console.error('Error fetching weekly hours:', err);
    }
  };

  const handleDateChange = (date: Date | null) => {
    if (date && selectedDate.toDateString() !== date.toDateString()) {
      setSelectedDate(date);
      fetchWeeklyHours(date);
    }
  };

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTable(null);
  };

  // Force layout recalculation when sidebar state changes
  useEffect(() => {
    // Trigger a resize event after the sidebar transition completes
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
    
    return () => clearTimeout(timer);
  }, [isSidebarOpen]);

  if (loading) {
    return <div className="text-center py-4">loading restaurant data...</div>;
  }

  return (
    <div className="py-6 dashboard-page">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={toggleSidebar}
          className="md:hidden flex items-center space-x-2 text-gray-400 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
          <span>Today's Reservations</span>
        </button>
      </div>
      
      {/* Date Navigator Component */}
      <DateNavigator onDateChange={handleDateChange} />
      
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">restaurant hours</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 text-left">day</th>
                  <th className="py-2 px-4 text-left">open</th>
                  <th className="py-2 px-4 text-left">close</th>
                  <th className="py-2 px-4 text-left">notes</th>
                </tr>
              </thead>
              <tbody>
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day, index) => {
                  const dayData = weeklyHours[index];
                  const isToday = dayData && new Date(dayData.date).toDateString() === new Date().toDateString();
                  
                  return (
                    <tr key={index} className={`border-t ${isToday ? 'bg-blue-50' : ''}`}>
                      <td className="py-2 px-4 capitalize">{day}</td>
                      <td className="py-2 px-4">
                        {dayData?.isClosed ? (
                          <span className="text-red-600">closed</span>
                        ) : (
                          dayData?.openTime ? dayData.openTime.slice(0, 5) : 'not set'
                        )}
                      </td>
                      <td className="py-2 px-4">
                        {dayData?.isClosed ? (
                          <span className="text-red-600">closed</span>
                        ) : (
                          dayData?.closeTime ? dayData.closeTime.slice(0, 5) : 'not set'
                        )}
                      </td>
                      <td className="py-2 px-4">
                        {dayData?.isSpecial && (
                          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                            {dayData.name}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">tables summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-100 p-4 rounded">
              <div className="text-2xl font-bold">{tables.length}</div>
              <div className="text-gray-500">total tables</div>
            </div>
            <div className="bg-gray-100 p-4 rounded">
              <div className="text-2xl font-bold">
                {tables.reduce((sum, table) => sum + table.max_capacity, 0)}
              </div>
              <div className="text-gray-500">total capacity</div>
            </div>
            <div className="bg-gray-100 p-4 rounded">
              <div className="text-2xl font-bold">
                {tables.filter(t => t.is_shared).length}
              </div>
              <div className="text-gray-500">shared tables</div>
            </div>
            <div className="bg-gray-100 p-4 rounded">
              <div className="text-2xl font-bold">
                {tables.filter(t => !t.is_shared).length}
              </div>
              <div className="text-gray-500">private tables</div>
            </div>
          </div>
        </div>
      </div> */}

      <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="bg-white rounded-lg shadow p-6 layout-container">
          <TableLayout tables={tables} onTableClick={handleTableClick} />
        </div>
      </div>

      {/* Table Reservations Modal */}
      {selectedTable && (
        <TableReservationsModal
          isOpen={isModalOpen}
          onClose={closeModal}
          tableId={selectedTable.id}
          tableNumber={selectedTable.table_number}
          date={selectedDate}
        />
      )}

      {/* Reservation Sidebar */}
      <ReservationSidebar
        isOpen={isSidebarOpen}
        onClose={() => toggleSidebar()}
        selectedDate={selectedDate}
      />
    </div>
  );
}
