// ====================================================================
//  Tempo e curve del trailer: tutto è funzione PURA del tempo t (secondi).
//  Nessuna animazione vive da sola: un solo orologio guida canvas, testi e
//  suono, così «salta», pausa e riavvio restano sempre coerenti.
// ====================================================================

export const clamp = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Avanzamento 0→1 di t dentro [a, b]. */
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

export const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);
export const easeIn = (k: number) => k * k * k;
/** Uscita «da cinema»: parte decisa, atterra morbida. */
export const expoOut = (k: number) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k));

/** Inviluppo di visibilità: sale in `inn`, resta, scende in `out` (0..1). */
export function inviluppo(t: number, a: number, b: number, inn = 0.6, out = 0.6) {
  if (t <= a || t >= b) return 0;
  const su = inn > 0 ? easeOut(seg(t, a, a + inn)) : 1;
  const giu = out > 0 ? 1 - easeIn(seg(t, b - out, b)) : 1;
  return Math.min(su, giu);
}

/** Generatore pseudo-casuale deterministico (mulberry32): stesse forme a ogni visione. */
export function rng(seme: number) {
  let s = seme >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let r = Math.imul(s ^ (s >>> 15), 1 | s);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Rumore 1D liscio (value noise con interpolazione coseno), deterministico. */
export function rumore1D(seme: number, n = 512) {
  const r = rng(seme);
  const v = Array.from({ length: n }, r);
  return (x: number) => {
    const i = Math.floor(x), f = x - i;
    const a = v[((i % n) + n) % n], b = v[(((i + 1) % n) + n) % n];
    const k = (1 - Math.cos(f * Math.PI)) / 2;
    return a + (b - a) * k;
  };
}

/** Somma di ottave: crinali credibili da un rumore semplice. */
export function crinale(seme: number) {
  const n1 = rumore1D(seme), n2 = rumore1D(seme + 7), n3 = rumore1D(seme + 13);
  return (x: number) => n1(x) * 0.62 + n2(x * 2.3) * 0.26 + n3(x * 5.1) * 0.12;
}

/** Mescola due colori #rrggbb. */
export function mix(c1: string, c2: string, k: number) {
  const p = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const a = p(c1), b = p(c2);
  const r = a.map((x, i) => Math.round(lerp(x, b[i], clamp(k))));
  return "#" + r.map((x) => x.toString(16).padStart(2, "0")).join("");
}

export const rgba = (hex: string, a: number) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${a})`;
};
