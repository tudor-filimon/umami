import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("./app/services/recipie-generator-777ae-firebase-adminsdk-860xs-b6c1cf70a7.json")

firebase_admin.initialize_app(cred)

class FirebaseService:
    def __init__(self, service_account_path: str):
        # Initialize Firebase app if not already initialized
        if not firebase_admin._apps:
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred)
        self.db = firestore.client()

    def get_db(self):
        """Return the Firestore client instance."""
        return self.db

