// ====================================================================
//  D · L'INVASO  (giorno → notte, la domanda)
// --------------------------------------------------------------------
//  Campo lungo sul bacino vuoto: una crosta di sale a placche che si
//  perde nell'orizzonte, la diga di cemento con le sue macchie e i suoi
//  scarichi, la torre di presa, lo scafo arenato di una barca. La luce
//  cala: il giorno pallido diventa notte con la Via Lattea, la luna sottile,
//  il faro rosso sulla torre. Il viandante è piccolissimo e va verso ovest.
//  La macchina, piano, sale verso il cielo.
// ====================================================================
import { W, H, CAMMINATE, faseDiPasso } from "../scaletta";
import { clamp, easeInOut, mix, rng, rgba, seg } from "../tempo";
import type { Cache } from "../cache";
import { alone, cielo, crinale, nuvole, nuvoleScorrono, type C2D } from "../pittura";
import { campoLento, casoDi, creaTela, ctxDi, fbmPeriodico, RES_TELE, riempi, smooth, voronoiTessera, type Tela } from "../texture";
import { disegnaOmbra, disegnaViandante, velocitaSuolo } from "../viandante";

const ORIZZONTE = 700;
const AMP = 0.4;

interface StatoInvaso { piana: Tela; diga: Tela; colline: Tela; collineNotte: Tela; lattea: Tela; cirri: Tela; nubiNotte: Tela }

