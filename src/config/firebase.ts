import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAgWLNVsapz4U9c116bOHGG5Zc_oaihJxk",
  authDomain: "faltas-e-pratica.firebaseapp.com",
  projectId: "faltas-e-pratica",
  storageBucket: "faltas-e-pratica.firebasestorage.app",
  messagingSenderId: "908881754467",
  appId: "1:908881754467:web:8f93bdf7bd5fb904e73b56"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);