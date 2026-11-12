// Blue Lemon Bakery — capa de datos de la maqueta.
// Sin backend: todo vive en localStorage y lo comparten el sitio, el constructor 3D y el panel admin.

const KEY = 'bluelemon.demo';
const VERSION = 3;

/* ---------- Catálogo base (fuente: catálogos PDF + Instagram @bluelemonbakery.ec) ---------- */

export const DEFAULT_SETTINGS = {
  nombre: 'Blue Lemon Bakery',
  chef: 'Génesis Aguirre',
  whatsapp: '593993524000',
  whatsappDisplay: '099 352 4000',
  instagram: 'bluelemonbakery.ec',
  ciudad: 'Guayaquil, Ecuador',
  direccion: 'Mapasingue Oeste, calle tercera #106, entre la gasolinera Primax y Avícola Fernández',
  horario: 'Lunes a viernes · 8h00 a 18h00',
  anticipacionDias: 4,
  campana: { nombre: 'Día del Padre', activa: true, cierre: '' },
};

export const CATEGORIES = [
  { id: 'temporada', nombre: 'Temporada' },
  { id: 'tiramisu', nombre: 'Tiramisú' },
  { id: 'cans', nombre: 'Cans' },
];

const C = {
  crema: '#fbf2e0', vainilla: '#f0d79b', choco: '#5a3622', red: '#a3222f', limon: '#f6e27f',
  arandano: '#5b2a6e', caramelo: '#c98a3a', canela: '#c9965f', manjar: '#b9772f', pistacho: '#a9c46c',
  cafe: '#7a4f33', maracuya: '#f2a81d', coco: '#f7f1e3', pina: '#f3d35a', mousseChoco: '#7b4a2e',
};

const DEFAULT_PRODUCTS = [
  { id: 'lc-polaroid', cat: 'temporada', nombre: 'Lunch cake con polaroid', precio: 15, img: 'foto-lunchcake-polaroid.webp',
    desc: 'Lunch cake en cajita (2 porciones) decorada con foto polaroid.', builder: { producto: 'lunch', size: 'cajita' } },
  { id: 'lc-base-polaroid', cat: 'temporada', nombre: 'Lunch cake base y polaroid', precio: 22, img: 'foto-lunchcake-base.webp',
    desc: 'Lunch cake sobre base (4 porciones, 2 capas de relleno) con polaroid.', builder: { producto: 'lunch', size: 'base' } },
  { id: 'cajita-lc-cupcakes', cat: 'temporada', nombre: 'Cajita de lunch cake y 2 cupcakes', precio: 18, img: 'foto-cajita-cupcakes.webp',
    desc: 'Lunch cake con texto o polaroid, acompañada de 2 cupcakes.', builder: { producto: 'lunch', size: 'cupcakes' } },
  { id: 'cajita-dulces', cat: 'temporada', nombre: 'Cajita de dulces', precio: 22, img: 'foto-cajita-dulces.webp',
    desc: '1 brownie, 2 galletas choco nevada y chispas de chocolate, 2 paletas tiramisú, 1 galleta polaroid, 1 galleta bigote y 1 botellita de licor.' },
  { id: 'tiramisu-pistacho', cat: 'tiramisu', nombre: 'Tiramisú de pistacho', img: 'foto-tiramisu-pistacho.webp',
    desc: 'Capas de bizcocho, crema de pistacho y mascarpone.',
    variantes: [{ id: '12-15', nombre: '12 a 15 porciones', precio: 38.5 }, { id: '20-25', nombre: '20 a 25 porciones', precio: 48.5 }],
    builder: { producto: 'tiramisu', tiramisu: 'pistacho' } },
  { id: 'tiramisu-clasico', cat: 'tiramisu', nombre: 'Tiramisú clásico', img: 'foto-tiramisu-clasico.webp',
    desc: 'El clásico con café, mascarpone y cacao. Admite mensaje.',
    variantes: [{ id: '12-15', nombre: '12 a 15 porciones', precio: 34.5 }, { id: '20-25', nombre: '20 a 25 porciones', precio: 44.5 }],
    builder: { producto: 'tiramisu', tiramisu: 'clasico' } },
  { id: 'can-red-velvet', cat: 'cans', nombre: 'Can Red Velvet', precio: 5.5,
    desc: 'Red velvet, frosting de queso crema y trozos de chocolate.',
    capas: [C.red, C.crema, C.red, C.crema, C.red, C.crema] },
  { id: 'can-blueberry-lime', cat: 'cans', nombre: 'Can Blueberry Lime', precio: 5.5,
    desc: 'Bizcocho de limón, crema de limón y mermelada de arándanos.',
    capas: [C.limon, C.arandano, C.crema, C.limon, C.arandano, C.crema] },
  { id: 'can-salty-caramel', cat: 'cans', nombre: 'Can Salty Caramel y Maní', precio: 5.5,
    desc: 'Bizcocho de chocolate, mousse de chocolate, salty caramel y trozos de maní.',
    capas: [C.choco, C.mousseChoco, C.caramelo, C.choco, C.mousseChoco, C.caramelo] },
  { id: 'can-churro', cat: 'cans', nombre: 'Can Churro Cake', precio: 5.5,
    desc: 'Bizcocho de canela, crema de manjar y salsa de manjar.',
    capas: [C.canela, C.manjar, C.crema, C.canela, C.manjar, C.crema] },
  { id: 'can-tiramisu-pistacho', cat: 'cans', nombre: 'Can Tiramisú de Pistacho', precio: 7,
    desc: 'Bizcocho de pistacho, almíbar de café y frosting de pistacho.',
    capas: [C.cafe, C.pistacho, C.cafe, C.pistacho, C.cafe, C.pistacho] },
  { id: 'can-cheesecake-maracuya', cat: 'cans', nombre: 'Can Cheesecake de Maracuyá', precio: 5.5,
    desc: 'Bizcocho de vainilla con mousse de queso crema y jalea de maracuyá.',
    capas: [C.vainilla, C.crema, C.maracuya, C.vainilla, C.crema, C.maracuya] },
  { id: 'can-pina-colada', cat: 'cans', nombre: 'Can Piña Colada', precio: 5.5,
    desc: 'Bizcocho de coco, mousse de coco con ron y jalea de piña.',
    capas: [C.vainilla, C.coco, C.pina, C.vainilla, C.coco, C.pina] },
].map((p) => ({ activo: true, ...p }));

