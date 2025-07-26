// src/lib/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCyJ4crvTcbE2uHAfzHiTICcGP7a4KKFwE",
  authDomain: "steelsonsfantasyfootball.firebaseapp.com",
  projectId: "steelsonsfantasyfootball",
  storageBucket: "steelsonsfantasyfootball.appspot.com", // ❗️FIXED: was .firebasestorage.app (wrong)
  messagingSenderId: "693967635959",
  appId: "1:693967635959:web:1433bf20c411bbf5cb5af2",
  measurementId: "G-HB0N5WMBFM"
};

// ✅ Prevent duplicate initialization
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ Export everything used in your app
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
