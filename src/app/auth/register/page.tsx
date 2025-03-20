'use client';

import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [canvasApiKey, setCanvasApiKey] = useState('');
  const [canvasUrl, setCanvasUrl] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        router.push('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create the user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Store additional user data in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        canvasApiKey,
        canvasUrl,
        createdAt: new Date().toISOString()
      });

      router.push('/dashboard');
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-8 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
        <div>
          <Link href="/landing" className="block text-center">
            <span className="text-2xl font-bold text-blue-400">Glide</span>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Or{' '}
            <Link href="/login" className="font-medium text-blue-400 hover:text-blue-300">
              sign in to your existing account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/20 p-3 rounded-lg border border-red-800">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-3">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-500 text-gray-200 bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-500 text-gray-200 bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="canvas-url" className="sr-only">
                Canvas URL
              </label>
              <input
                id="canvas-url"
                name="canvas-url"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-500 text-gray-200 bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Canvas URL (e.g., https://canvas.instructure.com)"
                value={canvasUrl}
                onChange={(e) => setCanvasUrl(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="canvas-api-key" className="sr-only">
                Canvas API Key
              </label>
              <input
                id="canvas-api-key"
                name="canvas-api-key"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-500 text-gray-200 bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Canvas API Key"
                value={canvasApiKey}
                onChange={(e) => setCanvasApiKey(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Sign up
            </button>
          </div>
        </form>
        <div className="text-center">
          <Link href="/login" className="text-gray-400 hover:text-gray-300 text-sm">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
