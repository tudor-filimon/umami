import requests
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

# Define the URL of the Flask app's endpoint for Vision API
vision_url = 'http://127.0.0.1:5000/api/vision/analyze-image'

# Define the URL of the Flask app's endpoint for ChatGPT API
chatgpt_url = 'http://127.0.0.1:5000/api/chatgpt/get-recipes'

# Path to the image file
image_path = os.path.join(os.path.dirname(__file__), 'fridgepic.png')

# Check if the image file exists
if not os.path.exists(image_path):
    logging.error(f"Image file not found: {image_path}")
else:
    # Send a POST request to the Vision API endpoint with the image file
    with open(image_path, 'rb') as image_file:
        vision_response = requests.post(vision_url, files={'file': image_file})

    # Check if the Vision API request was successful
    if vision_response.status_code == 200:
        ingredients = vision_response.json().get('ingredients')
        logging.info(f"Ingredients detected: {ingredients}")

        # Send a POST request to the ChatGPT API endpoint with the ingredients
        chatgpt_response = requests.post(chatgpt_url, json={'ingredients': ingredients})

        # Check if the ChatGPT API request was successful
        if chatgpt_response.status_code == 200:
            recipes = chatgpt_response.json()
            logging.info("\nGenerated Recipes:")
            for recipe in recipes:
                logging.info(recipe)
        else:
            logging.error(f"ChatGPT API request failed with status code {chatgpt_response.status_code}")
            logging.error(chatgpt_response.text)
    else:
        logging.error(f"Vision API request failed with status code {vision_response.status_code}")
        logging.error(vision_response.text)