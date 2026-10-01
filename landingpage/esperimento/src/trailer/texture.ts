// ====================================================================
//  Gli strumenti della materia: rumore, celle di Voronoi, riempimento
//  per pixel, sfocatura. Con questi si fanno le texture del trailer una
//  volta sola (mentre girano i loghi) e poi si disegnano a costo quasi
//  nullo: terra screpolata, sale, legno, carta, nuvole, rilievo.
//  Tutto deterministico: stesse forme a ogni visione.
// ====================================================================
import { rng, lerp, clamp } from "./tempo";

export type Tela = HTMLCanvasElement;

export const creaTela = (w: number, h: number): Tela => {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
};

export const ctxDi = (t: Tela) => t.getContext("2d", { willReadFrequently: false })!;

/** La sfocatura del canvas c'è (Chrome, Electron); dove manca, si disegna nitido. */
export const haSfocatura = (() => {
  try {
    const t = creaTela(2, 2).getContext("2d")!;
    return typeof (t as unknown as { filter?: string }).filter === "string";
  } catch { return false; }
})();

/** Copia `src` in una tela nuova, sfocata di `px` pixel. */
export function sfoca(src: Tela, px: number): Tela {
  const out = creaTela(src.width, src.height);
  const g = ctxDi(out);
  if (haSfocatura && px > 0) {
    // il bordo si sfoca con un margine, altrimenti sfuma verso il trasparente
    (g as unknown as { filter: string }).filter = `blur(${px}px)`;
  }
  g.drawImage(src, 0, 0);
  return out;
}

// --------------------------------------------------------------------
//  Rumore di gradiente (Perlin 2D), con periodo orizzontale facoltativo
//  per le tessere che si ripetono a scorrere.
// --------------------------------------------------------------------
export type Rumore2D = (x: number, y: number) => number;


/** Rumore di gradiente in [-1, 1]. Con `periodoX`/`periodoY` (interi) si ripete ogni tot unità. */
export function perlin(seme: number, periodoX = 0, periodoY = 0): Rumore2D {
  const r = rng(seme);
  const p = new Uint8Array(512);
  const base = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [base[i], base[j]] = [base[j], base[i]]; }
  for (let i = 0; i < 512; i++) p[i] = base[i & 255];
  const GX = new Float32Array([1, -1, 0, 0, 0.7071, -0.7071, 0.7071, -0.7071]);
  const GY = new Float32Array([0, 0, 1, -1, 0.7071, 0.7071, -0.7071, -0.7071]);
  const px = periodoX > 0 ? periodoX : 0, py = periodoY > 0 ? periodoY : 0;
  return (x, y) => {
    const xf0 = Math.floor(x), yf0 = Math.floor(y);
    const xf = x - xf0, yf = y - yf0;
    let xi = xf0, yi = yf0, xj = xf0 + 1, yj = yf0 + 1;
    if (px) { xi = ((xi % px) + px) % px; xj = ((xj % px) + px) % px; }
    if (py) { yi = ((yi % py) + py) % py; yj = ((yj % py) + py) % py; }
    xi &= 255; xj &= 255; yi &= 255; yj &= 255;
    const a = p[p[xi] + yi] & 7, b = p[p[xj] + yi] & 7, c = p[p[xi] + yj] & 7, d = p[p[xj] + yj] & 7;
    const n00 = GX[a] * xf + GY[a] * yf;
    const n10 = GX[b] * (xf - 1) + GY[b] * yf;
    const n01 = GX[c] * xf + GY[c] * (yf - 1);
    const n11 = GX[d] * (xf - 1) + GY[d] * (yf - 1);
    const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10), v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
    const na = n00 + (n10 - n00) * u, nb = n01 + (n11 - n01) * u;
    return (na + (nb - na) * v) * 1.4;
  };
}

