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

// Helper function to fetch the current user's grades for all their courses with pagination
async function fetchAllGrades(idToken: string): Promise<CanvasResource<unknown>> {
  try {
    // We'll collect all enrollments here
    interface Enrollment {
      id: number;
      course_id: number;
      grades?: {
        current_grade?: string;
        current_score?: number;
      };
    }

    let allEnrollments: Enrollment[] = [];
    let page = 1;
    let hasMorePages = true;

    // Fetch all pages of enrollments
    while (hasMorePages) {

      const endpoint = `/api/v1/users/self/enrollments?include[]=grades&per_page=100&page=${page}`;

      console.log(`Fetching enrollments page ${page}`);

      const response = await fetch('/api/canvas', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ endpoint })
      });

      if (!response.ok) {
        console.error(`Failed to fetch user's grades (page ${page}): ${response.statusText}`);
        return { data: null, error: response.statusText };
      }

      const pageData = await response.json();

      // Check if we got any data
      if (Array.isArray(pageData) && pageData.length > 0) {
        console.log(`Received ${pageData.length} enrollments on page ${page}`);
        allEnrollments = [...allEnrollments, ...pageData];

        // If we got fewer than 100 results, we've reached the last page
        if (pageData.length < 100) {
          hasMorePages = false;
        } else {
          page++;
        }
      } else {
        // No more data
        hasMorePages = false;
      }
    }

    if (allEnrollments.length > 0) {
      // Filter enrollments to only include those with grade data
      const gradesData = allEnrollments.filter(enrollment =>
        enrollment.grades &&
        (enrollment.grades.current_grade || enrollment.grades.current_score)
      );

      console.log(`Total enrollments fetched: ${allEnrollments.length}`);
      console.log(`Enrollments with grades: ${gradesData.length}`);
      return { data: gradesData, error: null };
    } else {
      console.log('No enrollments with grades found for the current user');
      return { data: [], error: null };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error fetching user's grades:`, errorMessage);
    return { data: null, error: errorMessage };
  }
}

// Function to fetch all Canvas data from the Python backend
export async function fetchAllCanvasDataFromBackend(): Promise<CanvasDataResponse> {
  // Check if data exists in sessionStorage and is not expired
  const cachedData = sessionStorage.getItem('canvasData');
  if (cachedData && !isCacheExpired()) {
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

  try {
    console.log('Fetching all Canvas data from Python backend');

    // First, initialize the Canvas API for this user
    const initResponse = await fetch('/api/canvas', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ endpoint: '/api/v1/users/self' }) // Any endpoint will work to initialize
    });

    if (!initResponse.ok) {
      console.error('Failed to initialize Canvas API:', initResponse.statusText);
      return {};
    }

    // Now fetch all data from the Python backend
    const response = await fetch('/api/canvas', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ endpoint: '/api/v1/all-data' }) // Special endpoint for all data
    });

    if (!response.ok) {
      console.error('Failed to fetch all Canvas data:', response.statusText);
      return {};
    }

    const allData = await response.json();
    console.log('Received all Canvas data from Python backend');

    // Log the structure of the data for debugging
    console.log('Canvas data structure:', Object.keys(allData));

    // Store the data in sessionStorage with timestamp
    try {
      const cacheObject: CachedCanvasData = {
        data: allData,
        timestamp: Date.now()
      };
      sessionStorage.setItem('canvasData', JSON.stringify(cacheObject));
      console.log('Canvas data cached in sessionStorage');
    } catch (error) {
      console.error('Error caching Canvas data:', error);
      // If storage fails (e.g., quota exceeded), we can still return the data
    }

    return allData;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching all Canvas data:', errorMessage);
    return {};
  }
}

// Main function to fetch all Canvas data - always uses the backend
export async function fetchAllCanvasData(): Promise<CanvasDataResponse> {
  return await fetchAllCanvasDataFromBackend();
}

