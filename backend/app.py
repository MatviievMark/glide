from flask import Flask, request, jsonify
from flask_cors import CORS
from canvas_manager import CanvasManager
import os
from dotenv import load_dotenv
from firebase_utils import initialize_firebase

# Load environment variables
load_dotenv()

# Initialize Firebase
firebase_success = initialize_firebase()
if not firebase_success:
    print("Warning: Firebase initialization failed")
    print("The application will fall back to environment variables for Canvas credentials")
else:
    print("Firebase initialized successfully")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Store canvas managers by user ID
canvas_managers = {}

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok"})

@app.route('/api/canvas/init', methods=['POST'])
def initialize_canvas():
    """Initialize Canvas API connection for a user"""
    data = request.json

    if not data or 'user_id' not in data:
        return jsonify({"error": "Missing user_id parameter"}), 400

    user_id = data['user_id']

    # Optional parameters - if provided, they will override Firebase credentials
    canvas_url = data.get('canvas_url')
    api_key = data.get('api_key')

    try:
        # Create a new Canvas manager for this user
        # If canvas_url and api_key are provided, they will be used
        # Otherwise, credentials will be fetched from Firebase
        canvas_managers[user_id] = CanvasManager(
            user_id=user_id,
            canvas_url=canvas_url,
            api_key=api_key
        )

        return jsonify({"status": "success", "message": "Canvas API initialized successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_canvas_manager(user_id):
    """Get or create a Canvas manager for a user"""
    if user_id in canvas_managers:
        return canvas_managers[user_id]

    # If we don't have a manager for this user, create one using Firebase credentials
    try:
        # Create a new Canvas manager for this user using Firebase credentials
        canvas_managers[user_id] = CanvasManager(user_id=user_id)
        return canvas_managers[user_id]
    except Exception as e:
        print(f"Error creating Canvas manager for user {user_id}: {e}")
        return None

@app.route('/api/canvas/current-classes', methods=['GET'])
def get_current_classes():
    """Get current classes for a user"""
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"error": "Missing user_id parameter"}), 400

    canvas_manager = get_canvas_manager(user_id)
    if not canvas_manager:
        return jsonify({"error": "Canvas API not initialized for this user"}), 400

    try:
        classes = canvas_manager.get_current_classes()
        return jsonify({"data": classes, "error": None})
    except Exception as e:
        return jsonify({"data": None, "error": str(e)}), 500

@app.route('/api/canvas/all-classes', methods=['GET'])
def get_all_classes():
    """Get all classes for a user"""
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"error": "Missing user_id parameter"}), 400

    canvas_manager = get_canvas_manager(user_id)
    if not canvas_manager:
        return jsonify({"error": "Canvas API not initialized for this user"}), 400

    try:
        classes = canvas_manager.get_all_classes()
        return jsonify({"data": classes, "error": None})
    except Exception as e:
        return jsonify({"data": None, "error": str(e)}), 500

@app.route('/api/canvas/class-assignments/<course_id>', methods=['GET'])
def get_class_assignments(course_id):
    """Get assignments for a specific class"""
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"error": "Missing user_id parameter"}), 400

    canvas_manager = get_canvas_manager(user_id)
    if not canvas_manager:
        return jsonify({"error": "Canvas API not initialized for this user"}), 400

    try:
        assignments = canvas_manager.get_class_assignments(course_id)
        return jsonify({"data": assignments, "error": None})
    except Exception as e:
        return jsonify({"data": None, "error": str(e)}), 500

@app.route('/api/canvas/class-syllabus/<course_id>', methods=['GET'])
def get_class_syllabus(course_id):
    """Get syllabus for a specific class"""
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"error": "Missing user_id parameter"}), 400

    canvas_manager = get_canvas_manager(user_id)
    if not canvas_manager:
        return jsonify({"error": "Canvas API not initialized for this user"}), 400

    try:
        syllabus = canvas_manager.get_class_syllabus(course_id)
        return jsonify({"data": syllabus, "error": None})
    except Exception as e:
        return jsonify({"data": None, "error": str(e)}), 500

@app.route('/api/canvas/class-grades/<course_id>', methods=['GET'])
def get_class_grades(course_id):
    """Get grades for a specific class"""
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"error": "Missing user_id parameter"}), 400

    canvas_manager = get_canvas_manager(user_id)
    if not canvas_manager:
        return jsonify({"error": "Canvas API not initialized for this user"}), 400

    try:
        grades = canvas_manager.get_class_grades(course_id)
        return jsonify({"data": grades, "error": None})
    except Exception as e:
        return jsonify({"data": None, "error": str(e)}), 500