/** Somma di ottave (movimento browniano frazionario), in circa [-1, 1]. */
export function fbm(n: Rumore2D, x: number, y: number, ottave = 4, lacunarita = 2, guadagno = 0.5): number {
  let somma = 0, amp = 1, fr = 1, norma = 0;
  for (let i = 0; i < ottave; i++) {
    somma += n(x * fr, y * fr) * amp;
    norma += amp;
    amp *= guadagno; fr *= lacunarita;
  }
  return somma / norma;
}

/** fbm periodico in x (e in y, se `periodoY`): le ottave hanno periodo `periodo·2^i`, quindi la tessera si salda. */
export function fbmPeriodico(seme: number, periodo: number, ottave = 4, periodoY = 0) {
  const ns = Array.from({ length: ottave }, (_, i) => perlin(seme + i * 17, periodo * 2 ** i, periodoY ? periodoY * 2 ** i : 0));
  return (x: number, y: number) => {
    let s = 0, amp = 1, norma = 0;
    for (let i = 0; i < ottave; i++) { s += ns[i](x * 2 ** i, y * 2 ** i) * amp; norma += amp; amp *= 0.5; }
    return s / norma;
  };
}

export const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// --------------------------------------------------------------------
//  Celle di Voronoi (griglia con un punto per cella, spostato a caso).
//  F1 = distanza dal punto più vicino, F2 = dal secondo; F2−F1 vale ~0
//  sul confine fra due celle: serve a disegnare crepe e bordi.
// --------------------------------------------------------------------
export interface Cella { f1: number; f2: number; id: number; cx: number; cy: number }

export function voronoi(seme: number, lato: number, sposta = 0.85, periodoX = 0) {
  const hash = (i: number, j: number, k: number) => {
    let h = (i * 374761393 + j * 668265263 + k * 2147483647 + seme * 1274126177) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const celle = periodoX > 0 ? Math.round(periodoX / lato) : 0;
  const out: Cella = { f1: 0, f2: 0, id: 0, cx: 0, cy: 0 };
  return (x: number, y: number): Cella => {
    const gx = x / lato, gy = y / lato;
    const ix = Math.floor(gx), iy = Math.floor(gy);
    let f1 = 1e9, f2 = 1e9, id = 0, cx = 0, cy = 0;
    for (let dj = -1; dj <= 1; dj++) {
      for (let di = -1; di <= 1; di++) {
        const i = ix + di, j = iy + dj;
        const iw = celle > 0 ? ((i % celle) + celle) % celle : i;
        const px = i + 0.5 + (hash(iw, j, 1) - 0.5) * sposta;
        const py = j + 0.5 + (hash(iw, j, 2) - 0.5) * sposta;
        const d = Math.hypot(px - gx, py - gy);
        if (d < f1) { f2 = f1; f1 = d; id = (iw * 7919 + j * 104729) | 0; cx = px * lato; cy = py * lato; }
        else if (d < f2) f2 = d;
      }
    }
    out.f1 = f1 * lato; out.f2 = f2 * lato; out.id = id; out.cx = cx; out.cy = cy;
    return out;
  };
}

/**
 * Voronoi che si ripete in x e in y su una tela `w × h`: i punti stanno in una griglia
 * precalcolata, quindi ogni pixel costa nove distanze e basta. È ciò che serve a fare
 * in fretta tessere di fango screpolato o di crosta di sale che si saldano.
 */
export function voronoiTessera(seme: number, lato: number, w: number, h: number, sposta = 0.85) {
  const nx = Math.max(2, Math.round(w / lato)), ny = Math.max(2, Math.round(h / lato));
  const lx = w / nx, ly = h / ny;
  const r = rng(seme);
  const px = new Float32Array(nx * ny), py = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    px[j * nx + i] = (i + 0.5 + (r() - 0.5) * sposta) * lx;
    py[j * nx + i] = (j + 0.5 + (r() - 0.5) * sposta) * ly;
  }
  const out: Cella = { f1: 0, f2: 0, id: 0, cx: 0, cy: 0 };
  return (x: number, y: number): Cella => {
    const ci = Math.floor(x / lx), cj = Math.floor(y / ly);
    let f1 = 1e12, f2 = 1e12, id = 0, cx = 0, cy = 0;
    for (let dj = -1; dj <= 1; dj++) {
      const j = cj + dj, jw = ((j % ny) + ny) % ny, oy = (j - jw) / ny * h;
      for (let di = -1; di <= 1; di++) {
        const i = ci + di, iw = ((i % nx) + nx) % nx, ox = (i - iw) / nx * w;
        const k = jw * nx + iw;
        const qx = px[k] + ox - x, qy = py[k] + oy - y;
        const d = qx * qx + qy * qy;
        if (d < f1) { f2 = f1; f1 = d; id = k; cx = px[k] + ox; cy = py[k] + oy; }
        else if (d < f2) f2 = d;
      }
    }
    out.f1 = Math.sqrt(f1); out.f2 = Math.sqrt(f2); out.id = id; out.cx = cx; out.cy = cy;
    return out;
  };
}

