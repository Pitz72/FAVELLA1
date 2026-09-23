// ====================================================================
//  Salvataggi: il formato dei file e dove vivono.
// --------------------------------------------------------------------
//  Un salvataggio è un file JSON leggibile (estensione .viaggiatore):
//    - chi l'ha scritto: versione del gioco, del motore, del formato, commit;
//    - il riassunto per il taccuino (luogo, tappa, turno, corpo, scorte);
//    - la PARTITA: la sequenza effettiva dei comandi + l'impronta dello stato
//      (vedi app/src/lib/ponte.py: caricare = rigiocare e verificare);
//    - il DIARIO, per ritrovare a schermo la pagina com'era.
//
//  Desktop: file veri in Documenti/Il Viaggiatore/Salvataggi (IPC col processo
//  principale, scrittura atomica e copia di riserva). Browser: localStorage,
//  con esportazione/importazione di file.
// ====================================================================
import type { Blocco } from "../gioco/testo";
import type { PartitaSalvata } from "./favellaRuntime";
import { VERSIONE } from "./versione";

export const FORMATO = "il-viaggiatore/salvataggio";
export const POSTI = ["auto", "1", "2", "3", "4", "5", "6"] as const;
export type Posto = (typeof POSTI)[number];
export const POSTI_MANUALI = POSTI.filter((p) => p !== "auto");

export interface VoceSalvata { cmd?: string; blocchi: Blocco[] }

export interface Riassunto {
  luogo: string;
  zona: string;       // chiave z1…z7
  nomeZona: string;
  tappa: number;
  turno: number;
  vita: number; sete: number; fame: number; acqua: number; cibo: number;
}

export interface Salvataggio {
  formato: typeof FORMATO;
  versioneFormato: number;
  gioco: string;
  motore: string;
  commit: string;
  creato: string;     // ISO 8601
  posto: Posto;
  riassunto: Riassunto;
  partita: PartitaSalvata;
  diario: { voci: VoceSalvata[]; incontrati: string[]; storia: string[] };
}

export interface VoceTaccuino { posto: Posto; dati: Salvataggio | null; errore?: string }

/** Quante voci del diario entrano nel file (le ultime): la pagina, non l'archivio. */
export const VOCI_NEL_FILE = 160;

// ── validazione ─────────────────────────────────────────────────────────────
export class SalvataggioNonValido extends Error {}

export function valida(grezzo: unknown): Salvataggio {
  const s = grezzo as Partial<Salvataggio>;
  if (!s || typeof s !== "object" || s.formato !== FORMATO) {
    throw new SalvataggioNonValido("Non è un salvataggio del Viaggiatore.");
  }
  if (typeof s.versioneFormato !== "number" || s.versioneFormato < 1) {
    throw new SalvataggioNonValido("Il file è danneggiato: manca la versione del formato.");
  }
  if (s.versioneFormato > VERSIONE.formatoSalvataggi) {
    throw new SalvataggioNonValido(`Salvato con una versione più recente del gioco (${s.gioco ?? "?"}): aggiorna Il Viaggiatore per aprirlo.`);
  }
  const p = s.partita;
  if (!p || !Array.isArray(p.comandi) || p.comandi.some((c) => typeof c !== "string") || typeof p.impronta !== "string") {
    throw new SalvataggioNonValido("Il file è danneggiato: la partita non è leggibile.");
  }
  if (!s.riassunto || typeof s.riassunto.luogo !== "string") {
    throw new SalvataggioNonValido("Il file è danneggiato: manca il riassunto.");
  }
  // migrazioni dai formati precedenti: qui, quando il formato cambierà
  return {
    ...s,
    diario: s.diario && Array.isArray(s.diario.voci) ? s.diario : { voci: [], incontrati: [], storia: [] },
  } as Salvataggio;
}

export const leggiTesto = (testo: string): Salvataggio => {
  let dati: unknown;
  try { dati = JSON.parse(testo); } catch { throw new SalvataggioNonValido("Il file non è leggibile (JSON non valido)."); }
  return valida(dati);
};

