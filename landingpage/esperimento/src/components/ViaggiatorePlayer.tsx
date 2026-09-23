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
//  Il TACCUINO salva e carica (F5 / F9); il posto automatico si scrive a
//  ogni cambio di luogo e quando si torna all'intro.
// ====================================================================
import { useEffect, useMemo, useRef, useState } from "react";
import { avviaGioco } from "../lib/favellaRuntime";
import type { SessioneGioco, StatoMondo, TurnoEsito } from "../lib/favellaRuntime";
import { VIAGGIATORE_GAME, ZONE_THEME, type ZoneKey, zoneOf } from "../data/viaggiatore";
import Panorama, { type Clima } from "../gioco/Panorama";
import ComeSiGioca from "../gioco/ComeSiGioca";
import Taccuino from "../gioco/Taccuino";
import { componi, dataLeggibile, nomePosto, scrivi, type Posto, type Riassunto, type Salvataggio } from "../lib/salvataggi";
import { annota } from "../lib/desktop";
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

const ViaggiatorePlayer = ({ onExit, carica = null }: { onExit: () => void; carica?: Salvataggio | null }) => {
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
  const [taccuino, setTaccuino] = useState<null | "salva" | "carica">(null);
  // comandi dati dopo l'ultimo salvataggio o caricamento: se > 0, caricare fa perdere qualcosa
  const [nonSalvati, setNonSalvati] = useState(0);

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
        if (carica) riprendi(carica);
        setFase("gioca");
      } catch (err) {
        if (vivo) { setMessaggio(err instanceof Error ? err.message : String(err)); setFase("errore"); }
      }
    })();
    return () => { vivo = false; };
  }, []);

  useEffect(() => { if (fase === "gioca" && !finita && !guida && !taccuino) inputRef.current?.focus(); }, [fase, finita, guida, taccuino, voci]);
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
    setNonSalvati((n) => n + 1);
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
    setNonSalvati(0);
  };

  // ── salvare e caricare ─────────────────────────────────────────────
  const riassunto = (m: StatoMondo): Riassunto => {
    const z = zoneOf(m.roomId);
    const n = (k: string) => (typeof m.counters[k] === "number" ? m.counters[k] : 0);
    return {
      luogo: m.room ?? "—", zona: z, nomeZona: ZONE_THEME[z].nome, tappa: Math.max(1, ZORDER.indexOf(z) + 1), turno: m.turn ?? 0,
      vita: n("vita"), sete: n("sete"), fame: n("fame"), acqua: n("acqua"), cibo: n("cibo"),
    };
  };

  const salvaIn = async (posto: Posto) => {
    const s = sessione.current;
    if (!s) throw new Error("La partita non è ancora pronta.");
    const partita = s.salva();
    const dati = componi(posto, partita, riassunto(s.stato()), {
      voci: voci.map(({ cmd, blocchi }) => ({ cmd, blocchi })), incontrati, storia: storia.current,
    });
    await scrivi(posto, dati);
    if (posto !== "auto") setNonSalvati(0);
  };

  // il posto automatico: a ogni cambio di luogo, fuori dai dialoghi
  const autoLuogo = useRef<string | null>(null);
  useEffect(() => {
    if (fase !== "gioca" || finita || mondo.dialog || !mondo.roomId) return;
    if (autoLuogo.current === null) { autoLuogo.current = mondo.roomId; return; }
    if (autoLuogo.current === mondo.roomId) return;
    autoLuogo.current = mondo.roomId;
    salvaIn("auto").catch((e) => annota("warn", `salvataggio automatico non riuscito: ${e?.message ?? e}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mondo.roomId, mondo.dialog, fase, finita]);

  const esci = () => {
    if (fase === "gioca" && !finita && !mondo.dialog && nonSalvati > 0) {
      salvaIn("auto").catch(() => {}).finally(onExit);
    } else onExit();
  };

  /** Riprende una partita salvata: il motore rigioca la sequenza e verifica l'impronta. */
  function riprendi(dati: Salvataggio) {
    const s = sessione.current;
    if (!s) return;
    const t0 = performance.now();
    const esito = s.carica(dati.partita);
    if (!esito.ok) {
      annota("error", `caricamento fallito (${nomePosto(dati.posto)}): ${esito.errore}`);
      setVoci((v) => [...v, { id: contatore.current++, blocchi: [{ tipo: "sistema", testo: `Il salvataggio non si è potuto caricare: ${esito.errore}` }] }]);
      return;
    }
    const nuovoMondo = s.stato();
    const stessaAvventura = s.salva().avventura === dati.partita.avventura;
    const note: Blocco[] = [{ tipo: "sistema", testo: `— Ripreso dal ${nomePosto(dati.posto).toLowerCase()}, salvato il ${dataLeggibile(dati.creato)} —` }];
    if (!esito.identica) {
      note.push({ tipo: "sistema", testo: stessaAvventura
        ? "Attenzione: la partita ricostruita non coincide del tutto con quella salvata."
        : `Salvato con la versione ${dati.gioco}: la partita è stata ricostruita su questa versione del gioco.` });
      annota("warn", `caricamento con impronta diversa (salvato ${dati.gioco}, stessa avventura: ${stessaAvventura})`);
    }
    annota("info", `partita caricata: ${nomePosto(dati.posto)}, ${esito.comandi} comandi in ${Math.round(performance.now() - t0)} ms`);
    setVoci([
      ...dati.diario.voci.map((v) => ({ id: contatore.current++, cmd: v.cmd, blocchi: v.blocchi })),
      { id: contatore.current++, blocchi: [...note, ...analizza(esito.text)] },
    ]);
    setMondo(nuovoMondo);
    autoLuogo.current = nuovoMondo.roomId;
    setIncontrati(dati.diario.incontrati ?? []);
    storia.current = dati.diario.storia ?? [];
    iStoria.current = -1;
    setMenu(null); setBozza("");
    const fine = esito.stato !== "in_corso";
    setFinita(fine); setEsito(esito.stato); setFinale("");
    setCamminaDa(performance.now());
    setNonSalvati(0);
  }

  // F5 salva, F9 carica
  useEffect(() => {
    const tasto = (e: KeyboardEvent) => {
      if (fase !== "gioca" || guida || taccuino) return;
      if (e.key === "F5") { e.preventDefault(); if (!finita) setTaccuino("salva"); }
      else if (e.key === "F9") { e.preventDefault(); setTaccuino("carica"); }
    };
    window.addEventListener("keydown", tasto);
    return () => window.removeEventListener("keydown", tasto);
  }, [fase, guida, taccuino, finita]);

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
              <p className="vg-carica-nota">{carica ? `Si riprende il viaggio dal ${nomePosto(carica.posto).toLowerCase()}…` : "Qualche secondo: si avvia l'interprete Python."}</p>
            </>
          ) : (
            <>
              <h2 style={{ color: "#fb923c" }}>Il motore non è partito</h2>
              <p className="vg-carica-msg">{messaggio}</p>
              <p className="vg-carica-nota">Se si ripete, il registro tecnico dice perché.</p>
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
            <button className="vg-bottone vg-piccolo" onClick={() => setTaccuino("salva")} disabled={finita} title="Salva la partita (F5)">salva</button>
            <button className="vg-bottone vg-piccolo" onClick={() => setTaccuino("carica")} title="Carica una partita (F9)">carica</button>
            <button className="vg-bottone vg-piccolo" onClick={() => setGuida(true)}>? come si gioca</button>
            <button className="vg-bottone vg-piccolo" onClick={esci}>← intro</button>
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
                    <button className="vg-bottone" onClick={() => setTaccuino("carica")}>carica una partita</button>
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
      {taccuino && (
        <Taccuino base={13} modo={taccuino} accento={accento} puoSalvare={!finita} avvisaPerdita={nonSalvati > 0 && !finita}
          onSalva={salvaIn}
          onCarica={(d) => { setTaccuino(null); riprendi(d); }}
          onChiudi={() => { setTaccuino(null); inputRef.current?.focus(); }} />
      )}
    </div>
  );
};

export default ViaggiatorePlayer;
