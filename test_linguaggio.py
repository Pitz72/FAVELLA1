# test_linguaggio.py
# Suite di test del LINGUAGGIO FAVELLA 1 (v0.33.0)
#
# Blocca le regressioni della grammatica e della semantica del compilatore.
# In particolare "congela" la disambiguazione delle frasi che la grammatica
# ammette in modo formalmente ambiguo (vedi note sulle priorità di regola in
# compilatore.py): qui verifichiamo che il risultato compilato sia quello atteso.
#
# Esecuzione:  python test_linguaggio.py
# Nessuna dipendenza esterna oltre a quelle del progetto (lark).

import io
import sys
import os
import re
import tempfile
import contextlib

from compilatore import (
    analizza_file, costruisci_symbol_table, costruisci_grammatica,
    costruisci_parser, PAROLE_RISERVATE, valida_direzioni_dichiarate,
    espandi_inclusioni, _GRAMMAR_TEMPLATE, analizza_file_strutturato,
    analizza_regole,
)


def _nomi_direzioni(simboli):
    """Nomi delle direzioni personalizzate valide raccolte in un corpus (per
    passarle a costruisci_grammatica/parser nei test della guardia)."""
    _, nomi, _ = valida_direzioni_dichiarate(simboli.coppie_direzioni, simboli)
    return nomi
from lark import Lark
from lark.exceptions import GrammarError

# --- Mini-framework minimale (niente pytest richiesto) -----------------------

_PASS = 0
_FAIL = 0
_FAILS = []


def _check(condizione, descrizione):
    global _PASS, _FAIL
    if condizione:
        _PASS += 1
        print(f"  OK   {descrizione}")
    else:
        _FAIL += 1
        _FAILS.append(descrizione)
        print(f"  FAIL {descrizione}")


def compila(sorgente):
    """Compila una stringa sorgente .fav e restituisce (mondo, log_stdout)."""
    with tempfile.NamedTemporaryFile(mode="w+", encoding="utf-8",
                                     delete=False, suffix=".fav") as tmp:
        tmp.write(sorgente)
        path = tmp.name
    buf = io.StringIO()
    try:
        with contextlib.redirect_stdout(buf):
            mondo = analizza_file(path)
    finally:
        os.unlink(path)
    return mondo, buf.getvalue()


def strutturato(src):
    """Compila via il percorso IDE (analizza_file_strutturato) scrivendo un file
    temporaneo, e restituisce il dict diagnostico {ok, errors, warnings, ...}."""
    with tempfile.NamedTemporaryFile(mode="w+", encoding="utf-8",
                                     delete=False, suffix=".fav") as tmp:
        tmp.write(src)
        path = tmp.name
    try:
        return analizza_file_strutturato(path)
    finally:
        os.unlink(path)


def regole_strutturate(src):
    """[Favella Studio] Modello editabile di regole/eventi (analizza_regole) da una
    stringa sorgente, via file temporaneo. Restituisce il dict {ok, rules, ...}."""
    with tempfile.NamedTemporaryFile(mode="w+", encoding="utf-8",
                                     delete=False, suffix=".fav") as tmp:
        tmp.write(src)
        path = tmp.name
    try:
        return analizza_regole(path, sorgente=src)
    finally:
        os.unlink(path)


def runtime(src):
    """Compila e prepara un mondo pronto al gioco (azioni + posizione iniziale)."""
    from libreria_azioni import LIBRERIA_AZIONI
    mondo, _ = compila(src)
    if mondo:
        mondo.carica_azioni(LIBRERIA_AZIONI)
        mondo.imposta_posizione_iniziale()
    return mondo


def esegui(mondo, comando):
    """Esegue un comando di gioco e restituisce l'output catturato."""
    from gioco import elabora_comando
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        elabora_comando(mondo, comando)
    return buf.getvalue()


# --- Test: disambiguazione delle definizioni base ----------------------------

def test_disambiguazione_definizioni():
    print("[disambiguazione definizioni base]")
    src = (
        "La cella è una stanza.\n"
        "Una chiave è una cosa.\n"
        "La chiave è in cella.\n"
        "La chiave è prendibile.\n"
        "La chiave è lucente.\n"
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "compila senza errori")
    _check("cella" in mondo.stanze, "la stanza 'cella' è definita")
    _check("chiave" in mondo.oggetti, "l'oggetto 'chiave' è definito")
    ogg = mondo.oggetti.get("chiave")
    _check(ogg is not None and ogg.posizione == "cella", "posizione = cella")
    _check(ogg is not None and ogg.prendibile is True, "è prendibile")
    _check(ogg is not None and "lucente" in ogg.proprieta, "ha proprietà 'lucente'")


def test_nomi_con_parole_quasi_riservate():
    print("[nomi entità che assomigliano a parole chiave]")
    src = (
        "La cosa nera è una stanza.\n"
        "Una via est è una cosa.\n"
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "compila senza errori")
    _check(mondo and "cosa nera" in mondo.stanze, "stanza 'cosa nera' (contiene 'cosa')")
    _check(mondo and "via est" in mondo.oggetti, "oggetto 'via est' (contiene 'est')")


# --- Test: posizione iniziale del giocatore [GG1] ----------------------------

def test_posizione_iniziale_dichiarata():
    print("[posizione iniziale esplicita]")
    src = (
        "La prima è una stanza.\n"
        "La seconda è una stanza.\n"
        "Il giocatore comincia in seconda.\n"
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "compila senza errori")
    _check(mondo and mondo.posizione_iniziale == "seconda", "posizione_iniziale = seconda")
    mondo.imposta_posizione_iniziale()
    _check(mondo.posizione_giocatore == "seconda",
           "il giocatore parte dalla stanza dichiarata, non dalla prima")


def test_posizione_iniziale_fallback():
    print("[posizione iniziale: fallback alla prima stanza]")
    src = "La prima è una stanza.\nLa seconda è una stanza.\n"
    mondo, _ = compila(src)
    mondo.imposta_posizione_iniziale()
    _check(mondo.posizione_giocatore == "prima",
           "senza dichiarazione si parte dalla prima stanza definita")


def test_posizione_iniziale_inesistente_e_errore():
    print("[posizione iniziale inesistente = errore bloccante]")
    src = "La prima è una stanza.\nIl giocatore comincia in inesistente.\n"
    mondo, log = compila(src)
    _check(mondo is None, "la compilazione fallisce (errore bloccante)")
    _check("partenza" in log.lower() or "inesistente" in log.lower(),
           "il log segnala la stanza di partenza inesistente")


# --- Test: validazione verbi [GG3] -------------------------------------------

def test_verbo_sconosciuto_genera_warning():
    print("[verbo di regola sconosciuto = warning, non blocca]")
    src = (
        "La cella è una stanza.\n"
        "Una porta è una cosa.\n"
        "La porta è in cella.\n"
        'Invece di sblocca la porta: dire "Non succede nulla.".\n'
    )
    mondo, log = compila(src)
    _check(mondo is not None, "compila comunque (warning non bloccante)")
    _check("sblocca" in log and "non si attiverà" in log.lower(),
           "il log avvisa che il verbo 'sblocca' non si attiverà mai")


def test_verbo_valido_nessun_warning():
    print("[verbo di regola valido = nessun warning]")
    src = (
        "La cella è una stanza.\n"
        "Una porta è una cosa.\n"
        "La porta è in cella.\n"
        'Invece di apri la porta: dire "È chiusa.".\n'
    )
    mondo, log = compila(src)
    _check(mondo is not None, "compila senza errori")
    _check("non si attiverà" not in log.lower(), "nessun avviso sul verbo 'apri'")


# --- Test: refuso proprietà nelle condizioni [GG2] ---------------------------

def test_refuso_proprieta_in_condizione():
    print("[proprietà mai assegnata in condizione = warning refuso]")
    src = (
        "La cella è una stanza.\n"
        "Una porta è una cosa.\n"
        "La porta è in cella.\n"
        "La porta è chiusa.\n"
        # refuso: 'chuisa' non viene mai assegnata
        'Invece di esamina la porta se la porta è chuisa: dire "Sbarrata.".\n'
    )
    mondo, log = compila(src)
    _check(mondo is not None, "compila comunque (warning non bloccante)")
    _check("chuisa" in log and "refuso" in log.lower(),
           "il log segnala il possibile refuso 'chuisa'")


def test_proprieta_da_conseguenza_non_e_refuso():
    print("[proprietà assegnata da conseguenza non è segnalata come refuso]")
    src = (
        "La cella è una stanza.\n"
        "Una porta è una cosa.\n"
        "La porta è in cella.\n"
        "La porta è chiusa.\n"
        'Invece di apri la porta: dire "Click." e adesso la porta è aperta.\n'
        'Invece di esamina la porta se la porta è aperta: dire "È aperta.".\n'
    )
    mondo, log = compila(src)
    _check(mondo is not None, "compila senza errori")
    _check("refuso" not in log.lower(),
           "'aperta' (assegnata da conseguenza) non genera falso positivo")


# --- Test: escape nelle stringhe [M6] ----------------------------------------

def test_escape_virgolette_nelle_stringhe():
    print("[escape \\\" dentro le stringhe]")
    src = (
        "La cella è una stanza.\n"
        'La descrizione della cella è "Lui disse \\"ciao\\" e se ne andò.".\n'
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "compila senza errori")
    desc = mondo.stanze["cella"].descrizione if mondo else ""
    _check('"ciao"' in desc, f"le virgolette interne sono preservate: {desc!r}")


# --- Test: normalizzazione tipografica [L2] ----------------------------------

def test_normalizzazione_apostrofo_tipografico():
    print("[apostrofo tipografico ’ normalizzato]")
    # Usa l'apostrofo curvo U+2019 nel sorgente
    src = (
        "La cella è una stanza.\n"
        "Una porta è una cosa.\n"
        "La porta è in cella.\n"
        'Invece di apri la porta: dire "L’uscio è sbarrato.".\n'
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "compila nonostante l'apostrofo tipografico")


# --- Test: la storia di esempio del repo compila ancora ----------------------

def test_storia_esempio_compila():
    print("[storia.fav del repository compila]")
    percorso = os.path.join(os.path.dirname(__file__), "esempi", "materiale-didattico", "storia.fav")
    if not os.path.exists(percorso):
        _check(True, "storia.fav non presente: test saltato")
        return
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        mondo = analizza_file(percorso)
    _check(mondo is not None, "storia.fav compila correttamente")
    _check(mondo and len(mondo.stanze) >= 2, "ha almeno 2 stanze")


# --- Test: logica composita [Livello 2 / G2, M3] -----------------------------

# Mondo base riutilizzabile per i test sulle condizioni
_BASE = (
    "La cella è una stanza.\n"
    "Una porta è una cosa.\nLa porta è in cella.\nLa porta è chiusa.\n"
    "Una chiave è una cosa.\nLa chiave è in cella.\nLa chiave è prendibile.\n"
)


def test_condizione_and():
    print("[condizione AND]")
    src = _BASE + ('Invece di apri la porta se la porta è chiusa e il '
                   'giocatore ha la chiave: dire "ok".\n')
    mondo, _ = compila(src)
    cond = mondo.regole[0].condizione
    _check(type(cond).__name__ == "CondizioneAnd", "la condizione è un AND")
    _check(cond.valuta(mondo) is False, "AND falso senza la chiave")
    mondo.inventario.add("chiave")
    _check(cond.valuta(mondo) is True, "AND vero con la chiave (porta già chiusa)")


def test_condizione_or():
    print("[condizione OR (oppure)]")
    src = _BASE + ('Invece di apri la porta se il giocatore ha la chiave '
                   'oppure la porta è chiusa: dire "ok".\n')
    mondo, _ = compila(src)
    cond = mondo.regole[0].condizione
    _check(type(cond).__name__ == "CondizioneOr", "la condizione è un OR")
    _check(cond.valuta(mondo) is True, "OR vero (porta chiusa) anche senza chiave")


def test_negazione_possesso():
    print("[negazione: il giocatore non ha X]")
    src = _BASE + ('Invece di apri la porta se il giocatore non ha la '
                   'chiave: dire "Ti manca qualcosa.".\n')
    mondo, _ = compila(src)
    cond = mondo.regole[0].condizione
    _check(type(cond).__name__ == "CondizioneNot", "la condizione è una negazione")
    _check(cond.valuta(mondo) is True, "vera quando il giocatore NON ha la chiave")
    mondo.inventario.add("chiave")
    _check(cond.valuta(mondo) is False, "falsa quando il giocatore ha la chiave")


def test_negazione_proprieta():
    print("[negazione: X non è Y]")
    src = _BASE + ('Invece di esamina la porta se la porta non è aperta: '
                   'dire "Ancora chiusa.".\n')
    mondo, _ = compila(src)
    cond = mondo.regole[0].condizione
    _check(type(cond).__name__ == "CondizioneNot",
           "la condizione è una negazione di proprietà")
    _check(cond.valuta(mondo) is True,
           "vera: la porta (chiusa) non è aperta")


def test_conseguenze_multiple():
    print("[conseguenze multiple concatenate]")
    src = _BASE + ('Invece di usa la chiave su la porta: dire "Click." '
                   'e adesso la porta è aperta e adesso la chiave è nel nulla.\n')
    mondo, _ = compila(src)
    regola = mondo.regole[0]
    _check(len(regola.conseguenze) == 2, "due conseguenze registrate")
    regola.esegui_conseguenze(mondo)
    porta = mondo.trova_oggetto("porta")
    chiave = mondo.trova_oggetto("chiave")
    _check("aperta" in porta.proprieta, "1ª conseguenza: la porta è aperta")
    _check(chiave.posizione is None, "2ª conseguenza: la chiave è nel nulla")


def test_conseguenze_multiple_forma_breve():
    print("[conseguenze multiple, forma breve 'e adesso X e Y']")
    src = _BASE + ('Invece di usa la chiave su la porta: dire "Click." '
                   'e adesso la porta è aperta e la chiave è nel nulla.\n')
    mondo, _ = compila(src)
    _check(len(mondo.regole[0].conseguenze) == 2,
           "due conseguenze anche senza ripetere 'adesso'")


def test_refuso_dentro_condizione_composita():
    print("[il rilevamento refusi guarda dentro AND/OR/NOT]")
    src = _BASE + ('Invece di apri la porta se il giocatore ha la chiave e '
                   'la porta è chuisa: dire "x".\n')  # 'chuisa' = refuso
    mondo, log = compila(src)
    _check(mondo is not None, "compila comunque (warning non bloccante)")
    _check("chuisa" in log and "refuso" in log.lower(),
           "il refuso 'chuisa' viene rilevato anche dentro un AND")


# --- Test: proprietà opposte dichiarabili [Livello 3 / M5] -------------------

def test_opposti_dichiarati():
    print("[proprietà opposte dichiarate dall'autore]")
    src = (
        "La cella è una stanza.\n"
        "Una lampada è una cosa.\nLa lampada è in cella.\n"
        "Accesa e spenta sono opposte.\n"
        "La lampada è spenta.\n"
        'Invece di usa la lampada: dire "Click." e adesso la lampada è accesa.\n'
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "compila senza errori")
    _check(mondo and "spenta" in mondo.opposti.get("accesa", set()),
           "la coppia è registrata simmetricamente")
    _check(mondo and "accesa" in mondo.opposti.get("spenta", set()),
           "la relazione è simmetrica anche al contrario")
    ogg = mondo.trova_oggetto("lampada") if mondo else None
    _check(ogg is not None and "spenta" in ogg.proprieta, "stato iniziale: spenta")
    mondo.regole[0].esegui_conseguenze(mondo)
    _check("accesa" in ogg.proprieta and "spenta" not in ogg.proprieta,
           "accendere rimuove 'spenta' (le opposte si escludono)")


def test_opposti_default_aperta_chiusa():
    print("[retro-compat: aperta/chiusa opposte di default, senza dichiararle]")
    src = (
        "La cella è una stanza.\n"
        "Una porta è una cosa.\nLa porta è in cella.\nLa porta è chiusa.\n"
        'Invece di apri la porta: dire "Click." e adesso la porta è aperta.\n'
    )
    mondo, _ = compila(src)
    porta = mondo.trova_oggetto("porta") if mondo else None
    _check(porta is not None and "chiusa" in porta.proprieta, "porta inizialmente chiusa")
    mondo.regole[0].esegui_conseguenze(mondo)
    _check("aperta" in porta.proprieta and "chiusa" not in porta.proprieta,
           "aprire rimuove 'chiusa' anche senza dichiarazione esplicita")


def test_concordanza_genere_proprieta():
    print("[concordanza: le proprietà di stato ignorano genere/numero (aperto = aperta)]")
    from utils import radice_proprieta
    _check(radice_proprieta("aperto") == radice_proprieta("aperta") == "apert",
           "aperto e aperta hanno la stessa radice 'apert'")
    _check(radice_proprieta("chiuso") == radice_proprieta("chiuse") == "chius",
           "chiuso/chiuse -> 'chius'")
    _check(radice_proprieta("chuisa") != radice_proprieta("chiusa"),
           "un refuso ('chuisa') resta una radice distinta (il linter lo intercetta)")

    # Contenitore dichiarato al MASCHILE ('chiuso') e aperto con 'aperto': deve
    # funzionare come 'chiusa'/'aperta' (genere ignorato dal motore).
    src = (
        "La cucina è una stanza.\n"
        "Il portale è un contenitore.\nIl portale è in cucina.\nIl portale è chiuso.\n"
        "La gemma è una cosa.\nLa gemma è nel portale.\n"
        "La chiave è una cosa.\nLa chiave è prendibile.\nLa chiave è in cucina.\n"
        "Il giocatore comincia in cucina.\n"
        'Invece di usa la chiave su il portale se il portale è chiuso: '
        'dire "Si apre." e adesso il portale è aperto.\n'
    )
    mondo, _ = compila(src)
    portale = mondo.trova_oggetto("portale") if mondo else None
    _check(portale is not None and not mondo.contenitore_aperto(portale),
           "un contenitore 'chiuso' (maschile) è chiuso come 'chiusa'")
    _check(mondo.regole[0].condizione.valuta(mondo),
           "la condizione 'è chiuso' è vera (combacia con la dichiarazione)")
    mondo.regole[0].esegui_conseguenze(mondo)
    _check(mondo.contenitore_aperto(portale),
           "'è aperto' apre davvero il contenitore (rimuove 'chiuso')")

    # Condizione incrociata: stato 'aperta', condizione 'è aperto'.
    src2 = (
        "La cella è una stanza.\n"
        "La porta è una cosa.\nLa porta è in cella.\nLa porta è aperta.\n"
        'Invece di guarda la porta se la porta è aperto: dire "Spalancata.".\n'
    )
    mondo2, _ = compila(src2)
    _check(mondo2 is not None and mondo2.regole[0].condizione.valuta(mondo2),
           "condizione 'è aperto' combacia con la proprietà 'aperta'")

    # Coppia opposta dichiarata al maschile, usata al femminile.
    src3 = (
        "La sala è una stanza.\n"
        "La lampada è una cosa.\nLa lampada è in sala.\n"
        "acceso e spento sono opposte.\nLa lampada è accesa.\n"
        'Invece di spegni la lampada: dire "Buio." e adesso la lampada è spenta.\n'
    )
    mondo3, _ = compila(src3)
    lampada = mondo3.trova_oggetto("lampada") if mondo3 else None
    _check(lampada is not None and "accesa" in lampada.proprieta, "lampada inizialmente accesa")
    mondo3.regole[0].esegui_conseguenze(mondo3)
    _check("spenta" in lampada.proprieta and "accesa" not in lampada.proprieta,
           "'spenta' rimuove 'accesa' benché la coppia sia dichiarata 'acceso/spento'")

    # Il linter NON deve segnalare refuso per la differenza di sola concordanza.
    refusi = [w for w in analizza_file_strutturato("<concordanza>", src)["warnings"]
              if "refuso" in w.get("message", "").lower()]
    _check(refusi == [], "nessun falso warning di refuso per 'aperto' vs 'chiuso'")


# --- Test: alias/sinonimi di oggetti [Livello 4] -----------------------------

def test_alias_risoluzione_esatta():
    print("[alias: il giocatore può riferire l'oggetto col sinonimo]")
    from gioco import risolvi_nome_oggetto
    from libreria_azioni import LIBRERIA_AZIONI
    src = (
        "La cella è una stanza.\n"
        "Il giocatore comincia in cella.\n"
        "Una torcia è una cosa.\nLa torcia è in cella.\n"
        'La torcia si chiama anche "lanterna".\n'
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "compila senza errori")
    _check(mondo and mondo.alias.get("lanterna") == "torcia",
           "l'alias 'lanterna' rimanda all'id canonico 'torcia'")
    mondo.carica_azioni(LIBRERIA_AZIONI)
    mondo.imposta_posizione_iniziale()
    _check(risolvi_nome_oggetto(mondo, "lanterna") == "torcia",
           "l'input 'lanterna' risolve all'oggetto 'torcia'")
    _check(risolvi_nome_oggetto(mondo, "torcia") == "torcia",
           "il nome canonico continua a risolvere")


def test_alias_multiparola_quotato():
    print("[alias: sinonimo multiparola tra virgolette]")
    src = (
        "La cella è una stanza.\n"
        "Una keycard magnetica è una cosa.\nLa keycard magnetica è in cella.\n"
        'La keycard magnetica si chiama anche "tessera blu".\n'
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "compila senza errori")
    _check(mondo and mondo.alias.get("tessera blu") == "keycard magnetica",
           "alias multiparola normalizzato e mappato all'oggetto")


def test_alias_parziale():
    print("[alias: match parziale univoco via sinonimo]")
    from gioco import risolvi_nome_oggetto
    from libreria_azioni import LIBRERIA_AZIONI
    src = (
        "La cella è una stanza.\n"
        "Il giocatore comincia in cella.\n"
        "Una torcia è una cosa.\nLa torcia è in cella.\n"
        'La torcia si chiama anche "lanterna".\n'
    )
    mondo, _ = compila(src)
    mondo.carica_azioni(LIBRERIA_AZIONI)
    mondo.imposta_posizione_iniziale()
    _check(risolvi_nome_oggetto(mondo, "lant") == "torcia",
           "un prefisso dell'alias risolve comunque all'oggetto")


def test_alias_su_non_oggetto_warning():
    print("[alias: bersaglio non-oggetto (una stanza) = warning non bloccante]")
    # 'cella' è dichiarata (quindi è una ENTITA valida e la frase parsa), ma è una
    # STANZA, non un oggetto: l'alias non potrà mai risolvere un oggetto -> warning.
    src = (
        "La cella è una stanza.\n"
        'La cella si chiama anche "stanzino".\n'
    )
    mondo, log = compila(src)
    _check(mondo is not None, "compila comunque (warning non bloccante)")
    _check("alias" in log.lower() and "stanzino" in log.lower(),
           "il log avvisa che l'alias non punta a un oggetto")


# --- Test: verbi personalizzati [Livello 4 / M1] -----------------------------

def test_verbo_personalizzato_dichiarazione():
    print("[verbo personalizzato: dichiarazione e niente warning 'regola morta']")
    src = (
        "La cella è una stanza.\n"
        "Una pietra è una cosa.\nLa pietra è in cella.\n"
        '"spingi" è un comando.\n'
        'Invece di spingi la pietra: dire "La pietra rotola via.".\n'
    )
    mondo, log = compila(src)
    _check(mondo is not None, "compila senza errori")
    _check(mondo and "spingi" in mondo.verbi_personalizzati,
           "il verbo 'spingi' è registrato tra i verbi personalizzati")
    _check("non si attiverà" not in log.lower(),
           "una regola con verbo dichiarato NON è segnalata come morta")


def test_verbo_personalizzato_runtime():
    print("[verbo personalizzato: a runtime attiva la regola]")
    from gioco import elabora_comando
    from libreria_azioni import LIBRERIA_AZIONI
    src = (
        "La cella è una stanza.\n"
        "Il giocatore comincia in cella.\n"
        "Una pietra è una cosa.\nLa pietra è in cella.\n"
        '"spingi" è un comando.\n'
        'Invece di spingi la pietra: dire "La pietra rotola via.".\n'
    )
    mondo, _ = compila(src)
    mondo.carica_azioni(LIBRERIA_AZIONI)
    mondo.imposta_posizione_iniziale()
    _check(mondo.mappa_verbi_giocatore.get("spingi") == "_personalizzata",
           "il verbo custom è instradato all'azione generica")
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        elabora_comando(mondo, "spingi pietra")
    _check("rotola via" in buf.getvalue(),
           "il comando custom attiva la regola e ne stampa la risposta")


def test_verbo_personalizzato_senza_regola():
    print("[verbo personalizzato: senza regola applicabile = messaggio neutro]")
    from gioco import elabora_comando
    from libreria_azioni import LIBRERIA_AZIONI
    src = (
        "La cella è una stanza.\n"
        "Il giocatore comincia in cella.\n"
        "Una pietra è una cosa.\nLa pietra è in cella.\n"
        '"spingi" è un comando.\n'  # nessuna regola 'Invece di spingi ...'
    )
    mondo, _ = compila(src)
    mondo.carica_azioni(LIBRERIA_AZIONI)
    mondo.imposta_posizione_iniziale()
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        elabora_comando(mondo, "spingi pietra")
    _check("Non succede nulla" in buf.getvalue(),
           "un verbo custom senza regola stampa un messaggio neutro, non 'non capisco'")


def test_verbo_personalizzato_multiparola_accettato():
    print("[verbo personalizzato: multiparola ORA accettato (0.18.0 / B6)]")
    # Cambio di comportamento dalla 0.18.0: un comando multi-parola non è più
    # ignorato, ma registrato e usabile (vedi test_verbo_multiparola_*).
    src = (
        "La cella è una stanza.\n"
        '"dai un calcio" è un comando.\n'
    )
    mondo, log = compila(src)
    _check(mondo is not None, "compila senza errori")
    _check(mondo and "dai un calcio" in mondo.verbi_personalizzati,
           "il comando multiparola è registrato (niente più rifiuto)")


# --- Test: direzioni personalizzate / data-driven [Livello 4 / L1] -----------

def test_direzioni_personalizzate_connessione():
    print("[direzioni custom: connessione + auto-ritorno con l'opposta]")
    src = (
        "La torre è una stanza.\n"
        "La cantina è una stanza.\n"
        "Alto e basso sono direzioni opposte.\n"
        "La torre collega basso a cantina.\n"
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "compila senza errori")
    _check(mondo and mondo.stanze["torre"].uscite.get("basso") == "cantina",
           "la connessione usa la direzione personalizzata 'basso'")
    _check(mondo and mondo.stanze["cantina"].uscite.get("alto") == "torre",
           "auto-ritorno con l'opposta 'alto'")


def test_direzioni_personalizzate_runtime():
    print("[direzioni custom: movimento a runtime]")
    from gioco import elabora_comando
    from libreria_azioni import LIBRERIA_AZIONI
    src = (
        "La torre è una stanza.\n"
        "La cantina è una stanza.\n"
        "Il giocatore comincia in torre.\n"
        "Alto e basso sono direzioni opposte.\n"
        "La torre collega basso a cantina.\n"
    )
    mondo, _ = compila(src)
    mondo.carica_azioni(LIBRERIA_AZIONI)
    mondo.imposta_posizione_iniziale()
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        elabora_comando(mondo, "basso")
    _check(mondo.posizione_giocatore == "cantina",
           "digitare la direzione custom 'basso' muove il giocatore")
    with contextlib.redirect_stdout(io.StringIO()):
        elabora_comando(mondo, "alto")
    _check(mondo.posizione_giocatore == "torre",
           "l'opposta 'alto' riporta indietro")


def test_direzione_regola_canonicalizza_abbreviazione():
    print("[direzioni: 'Invece di vai n' combacia con il movimento a nord]")
    src = (
        "La cella è una stanza.\n"
        "Il corridoio è una stanza.\n"
        "La cella collega nord a corridoio.\n"
        'Invece di vai n: dire "Bloccato.".\n'  # abbreviazione 'n' nella regola
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "compila senza errori")
    _check(mondo and mondo.regole[0].id_oggetto_bersaglio == "nord",
           "il bersaglio 'n' è canonicalizzato a 'nord'")


def test_direzione_conflitto_parola_riservata_errore():
    print("[direzioni: conflitto con parola riservata = errore bloccante]")
    src = (
        "La cella è una stanza.\n"
        "Su e giù sono direzioni opposte.\n"  # 'su' è una preposizione riservata
    )
    mondo, log = compila(src)
    _check(mondo is None, "la compilazione fallisce (conflitto bloccante)")
    _check("direzione" in log.lower() and "conflitto" in log.lower(),
           "il log spiega il conflitto della direzione con una parola riservata")


def test_scanner_raccoglie_direzioni():
    print("[scanner: 'A e B sono direzioni opposte' popola le coppie]")
    src = (
        "La cella è una stanza.\n"
        "Dentro e fuori sono direzioni opposte.\n"
    )
    tab = costruisci_symbol_table(src)
    _check(("dentro", "fuori") in tab.coppie_direzioni,
           "la coppia di direzioni è raccolta in Passata 1")
    _check("dentro" not in tab.tutti and "fuori" not in tab.tutti,
           "le direzioni NON sono entità")


# --- Test: contenitori e supporti — modello [Livello 4 / M1] -----------------

def test_contenitore_dichiarazione():
    print("[contenitore: dichiarazione = oggetto con flag is_contenitore]")
    src = (
        "La cella è una stanza.\n"
        "Una scatola è un contenitore.\nLa scatola è in cella.\n"
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "compila senza errori")
    scatola = mondo.trova_oggetto("scatola") if mondo else None
    _check(scatola is not None, "il contenitore è registrato come oggetto")
    _check(scatola is not None and scatola.is_contenitore, "ha il flag is_contenitore")
    _check(scatola is not None and scatola.posizione == "cella", "è collocato nella stanza")


def test_supporto_dichiarazione():
    print("[supporto: dichiarazione = oggetto con flag is_supporto]")
    src = (
        "La cella è una stanza.\n"
        "Un tavolo è un supporto.\nIl tavolo è in cella.\n"
    )
    mondo, _ = compila(src)
    tavolo = mondo.trova_oggetto("tavolo") if mondo else None
    _check(tavolo is not None and tavolo.is_supporto, "ha il flag is_supporto")


def test_collocazione_in_contenitore():
    print("[collocazione: 'X è nella scatola' colloca X dentro il contenitore]")
    src = (
        "La cella è una stanza.\n"
        "Una scatola è un contenitore.\nLa scatola è in cella.\n"
        "Una gemma è una cosa.\nLa gemma è nella scatola.\n"
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "compila senza errori")
    gemma = mondo.trova_oggetto("gemma") if mondo else None
    scatola = mondo.trova_oggetto("scatola") if mondo else None
    _check(gemma is not None and gemma.posizione == "scatola",
           "la gemma 'vive' nel contenitore scatola")
    _check(scatola is not None and "gemma" in scatola.contenuto,
           "il contenitore conosce il proprio contenuto")


def test_collocazione_su_supporto():
    print("[collocazione: 'X è sul tavolo' colloca X sul supporto]")
    src = (
        "La cella è una stanza.\n"
        "Un tavolo è un supporto.\nIl tavolo è in cella.\n"
        "Una tazza è una cosa.\nLa tazza è sul tavolo.\n"
    )
    mondo, _ = compila(src)
    tavolo = mondo.trova_oggetto("tavolo") if mondo else None
    _check(tavolo is not None and "tazza" in tavolo.contenuto,
           "la tazza è sul supporto tavolo")


def test_collocazione_su_non_contenitore_errore():
    print("[collocazione: dentro un oggetto non-contenitore = errore bloccante]")
    src = (
        "La cella è una stanza.\n"
        "Una pietra è una cosa.\nLa pietra è in cella.\n"
        "Una gemma è una cosa.\nLa gemma è nella pietra.\n"  # pietra non è contenitore
    )
    mondo, log = compila(src)
    _check(mondo is None, "la compilazione fallisce")
    _check("contenitore" in log.lower() or "supporto" in log.lower(),
           "il log spiega che la pietra non è un contenitore/supporto")


