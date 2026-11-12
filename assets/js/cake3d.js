// Motor 3D de Blue Lemon Bakery.
// Construye tortas, lunch cakes, tiramisús y Cans a partir de una especificación,
// y expone la animación de armado que usa el scroll de la portada.
// Todas las medidas están en centímetros; el grupo raíz se escala a 0.1.

import * as THREE from 'three';
import { OrbitControls } from '../../vendor/three/OrbitControls.js';
import { RoomEnvironment } from '../../vendor/three/RoomEnvironment.js';

const TAU = Math.PI * 2;
const V2 = THREE.Vector2;
const CUT = Math.PI * 0.44; // ángulo de la porción retirada en la vista de corte
const FROST_T = 0.4; // grosor de la cobertura
const SCRIPT_FONT = '"Dancing Script", cursive';

const stages = new Set();
const invalidateAll = () => stages.forEach((s) => s.invalidate());

function rngFrom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- Texturas ---------- */

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const texCache = new Map();
function cached(key, make) {
  if (!texCache.has(key)) { const t = make(); t.userData.shared = true; texCache.set(key, t); }
  return texCache.get(key);
}

// Miga de bizcocho: color base con poros. Con color2 dibuja vetas (marmoleado).
function crumbTex(color, color2) {
  return cached(`crumb|${color}|${color2 || ''}`, () => {
    const t = canvasTex(256, 256, (g, w, h) => {
      const r = rngFrom(11);
      g.fillStyle = color; g.fillRect(0, 0, w, h);
      if (color2) {
        g.strokeStyle = color2; g.lineCap = 'round';
        for (let i = 0; i < 7; i++) {
          g.lineWidth = 12 + r() * 26;
          g.beginPath();
          const y = r() * h;
          g.moveTo(-20, y);
          g.bezierCurveTo(w * 0.3, y + (r() - 0.5) * 160, w * 0.6, y + (r() - 0.5) * 160, w + 20, y + (r() - 0.5) * 60);
          g.stroke();
        }
      }
      for (let i = 0; i < 1500; i++) {
        g.fillStyle = r() < 0.55 ? 'rgba(0,0,0,.11)' : 'rgba(255,255,255,.16)';
        g.beginPath(); g.arc(r() * w, r() * h, 0.5 + r() * 1.7, 0, TAU); g.fill();
      }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  });
}

function cocoaTex() {
  return cached('cocoa', () => {
    const t = canvasTex(256, 256, (g, w, h) => {
      const r = rngFrom(5);
      g.fillStyle = '#5a3421'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 5200; i++) {
        g.fillStyle = r() < 0.5 ? 'rgba(30,14,6,.35)' : 'rgba(140,90,60,.3)';
        g.fillRect(r() * w, r() * h, 1.4, 1.4);
      }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  });
}

function wrapLines(g, text, maxW) {
  const words = text.trim().split(/\s+/);
  const lines = [];
  let line = '';
  words.forEach((w) => {
    const next = line ? line + ' ' + w : w;
    if (line && g.measureText(next).width > maxW) { lines.push(line); line = w; } else line = next;
  });
  if (line) lines.push(line);
  return lines;
}

function messageTex(text, color) {
  return canvasTex(512, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
    let size = 120, lines;
    do {
      g.font = `700 ${size}px ${SCRIPT_FONT}`;
      lines = wrapLines(g, text, w * 0.8);
      size -= 8;
    } while ((lines.length > 3 || lines.some((l) => g.measureText(l).width > w * 0.84)) && size > 30);
    const lh = (size + 8) * 1.05;
    lines.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * lh));
  });
}

function drawPolaroid(g, w, h, img, caption) {
  g.fillStyle = '#fffdf8'; g.fillRect(0, 0, w, h);
  const m = 18, pw = w - m * 2, ph = h * 0.72;
  if (img) {
    const s = Math.max(pw / img.width, ph / img.height);
    const sw = pw / s, sh = ph / s;
    g.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, m, m, pw, ph);
  } else {
    const grad = g.createLinearGradient(0, m, 0, m + ph);
    grad.addColorStop(0, '#86cbd3'); grad.addColorStop(1, '#177599');
    g.fillStyle = grad; g.fillRect(m, m, pw, ph);
    g.fillStyle = 'rgba(255,255,255,.9)';
    const cx = w / 2, cy = m + ph / 2, s = 30;
    g.beginPath();
    g.moveTo(cx, cy + s * 0.9);
    g.bezierCurveTo(cx - s * 1.6, cy - s * 0.2, cx - s * 0.7, cy - s * 1.3, cx, cy - s * 0.4);
    g.bezierCurveTo(cx + s * 0.7, cy - s * 1.3, cx + s * 1.6, cy - s * 0.2, cx, cy + s * 0.9);
    g.fill();
  }
  if (caption) {
    g.fillStyle = '#3a2014'; g.textAlign = 'center'; g.textBaseline = 'middle';
    let size = 40;
    do { g.font = `700 ${size}px ${SCRIPT_FONT}`; size -= 3; } while (g.measureText(caption).width > w - 30 && size > 14);
    g.fillText(caption, w / 2, m + ph + (h - m - ph) / 2);
  }
}

function polaroidTex(photo, caption) {
  const tex = canvasTex(256, 304, (g, w, h) => drawPolaroid(g, w, h, null, caption));
  if (photo) {
    const img = new Image();
    img.onload = () => {
      drawPolaroid(tex.image.getContext('2d'), 256, 304, img, caption);
      tex.needsUpdate = true;
      invalidateAll();
    };
    img.src = photo;
  }
  return tex;
}

