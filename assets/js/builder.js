// Constructor 3D: el cliente arma su torta, lunch cake, tiramisú o Can y lo añade al pedido.

import {
  getState, onChange, normalizeConfig, toSpec, priceOf, describe, addCustom, addProduct, encodeConfig, decodeConfig,
  money, esc, canSVG, FROSTING_COLORS, FROSTING_STYLES, BORDERS, TOPPERS, TOPPING_PRICE, COMBOS,
} from './data.js';
import { initChrome, toast, openCart, ICON } from './ui.js';
import { createStage, applyAssembly, webglAvailable, fontsReady } from './cake3d.js';

const $ = (s, r = document) => r.querySelector(s);
const MAX_TOPPINGS = 3;
const MAX_MSG = 26;

/* ---------- Estado ---------- */

function initialConfig() {
  const hash = new URLSearchParams(location.hash.slice(1)).get('d');
  if (hash) { const c = decodeConfig(hash); if (c) return c; }
  const q = Object.fromEntries(new URLSearchParams(location.search));
  const cfg = {};
  if (q.producto) cfg.producto = q.producto;
  if (q.size) cfg.size = q.size;
  if (q.can) cfg.can = q.can;
  if (q.tiramisu) cfg.tiramisu = q.tiramisu;
  if (q.producto === 'lunch') Object.assign(cfg, lunchDefaults());
  if (q.producto === 'tiramisu') cfg.mensaje = 'Feliz Día';
  return normalizeConfig(cfg);
}

const lunchDefaults = () => ({ topper: 'polaroid', border: { type: 'bicolor', color: '#86cbd3', color2: '#5b3421', base: false }, fillings: ['manjar'] });

let cfg = initialConfig();
let cut = false;
let stage = null;
let building = 0;

const fillSlots = () => (cfg.producto === 'lunch' && cfg.size !== 'base' ? 1 : 2);

function setPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  keys.reduce((o, k) => o[k], obj)[last] = value;
}

/* ---------- Opciones ---------- */

const sw = (color, color2) => `style="background:${color2 ? `linear-gradient(135deg, ${color} 50%, ${color2} 50%)` : color}"`;
const pressed = (v) => `aria-pressed="${v ? 'true' : 'false'}"`;

function colorRow(path, current, label) {
  return `<div class="sub"><span>${label}</span><div class="swatches-row">${FROSTING_COLORS.map((c) =>
    `<button class="sw" data-k="${path}" data-v="${c.color}" ${pressed(c.color === current)} ${sw(c.color)} title="${esc(c.nombre)}" aria-label="${esc(c.nombre)}"></button>`).join('')}</div></div>`;
}

function optProducto() {
  const items = [
    ['torta', 'Torta', '<img src="assets/img/icon-torta.png" alt="">'],
    ['lunch', 'Lunch cake', '<img src="assets/img/icon-cajita.png" alt="">'],
    ['tiramisu', 'Tiramisú', '<img src="assets/img/icon-torta-cerezas.png" alt="">'],
    ['can', 'Can', canSVG(['#a3222f', '#fbf2e0', '#a3222f', '#fbf2e0'], 'Can')],
  ];
  return `<section class="opt"><div class="opt-head"><h2>1 · Producto</h2></div>
    <div class="prod-grid">${items.map(([id, n, icon]) => `<button class="prod" data-producto="${id}" ${pressed(cfg.producto === id)}>${icon}${n}</button>`).join('')}</div></section>`;
}

function optSize(s) {
  if (cfg.producto === 'torta') {
    const sizes = s.sizes.filter((z) => z.grupo === 'torta');
    return `<section class="opt"><div class="opt-head"><h2>2 · Tamaño</h2><small>Precios de torta referenciales</small></div>
      <div class="chips">${sizes.map((z) => `<button class="chip size plain" data-k="size" data-v="${z.id}" data-fit ${pressed(cfg.size === z.id)}>
        <strong>${esc(z.porciones)}</strong><span class="dims">${z.d2 ? 'desde ' : `${z.d}×${z.h} cm · `}${money(z.precio)}</span></button>`).join('')}</div></section>`;
  }
  if (cfg.producto === 'lunch') {
    const opts = [
      ['cajita', 'En cajita', `2 porciones · ${money(s.sizes.find((z) => z.id === 'cajita').precio)}`],
      ['base', 'Sobre base', `4 porciones · ${money(s.sizes.find((z) => z.id === 'base').precio)}`],
      ['cupcakes', 'Cajita + 2 cupcakes', `${money(s.products.find((p) => p.id === 'cajita-lc-cupcakes')?.precio ?? 18)}`],
    ];
    return `<section class="opt"><div class="opt-head"><h2>2 · Formato</h2><small>Incluye polaroid o texto</small></div>
      <div class="chips">${opts.map(([id, n, d]) => `<button class="chip size plain" data-k="size" data-v="${id}" data-fit ${pressed(cfg.size === id)}><strong>${n}</strong><span class="dims">${d}</span></button>`).join('')}</div></section>`;
  }
  return '';
}

