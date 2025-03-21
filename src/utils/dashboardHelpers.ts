import { format, parseISO } from 'date-fns';

// Define common interfaces for Canvas data types
interface TodoItem {
  assignment: {
    id: number;
    name: string;
    due_at: string | null;
  };
  context_name?: string;
}

interface AnnouncementItem {
  id: number;
  title: string;
  message: string;
  posted_at: string;
  context_code?: string;
}

// Used for upcoming events and calendar events
export interface EventItem {
  id: number;
  title: string;
  start_at: string;
  html_url?: string;
  context_name?: string;
}

interface EnrollmentWithGrades {
  grades?: {
    current_grade?: string;
    current_score?: number;
  };
}

// User profile types
export interface CanvasUserProfile {
  id: number;
  name: string;
  short_name?: string;
  sortable_name?: string;
  title?: string;
  bio?: string;
  primary_email?: string;
  login_id?: string;
  integration_id?: string;
  time_zone?: string;
  locale?: string;
  effective_locale?: string;
  avatar_url?: string;
  calendar?: {
    ics?: string;
  };
  lti_user_id?: string;
  k5_user?: boolean;
}

// Define types for Canvas API data
export interface CanvasResource<T> {
  data: T | null;
  error: string | null;
}

export type CanvasDataResponse = Record<string, CanvasResource<unknown>>;

// Course types
export interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
  enrollment_term_id: number;
  workflow_state: string;
  teachers?: Array<{
    id: number;
    display_name: string;
  }>;
}

// Enrollment types
export interface CanvasEnrollment {
  id: number;
  course_id: number;
  grades?: {
    current_grade?: string;
    current_score?: number;
    final_grade?: string;
    final_score?: number;
  };
  type: string;
}

// Assignment types
export interface CanvasAssignment {
  id: number;
  name: string;
  description: string;
  due_at: string | null;
  points_possible: number;
  course_id: number;
}

// Event types
export interface CanvasEvent {
  id: number;
  title: string;
  start_at: string;
  end_at: string;
  description: string;
  context_type: string;
  context_name: string;
}

// Announcement types
export interface CanvasAnnouncement {
  id: number;
  title: string;
  message: string;
  posted_at: string;
  context_code: string;
}

// Dashboard data types
export interface DashboardCourse {
  id: number;
  code: string;
  name: string;
  instructor: string;
  progress: number;
}

export interface DashboardAssignment {
  id: number;
  title: string;
  course: string;
  dueDate: string;
  urgent: boolean;
}

export interface DashboardAnnouncement {
  id: number;
  title: string;
  date: string;
  content: string;
}

// Helper functions to extract and format data from Canvas API
export async function extractCourses(canvasData: CanvasDataResponse | null): Promise<DashboardCourse[]> {
  if (!canvasData?.courses?.data) {
    return [];
  }

  const coursesData = canvasData.courses.data as CanvasCourse[];
  
  // Get enrollments from both the enrollments endpoint and the grades endpoint
  const regularEnrollments = canvasData.enrollments?.data as CanvasEnrollment[] || [];
  const gradesEnrollments = canvasData.grades?.data as CanvasEnrollment[] || [];
  
  // Combine both enrollment sources
  const allEnrollments = [...regularEnrollments, ...gradesEnrollments];
  
  return coursesData.map(course => {
    // Find the enrollment for this course to get the actual grade/progress
    // First check in the grades data (which should be more accurate)
    const enrollment = allEnrollments.find(e => e.course_id === course.id);
    
    // Get the current score from the enrollment, or use a default value
    let progress = 0;
    if (enrollment?.grades?.current_score !== undefined) {
      // Current score is typically on a 0-100 scale
      progress = Math.round(enrollment.grades.current_score);
    } else if (enrollment?.grades?.current_grade) {
      // If we only have a letter grade, estimate a percentage
      const gradeMap: Record<string, number> = {
        'A+': 100, 'A': 95, 'A-': 90,
        'B+': 87, 'B': 85, 'B-': 80,
        'C+': 77, 'C': 75, 'C-': 70,
        'D+': 67, 'D': 65, 'D-': 60,
        'F': 50
      };
      progress = gradeMap[enrollment.grades.current_grade] || 0;
    }
    
    // Get instructor name if available
    let instructor = '';
    if (course.teachers && course.teachers.length > 0) {
      instructor = course.teachers[0].display_name;
    }
    
    // Return the course with the original name from Canvas
    // The custom name will be applied in the Dashboard component if it exists
    return {
      id: course.id,
      code: course.course_code,
      name: course.name, // Original name from Canvas
      instructor,
      progress
    };
  });
}

