// ====================================================================
//  Il cartello delle licenze e dei crediti: dopo i loghi, prima dell'avviso.
// --------------------------------------------------------------------
//  Chi ha fatto il gioco, con che cosa, e sotto quali licenze: la storia e i
//  testi, la musica, le voci del doppiaggio (Google Gemini TTS; ElevenLabs per
//  quattro personaggi, fuori dalla licenza libera e solo per uso non
//  commerciale: qui sta l'attribuzione «elevenlabs.io»), il motore, i
//  componenti, i marchi. Voluto da Simone il 20/10/2026. Si comporta come
//  l'avviso: compare a ogni avvio, prosegue da solo dopo ATTESA_MASSIMA,
//  oppure subito con Invio, Spazio, Esc o un clic. I testi delle licenze per
//  intero stanno nel repository (LICENSE, LICENSE-CONTENUTI.md, README).
// ====================================================================
import { useEffect, useRef, useState } from "react";

const SERIF = "'Lora', Georgia, serif";
const MONO = "'Source Code Pro', ui-monospace, monospace";

/** Le righe del cartello: [che cosa, chi o che licenza]. collaudo/testo.py non le controlla: sono dell'app. */
export const CREDITI: [string, string][] = [
  ["Il Viaggiatore", "un gioco di Simone Pizzi (Pitz72), 2026"],
  ["Storia, testi, musica, grafica", "CC BY-SA 4.0"],
  ["Voci", "doppiaggio con sintesi vocale Google Gemini TTS (CC BY-SA 4.0)"],
  ["Imma, Rosaria, Tore e Vito", "voci ElevenLabs · elevenlabs.io · solo uso non commerciale, fuori dalla licenza libera"],
  ["Codice", "MIT"],
  ["Motore", "FAVELLA 1 · MIT"],
  ["Componenti", "Pyodide (MPL-2.0) · Lark, React, Electron (MIT) · caratteri Inter, Lora, Sora, Source Code Pro, Covered By Your Grace (SIL OFL 1.1)"],
  ["Marchi", "i loghi di Runtime Multimedia e di FAVELLA 1 sono dei rispettivi titolari"],
];

const ATTESA_MASSIMA = 15_000;      // ms: poi prosegue da solo
const DISSOLVENZA = 900;            // ms

export default function Crediti({ onFine }: { onFine: () => void }) {
  const [visibile, setVisibile] = useState(false);
  const fatto = useRef(false);
  const fine = useRef(onFine);
  fine.current = onFine;
  const prosegui = () => { if (!fatto.current) { fatto.current = true; fine.current(); } };

  useEffect(() => {
    const ridotto = !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const comparsa = window.setTimeout(() => setVisibile(true), ridotto ? 0 : 300);
    const scadenza = window.setTimeout(prosegui, ATTESA_MASSIMA);
    const tasto = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") { e.preventDefault(); prosegui(); }
    };
    window.addEventListener("keydown", tasto);
    return () => { window.clearTimeout(comparsa); window.clearTimeout(scadenza); window.removeEventListener("keydown", tasto); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div role="dialog" aria-modal="true" aria-label="Licenze e crediti" onClick={prosegui}
      style={{ position: "fixed", inset: 0, background: "#000", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "5vh 7vw", cursor: "pointer", color: "#e6e0d6" }}>
      <div style={{ width: "min(54rem, 100%)", opacity: visibile ? 1 : 0, transition: `opacity ${DISSOLVENZA}ms ease` }}>
        <p style={{ margin: "0 0 min(4vh, 32px)", textAlign: "center", fontFamily: MONO, fontSize: "clamp(11px, 1vw, 13px)",
          letterSpacing: ".3em", textTransform: "uppercase", color: "rgba(230,223,210,.62)" }}>licenze e crediti</p>
        <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "minmax(10rem, 20rem) 1fr", columnGap: "1.6em", rowGap: ".75em",
          fontSize: "clamp(14px, 1.45vw, 18px)", lineHeight: 1.45 }}>
          {CREDITI.map(([che, chi]) => (
            <div key={che} style={{ display: "contents" }}>
              <dt style={{ textAlign: "right", fontFamily: MONO, fontSize: ".78em", letterSpacing: ".08em", paddingTop: ".2em",
                color: "rgba(230,223,210,.6)" }}>{che}</dt>
              <dd style={{ margin: 0, fontFamily: SERIF, color: "#ece4d6" }}>{chi}</dd>
            </div>
          ))}
        </dl>
        <p style={{ margin: "min(4vh, 32px) 0 0", textAlign: "center", fontFamily: SERIF, fontStyle: "italic",
          fontSize: "clamp(13px, 1.2vw, 15px)", color: "rgba(230,223,210,.6)" }}>
          I testi delle licenze: github.com/Pitz72/il-viaggiatore-favella
        </p>
        <div style={{ textAlign: "center" }}>
          <button autoFocus onClick={(e) => { e.stopPropagation(); prosegui(); }}
            style={{ marginTop: "min(5vh, 40px)", cursor: "pointer", fontFamily: MONO, fontSize: 11, letterSpacing: ".24em",
              textTransform: "uppercase", color: "rgba(230,223,210,.7)", background: "transparent",
              border: "1px solid rgba(230,223,210,.28)", borderRadius: 999, padding: "9px 20px" }}>
            continua
          </button>
        </div>
      </div>
    </div>
  );
}
