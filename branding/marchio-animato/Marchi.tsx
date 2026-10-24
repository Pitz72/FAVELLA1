// ====================================================================
//  I due marchi fermi, in bianco, per la fine dei titoli di coda
//  (richiesta dell'autore, 19 ottobre 2026): Runtime Multimedia e Favella1
//  (il simbolo di FAVELLA e di Favella Studio). Le forme sono quelle dei
//  loghi d'apertura (forme.ts), senza animazione e senza colori: tutto
//  bianco sul fondo scuro; dove due forme si sovrappongono, un filo del
//  colore del fondo (--fondo-2) le separa.
// ====================================================================
import {
  RUNTIME_VISTA, RUNTIME_LETTERE, MULTIMEDIA_LETTERE, SIMBOLO, TRIANGOLO_ESTERNO, TRIANGOLO_INTERNO, PIXEL,
  EMBLEMA_POSA as P, FOGLIE, LIBRO, GRAFFA, GEMMA, ASSE,
} from "./forme";

const BIANCO = "#f4f6f7";
const TAGLIO = { stroke: "var(--fondo-2, #050a0c)" };

export function MarchioRuntime({ className }: { className?: string }) {
  const V = RUNTIME_VISTA;
  return (
    <svg className={className} viewBox={`${V.x} ${V.y} ${V.w} ${V.h}`} role="img" aria-label="Runtime Multimedia">
      <g transform="translate(70 95) scale(1.42)" fill={BIANCO}>
        {RUNTIME_LETTERE.map((d, i) => <path key={i} d={d} />)}
      </g>
      <g fill={BIANCO} stroke={BIANCO} strokeWidth={2.28}>
        {MULTIMEDIA_LETTERE.map((d, i) => <path key={i} d={d} />)}
      </g>
      <g transform={`translate(${SIMBOLO.x} ${SIMBOLO.y}) scale(${SIMBOLO.scala})`}>
        <path d={TRIANGOLO_ESTERNO} fill="none" stroke={BIANCO} strokeWidth={7} strokeLinejoin="round" />
        <path d={TRIANGOLO_INTERNO} fill={BIANCO} />
        {PIXEL.map((p, i) => (
          <rect key={i} x={p.x - p.l / 2} y={p.y - p.l / 2} width={p.l} height={p.l} rx={3} fill={BIANCO} />
        ))}
      </g>
    </svg>
  );
}

const F_VISTA = { x: 80, y: 150, w: 1940, h: 400 };
const SPECCHIO = `translate(${2 * ASSE} 0) scale(-1 1)`;
const SCRITTA = "FAVELLA1";
const MOTTO = "Programmare storie interattive in linguaggio naturale italiano";

export function MarchioFavella({ className }: { className?: string }) {
  const V = F_VISTA;
  const foglie = FOGLIE.map((d, i) => <path key={i} d={d} fill={BIANCO} style={TAGLIO} strokeWidth={6} paintOrder="stroke" strokeLinejoin="round" />);
  return (
    <svg className={className} viewBox={`${V.x} ${V.y} ${V.w} ${V.h}`} role="img" aria-label="Favella1 — programmare storie interattive in linguaggio naturale italiano">
      <g transform={`translate(${P.x} ${P.y}) scale(${P.scala})`}>
        <g fill="none" stroke={BIANCO} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round">
          <path d={GRAFFA} />
          <path d={GRAFFA} transform={SPECCHIO} />
        </g>
        <g>{foglie}</g>
        <g transform={SPECCHIO}>{foglie}</g>
        <path d={LIBRO} fill={BIANCO} style={TAGLIO} strokeWidth={9} paintOrder="stroke" strokeLinejoin="round" />
        <path d={`M${GEMMA.alto} L${GEMMA.sx} L${GEMMA.basso} L${GEMMA.dx} Z`} fill={BIANCO} style={TAGLIO} strokeWidth={6} paintOrder="stroke" />
      </g>
      <text x={892} y={415} fontFamily="Sora, Inter, sans-serif" fontWeight={700} fontSize={216} fill={BIANCO} textLength={1057} lengthAdjust="spacing">
        {SCRITTA}
      </text>
      <text x={896} y={489} fontFamily="Inter, sans-serif" fontWeight={400} fontSize={45.5} fill={BIANCO} fillOpacity={0.82} textLength={1088} lengthAdjust="spacing">
        {MOTTO}
      </text>
    </svg>
  );
}
