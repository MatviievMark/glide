import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';

// Type definitions
export interface CanvasDataResponse {
  [key: string]: { data: unknown | null; error: string | null };
}

export interface DashboardCourse {
  id: number;
  name: string;
  code: string;
  instructor: string;
  progress: number;
}

export interface DashboardAssignment {
  id: number | string;
  title: string;
  dueDate: string;
  formattedDueDate: string;
  courseName: string;
  courseId: number;
  status: 'upcoming' | 'past' | 'missing';
  score?: number;
  pointsPossible?: number;
}

export interface DashboardAnnouncement {
  id: number | string;
  title: string;
  message: string;
  postedAt: string;
  formattedPostedAt: string;
  courseName: string;
  courseId: number;
  author?: string;
}

export interface UserProfile {
  userName: string;
  userMajor: string;
  userInitials: string;
}

/**
 * Extract user profile information from Canvas data
 * @param canvasData The Canvas data response
 * @returns User profile information
 */
export function extractUserProfile(canvasData: CanvasDataResponse | null): UserProfile {
  if (!canvasData || !canvasData.user_profile || !canvasData.user_profile.data) {
    return {
      userName: 'Student',
      userMajor: 'Undeclared',
      userInitials: 'ST'
    };
  }

  try {
    const profileData = canvasData.user_profile.data as any;
    const name = profileData.name || 'Student';

    // Extract initials from name
    const nameParts = name.split(' ');
    let initials = 'ST';

    if (nameParts.length >= 2) {
      initials = `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`;
    } else if (nameParts.length === 1) {
      initials = nameParts[0].substring(0, 2);
    }

    return {
      userName: name,
      userMajor: 'Student', // Canvas doesn't provide major info
      userInitials: initials.toUpperCase()
    };
  } catch (error) {
    console.error('Error extracting user profile:', error);
    return {
      userName: 'Student',
      userMajor: 'Undeclared',
      userInitials: 'ST'
    };
  }
}

/**
 * Extract courses from Canvas data
 * @param canvasData The Canvas data response
 * @returns Array of dashboard courses
 */
export async function extractCourses(canvasData: CanvasDataResponse | null): Promise<DashboardCourse[]> {
  if (!canvasData || !canvasData.all_classes || !canvasData.all_classes.data) {
    return [];
  }

  try {
    const coursesData = canvasData.all_classes.data as any[];

    return coursesData.map(course => {
      // Try to find professor information
      let instructor = 'Instructor';

      // First check direct professor data
      const professorKey = `class_professors_${course.course_id}`;
      if (canvasData[professorKey] && canvasData[professorKey].data) {
        const professors = canvasData[professorKey].data as any[];
        if (professors && professors.length > 0) {
          instructor = professors[0].name;
          console.log(`Found professor for course ${course.course_id}: ${instructor}`);
        }
      }

      // Then check complete class data
      const completeDataKey = `complete_class_data_${course.course_id}`;
      if (instructor === 'Instructor' && canvasData[completeDataKey] && canvasData[completeDataKey].data) {
        const completeData = canvasData[completeDataKey].data as any;
        if (completeData && completeData.professors && completeData.professors.length > 0) {
          instructor = completeData.professors[0].name;
          console.log(`Found professor in complete data for course ${course.course_id}: ${instructor}`);
        }
      }

      // If we still don't have a professor name, use the course name
      if (instructor === 'Instructor') {
        instructor = `Instructor of ${course.course_name}`;
      }

      // Get course progress from the data if available
      let progress = 0;

      // Try to get progress from grades if available
      const gradesKey = `class_grades_${course.course_id}`;
      if (canvasData[gradesKey] && canvasData[gradesKey].data) {
        const grades = canvasData[gradesKey].data as any;
        // If we have a current score, use it as progress percentage
        if (grades && grades.current_score) {
          progress = Math.min(100, Math.max(0, grades.current_score));
        }
      }

      // Try to get progress from complete class data if available
      // Reuse the completeDataKey variable that was declared earlier
      if (canvasData[completeDataKey] && canvasData[completeDataKey].data) {
        const completeData = canvasData[completeDataKey].data as any;
        if (completeData && completeData.grades && completeData.grades.current_score) {
          progress = Math.min(100, Math.max(0, completeData.grades.current_score));
        }
      }

      return {
        id: course.course_id,
        name: course.course_name,
        code: course.course_code || `Course ${course.course_id}`,
        instructor,
        progress
      };
    });
  } catch (error) {
    console.error('Error extracting courses:', error);
    return [];
  }
}

/**
 * Extract assignments from Canvas data
 * @param canvasData The Canvas data response
 * @returns Array of dashboard assignments
 */
