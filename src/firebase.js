// src/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions"; // A importação foi limpa

// Sua configuração do Firebase (mantida exatamente como estava)
const firebaseConfig = {
  apiKey: "AIzaSyB_MOuQg-m_nVDDEr0-BvFLQt1C1W5IrJM",
  authDomain: "agenda-web-10929.firebaseapp.com",
  projectId: "agenda-web-10929",
  storageBucket: "agenda-web-10929.appspot.com",
  messagingSenderId: "845615312481",
  appId: "1:845615312481:web:4b6cf43fa476361df60420",
  measurementId: "G-PP4ZTTSCHK",
};

// Inicializa o Firebase App
const app = initializeApp(firebaseConfig);

// Inicializa todos os serviços que vamos usar e os exporta
const db = getFirestore(app);
const auth = getAuth(app);

// A região precisa ser a mesma onde suas funções foram publicadas ('us-central1')
const functions = getFunctions(app, 'us-central1');

// Exportamos tudo para ser usado em outros lugares do app
export { db, auth, functions };