// ====================================================================
//  Il viandante.
// --------------------------------------------------------------------
//  Una figura di profilo, alta 1 (piedi a y=0, y negativa in su), disegnata
//  con forme piene e non con tratti: gambe rastremate, stivali, cappotto
//  lungo che segue il passo, fagotto sulla schiena, cappello a tesa larga,
//  la tanica in mano. Il passo è un ciclo vero:
//    · anca, ginocchio e piede seguono le curve di una camminata umana
//      (appoggio del tallone, carico, spinta, oscillazione);
//    · il bacino si alza e si abbassa da solo perché il piede che poggia
//      stia sempre a terra (risolutore di appoggio): niente piedi che
//      affondano o che galleggiano;
//    · le braccia bilanciano le gambe; la tanica pesa e dondola;
//    · l'orlo del cappotto arriva con un po' di ritardo.
//  `PASSO_CICLO` dice quanta strada fa il corpo in un ciclo (due passi): la
//  velocità a cui scorre il paesaggio è `passoCiclo·alto·cadenza`, e i piedi
//  non scivolano.
//  `dettaglio`: 0 silhouette, 1 con cappello e volto, 2 primo piano (cuciture,
//  lacci, suola, pieghe, luci sul cuoio).
// ====================================================================

export interface OpzioniFigura {
  colore: string;        // cappotto e forma generale
  lontano?: string;      // arti sul lato lontano (più scuri)
  bordo?: string;        // luce di contorno (null = nessuna)
  latoLuce?: number;     // -1 luce da sinistra, +1 da destra
  verso?: number;        // -1 guarda a sinistra (ovest), +1 a destra
  fermo?: number;        // 0 cammina … 1 in piedi fermo
  tanica?: boolean;
  fagotto?: boolean;
  cappello?: boolean;
  respiro?: number;      // tempo, per il respiro da fermo
  ampiezza?: number;     // 0..1: lunghezza del passo (1 = normale)
  dettaglio?: 0 | 1 | 2;
  braccia?: number;      // apertura delle braccia in avanti (rad), per chi sbarra il passo
  pantaloni?: string;    // colore dei pantaloni (dettaglio 2)
  stivali?: string;      // colore degli stivali (dettaglio 2)
  polvere?: string;      // colore della polvere sugli orli (dettaglio 2)
  senzaTesta?: boolean;  // inquadratura dal ginocchio in giù
}

const TAU = Math.PI * 2;

// --------------------------------------------------------------------
//  Le curve del passo (fase 0 = tallone che tocca terra), periodiche.
//  Anca: coscia rispetto alla verticale, in avanti positiva. Ginocchio:
//  flessione. Piede: inclinazione rispetto al suolo (punta in su positiva).
// --------------------------------------------------------------------
type Chiavi = [number, number][];
function curva(chiavi: Chiavi) {
  const n = chiavi.length;
  return (fase: number) => {
    const f = ((fase % 1) + 1) % 1;
    let i = 0;
    while (i < n - 1 && chiavi[i + 1][0] <= f) i++;
    const a = chiavi[i], b = chiavi[(i + 1) % n];
    const bx = i + 1 < n ? b[0] : b[0] + 1;
    const t = (f - a[0]) / (bx - a[0] || 1);
    const p0 = chiavi[(i - 1 + n) % n][1], p1 = a[1], p2 = b[1], p3 = chiavi[(i + 2) % n][1];
    // Catmull-Rom
    return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
  };
}
const ANCA = curva([[0, 0.40], [0.12, 0.30], [0.30, 0.02], [0.48, -0.26], [0.60, -0.36], [0.70, -0.10], [0.82, 0.24], [0.92, 0.39]]);
const GINOCCHIO = curva([[0, 0.05], [0.10, 0.22], [0.24, 0.10], [0.40, 0.14], [0.52, 0.48], [0.62, 0.95], [0.72, 1.08], [0.84, 0.66], [0.94, 0.16]]);
const PIEDE = curva([[0, 0.34], [0.07, 0.02], [0.24, 0], [0.42, 0], [0.50, -0.22], [0.60, -0.62], [0.72, -0.44], [0.84, -0.18], [0.94, 0.14]]);

// misure del corpo (altezza = 1)
const L = { coscia: 0.246, stinco: 0.24, suola: 0.034, piede: 0.16 };
const BUSTO = 0.315;

/** Strada che il corpo fa in un ciclo di due passi, in altezze, a passo pieno. */
export const PASSO_CICLO = (() => {
  // il piede d'appoggio scorre indietro rispetto all'anca dal tallone (fase 0) alla spinta (fase 0.6)
  const x = (f: number) => L.coscia * Math.sin(ANCA(f)) + L.stinco * Math.sin(ANCA(f) - GINOCCHIO(f));
  return 2 * (x(0.02) - x(0.58));
})();

