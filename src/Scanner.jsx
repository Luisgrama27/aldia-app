import { useEffect, useRef, useState } from "react";
import Quagga from "@ericblade/quagga2";

export default function Scanner({ onResult, onClose }) {
  const [error, setError] = useState('');
  const [activo, setActivo] = useState(false);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    iniciar();
    return () => { try { Quagga.stop(); } catch(e) {} };
  }, []);

  const iniciar = () => {
    Quagga.init({
      inputStream: {
        type: 'LiveStream',
        target: document.getElementById('qrscanner'),
        constraints: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
      decoder: {
        readers: ['ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader', 'code_128_reader'],
      },
      locate: true,
    }, (err) => {
      if(err) {
        setError('No se pudo acceder a la cámara.');
        return;
      }
      Quagga.start();
      setActivo(true);
    });

    Quagga.onDetected((data) => {
      const codigo = data.codeResult.code;
      if(codigo) {
        Quagga.stop();
        setActivo(false);
        setBuscando(true);
        buscarProducto(codigo);
      }
    });
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
          <div style={{fontSize:13,color:'rgba(255,255,255,0.6)'}}>Apunta la cámara al código del producto</div>
        </div>

        <div id="qrscanner" style={{width:'100%',borderRadius:16,overflow:'hidden',background:'#111',marginBottom:12,position:'relative'}}>
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',zIndex:10}}>
            <div style={{width:220,height:100,border:'2px solid #2DB54E',borderRadius:8}}/>
          </div>
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

        <button onClick={()=>{ try{Quagga.stop();}catch(e){} onClose(); }} style={{width:'100%',height:42,borderRadius:13,background:'rgba(255,255,255,0.1)',color:'#fff',border:'none',fontSize:14,cursor:'pointer'}}>
          Cancelar
        </button>
      </div>
    </div>
  );
}