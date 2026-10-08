import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { buscarProducto } from './productos';

const VERDE = '#5cc08d';
const TINTA = '#08140d';

const crearLector = () => {
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E, BarcodeFormat.CODE_128, BarcodeFormat.CODE_39,
  ]);
  hints.set(DecodeHintType.TRY_HARDER, true);
  return new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120 });
};

const mensajeCamara = (e) => {
  if (e?.name === 'NotAllowedError') return 'No hay permiso para usar la cámara. Actívalo en los ajustes del teléfono o del navegador, toma una foto del código o escríbelo.';
  if (e?.name === 'NotFoundError') return 'No se encontró una cámara en este dispositivo. Escribe el código.';
  if (e?.name === 'NotReadableError') return 'La cámara está siendo usada por otra aplicación.';
  return 'No se pudo iniciar la cámara. Toma una foto del código o escríbelo.';
};

// Reduce la foto para que la lectura sea rápida
const reducirFoto = (archivo, max = 1600) => new Promise((resolver, rechazar) => {
  const url = URL.createObjectURL(archivo);
  const img = new Image();
  img.onload = () => {
    const escala = Math.min(1, max / Math.max(img.width, img.height));
    const lienzo = document.createElement('canvas');
    lienzo.width = Math.round(img.width * escala);
    lienzo.height = Math.round(img.height * escala);
    lienzo.getContext('2d').drawImage(img, 0, 0, lienzo.width, lienzo.height);
    URL.revokeObjectURL(url);
    lienzo.toBlob(b => (b ? resolver(URL.createObjectURL(b)) : rechazar(new Error('imagen'))), 'image/jpeg', 0.92);
  };
  img.onerror = () => { URL.revokeObjectURL(url); rechazar(new Error('imagen')); };
  img.src = url;
});

export default function Scanner({ onResult, onClose }) {
  const videoRef = useRef(null);
  const controlesRef = useRef(null);
  const leidoRef = useRef(false);
  const onResultRef = useRef(onResult);
  const [error, setError] = useState('');
  const [activo, setActivo] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [codigoManual, setCodigoManual] = useState('');

  useEffect(() => { onResultRef.current = onResult; });

  const detener = () => {
    try { controlesRef.current?.stop(); } catch { /* la cámara ya estaba detenida */ }
    controlesRef.current = null;
  };

  const procesar = async (codigo) => {
    if (leidoRef.current) return;
    leidoRef.current = true;
    detener();
    setActivo(false);
    setError('');
    setBuscando(true);
    const datos = await buscarProducto(codigo);
    onResultRef.current(datos);
  };

  useEffect(() => {
    let cancelado = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Este navegador no permite usar la cámara. Toma una foto del código o escríbelo.');
      return undefined;
    }
    crearLector().decodeFromConstraints(
      { audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
      videoRef.current,
      (resultado) => { if (resultado) procesar(resultado.getText()); }
    ).then(controles => {
      if (cancelado) { controles.stop(); return; }
      controlesRef.current = controles;
      setActivo(true);
    }).catch(e => { if (!cancelado) setError(mensajeCamara(e)); });
    return () => { cancelado = true; detener(); };
  }, []);

  const alElegirFoto = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo || buscando) return;
    setError('');
    setBuscando(true);
    let url = '';
    try {
      url = await reducirFoto(archivo);
      const resultado = await crearLector().decodeFromImageUrl(url);
      setBuscando(false);
      procesar(resultado.getText());
    } catch {
      setBuscando(false);
      setError('No se pudo leer el código en la foto. Acércate para que se vea nítido y completo, o escríbelo.');
    } finally {
      if (url) URL.revokeObjectURL(url);
    }
  };

  const buscarManual = () => {
    if (!codigoManual.trim() || buscando) return;
    procesar(codigoManual);
  };

  const cerrar = () => { detener(); onClose(); };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.97)',zIndex:200,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0 20px',paddingTop:'env(safe-area-inset-top, 0px)',overflowY:'auto'}}>
      <div style={{width:'100%',maxWidth:400}}>
        <div style={{textAlign:'center',marginBottom:16}}>
          <div style={{fontSize:17,fontWeight:600,color:'#fff',marginBottom:4}}>Escanear código de barras</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.6)'}}>Apunta la cámara al código del producto</div>
        </div>

        <div style={{position:'relative',borderRadius:16,overflow:'hidden',background:'#111',marginBottom:12,aspectRatio:'4/3'}}>
          <video ref={videoRef} autoPlay playsInline muted style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>
            <div style={{width:220,height:110,border:`2px solid ${VERDE}`,borderRadius:12,boxShadow:'0 0 0 2000px rgba(0,0,0,0.5)'}}/>
          </div>
          {activo && (
            <div style={{position:'absolute',bottom:12,left:0,right:0,textAlign:'center'}}>
              <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(0,0,0,0.6)',borderRadius:999,padding:'4px 12px'}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:VERDE,animation:'pulse 1s infinite'}}/>
                <span style={{fontSize:11,color:'#fff'}}>Escaneando...</span>
              </div>
            </div>
          )}
        </div>

        {buscando && (
          <div style={{textAlign:'center',color:VERDE,fontSize:14,fontWeight:500,marginBottom:10}}>Buscando producto...</div>
        )}

        {error && (
          <div role="alert" style={{background:'rgba(255,107,118,0.15)',border:'1px solid rgba(255,107,118,0.4)',borderRadius:12,padding:'10px 12px',fontSize:13,color:'#ff9aa2',marginBottom:10,textAlign:'center'}}>
            {error}
          </div>
        )}

        <label style={{display:'flex',alignItems:'center',justifyContent:'center',height:44,borderRadius:12,border:'1px solid rgba(255,255,255,0.25)',color:'#fff',fontSize:14,fontWeight:600,cursor:'pointer',marginBottom:12}}>
          Tomar foto del código
          <input type="file" accept="image/*" capture="environment" onChange={alElegirFoto} style={{display:'none'}}/>
        </label>

        <div style={{textAlign:'center',color:'rgba(255,255,255,0.5)',fontSize:12,marginBottom:10}}>— o escribe el código manualmente —</div>

        <div style={{display:'flex',gap:8,marginBottom:12}}>
          <input
            value={codigoManual}
            onChange={e=>setCodigoManual(e.target.value)}
            placeholder="Ej: 7702001020"
            inputMode="numeric"
            aria-label="Código de barras"
            style={{flex:1,minWidth:0,height:44,borderRadius:12,border:'1px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.1)',color:'#fff',padding:'0 14px',fontSize:16,outline:'none'}}
            onKeyDown={e=>e.key==='Enter'&&buscarManual()}
          />
          <button onClick={buscarManual} disabled={buscando} style={{height:44,padding:'0 18px',borderRadius:12,background:VERDE,color:TINTA,border:'none',fontSize:14,fontWeight:700,cursor:'pointer',opacity:buscando?0.6:1}}>
            Buscar
          </button>
        </div>

        <button onClick={cerrar} style={{width:'100%',height:44,borderRadius:12,background:'rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.8)',border:'none',fontSize:14,fontWeight:600,cursor:'pointer',marginBottom:20}}>
          Cancelar
        </button>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}