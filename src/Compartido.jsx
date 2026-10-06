import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const hoy = new Date();
hoy.setHours(0, 0, 0, 0);

const dias = exp => {
  const d = new Date(exp + 'T12:00:00');
  d.setHours(0, 0, 0, 0);
  return Math.round((d - hoy) / 86400000);
};
const estado = (d, alerta) => (d < 0 ? 'expired' : d <= 3 ? 'danger' : d <= alerta ? 'warn' : 'ok');
const etiqueta = d => (d < 0 ? 'Vencido' : d === 0 ? 'Hoy' : d === 1 ? 'Mañana' : `${d} días`);
const clasePill = st => (st === 'ok' ? 'ad-pill--ok' : st === 'warn' ? 'ad-pill--warn' : 'ad-pill--danger');
const fecha = ms => new Date(ms).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });

const Logo = () => (
  <div className="ad-logo">
    <svg width="30" height="30" viewBox="0 0 80 80" aria-hidden="true">
      <path d="M40 14 C40 14 56 25 56 38 C56 50 48 58 40 61 C32 58 24 50 24 38 C24 25 40 14 40 14Z" fill="none" stroke="var(--green)" strokeWidth="4" strokeLinecap="round" />
      <polyline points="32,38 38,44 49,31" fill="none" stroke="var(--green)" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

// Vista de solo lectura de una lista compartida. No requiere cuenta.
export default function Compartido({ token }) {
  const [datos, setDatos] = useState(undefined); // undefined: cargando, null: no disponible
  const [instalar, setInstalar] = useState(null);
  const [ayuda, setAyuda] = useState(false);

  useEffect(() => {
    document.title = 'Lista compartida · Al Día';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    const splash = document.getElementById('native-splash');
    if (splash) splash.remove();
    return () => meta.remove();
  }, []);

  useEffect(() => {
    let vivo = true;
    getDoc(doc(db, 'compartidos', token))
      .then(s => { if (vivo) setDatos(s.exists() ? s.data() : null); })
      .catch(() => { if (vivo) setDatos(null); });
    return () => { vivo = false; };
  }, [token]);

  useEffect(() => {
    const alPreparar = e => { e.preventDefault(); setInstalar(e); };
    window.addEventListener('beforeinstallprompt', alPreparar);
    return () => window.removeEventListener('beforeinstallprompt', alPreparar);
  }, []);

  const instalada = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  const alDescargar = async () => {
    if (instalar) {
      instalar.prompt();
      try { await instalar.userChoice; } catch { /* el usuario cerró el aviso */ }
      setInstalar(null);
    } else {
      setAyuda(v => !v);
    }
  };

  const productos = datos ? [...datos.productos].sort((x, y) => dias(x.exp) - dias(y.exp)) : [];
  const cuenta = { vencidos: 0, porVencer: 0, alDia: 0 };
  productos.forEach(p => {
    const st = estado(dias(p.exp), p.alert ?? 7);
    if (st === 'expired') cuenta.vencidos++;
    else if (st === 'ok') cuenta.alDia++;
    else cuenta.porVencer++;
  });

  return (
    <div className="ad-shared">
      <header className="ad-hero">
        <div className="ad-topbar">
          <div className="ad-brand">
            <Logo />
            <h1 className="ad-wordmark">al día</h1>
          </div>
        </div>
        {datos && <p className="ad-hello">{datos.nombre ? `${datos.nombre} compartió contigo` : 'Lista compartida contigo'}</p>}
      </header>

      <div className="ad-overlap">
        {datos === undefined && <div className="ad-card ad-pad ad-muted" style={{ textAlign: 'center' }}>Cargando lista...</div>}

        {datos === null && (
          <div className="ad-card ad-pad" style={{ textAlign: 'center' }}>
            <h2 className="ad-section" style={{ margin: '6px 0 4px' }}>Este enlace ya no está disponible</h2>
            <p className="ad-muted">Puede que haya vencido o que quien lo compartió lo haya desactivado.</p>
          </div>
        )}

        {datos && (
          <>
            <div className="ad-stats" style={{ marginTop: 0 }}>
              <div className="ad-stat"><span className="ad-stat__n ad-stat__n--danger">{cuenta.vencidos}</span><span className="ad-stat__l">Vencidos</span></div>
              <div className="ad-stat"><span className="ad-stat__n ad-stat__n--warn">{cuenta.porVencer}</span><span className="ad-stat__l">Por vencer</span></div>
              <div className="ad-stat"><span className="ad-stat__n ad-stat__n--ok">{cuenta.alDia}</span><span className="ad-stat__l">Al día</span></div>
            </div>

            <div className="ad-sechead">
              <h2 className="ad-section">Productos</h2>
            </div>
            <p className="ad-muted" style={{ margin: '-4px 0 12px', fontSize: '.8125rem' }}>
              Copia del {fecha(datos.creadoMs)}. Este enlace vence el {fecha(datos.venceMs)}.
            </p>

            <div className="ad-grid">
              {productos.map((p, i) => {
                const d = dias(p.exp);
                const st = estado(d, p.alert ?? 7);
                return (
                  <div key={i} className="ad-card ad-product">
                    <div className="ad-product__row">
                      <span className="ad-product__cat">{p.cat}</span>
                      <span className={`ad-pill ${clasePill(st)}`}>{etiqueta(d)}</span>
                      <div className="ad-item__body">
                        <div className="ad-item__name">{p.name}</div>
                        {p.qty && <div className="ad-muted" style={{ fontSize: '.8125rem' }}>{p.qty}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="ad-card ad-pad ad-cta">
          <h2 className="ad-section" style={{ margin: '0 0 4px' }}>Controla tus propios vencimientos</h2>
          <p className="ad-muted" style={{ marginBottom: 14 }}>Al Día te avisa antes de que tus productos se venzan. Es gratis.</p>
          {!instalada && <button className="ad-btn" onClick={alDescargar}>Descargar la app</button>}
          {ayuda && (
            <div className="ad-note">
              {esIOS
                ? 'En iPhone: abre este enlace en Safari, toca el botón Compartir y elige «Agregar a pantalla de inicio».'
                : 'Abre el menú de tu navegador y elige «Instalar app» o «Agregar a pantalla de inicio».'}
            </div>
          )}
          <a className="ad-btn ad-btn--ghost" href="/">{instalada ? 'Abrir Al Día' : 'Usar en el navegador'}</a>
        </div>
      </div>
    </div>
  );
}