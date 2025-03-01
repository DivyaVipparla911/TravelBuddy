import "firebase/auth";
import "firebase/firestore";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
   
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };