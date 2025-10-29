// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBiGOD4JTGeSCRV9coKn27M-f5bh_kR9sE",
  authDomain: "control-stock-5cd53.firebaseapp.com",
  projectId: "control-stock-5cd53",
  storageBucket: "control-stock-5cd53.firebasestorage.app",
  messagingSenderId: "649466613337",
  appId: "1:649466613337:web:af6371ee769c6fdb1aeb48",
  measurementId: "G-4HYGTZWF41"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
