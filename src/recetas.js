// Recetario de Al Día.
// Cada receta tiene "clave": los ingredientes principales que hacen que se pueda sugerir.
// En "ing", el segundo valor de cada ingrediente es su etiqueta (vacío si es un básico de despensa).

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Palabras que, escritas en el nombre de un producto, lo asocian a un ingrediente
const PALABRAS = {
  leche: ['leche'],
  huevo: ['huevo', 'huevos'],
  pollo: ['pollo', 'pechuga', 'alitas', 'muslo', 'muslos', 'pernil'],
  res: ['res', 'carne', 'bistec', 'churrasco', 'lomo', 'molida', 'sobrebarriga', 'posta'],
  cerdo: ['cerdo', 'chuleta', 'chuletas', 'tocino', 'costillas'],
  salchicha: ['salchicha', 'salchichas', 'chorizo', 'salchichon', 'butifarra'],
  atun: ['atun', 'sardina', 'sardinas'],
  pescado: ['pescado', 'tilapia', 'salmon', 'bagre', 'mojarra', 'trucha'],
  arroz: ['arroz'],
  pasta: ['pasta', 'espagueti', 'spaghetti', 'fideos', 'fideo', 'macarrones', 'macarron', 'tallarines'],
  papa: ['papa', 'papas', 'patata'],
  platano: ['platano', 'platanos', 'maduro', 'maduros'],
  banano: ['banano', 'bananos', 'banana', 'guineo'],
  tomate: ['tomate', 'tomates'],
  cebolla: ['cebolla', 'cebollas', 'cebolleta'],
  zanahoria: ['zanahoria', 'zanahorias'],
  verduras: ['verdura', 'verduras', 'lechuga', 'espinaca', 'brocoli', 'repollo', 'pimenton', 'pepino', 'habichuela', 'habichuelas', 'coliflor', 'calabacin', 'apio'],
  fruta: ['fruta', 'frutas', 'manzana', 'manzanas', 'pera', 'peras', 'mango', 'papaya', 'fresa', 'fresas', 'uva', 'uvas', 'naranja', 'mandarina', 'pina', 'guayaba', 'sandia', 'melon', 'durazno', 'lulo', 'mora', 'maracuya', 'kiwi'],
  queso: ['queso', 'quesos', 'cuajada', 'mozzarella'],
  yogur: ['yogur', 'yogurt', 'kumis'],
  pan: ['pan', 'panes', 'tostada', 'tostadas'],
  frijol: ['frijol', 'frijoles', 'lenteja', 'lentejas', 'garbanzo', 'garbanzos', 'arveja', 'arvejas'],
  harina: ['harina'],
  avena: ['avena'],
};

// Productos procesados con sabor a fruta (una mermelada de fresa no es fruta fresca)
const PROCESADOS = ['mermelada', 'jalea', 'jugo', 'nectar', 'gelatina', 'helado', 'bocadillo', 'arequipe', 'gaseosa'];

export function etiquetasDe(nombre) {
  const palabras = norm(nombre).split(/[^a-z0-9]+/).filter(Boolean);
  const procesado = palabras.some((w) => PROCESADOS.includes(w));
  return Object.keys(PALABRAS).filter((tag) => {
    if (procesado && tag === 'fruta') return false;
    return PALABRAS[tag].some((kw) => palabras.some((w) => w === kw || (kw.length >= 5 && w.startsWith(kw))));
  });
}