// --------------------------------------------------------------------
//  La piana di sale: lastre irregolari con la cresta di pressione rialzata ai bordi,
//  chiazze di umidità e granulo di cristalli, in prospettiva, dipinte una volta sola
// --------------------------------------------------------------------
const hashPx = (x: number, y: number) => {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

async function pianaTela(): Promise<Tela> {
  const K = RES_TELE;                                      // pixel di tela per unità di progetto: la tessera e la piana hanno K volte i pixel
  const TW = 1024 * K, TH = 256 * K;
  const vor = voronoiTessera(9, 86 * K, TW, TH, 0.9);      // le lastre: larghe, irregolari
  const vor2 = voronoiTessera(21, 31 * K, TW, TH, 0.9);    // le fessure sottili dentro la lastra
  const grano = fbmPeriodico(14, 32, 3, 8);
  // i campi lenti (umidità, larghezza della cresta, dove si apre la fessura, dove le crepe sottili si spezzano)
  const nUmido = fbmPeriodico(41, 6, 4, 2), nLarg = fbmPeriodico(23, 16, 3, 4), nFess = fbmPeriodico(29, 12, 3, 3);
  const umidoF = campoLento((x, y) => nUmido(x / TW * 6, y / TH * 2) * 0.5 + 0.5, TW, TH, 8);
  const largF = campoLento((x, y) => nLarg(x / TW * 16, y / TH * 4) * 0.5 + 0.5, TW, TH, 8);
  const fessF = campoLento((x, y) => nFess(x / TW * 12, y / TH * 3), TW, TH, 8);
  const lacunaF = campoLento((x, y) => nLarg(x / TW * 16 + 5, y / TH * 4 + 2), TW, TH, 8);
  const luce = [-0.6, -0.8];
  const tessera = await riempi(TW, TH, (x, y, px) => {
    const c = vor(x, y);
    const d = (c.f2 - c.f1) * 0.5 / K;                      // distanza (circa) dal confine fra due lastre, in unità di progetto
    const caso = casoDi(c.id);
    const lg = largF(x, y);
    const dx = x - c.cx, dy = y - c.cy, len = Math.hypot(dx, dy) || 1;
    const verso = -(dx * luce[0] + dy * luce[1]) / len;     // > 0: il fianco interno della cresta guarda la luce
    // la lastra: bianco azzurrino, un poco diverso per ogni lastra, più scuro e freddo nel mezzo
    let r = 229 + (caso - 0.5) * 9, g = 235 + (caso - 0.5) * 8, b = 236 + (caso - 0.5) * 6;
    const fondo = smooth(0, 52, d);
    r -= fondo * 6; g -= fondo * 5; b -= fondo * 1.5;
    // le chiazze di umidità: più scure e più fredde, a macchie larghe e morbide
    const um = smooth(0.10, 0.62, umidoF(x, y) + (caso - 0.5) * 0.25);
    r -= um * 26; g -= um * 20; b -= um * 12;
    // il granulo dei cristalli, e un luccichio rado
    const gr = grano(x / TW * 32, y / TH * 8) * 11 + (hashPx(x, y) - 0.5) * 9;
    r += gr; g += gr; b += gr * 0.9;
    if (hashPx(x + 7, y + 3) > 0.9985) { r += 18; g += 18; b += 16; }
    // le fessure sottili dentro la lastra (non tutte: solo dove il caso le apre)
    if (d > 9 && lacunaF(x, y) > 0.05) {
      const c2 = vor2(x, y);
      if ((c2.f2 - c2.f1) * 0.5 / K < 0.75) { r *= 0.93; g *= 0.94; b *= 0.95; }
    }
    // la cresta di pressione: rialzata sul confine, chiara dal lato della luce, in ombra dall'altro
    const wR = 3.4 + lg * 3.4;
    const cresta = 1 - smooth(0, wR, d);
    const chiaro = cresta * clamp(verso + 0.40) * 46;
    const scuro = cresta * clamp(-verso + 0.05) * 48;
    r += chiaro - scuro; g += chiaro - scuro * 0.94; b += chiaro * 0.9 - scuro * 0.80;
    // sul confine, a tratti, la fessura: una riga sottile e fredda
    const apre = 0.40 + 0.60 * smooth(-0.20, 0.35, fessF(x, y));
    const fd = (1 - smooth(0, 0.7 + lg * 0.9, d)) * apre;
    r += (112 - r) * fd * 0.75; g += (124 - g) * fd * 0.75; b += (138 - b) * fd * 0.75;
    px[0] = r; px[1] = g; px[2] = b;
  });

  // la prospettiva: ogni riga è letta con più campioni (quanti ne copre sulla tessera), così lontano la
  // tessera si fa media e non puntinatura; vicino la riga è ingrandita e vale la sfumatura del canvas
  const alt = 400, righe = alt * K;
  const trama = creaTela(W * K, righe), gt = ctxDi(trama);
  const pat = gt.createPattern(tessera, "repeat")!;
  const F0 = 0.09, F1 = 1.55;
  const opaca: number[] = [];
  let v = 0;
  for (let yi = 0; yi < righe; yi += 1) {
    const f = F0 + (F1 - F0) * Math.pow((yi + 0.5) / righe, 1.15);
    const ky = 0.36 * f;
    const dv = 1 / ky;                                       // righe di tessera coperte da una riga di tela
    const A = smooth(0.10, 0.34, f) * 0.95;
    opaca.push(A);
    if (A > 0.004) {
      const nh = Math.max(1, Math.min(6, Math.round(1 / f))), nv = Math.max(1, Math.min(12, Math.round(dv)));
      const cx = (W * K) / 2 * (1 - f);                      // la tessera resta ancorata al centro dello schermo
      gt.fillStyle = pat;
      let k = 0;
      for (let sv = 0; sv < nv; sv++) {
        const vs = v + ((sv + 0.5) / nv - 0.5) * dv;         // il centro del pixel cade a vs + dv/2
        for (let sh = 0; sh < nh; sh++) {
          const dxs = (sh + 0.5) / nh - 0.5;
          k++;
          gt.save();
          gt.globalAlpha = 1 / k;
          gt.transform(f, 0, 0, ky, cx + dxs, yi - ky * vs);
          gt.fillRect((-2 - cx) / f - 1, vs, (W * K + 4) / f + 2, 1 / ky + 0.5);
          gt.restore();
        }
      }
    }
    v += dv;
  }
  const piana = creaTela(W * K, righe), g = ctxDi(piana);
  const gr = g.createLinearGradient(0, 0, 0, righe);
  gr.addColorStop(0, "#e2e8ea"); gr.addColorStop(1, "#bcc5c8");
  g.fillStyle = gr; g.fillRect(0, 0, W * K, righe);
  for (let y = 0; y < righe; y++) {
    if (opaca[y] <= 0.004) continue;
    g.globalAlpha = opaca[y];
    g.drawImage(trama, 0, y, W * K, 1, 0, y, W * K, 1);
  }
  g.globalAlpha = 1;
  // foschia lontana che mangia il dettaglio
  const fos = g.createLinearGradient(0, 0, 0, 120 * K);
  fos.addColorStop(0, "rgba(232,238,238,.95)"); fos.addColorStop(1, "rgba(232,238,238,0)");
  g.fillStyle = fos; g.fillRect(0, 0, W * K, 120 * K);
  return piana;
}

// --------------------------------------------------------------------
//  La diga: cemento a riprese, giunti, macchie di sale e di acqua, il parapetto, gli scarichi
// --------------------------------------------------------------------
async function digaTela(): Promise<Tela> {
  const w = 540, h = 215, k = 1.6;
  const t = creaTela(w * k, h * k), g = ctxDi(t), r = rng(48);
  g.scale(k, k);
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, "#9ca1ac"); gr.addColorStop(0.35, "#7b808b"); gr.addColorStop(1, "#4d525e");
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const n = fbmPeriodico(5, 6, 4, 0);
  const grana = await riempi(Math.round(w * k), Math.round(h * k), (x, y, px) => {
    const v = n(x / (w * k) * 6, y / (h * k) * 2) * 26 + n(x * 0.4, y * 0.4) * 12;
    px[0] = v > 0 ? 255 : 0; px[1] = v > 0 ? 255 : 0; px[2] = v > 0 ? 255 : 0; px[3] = Math.abs(v) * 2.6;
  });
  g.save(); g.scale(1 / k, 1 / k); g.drawImage(grana, 0, 0); g.restore();
  // le riprese di getto: righe orizzontali, ognuna con il suo filo di luce
  for (let y = 22; y < h; y += 13) {
    g.fillStyle = "rgba(0,0,0,.13)"; g.fillRect(0, y, w, 1.2);
    g.fillStyle = "rgba(255,255,255,.07)"; g.fillRect(0, y + 1.2, w, 1);
  }
  // i giunti di contrazione: verticali, con la loro ombra
  for (let x = 40; x < w; x += 56 + r() * 6) {
    g.fillStyle = "rgba(0,0,0,.30)"; g.fillRect(x, 0, 1.6, h);
    g.fillStyle = "rgba(255,255,255,.10)"; g.fillRect(x + 1.6, 0, 1, h);
  }
  // le colature: sale e acqua che hanno segnato il cemento
  for (let i = 0; i < 54; i++) {
    const x = r() * w, lw = 2 + r() * 12, lh = 30 + r() * 150, y0 = 12 + r() * 30;
    const sg = g.createLinearGradient(0, y0, 0, y0 + lh);
    const chiara = r() < 0.45;
    sg.addColorStop(0, chiara ? "rgba(235,238,240,.30)" : "rgba(30,34,44,.30)"); sg.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = sg; g.fillRect(x, y0, lw, lh);
  }
  // il parapetto in cima: cordolo e ringhiera
  g.fillStyle = "#b1b6c0"; g.fillRect(0, 0, w, 6);
  g.fillStyle = "rgba(0,0,0,.30)"; g.fillRect(0, 6, w, 2.4);
  g.fillStyle = "#3a3f4a";
  for (let x = 4; x < w; x += 14) g.fillRect(x, -11, 1.8, 11);
  g.fillRect(0, -11, w, 1.6); g.fillRect(0, -5.5, w, 1.2);
  // gli scarichi: tre arcate con le paratoie
  for (const cx of [110, 262, 414]) {
    g.fillStyle = "#151821";
    g.beginPath(); g.moveTo(cx - 30, h); g.lineTo(cx - 30, h - 62); g.quadraticCurveTo(cx, h - 96, cx + 30, h - 62); g.lineTo(cx + 30, h); g.closePath(); g.fill();
    g.strokeStyle = "rgba(120,126,140,.6)"; g.lineWidth = 1.4;
    for (let x = -24; x <= 24; x += 8) { g.beginPath(); g.moveTo(cx + x, h); g.lineTo(cx + x, h - 60 - (24 - Math.abs(x)) * 0.35); g.stroke(); }
    g.strokeStyle = "rgba(170,176,190,.45)"; g.lineWidth = 2;
    g.beginPath(); g.moveTo(cx - 30, h - 62); g.quadraticCurveTo(cx, h - 96, cx + 30, h - 62); g.stroke();
    // ruggine sotto l'arcata
    const rg = g.createLinearGradient(0, h - 62, 0, h);
    rg.addColorStop(0, "rgba(140,70,30,0)"); rg.addColorStop(1, "rgba(140,70,30,.28)");
    g.fillStyle = rg; g.fillRect(cx - 40, h - 62, 80, 62);
  }
  // il piede: detriti e sale accumulato
  const pg = g.createLinearGradient(0, h - 18, 0, h);
  pg.addColorStop(0, "rgba(220,226,228,0)"); pg.addColorStop(1, "rgba(220,226,228,.65)");
  g.fillStyle = pg; g.fillRect(0, h - 18, w, 18);
  return t;
}