export function extractAssignments(canvasData: CanvasDataResponse | null): DashboardAssignment[] {
  if (!canvasData) {
    return [];
  }

  try {
    const assignments: DashboardAssignment[] = [];

    // Find all course IDs
    const courseKeys = Object.keys(canvasData).filter(key =>
      key.startsWith('complete_class_data_')
    );

    for (const courseKey of courseKeys) {
      if (!canvasData[courseKey] || !canvasData[courseKey].data) continue;

      const courseData = canvasData[courseKey].data as any;
      const courseId = parseInt(courseKey.replace('complete_class_data_', ''), 10);
      const courseName = courseData.course_info?.name || `Course ${courseId}`;

      if (!courseData.assignments) continue;

      // Process upcoming assignments
      if (courseData.assignments.upcoming) {
        courseData.assignments.upcoming.forEach((assignment: any) => {
          if (!assignment.name || !assignment.due_date) return;

          try {
            const dueDate = parseISO(assignment.due_date);
            assignments.push({
              id: assignment.id,
              title: assignment.name,
              dueDate: assignment.due_date,
              formattedDueDate: format(dueDate, 'MMM d, yyyy'),
              courseName,
              courseId,
              status: 'upcoming',
              pointsPossible: assignment.points_possible
            });
          } catch (e) {
            console.error('Error parsing assignment date:', e);
          }
        });
      }

      // Process past assignments
      if (courseData.assignments.past) {
        courseData.assignments.past.forEach((assignment: any) => {
          if (!assignment.name || !assignment.due_date) return;

          try {
            const dueDate = parseISO(assignment.due_date);
            assignments.push({
              id: assignment.id,
              title: assignment.name,
              dueDate: assignment.due_date,
              formattedDueDate: format(dueDate, 'MMM d, yyyy'),
              courseName,
              courseId,
              status: 'past',
              score: assignment.score,
              pointsPossible: assignment.points_possible
            });
          } catch (e) {
            console.error('Error parsing assignment date:', e);
          }
        });
      }

      // Process missing assignments
      if (courseData.assignments.missing) {
        courseData.assignments.missing.forEach((assignment: any) => {
          if (!assignment.name || !assignment.due_date) return;

          try {
            const dueDate = parseISO(assignment.due_date);
            assignments.push({
              id: assignment.id,
              title: assignment.name,
              dueDate: assignment.due_date,
              formattedDueDate: format(dueDate, 'MMM d, yyyy'),
              courseName,
              courseId,
              status: 'missing',
              pointsPossible: assignment.points_possible
            });
          } catch (e) {
            console.error('Error parsing assignment date:', e);
          }
        });
      }
    }

    // Sort assignments by due date (upcoming first, then missing, then past)
    return assignments.sort((a, b) => {
      // First sort by status
      if (a.status === 'upcoming' && b.status !== 'upcoming') return -1;
      if (a.status === 'missing' && b.status === 'past') return -1;
      if (a.status === 'past' && b.status !== 'past') return 1;

      // Then sort by due date
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  } catch (error) {
    console.error('Error extracting assignments:', error);
    return [];
  }
}

/**
 * Extract announcements from Canvas data
 * @param canvasData The Canvas data response
 * @returns Array of dashboard announcements
 */
export function extractAnnouncements(canvasData: CanvasDataResponse | null): DashboardAnnouncement[] {
  if (!canvasData || !canvasData.announcements || !canvasData.announcements.data) {
    return [];
  }

  try {
    const announcementsData = canvasData.announcements.data as any[];

    return announcementsData.map(announcement => {
      let formattedPostedAt = 'Unknown date';

      try {
        if (announcement.posted_at) {
          const postedDate = parseISO(announcement.posted_at);
          formattedPostedAt = format(postedDate, 'MMM d, yyyy');
        }
      } catch (e) {
        console.error('Error parsing announcement date:', e);
      }

      return {
        id: announcement.id,
        title: announcement.title,
        message: announcement.message,
        postedAt: announcement.posted_at,
        formattedPostedAt,
        courseName: announcement.course_name,
        courseId: announcement.course_id,
        author: announcement.author?.display_name
      };
    }).sort((a, b) => {
      // Sort by posted date (newest first)
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
    });
  } catch (error) {
    console.error('Error extracting announcements:', error);
    return [];
  }
}

/**
 * Extract statistics from Canvas data
 * @param canvasData The Canvas data response
 * @returns Dashboard statistics
 */
export function extractStatistics(canvasData: CanvasDataResponse | null): {
  gpa: string;
  completedCredits: number;
  upcomingDeadlines: number;
  dueThisWeek: number;
} {
  if (!canvasData) {
    return {
      gpa: '0.00',
      completedCredits: 0,
      upcomingDeadlines: 0,
      dueThisWeek: 0
    };
  }

  try {
    // Calculate GPA from course grades
    let totalGradePoints = 0;
    let totalCourses = 0;
    let completedCredits = 0;

    // Find all course IDs with complete data
    const courseKeys = Object.keys(canvasData).filter(key =>
      key.startsWith('complete_class_data_')
    );

    // Process each course to calculate GPA
    for (const courseKey of courseKeys) {
      if (!canvasData[courseKey] || !canvasData[courseKey].data) continue;

      const courseData = canvasData[courseKey].data as any;

      // Check if we have grades data
      let gradePoints = 0;
      let hasValidGrade = false;

      // First try to use the letter grade if available
      if (courseData.grades && courseData.grades.current_grade) {
        const letterGrade = courseData.grades.current_grade;
        console.log(`Found letter grade for course: ${letterGrade}`);

        // Convert letter grade to grade points
        switch(letterGrade) {
          case 'A': gradePoints = 4.0; hasValidGrade = true; break;
          case 'A-': gradePoints = 3.7; hasValidGrade = true; break;
          case 'B+': gradePoints = 3.3; hasValidGrade = true; break;
          case 'B': gradePoints = 3.0; hasValidGrade = true; break;
          case 'B-': gradePoints = 2.7; hasValidGrade = true; break;
          case 'C+': gradePoints = 2.3; hasValidGrade = true; break;
          case 'C': gradePoints = 2.0; hasValidGrade = true; break;
          case 'C-': gradePoints = 1.7; hasValidGrade = true; break;
          case 'D+': gradePoints = 1.3; hasValidGrade = true; break;
          case 'D': gradePoints = 1.0; hasValidGrade = true; break;
          case 'D-': gradePoints = 0.7; hasValidGrade = true; break;
          case 'F': gradePoints = 0.0; hasValidGrade = true; break;
          default:
            // If it's not a standard letter grade, try to parse it
            if (letterGrade && letterGrade.startsWith('A')) gradePoints = 4.0;
            else if (letterGrade && letterGrade.startsWith('B')) gradePoints = 3.0;
            else if (letterGrade && letterGrade.startsWith('C')) gradePoints = 2.0;
            else if (letterGrade && letterGrade.startsWith('D')) gradePoints = 1.0;
            else if (letterGrade && letterGrade.startsWith('F')) gradePoints = 0.0;
            else hasValidGrade = false;

            if (!hasValidGrade) {
              console.log(`Unrecognized letter grade: ${letterGrade}, will try using score instead`);
            } else {
              hasValidGrade = true;
            }
        }
      }

      // If we don't have a valid letter grade, fall back to using the score
      if (!hasValidGrade && courseData.grades && courseData.grades.current_score) {
        const score = courseData.grades.current_score;
        console.log(`Using score for GPA calculation: ${score}`);

        // Convert score to grade points (approximate)
        if (score >= 93) gradePoints = 4.0;
        else if (score >= 90) gradePoints = 3.7;
        else if (score >= 87) gradePoints = 3.3;
        else if (score >= 83) gradePoints = 3.0;
        else if (score >= 80) gradePoints = 2.7;
        else if (score >= 77) gradePoints = 2.3;
        else if (score >= 73) gradePoints = 2.0;
        else if (score >= 70) gradePoints = 1.7;
        else if (score >= 67) gradePoints = 1.3;
        else if (score >= 63) gradePoints = 1.0;
        else if (score >= 60) gradePoints = 0.7;
        else gradePoints = 0.0;

        hasValidGrade = true;
      }

      // If we have a valid grade, add it to the total
      if (hasValidGrade) {
        totalGradePoints += gradePoints;
        totalCourses++;

        // Assume each course is worth 3 credits (this is just an approximation)
        // Consider a course completed if the grade is D- or better (grade points >= 0.7)
        if (gradePoints >= 0.7) {
          completedCredits += 3;
        }
      }
    }

    // Calculate GPA
    const calculatedGpa = totalCourses > 0 ? totalGradePoints / totalCourses : 0;
    const gpa = calculatedGpa.toFixed(2);

    console.log(`GPA calculation: ${totalGradePoints} total grade points / ${totalCourses} courses = ${calculatedGpa} (${gpa})`);
    console.log(`Completed credits: ${completedCredits}`);

    // If we don't have any courses with grades, use default values
    if (totalCourses === 0) {
      completedCredits = 0;
      console.log('No courses with grades found, using default values');
    }

    // Calculate upcoming deadlines
    const assignments = extractAssignments(canvasData);
    const upcomingAssignments = assignments.filter(a => a.status === 'upcoming');
    const upcomingDeadlines = upcomingAssignments.length;

    // Calculate assignments due this week
    const now = new Date();
    const nextWeek = addDays(now, 7);
    const dueThisWeek = upcomingAssignments.filter(a => {
      const dueDate = parseISO(a.dueDate);
      return isAfter(dueDate, now) && isBefore(dueDate, nextWeek);
    }).length;

    return {
      gpa,
      completedCredits,
      upcomingDeadlines,
      dueThisWeek
    };
  } catch (error) {
    console.error('Error extracting statistics:', error);
    return {
      gpa: '0.00',
      completedCredits: 0,
      upcomingDeadlines: 0,
      dueThisWeek: 0
    };
  }
}
