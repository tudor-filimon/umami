from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore

app = Flask(__name__)
CORS(app)  

cred = credentials.Certificate("./recipie-generator-777ae-firebase-adminsdk-860xs-b6c1cf70a7.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

@app.route('/api/recipes', methods=['POST'])
def save_recipe():
    try:
        data = request.json
        recipe = {
            "title": data['title'],
            "ingredients": data.get('ingredients', []),
            "instructions": data.get('instructions', ''),
            "user_id": data['user_id']
        }
        db.collection("recipes").add(recipe)
        return jsonify({"success": True, "message": "Recipe saved successfully"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/recipes/<user_id>', methods=['GET'])
def get_recipes(user_id):
    try:
        recipes = []
        recipes_ref = db.collection("recipes").where("user_id", "==", user_id).stream()
        for recipe_doc in recipes_ref:
            recipe_data = recipe_doc.to_dict()
            recipe_data['id'] = recipe_doc.id
            recipes.append(recipe_data)
        return jsonify({"success": True, "recipes": recipes}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4000, debug=True)
