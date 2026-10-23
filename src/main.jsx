import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/manrope'
import './index.css'
import App from './App.jsx'
const Compartido = lazy(() => import('./Compartido.jsx'))
const LegalPagina = lazy(() => import('./Legal.jsx').then((m) => ({ default: m.LegalPagina })))

// Un enlace con ?c=... abre la lista compartida (solo lectura, sin cuenta)
const params = new URLSearchParams(window.location.search)
const token = params.has('c') ? params.get('c') : null
const verLegal = params.has('legal')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {verLegal ? <Suspense fallback={null}><LegalPagina /></Suspense>
      : token !== null ? <Suspense fallback={null}><Compartido token={token} /></Suspense> : <App />}
  </StrictMode>,
)

// Las páginas públicas (lista compartida y legal) no pasan por el inicio de sesión: se quita la pantalla de carga aquí
if (verLegal || token !== null) {
  setTimeout(() => { if (window.__hideSplash) window.__hideSplash() }, 300)
}