function canLabelTex(nombre) {
  return canvasTex(512, 420, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#177599';
    g.beginPath();
    g.moveTo(40, h - 20); g.lineTo(40, 210);
    g.bezierCurveTo(40, 60, w - 40, 60, w - 40, 210);
    g.lineTo(w - 40, h - 20); g.closePath(); g.fill();
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '86px "Marcellus SC", serif';
    g.fillText('BLUE', w / 2, 178);
    g.fillText('LEMON', w / 2, 258);
    g.fillStyle = '#caff8a';
    g.font = '600 26px Poppins, sans-serif';
    g.fillText('C  A  N  S', w / 2, 316);
    g.fillStyle = '#fff';
    let size = 34;
    do { g.font = `700 ${size}px ${SCRIPT_FONT}`; size -= 2; } while (g.measureText(nombre).width > w - 130 && size > 16);
    g.fillText(nombre, w / 2, 364);
  });
}

/* ---------- Materiales y geometrías ---------- */

const std = (color, roughness = 0.8, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, ...extra });
const spongeMat = (sp) => new THREE.MeshStandardMaterial({ map: crumbTex(sp.color, sp.color2), roughness: 0.96, side: THREE.DoubleSide });

function scaleUV(geo, su, sv) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  return geo;
}

function mesh(geo, mat, shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = shadow; m.receiveShadow = true;
  return m;
}

// "Beso" de manga pastelera: gota con estrías en espiral.
const kissCache = new Map();
function kissGeo(r, h, ridges = 7, twist = 1.6) {
  const key = [r, h, ridges, twist].join('|');
  if (kissCache.has(key)) return kissCache.get(key);
  const pts = [[1, 0], [1.02, 0.12], [0.92, 0.32], [0.7, 0.55], [0.42, 0.76], [0.16, 0.93], [0.001, 1]].map(([x, y]) => new V2(x * r, y * h));
  const geo = new THREE.LatheGeometry(pts, 28);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 + 0.15 * Math.sin(ridges * Math.atan2(x, z) + (twist * y) / h * 2);
    p.setXYZ(i, x * k, y, z * k);
  }
  geo.computeVertexNormals();
  geo.userData.shared = true;
  kissCache.set(key, geo);
  return geo;
}

// Malla instanciada que recuerda la matriz base de cada pieza para poder animarla.
function instanced(geo, mat, items) {
  const im = new THREE.InstancedMesh(geo, mat, items.length);
  const d = new THREE.Object3D();
  const col = new THREE.Color();
  im.userData.base = items.map((it, i) => {
    d.position.set(it.x || 0, it.y || 0, it.z || 0);
    d.rotation.set(it.rx || 0, it.ry || 0, it.rz || 0);
    if (Array.isArray(it.s)) d.scale.set(...it.s); else d.scale.setScalar(it.s ?? 1);
    d.updateMatrix();
    im.setMatrixAt(i, d.matrix);
    if (it.color) im.setColorAt(i, col.set(it.color));
    return d.matrix.clone();
  });
  im.castShadow = true; im.receiveShadow = true;
  im.instanceMatrix.needsUpdate = true;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  return im;
}

const inWedge = (x, z, margin = 0) => Math.abs(Math.atan2(x, z)) < CUT / 2 + margin;

/* ---------- Torta ---------- */

function frostingProfile(R, H, style) {
  const b = 0.45;
  const pts = [new V2(0.001, 0), new V2(R, 0)];
  const n = 36;
  for (let i = 1; i <= n; i++) {
    const y = ((H - b) * i) / n;
    const wave = style === 'peinado' ? 0.11 * Math.sin((y * TAU) / 1.15) : 0;
    pts.push(new V2(R + wave, y));
  }
  for (let a = 1; a <= 6; a++) {
    const ang = (a / 6) * (Math.PI / 2);
    pts.push(new V2(R - b + b * Math.cos(ang), H - b + b * Math.sin(ang)));
  }
  pts.push(new V2(0.001, H));
  return pts;
}

// Cara plana en el plano radial de ángulo theta, desplazada hacia el hueco del corte.
function radialFace(geo, mat, theta, side, push) {
  const m = mesh(geo, mat, false);
  m.rotation.y = theta - Math.PI / 2;
  m.position.set(side * Math.cos(theta) * push, 0, -side * Math.sin(theta) * push);
  return m;
}

