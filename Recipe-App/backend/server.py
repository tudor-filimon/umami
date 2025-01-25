from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import os
import signal

app = Flask(__name__)
CORS(app)

recipes = []

@app.route('/recipes', methods=['GET'])
def get_recipes():
    return jsonify(recipes), 200

@app.route('/recipes', methods=['POST'])
def add_recipe():
    try:
        recipe = request.json
        if not recipe or 'name' not in recipe:
            return jsonify({"error": "Invalid recipe data"}), 400
        
        recipes.append(recipe)
        return jsonify({"message": "Recipe added successfully", "recipe": recipe}), 201
    
    except Exception as e:
        return jsonify({"error": f"Failed to add recipe: {str(e)}"}), 500

@app.route('/recipes/<int:index>', methods=['DELETE'])
def delete_recipe(index):
    try:
        if 0 <= index < len(recipes):
            deleted_recipe = recipes.pop(index)
            return jsonify({"message": "Recipe deleted successfully", "recipe": deleted_recipe}), 200
        return jsonify({"error": "Recipe not found"}), 404
    
    except Exception as e:
        return jsonify({"error": f"Failed to delete recipe: {str(e)}"}), 500

@app.route('/recipes/<int:index>', methods=['PUT'])
def update_recipe(index):
    try:
        if 0 <= index < len(recipes):
            recipe = request.json
            if not recipe or 'name' not in recipe:
                return jsonify({"error": "Invalid recipe data"}), 400
            
            recipes[index] = recipe
            return jsonify({"message": "Recipe updated successfully", "recipe": recipe}), 200
        return jsonify({"error": "Recipe not found"}), 404
    
    except Exception as e:
        return jsonify({"error": f"Failed to update recipe: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)