// ====================================================================
//  Dal testo stampato alle parti del doppiaggio.
// --------------------------------------------------------------------
//  Il motore (che non si tocca) consegna il testo già composto, non la riga
//  del .fav. Le parti registrate si ritrovano quindi DAL TESTO, spezzato e
//  normalizzato come in strumenti/doppiaggio.py: le parentesi sono della voce
//  di servizio, le «caporali» di chi parla (in una battuta, il personaggio;
//  in una descrizione, il narratore le legge d'un fiato), il resto è del
//  narratore; le parole in MAIUSCOLO si abbassano (i nomi dei personaggi
//  tornano con l'iniziale maiuscola). Una frase che non si trova intera si
//  cerca come fila di parti note, ai confini di frase: il motore a volte mette
//  due testi sulla stessa riga, e i fili del viaggio sono dieci frasi registrate
//  una per una che il motore incolla insieme. I numeri delle scorte si
//  ricompongono dai pezzi che la voce di servizio ha detto a lettere.
//  Niente import di runtime (solo tipi): collaudo/doppiaggio.py lo prova in
//  Node sui testi veri dei percorsi (app/scripts/parti-node.mjs).
// ====================================================================
import type { Blocco } from "./testo";

/** Il testo e la voce di ogni parte, come in app/public/voce/indice.json → «testi». */
export type Testi = Record<string, [string, string]>;
/** testo per la voce → {voce → id} */
export type Tabella = Map<string, Map<string, string>>;
export interface Ritrovate {
  ids: string[];
  /** i pezzi che dovrebbero avere voce ma non hanno una parte registrata */
  mancano: { voce: string; testo: string }[];
}

const NOMI = new Set(["NUNZIO", "SAVERIO", "IOLE", "ROCCO", "VITO", "IMMA", "ROSARIA", "PEPPE", "CIRO",
  "PASQUALE", "CONCETTA", "TORE", "ONOFRIO", "COSIMO"]);
// \b di Python è Unicode («PERCHÉ», «GIÙ»): in JavaScript serve guardare a mano chi c'è attorno
const MAIUSCOLO = /(?<![\p{L}\p{N}_])[A-ZÀ-ÖØ-Þ]{2,}(?![\p{L}\p{N}_])/gu;
const HA_LETTERE = /[A-Za-zÀ-ÿ0-9]/;
const CONFINE_DI_FRASE = /(?<=[.!?…:;])\s+/;

/** Il testo derivato per la voce: lo stesso di per_la_voce in strumenti/doppiaggio.py. */
export function perLaVoce(t: string, suggerimento = false): string {
  t = t.replace(/\\n/g, " ").replace(/\n/g, " ");
  t = t.replace(MAIUSCOLO, (w) => (NOMI.has(w) ? w[0] + w.slice(1).toLowerCase() : w.toLowerCase()));
  t = t.replace(/\s+/g, " ").trim();
  if (suggerimento) {
    t = t.slice(0, 1).toUpperCase() + t.slice(1);
    if (!/[.!?…]$/.test(t)) t += ".";
  }
  t = t.replace(/(^|[.!?…]\s+)([a-zà-ÿ])/g, (_, a: string, b: string) => a + b.toUpperCase());
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}

export function tabella(testi: Testi): Tabella {
  const t: Tabella = new Map();
  for (const [id, [voce, testo]] of Object.entries(testi)) {
    if (!t.has(testo)) t.set(testo, new Map());
    t.get(testo)!.set(voce, id);
  }
  return t;
}

type Segmento = { voce: "narratore" | "servizio" | "citazione"; testo: string };

/** Una riga nei suoi pezzi; `staccaCitazioni` = le «» sono di qualcun altro (una battuta, un messaggio). */
function segmenti(riga: string, staccaCitazioni: boolean): Segmento[] {
  const stacco = staccaCitazioni ? /(\([^)]*\)|«[^»]*»)/ : /(\([^)]*\))/;
  const out: Segmento[] = [];
  for (const pezzo of riga.split(stacco)) {
    const g = pezzo.trim();
    if (!g) continue;
    if (g.startsWith("(")) out.push({ voce: "servizio", testo: perLaVoce(g.slice(1, -1).trim(), true) });
    else if (g.startsWith("«") && staccaCitazioni) out.push({ voce: "citazione", testo: perLaVoce(g.slice(1, -1).trim()) });
    else {
      const t = g.replace(/[«»]/g, "");
      if (HA_LETTERE.test(t)) out.push({ voce: "narratore", testo: perLaVoce(t) });
    }
  }
  return out.filter((s) => HA_LETTERE.test(s.testo));
}

/** L'id di un testo per quella voce; per una citazione, chi parla se lo si sa, se no chiunque l'abbia detta. */
function cerca(tab: Tabella, voce: string, testo: string, chi?: string): string | null {
  const c = tab.get(testo);
  if (!c) return null;
  if (voce === "citazione") return (chi && c.get(chi)) || c.values().next().value || null;
  return c.get(voce) ?? null;
}

