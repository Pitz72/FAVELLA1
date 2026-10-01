// ====================================================================
//  Azioni e conferme: la logica che sta fra i pulsanti e il motore.
// --------------------------------------------------------------------
//  Nessun React qui: funzioni pure, così si leggono in un colpo solo e si
//  provano da sole. Quattro cose:
//   · quali comandi vale la pena di ANTICIPARE (chiedere al motore che cosa
//     farebbero, senza farli) e quali no;
//   · quando un comando è una SCELTA che costa e va confermata;
//   · come i verbi d'autore (attingi, curati, attacca…) e le combinazioni di
//     due cose («usa X su Y») si compongono a pulsanti, senza dire quali coppie
//     funzionano;
//   · che cosa offre il menu di una cosa, e l'elenco di tutto ciò che si può
//     fare con un tocco (il collaudo gioca i finali solo con quello).
//  Le parole sono quelle del parser: un pulsante manda sempre un comando che
//  si potrebbe anche scrivere, e nel diario compare lo stesso.
// ====================================================================
import type { Anteprima, AzioniContesto, StatoMondo } from "../lib/favellaRuntime";

// --------------------------------------------------------------------
//  Che cosa si anticipa
// --------------------------------------------------------------------
/** Primi vocaboli di comandi che non costano mai: sguardi, servizio, movimento,
 *  prendere, posare. Bere e mangiare hanno il loro pannello: lì la scelta si fa
 *  toccando la quantità. */
const SICURI = new Set([
  "guarda", "esamina", "osserva", "x", "l", "inventario", "i", "zaino", "stato", "aiuto",
  "aspetta", "attendi", "z", "annulla", "disfa", "ancora", "ripeti", "g", "salva", "carica",
  "sì", "si", "no", "parla", "prendi", "raccogli", "lascia", "posa",
  "bevi", "bere", "mangia", "mangiare",
  "nord", "sud", "est", "ovest", "n", "s", "e", "o", "su", "giù", "giu", "entra", "esci", "sali", "scendi", "vai",
]);

export function serveAnteprima(cmd: string, mondo: StatoMondo): boolean {
  const c = cmd.trim().toLowerCase();
  if (!c) return false;
  if (mondo.dialog) return true;                                  // ogni risposta di dialogo può costare
  if ((mondo.exits ?? []).some((u) => u.dir === c)) return false;
  return !SICURI.has(c.split(/\s+/)[0]);
}

// --------------------------------------------------------------------
//  Le scelte che costano
// --------------------------------------------------------------------
export type TipoConferma = "scambio" | "perdita" | "danno" | "violenza" | "svolta" | "fine";

export interface Conferma {
  tipo: TipoConferma;
  segno: string;              // la piccola intestazione, in maiuscoletto
  domanda: string;
  perdi: string[];
  ottieni: string[];
  pesa: string[];             // ciò che non si perde ma costa: più sete, più fame
  spreco: string;             // ciò che il tetto della tanica rimanderebbe indietro, a parole (o vuoto)
  dopo: string;               // le scorte come resterebbero
}

/** Stati che il motore cambia con una scelta e che spostano la storia: chi viene
 *  con te, chi ti dà che cosa. Si riconoscono dal nome, non dal testo. */
const STATI_DI_SVOLTA = new Set(["stato di peppe", "stato del lascito"]);
/** I verbi della violenza e il loro infinito per la domanda («Vuoi davvero sparare a
 *  Cosimo?»). Gli altri nomi di «attacca» (uccidi, picchia…) sono sinonimi nella storia. */
const VERBI_DI_VIOLENZA: Record<string, string> = {
  attacca: "attaccare", minaccia: "minacciare", colpisci: "colpire", spara: "sparare a",
  uccidi: "uccidere", ammazza: "ammazzare", picchia: "picchiare", aggredisci: "aggredire",
};

