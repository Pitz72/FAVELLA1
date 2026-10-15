// ====================================================================
//  Il logo di FAVELLA 1, che si crea da sé.
// --------------------------------------------------------------------
//  Una scintilla accende la gemma; il libro si apre dal centro; le sei
//  pagine salgono dal dorso e si aprono a ventaglio, e la luce verde le
//  avvolge; le graffe del codice si disegnano attorno, tratto dopo tratto,
//  e si posano. Poi la scritta, lettera per lettera, e il motto battuto a
//  macchina, col suo cursore. Un riflesso, una pausa, la dissolvenza.
//  Il simbolo è il marchio ufficiale ridisegnato in vettoriale (forme.ts);
//  scritta e motto sono nei caratteri del marchio, Sora e Inter, già nel gioco.
//  Tutto è funzione del tempo t (secondi), dall'orologio unico di Loghi.tsx.
// ====================================================================
import { forwardRef, useImperativeHandle, useRef } from "react";
import { clamp, seg, easeOut, easeIn, easeInOut, expoOut, lerp, mix, rng } from "../trailer/tempo";
import { EMBLEMA_POSA as P, FOGLIE, FOGLIE_PUNTA, PERNO, LIBRO, GRAFFA, GEMMA, ASSE } from "./forme";
import type { Animabile } from "./LogoRuntime";

export const DURATA_FAVELLA = 6.8;

// la regia, in secondi (la legge anche il suono, suono.ts)
export const REGIA_FAVELLA = {
  fondoDa: 0.2, fondoA: 1.1,
  scintillaDa: 0.32, scintillaA: 0.86,
  libroDa: 0.7, libroA: 1.5,
  foglieDa: 1.0, fogliePasso: 0.06, foglieDur: 1.05,
  graffeDa: 1.45, graffeA: 2.25, graffePiene: 2.1,
  scrittaDa: 2.3, scrittaPasso: 0.075, scrittaDur: 0.55,
  bagliore: 3.05,
  mottoDa: 3.15, mottoA: 4.35, cursoreFine: 4.95,
  riflessoDa: 3.75, riflessoA: 4.4,
  esceDa: 6.0, esceA: 6.6,
};
const T = REGIA_FAVELLA;

const VISTA = { x: 80, y: 150, w: 1940, h: 400 };
const larghezza = () => (window.innerWidth < window.innerHeight ? "94vw" : "min(72vw, 330vh)");
const SPECCHIO = `translate(${2 * ASSE} 0) scale(-1 1)`;
// le foglie chiuse puntano in su lungo il dorso: quanto ruotare ognuna per arrivarci
const CHIUSA = FOGLIE_PUNTA.map(([x, y]) => 90 - (Math.atan2(PERNO[1] - y, PERNO[0] - x) * 180) / Math.PI);
const CENTRO_GEMMA = [ASSE, 351];
const SCRITTA = "FAVELLA1";
export const MOTTO = "Programmare storie interattive in linguaggio naturale italiano";
const SCRITTA_X = 892, SCRITTA_Y = 415, SCRITTA_L = 1057;
const MOTTO_X = 896, MOTTO_Y = 489, MOTTO_L = 1088;

// il ritmo della battitura: un po' irregolare, una pausa dopo le parole (sempre lo stesso)
export const BATTUTE = (() => {
  const r = rng(1972), pesi = [...MOTTO].map((c) => (c === " " ? 2.2 : 0.7 + r() * 0.6));
  const tot = pesi.reduce((a, b) => a + b, 0);
  let s = 0;
  return pesi.map((p) => (s += p) / tot);
})();
const BAT = (k: number) => { let n = 0; while (n < BATTUTE.length && BATTUTE[n] <= k) n++; return n; };

const ritorno = (k: number, s = 1.7) => (k <= 0 ? 0 : k >= 1 ? 1 : 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2));

