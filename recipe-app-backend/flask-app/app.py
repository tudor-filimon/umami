import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from routes.vision_routes import setVisionRoutes
from routes.chatgpt_routes import setChatgptRoutes  # Import the function

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize routes
setVisionRoutes(app)
setChatgptRoutes(app)  # Use the function

@app.route('/')
def index():
    return "Welcome to the Recipe App!"

if __name__ == '__main__':
    app.run(debug=True)