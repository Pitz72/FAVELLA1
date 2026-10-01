// ====================================================================
//  B / J · L'ALBA  (anche sfondo del titolo)
// --------------------------------------------------------------------
//  Campo lunghissimo: una provinciale dritta, i pali del telegrafo, la
//  piana secca e quattro catene di monti che si perdono nella foschia. Il
//  sole basso a destra scalda le nuvole da sotto; il viandante va verso
//  ovest con la sua ombra lunga davanti. Il cielo, le nuvole e i monti si
//  dipingono una volta sola; a ogni fotogramma si spostano e si accendono.
// ====================================================================
import { W, H, CAMMINATE, faseDiPasso } from "../scaletta";
import { clamp, lerp, mix, rng, rgba, seg, easeInOut, easeOut } from "../tempo";
import type { Cache } from "../cache";
import { alone, camera, catenaScorre, cielo, crinale, nuvole, nuvoleScorrono, pulviscolo, type C2D } from "../pittura";
import { creaTela, ctxDi, fbmPeriodico, hexRgb, rgbCss, riempi, smooth, sfoca, type Tela } from "../texture";
import { disegnaOmbra, disegnaViandante, velocitaSuolo } from "../viandante";

const ORIZZONTE = 700;
const STRADA = 858;
const LARGH_CIELO = 1920;

const CATENE = [
  { seme: 101, base: 128, ampiezza: 104, frequenza: 2.0, aspro: 0.62, chiaro: "#f2b697", scuro: "#8b6482", nebbia: "#eba482", forza: 0.78, grana: 0.22, y: 546, par: 0.10 },
  { seme: 202, base: 108, ampiezza: 80, frequenza: 3.4, aspro: 0.38, chiaro: "#cf8f8c", scuro: "#4c4066", nebbia: "#c98b82", forza: 0.62, grana: 0.26, y: 584, par: 0.22 },
  { seme: 303, base: 88, ampiezza: 56, frequenza: 5.0, aspro: 0.22, chiaro: "#80576f", scuro: "#241e38", nebbia: "#80596f", forza: 0.46, grana: 0.28, y: 624, par: 0.42 },
  { seme: 404, base: 68, ampiezza: 34, frequenza: 7.5, aspro: 0.10, chiaro: "#443248", scuro: "#110f1b", nebbia: "#3c2d45", forza: 0.26, grana: 0.20, y: 656, par: 0.70 },
] as const;

interface StatoAlba {
  nubiAlte: Tela; nubiBasse: Tela; monti: Tela[]; erbaFar: Tela; erbaNear: Tela; asfalto: Tela; nebbia: Tela; campo: Tela; sagome: Tela;
}

// --------------------------------------------------------------------
//  Precalcolo
// --------------------------------------------------------------------
function ciuffi(seme: number, w: number, h: number, n: number, altMin: number, altMax: number, base: string, punta: string, vento: number): Tela {
  const t = creaTela(w, h), g = ctxDi(t), r = rng(seme);
  g.lineCap = "round";
  // n ciuffi in tutta la larghezza; quelli vicini ai bordi si ripetono dall'altra parte: la tessera si salda
  for (let i = 0; i < n; i++) {
    const x = r() * w, alt = altMin + r() * (altMax - altMin);
    const lame = 3 + Math.floor(r() * 5);
    const lam = Array.from({ length: lame }, () => ({ ang: (r() - 0.5) * 0.9 + vento, dx: (r() - 0.5) * 9, lw: 1.1 + r() * 1.5, k: 0.7 + r() * 0.3 }));
    for (const shift of [0, -w, w]) {
      if (x + shift < -40 || x + shift > w + 40) continue;
      for (const l of lam) {
        const ox = x + shift + l.dx;
        const gx = ox + Math.sin(l.ang) * alt, gy = h - Math.cos(l.ang) * alt * l.k;
        g.strokeStyle = base; g.lineWidth = l.lw;
        g.beginPath(); g.moveTo(ox, h + 2); g.quadraticCurveTo(ox + (gx - ox) * 0.2, h - alt * 0.6, gx, gy); g.stroke();
        g.strokeStyle = punta; g.lineWidth = 0.9;
        g.beginPath(); g.moveTo(lerp(ox, gx, 0.72), lerp(h, gy, 0.72)); g.lineTo(gx, gy); g.stroke();
      }
    }
  }
  return t;
}

