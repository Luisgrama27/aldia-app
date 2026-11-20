import { Component, StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/manrope'
import './index.css'
import App from './App.jsx'
import { DefsVidrio } from './ilustraciones.jsx'
const Compartido = lazy(() => import('./Compartido.jsx'))
const LegalPagina = lazy(() => import('./Legal.jsx').then((m) => ({ default: m.LegalPagina })))

// Si algo falla al dibujar la pantalla, se muestra un aviso con salida en vez de una pantalla en blanco
class LimiteErrores extends Component {
  state = { fallo: false }
  static getDerivedStateFromError() { return { fallo: true } }
  componentDidCatch(error) { console.error(error) }
  render() {
    if (!this.state.fallo) return this.props.children
    return (
      <div role="alert" style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, textAlign: 'center', background: 'var(--bg, #f4f5f6)', color: 'var(--text, #131517)' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Algo salió mal</h1>
        <p style={{ maxWidth: 300, color: 'var(--text2, #66686a)' }}>No pudimos mostrar esta pantalla. Tus productos están a salvo. Vuelve a cargar la app para continuar.</p>
        <button type="button" onClick={() => window.location.reload()} style={{ minHeight: 48, padding: '0 28px', border: 0, borderRadius: 999, background: 'var(--green, #2f6b4f)', color: '#fff', font: 'inherit', fontWeight: 700 }}>Volver a cargar</button>
      </div>
    )
  }
}

// Un enlace con ?c=... abre la lista compartida (solo lectura, sin cuenta)
const params = new URLSearchParams(window.location.search)
const token = params.has('c') ? params.get('c') : null
const verLegal = params.has('legal')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LimiteErrores>
    <DefsVidrio />
    {verLegal ? <Suspense fallback={null}><LegalPagina /></Suspense>
      : token !== null ? <Suspense fallback={null}><Compartido token={token} /></Suspense> : <App />}
    </LimiteErrores>
  </StrictMode>,
)

// Las páginas públicas (lista compartida y legal) no pasan por el inicio de sesión: se quita la pantalla de carga aquí
if (verLegal || token !== null) {
  setTimeout(() => { if (window.__hideSplash) window.__hideSplash() }, 300)
}