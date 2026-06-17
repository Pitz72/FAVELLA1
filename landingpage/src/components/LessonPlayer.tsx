import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Lesson, LessonBlock, CheckpointBlock } from "../data/course";
import { baseDiCheckpoint } from "../data/course";
import { avviaValidatore } from "../lib/favellaRuntime";
import type { Validatore } from "../lib/favellaRuntime";

type MotoreStato = "spento" | "caricamento" | "pronto" | "errore";

// --------------------------------------------------------------------
//  Verifica «guidata»: confronto normalizzato della riga digitata.
//  Tollerante su spazi, maiuscole e apostrofi tipografici; ma il PUNTO
//  finale lo pretende (è la lezione del capitolo 2) con un avviso mirato.
// --------------------------------------------------------------------
const normalizza = (s: string) =>
  s.trim().replace(/\s+/g, " ").replace(/[‘’ʼ`´]/g, "'").toLowerCase();

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Cadenza di rivelazione per tipo di blocco (ms).
const cadenza = (b?: LessonBlock) =>
  !b ? 0 : b.tipo === "sistema" ? 460 : b.tipo === "codice" ? 320 : b.tipo === "tranello" ? 560 : 380;

const Reel = ({ spinning }: { spinning: boolean }) => (
  <span
    className={`relative inline-flex h-6 w-6 items-center justify-center rounded-full border border-favella-cyan/40 bg-favella-void ${
      spinning ? "reel-spin" : ""
    }`}
  >
    <span className="absolute h-2.5 w-2.5 rounded-full bg-favella-cyan/30" />
    <span className="absolute h-0.5 w-5 bg-favella-cyan/30" />
    <span className="absolute h-5 w-0.5 bg-favella-cyan/30" />
  </span>
);

const LessonPlayer = ({ lesson, onExit }: { lesson: Lesson; onExit: () => void }) => {
  const blocchi = lesson.blocchi;
  const reduce = useMemo(prefersReducedMotion, []);

  const [phase, setPhase] = useState<"loading" | "playing">("loading");
  const [progress, setProgress] = useState(0);
  const [pageStart, setPageStart] = useState(0); // primo blocco mostrato nella pagina corrente
  const [rivelate, setRivelate] = useState(0); // blocchi rivelati (esclusivo)
  const [risolti, setRisolti] = useState<Record<number, string>>({});
  const [pausaPagina, setPausaPagina] = useState(false);
  const [bozza, setBozza] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [scossa, setScossa] = useState(false);

  // --- Esecuzione VERA dei checkpoint (Fase 2): il motore FAVELLA compila la
  //     riga digitata. Caricamento pigro in background; se non è pronto (o
  //     fallisce), si ricade sul confronto guidato senza intoppi. ---
  const [validatore, setValidatore] = useState<Validatore | null>(null);
  const [motoreStato, setMotoreStato] = useState<MotoreStato>("spento");
  const [esitiMotore, setEsitiMotore] = useState<Record<number, string>>({});

  const screenRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Fase di caricamento (rituale cassetta) ---
  useEffect(() => {
    if (phase !== "loading") return;
    if (reduce) {
      setProgress(100);
      const t = setTimeout(() => setPhase("playing"), 150);
      return () => clearTimeout(t);
    }
    let p = 0;
    const iv = setInterval(() => {
      p = Math.min(100, p + Math.random() * 16 + 6);
      setProgress(Math.round(p));
      if (p >= 100) {
        clearInterval(iv);
        setTimeout(() => setPhase("playing"), 420);
      }
    }, 150);
    return () => clearInterval(iv);
  }, [phase, reduce]);

  // --- Carica il motore in background appena la lezione ha dei checkpoint, così
  //     è pronto quando l'utente arriva a scrivere. Non blocca la lezione. ---
  useEffect(() => {
    const haCheckpoint = blocchi.some((b) => b.tipo === "checkpoint");
    if (!haCheckpoint) return;
    let annullato = false;
    setMotoreStato("caricamento");
    setValidatore(null);
    avviaValidatore(() => {})
      .then((v) => {
        if (!annullato) {
          setValidatore(v);
          setMotoreStato("pronto");
        }
      })
      .catch(() => {
        if (!annullato) setMotoreStato("errore");
      });
    return () => {
      annullato = true;
    };
  }, [lesson.id, blocchi]);

  const prossima = blocchi[rivelate];
  const finita = rivelate >= blocchi.length;
  const attesaCheckpoint = !finita && prossima?.tipo === "checkpoint" && risolti[rivelate] === undefined;
  const status: "loading" | "revealing" | "checkpoint" | "page" | "done" =
    phase !== "playing" ? "loading" : finita ? "done" : pausaPagina ? "page" : attesaCheckpoint ? "checkpoint" : "revealing";

  // --- Rivelazione automatica (una unità alla volta) ---
  useEffect(() => {
    if (status !== "revealing") return;
    const t = setTimeout(() => setRivelate((n) => n + 1), reduce ? 20 : cadenza(prossima));
    return () => clearTimeout(t);
  }, [status, rivelate, prossima, reduce]);

  // --- Paginazione: se la pagina trabocca il monitor, riavvolgi l'ultima
  //     unità e fermati con «premi Invio per continuare» (niente scroll). ---
  useLayoutEffect(() => {
    if (phase !== "playing" || pausaPagina) return;
    const el = screenRef.current;
    if (!el) return;
    if (el.scrollHeight > el.clientHeight + 6 && rivelate - 1 > pageStart) {
      setRivelate((r) => r - 1); // l'unità che sfora va alla pagina nuova
      setPausaPagina(true);
    }
  }, [rivelate, risolti, phase, pausaPagina, pageStart]);

  const continua = () => {
    setPageStart(rivelate);
    setPausaPagina(false);
  };

  // Tasto Invio per voltare pagina.
  useEffect(() => {
    if (status !== "page") return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        continua();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [status, rivelate]);

  // Autofocus sull'input quando si apre un checkpoint.
  useEffect(() => {
    if (status === "checkpoint") {
      setBozza("");
      setFeedback(null);
      inputRef.current?.focus();
    }
  }, [status, rivelate]);

  const scuoti = () => {
    setScossa(true);
    setTimeout(() => setScossa(false), 420);
  };

  // Compila la riga digitata col motore VERO, innestandola nel suo mondo-base.
  const compila = (cp: CheckpointBlock, riga: string) =>
    validatore?.valida([...baseDiCheckpoint(cp.attesa), riga.trim()].join("\n") + "\n") ?? null;

  const inviaCheckpoint = () => {
    if (prossima?.tipo !== "checkpoint") return;
    const cp = prossima;
    const ni = normalizza(bozza);
    const ne = normalizza(cp.attesa);
    const idx = rivelate;

    // 1. Riga giusta → la facciamo compilare DAVVERO dal motore e mostriamo il
    //    verdetto reale, poi avanziamo.
    if (ni === ne) {
      const r = compila(cp, bozza);
      const nota = r
        ? r.ok
          ? "✓ Compilato dal motore FAVELLA: la tua riga è codice valido."
          : "⚠ Il motore ha segnalato: " + (r.errors[0] ?? "errore")
        : null;
      setRisolti((s) => ({ ...s, [idx]: bozza.trim() }));
      if (nota) setEsitiMotore((s) => ({ ...s, [idx]: nota }));
      setFeedback(null);
      setRivelate((n) => n + 1);
      return;
    }

    // 2. Solo il punto finale mancante → l'avviso amichevole di sempre.
    if (!ni.endsWith(".") && normalizza(bozza + ".") === ne) {
      setFeedback("Ci sei quasi! In FAVELLA ogni frase finisce con un punto «.».");
      scuoti();
      return;
    }

    // 3. Riga diversa: se il motore è pronto e la rifiuta, mostriamo l'ERRORE
    //    VERO del compilatore (didattico). Altrimenti il suggerimento guidato.
    const r = compila(cp, bozza);
    if (r && !r.ok && r.errors.length) {
      setFeedback("Il motore non accetta la riga — " + r.errors[0]);
    } else {
      setFeedback(cp.suggerimento);
    }
    scuoti();
  };

  const riavvolgi = () => {
    setRivelate(0);
    setPageStart(0);
    setRisolti({});
    setEsitiMotore({});
    setPausaPagina(false);
    setProgress(0);
    setPhase("loading");
  };

  const renderUnita = (b: LessonBlock, i: number) => {
    if (b.tipo === "sistema")
      return (
        <p key={i} className="my-2 text-favella-amber/90 screen-glow">
          <span className="text-favella-amber/50">»</span> {b.testo}
        </p>
      );
    if (b.tipo === "codice")
      return (
        <pre
          key={i}
          className="my-3 whitespace-pre-wrap break-words border-l-2 border-favella-emerald/60 bg-favella-emerald/5 py-2 pl-3 pr-2 text-favella-emerald"
        >
          {b.righe.join("\n")}
        </pre>
      );
    if (b.tipo === "tranello")
      return (
        <p key={i} className="my-3 border-l-2 border-favella-flame/60 bg-favella-flame/5 py-2 pl-3 pr-2 text-favella-flame/90">
          <span className="font-semibold">ATTENZIONE — </span>
          {b.testo}
        </p>
      );
    if (b.tipo === "checkpoint") {
      const risposta = risolti[i];
      if (risposta !== undefined)
        return (
          <div key={i} className="my-3">
            <p className="text-favella-cyan/70">{"> " + b.consegna}</p>
            <pre className="mt-1 whitespace-pre-wrap break-words border-l-2 border-favella-emerald/60 bg-favella-emerald/5 py-1.5 pl-3 pr-2 text-favella-emerald">
              {risposta}
            </pre>
            <p className="mt-1 text-favella-emerald/90 screen-glow">{b.esito}</p>
            {esitiMotore[i] && (
              <p className="mt-0.5 font-mono text-[12px] text-favella-cyan/80">{esitiMotore[i]}</p>
            )}
          </div>
        );
      return null;
    }
    return (
      <p key={i} className="my-2 text-favella-text-primary/90">
        {b.testo}
      </p>
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col" style={{ height: "min(82vh, 760px)" }}>
      {/* Cornice del monitor */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-[1.4rem] border-[3px] border-favella-brace/80 bg-favella-panel/80 p-2 shadow-glow-card md:p-3">
        {/* Mangianastri: barra superiore con bobine */}
        <div className="flex items-center justify-between rounded-t-xl border border-b-0 border-favella-cyan/15 bg-favella-panel/80 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <Reel spinning={status === "loading"} />
            <Reel spinning={status === "loading"} />
            <div className="ml-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-favella-cyan">
                Cassetta {String(lesson.numero).padStart(2, "0")}
              </p>
              <p className="font-display leading-tight text-favella-text-primary">{lesson.titolo}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {motoreStato !== "spento" && (
              <span
                title={
                  motoreStato === "pronto"
                    ? "Il motore FAVELLA compila davvero le tue risposte"
                    : motoreStato === "caricamento"
                    ? "Caricamento del motore FAVELLA…"
                    : "Motore non disponibile: verifica guidata"
                }
                className={`hidden items-center gap-1.5 font-mono text-[10px] sm:inline-flex ${
                  motoreStato === "pronto"
                    ? "text-favella-cyan"
                    : motoreStato === "caricamento"
                    ? "text-favella-amber"
                    : "text-favella-text-muted"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    motoreStato === "pronto"
                      ? "bg-favella-cyan"
                      : motoreStato === "caricamento"
                      ? "bg-favella-amber animate-pulse-slow"
                      : "bg-favella-text-muted"
                  }`}
                />
                MOTORE {motoreStato === "pronto" ? "PRONTO" : motoreStato === "caricamento" ? "…" : "OFF"}
              </span>
            )}
            <span className="hidden items-center gap-1.5 font-mono text-[10px] text-favella-text-muted sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-favella-emerald animate-pulse-slow" /> REC
            </span>
            <button
              onClick={onExit}
              className="rounded-lg border border-favella-cyan/20 px-3 py-1.5 font-mono text-xs text-favella-text-secondary transition-colors hover:border-favella-cyan/50 hover:text-favella-cyan"
            >
              ⏏ Espelli
            </button>
          </div>
        </div>

        {/* Schermo (overflow nascosto: si pagina, non si scrolla) */}
        <div
          ref={screenRef}
          className="crt-screen relative flex-1 overflow-hidden rounded-b-xl border border-favella-cyan/15 bg-favella-void/95 px-5 py-4 font-mono text-[15px] leading-relaxed md:px-7 md:text-[16px]"
        >
          {status === "loading" ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-favella-cyan screen-glow">INSERISCI CASSETTA {String(lesson.numero).padStart(2, "0")}</p>
              <p className="mt-2 text-favella-text-secondary">CARICAMENTO “{lesson.titolo}”…</p>
              <div className="mt-5 h-3 w-64 max-w-[80%] overflow-hidden rounded border border-favella-cyan/30 bg-favella-panel/60">
                <div
                  className="h-full bg-gradient-to-r from-favella-cyan-dark to-favella-cyan transition-[width] duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-favella-text-muted">{progress}%</p>
            </div>
          ) : (
            <>
              {blocchi.slice(pageStart, rivelate).map((b, k) => renderUnita(b, pageStart + k))}

              {/* Checkpoint attivo */}
              {status === "checkpoint" && prossima?.tipo === "checkpoint" && (
                <div className={scossa ? "animate-shake" : ""}>
                  <p className="text-favella-cyan screen-glow">{"> " + prossima.consegna}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-favella-emerald">.fav&gt;</span>
                    <input
                      ref={inputRef}
                      value={bozza}
                      onChange={(e) => setBozza(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && inviaCheckpoint()}
                      spellCheck={false}
                      autoCapitalize="off"
                      autoCorrect="off"
                      placeholder="scrivi qui la tua frase e premi Invio"
                      className="flex-1 border-b border-favella-cyan/30 bg-transparent pb-1 text-favella-text-primary caret-favella-cyan outline-none placeholder:text-favella-text-muted/60 focus:border-favella-cyan"
                    />
                  </div>
                  {feedback && <p className="mt-2 text-favella-flame/90">↳ {feedback}</p>}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={inviaCheckpoint}
                      className="rounded-lg border border-favella-cyan/40 bg-favella-cyan/15 px-4 py-1.5 text-sm font-medium text-favella-cyan transition-colors hover:bg-favella-cyan hover:text-favella-dark"
                    >
                      Esegui (Invio)
                    </button>
                    <button
                      onClick={() => setBozza(prossima.attesa)}
                      className="rounded-lg border border-favella-text-secondary/20 px-4 py-1.5 text-sm text-favella-text-secondary transition-colors hover:text-favella-text-primary"
                    >
                      Mostrami la riga
                    </button>
                  </div>
                </div>
              )}

              {/* Cursore che scorre */}
              {status === "revealing" && (
                <span className="inline-block h-4 w-2.5 translate-y-0.5 bg-favella-cyan animate-caret-blink" />
              )}

              {/* Pausa di pagina (niente scroll: si volta pagina) */}
              {status === "page" && (
                <button
                  onClick={continua}
                  className="mt-3 inline-flex items-center gap-2 font-mono text-sm text-favella-cyan screen-glow animate-caret-blink"
                >
                  ▼ PREMI INVIO PER CONTINUARE
                </button>
              )}

              {/* Fine lezione */}
              {status === "done" && (
                <div className="mt-5 flex flex-wrap gap-3 border-t border-favella-cyan/10 pt-4">
                  <button
                    onClick={onExit}
                    className="rounded-xl border border-favella-cyan/30 bg-favella-cyan/10 px-5 py-2.5 font-medium text-favella-cyan transition-all hover:bg-favella-cyan hover:text-favella-dark"
                  >
                    ⏏ Torna allo scaffale
                  </button>
                  <button
                    onClick={riavvolgi}
                    className="rounded-xl border border-favella-text-secondary/20 px-5 py-2.5 text-favella-text-secondary transition-colors hover:text-favella-text-primary"
                  >
                    ↺ Riavvolgi
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <p className="mt-3 text-center font-mono text-xs text-favella-text-muted">
        {lesson.fonte} · {lesson.durata}
      </p>
    </div>
  );
};

export default LessonPlayer;
