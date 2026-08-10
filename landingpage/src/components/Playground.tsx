import { useEffect, useRef, useState } from "react";
import BrandMark from "./BrandMark";
import { avviaGiocoDaSorgente, avviaValidatore } from "../lib/favellaRuntime";
import type { SessioneGioco, TurnoEsito } from "../lib/favellaRuntime";

// ====================================================================
//  «Programma con FAVELLA 1» — il playground del sito (LOGICA INTOCCATA).
//  A sinistra scrivi la storia, a destra la giochi: il sorgente viene
//  compilato DAVVERO dal motore Python nel browser (Pyodide), lo stesso
//  delle cassette-gioco del corso. Niente salvataggio automatico: la
//  storia si porta via e si riporta con «Scarica .fav» / «Apri .fav».
//  La vetrina del redesign (ProgramPage) lo monta in overlay immersivo.
// ====================================================================

type Riga = { kind: "out" | "cmd" | "sys" | "err"; text: string };

// Storia di partenza: piccola ma completa (due stanze, un oggetto, una
// regola con vittoria). Compila e si vince in due mosse: il primo
// «Compila e gioca» deve riuscire sempre.
const TEMPLATE = `La cucina è una stanza.
La descrizione della cucina è "Una cucina piccola e ordinata. Dalla finestra si vede il giardino, a nord.".
Il giardino è una stanza.
La descrizione del giardino è "Erba alta, un vecchio melo, il ronzio delle api.".
La cucina collega nord a il giardino.
Il giocatore comincia in cucina.

La mela è una cosa.
La descrizione della mela è "Rossa, lucida, ancora attaccata al ramo più basso.".
La mela è in giardino.
La mela è prendibile.

Invece di prendi la mela: dire "La stacchi dal ramo. Era l'ultima della stagione." e adesso vinci.
`;

