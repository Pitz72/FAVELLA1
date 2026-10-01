// ====================================================================
//  Pittura condivisa dalle scene: cielo, luce, nuvole, crinali, particelle.
//  Le parti pesanti (nuvole, catene di monti) si dipingono una volta sola
//  in tele precalcolate; a ogni fotogramma restano solo copie e qualche
//  bagliore.
// ====================================================================
import { W, H } from "./scaletta";
import { clamp, lerp, rng, rgba } from "./tempo";
import {
  creaTela, ctxDi, fbm, fbmPeriodico, hexRgb, mescola, perlin, riempi, rgbCss, smooth,
  type RGB, type Tela,
} from "./texture";

export type C2D = CanvasRenderingContext2D;

/** Riempie con un gradiente verticale a più fermate. */
export function cielo(ctx: C2D, stops: [number, string][], y0 = 0, y1 = H) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([p, c]) => g.addColorStop(p, c));
  ctx.fillStyle = g;
  ctx.fillRect(-200, y0, W + 400, y1 - y0);
}

/** Un alone di luce (da usare con 'lighter'). */
export function alone(ctx: C2D, x: number, y: number, r: number, colore: string, a: number, schiacciato = 1) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(1, schiacciato);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, rgba(colore, a));
  g.addColorStop(0.3, rgba(colore, a * 0.42));
  g.addColorStop(0.65, rgba(colore, a * 0.1));
  g.addColorStop(1, rgba(colore, 0));
  ctx.fillStyle = g;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();
}

export function camera(ctx: C2D, scala: number, cx = W / 2, cy = H / 2, dx = 0, dy = 0) {
  ctx.translate(cx + dx, cy + dy);
  ctx.scale(scala, scala);
  ctx.translate(-cx, -cy);
}

/** Pulviscolo che galleggia nella luce: puntini morbidi, ognuno col suo ritmo. */
export function pulviscolo(ctx: C2D, t: number, seme: number, n: number, zona: { x: number; y: number; w: number; h: number }, colore: string, forza: number, dimMax = 2.6) {
  const r = rng(seme);
  for (let i = 0; i < n; i++) {
    const bx = r(), by = r(), vel = 5 + r() * 15, fase = r() * 10, dim = 0.7 + r() * dimMax;
    const x = zona.x + ((bx * zona.w + t * vel) % zona.w);
    const y = zona.y + by * zona.h + Math.sin(t * 0.6 + fase) * 12;
    const a = forza * (0.2 + 0.8 * (0.5 + 0.5 * Math.sin(t * 1.3 + fase * 3)));
    const g = ctx.createRadialGradient(x, y, 0, x, y, dim * 2.4);
    g.addColorStop(0, rgba(colore, a * 0.75)); g.addColorStop(1, rgba(colore, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - dim * 2.4, y - dim * 2.4, dim * 4.8, dim * 4.8);
  }
}

// --------------------------------------------------------------------
//  Nuvole: densità da rumore stirato, luce dal lato del sole.
// --------------------------------------------------------------------
export interface OpzioniNuvole {
  seme: number;
  w: number; h: number;          // dimensione della tela (poi si stira)
  scalaX: number; scalaY: number; // quanto il rumore è allungato
  copertura: number;             // 0..1: quanto cielo coprono
  morbidezza: number;            // larghezza della soglia
  sole: [number, number];        // direzione da cui arriva la luce (dx, dy)
  chiaro: string; scuro: string; // colore illuminato e in ombra
  alto?: number;                 // 0..1: dissolvenza verso l'alto della tela
  basso?: number;                // dissolvenza verso il basso
}

/** Tela RGBA di nuvole che si ripete in orizzontale. `scalaX` = di quanto le forme sono più larghe che alte. */
export async function nuvole(o: OpzioniNuvole): Promise<Tela> {
  const per = Math.max(2, Math.round(o.w / 240));                 // forme lungo la larghezza (intero: la tela si salda)
  const n = fbmPeriodico(o.seme, per, 5);
  const chiaro = hexRgb(o.chiaro), scuro = hexRgb(o.scuro);
  const [sx, sy] = o.sole;
  const passo = 9;
  const dens = (x: number, y: number) => {
    const u = (x / o.w) * per;
    const v = (y * per * o.scalaX) / o.w * o.scalaY;
    // un poco di torsione: le nuvole vere non sono righe parallele
    const t = n(u * 0.7, v * 0.7 + 3.1) * 0.35;
    return smooth(1 - o.copertura - o.morbidezza, 1 - o.copertura + o.morbidezza, n(u + t * 0.3, v + t) * 0.5 + 0.5);
  };
  return await riempi(o.w, o.h, (x, y, px) => {
    const vv = y / o.h;
    let taglio = 1;
    if (o.alto !== undefined) taglio *= smooth(0, o.alto, vv);
    if (o.basso !== undefined) taglio *= 1 - smooth(1 - o.basso, 1, vv);
    if (taglio <= 0.002) { px[3] = 0; return; }
    const d0 = dens(x, y);
    if (d0 <= 0.002) { px[3] = 0; return; }
    const d1 = dens(x + sx * passo, y + sy * passo);
    const d2 = dens(x + sx * passo * 3, y + sy * passo * 3);
    // luce: dove verso il sole la densità cala, la nuvola è illuminata
    const lit = clamp(0.30 + (d0 - d1) * 3.2 + (d0 - d2) * 1.4 + (1 - d0) * 0.45);
    const col = mescola(scuro, chiaro, lit);
    px[0] = col[0]; px[1] = col[1]; px[2] = col[2];
    px[3] = d0 * taglio * 255;
  });
}

/** Disegna una tela di nuvole che scorre in orizzontale. */
export function nuvoleScorrono(ctx: C2D, tela: Tela, x: number, y: number, larghezza: number, altezza: number, scorri: number, alpha = 1) {
  const off = ((scorri % larghezza) + larghezza) % larghezza;
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let px = off - larghezza; px < W + 200; px += larghezza) ctx.drawImage(tela, px + x, y, larghezza, altezza);
  ctx.restore();
}

