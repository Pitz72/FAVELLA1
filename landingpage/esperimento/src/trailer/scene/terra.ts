// ====================================================================
//  C · LA TERRA  (dettaglio in carrellata)
// --------------------------------------------------------------------
//  Il fango che il sole ha cotto: piastre che si sollevano ai bordi, crepe
//  profonde, sassi. La macchina segue il passo a bassa quota; il suolo
//  scorre in prospettiva (le bande lontane più piano, le vicine più svelte)
//  alla velocità esatta degli stivali, così i piedi non scivolano. Sopra
//  l'orizzonte, mesa nella calura che trema. Il viandante è visto dal
//  cappotto in giù: stivali, pantaloni, la tanica che dondola.
// ====================================================================
import { W, H, CAMMINATE, faseDiPasso, appoggi } from "../scaletta";
import { clamp, rng } from "../tempo";
import type { Cache } from "../cache";
import { alone, cielo, crinale, type C2D } from "../pittura";
import {
  campoLento, casoDi, creaTela, ctxDi, fbmPeriodico, fetta, hexRgb, mescola, riempi, sfoca, smooth, voronoiTessera, type RGB, type Tela,
} from "../texture";
import { disegnaOmbra, disegnaViandante, velocitaSuolo } from "../viandante";

const ORIZZONTE = 570;
const PIEDI = 905;
const ALTO = 1480;
const AMP = 0.42;
const TW = 2048, TH = 512;

interface StatoTerra {
  fango: Tela; fangoMorbido: Tela; mesas: Tela;
  suolo: SuoloCotto;
}

/** Il suolo in prospettiva, cotto: una riga di tessera per ogni riga dello schermo, già alla sua scala. */
interface SuoloCotto { tela: Tela; periodi: number[]; quadro: Tela; quadroCtx: C2D }

