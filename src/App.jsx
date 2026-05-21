import { useState, useEffect, useRef } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, writeBatch } from "firebase/firestore";
import emailjs from "@emailjs/browser";
import Login from "./Login";
import "./index.css";

const EMAILJS_SERVICE = "service_vi35bf4";
const EMAILJS_TEMPLATE = "template_ndvpdby";
const EMAILJS_KEY = "rt3CGRFqu1i6H69tO";

function Splash({ onDone }) {
  const [fase, setFase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setFase(1), 100);
    const t2 = setTimeout(() => setFase(2), 600);
    const t3 = setTimeout(() => setFase(3), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'var(--bg)',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',gap:24}}>
      <div style={{transform:fase>=1?'scale(1)':'scale(0.2)',opacity:fase>=1?1:0,transition:'transform 0.6s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease'}}>
        <svg width="100" height="100" viewBox="0 0 80 80" style={{filter:'drop-shadow(0 4px 16px rgba(45,181,78,0.4))'}}>
          <defs>
            <linearGradient id="splashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:'#2DB54E'}}/><stop offset="50%" style={{stopColor:'#30D158'}}/><stop offset="100%" style={{stopColor:'#1E8E3E'}}/>
            </linearGradient>
          </defs>
          <circle cx="40" cy="40" r="36" fill="url(#splashGrad)" stroke="#fff" strokeWidth="1.5"/>
          <path d="M40 20 C40 20 52 28 52 38 C52 48 46 54 40 56 C34 54 28 48 28 38 C28 28 40 20 40 20Z" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
          <polyline points="33,38 38,43 47,32" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M25 50 Q40 45 55 50" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.6"/>
        </svg>
      </div>
      <div style={{opacity:fase>=2?1:0,transform:fase>=2?'translateY(0)':'translateY(16px)',transition:'opacity 0.5s ease, transform 0.5s ease',textAlign:'center'}}>
        <div style={{fontSize:38,fontWeight:700,color:'var(--text)',letterSpacing:-1}}>Al Día</div>
        <div style={{fontSize:15,color:'var(--text2)',marginTop:8}}>Controla lo que tienes en casa</div>
      </div>
      <div style={{position:'absolute',bottom:60,opacity:fase>=3?1:0,transition:'opacity 0.4s ease',display:'flex',flexDirection:'column',alignItems:'center',gap:16}}>
        <div style={{display:'flex',gap:8}}>
          {[0,1,2].map(i=>(
            <div key={i} style={{width:i===1?24:8,height:8,borderRadius:999,background:i===1?'var(--green)':'var(--border)',transition:'all 0.3s'}}/>
          ))}
        </div>
        <button onClick={onDone} style={{height:46,padding:'0 32px',borderRadius:13,background:'var(--green)',color:'#fff',border:'none',fontSize:15,fontWeight:600,cursor:'pointer'}}>
          Empezar →
        </button>
      </div>
    </div>
  );
}

