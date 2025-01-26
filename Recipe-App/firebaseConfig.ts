import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";



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
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);