function buildTier(g, parts, spec, tier, y0, cut) {
  const R = tier.d / 2, H = tier.h, Rin = R - FROST_T, Hin = H - FROST_T;
  const phi0 = cut ? CUT / 2 : 0, phiL = cut ? TAU - CUT : TAU;
  const faces = cut ? [[CUT / 2, -1], [TAU - CUT / 2, 1]] : [];
  const nF = spec.fillings.length, nS = nF + 1;
  const f = Math.min(0.9, Hin * 0.085), s = (Hin - nF * f) / nS;
  const sMat = spongeMat(spec.sponge);

  let y = 0;
  const layers = [];
  for (let i = 0; i < nS; i++) {
    layers.push({ y, h: s, mat: sMat, sponge: true }); y += s;
    if (i < nF) { layers.push({ y, h: f, mat: std(spec.fillings[i], 0.55, { side: THREE.DoubleSide }), sponge: false }); y += f; }
  }
  layers.forEach((L) => {
    const grp = new THREE.Group();
    grp.position.y = y0;
    const r = L.sponge ? Rin : Rin + 0.02;
    const cyl = mesh(scaleUV(new THREE.CylinderGeometry(r, r, L.h, 64, 1, false, phi0, phiL), (TAU * r) / 6, L.h / 6), L.mat);
    cyl.position.y = L.y + L.h / 2;
    grp.add(cyl);
    faces.forEach(([theta, side]) => {
      const pg = new THREE.PlaneGeometry(r, L.h);
      pg.translate(r / 2, L.y + L.h / 2, 0);
      scaleUV(pg, r / 6, L.h / 6);
      grp.add(radialFace(pg, L.mat, theta, side, 0.03));
    });
    g.add(grp);
    parts.push({ o: grp, kind: 'layer' });
  });

  // Cobertura
  const fr = spec.frosting;
  const frost = new THREE.Group();
  frost.position.y = y0;
  const lathe = new THREE.LatheGeometry(frostingProfile(R, H, fr.style), 80, phi0, phiL);
  let fMat;
  if (fr.style === 'degrade') {
    const top = new THREE.Color(fr.color), bottom = new THREE.Color(fr.color2 || '#86cbd3');
    const pos = lathe.attributes.position, colors = new Float32Array(pos.count * 3), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const k = THREE.MathUtils.smoothstep(pos.getY(i) / H, 0.05, 0.8);
      c.copy(bottom).lerp(top, k);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    lathe.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    fMat = std('#ffffff', 0.72, { vertexColors: true });
  } else {
    fMat = std(fr.color, 0.72);
  }
  frost.add(mesh(lathe, fMat));
  if (cut) {
    const shape = new THREE.Shape(frostingProfile(R, H, 'liso'));
    const faceMat = std(fr.color, 0.75, { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    faces.forEach(([theta, side]) => frost.add(radialFace(new THREE.ShapeGeometry(shape), faceMat, theta, side, 0)));
  }

  if (fr.style === 'drip') {
    const dripMat = std(fr.color2 || '#5b3421', 0.2);
    const b = 0.45, o = 0.07;
    const cap = [];
    for (let a = 0; a <= 6; a++) {
      const ang = (a / 6) * (Math.PI / 2);
      cap.push(new V2(R - b + (b + o) * Math.cos(ang), H - b + (b + o) * Math.sin(ang)));
    }
    cap.unshift(new V2(R + o, H - 1.1));
    cap.push(new V2(0.001, H + o));
    frost.add(mesh(new THREE.LatheGeometry(cap, 80, phi0, phiL), dripMat));
    const r = rngFrom(Math.round(R * 100 + H));
    const n = Math.floor((TAU * R) / 1.25);
    const drips = [];
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * TAU + (r() - 0.5) * 0.1;
      const x = Math.sin(ang) * (R + 0.02), z = Math.cos(ang) * (R + 0.02);
      const len = Math.min(H * 0.6, 1 + r() * r() * H * 0.5);
      if (cut && inWedge(x, z, 0.05)) continue;
      drips.push({ x, z, y: H - 0.8 - len / 2, ry: ang, s: [1, len, 0.55] });
    }
    frost.add(instanced(new THREE.CapsuleGeometry(0.3, 1, 4, 10), dripMat, drips));
  }

  if (spec.cocoaTop) {
    const cocoa = mesh(scaleUV(new THREE.CylinderGeometry(R - 0.45, R - 0.45, 0.08, 64, 1, false, phi0, phiL), 3, 3),
      new THREE.MeshStandardMaterial({ map: cocoaTex(), roughness: 1 }), false);
    cocoa.position.y = H + 0.02;
    frost.add(cocoa);
  }
  g.add(frost);
  parts.push({ o: frost, kind: 'frosting' });
}

function ringItems(n, radius, y, cut, fn = () => ({})) {
  const items = [];
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * TAU;
    const x = Math.sin(ang) * radius, z = Math.cos(ang) * radius;
    if (cut && inWedge(x, z, 0.02)) continue;
    items.push({ x, y, z, ry: ang, ...fn(i, ang) });
  }
  return items;
}

function addBorder(g, parts, spec, tiers, heights, cut) {
  const b = spec.border;
  if (!b || b.type === 'none') return;
  const top = tiers.length - 1;
  const small = tiers[top].d < 12;
  const colors = (i) => (b.color2 ? { color: i % 2 ? b.color2 : b.color } : {});
  if (b.type === 'perlas') {
    const r = small ? 0.33 : 0.42;
    const mat = std(b.color, 0.25, { metalness: 0.1 });
    const geo = new THREE.SphereGeometry(r, 16, 12);
    const add = (R, y) => {
      const im = instanced(geo, mat, ringItems(Math.floor((TAU * R) / (r * 2.15)), R, y, cut));
      g.add(im); parts.push({ o: im, kind: 'border' });
    };
    add(tiers[top].d / 2 - r - 0.25, heights[top] + r * 0.8);
    if (b.base) tiers.forEach((t, i) => add(t.d / 2 + r * 0.6, (heights[i - 1] || 0) + r * 0.9));
    return;
  }
  const r = small ? 0.72 : 0.95, h = r * 1.35;
  const geo = kissGeo(r, h);
  const mat = b.color2 ? std('#ffffff', 0.7) : std(b.color, 0.7);
  const add = (R, y, scale = 1) => {
    const n = Math.max(6, Math.floor((TAU * R) / (r * 1.75 * scale)));
    const items = ringItems(n, R, y, cut, (i) => ({ s: scale, ry: i * 0.9, ...colors(i) }));
    const im = instanced(geo, mat, items);
    g.add(im); parts.push({ o: im, kind: 'border' });
    return items;
  };
  const topItems = add(tiers[top].d / 2 - r - 0.15, heights[top] - 0.05);
  if (b.dust) {
    // Toque de cacao sobre cada rosetón (tiramisú).
    const im = instanced(new THREE.SphereGeometry(0.26, 8, 6), std('#5a3421', 1), topItems.map((it) => ({ x: it.x, z: it.z, y: it.y + h * 0.86, s: [1, 0.6, 1] })));
    g.add(im); parts.push({ o: im, kind: 'border' });
  }
  if (b.base) tiers.forEach((t, i) => add(t.d / 2 + r * 0.45, (heights[i - 1] || 0) - 0.02, 1.05));
}

