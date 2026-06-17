import { useState, useEffect, useRef, type ReactNode } from "react";
import { VERSION } from "../constants";

const CODE = `La Grotta di Cristallo è una stanza.
La descrizione della grotta è "Stalattiti luminose pendono dal soffitto.".
Una spada antica è una cosa.
La spada antica è nella grotta.
La spada antica è prendibile.
Invece di prendi la spada antica: dire "La lama emette un debole ronzio." e adesso la spada antica è in inventario.`;

const GAME = [
  { p: "> guarda", k: "cmd" },
  { p: "Grotta di Cristallo", k: "room" },
  { p: "Stalattiti luminose pendono dal soffitto.", k: "desc" },
  { p: "Puoi vedere qui: una spada antica.", k: "desc" },
  { p: "> prendi spada antica", k: "cmd" },
  { p: "La lama emette un debole ronzio.", k: "say" },
  { p: "Preso: spada antica.", k: "ok" },
];

// --- mini evidenziatore di sintassi FAVELLA ---
const KW = new Set([
  "è", "una", "un", "uno", "stanza", "cosa", "di", "del", "della", "dello",
  "nella", "nel", "sul", "sulla", "in", "prendibile", "chiusa", "aperta",
  "collega", "nord", "sud", "est", "ovest", "se", "dire", "ha", "adesso", "e",
  "invece", "descrizione", "giocatore", "inventario",
]);
const TOK = /("[^"]*"?)|([A-Za-zÀ-ÿ0-9']+)|(\s+)|([^\sA-Za-zÀ-ÿ0-9'"]+)/g;

function Highlight({ src }: { src: string }) {
  const out: ReactNode[] = [];
  let m: RegExpExecArray | null;
  TOK.lastIndex = 0;
  let i = 0;
  while ((m = TOK.exec(src))) {
    if (m[1]) out.push(<span key={i} className="text-favella-emerald">{m[1]}</span>);
    else if (m[2]) out.push(<span key={i} className={KW.has(m[2].toLowerCase()) ? "text-favella-cyan" : "text-favella-text-primary"}>{m[2]}</span>);
    else if (m[3]) out.push(<span key={i}>{m[3]}</span>);
    else out.push(<span key={i} className="text-favella-amber/90">{m[4]}</span>);
    i++;
  }
  return <>{out}</>;
}

type Phase = "writing" | "compiling" | "playing";
const STEPS: { id: Phase; label: string }[] = [
  { id: "writing", label: "Scrivi" },
  { id: "compiling", label: "Compila" },
  { id: "playing", label: "Gioca" },
];

