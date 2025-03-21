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
    '/api/v1/users/self/profile',
    '/api/v1/announcements?context_codes[]=course_1&context_codes[]=course_2&context_codes[]=course_3&context_codes[]=course_4&context_codes[]=course_5&latest_only=true'
  ];

  // Fetch all endpoints through our API route
  const fetchPromises = endpoints.map(async (endpoint) => {
    try {
      // For courses endpoint, handle pagination to get all courses
      if (endpoint === '/api/v1/courses') {
        return await fetchAllCoursesWithPagination(endpoint, idToken);
      }
      
      // For other endpoints, use the standard fetch
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
  
  // Helper function to fetch all courses with pagination
  async function fetchAllCoursesWithPagination(endpoint: string, idToken: string) {
    interface Course {
      id: number;
      name: string;
      course_code: string;
      workflow_state: string;
    }
    
    let allCourses: Course[] = [];
    let page = 1;
    let hasMorePages = true;
    
    while (hasMorePages) {
      const paginatedEndpoint = `${endpoint}?per_page=100&page=${page}`;
      console.log(`Fetching courses page ${page}`);
      
      const response = await fetch('/api/canvas', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ endpoint: paginatedEndpoint })
      });

      if (!response.ok) {
        console.error(`Failed to fetch courses (page ${page}): ${response.statusText}`);
        return { endpoint, data: null, error: response.statusText };
      }

      const pageData = await response.json();
      
      if (Array.isArray(pageData) && pageData.length > 0) {
        console.log(`Received ${pageData.length} courses on page ${page}`);
        allCourses = [...allCourses, ...pageData];
        
        // If we got fewer than 100 results, we've reached the last page
        if (pageData.length < 100) {
          hasMorePages = false;
        } else {
          page++;
        }
      } else {
        hasMorePages = false;
      }
    }
    
    console.log(`Total courses fetched: ${allCourses.length}`);
    return { endpoint, data: allCourses, error: null };
  }

  // Fetch grades data separately
  const gradesResult = await fetchAllGrades(idToken);

  // Wait for all requests to complete
  const results = await Promise.all(fetchPromises);

  // Organize results into a structured object
  const canvasData = results.reduce((acc, { endpoint, data, error }) => {
    // Extract the main resource name from the endpoint
    const resource = endpoint.split('/').pop() || endpoint;
    acc[resource] = { data, error };
    return acc;
  }, {} as CanvasDataResponse);

  // Add grades data to the canvasData object
  canvasData['grades'] = gradesResult;
  console.log('Added grades data to canvasData:', gradesResult);

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

  // Fetch grades separately using the dedicated function
  const gradesResult = await fetchCourseGrades(courseId, idToken);

  const results = await Promise.all(fetchPromises);
  
  const courseData = results.reduce((acc, { endpoint, data, error }) => {
    const resource = endpoint.split('/').pop() || endpoint;
    acc[resource] = { data, error };
    return acc;
  }, {} as CanvasDataResponse);

  // Add grades data to the courseData object
  courseData['grades'] = gradesResult;

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