// Reparte n puntos sobre la tapa evitando el hueco del corte, el centro reservado y solapes.
function scatter(n, R, r, { cut, keepOut, minDist = 0 }) {
  const pts = [];
  let guard = 0;
  while (pts.length < n && guard++ < n * 40) {
    const rad = Math.sqrt(r()) * R, ang = r() * TAU;
    const x = Math.sin(ang) * rad, z = Math.cos(ang) * rad;
    if (cut && inWedge(x, z, 0.1)) continue;
    if (keepOut && keepOut(x, z)) continue;
    if (minDist && pts.some((p) => (p.x - x) ** 2 + (p.z - z) ** 2 < minDist * minDist)) continue;
    pts.push({ x, z });
  }
  return pts;
}

function drizzle(R, y, color, angle, cut) {
  const pts = [];
  const steps = Math.max(5, Math.round(R / 0.75));
  for (let i = 0; i <= steps; i++) {
    const u = -R + (2 * R * i) / steps;
    const half = Math.sqrt(Math.max(0, R * R - u * u)) * 0.96;
    const v = (i % 2 ? 1 : -1) * half;
    const x = u * Math.cos(angle) - v * Math.sin(angle), z = u * Math.sin(angle) + v * Math.cos(angle);
    if (cut && inWedge(x, z, 0.12)) continue;
    pts.push(new THREE.Vector3(x, y, z));
  }
  if (pts.length < 2) return null;
  return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.2), pts.length * 10, 0.09, 6), std(color, 0.18), false);
}

function addToppings(g, parts, spec, R, y, cut, keepOut) {
  const list = spec.toppings || [];
  if (!list.length) return;
  const area = (R * R) / 40;
  const push = (o) => { if (!o) return; g.add(o); parts.push({ o, kind: 'topping' }); };
  const opts = { cut, keepOut };
  list.forEach((id, idx) => {
    const r = rngFrom(101 + idx * 17 + id.length);
    const rot = () => ({ ry: r() * TAU });
    switch (id) {
      case 'chispas':
        push(instanced(new THREE.ConeGeometry(0.2, 0.3, 8), std('#3a2014', 0.45),
          scatter(Math.round(30 * area) + 10, R, r, opts).map((p) => ({ ...p, y: y + 0.13, rx: (r() - 0.5) * 1.2, rz: (r() - 0.5) * 1.2 }))));
        break;
      case 'sprinkles': {
        const pal = ['#f28fb1', '#86cbd3', '#caff8a', '#f7e58b', '#ffffff', '#cdb7e8', '#f8a66b'];
        push(instanced(new THREE.CapsuleGeometry(0.07, 0.34, 3, 6), std('#ffffff', 0.4),
          scatter(Math.round(70 * area) + 20, R, r, opts).map((p) => ({ ...p, y: y + 0.07, rz: Math.PI / 2, ry: r() * TAU, color: pal[Math.floor(r() * pal.length)] }))));
        break;
      }
      case 'oreo': {
        const grp = new THREE.Group();
        const dark = std('#221f1e', 0.9), cream = std('#f7f1e6', 0.8);
        scatter(Math.max(3, Math.round(4 * area) + 2), R * 0.82, r, { ...opts, minDist: 2.2 }).forEach((p) => {
          const o = new THREE.Group();
          [-0.22, 0.22].forEach((dy) => { const c = mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.26, 24), dark); c.position.y = dy; o.add(c); });
          o.add(mesh(new THREE.CylinderGeometry(0.98, 0.98, 0.18, 24), cream));
          o.position.set(p.x, y + 0.75, p.z);
          o.rotation.set(Math.PI / 2 + (r() - 0.5) * 0.5, r() * TAU, (r() - 0.5) * 0.4);
          grp.add(o);
        });
        push(grp);
        break;
      }
      case 'nueces':
        push(instanced(new THREE.IcosahedronGeometry(0.42, 1), std('#8a5a34', 0.9, { flatShading: true }),
          scatter(Math.round(12 * area) + 5, R, r, { ...opts, minDist: 0.7 }).map((p) => ({ ...p, y: y + 0.26, ...rot(), rx: r() * 3, s: [1, 0.72, 0.82] }))));
        break;
      case 'almendras':
        push(instanced(new THREE.SphereGeometry(0.5, 12, 8), std('#e2c59a', 0.7),
          scatter(Math.round(16 * area) + 6, R, r, { ...opts, minDist: 0.6 }).map((p) => ({ ...p, y: y + 0.08, ...rot(), s: [1, 0.14, 0.58] }))));
        break;
      case 'mani':
        push(instanced(new THREE.SphereGeometry(0.24, 10, 8), std('#d9b77e', 0.75),
          scatter(Math.round(34 * area) + 10, R, r, opts).map((p) => ({ ...p, y: y + 0.16, ...rot(), s: [1.35, 0.85, 0.9] }))));
        break;
      case 'salty-caramel': push(drizzle(R, y + 0.07, '#c98a3a', 0.5, cut)); break;
      case 'toffee': push(drizzle(R, y + 0.1, '#6e4118', 0.5 + Math.PI / 2, cut)); break;
      case 'avellana': {
        const n = R < 6 ? 4 : 6;
        const items = ringItems(n, R * 0.55, y, cut, (i) => ({ ry: i }));
        push(instanced(kissGeo(0.85, 1.05, 8, 2.4), std('#6a4023', 0.5), items));
        break;
      }
      case 'frambuesa': {
        const shape = new THREE.Shape();
        const rr = R * 0.52, lobes = 9;
        for (let i = 0; i <= 64; i++) {
          const a = (i / 64) * TAU, k = rr * (1 + 0.09 * Math.sin(lobes * a) + 0.05 * Math.sin(4 * a + 1));
          if (i === 0) shape.moveTo(Math.cos(a) * k, Math.sin(a) * k); else shape.lineTo(Math.cos(a) * k, Math.sin(a) * k);
        }
        if (cut) break;
        const m = mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: true, bevelSize: 0.07, bevelThickness: 0.06, bevelSegments: 3 }), std('#c2183f', 0.08), false);
        m.rotation.x = -Math.PI / 2; m.position.y = y + 0.02;
        push(m);
        break;
      }
    }
  });
}

