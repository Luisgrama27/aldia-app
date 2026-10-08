import { useState, useEffect, useRef } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, writeBatch, getDocs, limit, setDoc } from "firebase/firestore";
import emailjs from "@emailjs/browser";
import Login from "./Login";
import Scanner from "./Scanner";
import { recordarProducto } from "./productos";
import { sugerirReceta } from "./recetas";
import "./index.css";

const EMAILJS_SERVICE = "service_vi35bf4";
const EMAILJS_TEMPLATE = "template_ndvpdby";
const EMAILJS_KEY = "rt3CGRFqu1i6H69tO";

const APP_VERSION = "1.0.0";
// Cambia estos datos por los reales de tu soporte (el WhatsApp va con código de país, sin + ni espacios: 573001234567)
const SOPORTE_EMAIL = "soporte@aldia.com";
const SOPORTE_WHATSAPP = "";
const FECHA_LEGAL = "6 de octubre de 2026";

// Tema: "auto" sigue al teléfono; "claro" y "oscuro" lo fuerzan
const TEMA_KEY = "tema_app";
function aplicarTema(t){
  const el = document.documentElement;
  if(t==='claro'||t==='oscuro') el.dataset.tema = t;
  else delete el.dataset.tema;
}
try{ aplicarTema(localStorage.getItem(TEMA_KEY)||'auto'); }catch(e){}

const CATS = [
  'Lácteos','Carnes','Pescados y mariscos','Frutas y verduras','Granos y cereales',
  'Panadería y repostería','Congelados','Enlatados','Salsas y condimentos','Snacks y dulces',
  'Bebidas','Medicamentos','Cuidado personal','Limpieza','Bebé','Mascotas','Otro'
];

function getSaludo(){
  const h = new Date().getHours();
  if(h<12) return 'Buenos días';
  if(h<18) return 'Buenas tardes';
  return 'Buenas noches';
}

function daysUntil(dateStr){
  const d = new Date(dateStr+'T12:00:00');
  d.setHours(0,0,0,0);
  const hoy = new Date();
  hoy.setHours(0,0,0,0);
  return Math.round((d-hoy)/86400000);
}

function fechaEn(n){
  const d = new Date();
  d.setDate(d.getDate()+n);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function fechaEnMeses(n){
  const d = new Date();
  const dia = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth()+n);
  d.setDate(Math.min(dia, new Date(d.getFullYear(), d.getMonth()+1, 0).getDate()));
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// Días de anticipación sugeridos según lo que dura cada tipo de producto
const ALERTAS_CAT = {
  'Lácteos':7,'Carnes':3,'Pescados y mariscos':3,'Frutas y verduras':7,'Granos y cereales':30,
  'Panadería y repostería':7,'Congelados':30,'Enlatados':30,'Salsas y condimentos':14,'Snacks y dulces':14,
  'Bebidas':14,'Medicamentos':30,'Cuidado personal':30,'Limpieza':30,'Bebé':14,'Mascotas':14
};
const OPCIONES_ALERTA = [3,7,14,30];
// La categoría "Otro" usa el valor general que ya tenía la persona
const alertaDe = (cat, prefs) => prefs.alertasCat?.[cat] ?? (cat === 'Otro' ? prefs.alertaDefecto : (ALERTAS_CAT[cat] ?? prefs.alertaDefecto));

function status(p){
  const d = daysUntil(p.exp);
  if(d<0) return 'expired';
  if(d<=3) return 'danger';
  if(d<=p.alert) return 'warn';
  return 'ok';
}

function daysLabel(d){
  if(d<0) return 'Vencido';
  if(d===0) return 'Hoy';
  if(d===1) return 'Mañana';
  return `${d} días`;
}

function getBarWidth(days,alert){
  if(days<0) return 100;
  if(days===0) return 95;
  if(days<=3) return 75;
  if(days<=alert) return 45;
  if(days<=30) return 20;
  return 8;
}

const pillClass = st => st==='ok' ? 'ad-pill--ok' : st==='warn' ? 'ad-pill--warn' : 'ad-pill--danger';
const pillIcon = st => st==='expired' ? '⚠️' : st==='danger' ? '⏰' : st==='warn' ? '⏳' : '✓';
const barClass = st => st==='ok' ? '' : st==='warn' ? 'ad-bar--warn' : 'ad-bar--danger';

const svgProps = {width:24,height:24,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true};
const Ico = {
  home:(<svg {...svgProps}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>),
  stats:(<svg {...svgProps}><path d="M5 21V12M12 21V4M19 21v-6"/></svg>),
  history:(<svg {...svgProps}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>),
  user:(<svg {...svgProps}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>),
  plus:(<svg {...svgProps} width={28} height={28} strokeWidth={2.6}><path d="M12 5v14M5 12h14"/></svg>),
};

const BellIcon=()=>(
  <svg {...svgProps} width="22" height="22"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
);

const LOGO=()=>(
  <div className="ad-logo">
    <svg width="30" height="30" viewBox="0 0 80 80" aria-hidden="true">
      <path d="M40 14 C40 14 56 25 56 38 C56 50 48 58 40 61 C32 58 24 50 24 38 C24 25 40 14 40 14Z" fill="none" stroke="var(--green)" strokeWidth="4" strokeLinecap="round"/>
      <polyline points="32,38 38,44 49,31" fill="none" stroke="var(--green)" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);

function Navbar({tab,cuenta,foto,onTab,onAdd,onCuenta}){
  const item=(id,lbl,ico,active,onClick)=>(
    <button key={id} className={`ad-nav__item${active?' is-active':''}`} onClick={onClick} aria-current={active?'page':undefined}>
      <span style={{display:'flex'}}>{ico}</span>
      <span>{lbl}</span>
    </button>
  );
  return (
    <nav className="ad-card ad-nav" aria-label="Navegación principal">
      {item('home','Inicio',Ico.home,tab==='home'&&!cuenta,()=>onTab('home'))}
      {item('estadisticas','Estadísticas',Ico.stats,tab==='estadisticas'&&!cuenta,()=>onTab('estadisticas'))}
      <button className="ad-nav__fab" onClick={onAdd} aria-label="Agregar producto">
        <span className="ad-nav__fab-btn">{Ico.plus}</span>Agregar
      </button>
      {item('historial','Historial',Ico.history,tab==='historial'&&!cuenta,()=>onTab('historial'))}
      {item('cuenta','Cuenta',foto?<img className="ad-nav__foto" src={foto} alt=""/>:Ico.user,cuenta,onCuenta)}
    </nav>
  );
}

// Recorta la foto al centro (cuadrada), la reduce a 256 px y la convierte a JPEG liviano (~20 KB)
function redimensionarFoto(archivo,lado=256){
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(archivo);
    const img=new Image();
    img.onload=()=>{
      const min=Math.min(img.width,img.height);
      const canvas=document.createElement('canvas');
      canvas.width=lado;canvas.height=lado;
      canvas.getContext('2d').drawImage(img,(img.width-min)/2,(img.height-min)/2,min,min,0,0,lado,lado);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg',0.8));
    };
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('imagen'));};
    img.src=url;
  });
}

const TITULOS = {perfil:'Editar perfil',prefs:'Preferencias',config:'Configuración',faq:'Ayuda y FAQ',contacto:'Contacto y soporte',legal:'Términos y privacidad',version:'Versión'};
const PADRE = {perfil:'menu',prefs:'menu',config:'menu',faq:'config',contacto:'config',legal:'config',version:'config'};

function PerfilVista({usuario,nombre,iniciales,foto,fotoPropia,onNombre}){
  const [valor,setValor]=useState(nombre);
  const [guardando,setGuardando]=useState(false);
  const [procesando,setProcesando]=useState(false);
  const [msg,setMsg]=useState('');
  const [err,setErr]=useState('');
  const conClave=(usuario.providerData||[]).some(p=>p.providerId==='password');

  const fallaFoto=(e)=>{
    console.error(e);
    setErr(`No se pudo guardar la foto${e&&e.code?` (${e.code})`:''}.`);
    setMsg('');
  };

  const elegirFoto=async(e)=>{
    const archivo=e.target.files&&e.target.files[0];
    e.target.value='';
    if(!archivo)return;
    if(!archivo.type.startsWith('image/')){setErr('Elige un archivo de imagen.');setMsg('');return;}
    setProcesando(true);setErr('');setMsg('');
    try{
      const data=await redimensionarFoto(archivo);
      setDoc(doc(db,"perfiles",usuario.uid),{foto:data,actualizado:new Date().toISOString()},{merge:true}).catch(fallaFoto);
      setMsg('Foto actualizada.');
    }catch(er){
      console.error(er);
      setErr('No se pudo leer la imagen. Prueba con otra foto.');
    }
    setProcesando(false);
  };

  const quitarFoto=()=>{
    setErr('');
    setDoc(doc(db,"perfiles",usuario.uid),{foto:'',actualizado:new Date().toISOString()},{merge:true}).catch(fallaFoto);
    setMsg('Foto eliminada.');
  };

  const guardarNombre=async()=>{
    const limpio=valor.trim();
    if(!limpio){setErr('Escribe tu nombre.');setMsg('');return;}
    setGuardando(true);setErr('');setMsg('');
    try{
      await updateProfile(auth.currentUser,{displayName:limpio});
      onNombre(limpio);
      setMsg('Nombre actualizado.');
    }catch(e){console.error(e);setErr('No se pudo actualizar el nombre. Inténtalo de nuevo.');}
    setGuardando(false);
  };

  const enviarEnlace=async()=>{
    setGuardando(true);setErr('');setMsg('');
    try{
      await sendPasswordResetEmail(auth,usuario.email);
      setMsg('Te enviamos un enlace a tu correo para cambiar la contraseña. Revisa también la carpeta de spam.');
    }catch(e){console.error(e);setErr('No se pudo enviar el enlace. Inténtalo de nuevo.');}
    setGuardando(false);
  };

  return (
    <>
      {err&&<div className="ad-note ad-note--danger" role="alert" style={{marginBottom:10}}>⚠️ {err}</div>}
      {msg&&<div className="ad-note" style={{marginBottom:10}}>✓ {msg}</div>}
      <div style={{textAlign:'center',marginBottom:14}}>
        {foto?<img className="ad-foto" src={foto} alt="Tu foto de perfil"/>:<div className="ad-foto">{iniciales}</div>}
        <label className="ad-btn ad-btn--ghost ad-btn--sm" style={{width:'auto',display:'inline-flex',padding:'0 18px',opacity:procesando?0.7:1}}>
          {procesando?'Procesando...':'Cambiar foto'}
          <input type="file" accept="image/*" onChange={elegirFoto} disabled={procesando} style={{display:'none'}}/>
        </label>
        {fotoPropia&&<div><button className="ad-link ad-link--danger" onClick={quitarFoto}>Quitar foto</button></div>}
      </div>
      <div className="ad-card" style={{overflow:'hidden',marginBottom:12}}>
        <label className="ad-field"><span className="ad-field__label">Nombre</span>
          <input value={valor} onChange={e=>setValor(e.target.value)} placeholder="Tu nombre" autoComplete="name"/>
        </label>
        <div className="ad-field"><span className="ad-field__label">Correo electrónico</span>
          <div style={{padding:'6px 0',color:'var(--text2)',wordBreak:'break-all'}}>{usuario.email}</div>
        </div>
      </div>
      <button className="ad-btn" onClick={guardarNombre} disabled={guardando} style={{opacity:guardando?0.7:1}}>{guardando?'Guardando...':'Guardar cambios'}</button>
      <h3 className="ad-section" style={{margin:'20px 0 8px'}}>Contraseña</h3>
      {conClave?(
        <>
          <p className="ad-muted" style={{marginBottom:10,lineHeight:1.5}}>Te enviaremos un enlace a tu correo para elegir una contraseña nueva.</p>
          <button className="ad-btn ad-btn--ghost" onClick={enviarEnlace} disabled={guardando}>Enviar enlace para cambiarla</button>
        </>
      ):(
        <p className="ad-muted" style={{lineHeight:1.5}}>Iniciaste sesión con Google, así que tu contraseña se gestiona desde tu cuenta de Google.</p>
      )}
    </>
  );
}

