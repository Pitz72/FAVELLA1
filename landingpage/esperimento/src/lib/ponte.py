# ====================================================================
#  Il ponte fra l'interfaccia e il motore FAVELLA.
# --------------------------------------------------------------------
#  Gira dentro Pyodide (favellaRuntime.ts lo carica come testo) e, identico,
#  nel collaudo in CPython (collaudo/salvataggi.py). Ogni funzione fav_*
#  restituisce JSON.
#
#  È infrastruttura del gioco, non motore: legge le strutture del motore
#  senza cambiarle.
#
#  SALVATAGGI. Il file di salvataggio non contiene lo stato del mondo (che
#  sono oggetti Python: serializzarli significherebbe pickle, fragile tra
#  versioni e pericoloso con file altrui). Contiene la sequenza EFFETTIVA
#  dei comandi della partita: i turni annullati con ANNULLA ne sono tolti,
#  ANCORA è già risolto nel comando che ripete. Il motore è deterministico
#  (il caso usa mondo.rng, con seme fisso alla compilazione): rigiocare la
#  sequenza su un mondo appena compilato riproduce lo stato identico, e
#  l'impronta (fav_impronta_stato) lo verifica al caricamento.
# ====================================================================
import contextlib
import hashlib
import io
import json
import os
import sys

if os.path.isdir("/engine"):
    sys.path.insert(0, "/engine")

from compilatore import compila_mondo                   # noqa: E402
from gioco import elabora_comando, mostra_stanza        # noqa: E402
from libreria_azioni import LIBRERIA_AZIONI             # noqa: E402
from strutture import VERSIONE_MOTORE                   # noqa: E402

_mondo = None
_entry = None
_registro = []           # la sequenza effettiva dei comandi (per il salvataggio)
_posizioni = []          # per ogni istantanea di ANNULLA: len(_registro) prima del suo turno
_ingresso_dialogo = None  # len(_registro) quando è cominciata la conversazione in corso

_SERVIZIO_ANNULLA = ("annulla", "disfa")
_SERVIZIO_ANCORA = ("ancora", "ripeti", "g")

# Dal motore 1.2.0 «salva» e «carica» digitati sono comandi di servizio del
# motore, con un loro archivio. Nel gioco i salvataggi sono quelli del taccuino
# (F5/F9): il ponte intercetta le due parole prima del motore, così non esistono
# due sistemi paralleli e la sequenza registrata qui resta pulita.
_ARCHIVIO_MOTORE = ("salva", "salvare", "carica", "caricare", "ripristina")
_AVVISO_SALVATAGGI = ("(Per salvare il viaggio premi F5 o apri il taccuino; "
                      "per riprenderlo, F9.)\n")


def _comando_di_archivio(pulito):
    parole = pulito.split()
    if not parole or len(parole) > 3 or parole[0] not in _ARCHIVIO_MOTORE:
        return False
    # un verbo che l'avventura dichiara come suo resta dell'avventura
    return parole[0] not in getattr(_mondo, "verbi_personalizzati", ())


def _compila(entry):
    global _mondo, _entry, _registro, _posizioni, _ingresso_dialogo
    _mondo = compila_mondo(entry)
    # Inizializzazioni che fa il main del gioco (gioco.py), NON compila_mondo:
    # registrare i verbi e piazzare il giocatore nella stanza di partenza.
    _mondo.carica_azioni(LIBRERIA_AZIONI)
    _mondo.imposta_posizione_iniziale()
    _entry = entry
    _registro, _posizioni, _ingresso_dialogo = [], [], None


def fav_boot(entry):
    buf = io.StringIO()
    try:
        with contextlib.redirect_stdout(buf):
            _compila(entry)
            mostra_stanza(_mondo)
    except Exception as e:
        return json.dumps({"text": buf.getvalue() + "\n[ERRORE DI COMPILAZIONE] " + str(e),
                           "continua": False, "stato": "errore"})
    return json.dumps({"text": buf.getvalue(), "continua": True,
                       "stato": getattr(_mondo, "stato_partita", "in_corso")})


def _ultima_istantanea():
    pila = getattr(_mondo, "_storia_stati", None) or []
    return pila[-1] if pila else None


