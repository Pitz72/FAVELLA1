// ====================================================================
//  Runtime FAVELLA nel browser, via Pyodide.
//  Carica il motore Python VERO (compilatore + gioco, puro Python +
//  Lark) e lo pilota con lo stesso contratto headless del sidecar IDE:
//  compila_mondo(entry) → mostra_stanza → elabora_comando(cmd), con
//  l'output catturato da redirect_stdout. Vedi favella_server.py.
//
//  Pyodide è pesante (qualche MB): si carica UNA volta, PIGRO, solo
//  quando si apre una cassetta-gioco. Il browser lo mette in cache.
// ====================================================================

// [SITO] Copia del sorgente dell'app di «Il Viaggiatore» (repository
// Pitz72/il-viaggiatore-favella), adattata al sito in DUE punti soltanto:
//  1. Pyodide dalla CDN (versione pinnata, la stessa del pacchetto npm del
//     gioco): l'hosting di favella.eu risponde 403 ai .json, quindi
//     pyodide-lock.json non si può servire da qui. Lark arriva con micropip.
//  2. Il motore sta in /favella-engine/ alla RADICE del dominio, condiviso col
//     sito, non sotto /esperimento/.
// Tutto il resto è identico al gioco: per aggiornarlo si ricopia app/src.
const PYODIDE_VERSION = "v0.27.2";
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;

// I moduli del motore sono serviti come «.fav» PURO (strutture.fav, …): l'hosting
// del deploy reale risponde 403 ai file .py, e con «.py» in MEZZO al nome
// (strutture.py.fav) Apache valuta anche quell'estensione e prova a ESEGUIRE il
// file come script (HTTP 500). Quindi: niente «.py» nel nome servito, da
// nessuna parte. Nel FS di Pyodide il file è scritto col nome vero (.py),
// così gli import Python restano invariati.
// NB: dal motore 1.0.1 il modulo di utilità si chiama «favella_utils» (igiene del
// namespace nel pacchetto pip). Deve combaciare col file in /favella-engine/engine/.
const ENGINE_FILES = ["favella_utils.py", "strutture.py", "libreria_azioni.py", "compilatore.py", "gioco.py"];

// [SITO] Percorso ASSOLUTO: con base '/esperimento/' BASE_URL porterebbe a un
// 404 sul motore. fetchTesto diagnostica comunque l'eventuale HTML del fallback
// SPA al posto del .fav.
const ENGINE_ROOT = "/favella-engine/";
const asset = (p: string) => `${ENGINE_ROOT}${p}`;

// Fetch di un sorgente testuale con DIAGNOSI: se il server risponde male (403
// del hosting sui .py) o restituisce la pagina del sito al posto del file
// (riscrittura SPA sui percorsi inesistenti), fallire con un messaggio chiaro
// invece di scrivere HTML nel filesystem Python (che darebbe SyntaxError).
async function fetchTesto(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Il server ha rifiutato «${url}» (HTTP ${res.status}).`);
  }
  const testo = await res.text();
  const inizio = testo.trimStart().slice(0, 15).toLowerCase();
  if (inizio.startsWith("<!doctype") || inizio.startsWith("<html")) {
    throw new Error(`«${url}» non è stato trovato sul server (è arrivata una pagina HTML al suo posto).`);
  }
  return testo;
}

export type StatoPartita = "in_corso" | "vinta" | "persa" | "terminata" | string;
export interface TurnoEsito {
  text: string;
  continua: boolean;
  stato: StatoPartita;
}

// Il ponte Python fra interfaccia e motore (fav_boot, fav_step, fav_stato,
// fav_salva, fav_carica…): vive in ponte.py, un file Python vero, così lo
// stesso codice gira qui dentro Pyodide e nel collaudo (collaudo/salvataggi.py).
import PONTE_PY from "./ponte.py?raw";

type OnStatus = (msg: string) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pyodidePromise: Promise<any> | null = null;

const injectScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Impossibile caricare ${src}`));
    document.head.appendChild(s);
  });