async function asfaltoTela(): Promise<Tela> {
  const w = LARGH_CIELO, h = 64;
  const t = creaTela(w, h), g = ctxDi(t), r = rng(77);
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, "#41373d"); gr.addColorStop(0.5, "#332b31"); gr.addColorStop(1, "#231e24");
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  // grana dell'asfalto: pietrisco e macchie
  const n = fbmPeriodico(5, 12, 4);
  const grana = await riempi(w, h, (x, y, px) => {
    const v = n((x / w) * 12, y / 16) * 0.5;
    const s = (r() - 0.5) * 34 + v * 30;
    px[0] = 128 + s; px[1] = 124 + s; px[2] = 132 + s; px[3] = 34;
  });
  g.drawImage(grana, 0, 0);
  // crepe e rattoppi
  g.strokeStyle = "rgba(8,6,10,.55)"; g.lineCap = "round";
  for (let i = 0; i < 26; i++) {
    let x = r() * w, y = 6 + r() * (h - 12);
    g.lineWidth = 0.8 + r() * 1.2; g.beginPath(); g.moveTo(x, y);
    const len = 40 + r() * 140;
    for (let s = 0; s < 8; s++) { x += len / 8; y += (r() - 0.5) * 6; g.lineTo(x, Math.max(2, Math.min(h - 2, y))); }
    g.stroke();
  }
  for (let i = 0; i < 4; i++) {
    g.fillStyle = "rgba(10,8,12,.35)"; g.fillRect(r() * w, 14 + r() * 30, 90 + r() * 120, 8 + r() * 14);
  }
  // mezzeria consumata e riga di margine
  g.fillStyle = "rgba(230,214,170,.30)";
  for (let x = 40; x < w; x += 190) g.fillRect(x, h * 0.52, 88, 3);
  g.fillStyle = "rgba(230,214,170,.16)"; g.fillRect(0, 5, w, 2);
  // bordo chiaro verso il sole (la banchina)
  g.fillStyle = "rgba(255,190,130,.18)"; g.fillRect(0, 0, w, 2);
  return t;
}

async function nebbiaTela(): Promise<Tela> {
  const w = LARGH_CIELO, h = 150;
  const n = fbmPeriodico(9, 6, 4);
  return await riempi(w, h, (x, y, px) => {
    const u = (x / w) * 6;
    const d = n(u, y / 60) * 0.5 + 0.5;
    const fade = Math.sin((y / h) * Math.PI);
    px[0] = 255; px[1] = 172; px[2] = 128;
    px[3] = clamp(d * d * 1.5 - 0.15) * fade * 200;
  });
}

async function campoTela(): Promise<Tela> {
  // la piana secca: dalla foschia dell'orizzonte alla terra scura, con strisce d'erba
  // riarsa e file di ciuffi che crescono col vicino
  const w = LARGH_CIELO, h = 190;
  const t = creaTela(w, h), g = ctxDi(t), r = rng(31);
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, "#5a4247"); gr.addColorStop(0.18, "#3a2c3a"); gr.addColorStop(0.55, "#211a27"); gr.addColorStop(1, "#110d15");
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  // strisce lunghe e sottili: solchi, erba distesa, terra smossa
  const n = fbmPeriodico(21, 8, 4);
  const strisce = await riempi(w, h, (x, y, px) => {
    const v = n((x / w) * 8, y / 11);
    const chiara = v > 0;
    px[0] = chiara ? 230 : 6; px[1] = chiara ? 150 : 4; px[2] = chiara ? 105 : 10;
    px[3] = Math.abs(v) * (chiara ? 95 : 130) * (1 - y / h * 0.6);
  });
  g.drawImage(strisce, 0, 0);
  // file di ciuffi: piccoli in alto, grandi in basso
  for (let i = 0; i < 700; i++) {
    const k = Math.pow(r(), 0.7);
    const y = 4 + k * (h - 10), x = r() * w, alt = 2.5 + k * 14 + r() * 3;
    const lame = 3 + Math.floor(r() * 3);
    for (let b = 0; b < lame; b++) {
      const dx = (b - lame / 2) * (0.8 + k * 1.4) + (r() - 0.5);
      g.strokeStyle = `rgba(16,11,20,${0.55 + r() * 0.35})`; g.lineWidth = 0.8 + k * 1.1;
      g.beginPath(); g.moveTo(x + dx, y); g.quadraticCurveTo(x + dx + (r() - 0.5) * alt * 0.5, y - alt * 0.6, x + dx * 1.8 + (r() - 0.5) * alt * 0.6, y - alt); g.stroke();
      g.strokeStyle = `rgba(255,165,105,${0.16 + r() * 0.18})`; g.lineWidth = 0.7;
      g.beginPath(); g.moveTo(x + dx * 1.6, y - alt * 0.6); g.lineTo(x + dx * 1.8 + (r() - 0.5) * alt * 0.6, y - alt); g.stroke();
    }
  }
  return t;
}

