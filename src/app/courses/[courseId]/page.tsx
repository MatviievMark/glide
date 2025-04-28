'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, GraduationCap, FileText, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Header from '@/components/dashboard/Header';
import Sidebar from '@/components/dashboard/Sidebar';
import AssignmentItem from '@/components/dashboard/AssignmentItem';
import { getCachedCanvasData } from '@/utils/canvas';

interface CoursePageProps {
  params: {
    courseId: string;
  };
}

export default function CoursePage({ params }: CoursePageProps) {
  const router = useRouter();
  const courseId = params.courseId;
  const [activeTab, setActiveTab] = useState('dashboard');
  const [courseData, setCourseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCourseData = () => {
      setLoading(true);
      setError(null);

      try {
        // Get data from cache
        const cachedData = getCachedCanvasData();
        if (!cachedData) {
          setError('No cached data found. Please return to dashboard to refresh data.');
          setLoading(false);
          return;
        }

        // Find course data in cache
        const courseDataKey = `complete_class_data_${courseId}`;
        if (!cachedData[courseDataKey] || !cachedData[courseDataKey].data) {
          setError('Course data not found in cache. Please return to dashboard to refresh data.');
          setLoading(false);
          return;
        }

        // Set course data
        setCourseData(cachedData[courseDataKey].data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading course data:', error);
        setError('An error occurred while loading course data.');
        setLoading(false);
      }
    };

    loadCourseData();
  }, [courseId]);

  const handleBackClick = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Error Loading Course</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleBackClick}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <div className="text-yellow-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Course Not Found</h2>
          <p className="text-gray-600 mb-4">The requested course could not be found.</p>
          <Button onClick={handleBackClick}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  // Extract course info
  const courseInfo = courseData.course_info || {};
  const courseName = courseInfo.name || 'Unknown Course';
  const courseCode = courseInfo.code || '';
  
  // Extract assignments
  const assignments = courseData.assignments || { upcoming: [], past: [], missing: [] };
  const upcomingAssignments = assignments.upcoming || [];
  const pastAssignments = assignments.past || [];
  const missingAssignments = assignments.missing || [];
  
  // Extract professors
  const professors = courseData.professors || [];
  
  // Extract grades
  const grades = courseData.grades || {};
  const currentGrade = grades.current_grade || 'N/A';
  const currentScore = grades.current_score !== undefined ? `${grades.current_score}%` : 'N/A';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userName="Student"
        userMajor="Major"
        userInitials="ST"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <Header
          onSearchChange={() => {}}
          onNotificationsClick={() => {}}
          onProfileClick={() => {}}
        />

        {/* Main Content Area with Scrolling */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-4 flex items-center"
            onClick={handleBackClick}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          {/* Course Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">{courseName}</h1>
            {courseCode && (
              <p className="text-sm text-gray-500">{courseCode}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Professors and Grade */}
            <div className="space-y-6">
              {/* Current Grade Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <GraduationCap className="mr-2 h-5 w-5 text-blue-500" />
                    Current Grade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Letter Grade</p>
                      <p className="text-2xl font-bold">{currentGrade}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Percentage</p>
                      <p className="text-2xl font-bold">{currentScore}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Professors Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Users className="mr-2 h-5 w-5 text-purple-500" />
                    Professors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {professors.length > 0 ? (
                    <ul className="space-y-3">
                      {professors.map((professor: any, index: number) => (
                        <li key={index} className="flex items-start">
                          <div className="bg-purple-100 text-purple-800 rounded-full h-8 w-8 flex items-center justify-center mr-3 flex-shrink-0">
                            {professor.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{professor.name}</p>
                            <p className="text-sm text-gray-500">{professor.role || 'Instructor'}</p>
                            {professor.email && (
                              <a href={`mailto:${professor.email}`} className="text-sm text-blue-500 hover:underline">
                                {professor.email}
                              </a>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No professor information available</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Middle and Right Columns - Assignments */}
            <div className="md:col-span-2 space-y-6">
              {/* Upcoming Assignments */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Calendar className="mr-2 h-5 w-5 text-green-500" />
                    Upcoming Assignments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingAssignments.length > 0 ? (
                    <div className="space-y-2">
                      {upcomingAssignments.map((assignment: any) => (
                        <AssignmentItem
                          key={assignment.id}
                          title={assignment.name}
                          dueDate={assignment.due_date}
                          courseName={courseName}
                          status="upcoming"
                          onClick={() => {}}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No upcoming assignments</p>
                  )}
                </CardContent>
              </Card>

              {/* Past Assignments */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="mr-2 h-5 w-5 text-blue-500" />
                    Past Assignments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pastAssignments.length > 0 ? (
                    <div className="space-y-2">
                      {pastAssignments.map((assignment: any) => (
                        <AssignmentItem
                          key={assignment.id}
                          title={assignment.name}
                          dueDate={assignment.due_date}
                          courseName={courseName}
                          status="past"
                          score={assignment.score}
                          pointsPossible={assignment.points_possible}
                          onClick={() => {}}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No past assignments</p>
                  )}
                </CardContent>
              </Card>

              {/* Missing Assignments */}
              {missingAssignments.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-lg">
                      <FileText className="mr-2 h-5 w-5 text-red-500" />
                      Missing Assignments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {missingAssignments.map((assignment: any) => (
                        <AssignmentItem
                          key={assignment.id}
                          title={assignment.name}
                          dueDate={assignment.due_date}
                          courseName={courseName}
                          status="missing"
                          pointsPossible={assignment.points_possible}
                          onClick={() => {}}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
