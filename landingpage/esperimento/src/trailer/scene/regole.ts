// ====================================================================
//  F · CINQUE MODI   H · LE REGOLE   I · I NUMERI
// --------------------------------------------------------------------
//  Tre scene di montaggio su fondo scuro. I titoli e i segni delle cinque
//  colonne stanno nel DOM (Trailer.tsx); qui i fondali e i cinque segni
//  delle regole, ognuno disegnato con la sua luce e la sua materia:
//    la spina dorsale che si riempie di sete · la goccia che diventa
//    moneta · la porta che lascia passare la luce · la vita che si
//    spezza · l'albero delle scelte.
// ====================================================================
import { W, H, REGOLA_DUR } from "../scaletta";
import { clamp, easeInOut, easeOut, lerp, mix, rgba, seg } from "../tempo";
import type { Cache } from "../cache";
import { alone, pulviscolo, type C2D } from "../pittura";
import { FONT } from "../font";
import { REGOLE } from "../zone";

// --------------------------------------------------------------------
//  F · sfondo dei cinque modi
// --------------------------------------------------------------------
export function disegnaCinque(ctx: C2D, t: number) {
  const g = ctx.createRadialGradient(W / 2, H * 0.55, 100, W / 2, H / 2, W * 0.7);
  g.addColorStop(0, "#111520"); g.addColorStop(1, "#04050a");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // cinque aloni alti e morbidi, appena percettibili, uno per ciascuno (senza bordi: la luce sfuma da sola)
  const colori = ["#e6a85a", "#a9dbe4", "#f2ad45", "#ec7d54", "#9aa6e0"];
  ctx.globalCompositeOperation = "lighter";
  colori.forEach((col, i) => alone(ctx, W / 2 + (i - 2) * 326, 560, 190, col, 0.13 + 0.035 * Math.sin(t * 0.9 + i), 2.05));
  pulviscolo(ctx, t, 55, 90, { x: 0, y: 150, w: W, h: 780 }, "#c8d4e6", 0.5, 2.4);
  ctx.globalCompositeOperation = "source-over";
}

// --------------------------------------------------------------------
//  H · le cinque regole
// --------------------------------------------------------------------
const CX = 1400, CY = 540;

