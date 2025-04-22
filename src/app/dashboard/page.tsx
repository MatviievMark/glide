'use client';

import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchAllCanvasDataFromBackend, isCacheExpired, clearCanvasCache } from '@/utils/canvas';
import Dashboard from '@/components/dashboard/Dashboard';
import { extractUserProfile } from '@/utils/dashboardHelpers';

// Import the type from the canvas utility
type CanvasDataResponse = Record<string, { data: unknown | null; error: string | null }>;

export default function DashboardPage() {
  const router = useRouter();
  const [canvasData, setCanvasData] = useState<CanvasDataResponse | null>(null);
  const [userName, setUserName] = useState('Student');
  const [userMajor, setUserMajor] = useState('Undeclared');
  const [userInitials, setUserInitials] = useState('ST');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCanvasData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check if we need to refresh the cache
        const shouldRefresh = isCacheExpired(30);

        if (shouldRefresh) {
          console.log('Cache expired or not found, fetching fresh Canvas data');
        } else {
          console.log('Using cached Canvas data');
        }

        // Fetch data from the Python backend
        const data = await fetchAllCanvasDataFromBackend();

        if (Object.keys(data).length === 0) {
          setError('Failed to fetch Canvas data. Please try again later.');
        } else {
          console.log('Canvas data loaded successfully');
          setCanvasData(data);

          // Extract user profile information from Canvas data
          const userProfile = extractUserProfile(data);
          setUserName(userProfile.userName);
          setUserMajor(userProfile.userMajor);
          setUserInitials(userProfile.userInitials);
        }
      } catch (error) {
        console.error('Error fetching Canvas data:', error);
        setError('An error occurred while fetching Canvas data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadCanvasData();

    // Set up a refresh interval (every 30 minutes)
    const refreshInterval = setInterval(() => {
      console.log('Refreshing Canvas data in the background');
      loadCanvasData();
    }, 30 * 60 * 1000); // 30 minutes

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  const handleLogout = async () => {
    try {
      // Clear Canvas cache when logging out
      clearCanvasCache();
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleRefresh = async () => {
    // Force a refresh of the Canvas data
    clearCanvasCache();
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAllCanvasDataFromBackend();
      setCanvasData(data);

      // Extract user profile information from Canvas data
      const userProfile = extractUserProfile(data);
      setUserName(userProfile.userName);
      setUserMajor(userProfile.userMajor);
      setUserInitials(userProfile.userInitials);
    } catch (error) {
      console.error('Error refreshing Canvas data:', error);
      setError('An error occurred while refreshing Canvas data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dashboard
      userName={userName}
      userMajor={userMajor}
      userInitials={userInitials}
      onLogout={handleLogout}
      onRefresh={handleRefresh}
      canvasData={canvasData}
      loading={loading}
      error={error}
    />
  );
}
