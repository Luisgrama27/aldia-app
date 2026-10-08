// Búsqueda de productos por código de barras y clasificación por categoría.
// Fuentes: Open Food Facts y sus bases hermanas (cuidado personal, mascotas y otros productos).

const CAMPOS = [
  'product_name', 'product_name_es', 'generic_name', 'brands', 'quantity',
  'product_quantity', 'product_quantity_unit', 'categories', 'categories_tags',
].join(',');

const MEMORIA = 'aldia_codigos';

const normalizar = (texto) => String(texto || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

// ---------- 1. Por el nombre del producto (lo más fiable en productos de Colombia) ----------
// Gana la primera regla que coincida, así que el orden importa.
const REGLAS_TEXTO = [
  ['Mascotas', /\b(para (perros?|gatos?|mascotas?)|mascotas?|cachorros?|caninos?|felinos?|dog chow|cat chow|pedigree|whiskas|purina|chunky|agility|gatarina|dogourmet|pet)\b/],
  ['Bebé', /\b(bebe|bebes|panal|panales|formula infantil|papilla|toallitas humedas)\b/],
  ['Medicamentos', /\b(acetaminofen|ibuprofeno|naproxeno|diclofenaco|loratadina|omeprazol|dolex|advil|antigripal|suero oral|acido acetilsalicilico)\b|\b\d+\s?mg\b/],
  ['Limpieza', /\b(detergente|lavaplatos|lavavajillas|limpiador|desinfectante|cloro|blanqueador|suavizante|ambientador|multiusos|limpiavidrios|desengrasante|desmanchador|quitamanchas|insecticida|trapero|esponja|bolsas? (de|para) basura|jabon (de|para) (ropa|loza|platos|lavadora)|jabon en barra)\b/],
  ['Cuidado personal', /\b(shampoo|champu|acondicionador|enjuague bucal|crema dental|pasta dental|cepillo dental|desodorante|jabon (de )?(tocador|manos|corporal|liquido|protex|dove|palmolive)|gel (de )?(bano|ducha|cabello)|crema (corporal|facial|para (manos|cara|cuerpo))|protector solar|bloqueador|toallas? higienicas?|papel higienico|tampones|rasuradora|afeitar|locion|perfume|colonia|maquillaje|esmalte|talco|hilo dental|cotonetes|protex|colgate|pantene|sedal|nivea|rexona|gillette)\b/],
  ['Limpieza', /\bjabon\b/],
  ['Congelados', /\b(congelad[oa]s?|helados?|frozen)\b/],
  ['Enlatados', /\b(enlatad[oa]s?|en lata|conservas?|atun|sardinas?|latas?)\b/],
  ['Salsas y condimentos', /\b(salsas?|mayonesa|ketchup|catsup|mostaza|aderezo|vinagre|vinagreta|aceite|condimento|sazonador|especias?|pimienta|comino|sofrito|caldo|consome|adobo|pesto|bechamel|hogao|guacamole|tartara|chimichurri|sal|pasta de tomate|pure de tomate)\b/],
  ['Bebidas', /\bchocolate (instantaneo|en polvo|de mesa)\b/],
  ['Snacks y dulces', /\b(galletas?|chocolates?|chocolatinas?|dulces?|caramelos?|chicles?|bombones?|gomitas?|snacks?|papas fritas|papitas|chips|nachos|manies?|barras? de cereal|postres?|gelatina|arequipe|bocadillo|turron|mermelada|confites?|paletas?|waffles?|cheetos|doritos|chocoramo|pasabocas?|wafer|oblea|brownies?|donas?|cupcakes?|mantequilla de mani|crema de mani)\b/],
  ['Panadería y repostería', /\b(pan|panes|tostadas?|arepas?|pasteles?|tortas?|ponques?|croissants?|bizcochos?|levadura|polvo de hornear|empanadas?|bunuelos?|almojabanas?|pandebonos?|tortillas?|masa|mantecadas?|panaderia)\b/],
  ['Granos y cereales', /\b(sopas?|crema de (pollo|tomate|champinones|verduras))\b/],
  ['Lácteos', /\b(leche|leches|yogur|yogurt|yoghurt|kumis|queso|quesos|mantequilla|margarina|crema de leche|cuajada|kefir|lacteos?|huevos?|requeson|natilla|avena alpina)\b/],
  ['Pescados y mariscos', /\b(pescados?|tilapia|salmon|camarones?|mariscos?|calamar|trucha|bagre|bocachico|langostinos?|pulpo|mojarra|merluza)\b/],
  ['Carnes', /\b(carnes?|res|pollo|cerdo|chorizos?|salchichas?|salchichon|jamon|tocino|tocineta|chuletas?|costillas?|molida|pechuga|muslos?|alitas?|mortadela|butifarra|morcilla|longaniza|lomo|solomillo|hamburguesas?|pernil|cordero|pavo)\b/],
  ['Granos y cereales', /\b(arroz|frijol|frijoles|lentejas?|garbanzos?|pastas?|espagueti|spaghetti|macarron|macarrones|fideos?|cereal|cereales|avena|harina|quinua|maiz|cebada|trigo|maicena|granola|coditos|tallarines?|lasana|arvejas?|soya)\b/],
  ['Bebidas', /\b(gaseosa|bebidas?|jugos?|agua|aguas|refresco|cerveza|vino|ron|aguardiente|whisky|vodka|tequila|te (verde|negro|helado|frio|de|en|con|limon|durazno)|energizante|isotonica|malta|limonada|nectar|aromatica|cafe|capuchino|hatsu|gatorade|powerade|coca ?cola|pepsi|sprite|fanta|postobon|club colombia|aguila|poker|smirnoff)\b/],
  ['Frutas y verduras', /\b(frutas?|verduras?|hortalizas?|tomates?|cebollas?|papas?|zanahorias?|lechugas?|manzanas?|bananos?|platanos?|naranjas?|limones?|aguacates?|fresas?|moras?|pinas?|mangos?|papayas?|ensaladas?|espinacas?|brocoli|pepinos?|pimenton|ajos?|cilantro|uvas?|sandia|melon|mandarinas?|guayabas?|maracuya|lulo|champinones?|remolacha|repollo|coliflor|yuca|ahuyama|calabacin)\b/],
];

// ---------- 2. Por las etiquetas de categoría de Open Food Facts (respaldo) ----------
// Etiquetas muy generales que no dicen qué es el producto (traen "bebidas" y confunden)
const ETIQUETA_GENERAL = /foods?-and-beverages|^en:groceries$|^en:foods?$|^en:plant-based-foods$|^en:fermented-foods$|^en:fermented-milk-products$|^en:beverages-and-beverages-preparations$/;

const REGLAS_ETIQUETA = [
  ['Mascotas', /\b(pet food|dog food|cat food|animal feed)\b/],
  ['Bebé', /\bbaby\b/],
  ['Congelados', /\bfrozen\b/],
  ['Enlatados', /\b(canned|preserved foods?|conserves?)\b/],
  ['Salsas y condimentos', /\b(sauces?|condiments?|spices?|seasonings?|vinegars?|oils?|mayonnaises?|ketchups?)\b/],
  ['Snacks y dulces', /\b(snacks?|chips|crisps|chocolates?|candies|confectioneries|cookies|biscuits|sweets?)\b/],
  ['Panadería y repostería', /\b(breads?|bakery|pastr(y|ies)|cakes?)\b/],
  ['Lácteos', /\b(dairies|dairy|milks?|cheeses?|yogh?urts?|butters?|creams?|eggs?)\b/],
  ['Pescados y mariscos', /\b(fish(es)?|seafoods?|tunas?|salmons?|shrimps?)\b/],
  ['Carnes', /\b(meats?|beef|pork|chicken|poultry|sausages?|hams?|charcuterie)\b/],
  ['Granos y cereales', /\b(cereals?|pastas?|rice|flours?|legumes?|pulses?|oats?|grains?|lentils?|beans?)\b/],
  ['Bebidas', /\b(beverages?|waters?|sodas?|juices?|coffees?|teas?|drinks?)\b/],
  ['Frutas y verduras', /\b(fruits?|vegetables?)\b/],
];

const porTexto = (texto) => {
  const t = normalizar(texto);
  if (!t.trim()) return null;
  for (const [categoria, regla] of REGLAS_TEXTO) if (regla.test(t)) return categoria;
  return null;
};

const porEtiquetas = (tags = []) => {
  const utiles = tags
    .map(t => String(t).toLowerCase())
    .filter(t => !ETIQUETA_GENERAL.test(t))
    .map(t => t.replace(/^[a-z]{2}:/, '').replace(/-/g, ' '));
  for (const [categoria, regla] of REGLAS_ETIQUETA) if (utiles.some(t => regla.test(t))) return categoria;
  return null;
};

// Devuelve { categoria, segura }: "segura" si salió del nombre del producto
export function clasificarProducto({ nombre = '', generico = '', categorias = '', tags = [] } = {}) {
  const delNombre = porTexto(`${nombre} ${generico}`);
  if (delNombre) return { categoria: delNombre, segura: true };
  const delTexto = porTexto(categorias);
  if (delTexto) return { categoria: delTexto, segura: false };
  const delasTags = porEtiquetas(tags);
  if (delasTags) return { categoria: delasTags, segura: false };
  return { categoria: null, segura: false };
}

// ---------- Memoria: lo que la persona guardó la última vez con ese código ----------
const leerMemoria = () => {
  try { return JSON.parse(localStorage.getItem(MEMORIA) || '{}'); } catch { return {}; }
};

export function recordarProducto(barcode, { nombre, categoria, cantidad } = {}) {
  if (!barcode || !nombre) return;
  try {
    const memoria = leerMemoria();
    delete memoria[barcode];
    memoria[barcode] = { nombre, categoria: categoria || null, cantidad: cantidad || '' };
    const claves = Object.keys(memoria);
    if (claves.length > 300) delete memoria[claves[0]];
    localStorage.setItem(MEMORIA, JSON.stringify(memoria));
  } catch { /* sin almacenamiento disponible */ }
}

// ---------- Consulta a las bases de datos ----------
const BASES = [
  { dominio: 'world.openfoodfacts.org', categoria: null },
  { dominio: 'world.openbeautyfacts.org', categoria: 'Cuidado personal' },
  { dominio: 'world.openpetfoodfacts.org', categoria: 'Mascotas' },
  { dominio: 'world.openproductsfacts.org', categoria: null },
];

// Devuelve el producto, null si no existe, o lanza error si falla la conexión
async function consultar(dominio, codigo) {
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), 7000);
  try {
    const res = await fetch(
      `https://${dominio}/api/v2/product/${encodeURIComponent(codigo)}.json?fields=${CAMPOS}`,
      { signal: control.signal }
    );
    const datos = await res.json();
    return datos.status === 1 && datos.product ? datos.product : null;
  } finally {
    clearTimeout(temporizador);
  }
}