/** Velocità (px/s) a cui deve scorrere il suolo sotto un viandante alto `alto` px con la cadenza data. */
export const velocitaSuolo = (alto: number, cadenza: number, ampiezza = 1) => PASSO_CICLO * ampiezza * alto * cadenza;

interface Punto { x: number; y: number }
const P = (x: number, y: number): Punto => ({ x, y });
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ruota = (p: Punto, a: number): Punto => ({ x: p.x * Math.cos(a) - p.y * Math.sin(a), y: p.x * Math.sin(a) + p.y * Math.cos(a) });
const somma = (a: Punto, b: Punto): Punto => P(a.x + b.x, a.y + b.y);

interface Gamba { anca: Punto; ginocchio: Punto; caviglia: Punto; angPiede: number; angStinco: number; angCoscia: number; }

/** Le articolazioni di una gamba, con l'anca in (0, hy). */
function gamba(f: number, ampiezza: number, fermo: number, hy: number, deriva: number): Gamba {
  const a = lerp(ANCA(f) * ampiezza, deriva, fermo);
  const k = lerp(GINOCCHIO(f) * (0.55 + 0.45 * ampiezza), 0.04, fermo);
  const fp = lerp(PIEDE(f) * (0.6 + 0.4 * ampiezza), 0, fermo);
  const anca = P(0, hy);
  const ginocchio = P(L.coscia * Math.sin(a), hy + L.coscia * Math.cos(a));
  const angS = a - k;
  const caviglia = P(ginocchio.x + L.stinco * Math.sin(angS), ginocchio.y + L.stinco * Math.cos(angS));
  return { anca, ginocchio, caviglia, angPiede: fp, angStinco: angS, angCoscia: a };
}

/** Il punto più basso del piede (per l'appoggio), rispetto alla caviglia già posta. */
function fondoPiede(g: Gamba) {
  const c = Math.cos(-g.angPiede), s = Math.sin(-g.angPiede);
  const pts = [P(-0.045, L.suola), P(L.piede - 0.05, L.suola)];
  return Math.max(...pts.map((p) => g.caviglia.y + p.x * s + p.y * c));
}

// --------------------------------------------------------------------
//  Forme
// --------------------------------------------------------------------
type Ctx = CanvasRenderingContext2D;

/** Un arto rastremato fra due giunti, con i capi tondi. */
function arto(ctx: Ctx, a: Punto, ra: number, b: Punto, rb: number) {
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
  const nx = -dy / d, ny = dx / d;
  const ang = Math.atan2(dy, dx);
  ctx.beginPath();
  ctx.moveTo(a.x + nx * ra, a.y + ny * ra);
  ctx.lineTo(b.x + nx * rb, b.y + ny * rb);
  ctx.arc(b.x, b.y, rb, ang + Math.PI / 2, ang - Math.PI / 2, true);
  ctx.lineTo(a.x - nx * ra, a.y - ny * ra);
  ctx.arc(a.x, a.y, ra, ang - Math.PI / 2, ang + Math.PI / 2, true);
  ctx.closePath();
}

function rettTondo(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const q = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + q, y);
  ctx.arcTo(x + w, y, x + w, y + h, q); ctx.arcTo(x + w, y + h, x, y + h, q);
  ctx.arcTo(x, y + h, x, y, q); ctx.arcTo(x, y, x + w, y, q);
  ctx.closePath();
}

interface Colori { cappotto: string; lontano: string; pantaloni: string; stivali: string; tanica: string; cuoio: string; polvere: string; }

function coloriDa(o: OpzioniFigura): Colori {
  const c = o.colore;
  const pieno = o.dettaglio === 2;
  return {
    cappotto: c,
    lontano: o.lontano ?? c,
    pantaloni: pieno ? (o.pantaloni ?? "#2a2320") : c,
    stivali: pieno ? (o.stivali ?? "#2b1b12") : c,
    tanica: pieno ? "#6b6a3e" : c,
    cuoio: pieno ? "#4a2f1d" : c,
    polvere: o.polvere ?? "#b99a74",
  };
}

