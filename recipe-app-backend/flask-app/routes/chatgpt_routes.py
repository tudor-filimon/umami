from flask import Blueprint
from controllers.chatgpt_controller import ChatGPTController

chatgpt_bp = Blueprint('chatgpt_routes', __name__)
chatgpt_controller = ChatGPTController()

@chatgpt_bp.route('/api/chatgpt/get-recipes', methods=['POST'])
def get_recipes():
    # Your logic to interact with ChatGPT API and return recipes
    return chatgpt_controller.get_recipes()

def setChatgptRoutes(app):
    app.register_blueprint(chatgpt_bp)