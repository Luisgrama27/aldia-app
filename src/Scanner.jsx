import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";

export default function Scanner({ onResult, onClose }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [error, setError] = useState('');
  const [activo, setActivo] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [codigoManual, setCodigoManual] = useState('');

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    BrowserMultiFormatReader.listVideoInputDevices().then(devices => {
      if (!devices || devices.length === 0) {
        setError('No se encontró cámara disponible.');
        return;
      }
      const backCamera = devices.find(d =>
        d.label.toLowerCase().includes('back') ||
        d.label.toLowerCase().includes('rear') ||
        d.label.toLowerCase().includes('environment')
      ) || devices[devices.length - 1];

      reader.decodeFromVideoDevice(backCamera.deviceId, videoRef.current, (result, err) => {
        if (result) {
          reader.reset();
          setActivo(false);
          setBuscando(true);
          buscarProducto(result.getText());
        }
        if (err && !(err instanceof NotFoundException)) {
          // ignorar errores normales de escaneo
        }
      });
      setActivo(true);
    }).catch(() => setError('No se pudo acceder a la cámara.'));

    return () => { try { readerRef.current?.reset(); } catch(e) {} };
  }, []);

  const buscarProducto = async (barcode) => {
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await res.json();
      if (data.status === 1) {
        const nombre = data.product.product_name_es || data.product.product_name || '';
        onResult({ nombre, barcode });
      } else {
        onResult({ nombre: '', barcode });
      }
    } catch(e) {
      onResult({ nombre: '', barcode });
    }
  };

  const buscarManual = () => {
    if (!codigoManual.trim()) return;
    setBuscando(true);
    try { readerRef.current?.reset(); } catch(e) {}
    buscarProducto(codigoManual.trim());
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.97)',zIndex:200,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0 20px',paddingTop:'env(safe-area-inset-top,0px)',paddingBottom:'env(safe-area-inset-bottom,0px)'}}>
      <div style={{width:'100%',maxWidth:400}}>
        <div style={{textAlign:'center',marginBottom:16}}>
          <div style={{fontSize:17,fontWeight:600,color:'#fff',marginBottom:4}}>📷 Escanear código de barras</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.6)'}}>Apunta la cámara al código del producto</div>
        </div>

        <div style={{position:'relative',borderRadius:16,overflow:'hidden',background:'#111',marginBottom:12,aspectRatio:'4/3'}}>
          <video ref={videoRef} autoPlay playsInline muted style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>
            <div style={{width:220,height:110,border:'2px solid #2DB54E',borderRadius:12,boxShadow:'0 0 0 2000px rgba(0,0,0,0.5)'}}/>
          </div>
          {activo && (
            <div style={{position:'absolute',bottom:12,left:0,right:0,textAlign:'center'}}>
              <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(0,0,0,0.6)',borderRadius:999,padding:'4px 12px'}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:'#2DB54E',animation:'pulse 1s infinite'}}/>
                <span style={{fontSize:11,color:'#fff'}}>Escaneando...</span>
              </div>
            </div>
          )}
        </div>

        {buscando && (
          <div style={{textAlign:'center',color:'#2DB54E',fontSize:14,fontWeight:500,marginBottom:10}}>
            Buscando producto...
          </div>
        )}

        {error && (
          <div style={{background:'rgba(255,59,48,0.2)',border:'0.5px solid rgba(255,59,48,0.4)',borderRadius:10,padding:'8px 12px',fontSize:12,color:'#FF3B30',marginBottom:10,textAlign:'center'}}>
            {error}
          </div>
        )}

        <div style={{textAlign:'center',color:'rgba(255,255,255,0.4)',fontSize:12,marginBottom:10}}>— o escribe el código manualmente —</div>

        <div style={{display:'flex',gap:8,marginBottom:12}}>
          <input
            value={codigoManual}
            onChange={e=>setCodigoManual(e.target.value)}
            placeholder="Ej: 7702001020"
            keyboardType="numeric"
            style={{flex:1,height:44,borderRadius:12,border:'0.5px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.1)',color:'#fff',padding:'0 14px',fontSize:14,outline:'none'}}
            onKeyDown={e=>e.key==='Enter'&&buscarManual()}
          />
          <button onClick={buscarManual} disabled={buscando} style={{height:44,padding:'0 16px',borderRadius:12,background:'#2DB54E',color:'#fff',border:'none',fontSize:14,fontWeight:600,cursor:'pointer'}}>
            Buscar
          </button>
        </div>

        <button onClick={()=>{try{readerRef.current?.reset();}catch(e){}onClose();}} style={{width:'100%',height:44,borderRadius:13,background:'rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.7)',border:'none',fontSize:14,cursor:'pointer'}}>
          Cancelar
        </button>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}