import "firebase/auth";
import "firebase/firestore";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAdEK7f0fzeMw8QFdBLc96DpBsU-32UINQ",
  authDomain: "recipeshare-1ce2b.firebaseapp.com",
  projectId: "recipeshare-1ce2b",
  storageBucket: "recipeshare-1ce2b.firebasestorage.app",
  messagingSenderId: "989591437999",
  appId: "1:989591437999:web:941f1a49648c4221ecca5a",
  measurementId: "G-1ZS86EZH2J"  
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };