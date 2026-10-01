// ====================================================================
//  A · LE LETTERE
// --------------------------------------------------------------------
//  Dall'alto, sul tavolo: quattro lettere in corsivo arrivano una dopo
//  l'altra (la mano di sua moglie, fitta, con le notizie del bambino in
//  fondo), poi il vuoto, poi il biglietto in stampatello. Il legno, la
//  carta, l'inchiostro, la busta con il francobollo e la penna sono
//  dipinti una volta sola; a ogni fotogramma cadono, si posano, si
//  riempiono di scrittura, e la luce si stringe sul biglietto.
// ====================================================================
import { W, H, LETTERE, BIGLIETTO } from "../scaletta";
import { clamp, easeInOut, easeOut, expoOut, lerp, rng, seg } from "../tempo";
import type { Cache } from "../cache";
import { camera, pulviscolo, type C2D } from "../pittura";
import { carta, scriviLettera, scriviRiga } from "../scritta";
import { creaTela, ctxDi, fbmPeriodico, hexRgb, perlin, riempi, type Tela } from "../texture";
import { FONT } from "../font";

export const POSIZIONI_LETTERE = [
  { x: 720, y: 470, r: -0.13, d: "14 marzo" },
  { x: 1140, y: 505, r: 0.09, d: "2 maggio" },
  { x: 860, y: 600, r: -0.04, d: "19 luglio" },
  { x: 1210, y: 400, r: 0.16, d: "11 ottobre" },
];

const FW = 520, FH = 350, RES = 1.5;
const BW = 430, BH = 190;

interface StatoLettere { tavolo: Tela; fogli: Tela[]; inchiostri: Tela[]; biglietto: Tela; busta: Tela; penna: Tela; macchia: Tela }