const Playground = ({ onExit }: { onExit: () => void }) => {
  const [sorgente, setSorgente] = useState(TEMPLATE);
  const [fase, setFase] = useState<"pronto" | "caricamento" | "gioco" | "rotto">("pronto");
  const [statoCarico, setStatoCarico] = useState("");
  const [righe, setRighe] = useState<Riga[]>([]);
  const [bozza, setBozza] = useState("");
  const [finita, setFinita] = useState(false);
  const [modificato, setModificato] = useState(false);

  const sessioneRef = useRef<SessioneGioco | null>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const cmdRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Niente autosalvataggio (scelta deliberata): ma se chiudi la scheda con
  // modifiche non scaricate, il browser ti avvisa. È solo una guardia.
  useEffect(() => {
    if (!modificato) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [modificato]);

  useEffect(() => {
    screenRef.current?.scrollTo({ top: screenRef.current.scrollHeight, behavior: "smooth" });
  }, [righe, fase]);

  const applica = (cmd: string, esito: TurnoEsito) => {
    setRighe((r) => [...r, { kind: "cmd", text: cmd }, { kind: "out", text: esito.text.trim() }]);
    if (!esito.continua || esito.stato !== "in_corso") setFinita(true);
  };

  const compilaEGioca = async () => {
    setFase("caricamento");
    setFinita(false);
    setRighe([]);
    try {
      // 1. Diagnostica strutturata (la stessa dell'IDE): errori VERI del
      //    compilatore, con la riga. Se la storia non compila ci si ferma qui.
      const validatore = await avviaValidatore(setStatoCarico);
      const verdetto = validatore.valida(sorgente);
      if (!verdetto.ok) {
        setRighe([
          { kind: "err", text: "La storia non compila:" },
          ...verdetto.errors.map((e): Riga => ({ kind: "err", text: " - " + e })),
        ]);
        setFase("gioco");
        setFinita(true);
        return;
      }

      // 2. Compila e avvia la partita vera.
      const sess = await avviaGiocoDaSorgente(sorgente, setStatoCarico);
      sessioneRef.current = sess;
      const esito = sess.boot();
      if (esito.stato === "errore") {
        setRighe([{ kind: "err", text: esito.text.trim() }]);
        setFase("gioco");
        setFinita(true);
        return;
      }
      setRighe([
        { kind: "sys", text: "Compilato dal motore FAVELLA. La partita comincia." },
        // Gli avvisi non bloccano, ma all'autore servono (oggetti mai collocati…).
        ...verdetto.warnings.map((w): Riga => ({ kind: "sys", text: "Avviso: " + w })),
        { kind: "out", text: esito.text.trim() },
      ]);
      setFase("gioco");
      setTimeout(() => cmdRef.current?.focus(), 50);
    } catch (e) {
      setStatoCarico(e instanceof Error ? e.message : String(e));
      setFase("rotto");
    }
  };

  const invia = () => {
    const cmd = bozza.trim();
    if (!cmd || finita || !sessioneRef.current) return;
    setBozza("");
    applica(cmd, sessioneRef.current.step(cmd));
  };

  const scarica = () => {
    const blob = new Blob([sorgente], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "storia.fav";
    a.click();
    URL.revokeObjectURL(url);
    setModificato(false);
  };

  const apri = async (file: File | undefined) => {
    if (!file) return;
    const testo = await file.text();
    // I .fav sono LF per convenzione: normalizza eventuali fine-riga Windows.
    setSorgente(testo.replace(/\r\n?/g, "\n"));
    setModificato(false);
    setFase("pronto");
    setRighe([]);
  };

  const daCapo = () => {
    if (modificato && !window.confirm("Ripartire dal modello? La storia attuale andrà persa (se ti serve, prima scaricala).")) return;
    setSorgente(TEMPLATE);
    setModificato(false);
    setFase("pronto");
    setRighe([]);
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Barra superiore (la pagina è a tutto schermo, senza sidebar del sito) */}
      <header className="sticky top-0 z-40 border-b border-favella-cyan/10 bg-favella-void/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          <button onClick={onExit} className="group flex items-center gap-3">
            <BrandMark size={34} glow={false} />
            <span className="font-mono text-xs tracking-[0.18em] text-favella-text-secondary transition-colors group-hover:text-favella-cyan">
              ← TORNA ALLA PAGINA
            </span>
          </button>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-favella-cyan">
            Il laboratorio
          </span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8">
      {/* Intestazione */}
      <div className="mb-6">
        <h1 className="mt-2 font-display text-3xl font-extrabold text-white md:text-4xl">
          Programma con FAVELLA 1
        </h1>
        <p className="mt-3 max-w-3xl text-favella-text-secondary">
          Qui sotto c'è il motore completo, quello vero: scrivi la storia in italiano a sinistra,
          premi <span className="font-mono text-favella-cyan">▶ Compila e gioca</span> e provala
          subito a destra. Quando sei soddisfatto, <strong>scarica il file .fav</strong>: si apre
          identico con il motore da riga di comando e con Favella Studio. Niente viene salvato nel
          browser: la tua storia è tua, e viaggia come file.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ----- Editor ----- */}
        <div className="flex flex-col rounded-2xl border border-favella-cyan/15 bg-favella-panel/60 p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="mr-auto font-mono text-xs text-favella-text-muted">
              storia.fav{modificato ? " · modificato" : ""}
            </span>
            <button
              onClick={() => fileRef.current?.click()}
              className="rounded-lg border border-favella-cyan/20 px-3 py-1.5 font-mono text-xs text-favella-text-secondary transition-colors hover:border-favella-cyan/50 hover:text-favella-cyan"
            >
              ⬆ Apri .fav
            </button>
            <button
              onClick={scarica}
              className="rounded-lg border border-favella-cyan/20 px-3 py-1.5 font-mono text-xs text-favella-text-secondary transition-colors hover:border-favella-cyan/50 hover:text-favella-cyan"
            >
              ⬇ Scarica .fav
            </button>
            <button
              onClick={daCapo}
              className="rounded-lg border border-favella-cyan/20 px-3 py-1.5 font-mono text-xs text-favella-text-secondary transition-colors hover:border-favella-cyan/50 hover:text-favella-cyan"
            >
              ↺ Modello
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".fav,text/plain"
              className="hidden"
              onChange={(e) => {
                void apri(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
          <textarea
            value={sorgente}
            onChange={(e) => {
              setSorgente(e.target.value);
              setModificato(true);
            }}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="min-h-[420px] flex-1 resize-y rounded-xl border border-favella-cyan/15 bg-favella-void/90 p-4 font-mono text-[14px] leading-relaxed text-favella-text-primary caret-favella-cyan outline-none focus:border-favella-cyan/40"
          />
          <button
            onClick={() => void compilaEGioca()}
            disabled={fase === "caricamento"}
            className="mt-3 rounded-xl border border-favella-cyan/40 bg-favella-cyan/10 px-5 py-3 font-medium text-favella-cyan transition-all hover:bg-favella-cyan hover:text-favella-dark disabled:cursor-wait disabled:opacity-60"
          >
            {fase === "caricamento" ? "Compilazione…" : "▶ Compila e gioca"}
          </button>
        </div>

        {/* ----- Terminale di gioco ----- */}
        <div className="flex flex-col rounded-2xl border border-favella-cyan/15 bg-favella-panel/60 p-3">
          <div
            ref={screenRef}
            className="crt-screen h-[clamp(320px,56vh,640px)] overflow-y-auto rounded-xl border border-favella-cyan/15 bg-favella-void/95 px-5 py-4 font-mono text-[14px] leading-relaxed"
          >
            {fase === "pronto" && (
              <div className="flex h-full flex-col items-center justify-center text-center text-favella-text-muted">
                <p className="text-favella-cyan screen-glow">PRONTO.</p>
                <p className="mt-2 max-w-sm text-sm">
                  Scrivi (o incolla) la tua storia a sinistra e premi «▶ Compila e gioca». La prima
                  volta il motore impiega qualche secondo a caricarsi: gira tutto qui, nel tuo
                  browser.
                </p>
              </div>
            )}

            {fase === "caricamento" && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <p className="text-favella-cyan screen-glow">CARICAMENTO DEL MOTORE…</p>
                <p className="mt-2 max-w-sm text-sm text-favella-text-secondary">{statoCarico}</p>
                <div className="mt-5 h-3 w-64 max-w-[80%] overflow-hidden rounded border border-favella-cyan/30 bg-favella-panel/60">
                  <div className="h-full w-1/3 animate-marquee bg-gradient-to-r from-transparent via-favella-cyan to-transparent" />
                </div>
              </div>
            )}

            {fase === "rotto" && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <p className="text-favella-flame screen-glow">MOTORE NON DISPONIBILE</p>
                <p className="mt-2 max-w-md text-sm text-favella-text-secondary">{statoCarico}</p>
                <p className="mt-2 text-xs text-favella-text-muted">
                  Serve una connessione per caricare l'interprete la prima volta. Riprova.
                </p>
              </div>
            )}

            {fase === "gioco" &&
              righe.map((r, i) =>
                r.kind === "cmd" ? (
                  <p key={i} className="mt-3 text-favella-cyan">
                    <span className="text-favella-emerald">&gt;</span> {r.text}
                  </p>
                ) : r.kind === "sys" ? (
                  <p key={i} className="my-2 text-favella-amber/90 screen-glow">
                    » {r.text}
                  </p>
                ) : r.kind === "err" ? (
                  <pre
                    key={i}
                    className="whitespace-pre-wrap break-words text-favella-flame/90"
                  >
                    {r.text}
                  </pre>
                ) : (
                  <pre key={i} className="whitespace-pre-wrap break-words text-favella-text-primary/90">
                    {r.text}
                  </pre>
                )
              )}

            {fase === "gioco" && finita && (
              <p className="mt-4 border-t border-favella-cyan/10 pt-3 text-xs text-favella-text-muted">
                Partita conclusa. Modifica la storia a sinistra e premi di nuovo «▶ Compila e
                gioca».
              </p>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-xl border border-favella-cyan/15 bg-favella-void/60 px-4 py-2.5 font-mono">
            <span className="text-favella-emerald">.fav&gt;</span>
            <input
              ref={cmdRef}
              value={bozza}
              onChange={(e) => setBozza(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && invia()}
              disabled={fase !== "gioco" || finita}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              placeholder={
                fase === "gioco" && !finita
                  ? "scrivi un comando (guarda, nord, prendi la mela…) e premi Invio"
                  : "prima compila la storia"
              }
              className="flex-1 bg-transparent text-favella-text-primary caret-favella-cyan outline-none placeholder:text-favella-text-muted/60 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      <p className="mt-5 text-center font-mono text-xs text-favella-text-muted">
        motore FAVELLA v1.0.0 reale nel browser · il file .fav scaricato si apre con la CLI favella1
      </p>
      </div>
    </div>
  );
};

export default Playground;
