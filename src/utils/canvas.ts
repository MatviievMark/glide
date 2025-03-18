import { auth } from '@/lib/firebase';

interface CanvasCredentials {
  canvasApiKey: string;
  canvasUrl: string;
}

export async function fetchAllCanvasData() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user found');
  }

  // Get the user's ID token
  const idToken = await currentUser.getIdToken();

  // List of all endpoints we want to fetch
  const endpoints = [
    '/api/v1/courses',
    '/api/v1/users/self',
    '/api/v1/users/self/todo',
    '/api/v1/users/self/upcoming_events',
    '/api/v1/users/self/calendar_events',
    '/api/v1/users/self/groups',
    '/api/v1/users/self/enrollments',
    '/api/v1/users/self/favorites/courses',
    '/api/v1/users/self/communication_channels',
    '/api/v1/users/self/profile'
  ];

  // Fetch all endpoints through our API route
  const fetchPromises = endpoints.map(async (endpoint) => {
    try {
      const response = await fetch('/api/canvas', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ endpoint })
      });

      if (!response.ok) {
        console.error(`Failed to fetch ${endpoint}: ${response.statusText}`);
        return { endpoint, data: null, error: response.statusText };
      }

      const data = await response.json();
      return { endpoint, data, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error fetching ${endpoint}:`, errorMessage);
      return { endpoint, data: null, error: errorMessage };
    }
  });

  // Wait for all requests to complete
  const results = await Promise.all(fetchPromises);

  // Organize results into a structured object
  const canvasData = results.reduce((acc, { endpoint, data, error }) => {
    // Extract the main resource name from the endpoint
    const resource = endpoint.split('/').pop() || endpoint;
    acc[resource] = { data, error };
    return acc;
  }, {} as Record<string, { data: any; error: string | null }>);

  return canvasData;
}

// Helper function to fetch data for a specific course
export async function fetchCourseDetails(courseId: string) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user found');
  }

  // Get the user's ID token
  const idToken = await currentUser.getIdToken();
  
  const courseEndpoints = [
    `/api/v1/courses/${courseId}`,
    `/api/v1/courses/${courseId}/assignments`,
    `/api/v1/courses/${courseId}/modules`,
    `/api/v1/courses/${courseId}/discussion_topics`,
    `/api/v1/courses/${courseId}/students`,
    `/api/v1/courses/${courseId}/files`,
    `/api/v1/courses/${courseId}/quizzes`,
    `/api/v1/courses/${courseId}/announcements`
  ];

  const fetchPromises = courseEndpoints.map(async (endpoint) => {
    try {
      const response = await fetch('/api/canvas', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ endpoint })
      });

      if (!response.ok) {
        console.error(`Failed to fetch ${endpoint}: ${response.statusText}`);
        return { endpoint, data: null, error: response.statusText };
      }

      const data = await response.json();
      return { endpoint, data, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error fetching ${endpoint}:`, errorMessage);
      return { endpoint, data: null, error: errorMessage };
    }
  });

  const results = await Promise.all(fetchPromises);
  
  return results.reduce((acc, { endpoint, data, error }) => {
    const resource = endpoint.split('/').pop() || endpoint;
    acc[resource] = { data, error };
    return acc;
  }, {} as Record<string, { data: any; error: string | null }>);
}
