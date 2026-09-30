import { useState, useEffect, useRef } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, writeBatch, getDocs, limit } from "firebase/firestore";
import emailjs from "@emailjs/browser";
import Login from "./Login";
import Scanner from "./Scanner";
import "./index.css";

const EMAILJS_SERVICE = "service_vi35bf4";
const EMAILJS_TEMPLATE = "template_ndvpdby";
const EMAILJS_KEY = "rt3CGRFqu1i6H69tO";

const CATS = {
  'Lácteos':'🥛','Carnes':'🥩','Frutas y verduras':'🥦','Granos y cereales':'🌾',
  'Enlatados':'🥫','Bebidas':'🧃','Medicamentos':'💊','Limpieza':'🧴','Otro':'📦'
};

const today = new Date();
today.setHours(0,0,0,0);

function getSaludo(){
  const h = new Date().getHours();
  if(h<12) return 'Buenos días';
  if(h<18) return 'Buenas tardes';
  return 'Buenas noches';
}

function daysUntil(dateStr){
  const d = new Date(dateStr+'T12:00:00');
  d.setHours(0,0,0,0);
  return Math.round((d-today)/86400000);
}

function fechaEn(n){
  const d = new Date();
  d.setDate(d.getDate()+n);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

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

const LOGO=()=>(
  <div className="ad-logo">
    <svg width="30" height="30" viewBox="0 0 80 80" aria-hidden="true">
      <path d="M40 14 C40 14 56 25 56 38 C56 50 48 58 40 61 C32 58 24 50 24 38 C24 25 40 14 40 14Z" fill="none" stroke="var(--green)" strokeWidth="4" strokeLinecap="round"/>
      <polyline points="32,38 38,44 49,31" fill="none" stroke="var(--green)" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);

function Navbar({tab,cuenta,onTab,onAdd,onCuenta}){
  const item=(id,lbl,ico,active,onClick)=>(
    <button key={id} className={`ad-nav__item${active?' is-active':''}`} onClick={onClick} aria-current={active?'page':undefined}>
      {ico}<span>{lbl}</span>
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
      {item('cuenta','Cuenta',Ico.user,cuenta,onCuenta)}
    </nav>
  );
}

function CuentaSheet({usuario,nombre,iniciales,onClose,onLogout}){
  const filas=[
    {ico:'✏️',t:'Editar perfil',fn:()=>alert('Editar perfil - En desarrollo')},
    {ico:'⚙️',t:'Preferencias',fn:()=>alert('Preferencias - En desarrollo')},
    {ico:'❓',t:'Ayuda y FAQ',fn:()=>alert('Ayuda y FAQ - En desarrollo')},
    {ico:'📧',t:'Contacto y soporte',fn:()=>alert('Contacto: soporte@aldia.com')},
    {ico:'📋',t:'Términos y privacidad',fn:()=>alert('Términos y privacidad - En desarrollo')},
    {ico:'ℹ️',t:'Versión 1.0.0',fn:()=>alert('Versión 1.0.0')},
  ];
  return (
    <div className="ad-overlay" onClick={onClose}>
      <div className="ad-sheet" onClick={e=>e.stopPropagation()} role="dialog" aria-label="Cuenta">
        <div className="ad-sheet__handle"/>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
          <div className="ad-avatar ad-avatar--solid">
            {usuario.photoURL?<img src={usuario.photoURL} alt="perfil"/>:iniciales}
          </div>
          <div style={{minWidth:0}}>
            <div className="ad-item__name">{nombre}</div>
            <div className="ad-muted" style={{wordBreak:'break-all'}}>{usuario.email}</div>
          </div>
        </div>
        {filas.map(f=>(
          <button key={f.t} className="ad-sheet__row" onClick={f.fn}><span>{f.ico}</span>{f.t}</button>
        ))}
        <button className="ad-sheet__row ad-sheet__row--danger" onClick={onLogout}><span>🚪</span>Cerrar sesión</button>
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
      <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">
        <path d="M60 8c22 0 44 14 44 40s-14 54-46 56S12 84 14 54 34 8 60 8z" fill="var(--green-soft)"/>
        <path d="M60 30c0 0 22 14 22 32 0 16-10 26-22 30-12-4-22-14-22-30 0-18 22-32 22-32z" fill="none" stroke="var(--green)" strokeWidth="4" strokeLinecap="round"/>
        <polyline points="49,60 57,68 72,50" fill="none" stroke="var(--green)" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
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
      <button className="ad-btn" onClick={onAgregar}>✨ Agregar mi primer producto</button>
      <div style={{width:'100%'}}>
        <p className="ad-muted" style={{textAlign:'center',fontWeight:700,marginBottom:10}}>O prueba con estos ejemplos</p>
        <div className="ad-grid2">
          {ejemplos.map((ej,i)=>(
            <div key={i} className="ad-card ad-pad" style={{padding:12}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                <span className="ad-icon">{CATS[ej.cat]}</span>
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
      <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">
        <path d="M60 8c22 0 44 14 44 40s-14 54-46 56S12 84 14 54 34 8 60 8z" fill="var(--green-soft)"/>
        <rect x="34" y="44" width="52" height="36" rx="10" fill="none" stroke="var(--green)" strokeWidth="4"/>
        <path d="M34 58h52" stroke="var(--green)" strokeWidth="4"/>
      </svg>
      <h2>Sin productos registrados</h2>
      <p className="ad-muted" style={{maxWidth:280,lineHeight:1.6}}>No tienes ningún producto en tu lista en este momento.</p>
      {catsUsadas.length>0&&(
        <div className="ad-card ad-pad" style={{width:'100%'}}>
          <p className="ad-muted" style={{fontWeight:700,marginBottom:10}}>Últimas categorías usadas</p>
          <div className="ad-grid2">
            {catsUsadas.slice(0,4).map(cat=>(
              <div key={cat} className="ad-chip" style={{justifyContent:'center',gap:6}}>{CATS[cat]||'📦'} {cat}</div>
            ))}
          </div>
        </div>
      )}
      <button className="ad-btn" onClick={onAgregar}>✨ Agregar producto</button>
    </div>
  );
}

function CompartirModal({activos,onClose}){
  const [copiado,setCopiado]=useState(false);
  const generarTexto=()=>{
    const lineas=activos.map(p=>{const d=daysUntil(p.exp);const label=d<0?'🔴 Vencido':d===0?'🟠 Vence hoy':d<=3?`🟠 Vence en ${d} día${d>1?'s':''}`:`🟢 Vence en ${d} días`;return `• ${p.name} (${p.cat}) — ${label}`;}).join('\n');
    return `📋 Mi lista de vencimientos - Al Día\n\n${lineas}\n\nCompartido desde Al Día 🛡️`;
  };
  const compartirWhatsApp=()=>window.open(`https://wa.me/?text=${encodeURIComponent(generarTexto())}`,'_blank');
  const copiarPortapapeles=async()=>{try{await navigator.clipboard.writeText(generarTexto());setCopiado(true);setTimeout(()=>setCopiado(false),2000);}catch(e){alert('No se pudo copiar.');}};
  const compartirCorreo=()=>window.open(`mailto:?subject=${encodeURIComponent('Mi lista - Al Día')}&body=${encodeURIComponent(generarTexto())}`,'_blank');
  const compartirNativo=async()=>{if(navigator.share){try{await navigator.share({title:'Al Día',text:generarTexto()});}catch(e){}}else copiarPortapapeles();};
  const opciones=[
    {ico:'💬',label:'WhatsApp',fn:compartirWhatsApp},
    {ico:'📋',label:copiado?'¡Copiado!':'Copiar texto',fn:copiarPortapapeles},
    {ico:'📧',label:'Correo',fn:compartirCorreo},
    {ico:'📤',label:'Compartir',fn:compartirNativo},
  ];
  return (
    <div className="ad-overlay" onClick={onClose}>
      <div className="ad-sheet" onClick={e=>e.stopPropagation()} role="dialog" aria-label="Compartir lista">
        <div className="ad-sheet__handle"/>
        <h2 className="ad-section" style={{margin:'0 0 4px'}}>Compartir lista</h2>
        <p className="ad-muted" style={{marginBottom:16}}>{activos.length} producto{activos.length!==1?'s':''} en tu inventario</p>
        <div className="ad-grid2" style={{marginBottom:14}}>
          {opciones.map(b=>(
            <button key={b.label} className="ad-card ad-share" onClick={b.fn}>
              <span style={{fontSize:24}}>{b.ico}</span>
              <span style={{fontSize:'.8125rem',fontWeight:700}}>{b.label}</span>
            </button>
          ))}
        </div>
        <button className="ad-btn ad-btn--ghost" onClick={onClose}>Cancelar</button>
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
        <p className="ad-muted" style={{marginBottom:10}}>🎯 Consumidos vs Descartados</p>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{flex:1,display:'flex',height:14,borderRadius:8,overflow:'hidden',background:'var(--input)'}}>
            <div style={{width:`${Math.round((consumidos.length/total)*100)}%`,background:'var(--green)'}}/>
            <div style={{width:`${Math.round((descartados.length/total)*100)}%`,background:'#e4775a'}}/>
          </div>
          <span className="ad-muted" style={{minWidth:90,textAlign:'right'}}>{consumidos.length} ✓ / {descartados.length} ✗</span>
        </div>
        <div style={{display:'flex',gap:16,marginTop:10}}>
          <span className="ad-muted" style={{display:'flex',alignItems:'center',gap:6}}><span style={{width:12,height:12,borderRadius:3,background:'var(--green)'}}/>Consumidos</span>
          <span className="ad-muted" style={{display:'flex',alignItems:'center',gap:6}}><span style={{width:12,height:12,borderRadius:3,background:'#e4775a'}}/>Descartados</span>
        </div>
      </div>
      {catStats.length>0&&(
        <div className="ad-card ad-pad">
          <p className="ad-muted" style={{marginBottom:10}}>📊 Top categorías</p>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {catStats.slice(0,5).map(c=>{
              const pct=maxCat>0?Math.round((c.descartados/maxCat)*100):0;
              return (
                <div key={c.cat} style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:18,width:26}}>{CATS[c.cat]||'📦'}</span>
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

function ProductCard({p,index,onClick}){
  const [visible,setVisible]=useState(false);
  const [barW,setBarW]=useState(0);
  const d=daysUntil(p.exp);const st=status(p);
  useEffect(()=>{
    const t1=setTimeout(()=>setVisible(true),index*80);
    const t2=setTimeout(()=>setBarW(getBarWidth(d,p.alert)),index*80+300);
    return()=>{clearTimeout(t1);clearTimeout(t2);};
  },[]);
  return (
    <div className="ad-card ad-product" role="button" tabIndex={0} onClick={onClick}
      onKeyDown={e=>{if(e.key==='Enter')onClick();}}
      style={{opacity:visible?1:0,transform:visible?'translateY(0)':'translateY(14px)'}}>
      <div className="ad-product__row">
        <span className="ad-icon">{CATS[p.cat]||'📦'}</span>
        <div className="ad-item__body">
          <div className="ad-item__name">{p.name}</div>
          <div className="ad-muted" style={{fontSize:'.8125rem'}}>{p.cat}{p.qty?` · ${p.qty}`:''}{p.precio?` · $${parseFloat(p.precio).toLocaleString('es-CO')}`:''}</div>
        </div>
        <span className={`ad-pill ${pillClass(st)}`}>{pillIcon(st)} {daysLabel(d)}</span>
      </div>
      <div className={`ad-bar ${barClass(st)}`}><span style={{width:`${barW}%`,transition:'width 0.8s ease'}}/></div>
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
      if(!correoEnviadoHoy.current){
        const urgentes=prods.filter(p=>!p.estado&&(status(p)==='expired'||status(p)==='danger'||status(p)==='warn'));
        if(urgentes.length>0){
          correoEnviadoHoy.current=true;
          const lista=urgentes.map(p=>`• ${p.name} (${p.cat}) — ${daysLabel(daysUntil(p.exp))}`).join('\n');
          emailjs.send(EMAILJS_SERVICE,EMAILJS_TEMPLATE,{to_email:usuario.email,nombre:usuario.displayName||usuario.email,lista_productos:lista},EMAILJS_KEY)
            .then(()=>{setCorreoEnviado(true);setTimeout(()=>setCorreoEnviado(false),5000);})
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

  const guardarMeta=()=>{
    if(!valorMeta||isNaN(valorMeta))return;
    const valor=parseFloat(valorMeta);
    setMeta(valor);localStorage.setItem(`meta_${usuario.uid}`,valor);
    setEditandoMeta(false);setValorMeta('');
  };

  const onScanResult=({nombre,barcode})=>{
    setScanner(false);
    if(nombre){setForm(f=>({...f,name:nombre}));setScanMsg(`✓ Producto encontrado: ${nombre}`);}
    else setScanMsg(`Código ${barcode} no encontrado. Escribe el nombre.`);
    setTimeout(()=>setScanMsg(''),4000);
  };

  if(cargando||checkingNuevo) return <div style={{width:'100%',height:'100%',background:'var(--bg)'}}/>;
  if(!usuario) return <Login/>;

  const nombre=usuario.displayName||usuario.email.split('@')[0];
  const nombreCorto=nombre.split(' ')[0];
  const iniciales=nombre.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase().slice(0,2);
  const saludo=getSaludo();

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
  const catStats=Object.keys(CATS).map(cat=>{
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
  const alertas=expired+danger+warn;
  const cats=['Todos',...new Set(activos.map(p=>p.cat))];
  const filtered=activos.filter(p=>(filtro==='Todos'||p.cat===filtro)&&(!busqueda||p.name.toLowerCase().includes(busqueda.toLowerCase()))).sort((a,b)=>daysUntil(a.exp)-daysUntil(b.exp));

  // Producto más urgente (vencido, por vencer pronto o dentro de su alerta)
  const destacados=activos.filter(p=>status(p)!=='ok').sort((a,b)=>daysUntil(a.exp)-daysUntil(b.exp));
  const dest=destacados[0];
  const destD=dest?daysUntil(dest.exp):0;
  const destSt=dest?status(dest):'ok';
  const destTexto=!dest?'':destD<0?`Venció hace ${Math.abs(destD)} día${Math.abs(destD)>1?'s':''}`:destD===0?'Vence hoy':`Vence en ${destD} día${destD>1?'s':''}`;

  const abrirNuevo=(catInicial)=>{setEditId(null);setForm({name:'',cat:catInicial||'Lácteos',exp:'',qty:'',alert:7,precio:''});setScanMsg('');setPantalla('form');};
  const abrirEditar=(p)=>{setEditId(p.id);setForm({name:p.name,cat:p.cat,exp:p.exp,qty:p.qty||'',alert:p.alert,precio:p.precio||''});setScanMsg('');setPantalla('form');};

  const guardar=async()=>{
    if(!form.name||!form.exp)return;setGuardando(true);
    try{
      if(editId)await updateDoc(doc(db,"productos",editId),form);
      else await addDoc(collection(db,"productos"),{...form,uid:usuario.uid,estado:null,fechaCreacion:new Date().toISOString()});
      setPantalla('');
    }catch(e){console.error(e);}setGuardando(false);
  };

  const marcarEstado=async(estado)=>{
    setGuardando(true);
    try{await updateDoc(doc(db,"productos",editId),{estado,fechaEstado:new Date().toISOString()});setPantalla('');}
    catch(e){console.error(e);}setGuardando(false);
  };

  // Marcar un producto directamente desde la tarjeta de inicio ("Ya la usé" / "Botar")
  const marcarProducto=async(id,estado)=>{
    if(guardando)return;
    setGuardando(true);
    try{await updateDoc(doc(db,"productos",id),{estado,fechaEstado:new Date().toISOString()});}
    catch(e){console.error(e);}setGuardando(false);
  };

  const agregarEjemplo=async(ej)=>{
    setGuardando(true);
    try{await addDoc(collection(db,"productos"),{name:ej.name,cat:ej.cat,exp:ej.exp,qty:'',alert:7,precio:'',uid:usuario.uid,estado:null,fechaCreacion:new Date().toISOString()});}
    catch(e){console.error(e);}setGuardando(false);
  };

  const eliminar=async()=>{
    setGuardando(true);
    try{await deleteDoc(doc(db,"productos",editId));setPantalla('');}
    catch(e){console.error(e);}setGuardando(false);
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

  const avatarBtn=(
    <button className="ad-avatar" style={{marginLeft:'auto'}} onClick={()=>setMenuAbierto(true)} aria-label="Abrir cuenta">
      {usuario.photoURL?<img src={usuario.photoURL} alt=""/>:iniciales}
      {alertas>0&&<span className="ad-badge">{alertas}</span>}
    </button>
  );

  const navbar=(
    <Navbar
      tab={tab}
      cuenta={menuAbierto}
      onTab={(id)=>{setTab(id);setPantalla('');setMenuAbierto(false);}}
      onAdd={()=>{setMenuAbierto(false);abrirNuevo();}}
      onCuenta={()=>setMenuAbierto(true)}
    />
  );

  const cuentaSheet=menuAbierto&&(
    <CuentaSheet usuario={usuario} nombre={nombre} iniciales={iniciales} onClose={()=>setMenuAbierto(false)} onLogout={()=>{signOut(auth);setMenuAbierto(false);}}/>
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
              <p className="ad-muted" style={{fontWeight:700,marginBottom:8}}>⚡ Productos frecuentes</p>
              <div className="ad-chips">
                {productosFrecuentes.map((p,i)=>(
                  <button key={i} className="ad-chip" onClick={()=>setForm({...form,name:p.name,cat:p.cat})}>{CATS[p.cat]} {p.name}</button>
                ))}
              </div>
            </div>
          )}
          {scanMsg&&<div className={`ad-note${scanMsg.startsWith('✓')?'':' ad-note--warn'}`}>{scanMsg}</div>}
          <div className="ad-card" style={{overflow:'hidden'}}>
            <label className="ad-field"><span className="ad-field__label">📝 Nombre</span>
              <input list="nombresSugeridos" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ej: Leche entera"/>
              <datalist id="nombresSugeridos">{todosLosProductos.map((p,i)=><option key={i} value={p.name}/>)}</datalist>
            </label>
            <label className="ad-field"><span className="ad-field__label">🏷️ Categoría</span>
              <select value={form.cat} onChange={e=>setForm({...form,cat:e.target.value})}>{Object.keys(CATS).map(c=><option key={c}>{c}</option>)}</select>
            </label>
            <label className="ad-field"><span className="ad-field__label">📅 Fecha de vencimiento</span>
              <input type="date" value={form.exp} onChange={e=>setForm({...form,exp:e.target.value})}/>
            </label>
            <label className="ad-field"><span className="ad-field__label">📊 Cantidad / notas</span>
              <input value={form.qty} onChange={e=>setForm({...form,qty:e.target.value})} placeholder="Ej: 2 botellas"/>
            </label>
            <label className="ad-field"><span className="ad-field__label">💰 Precio (opcional)</span>
              <input type="number" value={form.precio} onChange={e=>setForm({...form,precio:e.target.value})} placeholder="Ej: 4500"/>
            </label>
            <label className="ad-field"><span className="ad-field__label">🔔 Alertar con anticipación</span>
              <select value={form.alert} onChange={e=>setForm({...form,alert:parseInt(e.target.value)})}>
                <option value={3}>3 días antes</option><option value={7}>7 días antes</option><option value={14}>14 días antes</option><option value={30}>30 días antes</option>
              </select>
            </label>
          </div>
          <button className="ad-btn" style={{opacity:guardando?0.6:1}} onClick={guardar} disabled={guardando}>{guardando?'Guardando...':'Guardar'}</button>
          {editId&&(
            <div>
              <button className="ad-btn ad-btn--ghost" style={{opacity:guardando?0.6:1}} onClick={()=>marcarEstado('consumido')} disabled={guardando}>✓ Marcar como consumido</button>
              <button className="ad-btn ad-btn--ghost" style={{opacity:guardando?0.6:1}} onClick={()=>marcarEstado('descartado')} disabled={guardando}>🗑 Marcar como descartado</button>
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
      {compartir&&<CompartirModal activos={activos} onClose={()=>setCompartir(false)}/>}
      {cuentaSheet}
      <div className="ad-screen">

        {tab==='home'&&(
          <>
            <header className="ad-hero">
              <div className="ad-hero-row">
                <LOGO/>
                <div style={{minWidth:0}}>
                  <p className="ad-hello">{saludo}, {nombreCorto}</p>
                  <h1 className="ad-title">Al Día</h1>
                </div>
                {avatarBtn}
              </div>
            </header>
            <div className="ad-overlap">
              {correoEnviado&&<div className="ad-note" style={{marginBottom:10}}>📧 Te enviamos un correo con los productos por vencer</div>}
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
                        <span className={`ad-pill ${pillClass(destSt)}`}>{pillIcon(destSt)} {daysLabel(destD)}</span>
                      </div>
                      <button className="ad-urgent__main" onClick={()=>abrirEditar(dest)}>
                        <span className="ad-icon">{CATS[dest.cat]||'📦'}</span>
                        <span style={{minWidth:0}}>
                          <span className="ad-urgent__name">{dest.name}</span>
                          <span className="ad-muted" style={{display:'block'}}>{destTexto} · {dest.cat}</span>
                        </span>
                      </button>
                      <div className="ad-btn-row">
                        <button className="ad-btn ad-btn--sm" onClick={()=>marcarProducto(dest.id,'consumido')} disabled={guardando}>✓ Ya la usé</button>
                        <button className="ad-btn ad-btn--ghost ad-btn--sm" onClick={()=>marcarProducto(dest.id,'descartado')} disabled={guardando}>Botar</button>
                      </div>
                    </div>
                  ):(
                    <div className="ad-card ad-urgent" style={{textAlign:'center'}}>
                      <div style={{fontSize:40}}>🌿</div>
                      <h2 className="ad-section" style={{margin:'6px 0 4px'}}>Todo al día</h2>
                      <p className="ad-muted">Ningún producto está por vencer. ¡Buen trabajo!</p>
                    </div>
                  )}
                  <div className="ad-tags">
                    <span className="ad-pill ad-pill--danger">{expired} vencido{expired===1?'':'s'}</span>
                    <span className="ad-pill ad-pill--warn">{danger+warn} por vencer</span>
                    <span className="ad-pill ad-pill--ok">{ok} al día</span>
                  </div>
                  <div className="ad-sechead">
                    <h2 className="ad-section">Mis productos</h2>
                    <button className="ad-link" onClick={()=>setCompartir(true)}>📤 Compartir</button>
                  </div>
                  <div className="ad-filters">
                    {cats.map(c=><button key={c} className="ad-chip" aria-pressed={filtro===c} onClick={()=>setFiltro(c)}>{c}</button>)}
                  </div>
                  <input className="ad-search" value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="🔍 Buscar producto..."/>
                  <div key={listKey}>
                    {filtered.length===0&&<div className="ad-card ad-pad ad-muted" style={{textAlign:'center'}}>Sin resultados.</div>}
                    {filtered.map((p,i)=><ProductCard key={p.id} p={p} index={i} onClick={()=>abrirEditar(p)}/>)}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {tab==='estadisticas'&&(
          <>
            <header className="ad-hero ad-hero--sm">
              <div className="ad-hero-row"><h1 className="ad-title">Estadísticas</h1>{avatarBtn}</div>
            </header>
            <div className="ad-overlap ad-stack">
              <SimpleCharts descartados={descartados} consumidos={consumidos} catStats={catStats}/>
              <div className="ad-grid2">
                <div className="ad-card ad-pad"><p className="ad-muted">Consumidos</p><div className="ad-big" style={{color:'var(--green)'}}>{consumidos.length}</div></div>
                <div className="ad-card ad-pad"><p className="ad-muted">Descartados</p><div className="ad-big" style={{color:'var(--warn-ink)'}}>{descartados.length}</div></div>
              </div>
              <div className="ad-card ad-pad">
                <p className="ad-muted" style={{marginBottom:6}}>💰 Comparativa mes a mes</p>
                <div className="ad-big" style={{color:cambioMesAMes<=0?'var(--green)':'var(--danger)'}}>{cambioMesAMes>0?'+':''}{cambioMesAMes}%</div>
                <p className="ad-muted" style={{marginTop:8}}>Este mes: ${Math.round(pérdidaActual).toLocaleString('es-CO')} | Mes anterior: ${Math.round(pérdidaAnterior).toLocaleString('es-CO')}</p>
                <p className="ad-muted" style={{marginTop:4}}>{cambioMesAMes<0?'✓ ¡Mejorando! Desperdiciaste menos':cambioMesAMes>0?'⚠ Aumentó el desperdicio':'→ Igual que el mes anterior'}</p>
              </div>
              <div className="ad-card ad-pad">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <p className="ad-muted">🎯 Tu meta de desperdicio</p>
                  <button className="ad-link" onClick={()=>{setEditandoMeta(!editandoMeta);setValorMeta(meta?meta.toString():'');}}>{editandoMeta?'Cancelar':'Editar'}</button>
                </div>
                {!editandoMeta?(
                  meta?(<>
                    <div className="ad-big" style={{fontSize:'1.375rem',color:pérdidaActual<=meta?'var(--green)':'var(--danger)'}}>${Math.round(pérdidaActual).toLocaleString('es-CO')} / ${Math.round(meta).toLocaleString('es-CO')}</div>
                    <div className={`ad-bar ad-bar--lg ${pérdidaActual<=meta?'':'ad-bar--danger'}`}><span style={{width:`${Math.min(100,(pérdidaActual/meta)*100)}%`,transition:'width 0.3s'}}/></div>
                    <p className="ad-muted" style={{marginTop:8}}>{pérdidaActual<=meta?'✓ ¡Lo lograste!':`⚠ Vas $${Math.round(pérdidaActual-meta).toLocaleString('es-CO')} por encima`}</p>
                  </>):<p className="ad-muted" style={{fontStyle:'italic'}}>Sin meta establecida. ¡Define una para motivarte!</p>
                ):(
                  <div style={{display:'flex',gap:8}}>
                    <input className="ad-search" style={{marginBottom:0,flex:1}} type="number" value={valorMeta} onChange={e=>setValorMeta(e.target.value)} placeholder="Ej: 50000"/>
                    <button className="ad-btn ad-btn--sm" style={{width:'auto'}} onClick={guardarMeta}>Guardar</button>
                  </div>
                )}
              </div>
              <div className="ad-card ad-pad">
                <p className="ad-muted" style={{marginBottom:6}}>Dinero perdido en descartados</p>
                <div className="ad-big" style={{color:'var(--danger)'}}>${Math.round(perdida).toLocaleString('es-CO')}</div>
                <p className="ad-muted" style={{marginTop:4}}>Basado en los precios que registraste</p>
              </div>
              <div className="ad-card ad-pad">
                <p className="ad-muted" style={{marginBottom:6}}>Dinero aprovechado en consumidos</p>
                <div className="ad-big" style={{color:'var(--green)'}}>${Math.round(ahorro).toLocaleString('es-CO')}</div>
                <p className="ad-muted" style={{marginTop:4}}>Productos que consumiste a tiempo</p>
              </div>
              {catStats.length>0&&(
                <div className="ad-card ad-pad">
                  <p className="ad-muted" style={{marginBottom:12}}>📊 Categorías con más desperdicios</p>
                  {catStats.map(c=>(
                    <div key={c.cat} style={{marginBottom:14}}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <span style={{fontSize:20}}>{CATS[c.cat]}</span>
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
                  <p className="ad-muted" style={{marginBottom:10}}>💡 Recomendaciones inteligentes</p>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {catStats.length>0&&catStats[0].pctDesperdicio>50&&<div className="ad-note ad-note--danger">⚠ {catStats[0].cat}: {catStats[0].pctDesperdicio}% de desperdicio.</div>}
                    {consumidos.length>descartados.length&&<div className="ad-note">✓ Mejorando: consumes más de lo que descartas. ¡Sigue así!</div>}
                    {cambioMesAMes<0&&<div className="ad-note">🎯 Progreso: este mes reduciste el desperdicio {Math.abs(cambioMesAMes)}%.</div>}
                    {meta&&pérdidaActual>meta&&<div className="ad-note ad-note--warn">🚀 Meta: necesitas reducir ${Math.round(pérdidaActual-meta).toLocaleString('es-CO')} para alcanzarla.</div>}
                  </div>
                </div>
              )}
              {historial.length===0&&<div className="ad-card ad-pad ad-muted" style={{textAlign:'center'}}>📊 Aún no hay datos.</div>}
            </div>
          </>
        )}

        {tab==='historial'&&(
          <>
            <header className="ad-hero ad-hero--sm">
              <div className="ad-hero-row"><h1 className="ad-title">Historial</h1>{avatarBtn}</div>
            </header>
            <div className="ad-overlap ad-stack">
              {historial.length>0&&(
                <div className="ad-card ad-pad">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <p style={{fontWeight:700}}>📊 Estadísticas del historial</p>
                    <button className="ad-link ad-link--danger" onClick={eliminarTodoHistorial}>Borrar todo</button>
                  </div>
                  <div className="ad-grid2" style={{marginBottom:16}}>
                    {[{n:consumidos.length,l:'Consumidos',c:'var(--green)'},{n:descartados.length,l:'Descartados',c:'var(--danger)'},{n:historial.length,l:'Total',c:'var(--text)'},{n:Math.round((consumidos.length/historial.length)*100)+'%',l:'% Consumidos',c:'var(--green)'}].map(s=>(
                      <div key={s.l} style={{textAlign:'center'}}><div className="ad-big" style={{fontSize:'1.375rem',color:s.c}}>{s.n}</div><div className="ad-muted" style={{fontSize:'.8125rem'}}>{s.l}</div></div>
                    ))}
                  </div>
                  <p style={{fontWeight:700,marginBottom:8}}>Distribución por categoría</p>
                  <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:14}}>
                    {Object.entries(historial.reduce((acc,p)=>{acc[p.cat]=(acc[p.cat]||0)+1;return acc;},{})).sort(([,a],[,b])=>b-a).slice(0,5).map(([cat,count])=>(
                      <div key={cat} style={{display:'flex',alignItems:'center',gap:10}}>
                        <span style={{fontSize:18,width:26}}>{CATS[cat]||'📦'}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:'.875rem',fontWeight:700}}>{cat}</span><span className="ad-muted">{count}</span></div>
                          <div className="ad-bar" style={{marginTop:6}}><span style={{width:`${(count/historial.length)*100}%`}}/></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="ad-note">
                    💰 Ahorro estimado: ${historial.filter(p=>p.estado==='consumido'&&p.precio).reduce((sum,p)=>sum+Number(p.precio),0).toLocaleString('es-CO')}
                    <div style={{fontSize:'.75rem',fontWeight:400,marginTop:2}}>Basado en productos consumidos con precio registrado</div>
                  </div>
                </div>
              )}
              {historial.length===0&&<div className="ad-card ad-pad ad-muted" style={{textAlign:'center'}}>No hay productos en el historial aún.</div>}
              {[...historial].sort((a,b)=>new Date(b.fechaEstado)-new Date(a.fechaEstado)).map(p=>(
                <div key={p.id} className="ad-card ad-pad">
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <span className="ad-icon">{CATS[p.cat]||'📦'}</span>
                    <div className="ad-item__body">
                      <div className="ad-item__name">{p.name}</div>
                      <div className="ad-muted" style={{fontSize:'.8125rem'}}>{p.cat}{p.precio?` · $${Number(p.precio).toLocaleString('es-CO')}`:''}</div>
                    </div>
                    <span className={`ad-pill ${p.estado==='consumido'?'ad-pill--ok':'ad-pill--warn'}`}>{p.estado==='consumido'?'✓ Consumido':'🗑 Descartado'}</span>
                  </div>
                  <div className="ad-btn-row" style={{marginTop:12}}>
                    <button className="ad-btn ad-btn--ghost ad-btn--sm" onClick={()=>restaurar(p.id)}>↩ Restaurar</button>
                    <button className="ad-btn ad-btn--danger ad-btn--sm" onClick={()=>eliminarDelHistorial(p.id)}>🗑 Eliminar</button>
                  </div>
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