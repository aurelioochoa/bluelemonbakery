// Sitio público: catálogo, tamaños, sabores, combinaciones y la historia con scroll en 3D.

import {
  getState, onChange, CATEGORIES, COMBOS, money, esc, canSVG, addProduct, cartCount, whatsappLink, fmtDate, encodeConfig, normalizeConfig,
} from './data.js';
import { initChrome, toast, openCart, ICON } from './ui.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Contenido dinámico ---------- */

let activeCat = 'todos';

function builderLink(p) {
  if (p.cat === 'cans') return `constructor.html?producto=can&can=${p.id}`;
  if (!p.builder) return null;
  const q = new URLSearchParams(p.builder);
  return `constructor.html?${q}`;
}

function renderTabs() {
  const s = getState();
  const cats = [{ id: 'todos', nombre: 'Todo' }, ...CATEGORIES];
  $('#cat-tabs').innerHTML = cats.map((c) => {
    const chip = c.id === 'temporada' && s.settings.campana.activa ? `<span class="chip">${esc(s.settings.campana.nombre)}</span>` : '';
    return `<button role="tab" aria-selected="${c.id === activeCat}" data-cat="${c.id}">${esc(c.nombre)}${chip}</button>`;
  }).join('');
}

function renderProducts() {
  const s = getState();
  const list = s.products.filter((p) => p.activo && (activeCat === 'todos' || p.cat === activeCat)
    && (p.cat !== 'temporada' || s.settings.campana.activa));
  const cards = list.map((p, i) => {
    const price = p.variantes ? `Desde ${money(Math.min(...p.variantes.map((v) => v.precio)))}` : money(p.precio);
    const media = p.img
      ? `<div class="clip"><img src="assets/img/${esc(p.img)}" alt="${esc(p.nombre)}" loading="lazy" width="676" height="1200"></div>`
      : canSVG(p.capas, p.nombre);
    const link = builderLink(p);
    return `
      <article class="card" data-reveal style="--i:${i % 4}">
        <div class="card-media">${media}<span class="price-tag">${price}</span></div>
        <h3>${esc(p.nombre)}</h3>
        <p>${esc(p.desc)}</p>
        ${p.variantes ? `<select class="select" aria-label="Tamaño de ${esc(p.nombre)}" data-variant="${p.id}">${p.variantes.map((v) => `<option value="${v.id}">${esc(v.nombre)} · ${money(v.precio)}</option>`).join('')}</select>` : ''}
        <div class="card-actions">
          <button class="btn btn-navy btn-sm" data-add="${p.id}">Añadir</button>
          ${link ? `<a class="btn btn-soft btn-sm" href="${link}">${ICON.cube} Ver en 3D</a>` : ''}
        </div>
      </article>`;
  });
  if (activeCat === 'todos') {
    cards.push(`
      <article class="card card-custom" data-reveal>
        <a class="card-media" href="constructor.html" aria-label="Diseñar torta personalizada">
          <img class="mark" src="assets/img/mark-teal.png" alt=""><span class="price-tag">A tu medida</span></a>
        <h3>Torta personalizada</h3>
        <p>De 10 a 40 porciones o varios pisos. Elige bizcocho, relleno, cobertura y toppings.</p>
        <div class="card-actions"><a class="btn btn-lime btn-sm" href="constructor.html">${ICON.cube} Diseñar en 3D</a></div>
      </article>`);
  }
  $('#products').innerHTML = cards.join('') || '<p class="note" style="grid-column:1/-1;text-align:center">No hay productos activos en esta categoría.</p>';
  $('#catalog-note').textContent = 'Precios en dólares. El valor publicado no incluye envío a domicilio.';
  observeReveals();
}

function renderSizes() {
  const s = getState();
  $('#sizes').innerHTML = s.sizes.map((z, i) => {
    const q = z.grupo === 'lunch' ? `producto=lunch&size=${z.id}` : `producto=torta&size=${z.id}`;
    const dims = z.d2 ? '' : `<small>${z.nota ? esc(z.nota) + '<br>' : ''}${z.d}cm diámetro<br>${z.h}cm alto</small>`;
    return `
      <a class="size-card" href="constructor.html?${q}" data-reveal style="--i:${i % 4}">
        <img src="assets/img/${z.icon}" alt="" loading="lazy">
        <b>${esc(z.nombre)}</b>
        <span class="porciones ${z.grupo === 'lunch' ? 'soft' : ''}">${z.grupo === 'lunch' ? '(' + esc(z.porciones) + ')' : esc(z.porciones)}</span>
        ${dims || `<small>${esc(z.nota)}</small>`}
        <span class="go">Diseñar en 3D →</span>
      </a>`;
  }).join('');
}

