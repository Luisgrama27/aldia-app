// Países, ciudades y prefijos telefónicos para el registro

const FRECUENTES = ['CO', 'MX', 'PE', 'EC', 'VE', 'AR', 'CL', 'ES', 'US', 'PA', 'BR', 'CR', 'DO', 'GT', 'BO', 'UY', 'PY', 'HN', 'SV', 'NI', 'CU', 'PR'];

const CODIGOS = (
  'AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ ' +
  'DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP ' +
  'KE KG KH KI KM KN KP KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MR MT MU MV MW MX MY MZ NA NE NG NI ' +
  'NL NO NP NR NZ OM PA PE PG PH PK PL PR PS PT PW PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH ' +
  'TJ TL TM TN TO TR TT TV TZ UA UG US UY UZ VA VC VE VN VU WS XK YE ZA ZM ZW'
).split(' ');

const NOMBRES_RESPALDO = {
  CO: 'Colombia', MX: 'México', PE: 'Perú', EC: 'Ecuador', VE: 'Venezuela', AR: 'Argentina', CL: 'Chile', ES: 'España',
  US: 'Estados Unidos', PA: 'Panamá', BR: 'Brasil', CR: 'Costa Rica', DO: 'República Dominicana', GT: 'Guatemala',
  BO: 'Bolivia', UY: 'Uruguay', PY: 'Paraguay', HN: 'Honduras', SV: 'El Salvador', NI: 'Nicaragua', CU: 'Cuba', PR: 'Puerto Rico',
};

let traductor = null;
try { traductor = new Intl.DisplayNames(['es'], { type: 'region' }); } catch { /* navegador sin soporte: se usan los nombres de respaldo */ }

export function nombrePais(codigo) {
  try {
    const n = traductor && traductor.of(codigo);
    if (n && n !== codigo) return n;
  } catch { /* código sin nombre */ }
  return NOMBRES_RESPALDO[codigo] || codigo;
}

// { frecuentes: [{codigo, nombre}], otros: [{codigo, nombre}] }
export function listaPaises() {
  const aNombre = codigo => ({ codigo, nombre: nombrePais(codigo) });
  const frecuentes = FRECUENTES.map(aNombre);
  const otros = CODIGOS.filter(c => !FRECUENTES.includes(c)).map(aNombre).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  return { frecuentes, otros };
}

export const PREFIJOS = {
  CO: '+57', MX: '+52', PE: '+51', EC: '+593', VE: '+58', AR: '+54', CL: '+56', ES: '+34', US: '+1', CA: '+1', PA: '+507',
  BR: '+55', CR: '+506', DO: '+1', GT: '+502', BO: '+591', UY: '+598', PY: '+595', HN: '+504', SV: '+503', NI: '+505',
  CU: '+53', PR: '+1', FR: '+33', DE: '+49', IT: '+39', GB: '+44', PT: '+351', NL: '+31',
};

// Deja solo los dígitos del número; en Colombia quita el 57 si la persona lo escribió
function soloNumero(codigoPais, valor) {
  const digitos = String(valor).replace(/\D/g, '');
  if (codigoPais === 'CO' && digitos.length === 12 && digitos.startsWith('57')) return digitos.slice(2);
  return digitos;
}

// null: vacío (el teléfono es opcional) · true / false: válido o no
export function validarTelefono(codigoPais, valor) {
  const texto = String(valor).trim();
  if (!texto) return null;
  const digitos = soloNumero(codigoPais, texto);
  if (PREFIJOS[codigoPais]) {
    return codigoPais === 'CO' ? /^\d{10}$/.test(digitos) : digitos.length >= 6 && digitos.length <= 12;
  }
  return texto.startsWith('+') && digitos.length >= 8 && digitos.length <= 15;
}

export function telefonoCompleto(codigoPais, valor) {
  const digitos = soloNumero(codigoPais, valor);
  if (!digitos) return '';
  return PREFIJOS[codigoPais] ? `${PREFIJOS[codigoPais]}${digitos}` : `+${digitos}`;
}

