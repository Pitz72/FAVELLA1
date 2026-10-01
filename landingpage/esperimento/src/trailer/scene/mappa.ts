// ====================================================================
//  E · LA MAPPA  (la rotta si disegna tappa dopo tappa)
// --------------------------------------------------------------------
//  Una carta nel buio: rilievo ombreggiato, curve di livello con le quote,
//  letti di fiume in secca, strade, e per ogni tappa il suo segno di
//  cartografo (stazione, masseria, diga, casello, paese, colline, guado,
//  casa). La penna traccia la rotta, colorata per zona; ogni tappa
//  sbocca nel suo nome. Le parti fisse si dipingono una volta sola.
// ====================================================================
import { W, H, TAPPE_T0, TAPPE_PASSO } from "../scaletta";
import { clamp, easeInOut, easeOut, lerp, rng, rgba, seg } from "../tempo";
import type { Cache } from "../cache";
import { alone, camera, type C2D } from "../pittura";
import { creaTela, ctxDi, fbmPeriodico, hexRgb, perlin, riempi, type Tela } from "../texture";
import { FONT } from "../font";
import { ZONE } from "../zone";

export const MAPPA_W = 3600;
export const NODI_MAPPA = [
  { x: 3260, y: 560 }, { x: 2810, y: 650 }, { x: 2360, y: 505 }, { x: 1900, y: 615 },
  { x: 1450, y: 500 }, { x: 990, y: 600 }, { x: 590, y: 535 }, { x: 300, y: 575 },
];

interface Rotta { pts: { x: number; y: number }[]; cum: number[]; nodi: number[] }
interface StatoMappa { mappa: Tela; rotta: Rotta; polvere: Tela }

