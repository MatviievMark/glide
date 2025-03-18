import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

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

export async function POST(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('No valid authorization header found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the Firebase token
    const token = authHeader.split('Bearer ')[1];
    console.log('Verifying token...');
    const decodedToken = await getAuth().verifyIdToken(token);
    console.log('Token verified for user:', decodedToken.uid);
    
    // Get user's Canvas credentials from Firestore
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      console.error('User document not found for uid:', decodedToken.uid);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    if (!userData?.canvasApiKey || !userData?.canvasUrl) {
      console.error('Missing Canvas credentials for user:', decodedToken.uid);
      return NextResponse.json({ error: 'Canvas credentials not found' }, { status: 400 });
    }

    // Get the endpoint from the request body
    const body = await request.json();
    const { endpoint } = body;
    if (!endpoint) {
      console.error('No endpoint provided in request body');
      return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
    }

    console.log('Making Canvas API request to:', endpoint);
    
    // Make the request to Canvas
    const baseUrl = userData.canvasUrl.replace(/\/$/, '');
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${userData.canvasApiKey}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Canvas API error:', {
        endpoint,
        status: response.status,
        statusText: response.statusText
      });
      return NextResponse.json(
        { error: `Canvas API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Canvas API route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
