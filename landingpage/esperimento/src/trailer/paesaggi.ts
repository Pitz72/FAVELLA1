// ====================================================================
//  Le scene del trailer, disegnate su canvas in coordinate di progetto
//  1920×1080. Ogni funzione è pura rispetto al tempo globale t: si può
//  saltare, mettere in pausa o riavviare senza stati nascosti.
//  Le parti costose (crepe, mappa, sassi, venature) si calcolano una volta
//  sola in tele fuori schermo (`Cache`).
// ====================================================================
import {
  W, H, BANDA, CAMMINATE, faseDiPasso, LETTERE, BIGLIETTO,
  TAPPE_T0, TAPPE_PASSO, REGOLA_DUR, type IdScena,
} from "./scaletta";
import { clamp, lerp, seg, easeInOut, easeOut, expoOut, rng, crinale, mix, rgba } from "./tempo";
import { disegnaViandante, disegnaOmbra } from "./viandante";

type C2D = CanvasRenderingContext2D;

export const ZONE = [
  { n: "Acquaviva", s: "il capolinea", a: "#7fc8bd" },
  { n: "La piana", s: "il sole non perdona", a: "#e6a85a" },
  { n: "L'invaso morto", s: "acqua ovunque, niente da bere", a: "#a9dbe4" },
  { n: "La statale", s: "chi tiene la strada", a: "#f2ad45" },
  { n: "Il paese", s: "il posto dove restare", a: "#ec7d54" },
  { n: "Le colline", s: "l'ultima salita", a: "#9aa6e0" },
  { n: "Il guado", s: "chi ti aspetta", a: "#df5f78" },
];

export const FONT = {
  serif: "'Lora', Georgia, serif",
  display: "'Sora', 'Inter', sans-serif",
  mono: "'Source Code Pro', ui-monospace, monospace",
};

// --------------------------------------------------------------------
//  Cache delle tele fuori schermo
// --------------------------------------------------------------------
export interface Cache {
  crepe?: HTMLCanvasElement;
  sale?: HTMLCanvasElement;
  mappa?: HTMLCanvasElement;
  venature?: HTMLCanvasElement;
  sassi?: HTMLCanvasElement;
  rotta?: { pts: { x: number; y: number }[]; cum: number[]; nodi: number[] };
  scarabocchi?: Path2D[][];
}

const tela = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return c;
};

/** Rete di crepe su una tessera ripetibile in orizzontale. */
function faiCrepe(seme: number, w: number, h: number, colore: string, luce: string, spessore: number) {
  const c = tela(w, h), g = c.getContext("2d")!;
  const r = rng(seme);
  // punti di una griglia sfalsata → celle poligonali (Voronoi approssimato)
  const passo = 150, pts: { x: number; y: number }[] = [];
  for (let y = -passo; y < h + passo; y += passo * 0.8)
    for (let x = -passo; x < w + passo; x += passo)
      pts.push({ x: x + (r() - 0.5) * passo * 0.9, y: y + (r() - 0.5) * passo * 0.7 });
  const linea = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    // una crepa vera non è dritta: la spezziamo in tratti con piccoli scarti
    const n = 7;
    g.beginPath(); g.moveTo(a.x, a.y);
    for (let i = 1; i <= n; i++) {
      const k = i / n;
      const j = i === n ? 0 : (r() - 0.5) * 12;
      g.lineTo(lerp(a.x, b.x, k) + j, lerp(a.y, b.y, k) + j * 0.6);
    }
    g.stroke();
  };
  for (const pass of [{ col: luce, off: 2, lw: spessore * 0.6 }, { col: colore, off: 0, lw: spessore }]) {
    g.strokeStyle = pass.col; g.lineWidth = pass.lw; g.lineCap = "round";
    g.save(); g.translate(0, pass.off);
    const r2 = rng(seme + 1);
    for (const p of pts) {
      // collega ogni punto ai due vicini più prossimi (grafo sparso = crepe)
      const vicini = pts.filter((q) => q !== p).map((q) => ({ q, d: (q.x - p.x) ** 2 + (q.y - p.y) ** 2 }))
        .sort((a, b) => a.d - b.d).slice(0, 3);
      for (const v of vicini) if (r2() < 0.72 && p.x < v.q.x + 1) linea(p, v.q);
    }
    g.restore();
  }
  // saldatura dei bordi: copia la metà sinistra a destra, sfumata (ripetibilità)
  return c;
}

/** Rumore di valore 2D (per le isoipse della mappa). */
function rumore2D(seme: number) {
  const r = rng(seme), N = 64;
  const v = Array.from({ length: N * N }, r);
  const at = (i: number, j: number) => v[((j % N + N) % N) * N + ((i % N + N) % N)];
  return (x: number, y: number) => {
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = lerp(at(i, j), at(i + 1, j), sx), b = lerp(at(i, j + 1), at(i + 1, j + 1), sx);
    return lerp(a, b, sy);
  };
}

const MAPPA_W = 3600;
const NODI_MAPPA = [
  { x: 3260, y: 560 }, { x: 2810, y: 650 }, { x: 2360, y: 505 }, { x: 1900, y: 615 },
  { x: 1450, y: 500 }, { x: 990, y: 600 }, { x: 590, y: 535 }, { x: 300, y: 575 },
];

