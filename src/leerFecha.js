// Lee la fecha de vencimiento de una foto del empaque, todo en el dispositivo (no se sube ninguna imagen).
// El motor (Tesseract) y el idioma se sirven desde /ocr/ (archivos propios de la app) y solo se descargan al usarlo.
import { extraerFechas } from './fechas';

let trabajador = null;
let apagar = null;

async function obtenerTrabajador(alProgreso) {
  clearTimeout(apagar);
  if (trabajador) return trabajador;
  const { createWorker } = await import('tesseract.js');
  trabajador = await createWorker('eng', 1, {
    workerPath: '/ocr/worker.min.js',
    corePath: '/ocr',
    langPath: '/ocr',
    gzip: true,
    logger: (m) => { if (alProgreso && typeof m.progress === 'number') alProgreso(m.status, m.progress); },
  });
  await trabajador.setParameters({ tessedit_pageseg_mode: '11', preserve_interword_spaces: '1' });
  return trabajador;
}

// Libera la memoria si no se usa durante un rato
function programarApagado() {
  clearTimeout(apagar);
  apagar = setTimeout(() => { if (trabajador) { trabajador.terminate(); trabajador = null; } }, 60000);
}

async function aLienzo(archivo, ladoMax = 1800) {
  const bmp = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
  const k = Math.min(1, ladoMax / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close?.();
  return c;
}

// Gris + contraste ajustado a los percentiles 2 y 98 (mejora fotos con poca luz o brillo)
function realzar(lienzo, binarizar) {
  const ctx = lienzo.getContext('2d');
  const img = ctx.getImageData(0, 0, lienzo.width, lienzo.height);
  const d = img.data;
  const hist = new Uint32Array(256);
  for (let i = 0; i < d.length; i += 4) {
    const g = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) | 0;
    d[i] = d[i + 1] = d[i + 2] = g;
    hist[g]++;
  }
  const total = d.length / 4;
  let acc = 0, lo = 0, hi = 255;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= total * 0.02) { lo = v; break; } }
  acc = 0;
  for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc >= total * 0.02) { hi = v; break; } }
  const rango = Math.max(1, hi - lo);
  let umbral = 128;
  if (binarizar) { // Otsu
    const h2 = new Uint32Array(256);
    for (let i = 0; i < d.length; i += 4) h2[Math.min(255, Math.max(0, ((d[i] - lo) * 255) / rango)) | 0]++;
    let suma = 0; for (let v = 0; v < 256; v++) suma += v * h2[v];
    let sB = 0, wB = 0, mejor = 0;
    for (let v = 0; v < 256; v++) {
      wB += h2[v]; if (!wB) continue;
      const wF = total - wB; if (!wF) break;
      sB += v * h2[v];
      const mB = sB / wB, mF = (suma - sB) / wF;
      const var_ = wB * wF * (mB - mF) * (mB - mF);
      if (var_ > mejor) { mejor = var_; umbral = v; }
    }
  }
  for (let i = 0; i < d.length; i += 4) {
    let g = ((d[i] - lo) * 255) / rango;
    g = g < 0 ? 0 : g > 255 ? 255 : g;
    if (binarizar) g = g > umbral ? 255 : 0;
    d[i] = d[i + 1] = d[i + 2] = g;
  }
  ctx.putImageData(img, 0, 0);
  return lienzo;
}

// Devuelve { fechas: [{iso, score, conDia}], texto }. Lanza error si no se pudo cargar el motor.
// Prueba primero la foto tal cual (suele bastar); si no encuentra una fecha clara (con palabra como EXP/VENCE),
// reintenta con contraste ajustado y luego en blanco y negro, que ayudan con poca luz o brillos.
export async function leerFechaDeImagen(archivo, alProgreso) {
  const t = await obtenerTrabajador(alProgreso);
  try {
    let texto = '';
    for (const modo of ['original', 'contraste', 'binario']) {
      let lienzo = await aLienzo(archivo);
      if (modo !== 'original') lienzo = realzar(lienzo, modo === 'binario');
      const { data } = await t.recognize(lienzo);
      texto += '\n' + data.text;
      const propias = extraerFechas(data.text);
      if (propias.length && propias[0].score >= 5) return { fechas: propias, texto };
    }
    return { fechas: extraerFechas(texto), texto };
  } finally {
    programarApagado();
  }
}