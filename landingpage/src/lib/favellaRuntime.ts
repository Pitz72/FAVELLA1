// ====================================================================
//  Runtime FAVELLA nel browser, via Pyodide.
//  Carica il motore Python VERO (compilatore + gioco, puro Python +
//  Lark) e lo pilota con lo stesso contratto headless del sidecar IDE:
//  compila_mondo(entry) → mostra_stanza → elabora_comando(cmd). Dal motore
//  1.4.0 ciò che il motore dice arriva come EVENTI tipizzati (titolo di
//  stanza, testo, domanda, battuta…) raccolti con raccogli_uscita, non più
//  dirottando stdout; ogni turno porta anche i PULSANTI-VERBO proponibili
//  (gioco.pulsanti). Vedi favella_server.py.
//
//  Pyodide è pesante (qualche MB): si carica UNA volta, PIGRO, solo
//  quando si apre una cassetta-gioco. Il browser lo mette in cache.
// ====================================================================

const PYODIDE_VERSION = "v0.27.2";
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;

// I moduli del motore sono serviti come «.fav» PURO (strutture.fav, …): l'hosting
// del deploy reale risponde 403 ai file .py, e con «.py» in MEZZO al nome
// (strutture.py.fav) Apache valuta anche quell'estensione e prova a ESEGUIRE il
// file come script (HTTP 500). Quindi: niente «.py» nel nome servito, da
// nessuna parte. Nel FS di Pyodide il file è scritto col nome vero (.py),
// così gli import Python restano invariati.
//
// NB: dal motore 1.0.1 il modulo di utilità si chiama «favella_utils» e non più
// «utils» (igiene del namespace nel pacchetto pip). Se rinomini qui, rinomina
// anche il file in public/favella-engine/engine/.
const ENGINE_FILES = ["favella_utils.py", "strutture.py", "libreria_azioni.py", "compilatore.py", "gioco.py"];

const BASE = import.meta.env.BASE_URL; // es. "/" su favella.eu — coerente col deploy
const asset = (p: string) => `${BASE}favella-engine/${p}`;

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

// [motore 1.4.0] Un evento dell'uscita del motore (favella_utils.Evento).
export type TipoEvento =
  | "intestazione" | "stanza" | "testo" | "elenco" | "domanda"
  | "dialogo" | "opzione" | "sistema" | "fine" | "errore";
export interface EventoMotore {
  tipo: TipoEvento;
  testo: string;
  stacco?: boolean;
  dati?: Record<string, unknown>;
}

// [motore 1.4.0] I pulsanti-verbo proponibili adesso (gioco.pulsanti). Il
// comando si compone come verbo + " " + primo.testo [+ " " + secondo.testo].
export interface VoceComando { etichetta: string; comando: string }
export interface Primo { id: string; testo: string }
export interface Secondo { id?: string; etichetta: string; testo: string }
export interface VerboPulsante {
  verbo: string;
  etichetta: string;
  oggetto: boolean;
  da_solo: boolean;
  primi: Primo[];
  secondo: "no" | "facoltativo" | "obbligatorio";
  secondi?: Secondo[];
  secondi_per?: Record<string, Secondo[]>;
}
export interface Pulsantiera {
  modo: "entrambi" | "pulsanti" | "testo";
  fase: "gioco" | "dialogo" | "conferma" | "scelta" | "fine";
  scelte: VoceComando[];
  oggetti: { id: string; etichetta: string; con_te: boolean }[];
  verbi: VerboPulsante[];
  uscite: { comando: string; etichetta: string; stanza: string | null }[];
  servizio: VoceComando[];
}

export interface TurnoEsito {
  text: string;
  continua: boolean;
  stato: StatoPartita;
  eventi?: EventoMotore[];
  pulsanti?: Pulsantiera;
}