function EmptyState({ onAgregar, onCategoria, onAgregarEjemplo }) {
  const ejemplos = [
    {name:'Leche entera',cat:'Lácteos',exp:'2025-06-15'},
    {name:'Pollo fresco',cat:'Carnes',exp:'2025-06-10'},
    {name:'Zanahorias',cat:'Frutas y verduras',exp:'2025-06-20'},
    {name:'Ibuprofeno',cat:'Medicamentos',exp:'2026-12-30'},
    {name:'Jugo natural',cat:'Bebidas',exp:'2025-06-12'},
  ];
  return (
    <div style={{padding:'24px 20px',display:'flex',flexDirection:'column',alignItems:'center',gap:16}}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <defs>
          <radialGradient id="pulseGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#30D158" stopOpacity="0.16"/>
            <stop offset="100%" stopColor="#30D158" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="70" cy="70" r="42" fill="url(#pulseGrad)">
          <animate attributeName="r" values="42;52;42" dur="2.6s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.16;0.06;0.16" dur="2.6s" repeatCount="indefinite"/>
        </circle>
        <circle cx="70" cy="70" r="55" fill="var(--card)"/>
        <circle cx="70" cy="70" r="42" fill="var(--input)"/>
        <rect x="44" y="48" width="52" height="44" rx="6" fill="none" stroke="#2DB54E" strokeWidth="2"/>
        <line x1="44" y1="58" x2="96" y2="58" stroke="#2DB54E" strokeWidth="1.5"/>
        <line x1="52" y1="44" x2="52" y2="52" stroke="#2DB54E" strokeWidth="2" strokeLinecap="round"/>
        <line x1="88" y1="44" x2="88" y2="52" stroke="#2DB54E" strokeWidth="2" strokeLinecap="round"/>
        <rect x="52" y="65" width="12" height="10" rx="2" fill="#2DB54E" opacity="0.3"/>
        <rect x="68" y="65" width="12" height="10" rx="2" fill="#2DB54E" opacity="0.6"/>
        <rect x="84" y="65" width="8" height="10" rx="2" fill="#2DB54E"/>
        <circle cx="105" cy="38" r="12" fill="#30D158"/>
        <line x1="105" y1="33" x2="105" y2="38" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
        <line x1="105" y1="38" x2="108" y2="40" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="35" cy="100" r="8" fill="#FF9500" opacity="0.8"/>
        <line x1="35" y1="96" x2="35" y2="100" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="35" cy="100" r="1.5" fill="#fff"/>
      </svg>
      <div style={{fontSize:19,fontWeight:700,color:'var(--text)',textAlign:'center',letterSpacing:-0.3}}>¡Bienvenido a Al Día!</div>
      <div style={{fontSize:13,color:'var(--text2)',textAlign:'center',lineHeight:1.6,maxWidth:280}}>Empieza registrando tus productos y nunca más se te vencerá nada en casa.</div>
      <div style={{width:'100%',display:'flex',flexDirection:'column',gap:8}}>
        {[
          {n:'1',title:'Agrega un producto',sub:'con su fecha de vencimiento'},
          {n:'2',title:'Recibe alertas',sub:'antes de que venza'},
          {n:'3',title:'Marca como consumido',sub:'y lleva el control'},
        ].map(s=>(
          <div key={s.n} style={{display:'flex',alignItems:'center',gap:10,background:'var(--card)',borderRadius:12,padding:'10px 14px',border:'0.5px solid var(--border2)'}}>
            <div style={{width:26,height:26,borderRadius:'50%',background:'var(--green)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',flexShrink:0}}>{s.n}</div>
            <div>
              <div style={{fontSize:13,fontWeight:500,color:'var(--text)'}}>{s.title}</div>
              <div style={{fontSize:11,color:'var(--text2)',marginTop:1}}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onAgregar} style={{width:'100%',height:48,borderRadius:13,background:'var(--green)',color:'#fff',border:'none',fontSize:15,fontWeight:600,cursor:'pointer'}}>
        ✨ Agregar mi primer producto
      </button>
      <div style={{width:'100%',borderTop:'0.5px solid var(--border2)',paddingTop:16}}>
        <div style={{fontSize:12,color:'var(--text2)',marginBottom:10,textAlign:'center',fontWeight:500}}>💡 O prueba con estos ejemplos</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {ejemplos.map((ej,i)=>(
            <div key={i} style={{background:'var(--card)',borderRadius:12,padding:12,border:'0.5px solid var(--border2)'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <div style={{width:36,height:36,borderRadius:9,background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{CATS[ej.cat]}</div>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{ej.name}</div>
                  <div style={{fontSize:11,color:'var(--text2)',marginTop:2}}>{ej.cat}</div>
                </div>
              </div>
              <button onClick={()=>onAgregarEjemplo(ej)} style={{width:'100%',height:32,borderRadius:8,background:'var(--green)',color:'#fff',border:'none',fontSize:12,fontWeight:600,cursor:'pointer'}}>+ Agregar</button>
            </div>
          ))}
        </div>
      </div>
      <div style={{width:'100%'}}>
        <div style={{fontSize:12,color:'var(--text2)',marginBottom:8,textAlign:'center'}}>O empieza por categoría</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {[{cat:'Lácteos',emoji:'🥛'},{cat:'Carnes',emoji:'🥩'},{cat:'Medicamentos',emoji:'💊'},{cat:'Bebidas',emoji:'🧃'}].map(c=>(
            <button key={c.cat} onClick={()=>onCategoria(c.cat)} style={{height:40,borderRadius:10,background:'var(--card)',border:'0.5px solid var(--border2)',fontSize:13,color:'var(--text2)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
              {c.emoji} {c.cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const LOGO = () => (
  <svg width="40" height="40" viewBox="0 0 80 80" style={{filter:'drop-shadow(0 2px 8px rgba(45,181,78,0.3))'}}>
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor:'#2DB54E',stopOpacity:1}}/><stop offset="50%" style={{stopColor:'#30D158',stopOpacity:1}}/><stop offset="100%" style={{stopColor:'#1E8E3E',stopOpacity:1}}/>
      </linearGradient>
      <filter id="glow"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <circle cx="40" cy="40" r="36" fill="url(#logoGrad)" stroke="#fff" strokeWidth="1.5" filter="url(#glow)"/>
    <path d="M40 20 C40 20 52 28 52 38 C52 48 46 54 40 56 C34 54 28 48 28 38 C28 28 40 20 40 20Z" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="35" cy="35" r="2" fill="#fff" opacity="0.9"/>
    <circle cx="40" cy="40" r="1.5" fill="#fff" opacity="0.8"/>
    <circle cx="45" cy="38" r="1" fill="#fff" opacity="0.7"/>
    <polyline points="33,38 38,43 47,32" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M25 50 Q40 45 55 50" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.6"/>
  </svg>
);

function SimpleCharts({descartados, consumidos, catStats}){
  const total = Math.max(1, descartados.length + consumidos.length);
  const maxCat = catStats.length?Math.max(...catStats.map(c=>c.descartados||0)):1;
  return (
    <div style={{display:'flex',gap:12,flexDirection:'column'}}>
      <div style={{background:'var(--card)',padding:12,borderRadius:12,border:'0.5px solid var(--border2)'}}>
        <div style={{fontSize:12,color:'var(--text2)',marginBottom:8}}>🎯 Consumidos vs Descartados</div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{flex:1,display:'flex',height:14,borderRadius:8,overflow:'hidden'}}>
            <div style={{width:`${Math.round((consumidos.length/total)*100)}%`,background:'linear-gradient(90deg,var(--green),#30D158)'}}/>
            <div style={{width:`${Math.round((descartados.length/total)*100)}%`,background:'#FF3B30'}}/>
          </div>
          <div style={{fontSize:12,color:'var(--text2)',minWidth:100,textAlign:'right'}}>{consumidos.length} ✓ / {descartados.length} ✗</div>
        </div>
        <div style={{display:'flex',gap:12,marginTop:8}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:12,height:12,background:'linear-gradient(90deg,var(--green),#30D158)',borderRadius:3}}/><div style={{fontSize:12,color:'var(--text2)'}}>Consumidos</div></div>
          <div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:12,height:12,background:'#FF3B30',borderRadius:3}}/><div style={{fontSize:12,color:'var(--text2)'}}>Descartados</div></div>
        </div>
      </div>
      {catStats.length>0 && (
        <div style={{background:'var(--card)',padding:12,borderRadius:12,border:'0.5px solid var(--border2)'}}>
          <div style={{fontSize:12,color:'var(--text2)',marginBottom:8}}>📊 Top categorías</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {catStats.slice(0,5).map(c=>{
              const pct = maxCat>0?Math.round((c.descartados/maxCat)*100):0;
              return (
                <div key={c.cat} style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:28,fontSize:14}}>{CATS[c.cat]||'📦'}</div>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontSize:12,color:'var(--text)',fontWeight:500}}>{c.cat}</span>
                      <span style={{fontSize:11,color:'var(--text2)'}}>{c.descartados}</span>
                    </div>
                    <div style={{width:'100%',height:6,background:'var(--input)',borderRadius:4,overflow:'hidden'}}>
                      <div style={{width:`${pct}%`,height:'100%',background:'linear-gradient(90deg,var(--green),#30D158)'}}/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const CATS = {
  'Lácteos':'🥛','Carnes':'🥩','Frutas y verduras':'🥦','Granos y cereales':'🌾',
  'Enlatados':'🥫','Bebidas':'🧃','Medicamentos':'💊','Limpieza':'🧴','Otro':'📦'
};

const today = new Date();
today.setHours(0,0,0,0);

function getSaludo(){
  const h = new Date().getHours();
  if(h < 12) return '☀️ Buenos días';
  if(h < 18) return '🌤️ Buenas tardes';
  return '🌙 Buenas noches';
}

function getBarWidth(days, alert){
  if(days < 0) return 100;
  if(days === 0) return 95;
  if(days <= 3) return 75;
  if(days <= alert) return 45;
  if(days <= 30) return 20;
  return 8;
}

function getBarColor(st){
  if(st==='expired') return '#FF3B30';
  if(st==='danger') return '#FF3B30';
  if(st==='warn') return '#FF9500';
  return '#2DB54E';
}

function getCardBg(st){
  if(st==='expired') return 'rgba(255,59,48,0.07)';
  if(st==='danger') return 'rgba(255,59,48,0.05)';
  if(st==='warn') return 'rgba(255,149,0,0.05)';
  return 'rgba(45,181,78,0.04)';
}

function getCardBorder(st){
  if(st==='expired') return '0.5px solid rgba(255,59,48,0.25)';
  if(st==='danger') return '0.5px solid rgba(255,59,48,0.15)';
  if(st==='warn') return '0.5px solid rgba(255,149,0,0.2)';
  return '0.5px solid rgba(45,181,78,0.15)';
}

function getBadgeBg(st){
  if(st==='expired'||st==='danger') return '#FF3B30';
  if(st==='warn') return '#FF9500';
  return 'var(--green)';
}

const HomeIcon = (active) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={active?"url(#navGrad)":"var(--text2)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="9,22 9,12 15,12 15,22" stroke={active?"url(#navGrad)":"var(--text2)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <defs><linearGradient id="navGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#2DB54E"/><stop offset="100%" stopColor="#30D158"/></linearGradient></defs>
  </svg>
);

const StatsIcon = (active) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke={active?"url(#navGrad)":"var(--text2)"} strokeWidth="2"/>
    <line x1="7" y1="9" x2="12" y2="9" stroke={active?"url(#navGrad)":"var(--text2)"} strokeWidth="2" strokeLinecap="round"/>
    <line x1="16" y1="9" x2="16" y2="9" stroke={active?"url(#navGrad)":"var(--text2)"} strokeWidth="2" strokeLinecap="round"/>
    <line x1="7" y1="13" x2="10" y2="13" stroke={active?"url(#navGrad)":"var(--text2)"} strokeWidth="2" strokeLinecap="round"/>
    <line x1="14" y1="13" x2="17" y2="13" stroke={active?"url(#navGrad)":"var(--text2)"} strokeWidth="2" strokeLinecap="round"/>
    <line x1="7" y1="17" x2="15" y2="17" stroke={active?"url(#navGrad)":"var(--text2)"} strokeWidth="2" strokeLinecap="round"/>
    <defs><linearGradient id="navGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#2DB54E"/><stop offset="100%" stopColor="#30D158"/></linearGradient></defs>
  </svg>
);

const HistoryIcon = (active) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke={active?"url(#navGrad)":"var(--text2)"} strokeWidth="2"/>
    <polyline points="12,6 12,12 16,14" stroke={active?"url(#navGrad)":"var(--text2)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <defs><linearGradient id="navGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#2DB54E"/><stop offset="100%" stopColor="#30D158"/></linearGradient></defs>
  </svg>
);

function daysUntil(dateStr){
  const d = new Date(dateStr + 'T12:00:00');
  d.setHours(0,0,0,0);
  return Math.round((d - today) / 86400000);
}

function status(p){
  const d = daysUntil(p.exp);
  if(d < 0) return 'expired';
  if(d <= 3) return 'danger';
  if(d <= p.alert) return 'warn';
  return 'ok';
}

function daysLabel(d){
  if(d < 0) return 'Vencido';
  if(d === 0) return 'Hoy';
  if(d === 1) return 'Mañana';
  return `${d} días`;
}

const S = {
  screen:{maxWidth:480,margin:'0 auto',minHeight:'100vh',background:'var(--bg)',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',paddingBottom:70},
  header:{background:'var(--bg2)',padding:'12px 20px 14px',borderBottom:'0.5px solid var(--border)'},
  avatar:{width:36,height:36,borderRadius:'50%',background:'var(--green)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:500,color:'#fff',cursor:'pointer',flexShrink:0,overflow:'hidden',padding:0},
  titleRow:{display:'flex',alignItems:'center',gap:10},
  title:{fontSize:26,fontWeight:700,color:'var(--text)',letterSpacing:-0.5},
  statsGrid:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,padding:'10px 14px 4px'},
  statCard:{background:'var(--card)',borderRadius:13,padding:'10px 12px',border:'0.5px solid var(--border2)'},
  statLabel:{fontSize:11,color:'var(--text2)',marginBottom:4},
  alertBox:{margin:'6px 14px',borderRadius:12,padding:'9px 12px',display:'flex',alignItems:'flex-start',gap:8,background:'#fff2f2',border:'0.5px solid rgba(255,59,48,0.2)'},
  sectionHeader:{padding:'12px 18px 6px',display:'flex',justifyContent:'space-between',alignItems:'center'},
  sectionTitle:{fontSize:18,fontWeight:600,color:'var(--text)',letterSpacing:-0.3},
  filters:{display:'flex',gap:6,padding:'2px 14px 10px',overflowX:'auto'},
  searchWrap:{padding:'0 14px 10px'},
  search:{width:'100%',height:34,borderRadius:10,border:'0.5px solid var(--border)',padding:'0 12px',fontSize:13,background:'var(--card)',boxSizing:'border-box',color:'var(--text)'},
  plist:{display:'flex',flexDirection:'column',gap:7,padding:'0 14px'},
  iconWrap:{width:36,height:36,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0},
  fabWrap:{padding:'12px 14px 24px'},
  fab:{width:'100%',height:46,borderRadius:13,background:'var(--green)',color:'#fff',border:'none',fontSize:15,fontWeight:600,cursor:'pointer'},
  formWrap:{maxWidth:480,margin:'0 auto',minHeight:'100vh',background:'var(--bg)',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',paddingBottom:70},
  formHeader:{background:'var(--bg2)',padding:'14px 20px',borderBottom:'0.5px solid var(--border)',display:'flex',alignItems:'center',gap:12},
  backBtn:{background:'none',border:'none',fontSize:16,color:'var(--green)',cursor:'pointer',fontWeight:500},
  formTitle:{fontSize:17,fontWeight:600,color:'var(--text)'},
  formBody:{padding:'16px 14px',display:'flex',flexDirection:'column',gap:12},
  formSection:{background:'var(--card)',borderRadius:13,overflow:'hidden',border:'0.5px solid var(--border2)'},
  formRow:{padding:'11px 14px',borderBottom:'0.5px solid var(--border2)',display:'flex',flexDirection:'column',gap:4},
  formRowLast:{padding:'11px 14px',display:'flex',flexDirection:'column',gap:4},
  formLabel:{fontSize:12,color:'var(--text2)'},
  formInput:{fontSize:15,color:'var(--text)',border:'none',outline:'none',background:'transparent',width:'100%'},
  formSelect:{fontSize:15,color:'var(--text)',border:'none',outline:'none',background:'transparent',width:'100%'},
  saveBtn:{width:'100%',height:46,borderRadius:13,background:'var(--green)',color:'#fff',border:'none',fontSize:15,fontWeight:600,cursor:'pointer'},
  delBtn:{width:'100%',height:46,borderRadius:13,background:'var(--card)',color:'#FF3B30',border:'0.5px solid rgba(255,59,48,0.3)',fontSize:15,cursor:'pointer'},
  navbar:{position:'fixed',bottom:0,left:0,right:0,maxWidth:480,margin:'0 auto',height:60,background:'var(--bg2)',borderTop:'0.5px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-around',zIndex:50},
  navBtn:{display:'flex',flexDirection:'column',alignItems:'center',gap:2,background:'none',border:'none',cursor:'pointer',padding:'6px 16px'},
  navIco:{display:'flex',alignItems:'center',justifyContent:'center',width:24,height:24},
  navLbl:{fontSize:10,fontWeight:500},
};

function Navbar({ tab, setTab, setPantalla }) {
  const items = [{id:'home',ico:HomeIcon,lbl:'Inicio'},{id:'estadisticas',ico:StatsIcon,lbl:'Estadísticas'},{id:'historial',ico:HistoryIcon,lbl:'Historial'}];
  return (
    <div style={S.navbar}>
      {items.map(it=>(
        <button key={it.id} style={S.navBtn} onClick={()=>{setTab(it.id);setPantalla&&setPantalla('');}}>
          <div style={S.navIco}>{it.ico(tab===it.id)}</div>
          <span style={{...S.navLbl,color:tab===it.id?'var(--green)':'var(--text2)'}}>{it.lbl}</span>
        </button>
      ))}
    </div>
  );
}

function Widget({ activos }) {
  const hoy = activos.filter(p=>daysUntil(p.exp)===0).length;
  const semana = activos.filter(p=>{const d=daysUntil(p.exp);return d>0&&d<=7;}).length;
  const vencidos = activos.filter(p=>daysUntil(p.exp)<0).length;
  const bien = activos.filter(p=>daysUntil(p.exp)>7).length;
  const total = activos.length;
  const pctBien = total>0?Math.round((bien/total)*100):100;
  return (
    <div style={{margin:'10px 14px 4px',background:'var(--card)',borderRadius:16,padding:'14px 16px',border:'0.5px solid var(--border2)'}}>
      <div style={{fontSize:12,color:'var(--text2)',marginBottom:10,fontWeight:500}}>RESUMEN DE HOY</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:12}}>
        {[
          {n:vencidos,l:'Vencidos',c:'#FF3B30',bg:'#fff2f2'},
          {n:hoy,l:'Hoy',c:'#FF9500',bg:'#fff8ee'},
          {n:semana,l:'Esta semana',c:'#007AFF',bg:'#f0f5ff'},
          {n:bien,l:'Al día',c:'var(--green)',bg:'#f0fff4'},
        ].map(s=>(
          <div key={s.l} style={{background:s.bg,borderRadius:10,padding:'8px 4px',textAlign:'center'}}>
            <div style={{fontSize:20,fontWeight:700,color:s.c}}>{s.n}</div>
            <div style={{fontSize:10,color:s.c,marginTop:2,opacity:0.8}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{fontSize:11,color:'var(--text2)',marginBottom:4}}>{pctBien}% de tus productos están al día</div>
      <div style={{height:6,borderRadius:3,background:'var(--input)',overflow:'hidden'}}>
        <div style={{height:6,borderRadius:3,background:'var(--green)',width:`${pctBien}%`,transition:'width 0.5s'}}/>
      </div>
    </div>
  );
}

// Tarjeta de producto animada
function ProductCard({ p, index, onClick }) {
  const [visible, setVisible] = useState(false);
  const [barW, setBarW] = useState(0);
  const d = daysUntil(p.exp);
  const st = status(p);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), index * 80);
    const t2 = setTimeout(() => setBarW(getBarWidth(d, p.alert)), index * 80 + 300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius:13,
        padding:'10px 12px',
        background: getCardBg(st),
        border: getCardBorder(st),
        cursor:'pointer',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(14px)',
        transition:'opacity 0.4s ease, transform 0.4s ease',
      }}
    >
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:7}}>
        <div style={{...S.iconWrap,background:'var(--card)'}}>
          <span style={{fontSize:18}}>{CATS[p.cat]||'📦'}</span>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:500,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.name}</div>
          <div style={{fontSize:11,color:'var(--text2)',marginTop:1}}>{p.cat}{p.qty?` · ${p.qty}`:''}{p.precio?` · $${parseFloat(p.precio).toLocaleString('es-CO')}`:''}</div>
        </div>
        <div style={{padding:'4px 10px',borderRadius:999,background:getBadgeBg(st),color:'#fff',fontSize:12,fontWeight:600,flexShrink:0,textAlign:'center'}}>
          {daysLabel(d)}
        </div>
      </div>
      <div style={{width:'100%',height:4,borderRadius:2,background:'var(--input)',overflow:'hidden'}}>
        <div style={{height:4,borderRadius:2,background:getBarColor(st),width:`${barW}%`,transition:'width 0.8s ease'}}/>
      </div>
    </div>
  );
}

export default function App() {
  const [splash, setSplash] = useState(() => !localStorage.getItem('aldia_splash_visto'));
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [products, setProducts] = useState([]);
  const [tab, setTab] = useState('home');
  const [pantalla, setPantalla] = useState('');
  const [filtro, setFiltro] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({name:'',cat:'Lácteos',exp:'',qty:'',alert:7,precio:''});
  const [guardando, setGuardando] = useState(false);
  const [correoEnviado, setCorreoEnviado] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [meta, setMeta] = useState(null);
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [valorMeta, setValorMeta] = useState('');
  const [listKey, setListKey] = useState(0);
  const correoEnviadoHoy = useRef(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => { setUsuario(user); setCargando(false); });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!usuario) return;
    const q = query(collection(db, "productos"), where("uid", "==", usuario.uid));
    const unsub = onSnapshot(q, (snap) => {
      const prods = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(prods);
      setListKey(k => k + 1);
      if (!correoEnviadoHoy.current) {
        const urgentes = prods.filter(p => !p.estado && (status(p)==='expired'||status(p)==='danger'||status(p)==='warn'));
        if (urgentes.length > 0) {
          correoEnviadoHoy.current = true;
          const lista = urgentes.map(p=>`• ${p.name} (${p.cat}) — ${daysLabel(daysUntil(p.exp))}`).join('\n');
          emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
            to_email: usuario.email,
            nombre: usuario.displayName || usuario.email,
            lista_productos: lista,
          }, EMAILJS_KEY).then(() => {
            setCorreoEnviado(true);
            setTimeout(() => setCorreoEnviado(false), 5000);
          }).catch(e => console.error(e));
        }
      }
    });
    return () => unsub();
  }, [usuario]);

  useEffect(() => {
    function handleClick(e){ if(menuRef.current && !menuRef.current.contains(e.target)) setMenuAbierto(false); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if(!usuario) return;
    const m = localStorage.getItem(`meta_${usuario.uid}`);
    if(m) setMeta(parseFloat(m));
  }, [usuario]);

  const guardarMeta = () => {
    if(!valorMeta||isNaN(valorMeta)) return;
    const valor = parseFloat(valorMeta);
    setMeta(valor);
    localStorage.setItem(`meta_${usuario.uid}`, valor);
    setEditandoMeta(false);
    setValorMeta('');
  };

  if(splash) return <Splash onDone={()=>{ localStorage.setItem('aldia_splash_visto','true'); setSplash(false); }}/>;

  if(cargando) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'-apple-system,sans-serif',color:'var(--text2)',background:'var(--bg)'}}>
      Cargando...
    </div>
  );
  if(!usuario) return <Login />;

  const nombre = usuario.displayName || usuario.email.split('@')[0];
  const nombreCorto = nombre.split(' ')[0];
  const iniciales = nombre.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase().slice(0,2);
  const saludo = getSaludo();

  const activos = products.filter(p=>!p.estado);
  const historial = products.filter(p=>p.estado==='consumido'||p.estado==='descartado');
  const descartados = products.filter(p=>p.estado==='descartado');
  const consumidos = products.filter(p=>p.estado==='consumido');
  const perdida = descartados.reduce((s,p)=>s+(parseFloat(p.precio)||0),0);
  const ahorro = consumidos.reduce((s,p)=>s+(parseFloat(p.precio)||0),0);

  const todosLosProductos = [...activos,...historial];
  const frecuentesCont = {};
  todosLosProductos.forEach(p=>{ const key=`${p.name}|||${p.cat}`; frecuentesCont[key]=(frecuentesCont[key]||0)+1; });
  const productosFrecuentes = Object.entries(frecuentesCont).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([key])=>{ const [name,cat]=key.split('|||'); return {name,cat}; });

  const catStats = Object.keys(CATS).map(cat=>{
    const dc = descartados.filter(p=>p.cat===cat);
    const cc = consumidos.filter(p=>p.cat===cat);
    const totalCat = dc.length+cc.length;
    const pctDesperdicio = totalCat>0?Math.round((dc.length/totalCat)*100):0;
    return {cat,descartados:dc.length,total:totalCat,pctDesperdicio,pérdidaCat:dc.reduce((s,p)=>s+(parseFloat(p.precio)||0),0)};
  }).filter(x=>x.descartados>0).sort((a,b)=>b.descartados-a.descartados);

  const hoyDate = new Date();
  const mesActual = hoyDate.getMonth(); const añoActual = hoyDate.getFullYear();
  const inicioMesActual = new Date(añoActual,mesActual,1);
  const mesAnterior = mesActual===0?11:mesActual-1; const añoAnterior = mesActual===0?añoActual-1:añoActual;
  const inicioMesAnterior = new Date(añoAnterior,mesAnterior,1);
  const finMesAnterior = new Date(añoAnterior,mesAnterior+1,0);
  const descartadosActual = descartados.filter(p=>p.fechaEstado&&new Date(p.fechaEstado)>=inicioMesActual);
  const descartadosAnterior = descartados.filter(p=>p.fechaEstado&&new Date(p.fechaEstado)>=inicioMesAnterior&&new Date(p.fechaEstado)<=finMesAnterior);
  const pérdidaActual = descartadosActual.reduce((s,p)=>s+(parseFloat(p.precio)||0),0);
  const pérdidaAnterior = descartadosAnterior.reduce((s,p)=>s+(parseFloat(p.precio)||0),0);
  const cambioMesAMes = pérdidaAnterior>0?Math.round(((pérdidaActual-pérdidaAnterior)/pérdidaAnterior)*100):0;

  const expired = activos.filter(p=>status(p)==='expired').length;
  const danger = activos.filter(p=>status(p)==='danger').length;
  const warn = activos.filter(p=>status(p)==='warn').length;
  const ok = activos.filter(p=>status(p)==='ok').length;
  const alertas = expired+danger+warn;
  const cats = ['Todos',...new Set(activos.map(p=>p.cat))];
  const filtered = activos.filter(p=>(filtro==='Todos'||p.cat===filtro)&&(!busqueda||p.name.toLowerCase().includes(busqueda.toLowerCase()))).sort((a,b)=>daysUntil(a.exp)-daysUntil(b.exp));

  const abrirNuevo = (catInicial) => { setEditId(null); setForm({name:'',cat:catInicial||'Lácteos',exp:'',qty:'',alert:7,precio:''}); setPantalla('form'); };
  const abrirEditar = (p) => { setEditId(p.id); setForm({name:p.name,cat:p.cat,exp:p.exp,qty:p.qty||'',alert:p.alert,precio:p.precio||''}); setPantalla('form'); };

  const guardar = async () => {
    if(!form.name||!form.exp) return;
    setGuardando(true);
    try {
      if(editId){ await updateDoc(doc(db,"productos",editId),form); }
      else { await addDoc(collection(db,"productos"),{...form,uid:usuario.uid,estado:null,fechaCreacion:new Date().toISOString()}); }
      setPantalla('');
    } catch(e){ console.error(e); }
    setGuardando(false);
  };

  const marcarEstado = async (estado) => {
    setGuardando(true);
    try { await updateDoc(doc(db,"productos",editId),{estado,fechaEstado:new Date().toISOString()}); setPantalla(''); }
    catch(e){ console.error(e); }
    setGuardando(false);
  };

  const eliminar = async () => {
    setGuardando(true);
    try { await deleteDoc(doc(db,"productos",editId)); setPantalla(''); }
    catch(e){ console.error(e); }
    setGuardando(false);
  };

  const eliminarDelHistorial = async (id) => {
    if(!window.confirm('¿Eliminar este producto del historial?')) return;
    try { await deleteDoc(doc(db,"productos",id)); } catch(e){ console.error(e); }
  };

  const eliminarTodoHistorial = async () => {
    if(!window.confirm(`¿Eliminar todo el historial? (${historial.length} productos)`)) return;
    try { const batch=writeBatch(db); historial.forEach(p=>batch.delete(doc(db,"productos",p.id))); await batch.commit(); }
    catch(e){ console.error(e); }
  };

  const restaurar = async (id) => {
    try { await updateDoc(doc(db,"productos",id),{estado:null,fechaEstado:null}); } catch(e){ console.error(e); }
  };

  if(pantalla==='form') return (
    <div style={S.formWrap}>
      <div style={S.formHeader}>
        <button style={S.backBtn} onClick={()=>setPantalla('')}>← Volver</button>
        <span style={S.formTitle}>{editId?'✏️ Editar producto':'✨ Nuevo producto'}</span>
      </div>
      {!editId && productosFrecuentes.length>0 && (
        <div style={{padding:'12px 14px',borderBottom:'0.5px solid var(--border2)'}}>
          <div style={{fontSize:11,color:'var(--text2)',fontWeight:500,marginBottom:8}}>⚡ Productos frecuentes</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {productosFrecuentes.map((p,i)=>(
              <button key={i} onClick={()=>setForm({...form,name:p.name,cat:p.cat})} style={{padding:'6px 10px',borderRadius:8,background:'var(--green)',color:'#fff',border:'none',fontSize:11,fontWeight:500,cursor:'pointer'}}>
                {CATS[p.cat]} {p.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={S.formBody}>
        <div style={S.formSection}>
          <div style={S.formRow}>
            <span style={S.formLabel}>📝 Nombre</span>
            <input list="nombresSugeridos" style={S.formInput} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ej: Leche entera"/>
            <datalist id="nombresSugeridos">{todosLosProductos.map((p,i)=><option key={i} value={p.name}/>)}</datalist>
          </div>
          <div style={S.formRow}><span style={S.formLabel}>🏷️ Categoría</span><select style={S.formSelect} value={form.cat} onChange={e=>setForm({...form,cat:e.target.value})}>{Object.keys(CATS).map(c=><option key={c}>{c}</option>)}</select></div>
          <div style={S.formRow}><span style={S.formLabel}>📅 Fecha de vencimiento</span><input type="date" style={S.formInput} value={form.exp} onChange={e=>setForm({...form,exp:e.target.value})}/></div>
          <div style={S.formRow}><span style={S.formLabel}>📊 Cantidad / notas</span><input style={S.formInput} value={form.qty} onChange={e=>setForm({...form,qty:e.target.value})} placeholder="Ej: 2 botellas"/></div>
          <div style={S.formRow}><span style={S.formLabel}>💰 Precio (opcional)</span><input type="number" style={S.formInput} value={form.precio} onChange={e=>setForm({...form,precio:e.target.value})} placeholder="Ej: 4500"/></div>
          <div style={S.formRowLast}><span style={S.formLabel}>🔔 Alertar con anticipación</span><select style={S.formSelect} value={form.alert} onChange={e=>setForm({...form,alert:parseInt(e.target.value)})}><option value={3}>3 días antes</option><option value={7}>7 días antes</option><option value={14}>14 días antes</option><option value={30}>30 días antes</option></select></div>
        </div>
        <button style={{...S.saveBtn,opacity:guardando?0.6:1}} onClick={guardar} disabled={guardando}>{guardando?'Guardando...':'Guardar'}</button>
        {editId && (
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <button style={{...S.saveBtn,background:'#34C759',opacity:guardando?0.6:1}} onClick={()=>marcarEstado('consumido')} disabled={guardando}>✓ Marcar como consumido</button>
            <button style={{...S.saveBtn,background:'#FF9500',opacity:guardando?0.6:1}} onClick={()=>marcarEstado('descartado')} disabled={guardando}>🗑 Marcar como descartado</button>
            <button style={{...S.delBtn,opacity:guardando?0.6:1}} onClick={eliminar} disabled={guardando}>Eliminar producto</button>
          </div>
        )}
      </div>
      <Navbar tab={tab} setTab={setTab} setPantalla={setPantalla}/>
    </div>
  );

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <div style={S.titleRow}>
          <LOGO/>
          <div style={S.title}>Al Día</div>
          <div style={{position:'relative',marginLeft:'auto'}} ref={menuRef}>
            <div style={{...S.avatar,position:'relative'}} onClick={()=>setMenuAbierto(!menuAbierto)}>
              {usuario.photoURL ? <img src={usuario.photoURL} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} alt="perfil"/> : iniciales}
              <div style={{position:'absolute',bottom:2,right:2,width:10,height:10,borderRadius:'50%',background:'#34C759',border:'2px solid var(--card)'}}/>
            </div>
            {alertas>0 && (
              <div style={{position:'absolute',top:-6,right:-6,minWidth:20,height:20,borderRadius:999,background:'#FF3B30',color:'#fff',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 6px',boxShadow:'0 0 0 3px rgba(255,255,255,0.8)'}}>
                {alertas}
              </div>
            )}
            {menuAbierto && (
              <div style={{position:'absolute',top:42,right:0,background:'var(--card)',borderRadius:14,border:'0.5px solid var(--border)',boxShadow:'0 4px 20px rgba(0,0,0,0.15)',overflow:'hidden',minWidth:240,zIndex:51}}>
                <div style={{padding:'12px 14px',borderBottom:'0.5px solid var(--border2)',display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:36,height:36,borderRadius:'50%',background:'var(--green)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:500,color:'#fff',overflow:'hidden',flexShrink:0}}>
                    {usuario.photoURL ? <img src={usuario.photoURL} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="perfil"/> : iniciales}
                  </div>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:500,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{nombre}</div>
                    <div style={{fontSize:11,color:'#34C759',marginTop:2}}>Activo ahora</div>
                  </div>
                </div>
                <div style={{padding:'10px 14px',borderBottom:'0.5px solid var(--border2)',fontSize:12,color:'var(--text2)',wordBreak:'break-all'}}>{usuario.email}</div>
                <div style={{padding:'6px 0'}}>
                  <div onClick={()=>alert('Editar perfil - En desarrollo')} style={{padding:'10px 14px',fontSize:13,color:'var(--text)',cursor:'pointer',display:'flex',alignItems:'center',gap:8}} onMouseEnter={e=>e.currentTarget.style.background='var(--input)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><span>✏️</span> Editar perfil</div>
                  <div onClick={()=>alert('Preferencias - En desarrollo')} style={{padding:'10px 14px',fontSize:13,color:'var(--text)',cursor:'pointer',display:'flex',alignItems:'center',gap:8}} onMouseEnter={e=>e.currentTarget.style.background='var(--input)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><span>⚙️</span> Preferencias</div>
                </div>
                <div style={{borderTop:'0.5px solid var(--border2)',borderBottom:'0.5px solid var(--border2)',padding:'6px 0'}}>
                  <div onClick={()=>alert('Ayuda y FAQ - En desarrollo')} style={{padding:'10px 14px',fontSize:13,color:'var(--text)',cursor:'pointer',display:'flex',alignItems:'center',gap:8}} onMouseEnter={e=>e.currentTarget.style.background='var(--input)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><span>❓</span> Ayuda y FAQ</div>
                  <div onClick={()=>alert('Contacto: soporte@aldia.com')} style={{padding:'10px 14px',fontSize:13,color:'var(--text)',cursor:'pointer',display:'flex',alignItems:'center',gap:8}} onMouseEnter={e=>e.currentTarget.style.background='var(--input)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><span>📧</span> Contacto y soporte</div>
                </div>
                <div style={{padding:'6px 0'}}>
                  <div onClick={()=>alert('Términos y privacidad - En desarrollo')} style={{padding:'10px 14px',fontSize:12,color:'var(--text2)',cursor:'pointer',display:'flex',alignItems:'center',gap:8}} onMouseEnter={e=>e.currentTarget.style.background='var(--input)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><span>📋</span> Términos y privacidad</div>
                  <div onClick={()=>alert('Versión 1.0.0')} style={{padding:'10px 14px',fontSize:12,color:'var(--text2)',cursor:'pointer',display:'flex',alignItems:'center',gap:8}} onMouseEnter={e=>e.currentTarget.style.background='var(--input)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><span>ℹ️</span> Versión 1.0.0</div>
                </div>
                <div onClick={()=>{signOut(auth);setMenuAbierto(false);}} style={{padding:'10px 14px',fontSize:13,color:'#FF3B30',cursor:'pointer',display:'flex',alignItems:'center',gap:8,borderTop:'0.5px solid var(--border2)'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,59,48,0.1)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><span>🚪</span> Cerrar sesión</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {correoEnviado && (
        <div style={{margin:'8px 14px 0',borderRadius:12,padding:'9px 12px',background:'#f0fff4',border:'0.5px solid rgba(45,181,78,0.3)',fontSize:12,fontWeight:500,color:'var(--green)'}}>
          📧 Te enviamos un correo con los productos por vencer
        </div>
      )}

      {tab==='home' && <>
        {activos.length===0 ? (
          <EmptyState
            onAgregar={()=>abrirNuevo()}
            onCategoria={(cat)=>abrirNuevo(cat)}
            onAgregarEjemplo={async(ej)=>{
              setGuardando(true);
              try { await addDoc(collection(db,"productos"),{name:ej.name,cat:ej.cat,exp:ej.exp,qty:'',alert:7,precio:'',uid:usuario.uid,estado:null,fechaCreacion:new Date().toISOString()}); }
              catch(e){ console.error(e); }
              setGuardando(false);
            }}
          />
        ):(
          <>
            <div style={{padding:'10px 14px 4px',fontSize:15,fontWeight:600,color:'var(--text)'}}>{saludo}, {nombreCorto} 👋</div>
            <Widget activos={activos}/>
            <div style={S.statsGrid}>
              {[
                {n:expired+danger,l:'Urgentes',c:'#FF3B30'},
                {n:warn,l:'Próximos',c:'#FF9500'},
                {n:ok,l:'En buen estado',c:'#34C759'},
                {n:activos.length,l:'Total',c:'var(--green)'},
              ].map(s=>(
                <div key={s.l} style={S.statCard}>
                  <div style={S.statLabel}>{s.l}</div>
                  <div style={{fontSize:22,fontWeight:600,letterSpacing:-0.5,color:s.c}}>{s.n}</div>
                </div>
              ))}
            </div>
            {expired>0 && <div style={S.alertBox}><span style={{fontSize:14,flexShrink:0}}>⚠</span><div><div style={{fontSize:12,fontWeight:500,color:'#FF3B30'}}>{expired} producto{expired>1?'s':''} vencido{expired>1?'s':''}</div><div style={{fontSize:11,color:'var(--text2)',marginTop:1}}>Retíralos de tu inventario</div></div></div>}
            {danger>0 && <div style={{...S.alertBox,background:'#fff8ee',border:'0.5px solid rgba(255,149,0,0.2)',marginTop:6}}><span style={{fontSize:14,flexShrink:0}}>⏰</span><div><div style={{fontSize:12,fontWeight:500,color:'#FF9500'}}>{danger} producto{danger>1?'s':''} vence{danger===1?'':'n'} en menos de 3 días</div><div style={{fontSize:11,color:'var(--text2)',marginTop:1}}>Consúmelos pronto</div></div></div>}
            <div style={S.sectionHeader}><span style={S.sectionTitle}>📦 Mis productos</span></div>
            <div style={S.filters}>
              {cats.map(c=>(
                <button key={c} onClick={()=>setFiltro(c)} style={{padding:'5px 12px',borderRadius:999,fontSize:12,fontWeight:500,border:'none',cursor:'pointer',whiteSpace:'nowrap',background:filtro===c?'var(--green)':'var(--card)',color:filtro===c?'#fff':'var(--text2)'}}>{c}</button>
              ))}
            </div>
            <div style={S.searchWrap}>
              <input style={S.search} value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="🔍 Buscar producto..."/>
            </div>
            <div style={S.plist} key={listKey}>
              {filtered.length===0 && <div style={{background:'var(--card)',padding:32,textAlign:'center',fontSize:13,color:'var(--text2)',borderRadius:13}}>Sin resultados para tu búsqueda.</div>}
              {filtered.map((p,i)=>(
                <ProductCard key={p.id} p={p} index={i} onClick={()=>abrirEditar(p)}/>
              ))}
            </div>
            <div style={S.fabWrap}><button style={S.fab} onClick={()=>abrirNuevo()}>✨ Agregar producto</button></div>
          </>
        )}
      </>}

      {tab==='estadisticas' && (
        <div style={{padding:'16px 14px',display:'flex',flexDirection:'column',gap:12}}>
          <div style={{fontSize:18,fontWeight:600,color:'var(--text)',padding:'4px 0 8px',letterSpacing:-0.3}}>📊 Estadísticas</div>
          <SimpleCharts descartados={descartados} consumidos={consumidos} catStats={catStats}/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <div style={{...S.statCard,borderRadius:13}}><div style={S.statLabel}>Consumidos</div><div style={{fontSize:22,fontWeight:600,color:'#34C759'}}>{consumidos.length}</div></div>
            <div style={{...S.statCard,borderRadius:13}}><div style={S.statLabel}>Descartados</div><div style={{fontSize:22,fontWeight:600,color:'#FF9500'}}>{descartados.length}</div></div>
          </div>
          <div style={{background:'var(--card)',borderRadius:13,padding:'14px',border:'0.5px solid var(--border2)'}}>
            <div style={{fontSize:12,color:'var(--text2)',marginBottom:6}}>💰 Comparativa mes a mes</div>
            <div style={{fontSize:28,fontWeight:700,color:cambioMesAMes<=0?'#34C759':'#FF3B30',letterSpacing:-0.5}}>{cambioMesAMes>0?'+':''}{cambioMesAMes}%</div>
            <div style={{fontSize:12,color:'var(--text2)',marginTop:8}}>Este mes: ${Math.round(pérdidaActual).toLocaleString('es-CO')} | Mes anterior: ${Math.round(pérdidaAnterior).toLocaleString('es-CO')}</div>
            <div style={{fontSize:11,color:'var(--text2)',marginTop:4}}>{cambioMesAMes<0?'✓ ¡Mejorando! Desperdiciaste menos':cambioMesAMes>0?'⚠ Aumentó el desperdicio':'→ Igual que el mes anterior'}</div>
          </div>
          <div style={{background:'var(--card)',borderRadius:13,padding:'14px',border:'0.5px solid var(--border2)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <div style={{fontSize:12,color:'var(--text2)'}}>🎯 Tu meta de desperdicio</div>
              <button onClick={()=>{setEditandoMeta(!editandoMeta);setValorMeta(meta?meta.toString():'');}} style={{background:'none',border:'none',color:'var(--green)',fontSize:12,cursor:'pointer',fontWeight:500}}>{editandoMeta?'Cancelar':'Editar'}</button>
            </div>
            {!editandoMeta?(
              meta?(
                <>
                  <div style={{fontSize:28,fontWeight:700,color:pérdidaActual<=meta?'#34C759':'#FF3B30',letterSpacing:-0.5}}>${Math.round(pérdidaActual).toLocaleString('es-CO')} / ${Math.round(meta).toLocaleString('es-CO')}</div>
                  <div style={{height:8,borderRadius:4,background:'var(--input)',marginTop:10,overflow:'hidden'}}><div style={{height:8,borderRadius:4,background:pérdidaActual<=meta?'#34C759':'#FF3B30',width:`${Math.min(100,(pérdidaActual/meta)*100)}%`,transition:'width 0.3s'}}/></div>
                  <div style={{fontSize:11,color:'var(--text2)',marginTop:6}}>{pérdidaActual<=meta?'✓ ¡Lo lograste!':` ⚠ Vas ${Math.round(pérdidaActual-meta).toLocaleString('es-CO')} por encima`}</div>
                </>
              ):<div style={{fontSize:13,color:'var(--text2)',fontStyle:'italic'}}>Sin meta establecida. ¡Define una para motivarte!</div>
            ):(
              <div style={{display:'flex',gap:8}}>
                <input type="number" value={valorMeta} onChange={e=>setValorMeta(e.target.value)} placeholder="Ej: 50000" style={{flex:1,padding:'8px 12px',borderRadius:10,border:'0.5px solid var(--border)',background:'var(--bg)',color:'var(--text)',fontSize:13,outline:'none'}}/>
                <button onClick={guardarMeta} style={{padding:'8px 16px',borderRadius:10,background:'var(--green)',color:'#fff',border:'none',fontSize:13,fontWeight:600,cursor:'pointer'}}>Guardar</button>
              </div>
            )}
          </div>
          <div style={{background:'var(--card)',borderRadius:13,padding:'14px',border:'0.5px solid var(--border2)'}}>
            <div style={{fontSize:12,color:'var(--text2)',marginBottom:6}}>Dinero perdido en descartados</div>
            <div style={{fontSize:28,fontWeight:700,color:'#FF3B30',letterSpacing:-0.5}}>${Math.round(perdida).toLocaleString('es-CO')}</div>
            <div style={{fontSize:12,color:'var(--text2)',marginTop:4}}>Basado en los precios que registraste</div>
          </div>
          <div style={{background:'var(--card)',borderRadius:13,padding:'14px',border:'0.5px solid var(--border2)'}}>
            <div style={{fontSize:12,color:'var(--text2)',marginBottom:6}}>Dinero aprovechado en consumidos</div>
            <div style={{fontSize:28,fontWeight:700,color:'var(--green)',letterSpacing:-0.5}}>${Math.round(ahorro).toLocaleString('es-CO')}</div>
            <div style={{fontSize:12,color:'var(--text2)',marginTop:4}}>Productos que consumiste a tiempo</div>
          </div>
          {catStats.length>0 && (
            <div style={{background:'var(--card)',borderRadius:13,padding:'14px',border:'0.5px solid var(--border2)'}}>
              <div style={{fontSize:12,color:'var(--text2)',marginBottom:10}}>📊 Categorías con más desperdicios</div>
              {catStats.map(c=>(
                <div key={c.cat} style={{marginBottom:12}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                    <span style={{fontSize:18}}>{CATS[c.cat]}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:500,color:'var(--text)'}}>{c.cat}</div>
                      <div style={{fontSize:11,color:'var(--text2)',marginTop:2}}>{c.descartados} descartados de {c.total} ({c.pctDesperdicio}%)</div>
                    </div>
                    <span style={{fontSize:13,color:'#FF9500',fontWeight:600}}>-${Math.round(c.pérdidaCat).toLocaleString('es-CO')}</span>
                  </div>
                  <div style={{height:6,borderRadius:3,background:'var(--input)',overflow:'hidden'}}>
                    <div style={{height:6,borderRadius:3,background:c.pctDesperdicio>50?'#FF3B30':c.pctDesperdicio>30?'#FF9500':'#34C759',width:`${c.pctDesperdicio}%`,transition:'width 0.3s'}}/>
                  </div>
                </div>
              ))}
            </div>
          )}
          {historial.length>0 && (
            <div style={{background:'var(--card)',borderRadius:13,padding:'14px',border:'0.5px solid var(--border2)'}}>
              <div style={{fontSize:12,color:'var(--text2)',marginBottom:10}}>💡 Recomendaciones inteligentes</div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {catStats.length>0&&catStats[0].pctDesperdicio>50&&<div style={{padding:'10px 12px',borderRadius:10,background:'rgba(255,59,48,0.1)',border:'0.5px solid rgba(255,59,48,0.2)',fontSize:12,color:'var(--text)'}}><strong style={{color:'#FF3B30'}}>⚠ {catStats[0].cat}:</strong> {catStats[0].pctDesperdicio}% de desperdicio.</div>}
                {consumidos.length>descartados.length&&<div style={{padding:'10px 12px',borderRadius:10,background:'rgba(52,199,89,0.1)',border:'0.5px solid rgba(52,199,89,0.2)',fontSize:12,color:'var(--text)'}}><strong style={{color:'#34C759'}}>✓ Mejorando:</strong> Consumes más de lo que descartas. ¡Sigue así!</div>}
                {cambioMesAMes<0&&<div style={{padding:'10px 12px',borderRadius:10,background:'rgba(52,199,89,0.1)',border:'0.5px solid rgba(52,199,89,0.2)',fontSize:12,color:'var(--text)'}}><strong style={{color:'#34C759'}}>🎯 Progreso:</strong> Este mes reduciste desperdicio {Math.abs(cambioMesAMes)}%.</div>}
                {meta&&pérdidaActual>meta&&<div style={{padding:'10px 12px',borderRadius:10,background:'rgba(255,149,0,0.1)',border:'0.5px solid rgba(255,149,0,0.2)',fontSize:12,color:'var(--text)'}}><strong style={{color:'#FF9500'}}>🚀 Meta:</strong> Necesitas reducir ${Math.round(pérdidaActual-meta).toLocaleString('es-CO')} para alcanzarla.</div>}
              </div>
            </div>
          )}
          {historial.length===0&&<div style={{textAlign:'center',padding:24,color:'var(--text2)',fontSize:13,background:'var(--card)',borderRadius:13}}>📊 Aún no hay datos.</div>}
        </div>
      )}

      {tab==='historial' && (
        <div style={{padding:'16px 14px',display:'flex',flexDirection:'column',gap:8}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 0 8px'}}>
            <div style={{fontSize:18,fontWeight:600,color:'var(--text)',letterSpacing:-0.3}}>📜 Historial</div>
            {historial.length>0&&<button onClick={eliminarTodoHistorial} style={{background:'none',border:'none',color:'#FF3B30',fontSize:13,cursor:'pointer',fontWeight:500}}>Borrar todo</button>}
          </div>
          {historial.length>0&&(
            <div style={{background:'var(--card)',borderRadius:16,padding:'16px',border:'0.5px solid var(--border2)',marginBottom:8}}>
              <div style={{fontSize:14,fontWeight:600,color:'var(--text)',marginBottom:12}}>📊 Estadísticas del Historial</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,marginBottom:16}}>
                {[
                  {n:historial.filter(p=>p.estado==='consumido').length,l:'Consumidos',c:'#34C759'},
                  {n:historial.filter(p=>p.estado==='descartado').length,l:'Descartados',c:'#FF3B30'},
                  {n:historial.length,l:'Total',c:'var(--green)'},
                  {n:historial.length>0?Math.round((historial.filter(p=>p.estado==='consumido').length/historial.length)*100):0,l:'% Consumidos',c:'#007AFF'},
                ].map(s=>(
                  <div key={s.l} style={{textAlign:'center'}}>
                    <div style={{fontSize:20,fontWeight:600,color:s.c,marginBottom:2}}>{s.n}{s.l.includes('%')?'%':''}</div>
                    <div style={{fontSize:11,color:'var(--text2)',fontWeight:500}}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontSize:13,fontWeight:500,color:'var(--text)',marginBottom:8}}>Distribución por categoría</div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {Object.entries(historial.reduce((acc,p)=>{acc[p.cat]=(acc[p.cat]||0)+1;return acc;},{})).sort(([,a],[,b])=>b-a).slice(0,5).map(([cat,count])=>(
                    <div key={cat} style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:14}}>{CATS[cat]||'📦'}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                          <span style={{fontSize:12,color:'var(--text)',fontWeight:500}}>{cat}</span>
                          <span style={{fontSize:11,color:'var(--text2)'}}>{count}</span>
                        </div>
                        <div style={{width:'100%',height:4,background:'var(--input)',borderRadius:2,overflow:'hidden'}}>
                          <div style={{width:`${(count/historial.length)*100}%`,height:'100%',background:'linear-gradient(90deg,var(--green),#30D158)',borderRadius:2}}/>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{padding:'12px',background:'var(--input)',borderRadius:10}}>
                <div style={{fontSize:12,color:'var(--text2)',marginBottom:4}}>💰 Ahorro estimado</div>
                <div style={{fontSize:16,fontWeight:600,color:'var(--green)'}}>${historial.filter(p=>p.estado==='consumido'&&p.precio).reduce((sum,p)=>sum+Number(p.precio),0).toLocaleString('es-CO')}</div>
                <div style={{fontSize:10,color:'var(--text2)',marginTop:2}}>Basado en productos consumidos con precio registrado</div>
              </div>
            </div>
          )}
          {historial.length===0&&<div style={{textAlign:'center',padding:32,color:'var(--text2)',fontSize:13}}>No hay productos en el historial aún.</div>}
          {historial.sort((a,b)=>new Date(b.fechaEstado)-new Date(a.fechaEstado)).map(p=>(
            <div key={p.id} style={{background:'var(--card)',borderRadius:13,padding:'12px 14px',border:'0.5px solid var(--border2)'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:36,height:36,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,background:p.estado==='consumido'?'#f0fff4':'#fff8ee',flexShrink:0}}>{CATS[p.cat]||'📦'}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:500,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.name}</div>
                  <div style={{fontSize:11,color:'var(--text2)',marginTop:1}}>{p.cat}{p.precio?` · $${Number(p.precio).toLocaleString('es-CO')}`:''}</div>
                </div>
                <div style={{fontSize:12,fontWeight:500,padding:'3px 8px',borderRadius:999,background:p.estado==='consumido'?'#f0fff4':'#fff8ee',color:p.estado==='consumido'?'#34C759':'#FF9500',flexShrink:0}}>
                  {p.estado==='consumido'?'✓ Consumido':'🗑 Descartado'}
                </div>
              </div>
              <div style={{display:'flex',gap:8,marginTop:10}}>
                <button onClick={()=>restaurar(p.id)} style={{flex:1,height:34,borderRadius:10,background:'var(--input)',border:'none',fontSize:12,color:'var(--green)',fontWeight:500,cursor:'pointer'}}>↩ Restaurar</button>
                <button onClick={()=>eliminarDelHistorial(p.id)} style={{flex:1,height:34,borderRadius:10,background:'#fff2f2',border:'none',fontSize:12,color:'#FF3B30',fontWeight:500,cursor:'pointer'}}>🗑 Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Navbar tab={tab} setTab={setTab} setPantalla={setPantalla}/>
    </div>
  );
}