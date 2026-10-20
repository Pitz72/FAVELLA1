// ====================================================================
//  Scrittura a mano, finta ma credibile: righe di corsivo che dalla
//  distanza si leggono come una calligrafia (aste con l'occhiello,
//  gobbe, pance, code sotto la riga) senza dire niente. Il tratto è quello
//  di una penna con il pennino: più grosso nelle discese, più sottile nelle
//  salite, con la pressione che cambia da lettera a lettera, la riga che
//  ondeggia piano e l'inchiostro che ristagna dove la penna si ferma.
//  E un generatore di carta con fibre, macchie e pieghe.
// ====================================================================
import { rng, lerp, clamp } from "./tempo";
import { campoLento, creaTela, ctxDi, fbmPeriodico, riempi, smooth, type Tela } from "./texture";

type C2D = CanvasRenderingContext2D;

export interface OpzioniRiga {
  x: number; y: number; larghezza: number;    // dove sta la riga (y = linea di base)
  altezzaX: number;                            // altezza delle lettere piccole
  inchiostro: string;                          // un colore pieno (rgb): la trasparenza è `opacita`
  opacita?: number;                            // di tutta la riga insieme, così i tratti che si sovrappongono non fanno macchie
  inclinazione?: number;                       // 0.2 = corsivo inclinato a destra
  spessore?: number;
}

/** Un tratto: due punti di controllo e la fine (il principio è dove sta la penna). */
type Tratto = [number, number, number, number, number, number];

/** I tratti di una lettera, a partire dal punto in cui è la penna (x, sulla riga). */
function tratti(p: number, x: number, passo: number, h: number, r: () => number): Tratto[] {
  if (p < 0.34) {                                       // gobba: n, m, u
    return [
      [x + passo * 0.1, -h * 1.15, x + passo * 0.5, -h * 1.25, x + passo * 0.55, -h * 0.4],
      [x + passo * 0.6, 0.05, x + passo * 0.9, 0.05, x + passo, -h * 0.05],
    ];
  }
  if (p < 0.55) {                                       // pancia: a, o, c
    return [
      [x - passo * 0.05, -h * 0.9, x + passo * 0.45, -h * 1.2, x + passo * 0.7, -h * 0.55],
      [x + passo * 0.45, 0.15, x + passo * 0.1, 0.05, x + passo * 0.5, -h * 0.55],
      [x + passo * 0.7, -h * 0.35, x + passo * 0.85, 0, x + passo, 0],
    ];
  }
  if (p < 0.72) {                                       // asta con l'occhiello: l, b, h, f
    const alt = h * (2.0 + r() * 0.7);
    return [
      [x + passo * 0.05, -alt * 0.6, x + passo * 0.1, -alt, x + passo * 0.32, -alt * 0.95],
      [x + passo * 0.6, -alt * 0.9, x + passo * 0.35, -alt * 0.3, x + passo * 0.35, -h * 0.1],
      [x + passo * 0.5, 0.05, x + passo * 0.8, 0, x + passo, 0],
    ];
  }
  if (p < 0.84) {                                       // coda sotto la riga: g, y, p
    const prof = h * (0.9 + r() * 0.6);
    return [
      [x + passo * 0.2, -h * 1.1, x + passo * 0.6, -h * 1.0, x + passo * 0.55, -h * 0.2],
      [x + passo * 0.5, prof * 1.0, x + passo * 0.05, prof, x + passo * 0.05, prof * 0.3],
      [x + passo * 0.3, -h * 0.1, x + passo * 0.75, 0, x + passo, 0],
    ];
  }
  return [                                              // trattino: e, i, r
    [x + passo * 0.25, -h * 0.9, x + passo * 0.55, -h * 0.9, x + passo * 0.5, -h * 0.3],
    [x + passo * 0.6, 0.02, x + passo * 0.85, 0, x + passo, -h * 0.12],
  ];
}

