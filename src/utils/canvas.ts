import { auth } from '@/lib/firebase';

// Type definitions
export interface CanvasDataResponse {
  [key: string]: { data: unknown | null; error: string | null };
}

// Cache keys
const CANVAS_CACHE_KEY = 'canvas_data_cache';
const CANVAS_CACHE_TIMESTAMP_KEY = 'canvas_data_cache_timestamp';
const CANVAS_COURSE_IDS_KEY = 'canvas_course_ids';

// Python backend URL
const PYTHON_BACKEND_URL = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://localhost:5000';

/**
 * Fetch all course IDs for the current user from the backend
 * @returns Promise that resolves to an array of course IDs
 */
export async function fetchAllCourseIds(): Promise<number[]> {
  try {
    // Check if we have cached course IDs
    const cachedCourseIds = getCachedCourseIds();
    if (cachedCourseIds && !isCacheExpired()) {
      console.log('Using cached course IDs');
      return cachedCourseIds;
    }

    console.log('Fetching course IDs from backend');
    const response = await fetch(`${PYTHON_BACKEND_URL}/api/canvas/all-courses-id?user_id=${auth.currentUser?.uid}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch course IDs: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Error fetching course IDs: ${data.error}`);
    }

    // Cache the course IDs
    localStorage.setItem(CANVAS_COURSE_IDS_KEY, JSON.stringify(data.course_ids));

    return data.course_ids;
  } catch (error) {
    console.error('Error fetching course IDs:', error);
    // Return cached course IDs if available, otherwise empty array
    return getCachedCourseIds() || [];
  }
}

/**
 * Get cached course IDs from localStorage
 * @returns Array of course IDs or null if not cached
 */
function getCachedCourseIds(): number[] | null {
  try {
    const cachedData = localStorage.getItem(CANVAS_COURSE_IDS_KEY);
    if (!cachedData) return null;
    return JSON.parse(cachedData);
  } catch (error) {
    console.error('Error parsing cached course IDs:', error);
    return null;
  }
}

/**
 * Fetch course data for a specific course ID
 * @param courseId The Canvas course ID
 * @returns Promise that resolves to the course data
 */
export async function fetchCourseData(courseId: string): Promise<any> {
  try {
    // Check if we have cached data for this course
    const cachedData = getCachedCanvasData();
    const cacheKey = `course_data_${courseId}`;

    if (cachedData && cachedData[cacheKey] && !isCacheExpired()) {
      console.log(`Using cached data for course ${courseId}`);
      return cachedData[cacheKey];
    }

    console.log(`Fetching data for course ${courseId} from backend`);
    const response = await fetch(
      `${PYTHON_BACKEND_URL}/api/canvas/course-data/${courseId}?user_id=${auth.currentUser?.uid}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch course data: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Error fetching course data: ${data.error}`);
    }

    // Cache the course data
    const newCachedData = cachedData ? { ...cachedData } : {};
    newCachedData[cacheKey] = data.course_data;
    updateCanvasCache(newCachedData);

    return data.course_data;
  } catch (error) {
    console.error(`Error fetching data for course ${courseId}:`, error);

    // Return cached data if available
    const cachedData = getCachedCanvasData();
    const cacheKey = `course_data_${courseId}`;

    if (cachedData && cachedData[cacheKey]) {
      console.log(`Using cached data for course ${courseId} after fetch error`);
      return cachedData[cacheKey];
    }

    return null;
  }
}

/**
 * Fetch course details for a specific course ID
 * This is used by the Dashboard component to get professor information
 * @param courseId The Canvas course ID
 * @returns Promise that resolves to the course details
 */
export async function fetchCourseDetails(courseId: string): Promise<CanvasDataResponse> {
  try {
    const response = await fetch(`${PYTHON_BACKEND_URL}/api/canvas/course-data/${courseId}?user_id=${auth.currentUser?.uid}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch course details: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Error fetching course details: ${data.error}`);
    }

    // Format the response to match the expected CanvasDataResponse format
    const formattedResponse: CanvasDataResponse = {
      [`complete_class_data_${courseId}`]: {
        data: data.course_data,
        error: null
      },
      [`class_professors_${courseId}`]: {
        data: data.course_data.professors,
        error: null
      }
    };

    return formattedResponse;
  } catch (error) {
    console.error(`Error fetching details for course ${courseId}:`, error);
    return {
      [`complete_class_data_${courseId}`]: {
        data: null,
        error: `Failed to fetch course details: ${error}`
      }
    };
  }
}

/**
 * Fetch all Canvas data from the backend
 * This is the main function used by the dashboard to get all data
 * @returns Promise that resolves to all Canvas data
 */