// --------------------------------------------------------------------
//  La rotta: una curva morbida (Catmull-Rom) per gli otto punti
// --------------------------------------------------------------------
function faiRotta(): Rotta {
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

// --------------------------------------------------------------------
//  I segni del cartografo
// --------------------------------------------------------------------
const INK = "rgba(176,198,228,";
type G = CanvasRenderingContext2D;

function segno(g: G, i: number, x: number, y: number, a: number) {
  g.save(); g.translate(x, y);
  g.strokeStyle = `${INK}${a})`; g.fillStyle = `${INK}${a * 0.35})`; g.lineWidth = 2; g.lineCap = "round"; g.lineJoin = "round";
  const cas = (cx: number, cy: number, w: number, h: number, tetto = true) => {
    g.beginPath(); g.rect(cx - w / 2, cy - h / 2, w, h); g.stroke();
    if (tetto) { g.beginPath(); g.moveTo(cx - w / 2 - 2, cy - h / 2); g.lineTo(cx, cy - h / 2 - h * 0.6); g.lineTo(cx + w / 2 + 2, cy - h / 2); g.stroke(); }
  };
  if (i === 0) {                                                  // Acquaviva: la stazione e i binari che finiscono
    cas(0, 0, 34, 22); cas(-46, 6, 16, 12); cas(44, 8, 18, 12);
    g.beginPath(); g.moveTo(-160, 40); g.lineTo(160, 40); g.moveTo(-160, 48); g.lineTo(160, 48); g.stroke();
    for (let k = -150; k < 160; k += 16) { g.beginPath(); g.moveTo(k, 36); g.lineTo(k, 52); g.stroke(); }
    g.beginPath(); g.moveTo(160, 36); g.lineTo(160, 52); g.lineTo(176, 44); g.closePath(); g.fill();
  } else if (i === 1) {                                           // la piana: una masseria e il pozzo
    cas(0, 0, 44, 26); cas(58, 8, 20, 14); g.beginPath(); g.arc(-70, 26, 8, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(-70, 18); g.lineTo(-70, 34); g.moveTo(-78, 26); g.lineTo(-62, 26); g.stroke();
    for (let k = -120; k < 120; k += 18) { g.beginPath(); g.moveTo(k, 66); g.lineTo(k + 6, 58); g.stroke(); }   // il seminato
  } else if (i === 2) {                                           // l'invaso: la diga e il lago in secca
    g.lineWidth = 4; g.beginPath(); g.arc(0, 40, 74, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); g.lineWidth = 2;
    for (let k = 0; k < 9; k++) { const a = Math.PI * (1.2 + k * 0.075); g.beginPath(); g.moveTo(Math.cos(a) * 74, 40 + Math.sin(a) * 74); g.lineTo(Math.cos(a) * 88, 40 + Math.sin(a) * 88); g.stroke(); }
    g.setLineDash([3, 6]); g.beginPath(); g.ellipse(0, 70, 92, 40, 0, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    for (let k = -60; k < 60; k += 14) { g.beginPath(); g.moveTo(k, 60); g.lineTo(k + 8, 80); g.stroke(); }
  } else if (i === 3) {                                           // la statale: il casello con la sbarra
    g.beginPath(); g.moveTo(-140, 30); g.lineTo(140, 30); g.moveTo(-140, 40); g.lineTo(140, 40); g.stroke();
    g.beginPath(); g.moveTo(0, 40); g.lineTo(0, -6); g.stroke(); g.lineWidth = 4;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(-58, -12); g.stroke(); g.lineWidth = 2;
    for (let k = -50; k < 0; k += 14) { g.beginPath(); g.moveTo(k, -9 + (k + 50) * 0.02); g.lineTo(k + 6, -14 + (k + 50) * 0.02); g.stroke(); }
    cas(30, 10, 22, 16);
  } else if (i === 4) {                                           // il paese: case addossate e la chiesa
    for (const [cx, cy, w, h] of [[-50, 4, 24, 16], [-18, 8, 22, 14], [16, 2, 26, 18], [52, 8, 22, 14], [-30, 34, 24, 14], [18, 32, 26, 16]] as const) cas(cx, cy, w, h);
    g.beginPath(); g.rect(84, -10, 16, 34); g.stroke();
    g.beginPath(); g.moveTo(92, -10); g.lineTo(92, -30); g.moveTo(86, -22); g.lineTo(98, -22); g.stroke();
  } else if (i === 5) {                                           // le colline: creste, un sentiero, la grotta
    for (const [cx, cy, s] of [[-64, 16, 1], [-8, -4, 1.4], [60, 16, 1.1], [116, 24, 0.8]] as const) {
      g.beginPath(); g.moveTo(cx - 30 * s, cy + 30 * s); g.lineTo(cx, cy - 22 * s); g.lineTo(cx + 30 * s, cy + 30 * s); g.stroke();
      g.beginPath(); g.moveTo(cx, cy - 22 * s); g.lineTo(cx + 8 * s, cy + 30 * s); g.stroke();
    }
    g.beginPath(); g.arc(-14, 54, 10, Math.PI, 0); g.stroke();
  } else if (i === 6) {                                           // il guado: un fiume di traverso e i sassi
    g.setLineDash([4, 5]);
    g.beginPath(); g.moveTo(-160, 10); g.bezierCurveTo(-80, 40, 0, -20, 160, 14); g.stroke();
    g.beginPath(); g.moveTo(-160, 30); g.bezierCurveTo(-80, 60, 0, 0, 160, 34); g.stroke(); g.setLineDash([]);
    for (let k = -3; k <= 3; k++) { g.beginPath(); g.ellipse(k * 16, 22 + Math.sin(k) * 6, 5, 3.4, 0, 0, Math.PI * 2); g.fill(); g.stroke(); }
    cas(-50, -30, 20, 14, false); cas(50, -30, 20, 14, false);
  } else {                                                        // Acquamorta: la casa
    g.lineWidth = 2.6; cas(0, 0, 40, 26); g.lineWidth = 2;
    g.beginPath(); g.moveTo(-10, 13); g.lineTo(-10, 0); g.lineTo(0, 0); g.lineTo(0, 13); g.stroke();
    g.beginPath(); g.rect(10, -8, 8, 8); g.stroke(); g.beginPath(); g.moveTo(14, -19); g.lineTo(14, -34); g.lineTo(21, -34); g.lineTo(21, -22); g.stroke();
    g.beginPath(); g.arc(0, 0, 66, 0, Math.PI * 2); g.setLineDash([2, 6]); g.stroke(); g.setLineDash([]);
  }
  g.restore();
}

// --------------------------------------------------------------------
//  La carta, dipinta una volta sola
// --------------------------------------------------------------------
async function faiMappa(): Promise<Tela> {
  const c = creaTela(MAPPA_W, H), g = ctxDi(c);
  const base = g.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, "#080d17"); base.addColorStop(1, "#05080f");
  g.fillStyle = base; g.fillRect(0, 0, MAPPA_W, H);

  // rilievo ombreggiato: luce da nord-ovest, a mezza risoluzione (poi si stira)
  const n1 = perlin(11), n2 = perlin(23), n3 = perlin(41);
  const quota = (x: number, y: number) => n1(x / 520, y / 520) * 0.62 + n2(x / 210, y / 210) * 0.28 + n3(x / 86, y / 86) * 0.10;
  const hw = MAPPA_W / 2, hh = H / 2;
  const rilievo = await riempi(hw, hh, (x, y, px) => {
    const X = x * 2, Y = y * 2;
    const dzx = quota(X + 6, Y) - quota(X - 6, Y), dzy = quota(X, Y + 6) - quota(X, Y - 6);
    const luce = clamp(0.5 + (-dzx * 0.75 - dzy * 0.65) * 4.2);       // >0.5: pendio rivolto alla luce
    const alto = clamp((quota(X, Y) + 0.5));
    if (luce > 0.5) { px[0] = 150 + alto * 60; px[1] = 190 + alto * 20; px[2] = 236 - alto * 50; px[3] = (luce - 0.5) * 2 * 96; }
    else { px[0] = 2; px[1] = 4; px[2] = 12; px[3] = (0.5 - luce) * 2 * 150; }
  });
  g.imageSmoothingEnabled = true; g.drawImage(rilievo, 0, 0, MAPPA_W, H);

  // graticola cartografica
  g.strokeStyle = "rgba(120,150,190,.055)"; g.lineWidth = 1;
  for (let x = 0; x < MAPPA_W; x += 120) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, H); g.stroke(); }
  for (let y = 0; y < H; y += 120) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(MAPPA_W, y + 0.5); g.stroke(); }

  // curve di livello: marching squares, con le quote scritte sulle curve maestre
  const cella = 16, nx = Math.ceil(MAPPA_W / cella), ny = Math.ceil(H / cella);
  const val: number[][] = [];
  for (let j = 0; j <= ny; j++) { val[j] = []; for (let i = 0; i <= nx; i++) val[j][i] = quota(i * cella, j * cella) * 0.5 + 0.5; }
  const livelli = [0.30, 0.36, 0.42, 0.48, 0.54, 0.60, 0.66, 0.72];
  const r = rng(3);
  livelli.forEach((L, li) => {
    const maestra = li % 3 === 1;
    g.strokeStyle = maestra ? "rgba(160,190,225,.44)" : "rgba(120,150,190,.18)";
    g.lineWidth = maestra ? 1.8 : 1.1;
    g.beginPath();
    const etichette: { x: number; y: number; a: number }[] = [];
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const a = val[j][i], b = val[j][i + 1], cc = val[j + 1][i + 1], d = val[j + 1][i];
      const caso = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (cc > L ? 2 : 0) | (d > L ? 1 : 0);
      if (caso === 0 || caso === 15) continue;
      const x = i * cella, y = j * cella;
      const t_ = (p: number, q: number) => (L - p) / (q - p || 1e-6);
      const N_ = { x: x + t_(a, b) * cella, y }, E_ = { x: x + cella, y: y + t_(b, cc) * cella };
      const S_ = { x: x + t_(d, cc) * cella, y: y + cella }, O_ = { x, y: y + t_(a, d) * cella };
      const seg2 = (p: { x: number; y: number }, q: { x: number; y: number }) => {
        g.moveTo(p.x, p.y); g.lineTo(q.x, q.y);
        if (maestra && etichette.length < 60 && ((i * 7 + j * 13) % 61) === 0 && r() < 0.5) etichette.push({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2, a: Math.atan2(q.y - p.y, q.x - p.x) });
      };
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
    g.fillStyle = "rgba(160,190,225,.42)"; g.font = `500 12px ${FONT.mono}`; g.textAlign = "center"; g.textBaseline = "middle";
    for (const e of etichette) {
      g.save(); g.translate(e.x, e.y); g.rotate(Math.abs(e.a) > Math.PI / 2 ? e.a + Math.PI : e.a);
      g.fillStyle = "rgba(8,12,20,.85)"; g.fillRect(-12, -7, 24, 14);
      g.fillStyle = "rgba(160,190,225,.5)"; g.fillText(String(300 + li * 50), 0, 0.5);
      g.restore();
    }
  });

  // letti di fiume in secca: linee spezzate d'azzurro, con il puntinato della sabbia
  const rn = perlin(61);
  g.strokeStyle = "rgba(110,165,215,.38)"; g.lineWidth = 2; g.setLineDash([9, 5]);
  for (const [x0, y0, x1, y1] of [[3480, 90, 2600, 1040], [2200, 60, 1500, 1050], [1250, 40, 400, 980]] as const) {
    g.beginPath();
    for (let s = 0; s <= 60; s++) {
      const u = s / 60, x = lerp(x0, x1, u) + rn(u * 4, y0) * 150, y = lerp(y0, y1, u) + rn(u * 3 + 9, x1) * 40;
      s ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
  }
  g.setLineDash([]);

  // le strade minori: sottili, che si incrociano con la rotta
  g.strokeStyle = "rgba(170,190,220,.16)"; g.lineWidth = 1.6;
  for (const [x0, y0, x1, y1] of [[3600, 380, 2700, 700], [3100, 900, 2300, 560], [1800, 200, 1500, 520], [1000, 900, 700, 560], [2000, 1000, 1700, 660]] as const) {
    g.beginPath(); g.moveTo(x0, y0);
    for (let s = 1; s <= 24; s++) { const u = s / 24; g.lineTo(lerp(x0, x1, u) + rn(u * 5, x0) * 60, lerp(y0, y1, u) + rn(u * 4 + 5, y0) * 30); }
    g.stroke();
  }

  // i nomi minori: masserie, fossi, colli, scritti piano fra le curve
  g.font = `italic 500 15px ${FONT.serif}`; g.textAlign = "left"; g.textBaseline = "middle";
  for (const [x, y, nome] of [[3390, 440, "Cascina Bruno"], [2960, 800, "Pozzo Secco"], [2590, 360, "Serra Alta"], [2150, 790, "Fosso Rosso"],
      [1690, 320, "Case Nuove"], [1200, 770, "Piano del Sale"], [790, 390, "Colle Nudo"], [500, 800, "Torrente Morto"], [170, 300, "Acquamorta Vecchia"]] as const) {
    g.fillStyle = "rgba(176,198,228,.34)"; g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill();
    g.fillStyle = "rgba(190,208,232,.42)"; g.fillText(nome, x + 10, y + 1);
  }
  // il segno di ciascuna tappa, appena percettibile: si accenderà quando la penna ci arriva
  NODI_MAPPA.forEach((nd, i) => segno(g, i, nd.x, nd.y + 40, 0.22));

  // la cornice: tacche e numeri lungo i bordi alti e bassi
  g.fillStyle = "rgba(150,175,210,.4)"; g.strokeStyle = "rgba(150,175,210,.35)"; g.lineWidth = 1.2;
  g.font = `500 12px ${FONT.mono}`; g.textAlign = "center";
  for (let x = 0; x <= MAPPA_W; x += 30) {
    const grande = x % 300 === 0, media = x % 150 === 0;
    const l = grande ? 16 : media ? 11 : 6;
    g.beginPath(); g.moveTo(x, 138); g.lineTo(x, 138 + l); g.moveTo(x, H - 138); g.lineTo(x, H - 138 - l); g.stroke();
    if (grande) { g.fillText(String(x / 30 + 400), x, 168); g.fillText(String(x / 30 + 400), x, H - 176); }
  }
  // la rosa dei venti e la scala grafica, all'inizio del cammino
  g.save(); g.translate(3390, 880);
  g.strokeStyle = "rgba(176,198,228,.36)"; g.fillStyle = "rgba(176,198,228,.22)"; g.lineWidth = 1.6;
  g.beginPath(); g.arc(0, 0, 56, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(0, 0, 40, 0, Math.PI * 2); g.stroke();
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4, lg = k % 2 === 0 ? 74 : 46;
    g.beginPath(); g.moveTo(Math.cos(a) * 10, Math.sin(a) * 10); g.lineTo(Math.cos(a) * lg, Math.sin(a) * lg); g.stroke();
  }
  g.beginPath(); g.moveTo(0, -78); g.lineTo(7, -50); g.lineTo(-7, -50); g.closePath(); g.fill();
  g.fillStyle = "rgba(176,198,228,.6)"; g.font = `600 15px ${FONT.mono}`; g.textAlign = "center"; g.fillText("N", 0, -88);
  g.restore();
  g.strokeStyle = "rgba(176,198,228,.4)"; g.fillStyle = "rgba(176,198,228,.4)"; g.lineWidth = 2;
  g.beginPath(); g.moveTo(3000, 990); g.lineTo(3240, 990); g.stroke();
  for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(3000 + k * 60, 984); g.lineTo(3000 + k * 60, 996); g.stroke(); }
  g.font = `500 12px ${FONT.mono}`; g.textAlign = "left"; g.fillText("0", 2996, 1014); g.fillText("10 km", 3226, 1014);
  g.font = `italic 500 14px ${FONT.serif}`; g.fillText("Carta dei luoghi, con la secca", 3000, 1046);

  // polvere di stelle, come il cielo che si scioglie nella carta
  const sr = rng(5);
  for (let i = 0; i < 520; i++) { g.fillStyle = `rgba(210,225,245,${0.05 + sr() * 0.12})`; g.fillRect(sr() * MAPPA_W, sr() * H, 1.6, 1.6); }
  return c;
}

