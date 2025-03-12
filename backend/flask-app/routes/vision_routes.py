from flask import Blueprint, request, jsonify
from controllers.vision_controller import VisionController

vision_routes = Blueprint('vision_routes', __name__)
vision_controller = VisionController()

@vision_routes.route('/api/vision/analyze-image', methods=['POST'])
def analyze_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    image_file = request.files['file']
    ingredients = vision_controller.analyze_image(image_file)
    return jsonify({'ingredients': ingredients}), 200

def setVisionRoutes(app):
    app.register_blueprint(vision_routes)