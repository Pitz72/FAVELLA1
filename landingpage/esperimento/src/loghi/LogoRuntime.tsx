// ====================================================================
//  Il logo di Runtime Multimedia, che si crea da sé.
// --------------------------------------------------------------------
//  Nel buio si accende un vecchio televisore: una riga di luce si allarga e
//  diventa uno schermo color carta (il marchio a colori ha la scritta verde
//  petrolio: sul nero non si leggerebbe). Una testina di lettura attraversa lo
//  schermo e lascia dietro di sé, lettera per lettera, RUNTIME e MULTIMEDIA;
//  arrivata in fondo diventa il lato del triangolo «play», che si chiude, si
//  riempie e spara i suoi pixel. Un riflesso, una pausa, e lo schermo si
//  spegne come un tubo catodico: una riga, un punto, il nero.
//  Tutto è funzione del tempo t (secondi), che arriva dall'orologio unico di
//  Loghi.tsx; qui si scrivono solo stili e attributi, niente render di React.
// ====================================================================
import { forwardRef, useImperativeHandle, useRef } from "react";
import { clamp, seg, easeOut, easeIn, easeInOut, expoOut, lerp, mix } from "../trailer/tempo";
import {
  RUNTIME_VISTA, RUNTIME_LETTERE, RUNTIME_RIQUADRI, MULTIMEDIA_LETTERE, MULTIMEDIA_RIQUADRI,
  SIMBOLO, TRIANGOLO_ESTERNO, TRIANGOLO_INTERNO, PIXEL, RUNTIME_COLORI as C,
} from "./forme";

export interface Animabile { aggiorna: (t: number) => void; prepara?: () => void }

export const DURATA_RUNTIME = 5.6;

// la regia, in secondi (la legge anche il suono, suono.ts)
export const REGIA_RUNTIME = {
  rigaDa: 0.6, rigaA: 0.95, apreA: 1.3, biancoA: 1.5,
  testina: 1.22, corsaDa: 1.38, corsaA: 2.28, latoA: 2.44,
  disegnoDa: 2.38, disegnoA: 2.74, pienoDa: 2.66, pienoA: 2.84,
  internoDa: 2.74, internoA: 3.12,
  pixelDa: 2.86, pixelPasso: 0.05, pixelDur: 0.62,
  riflessoDa: 3.5, riflessoA: 4.1,
  spegneDa: 4.72, spentaA: 4.94, puntoA: 5.12,
};
const T = REGIA_RUNTIME;

// lo schermo: il riquadro del marchio con un margine di luce attorno
const MARGINE_X = 96, MARGINE_Y = 80;
const VISTA = {
  x: RUNTIME_VISTA.x - MARGINE_X, y: RUNTIME_VISTA.y - MARGINE_Y,
  w: RUNTIME_VISTA.w + 2 * MARGINE_X, h: RUNTIME_VISTA.h + 2 * MARGINE_Y,
};
// sul telefono in verticale lo schermo prende quasi tutta la larghezza
const larghezza = () => (window.innerWidth < window.innerHeight ? "94vw" : "min(64vw, 160vh)");

// la testina: da poco prima della R al lato sinistro del triangolo
const LATO_X = SIMBOLO.x - 70 * SIMBOLO.scala;
const X0 = 64, X1 = LATO_X;
const LATO_Y0 = SIMBOLO.y - 100 * SIMBOLO.scala, LATO_Y1 = SIMBOLO.y + 100 * SIMBOLO.scala;
const xTestina = (t: number) => lerp(X0, X1, easeInOut(seg(t, T.corsaDa, T.corsaA)));
/** Quando la testina passa per x (inversa di xTestina, per bisezione: si calcola una volta). */
function quandoPassa(x: number) {
  let a = T.corsaDa, b = T.corsaA;
  for (let i = 0; i < 32; i++) { const m = (a + b) / 2; if (xTestina(m) < x) a = m; else b = m; }
  return (a + b) / 2;
}
export const PASSA_RUNTIME = RUNTIME_RIQUADRI.map(([x0, x1]) => quandoPassa(x0 + (x1 - x0) * 0.3));
export const PASSA_MULTIMEDIA = MULTIMEDIA_RIQUADRI.map(([x0, x1]) => quandoPassa(x0 + (x1 - x0) * 0.5) + 0.06);

