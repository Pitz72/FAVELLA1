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
import copy
import hashlib
import io
import json
import os
import sys

if os.path.isdir("/engine"):
    sys.path.insert(0, "/engine")

from compilatore import compila_mondo                   # noqa: E402
from gioco import elabora_comando, mostra_stanza        # noqa: E402
from gioco import _esegui_comando                       # noqa: E402  (privato: vedi fav_anteprima)
from libreria_azioni import LIBRERIA_AZIONI             # noqa: E402
from strutture import VERSIONE_MOTORE                   # noqa: E402
from strutture import ConseguenzaContatore, ConseguenzaLimita  # noqa: E402  (vedi _applica_i_limiti)

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


# «mangia» e «bere» soli. Il motore li chiederebbe all'oggetto («Cosa vuoi
# mangiare?»), ma qui il cibo e l'acqua sono scorte, non oggetti: il ponte li
# completa nel comando che il gioco conosce, e nella sequenza salvata entra
# quello. Non lo si fa nel gioco (`"mangia" è come …`) perché farebbe mangiare la
# scorta anche a «mangia la mappa».
_PAROLE_SOLE = {"mangia": "mangia qualcosa", "mangiare": "mangia qualcosa", "bere": "bevi"}


def _completa(cmd, in_dialogo):
    if in_dialogo or getattr(_mondo, "_in_conferma", None):
        return cmd
    pulito = cmd.strip().lower()
    if pulito in getattr(_mondo, "verbi_personalizzati", ()):
        return cmd
    return _PAROLE_SOLE.get(pulito, cmd)


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
    era_in_dialogo = _mondo.in_dialogo()
    cmd = _completa(cmd, era_in_dialogo)
    pulito = cmd.strip().lower()
    if _comando_di_archivio(pulito):
        return json.dumps({"text": _AVVISO_SALVATAGGI, "continua": True,
                           "stato": getattr(_mondo, "stato_partita", "in_corso")})
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


# --------------------------------------------------------------------
#  ANTEPRIMA. Che cosa farebbe un comando, senza farlo: l'interfaccia la usa
#  per chiedere conferma prima di una scelta che costa (un baratto, un dono,
#  una violenza) e per dire cosa cambia bere un sorso in più.
#
#  Il comando gira su una COPIA del mondo (mai sul mondo vero) e solo fino
#  alle sue conseguenze: senza il turno che ne segue, cioè senza eventi e
#  demoni, che con l'anteprima non c'entrano. Fanno eccezione i tetti e i
#  pavimenti (vedi _applica_i_limiti): dicono quanto dell'acqua guadagnata la
#  tanica trattiene davvero. Il caso è quello del mondo vero
#  (l'rng si copia), quindi ciò che l'anteprima mostra è ciò che succederà.
#  Per lo stesso motivo `_esegui_comando` è quello privato del motore: è la
#  funzione che il motore chiama per applicare il comando prima del turno.
# --------------------------------------------------------------------
def _copia_del_mondo():
    m = _mondo
    tenute = {k: getattr(m, k, None) for k in ("_storia_stati", "_snap_dialogo")}
    m._storia_stati, m._snap_dialogo = [], None
    try:
        copia = copy.deepcopy(m)
    finally:
        for k, v in tenute.items():
            setattr(m, k, v)
    copia.cattura_stato = lambda: None
    return copia


def _fotografia(m):
    contatori, stati = {}, {}
    for k, v in m.variabili.items():
        if isinstance(v, int) and not isinstance(v, bool):
            contatori[k] = v
        else:
            stati[k] = v
    return {"contatori": contatori, "stati": stati, "inventario": set(m.inventario),
            "esito": getattr(m, "stato_partita", "in_corso")}


def _nome(m, id_oggetto):
    og = m.oggetti.get(id_oggetto)
    return og.nome_visualizzato if og is not None else id_oggetto