export const RECETAS = [
  { id: 'arroz-salchicha', n: 'Arroz con salchicha', e: '🍚', min: 20, por: 3, clave: ['arroz', 'salchicha'],
    ing: [['2 tazas de arroz cocido', 'arroz'], ['3 salchichas en rodajas', 'salchicha'], ['1/2 cebolla picada', ''], ['1 tomate picado', ''], ['2 cucharadas de aceite', ''], ['Sal y comino al gusto', '']],
    pasos: ['Sofríe la cebolla y el tomate en el aceite por 5 minutos.', 'Agrega las salchichas y dóralas 5 minutos.', 'Suma el arroz, mezcla y calienta 5 minutos más.', 'Ajusta la sal y el comino y sirve caliente.'] },
  { id: 'salchipapa', n: 'Salchipapa casera', e: '🍟', min: 25, por: 2, clave: ['salchicha', 'papa'],
    ing: [['4 papas medianas en bastones', 'papa'], ['3 salchichas en rodajas', 'salchicha'], ['Aceite para freír', ''], ['Sal', ''], ['Salsas al gusto', '']],
    pasos: ['Pela las papas, córtalas en bastones y sécalas bien.', 'Fríelas en aceite caliente 12 a 15 minutos hasta que doren y escúrrelas.', 'Dora las salchichas 3 a 4 minutos.', 'Mezcla todo, sala y sirve con tus salsas.'] },
  { id: 'pasta-salchicha', n: 'Pasta con salchicha', e: '🍝', min: 20, por: 3, clave: ['pasta', 'salchicha'],
    ing: [['250 g de pasta', 'pasta'], ['3 salchichas en rodajas', 'salchicha'], ['1 tomate picado', ''], ['1/2 cebolla picada', ''], ['Aceite, sal y orégano', '']],
    pasos: ['Cocina la pasta en agua con sal según el empaque y escúrrela.', 'Sofríe la cebolla y el tomate 5 minutos.', 'Agrega las salchichas y cocina 5 minutos.', 'Mezcla con la pasta, añade orégano y sirve.'] },
  { id: 'arroz-leche', n: 'Arroz con leche', e: '🍮', min: 35, por: 4, clave: ['arroz', 'leche'],
    ing: [['1 taza de arroz', 'arroz'], ['4 tazas de leche', 'leche'], ['3 cucharadas de azúcar o panela', ''], ['1 rama de canela', ''], ['1 pizca de sal', '']],
    pasos: ['Cocina el arroz con 1 taza de agua y la canela por 10 minutos.', 'Agrega la leche y cocina a fuego bajo 20 minutos, revolviendo, hasta que espese.', 'Endulza y agrega la pizca de sal.', 'Sirve tibio o frío.'] },
  { id: 'natilla', n: 'Natilla', e: '🍮', min: 30, por: 6, clave: ['leche'],
    ing: [['4 tazas de leche', 'leche'], ['1/2 taza de maicena', ''], ['1/2 panela rallada o 1 taza de azúcar', ''], ['1 rama de canela', ''], ['Coco rallado o uvas pasas (opcional)', '']],
    pasos: ['Disuelve la maicena en 1 taza de leche fría.', 'Hierve las otras 3 tazas de leche con la panela y la canela.', 'Agrega la mezcla de maicena sin dejar de revolver.', 'Cocina 10 a 15 minutos hasta que espese.', 'Pásala a un molde y refrigera 2 horas.'] },
  { id: 'batido-banano', n: 'Batido de banano y leche', e: '🥤', min: 5, por: 2, clave: ['banano', 'leche'],
    ing: [['2 bananos maduros', 'banano'], ['2 tazas de leche fría', 'leche'], ['1 cucharada de azúcar o miel (opcional)', ''], ['Hielo', '']],
    pasos: ['Pela y trocea los bananos.', 'Licúalos con la leche, el azúcar y el hielo por 1 minuto.', 'Sirve de inmediato.'] },
  { id: 'avena-leche', n: 'Avena en leche', e: '🥣', min: 10, por: 2, clave: ['avena', 'leche'],
    ing: [['1 taza de avena en hojuelas', 'avena'], ['3 tazas de leche', 'leche'], ['Canela y azúcar al gusto', '']],
    pasos: ['Calienta la leche con la canela.', 'Agrega la avena y cocina 5 a 8 minutos, revolviendo.', 'Endulza y sirve caliente.'] },
  { id: 'tostadas-francesas', n: 'Tostadas francesas', e: '🍞', min: 15, por: 2, clave: ['pan', 'huevo', 'leche'],
    ing: [['4 rebanadas de pan', 'pan'], ['2 huevos', 'huevo'], ['1/2 taza de leche', 'leche'], ['1 cucharada de azúcar y canela', ''], ['Mantequilla o aceite', '']],
    pasos: ['Bate los huevos con la leche, el azúcar y la canela.', 'Remoja cada rebanada de pan en la mezcla.', 'Dóralas en una sartén con mantequilla 2 a 3 minutos por lado.', 'Sirve con miel o fruta.'] },
  { id: 'panqueques', n: 'Panqueques', e: '🥞', min: 20, por: 3, clave: ['harina', 'leche', 'huevo'],
    ing: [['1 taza de harina de trigo', 'harina'], ['1 taza de leche', 'leche'], ['1 huevo', 'huevo'], ['1 cucharada de azúcar', ''], ['1 cucharadita de polvo de hornear', ''], ['Aceite o mantequilla', '']],
    pasos: ['Mezcla la harina, el azúcar y el polvo de hornear.', 'Agrega la leche y el huevo y bate hasta que no queden grumos.', 'Vierte 1/4 de taza de masa en una sartén engrasada a fuego medio.', 'Voltea cuando salgan burbujas y dora el otro lado.', 'Sirve con miel o fruta.'] },
  { id: 'huevos-pericos', n: 'Huevos pericos', e: '🍳', min: 10, por: 2, clave: ['huevo', 'tomate', 'cebolla'],
    ing: [['4 huevos', 'huevo'], ['2 tomates picados', 'tomate'], ['1/2 cebolla picada', 'cebolla'], ['1 cucharada de aceite o mantequilla', ''], ['Sal', '']],
    pasos: ['Sofríe la cebolla y el tomate 4 a 5 minutos.', 'Agrega los huevos batidos con sal.', 'Revuelve a fuego bajo hasta que cuajen.', 'Sirve con arepa o pan.'] },
  { id: 'tortilla-papa', n: 'Tortilla de papa', e: '🥔', min: 25, por: 3, clave: ['huevo', 'papa'],
    ing: [['3 papas medianas en láminas finas', 'papa'], ['4 huevos', 'huevo'], ['1/2 cebolla en tiras', ''], ['Aceite y sal', '']],
    pasos: ['Fríe las papas y la cebolla en poco aceite a fuego medio 12 minutos, hasta que estén blandas.', 'Mézclalas con los huevos batidos y sal.', 'Vierte en una sartén caliente y cocina 5 minutos.', 'Voltea con ayuda de un plato y cocina 4 minutos más.'] },
  { id: 'omelette-queso', n: 'Omelette de queso', e: '🧀', min: 10, por: 1, clave: ['huevo', 'queso'],
    ing: [['3 huevos', 'huevo'], ['1/2 taza de queso rallado o en cubos', 'queso'], ['Sal y pimienta', ''], ['1 cucharadita de mantequilla', '']],
    pasos: ['Bate los huevos con sal y pimienta.', 'Viértelos en una sartén con mantequilla a fuego medio.', 'Cuando cuaje el borde, agrega el queso.', 'Dobla el omelette y cocina 1 minuto más.'] },
  { id: 'arroz-huevo', n: 'Arroz con huevo', e: '🍚', min: 15, por: 2, clave: ['arroz', 'huevo'],
    ing: [['2 tazas de arroz cocido', 'arroz'], ['2 huevos', 'huevo'], ['1/2 cebolla larga picada', ''], ['2 cucharadas de aceite', ''], ['Salsa de soya o sal', '']],
    pasos: ['Calienta el aceite y sofríe la cebolla 2 minutos.', 'Agrega el arroz y saltea 3 minutos.', 'Haz un hueco en el centro y revuelve los huevos hasta que cuajen.', 'Mezcla todo con la soya y sirve.'] },
  { id: 'arroz-pollo', n: 'Arroz con pollo', e: '🍗', min: 40, por: 4, clave: ['pollo', 'arroz', 'zanahoria'],
    ing: [['2 tazas de arroz', 'arroz'], ['500 g de pollo en trozos', 'pollo'], ['1 zanahoria en cubitos', 'zanahoria'], ['1/2 cebolla y 1 tomate picados', ''], ['4 tazas de caldo o agua', ''], ['Aceite, sal y comino', '']],
    pasos: ['Dora el pollo en aceite 8 minutos y retíralo.', 'Sofríe la cebolla y el tomate en la misma olla.', 'Agrega el arroz, la zanahoria y el caldo, y regresa el pollo.', 'Cocina tapado a fuego bajo 20 a 25 minutos.', 'Deja reposar 5 minutos y sirve.'] },
  { id: 'pollo-guisado', n: 'Pollo guisado con papas', e: '🍲', min: 35, por: 3, clave: ['pollo', 'tomate', 'cebolla', 'papa'],
    ing: [['500 g de pollo en trozos', 'pollo'], ['3 tomates picados', 'tomate'], ['1 cebolla picada', 'cebolla'], ['3 papas en trozos', 'papa'], ['Ajo, sal, comino y aceite', '']],
    pasos: ['Sofríe la cebolla, el ajo y el tomate 6 minutos.', 'Agrega el pollo con los condimentos y dóralo 5 minutos.', 'Añade las papas y 1 taza de agua.', 'Cocina tapado 25 minutos, hasta que el pollo y las papas estén blandos.'] },
  { id: 'sopa-pollo', n: 'Sopa de pollo', e: '🍜', min: 45, por: 4, clave: ['pollo', 'papa', 'zanahoria'],
    ing: [['500 g de pollo', 'pollo'], ['3 papas en trozos', 'papa'], ['2 zanahorias en rodajas', 'zanahoria'], ['1/2 cebolla y cilantro', ''], ['2 litros de agua y sal', '']],
    pasos: ['Hierve el pollo con la cebolla 20 minutos.', 'Agrega las papas y las zanahorias.', 'Cocina 20 minutos más, hasta que todo esté blando.', 'Ajusta la sal y sirve con cilantro.'] },
  { id: 'pollo-horno', n: 'Pollo al horno con papas', e: '🍗', min: 45, por: 3, clave: ['pollo', 'papa'],
    ing: [['4 piezas de pollo', 'pollo'], ['4 papas en cuñas', 'papa'], ['2 cucharadas de aceite', ''], ['Ajo, sal, pimienta y paprika', '']],
    pasos: ['Precalienta el horno a 200 °C.', 'Mezcla el pollo y las papas con el aceite y los condimentos.', 'Hornea en una bandeja 40 a 45 minutos, volteando a la mitad.', 'Comprueba que el pollo no esté rosado por dentro.'] },
  { id: 'pasta-atun', n: 'Pasta con atún', e: '🍝', min: 20, por: 3, clave: ['pasta', 'atun', 'tomate'],
    ing: [['250 g de pasta', 'pasta'], ['1 lata de atún', 'atun'], ['2 tomates picados', 'tomate'], ['1/2 cebolla picada', ''], ['Aceite, sal y orégano', '']],
    pasos: ['Cocina la pasta y escúrrela.', 'Sofríe la cebolla y el tomate 6 minutos.', 'Agrega el atún escurrido y cocina 2 minutos.', 'Mezcla con la pasta y sirve.'] },
  { id: 'tortitas-atun', n: 'Tortitas de atún', e: '🐟', min: 25, por: 3, clave: ['atun', 'papa', 'huevo'],
    ing: [['1 lata de atún', 'atun'], ['2 papas cocidas y trituradas', 'papa'], ['1 huevo', 'huevo'], ['Cebolla picada, sal y pimienta', ''], ['Aceite para dorar', '']],
    pasos: ['Mezcla todos los ingredientes hasta obtener una masa firme.', 'Forma tortitas con las manos.', 'Dóralas en aceite 3 a 4 minutos por lado.', 'Sirve con ensalada.'] },
  { id: 'arroz-atun', n: 'Arroz con atún', e: '🍚', min: 15, por: 2, clave: ['arroz', 'atun'],
    ing: [['2 tazas de arroz cocido', 'arroz'], ['1 lata de atún', 'atun'], ['1/2 cebolla y 1 tomate picados', ''], ['Aceite, sal y comino', '']],
    pasos: ['Sofríe la cebolla y el tomate 5 minutos.', 'Agrega el atún escurrido y cocina 2 minutos.', 'Suma el arroz y mezcla 4 minutos.', 'Ajusta la sazón y sirve.'] },
  { id: 'picadillo-res', n: 'Picadillo de res con papa', e: '🥩', min: 30, por: 3, clave: ['res', 'papa', 'tomate', 'cebolla'],
    ing: [['400 g de carne molida de res', 'res'], ['3 papas en cubitos', 'papa'], ['2 tomates picados', 'tomate'], ['1 cebolla picada', 'cebolla'], ['Ajo, sal, comino y aceite', '']],
    pasos: ['Sofríe la cebolla, el ajo y el tomate.', 'Agrega la carne y cocínala 8 minutos, desmenuzándola.', 'Añade las papas y 1 taza de agua.', 'Cocina tapado 15 a 20 minutos, hasta que las papas estén blandas.'] },
  { id: 'pasta-bolonesa', n: 'Pasta a la boloñesa', e: '🍝', min: 30, por: 3, clave: ['pasta', 'res', 'tomate'],
    ing: [['250 g de pasta', 'pasta'], ['300 g de carne molida', 'res'], ['3 tomates picados o 1 taza de salsa de tomate', 'tomate'], ['1/2 cebolla picada', ''], ['Ajo, sal, orégano y aceite', '']],
    pasos: ['Cocina la pasta y escúrrela.', 'Sofríe la cebolla y el ajo.', 'Agrega la carne y cocínala 8 minutos.', 'Añade el tomate y el orégano y cocina 10 minutos.', 'Mezcla con la pasta y sirve.'] },
  { id: 'chuleta-papas', n: 'Chuleta de cerdo con papas', e: '🍖', min: 30, por: 2, clave: ['cerdo', 'papa'],
    ing: [['2 chuletas de cerdo', 'cerdo'], ['4 papas en rodajas', 'papa'], ['Ajo, sal, pimienta y limón', ''], ['Aceite', '']],
    pasos: ['Sazona las chuletas con ajo, sal, pimienta y limón y déjalas 15 minutos.', 'Cocínalas en una sartén 5 a 6 minutos por lado, hasta que no queden rosadas por dentro.', 'Fríe las papas en rodajas 10 minutos.', 'Sirve juntas.'] },
  { id: 'sudado-pescado', n: 'Sudado de pescado', e: '🐟', min: 30, por: 2, clave: ['pescado', 'tomate', 'cebolla', 'papa'],
    ing: [['2 filetes de pescado', 'pescado'], ['3 tomates en rodajas', 'tomate'], ['1 cebolla en aros', 'cebolla'], ['3 papas en rodajas', 'papa'], ['Ajo, sal, comino, cilantro y aceite', '']],
    pasos: ['Pon en la olla una capa de papas, cebolla y tomate.', 'Coloca el pescado encima con la sazón.', 'Agrega 1/2 taza de agua.', 'Cocina tapado 12 a 15 minutos.', 'Sirve con cilantro.'] },
  { id: 'maduro-queso', n: 'Plátano maduro con queso', e: '🍌', min: 25, por: 2, clave: ['platano', 'queso'],
    ing: [['2 plátanos maduros', 'platano'], ['150 g de queso', 'queso'], ['Mantequilla o aceite', '']],
    pasos: ['Corta los plátanos en tajadas a lo largo.', 'Dóralos en una sartén 3 minutos por lado.', 'Coloca el queso encima y tapa 2 minutos.', 'Sirve caliente.'] },
  { id: 'pan-banano', n: 'Pan de banano', e: '🍞', min: 50, por: 8, clave: ['banano', 'harina', 'huevo'],
    ing: [['3 bananos muy maduros', 'banano'], ['1 1/2 tazas de harina de trigo', 'harina'], ['2 huevos', 'huevo'], ['1/2 taza de azúcar', ''], ['1/3 de taza de aceite o mantequilla derretida', ''], ['1 cucharadita de polvo de hornear y canela', '']],
    pasos: ['Precalienta el horno a 180 °C.', 'Machaca los bananos y mézclalos con los huevos, el azúcar y el aceite.', 'Incorpora la harina, el polvo de hornear y la canela.', 'Vierte en un molde engrasado.', 'Hornea 45 a 50 minutos, hasta que un palillo salga limpio.'] },
  { id: 'ensalada-frutas', n: 'Ensalada de frutas', e: '🍓', min: 10, por: 3, clave: ['fruta'],
    ing: [['2 o 3 tipos de fruta picada', 'fruta'], ['Jugo de naranja o limón', ''], ['Miel o azúcar (opcional)', ''], ['Yogur (opcional)', '']],
    pasos: ['Lava y pica las frutas.', 'Mézclalas con el jugo y la miel.', 'Refrigera 15 minutos.', 'Sirve fría.'] },
  { id: 'compota-fruta', n: 'Compota de fruta', e: '🍎', min: 20, por: 3, clave: ['fruta'],
    ing: [['3 frutas (manzana, pera...) en trozos', 'fruta'], ['1/2 taza de agua', ''], ['2 cucharadas de azúcar o panela', ''], ['Canela', '']],
    pasos: ['Cocina la fruta con el agua, el azúcar y la canela a fuego bajo 15 a 20 minutos.', 'Aplástala o lícuala según prefieras.', 'Sirve tibia o fría.'] },
  { id: 'yogur-frutas', n: 'Yogur con frutas y avena', e: '🥣', min: 5, por: 1, clave: ['yogur', 'fruta', 'avena'],
    ing: [['1 taza de yogur', 'yogur'], ['1/2 taza de fruta picada', 'fruta'], ['2 cucharadas de avena', 'avena'], ['Miel (opcional)', '']],
    pasos: ['Sirve el yogur en un vaso o tazón.', 'Agrega la fruta y la avena.', 'Endulza con miel si quieres.'] },
  { id: 'sopa-verduras', n: 'Sopa de verduras', e: '🥕', min: 35, por: 4, clave: ['verduras', 'papa', 'zanahoria'],
    ing: [['2 tazas de verduras picadas', 'verduras'], ['2 papas en cubos', 'papa'], ['2 zanahorias en rodajas', 'zanahoria'], ['1/2 cebolla y cilantro', ''], ['1,5 litros de agua o caldo y sal', '']],
    pasos: ['Sofríe la cebolla 2 minutos.', 'Agrega el agua, las papas y las zanahorias y cocina 15 minutos.', 'Añade las demás verduras y cocina 10 minutos.', 'Ajusta la sal y sirve con cilantro.'] },
  { id: 'salteado-verduras', n: 'Salteado de verduras', e: '🥦', min: 15, por: 2, clave: ['verduras'],
    ing: [['3 tazas de verduras picadas', 'verduras'], ['1 diente de ajo', ''], ['2 cucharadas de aceite', ''], ['Salsa de soya, o sal y pimienta', '']],
    pasos: ['Calienta el aceite y sofríe el ajo 30 segundos.', 'Agrega las verduras y saltéalas a fuego alto 5 a 6 minutos.', 'Sazona y sirve mientras estén crujientes.'] },
  { id: 'crema-zanahoria', n: 'Crema de zanahoria', e: '🥕', min: 30, por: 3, clave: ['zanahoria', 'papa'],
    ing: [['4 zanahorias en rodajas', 'zanahoria'], ['2 papas en cubos', 'papa'], ['1/2 cebolla', ''], ['3 tazas de agua o caldo', ''], ['Sal, pimienta y un chorrito de leche (opcional)', '']],
    pasos: ['Cocina las zanahorias, las papas y la cebolla en el agua 20 minutos.', 'Licúa hasta que quede cremoso.', 'Regresa a la olla, sazona y calienta 3 minutos.'] },
  { id: 'sandwich-queso', n: 'Sándwich tostado de queso', e: '🥪', min: 10, por: 2, clave: ['pan', 'queso'],
    ing: [['4 rebanadas de pan', 'pan'], ['1/2 taza de queso en lonjas o rallado', 'queso'], ['Mantequilla', '']],
    pasos: ['Unta mantequilla por fuera de las rebanadas.', 'Rellena con el queso.', 'Tuesta en una sartén 2 a 3 minutos por lado.'] },
  { id: 'lentejas', n: 'Lentejas guisadas', e: '🍲', min: 40, por: 3, clave: ['frijol', 'cebolla', 'tomate'],
    ing: [['1 taza de lentejas o frijoles ya cocidos', 'frijol'], ['1 cebolla picada', 'cebolla'], ['2 tomates picados', 'tomate'], ['Ajo, sal, comino y aceite', ''], ['2 tazas de agua o caldo', '']],
    pasos: ['Sofríe la cebolla, el ajo y el tomate.', 'Agrega las lentejas, el comino y el agua.', 'Cocina 15 minutos a fuego bajo.', 'Ajusta la sal y sirve con arroz.'] },
  { id: 'ensalada-tomate-queso', n: 'Ensalada de tomate y queso', e: '🍅', min: 10, por: 2, clave: ['tomate', 'queso'],
    ing: [['3 tomates en rodajas', 'tomate'], ['150 g de queso en cubos o lonjas', 'queso'], ['Aceite, sal y orégano', '']],
    pasos: ['Alterna el tomate y el queso en un plato.', 'Aliña con aceite, sal y orégano.', 'Sirve fría.'] },
];

