"use client";

import { useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { getTables, createTable, updateTable, deleteTable, TableCreate, Table } from '@/lib/api';

export default function TableSetup() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'layout'>('form');
  
  // Form state
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [formData, setFormData] = useState<TableCreate>({
    table_number: '',
    min_capacity: 2,
    max_capacity: 4,
    is_shared: false,
    location: null,
  });
  
  // Canvas state
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [dragging, setDragging] = useState(false);
  
  useEffect(() => {
    fetchTables();
  }, []);
  
  const fetchTables = async () => {
    try {
      setLoading(true);
      const data = await getTables();
      // Convert location strings to coordinates
      const tablesWithCoords = data.map(table => {
        if (table.location) {
          try {
            const [x, y] = table.location.split(',').map(Number);
            return {
              ...table,
              x,
              y
            };
          } catch (err) {
            console.warn(`Invalid location format for table ${table.table_number}: ${table.location}`);
            return {
              ...table,
              x: Math.random() * 400 + 100,
              y: Math.random() * 300 + 100
            };
          }
        } else {
          // Assign random position if no location set
          return {
            ...table,
            x: Math.random() * 400 + 100,
            y: Math.random() * 300 + 100
          };
        }
      });
      setTables(tablesWithCoords);
    } catch (err) {
      setError('Failed to load tables. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (formMode === 'create') {
        // Create new table
        await createTable(formData);
        // Reset form
        setFormData({
          table_number: '',
          min_capacity: 2,
          max_capacity: 4,
          is_shared: false,
          location: null,
        });
      } else if (formMode === 'edit' && selectedTable) {
        // Update existing table
        await updateTable(selectedTable.id, formData);
        setFormMode('create');
        setSelectedTable(null);
      }
      
      await fetchTables();
      setError(null);
    } catch (err) {
      setError(`Failed to ${formMode === 'create' ? 'create' : 'update'} table. Please try again.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditTable = (table: Table) => {
    setSelectedTable(table);
    setFormMode('edit');
    setFormData({
      table_number: table.table_number,
      min_capacity: table.min_capacity,
      max_capacity: table.max_capacity,
      is_shared: table.is_shared,
      location: table.location,
    });
    setActiveTab('form');
  };
  
  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('are you sure you want to delete this table?')) return;
    
    try {
      setLoading(true);
      await deleteTable(tableId);
      await fetchTables();
      
      if (selectedTable?.id === tableId) {
        setSelectedTable(null);
        setFormMode('create');
        setFormData({
          table_number: '',
          min_capacity: 2,
          max_capacity: 4,
          is_shared: false,
          location: null,
        });
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to delete table. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDragStop = (tableId: string, e: any, data: any) => {
    setDragging(false);
    
    // Find the table
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    // Update the location
    const newLocation = `${data.x},${data.y}`;
    
    // Update local state first (optimistic update)
    setTables(tables.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          location: newLocation,
          x: data.x,
          y: data.y
        };
      }
      return t;
    }));
    
    // Then send to server (don't wait with async/await in the event handler)
    updateTable(tableId, {
      ...table,
      location: newLocation
    }).catch(err => {
      console.error('Error updating table position:', err);
    });
  };
  
  if (loading && tables.length === 0) {
    return <div className="text-center py-4">loading tables...</div>;
  }
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">restaurant tables</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="flex mb-4 space-x-2">
        <button
          className={`px-4 py-2 rounded ${activeTab === 'form' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('form')}
        >
          add/edit tables
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'layout' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('layout')}
        >
          layout view
        </button>
      </div>
      
      {activeTab === 'form' ? (
        <div className="bg-gray-50 p-4 rounded">
          <form onSubmit={handleFormSubmit}>
            <h3 className="font-medium mb-3">
              {formMode === 'create' ? 'add new table' : `edit table ${selectedTable?.table_number}`}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">table number</label>
                <input
                  type="text"
                  value={formData.table_number}
                  onChange={(e) => setFormData({...formData, table_number: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">is shared table?</label>
                <select
                  value={formData.is_shared ? 'true' : 'false'}
                  onChange={(e) => setFormData({...formData, is_shared: e.target.value === 'true'})}
                  className="w-full p-2 border rounded"
                >
                  <option value="false">no</option>
                  <option value="true">yes</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">min capacity</label>
                <input
                  type="number"
                  min="1"
                  value={formData.min_capacity}
                  onChange={(e) => setFormData({...formData, min_capacity: parseInt(e.target.value)})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">max capacity</label>
                <input
                  type="number"
                  min={formData.min_capacity}
                  value={formData.max_capacity}
                  onChange={(e) => setFormData({...formData, max_capacity: parseInt(e.target.value)})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'saving...' : formMode === 'create' ? 'add table' : 'update table'}
              </button>
              
              {formMode === 'edit' && (
                <button
                  type="button"
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                  onClick={() => {
                    setFormMode('create');
                    setSelectedTable(null);
                    setFormData({
                      table_number: '',
                      min_capacity: 2,
                      max_capacity: 4,
                      is_shared: false,
                      location: null,
                    });
                  }}
                >
                  cancel
                </button>
              )}
            </div>
          </form>
          
          <div className="mt-6">
            <h3 className="font-medium mb-2">current tables</h3>
            
            {tables.length === 0 ? (
              <p className="text-gray-500">no tables yet. add your first table above.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 text-left">number</th>
                      <th className="py-2 px-4 text-left">capacity</th>
                      <th className="py-2 px-4 text-left">shared</th>
                      <th className="py-2 px-4 text-left">actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tables.map((table) => (
                      <tr key={table.id} className="border-t">
                        <td className="py-2 px-4">{table.table_number}</td>
                        <td className="py-2 px-4">
                          {table.min_capacity === table.max_capacity 
                            ? table.max_capacity 
                            : `${table.min_capacity}-${table.max_capacity}`}
                        </td>
                        <td className="py-2 px-4">{table.is_shared ? 'yes' : 'no'}</td>
                        <td className="py-2 px-4">
                          <button
                            onClick={() => handleEditTable(table)}
                            className="text-indigo-600 hover:text-indigo-800 mr-2"
                          >
                            edit
                          </button>
                          <button
                            onClick={() => handleDeleteTable(table.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-medium mb-3">restaurant layout</h3>
          
          {tables.length === 0 ? (
            <p className="text-gray-500">no tables yet. add tables first to view the layout.</p>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-4">drag tables to position them on the layout</p>
              
              <div 
                className="border border-gray-300 bg-white relative"
                style={{ width: `${canvasSize.width}px`, height: `${canvasSize.height}px`, margin: '0 auto' }}
              >
                {tables.map((table) => {
                  const x = typeof table.x === 'number' ? table.x : 100;
                  const y = typeof table.y === 'number' ? table.y : 100;
                  
                  return (
                    <Draggable
                      key={table.id}
                      defaultPosition={{ x, y }}
                      onStart={() => setDragging(true)}
                      onStop={(e, data) => handleDragStop(table.id, e, data)}
                      bounds="parent"
                    >
                      <div 
                        className={`absolute cursor-move p-2 rounded-lg border-2 ${
                          table.is_shared ? 'bg-purple-100 border-purple-400' : 'bg-indigo-100 border-indigo-400'
                        }`}
                        style={{ 
                          width: `${50 + table.max_capacity * 10}px`, 
                          height: `${50 + table.max_capacity * 5}px`,
                        }}
                      >
                        <div className="font-bold text-center">
                          {table.table_number}
                        </div>
                        <div className="text-xs text-center">
                          {table.max_capacity} seats
                        </div>
                      </div>
                    </Draggable>
                  );
                })}
              </div>
              
              <div className="mt-4 text-center">
                <button
                  onClick={() => setCanvasSize({ width: 800, height: 600 })}
                  className={`px-2 py-1 text-xs rounded ${
                    canvasSize.width === 800 ? 'bg-indigo-600 text-white' : 'bg-gray-200'
                  }`}
                >
                  small
                </button>
                <button
                  onClick={() => setCanvasSize({ width: 1000, height: 800 })}
                  className={`px-2 py-1 text-xs rounded ml-2 ${
                    canvasSize.width === 1000 ? 'bg-indigo-600 text-white' : 'bg-gray-200'
                  }`}
                >
                  medium
                </button>
                <button
                  onClick={() => setCanvasSize({ width: 1200, height: 1000 })}
                  className={`px-2 py-1 text-xs rounded ml-2 ${
                    canvasSize.width === 1200 ? 'bg-indigo-600 text-white' : 'bg-gray-200'
                  }`}
                >
                  large
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
