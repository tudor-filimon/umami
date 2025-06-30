# 🍳 Umami - AI-Powered Recipe Social Media App

Checkout Our Demo Day! https://www.canva.com/design/DAGjyjEuHpU/HMQiT6OSRYnecVMIeu7G0w/edit?utm_content=DAGjyjEuHpU&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton

Umami is a full-stack mobile application that combines AI-powered recipe generation with social media features. Users can photograph their available ingredients, generate personalized recipes using artificial intelligence, and share their culinary creations with a community of food enthusiasts.

## ✨ Key Features

### 🤖 AI Recipe Generation

- **Smart Ingredient Detection**: Upload photos of your fridge or ingredients using Google Cloud Vision API
- **Intelligent Recipe Creation**: Generate 3 meal-specific recipes using OpenAI's ChatGPT API
- **Meal Context Awareness**: Recipes adapt to breakfast, lunch, or dinner preferences

### 📱 Social Media Platform

- **Recipe Sharing**: Post and discover recipes from other users
- **Real-time Messaging**: Chat with fellow cooking enthusiasts
- **Video Calling**: Connect face-to-face using integrated Daily.co video rooms
- **User Profiles**: Customizable profiles with recipe collections

### 🎨 Visual Experience

- **Recipe Images**: Automatically fetch beautiful food photography from Unsplash
- **Intuitive UI**: Clean, modern interface built with React Native and NativeWind (check out the swiping feature in the demo day presentation!)
- **Cross-Platform**: Runs on iOS, Android, and web via Expo

## 🛠️ Technology Stack

### Frontend (React Native + Expo)

- **React Native 0.76.6** with Expo SDK 52
- **TypeScript** for type safety
- **NativeWind** (Tailwind CSS for React Native)
- **React Navigation** for screen routing
- **Firebase SDK** for authentication and real-time data

### Backend (Python Flask)

- **Flask 3.1.0** web framework
- **Google Cloud Vision API** for image analysis
- **OpenAI API** for recipe generation
- **Firebase Admin SDK** for server-side operations
- **Daily.co API** for video calling

### Database & Services

- **Firebase Firestore** for recipe and user data
- **Firebase Authentication** for secure user management
- **Firebase Storage** for image uploads
- **Unsplash API** for recipe photography

## Challenges Encountered

- **Image Compression**: with generation times over 3 minutes long, we realized our images were being processed at to high of a quality
  - To solve this, we added an intermediary processing stage to compress the image, speeding up the process exponentially
- **LLM Inaccuracy**: with creative recipes of plastic salad and laptop toast, our OpenAI responses were highly inconsistent for our goals.
  - To solve this, we refined our prompt by providing more specific instructions, examples, and iterative refinement

## 🚀 Getting Started

### Prerequisites

- Node.js and npm
- Python 3.8+
- Expo CLI (`npm install -g @expo/cli`)
- Firebase project
- Google Cloud Platform account
- OpenAI API key
- Unsplash API key
- Daily.co account

### Backend Setup

1. **Navigate to the backend directory:**

   ```bash
   cd backend
   ```

2. **Install Python dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your API keys:

   ```env
   CHATGPT_API_KEY=your_openai_api_key_here
   UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
   DAILY_CO_KEY=your_daily_co_api_key_here
   FIREBASE_SERVICE_ACCOUNT_PATH=path/to/firebase-service-account.json
   GOOGLE_APPLICATION_CREDENTIALS=path/to/google-cloud-service-account.json
   ```

4. **Set up Google Cloud credentials:**

   - Create a service account in Google Cloud Console
   - Download the JSON key file
   - Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable

5. **Configure Firebase:**

   - Create a Firebase project
   - Enable Firestore, Authentication, and Storage
   - Download the service account key
   - Set the `FIREBASE_SERVICE_ACCOUNT_PATH` environment variable

6. **Run the backend server:**

   ```bash
   python app.py
   ```

   The server will start on `http://localhost:5001`

### Frontend Setup

1. **Navigate to the React Native app directory:**

   ```bash
   cd Recipe-App
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**

   ```bash
   cp .env.example .env
   ```

   Add your Firebase configuration to `.env`:

   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   # ... other Firebase config values
   ```

4. **Start the Expo development server:**

   ```bash
   npm start
   ```

5. **Run on your preferred platform:**
   - iOS: `npm run ios`
   - Android: `npm run android`
   - Web: `npm run web`

## 📱 App Screens

- **Home**: Social feed showing recipes and posts from users
- **Generate**: Core AI feature - photograph ingredients and generate recipes
- **Post**: Create and share new content with the community
- **Profile**: User profile management and recipe collections
- **Messages**: Real-time chat with other users
- **Video Call**: Integrated video rooms for cooking sessions (in progress...)

## 🔧 API Endpoints

### Recipe Management

- `POST /api/recipes` - Add new recipe to database
- `GET /api/recipes/user/{user_id}` - Get user's recipes

### AI Recipe Generation

- `POST /api/chatgpt/get-recipes` - Generate recipes from image

### Image Processing

- `POST /api/vision/analyze-image` - Analyze image for ingredients
- `GET /api/image-gen?query={query}` - Get recipe images from Unsplash

### Video Calling

- `POST /api/video-room` - Create new video room
- `DELETE /api/video-room/{room_name}` - Delete video room

## 🔒 Security & Configuration

### Environment Variables

All sensitive credentials are managed through environment variables:

- API keys are never hardcoded
- Separate configuration for development and production
- Template files (`.env`) provided for easy setup

### Firebase Security

- Secure authentication with Firebase Auth
- Firestore security rules for data protection
- Storage rules for image uploads

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Contact

For questions, suggestions, or collaboration opportunities, please open an issue or reach out through the repository.

---

**Umami** - Where AI meets culinary creativity! 🍽️✨