function renderFlavors() {
  const s = getState();
  const col = (title, list) => `<div><h3>${title}</h3><ul>${list.map((f) =>
    `<li class="${f.activo ? '' : 'is-off'}"><i class="dot" style="background:${f.color2 ? `linear-gradient(135deg, ${f.color} 50%, ${f.color2} 50%)` : f.color}"></i>${esc(f.nombre)}</li>`).join('')}</ul></div>`;
  $('#flavors').innerHTML = col('BIZCOCHOS', s.sponges) + col('RELLENOS', s.fillings) + col('TOPPINGS', s.toppings);
  const names = [...s.sponges, ...s.fillings].filter((f) => f.activo).map((f) => `<span>${esc(f.nombre)}</span>`).join('');
  $('#marquee').innerHTML = names + names;
}

const STAR = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.8l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17l-6.1 3.4 1.4-6.8L2.2 8.9l6.9-.8z"/></svg>';

function comboLink(c) {
  const cfg = normalizeConfig({ producto: 'torta', size: 't15', sponge: c.sponge, fillings: c.fillings, toppings: c.toppings });
  return `constructor.html#d=${encodeConfig(cfg)}`;
}

function renderCombos() {
  const s = getState();
  const color = (list, id) => list.find((x) => x.id === id)?.color || '#ccc';
  const sw = (c) => `<span class="swatches" aria-hidden="true"><i style="background:${color(s.sponges, c.sponge)}"></i>${[...new Set(c.fillings)].map((f) => `<i style="background:${color(s.fillings, f)}"></i>`).join('')}</span>`;
  $('#combos-top').innerHTML = COMBOS.filter((c) => c.top).map((c, i) => `
    <article class="combo-card" data-reveal style="--i:${i}">
      <span class="combo-star">${STAR}<b>${c.top}</b></span>
      ${sw(c)}
      <p>${esc(c.texto)}</p>
      <a class="btn btn-soft btn-sm" href="${comboLink(c)}">${ICON.cube} Probar en 3D</a>
    </article>`).join('');
  $('#combos-more').innerHTML = COMBOS.filter((c) => !c.top).map((c, i) => `
    <li data-reveal style="--i:${i % 3}">${sw(c)}<span>${esc(c.texto)}</span><a href="${comboLink(c)}">Probar en 3D</a></li>`).join('');
}

function applySettings() {
  const st = getState().settings;
  const map = { anticipacion: `${st.anticipacionDias} días`, chef: st.chef, whatsappDisplay: st.whatsappDisplay, direccion: st.direccion, horario: st.horario };
  $$('[data-setting]').forEach((el) => { if (map[el.dataset.setting]) el.textContent = map[el.dataset.setting]; });
  $$('[data-wa]').forEach((a) => { a.href = whatsappLink('Hola Blue Lemon Bakery 🍋 Quiero hacer un pedido.'); });
  $$('[data-ig]').forEach((a) => { a.href = `https://www.instagram.com/${st.instagram}/`; a.textContent = '@' + st.instagram; });
  $('#map-link').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Mapasingue Oeste calle tercera, Guayaquil');
  const close = $('#campaign-close');
  close.hidden = !(st.campana.activa && st.campana.cierre);
  if (!close.hidden) close.textContent = `Fecha de cierre de pedidos de ${st.campana.nombre}: ${fmtDate(st.campana.cierre, { day: 'numeric', month: 'long' })}.`;
}

function renderAll() {
  renderTabs(); renderProducts(); renderSizes(); renderFlavors(); renderCombos(); applySettings(); observeReveals();
}

/* ---------- Animaciones de scroll ---------- */

let io;
function observeReveals() {
  if (!io) {
    io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  }
  $$('[data-reveal]:not(.is-in)').forEach((el) => io.observe(el));
}

function initParallax() {
  if (reduced) return;
  const items = $$('[data-parallax]').map((el) => ({ el, k: Number(el.dataset.parallax) }));
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = window.scrollY;
    if (y > window.innerHeight * 1.3) return;
    items.forEach(({ el, k }) => el.style.setProperty('--py', `${(y * k).toFixed(1)}px`));
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
}

// Escena 3D de la portada: una torta de dos pisos se arma sola al cargar y queda flotando
// junto a un Can, una lunch cake y un cupcake. Sigue al puntero y gira con el scroll.
const HERO_CAKE = {
  kind: 'cake',
  tiers: [{ d: 17, h: 12 }, { d: 11, h: 9 }],
  sponge: { color: '#f0d79b' },
  fillings: ['#9dbb62', '#a11d3c'],
  frosting: { style: 'liso', color: '#fbf2e0' },
  border: { type: 'rosetones', color: '#86cbd3', color2: null, base: true },
  toppings: ['sprinkles'],
  topper: { type: 'cerezas' },
};
const HERO_LUNCH = {
  kind: 'cake',
  tiers: [{ d: 10, h: 7 }],
  sponge: { color: '#5a3622' },
  fillings: ['#b9772f'],
  frosting: { style: 'liso', color: '#fbf2e0' },
  border: { type: 'rosetones', color: '#86cbd3', color2: '#5b3421', base: false },
  toppings: [],
  topper: { type: 'polaroid', photo: 'assets/img/favicon.png' },
  mensaje: 'Para ti',
};

