# favella.py
# Entry-point unico della distribuzione di FAVELLA 1 (il LINGUAGGIO).
#
# È uno strato SOTTILE sopra i moduli del motore (gioco.py, compilatore.py,
# collaudo.py): non contiene logica di linguaggio, smista soltanto i sottocomandi
# all'implementazione già esistente e testata. Il motore resta congelato.
#
# Sottocomandi:
#   favella1 gioca   <storia.fav>     gioca/compila una storia da terminale
#   favella1 compila <storia.fav>     compila e mostra errori/avvisi (non gioca)
#   favella1 collaudo <storia.fav>    collaudatore statico (catena della vittoria)
#   favella1 playground [storia.fav]  apre l'editor+motore nel browser (offline)
#   favella1 esporta  <storia.fav>    genera un .html autoportante giocabile
#   favella1 versione                 stampa la versione del motore
#
# Alias inglesi accettati: play, check, test, export, version.

import argparse
import os
import sys


def _console_utf8():
    """La console di Windows è cp1252 di default: i nomi italiani accentati
    passano, ma per sicurezza riconfiguriamo stdout/stderr a UTF-8 con
    errors='replace'. Fonte unica condivisa con gioco.py in utils."""
    from utils import assicura_console_utf8
    assicura_console_utf8()


def _versione():
    from strutture import VERSIONE_MOTORE
    return VERSIONE_MOTORE


def cmd_gioca(args):
    """Compila la storia e avvia il ciclo di gioco interattivo (delega a gioco)."""
    from compilatore import analizza_file
    from gioco import gioca
    if not os.path.isfile(args.storia):
        print(f"[FAVELLA 1] File non trovato: '{args.storia}'.")
        return 1
    print(f"[FAVELLA 1] Compilazione di '{args.storia}' in corso...")
    mondo = analizza_file(args.storia)
    if mondo is None:
        print("\n[FAVELLA 1] Compilazione fallita. Correggi gli errori e riprova.")
        return 1
    gioca(mondo)
    return 0


def cmd_compila(args):
    """Valida la storia e riporta errori/avvisi in forma leggibile (non gioca)."""
    from compilatore import analizza_file_strutturato
    if not os.path.isfile(args.storia):
        print(f"[FAVELLA 1] File non trovato: '{args.storia}'.")
        return 1
    diag = analizza_file_strutturato(args.storia)
    errori = diag.get("errors", [])
    avvisi = diag.get("warnings", [])

    def _riga(d):
        dove = ""
        f = d.get("file")
        ln = d.get("line")
        if f and ln:
            dove = f" [{os.path.basename(f)}:{ln}]"
        elif ln:
            dove = f" [riga {ln}]"
        return f"  - {d.get('message', '')}" + dove

    for d in errori:
        print("[ERRORE]" + _riga(d))
    for d in avvisi:
        print("[avviso]" + _riga(d))

    if diag.get("ok"):
        riassunto = diag.get("worldSummary") or {}
        stanze = riassunto.get("rooms")
        oggetti = riassunto.get("objects")
        extra = ""
        if stanze is not None and oggetti is not None:
            ns = len(stanze) if isinstance(stanze, (list, tuple)) else stanze
            no = len(oggetti) if isinstance(oggetti, (list, tuple)) else oggetti
            extra = f" ({ns} stanze, {no} oggetti)"
        n = f" — {len(avvisi)} avviso/i" if avvisi else ""
        print(f"[FAVELLA 1] Compilazione riuscita{extra}.{n}")
        return 0
    print(f"[FAVELLA 1] Compilazione fallita: {len(errori)} errore/i.")
    return 1


def cmd_collaudo(args):
    """Collaudatore statico: catena della vittoria + avvisi del linter."""
    from collaudo import main as collaudo_main
    return collaudo_main([args.storia])


def cmd_playground(args):
    """Apre il playground locale (editor + motore reale) nel browser."""
    from favella_playground import avvia_playground
    return avvia_playground(percorso_iniziale=args.storia, porta=args.porta,
                            apri_browser=not args.no_browser)


def cmd_esporta(args):
    """Genera un .html autoportante che gioca la storia nel browser (Pyodide)."""
    from compilatore import esporta_html
    if not os.path.isfile(args.storia):
        print(f"[FAVELLA 1] File non trovato: '{args.storia}'.")
        return 1
    res = esporta_html(args.storia, titolo=args.titolo)
    if not res.get("ok"):
        print(f"[FAVELLA 1] Esportazione fallita: {res.get('reason')}")
        return 1
    destinazione = args.output or (os.path.splitext(args.storia)[0] + ".html")
    with open(destinazione, "w", encoding="utf-8") as f:
        f.write(res["html"])
    print(f"[FAVELLA 1] Gioco esportato in '{destinazione}'.")
    print("            È un singolo file HTML: aprilo in un browser (serve la "
          "rete al primo avvio per scaricare Pyodide).")
    return 0


def cmd_versione(_args):
    print(f"FAVELLA 1 — motore v{_versione()}")
    return 0


def costruisci_parser():
    p = argparse.ArgumentParser(
        prog="favella1",
        description="FAVELLA 1 — l'italiano come linguaggio di programmazione "
                    "narrativa. Gioca, compila, collauda o programma storie .fav.",
    )
    p.add_argument("-V", "--version", action="version",
                   version=f"FAVELLA 1 — motore v{_versione()}")
    sub = p.add_subparsers(dest="comando", metavar="comando")

    g = sub.add_parser("gioca", aliases=["play"], help="gioca/compila una storia .fav")
    g.add_argument("storia", help="percorso del file .fav radice")
    g.set_defaults(func=cmd_gioca)

    c = sub.add_parser("compila", aliases=["check"],
                       help="compila e mostra errori/avvisi (non gioca)")
    c.add_argument("storia", help="percorso del file .fav radice")
    c.set_defaults(func=cmd_compila)

    t = sub.add_parser("collaudo", aliases=["test"],
                       help="collaudatore statico (catena della vittoria)")
    t.add_argument("storia", help="percorso del file .fav radice")
    t.set_defaults(func=cmd_collaudo)

    pg = sub.add_parser("playground", help="apri l'editor + motore nel browser (offline)")
    pg.add_argument("storia", nargs="?", default=None,
                    help="storia .fav iniziale da caricare (opzionale)")
    pg.add_argument("--porta", type=int, default=0,
                    help="porta del server locale (0 = automatica)")
    pg.add_argument("--no-browser", action="store_true",
                    help="non aprire automaticamente il browser")
    pg.set_defaults(func=cmd_playground)

    e = sub.add_parser("esporta", aliases=["export"],
                       help="genera un .html autoportante giocabile (Pyodide)")
    e.add_argument("storia", help="percorso del file .fav radice")
    e.add_argument("-o", "--output", default=None, help="file .html di destinazione")
    e.add_argument("--titolo", default=None, help="titolo del gioco esportato")
    e.set_defaults(func=cmd_esporta)

    v = sub.add_parser("versione", aliases=["version"], help="stampa la versione del motore")
    v.set_defaults(func=cmd_versione)

    return p


def main(argv=None):
    _console_utf8()
    parser = costruisci_parser()
    args = parser.parse_args(argv)
    if not getattr(args, "func", None):
        parser.print_help()
        return 0
    try:
        return args.func(args)
    except KeyboardInterrupt:
        print("\n[FAVELLA 1] Interrotto.")
        return 130


if __name__ == "__main__":
    sys.exit(main())