# --- Test: ROBUSTEZZA D'ORDINE [0.17.0] --------------------------------------
# L'ordine delle frasi non deve più contare: posizioni, proprietà, descrizioni e
# conseguenze risolvono le entità in valida_post, a mondo completo.

def test_ordine_posizione_prima_della_stanza():
    print("[ordine: 'X è in Y' funziona PRIMA che la stanza Y sia definita]")
    src = (
        "La torcia è una cosa.\n"
        "La torcia è in cucina.\n"     # cucina non ancora definita
        "La cucina è una stanza.\n"
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "compila nonostante la posizione preceda la stanza")
    _check(mondo.trova_oggetto("torcia").posizione == "cucina",
           "la torcia è collocata in cucina")
    _check("torcia" in mondo.trova_stanza("cucina").oggetti,
           "la stanza elenca la torcia")


def test_ordine_collocazione_prima_del_contenitore():
    print("[ordine: 'La gemma è nella scatola' PRIMA di 'La scatola è un contenitore']")
    src = (
        "La cripta è una stanza.\n"
        "La gemma è una cosa.\n"
        "La gemma è nella scatola.\n"   # scatola non ancora dichiarata contenitore
        "La scatola è un contenitore.\n"
        "La scatola è in cripta.\n"
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "compila nonostante la collocazione preceda il contenitore")
    _check("gemma" in mondo.trova_oggetto("scatola").contenuto,
           "la gemma è dentro la scatola")


def test_ordine_proprieta_prima_dell_oggetto():
    print("[ordine: 'La porta è chiusa' PRIMA di 'La porta è una cosa']")
    src = (
        "L'ingresso è una stanza.\n"
        "La porta è chiusa.\n"          # proprietà prima della dichiarazione
        "La porta è una cosa.\n"
        "La porta è in ingresso.\n"
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "compila nonostante la proprietà preceda l'oggetto")
    _check("chiusa" in mondo.trova_oggetto("porta").proprieta,
           "la proprietà 'chiusa' è applicata")


def test_ordine_descrizione_prima_dell_entita():
    print("[ordine: la descrizione PRIMA della dichiarazione dell'entità]")
    src = (
        'La descrizione della spada è "Una lama affilata.".\n'  # prima
        "La spada è una cosa.\n"
        "L'armeria è una stanza.\nLa spada è in armeria.\n"
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "compila nonostante la descrizione preceda l'entità")
    _check(mondo.trova_oggetto("spada").descrizione == "Una lama affilata.",
           "la descrizione è applicata")


def test_ordine_conseguenza_verso_oggetto_definito_dopo():
    print("[ordine: una conseguenza riferisce un oggetto definito DOPO]")
    src = (
        "La stanza è una stanza.\n"
        "Il giocatore comincia in stanza.\n"
        'Invece di guarda: dire "Prendi la chiave." e adesso la chiave è in inventario.\n'
        "La chiave è una cosa.\n"      # definita dopo la regola che la sposta
        "La chiave è in stanza.\n"
    )
    mondo, _ = compila(src)
    _check(mondo is not None,
           "compila: la conseguenza è validata a mondo completo, non in ordine")


def test_ordine_destinazione_inesistente_resta_errore():
    print("[ordine: una destinazione MAI definita resta un errore bloccante]")
    src = (
        "La stanza è una stanza.\n"
        "La gemma è una cosa.\n"
        "La gemma è nel forziere.\n"   # forziere non esiste da nessuna parte
    )
    mondo, log = compila(src)
    _check(mondo is None, "la destinazione inesistente fallisce ancora la compilazione")


def test_ordine_regola_bersaglio_definito_dopo():
    print("[ordine: 'Invece di apri la porta' PRIMA che 'la porta' sia dichiarata]")
    src = (
        "L'atrio è una stanza.\n"
        "Il giocatore comincia in atrio.\n"
        'Invece di apri la porta: dire "È sigillata.".\n'   # porta non ancora definita
        "La porta è una cosa.\n"
        "La porta è in atrio.\n"
    )
    mondo = runtime(src)
    _check(mondo is not None, "la regola compila anche se il bersaglio è definito dopo")
    out = esegui(mondo, "apri porta")
    _check("È sigillata." in out, "la regola scatta correttamente a runtime")


def test_linter_demone_non_falsa_variabile_inutilizzata():
    print("[audit/linter: una variabile usata SOLO in un demone non è 'inutilizzata']")
    src = (
        "La cella è una stanza.\n"
        "Il giocatore comincia in cella.\n"
        "L'allarme è un contatore.\n"
        'Quando l\'allarme è almeno 3: dire "Suona." e adesso vinci.\n'
    )
    mondo, log = compila(src)
    _check(mondo is not None, "compila")
    _check("inutilizz" not in log.lower(),
           "l'allarme, usato nella condizione del demone, non è segnalato inutilizzato")


def test_linter_demone_non_falsa_oggetto_orfano():
    print("[audit/linter: un oggetto introdotto SOLO da un demone non è 'orfano']")
    src = (
        "La cella è una stanza.\n"
        "Il giocatore comincia in cella.\n"
        "Il punteggio è un contatore.\n"
        "La chiave è una cosa.\n"            # mai collocata in una stanza
        'Ogni turno se il punteggio è almeno 1: dire "Tintinnio." e adesso la chiave è in inventario.\n'
    )
    mondo, log = compila(src)
    _check(mondo is not None, "compila")
    _check("mai collocato" not in log.lower(),
           "la chiave, introdotta dalla conseguenza del demone, non è segnalata orfana")


def test_comando_dopo_fine_partita_e_noop():
    print("[audit: a partita finita un comando è un no-op (niente turni/eventi)]")
    src = (
        "La cella è una stanza.\n"
        "Il giocatore comincia in cella.\n"
        'Al turno 1: dire "Fine." e adesso perdi.\n'
        'Ogni 1 turno: dire "TICK." e adesso vinci.\n'
    )
    mondo = runtime(src)
    esegui(mondo, "guarda")               # turno 1 -> perdi
    turno_dopo_fine = mondo.turno_corrente
    out2 = esegui(mondo, "guarda")        # a partita persa: no-op
    _check(mondo.stato_partita == "persa", "la partita resta persa")
    _check(mondo.turno_corrente == turno_dopo_fine,
           "il contatore dei turni non avanza dopo la fine")
    _check(out2.strip() == "", "nessun output: l'evento 'Ogni turno' non riscatta")


def test_ordine_regola_bersaglio_non_oggetto_resta_errore():
    print("[ordine: una regola su un bersaglio che non è un oggetto resta un errore]")
    src = (
        "L'atrio è una stanza.\n"
        "Il giocatore comincia in atrio.\n"
        'Invece di apri l\'atrio: dire "...".\n'   # atrio è una stanza, non un oggetto
    )
    mondo, log = compila(src)
    _check(mondo is None, "il bersaglio non-oggetto fallisce ancora la compilazione")
    _check("inesistente" in log.lower(), "il log segnala il bersaglio non valido")


def test_scanner_raccoglie_contenitori():
    print("[scanner: 'X è un contenitore' popola gli oggetti]")
    src = "La cella è una stanza.\nUno scrigno è un contenitore.\n"
    tab = costruisci_symbol_table(src)
    _check("scrigno" in tab.oggetti, "il contenitore è tra gli oggetti")


# --- Test: contenitori e supporti — runtime [Livello 4 / M1] -----------------

_MONDO_CONTENITORE = (
    "La cella è una stanza.\n"
    "Il giocatore comincia in cella.\n"
    "Una scatola è un contenitore.\nLa scatola è in cella.\n"
    "Una gemma è una cosa.\nLa gemma è prendibile.\n"
)


def test_runtime_contenitore_aperto_scope():
    print("[runtime: il contenuto di un contenitore aperto è raggiungibile]")
    mondo = runtime(_MONDO_CONTENITORE + "La gemma è nella scatola.\n")
    _check(mondo is not None, "compila e prepara il runtime")
    _check("gemma" in mondo.oggetti_raggiungibili(),
           "la gemma in un contenitore aperto è nello scope")
    out = esegui(mondo, "prendi gemma")
    _check("Preso" in out and "gemma" in mondo.inventario,
           "si può prendere la gemma da dentro il contenitore aperto")
    _check(mondo.trova_oggetto("scatola").contenuto == set(),
           "presa la gemma, il contenitore è vuoto")


def test_runtime_contenitore_chiuso_nasconde():
    print("[runtime: un contenitore chiuso nasconde il contenuto, l'apertura lo rivela]")
    src = (_MONDO_CONTENITORE + "La gemma è nella scatola.\n"
           "La scatola è chiusa.\n"
           'Invece di apri la scatola: dire "Si apre." e adesso la scatola è aperta.\n')
    mondo = runtime(src)
    _check("gemma" not in mondo.oggetti_raggiungibili(),
           "con la scatola chiusa la gemma non è raggiungibile")
    out = esegui(mondo, "prendi gemma")
    _check("gemma" not in mondo.inventario and ("vedo" in out.lower() or "vedi" in out.lower()),
           "non si può prendere dalla scatola chiusa")
    esegui(mondo, "apri scatola")
    out2 = esegui(mondo, "prendi gemma")
    _check("Preso" in out2 and "gemma" in mondo.inventario,
           "aperta la scatola, la gemma diventa prendibile")


def test_runtime_metti_in_contenitore():
    print("[runtime: 'metti X in contenitore' colloca l'oggetto dentro]")
    mondo = runtime(_MONDO_CONTENITORE + "La gemma è in cella.\n")
    esegui(mondo, "prendi gemma")
    out = esegui(mondo, "metti gemma in scatola")
    _check("messo" in out.lower(), "il comando metti conferma l'azione")
    _check(mondo.trova_oggetto("gemma").posizione == "scatola",
           "la gemma ora vive nel contenitore")
    _check("gemma" in mondo.trova_oggetto("scatola").contenuto,
           "il contenitore registra la gemma")
    _check("gemma" not in mondo.inventario, "la gemma non è più nell'inventario")


def test_runtime_metti_su_supporto():
    print("[runtime: 'metti X su supporto' posa l'oggetto sopra]")
    src = (
        "La cella è una stanza.\n"
        "Il giocatore comincia in cella.\n"
        "Un tavolo è un supporto.\nIl tavolo è in cella.\n"
        "Una tazza è una cosa.\nLa tazza è prendibile.\nLa tazza è in cella.\n"
    )
    mondo = runtime(src)
    esegui(mondo, "prendi tazza")
    out = esegui(mondo, "metti tazza su tavolo")
    _check("messo" in out.lower(), "il comando conferma")
    _check("tazza" in mondo.trova_oggetto("tavolo").contenuto,
           "la tazza è sul supporto")


def test_runtime_metti_in_contenitore_chiuso_rifiutato():
    print("[runtime: non si mette nulla in un contenitore chiuso]")
    src = _MONDO_CONTENITORE + "La gemma è in cella.\nLa scatola è chiusa.\n"
    mondo = runtime(src)
    esegui(mondo, "prendi gemma")
    out = esegui(mondo, "metti gemma in scatola")
    _check("chiuso" in out.lower(), "il motore rifiuta: la scatola è chiusa")
    _check("gemma" not in mondo.trova_oggetto("scatola").contenuto,
           "la gemma non è entrata nella scatola chiusa")


def test_runtime_conseguenza_sposta_in_contenitore():
    print("[runtime: conseguenza 'e adesso X è nella scatola']")
    src = (_MONDO_CONTENITORE + "La gemma è in cella.\n"
           'Invece di usa la gemma: dire "La riponi." e adesso la gemma è nella scatola.\n')
    mondo = runtime(src)
    _check(mondo is not None, "compila (la destinazione contenitore è valida)")
    esegui(mondo, "usa gemma")
    _check(mondo.trova_oggetto("gemma").posizione == "scatola",
           "la conseguenza ha spostato la gemma dentro il contenitore")
    _check("gemma" in mondo.trova_oggetto("scatola").contenuto,
           "il contenitore registra la gemma spostata via conseguenza")


# --- Test: condizioni di fine partita [Livello 3] ----------------------------

def test_fine_partita_vinci():
    print("[conseguenza di fine partita: vinci]")
    src = (
        "La cella è una stanza.\n"
        "Un bottone è una cosa.\nIl bottone è in cella.\n"
        'Invece di usa il bottone: dire "Si apre il portale!" e adesso vinci.\n'
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "compila senza errori")
    cons = mondo.regole[0].conseguenze[0] if mondo and mondo.regole else None
    _check(type(cons).__name__ == "ConseguenzaFinePartita", "la conseguenza è di fine partita")
    _check(cons is not None and cons.esito == "vinta", "esito = vinta")
    _check(mondo.stato_partita == "in_corso", "stato iniziale: in_corso")
    cons.esegui(mondo)
    _check(mondo.stato_partita == "vinta", "esegui imposta lo stato a 'vinta'")


def test_fine_partita_perdi_termina():
    print("[conseguenze di fine partita: perdi / termina]")
    src = (
        "La cella è una stanza.\n"
        "Una trappola è una cosa.\nLa trappola è in cella.\n"
        'Invece di usa la trappola: dire "Scatta!" e adesso perdi.\n'
        'Invece di esamina la trappola: dire "Basta così." e adesso termina.\n'
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "compila senza errori")
    esiti = [r.conseguenze[0].esito for r in mondo.regole] if mondo else []
    _check("persa" in esiti and "terminata" in esiti,
           "gli esiti 'persa' e 'terminata' sono entrambi presenti")


def test_fine_partita_con_altre_conseguenze():
    print("[fine partita combinata con altre conseguenze nella stessa regola]")
    src = (
        "La cella è una stanza.\n"
        "Una leva è una cosa.\nLa leva è in cella.\n"
        "Una porta è una cosa.\nLa porta è in cella.\nLa porta è chiusa.\n"
        'Invece di usa la leva su la porta: dire "Clack." '
        'e adesso la porta è aperta e adesso vinci.\n'
    )
    mondo, _ = compila(src)
    _check(mondo is not None and len(mondo.regole[0].conseguenze) == 2,
           "due conseguenze: cambio proprietà + vittoria")
    mondo.regole[0].esegui_conseguenze(mondo)
    _check("aperta" in mondo.trova_oggetto("porta").proprieta, "la porta si è aperta")
    _check(mondo.stato_partita == "vinta", "e la partita risulta vinta")


def test_runtime_partita_finita_helper():
    print("[runtime: il loop riconosce gli stati terminali]")
    from gioco import partita_finita
    from strutture import Mondo
    m = Mondo()
    _check(partita_finita(m) is False, "stato 'in_corso': la partita continua")
    m.stato_partita = "vinta"
    _check(partita_finita(m) is True, "stato 'vinta': la partita si ferma")


# --- Test: stato astratto / variabili 'stato' [Livello 3 / G3] ---------------

def test_stato_dichiarazione_e_valore_iniziale():
    print("[stato: dichiarazione e valore iniziale]")
    src = (
        "La cella è una stanza.\n"
        "Il semaforo è uno stato.\n"
        "Il semaforo è rosso.\n"
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "compila senza errori")
    _check(mondo and "semaforo" in mondo.variabili, "lo stato 'semaforo' è dichiarato")
    _check(mondo and mondo.variabili["semaforo"] == "rosso", "valore iniziale = rosso")


def test_stato_dichiarazione_senza_valore_e_none():
    print("[stato: dichiarato ma non valorizzato vale None]")
    src = "La cella è una stanza.\nL'allarme è uno stato.\n"
    mondo, _ = compila(src)
    _check(mondo and mondo.variabili.get("allarme", "MANCANTE") is None,
           "uno stato dichiarato e non impostato vale None")


def test_stato_condizione_e_conseguenza():
    print("[stato: condizione 'è' e conseguenza che lo cambia]")
    src = (
        "La cella è una stanza.\n"
        "Il semaforo è uno stato.\nIl semaforo è rosso.\n"
        "Una leva è una cosa.\nLa leva è in cella.\n"
        'Invece di usa la leva: dire "Scatta." e adesso il semaforo è verde.\n'
        'Invece di esamina la leva se il semaforo è verde: dire "Verde.".\n'
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "compila senza errori")
    cond = mondo.regole[1].condizione if mondo else None
    _check(type(cond).__name__ == "CondizioneVariabile", "condizione su variabile")
    _check(cond is not None and cond.valuta(mondo) is False, "falsa: il semaforo è ancora rosso")
    mondo.regole[0].esegui_conseguenze(mondo)
    _check(mondo.variabili["semaforo"] == "verde", "la conseguenza imposta il semaforo a verde")
    _check(cond.valuta(mondo) is True, "vera: ora il semaforo è verde")


def test_stato_condizione_negata():
    print("[stato: negazione 'non è']")
    src = (
        "La cella è una stanza.\n"
        "Il semaforo è uno stato.\nIl semaforo è rosso.\n"
        "Una leva è una cosa.\nLa leva è in cella.\n"
        'Invece di esamina la leva se il semaforo non è verde: dire "Non verde.".\n'
    )
    mondo, _ = compila(src)
    cond = mondo.regole[0].condizione if mondo else None
    _check(type(cond).__name__ == "CondizioneNot", "la condizione è una negazione")
    _check(cond is not None and cond.valuta(mondo) is True,
           "vera: il semaforo (rosso) non è verde")


def test_stato_disgiunto_da_proprieta_oggetto():
    print("[stato: variabile e proprietà-oggetto omonime non collidono]")
    # 'porta' è un oggetto con proprietà 'chiusa'; 'fase' è uno stato con valore
    # 'chiusa'. I due costrutti convivono senza ambiguità grazie ai token distinti.
    src = (
        "La cella è una stanza.\n"
        "Una porta è una cosa.\nLa porta è in cella.\nLa porta è chiusa.\n"
        "La fase è uno stato.\nLa fase è chiusa.\n"
        'Invece di esamina la porta se la porta è chiusa e la fase è chiusa: dire "Doppio.".\n'
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "compila: oggetto e stato con stessa parola-stato")
    _check(mondo and "chiusa" in mondo.trova_oggetto("porta").proprieta,
           "la proprietà 'chiusa' dell'oggetto è registrata")
    _check(mondo and mondo.variabili.get("fase") == "chiusa",
           "lo stato 'fase' vale 'chiusa'")
    _check(mondo and mondo.regole[0].condizione.valuta(mondo) is True,
           "l'AND oggetto-proprietà + stato-variabile valuta correttamente")


def test_contatore_dichiarazione_default_zero():
    print("[contatore: dichiarazione, default 0]")
    src = "La cella è una stanza.\nIl punteggio è un contatore.\n"
    mondo, _ = compila(src)
    _check(mondo is not None, "compila senza errori")
    _check(mondo and mondo.variabili.get("punteggio") == 0, "il contatore parte da 0")


def test_contatore_aumenta_diminuisci():
    print("[contatore: aumenta/diminuisci, default 1 e 'di N']")
    src = (
        "La cella è una stanza.\n"
        "Il punteggio è un contatore.\n"
        "Una moneta è una cosa.\nLa moneta è in cella.\n"
        'Invece di prendi la moneta: dire "+1" e adesso aumenta il punteggio.\n'
        'Invece di esamina la moneta: dire "+5" e adesso aumenta il punteggio di 5.\n'
        'Invece di lascia la moneta: dire "-2" e adesso diminuisci il punteggio di 2.\n'
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "compila senza errori")
    mondo.regole[0].esegui_conseguenze(mondo)
    _check(mondo.variabili["punteggio"] == 1, "aumenta senza 'di' = +1")
    mondo.regole[1].esegui_conseguenze(mondo)
    _check(mondo.variabili["punteggio"] == 6, "aumenta di 5 = +5 (totale 6)")
    mondo.regole[2].esegui_conseguenze(mondo)
    _check(mondo.variabili["punteggio"] == 4, "diminuisci di 2 = -2 (totale 4)")


def test_contatore_diventa():
    print("[contatore: 'diventa N' imposta il valore]")
    src = (
        "La cella è una stanza.\n"
        "Il punteggio è un contatore.\n"
        "Una leva è una cosa.\nLa leva è in cella.\n"
        'Invece di usa la leva: dire "Reset." e adesso il punteggio diventa 10.\n'
    )
    mondo, _ = compila(src)
    mondo.regole[0].esegui_conseguenze(mondo)
    _check(mondo.variabili["punteggio"] == 10, "il contatore diventa 10")


def test_contatore_confronti():
    print("[contatore: confronti almeno / più di / meno di / uguaglianza]")
    src = (
        "La cella è una stanza.\n"
        "Il punteggio è un contatore.\n"
        "Una guida è una cosa.\nLa guida è in cella.\n"
        'Invece di esamina la guida se il punteggio è almeno 3: dire "ge3".\n'
        'Invece di usa la guida se il punteggio è più di 2: dire "gt2".\n'
        'Invece di apri la guida se il punteggio è meno di 5: dire "lt5".\n'
        'Invece di prendi la guida se il punteggio è 0: dire "eq0".\n'
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "compila senza errori")
    r_ge3, r_gt2, r_lt5, r_eq0 = (mondo.regole[0].condizione, mondo.regole[1].condizione,
                                   mondo.regole[2].condizione, mondo.regole[3].condizione)
    _check(type(r_ge3).__name__ == "CondizioneContatore", "condizione = CondizioneContatore")
    # punteggio = 0
    _check(r_ge3.valuta(mondo) is False, "almeno 3: falso a 0")
    _check(r_lt5.valuta(mondo) is True, "meno di 5: vero a 0")
    _check(r_eq0.valuta(mondo) is True, "uguale a 0: vero a 0")
    mondo.variabili["punteggio"] = 3
    _check(r_ge3.valuta(mondo) is True, "almeno 3: vero a 3")
    _check(r_gt2.valuta(mondo) is True, "più di 2: vero a 3")
    _check(r_eq0.valuta(mondo) is False, "uguale a 0: falso a 3")


def test_scanner_raccoglie_contatori():
    print("[scanner: 'X è un contatore' popola le variabili]")
    src = "La cella è una stanza.\nIl bottino è un contatore.\n"
    tab = costruisci_symbol_table(src)
    _check("bottino" in tab.variabili, "il contatore 'bottino' è tra le variabili")
    _check("bottino" not in tab.tutti, "il contatore NON è tra le entità")


def test_evento_al_turno():
    print("[evento: 'Al turno N' scatta una sola volta]")
    src = (
        "La cella è una stanza.\n"
        "Una candela è una cosa.\nLa candela è in cella.\n"
        'Al turno 2: dire "Buio." e adesso la candela è nel nulla.\n'
    )
    mondo, _ = compila(src)
    _check(mondo is not None and len(mondo.eventi) == 1, "un evento registrato")
    ev = mondo.eventi[0]
    _check(ev.tipo == "al" and ev.n == 2, "tipo 'al', turno 2")
    _check(ev.scatta_a(1) is False and ev.scatta_a(2) is True and ev.scatta_a(3) is False,
           "scatta solo al turno 2")
    _check(len(ev.conseguenze) == 1, "ha una conseguenza")
    ev.esegui_conseguenze(mondo)
    _check(mondo.trova_oggetto("candela").posizione is None,
           "la conseguenza dell'evento sposta la candela nel nulla")


def test_evento_ogni_turni():
    print("[evento: 'Ogni N turni' scatta ai multipli]")
    src = (
        "La cella è una stanza.\n"
        'Ogni 3 turni: dire "Rumore.".\n'
    )
    mondo, _ = compila(src)
    ev = mondo.eventi[0] if mondo and mondo.eventi else None
    _check(ev is not None and ev.tipo == "ogni" and ev.n == 3, "tipo 'ogni', ogni 3 turni")
    _check(ev is not None and ev.scatta_a(3) and ev.scatta_a(6) and not ev.scatta_a(4),
           "scatta a 3, 6, ... e non a 4")


def test_evento_numero_invalido_warning():
    print("[evento: 'Ogni 0 turni' = warning, evento ignorato]")
    src = (
        "La cella è una stanza.\n"
        'Ogni 0 turni: dire "Mai.".\n'
    )
    mondo, log = compila(src)
    _check(mondo is not None, "compila comunque (warning non bloccante)")
    _check(mondo and len(mondo.eventi) == 0, "l'evento invalido non è registrato")
    _check("ignorato" in log.lower(), "il log avvisa che l'evento è ignorato")


def test_runtime_eventi_a_turni():
    print("[runtime: gli eventi scattano al turno giusto nel loop]")
    from gioco import elabora_comando
    from libreria_azioni import LIBRERIA_AZIONI
    src = (
        "La cella è una stanza.\n"
        "Il giocatore comincia in cella.\n"
        "Una candela è una cosa.\nLa candela è in cella.\n"
        'Al turno 2: dire "Si spegne." e adesso la candela è nel nulla.\n'
        'Al turno 3: dire "Crollo!" e adesso perdi.\n'
    )
    mondo, _ = compila(src)
    mondo.carica_azioni(LIBRERIA_AZIONI)
    mondo.imposta_posizione_iniziale()
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        c1 = elabora_comando(mondo, "esamina candela")  # turno 1
        c2 = elabora_comando(mondo, "esamina candela")  # turno 2 -> evento candela
        candela_dopo_t2 = mondo.trova_oggetto("candela").posizione
        c3 = elabora_comando(mondo, "esamina candela")  # turno 3 -> perdi
    out = buf.getvalue()
    _check(mondo.turno_corrente == 3, "il contatore dei turni è avanzato a 3")
    _check(candela_dopo_t2 is None, "al turno 2 l'evento ha rimosso la candela")
    _check(c1 is True and c2 is True and c3 is False,
           "il gioco continua fino al turno 3, poi termina")
    _check("HAI PERSO" in out, "l'evento terminale al turno 3 chiude la partita")


# --- Test: DEMONI / EVENTI CONDIZIONALI [Livello 8] --------------------------

def test_demone_compila():
    print("[demone: le due forme compilano e popolano mondo.demoni]")
    src = (
        "La cripta è una stanza.\n"
        "Il giocatore comincia in cripta.\n"
        "La tensione è un contatore.\n"
        "L'allarme è uno stato.\nL'allarme è spento.\n"
        'Ogni turno se la tensione è almeno 5: dire "Trema."'
        " e adesso aumenta la tensione.\n"
        'Quando l\'allarme è acceso diventa vera: dire "SCATTA!" e adesso perdi.\n'
    )
    mondo, log = compila(src)
    _check(mondo is not None, "il sorgente con due demoni compila senza errori")
    _check(len(mondo.demoni) == 2, "entrambi i demoni sono registrati in mondo.demoni")
    tipi = {d.tipo for d in mondo.demoni}
    _check(tipi == {"ogni_turno", "quando"},
           "i tipi 'ogni_turno' (a livello) e 'quando' (fronte) sono distinti")


def test_demone_quando_fronte_di_salita():
    print("[demone: 'Quando ... diventa vera' scatta sulla soglia (esempio bersaglio)]")
    # Esempio bersaglio: tensione che sale ogni turno + scadenza autonoma a 8.
    src = (
        "Il rituale è una stanza.\n"
        "Il giocatore comincia in rituale.\n"
        "La tensione è un contatore.\n"
        'Ogni 1 turno: dire "La tensione cresce." e adesso aumenta la tensione di 2.\n'
        'Quando la tensione è almeno 8: dire "Il portale ti risucchia."'
        " e adesso perdi.\n"
    )
    mondo = runtime(src)
    out = ""
    for _ in range(3):                 # turni 1..3: tensione 2,4,6 -> non scatta
        out += esegui(mondo, "guarda")
    _check("portale ti risucchia" not in out,
           "finché la tensione è sotto 8 il demone non scatta")
    _check(mondo.stato_partita == "in_corso", "la partita è ancora in corso a tensione 6")
    out_t4 = esegui(mondo, "guarda")   # turno 4: tensione 8 -> scatta -> perdi
    _check("portale ti risucchia" in out_t4,
           "quando la tensione raggiunge 8 il demone scatta da solo")
    _check(mondo.stato_partita == "persa", "il demone ha terminato la partita autonomamente")


def test_demone_quando_baseline_niente_falso_fronte():
    print("[demone: una condizione GIÀ vera all'avvio non genera un falso fronte]")
    src = (
        "La torre è una stanza.\n"
        "Il giocatore comincia in torre.\n"
        "L'allarme è uno stato.\nL'allarme è attivo.\n"   # vero fin dalla partenza
        'Quando l\'allarme è attivo diventa vera: dire "FALSO FRONTE." e adesso perdi.\n'
    )
    mondo = runtime(src)
    # Baseline calcolato a compile-time: era_vera deve essere già True.
    demone = mondo.demoni[0]
    _check(demone.era_vera is True, "il baseline registra la condizione come già vera")
    out = esegui(mondo, "guarda")
    _check("FALSO FRONTE" not in out,
           "nessun fronte di salita: l'allarme era già attivo all'avvio")
    _check(mondo.stato_partita == "in_corso", "la partita non viene chiusa per un falso fronte")


def test_demone_quando_scatta_una_sola_volta():
    print("[demone: 'Quando' scatta UNA sola volta, non a ogni turno in cui resta vera]")
    src = (
        "La sala è una stanza.\n"
        "Il giocatore comincia in sala.\n"
        "Il portale è uno stato.\nIl portale è chiuso.\n"
        "Il varchi è un contatore.\n"
        'Al turno 2: dire "Si apre." e adesso il portale è aperto.\n'
        'Quando il portale è aperto diventa vera: dire "VARCO." e adesso aumenta il varchi.\n'
    )
    mondo = runtime(src)
    out = ""
    for _ in range(4):                 # turni 1..4 (apertura al 2, resta aperto)
        out += esegui(mondo, "guarda")
    _check(out.count("VARCO.") == 1, "il fronte di salita produce esattamente uno scatto")
    _check(mondo.variabili["varchi"] == 1,
           "la conseguenza del demone è applicata una sola volta")


def test_demone_ogni_turno_a_livello():
    print("[demone: 'Ogni turno se ...' ri-scatta a ogni turno in cui la condizione è vera]")
    src = (
        "La palude è una stanza.\n"
        "Il giocatore comincia in palude.\n"
        "Il veleno è uno stato.\nIl veleno è attivo.\n"
        "La vita è un contatore.\n"
        'Ogni turno se il veleno è attivo: dire "Bruci." e adesso diminuisci la vita.\n'
    )
    mondo = runtime(src)
    out = ""
    for _ in range(3):
        out += esegui(mondo, "guarda")
    _check(out.count("Bruci.") == 3, "il demone a livello scatta a ognuno dei 3 turni")
    _check(mondo.variabili["vita"] == -3,
           "la conseguenza continua si accumula (vita scesa di 3)")


def test_demone_cascata_un_solo_passaggio():
    print("[demone: una cascata si risolve in un solo passaggio, senza loop]")
    # Demone A (leva) dichiarato PRIMA di B (portale): A apre il portale e, nello
    # stesso passaggio, B vede il nuovo stato e scatta -> entrambi in un turno.
    src = (
        "Il quadro è una stanza.\n"
        "Il giocatore comincia in quadro.\n"
        "La leva è uno stato.\nLa leva è giu.\n"
        "Il portale è uno stato.\nIl portale è chiuso.\n"
        "Il punteggio è un contatore.\n"
        'Al turno 2: dire "Click." e adesso la leva è su.\n'
        'Quando la leva è su diventa vera: dire "Leva su." e adesso il portale è aperto.\n'
        'Quando il portale è aperto diventa vera: dire "Portale aperto." e adesso aumenta il punteggio.\n'
    )
    mondo = runtime(src)
    esegui(mondo, "guarda")            # turno 1: nulla
    out_t2 = esegui(mondo, "guarda")   # turno 2: click -> A scatta -> B scatta
    _check("Leva su." in out_t2 and "Portale aperto." in out_t2,
           "nello stesso turno la cascata A->B scatta entrambi i demoni")
    _check(mondo.variabili["punteggio"] == 1,
           "il demone a valle ha applicato la sua conseguenza nel medesimo passaggio")