function PrefsVista({prefs,onPrefs,onAplicar,numActivos}){
  const [abierto,setAbierto]=useState(false);
  const [tema,setTema]=useState(()=>{try{return localStorage.getItem(TEMA_KEY)||'auto';}catch(e){return 'auto';}});
  const cambiarTema=(t)=>{setTema(t);aplicarTema(t);try{localStorage.setItem(TEMA_KEY,t);}catch(e){}};
  return (
    <>
      <h3 className="ad-section" style={{margin:'4px 0 8px'}}>Avisos</h3>
      <div className="ad-card" style={{overflow:'hidden',marginBottom:8}}>
        <button className="ad-sheet__row" style={{padding:'0 14px',borderTop:0}} onClick={()=>setAbierto(!abierto)} aria-expanded={abierto}>
          Días de alerta por categoría
          <span style={{marginLeft:'auto',color:'var(--text2)',fontSize:'.875rem'}}>{abierto?'Ocultar':'Editar'}</span>
        </button>
        {abierto&&(
          <>
            {CATS.map(c=>(
              <div className="ad-row" key={c}>
                <span>{c}</span>
                <select className="ad-select-sm" aria-label={`Días de alerta para ${c}`} value={alertaDe(c,prefs)}
                  onChange={e=>{const n=parseInt(e.target.value);onPrefs(c==='Otro'?{alertaDefecto:n}:{alertasCat:{...(prefs.alertasCat||{}),[c]:n}});}}>
                  {OPCIONES_ALERTA.map(n=><option key={n} value={n}>{n} días</option>)}
                </select>
              </div>
            ))}
            <div className="ad-row">
              <button className="ad-link" onClick={()=>onPrefs({alertasCat:{},alertaDefecto:7})}>Restablecer sugeridos</button>
              <button className="ad-link" onClick={onAplicar}>Aplicar a mis {numActivos} productos</button>
            </div>
          </>
        )}
        <div className="ad-row">
          <span>Resumen por correo</span>
          <button className="ad-toggle" role="switch" aria-checked={prefs.correo} aria-label="Resumen por correo" onClick={()=>onPrefs({correo:!prefs.correo})}/>
        </div>
      </div>
      <p className="ad-muted" style={{marginBottom:16,lineHeight:1.5}}>Cada categoría tiene sus días de alerta sugeridos: la carne avisa más cerca de la fecha y los enlatados con más tiempo. Se aplican a los productos nuevos. Si activas el resumen por correo, te enviamos la lista una vez al día al abrir la app con productos vencidos o por vencer.</p>
      <h3 className="ad-section" style={{margin:'4px 0 8px'}}>Apariencia</h3>
      <div className="ad-chips">
        {[['auto','Automático'],['claro','Claro'],['oscuro','Oscuro']].map(([id,lbl])=>(
          <button key={id} className="ad-chip" aria-pressed={tema===id} onClick={()=>cambiarTema(id)}>{lbl}</button>
        ))}
      </div>
      <p className="ad-muted" style={{marginTop:10}}>Automático usa el modo claro u oscuro de tu teléfono.</p>
    </>
  );
}

const FAQ = [
  {q:'¿Cómo agrego un producto?',a:'Toca el botón verde "+" de la barra inferior. Escribe el nombre, elige la categoría y la fecha de vencimiento (son obligatorios) y toca Guardar. Si quieres, también puedes registrar cantidad, precio y con cuántos días de anticipación quieres la alerta.'},
  {q:'¿Qué significan los colores y etiquetas?',a:'Vencido y Urgente (3 días o menos) se muestran en rojo. Por vencer, que es cuando entra en el periodo de alerta que elegiste, va en amarillo. Al día, cuando aún falta tiempo, va en verde.'},
  {q:'¿Cuándo me avisa la app?',a:'La alerta depende de la categoría (por ejemplo, la carne avisa más cerca de la fecha y los enlatados con más tiempo) y puedes cambiarla en Cuenta, Preferencias, o en cada producto. Al abrir la app, la tarjeta "Atención hoy" te muestra el producto más urgente. Si tienes activado el resumen por correo, también te enviamos la lista de productos vencidos o por vencer.'},
  {q:'¿Cómo funcionan las recetas sugeridas?',a:'Cuando tienes productos por vencer (que aún no han vencido), en Inicio te proponemos una receta que los aproveche. Si hay varios, buscamos una receta que use la mayor cantidad posible. Si no hay nada por vencer, verás el mensaje "Todo al día". No se sugieren recetas con productos ya vencidos, medicamentos ni productos de limpieza.'},
  {q:'¿Qué hacen "Ya la usé" y "Botar"?',a:'Mueven el producto al Historial como consumido o descartado. Con eso se calculan tus estadísticas.'},
  {q:'¿Cómo recupero un producto del historial?',a:'Entra a Historial y toca Restaurar en el producto. Vuelve a tu lista de Inicio.'},
  {q:'¿Cómo funciona la meta de desperdicio?',a:'En Estadísticas toca Editar en "Tu meta de desperdicio" y escribe cuánto dinero como máximo quieres perder cada mes. La app lo compara con el valor de los productos que descartaste ese mes, usando los precios que registraste.'},
  {q:'¿Puedo compartir mi lista?',a:'Sí. En Inicio toca Compartir y crea un enlace. Quien lo reciba verá tu lista dentro de Al Día sin necesitar cuenta y podrá descargar la app. El enlace vence a los 7 días y puedes desactivarlo cuando quieras.'},
  {q:'¿Mis datos son privados?',a:'Sí. Cada cuenta solo puede ver y modificar sus propios productos.'},
  {q:'¿Cómo cambio mi contraseña?',a:'Entra a Cuenta, luego Editar perfil, y toca "Enviar enlace para cambiarla". Te llegará un correo con el enlace. Si iniciaste sesión con Google, la contraseña se cambia desde tu cuenta de Google.'},
];

