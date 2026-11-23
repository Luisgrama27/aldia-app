import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager, waitForPendingWrites, terminate, clearIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDb6OW3Vo_rH3oFQZBOQIC-ZZBhihLwHhM",
  authDomain: "freshcheck-7659a.firebaseapp.com",
  projectId: "freshcheck-7659a",
  storageBucket: "freshcheck-7659a.firebasestorage.app",
  messagingSenderId: "968709249748",
  appId: "1:968709249748:web:89fb49b55d171df03c7941"
};

const app = initializeApp(firebaseConfig);

// App Check: demuestra a Firebase que las peticiones vienen de la app real y no de un script ajeno.
// La clave del sitio de reCAPTCHA Enterprise es pública.
try {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider("6LfLIS8uAAAAAE2wvTJhMc_UViL3LCuXXKguXFyP"),
    isTokenAutoRefreshEnabled: true,
  });
} catch (e) {
  console.error("App Check no se pudo iniciar", e);
}
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

// Al cerrar sesión o borrar la cuenta: sincroniza lo pendiente (máx. 3 s) y borra del dispositivo
// la caché de Firestore y los datos guardados por cuenta, para que nadie más los vea en un equipo compartido.
// Conserva solo preferencias de la interfaz (tema, avisos ya vistos).
export async function limpiarDatosLocales() {
  try {
    await Promise.race([waitForPendingWrites(baseDatos), new Promise((r) => setTimeout(r, 3000))]);
  } catch { /* sin conexión: se limpia igual */ }
  try {
    Object.keys(localStorage)
      .filter((k) => /^(prefs_|meta_|correo_)/.test(k) || k === 'aldia_codigos')
      .forEach((k) => localStorage.removeItem(k));
  } catch { /* sin almacenamiento */ }
  try {
    await terminate(baseDatos);
    await clearIndexedDbPersistence(baseDatos);
  } catch { /* si otra pestaña la usa, se limpiará la próxima vez */ }
}