// Tamaños del catálogo "Tortas personalizadas". Los precios de torta son referenciales (ref: true):
// el catálogo no publica precios por tamaño, se editan desde el panel.
const DEFAULT_SIZES = [
  { id: 'cajita', grupo: 'lunch', nombre: 'Lunch cake cajita', porciones: '2 porciones', d: 10, h: 6, precio: 15, icon: 'icon-cajita.png', capas: 1 },
  { id: 'base', grupo: 'lunch', nombre: 'Lunch cake base', porciones: '4 porciones', nota: '2 capas de relleno', d: 10, h: 9, precio: 22, icon: 'icon-lunch-base.png', capas: 2 },
  { id: 't10', grupo: 'torta', nombre: 'Torta', porciones: '10 porciones', d: 13, h: 11, precio: 32, ref: true, icon: 'icon-torta.png', capas: 2 },
  { id: 't15', grupo: 'torta', nombre: 'Torta', porciones: '15 porciones', d: 16, h: 15, precio: 42, ref: true, icon: 'icon-torta.png', capas: 2 },
  { id: 't20', grupo: 'torta', nombre: 'Torta', porciones: '20 porciones', d: 18, h: 17, precio: 52, ref: true, icon: 'icon-torta.png', capas: 2 },
  { id: 't25', grupo: 'torta', nombre: 'Torta', porciones: '25-30 porciones', d: 20, h: 18, precio: 65, ref: true, icon: 'icon-torta-cerezas.png', capas: 2 },
  { id: 't35', grupo: 'torta', nombre: 'Torta', porciones: '35-40 porciones', d: 25, h: 17, precio: 82, ref: true, icon: 'icon-torta-cerezas.png', capas: 2 },
  { id: 'pisos', grupo: 'torta', nombre: 'Torta', porciones: '2 o más pisos', nota: 'Varía el número de porciones y altura', d: 20, h: 14, d2: 14, h2: 12, precio: 110, ref: true, icon: 'icon-pisos.png', capas: 2 },
];

const flavor = (id, nombre, color, extra = {}) => ({ id, nombre, color, activo: true, ...extra });

const DEFAULT_SPONGES = [
  flavor('vainilla', 'Vainilla', '#f0d79b'),
  flavor('chocolate', 'Chocolate', '#5a3622'),
  flavor('marmoleado', 'Marmoleado', '#f0d79b', { color2: '#5a3622' }),
  flavor('naranja', 'Naranja', '#f3b55a'),
  flavor('canela', 'Canela', '#c9965f'),
  flavor('limon', 'Limón', '#f6e27f'),
  flavor('amaretto', 'Amaretto', '#e0c08c'),
  flavor('red-velvet', 'Red Velvet', '#a3222f'),
  flavor('zanahoria', 'Zanahoria', '#cf8a3d'),
  flavor('cafe', 'Café', '#8b5e3c'),
];

