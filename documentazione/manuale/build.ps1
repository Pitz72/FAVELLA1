# build.ps1 — Compila il «Manuale di Programmazione» di FAVELLA 1 in PDF.
#
#   pwsh ./build.ps1            compila manuale.typ -> manuale.pdf
#   pwsh ./build.ps1 -Watch     ricompila a ogni salvataggio
#   pwsh ./build.ps1 -Png       esporta anche le pagine in pag-{p}.png (anteprima)
#
# Richiede Typst (>= 0.13).  Installazione:  winget install --id Typst.Typst
param([switch]$Watch, [switch]$Png)

$root  = $PSScriptRoot
$fonts = Join-Path $root 'fonts'
$src   = Join-Path $root 'manuale.typ'
$pdf   = Join-Path $root 'manuale.pdf'

if ($Watch) {
  typst watch --font-path $fonts $src $pdf
} else {
  typst compile --font-path $fonts $src $pdf
  if ($LASTEXITCODE -eq 0) { Write-Host "OK -> $pdf" -ForegroundColor Green }
  if ($Png -and $LASTEXITCODE -eq 0) {
    typst compile --font-path $fonts --format png --ppi 150 $src (Join-Path $root 'pag-{p}.png')
  }
}