async function latteaTela(): Promise<Tela> {
  const w = 1920, h = 760;
  const n = fbmPeriodico(31, 4, 5, 0);
  const n2 = fbmPeriodico(37, 8, 3, 0);
  return await riempi(w, h, (x, y, px) => {
    // una fascia obliqua, più fitta al centro, con corsie di polvere scura
    const u = x / w, v = y / h;
    const d = Math.abs((v - 0.36) - (u - 0.5) * 0.42);
    const banda = Math.exp(-(d * d) / 0.02);
    const nube = 0.5 + 0.5 * n(u * 4, v * 3);
    const polvere = smooth(0.35, 0.65, n2(u * 8 + 3, v * 6 + 1) * 0.5 + 0.5);
    const a = clamp(banda * (0.25 + nube * 0.75) * (1 - polvere * 0.75));
    px[0] = 168 + nube * 30; px[1] = 186 + nube * 26; px[2] = 226; px[3] = a * 150;
  });
}

export async function preparaInvaso(c: Cache) {
  if (c.invaso) return;
  const s: StatoInvaso = {
    piana: await pianaTela(),
    diga: await digaTela(),
    colline: await crinale({ seme: 88, larghezza: 1920, altezza: 130, base: 92, ampiezza: 34, frequenza: 3, aspro: 0.2, luce: 1,
      chiaro: "#c8d0dc", scuro: "#95a0b4", nebbia: "#dfe5ea", nebbiaForza: 0.85, grana: 0.05 }),
    // le stesse colline di notte: sagome appena più scure del cielo dell'orizzonte, con il velo della lontananza
    collineNotte: await crinale({ seme: 88, larghezza: 1920, altezza: 130, base: 92, ampiezza: 34, frequenza: 3, aspro: 0.2, luce: 1,
      chiaro: "#3a4c74", scuro: "#121a30", nebbia: "#2c3d5c", nebbiaForza: 0.8, grana: 0.05 }),
    lattea: await latteaTela(),
    cirri: await nuvole({ seme: 55, w: 960, h: 300, scalaX: 3.6, scalaY: 1, copertura: 0.34, morbidezza: 0.22, sole: [-1, 0.3],
      chiaro: "#ffffff", scuro: "#a9b5c8", alto: 0.3, basso: 0.55 }),
    nubiNotte: await nuvole({ seme: 57, w: 960, h: 300, scalaX: 3.2, scalaY: 1, copertura: 0.40, morbidezza: 0.24, sole: [-1, -0.5],
      chiaro: "#6d84b8", scuro: "#080d1c", alto: 0.3, basso: 0.55 }),
  };
  c.invaso = s;
}

