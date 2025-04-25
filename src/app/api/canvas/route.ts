import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin if it hasn't been initialized yet
let firebaseAdminInitialized = false;

try {
  if (!getApps().length) {
    // Get service account from environment variable
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccount) {
      console.error('Firebase service account key is missing');
    } else {
      initializeApp({
        credential: cert(JSON.parse(serviceAccount))
      });
      firebaseAdminInitialized = true;
      console.log('Firebase Admin initialized successfully');
    }
  } else {
    firebaseAdminInitialized = true;
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
}

// Python backend URL
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:5000';

// Initialize Canvas API for a user
async function initializeCanvasForUser(userId: string) {
  try {
    const response = await fetch(`${PYTHON_BACKEND_URL}/api/canvas/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId
        // No need to pass Canvas credentials - they will be fetched from Firebase
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to initialize Canvas API:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error initializing Canvas API:', error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    // Check if Firebase Admin is initialized
    if (!firebaseAdminInitialized) {
      console.error('Firebase Admin is not initialized');
      return NextResponse.json({ error: 'Firebase Admin is not initialized. Check server logs.' }, { status: 500 });
    }

    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('No valid authorization header found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the Firebase token
    const token = authHeader.split('Bearer ')[1];
    console.log('Verifying token...');

    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
      console.log('Token verified for user:', decodedToken.uid);
    } catch (error) {
      console.error('Error verifying token:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user's Canvas credentials from Firestore
    const db = getFirestore();
    let userDoc;
    try {
      userDoc = await db.collection('users').doc(decodedToken.uid).get();
      if (!userDoc.exists) {
        console.error('User document not found for uid:', decodedToken.uid);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    } catch (error) {
      console.error('Error fetching user document:', error);
      return NextResponse.json({ error: 'Error fetching user data' }, { status: 500 });
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

    // Initialize Canvas API for this user if needed
    await initializeCanvasForUser(decodedToken.uid);

    // Map the Canvas API endpoint to our Python backend endpoint
    let pythonEndpoint = '';
    let method = 'GET';
    let queryParams = `?user_id=${decodedToken.uid}`;

    // Parse the endpoint to determine which Python backend endpoint to call
    if (endpoint === '/api/v1/courses') {
      pythonEndpoint = '/api/canvas/all-classes';
    } else if (endpoint.startsWith('/api/v1/courses/') && endpoint.endsWith('/assignments')) {
      const courseId = endpoint.split('/')[4];
      pythonEndpoint = `/api/canvas/class-assignments/${courseId}`;
    } else if (endpoint.startsWith('/api/v1/courses/') && endpoint.endsWith('/modules')) {
      const courseId = endpoint.split('/')[4];
      pythonEndpoint = `/api/canvas/course-modules/${courseId}`;
    } else if (endpoint.startsWith('/api/v1/courses/') && endpoint.endsWith('/discussion_topics')) {
      const courseId = endpoint.split('/')[4];
      pythonEndpoint = `/api/canvas/course-discussions/${courseId}`;
    } else if (endpoint.startsWith('/api/v1/courses/') && endpoint.endsWith('/announcements')) {
      const courseId = endpoint.split('/')[4];
      pythonEndpoint = `/api/canvas/course-announcements/${courseId}`;
    } else if (endpoint.startsWith('/api/v1/courses/') && endpoint.endsWith('/professors')) {
      const courseId = endpoint.split('/')[4];
      pythonEndpoint = `/api/canvas/class-professors/${courseId}`;
    } else if (endpoint.startsWith('/api/v1/complete-class-data/')) {
      const courseId = endpoint.split('/').pop();
      pythonEndpoint = `/api/canvas/complete-class-data/${courseId}`;
    } else if (endpoint === '/api/v1/users/self') {
      pythonEndpoint = '/api/canvas/user-profile';
    } else if (endpoint === '/api/v1/users/self/todo') {
      pythonEndpoint = '/api/canvas/todo';
    } else if (endpoint === '/api/v1/users/self/upcoming_events') {
      pythonEndpoint = '/api/canvas/upcoming-events';
    } else if (endpoint === '/api/v1/users/self/calendar_events') {
      pythonEndpoint = '/api/canvas/calendar-events';
    } else if (endpoint === '/api/v1/users/self/groups') {
      pythonEndpoint = '/api/canvas/groups';
    } else if (endpoint === '/api/v1/users/self/enrollments' || endpoint.includes('/api/v1/users/self/enrollments')) {
      pythonEndpoint = '/api/canvas/enrollments';
    } else if (endpoint === '/api/v1/users/self/favorites/courses') {
      pythonEndpoint = '/api/canvas/favorite-courses';
    } else if (endpoint === '/api/v1/users/self/communication_channels') {
      pythonEndpoint = '/api/canvas/communication-channels';
    } else if (endpoint === '/api/v1/users/self/profile') {
      pythonEndpoint = '/api/canvas/user-profile';
    } else if (endpoint.startsWith('/api/v1/announcements')) {
      pythonEndpoint = '/api/canvas/announcements';
    } else {
      // For any other endpoints, use the all-data endpoint which returns everything
      pythonEndpoint = '/api/canvas/all-data';
    }

    // Make the request to our Python backend
    const response = await fetch(`${PYTHON_BACKEND_URL}${pythonEndpoint}${queryParams}`, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Python backend error:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Python backend error' },
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
