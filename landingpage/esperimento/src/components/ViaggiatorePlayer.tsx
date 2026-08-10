// ====================================================================
//  «Il Viaggiatore» — player full-game.
// --------------------------------------------------------------------
//  Resa pixel-perfect del design «Il Viaggiatore - Gioco» (Claude Design,
//  direzione Sete): tre colonne STATO/FIDUCIA · schermo+parser · LUOGO/
//  INVENTARIO+spina delle zone, schermo CRT con cornici angolari e
//  scanline, prompt .fav> pulsante. La PALETTE vira con la zona.
//  La LOGICA è il MOTORE FAVELLA reale (Pyodide), non il mock del design:
//  boot/step/stato via favellaRuntime.
// ====================================================================
import { useEffect, useMemo, useRef, useState } from "react";
import { avviaGioco } from "../lib/favellaRuntime";
import type { SessioneGioco, StatoMondo, TurnoEsito } from "../lib/favellaRuntime";
import { VIAGGIATORE_GAME, ZONE_THEME, ZoneKey, zoneOf } from "../data/viaggiatore";

type Riga = { kind: "out" | "cmd"; text: string };
const VUOTO: StatoMondo = { inventory: [], counters: {}, room: null, roomId: null };
const ZORDER: ZoneKey[] = ["z1", "z2", "z3", "z4", "z5", "z6", "z7"];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface Tema { nome: string; accent: string; bg: string }

