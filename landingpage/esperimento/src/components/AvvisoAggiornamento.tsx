// ====================================================================
//  L'avviso dell'aggiornamento automatico (solo desktop).
// --------------------------------------------------------------------
//  Discreto, in basso a sinistra, sopra tutto: mentre la nuova versione si
//  scarica dice quanto manca; quando è pronta offre «riavvia ora» (altrimenti
//  si installa da sé alla chiusura). Si può chiudere; torna solo per un
//  aggiornamento diverso.
// ====================================================================
import { useEffect, useState } from "react";
import { installaAggiornamento, seguiAggiornamento, type StatoAggiornamento } from "../lib/desktop";

const MONO = "'Source Code Pro', ui-monospace, monospace";
const SERIF = "'Lora', Georgia, serif";

export default function AvvisoAggiornamento() {
  const [stato, setStato] = useState<StatoAggiornamento>({ stato: "fermo" });
  const [chiuso, setChiuso] = useState<string | null>(null);
  useEffect(() => seguiAggiornamento(setStato), []);

  if (stato.stato === "fermo" || chiuso === `${stato.stato}:${stato.versione}`) return null;
  const pronto = stato.stato === "pronto";

  return (
    <div role="status" style={{ position: "fixed", left: 24, bottom: 24, zIndex: 100, display: "flex", alignItems: "center", gap: 16,
      padding: "12px 14px 12px 18px", borderRadius: 14, background: "rgba(14,13,18,.92)", border: "1px solid rgba(240,183,126,.35)",
      boxShadow: "0 12px 40px rgba(0,0,0,.5)", backdropFilter: "blur(6px)", animation: "kf-launch .5s ease both" }}>
      <div>
        <p style={{ margin: 0, fontFamily: MONO, fontSize: 10, letterSpacing: ".24em", textTransform: "uppercase", color: "#f0b77e" }}>
          {pronto ? "aggiornamento pronto" : "aggiornamento in arrivo"}
        </p>
        <p style={{ margin: "3px 0 0", fontFamily: SERIF, fontSize: 14, color: "#efe8dc" }}>
          Il Viaggiatore {stato.versione}
          {pronto ? " · si installa alla chiusura" : stato.percento != null ? ` · ${stato.percento}%` : " · si scarica"}
        </p>
      </div>
      {pronto && (
        <button onClick={installaAggiornamento} style={{ cursor: "pointer", border: "none", borderRadius: 999, padding: "8px 14px",
          background: "#f0b77e", color: "#140c06", fontFamily: MONO, fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase" }}>
          riavvia ora
        </button>
      )}
      <button aria-label="Chiudi l'avviso" onClick={() => setChiuso(`${stato.stato}:${stato.versione}`)}
        style={{ cursor: "pointer", border: "none", background: "transparent", color: "rgba(239,232,220,.5)", fontSize: 16, padding: 4 }}>✕</button>
    </div>
  );
}
