import { useEffect, useRef, useState } from "react";
import type { GameCassette } from "../data/course";
import { avviaGioco } from "../lib/favellaRuntime";
import type { SessioneGioco, TurnoEsito } from "../lib/favellaRuntime";

type Riga = { kind: "out" | "cmd" | "sys"; text: string };

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

const GamePlayer = ({ game, onExit }: { game: GameCassette; onExit: () => void }) => {
  const [phase, setPhase] = useState<"loading" | "playing" | "errore">("loading");
  const [stato, setStato] = useState("Inserimento della cassetta…");
  const [righe, setRighe] = useState<Riga[]>([]);
  const [bozza, setBozza] = useState("");
  const [finita, setFinita] = useState(false);

  const sessioneRef = useRef<SessioneGioco | null>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Caricamento del runtime + boot dell'avventura.
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const sess = await avviaGioco(
          { gameId: game.gameId, entry: game.entry, files: game.files },
          (m) => vivo && setStato(m)
        );
        if (!vivo) return;
        sessioneRef.current = sess;
        const esito = sess.boot();
        if (!vivo) return;
        setRighe([{ kind: "out", text: esito.text.trim() }]);
        setPhase("playing");
      } catch (e) {
        if (vivo) {
          setStato(e instanceof Error ? e.message : String(e));
          setPhase("errore");
        }
      }
    })();
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase === "playing") inputRef.current?.focus();
  }, [phase, finita]);

  useEffect(() => {
    screenRef.current?.scrollTo({ top: screenRef.current.scrollHeight, behavior: "smooth" });
  }, [righe, phase]);

  const applica = (cmd: string, esito: TurnoEsito) => {
    setRighe((r) => [...r, { kind: "cmd", text: cmd }, { kind: "out", text: esito.text.trim() }]);
    if (!esito.continua || esito.stato !== "in_corso") setFinita(true);
  };

  const invia = () => {
    const cmd = bozza.trim();
    if (!cmd || finita || !sessioneRef.current) return;
    setBozza("");
    if (cmd.toLowerCase() === "esci" || cmd.toLowerCase() === "quit") {
      setRighe((r) => [...r, { kind: "cmd", text: cmd }, { kind: "sys", text: "Hai espulso la cassetta." }]);
      setFinita(true);
      return;
    }
    applica(cmd, sessioneRef.current.step(cmd));
  };

  const ricomincia = () => {
    if (!sessioneRef.current) return;
    const esito = sessioneRef.current.boot();
    setRighe([{ kind: "out", text: esito.text.trim() }]);
    setFinita(false);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col" style={{ height: "min(82vh, 760px)" }}>
      <div className="flex flex-1 flex-col overflow-hidden rounded-[1.4rem] border-[3px] border-favella-brace/80 bg-favella-panel/80 p-2 shadow-glow-card md:p-3">
        {/* Mangianastri */}
        <div className="flex items-center justify-between rounded-t-xl border border-b-0 border-favella-cyan/15 bg-favella-panel/80 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <Reel spinning={phase === "loading"} />
            <Reel spinning={phase === "loading"} />
            <div className="ml-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-favella-emerald">
                Cassetta-gioco {String(game.numero).padStart(2, "0")}
              </p>
              <p className="font-display leading-tight text-favella-text-primary">{game.titolo}</p>
            </div>
          </div>
          <button
            onClick={onExit}
            className="rounded-lg border border-favella-cyan/20 px-3 py-1.5 font-mono text-xs text-favella-text-secondary transition-colors hover:border-favella-cyan/50 hover:text-favella-cyan"
          >
            ⏏ Espelli
          </button>
        </div>

        {/* Schermo */}
        <div
          ref={screenRef}
          className="crt-screen relative flex-1 overflow-y-auto rounded-b-xl border border-favella-cyan/15 bg-favella-void/95 px-5 py-4 font-mono text-[15px] leading-relaxed md:px-7 md:text-[16px]"
        >
          {phase === "loading" && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-favella-cyan screen-glow">CARICAMENTO DEL NASTRO…</p>
              <p className="mt-2 max-w-sm text-favella-text-secondary">{stato}</p>
              <div className="mt-5 h-3 w-64 max-w-[80%] overflow-hidden rounded border border-favella-cyan/30 bg-favella-panel/60">
                <div className="h-full w-1/3 animate-marquee bg-gradient-to-r from-transparent via-favella-cyan to-transparent" />
              </div>
              <p className="mt-3 max-w-md text-xs text-favella-text-muted">
                Il motore FAVELLA gira davvero qui dentro, nel tuo browser. La prima volta il nastro
                è un po' lungo — come allora.
              </p>
            </div>
          )}

          {phase === "errore" && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-favella-flame screen-glow">NASTRO DANNEGGIATO</p>
              <p className="mt-2 max-w-md text-favella-text-secondary">{stato}</p>
              <p className="mt-2 text-xs text-favella-text-muted">
                Serve una connessione per caricare l'interprete la prima volta. Riprova.
              </p>
            </div>
          )}

          {phase === "playing" && (
            <>
              {righe.map((r, i) =>
                r.kind === "cmd" ? (
                  <p key={i} className="mt-3 text-favella-cyan">
                    <span className="text-favella-emerald">&gt;</span> {r.text}
                  </p>
                ) : r.kind === "sys" ? (
                  <p key={i} className="my-2 text-favella-amber/90 screen-glow">
                    » {r.text}
                  </p>
                ) : (
                  <pre key={i} className="whitespace-pre-wrap break-words text-favella-text-primary/90">
                    {r.text}
                  </pre>
                )
              )}

              {finita && (
                <div className="mt-5 flex flex-wrap gap-3 border-t border-favella-cyan/10 pt-4">
                  <button
                    onClick={ricomincia}
                    className="rounded-xl border border-favella-cyan/30 bg-favella-cyan/10 px-5 py-2.5 font-medium text-favella-cyan transition-all hover:bg-favella-cyan hover:text-favella-dark"
                  >
                    ↺ Rigioca
                  </button>
                  <button
                    onClick={onExit}
                    className="rounded-xl border border-favella-text-secondary/20 px-5 py-2.5 text-favella-text-secondary transition-colors hover:text-favella-text-primary"
                  >
                    ⏏ Torna allo scaffale
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Riga di comando */}
      {phase === "playing" && !finita && (
        <div className="mt-3">
          <div className="flex items-center gap-2 rounded-xl border border-favella-cyan/15 bg-favella-panel/60 px-4 py-2.5 font-mono">
            <span className="text-favella-emerald">.fav&gt;</span>
            <input
              ref={inputRef}
              value={bozza}
              onChange={(e) => setBozza(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && invia()}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              placeholder="scrivi un comando (guarda, nord, esamina il tavolino…) e premi Invio"
              className="flex-1 bg-transparent text-favella-text-primary caret-favella-cyan outline-none placeholder:text-favella-text-muted/60"
            />
          </div>
          {game.comandiEsempio.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] text-favella-text-muted">prova:</span>
              {game.comandiEsempio.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setBozza(c);
                    inputRef.current?.focus();
                  }}
                  className="rounded-md border border-favella-cyan/20 bg-favella-void/40 px-2.5 py-1 font-mono text-[11px] text-favella-text-secondary transition-colors hover:border-favella-cyan/50 hover:text-favella-cyan"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="mt-3 text-center font-mono text-xs text-favella-text-muted">
        {game.fonte} · motore FAVELLA reale nel browser
      </p>
    </div>
  );
};

export default GamePlayer;
