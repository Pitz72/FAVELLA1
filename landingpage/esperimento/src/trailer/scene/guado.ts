// ====================================================================
//  G · IL GUADO  (controluce cremisi)
// --------------------------------------------------------------------
//  Sull'altra riva Acquamorta: case scoperchiate, un campanile, una
//  torre dell'acqua, contro un sole basso e rosso. Un filo d'acqua morta
//  a specchio del cielo; il greto di sassi bianchi bordati di luce. In
//  mezzo al greto, di controluce, un uomo fermo con le braccia appena
//  aperte: è Cosimo. Da destra arriva il viandante, e si ferma.
// ====================================================================
import { W, H, CAMMINATE, faseDiPasso } from "../scaletta";
import { easeInOut, lerp, rng, rgba, seg } from "../tempo";
import type { Cache } from "../cache";
import { alone, camera, cielo, crinale, nuvole, nuvoleScorrono, pulviscolo, type C2D } from "../pittura";
import { creaTela, ctxDi, fbmPeriodico, riempi, type Tela } from "../texture";
import { disegnaViandante, velocitaSuolo } from "../viandante";

const AMP = 0.4;
const RIVA = 662;

interface StatoGuado { citta: Tela; sassi: Tela; nubi: Tela; colline: Tela }

// --------------------------------------------------------------------
//  Acquamorta, sull'altra riva: case, tetti crollati, il campanile, la torre dell'acqua
// --------------------------------------------------------------------
function cittaTela(): Tela {
  const w = 1300, h = 300, base = 250;
  const t = creaTela(w, h), g = ctxDi(t), r = rng(61);
  g.fillStyle = "#12050b";
  const luce = "rgba(255,130,96,.75)";
  let x = 30;
  const case_: { x: number; w: number; h: number }[] = [];
  while (x < w - 60) {
    const cw = 44 + r() * 70, ch = 34 + r() * 70;
    case_.push({ x, w: cw, h: ch });
    x += cw + r() * 16;
  }
  for (const c of case_) {
    const y = base - c.h;
    g.beginPath(); g.rect(c.x, y, c.w, c.h + 40); g.fill();
    const forma = r();
    g.beginPath();
    if (forma < 0.5) { g.moveTo(c.x - 4, y); g.lineTo(c.x + c.w / 2, y - 16 - r() * 12); g.lineTo(c.x + c.w + 4, y); }                    // a due falde
    else if (forma < 0.75) { g.moveTo(c.x - 4, y); g.lineTo(c.x + c.w * 0.3, y - 22); g.lineTo(c.x + c.w * 0.55, y - 6); g.lineTo(c.x + c.w * 0.7, y - 14); g.lineTo(c.x + c.w + 4, y); }   // tetto crollato
    else { g.rect(c.x - 3, y - 6, c.w + 6, 6); }                                                                                       // terrazza con parapetto
    g.closePath(); g.fill();
    if (r() < 0.55) { g.fillRect(c.x + c.w * (0.2 + r() * 0.6), y - 30, 7, 30); }                                                     // camino
    // luce sul lato rivolto al sole (a sinistra)
    g.strokeStyle = luce; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(c.x + 0.8, y); g.lineTo(c.x + 0.8, base); g.stroke();
    if (r() < 0.16) {                                                                                                                // una finestra ancora accesa
      g.fillStyle = "rgba(255,180,90,.9)"; g.fillRect(c.x + 8 + r() * (c.w - 24), y + 10 + r() * (c.h - 24), 5, 8); g.fillStyle = "#12050b";
    }
  }
  // il campanile, con la cella aperta sul cielo e la croce
  g.fillStyle = "#12050b";
  g.fillRect(640, base - 220, 40, 230);
  g.beginPath(); g.moveTo(634, base - 220); g.lineTo(660, base - 268); g.lineTo(686, base - 220); g.closePath(); g.fill();
  g.fillRect(658, base - 296, 3, 30); g.fillRect(651, base - 288, 17, 3);
  g.globalCompositeOperation = "destination-out"; g.beginPath(); g.moveTo(649, base - 196); g.lineTo(649, base - 172); g.arc(660, base - 172, 11, Math.PI, 0, true); g.lineTo(671, base - 196); g.closePath(); g.fill();
  g.globalCompositeOperation = "source-over";
  g.fillStyle = luce; g.fillRect(640.4, base - 220, 1.6, 230);
  // la torre dell'acqua sulle sue gambe
  g.fillStyle = "#12050b";
  g.beginPath(); g.ellipse(248, base - 132, 30, 24, 0, 0, Math.PI * 2); g.fill(); g.fillRect(218, base - 132, 60, 32);
  g.beginPath(); g.moveTo(226, base - 100); g.lineTo(220, base + 10); g.moveTo(270, base - 100); g.lineTo(276, base + 10); g.moveTo(248, base - 100); g.lineTo(248, base + 10);
  g.strokeStyle = "#12050b"; g.lineWidth = 4; g.stroke();
  g.strokeStyle = luce; g.lineWidth = 1.6; g.beginPath(); g.moveTo(219, base - 132); g.lineTo(219, base - 102); g.stroke();
  return t;
}

