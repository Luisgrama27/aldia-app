import { useRef, useState } from "react";

export default function Scanner({ onResult, onClose }) {
  const inputRef = useRef(null);
  const [buscando, setBuscando] = useState(false);
  const [codigoManual, setCodigoManual] = useState('');

  const buscarProducto = async (barcode) => {
    setBuscando(true);
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
    setBuscando(false);
  };

  const buscarManual = () => {
    if(!codigoManual.trim()) return;
    buscarProducto(codigoManual.trim());
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.97)',zIndex:100,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0 24px'}}>
      <div style={{width:'100%',maxWidth:400}}>

        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{fontSize:48,marginBottom:12}}>📷</div>
          <div style={{fontSize:18,fontWeight:600,color:'#fff',marginBottom:8}}>Agregar por código</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.6)',lineHeight:1.5}}>
            Toca el botón para abrir la cámara y apunta al código de barras del producto
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{display:'none'}}
          onChange={async (e) => {
            const file = e.target.files[0];
            if(!file) return;
            setBuscando(true);
            try {
              const detector = new window.BarcodeDetector({
                formats: ['ean_13','ean_8','upc_a','upc_e','code_128']
              });
              const bitmap = await createImageBitmap(file);
              const barcodes = await detector.detect(bitmap);
              if(barcodes.length > 0) {
                await buscarProducto(barcodes[0].rawValue);
              } else {
                onResult({ nombre: '', barcode: '' });
              }
            } catch(e) {
              onResult({ nombre: '', barcode: '' });
            }
            setBuscando(false);
          }}
        />

        <button
          onClick={() => inputRef.current.click()}
          disabled={buscando}
          style={{width:'100%',height:52,borderRadius:14,background:'#2DB54E',color:'#fff',border:'none',fontSize:16,fontWeight:600,cursor:'pointer',marginBottom:12,opacity:buscando?0.6:1}}
        >
          {buscando ? 'Buscando producto...' : '📷 Abrir cámara'}
        </button>

        <div style={{textAlign:'center',color:'rgba(255,255,255,0.4)',fontSize:12,marginBottom:16}}>— o escribe el código manualmente —</div>

        <div style={{display:'flex',gap:8,marginBottom:12}}>
          <input
            value={codigoManual}
            onChange={e=>setCodigoManual(e.target.value)}
            placeholder="Ej: 7702001020"
            style={{flex:1,height:44,borderRadius:12,border:'0.5px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.1)',color:'#fff',padding:'0 14px',fontSize:14,outline:'none'}}
            onKeyDown={e=>e.key==='Enter'&&buscarManual()}
          />
          <button
            onClick={buscarManual}
            disabled={buscando}
            style={{height:44,padding:'0 18px',borderRadius:12,background:'#2DB54E',color:'#fff',border:'none',fontSize:14,fontWeight:600,cursor:'pointer'}}
          >
            Buscar
          </button>
        </div>

        <button
          onClick={onClose}
          style={{width:'100%',height:44,borderRadius:13,background:'rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.7)',border:'none',fontSize:14,cursor:'pointer'}}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}