async function initHero() {
  const wrap = $('.hero-collage'), canvas = $('#hero-canvas'), hero = $('#inicio');
  const { createStage, buildCake, buildProp, applyAssembly, webglAvailable, fontsReady } = await import('./cake3d.js');
  if (!webglAvailable()) return;
  wrap.classList.add('has-3d');
  await fontsReady();

  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const back = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let start = null, last = 0, scroll = 0, settled = false;

  const stage = createStage(canvas, { controls: false, onFrame });
  stage.ground.visible = false;

  const main = buildCake(HERO_CAKE);
  main.root.position.y = 0.1;
  stage.pivot.add(main.root);

  const red = getState().products.find((p) => p.id === 'can-red-velvet');
  const can = buildCake({ kind: 'can', can: { capas: red?.capas || ['#a3222f', '#fbf2e0', '#a3222f', '#fbf2e0', '#a3222f', '#fbf2e0'], nombre: 'Red Velvet' } }).root;
  const lunch = buildCake(HERO_LUNCH).root;
  const cupcake = buildProp('cupcake', { sponge: '#f0d79b', color: '#86cbd3' });
  const cupcake2 = buildProp('cupcake', { sponge: '#5a3622', color: '#5b3421', color2: '#caff8a' });
  // x, y, z de reposo · amplitud y fase del vaivén · velocidad de giro · inclinación · tamaño · retraso de entrada
  const props = [
    { o: can, pos: [-1.8, 1.6, 0.4], amp: 0.1, ph: 0.4, spin: 0.35, tilt: 0.18, k: 1.2, delay: 1.5 },
    { o: lunch, pos: [1.7, 0.2, 0.8], amp: 0.07, ph: 2.1, spin: -0.22, tilt: -0.1, k: 1.05, delay: 1.9 },
    { o: cupcake, pos: [1.85, 1.95, -0.5], amp: 0.12, ph: 3.4, spin: 0.5, tilt: 0.2, k: 1.05, delay: 2.2 },
    { o: cupcake2, pos: [-1.75, 0.15, -0.2], amp: 0.09, ph: 5, spin: -0.4, tilt: -0.16, k: 0.9, delay: 2.5 },
  ];
  props.forEach((p) => { p.o.position.set(...p.pos); p.o.rotation.z = p.tilt; p.o.scale.setScalar(0.0001); stage.pivot.add(p.o); });
  const sprinkles = buildProp('sprinkles', { count: 80 });
  sprinkles.position.y = 1.4;
  sprinkles.scale.setScalar(0.0001);
  stage.pivot.add(sprinkles);

  const frame = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    const d = Math.max(7.6, 10.2 / (w / h));
    stage.camera.position.set(0, 1.9, d);
    stage.camera.lookAt(0, 1.3, 0);
    stage.invalidate();
  };
  new ResizeObserver(frame).observe(canvas);
  frame();

  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  });
  window.addEventListener('scroll', () => { scroll = clamp01(window.scrollY / (hero.offsetHeight || 1)); }, { passive: true });

  function pose(t) {
    applyAssembly(main.parts, clamp01(t / 2.6));
    main.root.rotation.y = t * 0.28;
    main.root.position.y = 0.1 + Math.sin(t * 0.9) * 0.05;
    props.forEach((p) => {
      p.o.scale.setScalar(0.1 * p.k * Math.max(0.001, back(clamp01((t - p.delay) / 0.8))));
      p.o.position.y = p.pos[1] + Math.sin(t * 1.1 + p.ph) * p.amp;
      p.o.rotation.y = t * p.spin + p.ph;
    });
    sprinkles.scale.setScalar(Math.max(0.0001, back(clamp01((t - 1.2) / 1.2))));
    sprinkles.rotation.y = t * 0.07;
    sprinkles.position.y = 1.4 + Math.sin(t * 0.5) * 0.08;
  }

  function onFrame(time) {
    if (reduced) {
      if (settled) return false;
      settled = true;
      pose(60);
      stage.pivot.rotation.y = -0.3;
      return true;
    }
    if (start === null) start = time;
    const t = (time - start) / 1000, dt = Math.min(0.05, (time - last) / 1000 || 0.016);
    last = time;
    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 4);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 4);
    pose(t);
    stage.pivot.rotation.y = pointer.x * 0.38 + Math.sin(t * 0.3) * 0.1 + scroll * 1.5;
    stage.pivot.rotation.x = pointer.y * 0.1 + scroll * 0.25;
    stage.pivot.position.y = scroll * 0.9;
    wrap.style.setProperty('--ry', `${(pointer.x * 9).toFixed(2)}deg`);
    wrap.style.setProperty('--rx', `${(-pointer.y * 7).toFixed(2)}deg`);
    return true;
  }
}

