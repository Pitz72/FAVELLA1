# rilascia-sul-pc.ps1 — i due passi del rilascio che richiedono le credenziali dell'autore:
#   1) la pubblicazione del pacchetto su PyPI (pip install favella1);
#   2) il deploy del sito su favella.eu (FTPS).
#
# Va lanciato DOPO che la GitHub Release esiste (lo script lo verifica e si ferma se manca),
# perché i link di download del sito puntano agli installer della release.
# Parte sempre da una copia nuova del repository (in una cartella temporanea), così non
# dipende da come è messa la tua cartella di lavoro.
#
# Uso (PowerShell):
#   powershell -ExecutionPolicy Bypass -File rilascia-sul-pc.ps1
#
# Richiede: Git, Python 3.10+, Node.js; il token di PyPI configurato per twine (~/.pypirc o
# TWINE_USERNAME / TWINE_PASSWORD) e le credenziali FTPS in
# C:\Users\Utente\.favella1-deploy\credentials.json (le legge scripts/deploy.mjs).

$ErrorActionPreference = "Stop"
$repo = "https://github.com/Pitz72/FAVELLA1.git"
$lavoro = Join-Path $env:TEMP "favella-rilascio"

function Passo($testo) { Write-Host ""; Write-Host "== $testo" -ForegroundColor Cyan }
function Controlla($esito, $messaggio) { if ($esito -ne 0) { throw $messaggio } }

Passo "Copia nuova del repository (ramo main)"
if (Test-Path $lavoro) { Remove-Item -Recurse -Force $lavoro }
git clone --depth 1 $repo $lavoro
Controlla $LASTEXITCODE "git clone non è riuscito."
Set-Location $lavoro

$versione = (python -c "from strutture import VERSIONE_MOTORE; print(VERSIONE_MOTORE)").Trim()
Controlla $LASTEXITCODE "Non riesco a leggere la versione del motore."
Write-Host "Versione del motore: $versione"

Passo "Controllo che la GitHub Release v$versione esista"
$asset = "https://github.com/Pitz72/FAVELLA1/releases/download/v$versione/favella1-setup-$versione-windows-x64.exe"
try {
    $r = Invoke-WebRequest -Uri $asset -Method Head -UseBasicParsing -MaximumRedirection 5
    Write-Host "Trovato l'installer per Windows (HTTP $($r.StatusCode))."
} catch {
    throw "La release v$versione non c'è ancora (manca $asset). Mi fermo: non pubblico niente."
}

Passo "PyPI: costruzione e controllo del pacchetto"
python -m pip install --upgrade build twine
Controlla $LASTEXITCODE "pip install non è riuscito."
python -m build --outdir dist_pypi
Controlla $LASTEXITCODE "La costruzione del pacchetto non è riuscita."
python -m twine check dist_pypi/*
Controlla $LASTEXITCODE "twine check non è passato: non pubblico."

Passo "PyPI: pubblicazione di favella1 $versione (non si può annullare)"
python -m twine upload dist_pypi/*
Controlla $LASTEXITCODE "Il caricamento su PyPI non è riuscito."

Passo "Sito: costruzione"
Set-Location (Join-Path $lavoro "landingpage")
npm install --no-audit --no-fund
Controlla $LASTEXITCODE "npm install non è riuscito."
npm run build
Controlla $LASTEXITCODE "La costruzione del sito non è riuscita."

Passo "Sito: deploy su favella.eu"
node scripts/deploy.mjs
Controlla $LASTEXITCODE "Il deploy non è riuscito."

Write-Host ""
Write-Host "Fatto: favella1 $versione su PyPI e sito pubblicato." -ForegroundColor Green