/** Sagome sull'orizzonte: masserie, cipressi, una pompa a vento. Una fascia che si ripete. */
function sagomeTela(): Tela {
  const w = LARGH_CIELO, h = 150, y0 = 132;
  const t = creaTela(w, h), g = ctxDi(t), r = rng(64);
  const col = "#2b2032", luce = "rgba(255,168,110,.5)";
  const masseria = (x: number, s: number) => {
    g.fillStyle = col;
    const cw = 100 * s, ch = 30 * s;
    g.fillRect(x, y0 - ch, cw, ch);                                      // il corpo
    g.beginPath(); g.moveTo(x - 4 * s, y0 - ch); g.lineTo(x + cw * 0.5, y0 - ch - 14 * s); g.lineTo(x + cw + 4 * s, y0 - ch); g.closePath(); g.fill();   // il tetto
    g.fillRect(x + cw * 0.72, y0 - ch - 40 * s, 22 * s, 42 * s);        // la torretta
    g.beginPath(); g.moveTo(x + cw * 0.72 - 3 * s, y0 - ch - 40 * s); g.lineTo(x + cw * 0.72 + 11 * s, y0 - ch - 54 * s); g.lineTo(x + cw * 0.72 + 25 * s, y0 - ch - 40 * s); g.closePath(); g.fill();
    g.fillRect(x + cw + 2 * s, y0 - 22 * s, 36 * s, 22 * s);             // una tettoia
    g.strokeStyle = luce; g.lineWidth = 1.2 * s;                          // luce sul lato del sole
    g.beginPath(); g.moveTo(x + cw + 4 * s, y0 - ch); g.lineTo(x + cw + 4 * s, y0); g.moveTo(x + cw * 0.72 + 22 * s, y0 - ch - 38 * s); g.lineTo(x + cw * 0.72 + 22 * s, y0 - ch); g.stroke();
    g.fillStyle = "rgba(255,196,120,.9)"; g.fillRect(x + 22 * s, y0 - ch + 9 * s, 5 * s, 8 * s);   // una finestra accesa
  };
  const cipresso = (x: number, s: number) => {
    g.fillStyle = col;
    g.beginPath(); g.moveTo(x, y0); g.quadraticCurveTo(x - 8 * s, y0 - 30 * s, x, y0 - 64 * s); g.quadraticCurveTo(x + 8 * s, y0 - 30 * s, x, y0); g.fill();
    g.strokeStyle = luce; g.lineWidth = 1.1 * s; g.beginPath(); g.moveTo(x + 2.5 * s, y0 - 4 * s); g.quadraticCurveTo(x + 6 * s, y0 - 30 * s, x + 1 * s, y0 - 62 * s); g.stroke();
  };
  const eolica = (x: number, s: number) => {
    g.strokeStyle = col; g.lineWidth = 2 * s; g.lineCap = "round";
    g.beginPath(); g.moveTo(x - 9 * s, y0); g.lineTo(x - 1.5 * s, y0 - 66 * s); g.moveTo(x + 9 * s, y0); g.lineTo(x + 1.5 * s, y0 - 66 * s);
    g.moveTo(x - 7 * s, y0 - 18 * s); g.lineTo(x + 7 * s, y0 - 18 * s); g.moveTo(x - 5 * s, y0 - 40 * s); g.lineTo(x + 5 * s, y0 - 40 * s); g.stroke();
    g.lineWidth = 1.4 * s;
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      g.beginPath(); g.moveTo(x, y0 - 70 * s); g.lineTo(x + Math.cos(a) * 20 * s, y0 - 70 * s + Math.sin(a) * 20 * s); g.stroke();
    }
    g.beginPath(); g.arc(x, y0 - 70 * s, 20 * s, 0, Math.PI * 2); g.stroke();
    g.fillStyle = col; g.beginPath(); g.moveTo(x, y0 - 70 * s); g.lineTo(x + 34 * s, y0 - 76 * s); g.lineTo(x + 34 * s, y0 - 64 * s); g.closePath(); g.fill();   // la coda
  };
  masseria(120, 1.0); cipresso(60, 1.0); cipresso(82, 0.85); cipresso(250, 0.9);
  eolica(520, 0.9);
  masseria(860, 0.7); cipresso(985, 0.7); cipresso(1000, 0.6);
  for (let i = 0; i < 7; i++) cipresso(1120 + i * 22 + r() * 6, 0.55 + r() * 0.15);       // il filare
  masseria(1420, 1.15); cipresso(1560, 1.0); cipresso(1580, 1.1); cipresso(1604, 0.9);
  eolica(1780, 0.75);
  // fusione col fondo: i piedi si perdono nella foschia
  const gr = g.createLinearGradient(0, y0 - 6, 0, y0 + 14);
  gr.addColorStop(0, "rgba(90,66,71,0)"); gr.addColorStop(1, "rgba(90,66,71,0.95)");
  g.fillStyle = gr; g.fillRect(0, y0 - 6, w, 20);
  return t;
}