// --------------------------------------------------------------------
//  Catene di monti: un crinale da rumore, illuminato per pendenza,
//  con la grana della roccia e la nebbia in basso. Si ripete in x.
// --------------------------------------------------------------------
export interface OpzioniCrinale {
  seme: number;
  larghezza: number;          // px della tela (multiplo del periodo)
  altezza: number;
  base: number;               // y media del crinale nella tela
  ampiezza: number;
  frequenza: number;          // creste per 1000 px
  aspro: number;              // 0 (dolce) … 1 (a lame)
  luce: number;               // +1 il sole a destra, -1 a sinistra
  chiaro: string; scuro: string; nebbia: string;
  nebbiaForza: number;        // 0..1 quanta nebbia in basso
  grana?: number;             // 0..1 grana della roccia
}

export async function crinale(o: OpzioniCrinale): Promise<Tela> {
  const tela = creaTela(o.larghezza, o.altezza);
  const g = ctxDi(tela);
  const per = Math.max(2, Math.round((o.larghezza / 1000) * o.frequenza));
  const n1 = fbmPeriodico(o.seme, per, 5);
  const n2 = fbmPeriodico(o.seme + 9, per * 3, 3);
  const y = new Float32Array(o.larghezza);
  for (let x = 0; x < o.larghezza; x++) {
    const u = (x / o.larghezza) * per;
    let h = n1(u, 0.5) * 0.9 + n2(u * 3, 1.5) * 0.25;
    // creste a lama: 1-|n| dà picchi acuti
    const lama = 1 - Math.abs(n1(u * 1.7, 4.2));
    h = lerp(h, lama * 0.9 - 0.25, o.aspro * 0.55);
    y[x] = o.base - h * o.ampiezza;
  }
  const chiaro = hexRgb(o.chiaro), scuro = hexRgb(o.scuro), nebbia = hexRgb(o.nebbia);
  const grana = perlin(o.seme + 3);
  // il corpo del monte: un solo poligono con un gradiente dal colore medio alla nebbia
  let minY = o.altezza;
  for (let x = 0; x < o.larghezza; x++) minY = Math.min(minY, y[x]);
  const corpo = new Path2D();
  corpo.moveTo(0, o.altezza);
  for (let x = 0; x < o.larghezza; x++) corpo.lineTo(x, Math.max(0, y[x]));
  corpo.lineTo(o.larghezza, o.altezza); corpo.closePath();
  const medio = mescola(scuro, chiaro, 0.45);
  const gc = g.createLinearGradient(0, Math.max(0, minY), 0, o.altezza);
  gc.addColorStop(0, rgbCss(medio)); gc.addColorStop(0.45, rgbCss(mescola(medio, scuro, 0.5)));
  gc.addColorStop(1, rgbCss(mescola(scuro, nebbia, o.nebbiaForza)));
  g.fillStyle = gc; g.fill(corpo);
  // la luce radente: il pendio rivolto al sole si schiarisce, l'altro si scurisce, in una fascia sotto la cresta
  const FASCIA = 84;
  const sprite = (col: RGB) => {
    const s = creaTela(1, FASCIA), sg = ctxDi(s);
    const gg = sg.createLinearGradient(0, 0, 0, FASCIA);
    gg.addColorStop(0, rgbCss(col, 0.9)); gg.addColorStop(0.35, rgbCss(col, 0.35)); gg.addColorStop(1, rgbCss(col, 0));
    sg.fillStyle = gg; sg.fillRect(0, 0, 1, FASCIA);
    return s;
  };
  const luceSp = sprite(chiaro), ombraSp = sprite(scuro);
  for (let x = 0; x < o.larghezza; x++) {
    const xm = (x - 2 + o.larghezza) % o.larghezza, xp = (x + 2) % o.larghezza;
    const pend = (y[xp] - y[xm]) / 4;                    // >0: scende verso destra
    const lit = clamp(0.5 + pend * 0.55 * o.luce);
    const top = Math.max(0, Math.floor(y[x]));
    g.globalAlpha = Math.abs(lit - 0.5) * 2;
    g.drawImage(lit > 0.5 ? luceSp : ombraSp, x, top);
    g.globalAlpha = 1;
    // luce di taglio sulla cresta
    if (lit > 0.55) { g.fillStyle = rgbCss(chiaro, (lit - 0.55) * 1.6); g.fillRect(x, top, 1, 2); }
  }
  // grana: chiazze di roccia e strati, in moltiplicazione leggera (a mezza risoluzione, poi stirata)
  if ((o.grana ?? 0) > 0) {
    const mw = Math.round(o.larghezza / 2), mh = Math.round(o.altezza / 2);
    const gr = await riempi(mw, mh, (px, py, c) => {
      const yy = y[Math.min(o.larghezza - 1, px * 2)] / 2;
      if (py < yy) { c[3] = 0; return; }
      const v = fbm(grana, px / 23, py / 7, 3) * 0.5 + fbm(grana, px / 4.5, py / 2.5, 2) * 0.25;
      const a = clamp(Math.abs(v) * (o.grana ?? 0) * 2.2, 0, 0.5);
      c[0] = v > 0 ? chiaro[0] : 0; c[1] = v > 0 ? chiaro[1] : 0; c[2] = v > 0 ? chiaro[2] : 0; c[3] = a * 255;
    });
    g.drawImage(gr, 0, 0, o.larghezza, o.altezza);
  }
  return tela;
}

/** Disegna una catena di monti che scorre in orizzontale (tela larga il doppio dello schermo). */
export function catenaScorre(ctx: C2D, tela: Tela, yBase: number, scorri: number, alpha = 1) {
  const w = tela.width;
  const off = ((scorri % w) + w) % w;
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let x = -off; x < W + 40; x += w) ctx.drawImage(tela, x, yBase);
  ctx.restore();
}

export { rgba, lerp, clamp };
export type { RGB };