def _annota(cmd, effettivo, era_in_dialogo, lunghezza_prima, pila_prima, ultima_prima):
    """Aggiorna la sequenza effettiva dopo un comando già eseguito."""
    global _ingresso_dialogo
    pulito = cmd.strip().lower()
    if not pulito:
        return
    if not era_in_dialogo and pulito in _SERVIZIO_ANNULLA:
        # ANNULLA riuscito: la pila si è accorciata, si tolgono i comandi del turno disfatto
        if len(getattr(_mondo, "_storia_stati", [])) < pila_prima and _posizioni:
            del _registro[_posizioni.pop():]
        return
    _registro.append(effettivo)
    if not era_in_dialogo and _mondo.in_dialogo():
        _ingresso_dialogo = lunghezza_prima
    nuova = _ultima_istantanea()
    if nuova is not None and nuova is not ultima_prima:
        # un turno (o un'intera conversazione) è diventato annullabile
        chiusa = era_in_dialogo and not _mondo.in_dialogo() and _ingresso_dialogo is not None
        _posizioni.append(_ingresso_dialogo if chiusa else lunghezza_prima)
        if chiusa:
            _ingresso_dialogo = None
        # la pila del motore ha un tetto: quando scarta la più vecchia, lo si segue
        while len(_posizioni) > len(_mondo._storia_stati):
            _posizioni.pop(0)


def fav_step(cmd):
    if _mondo is None:
        return json.dumps({"text": "", "continua": False, "stato": "errore"})
    pulito = cmd.strip().lower()
    if _comando_di_archivio(pulito):
        return json.dumps({"text": _AVVISO_SALVATAGGI, "continua": True,
                           "stato": getattr(_mondo, "stato_partita", "in_corso")})
    era_in_dialogo = _mondo.in_dialogo()
    # ANCORA si registra col comando che ripete: dopo un ANNULLA la sequenza
    # effettiva non contiene più il turno a cui «ancora» si riferiva.
    effettivo = cmd
    if not era_in_dialogo and pulito in _SERVIZIO_ANCORA:
        effettivo = getattr(_mondo, "ultimo_comando", None) or cmd
    lunghezza_prima = len(_registro)
    pila_prima = len(getattr(_mondo, "_storia_stati", []))
    ultima_prima = _ultima_istantanea()
    buf = io.StringIO()
    try:
        with contextlib.redirect_stdout(buf):
            continua = elabora_comando(_mondo, cmd)
    except Exception as e:
        return json.dumps({"text": buf.getvalue() + "\n[ERRORE] " + str(e),
                           "continua": True, "stato": getattr(_mondo, "stato_partita", "in_corso")})
    _annota(cmd, effettivo, era_in_dialogo, lunghezza_prima, pila_prima, ultima_prima)
    return json.dumps({"text": buf.getvalue(), "continua": bool(continua),
                       "stato": getattr(_mondo, "stato_partita", "in_corso")})


def _stato_essenziale():
    """Tutto ciò che distingue una partita dall'altra, in forma confrontabile."""
    m = _mondo
    oggetti = []
    for o in m.oggetti.values():
        oggetti.append([o.nome, str(o.posizione), sorted(o.proprieta), bool(getattr(o, "spostato", False)),
                        sorted(getattr(o, "contenuto", []) or [])])
    return {
        "luogo": m.posizione_giocatore,
        "turno": m.turno_corrente,
        "esito": m.stato_partita,
        "dialogo": [m.dialogo_attivo, m.nodo_dialogo],
        "inventario": sorted(m.inventario),
        "variabili": sorted([k, repr(v)] for k, v in m.variabili.items()),
        "oggetti": sorted(oggetti),
        "demoni": [bool(getattr(d, "era_vera", False)) for d in m.demoni],
        "caso": repr(m.rng.getstate()) if getattr(m, "rng", None) else "",
    }


