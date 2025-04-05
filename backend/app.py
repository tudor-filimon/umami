import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from routes.vision_routes import setVisionRoutes
from routes.chatgpt_routes import setChatgptRoutes  # Import the function
from routes.recipe_routes import setRecipeRoutes
from routes.video_room_routes import setVideoRoomRoutes

from routes.image_routes import setImageGenRoutes

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Register blueprints
setRecipeRoutes(app)
setVisionRoutes(app)
setChatgptRoutes(app)  # Use the function
setVideoRoomRoutes(app)
setImageGenRoutes(app)

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5001)  