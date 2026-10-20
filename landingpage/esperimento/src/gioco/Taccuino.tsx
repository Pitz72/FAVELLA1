// ====================================================================
//  Il taccuino: salvare e caricare la partita.
// --------------------------------------------------------------------
//  Due schede. SALVA: sei posti; uno vuoto si scrive subito, uno pieno chiede
//  conferma. CARICA: il posto automatico (scritto a ogni cambio di luogo) e
//  i sei manuali; se c'è una partita in corso non salvata, chiede conferma.
//  Ogni posto si può esportare in un file o eliminare; un file si importa.
//  Misure in em (prop `base`), come la guida: vale per la superficie 1280 del
//  gioco e per quella 1920 del menu del trailer; nessun testo scende sotto .85em
//  (11 px a base 13). Ogni scheda è un contenitore: un solo pulsante (l'area
//  intera), con esporta ed elimina come pulsanti fratelli.
// ====================================================================
import { useCallback, useEffect, useState } from "react";
import {
  type Posto, type Salvataggio, type VoceTaccuino,
  archivioSuDisco, apriCartella, cartella, dataLeggibile, elenco, elimina, esporta, importa, nomePosto,
} from "../lib/salvataggi";
import { ZONE_THEME, type ZoneKey } from "../data/viaggiatore";
import { VERSIONE } from "../lib/versione";
import { useDialogo } from "./useDialogo";

const SERIF = "'Lora', Georgia, serif";
const MONO = "'Source Code Pro', ui-monospace, monospace";

type Modo = "salva" | "carica";
type Conferma = { tipo: "sovrascrivi" | "carica" | "elimina"; posto: Posto; dati?: Salvataggio } | null;

interface Props {
  base: number;
  modo: Modo;
  accento?: string;
  /** false nel menu del trailer: lì non c'è una partita da salvare */
  puoSalvare: boolean;
  /** true se caricando si perderebbe qualcosa: chiede conferma */
  avvisaPerdita?: boolean;
  onSalva?: (posto: Posto) => Promise<void>;
  onCarica: (s: Salvataggio) => void;
  onChiudi: () => void;
}

const piccolo = (colore: string): React.CSSProperties => ({
  fontFamily: MONO, fontSize: ".85em", letterSpacing: ".2em", textTransform: "uppercase", color: colore,
});

export default function Taccuino({ base, modo: modoIniziale, accento = "#f0b77e", puoSalvare, avvisaPerdita = false, onSalva, onCarica, onChiudi }: Props) {
  const [modo, setModo] = useState<Modo>(puoSalvare ? modoIniziale : "carica");
  const [voci, setVoci] = useState<VoceTaccuino[] | null>(null);
  const [conferma, setConferma] = useState<Conferma>(null);
  const [nota, setNota] = useState<{ testo: string; errore?: boolean } | null>(null);
  const [occupato, setOccupato] = useState(false);
  const [dove, setDove] = useState<string | null>(null);
  const [daFile, setDaFile] = useState<Salvataggio | null>(null);
  const dialogo = useDialogo<HTMLDivElement>();   // il fuoco entra, Tab resta dentro, alla chiusura torna; Esc è qui sotto

  const ricarica = useCallback(() => {
    elenco().then(setVoci).catch((e) => { setVoci([]); setNota({ testo: String(e?.message ?? e), errore: true }); });
  }, []);
  useEffect(() => { ricarica(); cartella().then(setDove).catch(() => {}); }, [ricarica]);
  useEffect(() => {
    const tasto = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); if (conferma || daFile) { setConferma(null); setDaFile(null); } else onChiudi(); }
    };
    window.addEventListener("keydown", tasto, true);
    return () => window.removeEventListener("keydown", tasto, true);
  }, [conferma, daFile, onChiudi]);

  const esegui = async (azione: () => Promise<void>) => {
    setOccupato(true);
    try { await azione(); } catch (e) { setNota({ testo: e instanceof Error ? e.message : String(e), errore: true }); }
    finally { setOccupato(false); setConferma(null); ricarica(); }
  };

  const salvaIn = (posto: Posto) => esegui(async () => {
    await onSalva?.(posto);
    setNota({ testo: `Partita salvata nel ${nomePosto(posto).toLowerCase()}.` });
  });
  const caricaDa = (s: Salvataggio) => { setConferma(null); onCarica(s); };

  const scegli = (v: VoceTaccuino) => {
    if (occupato) return;
    if (modo === "salva") {
      if (v.dati) setConferma({ tipo: "sovrascrivi", posto: v.posto, dati: v.dati });
      else salvaIn(v.posto);
    } else if (v.dati) {
      if (avvisaPerdita) setConferma({ tipo: "carica", posto: v.posto, dati: v.dati });
      else caricaDa(v.dati);
    }
  };

  const daImportare = async () => {
    try {
      const s = await importa();
      if (!s) return;
      if (avvisaPerdita) { setConferma(null); setDaFile(s); }
      else caricaDa(s);
    } catch (e) { setNota({ testo: e instanceof Error ? e.message : String(e), errore: true }); }
  };

  const mostrati = (voci ?? []).filter((v) => modo === "carica" || v.posto !== "auto");

  const scheda = (v: VoceTaccuino) => {
    const d = v.dati;
    const r = d?.riassunto;
    const tema = r ? ZONE_THEME[r.zona as ZoneKey] : undefined;
    const colore = tema?.accent ?? "rgba(255,255,255,.18)";
    const attivo = modo === "salva" || !!d;
    const inConferma = conferma?.posto === v.posto;
    const id = `tac-${v.posto}`;
    // la scheda è un contenitore; il suo unico pulsante è quello che copre tutta l'area e prende il nome dai testi;
    // esporta ed elimina sono pulsanti fratelli, sopra di lui: niente interattivi dentro un altro interattivo
    const nomi = [`${id}-posto`, d ? `${id}-data` : "", d && r ? `${id}-luogo ${id}-zona ${id}-corpo` : `${id}-vuoto`].filter(Boolean).join(" ");
    return (
      <div key={v.posto}
        style={{ position: "relative", gridColumn: v.posto === "auto" ? "1 / -1" : undefined,
          minHeight: "5.4em", padding: ".75em 1.2em .7em 1.5em", borderRadius: ".8em", overflow: "hidden",
          background: d ? "rgba(255,255,255,.035)" : "transparent",
          border: d ? "1px solid rgba(255,255,255,.08)" : "1px dashed rgba(255,255,255,.14)", transition: "border-color .2s, background .2s" }}
        onMouseEnter={(e) => { if (attivo) e.currentTarget.style.borderColor = accento; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = d ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.14)"; }}>
        <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: ".3em", background: colore }} />
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1em" }}>
          <span id={`${id}-posto`} style={piccolo(v.posto === "auto" ? accento : "rgba(230,222,208,.62)")}>{nomePosto(v.posto)}</span>
          {d && <span id={`${id}-data`} style={{ ...piccolo("rgba(230,222,208,.6)"), letterSpacing: ".08em", textTransform: "none" }}>{dataLeggibile(d.creato)}</span>}
        </div>
        {d && r ? (
          <>
            <div style={{ margin: ".15em 0 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: ".8em" }}>
              <p id={`${id}-luogo`} style={{ margin: 0, fontFamily: SERIF, fontSize: "1.3em", color: "#f4ece0" }}>{r.luogo}</p>
              {!inConferma && (
                <span style={{ position: "relative", zIndex: 1, display: "flex", gap: ".4em", flexShrink: 0 }}>
                  <button title="Esporta in un file" aria-label={`Esporta il ${nomePosto(v.posto).toLowerCase()} in un file`}
                    onClick={() => esegui(async () => { if (await esporta(v.posto, d)) setNota({ testo: "Salvataggio esportato." }); })}
                    style={bottoncino}>esporta</button>
                  {v.posto !== "auto" && (
                    <button title="Elimina" aria-label={`Elimina il ${nomePosto(v.posto).toLowerCase()}`}
                      onClick={() => setConferma({ tipo: "elimina", posto: v.posto, dati: d })}
                      style={bottoncino}>elimina</button>
                  )}
                </span>
              )}
            </div>
            <p id={`${id}-zona`} style={{ margin: ".15em 0 0", fontFamily: SERIF, fontStyle: "italic", fontSize: ".9em", color: "rgba(226,220,208,.72)" }}>
              {r.nomeZona} · tappa {r.tappa} di 7 · turno {r.turno}
            </p>
            <p id={`${id}-corpo`} style={{ margin: ".45em 0 0", ...piccolo("rgba(230,222,208,.68)"), letterSpacing: ".1em" }}>
              vita {r.vita} · acqua {r.acqua} · cibo {r.cibo}
              {d.gioco !== VERSIONE.gioco && <span style={{ color: accento }}> · salvato con la {d.gioco}</span>}
            </p>
          </>
        ) : (
          <p id={`${id}-vuoto`} style={{ margin: ".55em 0 0", fontFamily: SERIF, fontStyle: "italic", fontSize: ".95em", color: "rgba(226,220,208,.66)" }}>
            {v.errore ? `illeggibile: ${v.errore}` : v.posto === "auto" ? "si scrive da sé a ogni cambio di luogo" : modo === "salva" ? "posto libero · salva qui" : "vuoto"}
          </p>
        )}
        <button type="button" disabled={!attivo || inConferma} aria-labelledby={nomi} onClick={() => scegli(v)}
          onFocus={(e) => { const c = e.currentTarget.parentElement!; c.style.borderColor = accento; c.style.boxShadow = `0 0 0 2px ${accento}`; }}
          onBlur={(e) => { const c = e.currentTarget.parentElement!; c.style.borderColor = d ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.14)"; c.style.boxShadow = "none"; }}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", padding: 0, margin: 0, border: "none", background: "transparent",
            outline: "none", cursor: attivo ? "pointer" : "default" }} />
        {inConferma && conferma && (
          <div style={{ position: "absolute", inset: 0, zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1em",
              padding: "0 1.2em 0 1.5em", background: "rgba(12,11,15,.94)", backdropFilter: "blur(2px)" }}>
            <span style={{ fontFamily: SERIF, fontSize: ".98em", color: "#f4ece0" }}>
              {conferma.tipo === "sovrascrivi" && `Sovrascrivere il ${nomePosto(v.posto).toLowerCase()}?`}
              {conferma.tipo === "elimina" && `Eliminare il ${nomePosto(v.posto).toLowerCase()}?`}
              {conferma.tipo === "carica" && "Caricare? Quello che non hai salvato andrà perso."}
            </span>
            <span style={{ display: "flex", gap: ".5em", flexShrink: 0 }}>
              <button autoFocus style={{ ...bottone, background: accento, color: "#140c06", borderColor: accento }} onClick={() => {
                if (conferma.tipo === "sovrascrivi") salvaIn(v.posto);
                else if (conferma.tipo === "elimina") esegui(async () => { await elimina(v.posto); setNota({ testo: "Salvataggio eliminato." }); });
                else if (conferma.dati) caricaDa(conferma.dati);
              }}>{conferma.tipo === "sovrascrivi" ? "sovrascrivi" : conferma.tipo === "elimina" ? "elimina" : "carica"}</button>
              <button style={bottone} onClick={() => setConferma(null)}>annulla</button>
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={dialogo} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Il taccuino: salva e carica"
      style={{ outline: "none", fontSize: base, position: "absolute", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(4,4,8,.74)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", animation: "kf-launch .3s ease both", pointerEvents: "auto" }}
      onClick={onChiudi}>
      <div onClick={(e) => e.stopPropagation()} className="gv-scroll"
        style={{ width: "min(60em, 94%)", maxHeight: "94%", overflowY: "auto", boxSizing: "border-box", padding: "2.1em 2.3em 1.8em", borderRadius: "1.2em",
          background: "linear-gradient(180deg, rgba(20,18,24,.97), rgba(10,10,14,.98))", border: "1px solid rgba(255,255,255,.08)", boxShadow: "0 2em 6em rgba(0,0,0,.6)" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "1em" }}>
          <div>
            <p style={{ margin: 0, ...piccolo(accento), letterSpacing: ".3em" }}>il taccuino</p>
            <div style={{ display: "flex", gap: "1.2em", marginTop: ".3em" }}>
              {(["salva", "carica"] as Modo[]).map((m) => (
                <button key={m} disabled={m === "salva" && !puoSalvare} onClick={() => { setModo(m); setConferma(null); setNota(null); }}
                  style={{ cursor: m === "salva" && !puoSalvare ? "default" : "pointer", background: "none", border: "none", padding: "0 0 .15em",
                    fontFamily: SERIF, fontWeight: 500, fontSize: "2em", letterSpacing: "-.01em",
                    color: modo === m ? "#f4ece0" : "rgba(226,220,208,.62)", borderBottom: `2px solid ${modo === m ? accento : "transparent"}` }}>
                  {m === "salva" ? "Salva" : "Carica"}
                </button>
              ))}
            </div>
          </div>
          <button onClick={onChiudi} aria-label="Chiudi il taccuino" style={bottone}>chiudi ✕</button>
        </div>

        <p style={{ margin: "1em 0 0", minHeight: "1.4em", fontFamily: SERIF, fontStyle: "italic", fontSize: ".92em",
          color: nota?.errore ? "#f28b6b" : nota ? accento : "rgba(226,220,208,.66)" }}>
          {nota?.testo ?? (modo === "salva" ? "Scegli dove scrivere la partita." : "Scegli da dove riprendere il viaggio.")}
        </p>

        {daFile && (
          <div style={{ margin: ".6em 0 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1em", padding: ".9em 1.2em",
            borderRadius: ".8em", border: `1px solid ${accento}` }}>
            <span style={{ fontFamily: SERIF, color: "#f4ece0" }}>Caricare «{daFile.riassunto.luogo}», turno {daFile.riassunto.turno}? Quello che non hai salvato andrà perso.</span>
            <span style={{ display: "flex", gap: ".5em" }}>
              <button style={{ ...bottone, background: accento, color: "#140c06", borderColor: accento }} onClick={() => { const s = daFile; setDaFile(null); caricaDa(s); }}>carica</button>
              <button style={bottone} onClick={() => setDaFile(null)}>annulla</button>
            </span>
          </div>
        )}

        <div style={{ marginTop: "1em", display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".8em" }}>
          {voci === null ? <p style={{ fontFamily: SERIF, color: "rgba(226,220,208,.66)" }}>Si legge il taccuino…</p> : mostrati.map(scheda)}
        </div>

        <div style={{ marginTop: "1.4em", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1em", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: ".5em" }}>
            {modo === "carica" && <button style={bottone} onClick={daImportare}>apri un file…</button>}
            {archivioSuDisco() && <button style={bottone} onClick={() => apriCartella()}>apri la cartella</button>}
          </div>
          <span style={{ ...piccolo("rgba(230,222,208,.62)"), letterSpacing: ".06em", textTransform: "none" }}>
            {dove ? `${dove} · ` : "nel browser · "}Il Viaggiatore {VERSIONE.gioco} · formato {VERSIONE.formatoSalvataggi}
          </span>
        </div>
      </div>
    </div>
  );
}

const bottone: React.CSSProperties = {
  cursor: "pointer", flexShrink: 0, border: "1px solid rgba(255,255,255,.16)", background: "transparent", color: "#c9d2de", borderRadius: 999,
  fontFamily: MONO, fontSize: ".85em", letterSpacing: ".12em", textTransform: "uppercase", padding: ".6em 1em",
};
const bottoncino: React.CSSProperties = { ...bottone, fontSize: ".85em", letterSpacing: ".1em", padding: ".35em .7em", color: "rgba(201,210,222,.82)" };
