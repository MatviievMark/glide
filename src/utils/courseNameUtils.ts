import { db, auth } from '@/lib/firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  deleteDoc
} from 'firebase/firestore';

interface CustomCourseName {
  courseId: number;
  customName: string;
}

/**
 * Saves a custom course name to Firestore
 * @param courseId The Canvas course ID
 * @param customName The user-defined custom name for the course
 * @returns Promise that resolves when the save is complete
 */
export async function saveCustomCourseName(courseId: number, customName: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user found');
  }
  
  const userId = currentUser.uid;
  const courseNameRef = doc(db, 'users', userId, 'courseNames', courseId.toString());
  
  await setDoc(courseNameRef, {
    courseId,
    customName,
    updatedAt: new Date().toISOString()
  });
  
  console.log(`Custom name for course ${courseId} saved to Firestore`);
}

/**
 * Gets all custom course names for the current user
 * @returns Promise that resolves to a map of courseId -> customName
 */
export async function getAllCustomCourseNames(): Promise<Record<number, string>> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.warn('No authenticated user found when fetching custom course names');
    return {};
  }
  
  const userId = currentUser.uid;
  const courseNamesRef = collection(db, 'users', userId, 'courseNames');
  
  try {
    const snapshot = await getDocs(courseNamesRef);
    const courseNames: Record<number, string> = {};
    
    snapshot.forEach((doc) => {
      const data = doc.data() as CustomCourseName;
      courseNames[data.courseId] = data.customName;
    });
    
    console.log(`Retrieved ${snapshot.size} custom course names from Firestore`);
    return courseNames;
  } catch (error) {
    console.error('Error fetching custom course names:', error);
    return {};
  }
}

/**
 * Gets a custom course name for a specific course
 * @param courseId The Canvas course ID
 * @returns Promise that resolves to the custom name or null if not found
 */
export async function getCustomCourseName(courseId: number): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.warn('No authenticated user found when fetching custom course name');
    return null;
  }
  
  const userId = currentUser.uid;
  const courseNameRef = doc(db, 'users', userId, 'courseNames', courseId.toString());
  
  try {
    const docSnap = await getDoc(courseNameRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as CustomCourseName;
      return data.customName;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error fetching custom name for course ${courseId}:`, error);
    return null;
  }
}

/**
 * Deletes a custom course name from Firestore
 * @param courseId The Canvas course ID
 * @returns Promise that resolves when the deletion is complete
 */
export async function deleteCustomCourseName(courseId: number): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user found');
  }
  
  const userId = currentUser.uid;
  const courseNameRef = doc(db, 'users', userId, 'courseNames', courseId.toString());
  
  await deleteDoc(courseNameRef);
  console.log(`Custom name for course ${courseId} deleted from Firestore`);
}
