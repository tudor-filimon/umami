# filepflaath: recipe-app-backend/test_upload.py
import requests  # Import the requests library

# Define the URL of the Flask app's endpoint
url = 'http://127.0.0.1:5000/api/vision/analyze-image'

# Open the image file in binary mode
files = {'file': open('fridgepic.png', 'rb')}

# Send a POST request to the Flask app's endpoint with the image file
response = requests.post(url, files=files)

# Print the JSON response from the Flask app
print(response.text)