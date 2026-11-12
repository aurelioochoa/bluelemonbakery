// Panel de administración (maqueta). Lee y escribe el mismo estado que usa el sitio público,
// así que cualquier cambio de precios, sabores o ajustes se refleja al instante en la web.

import {
  getState, save, onChange, resetDemo, ESTADOS, CATEGORIES, money, esc, fmtDate, isoDate, today, addDays, parseDate,
  canSVG, toSpec, whatsappLink,
} from './data.js';
import { toast, ICON } from './ui.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const VIEWS = [
  { id: 'resumen', nombre: 'Resumen', sub: 'Cómo va el negocio hoy', icon: I('<path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z"/>') },
  { id: 'pedidos', nombre: 'Pedidos', sub: 'Todo lo que entra desde la web', icon: I('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>') },
  { id: 'produccion', nombre: 'Producción', sub: 'Qué hay que hornear y entregar', icon: I('<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>') },
  { id: 'productos', nombre: 'Productos', sub: 'Catálogo, precios y disponibilidad', icon: I('<path d="M4 20h16M5 20v-7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7M12 11V7"/><path d="M5 15.5c1.2 0 1.2 1 2.3 1s1.2-1 2.4-1 1.1 1 2.3 1 1.2-1 2.3-1 1.2 1 2.4 1 1.1-1 2.3-1"/>') },
  { id: 'sabores', nombre: 'Sabores y tamaños', sub: 'Lo que el cliente puede elegir en el constructor', icon: I('<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 0 0 17M3.5 12h17"/>') },
  { id: 'clientes', nombre: 'Clientes', sub: 'Quién compra y cuánto', icon: I('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.5-3.5 3-5.5 6.5-5.5s6 2 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c2 .7 3.2 2.4 3.5 5.2"/>') },
  { id: 'ajustes', nombre: 'Ajustes', sub: 'Datos del negocio y campaña de temporada', icon: I('<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>') },
];

const estadoNombre = (id) => ESTADOS.find((e) => e.id === id)?.nombre || id;
const badge = (id) => `<span class="badge st-${id}">${estadoNombre(id)}</span>`;
const ACTIVOS = ['nuevo', 'confirmado', 'produccion', 'listo'];
const itemsText = (o) => o.items.map((it) => `${it.qty}× ${it.nombre}`).join(', ');
const swatch = (f) => `style="background:${f.color2 ? `linear-gradient(135deg, ${f.color} 50%, ${f.color2} 50%)` : f.color}"`;

let filtro = 'todos', busqueda = '';
let preview = null; // escena 3D abierta en el detalle

/* ---------- Vistas ---------- */

