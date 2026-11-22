// Extrae fechas de vencimiento de un texto leído de un empaque (OCR).
// Formatos: 15/03/2027, 15-03-27, 03/2027, 03.27, 2027-03-15, 15 MAR 2027, 15MAR27, MAR 2027, ENERO/2027...
// Si solo hay mes y año, se toma el último día del mes (así dura todo el mes impreso).

const MESES = {
  ENE: 1, ENERO: 1, JAN: 1, JANUARY: 1,
  FEB: 2, FEBRERO: 2, FEBRUARY: 2,
  MAR: 3, MARZO: 3, MARCH: 3,
  ABR: 4, ABRIL: 4, APR: 4, APRIL: 4,
  MAY: 5, MAYO: 5,
  JUN: 6, JUNIO: 6, JUNE: 6,
  JUL: 7, JULIO: 7, JULY: 7,
  AGO: 8, AGOSTO: 8, AUG: 8, AUGUST: 8,
  SEP: 9, SEPT: 9, SET: 9, SEPTIEMBRE: 9, SETIEMBRE: 9, SEPTEMBER: 9,
  OCT: 10, OCTUBRE: 10, OCTOBER: 10,
  NOV: 11, NOVIEMBRE: 11, NOVEMBER: 11,
  DIC: 12, DICIEMBRE: 12, DEC: 12, DECEMBER: 12,
};
const NOMBRES_MES = Object.keys(MESES).sort((a, b) => b.length - a.length).join('|');

const CLAVE_VENCE = /(VENCE|VENC|VTO|VCTO|VEN|EXPIRA|EXPIRY|EXPIRES|EXP|FV|F\.V|CADUCA|CAD|BBE|BB|BEST\s*BEFORE|USE\s*BY|CONSUMIR|PREFERENTEMENTE|PREFERENTE|USAR\s*ANTES|ANTES\s*DE)\W{0,3}$/;
const CLAVE_FABRICA = /(ELAB|ELABORACION|FAB|FABRICACION|PROD|PRODUCCION|MFG|MFD|MANUF|ENVASADO|PACKED|EMPAQUE)\W{0,3}$/;

const dosDig = (n) => String(n).padStart(2, '0');
const diasDelMes = (a, m) => new Date(a, m, 0).getDate();
const anio = (s) => { const n = parseInt(s, 10); return s.length === 2 ? 2000 + n : n; };

// En un texto de fechas las letras O/I/l casi siempre son 0/1 mal leídos
const arreglaDigitos = (s) => s.replace(/[Oo]/g, '0').replace(/[Il|]/g, '1');

function fechaValida(d, m, a) {
  return m >= 1 && m <= 12 && a >= 2000 && a <= 2100 && d >= 1 && d <= diasDelMes(a, m);
}

