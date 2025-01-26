from dotenv import load_dotenv
import os

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY') or 'your_default_secret_key'
    GOOGLE_VISION_API_KEY = os.getenv('GOOGLE_VISION_API_KEY')
    CHATGPT_API_KEY = os.getenv('CHATGPT_API_KEY')
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER') or 'uploads/'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # Limit upload size to 16 MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}