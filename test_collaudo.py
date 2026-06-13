# test_collaudo.py
# Suite di test del COLLAUDATORE automatico (B1, Fase B1.1: analisi statica).
#
# Separata da test_linguaggio.py di proposito: collaudo.py e un CONSUMATORE del
# Mondo compilato e non tocca grammatica ne loop, quindi i 492 test del
# linguaggio restano per costruzione intatti.
#
# Esecuzione:  python test_collaudo.py
# Niente caratteri non-cp1252 nei print (vincolo d'ambiente Windows/PowerShell).

import io
import os
import sys
import tempfile
import contextlib

from compilatore import analizza_file
from collaudo import analizza_vincibilita, rendi_report_testuale

_QUI = os.path.dirname(os.path.abspath(__file__))

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
    """Compila una stringa .fav in un Mondo (stdout soppresso)."""
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
    return mondo


def _requisiti(catena):
    """Tutti i testi-requisito di una catena, in profondita."""
    fuori = []
    for nodo in catena:
        fuori.append(nodo["requisito"])
        for p in nodo["produttori"]:
            fuori += _requisiti(p["prerequisiti"])
    return fuori


# --- Storia VINCIBILE: catena della vittoria via possesso (prendi) ------------

def test_catena_vittoria_vincibile():
    print("[catena della vittoria su una storia vincibile]")
    src = (
        "La cella è una stanza.\n"
        "Il giocatore comincia in cella.\n"
        "Una chiave è una cosa.\n"
        "La chiave è in cella.\n"
        "La chiave è prendibile.\n"
        "La porta è una cosa.\n"
        "La porta è in cella.\n"
        "Invece di apri la porta se il giocatore ha la chiave: "
        'dire "Sei libero." e adesso vinci.\n'
    )
    mondo = compila(src)
    _check(mondo is not None, "la storia compila")
    rep = analizza_vincibilita(mondo)
    vitt = rep["vittoria"]
    _check(vitt["n_sorgenti"] == 1, "una sola sorgente di vittoria")
    _check(vitt["esito"] == "vincibile-staticamente",
           "esito: vincibile-staticamente")
    sorgente = vitt["sorgenti"][0]
    _check(sorgente["tipo"] == "regola", "la sorgente e una regola")
    _check(not sorgente["ostruzione_sospetta"], "nessuna ostruzione sospetta")
    requisiti = _requisiti(sorgente["catena"])
    _check(any("ha" in r and "chiave" in r for r in requisiti),
           "la catena richiede il possesso della chiave")
    # Il possesso della chiave e prodotto dalla raccolta standard (prendi).
    nodo_chiave = sorgente["catena"][0]
    da = [p["dove"] for p in nodo_chiave["produttori"]]
    _check(any("prendi" in d for d in da),
           "il possesso e prodotto dal comando standard 'prendi'")
    _check(not nodo_chiave["bloccante"], "il requisito non e bloccante")
    # La resa testuale non deve sollevare.
    testo = rendi_report_testuale(rep)
    _check("CATENA DELLA VITTORIA" in testo, "la resa testuale e prodotta")
    _check("LIMITE ONESTO" in testo, "il limite onesto e dichiarato nel report")


# --- Storia ROTTA: orfani / irraggiungibili / isolate / niente vittoria -------