function faiMappa(): HTMLCanvasElement {
  const c = tela(MAPPA_W, H), g = c.getContext("2d")!;
  g.fillStyle = "#060a12"; g.fillRect(0, 0, MAPPA_W, H);
  // reticolo cartografico
  g.strokeStyle = "rgba(120,150,190,.06)"; g.lineWidth = 1;
  for (let x = 0; x < MAPPA_W; x += 120) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let y = 0; y < H; y += 120) { g.beginPath(); g.moveTo(0, y); g.lineTo(MAPPA_W, y); g.stroke(); }
  // isoipse: marching squares su un campo di rumore a due ottave
  const n1 = rumore2D(11), n2 = rumore2D(23);
  const campo = (x: number, y: number) => n1(x / 420, y / 420) * 0.7 + n2(x / 160, y / 160) * 0.3;
  const cella = 18, nx = Math.ceil(MAPPA_W / cella), ny = Math.ceil(H / cella);
  const val: number[][] = [];
  for (let j = 0; j <= ny; j++) { val[j] = []; for (let i = 0; i <= nx; i++) val[j][i] = campo(i * cella, j * cella); }
  const livelli = [0.3, 0.38, 0.46, 0.54, 0.62, 0.7];
  livelli.forEach((L, li) => {
    g.strokeStyle = li % 3 === 2 ? "rgba(150,180,215,.16)" : "rgba(120,150,190,.08)";
    g.lineWidth = li % 3 === 2 ? 1.4 : 1;
    g.beginPath();
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const a = val[j][i], b = val[j][i + 1], cc = val[j + 1][i + 1], d = val[j + 1][i];
      const caso = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (cc > L ? 2 : 0) | (d > L ? 1 : 0);
      if (caso === 0 || caso === 15) continue;
      const x = i * cella, y = j * cella;
      const t_ = (p: number, q: number) => (L - p) / (q - p || 1e-6);
      const N_ = { x: x + t_(a, b) * cella, y }, E_ = { x: x + cella, y: y + t_(b, cc) * cella };
      const S_ = { x: x + t_(d, cc) * cella, y: y + cella }, O_ = { x, y: y + t_(a, d) * cella };
      const seg2 = (p: { x: number; y: number }, q: { x: number; y: number }) => { g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); };
      switch (caso) {
        case 1: case 14: seg2(O_, S_); break;
        case 2: case 13: seg2(S_, E_); break;
        case 3: case 12: seg2(O_, E_); break;
        case 4: case 11: seg2(N_, E_); break;
        case 5: seg2(O_, N_); seg2(S_, E_); break;
        case 6: case 9: seg2(N_, S_); break;
        case 7: case 8: seg2(O_, N_); break;
        case 10: seg2(O_, S_); seg2(N_, E_); break;
      }
    }
    g.stroke();
  });
  // puntini: gli stessi del cielo stellato che si dissolve nella mappa
  const r = rng(5);
  for (let i = 0; i < 520; i++) {
    g.fillStyle = `rgba(210,225,245,${0.05 + r() * 0.12})`;
    g.fillRect(r() * MAPPA_W, r() * H, 1.6, 1.6);
  }
  return c;
}

function faiRotta() {
  const pts: { x: number; y: number }[] = [];
  const P = NODI_MAPPA;
  const nodi: number[] = [0];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let s = i === 0 ? 0 : 1; s <= 60; s++) {
      const u = s / 60, u2 = u * u, u3 = u2 * u;
      const cr = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
      // una leggera ondulazione: le strade vere seguono il terreno
      const ond = Math.sin(u * Math.PI) * Math.sin(i * 1.7 + u * 6) * 14;
      pts.push({ x: cr(p0.x, p1.x, p2.x, p3.x), y: cr(p0.y, p1.y, p2.y, p3.y) + ond });
    }
    nodi.push(pts.length - 1);
  }
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, cum, nodi: nodi.map((k) => cum[k]) };
}

function faiVenature() {
  const c = tela(W, H), g = c.getContext("2d")!;
  const r = rng(77);
  for (let i = 0; i < 90; i++) {
    const y0 = r() * H, amp = 3 + r() * 10, fr = 0.002 + r() * 0.004, ph = r() * 10;
    g.strokeStyle = `rgba(255,220,180,${0.015 + r() * 0.03})`;
    g.lineWidth = 0.6 + r() * 1.4;
    g.beginPath();
    for (let x = 0; x <= W; x += 16) g.lineTo(x, y0 + Math.sin(x * fr + ph) * amp + Math.sin(x * fr * 3.1 + ph) * amp * 0.3);
    g.stroke();
  }
  return c;
}

function faiSassi() {
  const c = tela(W + 400, 420), g = c.getContext("2d")!;
  const r = rng(91);
  for (let i = 0; i < 420; i++) {
    const y = Math.pow(r(), 1.6) * 420;
    const prof = y / 420;                        // 0 lontano … 1 vicino
    const rx = 4 + prof * 30 * (0.5 + r()), ry = rx * (0.35 + r() * 0.2);
    const x = r() * (W + 400);
    g.fillStyle = `rgba(${200 + r() * 30},${185 + r() * 25},${180 + r() * 20},${0.12 + prof * 0.55})`;
    g.beginPath(); g.ellipse(x, y, rx, ry, (r() - 0.5) * 0.4, 0, Math.PI * 2); g.fill();
    g.fillStyle = `rgba(20,8,12,${0.25 + prof * 0.3})`;
    g.beginPath(); g.ellipse(x + rx * 0.2, y + ry * 0.55, rx * 0.95, ry * 0.45, 0, 0, Math.PI * 2); g.fill();
  }
  return c;
}

function faiScarabocchi(): Path2D[][] {
  // «calligrafia» delle lettere: righe di onde e occhielli, non testo leggibile
  const lettere: Path2D[][] = [];
  for (let l = 0; l < 4; l++) {
    const r = rng(300 + l), righe: Path2D[] = [];
    for (let k = 0; k < 9; k++) {
      const p = new Path2D(), y = 96 + k * 27, fine = 440 - (k === 8 ? 180 : r() * 60);
      let x = 46 + (k === 0 ? 0 : r() * 14);
      p.moveTo(x, y);
      while (x < fine) {
        const passo = 5 + r() * 7, alto = 4 + r() * 9;
        const occhiello = r() < 0.18;
        p.bezierCurveTo(x + passo * 0.3, y - alto, x + passo * 0.7, y - alto * (occhiello ? 1.6 : 0.4), x + passo, y + (r() - 0.5) * 3);
        x += passo;
        if (r() < 0.1) { x += 8 + r() * 10; p.moveTo(x, y); }
      }
      righe.push(p);
    }
    lettere.push(righe);
  }
  return lettere;
}

export function precarica(c: Cache) {
  c.crepe ??= faiCrepe(3, 2048, 520, "rgba(40,26,16,.85)", "rgba(230,200,160,.25)", 3.2);
  c.sale ??= faiCrepe(9, 2048, 520, "rgba(120,135,145,.55)", "rgba(255,255,255,.5)", 2.2);
  c.mappa ??= faiMappa();
  c.rotta ??= faiRotta();
  c.venature ??= faiVenature();
  c.sassi ??= faiSassi();
  c.scarabocchi ??= faiScarabocchi();
}

