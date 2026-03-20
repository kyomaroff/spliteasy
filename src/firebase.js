import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDRBLCFpkiXV-rmQdRg103997mFwGq6r28",
  authDomain: "spliteasy-b976d.firebaseapp.com",
  projectId: "spliteasy-b976d",
  storageBucket: "spliteasy-b976d.firebasestorage.app",
  messagingSenderId: "414744571825",
  appId: "1:414744571825:web:2b53b2205bb0bcdf161790",
  measurementId: "G-V9EWRTGWKD"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
