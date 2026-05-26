import { useState, useEffect } from "react";
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

const LOGO = () => (
  <svg width="64" height="64" viewBox="0 0 72 72">
    <rect width="72" height="72" rx="20" fill="url(#logoGradient)"/>
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor:'#2DB54E',stopOpacity:1}} />
        <stop offset="100%" style={{stopColor:'#1E8E3E',stopOpacity:1}} />
      </linearGradient>
    </defs>
    <path d="M36 18 C36 18 48 26 48 36 C48 46 42 52 36 54 C30 52 24 46 24 36 C24 26 36 18 36 18Z" fill="none" stroke="#fff" strokeWidth="2.2"/>
    <polyline points="29,36 34,41 43,30" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const S = {
  wrap:{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif',padding:16,position:'relative',overflow:'hidden'},
  bgPattern:{position:'absolute',top:0,left:0,right:0,bottom:0,opacity:0.03,backgroundImage:`radial-gradient(circle at 25% 25%, #2DB54E 2px, transparent 2px), radial-gradient(circle at 75% 75%, #2DB54E 1px, transparent 1px)`,backgroundSize:'60px 60px, 40px 40px'},
  card:{background:'#fff',borderRadius:28,padding:'40px 28px',width:'100%',maxWidth:380,boxShadow:'0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',border:'1px solid rgba(255,255,255,0.8)',backdropFilter:'blur(20px)',position:'relative',zIndex:1,transition:'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'},
  brand:{textAlign:'center',marginBottom:32},
  appName:{fontSize:32,fontWeight:800,color:'#1d1d1f',letterSpacing:-0.8,marginTop:16,background:'linear-gradient(135deg, #2DB54E 0%, #1E8E3E 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'},
  appSub:{fontSize:16,color:'#86868b',marginTop:6,fontWeight:400,letterSpacing:-0.2,transition:'all 0.3s ease'},
  section:{background:'#f8f9fa',borderRadius:16,overflow:'hidden',marginBottom:16,border:'1px solid rgba(0,0,0,0.04)',transition:'all 0.3s ease'},
  row:{padding:'16px 18px',borderBottom:'1px solid rgba(0,0,0,0.06)',display:'flex',alignItems:'center',gap:12,transition:'all 0.2s ease',position:'relative'},
  rowLast:{padding:'16px 18px',display:'flex',alignItems:'center',gap:12,position:'relative'},
  icon:{width:20,height:20,color:'#86868b',flexShrink:0,transition:'all 0.2s ease'},
  label:{fontSize:11,color:'#86868b',fontWeight:500,textTransform:'uppercase',letterSpacing:0.5,marginBottom:2,opacity:0.8},
  input:{fontSize:16,color:'#1d1d1f',border:'none',outline:'none',background:'transparent',width:'100%',fontWeight:400,transition:'all 0.2s ease'},
  btn:{width:'100%',height:50,borderRadius:14,background:'linear-gradient(135deg, #2DB54E 0%, #1E8E3E 100%)',color:'#fff',border:'none',fontSize:16,fontWeight:600,cursor:'pointer',marginBottom:12,transition:'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',position:'relative',overflow:'hidden',boxShadow:'0 4px 16px rgba(45,181,78,0.3)'},
  btnLoading:{background:'linear-gradient(135deg, #86868b 0%, #636366 100%)',cursor:'not-allowed'},
  btnGoogle:{width:'100%',height:50,borderRadius:14,background:'#fff',border:'1px solid rgba(0,0,0,0.08)',fontSize:15,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:12,color:'#1d1d1f',fontWeight:500,marginBottom:10,transition:'all 0.3s ease',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'},
  divider:{display:'flex',alignItems:'center',gap:16,margin:'8px 0 16px',position:'relative'},
  divLine:{flex:1,height:'1px',background:'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.1) 50%, transparent 100%)'},
  divText:{fontSize:13,color:'#86868b',fontWeight:500,background:'#fff',padding:'0 12px'},
  err:{background:'linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%)',border:'1px solid rgba(255,59,48,0.2)',borderRadius:12,padding:'12px 16px',fontSize:14,color:'#c53030',marginBottom:12,display:'flex',alignItems:'center',gap:8,animation:'slideIn 0.3s ease-out'},
  ok:{background:'linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%)',border:'1px solid rgba(45,181,78,0.2)',borderRadius:12,padding:'12px 16px',fontSize:14,color:'#22543d',marginBottom:12,display:'flex',alignItems:'center',gap:8,animation:'slideIn 0.3s ease-out'},
  link:{color:'#2DB54E',cursor:'pointer',fontWeight:600,transition:'all 0.2s ease'},
  footer:{textAlign:'center',fontSize:14,color:'#86868b',marginTop:8,lineHeight:1.5},
  loadingSpinner:{width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTop:'2px solid #fff',borderRadius:'50%',animation:'spin 1s linear infinite',display:'inline-block',marginRight:8,verticalAlign:'middle'}
};

const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
`;
document.head.appendChild(style);

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
      else setError("Error al iniciar sesión. Inténtalo de nuevo.");
    }
  };

  const handleRegistro = async () => {
    if (!nombre.trim()) { setError("Ingresa tu nombre completo."); return; }
    if (!emailValido) { setError("Ingresa un correo electrónico válido."); return; }
    if (passwordFuerte === 'debil' || !password) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    if (!telefonoValido) { setError("Ingresa un número de teléfono válido."); return; }
    if (!fechaNacimiento) { setError("Selecciona tu fecha de nacimiento."); return; }
    if (!pais.trim()) { setError("Ingresa tu país."); return; }
    if (!ciudad.trim()) { setError("Ingresa tu ciudad."); return; }

    setCargando(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(userCredential.user, { displayName: nombre.trim() });
      await sendEmailVerification(userCredential.user);

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
      else setError("Error al crear la cuenta. Inténtalo de nuevo.");
    }
  };

  const handleGoogle = async () => {
    setCargando(true);
    try {
      await signInWithPopup(auth, provider);
    } catch(e) {
      setCargando(false);
      setError("Error al iniciar sesión con Google.");
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

  const getPasswordStrengthColor = () => {
    if (passwordFuerte === 'fuerte') return '#2DB54E';
    if (passwordFuerte === 'medio') return '#FF9500';
    return '#FF3B30';
  };

  const getPasswordStrengthText = () => {
    if (passwordFuerte === 'fuerte') return 'Contraseña fuerte';
    if (passwordFuerte === 'medio') return 'Contraseña aceptable';
    return 'Contraseña débil';
  };

  const rowStyle = (field) => ({
    ...S.row,
    borderBottom: focusField === field ? '2px solid #2DB54E' : '1px solid rgba(0,0,0,0.06)'
  });

  return (
    <div style={S.wrap}>
      <div style={S.bgPattern}></div>
      <div style={S.card}>
        <div style={S.brand}>
          <LOGO />
          <div style={S.appName}>Al Día</div>
          <div style={S.appSub}>
            {modo==='login' && 'Bienvenido de nuevo'}
            {modo==='registro' && 'Crea tu cuenta gratis'}
            {modo==='recuperar' && 'Recupera tu contraseña'}
          </div>
        </div>

        {error && (
          <div style={S.err}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13 17h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
            {error}
          </div>
        )}

        {mensaje && (
          <div style={S.ok}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            {mensaje}
          </div>
        )}

        <div style={S.section}>
          {modo==='registro' && (
            <>
              <div style={rowStyle('nombre')}>
                <div style={S.icon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </div>
                <div style={{flex:1}}>
                  <div style={S.label}>Nombre completo</div>
                  <input style={S.input} value={nombre} onChange={e=>{setNombre(e.target.value);reset();}} onFocus={()=>setFocusField('nombre')} onBlur={()=>setFocusField(null)} placeholder="Tu nombre completo"/>
                </div>
              </div>

              <div style={rowStyle('telefono')}>
                <div style={{...S.icon,color:telefonoValido===false?'#FF3B30':telefonoValido===true?'#2DB54E':'#86868b'}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                </div>
                <div style={{flex:1}}>
                  <div style={S.label}>Teléfono</div>
                  <input style={S.input} type="tel" value={telefono} onChange={e=>{setTelefono(e.target.value);reset();}} onFocus={()=>setFocusField('telefono')} onBlur={()=>setFocusField(null)} placeholder="+57 300 123 4567"/>
                  {telefono&&telefonoValido===false&&<div style={{fontSize:12,color:'#FF3B30',marginTop:4}}>Número de teléfono inválido</div>}
                  {telefono&&telefonoValido===true&&<div style={{fontSize:12,color:'#2DB54E',marginTop:4}}>✓ Teléfono válido</div>}
                </div>
              </div>

              <div style={rowStyle('fechaNacimiento')}>
                <div style={S.icon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
                </div>
                <div style={{flex:1}}>
                  <div style={S.label}>Fecha de nacimiento</div>
                  <input style={S.input} type="date" value={fechaNacimiento} onChange={e=>{setFechaNacimiento(e.target.value);reset();}} onFocus={()=>setFocusField('fechaNacimiento')} onBlur={()=>setFocusField(null)}/>
                </div>
              </div>

              <div style={rowStyle('pais')}>
                <div style={S.icon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                </div>
                <div style={{flex:1}}>
                  <div style={S.label}>País</div>
                  <input style={S.input} value={pais} onChange={e=>{setPais(e.target.value);reset();}} onFocus={()=>setFocusField('pais')} onBlur={()=>setFocusField(null)} placeholder="Colombia"/>
                </div>
              </div>

              <div style={rowStyle('ciudad')}>
                <div style={S.icon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                </div>
                <div style={{flex:1}}>
                  <div style={S.label}>Ciudad</div>
                  <input style={S.input} value={ciudad} onChange={e=>{setCiudad(e.target.value);reset();}} onFocus={()=>setFocusField('ciudad')} onBlur={()=>setFocusField(null)} placeholder="Bogotá"/>
                </div>
              </div>

              <div style={{...S.row,borderBottom:'none',padding:'16px 18px',display:'flex',alignItems:'center',gap:12}}>
                <input type="checkbox" id="notificaciones" checked={notificaciones} onChange={e=>setNotificaciones(e.target.checked)} style={{width:18,height:18,cursor:'pointer',accentColor:'#2DB54E'}}/>
                <label htmlFor="notificaciones" style={{fontSize:14,color:'#1d1d1f',cursor:'pointer',userSelect:'none'}}>
                  Recibir notificaciones sobre consejos para reducir desperdicio
                </label>
              </div>
            </>
          )}

          <div style={{...(modo==='recuperar'?S.rowLast:S.row),borderBottom:focusField==='email'?'2px solid #2DB54E':modo==='recuperar'?'none':'1px solid rgba(0,0,0,0.06)'}}>
            <div style={{...S.icon,color:emailValido===false?'#FF3B30':emailValido===true?'#2DB54E':'#86868b'}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
            </div>
            <div style={{flex:1}}>
              <div style={S.label}>Correo electrónico</div>
              <input style={S.input} type="email" value={email} onChange={e=>{setEmail(e.target.value);reset();}} onFocus={()=>setFocusField('email')} onBlur={()=>setFocusField(null)} placeholder="tucorreo@email.com"/>
              {email&&emailValido===false&&<div style={{fontSize:12,color:'#FF3B30',marginTop:4}}>Correo electrónico inválido</div>}
              {email&&emailValido===true&&<div style={{fontSize:12,color:'#2DB54E',marginTop:4}}>✓ Correo válido</div>}
            </div>
          </div>

          {modo!=='recuperar'&&(
            <div style={{...S.rowLast,borderBottom:focusField==='password'?'2px solid #2DB54E':'none'}}>
              <div style={{...S.icon,color:passwordFuerte?getPasswordStrengthColor():'#86868b'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm3 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>
              </div>
              <div style={{flex:1}}>
                <div style={S.label}>Contraseña</div>
                <input style={S.input} type="password" value={password} onChange={e=>{setPassword(e.target.value);reset();}} onFocus={()=>setFocusField('password')} onBlur={()=>setFocusField(null)} placeholder="••••••••"/>
                {password&&modo==='registro'&&(
                  <div style={{display:'flex',alignItems:'center',gap:6,marginTop:6}}>
                    <div style={{width:60,height:3,borderRadius:2,background:getPasswordStrengthColor(),opacity:passwordFuerte==='fuerte'?1:passwordFuerte==='medio'?0.7:0.4}}></div>
                    <div style={{width:60,height:3,borderRadius:2,background:getPasswordStrengthColor(),opacity:passwordFuerte==='medio'?0.7:passwordFuerte==='fuerte'?1:0.4}}></div>
                    <div style={{width:60,height:3,borderRadius:2,background:getPasswordStrengthColor(),opacity:passwordFuerte==='debil'?0.4:1}}></div>
                    <span style={{fontSize:12,color:getPasswordStrengthColor(),fontWeight:500}}>{getPasswordStrengthText()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <button style={{...S.btn,...(cargando?S.btnLoading:{})}} onClick={modo==='login'?handleLogin:modo==='registro'?handleRegistro:handleRecuperar} disabled={cargando}>
          {cargando?(
            <><div style={S.loadingSpinner}></div>{modo==='login'&&'Iniciando sesión...'}{modo==='registro'&&'Creando cuenta...'}{modo==='recuperar'&&'Enviando enlace...'}</>
          ):(
            <>{modo==='login'&&'Iniciar sesión'}{modo==='registro'&&'Crear cuenta'}{modo==='recuperar'&&'Enviar enlace de recuperación'}</>
          )}
        </button>

        {modo!=='recuperar'&&(
          <>
            <div style={S.divider}>
              <div style={S.divLine}/>
              <span style={S.divText}>o continúa con</span>
              <div style={S.divLine}/>
            </div>
            <button style={S.btnGoogle} onClick={handleGoogle} disabled={cargando}>
              <svg width="20" height="20" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </button>
          </>
        )}

        <div style={S.footer}>
          {modo==='login'&&(
            <>
              <div style={S.link} onClick={()=>cambiarModo('recuperar')}>¿Olvidaste tu contraseña?</div>
              <div style={{margin:'8px 0'}}>¿No tienes cuenta? <span style={S.link} onClick={()=>cambiarModo('registro')}>Regístrate</span></div>
            </>
          )}
          {modo==='registro'&&(
            <div>¿Ya tienes cuenta? <span style={S.link} onClick={()=>cambiarModo('login')}>Inicia sesión</span></div>
          )}
          {modo==='recuperar'&&(
            <div style={S.link} onClick={()=>cambiarModo('login')}>← Volver al inicio</div>
          )}
        </div>
      </div>
    </div>
  );
}