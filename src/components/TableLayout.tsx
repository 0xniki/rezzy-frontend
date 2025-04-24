"use client";

import { useState, useEffect, useRef } from 'react';
import { Table, getReservations } from '@/lib/api';
import { format } from 'date-fns';

interface TableLayoutProps {
  tables: Table[];
  onTableClick: (table: Table) => void;
  selectedDate: Date;  // Add selectedDate prop
}

// Define a type for the reservation response
interface ReservationResponse {
  id: string;
  reservation_date: string;
  start_time: string;
  duration_minutes: number;
  status: string;
  tables: {
    id: string;
    table_number: string;
    [key: string]: any; // For other table properties
  }[];
  [key: string]: any; // For other reservation properties
}

interface TableLayoutProps {
  tables: Table[];
  onTableClick: (table: Table) => void;
  selectedDate: Date;  // Add selectedDate prop
}

export default function TableLayout({ tables, onTableClick, selectedDate }: TableLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [maxBounds, setMaxBounds] = useState({ right: 0, bottom: 0 });
  
  // State to store tables' reservation status
  const [reservedTables, setReservedTables] = useState<Record<string, boolean>>({});
  
  // Function to check if tables are reserved or in use
  const checkTableReservations = async () => {
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const now = new Date();
      const currentTime = format(now, 'HH:mm');
      
      // Get all reservations for the selected date
      const reservations = await getReservations({
        date_from: formattedDate,
        date_to: formattedDate,
        status: ['confirmed', 'seated'] // Only consider confirmed or seated reservations
      });
      
      // Create a map of table IDs to their reservation status
      const tableStatus: Record<string, boolean> = {};
      
      reservations.forEach((reservation: ReservationResponse) => {
        // Check if this reservation is happening now or starts within the next hour
        const reservationTime = reservation.start_time.slice(0, 5); // Format: HH:MM
        const endTimeDate = new Date(
          `${reservation.reservation_date}T${reservation.start_time}`
        );
        endTimeDate.setMinutes(endTimeDate.getMinutes() + reservation.duration_minutes);
        const endTime = format(endTimeDate, 'HH:mm');
        
        // Calculate one hour from now for the "reserved soon" check
        const oneHourFromNow = new Date(now);
        oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
        const oneHourFromNowTime = format(oneHourFromNow, 'HH:mm');
        
        // Check if reservation is active now or starts within the next hour
        const isActive = (
          // Reservation is happening now
          (reservationTime <= currentTime && endTime > currentTime) || 
          // Reservation starts within the next hour
          (reservationTime > currentTime && reservationTime <= oneHourFromNowTime)
        );
        
        if (isActive) {
          // Mark all tables for this reservation as reserved
          reservation.tables.forEach((table: {id: string}) => {
            tableStatus[table.id] = true;
          });
        }
      });
      
      setReservedTables(tableStatus);
    } catch (error) {
      console.error('Error checking table reservations:', error);
    }
  };
  
  // Call the check on mount and every 5 minutes
  useEffect(() => {
    // Initial check
    checkTableReservations();
    
    // Set up automatic refresh every 5 minutes
    const intervalId = setInterval(() => {
      checkTableReservations();
    }, 5 * 60 * 1000); // 5 minutes in milliseconds
    
    // Clean up
    return () => clearInterval(intervalId);
  }, [selectedDate]); // Re-run when selected date changes
  
  // Calculate container dimensions based on table positions
  useEffect(() => {
    if (tables.length === 0) return;
    
    // Find the boundaries of all tables
    let maxRight = 0;
    let maxBottom = 0;
    let minLeft = Infinity;
    let minTop = Infinity;
    
    tables.forEach((table) => {
      const x = typeof table.x === 'number' ? table.x : 100;
      const y = typeof table.y === 'number' ? table.y : 100;
      
      // Apply the 25% size increase
      const width = Math.floor((50 + table.max_capacity * 10) * 1.25);
      const height = Math.floor((50 + table.max_capacity * 5) * 1.25);
      
      const right = x + width;
      const bottom = y + height;
      
      if (x < minLeft) minLeft = x;
      if (y < minTop) minTop = y;
      if (right > maxRight) maxRight = right;
      if (bottom > maxBottom) maxBottom = bottom;
    });

    // Store the maximum bounds for debugging/reference
    setMaxBounds({ right: maxRight, bottom: maxBottom });

    // Add more padding for tables at edges
    const padding = 60; // Increased padding from 40 to 60
    const contentWidth = maxRight - minLeft + (padding * 2);
    const contentHeight = maxBottom - minTop + (padding * 2);
    
    setDimensions({
      width: Math.max(contentWidth, 1000), // Increased min width from 800 to 1000
      height: Math.max(contentHeight, 600) // min height of 600px
    });
  }, [tables]);
  
  // Add resize handling
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      
      // Get the parent container's width
      const parentElement = containerRef.current.closest('.layout-container') || containerRef.current.parentElement;
      if (!parentElement) return;
      
      const parentWidth = parentElement.clientWidth;
      const parentHeight = parentElement.clientHeight;
      
      if (parentWidth === 0 || parentHeight === 0) return;
      
      // Calculate scale for both width and height
      const widthScale = (parentWidth - 40) / dimensions.width; // 40px for padding
      const heightScale = (parentHeight - 60) / dimensions.height; // 60px for padding + heading
      
      // Use the smaller scale to ensure everything fits
      const newScale = Math.min(widthScale, heightScale, 1); // Cap at 1 to avoid scaling up
      
      setScale(newScale);
    };
    
    // Initial calculation
    handleResize();
    
    // Add event listeners
    window.addEventListener('resize', handleResize);
    
    // Also handle sidebar toggle events
    const handleSidebarToggle = () => {
      // Small delay to allow the sidebar transition to complete
      setTimeout(handleResize, 300);
    };
    
    window.addEventListener('toggle-sidebar', handleSidebarToggle as any);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('toggle-sidebar', handleSidebarToggle as any);
    };
  }, [dimensions]);
  
  return (
    <div 
      className="table-layout-container border border-gray-300 bg-white overflow-hidden" 
      ref={containerRef}
      style={{ 
        height: `${dimensions.height * scale}px`,
        width: '100%'
      }}
    >
      <div
        className="table-layout-content relative"
        style={{ 
          width: `${dimensions.width}px`, 
          height: `${dimensions.height}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left'
        }}
      >
        {tables.map((table) => {
          const x = typeof table.x === 'number' ? table.x : 100;
          const y = typeof table.y === 'number' ? table.y : 100;
          
          // Apply the 25% size increase
          const width = Math.floor((50 + table.max_capacity * 10) * 1.25);
          const height = Math.floor((50 + table.max_capacity * 5) * 1.25);
          
          // Check if table is reserved or in use
          const isReserved = reservedTables[table.id] || false;
          
          // Choose the appropriate class based on reservation status
          const tableClass = isReserved 
            ? 'bg-red-100 border-red-400' 
            : table.is_shared 
              ? 'bg-purple-100 border-purple-400' 
              : 'bg-indigo-100 border-indigo-400';
          
          return (
            <div
              key={table.id}
              className={`absolute p-2 rounded-lg border-2 ${tableClass} cursor-pointer hover:shadow-lg transition-shadow duration-200 flex items-center justify-center`}
              style={{ 
                width: `${width}px`, 
                height: `${height}px`,
                left: `${x}px`,
                top: `${y}px`
              }}
              onClick={() => onTableClick(table)}
            >
              <div className="text-center">
                <div className="font-bold text-lg">{table.table_number}</div>
                <div className="text-sm">{table.max_capacity} seats</div>
                {isReserved && (
                  <div className="text-xs mt-1 text-red-600 font-medium">
                    {/* You could add more specific status info here */}
                    Reserved
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
