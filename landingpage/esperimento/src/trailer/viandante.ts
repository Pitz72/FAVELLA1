// ====================================================================
//  Il viandante: figura procedurale con ciclo del passo.
// --------------------------------------------------------------------
//  Scheletro 2D (anca, ginocchio, caviglia; spalla, gomito, mano) guidato
//  da una sola fase. Coscia sinusoidale, ginocchio che si flette solo nella
//  fase di volo, bacino che sale e scende due volte per ciclo, busto piegato
//  in avanti, braccio della tanica quasi fermo (il peso), fagotto sulla
//  schiena, cappello a tesa larga. Luce di contorno dal lato del sole.
//  Coordinate locali: piedi a y=0, altezza 1 (scalata da `alto`).
// ====================================================================

export interface OpzioniFigura {
  colore: string;        // silhouette
  lontano?: string;      // arti sul lato lontano (più scuri)
  bordo?: string;        // luce di contorno (null = nessuna)
  latoLuce?: number;     // -1 luce da sinistra, +1 da destra
  verso?: number;        // -1 guarda a sinistra (ovest), +1 a destra
  fermo?: number;        // 0 cammina … 1 in piedi fermo
  tanica?: boolean;
  fagotto?: boolean;
  cappello?: boolean;
  respiro?: number;      // tempo, per il respiro da fermo
}

const TAU = Math.PI * 2;

/** Pose articolari per una fase (0..1 = un ciclo completo, due passi). */
function posa(fase: number, fermo: number) {
  const k = 1 - fermo;
  const gamba = (q: number) => {
    const s = Math.sin(TAU * q), c = Math.cos(TAU * q);
    const coscia = 0.42 * s * k;
    const volo = Math.max(0, c);
    const ginocchio = (0.06 + 0.62 * volo * volo) * k + 0.02 * fermo;
    const piede = (-0.15 * volo + 0.12 * Math.max(0, -c) * Math.max(0, s)) * k;
    return { coscia, ginocchio, piede };
  };
  const braccio = (q: number, ampiezza: number) => {
    const s = Math.sin(TAU * q);
    return { spalla: -ampiezza * s * k + 0.05, gomito: 0.28 + 0.18 * Math.max(0, -s) * k };
  };
  return {
    bob: 0.013 * Math.cos(TAU * 2 * fase) * k,
    busto: 0.07 * k + 0.015,
    vicina: gamba(fase),
    lontana: gamba(fase + 0.5),
    bVicino: braccio(fase + 0.5, 0.12),   // porta la tanica: oscilla poco
    bLontano: braccio(fase, 0.38),
  };
}

export function disegnaViandante(
  ctx: CanvasRenderingContext2D, x: number, y: number, alto: number, fase: number, o: OpzioniFigura,
) {
  const v = o.verso ?? -1;
  const fermo = o.fermo ?? 0;
  const p = posa(((fase % 1) + 1) % 1, fermo);
  const respiro = fermo * 0.004 * Math.sin((o.respiro ?? 0) * 1.9);

  // passata 1: contorno luminoso (spostato verso la luce), passata 2: figura
  const passate: { col: string; lon: string; dx: number; dy: number }[] = [];
  // lo spessore della luce di contorno resta di pochi pixel a ogni scala
  const sb = Math.min(0.011, 4.5 / alto);
  if (o.bordo) passate.push({ col: o.bordo, lon: o.bordo, dx: (o.latoLuce ?? 1) * sb, dy: -sb * 0.5 });
  passate.push({ col: o.colore, lon: o.lontano ?? o.colore, dx: 0, dy: 0 });

  for (const ps of passate) {
    ctx.save();
    ctx.translate(x + ps.dx * alto, y + ps.dy * alto);
    // da qui: x positivo = AVANTI (per v=-1 lo specchio porta l'avanti a sinistra)
    ctx.scale(alto * v, alto * (1 + respiro));
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    figura(ctx, p, ps.col, ps.lon, o);
    ctx.restore();
  }
}

type Posa = ReturnType<typeof posa>;