// --------------------------------------------------------------------
//  Il greto: sassi bianchi bordati dal sole, con l'ombra lunga verso di noi
// --------------------------------------------------------------------
async function sassiTela(): Promise<Tela> {
  const w = W + 400, h = 400;
  const t = creaTela(w, h), g = ctxDi(t), r = rng(91);
  const fondo = g.createLinearGradient(0, 0, 0, h);
  fondo.addColorStop(0, "#28101a"); fondo.addColorStop(0.5, "#1c0b12"); fondo.addColorStop(1, "#12070c");
  g.fillStyle = fondo; g.fillRect(0, 0, w, h);
  const n = fbmPeriodico(2, 10, 3, 0);
  const grana = await riempi(w, h, (x, y, px) => { const v = n(x / w * 10, y / 40) * 30; px[0] = v > 0 ? 255 : 0; px[1] = v > 0 ? 190 : 0; px[2] = v > 0 ? 160 : 0; px[3] = Math.abs(v) * 1.4; });
  g.drawImage(grana, 0, 0);
  const sassi: { x: number; y: number; rx: number; ry: number; a: number }[] = [];
  for (let i = 0; i < 620; i++) {
    const y = Math.pow(r(), 1.7) * h, prof = y / h;
    sassi.push({ x: r() * w, y, rx: 4 + prof * 46 * (0.5 + r()), ry: 0, a: (r() - 0.5) * 0.5 });
  }
  sassi.sort((a, b) => a.y - b.y);
  for (const s of sassi) {
    s.ry = s.rx * (0.34 + r() * 0.2);
    const prof = s.y / h;
    // l'ombra: cade verso l'osservatore e a destra, lunga
    g.fillStyle = `rgba(10,3,6,${0.32 + prof * 0.3})`;
    g.beginPath(); g.ellipse(s.x + s.rx * 0.5, s.y + s.ry * 1.0, s.rx * 1.05, s.ry * 0.7, s.a, 0, Math.PI * 2); g.fill();
    // il corpo: bianco caldo sul lato del sole, rosato e violaceo nell'ombra
    const gr = g.createLinearGradient(s.x - s.rx, s.y - s.ry, s.x + s.rx * 0.7, s.y + s.ry);
    gr.addColorStop(0, `rgb(${236 + r() * 14},${196 + r() * 14},${172 + r() * 14})`); gr.addColorStop(0.45, "#a77a76"); gr.addColorStop(1, "#4b2230");
    g.fillStyle = gr;
    g.beginPath(); g.ellipse(s.x, s.y, s.rx, s.ry, s.a, 0, Math.PI * 2); g.fill();
    // il filo di luce sul bordo alto e sinistro, come lo dà un sole basso di taglio
    g.strokeStyle = `rgba(255,214,184,${0.5 + 0.4 * r()})`; g.lineWidth = 1 + prof * 1.6;
    g.beginPath(); g.ellipse(s.x, s.y, s.rx, s.ry, s.a, Math.PI * 0.95, Math.PI * 1.75); g.stroke();
  }
  return t;
}

export async function preparaGuado(c: Cache) {
  if (c.guado) return;
  const s: StatoGuado = {
    citta: cittaTela(),
    sassi: await sassiTela(),
    nubi: await nuvole({ seme: 71, w: 960, h: 300, scalaX: 2.6, scalaY: 1, copertura: 0.5, morbidezza: 0.2, sole: [-1, 0.5],
      chiaro: "#ff9a6a", scuro: "#4a1226", alto: 0.25, basso: 0.55 }),
    colline: await crinale({ seme: 808, larghezza: 1920, altezza: 200, base: 120, ampiezza: 60, frequenza: 3, aspro: 0.4, luce: -1,
      chiaro: "#9a3a3c", scuro: "#2c0d1c", nebbia: "#7a2a36", nebbiaForza: 0.5, grana: 0.1 }),
  };
  c.guado = s;
}

