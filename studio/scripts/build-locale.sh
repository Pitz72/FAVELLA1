#!/usr/bin/env bash
# Costruisce Favella Studio sul computer su cui lo lanci (macOS o Linux).
# Uso, dalla radice del repository:   ./studio/scripts/build-locale.sh
# Vedi studio/BUILD-MACOS.md. Per Windows c'è build-locale.ps1.
set -euo pipefail

RADICE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$RADICE"

dica() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }

command -v python3 >/dev/null || { echo "Serve Python 3.12 (python3 non trovato)."; exit 1; }
command -v node >/dev/null    || { echo "Serve Node.js 20+ (node non trovato)."; exit 1; }

case "$(uname -s)" in
  Darwin) TARGET="dist:mac" ;;
  Linux)  TARGET="dist:linux" ;;
  *) echo "Sistema non supportato da questo script (per Windows: build-locale.ps1)."; exit 1 ;;
esac

dica "1/5 Ambiente Python (.venv) con lark e pyinstaller"
python3 -m venv .venv
# shellcheck disable=SC1091
source .venv/bin/activate
python -m pip install --quiet --upgrade pip lark pyinstaller

dica "2/5 Test del motore"
python test_linguaggio.py | tail -n 3
python test_collaudo.py | tail -n 3

dica "3/5 Congelo il motore (PyInstaller)"
python -m PyInstaller --noconfirm favella_engine.spec

dica "4/5 Controllo che il motore congelato funzioni"
python studio/scripts/smoke-sidecar.py

dica "5/5 Costruisco l'app (electron-builder)"
cd studio
npm ci --no-audit --no-fund
CSC_IDENTITY_AUTO_DISCOVERY=false npm run "$TARGET"

dica "Fatto. Trovi l'app qui:"
ls -1 release | grep -E '\.(dmg|zip|AppImage)$' | sed "s#^#studio/release/#"