// Carica Pyodide + Lark + i moduli del motore (una sola volta).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function caricaRuntime(onStatus: OnStatus): Promise<any> {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = (async () => {
    onStatus("Avvio dell'interprete…");
    await injectScript(`${PYODIDE_BASE}pyodide.js`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pyodide = await (window as any).loadPyodide({ indexURL: PYODIDE_BASE });

    onStatus("Installazione di Lark…");
    // [SITO] Lark da PyPI con micropip, versione PINNATA: la stessa con cui il
    // motore è testato (una lark futura incompatibile non romperà il sito).
    await pyodide.loadPackage("micropip");
    const micropip = pyodide.pyimport("micropip");
    await micropip.install("lark==1.3.1");

    onStatus("Caricamento del motore FAVELLA…");
    pyodide.FS.mkdirTree("/engine");
    for (const f of ENGINE_FILES) {
      // "strutture.py" è servito come "strutture.fav": niente «.py» nel nome remoto.
      const src = await fetchTesto(asset(`engine/${f.replace(/\.py$/, "")}.fav`));
      pyodide.FS.writeFile(`/engine/${f}`, src);
    }
    pyodide.runPython(PONTE_PY);
    return pyodide;
  })();
  return pyodidePromise;
}

export interface GiocoSpec {
  gameId: string;
  entry: string; // nome del file d'ingresso (dentro favella-engine/<gameId>/)
  files: string[]; // tutti i .fav da scrivere nel FS
}

export interface StatoMondo {
  inventory: string[];
  counters: Record<string, number>;
  room: string | null;
  roomId: string | null;
  // [UI v2] opzionali: la pagina «Programma» del sito usa lo stesso tipo
  exits?: { dir: string; verso: string }[];
  present?: { nome: string; id: string; persona: boolean; prendibile: boolean }[];
  dialog?: { chi: string; opzioni: string[] } | null;
  capacity?: number | null;
  turn?: number;
}

/** Il cuore di un salvataggio, prodotto dal ponte (vedi ponte.py). */
export interface PartitaSalvata {
  comandi: string[];
  impronta: string;   // impronta dello stato del mondo
  avventura: string;  // impronta di avventura + motore
  motore: string;
  turno: number;
  ultimo: string | null;
}

export interface EsitoCaricamento {
  ok: boolean;
  errore?: string;
  text: string;
  impronta: string;
  identica: boolean;
  stato: StatoPartita;
  comandi: number;
  annullabili: number;
}

export interface SessioneGioco {
  boot: () => TurnoEsito;
  step: (cmd: string) => TurnoEsito;
  salva: () => PartitaSalvata;
  carica: (p: Pick<PartitaSalvata, "comandi" | "impronta" | "ultimo">) => EsitoCaricamento;
  motore: () => string;
  stato: () => StatoMondo;
}

// Prepara una sessione di gioco: scrive i .fav nel FS e ritorna boot/step.
export async function avviaGioco(spec: GiocoSpec, onStatus: OnStatus): Promise<SessioneGioco> {
  const pyodide = await caricaRuntime(onStatus);

  onStatus("Caricamento dell'avventura…");
  const dir = `/games/${spec.gameId}`;
  pyodide.FS.mkdirTree(dir);
  for (const nome of spec.files) {
    const src = await fetchTesto(asset(`${spec.gameId}/${nome}`));
    pyodide.FS.writeFile(`${dir}/${nome}`, src);
  }

  const entryPath = `${dir}/${spec.entry}`;
  const parse = (jsonStr: string): TurnoEsito => {
    const d = JSON.parse(jsonStr);
    return { text: d.text ?? "", continua: !!d.continua, stato: d.stato ?? "in_corso" };
  };

  return {
    boot: () => {
      pyodide.globals.set("_entry", entryPath);
      return parse(pyodide.runPython("fav_boot(_entry)"));
    },
    step: (cmd: string) => {
      pyodide.globals.set("_cmd", cmd);
      return parse(pyodide.runPython("fav_step(_cmd)"));
    },
    stato: () => JSON.parse(pyodide.runPython("fav_stato()")) as StatoMondo,
    salva: () => JSON.parse(pyodide.runPython("fav_salva()")) as PartitaSalvata,
    carica: (p) => {
      pyodide.globals.set("_entry", entryPath);
      pyodide.globals.set("_comandi", JSON.stringify(p.comandi));
      pyodide.globals.set("_impronta", p.impronta ?? "");
      pyodide.globals.set("_ultimo", p.ultimo ?? null);
      return JSON.parse(pyodide.runPython("fav_carica(_entry, _comandi, _impronta, _ultimo)")) as EsitoCaricamento;
    },
    motore: () => (JSON.parse(pyodide.runPython("fav_info()")) as { motore: string }).motore,
  };
}