def fav_impronta_stato():
    dati = json.dumps(_stato_essenziale(), sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(dati.encode("utf-8")).hexdigest()


def fav_impronta_avventura():
    """Impronta dei sorgenti dell'avventura e della versione del motore: dice se
    un salvataggio è stato fatto esattamente su questo gioco."""
    h = hashlib.sha256(VERSIONE_MOTORE.encode())
    cartella = os.path.dirname(_entry) if _entry else "."
    for nome in sorted(os.listdir(cartella)):
        if nome.endswith(".fav"):
            with open(os.path.join(cartella, nome), "rb") as f:
                h.update(nome.encode() + b"\0" + f.read().replace(b"\r\n", b"\n"))
    return h.hexdigest()


def fav_info():
    return json.dumps({"motore": VERSIONE_MOTORE})


def fav_salva():
    if _mondo is None:
        return json.dumps({"ok": False, "errore": "nessuna partita"})
    return json.dumps({
        "ok": True,
        "comandi": list(_registro),
        "impronta": fav_impronta_stato(),
        "avventura": fav_impronta_avventura(),
        "motore": VERSIONE_MOTORE,
        "turno": _mondo.turno_corrente,
        # ciò che ANCORA ripeterebbe: stato di sessione del motore, non ricostruibile
        # dalla sequenza (dopo un ANNULLA può essere proprio il comando annullato)
        "ultimo": getattr(_mondo, "ultimo_comando", None),
    }, ensure_ascii=False)


# Quanti comandi, in coda alla sequenza, si rigiocano con le istantanee di
# ANNULLA accese: dopo un caricamento si può disfare come nella partita
# originale. Il resto si rigioca a piena velocità, senza istantanee.
CODA_ANNULLA = 40


def fav_carica(entry, comandi_json, impronta_attesa="", ultimo=None):
    """Ricompila il mondo e rigioca la sequenza dei comandi. La testa della
    sequenza gira senza istantanee (sarebbero una copia profonda del mondo a
    ogni turno); gli ultimi CODA_ANNULLA comandi con le istantanee, così ANNULLA
    funziona anche subito dopo il caricamento. La coda comincia sempre fuori da
    una conversazione: una conversazione è un solo passo di ANNULLA, e la sua
    istantanea si prende all'ingresso."""
    global _ingresso_dialogo
    comandi = json.loads(comandi_json)
    inizio_coda = max(0, len(comandi) - CODA_ANNULLA)
    buf = io.StringIO()
    try:
        with contextlib.redirect_stdout(buf):
            _compila(entry)
            _mondo.cattura_stato = lambda: None
            veloce = True
            try:
                for i, c in enumerate(comandi):
                    if _mondo.stato_partita != "in_corso":
                        break
                    era_in_dialogo = _mondo.in_dialogo()
                    if veloce and i >= inizio_coda and not era_in_dialogo:
                        del _mondo.cattura_stato
                        veloce = False
                    if veloce:
                        turno_prima = _mondo.turno_corrente
                        elabora_comando(_mondo, c)
                        _registro.append(c)
                        if not era_in_dialogo and _mondo.in_dialogo():
                            _ingresso_dialogo = len(_registro) - 1
                        elif _mondo.turno_corrente > turno_prima and not era_in_dialogo:
                            _mondo.ultimo_comando = c
                    else:
                        # stesso percorso di fav_step: la sequenza non contiene
                        # mai ANNULLA né ANCORA, già risolti al salvataggio
                        lunghezza_prima = len(_registro)
                        pila_prima = len(_mondo._storia_stati)
                        ultima_prima = _ultima_istantanea()
                        elabora_comando(_mondo, c)
                        _annota(c, c, era_in_dialogo, lunghezza_prima, pila_prima, ultima_prima)
            finally:
                if veloce:
                    del _mondo.cattura_stato
            _mondo.ultimo_comando = ultimo
        uscita = io.StringIO()
        with contextlib.redirect_stdout(uscita):
            if not _mondo.in_dialogo():
                mostra_stanza(_mondo)
    except Exception as e:
        return json.dumps({"ok": False, "errore": f"{type(e).__name__}: {e}"})
    impronta = fav_impronta_stato()
    return json.dumps({
        "ok": True,
        "text": uscita.getvalue(),
        "impronta": impronta,
        "identica": (not impronta_attesa) or impronta == impronta_attesa,
        "stato": _mondo.stato_partita,
        "comandi": len(comandi),
        "annullabili": len(_mondo._storia_stati),
    }, ensure_ascii=False)


def fav_stato():
    # Istantanea del mondo per le schede laterali della UI: inventario (nomi
    # visualizzati), contatori (le variabili a valore INTERO), stanza corrente,
    # uscite, presenze, dialogo attivo, capienza, turno.
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
    uscite, presenti = [], []
    if stanza is not None:
        for d, sid in stanza.uscite.items():
            s2 = _mondo.trova_stanza(sid)
            uscite.append({"dir": d, "verso": s2.nome_visualizzato if s2 is not None else sid})
        if _mondo.c_e_luce():
            for og in stanza.oggetti.values():
                presenti.append({"nome": og.nome_visualizzato, "id": og.nome,
                                 "persona": bool(og.is_personaggio), "prendibile": bool(og.prendibile)})
    dialogo = None
    if _mondo.dialogo_attivo:
        npc = _mondo.trova_oggetto(_mondo.dialogo_attivo)
        nodo = _mondo.dialogo_nodi.get(_mondo.nodo_dialogo)
        if nodo is not None:
            try:
                from favella_utils import rendi_testo as _rt
            except Exception:
                _rt = lambda m, t: t  # noqa: E731
            dialogo = {"chi": npc.nome_visualizzato if npc is not None else "",
                       "opzioni": [_rt(_mondo, o.testo) for o in nodo.opzioni if o.disponibile(_mondo)]}
    try:
        capienza = _mondo.capacita_attuale()
    except Exception:
        capienza = None
    return json.dumps({"inventory": inv, "counters": counters,
                       "room": room, "roomId": _mondo.posizione_giocatore,
                       "exits": uscite, "present": presenti, "dialog": dialogo,
                       "capacity": capienza, "turn": getattr(_mondo, "turno_corrente", 0)})
