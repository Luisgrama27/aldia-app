import { useState, useEffect, useRef } from "react";
import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import emailjs from "@emailjs/browser";

const EMAILJS_SERVICE = "service_vi35bf4";
const EMAILJS_TEMPLATE_BIENVENIDA = "template_79jcsbv";
const EMAILJS_KEY = "rt3CGRFqu1i6H69tO";

const provider = new GoogleAuthProvider();

// Estilos propios de esta pantalla (se inyectan una sola vez)
if (!document.getElementById('ad-login-style')) {
  const styleEl = document.createElement('style');
  styleEl.id = 'ad-login-style';
  styleEl.textContent = `
    @keyframes ad-spin { to { transform: rotate(360deg); } }
    .ad-spin { display:inline-block; width:16px; height:16px; margin-right:8px; border:2px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:ad-spin 1s linear infinite; }
    .ad-login-group { margin-bottom:16px; overflow:hidden; border-radius:20px 20px 20px 8px; background:var(--input); }
    .ad-login-row { display:flex; align-items:center; gap:12px; padding:12px 16px; transition:box-shadow 0.15s ease; }
    .ad-login-row + .ad-login-row { border-top:1px solid var(--border); }
    .ad-login-input { width:100%; min-height:32px; padding:4px 0; border:0; outline:0; background:transparent; color:var(--text); font:inherit; font-size:1rem; }
    .ad-login-select { flex:1; min-width:0; height:44px; padding:0 8px; border:1px solid var(--border); border-radius:12px; background:var(--card); font-family:inherit; font-size:0.9375rem; }
    .ad-login-check { display:flex; align-items:flex-start; gap:12px; margin-bottom:16px; color:var(--text); font-size:0.9375rem; line-height:1.4; cursor:pointer; }
    .ad-login-check input { flex:none; width:22px; height:22px; margin-top:1px; cursor:pointer; accent-color:var(--green); }
    .ad-login-hint { margin-top:4px; font-size:0.8125rem; font-weight:700; }
  `;
  document.head.appendChild(styleEl);
}

function mensajeAuth(e, accion) {
  const codigo = e && e.code ? e.code : '';
  const conocidos = {
    'auth/invalid-email': 'El correo electrónico no es válido.',
    'auth/network-request-failed': 'Sin conexión. Revisa tu internet e inténtalo de nuevo.',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
    'auth/operation-not-allowed': 'El acceso con correo y contraseña no está habilitado en este momento.',
    'auth/admin-restricted-operation': 'El registro de nuevos usuarios está desactivado en este momento.',
    'auth/unauthorized-domain': 'Este sitio no está autorizado para iniciar sesión con Google.',
    'auth/popup-blocked': 'El navegador bloqueó la ventana de Google. Permite las ventanas emergentes e inténtalo de nuevo.',
  };
  if (conocidos[codigo]) return conocidos[codigo];
  return `No se pudo ${accion}${codigo ? ` (${codigo})` : ''}. Inténtalo de nuevo.`;
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const icon = (path) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={path}/></svg>
);
const ICONS = {
  user: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  phone: "M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z",
  cal: "M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z",
  pin: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  mail: "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
  lock: "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm3 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z",
};

function Row({ focused, iconPath, iconColor, label, children }) {
  return (
    <div className="ad-login-row" style={{ boxShadow: focused ? 'inset 0 -2px 0 var(--green)' : 'none' }}>
      <span style={{ display: 'flex', flexShrink: 0, color: iconColor || 'var(--text2)' }}>{icon(iconPath)}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="ad-field__label">{label}</div>
        {children}
      </div>
    </div>
  );
}

function FechaNacimientoSelector({ value, onChange }) {
  // Cada selector guarda su propio valor: antes solo se guardaba la fecha completa,
  // y por eso cada elección se borraba hasta tener los tres campos.
  const partes = value ? value.split('-') : ['', '', ''];
  const [anio, setAnio] = useState(partes[0] || '');
  const [mes, setMes] = useState(partes[1] || '');
  const [dia, setDia] = useState(partes[2] || '');

  const anioActual = new Date().getFullYear();
  const anios = Array.from({length: 100}, (_, i) => anioActual - 18 - i);
  const maxDias = (a, m) => (a && m ? new Date(Number(a), Number(m), 0).getDate() : 31);
  const dias = Array.from({length: maxDias(anio, mes)}, (_, i) => String(i + 1).padStart(2, '0'));

  const actualizar = (a, m, d) => {
    if (d && Number(d) > maxDias(a, m)) d = '';
    setAnio(a); setMes(m); setDia(d);
    onChange(a && m && d ? `${a}-${m}-${d}` : '');
  };

  return (
    <div style={{display:'flex',gap:8,marginTop:4}}>
      <select className="ad-login-select" aria-label="Día" value={dia} onChange={e => actualizar(anio, mes, e.target.value)} style={{color: dia ? 'var(--text)' : 'var(--text2)'}}>
        <option value="">Día</option>
        {dias.map(d => <option key={d} value={d}>{d}</option>)}
      </select>
      <select className="ad-login-select" aria-label="Mes" value={mes} onChange={e => actualizar(anio, e.target.value, dia)} style={{color: mes ? 'var(--text)' : 'var(--text2)', flex:1.6}}>
        <option value="">Mes</option>
        {MESES.map((m, i) => (
          <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>
        ))}
      </select>
      <select className="ad-login-select" aria-label="Año" value={anio} onChange={e => actualizar(e.target.value, mes, dia)} style={{color: anio ? 'var(--text)' : 'var(--text2)', flex:1.2}}>
        <option value="">Año</option>
        {anios.map(a => <option key={a} value={a}>{a}</option>)}
      </select>
    </div>
  );
}

