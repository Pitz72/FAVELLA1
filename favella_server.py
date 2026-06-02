# favella_server.py
# ==============================================================================
# Sidecar di Favella Studio — ponte JSON-RPC fra l'IDE (Electron/React) e il
# motore FAVELLA (Python). Comunica via NDJSON (un oggetto JSON per riga) su
# stdin/stdout. Importa il motore esistente con import PIATTI (stesso contesto
# dei test e della CLI): non riscrive nulla, lo avvolge.
#
# DISCIPLINA STDOUT (critica): il motore stampa molto con print(). Allo startup
# salviamo lo stdout REALE in `_REAL_OUT`; ogni chiamata al motore gira dentro
# redirect_stdout(StringIO()), e i frame di protocollo vengono scritti SOLO su
# `_REAL_OUT`. Così nessun print vagante del motore può corrompere il framing.
#
# Avvio: python favella_server.py   (lo lancia il processo main di Electron)
# ==============================================================================

import sys
import io
import json
import traceback
import contextlib

# --- Stdout reale catturato PRIMA di qualunque possibile print del motore. -----
_REAL_OUT = sys.stdout

# Forza UTF-8 su stdin/stdout (su Windows il default può non esserlo): i testi
# FAVELLA sono pieni di accenti e l'IDE parla UTF-8.
try:
    sys.stdin.reconfigure(encoding="utf-8")
    _REAL_OUT.reconfigure(encoding="utf-8")
except Exception:
    pass

# --- Import del motore (import piatti, come test_linguaggio.py e gioco.py). ----
# Avvolti in try così, se manca una dipendenza (es. lark), il sidecar risponde
# comunque al protocollo con un errore diagnostico invece di morire muto.
_ENGINE_IMPORT_ERROR = None
try:
    from compilatore import (analizza_file, analizza_file_strutturato,
                             compila_mondo, VERBI_VALIDI, PAROLE_RISERVATE)
    from utils import DIREZIONI_BASE, rendi_testo
    from libreria_azioni import LIBRERIA_AZIONI
    from gioco import elabora_comando, mostra_stanza
    from strutture import Mondo
except Exception as _e:  # pragma: no cover - solo ambiente rotto
    _ENGINE_IMPORT_ERROR = f"{type(_e).__name__}: {_e}"

# Versione del motore FAVELLA (fonte: header dei moduli + ultimo rilascio).
VERSIONE_MOTORE = "0.12.1"
VERSIONE_SIDECAR = "0.4.0"  # Favella Studio — Fase 3 (Gioca: sessione di gioco)


# ==============================================================================
# Utilità di esecuzione "muta" del motore
# ==============================================================================

@contextlib.contextmanager
def _cattura_stdout():
    """Esegue il blocco col motore che stampa dentro un buffer, restituito al
    chiamante. Il protocollo NDJSON resta intatto su _REAL_OUT."""
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        yield buf


# ==============================================================================
# Metodi RPC
# ==============================================================================

def rpc_ping(_params):
    return {"pong": True}


def rpc_engine_version(_params):
    return {
        "engine": VERSIONE_MOTORE,
        "sidecar": VERSIONE_SIDECAR,
        "python": sys.version.split()[0],
    }


def rpc_engine_lexicon(_params):
    """Vocabolario del linguaggio per il tokenizer Monarch di Monaco: deriva dal
    motore così l'highlighting resta sempre in sync col linguaggio reale."""
    direzioni = sorted({forma for forme in DIREZIONI_BASE.values() for forma in forme}
                       | set(DIREZIONI_BASE.keys()))
    return {
        "verbs": sorted(VERBI_VALIDI),
        "reserved": sorted(PAROLE_RISERVATE),
        "directions": direzioni,
    }


def rpc_compile(params):
    """[Fase 2] Compila un file .fav e restituisce diagnostiche strutturate per
    l'IDE. 'path' è il file radice; 'source' (opzionale) è il buffer live non
    ancora salvato — se presente, si compila quel testo e gli 'Includi' sono
    risolti dal disco relativamente alla cartella di 'path'. La cattura di stdout
    del dispatcher protegge comunque il canale di protocollo."""
    percorso = params.get("path")
    if not percorso:
        raise ValueError("Parametro 'path' mancante per 'compile'.")
    sorgente = params.get("source")  # None ⇒ legge da disco
    return analizza_file_strutturato(percorso, sorgente=sorgente)


