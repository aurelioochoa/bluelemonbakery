// Comportamiento compartido del sitio público: cabecera, carrito, checkout y avisos.

import {
  getState, onChange, cartCount, cartTotal, cartLeadDays, setQty, createOrder,
  money, esc, canSVG, isoDate, addDays, today, fmtDate, whatsappLink, orderMessage,
} from './data.js';

export const ICON = {
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1.2 11a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  cube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.6 20.4l1.3-4.3a8.4 8.4 0 1 1 3.2 3.1z"/><path d="M9.2 8.2c-.6 2.6 3 6.3 6.4 6.5l1.1-1.5-2-1.3-1 .8c-.9-.5-1.6-1.2-2.1-2.1l.8-1L11.1 7.7z" fill="currentColor" stroke="none"/></svg>',
  ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/></svg>',
  cake: '<svg class="cake-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16M5 20v-7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7"/><path d="M5 15c1.2 0 1.2 1 2.3 1s1.2-1 2.4-1 1.1 1 2.3 1 1.2-1 2.3-1 1.2 1 2.4 1 1.1-1 2.3-1"/><path d="M12 11V7"/><path d="M12 7c1-1 1-2 0-3-1 1-1 2 0 3z" fill="currentColor"/></svg>',
  leaf: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 3C10 3 4 8 4 15c0 2 .6 3.6 1.5 5C7 14 11 9.5 17 7c-5 3.5-8.5 8-9.8 14 .9.3 1.8.5 2.8.5 6 0 10-6 10-18.5z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
};

let toastTimer;
export function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.append(el); }
  el.textContent = msg;
  requestAnimationFrame(() => el.classList.add('is-on'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 2600);
}

const $ = (sel, root = document) => root.querySelector(sel);

function thumb(it) {
  if (it.img) return `<img src="assets/img/${esc(it.img)}" alt="">`;
  if (it.capas) return canSVG(it.capas, it.nombre);
  return ICON.cake;
}

function renderCart() {
  const s = getState();
  document.querySelectorAll('[data-cart-count]').forEach((el) => { el.textContent = cartCount() || ''; });
  const body = $('#cart-body');
  if (!body) return;
  if (!s.cart.length) {
    body.innerHTML = `<div class="empty"><img src="assets/img/mark-navy.png" alt=""><p><strong>Tu pedido está vacío</strong></p><p class="note">Añade algo del catálogo o diseña tu torta en 3D.</p></div>`;
  } else {
    body.innerHTML = s.cart.map((it) => `
      <div class="cart-item">
        <div class="cart-thumb">${thumb(it)}</div>
        <div>
          <h3>${esc(it.nombre)}</h3>
          ${it.variante ? `<small>${esc(it.variante)}</small>` : ''}
          ${(it.detalle || []).map((l) => `<small>${esc(l)}</small>`).join('')}
          <div class="qty" role="group" aria-label="Cantidad">
            <button type="button" data-qty="${it.key}" data-d="-1" aria-label="Quitar uno">−</button>
            <span>${it.qty}</span>
            <button type="button" data-qty="${it.key}" data-d="1" aria-label="Añadir uno">+</button>
          </div>
        </div>
        <strong>${money(it.precio * it.qty)}</strong>
      </div>`).join('');
  }
  const lead = cartLeadDays();
  $('#cart-foot').innerHTML = `
    <div class="cart-total"><span>Total referencial</span><strong>${money(cartTotal())}</strong></div>
    <p class="note">${lead ? `Tortas y bocaditos se piden con ${lead} días de anticipación.` : 'Los Cans se pueden pedir para el mismo día.'} El valor no incluye envío a domicilio.</p>
    <button class="btn btn-lime btn-block" id="go-checkout" ${s.cart.length ? '' : 'disabled'}>Continuar con el pedido ${ICON.arrow}</button>`;
}

