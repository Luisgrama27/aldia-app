import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/manrope'
import './index.css'
import App from './App.jsx'
const Compartido = lazy(() => import('./Compartido.jsx'))

// Un enlace con ?c=... abre la lista compartida (solo lectura, sin cuenta)
const params = new URLSearchParams(window.location.search)
const token = params.has('c') ? params.get('c') : null

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {token !== null ? <Suspense fallback={null}><Compartido token={token} /></Suspense> : <App />}
  </StrictMode>,
)