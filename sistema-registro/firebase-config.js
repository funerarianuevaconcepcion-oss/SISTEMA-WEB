// =============================================
// CONFIGURACIÓN DE FIREBASE — Funerales Concepción
// =============================================

const firebaseConfig = {
  apiKey: "AIzaSyCnMFK9PZZ99WHDlnSCzHY5T2PyQJH5sUI",
  authDomain: "sistema-registro-ddbb2.firebaseapp.com",
  projectId: "sistema-registro-ddbb2",
  storageBucket: "sistema-registro-ddbb2.firebasestorage.app",
  messagingSenderId: "605504593518",
  appId: "1:605504593518:web:42c055d2a1b1b019b2907f"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const storage = firebase.storage();

console.log("✅ Firebase conectado — Funerales Concepción");