function addTopper(g, parts, spec, R, y) {
  const t = spec.topper || {};
  const push = (o) => { g.add(o); parts.push({ o, kind: 'topper' }); };
  if (t.type === 'polaroid') {
    const w = Math.min(5.2, R * 1.15), h = w * 1.19;
    const tex = polaroidTex(t.photo, spec.mensaje || '');
    const paper = std('#fffdf8', 0.9);
    const card = mesh(new THREE.BoxGeometry(w, h, 0.12), [paper, paper, paper, paper, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }), paper]);
    const holder = new THREE.Group();
    card.rotation.x = -Math.PI / 2 + 0.16;
    holder.rotation.y = -0.18;
    const onBorder = spec.border && spec.border.type !== 'none' && R < 6.5;
    holder.position.set(0, y + (onBorder ? 1.0 : 0.55), R * 0.02);
    holder.add(card);
    push(holder);
  } else if (t.type === 'velas') {
    const grp = new THREE.Group();
    const cols = ['#86cbd3', '#caff8a', '#f4b8c4', '#f7e58b', '#177599'];
    const n = R < 6 ? 3 : 5;
    for (let i = 0; i < n; i++) {
      const a = -0.9 + (1.8 * i) / (n - 1);
      const c = new THREE.Group();
      c.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 4.4, 12).translate(0, 2.2, 0), std(cols[i % cols.length], 0.5)));
      c.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6).translate(0, 4.6, 0), std('#3a2014', 1), false));
      const flame = mesh(new THREE.SphereGeometry(0.22, 12, 10), new THREE.MeshStandardMaterial({ color: '#ffd27a', emissive: '#ff9a2e', emissiveIntensity: 1.6, roughness: 0.4 }), false);
      flame.scale.set(1, 1.8, 1); flame.position.y = 5.05;
      c.add(flame);
      c.position.set(Math.sin(a) * R * 0.5, y, -Math.cos(a) * R * 0.5 + R * 0.12);
      grp.add(c);
    }
    push(grp);
  } else if (t.type === 'cerezas') {
    const grp = new THREE.Group();
    const n = R < 6 ? 2 : 3;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + 0.4, rad = n === 2 ? 0.9 : 1.15;
      const c = new THREE.Group();
      c.add(mesh(kissGeo(1.0, 0.8, 8, 1.2), std('#fbf2e0', 0.7)));
      const berry = mesh(new THREE.SphereGeometry(0.82, 24, 18), std('#b3122e', 0.12));
      berry.position.y = 1.2; c.add(berry);
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 1.9, 0), new THREE.Vector3(0.2, 3, 0.1), new THREE.Vector3(0.9, 3.6, 0.2));
      c.add(mesh(new THREE.TubeGeometry(curve, 12, 0.045, 6), std('#3d5a23', 0.7), false));
      c.position.set(Math.sin(a) * rad, y - 0.05, Math.cos(a) * rad - R * 0.1);
      c.rotation.y = a;
      grp.add(c);
    }
    push(grp);
  } else if (t.type === 'flores') {
    const grp = new THREE.Group();
    const r = rngFrom(77);
    const petal = new THREE.SphereGeometry(0.5, 12, 8);
    const cols = ['#ffffff', '#86cbd3', '#f4b8c4', '#ffffff', '#cdb7e8'];
    const n = R < 6 ? 3 : 6;
    for (let i = 0; i < n; i++) {
      const fl = new THREE.Group();
      const pm = std(cols[i % cols.length], 0.6);
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * TAU;
        const p = mesh(petal, pm);
        p.scale.set(0.95, 0.24, 0.6);
        p.position.set(Math.cos(a) * 0.5, 0.12, Math.sin(a) * 0.5);
        p.rotation.set(0, -a, 0.3);
        fl.add(p);
      }
      const center = mesh(new THREE.SphereGeometry(0.24, 10, 8), std('#f7d54a', 0.5)); center.position.y = 0.2; fl.add(center);
      const a = -0.5 + i * 0.42 + (r() - 0.5) * 0.15, rad = R * (0.5 + (i % 2) * 0.2);
      const sc = 0.85 + r() * 0.5;
      fl.scale.setScalar(sc);
      fl.position.set(-Math.cos(a) * rad, y + 0.1, Math.sin(a) * rad * 0.9);
      fl.rotation.set((r() - 0.5) * 0.4, r() * TAU, (r() - 0.5) * 0.4);
      grp.add(fl);
    }
    const leafM = std('#7fb069', 0.7);
    for (let i = 0; i < 3; i++) {
      const lf = mesh(petal, leafM);
      lf.scale.set(1.4, 0.12, 0.55);
      const a = -0.3 + i * 0.8;
      lf.position.set(-Math.cos(a) * R * 0.72, y + 0.08, Math.sin(a) * R * 0.6);
      lf.rotation.y = a + 0.6;
      grp.add(lf);
    }
    push(grp);
  }
}