function optSabores(s) {
  const slots = fillSlots();
  const chosen = cfg.fillings.slice(0, slots);
  return `<section class="opt"><div class="opt-head"><h2>3 · Sabores</h2></div>
    <label class="field"><span>Combinaciones más pedidas</span>
      <select class="select" id="combo"><option value="">Elegir una combinación del catálogo…</option>
        ${COMBOS.map((c) => `<option value="${c.id}">${c.top ? '★ ' : ''}${esc(c.texto.replace(/ humedecid[oa] en almíbar[^,]*/, '').replace(/ \(2 capas\)/, ''))}</option>`).join('')}</select></label>
    <div class="sub"><span>Bizcocho</span><div class="chips">${s.sponges.map((f) =>
      `<button class="chip" data-k="sponge" data-v="${f.id}" ${pressed(cfg.sponge === f.id)} ${f.activo ? '' : 'disabled'}><i ${sw(f.color, f.color2)}></i>${esc(f.nombre)}</button>`).join('')}</div></div>
    <div class="sub"><span>Relleno${slots > 1 ? 's · elige hasta 2 capas' : ' · 1 capa'}</span><div class="chips">${s.fillings.map((f) => {
      const i = chosen.indexOf(f.id);
      return `<button class="chip" data-toggle="fillings" data-v="${f.id}" ${pressed(i >= 0)} ${f.activo ? '' : 'disabled'}><i ${sw(f.color)}></i>${esc(f.nombre)}${i >= 0 && slots > 1 ? `<b>${i + 1}</b>` : ''}</button>`;
    }).join('')}</div></div></section>`;
}

function optCobertura() {
  const f = cfg.frosting;
  const two = f.style === 'degrade' || f.style === 'drip';
  return `<section class="opt"><div class="opt-head"><h2>4 · Cobertura</h2></div>
    <div class="chips">${FROSTING_STYLES.map((st) => `<button class="chip plain" data-k="frosting.style" data-v="${st.id}" ${pressed(f.style === st.id)}>${st.nombre}${st.extra ? ` <em>+${money(st.extra)}</em>` : ''}</button>`).join('')}</div>
    ${colorRow('frosting.color', f.color, 'Color')}
    ${two ? colorRow('frosting.color2', f.color2, f.style === 'drip' ? 'Color del drip' : 'Color de la base') : ''}</section>`;
}