export async function preparaAlba(c: Cache) {
  if (c.alba) return;
  const monti: Tela[] = [];
  for (const k of CATENE) monti.push(await crinale({
    seme: k.seme, larghezza: 3840, altezza: 250, base: k.base, ampiezza: k.ampiezza, frequenza: k.frequenza, aspro: k.aspro, luce: 1,
    chiaro: k.chiaro, scuro: k.scuro, nebbia: k.nebbia, nebbiaForza: k.forza, grana: k.grana,
  }));
  const a: StatoAlba = {
    nubiAlte: await nuvole({
      seme: 11, w: 960, h: 330, scalaX: 2.7, scalaY: 1, copertura: 0.40, morbidezza: 0.20, sole: [1, 0.25],
      chiaro: "#ffc59a", scuro: "#5a5487", alto: 0.30, basso: 0.60,
    }),
    nubiBasse: await nuvole({
      seme: 23, w: 960, h: 190, scalaX: 3.6, scalaY: 1, copertura: 0.38, morbidezza: 0.18, sole: [1, 0.15],
      chiaro: "#ffdca8", scuro: "#6a5476", alto: 0.34, basso: 0.55,
    }),
    monti,
    erbaFar: ciuffi(41, LARGH_CIELO, 60, 2600, 8, 22, "#1a121d", "#b56f56", 0.25),
    erbaNear: ciuffi(43, LARGH_CIELO, 150, 800, 30, 96, "#0d0a10", "#e0925f", 0.22),
    asfalto: await asfaltoTela(),
    nebbia: await nebbiaTela(),
    campo: await campoTela(),
    sagome: sagomeTela(),
  };
  c.alba = a;
}