// Il driver Python: definisce fav_boot / fav_step, che restituiscono JSON.
const DRIVER_PY = `
import json, sys
if '/engine' not in sys.path:
    sys.path.insert(0, '/engine')
from compilatore import compila_mondo
from gioco import elabora_comando, mostra_stanza, pulsanti
from libreria_azioni import LIBRERIA_AZIONI
from favella_utils import raccogli_uscita, UscitaRaccolta

_mondo = None

def _esito(uscita, continua, errore=None):
    # Testo (come lo scriveva il terminale) + eventi tipizzati + pulsanti-verbo.
    eventi = uscita.come_dizionari()
    testo = uscita.testo()
    if errore:
        eventi.append({"tipo": "errore", "testo": errore, "stacco": True})
        testo += "\\n" + errore
    d = {"text": testo, "eventi": eventi, "continua": bool(continua),
         "stato": getattr(_mondo, "stato_partita", "in_corso") if _mondo is not None else "errore"}
    if _mondo is not None and errore is None:
        d["pulsanti"] = pulsanti(_mondo)
    return json.dumps(d, ensure_ascii=False)

def fav_boot(entry):
    global _mondo
    uscita = UscitaRaccolta()
    try:
        _mondo = compila_mondo(entry)
        if _mondo is None:
            return _esito(uscita, False, "[ERRORE DI COMPILAZIONE] La storia non compila.")
        # Inizializzazioni che fa il main del gioco (gioco.py), NON
        # compila_mondo: registrare i verbi/azioni e piazzare il giocatore
        # nella stanza di partenza. Senza la prima, ogni verbo dà «Non
        # capisco»; senza la seconda, mostra_stanza dà errore interno.
        _mondo.carica_azioni(LIBRERIA_AZIONI)
        _mondo.imposta_posizione_iniziale()
        with raccogli_uscita(_mondo, uscita):
            mostra_stanza(_mondo)
    except Exception as e:
        return _esito(uscita, False, "[ERRORE DI COMPILAZIONE] " + str(e))
    return _esito(uscita, True)

def fav_step(cmd):
    uscita = UscitaRaccolta()
    if _mondo is None:
        return json.dumps({"text": "", "continua": False, "stato": "errore"})
    try:
        with raccogli_uscita(_mondo, uscita):
            continua = elabora_comando(_mondo, cmd)
    except Exception as e:
        return _esito(uscita, True, "[ERRORE] " + str(e))
    return _esito(uscita, continua)

def fav_stato():
    # Istantanea del mondo per le schede laterali della UI: inventario (nomi
    # visualizzati), contatori (le variabili a valore INTERO: vita/sete/fame/
    # acqua/cibo, fiducie, ...) e la stanza corrente (id + nome).
    if _mondo is None:
        return json.dumps({"inventory": [], "counters": {}, "room": None, "roomId": None})
    inv = []
    for oid in _mondo.inventario:
        og = _mondo.oggetti.get(oid)
        inv.append(og.nome_visualizzato if og is not None else oid)
    counters = {}
    for k, v in _mondo.variabili.items():
        if isinstance(v, bool):
            continue
        if isinstance(v, int):
            counters[k] = v
    stanza = _mondo.trova_stanza(_mondo.posizione_giocatore)
    room = stanza.nome_visualizzato if stanza is not None else None
    return json.dumps({"inventory": inv, "counters": counters,
                       "room": room, "roomId": _mondo.posizione_giocatore})
`;