// --------------------------------------------------------------------
//  Piccoli elementi vettoriali: la barca, gli alberi morti, la torre
// --------------------------------------------------------------------
function barca(ctx: C2D, x: number, y: number, s: number, col: string, ruggine: string, rim: string) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = col;
  ctx.beginPath();                                                     // lo scafo, sbandato
  ctx.moveTo(-64, -10); ctx.quadraticCurveTo(-56, 16, -10, 20); ctx.lineTo(50, 16); ctx.quadraticCurveTo(68, 8, 78, -20);
  ctx.lineTo(60, -14); ctx.lineTo(-58, -20); ctx.closePath(); ctx.fill();
  ctx.fillRect(-20, -42, 34, 26);                                      // la tuga
  ctx.fillRect(-14, -50, 22, 10);
  ctx.strokeStyle = col; ctx.lineWidth = 2.6; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(26, -18); ctx.lineTo(30, -84); ctx.moveTo(30, -84); ctx.lineTo(4, -60); ctx.stroke();   // l'albero spezzato e la sartia
  ctx.fillStyle = ruggine; ctx.fillRect(-50, -6, 26, 5); ctx.fillRect(8, 2, 22, 4);
  ctx.strokeStyle = rim; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(-64, -10); ctx.quadraticCurveTo(-56, 16, -10, 20); ctx.stroke();
  ctx.restore();
}