// Colombia: departamento → municipios principales (la capital va primero)
export const COLOMBIA = {
  'Amazonas': ['Leticia', 'Puerto Nariño'],
  'Antioquia': ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Sabaneta', 'La Estrella', 'Caldas', 'Copacabana', 'Girardota', 'Rionegro', 'Marinilla', 'Apartadó', 'Turbo', 'Carepa', 'Chigorodó', 'Necoclí', 'Caucasia', 'Santa Fe de Antioquia', 'Yarumal', 'Andes', 'Jericó', 'Sonsón', 'Puerto Berrío', 'Segovia'],
  'Arauca': ['Arauca', 'Arauquita', 'Saravena', 'Tame', 'Fortul'],
  'Atlántico': ['Barranquilla', 'Soledad', 'Malambo', 'Sabanalarga', 'Baranoa', 'Puerto Colombia', 'Galapa', 'Santo Tomás', 'Sabanagrande'],
  'Bogotá D.C.': ['Bogotá'],
  'Bolívar': ['Cartagena', 'Magangué', 'Turbaco', 'Arjona', 'El Carmen de Bolívar', 'Mompós', 'San Juan Nepomuceno', 'Mahates', 'Santa Rosa del Sur', 'Simití'],
  'Boyacá': ['Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá', 'Paipa', 'Villa de Leyva', 'Moniquirá', 'Puerto Boyacá', 'Garagoa', 'Samacá'],
  'Caldas': ['Manizales', 'La Dorada', 'Chinchiná', 'Villamaría', 'Riosucio', 'Anserma', 'Aguadas', 'Salamina', 'Supía'],
  'Caquetá': ['Florencia', 'San Vicente del Caguán', 'Puerto Rico', 'Belén de los Andaquíes', 'Cartagena del Chairá'],
  'Casanare': ['Yopal', 'Aguazul', 'Villanueva', 'Tauramena', 'Paz de Ariporo', 'Monterrey'],
  'Cauca': ['Popayán', 'Santander de Quilichao', 'Puerto Tejada', 'Patía', 'Piendamó', 'Silvia', 'Guapi', 'Timbío', 'Miranda', 'Corinto'],
  'Cesar': ['Valledupar', 'Aguachica', 'Bosconia', 'Codazzi', 'La Jagua de Ibirico', 'Chimichagua', 'Curumaní', 'Pailitas'],
  'Chocó': ['Quibdó', 'Istmina', 'Tadó', 'Condoto', 'Acandí', 'Bahía Solano', 'Nuquí', 'Riosucio', 'Unguía', 'Bajo Baudó', 'Medio Atrato', 'Lloró', 'Bagadó', 'Carmen del Darién', 'Juradó', 'Sipí', 'Nóvita'],
  'Córdoba': ['Montería', 'Cereté', 'Lorica', 'Sahagún', 'Montelíbano', 'Planeta Rica', 'Tierralta', 'Ayapel', 'Puerto Libertador', 'Ciénaga de Oro'],
  'Cundinamarca': ['Soacha', 'Fusagasugá', 'Facatativá', 'Zipaquirá', 'Chía', 'Girardot', 'Mosquera', 'Madrid', 'Funza', 'Cajicá', 'Sibaté', 'Cota', 'La Calera', 'Ubaté', 'Villeta', 'Tocancipá', 'Sopó'],
  'Guainía': ['Inírida'],
  'Guaviare': ['San José del Guaviare', 'Calamar', 'El Retorno'],
  'Huila': ['Neiva', 'Pitalito', 'Garzón', 'La Plata', 'Campoalegre', 'Gigante', 'Rivera', 'Aipe'],
  'La Guajira': ['Riohacha', 'Maicao', 'Uribia', 'Manaure', 'Fonseca', 'San Juan del Cesar', 'Villanueva', 'Albania'],
  'Magdalena': ['Santa Marta', 'Ciénaga', 'Fundación', 'El Banco', 'Plato', 'Aracataca', 'Zona Bananera', 'Pivijay'],
  'Meta': ['Villavicencio', 'Acacías', 'Granada', 'Puerto López', 'San Martín', 'Cumaral', 'Puerto Gaitán', 'Restrepo'],
  'Nariño': ['Pasto', 'Tumaco', 'Ipiales', 'Túquerres', 'Samaniego', 'La Unión', 'Barbacoas', 'Sandoná'],
  'Norte de Santander': ['Cúcuta', 'Ocaña', 'Pamplona', 'Villa del Rosario', 'Los Patios', 'Tibú', 'Ábrego'],
  'Putumayo': ['Mocoa', 'Puerto Asís', 'Orito', 'Valle del Guamuez', 'Sibundoy', 'Villagarzón'],
  'Quindío': ['Armenia', 'Calarcá', 'Montenegro', 'La Tebaida', 'Quimbaya', 'Circasia', 'Filandia', 'Salento'],
  'Risaralda': ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal', 'La Virginia', 'Marsella'],
  'San Andrés y Providencia': ['San Andrés', 'Providencia'],
  'Santander': ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja', 'San Gil', 'Socorro', 'Barbosa', 'Málaga', 'Vélez'],
  'Sucre': ['Sincelejo', 'Corozal', 'Sampués', 'San Marcos', 'Tolú', 'Coveñas', 'Majagual'],
  'Tolima': ['Ibagué', 'Espinal', 'Melgar', 'Honda', 'Chaparral', 'Líbano', 'Mariquita', 'Flandes', 'Guamo'],
  'Valle del Cauca': ['Cali', 'Buenaventura', 'Palmira', 'Tuluá', 'Cartago', 'Buga', 'Jamundí', 'Yumbo', 'Candelaria', 'Florida', 'Sevilla', 'Zarzal', 'Roldanillo'],
  'Vaupés': ['Mitú'],
  'Vichada': ['Puerto Carreño', 'La Primavera', 'Cumaribo'],
};

