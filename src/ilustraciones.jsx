// Ilustraciones planas de cada categoría (SVG propios: sin derechos de autor y sin peso extra)
const L={strokeLinecap:'round',strokeLinejoin:'round'};

const ART={
  'Lácteos':['#e3f0f8',<>
    <rect x="14" y="26" width="26" height="34" rx="3" fill="#fff"/><path d="M14 26l6-11h14l6 11z" fill="#cfe1f0"/>
    <rect x="21" y="9" width="12" height="6" rx="2" fill="#4a90c2"/><rect x="14" y="38" width="26" height="12" fill="#4a90c2"/>
    <circle cx="27" cy="44" r="3.4" fill="#fff"/>
    <path d="M42 36h16l-2 24H44z" fill="#fff" fillOpacity=".7" stroke="#9cc3e0" strokeWidth="1.5"/><path d="M43 44h14l-1 16H44z" fill="#fff"/></>],
  'Carnes':['#fbe6e2',<>
    <path d="M10 34c0-14 12-22 28-22 14 0 22 8 22 20 0 16-14 26-30 26-14 0-20-10-20-24z" fill="#f3b8ad"/>
    <path d="M15 34c0-11 9-17 23-17 11 0 17 6 17 15 0 13-11 21-25 21-10 0-15-8-15-19z" fill="#c94a3d"/>
    <path d="M24 30c5-4 11-4 16-1M22 41c7 3 14 2 20-3" stroke="#f3b8ad" strokeWidth="2.4" fill="none" {...L}/>
    <circle cx="43" cy="28" r="5" fill="#fff"/><circle cx="43" cy="28" r="2" fill="#e8d9d6"/></>],
  'Pescados y mariscos':['#e0f1f6',<>
    <path d="M8 32c8-12 24-14 36-4l12-8v24l-12-8C32 46 16 44 8 32z" fill="#4aa3c4"/>
    <path d="M16 37c8 6 18 6 28-2" stroke="#bfe6f2" strokeWidth="3" fill="none" {...L}/>
    <path d="M26 20c4-4 10-5 14-3-3 3-8 4-14 3z" fill="#2f86a0"/>
    <circle cx="18" cy="30" r="3.4" fill="#fff"/><circle cx="18" cy="30" r="1.6" fill="#16415a"/></>],
  'Frutas y verduras':['#e3f4e8',<>
    <path d="M22 24c-9 1-13 10-10 20 3 9 9 14 14 12 3-1 4-1 6 0 5 2 11-2 14-10 3-10-1-21-10-22-4-.5-6 1-8 1s-4-1-6-1z" fill="#e0453a"/>
    <path d="M32 22c0-6 3-10 8-12 0 6-3 10-8 12z" fill="#4caf6a"/><path d="M33 22c-1-3-1-6 0-9" stroke="#7a4a2a" strokeWidth="2.4" {...L}/>
    <path d="M20 32c1-4 4-6 7-6" stroke="#fff" strokeOpacity=".55" strokeWidth="2.6" fill="none" {...L}/>
    <path d="M46 36l12 4-5 18-9-9z" fill="#f08a24"/><path d="M52 36c1-5 4-7 8-7-1 4-3 7-8 7z" fill="#4caf6a"/></>],
  'Granos y cereales':['#f8f0d4',<>
    <path d="M32 58V20" stroke="#b58a2a" strokeWidth="2.6" {...L}/>
    <g fill="#e0b13c"><ellipse cx="27" cy="22" rx="4" ry="7" transform="rotate(-25 27 22)"/><ellipse cx="37" cy="22" rx="4" ry="7" transform="rotate(25 37 22)"/><ellipse cx="32" cy="12" rx="4" ry="7"/>
    <ellipse cx="26" cy="34" rx="4" ry="7" transform="rotate(-25 26 34)"/><ellipse cx="38" cy="34" rx="4" ry="7" transform="rotate(25 38 34)"/>
    <ellipse cx="25" cy="46" rx="4" ry="7" transform="rotate(-25 25 46)"/><ellipse cx="39" cy="46" rx="4" ry="7" transform="rotate(25 39 46)"/></g></>],
  'Panadería y repostería':['#fbefdc',<>
    <path d="M8 30c-2-10 6-18 16-18h16c10 0 18 8 16 18v22a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z" fill="#e3a35a"/>
    <path d="M8 30c-2-10 6-18 16-18h16c10 0 18 8 16 18z" fill="#c9843a"/>
    <path d="M22 20l4 9M32 20l4 9M42 20l4 9" stroke="#f5d6a2" strokeWidth="3" {...L}/><path d="M14 40h36" stroke="#f0c07e" strokeWidth="2" {...L}/></>],
  'Congelados':['#e4eefc',<>
    <g stroke="#5b8fd9" strokeWidth="3.6" fill="none" {...L}><path d="M32 6v52M9.500 19l45 26M9.500 45l45-26"/>
    <path d="M26 10l6 5 6-5M26 54l6-5 6 5M8 27l8 1-2 8M56 37l-8-1 2-8M8 37l8-1-2-8M56 27l-8 1 2 8"/></g><circle cx="32" cy="32" r="5" fill="#fff" stroke="#5b8fd9" strokeWidth="2.4"/></>],
  'Enlatados':['#e9edf1',<>
    <path d="M16 18v34c0 3 7 6 16 6s16-3 16-6V18z" fill="#b9c3cc"/><rect x="16" y="28" width="32" height="18" fill="#e0553f"/>
    <circle cx="32" cy="37" r="5" fill="#fff"/><ellipse cx="32" cy="18" rx="16" ry="5" fill="#dfe5ea"/><ellipse cx="32" cy="18" rx="11" ry="3" fill="#c3ccd3"/></>],
  'Salsas y condimentos':['#fbe9de',<>
    <rect x="27" y="4" width="10" height="7" rx="2" fill="#fff"/><path d="M26 11h12v7l6 8v30a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4V26l6-8z" fill="#d9453a"/>
    <rect x="23" y="34" width="18" height="15" rx="3" fill="#fff"/><circle cx="32" cy="41.500" r="3.400" fill="#f2a24a"/></>],
  'Snacks y dulces':['#f5e6f7',<>
    <path d="M20 32L7 23v18z" fill="#f2a1e0"/><path d="M44 32l13-9v18z" fill="#f2a1e0"/><circle cx="32" cy="32" r="14" fill="#c76fd0"/>
    <path d="M24 26c5 4 11 4 16 0M24 38c5-4 11-4 16 0" stroke="#fff" strokeOpacity=".7" strokeWidth="2.6" fill="none" {...L}/></>],
  'Bebidas':['#dcf3ee',<>
    <path d="M14 20h34l-4 38a3 3 0 0 1-3 2H21a3 3 0 0 1-3-2z" fill="#fff" fillOpacity=".8" stroke="#8fd1c3" strokeWidth="1.6"/><path d="M16 32h30l-2.6 26H19z" fill="#f5a524"/>
    <path d="M36 20l6-14h10" stroke="#e0453a" strokeWidth="3.2" fill="none" {...L}/>
    <circle cx="48" cy="22" r="8" fill="#f9c74f"/><circle cx="48" cy="22" r="5.4" fill="#fde9a8"/><path d="M48 17v10M43 22h10" stroke="#f9c74f" strokeWidth="1.4"/></>],
  'Medicamentos':['#e4ebfa',<>
    <g transform="rotate(-40 32 32)"><rect x="8" y="22" width="48" height="20" rx="10" fill="#fff"/><path d="M32 22h14a10 10 0 0 1 0 20H32z" fill="#5b8fd9"/></g>
    <circle cx="48" cy="50" r="8" fill="#fff"/><path d="M42 50h12" stroke="#c9d6ee" strokeWidth="2" {...L}/></>],
  'Cuidado personal':['#e6f4e4',<>
    <rect x="28" y="6" width="8" height="10" rx="2" fill="#4a9a62"/><path d="M28 10h16v5" stroke="#4a9a62" strokeWidth="3.2" fill="none" {...L}/>
    <rect x="20" y="16" width="24" height="42" rx="7" fill="#6cbf84"/><rect x="24" y="30" width="16" height="14" rx="3" fill="#fff"/>
    <path d="M32 33c3 3 4 5 4 6.500a4 4 0 0 1-8 0c0-1.500 1-3.500 4-6.500z" fill="#6cbf84"/></>],
  'Limpieza':['#dff3f5',<>
    <rect x="22" y="14" width="22" height="11" rx="3" fill="#2f8f9b"/><rect x="43" y="16" width="9" height="5" rx="2" fill="#2f8f9b"/>
    <path d="M20 26h26v30a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4z" fill="#4fb8c4"/><rect x="25" y="36" width="16" height="13" rx="3" fill="#fff"/>
    <circle cx="57" cy="14" r="2" fill="#4fb8c4"/><circle cx="58" cy="22" r="2" fill="#4fb8c4"/><circle cx="54" cy="8" r="1.600" fill="#4fb8c4"/></>],
  'Bebé':['#fbe8ef',<>
    <path d="M26 9c0-4 12-4 12 0l-1 8H27z" fill="#f3c6a3"/><rect x="22" y="16" width="20" height="7" rx="2" fill="#e07aa0"/>
    <rect x="20" y="22" width="24" height="36" rx="7" fill="#fff" stroke="#f0a9c3" strokeWidth="1.6"/><path d="M21 38h22v13a6 6 0 0 1-6 6H27a6 6 0 0 1-6-6z" fill="#fbd5e2"/>
    <path d="M20 32h6M20 40h6M20 48h6" stroke="#e07aa0" strokeWidth="2" {...L}/></>],
  'Mascotas':['#f6ebdf',<>
    <g fill="#b5835a"><ellipse cx="32" cy="42" rx="14" ry="11"/><ellipse cx="14" cy="28" rx="5.500" ry="7" transform="rotate(-20 14 28)"/><ellipse cx="25" cy="18" rx="5.500" ry="7.500"/>
    <ellipse cx="39" cy="18" rx="5.500" ry="7.500"/><ellipse cx="50" cy="28" rx="5.500" ry="7" transform="rotate(20 50 28)"/></g></>],
  'Otro':['#eaf0ec',<>
    <path d="M8 22l24-10 24 10v24L32 58 8 46z" fill="#c9a06a"/><path d="M8 22l24 10 24-10-24-10z" fill="#e3c694"/>
    <path d="M32 32v26" stroke="#a37d48" strokeWidth="2.5"/><path d="M24 17l24 10v8l-6-2.500v-6.500L18 19.500z" fill="#fff" fillOpacity=".55"/></>],
};

export const ArtCat=({cat,size=40,radius,className=''})=>{
  const [bg,svg]=ART[cat]||ART['Otro'];
  const s=Math.round(size*0.9);
  return (
    <span className={`ad-art ${className}`} style={{'--artbg':bg,width:size,height:size,borderRadius:radius??Math.round(size*0.3)}} aria-hidden="true">
      <svg viewBox="0 0 64 64" width={s} height={s}>{svg}</svg>
    </span>
  );
};