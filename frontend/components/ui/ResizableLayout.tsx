"use client";

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ResizableLayoutProps {
  children: React.ReactNode[];
  defaultSizes?: number[];
  minSizes?: number[];
  className?: string;
}

const ResizableLayout: React.FC<ResizableLayoutProps> = ({
  children,
  defaultSizes = [50, 25, 25], // Default: 50% PDF, 25% each panel
  minSizes = [30, 15, 15], // Minimum sizes in percentage
  className
}) => {
  const [sizes, setSizes] = useState<number[]>(defaultSizes);
  const [isDragging, setIsDragging] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef<number>(0);
  const startSizesRef = useRef<number[]>([]);

  const handleMouseDown = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(index);
    startPosRef.current = e.clientX;
    startSizesRef.current = [...sizes];
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging === null || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const deltaX = e.clientX - startPosRef.current;
    const deltaPercent = (deltaX / containerWidth) * 100;

    const newSizes = [...startSizesRef.current];
    const totalSize = newSizes.reduce((sum, size) => sum + size, 0);
    
    // Calculate new sizes
    if (isDragging === 0) {
      // Resizing first panel (PDF viewer)
      const newFirstSize = Math.max(minSizes[0], Math.min(70, newSizes[0] + deltaPercent));
      const remainingSize = totalSize - newFirstSize;
      const secondRatio = newSizes[1] / (newSizes[1] + newSizes[2]);
      const thirdRatio = newSizes[2] / (newSizes[1] + newSizes[2]);
      
      newSizes[0] = newFirstSize;
      newSizes[1] = Math.max(minSizes[1], remainingSize * secondRatio);
      newSizes[2] = Math.max(minSizes[2], remainingSize * thirdRatio);
    } else if (isDragging === 1) {
      // Resizing between second and third panels
      const newSecondSize = Math.max(minSizes[1], Math.min(50, newSizes[1] + deltaPercent));
      const newThirdSize = totalSize - newSizes[0] - newSecondSize;
      
      if (newThirdSize >= minSizes[2]) {
        newSizes[1] = newSecondSize;
        newSizes[2] = newThirdSize;
      }
    }

    setSizes(newSizes);
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  useEffect(() => {
    if (isDragging !== null) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  const resetToDefault = () => {
    setSizes(defaultSizes);
  };

  return (
    <div className={cn("flex h-full", className)} ref={containerRef}>
      {children.map((child, index) => (
        <React.Fragment key={index}>
          <div 
            className="flex flex-col overflow-hidden"
            style={{ width: `${sizes[index]}%` }}
          >
            {child}
          </div>
          {index < children.length - 1 && (
            <div className="relative w-1 bg-gray-200 hover:bg-gray-300 transition-colors cursor-col-resize group">
              <div
                className="absolute inset-0 w-2 -ml-1 cursor-col-resize"
                onMouseDown={(e) => handleMouseDown(index, e)}
              />
              <div className="absolute inset-y-0 left-1/2 w-0.5 bg-gray-400 group-hover:bg-gray-500 transition-colors" />
            </div>
          )}
        </React.Fragment>
      ))}
      
      {/* Reset button - positioned absolutely */}
      <button
        onClick={resetToDefault}
        className="absolute top-2 right-2 z-10 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded opacity-0 hover:opacity-100 transition-opacity"
        title="Reset to default sizes"
      >
        Reset
      </button>
    </div>
  );
};

export default ResizableLayout; 