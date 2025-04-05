import os
from flask import Blueprint, request, jsonify
import requests

DAILY_API_KEY = os.getenv("DAILY_CO_KEY")
DAILY_API_URL = "https://api.daily.co/v1/rooms"

video_room_routes = Blueprint('video_room', __name__)


@video_room_routes.route('/api/video-room', methods=['POST'])
def create_room():
    headers = {
        "Authorization": f"Bearer {DAILY_API_KEY}",
        "Content-Type": "application/json"
    }

    body = {
        "properties": {
            "enable_chat": True,
            "exp": int(__import__('time').time()) + 3600  # expires in 1 hour
        }
    }

    response = requests.post(DAILY_API_URL, json=body, headers=headers)

    if response.status_code == 200:
        data = response.json()

        return jsonify(
            {
                "url": data["url"],
                "name": data["name"]
            }
        )
    else:
        return jsonify({"error": "Failed to create room"}), response.status_code


@video_room_routes.route('/api/video-room/<room_name>', methods=['DELETE'])
def delete_room(room_name):
    headers = {
        "Authorization": f"Bearer {DAILY_API_KEY}",
    }

    delete_url = f"{DAILY_API_URL}/{room_name}"

    response = requests.delete(delete_url, headers=headers)

    if response.status_code == 200:
        return jsonify({"message": f"Room '{room_name}' deleted successfully."})
    else:
        return jsonify({"error": f"Failed to delete room '{room_name}'."}), response.status_code


def setVideoRoomRoutes(app):
    app.register_blueprint(video_room_routes)
