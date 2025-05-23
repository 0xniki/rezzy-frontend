"use client";

import { useState, useEffect, useRef } from 'react';
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
  const [gridSize, setGridSize] = useState(20);
  const [showGrid, setShowGrid] = useState(true);
  
  // Drag state
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  
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
  
  // Handle mouse events for dragging
  const handleMouseDown = (tableId: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    // Calculate drag offset from the center of the table
    const tableWidth = Math.floor((50 + table.max_capacity * 10) * 1.25);
    const tableHeight = Math.floor((50 + table.max_capacity * 5) * 1.25);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate offset from the mouse to the center of the table
    const offsetX = e.nativeEvent.offsetX - centerX;
    const offsetY = e.nativeEvent.offsetY - centerY;
    
    setDragOffset({ x: offsetX, y: offsetY });
    setDragging(tableId);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Don't let tables go outside the canvas
    const table = tables.find(t => t.id === dragging);
    if (!table) return;
    
    // 25% larger table dimensions
    const width = Math.floor((50 + table.max_capacity * 10) * 1.25);
    const height = Math.floor((50 + table.max_capacity * 5) * 1.25);
    
    // Calculate the position, adjusting for the offset from center
    let newX = x - dragOffset.x;
    let newY = y - dragOffset.y;
    
    // Snap to grid
    if (showGrid) {
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
    }
    
    // Calculate bounded coordinates
    // (center position, not top-left, so subtract half width/height)
    const boundedX = Math.max(width / 2, Math.min(canvasSize.width - width / 2, newX));
    const boundedY = Math.max(height / 2, Math.min(canvasSize.height - height / 2, newY));
    
    // Update the table position locally
    // Convert from center position to top-left for rendering
    setTables(tables.map(t => 
      t.id === dragging 
        ? { ...t, x: boundedX - width / 2, y: boundedY - height / 2 } 
        : t
    ));
  };
  
  const handleMouseUp = async () => {
    if (!dragging) return;
    
    // Find the table
    const table = tables.find(t => t.id === dragging);
    if (!table) return;
    
    // Update the location in the database
    const newLocation = `${table.x},${table.y}`;
    
    try {
      await updateTable(table.id, {
        ...table,
        location: newLocation
      });
    } catch (err) {
      console.error('Error updating table position:', err);
    }
    
    setDragging(null);
    setDragOffset({ x: 0, y: 0 });
  };
  
  // Helper function to create grid lines
  const renderGrid = () => {
    if (!showGrid) return null;
    
    const lines = [];
    
    // Vertical lines
    for (let x = 0; x <= canvasSize.width; x += gridSize) {
      lines.push(
        <line 
          key={`v-${x}`} 
          x1={x} 
          y1={0} 
          x2={x} 
          y2={canvasSize.height} 
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="1"
        />
      );
    }
    
    // Horizontal lines
    for (let y = 0; y <= canvasSize.height; y += gridSize) {
      lines.push(
        <line 
          key={`h-${y}`} 
          x1={0} 
          y1={y} 
          x2={canvasSize.width} 
          y2={y} 
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="1"
        />
      );
    }
    
    return (
      <svg 
        className="absolute top-0 left-0 w-full h-full pointer-events-none" 
        width={canvasSize.width} 
        height={canvasSize.height}
      >
        {lines}
      </svg>
    );
  };
  
  if (loading && tables.length === 0) {
    return <div className="text-center py-4"></div>;
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
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-500">drag tables to position them on the layout</p>
                
                <div className="flex items-center space-x-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowGrid(!showGrid)}
                      className="px-2 py-1 text-xs rounded hover:bg-gray-300"
                    >
                      {showGrid ? 'hide grid' : 'show grid'}
                    </button>
                    
                    <button
                      onClick={() => setGridSize(gridSize === 10 ? 20 : gridSize === 20 ? 40 : 10)}
                      className="px-2 py-1 text-xs rounded hover:bg-gray-300"
                    >
                      grid: {gridSize}px
                    </button>
                  </div>
                  
                  <div className="flex space-x-2">
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
                      className={`px-2 py-1 text-xs rounded ${
                        canvasSize.width === 1000 ? 'bg-indigo-600 text-white' : 'bg-gray-200'
                      }`}
                    >
                      medium
                    </button>
                    <button
                      onClick={() => setCanvasSize({ width: 1200, height: 1000 })}
                      className={`px-2 py-1 text-xs rounded ${
                        canvasSize.width === 1200 ? 'bg-indigo-600 text-white' : 'bg-gray-200'
                      }`}
                    >
                      large
                    </button>
                  </div>
                </div>
              </div>
              
              <div 
                ref={canvasRef}
                className="border border-gray-300 bg-white relative"
                style={{ 
                  width: `${canvasSize.width}px`, 
                  height: `${canvasSize.height}px`, 
                  margin: '0 auto',
                  overflow: 'hidden'
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {renderGrid()}
                
                {tables.map((table) => {
                  const x = typeof table.x === 'number' ? table.x : 100;
                  const y = typeof table.y === 'number' ? table.y : 100;
                  
                  // 25% larger table dimensions
                  const width = Math.floor((50 + table.max_capacity * 10) * 1.25);
                  const height = Math.floor((50 + table.max_capacity * 5) * 1.25);
                  
                  return (
                    <div 
                      key={table.id}
                      className={`absolute p-2 rounded-lg border-2 ${
                        table.is_shared ? 'bg-purple-100 border-purple-400' : 'bg-indigo-100 border-indigo-400'
                      } ${dragging === table.id ? 'cursor-grabbing z-10' : 'cursor-grab'} flex items-center justify-center`}
                      style={{ 
                        width: `${width}px`, 
                        height: `${height}px`,
                        left: `${x}px`,
                        top: `${y}px`,
                        touchAction: 'none'
                      }}
                      onMouseDown={handleMouseDown(table.id)}
                    >
                      <div className="text-center">
                        <div className="font-bold text-lg">{table.table_number}</div>
                        <div className="text-sm">{table.max_capacity} seats</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