export default function Login() {
  const [modo, setModo] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [pais, setPais] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [notificaciones, setNotificaciones] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [focusField, setFocusField] = useState(null);
  const [emailValido, setEmailValido] = useState(null);
  const [passwordFuerte, setPasswordFuerte] = useState(null);
  const [telefonoValido, setTelefonoValido] = useState(null);

  const reset = () => { setError(""); setMensaje(""); };

  // Los avisos se muestran junto al botón y la pantalla se desplaza hasta ellos,
  // para que no queden fuera de la vista en el formulario largo del registro.
  const avisoRef = useRef(null);
  useEffect(() => {
    if ((error || mensaje) && avisoRef.current) {
      avisoRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error, mensaje]);

  useEffect(() => {
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setEmailValido(emailRegex.test(email));
    } else { setEmailValido(null); }
  }, [email]);

  useEffect(() => {
    if (password && modo === 'registro') {
      const fuerte = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
      const medio = password.length >= 6;
      setPasswordFuerte(fuerte ? 'fuerte' : medio ? 'medio' : 'debil');
    } else { setPasswordFuerte(null); }
  }, [password, modo]);

  useEffect(() => {
    if (telefono) {
      const telefonoRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
      setTelefonoValido(telefonoRegex.test(telefono.replace(/\s/g, '')));
    } else { setTelefonoValido(null); }
  }, [telefono]);

  const handleLogin = async () => {
    if (!emailValido) { setError("Ingresa un correo electrónico válido."); return; }
    if (!password) { setError("Ingresa tu contraseña."); return; }
    setCargando(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch(e) {
      setCargando(false);
      if (e.code === 'auth/user-not-found') setError("No existe una cuenta con este correo.");
      else if (e.code === 'auth/wrong-password') setError("Contraseña incorrecta.");
      else if (e.code === 'auth/invalid-credential') setError("Correo o contraseña incorrectos.");
      else if (e.code === 'auth/too-many-requests') setError("Demasiados intentos. Espera unos minutos e inténtalo de nuevo.");
      else { console.error(e); setError(mensajeAuth(e, 'iniciar sesión')); }
    }
  };

  const handleRegistro = async () => {
    if (!nombre.trim()) { setError("Ingresa tu nombre completo."); return; }
    if (!emailValido) { setError("Ingresa un correo electrónico válido."); return; }
    if (passwordFuerte === 'debil' || !password) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    if (!telefonoValido) { setError("Ingresa un número de teléfono válido."); return; }
    if (!fechaNacimiento) { setError("Selecciona tu fecha de nacimiento completa."); return; }
    if (!pais.trim()) { setError("Ingresa tu país."); return; }
    if (!ciudad.trim()) { setError("Ingresa tu ciudad."); return; }

    setCargando(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      try { await updateProfile(userCredential.user, { displayName: nombre.trim() }); } catch(e2) { console.error(e2); }
      try { await sendEmailVerification(userCredential.user); } catch(e3) { console.error(e3); }
      try {
        await emailjs.send(
          EMAILJS_SERVICE,
          EMAILJS_TEMPLATE_BIENVENIDA,
          { to_email: email, nombre: nombre.trim() },
          EMAILJS_KEY
        );
      } catch(emailError) {
        console.error("Error enviando correo de bienvenida:", emailError);
      }
    } catch(e) {
      setCargando(false);
      if (e.code === 'auth/email-already-in-use') setError("Ya existe una cuenta con este correo.");
      else if (e.code === 'auth/weak-password') setError("La contraseña es muy débil.");
      else { console.error(e); setError(mensajeAuth(e, 'crear la cuenta')); }
    }
  };

  const handleGoogle = async () => {
    setCargando(true);
    try {
      await signInWithPopup(auth, provider);
    } catch(e) {
      setCargando(false);
      if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
        console.error(e);
        setError(mensajeAuth(e, 'iniciar sesión con Google'));
      }
    }
  };

  const handleRecuperar = async () => {
    if (!emailValido) { setError("Ingresa un correo electrónico válido."); return; }
    setCargando(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMensaje("¡Enlace enviado! Revisa tu bandeja de entrada y carpeta de spam.");
      setError("");
      setCargando(false);
    } catch(e) {
      setCargando(false);
      if (e.code === 'auth/user-not-found') setError("No existe una cuenta con este correo.");
      else setError("Error al enviar el enlace. Inténtalo de nuevo.");
    }
  };

  const cambiarModo = (nuevoModo) => {
    setModo(nuevoModo); reset(); setFocusField(null);
    setEmailValido(null); setPasswordFuerte(null); setTelefonoValido(null);
    setTelefono(""); setFechaNacimiento(""); setPais(""); setCiudad(""); setNotificaciones(true);
  };

  const strengthColor = passwordFuerte === 'fuerte' ? 'var(--green)' : passwordFuerte === 'medio' ? '#e0a92b' : '#e4775a';
  const strengthText = passwordFuerte === 'fuerte' ? 'Contraseña fuerte' : passwordFuerte === 'medio' ? 'Contraseña aceptable' : 'Contraseña débil';
  const strengthLevel = passwordFuerte === 'fuerte' ? 3 : passwordFuerte === 'medio' ? 2 : 1;

  const onSubmit = modo === 'login' ? handleLogin : modo === 'registro' ? handleRegistro : handleRecuperar;

  const field = (name) => ({
    onFocus: () => setFocusField(name),
    onBlur: () => setFocusField(null),
  });

  return (
    <div className="ad-screen" style={{ paddingBottom: 'calc(28px + env(safe-area-inset-bottom, 0px))' }}>
      <header className="ad-hero" style={{ textAlign: 'center', paddingBottom: 88 }}>
        <div className="ad-logo" style={{ width: 76, height: 76, margin: '0 auto' }}>
          <svg width="50" height="50" viewBox="0 0 80 80" aria-hidden="true">
            <path d="M40 14 C40 14 56 25 56 38 C56 50 48 58 40 61 C32 58 24 50 24 38 C24 25 40 14 40 14Z" fill="none" stroke="var(--green)" strokeWidth="4" strokeLinecap="round"/>
            <polyline points="32,38 38,44 49,31" fill="none" stroke="var(--green)" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="ad-title" style={{ fontSize: '2rem', marginTop: 12 }}>Al Día</h1>
        <p className="ad-hello" style={{ fontSize: '1rem' }}>
          {modo==='login' && 'Bienvenido de nuevo'}
          {modo==='registro' && 'Crea tu cuenta gratis'}
          {modo==='recuperar' && 'Recupera tu contraseña'}
        </p>
      </header>

      <div className="ad-overlap" style={{ marginTop: -60 }}>
        <div className="ad-card" style={{ maxWidth: 420, margin: '0 auto', padding: '20px 16px' }}>

          <div className="ad-login-group">
            {modo==='registro' && (
              <>
                <Row focused={focusField==='nombre'} iconPath={ICONS.user} label="Nombre completo">
                  <input className="ad-login-input" value={nombre} onChange={e=>{setNombre(e.target.value);reset();}} {...field('nombre')} placeholder="Tu nombre completo" autoComplete="name"/>
                </Row>

                <Row focused={focusField==='telefono'} iconPath={ICONS.phone} label="Teléfono" iconColor={telefonoValido===false?'var(--danger)':telefonoValido===true?'var(--green)':undefined}>
                  <input className="ad-login-input" type="tel" value={telefono} onChange={e=>{setTelefono(e.target.value);reset();}} {...field('telefono')} placeholder="+57 300 123 4567" autoComplete="tel"/>
                  {telefono&&telefonoValido===false&&<div className="ad-login-hint" style={{color:'var(--danger)'}}>Número de teléfono inválido</div>}
                  {telefono&&telefonoValido===true&&<div className="ad-login-hint" style={{color:'var(--green)'}}>✓ Teléfono válido</div>}
                </Row>

                <Row focused={false} iconPath={ICONS.cal} label="Fecha de nacimiento">
                  <FechaNacimientoSelector value={fechaNacimiento} onChange={setFechaNacimiento}/>
                </Row>

                <Row focused={focusField==='pais'} iconPath={ICONS.pin} label="País">
                  <input className="ad-login-input" value={pais} onChange={e=>{setPais(e.target.value);reset();}} {...field('pais')} placeholder="Colombia" autoComplete="country-name"/>
                </Row>

                <Row focused={focusField==='ciudad'} iconPath={ICONS.pin} label="Ciudad">
                  <input className="ad-login-input" value={ciudad} onChange={e=>{setCiudad(e.target.value);reset();}} {...field('ciudad')} placeholder="Bogotá" autoComplete="address-level2"/>
                </Row>
              </>
            )}

            <Row focused={focusField==='email'} iconPath={ICONS.mail} label="Correo electrónico" iconColor={emailValido===false?'var(--danger)':emailValido===true?'var(--green)':undefined}>
              <input className="ad-login-input" type="email" value={email} onChange={e=>{setEmail(e.target.value);reset();}} {...field('email')} placeholder="tucorreo@email.com" autoComplete="email"/>
              {email&&emailValido===false&&<div className="ad-login-hint" style={{color:'var(--danger)'}}>Correo electrónico inválido</div>}
              {email&&emailValido===true&&<div className="ad-login-hint" style={{color:'var(--green)'}}>✓ Correo válido</div>}
            </Row>

            {modo!=='recuperar'&&(
              <Row focused={focusField==='password'} iconPath={ICONS.lock} label="Contraseña" iconColor={passwordFuerte?strengthColor:undefined}>
                <input className="ad-login-input" type="password" value={password} onChange={e=>{setPassword(e.target.value);reset();}} {...field('password')} placeholder="••••••••" autoComplete={modo==='login'?'current-password':'new-password'}/>
                {password&&modo==='registro'&&(
                  <div style={{display:'flex',alignItems:'center',gap:6,marginTop:6}}>
                    {[1,2,3].map(i=>(
                      <div key={i} style={{width:44,height:4,borderRadius:2,background:strengthColor,opacity:i<=strengthLevel?1:0.25}}/>
                    ))}
                    <span style={{fontSize:'0.8125rem',color:strengthColor,fontWeight:700}}>{strengthText}</span>
                  </div>
                )}
              </Row>
            )}
          </div>

          {modo==='registro' && (
            <label className="ad-login-check">
              <input type="checkbox" checked={notificaciones} onChange={e=>setNotificaciones(e.target.checked)}/>
              <span>Recibir notificaciones sobre consejos para reducir desperdicio</span>
            </label>
          )}

          <div ref={avisoRef}>
            {error && <div className="ad-note ad-note--danger" role="alert" style={{ marginBottom: 12 }}>⚠️ {error}</div>}
            {mensaje && <div className="ad-note" style={{ marginBottom: 12 }}>✓ {mensaje}</div>}
          </div>

          <button className="ad-btn" style={{ opacity: cargando ? 0.7 : 1, cursor: cargando ? 'not-allowed' : 'pointer' }} onClick={onSubmit} disabled={cargando}>
            {cargando?(
              <><span className="ad-spin"/>{modo==='login'&&'Iniciando sesión...'}{modo==='registro'&&'Creando cuenta...'}{modo==='recuperar'&&'Enviando enlace...'}</>
            ):(
              <>{modo==='login'&&'Iniciar sesión'}{modo==='registro'&&'Crear cuenta'}{modo==='recuperar'&&'Enviar enlace de recuperación'}</>
            )}
          </button>

          {modo!=='recuperar'&&(
            <>
              <div style={{display:'flex',alignItems:'center',gap:12,margin:'18px 0 14px'}}>
                <div style={{flex:1,height:1,background:'var(--border)'}}/>
                <span className="ad-muted" style={{fontWeight:700}}>o continúa con</span>
                <div style={{flex:1,height:1,background:'var(--border)'}}/>
              </div>
              <button className="ad-btn ad-btn--ghost" style={{color:'var(--text)',boxShadow:'inset 0 0 0 1.5px var(--border)',opacity:cargando?0.7:1}} onClick={handleGoogle} disabled={cargando}>
                <svg width="22" height="22" viewBox="0 0 18 18" aria-hidden="true">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Continuar con Google
              </button>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 10 }}>
          {modo==='login'&&(
            <>
              <button className="ad-link" onClick={()=>cambiarModo('recuperar')}>¿Olvidaste tu contraseña?</button>
              <div className="ad-muted" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:4,flexWrap:'wrap'}}>
                ¿No tienes cuenta? <button className="ad-link" onClick={()=>cambiarModo('registro')}>Regístrate</button>
              </div>
            </>
          )}
          {modo==='registro'&&(
            <div className="ad-muted" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:4,flexWrap:'wrap'}}>
              ¿Ya tienes cuenta? <button className="ad-link" onClick={()=>cambiarModo('login')}>Inicia sesión</button>
            </div>
          )}
          {modo==='recuperar'&&(
            <button className="ad-link" onClick={()=>cambiarModo('login')}>← Volver al inicio</button>
          )}
        </div>
      </div>
    </div>
  );
}