function optDecoracion(s) {
  const b = cfg.border;
  const msgHelp = cfg.topper === 'polaroid' ? 'Se escribe al pie de la polaroid' : 'Se escribe sobre la torta';
  return `<section class="opt"><div class="opt-head"><h2>5 · Decoración</h2></div>
    <div class="sub"><span>Borde</span><div class="chips">${BORDERS.map((x) => `<button class="chip plain" data-k="border.type" data-v="${x.id}" ${pressed(b.type === x.id)}>${x.nombre}</button>`).join('')}</div></div>
    ${b.type !== 'none' ? colorRow('border.color', b.color, 'Color del borde') : ''}
    ${b.type === 'bicolor' ? colorRow('border.color2', b.color2, 'Segundo color') : ''}
    ${b.type !== 'none' ? `<label class="switch"><input type="checkbox" id="border-base" ${b.base ? 'checked' : ''}>También en la base</label>` : ''}
    <div class="sub"><span>Toppings · hasta ${MAX_TOPPINGS} (+${money(TOPPING_PRICE)} c/u)</span><div class="chips">${s.toppings.map((t) =>
      `<button class="chip" data-toggle="toppings" data-v="${t.id}" ${pressed(cfg.toppings.includes(t.id))} ${t.activo ? '' : 'disabled'}><i ${sw(t.color)}></i>${esc(t.nombre)}</button>`).join('')}</div></div>
    <div class="sub"><span>Topper</span><div class="chips">${TOPPERS.map((t) => {
      const free = cfg.producto === 'lunch' && t.id === 'polaroid';
      return `<button class="chip plain" data-k="topper" data-v="${t.id}" ${pressed(cfg.topper === t.id)}>${t.nombre}${t.extra && !free ? ` <em>+${money(t.extra)}</em>` : ''}</button>`;
    }).join('')}</div></div>
    ${cfg.topper === 'polaroid' ? `<div class="sub"><span>Foto de la polaroid</span><div class="upload">
      ${cfg.foto ? `<img src="${cfg.foto}" alt="Tu foto">` : ''}
      <label class="btn btn-soft btn-sm">${cfg.foto ? 'Cambiar foto' : 'Subir tu foto'}<input type="file" id="foto" accept="image/*" hidden></label>
      ${cfg.foto ? '<button class="btn btn-ghost btn-sm" id="foto-clear">Quitar</button>' : '<span class="count">Opcional · se queda en tu navegador</span>'}</div></div>` : ''}
    ${optMensaje(msgHelp)}</section>`;
}

function optMensaje(help) {
  return `<div class="sub"><span>Mensaje</span>
    <input class="input" id="mensaje" maxlength="${MAX_MSG}" value="${esc(cfg.mensaje)}" placeholder="Ej. Feliz cumpleaños" autocomplete="off">
    <span class="count" style="margin-top:6px">${help} · máximo ${MAX_MSG} caracteres</span></div>`;
}

function optTiramisu(s) {
  const p = s.products.find((x) => x.id === 'tiramisu-' + cfg.tiramisu) || s.products.find((x) => x.cat === 'tiramisu');
  return `<section class="opt"><div class="opt-head"><h2>2 · Sabor</h2></div>
      <div class="chips">
        <button class="chip" data-k="tiramisu" data-v="clasico" ${pressed(cfg.tiramisu === 'clasico')}><i ${sw('#f6ecd2', '#6b4630')}></i>Clásico</button>
        <button class="chip" data-k="tiramisu" data-v="pistacho" ${pressed(cfg.tiramisu === 'pistacho')}><i ${sw('#a9c46c', '#6b4630')}></i>Pistacho</button>
      </div></section>
    <section class="opt"><div class="opt-head"><h2>3 · Tamaño</h2></div>
      <div class="chips">${p.variantes.map((v) => `<button class="chip size plain" data-k="tiramisuSize" data-v="${v.id}" data-fit ${pressed(cfg.tiramisuSize === v.id)}><strong>${esc(v.nombre)}</strong><span class="dims">${money(v.precio)}</span></button>`).join('')}</div></section>
    <section class="opt"><div class="opt-head"><h2>4 · Personaliza</h2></div>${optMensaje('Se escribe sobre el cacao')}</section>`;
}

function optCan(s) {
  return `<section class="opt"><div class="opt-head"><h2>2 · Sabor del Can</h2><small>Se piden para el mismo día</small></div>
    <div class="can-list">${s.products.filter((p) => p.cat === 'cans' && p.activo).map((p) => `
      <button class="can-opt" data-k="can" data-v="${p.id}" ${pressed(cfg.can === p.id)}>${canSVG(p.capas, p.nombre)}
        <span><strong>${esc(p.nombre.replace(/^Can /, ''))}</strong><small>${esc(p.desc)}</small></span><span class="price-tag">${money(p.precio)}</span></button>`).join('')}</div></section>`;
}

function renderOptions() {
  const s = getState();
  let html = optProducto();
  if (cfg.producto === 'can') html += optCan(s);
  else if (cfg.producto === 'tiramisu') html += optTiramisu(s);
  else html += optSize(s) + optSabores(s) + optCobertura() + optDecoracion(s);
  $('#options').innerHTML = html;
}