// Helper function to fetch grades data for a course with pagination
async function fetchCourseGrades(courseId: string, idToken: string): Promise<CanvasResource<unknown>> {
  try {
    // We'll collect all student data here
    interface Student {
      id: number;
      name: string;
      enrollments?: Array<{
        grades?: {
          current_grade?: string;
          current_score?: number;
        };
      }>;
    }

    let allStudents: Student[] = [];
    let page = 1;
    let hasMorePages = true;

    // Fetch all pages of student data
    while (hasMorePages) {
      // Use the specific endpoint for grades as mentioned in the memory
      // Add pagination parameters to get all students
      const endpoint = `/api/v1/courses/${courseId}/users?include[]=enrollments&enrollment_type[]=StudentEnrollment&per_page=100&page=${page}`;

      console.log(`Fetching grades for course ${courseId} - page ${page}`);

      const response = await fetch('/api/canvas', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ endpoint })
      });

      if (!response.ok) {
        console.error(`Failed to fetch grades for course ${courseId} (page ${page}): ${response.statusText}`);
        return { data: null, error: response.statusText };
      }

      const pageData = await response.json();

      // Check if we got any data
      if (Array.isArray(pageData) && pageData.length > 0) {
        console.log(`Received ${pageData.length} students on page ${page} for course ${courseId}`);
        allStudents = [...allStudents, ...pageData];

        // If we got fewer than 100 results, we've reached the last page
        if (pageData.length < 100) {
          hasMorePages = false;
        } else {
          page++;
        }
      } else {
        // No more data
        hasMorePages = false;
      }
    }

    console.log(`Total students with grades fetched for course ${courseId}: ${allStudents.length}`);
    return { data: allStudents, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error fetching grades for course ${courseId}:`, errorMessage);
    return { data: null, error: errorMessage };
  }
}

// Function to fetch course details from the Python backend
export async function fetchCourseDetailsFromBackend(courseId: string): Promise<CanvasDataResponse> {
  // Check if course data exists in sessionStorage
  const cacheKey = `courseData_${courseId}`;
  const cachedData = sessionStorage.getItem(cacheKey);
  if (cachedData && !isCacheExpired(30, cacheKey)) {
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

  try {
    console.log(`Fetching complete data for course ${courseId} from Python backend`);

    // Fetch complete class data from the Python backend
    const response = await fetch('/api/canvas', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ endpoint: `/api/v1/complete-class-data/${courseId}` })
    });

    if (!response.ok) {
      console.error(`Failed to fetch complete data for course ${courseId}:`, response.statusText);
      return {};
    }

    const courseData = await response.json();
    console.log(`Received complete data for course ${courseId} from Python backend`);

    // Log the structure of the course data for debugging
    console.log(`Course ${courseId} data structure:`, Object.keys(courseData));

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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error fetching complete data for course ${courseId}:`, errorMessage);
    return {};
  }
}

// Helper function to fetch data for a specific course - always uses the backend
export async function fetchCourseDetails(courseId: string): Promise<CanvasDataResponse> {
  return await fetchCourseDetailsFromBackend(courseId);
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
  console.log(`Canvas cache cleared (${keysToRemove.length} items removed)`);
}

export function isCacheExpired(maxAgeMinutes: number = 30, cacheKey: string = 'canvasData'): boolean {
  const cachedData = sessionStorage.getItem(cacheKey);
  if (!cachedData) return true;

  try {
    const parsed: CachedCanvasData = JSON.parse(cachedData);
    const now = Date.now();
    const ageMs = now - parsed.timestamp;
    const ageMinutes = ageMs / (1000 * 60);

    // Log cache status for debugging
    console.log(`Cache ${cacheKey} age: ${ageMinutes.toFixed(2)} minutes (max: ${maxAgeMinutes} minutes)`);

    return ageMinutes > maxAgeMinutes;
  } catch (error) {
    console.error(`Error checking cache expiration for ${cacheKey}:`, error);
    return true;
  }
}
