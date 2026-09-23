// ====================================================================
//  «Il Viaggiatore» — interfaccia di gioco (seconda versione).
// --------------------------------------------------------------------
//  Superficie 1280×720 (dentro la shell 16:9). In alto il PANORAMA vivo
//  della zona (stesso linguaggio del trailer): il viandante cammina quando
//  cambi luogo. Sotto, a sinistra, il DIARIO: la prosa del motore composta
//  come un libro (serif, parole-chiave evidenziate, suggerimenti in margine,
//  battute con chi parla, sensazioni del corpo a parte); in fondo il comando,
//  le risposte di dialogo come pulsanti, le uscite e le cose del luogo.
//  A destra, il CORPO (vita, sete, fame con le soglie), le SCORTE, la
//  BISACCIA a sette posti, la FIDUCIA di chi hai incontrato, il CAMMINO.
//  La logica è il motore FAVELLA reale (Pyodide), via favellaRuntime.
// ====================================================================
import { useEffect, useMemo, useRef, useState } from "react";
import { avviaGioco } from "../lib/favellaRuntime";
import type { SessioneGioco, StatoMondo, TurnoEsito } from "../lib/favellaRuntime";
import { VIAGGIATORE_GAME, ZONE_THEME, type ZoneKey, zoneOf } from "../data/viaggiatore";
import Panorama, { type Clima } from "../gioco/Panorama";
import ComeSiGioca from "../gioco/ComeSiGioca";
import { analizza, spezza, type Blocco } from "../gioco/testo";
import "../gioco/gioco.css";

const VUOTO: StatoMondo = { inventory: [], counters: {}, room: null, roomId: null };
const ZORDER: ZoneKey[] = ["z1", "z2", "z3", "z4", "z5", "z6", "z7"];
const MAGGIORI = ["Saverio", "Iole", "Vito", "Rosaria", "Onofrio"];
const DIREZIONI: Record<string, string> = { nord: "↑", sud: "↓", est: "→", ovest: "←", su: "⤒", giu: "⤓", "giù": "⤓" };

interface Voce { id: number; cmd?: string; blocchi: Blocco[] }
type Menu = { tipo: "qui" | "zaino"; id: string; nome: string; persona?: boolean; prendibile?: boolean } | null;

// l'id del motore è il nome senza articolo, minuscolo: «esamina chiave inglese»
const senzaArticolo = (s: string) => s.replace(/^(il|lo|la|i|gli|le|un|uno|una)\s+/i, "").replace(/^(l'|un')/i, "").toLowerCase();

