"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getTables, getHours, Table, RestaurantHours } from '@/lib/api';

export default function Dashboard() {
  const [tables, setTables] = useState<Table[]>([]);
  const [hours, setHours] = useState<RestaurantHours[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
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
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [router]);

  if (loading) {
    return <div className="text-center py-4">loading restaurant data...</div>;
  }

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">restaurant dashboard</h1>
        <div className="flex space-x-3">
          <Link
            href="/reservations"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            manage reservations
          </Link>
          
          <Link
            href="/"
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            edit setup
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">restaurant hours</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 text-left">day</th>
                  <th className="py-2 px-4 text-left">open</th>
                  <th className="py-2 px-4 text-left">close</th>
                </tr>
              </thead>
              <tbody>
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day, index) => {
                  const dayHours = hours.find(h => h.day_of_week === index);
                  
                  return (
                    <tr key={index} className="border-t">
                      <td className="py-2 px-4 capitalize">{day}</td>
                      <td className="py-2 px-4">
                        {dayHours ? dayHours.open_time.slice(0, 5) : 'closed'}
                      </td>
                      <td className="py-2 px-4">
                        {dayHours ? dayHours.close_time.slice(0, 5) : 'closed'}
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
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">restaurant layout</h2>
        
        <div 
          className="border border-gray-300 bg-white relative mx-auto"
          style={{ width: '800px', height: '600px' }}
        >
          {tables.map((table) => {
            const x = typeof table.x === 'number' ? table.x : 100;
            const y = typeof table.y === 'number' ? table.y : 100;
            
            return (
              <div
                key={table.id}
                className={`absolute p-2 rounded-lg border-2 ${
                  table.is_shared ? 'bg-purple-100 border-purple-400' : 'bg-indigo-100 border-indigo-400'
                }`}
                style={{ 
                  width: `${50 + table.max_capacity * 10}px`, 
                  height: `${50 + table.max_capacity * 5}px`,
                  left: `${x}px`,
                  top: `${y}px`
                }}
              >
                <div className="font-bold text-center">
                  {table.table_number}
                </div>
                <div className="text-xs text-center">
                  {table.max_capacity} seats
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