def _applica_i_limiti(copia):
    """I tetti e i pavimenti di fine turno, sulla copia. Sono i demoni «Ogni turno
    se … : adesso X diventa N» (la tanica che tiene dieci litri, la sete che non
    scende sotto zero): fanno parte del turno che segue il comando, e senza non si
    vedrebbe che un baratto d'acqua con la tanica quasi piena la spreca. Si
    riconoscono dalla forma, non dal nome: tutte le conseguenze fissano un contatore
    (diventa, o resta fra due numeri). Il testo che dicono non serve qui."""
    for d in copia.demoni:
        if d.tipo != "ogni_turno" or not d.conseguenze:
            continue
        if not all(isinstance(c, ConseguenzaLimita)
                   or (isinstance(c, ConseguenzaContatore) and c.modo == "diventa") for c in d.conseguenze):
            continue
        if _vera(copia, d.condizione):
            d.esegui_conseguenze(copia)


def _anteprima_di(mondo, copia, cmd):
    """Il comando gira su `copia` (uguale a `mondo`): si confronta il prima e il dopo."""
    prima = _fotografia(mondo)
    copia._turno_libero = False
    uscita, errore = io.StringIO(), None
    try:
        with contextlib.redirect_stdout(uscita):
            _esegui_comando(copia, cmd)
    except Exception as e:                               # noqa: BLE001
        errore = f"{type(e).__name__}: {e}"
    grezzo = _fotografia(copia)
    delta = {k: v - prima["contatori"].get(k, 0) for k, v in grezzo["contatori"].items()
             if v != prima["contatori"].get(k, 0)}
    _applica_i_limiti(copia)
    dopo = _fotografia(copia)
    # ciò che il gesto dà e il tetto rimanda indietro: «acqua 9 + 3 = 12, la tanica tiene 10»
    sprecato = {k: grezzo["contatori"][k] - v for k, v in dopo["contatori"].items()
                if delta.get(k, 0) > 0 and grezzo["contatori"].get(k, 0) > v}
    stati = [{"nome": k, "prima": prima["stati"].get(k), "dopo": v}
             for k, v in dopo["stati"].items() if prima["stati"].get(k) != v]
    perde, ottiene = [], []
    for i in sorted(prima["inventario"] - dopo["inventario"]):
        og = copia.oggetti.get(i)
        # posato nel luogo dove si è (o in un contenitore che sta lì) non è perso
        if og is not None and og.posizione and (
                og.posizione == copia.posizione_giocatore
                or (og.posizione in copia.oggetti and not copia.oggetti[og.posizione].is_personaggio)):
            continue
        perde.append({"id": i, "nome": _nome(mondo, i)})
    for i in sorted(dopo["inventario"] - prima["inventario"]):
        ottiene.append({"id": i, "nome": _nome(copia, i)})
    return {
        "ok": errore is None, "errore": errore,
        "capito": not getattr(copia, "_turno_libero", False),
        "testo": uscita.getvalue(),
        "delta": delta, "stati": stati, "perde": perde, "ottiene": ottiene,
        "dopo": dopo["contatori"], "sprecato": sprecato, "esito": dopo["esito"],
        "dialogo": bool(copia.in_dialogo()),
    }


def fav_anteprima(cmd):
    if _mondo is None:
        return json.dumps({"ok": False})
    cmd = _completa(cmd, _mondo.in_dialogo())
    return json.dumps(_anteprima_di(_mondo, _copia_del_mondo(), cmd), ensure_ascii=False)


