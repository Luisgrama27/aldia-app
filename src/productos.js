// Búsqueda de productos por código de barras (Open Food Facts)

const CAMPOS = 'product_name,product_name_es,generic_name,brands,quantity,categories_tags';

// Reglas en orden: gana la primera que coincida con alguna etiqueta del producto
const REGLAS_CATEGORIA = [
  ['Mascotas', /pet-food|dog-food|cat-food|animal-feed/],
  ['Bebé', /baby/],
  ['Congelados', /frozen/],
  ['Enlatados', /canned|preserved|conserve/],
  ['Snacks y dulces', /snack|chips|crisps|chocolate|candies|confectionery|cookies|biscuits|sweet/],
  ['Panadería y repostería', /bread|bakery|pastr|cakes/],
  ['Lácteos', /dairies|dairy|milk|cheese|yogurt|yoghurt|butter|cream/],
  ['Pescados y mariscos', /fish|seafood|tuna|salmon|shrimp/],
  ['Carnes', /meat|beef|pork|chicken|poultry|sausage|ham|charcuterie/],
  ['Salsas y condimentos', /sauce|condiment|spice|seasoning|vinegar|oil|mayonnaise|ketchup/],
  ['Granos y cereales', /cereal|pasta|rice|flour|legume|pulse|oat|grain|lentil|bean/],
  ['Bebidas', /beverage|water|soda|juice|coffee|tea|drink/],
  ['Frutas y verduras', /fruit|vegetable/],
];

export function categoriaDesdeTags(tags = []) {
  const texto = tags.map(t => String(t).toLowerCase());
  for (const [categoria, regla] of REGLAS_CATEGORIA) {
    if (texto.some(t => regla.test(t))) return categoria;
  }
  return null;
}

// Devuelve { barcode, encontrado, nombre, cantidad, categoria, error }
export async function buscarProducto(codigo) {
  const barcode = String(codigo).trim();
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), 8000);
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${CAMPOS}`,
      { signal: control.signal }
    );
    const datos = await res.json();
    if (datos.status !== 1 || !datos.product) return { barcode, encontrado: false };
    const p = datos.product;
    let nombre = (p.product_name_es || p.product_name || p.generic_name || '').trim();
    const marca = (p.brands || '').split(',')[0].trim();
    if (nombre && marca && !nombre.toLowerCase().includes(marca.toLowerCase())) nombre = `${nombre} ${marca}`;
    return {
      barcode,
      encontrado: Boolean(nombre),
      nombre,
      cantidad: (p.quantity || '').trim(),
      categoria: categoriaDesdeTags(p.categories_tags),
    };
  } catch {
    return { barcode, encontrado: false, error: true };
  } finally {
    clearTimeout(temporizador);
  }
}