const DEFAULT_FILLINGS = [
  flavor('manjar', 'Manjar', '#b9772f'),
  flavor('avellana', 'Crema de avellana', '#6a4023'),
  flavor('frutos-rojos', 'Mermelada Frutos Rojos', '#a11d3c'),
  flavor('brigadeiro-pistacho', 'Brigadeiro de Pistacho', '#9dbb62'),
  flavor('queso-crema', 'Frosting de Queso Crema', '#fbf2e0'),
  flavor('ganache-chocolate', 'Ganache de chocolate', '#3a2014'),
  flavor('ganache-salty-caramel', 'Ganache de Salty Caramel', '#c98a3a'),
  flavor('frosting-pistacho', 'Frosting de pistacho', '#b7cf83'),
  flavor('fudge-chocolate', 'Fudge de chocolate', '#2c180e'),
  flavor('curd-limon', 'Curd de limón', '#f5d640'),
];

const DEFAULT_TOPPINGS = [
  flavor('chispas', 'Chispas de chocolate', '#3a2014'),
  flavor('sprinkles', 'Sprinkles de colores', '#f28fb1'),
  flavor('oreo', 'Galleta Oreo', '#22201f'),
  flavor('nueces', 'Nueces', '#8a5a34'),
  flavor('salty-caramel', 'Salty Caramel', '#c98a3a'),
  flavor('toffee', 'Salsa toffee', '#7a4a1e'),
  flavor('avellana', 'Crema de avellana', '#6a4023'),
  flavor('almendras', 'Almendras', '#e2c59a'),
  flavor('frambuesa', 'Jalea de frambuesa', '#c2183f'),
  flavor('mani', 'Maní salado', '#d9b77e'),
];

export const FROSTING_COLORS = [
  { id: 'crema', nombre: 'Crema', color: '#fbf2e0' },
  { id: 'blanco', nombre: 'Blanco', color: '#ffffff' },
  { id: 'celeste', nombre: 'Celeste Blue Lemon', color: '#86cbd3' },
  { id: 'azul', nombre: 'Azul', color: '#177599' },
  { id: 'navy', nombre: 'Azul noche', color: '#083969' },
  { id: 'rosa', nombre: 'Rosa', color: '#f4b8c4' },
  { id: 'lila', nombre: 'Lila', color: '#cdb7e8' },
  { id: 'menta', nombre: 'Menta', color: '#b9e3c6' },
  { id: 'limon', nombre: 'Limón', color: '#f7e58b' },
  { id: 'durazno', nombre: 'Durazno', color: '#f8c9a0' },
  { id: 'chocolate', nombre: 'Chocolate', color: '#5b3421' },
];

export const FROSTING_STYLES = [
  { id: 'liso', nombre: 'Liso' },
  { id: 'peinado', nombre: 'Peinado' },
  { id: 'degrade', nombre: 'Degradé' },
  { id: 'drip', nombre: 'Drip', extra: 3 },
];

export const BORDERS = [
  { id: 'none', nombre: 'Sin borde' },
  { id: 'rosetones', nombre: 'Rosetones' },
  { id: 'bicolor', nombre: 'Rosetones bicolor' },
  { id: 'perlas', nombre: 'Perlas' },
];

export const TOPPERS = [
  { id: 'none', nombre: 'Ninguno', extra: 0 },
  { id: 'polaroid', nombre: 'Polaroid', extra: 3 },
  { id: 'velas', nombre: 'Velas', extra: 1 },
  { id: 'cerezas', nombre: 'Cerezas', extra: 2 },
  { id: 'flores', nombre: 'Flores', extra: 5 },
];

export const TOPPING_PRICE = 1.5;

