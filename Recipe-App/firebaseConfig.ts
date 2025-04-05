import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";



// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDYH87VOm_OWU7Q-6I-bKqDoOaruvPcMfY",
    authDomain: "recipie-generator-777ae.firebaseapp.com",
    projectId: "recipie-generator-777ae",
    storageBucket: "recipie-generator-777ae.firebasestorage.app",
    messagingSenderId: "386878585396",
    appId: "1:386878585396:web:8b32b2fbfeab5f87d4e861",
    measurementId: "G-HWBVQJBF3K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Firestore and get a reference to the service
const firestore = getFirestore(app);

// Initialize Firebase Storage and get a reference to the service
const storage = getStorage(app);

const database = getDatabase(app);  // realtime database lmao


export { auth, firestore, storage, database };