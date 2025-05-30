// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuração do Firebase do seu projeto
const firebaseConfig = {
  apiKey: "AIzaSyB_MOuQg-m_nVDDEr0-BvFLQt1C1W5IrJM",
  authDomain: "agenda-web-10929.firebaseapp.com",
  projectId: "agenda-web-10929",
  storageBucket: "agenda-web-10929.appspot.com",
  messagingSenderId: "845615312481",
  appId: "1:845615312481:web:4b6cf43fa476361df60420",
  measurementId: "G-PP4ZTTSCHK",
};

// Inicializa o app Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o Firestore
export const db = getFirestore(app);