# --- Test: VALORE INIZIALE DEI CONTATORI [0.16.0] ----------------------------

def test_contatore_valore_iniziale():
    print("[contatore: 'La forza parte da N' imposta il valore iniziale]")
    src = (
        "La forza è un contatore.\n"
        "La forza parte da 3.\n"
    )
    mondo, log = compila(src)
    _check(mondo is not None, "la dichiarazione con valore iniziale compila")
    _check(mondo.variabili["forza"] == 3, "il contatore parte da 3, non da 0")


def test_contatore_valore_iniziale_ordine_libero():
    print("[contatore: 'parte da' funziona anche PRIMA di 'è un contatore']")
    src = (
        "La forza parte da 5.\n"
        "La forza è un contatore.\n"   # setdefault non sovrascrive il 5
    )
    mondo, _ = compila(src)
    _check(mondo is not None and mondo.variabili["forza"] == 5,
           "l'ordine delle due frasi non conta: resta 5")


def test_contatore_valore_iniziale_in_condizione():
    print("[contatore: il valore iniziale è visibile alle condizioni a runtime]")
    src = (
        "L'atrio è una stanza.\n"
        "Il giocatore comincia in atrio.\n"
        "La porta è una cosa.\nLa porta è in atrio.\n"
        "La forza è un contatore.\n"
        "La forza parte da 5.\n"
        'Invece di apri la porta se la forza è meno di 3: dire "Troppo pesante.".\n'
    )
    mondo = runtime(src)
    out = esegui(mondo, "apri porta")
    _check("Troppo pesante." not in out,
           "con forza iniziale 5 il gating (meno di 3) non scatta")


def test_scanner_raccoglie_variabili():
    print("[scanner: 'X è uno stato' popola le variabili, non le entità]")
    src = (
        "La cella è una stanza.\n"
        "Il punteggio è uno stato.\n"
    )
    tab = costruisci_symbol_table(src)
    _check("punteggio" in tab.variabili, "lo stato 'punteggio' è tra le variabili")
    _check("punteggio" not in tab.tutti, "lo stato NON è tra le entità (tutti)")
    _check("cella" in tab.stanze, "la stanza resta tra le entità")


# --- Test: Passata 1, scanner della symbol-table [Livello 2.5 / G1] ----------

def test_scanner_raccoglie_stanze_e_oggetti():
    print("[scanner: raccoglie stanze e oggetti dichiarati]")
    src = (
        "La cella è una stanza.\n"
        "Una chiave è una cosa.\n"
        "La chiave è in cella.\n"        # posizione: NON introduce simboli
        "La chiave è lucente.\n"         # proprietà: NON introduce simboli
    )
    tab = costruisci_symbol_table(src)
    _check("cella" in tab.stanze, "la stanza 'cella' è nella symbol-table")
    _check("chiave" in tab.oggetti, "l'oggetto 'chiave' è nella symbol-table")
    _check("lucente" not in tab.tutti, "la proprietà 'lucente' NON è un simbolo")
    _check(tab.tutti == {"cella", "chiave"}, "nessun simbolo spurio")


def test_scanner_nomi_multiparola():
    print("[scanner: nomi-entità multiparola]")
    src = (
        "La cella di contenimento è una stanza.\n"
        "Una keycard magnetica è una cosa.\n"
    )
    tab = costruisci_symbol_table(src)
    _check("cella di contenimento" in tab.stanze, "stanza multiparola raccolta intera")
    _check("keycard magnetica" in tab.oggetti, "oggetto multiparola raccolto intero")


def test_scanner_connessione_introduce_stanze():
    print("[scanner: 'collega ... a ...' introduce entrambe le stanze]")
    src = "Il corridoio collega sud a la cella di contenimento.\n"
    tab = costruisci_symbol_table(src)
    _check("corridoio" in tab.stanze, "stanza sorgente raccolta")
    _check("cella di contenimento" in tab.stanze,
           "stanza destinazione (con articolo) raccolta e normalizzata")


def test_scanner_ignora_punti_nelle_stringhe():
    print("[scanner: i punti dentro le stringhe non spezzano le frasi]")
    src = (
        "La cella è una stanza.\n"
        'La descrizione della cella è "Bianca. Asettica. Fredda.".\n'
        "Una porta è una cosa.\n"
    )
    tab = costruisci_symbol_table(src)
    _check(tab.tutti == {"cella", "porta"},
           "le frasi dentro le virgolette non generano falsi simboli")


def test_parole_riservate_coprono_le_keyword():
    print("[parole riservate: copertura delle keyword strutturali]")
    attese = {"è", "una", "stanza", "cosa", "prendibile", "collega",
              "invece", "se", "dire", "adesso", "oppure", "non", "ha"}
    mancanti = attese - PAROLE_RISERVATE
    _check(not mancanti, f"tutte le keyword chiave sono riservate (mancano: {mancanti})")


# --- Test: GUARDIA ANTI-AMBIGUITÀ PERMANENTE [Livello 2.5 / G1] --------------
#
# Questa è la rete di sicurezza definitiva contro la regressione dell'ambiguità
# grammaticale. In v0.6.0 il corpus qui sotto produceva da 1 a 7 alberi per
# frase (nodi `_ambig`) sotto Earley; con il terminale ENTITA chiuso ne produce
# esattamente UNO, e LALR(1) si costruisce senza conflitti.

# Corpus che esercita tutti i costrutti storicamente ambigui.
_CORPUS_GUARDIA = (
    "La cella è una stanza.\n"
    "Il corridoio è una stanza.\n"
    "La cella collega nord a corridoio.\n"
    "Alto e basso sono direzioni opposte.\n"   # def_direzioni [Livello 4 / L1]
    "La cella collega basso a corridoio.\n"     # connessione con direzione custom
    "Una porta di ferro è una cosa.\n"        # nome-entità multiparola
    "La porta di ferro è in cella.\n"          # def_posizione
    "La porta di ferro è chiusa.\n"            # def_proprieta
    "La porta di ferro è incisa.\n"            # [0.27.0/D] proprietà che inizia con prep ('in')
    "La porta di ferro è prendibile.\n"        # def_prendibile
    "Accesa e spenta sono opposte.\n"          # def_opposti [Livello 3 / M5]
    "Una chiave è una cosa.\nLa chiave è in cella.\nLa chiave è prendibile.\n"
    'La chiave si chiama anche "chiavetta".\n'         # def_alias [Livello 4]
    "Una scatola è un contenitore.\nLa scatola è in cella.\n"   # def_contenitore [Livello 4 / M1]
    "Un anello è una cosa.\nL'anello è nella scatola.\n"         # collocazione in contenitore
    "Un tavolo è un supporto.\nIl tavolo è in cella.\n"          # def_supporto
    '"frusta" è un comando.\n'                          # def_verbo [Livello 4 / M1]
    'Invece di frusta la chiave: dire "Schiocco.".\n'  # regola con verbo custom
    "L'allarme è uno stato.\nL'allarme è attivo.\n"   # def_stato + def_stato_valore [Livello 3]
    "Il punteggio è un contatore.\n"                   # def_contatore [Livello 3]
    "Il punteggio parte da 2.\n"                        # def_contatore_iniziale [0.16.0]
    # [0.27.0 / A] Copula plurale 'sono'/'partono' su stati e contatori (nomi plurali).
    "Le luci sono uno stato.\nLe luci sono accese.\n"  # def_stato + def_stato_valore plurale
    "Le vite sono un contatore.\nLe vite partono da 5.\n"  # def_contatore + def_contatore_iniziale plurale
    "Il giocatore può portare 4 oggetti.\n"            # def_giocatore_capacita [Livello 7]
    "La chiave dà 2 spazi.\n"                          # def_capacita_oggetto [Livello 7]
    'Invece di esamina la chiave se l\'allarme non è attivo: dire "Quiete.".\n'  # cond_variabile_neg
    'Invece di prendi la chiave se il punteggio è almeno 2: dire "Punti." '
    'e adesso aumenta il punteggio di 3.\n'            # cond_contatore_gte + cons_aumenta
    'Invece di apri la porta di ferro se la porta di ferro è chiusa e il '
    'giocatore ha la chiave: dire "Click." e adesso la porta di ferro è aperta '
    'e adesso vinci.\n'   # cons_vinci nel corpus della guardia [Livello 3]
    'Invece di usa la chiave su la porta di ferro se il giocatore non ha la '
    'chiave oppure la porta di ferro non è aperta: dire "No." '
    'e adesso la chiave è nel nulla e adesso l\'allarme è spento.\n'  # cons_variabile
    'Al turno 3: dire "Ticchettio." e adesso aumenta il punteggio.\n'  # evento_al [Livello 3]
    'Ogni 5 turni: dire "Rintocco.".\n'               # evento_ogni
    # [Livello 8] Demoni: 'Ogni turno se ...' (a livello, distinto da 'Ogni N
    # turni' sul lookahead NUMERO vs "turno") e 'Quando ... diventa vera' (fronte).
    'Ogni turno se il punteggio è almeno 3: dire "Pressione." e adesso aumenta il punteggio.\n'  # demone_ogni
    'Quando l\'allarme non è attivo diventa vera: dire "Silenzio." e adesso vinci.\n'  # demone_quando + cond_variabile_neg
    # [0.19.0] A7 verbo intransitivo + regola globale senza oggetto; A8 inventario
    # iniziale; A9 «tick» silenzioso (evento e demone senza 'dire').
    '"medita" è un comando senza oggetto.\n'                # verbo_senza_oggetto [A7]
    'Invece di medita: dire "Respiri a fondo.".\n'          # regola globale su verbo intransitivo
    "Il giocatore ha la chiave.\n"                          # def_giocatore_inventario [A8]
    'Al turno 7: aumenta il punteggio.\n'                   # evento_al senza dire [A9]
    'Ogni turno se il punteggio è al massimo 1: aumenta il punteggio.\n'  # demone_ogni senza dire [A9]
    # [0.30.0 / A3] 'dire' OPZIONALE anche nelle REGOLE (simmetria con A9): forma
    # GLOBALE su verbo intransitivo e forma con BERSAGLIO, entrambe a sola conseguenza.
    'Invece di medita: aumenta il punteggio.\n'             # regola globale senza dire [A3]
    'Invece di frusta la scatola: aumenta il punteggio.\n'  # regola con bersaglio senza dire [A3]
    # [Livello 5] Interpolazione [var]: vive DENTRO le virgolette, dunque non
    # deve introdurre alcuna ambiguità grammaticale (segnaposto su contatore e
    # oggetto, entrambi dichiarati sopra).
    'Invece di esamina la scatola: dire "Hai [punteggio] punti vicino a [chiave].".\n'
    # [Livello 5] Regola GLOBALE senza bersaglio: scatta sul solo verbo + condizione.
    'Invece di guarda se il punteggio è almeno 3: dire "Una luce pulsa.".\n'
    # [Livello 5] Descrizione CONDIZIONALE: clausola 'se' tra ENTITA e "è".
    'La descrizione della porta di ferro se l\'allarme è attivo è "Sigillata.".\n'
    # [0.22.0 / A2] Descrizioni a VARIANTI: 'è una di: …' (casuale) e 'è in
    # sequenza: …' (rotazione). Dopo "è" il lookahead TESTO_QUOTATO|"una"|"in".
    'La descrizione dell\'anello è una di: "Un anello d\'oro.", "Un cerchio lucente.".\n'
    'La descrizione del tavolo è in sequenza: "Un tavolo grezzo.", "Un tavolo segnato.".\n'
    # [Livello 5b] NPC e dialoghi: personaggio, nodo d'ingresso, battuta (con
    # interpolazione), opzione di uscita. Etichette/testi quotati: 0 ambiguità.
    "Il mercante è un personaggio.\nIl mercante è in cella.\n"
    'Il dialogo del mercante comincia con "saluto".\n'
    'Il mercante al nodo "saluto" dice "Benvenuto, hai [punteggio] punti!".\n'
    'Al nodo "saluto" l\'opzione "Chi sei?" se il giocatore ha la chiave conduce al nodo "chi" e adesso aumenta il punteggio.\n'  # condizione [0.10.4] + rami [0.10.2] + conseguenza [0.10.3]
    'Al nodo "saluto" l\'opzione "Addio." chiude il dialogo.\n'
    'Il mercante al nodo "chi" dice "Un mercante.".\n'
    'Al nodo "chi" l\'opzione "Vinci!" chiude il dialogo e adesso vinci.\n'   # conseguenza di fine partita [0.10.3]
    'Al nodo "chi" l\'opzione "Addio." chiude il dialogo.\n'
    # [0.24.0 / A4] Buio e luce: stanza buia (proprietà speciale via def_proprieta)
    # e fonte di luce (def_illumina, dopo ENTITA lookahead "illumina").
    "La cantina è una stanza.\nLa cella collega sud a cantina.\n"
    "La cantina è buia.\n"                             # proprietà speciale 'buia' su stanza
    "Una lanterna è una cosa.\nLa lanterna illumina.\nLa lanterna è in cantina.\n"  # def_illumina
    # [0.25.0 / A5] Movimento NPC: deterministico (cons_png_va) e casuale
    # (cons_png_cambia). Dopo ENTITA il lookahead "va"/"cambia" vs _copula.
    "Ogni 6 turni: il mercante cambia stanza.\n"        # cons_png_cambia
    "Quando il punteggio è almeno 4: il mercante va nel corridoio.\n"  # cons_png_va
    # [0.26.0 / A6] Sinonimo di verbo: dopo '"…" è' il lookahead "come" vs "un".
    '"ghermisci" è come prendi.\n'                       # def_sinonimo
    # [0.31.0 / Tema 1] Operando-quantità: valore di un contatore '[…]' ed
    # estrazione casuale 'un numero fra A e B', sia come QUANTITÀ (1a, in 'di …'
    # e 'diventa') sia come TERMINE DI CONFRONTO (1b). Convivono con le forme a
    # NUMERO letterale già presenti sopra: il lookahead NUMERO|"["|"un" decide.
    'Invece di guarda se il punteggio è meno di [vite]: aumenta il punteggio di [vite].\n'      # 1b cond_lt var + 1a cons 'di [var]'
    'Invece di esamina la chiave se il punteggio è più di [vite]: diminuisci il punteggio di un numero fra 1 e 2.\n'  # 1b cond_gt var + casuale
    'Ogni turno se il punteggio è almeno [vite]: il punteggio diventa [vite].\n'   # 1b cond_gte var + diventa var
    'Quando il punteggio è al massimo [vite] diventa vera: il punteggio diventa un numero fra 1 e 6.\n'  # 1b cond_lte var + diventa casuale
    'Ogni turno se il punteggio è [vite]: aumenta le vite.\n'                       # 1b cond_eq contatore==contatore
    'Quando il punteggio non è [vite] diventa vera: aumenta le vite.\n'             # 1b cond_neq contatore
    # [0.32.0 / Tema 2] Casualità d'autore non-numerica. 2b: scelta casuale fra
    # VALORI DI STATO ('… diventa uno fra …'); convive con 'diventa operando'
    # (cons_contatore_set) — dopo "diventa" il lookahead "uno" vs {NUMERO,"[","un"}
    # decide. 2c: condizione probabilistica ('càpita (N su M)'), unico cond_base
    # senza operando a sinistra (keyword dedicata).
    "Il meteo è uno stato.\nIl meteo è sereno.\n"                                   # stato per 2b
    'Invece di osserva: il meteo diventa uno fra sereno, pioggia, nebbia.\n'        # 2b cons_scelta_stato
    'Ogni turno se càpita (1 su 4): aumenta il punteggio.\n'                        # 2c cond_probabilita (demone)
    'Invece di scruta se càpita (3 su 4) e il meteo è pioggia: dire "Forse.".\n'    # 2c in regola, in AND con cond_variabile
    # [0.33.0 / Tema 4a] Buio COMMUTABILE: 'la stanza diventa buia/illuminata'.
    # Dopo ENTITA il lookahead "diventa" è disgiunto da _copula/"va"/"cambia"; ENTITA
    # è un terminale chiuso disgiunto da VARIABILE, quindi non collide con
    # 'VARIABILE "diventa" …' (cons_contatore_set / cons_scelta_stato).
    '"oscura" è un comando senza oggetto.\n'
    'Invece di oscura: la cantina diventa buia.\n'           # cons_stanza_buio (buio)
    '"rischiara" è un comando senza oggetto.\n'
    'Invece di rischiara: la cantina diventa illuminata.\n'  # cons_stanza_buio (luce)
    # [0.33.0 / Tema 4b] Battuta CONDIZIONALE: 'X al nodo "n" dice "…" se …'. Dopo
    # il secondo TESTO_QUOTATO il lookahead "se" vs "." è disgiunto → 0-ambiguo. Si
    # accumula sulla battuta INCONDIZIONATA del nodo "chi" già nel corpus (fallback).
    'Il mercante al nodo "chi" dice "Sono in allerta." se l\'allarme è attivo.\n'   # def_battuta condizionale
)


def _conta_ambig(tree):
    return sum(1 for st in tree.iter_subtrees() if st.data == "_ambig")


def test_guardia_lalr_si_costruisce_senza_conflitti():
    print("[guardia: LALR(1) si costruisce senza conflitti]")
    simboli = costruisci_symbol_table(_CORPUS_GUARDIA)
    try:
        costruisci_parser(simboli.tutti, simboli.variabili, _nomi_direzioni(simboli))
        ok = True
        msg = ""
    except GrammarError as e:
        ok = False
        msg = str(e)
    _check(ok, f"il parser LALR(1) si costruisce senza GrammarError ({msg})")


def test_guardia_zero_ambiguita():
    print("[guardia: il corpus produce UN SOLO albero (0 _ambig)]")
    simboli = costruisci_symbol_table(_CORPUS_GUARDIA)
    grammatica = costruisci_grammatica(simboli.tutti, simboli.variabili, _nomi_direzioni(simboli))
    # Stesso grammar, ma con Earley in modalità 'explicit' per CONTARE gli alberi.
    parser_amb = Lark(grammatica, start="start", parser="earley",
                      ambiguity="explicit")
    tree = parser_amb.parse(_CORPUS_GUARDIA)
    n = _conta_ambig(tree)
    _check(n == 0, f"nessun nodo ambiguo nel corpus (trovati: {n})")


def test_guardia_nome_con_parola_chiave_disambiguato():
    print("[guardia: un nome che contiene una parola-chiave non genera ambiguità]")
    # 'via est' contiene 'est' (direzione); 'cosa preziosa' contiene 'cosa'.
    src = (
        "La via est è una stanza.\n"
        "Una cosa preziosa è una cosa.\n"
        "La cosa preziosa è in via est.\n"
    )
    simboli = costruisci_symbol_table(src)
    grammatica = costruisci_grammatica(simboli.tutti, simboli.variabili)
    parser_amb = Lark(grammatica, start="start", parser="earley",
                      ambiguity="explicit")
    tree = parser_amb.parse(src)
    _check(_conta_ambig(tree) == 0, "0 alberi ambigui anche con nomi 'pericolosi'")
    mondo, _ = compila(src)
    _check(mondo is not None and "cosa preziosa" in mondo.oggetti,
           "l'oggetto 'cosa preziosa' è risolto correttamente")


# --- Test: Cassetto A [0.30.0] — A1 nomi non validi, A3 'dire' opzionale, A4 idioma direzione

def test_a1_nome_con_carattere_non_valido_errore():
    print("[A1: un nome con '/' dà un errore d'autore localizzato, non un GrammarError]")
    src = ("La cella è una stanza.\n"
           "Il doppio/gioco è uno stato.\n"   # '/' chiuderebbe il regex del terminale
           "Il giocatore comincia nella cella.\n")
    # Percorso IDE (strutturato): diagnostica precisa con codice dedicato.
    r = strutturato(src)
    _check(not r["ok"], "il file non compila")
    err = r["errors"][0] if r["errors"] else {}
    _check(err.get("code") == "nome-non-valido",
           "l'errore ha codice 'nome-non-valido' (non 'interno'/'sintassi')")
    _check(err.get("line") == 2 and not err.get("imprecise"),
           "l'errore è localizzato alla riga 2 (posizione precisa)")
    _check("/" in err.get("message", ""),
           "il messaggio cita il carattere incriminato")
    # Percorso motore/CLI: non solleva, ritorna None segnalando il nome non valido.
    mondo, log = compila(src)
    _check(mondo is None and "nome non valido" in log.lower(),
           "il percorso motore segnala 'nome non valido' senza crashare")
    _check("GrammarError" not in log and "Traceback" not in log,
           "nessun GrammarError/traceback grezzo verso l'autore")


def test_a1_nome_valido_con_accenti_apostrofo_spazi_ok():
    print("[A1: accenti, apostrofo e nomi multiparola restano pienamente validi]")
    src = ("La città vecchia è una stanza.\n"
           "L'affinità di Anna è un contatore.\n"
           "Il giocatore comincia nella città vecchia.\n")
    mondo, log = compila(src)
    _check(mondo is not None, "un nome con accento/apostrofo/spazi compila (additività)")
    _check("nome non valido" not in log.lower(),
           "nessun falso positivo sui nomi italiani leciti")


def test_a3_regola_senza_dire_compila_ed_esegue():
    print("[A3: 'dire' opzionale nelle regole (tick silenzioso come A9)]")
    src = ('La cella è una stanza.\n'
           'La forza è un contatore.\n'
           'La forza parte da 1.\n'
           '"riposa" è un comando senza oggetto.\n'
           'Invece di riposa: aumenta la forza di 2.\n'   # nessun 'dire'
           'Il giocatore comincia nella cella.\n')
    mondo, log = compila(src)
    _check(mondo is not None, "una regola senza 'dire' compila")
    regola = next((r for r in mondo.regole), None) if mondo else None
    _check(regola is not None and regola.risposta == "" and regola.conseguenze,
           "la regola ha risposta vuota e mantiene la conseguenza")
    m = runtime(src)
    out = esegui(m, "riposa")
    _check(m.variabili.get("forza") == 3, "la conseguenza si applica (forza 1->3)")
    _check(out.strip() == "", "una regola muta NON stampa una riga vuota")


def test_a3_regola_con_dire_resta_invariata():
    print("[A3: la forma storica 'dire \"...\"' resta identica (non regredisce)]")
    m = runtime('La cella è una stanza.\n'
                'Una pietra è una cosa.\nLa pietra è in cella.\nLa pietra è prendibile.\n'
                'Invece di esamina la pietra: dire "È liscia.".\n'
                'Il giocatore comincia nella cella.\n')
    out = esegui(m, "esamina pietra")
    _check("liscia" in out.lower(), "la regola con 'dire' stampa ancora il suo testo")


def test_a4_sinonimo_direzione_avviso_mirato():
    print("[A4: '\"x\" è come <direzione>' avvisa con l'idioma corretto, non genericamente]")
    mondo, log = compila('La cella è una stanza.\n'
                         '"sinistra" è come est.\n'   # 'est' è una direzione, non un verbo
                         'Il giocatore comincia nella cella.\n')
    _check(mondo is not None, "il file compila (l'avviso non è bloccante)")
    basso = log.lower()
    _check("direzione" in basso and "opposte" in basso,
           "l'avviso spiega che 'est' è una direzione e indica 'sono direzioni opposte'")


# --- Test: Tema 1 [0.31.0] — i contatori si parlano -------------------------
# 1a) un contatore (o un'estrazione casuale) come QUANTITÀ di 'di …'/'diventa';
# 1b) confronto fra due GRANDEZZE ('è più di [forza]'). Operando unico, tre
# forme: NUMERO | [VARIABILE] | un numero fra A e B.

def _src_arena():
    """Mondo minimo per i test del Tema 1: due contatori e un verbo intransitivo
    su cui appendere una regola globale che applica conseguenze."""
    return ("L'arena è una stanza.\nIl giocatore comincia nell'arena.\n"
            "La forza è un contatore.\nLa forza parte da 5.\n"
            "La vita è un contatore.\nLa vita parte da 10.\n"
            '"agisci" è un comando senza oggetto.\n')


def test_tema1a_contatore_come_quantita_in_di():
    print("[1a: 'aumenta/diminuisci X di [Y]' usa il VALORE del contatore Y]")
    # vita 10, forza 5: 'aumenta la vita di [forza]' -> 15; poi 'diminuisci' -> 10.
    m = runtime(_src_arena() +
                'Invece di agisci: aumenta la vita di [forza] e adesso diminuisci la forza.\n')
    esegui(m, "agisci")
    _check(m.variabili.get("vita") == 15, "la vita cresce del valore di forza (10+5=15)")
    _check(m.variabili.get("forza") == 4, "le altre conseguenze restano invariate (forza 5->4)")


def test_tema1a_diventa_contatore():
    print("[1a: 'X diventa [Y]' copia il valore corrente di Y in X]")
    m = runtime(_src_arena() +
                'Invece di agisci: il danno diventa [forza].\n'
                'Il danno è un contatore.\n')
    esegui(m, "agisci")
    _check(m.variabili.get("danno") == 5, "il danno assume il valore di forza (5)")


def test_tema1a_di_letterale_invariato():
    print("[1a: 'di N' letterale resta identico (additività)]")
    m = runtime(_src_arena() +
                'Invece di agisci: aumenta la forza di 3.\n')
    esegui(m, "agisci")
    _check(m.variabili.get("forza") == 8, "il delta letterale funziona come prima (5+3=8)")


def test_tema1a_estrazione_casuale_in_intervallo_e_riproducibile():
    print("[1a/casualità: 'di un numero fra A e B' resta nell'intervallo ed è seedato]")
    sorgente = (_src_arena() +
                'Invece di agisci: il dado diventa un numero fra 1 e 6.\n'
                'Il dado è un contatore.\n')
    valori = []
    for _ in range(2):
        m = runtime(sorgente)          # ogni partita riparte dallo stesso seme
        serie = []
        for _ in range(8):
            esegui(m, "agisci")
            serie.append(m.variabili.get("dado"))
        valori.append(serie)
    _check(all(1 <= v <= 6 for v in valori[0]), "ogni estratto è nell'intervallo chiuso [1, 6]")
    _check(valori[0] == valori[1], "stesso seme -> stessa sequenza (riproducibile)")
    _check(len(set(valori[0])) > 1, "la sequenza non è costante (è davvero casuale)")


def test_tema1a_estrazione_casuale_annulla_safe():
    print("[1a/casualità: ANNULLA riavvolge anche l'RNG dell'estrazione]")
    m = runtime(_src_arena() +
                'Invece di agisci: il dado diventa un numero fra 1 e 100.\n'
                'Il dado è un contatore.\n')
    esegui(m, "agisci")
    primo = m.variabili.get("dado")
    esegui(m, "agisci")
    secondo = m.variabili.get("dado")
    esegui(m, "annulla")               # disfa la seconda estrazione
    _check(m.variabili.get("dado") == primo, "ANNULLA riporta il dado al valore precedente")
    esegui(m, "agisci")                # ri-estrae dallo stesso stato RNG
    _check(m.variabili.get("dado") == secondo,
           "ripetendo l'azione l'estrazione è identica (RNG riavvolto)")


def test_tema1b_confronto_contatore_contatore():
    print("[1b: 'è più/meno di [Y]', 'almeno/al massimo [Y]', '== / != [Y]' fra contatori]")
    src = ("L'arena è una stanza.\nIl giocatore comincia nell'arena.\n"
           "La vita è un contatore.\n"
           "La soglia è un contatore.\n"
           "Una runa è una cosa.\nLa runa è nell'arena.\n"
           'Invece di esamina la runa se la vita è più di [soglia]: dire "gt".\n'
           'Invece di usa la runa se la vita è meno di [soglia]: dire "lt".\n'
           'Invece di apri la runa se la vita è almeno [soglia]: dire "ge".\n'
           'Invece di prendi la runa se la vita è al massimo [soglia]: dire "le".\n'
           'Invece di rompi la runa se la vita è [soglia]: dire "eq".\n'
           'Invece di spingi la runa se la vita non è [soglia]: dire "ne".\n')
    mondo, _ = compila(src)
    _check(mondo is not None, "i confronti contatore<->contatore compilano")
    gt, lt, ge, le, eq, ne = (mondo.regole[i].condizione for i in range(6))
    mondo.variabili["vita"] = 7
    mondo.variabili["soglia"] = 5
    _check(gt.valuta(mondo) and ge.valuta(mondo) and ne.valuta(mondo),
           "vita 7 vs soglia 5: più di / almeno / diverso sono veri")
    _check(not lt.valuta(mondo) and not le.valuta(mondo) and not eq.valuta(mondo),
           "vita 7 vs soglia 5: meno di / al massimo / uguale sono falsi")
    mondo.variabili["vita"] = 5     # ora pari alla soglia
    _check(eq.valuta(mondo) and ge.valuta(mondo) and le.valuta(mondo),
           "vita 5 == soglia 5: uguale / almeno / al massimo sono veri")
    _check(not gt.valuta(mondo) and not lt.valuta(mondo) and not ne.valuta(mondo),
           "vita 5 == soglia 5: più di / meno di / diverso sono falsi")
    mondo.variabili["soglia"] = 9   # la soglia si muove: il confronto è DINAMICO
    _check(lt.valuta(mondo) and not gt.valuta(mondo),
           "spostando la soglia il confronto cambia (5 < 9): operando risolto a runtime")


def test_tema1b_confronto_letterale_invariato():
    print("[1b: il confronto con NUMERO letterale resta identico (additività)]")
    src = ("L'arena è una stanza.\nIl giocatore comincia nell'arena.\n"
           "La vita è un contatore.\n"
           "Una runa è una cosa.\nLa runa è nell'arena.\n"
           'Invece di esamina la runa se la vita è più di 3: dire "ok".\n')
    mondo, _ = compila(src)
    cond = mondo.regole[0].condizione
    mondo.variabili["vita"] = 4
    _check(cond.valuta(mondo) is True, "vita 4 > 3 (letterale) è vero")
    mondo.variabili["vita"] = 2
    _check(cond.valuta(mondo) is False, "vita 2 > 3 (letterale) è falso")


def test_tema1_operando_marca_contatore_come_usato():
    print("[1a/lint: un contatore citato solo come 'di [Y]' NON è 'inutilizzato']")
    # 'bonus' compare SOLO come operando di 'di [bonus]': il linter non deve
    # segnalarlo come dichiarato-ma-mai-usato.
    src = (_src_arena() +
           "Il bonus è un contatore.\nIl bonus parte da 2.\n"
           'Invece di agisci: aumenta la vita di [bonus].\n')
    r = strutturato(src)
    _check(r["ok"], "il file compila")
    inutil = [w for w in r.get("warnings", []) if "bonus" in str(w) and "mai usato" in str(w)]
    _check(not inutil, "'bonus' usato come operando non è segnalato inutilizzato")


def test_tema1_strutturato_serializza_operando():
    print("[1a/IDE: il serializzatore JSON espone le forme dinamiche dell'operando]")
    src = (_src_arena() +
           'Invece di agisci: aumenta la vita di [forza] e adesso il dado diventa un numero fra 1 e 6.\n'
           'Il dado è un contatore.\n')
    dati = regole_strutturate(src)
    _check(dati["ok"], "analizza_regole non solleva e ritorna ok")
    cons = [c for r in dati["rules"] for c in r.get("consequences", []) if c.get("op") == "count"]
    valori = [c.get("value") for c in cons]
    var_ref = any(isinstance(v, dict) and v.get("kind") == "var" and v.get("name") == "forza" for v in valori)
    rand_ref = any(isinstance(v, dict) and v.get("kind") == "rand"
                   and v.get("min") == 1 and v.get("max") == 6 for v in valori)
    _check(var_ref, "l'operando contatore è serializzato come {kind:'var', name:'forza'}")
    _check(rand_ref, "l'estrazione casuale è serializzata come {kind:'rand', min, max}")