// --------------------------------------------------------------------
//  I pali del telegrafo, con isolatori e fili che pendono
// --------------------------------------------------------------------
function palo(ctx: C2D, x: number, yBase: number, alto: number, col: string, rim: string, s: number) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x - 4.4 * s, yBase); ctx.lineTo(x - 2.5 * s, yBase - alto); ctx.lineTo(x + 2.5 * s, yBase - alto); ctx.lineTo(x + 4.4 * s, yBase);
  ctx.closePath(); ctx.fill();
  // due traverse, la superiore più lunga; controventi
  ctx.fillRect(x - 40 * s, yBase - alto + 8 * s, 80 * s, 5 * s);
  ctx.fillRect(x - 27 * s, yBase - alto + 34 * s, 54 * s, 4 * s);
  ctx.strokeStyle = col; ctx.lineWidth = 2.4 * s;
  ctx.beginPath(); ctx.moveTo(x - 2 * s, yBase - alto + 40 * s); ctx.lineTo(x - 24 * s, yBase - alto + 16 * s); ctx.moveTo(x + 2 * s, yBase - alto + 40 * s); ctx.lineTo(x + 24 * s, yBase - alto + 16 * s); ctx.stroke();
  // isolatori
  for (const dx of [-36, -14, 14, 36]) ctx.fillRect(x + dx * s - 2 * s, yBase - alto + 1 * s, 4 * s, 8 * s);
  for (const dx of [-24, 24]) ctx.fillRect(x + dx * s - 2 * s, yBase - alto + 27 * s, 4 * s, 8 * s);
  // luce di contorno dal lato del sole
  ctx.strokeStyle = rim; ctx.lineWidth = 1.5 * s;
  ctx.beginPath(); ctx.moveTo(x + 4.4 * s, yBase); ctx.lineTo(x + 2.5 * s, yBase - alto); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 40 * s, yBase - alto + 8 * s); ctx.lineTo(x + 40 * s, yBase - alto + 8 * s); ctx.stroke();
}

function fili(ctx: C2D, a: number, b: number, yBase: number, alto: number, s: number, col: string) {
  ctx.strokeStyle = col; ctx.lineWidth = 1.5 * s; ctx.lineCap = "butt";
  const ys = yBase - alto;
  const sag = 24 * s + (b - a) * 0.02;
  for (const [da, db, dy] of [[-36, -36, 2], [-14, -14, 2], [14, 14, 2], [36, 36, 2], [-24, -24, 30], [24, 24, 30]] as const) {
    ctx.beginPath();
    ctx.moveTo(a + da * s, ys + dy * s + 1 * s);
    ctx.quadraticCurveTo((a + b) / 2 + da * s, ys + dy * s + sag * 2, b + db * s, ys + dy * s + 1 * s);
    ctx.stroke();
  }
}