# --------------------------------------------------------------------
#  AZIONI. I verbi che l'autore ha scritto per QUESTO momento e che un pulsante
#  deve poter offrire, come il testo del luogo li suggerisce a parole
#  («ATTINGI per prendere acqua», «Col cibo lo puoi distrarre: GETTA CIBO»):
#    · senza oggetto (attingi, curati…): la regola che scatterebbe (la prima con
#      condizione vera; quella di ripiego senza condizione vale ovunque e non
#      conta) cambia il mondo. Al pozzo vuoto, con la tanica piena, «attingi»
#      direbbe solo «il pozzo ormai dà solo fango»: niente pulsante;
#    · con un bersaglio (attacca, minaccia…): il bersaglio è a portata e, come
#      sopra, la regola che scatterebbe cambia il mondo. A cane sviato «attacca il
#      cane» sparisce; a sbarra alzata sparisce «minaccia Vito», che direbbe solo
#      «La sbarra è già su». Due gesti che farebbero la stessa cosa alla stessa
#      persona («attacca Cosimo», «spara a Cosimo», col fucile) sono un pulsante
#      solo, il primo dichiarato;
#  Le combinazioni di due cose («usa le pastiglie sulla pompa») NON si offrono: dirle
#  sarebbe dare la soluzione. L'interfaccia le fa comporre (una cosa, poi l'altra) e
#  il motore risponde com'è giusto, anche con «non ha alcun effetto particolare».
#  Le condizioni si valutano senza consumare il caso.
# --------------------------------------------------------------------
def _vera(m, condizione):
    stato = m.rng.getstate()
    try:
        return bool(condizione.valuta(m))
    except Exception:                                    # noqa: BLE001
        return False
    finally:
        m.rng.setstate(stato)


def _firma(conseguenze):
    """Che cosa fa una regola al mondo, in forma confrontabile."""
    return repr([(type(c).__name__, sorted((k, repr(v)) for k, v in vars(c).items()))
                 for c in conseguenze])


def fav_azioni():
    m = _mondo
    if m is None:
        return json.dumps({"soli": [], "bersagli": []})
    portata = set(m.oggetti_raggiungibili()) if m.c_e_luce() else set(m.inventario)
    soli, bersagli, visti, effetti = [], [], set(), set()
    for r in m.regole:
        if getattr(r, "fase", "invece") != "invece" or r.verbo not in m.verbi_personalizzati:
            continue
        if r.condizione is None or not _vera(m, r.condizione):
            continue
        if r.globale:
            if r.verbo not in visti:
                visti.add(r.verbo)
                if r.conseguenze:
                    soli.append(r.verbo)
        elif (r.id_oggetto_bersaglio and r.categoria is None and r.id_oggetto_secondario is None
              and r.id_oggetto_bersaglio in portata and (r.verbo, r.id_oggetto_bersaglio) not in visti):
            visti.add((r.verbo, r.id_oggetto_bersaglio))
            if not r.conseguenze:
                continue
            firma = (r.id_oggetto_bersaglio, _firma(r.conseguenze))
            if firma in effetti:
                continue
            effetti.add(firma)
            bersagli.append({"verbo": r.verbo, "id": r.id_oggetto_bersaglio,
                             "nome": _nome(m, r.id_oggetto_bersaglio)})
    return json.dumps({"soli": soli, "bersagli": bersagli}, ensure_ascii=False)


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
    # nell'ordine in cui la storia dichiara gli oggetti: l'inventario del motore è
    # un insieme, e senza ordine la bisaccia cambiava disposizione a ogni partita
    for oid in ([o for o in _mondo.oggetti if o in _mondo.inventario]
                + sorted(o for o in _mondo.inventario if o not in _mondo.oggetti)):
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
    # Le voci che corrono su di te: gli stati «stato della voce del sangue»… che valgono «udita».
    # Il nome (senza «stato della voce ») è la chiave; l'interfaccia ha la riga per ciascuna.
    voci = [k[len("stato della voce "):] for k, v in _mondo.variabili.items()
            if k.startswith("stato della voce ") and v == "udita"]
    return json.dumps({"inventory": inv, "counters": counters, "voci": voci,
                       "room": room, "roomId": _mondo.posizione_giocatore,
                       "exits": uscite, "present": presenti, "dialog": dialogo,
                       "capacity": capienza, "turn": getattr(_mondo, "turno_corrente", 0),
                       # turni che ANNULLA può ancora disfare, e la domanda (sì/no) del
                       # motore in attesa («esci», «ricomincia»)
                       "undo": len(getattr(_mondo, "_storia_stati", ()) or ()),
                       "conferma": getattr(_mondo, "_in_conferma", None)})