# --- Test: Tema 2 [0.32.0] — casualità d'autore non-numerica ----------------
# 2b) scelta casuale fra VALORI DI STATO ('… diventa uno fra X, Y, Z');
# 2c) condizione PROBABILISTICA ('càpita (N su M)'). Entrambe pescano da
# mondo.rng (seedato e ANNULLA-safe, come l'estrazione numerica di 0.31.0).

def _src_meteo():
    """Mondo minimo per il Tema 2b: uno stato 'meteo' e un verbo intransitivo su
    cui appendere una regola che lo fa cambiare a caso."""
    return ("Il cielo è una stanza.\nIl giocatore comincia nel cielo.\n"
            "Il meteo è uno stato.\nIl meteo è sereno.\n"
            '"osserva" è un comando senza oggetto.\n')


def test_tema2b_scelta_stato_pesca_dall_elenco():
    print("[2b: 'X diventa uno fra A, B, C' assegna a X un valore dell'elenco]")
    m = runtime(_src_meteo() +
                'Invece di osserva: il meteo diventa uno fra sereno, pioggia, nebbia.\n')
    visti = set()
    for _ in range(20):
        esegui(m, "osserva")
        visti.add(m.variabili.get("meteo"))
    _check(visti <= {"sereno", "pioggia", "nebbia"},
           "ogni valore estratto appartiene all'elenco dichiarato")
    _check(len(visti) > 1, "su molte estrazioni l'esito varia (è davvero casuale)")


def test_tema2b_scelta_stato_riproducibile():
    print("[2b: stesso seme -> stessa sequenza di valori di stato]")
    sorgente = (_src_meteo() +
                'Invece di osserva: il meteo diventa uno fra sereno, pioggia, nebbia.\n')
    serie = []
    for _ in range(2):
        m = runtime(sorgente)          # ogni partita riparte dallo stesso seme
        s = []
        for _ in range(8):
            esegui(m, "osserva")
            s.append(m.variabili.get("meteo"))
        serie.append(s)
    _check(serie[0] == serie[1], "due partite col seme di default danno la stessa sequenza")


def test_tema2b_scelta_stato_annulla_safe():
    print("[2b: ANNULLA riavvolge la scelta casuale di stato]")
    m = runtime(_src_meteo() +
                'Invece di osserva: il meteo diventa uno fra sereno, pioggia, nebbia.\n')
    esegui(m, "osserva")
    primo = m.variabili.get("meteo")
    esegui(m, "osserva")
    secondo = m.variabili.get("meteo")
    esegui(m, "annulla")               # disfa la seconda scelta
    _check(m.variabili.get("meteo") == primo, "ANNULLA riporta il meteo al valore precedente")
    esegui(m, "osserva")               # ri-pesca dallo stesso stato RNG
    _check(m.variabili.get("meteo") == secondo,
           "ripetendo l'azione la scelta è identica (RNG riavvolto)")


def test_tema2b_un_solo_valore_e_deterministico():
    print("[2b: 'diventa uno fra X' (un solo valore) assegna sempre X]")
    m = runtime(_src_meteo() +
                'Invece di osserva: il meteo diventa uno fra nebbia.\n')
    esegui(m, "osserva")
    _check(m.variabili.get("meteo") == "nebbia", "con un unico valore la scelta è deterministica")


def test_tema2b_non_collide_con_diventa_operando():
    print("[2b: 'diventa uno fra …' (stato) e 'diventa [operando]' (contatore) convivono]")
    # Stessa testa 'VARIABILE diventa …': lo stato pesca fra parole, il contatore
    # riceve un numero. Le due forme non si confondono (lookahead 'uno' vs operando).
    src = (_src_meteo() +
           "Il punti è un contatore.\nIl punti parte da 0.\n"
           'Invece di osserva: il meteo diventa uno fra sereno, pioggia e adesso il punti diventa 7.\n')
    m = runtime(src)
    esegui(m, "osserva")
    _check(m.variabili.get("meteo") in ("sereno", "pioggia"), "lo stato riceve un valore dell'elenco")
    _check(m.variabili.get("punti") == 7, "il contatore riceve l'operando numerico, nella stessa regola")


def test_tema2b_stato_solo_scelto_non_e_inutilizzato():
    print("[2b/lint: uno stato assegnato solo via 'diventa uno fra' NON è 'inutilizzato']")
    src = (_src_meteo() +
           'Invece di osserva: il meteo diventa uno fra sereno, pioggia, nebbia.\n')
    r = strutturato(src)
    _check(r["ok"], "il file compila")
    inutil = [w for w in r.get("warnings", []) if "meteo" in str(w) and "mai usato" in str(w)]
    _check(not inutil, "'meteo' assegnato dalla scelta casuale è considerato usato")


def test_tema2c_probabilita_in_intervallo():
    print("[2c: 'càpita (N su M)' è vera ~N/M delle volte]")
    src = ("L'arena è una stanza.\nIl giocatore comincia nell'arena.\n"
           "Il conta è un contatore.\nIl conta parte da 0.\n"
           "Ogni turno se càpita (1 su 2): aumenta il conta.\n"
           '"aspetta" è un comando senza oggetto.\nInvece di aspetta: dire ".".\n')
    m = runtime(src)
    for _ in range(400):
        esegui(m, "aspetta")
    colpi = m.variabili.get("conta")
    # 1 su 2 su 400 turni: atteso ~200, con ampio margine statistico.
    _check(100 < colpi < 300, f"la frequenza dei colpi è plausibile per 1/2 (osservati {colpi}/400)")


def test_tema2c_probabilita_estremi():
    print("[2c: 'càpita (M su M)' sempre vera; 'càpita (0 su M)' mai vera]")
    src = ("L'arena è una stanza.\nIl giocatore comincia nell'arena.\n"
           "Il sempre è un contatore.\nIl sempre parte da 0.\n"
           "Il mai è un contatore.\nIl mai parte da 0.\n"
           "Ogni turno se càpita (3 su 3): aumenta il sempre.\n"
           "Ogni turno se càpita (0 su 5): aumenta il mai.\n"
           '"aspetta" è un comando senza oggetto.\nInvece di aspetta: dire ".".\n')
    m = runtime(src)
    for _ in range(10):
        esegui(m, "aspetta")
    _check(m.variabili.get("sempre") == 10, "'3 su 3' scatta a ogni turno (10/10)")
    _check(m.variabili.get("mai") == 0, "'0 su 5' non scatta mai (0/10)")


def test_tema2c_probabilita_annulla_safe():
    print("[2c: ANNULLA riavvolge l'estrazione della condizione probabilistica]")
    # Un demone probabilistico fa avanzare l'RNG ogni turno; ANNULLA deve
    # riportare l'RNG (e quindi l'esito ripetuto) al punto pre-turno.
    src = ("L'arena è una stanza.\nIl giocatore comincia nell'arena.\n"
           "Il conta è un contatore.\nIl conta parte da 0.\n"
           "Ogni turno se càpita (1 su 2): aumenta il conta.\n"
           '"aspetta" è un comando senza oggetto.\nInvece di aspetta: dire ".".\n')
    m = runtime(src)
    esegui(m, "aspetta")
    dopo_uno = m.variabili.get("conta")
    esegui(m, "aspetta")
    dopo_due = m.variabili.get("conta")
    esegui(m, "annulla")               # disfa il secondo turno
    _check(m.variabili.get("conta") == dopo_uno, "ANNULLA riporta il contatore al turno precedente")
    esegui(m, "aspetta")               # ripete il turno: stesso esito casuale
    _check(m.variabili.get("conta") == dopo_due,
           "ripetendo il turno l'esito probabilistico è identico (RNG riavvolto)")


def test_tema2c_probabilita_in_regola_e_in_and():
    print("[2c: 'càpita (N su M)' usabile in una regola e dentro un AND]")
    src = ("L'arena è una stanza.\nIl giocatore comincia nell'arena.\n"
           "Il meteo è uno stato.\nIl meteo è pioggia.\n"
           "Il conta è un contatore.\nIl conta parte da 0.\n"
           '"scruta" è un comando senza oggetto.\n'
           'Invece di scruta se càpita (5 su 5) e il meteo è pioggia: aumenta il conta.\n')
    m = runtime(src)
    esegui(m, "scruta")
    _check(m.variabili.get("conta") == 1,
           "regola con 'càpita (5 su 5) e il meteo è pioggia' scatta (entrambe vere)")


def test_tema2c_serializza_chance_e_2b_pick():
    print("[2b/2c/IDE: il serializzatore espone 'pick' (scelta) e 'chance' (probabilità)]")
    src = (_src_meteo() +
           "Il conta è un contatore.\nIl conta parte da 0.\n"
           'Invece di osserva: il meteo diventa uno fra sereno, pioggia, nebbia.\n'
           "Ogni turno se càpita (1 su 4): aumenta il conta.\n")
    dati = regole_strutturate(src)
    _check(dati["ok"], "analizza_regole non solleva e ritorna ok")
    pick = [c for r in dati["rules"] for c in r.get("consequences", []) if c.get("op") == "pick"]
    _check(any(c.get("name") == "meteo" and c.get("values") == ["sereno", "pioggia", "nebbia"]
               for c in pick), "la scelta di stato è serializzata come {op:'pick', values:[…]}")
    cond_dem = [d.get("condition") for d in dati.get("demons", [])]
    chance = [c for c in cond_dem if isinstance(c, dict) and c.get("op") == "chance"]
    _check(any(c.get("num") == 1 and c.get("den") == 4 for c in chance),
           "la condizione probabilistica è serializzata come {op:'chance', num, den}")


# --- Test: Tema 4 [0.33.0] — il mondo che cambia in scena -------------------
# 4a) buio COMMUTABILE ('la stanza diventa buia/illuminata'); 4b) battuta di
# nodo CONDIZIONALE ('… dice "…" se …', prima vera vince come le descrizioni).


def _src_buio():
    """Mondo minimo per il Tema 4a: una stanza non buia in cui il giocatore parte,
    più due verbi intransitivi che la oscurano / la rischiarano."""
    return ("La radura è una stanza.\nIl giocatore comincia nella radura.\n"
            'La descrizione della radura è "Una radura quieta.".\n'
            '"oscura" è un comando senza oggetto.\n'
            '"rischiara" è un comando senza oggetto.\n')


def test_tema4a_diventa_buia_spegne_la_luce():
    print("[4a: 'la radura diventa buia' spegne la luce in scena]")
    m = runtime(_src_buio() +
                'Invece di oscura: la radura diventa buia.\n')
    radura = m.trova_stanza("radura")
    _check(radura is not None and radura.buia is False, "la radura parte illuminata")
    esegui(m, "oscura")
    _check(radura.buia is True, "dopo 'oscura' la radura è buia")
    out = esegui(m, "guarda")
    _check("buio pesto" in out.lower(), "al buio 'guarda' mostra 'È buio pesto.'")
    _check("radura quieta" not in out.lower(), "al buio la descrizione non si vede")


def test_tema4a_diventa_illuminata_riaccende():
    print("[4a: 'la radura diventa illuminata' riaccende una stanza buia]")
    # La radura parte BUIA (statica) e viene riaccesa in scena.
    m = runtime("La radura è una stanza.\nIl giocatore comincia nella radura.\n"
                "La radura è buia.\n"
                'La descrizione della radura è "Una radura quieta.".\n'
                '"rischiara" è un comando senza oggetto.\n'
                'Invece di rischiara: la radura diventa illuminata.\n')
    radura = m.trova_stanza("radura")
    _check(radura.buia is True, "la radura parte buia (dichiarazione statica)")
    esegui(m, "rischiara")
    _check(radura.buia is False, "dopo 'rischiara' la radura è illuminata")
    out = esegui(m, "guarda")
    _check("radura quieta" in out.lower(), "riaccesa, la descrizione torna visibile")


def test_tema4a_chiara_e_un_sinonimo_di_illuminata():
    print("[4a: 'diventa chiara' è accettato come opposto di 'buia']")
    m = runtime("La radura è una stanza.\nIl giocatore comincia nella radura.\n"
                "La radura è buia.\n"
                '"rischiara" è un comando senza oggetto.\n'
                'Invece di rischiara: la radura diventa chiara.\n')
    esegui(m, "rischiara")
    _check(m.trova_stanza("radura").buia is False, "'diventa chiara' spegne il buio")


def test_tema4a_annulla_safe():
    print("[4a: ANNULLA riavvolge il buio commutato]")
    m = runtime(_src_buio() +
                'Invece di oscura: la radura diventa buia.\n')
    radura = m.trova_stanza("radura")
    esegui(m, "oscura")
    _check(radura.buia is True, "la radura è buia dopo 'oscura'")
    esegui(m, "annulla")
    # Dopo ANNULLA l'oggetto stanza potrebbe essere stato sostituito dall'istantanea.
    _check(m.trova_stanza("radura").buia is False,
           "ANNULLA riporta la radura allo stato illuminato precedente")


def test_tema4a_bersaglio_non_stanza_e_errore():
    print("[4a/diagnostica: cambiare il buio a un OGGETTO è un errore gentile]")
    src = ("La cella è una stanza.\nUna pietra è una cosa.\nLa pietra è in cella.\n"
           '"x" è un comando senza oggetto.\n'
           "Invece di x: la pietra diventa buia.\n")
    r = strutturato(src)
    _check(not r["ok"], "il file NON compila (la pietra non è una stanza)")
    msg = " ".join(e["message"] for e in r["errors"])
    _check("pietra" in msg and "stanza" in msg.lower(),
           "l'errore nomina la pietra e spiega che serve una stanza")


def test_tema4a_proprieta_non_di_luce_e_errore():
    print("[4a/diagnostica: 'diventa rossa' (non buio/luce) è un errore gentile]")
    src = ("La cella è una stanza.\n"
           '"x" è un comando senza oggetto.\n'
           "Invece di x: la cella diventa rossa.\n")
    r = strutturato(src)
    _check(not r["ok"], "il file NON compila ('rossa' non è una proprietà di luce)")
    msg = " ".join(e["message"] for e in r["errors"])
    _check("rossa" in msg and ("buia" in msg or "illuminata" in msg),
           "l'errore nomina 'rossa' e suggerisce buia/illuminata/chiara")


def _src_battuta_cond():
    """Mondo minimo per il Tema 4b: un NPC con una battuta che dipende da uno stato
    ('doppiogioco'), più due battute condizionali e una di fallback."""
    return ("La sala è una stanza.\nIl giocatore comincia nella sala.\n"
            "Il doppiogioco è uno stato.\nIl doppiogioco è ignoto.\n"
            "Anna è un personaggio.\nAnna è in sala.\n"
            'Il dialogo di Anna comincia con "incontro".\n'
            'Anna al nodo "incontro" dice "Sono smascherata." se il doppiogioco è palese.\n'
            'Anna al nodo "incontro" dice "Sospetti qualcosa?" se il doppiogioco è sospetto.\n'
            'Anna al nodo "incontro" dice "Buongiorno.".\n'
            'Al nodo "incontro" l\'opzione "Addio." chiude il dialogo.\n')


def test_tema4b_battuta_condizionale_prima_vera_vince():
    print("[4b: la battuta scelta è la prima la cui condizione è vera]")
    m = runtime(_src_battuta_cond())
    nodo = m.nodo_dialogo_di("incontro")
    _check(len(nodo.battute_condizionali) == 2, "due battute condizionali accumulate")
    _check(nodo.battuta == "Buongiorno.", "la battuta incondizionata è la base (fallback)")
    # Stato di default: nessuna condizione vera -> fallback.
    _check(nodo.battuta_attuale(m) == "Buongiorno.", "senza condizioni vere vince la base")
    m.variabili["doppiogioco"] = "sospetto"
    _check(nodo.battuta_attuale(m) == "Sospetti qualcosa?", "con 'sospetto' vince la 2a condizionale")
    m.variabili["doppiogioco"] = "palese"
    _check(nodo.battuta_attuale(m) == "Sono smascherata.",
           "con 'palese' vince la 1a condizionale (ordine di dichiarazione)")


def test_tema4b_battuta_condizionale_runtime():
    print("[4b: 'parla con Anna' mostra la battuta giusta secondo lo stato]")
    m = runtime(_src_battuta_cond())
    out = esegui(m, "parla con Anna")
    _check("Buongiorno." in out, "di default Anna usa la battuta di fallback")
    m2 = runtime(_src_battuta_cond() +
                 "Il doppiogioco è palese.\n")  # stato iniziale = palese
    out2 = esegui(m2, "parla con Anna")
    _check("Sono smascherata." in out2,
           "con doppiogioco palese Anna usa la prima battuta condizionale")


def test_tema4b_battuta_condizionale_con_segnaposto():
    print("[4b: i segnaposto [nome] funzionano anche in una battuta condizionale]")
    src = ("La sala è una stanza.\nIl giocatore comincia nella sala.\n"
           "Il bottino è un contatore.\nIl bottino parte da 9.\n"
           "Il doppiogioco è uno stato.\nIl doppiogioco è palese.\n"
           "Anna è un personaggio.\nAnna è in sala.\n"
           'Il dialogo di Anna comincia con "incontro".\n'
           'Anna al nodo "incontro" dice "Ho [bottino] monete." se il doppiogioco è palese.\n'
           'Anna al nodo "incontro" dice "Niente.".\n'
           'Al nodo "incontro" l\'opzione "Addio." chiude il dialogo.\n')
    m = runtime(src)
    out = esegui(m, "parla con Anna")
    _check("Ho 9 monete." in out, "il segnaposto [bottino] è interpolato nella battuta condizionale")


def test_tema4b_battuta_incondizionata_resta_compatibile():
    print("[4b: una battuta senza 'se' continua a funzionare come prima]")
    mondo, _ = compila(_SRC_NPC)
    nodo = mondo.dialogo_nodi.get("saluto")
    _check(nodo is not None and nodo.battuta == "Benvenuto, viaggiatore!",
           "la battuta semplice resta la base del nodo")
    _check(nodo is not None and nodo.battute_condizionali == [],
           "nessuna battuta condizionale per un nodo senza clausola 'se'")


def test_a4_idioma_direzioni_opposte_funziona():
    print("[A4: l'idioma corretto 'A e B sono direzioni opposte' resta la via giusta]")
    m = runtime("La cella è una stanza.\n"
                "Il corridoio è una stanza.\n"
                "Sinistra e destra sono direzioni opposte.\n"
                "La cella collega sinistra a corridoio.\n"
                "Il giocatore comincia nella cella.\n")
    esegui(m, "sinistra")
    _check(m.posizione_giocatore == "corridoio",
           "muoversi con la direzione personalizzata 'sinistra' funziona")


# --- Test: errori d'autore migliori [Livello 2.5, beneficio collaterale] -----

def test_errore_entita_sconosciuta():
    print("[errore chiaro per entità mai dichiarata]")
    src = "La cella è una stanza.\nLa porta è in cella.\n"  # 'porta' non dichiarata
    mondo, log = compila(src)
    _check(mondo is None, "la compilazione fallisce")
    _check("sconosciuta" in log.lower() and "porta" in log,
           "il log nomina l'entità sconosciuta 'porta'")
    _check("SINTASSI" not in log, "non è il parse error criptico generico")


def test_errore_entita_suggerimento():
    print("[suggerimento sul refuso di un nome noto]")
    src = (
        "La cella è una stanza.\n"
        "Una chiave è una cosa.\nLa chiave è in cella.\n"
        'Invece di prendi la chave: dire "x".\n'  # 'chave' = refuso di 'chiave'
    )
    mondo, log = compila(src)
    _check(mondo is None, "la compilazione fallisce")
    _check("chiave" in log and "intendevi" in log.lower(),
           "il log suggerisce 'chiave' come correzione di 'chave'")


def test_errore_sintassi_resta_generico():
    print("[un vero errore di sintassi non viene scambiato per entità sconosciuta]")
    src = "La cella è una stanza\n"  # manca il punto finale
    mondo, log = compila(src)
    _check(mondo is None, "la compilazione fallisce")
    _check("sconosciuta" not in log.lower() and "SINTASSI" in log,
           "resta un errore di sintassi, non una falsa 'entità sconosciuta'")


# --- Test: LIVELLO 5 — interpolazione di testo dinamico [var] (0.9.1) ---------

_SRC_INTERP = (
    "La cella è una stanza.\n"
    "La chiave è una cosa.\n"          # nome_visualizzato = 'La chiave'
    "La chiave è in cella.\n"
    "La chiave è prendibile.\n"
    "Il punteggio è un contatore.\n"   # default 0
    "Il semaforo è uno stato.\n"
    "Il semaforo è rosso.\n"
)


def test_interpolazione_contatore():
    print("[interpolazione: contatore nel testo, valore corrente]")
    src = _SRC_INTERP + (
        'Invece di esamina la chiave: dire "Punti: [punteggio]." '
        'e adesso aumenta il punteggio di 5.\n'
    )
    mondo = runtime(src)
    out1 = esegui(mondo, "esamina chiave")
    _check("Punti: 0." in out1, "primo esame: contatore reso come 0 (prima della conseguenza)")
    out2 = esegui(mondo, "esamina chiave")
    _check("Punti: 5." in out2, "secondo esame: contatore reso come 5 (dopo la conseguenza)")


def test_interpolazione_stato():
    print("[interpolazione: valore di uno stato nel testo]")
    src = _SRC_INTERP + 'Invece di esamina la chiave: dire "Colore: [semaforo].".\n'
    mondo = runtime(src)
    out = esegui(mondo, "esamina chiave")
    _check("Colore: rosso." in out, "lo stato 'semaforo' è reso come 'rosso'")


def test_interpolazione_nome_oggetto():
    print("[interpolazione: nome visualizzato di un oggetto]")
    src = _SRC_INTERP + 'Invece di esamina la chiave: dire "Vedo [chiave] qui.".\n'
    mondo = runtime(src)
    out = esegui(mondo, "esamina chiave")
    _check("Vedo La chiave qui." in out, "l'oggetto è reso col suo nome visualizzato")


def test_interpolazione_in_descrizione():
    print("[interpolazione: segnaposto nella descrizione di un oggetto]")
    src = _SRC_INTERP + 'La descrizione della chiave è "Lucida. Hai [punteggio] punti.".\n'
    mondo = runtime(src)
    out = esegui(mondo, "esamina chiave")
    _check("Hai 0 punti." in out, "la descrizione interpola il contatore")


def test_interpolazione_sconosciuto_resta_letterale_e_warning():
    print("[interpolazione: segnaposto sconosciuto -> letterale + warning]")
    src = _SRC_INTERP + 'Invece di esamina la chiave: dire "Valore [pippo].".\n'
    mondo, log = compila(src)
    _check(mondo is not None, "la compilazione riesce (warning non bloccante)")
    _check("[pippo]" in log and "Segnaposto" in log,
           "il log avvisa del segnaposto sconosciuto '[pippo]'")
    mondo = runtime(src)
    out = esegui(mondo, "esamina chiave")
    _check("Valore [pippo]." in out, "a runtime il segnaposto sconosciuto resta letterale")


def test_interpolazione_stato_non_impostato_vuoto():
    print("[interpolazione: stato dichiarato senza valore -> stringa vuota]")
    from utils import rendi_testo
    src = (
        "La cella è una stanza.\n"
        "Il semaforo è uno stato.\n"   # nessun valore iniziale -> None
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "compila")
    _check(rendi_testo(mondo, "X[semaforo]Y") == "XY",
           "uno stato a None rende stringa vuota")


def test_interpolazione_nessun_warning_se_noto():
    print("[interpolazione: nessun warning per segnaposto validi]")
    src = _SRC_INTERP + 'Invece di esamina la chiave: dire "[punteggio] [semaforo] [chiave].".\n'
    mondo, log = compila(src)
    _check(mondo is not None, "compila")
    _check("Segnaposto" not in log, "nessun avviso di segnaposto per nomi noti")


# --- Test: LIVELLO 5 — regole globali senza oggetto (0.9.2) -------------------

_SRC_GLOBALE = (
    "La cella è una stanza.\n"
    "La chiave è una cosa.\n"
    "La chiave è in cella.\n"
    "La chiave è prendibile.\n"
    "Il punteggio è un contatore.\n"
    'Invece di prendi la chiave: dire "Presa." e adesso aumenta il punteggio di 5.\n'
)


def test_regola_globale_compila_senza_bersaglio():
    print("[regola globale: compila con bersaglio nullo]")
    src = _SRC_GLOBALE + 'Invece di guarda se il punteggio è almeno 3: dire "Luce.".\n'
    mondo, _ = compila(src)
    _check(mondo is not None, "compila senza errori")
    globali = [r for r in mondo.regole if r.id_oggetto_bersaglio is None]
    _check(len(globali) == 1, "esiste una regola con id_oggetto_bersaglio = None")
    _check(globali and globali[0].verbo == "guarda", "la regola globale è sul verbo 'guarda'")


def test_regola_globale_condizione_falsa_non_scatta():
    print("[regola globale: condizione falsa -> non scatta, default attivo]")
    src = _SRC_GLOBALE + 'Invece di guarda se il punteggio è almeno 3: dire "Una luce pulsa.".\n'
    mondo = runtime(src)
    out = esegui(mondo, "guarda")  # punteggio = 0, condizione falsa
    _check("Una luce pulsa." not in out, "la regola globale NON scatta")
    _check("cella" in out.lower(), "viene mostrata la descrizione di default della stanza")


def test_regola_globale_condizione_vera_scatta():
    print("[regola globale: condizione vera -> scatta e sostituisce il default]")
    src = _SRC_GLOBALE + 'Invece di guarda se il punteggio è almeno 3: dire "Una luce pulsa.".\n'
    mondo = runtime(src)
    esegui(mondo, "prendi chiave")        # punteggio -> 5
    out = esegui(mondo, "guarda")          # ora 5 >= 3
    _check("Una luce pulsa." in out, "la regola globale scatta quando la condizione è vera")


def test_regola_globale_senza_condizione_scatta_sempre():
    print("[regola globale: senza condizione scatta sempre]")
    src = _SRC_GLOBALE + 'Invece di aiuto: dire "Nessun aiuto qui.".\n'
    mondo = runtime(src)
    out = esegui(mondo, "aiuto")
    _check("Nessun aiuto qui." in out, "la regola globale incondizionata scatta")
    _check("--- AIUTO ---" not in out, "il testo di aiuto di default è sostituito")


def test_regola_specifica_precede_globale():
    print("[regola globale: una regola specifica ha la precedenza]")
    src = _SRC_GLOBALE + (
        'Invece di esamina la chiave: dire "Specifica.".\n'
        'Invece di esamina se il punteggio è almeno 0: dire "Globale.".\n'
    )
    mondo = runtime(src)
    out = esegui(mondo, "esamina chiave")
    _check("Specifica." in out, "scatta la regola specifica sull'oggetto")
    _check("Globale." not in out, "la regola globale non scavalca quella specifica")


def test_regola_globale_esegue_conseguenza():
    print("[regola globale: esegue la conseguenza (fine partita)]")
    src = _SRC_GLOBALE + 'Invece di guarda se il punteggio è meno di 1: dire "Fine." e adesso vinci.\n'
    mondo = runtime(src)
    out = esegui(mondo, "guarda")  # punteggio 0 < 1
    _check("Fine." in out, "la regola globale stampa la risposta")
    _check("HAI VINTO" in out, "la conseguenza di fine partita è eseguita")


# --- Test: LIVELLO 5 — descrizioni condizionali (0.9.3) -----------------------

_SRC_DESCCOND = (
    "La cella è una stanza.\n"
    "La torcia è una cosa.\n"
    "La torcia è in cella.\n"
    "La torcia è prendibile.\n"
    "Il semaforo è uno stato.\n"
    "Il semaforo è rosso.\n"
    'La descrizione della torcia è "Una torcia spenta.".\n'
    'La descrizione della torcia se il semaforo è verde è "Una torcia che brilla.".\n'
    'Invece di usa la torcia: dire "Accendi." e adesso il semaforo è verde.\n'
)


def test_descrizione_condizionale_compila():
    print("[descrizione condizionale: base + variante registrate]")
    mondo, _ = compila(_SRC_DESCCOND)
    _check(mondo is not None, "compila senza errori")
    torcia = mondo.oggetti.get("torcia")
    _check(torcia is not None and torcia.descrizione == "Una torcia spenta.",
           "la descrizione di base è quella senza 'se'")
    _check(torcia is not None and len(torcia.descrizioni_condizionali) == 1,
           "una variante condizionale è registrata")


def test_descrizione_condizionale_base_quando_falsa():
    print("[descrizione condizionale: condizione falsa -> descrizione di base]")
    mondo = runtime(_SRC_DESCCOND)
    out = esegui(mondo, "esamina torcia")  # semaforo = rosso
    _check("Una torcia spenta." in out, "mostra la base quando la condizione è falsa")
    _check("brilla" not in out, "la variante condizionale non appare")


def test_descrizione_condizionale_variante_quando_vera():
    print("[descrizione condizionale: condizione vera -> variante]")
    mondo = runtime(_SRC_DESCCOND)
    esegui(mondo, "usa torcia")             # semaforo -> verde
    out = esegui(mondo, "esamina torcia")
    _check("Una torcia che brilla." in out, "mostra la variante quando la condizione è vera")


def test_descrizione_condizionale_prima_vera_vince():
    print("[descrizione condizionale: la prima variante vera (in ordine) vince]")
    src = (
        "La cella è una stanza.\n"
        "La gemma è una cosa.\n"
        "La gemma è in cella.\n"
        "Il semaforo è uno stato.\n"
        "Il semaforo è verde.\n"
        'La descrizione della gemma se il semaforo è verde è "Prima.".\n'
        'La descrizione della gemma se il semaforo è verde è "Seconda.".\n'
    )
    mondo = runtime(src)
    out = esegui(mondo, "esamina gemma")
    _check("Prima." in out and "Seconda." not in out,
           "vince la prima variante dichiarata tra quelle vere")


def test_descrizione_condizionale_su_stanza():
    print("[descrizione condizionale: funziona anche per una stanza]")
    src = (
        "La cella è una stanza.\n"
        "Il semaforo è uno stato.\n"
        "Il semaforo è verde.\n"
        'La descrizione della cella è "Buio.".\n'
        'La descrizione della cella se il semaforo è verde è "La cella è illuminata.".\n'
    )
    mondo = runtime(src)
    out = esegui(mondo, "guarda")
    _check("La cella è illuminata." in out, "la stanza usa la descrizione condizionale")


def test_descrizione_condizionale_con_interpolazione():
    print("[descrizione condizionale: interpolazione [var] nel testo]")
    src = (
        "La cella è una stanza.\n"
        "La torcia è una cosa.\n"
        "La torcia è in cella.\n"
        "Il punteggio è un contatore.\n"
        "Il semaforo è uno stato.\n"
        "Il semaforo è verde.\n"
        'La descrizione della torcia se il semaforo è verde è "Brilla, hai [punteggio] punti.".\n'
    )
    mondo = runtime(src)
    out = esegui(mondo, "esamina torcia")
    _check("Brilla, hai 0 punti." in out, "la variante condizionale interpola il contatore")


# --- Test: LIVELLO 5 — concordanza grammaticale italiana (0.9.4) --------------

def test_concordanza_inferenza_genere_numero():
    print("[concordanza: genere/numero inferiti dall'articolo del nome]")
    from utils import genere_numero
    casi = {
        "La torcia": ("f", "s"),
        "Il tavolo": ("m", "s"),
        "Lo specchio": ("m", "s"),
        "Le chiavi": ("f", "p"),
        "I tavoli": ("m", "p"),
        "Gli specchi": ("m", "p"),
        "L'ascia": (None, "s"),     # 'l'' ambiguo nel genere
        "chiave": (None, None),       # senza articolo: nessuna info
    }
    for nome, atteso in casi.items():
        _check(genere_numero(nome) == atteso, f"{nome!r} -> {atteso}")


