import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const isBrowser = typeof window !== 'undefined';
const authDomain = isBrowser && window.location.hostname.endsWith('web.app')
  ? window.location.hostname
  : "sellos-chacaito.firebaseapp.com";

const firebaseConfig = {
  apiKey: "AIzaSyATXScBUMK87WNQaOFN2hoX2zOWs5K9-Wc",
  authDomain: authDomain,
  projectId: "sellos-chacaito",
  storageBucket: "sellos-chacaito.firebasestorage.app",
  messagingSenderId: "253075413461",
  appId: "1:253075413461:web:32383fb249a312ec7ac55c",
  measurementId: "G-2H5D93XYE9"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar y exportar los servicios
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
