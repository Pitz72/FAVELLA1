# build-kdp.ps1 — Kit di stampa Amazon KDP della «Guida di Favella Studio».
#
#   pwsh ./build-kdp.ps1                      scrive nella cartella predefinita
#   pwsh ./build-kdp.ps1 -Uscita D:\Altra     scrive altrove
#
# Produce, FUORI dal repository (come il kit del Manuale di FAVELLA 1):
#   guida-interno-kdp.pdf   interno 6,69×9,61″, multiplo di 4 pagine, senza copertina
#   guida-copertina-kdp.pdf copertina completa (retro + dorso + fronte) con abbondanza
#   guida-copertina-kdp-anteprima.png
# Se cambia il numero di pagine dell'interno, aggiorna `pagine` in copertina-kdp.typ.
# Richiede Typst (>= 0.14). I font sono quelli del Manuale; Inter è di sistema.
param([string]$Uscita = 'C:\Users\Utente\Documents\KDP\FavellaStudio')

$root  = $PSScriptRoot
$fonts = Join-Path $root '..\..\documentazione\manuale\fonts'
New-Item -ItemType Directory -Force $Uscita | Out-Null

# Se Typst avvisa «layout did not converge» l'impaginazione non è stabile (numeri di pagina
# dell'indice o pagine vacat sbagliati): meglio fermarsi che stampare un interno incerto.
$msg = typst compile --input kdp=1 --font-path $fonts (Join-Path $root 'guida.typ') (Join-Path $Uscita 'guida-interno-kdp.pdf') 2>&1
if ($LASTEXITCODE -ne 0) { $msg; exit 1 }
if ($msg -match 'did not converge') { Write-Host 'ERRORE: l''impaginazione non converge: ritocca il testo o le misure.' -ForegroundColor Red; $msg; exit 1 }
typst compile --font-path $fonts (Join-Path $root 'copertina-kdp.typ') (Join-Path $Uscita 'guida-copertina-kdp.pdf')
if ($LASTEXITCODE -ne 0) { exit 1 }
typst compile --font-path $fonts --format png --ppi 60 (Join-Path $root 'copertina-kdp.typ') (Join-Path $Uscita 'guida-copertina-kdp-anteprima.png')
Write-Host "OK -> $Uscita" -ForegroundColor Green
