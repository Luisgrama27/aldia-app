import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function Scanner({ onResult, onClose }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("qr-reader");
    scannerRef.current = html5QrCode;

    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async (decodedText) => {
        await html5QrCode.stop();
        buscarProducto(decodedText);
      },
      () => {}
    ).catch(err => {
      console.error("Error cámara:", err);
    });

    return () => {
      html5QrCode.stop().catch(() => {});
    };
  }, []);

  const buscarProducto = async (barcode) => {
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await res.json();
      if(data.status === 1){
        const nombre = data.product.product_name || data.product.product_name_es || '';
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
        <div id="qr-reader" style={{borderRadius:16,overflow:'hidden',width:'100%'}}/>
        <button onClick={onClose} style={{width:'100%',height:46,borderRadius:13,background:'rgba(255,255,255,0.15)',color:'#fff',border:'none',fontSize:15,fontWeight:500,cursor:'pointer',marginTop:16}}>
          Cancelar
        </button>
      </div>
    </div>
  );
}