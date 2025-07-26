// src/lib/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// ✅ Correct storage bucket
const firebaseConfig = {
  apiKey: "AIzaSyCyJ4crvTcbE2uHAfzHiTICcGP7a4KKFwE",
  authDomain: "steelsonsfantasyfootball.firebaseapp.com",
  projectId: "steelsonsfantasyfootball",
  storageBucket: "steelsonsfantasyfootball.appspot.com", // ✅ fixed here
  messagingSenderId: "693967635959",
  appId: "1:693967635959:web:1433bf20c411bbf5cb5af2",
  measurementId: "G-HB0N5WMBFM"
};

// ✅ Prevent reinitialization and use consistent app instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { db, storage, auth };