def test_concordanza_frase_indeterminativa():
    print("[concordanza: articolo indeterminativo/partitivo concordato]")
    from utils import frase_indeterminativa as f
    _check(f("La torcia") == "una torcia", "femminile + consonante -> 'una'")
    _check(f("La ascia") == "un'ascia", "femminile + vocale -> \"un'\"")
    _check(f("Il tavolo") == "un tavolo", "maschile + consonante -> 'un'")
    _check(f("Lo specchio") == "uno specchio", "maschile + s impura -> 'uno'")
    _check(f("Lo zaino") == "uno zaino", "maschile + z -> 'uno'")
    _check(f("Le chiavi") == "delle chiavi", "femminile plurale -> 'delle'")
    _check(f("I tavoli") == "dei tavoli", "maschile plurale + consonante -> 'dei'")
    _check(f("Gli specchi") == "degli specchi", "maschile plurale + s impura -> 'degli'")
    _check(f("chiave") == "chiave", "senza articolo: nome invariato (non inventa)")


def test_concordanza_oggetto_metodo():
    print("[concordanza: Oggetto.concordanza() legge il nome visualizzato]")
    src = (
        "La cella è una stanza.\n"
        "La torcia è una cosa.\n"
        "La torcia è in cella.\n"
    )
    mondo, _ = compila(src)
    torcia = mondo.oggetti.get("torcia")
    _check(torcia is not None and torcia.concordanza() == ("f", "s"),
           "la torcia è inferita femminile singolare")


def test_concordanza_elenco_stanza_singolari():
    print("[concordanza: elenco oggetti con articoli concordati]")
    src = (
        "La cella è una stanza.\n"
        "La torcia è una cosa.\nLa torcia è in cella.\n"
        "Il tavolo è una cosa.\nIl tavolo è in cella.\n"
    )
    mondo = runtime(src)
    out = esegui(mondo, "guarda")
    _check("una torcia" in out, "la torcia è introdotta da 'una'")
    _check("un tavolo" in out, "il tavolo è introdotto da 'un'")
    _check("La torcia" not in out, "l'articolo determinativo grezzo non compare più nell'elenco")


def test_concordanza_elenco_plurale():
    print("[concordanza: oggetto plurale -> partitivo nell'elenco]")
    src = (
        "La cella è una stanza.\n"
        "Le chiavi è una cosa.\nLe chiavi è in cella.\n"
    )
    mondo = runtime(src)
    out = esegui(mondo, "guarda")
    _check("delle chiavi" in out, "l'oggetto plurale usa il partitivo 'delle'")


# --- Test: LIVELLO 5b — NPC e dialoghi, fondazione (0.10.1) --------------------

_SRC_NPC = (
    "La piazza è una stanza.\n"
    "Il mercante è un personaggio.\n"
    "Il mercante è in piazza.\n"
    'Il dialogo del mercante comincia con "saluto".\n'
    'Il mercante al nodo "saluto" dice "Benvenuto, viaggiatore!".\n'
    'Al nodo "saluto" l\'opzione "Addio." chiude il dialogo.\n'
)


def test_npc_dichiarazione():
    print("[NPC: 'X è un personaggio' crea un oggetto-personaggio]")
    mondo, _ = compila(_SRC_NPC)
    _check(mondo is not None, "compila senza errori")
    npc = mondo.oggetti.get("mercante")
    _check(npc is not None and npc.is_personaggio, "il mercante è un personaggio")
    _check(npc is not None and npc.posizione == "piazza", "il mercante è in piazza")


def test_dialogo_struttura():
    print("[dialogo: nodo d'ingresso, battuta e opzione registrati]")
    mondo, _ = compila(_SRC_NPC)
    npc = mondo.oggetti.get("mercante")
    _check(npc is not None and npc.dialogo_iniziale == "saluto", "nodo d'ingresso = 'saluto'")
    nodo = mondo.dialogo_nodi.get("saluto")
    _check(nodo is not None and nodo.battuta == "Benvenuto, viaggiatore!", "battuta registrata")
    _check(nodo is not None and len(nodo.opzioni) == 1 and nodo.opzioni[0].chiude,
           "una sola opzione, che chiude il dialogo")


def test_dialogo_avvio_runtime():
    print("[dialogo: 'parla con X' avvia la conversazione e mostra le opzioni]")
    mondo = runtime(_SRC_NPC)
    out = esegui(mondo, "parla con mercante")
    _check("Benvenuto, viaggiatore!" in out, "viene mostrata la battuta")
    _check("1. Addio." in out, "l'opzione è elencata e numerata")
    _check(mondo.in_dialogo() and mondo.nodo_dialogo == "saluto",
           "il mondo è in dialogo sul nodo d'ingresso")


def test_dialogo_scelta_chiude():
    print("[dialogo: scegliere l'opzione di uscita termina la conversazione]")
    mondo = runtime(_SRC_NPC)
    esegui(mondo, "parla con mercante")
    out = esegui(mondo, "1")
    _check("Fine della conversazione." in out, "la conversazione si conclude")
    _check(not mondo.in_dialogo(), "il mondo non è più in dialogo")


def test_dialogo_scelta_per_testo():
    print("[dialogo: l'opzione si può scegliere anche per testo]")
    mondo = runtime(_SRC_NPC)
    esegui(mondo, "parla con mercante")
    esegui(mondo, "addio.")   # match testuale dell'opzione "Addio."
    _check(not mondo.in_dialogo(), "scelta per testo conclude il dialogo")


def test_dialogo_uscita_universale_non_esce_dal_gioco():
    print("[dialogo: 'esci' chiude il dialogo, non il gioco]")
    mondo = runtime(_SRC_NPC)
    esegui(mondo, "parla con mercante")
    from gioco import elabora_comando
    import io, contextlib
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        continua = elabora_comando(mondo, "esci")
    _check(continua is True, "il gioco continua (esci non termina la partita)")
    _check(not mondo.in_dialogo(), "ma la conversazione è chiusa")


def test_dialogo_non_consuma_turno():
    print("[dialogo: parlare e scegliere non fa avanzare i turni]")
    mondo = runtime(_SRC_NPC)
    esegui(mondo, "parla con mercante")
    esegui(mondo, "1")
    _check(mondo.turno_corrente == 0, "il tempo del mondo non è avanzato durante il dialogo")


def test_dialogo_battuta_interpolata():
    print("[dialogo: la battuta interpola i segnaposto [var]]")
    src = (
        "La piazza è una stanza.\n"
        "Il mercante è un personaggio.\nIl mercante è in piazza.\n"
        "L'oro è un contatore.\n"
        'Il dialogo del mercante comincia con "saluto".\n'
        'Il mercante al nodo "saluto" dice "Hai [oro] monete.".\n'
        'Al nodo "saluto" l\'opzione "Addio." chiude il dialogo.\n'
    )
    mondo = runtime(src)
    out = esegui(mondo, "parla con mercante")
    _check("Hai 0 monete." in out, "la battuta interpola il contatore 'oro'")


def test_personaggio_senza_dialogo_warning():
    print("[NPC senza nodo d'ingresso: warning non bloccante]")
    src = (
        "La piazza è una stanza.\n"
        "Il mercante è un personaggio.\nIl mercante è in piazza.\n"
    )
    mondo, log = compila(src)
    _check(mondo is not None, "compila (warning non bloccante)")
    _check("mercante" in log and "dialogo" in log.lower(),
           "il log avvisa che il personaggio non ha dialogo")


def test_dialogo_su_non_personaggio_errore():
    print("[dialogo riferito a non-personaggio: errore bloccante]")
    src = (
        "La piazza è una stanza.\n"
        "La statua è una cosa.\nLa statua è in piazza.\n"
        'Il dialogo della statua comincia con "saluto".\n'
        'La statua al nodo "saluto" dice "...".\n'
        'Al nodo "saluto" l\'opzione "Addio." chiude il dialogo.\n'
    )
    mondo, log = compila(src)
    _check(mondo is None, "la compilazione fallisce")
    _check("personaggio" in log.lower(), "il log spiega che serve un personaggio")


# --- Test: LIVELLO 5b — ramificazione dei dialoghi (0.10.2) --------------------

_SRC_RAMI = (
    "La piazza è una stanza.\n"
    "Il mercante è un personaggio.\nIl mercante è in piazza.\n"
    'Il dialogo del mercante comincia con "saluto".\n'
    'Il mercante al nodo "saluto" dice "Che vuoi sapere?".\n'
    'Al nodo "saluto" l\'opzione "Chi sei?" conduce al nodo "chi".\n'
    'Al nodo "saluto" l\'opzione "Addio." chiude il dialogo.\n'
    'Il mercante al nodo "chi" dice "Un mercante di spezie.".\n'
    'Al nodo "chi" l\'opzione "Torna indietro." conduce al nodo "saluto".\n'
    'Al nodo "chi" l\'opzione "Addio." chiude il dialogo.\n'
)


def test_ramificazione_struttura():
    print("[ramificazione: opzione 'conduce al nodo' registra la destinazione]")
    mondo, _ = compila(_SRC_RAMI)
    nodo = mondo.dialogo_nodi.get("saluto")
    opz_chi = next((o for o in nodo.opzioni if "Chi sei" in o.testo), None)
    _check(opz_chi is not None and opz_chi.destinazione == "chi" and not opz_chi.chiude,
           "l'opzione conduce al nodo 'chi'")


def test_ramificazione_transizione_runtime():
    print("[ramificazione: scegliere transita al nodo successivo]")
    mondo = runtime(_SRC_RAMI)
    esegui(mondo, "parla con mercante")
    out = esegui(mondo, "1")   # "Chi sei?" -> nodo "chi"
    _check("Un mercante di spezie." in out, "mostra la battuta del nodo di arrivo")
    _check(mondo.nodo_dialogo == "chi", "il nodo corrente è 'chi'")


def test_ramificazione_ritorno_e_chiusura():
    print("[ramificazione: ritorno a un nodo precedente e chiusura]")
    mondo = runtime(_SRC_RAMI)
    esegui(mondo, "parla con mercante")
    esegui(mondo, "1")                       # -> chi
    out = esegui(mondo, "torna indietro.")   # match testuale -> saluto
    _check("Che vuoi sapere?" in out and mondo.nodo_dialogo == "saluto",
           "si torna al nodo 'saluto'")
    esegui(mondo, "2")                        # Addio -> chiude
    _check(not mondo.in_dialogo(), "la conversazione si chiude")


def test_ramificazione_nodo_inesistente_warning():
    print("[ramificazione: transizione verso un nodo inesistente -> warning]")
    src = (
        "La piazza è una stanza.\n"
        "Il mercante è un personaggio.\nIl mercante è in piazza.\n"
        'Il dialogo del mercante comincia con "saluto".\n'
        'Il mercante al nodo "saluto" dice "Ciao.".\n'
        'Al nodo "saluto" l\'opzione "Vai." conduce al nodo "inesistente".\n'
    )
    mondo, log = compila(src)
    _check(mondo is not None, "compila (warning non bloccante)")
    _check("inesistente" in log and "non esiste" in log.lower(),
           "il log avvisa della transizione verso un nodo inesistente")


# --- Test: LIVELLO 5b — conseguenze sulle scelte di dialogo (0.10.3) -----------

_SRC_CONSEG = (
    "La piazza è una stanza.\n"
    "Il mercante è un personaggio.\nIl mercante è in piazza.\n"
    "La gemma è una cosa.\nLa gemma è in piazza.\n"
    "L'oro è un contatore.\n"
    'Il dialogo del mercante comincia con "saluto".\n'
    'Il mercante al nodo "saluto" dice "Vuoi la gemma?".\n'
    'Al nodo "saluto" l\'opzione "Sì!" conduce al nodo "fine" e adesso la gemma è in inventario e adesso aumenta l\'oro di 5.\n'
    'Al nodo "saluto" l\'opzione "No." chiude il dialogo.\n'
    'Il mercante al nodo "fine" dice "Hai [oro] monete.".\n'
    'Al nodo "fine" l\'opzione "Addio." chiude il dialogo e adesso vinci.\n'
)


def test_conseguenza_scelta_struttura():
    print("[conseguenze: l'opzione registra le conseguenze in coda]")
    mondo, _ = compila(_SRC_CONSEG)
    nodo = mondo.dialogo_nodi.get("saluto")
    opz = next((o for o in nodo.opzioni if o.destinazione == "fine"), None)
    _check(opz is not None and len(opz.conseguenze) == 2,
           "l'opzione ha due conseguenze (spostamento + contatore)")


def test_conseguenza_scelta_modifica_mondo():
    print("[conseguenze: scegliere cambia lo stato del mondo]")
    mondo = runtime(_SRC_CONSEG)
    esegui(mondo, "parla con mercante")
    out = esegui(mondo, "1")   # "Sì!" -> dà la gemma, +5 oro, va a "fine"
    _check("gemma" in mondo.inventario, "la gemma è finita nell'inventario")
    _check(mondo.variabili.get("oro") == 5, "il contatore 'oro' è aumentato a 5")
    _check("Hai 5 monete." in out, "la battuta del nodo d'arrivo interpola il nuovo valore")


def test_conseguenza_scelta_fine_partita():
    print("[conseguenze: una scelta può terminare la partita]")
    mondo = runtime(_SRC_CONSEG)
    esegui(mondo, "parla con mercante")
    esegui(mondo, "1")                     # -> nodo "fine"
    from gioco import elabora_comando
    import io, contextlib
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        continua = elabora_comando(mondo, "1")   # "Addio." chiude + vinci
    out = buf.getvalue()
    _check("HAI VINTO" in out, "la conseguenza di fine partita scatta dal dialogo")
    _check(continua is False, "il gioco termina")
    _check(not mondo.in_dialogo(), "la conversazione è chiusa")


# --- Test: LIVELLO 5b — opzioni condizionali (0.10.4) --------------------------

_SRC_OPZCOND = (
    "La piazza è una stanza.\n"
    "Il mercante è un personaggio.\nIl mercante è in piazza.\n"
    "La chiave è una cosa.\nLa chiave è in piazza.\nLa chiave è prendibile.\n"
    'Il dialogo del mercante comincia con "saluto".\n'
    'Il mercante al nodo "saluto" dice "Hai la chiave?".\n'
    'Al nodo "saluto" l\'opzione "Ecco la chiave!" se il giocatore ha la chiave conduce al nodo "grazie".\n'
    'Al nodo "saluto" l\'opzione "Non ancora." chiude il dialogo.\n'
    'Il mercante al nodo "grazie" dice "Grazie!".\n'
    'Al nodo "grazie" l\'opzione "Prego." chiude il dialogo.\n'
)


def test_opzione_condizionale_struttura():
    print("[opzione condizionale: la condizione è registrata sull'opzione]")
    mondo, _ = compila(_SRC_OPZCOND)
    nodo = mondo.dialogo_nodi.get("saluto")
    opz = next((o for o in nodo.opzioni if "Ecco" in o.testo), None)
    _check(opz is not None and opz.condizione is not None,
           "l'opzione 'Ecco la chiave!' ha una condizione")


def test_opzione_condizionale_nascosta_se_falsa():
    print("[opzione condizionale: nascosta finché la condizione è falsa]")
    mondo = runtime(_SRC_OPZCOND)
    out = esegui(mondo, "parla con mercante")   # senza chiave
    _check("Ecco la chiave!" not in out, "l'opzione condizionata non appare")
    _check("Non ancora." in out, "l'opzione incondizionata appare")


def test_opzione_condizionale_visibile_se_vera():
    print("[opzione condizionale: appare quando la condizione è vera]")
    mondo = runtime(_SRC_OPZCOND)
    esegui(mondo, "prendi chiave")
    out = esegui(mondo, "parla con mercante")
    _check("Ecco la chiave!" in out, "con la chiave l'opzione condizionata appare")
    _check("1. Ecco la chiave!" in out, "ed è la prima opzione numerata")


def test_opzione_condizionale_selezione_per_numero_coerente():
    print("[opzione condizionale: la numerazione segue le opzioni disponibili]")
    mondo = runtime(_SRC_OPZCOND)
    esegui(mondo, "prendi chiave")
    esegui(mondo, "parla con mercante")
    out = esegui(mondo, "1")   # con chiave, 1 = "Ecco la chiave!" -> nodo "grazie"
    _check("Grazie!" in out and mondo.nodo_dialogo == "grazie",
           "scegliere 1 segue l'opzione condizionata disponibile")


# --- Test: LINTER SEMANTICO [Livello 6 / 0.11.1] -----------------------------
#
# Analisi statica non bloccante (canale 'warnings'): stanze irraggiungibili,
# oggetti orfani, regole morte, stati/contatori inutilizzati. Sorgenti minimali
# e auto-coerenti, così ogni test isola un solo tipo di avviso.

def test_lint_stanza_irraggiungibile():
    print("[linter: stanza irraggiungibile dal punto di partenza]")
    src = (
        "La prima è una stanza.\n"
        "La seconda è una stanza.\n"
        "Il giocatore comincia in prima.\n"
    )
    mondo, log = compila(src)
    _check(mondo is not None, "compila comunque (warning non bloccante)")
    _check("irraggiungibile" in log and "seconda" in log,
           "la stanza 'seconda', non collegata, è segnalata irraggiungibile")


def test_lint_stanza_collegata_non_segnalata():
    print("[linter: una stanza raggiungibile non è segnalata]")
    src = (
        "La prima è una stanza.\n"
        "La seconda è una stanza.\n"
        "La prima collega nord a seconda.\n"
        "Il giocatore comincia in prima.\n"
    )
    mondo, log = compila(src)
    _check("irraggiungibile" not in log,
           "con la connessione nessuna stanza è irraggiungibile")


def test_lint_oggetto_orfano():
    print("[linter: oggetto mai collocato]")
    src = (
        "La cella è una stanza.\n"
        "Il giocatore comincia in cella.\n"
        "Una gemma è una cosa.\n"
    )
    mondo, log = compila(src)
    _check(mondo is not None, "compila comunque (warning non bloccante)")
    _check("mai collocato" in log and "gemma" in log,
           "la gemma non collocata da nessuna parte è segnalata orfana")


def test_lint_oggetto_collocato_non_orfano():
    print("[linter: un oggetto collocato non è orfano]")
    src = (
        "La cella è una stanza.\n"
        "Il giocatore comincia in cella.\n"
        "Una gemma è una cosa.\nLa gemma è in cella.\n"
    )
    mondo, log = compila(src)
    _check("mai collocato" not in log, "un oggetto in una stanza non è orfano")


def test_lint_oggetto_introdotto_da_conseguenza_non_orfano():
    print("[linter: un oggetto introdotto da una conseguenza non è orfano]")
    src = (
        "La cella è una stanza.\n"
        "Il giocatore comincia in cella.\n"
        "Una leva è una cosa.\nLa leva è in cella.\n"
        "Una gemma è una cosa.\n"
        'Invece di usa la leva: dire "Appare." e adesso la gemma è in cella.\n'
    )
    mondo, log = compila(src)
    _check("mai collocato" not in log,
           "la gemma, introdotta da una conseguenza, non è segnalata orfana")


def test_lint_regola_morta_specifica():
    print("[linter: regola specifica oscurata da una precedente identica]")
    src = (
        "La cella è una stanza.\n"
        "Una porta è una cosa.\nLa porta è in cella.\n"
        'Invece di esamina la porta: dire "Una.".\n'
        'Invece di esamina la porta: dire "Due.".\n'
    )
    mondo, log = compila(src)
    _check(mondo is not None, "compila comunque (warning non bloccante)")
    _check("Regola morta" in log,
           "la seconda regola con la stessa firma è segnalata morta")


def test_lint_regola_condizionale_non_morta():
    print("[linter: una condizionale dopo un'incondizionata NON è morta]")
    src = (
        "La cella è una stanza.\n"
        "Una porta è una cosa.\nLa porta è in cella.\nLa porta è chiusa.\n"
        'Invece di esamina la porta: dire "Base.".\n'
        'Invece di esamina la porta se la porta è chiusa: dire "Cond.".\n'
    )
    mondo, log = compila(src)
    _check("Regola morta" not in log,
           "la condizionale ha comunque la precedenza di fase: non è morta")


def test_lint_regola_globale_morta():
    print("[linter: regola globale oscurata da una globale incondizionata]")
    src = (
        "La cella è una stanza.\n"
        "Il giocatore comincia in cella.\n"
        'Invece di guarda: dire "Primo.".\n'
        'Invece di guarda: dire "Secondo.".\n'
    )
    mondo, log = compila(src)
    _check("Regola morta" in log and "globale" in log,
           "la seconda regola globale sullo stesso verbo è morta")


def test_lint_variabile_inutilizzata():
    print("[linter: stato dichiarato ma mai usato]")
    src = (
        "La cella è una stanza.\n"
        "Il semaforo è uno stato.\nIl semaforo è rosso.\n"
    )
    mondo, log = compila(src)
    _check(mondo is not None, "compila comunque (warning non bloccante)")
    _check("mai usato" in log and "semaforo" in log,
           "lo stato 'semaforo', mai letto, è segnalato inutilizzato")


def test_lint_variabile_usata_in_interpolazione():
    print("[linter: una variabile usata in [var] non è inutilizzata]")
    src = (
        "La cella è una stanza.\n"
        "Il punteggio è un contatore.\n"
        'La descrizione della cella è "Hai [punteggio] punti.".\n'
    )
    mondo, log = compila(src)
    _check("mai usato" not in log,
           "il contatore interpolato in un testo conta come usato")


def test_lint_variabile_usata_in_condizione():
    print("[linter: una variabile usata in una condizione non è inutilizzata]")
    src = (
        "La cella è una stanza.\n"
        "Il punteggio è un contatore.\n"
        "Una leva è una cosa.\nLa leva è in cella.\n"
        'Invece di esamina la leva se il punteggio è almeno 1: dire "Ok.".\n'
    )
    mondo, log = compila(src)
    _check("mai usato" not in log,
           "un contatore confrontato in una condizione conta come usato")


# --- Test: MODULI / IMPORT MULTI-.FAV [Livello 6 / 0.11.2] -------------------
#
# Preprocessore Passata 0: 'Includi "file.fav".' espanso prima delle due passate.
# I test scrivono piccoli progetti multi-file in cartelle temporanee.

def _scrivi_progetto(files: dict) -> str:
    """Scrive i file dati (nome relativo -> contenuto) in una cartella temporanea
    e ne restituisce il percorso. I nomi possono includere sottocartelle."""
    d = tempfile.mkdtemp(prefix="favimp_")
    for nome, contenuto in files.items():
        percorso = os.path.join(d, nome)
        sub = os.path.dirname(percorso)
        if sub and not os.path.isdir(sub):
            os.makedirs(sub, exist_ok=True)
        with open(percorso, "w", encoding="utf-8") as f:
            f.write(contenuto)
    return d


def _compila_path(percorso):
    """Compila il file al percorso dato, catturando lo stdout (log)."""
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        mondo = analizza_file(percorso)
    return mondo, buf.getvalue()


def test_include_basico():
    print("[import: 'Includi' unisce le definizioni di più file]")
    d = _scrivi_progetto({
        "main.fav": ('Includi "stanze.fav".\n'
                     "Una torcia è una cosa.\nLa torcia è nella sala.\n"),
        "stanze.fav": "La sala è una stanza.\n",
    })
    mondo, log = _compila_path(os.path.join(d, "main.fav"))
    _check(mondo is not None, "il progetto multi-file compila")
    _check(mondo and "sala" in mondo.stanze, "la stanza dal file incluso è presente")
    _check(mondo and "torcia" in mondo.oggetti, "l'oggetto del file radice è presente")


def test_include_dedup():
    print("[import: lo stesso file incluso due volte è espanso una sola volta]")
    d = _scrivi_progetto({
        "main.fav": 'Includi "b.fav".\nIncludi "b.fav".\n',
        "b.fav": "La cella è una stanza.\n",
    })
    testo, mappa, err = espandi_inclusioni(os.path.join(d, "main.fav"))
    _check(not err, "nessun errore con doppio include")
    _check(testo.count("La cella è una stanza.") == 1,
           "il contenuto del file incluso due volte appare una sola volta")


def test_include_ciclo():
    print("[import: un ciclo di inclusione è un errore bloccante]")
    d = _scrivi_progetto({
        "main.fav": 'La cella è una stanza.\nIncludi "b.fav".\n',
        "b.fav": 'Includi "main.fav".\n',
    })
    mondo, log = _compila_path(os.path.join(d, "main.fav"))
    _check(mondo is None, "il ciclo blocca la compilazione")
    _check("ciclo" in log.lower(), "il log spiega il ciclo di inclusione")


def test_include_path_relativo():
    print("[import: path relativo in una sottocartella]")
    d = _scrivi_progetto({
        "main.fav": 'Includi "moduli/extra.fav".\n',
        "moduli/extra.fav": "La cripta è una stanza.\n",
    })
    mondo, log = _compila_path(os.path.join(d, "main.fav"))
    _check(mondo is not None and "cripta" in mondo.stanze,
           "il path relativo in sottocartella è risolto e incluso")


def test_include_file_mancante():
    print("[import: un file incluso mancante è bloccante]")
    d = _scrivi_progetto({
        "main.fav": 'La cella è una stanza.\nIncludi "assente.fav".\n',
    })
    mondo, log = _compila_path(os.path.join(d, "main.fav"))
    _check(mondo is None, "un include mancante blocca la compilazione")
    _check("non trovato" in log.lower(), "il log segnala il file incluso mancante")


def test_include_errore_attribuito_al_file():
    print("[import: l'errore nel file incluso è attribuito a quel file (source map)]")
    d = _scrivi_progetto({
        "main.fav": 'La cella è una stanza.\nIncludi "rotto.fav".\n',
        "rotto.fav": "La porta è una banana.\n",   # 'porta' mai dichiarata: errore
    })
    mondo, log = _compila_path(os.path.join(d, "main.fav"))
    _check(mondo is None, "l'errore nel file incluso blocca la compilazione")
    _check("rotto.fav" in log,
           "l'errore è attribuito al file incluso 'rotto.fav' via source map")


# --- Test: SPEC EBNF FORMALE VERSIONATA [Livello 6 / 0.11.3] -----------------
#
# Guardia anti-drift: la specifica tecnica documentazione/grammatica-<ver>.md
# deve restare allineata ai NOMI DI REGOLA della grammatica reale. Se si aggiunge
# o rinomina una regola def_/cond_/cons_ senza aggiornare la spec, questo test
# fallisce.

_SPEC_EBNF = os.path.join(os.path.dirname(__file__), "documentazione",
                          "grammatica-0.33.0.md")


def _nomi_regole_grammatica():
    """Estrae dai nomi di regola/azione del template di grammatica quelli
    «autore-facing» (def_*, cond_*, cons_*)."""
    nomi = set()
    for m in re.finditer(r"(?m)^\s*\??([A-Za-z_]\w*)(?:\.-?\d+)?:", _GRAMMAR_TEMPLATE):
        nomi.add(m.group(1))
    for m in re.finditer(r"->\s*(\w+)", _GRAMMAR_TEMPLATE):
        nomi.add(m.group(1))
    return {n for n in nomi if n.startswith(("def_", "cond_", "cons_"))}


def test_spec_ebnf_esiste():
    print("[spec EBNF: il documento tecnico versionato esiste]")
    _check(os.path.exists(_SPEC_EBNF),
           "documentazione/grammatica-0.33.0.md è presente")


def _blocchi_ebnf_della_spec(spec: str) -> str:
    """[0.27.0 / G] Estrae e concatena SOLO i blocchi ```ebnf della spec. Così
    l'anti-drift verifica che una regola sia DEFINITA nel listato grammaticale, non
    soltanto menzionata in una nota in prosa (match per sottostringa sull'intero
    file = troppo debole)."""
    return "\n".join(re.findall(r"```ebnf\n(.*?)```", spec, re.DOTALL))


def test_spec_ebnf_allineata_alla_grammatica():
    print("[spec EBNF: definisce tutte le regole def_/cond_/cons_ della grammatica]")
    if not os.path.exists(_SPEC_EBNF):
        _check(False, "spec EBNF mancante")
        return
    with open(_SPEC_EBNF, "r", encoding="utf-8") as f:
        spec = f.read()
    ebnf = _blocchi_ebnf_della_spec(spec)
    _check(bool(ebnf.strip()), "la spec contiene almeno un blocco ```ebnf")
    # Nomi DEFINITI nei blocchi EBNF: 'nome:' / 'nome.prio:' (anche con '?') oppure '-> nome'.
    definiti = set(re.findall(r"(?m)^\s*\??([A-Za-z_]\w*)(?:\.-?\d+)?:", ebnf))
    definiti |= set(re.findall(r"->\s*(\w+)", ebnf))
    nomi = _nomi_regole_grammatica()
    mancanti = sorted(n for n in nomi if n not in definiti)
    _check(not mancanti,
           f"ogni regola def_/cond_/cons_ è DEFINITA nei blocchi ebnf (mancanti: {mancanti})")


def test_spec_ebnf_documenta_terminali_chiusi():
    print("[spec EBNF: documenta i terminali chiusi generati per-file]")
    if not os.path.exists(_SPEC_EBNF):
        _check(False, "spec EBNF mancante")
        return
    with open(_SPEC_EBNF, "r", encoding="utf-8") as f:
        spec = f.read()
    for term in ("ENTITA", "VARIABILE", "DIREZIONE", "PROPRIETA", "TESTO_QUOTATO"):
        _check(term in spec, f"la spec documenta il terminale {term}")


# --- Test: capacità di trasporto [Livello 7] --------------------------------

def test_capacita_dichiarazione():
    print("[capacità: dichiarazione base e bonus oggetto]")
    src = (
        "L'atrio è una stanza.\n"
        "Il giocatore può portare 5 oggetti.\n"
        "Uno zaino è una cosa.\nLo zaino è in atrio.\n"
        "Lo zaino dà 15 spazi.\n"
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "il sorgente con capacità compila")
    _check(mondo and mondo.capacita_base == 5, "la capacità base è 5")
    _check(mondo and mondo.trova_oggetto("zaino").bonus_capacita == 15,
           "lo zaino dà 15 spazi di bonus")


def test_capacita_blocca_oltre_limite():
    print("[capacità: l'inventario non supera il limite dichiarato]")
    src = (
        "L'atrio è una stanza.\nIl giocatore comincia in atrio.\n"
        "Il giocatore può portare 1 oggetti.\n"
        "Una mela è una cosa.\nLa mela è in atrio.\nLa mela è prendibile.\n"
        "Una pera è una cosa.\nLa pera è in atrio.\nLa pera è prendibile.\n"
    )
    mondo = runtime(src)
    esegui(mondo, "prendi mela")
    out = esegui(mondo, "prendi pera")
    _check("piene" in out.lower(), "il secondo oggetto è rifiutato (inventario pieno)")
    _check("pera" not in mondo.inventario, "la pera non è entrata nell'inventario")
    _check("mela" in mondo.inventario, "la mela è rimasta")


def test_capacita_bonus_additivo():
    print("[capacità: un oggetto-bonus alza il limite (additivo)]")
    src = (
        "L'atrio è una stanza.\nIl giocatore comincia in atrio.\n"
        "Il giocatore può portare 1 oggetti.\n"
        "Uno zaino è una cosa.\nLo zaino è in atrio.\nLo zaino è prendibile.\n"
        "Lo zaino dà 2 spazi.\n"
        "Una mela è una cosa.\nLa mela è in atrio.\nLa mela è prendibile.\n"
        "Una pera è una cosa.\nLa pera è in atrio.\nLa pera è prendibile.\n"
    )
    mondo = runtime(src)
    _check(mondo.capacita_attuale() == 1, "capacità iniziale = 1 (base)")
    esegui(mondo, "prendi zaino")
    _check(mondo.capacita_attuale() == 3, "con lo zaino la capacità diventa 3 (1+2)")
    esegui(mondo, "prendi mela")
    esegui(mondo, "prendi pera")
    _check("pera" in mondo.inventario, "con lo zaino si porta anche la pera (3/3)")


