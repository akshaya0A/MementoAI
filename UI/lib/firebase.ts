// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBx46NoqvyMlLkbSgfo5HexPUXeVZ0_twk",
  authDomain: "mementoai.firebaseapp.com",
  projectId: "mementoai",
  storageBucket: "mementoai.firebasestorage.app",
  messagingSenderId: "528890859039",
  appId: "1:528890859039:web:6cbad7e537b0bf547d0f2a",
  measurementId: "G-Q7V4JFB9Q4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics (only for web)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}
export { analytics };

export default app;
