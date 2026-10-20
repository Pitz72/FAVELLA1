// ====================================================================
//  Se qualcosa si rompe mentre si disegna, niente schermo nero.
// --------------------------------------------------------------------
//  Avvolge le fasi dell'app (loghi, avviso, trailer, gioco). Un errore di
//  disegno in una di esse viene scritto nel registro tecnico e sostituito da
//  un messaggio con un pulsante «torna all'intro»: chi gioca non resta davanti
//  a un nero senza uscita.
//
//  Gli errori che non passano dal disegno di React (gestori di eventi, timer,
//  promesse rifiutate) non fanno uno schermo d'errore: il gioco può continuare, e
//  spesso sono innocui (un play() dell'audio rifiutato, un ResizeObserver). Ma si
//  scrivono nel registro tecnico (registraErroriGlobali), perché se qualcosa va
//  storto se ne trovi traccia.
// ====================================================================
import { Component, type ErrorInfo, type ReactNode } from "react";
import { annota } from "../lib/desktop";

interface Props { onTorna: () => void; children: ReactNode }
interface Stato { errore: Error | null }

// Eccezioni del browser che non indicano un guasto: l'audio che parte senza un gesto dell'utente, una riproduzione interrotta.
const INNOCUI = new Set(["NotAllowedError", "AbortError"]);

/** Scrive nel registro tecnico gli errori non presi (window «error» e «unhandledrejection») senza toccare ciò che si vede.
 *  Lo stesso errore si scrive una volta ogni 5 s (con quante volte si è ripetuto) e al massimo 200 righe a sessione:
 *  un errore in un ciclo di disegno non deve riempire il registro. Restituisce come smettere. */
export function registraErroriGlobali(): () => void {
  const visti = new Map<string, { quando: number; ripetuti: number }>();
  let scritti = 0;
  const scrivi = (livello: "warn" | "error", testo: string) => {
    const chiave = testo.slice(0, 300), ora = Date.now(), v = visti.get(chiave);
    if (v && ora - v.quando < 5000) { v.ripetuti++; return; }
    if (scritti >= 200) return;
    scritti++;
    visti.set(chiave, { quando: ora, ripetuti: 0 });
    annota(livello, testo.slice(0, 2000) + (v?.ripetuti ? `\n(ripetuto altre ${v.ripetuti} volte)` : ""));
  };
  // preventDefault: il browser non ripete l'errore in console («Uncaught …»). Nel desktop la console
  // finisce già nel registro tecnico (main.cjs): senza, lo stesso errore vi comparirebbe due volte. Nel
  // browser lo stesso testo esce da `annota` in console, una volta sola.
  const suErrore = (ev: ErrorEvent) => {
    ev.preventDefault();
    const benigno = /^ResizeObserver loop/.test(ev.message);
    const dove = ev.filename ? ` (${ev.filename}:${ev.lineno}:${ev.colno})` : "";
    scrivi(benigno ? "warn" : "error", `errore non preso${benigno ? " (innocuo)" : ""}: ${ev.message}${dove}\n${ev.error instanceof Error ? ev.error.stack ?? "" : ""}`);
  };
  const suRifiuto = (ev: PromiseRejectionEvent) => {
    ev.preventDefault();
    const r = ev.reason;
    const benigno = r instanceof Error && INNOCUI.has(r.name);
    const testo = r instanceof Error ? `${r.name}: ${r.message}\n${r.stack ?? ""}` : String(r);
    scrivi(benigno ? "warn" : "error", `promessa rifiutata${benigno ? " (innocua)" : ""}: ${testo}`);
  };
  window.addEventListener("error", suErrore);
  window.addEventListener("unhandledrejection", suRifiuto);
  return () => { window.removeEventListener("error", suErrore); window.removeEventListener("unhandledrejection", suRifiuto); };
}

export default class ConfineErrori extends Component<Props, Stato> {
  state: Stato = { errore: null };

  static getDerivedStateFromError(errore: Error): Stato { return { errore }; }

  private smetti: (() => void) | null = null;
  componentDidMount() { this.smetti = registraErroriGlobali(); }
  componentWillUnmount() { this.smetti?.(); this.smetti = null; }

  componentDidCatch(errore: Error, info: ErrorInfo) {
    annota("error", `errore di disegno: ${errore.message}\n${info.componentStack ?? ""}`);
  }

  render() {
    const { errore } = this.state;
    if (!errore) return this.props.children;
    return (
      <div role="alert" style={{ position: "fixed", inset: 0, zIndex: 100, background: "#07070a", color: "#e9e2d6", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 14, padding: "0 8vw", textAlign: "center" }}>
        <h1 style={{ margin: 0, fontFamily: "'Lora', Georgia, serif", fontWeight: 500, fontSize: "clamp(24px, 2.4vw, 40px)", color: "#f4ece0" }}>
          Qualcosa si è inceppato.
        </h1>
        <p style={{ margin: 0, maxWidth: "36rem", fontFamily: "'Lora', Georgia, serif", fontStyle: "italic", fontSize: "clamp(16px, 1.3vw, 22px)", lineHeight: 1.55, color: "rgba(230,223,210,.78)" }}>
          La schermata non si è potuta disegnare. Il viaggio salvato non è toccato: torna all'intro e riprendi da lì.
        </p>
        <p style={{ margin: 0, maxWidth: "44rem", fontFamily: "'Source Code Pro', ui-monospace, monospace", fontSize: 12.5, color: "rgba(200,208,220,.72)", overflowWrap: "anywhere" }}>
          {errore.message || String(errore)}
        </p>
        <button autoFocus onClick={this.props.onTorna}
          style={{ marginTop: 10, cursor: "pointer", fontFamily: "'Source Code Pro', ui-monospace, monospace", fontSize: 13, letterSpacing: ".16em", textTransform: "uppercase",
            color: "#e6e0d6", border: "1px solid rgba(255,255,255,.32)", background: "rgba(10,10,14,.5)", borderRadius: 999, padding: "10px 20px" }}>
          ← torna all'intro
        </button>
      </div>
    );
  }
}