@app.route('/api/canvas/upcoming-tests/<course_id>', methods=['GET'])
def get_upcoming_tests(course_id):
    """Get upcoming tests for a specific class"""
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"error": "Missing user_id parameter"}), 400

    canvas_manager = get_canvas_manager(user_id)
    if not canvas_manager:
        return jsonify({"error": "Canvas API not initialized for this user"}), 400

    try:
        tests = canvas_manager.get_upcoming_tests(course_id)
        return jsonify({"data": tests, "error": None})
    except Exception as e:
        return jsonify({"data": None, "error": str(e)}), 500

@app.route('/api/canvas/course-modules/<course_id>', methods=['GET'])
def get_course_modules(course_id):
    """Get modules for a specific course"""
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"error": "Missing user_id parameter"}), 400

    canvas_manager = get_canvas_manager(user_id)
    if not canvas_manager:
        return jsonify({"error": "Canvas API not initialized for this user"}), 400

    try:
        modules = canvas_manager.get_course_modules(course_id)
        return jsonify({"data": modules, "error": None})
    except Exception as e:
        return jsonify({"data": None, "error": str(e)}), 500

@app.route('/api/canvas/course-announcements/<course_id>', methods=['GET'])
def get_course_announcements(course_id):
    """Get announcements for a specific course"""
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"error": "Missing user_id parameter"}), 400

    canvas_manager = get_canvas_manager(user_id)
    if not canvas_manager:
        return jsonify({"error": "Canvas API not initialized for this user"}), 400

    try:
        announcements = canvas_manager.get_course_announcements(course_id)
        return jsonify({"data": announcements, "error": None})
    except Exception as e:
        return jsonify({"data": None, "error": str(e)}), 500

@app.route('/api/canvas/course-discussions/<course_id>', methods=['GET'])
def get_course_discussions(course_id):
    """Get discussions for a specific course"""
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"error": "Missing user_id parameter"}), 400

    canvas_manager = get_canvas_manager(user_id)
    if not canvas_manager:
        return jsonify({"error": "Canvas API not initialized for this user"}), 400

    try:
        discussions = canvas_manager.get_course_discussions(course_id)
        return jsonify({"data": discussions, "error": None})
    except Exception as e:
        return jsonify({"data": None, "error": str(e)}), 500

@app.route('/api/canvas/calendar-events', methods=['GET'])
def get_calendar_events():
    """Get calendar events for a user"""
    user_id = request.args.get('user_id')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if not user_id:
        return jsonify({"error": "Missing user_id parameter"}), 400

    canvas_manager = get_canvas_manager(user_id)
    if not canvas_manager:
        return jsonify({"error": "Canvas API not initialized for this user"}), 400

    try:
        events = canvas_manager.get_calendar_events(start_date, end_date)
        return jsonify({"data": events, "error": None})
    except Exception as e:
        return jsonify({"data": None, "error": str(e)}), 500

@app.route('/api/canvas/assignment-feedback/<course_id>/<assignment_id>', methods=['GET'])
def get_assignment_feedback(course_id, assignment_id):
    """Get feedback for a specific assignment"""
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"error": "Missing user_id parameter"}), 400

    canvas_manager = get_canvas_manager(user_id)
    if not canvas_manager:
        return jsonify({"error": "Canvas API not initialized for this user"}), 400

    try:
        feedback = canvas_manager.get_assignment_feedback(course_id, assignment_id)
        return jsonify({"data": feedback, "error": None})
    except Exception as e:
        return jsonify({"data": None, "error": str(e)}), 500

@app.route('/api/canvas/complete-class-data/<course_id>', methods=['GET'])
def get_complete_class_data(course_id):
    """Get complete data for a specific class"""
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"error": "Missing user_id parameter"}), 400

    canvas_manager = get_canvas_manager(user_id)
    if not canvas_manager:
        return jsonify({"error": "Canvas API not initialized for this user"}), 400

    try:
        class_data = canvas_manager.get_complete_class_data(course_id)
        return jsonify({"data": class_data, "error": None})
    except Exception as e:
        return jsonify({"data": None, "error": str(e)}), 500

@app.route('/api/canvas/user-profile', methods=['GET'])
def get_user_profile():
    """Get the current user's profile"""
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"error": "Missing user_id parameter"}), 400

    canvas_manager = get_canvas_manager(user_id)
    if not canvas_manager:
        return jsonify({"error": "Canvas API not initialized for this user"}), 400

    try:
        user = canvas_manager.user
        profile = {
            'id': user.id,
            'name': user.name,
            'email': getattr(user, 'email', None),
            'avatar_url': getattr(user, 'avatar_url', None),
            'bio': getattr(user, 'bio', None)
        }
        return jsonify({"data": profile, "error": None})
    except Exception as e:
        return jsonify({"data": None, "error": str(e)}), 500

