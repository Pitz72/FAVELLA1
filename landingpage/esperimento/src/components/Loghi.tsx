// ====================================================================
//  I loghi all'avvio: Runtime, poi FAVELLA, poi il trailer.
// --------------------------------------------------------------------
//  Per ogni schermata: 1 s di nero, 1 s di dissolvenza in entrata, 3 s pieni,
//  1 s di dissolvenza in uscita; dopo l'ultima, 1 s di nero e il trailer.
//  Un solo orologio (requestAnimationFrame) per tutto; le immagini si
//  decodificano prima di partire, così la prima dissolvenza non scatta.
//  Esc salta i loghi. Con «riduci movimento» non si mostrano.
// ====================================================================
import { useEffect, useRef, useState } from "react";
import logoRuntime from "../assets/loghi/runtime.webp";
import logoFavella from "../assets/loghi/favella.webp";

const NERO = 1, DISSOLVENZA = 1, PIENO = 3;
const SCHERMATE = [
  { src: logoRuntime, alt: "Runtime — la radio geek", larghezza: "min(40vw, 90vh)" },
  { src: logoFavella, alt: "FAVELLA 1 — programmare storie interattive in linguaggio naturale italiano", larghezza: "min(64vw, 180vh)" },
];
const PERIODO = NERO + DISSOLVENZA + PIENO + DISSOLVENZA;
const DURATA = SCHERMATE.length * PERIODO + NERO;

/** Opacità della schermata i al tempo t (secondi). */
function opacita(i: number, t: number) {
  const u = t - i * PERIODO - NERO;
  if (u <= 0 || u >= DISSOLVENZA * 2 + PIENO) return 0;
  if (u < DISSOLVENZA) return u / DISSOLVENZA;
  if (u < DISSOLVENZA + PIENO) return 1;
  return 1 - (u - DISSOLVENZA - PIENO) / DISSOLVENZA;
}
// dissolvenze morbide: la luminosità percepita non è lineare
const morbida = (x: number) => x * x * (3 - 2 * x);

export default function Loghi({ onFine }: { onFine: () => void }) {
  const immagini = useRef<(HTMLImageElement | null)[]>([]);
  const [pronti, setPronti] = useState(false);
  const fatto = useRef(false);
  const fine = useRef(onFine);
  fine.current = onFine;
  const chiudi = () => { if (!fatto.current) { fatto.current = true; fine.current(); } };

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { chiudi(); return; }
    let vivo = true;
    Promise.all(SCHERMATE.map((s) => { const im = new Image(); im.src = s.src; return im.decode().catch(() => null); }))
      .then(() => { if (vivo) setPronti(true); });
    const tasto = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); chiudi(); } };
    window.addEventListener("keydown", tasto);
    return () => { vivo = false; window.removeEventListener("keydown", tasto); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pronti) return;
    let raf = 0;
    const t0 = performance.now();
    const passo = (ora: number) => {
      const t = (ora - t0) / 1000;
      SCHERMATE.forEach((_, i) => {
        const el = immagini.current[i];
        if (el) el.style.opacity = String(morbida(opacita(i, t)));
      });
      if (t >= DURATA) { chiudi(); return; }
      raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronti]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", cursor: "none" }} aria-label="Loghi di apertura">
      {SCHERMATE.map((s, i) => (
        <img key={s.alt} ref={(el) => { immagini.current[i] = el; }} src={s.src} alt={s.alt} draggable={false}
          style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: s.larghezza,
            height: "auto", opacity: 0, userSelect: "none", pointerEvents: "none" }} />
      ))}
    </div>
  );
}
