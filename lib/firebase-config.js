// Firebase configuration with environment variable validation
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

// Validate required environment variables
const requiredEnvVars = {
 apiKey: "AIzaSyDsuL41HFHeccIMnv4DWvgb9gfGmpWhRaI",
  authDomain: "civicsolution-ed9dc.firebaseapp.com",
  projectId: "civicsolution-ed9dc",
  storageBucket: "civicsolution-ed9dc.firebasestorage.app",
  messagingSenderId: "470206200519",
  appId: "1:470206200519:web:520c3ccf28941712485ce2",
  measurementId: "G-5Q2HPG4BR5"
}

// Check if all required variables are present
const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => `NEXT_PUBLIC_FIREBASE_${key.toUpperCase()}`)

if (missingVars.length > 0) {
  throw new Error(`Missing Firebase environment variables: ${missingVars.join(", ")}`)
}

const firebaseConfig = requiredEnvVars

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export default app
