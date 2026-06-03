# test_linguaggio.py
# Suite di test del LINGUAGGIO FAVELLA 1 (v0.14.0)
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
    percorso = os.path.join(os.path.dirname(__file__), "esempi", "demo", "storia.fav")
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


def test_verbo_personalizzato_multiparola_warning():
    print("[verbo personalizzato: multiparola = warning, ignorato]")
    src = (
        "La cella è una stanza.\n"
        '"dai un calcio" è un comando.\n'
    )
    mondo, log = compila(src)
    _check(mondo is not None, "compila comunque (warning non bloccante)")
    _check(mondo and not mondo.verbi_personalizzati, "il comando multiparola non è registrato")
    _check("multiparola" in log.lower(), "il log avvisa che il comando multiparola è ignorato")


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
    # [Livello 5] Interpolazione [var]: vive DENTRO le virgolette, dunque non
    # deve introdurre alcuna ambiguità grammaticale (segnaposto su contatore e
    # oggetto, entrambi dichiarati sopra).
    'Invece di esamina la scatola: dire "Hai [punteggio] punti vicino a [chiave].".\n'
    # [Livello 5] Regola GLOBALE senza bersaglio: scatta sul solo verbo + condizione.
    'Invece di guarda se il punteggio è almeno 3: dire "Una luce pulsa.".\n'
    # [Livello 5] Descrizione CONDIZIONALE: clausola 'se' tra ENTITA e "è".
    'La descrizione della porta di ferro se l\'allarme è attivo è "Sigillata.".\n'
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
                          "grammatica-0.16.0.md")


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
           "documentazione/grammatica-0.16.0.md è presente")


def test_spec_ebnf_allineata_alla_grammatica():
    print("[spec EBNF: cita tutte le regole def_/cond_/cons_ della grammatica]")
    if not os.path.exists(_SPEC_EBNF):
        _check(False, "spec EBNF mancante")
        return
    with open(_SPEC_EBNF, "r", encoding="utf-8") as f:
        spec = f.read()
    nomi = _nomi_regole_grammatica()
    mancanti = sorted(n for n in nomi if n not in spec)
    _check(not mancanti,
           f"la spec cita tutte le regole def_/cond_/cons_ (mancanti: {mancanti})")


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
        test_verbo_personalizzato_multiparola_warning,
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
        # Livello 2.5 — errori d'autore migliori
        test_errore_entita_sconosciuta,
        test_errore_entita_suggerimento,
        test_errore_sintassi_resta_generico,
        test_storia_esempio_compila,
    ]
    print("=" * 60)
    print("FAVELLA 1 — Suite di test del linguaggio (v0.14.0)")
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
