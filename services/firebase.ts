// firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
 apiKey: "AIzaSyAa9zQ3bBGUBJ2V4ekHSEtpdtGVEsnB6Z8",
  authDomain: "azzora-7bd0d.firebaseapp.com",
  projectId: "azzora-7bd0d",
  storageBucket: "azzora-7bd0d.firebasestorage.app",
  messagingSenderId: "498460069770",
  appId: "1:498460069770:web:991dfcae51b4d59b530273"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