// --------------------------------------------------------------------
//  Lo stivale: gambale, piede e (in primo piano) suola, guardolo, cuciture,
//  lacci, pieghe e luce sul cuoio. Il risvolto dei pantaloni ci cade sopra.
// --------------------------------------------------------------------
function stivale(ctx: Ctx, g: Gamba, col: Colori, dettaglio: number, lontano: boolean) {
  const base = lontano ? col.lontano : col.stivali;

  if (dettaglio < 2) {
    // silhouette: gambale e piede in un colore solo
    ctx.save();
    ctx.translate(g.caviglia.x, g.caviglia.y); ctx.rotate(-g.angStinco);
    ctx.fillStyle = base;
    ctx.beginPath(); ctx.moveTo(-0.033, -0.10); ctx.lineTo(0.031, -0.10); ctx.lineTo(0.034, -0.012); ctx.lineTo(-0.036, -0.012); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(g.caviglia.x, g.caviglia.y); ctx.rotate(-g.angPiede);
    ctx.fillStyle = base;
    ctx.beginPath();
    ctx.moveTo(-0.046, -0.004); ctx.quadraticCurveTo(-0.058, 0.016, -0.05, L.suola); ctx.lineTo(0.112, L.suola);
    ctx.quadraticCurveTo(0.140, L.suola - 0.002, 0.138, 0.012); ctx.quadraticCurveTo(0.128, -0.012, 0.075, -0.024);
    ctx.lineTo(0.036, -0.030); ctx.lineTo(0.036, -0.012); ctx.closePath(); ctx.fill();
    ctx.restore();
    return;
  }

  const CUOIO = lontano ? "#20140d" : base;
  const ALTA = lontano ? "#3a2618" : "#8a5c38";
  const BASSA = "#140b06";

  // ─ gambale (nel sistema dello stinco: la caviglia è l'origine, l'alto è -y)
  ctx.save();
  ctx.translate(g.caviglia.x, g.caviglia.y); ctx.rotate(-g.angStinco);
  const cil = ctx.createLinearGradient(-0.046, 0, 0.042, 0);
  cil.addColorStop(0, BASSA); cil.addColorStop(0.32, lontano ? "#2c1b11" : "#5a3a24"); cil.addColorStop(0.55, ALTA); cil.addColorStop(1, BASSA);
  ctx.fillStyle = cil;
  ctx.beginPath();
  ctx.moveTo(-0.044, -0.128); ctx.quadraticCurveTo(0.0, -0.132, 0.041, -0.128);
  ctx.lineTo(0.036, -0.012); ctx.lineTo(-0.041, -0.012); ctx.closePath(); ctx.fill();
  if (!lontano) {
    // pieghe del cuoio che si accartoccia sul collo del piede
    ctx.lineCap = "round";
    for (let k = 0; k < 5; k++) {
      const y = -0.030 - k * 0.017;
      ctx.strokeStyle = "rgba(10,5,2,.55)"; ctx.lineWidth = 0.0032;
      ctx.beginPath(); ctx.moveTo(-0.040, y); ctx.quadraticCurveTo(0.0, y + 0.010, 0.036, y - 0.002); ctx.stroke();
      ctx.strokeStyle = "rgba(255,224,180,.22)"; ctx.lineWidth = 0.0018;
      ctx.beginPath(); ctx.moveTo(-0.038, y - 0.004); ctx.quadraticCurveTo(0.0, y + 0.006, 0.034, y - 0.006); ctx.stroke();
    }
    // cucitura verticale sul retro
    ctx.strokeStyle = "rgba(230,190,140,.5)"; ctx.lineWidth = 0.0016; ctx.setLineDash([0.006, 0.005]);
    ctx.beginPath(); ctx.moveTo(-0.028, -0.010); ctx.lineTo(-0.030, -0.120); ctx.stroke(); ctx.setLineDash([]);
  }
  // il risvolto dei pantaloni ricade sul gambale, con la polvere dell'orlo
  ctx.fillStyle = col.pantaloni;
  ctx.beginPath();
  ctx.moveTo(-0.050, -0.150); ctx.lineTo(0.046, -0.150);
  ctx.quadraticCurveTo(0.054, -0.118, 0.047, -0.092); ctx.quadraticCurveTo(0.0, -0.084, -0.051, -0.092);
  ctx.quadraticCurveTo(-0.057, -0.120, -0.050, -0.150); ctx.closePath(); ctx.fill();
  const pol = ctx.createLinearGradient(0, -0.115, 0, -0.084);
  pol.addColorStop(0, "rgba(0,0,0,0)"); pol.addColorStop(1, col.polvere + "88");
  ctx.fillStyle = pol; ctx.fillRect(-0.056, -0.115, 0.108, 0.031);
  ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 0.002;
  ctx.beginPath(); ctx.moveTo(-0.020, -0.146); ctx.lineTo(-0.022, -0.090); ctx.moveTo(0.018, -0.146); ctx.lineTo(0.022, -0.090); ctx.stroke();
  ctx.restore();

  // ─ piede (origine alla caviglia, punta in +x, suolo a y = suola)
  ctx.save();
  ctx.translate(g.caviglia.x, g.caviglia.y); ctx.rotate(-g.angPiede);
  const UPPER = new Path2D();
  UPPER.moveTo(-0.046, -0.030); UPPER.quadraticCurveTo(-0.061, -0.004, -0.057, 0.013);
  UPPER.lineTo(0.124, 0.013); UPPER.quadraticCurveTo(0.152, 0.011, 0.147, -0.006);
  UPPER.quadraticCurveTo(0.139, -0.021, 0.102, -0.031); UPPER.quadraticCurveTo(0.072, -0.040, 0.042, -0.043);
  UPPER.lineTo(0.036, -0.062); UPPER.lineTo(-0.040, -0.062); UPPER.closePath();
  const cu = ctx.createLinearGradient(0, -0.045, 0, 0.014);
  cu.addColorStop(0, lontano ? "#3a2618" : "#7d5232"); cu.addColorStop(0.45, CUOIO); cu.addColorStop(1, BASSA);
  ctx.fillStyle = cu; ctx.fill(UPPER);
  if (!lontano) {
    ctx.save(); ctx.clip(UPPER);
    // riflesso lungo il collo del piede e sulla mascherina
    const sp = ctx.createLinearGradient(0.02, -0.04, 0.15, -0.006);
    sp.addColorStop(0, "rgba(255,226,186,0)"); sp.addColorStop(0.5, "rgba(255,226,186,.34)"); sp.addColorStop(1, "rgba(255,226,186,0)");
    ctx.fillStyle = sp; ctx.fillRect(0.02, -0.045, 0.14, 0.05);
    // mascherina: la cucitura arcuata sulla punta
    ctx.strokeStyle = "rgba(8,4,2,.7)"; ctx.lineWidth = 0.0032;
    ctx.beginPath(); ctx.moveTo(0.084, -0.034); ctx.quadraticCurveTo(0.112, -0.012, 0.100, 0.014); ctx.stroke();
    ctx.strokeStyle = "rgba(240,200,150,.55)"; ctx.lineWidth = 0.0014; ctx.setLineDash([0.005, 0.004]);
    ctx.beginPath(); ctx.moveTo(0.087, -0.034); ctx.quadraticCurveTo(0.116, -0.012, 0.104, 0.014); ctx.stroke(); ctx.setLineDash([]);
    // contrafforte del tallone, più scuro, con la cucitura
    ctx.fillStyle = "rgba(0,0,0,.30)";
    ctx.beginPath(); ctx.moveTo(-0.062, -0.030); ctx.lineTo(-0.024, -0.030); ctx.quadraticCurveTo(-0.014, -0.010, -0.020, 0.014); ctx.lineTo(-0.062, 0.014); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(240,200,150,.5)"; ctx.lineWidth = 0.0014; ctx.setLineDash([0.005, 0.004]);
    ctx.beginPath(); ctx.moveTo(-0.026, -0.030); ctx.quadraticCurveTo(-0.017, -0.010, -0.022, 0.013); ctx.stroke(); ctx.setLineDash([]);
    // lacci: occhielli metallici lungo il collo del piede e le incrociature
    for (let k = 0; k < 5; k++) {
      const x = 0.038 + k * 0.0135, y = -0.040 + k * 0.0022;
      ctx.fillStyle = "rgba(20,10,4,.85)"; ctx.beginPath(); ctx.arc(x, y, 0.0036, 0, TAU); ctx.fill();
      ctx.fillStyle = "rgba(210,180,120,.85)"; ctx.beginPath(); ctx.arc(x, y - 0.0006, 0.0021, 0, TAU); ctx.fill();
      if (k < 4) {
        ctx.strokeStyle = "rgba(14,8,4,.9)"; ctx.lineWidth = 0.0034; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 0.0135, y + 0.0022 + 0.010); ctx.moveTo(x + 0.0135, y + 0.0022); ctx.lineTo(x, y + 0.010); ctx.stroke();
      }
    }
    // le pieghe della flessione della punta
    ctx.strokeStyle = "rgba(8,4,2,.5)"; ctx.lineWidth = 0.0028; ctx.lineCap = "round";
    for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(0.052 + k * 0.006, -0.036 + k * 0.004); ctx.quadraticCurveTo(0.064 + k * 0.006, -0.02, 0.054 + k * 0.006, 0.008); ctx.stroke(); }
    ctx.restore();
  }
  // guardolo (la fascia chiara fra tomaia e suola) e suola spessa, con i tacchetti
  ctx.fillStyle = lontano ? "#4a3822" : "#b18a58";
  ctx.beginPath(); ctx.moveTo(-0.058, 0.010); ctx.lineTo(0.150, 0.010); ctx.lineTo(0.150, 0.018); ctx.lineTo(-0.058, 0.018); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#120a06";
  ctx.beginPath();
  ctx.moveTo(-0.058, 0.017); ctx.lineTo(0.151, 0.017); ctx.quadraticCurveTo(0.157, 0.026, 0.147, 0.030);
  ctx.lineTo(0.120, L.suola); ctx.lineTo(-0.046, L.suola); ctx.quadraticCurveTo(-0.060, 0.030, -0.058, 0.017); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#2a1a10"; ctx.fillRect(-0.058, 0.017, 0.209, 0.0025);
  ctx.fillStyle = "#050302";
  for (let x = -0.044; x < 0.13; x += 0.019) ctx.fillRect(x, 0.030, 0.011, 0.005);
  if (!lontano) {
    ctx.strokeStyle = "rgba(245,215,170,.65)"; ctx.lineWidth = 0.0014; ctx.setLineDash([0.005, 0.0045]);
    ctx.beginPath(); ctx.moveTo(-0.054, 0.0125); ctx.lineTo(0.146, 0.0125); ctx.stroke(); ctx.setLineDash([]);
  }
  // polvere sul piede
  const gp = ctx.createLinearGradient(0, -0.01, 0, L.suola);
  gp.addColorStop(0, "rgba(0,0,0,0)"); gp.addColorStop(1, col.polvere + "cc");
  ctx.fillStyle = gp; ctx.fillRect(-0.06, -0.01, 0.216, L.suola + 0.01);
  ctx.restore();
}