/** Numero casuale stabile 0..1 di una cella (per variare il colore delle piastre). */
export const casoDi = (id: number) => {
  let h = Math.imul(id ^ 0x9e3779b9, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

// --------------------------------------------------------------------
//  Riempimento per pixel
// --------------------------------------------------------------------
/** Cede il passo al browser (un giro del ciclo degli eventi, senza il ritardo minimo dei timer). */
export const cede = (() => {
  const canale = typeof MessageChannel !== "undefined" ? new MessageChannel() : null;
  if (!canale) return () => new Promise<void>((r) => setTimeout(r, 0));
  let attesa: (() => void) | null = null;
  canale.port1.onmessage = () => { const a = attesa; attesa = null; a?.(); };
  return () => new Promise<void>((r) => { attesa = r; canale.port2.postMessage(0); });
})();

/** Un budget di tempo: lavora per `ms` millisecondi, poi cede il passo. */
export function fetta(ms = 8) {
  let t0 = performance.now();
  return async () => {
    if (performance.now() - t0 > ms) { await cede(); t0 = performance.now(); }
  };
}

/** `f(x, y, o)` scrive in `o` [r, g, b, a] (0..255). Ogni tanto cede il passo al browser. */
export async function riempi(w: number, h: number, f: (x: number, y: number, o: number[]) => void): Promise<Tela> {
  const tela = creaTela(w, h);
  const g = ctxDi(tela);
  const img = g.createImageData(tela.width, tela.height);
  const d = img.data;
  const o = [0, 0, 0, 255];
  const respira = fetta();
  let k = 0;
  for (let y = 0; y < tela.height; y++) {
    for (let x = 0; x < tela.width; x++) {
      o[3] = 255;
      f(x, y, o);
      d[k++] = o[0]; d[k++] = o[1]; d[k++] = o[2]; d[k++] = o[3];
    }
    if ((y & 3) === 3) await respira();
  }
  g.putImageData(img, 0, 0);
  return tela;
}

// --------------------------------------------------------------------
//  Colori
// --------------------------------------------------------------------
export type RGB = [number, number, number];
export const hexRgb = (c: string): RGB => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)) as RGB;
export const mescola = (a: RGB, b: RGB, k: number): RGB => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
export const rgbCss = (c: RGB, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;

/** Rampa di colori: `stops` = [[posizione 0..1, "#rrggbb"], …] → colore a t. */
export function rampa(stops: [number, string][]) {
  const s = stops.map(([p, c]) => [p, hexRgb(c)] as [number, RGB]);
  return (t: number): RGB => {
    if (t <= s[0][0]) return s[0][1];
    for (let i = 1; i < s.length; i++) {
      if (t <= s[i][0]) return mescola(s[i - 1][1], s[i][1], (t - s[i - 1][0]) / (s[i][0] - s[i - 1][0] || 1));
    }
    return s[s.length - 1][1];
  };
}