function buildBox(R) {
  const g = new THREE.Group();
  const w = R * 2 + 3.4, hh = 4.2, t = 0.28;
  const mat = std('#fbfaf5', 0.92);
  const tray = (open) => {
    const tr = new THREE.Group();
    tr.add(mesh(new THREE.BoxGeometry(w, t, w).translate(0, t / 2, 0), mat));
    [[0, w / 2, 0], [0, -w / 2, 0], [w / 2, 0, 1], [-w / 2, 0, 1]].forEach(([x, z, turn]) => {
      const wall = mesh(new THREE.BoxGeometry(turn ? t : w, open, turn ? w : t), mat);
      wall.position.set(x - Math.sign(x) * t / 2, open / 2, z - Math.sign(z) * t / 2);
      tr.add(wall);
    });
    return tr;
  };
  g.add(tray(hh));
  const lid = tray(hh * 0.8);
  const hinge = new THREE.Group();
  hinge.position.set(0, hh, -w / 2);
  // Tapa: bandeja invertida articulada en el borde trasero, abierta hacia atrás.
  lid.position.set(0, hh * 0.8, w / 2);
  lid.rotation.x = Math.PI;
  hinge.add(lid);
  hinge.rotation.x = -1.92;
  g.add(hinge);
  return g;
}

function buildCupcake(sponge, color, color2) {
  const g = new THREE.Group();
  const liner = new THREE.LatheGeometry([new V2(0.001, 0), new V2(2.3, 0), new V2(3.1, 3.2)], 48);
  const p = liner.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const k = 1 + 0.035 * Math.sin(26 * Math.atan2(x, z));
    p.setXYZ(i, x * k, p.getY(i), z * k);
  }
  liner.computeVertexNormals();
  g.add(mesh(liner, std('#f3ede1', 0.9, { side: THREE.DoubleSide })));
  const dome = mesh(new THREE.SphereGeometry(3.05, 32, 16, 0, TAU, 0, Math.PI / 2), std(sponge, 0.95));
  dome.scale.y = 0.42; dome.position.y = 3.1;
  g.add(dome);
  const swirl = mesh(kissGeo(2.75, 3.3, 9, 5), std(color, 0.7));
  swirl.position.y = 3.6; g.add(swirl);
  const tip = mesh(new THREE.SphereGeometry(0.34, 12, 10), std(color2, 0.3, { metalness: 0.2 }));
  tip.position.y = 6.95; g.add(tip);
  return g;
}

function buildCakeGroup(spec) {
  const root = new THREE.Group();
  const parts = [];
  const cut = !!spec.cut;
  const R0 = spec.tiers[0].d / 2;
  let yBase = 0;

  if (spec.box === 'cajita') {
    const box = buildBox(R0);
    root.add(box); parts.push({ o: box, kind: 'board' });
    yBase = 0.3;
  } else {
    const board = new THREE.Group();
    board.add(mesh(new THREE.CylinderGeometry(R0 + 1.7, R0 + 1.7, 0.35, 72).translate(0, -0.175, 0), std('#fdfcf8', 0.6)));
    board.add(mesh(new THREE.CylinderGeometry(R0 + 1.72, R0 + 1.72, 0.12, 72).translate(0, -0.3, 0), std('#d8c9a8', 0.4, { metalness: 0.5 }), false));
    board.position.y = 0.35;
    root.add(board); parts.push({ o: board, kind: 'board' });
    yBase = 0.35;
  }

  const cake = new THREE.Group();
  cake.position.y = yBase;
  root.add(cake);
  const heights = [];
  let y = 0;
  spec.tiers.forEach((tier) => { buildTier(cake, parts, spec, tier, y, cut); y += tier.h; heights.push(y); });

  const top = spec.tiers[spec.tiers.length - 1];
  const R = top.d / 2;
  addBorder(cake, parts, spec, spec.tiers, heights, cut);

  const hasBorder = spec.border && spec.border.type !== 'none';
  const Rt = R - (hasBorder ? (R < 6 ? 1.75 : 2.3) : 0.7);
  const showDetail = !cut;
  const topper = spec.topper?.type || 'none';
  const hasText = showDetail && spec.mensaje && topper !== 'polaroid';
  const keepOut = (x, z) => {
    if (topper === 'polaroid') return Math.abs(x) < Math.min(5.2, R * 1.15) * 0.62 && Math.abs(z) < Math.min(5.2, R * 1.15) * 0.75;
    if (hasText) return Math.abs(z) < Rt * 0.42 && Math.abs(x) < Rt * 0.9;
    if (topper === 'cerezas') return Math.hypot(x, z + R * 0.1) < 2.3;
    return false;
  };
  addToppings(cake, parts, spec, Rt, y, cut, showDetail ? keepOut : null);

  if (hasText) {
    const dark = new THREE.Color(spec.frosting.color).getHSL({}).l < 0.55;
    const tex = messageTex(spec.mensaje, spec.mensajeColor || (dark ? '#fbf2e0' : '#4a2a17'));
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(Rt * 2, Rt * 2),
      new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = y + 0.12;
    plane.renderOrder = 2;
    cake.add(plane); parts.push({ o: plane, kind: 'topper' });
  }
  if (showDetail) addTopper(cake, parts, spec, R, y);

  if (spec.cupcakes) {
    const b = spec.border || {};
    const c1 = b.color && b.type !== 'none' ? b.color : '#86cbd3';
    for (let i = 0; i < spec.cupcakes; i++) {
      const cc = buildCupcake(spec.sponge.color, i % 2 ? b.color2 || '#5b3421' : c1, '#e8edf0');
      cc.position.set((i ? 1 : -1) * (R0 + 6.3), 0, 2.2 - i * 0.6);
      root.add(cc); parts.push({ o: cc, kind: 'extra' });
    }
  }
  return { root, parts };
}

