// ====================================================================
//  Il taccuino: salvare e caricare la partita.
// --------------------------------------------------------------------
//  Due schede. SALVA: sei posti; uno vuoto si scrive subito, uno pieno chiede
//  conferma. CARICA: il posto automatico (scritto a ogni cambio di luogo) e
//  i sei manuali; se c'è una partita in corso non salvata, chiede conferma.
//  Ogni posto si può esportare in un file o eliminare; un file si importa.
//  Misure in em (prop `base`), come la guida: vale per la superficie 1280 del
//  gioco e per quella 1920 del menu del trailer.
// ====================================================================
import { useCallback, useEffect, useState } from "react";
import {
  type Posto, type Salvataggio, type VoceTaccuino,
  archivioSuDisco, apriCartella, cartella, dataLeggibile, elenco, elimina, esporta, importa, nomePosto,
} from "../lib/salvataggi";
import { ZONE_THEME, type ZoneKey } from "../data/viaggiatore";
import { VERSIONE } from "../lib/versione";

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
  fontFamily: MONO, fontSize: ".68em", letterSpacing: ".22em", textTransform: "uppercase", color: colore,
});

export default function Taccuino({ base, modo: modoIniziale, accento = "#f0b77e", puoSalvare, avvisaPerdita = false, onSalva, onCarica, onChiudi }: Props) {
  const [modo, setModo] = useState<Modo>(puoSalvare ? modoIniziale : "carica");
  const [voci, setVoci] = useState<VoceTaccuino[] | null>(null);
  const [conferma, setConferma] = useState<Conferma>(null);
  const [nota, setNota] = useState<{ testo: string; errore?: boolean } | null>(null);
  const [occupato, setOccupato] = useState(false);
  const [dove, setDove] = useState<string | null>(null);
  const [daFile, setDaFile] = useState<Salvataggio | null>(null);

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
    return (
      <div key={v.posto} role="button" tabIndex={attivo ? 0 : -1} aria-disabled={!attivo}
        onClick={() => attivo && !inConferma && scegli(v)}
        onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && attivo && !inConferma) { e.preventDefault(); scegli(v); } }}
        style={{ position: "relative", gridColumn: v.posto === "auto" ? "1 / -1" : undefined, cursor: attivo ? "pointer" : "default",
          minHeight: "6.4em", padding: "1em 1.2em 1em 1.5em", borderRadius: ".8em", overflow: "hidden", outline: "none",
          background: d ? "rgba(255,255,255,.035)" : "transparent",
          border: d ? "1px solid rgba(255,255,255,.08)" : "1px dashed rgba(255,255,255,.14)",
          opacity: attivo ? 1 : 0.45, transition: "border-color .2s, background .2s" }}
        onMouseEnter={(e) => { if (attivo) e.currentTarget.style.borderColor = accento; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = d ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.14)"; }}>
        <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: ".3em", background: colore }} />
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1em" }}>
          <span style={piccolo(v.posto === "auto" ? accento : "rgba(230,222,208,.55)")}>{nomePosto(v.posto)}</span>
          {d && <span style={{ ...piccolo("rgba(230,222,208,.5)"), letterSpacing: ".08em", textTransform: "none" }}>{dataLeggibile(d.creato)}</span>}
        </div>
        {d && r ? (
          <>
            <p style={{ margin: ".3em 0 0", fontFamily: SERIF, fontSize: "1.35em", color: "#f4ece0" }}>{r.luogo}</p>
            <p style={{ margin: ".2em 0 0", fontFamily: SERIF, fontStyle: "italic", fontSize: ".88em", color: "rgba(226,220,208,.68)" }}>
              {r.nomeZona} · tappa {r.tappa} di 7 · turno {r.turno}
            </p>
            <p style={{ margin: ".55em 0 0", ...piccolo("rgba(230,222,208,.62)"), letterSpacing: ".12em" }}>
              vita {r.vita} · acqua {r.acqua} · cibo {r.cibo}
              {d.gioco !== VERSIONE.gioco && <span style={{ color: accento }}> · salvato con la {d.gioco}</span>}
            </p>
          </>
        ) : (
          <p style={{ margin: ".55em 0 0", fontFamily: SERIF, fontStyle: "italic", fontSize: ".95em", color: "rgba(226,220,208,.45)" }}>
            {v.errore ? `illeggibile: ${v.errore}` : v.posto === "auto" ? "si scrive da sé a ogni cambio di luogo" : modo === "salva" ? "posto libero · salva qui" : "vuoto"}
          </p>
        )}
        {d && !inConferma && (
          <div style={{ position: "absolute", right: ".8em", bottom: ".7em", display: "flex", gap: ".4em" }}>
            <button title="Esporta in un file" onClick={(e) => { e.stopPropagation(); esegui(async () => { if (await esporta(v.posto, d)) setNota({ testo: "Salvataggio esportato." }); }); }}
              style={bottoncino}>esporta</button>
            {v.posto !== "auto" && (
              <button title="Elimina" onClick={(e) => { e.stopPropagation(); setConferma({ tipo: "elimina", posto: v.posto, dati: d }); }}
                style={bottoncino}>elimina</button>
            )}
          </div>
        )}
        {inConferma && conferma && (
          <div onClick={(e) => e.stopPropagation()}
            style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1em",
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
    <div role="dialog" aria-modal="true" aria-label="Il taccuino: salva e carica"
      style={{ fontSize: base, position: "absolute", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center",
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
                    color: modo === m ? "#f4ece0" : "rgba(226,220,208,.32)", borderBottom: `2px solid ${modo === m ? accento : "transparent"}` }}>
                  {m === "salva" ? "Salva" : "Carica"}
                </button>
              ))}
            </div>
          </div>
          <button onClick={onChiudi} aria-label="Chiudi il taccuino" style={bottone}>chiudi ✕</button>
        </div>

        <p style={{ margin: "1em 0 0", minHeight: "1.4em", fontFamily: SERIF, fontStyle: "italic", fontSize: ".92em",
          color: nota?.errore ? "#f28b6b" : nota ? accento : "rgba(226,220,208,.55)" }}>
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
          {voci === null ? <p style={{ fontFamily: SERIF, color: "rgba(226,220,208,.5)" }}>Si legge il taccuino…</p> : mostrati.map(scheda)}
        </div>

        <div style={{ marginTop: "1.4em", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1em", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: ".5em" }}>
            {modo === "carica" && <button style={bottone} onClick={daImportare}>apri un file…</button>}
            {archivioSuDisco() && <button style={bottone} onClick={() => apriCartella()}>apri la cartella</button>}
          </div>
          <span style={{ ...piccolo("rgba(230,222,208,.4)"), letterSpacing: ".08em", textTransform: "none", fontSize: ".66em" }}>
            {dove ? `${dove} · ` : "nel browser · "}Il Viaggiatore {VERSIONE.gioco} · formato {VERSIONE.formatoSalvataggi}
          </span>
        </div>
      </div>
    </div>
  );
}

const bottone: React.CSSProperties = {
  cursor: "pointer", flexShrink: 0, border: "1px solid rgba(255,255,255,.16)", background: "transparent", color: "#c9d2de", borderRadius: 999,
  fontFamily: MONO, fontSize: ".72em", letterSpacing: ".16em", textTransform: "uppercase", padding: ".65em 1.1em",
};
const bottoncino: React.CSSProperties = { ...bottone, fontSize: ".6em", padding: ".45em .8em", color: "rgba(201,210,222,.75)" };
