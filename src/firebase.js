// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB1D7hYJjcpIDdeONOpLKhLscXLLlVR3Ps",
  authDomain: "placementinplace.firebaseapp.com",
  projectId: "placementinplace",
  storageBucket: "placementinplace.appspot.com",
  messagingSenderId: "590491328858",
  appId: "1:590491328858:web:cf08561a198ccaebf01363",
  measurementId: "G-V1BM09GXCL",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
