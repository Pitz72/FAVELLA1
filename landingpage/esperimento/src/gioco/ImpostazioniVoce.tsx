// ====================================================================
//  «La voce»: come si sente il gioco. Voce recitata (il doppiaggio) oppure
//  lettore di schermo (nessuna voce: il diario si annuncia), e il volume.
//  Stesso aspetto della guida; Esc chiude, il fuoco entra e torna.
// ====================================================================
import { useDialogo } from "./useDialogo";
import type { Impostazioni, Modo } from "./voce";

const SERIF = "'Lora', Georgia, serif";
const DISPLAY = "'Sora', 'Inter', sans-serif";
const MONO = "'Source Code Pro', ui-monospace, monospace";

const MODI: { modo: Modo; titolo: string; testo: string }[] = [
  { modo: "recitata", titolo: "Voce recitata",
    testo: "Il gioco ti legge il racconto con le voci del doppiaggio: il narratore, chi incontri, i suggerimenti. La voce si ferma al primo tasto che premi." },
  { modo: "lettore", titolo: "Lettore di schermo",
    testo: "Nessuna voce del gioco: se usi un lettore di schermo, è lui a leggerti il diario, riga per riga." },
];

export default function ImpostazioniVoce({ base, accento, imp, onCambia, onRiascolta, onChiudi }: {
  base: number; accento: string; imp: Impostazioni;
  onCambia: (i: Impostazioni) => void; onRiascolta: () => void; onChiudi: () => void;
}) {
  const dialogo = useDialogo<HTMLDivElement>(onChiudi);
  const recitata = imp.modo === "recitata";
  return (
    <div ref={dialogo} tabIndex={-1} role="dialog" aria-modal="true" aria-label="La voce"
      style={{ outline: "none", fontSize: base, position: "absolute", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(4,4,8,.72)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", animation: "kf-launch .35s ease both", pointerEvents: "auto" }}
      onClick={onChiudi}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: "min(44em, 92%)", boxSizing: "border-box", padding: "1.9em 2.2em 1.8em", borderRadius: "1.2em",
          background: "linear-gradient(180deg, rgba(20,18,24,.96), rgba(10,10,14,.97))", border: "1px solid rgba(255,255,255,.08)",
          boxShadow: "0 2em 6em rgba(0,0,0,.6)" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "1em" }}>
          <div>
            <p style={{ margin: 0, fontFamily: MONO, fontSize: ".85em", letterSpacing: ".26em", textTransform: "uppercase", color: accento }}>come si sente</p>
            <h2 style={{ margin: ".2em 0 0", fontFamily: SERIF, fontWeight: 500, fontSize: "2em", color: "#f4ece0", letterSpacing: "-.01em" }}>La voce</h2>
          </div>
          <button onClick={onChiudi} aria-label="Chiudi"
            style={{ cursor: "pointer", flexShrink: 0, border: "1px solid rgba(255,255,255,.16)", background: "transparent", color: "#c9d2de", borderRadius: 999,
              fontFamily: MONO, fontSize: ".85em", letterSpacing: ".14em", textTransform: "uppercase", padding: ".6em 1.1em" }}>chiudi ✕</button>
        </div>

        <fieldset style={{ margin: "1.4em 0 0", padding: 0, border: "none", display: "grid", gap: ".7em" }}>
          <legend style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Modo</legend>
          {MODI.map((m) => {
            const scelto = imp.modo === m.modo;
            return (
              <label key={m.modo} style={{ cursor: "pointer", display: "flex", gap: ".9em", alignItems: "flex-start", padding: ".9em 1em", borderRadius: ".8em",
                background: scelto ? "rgba(255,255,255,.05)" : "rgba(255,255,255,.02)", border: `1px solid ${scelto ? accento : "rgba(255,255,255,.07)"}` }}>
                <input type="radio" name="modo-voce" checked={scelto} onChange={() => onCambia({ ...imp, modo: m.modo })}
                  style={{ marginTop: ".3em", accentColor: accento, width: "1.1em", height: "1.1em" }} />
                <span>
                  <span style={{ display: "block", fontFamily: DISPLAY, fontWeight: 600, fontSize: "1.05em", color: "#f1f3f7" }}>{m.titolo}</span>
                  <span style={{ display: "block", marginTop: ".35em", fontFamily: SERIF, fontSize: ".95em", lineHeight: 1.45, color: "rgba(226,220,208,.78)" }}>{m.testo}</span>
                </span>
              </label>
            );
          })}
        </fieldset>

        <div style={{ marginTop: "1.3em", display: "flex", alignItems: "center", gap: "1em", opacity: recitata ? 1 : 0.45 }}>
          <label htmlFor="volume-voce" style={{ fontFamily: MONO, fontSize: ".85em", letterSpacing: ".18em", textTransform: "uppercase", color: "#c9d2de" }}>volume</label>
          <input id="volume-voce" type="range" min={0} max={100} step={5} disabled={!recitata}
            value={Math.round(imp.volume * 100)} onChange={(e) => onCambia({ ...imp, volume: Number(e.target.value) / 100 })}
            aria-valuetext={`${Math.round(imp.volume * 100)} per cento`}
            style={{ flex: 1, accentColor: accento }} />
          <span style={{ fontFamily: MONO, fontSize: ".9em", color: "#e6e0d6", minWidth: "3em", textAlign: "right" }}>{Math.round(imp.volume * 100)}%</span>
        </div>

        <div style={{ marginTop: "1.3em", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1em" }}>
          <p style={{ margin: 0, fontFamily: SERIF, fontStyle: "italic", fontSize: ".92em", color: "rgba(226,220,208,.6)" }}>
            F2 ridice l'ultimo testo. Le risposte di un dialogo si sentono passandoci sopra.
          </p>
          <button className="vg-bottone vg-piccolo" onClick={onRiascolta} disabled={!recitata} style={{ whiteSpace: "nowrap", flexShrink: 0 }}>↻ riascolta</button>
        </div>
      </div>
    </div>
  );
}
