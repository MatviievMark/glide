'use client';

import { useState, useEffect } from 'react';

interface CanvasData {
  user: {
    id: string;
    email: string;
    name: string;
    schoolName: string;
    createdAt: string;
    updatedAt: string;
  };
  canvasData: any[]; // Replace with proper type when we know the structure
}

export function useCanvasData() {
  const [data, setData] = useState<CanvasData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch fresh data
  const fetchFreshData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: localStorage.getItem('userEmail'),
          password: localStorage.getItem('userPassword'),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh data');
      }

      const freshData = await response.json();
      localStorage.setItem('userData', JSON.stringify(freshData.user));
      localStorage.setItem('canvasData', JSON.stringify(freshData.canvasData));
      setData(freshData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize data from localStorage or fetch if needed
  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    const storedCanvas = localStorage.getItem('canvasData');

    if (storedUser && storedCanvas) {
      setData({
        user: JSON.parse(storedUser),
        canvasData: JSON.parse(storedCanvas),
      });
      setIsLoading(false);
    } else {
      // If no stored data, redirect to login
      window.location.href = '/';
    }
  }, []);

  return {
    data,
    isLoading,
    error,
    refreshData: fetchFreshData,
  };
} 