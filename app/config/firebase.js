// import "firebase/auth";
// import "firebase/firestore";
// import firebase from '@react-native-firebase/app';
// import firestore from '@react-native-firebase/firestore';
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';
// import firebase from 'firebase/app';

const firebaseConfig = {
    apiKey: "AIzaSyC88Xz8qiGFu8hdev7mxiY2gk_ldrRTvtI",
    authDomain: "travel-buddy-fdfc0.firebaseapp.com",
    projectId: "travel-buddy-fdfc0",
    storageBucket: "travel-buddy-fdfc0.firebasestorage.app",
    messagingSenderId: "402915556052",
    appId: "1:402915556052:web:59e306c364672db1b19941",
    measurementId: "G-M04G14PQJT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const firestore = getFirestore(app);

export { auth,firestore,db,storage };