function vResumen(s) {
  const t0 = today(), hoy = isoDate(t0), mes = hoy.slice(0, 7);
  const validos = s.orders.filter((o) => o.estado !== 'cancelado');
  const delMes = validos.filter((o) => o.fecha.startsWith(mes));
  const ventasMes = delMes.reduce((a, o) => a + o.total, 0);
  const activos = s.orders.filter((o) => ACTIVOS.includes(o.estado));
  const en7 = activos.filter((o) => o.entrega >= hoy && o.entrega <= isoDate(addDays(t0, 7)));
  const ticket = validos.length ? validos.reduce((a, o) => a + o.total, 0) / validos.length : 0;
  const porCobrar = activos.reduce((a, o) => a + (o.total - (o.abono || 0)), 0);

  // Ventas por día (fecha en que entró el pedido), últimos 14 días.
  const days = [...Array(14)].map((_, i) => isoDate(addDays(t0, i - 13)));
  const serie = days.map((d) => validos.filter((o) => o.fecha === d).reduce((a, o) => a + o.total, 0));
  const max = Math.max(50, ...serie), top = Math.ceil(max / 50) * 50;
  const W = 640, H = 220, L = 34, B = 26, T = 14, bw = (W - L) / days.length;
  const y = (v) => T + (H - T - B) * (1 - v / top);
  const bars = serie.map((v, i) => {
    const x = L + i * bw + 5, h = Math.max(0, H - B - y(v));
    return `<g><rect class="bar ${days[i] === hoy ? 'today' : ''}" x="${x.toFixed(1)}" y="${y(v).toFixed(1)}" width="${(bw - 10).toFixed(1)}" height="${h.toFixed(1)}" rx="5"><title>${fmtDate(days[i])}: ${money(v)}</title></rect>
      ${v ? `<text class="val" x="${(x + (bw - 10) / 2).toFixed(1)}" y="${(y(v) - 5).toFixed(1)}" text-anchor="middle">${Math.round(v)}</text>` : ''}
      ${i % 2 === 1 ? `<text x="${(x + (bw - 10) / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle">${parseDate(days[i]).getDate()}/${parseDate(days[i]).getMonth() + 1}</text>` : ''}</g>`;
  }).join('');
  const grid = [0, top / 2, top].map((v) => `<line class="grid" x1="${L}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 3}" text-anchor="end">$${v}</text>`).join('');

  const porEstado = ESTADOS.map((e) => ({ ...e, n: s.orders.filter((o) => o.estado === e.id).length }));
  const maxE = Math.max(1, ...porEstado.map((e) => e.n));
  const vendidos = {};
  validos.forEach((o) => o.items.forEach((it) => { vendidos[it.nombre] = (vendidos[it.nombre] || 0) + it.qty; }));
  const topProd = Object.entries(vendidos).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const proximas = activos.filter((o) => o.entrega >= hoy).sort((a, b) => (a.entrega + a.hora < b.entrega + b.hora ? -1 : 1)).slice(0, 5);

  return `
    <div class="kpis">
      <div class="kpi accent"><span>Ventas del mes</span><strong>${money(ventasMes)}</strong><small>${delMes.length} pedidos en ${t0.toLocaleDateString('es-EC', { month: 'long' })}</small></div>
      <div class="kpi"><span>Pedidos activos</span><strong>${activos.length}</strong><small>${s.orders.filter((o) => o.estado === 'nuevo').length} nuevos por confirmar</small></div>
      <div class="kpi"><span>Entregas en 7 días</span><strong>${en7.length}</strong><small>${en7.filter((o) => o.entrega === hoy).length} para hoy</small></div>
      <div class="kpi"><span>Ticket promedio</span><strong>${money(ticket)}</strong><small>${money(porCobrar)} por cobrar</small></div>
    </div>
    <div class="cols">
      <section class="panel-card"><h2>Ventas por día · últimos 14 días <span>USD</span></h2>
        <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Ventas por día de los últimos 14 días">${grid}${bars}</svg></section>
      <section class="panel-card"><h2>Pedidos por estado</h2>
        <ul class="statlist">${porEstado.map((e) => `<li><span>${e.nombre}</span><span class="track"><i style="width:${(e.n / maxE) * 100}%"></i></span><b>${e.n}</b></li>`).join('')}</ul></section>
    </div>
    <div class="cols cols-even">
      <section class="panel-card"><h2>Próximas entregas <a class="btn btn-soft btn-sm" href="#produccion">Ver agenda</a></h2>
        <ul class="list">${proximas.map((o) => `<li data-order="${o.id}" style="cursor:pointer">
          <span class="daybox"><b>${parseDate(o.entrega).getDate()}</b><span>${parseDate(o.entrega).toLocaleDateString('es-EC', { month: 'short' }).replace('.', '')}</span></span>
          <span class="grow"><b>${esc(o.cliente.nombre)}</b><small>${esc(itemsText(o))}</small></span>${badge(o.estado)}</li>`).join('') || '<li class="note">No hay entregas pendientes.</li>'}</ul></section>
      <section class="panel-card"><h2>Lo más pedido</h2>
        <ul class="list">${topProd.map(([n, q], i) => `<li><span class="daybox"><b>${i + 1}</b><span>top</span></span><span class="grow"><b>${esc(n)}</b></span><b>${q} uds</b></li>`).join('')}</ul></section>
    </div>`;
}

