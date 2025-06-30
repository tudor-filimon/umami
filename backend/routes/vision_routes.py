from flask import Blueprint, request, jsonify
from routes.VisionController import VisionController

# Initialize Flask Blueprint for Google Vision API routes
vision_routes = Blueprint('vision_routes', __name__)

# Initialize Vision Controller for image analysis
vision_controller = VisionController()

@vision_routes.route('/api/vision/analyze-image', methods=['POST'])
def analyze_image():
    """
    Analyze uploaded images to identify food ingredients using Google Vision API.
    
    This is a standalone endpoint for direct image analysis without recipe generation.
    Useful for testing ingredient detection or building custom workflows.
    
    Expected:
        - POST request with image file in 'file' field
        
    Returns:
        JSON response with list of detected ingredients or error message
    """
    # Validate that an image file was uploaded
    if 'file' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
        
    # Extract uploaded image file
    image_file = request.files['file']
    
    # Use Google Vision API to identify ingredients in the image
    ingredients = vision_controller.analyze_image(image_file)
    
    # Return detected ingredients as JSON array
    return jsonify({'ingredients': ingredients}), 200

def setVisionRoutes(app):
    """
    Register Google Vision API routes with the Flask application.
    
    Args:
        app: Flask application instance
    """
    app.register_blueprint(vision_routes)