import { useEffect, useRef, useState } from "react";

export default function Scanner({ onResult, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [codigoManual, setCodigoManual] = useState('');

  useEffect(() => {
    iniciarCamara();
    return () => detenerCamara();
  }, []);

  const iniciarCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch(e) {
      setError('No se pudo acceder a la cámara. Usa el código manual.');
    }
  };

  const detenerCamara = () => {
    if(streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
  };

  const capturarYBuscar = async () => {
    if(!videoRef.current || buscando) return;
    setBuscando(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    try {
      const detector = new window.BarcodeDetector({ formats: ['ean_13','ean_8','upc_a','upc_e','code_128','code_39'] });
      const barcodes = await detector.detect(canvas);
      if(barcodes.length > 0) {
        detenerCamara();
        await buscarProducto(barcodes[0].rawValue);
      } else {
        setError('No se detectó código. Intenta de nuevo o usa el código manual.');
        setBuscando(false);
      }
    } catch(e) {
      setError('Tu navegador no soporta detección automática. Usa el código manual.');
      setBuscando(false);
    }
  };

  const buscarManual = async () => {
    if(!codigoManual.trim()) return;
    setBuscando(true);
    detenerCamara();
    await buscarProducto(codigoManual.trim());
  };

  const buscarProducto = async (barcode) => {
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await res.json();
      if(data.status === 1){
        const nombre = data.product.product_name_es || data.product.product_name || '';
        onResult({ nombre, barcode });
      } else {
        onResult({ nombre: '', barcode });
      }
    } catch(e) {
      onResult({ nombre: '', barcode });
    }
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.97)',zIndex:100,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0 20px'}}>
      <div style={{width:'100%',maxWidth:400}}>
        <div style={{textAlign:'center',marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:500,color:'#fff',marginBottom:4}}>📷 Escanea el código de barras</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.6)'}}>Apunta la cámara y toca "Escanear"</div>
        </div>

        <div style={{position:'relative',borderRadius:16,overflow:'hidden',background:'#111',marginBottom:12}}>
          <video ref={videoRef} autoPlay playsInline muted style={{width:'100%',display:'block',borderRadius:16}}/>
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>
            <div style={{width:200,height:100,border:'2px solid #2DB54E',borderRadius:8,boxShadow:'0 0 0 2000px rgba(0,0,0,0.4)'}}/>
          </div>
        </div>

        <canvas ref={canvasRef} style={{display:'none'}}/>

        {error && (
          <div style={{background:'rgba(255,149,0,0.2)',border:'0.5px solid rgba(255,149,0,0.4)',borderRadius:10,padding:'8px 12px',fontSize:12,color:'#FF9500',marginBottom:10,textAlign:'center'}}>
            {error}
          </div>
        )}

        <button onClick={capturarYBuscar} disabled={buscando} style={{width:'100%',height:46,borderRadius:13,background:'#2DB54E',color:'#fff',border:'none',fontSize:15,fontWeight:600,cursor:'pointer',marginBottom:10,opacity:buscando?0.6:1}}>
          {buscando ? 'Buscando...' : '📷 Escanear'}
        </button>

        <div style={{display:'flex',gap:8,marginBottom:10}}>
          <input
            value={codigoManual}
            onChange={e=>setCodigoManual(e.target.value)}
            placeholder="O escribe el código manualmente"
            style={{flex:1,height:40,borderRadius:10,border:'0.5px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.1)',color:'#fff',padding:'0 12px',fontSize:13,outline:'none'}}
            onKeyDown={e=>e.key==='Enter'&&buscarManual()}
          />
          <button onClick={buscarManual} disabled={buscando} style={{height:40,padding:'0 16px',borderRadius:10,background:'#2DB54E',color:'#fff',border:'none',fontSize:13,fontWeight:600,cursor:'pointer'}}>
            Buscar
          </button>
        </div>

        <button onClick={()=>{detenerCamara();onClose();}} style={{width:'100%',height:42,borderRadius:13,background:'rgba(255,255,255,0.1)',color:'#fff',border:'none',fontSize:14,cursor:'pointer'}}>
          Cancelar
        </button>
      </div>
    </div>
  );
}