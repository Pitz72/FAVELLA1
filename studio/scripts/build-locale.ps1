# Costruisce Favella Studio su Windows, sul computer su cui lo lanci.
# Uso, da PowerShell, nella radice del repository:   .\studio\scripts\build-locale.ps1
# Vedi studio/BUILD-MACOS.md per macOS e Linux (build-locale.sh).
$ErrorActionPreference = 'Stop'
$radice = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $radice

function Dica($t) { Write-Host "`n==> $t" -ForegroundColor Cyan }

if (-not (Get-Command python -ErrorAction SilentlyContinue)) { throw 'Serve Python 3.12 (python non trovato).' }
if (-not (Get-Command node -ErrorAction SilentlyContinue))   { throw 'Serve Node.js 20+ (node non trovato).' }

Dica '1/5 Ambiente Python (.venv) con lark e pyinstaller'
python -m venv .venv
& .\.venv\Scripts\Activate.ps1
python -m pip install --quiet --upgrade pip lark pyinstaller

Dica '2/5 Test del motore'
python test_linguaggio.py | Select-Object -Last 3
python test_collaudo.py | Select-Object -Last 3

Dica '3/5 Congelo il motore (PyInstaller)'
python -m PyInstaller --noconfirm favella_engine.spec

Dica '4/5 Controllo che il motore congelato funzioni'
python studio\scripts\smoke-sidecar.py
if ($LASTEXITCODE -ne 0) { throw 'Il motore congelato non funziona.' }

Dica "5/5 Costruisco l'installer (electron-builder)"
Set-Location studio
npm ci --no-audit --no-fund
$env:CSC_IDENTITY_AUTO_DISCOVERY = 'false'
npm run dist:win

Dica 'Fatto. Trovi l''installer qui:'
Get-ChildItem release -Filter *.exe | ForEach-Object { "studio\release\$($_.Name)" }
