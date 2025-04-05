import os
import random
import requests
from dotenv import load_dotenv
from flask import Blueprint, request, jsonify


load_dotenv()  # Load environment variables from .env

UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")

image_gen_routes = Blueprint('image_gen_routes', __name__)

@image_gen_routes.route('/api/image-gen', methods=['GET'])
def image_gen():
    query = request.args.get('query')
    if not query:
        return jsonify({"error": "Query parameter is required."}), 400

    try:
        response = requests.get(
            "https://api.unsplash.com/search/photos",
            params={
                "query": query,
                "per_page": 20,
                "orientation": "squarish"
            },
            headers={
                "Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"
            }
        )

        if response.status_code != 200:
            return jsonify({"error": "Failed to fetch from Unsplash."}), 500

        data = response.json()
        results = data.get("results", [])

        if not results:
            return jsonify({"error": "No images found."}), 404

        random_image = random.choice(results)
        return jsonify({
            "image_url": random_image["urls"]["regular"],
            "alt_description": random_image.get("alt_description")
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def setImageGenRoutes(app):
    app.register_blueprint(image_gen_routes)