// Otros países: ciudades principales. Si un país no está aquí, la ciudad se escribe.
export const CIUDADES = {
  MX: ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Ciudad Juárez', 'Zapopan', 'Mérida', 'Querétaro', 'Cancún', 'San Luis Potosí', 'Chihuahua', 'Aguascalientes', 'Hermosillo', 'Morelia', 'Saltillo', 'Veracruz', 'Toluca', 'Culiacán', 'Oaxaca'],
  PE: ['Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Piura', 'Cusco', 'Iquitos', 'Huancayo', 'Tacna', 'Pucallpa', 'Cajamarca', 'Chimbote', 'Ica'],
  EC: ['Quito', 'Guayaquil', 'Cuenca', 'Ambato', 'Manta', 'Machala', 'Loja', 'Santo Domingo', 'Portoviejo', 'Esmeraldas', 'Ibarra', 'Riobamba'],
  VE: ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Maracay', 'Ciudad Guayana', 'Barcelona', 'Maturín', 'San Cristóbal', 'Mérida', 'Cumaná', 'Puerto La Cruz'],
  AR: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'San Miguel de Tucumán', 'Mar del Plata', 'Salta', 'Santa Fe', 'San Juan', 'Neuquén', 'Bariloche'],
  CL: ['Santiago', 'Valparaíso', 'Viña del Mar', 'Concepción', 'Antofagasta', 'La Serena', 'Temuco', 'Rancagua', 'Puerto Montt', 'Iquique'],
  ES: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Bilbao', 'Alicante', 'Las Palmas de Gran Canaria', 'Valladolid', 'Granada'],
  US: ['Nueva York', 'Los Ángeles', 'Miami', 'Houston', 'Chicago', 'Orlando', 'Dallas', 'Atlanta', 'Washington D. C.', 'San Francisco', 'Boston', 'Phoenix', 'Seattle', 'Las Vegas'],
  PA: ['Ciudad de Panamá', 'Colón', 'David', 'Santiago', 'Chitré', 'La Chorrera', 'Penonomé'],
  BR: ['São Paulo', 'Río de Janeiro', 'Brasilia', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaos', 'Curitiba', 'Recife', 'Porto Alegre'],
  BO: ['La Paz', 'Santa Cruz de la Sierra', 'Cochabamba', 'Sucre', 'El Alto', 'Oruro', 'Tarija'],
  UY: ['Montevideo', 'Salto', 'Paysandú', 'Punta del Este'],
  PY: ['Asunción', 'Ciudad del Este', 'Encarnación'],
  CR: ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Liberia'],
  GT: ['Ciudad de Guatemala', 'Quetzaltenango', 'Antigua Guatemala'],
  DO: ['Santo Domingo', 'Santiago de los Caballeros', 'Punta Cana'],
  HN: ['Tegucigalpa', 'San Pedro Sula'],
  SV: ['San Salvador', 'Santa Ana', 'San Miguel'],
  NI: ['Managua', 'León', 'Granada'],
  CU: ['La Habana', 'Santiago de Cuba', 'Camagüey'],
  PR: ['San Juan', 'Ponce', 'Mayagüez'],
  CA: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa'],
};