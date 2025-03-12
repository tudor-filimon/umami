import os
import openai
from flask import request, jsonify
from dotenv import load_dotenv
from controllers.vision_controller import VisionController

load_dotenv()

class ChatGPTController:
    def __init__(self):
        self.vision_controller = VisionController()

    def get_recipes(self):
        try:
            # Check if ingredients are provided directly in the request body
            ingredients = request.json.get('ingredients')
            if not ingredients:
                # Assuming the image file is sent in the request
                image_file = request.files.get('file')
                if not image_file:
                    return jsonify({"error": "No file or ingredients provided"}), 400

                # Analyze the image to get ingredients
                ingredients = self.vision_controller.analyze_image(image_file)
                if not ingredients:
                    return jsonify({"error": "No ingredients found"}), 400

            # Get the ChatGPT API key from environment variables
            api_key = os.getenv('CHATGPT_API_KEY')
            if not api_key:
                return jsonify({"error": "ChatGPT API key not found"}), 500

            # Set the OpenAI API key
            openai.api_key = api_key

            # Create the prompt for ChatGPT
            prompt = f'Generate 3 recipes using the following ingredients: {", ".join(ingredients)}. For each recipe, provide the name of the dish and quick steps to make it.'

            # Call the OpenAI API to generate recipes
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                stop=None
            )
            recipes = response.choices[0].message['content'].strip().split('\n\n')
            return jsonify(recipes)
        except Exception as e:
            return jsonify({"error": str(e)}), 500