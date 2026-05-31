# test_linguaggio.py
# Suite di test del LINGUAGGIO FAVELLA 1 (v0.6.1)
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
import tempfile
import contextlib

from compilatore import (
    analizza_file, costruisci_symbol_table, PAROLE_RISERVATE,
)

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
    percorso = os.path.join(os.path.dirname(__file__), "storia.fav")
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
        # Livello 2.5 — Passata 1 (scanner symbol-table) e parole riservate
        test_scanner_raccoglie_stanze_e_oggetti,
        test_scanner_nomi_multiparola,
        test_scanner_connessione_introduce_stanze,
        test_scanner_ignora_punti_nelle_stringhe,
        test_parole_riservate_coprono_le_keyword,
        test_storia_esempio_compila,
    ]
    print("=" * 60)
    print("FAVELLA 1 — Suite di test del linguaggio (v0.6.1)")
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