# ==============================================================================
# Sessione di gioco (Fase 3) — wrappa elabora_comando sotto cattura stdout
# ------------------------------------------------------------------------------
# Il motore è già headless: elabora_comando(mondo, cmd) prende una stringa, NON
# chiama input(), e i dialoghi sono guidati a turni (le scelte sono stringhe). La
# sessione qui sotto compila un Mondo giocabile, lo tiene vivo e instrada i
# comandi, restituendo all'IDE il testo della console e un'istantanea di stato
# (fine partita, dialogo in corso con le opzioni, stanza, turno).
# ==============================================================================

class _SessioneGioco:
    """Una partita in corso: il Mondo compilato più il percorso/sorgente da cui è
    nato (per il reset, che rigioca lo stesso testo)."""
    def __init__(self, mondo, path, source):
        self.mondo = mondo
        self.path = path
        self.source = source
        self.running = True


# Il sidecar è monoutente: una sola partita attiva alla volta.
_SESSIONE = None


def _stato_partita(mondo):
    """Istantanea read-only dello stato di gioco per l'IDE: fine partita (con
    esito), eventuale dialogo in corso con le opzioni ATTUALMENTE proponibili
    (filtrate per condizione, già rese con l'interpolazione [var]), stanza e
    turno correnti. Difensiva: non deve mai sollevare verso il protocollo."""
    stato = getattr(mondo, "stato_partita", "in_corso")
    in_dialogo = mondo.in_dialogo()
    opzioni = []
    if in_dialogo:
        nodo = mondo.dialogo_nodi.get(mondo.nodo_dialogo)
        if nodo is not None:
            disponibili = [o for o in nodo.opzioni if o.disponibile(mondo)]
            opzioni = [{"index": i, "text": rendi_testo(mondo, o.testo)}
                       for i, o in enumerate(disponibili, 1)]
    stanza = mondo.trova_stanza(mondo.posizione_giocatore)
    return {
        "gameOver": stato != "in_corso",
        "outcome": None if stato == "in_corso" else stato,  # vinta|persa|terminata
        "inDialogue": in_dialogo,
        "dialogueOptions": opzioni,
        "room": stanza.nome_visualizzato if stanza else None,
        "turn": getattr(mondo, "turno_corrente", 0),
    }


def _intro(mondo):
    """Testo d'apertura della console: banner + descrizione della stanza iniziale
    (cattura le print di mostra_stanza in un buffer locale)."""
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        print("--- BENVENUTO IN FAVELLA 1 ---")
        print("Scrivi un comando, oppure 'esci' per terminare.")
        mostra_stanza(mondo)
    return buf.getvalue()


def rpc_session_start(params):
    """[Fase 3] Compila il file/buffer e avvia una nuova partita. 'path' è il file
    radice; 'source' (opzionale) è il buffer live non salvato. Su fallimento di
    compilazione, restituisce ok=False con le diagnostiche d'autore (dal canale
    strutturato), così l'IDE può spiegare perché non si può giocare."""
    global _SESSIONE
    percorso = params.get("path")
    if not percorso:
        raise ValueError("Parametro 'path' mancante per 'session.start'.")
    sorgente = params.get("source")

    mondo = compila_mondo(percorso, sorgente)
    if mondo is None:
        _SESSIONE = None
        diag = analizza_file_strutturato(percorso, sorgente=sorgente)
        return {"ok": False, "output": "", "running": False, "state": None,
                "errors": diag.get("errors", [])}

    mondo.carica_azioni(LIBRERIA_AZIONI)
    mondo.imposta_posizione_iniziale()
    if not mondo.posizione_giocatore:
        _SESSIONE = None
        return {"ok": False, "output": "", "running": False, "state": None,
                "errors": [{"message": "Nessuna stanza definita: impossibile "
                                       "avviare il gioco.", "severity": "error"}]}

    _SESSIONE = _SessioneGioco(mondo, percorso, sorgente)
    return {"ok": True, "output": _intro(mondo), "running": True,
            "state": _stato_partita(mondo)}


