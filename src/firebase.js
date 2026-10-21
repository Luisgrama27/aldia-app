import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDb6OW3Vo_rH3oFQZBOQIC-ZZBhihLwHhM",
  authDomain: "freshcheck-7659a.firebaseapp.com",
  projectId: "freshcheck-7659a",
  storageBucket: "freshcheck-7659a.firebasestorage.app",
  messagingSenderId: "968709249748",
  appId: "1:968709249748:web:89fb49b55d171df03c7941"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Caché en el dispositivo: la app abre con tus datos sin conexión y guarda los cambios hechos sin internet.
// Si el navegador no lo permite (por ejemplo, ventana privada), usa la memoria como antes.
let baseDatos;
try {
  baseDatos = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
} catch {
  baseDatos = getFirestore(app);
}
export const db = baseDatos;