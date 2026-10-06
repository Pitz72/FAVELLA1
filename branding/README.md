# Branding FAVELLA 1

Casa unica del materiale di marca. Qui vive la **fonte** (master del kit 2026);
gli asset effettivamente consumati da README/pacchetto/installer/sito stanno nei
loro punti di consumo (vedi in fondo). Dal 2026-08-10 è tutto versionato, master
compresi.

## Struttura

| Cartella | Contenuto |
|---|---|
| `marchi/` | Marchi ufficiali 2026, master: `logo.png`, `banner.png` (senza versione), `icona-app.png`, `icona-trasparente.png` |
| `favicon/` | Set favicon derivati (16 → 512 px) + `favicon.ico` |
| `materiale/` | Materiale informativo pubblico: banner e infografiche versionati (vedi sotto) |
| `archivio-2025/` | Vecchio branding pre-2026, tenuto come cronaca |

## `materiale/` — banner e infografiche

Le grafiche **attuali** (ottobre 2026) si rifanno tutte con un comando, che legge
versioni e numeri dalle costanti del sito (`landingpage/src/constants.tsx`) e le
pagine dal PDF del manuale:

```bash
cd landingpage
node scripts/genera-grafiche.mjs
```

Sono disegnate in HTML e fotografate con Chromium a doppia densità, con i font del
sito (Sora, Lora, Inter, Source Code Pro), il logo ufficiale, le schermate vere di
Favella Studio (`landingpage/public/studio/*.webp`, da `scripts/foto-studio.mjs`) e
la copertina vera del manuale. Servono ImageMagick e `pdfinfo` nel PATH.

| File | Formato | Uso |
|---|---|---|
| `banner-favella1-v1.4.3.png` | 2520×1080 | banner del linguaggio (copiato in `assets/banner.png`) |
| `banner-favella-studio-v1.2.0.png` | 2520×1080 | banner di Favella Studio |
| `social-preview-github.jpg` | 2560×1280 | anteprima social del repository (GitHub → Settings → Social preview) |
| `infografica-favella1-v1.4.3.png` | 2160×3840 | la versione definitiva e le dieci tappe |
| `infografica-manuale-terza-edizione.png` | 2160×3840 | il manuale: copertina, capitoli, novità |
| `infografica-sito-favella-eu-v2.8.3.png` | 3840×2160 | tutto quello che c'è su favella.eu |

Le grafiche con una versione più vecchia nel nome (`…-v0.29.0`, `…-v1.0.0`,
`…-v1.4.2`, `infografica-manuale-digitale`, `infografica-sito-favella-eu`) restano
come cronaca, con i loro `.svg` d'origine; `genera-infografica-sito.mjs` è il
generatore della prima infografica del sito.

## Punti di consumo (NON spostare — accoppiati a build/README/sito)

| Percorso | Usato da | Sorgente |
|---|---|---|
| `assets/banner.png` | banner del `README.md` e sdist pip | `materiale/banner-favella1-v<motore>.png` (lo copia il generatore) |
| `assets/logo.png` | README e sdist pip | copia di `marchi/logo.png` |
| `packaging/icons/favella1.ico` | PyInstaller (`favella1.spec`) e NSIS (`installer.nsi`) | derivato dal marchio |
| `studio/branding/favella-studio-banner.jpg`, `landingpage/public/studio/favella-studio-banner.jpg` | banner 16:9 di Favella Studio (1920×1080) | il generatore |
| `landingpage/public/og/*.png` | anteprime social delle pagine del sito | `landingpage/scripts/genera-og.mjs` |