// --------------------------------------------------------------------
//  Il tavolo: assi di noce, venature, nodi, graffi, l'anello di un bicchiere
// --------------------------------------------------------------------
async function tavoloTela(): Promise<Tela> {
  const w = 960, h = 540;
  const gran = fbmPeriodico(41, 4, 5, 0);
  const fibre = perlin(7);
  const assi = 4, hh = h / assi;
  const base = [hexRgb("#4a3020"), hexRgb("#3f281a"), hexRgb("#523625"), hexRgb("#3a2517")];
  const nodi = [{ x: 220, y: 70, r: 34 }, { x: 700, y: 330, r: 40 }, { x: 430, y: 470, r: 26 }];
  const t = await riempi(w, h, (x, y, px) => {
    const a = Math.min(assi - 1, Math.floor(y / hh)), yl = y - a * hh;
    const col = base[a];
    // andamento delle venature: righe che ondeggiano piano
    let v = (yl * 0.32 + gran(x * 0.006, y * 0.03) * 22 + fibre(x * 0.004, a * 7.3) * 9);
    // i nodi: anelli concentrici che deviano le fibre
    for (const n of nodi) {
      const dx = (x - n.x) / 1.6, dy = y - n.y, d = Math.hypot(dx, dy);
      if (d < n.r * 2.2) v += Math.sin(d * 0.5) * 3.2 * (1 - d / (n.r * 2.2)) + (d < n.r ? 3 : 0);
    }
    const strisce = 0.5 + 0.5 * Math.sin(v);
    const grana = fibre(x * 0.05, y * 0.8) * 10 + fibre(x * 0.18, y * 0.35) * 5;
    const chiaro = strisce * 30 + grana;
    let r = col[0] + chiaro, g = col[1] + chiaro * 0.78, b = col[2] + chiaro * 0.6;
    // le commessure fra le assi: una riga scura e un filo di luce
    if (yl < 1.6) { r *= 0.35; g *= 0.35; b *= 0.35; }
    else if (yl < 3) { r += 14; g += 9; b += 5; }
    px[0] = r; px[1] = g; px[2] = b;
  });
  const g = ctxDi(t), r = rng(5);
  g.lineCap = "round";
  for (let i = 0; i < 70; i++) {                         // graffi
    const x = r() * w, y = r() * h, l = 8 + r() * 46, a = (r() - 0.5) * 0.5;
    g.strokeStyle = `rgba(230,190,140,${0.05 + r() * 0.1})`; g.lineWidth = 0.6 + r() * 0.9;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  return t;
}

/** L'anello lasciato da un bicchiere: due cerchi scuri, il secondo più sottile. */
function macchiaTela(): Tela {
  const t = creaTela(240, 240), g = ctxDi(t);
  g.translate(120, 120);
  for (const [rr, a, lw] of [[84, 0.22, 7], [79, 0.10, 3], [70, 0.06, 9]] as const) {
    g.strokeStyle = `rgba(10,5,2,${a})`; g.lineWidth = lw;
    g.beginPath(); g.ellipse(0, 0, rr, rr * 0.96, 0.3, 0.2, Math.PI * 2 - 0.35); g.stroke();
  }
  return t;
}

// --------------------------------------------------------------------
//  La busta (con francobollo e timbro) e la penna stilografica
// --------------------------------------------------------------------
async function bustaTela(): Promise<Tela> {
  const w = 470, h = 300, k = RES;
  const t = creaTela(w * k, h * k), g = ctxDi(t);
  g.scale(k, k);
  const cart = await carta({ w: w * k, h: h * k, seme: 91, chiara: "#e9dcbf", scura: "#cbb98f", invecchiata: 0.7 });
  g.drawImage(cart, 0, 0, w, h);
  // patta: due lembi obliqui che si incontrano sul centro, con la loro ombra
  g.strokeStyle = "rgba(70,50,25,.35)"; g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(0, 0); g.lineTo(w / 2, h * 0.56); g.lineTo(w, 0); g.stroke();
  g.beginPath(); g.moveTo(0, h); g.lineTo(w * 0.42, h * 0.52); g.moveTo(w, h); g.lineTo(w * 0.58, h * 0.52); g.stroke();
  const om = g.createLinearGradient(0, 0, 0, h * 0.62);
  om.addColorStop(0, "rgba(60,40,20,.10)"); om.addColorStop(1, "rgba(60,40,20,0)");
  g.fillStyle = om; g.beginPath(); g.moveTo(0, 0); g.lineTo(w / 2, h * 0.56); g.lineTo(w, 0); g.closePath(); g.fill();
  // l'indirizzo, in corsivo blu
  const r = rng(12);
  for (let i = 0; i < 3; i++) scriviRiga(g, r, { x: 96, y: 150 + i * 34, larghezza: 230 - i * 40, altezzaX: 8, inchiostro: "rgba(28,40,84,.85)", spessore: 1.9 });
  // il francobollo: bordo dentellato, cornice, un profilo e il valore
  const sx = w - 108, sy = 26, sw = 66, sh = 82;
  g.fillStyle = "#f1e8d2"; g.fillRect(sx - 4, sy - 4, sw + 8, sh + 8);
  g.fillStyle = "#d9e3ea";
  for (let x = 0; x < sw + 8; x += 7) { g.beginPath(); g.arc(sx - 4 + x + 3.5, sy - 4, 2.6, 0, Math.PI * 2); g.arc(sx - 4 + x + 3.5, sy + sh + 4, 2.6, 0, Math.PI * 2); g.fill(); }
  for (let y = 0; y < sh + 8; y += 7) { g.beginPath(); g.arc(sx - 4, sy - 4 + y + 3.5, 2.6, 0, Math.PI * 2); g.arc(sx + sw + 4, sy - 4 + y + 3.5, 2.6, 0, Math.PI * 2); g.fill(); }
  const fs = g.createLinearGradient(sx, sy, sx, sy + sh);
  fs.addColorStop(0, "#3d5f87"); fs.addColorStop(1, "#243f63");
  g.fillStyle = fs; g.fillRect(sx, sy, sw, sh);
  g.strokeStyle = "rgba(240,225,190,.75)"; g.lineWidth = 1.4; g.strokeRect(sx + 4, sy + 4, sw - 8, sh - 8);
  g.fillStyle = "rgba(240,225,190,.85)";
  g.beginPath(); g.arc(sx + sw / 2, sy + 34, 15, 0, Math.PI * 2); g.fill();                      // testa
  g.beginPath(); g.ellipse(sx + sw / 2, sy + 68, 22, 15, 0, Math.PI, 0); g.fill();               // spalle
  g.fillStyle = "#243f63"; g.font = `700 11px ${FONT.mono}`; g.textAlign = "center"; g.fillText("60", sx + sw / 2, sy + sh - 10);
  // il timbro: cerchio con l'anno e le righe ondulate che passano sul francobollo
  g.strokeStyle = "rgba(30,24,30,.6)"; g.lineWidth = 1.6;
  g.beginPath(); g.arc(sx - 30, sy + 66, 36, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(sx - 30, sy + 66, 28, 0, Math.PI * 2); g.stroke();
  g.fillStyle = "rgba(30,24,30,.6)"; g.font = `700 9px ${FONT.mono}`; g.textAlign = "center";
  g.fillText("ACQUAVIVA", sx - 30, sy + 60); g.fillText("· 14 · III ·", sx - 30, sy + 74);
  for (let i = 0; i < 4; i++) {
    g.beginPath(); g.moveTo(sx - 12, sy + 20 + i * 8);
    for (let x = 0; x <= 96; x += 6) g.lineTo(sx - 12 + x, sy + 20 + i * 8 + Math.sin(x * 0.5 + i) * 2);
    g.stroke();
  }
  return t;
}

function pennaTela(): Tela {
  const w = 380, h = 44, k = 2;
  const t = creaTela(w * k, h * k), g = ctxDi(t);
  g.scale(k, k);
  const corpo = g.createLinearGradient(0, 8, 0, 36);
  corpo.addColorStop(0, "#3a3540"); corpo.addColorStop(0.35, "#15111a"); corpo.addColorStop(0.7, "#0a070d"); corpo.addColorStop(1, "#262230");
  g.fillStyle = corpo;
  g.beginPath(); g.moveTo(22, 12); g.lineTo(268, 9); g.quadraticCurveTo(280, 22, 268, 35); g.lineTo(22, 32); g.quadraticCurveTo(10, 22, 22, 12); g.fill();
  g.fillStyle = "rgba(255,255,255,.22)"; g.fillRect(28, 13, 236, 2.2);                      // riflesso lungo
  const oro = g.createLinearGradient(0, 10, 0, 34);
  oro.addColorStop(0, "#f2d98a"); oro.addColorStop(0.5, "#b88a3a"); oro.addColorStop(1, "#f0d58a");
  g.fillStyle = oro; g.fillRect(150, 10, 6, 22); g.fillRect(200, 10, 3, 22);               // fascette d'oro
  g.beginPath(); g.moveTo(168, 9); g.lineTo(230, 9); g.lineTo(236, 16); g.lineTo(168, 15); g.closePath(); g.fill();   // il fermaglio
  // la sezione con la punta
  g.fillStyle = "#1b171f"; g.beginPath(); g.moveTo(268, 13); g.lineTo(322, 18); g.lineTo(322, 26); g.lineTo(268, 31); g.closePath(); g.fill();
  g.fillStyle = oro; g.beginPath(); g.moveTo(322, 16); g.lineTo(372, 22); g.lineTo(322, 28); g.closePath(); g.fill();
  g.strokeStyle = "#5a431a"; g.lineWidth = 0.8; g.beginPath(); g.moveTo(326, 22); g.lineTo(368, 22); g.stroke();
  return t;
}

async function bigliettoTela(): Promise<Tela> {
  const k = RES;
  const t = creaTela(BW * k, BH * k), g = ctxDi(t);
  const base = await carta({ w: BW * k, h: BH * k, seme: 33, chiara: "#d9d5cc", scura: "#bdb8ae", invecchiata: 0.45, piegaVerticale: false });
  g.save();
  g.scale(k, k);
  // margine superiore strappato da un quaderno: dentini irregolari
  g.beginPath(); g.moveTo(0, 6);
  const r = rng(6);
  for (let x = 0; x <= BW; x += 6) g.lineTo(x, 4 + (r() - 0.5) * 6);
  g.lineTo(BW, BH); g.lineTo(0, BH); g.closePath(); g.clip();
  g.drawImage(base, 0, 0, BW, BH);
  // una riga di quaderno, appena visibile, e una piega
  g.strokeStyle = "rgba(90,110,150,.18)"; g.lineWidth = 1;
  for (let y = 46; y < BH; y += 30) { g.beginPath(); g.moveTo(0, y); g.lineTo(BW, y); g.stroke(); }
  g.restore();
  return t;
}

// --------------------------------------------------------------------
//  Precalcolo
// --------------------------------------------------------------------
export async function preparaLettere(c: Cache) {
  if (c.lettere) return;
  const fogli: Tela[] = [], inchiostri: Tela[] = [];
  const toni = [["#efe6d1", "#d8ccb0"], ["#ece3cd", "#d3c5a8"], ["#f0e7d3", "#dccfb3"], ["#e9dfc8", "#d0c2a3"]];
  for (let i = 0; i < 4; i++) {
    fogli.push(await carta({ w: FW * RES, h: FH * RES, seme: 200 + i, chiara: toni[i][0], scura: toni[i][1], invecchiata: 0.6, piegheOrizzontali: 2, piegaVerticale: i % 2 === 0 }));
    inchiostri.push(scriviLettera(FW * RES, FH * RES, 300 + i, "rgba(30,44,86,.86)"));
  }
  // le lettere sono scritte a risoluzione piena: la geometria delle righe va scalata
  c.lettere = {
    tavolo: await tavoloTela(), fogli, inchiostri, biglietto: await bigliettoTela(), busta: await bustaTela(), penna: pennaTela(), macchia: macchiaTela(),
  } satisfies StatoLettere;
}

// --------------------------------------------------------------------
//  Un foglio che cade e si posa
// --------------------------------------------------------------------
function foglio(ctx: C2D, tela: Tela, w: number, h: number, x: number, y: number, rot: number, quota: number) {
  // quota 0 = posato, 1 = in aria: ombra più morbida e lontana, foglio un poco più grande
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot);
  const s = 1 + quota * 0.10;
  ctx.scale(s, s);
  ctx.shadowColor = "rgba(0,0,0,.62)"; ctx.shadowBlur = 16 + quota * 34; ctx.shadowOffsetX = 5 + quota * 18; ctx.shadowOffsetY = 8 + quota * 30;
  ctx.drawImage(tela, -w / 2, -h / 2, w, h);
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
  // un velo di luce che gira con la piega mentre il foglio scende
  if (quota > 0.02) {
    const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    g.addColorStop(0, `rgba(255,236,200,${0.2 * quota})`); g.addColorStop(1, `rgba(0,0,0,${0.22 * quota})`);
    ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
  }
  ctx.restore();
}

// --------------------------------------------------------------------
//  La scena
// --------------------------------------------------------------------
export function disegnaLettere(ctx: C2D, t: number, c: Cache) {
  const a = c.lettere as StatoLettere;
  // il legno, illuminato dal basso a sinistra come da una lampada fuori campo
  ctx.drawImage(a.tavolo, 0, 0, W, H);
  const lampada = 0.96 + 0.04 * Math.sin(t * 7.1) * Math.sin(t * 2.3);
  const gl = ctx.createRadialGradient(W * 0.50, H * 0.46, 40, W * 0.5, H * 0.5, W * 0.72);
  gl.addColorStop(0, `rgba(255,214,150,${0.34 * lampada})`); gl.addColorStop(0.5, "rgba(255,180,100,.06)"); gl.addColorStop(1, "rgba(0,0,0,.72)");
  ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);

  ctx.save();
  camera(ctx, lerp(1.0, 1.1, easeInOut(seg(t, 0, 9.6))), W / 2, H * 0.58);

  // sul tavolo, già da prima: l'anello di un bicchiere, la busta, la penna
  ctx.drawImage(a.macchia, 1320, 190, 300, 300);
  ctx.save(); ctx.translate(430, 660); ctx.rotate(-0.24);
  ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 20; ctx.shadowOffsetX = 6; ctx.shadowOffsetY = 10;
  ctx.drawImage(a.busta, -235, -150, 470, 300);
  ctx.restore();
  ctx.save(); ctx.translate(1500, 790); ctx.rotate(-0.34);
  ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 14; ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 9;
  ctx.drawImage(a.penna, -190, -22, 380, 44);
  ctx.restore();

  // le quattro lettere
  POSIZIONI_LETTERE.forEach((p, i) => {
    const ta = LETTERE[i];
    const k = expoOut(seg(t, ta, ta + 0.85));
    if (k <= 0) return;
    const y = lerp(-420, p.y, k), rot = lerp(p.r - 0.35, p.r, k);
    foglio(ctx, a.fogli[i], FW, FH, p.x, y, rot, 1 - easeOut(seg(t, ta + 0.4, ta + 0.9)) * (k >= 0.99 ? 1 : 0.9));
    // la scrittura: le righe compaiono dopo l'atterraggio, una alla volta
    ctx.save();
    ctx.translate(p.x, y); ctx.rotate(rot); ctx.translate(-FW / 2, -FH / 2);
    const scr = seg(t, ta + 0.5, ta + 1.9);
    const ink = a.inchiostri[i];
    const righe = Math.floor((FH - 96 - 40) / 27);
    for (let j = 0; j < righe; j++) {
      const kj = clamp(scr * righe - j);
      if (kj <= 0) continue;
      const top = 96 + j * 27 - 20, alt = 30;
      const sw = Math.min(FW, 40 + kj * 440);
      ctx.drawImage(ink, 0, top * RES, sw * RES, alt * RES, 0, top, sw, alt);
    }
    ctx.globalAlpha = clamp(scr * 3);
    ctx.fillStyle = "rgba(30,44,86,.88)";
    ctx.font = `italic 500 24px ${FONT.serif}`;
    ctx.textAlign = "right"; ctx.fillText(p.d, 480, 52);
    ctx.textAlign = "left"; ctx.fillText("Caro mio,", 46, 72);
    ctx.globalAlpha = 1;
    ctx.restore();
  });

  // il biglietto: carta più povera, stampatello a mano
  const kb = expoOut(seg(t, BIGLIETTO.arriva, BIGLIETTO.arriva + 0.8));
  if (kb > 0) {
    const bx = lerp(1500, 980, kb), by = lerp(1250, 730, kb), br = lerp(0.3, -0.03, kb);
    foglio(ctx, a.biglietto, BW, BH, bx, by, br, 1 - kb);
    ctx.save();
    ctx.translate(bx, by); ctx.rotate(br);
    ctx.fillStyle = "#15171c";
    ctx.font = `800 35px ${FONT.display}`;
    ctx.textBaseline = "middle";
    let n = 0;
    BIGLIETTO.testo.forEach((riga, ri) => {
      const r = rng(40 + ri);
      let x = -ctx.measureText(riga).width / 2 - riga.length * 0.8;
      for (const ch of riga) {
        const tc = BIGLIETTO.scrive + n * BIGLIETTO.perCarattere;
        const w = ctx.measureText(ch).width;
        if (t >= tc) {
          const kk = easeOut(seg(t, tc, tc + 0.12));
          ctx.save();
          ctx.translate(x + w / 2, (ri === 0 ? -24 : 26) + (r() - 0.5) * 4);
          ctx.rotate((r() - 0.5) * 0.10);
          ctx.globalAlpha = kk * (0.80 + r() * 0.2);
          ctx.scale(1 + (1 - kk) * 0.4, 1 + (1 - kk) * 0.4);
          ctx.shadowColor = "rgba(20,22,30,.6)"; ctx.shadowBlur = 1.4;
          ctx.fillText(ch, -w / 2, 0);
          ctx.restore();
        } else { r(); r(); }
        x += w + 1.6;
        n++;
      }
      n += 4;
    });
    ctx.restore();
  }
  ctx.restore();

  // pulviscolo di carta nella luce della lampada
  ctx.globalCompositeOperation = "lighter";
  pulviscolo(ctx, t, 17, 46, { x: 300, y: 200, w: 1300, h: 700 }, "#ffd7a0", 0.5, 2.2);
  ctx.globalCompositeOperation = "source-over";

  // occhio di bue sul biglietto: il resto del tavolo si spegne
  const buio = easeInOut(seg(t, 5.0, 7.2));
  if (buio > 0) {
    const cx = kb > 0 ? 980 : W / 2, cy = kb > 0 ? 720 : H / 2;
    const gg = ctx.createRadialGradient(cx, cy, 120, cx, cy, 900);
    gg.addColorStop(0, "rgba(0,0,0,0)");
    gg.addColorStop(0.45, `rgba(0,0,0,${0.35 * buio})`);
    gg.addColorStop(1, `rgba(0,0,0,${0.84 * buio})`);
    ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H);
  }
}
