from google.cloud import vision
import logging
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class VisionController:
    """
    Google Cloud Vision API controller for analyzing food images and identifying ingredients.
    
    This class handles image processing using Google Cloud Vision API to detect objects
    and labels that can be identified as food ingredients for recipe generation.
    """
    
    def __init__(self):
        """
        Initialize the Vision API client.
        
        Note: Google Cloud Vision API credentials should be set via environment variables
        or service account key file. See Google Cloud documentation for setup instructions.
        """
        # Initialize Vision API client - credentials handled by Google Cloud SDK
        # Set GOOGLE_APPLICATION_CREDENTIALS environment variable to point to service account key
        self.client = vision.ImageAnnotatorClient()

    def allowed_file(self, filename):
        """
        Check if the uploaded file has an allowed image extension.
        
        Args:
            filename (str): Name of the uploaded file
            
        Returns:
            bool: True if file extension is allowed, False otherwise
        """
        ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

    def analyze_image(self, image_file):
        """
        Analyze an uploaded image to identify food ingredients using Google Cloud Vision API.
        
        This method performs both object localization and label detection to identify
        potential food items and ingredients that can be used for recipe generation.
        
        Args:
            image_file: Uploaded image file object with read() method and filename attribute
            
        Returns:
            list: List of identified ingredients/food items as strings
            
        Raises:
            Exception: Re-raises any Google Cloud Vision API errors after logging
        """
        try:
            # Validate file type and process image
            if image_file and self.allowed_file(image_file.filename):
                # Read image content for Vision API processing
                content = image_file.read()
                image = vision.Image(content=content)

                # Perform object localization to detect specific food objects
                object_response = self.client.object_localization(image=image)
                objects = object_response.localized_object_annotations

                # Perform label detection to identify general food categories and ingredients
                label_response = self.client.label_detection(image=image)
                labels = label_response.label_annotations

                # Extract and combine ingredients from both detection methods
                ingredients = self.get_ingredients(objects, labels)
                return ingredients
            return []
        except Exception as e:
            logging.error(f"Error analyzing image: {e}")
            raise

    def get_ingredients(self, objects, labels):
        """
        Extract ingredient names from Google Cloud Vision API detection results.
        
        Combines results from object localization and label detection to create
        a comprehensive list of potential ingredients. Uses confidence scoring
        to filter out low-confidence label detections.
        
        Args:
            objects: List of localized object annotations from Vision API
            labels: List of label annotations from Vision API
            
        Returns:
            list: Deduplicated list of ingredient names as strings
        """
        ingredients = set()

        # Add detected objects (usually more specific food items)
        for obj in objects:
            ingredients.add(obj.name)

        # Add high-confidence labels (broader food categories and ingredients)
        # Only include labels with confidence score > 0.1 to reduce noise
        for label in labels:
            if label.score > 0.1:
                ingredients.add(label.description)

        # Return as list, removing duplicates via set conversion
        return list(ingredients)