/* ---------- Can ---------- */

function buildCan(spec) {
  const root = new THREE.Group();
  const parts = [];
  const R = 3.5, H = 8.6;
  const capas = spec.can.capas;
  const hL = 7.4 / capas.length;
  capas.forEach((c, i) => {
    const sponge = i % 3 === 0;
    const mat = sponge ? new THREE.MeshStandardMaterial({ map: crumbTex(c), roughness: 0.95 }) : std(c, 0.6);
    const m = mesh(scaleUV(new THREE.CylinderGeometry(R - 0.14, R - 0.14, hL, 48), 4, hL / 5), mat);
    m.position.y = 0.3 + hL * (i + 0.5);
    root.add(m); parts.push({ o: m, kind: 'layer' });
  });
  const glassPts = [new V2(0.001, 0), new V2(R - 0.5, 0), new V2(R, 0.45), new V2(R, 7.7), new V2(R - 0.28, 8.35), new V2(R - 0.28, H)];
  const glass = new THREE.Mesh(new THREE.LatheGeometry(glassPts, 64),
    new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.03, metalness: 0, transparent: true, opacity: 0.2, clearcoat: 1, clearcoatRoughness: 0.03, side: THREE.DoubleSide, depthWrite: false }));
  glass.renderOrder = 3;
  const jar = new THREE.Group();
  jar.add(glass);
  const metal = std('#e6eaec', 0.38, { metalness: 0.55 });
  jar.add(mesh(new THREE.CylinderGeometry(R - 0.2, R - 0.2, 0.32, 64).translate(0, H + 0.1, 0), metal));
  const ring = mesh(new THREE.TorusGeometry(0.8, 0.09, 8, 24), metal, false);
  ring.rotation.x = Math.PI / 2; ring.position.set(0.9, H + 0.3, 0);
  jar.add(ring);
  root.add(jar); parts.push({ o: jar, kind: 'frosting' });

  const label = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.03, R + 0.03, 5.4, 48, 1, true, -0.95, 1.9),
    new THREE.MeshStandardMaterial({ map: canLabelTex(spec.can.nombre), transparent: true, alphaTest: 0.5, roughness: 0.7 }));
  label.position.y = 3.6;
  label.renderOrder = 4;
  root.add(label); parts.push({ o: label, kind: 'topper' });
  return { root, parts };
}

/* ---------- API pública ---------- */

export function buildCake(spec) {
  const built = spec.kind === 'can' ? buildCan(spec) : buildCakeGroup(spec);
  built.root.scale.setScalar(0.1);
  built.parts.forEach((p) => { p.baseY = p.o.position.y; });
  return built;
}

// Piezas sueltas para escenas compuestas (portada): un cupcake o una nube de sprinkles flotando.
export function buildProp(kind, o = {}) {
  if (kind === 'cupcake') {
    const g = buildCupcake(o.sponge || '#f0d79b', o.color || '#86cbd3', o.color2 || '#e8edf0');
    g.scale.setScalar(0.1);
    return g;
  }
  if (kind === 'sprinkles') {
    const r = rngFrom(o.seed || 9);
    const pal = ['#f28fb1', '#86cbd3', '#caff8a', '#f7e58b', '#ffffff', '#cdb7e8', '#f8a66b'];
    const items = [];
    for (let i = 0; i < (o.count || 70); i++) {
      const a = r() * TAU, rad = (o.inner || 1.7) + r() * ((o.outer || 2.9) - (o.inner || 1.7));
      items.push({ x: Math.cos(a) * rad, y: (r() - 0.5) * (o.height || 2.8), z: Math.sin(a) * rad * 0.8, rx: r() * TAU, ry: r() * TAU, rz: r() * TAU, s: 0.7 + r() * 0.9, color: pal[Math.floor(r() * pal.length)] });
    }
    return instanced(new THREE.CapsuleGeometry(0.014, 0.07, 3, 6), std('#ffffff', 0.4), items);
  }
  return new THREE.Group();
}

export function disposeCake(root) {
  root.traverse((o) => {
    if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    mats.forEach((m) => {
      if (m.map && !m.map.userData.shared) m.map.dispose();
      m.dispose();
    });
  });
}

const clamp01 = (t) => Math.min(1, Math.max(0, t));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

const WINDOWS = { board: [0, 0.07], layer: [0.06, 0.46], frosting: [0.46, 0.62], border: [0.62, 0.77], topping: [0.76, 0.9], topper: [0.88, 1], extra: [0.9, 1] };
const _m = new THREE.Matrix4(), _s = new THREE.Matrix4(), _t = new THREE.Matrix4();

