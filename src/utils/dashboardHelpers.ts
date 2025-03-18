import { format, parseISO } from 'date-fns';

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
export function extractCourses(canvasData: CanvasDataResponse | null): DashboardCourse[] {
  if (!canvasData?.courses?.data) {
    return [];
  }

  const coursesData = canvasData.courses.data as CanvasCourse[];
  const enrollmentsData = canvasData.enrollments?.data as CanvasEnrollment[] || [];
  
  return coursesData.map(course => {
    // Find the enrollment for this course to get the actual grade/progress
    const enrollment = enrollmentsData.find(e => e.course_id === course.id && e.type === 'student');
    
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
    
    return {
      id: course.id,
      code: course.course_code,
      name: course.name,
      instructor,
      progress
    };
  });
}

export function extractAssignments(canvasData: CanvasDataResponse | null): DashboardAssignment[] {
  if (!canvasData?.todo?.data) {
    return [];
  }

  const todoItems = canvasData.todo.data as any[];
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
  // Try to get announcements from different possible sources
  let announcements: any[] = [];
  
  if (canvasData?.announcements?.data) {
    announcements = canvasData.announcements.data as any[];
  } else if (canvasData?.upcoming_events?.data) {
    // Filter events that might be announcements
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
  // This would normally come from the Canvas data
  // For now, we'll return mock data that would be calculated from actual data
  return {
    gpa: '3.75',
    completedCredits: 68,
    upcomingDeadlines: canvasData?.todo?.data ? (canvasData.todo.data as any[]).length : 0,
    dueThisWeek: canvasData?.todo?.data ? 
      (canvasData.todo.data as any[])
        .filter(item => {
          if (!item.assignment?.due_at) return false;
          const dueDate = parseISO(item.assignment.due_at);
          const now = new Date();
          const diffDays = Math.abs(dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          return diffDays <= 7;
        }).length : 0
  };
}