function vPedidos(s) {
  const q = busqueda.trim().toLowerCase();
  const list = s.orders.filter((o) => (filtro === 'todos' || o.estado === filtro)
    && (!q || [o.id, o.cliente.nombre, o.cliente.telefono, itemsText(o)].join(' ').toLowerCase().includes(q)));
  const count = (id) => s.orders.filter((o) => id === 'todos' || o.estado === id).length;
  return `
    <div class="toolbar">
      <input class="input" id="search" type="search" placeholder="Buscar por cliente, pedido o producto" value="${esc(busqueda)}" aria-label="Buscar pedidos">
      <div class="filters" role="group" aria-label="Filtrar por estado">${[{ id: 'todos', nombre: 'Todos' }, ...ESTADOS].map((e) =>
        `<button data-filtro="${e.id}" aria-pressed="${filtro === e.id}">${e.nombre}<span>${count(e.id)}</span></button>`).join('')}</div>
    </div>
    <div class="table-wrap stack"><table>
      <thead><tr><th>Pedido</th><th>Cliente</th><th>Entrega</th><th>Detalle</th><th class="num">Total</th><th>Estado</th></tr></thead>
      <tbody>${list.map((o) => `<tr data-row data-order="${o.id}">
        <td><b>${o.id}</b><small>${fmtDate(o.fecha, { day: 'numeric', month: 'short' })}</small></td>
        <td class="num-m">${esc(o.cliente.nombre)}<small>${esc(o.cliente.telefono)}</small></td>
        <td>${fmtDate(o.entrega)}<small>${o.hora} · ${o.modalidad === 'domicilio' ? 'Domicilio' : 'Retiro'}</small></td>
        <td class="wide"><small style="color:var(--ink);font-size:.86rem">${esc(itemsText(o))}</small></td>
        <td class="num"><b>${money(o.total)}</b></td>
        <td>${badge(o.estado)}</td></tr>`).join('') || '<tr><td colspan="6" class="note" style="text-align:center;padding:30px">Ningún pedido coincide con el filtro.</td></tr>'}</tbody>
    </table></div>`;
}

function vProduccion(s) {
  const t0 = today(), hoy = isoDate(t0);
  const pend = s.orders.filter((o) => ['confirmado', 'produccion', 'listo', 'nuevo'].includes(o.estado) && o.entrega >= hoy);
  const dias = [...new Set(pend.map((o) => o.entrega))].sort();
  // Bizcochos a hornear en los próximos 7 días según las tortas personalizadas pedidas.
  const limite = isoDate(addDays(t0, 7));
  const hornear = {};
  pend.filter((o) => o.entrega <= limite && o.estado !== 'nuevo').forEach((o) => o.items.forEach((it) => {
    if (it.config && it.config.producto !== 'can' && it.config.producto !== 'tiramisu') hornear[it.config.sponge] = (hornear[it.config.sponge] || 0) + it.qty;
  }));
  const bake = Object.entries(hornear).sort((a, b) => b[1] - a[1]).map(([id, n]) => {
    const f = s.sponges.find((x) => x.id === id) || { nombre: id, color: '#ccc' };
    return `<span><i ${swatch(f)}></i>${esc(f.nombre)} <b>× ${n}</b></span>`;
  }).join('');
  return `
    <section class="panel-card"><h2>Bizcochos por hornear · próximos 7 días</h2>
      <div class="bake">${bake || '<span class="note">Sin tortas personalizadas confirmadas esta semana.</span>'}</div></section>
    <div class="agenda">${dias.map((d) => {
      const os = pend.filter((o) => o.entrega === d).sort((a, b) => (a.hora < b.hora ? -1 : 1));
      return `<article class="day ${d === hoy ? 'is-today' : ''}">
        <header><b>${d === hoy ? 'Hoy · ' : ''}${fmtDate(d, { weekday: 'long', day: 'numeric', month: 'short' })}</b><span>${os.length} ${os.length === 1 ? 'pedido' : 'pedidos'}</span></header>
        <ul>${os.map((o) => `<li data-order="${o.id}"><div class="row"><b>${o.hora} · ${esc(o.cliente.nombre)}</b>${badge(o.estado)}</div>
          <small>${esc(itemsText(o))}</small><small>${o.modalidad === 'domicilio' ? 'Domicilio: ' + esc(o.direccion) : 'Retiro en taller'}</small></li>`).join('')}</ul></article>`;
    }).join('') || '<p class="note">No hay entregas programadas.</p>'}</div>`;
}

