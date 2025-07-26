// src/lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCyJ4crvTcbE2uHAfzHiTICcGP7a4KKFwE",
  authDomain: "steelsonsfantasyfootball.firebaseapp.com",
  projectId: "steelsonsfantasyfootball",
  storageBucket: "steelsonsfantasyfootball.firebasestorage.app",
  messagingSenderId: "693967635959",
  appId: "1:693967635959:web:1433bf20c411bbf5cb5af2",
  measurementId: "G-HB0N5WMBFM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
