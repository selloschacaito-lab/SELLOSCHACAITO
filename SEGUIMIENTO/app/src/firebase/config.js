import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
const firebaseConfig = {
    apiKey: "AIzaSyD7YzgDdk38Ij3bNEKISra_UWDA8i7vQNQ",
    authDomain: "seguimiento-sellos-chacaito.firebaseapp.com",
    databaseURL: "https://seguimiento-sellos-chacaito-default-rtdb.firebaseio.com",
    projectId: "seguimiento-sellos-chacaito",
    storageBucket: "seguimiento-sellos-chacaito.firebasestorage.app",
    messagingSenderId: "62441533319",
    appId: "1:62441533319:web:16cdcf3ae7ab4e39676d22"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const firestoreDB = getFirestore(app);

enableIndexedDbPersistence(firestoreDB).catch((err) => {
  console.log("Persistence failed:", err.code);
});

export { app, db, auth, firestoreDB };