function openDrawer(open = true) {
  $('#cart-drawer').classList.toggle('is-open', open);
  $('#scrim').classList.toggle('is-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}
function openModal(open = true) {
  $('#checkout').classList.toggle('is-open', open);
  $('#scrim').classList.toggle('is-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}
export const openCart = () => { renderCart(); openDrawer(true); };

function checkoutForm() {
  const s = getState();
  const min = isoDate(addDays(today(), cartLeadDays()));
  return `
    <div class="modal-head">
      <div><p class="eyebrow">Paso final</p><h2 class="serif">Datos de entrega</h2></div>
      <button class="icon-btn" data-close aria-label="Cerrar">${ICON.close}</button>
    </div>
    <form id="checkout-form" class="form-grid" novalidate>
      <label class="field"><span>Nombre y apellido</span><input class="input" name="nombre" required autocomplete="name" placeholder="¿A nombre de quién?"></label>
      <label class="field"><span>WhatsApp</span><input class="input" name="telefono" required inputmode="tel" autocomplete="tel" placeholder="09 ..."></label>
      <div class="field full"><span>¿Cómo lo recibes?</span>
        <div class="seg" id="modalidad">
          <button type="button" data-v="retiro" aria-pressed="true">Retiro en taller</button>
          <button type="button" data-v="domicilio" aria-pressed="false">A domicilio</button>
        </div>
        <p class="note" id="modalidad-note">${esc(s.settings.direccion)}.</p>
      </div>
      <label class="field full" id="dir-field" hidden><span>Dirección de entrega</span><input class="input" name="direccion" autocomplete="street-address" placeholder="Sector, calle y referencia"></label>
      <label class="field"><span>Fecha</span><input class="input" type="date" name="entrega" required min="${min}" value="${min}"></label>
      <label class="field"><span>Hora aproximada</span>
        <select class="select" name="hora">${['09:00', '10:30', '12:00', '13:30', '15:00', '16:30'].map((h) => `<option>${h}</option>`).join('')}</select></label>
      <label class="field full"><span>Notas (alergias, temática, referencia)</span><textarea class="textarea" name="notas" placeholder="Opcional"></textarea></label>
      <p class="note full" id="form-error" role="alert" style="color:var(--danger)" hidden></p>
      <div class="full" style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:space-between">
        <div><span class="note">Total referencial</span><br><strong style="font-size:1.4rem">${money(cartTotal())}</strong></div>
        <button class="btn btn-lime" type="submit">Registrar pedido ${ICON.arrow}</button>
      </div>
    </form>`;
}

function checkoutDone(o) {
  return `
    <div style="text-align:center;display:grid;grid-template-columns:minmax(0,1fr);gap:14px;justify-items:center">
      <span style="width:64px;height:64px;border-radius:50%;background:var(--lime);border:2px solid var(--navy);display:grid;place-items:center;color:var(--navy)"><span style="width:30px">${ICON.check}</span></span>
      <p class="eyebrow">Pedido ${esc(o.id)}</p>
      <h2 class="serif" style="font-size:1.9rem">¡Listo, ${esc(o.cliente.nombre.split(' ')[0])}!</h2>
      <p>Registramos tu pedido para el <strong>${fmtDate(o.entrega, { weekday: 'long', day: 'numeric', month: 'long' })}</strong>. Envíalo por WhatsApp para confirmar disponibilidad.</p>
      <a class="btn btn-wa btn-block" target="_blank" rel="noopener" href="${whatsappLink(orderMessage(o))}">${ICON.wa} Enviar pedido por WhatsApp</a>
      <a class="btn btn-soft btn-block" href="admin.html#pedidos">Ver cómo llega al panel de administración</a>
      <p class="note"><span class="demo-badge">Maqueta</span> El pedido se guardó en este navegador; en producción llegará al sistema de la pastelería.</p>
      <button class="btn btn-ghost btn-sm" data-close>Seguir viendo</button>
    </div>`;
}

export function initChrome() {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="scrim" id="scrim"></div>
    <aside class="drawer" id="cart-drawer" aria-label="Tu pedido">
      <div class="drawer-head"><h2 class="serif">Tu pedido</h2><button class="icon-btn" data-close aria-label="Cerrar">${ICON.close}</button></div>
      <div class="drawer-body" id="cart-body"></div>
      <div class="drawer-foot" id="cart-foot"></div>
    </aside>
    <div class="modal" id="checkout" role="dialog" aria-modal="true" aria-label="Datos de entrega"><div class="modal-card" id="checkout-card"></div></div>`);

  // Cabecera: transparente sobre la portada, sólida al hacer scroll.
  const header = $('.site-header');
  if (header && header.dataset.overlay !== undefined) {
    const onScroll = () => header.classList.toggle('is-solid', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
  const nav = $('.nav'), toggle = $('.menu-toggle');
  toggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open);
    if (open) header.classList.add('is-solid'); else if (header.dataset.overlay !== undefined && window.scrollY <= 40) header.classList.remove('is-solid');
  });
  nav?.addEventListener('click', (e) => { if (e.target.closest('a')) { nav.classList.remove('is-open'); toggle?.setAttribute('aria-expanded', false); } });

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-cart]')) { openCart(); return; }
    if (e.target.closest('[data-close]') || e.target.id === 'scrim') { openDrawer(false); openModal(false); return; }
    const q = e.target.closest('[data-qty]');
    if (q) {
      const it = getState().cart.find((x) => x.key === q.dataset.qty);
      if (it) setQty(it.key, it.qty + Number(q.dataset.d));
      return;
    }
    if (e.target.closest('#go-checkout')) {
      openDrawer(false);
      $('#checkout-card').innerHTML = checkoutForm();
      openModal(true);
      return;
    }
    const seg = e.target.closest('#modalidad button');
    if (seg) {
      seg.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b === seg));
      const dom = seg.dataset.v === 'domicilio';
      $('#dir-field').hidden = !dom;
      $('#modalidad-note').textContent = dom ? 'El envío se cotiza por WhatsApp según el sector.' : getState().settings.direccion + '.';
    }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { openDrawer(false); openModal(false); } });

  document.addEventListener('submit', (e) => {
    if (e.target.id !== 'checkout-form') return;
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    f.modalidad = $('#modalidad [aria-pressed="true"]').dataset.v;
    const err = $('#form-error');
    const min = e.target.entrega.min;
    let msg = '';
    if (!f.nombre.trim() || !f.telefono.trim()) msg = 'Escribe tu nombre y tu WhatsApp para poder confirmarte el pedido.';
    else if (!f.entrega || f.entrega < min) msg = `La fecha más cercana disponible es el ${fmtDate(min, { day: 'numeric', month: 'long' })}.`;
    else if (f.modalidad === 'domicilio' && !f.direccion.trim()) msg = 'Indica la dirección de entrega.';
    if (msg) { err.textContent = msg; err.hidden = false; return; }
    const order = createOrder(f);
    $('#checkout-card').innerHTML = checkoutDone(order);
  });

  onChange(renderCart);
  renderCart();
}