/** Il pennino: l'angolo a cui sta tagliato (rad). Le discese lo incontrano di piatto e vengono grosse. */
const PENNINO = 0.5;

/** Una riga di corsivo: parole di lettere connesse, con spazi e qualche asta. */
export function scriviRiga(g: C2D, r: () => number, o: OpzioniRiga) {
  const h = o.altezzaX, inc = o.inclinazione ?? 0.22, sp = o.spessore ?? 1.5;
  const largo = Math.ceil(o.larghezza + h * 6 + 40), alto = Math.ceil(h * 7 + 20), ox = 20, oy = Math.round(h * 4.2);
  // la riga si scrive piena su una tela a parte, poi si posa con la sua trasparenza: dove due tratti si incrociano non si scurisce.
  // La tela a parte ha i pixel della tela su cui si posa (se questa è scalata, la riga non si ingrandisce sfocata)
  const sc = Math.max(1, g.getTransform().a);
  const foglio = creaTela(largo * sc, alto * sc), t = ctxDi(foglio);
  t.scale(sc, sc);
  t.lineCap = "round"; t.lineJoin = "round";
  t.strokeStyle = o.inchiostro; t.fillStyle = o.inchiostro;
  // la riga ondeggia piano (due onde lente, fasi a caso)
  const f1 = r() * 6.28, f2 = r() * 6.28, a1 = h * (0.10 + r() * 0.10), a2 = h * (0.04 + r() * 0.05);
  const deriva = (x: number) => a1 * Math.sin(x * 0.012 + f1) + a2 * Math.sin(x * 0.031 + f2);
  let incP = inc, dyP = 0;                                   // inclinazione e scostamento della parola che si scrive
  const P = (x: number, y: number): [number, number] => [ox + x - incP * y, oy + y + dyP + deriva(x)];

  /** Un tratto di penna: a pezzetti di sei pixel circa, ognuno con la larghezza che segue l'angolo del pennino e la pressione. */
  const penna = (x0: number, y0: number, t0: Tratto, w0: number, w1: number) => {
    const [c1x, c1y, c2x, c2y, ex, ey] = t0;
    const lung = Math.hypot(c1x - x0, c1y - y0) + Math.hypot(c2x - c1x, c2y - c1y) + Math.hypot(ex - c2x, ey - c2y);
    const pezzi = Math.max(2, Math.ceil(lung / 6)), SUB = 3;
    const punto = (u: number): [number, number] => {
      const v = 1 - u;
      return [v * v * v * x0 + 3 * v * v * u * c1x + 3 * v * u * u * c2x + u * u * u * ex, v * v * v * y0 + 3 * v * v * u * c1y + 3 * v * u * u * c2y + u * u * u * ey];
    };
    let [px, py] = punto(0);
    for (let j = 0; j < pezzi; j++) {
      const [ax, ay] = P(px, py);
      t.beginPath(); t.moveTo(ax, ay);
      let qx = px, qy = py;
      for (let s = 1; s <= SUB; s++) {
        [qx, qy] = punto((j + s / SUB) / pezzi);
        const [bx, by] = P(qx, qy); t.lineTo(bx, by);
      }
      const ang = Math.atan2(qy - py, qx - px);
      const nib = 0.55 + 0.80 * Math.abs(Math.sin(ang - PENNINO));
      t.lineWidth = sp * lerp(w0, w1, (j + 0.5) / pezzi) * nib;
      t.stroke();
      px = qx; py = qy;
    }
    return [px, py] as const;
  };

  let x = 0;
  const fine = o.larghezza;
  while (x < fine) {
    // una parola: da tre a nove lettere, con la sua inclinazione, il suo scostamento e la sua pressione
    const nLettere = 3 + Math.floor(r() * 7);
    incP = inc + (r() - 0.5) * 0.14; dyP = (r() - 0.5) * h * 0.18;
    const pressione = 0.85 + r() * 0.5;
    let penX = x, penY = 0;
    for (let k = 0; k < nLettere && x < fine; k++) {
      const p = r();
      const passo = h * (0.55 + r() * 0.5);
      const pr = pressione * (0.88 + r() * 0.24);          // la pressione cambia da una lettera all'altra
      const ts = tratti(p, x, passo, h, r);
      ts.forEach((tr, i) => {
        // la parola comincia leggera (la penna si appoggia) e finisce più sottile; dentro, la pressione dice la lettera
        const inizio = k === 0 && i === 0 ? 0.55 : 1;
        const [ex, ey] = penna(penX, penY, tr, pr * inizio, pr * (i === ts.length - 1 ? 0.92 : 1));
        penX = ex; penY = ey;
      });
      x += passo;
    }
    // l'inchiostro ristagna dove la penna si ferma: un puntino appena più scuro e più grosso del tratto
    { const [bx, by] = P(penX, penY); t.beginPath(); t.arc(bx, by, sp * pressione * 0.62, 0, Math.PI * 2); t.fill(); }
    // il puntino o la sbarretta, a volte
    if (r() < 0.35) { const [bx, by] = P(x - h * 0.9, -h * 1.8); t.beginPath(); t.arc(bx, by, 0.9 + sp * 0.2, 0, Math.PI * 2); t.fill(); }
    x += h * (1.0 + r() * 0.9);                            // lo spazio fra le parole
  }
  g.save();
  g.globalAlpha = o.opacita ?? 1;
  g.drawImage(foglio, o.x - ox, o.y - oy, largo, alto);
  g.restore();
}

