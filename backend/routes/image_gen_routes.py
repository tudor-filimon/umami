import os
import random
import requests
from dotenv import load_dotenv
from flask import Blueprint, request, jsonify

# Load environment variables from .env file
load_dotenv()

# Unsplash API configuration for recipe image generation
UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")

# Initialize Flask Blueprint for image generation routes
image_gen_routes = Blueprint('image_gen_routes', __name__)

@image_gen_routes.route('/api/image-gen', methods=['GET'])
def image_gen():
    """
    Generate recipe images using Unsplash API based on search queries.
    
    This endpoint searches Unsplash for food/recipe images matching a query
    and returns a random high-quality image for recipe display purposes.
    
    Query Parameters:
        query (str): Search term for finding relevant food images
        
    Returns:
        JSON response with image URL and description, or error message
    """
    # Extract search query from request parameters
    query = request.args.get('query')
    if not query:
        return jsonify({"error": "Query parameter is required."}), 400

    try:
        # Search Unsplash for food/recipe images matching the query
        response = requests.get(
            "https://api.unsplash.com/search/photos",
            params={
                "query": query,                    # Search term (e.g., "pasta", "chicken")
                "per_page": 20,                   # Fetch 20 results for variety
                "orientation": "squarish"         # Square images work best for recipes
            },
            headers={
                "Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"
            }
        )

        # Validate Unsplash API response
        if response.status_code != 200:
            return jsonify({"error": "Failed to fetch from Unsplash."}), 500

        # Parse response and extract image results
        data = response.json()
        results = data.get("results", [])

        if not results:
            return jsonify({"error": "No images found."}), 404

        # Select a random image from results for variety
        random_image = random.choice(results)
        
        # Return image URL and description for frontend display
        return jsonify({
            "image_url": random_image["urls"]["regular"],        # High-quality image URL
            "alt_description": random_image.get("alt_description") # Image description for accessibility
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def setImageGenRoutes(app):
    """
    Register image generation routes with the Flask application.
    
    Args:
        app: Flask application instance
    """
    app.register_blueprint(image_gen_routes)