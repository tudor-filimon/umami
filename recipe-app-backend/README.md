# Recipe Application

This project is a recipe application that allows users to upload pictures of their fridge, analyzes the food items using the Google Vision API, and generates three recipes using the ChatGPT API based on the identified ingredients.

## Project Structure

```
recipe-app-backend
├── flask-app
│   ├── app.py
│   ├── requirements.txt
│   ├── config.py
│   ├── controllers
│   │   └── vision_controller.py
│   ├── models
│   │   └── __init__.py
│   ├── routes
│   │   └── vision_routes.py
│   └── templates
│       └── index.html
├── express-app
│   ├── src
│   │   ├── app.js
│   │   ├── controllers
│   │   │   └── chatgptController.js
│   │   ├── routes
│   │   │   └── chatgptRoutes.js
│   │   └── types
│   │       └── index.d.ts
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## Setup Instructions

### Flask Application

1. Navigate to the `flask-app` directory.
2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Set up your configuration in `config.py` with the necessary API keys.
4. Run the Flask application:
   ```
   python app.py
   ```

### Express Application

1. Navigate to the `express-app` directory.
2. Install the required dependencies:
   ```
   npm install
   ```
3. Run the Express application:
   ```
   npm start
   ```

## Usage

1. Open the Flask application in your browser.
2. Upload a picture of your fridge.
3. The application will analyze the image and identify the food items.
4. The identified ingredients will be sent to the Express application, which will generate three recipes using the ChatGPT API.
5. View the generated recipes in the response.

## Contributing

Feel free to submit issues or pull requests to improve the application.