// La torta de la historia: se arma según el avance del scroll dentro de la sección.
const STORY_SPEC = {
  kind: 'cake',
  tiers: [{ d: 16, h: 13 }],
  sponge: { color: '#f0d79b' },
  fillings: ['#9dbb62', '#a11d3c'],
  frosting: { style: 'liso', color: '#fbf2e0' },
  border: { type: 'rosetones', color: '#86cbd3', color2: null, base: true },
  toppings: ['sprinkles'],
  topper: { type: 'polaroid', photo: 'assets/img/favicon.png' },
  mensaje: 'Para ti',
};

async function initStory() {
  const section = $('#como-nace');
  const steps = $$('.story-step', section), dots = $$('.story-dots i', section);
  const { createStage, applyAssembly, webglAvailable, fontsReady } = await import('./cake3d.js');
  if (!webglAvailable()) { section.classList.add('is-static', 'no-webgl'); return; }

  const stage = createStage($('#story-canvas'), { controls: false });
  await fontsReady();
  let cake = stage.setSpec(STORY_SPEC, { fit: true });
  const baseCam = stage.camera.position.clone();
  let target = stage.target;

  if (reduced) {
    section.classList.add('is-static');
    applyAssembly(cake.parts, 1);
    stage.pivot.rotation.y = -0.35;
    new ResizeObserver(() => stage.fit()).observe($('#story-canvas'));
    return;
  }

  let shown = -1, current = 0, goal = 0;
  const measure = () => {
    const rect = section.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    goal = Math.min(1, Math.max(0, -rect.top / total));
  };
  const render = (p) => {
    const build = Math.min(1, p / 0.84);
    applyAssembly(cake.parts, build);
    stage.pivot.rotation.y = -0.9 + p * 2.6;
    // La cámara empieza alta para ver caer las capas y baja al terminar.
    const lift = 1 - Math.min(1, p / 0.6);
    stage.camera.position.set(baseCam.x, baseCam.y + lift * 1.6, baseCam.z + lift * 0.6);
    stage.camera.lookAt(target.x, target.y, target.z);
    stage.invalidate();
    const idx = Math.min(steps.length - 1, Math.floor(p * steps.length * 0.999));
    if (idx !== shown) {
      shown = idx;
      steps.forEach((s, i) => s.classList.toggle('is-active', i === idx));
      dots.forEach((d, i) => d.classList.toggle('is-on', i <= idx));
    }
    section.classList.toggle('is-end', p > 0.9);
  };
  const tick = () => {
    measure();
    // Suavizado: la escena persigue al scroll en lugar de saltar con cada evento.
    const next = current + (goal - current) * 0.14;
    if (Math.abs(next - current) > 0.0004 || shown < 0) { current = next; render(current); }
    requestAnimationFrame(tick);
  };
  new ResizeObserver(() => { stage.fit(); baseCam.copy(stage.camera.position); target = stage.target; shown = -1; }).observe($('#story-canvas'));
  measure(); current = goal; render(current);
  requestAnimationFrame(tick);
}

/* ---------- Arranque ---------- */

// Solo se vuelve a pintar el catálogo si cambió algo que se ve en él (no al tocar el carrito).
const signature = () => { const { cart, orders, seq, ...rest } = getState(); return JSON.stringify(rest); };
let lastSig = '';
const refresh = () => { const sig = signature(); if (sig !== lastSig) { lastSig = sig; renderAll(); } };

initChrome();
refresh();
onChange(refresh);
initParallax();
initHero().catch((err) => { console.error(err); $('.hero-collage').classList.remove('has-3d'); });
initStory().catch((err) => { console.error(err); $('#como-nace').classList.add('is-static', 'no-webgl'); });

document.addEventListener('click', (e) => {
  // "Haz tu pedido aquí": si ya hay algo en el pedido abre el carrito; si no, baja al catálogo.
  if (e.target.closest('[data-order-here]') && cartCount() > 0) { e.preventDefault(); openCart(); return; }
  const tab = e.target.closest('[data-cat]');
  if (tab) { activeCat = tab.dataset.cat; renderTabs(); renderProducts(); return; }
  const add = e.target.closest('[data-add]');
  if (add) {
    const sel = $(`[data-variant="${add.dataset.add}"]`);
    addProduct(add.dataset.add, sel?.value);
    toast('Añadido a tu pedido');
    openCart();
  }
});