// --------------------------------------------------------------------
//  Il fango screpolato, una tessera che si ripete in x e in y.
//  Fessure di larghezza variabile (strette quasi ovunque, larghe dove la piastra si solleva), con la polvere
//  chiara depositata ai bordi; piastre che si incurvano ognuna a modo suo; zone più pallide e più scure;
//  crepe sottili dentro una piastra su due.
// --------------------------------------------------------------------
async function fangoTela(): Promise<Tela> {
  const vor = voronoiTessera(3, 118, TW, TH, 0.92);
  const vor2 = voronoiTessera(13, 46, TW, TH, 0.9);
  const gr = fbmPeriodico(5, 16, 4, 4);
  const gr2 = fbmPeriodico(12, 64, 3, 16);
  // i campi lenti: quanto è larga la fessura, le zone di tono, dove si deposita la polvere, dove le crepe sottili si spezzano
  const nLarg = fbmPeriodico(8, 10, 3, 3), nZona = fbmPeriodico(21, 6, 3, 2), nPolv = fbmPeriodico(33, 14, 3, 4), nSpezza = fbmPeriodico(47, 24, 3, 6);
  const largF = campoLento((x, y) => nLarg(x / TW * 10, y / TH * 3) * 0.5 + 0.5, TW, TH, 8);
  const zonaF = campoLento((x, y) => nZona(x / TW * 6, y / TH * 2) * 0.5 + 0.5, TW, TH, 16);
  const polvF = campoLento((x, y) => nPolv(x / TW * 14, y / TH * 4) * 0.5 + 0.5, TW, TH, 8);
  const spezzaF = campoLento((x, y) => nSpezza(x / TW * 24, y / TH * 6), TW, TH, 8);
  const A = hexRgb("#b99162"), B = hexRgb("#a07a4c"), C = hexRgb("#8c6a42"), CH = hexRgb("#e7cc9c");
  const PALLIDO = hexRgb("#d9c19a"), POLVERE = hexRgb("#d2b78a");
  const FONDO0 = hexRgb("#0f0805"), FONDO1 = hexRgb("#2c1b0f");
  const L = [-0.62, -0.78];
  const t = await riempi(TW, TH, (x, y, px) => {
    const c = vor(x, y);
    const bordo = c.f2 - c.f1;
    const lw = largF(x, y);
    const wc = 1.8 + 11.5 * smooth(0.40, 0.86, lw);             // la fessura: da un filo a una spaccatura di una dozzina di pixel
    if (bordo < wc) {
      const d = bordo / wc;                                      // 0 sul filo, 1 sul labbro
      let col = mescola(FONDO0, FONDO1, d * d);
      // la polvere chiara che il vento ha portato nella fessura, più sul labbro che in fondo
      const p = clamp(polvF(x, y) * 1.4 - 0.25) * smooth(0.15, 1, d) * 0.85;
      col = mescola(col, POLVERE, p);
      px[0] = col[0]; px[1] = col[1]; px[2] = col[2];
      return;
    }
    const caso = casoDi(c.id), caso2 = casoDi(c.id + 7919);
    let col: RGB = mescola(caso < 0.5 ? A : B, caso < 0.5 ? B : C, (caso * 2) % 1);
    // zone più pallide (una pellicola di polvere d'argilla) e piastre scure e umide
    const zona = zonaF(x, y);
    col = mescola(col, PALLIDO, smooth(0.52, 0.85, zona) * 0.55 + (caso2 > 0.82 ? 0.22 : 0));
    const umida = smooth(0.40, 0.12, zona) * 0.35 + (caso2 < 0.12 ? 0.25 : 0);
    col = [col[0] * (1 - umida * 0.30), col[1] * (1 - umida * 0.34), col[2] * (1 - umida * 0.38)];
    const d = bordo - wc;
    const cupola = smooth(0, 30, d);
    // il bordo della piastra, incurvato verso l'alto: ognuna si solleva a modo suo (poco, tanto)
    const curl = (0.40 + 0.60 * caso2) * (0.75 + 0.5 * lw), rimW = 7 + 16 * caso2;       // più si solleva dove la fessura si apre
    const dx = x - c.cx, dy = y - c.cy;
    const len = Math.hypot(dx, dy) || 1;
    const luce = (dx * L[0] + dy * L[1]) / len;                  // -1..1: quanto il bordo guarda il sole
    const rim = 1 - smooth(0, rimW, d);
    const chiaro = rim * clamp(luce * 0.9 + 0.15) * curl;
    const scuro = (1 - smooth(0, rimW * 1.5, d)) * clamp(-luce * 0.8 + 0.1) * curl;
    col = mescola(col, CH, chiaro * 0.55);
    const m = (0.90 + 0.18 * cupola) * (1 - scuro * 0.5);
    col = [col[0] * m, col[1] * m, col[2] * m];
    // grana: sabbia fine e piccole scaglie
    const g = gr2(x / TW * 64, y / TH * 16) * 22 + gr(x / TW * 16 + 3, y / TH * 4 + 7) * 16;
    let r = col[0] + g, gg = col[1] + g * 0.9, b = col[2] + g * 0.75;
    // le crepe sottili dentro la piastra: una su due ne ha, e si spezzano a tratti
    if (caso2 > 0.45 && d > 9) {
      const c2 = vor2(x, y);
      const b2 = c2.f2 - c2.f1, w2 = 1.2 + lw * 1.2;
      if (b2 < w2 && spezzaF(x, y) > -0.12) {
        const k = 0.50 + 0.40 * (b2 / w2);
        r *= k; gg *= k; b *= k;
      }
    }
    px[0] = r; px[1] = gg; px[2] = b;
  });
  // sassolini e frammenti secchi: pochi, polverosi, con la loro ombra
  const g = ctxDi(t), r = rng(19);
  for (let i = 0; i < 150; i++) {
    const x = r() * TW, y = r() * TH, s = 2 + r() * 5.5;
    for (const oy of [0, TH, -TH]) {
      g.fillStyle = "rgba(20,10,4,.35)"; g.beginPath(); g.ellipse(x + s * 0.4, y + oy + s * 0.5, s * 1.1, s * 0.5, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = `rgb(${172 + r() * 34},${146 + r() * 26},${112 + r() * 24})`; g.beginPath(); g.ellipse(x, y + oy, s, s * 0.62, r() * 0.5, 0, Math.PI * 2); g.fill();
      g.fillStyle = "rgba(255,240,210,.32)"; g.beginPath(); g.ellipse(x - s * 0.25, y + oy - s * 0.2, s * 0.4, s * 0.2, 0, 0, Math.PI * 2); g.fill();
    }
  }
  g.strokeStyle = "rgba(60,38,20,.8)"; g.lineCap = "round";
  for (let i = 0; i < 16; i++) {           // steli secchi
    const x = r() * TW, y = r() * TH, a = r() * Math.PI, l = 14 + r() * 40;
    g.lineWidth = 1 + r() * 1.4;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5, y + Math.sin(a) * l * 0.5 - 3, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  return t;
}

export async function preparaTerra(c: Cache) {
  if (c.terra) return;
  const fango = await fangoTela();
  const fangoMorbido = sfoca(fango, 3.2);
  const mesas = await crinale({
    seme: 515, larghezza: 3840, altezza: 150, base: 96, ampiezza: 44, frequenza: 2.6, aspro: 0.85, luce: -1,
    chiaro: "#f0dcb8", scuro: "#cdb48c", nebbia: "#efdcba", nebbiaForza: 0.85, grana: 0.1,
  });
  const suolo = await cuociSuolo(fango, fangoMorbido);
  const s: StatoTerra = { fango, fangoMorbido, mesas, suolo };
  c.terra = s;
}

// --------------------------------------------------------------------
//  Il suolo in prospettiva. Ogni riga dello schermo è un'altra distanza:
//  più vicina, più grande e più veloce (il punto di fuga sta a metà larghezza).
//  Invece di trasformare una texture enorme per ogni riga a ogni fotogramma,
//  si cuoce una volta sola la tessera già ridotta alla scala di ciascuna riga
//  (media su tutti i pixel che la riga copre: niente sfarfallio) e a ogni
//  fotogramma si copia la riga, spostata di quanto ha corso.
// --------------------------------------------------------------------
const F0 = 0.30;                                     // scala dell'orizzonte
const RIGHE = 966 - ORIZZONTE;                       // sotto, il letterbox
const scalaRiga = (i: number) => F0 + (1 - F0) * ((i + 0.5) / (PIEDI - ORIZZONTE));

async function cuociSuolo(fango: Tela, morbido: Tela): Promise<SuoloCotto> {
  const BW = W + Math.ceil(TW * scalaRiga(RIGHE)) + 4;         // un periodo più lo schermo: la riga si può leggere da qualsiasi punto
  const tela = creaTela(BW, RIGHE);
  const img = ctxDi(tela).createImageData(BW, RIGHE);
  const out = new Uint32Array(img.data.buffer);
  const leggi = (t: Tela) => new Uint32Array(ctxDi(t).getImageData(0, 0, TW, TH).data.buffer);
  const nitido = leggi(fango), molle = leggi(morbido);
  const periodi: number[] = [];
  const respira = fetta();
  let v = 0;
  for (let i = 0; i < RIGHE; i++) {
    const f = scalaRiga(i);
    const P = Math.max(8, Math.round(TW * f));                  // periodo intero: la tessera si salda senza cuciture
    const dv = 1 / (0.5 * f);                                   // righe di tessera coperte da una riga dello schermo
    const nr = Math.max(1, Math.round(dv)), nc = Math.max(1, Math.round(TW / P));
    const passo = TW / P, base = i * BW;
    const righe: number[] = [];
    for (let k = 0; k < nr; k++) righe.push((Math.floor(v + ((k + 0.5) * dv) / nr) % TH) * TW);
    // le righe lontane usano la tessera sfocata, le vicine quella nitida, con una dissolvenza in mezzo
    const wN = clamp((i + ORIZZONTE - 675) / 60);
    const media = (src: Uint32Array, j: number, o: number[]) => {
      let r = 0, g = 0, b = 0;
      for (let m = 0; m < nc; m++) {
        const x = Math.floor((j + (m + 0.5) / nc) * passo) % TW;
        for (let k = 0; k < nr; k++) { const p = src[righe[k] + x]; r += p & 255; g += (p >> 8) & 255; b += (p >> 16) & 255; }
      }
      const n = nr * nc;
      o[0] = r / n; o[1] = g / n; o[2] = b / n;
    };
    const a = [0, 0, 0], b2 = [0, 0, 0];
    for (let j = 0; j < P; j++) {
      if (wN <= 0) media(molle, j, a);
      else if (wN >= 1) media(nitido, j, a);
      else { media(molle, j, a); media(nitido, j, b2); a[0] += (b2[0] - a[0]) * wN; a[1] += (b2[1] - a[1]) * wN; a[2] += (b2[2] - a[2]) * wN; }
      out[base + j] = 0xff000000 | (a[2] << 16) | (a[1] << 8) | a[0];
    }
    for (let j = P; j < BW; j++) out[base + j] = out[base + j - P];
    periodi.push(P);
    v += dv;
    await respira();
  }
  ctxDi(tela).putImageData(img, 0, 0);
  const quadro = creaTela(W, RIGHE);
  return { tela, periodi, quadro, quadroCtx: ctxDi(quadro) };
}

/** Il suolo di questo istante: ogni riga, letta dal punto giusto della sua tessera cotta. */
function suolo(ctx: C2D, c: StatoTerra, t: number, vel: number) {
  const { tela, periodi, quadro, quadroCtx } = c.suolo;
  for (let i = 0; i < RIGHE; i++) {
    const P = periodi[i], f = P / TW;
    const ox = (W / 2) * (1 - f) + ((t * vel * f) % P);         // dov'è finita l'origine della tessera su questa riga
    const u0 = (((-ox) % P) + P) % P;
    quadroCtx.drawImage(tela, u0, i, W, 1, 0, i, W, 1);
  }
  ctx.drawImage(quadro, 0, ORIZZONTE);
}

/** Uno sbuffo di polvere che si allarga e si dirada mentre il suolo lo porta via. */
function sbuffo(ctx: C2D, x: number, y: number, eta: number, seme: number) {
  const r = rng(seme);
  const durata = 1.7;
  if (eta < 0 || eta > durata) return;
  const k = eta / durata;
  for (let i = 0; i < 9; i++) {
    const dx = (r() - 0.35) * 150 * (0.3 + k), dy = -r() * 70 * k - 6;
    const rr = (34 + r() * 46) * (0.5 + k * 1.6);
    const a = (1 - k) * (0.30 + r() * 0.12) * (1 - Math.abs(dx) / 260);
    const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rr);
    g.addColorStop(0, `rgba(226,196,152,${a})`); g.addColorStop(1, "rgba(226,196,152,0)");
    ctx.fillStyle = g; ctx.fillRect(x + dx - rr, y + dy - rr, rr * 2, rr * 2);
  }
}

export function disegnaTerra(ctx: C2D, t: number, c: Cache) {
  const a = c.terra as StatoTerra;
  const l = t - 17.6;
  const cam = CAMMINATE[1];
  const vel = velocitaSuolo(ALTO, cam.cad, AMP);

  // ── cielo bianco di calura e sole in alto a sinistra
  cielo(ctx, [[0, "#c39a6a"], [0.30, "#e6c79c"], [0.62, "#f3e1c0"], [1, "#f6e9cc"]], 0, ORIZZONTE + 30);
  ctx.globalCompositeOperation = "lighter";
  alone(ctx, 560, -60, 1150, "#fff0d0", 0.75);
  alone(ctx, 560, 20, 340, "#fffaf0", 0.65);
  ctx.globalCompositeOperation = "source-over";

  // ── mesa lontane nella calura: il crinale trema a fette
  const larg = a.mesas.width;
  const off = ((l * 5) % larg + larg) % larg;
  for (let yy = 0; yy < 150; yy += 6) {
    const dx = Math.sin(t * 2.4 + yy * 0.13) * (2.2 + yy * 0.012);
    for (let x = -off; x < W + 40; x += larg) ctx.drawImage(a.mesas, 0, yy, larg, 6, x + dx, ORIZZONTE - 118 + yy, larg, 6);
  }
  // velo di foschia sull'orizzonte
  cielo(ctx, [[0, "rgba(246,233,204,0)"], [1, "rgba(246,233,204,.95)"]], ORIZZONTE - 40, ORIZZONTE + 12);

  // ── il suolo
  ctx.fillStyle = "#8d6a44"; ctx.fillRect(0, ORIZZONTE, W, H - ORIZZONTE);
  suolo(ctx, a, t, vel);
  // aria calda sul suolo lontano, e ombra che si addensa in basso
  cielo(ctx, [[0, "rgba(246,233,204,.92)"], [0.20, "rgba(240,222,186,.55)"], [0.55, "rgba(240,222,186,0)"]], ORIZZONTE - 2, 860);
  cielo(ctx, [[0, "rgba(30,16,6,0)"], [1, "rgba(30,16,6,.35)"]], 860, H);

  // ── il viandante (dal cappotto in giù), con l'ombra sul suolo e l'appoggio dei piedi
  const fase = faseDiPasso(t, cam) - 0.25;
  const bob = Math.sin(fase * Math.PI * 4) * 4;
  const x = 1340, y = PIEDI + bob * 0.5;
  // ombra portata: la luce viene dall'alto a sinistra, l'ombra cade a destra e in avanti
  const opzOmbra = { colore: "#000", tanica: true, fagotto: true, ampiezza: AMP, senzaTesta: true } as const;
  disegnaOmbra(ctx, x + 40, y + 6, ALTO, fase, opzOmbra, -0.42, 0.06, "rgba(46,26,10,.34)");
  // pozza d'ombra sotto gli stivali
  ctx.save(); ctx.translate(x - 20, y + 4); ctx.scale(1, 0.13);
  const ao = ctx.createRadialGradient(0, 0, 10, 0, 0, 380);
  ao.addColorStop(0, "rgba(20,10,4,.55)"); ao.addColorStop(1, "rgba(20,10,4,0)");
  ctx.fillStyle = ao; ctx.fillRect(-380, -380, 760, 760); ctx.restore();

  disegnaViandante(ctx, x, y, ALTO, fase, {
    colore: "#2b241d", lontano: "#1b1611", pantaloni: "#3a322b", stivali: "#3a2416", polvere: "#c9a57a",
    bordo: "#f4dcae", latoLuce: -1, verso: -1, tanica: true, fagotto: true, ampiezza: AMP, dettaglio: 2, senzaTesta: true,
  });

  // ── la polvere dei passi: sbuffi che il suolo trascina a destra
  for (const ta of appoggi(cam, 60)) {
    const eta = t - ta;
    if (eta < 0 || eta > 1.8) continue;
    sbuffo(ctx, x - 110 + eta * vel * 0.85, PIEDI + 8, eta, Math.floor(ta * 100));
  }
  // polvere fine nell'aria, luminosa controluce
  ctx.globalCompositeOperation = "lighter";
  const r = rng(21);
  for (let i = 0; i < 46; i++) {
    const bx = r(), by = r(), sp = 30 + r() * 120, fase2 = r() * 9;
    const px = (bx * W + t * sp) % W, py = 420 + by * 600 + Math.sin(t * 0.7 + fase2) * 14;
    const rr = 1.2 + r() * 3.4;
    const g = ctx.createRadialGradient(px, py, 0, px, py, rr * 2.6);
    g.addColorStop(0, "rgba(255,244,220,.6)"); g.addColorStop(1, "rgba(255,244,220,0)");
    ctx.fillStyle = g; ctx.fillRect(px - rr * 3, py - rr * 3, rr * 6, rr * 6);
  }
  ctx.globalCompositeOperation = "source-over";
  // calore: velo chiaro dall'alto, e il sole che sbianca l'angolo
  cielo(ctx, [[0, "rgba(255,240,215,.30)"], [1, "rgba(255,240,215,0)"]], 0, 420);
}
