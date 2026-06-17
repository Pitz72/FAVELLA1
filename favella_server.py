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
                             compila_mondo, analizza_outline, analizza_regole,
                             analizza_variabili, analizza_dialoghi,
                             riordina_sorgente, esporta_html,
                             serializza_frase, VERBI_VALIDI,
                             PAROLE_RISERVATE)
    from utils import DIREZIONI_BASE, rendi_testo
    from libreria_azioni import LIBRERIA_AZIONI
    from gioco import elabora_comando, mostra_stanza
    from strutture import Mondo, VERSIONE_MOTORE
except Exception as _e:  # pragma: no cover - solo ambiente rotto
    _ENGINE_IMPORT_ERROR = f"{type(_e).__name__}: {_e}"
    VERSIONE_MOTORE = "sconosciuta"  # il motore non è importabile
VERSIONE_SIDECAR = "0.9.9"  # v1.0.0: serializza operando/chance/pick (editor Temi 1-5)


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
    nato (per il reset, che rigioca lo stesso testo). [Fase 5] Tiene la 'history':
    uno snapshot per turno (più il comando che l'ha prodotto) per il debugger
    passo-passo dell'IDE, che ne calcola i diff."""
    def __init__(self, mondo, path, source):
        self.mondo = mondo
        self.path = path
        self.source = source
        self.running = True
        self.history = []


# Il sidecar è monoutente: una sola partita attiva alla volta.
_SESSIONE = None


def _registra_turno(sess, command):
    """[Fase 5] Aggiunge alla history uno snapshot dello stato col comando che lo
    ha prodotto (None per lo stato iniziale). L'IDE calcola i diff fra snapshot
    consecutivi. _snapshot_mondo è definito più sotto: la risoluzione avviene a
    runtime, quando il modulo è già caricato per intero."""
    sess.history.append({
        "turn": getattr(sess.mondo, "turno_corrente", 0),
        "command": command,
        "snapshot": _snapshot_mondo(sess.mondo),
    })


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
    _registra_turno(_SESSIONE, None)  # [Fase 5] stato iniziale nella history
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
    _registra_turno(_SESSIONE, comando)  # [Fase 5] snapshot post-comando
    return {"ok": True, "output": buf.getvalue(), "running": _SESSIONE.running,
            "state": _stato_partita(_SESSIONE.mondo)}


def rpc_session_reset(_params):
    """[Fase 3] Riavvia la partita rigiocando lo STESSO sorgente da cui è nata
    (le eventuali modifiche live dell'editor non rientrano: il riavvio è una
    rigiocata pulita dello stesso mondo)."""
    if _SESSIONE is None:
        raise ValueError("Nessuna partita da riavviare.")
    return rpc_session_start({"path": _SESSIONE.path, "source": _SESSIONE.source})


def rpc_session_save(_params):
    """[Salvataggio partite] Esporta il salvataggio come COMMAND-LOG: la sequenza
    dei comandi giocati più il riferimento alla storia (path + sorgente). FAVELLA è
    deterministico, quindi rigiocare i comandi riproduce esattamente lo stato. Il
    salvataggio è minuscolo e non serializza il Mondo."""
    if _SESSIONE is None:
        raise ValueError("Nessuna partita da salvare.")
    comandi = [h["command"] for h in _SESSIONE.history if h["command"] is not None]
    return {
        "version": 1,
        "path": _SESSIONE.path,
        "source": _SESSIONE.source,
        "commands": comandi,
        "turn": getattr(_SESSIONE.mondo, "turno_corrente", 0),
    }


def rpc_session_load(params):
    """[Salvataggio partite] Carica un salvataggio command-log: ricompila il mondo
    (dal path/sorgente salvati) e RI-ESEGUE i comandi, restituendo il transcript
    completo (così la console mostra la partita fino al punto salvato). Su errore
    di compilazione restituisce ok=False con le diagnostiche."""
    global _SESSIONE
    save = params.get("save") or {}
    path = save.get("path")
    if not path:
        raise ValueError("Salvataggio non valido: manca 'path'.")
    source = save.get("source")
    comandi = save.get("commands") or []

    res = rpc_session_start({"path": path, "source": source})
    if not res.get("ok"):
        return res  # compilazione fallita: ok=False + errors

    pezzi = [res["output"]]
    for cmd in comandi:
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            continua = elabora_comando(_SESSIONE.mondo, cmd)
        _SESSIONE.running = bool(continua)
        _registra_turno(_SESSIONE, cmd)
        pezzi.append(f"\n> {cmd}\n{buf.getvalue()}")

    return {"ok": True, "output": "".join(pezzi), "running": _SESSIONE.running,
            "state": _stato_partita(_SESSIONE.mondo)}


# ==============================================================================
# Mappa del mondo e ispettore di stato (Fase 4) — world.graph / world.snapshot
# ------------------------------------------------------------------------------
# world.graph: topologia STATICA (stanze = nodi, uscite = archi direzionati), per
#   disegnare la mappa. Dal mondo della partita attiva, oppure compilando un
#   file/buffer su richiesta (anteprima senza giocare).
# world.snapshot: stato LIVE della partita in corso (posizione, turno, esito,
#   variabili, inventario, oggetti con posizione e proprietà), per l'inspector.
# ==============================================================================

def _grafo_mondo(mondo):
    """Topologia del mondo per la Mappa: stanze (nodi) e uscite (archi
    direzionati 'from -> to' con la direzione). La stanza di partenza è marcata."""
    start = mondo.posizione_iniziale if mondo.posizione_iniziale in mondo.stanze \
        else next(iter(mondo.stanze), None)
    rooms = [{"id": rid, "name": getattr(st, "nome_visualizzato", rid),
              "isStart": rid == start}
             for rid, st in mondo.stanze.items()]
    edges = []
    for rid, st in mondo.stanze.items():
        for direzione, dest in getattr(st, "uscite", {}).items():
            edges.append({"from": rid, "to": dest, "direction": direzione})
    return {"ok": True, "rooms": rooms, "edges": edges, "errors": []}


def _snapshot_mondo(mondo):
    """Stato live del mondo per l'Inspector. Difensivo via getattr: non solleva."""
    def _luogo(oid, ogg):
        # (id, etichetta) del luogo dell'oggetto: inventario, stanza o contenitore.
        if oid in getattr(mondo, "inventario", set()):
            return "inventario", "Inventario"
        pos = getattr(ogg, "posizione", None)
        if pos and pos in mondo.stanze:
            return pos, mondo.stanze[pos].nome_visualizzato
        if pos and pos in mondo.oggetti:
            return pos, mondo.oggetti[pos].nome_visualizzato
        return None, None

    def _tipo(ogg):
        if getattr(ogg, "is_personaggio", False):
            return "personaggio"
        if getattr(ogg, "is_contenitore", False):
            return "contenitore"
        if getattr(ogg, "is_supporto", False):
            return "supporto"
        return "oggetto"

    variabili = []
    for nome, val in getattr(mondo, "variabili", {}).items():
        # I contatori hanno valore int (lo 0 iniziale); gli stati str/None.
        tipo = "contatore" if isinstance(val, int) and not isinstance(val, bool) else "stato"
        variabili.append({"name": nome, "value": val, "kind": tipo})

    inventario = [{"id": oid, "name": mondo.oggetti[oid].nome_visualizzato}
                  for oid in getattr(mondo, "inventario", set()) if oid in mondo.oggetti]

    oggetti = []
    for oid, ogg in mondo.oggetti.items():
        pid, plabel = _luogo(oid, ogg)
        oggetti.append({
            "id": oid,
            "name": getattr(ogg, "nome_visualizzato", oid),
            "positionId": pid,
            "positionLabel": plabel,
            "properties": sorted(getattr(ogg, "proprieta", set())),
            "kind": _tipo(ogg),
        })

    # [Livello 7] Capacità di trasporto (None = illimitata): usati / massimo.
    carry_max = mondo.capacita_attuale() if hasattr(mondo, "capacita_attuale") else None
    cur = mondo.posizione_giocatore
    return {
        "currentRoom": cur,
        "currentRoomName": mondo.stanze[cur].nome_visualizzato if cur in mondo.stanze else None,
        "turn": getattr(mondo, "turno_corrente", 0),
        "status": getattr(mondo, "stato_partita", "in_corso"),
        "inDialogue": mondo.in_dialogo(),
        "carryUsed": len(getattr(mondo, "inventario", set())),
        "carryMax": carry_max,
        "variables": sorted(variabili, key=lambda v: v["name"]),
        "inventory": sorted(inventario, key=lambda i: i["name"]),
        "objects": sorted(oggetti, key=lambda o: o["name"]),
    }


def rpc_world_graph(params):
    """[Fase 4] Topologia del mondo per la Mappa. Senza 'path' usa il mondo della
    partita attiva; con 'path' (+ 'source' opzionale) compila il file/buffer per
    un'anteprima della mappa senza dover giocare."""
    percorso = params.get("path")
    if percorso:
        mondo = compila_mondo(percorso, params.get("source"))
        if mondo is None:
            diag = analizza_file_strutturato(percorso, sorgente=params.get("source"))
            return {"ok": False, "rooms": [], "edges": [],
                    "errors": diag.get("errors", [])}
    elif _SESSIONE is not None:
        mondo = _SESSIONE.mondo
    else:
        return {"ok": False, "rooms": [], "edges": [],
                "errors": [{"message": "Nessun mondo: apri un .fav o avvia una "
                                       "partita.", "severity": "error"}]}
    return _grafo_mondo(mondo)


def rpc_world_snapshot(_params):
    """[Fase 4] Stato live della partita attiva per l'Inspector."""
    if _SESSIONE is None:
        raise ValueError("Nessuna partita attiva: lo stato live richiede 'session.start'.")
    return _snapshot_mondo(_SESSIONE.mondo)


def rpc_world_outline(params):
    """[Fase 6a] Modello editabile di stanze e oggetti con lo span sorgente di ogni
    frase, per gli editor visuali (round-trip testo↔visuale). Senza 'path' usa la
    storia della partita attiva; con 'path' (+ 'source') legge il file/buffer."""
    percorso = params.get("path")
    if not percorso and _SESSIONE is not None:
        percorso = _SESSIONE.path
        sorgente = _SESSIONE.source
    else:
        sorgente = params.get("source")
    if not percorso:
        return {"ok": False, "rooms": [], "objects": [],
                "errors": [{"message": "Nessun mondo: apri un .fav o avvia una "
                                       "partita.", "severity": "error"}]}
    return analizza_outline(percorso, sorgente)


def rpc_world_rules(params):
    """[Fase 6c] Modello editabile di REGOLE ed EVENTI con lo span sorgente di ogni
    frase, per l'editor visuale di logica. Stessa risoluzione di world.outline:
    senza 'path' usa la partita attiva; con 'path' (+ 'source') legge il buffer."""
    percorso = params.get("path")
    if not percorso and _SESSIONE is not None:
        percorso = _SESSIONE.path
        sorgente = _SESSIONE.source
    else:
        sorgente = params.get("source")
    if not percorso:
        return {"ok": False, "rules": [], "events": [], "demons": [],
                "menu": {"verbs": [], "objects": [], "rooms": [],
                         "directions": [], "states": [], "counters": []},
                "errors": [{"message": "Nessun mondo: apri un .fav o avvia una "
                                       "partita.", "severity": "error"}]}
    return analizza_regole(percorso, sorgente)


def rpc_world_variables(params):
    """[Stati & contatori] Modello editabile di STATI e CONTATORI con lo span
    sorgente delle frasi (dichiarazione, valore iniziale, commento dei valori), per
    il pannello «Stati & Contatori». Stessa risoluzione di world.outline: senza
    'path' usa la partita attiva; con 'path' (+ 'source') legge il buffer."""
    percorso = params.get("path")
    if not percorso and _SESSIONE is not None:
        percorso = _SESSIONE.path
        sorgente = _SESSIONE.source
    else:
        sorgente = params.get("source")
    if not percorso:
        return {"ok": False, "states": [], "counters": [],
                "errors": [{"message": "Nessun mondo: apri un .fav o avvia una "
                                       "partita.", "severity": "error"}]}
    return analizza_variabili(percorso, sorgente)


def rpc_world_dialogues(params):
    """[Fase 6b] Modello editabile di NPC e DIALOGHI con lo span sorgente di ogni
    frase, per l'editor visuale dei dialoghi. Stessa risoluzione di world.outline:
    senza 'path' usa la partita attiva; con 'path' (+ 'source') legge il buffer."""
    percorso = params.get("path")
    if not percorso and _SESSIONE is not None:
        percorso = _SESSIONE.path
        sorgente = _SESSIONE.source
    else:
        sorgente = params.get("source")
    if not percorso:
        return {"ok": False, "npcs": [], "nodes": [],
                "menu": {"npcs": [], "nodeLabels": [], "objects": [], "rooms": [],
                         "directions": [], "states": [], "counters": [],
                         "stateValues": {}},
                "errors": [{"message": "Nessun mondo: apri un .fav o avvia una "
                                       "partita.", "severity": "error"}]}
    return analizza_dialoghi(percorso, sorgente)


def rpc_source_reorder(params):
    """[Autoformat / blocco C] Riordino canonico del sorgente di un file singolo.
    Richiede 'path' (+ 'source' per il buffer live). Ritorna {ok, text} o
    {ok:False, reason}."""
    percorso = params.get("path")
    if not percorso:
        return {"ok": False, "reason": "Apri un file .fav per riordinarlo."}
    return riordina_sorgente(percorso, params.get("source"))


def rpc_game_export_html(params):
    """[Fase 7 / packaging] Esporta la storia come HTML autoportante (motore +
    storia appiattita, giocabile nel browser via Pyodide). Ritorna {ok, html,
    title} o {ok:False, reason}."""
    percorso = params.get("path")
    if not percorso:
        return {"ok": False, "reason": "Apri un file .fav per esportarlo."}
    return esporta_html(percorso, params.get("source"))


def rpc_outline_serialize(params):
    """[Fase 6a] Genera la frase .fav canonica da una specifica strutturata
    (op + campi), per il round-trip in SCRITTURA degli editor visuali. L'IDE
    inserisce/sostituisce il testo restituito nel buffer usando gli span di
    world.outline. Vedi serializza_frase per le op supportate."""
    return serializza_frase(params)


def rpc_session_history(_params):
    """[Fase 5] History della partita attiva per il debugger passo-passo: uno
    snapshot per turno con il comando che l'ha prodotto. L'IDE calcola i diff fra
    snapshot consecutivi. Lista vuota se nessuna partita è attiva."""
    if _SESSIONE is None:
        return {"entries": []}
    return {"entries": _SESSIONE.history}


# Tabella di dispatch. Le fasi successive aggiungono qui debug.* (passo-passo).
_METODI = {
    "ping": rpc_ping,
    "engine.version": rpc_engine_version,
    "engine.lexicon": rpc_engine_lexicon,
    "compile": rpc_compile,
    "session.start": rpc_session_start,
    "session.send": rpc_session_send,
    "session.reset": rpc_session_reset,
    "world.graph": rpc_world_graph,
    "world.snapshot": rpc_world_snapshot,
    "world.outline": rpc_world_outline,
    "world.rules": rpc_world_rules,
    "world.variables": rpc_world_variables,
    "world.dialogues": rpc_world_dialogues,
    "source.reorder": rpc_source_reorder,
    "game.exportHtml": rpc_game_export_html,
    "outline.serialize": rpc_outline_serialize,
    "session.history": rpc_session_history,
    "session.save": rpc_session_save,
    "session.load": rpc_session_load,
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