// --------------------------------------------------------------------
//  Mattoni comuni
// --------------------------------------------------------------------
function cielo(ctx: C2D, stops: [number, string][], y0 = 0, y1 = H) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([p, c]) => g.addColorStop(p, c));
  ctx.fillStyle = g;
  ctx.fillRect(-200, y0, W + 400, y1 - y0);
}

function alone(ctx: C2D, x: number, y: number, r: number, colore: string, a: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(colore, a));
  g.addColorStop(0.35, rgba(colore, a * 0.35));
  g.addColorStop(1, rgba(colore, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function strato(ctx: C2D, seme: number, base: number, amp: number, scala: number, off: number, colore: string | CanvasGradient) {
  const f = crinale(seme);
  ctx.fillStyle = colore;
  ctx.beginPath();
  ctx.moveTo(-200, H + 10);
  for (let x = -200; x <= W + 200; x += 12) ctx.lineTo(x, base - f((x + off) / scala) * amp);
  ctx.lineTo(W + 200, H + 10);
  ctx.closePath();
  ctx.fill();
}

function pulviscolo(ctx: C2D, t: number, seme: number, n: number, zona: { x: number; y: number; w: number; h: number }, colore: string, forza: number) {
  const r = rng(seme);
  for (let i = 0; i < n; i++) {
    const bx = r(), by = r(), vel = 6 + r() * 16, fase = r() * 10, dim = 0.8 + r() * 2.4;
    const x = zona.x + ((bx * zona.w + t * vel) % zona.w);
    const y = zona.y + by * zona.h + Math.sin(t * 0.6 + fase) * 12;
    const a = forza * (0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * 1.3 + fase * 3)));
    ctx.fillStyle = rgba(colore, a * 0.5);
    ctx.beginPath(); ctx.arc(x, y, dim, 0, Math.PI * 2); ctx.fill();
  }
}

function camera(ctx: C2D, scala: number, cx = W / 2, cy = H / 2, dx = 0, dy = 0) {
  ctx.translate(cx + dx, cy + dy);
  ctx.scale(scala, scala);
  ctx.translate(-cx, -cy);
}

const faseCammino = (t: number, i: number) => faseDiPasso(t, CAMMINATE[i]);

/** Sbuffi di polvere a ogni appoggio: età in secondi dall'appoggio. */
function sbuffi(ctx: C2D, t: number, cam: number, pieX: (tAppoggio: number) => number, y: number, dim: number, colore: string, deriva: number) {
  const c = CAMMINATE[cam];
  for (let k = 0; ; k++) {
    const ta = c.da + (0.25 + k * 0.5) / c.cad;
    if (ta > t) break;
    const eta = t - ta;
    if (eta > 1.6) continue;
    const x = pieX(ta) + eta * deriva;
    const r = rng(Math.floor(ta * 100));
    for (let i = 0; i < 7; i++) {
      const a = (1 - eta / 1.6) * 0.32;
      const rr = dim * (0.4 + eta * 0.9) * (0.6 + r() * 0.8);
      const ox = (r() - 0.5) * dim * 2.2 * (0.4 + eta), oy = -r() * dim * 0.9 * eta;
      ctx.fillStyle = rgba(colore, a);
      ctx.beginPath(); ctx.ellipse(x + ox, y + oy, rr, rr * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
}

// --------------------------------------------------------------------
//  A · LE LETTERE
// --------------------------------------------------------------------
const POSIZIONI_LETTERE = [
  { x: 720, y: 470, r: -0.13, d: "14 marzo" },
  { x: 1140, y: 505, r: 0.09, d: "2 maggio" },
  { x: 860, y: 600, r: -0.04, d: "19 luglio" },
  { x: 1210, y: 400, r: 0.16, d: "11 ottobre" },
];

function lettere(ctx: C2D, t: number, c: Cache) {
  // tavolo: legno scuro caldo, venature, luce radente
  const g = ctx.createRadialGradient(W * 0.52, H * 0.46, 60, W * 0.5, H * 0.5, W * 0.72);
  g.addColorStop(0, "#2a1d14"); g.addColorStop(0.55, "#140e0a"); g.addColorStop(1, "#050303");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  ctx.save();
  camera(ctx, lerp(1.0, 1.1, easeInOut(seg(t, 0, 9.6))), W / 2, H * 0.58);
  ctx.globalAlpha = 0.9; ctx.drawImage(c.venature!, 0, 0); ctx.globalAlpha = 1;

  POSIZIONI_LETTERE.forEach((p, i) => {
    const ta = LETTERE[i];
    const k = expoOut(seg(t, ta, ta + 0.85));
    if (k <= 0) return;
    const y = lerp(-420, p.y, k), rot = lerp(p.r - 0.35, p.r, k);
    foglio(ctx, p.x, y, 520, 350, rot, 28 * k);
    // scrittura: le righe compaiono dopo l'atterraggio
    ctx.save();
    ctx.translate(p.x, y); ctx.rotate(rot); ctx.translate(-260, -175);
    const scr = seg(t, ta + 0.5, ta + 1.9);
    const righe = c.scarabocchi![i];
    ctx.strokeStyle = "rgba(34,48,84,.78)"; ctx.lineWidth = 1.7;
    righe.forEach((riga, j) => {
      const kj = clamp(scr * righe.length - j);
      if (kj <= 0) return;
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 70 + j * 27, 40 + kj * 440, 30); ctx.clip();
      ctx.stroke(riga);
      ctx.restore();
    });
    ctx.globalAlpha = clamp(scr * 3);
    ctx.fillStyle = "rgba(34,48,84,.85)";
    ctx.font = `italic 500 24px ${FONT.serif}`;
    ctx.textAlign = "right"; ctx.fillText(p.d, 480, 52);
    ctx.textAlign = "left"; ctx.fillText("Caro mio,", 46, 72);
    ctx.globalAlpha = 1;
    ctx.restore();
  });

  // il biglietto: più piccolo, carta grigia, stampatello
  const kb = expoOut(seg(t, BIGLIETTO.arriva, BIGLIETTO.arriva + 0.8));
  if (kb > 0) {
    const bx = lerp(1500, 980, kb), by = lerp(1250, 730, kb), br = lerp(0.3, -0.03, kb);
    foglio(ctx, bx, by, 430, 190, br, 36, "#d9d5cc", "#bdb8ae");
    ctx.save();
    ctx.translate(bx, by); ctx.rotate(br);
    ctx.fillStyle = "#1c1b1d";
    ctx.font = `600 34px ${FONT.display}`;
    ctx.textBaseline = "middle";
    let n = 0;
    BIGLIETTO.testo.forEach((riga, ri) => {
      const r = rng(40 + ri);
      let x = -ctx.measureText(riga).width / 2 - riga.length * 0.8;
      for (const ch of riga) {
        const tc = BIGLIETTO.scrive + n * BIGLIETTO.perCarattere;
        const w = ctx.measureText(ch).width;
        if (t >= tc) {
          const k = easeOut(seg(t, tc, tc + 0.12));
          ctx.save();
          ctx.translate(x + w / 2, (ri === 0 ? -24 : 26) + (r() - 0.5) * 3);
          ctx.rotate((r() - 0.5) * 0.08);
          ctx.globalAlpha = k * (0.82 + r() * 0.18);
          ctx.scale(1 + (1 - k) * 0.4, 1 + (1 - k) * 0.4);
          ctx.fillText(ch, -w / 2, 0);
          ctx.restore();
        } else r(); r();
        x += w + 1.6;
        n++;
      }
      n += 4;
    });
    ctx.restore();
  }
  ctx.restore();

  // occhio di bue sul biglietto: il resto del tavolo si spegne
  const buio = easeInOut(seg(t, 5.0, 7.2));
  if (buio > 0) {
    const cx = kb > 0 ? 980 : W / 2, cy = kb > 0 ? 720 : H / 2;
    const gg = ctx.createRadialGradient(cx, cy, 120, cx, cy, 900);
    gg.addColorStop(0, "rgba(0,0,0,0)");
    gg.addColorStop(0.45, `rgba(0,0,0,${0.35 * buio})`);
    gg.addColorStop(1, `rgba(0,0,0,${0.82 * buio})`);
    ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H);
  }
}

function foglio(ctx: C2D, x: number, y: number, w: number, h: number, rot: number, ombra: number, c1 = "#ece3d0", c2 = "#d6c9ae") {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot);
  ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = ombra; ctx.shadowOffsetY = ombra * 0.4;
  const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.shadowColor = "transparent";
  // piega centrale del foglio
  ctx.fillStyle = "rgba(0,0,0,.05)"; ctx.fillRect(-w / 2, -2, w, 4);
  ctx.restore();
}