// Combinaciones del catálogo. Cada una se puede cargar en el constructor 3D.
export const COMBOS = [
  { id: 'limon-frutos-rojos', top: 1, texto: 'Bizcocho de limón humedecido en almíbar, relleno de crema de limón y mermelada de frutos rojos',
    sponge: 'limon', fillings: ['curd-limon', 'frutos-rojos'], toppings: [] },
  { id: 'vainilla-pistacho', top: 2, texto: 'Bizcocho de vainilla humedecido en almíbar, relleno de brigadeiro de pistacho y culis de frutos rojos (2 capas)',
    sponge: 'vainilla', fillings: ['brigadeiro-pistacho', 'frutos-rojos'], toppings: [] },
  { id: 'oreo', top: 3, texto: 'Bizcocho con Oreo troceada humedecida en almíbar, relleno de ganache de chocolate, manjar y crumble de Chips Ahoy (2 capas)',
    sponge: 'vainilla', fillings: ['ganache-chocolate', 'manjar'], toppings: ['oreo'] },
  { id: 'choco-caramel', texto: 'Bizcocho de chocolate humedecido en almíbar de chocolate, relleno de ganache de salty caramel, maní y salsa toffee (2 capas)',
    sponge: 'chocolate', fillings: ['ganache-salty-caramel', 'ganache-salty-caramel'], toppings: ['mani', 'toffee'] },
  { id: 'tres-leches', texto: 'Bizcocho de vainilla humedecido en almíbar tres leches, relleno de manjar (2 capas)',
    sponge: 'vainilla', fillings: ['manjar', 'manjar'], toppings: [] },
  { id: 'naranja-choco', texto: 'Bizcocho de naranja humedecido en almíbar, relleno de ganache de chocolate (2 capas)',
    sponge: 'naranja', fillings: ['ganache-chocolate', 'ganache-chocolate'], toppings: [] },
  { id: 'vainilla-cafe', texto: 'Bizcocho de vainilla humedecido en almíbar de café, relleno de frosting de queso crema y ganache de chocolate (2 capas)',
    sponge: 'vainilla', fillings: ['queso-crema', 'ganache-chocolate'], toppings: [] },
  { id: 'zanahoria', texto: 'Bizcocho de zanahoria con nueces y especies humedecido en almíbar, relleno de frosting de queso crema y ganache de chocolate (2 capas)',
    sponge: 'zanahoria', fillings: ['queso-crema', 'ganache-chocolate'], toppings: ['nueces'] },
  { id: 'red-velvet', texto: 'Bizcocho de red velvet humedecido en almíbar, relleno de frosting de queso crema y ganache de chocolate (2 capas)',
    sponge: 'red-velvet', fillings: ['queso-crema', 'ganache-chocolate'], toppings: [] },
];

export const ESTADOS = [
  { id: 'nuevo', nombre: 'Nuevo' },
  { id: 'confirmado', nombre: 'Confirmado' },
  { id: 'produccion', nombre: 'En producción' },
  { id: 'listo', nombre: 'Listo' },
  { id: 'entregado', nombre: 'Entregado' },
  { id: 'cancelado', nombre: 'Cancelado' },
];

/* ---------- Utilidades ---------- */

export const money = (n) => {
  const v = Math.round(Number(n) * 100) / 100;
  return '$' + (Number.isInteger(v) ? String(v) : v.toFixed(2).replace('.', ','));
};