/** L'ombra lunga che cade verso di noi: la figura rovesciata e stirata sul greto. */
function ombraVerso(ctx: C2D, x: number, y: number, alto: number, fase: number, o: Parameters<typeof disegnaViandante>[5], sku: number, lung: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.transform(1, 0, sku, -lung, 0, 0);
  disegnaViandante(ctx, 0, 0, alto, fase, { ...o, colore: "rgba(6,1,4,.55)", lontano: "rgba(6,1,4,.55)", bordo: undefined, dettaglio: 0 });
  ctx.restore();
}

export function disegnaGuado(ctx: C2D, t: number, c: Cache) {
  const a = c.guado as StatoGuado;
  const l = t - 59.6;
  ctx.save();
  camera(ctx, lerp(1.0, 1.12, easeInOut(seg(l, 0, 8.2))), 900, 760);

  // ── il cielo: cremisi che scende all'arancio dell'orizzonte
  cielo(ctx, [[0, "#12050d"], [0.30, "#3b0f22"], [0.52, "#8b2b3a"], [0.62, "#d4633f"], [0.66, "#f39a64"]], -250, 700);
  ctx.globalCompositeOperation = "lighter";
  alone(ctx, 380, 662, 900, "#ff6d44", 0.50, 0.9);
  alone(ctx, 380, 656, 260, "#ffc38a", 0.65);
  ctx.globalCompositeOperation = "source-over";
  nuvoleScorrono(ctx, a.nubi, 0, 180, 1920, 520, t * 4, 0.9);
  // il sole, quasi sul crinale: metà dietro i tetti
  ctx.fillStyle = "#ffd6a0"; ctx.beginPath(); ctx.arc(380, 668, 52, 0, Math.PI * 2); ctx.fill();
  ctx.globalCompositeOperation = "lighter"; alone(ctx, 380, 668, 140, "#fff2d8", 0.8);
  // raggi che salgono dal sole
  ctx.save(); ctx.translate(380, 668);
  for (let i = 0; i < 8; i++) {
    const ang = -Math.PI * (0.08 + i * 0.12);
    const w2 = 0.05 + ((i * 41) % 7) * 0.01;
    const gr = ctx.createRadialGradient(0, 0, 40, 0, 0, 1300);
    gr.addColorStop(0, rgba("#ff9a6a", (0.09 + 0.05 * Math.sin(t * 0.7 + i * 1.9)))); gr.addColorStop(1, rgba("#ff9a6a", 0));
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(ang - w2) * 1500, Math.sin(ang - w2) * 1500); ctx.lineTo(Math.cos(ang + w2) * 1500, Math.sin(ang + w2) * 1500); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  ctx.globalCompositeOperation = "source-over";

  // ── colline dietro, poi Acquamorta sull'altra riva
  ctx.drawImage(a.colline, 0, 470);
  ctx.drawImage(a.citta, 30, RIVA - 250 + 4);
  // foschia bassa: la calura della sera sale dall'acqua
  cielo(ctx, [[0, "rgba(255,150,100,0)"], [1, "rgba(255,150,100,.30)"]], 610, 700);

  // ── l'acqua morta, specchio del cielo, con il ricamo dei riflessi
  const ay = 692;
  const gw = ctx.createLinearGradient(0, ay, 0, ay + 110);
  gw.addColorStop(0, "#e07a52"); gw.addColorStop(0.35, "#a63f44"); gw.addColorStop(1, "#3b1220");
  ctx.fillStyle = gw; ctx.fillRect(-100, ay, W + 200, 110);
  // il riflesso della città: la stessa sagoma capovolta e sfumata
  ctx.save(); ctx.globalAlpha = 0.34; ctx.translate(30, ay); ctx.scale(1, -0.55); ctx.drawImage(a.citta, 0, -250); ctx.restore();
  // il bagliore del sole sull'acqua: una colonna di scintille
  ctx.globalCompositeOperation = "lighter";
  const rr = rng(12);
  for (let i = 0; i < 60; i++) {
    const yy = ay + 4 + rr() * 100, spr = 8 + (yy - ay) * 0.7;
    const xx = 380 + (rr() - 0.5) * spr * 2 + Math.sin(t * 1.5 + i) * 3;
    const al = (0.25 + 0.6 * rr()) * (0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.7)) * (1 - (yy - ay) / 130);
    ctx.fillStyle = `rgba(255,214,160,${al})`; ctx.fillRect(xx - 6 - rr() * 14, yy, 12 + rr() * 26, 1.4);
  }
  // increspature: righe chiare che scorrono piano
  for (let i = 0; i < 22; i++) {
    const yy = ay + 6 + i * 4.6 + Math.sin(t * 0.8 + i) * 0.7;
    ctx.strokeStyle = `rgba(255,170,120,${0.05 + 0.06 * Math.sin(t * 1.1 + i * 2)})`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, yy);
    for (let x = 0; x <= W; x += 40) ctx.lineTo(x, yy + Math.sin(x * 0.02 + t * 0.9 + i) * 1.4);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";
  // la sponda di qua: una riga di terra scura, poi il greto
  ctx.fillStyle = "#170811"; ctx.beginPath(); ctx.moveTo(-100, ay + 100); ctx.quadraticCurveTo(W / 2, ay + 86, W + 100, ay + 104); ctx.lineTo(W + 100, H); ctx.lineTo(-100, H); ctx.closePath(); ctx.fill();
  ctx.drawImage(a.sassi, -200, ay + 96, W + 400, 400);
  // luce di taglio sul greto, verso il sole
  ctx.globalCompositeOperation = "lighter";
  alone(ctx, 380, ay + 120, 900, "#ff7a50", 0.20, 0.16);
  ctx.globalCompositeOperation = "source-over";

  // ── Cosimo: fermo, controluce, le braccia appena aperte; guarda verso chi arriva (est)
  const respiro = t;
  const xC = 640, yC = 894, altoC = 336;
  ombraVerso(ctx, xC + 20, yC + 4, altoC, 0, { colore: "#000", fermo: 1, braccia: 0.34, ampiezza: AMP }, 0.55, 0.32);
  disegnaViandante(ctx, xC, yC, altoC, 0, {
    colore: "#0a0207", lontano: "#060104", bordo: "#ff9d7a", latoLuce: -1, verso: 1, fermo: 1, respiro, braccia: 0.34,
    ampiezza: AMP, dettaglio: 1, cappello: false,
  });

  // ── il viandante arriva da destra e si ferma
  const ferma = easeInOut(seg(l, 3.8, 4.6));
  const avanza = l < 4.6 ? l : 4.6;
  const cam = CAMMINATE[3];
  const vx = 1720 - avanza * velocitaSuolo(342, cam.cad, AMP) * 0.95 + ferma * 6;
  const fase = cam ? faseDiPasso(Math.min(t, 64.2), cam) - 0.25 : 0;
  // da fermo il braccio si scosta un poco dal fianco: la tanica pende fuori dal cappotto e si legge anche in controluce
  const optV = { colore: "#08030a", tanica: true, fagotto: true, cappello: true, ampiezza: AMP, fermo: ferma, respiro, braccia: 0.27 } as const;
  ombraVerso(ctx, vx + 24, 900, 342, fase, { ...optV, verso: -1 }, 0.55, 0.32);
  disegnaViandante(ctx, vx, 896, 342, fase, {
    ...optV, lontano: "#040106", bordo: "#ff9d7a", latoLuce: -1, verso: -1, dettaglio: 1,
  });

  // ── cenere e polvere nella luce rossa, e le canne secche in primo piano
  ctx.globalCompositeOperation = "lighter";
  pulviscolo(ctx, t, 63, 56, { x: 0, y: 260, w: W, h: 700 }, "#ffb49a", 0.5, 2.6);
  ctx.globalCompositeOperation = "source-over";
  const rc = rng(33);
  ctx.strokeStyle = "#0b0308"; ctx.lineCap = "round";
  for (const lato of [0, 1]) {
    for (let i = 0; i < 18; i++) {
      const bx = lato ? W - 20 - rc() * 260 : -20 + rc() * 240, alt = 130 + rc() * 190, curva = (lato ? -1 : 1) * (10 + rc() * 40);
      const mov = Math.sin(t * 0.9 + i) * 5;
      ctx.lineWidth = 1.6 + rc() * 2;
      ctx.beginPath(); ctx.moveTo(bx, H + 30); ctx.quadraticCurveTo(bx + curva * 0.3 + mov * 0.4, H - alt * 0.6, bx + curva + mov, H - alt); ctx.stroke();
      ctx.strokeStyle = "rgba(255,130,96,.45)"; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(bx + curva * 0.5, H - alt * 0.55); ctx.lineTo(bx + curva + mov, H - alt); ctx.stroke(); ctx.strokeStyle = "#0b0308";
    }
  }
  ctx.restore();
}
