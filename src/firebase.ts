import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD_vc6XX6OlhcfRxfgVPi8D6Ros8UiTQ-o",
  authDomain: "omniorder-c5bf4.firebaseapp.com",
  projectId: "omniorder-c5bf4",
  storageBucket: "omniorder-c5bf4.firebasestorage.app",
  messagingSenderId: "400194915245",
  appId: "1:400194915245:web:ea5706c5aed5802185af24",
  measurementId: "G-0KT20M761T"
};

// Check if variables are still placeholders
const isFirebaseConfigured = firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("MASUKKAN_");

if (!isFirebaseConfigured) {
  console.warn(
    "Firebase belum dikonfigurasi. Harap ganti placeholder di src/firebase.ts dengan kredensial Firebase Anda sendiri."
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