/** «sparare a» + «il cane» → «sparare al cane». */
const conPreposizioneA = (gesto: string, persona: string) => {
  if (!gesto.endsWith(" a")) return `${gesto} ${persona}`;
  const base = gesto.slice(0, -2);
  const m = persona.match(/^(il|lo|la|i|gli|le|l')\s*(.*)$/);
  if (!m) return `${base} a ${persona}`;
  const art: Record<string, string> = { il: "al", lo: "allo", la: "alla", i: "ai", gli: "agli", le: "alle", "l'": "all'" };
  return `${base} ${art[m[1]]}${m[1] === "l'" ? "" : " "}${m[2]}`;
};

const R = {
  acqua: (n: number) => `${n} d'acqua`,
  cibo: (n: number) => `${n} di cibo`,
  vita: (n: number) => `${n} di vita`,
} as const;
const RISORSE = ["acqua", "cibo", "vita"] as const;

/** Che cosa dice il tetto, quando il gesto dà più di quanto la tanica (o la bisaccia, o il
 *  corpo) tenga: «La tanica tiene 10: 2 d'acqua andrebbero persi.» */
function dicoLoSpreco(a: Anteprima): string {
  const sp = a.sprecato ?? {};
  const frasi: string[] = [];
  const acqua = sp.acqua ?? 0;
  if (acqua > 0) {
    const d = a.delta.acqua ?? 0, tetto = a.dopo.acqua ?? 0;
    frasi.push(acqua >= d
      ? `La tanica è già piena (${tetto}): quest'acqua andrebbe persa.`
      : `La tanica tiene ${tetto}: ${acqua} d'acqua andrebbero persi.`);
  }
  const cibo = sp.cibo ?? 0;
  if (cibo > 0) frasi.push(`Il cibo che entra è meno di quello che ricevi: ${cibo} di cibo andrebbero persi.`);
  return frasi.join(" ");
}

export const conArticolo = (nome: string) =>
  nome.replace(/^(Il|Lo|La|L'|I|Gli|Le|Un|Uno|Una)(?=\b|')/, (a) => a.toLowerCase());

/** Il comando è una scelta da confermare? Dice di sì con una Conferma già scritta. */
export function valutaConferma(cmd: string, a: Anteprima, mondo: StatoMondo): Conferma | null {
  if (!a.ok || !a.capito) return null;
  const parole = cmd.trim().toLowerCase().split(/\s+/);
  const verbo = parole[0];
  const perdi: string[] = a.perde.map((o) => o.nome);
  const ottieni: string[] = a.ottiene.map((o) => o.nome);
  let persoRisorse = false, presoRisorse = false;
  for (const k of RISORSE) {
    const d = a.delta[k] ?? 0;
    if (d < 0) { perdi.push(R[k](-d)); persoRisorse = true; }
    if (d > 0) {
      const persi = Math.min(d, a.sprecato?.[k] ?? 0);
      ottieni.push(persi === 0 ? R[k](d) : `${R[k](d)} (${d - persi > 0 ? `ne entrano ${d - persi}` : "non ne entra"})`);
      presoRisorse = true;
    }
  }
  const pesa: string[] = [];
  for (const [k, nome] of [["sete", "sete"], ["fame", "fame"]] as const) {
    const d = a.delta[k] ?? 0;
    if (d > 0) pesa.push(`${nome} +${d}`);
  }
  const haPerso = a.perde.length > 0 || persoRisorse;
  const haPreso = a.ottiene.length > 0 || presoRisorse;
  const dopo = RISORSE.slice(0, 2).map((k) => `${k} ${a.dopo[k] ?? mondo.counters[k] ?? 0}`).join(" · ");
  const base = { perdi, ottieni, pesa, spreco: dicoLoSpreco(a), dopo };
  // «spara al cane», «attacca il cane», «spara a Cosimo» → «cane», «Cosimo»
  const bersaglio = parole.slice(1).join(" ")
    .replace(/^(a|ad|al|allo|alla|ai|agli|alle|contro)\s+|^all'/, "")
    .replace(/^(il|lo|la|i|gli|le)\s+|^l'/, "");
  const chi = bersaglio ? (mondo.present ?? []).find((p) => p.id === bersaglio)?.nome ?? bersaglio : "";
  const persona = chi ? conArticolo(chi) : "";

  if (a.esito !== "in_corso") {
    return { tipo: "fine", segno: "la fine", domanda: "Questa scelta chiude il viaggio. Vuoi procedere?", ...base };
  }
  if (a.stati.some((s) => STATI_DI_SVOLTA.has(s.nome))) {
    return { tipo: "svolta", segno: "una svolta", domanda: "Questa scelta pesa sul resto del viaggio. Vuoi confermarla?", ...base };
  }
  const cambiaQualcosa = a.stati.length > 0 || Object.keys(a.delta).length > 0 || haPerso || haPreso;
  const gesto = VERBI_DI_VIOLENZA[verbo];
  if (gesto && cambiaQualcosa) {
    return { tipo: "violenza", segno: "la violenza costa",
      domanda: persona ? `Vuoi davvero ${conPreposizioneA(gesto, persona)}?` : "Vuoi davvero alzare le mani?", ...base };
  }
  // ciò che costa solo vita (l'acqua salmastra): non è un dono né un baratto, è un danno
  if ((a.delta.vita ?? 0) < 0 && a.perde.length === 0 && !(a.delta.acqua < 0) && !(a.delta.cibo < 0)) {
    return { tipo: "danno", segno: "ti fa male", domanda: "Ti costa vita. Vuoi farlo lo stesso?", ...base };
  }
  if (haPerso && haPreso) return { tipo: "scambio", segno: "uno scambio", domanda: "Vuoi fare questo scambio?", ...base };
  // un dono di sole scorte («Tieni, mangia»): si dice che cosa si dà, non «rinunciarci»
  if (haPerso && a.perde.length === 0) {
    return { tipo: "perdita", segno: "si dà qualcosa", domanda: `Vuoi davvero dare ${perdi.join(" e ")}?`, ...base };
  }
  if (haPerso) return { tipo: "perdita", segno: "si perde qualcosa", domanda: "Vuoi davvero rinunciarci?", ...base };
  return null;
}

// --------------------------------------------------------------------
//  Bere e mangiare
// --------------------------------------------------------------------
export interface Dose { cmd: string; etichetta: string }
export interface Pasto {
  titolo: string;             // «Vuoi bere?»
  risorsa: "acqua" | "cibo";
  bisogno: "sete" | "fame";
  doni: Dose[];
}
export const PASTI: Record<"bere" | "mangiare", Pasto> = {
  bere: {
    titolo: "Vuoi bere?", risorsa: "acqua", bisogno: "sete",
    doni: [
      { cmd: "bevi", etichetta: "Un sorso" },
      { cmd: "bevi due sorsi", etichetta: "Due sorsi" },
      { cmd: "bevi tre sorsi", etichetta: "Tre sorsi" },
    ],
  },
  mangiare: {
    titolo: "Vuoi mangiare?", risorsa: "cibo", bisogno: "fame",
    doni: [
      { cmd: "mangia qualcosa", etichetta: "Una porzione" },
      { cmd: "mangia due porzioni", etichetta: "Due porzioni" },
      { cmd: "mangia tre porzioni", etichetta: "Tre porzioni" },
    ],
  },
};

export interface Previsione {
  dose: Dose;
  buona: boolean;             // il comando consuma davvero la scorta
  quanto: string;             // «sete 8 → 0 · acqua 3 → 1»
  motivo: string;             // se no, la frase del gioco
}

/** Le dosi che vale la pena di offrire, con ciò che ciascuna farebbe. Si ferma alla
 *  prima che toglie tutto il bisogno: una dose in più sarebbe acqua sprecata. */
export function previsioni(p: Pasto, mondo: StatoMondo, anteprima: (cmd: string) => Anteprima): { dosi: Previsione[]; motivo: string } {
  const c = mondo.counters;
  const dosi: Previsione[] = [];
  let motivo = "";
  for (const dose of p.doni) {
    const a = anteprima(dose.cmd);
    const consumo = a.ok && a.capito && (a.delta[p.risorsa] ?? 0) < 0;
    const frase = (a.testo || "").split("\n").map((r) => r.trim()).find(Boolean) ?? "";
    if (!consumo) {
      if (!dosi.length) { motivo = frase; break; }              // nemmeno la prima: niente da offrire
      dosi.push({ dose, buona: false, quanto: "", motivo: frase });
      break;
    }
    // il gioco porta a zero la sete o la fame a fine turno («Ogni turno se la sete è meno di 0…»)
    const resta = Math.max(0, a.dopo[p.bisogno] ?? 0);
    dosi.push({
      dose, buona: true, motivo: "",
      quanto: `${p.bisogno} ${c[p.bisogno] ?? 0} → ${resta} · ${p.risorsa} ${c[p.risorsa] ?? 0} → ${a.dopo[p.risorsa] ?? 0}`,
    });
    if (resta <= 0) break;
  }
  return { dosi, motivo };
}

// --------------------------------------------------------------------
//  I verbi d'autore come pulsanti
// --------------------------------------------------------------------
export interface Chip { chiave: string; cmd: string; etichetta: string }

/** Verbo scritto dall'autore → il comando che il pulsante manda e come si legge.
 *  Le altre parole dello stesso gesto («getta il cibo», «lancia cibo»…) sono sinonimi nella
 *  storia (z2-piana.fav): il motore le porta a «getta cibo», e qui basta una voce.
 *  I verbi che non compaiono qui (bevi, mangia…) hanno già un altro posto. */
const NOTE: Record<string, Chip> = {
  "attingi": { chiave: "attingi", cmd: "attingi", etichetta: "Attingi" },
  "curati": { chiave: "curati", cmd: "curati", etichetta: "Curati" },
  "getta cibo": { chiave: "getta cibo", cmd: "getta cibo", etichetta: "Getta il cibo" },
  "bevi salmastra": { chiave: "bevi salmastra", cmd: "bevi salmastra", etichetta: "Bevi l'acqua salmastra" },
};
const VERBI_CON_BERSAGLIO: Record<string, string> = { attacca: "Attacca", minaccia: "Minaccia", raddrizza: "Raddrizza" };

export function chipDiContesto(az: AzioniContesto): Chip[] {
  const out: Chip[] = [];
  const visti = new Set<string>();
  const metti = (c: Chip) => { if (!visti.has(c.chiave)) { visti.add(c.chiave); out.push(c); } };
  for (const v of az.soli) { const n = NOTE[v]; if (n) metti(n); }
  for (const b of az.bersagli) {
    const gesto = VERBI_CON_BERSAGLIO[b.verbo];
    if (gesto) metti({ chiave: `${b.verbo} ${b.id}`, cmd: `${b.verbo} ${b.id}`, etichetta: `${gesto} ${conArticolo(b.nome)}` });
  }
  return out;
}

// --------------------------------------------------------------------
//  Il menu di una cosa
// --------------------------------------------------------------------
/** Una cosa toccata: nel luogo («qui») o nella bisaccia («zaino»). */
export interface Cosa { tipo: "qui" | "zaino"; id: string; nome: string; persona?: boolean; prendibile?: boolean }
/** Una voce del menu: manda un comando, oppure apre il pannello del bere o la scelta
 *  della seconda cosa («usa su…»). */
export interface Voce { etichetta: string; cmd?: string; pannello?: "bere" | "usa"; pieno?: boolean }

/** Ciò che si può fare con una cosa: parlare, esaminare, prendere, lasciare, i gesti
 *  d'autore che l'hanno per bersaglio (attacca il cane) e «usa su…», che è lo stesso per
 *  ogni cosa: il gioco non dice quali combinazioni funzionano. */
export function vociDelMenu(cosa: Cosa, mondo: StatoMondo, az: AzioniContesto): Voce[] {
  const voci: Voce[] = [];
  if (cosa.tipo === "qui") {
    if (cosa.persona) voci.push({ etichetta: "parla con", cmd: `parla con ${cosa.id}`, pieno: true });
    for (const b of az.bersagli) {
      if (b.id === cosa.id && VERBI_CON_BERSAGLIO[b.verbo]) voci.push({ etichetta: b.verbo, cmd: `${b.verbo} ${b.id}` });
    }
    voci.push({ etichetta: "esamina", cmd: `esamina ${cosa.id}` });
    if (cosa.prendibile) voci.push({ etichetta: "prendi", cmd: `prendi ${cosa.id}` });
    if (bersagliDelUso(cosa, mondo).length > 0) voci.push({ etichetta: "usa su questo…", pannello: "usa" });
  } else {
    if (cosa.id === "tanica") voci.push({ etichetta: "bevi…", pannello: "bere", pieno: true });
    voci.push({ etichetta: "esamina", cmd: `esamina ${cosa.id}` });
    if (bersagliDelUso(cosa, mondo).length > 0) voci.push({ etichetta: "usa su…", pannello: "usa" });
    if (cosa.id !== "tanica") voci.push({ etichetta: "lascia", cmd: `lascia ${cosa.id}` });
  }
  return voci;
}

/** La seconda cosa di «usa X su Y», scelta fra tutto ciò che c'è: nessuna è segnata come
 *  quella giusta. Per una cosa della bisaccia: le cose del luogo e le altre della bisaccia;
 *  per una cosa del luogo: le cose della bisaccia. */
export function bersagliDelUso(cosa: Cosa, mondo: StatoMondo): { etichetta: string; cmd: string }[] {
  if (cosa.tipo === "zaino") {
    const qui = (mondo.present ?? []).map((p) => ({ etichetta: p.nome, id: p.id }));
    const altre = mondo.inventory.map((n) => ({ etichetta: n, id: senzaArticolo(n) })).filter((o) => o.id !== cosa.id);
    return [...qui, ...altre].map((o) => ({ etichetta: o.etichetta, cmd: `usa ${cosa.id} su ${o.id}` }));
  }
  return mondo.inventory.map((n) => ({ etichetta: n, cmd: `usa ${senzaArticolo(n)} su ${cosa.id}` }));
}

/** Tutti i comandi che l'interfaccia può mandare adesso con un tocco: le uscite, gli
 *  sguardi, le dosi, le azioni del luogo, i menu di ogni cosa, le risposte. È ciò che
 *  ViaggiatorePlayer mette sullo schermo (con le stesse funzioni); il collaudo
 *  (collaudo/pulsanti.py) lo usa per giocare ogni finale senza tastiera. */
export function comandiOfferti(mondo: StatoMondo, az: AzioniContesto): string[] {
  const out: string[] = [];
  if (mondo.conferma) out.push("sì", "no");
  if (mondo.dialog) {
    mondo.dialog.opzioni.forEach((_, i) => out.push(String(i + 1)));
    return out;
  }
  for (const u of mondo.exits ?? []) out.push(u.dir);
  out.push("guarda", "inventario", "stato", "aspetta");
  for (const p of Object.values(PASTI)) for (const d of p.doni) out.push(d.cmd);
  for (const ch of chipDiContesto(az)) out.push(ch.cmd);
  for (const p of mondo.present ?? []) {
    for (const v of vociDelMenu({ tipo: "qui", id: p.id, nome: p.nome, persona: p.persona, prendibile: p.prendibile }, mondo, az)) if (v.cmd) out.push(v.cmd);
  }
  for (const n of mondo.inventory) {
    const cosa: Cosa = { tipo: "zaino", id: senzaArticolo(n), nome: n };
    for (const v of vociDelMenu(cosa, mondo, az)) if (v.cmd) out.push(v.cmd);
    for (const u of bersagliDelUso(cosa, mondo)) out.push(u.cmd);        // «usa X su Y»: ogni coppia si può comporre
  }
  if ((mondo.undo ?? 0) > 0) out.push("annulla");
  return Array.from(new Set(out));
}

// --------------------------------------------------------------------
//  Nomi e parole del testo
// --------------------------------------------------------------------
/** «Il cane» → «cane», «L'orologio» → «orologio»: come l'id che il motore dà agli oggetti. */
export const senzaArticolo = (s: string) =>
  s.replace(/^(il|lo|la|i|gli|le|un|uno|una)\s+/i, "").replace(/^(l'|un')/i, "").toLowerCase();