function alberoSecco(ctx: C2D, x: number, y: number, s: number, col: string) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = col; ctx.lineCap = "round";
  const rami: [number, number, number, number, number][] = [[0, 0, -4, -46, 4], [-4, -46, -22, -76, 2.6], [-4, -46, 14, -80, 2.4], [-14, -66, -34, -74, 1.6], [8, -62, 26, -68, 1.5]];
  for (const [x0, y0, x1, y1, w] of rami) { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
  ctx.restore();
}

// --------------------------------------------------------------------
//  La scena
// --------------------------------------------------------------------
export function disegnaInvaso(ctx: C2D, t: number, c: Cache) {
  const a = c.invaso as StatoInvaso;
  const l = t - 24.8;
  const notte = easeInOut(seg(l, 1.6, 6.4));
  const alza = easeInOut(seg(l, 0, 8.6)) * 120;         // la macchina sale verso il cielo

  cielo(ctx, [
    [0, mix("#506080", "#03050c", notte)], [0.40, mix("#9eabbc", "#080e1e", notte)],
    [0.60, mix("#ead0ac", "#1b2842", notte)], [0.68, mix("#f6e5cb", "#2c3d5c", notte)],
  ], -300, 760);
  // quando la macchina sale l'orizzonte scende nel quadro: il colore dell'orizzonte prosegue sotto il cielo, senza buchi neri
  ctx.fillStyle = mix("#f6e5cb", "#2c3d5c", notte); ctx.fillRect(-200, 759, W + 400, H - 759 + 200);

  // stelle e Via Lattea, quando il buio arriva
  const vis = clamp((notte - 0.30) * 1.7);
  if (vis > 0.01) {
    ctx.save(); ctx.translate(0, alza * 0.4 - 40); ctx.globalAlpha = vis * 0.9;
    ctx.drawImage(a.lattea, 0, 0);
    ctx.restore();
    const r = rng(5);
    for (let i = 0; i < 330; i++) {
      const x = r() * W, y = r() * 720 - 60 + alza * 0.4, b = 0.25 + r() * 0.75, tw = 0.55 + 0.45 * Math.sin(t * (1 + r() * 2.4) + i);
      const al = vis * b * (0.55 + 0.45 * tw);
      if (al < 0.02) continue;
      const grande = b > 0.92;
      ctx.fillStyle = `rgba(226,236,255,${al})`;
      ctx.fillRect(x, y, grande ? 2.6 : 1.6, grande ? 2.6 : 1.6);
      if (grande) { ctx.fillStyle = `rgba(226,236,255,${al * 0.25})`; ctx.fillRect(x - 3, y + 0.6, 8.6, 1.4); ctx.fillRect(x + 0.6, y - 3, 1.4, 8.6); }
    }
    // la luna: una falce sottile, in alto a sinistra, con il suo alone
    ctx.save(); ctx.translate(320, 176 + alza * 0.4); ctx.globalAlpha = vis;
    ctx.globalCompositeOperation = "lighter"; alone(ctx, 0, 0, 220, "#bfd4ff", 0.22); ctx.globalCompositeOperation = "source-over";
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.clip();
    ctx.beginPath(); ctx.rect(-30, -30, 60, 60); ctx.arc(10, -4, 20, 0, Math.PI * 2);
    ctx.fillStyle = "#f4f2e8"; ctx.fill("evenodd"); ctx.restore();
    ctx.strokeStyle = "rgba(244,242,232,.16)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.stroke();   // il resto del disco, appena accennato
    ctx.restore();
  }

  // cirri sottili di giorno; di notte nuvole scure orlate dalla luna
  nuvoleScorrono(ctx, a.cirri, 0, 30 + alza * 0.4, 1920, 560, t * 3, 0.55 * (1 - notte));
  nuvoleScorrono(ctx, a.nubiNotte, 0, 30 + alza * 0.4, 1920, 560, t * 2, 0.62 * notte);

  ctx.save();
  ctx.translate(0, alza);

  // colline lontane, poi la piana di sale
  ctx.save();
  if (notte < 1) { ctx.globalAlpha = 1 - notte; ctx.drawImage(a.colline, 0, ORIZZONTE - 96); }
  if (notte > 0) { ctx.globalAlpha = notte; ctx.drawImage(a.collineNotte, 0, ORIZZONTE - 96); }
  ctx.restore();
  ctx.drawImage(a.piana, 0, ORIZZONTE - 2, W, 400);
  // il cielo si specchia sul sale: una fascia chiara sotto l'orizzonte, che sbiadisce
  cielo(ctx, [[0, mix("#f4e7d0", "#33466a", notte).replace("#", "#")], [1, "rgba(0,0,0,0)"]], ORIZZONTE - 2, ORIZZONTE + 1);
  const rifl = ctx.createLinearGradient(0, ORIZZONTE, 0, ORIZZONTE + 150);
  rifl.addColorStop(0, rgba(mix("#fff4e0", "#4a6a9a", notte), 0.55 * (1 - notte * 0.35)));
  rifl.addColorStop(1, rgba(mix("#fff4e0", "#4a6a9a", notte), 0));
  ctx.fillStyle = rifl; ctx.fillRect(0, ORIZZONTE, W, 150);
  // la notte scurisce il sale, con un riflesso freddo della luna
  ctx.fillStyle = `rgba(6,12,32,${0.80 * notte})`; ctx.fillRect(0, ORIZZONTE, W, H);
  // ombra che si addensa in primo piano: il quadro non è mai piatto
  cielo(ctx, [[0, "rgba(96,112,128,0)"], [1, `rgba(96,112,128,${0.28 * (1 - notte * 0.6)})`]], ORIZZONTE + 120, ORIZZONTE + 380);
  if (notte > 0.3) {
    ctx.globalCompositeOperation = "lighter";
    alone(ctx, 330, ORIZZONTE + 70, 420, "#9fb8e8", 0.14 * clamp((notte - 0.3) * 1.6), 0.22);
    ctx.globalCompositeOperation = "source-over";
  }
  // le stelle e la luna si specchiano sul sale: trattini freddi che si allungano e si spengono con la distanza dall'orizzonte
  if (vis > 0.05) {
    const rs = rng(9);
    for (let i = 0; i < 110; i++) {
      const x = rs() * W, d = rs(), b = 0.3 + rs() * 0.7, tw = 0.5 + 0.5 * Math.sin(t * (0.8 + rs() * 2) + i);
      const vicino = Math.abs(x - 330) < 120 ? 2.4 : 1;                       // sotto la luna il riflesso è più fitto
      const al = vis * b * (1 - d) * (0.45 + 0.55 * tw) * 0.2 * vicino;
      if (al < 0.01) continue;
      ctx.fillStyle = `rgba(190,212,255,${al})`;
      ctx.fillRect(x, ORIZZONTE + 8 + d * 150, 1.4, 2 + d * 11);
    }
  }

  // la diga a destra: un muro di cemento in prospettiva
  ctx.save();
  ctx.beginPath(); ctx.moveTo(1420, ORIZZONTE + 12); ctx.lineTo(1462, 528); ctx.lineTo(W + 20, 503); ctx.lineTo(W + 20, ORIZZONTE + 12); ctx.closePath();
  ctx.clip();
  ctx.drawImage(a.diga, 1420, 490, 540, 226);
  ctx.fillStyle = `rgba(6,10,24,${0.05 + 0.80 * notte})`; ctx.fillRect(1400, 480, 560, 260);       // di notte resta il 15–20 % della materia
  if (notte > 0.2) {                                                                              // il velo freddo della luna, più forte in alto
    const lunare = ctx.createLinearGradient(0, 500, 0, 700);
    lunare.addColorStop(0, rgba("#9cb6ee", 0.30 * notte)); lunare.addColorStop(0.55, rgba("#9cb6ee", 0.08 * notte)); lunare.addColorStop(1, rgba("#9cb6ee", 0));
    ctx.globalCompositeOperation = "screen"; ctx.fillStyle = lunare; ctx.fillRect(1400, 480, 560, 260); ctx.globalCompositeOperation = "source-over";
  }
  ctx.restore();
  // luce sul ciglio della diga, nel crepuscolo
  ctx.strokeStyle = rgba(mix("#ffe2b4", "#a9c0f0", notte), 0.5 * (1 - notte * 0.6) + 0.4 * notte); ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(1462, 528); ctx.lineTo(W + 20, 503); ctx.stroke();

  // la torre di presa, con il faro rosso che lampeggia di notte
  const cT = mix("#565c6c", "#05070f", notte);
  ctx.fillStyle = cT;
  ctx.fillRect(1180, 604, 30, 100); ctx.fillRect(1166, 594, 58, 12);
  ctx.fillStyle = mix("#3a3f4c", "#020308", notte);
  ctx.fillRect(1188, 618, 6, 10); ctx.fillRect(1198, 618, 6, 10); ctx.fillRect(1188, 640, 6, 10); ctx.fillRect(1198, 640, 6, 10);
  ctx.fillStyle = mix("#7c8494", "#0a0d18", notte); ctx.fillRect(1180, 604, 3, 100);
  ctx.strokeStyle = cT; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(1195, 594); ctx.lineTo(1195, 566); ctx.stroke();
  if (notte > 0.3) {                                                                              // il bordo freddo della luna sulla torre
    ctx.fillStyle = rgba("#a9c0f0", 0.6 * clamp((notte - 0.3) * 1.5));
    ctx.fillRect(1180, 604, 2, 100); ctx.fillRect(1166, 594, 58, 1.6); ctx.fillRect(1166, 594, 1.6, 12);
  }
  if (notte > 0.4) {
    const lampo = Math.pow(Math.max(0, Math.sin(t * 3.2)), 8);
    ctx.globalCompositeOperation = "lighter";
    alone(ctx, 1195, 564, 60, "#ff3a2a", 0.7 * lampo * notte);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(255,70,50,${(0.25 + 0.75 * lampo) * notte})`; ctx.beginPath(); ctx.arc(1195, 564, 3, 0, Math.PI * 2); ctx.fill();
  }
  // ponte di servizio fra la torre e la diga
  ctx.strokeStyle = cT; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(1210, 612); ctx.lineTo(1468, 566); ctx.stroke();
  ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(1210, 604); ctx.lineTo(1468, 558); ctx.stroke();

  // sul fondo del bacino: lo scafo arenato e due alberi morti
  const cBarca = mix("#565258", "#040409", notte);
  barca(ctx, 470, ORIZZONTE + 36, 0.85, cBarca, mix("#8a4a2a", "#0a0608", notte), rgba(mix("#ffe9c8", "#7a92c8", notte), 0.55 * (1 - notte * 0.5)));
  const cAlb = mix("#5b565b", "#040408", notte);
  alberoSecco(ctx, 760, ORIZZONTE + 26, 0.62, cAlb);
  alberoSecco(ctx, 1010, ORIZZONTE + 18, 0.42, cAlb);

  // il viandante, piccolissimo
  const cam = CAMMINATE[2];
  const alto = 64, x = 1090 - l * velocitaSuolo(alto, cam.cad, AMP) + 6;
  const fase = faseDiPasso(Math.min(t, 32.6), cam) - 0.25;
  const yP = ORIZZONTE + 38;
  ctx.save(); ctx.translate(x, yP + 2); ctx.scale(1, 0.14);
  const ao = ctx.createRadialGradient(0, 0, 2, 0, 0, 40);
  ao.addColorStop(0, `rgba(10,14,24,${0.5 - 0.3 * notte})`); ao.addColorStop(1, "rgba(10,14,24,0)");
  ctx.fillStyle = ao; ctx.fillRect(-40, -40, 80, 80); ctx.restore();
  disegnaOmbra(ctx, x, yP + 2, alto, fase, { colore: "#000", tanica: true, fagotto: true, cappello: true, ampiezza: AMP }, 1.6 - notte, 0.05, `rgba(20,26,40,${0.32 * (1 - notte)})`);
  disegnaViandante(ctx, x, yP, alto, fase, {
    colore: mix("#2a2d36", "#02030a", notte), lontano: mix("#1b1d24", "#01020a", notte),
    bordo: notte < 0.65 ? mix("#fff4e2", "#a9c0ee", notte) : undefined, latoLuce: -1, verso: -1,
    tanica: true, fagotto: true, cappello: true, ampiezza: AMP, dettaglio: 1,
  });
  ctx.restore();
}