const pad = (n) => String(n).padStart(2, '0');
export const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
export const fmtDate = (s, opts = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  parseDate(s.slice(0, 10)).toLocaleDateString('es-EC', opts).replace(/\./g, '');
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- Configuración de torta personalizada ---------- */

export const DEFAULT_CONFIG = {
  producto: 'torta',
  size: 't15',
  sponge: 'vainilla',
  fillings: ['brigadeiro-pistacho', 'frutos-rojos'],
  frosting: { style: 'liso', color: '#fbf2e0', color2: '#86cbd3' },
  border: { type: 'rosetones', color: '#86cbd3', color2: '#5b3421', base: true },
  toppings: [],
  topper: 'none',
  mensaje: '',
  foto: null,
  tiramisu: 'clasico',
  tiramisuSize: '12-15',
  can: 'can-red-velvet',
};

export function normalizeConfig(cfg = {}) {
  const c = { ...DEFAULT_CONFIG, ...cfg };
  c.frosting = { ...DEFAULT_CONFIG.frosting, ...(cfg.frosting || {}) };
  c.border = { ...DEFAULT_CONFIG.border, ...(cfg.border || {}) };
  c.fillings = [...(cfg.fillings || DEFAULT_CONFIG.fillings)];
  c.toppings = [...(cfg.toppings || [])];
  if (c.producto === 'lunch' && !['cajita', 'base', 'cupcakes'].includes(c.size)) c.size = 'cajita';
  if (c.producto === 'torta' && !/^t\d+$|^pisos$/.test(c.size)) c.size = 't15';
  return c;
}

const byId = (list, id) => list.find((x) => x.id === id);

// Traduce la configuración del cliente a la especificación que dibuja cake3d.js.
export function toSpec(cfg, s = getState()) {
  const c = normalizeConfig(cfg);
  if (c.producto === 'can') {
    const p = byId(s.products, c.can) || s.products.find((x) => x.cat === 'cans');
    return { kind: 'can', can: { capas: p.capas, nombre: p.nombre.replace(/^Can /, '') } };
  }
  if (c.producto === 'tiramisu') {
    const big = c.tiramisuSize === '20-25';
    const pist = c.tiramisu === 'pistacho';
    return {
      kind: 'cake',
      tiers: [{ d: big ? 22 : 18, h: big ? 11 : 10 }],
      sponge: { color: '#6b4630' },
      fillings: pist ? ['#a9c46c', '#f6ecd2', '#a9c46c'] : ['#f6ecd2', '#f6ecd2', '#f6ecd2'],
      frosting: { style: 'liso', color: '#f6ecd2' },
      cocoaTop: true,
      border: { type: 'rosetones', color: '#f6ecd2', base: false, dust: true },
      toppings: [],
      topper: { type: 'none' },
      mensaje: c.mensaje,
      mensajeColor: '#f6ecd2',
    };
  }
  const sponge = byId(s.sponges, c.sponge) || s.sponges[0];
  const fill = (id) => (byId(s.fillings, id) || s.fillings[0]).color;
  let tiers, nFill = 2, box = 'none', cupcakes = 0;
  if (c.producto === 'lunch') {
    const size = byId(s.sizes, c.size === 'cupcakes' ? 'cajita' : c.size);
    tiers = [{ d: size.d, h: size.h }];
    nFill = size.capas;
    box = c.size === 'base' ? 'none' : 'cajita';
    cupcakes = c.size === 'cupcakes' ? 2 : 0;
  } else {
    const size = byId(s.sizes, c.size) || byId(s.sizes, 't15');
    tiers = [{ d: size.d, h: size.h }];
    if (size.d2) tiers.push({ d: size.d2, h: size.h2 });
  }
  const fillings = c.fillings.slice(0, nFill).map(fill);
  if (!fillings.length) fillings.push(fill('manjar'));
  // Un solo relleno elegido en un tamaño de 2 capas se repite en ambas.
  while (fillings.length < nFill) fillings.push(fillings[0]);
  const bicolor = c.border.type === 'bicolor';
  return {
    kind: 'cake',
    tiers,
    sponge: { color: sponge.color, color2: sponge.color2 },
    fillings,
    frosting: { style: c.frosting.style, color: c.frosting.color, color2: c.frosting.color2 },
    border: { type: bicolor ? 'rosetones' : c.border.type, color: c.border.color, color2: bicolor ? c.border.color2 : null, base: c.border.base },
    toppings: c.toppings,
    topper: { type: c.topper, photo: c.foto },
    mensaje: c.mensaje,
    box,
    cupcakes,
  };
}

export function priceOf(cfg, s = getState()) {
  const c = normalizeConfig(cfg);
  if (c.producto === 'can') return (byId(s.products, c.can) || {}).precio || 0;
  if (c.producto === 'tiramisu') {
    const p = byId(s.products, 'tiramisu-' + c.tiramisu);
    return (p?.variantes.find((v) => v.id === c.tiramisuSize) || p?.variantes[0])?.precio || 0;
  }
  let base;
  if (c.producto === 'lunch') {
    base = c.size === 'cupcakes' ? (byId(s.products, 'cajita-lc-cupcakes')?.precio ?? 18) : byId(s.sizes, c.size).precio;
  } else {
    base = (byId(s.sizes, c.size) || byId(s.sizes, 't15')).precio;
  }
  const style = byId(FROSTING_STYLES, c.frosting.style);
  // En lunch cakes el precio de catálogo ya incluye polaroid o texto.
  const topper = c.producto === 'lunch' && c.topper === 'polaroid' ? 0 : byId(TOPPERS, c.topper)?.extra || 0;
  return base + c.toppings.length * TOPPING_PRICE + (style?.extra || 0) + topper;
}

export function describe(cfg, s = getState()) {
  const c = normalizeConfig(cfg);
  if (c.producto === 'can') {
    const p = byId(s.products, c.can);
    return { titulo: p?.nombre || 'Can', lineas: [p?.desc || ''] };
  }
  if (c.producto === 'tiramisu') {
    const p = byId(s.products, 'tiramisu-' + c.tiramisu);
    const v = p?.variantes.find((x) => x.id === c.tiramisuSize);
    const lineas = [v?.nombre || ''];
    if (c.mensaje) lineas.push(`Mensaje: “${c.mensaje}”`);
    return { titulo: p?.nombre || 'Tiramisú', lineas };
  }
  const name = (list, id) => byId(list, id)?.nombre || id;
  const colorName = (hex) => byId(FROSTING_COLORS.map((f) => ({ ...f, id: f.color })), hex)?.nombre || hex;
  let titulo, nFill = 2;
  if (c.producto === 'lunch') {
    titulo = { cajita: 'Lunch cake cajita', base: 'Lunch cake base', cupcakes: 'Cajita de lunch cake y 2 cupcakes' }[c.size];
    nFill = c.size === 'base' ? 2 : 1;
  } else {
    const size = byId(s.sizes, c.size);
    titulo = `Torta personalizada · ${size.porciones}`;
  }
  const lineas = [
    `Bizcocho: ${name(s.sponges, c.sponge)}`,
    `Relleno: ${[...new Set(c.fillings.slice(0, nFill))].map((f) => name(s.fillings, f)).join(' + ')}${nFill > 1 && new Set(c.fillings.slice(0, nFill)).size === 1 ? ' (2 capas)' : ''}`,
    `Cobertura: ${name(FROSTING_STYLES, c.frosting.style)} · ${colorName(c.frosting.color)}`,
  ];
  if (c.border.type !== 'none') lineas.push(`Borde: ${name(BORDERS, c.border.type)} · ${colorName(c.border.color)}${c.border.base ? ' (arriba y base)' : ''}`);
  if (c.toppings.length) lineas.push(`Toppings: ${c.toppings.map((t) => name(s.toppings, t)).join(', ')}`);
  if (c.topper !== 'none') lineas.push(`Topper: ${name(TOPPERS, c.topper)}`);
  if (c.mensaje) lineas.push(`Mensaje: “${c.mensaje}”`);
  return { titulo, lineas };
}

// El enlace compartible no incluye la foto subida (pesa demasiado para una URL).
export const encodeConfig = (cfg) => {
  const { foto, ...rest } = cfg;
  return btoa(unescape(encodeURIComponent(JSON.stringify(rest)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
export const decodeConfig = (str) => {
  try {
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    return normalizeConfig(JSON.parse(decodeURIComponent(escape(atob(b64)))));
  } catch { return null; }
};

/* ---------- Estado persistente ---------- */

let state = null;
const listeners = new Set();

function seed() {
  const s = {
    version: VERSION,
    settings: structuredClone(DEFAULT_SETTINGS),
    products: structuredClone(DEFAULT_PRODUCTS),
    sizes: structuredClone(DEFAULT_SIZES),
    sponges: structuredClone(DEFAULT_SPONGES),
    fillings: structuredClone(DEFAULT_FILLINGS),
    toppings: structuredClone(DEFAULT_TOPPINGS),
    cart: [],
    orders: [],
    seq: 1001,
  };
  seedOrders(s);
  return s;
}

// Pedidos ficticios para que el panel tenga vida. Clientes y teléfonos son inventados.
function seedOrders(s) {
  const r = rng(20261111);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const nombres = ['María Fernanda Ruiz', 'Carlos Mendoza', 'Andrea Vélez', 'José Luis Paredes', 'Gabriela Intriago', 'Daniela Cedeño',
    'Luis Alberto Mora', 'Paola Zambrano', 'Ricardo Salazar', 'Valeria Chávez', 'Diego Arteaga', 'Camila Robles', 'Fernando Icaza',
    'Sofía Plaza', 'Martín Vera', 'Karla Moreira', 'Esteban Loor', 'Natalia Guerrero'];
  const zonas = ['Urdesa Central', 'Los Ceibos', 'Samborondón', 'Kennedy Norte', 'Alborada', 'Vía a la Costa', 'Puerto Santa Ana'];
  const mensajes = ['Feliz cumpleaños', 'Te amo mamá', 'Felices 30', 'Super Papá', 'Feliz aniversario', ''];
  const customs = [
    { producto: 'torta', size: 't15', sponge: 'limon', fillings: ['curd-limon', 'frutos-rojos'], border: { type: 'rosetones', color: '#86cbd3', base: true }, topper: 'cerezas' },
    { producto: 'torta', size: 't20', sponge: 'vainilla', fillings: ['brigadeiro-pistacho', 'frutos-rojos'], frosting: { style: 'degrade', color: '#fbf2e0', color2: '#f4b8c4' }, border: { type: 'perlas', color: '#ffffff', base: false }, topper: 'flores' },
    { producto: 'torta', size: 't25', sponge: 'chocolate', fillings: ['ganache-salty-caramel', 'ganache-salty-caramel'], frosting: { style: 'drip', color: '#fbf2e0', color2: '#5b3421' }, border: { type: 'none' }, toppings: ['mani', 'toffee'], topper: 'velas' },
    { producto: 'torta', size: 'pisos', sponge: 'red-velvet', fillings: ['queso-crema', 'ganache-chocolate'], frosting: { style: 'liso', color: '#ffffff' }, border: { type: 'perlas', color: '#86cbd3', base: true }, topper: 'flores' },
    { producto: 'lunch', size: 'cajita', sponge: 'vainilla', fillings: ['manjar'], border: { type: 'bicolor', color: '#86cbd3', color2: '#5b3421', base: false }, topper: 'polaroid' },
    { producto: 'torta', size: 't10', sponge: 'zanahoria', fillings: ['queso-crema', 'ganache-chocolate'], frosting: { style: 'peinado', color: '#f8c9a0' }, border: { type: 'rosetones', color: '#fbf2e0', base: false }, toppings: ['nueces'] },
  ];
  const t0 = today();
  const simple = s.products.filter((p) => p.cat !== 'cans');
  const cans = s.products.filter((p) => p.cat === 'cans');
  for (let i = 0; i < 34; i++) {
    // Los primeros pedidos son recientes para que haya entregas próximas en el panel.
    const created = addDays(t0, -Math.floor(r() * (i < 13 ? 4 : 30)));
    const items = [];
    const kind = r();
    if (kind < 0.42) {
      const cfg = normalizeConfig({ ...pick(customs), mensaje: pick(mensajes) });
      const d = describe(cfg, s);
      items.push({ tipo: 'custom', nombre: d.titulo, detalle: d.lineas, config: cfg, qty: 1, precio: priceOf(cfg, s) });
    } else if (kind < 0.8) {
      const p = pick(simple);
      const v = p.variantes ? pick(p.variantes) : null;
      items.push({ tipo: 'producto', productId: p.id, nombre: p.nombre, variante: v?.nombre, qty: 1, precio: v ? v.precio : p.precio });
    }
    if (kind >= 0.8 || r() < 0.3) {
      const n = 1 + Math.floor(r() * 2);
      for (let k = 0; k < n; k++) {
        const p = pick(cans);
        if (!items.some((it) => it.productId === p.id)) items.push({ tipo: 'producto', productId: p.id, nombre: p.nombre, qty: 1 + Math.floor(r() * 3), precio: p.precio });
      }
    }
    const soloCans = items.every((it) => (it.productId || '').startsWith('can-'));
    const entrega = addDays(created, soloCans ? Math.floor(r() * 2) : 4 + Math.floor(r() * 6));
    const diff = Math.round((entrega - t0) / 864e5);
    let estado;
    if (diff < 0) estado = r() < 0.08 ? 'cancelado' : 'entregado';
    else if (diff === 0) estado = r() < 0.5 ? 'listo' : 'produccion';
    else if (diff <= 2) estado = r() < 0.6 ? 'produccion' : 'confirmado';
    else estado = r() < 0.55 ? 'confirmado' : 'nuevo';
    const domicilio = r() < 0.45;
    const total = items.reduce((a, it) => a + it.precio * it.qty, 0);
    s.orders.push({
      id: 'BL-' + s.seq++,
      fecha: isoDate(created),
      entrega: isoDate(entrega),
      hora: pick(['10:00', '11:30', '13:00', '15:00', '16:30']),
      cliente: { nombre: pick(nombres), telefono: '0990000' + pad(Math.floor(r() * 900) + 100).slice(-3) },
      modalidad: domicilio ? 'domicilio' : 'retiro',
      direccion: domicilio ? pick(zonas) : '',
      items,
      total,
      abono: estado === 'nuevo' ? 0 : estado === 'entregado' ? total : Math.round(total / 2),
      estado,
      notas: '',
      demo: true,
    });
  }
  s.orders.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw && raw.version === VERSION) return raw;
  } catch { /* almacenamiento vacío o bloqueado */ }
  return null;
}

export function getState() {
  if (!state) {
    state = read() || seed();
    persist();
  }
  return state;
}

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* modo privado: la maqueta sigue en memoria */ }
}

export function save() {
  persist();
  listeners.forEach((fn) => fn(state));
}

export const onChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

export function resetDemo() {
  state = seed();
  save();
}

// Mantiene sincronizadas las pestañas abiertas (por ejemplo sitio + panel admin).
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    const next = read();
    if (next) { state = next; listeners.forEach((fn) => fn(state)); }
  });
}