// --------------------------------------------------------------------
//  La scena
// --------------------------------------------------------------------
export function disegnaAlba(ctx: C2D, t: number, c: Cache, titolo: boolean) {
  const a = c.alba as StatoAlba;
  const t0 = titolo ? 81.4 : 9.6;
  const l = t - t0;
  const luce = titolo ? 0.35 + 0.25 * easeInOut(seg(l, 0, 6)) : 0.1 * easeInOut(seg(l, 0, 8));

  // ── il cielo
  cielo(ctx, [
    [0, mix("#060b1c", "#18224a", luce)], [0.34, mix("#141c40", "#3a4270", luce)], [0.5, mix("#4a3a62", "#8a6488", luce)],
    [0.60, mix("#a86a6a", "#e69a70", luce)], [0.67, mix("#ee9a5c", "#ffc078", luce)], [0.71, mix("#f6c07a", "#ffe0a4", luce)],
  ], 0, 720);

  // stelle che si spengono con la luce
  const stelle = rng(7);
  const vis = clamp(1 - luce * 2.6);
  if (vis > 0.02) {
    for (let i = 0; i < 90; i++) {
      const x = stelle() * W, y = stelle() * 430, base = 0.3 + stelle() * 0.7;
      const tw = 0.6 + 0.4 * Math.sin(t * (1.2 + stelle() * 2) + i);
      ctx.fillStyle = `rgba(225,232,255,${base * tw * vis})`;
      ctx.fillRect(x, y, 1.6, 1.6);
    }
  }

  // ── il sole
  const sy = titolo ? 700 - Math.min(l, 20) * 2 : lerp(752, 668, easeOut(seg(l, 0, 8)));
  const sx = titolo ? 1640 : 1510;
  ctx.globalCompositeOperation = "lighter";
  alone(ctx, sx, sy, 1100, "#ff8f4a", 0.30 + luce * 0.16, 0.62);
  alone(ctx, sx, ORIZZONTE + 4, 1500, "#ff9550", 0.26 + luce * 0.1, 0.16);
  alone(ctx, sx, sy, 280, "#ffd39a", 0.55);
  ctx.globalCompositeOperation = "source-over";

  // ── nuvole: alte, lontane; e basse, scaldate da sotto
  nuvoleScorrono(ctx, a.nubiAlte, 0, 20, LARGH_CIELO, 640, t * 5.5, 0.92);
  ctx.globalCompositeOperation = "lighter";
  alone(ctx, sx - 60, sy + 20, 900, "#ff9a5c", 0.16 * (0.4 + luce), 0.5);
  ctx.globalCompositeOperation = "source-over";
  nuvoleScorrono(ctx, a.nubiBasse, 0, 470, LARGH_CIELO, 380, t * 9, 0.95);

  // il disco del sole, davanti alle nuvole basse più sottili
  ctx.fillStyle = "#fff0cf";
  ctx.beginPath(); ctx.arc(sx, sy, 50, 0, Math.PI * 2); ctx.fill();
  ctx.globalCompositeOperation = "lighter";
  alone(ctx, sx, sy, 130, "#fff3d8", 0.85);
  // raggi: spicchi che salgono dal sole e respirano
  ctx.save(); ctx.translate(sx, sy);
  for (let i = 0; i < 9; i++) {
    const ang = -Math.PI * (0.30 + i * 0.105) - Math.PI * 0.15;
    const w2 = 0.06 + ((i * 37) % 7) * 0.012;
    const gr = ctx.createRadialGradient(0, 0, 40, 0, 0, 1300);
    const al = (0.07 + 0.05 * Math.sin(t * 0.6 + i * 1.7)) * (0.5 + luce);
    gr.addColorStop(0, rgba("#ffcf8a", al)); gr.addColorStop(1, rgba("#ffcf8a", 0));
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(ang - w2) * 1500, Math.sin(ang - w2) * 1500);
    ctx.lineTo(Math.cos(ang + w2) * 1500, Math.sin(ang + w2) * 1500);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  ctx.globalCompositeOperation = "source-over";

  // ── i monti, dal più lontano
  const pan = titolo ? l * 4 : l * 7;
  CATENE.forEach((k, i) => catenaScorre(ctx, a.monti[i], k.y, pan * k.par, 1));
  // foschia calda fra le catene
  cielo(ctx, [[0, "rgba(255,176,120,0)"], [1, `rgba(255,176,120,${0.16 + luce * 0.10})`]], 560, 720);

  // ── la piana: chiazze e cespugli, poi la nebbia bassa che scivola
  ctx.drawImage(a.campo, 0, ORIZZONTE - 6, W, 190);
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.55 + luce * 0.3;
  nuvoleScorrono(ctx, a.nebbia, 0, ORIZZONTE - 40, LARGH_CIELO, 150, t * 6, 1);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  // masserie, cipressi e pompe a vento sull'orizzonte
  const offH = (pan * 0.30) % LARGH_CIELO;
  ctx.globalAlpha = 0.85;
  for (let x = -offH; x < W; x += LARGH_CIELO) ctx.drawImage(a.sagome, x, ORIZZONTE - 132 + 4);
  ctx.globalAlpha = 1;
  // ciuffi lontani, sulla riga della piana
  const off = (pan * 0.9) % W;
  for (let x = -off; x < W; x += W) ctx.drawImage(a.erbaFar, x, ORIZZONTE + 92, W, 60);

  // ── pali lontani (più piccoli, sfumati nella foschia)
  const paliL: number[] = [];
  for (let i = -1; i < 9; i++) paliL.push(((i * 300 + pan * 0.55) % (300 * 9)) - 100);
  paliL.sort((p, q) => p - q);
  ctx.globalAlpha = 0.55;
  for (const px of paliL) palo(ctx, px, ORIZZONTE + 62, 76, "#2a1f2d", "#e79a68", 0.42);
  for (let i = 0; i < paliL.length - 1; i++) if (paliL[i + 1] - paliL[i] < 400) fili(ctx, paliL[i], paliL[i + 1], ORIZZONTE + 62, 76, 0.42, "rgba(40,28,44,.9)");
  ctx.globalAlpha = 1;

  // ── la strada
  const ys = STRADA - 22;
  ctx.fillStyle = "#1a1418"; ctx.fillRect(0, ys - 8, W, H);
  ctx.save();
  ctx.beginPath(); ctx.moveTo(-10, ys); ctx.quadraticCurveTo(W / 2, ys - 6, W + 10, ys + 1); ctx.lineTo(W + 10, ys + 58); ctx.quadraticCurveTo(W / 2, ys + 62, -10, ys + 58); ctx.closePath(); ctx.clip();
  const offS = (pan * 1.0) % LARGH_CIELO;
  for (let x = -offS; x < W; x += LARGH_CIELO) ctx.drawImage(a.asfalto, x, ys, LARGH_CIELO, 60);
  // riflesso del sole sull'asfalto
  ctx.globalCompositeOperation = "lighter";
  alone(ctx, sx - 120, ys + 12, 520, "#ff9a5a", 0.30 + luce * 0.2, 0.12);
  ctx.restore();
  ctx.globalCompositeOperation = "source-over";
  // banchina sotto: terra battuta e ghiaia, in ombra
  const gr2 = ctx.createLinearGradient(0, ys + 58, 0, H);
  gr2.addColorStop(0, "#1f181d"); gr2.addColorStop(0.4, "#0f0c12"); gr2.addColorStop(1, "#07060a");
  ctx.fillStyle = gr2; ctx.fillRect(0, ys + 58, W, H - ys - 58);

  // ── pali vicini, lungo la strada
  const palie: number[] = [];
  for (let i = -1; i < 7; i++) palie.push(((i * 430 + pan * 1.0) % (430 * 7)) - 200);
  palie.sort((p, q) => p - q);
  for (const px of palie) palo(ctx, px, ys + 4, 214, "#0b090f", "#ffae74", 1);
  for (let i = 0; i < palie.length - 1; i++) if (palie[i + 1] - palie[i] < 600) fili(ctx, palie[i], palie[i + 1], ys + 4, 214, 1, "rgba(12,10,16,.95)");

  // ── il viandante e la sua ombra lunga davanti
  const cam = titolo ? 4 : 0;
  const fase = faseDiPasso(t, CAMMINATE[cam]) - 0.25;      // il tallone tocca terra quando il suono dice «passo»
  const cad = CAMMINATE[cam].cad;
  let x: number, alto: number, amp: number;
  if (titolo) {
    alto = 74; amp = 0.55;
    const corsa = 1500, v = velocitaSuolo(alto, cad, amp) - 4;
    x = 1250 - ((l * v) % corsa);
  } else {
    alto = 150; amp = 0.62;
    const v = velocitaSuolo(alto, cad, amp) - 7;     // meno la panoramica lenta della macchina
    x = 1340 - l * v;
  }
  const svanisce = titolo ? clamp((x - 180) / 200) : 1;
  ctx.globalAlpha = svanisce;
  const yPiedi = ys + 30;
  disegnaOmbra(ctx, x, yPiedi + 2, alto, fase, { colore: "#000", tanica: true, fagotto: true, cappello: true, ampiezza: amp }, 2.5, -0.09, "rgba(4,2,8,.5)");
  disegnaViandante(ctx, x, yPiedi, alto, fase, {
    colore: "#08060b", lontano: "#040306", bordo: "#ffb27a", latoLuce: 1, verso: -1,
    tanica: true, fagotto: true, cappello: true, ampiezza: amp, dettaglio: alto > 100 ? 1 : 0,
  });
  ctx.globalAlpha = 1;

  // ── in primo piano: ciuffi d'erba secca controluce e polvere nella luce
  const offN = (pan * 1.7) % LARGH_CIELO;
  for (let xx = -offN; xx < W; xx += LARGH_CIELO) ctx.drawImage(a.erbaNear, xx, 800);
  ctx.globalCompositeOperation = "lighter";
  pulviscolo(ctx, t, 8, 70, { x: 700, y: 360, w: 1300, h: 560 }, "#ffd9ae", 0.55 + luce * 0.6);
  ctx.globalCompositeOperation = "source-over";
  // grana calda in alto, la pellicola vira
  cielo(ctx, [[0, "rgba(6,8,22,.16)"], [0.4, "rgba(6,8,22,0)"]], 0, 500);
}

export { hexRgb, rgbCss, smooth, sfoca, camera };
