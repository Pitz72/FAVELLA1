# Sito di FAVELLA 1 (favella.eu)

Sorgente del sito ufficiale: React 19 + Vite + Tailwind, pre-renderizzato in HTML statico per ogni pagina
(SEO) e pubblicato su favella.eu. Dentro gira il motore vero di FAVELLA via Pyodide: corso interattivo,
«Programma», galleria e il laboratorio.

## Comandi

| Comando | Cosa fa |
| --- | --- |
| `npm install` | installa le dipendenze |
| `npm run dev` | server di sviluppo |
| `npm run build` | controllo dei tipi, build, pre-render delle pagine e dell'esperimento |
| `npm run og` | rigenera le anteprime social `public/og/*.png` (testi in `scripts/genera-og.mjs`) |
| `npm run deploy` | pubblica `dist/` su favella.eu via FTPS (lo lancia l'autore) |

Strumenti di sviluppo, fuori dal build: `scripts/foto-pagine.mjs` fotografa una pagina a fette,
`scripts/foto-studio.mjs` rifà le schermate di Favella Studio in `public/studio/`.

## Dove stanno le cose

- `src/constants.tsx`: versioni (`VERSION`, `STUDIO_VERSION`, `SITE_VERSION`), numeri (`STATS_NUMERI`), link
  di download, dati del manuale cartaceo (`PAPERBACK`), novità e testo della Guida rapida. **Si aggiorna qui**,
  poi `src/seo.ts` e `index.html` per le descrizioni.
- `src/ui/`: il linguaggio visivo («Nottetempo»): primitive (`PageHero`, `SectionHead`, `Spot`, `Reveal`,
  `Ink`…), il libro 3D del manuale cartaceo, l'editor vivente della home.
- `src/index.css`: palette di marca (invariata) e blocco «Design 2026».
- `public/favella-engine/`: copie vendorate del motore: **non si modificano a mano** (vedi `SYNC.md`).