const LogoFavella = forwardRef<Animabile>(function LogoFavella(_, ref) {
  const fondo = useRef<HTMLDivElement>(null);
  const tutto = useRef<SVGSVGElement>(null);
  const alone = useRef<SVGGElement>(null);
  const aloneFoglie = useRef<SVGCircleElement>(null);
  const bloom = useRef<SVGGElement>(null);
  const foglie = useRef<(SVGGElement | null)[]>([]);
  const libro = useRef<SVGGElement>(null);
  const apertura = useRef<SVGRectElement>(null);
  const graffeBase = useRef<SVGGElement>(null);
  const graffeTratto = useRef<(SVGPathElement | null)[]>([]);
  const gemma = useRef<SVGGElement>(null);
  const aloneGemma = useRef<SVGCircleElement>(null);
  const scintilla = useRef<SVGPathElement>(null);
  const lettere = useRef<(SVGTextElement | null)[]>([]);
  const misura = useRef<SVGTextElement>(null);
  const misuraMotto = useRef<SVGTextElement>(null);
  const baglioreScritta = useRef<SVGTextElement>(null);
  const taglioMotto = useRef<SVGRectElement>(null);
  const cursore = useRef<SVGRectElement>(null);
  const riflesso = useRef<SVGRectElement>(null);
  const bordiMotto = useRef<number[]>([]);

  useImperativeHandle(ref, () => ({
    /** A caratteri caricati: dove cade ogni lettera della scritta e ogni carattere del motto. */
    prepara() {
      const m = misura.current;
      if (m) {
        try {
          SCRITTA.split("").forEach((_, i) => lettere.current[i]?.setAttribute("x", String(m.getStartPositionOfChar(i).x)));
        } catch { /* senza misure restano le posizioni proporzionali */ }
      }
      const mm = misuraMotto.current;
      if (mm) {
        try {
          const b = [...MOTTO].map((_, i) => mm.getStartPositionOfChar(i).x);
          b.push(mm.getEndPositionOfChar(MOTTO.length - 1).x);
          bordiMotto.current = b;
        } catch { bordiMotto.current = []; }
      }
    },
    aggiorna(t: number) {
      const fo = fondo.current, sv = tutto.current;
      if (!fo || !sv) return;
      const esce = easeIn(seg(t, T.esceDa, T.esceA));
      const dentro = t > 0 && t < T.esceA + 0.05;
      fo.style.opacity = String(easeOut(seg(t, T.fondoDa, T.fondoA)) * (1 - esce));
      sv.style.opacity = dentro ? String(1 - esce) : "0";
      sv.style.transform = `translate(-50%, -50%) scale(${1 + 0.015 * esce})`;

      // --- la luce di fondo: arriva con le pagine e poi respira appena
      const respiro = t > 4.3 ? 0.04 * Math.sin((t - 4.3) * 2.4) : 0;
      if (alone.current) alone.current.style.opacity = String(easeOut(seg(t, 0.5, 2.2)) * (1 + respiro));
      if (aloneFoglie.current) aloneFoglie.current.style.opacity = String(easeOut(seg(t, T.foglieDa + 0.3, T.foglieDa + 1.3)));
      if (bloom.current) bloom.current.style.opacity = String(0.5 * easeOut(seg(t, T.foglieDa + T.foglieDur - 0.1, T.foglieDa + T.foglieDur + 0.6)) * (1 + respiro * 2));

      // --- la gemma: una scintilla a quattro punte, poi la pietra che si accende
      const kg = seg(t, T.scintillaDa, T.scintillaA);
      if (gemma.current) {
        gemma.current.style.opacity = String(clamp(kg * 3));
        const s = ritorno(kg, 2.2);
        gemma.current.setAttribute("transform", `translate(${CENTRO_GEMMA[0]} ${CENTRO_GEMMA[1]}) scale(${s.toFixed(4)}) translate(${-CENTRO_GEMMA[0]} ${-CENTRO_GEMMA[1]})`);
      }
      if (aloneGemma.current) aloneGemma.current.style.opacity = String(easeOut(seg(t, T.scintillaDa + 0.1, T.scintillaA + 0.4)) * (1 + respiro * 1.5));
      if (scintilla.current) {
        const k = seg(t, T.scintillaDa, T.scintillaDa + 0.62);
        const s = k < 0.35 ? easeOut(k / 0.35) * 1.25 : 1.25 * (1 - easeIn((k - 0.35) / 0.65));
        scintilla.current.style.opacity = k > 0 && k < 1 ? "1" : "0";
        scintilla.current.setAttribute("transform", `translate(${CENTRO_GEMMA[0]} ${CENTRO_GEMMA[1] - 6}) rotate(${(k * 60).toFixed(1)}) scale(${s.toFixed(3)})`);
      }

      // --- il libro si apre dal centro
      if (libro.current && apertura.current) {
        const k = expoOut(seg(t, T.libroDa, T.libroA));
        libro.current.style.opacity = String(easeOut(seg(t, T.libroDa, T.libroDa + 0.35)));
        const w = 800 * k;
        apertura.current.setAttribute("x", (ASSE - w / 2).toFixed(1));
        apertura.current.setAttribute("width", w.toFixed(1));
        libro.current.setAttribute("transform", `translate(0 ${((1 - k) * 10).toFixed(2)})`);
      }

      // --- le pagine: dal dorso, chiuse, al ventaglio (la più interna per prima)
      for (let lato = 0; lato < 2; lato++) {
        for (let i = 0; i < 3; i++) {
          const el = foglie.current[lato * 3 + i]; if (!el) continue;
          const t0 = T.foglieDa + (2 - i) * T.fogliePasso;
          const k = seg(t, t0, t0 + T.foglieDur);
          const e = ritorno(k, 1.15);
          const a = CHIUSA[i] * (1 - e), s = lerp(0.42, 1, expoOut(k));
          el.style.opacity = String(easeOut(clamp(k * 3)));
          el.setAttribute("transform", `rotate(${a.toFixed(2)} ${PERNO[0]} ${PERNO[1]}) translate(${PERNO[0]} ${PERNO[1]}) scale(${s.toFixed(4)}) translate(${-PERNO[0]} ${-PERNO[1]})`);
        }
      }

      // --- le graffe: il contorno si disegna, poi si riempiono e la linea si posa
      const kd = easeInOut(seg(t, T.graffeDa, T.graffeA));
      const kp = seg(t, T.graffePiene, T.graffePiene + 0.45);
      graffeTratto.current.forEach((el) => {
        if (!el) return;
        el.style.opacity = t < T.graffeDa ? "0" : "1";
        el.style.strokeDashoffset = String(1 - kd);
        el.setAttribute("stroke", mix("#86ecff", "#33698c", easeOut(kp)));
        el.setAttribute("stroke-width", lerp(5, 2, easeOut(kp)).toFixed(2));
        el.setAttribute("stroke-opacity", lerp(1, 0.85, kp).toFixed(3));
      });
      if (graffeBase.current) graffeBase.current.style.opacity = String(easeOut(kp));

      // --- FAVELLA1, una lettera dopo l'altra
      SCRITTA.split("").forEach((_, i) => {
        const el = lettere.current[i]; if (!el) return;
        const t0 = T.scrittaDa + i * T.scrittaPasso;
        const k = seg(t, t0, t0 + T.scrittaDur);
        const e = expoOut(k);
        el.style.opacity = String(easeOut(clamp(k * 1.5)));
        el.style.filter = e < 0.995 ? `blur(${((1 - e) * 9).toFixed(2)}px)` : "none";
        el.setAttribute("transform", `translate(0 ${((1 - e) * 34).toFixed(2)})`);
      });
      if (baglioreScritta.current) baglioreScritta.current.style.opacity = String(0.35 * easeOut(seg(t, T.bagliore, T.bagliore + 0.6)));

      // --- il motto, battuto a macchina, col cursore che poi lampeggia e se ne va
      const bordi = bordiMotto.current;
      const km = seg(t, T.mottoDa, T.mottoA);
      const n = km <= 0 ? 0 : BAT(km);
      const xFine = bordi.length ? bordi[n] : MOTTO_X + (MOTTO_L * n) / MOTTO.length;
      if (taglioMotto.current) taglioMotto.current.setAttribute("width", Math.max(0, xFine - MOTTO_X + (n ? 1 : 0)).toFixed(1));
      if (cursore.current) {
        const lampeggia = t > T.mottoA ? (Math.floor((t - T.mottoA) / 0.26) % 2 === 0 ? 1 : 0) : 1;
        const c = t < T.mottoDa - 0.15 ? 0 : t < T.cursoreFine ? lampeggia : 1 - seg(t, T.cursoreFine, T.cursoreFine + 0.2);
        cursore.current.style.opacity = String(c * clamp(seg(t, T.mottoDa - 0.15, T.mottoDa)));
        cursore.current.setAttribute("x", (xFine + 4).toFixed(1));
      }

      // --- un riflesso sulla scritta
      if (riflesso.current) {
        const k = seg(t, T.riflessoDa, T.riflessoA);
        riflesso.current.style.opacity = k > 0 && k < 1 ? "1" : "0";
        riflesso.current.setAttribute("transform", `translate(${lerp(820, 2020, easeInOut(k)).toFixed(1)} 0) skewX(-18)`);
      }
    },
  }), []);

  const pagine = (tipo: "colore" | "bloom", lato: number) => FOGLIE.map((d, i) =>
    tipo === "bloom" ? <path key={i} d={d} /> : (
      <g key={i} ref={(el) => { foglie.current[lato * 3 + i] = el; }} style={{ opacity: 0 }}>
        <path d={d} fill="#012a35" fillOpacity={0.55} transform="translate(-4 7)" />
        <path d={d} fill="#01313d" fillOpacity={0.6} transform="translate(-2 3.5)" />
        <path d={d} fill={`url(#fv-foglia${i})`} />
      </g>
    ));
  const proporzionali = SCRITTA.split("").map((_, i) => SCRITTA_X + (SCRITTA_L * i) / SCRITTA.length);

  return (
    <>
      <div ref={fondo} style={{
        position: "absolute", inset: 0, opacity: 0, pointerEvents: "none",
        background: "radial-gradient(62% 70% at 50% 50%, #08121f 0%, #050a13 48%, #000 100%)",
      }} />
      <svg ref={tutto} viewBox={`${VISTA.x} ${VISTA.y} ${VISTA.w} ${VISTA.h}`} role="img"
        aria-label="FAVELLA 1 — programmare storie interattive in linguaggio naturale italiano"
        style={{ position: "absolute", left: "50%", top: "50%", width: larghezza(), height: "auto", aspectRatio: `${VISTA.w} / ${VISTA.h}`,
          transform: "translate(-50%, -50%)", opacity: 0, overflow: "visible", willChange: "transform, opacity" }}>
        <defs>
          {FOGLIE_PUNTA.map(([x, y], i) => (
            <linearGradient key={i} id={`fv-foglia${i}`} gradientUnits="userSpaceOnUse" x1={x} y1={y} x2={PERNO[0]} y2={PERNO[1]}>
              <stop offset="0" stopColor="#1ef5c8" /><stop offset=".22" stopColor="#06dcb5" /><stop offset=".5" stopColor="#03ad9d" />
              <stop offset=".78" stopColor="#036f82" /><stop offset="1" stopColor="#0a4862" />
            </linearGradient>
          ))}
          <radialGradient id="fv-alone" gradientUnits="userSpaceOnUse" cx="452" cy="300" r="560">
            <stop offset="0" stopColor="#1a98ae" stopOpacity=".72" /><stop offset=".26" stopColor="#16779e" stopOpacity=".6" />
            <stop offset=".52" stopColor="#105079" stopOpacity=".42" /><stop offset=".78" stopColor="#0b3152" stopOpacity=".2" />
            <stop offset="1" stopColor="#06263a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="fv-alone-foglie" gradientUnits="userSpaceOnUse" cx="452" cy="255" r="250">
            <stop offset="0" stopColor="#1fe0b5" stopOpacity=".42" /><stop offset=".5" stopColor="#13a796" stopOpacity=".18" />
            <stop offset="1" stopColor="#0d6f75" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="fv-alone-gemma" gradientUnits="userSpaceOnUse" cx={CENTRO_GEMMA[0]} cy="365" r="85">
            <stop offset="0" stopColor="#ffb52e" stopOpacity=".75" /><stop offset=".45" stopColor="#e88a14" stopOpacity=".35" />
            <stop offset="1" stopColor="#c06a0a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="fv-gemma-sx" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff27a" /><stop offset=".35" stopColor="#ffc21f" /><stop offset="1" stopColor="#f39400" />
          </linearGradient>
          <linearGradient id="fv-gemma-dx" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffd84a" /><stop offset=".35" stopColor="#fbab0a" /><stop offset="1" stopColor="#e97a00" />
          </linearGradient>
          <linearGradient id="fv-riflesso" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff" stopOpacity=".55" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <filter id="fv-sfuma-foglie" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="16" /></filter>
          <filter id="fv-sfuma-scritta" x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur stdDeviation="7" /></filter>
          <clipPath id="fv-apertura"><rect ref={apertura} x={ASSE} y="0" width="0" height="520" /></clipPath>
          <clipPath id="fv-taglio-motto"><rect ref={taglioMotto} x={MOTTO_X} y="440" width="0" height="70" /></clipPath>
          <mask id="fv-maschera-scritta" maskUnits="userSpaceOnUse" x={VISTA.x} y={VISTA.y} width={VISTA.w} height={VISTA.h}>
            <text x={SCRITTA_X} y={SCRITTA_Y} fontFamily="Sora, Inter, sans-serif" fontWeight={700} fontSize={216} fill="#fff"
              textLength={SCRITTA_L} lengthAdjust="spacing">{SCRITTA}</text>
          </mask>
        </defs>

        <g ref={alone} style={{ opacity: 0 }}><circle cx="452" cy="300" r="560" fill="url(#fv-alone)" /></g>
        <circle ref={aloneFoglie} cx="452" cy="255" r="250" fill="url(#fv-alone-foglie)" style={{ opacity: 0 }} />

        <g transform={`translate(${P.x} ${P.y}) scale(${P.scala})`}>
          <g ref={graffeBase} style={{ opacity: 0 }}>
            <g fill="#15263c" stroke="#081120" strokeWidth={7} strokeLinejoin="round" paintOrder="stroke">
              <path d={GRAFFA} /><path d={GRAFFA} transform={SPECCHIO} />
            </g>
          </g>
          <g fill="none" strokeLinejoin="round" strokeLinecap="round">
            <path ref={(el) => { graffeTratto.current[0] = el; }} d={GRAFFA} pathLength={1} stroke="#86ecff" strokeWidth={5}
              style={{ strokeDasharray: 1, strokeDashoffset: 1, opacity: 0 }} />
            <path ref={(el) => { graffeTratto.current[1] = el; }} d={GRAFFA} pathLength={1} stroke="#86ecff" strokeWidth={5} transform={SPECCHIO}
              style={{ strokeDasharray: 1, strokeDashoffset: 1, opacity: 0 }} />
          </g>

          <g ref={bloom} filter="url(#fv-sfuma-foglie)" fill="#22e8c4" style={{ opacity: 0 }}>
            {pagine("bloom", 0)}
            <g transform={SPECCHIO}>{pagine("bloom", 1)}</g>
          </g>
          <g>{pagine("colore", 0)}</g>
          <g transform={SPECCHIO}>{pagine("colore", 1)}</g>

          <g ref={libro} clipPath="url(#fv-apertura)" style={{ opacity: 0 }}>
            <path d={LIBRO} fill="#152840" stroke="#081120" strokeWidth={7} strokeLinejoin="round" paintOrder="stroke" />
            <path d={LIBRO} fill="none" stroke="#33698c" strokeOpacity={0.8} strokeWidth={2} strokeLinejoin="round" />
          </g>

          <circle ref={aloneGemma} cx={CENTRO_GEMMA[0]} cy="365" r="85" fill="url(#fv-alone-gemma)" style={{ opacity: 0 }} />
          <g ref={gemma} style={{ opacity: 0 }}>
            <path d={`M${GEMMA.alto} L${GEMMA.sx} L${GEMMA.basso} Z`} fill="url(#fv-gemma-sx)" />
            <path d={`M${GEMMA.alto} L${GEMMA.dx} L${GEMMA.basso} Z`} fill="url(#fv-gemma-dx)" />
            <path d={`M${GEMMA.alto} L${GEMMA.basso}`} stroke="#fff6c0" strokeOpacity={0.8} strokeWidth={1.6} />
          </g>
          <path ref={scintilla} d="M0,-46 L7,-7 L46,0 L7,7 L0,46 L-7,7 L-46,0 L-7,-7 Z" fill="#fff6d2" style={{ opacity: 0 }} />
        </g>

        <text ref={baglioreScritta} x={SCRITTA_X} y={SCRITTA_Y} fontFamily="Sora, Inter, sans-serif" fontWeight={700} fontSize={216} fill="#5fd6e0"
          textLength={SCRITTA_L} lengthAdjust="spacing" filter="url(#fv-sfuma-scritta)" style={{ opacity: 0 }}>{SCRITTA}</text>
        <text ref={misura} x={SCRITTA_X} y={SCRITTA_Y} fontFamily="Sora, Inter, sans-serif" fontWeight={700} fontSize={216}
          textLength={SCRITTA_L} lengthAdjust="spacing" fill="none" aria-hidden="true">{SCRITTA}</text>
        {SCRITTA.split("").map((c, i) => (
          <text key={i} ref={(el) => { lettere.current[i] = el; }} x={proporzionali[i]} y={SCRITTA_Y} fontFamily="Sora, Inter, sans-serif" fontWeight={700}
            fontSize={216} fill="#f6f8fa" aria-hidden="true" style={{ opacity: 0 }}>{c}</text>
        ))}
        <g mask="url(#fv-maschera-scritta)">
          <rect ref={riflesso} x={-70} y={VISTA.y} width={70} height={VISTA.h} fill="url(#fv-riflesso)" style={{ opacity: 0 }} />
        </g>

        <text ref={misuraMotto} x={MOTTO_X} y={MOTTO_Y} fontFamily="Inter, sans-serif" fontWeight={400} fontSize={45.5} fill="#e9eef3"
          textLength={MOTTO_L} lengthAdjust="spacing" clipPath="url(#fv-taglio-motto)" aria-hidden="true">{MOTTO}</text>
        <rect ref={cursore} x={MOTTO_X} y={452} width={4} height={48} rx={1} fill="#5fd6e0" style={{ opacity: 0 }} />
      </svg>
    </>
  );
});

export default LogoFavella;