/** Un foglio di corsivo su più righe, con margine, data in alto e firma in fondo. */
export function scriviLettera(w: number, h: number, seme: number, inchiostro: string, opacita = 1, scala = 1): Tela {
  const t = creaTela(w * scala, h * scala), g = ctxDi(t), r = rng(seme);
  g.scale(scala, scala);                                    // la geometria è quella di w × h; i pixel sono `scala` volte di più
  const rigaH = 27, primo = 96;
  const righe = Math.floor((h - primo - 40) / rigaH);
  for (let k = 0; k < righe; k++) {
    const y = primo + k * rigaH;
    const ultima = k === righe - 1;
    scriviRiga(g, r, {
      x: 46 + (k === 0 ? 0 : r() * 14), y, larghezza: (w - 100) - (ultima ? 200 : r() * 70), altezzaX: 5.6 + r() * 0.6,
      inchiostro, opacita, spessore: 1.5,
    });
  }
  // la firma: un ghirigoro con una lunga coda
  g.save(); g.globalAlpha = opacita;
  g.strokeStyle = inchiostro; g.lineWidth = 1.9; g.lineCap = "round";
  g.beginPath(); g.moveTo(w - 200, h - 50);
  g.bezierCurveTo(w - 180, h - 86, w - 150, h - 30, w - 130, h - 60);
  g.bezierCurveTo(w - 118, h - 78, w - 100, h - 40, w - 70, h - 54);
  g.bezierCurveTo(w - 60, h - 58, w - 50, h - 50, w - 40, h - 56); g.stroke();
  g.restore();
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
  const macchiaF = campoLento((x, y) => n(x * 0.012 + 9, y * 0.012 + 5), o.w, o.h, 8, false);   // le macchie di tempo sono lente: a griglia
  const t = await riempi(o.w, o.h, (x, y, px) => {
    const u = x / o.w, v = y / o.h;
    const diag = clamp(u * 0.55 + v * 0.45);
    let r = lerp(c1[0], c2[0], diag), gg = lerp(c1[1], c2[1], diag), b = lerp(c1[2], c2[2], diag);
    // grana fine + fibre allungate
    const fine = n(x * 0.55, y * 0.55);
    const fibra = n(x * 0.05 + 40, y * 0.9);
    const grana = fine * 7 + fibra * 6;
    // macchie di tempo, brune e larghe
    const macchia = smooth(0.25, 0.75, macchiaF(x, y) * 0.5 + 0.5) * o.invecchiata;
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
