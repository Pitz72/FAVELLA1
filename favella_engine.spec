# -*- mode: python ; coding: utf-8 -*-
# favella_engine.spec — ricetta PyInstaller del MOTORE di Favella Studio (il «sidecar»).
#
# Congela favella_server.py (il server JSON-RPC su stdio che l'IDE lancia) in UN solo
# eseguibile: dist/favella_engine[.exe]. electron-builder lo copia in resources/engine/
# (vedi studio/package.json → build.*.extraResources).
#
# Build:   pyinstaller --noconfirm favella_engine.spec
# Prova:   python studio/scripts/smoke-sidecar.py      (lancia l'eseguibile e lo interroga)
#
# Perché una spec e non una riga di comando: i moduli del motore sono dieci e ogni
# volta che ne nasce uno nuovo (come strumenti_ide ed esportazione nella 1.4.0) una
# lista scritta a mano nel workflow si dimentica. Qui l'elenco è uno, ed è controllato
# dai test (test_elenchi_dei_moduli_del_motore_allineati).

from PyInstaller.utils.hooks import collect_all

# lark costruisce la grammatica a runtime e carica risorse proprie: senza collect_all
# l'eseguibile congelato fallisce al primo parse.
lark_datas, lark_binaries, lark_hiddenimports = collect_all("lark")

# I cinque moduli del motore servono DUE volte: come codice (importati) e come
# SORGENTE su disco, perché `esporta_html` li rilegge per incorporarli nella pagina
# esportata (li cerca in sys._MEIPASS).
ENGINE_SOURCES = [
    ("favella_utils.py", "."),
    ("strutture.py", "."),
    ("libreria_azioni.py", "."),
    ("compilatore.py", "."),
    ("gioco.py", "."),
]

a = Analysis(
    ["favella_server.py"],
    pathex=["."],
    binaries=lark_binaries,
    datas=lark_datas + ENGINE_SOURCES,
    hiddenimports=lark_hiddenimports + [
        "compilatore", "strumenti_ide", "esportazione", "gioco",
        "strutture", "libreria_azioni", "favella_utils",
    ],
    hookspath=[],
    runtime_hooks=[],
    excludes=["tkinter", "PySide6", "PyQt5", "PyQt6", "numpy", "pandas"],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name="favella_engine",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,           # parla su stdio: serve la console (l'IDE la nasconde)
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