def rpc_session_send(params):
    """[Fase 3] Invia un comando alla partita attiva. L'output del motore è
    catturato in un buffer locale e restituito come testo della console; 'running'
    diventa False quando il giocatore esce o la partita finisce."""
    if _SESSIONE is None:
        raise ValueError("Nessuna partita attiva: avvia prima con 'session.start'.")
    comando = params.get("command", "")
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        continua = elabora_comando(_SESSIONE.mondo, comando)
    _SESSIONE.running = bool(continua)
    return {"ok": True, "output": buf.getvalue(), "running": _SESSIONE.running,
            "state": _stato_partita(_SESSIONE.mondo)}


def rpc_session_reset(_params):
    """[Fase 3] Riavvia la partita rigiocando lo STESSO sorgente da cui è nata
    (le eventuali modifiche live dell'editor non rientrano: il riavvio è una
    rigiocata pulita dello stesso mondo)."""
    if _SESSIONE is None:
        raise ValueError("Nessuna partita da riavviare.")
    return rpc_session_start({"path": _SESSIONE.path, "source": _SESSIONE.source})


# Tabella di dispatch. Le fasi successive aggiungono qui world.* (mappa/inspector).
_METODI = {
    "ping": rpc_ping,
    "engine.version": rpc_engine_version,
    "engine.lexicon": rpc_engine_lexicon,
    "compile": rpc_compile,
    "session.start": rpc_session_start,
    "session.send": rpc_session_send,
    "session.reset": rpc_session_reset,
}


# ==============================================================================
# Loop di protocollo NDJSON (JSON-RPC 2.0 ridotto)
# ==============================================================================

def _scrivi(oggetto):
    """Scrive un frame NDJSON sullo stdout REALE e fa flush immediato."""
    _REAL_OUT.write(json.dumps(oggetto, ensure_ascii=False, separators=(",", ":")))
    _REAL_OUT.write("\n")
    _REAL_OUT.flush()


def _risposta_ok(id_, result):
    return {"jsonrpc": "2.0", "id": id_, "result": result}


def _risposta_errore(id_, codice, messaggio, dati=None):
    err = {"code": codice, "message": messaggio}
    if dati is not None:
        err["data"] = dati
    return {"jsonrpc": "2.0", "id": id_, "error": err}


def _gestisci_richiesta(richiesta):
    """Dispatch di una singola richiesta già deserializzata. Restituisce il dict
    di risposta, oppure None per le notifiche (senza id)."""
    id_ = richiesta.get("id")
    metodo = richiesta.get("method")

    if _ENGINE_IMPORT_ERROR is not None:
        return _risposta_errore(id_, -32000,
                                "Motore FAVELLA non caricato",
                                _ENGINE_IMPORT_ERROR)

    funzione = _METODI.get(metodo)
    if funzione is None:
        return _risposta_errore(id_, -32601, f"Metodo sconosciuto: {metodo}")

    params = richiesta.get("params") or {}
    try:
        # Ogni chiamata al motore gira con stdout deviato: anche se il metodo non
        # lo prevede, è una rete di sicurezza contro print() inattesi.
        with _cattura_stdout():
            result = funzione(params)
        if id_ is None:
            return None  # notifica: nessuna risposta
        return _risposta_ok(id_, result)
    except Exception as e:
        return _risposta_errore(id_, -32603, f"{type(e).__name__}: {e}",
                                {"traceback": traceback.format_exc()})


def main():
    # Annuncio di pronto (notifica): l'IDE sa che il sidecar è vivo. Se il motore
    # non si è caricato, lo comunica subito così l'UI può mostrarlo.
    _scrivi({
        "jsonrpc": "2.0",
        "method": "server/ready",
        "params": {
            "sidecar": VERSIONE_SIDECAR,
            "engineLoaded": _ENGINE_IMPORT_ERROR is None,
            "engineError": _ENGINE_IMPORT_ERROR,
        },
    })

    for linea in sys.stdin:
        linea = linea.strip()
        if not linea:
            continue
        try:
            richiesta = json.loads(linea)
        except json.JSONDecodeError as e:
            _scrivi(_risposta_errore(None, -32700, f"JSON non valido: {e}"))
            continue

        risposta = _gestisci_richiesta(richiesta)
        if risposta is not None:
            _scrivi(risposta)


if __name__ == "__main__":
    main()