function diasHasta(fecha) {
  const d = new Date(fecha + 'T12:00:00');
  d.setHours(0, 0, 0, 0);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.round((d - hoy) / 86400000);
}

// Recibe los productos que están por vencer (sin vencer todavía) y devuelve
// { receta, productos, tags } con la receta que más de ellos aprovecha, o null.
export function sugerirReceta(productos, salto = 0) {
  const items = productos
    .map((p) => ({ p, tags: etiquetasDe(p.name) }))
    .filter((i) => i.tags.length > 0);
  if (items.length === 0) return null;

  const disponibles = new Set(items.flatMap((i) => i.tags));
  const puntuadas = [];

  RECETAS.forEach((r) => {
    const usadas = r.clave.filter((t) => disponibles.has(t));
    if (usadas.length === 0) return;
    // Los productos que vencen antes pesan más
    const urgencia = items
      .filter((i) => i.tags.some((t) => r.clave.includes(t)))
      .reduce((suma, i) => suma + 1 / (1 + Math.max(0, diasHasta(i.p.exp))), 0);
    const puntos = usadas.length * 10 + urgencia * 3 - (r.clave.length - usadas.length) * 2;
    puntuadas.push({ r, puntos });
  });

  if (puntuadas.length === 0) return null;
  puntuadas.sort((a, b) => b.puntos - a.puntos);
  // Entre las mejores empatadas, rota cada día para no repetir siempre la misma
  const mejores = puntuadas.filter((x) => x.puntos >= puntuadas[0].puntos - 0.5);
  const dia = Math.floor(Date.now() / 86400000);
  const rot = dia % mejores.length;
  const orden = [...mejores.slice(rot), ...mejores.slice(0, rot), ...puntuadas.slice(mejores.length)];
  const receta = orden[salto % Math.min(orden.length, 5)].r;

  const usados = items.filter((i) => i.tags.some((t) => receta.clave.includes(t)));
  return {
    receta,
    productos: usados.map((i) => i.p),
    tags: [...new Set(usados.flatMap((i) => i.tags))],
  };
}