function figura(ctx: CanvasRenderingContext2D, p: Posa, col: string, lon: string, o: OpzioniFigura) {
  const anca = { x: 0, y: -0.5 + p.bob };
  const spalla = { x: Math.sin(p.busto) * 0.3, y: anca.y - Math.cos(p.busto) * 0.3 };
  const collo = { x: spalla.x + Math.sin(p.busto) * 0.04, y: spalla.y - 0.045 };
  const testa = { x: collo.x + 0.012, y: collo.y - 0.075 };

  const gamba = (g: { coscia: number; ginocchio: number; piede: number }, colore: string, spessore: number) => {
    const L1 = 0.245, L2 = 0.245;
    const gin = { x: anca.x + Math.sin(g.coscia) * L1, y: anca.y + Math.cos(g.coscia) * L1 };
    const aStinco = g.coscia - g.ginocchio;
    const cav = { x: gin.x + Math.sin(aStinco) * L2, y: gin.y + Math.cos(aStinco) * L2 };
    ctx.strokeStyle = colore;
    ctx.lineWidth = spessore;
    ctx.beginPath(); ctx.moveTo(anca.x, anca.y); ctx.lineTo(gin.x, gin.y); ctx.lineTo(cav.x, cav.y); ctx.stroke();
    // scarpa
    const aP = g.piede;
    ctx.lineWidth = spessore * 0.85;
    ctx.beginPath(); ctx.moveTo(cav.x - 0.012, cav.y + 0.004);
    ctx.lineTo(cav.x + Math.cos(aP) * 0.075, cav.y + 0.006 + Math.sin(aP) * 0.075); ctx.stroke();
  };

  const braccio = (b: { spalla: number; gomito: number }, colore: string, spessore: number, tanica: boolean) => {
    const L1 = 0.165, L2 = 0.155;
    const a1 = b.spalla + p.busto * 0.5;
    const gom = { x: spalla.x + Math.sin(a1) * L1, y: spalla.y + Math.cos(a1) * L1 };
    const a2 = a1 + b.gomito;
    const mano = { x: gom.x + Math.sin(a2) * L2, y: gom.y + Math.cos(a2) * L2 };
    ctx.strokeStyle = colore; ctx.lineWidth = spessore;
    ctx.beginPath(); ctx.moveTo(spalla.x, spalla.y); ctx.lineTo(gom.x, gom.y); ctx.lineTo(mano.x, mano.y); ctx.stroke();
    if (tanica) {
      // la tanica pende dalla mano: manico + corpo arrotondato
      ctx.fillStyle = colore;
      ctx.lineWidth = 0.012;
      ctx.beginPath(); ctx.moveTo(mano.x - 0.02, mano.y + 0.005); ctx.lineTo(mano.x + 0.02, mano.y + 0.005); ctx.stroke();
      rettangoloTondo(ctx, mano.x - 0.052, mano.y + 0.012, 0.104, 0.128, 0.018);
      ctx.fill();
    }
  };

  // lato lontano
  braccio(p.bLontano, lon, 0.04, false);
  gamba(p.lontana, lon, 0.052);

  // fagotto sulla schiena
  if (o.fagotto) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.ellipse(spalla.x - 0.085, spalla.y + 0.08, 0.06, 0.085, -0.25, 0, TAU);
    ctx.fill();
  }

  // busto: cappotto che arriva a metà coscia, con l'orlo che segue il passo
  const orlo = anca.y + 0.13;
  const sv = Math.sin(p.vicina.coscia) * 0.05;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(spalla.x - 0.055, spalla.y + 0.005);
  ctx.quadraticCurveTo(spalla.x + 0.075, spalla.y - 0.01, spalla.x + 0.06, spalla.y + 0.06);
  ctx.lineTo(anca.x + 0.07 + sv, orlo);
  ctx.lineTo(anca.x - 0.075 + sv * 0.4, orlo + 0.01);
  ctx.quadraticCurveTo(anca.x - 0.075, anca.y - 0.1, spalla.x - 0.055, spalla.y + 0.005);
  ctx.closePath();
  ctx.fill();

  // lato vicino
  gamba(p.vicina, col, 0.058);
  braccio(p.bVicino, col, 0.044, !!o.tanica);

  // collo e testa
  ctx.strokeStyle = col; ctx.lineWidth = 0.04;
  ctx.beginPath(); ctx.moveTo(spalla.x, spalla.y); ctx.lineTo(collo.x, collo.y); ctx.stroke();
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.ellipse(testa.x, testa.y, 0.052, 0.06, 0, 0, TAU); ctx.fill();
  if (o.cappello) {
    ctx.beginPath(); ctx.ellipse(testa.x + 0.006, testa.y - 0.028, 0.105, 0.016, -0.05, 0, TAU); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(testa.x - 0.05, testa.y - 0.03);
    ctx.quadraticCurveTo(testa.x - 0.045, testa.y - 0.1, testa.x + 0.005, testa.y - 0.095);
    ctx.quadraticCurveTo(testa.x + 0.055, testa.y - 0.1, testa.x + 0.055, testa.y - 0.03);
    ctx.closePath(); ctx.fill();
  }
}

function rettangoloTondo(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Ombra portata: la stessa figura schiacciata e inclinata sul terreno. */
export function disegnaOmbra(
  ctx: CanvasRenderingContext2D, x: number, y: number, alto: number, fase: number,
  o: OpzioniFigura, inclinazione: number, schiacciamento: number, colore: string,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.transform(1, 0, inclinazione, schiacciamento, 0, 0);
  disegnaViandante(ctx, 0, 0, alto, fase, { ...o, colore, lontano: colore, bordo: undefined });
  ctx.restore();
}
