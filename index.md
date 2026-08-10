# Indice del repository — FAVELLA 1

Mappa di **dove sta ogni cosa**. Aggiornata al 2026-08-10.

---

## 🧠 Motore (codice sorgente — in root, layout PIATTO intenzionale)

> ⚠️ Questi moduli **devono** stare nella radice: lo impongono `pyproject.toml`
> (`py-modules`), PyInstaller (`favella1.spec`) e il vendoring del motore in
> `landingpage/` e `studio/`. **Non spostarli.**

| File | Ruolo |
|---|---|
| `favella.py` | Entry-point / CLI `favella1` (gioca, compila, collaudo, playground, esporta) |
| `compilatore.py` | Compilatore Lark/EBNF: `.fav` → object model |
| `strutture.py` | Object model del Mondo + `VERSIONE_MOTORE` |
| `gioco.py` | Interprete / loop di gioco |
| `libreria_azioni.py` | Verbi e azioni di base |
| `favella_utils.py` | Utilità condivise |
| `collaudo.py` | Collaudatore statico di storie (catena della vittoria) |
| `favella_playground.py` | Playground locale offline |
| `favella_server.py` | Server (escluso dal pacchetto pip) |
| `test_linguaggio.py`, `test_collaudo.py` | Suite di test (runner nativo) |

## 📦 Pacchetto & packaging

| Percorso | Contenuto |
|---|---|
| `favella1/` | Dati dell'ecosistema pip: `libreria/` (moduli `.fav`) + `galleria/` (storie) |
| `pyproject.toml`, `MANIFEST.in`, `favella1.spec` | Configurazione build (pip / PyInstaller) |
| `packaging/` | Input degli installer: `icons/` (`.ico`/`.png`), `windows/installer.nsi`, `linux/` |
| `LICENSE`, `README.md`, `CHANGELOG.md`, `PACKAGING.md` | Meta del progetto |

## 📚 Documentazione (layout piatto, vedi nota)

| Percorso | Contenuto |
|---|---|
| `documentazione/grammatica-*.md` | Specifiche EBNF per versione (la `1.0.0` è quella viva) |
| `documentazione/0.*.md` | Note di rilascio storiche per versione |
| `documentazione/progettazione-*.md`, `espansione-oltre-0.29.md` | Documenti di progettazione |
| `documentazione/manuale/` | Manuale (Typst → PDF) + `manuale.pdf` pubblico |

> Resta piatta di proposito: un test-guardia in `test_linguaggio.py` e ~40 link
> storici nel `CHANGELOG.md` puntano a questi percorsi.

## 🎮 Esempi

| Percorso | Contenuto |
|---|---|
| `esempi/` | Storie e demo ufficiali (`.fav`), inclusi gli stress-test di genere |

## 🎨 Branding (riorganizzato — casa unica `branding/`)

| Percorso | Git | Contenuto |
|---|---|---|
| `branding/marchi/` | 🔒 locale | Marchi ufficiali 2026 master (logo, banner, icona-app, icona-trasparente) |
| `branding/favicon/` | 🔒 locale | Set favicon derivati (16→512) + `.ico` |
| `branding/materiale/` | ✅ tracciato | Infografiche + banner versionati (`.svg`/`.png`) + generatore |
| `branding/archivio-2025/` | 🔒 locale | Vecchio branding storico |
| `assets/` | ✅ tracciato | **Punto di consumo**: `logo.png`/`banner.png` usati dal README e dal pacchetto pip |

> Dettagli e comandi di rigenerazione: `branding/README.md`. Le icone installer
> stanno in `packaging/icons/` perché accoppiate a `favella1.spec`/`installer.nsi`.

## 🛰️ Sito e progetti satellite

| Percorso | Git | Contenuto |
|---|---|---|
| `studio/` | repo separato (`Pitz72/favella-studio`), gitignored | IDE desktop Favella Studio (Electron) |
| `landingpage/` | tracciato | Sito **favella.eu** (React/Vite + pre-rendering). Dal 2026-08-10 vive qui: non è più un repo a sé. I master grafici (`landingpage/immagini/`, ~51 MB) restano locali, come `branding/marchi/`; il sito usa le WebP in `landingpage/public/covers/`. Deploy: `npm run deploy` (FTPS, credenziali fuori dal repo) |
| `newdesign/` | gitignored | Handoff redesign della landing (zip + estratto), materiale di lavorazione per `landingpage/` |
| `presentazione/` | gitignored | Pitch deck Marp (sorgente, tema, `output/`): materiale di outreach **interno**, come `dove-presentare-favella.md` |
| `.claude/`, `.venv/` | gitignored | Configurazione locale e virtualenv |

---

### Cosa NON cercare più nella root
Rimossi nel riordino 2026-06-18: `test_pyside.py` (estraneo), `src/`+`public/`
vuote. La vecchia `Branding2026/` e `materiale-informativo/` sono confluite in
`branding/`.

> `dist/`, `*.egg-info/`, `build/` e `__pycache__/` **ricompaiono a ogni build**:
> sono gitignorati, non tracciati, e non c'è niente da ripulire a mano.
