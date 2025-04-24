"use client";

import { useState, useEffect, useRef } from 'react';
import { Table } from '@/lib/api';

interface TableLayoutProps {
  tables: Table[];
  onTableClick: (table: Table) => void;
}

export default function TableLayout({ tables, onTableClick }: TableLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [maxBounds, setMaxBounds] = useState({ right: 0, bottom: 0 });
  
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
      const width = 50 + table.max_capacity * 10;
      const height = 50 + table.max_capacity * 5;
      
      const right = x + width;
      const bottom = y + height;
      
      if (x < minLeft) minLeft = x;
      if (y < minTop) minTop = y;
      if (right > maxRight) maxRight = right;
      if (bottom > maxBottom) maxBottom = bottom;
    });

    // Store the maximum bounds for debugging/reference
    setMaxBounds({ right: maxRight, bottom: maxBottom });

    // Add padding
    const padding = 40; // Increased padding
    const contentWidth = maxRight - minLeft + (padding * 2);
    const contentHeight = maxBottom - minTop + (padding * 2);
    
    setDimensions({
      width: Math.max(contentWidth, 800), // min width of 800px
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
          
          return (
            <div
              key={table.id}
              className={`absolute p-2 rounded-lg border-2 ${
                table.is_shared ? 'bg-purple-100 border-purple-400' : 'bg-indigo-100 border-indigo-400'
              } cursor-pointer hover:shadow-lg transition-shadow duration-200`}
              style={{ 
                width: `${50 + table.max_capacity * 10}px`, 
                height: `${50 + table.max_capacity * 5}px`,
                left: `${x}px`,
                top: `${y}px`
              }}
              onClick={() => onTableClick(table)}
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
  );
}
