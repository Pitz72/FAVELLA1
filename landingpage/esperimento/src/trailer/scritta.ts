// ====================================================================
//  Scrittura a mano, finta ma credibile: righe di corsivo che dalla
//  distanza si leggono come una calligrafia (aste con l'occhiello,
//  gobbe, pance, code sotto la riga, pressione che cambia) senza dire
//  niente. E un generatore di carta con fibre, macchie e pieghe.
// ====================================================================
import { rng, lerp, clamp } from "./tempo";
import { creaTela, ctxDi, fbmPeriodico, riempi, smooth, type Tela } from "./texture";

type C2D = CanvasRenderingContext2D;

export interface OpzioniRiga {
  x: number; y: number; larghezza: number;    // dove sta la riga (y = linea di base)
  altezzaX: number;                            // altezza delle lettere piccole
  inchiostro: string;
  inclinazione?: number;                       // 0.2 = corsivo inclinato a destra
  spessore?: number;
}

/** Una riga di corsivo: parole di lettere connesse, con spazi e qualche asta. */
export function scriviRiga(g: C2D, r: () => number, o: OpzioniRiga) {
  const h = o.altezzaX, inc = o.inclinazione ?? 0.22;
  g.save();
  g.translate(o.x, o.y);
  g.transform(1, 0, -inc, 1, 0, 0);           // taglia le lettere verso destra
  g.lineCap = "round"; g.lineJoin = "round";
  g.strokeStyle = o.inchiostro;
  let x = 0;
  const fine = o.larghezza;
  while (x < fine) {
    // una parola: da tre a nove lettere
    const nLettere = 3 + Math.floor(r() * 7);
    const pressione = 0.85 + r() * 0.5;
    g.lineWidth = (o.spessore ?? 1.5) * pressione;
    g.beginPath(); g.moveTo(x, 0);
    for (let k = 0; k < nLettere && x < fine; k++) {
      const p = r();
      const passo = h * (0.55 + r() * 0.5);
      if (p < 0.34) {                                   // gobba: n, m, u
        g.bezierCurveTo(x + passo * 0.1, -h * 1.15, x + passo * 0.5, -h * 1.25, x + passo * 0.55, -h * 0.4);
        g.bezierCurveTo(x + passo * 0.6, 0.05, x + passo * 0.9, 0.05, x + passo, -h * 0.05);
      } else if (p < 0.55) {                            // pancia: a, o, c
        g.bezierCurveTo(x - passo * 0.05, -h * 0.9, x + passo * 0.45, -h * 1.2, x + passo * 0.7, -h * 0.55);
        g.bezierCurveTo(x + passo * 0.45, 0.15, x + passo * 0.1, 0.05, x + passo * 0.5, -h * 0.55);
        g.bezierCurveTo(x + passo * 0.7, -h * 0.35, x + passo * 0.85, 0, x + passo, 0);
      } else if (p < 0.72) {                            // asta con l'occhiello: l, b, h, f
        const alt = h * (2.0 + r() * 0.7);
        g.bezierCurveTo(x + passo * 0.05, -alt * 0.6, x + passo * 0.1, -alt, x + passo * 0.32, -alt * 0.95);
        g.bezierCurveTo(x + passo * 0.6, -alt * 0.9, x + passo * 0.35, -alt * 0.3, x + passo * 0.35, -h * 0.1);
        g.bezierCurveTo(x + passo * 0.5, 0.05, x + passo * 0.8, 0, x + passo, 0);
      } else if (p < 0.84) {                            // coda sotto la riga: g, y, p
        const prof = h * (0.9 + r() * 0.6);
        g.bezierCurveTo(x + passo * 0.2, -h * 1.1, x + passo * 0.6, -h * 1.0, x + passo * 0.55, -h * 0.2);
        g.bezierCurveTo(x + passo * 0.5, prof * 1.0, x + passo * 0.05, prof, x + passo * 0.05, prof * 0.3);
        g.bezierCurveTo(x + passo * 0.3, -h * 0.1, x + passo * 0.75, 0, x + passo, 0);
      } else {                                          // trattino: e, i, r
        g.bezierCurveTo(x + passo * 0.25, -h * 0.9, x + passo * 0.55, -h * 0.9, x + passo * 0.5, -h * 0.3);
        g.bezierCurveTo(x + passo * 0.6, 0.02, x + passo * 0.85, 0, x + passo, -h * 0.12);
      }
      x += passo;
    }
    g.stroke();
    // il puntino o la sbarretta, a volte
    if (r() < 0.35) { g.beginPath(); g.arc(x - h * 0.9, -h * 1.8, 0.9, 0, Math.PI * 2); g.fillStyle = o.inchiostro; g.fill(); }
    x += h * (1.0 + r() * 0.9);                        // lo spazio fra le parole
  }
  g.restore();
}