const ViaggiatorePlayer = ({ onExit }: { onExit: () => void }) => {
  const [phase, setPhase] = useState<"loading" | "playing" | "errore">("loading");
  const [stato, setStato] = useState("Si carica il motore…");
  const [righe, setRighe] = useState<Riga[]>([]);
  const [bozza, setBozza] = useState("");
  const [finita, setFinita] = useState(false);
  const [esitoFin, setEsitoFin] = useState<string>("in_corso");
  const [mondo, setMondo] = useState<StatoMondo>(VUOTO);

  const sessioneRef = useRef<SessioneGioco | null>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Tema della zona corrente; in fine partita vira (oro = vinta, cenere = altro).
  const tema: Tema = useMemo(() => {
    if (finita && esitoFin === "vinta")
      return { accent: "#f5c563", bg: "radial-gradient(120% 120% at 50% -10%, #1a1408 0%, #0b0905 60%, #050409 100%)", nome: "A casa" };
    if (finita)
      return { accent: "#8aa0b4", bg: "radial-gradient(120% 120% at 50% -10%, #0a0c11 0%, #06080d 60%, #040509 100%)", nome: "Fine del viaggio" };
    const z = ZONE_THEME[zoneOf(mondo.roomId)];
    return { accent: z.accent, bg: z.bg, nome: z.nome };
  }, [mondo.roomId, finita, esitoFin]);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const sess = await avviaGioco(VIAGGIATORE_GAME, (m) => vivo && setStato(m));
        if (!vivo) return;
        sessioneRef.current = sess;
        const esito = sess.boot();
        if (!vivo) return;
        setRighe([{ kind: "out", text: esito.text.trim() }]);
        setMondo(sess.stato());
        setPhase("playing");
      } catch (e) {
        if (vivo) { setStato(e instanceof Error ? e.message : String(e)); setPhase("errore"); }
      }
    })();
    return () => { vivo = false; };
  }, []);

  useEffect(() => { if (phase === "playing" && !finita) inputRef.current?.focus(); }, [phase, finita]);
  useEffect(() => {
    screenRef.current?.scrollTo({ top: screenRef.current.scrollHeight, behavior: "smooth" });
  }, [righe, phase]);

  const applica = (cmd: string, esito: TurnoEsito) => {
    setRighe((r) => [...r, { kind: "cmd", text: cmd }, { kind: "out", text: esito.text.trim() }]);
    if (sessioneRef.current) setMondo(sessioneRef.current.stato());
    if (!esito.continua || esito.stato !== "in_corso") { setFinita(true); setEsitoFin(esito.stato); }
  };
  const manda = (raw: string) => {
    const cmd = raw.trim();
    if (!cmd || finita || !sessioneRef.current) return;
    setBozza("");
    applica(cmd, sessioneRef.current.step(cmd));
  };
  const ricomincia = () => {
    if (!sessioneRef.current) return;
    const esito = sessioneRef.current.boot();
    setRighe([{ kind: "out", text: esito.text.trim() }]);
    setMondo(sessioneRef.current.stato());
    setFinita(false); setEsitoFin("in_corso");
  };

  const c = mondo.counters;
  const num = (k: string) => (typeof c[k] === "number" ? c[k] : 0);
  // Solo le fiducie dei 5 maggiori: "vita del cane"/"vita di vito" restano fuori.
  const fiducie = Object.entries(c)
    .filter(([k]) => k.startsWith("fiducia di "))
    .map(([k, v]) => ({ n: cap(k.replace("fiducia di ", "")), v }));

  // Comandi-suggerimento: funzionali col motore reale (NB "mangia qualcosa",
  // non "mangia": il verbo nudo è riservato e non scatta — vedi memoria motore).
  const SUGG = ["guarda", "bevi", "mangia qualcosa", "nord", "inventario"];

  const zi = ZORDER.indexOf(zoneOf(mondo.roomId)); // -1 se z0/fine
  const zoneNum = Math.max(1, zi + 1);

  const accentVar = { ["--accent" as string]: tema.accent } as React.CSSProperties;
  const mono = "'Source Code Pro',ui-monospace,monospace";
  const sora = "'Sora',system-ui,sans-serif";

  // ── helpers di resa (porting dal design) ──
  const PTitle = ({ children }: { children: React.ReactNode }) => (
    <p style={{ margin: "0 0 13px", fontFamily: mono, fontSize: 10, letterSpacing: ".28em", textTransform: "uppercase", color: "var(--accent)" }}>{children}</p>
  );
  const Bar = ({ label, val, max, tone }: { label: string; val: number; max: number; tone: "good" | "warn" | "bad" }) => {
    const pct = Math.max(0, Math.min(100, (val / max) * 100));
    const col = tone === "bad" ? "#df5f78" : tone === "warn" ? "#f2ad45" : "var(--accent)";
    return (
      <div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", fontFamily: mono, fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase" }}>
          <span style={{ color: "#9fb4c9" }}>{label}</span>
          <span style={{ color: col, fontWeight: 600 }}>{val}</span>
        </div>
        <div style={{ marginTop: 5, height: 6, borderRadius: 99, background: "rgba(3,6,13,.7)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.05)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99, background: col, boxShadow: `0 0 10px ${tone === "good" ? "var(--accent)" : col}`, transition: "width .5s ease, background .5s ease" }} />
        </div>
      </div>
    );
  };
  const Pill = ({ label, val, icon }: { label: string; val: number; icon: string }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 9, border: "1px solid rgba(255,255,255,.06)", background: "rgba(3,6,13,.45)", padding: "9px 11px" }}>
      <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: ".13em", textTransform: "uppercase", color: "#9fb4c9" }}>
        <span style={{ color: "var(--accent)", marginRight: 7 }}>{icon}</span>{label}
      </span>
      <span style={{ fontFamily: sora, fontSize: 18, fontWeight: 600, color: "#e8f0f8", lineHeight: 1 }}>{val}</span>
    </div>
  );
  const Corner = ({ p }: { p: "tl" | "tr" | "bl" | "br" }) => {
    const b = "1px solid rgba(255,255,255,.18)";
    const st: React.CSSProperties = { position: "absolute", width: 14, height: 14, pointerEvents: "none" };
    if (p === "tl") Object.assign(st, { top: 8, left: 8, borderTop: b, borderLeft: b });
    if (p === "tr") Object.assign(st, { top: 8, right: 8, borderTop: b, borderRight: b });
    if (p === "bl") Object.assign(st, { bottom: 8, left: 8, borderBottom: b, borderLeft: b });
    if (p === "br") Object.assign(st, { bottom: 8, right: 8, borderBottom: b, borderRight: b });
    return <span style={st} />;
  };

  return (
    <div style={{ ...accentVar, position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: tema.bg, color: "#e8f0f8", transition: "background 1.1s ease", fontFamily: sora }}>
      {/* ── Barra superiore ── */}
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 22px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 10, height: 10, borderRadius: 99, background: "var(--accent)", boxShadow: "0 0 12px var(--accent)" }} />
          <div style={{ lineHeight: 1.25 }}>
            <p style={{ margin: 0, fontFamily: mono, fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: "#5a728a" }}>esperimento · motore favella reale</p>
            <p style={{ margin: 0, fontFamily: sora, fontSize: 14, fontWeight: 600, color: "#e8f0f8" }}>Il Viaggiatore</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--accent)" }}>{tema.nome}</span>
          <button onClick={onExit} style={{ cursor: "pointer", textDecoration: "none", fontFamily: mono, fontSize: 12, color: "#9fb4c9", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, padding: "6px 12px", background: "transparent" }}>← intro</button>
        </div>
      </div>

      {phase !== "playing" ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 28px" }}>
          {phase === "loading" ? (
            <>
              <p style={{ fontFamily: sora, fontSize: 18, fontWeight: 600, color: "var(--accent)", margin: 0 }}>Si prepara il viaggio…</p>
              <p style={{ marginTop: 8, maxWidth: 360, fontSize: 13, color: "#9fb4c9" }}>{stato}</p>
              <div style={{ marginTop: 20, height: 6, width: 240, maxWidth: "80%", overflow: "hidden", borderRadius: 99, border: "1px solid rgba(255,255,255,.1)", background: "rgba(3,6,13,.6)" }}>
                <div style={{ height: "100%", width: "40%", background: "linear-gradient(90deg, transparent, var(--accent), transparent)", animation: "gv-marquee 1.2s linear infinite" }} />
              </div>
              <p style={{ marginTop: 16, maxWidth: 440, fontSize: 12, color: "#5a728a" }}>Il motore Python di FAVELLA gira davvero qui, nel browser, via Pyodide. La prima volta serve qualche secondo.</p>
            </>
          ) : (
            <>
              <p style={{ fontFamily: sora, fontSize: 18, fontWeight: 600, color: "#fb923c", margin: 0 }}>Il motore non è partito</p>
              <p style={{ marginTop: 8, maxWidth: 460, fontSize: 13, color: "#9fb4c9" }}>{stato}</p>
              <p style={{ marginTop: 8, fontSize: 12, color: "#5a728a" }}>Serve la rete per caricare l'interprete la prima volta.</p>
            </>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "248px 1fr 268px" }}>
          {/* ── Sinistra: STATO + FIDUCIA ── */}
          <aside className="gv-scroll" style={{ minHeight: 0, overflowY: "auto", borderRight: "1px solid rgba(255,255,255,.06)", padding: "20px 18px" }}>
            <PTitle>Stato</PTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <Bar label="Vita" val={num("vita")} max={10} tone={num("vita") <= 3 ? "bad" : num("vita") <= 6 ? "warn" : "good"} />
              <Bar label="Sete" val={num("sete")} max={13} tone={num("sete") >= 9 ? "bad" : num("sete") >= 6 ? "warn" : "good"} />
              <Bar label="Fame" val={num("fame")} max={15} tone={num("fame") >= 11 ? "bad" : num("fame") >= 7 ? "warn" : "good"} />
            </div>
            <div style={{ marginTop: 13, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Pill label="Acqua" val={num("acqua")} icon="◉" />
              <Pill label="Cibo" val={num("cibo")} icon="❖" />
            </div>
            {fiducie.length > 0 && (
              <div style={{ marginTop: 22 }}>
                <PTitle>Fiducia</PTitle>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 9 }}>
                  {fiducie.map((f) => (
                    <li key={f.n} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: mono, fontSize: 13, color: "#9fb4c9" }}>{f.n}</span>
                      <span style={{ display: "flex", gap: 3 }}>
                        {[0, 1, 2, 3].map((i) => (
                          <span key={i} style={{ width: 13, height: 6, borderRadius: 2, background: i < f.v ? "var(--accent)" : "rgba(255,255,255,.09)", boxShadow: i < f.v ? "0 0 7px var(--accent)" : "none" }} />
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          {/* ── Centro: schermo + parser ── */}
          <section style={{ minHeight: 0, minWidth: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ position: "relative", minHeight: 0, flex: 1, overflow: "hidden" }}>
              <Corner p="tl" /><Corner p="tr" /><Corner p="bl" /><Corner p="br" />
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2, background: "repeating-linear-gradient(rgba(34,211,238,.045) 0 1px, transparent 1px 3px)", opacity: .5, animation: "gv-flicker 3.5s ease-in-out infinite" }} />
              <div ref={screenRef} className="gv-scroll" style={{ position: "absolute", inset: 0, overflowY: "auto", overflowX: "hidden", padding: "22px 26px", fontFamily: mono, fontSize: 14.5, lineHeight: 1.62 }}>
                {righe.map((r, i) =>
                  r.kind === "cmd" ? (
                    <p key={i} style={{ margin: "16px 0 0", color: "var(--accent)", animation: "gv-in .25s ease both" }}>
                      <span style={{ opacity: .6 }}>&gt; </span>{r.text}
                    </p>
                  ) : (
                    <pre key={i} style={{ margin: "7px 0 0", whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: mono, color: "rgba(232,240,248,.9)", animation: "gv-in .3s ease both" }}>{r.text}</pre>
                  )
                )}
                {finita && (
                  <div style={{ marginTop: 22, borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 18 }}>
                    <p style={{ margin: 0, fontFamily: sora, fontSize: 19, fontWeight: 600, color: "var(--accent)" }}>
                      {esitoFin === "vinta" ? "Sei arrivato." : "Il viaggio finisce qui."}
                    </p>
                    <button onClick={ricomincia} style={{ marginTop: 14, cursor: "pointer", border: "1px solid var(--accent)", background: "transparent", color: "var(--accent)", borderRadius: 10, padding: "9px 18px", fontFamily: mono, fontSize: 13 }}>↺ Riparti</button>
                  </div>
                )}
              </div>
            </div>

            {!finita && (
              <div style={{ flexShrink: 0, borderTop: "1px solid rgba(255,255,255,.06)", padding: "14px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, borderRadius: 11, border: "1px solid rgba(255,255,255,.1)", background: "rgba(3,6,13,.5)", padding: "11px 15px", fontFamily: mono, animation: "gv-pulse 3s ease-in-out infinite" }}>
                  <span style={{ color: "var(--accent)" }}>.fav&gt;</span>
                  <input ref={inputRef} value={bozza}
                    onChange={(e) => setBozza(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") manda(bozza); }}
                    spellCheck={false} autoCapitalize="off" autoCorrect="off"
                    placeholder="un comando in italiano…"
                    style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "#e8f0f8", fontFamily: mono, fontSize: 14.5, caretColor: tema.accent }} />
                  <span style={{ width: 8, height: 16, background: "var(--accent)", display: bozza ? "none" : "inline-block", animation: "gv-caret 1s step-end infinite" }} />
                </div>
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 7 }}>
                  <span style={{ fontFamily: mono, fontSize: 11, color: "#5a728a", marginRight: 2 }}>prova:</span>
                  {SUGG.map((v) => (
                    <button key={v} onClick={() => manda(v)} style={{ cursor: "pointer", borderRadius: 7, border: "1px solid rgba(255,255,255,.1)", background: "rgba(3,6,13,.4)", color: "#9fb4c9", fontFamily: mono, fontSize: 11.5, padding: "5px 10px" }}>{v}</button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── Destra: LUOGO + spina + INVENTARIO ── */}
          <aside className="gv-scroll" style={{ minHeight: 0, overflowY: "auto", borderLeft: "1px solid rgba(255,255,255,.06)", padding: "20px 18px" }}>
            <PTitle>Luogo</PTitle>
            <p style={{ margin: 0, fontFamily: sora, fontSize: 17, fontWeight: 600, color: "#e8f0f8" }}>{finita ? tema.nome : (mondo.room ?? "—")}</p>
            <p style={{ margin: "5px 0 0", fontFamily: mono, fontSize: 11, letterSpacing: ".13em", textTransform: "uppercase", color: "var(--accent)" }}>{tema.nome}</p>
            {/* striscia-orizzonte */}
            <div style={{ marginTop: 13, height: 46, borderRadius: 8, position: "relative", overflow: "hidden", border: "1px solid rgba(255,255,255,.06)", background: "#03060d" }}>
              <div style={{ position: "absolute", left: 0, right: 0, bottom: -10, height: 34, background: "radial-gradient(60% 100% at 50% 100%, var(--accent), transparent 72%)", opacity: .5, filter: "blur(6px)" }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: "52%", height: 1.5, background: "var(--accent)", opacity: .55 }} />
            </div>
            {/* spina delle 7 zone */}
            <div style={{ marginTop: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontFamily: mono, fontSize: 10, letterSpacing: ".2em", textTransform: "uppercase", color: "#5a728a" }}>
                <span>cammino</span><span>zona {zoneNum} / 7</span>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {ZORDER.map((zk, i) => {
                  const on = i <= zi; const acc = ZONE_THEME[zk].accent; const now = i === zi;
                  return <span key={zk} title={ZONE_THEME[zk].nome} style={{ position: "relative", flex: 1, height: now ? 5 : 3, borderRadius: 3, background: on ? acc : "rgba(255,255,255,.1)", boxShadow: now ? `0 0 9px ${acc}` : "none", transition: "all .5s ease" }} />;
                })}
              </div>
            </div>
            {/* inventario */}
            <div style={{ marginTop: 22 }}>
              <PTitle>Inventario · {mondo.inventory.length}/6</PTitle>
              {mondo.inventory.length === 0 ? (
                <p style={{ margin: 0, fontFamily: mono, fontSize: 13, color: "#5a728a" }}>Le mani vuote.</p>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 7 }}>
                  {mondo.inventory.map((o, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: mono, fontSize: 13, color: "#9fb4c9" }}>
                      <span style={{ color: "var(--accent)" }}>·</span>{o}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default ViaggiatorePlayer;