def test_capacita_illimitata_default():
    print("[capacità: senza dichiarazione l'inventario è illimitato]")
    src = (
        "L'atrio è una stanza.\nIl giocatore comincia in atrio.\n"
        "Una mela è una cosa.\nLa mela è in atrio.\nLa mela è prendibile.\n"
        "Una pera è una cosa.\nLa pera è in atrio.\nLa pera è prendibile.\n"
        "Una noce è una cosa.\nLa noce è in atrio.\nLa noce è prendibile.\n"
    )
    mondo = runtime(src)
    _check(mondo.capacita_attuale() is None, "nessuna capacita' dichiarata: illimitata")
    for n in ("mela", "pera", "noce"):
        esegui(mondo, f"prendi {n}")
    _check(len(mondo.inventario) == 3, "si possono prendere tutti gli oggetti")


def test_capacita_zero():
    print("[capacità: con capacità 0 non si prende nulla]")
    src = (
        "L'atrio è una stanza.\nIl giocatore comincia in atrio.\n"
        "Il giocatore può portare 0 oggetti.\n"
        "Una mela è una cosa.\nLa mela è in atrio.\nLa mela è prendibile.\n"
    )
    mondo = runtime(src)
    _check(mondo.capacita_base == 0, "capacità base 0 accettata")
    esegui(mondo, "prendi mela")
    _check("mela" not in mondo.inventario, "con capacità 0 non si prende nulla")


# --- Test: regole a DUE OGGETTI che valutano la clausola 'se' [0.18.0 / A1] --

def _MONDO_DUE_OGGETTI(extra_regole):
    return (
        "La sala è una stanza.\n"
        "La chiave è una cosa.\nLa chiave è prendibile.\nLa chiave è in sala.\n"
        "La porta è una cosa.\nLa porta è chiusa.\nLa porta è in sala.\n"
        "Il giocatore comincia in sala.\n"
        + extra_regole
    )


def test_due_oggetti_se_condizionale_vince_sulla_semplice():
    print("[2 oggetti: la regola condizionale soddisfatta vince sulla semplice]")
    src = _MONDO_DUE_OGGETTI(
        'Invece di usa la chiave su la porta se la porta è chiusa: '
        'dire "La apri." e adesso la porta è aperta.\n'
        'Invece di usa la chiave su la porta: dire "Era già aperta.".\n'
    )
    mondo = runtime(src)
    esegui(mondo, "prendi chiave")
    out1 = esegui(mondo, "usa chiave su porta")  # porta chiusa -> condizionale
    _check("La apri." in out1, "1ª volta (porta chiusa): scatta la regola condizionale")
    _check("aperta" in mondo.trova_oggetto("porta").proprieta,
           "la conseguenza ha aperto la porta")
    out2 = esegui(mondo, "usa chiave su porta")  # porta aperta -> 'se' falso -> semplice
    _check("Era già aperta." in out2,
           "2ª volta (condizione falsa): scatta la regola semplice, NON più la condizionale")


def test_due_oggetti_se_falso_senza_fallback_cade_su_default():
    print("[2 oggetti: 'se' falso e nessuna regola semplice -> azione di default]")
    src = _MONDO_DUE_OGGETTI(
        'Invece di usa la chiave su la porta se la porta è aperta: '
        'dire "Solo se aperta.".\n'
    )
    mondo = runtime(src)
    esegui(mondo, "prendi chiave")
    out = esegui(mondo, "usa chiave su porta")  # porta chiusa -> 'se' falso
    _check("Solo se aperta." not in out,
           "con la condizione falsa la regola condizionale NON scatta")


def test_due_oggetti_prep_tollerante_resta_attiva():
    print("[2 oggetti: il fallback prep-tollerante continua a funzionare]")
    src = _MONDO_DUE_OGGETTI(
        'Invece di usa la chiave su la porta: dire "Combaciano.".\n'
    )
    mondo = runtime(src)
    esegui(mondo, "prendi chiave")
    # Il giocatore usa 'con' invece di 'su': stessi due oggetti -> match tollerante.
    out = esegui(mondo, "usa chiave con porta")
    _check("Combaciano." in out,
           "preposizione diversa ma stessi due oggetti: la regola scatta lo stesso")


# --- Test: genitivo 'dei' nelle descrizioni [0.18.0 / A2] -------------------

def test_descrizione_genitivo_dei():
    print("[descrizione: il genitivo plurale maschile 'dei' è accettato]")
    src = (
        "La cripta è una stanza.\n"
        "I pilastri è una cosa.\n"
        'La descrizione dei pilastri è "Antiche colonne scanalate.".\n'
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "'La descrizione dei pilastri…' compila")
    ogg = mondo.trova_oggetto("pilastri") if mondo else None
    _check(ogg is not None and ogg.descrizione == "Antiche colonne scanalate.",
           "la descrizione è associata all'oggetto plurale maschile")


def test_descrizione_genitivi_singolari_restano_validi():
    print("[descrizione: i genitivi singolari/plurali esistenti restano validi]")
    src = (
        "La stiva è una stanza.\n"
        "Lo specchio è una cosa.\n"
        "Le chiavi è una cosa.\n"
        'La descrizione dello specchio è "Opaco.".\n'
        'La descrizione delle chiavi è "Arrugginite.".\n'
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "'dello' e 'delle' continuano a compilare")
    _check(mondo and mondo.trova_oggetto("specchio").descrizione == "Opaco.",
           "'dello specchio' risolve l'oggetto")
    _check(mondo and mondo.trova_oggetto("chiavi").descrizione == "Arrugginite.",
           "'delle chiavi' risolve l'oggetto")


# --- Test: copula plurale 'sono' [0.18.0 / A5] ------------------------------

def test_copula_sono_dichiarazioni():
    print("[copula 'sono': dichiarazioni di entità plurali]")
    src = (
        "Il corridoio è una stanza.\n"
        "Le tacche sono una cosa.\n"
        "I pilastri sono una cosa.\n"
        "Gli scaffali sono un supporto.\n"
        "Le casse sono un contenitore.\n"
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "le dichiarazioni con 'sono' compilano")
    _check(mondo and mondo.trova_oggetto("tacche") is not None, "'Le tacche sono una cosa' crea l'oggetto")
    _check(mondo and mondo.trova_oggetto("pilastri") is not None, "'I pilastri sono una cosa' crea l'oggetto")
    _check(mondo and mondo.trova_oggetto("scaffali") and mondo.trova_oggetto("scaffali").is_supporto,
           "'Gli scaffali sono un supporto' è un supporto")
    _check(mondo and mondo.trova_oggetto("casse") and mondo.trova_oggetto("casse").is_contenitore,
           "'Le casse sono un contenitore' è un contenitore")


def test_copula_sono_proprieta_posizione():
    print("[copula 'sono': proprietà e posizione di entità plurali]")
    src = (
        "Il corridoio è una stanza.\n"
        "Le tacche sono una cosa.\n"
        "Le tacche sono nel corridoio.\n"
        "Le tacche sono vergini.\n"
    )
    mondo, _ = compila(src)
    tacche = mondo.trova_oggetto("tacche") if mondo else None
    _check(tacche is not None and tacche.posizione == "corridoio",
           "'Le tacche sono nel corridoio' colloca l'oggetto")
    _check(tacche is not None and "vergini" in tacche.proprieta,
           "'Le tacche sono vergini' assegna la proprietà")


def test_copula_sono_condizioni_e_conseguenze():
    print("[copula 'sono': condizioni e conseguenze su entità plurali]")
    src = (
        "Il corridoio è una stanza.\nIl giocatore comincia in corridoio.\n"
        "Le tacche sono una cosa.\nLe tacche sono nel corridoio.\n"
        "Vergini e segnate sono opposte.\nLe tacche sono vergini.\n"
        'Invece di esamina le tacche se le tacche sono vergini: '
        'dire "Le marchi." e adesso le tacche sono segnate.\n'
        'Invece di esamina le tacche se le tacche non sono vergini: dire "Già marchiate.".\n'
    )
    mondo = runtime(src)
    out1 = esegui(mondo, "esamina tacche")
    _check("Le marchi." in out1, "la condizione 'sono vergini' è valutata e scatta")
    _check("segnate" in mondo.trova_oggetto("tacche").proprieta,
           "la conseguenza 'sono segnate' ha aggiornato lo stato")
    out2 = esegui(mondo, "esamina tacche")
    _check("Già marchiate." in out2,
           "la negazione 'non sono vergini' è valutata correttamente al 2° giro")


def test_copula_e_ancora_valida():
    print("[copula: 'è' singolare continua a funzionare (retro-compat)]")
    src = (
        "La cella è una stanza.\n"
        "La porta è una cosa.\nLa porta è chiusa.\nLa porta è in cella.\n"
    )
    mondo, _ = compila(src)
    porta = mondo.trova_oggetto("porta") if mondo else None
    _check(porta is not None and "chiusa" in porta.proprieta and porta.posizione == "cella",
           "le dichiarazioni singolari con 'è' restano invariate")


# --- Test: [0.27.0 / A] copula plurale su STATI e CONTATORI -----------------
# Revisione totale 2026-06-14: prima 'Le vite sono un contatore.' veniva rifiutato
# (lo scanner e la grammatica accettavano solo 'è'), pur essendo i nomi di
# contatore/stato spesso plurali ('le vite', 'i punti', 'le munizioni').

def test_copula_sono_stato_e_contatore():
    print("[copula 'sono': stati e contatori con nome plurale]")
    src = (
        "La cella è una stanza.\nIl giocatore comincia in cella.\n"
        "Le luci sono uno stato.\nLe luci sono accese.\n"
        "Le vite sono un contatore.\n"
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "le dichiarazioni plurali di stato/contatore compilano")
    _check(mondo and mondo.variabili.get("luci") == "accese",
           "'Le luci sono uno stato' + 'Le luci sono accese' assegna il valore")
    _check(mondo and "vite" in mondo.variabili and mondo.variabili["vite"] == 0,
           "'Le vite sono un contatore' crea il contatore a 0")


def test_copula_partono_da_contatore_plurale():
    print("[copula 'partono': valore iniziale di un contatore plurale]")
    src = (
        "La cella è una stanza.\nIl giocatore comincia in cella.\n"
        "Le vite sono un contatore.\nLe vite partono da 3.\n"
        'Invece di guarda se le vite è almeno 3: dire "Vivo.".\n'
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "'Le vite partono da 3' compila")
    _check(mondo and mondo.variabili.get("vite") == 3,
           "il contatore plurale parte dal valore dichiarato")
    # E 'parte' singolare resta valido (retro-compat).
    mondo2, _ = compila(
        "La cella è una stanza.\nLa forza è un contatore.\nLa forza parte da 5.\n")
    _check(mondo2 and mondo2.variabili.get("forza") == 5,
           "'parte da' singolare continua a funzionare")


# --- Test: [0.27.0 / B] accesa<->spenta opposte di default -------------------
# Revisione totale 2026-06-14: il motore tratta già accesa/spenta come coppia per
# la luce (c_e_luce), ma senza la coppia precaricata 'e adesso X è spenta' lasciava
# l'oggetto sia 'accesa' sia 'spenta' (condizione 'è accesa' restava vera).

def test_accesa_spenta_opposte_di_default():
    print("[opposti: accesa<->spenta esclusive senza dichiarazione esplicita]")
    src = (
        "L'atrio è una stanza.\nIl giocatore comincia nell'atrio.\n"
        "La torcia è una cosa.\nLa torcia è nell'atrio.\nLa torcia è accesa.\n"
        '"spegni" è un comando.\n'
        'Invece di spegni la torcia: dire "Spenta." e adesso la torcia è spenta.\n'
    )
    mondo = runtime(src)
    esegui(mondo, "spegni la torcia")
    prop = mondo.trova_oggetto("torcia").proprieta
    _check("spenta" in prop, "dopo 'spenta' l'oggetto è spento")
    _check("accesa" not in prop,
           "'accesa' è stata rimossa (le due si escludono senza dichiararle)")


# --- Test: [0.27.0 / C] 'lascia' bloccato al buio ---------------------------
# Revisione totale 2026-06-14: al buio prendi/metti/esamina erano bloccati ma
# 'lascia' sfuggiva (asimmetria tra canali).

def test_lascia_bloccato_al_buio():
    print("[buio: 'lascia' è bloccato come prendi/metti/esamina]")
    src = (
        "La cantina è una stanza.\nLa cantina è buia.\n"
        "La moneta è una cosa.\nIl giocatore comincia nella cantina.\n"
        "Il giocatore ha la moneta.\n"
    )
    mondo = runtime(src)
    out = esegui(mondo, "lascia la moneta")
    _check("buio" in out.lower(), "al buio 'lascia' avvisa che non ci si vede")
    _check("moneta" in mondo.inventario,
           "al buio l'oggetto NON viene lasciato (resta in inventario)")


# --- Test: [0.27.0 / M4] iniziale maiuscola senza rovinare i nomi propri -----
# Revisione totale 2026-06-14: str.capitalize() minuscolava il resto del nome
# ('La Guardia Reale' -> 'La guardia reale'). prima_maiuscola() preserva l'interno.

def test_prima_maiuscola_preserva_nomi_propri():
    print("[concordanza: prima_maiuscola preserva le maiuscole interne]")
    from utils import prima_maiuscola
    _check(prima_maiuscola("la Guardia Reale") == "La Guardia Reale",
           "maiuscola solo sull'iniziale, resto preservato")
    _check(prima_maiuscola("") == "", "stringa vuota gestita")
    # Annuncio di movimento NPC: il nome composto non viene storpiato.
    src = (
        "L'atrio è una stanza.\nIl corridoio è una stanza.\n"
        "L'atrio collega nord a corridoio.\n"
        "La Guardia Reale è un personaggio.\nLa Guardia Reale è nell'atrio.\n"
        'Il dialogo di Guardia Reale comincia con "x".\n'
        'La Guardia Reale al nodo "x" dice "...".\n'
        "Il giocatore comincia nell'atrio.\n"
        "Ogni 1 turno: la Guardia Reale va nel corridoio.\n"
    )
    mondo = runtime(src)
    out = esegui(mondo, "esamina atrio")
    _check("Guardia Reale" in out,
           "l'annuncio mantiene 'Guardia Reale' (non 'guardia reale')")


# --- Test: [0.27.0 / D] aggettivi-proprietà che iniziano con una preposizione -
# Revisione totale 2026-06-14: 'La lapide è incisa.' veniva rifiutato perché il
# lexer staccava 'in' (PREP_LUOGO) da 'incisa'. Ora PREP_LUOGO ha un confine destro.

def test_proprieta_con_prefisso_preposizione():
    print("[lexer: proprietà che iniziano con 'in'/'sul'/... sono accettate]")
    base = "L'atrio è una stanza.\nIl giocatore comincia nell'atrio.\n"
    for adj in ("incisa", "insanguinata", "informe", "sulfurea"):
        mondo, _ = compila(
            base + f"La lapide è una cosa.\nLa lapide è nell'atrio.\nLa lapide è {adj}.\n")
        ok = mondo is not None and adj in mondo.trova_oggetto("lapide").proprieta
        _check(ok, f"'La lapide è {adj}.' compila e assegna la proprietà")
    # La posizione (PREP_LUOGO vero) NON deve regredire.
    m1, _ = compila("La cella è una stanza.\nLa gemma è una cosa.\nLa gemma è in cella.\n")
    _check(m1 and m1.trova_oggetto("gemma").posizione == "cella",
           "'è in cella' resta una posizione (non una proprietà 'in')")
    m2, _ = compila("L'atrio è una stanza.\nLa gemma è una cosa.\nLa gemma è nell'atrio.\n")
    _check(m2 and m2.trova_oggetto("gemma").posizione == "atrio",
           "la forma con apostrofo \"nell'atrio\" resta una posizione")
    m3, _ = compila(
        "L'atrio è una stanza.\nLa mensola è un supporto.\nLa mensola è nell'atrio.\n"
        "La gemma è una cosa.\nLa gemma è sulla mensola.\n")
    _check(m3 and m3.trova_oggetto("gemma").posizione == "mensola",
           "'sulla mensola' resta una posizione")
    # Le forme articolate complete (nello/nei/sullo) devono restare valide: col
    # confine destro 'nel' non si scompone più in 'nel'+'lo' (regressione vista
    # nella demo «Il Relitto»: 'è nello scriptorium').
    m5, _ = compila(
        "Lo scriptorium è una stanza.\nIl globo è una cosa.\nIl globo è nello scriptorium.\n")
    _check(m5 and m5.trova_oggetto("globo").posizione == "scriptorium",
           "'è nello scriptorium' resta una posizione (forma articolata 'nello')")
    m6, _ = compila(
        "Lo studio è una stanza.\nLo scaffale è un supporto.\nLo scaffale è nello studio.\n"
        "Il tomo è una cosa.\nIl tomo è sullo scaffale.\n")
    _check(m6 and m6.trova_oggetto("tomo").posizione == "scaffale",
           "'sullo scaffale' resta una posizione (forma articolata 'sullo')")
    # La proprietà deve funzionare anche in condizione e conseguenza.
    m4 = runtime(
        "La cella è una stanza.\nIl giocatore comincia in cella.\n"
        "La lapide è una cosa.\nLa lapide è in cella.\nLa lapide è incisa.\n"
        'Invece di esamina la lapide se la lapide è incisa: dire "Rune.".\n')
    _check("Rune." in esegui(m4, "esamina lapide"),
           "la condizione 'se la lapide è incisa' è valutata correttamente")


# --- Test: [0.27.0 / E] turno ATOMICO su eccezione in una conseguenza --------
# Revisione totale 2026-06-14: prima un'eccezione a metà di una conseguenza veniva
# inghiottita e il turno avanzava su uno stato mutato a metà (snapshot ANNULLA
# incluso). Ora elabora_comando ripristina l'istantanea pre-turno e il turno è no-op.

def test_turno_atomico_su_eccezione():
    print("[robustezza: un'eccezione in una conseguenza rende il turno atomico]")
    import strutture as _s
    m = runtime(
        "L'atrio è una stanza.\nIl punteggio è un contatore.\n"
        "La leva è una cosa.\nLa leva è nell'atrio.\nIl giocatore comincia nell'atrio.\n"
        'Invece di esamina la leva: dire "Click." e adesso aumenta il punteggio.\n')
    turno0 = m.turno_corrente
    orig = _s.ConseguenzaContatore.esegui

    def _boom(self, mondo):
        mondo.variabili["punteggio"] = 999   # mutazione PARZIALE prima dell'errore
        raise RuntimeError("boom di test")

    _s.ConseguenzaContatore.esegui = _boom
    try:
        out = esegui(m, "esamina leva")
    finally:
        _s.ConseguenzaContatore.esegui = orig
    _check("ERRORE CRITICO" in out, "l'errore è segnalato e il gioco non crasha")
    _check(m.variabili["punteggio"] == 0,
           "la mutazione parziale (999) è annullata: rollback all'istantanea pre-turno")
    _check(m.turno_corrente == turno0, "il turno NON avanza (no-op atomico)")
    _check(len(m._storia_stati) == 0,
           "nessuna istantanea ANNULLA accodata per un turno fallito")


# --- Test: [0.27.0 / D-dialogo] una conversazione è un solo passo di ANNULLA --
# Revisione totale 2026-06-14: prima le conseguenze 'e adesso …' nelle opzioni di
# dialogo mutavano il mondo senza essere annullabili (l'ingresso scartava lo snap).

def test_dialogo_annullabile_come_unita():
    print("[ANNULLA: l'intera conversazione si annulla in un colpo]")
    src = (
        "L'atrio è una stanza.\nIl punteggio è un contatore.\n"
        "Il mercante è un personaggio.\nIl mercante è nell'atrio.\n"
        "Il giocatore comincia nell'atrio.\n"
        'Il dialogo del mercante comincia con "saluto".\n'
        'Il mercante al nodo "saluto" dice "Hai [punteggio] punti.".\n'
        'Al nodo "saluto" l\'opzione "Punti" conduce al nodo "saluto" e adesso aumenta il punteggio di 5.\n'
        'Al nodo "saluto" l\'opzione "Addio" chiude il dialogo.\n'
    )
    m = runtime(src)
    esegui(m, "parla con mercante")
    _check(m.in_dialogo() and m._snap_dialogo is not None,
           "all'ingresso l'istantanea pre-dialogo è messa da parte")
    esegui(m, "1")  # +5
    esegui(m, "1")  # +5 -> 10
    _check(m.variabili["punteggio"] == 10, "le scelte mutano il mondo (10 punti)")
    _check(len(m._storia_stati) == 0,
           "durante la conversazione non si accodano passi di ANNULLA")
    esegui(m, "addio")
    _check(not m.in_dialogo() and len(m._storia_stati) == 1,
           "all'uscita si registra UN solo passo di ANNULLA per tutta la conversazione")
    esegui(m, "annulla")
    _check(m.variabili["punteggio"] == 0 and m.turno_corrente == 0,
           "un solo ANNULLA riporta a prima di 'parla con …' (punteggio 0)")


# --- Test: normalizzazione NFC degli accenti nei nomi [0.18.0 / A3] ---------

def test_accenti_nfc_normalizzazione_nome():
    print("[accenti: normalizza_nome unifica NFC/NFD allo stesso id]")
    import unicodedata
    from utils import normalizza_nome
    nfc = unicodedata.normalize("NFC", "Il comò")
    nfd = unicodedata.normalize("NFD", "Il comò")
    _check(nfc != nfd, "le due forme Unicode sono diverse byte-per-byte (precondizione)")
    _check(normalizza_nome(nfc) == normalizza_nome(nfd) == "comò",
           "NFC e NFD si normalizzano allo stesso id 'comò'")


def test_accenti_risoluzione_runtime_nfd():
    print("[accenti: il giocatore risolve un oggetto accentato anche in forma NFD]")
    import unicodedata
    from gioco import risolvi_nome_oggetto
    src = (
        "La cabina è una stanza.\n"
        "Il comò è una cosa.\nIl comò è nella cabina.\n"
        "Il giocatore comincia nella cabina.\n"
    )
    mondo = runtime(src)
    _check(mondo is not None and mondo.trova_oggetto("comò") is not None,
           "l'oggetto accentato 'comò' è dichiarato")
    nfd = unicodedata.normalize("NFD", "comò")
    nfc = unicodedata.normalize("NFC", "comò")
    _check(risolvi_nome_oggetto(mondo, nfc) == "comò",
           "input precomposto (NFC) risolve l'oggetto")
    _check(risolvi_nome_oggetto(mondo, nfd) == "comò",
           "input decomposto (NFD) risolve lo STESSO oggetto (prima falliva)")


def test_accenti_sorgente_nfd_compila():
    print("[accenti: un sorgente scritto in NFD compila e risolve come NFC]")
    import unicodedata
    src_nfd = unicodedata.normalize("NFD",
        "La cabina è una stanza.\n"
        "La caffettiera è una cosa.\n"
        'La descrizione della caffettiera è "Annerita dall\'uso.".\n'
    )
    mondo, _ = compila(src_nfd)
    _check(mondo is not None, "il sorgente in forma decomposta compila")
    _check(mondo and mondo.trova_oggetto("caffettiera") is not None,
           "l'entità è registrata con id NFC indipendentemente dalla forma sorgente")


# --- Test: preposizioni d'azione articolate [0.18.0 / A4] -------------------

def test_prep_azione_articolata_compila():
    print("[prep. azione: 'usa X sul Y' e 'usa X nella Y' compilano]")
    src = (
        "La sala è una stanza.\n"
        "La batteria è una cosa.\nLa batteria è in sala.\n"
        "Il pannello è una cosa.\nIl pannello è in sala.\n"
        "La gemma è una cosa.\nLa gemma è in sala.\n"
        "La teca è una cosa.\nLa teca è in sala.\n"
        'Invece di usa la batteria sul pannello: dire "Inserita.".\n'
        'Invece di usa la gemma nella teca: dire "Incastonata.".\n'
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "le regole con preposizione articolata compilano")
    _check(mondo and len(mondo.regole) == 2, "entrambe le regole a due oggetti sono registrate")
    _check(mondo and mondo.regole[0].preposizione == "sul",
           "la preposizione articolata 'sul' è conservata sulla regola")


def test_prep_azione_articolata_runtime():
    print("[prep. azione: il giocatore digita 'usa X sul Y' e la regola scatta]")
    src = (
        "La sala è una stanza.\nIl giocatore comincia in sala.\n"
        "La batteria è una cosa.\nLa batteria è prendibile.\nLa batteria è in sala.\n"
        "Il pannello è una cosa.\nIl pannello è in sala.\n"
        'Invece di usa la batteria sul pannello: dire "Il pannello si accende." e adesso la batteria è nel nulla.\n'
    )
    mondo = runtime(src)
    esegui(mondo, "prendi batteria")
    out = esegui(mondo, "usa batteria sul pannello")
    _check("Il pannello si accende." in out,
           "il comando con preposizione articolata 'sul' attiva la regola")


def test_prep_azione_semplice_resta_valida():
    print("[prep. azione: le forme semplici su/in restano valide (retro-compat)]")
    src = (
        "La sala è una stanza.\nIl giocatore comincia in sala.\n"
        "La chiave è una cosa.\nLa chiave è prendibile.\nLa chiave è in sala.\n"
        "La porta è una cosa.\nLa porta è in sala.\n"
        'Invece di usa la chiave su la porta: dire "Click.".\n'
    )
    mondo = runtime(src)
    esegui(mondo, "prendi chiave")
    out = esegui(mondo, "usa chiave su porta")
    _check("Click." in out, "la forma semplice 'su' continua a funzionare")


# --- Test: nuovi costrutti di design [0.18.0 / B1-B7] -----------------------

def test_contatore_al_massimo_lte():
    print("[B4: confronto '<=' — 'al massimo N']")
    src = (
        "La cella è una stanza.\nIl giocatore comincia in cella.\n"
        "La forza è un contatore.\nLa forza parte da 2.\n"
        'Invece di guarda se la forza è al massimo 2: dire "Debole.".\n'
    )
    mondo = runtime(src)
    cond = mondo.regole[0].condizione
    _check(cond.operatore == "<=" and cond.valuta(mondo) is True, "2 <= 2 è vero")
    _check("Debole." in esegui(mondo, "guarda"), "la regola con '<=' scatta a parità")
    src2 = src.replace("parte da 2", "parte da 5")
    mondo2 = runtime(src2)
    _check(mondo2.regole[0].condizione.valuta(mondo2) is False, "5 <= 2 è falso")


def test_contatore_diverso_neq():
    print("[B5: disuguaglianza numerica '!=' — 'non è N']")
    src = (
        "La cella è una stanza.\nIl giocatore comincia in cella.\n"
        "La forza è un contatore.\nLa forza parte da 3.\n"
        'Invece di guarda se la forza non è 0: dire "Hai forza.".\n'
    )
    mondo = runtime(src)
    cond = mondo.regole[0].condizione
    _check(type(cond).__name__ == "CondizioneNot", "'non è N' è una negazione")
    _check(type(cond.condizione).__name__ == "CondizioneContatore",
           "negazione di un confronto NUMERICO (non di uno stato)")
    _check("Hai forza." in esegui(mondo, "guarda"), "3 != 0 -> la regola scatta")
    src0 = src.replace("La forza parte da 3.\n", "")
    mondo0 = runtime(src0)
    _check(mondo0.regole[0].condizione.valuta(mondo0) is False,
           "0 != 0 è falso (il contatore di default vale 0)")


def test_non_gruppo_b7():
    print("[B7: negazione di un gruppo booleano 'non ( A e B )']")
    src = (
        "La cella è una stanza.\nIl giocatore comincia in cella.\n"
        "La chiave è una cosa.\nLa chiave è in cella.\n"
        "La torcia è una cosa.\nLa torcia è spenta.\nLa torcia è in cella.\n"
        'Invece di guarda se non ( il giocatore ha la chiave e la torcia è accesa ): '
        'dire "Ti manca qualcosa.".\n'
    )
    mondo = runtime(src)
    cond = mondo.regole[0].condizione
    _check(type(cond).__name__ == "CondizioneNot", "'non ( … )' produce una negazione")
    _check(cond.valuta(mondo) is True,
           "il gruppo (ha chiave AND torcia accesa) è falso -> la sua negazione è vera")
    _check("Ti manca qualcosa." in esegui(mondo, "guarda"), "la regola scatta")


def test_posizione_giocatore_b1():
    print("[B1: condizione 'se il giocatore è in [stanza]' + negazione]")
    src = (
        "L'atrio è una stanza.\nLa cripta è una stanza.\n"
        "L'atrio collega nord a cripta.\n"
        "Il giocatore comincia in atrio.\n"
        'Invece di guarda se il giocatore è in atrio: dire "Sei nell\'atrio.".\n'
        'Invece di guarda se il giocatore non è in atrio: dire "Hai lasciato l\'atrio.".\n'
    )
    mondo = runtime(src)
    _check("Sei nell'atrio." in esegui(mondo, "guarda"),
           "all'avvio (in atrio) la condizione di posizione è vera")
    esegui(mondo, "nord")  # ora in cripta
    _check(mondo.posizione_giocatore == "cripta", "il giocatore si è spostato in cripta")
    out_cripta = esegui(mondo, "guarda")
    _check("Sei nell'atrio." not in out_cripta,
           "fuori dall'atrio la condizione 'è in atrio' è falsa")
    _check("Hai lasciato l'atrio." in out_cripta,
           "la negazione 'non è in atrio' è vera in cripta")


def test_teletrasporto_giocatore_b2():
    print("[B2: conseguenza 'e adesso il giocatore è in [stanza]' (teletrasporto)]")
    src = (
        "L'altare è una stanza.\nIl vuoto è una stanza.\n"
        "Il giocatore comincia in altare.\n"
        "Il portale è una cosa.\nIl portale è in altare.\n"
        'Invece di usa il portale: dire "Vieni risucchiato." e adesso il giocatore è nel vuoto.\n'
    )
    mondo = runtime(src)
    out = esegui(mondo, "usa portale")
    _check(mondo.posizione_giocatore == "vuoto", "il teletrasporto ha spostato il giocatore")
    _check("Vieni risucchiato." in out, "il testo della regola è stampato")
    _check("--- Il vuoto ---" in out or "vuoto" in out.lower(),
           "dopo il teletrasporto è mostrata la nuova stanza")


def test_teletrasporto_stanza_inesistente_errore():
    print("[B2: il teletrasporto verso una stanza inesistente è un errore]")
    src = (
        "L'altare è una stanza.\nIl giocatore comincia in altare.\n"
        "Il portale è una cosa.\nIl portale è in altare.\n"
        'Invece di usa il portale: dire "Vai." e adesso il giocatore è nel limbo.\n'
    )
    mondo, log = compila(src)
    _check(mondo is None, "una destinazione di teletrasporto inesistente blocca la compilazione")


def test_esito_personalizzato_b3():
    print("[B3: testo d'esito personalizzato per vinci/perdi/termina]")
    src = (
        "La cella è una stanza.\nIl giocatore comincia in cella.\n"
        "Il bottone è una cosa.\nIl bottone è in cella.\n"
        'Invece di usa il bottone: dire "Premi." e adesso vinci "FUGA RIUSCITA: sei libero!".\n'
    )
    mondo = runtime(src)
    out = esegui(mondo, "usa bottone")
    _check("FUGA RIUSCITA: sei libero!" in out, "stampa il messaggio d'esito personalizzato")
    _check("HAI VINTO" not in out, "il banner fisso è sostituito dal testo d'autore")
    _check(mondo.stato_partita == "vinta", "lo stato della partita è comunque 'vinta'")


