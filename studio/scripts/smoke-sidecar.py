"""Prova del motore congelato di Favella Studio.

Lancia dist/favella_engine[.exe], gli manda tre richieste JSON-RPC su stdio e verifica
le risposte: che il motore si carichi (engineLoaded), che dica la versione e che
compili e giochi davvero una storia (con i pulsanti-verbo) e che gli strumenti per le storie
a più file (sorgenti non salvate, riordino, rinomina) funzionino. Esce con 1 se qualcosa
non va, così la CI si ferma PRIMA di impacchettare un installer rotto.

Uso (dalla radice del repository):  python studio/scripts/smoke-sidecar.py
"""
import json
import os
import subprocess
import sys
import tempfile

RADICE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ESEGUIBILE = os.path.join(RADICE, "dist", "favella_engine.exe" if os.name == "nt" else "favella_engine")
STORIA = 'La cucina è una stanza.\nLa mela è una cosa.\nLa mela è prendibile.\nLa mela è nella cucina.\n'
# Una storia a due file, per gli strumenti dello Studio 1.1.
PRINCIPALE = 'Includi "modulo.fav".\nLa cucina è una stanza.\nLa descrizione della cucina è "Fredda.".\n'
MODULO = 'La mela è una cosa.\nLa mela è nella cucina.\n'


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if not os.path.isfile(ESEGUIBILE):
        print(f"MANCA {ESEGUIBILE}: congela prima il motore (pyinstaller favella_engine.spec).")
        return 1
    with tempfile.TemporaryDirectory() as cartella:
        percorso = os.path.join(cartella, "prova.fav")
        with open(percorso, "w", encoding="utf-8") as f:
            f.write(STORIA)
        richieste = [
            {"jsonrpc": "2.0", "id": 1, "method": "engine.version", "params": {}},
            {"jsonrpc": "2.0", "id": 2, "method": "session.start", "params": {"path": percorso}},
            {"jsonrpc": "2.0", "id": 3, "method": "session.send", "params": {"command": "prendi la mela"}},
            {"jsonrpc": "2.0", "id": 4, "method": "world.words", "params": {"path": percorso}},
            {"jsonrpc": "2.0", "id": 5, "method": "game.exportHtml", "params": {"path": percorso}},
        ]
        principale = os.path.join(cartella, "principale.fav")
        modulo = os.path.join(cartella, "modulo.fav")
        with open(principale, "w", encoding="utf-8") as f:
            f.write(PRINCIPALE)
        with open(modulo, "w", encoding="utf-8") as f:
            f.write(MODULO)
        viva = MODULO + "La pera è una cosa.\nLa pera è nella cucina.\n"
        richieste += [
            {"jsonrpc": "2.0", "id": 6, "method": "world.outline",
             "params": {"path": principale, "sources": {modulo: viva}}},
            {"jsonrpc": "2.0", "id": 7, "method": "story.reorder", "params": {"path": principale}},
            {"jsonrpc": "2.0", "id": 8, "method": "entity.rename",
             "params": {"path": principale, "name": "La cucina", "newName": "Il tinello"}},
            {"jsonrpc": "2.0", "id": 9, "method": "entity.references",
             "params": {"path": principale, "name": "La mela"}},
        ]
        ingresso = "".join(json.dumps(r) + "\n" for r in richieste)
        env = dict(os.environ, PYTHONUTF8="1", PYTHONIOENCODING="utf-8")
        esito = subprocess.run([ESEGUIBILE], input=ingresso, capture_output=True, text=True,
                               encoding="utf-8", timeout=180, env=env)
    risposte, pronto = {}, None
    for riga in esito.stdout.splitlines():
        try:
            m = json.loads(riga)
        except ValueError:
            continue
        if m.get("id") is None and m.get("method") == "server/ready":
            pronto = m.get("params")
        elif m.get("id") is not None:
            risposte[m["id"]] = m

    errori = []
    if not pronto or not pronto.get("engineLoaded"):
        errori.append(f"il motore non si carica: {pronto}")
    if "result" not in risposte.get(1, {}):
        errori.append(f"engine.version: {risposte.get(1)}")
    avvio = risposte.get(2, {}).get("result") or {}
    if not avvio.get("ok") or "La cucina" not in avvio.get("output", ""):
        errori.append(f"session.start: {risposte.get(2)}")
    if not (avvio.get("buttons") or {}).get("verbi"):
        errori.append("session.start: mancano i pulsanti-verbo")
    if "Preso" not in (risposte.get(3, {}).get("result") or {}).get("output", ""):
        errori.append(f"session.send: {risposte.get(3)}")
    if not (risposte.get(4, {}).get("result") or {}).get("ok"):
        errori.append(f"world.words: {risposte.get(4)}")
    html = (risposte.get(5, {}).get("result") or {}).get("html", "")
    if "<html" not in html.lower():
        errori.append(f"game.exportHtml: {str(risposte.get(5))[:200]}")
    nomi = [o.get("name") for o in (risposte.get(6, {}).get("result") or {}).get("objects", [])]
    if nomi != ["La mela", "La pera"]:
        errori.append(f"world.outline con una sorgente non salvata: {nomi}")
    riordino = risposte.get(7, {}).get("result") or {}
    if not riordino.get("ok") or len(riordino.get("files", [])) != 2:
        errori.append(f"story.reorder: {str(risposte.get(7))[:200]}")
    rinomina = risposte.get(8, {}).get("result") or {}
    if not rinomina.get("ok") or len(rinomina.get("files", [])) != 2:
        errori.append(f"entity.rename: {str(risposte.get(8))[:200]}")
    if len((risposte.get(9, {}).get("result") or {}).get("items", [])) != 2:
        errori.append(f"entity.references: {str(risposte.get(9))[:200]}")
    if errori:
        print("MOTORE CONGELATO: NON FUNZIONA")
        for e in errori:
            print(" -", e)
        print(esito.stderr[-1500:])
        return 1
    print(f"MOTORE CONGELATO OK — versione {(risposte.get(1, {}).get('result') or {}).get('engine', '?')}, pagina esportata {len(html) // 1024} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