/* ---------- Carrito y pedidos ---------- */

const uid = () => Math.random().toString(36).slice(2, 9);

export function addToCart(item) {
  const s = getState();
  const same = item.tipo === 'producto' && s.cart.find((it) => it.tipo === 'producto' && it.productId === item.productId && it.variante === item.variante);
  if (same) same.qty += item.qty || 1;
  else s.cart.push({ key: uid(), qty: 1, ...item });
  save();
}

export function addProduct(productId, variantId) {
  const p = byId(getState().products, productId);
  if (!p) return;
  const v = p.variantes ? p.variantes.find((x) => x.id === variantId) || p.variantes[0] : null;
  addToCart({ tipo: 'producto', productId: p.id, nombre: p.nombre, variante: v?.nombre, precio: v ? v.precio : p.precio, img: p.img, capas: p.capas });
}

export function addCustom(cfg) {
  const c = normalizeConfig(cfg);
  const d = describe(c);
  addToCart({ tipo: 'custom', nombre: d.titulo, detalle: d.lineas, config: c, precio: priceOf(c) });
}

export function setQty(key, qty) {
  const s = getState();
  const it = s.cart.find((x) => x.key === key);
  if (!it) return;
  it.qty = qty;
  if (it.qty <= 0) s.cart = s.cart.filter((x) => x.key !== key);
  save();
}