const TerminalDemo = () => {
  const [phase, setPhase] = useState<Phase>("writing");
  const [code, setCode] = useState("");
  const [log, setLog] = useState<typeof GAME>([]);
  const [progress, setProgress] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Fase 1 — digitazione
  useEffect(() => {
    if (phase !== "writing") return;
    setCode("");
    let i = 0;
    let to: ReturnType<typeof setTimeout>;
    const id = setInterval(() => {
      i++;
      setCode(CODE.slice(0, i));
      if (i >= CODE.length) {
        clearInterval(id);
        to = setTimeout(() => setPhase("compiling"), 900);
      }
    }, 22);
    return () => {
      clearInterval(id);
      clearTimeout(to);
    };
  }, [phase]);

  // Fase 2 — compilazione (transizione a tempo, fuori dagli updater = StrictMode-safe)
  useEffect(() => {
    if (phase !== "compiling") return;
    setProgress(0);
    const id = setInterval(() => {
      setProgress((p) => Math.min(100, p + 4));
    }, 34);
    const to = setTimeout(() => setPhase("playing"), 1250);
    return () => {
      clearInterval(id);
      clearTimeout(to);
    };
  }, [phase]);

  // Fase 3 — gioco
  useEffect(() => {
    if (phase !== "playing") return;
    setLog([]);
    let i = 0;
    let to: ReturnType<typeof setTimeout>;
    const id = setInterval(() => {
      const item = GAME[i];
      if (item) {
        setLog((prev) => [...prev, item]);
        i++;
      } else {
        clearInterval(id);
        to = setTimeout(() => setPhase("writing"), 3800);
      }
    }, 850);
    return () => {
      clearInterval(id);
      clearTimeout(to);
    };
  }, [phase]);

  // autoscroll
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [code, log]);

  const activeIdx = STEPS.findIndex((s) => s.id === phase);

  return (
    <div className="w-full max-w-xl mx-auto perspective-1000">
      <div className="relative glass rounded-2xl overflow-hidden shadow-glow-card glow-border transition-transform duration-500 hover:-translate-y-1">
        {/* alone */}
        <div className="absolute -inset-px rounded-2xl bg-brand-gradient opacity-[0.06] pointer-events-none" />

        {/* Chrome */}
        <div className="relative bg-favella-void/70 px-4 py-2.5 flex items-center justify-between border-b border-favella-cyan/10">
          <div className="flex gap-2">
            <span className="w-3 h-3 rounded-full bg-favella-flame/80" />
            <span className="w-3 h-3 rounded-full bg-favella-amber/80" />
            <span className="w-3 h-3 rounded-full bg-favella-emerald/80" />
          </div>
          <div className="text-[11px] font-mono text-favella-text-secondary">
            {phase === "writing" ? "storia.fav" : phase === "compiling" ? "compilatore" : "interprete"}
          </div>
        </div>

        {/* Stepper */}
        <div className="relative flex items-center justify-center gap-2 px-4 py-2 border-b border-favella-cyan/5 bg-favella-void/30">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center">
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full transition-colors duration-300 ${
                  idx === activeIdx
                    ? "bg-favella-cyan/15 text-favella-cyan"
                    : idx < activeIdx
                    ? "text-favella-emerald"
                    : "text-favella-text-muted"
                }`}
              >
                {idx < activeIdx ? "✓ " : ""}{s.label}
              </span>
              {idx < STEPS.length - 1 && (
                <span className={`mx-1 w-5 h-px ${idx < activeIdx ? "bg-favella-emerald/50" : "bg-favella-text-muted/30"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Corpo */}
        <div ref={bodyRef} className="h-80 p-5 font-mono text-[13px] md:text-sm overflow-y-auto scrollbar-hide relative">
          {phase === "writing" && (
            <pre className="whitespace-pre-wrap leading-relaxed">
              <Highlight src={code} />
              <span className="inline-block w-2 h-4 bg-favella-amber align-middle ml-0.5 animate-caret-blink shadow-glow-amber" />
            </pre>
          )}

          {phase === "compiling" && (
            <div className="flex flex-col items-center justify-center h-full gap-5">
              <div className="w-12 h-12 rounded-full border-2 border-favella-cyan/20 border-t-favella-cyan animate-spin" />
              <p className="text-favella-text-secondary text-sm">Compilazione del mondo…</p>
              <div className="w-48 h-1.5 rounded-full bg-favella-void overflow-hidden">
                <div className="h-full bg-brand-gradient transition-[width] duration-75" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[11px] font-mono text-favella-text-muted">parser LALR(1) · 0 ambiguità</p>
            </div>
          )}

          {phase === "playing" && (
            <div className="space-y-2.5">
              {log.filter(Boolean).map((l, idx) => (
                <div
                  key={idx}
                  className={
                    l.k === "cmd"
                      ? "text-favella-text-muted mt-3"
                      : l.k === "room"
                      ? "text-favella-cyan font-display font-semibold"
                      : l.k === "say"
                      ? "text-favella-text-primary font-serif italic"
                      : l.k === "ok"
                      ? "text-favella-emerald"
                      : "text-favella-text-secondary"
                  }
                >
                  {l.p}
                </div>
              ))}
              <div className="mt-2 flex items-center">
                <span className="text-favella-cyan mr-1">{">"}</span>
                <span className="inline-block w-2 h-4 bg-favella-amber align-middle animate-caret-blink" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-favella-void/60 px-4 py-1.5 border-t border-favella-cyan/10 flex justify-between text-[10px] font-mono text-favella-text-muted uppercase tracking-wider">
          <span>Favella Core v{VERSION}</span>
          <span className={phase === "playing" ? "text-favella-emerald" : "text-favella-text-muted"}>
            {phase === "playing" ? "● in gioco" : phase === "compiling" ? "◐ build" : "○ editor"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TerminalDemo;