// --------------------------------------------------------------------
//  B / J · L'ALBA (anche sfondo del titolo)
// --------------------------------------------------------------------
function alba(ctx: C2D, t: number, titolo: boolean) {
  const t0 = titolo ? 81.4 : 9.6;
  const l = t - t0;
  const luce = titolo ? 0.35 + 0.25 * easeInOut(seg(l, 0, 6)) : 0.1 * easeInOut(seg(l, 0, 8));
  const orizz = 700;

  cielo(ctx, [
    [0, mix("#070d1c", "#1a2440", luce)], [0.42, mix("#1b2440", "#4a4868", luce)],
    [0.6, mix("#8a5a52", "#c88a64", luce)], [0.66, mix("#e39a5c", "#f2b577", luce)], [0.7, "#1a1418"],
  ], 0, 1000);

  const sy = titolo ? 700 - Math.min(l, 20) * 2 : lerp(745, 668, easeOut(seg(l, 0, 8)));
  const sx = titolo ? 1640 : 1510;
  ctx.globalCompositeOperation = "lighter";
  alone(ctx, sx, sy, 900, "#ff9a55", 0.32 + luce * 0.2);
  alone(ctx, sx, sy, 260, "#ffd4a0", 0.5);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#ffe6c2";
  ctx.beginPath(); ctx.arc(sx, sy, 58, 0, Math.PI * 2); ctx.fill();

  const pan = titolo ? l * 4 : l * 7;
  strato(ctx, 1, orizz + 8, 90, 520, pan * 0.15, mix("#2b2638", "#4a3a48", luce));
  // velo d'atmosfera sul primo crinale
  cielo(ctx, [[0, "rgba(255,170,110,0)"], [1, `rgba(255,170,110,${0.12 + luce * 0.1})`]], 560, 720);
  strato(ctx, 2, orizz + 70, 55, 380, pan * 0.4, mix("#191724", "#2a2230", luce));
  strato(ctx, 3, orizz + 150, 40, 300, pan * 0.7, "#100e16");

  // la strada e i pali del telegrafo
  const yStrada = 858;
  ctx.fillStyle = "#1f1a1c";
  ctx.beginPath(); ctx.moveTo(-200, yStrada - 8); ctx.quadraticCurveTo(W / 2, yStrada - 18, W + 200, yStrada - 4);
  ctx.lineTo(W + 200, yStrada + 14); ctx.quadraticCurveTo(W / 2, yStrada + 6, -200, yStrada + 12); ctx.fill();
  const pali: number[] = [];
  for (let i = -1; i < 7; i++) pali.push(((i * 430 + pan * 1.0) % (430 * 7)) - 200);
  ctx.strokeStyle = "#0c0a10"; ctx.lineWidth = 7; ctx.lineCap = "butt";
  pali.forEach((px) => { ctx.beginPath(); ctx.moveTo(px, yStrada - 4); ctx.lineTo(px - 4, yStrada - 210); ctx.stroke(); ctx.fillStyle = "#0c0a10"; ctx.fillRect(px - 40, yStrada - 196, 76, 6); });
  ctx.lineWidth = 1.4; ctx.strokeStyle = "rgba(12,10,16,.9)";
  const ordinati = [...pali].sort((a, b) => a - b);
  for (let i = 0; i < ordinati.length - 1; i++) {
    const a = ordinati[i], b = ordinati[i + 1];
    if (b - a > 600) continue;
    ctx.beginPath(); ctx.moveTo(a - 36, yStrada - 193); ctx.quadraticCurveTo((a + b) / 2, yStrada - 150, b - 40, yStrada - 193); ctx.stroke();
  }
  ctx.fillStyle = "#0a090e"; ctx.fillRect(-200, yStrada + 12, W + 400, H);

  // il viandante (ovest = sinistra), l'ombra lunga davanti a sé
  const cam = titolo ? 4 : 0;
  const fase = faseCammino(t, cam);
  let x: number, alto: number;
  if (titolo) {
    const corsa = 1500;
    x = 1250 - ((l * 26) % corsa);
    alto = 74;
  } else {
    x = 1340 - l * 58;
    alto = 150;
  }
  const svanisce = titolo ? clamp((x - 180) / 200) : 1;
  ctx.globalAlpha = svanisce;
  disegnaOmbra(ctx, x, yStrada + 2, alto, fase, { colore: "#000", tanica: true, fagotto: true, cappello: true }, 2.6, -0.1, "rgba(0,0,0,.55)");
  disegnaViandante(ctx, x, yStrada + 2, alto, fase, {
    colore: "#07060a", lontano: "#040306", bordo: "#ffb27a", latoLuce: 1, verso: -1, tanica: true, fagotto: true, cappello: true,
  });
  ctx.globalAlpha = 1;

  pulviscolo(ctx, t, 8, 70, { x: 900, y: 380, w: 1100, h: 520 }, "#ffd7a8", 0.6 + luce);
}

