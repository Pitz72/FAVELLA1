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
    from compilatore import analizza_file, VERBI_VALIDI, PAROLE_RISERVATE
    from utils import DIREZIONI_BASE
    from libreria_azioni import LIBRERIA_AZIONI
    from gioco import elabora_comando, mostra_stanza
    from strutture import Mondo
except Exception as _e:  # pragma: no cover - solo ambiente rotto
    _ENGINE_IMPORT_ERROR = f"{type(_e).__name__}: {_e}"

# Versione del motore FAVELLA (fonte: header dei moduli + ultimo rilascio).
VERSIONE_MOTORE = "0.12.1"
VERSIONE_SIDECAR = "0.1.0"  # Favella Studio — Fase 0


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


# Tabella di dispatch. Le fasi successive aggiungono qui compile/session.*/world.*
_METODI = {
    "ping": rpc_ping,
    "engine.version": rpc_engine_version,
    "engine.lexicon": rpc_engine_lexicon,
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
