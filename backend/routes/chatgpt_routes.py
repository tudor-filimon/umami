import os
import openai
import requests
import io
from PIL import Image
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv
from routes.VisionController import VisionController

# Load environment variables from .env file
load_dotenv()

# Configure OpenAI API with key from environment variables
openai.api_key = os.getenv("CHATGPT_API_KEY")

# Initialize Flask Blueprint for ChatGPT-related routes
chatgpt_bp = Blueprint('chatgpt_routes', __name__)

# Initialize Google Vision API controller for ingredient detection
vision_controller = VisionController()

def compress_image(image_file, quality=80, max_size=(800, 800)):
    """
    Compress uploaded images to optimize processing and reduce API costs.
    
    Reduces image file size while maintaining quality suitable for ingredient detection.
    This helps with Google Vision API processing speed and reduces bandwidth usage.
    
    Args:
        image_file: Uploaded image file object
        quality (int): JPEG compression quality (1-100, default 80)
        max_size (tuple): Maximum dimensions (width, height) for resizing
        
    Returns:
        BytesIOWithFilename: Compressed image data with filename attribute
    """
    img = Image.open(image_file)
    
    # Resize if the image is too large
    if img.width > max_size[0] or img.height > max_size[1]:
        img.thumbnail(max_size, Image.LANCZOS)
    
    # Save compressed image to BytesIO
    output = io.BytesIO()
    
    # Determine format based on original image
    format = img.format if img.format else 'JPEG'
    
    # Convert RGBA to RGB for JPEG format
    if format == 'JPEG' and img.mode == 'RGBA':
        img = img.convert('RGB')
        
    # Save with compression
    img.save(output, format=format, quality=quality, optimize=True)
    output.seek(0)
    
    # Create a class that wraps BytesIO with a filename attribute
    class BytesIOWithFilename(io.BytesIO):
        def __init__(self, *args, **kwargs):
            self.filename = kwargs.pop('filename', 'image.jpg')
            super().__init__(*args, **kwargs)
    
    # Copy the data into a new BytesIO with filename
    result = BytesIOWithFilename(filename=getattr(image_file, 'filename', 'image.jpg'))
    result.write(output.getvalue())
    result.seek(0)
    
    return result

@chatgpt_bp.route('/api/chatgpt/get-recipes', methods=['POST'])
def get_recipes():
    """
    Main endpoint for AI-powered recipe generation from uploaded images.
    
    This endpoint combines Google Vision API for ingredient detection with OpenAI's 
    ChatGPT for recipe generation. Users upload a photo of their fridge/ingredients,
    and receive 3 meal-appropriate recipe suggestions.
    
    Expected:
        - POST request with image file in 'image' field
        - Optional 'Meal-Type' header (breakfast/lunch/dinner, defaults to breakfast)
        
    Returns:
        JSON response with 3 generated recipes or error message
    """
    try:
        # Validate that an image file was uploaded
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided"}), 400
            
        image_file = request.files['image']
        
        # Compress the image to optimize processing speed and reduce API costs
        compressed_image = compress_image(image_file)
        
        # Use Google Vision API to identify ingredients in the uploaded image
        ingredients = vision_controller.analyze_image(compressed_image)
        if not ingredients:
            return jsonify({"error": "No ingredients found in image"}), 400

        # Extract meal type from request headers for context-appropriate recipes
        meal_type = request.headers.get('Meal-Type', 'breakfast')
        print(f"Received meal type from headers: {meal_type}")  # Debug logging

        # Create detailed prompt for ChatGPT with specific formatting requirements
        # This ensures consistent JSON response format for frontend parsing
        prompt = f'''Generate 3 unique {meal_type} recipes using some or all of these ingredients: {", ".join(ingredients)}.
Each recipe should be appropriate for {meal_type}. Do NOT use the ingredients that are not fruits, vegetables, carbs, and dairy. Format your response as a JSON object with recipe1, recipe2, and recipe3 keys EXACTLY like this:
        {{
          "recipe1": {{
            "name": "Recipe Name",
            "ingredients": ["ingredient 1", "ingredient 2", ...],
            "steps": ["step 1", "step 2", ...]
          }},
          "recipe2": {{
            "name": "Recipe Name",
            "ingredients": ["ingredient 1", "ingredient 2", ...],
            "steps": ["step 1", "step 2", ...]
          }},
          "recipe3": {{
            "name": "Recipe Name",
            "ingredients": ["ingredient 1", "ingredient 2", ...],
            "steps": ["step 1", "step 2", ...]
          }}
        }}
        Do not include any explanation or additional text outside the JSON object.'''

        # Debug logging to track prompt generation
        print(f"Generated GPT Prompt for meal type '{meal_type}':\n{prompt}")

        # Send request to OpenAI ChatGPT API for recipe generation
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that provides recipe information in perfectly formatted JSON."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000  # Limit response length to control costs
        )
        
        # Extract the generated recipe content from OpenAI response
        content = response.choices[0].message['content'].strip()
        
        # Return raw JSON string for frontend parsing
        # Frontend will handle JSON parsing and recipe display
        return jsonify({"recipes": [content]})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
def setChatgptRoutes(app):
    """
    Register ChatGPT routes with the Flask application.
    
    Args:
        app: Flask application instance
    """
    app.register_blueprint(chatgpt_bp)