function renderSummary() {
  const s = getState();
  const d = describe(cfg, s);
  const size = s.sizes.find((z) => z.id === cfg.size);
  const ref = cfg.producto === 'torta' && size?.ref;
  $('#summary').innerHTML = `
    <div class="summary-top">
      <div><h2>${esc(d.titulo)}</h2><p class="lines">${esc(d.lineas.join(' · '))}</p></div>
      <div class="price"><strong>${money(priceOf(cfg, s))}</strong><small>${ref ? 'referencial' : 'precio de catálogo'}</small></div>
    </div>
    <div class="summary-actions">
      <button class="btn btn-lime" id="add">Añadir al pedido ${ICON.arrow}</button>
      <button class="btn btn-soft" id="share" title="Copiar enlace de este diseño">Compartir</button>
    </div>`;
  let dims = '';
  if (cfg.producto === 'torta' && size) dims = size.d2 ? `2 pisos · ${size.d} y ${size.d2} cm ø` : `${size.d} cm ø · ${size.h} cm alto · ${size.porciones}`;
  else if (cfg.producto === 'lunch') { const z = s.sizes.find((x) => x.id === (cfg.size === 'base' ? 'base' : 'cajita')); dims = `${z.d} cm ø · ${z.h} cm alto · ${z.porciones}`; }
  else if (cfg.producto === 'tiramisu') dims = cfg.tiramisuSize === '20-25' ? '20 a 25 porciones' : '12 a 15 porciones';
  else dims = 'Can individual · listo para llevar';
  $('#dims').textContent = dims;
}

/* ---------- Escena ---------- */

function syncUrl() {
  history.replaceState(null, '', `${location.pathname}#d=${encodeConfig(cfg)}`);
}

function refreshScene(fit = false) {
  if (!stage) return;
  cancelAnimationFrame(building);
  const spec = toSpec(cfg);
  spec.cut = cut && cfg.producto !== 'can';
  stage.setSpec(spec, { fit });
}

function update({ fit = false, options = true } = {}) {
  cfg = normalizeConfig(cfg);
  if (options) renderOptions();
  renderSummary();
  refreshScene(fit);
  syncUrl();
  const canCut = cfg.producto !== 'can';
  $('#t-cut').disabled = !canCut;
  $('#t-cut').setAttribute('aria-pressed', cut && canCut);
}

function playBuild() {
  if (!stage?.cake) return;
  cancelAnimationFrame(building);
  const parts = stage.cake.parts;
  const t0 = performance.now(), dur = 3400;
  const step = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    applyAssembly(parts, p);
    stage.invalidate();
    if (p < 1) building = requestAnimationFrame(step);
  };
  building = requestAnimationFrame(step);
}

function randomize() {
  const s = getState();
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const on = (list) => list.filter((x) => x.activo);
  const colors = FROSTING_COLORS.map((c) => c.color);
  if (cfg.producto === 'can') { cfg.can = pick(s.products.filter((p) => p.cat === 'cans' && p.activo)).id; return; }
  if (cfg.producto === 'tiramisu') { cfg.tiramisu = pick(['clasico', 'pistacho']); return; }
  cfg.sponge = pick(on(s.sponges)).id;
  cfg.fillings = [pick(on(s.fillings)).id, pick(on(s.fillings)).id].slice(0, fillSlots());
  cfg.frosting = { style: pick(FROSTING_STYLES).id, color: pick(colors.slice(0, 10)), color2: pick(colors) };
  cfg.border = { type: pick(BORDERS).id, color: pick(colors), color2: pick(colors), base: Math.random() < 0.5 };
  const tops = on(s.toppings).map((t) => t.id).sort(() => Math.random() - 0.5);
  cfg.toppings = tops.slice(0, Math.floor(Math.random() * 3));
  cfg.topper = pick(TOPPERS).id;
}

// Reduce la foto antes de guardarla: así cabe en localStorage junto al pedido.
function readPhoto(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const max = 320, k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/* ---------- Eventos ---------- */

let msgTimer;
document.addEventListener('input', (e) => {
  if (e.target.id !== 'mensaje') return;
  cfg.mensaje = e.target.value.slice(0, MAX_MSG);
  renderSummary();
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => { refreshScene(); syncUrl(); }, 220);
});