def test_storia_rotta_rilevamenti():
    print("[rilevamento orfani / isolate / inutilizzati / niente vittoria]")
    src = (
        "La prima è una stanza.\n"
        "La seconda è una stanza.\n"            # mai collegata -> isolata
        "Il giocatore comincia in prima.\n"
        "Una gemma è una cosa.\n"               # mai collocata -> orfana
        "La polvere è un contatore.\n"          # mai usata -> inutilizzata
        "La leva è una cosa.\n"
        "La leva è in prima.\n"
        # condizione su proprieta mai assegnata -> regola irraggiungibile
        'Invece di esamina la leva se la leva è rotta: dire "Niente.".\n'
    )
    mondo = compila(src)
    _check(mondo is not None, "la storia rotta compila comunque (avvisi non bloccanti)")
    rep = analizza_vincibilita(mondo)

    _check(rep["vittoria"]["n_sorgenti"] == 0, "nessuna sorgente di vittoria")
    _check(rep["vittoria"]["esito"] == "nessuna-vittoria", "esito: nessuna-vittoria")

    lint = rep["linter"]
    _check(any("seconda" in w for w in lint["stanze_isolate"]),
           "stanza 'seconda' rilevata come isolata")
    _check(any("gemma" in w for w in lint["oggetti_orfani"]),
           "oggetto 'gemma' rilevato come orfano")
    _check(any("polvere" in w for w in lint["stati_inutilizzati"]),
           "contatore 'polvere' rilevato come inutilizzato")

    irr = rep["regole_irraggiungibili"]
    _check(any("rotta" in a for r in irr for a in r["atomi_mai_soddisfacibili"]),
           "regola con condizione 'rotta' mai soddisfacibile rilevata")


# --- Storia con OSTRUZIONE: vittoria dietro un requisito impossibile ----------

def test_ostruzione_possibile():
    print("[ostruzione: vittoria dietro una proprieta mai producibile]")
    src = (
        "La cella è una stanza.\n"
        "Il giocatore comincia in cella.\n"
        "La porta è una cosa.\n"
        "La porta è in cella.\n"
        # 'dorata' non è mai assegnata e la porta non è prendibile/producibile
        'Invece di apri la porta se la porta è dorata: dire "Hai vinto." e adesso vinci.\n'
    )
    mondo = compila(src)
    rep = analizza_vincibilita(mondo)
    vitt = rep["vittoria"]
    _check(vitt["n_sorgenti"] == 1, "una sorgente di vittoria")
    _check(vitt["esito"] == "ostruzione-possibile", "esito: ostruzione-possibile")
    _check(vitt["sorgenti"][0]["ostruzione_sospetta"], "ostruzione segnalata sulla sorgente")
    _check(any("dorata" in b for b in vitt["sorgenti"][0]["bloccanti"]),
           "il requisito bloccante 'dorata' e elencato")


# --- Verifica sulle DEMO REALI ------------------------------------------------

def _analizza_demo(percorso_relativo):
    path = os.path.join(_QUI, *percorso_relativo.split("/"))
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        mondo = analizza_file(path)
    return mondo


def test_demo_reali_vincibili():
    print("[demo reali: storia / relitto / salerno-reggio]")
    demo = [
        ("esempi/materiale-didattico/storia.fav", "storia (La Casa)"),
        ("esempi/demo/relitto-silente/relitto.fav", "Il Relitto Silente"),
        ("esempi/demo/salerno-reggio/salerno-reggio.fav", "Salerno-Reggio"),
    ]
    for percorso, nome in demo:
        mondo = _analizza_demo(percorso)
        _check(mondo is not None, f"{nome}: compila")
        if mondo is None:
            continue
        rep = analizza_vincibilita(mondo)
        # La resa testuale non deve sollevare su nessuna demo.
        testo = rendi_report_testuale(rep)
        _check(isinstance(testo, str) and len(testo) > 0, f"{nome}: report testuale prodotto")
        _check(rep["vittoria"]["esito"] == "vincibile-staticamente",
               f"{nome}: risulta vincibile-staticamente")
        _check(rep["vittoria"]["n_sorgenti"] >= 1, f"{nome}: almeno una sorgente di vittoria")


def main():
    tests = [
        test_catena_vittoria_vincibile,
        test_storia_rotta_rilevamenti,
        test_ostruzione_possibile,
        test_demo_reali_vincibili,
    ]
    print("=" * 60)
    print("TEST COLLAUDO (B1.1 - analisi statica)")
    print("=" * 60)
    for t in tests:
        t()
    print("-" * 60)
    print(f"RISULTATO: {_PASS} passati, {_FAIL} falliti")
    if _FAILS:
        print("Falliti:")
        for f in _FAILS:
            print(f"  - {f}")
    sys.exit(1 if _FAIL else 0)


if __name__ == "__main__":
    main()
