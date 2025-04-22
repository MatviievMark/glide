import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Flag to track if Firebase is initialized
firebase_initialized = False

# Initialize Firebase Admin
def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    global firebase_initialized

    if firebase_admin._apps:
        # Firebase already initialized
        firebase_initialized = True
        return True

    # Check if service account key is provided as a path or directly as JSON
    service_account_key_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY_PATH')
    service_account_key_json = os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY')

    if not service_account_key_path and not service_account_key_json:
        print("Warning: Firebase service account key not provided. Using fallback credentials.")
        return False

    try:
        if service_account_key_path:
            # Initialize with service account key file
            cred = credentials.Certificate(service_account_key_path)
        elif service_account_key_json:
            # Initialize with service account key JSON
            try:
                service_account_info = json.loads(service_account_key_json)
                cred = credentials.Certificate(service_account_info)
            except json.JSONDecodeError:
                print("Error: Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON format")
                return False

        # Initialize the app
        firebase_admin.initialize_app(cred)
        firebase_initialized = True
        print("Firebase Admin SDK initialized successfully")
        return True
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        return False

def get_user_canvas_credentials(user_id):
    """Get Canvas API credentials for a user from Firestore"""
    # Check if Firebase is initialized
    if not firebase_initialized:
        success = initialize_firebase()
        if not success:
            return None, None, "Firebase initialization failed"

    try:
        # Get Firestore client
        db = firestore.client()

        # Get user document
        user_doc = db.collection('users').document(user_id).get()

        if not user_doc.exists:
            return None, None, "User not found"

        # Get Canvas credentials
        user_data = user_doc.to_dict()
        canvas_url = user_data.get('canvasUrl')
        canvas_api_key = user_data.get('canvasApiKey')

        if not canvas_url or not canvas_api_key:
            return None, None, "Canvas credentials not found for user"

        return canvas_url, canvas_api_key, None
    except Exception as e:
        print(f"Error getting Canvas credentials: {e}")
        # Try to use fallback credentials from environment variables
        canvas_url = os.getenv('CANVAS_URL')
        canvas_api_key = os.getenv('CANVAS_API_KEY')

        if canvas_url and canvas_api_key:
            print("Using fallback Canvas credentials from environment variables")
            return canvas_url, canvas_api_key, None
        else:
            return None, None, f"Error: {str(e)} and no fallback credentials available"