document.addEventListener('change', async (e) => {
  if (e.target.id === 'combo' && e.target.value) {
    const c = COMBOS.find((x) => x.id === e.target.value);
    Object.assign(cfg, { sponge: c.sponge, fillings: [...c.fillings], toppings: [...c.toppings] });
    update();
    toast('Combinación cargada');
  } else if (e.target.id === 'border-base') {
    cfg.border.base = e.target.checked; update({ options: false });
  } else if (e.target.id === 'foto' && e.target.files[0]) {
    try { cfg.foto = await readPhoto(e.target.files[0]); update(); } catch { toast('No se pudo leer esa imagen'); }
  }
});

document.addEventListener('click', (e) => {
  const prod = e.target.closest('[data-producto]');
  if (prod) {
    const next = prod.dataset.producto;
    if (next === cfg.producto) return;
    cfg.producto = next;
    if (next === 'lunch') Object.assign(cfg, { size: 'cajita' }, lunchDefaults());
    if (next === 'torta') cfg.size = 't15';
    if (next === 'tiramisu' && !cfg.mensaje) cfg.mensaje = 'Feliz Día';
    update({ fit: true });
    return;
  }
  const k = e.target.closest('[data-k]');
  if (k) { setPath(cfg, k.dataset.k, k.dataset.v); update({ fit: k.dataset.fit !== undefined || k.dataset.k === 'can' }); return; }
  const tg = e.target.closest('[data-toggle]');
  if (tg) {
    const key = tg.dataset.toggle, v = tg.dataset.v;
    const max = key === 'fillings' ? fillSlots() : MAX_TOPPINGS;
    let list = cfg[key].slice(0, key === 'fillings' ? max : undefined);
    if (list.includes(v)) { if (key !== 'fillings' || list.length > 1) list = list.filter((x) => x !== v); }
    else if (list.length >= max) { if (key === 'fillings') list = [...list.slice(1), v]; else { toast(`Máximo ${MAX_TOPPINGS} toppings`); return; } }
    else list.push(v);
    cfg[key] = list;
    update();
    return;
  }
  if (e.target.closest('#foto-clear')) { cfg.foto = null; update(); return; }
  if (e.target.closest('#add')) {
    if (cfg.producto === 'can') addProduct(cfg.can); else addCustom(cfg);
    toast('Añadido a tu pedido');
    openCart();
    return;
  }
  if (e.target.closest('#share')) {
    syncUrl();
    const done = () => toast('Enlace del diseño copiado');
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(location.href).then(done, () => toast('Copia el enlace desde la barra de direcciones'));
    else toast('Copia el enlace desde la barra de direcciones');
    return;
  }
  if (e.target.closest('#t-rotate')) {
    const btn = $('#t-rotate'), on = btn.getAttribute('aria-pressed') !== 'true';
    btn.setAttribute('aria-pressed', on);
    if (stage) stage.controls.autoRotate = on;
    return;
  }
  if (e.target.closest('#t-cut')) {
    cut = !cut;
    if (cut && stage) { stage.controls.autoRotate = false; $('#t-rotate').setAttribute('aria-pressed', 'false'); }
    update({ options: false, fit: cut });
    if (cut) toast('Vista de corte: se ocultan topper y mensaje');
    return;
  }
  if (e.target.closest('#t-build')) { playBuild(); return; }
  if (e.target.closest('#t-random')) { randomize(); update(); return; }
  if (e.target.closest('#t-photo') && stage) {
    const a = document.createElement('a');
    a.href = stage.snapshot();
    a.download = 'mi-diseno-blue-lemon.png';
    a.click();
  }
});

/* ---------- Arranque ---------- */

initChrome();
renderOptions();
renderSummary();
onChange(() => { renderOptions(); renderSummary(); });

if (webglAvailable()) {
  const canvas = $('#stage-canvas');
  stage = createStage(canvas, { controls: true, autoRotate: !matchMedia('(prefers-reduced-motion: reduce)').matches });
  stage.centerY = 0.1; // deja libre la barra de herramientas inferior
  $('#t-rotate').setAttribute('aria-pressed', stage.controls.autoRotate);
  canvas.addEventListener('pointerdown', () => $('#stage-hint').classList.add('is-off'), { once: true });
  new ResizeObserver(() => stage.fit()).observe(canvas);
  update({ fit: true, options: false });
  // Las texturas con texto se redibujan cuando cargan las tipografías.
  fontsReady().then(() => refreshScene());
} else {
  $('#stage-fallback').hidden = false;
  document.querySelector('.stage-tools').hidden = true;
  $('#stage-hint').hidden = true;
}
