'use client';

import { useEffect } from 'react';
import { useCanvasData } from '../hooks/useCanvasData';

export default function Dashboard() {
  const { data, isLoading, error, refreshData } = useCanvasData();

  // Log data whenever it changes
  useEffect(() => {
    if (data) {
      console.log('User Data:', data.user);
      console.log('Canvas Data:', data.canvasData);
    }
  }, [data]);

  // Handle hard refresh
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        refreshData();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [refreshData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-4 text-gray-600">
          Welcome back, {data?.user.name}
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Check the console to see your Canvas data
        </p>
      </div>
    </div>
  );
} 