@app.route('/api/canvas/todo', methods=['GET'])
def get_todo():
    """Get the current user's to-do items"""
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"error": "Missing user_id parameter"}), 400

    canvas_manager = get_canvas_manager(user_id)
    if not canvas_manager:
        return jsonify({"error": "Canvas API not initialized for this user"}), 400

    try:
        todo_items = []
        for item in canvas_manager.user.get_todo_items():
            todo_items.append({
                'id': item.id,
                'title': item.title,
                'context_type': getattr(item, 'context_type', None),
                'course_id': getattr(item, 'course_id', None),
                'assignment': getattr(item, 'assignment', None),
                'ignore': getattr(item, 'ignore', None),
                'ignore_permanently': getattr(item, 'ignore_permanently', None),
                'html_url': getattr(item, 'html_url', None)
            })
        return jsonify({"data": todo_items, "error": None})
    except Exception as e:
        return jsonify({"data": None, "error": str(e)}), 500

@app.route('/api/canvas/upcoming-events', methods=['GET'])
def get_upcoming_events():
    """Get the current user's upcoming events"""
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"error": "Missing user_id parameter"}), 400

    canvas_manager = get_canvas_manager(user_id)
    if not canvas_manager:
        return jsonify({"error": "Canvas API not initialized for this user"}), 400

    try:
        upcoming_events = []
        for event in canvas_manager.user.get_upcoming_events():
            upcoming_events.append({
                'id': event.id,
                'title': event.title,
                'start_at': getattr(event, 'start_at', None),
                'end_at': getattr(event, 'end_at', None),
                'html_url': getattr(event, 'html_url', None),
                'context_type': getattr(event, 'context_type', None),
                'context_name': getattr(event, 'context_name', None)
            })
        return jsonify({"data": upcoming_events, "error": None})
    except Exception as e:
        return jsonify({"data": None, "error": str(e)}), 500

@app.route('/api/canvas/find-course-id', methods=['GET'])
def find_course_id():
    """Find a course ID by name"""
    user_id = request.args.get('user_id')
    class_name = request.args.get('class_name')

    if not user_id or not class_name:
        return jsonify({"error": "Missing required parameters"}), 400

    canvas_manager = get_canvas_manager(user_id)
    if not canvas_manager:
        return jsonify({"error": "Canvas API not initialized for this user"}), 400

    try:
        course_id = canvas_manager.find_course_id(class_name)
        return jsonify({"data": course_id, "error": None})
    except Exception as e:
        return jsonify({"data": None, "error": str(e)}), 500