export function extractAssignments(canvasData: CanvasDataResponse | null): DashboardAssignment[] {
  if (!canvasData?.todo?.data) {
    return [];
  }

  const todoItems = canvasData.todo.data as TodoItem[];
  const now = new Date();
  
  return todoItems
    .filter(item => item.assignment)
    .map(item => {
      const dueDate = item.assignment.due_at ? parseISO(item.assignment.due_at) : null;
      const formattedDate = dueDate ? format(dueDate, 'MMM d') : 'No due date';
      
      // Calculate if assignment is urgent (due within 2 days)
      const urgent = dueDate ? 
        Math.abs(dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 2 : 
        false;
      
      return {
        id: item.assignment.id,
        title: item.assignment.name,
        course: item.context_name || 'Unknown Course',
        dueDate: formattedDate,
        urgent
      };
    });
}

export function extractAnnouncements(canvasData: CanvasDataResponse | null): DashboardAnnouncement[] {
  if (!canvasData) return [];
  
  // Get announcements from the dedicated announcements endpoint
  let announcements: AnnouncementItem[] = [];
  
  // The key for the announcements endpoint will be 'announcements' or the full endpoint path
  const announcementKey = Object.keys(canvasData).find(key => 
    key === 'announcements' || key.includes('announcements')
  );
  
  if (announcementKey && canvasData[announcementKey]?.data) {
    // We have announcements data from the dedicated endpoint
    announcements = Array.isArray(canvasData[announcementKey].data) 
      ? canvasData[announcementKey].data 
      : [];
    
    console.log('Found announcements:', announcements.length);
  } else if (canvasData?.upcoming_events?.data) {
    // Fall back to upcoming events if no announcements found
    console.log('No announcements found, using upcoming events as fallback');
    const events = canvasData.upcoming_events.data as CanvasEvent[];
    announcements = events
      .filter(event => event.description && event.description.length > 0)
      .map(event => ({
        id: event.id,
        title: event.title,
        posted_at: event.start_at,
        message: event.description,
        context_code: event.context_name
      }));
  }
  
  // Sort announcements by date (newest first)
  announcements.sort((a, b) => {
    const dateA = a.posted_at ? new Date(a.posted_at).getTime() : 0;
    const dateB = b.posted_at ? new Date(b.posted_at).getTime() : 0;
    return dateB - dateA;
  });
  
  // Limit to most recent 5 announcements
  announcements = announcements.slice(0, 5);
  
  return announcements.map(announcement => {
    const date = announcement.posted_at ? 
      format(parseISO(announcement.posted_at), 'MMM d') : 
      'Recent';
    
    // Truncate content if it's too long
    let content = announcement.message || '';
    if (content.length > 100) {
      content = content.substring(0, 97) + '...';
    }
    
    // Remove HTML tags if present
    content = content.replace(/<[^>]*>/g, '');
    
    return {
      id: announcement.id,
      title: announcement.title,
      date,
      content
    };
  });
}

// Extract statistics for dashboard
export function extractUserProfile(canvasData: CanvasDataResponse | null): {
  userName: string;
  userMajor: string;
  userInitials: string;
} {
  // Default values
  let userName = 'Student';
  let userMajor = 'Undeclared';
  let userInitials = 'ST';
  
  if (canvasData?.profile?.data) {
    const profile = canvasData.profile.data as CanvasUserProfile;
    
    // Extract name
    if (profile.name) {
      userName = profile.name;
      
      // Generate initials from name
      userInitials = profile.name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    
    // Extract major (title field often contains major/department)
    if (profile.title) {
      userMajor = profile.title;
    }
  }
  
  return {
    userName,
    userMajor,
    userInitials
  };
}

export function extractStatistics(canvasData: CanvasDataResponse | null): {
  gpa: string;
  completedCredits: number;
  upcomingDeadlines: number;
  dueThisWeek: number;
} {
  // Calculate GPA from grades data if available
  let gpa = '0.0';
  let completedCredits = 0;
  
  // Check if we have grades data
  if (canvasData?.grades?.data) {
    console.log('Grades data found:', canvasData.grades.data);
    
    // The grades data is now an array of enrollments with grades
    const enrollments = canvasData.grades.data as EnrollmentWithGrades[];
    
    if (Array.isArray(enrollments) && enrollments.length > 0) {
      // Map letter grades to GPA points
      const gradeToPoints: Record<string, number> = {
        'A+': 4.0, 'A': 4.0, 'A-': 3.7,
        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7,
        'D+': 1.3, 'D': 1.0, 'D-': 0.7,
        'F': 0.0
      };
      
      let totalPoints = 0;
      let totalCourses = 0;
      
      enrollments.forEach(enrollment => {
        // Check if this enrollment has grade data
        if (enrollment.grades) {
          let gradeValue = 0;
          
          // Try to get grade from letter grade
          if (enrollment.grades.current_grade && gradeToPoints[enrollment.grades.current_grade] !== undefined) {
            gradeValue = gradeToPoints[enrollment.grades.current_grade];
          }
          // If no letter grade, try to calculate from score
          else if (enrollment.grades.current_score !== undefined) {
            const score = enrollment.grades.current_score;
            // Convert percentage score to GPA points (simple conversion)
            if (score >= 90) gradeValue = 4.0;
            else if (score >= 80) gradeValue = 3.0;
            else if (score >= 70) gradeValue = 2.0;
            else if (score >= 60) gradeValue = 1.0;
            else gradeValue = 0.0;
          }
          
          if (gradeValue > 0) {
            totalPoints += gradeValue;
            totalCourses++;
            
            // Estimate completed credits (assuming 3 credits per course)
            // Only count courses that have a passing grade (D or better)
            if (gradeValue >= 1.0) {
              completedCredits += 3;
            }
          }
        }
      });
      
      if (totalCourses > 0) {
        const calculatedGpa = totalPoints / totalCourses;
        gpa = calculatedGpa.toFixed(2);
      }
    }
  } else {
    console.log('No grades data found in canvasData');
    // Fallback to default values if no grades data
    gpa = '3.75';
    completedCredits = 68;
  }
  
  return {
    gpa,
    completedCredits,
    upcomingDeadlines: canvasData?.todo?.data ? (canvasData.todo.data as TodoItem[]).length : 0,
    dueThisWeek: canvasData?.todo?.data ? 
      (canvasData.todo.data as TodoItem[])
        .filter(item => {
          if (!item.assignment?.due_at) return false;
          const dueDate = parseISO(item.assignment.due_at);
          const now = new Date();
          const diffDays = Math.abs(dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          return diffDays <= 7;
        }).length : 0
  };
}
