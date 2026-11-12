// Sitio público: catálogo, tamaños, sabores, combinaciones y la historia con scroll en 3D.

import {
  getState, onChange, CATEGORIES, COMBOS, money, esc, canSVG, addProduct, whatsappLink, fmtDate, encodeConfig, normalizeConfig,
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
    items.forEach(({ el, k }) => { el.style.transform = `translate3d(0, ${(y * k).toFixed(1)}px, 0)`; });
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
}

// La torta de la portada: se arma según el avance del scroll dentro de la sección.
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
initStory().catch((err) => { console.error(err); $('#como-nace').classList.add('is-static', 'no-webgl'); });

document.addEventListener('click', (e) => {
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
