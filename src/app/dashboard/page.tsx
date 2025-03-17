'use client';

import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { fetchAllCanvasData } from '@/utils/canvas';

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const loadCanvasData = async () => {
      try {
        const canvasData = await fetchAllCanvasData();
        console.log('All Canvas Data:', JSON.stringify(canvasData, null, 2));
      } catch (error) {
        console.error('Error fetching Canvas data:', error);
      }
    };

    loadCanvasData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Logout
          </button>
        </div>
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <p className="text-gray-600">Welcome to your dashboard!</p>
        </div>
      </div>
    </div>
  );
}