const armarCantidad = (p) => {
  const texto = (p.quantity || '').trim();
  if (texto) return texto;
  if (p.product_quantity && p.product_quantity_unit) return `${p.product_quantity} ${p.product_quantity_unit}`;
  return '';
};

// Devuelve { barcode, encontrado, nombre, cantidad, categoria, categoriaSegura, error }
export async function buscarProducto(codigo) {
  const barcode = String(codigo).trim();

  const recordado = leerMemoria()[barcode];
  if (recordado) {
    return { barcode, encontrado: true, nombre: recordado.nombre, cantidad: recordado.cantidad, categoria: recordado.categoria, categoriaSegura: true };
  }

  const candidatos = /^\d{12}$/.test(barcode) ? [barcode, `0${barcode}`] : [barcode];
  let fallosDeRed = 0;
  let producto = null;
  let base = BASES[0];

  for (const c of candidatos) {
    try { producto = await consultar(BASES[0].dominio, c); } catch { fallosDeRed++; }
    if (producto) break;
  }

  if (!producto) {
    const respuestas = await Promise.all(BASES.slice(1).map(async (b) => {
      try { return { b, p: await consultar(b.dominio, candidatos[0]) }; }
      catch { fallosDeRed++; return { b, p: null }; }
    }));
    const hallada = respuestas.find(r => r.p);
    if (hallada) { producto = hallada.p; base = hallada.b; }
  }

  if (!producto) return { barcode, encontrado: false, error: fallosDeRed >= 2 };

  let nombre = (producto.product_name_es || producto.product_name || producto.generic_name || '').trim();
  const marca = (producto.brands || '').split(',')[0].trim();
  if (nombre && marca && !normalizar(nombre).includes(normalizar(marca))) nombre = `${nombre} ${marca}`;
  if (!nombre) return { barcode, encontrado: false };

  const clasificado = clasificarProducto({
    nombre,
    generico: producto.generic_name,
    categorias: producto.categories,
    tags: producto.categories_tags,
  });
  const categoria = base.categoria || clasificado.categoria;
  return {
    barcode,
    encontrado: true,
    nombre,
    cantidad: armarCantidad(producto),
    categoria,
    categoriaSegura: Boolean(base.categoria) || clasificado.segura,
  };
}