from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS

# Initialize Firebase Admin SDK
cred = credentials.Certificate("./backend/supaTopSecret.json")
firebase_admin.initialize_app(cred)

# Initialize Firestore client
db = firestore.client()
recipes_collection = db.collection("recipes")

# Endpoint to create a new recipe
@app.route('/api/recipes', methods=['POST'])
def add_recipe():
    try:
        data = request.json
        if not data or 'title' not in data or 'user_id' not in data:
            return jsonify({"error": "Invalid recipe data. 'title' and 'user_id' are required."}), 400
        
        recipe = {
            "title": data['title'],
            "ingredients": data.get('ingredients', []),
            "instructions": data.get('instructions', ''),
            "user_id": data['user_id']
        }
        # Add recipe to Firestore
        recipe_ref = recipes_collection.add(recipe)
        recipe_id = recipe_ref[1].id
        recipe['id'] = recipe_id
        return jsonify({"message": "Recipe added successfully", "recipe": recipe}), 201
    
    except Exception as e:
        return jsonify({"error": f"Failed to add recipe: {str(e)}"}), 500

# Endpoint to get all recipes
@app.route('/api/recipes/user/<user_id>', methods=['GET'])
def get_user_recipes(user_id):
    try:
        recipes_ref = recipes_collection.where('user_id', '==', user_id).stream()
        recipes = []
        for doc in recipes_ref:
            recipe = doc.to_dict()
            recipe['id'] = doc.id
            recipes.append(recipe)
        return jsonify({"success": True, "recipes": recipes}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4000, debug=True)
