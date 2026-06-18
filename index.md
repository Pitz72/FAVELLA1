# Indice del repository — FAVELLA 1

Mappa di **dove sta ogni cosa**. Aggiornata al riordino del 2026-06-18.

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
| `utils.py` | Utilità condivise |
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

## 🛰️ Progetti satellite (repo/handoff separati — non parte del repo pubblico)

| Percorso | Git | Contenuto |
|---|---|---|
| `studio/` | repo separato (`Pitz72/favella-studio`), gitignored | IDE desktop Favella Studio (Electron) |
| `landingpage/` | repo separato e solo locale, gitignored | Sito favella.eu (React/Vite). **Non pushare.** |
| `newdesign/` | non tracciato | Handoff redesign della landing (zip + estratto) |
| `.venv/` | gitignored | Virtualenv locale |

---

### Cosa NON cercare più nella root
Rimossi nel riordino 2026-06-18: `test_pyside.py` (estraneo), `src/`+`public/`
vuote, artefatti di build (`dist/`, `dist_pypi/`, `*.egg-info`, `__pycache__/`).
La vecchia `Branding2026/` e `materiale-informativo/` sono confluite in `branding/`.