function FaqVista(){
  return (
    <div>
      {FAQ.map(f=>(
        <details key={f.q} className="ad-faq">
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  );
}

function ContactoVista({usuario}){
  const cuerpo=encodeURIComponent(`\n\n---\nUsuario: ${usuario.email}\nVersión: ${APP_VERSION}`);
  const wa=SOPORTE_WHATSAPP?`https://wa.me/${SOPORTE_WHATSAPP}?text=${encodeURIComponent('Hola, necesito ayuda con Al Día.')}`:'';
  return (
    <>
      <p className="ad-muted" style={{marginBottom:14,lineHeight:1.5}}>¿Tienes una duda, una sugerencia o encontraste un problema? Escríbenos y te respondemos lo antes posible.</p>
      <a className="ad-btn" href={`mailto:${SOPORTE_EMAIL}?subject=${encodeURIComponent('Soporte Al Día')}&body=${cuerpo}`}>Escribir por correo</a>
      {wa&&<a className="ad-btn ad-btn--ghost" href={wa} target="_blank" rel="noopener noreferrer">Escribir por WhatsApp</a>}
      <a className="ad-btn ad-btn--ghost" href={`mailto:${SOPORTE_EMAIL}?subject=${encodeURIComponent('Reporte de problema - Al Día')}&body=${cuerpo}`}>Reportar un problema</a>
      <p className="ad-muted" style={{marginTop:14}}>Correo de soporte: {SOPORTE_EMAIL}</p>
    </>
  );
}

function LegalVista(){
  const h={margin:'18px 0 6px'};
  const p={color:'var(--text2)',lineHeight:1.55,fontSize:'0.9375rem',marginBottom:8};
  return (
    <div>
      <p className="ad-muted">Última actualización: {FECHA_LEGAL}</p>

      <h3 className="ad-section" style={h}>Términos de uso</h3>
      <p style={p}><strong>1. Qué es Al Día.</strong> Es una aplicación para registrar los productos de tu hogar y recibir avisos antes de que venzan.</p>
      <p style={p}><strong>2. Uso informativo.</strong> Los avisos se calculan con las fechas que tú registras. Al Día no reemplaza tu criterio: revisa siempre el estado del producto y la etiqueta del empaque antes de consumirlo, sobre todo alimentos y medicamentos. No nos hacemos responsables por decisiones tomadas únicamente con la información registrada.</p>
      <p style={p}><strong>3. Tu cuenta.</strong> Eres responsable de tu contraseña y de la información que registras.</p>
      <p style={p}><strong>4. Uso adecuado.</strong> No uses la app con fines ilícitos ni intentes acceder a datos de otras personas.</p>
      <p style={p}><strong>5. Disponibilidad.</strong> La app se ofrece tal como está y puede tener interrupciones o cambios.</p>
      <p style={p}><strong>6. Cambios.</strong> Podemos actualizar estos términos y te avisaremos dentro de la app.</p>

      <h3 className="ad-section" style={h}>Política de privacidad</h3>
      <p style={p}><strong>Qué datos guardamos.</strong> Tu nombre, tu correo, la foto de perfil de Google si inicias sesión con Google, y los productos que registras (nombre, categoría, fecha de vencimiento, cantidad, precio y estado). Si usas la opción Compartir, guardamos además una copia de solo lectura de tu lista (nombre, categoría, fecha y cantidad de cada producto, y tu nombre) durante 7 días.</p>
      <p style={p}><strong>Para qué los usamos.</strong> Para mostrar tu lista, enviarte avisos y calcular tus estadísticas.</p>
      <p style={p}><strong>Dónde se guardan.</strong> Usamos Firebase (Google) para el inicio de sesión y la base de datos, y EmailJS para enviar los correos de bienvenida y de aviso. Tu meta de desperdicio, tus preferencias y el tema se guardan solo en tu dispositivo.</p>
      <p style={p}><strong>Con quién los compartimos.</strong> No vendemos tus datos. Solo los compartimos con los proveedores anteriores, que son necesarios para que la app funcione. La lista que compartes con el botón Compartir queda como una copia de solo lectura que cualquier persona con el enlace puede ver durante 7 días; puedes desactivarla cuando quieras. Lo que envías por WhatsApp o correo lo decides tú.</p>
      <p style={p}><strong>Tus derechos.</strong> Puedes pedir conocer, actualizar, corregir o eliminar tus datos personales, según la Ley 1581 de 2012 de Colombia. Escríbenos a {SOPORTE_EMAIL}.</p>
      <p style={p}><strong>Seguridad.</strong> Cada cuenta solo puede acceder a sus propios productos. Las listas compartidas solo se abren con su enlace, que es único y difícil de adivinar.</p>
    </div>
  );
}

function DiagnosticoPantalla(){
  const [datos,setDatos]=useState(null);
  const medir=()=>{
    const alto=(css)=>{
      const el=document.createElement('div');
      el.style.cssText=`position:fixed;left:0;top:0;width:1px;visibility:hidden;pointer-events:none;${css}`;
      document.body.appendChild(el);
      const h=Math.round(el.getBoundingClientRect().height);
      document.body.removeChild(el);
      return h;
    };
    const zona=(lado)=>{
      const el=document.createElement('div');
      el.style.cssText=`position:fixed;visibility:hidden;pointer-events:none;padding-${lado}:env(safe-area-inset-${lado},0px)`;
      document.body.appendChild(el);
      const v=getComputedStyle(el)[lado==='top'?'paddingTop':'paddingBottom'];
      document.body.removeChild(el);
      return v;
    };
    const nav=document.querySelector('.ad-nav');
    const root=document.getElementById('root');
    const vv=window.visualViewport;
    setDatos([
      ['App instalada',(window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone)?'sí':'no'],
      ['screen (ancho x alto)',`${window.screen.width} x ${window.screen.height}`],
      ['window.innerHeight',window.innerHeight],
      ['visualViewport.height',vv?Math.round(vv.height):'-'],
      ['clientHeight',document.documentElement.clientHeight],
      ['100vh',alto('height:100vh')],
      ['100dvh',alto('height:100dvh')],
      ['100svh',alto('height:100svh')],
      ['100lvh',alto('height:100lvh')],
      ['Zona segura arriba',zona('top')],
      ['Zona segura abajo',zona('bottom')],
      ['Alto de #root',root?Math.round(root.getBoundingClientRect().height):'-'],
      ['Borde inferior de la barra',nav?Math.round(nav.getBoundingClientRect().bottom):'-'],
    ]);
  };
  return (
    <div style={{textAlign:'left'}}>
      <button className="ad-btn ad-btn--ghost ad-btn--sm" onClick={medir}>Medir pantalla</button>
      {datos&&(
        <div className="ad-card" style={{marginTop:10,overflow:'hidden'}}>
          {datos.map(([k,v])=>(
            <div key={k} className="ad-row" style={{minHeight:40,padding:'8px 14px',fontSize:'0.875rem'}}>
              <span className="ad-muted">{k}</span><strong>{String(v)}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VersionVista(){
  const [actualizando,setActualizando]=useState(false);
  const actualizar=async()=>{
    setActualizando(true);
    try{
      if('serviceWorker' in navigator){
        const regs=await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r=>r.update()));
      }
      if(window.caches){
        const keys=await caches.keys();
        await Promise.all(keys.map(k=>caches.delete(k)));
      }
    }catch(e){console.error(e);}
    window.location.reload();
  };
  return (
    <div style={{textAlign:'center',padding:'8px 0'}}>
      <h3 className="ad-section" style={{margin:'6px 0 2px'}}>Al Día</h3>
      <p className="ad-muted">Versión {APP_VERSION}</p>
      <p className="ad-muted" style={{margin:'14px 0 18px',lineHeight:1.5}}>Controla los vencimientos de tus productos del hogar y reduce el desperdicio.</p>
      <button className="ad-btn ad-btn--ghost" onClick={actualizar} disabled={actualizando}>{actualizando?'Actualizando...':'Buscar actualización'}</button>
      <p className="ad-muted" style={{marginTop:10,lineHeight:1.5}}>Si no ves los últimos cambios, toca aquí para recargar la app.</p>
      <h3 className="ad-section" style={{margin:'22px 0 8px',textAlign:'left'}}>Diagnóstico de pantalla</h3>
      <DiagnosticoPantalla/>
    </div>
  );
}

function CuentaSheet({usuario,nombre,iniciales,foto,fotoPropia,prefs,onPrefs,onAplicarAlertas,numActivos,onNombre,onClose,onLogout}){
  const [vista,setVista]=useState('menu');
  const principal=[
    {t:'Editar perfil',to:'perfil'},
    {t:'Preferencias',to:'prefs'},
    {t:'Configuración',to:'config'},
  ];
  const config=[
    {t:'Ayuda y FAQ',to:'faq'},
    {t:'Contacto y soporte',to:'contacto'},
    {t:'Términos y privacidad',to:'legal'},
    {t:'Versión',to:'version'},
  ];
  const lista=vista==='menu'?principal:vista==='config'?config:null;
  return (
    <div className="ad-overlay" onClick={onClose}>
      <div className="ad-sheet" onClick={e=>e.stopPropagation()} role="dialog" aria-label={TITULOS[vista]||'Cuenta'}>
        <div className="ad-sheet__handle"/>
        {vista==='menu'?(
          <div className="ad-profile">
            <div className="ad-avatar ad-avatar--solid">
              {foto?<img src={foto} alt="perfil"/>:iniciales}
            </div>
            <div style={{minWidth:0}}>
              <div className="ad-profile__name">{nombre}</div>
              <div className="ad-muted" style={{wordBreak:'break-all'}}>{usuario.email}</div>
            </div>
          </div>
        ):(
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <button className="ad-link" onClick={()=>setVista(PADRE[vista])}>← Volver</button>
            <h2 className="ad-section" style={{margin:0}}>{TITULOS[vista]}</h2>
          </div>
        )}
        {lista&&(
          <>
            <p className="ad-eyebrow">{vista==='menu'?'Cuenta':'Ayuda y legal'}</p>
            <div className="ad-card ad-group">
              {lista.map(f=>(
                <button key={f.t} className="ad-sheet__row" onClick={()=>setVista(f.to)}>
                  {f.t}
                  <span style={{marginLeft:'auto',color:'var(--text2)',fontSize:'1.25rem'}}>›</span>
                </button>
              ))}
            </div>
          </>
        )}
        {vista==='menu'&&(
          <button className="ad-btn ad-btn--danger" onClick={onLogout}>Cerrar sesión</button>
        )}
        {vista==='perfil'&&<PerfilVista usuario={usuario} nombre={nombre} iniciales={iniciales} foto={foto} fotoPropia={fotoPropia} onNombre={onNombre}/>}
        {vista==='prefs'&&<PrefsVista prefs={prefs} onPrefs={onPrefs} onAplicar={onAplicarAlertas} numActivos={numActivos}/>}
        {vista==='faq'&&<FaqVista/>}
        {vista==='contacto'&&<ContactoVista usuario={usuario}/>}
        {vista==='legal'&&<LegalVista/>}
        {vista==='version'&&<VersionVista/>}
      </div>
    </div>
  );
}

function EmptyStateNuevo({onAgregar,onCategoria,onAgregarEjemplo}){
  const ejemplos=[
    {name:'Leche entera',cat:'Lácteos',exp:fechaEn(5)},
    {name:'Pollo fresco',cat:'Carnes',exp:fechaEn(2)},
    {name:'Zanahorias',cat:'Frutas y verduras',exp:fechaEn(12)},
    {name:'Ibuprofeno',cat:'Medicamentos',exp:fechaEn(400)},
    {name:'Jugo natural',cat:'Bebidas',exp:fechaEn(8)},
  ];
  return (
    <div className="ad-empty">
      <h2>¡Bienvenido a Al Día!</h2>
      <p className="ad-muted" style={{maxWidth:280,lineHeight:1.6}}>Empieza registrando tus productos y nunca más se te vencerá nada en casa.</p>
      <div style={{width:'100%',display:'flex',flexDirection:'column',gap:8}}>
        {[{n:'1',title:'Agrega un producto',sub:'con su fecha de vencimiento'},{n:'2',title:'Recibe alertas',sub:'antes de que venza'},{n:'3',title:'Márcalo como usado',sub:'y lleva el control'}].map(s=>(
          <div key={s.n} className="ad-card ad-step">
            <div className="ad-step__n">{s.n}</div>
            <div><div style={{fontWeight:700}}>{s.title}</div><div className="ad-muted">{s.sub}</div></div>
          </div>
        ))}
      </div>
      <button className="ad-btn" onClick={onAgregar}>Agregar mi primer producto</button>
      <div style={{width:'100%'}}>
        <p className="ad-muted" style={{textAlign:'center',fontWeight:700,marginBottom:10}}>O prueba con estos ejemplos</p>
        <div className="ad-grid2">
          {ejemplos.map((ej,i)=>(
            <div key={i} className="ad-card ad-pad" style={{padding:12}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                <div style={{minWidth:0}}>
                  <div className="ad-item__name" style={{fontSize:'.9375rem'}}>{ej.name}</div>
                  <div className="ad-muted" style={{fontSize:'.75rem'}}>{ej.cat}</div>
                </div>
              </div>
              <button className="ad-btn ad-btn--sm" onClick={()=>onAgregarEjemplo(ej)}>+ Agregar</button>
            </div>
          ))}
        </div>
      </div>
      <div style={{width:'100%'}}>
        <p className="ad-muted" style={{textAlign:'center',marginBottom:10}}>O empieza por categoría</p>
        <div className="ad-grid2">
          {[{cat:'Lácteos',emoji:'🥛'},{cat:'Carnes',emoji:'🥩'},{cat:'Medicamentos',emoji:'💊'},{cat:'Bebidas',emoji:'🧃'}].map(c=>(
            <button key={c.cat} className="ad-chip" style={{justifyContent:'center',gap:6}} onClick={()=>onCategoria(c.cat)}>{c.emoji} {c.cat}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyStateExistente({onAgregar,catsUsadas}){
  return (
    <div className="ad-empty">
      <h2>Sin productos registrados</h2>
      <p className="ad-muted" style={{maxWidth:280,lineHeight:1.6}}>No tienes ningún producto en tu lista en este momento.</p>
      {catsUsadas.length>0&&(
        <div className="ad-card ad-pad" style={{width:'100%'}}>
          <p className="ad-muted" style={{fontWeight:700,marginBottom:10}}>Últimas categorías usadas</p>
          <div className="ad-grid2">
            {catsUsadas.slice(0,4).map(cat=>(
              <div key={cat} className="ad-chip" style={{justifyContent:'center',gap:6}}>{cat}</div>
            ))}
          </div>
        </div>
      )}
      <button className="ad-btn" onClick={onAgregar}>Agregar producto</button>
    </div>
  );
}

// Crea una copia de solo lectura de la lista y devuelve un enlace que se abre sin cuenta
function nuevoToken(){
  const b=new Uint8Array(12);
  crypto.getRandomValues(b);
  return Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
}

const conTiempo=(promesa,ms)=>Promise.race([promesa,new Promise((_,rechazar)=>setTimeout(()=>rechazar(new Error('tiempo')),ms))]);

function CompartirModal({activos,uid,nombre,onClose}){
  const [fase,setFase]=useState('inicio'); // inicio | creando | listo | error
  const [token,setToken]=useState('');
  const [copiado,setCopiado]=useState(false);
  const url=token?`${window.location.origin}/?c=${token}`:'';
  const mensaje=`${nombre?`${nombre} te compartió`:'Te compartieron'} su lista de vencimientos en Al Día.`;
  const crear=async()=>{
    setFase('creando');
    const t=nuevoToken();
    const ahora=Date.now();
    try{
      await conTiempo(setDoc(doc(db,'compartidos',t),{
        uid,nombre:nombre||'',creadoMs:ahora,venceMs:ahora+7*86400000,
        productos:[...activos].sort((x,y)=>daysUntil(x.exp)-daysUntil(y.exp)).map(p=>({name:p.name,cat:p.cat,exp:p.exp,qty:p.qty||'',alert:p.alert??7})),
      }),10000);
      setToken(t);setFase('listo');
    }catch(e){console.error(e);setFase('error');}
  };
  const desactivar=async()=>{
    try{await deleteDoc(doc(db,'compartidos',token));}catch(e){console.error(e);}
    setToken('');setFase('inicio');
  };
  const copiar=async()=>{try{await navigator.clipboard.writeText(url);setCopiado(true);setTimeout(()=>setCopiado(false),2000);}catch(e){alert('No se pudo copiar.');}};
  const nativo=async()=>{if(navigator.share){try{await navigator.share({title:'Al Día',text:mensaje,url});}catch{ /* compartir cancelado */ }}else copiar();};
  const whatsapp=()=>window.open(`https://wa.me/?text=${encodeURIComponent(`${mensaje} ${url}`)}`,'_blank');
  const correo=()=>window.open(`mailto:?subject=${encodeURIComponent('Mi lista de vencimientos - Al Día')}&body=${encodeURIComponent(`${mensaje}\n\n${url}`)}`,'_blank');
  return (
    <div className="ad-overlay" onClick={onClose}>
      <div className="ad-sheet" onClick={e=>e.stopPropagation()} role="dialog" aria-label="Compartir lista">
        <div className="ad-sheet__handle"/>
        <h2 className="ad-section" style={{margin:'0 0 4px'}}>Compartir lista</h2>
        {fase!=='listo'?(
          <>
            <p className="ad-muted" style={{marginBottom:16}}>Crea un enlace para que otra persona vea tus {activos.length} producto{activos.length!==1?'s':''} dentro de Al Día, sin necesidad de tener cuenta. Es una copia de tu lista de hoy y el enlace vence en 7 días.</p>
            {fase==='error'&&<div className="ad-note ad-note--danger" role="alert" style={{marginBottom:12}}>No se pudo crear el enlace. Revisa tu conexión e inténtalo de nuevo.</div>}
            <button className="ad-btn" onClick={crear} disabled={fase==='creando'||activos.length===0}>{fase==='creando'?'Creando enlace...':'Crear enlace'}</button>
          </>
        ):(
          <>
            <p className="ad-muted" style={{marginBottom:12}}>Tu enlace está listo. Quien lo abra verá tu lista y podrá descargar la app. Vence en 7 días.</p>
            <div className="ad-card ad-pad ad-sharelink">{url}</div>
            <div className="ad-actions">
              <button className="ad-btn" onClick={nativo}>Compartir enlace</button>
              <button className="ad-btn ad-btn--ghost" onClick={whatsapp}>WhatsApp</button>
              <button className="ad-btn ad-btn--ghost" onClick={correo}>Correo</button>
              <button className="ad-btn ad-btn--ghost" onClick={copiar}>{copiado?'¡Copiado!':'Copiar enlace'}</button>
            </div>
            <button className="ad-link" onClick={desactivar}>Desactivar este enlace</button>
          </>
        )}
        <button className="ad-btn ad-btn--ghost" style={{marginTop:12}} onClick={onClose}>{fase==='listo'?'Listo':'Cancelar'}</button>
      </div>
    </div>
  );
}

function SimpleCharts({descartados,consumidos,catStats}){
  const total=Math.max(1,descartados.length+consumidos.length);
  const maxCat=catStats.length?Math.max(...catStats.map(c=>c.descartados||0)):1;
  return (
    <>
      <div className="ad-card ad-pad">
        <p className="ad-muted" style={{marginBottom:10}}>Consumidos vs Descartados</p>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{flex:1,display:'flex',height:14,borderRadius:8,overflow:'hidden',background:'var(--input)'}}>
            <div style={{width:`${Math.round((consumidos.length/total)*100)}%`,background:'var(--green)'}}/>
            <div style={{width:`${Math.round((descartados.length/total)*100)}%`,background:'var(--danger)'}}/>
          </div>
          <span className="ad-muted" style={{minWidth:90,textAlign:'right'}}>{consumidos.length} ✓ / {descartados.length} ✗</span>
        </div>
        <div style={{display:'flex',gap:16,marginTop:10}}>
          <span className="ad-muted" style={{display:'flex',alignItems:'center',gap:6}}><span style={{width:12,height:12,borderRadius:3,background:'var(--green)'}}/>Consumidos</span>
          <span className="ad-muted" style={{display:'flex',alignItems:'center',gap:6}}><span style={{width:12,height:12,borderRadius:3,background:'var(--danger)'}}/>Descartados</span>
        </div>
      </div>
      {catStats.length>0&&(
        <div className="ad-card ad-pad">
          <p className="ad-muted" style={{marginBottom:10}}>Top categorías</p>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {catStats.slice(0,5).map(c=>{
              const pct=maxCat>0?Math.round((c.descartados/maxCat)*100):0;
              return (
                <div key={c.cat} style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:'.875rem',fontWeight:700}}>{c.cat}</span><span className="ad-muted">{c.descartados}</span></div>
                    <div className="ad-bar" style={{marginTop:6}}><span style={{width:`${pct}%`}}/></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function fechaCorta(iso){
  if(!iso)return '';
  return new Date(iso).toLocaleDateString('es-CO',{day:'numeric',month:'short'}).replace('.','');
}

function Donut({consumidos,descartados}){
  const total=consumidos+descartados;
  const r=52;
  const c=2*Math.PI*r;
  const pct=total>0?consumidos/total:0;
  return (
    <div className="ad-card ad-pad">
      <p className="ad-eyebrow">Eficiencia</p>
      <div className="ad-donut">
        <div className="ad-donut__ring">
          <svg width="132" height="132" viewBox="0 0 132 132" role="img" aria-label={total>0?`Eficiencia ${Math.round(pct*100)} por ciento`:'Sin datos de eficiencia'}>
            <circle cx="66" cy="66" r={r} fill="none" stroke={total>0?'var(--danger)':'var(--track)'} strokeWidth="16"/>
            {total>0&&<circle cx="66" cy="66" r={r} fill="none" stroke="var(--green)" strokeWidth="16" strokeDasharray={`${c*pct} ${c}`} transform="rotate(-90 66 66)"/>}
          </svg>
          <div className="ad-donut__pct ad-big">{total>0?`${Math.round(pct*100)}%`:'—'}</div>
        </div>
        <div className="ad-donut__legend">
          <div><span className="ad-stat__n ad-stat__n--ok">{consumidos}</span><span className="ad-stat__l">Consumidos</span></div>
          <div><span className="ad-stat__n ad-stat__n--danger">{descartados}</span><span className="ad-stat__l">Descartados</span></div>
        </div>
      </div>
    </div>
  );
}

function BarrasMensuales({datos,max,anio}){
  return (
    <div className="ad-card ad-pad">
      <p className="ad-eyebrow">Productos por mes ({anio})</p>
      <div style={{display:'flex',alignItems:'flex-end',gap:4,height:120,borderBottom:'1px solid var(--border)'}}>
        {datos.map(m=>(
          <div key={m.lbl} style={{flex:1,height:'100%',display:'flex',alignItems:'flex-end',justifyContent:'center',gap:2}}>
            <div title={`${m.lbl}: ${m.c} consumidos`} style={{width:'44%',height:`${(m.c/max)*100}%`,minHeight:m.c?4:0,background:'var(--green)',borderRadius:'4px 4px 0 0'}}/>
            <div title={`${m.lbl}: ${m.d} descartados`} style={{width:'44%',height:`${(m.d/max)*100}%`,minHeight:m.d?4:0,background:'var(--danger)',borderRadius:'4px 4px 0 0'}}/>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:4,marginTop:6}}>
        {datos.map(m=><span key={m.lbl} className="ad-muted" style={{flex:1,textAlign:'center',fontSize:'0.6875rem'}}>{m.lbl}</span>)}
      </div>
      <div style={{display:'flex',justifyContent:'center',gap:18,marginTop:10,flexWrap:'wrap'}}>
        <span className="ad-muted" style={{display:'flex',alignItems:'center',gap:6}}><span style={{width:12,height:12,borderRadius:3,background:'var(--green)'}}/>Consumidos</span>
        <span className="ad-muted" style={{display:'flex',alignItems:'center',gap:6}}><span style={{width:12,height:12,borderRadius:3,background:'var(--danger)'}}/>Descartados</span>
      </div>
    </div>
  );
}

function RecetaSheet({sug,onClose}){
  const {receta:r,productos,tags}=sug;
  return (
    <div className="ad-overlay" onClick={onClose}>
      <div className="ad-sheet" onClick={e=>e.stopPropagation()} role="dialog" aria-label={r.n}>
        <div className="ad-sheet__handle"/>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
          <div style={{minWidth:0}}>
            <h2 className="ad-section" style={{margin:0}}>{r.n}</h2>
            <p className="ad-muted">{r.min} min · {r.por} {r.por===1?'porción':'porciones'}</p>
          </div>
        </div>
        <div className="ad-note ad-note--warn" style={{margin:'8px 0 4px'}}>Aprovecha lo que está por vencer: {productos.map(p=>p.name).join(', ')}</div>
        <h3 className="ad-section" style={{margin:'14px 0 6px'}}>Ingredientes</h3>
        <div>
          {r.ing.map(([txt,tag])=>{
            const porVencer=!!tag&&tags.includes(tag);
            return (
              <div key={txt} className="ad-ing">
                <span>{porVencer?'✅':'•'}</span>
                <span style={{flex:1}}>{txt}</span>
                {porVencer&&<span className="ad-pill ad-pill--warn">Por vencer</span>}
              </div>
            );
          })}
        </div>
        <h3 className="ad-section" style={{margin:'14px 0 6px'}}>Preparación</h3>
        <ol className="ad-pasos">{r.pasos.map((t,i)=><li key={i}>{t}</li>)}</ol>
        <p className="ad-muted" style={{margin:'12px 0 16px',lineHeight:1.5}}>Antes de cocinar, revisa que los productos estén en buen estado, y cocina bien las carnes, el pollo, el pescado y los huevos.</p>
        <button className="ad-btn" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}

function ProductCard({p,index,onClick,onConsumido,onEliminar}){
  const [visible,setVisible]=useState(false);
  const [barW,setBarW]=useState(0);
  const d=daysUntil(p.exp);const st=status(p);
  // Deslizar: a la derecha deja ver "Consumido", a la izquierda "Eliminar" (se confirma tocando el botón)
  const ANCHO=88;
  const [dx,setDx]=useState(0);
  const [arrastrando,setArrastrando]=useState(false);
  const ini=useRef(null);
  const movio=useRef(false);
  const alBajar=e=>{ini.current={x:e.clientX,y:e.clientY,base:dx};movio.current=false;};
  const alMover=e=>{
    const s=ini.current;if(!s)return;
    const mx=e.clientX-s.x;const my=e.clientY-s.y;
    if(!movio.current){
      if(Math.abs(mx)<8)return;
      if(Math.abs(my)>Math.abs(mx)){ini.current=null;return;}
      movio.current=true;setArrastrando(true);
      if(e.currentTarget.setPointerCapture)e.currentTarget.setPointerCapture(e.pointerId);
    }
    setDx(Math.max(-ANCHO,Math.min(ANCHO,s.base+mx)));
  };
  const ajustar=()=>setDx(v=>v>ANCHO/2?ANCHO:v<-ANCHO/2?-ANCHO:0);
  const alSoltar=()=>{
    const s=ini.current;ini.current=null;setArrastrando(false);
    if(s&&movio.current)ajustar();
  };
  const alCancelar=()=>{ini.current=null;setArrastrando(false);if(movio.current)ajustar();};
  const tocar=()=>{
    if(movio.current){movio.current=false;return;}
    if(dx!==0){setDx(0);return;}
    onClick();
  };
  useEffect(()=>{
    const t1=setTimeout(()=>setVisible(true),index*80);
    const t2=setTimeout(()=>setBarW(getBarWidth(d,p.alert)),index*80+300);
    return()=>{clearTimeout(t1);clearTimeout(t2);};
  },[]);
  return (
    <div className="ad-swipe" style={{opacity:visible?1:0,transform:visible?'translateY(0)':'translateY(14px)',transition:'opacity 0.4s ease, transform 0.4s ease'}}>
    <button type="button" className="ad-swipe__pane ad-swipe__pane--ok" tabIndex={dx>0?0:-1}
      style={{opacity:dx>0?1:0,pointerEvents:dx>0?'auto':'none'}}
      onClick={()=>{setDx(0);onConsumido();}}>Consumido</button>
    <button type="button" className="ad-swipe__pane ad-swipe__pane--del" tabIndex={dx<0?0:-1}
      style={{opacity:dx<0?1:0,pointerEvents:dx<0?'auto':'none'}}
      onClick={()=>{setDx(0);onEliminar();}}>Eliminar</button>
    <div className="ad-card ad-product" role="button" tabIndex={0} onClick={tocar}
      onKeyDown={e=>{if(e.key==='Enter')onClick();}}
      onPointerDown={alBajar} onPointerMove={alMover} onPointerUp={alSoltar} onPointerCancel={alCancelar}
      style={{transform:`translateX(${dx}px)`,transition:arrastrando?'none':'transform 0.2s ease'}}>
      <div className="ad-product__row">
        <span className="ad-product__cat">{p.cat}</span>
        <div className="ad-item__body">
          <div className="ad-item__name">{p.name}</div>
          {(p.qty||p.precio)&&<div className="ad-muted" style={{fontSize:'.8125rem'}}>{[p.qty,p.precio?`$${parseFloat(p.precio).toLocaleString('es-CO')}`:''].filter(Boolean).join(' · ')}</div>}
        </div>
        <span className={`ad-pill ${pillClass(st)}`}>{pillIcon(st)} {daysLabel(d)}</span>
      </div>
      <div className={`ad-bar ${barClass(st)}`}><span style={{width:`${barW}%`,transition:'width 0.8s ease'}}/></div>
    </div>
    </div>
  );
}

export default function App(){
  const [usuario,setUsuario]=useState(null);
  const [cargando,setCargando]=useState(true);
  const [products,setProducts]=useState([]);
  const [esUsuarioNuevo,setEsUsuarioNuevo]=useState(false);
  const [checkingNuevo,setCheckingNuevo]=useState(true);
  const [tab,setTab]=useState('home');
  const [pantalla,setPantalla]=useState('');
  const [filtro,setFiltro]=useState('Todos');
  const [busqueda,setBusqueda]=useState('');
  const [editId,setEditId]=useState(null);
  const [form,setForm]=useState({name:'',cat:'Lácteos',exp:'',qty:'',alert:7,precio:''});
  const [alertaManual,setAlertaManual]=useState(false);
  const [guardando,setGuardando]=useState(false);
  const [correoEnviado,setCorreoEnviado]=useState(false);
  const [menuAbierto,setMenuAbierto]=useState(false);
  const [meta,setMeta]=useState(null);
  const [editandoMeta,setEditandoMeta]=useState(false);
  const [valorMeta,setValorMeta]=useState('');
  const [listKey,setListKey]=useState(0);
  const [scanner,setScanner]=useState(false);
  const [scanMsg,setScanMsg]=useState('');
  const [compartir,setCompartir]=useState(false);
  const [errorMsg,setErrorMsg]=useState('');
  const [nombreExtra,setNombreExtra]=useState('');
  const [fotoPerfil,setFotoPerfil]=useState('');
  const [busquedaHist,setBusquedaHist]=useState('');
  const [verConsumidos,setVerConsumidos]=useState(true);
  const [verDescartados,setVerDescartados]=useState(true);
  const [accionHist,setAccionHist]=useState(null);
  const [accionProd,setAccionProd]=useState(null);
  const [avisos,setAvisos]=useState(false);
  const [selDest,setSelDest]=useState(null);
  const [toast,setToast]=useState(null);
  const toastTimer=useRef(null);
  const [tick,setTick]=useState(0);

  // Vuelve a calcular los días al volver a la app o al pasar la medianoche
  useEffect(()=>{
    const refrescar=()=>setTick(t=>t+1);
    const alVolver=()=>{if(document.visibilityState==='visible')refrescar();};
    document.addEventListener('visibilitychange',alVolver);
    const ahora=new Date();
    const medianoche=new Date(ahora);
    medianoche.setHours(24,0,5,0);
    const id=setTimeout(refrescar,medianoche-ahora);
    return()=>{document.removeEventListener('visibilitychange',alVolver);clearTimeout(id);};
  },[tick]);

  // Aviso inferior con opción de deshacer
  const avisar=(texto,deshacer)=>{
    clearTimeout(toastTimer.current);
    setToast({texto,deshacer});
    toastTimer.current=setTimeout(()=>setToast(null),6000);
  };
  const [recetaAbierta,setRecetaAbierta]=useState(null);
  const [prefs,setPrefs]=useState({alertaDefecto:7,correo:true});
  const correoEnviadoHoy=useRef(false);

  useEffect(()=>{
    const unsub=onAuthStateChanged(auth,(user)=>{
      setUsuario(user);setCargando(false);
      setTimeout(()=>{if(window.__hideSplash)window.__hideSplash();},300);
    });
    return()=>unsub();
  },[]);

  // Verificar si es usuario nuevo directamente desde Firestore
  useEffect(()=>{
    if(!usuario){setCheckingNuevo(false);return;}
    const q=query(collection(db,"productos"),where("uid","==",usuario.uid),limit(1));
    getDocs(q).then(snap=>{
      setEsUsuarioNuevo(snap.empty);
      setCheckingNuevo(false);
    }).catch(()=>{setEsUsuarioNuevo(false);setCheckingNuevo(false);});
  },[usuario]);

  useEffect(()=>{
    if(!usuario)return;
    const q=query(collection(db,"productos"),where("uid","==",usuario.uid));
    const unsub=onSnapshot(q,(snap)=>{
      const prods=snap.docs.map(d=>({id:d.id,...d.data()}));
      setProducts(prods);setListKey(k=>k+1);
      if(prods.length>0) setEsUsuarioNuevo(false);
      let correoActivo=true;
      try{
        const raw=localStorage.getItem(`prefs_${usuario.uid}`);
        if(raw&&JSON.parse(raw).correo===false)correoActivo=false;
      }catch(e){}
      let yaEnviado=false;
      try{yaEnviado=localStorage.getItem(`correo_${usuario.uid}`)===fechaEn(0);}catch{ /* sin almacenamiento */ }
      if(!correoEnviadoHoy.current&&correoActivo&&!yaEnviado){
        const urgentes=prods.filter(p=>!p.estado&&(status(p)==='expired'||status(p)==='danger'||status(p)==='warn'));
        if(urgentes.length>0){
          correoEnviadoHoy.current=true;
          const lista=urgentes.map(p=>`• ${p.name} (${p.cat}) — ${daysLabel(daysUntil(p.exp))}`).join('\n');
          emailjs.send(EMAILJS_SERVICE,EMAILJS_TEMPLATE,{to_email:usuario.email,nombre:usuario.displayName||usuario.email,lista_productos:lista},EMAILJS_KEY)
            .then(()=>{try{localStorage.setItem(`correo_${usuario.uid}`,fechaEn(0));}catch{ /* sin almacenamiento */ }setCorreoEnviado(true);setTimeout(()=>setCorreoEnviado(false),5000);})
            .catch(e=>console.error(e));
        }
      }
    });
    return()=>unsub();
  },[usuario]);

  useEffect(()=>{
    if(!usuario)return;
    const m=localStorage.getItem(`meta_${usuario.uid}`);
    if(m)setMeta(parseFloat(m));
  },[usuario]);

  useEffect(()=>{
    if(!usuario)return;
    try{
      const raw=localStorage.getItem(`prefs_${usuario.uid}`);
      if(raw)setPrefs(p=>({...p,...JSON.parse(raw)}));
    }catch(e){}
  },[usuario]);

  // Foto de perfil guardada en Firestore (colección "perfiles")
  useEffect(()=>{
    if(!usuario){setFotoPerfil('');return;}
    const unsub=onSnapshot(doc(db,"perfiles",usuario.uid),(snap)=>{
      setFotoPerfil(snap.exists()?(snap.data().foto||''):'');
    },(e)=>console.error(e));
    return()=>unsub();
  },[usuario]);

  const guardarMeta=()=>{
    if(!valorMeta||isNaN(valorMeta))return;
    const valor=parseFloat(valorMeta);
    setMeta(valor);localStorage.setItem(`meta_${usuario.uid}`,valor);
    setEditandoMeta(false);setValorMeta('');
  };

  const onScanResult=({nombre,cantidad,categoria,categoriaSegura,barcode,error})=>{
    setScanner(false);
    if(nombre){
      // El código queda guardado con el producto: la próxima vez se reconoce con tus datos
      setForm(f=>({...f,name:nombre,qty:f.qty||cantidad||'',barcode}));
      if(categoria)cambiarCategoria(categoria);
      const partes=[];
      if(cantidad)partes.push(`cantidad ${cantidad}`);
      partes.push(categoria?(categoriaSegura?`categoría ${categoria}`:`categoría sugerida ${categoria}, revísala`):'elige la categoría');
      setScanMsg(`✓ Producto encontrado: ${nombre} (${partes.join(', ')})`);
    }
    else if(error)setScanMsg('No se pudo consultar el producto. Revisa tu conexión o escribe el nombre.');
    else{
      setForm(f=>({...f,barcode}));
      setScanMsg(`Código ${barcode} no encontrado. Escribe el nombre: la próxima vez la app lo recordará.`);
    }
    setTimeout(()=>setScanMsg(''),7000);
  };

  if(cargando||checkingNuevo) return <div style={{width:'100%',height:'100%',background:'var(--bg)'}}/>;
  if(!usuario) return <Login/>;

  const nombre=nombreExtra||usuario.displayName||usuario.email.split('@')[0];
  const nombreCorto=nombre.split(' ')[0];
  const iniciales=nombre.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase().slice(0,2);
  const saludo=getSaludo();
  const foto=fotoPerfil||usuario.photoURL||'';

  const activos=products.filter(p=>!p.estado);
  const historial=products.filter(p=>p.estado==='consumido'||p.estado==='descartado');
  const descartados=products.filter(p=>p.estado==='descartado');
  const consumidos=products.filter(p=>p.estado==='consumido');
  const perdida=descartados.reduce((s,p)=>s+(parseFloat(p.precio)||0),0);
  const ahorro=consumidos.reduce((s,p)=>s+(parseFloat(p.precio)||0),0);
  const catsUsadas=[...new Set(historial.map(p=>p.cat))];
  const todosLosProductos=[...activos,...historial];
  const frecuentesCont={};
  todosLosProductos.forEach(p=>{const key=`${p.name}|||${p.cat}`;frecuentesCont[key]=(frecuentesCont[key]||0)+1;});
  const productosFrecuentes=Object.entries(frecuentesCont).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([key])=>{const[name,cat]=key.split('|||');return{name,cat};});
  const catStats=CATS.map(cat=>{
    const dc=descartados.filter(p=>p.cat===cat);const cc=consumidos.filter(p=>p.cat===cat);
    const totalCat=dc.length+cc.length;const pctDesperdicio=totalCat>0?Math.round((dc.length/totalCat)*100):0;
    return{cat,descartados:dc.length,total:totalCat,pctDesperdicio,pérdidaCat:dc.reduce((s,p)=>s+(parseFloat(p.precio)||0),0)};
  }).filter(x=>x.descartados>0).sort((a,b)=>b.descartados-a.descartados);

  const hoyDate=new Date();const mesActual=hoyDate.getMonth();const añoActual=hoyDate.getFullYear();
  const inicioMesActual=new Date(añoActual,mesActual,1);
  const mesAnterior=mesActual===0?11:mesActual-1;const añoAnterior=mesActual===0?añoActual-1:añoActual;
  const inicioMesAnterior=new Date(añoAnterior,mesAnterior,1);const finMesAnterior=new Date(añoAnterior,mesAnterior+1,0);
  const descartadosActual=descartados.filter(p=>p.fechaEstado&&new Date(p.fechaEstado)>=inicioMesActual);
  const descartadosAnterior=descartados.filter(p=>p.fechaEstado&&new Date(p.fechaEstado)>=inicioMesAnterior&&new Date(p.fechaEstado)<=finMesAnterior);
  const pérdidaActual=descartadosActual.reduce((s,p)=>s+(parseFloat(p.precio)||0),0);
  const pérdidaAnterior=descartadosAnterior.reduce((s,p)=>s+(parseFloat(p.precio)||0),0);
  const cambioMesAMes=pérdidaAnterior>0?Math.round(((pérdidaActual-pérdidaAnterior)/pérdidaAnterior)*100):0;

  const expired=activos.filter(p=>status(p)==='expired').length;
  const danger=activos.filter(p=>status(p)==='danger').length;
  const warn=activos.filter(p=>status(p)==='warn').length;
  const ok=activos.filter(p=>status(p)==='ok').length;
  const cats=['Todos',...new Set(activos.map(p=>p.cat))];
  const filtered=activos.filter(p=>(filtro==='Todos'||p.cat===filtro)&&(!busqueda||p.name.toLowerCase().includes(busqueda.toLowerCase()))).sort((a,b)=>daysUntil(a.exp)-daysUntil(b.exp));

  // Producto más urgente (vencido, por vencer pronto o dentro de su alerta)
  const destacados=activos.filter(p=>status(p)!=='ok').sort((a,b)=>daysUntil(a.exp)-daysUntil(b.exp));
  const dest=destacados[0];
  const destSt=dest?status(dest):'ok';
  // Producto elegido en la tarjeta de atención (por defecto, el que vence primero)
  const sel=destacados.find(p=>p.id===selDest)||dest;
  const selD=sel?daysUntil(sel.exp):0;
  const selSt=sel?status(sel):'ok';
  const selTexto=!sel?'':selD<0?`Venció hace ${Math.abs(selD)} día${Math.abs(selD)>1?'s':''}`:selD===0?'Vence hoy':`Vence en ${selD} día${selD>1?'s':''}`;

  // Receta con lo que está por vencer (sin vencer todavía, y solo comida)
  const EXCLUIR_RECETA=['Medicamentos','Limpieza','Bebidas','Cuidado personal','Mascotas','Bebé'];
  const candidatosReceta=activos
    .filter(p=>daysUntil(p.exp)>=0&&status(p)!=='ok'&&!EXCLUIR_RECETA.includes(p.cat))
    .sort((a,b)=>daysUntil(a.exp)-daysUntil(b.exp));
  // Receta para el producto elegido: si otros productos también encajan, los aprovecha
  const selEsCandidato=!!sel&&candidatosReceta.some(p=>p.id===sel.id);
  const sugerenciaSel=!selEsCandidato?null:(()=>{
    const r=sugerirReceta([sel,...candidatosReceta.filter(p=>p.id!==sel.id)]);
    return r&&r.productos.some(p=>p.id===sel.id)?r:sugerirReceta([sel]);
  })();

  const histFiltrado=[...historial]
    .filter(p=>p.estado==='consumido'?verConsumidos:verDescartados)
    .filter(p=>!busquedaHist||p.name.toLowerCase().includes(busquedaHist.toLowerCase()))
    .sort((a,b)=>new Date(b.fechaEstado)-new Date(a.fechaEstado));
  const gruposHist=histFiltrado.reduce((acc,p)=>{
    const d=p.fechaEstado?new Date(p.fechaEstado):null;
    const clave=d?`${d.getFullYear()}-${d.getMonth()}`:'sin';
    const titulo=d?d.toLocaleDateString('es-CO',{month:'long',year:'numeric'}):'Sin fecha';
    const g=acc.find(x=>x.clave===clave);
    if(g)g.items.push(p);else acc.push({clave,titulo,items:[p]});
    return acc;
  },[]);

  const porMes=MESES_CORTOS.map(lbl=>({lbl,c:0,d:0}));
  historial.forEach(p=>{
    if(!p.fechaEstado)return;
    const f=new Date(p.fechaEstado);
    if(f.getFullYear()!==añoActual)return;
    if(p.estado==='consumido')porMes[f.getMonth()].c++;
    else porMes[f.getMonth()].d++;
  });
  const maxMes=Math.max(1,...porMes.map(m=>Math.max(m.c,m.d)));

  const abrirNuevo=(catInicial)=>{setEditId(null);setAlertaManual(false);setForm({name:'',cat:catInicial||'Lácteos',exp:'',qty:'',alert:alertaDe(catInicial||'Lácteos',prefs),precio:''});setScanMsg('');setErrorMsg('');setPantalla('form');};
  // Abre el formulario con los datos de un producto del historial; solo falta la nueva fecha
  const comprarDeNuevo=(p)=>{setEditId(null);setAlertaManual(false);setForm({name:p.name,cat:p.cat,exp:'',qty:p.qty||'',alert:alertaDe(p.cat,prefs),precio:p.precio||'',...(p.barcode?{barcode:p.barcode}:{})});setScanMsg('');setErrorMsg('');setPantalla('form');};
  // En un producto nuevo, la alerta sigue a la categoría mientras la persona no la cambie
  const cambiarCategoria=(cat)=>setForm(f=>({...f,cat,alert:(editId||alertaManual)?f.alert:alertaDe(cat,prefs)}));
  const abrirEditar=(p)=>{setEditId(p.id);setForm({name:p.name,cat:p.cat,exp:p.exp,qty:p.qty||'',alert:p.alert,precio:p.precio||''});setScanMsg('');setErrorMsg('');setPantalla('form');};

  const actualizarPrefs=(cambios)=>{
    const nuevas={...prefs,...cambios};
    setPrefs(nuevas);
    try{localStorage.setItem(`prefs_${usuario.uid}`,JSON.stringify(nuevas));}catch(e){}
  };

  // Muestra un mensaje visible cuando Firestore rechaza una operación
  const falla=(e,que)=>{
    console.error(e);
    const codigo=e&&e.code?` (${e.code})`:'';
    setErrorMsg(`No se pudo ${que}${codigo}. Revisa tu conexión e inténtalo de nuevo.`);
    setTimeout(()=>setErrorMsg(''),10000);
  };

  // Las escrituras no esperan la respuesta del servidor: la pantalla vuelve al inicio
  // enseguida y Firestore sincroniza en segundo plano (también sin conexión).
  const guardar=()=>{
    if(!form.name.trim()){setErrorMsg('Escribe el nombre del producto.');return;}
    if(!form.exp){setErrorMsg('Elige la fecha de vencimiento.');return;}
    setErrorMsg('');
    const datos={...form,name:form.name.trim()};
    if(datos.barcode)recordarProducto(datos.barcode,{nombre:datos.name,categoria:datos.cat,cantidad:datos.qty});
    const op=editId
      ?updateDoc(doc(db,"productos",editId),datos)
      :addDoc(collection(db,"productos"),{...datos,uid:usuario.uid,estado:null,fechaCreacion:new Date().toISOString()});
    op.catch(e=>falla(e,'guardar el producto'));
    setFiltro('Todos');setBusqueda('');
    setTab('home');setPantalla('');
  };

  const marcarEstado=(estado)=>{
    marcarProducto(editId,estado);
    setTab('home');setPantalla('');
  };

  // Marcar un producto directamente desde la tarjeta de inicio ("Ya la usé" / "Botar")
  const marcarProducto=(id,estado)=>{
    const p=products.find(x=>x.id===id);
    updateDoc(doc(db,"productos",id),{estado,fechaEstado:new Date().toISOString()}).catch(e=>falla(e,'actualizar el producto'));
    if(p)avisar(`${p.name}: ${estado==='consumido'?'marcado como consumido':'marcado como descartado'}`,()=>updateDoc(doc(db,"productos",id),{estado:null,fechaEstado:null}).catch(e=>falla(e,'deshacer el cambio')));
  };

  const agregarEjemplo=(ej)=>{
    addDoc(collection(db,"productos"),{name:ej.name,cat:ej.cat,exp:ej.exp,qty:'',alert:alertaDe(ej.cat,prefs),precio:'',uid:usuario.uid,estado:null,fechaCreacion:new Date().toISOString()}).catch(e=>falla(e,'agregar el ejemplo'));
  };

  const eliminar=()=>{
    eliminarProducto(editId);
    setTab('home');setPantalla('');
  };

  // Eliminar un producto activo directamente desde la lista (sin abrir el formulario)
  // Cambia la alerta de los productos activos según los valores de su categoría
  const aplicarAlertas=()=>{
    const cambios=activos.filter(p=>p.alert!==alertaDe(p.cat,prefs));
    if(!cambios.length){avisar('Tus productos ya tienen esas alertas');return;}
    if(!window.confirm(`¿Cambiar la alerta de ${cambios.length} producto${cambios.length!==1?'s':''} según su categoría?`))return;
    cambios.forEach(p=>updateDoc(doc(db,"productos",p.id),{alert:alertaDe(p.cat,prefs)}).catch(e=>falla(e,'actualizar las alertas')));
    avisar(`Alertas actualizadas en ${cambios.length} producto${cambios.length!==1?'s':''}`);
  };

  const eliminarProducto=(id)=>{
    const p=products.find(x=>x.id===id);
    if(!p)return;
    const datos={...p};
    delete datos.id;
    deleteDoc(doc(db,"productos",id)).catch(e=>falla(e,'eliminar el producto'));
    avisar(`${p.name} eliminado`,()=>setDoc(doc(db,"productos",id),datos).catch(e=>falla(e,'restaurar el producto')));
  };

  const eliminarDelHistorial=async(id)=>{
    if(!window.confirm('¿Eliminar este producto del historial?'))return;
    try{await deleteDoc(doc(db,"productos",id));}catch(e){console.error(e);}
  };

  const eliminarTodoHistorial=async()=>{
    if(!window.confirm(`¿Eliminar todo el historial? (${historial.length} productos)`))return;
    try{const batch=writeBatch(db);historial.forEach(p=>batch.delete(doc(db,"productos",p.id)));await batch.commit();}catch(e){console.error(e);}
  };

  const restaurar=async(id)=>{
    try{await updateDoc(doc(db,"productos",id),{estado:null,fechaEstado:null});}catch(e){console.error(e);}
  };

  const navbar=(
    <Navbar
      tab={tab}
      cuenta={menuAbierto}
      foto={foto}
      onTab={(id)=>{setTab(id);setPantalla('');setMenuAbierto(false);}}
      onAdd={()=>{setMenuAbierto(false);abrirNuevo();}}
      onCuenta={()=>setMenuAbierto(true)}
    />
  );

  const cuentaSheet=menuAbierto&&(
    <CuentaSheet usuario={usuario} nombre={nombre} iniciales={iniciales} foto={foto} fotoPropia={!!fotoPerfil} prefs={prefs} onPrefs={actualizarPrefs} onAplicarAlertas={aplicarAlertas} numActivos={activos.length} onNombre={setNombreExtra} onClose={()=>setMenuAbierto(false)} onLogout={()=>{signOut(auth);setMenuAbierto(false);}}/>
  );

  if(pantalla==='form') return (
    <>
      {scanner&&<Scanner onResult={onScanResult} onClose={()=>setScanner(false)}/>}
      {cuentaSheet}
      <div className="ad-screen">
        <header className="ad-hero ad-hero--sm">
          <div className="ad-hero-row">
            <button className="ad-hero-btn" onClick={()=>setPantalla('')} aria-label="Volver">←</button>
            <h1 className="ad-title" style={{fontSize:'1.375rem'}}>{editId?'Editar producto':'Nuevo producto'}</h1>
            {!editId&&<button className="ad-hero-btn" style={{marginLeft:'auto'}} onClick={()=>setScanner(true)} aria-label="Escanear código de barras">📷</button>}
          </div>
        </header>
        <div className="ad-overlap ad-stack">
          {!editId&&productosFrecuentes.length>0&&(
            <div className="ad-card ad-pad">
              <p className="ad-muted" style={{fontWeight:700,marginBottom:8}}>Productos frecuentes</p>
              <div className="ad-chips">
                {productosFrecuentes.map((p,i)=>(
                  <button key={i} className="ad-chip" onClick={()=>{setForm(f=>({...f,name:p.name}));cambiarCategoria(p.cat);}}>{p.name}</button>
                ))}
              </div>
            </div>
          )}
          {scanMsg&&<div className={`ad-note${scanMsg.startsWith('✓')?'':' ad-note--warn'}`}>{scanMsg}</div>}
          {errorMsg&&<div className="ad-note ad-note--danger" role="alert">⚠️ {errorMsg}</div>}
          <div className="ad-card" style={{overflow:'hidden'}}>
            <label className="ad-field"><span className="ad-field__label">Nombre</span>
              <input list="nombresSugeridos" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ej: Leche entera"/>
              <datalist id="nombresSugeridos">{todosLosProductos.map((p,i)=><option key={i} value={p.name}/>)}</datalist>
            </label>
            <label className="ad-field"><span className="ad-field__label">Categoría</span>
              <select value={form.cat} onChange={e=>cambiarCategoria(e.target.value)}>{CATS.map(c=><option key={c}>{c}</option>)}</select>
            </label>
            <label className="ad-field"><span className="ad-field__label">Fecha de vencimiento</span>
              <input type="date" value={form.exp} onChange={e=>setForm({...form,exp:e.target.value})}/>
            </label>
            <div className="ad-filters" role="group" aria-label="Fechas rápidas">
              {[['3 días',()=>fechaEn(3)],['1 semana',()=>fechaEn(7)],['2 semanas',()=>fechaEn(14)],['1 mes',()=>fechaEnMeses(1)],['3 meses',()=>fechaEnMeses(3)],['6 meses',()=>fechaEnMeses(6)],['1 año',()=>fechaEnMeses(12)]].map(([t,f])=>(
                <button type="button" key={t} className="ad-chip" aria-pressed={form.exp===f()} onClick={()=>setForm({...form,exp:f()})}>{t}</button>
              ))}
            </div>
            <label className="ad-field"><span className="ad-field__label">Cantidad / notas</span>
              <input value={form.qty} onChange={e=>setForm({...form,qty:e.target.value})} placeholder="Ej: 2 botellas"/>
            </label>
            <label className="ad-field"><span className="ad-field__label">Precio (opcional)</span>
              <input type="number" value={form.precio} onChange={e=>setForm({...form,precio:e.target.value})} placeholder="Ej: 4500"/>
            </label>
            <label className="ad-field"><span className="ad-field__label">Alertar con anticipación</span>
              <select value={form.alert} onChange={e=>{setAlertaManual(true);setForm({...form,alert:parseInt(e.target.value)});}}>
                <option value={3}>3 días antes</option><option value={7}>7 días antes</option><option value={14}>14 días antes</option><option value={30}>30 días antes</option>
              </select>
              {!editId&&!alertaManual&&<span className="ad-muted" style={{fontSize:'.75rem'}}>Sugerido para {form.cat}. Puedes cambiarlo.</span>}
            </label>
          </div>
          <button className="ad-btn" style={{opacity:guardando?0.6:1}} onClick={guardar} disabled={guardando}>{guardando?'Guardando...':'Guardar'}</button>
          {editId&&(
            <div>
              <button className="ad-btn ad-btn--ghost" style={{opacity:guardando?0.6:1}} onClick={()=>marcarEstado('consumido')} disabled={guardando}>✓ Marcar como consumido</button>
              <button className="ad-btn ad-btn--ghost" style={{opacity:guardando?0.6:1}} onClick={()=>marcarEstado('descartado')} disabled={guardando}>Marcar como descartado</button>
              <button className="ad-btn ad-btn--danger" style={{opacity:guardando?0.6:1}} onClick={eliminar} disabled={guardando}>Eliminar producto</button>
            </div>
          )}
        </div>
      </div>
      {navbar}
    </>
  );

  return (
    <>
      {compartir&&<CompartirModal activos={activos} uid={usuario.uid} nombre={nombreCorto} onClose={()=>setCompartir(false)}/>}
      {recetaAbierta&&<RecetaSheet sug={recetaAbierta} onClose={()=>setRecetaAbierta(null)}/>}
      {toast&&(
        <div className="ad-toast" role="status">
          <span>{toast.texto}</span>
          {toast.deshacer&&<button onClick={()=>{toast.deshacer();setToast(null);}}>Deshacer</button>}
        </div>
      )}
      {avisos&&(
        <div className="ad-overlay" onClick={()=>setAvisos(false)}>
          <div className="ad-sheet" onClick={e=>e.stopPropagation()} role="dialog" aria-label="Avisos">
            <div className="ad-sheet__handle"/>
            <h2 className="ad-section" style={{margin:'0 0 4px'}}>Avisos</h2>
            <p className="ad-muted" style={{marginBottom:12}}>{destacados.length===0?'Todo está al día. No tienes avisos.':`${destacados.length} producto${destacados.length!==1?'s':''} necesita${destacados.length!==1?'n':''} tu atención`}</p>
            {destacados.map(p=>{const st=status(p);const d=daysUntil(p.exp);return(
              <button key={p.id} className="ad-sheet__row" onClick={()=>{setAvisos(false);setAccionProd(p);}}>
                <span style={{minWidth:0}}>
                  <span style={{display:'block',fontWeight:700}}>{p.name}</span>
                  <span className="ad-muted" style={{display:'block',fontSize:'.8125rem'}}>{d<0?`Venció hace ${Math.abs(d)} día${Math.abs(d)>1?'s':''}`:d===0?'Vence hoy':`Vence en ${d} día${d>1?'s':''}`} · {p.cat}</span>
                </span>
                <span className={`ad-pill ${pillClass(st)}`} style={{marginLeft:'auto'}}>{pillIcon(st)} {daysLabel(d)}</span>
              </button>
            );})}
            <button className="ad-btn ad-btn--ghost" style={{marginTop:12}} onClick={()=>setAvisos(false)}>Cerrar</button>
          </div>
        </div>
      )}
      {accionProd&&(
        <div className="ad-overlay" onClick={()=>setAccionProd(null)}>
          <div className="ad-sheet" onClick={e=>e.stopPropagation()} role="dialog" aria-label="Opciones del producto">
            <div className="ad-sheet__handle"/>
            <h2 className="ad-section" style={{margin:'0 0 8px'}}>{accionProd.name}</h2>
            <button className="ad-sheet__row" onClick={()=>{marcarProducto(accionProd.id,'consumido');setAccionProd(null);}}>Marcar como consumido</button>
            <button className="ad-sheet__row" onClick={()=>{marcarProducto(accionProd.id,'descartado');setAccionProd(null);}}>Marcar como descartado</button>
            <button className="ad-sheet__row" onClick={()=>{abrirEditar(accionProd);setAccionProd(null);}}>Editar producto</button>
            <button className="ad-sheet__row ad-sheet__row--danger" onClick={()=>{eliminarProducto(accionProd.id);setAccionProd(null);}}>Eliminar producto</button>
            <button className="ad-sheet__row" onClick={()=>setAccionProd(null)}>Cancelar</button>
          </div>
        </div>
      )}
      {accionHist&&(
        <div className="ad-overlay" onClick={()=>setAccionHist(null)}>
          <div className="ad-sheet" onClick={e=>e.stopPropagation()} role="dialog" aria-label="Opciones del producto">
            <div className="ad-sheet__handle"/>
            <h2 className="ad-section" style={{margin:'0 0 8px'}}>{accionHist.name}</h2>
            <button className="ad-sheet__row" onClick={()=>{comprarDeNuevo(accionHist);setAccionHist(null);}}>Comprar de nuevo</button>
            <button className="ad-sheet__row" onClick={()=>{restaurar(accionHist.id);setAccionHist(null);}}>Restaurar a mi lista</button>
            <button className="ad-sheet__row ad-sheet__row--danger" onClick={()=>{eliminarDelHistorial(accionHist.id);setAccionHist(null);}}>Eliminar del historial</button>
            <button className="ad-sheet__row" onClick={()=>setAccionHist(null)}>Cancelar</button>
          </div>
        </div>
      )}
      {cuentaSheet}
      <div className="ad-screen">

        {tab==='home'&&(
          <>
            <header className="ad-hero">
              <div className="ad-topbar">
                <div className="ad-brand">
                  <LOGO/>
                  <h1 className="ad-wordmark">al día</h1>
                </div>
                <button className="ad-hero-btn ad-bell" onClick={()=>setAvisos(true)}
                  aria-label={destacados.length?`Avisos: ${destacados.length} producto${destacados.length!==1?'s':''} por atender`:'Avisos'}>
                  <BellIcon/>
                  {destacados.length>0&&<span className="ad-badge" aria-hidden="true">{destacados.length}</span>}
                </button>
              </div>
              <p className="ad-hello">{saludo}, {nombreCorto}</p>
            </header>
            <div className="ad-overlap">
              {errorMsg&&<div className="ad-note ad-note--danger" role="alert" style={{marginBottom:10}}>⚠️ {errorMsg}</div>}
              {correoEnviado&&<div className="ad-note" style={{marginBottom:10}}>Te enviamos un correo con los productos por vencer</div>}
              {activos.length===0?(
                esUsuarioNuevo
                  ?<div className="ad-card ad-pad"><EmptyStateNuevo onAgregar={()=>abrirNuevo()} onCategoria={cat=>abrirNuevo(cat)} onAgregarEjemplo={agregarEjemplo}/></div>
                  :<div className="ad-card ad-pad"><EmptyStateExistente onAgregar={()=>abrirNuevo()} catsUsadas={catsUsadas}/></div>
              ):(
                <>
                  {dest?(
                    <div className="ad-card ad-urgent">
                      <div className="ad-urgent__top">
                        <span className="ad-muted" style={{fontWeight:700}}>{destSt==='warn'?'Próximo a vencer':'Atención hoy'}</span>
                        <span className="ad-muted">{destacados.length} producto{destacados.length!==1?'s':''}</span>
                      </div>
                      {destacados.length>1&&(
                        <div className="ad-urgent__chips" role="group" aria-label="Productos por atender">
                          {destacados.map(p=>(
                            <button key={p.id} className="ad-urgent__chip" aria-pressed={p.id===sel.id} onClick={()=>setSelDest(p.id)}>
                              <span className={`ad-dot ad-dot--${status(p)==='warn'?'warn':'danger'}`} aria-hidden="true"/>
                              <span className="ad-urgent__chipname">{p.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="ad-urgent__sel">
                        <button className="ad-urgent__selmain" onClick={()=>setAccionProd(sel)}>
                          <span className="ad-urgent__name">{sel.name}</span>
                          <span className="ad-muted">{selTexto} · {sel.cat}</span>
                        </button>
                        <span className={`ad-pill ${pillClass(selSt)}`}>{pillIcon(selSt)} {daysLabel(selD)}</span>
                      </div>
                      <div className="ad-btn-row">
                        <button className="ad-btn ad-btn--sm" onClick={()=>marcarProducto(sel.id,'consumido')} disabled={guardando}>✓ Ya la usé</button>
                        <button className="ad-btn ad-btn--ghost ad-btn--sm" onClick={()=>marcarProducto(sel.id,'descartado')} disabled={guardando}>Botar</button>
                      </div>
                      {sugerenciaSel&&(
                        <div className="ad-receta">
                          <div className="ad-receta__top">Sugerencia de receta</div>
                          <button className="ad-receta__main" onClick={()=>setRecetaAbierta(sugerenciaSel)}>
                            <span style={{minWidth:0,flex:1}}>
                              <span className="ad-receta__name">{sugerenciaSel.receta.n}</span>
                              <span className="ad-muted" style={{display:'block'}}>Usa: {sugerenciaSel.productos.map(p=>`${p.name} (${daysLabel(daysUntil(p.exp))})`).join(', ')}</span>
                            </span>
                            <span className="ad-pill ad-pill--ok">{sugerenciaSel.receta.min} min</span>
                          </button>
                          <button className="ad-btn ad-btn--ghost ad-btn--sm" onClick={()=>setRecetaAbierta(sugerenciaSel)}>Ver receta</button>
                        </div>
                      )}
                    </div>
                  ):(
                    <div className="ad-card ad-urgent ad-urgent--ok" style={{textAlign:'center'}}>
                      <h2 className="ad-section" style={{margin:'6px 0 4px'}}>Todo al día</h2>
                      <p className="ad-muted">Ningún producto está por vencer. ¡Buen trabajo!</p>
                    </div>
                  )}
                  <div className="ad-stats">
                    <div className="ad-stat"><span className="ad-stat__n ad-stat__n--danger">{expired}</span><span className="ad-stat__l">Vencidos</span></div>
                    <div className="ad-stat"><span className="ad-stat__n ad-stat__n--warn">{danger+warn}</span><span className="ad-stat__l">Por vencer</span></div>
                    <div className="ad-stat"><span className="ad-stat__n ad-stat__n--ok">{ok}</span><span className="ad-stat__l">Al día</span></div>
                  </div>
                  <div className="ad-sechead">
                    <h2 className="ad-section">Mis productos</h2>
                    <button className="ad-link" onClick={()=>setCompartir(true)}>Compartir</button>
                  </div>
                  <div className="ad-filters">
                    {cats.map(c=><button key={c} className="ad-chip" aria-pressed={filtro===c} onClick={()=>setFiltro(c)}>{c}</button>)}
                  </div>
                  <input className="ad-search" value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar producto..."/>
                  <div key={listKey} className="ad-grid">
                    {filtered.length===0&&<div className="ad-card ad-pad ad-muted" style={{textAlign:'center'}}>Sin resultados.</div>}
                    {filtered.map((p,i)=><ProductCard key={p.id} p={p} index={i} onClick={()=>setAccionProd(p)} onConsumido={()=>marcarProducto(p.id,'consumido')} onEliminar={()=>eliminarProducto(p.id)}/>)}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {tab==='estadisticas'&&(
          <>
            <header className="ad-hero ad-hero--sm">
              <p className="ad-hello">Tu impacto</p>
              <h1 className="ad-title">Estadísticas</h1>
            </header>
            <div className="ad-overlap ad-stack">
              <Donut consumidos={consumidos.length} descartados={descartados.length}/>
              <div className="ad-stats ad-stats--2">
                <div className="ad-stat"><span className="ad-stat__l">Dinero salvado</span><span className="ad-stat__n ad-stat__n--md ad-stat__n--ok">${Math.round(ahorro).toLocaleString('es-CO')}</span></div>
                <div className="ad-stat"><span className="ad-stat__l">Dinero perdido</span><span className="ad-stat__n ad-stat__n--md ad-stat__n--danger">${Math.round(perdida).toLocaleString('es-CO')}</span></div>
              </div>
              <div className="ad-card ad-pad">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <p className="ad-eyebrow" style={{margin:0}}>Tu meta de desperdicio</p>
                  <button className="ad-link" onClick={()=>{setEditandoMeta(!editandoMeta);setValorMeta(meta?meta.toString():'');}}>{editandoMeta?'Cancelar':'Editar'}</button>
                </div>
                {!editandoMeta?(
                  meta?(<>
                    <div className="ad-big" style={{fontSize:'1.375rem',color:pérdidaActual<=meta?'var(--green)':'var(--danger)'}}>${Math.round(pérdidaActual).toLocaleString('es-CO')} / ${Math.round(meta).toLocaleString('es-CO')}</div>
                    <div className={`ad-bar ad-bar--lg ${pérdidaActual<=meta?'':'ad-bar--danger'}`}><span style={{width:`${Math.min(100,(pérdidaActual/meta)*100)}%`,transition:'width 0.3s'}}/></div>
                    <p className="ad-muted" style={{marginTop:8}}>{pérdidaActual<=meta?'✓ ¡Excelente trabajo!':`⚠ Vas $${Math.round(pérdidaActual-meta).toLocaleString('es-CO')} por encima`}</p>
                  </>):<p className="ad-muted" style={{fontStyle:'italic'}}>Sin meta establecida. ¡Define una para motivarte!</p>
                ):(
                  <div style={{display:'flex',gap:8}}>
                    <input className="ad-search" style={{marginBottom:0,flex:1}} type="number" value={valorMeta} onChange={e=>setValorMeta(e.target.value)} placeholder="Ej: 50000"/>
                    <button className="ad-btn ad-btn--sm" style={{width:'auto'}} onClick={guardarMeta}>Guardar</button>
                  </div>
                )}
              </div>
              <div className="ad-card ad-pad">
                <p className="ad-eyebrow">Comparativa mes a mes</p>
                <div className="ad-big" style={{color:cambioMesAMes<=0?'var(--green)':'var(--danger)'}}>{cambioMesAMes>0?'+':''}{cambioMesAMes}%</div>
                <p className="ad-muted" style={{marginTop:8}}>Este mes: ${Math.round(pérdidaActual).toLocaleString('es-CO')} | Mes anterior: ${Math.round(pérdidaAnterior).toLocaleString('es-CO')}</p>
                <p className="ad-muted" style={{marginTop:4}}>{cambioMesAMes<0?'✓ ¡Mejorando! Desperdiciaste menos':cambioMesAMes>0?'⚠ Aumentó el desperdicio':'→ Igual que el mes anterior'}</p>
              </div>
              <BarrasMensuales datos={porMes} max={maxMes} anio={añoActual}/>
              {catStats.length>0&&(
                <div className="ad-card ad-pad">
                  <p className="ad-eyebrow">Categorías con más desperdicios</p>
                  {catStats.map(c=>(
                    <div key={c.cat} style={{marginBottom:14}}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700}}>{c.cat}</div>
                          <div className="ad-muted" style={{fontSize:'.8125rem'}}>{c.descartados} descartados de {c.total} ({c.pctDesperdicio}%)</div>
                        </div>
                        <span style={{fontSize:'.875rem',color:'var(--warn-ink)',fontWeight:700}}>-${Math.round(c.pérdidaCat).toLocaleString('es-CO')}</span>
                      </div>
                      <div className={`ad-bar ${c.pctDesperdicio>50?'ad-bar--danger':c.pctDesperdicio>30?'ad-bar--warn':''}`}><span style={{width:`${c.pctDesperdicio}%`,transition:'width 0.3s'}}/></div>
                    </div>
                  ))}
                </div>
              )}
              {historial.length>0&&(
                <div className="ad-card ad-pad">
                  <p className="ad-eyebrow">Recomendaciones inteligentes</p>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {catStats.length>0&&catStats[0].pctDesperdicio>50&&<div className="ad-note ad-note--danger">⚠ {catStats[0].cat}: {catStats[0].pctDesperdicio}% de desperdicio.</div>}
                    {consumidos.length>descartados.length&&<div className="ad-note">✓ Mejorando: consumes más de lo que descartas. ¡Sigue así!</div>}
                    {cambioMesAMes<0&&<div className="ad-note">Progreso: este mes reduciste el desperdicio {Math.abs(cambioMesAMes)}%.</div>}
                    {meta&&pérdidaActual>meta&&<div className="ad-note ad-note--warn">Meta: necesitas reducir ${Math.round(pérdidaActual-meta).toLocaleString('es-CO')} para alcanzarla.</div>}
                  </div>
                </div>
              )}
              {historial.length===0&&<div className="ad-card ad-pad ad-muted" style={{textAlign:'center'}}>Aún no hay datos.</div>}
            </div>
          </>
        )}

        {tab==='historial'&&(
          <>
            <header className="ad-hero ad-hero--sm">
              <p className="ad-hello">Tu registro</p>
              <h1 className="ad-title">Historial</h1>
            </header>
            <div className="ad-overlap ad-stack">
              <div className="ad-stats ad-stats--2">
                <button className="ad-stat" aria-pressed={verConsumidos} onClick={()=>setVerConsumidos(!verConsumidos)}>
                  <span className="ad-stat__n ad-stat__n--ok">{consumidos.length}</span><span className="ad-stat__l">Consumidos</span>
                </button>
                <button className="ad-stat" aria-pressed={verDescartados} onClick={()=>setVerDescartados(!verDescartados)}>
                  <span className="ad-stat__n ad-stat__n--danger">{descartados.length}</span><span className="ad-stat__l">Descartados</span>
                </button>
              </div>
              <input className="ad-search" style={{marginBottom:0}} value={busquedaHist} onChange={e=>setBusquedaHist(e.target.value)} placeholder="Buscar en historial..."/>
              {historial.length>0&&(
                <div className="ad-sechead">
                  <p className="ad-eyebrow" style={{margin:0}}>{histFiltrado.length} producto{histFiltrado.length!==1?'s':''}</p>
                  <button className="ad-link ad-link--danger" onClick={eliminarTodoHistorial}>Borrar todo</button>
                </div>
              )}
              {historial.length===0&&<div className="ad-card ad-pad ad-muted" style={{textAlign:'center'}}>No hay productos en el historial aún.</div>}
              {historial.length>0&&histFiltrado.length===0&&<div className="ad-card ad-pad ad-muted" style={{textAlign:'center'}}>Sin resultados.</div>}
              {gruposHist.map(g=>(
                <div key={g.clave} className="ad-hgroup">
                  <p className="ad-eyebrow ad-hgroup__t">{g.titulo}</p>
                  {g.items.map(p=>(
                    <div key={p.id} className="ad-card ad-hrow">
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <div className="ad-item__body">
                          <div className="ad-item__name">{p.name}</div>
                          <div className="ad-muted" style={{fontSize:'.8125rem'}}>{p.cat}{p.precio?` • $${Number(p.precio).toLocaleString('es-CO')}`:''}</div>
                        </div>
                        <div style={{textAlign:'right',flex:'none'}}>
                          <span className={`ad-pill ${p.estado==='consumido'?'ad-pill--ok':'ad-pill--danger'}`}>{p.estado==='consumido'?'✓ Consumido':'✕ Descartado'}</span>
                          <div className="ad-muted" style={{fontSize:'.75rem',marginTop:4}}>{fechaCorta(p.fechaEstado)}</div>
                        </div>
                        <button className="ad-kebab" aria-label={`Más opciones de ${p.name}`} onClick={()=>setAccionHist(p)}>⋮</button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {navbar}
    </>
  );
}