def test_esito_default_resta_senza_testo():
    print("[B3: senza testo, l'esito mostra ancora il banner di default]")
    src = (
        "La cella è una stanza.\nIl giocatore comincia in cella.\n"
        "La trappola è una cosa.\nLa trappola è in cella.\n"
        'Invece di usa la trappola: dire "Scatta!" e adesso perdi.\n'
    )
    mondo = runtime(src)
    out = esegui(mondo, "usa trappola")
    _check("HAI PERSO" in out, "senza testo personalizzato resta il banner di default")


# --- Test: verbi personalizzati multi-parola [0.18.0 / B6] ------------------

def test_verbo_multiparola_dichiarazione_e_regola():
    print("[B6: '\"fai scattare\" è un comando.' è accettato e usabile in una regola]")
    src = (
        "La cripta è una stanza.\nIl giocatore comincia in cripta.\n"
        "La leva è una cosa.\nLa leva è in cripta.\n"
        '"fai scattare" è un comando.\n'
        'Invece di fai scattare la leva: dire "La trappola scatta!".\n'
    )
    mondo, log = compila(src)
    _check(mondo is not None, "il comando multi-parola compila (niente più rifiuto)")
    _check(mondo and "fai scattare" in mondo.verbi_personalizzati,
           "il verbo multi-parola è registrato")
    _check(mondo and any(r.verbo == "fai scattare" for r in mondo.regole),
           "la regola 'Invece di fai scattare la leva' usa il verbo multi-parola")
    _check("non si attiverà" not in log.lower(),
           "nessun avviso di verbo non riconosciuto per il comando dichiarato")


def test_verbo_multiparola_runtime():
    print("[B6: il giocatore digita il verbo multi-parola e la regola scatta]")
    src = (
        "La cripta è una stanza.\nIl giocatore comincia in cripta.\n"
        "La leva è una cosa.\nLa leva è in cripta.\n"
        '"fai scattare" è un comando.\n'
        'Invece di fai scattare la leva: dire "La trappola scatta!".\n'
    )
    mondo = runtime(src)
    out = esegui(mondo, "fai scattare leva")
    _check("La trappola scatta!" in out,
           "'fai scattare leva' attiva la regola del verbo multi-parola")


def test_verbo_monoparola_resta_valido():
    print("[B6: i verbi personalizzati monoparola continuano a funzionare]")
    src = (
        "La cella è una stanza.\nIl giocatore comincia in cella.\n"
        "La leva è una cosa.\nLa leva è in cella.\n"
        '"spingi" è un comando.\n'
        'Invece di spingi la leva: dire "Spinta.".\n'
    )
    mondo = runtime(src)
    _check("Spinta." in esegui(mondo, "spingi leva"),
           "il verbo monoparola 'spingi' funziona come prima")


# --- Test: 0.19.0 — A7 verbi intransitivi -----------------------------------

def test_verbo_intransitivo_scatta_senza_oggetto():
    print("[A7: verbo intransitivo + regola globale, digitato da solo]")
    src = (
        "La strada è una stanza.\nIl giocatore comincia in strada.\n"
        '"accelera" è un comando senza oggetto.\n'
        'Invece di accelera: dire "Vroom!".\n'
    )
    mondo = runtime(src)
    _check(mondo is not None, "il sorgente con verbo intransitivo compila")
    _check(mondo and "accelera" in mondo.verbi_intransitivi,
           "'accelera' è registrato come intransitivo")
    out = esegui(mondo, "accelera")
    _check("Vroom!" in out, "'accelera' (da solo) attiva la regola globale")
    _check("Cosa vorresti" not in out,
           "il motore NON chiede un oggetto per un verbo intransitivo")


def test_verbo_intransitivo_con_conseguenza():
    print("[A7: un verbo intransitivo può cambiare lo stato del mondo]")
    src = (
        "L'auto è una stanza.\nIl giocatore comincia in auto.\n"
        "Il motore è uno stato.\nIl motore è spento.\n"
        '"avvia" è un comando senza oggetto.\n'
        'Invece di avvia se il motore è spento: dire "Brum." e adesso il motore è acceso.\n'
    )
    mondo = runtime(src)
    esegui(mondo, "avvia")
    _check(mondo and mondo.variabili.get("motore") == "acceso",
           "la conseguenza del verbo intransitivo ha acceso il motore")


def test_verbo_transitivo_resta_default():
    print("[A7: senza 'senza oggetto' un comando resta transitivo]")
    src = (
        "La cella è una stanza.\nIl giocatore comincia in cella.\n"
        "La leva è una cosa.\nLa leva è in cella.\n"
        '"spingi" è un comando.\n'
        'Invece di spingi la leva: dire "Spinta.".\n'
    )
    mondo = runtime(src)
    _check(mondo and "spingi" not in mondo.verbi_intransitivi,
           "'spingi' NON è intransitivo")
    _check("Cosa vorresti" in esegui(mondo, "spingi"),
           "'spingi' da solo chiede ancora un oggetto (transitivo)")


# --- Test: 0.19.0 — A8 inventario iniziale ----------------------------------

def test_inventario_iniziale():
    print("[A8: 'Il giocatore ha X' mette X in inventario all'avvio]")
    src = (
        "Il vicolo è una stanza.\nIl giocatore comincia in vicolo.\n"
        "Una torcia è una cosa.\n"
        "Il giocatore ha la torcia.\n"
    )
    mondo = runtime(src)
    _check(mondo is not None, "il sorgente con inventario iniziale compila")
    _check(mondo and "torcia" in mondo.inventario,
           "la torcia parte nell'inventario")
    _check("torcia" in esegui(mondo, "inventario").lower(),
           "l'inventario di partenza elenca la torcia")


def test_inventario_iniziale_oggetto_inesistente_e_errore():
    print("[A8: dare un oggetto inesistente è un errore bloccante]")
    src = (
        "Il vicolo è una stanza.\nIl giocatore comincia in vicolo.\n"
        "Il giocatore ha la spada.\n"   # 'spada' mai dichiarata come cosa
    )
    mondo, _ = compila(src)
    _check(mondo is None,
           "dare un oggetto inesistente fa fallire la compilazione")


def test_inventario_iniziale_order_independent():
    print("[A8: l'oggetto può essere dichiarato DOPO 'Il giocatore ha …']")
    src = (
        "Il molo è una stanza.\nIl giocatore comincia in molo.\n"
        "Il giocatore ha la mappa.\n"
        "Una mappa è una cosa.\n"     # dichiarata DOPO
    )
    mondo = runtime(src)
    _check(mondo and "mappa" in mondo.inventario,
           "la mappa è in inventario anche se dichiarata dopo")


# --- Test: 0.19.0 — A9 tick silenzioso (dire opzionale) ---------------------

def test_evento_silenzioso():
    print("[A9: un evento può non avere 'dire' (solo conseguenze)]")
    src = (
        "Il deserto è una stanza.\nIl giocatore comincia in deserto.\n"
        "L'acqua è un contatore.\nL'acqua parte da 3.\n"
        "Ogni 1 turno: diminuisci l'acqua.\n"
    )
    mondo, _ = compila(src)
    _check(mondo is not None, "l'evento senza 'dire' compila")
    _check(mondo and mondo.eventi and mondo.eventi[0].risposta == "",
           "l'evento ha risposta vuota")
    _check(mondo and mondo.eventi and len(mondo.eventi[0].conseguenze) == 1,
           "l'evento porta comunque la sua conseguenza")
    mondo = runtime(src)
    out = esegui(mondo, "guarda")   # un turno
    _check(mondo.variabili.get("acqua") == 2,
           "il tick silenzioso ha decrementato il contatore")
    _check("None" not in out,
           "il tick silenzioso non stampa testo spurio")


def test_demone_silenzioso():
    print("[A9: un demone può non avere 'dire' (solo conseguenze)]")
    src = (
        "La cripta è una stanza.\nIl giocatore comincia in cripta.\n"
        "Il veleno è un contatore.\nIl veleno parte da 0.\n"
        "La vita è un contatore.\nLa vita parte da 5.\n"
        "Ogni turno se il veleno è 0: diminuisci la vita.\n"
    )
    mondo, _ = compila(src)
    _check(mondo and mondo.demoni and mondo.demoni[0].risposta == "",
           "il demone ha risposta vuota")
    mondo = runtime(src)
    esegui(mondo, "guarda")
    _check(mondo.variabili.get("vita") == 4,
           "il demone silenzioso ha applicato la sua conseguenza")


def test_evento_con_dire_resta_valido():
    print("[A9: la forma con 'dire' resta valida (regressione)]")
    src = (
        "L'aula è una stanza.\nIl giocatore comincia in aula.\n"
        "Il conto è un contatore.\n"
        'Al turno 1: dire "Squilla la campanella." e adesso aumenta il conto.\n'
    )
    mondo = runtime(src)
    out = esegui(mondo, "guarda")
    _check("Squilla la campanella." in out, "la battuta dell'evento è stampata")
    _check(mondo.variabili.get("conto") == 1, "la conseguenza è applicata")


# --- Test: 0.20.0 — A1 pronomi e anafora ------------------------------------

def test_anafora_clitico_femminile():
    print("[A1: 'esamina la torcia' poi 'prendila']")
    src = (
        "L'atrio è una stanza.\nIl giocatore comincia in atrio.\n"
        "Una torcia è una cosa.\nLa torcia è in atrio.\nLa torcia è prendibile.\n"
        'La descrizione della torcia è "Una torcia di ottone.".\n'
    )
    mondo = runtime(src)
    esegui(mondo, "esamina la torcia")
    out = esegui(mondo, "prendila")
    _check("torcia" in out.lower() and "torcia" in mondo.inventario,
           "'prendila' prende la torcia (clitico f.sing.)")


def test_anafora_clitico_maschile_da_elenco_stanza():
    print("[A1: un oggetto elencato dalla stanza è riferibile: 'esaminalo']")
    src = (
        "L'atrio è una stanza.\nIl giocatore comincia in atrio.\n"
        "Uno scrigno è una cosa.\nLo scrigno è in atrio.\n"
        'La descrizione dello scrigno è "Pesante e chiuso.".\n'
    )
    mondo = runtime(src)
    esegui(mondo, "guarda")   # la stanza «nomina» lo scrigno (m.sing.)
    out = esegui(mondo, "esaminalo")
    _check("Pesante e chiuso." in out,
           "'esaminalo' trova lo scrigno nominato dall'elenco della stanza")


def test_anafora_mismatch_genere():
    print("[A1: un pronome di genere sbagliato non ha riferente]")
    src = (
        "L'atrio è una stanza.\nIl giocatore comincia in atrio.\n"
        "Una collana è una cosa.\nLa collana è in atrio.\nLa collana è prendibile.\n"
        'La descrizione della collana è "D\'argento.".\n'
    )
    mondo = runtime(src)
    esegui(mondo, "esamina la collana")   # solo f.sing. è riferito
    out = esegui(mondo, "prendilo")       # m.sing. → nessun riferente
    _check("Cosa vorresti" in out and "collana" not in mondo.inventario,
           "'prendilo' senza riferente maschile non prende nulla")


def test_anafora_riferito_non_raggiungibile():
    print("[A1: un riferito lasciato indietro -> 'Non la vedi piu']")
    src = (
        "L'atrio è una stanza.\nIl corridoio è una stanza.\n"
        "L'atrio collega nord a corridoio.\n"
        "Il giocatore comincia in atrio.\n"
        "Una collana è una cosa.\nLa collana è in atrio.\nLa collana è prendibile.\n"
        'La descrizione della collana è "D\'argento.".\n'
    )
    mondo = runtime(src)
    esegui(mondo, "esamina la collana")
    esegui(mondo, "nord")     # la collana resta in atrio, irraggiungibile
    out = esegui(mondo, "prendila")
    _check("Non la vedi" in out,
           "'prendila' su un riferito non più raggiungibile avvisa")


def test_anafora_pronome_tonico():
    print("[A1: pronome tonico 'prendi quella']")
    src = (
        "L'atrio è una stanza.\nIl giocatore comincia in atrio.\n"
        "Una collana è una cosa.\nLa collana è in atrio.\nLa collana è prendibile.\n"
        'La descrizione della collana è "D\'argento.".\n'
    )
    mondo = runtime(src)
    esegui(mondo, "esamina la collana")
    esegui(mondo, "prendi quella")
    _check("collana" in mondo.inventario,
           "'prendi quella' (tonico f.sing.) prende la collana")


def test_anafora_plurale():
    print("[A1: pronome plurale 'esaminale']")
    src = (
        "L'atrio è una stanza.\nIl giocatore comincia in atrio.\n"
        "Le chiavi sono una cosa.\nLe chiavi sono in atrio.\n"
        'La descrizione delle chiavi è "Un mazzo di chiavi.".\n'
    )
    mondo = runtime(src)
    esegui(mondo, "guarda")   # nomina le chiavi (f.plur.)
    out = esegui(mondo, "esaminale")
    _check("mazzo di chiavi" in out, "'esaminale' (f.plur.) trova le chiavi")


def test_anafora_nessun_falso_positivo():
    print("[A1: un comando esplicito che 'sembra' un pronome resta esplicito]")
    src = (
        "L'atrio è una stanza.\nIl giocatore comincia in atrio.\n"
        "Una candela è una cosa.\nLa candela è in atrio.\nLa candela è prendibile.\n"
        'La descrizione della candela è "Una candela di cera.".\n'
    )
    mondo = runtime(src)
    # 'esamina la candela': 'la' è articolo, NON pronome (segue il nome).
    out = esegui(mondo, "esamina la candela")
    _check("Una candela di cera." in out,
           "'esamina la candela' resta un comando esplicito sull'oggetto")


# --- Test: 0.21.0 — A3 comandi di servizio (ANNULLA / ANCORA) ---------------

def _src_atrio_torcia():
    return (
        "L'atrio è una stanza.\nIl giocatore comincia in atrio.\n"
        "Una torcia è una cosa.\nLa torcia è in atrio.\nLa torcia è prendibile.\n"
    )


def test_annulla_disfa_ultimo_turno():
    print("[A3: 'annulla' disfa l'ultima azione]")
    mondo = runtime(_src_atrio_torcia())
    esegui(mondo, "prendi la torcia")
    _check("torcia" in mondo.inventario, "(precondizione) la torcia è stata presa")
    out = esegui(mondo, "annulla")
    _check("torcia" not in mondo.inventario,
           "'annulla' rimette la torcia fuori dall'inventario")
    _check("annullato" in out.lower(), "'annulla' conferma a video")


def test_annulla_ripristina_contatore_e_turno():
    print("[A3: 'annulla' riavvolge anche contatori e turni]")
    src = (
        "L'aula è una stanza.\nIl giocatore comincia in aula.\n"
        "Il passi è un contatore.\n"
        "Ogni 1 turno: aumenta il passi.\n"
    )
    mondo = runtime(src)
    esegui(mondo, "guarda")   # turno 1 -> passi 1
    esegui(mondo, "guarda")   # turno 2 -> passi 2
    esegui(mondo, "annulla")  # disfa il turno 2
    _check(mondo.variabili.get("passi") == 1,
           "'annulla' riporta il contatore al valore del turno precedente")
    _check(mondo.turno_corrente == 1,
           "'annulla' riporta indietro il contatore dei turni")


def test_annulla_multiplo():
    print("[A3: 'annulla' ripetuto disfa piu turni in pila]")
    src = (
        "L'atrio è una stanza.\nIl giocatore comincia in atrio.\n"
        "Una torcia è una cosa.\nLa torcia è in atrio.\nLa torcia è prendibile.\n"
        "Una mela è una cosa.\nLa mela è in atrio.\nLa mela è prendibile.\n"
    )
    mondo = runtime(src)
    esegui(mondo, "prendi la torcia")
    esegui(mondo, "prendi la mela")
    esegui(mondo, "annulla")   # disfa 'prendi la mela'
    _check("mela" not in mondo.inventario and "torcia" in mondo.inventario,
           "il primo 'annulla' disfa solo l'ultima presa")
    esegui(mondo, "annulla")   # disfa 'prendi la torcia'
    _check("torcia" not in mondo.inventario,
           "il secondo 'annulla' disfa anche la presa precedente")


def test_annulla_niente_da_annullare():
    print("[A3: 'annulla' all'inizio non ha nulla da disfare]")
    mondo = runtime(_src_atrio_torcia())
    out = esegui(mondo, "annulla")
    _check("niente da annullare" in out.lower(),
           "'annulla' senza storia avvisa che non c'è nulla da disfare")


def test_ancora_ripete_ultimo_comando():
    print("[A3: 'ancora' ripete l'ultimo comando]")
    mondo = runtime(_src_atrio_torcia())
    esegui(mondo, "prendi la torcia")    # Preso
    out = esegui(mondo, "ancora")        # ripete 'prendi la torcia'
    _check("hai gi" in out.lower() or "ce l'hai" in out.lower(),
           "'ancora' rigioca 'prendi la torcia' (stavolta gia' in mano)")


def test_ancora_niente_da_ripetere():
    print("[A3: 'ancora' all'inizio non ha nulla da ripetere]")
    mondo = runtime(_src_atrio_torcia())
    out = esegui(mondo, "ancora")
    _check("nulla da ripetere" in out.lower(),
           "'ancora' senza comandi precedenti avvisa")


# --- Test: 0.22.0 — A2 varietà nelle risposte (descrizioni alternate) --------

def test_descrizione_sequenza():
    print("[A2: 'in sequenza' ruota le varianti e si ferma sull'ultima]")
    src = (
        "La torre è una stanza.\nIl giocatore comincia in torre.\n"
        "Un faro è una cosa.\nIl faro è in torre.\n"
        'La descrizione del faro è in sequenza: "FARO-UNO.", "FARO-DUE.", "FARO-TRE.".\n'
    )
    mondo = runtime(src)
    o = [esegui(mondo, "esamina faro") for _ in range(4)]
    _check("FARO-UNO." in o[0] and "FARO-DUE." in o[1] and "FARO-TRE." in o[2],
           "le varianti si susseguono in ordine")
    _check("FARO-TRE." in o[3], "raggiunta l'ultima variante, vi resta")


def test_descrizione_casuale_niente_ripetizione_immediata():
    print("[A2: 'una di' non ripete mai due volte di fila la stessa variante]")
    src = (
        "Il molo è una stanza.\nIl giocatore comincia in molo.\n"
        'La descrizione del molo è una di: "MARE-A.", "MARE-B.", "MARE-C.".\n'
    )
    mondo = runtime(src)
    scelte = []
    for _ in range(12):
        out = esegui(mondo, "guarda")
        for etichetta in ("MARE-A.", "MARE-B.", "MARE-C."):
            if etichetta in out:
                scelte.append(etichetta)
                break
    ripetute = any(scelte[i] == scelte[i + 1] for i in range(len(scelte) - 1))
    _check(len(scelte) == 12 and not ripetute,
           "12 estrazioni, mai due uguali consecutive")


def test_descrizione_casuale_deterministica():
    print("[A2: il seme fisso rende le scelte casuali RIPRODUCIBILI]")
    src = (
        "Il molo è una stanza.\nIl giocatore comincia in molo.\n"
        'La descrizione del molo è una di: "MARE-A.", "MARE-B.", "MARE-C.".\n'
    )
    def sequenza():
        mondo = runtime(src)
        return [esegui(mondo, "guarda") for _ in range(8)]
    _check(sequenza() == sequenza(),
           "due partite con lo stesso seme danno la stessa sequenza casuale")


def test_descrizione_varianti_annulla_riavvolge():
    print("[A2: 'annulla' riavvolge anche lo stato delle varianti]")
    src = (
        "La torre è una stanza.\nIl giocatore comincia in torre.\n"
        "Un faro è una cosa.\nIl faro è in torre.\n"
        'La descrizione del faro è in sequenza: "FARO-UNO.", "FARO-DUE.", "FARO-TRE.".\n'
    )
    mondo = runtime(src)
    esegui(mondo, "esamina faro")           # FARO-UNO (indice -> DUE)
    esegui(mondo, "esamina faro")           # FARO-DUE (indice -> TRE)
    esegui(mondo, "annulla")                # disfa: indice torna a DUE
    out = esegui(mondo, "esamina faro")
    _check("FARO-DUE." in out,
           "dopo 'annulla' la sequenza riparte dalla variante precedente")


def test_descrizione_varianti_interpolano():
    print("[A2: i segnaposto [var] funzionano dentro le varianti]")
    src = (
        "La cella è una stanza.\nIl giocatore comincia in cella.\n"
        "Il punteggio è un contatore.\nIl punteggio parte da 7.\n"
        'La descrizione della cella è una di: "Hai [punteggio] punti.", "Punti: [punteggio].".\n'
    )
    mondo = runtime(src)
    out = esegui(mondo, "guarda")
    _check("7" in out and "[punteggio]" not in out,
           "la variante scelta interpola il contatore")


def test_descrizione_singola_resta_valida():
    print("[A2: la descrizione a stringa singola continua a funzionare]")
    src = (
        "L'atrio è una stanza.\nIl giocatore comincia in atrio.\n"
        'La descrizione dell\'atrio è "Un atrio semplice.".\n'
    )
    mondo = runtime(src)
    _check("Un atrio semplice." in esegui(mondo, "guarda"),
           "la forma storica (una sola stringa) è preservata")


def test_descrizione_condizionale_a_varianti():
    print("[A2: una variante condizionale può a sua volta essere a varianti]")
    src = (
        "La sala è una stanza.\nIl giocatore comincia in sala.\n"
        "L'allarme è uno stato.\nL'allarme è attivo.\n"
        'La descrizione della sala è "Tutto tranquillo.".\n'
        'La descrizione della sala se l\'allarme è attivo è in sequenza: "ALL-UNO.", "ALL-DUE.".\n'
    )
    mondo = runtime(src)
    o1 = esegui(mondo, "guarda")
    o2 = esegui(mondo, "guarda")
    _check("ALL-UNO." in o1 and "ALL-DUE." in o2,
           "la descrizione condizionale vera pesca le sue varianti in sequenza")


# --- Test: buio e luce [0.24.0 / A4] -----------------------------------------

def test_a4_parsing_buia_e_illumina():
    print("[A4: 'è buia' marca la stanza, 'illumina' marca la fonte di luce]")
    src = (
        "La cantina è una stanza.\nLa cantina è buia.\n"
        "Una torcia è una cosa.\nLa torcia illumina.\nLa torcia è in cantina.\n"
    )
    mondo, log = compila(src)
    _check(mondo is not None, "il sorgente con buio/luce compila")
    _check(mondo and mondo.trova_stanza("cantina").buia is True,
           "la cantina risulta buia")
    _check(mondo and mondo.trova_oggetto("torcia").illumina is True,
           "la torcia risulta fonte di luce")


def test_a4_buio_blocca_esamina_e_prendi():
    print("[A4: in stanza buia senza luce, esamina/prendi sono bloccati]")
    src = (
        "La cantina è una stanza.\nIl giocatore comincia in cantina.\n"
        "La cantina è buia.\n"
        "Un baule è una cosa.\nIl baule è in cantina.\nIl baule è prendibile.\n"
    )
    mondo = runtime(src)
    out_es = esegui(mondo, "esamina baule")
    out_pr = esegui(mondo, "prendi baule")
    _check("buio" in out_es.lower(), "esamina al buio risponde col buio")
    _check("buio" in out_pr.lower(), "prendi al buio risponde col buio")
    _check("baule" not in mondo.inventario, "l'oggetto NON è stato preso al buio")


def test_a4_guarda_mostra_buio_pesto():
    print("[A4: guarda in stanza buia mostra «È buio pesto.» e nasconde gli oggetti]")
    src = (
        "La cantina è una stanza.\nIl giocatore comincia in cantina.\n"
        "La cantina è buia.\n"
        'La descrizione della cantina è "Pareti di pietra umida.".\n'
        "Un baule è una cosa.\nIl baule è in cantina.\n"
    )
    mondo = runtime(src)
    out = esegui(mondo, "guarda")
    _check("buio pesto" in out.lower(), "il buio è annunciato")
    _check("baule" not in out.lower(), "gli oggetti non sono elencati al buio")
    _check("pietra" not in out.lower(), "la descrizione non è mostrata al buio")


def test_a4_torcia_in_inventario_illumina():
    print("[A4: una fonte di luce in mano rischiara la stanza buia]")
    src = (
        "La cantina è una stanza.\nIl giocatore comincia in cantina.\n"
        "La cantina è buia.\n"
        "Una torcia è una cosa.\nLa torcia illumina.\n"
        "Il giocatore ha la torcia.\n"
        'La descrizione della cantina è "Pareti di pietra umida.".\n'
    )
    mondo = runtime(src)
    out = esegui(mondo, "guarda")
    _check(mondo.c_e_luce() is True, "c'è luce con la torcia in mano")
    _check("pietra" in out.lower(), "la descrizione è visibile con la luce")


def test_a4_fonte_a_terra_rischiara():
    print("[A4: una fonte di luce che brilla a terra rischiara la stanza]")
    src = (
        "La cantina è una stanza.\nIl giocatore comincia in cantina.\n"
        "La cantina è buia.\n"
        "Una lanterna è una cosa.\nLa lanterna illumina.\nLa lanterna è in cantina.\n"
    )
    mondo = runtime(src)
    out = esegui(mondo, "guarda")
    _check(mondo.c_e_luce() is True, "c'è luce con la lanterna a terra")
    _check("lanterna" in out.lower(), "la fonte luminosa a terra è visibile")


def test_a4_torcia_spenta_non_illumina():
    print("[A4: una fonte 'spenta' non illumina (opposte accesa/spenta)]")
    src = (
        "La cantina è una stanza.\nIl giocatore comincia in cantina.\n"
        "La cantina è buia.\n"
        "Accesa e spenta sono opposte.\n"
        "Una torcia è una cosa.\nLa torcia illumina.\nLa torcia è spenta.\n"
        "Il giocatore ha la torcia.\n"
    )
    mondo = runtime(src)
    _check(mondo.c_e_luce() is False, "la torcia spenta non fa luce")
    out = esegui(mondo, "guarda")
    _check("buio pesto" in out.lower(), "resta buio con la torcia spenta")


def test_a4_accendi_la_luce_via_regola():
    print("[A4: accendere la fonte (regola -> 'accesa') rischiara la stanza]")
    src = (
        "La cantina è una stanza.\nIl giocatore comincia in cantina.\n"
        "La cantina è buia.\n"
        "Accesa e spenta sono opposte.\n"
        "Una torcia è una cosa.\nLa torcia illumina.\nLa torcia è spenta.\n"
        "Il giocatore ha la torcia.\n"
        'Invece di usa la torcia: dire "Accendi la torcia." e adesso la torcia è accesa.\n'
    )
    mondo = runtime(src)
    _check(mondo.c_e_luce() is False, "all'inizio è buio (torcia spenta)")
    esegui(mondo, "usa torcia")
    _check(mondo.c_e_luce() is True, "dopo l'accensione c'è luce")


def test_a4_luce_in_contenitore_chiuso_non_illumina():
    print("[A4: una fonte dentro un contenitore CHIUSO non illumina]")
    src = (
        "La cantina è una stanza.\nIl giocatore comincia in cantina.\n"
        "La cantina è buia.\n"
        "Una cassa è un contenitore.\nLa cassa è in cantina.\nLa cassa è chiusa.\n"
        "Una torcia è una cosa.\nLa torcia illumina.\nLa torcia è nella cassa.\n"
    )
    mondo = runtime(src)
    _check(mondo.c_e_luce() is False,
           "la torcia in una cassa chiusa non fa luce")


def test_a4_luce_in_contenitore_aperto_illumina():
    print("[A4: una fonte dentro un contenitore APERTO illumina]")
    src = (
        "La cantina è una stanza.\nIl giocatore comincia in cantina.\n"
        "La cantina è buia.\n"
        "Una cassa è un contenitore.\nLa cassa è in cantina.\n"  # aperta di default
        "Una torcia è una cosa.\nLa torcia illumina.\nLa torcia è nella cassa.\n"
    )
    mondo = runtime(src)
    _check(mondo.c_e_luce() is True,
           "la torcia in una cassa aperta fa luce")


def test_a4_stanza_non_buia_sempre_visibile():
    print("[A4: una stanza NON buia è sempre visibile, senza alcuna luce]")
    src = (
        "L'atrio è una stanza.\nIl giocatore comincia in atrio.\n"
        'La descrizione dell\'atrio è "Un atrio luminoso.".\n'
        "Un vaso è una cosa.\nIl vaso è in atrio.\n"
    )
    mondo = runtime(src)
    out = esegui(mondo, "guarda")
    _check(mondo.c_e_luce() is True, "una stanza non buia ha sempre luce")
    _check("atrio luminoso" in out.lower() and "vaso" in out.lower(),
           "descrizione e oggetti sono visibili")


def test_a4_uscite_percorribili_al_buio():
    print("[A4: al buio non si vede, ma le uscite restano percorribili]")
    src = (
        "La cantina è una stanza.\nL'atrio è una stanza.\n"
        "La cantina collega nord a atrio.\n"
        "Il giocatore comincia in cantina.\n"
        "La cantina è buia.\n"
        'La descrizione dell\'atrio è "Un atrio illuminato.".\n'
    )
    mondo = runtime(src)
    esegui(mondo, "nord")
    _check(mondo.posizione_giocatore == "atrio",
           "il giocatore si è mosso al buio verso l'atrio")


def test_a4_demone_spegne_la_luce():
    print("[A4: un demone che spegne la fonte riporta il buio a metà partita]")
    src = (
        "La cantina è una stanza.\nIl giocatore comincia in cantina.\n"
        "La cantina è buia.\n"
        "Accesa e spenta sono opposte.\n"
        "Una torcia è una cosa.\nLa torcia illumina.\nLa torcia è accesa.\n"
        "Il giocatore ha la torcia.\n"
        "Il tempo è un contatore.\n"
        "Ogni 1 turno: aumenta il tempo.\n"
        'Quando il tempo è almeno 2: dire "La torcia si spegne." e adesso la torcia è spenta.\n'
    )
    mondo = runtime(src)
    _check(mondo.c_e_luce() is True, "all'inizio la torcia accesa fa luce")
    esegui(mondo, "guarda")   # turno 1
    esegui(mondo, "guarda")   # turno 2: il demone spegne la torcia
    _check(mondo.c_e_luce() is False, "dopo lo spegnimento è di nuovo buio")


def test_a4_regola_autore_precede_il_buio():
    print("[A4: una regola 'Invece di esamina' ha la precedenza anche al buio]")
    src = (
        "La cantina è una stanza.\nIl giocatore comincia in cantina.\n"
        "La cantina è buia.\n"
        "Un totem è una cosa.\nIl totem è in cantina.\n"
        'Invece di esamina il totem: dire "Brilla di luce propria.".\n'
    )
    mondo = runtime(src)
    out = esegui(mondo, "esamina totem")
    _check("luce propria" in out.lower(),
           "la regola d'autore scatta nonostante il buio")


def test_a4_concordanza_buio_maschile():
    print("[A4: 'è buio' (maschile) marca la stanza come 'è buia' (folding radice)]")
    src = (
        "Il sottoscala è una stanza.\nIl giocatore comincia in sottoscala.\n"
        "Il sottoscala è buio.\n"
    )
    mondo = runtime(src)
    _check(mondo.trova_stanza("sottoscala").buia is True,
           "la forma maschile 'buio' è riconosciuta")
    _check(mondo.c_e_luce() is False, "il sottoscala è al buio")


def test_a4_illumina_prima_della_dichiarazione():
    print("[A4: 'La torcia illumina.' funziona anche prima di 'è una cosa']")
    src = (
        "La cantina è una stanza.\n"
        "La torcia illumina.\n"            # riferimento prima della dichiarazione
        "Una torcia è una cosa.\nLa torcia è in cantina.\n"
    )
    mondo, _ = compila(src)
    _check(mondo is not None and mondo.trova_oggetto("torcia").illumina is True,
           "l'ordine non conta: la torcia illumina")