export async function fetchAllCanvasDataFromBackend(): Promise<CanvasDataResponse> {
  try {
    // Check if we have cached data
    if (!isCacheExpired()) {
      const cachedData = getCachedCanvasData();
      if (cachedData) {
        console.log('Using cached Canvas data');
        return cachedData;
      }
    }

    console.log('Fetching all Canvas data from backend');

    // Step 1: Get all course IDs
    const courseIds = await fetchAllCourseIds();

    // Step 2: Get basic Canvas data (user profile, announcements, etc.)
    const response = await fetch(`${PYTHON_BACKEND_URL}/api/canvas/all-data?user_id=${auth.currentUser?.uid}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch Canvas data: ${response.statusText}`);
    }

    const basicData = await response.json();

    // Step 3: Get detailed data for each course
    const courseDataPromises = courseIds.map(courseId =>
      fetchCourseData(courseId.toString())
        .then(courseData => ({
          [`complete_class_data_${courseId}`]: {
            data: courseData,
            error: null
          },
          [`class_professors_${courseId}`]: {
            data: courseData.professors,
            error: null
          }
        }))
        .catch(error => ({
          [`complete_class_data_${courseId}`]: {
            data: null,
            error: `Failed to fetch course data: ${error}`
          }
        }))
    );

    const courseDataResults = await Promise.all(courseDataPromises);

    // Step 4: Combine all data
    let combinedData: CanvasDataResponse = {
      all_classes: basicData.all_classes,
      user_profile: basicData.user_profile,
      announcements: basicData.announcements
    };

    // Add any professor data from the basic data
    Object.keys(basicData).forEach(key => {
      if (key.startsWith('class_professors_')) {
        combinedData[key] = basicData[key];
        console.log(`Added professor data from basic data: ${key}`);
      }
    });

    // Merge course data
    courseDataResults.forEach(courseData => {
      combinedData = { ...combinedData, ...courseData };
    });

    // Cache the data
    updateCanvasCache(combinedData);

    return combinedData;
  } catch (error) {
    console.error('Error fetching Canvas data:', error);

    // Return cached data if available
    const cachedData = getCachedCanvasData();
    if (cachedData) {
      console.log('Using cached Canvas data after fetch error');
      return cachedData;
    }

    // Return empty data structure if no cache is available
    return {
      all_classes: { data: [], error: `Failed to fetch Canvas data: ${error}` },
      user_profile: { data: null, error: `Failed to fetch Canvas data: ${error}` },
      announcements: { data: [], error: `Failed to fetch Canvas data: ${error}` }
    };
  }
}

/**
 * Check if the cache is expired
 * @param maxAgeMinutes Maximum age of the cache in minutes (default: 30)
 * @returns True if the cache is expired or doesn't exist, false otherwise
 */
export function isCacheExpired(maxAgeMinutes: number = 30): boolean {
  try {
    const timestamp = localStorage.getItem(CANVAS_CACHE_TIMESTAMP_KEY);
    if (!timestamp) return true;

    const cachedTime = parseInt(timestamp, 10);
    const currentTime = Date.now();
    const maxAgeMs = maxAgeMinutes * 60 * 1000;

    return currentTime - cachedTime > maxAgeMs;
  } catch (error) {
    console.error('Error checking cache expiration:', error);
    return true;
  }
}

/**
 * Get cached Canvas data from localStorage
 * @returns Cached Canvas data or null if not cached
 */
function getCachedCanvasData(): CanvasDataResponse | null {
  try {
    const cachedData = localStorage.getItem(CANVAS_CACHE_KEY);
    if (!cachedData) return null;
    return JSON.parse(cachedData);
  } catch (error) {
    console.error('Error parsing cached Canvas data:', error);
    return null;
  }
}

/**
 * Update the Canvas data cache
 * @param data The Canvas data to cache
 */
function updateCanvasCache(data: CanvasDataResponse): void {
  try {
    localStorage.setItem(CANVAS_CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CANVAS_CACHE_TIMESTAMP_KEY, Date.now().toString());
    console.log('Canvas data cached successfully');
  } catch (error) {
    console.error('Error caching Canvas data:', error);
  }
}

/**
 * Clear the Canvas data cache
 */
export function clearCanvasCache(): void {
  try {
    localStorage.removeItem(CANVAS_CACHE_KEY);
    localStorage.removeItem(CANVAS_CACHE_TIMESTAMP_KEY);
    localStorage.removeItem(CANVAS_COURSE_IDS_KEY);
    console.log('Canvas cache cleared');
  } catch (error) {
    console.error('Error clearing Canvas cache:', error);
  }
}
