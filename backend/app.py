from flask import Flask, request, jsonify
from flask_cors import CORS
from canvas_manager import CanvasManager
import os
from dotenv import load_dotenv
import concurrent.futures
import threading

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/')
def index():
    return jsonify({"status": "Canvas API Backend is running"})

@app.route('/api/canvas/init', methods=['POST'])
def initialize_canvas():
    """Initialize Canvas API for a user"""
    data = request.json
    user_id = data.get('user_id')

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    try:
        # Initialize Canvas manager with user credentials from Firebase
        canvas_manager = CanvasManager(user_id=user_id)

        # Test connection by getting user info
        user = canvas_manager.user

        return jsonify({
            "status": "success",
            "user": {
                "id": user.id,
                "name": user.name
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/canvas/all-courses-id', methods=['GET'])
def get_all_courses_id():
    """Get course IDs for a student (current semester by default)"""
    user_id = request.args.get('user_id')
    load_all = request.args.get('load_all', 'false').lower() == 'true'

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    try:
        # Initialize Canvas manager with user credentials from Firebase
        canvas_manager = CanvasManager(user_id=user_id)

        # Get courses (current semester by default, or all if specified)
        courses = canvas_manager.get_all_classes() if load_all else canvas_manager.get_current_classes()

        if not courses:
            return jsonify({"error": "No courses found"}), 404

        # Extract course IDs
        course_ids = [course['course_id'] for course in courses]

        return jsonify({
            "status": "success",
            "course_ids": course_ids,
            "courses": courses  # Include full course data for convenience
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/canvas/course-data/<course_id>', methods=['GET'])
def get_course_data(course_id):
    """Get complete data for a specific course"""
    user_id = request.args.get('user_id')

    # Optional parameters for selective loading
    load_modules = request.args.get('load_modules', 'true').lower() == 'true'
    load_files = request.args.get('load_files', 'true').lower() == 'true'
    load_discussions = request.args.get('load_discussions', 'true').lower() == 'true'
    load_groups = request.args.get('load_groups', 'true').lower() == 'true'
    load_analytics = request.args.get('load_analytics', 'true').lower() == 'true'

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    try:
        # Initialize Canvas manager with user credentials from Firebase
        canvas_manager = CanvasManager(user_id=user_id)

        # Get complete class data - this is now cached
        course_data = canvas_manager.get_complete_class_data(course_id)

        if not course_data:
            return jsonify({"error": f"No data found for course {course_id}"}), 404

        # Check if we need to extract professor info from announcements
        if (not course_data.get('professors') or
            (len(course_data['professors']) == 1 and course_data['professors'][0]['name'] == 'Course Instructor')):

            # Try to extract professor info from announcements
            if course_data.get('announcements'):
                professors = []
                for announcement in course_data['announcements']:
                    if 'author' in announcement and announcement['author'] and 'display_name' in announcement['author']:
                        prof_name = announcement['author']['display_name']
                        prof_id = announcement['author'].get('id', 0)

                        # Check if this professor is already in our list
                        prof_exists = False
                        for prof in professors:
                            if prof['name'] == prof_name:
                                prof_exists = True
                                break

                        if not prof_exists:
                            professors.append({
                                'id': prof_id,
                                'name': prof_name,
                                'role': 'Teacher',
                                'email': None,
                                'avatar_url': announcement['author'].get('avatar_image_url')
                            })

                if professors:
                    course_data['professors'] = professors

        # Remove data that wasn't requested to reduce payload size
        if not load_modules and 'modules' in course_data:
            del course_data['modules']

        if not load_files and 'files' in course_data:
            del course_data['files']

        if not load_discussions and 'discussions' in course_data:
            del course_data['discussions']

        if not load_groups and 'groups' in course_data:
            del course_data['groups']

        if not load_analytics and 'analytics' in course_data:
            del course_data['analytics']

        return jsonify({
            "status": "success",
            "course_data": course_data
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/canvas/all-classes', methods=['GET'])
def get_all_classes():
    """Get classes for a user (current semester by default)"""
    user_id = request.args.get('user_id')
    load_all = request.args.get('load_all', 'false').lower() == 'true'

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    try:
        # Initialize Canvas manager with user credentials from Firebase
        canvas_manager = CanvasManager(user_id=user_id)

        # Get classes (current semester by default, or all if specified)
        classes = canvas_manager.get_all_classes() if load_all else canvas_manager.get_current_classes()

        if not classes:
            return jsonify({"error": "No classes found"}), 404

        return jsonify({
            "data": classes,
            "error": None
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/canvas/class-assignments/<course_id>', methods=['GET'])
def get_class_assignments(course_id):
    """Get assignments for a specific class"""
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    try:
        # Initialize Canvas manager with user credentials from Firebase
        canvas_manager = CanvasManager(user_id=user_id)

        # Get class assignments
        assignments = canvas_manager.get_class_assignments(course_id)

        if not assignments:
            return jsonify({"error": f"No assignments found for course {course_id}"}), 404

        return jsonify({
            "data": assignments,
            "error": None
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/canvas/user-profile', methods=['GET'])
def get_user_profile():
    """Get user profile information"""
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    try:
        # Initialize Canvas manager with user credentials from Firebase
        canvas_manager = CanvasManager(user_id=user_id)

        # Get user info
        user = canvas_manager.user

        profile = {
            "id": user.id,
            "name": user.name,
            "email": getattr(user, 'email', None),
            "bio": getattr(user, 'bio', None),
            "avatar_url": getattr(user, 'avatar_url', None)
        }

        return jsonify({
            "data": profile,
            "error": None
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/canvas/announcements', methods=['GET'])
def get_announcements():
    """Get announcements from courses (current semester by default)"""
    user_id = request.args.get('user_id')
    load_all = request.args.get('load_all', 'false').lower() == 'true'

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    try:
        # Initialize Canvas manager with user credentials from Firebase
        canvas_manager = CanvasManager(user_id=user_id)

        # Get courses (current semester by default, or all if specified)
        courses = canvas_manager.get_all_classes() if load_all else canvas_manager.get_current_classes()

        if not courses:
            return jsonify({"error": "No courses found"}), 404

        # Get announcements for each course
        all_announcements = []
        for course in courses:
            course_id = course['course_id']
            course_name = course['course_name']

            try:
                announcements = canvas_manager.get_course_announcements(course_id)
                if announcements:
                    for announcement in announcements:
                        announcement['course_name'] = course_name
                        announcement['course_id'] = course_id
                        all_announcements.append(announcement)
            except Exception as e:
                print(f"Error getting announcements for course {course_id}: {str(e)}")

        return jsonify({
            "data": all_announcements,
            "error": None
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/canvas/all-data', methods=['GET'])
def get_all_data():
    """Get Canvas data for a user (current semester by default)"""
    user_id = request.args.get('user_id')
    load_all = request.args.get('load_all', 'false').lower() == 'true'

    # Get optional parameters for selective loading
    load_announcements = request.args.get('load_announcements', 'true').lower() == 'true'
    load_professors = request.args.get('load_professors', 'true').lower() == 'true'

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    try:
        # Initialize Canvas manager with user credentials from Firebase
        canvas_manager = CanvasManager(user_id=user_id)

        # Get courses (current semester by default, or all if specified)
        courses = canvas_manager.get_all_classes() if load_all else canvas_manager.get_current_classes()

        if not courses:
            return jsonify({"error": "No courses found"}), 404

        # Prepare response data with basic information
        response_data = {
            "all_classes": {
                "data": courses,
                "error": None
            },
            "user_profile": {
                "data": {
                    "id": canvas_manager.user.id,
                    "name": canvas_manager.user.name,
                    "email": getattr(canvas_manager.user, 'email', None),
                    "avatar_url": getattr(canvas_manager.user, 'avatar_url', None)
                },
                "error": None
            }
        }

        # Thread-local storage for canvas_manager instances
        thread_local = threading.local()

        def get_canvas_manager():
            """Get or create a thread-local canvas_manager instance"""
            if not hasattr(thread_local, 'canvas_manager'):
                thread_local.canvas_manager = CanvasManager(user_id=user_id)
            return thread_local.canvas_manager

        # Function to process a single course
        def process_course(course):
            course_id = course['course_id']
            course_name = course['course_name']
            result = {}
            professor_info = []
            announcements = []

            cm = get_canvas_manager()

            # Get announcements if requested
            if load_announcements:
                try:
                    course_announcements = cm.get_course_announcements(course_id)
                    if course_announcements:
                        for announcement in course_announcements:
                            announcement['course_name'] = course_name
                            announcement['course_id'] = course_id
                            announcements.append(announcement)

                            # Extract professor info from announcements if available
                            if 'author' in announcement and announcement['author'] and 'display_name' in announcement['author']:
                                prof_name = announcement['author']['display_name']
                                prof_id = announcement['author'].get('id', 0)

                                # Check if this professor is already in our list
                                prof_exists = False
                                for prof in professor_info:
                                    if prof['name'] == prof_name:
                                        prof_exists = True
                                        break

                                if not prof_exists:
                                    professor_info.append({
                                        'id': prof_id,
                                        'name': prof_name,
                                        'role': 'Teacher',
                                        'email': None,
                                        'avatar_url': announcement['author'].get('avatar_image_url')
                                    })
                except Exception as e:
                    print(f"Error getting announcements for course {course_id}: {str(e)}")

            # Get professors if requested
            if load_professors:
                try:
                    professors = cm.get_class_professors(course_id)
                    if professors and professors[0]['name'] != 'Course Instructor':
                        # Add professors data to result
                        result[f"class_professors_{course_id}"] = {
                            "data": professors,
                            "error": None
                        }
                    elif professor_info:
                        # Use professor info extracted from announcements
                        result[f"class_professors_{course_id}"] = {
                            "data": professor_info,
                            "error": None
                        }
                    else:
                        # Add placeholder professor data
                        result[f"class_professors_{course_id}"] = {
                            "data": [{
                                "id": 0,
                                "name": "Course Instructor",
                                "role": "Teacher",
                                "email": None
                            }],
                            "error": None
                        }
                except Exception as e:
                    print(f"Error getting professors for course {course_id}: {str(e)}")
                    if professor_info:
                        result[f"class_professors_{course_id}"] = {
                            "data": professor_info,
                            "error": None
                        }
                    else:
                        # Add placeholder professor data
                        result[f"class_professors_{course_id}"] = {
                            "data": [{
                                "id": 0,
                                "name": "Course Instructor",
                                "role": "Teacher",
                                "email": None
                            }],
                            "error": None
                        }

            return {
                "result": result,
                "announcements": announcements
            }

        # Process courses in parallel
        all_announcements = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(10, len(courses))) as executor:
            future_to_course = {executor.submit(process_course, course): course for course in courses}

            for future in concurrent.futures.as_completed(future_to_course):
                try:
                    data = future.result()
                    # Merge results into response_data
                    response_data.update(data["result"])
                    all_announcements.extend(data["announcements"])
                except Exception as e:
                    print(f"Error processing course: {str(e)}")

        if load_announcements:
            response_data["announcements"] = {
                "data": all_announcements,
                "error": None
            }

        return jsonify(response_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/canvas/course-professors/<course_id>', methods=['GET'])
def get_course_professors(course_id):
    """Get professor information for a specific course"""
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    try:
        # Initialize Canvas manager with user credentials from Firebase
        canvas_manager = CanvasManager(user_id=user_id)

        # First try to get professors using the standard method
        professors = canvas_manager.get_class_professors(course_id)

        # If we got placeholder data, try to extract from announcements
        if not professors or (len(professors) == 1 and professors[0]['name'] == 'Course Instructor'):
            try:
                # Get announcements for this course
                announcements = canvas_manager.get_course_announcements(course_id)

                if announcements:
                    extracted_professors = []
                    for announcement in announcements:
                        if 'author' in announcement and announcement['author'] and 'display_name' in announcement['author']:
                            prof_name = announcement['author']['display_name']
                            prof_id = announcement['author'].get('id', 0)

                            # Check if this professor is already in our list
                            prof_exists = False
                            for prof in extracted_professors:
                                if prof['name'] == prof_name:
                                    prof_exists = True
                                    break

                            if not prof_exists:
                                extracted_professors.append({
                                    'id': prof_id,
                                    'name': prof_name,
                                    'role': 'Teacher',
                                    'email': None,
                                    'avatar_url': announcement['author'].get('avatar_image_url')
                                })

                    if extracted_professors:
                        professors = extracted_professors
            except Exception as e:
                print(f"Error extracting professors from announcements: {str(e)}")

        return jsonify({
            "status": "success",
            "data": professors,
            "error": None
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/canvas/load-more-courses', methods=['GET'])
def load_more_courses():
    """Load more courses (additional semesters) for a user"""
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    try:
        # Initialize Canvas manager with user credentials from Firebase
        canvas_manager = CanvasManager(user_id=user_id)

        # Get all courses
        all_courses = canvas_manager.get_all_classes()

        # Get current semester courses
        current_courses = canvas_manager.get_current_classes()

        if not all_courses:
            return jsonify({"error": "No courses found"}), 404

        # Filter out current semester courses to get additional courses
        current_course_ids = [course['course_id'] for course in current_courses]
        additional_courses = [course for course in all_courses if course['course_id'] not in current_course_ids]

        return jsonify({
            "status": "success",
            "data": additional_courses,
            "error": None
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
