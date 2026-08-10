# Branding — Favella Studio

Materiale di marca dell'IDE: archivio dei concept, **icona ufficiale** e set multipiattaforma.

## Icona ufficiale (decisa 2026-06-18)

Il brand di Favella Studio è il **concept `…0217 (1)`** (famiglia «run + editor»: finestra
con 3 pallini, fiamma con ▶ play, caret, libro a ventaglio, graffe `{ }`), **isolato** su
trasparenza e **upscalato** per l'uso in ogni contesto. È l'immagine *originale fedele*
(gradienti veri), non una reinterpretazione.

- `favella-studio-icon-isolata.png` — concept isolato (sfondo + ombra rimossi), 1635².
- `icone/favella-studio-2048.png` · `icone/favella-studio-4096.png` — **master upscalati**
  (Lanczos + denoise leggero + micro-sharpen), quadrati, esterno trasparente.

## Set d'icone multipiattaforma — `icone/`

| File | Piattaforma | Note |
|------|-------------|------|
| `favella-studio.ico` | **Windows** | multi-risoluzione 16/24/32/48/64/128/256 |
| `favella-studio.icns` | **macOS** | ICNS nativo valido, entry PNG 16→1024 |
| `icon.png` (1024²) | **Linux / universale** | sorgente unico per electron-builder |
| `png/favella-studio-{16…1024}.png` | Linux / hicolor | singole misure |
| `favella-studio.iconset/` | macOS (sorgente) | per rigenerare l'icns con `iconutil` su Mac |
| `favella-studio-{2048,4096}.png` | stampa / marketing | master ad alta risoluzione |

### Integrazione in electron-builder (IDE)
Copiare in `studio/build/` e referenziare nella sezione `build` di `package.json`:

```
studio/build/icon.ico    ← favella-studio.ico   (win.icon)
studio/build/icon.icns   ← favella-studio.icns  (mac.icon)
studio/build/icon.png    ← icon.png (1024²)      (linux.icon; fallback universale)
```

```jsonc
"build": {
  "win":   { "icon": "build/icon.ico" },
  "mac":   { "icon": "build/icon.icns" },
  "linux": { "icon": "build/icon.png" }   // electron-builder genera le misure hicolor
}
```
> In alternativa basta `build/icon.png` (1024²): electron-builder genera `.ico`/`.icns` da
> solo. I file espliciti danno però il controllo esatto delle misure.
> Per rigenerare l'icns su Mac: `iconutil -c icns favella-studio.iconset`.

### Compatibilità trattata
- **Windows**: `.ico` multi-size (Esplora risorse, taskbar, installer NSIS).
- **macOS**: `.icns` con entry da 16 a 1024 (Dock, Finder, retina @2x).
- **Linux**: PNG hicolor 16→1024 + `icon.png` 512/1024 (AppImage/.desktop).
- Angoli trasparenti (squircle) ⇒ resa corretta su sfondi chiari e scuri.

## Archivio concept — `loghi-archivio-2026-06-18/`
Gli **8 concept** AI originali (2026-06-18), integri. Famiglia A (libro+fiamma) e
famiglia B («run + editor»), da cui è stato scelto `…0217 (1)`.

## Ricostruzione vettoriale (alternativa, NON ufficiale)
`favella-studio-logo.svg` + `build_logo.py` — ridisegno pulito a mano con gradienti SVG
nativi (39 forme, ~4,6 KB, scalabile). **Non perfettamente sovrapponibile** all'originale:
conservato come base vettoriale editabile, ma il brand ufficiale è l'icona raster upscalata
qui sopra. `favella-studio-logo-TRACE-vtracer.svg` = ricalco letterale VTracer (riferimento).

## Palette di marca (dal banner 1.0.0)
navy `#081120` / `#03070f` · ciano `#22d3ee` · turchese `#2dd4bf` · smeraldo `#34d399` ·
fiamma ambra `#f59e0b`.

## Prossimi passi (da definire)
Lockup orizzontale con wordmark «Favella Studio» · variante macOS «floating» con margine ·
collegamento effettivo in `studio/build/` + `package.json` al prossimo build dell'installer.