export const cartCount = () => getState().cart.reduce((a, it) => a + it.qty, 0);
export const cartTotal = () => getState().cart.reduce((a, it) => a + it.qty * it.precio, 0);
const isCan = (it) => (it.productId || '').startsWith('can-') || it.config?.producto === 'can';
// Los Cans se pueden pedir para el mismo día; el resto necesita los días de anticipación.
export const cartLeadDays = () => (getState().cart.every(isCan) ? 0 : getState().settings.anticipacionDias);

export function createOrder(form) {
  const s = getState();
  const order = {
    id: 'BL-' + s.seq++,
    fecha: isoDate(new Date()),
    entrega: form.entrega,
    hora: form.hora || '',
    cliente: { nombre: form.nombre, telefono: form.telefono },
    modalidad: form.modalidad,
    direccion: form.direccion || '',
    items: s.cart.map(({ key, img, capas, ...it }) => it),
    total: cartTotal(),
    abono: 0,
    estado: 'nuevo',
    notas: form.notas || '',
  };
  s.orders.unshift(order);
  s.cart = [];
  save();
  return order;
}

export function whatsappLink(text = '', phone = getState().settings.whatsapp) {
  return `https://wa.me/${phone}${text ? '?text=' + encodeURIComponent(text) : ''}`;
}

