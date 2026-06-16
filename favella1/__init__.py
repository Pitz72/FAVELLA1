"""Risorse impacchettate di FAVELLA 1 (il LINGUAGGIO).

Questo package NON contiene logica del motore: il motore resta nei moduli
piatti alla radice (compilatore, strutture, gioco, …). Qui vivono soltanto i
DATI dell'ecosistema, così che siano reperibili sia da una copia del repo sia
da un'installazione `pip` dentro `site-packages`:

  - ``libreria/``  moduli .fav riusabili, da includere con ``Includi "…".``;
  - ``galleria/``  storie .fav brevi, complete e vincibili, già giocabili.

L'entry-point ``favella.py`` importa da qui ``LIBRERIA_DIR`` e ``GALLERIA_DIR``
per i sottocomandi ``favella1 libreria`` e ``favella1 galleria``.
"""

import os
import sys

# Cartella che contiene i dati (libreria/ e galleria/). In sviluppo e con pip è
# la cartella di questo package; nel bundle PyInstaller (one-dir) i dati sono
# copiati sotto '<_MEIPASS>/favella1' (vedi favella1.spec), quindi si privilegia
# _MEIPASS quando presente — stessa strategia di compilatore.esporta_html.
_meipass = getattr(sys, "_MEIPASS", None)
if _meipass and os.path.isdir(os.path.join(_meipass, "favella1")):
    RISORSE_DIR = os.path.join(_meipass, "favella1")
else:
    RISORSE_DIR = os.path.dirname(os.path.abspath(__file__))
LIBRERIA_DIR = os.path.join(RISORSE_DIR, "libreria")
GALLERIA_DIR = os.path.join(RISORSE_DIR, "galleria")

__all__ = ["RISORSE_DIR", "LIBRERIA_DIR", "GALLERIA_DIR"]
