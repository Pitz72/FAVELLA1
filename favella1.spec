# -*- mode: python ; coding: utf-8 -*-
# favella1.spec — ricetta PyInstaller per la distribuzione di FAVELLA 1.
#
# Produce una build ONE-DIR (cartella, non one-file): avvio più rapido e meno
# falsi positivi antivirus rispetto a one-file. La cartella risultante
# (dist/favella1/) viene poi impacchettata per-OS dalla CI (NSIS / .dmg /
# AppImage) — vedi .github/workflows/release.yml e PACKAGING.md.
#
# Build locale:  pyinstaller favella1.spec
# Eseguibile:    dist/favella1/favella1[.exe]

import sys
from PyInstaller.utils.hooks import collect_all

# Icona dell'eseguibile: .ico su Windows; altrove PyInstaller la ignora (serve
# .icns per il .app macOS, che non produciamo: è una CLI).
_ICON = "packaging/icons/favella1.ico" if sys.platform == "win32" else None

# lark è una dipendenza con file di dati (grammatiche interne): --collect-all
# garantisce che moduli, binari e datas finiscano nel bundle.
lark_datas, lark_binaries, lark_hiddenimports = collect_all("lark")

# I 5 moduli del motore servono DUE volte:
#  1) come codice (importati → compilati nell'eseguibile);
#  2) come SORGENTE su disco, perché `esporta_html` li rilegge a runtime per
#     incorporarli nell'HTML autoportante (li cerca in sys._MEIPASS, cioè la
#     cartella del bundle). Per questo vanno aggiunti anche come `datas`.
ENGINE_SOURCES = [
    ("utils.py", "."),
    ("strutture.py", "."),
    ("libreria_azioni.py", "."),
    ("compilatore.py", "."),
    ("gioco.py", "."),
]

# Le avventure ufficiali, così l'eseguibile può giocarle subito dopo l'install.
DEMOS = [("esempi/demo", "esempi/demo")]

datas = lark_datas + ENGINE_SOURCES + DEMOS

a = Analysis(
    ["favella.py"],
    pathex=["."],
    binaries=lark_binaries,
    datas=datas,
    hiddenimports=lark_hiddenimports + [
        "compilatore", "gioco", "collaudo", "strutture",
        "libreria_azioni", "utils", "favella_playground",
    ],
    hookspath=[],
    runtime_hooks=[],
    excludes=[
        # Accessori non necessari alla CLI/playground: alleggeriscono il bundle.
        "tkinter", "PySide6", "PyQt5", "PyQt6", "numpy", "pandas",
    ],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="favella1",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,           # è una CLI: serve la console
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=_ICON,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name="favella1",
)
