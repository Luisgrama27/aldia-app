import { useEffect, useState } from "react";

export default function Splash({ onDone }) {
  const [fase, setFase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setFase(1), 100);
    const t2 = setTimeout(() => setFase(2), 700);
    const t3 = setTimeout(() => setFase(3), 1400);
    const t4 = setTimeout(() => onDone(), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  return (
    <div style={{
      minHeight:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      background:'var(--bg)', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      gap:20
    }}>
      <div style={{
        transform: fase >= 1 ? 'scale(1)' : 'scale(0.3)',
        opacity: fase >= 1 ? 1 : 0,
        transition:'transform 0.5s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease',
      }}>
        <svg width="96" height="96" viewBox="0 0 72 72">
          <rect width="72" height="72" rx="20" fill="var(--green)"/>
          <path d="M36 18 C36 18 48 26 48 36 C48 46 42 52 36 54 C30 52 24 46 24 36 C24 26 36 18 36 18Z" fill="none" stroke="#fff" stroke-width="2.2"/>
          <polyline points="29,36 34,41 43,30" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <div style={{
        opacity: fase >= 2 ? 1 : 0,
        transform: fase >= 2 ? 'translateY(0)' : 'translateY(12px)',
        transition:'opacity 0.4s ease, transform 0.4s ease',
        textAlign:'center',
      }}>
        <div style={{fontSize:36,fontWeight:700,color:'var(--text)',letterSpacing:-1}}>Al Día</div>
        <div style={{fontSize:14,color:'var(--text2)',marginTop:6}}>Controla lo que tienes en casa</div>
      </div>

      <div style={{
        position:'absolute', bottom:48,
        opacity: fase >= 3 ? 1 : 0,
        transition:'opacity 0.4s ease',
      }}>
        <div style={{
          width:32, height:4, borderRadius:999,
          background:'var(--green)', opacity:0.5,
          animation:'pulse 1s infinite alternate',
        }}/>
      </div>

      <style>{`
        @keyframes pulse {
          from { opacity: 0.3; transform: scaleX(0.8); }
          to { opacity: 0.8; transform: scaleX(1.2); }
        }
      `}</style>
    </div>
  );
}