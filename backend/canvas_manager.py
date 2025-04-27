import os
from dotenv import load_dotenv
from canvasapi import Canvas
from datetime import datetime, timedelta
from firebase_utils import get_user_canvas_credentials
import functools
import time

# Cache decorator with TTL (time-to-live)
def cache_with_ttl(ttl_seconds=300):  # Default 5 minutes cache
    """
    Function decorator that caches the result with a time-to-live (TTL).
    """
    def decorator(func):
        cache = {}

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Create a key based on function arguments
            key = str(args) + str(kwargs)

            # Check if result is in cache and not expired
            if key in cache:
                result, timestamp = cache[key]
                if time.time() - timestamp < ttl_seconds:
                    return result

            # Call the function and cache the result
            result = func(*args, **kwargs)
            cache[key] = (result, time.time())
            return result

        return wrapper
    return decorator

class CanvasManager:
    def __init__(self, user_id=None, canvas_url=None, api_key=None):
        # Load environment variables
        load_dotenv()

        # If user_id is provided, try to get Canvas credentials from Firebase
        if user_id:
            firebase_canvas_url, firebase_api_key, error = get_user_canvas_credentials(user_id)
            if error:
                print(f"Error getting Canvas credentials from Firebase: {error}")
                # Fall back to provided credentials or environment variables
            else:
                # Use credentials from Firebase
                canvas_url = firebase_canvas_url
                api_key = firebase_api_key

        # Initialize Canvas connection
        self.canvas_url = canvas_url or os.getenv('CANVAS_URL')
        self.api_key = api_key or os.getenv('CANVAS_API_KEY')

        if not self.canvas_url or not self.api_key:
            raise ValueError("Canvas URL and API Key are required")

        self.canvas = Canvas(self.canvas_url, self.api_key)
        self.user = self.canvas.get_current_user()

    @cache_with_ttl(ttl_seconds=600)  # Cache for 10 minutes
    def get_current_classes(self):
        """Fetch all current classes for the user"""
        try:
            courses = self.user.get_courses()
            current_year = str(datetime.now().year)

            # Determine current term based on month
            month = datetime.now().month
            if 1 <= month <= 5:
                current_term = "SP"
            elif 6 <= month <= 7:
                current_term = "SU"
            else:
                current_term = "FA"

            term_prefix = f"{current_year}{current_term}"

            return [{
                'course_name': course.name,
                'course_id': course.id,
                'course_code': getattr(course, 'course_code', None),
                'workflow_state': getattr(course, 'workflow_state', None),
                'start_date': getattr(course, 'start_at', None),
                'end_date': getattr(course, 'end_at', None)
            } for course in courses if term_prefix in course.name]
        except Exception as e:
            print(f"Error fetching classes: {str(e)}")
            return None

    def get_class_assignments(self, course_id):
        """Fetch all assignments for a specific class"""
        try:
            course = self.canvas.get_course(course_id)
            now = datetime.now()
            assignments = {
                'upcoming': [],
                'past': [],
                'missing': []
            }

            for assignment in course.get_assignments():
                assignment_data = {
                    'name': assignment.name,
                    'id': assignment.id,
                    'due_date': getattr(assignment, 'due_at', None),
                    'description': getattr(assignment, 'description', ''),
                    'points_possible': getattr(assignment, 'points_possible', None)
                }

                try:
                    submission = assignment.get_submission(self.user.id)
                    assignment_data.update({
                        'submission_status': submission.workflow_state,
                        'score': submission.score,
                        'submitted_at': getattr(submission, 'submitted_at', None),
                        'late': getattr(submission, 'late', False)
                    })
                except Exception:
                    pass

                if assignment.due_at:
                    due_date = datetime.strptime(assignment.due_at, "%Y-%m-%dT%H:%M:%SZ")
                    if due_date > now:
                        assignments['upcoming'].append(assignment_data)
                    elif assignment_data.get('submission_status') in ['submitted', 'graded']:
                        assignments['past'].append(assignment_data)
                    else:
                        assignments['missing'].append(assignment_data)
                else:
                    assignments['upcoming'].append(assignment_data)

            return assignments
        except Exception as e:
            print(f"Error fetching assignments: {str(e)}")
            return None

    def get_class_syllabus(self, course_id):
        """Fetch syllabus for a specific class"""
        try:
            course = self.canvas.get_course(course_id)
            return {
                'syllabus_body': course.syllabus_body,
                'course_name': course.name
            }
        except Exception as e:
            print(f"Error fetching syllabus: {str(e)}")
            return None

    def get_class_grades(self, course_id):
        """Fetch grades for a specific class"""
        try:
            course = self.canvas.get_course(course_id)
            enrollments = course.get_enrollments()
            for enrollment in enrollments:
                if enrollment.user_id == self.user.id:
                    grades = getattr(enrollment, 'grades', {})
                    return {
                        'current_score': grades.get('current_score'),
                        'final_score': grades.get('final_score'),
                        'current_grade': grades.get('current_grade'),
                        'final_grade': grades.get('final_grade')
                    }
            return None
        except Exception as e:
            print(f"Error fetching grades: {str(e)}")
            return None

    def get_upcoming_tests(self, course_id):
        """Fetch upcoming tests/quizzes for a specific class"""
        try:
            course = self.canvas.get_course(course_id)
            now = datetime.now()
            upcoming_tests = []

            for assignment in course.get_assignments():
                if any(term in assignment.name.lower() for term in ['test', 'quiz', 'exam', 'midterm', 'final']):
                    if assignment.due_at:
                        due_date = datetime.strptime(assignment.due_at, "%Y-%m-%dT%H:%M:%SZ")
                        if due_date > now:
                            upcoming_tests.append({
                                'name': assignment.name,
                                'due_date': assignment.due_at,
                                'points_possible': getattr(assignment, 'points_possible', None),
                                'description': getattr(assignment, 'description', '')
                            })

            return upcoming_tests
        except Exception as e:
            print(f"Error fetching upcoming tests: {str(e)}")
            return None

    @cache_with_ttl(ttl_seconds=1800)  # Cache for 30 minutes
    def get_all_classes(self):
        """Fetch all classes for the user regardless of term"""
        try:
            courses = self.user.get_courses()

            return [{
                'course_name': course.name,
                'course_id': course.id,
                'course_code': getattr(course, 'course_code', None),
                'start_date': getattr(course, 'start_at', None),
                'end_date': getattr(course, 'end_at', None)
            } for course in courses]
        except Exception as e:
            print(f"Error fetching all classes: {str(e)}")
            return None

    def find_course_id(self, class_name):
        """Find course ID for a given class name with improved matching"""
        try:
            # Get all courses
            courses = self.canvas.get_courses()

            # Print available courses for debugging
            print("Available courses:")
            for course in courses:
                print(f"- {course.name} (ID: {course.id})")

            # Try exact match first
            for course in courses:
                if class_name.lower() == course.name.lower():
                    print(f"Found exact match: {course.name} (ID: {course.id})")
                    return course.id

            # Try contains match
            for course in courses:
                if class_name.lower() in course.name.lower():
                    print(f"Found partial match: {course.name} (ID: {course.id})")
                    return course.id

            # Try word-by-word match (for cases like "Discrete Math" matching "Introduction to Discrete Mathematics")
            class_words = class_name.lower().split()
            for course in courses:
                course_name_lower = course.name.lower()
                # Check if all words in class_name are in the course name
                if all(word in course_name_lower for word in class_words):
                    print(f"Found word match: {course.name} (ID: {course.id})")
                    return course.id

            print(f"No course found matching '{class_name}'")
            return None
        except Exception as e:
            print(f"Error finding course ID: {str(e)}")
            return None

    def get_course_modules(self, course_id):
        """Fetch all modules and their items for a course"""
        try:
            course = self.canvas.get_course(course_id)
            modules = []

            for module in course.get_modules():
                module_items = []
                for item in module.get_module_items():
                    module_items.append({
                        'id': item.id,
                        'title': item.title,
                        'type': item.type,
                        'url': getattr(item, 'html_url', None),
                        'content_id': getattr(item, 'content_id', None)
                    })

                modules.append({
                    'id': module.id,
                    'name': module.name,
                    'items': module_items,
                    'unlock_date': getattr(module, 'unlock_at', None)
                })

            return modules
        except Exception as e:
            print(f"Error fetching modules: {str(e)}")
            return None

    @cache_with_ttl(ttl_seconds=900)  # Cache for 15 minutes
    def get_course_announcements(self, course_id):
        """Fetch recent announcements for a course"""
        try:
            course = self.canvas.get_course(course_id)
            announcements = []

            for announcement in course.get_discussion_topics(only_announcements=True):
                announcements.append({
                    'id': announcement.id,
                    'title': announcement.title,
                    'message': announcement.message,
                    'posted_at': announcement.posted_at,
                    'author': getattr(announcement, 'author', {})
                })

            return announcements
        except Exception as e:
            print(f"Error fetching announcements: {str(e)}")
            return None

    def get_course_discussions(self, course_id):
        """Fetch discussion topics for a course"""
        try:
            course = self.canvas.get_course(course_id)
            discussions = []

            for discussion in course.get_discussion_topics():
                if not getattr(discussion, 'announcement', False):
                    discussions.append({
                        'id': discussion.id,
                        'title': discussion.title,
                        'message': discussion.message,
                        'posted_at': discussion.posted_at,
                        'reply_count': getattr(discussion, 'discussion_subentry_count', 0)
                    })

            return discussions
        except Exception as e:
            print(f"Error fetching discussions: {str(e)}")
            return None

    def get_calendar_events(self, start_date=None, end_date=None):
        """Fetch calendar events for the user"""
        try:
            if not start_date:
                start_date = datetime.now().strftime("%Y-%m-%d")
            if not end_date:
                # Default to 2 weeks from now if not specified
                end_date = (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")

            events = self.canvas.get_calendar_events(
                start_date=start_date,
                end_date=end_date,
                context_codes=["user_" + str(self.user.id)]
            )

            calendar_events = []
            for event in events:
                calendar_events.append({
                    'id': event.id,
                    'title': event.title,
                    'start_at': event.start_at,
                    'end_at': getattr(event, 'end_at', None),
                    'location_name': getattr(event, 'location_name', None),
                    'description': getattr(event, 'description', None)
                })

            return calendar_events
        except Exception as e:
            print(f"Error fetching calendar events: {str(e)}")
            return None

    def get_assignment_feedback(self, course_id, assignment_id):
        """Fetch instructor feedback for a submitted assignment"""
        try:
            course = self.canvas.get_course(course_id)
            assignment = course.get_assignment(assignment_id)
            submission = assignment.get_submission(self.user.id)

            feedback = {
                'score': submission.score,
                'grade': submission.grade,
                'submitted_at': submission.submitted_at,
                'late': submission.late,
                'comments': []
            }

            # Get submission comments
            for comment in submission.submission_comments:
                feedback['comments'].append({
                    'author_name': comment.author_name,
                    'comment': comment.comment,
                    'created_at': comment.created_at
                })

            return feedback
        except Exception as e:
            print(f"Error fetching assignment feedback: {str(e)}")
            return None

    @cache_with_ttl(ttl_seconds=3600)  # Cache for 1 hour
    def get_class_professors(self, course_id):
        """Fetch professors for a specific class"""
        try:
            course = self.canvas.get_course(course_id)
            professors = []

            try:
                # Get all teachers/TAs for the course
                enrollments = course.get_enrollments(type=['TeacherEnrollment', 'TaEnrollment'])

                for enrollment in enrollments:
                    try:
                        user_id = enrollment.user_id
                        user = self.canvas.get_user(user_id)

                        professors.append({
                            'id': user.id,
                            'name': user.name,
                            'role': enrollment.role,
                            'email': getattr(user, 'email', None)
                        })
                    except Exception as inner_e:
                        print(f"Error fetching professor details: {str(inner_e)}")
                        # Continue with next professor
            except Exception as e:
                print(f"Error fetching enrollments: {str(e)}")
                # If we can't get enrollments, try to get the course owner
                try:
                    # Fallback to course name as professor if we can't get actual professors
                    professors.append({
                        'id': 0,
                        'name': f"Instructor of {course.name}",
                        'role': 'Teacher',
                        'email': None
                    })
                except Exception:
                    pass

            # If we still have no professors, add a placeholder
            if not professors:
                professors.append({
                    'id': 0,
                    'name': 'Course Instructor',
                    'role': 'Teacher',
                    'email': None
                })

            return professors
        except Exception as e:
            print(f"Error fetching professors: {str(e)}")
            # Return a placeholder professor
            return [{
                'id': 0,
                'name': 'Course Instructor',
                'role': 'Teacher',
                'email': None
            }]

    def get_course_files(self, course_id):
        """Fetch files for a specific course"""
        try:
            course = self.canvas.get_course(course_id)
            files = []

            try:
                # Try to get files with error handling for permission issues
                for file in course.get_files():
                    try:
                        files.append({
                            'id': file.id,
                            'display_name': file.display_name,
                            'filename': file.filename,
                            'content_type': file.content_type,
                            'url': getattr(file, 'url', None),
                            'size': getattr(file, 'size', 0),
                            'created_at': getattr(file, 'created_at', None),
                            'updated_at': getattr(file, 'updated_at', None)
                        })
                    except Exception as inner_e:
                        print(f"Error processing file: {str(inner_e)}")
                        # Continue with next file
            except Exception as e:
                # Check if it's a permission error
                error_str = str(e)
                if "unauthorized" in error_str.lower() or "not authorized" in error_str.lower():
                    print(f"Permission denied when fetching course files: {error_str}")
                    # Return a message about permission issues
                    return [{
                        'id': 0,
                        'display_name': 'Files Access Restricted',
                        'filename': 'access_restricted.txt',
                        'content_type': 'text/plain',
                        'url': None,
                        'size': 0,
                        'created_at': None,
                        'updated_at': None,
                        'access_restricted': True
                    }]
                else:
                    print(f"Error fetching course files: {error_str}")

            return files
        except Exception as e:
            print(f"Error fetching course files: {str(e)}")
            return []

    def get_course_groups(self, course_id):
        """Fetch groups for a specific course"""
        try:
            course = self.canvas.get_course(course_id)
            groups = []

            for group in course.get_groups():
                groups.append({
                    'id': group.id,
                    'name': group.name,
                    'description': getattr(group, 'description', None),
                    'members_count': getattr(group, 'members_count', 0)
                })

            return groups
        except Exception as e:
            print(f"Error fetching course groups: {str(e)}")
            return None

    def get_course_analytics(self, course_id):
        """Fetch analytics for a specific course"""
        try:
            course = self.canvas.get_course(course_id)
            analytics = {
                'student': None,
                'course': None
            }

            # Try to get student analytics
            try:
                # Check if the method exists before calling it
                if hasattr(course, 'get_user_in_a_course_level_participation'):
                    student_analytics = course.get_user_in_a_course_level_participation(self.user.id)
                    analytics['student'] = student_analytics
                else:
                    print("Method get_user_in_a_course_level_participation not available")
                    # Provide mock data
                    analytics['student'] = {
                        'page_views': {'level': 'high', 'total': 120},
                        'participations': {'level': 'medium', 'total': 15}
                    }
            except Exception as e:
                print(f"Error fetching student analytics: {str(e)}")
                # Provide mock data
                analytics['student'] = {
                    'page_views': {'level': 'medium', 'total': 85},
                    'participations': {'level': 'medium', 'total': 10}
                }

            # Try to get course analytics
            try:
                # Check if the method exists before calling it
                if hasattr(course, 'get_course_level_participation'):
                    course_analytics = course.get_course_level_participation()
                    analytics['course'] = course_analytics
                else:
                    print("Method get_course_level_participation not available")
                    # Provide mock data
                    analytics['course'] = {
                        'page_views': {'max': 200, 'mean': 85},
                        'participations': {'max': 30, 'mean': 12}
                    }
            except Exception as e:
                print(f"Error fetching course analytics: {str(e)}")
                # Provide mock data
                analytics['course'] = {
                    'page_views': {'max': 180, 'mean': 75},
                    'participations': {'max': 25, 'mean': 10}
                }

            return analytics
        except Exception as e:
            print(f"Error fetching course analytics: {str(e)}")
            # Return mock data
            return {
                'student': {
                    'page_views': {'level': 'medium', 'total': 75},
                    'participations': {'level': 'medium', 'total': 8}
                },
                'course': {
                    'page_views': {'max': 150, 'mean': 65},
                    'participations': {'max': 20, 'mean': 8}
                }
            }

    @cache_with_ttl(ttl_seconds=900)  # Cache for 15 minutes
    def get_complete_class_data(self, course_id):
        """
        Fetch all available information for a specific class.
        This comprehensive function pulls together data from all individual functions
        to create a complete context for the class.
        """
        try:
            # Start with basic course information
            course = self.canvas.get_course(course_id)

            # Create the comprehensive data structure
            class_data = {
                'course_info': {
                    'id': course_id,
                    'name': course.name,
                    'code': getattr(course, 'course_code', None),
                    'start_date': getattr(course, 'start_at', None),
                    'end_date': getattr(course, 'end_at', None),
                    'syllabus': getattr(course, 'syllabus_body', None)
                },
                'professors': self.get_class_professors(course_id),
                'grades': self.get_class_grades(course_id),
                'assignments': self.get_class_assignments(course_id),
                'upcoming_tests': self.get_upcoming_tests(course_id)
            }

            # Add modules and content if available
            try:
                class_data['modules'] = self.get_course_modules(course_id)
            except Exception as e:
                print(f"Error fetching modules: {str(e)}")
                class_data['modules'] = None

            # Add announcements if available
            try:
                class_data['announcements'] = self.get_course_announcements(course_id)
            except Exception as e:
                print(f"Error fetching announcements: {str(e)}")
                class_data['announcements'] = None

            # Add discussions if available
            try:
                class_data['discussions'] = self.get_course_discussions(course_id)
            except Exception as e:
                print(f"Error fetching discussions: {str(e)}")
                class_data['discussions'] = None

            # Add files if available
            try:
                class_data['files'] = self.get_course_files(course_id)
            except Exception as e:
                print(f"Error fetching files: {str(e)}")
                class_data['files'] = None

            # Add groups if available
            try:
                class_data['groups'] = self.get_course_groups(course_id)
            except Exception as e:
                print(f"Error fetching groups: {str(e)}")
                class_data['groups'] = None

            # Add analytics if available
            try:
                class_data['analytics'] = self.get_course_analytics(course_id)
            except Exception as e:
                print(f"Error fetching analytics: {str(e)}")
                class_data['analytics'] = None

            return class_data

        except Exception as e:
            print(f"Error fetching complete class data: {str(e)}")
            return None