export async function preparaMappa(c: Cache) {
  if (c.mappa) return;
  const fibre = fbmPeriodico(2, 6, 3, 0);
  const polvere = await riempi(64, 64, (x, y, px) => { const v = fibre(x / 64 * 6, y / 64 * 6) * 40; px[0] = 128 + v; px[1] = 136 + v; px[2] = 150 + v; px[3] = 10; });
  const s: StatoMappa = { mappa: await faiMappa(), rotta: faiRotta(), polvere };
  c.mappa = s;
}

// --------------------------------------------------------------------
//  La penna e la scena
// --------------------------------------------------------------------
export function tappaCorrente(t: number) {
  return clamp(Math.floor((t - TAPPE_T0) / TAPPE_PASSO) + 1, 0, 7);
}

function distanzaPenna(t: number, rotta: Rotta) {
  const nodi = rotta.nodi;
  if (t <= TAPPE_T0) return 0;
  const i = Math.min(nodi.length - 2, Math.floor((t - TAPPE_T0) / TAPPE_PASSO));
  const ti = TAPPE_T0 + i * TAPPE_PASSO;
  const k = easeInOut(seg(t, ti, ti + TAPPE_PASSO * 0.72));
  return lerp(nodi[i], nodi[i + 1], k);
}

function puntoA(d: number, rotta: Rotta) {
  const { pts, cum } = rotta;
  let lo = 0, hi = cum.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] < d) lo = m; else hi = m; }
  const k = (d - cum[lo]) / (cum[hi] - cum[lo] || 1);
  return { x: lerp(pts[lo].x, pts[hi].x, k), y: lerp(pts[lo].y, pts[hi].y, k), i: lo };
}