export function orderMessage(o) {
  const lines = [`Hola Blue Lemon Bakery 🍋 Quiero confirmar mi pedido ${o.id}:`, ''];
  o.items.forEach((it) => {
    lines.push(`• ${it.qty} × ${it.nombre}${it.variante ? ' (' + it.variante + ')' : ''} — ${money(it.precio * it.qty)}`);
    (it.detalle || []).forEach((l) => lines.push(`   - ${l}`));
  });
  lines.push('', `Total referencial: ${money(o.total)}`);
  lines.push(`Entrega: ${fmtDate(o.entrega, { weekday: 'long', day: 'numeric', month: 'long' })}${o.hora ? ' · ' + o.hora : ''}`);
  lines.push(o.modalidad === 'domicilio' ? `A domicilio: ${o.direccion}` : 'Retiro en el taller');
  lines.push(`A nombre de: ${o.cliente.nombre}`);
  if (o.notas) lines.push(`Notas: ${o.notas}`);
  return lines.join('\n');
}

// Ilustración de un Can (frasco por capas) para catálogo, carrito y panel.
export function canSVG(capas, label = '') {
  const h = 78 / capas.length;
  const bands = capas.map((c, i) => `<rect x="14" y="${96 - (i + 1) * h}" width="72" height="${h + 0.5}" fill="${c}"/>`).join('');
  return `<svg viewBox="0 0 100 120" class="can-svg" role="img" aria-label="${esc(label)}">
    <defs><clipPath id="jar"><path d="M14 22c0-4 3-6 7-6h58c4 0 7 2 7 6v76c0 6-4 10-10 10H24c-6 0-10-4-10-10z"/></clipPath></defs>
    <g clip-path="url(#jar)"><rect x="14" y="14" width="72" height="96" fill="#fdf8ee"/>${bands}
      <rect x="14" y="14" width="14" height="96" fill="#fff" opacity=".28"/></g>
    <path d="M14 22c0-4 3-6 7-6h58c4 0 7 2 7 6v76c0 6-4 10-10 10H24c-6 0-10-4-10-10z" fill="none" stroke="#083969" stroke-opacity=".25" stroke-width="1.5"/>
    <rect x="16" y="6" width="68" height="11" rx="4" fill="#cfd8dc" stroke="#9fb0b8"/>
    <path d="M30 46c0-11 9-18 20-18s20 7 20 18v36H30z" fill="#177599"/>
    <text x="50" y="52" text-anchor="middle" font-family="Marcellus SC, serif" font-size="9" fill="#fff">BLUE</text>
    <text x="50" y="62" text-anchor="middle" font-family="Marcellus SC, serif" font-size="9" fill="#fff">LEMON</text>
    <text x="50" y="72" text-anchor="middle" font-family="Poppins, sans-serif" font-size="5" letter-spacing="1.5" fill="#caff8a">CANS</text>
  </svg>`;
}
