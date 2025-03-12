import requests

# Define the URL of the Flask app's endpoint
url = 'http://127.0.0.1:5000/api/chatgpt/get-recipes'

# Define the payload with a list of ingredients
payload = {
    'ingredients': ['tomato', 'cheese', 'basil']
}

# Send a POST request to the Flask app's endpoint with the payload
response = requests.post(url, json=payload)

# Print the JSON response from the Flask app
print(response.text)