export function disegnaMappa(ctx: C2D, t: number, c: Cache) {
  const a = c.mappa as StatoMappa;
  const d = distanzaPenna(t, a.rotta);
  const penna = puntoA(d, a.rotta);
  const camX = clamp(penna.x - W * 0.52, 0, MAPPA_W - W);
  const zoom = lerp(1.06, 1.0, easeOut(seg(t, 32.8, 36)));
  ctx.save();
  camera(ctx, zoom, W / 2, H / 2);
  ctx.drawImage(a.mappa, camX, 0, W, H, 0, 0, W, H);
  ctx.translate(-camX, 0);

  const { pts, cum, nodi } = a.rotta;
  // rotta futura: tratteggio tenue
  ctx.setLineDash([2, 12]); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(200,215,235,.20)";
  ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke();
  ctx.setLineDash([]);

  // rotta percorsa: segmenti colorati per zona, con l'alone della luce dell'inchiostro
  for (let z = 0; z < 7; z++) {
    if (d <= nodi[z]) break;
    const fine = Math.min(d, nodi[z + 1]);
    const col = ZONE[z].a;
    ctx.beginPath();
    let primo = true;
    for (let i = 0; i < pts.length; i++) {
      const di = cum[i];
      if (di < nodi[z]) continue;
      if (di > fine) break;
      if (primo) { ctx.moveTo(pts[i].x, pts[i].y); primo = false; } else ctx.lineTo(pts[i].x, pts[i].y);
    }
    if (fine < nodi[z + 1]) ctx.lineTo(penna.x, penna.y);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = rgba(col, 0.16); ctx.lineWidth = 15; ctx.stroke();
    ctx.strokeStyle = rgba(col, 0.28); ctx.lineWidth = 8; ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = col; ctx.lineWidth = 3.4; ctx.stroke();
  }

  // le tappe: anello che si allarga, punto, segno acceso, nome
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
    const onda = seg(t, ti, ti + 1.3);
    ctx.strokeStyle = rgba(col, (1 - onda) * 0.7);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(n.x, n.y, 8 + onda * 62, 0, Math.PI * 2); ctx.stroke();
    ctx.globalCompositeOperation = "lighter";
    alone(ctx, n.x, n.y, 46, col, 0.5 * (1 - onda * 0.5));
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(n.x, n.y, 7 + (1 - easeOut(k)) * 6, 0, Math.PI * 2); ctx.fill();

    // etichette: alternate sopra e sotto la rotta, su un velo scuro che le stacca dalle curve
    const sopra = i % 2 === 0;
    const al = easeOut(seg(t, ti + 0.1, ti + 0.7));
    const dy = (1 - al) * 18 * (sopra ? 1 : -1);
    ctx.globalAlpha = al;
    ctx.textAlign = "center";
    if (finale) {
      const vv = ctx.createRadialGradient(n.x, n.y + 84 + dy, 10, n.x, n.y + 84 + dy, 190);
      vv.addColorStop(0, "rgba(5,8,14,.72)"); vv.addColorStop(1, "rgba(5,8,14,0)");
      ctx.fillStyle = vv; ctx.fillRect(n.x - 200, n.y + dy - 30, 400, 230);
      ctx.fillStyle = "#f0e6d8"; ctx.font = `600 22px ${FONT.mono}`; ctx.fillText("A C Q U A M O R T A", n.x, n.y + 62 + dy);
      ctx.fillStyle = "rgba(240,230,216,.62)"; ctx.font = `italic 500 26px ${FONT.serif}`; ctx.fillText("casa", n.x, n.y + 100 + dy);
    } else {
      const base = sopra ? n.y - 118 : n.y + 64;
      const vv = ctx.createRadialGradient(n.x, base + 30 + dy, 10, n.x, base + 30 + dy, 210);
      vv.addColorStop(0, "rgba(5,8,14,.74)"); vv.addColorStop(1, "rgba(5,8,14,0)");
      ctx.fillStyle = vv; ctx.fillRect(n.x - 230, base - 60 + dy, 460, 190);
      ctx.fillStyle = "rgba(200,215,235,.55)"; ctx.font = `500 17px ${FONT.mono}`; ctx.fillText(`0${i + 1}`, n.x, base + dy);
      ctx.fillStyle = col; ctx.font = `700 44px ${FONT.display}`; ctx.fillText(ZONE[i].n, n.x, base + 50 + dy);
      ctx.fillStyle = "rgba(226,234,244,.76)"; ctx.font = `italic 500 25px ${FONT.serif}`; ctx.fillText(ZONE[i].s, n.x, base + 86 + dy);
    }
    ctx.globalAlpha = 1;
  });

  // le tappe già toccate accendono il loro segno di cartografo
  NODI_MAPPA.forEach((n, i) => {
    const ti = TAPPE_T0 + i * TAPPE_PASSO;
    const k = easeOut(seg(t, ti + 0.2, ti + 1.1));
    if (k <= 0) return;
    const col = i === 7 ? "#f0e6d8" : ZONE[i].a;
    ctx.save(); ctx.globalAlpha = k * 0.85;
    const cv = creaSegnoAcceso(i, col);
    ctx.drawImage(cv, n.x - 260, n.y + 40 - 110);
    ctx.restore();
  });

  // la punta della penna, con una piccola scia
  if (t > TAPPE_T0 && t < TAPPE_T0 + 7 * TAPPE_PASSO + 0.4) {
    ctx.globalCompositeOperation = "lighter";
    alone(ctx, penna.x, penna.y, 70, "#ffffff", 0.42);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(penna.x, penna.y, 3.6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// il segno di ogni tappa, ridisegnato nel colore della zona (una sola volta per colore)
const ACCESI = new Map<string, HTMLCanvasElement>();
function creaSegnoAcceso(i: number, col: string): HTMLCanvasElement {
  const chiave = `${i}${col}`;
  let cv = ACCESI.get(chiave);
  if (cv) return cv;
  cv = creaTela(520, 260);
  const g = ctxDi(cv);
  const [r, gg, b] = hexRgb(col.length === 7 ? col : "#ffffff");
  // si riusa lo stesso disegno, ricolorando: si traccia in bianco e si tinge
  const tmp = creaTela(520, 260), tg = ctxDi(tmp);
  segno(tg, i, 260, 110, 1);
  g.drawImage(tmp, 0, 0);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = `rgb(${r},${gg},${b})`; g.fillRect(0, 0, 520, 260);
  ACCESI.set(chiave, cv);
  return cv;
}
