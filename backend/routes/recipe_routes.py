from flask import Blueprint, request, jsonify
import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize Firebase Admin SDK if not already initialized
if not firebase_admin._apps:
    # Use service account credentials from environment variable or default credentials
    firebase_credentials_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
    
    if firebase_credentials_path and os.path.exists(firebase_credentials_path):
        # Use service account key file if path is provided and file exists
        cred = credentials.Certificate(firebase_credentials_path)
        firebase_admin.initialize_app(cred)
    else:
        # Use default credentials (works with Google Cloud SDK or service account environment)
        firebase_admin.initialize_app()

# Initialize Firestore client for recipe storage
db = firestore.client()
recipes_collection = db.collection("recipes")

recipe_routes = Blueprint('recipe_routes', __name__)

@recipe_routes.route('/api/recipes', methods=['POST'])
def add_recipe():
    """
    Add a new recipe to the Firestore database.
    
    Expected JSON payload:
    {
        "title": "Recipe Name",
        "ingredients": ["ingredient1", "ingredient2", ...],
        "instructions": "Step-by-step cooking instructions",
        "user_id": "firebase_user_id"
    }
    
    Returns:
        JSON response with success/error message and recipe data
    """
    try:
        # Parse and validate incoming recipe data
        data = request.json
        if not data or 'title' not in data or 'user_id' not in data:
            return jsonify({"error": "Invalid recipe data. 'title' and 'user_id' are required."}), 400
        
        # Structure recipe data for Firestore storage
        recipe = {
            "title": data['title'],
            "ingredients": data.get('ingredients', []),  # Default to empty list if not provided
            "instructions": data.get('instructions', ''),  # Default to empty string if not provided
            "user_id": data['user_id']
        }
        
        # Add recipe to Firestore and get the generated document ID
        recipe_ref = recipes_collection.add(recipe)
        recipe_id = recipe_ref[1].id  # get_document_reference returns (timestamp, doc_ref)
        
        # Include the generated ID in the response
        recipe['id'] = recipe_id
        return jsonify({"message": "Recipe added successfully", "recipe": recipe}), 201
    
    except Exception as e:
        return jsonify({"error": f"Failed to add recipe: {str(e)}"}), 500

@recipe_routes.route('/api/recipes/user/<user_id>', methods=['GET'])
def get_user_recipes(user_id):
    """
    Retrieve all recipes created by a specific user.
    
    Args:
        user_id (str): Firebase user ID to filter recipes by
        
    Returns:
        JSON response with list of user's recipes or error message
    """
    try:
        # Query Firestore for recipes belonging to the specified user
        recipes_ref = recipes_collection.where('user_id', '==', user_id).stream()
        recipes = []
        
        # Convert Firestore documents to dictionary format
        for doc in recipes_ref:
            recipe = doc.to_dict()
            recipe['id'] = doc.id  # Include document ID for frontend reference
            recipes.append(recipe)
            
        return jsonify({"success": True, "recipes": recipes}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

def setRecipeRoutes(app):
    """
    Register recipe routes with the Flask application.
    
    Args:
        app: Flask application instance
    """
    app.register_blueprint(recipe_routes)
    