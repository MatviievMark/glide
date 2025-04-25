import React, { useState, useEffect } from 'react';
import { BarChart2, CheckCircle, Clock } from 'lucide-react';
import CourseEditModal from './CourseEditModal';
import Sidebar from './Sidebar';
import Header from './Header';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { CourseCard } from './CourseCard';
import AssignmentItem from './AssignmentItem';
import AnnouncementItem from './AnnouncementItem';
import { StatCard } from './StatCard';
import {
  CanvasDataResponse,
  DashboardCourse,
  DashboardAssignment,
  DashboardAnnouncement,
  extractCourses,
  extractAssignments,
  extractAnnouncements,
  extractStatistics
} from '@/utils/dashboardHelpers';
import { saveCustomCourseName, getAllCustomCourseNames } from '@/utils/courseNameUtils';
import { fetchCourseDetails } from '@/utils/canvas';

// Empty arrays for when Canvas data is not yet loaded
const emptyCourses: DashboardCourse[] = [];
const emptyAssignments: DashboardAssignment[] = [];
const emptyAnnouncements: DashboardAnnouncement[] = [];

export interface DashboardProps {
  userName?: string;
  userMajor?: string;
  userInitials?: string;
  onLogout?: () => void;
  onRefresh?: () => void;
  canvasData?: CanvasDataResponse | null;
  loading?: boolean;
  error?: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({
  userName = 'Jane Doe',
  userMajor = 'Computer Science',
  userInitials = 'JD',
  onLogout,
  onRefresh,
  canvasData,
  loading = false,
  error = null,
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  // searchQuery state is used by Header component's search functionality
  const [, setSearchQuery] = useState('');
  const [courses, setCourses] = useState<DashboardCourse[]>(emptyCourses);
  const [assignments, setAssignments] = useState<DashboardAssignment[]>(emptyAssignments);
  const [announcements, setAnnouncements] = useState<DashboardAnnouncement[]>(emptyAnnouncements);
  const [stats, setStats] = useState({
    gpa: '3.75',
    completedCredits: 68,
    upcomingDeadlines: 6,
    dueThisWeek: 3
  });

  // State for course edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<DashboardCourse | null>(null);

  // Extract data from Canvas API response
  useEffect(() => {
    if (canvasData) {
      console.log('Dashboard received canvasData:', Object.keys(canvasData));

      // Extract courses (async function)
      const loadCourses = async () => {
        try {
          // Extract courses from Canvas data
          const extractedCourses = await extractCourses(canvasData);
          console.log('Extracted courses:', extractedCourses);

          if (extractedCourses.length > 0) {
            // Load custom course names from Firestore
            const customCourseNames = await getAllCustomCourseNames();
            console.log('Custom course names:', customCourseNames);

            // Fetch complete class data for each course
            const updatedCanvasData = { ...canvasData };

            // Create an array of promises for fetching course details
            const fetchPromises = extractedCourses.map(async (course) => {
              // Check if we already have complete data for this course
              const completeDataKey = `complete_class_data_${course.id}`;

              if (!updatedCanvasData[completeDataKey]) {
                console.log(`Fetching complete data for course ${course.id}`);
                try {
                  const courseDetails = await fetchCourseDetails(course.id.toString());
                  // Merge the course details into the canvas data
                  Object.keys(courseDetails).forEach(key => {
                    updatedCanvasData[key] = courseDetails[key];
                  });
                  console.log(`Successfully fetched complete data for course ${course.id}`);
                } catch (error) {
                  console.error(`Error fetching complete data for course ${course.id}:`, error);
                }
              } else {
                console.log(`Already have complete data for course ${course.id}`);
              }
            });

            // Wait for all fetch operations to complete
            await Promise.all(fetchPromises);

            // Re-extract courses with the updated data that includes professor information
            const updatedExtractedCourses = await extractCourses(updatedCanvasData);
            console.log('Updated extracted courses with professor data:', updatedExtractedCourses);

            // Apply custom names to courses if they exist
            const coursesWithCustomNames = updatedExtractedCourses.map(course => {
              if (customCourseNames[course.id]) {
                console.log(`Applying custom name for course ${course.id}: ${customCourseNames[course.id]}`);
                return { ...course, name: customCourseNames[course.id] };
              }
              return course;
            });

            console.log('Final courses with custom names:', coursesWithCustomNames);
            setCourses(coursesWithCustomNames);
          } else {
            console.log('No courses extracted from Canvas data');
          }
        } catch (error) {
          console.error('Error extracting courses:', error);
        }
      };

      loadCourses();

      // Extract assignments
      const extractedAssignments = extractAssignments(canvasData);
      console.log('Extracted assignments:', extractedAssignments.length);
      if (extractedAssignments.length > 0) {
        setAssignments(extractedAssignments);
      }

      // Extract announcements
      const extractedAnnouncements = extractAnnouncements(canvasData);
      console.log('Extracted announcements:', extractedAnnouncements.length);
      if (extractedAnnouncements.length > 0) {
        setAnnouncements(extractedAnnouncements);
      }

      // Extract statistics
      const extractedStats = extractStatistics(canvasData);
      console.log('Extracted stats:', extractedStats);
      setStats(extractedStats);
    }
  }, [canvasData]);

  // Color mapping for course cards
  const colorOptions = ['blue', 'purple', 'green', 'amber', 'pink', 'indigo', 'emerald', 'rose'] as const;

  const handleCourseSettingsClick = (courseId: number) => {
    const course = courses.find(c => c.id === courseId);
    if (course) {
      setSelectedCourse(course);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveCourse = async (courseId: number, newName: string) => {
    try {
      // Save the custom name to Firestore
      await saveCustomCourseName(courseId, newName);

      // Update local state
      setCourses(prevCourses =>
        prevCourses.map(course =>
          course.id === courseId ? { ...course, name: newName } : course
        )
      );

      console.log(`Course ${courseId} name updated to "${newName}" and saved to Firestore`);
    } catch (error) {
      console.error('Error saving custom course name:', error);
      // Still update the UI even if Firestore save fails
      setCourses(prevCourses =>
        prevCourses.map(course =>
          course.id === courseId ? { ...course, name: newName } : course
        )
      );
    }
  };

  const handleAssignmentClick = (assignmentId: number | string) => {
    console.log(`Assignment ${assignmentId} clicked`);
    // Implement assignment details view
  };

  const handleAnnouncementClick = (announcementId: number | string) => {
    console.log(`Announcement ${announcementId} clicked`);
    // Implement announcement details view
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Course Edit Modal */}
      {selectedCourse && (
        <CourseEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          courseId={selectedCourse.id}
          courseName={selectedCourse.name}
          onSave={handleSaveCourse}
        />
      )}

      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userName={userName}
        userMajor={userMajor}
        userInitials={userInitials}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <Header
          onSearchChange={setSearchQuery}
          onNotificationsClick={() => console.log('Notifications clicked')}
          onProfileClick={() => console.log('Profile clicked')}
          hasNotifications={true}
        />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
            <div className="flex space-x-2">
              {onRefresh && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onRefresh}
                  disabled={loading}
                >
                  {loading ? 'Refreshing...' : 'Refresh Data'}
                </Button>
              )}
              {onLogout && (
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={onLogout}
                >
                  Logout
                </Button>
              )}
            </div>
          </div>

          {/* Loading and Error States */}
          {loading && (
            <div className="bg-blue-50 text-blue-700 p-4 rounded-md mb-6">
              Loading Canvas data...
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
              {error}
            </div>
          )}

          {/* Current Courses - Prioritized at the top */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Current Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {courses.map((course, index) => (
                  <CourseCard
                    key={course.id}
                    color={colorOptions[index % colorOptions.length]}
                    courseCode={course.code}
                    courseName={course.name}
                    instructor={course.instructor}
                    progress={course.progress}
                    onSettingsClick={() => handleCourseSettingsClick(course.id)}
                  />
                ))}
                <CourseCard isAddCard={true} />
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="secondary" size="sm">
                  Customize Colors
                </Button>
                <Button variant="subtle" size="sm">
                  View All Courses
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Secondary Content - As you scroll down */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Upcoming Assignments - Now in main flow */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assignments.map((assignment) => (
                      <AssignmentItem
                        key={assignment.id}
                        id={assignment.id}
                        title={assignment.title}
                        course={assignment.courseName}
                        dueDate={assignment.dueDate}
                        urgent={assignment.urgent}
                        onClick={() => handleAssignmentClick(assignment.id)}
                      />
                    ))}
                  </div>
                  <Button variant="secondary" fullWidth={true} className="mt-4">
                    View All Assignments
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Announcements - Now in main flow */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Announcements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {announcements.map((announcement) => (
                      <AnnouncementItem
                        key={announcement.id}
                        id={announcement.id}
                        title={announcement.title}
                        date={announcement.formattedPostedAt}
                        content={announcement.message}
                        course={announcement.courseName}
                        onClick={() => handleAnnouncementClick(announcement.id)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Progress Metrics - At the bottom as you scroll down */}
          <h3 className="text-xl font-bold text-gray-800 mb-4">Your Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Stats Cards */}
            <StatCard
              title="Current GPA"
              value={stats.gpa}
              icon={<BarChart2 className="w-5 h-5" />}
              subtitle="+0.15 from last semester"
              subtitleColor="success"
              variant="success"
            />

            <StatCard
              title="Completed Credits"
              value={stats.completedCredits.toString()}
              icon={<CheckCircle className="w-5 h-5" />}
              subtitle="of 120 required"
              variant="info"
            />

            <StatCard
              title="Upcoming Deadlines"
              value={stats.upcomingDeadlines.toString()}
              icon={<Clock className="w-5 h-5" />}
              subtitle={`${stats.dueThisWeek} due this week`}
              subtitleColor="danger"
              variant="warning"
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