function prodThumb(p) {
  if (p.img) return `<img src="assets/img/${esc(p.img)}" alt="">`;
  if (p.capas) return canSVG(p.capas, p.nombre);
  return '<img class="ph" src="assets/img/mark-navy.png" alt="">';
}

function vProductos(s) {
  const cat = (id) => CATEGORIES.find((c) => c.id === id)?.nombre || id;
  return `
    <p class="note">Cambia un precio o apaga un producto y revisa el sitio público: se actualiza al instante.</p>
    <div class="table-wrap scroll"><table>
      <thead><tr><th>Producto</th><th>Categoría</th><th class="num">Precio (USD)</th><th>Visible</th><th></th></tr></thead>
      <tbody>${s.products.map((p) => `<tr>
        <td><div class="cell-prod"><span class="thumb">${prodThumb(p)}</span><span><b>${esc(p.nombre)}</b><small>${esc(p.desc).slice(0, 70)}${p.desc.length > 70 ? '…' : ''}</small></span></div></td>
        <td>${cat(p.cat)}</td>
        <td class="num">${p.variantes
          ? p.variantes.map((v, i) => `<label style="display:flex;gap:8px;justify-content:flex-end;align-items:center;margin:3px 0"><small>${esc(v.nombre)}</small><input class="input price-input" type="number" step="0.5" min="0" value="${v.precio}" data-price="${p.id}" data-variant="${i}"></label>`).join('')
          : `<input class="input price-input" type="number" step="0.5" min="0" value="${p.precio}" data-price="${p.id}" aria-label="Precio de ${esc(p.nombre)}">`}</td>
        <td><input type="checkbox" class="mini-switch" data-active="${p.id}" ${p.activo ? 'checked' : ''} aria-label="Visible en la web"></td>
        <td class="num"><button class="btn btn-soft btn-sm" data-edit="${p.id}">Editar</button></td></tr>`).join('')}</tbody>
    </table></div>`;
}

function vSabores(s) {
  const col = (key, title) => `<section class="panel-card"><h2>${title}<span>${s[key].filter((f) => f.activo).length}/${s[key].length} activos</span></h2>
    <ul>${s[key].map((f) => `<li><i ${swatch(f)}></i><span class="grow">${esc(f.nombre)}</span>
      <input type="checkbox" class="mini-switch" data-flavor="${key}" data-id="${f.id}" ${f.activo ? 'checked' : ''} aria-label="${esc(f.nombre)} disponible"></li>`).join('')}</ul></section>`;
  return `
    <p class="note">Si se acaba un ingrediente, apágalo aquí: aparece tachado en la web y deja de poder elegirse en el constructor 3D.</p>
    <div class="flavor-cols">${col('sponges', 'Bizcochos')}${col('fillings', 'Rellenos')}${col('toppings', 'Toppings')}</div>
    <section class="panel-card"><h2>Tamaños y precios base</h2>
      <div class="table-wrap scroll" style="border:0"><table>
        <thead><tr><th>Tamaño</th><th>Porciones</th><th>Medidas</th><th class="num">Precio base (USD)</th></tr></thead>
        <tbody>${s.sizes.map((z) => `<tr><td><b>${esc(z.nombre)}</b></td><td>${esc(z.porciones)}</td>
          <td>${z.d2 ? 'Variable' : `${z.d} cm ø × ${z.h} cm`}</td>
          <td class="num"><input class="input price-input" type="number" step="1" min="0" value="${z.precio}" data-size="${z.id}" aria-label="Precio base">${z.ref ? '<small>referencial</small>' : '<small>catálogo</small>'}</td></tr>`).join('')}</tbody>
      </table></div></section>`;
}