// --------------------------------------------------------------------
//  C · LA TERRA (dettaglio in carrellata)
// --------------------------------------------------------------------
function terra(ctx: C2D, t: number, c: Cache) {
  const l = t - 17.6;
  cielo(ctx, [[0, "#b98f68"], [0.35, "#e3c49b"], [0.5, "#f1dcba"]], 0, 600);
  alone(ctx, 700, -80, 900, "#fff2d8", 0.7);
  // orizzonte che trema (miraggio)
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = `rgba(120,90,70,${0.12 + i * 0.03})`;
    const y = 560 + i * 7;
    ctx.beginPath(); ctx.moveTo(-10, y);
    for (let x = 0; x <= W; x += 30) ctx.lineTo(x, y + Math.sin(x * 0.012 + t * 3 + i) * 3);
    ctx.lineTo(W + 10, y + 12); ctx.lineTo(-10, y + 12); ctx.fill();
  }
  // suolo
  const g = ctx.createLinearGradient(0, 600, 0, H);
  g.addColorStop(0, "#9c7a55"); g.addColorStop(0.4, "#86654a"); g.addColorStop(1, "#4d3726");
  ctx.fillStyle = g; ctx.fillRect(0, 600, W, H - 600);

  const vel = 330;                       // px/s del suolo in primo piano
  const scorri = (img: HTMLCanvasElement, y0: number, h: number, v: number, alpha: number) => {
    const off = ((l * v) % img.width + img.width) % img.width;
    ctx.globalAlpha = alpha;
    for (let x = off - img.width; x < W; x += img.width) ctx.drawImage(img, x, y0, img.width, h);
    ctx.globalAlpha = 1;
  };
  scorri(c.crepe!, 600, 120, vel * 0.25, 0.55);
  scorri(c.crepe!, 700, 380, vel, 0.9);

  // il viandante enorme: si vedono gambe, cappotto, tanica
  const fase = faseCammino(t, 1);
  const x = 1340, y = 905, alto = 1720;    // dalla coscia in giù: gambe, orlo, tanica, piedi
  disegnaOmbra(ctx, x + 30, y + 4, alto, fase, { colore: "#000", tanica: true, fagotto: true }, -0.35, 0.05, "rgba(40,22,10,.35)");
  disegnaViandante(ctx, x, y, alto, fase, {
    colore: "#1b120c", lontano: "#120c08", bordo: "#f3d0a0", latoLuce: -1, verso: -1, tanica: true, fagotto: true,
  });
  const piede = (_ta: number) => x - 90;
  sbuffi(ctx, t, 1, piede, y + 4, 34, "#c9a57e", vel);

  pulviscolo(ctx, t, 21, 50, { x: 0, y: 500, w: W, h: 500 }, "#fff0d8", 0.8);
  // calore: velo chiaro dall'alto
  cielo(ctx, [[0, "rgba(255,240,215,.35)"], [1, "rgba(255,240,215,0)"]], 0, 420);
}

// --------------------------------------------------------------------
//  D · L'INVASO (giorno → notte, la domanda)
// --------------------------------------------------------------------
function invaso(ctx: C2D, t: number, c: Cache) {
  const l = t - 24.8;
  const notte = easeInOut(seg(l, 1.6, 6.4));
  const alza = easeInOut(seg(l, 0, 8.6)) * 120;  // la macchina sale verso il cielo
  cielo(ctx, [
    [0, mix("#4a5a78", "#03050c", notte)], [0.45, mix("#9aa7b8", "#0a1122", notte)],
    [0.62, mix("#e9c9a4", "#1f2c46", notte)], [0.66, mix("#f4e1c6", "#2a3a58", notte)],
  ], 0, 760);

  // stelle
  const r = rng(5);
  for (let i = 0; i < 260; i++) {
    const x = r() * W, y = r() * 700 - 40 + alza * 0.4, tw = 0.5 + 0.5 * Math.sin(t * (1 + r() * 2) + i);
    const a = clamp((notte - 0.35) * 1.8) * (0.25 + r() * 0.6) * (0.6 + 0.4 * tw);
    if (a <= 0.01) continue;
    ctx.fillStyle = `rgba(220,232,255,${a})`;
    ctx.fillRect(x, y, 1.8, 1.8);
  }

  ctx.save();
  ctx.translate(0, alza);
  const orizz = 700;
  strato(ctx, 41, orizz + 4, 26, 600, 0, mix("#6f7486", "#0c1220", notte));
  // la diga: muro di cemento a destra
  ctx.fillStyle = mix("#595e6c", "#080c16", notte);
  ctx.beginPath(); ctx.moveTo(1420, orizz + 10); ctx.lineTo(1460, 530); ctx.lineTo(W + 20, 505); ctx.lineTo(W + 20, orizz + 10); ctx.fill();
  ctx.strokeStyle = mix("#6e7382", "#0e1422", notte); ctx.lineWidth = 2;
  for (let x = 1500; x < W; x += 70) { ctx.beginPath(); ctx.moveTo(x, 528 - (x - 1460) * 0.05); ctx.lineTo(x, orizz); ctx.stroke(); }
  // la torre di presa
  ctx.fillStyle = mix("#4c5160", "#070a12", notte);
  ctx.fillRect(1180, 612, 26, 92); ctx.fillRect(1168, 604, 50, 10);
  // la piana di sale
  const gs = ctx.createLinearGradient(0, orizz, 0, H);
  gs.addColorStop(0, mix("#e7ebe9", "#1a2233", notte)); gs.addColorStop(1, mix("#b8beba", "#070a12", notte));
  ctx.fillStyle = gs; ctx.fillRect(-10, orizz, W + 20, H - orizz + 200);
  ctx.globalAlpha = 0.5 - notte * 0.3;
  ctx.drawImage(c.sale!, -60, orizz, 2048, 90);
  ctx.drawImage(c.sale!, -120, orizz + 80, 2300, 420);
  ctx.globalAlpha = 1;
  // riverbero all'orizzonte
  cielo(ctx, [[0, `rgba(255,255,255,${0.45 * (1 - notte)})`], [1, "rgba(255,255,255,0)"]], orizz - 4, orizz + 40);

  // il viandante, piccolissimo
  const x = 1090 - l * 22, alto = 64;
  const fase = faseCammino(t, 2);
  disegnaViandante(ctx, x, orizz + 34, alto, fase, {
    colore: mix("#2a2d36", "#02030a", notte), bordo: notte < 0.6 ? "#fff4e2" : undefined, latoLuce: 1, verso: -1, tanica: true, fagotto: true, cappello: true,
  });
  ctx.restore();
}