// --------------------------------------------------------------------
//  La tanica: recipiente da dieci litri, di lamiera, con il collo e il
//  tappo su un angolo, la maniglia e le nervature incrociate.
// --------------------------------------------------------------------
function tanica(ctx: Ctx, mano: Punto, oscilla: number, col: string, dettaglio: number) {
  ctx.save();
  ctx.translate(mano.x, mano.y);
  ctx.rotate(oscilla);
  const w = 0.132, h = 0.176, top = 0.03;
  // maniglia
  ctx.strokeStyle = col; ctx.lineWidth = 0.012; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-0.028, top + 0.006); ctx.quadraticCurveTo(-0.028, -0.016, 0, -0.016); ctx.quadraticCurveTo(0.028, -0.016, 0.028, top + 0.006); ctx.stroke();
  ctx.fillStyle = col;
  rettTondo(ctx, -w / 2, top, w, h, 0.014); ctx.fill();
  // spalla smussata e collo
  ctx.beginPath(); ctx.moveTo(-w / 2 + 0.01, top + 0.002); ctx.lineTo(w / 2 - 0.02, top + 0.002); ctx.lineTo(w / 2 - 0.036, top - 0.012); ctx.lineTo(-w / 2 + 0.03, top - 0.012); ctx.closePath(); ctx.fill();
  ctx.fillRect(w / 2 - 0.060, top - 0.038, 0.030, 0.03);                 // il collo con il tappo, ben alto sull'angolo
  ctx.fillRect(w / 2 - 0.064, top - 0.042, 0.038, 0.010);
  if (dettaglio >= 2) {
    // luce e ombra sul lamierino
    const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    g.addColorStop(0, "rgba(255,245,200,.22)"); g.addColorStop(0.35, "rgba(255,245,200,0)"); g.addColorStop(1, "rgba(0,0,0,.32)");
    ctx.fillStyle = g; rettTondo(ctx, -w / 2, top, w, h, 0.014); ctx.fill();
    // nervature: la croce e i bordi rialzati
    ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 0.0035;
    ctx.beginPath(); ctx.moveTo(-w / 2 + 0.014, top + 0.026); ctx.lineTo(w / 2 - 0.014, top + h - 0.02); ctx.moveTo(w / 2 - 0.014, top + 0.026); ctx.lineTo(-w / 2 + 0.014, top + h - 0.02); ctx.stroke();
    ctx.strokeStyle = "rgba(255,240,200,.22)"; ctx.lineWidth = 0.0018;
    ctx.beginPath(); ctx.moveTo(-w / 2 + 0.014, top + 0.030); ctx.lineTo(w / 2 - 0.014, top + h - 0.016); ctx.moveTo(w / 2 - 0.014, top + 0.030); ctx.lineTo(-w / 2 + 0.014, top + h - 0.016); ctx.stroke();
    ctx.strokeStyle = "rgba(0,0,0,.4)"; ctx.lineWidth = 0.003;
    rettTondo(ctx, -w / 2 + 0.010, top + 0.012, w - 0.02, h - 0.028, 0.008); ctx.stroke();
    // tappo, ammaccatura, ruggine
    ctx.fillStyle = "#8a2f1c"; ctx.fillRect(w / 2 - 0.058, top - 0.034, 0.024, 0.010);
    ctx.fillStyle = "rgba(150,70,30,.28)"; ctx.beginPath(); ctx.ellipse(-0.02, top + h - 0.03, 0.03, 0.014, 0.2, 0, TAU); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.beginPath(); ctx.ellipse(0.025, top + 0.07, 0.018, 0.022, -0.3, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// --------------------------------------------------------------------
//  Il viandante intero, per una fase del passo
// --------------------------------------------------------------------
function figura(ctx: Ctx, f: number, o: OpzioniFigura, col: Colori, luce: boolean) {
  const amp = o.ampiezza ?? 1;
  const fermo = o.fermo ?? 0;
  const det = o.dettaglio ?? 0;
  const respiro = fermo * 0.004 * Math.sin((o.respiro ?? 0) * 1.9);

  // le due gambe; il bacino si posa dove il piede d'appoggio tocca terra
  const vicina = gamba(f, amp, fermo, 0, 0.05);
  const lontana = gamba(f + 0.5, amp, fermo, 0, -0.07);
  const hy = -Math.max(fondoPiede(vicina), fondoPiede(lontana));
  for (const g of [vicina, lontana]) {
    g.anca.y += hy; g.ginocchio.y += hy; g.caviglia.y += hy;
  }
  const anca = P(0, hy - 0.004 * Math.cos(f * TAU * 2) * (1 - fermo));

  // il busto: inclinato in avanti sotto il peso, con un piccolo ritmo
  const busto = lerp(0.115 + 0.018 * Math.cos((f + 0.05) * TAU * 2) * amp, 0.05, fermo);
  const spalla = somma(anca, ruota(P(0, -BUSTO - respiro * 4), busto));
  const testaOffset = ruota(P(0.008, -0.090), busto * 0.6 + 0.02);
  const collo = somma(spalla, ruota(P(0.010, -0.038), busto * 0.7));

  // braccia: la lontana bilancia la gamba, la vicina porta la tanica
  const aper = o.braccia ?? 0;
  const angBL = lerp(-vicina.angCoscia * 0.85 - 0.02, aper * 0.9, fermo) + 0.04;
  const angBV = lerp(-lontana.angCoscia * 0.22 + 0.03, aper, fermo);
  const braccio = (ang: number, gom: number) => {
    const a1 = ang + busto * 0.35;
    const gomito = P(spalla.x + 0.168 * Math.sin(a1), spalla.y + 0.168 * Math.cos(a1));
    const a2 = a1 + gom;
    const polso = P(gomito.x + 0.150 * Math.sin(a2), gomito.y + 0.150 * Math.cos(a2));
    return { gomito, polso, a2 };
  };
  const bl = braccio(angBL, lerp(0.30 + 0.20 * Math.max(0, angBL), 0.16, fermo));
  const bv = braccio(angBV, lerp(0.10, 0.12, fermo));

  ctx.lineCap = "round"; ctx.lineJoin = "round";

  // ─ lato lontano: braccio, gamba
  ctx.fillStyle = col.lontano;
  arto(ctx, spalla, 0.030, bl.gomito, 0.024); ctx.fill();
  arto(ctx, bl.gomito, 0.024, bl.polso, 0.019); ctx.fill();
  ctx.beginPath(); ctx.arc(bl.polso.x + 0.006 * Math.sin(bl.a2), bl.polso.y + 0.022, 0.022, 0, TAU); ctx.fill();
  ctx.fillStyle = det >= 2 ? col.pantaloni : col.lontano;
  arto(ctx, lontana.anca, 0.052, lontana.ginocchio, 0.040); ctx.fill();
  arto(ctx, lontana.ginocchio, 0.040, lontana.caviglia, 0.030); ctx.fill();
  stivale(ctx, lontana, col, det, true);

  // ─ fagotto: coperta arrotolata di traverso sulle spalle, con la cinghia
  if (o.fagotto) {
    ctx.save();
    ctx.translate(spalla.x - 0.055, spalla.y + 0.045);
    ctx.rotate(busto - 0.55);
    ctx.fillStyle = col.cappotto;
    rettTondo(ctx, -0.115, -0.038, 0.23, 0.076, 0.036); ctx.fill();
    if (det >= 2) {
      ctx.fillStyle = "#5b4a35"; rettTondo(ctx, -0.115, -0.038, 0.23, 0.076, 0.036); ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.3)"; ctx.lineWidth = 0.003;
      for (const x of [-0.07, 0.0, 0.07]) { ctx.beginPath(); ctx.moveTo(x, -0.036); ctx.lineTo(x, 0.036); ctx.stroke(); }
    }
    ctx.restore();
    // la cinghia scende sul petto
    ctx.strokeStyle = col.cappotto; ctx.lineWidth = 0.014;
    ctx.beginPath(); ctx.moveTo(spalla.x - 0.06, spalla.y + 0.02); ctx.lineTo(spalla.x + 0.04, spalla.y + 0.16); ctx.stroke();
  }

  // ─ cappotto: dal bavero all'orlo, con l'orlo che segue il passo
  const orloY = anca.y + 0.19;
  const ritardo = Math.sin((f - 0.16) * TAU) * (1 - fermo) * amp;
  const orloAv = P(anca.x + 0.105 + 0.045 * Math.max(0, vicina.angCoscia) * amp + 0.01 * ritardo, orloY + 0.004);
  const orloIn = P(anca.x - 0.128 + 0.062 * ritardo - 0.03 * Math.max(0, lontana.angCoscia) * amp, orloY - 0.004 * ritardo);
  ctx.fillStyle = col.cappotto;
  ctx.beginPath();
  const cb = somma(spalla, ruota(P(-0.062, -0.006), busto));         // spalla, dietro
  const cf = somma(spalla, ruota(P(0.056, -0.004), busto));          // spalla, davanti
  const pet = somma(spalla, ruota(P(0.086, 0.115), busto));          // petto
  const vit = somma(anca, ruota(P(0.078, -0.040), busto * 0.6));     // vita, davanti
  const sch = somma(spalla, ruota(P(-0.098, 0.115), busto));         // schiena
  const vitD = somma(anca, ruota(P(-0.098, -0.040), busto * 0.6));   // vita, dietro
  ctx.moveTo(cb.x, cb.y);
  ctx.quadraticCurveTo(spalla.x + 0.002, spalla.y - 0.030, cf.x, cf.y);
  ctx.quadraticCurveTo(pet.x + 0.004, pet.y - 0.05, pet.x, pet.y);
  ctx.quadraticCurveTo(vit.x + 0.012, (pet.y + vit.y) / 2, vit.x, vit.y);
  ctx.quadraticCurveTo(orloAv.x - 0.012, (vit.y + orloAv.y) / 2, orloAv.x, orloAv.y);
  ctx.quadraticCurveTo((orloAv.x + orloIn.x) / 2, orloAv.y + 0.014 + 0.006 * ritardo, orloIn.x, orloIn.y);   // orlo, ondulato
  ctx.quadraticCurveTo(vitD.x - 0.024 + 0.02 * ritardo, (vitD.y + orloIn.y) / 2, vitD.x, vitD.y);
  ctx.quadraticCurveTo(sch.x - 0.012, (sch.y + vitD.y) / 2, sch.x, sch.y);
  ctx.quadraticCurveTo(cb.x - 0.020, (cb.y + sch.y) / 2, cb.x, cb.y);
  ctx.closePath(); ctx.fill();
  if (det >= 1 && luce) {
    // una piega del tessuto e lo spacco sul dietro
    ctx.strokeStyle = "rgba(0,0,0,.30)"; ctx.lineWidth = 0.0035;
    ctx.beginPath(); ctx.moveTo(vitD.x + 0.01, vitD.y); ctx.quadraticCurveTo(orloIn.x + 0.03, (vitD.y + orloIn.y) / 2 + 0.02, orloIn.x + 0.045, orloIn.y - 0.004); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(vit.x - 0.02, vit.y + 0.01); ctx.quadraticCurveTo(vit.x - 0.03, (vit.y + orloAv.y) / 2, orloAv.x - 0.045, orloAv.y - 0.008); ctx.stroke();
  }

  // ─ lato vicino: gamba (sopra al cappotto per lo stinco), braccio con la tanica
  ctx.fillStyle = det >= 2 ? col.pantaloni : col.cappotto;
  arto(ctx, vicina.anca, 0.054, vicina.ginocchio, 0.042); ctx.fill();
  arto(ctx, vicina.ginocchio, 0.042, vicina.caviglia, 0.031); ctx.fill();
  if (det >= 2) {
    // pieghe sul ginocchio e polvere sull'orlo dei pantaloni
    ctx.strokeStyle = "rgba(0,0,0,.28)"; ctx.lineWidth = 0.0022;
    for (const d of [-0.012, 0, 0.012]) {
      ctx.beginPath(); ctx.moveTo(vicina.ginocchio.x - 0.036, vicina.ginocchio.y + d - 0.01); ctx.quadraticCurveTo(vicina.ginocchio.x, vicina.ginocchio.y + d + 0.014, vicina.ginocchio.x + 0.036, vicina.ginocchio.y + d - 0.008); ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,240,220,.06)";
    arto(ctx, vicina.anca, 0.024, vicina.ginocchio, 0.018); ctx.fill();
  }
  stivale(ctx, vicina, col, det, false);

  ctx.fillStyle = col.cappotto;
  arto(ctx, spalla, 0.034, bv.gomito, 0.027); ctx.fill();
  arto(ctx, bv.gomito, 0.027, bv.polso, 0.021); ctx.fill();
  if (o.tanica) {
    ctx.beginPath(); ctx.arc(bv.polso.x, bv.polso.y + 0.014, 0.024, 0, TAU); ctx.fill();
    const dondolo = 0.05 * Math.sin((f * 2 + 0.3) * TAU) * (1 - fermo) * amp - busto * 0.6 + 0.03;
    tanica(ctx, P(bv.polso.x, bv.polso.y + 0.012), dondolo, col.tanica, det);
  } else {
    ctx.beginPath(); ctx.arc(bv.polso.x + 0.004 * Math.sin(bv.a2), bv.polso.y + 0.022, 0.023, 0, TAU); ctx.fill();
  }

  // ─ collo, testa, cappello
  if (!o.senzaTesta) {
    ctx.fillStyle = col.cappotto;
    const testa = somma(collo, testaOffset);
    arto(ctx, spalla, 0.034, somma(testa, P(0.004, 0.034)), 0.027); ctx.fill();    // il collo sale fin dentro la testa: mai una testa sospesa
    ctx.beginPath(); ctx.ellipse(testa.x, testa.y + 0.006, 0.045, 0.054, 0.05, 0, TAU); ctx.fill();
    if (det >= 1) {
      // naso, barba corta, orecchio: il profilo si legge anche piccolo
      ctx.beginPath(); ctx.moveTo(testa.x + 0.036, testa.y - 0.010); ctx.lineTo(testa.x + 0.062, testa.y + 0.014); ctx.lineTo(testa.x + 0.036, testa.y + 0.022); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.ellipse(testa.x + 0.020, testa.y + 0.040, 0.030, 0.026, 0.1, 0, TAU); ctx.fill();
    }
    if (o.cappello) {
      ctx.beginPath();
      ctx.ellipse(testa.x + 0.010, testa.y - 0.032, 0.112, 0.016, -0.05, 0, TAU); ctx.fill();          // tesa
      ctx.beginPath();
      ctx.moveTo(testa.x - 0.049, testa.y - 0.034);
      ctx.quadraticCurveTo(testa.x - 0.050, testa.y - 0.110, testa.x + 0.004, testa.y - 0.104);
      ctx.quadraticCurveTo(testa.x + 0.058, testa.y - 0.108, testa.x + 0.056, testa.y - 0.034);
      ctx.closePath(); ctx.fill();                                                                      // calotta
      if (det >= 2) {
        ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(testa.x - 0.050, testa.y - 0.050, 0.106, 0.014);
        ctx.fillStyle = col.cappotto;
      }
    }
  }
}

/**
 * Disegna il viandante con i piedi in (x, y). `alto` è l'altezza in pixel; `fase` la
 * fase del passo (un ciclo = due passi). Luce di contorno dal lato del sole.
 */
export function disegnaViandante(
  ctx: CanvasRenderingContext2D, x: number, y: number, alto: number, fase: number, o: OpzioniFigura,
) {
  const v = o.verso ?? -1;
  const f = ((fase % 1) + 1) % 1;
  const col = coloriDa(o);
  const passate: { dx: number; dy: number; rim: boolean }[] = [];
  const sb = Math.min(0.012, 4.5 / alto);
  if (o.bordo) passate.push({ dx: (o.latoLuce ?? 1) * sb, dy: -sb * 0.5, rim: true });
  passate.push({ dx: 0, dy: 0, rim: false });

  for (const ps of passate) {
    ctx.save();
    ctx.translate(x + ps.dx * alto, y + ps.dy * alto);
    ctx.scale(alto * v, alto);
    if (ps.rim) {
      const c = { ...col, cappotto: o.bordo!, lontano: o.bordo!, pantaloni: o.bordo!, stivali: o.bordo!, tanica: o.bordo!, cuoio: o.bordo! };
      figura(ctx, f, { ...o, dettaglio: 0 }, c, false);
    } else {
      figura(ctx, f, o, col, true);
    }
    ctx.restore();
  }
}

/** Ombra portata: la stessa figura schiacciata e inclinata sul terreno. */
export function disegnaOmbra(
  ctx: CanvasRenderingContext2D, x: number, y: number, alto: number, fase: number,
  o: OpzioniFigura, inclinazione: number, schiacciamento: number, colore: string,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.transform(1, 0, inclinazione, schiacciamento, 0, 0);
  disegnaViandante(ctx, 0, 0, alto, fase, { ...o, colore, lontano: colore, bordo: undefined, dettaglio: 0 });
  ctx.restore();
}
