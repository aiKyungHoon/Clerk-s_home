import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBwRLokWVQ9it--vfEKRoijtv3NrKeaQUI",
  authDomain: "clerk-s-home.firebaseapp.com",
  projectId: "clerk-s-home",
  storageBucket: "clerk-s-home.firebasestorage.app",
  messagingSenderId: "16406607304",
  appId: "1:16406607304:web:9bfad0f91f84e8e7eabcfd"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
