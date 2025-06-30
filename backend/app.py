import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from routes.vision_routes import setVisionRoutes
from routes.chatgpt_routes import setChatgptRoutes
from routes.recipe_routes import setRecipeRoutes
from routes.video_room_routes import setVideoRoomRoutes
from routes.image_routes import setImageGenRoutes

# Load environment variables from .env file
load_dotenv()

# Initialize Flask application
app = Flask(__name__)

# Enable Cross-Origin Resource Sharing for frontend communication
CORS(app)

# Register all API route blueprints
setRecipeRoutes(app)         # Recipe storage and retrieval endpoints
setVisionRoutes(app)         # Google Vision API for ingredient detection
setChatgptRoutes(app)        # OpenAI ChatGPT for recipe generation
setVideoRoomRoutes(app)      # Daily.co video room management
setImageGenRoutes(app)       # Unsplash image search for recipes

if __name__ == '__main__':
    # Run Flask development server
    # host="0.0.0.0" allows access from other devices on network
    # port=5001 to avoid conflicts with other services
    app.run(debug=True, host="0.0.0.0", port=5001)  