// Varias recetas para mostrar en un carrusel: la mejor primero y, después, las que
// aprovechan productos que las anteriores no usaron.
export function sugerirRecetas(productos, max = 6) {
  const items = productos
    .map((p) => ({ p, tags: etiquetasDe(p.name) }))
    .filter((i) => i.tags.length > 0);
  if (items.length === 0) return [];
  const disponibles = new Set(items.flatMap((i) => i.tags));

  const cand = [];
  RECETAS.forEach((r) => {
    const usadas = r.clave.filter((t) => disponibles.has(t));
    if (usadas.length === 0) return;
    const usados = items.filter((i) => i.tags.some((t) => r.clave.includes(t)));
    const urgencia = usados.reduce((suma, i) => suma + 1 / (1 + Math.max(0, diasHasta(i.p.exp))), 0);
    const puntos = usadas.length * 10 + urgencia * 3 - (r.clave.length - usadas.length) * 2;
    cand.push({ r, usados, puntos });
  });

  const elegidas = [];
  const cubiertos = new Set();
  while (elegidas.length < max && cand.length > 0) {
    let mejor = 0;
    let mejorPts = -Infinity;
    cand.forEach((c, i) => {
      const nuevos = c.usados.filter((u) => !cubiertos.has(u.p.id || u.p.name)).length;
      const pts = c.puntos + nuevos * 6;
      if (pts > mejorPts) { mejorPts = pts; mejor = i; }
    });
    const [c] = cand.splice(mejor, 1);
    c.usados.forEach((u) => cubiertos.add(u.p.id || u.p.name));
    elegidas.push({
      receta: c.r,
      productos: c.usados.map((u) => u.p),
      tags: [...new Set(c.usados.flatMap((u) => u.tags))],
    });
  }
  return elegidas;
}