/** Un foglio di corsivo su più righe, con margine, data in alto e firma in fondo. */
export function scriviLettera(w: number, h: number, seme: number, inchiostro: string): Tela {
  const t = creaTela(w, h), g = ctxDi(t), r = rng(seme);
  const rigaH = 27, primo = 96;
  const righe = Math.floor((h - primo - 40) / rigaH);
  for (let k = 0; k < righe; k++) {
    const y = primo + k * rigaH;
    const ultima = k === righe - 1;
    scriviRiga(g, r, {
      x: 46 + (k === 0 ? 0 : r() * 14), y, larghezza: (w - 100) - (ultima ? 200 : r() * 70), altezzaX: 5.6 + r() * 0.6,
      inchiostro, spessore: 1.5,
    });
  }
  // la firma: un ghirigoro con una lunga coda
  g.strokeStyle = inchiostro; g.lineWidth = 1.9; g.lineCap = "round";
  g.beginPath(); g.moveTo(w - 200, h - 50);
  g.bezierCurveTo(w - 180, h - 86, w - 150, h - 30, w - 130, h - 60);
  g.bezierCurveTo(w - 118, h - 78, w - 100, h - 40, w - 70, h - 54);
  g.bezierCurveTo(w - 60, h - 58, w - 50, h - 50, w - 40, h - 56); g.stroke();
  return t;
}

// --------------------------------------------------------------------
//  Carta
// --------------------------------------------------------------------
export interface OpzioniCarta {
  w: number; h: number; seme: number;
  chiara: string; scura: string;      // i due colori del foglio (angoli opposti)
  invecchiata: number;                // 0..1: fibre, macchie, bordi gialli
  piegheOrizzontali?: number;         // quante pieghe da lettera
  piegaVerticale?: boolean;
}

/** Foglio di carta con grana, macchie di tempo e pieghe che si sentono sotto la luce. */
export async function carta(o: OpzioniCarta): Promise<Tela> {
  const n = fbmPeriodico(o.seme, 6, 4, 0);
  const c1 = hex(o.chiara), c2 = hex(o.scura);
  const t = await riempi(o.w, o.h, (x, y, px) => {
    const u = x / o.w, v = y / o.h;
    const diag = clamp(u * 0.55 + v * 0.45);
    let r = lerp(c1[0], c2[0], diag), gg = lerp(c1[1], c2[1], diag), b = lerp(c1[2], c2[2], diag);
    // grana fine + fibre allungate
    const fine = n(x * 0.55, y * 0.55);
    const fibra = n(x * 0.05 + 40, y * 0.9);
    const grana = fine * 7 + fibra * 6;
    // macchie di tempo, brune e larghe
    const macchia = smooth(0.25, 0.75, n(x * 0.012 + 9, y * 0.012 + 5) * 0.5 + 0.5) * o.invecchiata;
    // bordo ingiallito e un po' consumato
    const dx = Math.min(x, o.w - x) / o.w, dy = Math.min(y, o.h - y) / o.h;
    const bordo = 1 - smooth(0, 0.07, Math.min(dx, dy * 1.4));
    r += grana - macchia * 26 - bordo * 22 * o.invecchiata;
    gg += grana - macchia * 32 - bordo * 30 * o.invecchiata;
    b += grana - macchia * 48 - bordo * 46 * o.invecchiata;
    px[0] = r; px[1] = gg; px[2] = b;
  });
  const g = ctxDi(t);
  // le pieghe: una riga scura sottile, la luce accanto, e la carta che si incurva appena
  const piega = (x0: number, y0: number, x1: number, y1: number) => {
    const ang = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(ang), ny = Math.cos(ang);
    const larg = 14;
    const gr = g.createLinearGradient(x0 - nx * larg, y0 - ny * larg, x0 + nx * larg, y0 + ny * larg);
    gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(0.42, "rgba(0,0,0,.09)"); gr.addColorStop(0.5, "rgba(60,40,20,.28)");
    gr.addColorStop(0.53, "rgba(255,250,235,.32)"); gr.addColorStop(1, "rgba(255,250,235,0)");
    g.save(); g.fillStyle = gr; g.beginPath();
    g.moveTo(x0 - nx * larg, y0 - ny * larg); g.lineTo(x1 - nx * larg, y1 - ny * larg); g.lineTo(x1 + nx * larg, y1 + ny * larg); g.lineTo(x0 + nx * larg, y0 + ny * larg);
    g.closePath(); g.fill(); g.restore();
  };
  for (let k = 1; k <= (o.piegheOrizzontali ?? 0); k++) piega(0, (o.h * k) / ((o.piegheOrizzontali ?? 0) + 1), o.w, (o.h * k) / ((o.piegheOrizzontali ?? 0) + 1) + 1.5);
  if (o.piegaVerticale) piega(o.w / 2, 0, o.w / 2 + 1.2, o.h);
  return t;
}

const hex = (c: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)) as [number, number, number];
