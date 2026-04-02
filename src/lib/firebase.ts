import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA59gbd2CtSLqw6Xc9s8lfYYZHCCeub7pY",
  authDomain: "programa-mais-restaurante.firebaseapp.com",
  projectId: "programa-mais-restaurante",
  storageBucket: "programa-mais-restaurante.firebasestorage.app",
  messagingSenderId: "169947832540",
  appId: "1:169947832540:web:7660e0006e1df77b005419"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
