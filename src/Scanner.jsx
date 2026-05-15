import { useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function Scanner({ onResult, onClose }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader.decodeFromVideoDevice(null, videoRef.current, async (result, err) => {
      if (result) {
        await reader.reset();
        buscarProducto(result.getText());
      }
    });

    return () => {
      try { readerRef.current?.reset(); } catch(e) {}
    };
  }, []);

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
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.95)',zIndex:100,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:'100%',maxWidth:400,padding:'0 20px'}}>
        <div style={{textAlign:'center',marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:500,color:'#fff',marginBottom:4}}>Escanea el código de barras</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.6)'}}>Apunta la cámara al código del producto</div>
        </div>
        <video ref={videoRef} style={{width:'100%',borderRadius:16,overflow:'hidden'}}/>
        <button onClick={onClose} style={{width:'100%',height:46,borderRadius:13,background:'rgba(255,255,255,0.15)',color:'#fff',border:'none',fontSize:15,fontWeight:500,cursor:'pointer',marginTop:16}}>
          Cancelar
        </button>
      </div>
    </div>
  );
}