// --------------------------------------------------------------------
//  E · LA MAPPA (la rotta si disegna tappa dopo tappa)
// --------------------------------------------------------------------
export function tappaCorrente(t: number) {
  return clamp(Math.floor((t - TAPPE_T0) / TAPPE_PASSO) + 1, 0, 7);
}

function distanzaPenna(t: number, c: Cache) {
  const nodi = c.rotta!.nodi;
  if (t <= TAPPE_T0) return 0;
  const i = Math.min(nodi.length - 2, Math.floor((t - TAPPE_T0) / TAPPE_PASSO));
  const ti = TAPPE_T0 + i * TAPPE_PASSO;
  const k = easeInOut(seg(t, ti, ti + TAPPE_PASSO * 0.72));
  return lerp(nodi[i], nodi[i + 1], k);
}

function puntoA(d: number, c: Cache) {
  const { pts, cum } = c.rotta!;
  let lo = 0, hi = cum.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] < d) lo = m; else hi = m; }
  const k = (d - cum[lo]) / (cum[hi] - cum[lo] || 1);
  return { x: lerp(pts[lo].x, pts[hi].x, k), y: lerp(pts[lo].y, pts[hi].y, k), i: lo };
}

function mappa(ctx: C2D, t: number, c: Cache) {
  const d = distanzaPenna(t, c);
  const penna = puntoA(d, c);
  const camX = clamp(penna.x - W * 0.52, 0, MAPPA_W - W);
  const zoom = lerp(1.06, 1.0, easeOut(seg(t, 32.8, 36)));
  ctx.save();
  camera(ctx, zoom, W / 2, H / 2);
  ctx.drawImage(c.mappa!, camX, 0, W, H, 0, 0, W, H);
  ctx.translate(-camX, 0);

  const { pts } = c.rotta!;
  // rotta futura: tratteggio tenue
  ctx.setLineDash([2, 12]); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(200,215,235,.18)";
  ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke();
  ctx.setLineDash([]);
  // rotta percorsa: segmenti colorati per zona, con bagliore
  const nodi = c.rotta!.nodi;
  for (let z = 0; z < 7; z++) {
    if (d <= nodi[z]) break;
    const fine = Math.min(d, nodi[z + 1]);
    const col = ZONE[z].a;
    ctx.beginPath();
    let primo = true;
    for (let i = 0; i < pts.length; i++) {
      const di = c.rotta!.cum[i];
      if (di < nodi[z]) continue;
      if (di > fine) break;
      if (primo) { ctx.moveTo(pts[i].x, pts[i].y); primo = false; } else ctx.lineTo(pts[i].x, pts[i].y);
    }
    if (fine < nodi[z + 1]) ctx.lineTo(penna.x, penna.y);   // zona in corso: fino alla penna
    ctx.shadowColor = col; ctx.shadowBlur = 16;
    ctx.strokeStyle = col; ctx.lineWidth = 3.2; ctx.lineCap = "round";
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // le tappe
  NODI_MAPPA.forEach((n, i) => {
    const ti = TAPPE_T0 + i * TAPPE_PASSO;
    const k = seg(t, ti, ti + 0.9);
    if (k <= 0) {
      ctx.fillStyle = "rgba(200,215,235,.22)";
      ctx.beginPath(); ctx.arc(n.x, n.y, 4, 0, Math.PI * 2); ctx.fill();
      return;
    }
    const finale = i === 7;
    const col = finale ? "#f0e6d8" : ZONE[i].a;
    // onda che si espande
    const onda = seg(t, ti, ti + 1.3);
    ctx.strokeStyle = rgba(col.length === 7 ? col : "#ffffff", (1 - onda) * 0.7);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(n.x, n.y, 8 + onda * 60, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowColor = col; ctx.shadowBlur = 20;
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(n.x, n.y, 7 + (1 - easeOut(k)) * 6, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // etichette: alternate sopra/sotto la rotta
    const sopra = i % 2 === 0;
    const a = easeOut(seg(t, ti + 0.1, ti + 0.7));
    const dy = (1 - a) * 18 * (sopra ? 1 : -1);
    ctx.globalAlpha = a;
    ctx.textAlign = "center";
    if (finale) {
      ctx.fillStyle = "#f0e6d8";
      ctx.font = `600 22px ${FONT.mono}`;
      ctx.fillText("A C Q U A M O R T A", n.x, n.y + 62 + dy);
      ctx.fillStyle = "rgba(240,230,216,.6)";
      ctx.font = `italic 500 26px ${FONT.serif}`;
      ctx.fillText("casa", n.x, n.y + 100 + dy);
    } else {
      const base = sopra ? n.y - 118 : n.y + 64;
      ctx.fillStyle = "rgba(200,215,235,.5)";
      ctx.font = `500 17px ${FONT.mono}`;
      ctx.fillText(`0${i + 1}`, n.x, base + dy);
      ctx.fillStyle = col;
      ctx.font = `700 44px ${FONT.display}`;
      ctx.fillText(ZONE[i].n, n.x, base + 50 + dy);
      ctx.fillStyle = "rgba(222,230,240,.72)";
      ctx.font = `italic 500 25px ${FONT.serif}`;
      ctx.fillText(ZONE[i].s, n.x, base + 86 + dy);
    }
    ctx.globalAlpha = 1;
  });

  // la punta della penna
  if (t > TAPPE_T0 && t < TAPPE_T0 + 7 * TAPPE_PASSO + 0.4) {
    alone(ctx, penna.x, penna.y, 60, "#ffffff", 0.35);
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(penna.x, penna.y, 3.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// --------------------------------------------------------------------
//  F · CINQUE MODI (sfondo; i segni e i verbi sono nel DOM)
// --------------------------------------------------------------------
function cinque(ctx: C2D, t: number) {
  const g = ctx.createRadialGradient(W / 2, H * 0.55, 100, W / 2, H / 2, W * 0.7);
  g.addColorStop(0, "#10131c"); g.addColorStop(1, "#040509");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  cielo(ctx, [[0, "rgba(160,180,210,0)"], [0.5, "rgba(160,180,210,.05)"], [1, "rgba(160,180,210,0)"]], 380, 700);
  pulviscolo(ctx, t, 55, 90, { x: 0, y: 150, w: W, h: 780 }, "#c8d4e6", 0.5);
}

// --------------------------------------------------------------------
//  G · IL GUADO (controluce cremisi)
// --------------------------------------------------------------------
function guado(ctx: C2D, t: number, c: Cache) {
  const l = t - 59.6;
  ctx.save();
  camera(ctx, lerp(1.0, 1.12, easeInOut(seg(l, 0, 8.2))), 900, 760);
  cielo(ctx, [[0, "#12060c"], [0.35, "#3d1020"], [0.55, "#8a2a36"], [0.62, "#d8664a"], [0.66, "#f09a6a"]], 0, 700);
  alone(ctx, 380, 660, 700, "#ff7a55", 0.45);
  // Acquamorta sull'altra riva: case, un campanile
  ctx.fillStyle = "#1a0810";
  const r = rng(61);
  let x = 60;
  while (x < 1150) {
    const w = 50 + r() * 70, h = 40 + r() * 70;
    ctx.fillRect(x, 660 - h, w, h + 30);
    ctx.beginPath(); ctx.moveTo(x - 4, 660 - h); ctx.lineTo(x + w / 2, 660 - h - 22 - r() * 10); ctx.lineTo(x + w + 4, 660 - h); ctx.fill();
    x += w + r() * 18;
  }
  ctx.fillRect(700, 470, 36, 200); ctx.beginPath(); ctx.moveTo(694, 470); ctx.lineTo(718, 430); ctx.lineTo(742, 470); ctx.fill();
  strato(ctx, 71, 690, 20, 400, 0, "#160710");
  // il greto: sassi bianchi, un filo d'acqua morta
  ctx.fillStyle = "#1e0c12"; ctx.fillRect(-100, 700, W + 200, 500);
  ctx.drawImage(c.sassi!, -200, 700);
  const ga = ctx.createLinearGradient(0, 742, 0, 770);
  ga.addColorStop(0, "rgba(240,140,110,0)"); ga.addColorStop(0.5, "rgba(240,150,120,.55)"); ga.addColorStop(1, "rgba(240,140,110,0)");
  ctx.fillStyle = ga;
  ctx.beginPath(); ctx.moveTo(-100, 748);
  for (let xx = -100; xx <= W + 100; xx += 40) ctx.lineTo(xx, 752 + Math.sin(xx * 0.01) * 6);
  ctx.lineTo(W + 100, 770); ctx.lineTo(-100, 770); ctx.fill();

  // Cosimo: immobile, controluce, guarda verso chi arriva (est)
  disegnaViandante(ctx, 640, 890, 330, 0, {
    colore: "#070205", bordo: "#ff9d7a", latoLuce: -1, verso: 1, fermo: 1, respiro: t,
  });
  // il viandante arriva da destra e si ferma
  const ferma = easeInOut(seg(l, 3.8, 4.6));
  const avanza = l < 4.6 ? l : 4.6;
  const vx = 1720 - avanza * 118 + ferma * 6;
  const fase = CAMMINATE[3] ? faseDiPasso(Math.min(t, 64.2), CAMMINATE[3]) : 0;
  disegnaViandante(ctx, vx, 896, 342, fase, {
    colore: "#08030a", bordo: "#ff9d7a", latoLuce: -1, verso: -1, fermo: ferma, respiro: t, tanica: true, fagotto: true, cappello: true,
  });
  pulviscolo(ctx, t, 63, 40, { x: 0, y: 300, w: W, h: 600 }, "#ffb49a", 0.5);
  ctx.restore();
}

// --------------------------------------------------------------------
//  H · LE REGOLE (montaggio serrato; i titoli sono nel DOM)
// --------------------------------------------------------------------
export const REGOLE = [
  { testo: "La sete\nè la spina dorsale.", a: "#e6a85a" },
  { testo: "L'acqua\nè la moneta.", a: "#a9dbe4" },
  { testo: "La fiducia\napre le porte.", a: "#7fc8bd" },
  { testo: "La violenza costa.\nEd è evitabile.", a: "#df5f78" },
  { testo: "Le scelte arrivano\nfino in fondo.", a: "#9aa6e0" },
];

function regole(ctx: C2D, t: number) {
  const i = clamp(Math.floor((t - 67.8) / REGOLA_DUR), 0, 4);
  const k = seg(t, 67.8 + i * REGOLA_DUR, 67.8 + (i + 1) * REGOLA_DUR);
  const col = REGOLE[i].a;
  ctx.fillStyle = "#040509"; ctx.fillRect(0, 0, W, H);
  alone(ctx, 1380, 540, 700, col, 0.12);
  const cx = 1400, cy = 540;
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  const e = easeOut(clamp(k * 1.6));
  if (i === 0) {
    // la spina: dodici vertebre che si riempiono di sete
    for (let v = 0; v < 12; v++) {
      const y = cy + 190 - v * 34, pieno = e * 12 > v;
      ctx.fillStyle = pieno ? mix(col, "#df5f78", v / 11) : "rgba(255,255,255,.07)";
      ctx.beginPath(); ctx.roundRect(cx - 44 + Math.sin(v * 0.5) * 6, y - 11, 88, 22, 7); ctx.fill();
    }
  } else if (i === 1) {
    // la goccia diventa moneta
    const m = easeInOut(seg(k, 0.15, 0.6));
    ctx.save(); ctx.translate(cx, cy);
    ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 30;
    ctx.beginPath();
    const r = 110;
    ctx.moveTo(0, -r - (1 - m) * 90);
    ctx.bezierCurveTo(r * (0.6 + m * 0.4), -r * (0.5 + m * 0.45) - (1 - m) * 30, r, r * 0.3, 0, r);
    ctx.bezierCurveTo(-r, r * 0.3, -r * (0.6 + m * 0.4), -r * (0.5 + m * 0.45) - (1 - m) * 30, 0, -r - (1 - m) * 90);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = m;
    ctx.strokeStyle = "#04121a"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#04121a"; ctx.font = `700 90px ${FONT.display}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("1", 0, 6);
    ctx.globalAlpha = 1;
    // riflesso che passa
    const s = seg(k, 0.55, 0.9);
    if (s > 0 && s < 1) { ctx.globalCompositeOperation = "lighter"; alone(ctx, lerp(-120, 120, s), -40, 80, "#ffffff", 0.4); ctx.globalCompositeOperation = "source-over"; }
    ctx.restore();
  } else if (i === 2) {
    // la porta si apre e la luce passa
    const ap = easeInOut(seg(k, 0.15, 0.7));
    ctx.fillStyle = "rgba(255,255,255,.05)"; ctx.fillRect(cx - 130, cy - 230, 260, 460);
    ctx.globalCompositeOperation = "lighter";
    const gl = ctx.createLinearGradient(cx, 0, cx + 600, 0);
    gl.addColorStop(0, rgba(col, 0.55 * ap)); gl.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = gl;
    ctx.beginPath(); ctx.moveTo(cx - 125 * ap, cy - 225); ctx.lineTo(cx + 125 * ap, cy - 225); ctx.lineTo(cx + 560, cy + 330); ctx.lineTo(cx - 300 * ap, cy + 330); ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#0d1a19";
    ctx.fillRect(cx - 125, cy - 225, 125 * (1 - ap), 450);
    ctx.fillRect(cx + 125 * ap, cy - 225, 125 * (1 - ap), 450);
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.strokeRect(cx - 130, cy - 230, 260, 460);
  } else if (i === 3) {
    // dieci tacche di vita: il colpo ne spegne quattro
    const colpo = seg(k, 0.35, 0.5);
    const scossa = colpo > 0 && colpo < 1 ? Math.sin(k * 120) * 10 * (1 - colpo) : 0;
    for (let v = 0; v < 10; v++) {
      const spenta = v >= 6 && colpo >= (v - 6) / 4;
      ctx.fillStyle = spenta ? "rgba(255,255,255,.07)" : col;
      ctx.beginPath(); ctx.roundRect(cx - 290 + v * 58 + scossa, cy - 30, 44, 60, 8); ctx.fill();
    }
    if (colpo > 0 && colpo < 1) { ctx.fillStyle = `rgba(223,95,120,${(1 - colpo) * 0.25})`; ctx.fillRect(0, 0, W, H); }
  } else {
    // l'albero delle scelte: sei finali
    ctx.strokeStyle = col; ctx.lineWidth = 3;
    const cresce = easeOut(seg(k, 0.05, 0.75));
    const rami = (x: number, y: number, liv: number, dir: number, fino: number) => {
      if (liv === 0 || fino <= 0) return;
      const figli = liv === 3 ? 2 : liv === 2 ? 3 : 1;
      for (let f = 0; f < figli; f++) {
        const ang = (figli === 1 ? 0 : (f / (figli - 1) - 0.5) * (liv === 3 ? 1.1 : 0.7)) + dir * 0.05;
        const len = liv === 3 ? 170 : liv === 2 ? 150 : 110;
        const kk = clamp(fino * 3 - (3 - liv));
        const x2 = x + Math.cos(ang) * len * kk, y2 = y + Math.sin(ang) * len * kk;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
        if (liv === 1 && kk >= 1) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x2, y2, 9, 0, Math.PI * 2); ctx.fill(); }
        rami(x2, y2, liv - 1, ang, fino);
      }
    };
    rami(cx - 190, cy, 3, 0, cresce);
    ctx.globalAlpha = seg(k, 0.7, 0.9);
    ctx.fillStyle = col; ctx.font = `600 22px ${FONT.mono}`; ctx.textAlign = "left";
    ctx.fillText("6 FINALI", cx + 370, cy + 8);
    ctx.globalAlpha = 1;
  }
}

// --------------------------------------------------------------------
//  I · I NUMERI (sfondo)
// --------------------------------------------------------------------
function numeri(ctx: C2D, t: number, c: Cache) {
  ctx.fillStyle = "#040609"; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.5;
  ctx.drawImage(c.mappa!, 600 + (t - 77) * 20, 0, W, H, 0, 0, W, H);
  ctx.globalAlpha = 1;
  const g = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, W * 0.6);
  g.addColorStop(0, "rgba(4,6,9,.2)"); g.addColorStop(1, "rgba(4,6,9,.95)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// --------------------------------------------------------------------
//  Regia: disegna la scena richiesta
// --------------------------------------------------------------------
export function disegnaScena(ctx: C2D, id: IdScena, t: number, c: Cache) {
  switch (id) {
    case "lettere": return lettere(ctx, t, c);
    case "alba": return alba(ctx, t, false);
    case "terra": return terra(ctx, t, c);
    case "invaso": return invaso(ctx, t, c);
    case "mappa": return mappa(ctx, t, c);
    case "cinque": return cinque(ctx, t);
    case "guado": return guado(ctx, t, c);
    case "regole": return regole(ctx, t);
    case "numeri": return numeri(ctx, t, c);
    case "titolo": return alba(ctx, t, true);
  }
}

export { BANDA };