// Driver di VALIDAZIONE per i checkpoint delle lezioni: compila un buffer .fav
// con la stessa diagnostica strutturata dell'IDE (analizza_file_strutturato) e
// restituisce ok + i messaggi d'errore/warning VERI del motore. Non avvia una
// partita: serve solo a dire se la riga scritta dall'utente è FAVELLA valida.
const VALIDATOR_PY = `
from compilatore import analizza_file_strutturato

def _msg(d):
    # Antepone la posizione quando c'e': "riga 4: <messaggio del motore>".
    m = d.get("message", "")
    riga = d.get("line")
    return ("riga %s: %s" % (riga, m)) if riga else m

def fav_valida(sorgente):
    try:
        res = analizza_file_strutturato('/check/check.fav', sorgente=sorgente)
        return json.dumps({
            "ok": bool(res.get("ok")),
            "errors": [_msg(e) for e in res.get("errors", [])],
            "warnings": [_msg(w) for w in res.get("warnings", [])],
        })
    except Exception as e:
        return json.dumps({"ok": False, "errors": ["[ERRORE INTERNO] " + str(e)], "warnings": []})
`;

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
    await pyodide.loadPackage("micropip");
    const micropip = pyodide.pyimport("micropip");
    // Versione PINNATA = quella della .venv con cui il motore è sviluppato e
    // testato (681 test). Senza pin, una futura lark incompatibile su PyPI
    // romperebbe il sito da sola, senza alcun deploy.
    await micropip.install("lark==1.3.1");

    onStatus("Caricamento del motore FAVELLA…");
    pyodide.FS.mkdirTree("/engine");
    for (const f of ENGINE_FILES) {
      // "strutture.py" è servito come "strutture.fav": niente «.py» nel nome remoto.
      const src = await fetchTesto(asset(`engine/${f.replace(/\.py$/, "")}.fav`));
      pyodide.FS.writeFile(`/engine/${f}`, src);
    }
    pyodide.runPython(DRIVER_PY);
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
}

export interface SessioneGioco {
  boot: () => TurnoEsito;
  step: (cmd: string) => TurnoEsito;
  stato: () => StatoMondo;
}

// Esito di un turno dal JSON del driver (eventi e pulsanti arrivano dal motore 1.4.0).
const parse = (jsonStr: string): TurnoEsito => {
  const d = JSON.parse(jsonStr);
  return {
    text: d.text ?? "",
    continua: !!d.continua,
    stato: d.stato ?? "in_corso",
    eventi: Array.isArray(d.eventi) ? d.eventi : undefined,
    pulsanti: d.pulsanti ?? undefined,
  };
};

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
  };
}

// Sessione di gioco da un sorgente IN MEMORIA (pagina «Programma»): scrive il
// buffer dell'editor nel FS di Pyodide e ritorna boot/step. fav_boot ricompila
// a ogni chiamata, quindi la stessa sessione serve anche per ri-compilare dopo
// una modifica: basta richiamare boot() dopo aver riscritto il sorgente.
export async function avviaGiocoDaSorgente(
  sorgente: string,
  onStatus: OnStatus
): Promise<SessioneGioco> {
  const pyodide = await caricaRuntime(onStatus);
  pyodide.FS.mkdirTree("/playground");
  const entryPath = "/playground/storia.fav";
  pyodide.FS.writeFile(entryPath, sorgente);

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
  };
}

// --------------------------------------------------------------------
//  Validatore dei checkpoint delle lezioni — esecuzione VERA del motore.
//  Compila il .fav scritto dall'utente (innestato in un mondo-base) col
//  compilatore Python reale e restituisce il verdetto + i messaggi veri.
// --------------------------------------------------------------------
export interface EsitoValidazione {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export interface Validatore {
  valida: (sorgente: string) => EsitoValidazione;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let validatorePromise: Promise<any> | null = null;

// Carica il motore (riusa Pyodide), prepara la cartella /check con stub vuoti
// per gli Includi del corso, e registra il driver di validazione. Pigro e
// idempotente: si paga il caricamento una volta sola, condiviso con i giochi.
export async function avviaValidatore(onStatus: OnStatus): Promise<Validatore> {
  if (!validatorePromise) {
    validatorePromise = (async () => {
      const pyodide = await caricaRuntime(onStatus);
      pyodide.FS.mkdirTree("/check");
      // Stub vuoti: l'unica lezione che usa «Includi» referenzia questi file.
      for (const stub of ["oggetti.fav", "dialoghi.fav"]) {
        try {
          pyodide.FS.writeFile(`/check/${stub}`, "");
        } catch {
          /* già presente */
        }
      }
      pyodide.runPython(VALIDATOR_PY);
      return pyodide;
    })();
  }
  const pyodide = await validatorePromise;
  return {
    valida: (sorgente: string): EsitoValidazione => {
      pyodide.globals.set("_src", sorgente);
      const d = JSON.parse(pyodide.runPython("fav_valida(_src)"));
      return { ok: !!d.ok, errors: d.errors ?? [], warnings: d.warnings ?? [] };
    },
  };
}