@app.route('/api/canvas/all-data', methods=['GET'])
def get_all_data():
    """Get all Canvas data for a user (similar to the original fetchAllCanvasData)"""
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"error": "Missing user_id parameter"}), 400

    canvas_manager = get_canvas_manager(user_id)
    if not canvas_manager:
        return jsonify({"error": "Canvas API not initialized for this user"}), 400

    try:
        # Collect all the data we need
        all_data = {}

        # Get courses
        all_data['courses'] = {
            'data': canvas_manager.get_all_classes(),
            'error': None
        }

        # Get user profile
        user = canvas_manager.user
        all_data['self'] = {
            'data': {
                'id': user.id,
                'name': user.name,
                'email': getattr(user, 'email', None),
                'avatar_url': getattr(user, 'avatar_url', None),
                'bio': getattr(user, 'bio', None)
            },
            'error': None
        }

        # Get todo items
        try:
            todo_items = []
            for item in user.get_todo_items():
                todo_items.append({
                    'id': item.id,
                    'title': item.title,
                    'context_type': getattr(item, 'context_type', None),
                    'course_id': getattr(item, 'course_id', None),
                    'assignment': getattr(item, 'assignment', None),
                    'ignore': getattr(item, 'ignore', None),
                    'ignore_permanently': getattr(item, 'ignore_permanently', None),
                    'html_url': getattr(item, 'html_url', None)
                })
            all_data['todo'] = {
                'data': todo_items,
                'error': None
            }
        except Exception as e:
            all_data['todo'] = {
                'data': None,
                'error': str(e)
            }

        # Get upcoming events
        try:
            upcoming_events = []
            for event in user.get_upcoming_events():
                upcoming_events.append({
                    'id': event.id,
                    'title': event.title,
                    'start_at': getattr(event, 'start_at', None),
                    'end_at': getattr(event, 'end_at', None),
                    'html_url': getattr(event, 'html_url', None),
                    'context_type': getattr(event, 'context_type', None),
                    'context_name': getattr(event, 'context_name', None)
                })
            all_data['upcoming_events'] = {
                'data': upcoming_events,
                'error': None
            }
        except Exception as e:
            all_data['upcoming_events'] = {
                'data': None,
                'error': str(e)
            }

        # Get calendar events
        try:
            all_data['calendar_events'] = {
                'data': canvas_manager.get_calendar_events(),
                'error': None
            }
        except Exception as e:
            all_data['calendar_events'] = {
                'data': None,
                'error': str(e)
            }

        # Get groups
        try:
            groups = []
            for group in user.get_groups():
                groups.append({
                    'id': group.id,
                    'name': group.name,
                    'description': getattr(group, 'description', None),
                    'context_type': getattr(group, 'context_type', None),
                    'course_id': getattr(group, 'course_id', None)
                })
            all_data['groups'] = {
                'data': groups,
                'error': None
            }
        except Exception as e:
            all_data['groups'] = {
                'data': None,
                'error': str(e)
            }

        # Get enrollments
        try:
            enrollments = []
            for enrollment in user.get_enrollments():
                enrollments.append({
                    'id': enrollment.id,
                    'course_id': enrollment.course_id,
                    'type': enrollment.type,
                    'role': enrollment.role,
                    'grades': getattr(enrollment, 'grades', None)
                })
            all_data['enrollments'] = {
                'data': enrollments,
                'error': None
            }
        except Exception as e:
            all_data['enrollments'] = {
                'data': None,
                'error': str(e)
            }

        # Get favorite courses
        try:
            favorites = []
            for favorite in user.get_favorite_courses():
                favorites.append({
                    'id': favorite.id,
                    'name': favorite.name,
                    'course_code': getattr(favorite, 'course_code', None)
                })
            all_data['favorites_courses'] = {
                'data': favorites,
                'error': None
            }
        except Exception as e:
            all_data['favorites_courses'] = {
                'data': None,
                'error': str(e)
            }

        # Get communication channels
        try:
            channels = []
            for channel in user.get_communication_channels():
                channels.append({
                    'id': channel.id,
                    'address': channel.address,
                    'type': channel.type,
                    'position': channel.position,
                    'workflow_state': channel.workflow_state
                })
            all_data['communication_channels'] = {
                'data': channels,
                'error': None
            }
        except Exception as e:
            all_data['communication_channels'] = {
                'data': None,
                'error': str(e)
            }

        # Get user profile
        try:
            all_data['profile'] = {
                'data': {
                    'id': user.id,
                    'name': user.name,
                    'short_name': getattr(user, 'short_name', None),
                    'sortable_name': getattr(user, 'sortable_name', None),
                    'title': getattr(user, 'title', None),
                    'bio': getattr(user, 'bio', None),
                    'primary_email': getattr(user, 'primary_email', None),
                    'login_id': getattr(user, 'login_id', None),
                    'avatar_url': getattr(user, 'avatar_url', None)
                },
                'error': None
            }
        except Exception as e:
            all_data['profile'] = {
                'data': None,
                'error': str(e)
            }

        # Get announcements
        try:
            # This is a simplified version - in a real app, you'd need to get announcements for each course
            announcements = []
            for course in canvas_manager.get_all_classes():
                course_id = course['course_id']
                try:
                    course_announcements = canvas_manager.get_course_announcements(course_id)
                    if course_announcements:
                        for announcement in course_announcements:
                            announcement['course_id'] = course_id
                            announcement['course_name'] = course['course_name']
                            announcements.append(announcement)
                except:
                    # Skip if we can't get announcements for this course
                    pass

            all_data['announcements'] = {
                'data': announcements,
                'error': None
            }
        except Exception as e:
            all_data['announcements'] = {
                'data': None,
                'error': str(e)
            }

        # Get grades data
        try:
            grades_data = []
            for enrollment in user.get_enrollments():
                if hasattr(enrollment, 'grades'):
                    grades_data.append({
                        'course_id': enrollment.course_id,
                        'grades': enrollment.grades
                    })

            all_data['grades'] = {
                'data': grades_data,
                'error': None
            }
        except Exception as e:
            all_data['grades'] = {
                'data': None,
                'error': str(e)
            }

        return jsonify(all_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
