'use client';

import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchAllCanvasData } from '@/utils/canvas';
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



  useEffect(() => {
    const loadCanvasData = async () => {
      try {
        const data = await fetchAllCanvasData();
        console.log('All Canvas Data:', JSON.stringify(data, null, 2));
        setCanvasData(data);
        
        // Extract user profile information from Canvas data
        const userProfile = extractUserProfile(data);
        setUserName(userProfile.userName);
        setUserMajor(userProfile.userMajor);
        setUserInitials(userProfile.userInitials);
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
    <Dashboard 
      userName={userName}
      userMajor={userMajor}
      userInitials={userInitials}
      onLogout={handleLogout}
      canvasData={canvasData}
    />
  );
}
