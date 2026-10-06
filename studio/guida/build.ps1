# build.ps1 — Compila la «Guida di Favella Studio» in PDF accessibile (PDF/UA-1).
#
#   pwsh ./build.ps1            compila guida.typ -> guida-favella-studio.pdf
#   pwsh ./build.ps1 -Watch     ricompila a ogni salvataggio
#   pwsh ./build.ps1 -Png       esporta anche le pagine in anteprima/pag-{p}.png
#
# Richiede Typst (>= 0.14):  winget install --id Typst.Typst
# I font sono quelli del manuale di FAVELLA (Sora, Source Code Pro); Inter è di sistema.
# Le schermate (immagini/) si rifanno con landingpage/scripts/foto-guida-studio.mjs.
param([switch]$Watch, [switch]$Png)

$root  = $PSScriptRoot
$fonts = Join-Path $root '..\..\documentazione\manuale\fonts'
$src   = Join-Path $root 'guida.typ'
$pdf   = Join-Path $root 'guida-favella-studio.pdf'

if ($Watch) {
  typst watch --font-path $fonts --pdf-standard ua-1 $src $pdf
} else {
  typst compile --font-path $fonts --pdf-standard ua-1 $src $pdf
  if ($LASTEXITCODE -eq 0) { Write-Host "OK -> $pdf" -ForegroundColor Green }
  if ($Png -and $LASTEXITCODE -eq 0) {
    New-Item -ItemType Directory -Force (Join-Path $root 'anteprima') | Out-Null
    typst compile --font-path $fonts --format png --ppi 110 $src (Join-Path $root 'anteprima\pag-{p}.png')
  }
}