export function extraerFechas(texto, hoy = new Date()) {
  if (!texto) return [];
  const t = String(texto).toUpperCase().replace(/[ÁÀ]/g, 'A').replace(/É/g, 'E').replace(/Í/g, 'I').replace(/Ó/g, 'O').replace(/Ú/g, 'U');
  const cand = [];
  const usados = []; // rangos ya consumidos para no contar dos veces la misma fecha

  const solapa = (ini, fin) => usados.some(([a, b]) => ini < b && fin > a);
  const agrega = (ini, fin, d, m, a, conDia) => {
    if (solapa(ini, fin)) return;
    usados.push([ini, fin]); // aunque sea inválida, bloquea lecturas parciales (31/02/2027 no debe leerse como 02/2027)
    if (!fechaValida(d || 1, m, a)) return;
    const dia = conDia ? d : diasDelMes(a, m);
    const antes = t.slice(Math.max(0, ini - 16), ini);
    let score = 1 + (conDia ? 1 : 0);
    if (CLAVE_VENCE.test(antes)) score += 4;
    if (CLAVE_FABRICA.test(antes)) score -= 3;
    cand.push({ iso: `${a}-${dosDig(m)}-${dosDig(dia)}`, score, conDia });
  };

  let r;
  // 1) 15 MAR 2027 · 15MAR27 · MAR 2027 · MARZO/27
  const reMes = new RegExp(`(?:(\\d{1,2})\\s*[\\/.\\- ]?\\s*)?(${NOMBRES_MES})(?![A-Z])\\.?\\s*[\\/.\\-, ]?\\s*(\\d{4}|\\d{2})\\b`, 'g');
  while ((r = reMes.exec(t))) agrega(r.index, r.index + r[0].length, r[1] ? parseInt(r[1], 10) : null, MESES[r[2]], anio(r[3]), !!r[1]);

  // 2) 2027-03-15 · 2027/03
  const reIso = /\b(20\d{2})\s*[\/.\-]\s*([0-9OIl|]{1,2})(?:\s*[\/.\-]\s*([0-9OIl|]{1,2}))?\b/g;
  while ((r = reIso.exec(t))) agrega(r.index, r.index + r[0].length, r[3] ? parseInt(arreglaDigitos(r[3]), 10) : null, parseInt(arreglaDigitos(r[2]), 10), parseInt(r[1], 10), !!r[3]);

  // 3) 15/03/2027 · 15-03-27 · 03/2027 · 03.27
  const reNum = /(?<![0-9OIl|])([0-9OIl|]{1,2})\s*[\/.\-]\s*([0-9OIl|]{1,2})(?:\s*[\/.\-]\s*([0-9OIl|]{4}|[0-9OIl|]{2}))?(?![0-9OIl|])/g;
  while ((r = reNum.exec(t))) {
    const n1 = parseInt(arreglaDigitos(r[1]), 10);
    const n2 = parseInt(arreglaDigitos(r[2]), 10);
    const ini = r.index, fin = r.index + r[0].length;
    if (r[3]) {
      const a = anio(arreglaDigitos(r[3]));
      if (n2 > 12 && n1 <= 12) agrega(ini, fin, n2, n1, a, true); // mm/dd/aa
      else agrega(ini, fin, n1, n2, a, true);                     // dd/mm/aa (lo normal en Colombia)
    } else if (n1 >= 1 && n1 <= 12) {
      agrega(ini, fin, null, n1, n2 < 100 ? 2000 + n2 : n2, false); // mm/aa
    }
  }
  // 4) mm/aaaa suelto con año de 4 dígitos: 03/2027 (lo atrapa el caso 3 con 2 dígitos si el año es corto; aquí el largo)
  const reMA = /(?<![0-9OIl|])(0?[1-9OIl|]|1[0-2])\s*[\/.\-]\s*(20\d{2})(?![0-9])/g;
  while ((r = reMA.exec(t))) agrega(r.index, r.index + r[0].length, null, parseInt(arreglaDigitos(r[1]), 10), parseInt(r[2], 10), false);

  // Descarta lo muy viejo o muy lejano
  const min = new Date(hoy); min.setMonth(min.getMonth() - 6);
  const max = new Date(hoy); max.setFullYear(max.getFullYear() + 12);
  const lim = (iso) => { const d = new Date(iso + 'T12:00:00'); return d >= min && d <= max; };

  const unicas = new Map();
  for (const c of cand) {
    if (!lim(c.iso)) continue;
    const previa = unicas.get(c.iso);
    if (!previa || c.score > previa.score) unicas.set(c.iso, c);
  }
  // Sin palabra clave: entre varias fechas, la más lejana suele ser el vencimiento (la otra es fabricación/lote)
  return [...unicas.values()].sort((a, b) => b.score - a.score || (a.iso < b.iso ? 1 : -1));
}

// "2027-03-15" -> "15 mar 2027"
export function fechaLegible(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  const nombres = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${d} ${nombres[m - 1]} ${a}`;
}