# --- Test: movimento degli NPC [0.25.0 / A5] --------------------------------

def _src_a5(extra_npc="La guardia è in cella.\n", trigger=""):
    return (
        "La cella è una stanza.\nIl corridoio è una stanza.\n"
        "La cella collega nord a corridoio.\n"
        "L'allarme è uno stato.\nL'allarme è attivo.\n"
        "Una guardia è un personaggio.\n" + extra_npc + trigger
    )


def test_a5_parsing_due_forme():
    print("[A5: 'va nel corridoio' e 'cambia stanza' producono un movimento NPC]")
    src = _src_a5(trigger=(
        "Il giocatore comincia in cella.\n"
        "Ogni turno se l'allarme è attivo: la guardia va nel corridoio.\n"
        "Quando l'allarme non è attivo: la guardia cambia stanza.\n"))
    mondo, log = compila(src)
    _check(mondo is not None, "il sorgente con movimento NPC compila")
    tipi = [c.__class__.__name__ for d in (mondo.demoni if mondo else [])
            for c in d.conseguenze]
    _check(tipi.count("ConseguenzaMovimentoPNG") == 2,
           "entrambe le forme creano una ConseguenzaMovimentoPNG")


def test_a5_movimento_deterministico():
    print("[A5: 'va nel corridoio' sposta l'NPC nella stanza indicata]")
    src = _src_a5(trigger=(
        "Il giocatore comincia in corridoio.\n"
        "Ogni turno se l'allarme è attivo: la guardia va nel corridoio.\n"))
    mondo = runtime(src)
    esegui(mondo, "guarda")   # turno 1
    _check(mondo.trova_oggetto("guardia").posizione == "corridoio",
           "la guardia è andata nel corridoio")


def test_a5_movimento_casuale_deterministico_col_seed():
    print("[A5: 'cambia stanza' è casuale ma riproducibile (seed di A2)]")
    src = (
        "La cella è una stanza.\nIl corridoio è una stanza.\nIl magazzino è una stanza.\n"
        "La cella collega nord a corridoio.\nLa cella collega est a magazzino.\n"
        "Il giocatore comincia in corridoio.\n"
        "L'allarme è uno stato.\nL'allarme è attivo.\n"
        "Una guardia è un personaggio.\nLa guardia è in cella.\n"
        "Ogni turno se l'allarme è attivo: la guardia cambia stanza.\n")
    m1 = runtime(src)
    esegui(m1, "guarda")
    dest1 = m1.trova_oggetto("guardia").posizione
    m2 = runtime(src)
    esegui(m2, "guarda")
    dest2 = m2.trova_oggetto("guardia").posizione
    _check(dest1 in ("corridoio", "magazzino"),
           "la guardia si sposta in una stanza adiacente")
    _check(dest1 == dest2, "la scelta casuale è riproducibile (stesso seed)")


def test_a5_annuncio_uscita_con_direzione():
    print("[A5: l'NPC che lascia la stanza del giocatore è annunciato (con direzione)]")
    src = _src_a5(trigger=(
        "Il giocatore comincia in cella.\n"
        "Ogni turno se l'allarme è attivo: la guardia cambia stanza.\n"))
    mondo = runtime(src)
    out = esegui(mondo, "guarda")
    _check("se ne va" in out.lower(), "l'uscita dell'NPC è annunciata")
    _check("nord" in out.lower(), "l'annuncio include la direzione")


def test_a5_annuncio_ingresso():
    print("[A5: l'NPC che entra nella stanza del giocatore è annunciato]")
    src = _src_a5(trigger=(
        "Il giocatore comincia in corridoio.\n"
        "Ogni turno se l'allarme è attivo: la guardia va nel corridoio.\n"))
    mondo = runtime(src)
    out = esegui(mondo, "guarda")
    _check("arriva" in out.lower(), "l'ingresso dell'NPC è annunciato")


def test_a5_nessun_annuncio_altrove():
    print("[A5: un movimento lontano dal giocatore non è annunciato]")
    src = (
        "L'atrio è una stanza.\nLa cella è una stanza.\nIl corridoio è una stanza.\n"
        "L'atrio collega ovest a cella.\nLa cella collega nord a corridoio.\n"
        "Il giocatore comincia in atrio.\n"
        "L'allarme è uno stato.\nL'allarme è attivo.\n"
        "Una guardia è un personaggio.\nLa guardia è in cella.\n"
        "Ogni turno se l'allarme è attivo: la guardia va nel corridoio.\n")
    mondo = runtime(src)
    out = esegui(mondo, "guarda")
    _check("se ne va" not in out.lower() and "arriva" not in out.lower(),
           "nessun annuncio per un movimento fuori scena")


def test_a5_movimento_via_evento():
    print("[A5: un evento a tempo può muovere un NPC]")
    src = (
        "La cella è una stanza.\nIl corridoio è una stanza.\n"
        "La cella collega nord a corridoio.\n"
        "Il giocatore comincia in corridoio.\n"
        "Una guardia è un personaggio.\nLa guardia è in cella.\n"
        "Al turno 1: la guardia va nel corridoio.\n")
    mondo = runtime(src)
    out = esegui(mondo, "guarda")
    _check(mondo.trova_oggetto("guardia").posizione == "corridoio",
           "l'evento ha mosso la guardia")
    _check("arriva" in out.lower(), "l'arrivo è annunciato")


def test_a5_movimento_via_regola_giocatore():
    print("[A5: una regola del giocatore può muovere un NPC, con annuncio]")
    src = (
        "La cella è una stanza.\nIl corridoio è una stanza.\n"
        "La cella collega nord a corridoio.\n"
        "Il giocatore comincia in corridoio.\n"
        "Un bottone è una cosa.\nIl bottone è in corridoio.\n"
        "Una guardia è un personaggio.\nLa guardia è in cella.\n"
        'Invece di esamina il bottone: dire "Premi il bottone." e adesso la guardia va nel corridoio.\n')
    mondo = runtime(src)
    out = esegui(mondo, "esamina bottone")
    _check("premi il bottone" in out.lower(), "la risposta della regola è mostrata")
    _check(mondo.trova_oggetto("guardia").posizione == "corridoio",
           "la regola ha mosso la guardia")
    _check("arriva" in out.lower(), "l'arrivo è annunciato dopo la regola")


def test_a5_cambia_stanza_senza_uscite_no_op():
    print("[A5: 'cambia stanza' senza uscite lascia l'NPC dov'è]")
    src = (
        "La cella è una stanza.\nIl sgabuzzino è una stanza.\n"
        "Il giocatore comincia in cella.\n"
        "L'allarme è uno stato.\nL'allarme è attivo.\n"
        "Una guardia è un personaggio.\nLa guardia è in sgabuzzino.\n"  # senza uscite
        "Ogni turno se l'allarme è attivo: la guardia cambia stanza.\n")
    mondo = runtime(src)
    esegui(mondo, "guarda")
    _check(mondo.trova_oggetto("guardia").posizione == "sgabuzzino",
           "senza uscite l'NPC non si sposta")


def test_a5_destinazione_inesistente_errore():
    print("[A5: 'va' verso una non-stanza è un errore di compilazione]")
    src = (
        "La cella è una stanza.\n"
        "Il giocatore comincia in cella.\n"
        "L'allarme è uno stato.\nL'allarme è attivo.\n"
        "Una guardia è un personaggio.\nLa guardia è in cella.\n"
        "Un forziere è una cosa.\nIl forziere è in cella.\n"
        "Quando l'allarme è attivo: la guardia va nel forziere.\n")  # forziere è un oggetto
    mondo, log = compila(src)
    _check(mondo is None, "la compilazione fallisce")
    _check("inesistente" in log.lower() and "forziere" in log.lower(),
           "l'errore segnala la destinazione non-stanza")


# --- Test: sinonimi di verbo [0.26.0 / A6] ----------------------------------

def test_a6_parsing_e_registrazione():
    print("[A6: '\"ghermisci\" è come prendi.' registra il sinonimo]")
    src = (
        "La cella è una stanza.\nIl giocatore comincia in cella.\n"
        '"ghermisci" è come prendi.\n')
    mondo, log = compila(src)
    _check(mondo is not None, "il sorgente con sinonimo compila")
    _check(mondo and mondo.sinonimi_verbo.get("ghermisci") == "prendi",
           "il sinonimo rimanda al verbo canonico 'prendi'")


def test_a6_sinonimo_si_comporta_come_il_verbo():
    print("[A6: il sinonimo prende l'oggetto come farebbe il verbo bersaglio]")
    src = (
        "La cella è una stanza.\nIl giocatore comincia in cella.\n"
        "Una gemma è una cosa.\nLa gemma è in cella.\nLa gemma è prendibile.\n"
        '"ghermisci" è come prendi.\n')
    mondo = runtime(src)
    out = esegui(mondo, "ghermisci gemma")
    _check("gemma" in mondo.inventario, "la gemma è stata presa col sinonimo")
    _check("preso" in out.lower(), "la risposta è quella del verbo 'prendi'")


def test_a6_sinonimo_attiva_le_regole_del_canonico():
    print("[A6: il sinonimo attiva le regole 'Invece di [canonico]']")
    src = (
        "La cella è una stanza.\nIl giocatore comincia in cella.\n"
        "Una chiave è una cosa.\nLa chiave è in cella.\nLa chiave è prendibile.\n"
        '"ghermisci" è come prendi.\n'
        'Invece di prendi la chiave: dire "Una scossa ti ferma.".\n')
    mondo = runtime(src)
    out = esegui(mondo, "ghermisci chiave")
    _check("scossa" in out.lower(),
           "la regola sul verbo canonico scatta anche col sinonimo")
    _check("chiave" not in mondo.inventario,
           "la regola sostituisce la presa (oggetto non raccolto)")


def test_a6_il_canonico_continua_a_funzionare():
    print("[A6: dichiarare un sinonimo non disturba il verbo originale]")
    src = (
        "La cella è una stanza.\nIl giocatore comincia in cella.\n"
        "Una gemma è una cosa.\nLa gemma è in cella.\nLa gemma è prendibile.\n"
        '"ghermisci" è come prendi.\n')
    mondo = runtime(src)
    esegui(mondo, "prendi gemma")
    _check("gemma" in mondo.inventario, "il verbo originale 'prendi' funziona ancora")


def test_a6_bersaglio_sconosciuto_warning():
    print("[A6: un sinonimo verso un verbo ignoto è un avviso (non bloccante)]")
    src = (
        "La cella è una stanza.\nIl giocatore comincia in cella.\n"
        '"svolazza" è come volare.\n')   # 'volare' non è un verbo del motore
    mondo, log = compila(src)
    _check(mondo is not None, "la compilazione riesce (warning non bloccante)")
    _check("volare" in log.lower() and ("non è un verbo" in log.lower()
           or "non fa" in log.lower()),
           "il log avverte che il bersaglio non è un verbo noto")
    _check(mondo and "svolazza" not in mondo.sinonimi_verbo,
           "il sinonimo morto non è registrato")


def test_a6_piu_sinonimi():
    print("[A6: più sinonimi per verbi diversi convivono]")
    src = (
        "La cella è una stanza.\nIl giocatore comincia in cella.\n"
        "Una gemma è una cosa.\nLa gemma è in cella.\nLa gemma è prendibile.\n"
        '"ghermisci" è come prendi.\n'
        '"scruta" è come esamina.\n')
    mondo = runtime(src)
    _check(mondo.sinonimi_verbo.get("ghermisci") == "prendi"
           and mondo.sinonimi_verbo.get("scruta") == "esamina",
           "entrambi i sinonimi sono registrati")
    out = esegui(mondo, "scruta gemma")
    _check("non vedi nulla del genere" not in out.lower(),
           "'scruta' esamina la gemma come 'esamina'")


def test_robustezza_console_cp1252_non_crasha():
    """Robustezza (debito R8): un carattere fuori da Windows-1252 in un testo
    stampato non deve far terminare il gioco sulla console Windows. La fonte
    unica utils.assicura_console_utf8 riconfigura lo stream con
    errors='replace' (no-op se non riconfigurabile)."""
    import sys as _sys
    from utils import assicura_console_utf8

    class _ConsoleCp1252:
        """Finta console Windows: di default esplode sui caratteri non-cp1252;
        reconfigure(errors='replace') la rende tollerante, come gli stream
        reali di Python."""
        def __init__(self):
            self.errors = "strict"
        def reconfigure(self, encoding=None, errors=None):
            if errors is not None:
                self.errors = errors
        def write(self, testo):
            for ch in testo:
                try:
                    ch.encode("cp1252")
                except UnicodeEncodeError:
                    if self.errors != "replace":
                        raise
            return len(testo)
        def flush(self):
            pass

    falso = _ConsoleCp1252()
    salva_out, salva_err = _sys.stdout, _sys.stderr
    crashato = False
    try:
        _sys.stdout = falso
        _sys.stderr = falso
        assicura_console_utf8()
        try:
            print("★ stelle ─ frecce → emoji")
        except UnicodeEncodeError:
            crashato = True
    finally:
        _sys.stdout, _sys.stderr = salva_out, salva_err
    _check(not crashato,
           "un carattere fuori da cp1252 non fa crashare la stampa (fix R8)")
    _check(falso.errors == "replace",
           "assicura_console_utf8 imposta errors='replace' sullo stream")
    # Idempotente: una seconda chiamata sugli stream reali non solleva.
    assicura_console_utf8()
    _check(True, "assicura_console_utf8 è idempotente")


# --- Runner ------------------------------------------------------------------

def main():
    tests = [
        test_disambiguazione_definizioni,
        test_nomi_con_parole_quasi_riservate,
        test_posizione_iniziale_dichiarata,
        test_posizione_iniziale_fallback,
        test_posizione_iniziale_inesistente_e_errore,
        test_verbo_sconosciuto_genera_warning,
        test_verbo_valido_nessun_warning,
        test_refuso_proprieta_in_condizione,
        test_proprieta_da_conseguenza_non_e_refuso,
        test_escape_virgolette_nelle_stringhe,
        test_normalizzazione_apostrofo_tipografico,
        # Livello 2 — logica composita
        test_condizione_and,
        test_condizione_or,
        test_negazione_possesso,
        test_negazione_proprieta,
        test_conseguenze_multiple,
        test_conseguenze_multiple_forma_breve,
        test_refuso_dentro_condizione_composita,
        # Livello 4 — alias/sinonimi di oggetti
        test_alias_risoluzione_esatta,
        test_alias_multiparola_quotato,
        test_alias_parziale,
        test_alias_su_non_oggetto_warning,
        # Livello 4 — verbi personalizzati (M1)
        test_verbo_personalizzato_dichiarazione,
        test_verbo_personalizzato_runtime,
        test_verbo_personalizzato_senza_regola,
        test_verbo_personalizzato_multiparola_accettato,
        # Livello 4 — direzioni personalizzate / data-driven (L1)
        test_direzioni_personalizzate_connessione,
        test_direzioni_personalizzate_runtime,
        test_direzione_regola_canonicalizza_abbreviazione,
        test_direzione_conflitto_parola_riservata_errore,
        test_scanner_raccoglie_direzioni,
        # Livello 4 — contenitori e supporti, modello (M1)
        test_contenitore_dichiarazione,
        test_supporto_dichiarazione,
        test_collocazione_in_contenitore,
        test_collocazione_su_supporto,
        test_collocazione_su_non_contenitore_errore,
        # 0.17.0 — robustezza d'ordine
        test_ordine_posizione_prima_della_stanza,
        test_ordine_collocazione_prima_del_contenitore,
        test_ordine_proprieta_prima_dell_oggetto,
        test_ordine_descrizione_prima_dell_entita,
        test_ordine_conseguenza_verso_oggetto_definito_dopo,
        test_ordine_destinazione_inesistente_resta_errore,
        test_ordine_regola_bersaglio_definito_dopo,
        test_ordine_regola_bersaglio_non_oggetto_resta_errore,
        test_linter_demone_non_falsa_variabile_inutilizzata,
        test_linter_demone_non_falsa_oggetto_orfano,
        test_comando_dopo_fine_partita_e_noop,
        test_scanner_raccoglie_contenitori,
        # Livello 4 — contenitori e supporti, runtime (M1)
        test_runtime_contenitore_aperto_scope,
        test_runtime_contenitore_chiuso_nasconde,
        test_runtime_metti_in_contenitore,
        test_runtime_metti_su_supporto,
        test_runtime_metti_in_contenitore_chiuso_rifiutato,
        test_runtime_conseguenza_sposta_in_contenitore,
        # Livello 3 — proprietà opposte dichiarabili (M5)
        test_opposti_dichiarati,
        test_opposti_default_aperta_chiusa,
        test_concordanza_genere_proprieta,
        # Livello 3 — condizioni di fine partita
        test_fine_partita_vinci,
        test_fine_partita_perdi_termina,
        test_fine_partita_con_altre_conseguenze,
        test_runtime_partita_finita_helper,
        # Livello 3 — stato astratto / variabili 'stato' (G3)
        test_stato_dichiarazione_e_valore_iniziale,
        test_stato_dichiarazione_senza_valore_e_none,
        test_stato_condizione_e_conseguenza,
        test_stato_condizione_negata,
        test_stato_disgiunto_da_proprieta_oggetto,
        test_scanner_raccoglie_variabili,
        # Livello 3 — contatori numerici
        test_contatore_dichiarazione_default_zero,
        test_contatore_aumenta_diminuisci,
        test_contatore_diventa,
        test_contatore_confronti,
        test_scanner_raccoglie_contatori,
        # Livello 3 — eventi a turni
        test_evento_al_turno,
        test_evento_ogni_turni,
        test_evento_numero_invalido_warning,
        test_runtime_eventi_a_turni,
        # Livello 8 — demoni / eventi condizionali
        test_demone_compila,
        test_demone_quando_fronte_di_salita,
        test_demone_quando_baseline_niente_falso_fronte,
        test_demone_quando_scatta_una_sola_volta,
        test_demone_ogni_turno_a_livello,
        test_demone_cascata_un_solo_passaggio,
        # 0.16.0 — valore iniziale dei contatori
        test_contatore_valore_iniziale,
        test_contatore_valore_iniziale_ordine_libero,
        test_contatore_valore_iniziale_in_condizione,
        # Livello 2.5 — Passata 1 (scanner symbol-table) e parole riservate
        test_scanner_raccoglie_stanze_e_oggetti,
        test_scanner_nomi_multiparola,
        test_scanner_connessione_introduce_stanze,
        test_scanner_ignora_punti_nelle_stringhe,
        test_parole_riservate_coprono_le_keyword,
        # Livello 2.5 — guardia anti-ambiguità permanente
        test_guardia_lalr_si_costruisce_senza_conflitti,
        test_guardia_zero_ambiguita,
        test_guardia_nome_con_parola_chiave_disambiguato,
        # Livello 5 — interpolazione di testo dinamico [var] (0.9.1)
        test_interpolazione_contatore,
        test_interpolazione_stato,
        test_interpolazione_nome_oggetto,
        test_interpolazione_in_descrizione,
        test_interpolazione_sconosciuto_resta_letterale_e_warning,
        test_interpolazione_stato_non_impostato_vuoto,
        test_interpolazione_nessun_warning_se_noto,
        # Livello 5 — regole globali senza oggetto (0.9.2)
        test_regola_globale_compila_senza_bersaglio,
        test_regola_globale_condizione_falsa_non_scatta,
        test_regola_globale_condizione_vera_scatta,
        test_regola_globale_senza_condizione_scatta_sempre,
        test_regola_specifica_precede_globale,
        test_regola_globale_esegue_conseguenza,
        # Livello 5 — descrizioni condizionali (0.9.3)
        test_descrizione_condizionale_compila,
        test_descrizione_condizionale_base_quando_falsa,
        test_descrizione_condizionale_variante_quando_vera,
        test_descrizione_condizionale_prima_vera_vince,
        test_descrizione_condizionale_su_stanza,
        test_descrizione_condizionale_con_interpolazione,
        # Livello 5 — concordanza grammaticale italiana (0.9.4)
        test_concordanza_inferenza_genere_numero,
        test_concordanza_frase_indeterminativa,
        test_concordanza_oggetto_metodo,
        test_concordanza_elenco_stanza_singolari,
        test_concordanza_elenco_plurale,
        # Livello 5b — NPC e dialoghi, fondazione (0.10.1)
        test_npc_dichiarazione,
        test_dialogo_struttura,
        test_dialogo_avvio_runtime,
        test_dialogo_scelta_chiude,
        test_dialogo_scelta_per_testo,
        test_dialogo_uscita_universale_non_esce_dal_gioco,
        test_dialogo_non_consuma_turno,
        test_dialogo_battuta_interpolata,
        test_personaggio_senza_dialogo_warning,
        test_dialogo_su_non_personaggio_errore,
        # Livello 5b — ramificazione dei dialoghi (0.10.2)
        test_ramificazione_struttura,
        test_ramificazione_transizione_runtime,
        test_ramificazione_ritorno_e_chiusura,
        test_ramificazione_nodo_inesistente_warning,
        # Livello 5b — conseguenze sulle scelte (0.10.3)
        test_conseguenza_scelta_struttura,
        test_conseguenza_scelta_modifica_mondo,
        test_conseguenza_scelta_fine_partita,
        # Livello 5b — opzioni condizionali (0.10.4)
        test_opzione_condizionale_struttura,
        test_opzione_condizionale_nascosta_se_falsa,
        test_opzione_condizionale_visibile_se_vera,
        test_opzione_condizionale_selezione_per_numero_coerente,
        # Livello 6 — linter semantico (0.11.1)
        test_lint_stanza_irraggiungibile,
        test_lint_stanza_collegata_non_segnalata,
        test_lint_oggetto_orfano,
        test_lint_oggetto_collocato_non_orfano,
        test_lint_oggetto_introdotto_da_conseguenza_non_orfano,
        test_lint_regola_morta_specifica,
        test_lint_regola_condizionale_non_morta,
        test_lint_regola_globale_morta,
        test_lint_variabile_inutilizzata,
        test_lint_variabile_usata_in_interpolazione,
        test_lint_variabile_usata_in_condizione,
        # Livello 6 — moduli / import multi-.fav (0.11.2)
        test_include_basico,
        test_include_dedup,
        test_include_ciclo,
        test_include_path_relativo,
        test_include_file_mancante,
        test_include_errore_attribuito_al_file,
        # Livello 6 — spec EBNF formale versionata (0.11.3)
        test_spec_ebnf_esiste,
        test_spec_ebnf_allineata_alla_grammatica,
        test_spec_ebnf_documenta_terminali_chiusi,
        # Livello 7 — capacità di trasporto
        test_capacita_dichiarazione,
        test_capacita_blocca_oltre_limite,
        test_capacita_bonus_additivo,
        test_capacita_illimitata_default,
        test_capacita_zero,
        # [0.30.0] Cassetto A — A1 nomi non validi, A3 'dire' opzionale, A4 idioma direzione
        test_a1_nome_con_carattere_non_valido_errore,
        test_a1_nome_valido_con_accenti_apostrofo_spazi_ok,
        test_a3_regola_senza_dire_compila_ed_esegue,
        test_a3_regola_con_dire_resta_invariata,
        test_a4_sinonimo_direzione_avviso_mirato,
        test_a4_idioma_direzioni_opposte_funziona,
        # [0.31.0] Tema 1 — i contatori si parlano (operando-quantità + confronti)
        test_tema1a_contatore_come_quantita_in_di,
        test_tema1a_diventa_contatore,
        test_tema1a_di_letterale_invariato,
        test_tema1a_estrazione_casuale_in_intervallo_e_riproducibile,
        test_tema1a_estrazione_casuale_annulla_safe,
        test_tema1b_confronto_contatore_contatore,
        test_tema1b_confronto_letterale_invariato,
        test_tema1_operando_marca_contatore_come_usato,
        test_tema1_strutturato_serializza_operando,
        # [0.32.0] Tema 2 — casualità d'autore non-numerica (scelta di stato + probabilità)
        test_tema2b_scelta_stato_pesca_dall_elenco,
        test_tema2b_scelta_stato_riproducibile,
        test_tema2b_scelta_stato_annulla_safe,
        test_tema2b_un_solo_valore_e_deterministico,
        test_tema2b_non_collide_con_diventa_operando,
        test_tema2b_stato_solo_scelto_non_e_inutilizzato,
        test_tema2c_probabilita_in_intervallo,
        test_tema2c_probabilita_estremi,
        test_tema2c_probabilita_annulla_safe,
        test_tema2c_probabilita_in_regola_e_in_and,
        test_tema2c_serializza_chance_e_2b_pick,
        # [0.33.0] Tema 4 — il mondo che cambia in scena (buio commutabile + battuta condizionale)
        test_tema4a_diventa_buia_spegne_la_luce,
        test_tema4a_diventa_illuminata_riaccende,
        test_tema4a_chiara_e_un_sinonimo_di_illuminata,
        test_tema4a_annulla_safe,
        test_tema4a_bersaglio_non_stanza_e_errore,
        test_tema4a_proprieta_non_di_luce_e_errore,
        test_tema4b_battuta_condizionale_prima_vera_vince,
        test_tema4b_battuta_condizionale_runtime,
        test_tema4b_battuta_condizionale_con_segnaposto,
        test_tema4b_battuta_incondizionata_resta_compatibile,
        # Livello 2.5 — errori d'autore migliori
        test_errore_entita_sconosciuta,
        test_errore_entita_suggerimento,
        test_errore_sintassi_resta_generico,
        test_storia_esempio_compila,
        # 0.18.0 — A1: regole a DUE OGGETTI che valutano la clausola 'se'
        test_due_oggetti_se_condizionale_vince_sulla_semplice,
        test_due_oggetti_se_falso_senza_fallback_cade_su_default,
        test_due_oggetti_prep_tollerante_resta_attiva,
        # 0.18.0 — A2: genitivo 'dei' nelle descrizioni
        test_descrizione_genitivo_dei,
        test_descrizione_genitivi_singolari_restano_validi,
        # 0.18.0 — A5: copula plurale 'sono'
        test_copula_sono_dichiarazioni,
        test_copula_sono_proprieta_posizione,
        test_copula_sono_condizioni_e_conseguenze,
        test_copula_e_ancora_valida,
        # 0.27.0 — Revisione totale (Lotto 1): copula plurale stati/contatori (A),
        # accesa/spenta opposte di default (B), 'lascia' al buio (C), nomi propri (M4)
        test_copula_sono_stato_e_contatore,
        test_copula_partono_da_contatore_plurale,
        test_accesa_spenta_opposte_di_default,
        test_lascia_bloccato_al_buio,
        test_prima_maiuscola_preserva_nomi_propri,
        test_proprieta_con_prefisso_preposizione,
        test_turno_atomico_su_eccezione,
        test_dialogo_annullabile_come_unita,
        # 0.18.0 — A3: normalizzazione NFC degli accenti
        test_accenti_nfc_normalizzazione_nome,
        test_accenti_risoluzione_runtime_nfd,
        test_accenti_sorgente_nfd_compila,
        # 0.18.0 — A4: preposizioni d'azione articolate
        test_prep_azione_articolata_compila,
        test_prep_azione_articolata_runtime,
        test_prep_azione_semplice_resta_valida,
        # 0.18.0 — B: nuovi costrutti di design
        test_contatore_al_massimo_lte,
        test_contatore_diverso_neq,
        test_non_gruppo_b7,
        test_posizione_giocatore_b1,
        test_teletrasporto_giocatore_b2,
        test_teletrasporto_stanza_inesistente_errore,
        test_esito_personalizzato_b3,
        test_esito_default_resta_senza_testo,
        # 0.18.0 — B6: verbi personalizzati multi-parola
        test_verbo_multiparola_dichiarazione_e_regola,
        test_verbo_multiparola_runtime,
        test_verbo_monoparola_resta_valido,
        # 0.19.0 — A7: verbi intransitivi
        test_verbo_intransitivo_scatta_senza_oggetto,
        test_verbo_intransitivo_con_conseguenza,
        test_verbo_transitivo_resta_default,
        # 0.19.0 — A8: inventario iniziale del giocatore
        test_inventario_iniziale,
        test_inventario_iniziale_oggetto_inesistente_e_errore,
        test_inventario_iniziale_order_independent,
        # 0.19.0 — A9: tick silenzioso (dire opzionale in eventi/demoni)
        test_evento_silenzioso,
        test_demone_silenzioso,
        test_evento_con_dire_resta_valido,
        # 0.20.0 — A1: pronomi e anafora
        test_anafora_clitico_femminile,
        test_anafora_clitico_maschile_da_elenco_stanza,
        test_anafora_mismatch_genere,
        test_anafora_riferito_non_raggiungibile,
        test_anafora_pronome_tonico,
        test_anafora_plurale,
        test_anafora_nessun_falso_positivo,
        # 0.21.0 — A3: comandi di servizio (annulla / ancora)
        test_annulla_disfa_ultimo_turno,
        test_annulla_ripristina_contatore_e_turno,
        test_annulla_multiplo,
        test_annulla_niente_da_annullare,
        test_ancora_ripete_ultimo_comando,
        test_ancora_niente_da_ripetere,
        # 0.22.0 — A2: varietà nelle risposte (descrizioni alternate)
        test_descrizione_sequenza,
        test_descrizione_casuale_niente_ripetizione_immediata,
        test_descrizione_casuale_deterministica,
        test_descrizione_varianti_annulla_riavvolge,
        test_descrizione_varianti_interpolano,
        test_descrizione_singola_resta_valida,
        test_descrizione_condizionale_a_varianti,
        # [0.24.0 / A4] Buio e luce
        test_a4_parsing_buia_e_illumina,
        test_a4_buio_blocca_esamina_e_prendi,
        test_a4_guarda_mostra_buio_pesto,
        test_a4_torcia_in_inventario_illumina,
        test_a4_fonte_a_terra_rischiara,
        test_a4_torcia_spenta_non_illumina,
        test_a4_accendi_la_luce_via_regola,
        test_a4_luce_in_contenitore_chiuso_non_illumina,
        test_a4_luce_in_contenitore_aperto_illumina,
        test_a4_stanza_non_buia_sempre_visibile,
        test_a4_uscite_percorribili_al_buio,
        test_a4_demone_spegne_la_luce,
        test_a4_regola_autore_precede_il_buio,
        test_a4_concordanza_buio_maschile,
        test_a4_illumina_prima_della_dichiarazione,
        # [0.25.0 / A5] Movimento degli NPC
        test_a5_parsing_due_forme,
        test_a5_movimento_deterministico,
        test_a5_movimento_casuale_deterministico_col_seed,
        test_a5_annuncio_uscita_con_direzione,
        test_a5_annuncio_ingresso,
        test_a5_nessun_annuncio_altrove,
        test_a5_movimento_via_evento,
        test_a5_movimento_via_regola_giocatore,
        test_a5_cambia_stanza_senza_uscite_no_op,
        test_a5_destinazione_inesistente_errore,
        # [0.26.0 / A6] Sinonimi di verbo
        test_a6_parsing_e_registrazione,
        test_a6_sinonimo_si_comporta_come_il_verbo,
        test_a6_sinonimo_attiva_le_regole_del_canonico,
        test_a6_il_canonico_continua_a_funzionare,
        test_a6_bersaglio_sconosciuto_warning,
        test_a6_piu_sinonimi,
        # Robustezza console (debito R8 — fix cp1252)
        test_robustezza_console_cp1252_non_crasha,
    ]
    print("=" * 60)
    print("FAVELLA 1 — Suite di test del linguaggio (v0.33.0)")
    print("=" * 60)
    for t in tests:
        t()
    print("-" * 60)
    print(f"RISULTATO: {_PASS} passati, {_FAIL} falliti")
    if _FAILS:
        print("Falliti:")
        for f in _FAILS:
            print(f"  - {f}")
    print("=" * 60)
    sys.exit(1 if _FAIL else 0)


if __name__ == "__main__":
    main()