// p = 0 → nada sobre la mesa; p = 1 → producto terminado.
export function applyAssembly(parts, p) {
  const layers = parts.filter((k) => k.kind === 'layer');
  parts.forEach((part) => {
    const [a, b] = WINDOWS[part.kind];
    let t;
    if (part.kind === 'layer') {
      const span = (b - a) / layers.length;
      t = clamp01((p - (a + layers.indexOf(part) * span)) / (span * 1.5));
    } else t = clamp01((p - a) / (b - a));
    const o = part.o;
    o.visible = t > 0;
    if (!o.visible) return;
    if (o.isInstancedMesh) {
      const base = o.userData.base, n = base.length, drop = part.kind === 'topping' ? 9 : 0;
      for (let i = 0; i < n; i++) {
        const ti = clamp01(t * 1.7 - (0.7 * i) / n);
        _t.makeTranslation(0, (1 - easeOut(ti)) * drop, 0);
        const k = Math.max(0.0001, easeBack(ti));
        _s.makeScale(k, k, k);
        _m.copy(_t).multiply(base[i]).multiply(_s);
        o.setMatrixAt(i, _m);
      }
      o.instanceMatrix.needsUpdate = true;
    } else if (part.kind === 'frosting') {
      const e = easeOut(t);
      o.scale.set(1 + (1 - e) * 0.05, Math.max(0.001, e), 1 + (1 - e) * 0.05);
    } else if (part.kind === 'layer') {
      o.position.y = part.baseY + (1 - easeOut(t)) * 16;
    } else {
      const e = easeBack(t);
      o.scale.setScalar(Math.max(0.001, e));
      if (part.kind !== 'board') o.position.y = part.baseY + (1 - easeOut(t)) * 6;
    }
  });
}

export function createStage(canvas, { controls: useControls = true, autoRotate = false, onFrame = null } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.38;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xcfe6e8, 0.55));
  const key = new THREE.DirectionalLight(0xfff6ea, 1.75);
  key.position.set(3.5, 7, 4.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 20 });
  key.shadow.bias = -0.0006;
  key.shadow.radius = 5;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xe4f4f6, 0.4);
  fill.position.set(-5, 3, -2);
  scene.add(fill);

  const ground = new THREE.Mesh(new THREE.CircleGeometry(9, 48), new THREE.ShadowMaterial({ opacity: 0.16 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const pivot = new THREE.Group();
  scene.add(pivot);

  let current = null, dirty = true, visible = true, raf = 0, disposed = false;
  let controls = null;
  if (useControls) {
    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.minPolarAngle = 0.15;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.4;
    controls.addEventListener('change', () => { dirty = true; });
  }

  const stage = {
    renderer, scene, camera, controls, pivot, ground,
    get cake() { return current; },
    invalidate() { dirty = true; },
    setSpec(spec, { fit = false } = {}) {
      if (current) { pivot.remove(current.root); disposeCake(current.root); }
      current = buildCake(spec);
      pivot.add(current.root);
      if (fit) stage.fit();
      dirty = true;
      return current;
    },
    // Encuadra la cámara proyectando el contorno del producto y corrigiendo distancia y altura
    // hasta que ocupa la fracción deseada de la vista (sirve igual para un Can que para una torta de pisos).
    fit(zoom = stage.zoom || 1) {
      if (!current) return;
      stage.zoom = zoom;
      current.root.updateWorldMatrix(true, true);
      const box = new THREE.Box3().setFromObject(current.root);
      const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
      const pts = [];
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * TAU;
        [box.min.y, box.max.y].forEach((y) => pts.push(new THREE.Vector3(c.x + (Math.cos(a) * size.x) / 2, y, c.z + (Math.sin(a) * size.z) / 2)));
      }
      const half = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
      const dir = new THREE.Vector3(0.5, 0.52, 1).normalize();
      const target = new THREE.Vector3(0, c.y, 0);
      const v = new THREE.Vector3();
      let dist = size.length() * 2.2;
      for (let k = 0; k < 7; k++) {
        camera.position.copy(target).addScaledVector(dir, dist);
        camera.lookAt(target);
        camera.updateMatrixWorld();
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        pts.forEach((p) => {
          v.copy(p).project(camera);
          minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x); minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y);
        });
        dist *= Math.max((maxX - minX) / 2 / (0.8 * zoom), (maxY - minY) / 2 / (0.7 * zoom));
        target.y += ((maxY + minY) / 2 - (stage.centerY ?? 0.03)) * dist * half * 0.9;
      }
      camera.position.copy(target).addScaledVector(dir, dist);
      camera.lookAt(target);
      stage.target = target;
      if (controls) {
        controls.target.copy(target);
        controls.minDistance = dist * 0.55;
        controls.maxDistance = dist * 1.9;
        controls.update();
      }
      dirty = true;
    },
    resize() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      dirty = true;
    },
    snapshot() {
      renderer.render(scene, camera);
      return canvas.toDataURL('image/png');
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      stages.delete(stage);
      if (current) disposeCake(current.root);
      controls?.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };

  const ro = new ResizeObserver(() => stage.resize());
  ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '100px' });
  io.observe(canvas);

  const loop = (time) => {
    if (disposed) return;
    raf = requestAnimationFrame(loop);
    if (!visible) return;
    if (onFrame && onFrame(time) === true) dirty = true;
    if (controls) controls.update();
    if (dirty || (controls && controls.autoRotate)) {
      dirty = false;
      renderer.render(scene, camera);
    }
  };
  stage.resize();
  raf = requestAnimationFrame(loop);
  stages.add(stage);
  // Las texturas con texto dependen de las fuentes web: se redibuja cuando terminan de cargar.
  document.fonts?.ready.then(() => { stage.onFonts?.(); });
  return stage;
}

export const fontsReady = () =>
  Promise.all([document.fonts.load(`700 40px ${SCRIPT_FONT}`), document.fonts.load('40px "Marcellus SC"'), document.fonts.load('600 26px Poppins')]).catch(() => {});

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}