/** La spina dorsale: dodici vertebre di profilo che si riempiono, dal basso, di sete. */
function spina(ctx: C2D, col: string, e: number, t: number) {
  const n = 12;
  for (let v = 0; v < n; v++) {
    const u = v / (n - 1);
    const y = CY + 214 - v * 38;
    // la curva della colonna: lombare, dorsale, cervicale
    const x = CX + Math.sin(u * Math.PI * 1.6 + 0.4) * 34 - 20;
    const ang = Math.cos(u * Math.PI * 1.6 + 0.4) * 0.12;
    const riempi = clamp(e * n - v);
    const sete = mix(col, "#df5f78", u);
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    const s = 0.9 + 0.32 * (1 - u);
    ctx.scale(s, s);
    const corpo = new Path2D();
    corpo.moveTo(-34, -13); corpo.quadraticCurveTo(-38, 0, -34, 13); corpo.lineTo(30, 13); corpo.quadraticCurveTo(34, 0, 30, -13); corpo.closePath();
    const spinosa = new Path2D();                                      // l'apofisi spinosa, verso la schiena
    spinosa.moveTo(30, -8); spinosa.lineTo(64, -18); spinosa.quadraticCurveTo(70, -14, 64, -8); spinosa.lineTo(30, 6); spinosa.closePath();
    const trasv = new Path2D();                                        // il processo trasverso, in prospettiva
    trasv.moveTo(4, -13); trasv.lineTo(18, -26); trasv.lineTo(26, -22); trasv.lineTo(16, -12); trasv.closePath();
    ctx.fillStyle = "rgba(255,255,255,.055)"; ctx.fill(corpo); ctx.fill(spinosa); ctx.fill(trasv);
    if (riempi > 0) {
      ctx.save(); ctx.clip(corpo);
      const gr = ctx.createLinearGradient(0, 13, 0, -13);
      gr.addColorStop(0, rgba(sete, 0.95)); gr.addColorStop(1, rgba(sete, 0.55));
      ctx.fillStyle = gr; ctx.fillRect(-40, 13 - 26 * riempi, 80, 26 * riempi);
      ctx.restore();
      ctx.fillStyle = rgba(sete, 0.6 * riempi); ctx.fill(spinosa); ctx.fill(trasv);
      ctx.globalCompositeOperation = "lighter"; alone(ctx, 0, 0, 74, sete, 0.20 * riempi); ctx.globalCompositeOperation = "source-over";
    }
    ctx.strokeStyle = rgba(sete, 0.55 + 0.4 * riempi); ctx.lineWidth = 2; ctx.lineJoin = "round";
    ctx.stroke(corpo); ctx.stroke(spinosa); ctx.stroke(trasv);
    // il disco fra due vertebre: un cuscinetto che si asciuga
    if (v < n - 1) { ctx.fillStyle = `rgba(200,220,240,${0.10 + 0.10 * (1 - riempi)})`; ctx.beginPath(); ctx.ellipse(-2, -19, 26, 4.4, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  // una goccia che si asciuga in cima
  const cade = (t * 0.6) % 1;
  ctx.globalAlpha = e * (1 - cade) * 0.8; ctx.fillStyle = "#cfe6f0";
  ctx.beginPath(); const gx = CX + 6, gy = CY - 260 + cade * 60; ctx.moveTo(gx, gy - 14); ctx.quadraticCurveTo(gx + 8, gy, gx, gy + 6); ctx.quadraticCurveTo(gx - 8, gy, gx, gy - 14); ctx.fill();
  ctx.globalAlpha = 1;
}

/** La goccia che diventa moneta, con il suo orlo zigrinato e il riflesso che la attraversa. */
function moneta(ctx: C2D, col: string, k: number, t: number) {
  const m = easeInOut(seg(k, 0.15, 0.6));
  ctx.save(); ctx.translate(CX, CY);
  const r = 116;
  // cerchi d'acqua sotto
  for (let i = 0; i < 3; i++) {
    const ph = ((t * 0.7 + i / 3) % 1);
    ctx.strokeStyle = rgba(col, (1 - ph) * 0.35); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 156, 90 + ph * 160, 18 + ph * 34, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalCompositeOperation = "lighter"; alone(ctx, 0, 0, 260, col, 0.20 + 0.10 * m); ctx.globalCompositeOperation = "source-over";
  // la goccia (m=0) → la moneta (m=1): il profilo si arrotonda, l'apice si spiana
  // il profilo è una curva polare: a m=0 un cerchio con la punta in alto (la goccia), a m=1 un cerchio perfetto
  ctx.beginPath();
  for (let i = 0; i <= 96; i++) {
    const th = (i / 96) * Math.PI * 2;                      // 0 = la punta, in alto
    const c = Math.cos(th), s = Math.sin(th);
    const alto = (1 + c) / 2;
    const x = r * s * (1 - 0.66 * (1 - m) * Math.pow(alto, 3));
    const y = -r * c - (1 - m) * Math.pow(alto, 5) * r * 1.05;
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.closePath();
  const gr = ctx.createLinearGradient(-r, -r, r, r);
  gr.addColorStop(0, "#f4fbfd"); gr.addColorStop(0.35, col); gr.addColorStop(1, "#4d8aa0");
  ctx.fillStyle = gr; ctx.shadowColor = col; ctx.shadowBlur = 34; ctx.fill(); ctx.shadowBlur = 0;
  ctx.save(); ctx.clip();
  // la moneta: bordo zigrinato, anello interno, cifra in rilievo
  ctx.globalAlpha = m;
  ctx.strokeStyle = "rgba(4,18,26,.55)"; ctx.lineWidth = 3.4;
  for (let i = 0; i < 64; i++) { const a = (i / 64) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * (r - 14), Math.sin(a) * (r - 14)); ctx.lineTo(Math.cos(a) * (r - 3), Math.sin(a) * (r - 3)); ctx.stroke(); }
  ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, r * 0.73, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "rgba(4,18,26,.85)"; ctx.font = `700 96px ${FONT.display}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("1", 0, 8);
  ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.fillText("1", -1.6, 6);
  ctx.restore();
  // il riflesso che passa sopra
  const s = seg(k, 0.55, 0.9);
  if (s > 0 && s < 1) { ctx.globalCompositeOperation = "lighter"; alone(ctx, lerp(-130, 130, s), -36, 90, "#ffffff", 0.5); ctx.globalCompositeOperation = "source-over"; }
  ctx.restore();
}

/** La porta che si apre, la luce che passa e riempie il pavimento. */
function porta(ctx: C2D, col: string, k: number, t: number) {
  const ap = easeInOut(seg(k, 0.15, 0.7));
  const x0 = CX - 130, y0 = CY - 232, w = 260, h = 464;
  // il fascio di luce sul pavimento, che si apre a ventaglio
  ctx.globalCompositeOperation = "lighter";
  const gl = ctx.createLinearGradient(x0 + w / 2, y0 + 60, x0 + w / 2 + 620, y0 + h + 100);
  gl.addColorStop(0, rgba(col, 0.055 * ap)); gl.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = gl;
  // il fascio ha i bordi morbidi: molti trapezi via via più larghi, ognuno appena visibile (le somme sfumano da sole)
  for (let s = 0; s < 18; s++) {
    const e = s * 9;
    ctx.beginPath(); ctx.moveTo(x0 + 8 - e * 0.2, y0 + 8 - e * 0.1); ctx.lineTo(x0 + w - 8 + e * 0.2, y0 + 8 - e * 0.1);
    ctx.lineTo(x0 + w + 520 + e, y0 + h + 120 + e * 0.4); ctx.lineTo(x0 - 240 * ap - e, y0 + h + 120 + e * 0.4); ctx.closePath(); ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
  // il vano: buio dentro, lo stipite in pietra, la soglia
  ctx.fillStyle = "#06090c"; ctx.fillRect(x0, y0, w, h);
  const luce = ctx.createLinearGradient(x0, y0, x0 + w, y0);
  luce.addColorStop(0, rgba(col, 0.55 * ap)); luce.addColorStop(1, rgba(col, 0.95 * ap));
  ctx.fillStyle = luce; ctx.fillRect(x0, y0, w, h);
  // la porta: un'anta a due specchiature che ruota sui cardini, restringendosi di prospettiva
  const ang = ap * 1.15;
  const wa = w * Math.cos(ang);
  ctx.save(); ctx.translate(x0, 0);
  const anta = ctx.createLinearGradient(0, 0, wa, 0);
  anta.addColorStop(0, "#1b2a26"); anta.addColorStop(1, "#0d1614");
  ctx.fillStyle = anta;
  ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(wa, y0 + 24 * Math.sin(ang)); ctx.lineTo(wa, y0 + h - 24 * Math.sin(ang)); ctx.lineTo(0, y0 + h); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = rgba(col, 0.35); ctx.lineWidth = 2;
  for (const [fy, fh] of [[70, 130], [250, 150]] as const) {
    const pann = new Path2D();
    pann.moveTo(wa * 0.16, y0 + fy); pann.lineTo(wa * 0.84, y0 + fy + 8 * Math.sin(ang)); pann.lineTo(wa * 0.84, y0 + fy + fh - 8 * Math.sin(ang)); pann.lineTo(wa * 0.16, y0 + fy + fh); pann.closePath();
    ctx.stroke(pann);
    // la specchiatura ha un rilievo: filo scuro sopra e a sinistra, filo chiaro sotto e a destra
    ctx.save(); ctx.translate(1.5, 1.5); ctx.strokeStyle = "rgba(0,0,0,.55)"; ctx.stroke(pann); ctx.restore();
    ctx.save(); ctx.translate(-1.2, -1.2); ctx.strokeStyle = rgba(col, 0.16); ctx.stroke(pann); ctx.restore();
    ctx.strokeStyle = rgba(col, 0.35);
  }
  // sul bordo libero dell'anta, dove batte la luce, un filo acceso
  ctx.strokeStyle = rgba(col, 0.85 * ap); ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(wa, y0 + 24 * Math.sin(ang)); ctx.lineTo(wa, y0 + h - 24 * Math.sin(ang)); ctx.stroke();
  ctx.strokeStyle = rgba(col, 0.35); ctx.lineWidth = 2;
  ctx.fillStyle = rgba("#f0e6c8", 0.9); ctx.beginPath(); ctx.arc(wa * 0.86, y0 + h * 0.54, 7, 0, Math.PI * 2); ctx.fill();          // il pomolo
  ctx.fillStyle = rgba("#3a4a44", 1); ctx.fillRect(-2, y0 + 60, 5, 26); ctx.fillRect(-2, y0 + h - 86, 5, 26);                        // i cardini
  ctx.restore();
  // lo stipite
  ctx.strokeStyle = rgba(col, 0.9); ctx.lineWidth = 3;
  ctx.strokeRect(x0 - 4, y0 - 4, w + 8, h + 8);
  ctx.fillStyle = "rgba(255,255,255,.10)"; ctx.fillRect(x0 - 18, y0 + h + 4, w + 36, 8);
  // pulviscolo nel fascio
  ctx.globalCompositeOperation = "lighter";
  pulviscolo(ctx, t, 77, 30, { x: x0 + w, y: y0 + 120, w: 460, h: 380 }, "#fff2d0", 0.55 * ap, 2.4);
  ctx.globalCompositeOperation = "source-over";
}

/** Dieci tacche di vita: il colpo ne spezza quattro, e i cocci cadono. */
function vita(ctx: C2D, col: string, k: number) {
  const colpo = seg(k, 0.35, 0.5);
  const scossa = colpo > 0 && colpo < 1 ? Math.sin(k * 120) * 10 * (1 - colpo) : 0;
  ctx.save(); ctx.translate(scossa, 0);
  for (let v = 0; v < 10; v++) {
    const spenta = v >= 6 && colpo >= (v - 6) / 4;
    const x = CX - 350 + v * 72, y = CY - 44;
    if (!spenta) {
      const gr = ctx.createLinearGradient(x, y, x, y + 88);
      gr.addColorStop(0, "#ff9aab"); gr.addColorStop(0.5, col); gr.addColorStop(1, "#a63a4d");
      ctx.fillStyle = gr; ctx.beginPath(); ctx.roundRect(x, y, 56, 88, 10); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.30)"; ctx.beginPath(); ctx.roundRect(x + 6, y + 6, 44, 10, 5); ctx.fill();
    } else {
      // il vuoto e i cocci: tre schegge che cadono con la gravità
      const cadi = clamp((colpo - (v - 6) / 4) * 1.6);
      ctx.strokeStyle = "rgba(255,255,255,.10)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(x, y, 56, 88, 10); ctx.stroke();
      for (let s = 0; s < 3; s++) {
        const px = x + 12 + s * 16 + (s - 1) * cadi * 40, py = y + 34 + cadi * cadi * 320 + s * 10, rot = cadi * (s + 1) * 2.6;
        ctx.save(); ctx.translate(px, py); ctx.rotate(rot); ctx.globalAlpha = 1 - cadi * 0.9; ctx.fillStyle = col;
        ctx.beginPath(); ctx.moveTo(-11, -8); ctx.lineTo(12, -4); ctx.lineTo(4, 13); ctx.closePath(); ctx.fill(); ctx.restore();
      }
    }
  }
  ctx.restore();
  if (colpo > 0 && colpo < 1) { ctx.fillStyle = `rgba(223,95,120,${(1 - colpo) * 0.25})`; ctx.fillRect(0, 0, W, H); }
  ctx.fillStyle = rgba(col, 0.9); ctx.font = `600 22px ${FONT.mono}`; ctx.textAlign = "left";
  ctx.fillText(colpo >= 1 ? "−4" : "10", CX - 350, CY + 44 + 44);
}

/** L'albero delle scelte: rami curvi che si dividono fino a sei foglie accese. */
function albero(ctx: C2D, col: string, k: number) {
  const cresce = easeOut(seg(k, 0.05, 0.75));
  const foglie: { x: number; y: number; k: number }[] = [];
  const nodi: { x: number; y: number; r: number }[] = [];
  const X0 = CX - 250;
  // ogni ramo è una curva che si assottiglia; ai bivi resta un nodo, e qualche rametto spento dice che le strade non prese esistono
  const ramo = (x: number, y: number, ang: number, lung: number, liv: number, fino: number) => {
    if (liv === 0 || fino <= 0) return;
    const kk = clamp(fino * 3 - (3 - liv));
    const x2 = x + Math.cos(ang) * lung * kk, y2 = y + Math.sin(ang) * lung * kk;
    const cx = x + Math.cos(ang - 0.25) * lung * kk * 0.55, cy = y + Math.sin(ang - 0.25) * lung * kk * 0.55;
    const sp = liv === 3 ? 10 : liv === 2 ? 6 : 3.4;
    ctx.lineCap = "round";
    ctx.strokeStyle = rgba(col, 0.13); ctx.lineWidth = sp + 12;                      // alone morbido sotto il ramo
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(cx, cy, x2, y2); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = sp;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(cx, cy, x2, y2); ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.30)"; ctx.lineWidth = Math.max(1, sp * 0.22);   // il filo di luce sul dorso del ramo
    ctx.beginPath(); ctx.moveTo(x, y - sp * 0.18); ctx.quadraticCurveTo(cx, cy - sp * 0.18, x2, y2 - sp * 0.18); ctx.stroke();
    if (liv === 1) { if (kk >= 1) foglie.push({ x: x2, y: y2, k: kk }); return; }
    if (kk >= 1) {
      nodi.push({ x: x2, y: y2, r: liv === 3 ? 12 : 9 });
      // i rametti che non si prendono
      for (const da of [-1.15, 1.2]) {
        const a = ang + da, L = lung * 0.34;
        ctx.strokeStyle = rgba(col, 0.28); ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(x2, y2); ctx.quadraticCurveTo(x2 + Math.cos(a - 0.2) * L * 0.6, y2 + Math.sin(a - 0.2) * L * 0.6, x2 + Math.cos(a) * L, y2 + Math.sin(a) * L); ctx.stroke();
        ctx.fillStyle = rgba(col, 0.28); ctx.beginPath(); ctx.arc(x2 + Math.cos(a) * L, y2 + Math.sin(a) * L, 3.4, 0, Math.PI * 2); ctx.fill();
      }
    }
    const figli = liv === 3 ? 2 : 3;
    for (let f = 0; f < figli; f++) {
      const a = ang + (f / (figli - 1) - 0.5) * (liv === 3 ? 1.15 : 0.78);
      ramo(x2, y2, a, lung * (liv === 3 ? 0.98 : 0.8), liv - 1, fino);
    }
  };
  ramo(X0, CY, 0, 205, 3, cresce);
  for (const n of nodi) {
    ctx.fillStyle = "#050609"; ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 3.2; ctx.stroke();
  }
  for (const f of foglie) {
    ctx.globalCompositeOperation = "lighter"; alone(ctx, f.x, f.y, 64, col, 0.62); ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(f.x, f.y, 12, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = rgba(col, 0.55); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f.x, f.y, 20, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(f.x - 3, f.y - 3, 4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = seg(k, 0.7, 0.9);
  ctx.fillStyle = col; ctx.font = `600 24px ${FONT.mono}`; ctx.textAlign = "left"; ctx.fillText("6 FINALI", CX + 350, CY + 8);
  ctx.globalAlpha = 1;
}

export function disegnaRegole(ctx: C2D, t: number) {
  const i = clamp(Math.floor((t - 67.8) / REGOLA_DUR), 0, 4);
  const k = seg(t, 67.8 + i * REGOLA_DUR, 67.8 + (i + 1) * REGOLA_DUR);
  const col = REGOLE[i].a;
  ctx.fillStyle = "#040509"; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "lighter";
  alone(ctx, 1380, 540, 760, col, 0.13);
  ctx.globalCompositeOperation = "source-over";
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  const e = easeOut(clamp(k * 1.6));
  if (i === 0) spina(ctx, col, e, t);
  else if (i === 1) moneta(ctx, col, k, t);
  else if (i === 2) porta(ctx, col, k, t);
  else if (i === 3) vita(ctx, col, k);
  else albero(ctx, col, k);
  // un filo di luce che passa in orizzontale a ogni cambio: il taglio del montaggio
  const taglio = 1 - seg(k, 0, 0.12);
  if (taglio > 0) { ctx.fillStyle = `rgba(255,255,255,${taglio * 0.10})`; ctx.fillRect(0, 0, W, H); }
}

// --------------------------------------------------------------------
//  I · i numeri (sfondo): la carta, quasi spenta, e il buio ai bordi
// --------------------------------------------------------------------
export function disegnaNumeri(ctx: C2D, t: number, c: Cache) {
  ctx.fillStyle = "#040609"; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.5;
  ctx.drawImage(c.mappa.mappa, 600 + (t - 77) * 20, 0, W, H, 0, 0, W, H);
  ctx.globalAlpha = 1;
  const g = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, W * 0.6);
  g.addColorStop(0, "rgba(4,6,9,.2)"); g.addColorStop(1, "rgba(4,6,9,.95)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