function vClientes(s) {
  const map = new Map();
  s.orders.forEach((o) => {
    const k = o.cliente.telefono + o.cliente.nombre;
    const c = map.get(k) || { ...o.cliente, n: 0, total: 0, ultimo: '' };
    c.n++; if (o.estado !== 'cancelado') c.total += o.total; if (o.fecha > c.ultimo) c.ultimo = o.fecha;
    map.set(k, c);
  });
  const list = [...map.values()].sort((a, b) => b.total - a.total);
  return `<div class="table-wrap stack"><table>
    <thead><tr><th>Cliente</th><th>WhatsApp</th><th class="num">Pedidos</th><th class="num">Total comprado</th><th>Último pedido</th><th></th></tr></thead>
    <tbody>${list.map((c) => `<tr><td><b>${esc(c.nombre)}</b></td><td>${esc(c.telefono)}</td><td class="num">${c.n}</td><td class="num"><b>${money(c.total)}</b></td>
      <td>${fmtDate(c.ultimo, { day: 'numeric', month: 'short' })}</td>
      <td class="num"><a class="btn btn-soft btn-sm" target="_blank" rel="noopener" href="${whatsappLink(`Hola ${c.nombre.split(' ')[0]}, te escribe Blue Lemon Bakery 🍋`, '593' + c.telefono.replace(/^0/, ''))}">Escribir</a></td></tr>`).join('')}</tbody></table></div>`;
}

function vAjustes(s) {
  const st = s.settings;
  const f = (label, name, value, extra = '') => `<label class="field ${extra.includes('full') ? 'full' : ''}"><span>${label}</span><input class="input" name="${name}" value="${esc(value)}" ${extra.replace('full', '')}></label>`;
  return `<form class="settings" id="settings-form">
    <section class="panel-card"><h2>Datos del negocio</h2><div class="form-grid">
      ${f('Nombre', 'nombre', st.nombre)}${f('Atiende', 'chef', st.chef)}
      ${f('WhatsApp de pedidos (con código de país)', 'whatsapp', st.whatsapp, 'inputmode="numeric"')}${f('WhatsApp como se muestra', 'whatsappDisplay', st.whatsappDisplay)}
      ${f('Instagram', 'instagram', st.instagram)}${f('Horario de atención', 'horario', st.horario)}
      ${f('Dirección del taller', 'direccion', st.direccion, 'full')}
      ${f('Días de anticipación para tortas y bocaditos', 'anticipacionDias', st.anticipacionDias, 'type="number" min="0" max="30"')}
    </div></section>
    <section class="panel-card"><h2>Campaña de temporada</h2><div class="form-grid">
      ${f('Nombre de la campaña', 'campanaNombre', st.campana.nombre)}
      ${f('Cierre de pedidos (opcional)', 'campanaCierre', st.campana.cierre, 'type="date"')}
      <label class="field full" style="grid-auto-flow:column;justify-content:start;align-items:center;gap:12px"><input type="checkbox" class="mini-switch" name="campanaActiva" ${st.campana.activa ? 'checked' : ''}><span style="font-size:.9rem;color:var(--ink)">Mostrar el catálogo de temporada en la web</span></label>
    </div></section>
    <div><button class="btn btn-lime" type="submit">Guardar cambios</button></div>
    <section class="panel-card danger-zone"><h2>Datos de demostración</h2>
      <p class="note" style="margin-bottom:14px">Vuelve al estado inicial de la maqueta: catálogo original y pedidos ficticios nuevos. Borra los pedidos de prueba hechos desde este navegador.</p>
      <button class="btn btn-ghost btn-sm" type="button" id="reset-demo">Restablecer la maqueta</button></section>
  </form>`;
}

