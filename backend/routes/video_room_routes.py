import os
from flask import Blueprint, request, jsonify
import requests

# Daily.co API configuration for video room management
DAILY_API_KEY = os.getenv("DAILY_CO_KEY")
DAILY_API_URL = "https://api.daily.co/v1/rooms"

# Initialize Flask Blueprint for video room routes
video_room_routes = Blueprint('video_room', __name__)


@video_room_routes.route('/api/video-room', methods=['POST'])
def create_room():
    """
    Create a new Daily.co video room for real-time communication.
    
    This endpoint creates temporary video rooms that users can join for
    video calls related to recipe sharing and cooking discussions.
    
    Returns:
        JSON response with room URL and name, or error message
    """
    # Set up authentication headers for Daily.co API
    headers = {
        "Authorization": f"Bearer {DAILY_API_KEY}",
        "Content-Type": "application/json"
    }

    # Configure room properties with chat enabled and 1-hour expiration
    body = {
        "properties": {
            "enable_chat": True,  # Allow text chat within video rooms
            "exp": int(__import__('time').time()) + 3600  # Auto-expire after 1 hour
        }
    }

    # Send room creation request to Daily.co API
    response = requests.post(DAILY_API_URL, json=body, headers=headers)

    if response.status_code == 200:
        data = response.json()

        # Return room details for frontend to initiate video call
        return jsonify(
            {
                "url": data["url"],    # Direct URL for joining the room
                "name": data["name"]   # Room identifier for management
            }
        )
    else:
        return jsonify({"error": "Failed to create room"}), response.status_code


@video_room_routes.route('/api/video-room/<room_name>', methods=['DELETE'])
def delete_room(room_name):
    """
    Delete a Daily.co video room when it's no longer needed.
    
    This helps clean up resources and manage room lifecycle.
    Rooms also auto-expire after 1 hour for automatic cleanup.
    
    Args:
        room_name (str): Name/ID of the room to delete
        
    Returns:
        JSON response with success/error message
    """
    # Set up authentication for room deletion
    headers = {
        "Authorization": f"Bearer {DAILY_API_KEY}",
    }

    # Construct API endpoint URL for specific room deletion
    delete_url = f"{DAILY_API_URL}/{room_name}"

    # Send deletion request to Daily.co API
    response = requests.delete(delete_url, headers=headers)

    if response.status_code == 200:
        return jsonify({"message": f"Room '{room_name}' deleted successfully."})
    else:
        return jsonify({"error": f"Failed to delete room '{room_name}'."}), response.status_code


def setVideoRoomRoutes(app):
    """
    Register video room routes with the Flask application.
    
    Args:
        app: Flask application instance
    """
    app.register_blueprint(video_room_routes)