/** Una frase non trovata intera: la fila più corta di parti note che la rifà, ai confini di frase. */
function inFila(tab: Tabella, voce: string, testo: string): string[] | null {
  const pezzi = testo.split(CONFINE_DI_FRASE);
  const n = pezzi.length;
  if (n < 2) return null;
  const meglio: (string[] | null)[] = Array(n + 1).fill(null);
  meglio[0] = [];
  for (let a = 0; a < n; a++) {
    if (!meglio[a]) continue;
    for (let b = a + 1; b <= n; b++) {
      const id = cerca(tab, voce, perLaVoce(pezzi.slice(a, b).join(" ")));
      if (id && (!meglio[b] || meglio[b]!.length > meglio[a]!.length + 1)) meglio[b] = [...meglio[a]!, id];
    }
  }
  return meglio[n];
}

// I numeri delle scorte («Hai 6 d'acqua e 2 di cibo.»): la voce di servizio li ha detti a lettere, in
// pezzi con un numero solo, come li spezza scomponi_dinamico in strumenti/doppiaggio.py: «Hai sei
// d'acqua,» + «e due di cibo.». Fuori dai valori registrati (acqua 0–20, cibo 0–12) il pezzo non c'è.
const NUMERI = ["zero", "uno", "due", "tre", "quattro", "cinque", "sei", "sette", "otto", "nove", "dieci",
  "undici", "dodici", "tredici", "quattordici", "quindici", "sedici", "diciassette", "diciotto", "diciannove", "venti"];
const CIFRE = /(?<![\p{L}\p{N}])\d+(?![\p{L}\p{N}])/gu;
const E_NUMERO = new RegExp(` e (?=(?:${NUMERI.join("|")}) )`, "g");

/** Il testo coi numeri a lettere, o null se non ha cifre (o ne ha una che la voce non ha detto). */
function aLettere(t: string): string | null {
  let fuori = false;
  const r = t.replace(CIFRE, (d) => {
    const n = Number(d);
    if (n >= NUMERI.length) { fuori = true; return d; }
    return NUMERI[n];
  });
  return fuori || r === t ? null : r;
}

/** Un testo di servizio coi numeri: intero, o nei due pezzi «…,» + «e …». */
function conNumeri(tab: Tabella, t: string): string[] | null {
  const lettere = aLettere(t);
  if (!lettere) return null;
  const intero = cerca(tab, "servizio", lettere);
  if (intero) return [intero];
  for (const m of lettere.matchAll(E_NUMERO)) {
    const a = cerca(tab, "servizio", lettere.slice(0, m.index) + ",");
    const b = cerca(tab, "servizio", "e " + lettere.slice(m.index! + 3));
    if (a && b) return [a, b];
  }
  return null;
}

function ritrova(tab: Tabella, segs: Segmento[], chi?: string): Ritrovate {
  const r: Ritrovate = { ids: [], mancano: [] };
  for (const s of segs) {
    const id = cerca(tab, s.voce, s.testo, chi);
    if (id) { r.ids.push(id); continue; }
    const numeri = s.voce === "servizio" ? conNumeri(tab, s.testo) : null;
    if (numeri) { r.ids.push(...numeri); continue; }
    const fila = s.voce === "servizio" ? null : inFila(tab, s.voce === "citazione" ? (chi ?? "narratore") : "narratore", s.testo);
    if (fila) r.ids.push(...fila);
    else r.mancano.push({ voce: s.voce === "citazione" ? (chi ?? "?") : s.voce, testo: s.testo });
  }
  return r;
}

/** Le parti di una riga del diario. Le risposte del motore (sistema) e i titoli dei luoghi non hanno voce. */
export function partiDelBlocco(b: Blocco, tab: Tabella): Ritrovate {
  switch (b.tipo) {
    case "battuta":
      return ritrova(tab, segmenti(b.testo, true), b.chi);
    case "finale":
      // il narratore ha letto la riga intera, «FINALE —» compreso
      return ritrova(tab, segmenti(`FINALE — ${b.testo}`, false));
    case "prosa":
    case "corpo": {
      // in una descrizione le «» le legge il narratore d'un fiato; in un messaggio sono di chi parla:
      // la riga non dice da dove viene, quindi si prova prima così e poi cosà
      const intera = ritrova(tab, segmenti(b.testo, false));
      if (!intera.mancano.length || !b.testo.includes("«")) return intera;
      const staccata = ritrova(tab, segmenti(b.testo, true));
      return staccata.mancano.length < intera.mancano.length ? staccata : intera;
    }
    default:
      return { ids: [], mancano: [] };
  }
}

/** Una scelta di dialogo del giocatore: la legge il narratore. */
export function partiDellaScelta(opzione: string, tab: Tabella): Ritrovate {
  const testo = perLaVoce(opzione);
  if (!HA_LETTERE.test(testo)) return { ids: [], mancano: [] };   // una scelta muta («…») non ha niente da dire
  const id = cerca(tab, "narratore", testo);
  return id ? { ids: [id], mancano: [] } : { ids: [], mancano: [{ voce: "narratore", testo }] };
}

/** Le parti di più righe, con l'indice della riga di ciascuna (la pausa fra righe è più lunga). */
export function partiDeiBlocchi(blocchi: Blocco[], tab: Tabella): { parti: { id: string; riga: number }[]; mancano: Ritrovate["mancano"] } {
  const parti: { id: string; riga: number }[] = [];
  const mancano: Ritrovate["mancano"] = [];
  blocchi.forEach((b, riga) => {
    const r = partiDelBlocco(b, tab);
    for (const id of r.ids) parti.push({ id, riga });
    mancano.push(...r.mancano);
  });
  return { parti, mancano };
}
