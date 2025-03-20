'use client';

import { useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        router.push('/dashboard');
      } else {
        // If not authenticated, redirect to landing page
        router.push('/landing');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // This component will only be shown briefly before redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
