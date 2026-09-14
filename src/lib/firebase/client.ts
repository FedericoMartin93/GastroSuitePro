import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';

export const firebaseConfig = {
    apiKey: "AIzaSyAEdddRGq5sGETLxJR7EHdh1svkLZI7Sv8",
    authDomain: "calculadora-de-platos.firebaseapp.com",
    projectId: "calculadora-de-platos",
    storageBucket: "calculadora-de-platos.firebasestorage.app",
    messagingSenderId: "999617852679",
    appId: "1:999617852679:web:f801769138e505a6e7c1a2"
};

// Singleton initialization for browser environment
export const app: FirebaseApp = getApps().length === 0 
    ? initializeApp(firebaseConfig) 
    : getApp();

export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Request full Gmail and Identity scopes by default
googleProvider.addScope('https://www.googleapis.com/auth/gmail.modify');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
googleProvider.setCustomParameters({ prompt: 'select_account' });