const ViaggiatorePlayer = ({ onExit }: { onExit: () => void }) => {
  const [fase, setFase] = useState<"carica" | "gioca" | "errore">("carica");
  const [messaggio, setMessaggio] = useState("Si carica il motore…");
  const [voci, setVoci] = useState<Voce[]>([]);
  const [bozza, setBozza] = useState("");
  const [finita, setFinita] = useState(false);
  const [esito, setEsito] = useState("in_corso");
  const [finale, setFinale] = useState("");
  const [mondo, setMondo] = useState<StatoMondo>(VUOTO);
  const [guida, setGuida] = useState(false);
  const [menu, setMenu] = useState<Menu>(null);
  const [incontrati, setIncontrati] = useState<string[]>([]);
  const [camminaDa, setCamminaDa] = useState(-1e9);

  const sessione = useRef<SessioneGioco | null>(null);
  const diarioRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const storia = useRef<string[]>([]);
  const iStoria = useRef(-1);
  const contatore = useRef(0);

  // ── avvio del motore ────────────────────────────────────────────────
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const s = await avviaGioco(VIAGGIATORE_GAME, (m) => vivo && setMessaggio(m));
        if (!vivo) return;
        sessione.current = s;
        const e = s.boot();
        setVoci([{ id: contatore.current++, blocchi: analizza(e.text) }]);
        setMondo(s.stato());
        setCamminaDa(performance.now());
        setFase("gioca");
      } catch (err) {
        if (vivo) { setMessaggio(err instanceof Error ? err.message : String(err)); setFase("errore"); }
      }
    })();
    return () => { vivo = false; };
  }, []);

  useEffect(() => { if (fase === "gioca" && !finita && !guida) inputRef.current?.focus(); }, [fase, finita, guida, voci]);
  useEffect(() => {
    const el = diarioRef.current;
    if (el) requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }));
  }, [voci, finita]);

  // ── un turno ───────────────────────────────────────────────────────
  const applica = (etichetta: string, e: TurnoEsito) => {
    const blocchi = analizza(e.text);
    setVoci((v) => [...v, { id: contatore.current++, cmd: etichetta, blocchi }]);
    const nuovi = blocchi.flatMap((b) => (b.tipo === "battuta" ? [b.chi] : []));
    if (nuovi.length) setIncontrati((p) => Array.from(new Set([...p, ...nuovi])));
    const fin = blocchi.find((b) => b.tipo === "finale");
    if (fin && fin.tipo === "finale") setFinale(fin.testo);
    if (sessione.current) {
      const dopo = sessione.current.stato();
      if (dopo.roomId !== mondo.roomId) setCamminaDa(performance.now());
      setMondo(dopo);
    }
    if (!e.continua || e.stato !== "in_corso") { setFinita(true); setEsito(e.stato); }
  };

  const manda = (grezzo: string, etichetta?: string) => {
    const cmd = grezzo.trim();
    if (!cmd || finita || !sessione.current) return;
    setBozza(""); setMenu(null);
    storia.current = [...storia.current.filter((x) => x !== cmd), cmd].slice(-60);
    iStoria.current = -1;
    // in dialogo: un numero mostra il testo della risposta scelta
    let et = etichetta ?? cmd;
    if (!etichetta && mondo.dialog && /^\d+$/.test(cmd)) et = mondo.dialog.opzioni[Number(cmd) - 1] ?? cmd;
    applica(et, sessione.current.step(cmd));
  };

  const ricomincia = () => {
    if (!sessione.current) return;
    const e = sessione.current.boot();
    setVoci([{ id: contatore.current++, blocchi: analizza(e.text) }]);
    setMondo(sessione.current.stato());
    setFinita(false); setEsito("in_corso"); setFinale(""); setIncontrati([]); setMenu(null);
    setCamminaDa(performance.now());
  };

  const tasto = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") manda(bozza);
    else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const s = storia.current;
      if (!s.length) return;
      e.preventDefault();
      let i = iStoria.current < 0 ? s.length : iStoria.current;
      i = e.key === "ArrowUp" ? Math.max(0, i - 1) : i + 1;
      if (i >= s.length) { iStoria.current = -1; setBozza(""); } else { iStoria.current = i; setBozza(s[i]); }
    } else if (e.key === "Escape") setMenu(null);
  };

  // ── dati derivati ──────────────────────────────────────────────────
  const zona = zoneOf(mondo.roomId);
  const tema = ZONE_THEME[zona];
  const accento = finita ? (esito === "vinta" ? "#f5c563" : "#9aa3b2") : tema.accent;
  const clima: Clima = finita ? (esito === "vinta" ? "vinta" : "persa") : zona;
  const c = mondo.counters;
  const num = (k: string) => (typeof c[k] === "number" ? c[k] : 0);
  const zi = ZORDER.indexOf(zona);
  const capienzaAcqua = mondo.inventory.some((o) => /damigiana/i.test(o)) ? 20 : 10;
  const capienza = mondo.capacity ?? 7;
  const fiducie = MAGGIORI.filter((n) => incontrati.includes(n)).map((n) => ({ n, v: num("fiducia di " + n.toLowerCase()) }));
  const ultima = voci.length - 1;
  const stile = useMemo(() => ({ ["--acc" as string]: accento }) as React.CSSProperties, [accento]);

  // ── resa dei blocchi del diario ───────────────────────────────────
  const prosa = (testo: string, chiave: string) => {
    const pezzi = spezza(testo);
    const aiuti = pezzi.filter((p) => p.k === "aiuto");
    return (
      <div key={chiave}>
        <p className="vg-prosa">
          {pezzi.filter((p) => p.k !== "aiuto").map((p, i) =>
            p.k === "chiave" ? <span key={i} className="vg-chiave">{p.s.toLowerCase()}</span> : <span key={i}>{p.s}</span>)}
        </p>
        {aiuti.map((a, i) => (
          <p key={i} className="vg-aiuto"><span aria-hidden="true">◇</span> {a.s.replace(/\s+/g, " ")}</p>
        ))}
      </div>
    );
  };

  const blocco = (b: Blocco, k: string) => {
    switch (b.tipo) {
      case "stanza": return <h3 key={k} className="vg-stanza"><span>{b.titolo}</span></h3>;
      case "prosa": return prosa(b.testo, k);
      case "battuta": return (
        <div key={k} className="vg-battuta">
          <span className="vg-chi">{b.chi}</span>
          <p className="vg-prosa">{b.testo}</p>
        </div>
      );
      case "corpo": return <p key={k} className="vg-sensazione"><span aria-hidden="true">●</span> {b.testo}</p>;
      case "sistema": return <p key={k} className="vg-sistema">{b.testo}</p>;
      default: return null;
    }
  };

  // ── pezzi della barra laterale ─────────────────────────────────────
  const metro = (nome: string, val: number, max: number, soglie: number[], stato: string, rovescio = false) => {
    const k = Math.max(0, Math.min(1, val / max));
    const pericolo = rovescio ? val <= 3 : val >= soglie[1];
    const attento = rovescio ? val <= 6 : val >= soglie[0];
    const col = pericolo ? "#ef6b7e" : attento ? "#f2ad45" : "var(--acc)";
    return (
      <div className="vg-metro" key={nome}>
        <div className="vg-metro-riga">
          <span className="vg-metro-nome">{nome}</span>
          <span className="vg-metro-stato" style={pericolo || attento ? { color: col } : undefined}>{stato}</span>
          <span className="vg-metro-val" style={{ color: col }}>{val}</span>
        </div>
        <div className="vg-metro-barra">
          <div style={{ width: `${k * 100}%`, background: col, boxShadow: `0 0 12px ${col}` }} />
          {soglie.map((s) => <i key={s} style={{ left: `${(s / max) * 100}%` }} />)}
        </div>
      </div>
    );
  };
  const statoSete = (v: number) => (v >= 9 ? "disidratato" : v >= 6 ? "assetato" : "a posto");
  const statoFame = (v: number) => (v >= 11 ? "sfinito" : v >= 7 ? "affamato" : "a posto");
  const statoVita = (v: number) => (v <= 3 ? "allo stremo" : v <= 6 ? "provato" : "in forze");

  // ── schermate di carico / errore ───────────────────────────────────
  if (fase !== "gioca") {
    return (
      <div className="vg" style={stile}>
        <div style={{ position: "absolute", inset: 0 }}><Panorama clima="z0" luogo={null} camminaDa={-1e9} /></div>
        <div className="vg-velo" />
        <div className="vg-carica">
          {fase === "carica" ? (
            <>
              <p className="vg-sopratitolo">il motore favella gira nel browser</p>
              <h2>Si prepara il viaggio…</h2>
              <p className="vg-carica-msg">{messaggio}</p>
              <div className="vg-carica-barra"><div /></div>
              <p className="vg-carica-nota">La prima volta serve qualche secondo: si scarica l'interprete Python.</p>
            </>
          ) : (
            <>
              <h2 style={{ color: "#fb923c" }}>Il motore non è partito</h2>
              <p className="vg-carica-msg">{messaggio}</p>
              <p className="vg-carica-nota">Serve la rete per caricare l'interprete la prima volta.</p>
              <button className="vg-bottone" onClick={onExit}>← torna all'intro</button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── la partita ─────────────────────────────────────────────────────
  return (
    <div className="vg" style={stile}>
      {/* PANORAMA */}
      <header className="vg-panorama">
        <Panorama clima={clima} luogo={mondo.roomId} camminaDa={camminaDa} />
        <div className="vg-panorama-sfuma" />
        <div className="vg-testata">
          <span className="vg-marchio"><b>Il Viaggiatore</b> · {finita ? "fine del viaggio" : `tappa ${Math.max(1, zi + 1)} di 7`}</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="vg-bottone vg-piccolo" onClick={() => setGuida(true)}>? come si gioca</button>
            <button className="vg-bottone vg-piccolo" onClick={onExit}>← intro</button>
          </div>
        </div>
        <div className="vg-luogo">
          <p className="vg-sopratitolo">{finita ? (esito === "vinta" ? "a casa" : "il viaggio finisce qui") : tema.nome}</p>
          <h1>{finita ? "Acquamorta" : mondo.room ?? "—"}</h1>
        </div>
      </header>

      <div className="vg-pagina">
        {/* DIARIO */}
        <main className="vg-diario-col">
          <div ref={diarioRef} className="vg-diario gv-scroll">
            <div className="vg-colonna">
              {voci.map((v, i) => (
                <section key={v.id} className={"vg-voce" + (i < ultima ? " vg-passata" : "")}>
                  {v.cmd && <p className="vg-comando"><span>›</span> {v.cmd}</p>}
                  {v.blocchi.map((b, j) => blocco(b, `${v.id}-${j}`))}
                </section>
              ))}
              {finita && (
                <section className="vg-finale">
                  <p className="vg-sopratitolo">{esito === "vinta" ? "finale" : "fine"}</p>
                  <p className="vg-finale-testo">{finale || (esito === "vinta" ? "Sei arrivato." : "Il viaggio finisce qui.")}</p>
                  <div className="vg-finale-azioni">
                    <button className="vg-bottone vg-pieno" onClick={ricomincia}>↺ riparti dalla stazione</button>
                    <button className="vg-bottone" onClick={onExit}>← intro</button>
                  </div>
                </section>
              )}
            </div>
          </div>

          {!finita && (
            <div className="vg-comandi">
              {mondo.dialog && mondo.dialog.opzioni.length > 0 && (
                <div className="vg-risposte">
                  <p className="vg-sopratitolo">rispondi a {mondo.dialog.chi}</p>
                  <div className="vg-risposte-lista">
                    {mondo.dialog.opzioni.map((o, i) => (
                      <button key={i} className="vg-risposta" onClick={() => manda(String(i + 1), o)}>
                        <span className="vg-num">{i + 1}</span><span>{o}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="vg-input">
                <span className="vg-prompt">›</span>
                <input ref={inputRef} value={bozza} onChange={(e) => setBozza(e.target.value)} onKeyDown={tasto}
                  spellCheck={false} autoCapitalize="off" autoCorrect="off" autoComplete="off"
                  aria-label="Scrivi un comando" placeholder={mondo.dialog ? "scegli una risposta (1, 2…) o scrivi" : "Cosa fai? Scrivi un comando in italiano…"} />
                <button className="vg-invia" onClick={() => manda(bozza)} disabled={!bozza.trim()} aria-label="Invia">invio ↵</button>
              </div>

              {!mondo.dialog && (
                <div className="vg-contesto">
                  <div className="vg-gruppo">
                    <span className="vg-etichetta">uscite</span>
                    {(mondo.exits ?? []).map((u) => (
                      <button key={u.dir} className="vg-chip vg-uscita" onClick={() => manda(u.dir)} title={`${u.dir}: ${u.verso}`}>
                        <span className="vg-freccia">{DIREZIONI[u.dir] ?? "·"}</span>{u.dir}<em>{u.verso}</em>
                      </button>
                    ))}
                  </div>
                  {(mondo.present ?? []).length > 0 && (
                    <div className="vg-gruppo">
                      <span className="vg-etichetta">qui</span>
                      {(mondo.present ?? []).map((p) => {
                        const attivo = menu?.tipo === "qui" && menu.id === p.id;
                        return (
                          <button key={p.id} className={"vg-chip" + (p.persona ? " vg-persona" : "") + (attivo ? " vg-attivo" : "")}
                            onClick={() => setMenu(attivo ? null : { tipo: "qui", id: p.id, nome: p.nome, persona: p.persona, prendibile: p.prendibile })}>
                            {p.persona && <span className="vg-freccia">◉</span>}{p.nome}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {menu && (
                <div className="vg-azioni">
                  <span className="vg-etichetta">{menu.nome}</span>
                  {menu.tipo === "qui" && menu.persona && <button className="vg-chip vg-pieno" onClick={() => manda("parla con " + menu.id)}>parla con</button>}
                  <button className="vg-chip" onClick={() => manda("esamina " + menu.id)}>esamina</button>
                  {menu.tipo === "qui" && menu.prendibile && <button className="vg-chip" onClick={() => manda("prendi " + menu.id)}>prendi</button>}
                  {menu.tipo === "zaino" && <>
                    <button className="vg-chip" onClick={() => { setBozza("usa " + menu.id + " su "); setMenu(null); inputRef.current?.focus(); }}>usa su…</button>
                    <button className="vg-chip" onClick={() => manda("lascia " + menu.id)}>lascia</button>
                  </>}
                  <button className="vg-chip vg-chiudi" onClick={() => setMenu(null)} aria-label="Chiudi">✕</button>
                </div>
              )}
            </div>
          )}
        </main>

        {/* IL CORPO, LE SCORTE, LA BISACCIA */}
        <aside className="vg-lato gv-scroll">
          <p className="vg-sezione">il corpo</p>
          {metro("Vita", num("vita"), 10, [6, 3], statoVita(num("vita")), true)}
          {metro("Sete", num("sete"), 13, [6, 9], statoSete(num("sete")))}
          {metro("Fame", num("fame"), 15, [7, 11], statoFame(num("fame")))}

          <p className="vg-sezione">scorte</p>
          <div className="vg-scorte">
            <div className="vg-scorta">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 C8 9 6 12 6 15 A6 6 0 0 0 18 15 C18 12 16 9 12 3 Z" /></svg>
              <div><b>{num("acqua")}</b><span>acqua /{capienzaAcqua}</span></div>
            </div>
            <div className="vg-scorta">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13 C4 8 8 6 12 6 C16 6 20 8 20 13 V17 H4 Z M8 9 L9 12 M12 8 V12 M16 9 L15 12" /></svg>
              <div><b>{num("cibo")}</b><span>cibo</span></div>
            </div>
          </div>

          <p className="vg-sezione">bisaccia <span>{mondo.inventory.length}/{capienza}</span></p>
          <ul className="vg-zaino">
            {Array.from({ length: Math.max(capienza, mondo.inventory.length) }, (_, i) => {
              const o = mondo.inventory[i];
              if (!o) return <li key={i} className="vg-vuoto" aria-hidden="true" />;
              const id = senzaArticolo(o);
              const attivo = menu?.tipo === "zaino" && menu.id === id;
              return (
                <li key={i}>
                  <button className={"vg-oggetto" + (attivo ? " vg-attivo" : "")} disabled={finita}
                    onClick={() => setMenu(attivo ? null : { tipo: "zaino", id, nome: o })}>{o}</button>
                </li>
              );
            })}
          </ul>

          {fiducie.length > 0 && (<>
            <p className="vg-sezione">fiducia</p>
            <ul className="vg-fiducie">
              {fiducie.map((f) => (
                <li key={f.n}>
                  <span>{f.n}</span>
                  <span className="vg-pip">{[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= f.v ? "on" : ""} />)}</span>
                </li>
              ))}
            </ul>
          </>)}

          <p className="vg-sezione">il cammino</p>
          <div className="vg-cammino">
            {ZORDER.map((zk, i) => (
              <span key={zk} title={ZONE_THEME[zk].nome} className={i < zi ? "fatto" : i === zi ? "ora" : ""} style={{ ["--z" as string]: ZONE_THEME[zk].accent } as React.CSSProperties} />
            ))}
          </div>
          <p className="vg-cammino-nome">{zi >= 0 ? ZONE_THEME[zona].nome : "—"}</p>
        </aside>
      </div>

      {guida && <ComeSiGioca base={13} accento={accento} onChiudi={() => { setGuida(false); inputRef.current?.focus(); }} />}
    </div>
  );
};

export default ViaggiatorePlayer;
