from flask import Flask, request, jsonify
from flask_cors import CORS
from canvas_manager import CanvasManager
import os
from dotenv import load_dotenv

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
    """Get all course IDs for a student"""
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    try:
        # Initialize Canvas manager with user credentials from Firebase
        canvas_manager = CanvasManager(user_id=user_id)

        # Get all courses
        courses = canvas_manager.get_all_classes()

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

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    try:
        # Initialize Canvas manager with user credentials from Firebase
        canvas_manager = CanvasManager(user_id=user_id)

        # Get complete class data
        course_data = canvas_manager.get_complete_class_data(course_id)

        if not course_data:
            return jsonify({"error": f"No data found for course {course_id}"}), 404

        return jsonify({
            "status": "success",
            "course_data": course_data
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/canvas/all-classes', methods=['GET'])
def get_all_classes():
    """Get all classes for a user"""
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    try:
        # Initialize Canvas manager with user credentials from Firebase
        canvas_manager = CanvasManager(user_id=user_id)

        # Get all classes
        classes = canvas_manager.get_all_classes()

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
    """Get announcements from all courses"""
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    try:
        # Initialize Canvas manager with user credentials from Firebase
        canvas_manager = CanvasManager(user_id=user_id)

        # Get all courses
        courses = canvas_manager.get_all_classes()

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
    """Get all Canvas data for a user"""
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    try:
        # Initialize Canvas manager with user credentials from Firebase
        canvas_manager = CanvasManager(user_id=user_id)

        # Get all courses
        courses = canvas_manager.get_all_classes()

        if not courses:
            return jsonify({"error": "No courses found"}), 404

        # Prepare response data
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

        # Get announcements for all courses
        all_announcements = []
        for course in courses:
            course_id = course['course_id']
            course_name = course['course_name']

            # Get announcements
            try:
                announcements = canvas_manager.get_course_announcements(course_id)
                if announcements:
                    for announcement in announcements:
                        announcement['course_name'] = course_name
                        announcement['course_id'] = course_id
                        all_announcements.append(announcement)
            except Exception as e:
                print(f"Error getting announcements for course {course_id}: {str(e)}")

            # Get professors for each course
            try:
                professors = canvas_manager.get_class_professors(course_id)
                if professors:
                    # Add professors data to response
                    response_data[f"class_professors_{course_id}"] = {
                        "data": professors,
                        "error": None
                    }
            except Exception as e:
                print(f"Error getting professors for course {course_id}: {str(e)}")
                # Add placeholder professor data
                response_data[f"class_professors_{course_id}"] = {
                    "data": [{
                        "id": 0,
                        "name": "Course Instructor",
                        "role": "Teacher",
                        "email": None
                    }],
                    "error": None
                }

        response_data["announcements"] = {
            "data": all_announcements,
            "error": None
        }

        return jsonify(response_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
