import os
import openai
import requests
import io
from PIL import Image
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv
from routes.VisionController import VisionController

load_dotenv()

openai.api_key = os.getenv("CHATGPT_API_KEY")
chatgpt_bp = Blueprint('chatgpt_routes', __name__)
vision_controller = VisionController()

def compress_image(image_file, quality=80, max_size=(800, 800)):
    """Compress the image to reduce size while maintaining reasonable quality"""
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
    try:
        # Check if the request contains files
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided"}), 400
            
        image_file = request.files['image']
        
        # Compress the image before processing
        compressed_image = compress_image(image_file)
        
        # Analyze the compressed image to get ingredients
        ingredients = vision_controller.analyze_image(compressed_image)
        if not ingredients:
            return jsonify({"error": "No ingredients found in image"}), 400

        # Create prompt with VERY explicit formatting instructions
        prompt = f'''Generate 3 recipes using some or all of these ingredients: {", ".join(ingredients)}.
        Do NOT use the ingredients that are not fruits, vegetables, carbs and dairy. Format your response as a JSON object with recipe1, recipe2, and recipe3 keys EXACTLY like this:
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
        
        # Call OpenAI API
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that provides recipe information in perfectly formatted JSON."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000
        )
        
        # Get the response content
        content = response.choices[0].message['content'].strip()
        
        # Return the raw string - our frontend will parse it
        return jsonify({"recipes": [content]})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def setChatgptRoutes(app):
    app.register_blueprint(chatgpt_bp)