import { auth } from '@/lib/firebase';

// Define types for Canvas API responses
interface CanvasResource<T> {
  data: T | null;
  error: string | null;
}

type CanvasDataResponse = Record<string, CanvasResource<unknown>>;

// Add timestamp to cached data
interface CachedCanvasData {
  data: CanvasDataResponse;
  timestamp: number;
}

export async function fetchAllCanvasData(): Promise<CanvasDataResponse> {
  // Check if data exists in sessionStorage and is not expired
  const cachedData = sessionStorage.getItem('canvasData');
  if (cachedData) {
    try {
      const parsed: CachedCanvasData = JSON.parse(cachedData);
      console.log('Using cached Canvas data from sessionStorage');
      return parsed.data;
    } catch (error) {
      console.error('Error parsing cached Canvas data:', error);
      // Continue with fetching fresh data if parsing fails
    }
  }

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
  }, {} as CanvasDataResponse);

  // Store the data in sessionStorage with timestamp
  try {
    const cacheObject: CachedCanvasData = {
      data: canvasData,
      timestamp: Date.now()
    };
    sessionStorage.setItem('canvasData', JSON.stringify(cacheObject));
    console.log('Canvas data cached in sessionStorage');
  } catch (error) {
    console.error('Error caching Canvas data:', error);
    // If storage fails (e.g., quota exceeded), we can still return the data
  }

  return canvasData;
}

// Helper function to fetch data for a specific course
export async function fetchCourseDetails(courseId: string): Promise<CanvasDataResponse> {
  // Check if course data exists in sessionStorage
  const cacheKey = `courseData_${courseId}`;
  const cachedData = sessionStorage.getItem(cacheKey);
  if (cachedData) {
    try {
      const parsed: CachedCanvasData = JSON.parse(cachedData);
      console.log(`Using cached data for course ${courseId}`);
      return parsed.data;
    } catch (error) {
      console.error('Error parsing cached course data:', error);
      // Continue with fetching fresh data if parsing fails
    }
  }

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
  
  const courseData = results.reduce((acc, { endpoint, data, error }) => {
    const resource = endpoint.split('/').pop() || endpoint;
    acc[resource] = { data, error };
    return acc;
  }, {} as CanvasDataResponse);

  // Store the course data in sessionStorage
  try {
    const cacheObject: CachedCanvasData = {
      data: courseData,
      timestamp: Date.now()
    };
    sessionStorage.setItem(cacheKey, JSON.stringify(cacheObject));
    console.log(`Course ${courseId} data cached in sessionStorage`);
  } catch (error) {
    console.error('Error caching course data:', error);
  }

  return courseData;
}

// Add utility functions for cache management
export function clearCanvasCache(): void {
  // Clear all Canvas-related data from sessionStorage
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key === 'canvasData' || key.startsWith('courseData_'))) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => sessionStorage.removeItem(key));
  console.log('Canvas cache cleared');
}

export function isCacheExpired(maxAgeMinutes: number = 30): boolean {
  const cachedData = sessionStorage.getItem('canvasData');
  if (!cachedData) return true;
  
  try {
    const parsed: CachedCanvasData = JSON.parse(cachedData);
    const now = Date.now();
    const ageMs = now - parsed.timestamp;
    const ageMinutes = ageMs / (1000 * 60);
    
    return ageMinutes > maxAgeMinutes;
  } catch (error) {
    console.error('Error checking cache expiration:', error);
    return true;
  }
}
