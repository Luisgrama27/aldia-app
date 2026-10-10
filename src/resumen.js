// Resumen del estado de la despensa para la tarjeta principal de Inicio

const textoVence = (d) => {
  if (d < 0) return `Venció hace ${-d} día${d === -1 ? '' : 's'}`;
  if (d === 0) return 'Vence hoy';
  if (d === 1) return 'Vence mañana';
  return `Vence en ${d} días`;
};

// dias(exp) devuelve los días que faltan; estado(producto) devuelve expired | danger | warn | ok
export function resumenDespensa(productos, dias, estado) {
  const total = productos.length;
  const lista = productos.map(p => ({ p, d: dias(p.exp), st: estado(p) }));
  const atencion = lista.filter(x => x.st !== 'ok');
  const hayUrgente = atencion.some(x => x.st === 'expired' || x.st === 'danger');
  const siguiente = [...lista].sort((a, b) => a.d - b.d)[0];
  const ok = total - atencion.length;
  return {
    estado: !atencion.length ? 'ok' : hayUrgente ? 'danger' : 'warn',
    pill: !atencion.length ? 'Al día' : hayUrgente ? 'Urgente' : 'Por vencer',
    titulo: !atencion.length ? 'Todo al día' : `${atencion.length} producto${atencion.length !== 1 ? 's' : ''} por atender`,
    subtitulo: `${total} producto${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}`,
    pct: total ? Math.round((ok / total) * 100) : 0,
    siguiente: siguiente ? `${textoVence(siguiente.d)} · ${siguiente.p.name}` : '',
  };
}