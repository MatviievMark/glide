import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin if it hasn't been initialized yet
if (!getApps().length) {
  // Get service account from environment variable
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccount) {
    throw new Error('Firebase service account key is required');
  }

  initializeApp({
    credential: cert(JSON.parse(serviceAccount))
  });
}

export const auth: Auth = getAuth();