// ── archivio ────────────────────────────────────────────────────────────────
interface ArchivioDesktop {
  elenco: () => Promise<{ posto: string; testo: string | null; errore?: string }[]>;
  scrivi: (posto: string, testo: string) => Promise<void>;
  elimina: (posto: string) => Promise<void>;
  esporta: (posto: string, nomeSuggerito: string) => Promise<boolean>;
  importa: () => Promise<string | null>;
  cartella: () => Promise<string>;
  apriCartella: () => Promise<void>;
}
const desktop = (): ArchivioDesktop | undefined =>
  (window as unknown as { viaggiatoreDesktop?: { salvataggi?: ArchivioDesktop } }).viaggiatoreDesktop?.salvataggi;

const CHIAVE = (p: Posto) => `il-viaggiatore/posto/${p}`;
const web = {
  leggi(p: Posto): string | null { try { return localStorage.getItem(CHIAVE(p)); } catch { return null; } },
  scrivi(p: Posto, t: string) { localStorage.setItem(CHIAVE(p), t); },
  elimina(p: Posto) { try { localStorage.removeItem(CHIAVE(p)); } catch { /* niente */ } },
};

export async function elenco(): Promise<VoceTaccuino[]> {
  const d = desktop();
  const grezzi: Record<string, { testo: string | null; errore?: string }> = {};
  if (d) for (const r of await d.elenco()) grezzi[r.posto] = r;
  else for (const p of POSTI) grezzi[p] = { testo: web.leggi(p) };
  return POSTI.map((posto) => {
    const g = grezzi[posto];
    if (!g?.testo) return { posto, dati: null, errore: g?.errore };
    try { return { posto, dati: leggiTesto(g.testo) }; }
    catch (e) { return { posto, dati: null, errore: e instanceof Error ? e.message : String(e) }; }
  });
}

export async function scrivi(posto: Posto, s: Salvataggio): Promise<void> {
  const testo = JSON.stringify({ ...s, posto }, null, 1);
  const d = desktop();
  if (d) await d.scrivi(posto, testo);
  else web.scrivi(posto, testo);
}

export async function elimina(posto: Posto): Promise<void> {
  const d = desktop();
  if (d) await d.elimina(posto);
  else web.elimina(posto);
}

export const nomeFile = (s: Salvataggio) =>
  `il-viaggiatore-${s.riassunto.luogo.toLowerCase().replace(/[^a-zà-ù0-9]+/gi, "-").replace(/^-|-$/g, "")}-turno-${s.riassunto.turno}.viaggiatore`;

export async function esporta(posto: Posto, s: Salvataggio): Promise<boolean> {
  const d = desktop();
  if (d) return d.esporta(posto, nomeFile(s));
  const blob = new Blob([JSON.stringify(s, null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nomeFile(s);
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return true;
}

/** Sceglie un file e lo restituisce validato (null se l'utente annulla). */
export async function importa(): Promise<Salvataggio | null> {
  const d = desktop();
  if (d) {
    const testo = await d.importa();
    return testo === null ? null : leggiTesto(testo);
  }
  return new Promise((risolvi, rifiuta) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".viaggiatore,.json,application/json";
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return risolvi(null);
      try { risolvi(leggiTesto(await f.text())); } catch (e) { rifiuta(e); }
    };
    input.click();
  });
}

export const cartella = async (): Promise<string | null> => (desktop() ? desktop()!.cartella() : null);
export const apriCartella = async () => { await desktop()?.apriCartella(); };
export const archivioSuDisco = () => !!desktop();

/** Il salvataggio più recente fra tutti i posti, automatico compreso. */
export async function piuRecente(): Promise<Salvataggio | null> {
  const voci = (await elenco()).filter((v) => v.dati).map((v) => v.dati!);
  voci.sort((a, b) => b.creato.localeCompare(a.creato));
  return voci[0] ?? null;
}

// ── composizione di un salvataggio ──────────────────────────────────────────
export function componi(posto: Posto, partita: PartitaSalvata, riassunto: Riassunto,
  diario: Salvataggio["diario"]): Salvataggio {
  return {
    formato: FORMATO,
    versioneFormato: VERSIONE.formatoSalvataggi,
    gioco: VERSIONE.gioco,
    motore: partita.motore,
    commit: VERSIONE.commit,
    creato: new Date().toISOString(),
    posto,
    riassunto,
    partita,
    diario: { ...diario, voci: diario.voci.slice(-VOCI_NEL_FILE) },
  };
}

const MESI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
export function dataLeggibile(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0"), mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`;
}

export const nomePosto = (p: Posto) => (p === "auto" ? "Automatico" : `Posto ${p}`);