const RENDER = { resumen: vResumen, pedidos: vPedidos, produccion: vProduccion, productos: vProductos, sabores: vSabores, clientes: vClientes, ajustes: vAjustes };

/* ---------- Detalle de pedido ---------- */

function closeOverlays() {
  $('#drawer').classList.remove('is-open');
  $('#modal').classList.remove('is-open');
  $('#scrim').classList.remove('is-open');
  $('#side').classList.remove('is-open');
  preview?.dispose(); preview = null;
}

async function openOrder(id) {
  const s = getState();
  const o = s.orders.find((x) => x.id === id);
  if (!o) return;
  const flow = ['nuevo', 'confirmado', 'produccion', 'listo', 'entregado'];
  const idx = flow.indexOf(o.estado);
  const saldo = o.total - (o.abono || 0);
  const custom = o.items.find((it) => it.config);
  $('#drawer').innerHTML = `
    <div class="drawer-head"><div><p class="eyebrow">Pedido ${o.id}</p><h2 class="serif">${esc(o.cliente.nombre)}</h2></div>
      <button class="icon-btn" data-close aria-label="Cerrar">${ICON.close}</button></div>
    <div class="drawer-body"><div class="detail">
      <div><h3>Estado</h3>
        <div class="stepper">${flow.map((e, i) => `<button data-estado="${e}" data-id="${o.id}" class="${i < idx ? 'done' : ''} ${i === idx ? 'now' : ''}">${estadoNombre(e)}</button>`).join('')}</div>
        ${o.estado === 'cancelado' ? `<p style="margin-top:10px">${badge('cancelado')}</p>` : ''}</div>
      <div><h3>Productos</h3><div style="display:grid;gap:10px">${o.items.map((it) => `
        <div class="item"><div class="item-head"><span>${it.qty} × ${esc(it.nombre)}${it.variante ? ` <small style="font-weight:400;color:var(--muted)">(${esc(it.variante)})</small>` : ''}</span><span>${money(it.precio * it.qty)}</span></div>
          ${it.detalle?.length ? `<ul>${it.detalle.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}
          ${it === custom ? '<div class="preview3d"><canvas id="order-canvas" aria-label="Vista 3D del diseño del cliente"></canvas></div>' : ''}</div>`).join('')}</div></div>
      <div><h3>Entrega</h3><dl class="kv">
        <dt>Fecha</dt><dd>${fmtDate(o.entrega, { weekday: 'long', day: 'numeric', month: 'long' })} · ${o.hora}</dd>
        <dt>Modalidad</dt><dd>${o.modalidad === 'domicilio' ? 'A domicilio · ' + esc(o.direccion) : 'Retiro en el taller'}</dd>
        <dt>WhatsApp</dt><dd>${esc(o.cliente.telefono)}</dd>
        <dt>Pedido el</dt><dd>${fmtDate(o.fecha, { day: 'numeric', month: 'long' })}</dd>
        ${o.notas ? `<dt>Notas</dt><dd>${esc(o.notas)}</dd>` : ''}</dl></div>
      <div><h3>Pago</h3><div class="totals">
        <div><span>Total</span><strong>${money(o.total)}</strong></div>
        <div><label for="abono">Abono recibido</label><input class="input price-input" id="abono" type="number" min="0" step="0.5" value="${o.abono || 0}" data-abono="${o.id}"></div>
        <div><span>Saldo</span><b style="color:${saldo > 0 ? 'var(--danger)' : '#1c7c43'}">${money(Math.max(0, saldo))}</b></div></div></div>
    </div></div>
    <div class="drawer-foot" style="grid-template-columns:1fr 1fr">
      <a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="${whatsappLink(`Hola ${o.cliente.nombre.split(' ')[0]}, te escribimos de Blue Lemon Bakery por tu pedido ${o.id} 🍋`, '593' + o.cliente.telefono.replace(/\D/g, '').replace(/^0/, ''))}">${ICON.wa} Escribir al cliente</a>
      ${o.estado === 'cancelado' || o.estado === 'entregado' ? '<button class="btn btn-soft btn-sm" data-close>Cerrar</button>' : `<button class="btn btn-ghost btn-sm" data-estado="cancelado" data-id="${o.id}">Cancelar pedido</button>`}
    </div>`;
  $('#drawer').classList.add('is-open');
  $('#scrim').classList.add('is-open');
  preview?.dispose(); preview = null;
  if (custom) {
    // La vista 3D del diseño se carga solo cuando hace falta.
    const { createStage, webglAvailable, fontsReady } = await import('./cake3d.js');
    const canvas = $('#order-canvas');
    if (!canvas || !webglAvailable()) { canvas?.parentElement.remove(); return; }
    await fontsReady();
    preview = createStage(canvas, { controls: true, autoRotate: true });
    preview.setSpec(toSpec(custom.config, s), { fit: true });
    new ResizeObserver(() => preview?.fit()).observe(canvas);
  }
}

function editProduct(id) {
  const p = getState().products.find((x) => x.id === id);
  $('#modal-card').innerHTML = `
    <div class="modal-head"><div><p class="eyebrow">Editar producto</p><h2 class="serif">${esc(p.nombre)}</h2></div><button class="icon-btn" data-close aria-label="Cerrar">${ICON.close}</button></div>
    <form id="product-form" data-id="${p.id}" class="form-grid">
      <label class="field full"><span>Nombre</span><input class="input" name="nombre" value="${esc(p.nombre)}" required></label>
      <label class="field full"><span>Descripción</span><textarea class="textarea" name="desc">${esc(p.desc)}</textarea></label>
      <label class="field"><span>Categoría</span><select class="select" name="cat">${CATEGORIES.map((c) => `<option value="${c.id}" ${c.id === p.cat ? 'selected' : ''}>${c.nombre}</option>`).join('')}</select></label>
      <div class="full" style="display:flex;justify-content:flex-end;gap:10px"><button type="button" class="btn btn-ghost btn-sm" data-close>Cancelar</button><button class="btn btn-lime btn-sm" type="submit">Guardar</button></div>
    </form>`;
  $('#modal').classList.add('is-open');
  $('#scrim').classList.add('is-open');
}

/* ---------- Render y navegación ---------- */

const currentView = () => (RENDER[location.hash.slice(1)] ? location.hash.slice(1) : 'resumen');

function render() {
  const s = getState(), id = currentView(), meta = VIEWS.find((v) => v.id === id);
  const nuevos = s.orders.filter((o) => o.estado === 'nuevo').length;
  $('#side-nav').innerHTML = VIEWS.map((v) => `<a href="#${v.id}" ${v.id === id ? 'aria-current="page"' : ''}>${v.icon}${v.nombre}${v.id === 'pedidos' && nuevos ? `<span class="count">${nuevos}</span>` : ''}</a>`).join('');
  $('#view-title').textContent = meta.nombre;
  $('#view-sub').textContent = meta.sub;
  const keep = document.activeElement?.id === 'search' ? document.activeElement.selectionStart : null;
  $('#view').innerHTML = RENDER[id](s);
  if (keep !== null) { const el = $('#search'); el.focus(); el.setSelectionRange(keep, keep); }
}

window.addEventListener('hashchange', () => { closeOverlays(); render(); window.scrollTo(0, 0); });
onChange(() => { if (!$('#drawer').classList.contains('is-open') && !$('#modal').classList.contains('is-open')) render(); });

document.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]') || e.target.id === 'scrim') { closeOverlays(); return; }
  if (e.target.closest('#side-toggle')) { $('#side').classList.add('is-open'); $('#scrim').classList.add('is-open'); return; }
  const f = e.target.closest('[data-filtro]');
  if (f) { filtro = f.dataset.filtro; render(); return; }
  const est = e.target.closest('[data-estado]');
  if (est) {
    const o = getState().orders.find((x) => x.id === est.dataset.id);
    o.estado = est.dataset.estado;
    if (o.estado === 'entregado') o.abono = o.total;
    save();
    toast(`${o.id}: ${estadoNombre(o.estado)}`);
    render();
    openOrder(o.id);
    return;
  }
  const ed = e.target.closest('[data-edit]');
  if (ed) { editProduct(ed.dataset.edit); return; }
  if (e.target.closest('#reset-demo')) { resetDemo(); toast('Maqueta restablecida'); render(); return; }
  const row = e.target.closest('[data-order]');
  if (row) openOrder(row.dataset.order);
});

document.addEventListener('input', (e) => {
  if (e.target.id === 'search') { busqueda = e.target.value; render(); }
});

document.addEventListener('change', (e) => {
  const s = getState(), t = e.target;
  if (t.dataset.price) {
    const p = s.products.find((x) => x.id === t.dataset.price), v = Math.max(0, Number(t.value) || 0);
    if (t.dataset.variant !== undefined) p.variantes[Number(t.dataset.variant)].precio = v; else p.precio = v;
    save(); toast(`Precio actualizado: ${p.nombre}`);
  } else if (t.dataset.active) {
    const p = s.products.find((x) => x.id === t.dataset.active);
    p.activo = t.checked; save(); toast(`${p.nombre}: ${p.activo ? 'visible' : 'oculto'} en la web`);
  } else if (t.dataset.flavor) {
    const fl = s[t.dataset.flavor].find((x) => x.id === t.dataset.id);
    fl.activo = t.checked; save(); toast(`${fl.nombre}: ${fl.activo ? 'disponible' : 'agotado'}`);
  } else if (t.dataset.size) {
    const z = s.sizes.find((x) => x.id === t.dataset.size);
    z.precio = Math.max(0, Number(t.value) || 0); save(); toast('Precio base actualizado');
  } else if (t.dataset.abono) {
    const o = s.orders.find((x) => x.id === t.dataset.abono);
    o.abono = Math.min(o.total, Math.max(0, Number(t.value) || 0));
    save(); render(); openOrder(o.id);
  }
});

document.addEventListener('submit', (e) => {
  e.preventDefault();
  const s = getState();
  if (e.target.id === 'login-form') {
    try { sessionStorage.setItem('bluelemon.admin', '1'); } catch { /* sin almacenamiento de sesión */ }
    $('#login').classList.add('is-hidden');
  } else if (e.target.id === 'settings-form') {
    const f = Object.fromEntries(new FormData(e.target));
    Object.assign(s.settings, {
      nombre: f.nombre.trim(), chef: f.chef.trim(), whatsapp: f.whatsapp.replace(/\D/g, ''), whatsappDisplay: f.whatsappDisplay.trim(),
      instagram: f.instagram.trim().replace(/^@/, ''), horario: f.horario.trim(), direccion: f.direccion.trim(),
      anticipacionDias: Math.max(0, parseInt(f.anticipacionDias, 10) || 0),
      campana: { nombre: f.campanaNombre.trim(), cierre: f.campanaCierre || '', activa: !!f.campanaActiva },
    });
    save(); toast('Ajustes guardados');
  } else if (e.target.id === 'product-form') {
    const p = s.products.find((x) => x.id === e.target.dataset.id);
    const f = Object.fromEntries(new FormData(e.target));
    Object.assign(p, { nombre: f.nombre.trim() || p.nombre, desc: f.desc.trim(), cat: f.cat });
    save(); closeOverlays(); render(); toast('Producto actualizado');
  }
});

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeOverlays(); });

let logged = false;
try { logged = sessionStorage.getItem('bluelemon.admin') === '1'; } catch { /* sin almacenamiento de sesión */ }
if (logged) $('#login').classList.add('is-hidden');
render();
