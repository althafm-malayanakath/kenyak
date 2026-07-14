import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Paste your Firebase Web App configuration object here from the Firebase console:
const firebaseConfig = {
  apiKey: "AIzaSyArZa_6szYJ8B53ZRtZlegvMmWEEsUo9D4",
  authDomain: "kenyak.firebaseapp.com",
  projectId: "kenyak",
  storageBucket: "kenyak.firebasestorage.app",
  messagingSenderId: "1053148453135",
  appId: "1:1053148453135:web:2abe3db663d5779a70c67a",
  measurementId: "G-BVW84K7J9C"
};

const isFirebaseConfigured = firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";

let app = null;
let db = null;
let storage = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export { db, storage, isFirebaseConfigured };
export default db;