// i pixel partono dalla punta del triangolo, i più vicini per primi
const PUNTA = { x: 70, y: 0 };
export const ORDINE_PIXEL = PIXEL.map((p, i) => ({ i, d: Math.hypot(p.x + p.l / 2 - PUNTA.x, p.y + p.l / 2 - PUNTA.y) }))
  .sort((a, b) => a.d - b.d).map((o) => o.i);
const CENTRO_INTERNO = (-54 - 54 + 40) / 3;

/** Uscita con un piccolo rimbalzo oltre l'arrivo. */
const ritorno = (k: number, s = 1.9) => (k <= 0 ? 0 : k >= 1 ? 1 : 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2));

const LogoRuntime = forwardRef<Animabile>(function LogoRuntime(_, ref) {
  const schermo = useRef<HTMLDivElement>(null);
  const bianco = useRef<HTMLDivElement>(null);
  const punto = useRef<HTMLDivElement>(null);
  const lettere = useRef<(SVGPathElement | null)[]>([]);
  const multi = useRef<(SVGPathElement | null)[]>([]);
  const testina = useRef<SVGGElement>(null);
  const testinaNucleo = useRef<SVGRectElement>(null);
  const testinaAlone = useRef<SVGRectElement>(null);
  const esterno = useRef<SVGPathElement>(null);
  const interno = useRef<SVGPathElement>(null);
  const pixel = useRef<(SVGRectElement | null)[]>([]);
  const riflesso = useRef<SVGRectElement>(null);

  useImperativeHandle(ref, () => ({
    aggiorna(t: number) {
      const sc = schermo.current, bi = bianco.current, pu = punto.current;
      if (!sc || !bi || !pu) return;

      // --- lo schermo: si accende, resta, si spegne
      let sx = 0, sy = 0.012, luce = 1, visibile = t >= T.rigaDa && t < T.puntoA;
      if (t < T.rigaA) sx = expoOut(seg(t, T.rigaDa, T.rigaA));
      else if (t < T.spegneDa) {
        sx = 1; sy = lerp(0.012, 1, expoOut(seg(t, T.rigaA, T.apreA)));
        luce = 1 - easeOut(seg(t, T.rigaA + 0.05, T.biancoA));
      } else if (t < T.spentaA) {
        const k = easeIn(seg(t, T.spegneDa, T.spentaA));
        sx = 1; sy = lerp(1, 0.012, k); luce = k;
      } else sx = lerp(1, 0.004, easeIn(seg(t, T.spentaA, T.puntoA)));
      sc.style.opacity = visibile ? "1" : "0";
      sc.style.transform = `translate(-50%, -50%) scale(${sx}, ${sy})`;
      bi.style.opacity = String(luce);
      // il punto bianco che resta quando il tubo si spegne
      const pk = t < T.spentaA ? 0 : t < T.puntoA ? seg(t, T.spentaA + 0.06, T.puntoA) : 1 - easeOut(seg(t, T.puntoA, T.puntoA + 0.38));
      pu.style.opacity = String(clamp(pk));
      pu.style.transform = `translate(-50%, -50%) scale(${t < T.puntoA ? 1 : 1 - 0.6 * seg(t, T.puntoA, T.puntoA + 0.38)})`;

      // --- RUNTIME, lettera per lettera, dietro la testina (un lampo di colore che si posa)
      RUNTIME_LETTERE.forEach((_, i) => {
        const el = lettere.current[i]; if (!el) return;
        const k = seg(t, PASSA_RUNTIME[i], PASSA_RUNTIME[i] + 0.42);
        el.style.opacity = String(easeOut(clamp(k * 1.6)));
        el.setAttribute("transform", `translate(0 ${((1 - expoOut(k)) * 18).toFixed(2)})`);
        el.setAttribute("fill", mix("#2bd0dc", C.scritta, easeOut(seg(t, PASSA_RUNTIME[i] + 0.05, PASSA_RUNTIME[i] + 0.7))));
      });
      MULTIMEDIA_LETTERE.forEach((_, i) => {
        const el = multi.current[i]; if (!el) return;
        const k = seg(t, PASSA_MULTIMEDIA[i], PASSA_MULTIMEDIA[i] + 0.38);
        el.style.opacity = String(easeOut(clamp(k * 1.8)));
        el.setAttribute("transform", `translate(0 ${((1 - expoOut(k)) * 16).toFixed(2)})`);
      });

      // --- la testina: corre, poi si allunga e diventa il lato del triangolo
      const te = testina.current, nu = testinaNucleo.current, al = testinaAlone.current;
      if (te && nu && al) {
        const x = xTestina(t);
        const kl = easeOut(seg(t, T.corsaA, T.latoA));
        const y0 = lerp(86, LATO_Y0, kl), y1 = lerp(250, LATO_Y1, kl);
        te.style.opacity = String(clamp(seg(t, T.testina, T.corsaDa)) * (1 - seg(t, T.pienoA - 0.04, T.pienoA + 0.08)));
        nu.setAttribute("x", (x - 2.4).toFixed(2)); nu.setAttribute("y", y0.toFixed(2)); nu.setAttribute("height", (y1 - y0).toFixed(2));
        al.setAttribute("x", (x - 16).toFixed(2)); al.setAttribute("y", y0.toFixed(2)); al.setAttribute("height", (y1 - y0).toFixed(2));
      }

      // --- il triangolo: si chiude (contorno), si riempie, e dentro si accende l'altro
      const es = esterno.current, it = interno.current;
      if (es && it) {
        es.style.strokeDashoffset = String(1 - easeInOut(seg(t, T.disegnoDa, T.disegnoA)));
        es.style.opacity = t < T.disegnoDa ? "0" : "1";
        es.setAttribute("fill-opacity", String(easeOut(seg(t, T.pienoDa, T.pienoA))));
        es.setAttribute("stroke-opacity", String(1 - seg(t, T.pienoA, T.pienoA + 0.3)));
        const k = seg(t, T.internoDa, T.internoA);
        it.style.opacity = String(clamp(k * 4));
        it.setAttribute("transform", `translate(${CENTRO_INTERNO} 0) scale(${ritorno(k).toFixed(4)}) translate(${-CENTRO_INTERNO} 0)`);
      }

      // --- i pixel escono dalla punta e vanno al loro posto
      ORDINE_PIXEL.forEach((i, n) => {
        const el = pixel.current[i]; if (!el) return;
        const p = PIXEL[i];
        const k = seg(t, T.pixelDa + n * T.pixelPasso, T.pixelDa + n * T.pixelPasso + T.pixelDur);
        const e = expoOut(k);
        const cx = lerp(PUNTA.x, p.x + p.l / 2, e), cy = lerp(PUNTA.y, p.y + p.l / 2, e);
        const giro = (1 - e) * (n % 2 ? -140 : 140);
        el.style.opacity = String(clamp(k * 5));
        el.setAttribute("transform", `translate(${cx.toFixed(2)} ${cy.toFixed(2)}) rotate(${giro.toFixed(1)}) scale(${lerp(0.25, 1, ritorno(k, 1.4)).toFixed(3)})`);
      });

      // --- il riflesso che attraversa il marchio finito
      const ri = riflesso.current;
      if (ri) {
        const k = seg(t, T.riflessoDa, T.riflessoA);
        ri.style.opacity = k > 0 && k < 1 ? "1" : "0";
        ri.setAttribute("transform", `translate(${lerp(-60, 1000, easeInOut(k)).toFixed(1)} 0) skewX(-20)`);
      }
    },
  }), []);

  const simbolo = `translate(${SIMBOLO.x} ${SIMBOLO.y}) scale(${SIMBOLO.scala})`;
  const forme = (bianche: boolean) => (
    <>
      <g transform="translate(70 95) scale(1.42)">
        {RUNTIME_LETTERE.map((d, i) => <path key={i} d={d} fill={bianche ? "#fff" : C.scritta} />)}
      </g>
      {MULTIMEDIA_LETTERE.map((d, i) => <path key={i} d={d} fill={bianche ? "#fff" : C.multimedia} />)}
      <g transform={simbolo}>
        <path d={TRIANGOLO_ESTERNO} fill="#fff" />
        {PIXEL.map((p, i) => <rect key={i} x={p.x} y={p.y} width={p.l} height={p.l} rx={3} fill="#fff" />)}
      </g>
    </>
  );

  return (
    <>
      <div ref={schermo} style={{
        position: "absolute", left: "50%", top: "50%", width: larghezza(), aspectRatio: `${VISTA.w} / ${VISTA.h}`,
        transform: "translate(-50%, -50%) scale(0, 0.012)", opacity: 0, borderRadius: "1.4% / 3.4%", overflow: "hidden",
        background: "radial-gradient(80% 95% at 50% 46%, #fbf8f2 0%, #f3eee4 52%, #e2dacb 100%)",
        boxShadow: "0 0 5vw rgba(255, 236, 212, .16), inset 0 0 3.2vw rgba(60, 40, 20, .2)",
        willChange: "transform, opacity",
      }}>
        <svg viewBox={`${VISTA.x} ${VISTA.y} ${VISTA.w} ${VISTA.h}`} width="100%" height="100%" role="img" aria-label="Runtime Multimedia" style={{ display: "block" }}>
          <defs>
            <linearGradient id="rm-alone" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={C.triangolo} stopOpacity="0" />
              <stop offset=".5" stopColor={C.triangolo} stopOpacity=".38" />
              <stop offset="1" stopColor={C.triangolo} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="rm-riflesso" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset=".5" stopColor="#fff" stopOpacity=".7" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <mask id="rm-maschera" maskUnits="userSpaceOnUse" x={VISTA.x} y={VISTA.y} width={VISTA.w} height={VISTA.h}>{forme(true)}</mask>
          </defs>
          <g transform="translate(70 95) scale(1.42)">
            {RUNTIME_LETTERE.map((d, i) => <path key={i} ref={(el) => { lettere.current[i] = el; }} d={d} fill={C.scritta} style={{ opacity: 0 }} />)}
          </g>
          {MULTIMEDIA_LETTERE.map((d, i) => (
            <path key={i} ref={(el) => { multi.current[i] = el; }} d={d} fill={C.multimedia} stroke={C.multimedia} strokeWidth={2.28} style={{ opacity: 0 }} />
          ))}
          <g transform={simbolo}>
            <path ref={esterno} d={TRIANGOLO_ESTERNO} pathLength={1} fill={C.triangolo} fillOpacity={0} stroke={C.triangolo} strokeWidth={7}
              strokeLinejoin="round" style={{ strokeDasharray: 1, strokeDashoffset: 1, opacity: 0 }} />
            <path ref={interno} d={TRIANGOLO_INTERNO} fill={C.interno} style={{ opacity: 0 }} />
            {PIXEL.map((p, i) => (
              <rect key={i} ref={(el) => { pixel.current[i] = el; }} x={-p.l / 2} y={-p.l / 2} width={p.l} height={p.l} rx={3} fill={p.colore} style={{ opacity: 0 }} />
            ))}
          </g>
          <g ref={testina} style={{ opacity: 0 }}>
            <rect ref={testinaAlone} width={32} fill="url(#rm-alone)" />
            <rect ref={testinaNucleo} width={4.8} rx={2.4} fill={C.triangolo} />
          </g>
          <g mask="url(#rm-maschera)">
            <rect ref={riflesso} x={-90} y={VISTA.y} width={90} height={VISTA.h} fill="url(#rm-riflesso)" style={{ opacity: 0 }} />
          </g>
        </svg>
        {/* il vetro: righe di scansione appena visibili e un riflesso morbido in alto */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.55,
          background: "repeating-linear-gradient(0deg, rgba(60, 42, 24, .07) 0px, rgba(60, 42, 24, .07) 1px, transparent 1px, transparent 3px)" }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(70% 55% at 30% 12%, rgba(255, 255, 255, .35) 0%, rgba(255, 255, 255, 0) 70%)" }} />
        <div ref={bianco} style={{ position: "absolute", inset: 0, background: "#fffdf8", opacity: 1, pointerEvents: "none" }} />
      </div>
      <div ref={punto} style={{
        position: "absolute", left: "50%", top: "50%", width: "2.2vh", height: "2.2vh", borderRadius: "50%", opacity: 0,
        transform: "translate(-50%, -50%)", background: "radial-gradient(circle, #fff 0%, rgba(255,250,236,.85) 35%, rgba(255,240,210,0) 70%)",
        pointerEvents: "none",
      }} />
    </>
  );
});

export default LogoRuntime;
