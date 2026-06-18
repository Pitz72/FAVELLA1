# Branding FAVELLA 1

Casa unica del materiale di marca. Qui vive la **fonte** (master del kit 2026);
gli asset effettivamente consumati da README/pacchetto/installer stanno nei loro
punti di consumo (vedi in fondo).

## Struttura

| Cartella | Git | Contenuto |
|---|---|---|
| `marchi/` | 🔒 locale | Marchi ufficiali 2026, master: `logo.png`, `banner.png`, `icona-app.png`, `icona-trasparente.png` |
| `favicon/` | 🔒 locale | Set favicon derivati (16 → 512 px) + `favicon.ico` |
| `materiale/` | ✅ tracciato | Materiale informativo pubblico: infografiche e banner versionati (`.svg`+`.png`) + `genera-infografica-sito.mjs` |
| `archivio-2025/` | 🔒 locale | Vecchio branding pre-2026, tenuto come cronaca |

🔒 = fuori da git (vedi `.gitignore`): il kit sorgente è pesante e locale, per
scelta deliberata. ✅ = versionato nel repo pubblico.

## Punti di consumo (NON spostare — accoppiati a build/README)

| Percorso | Usato da | Sorgente |
|---|---|---|
| `assets/logo.png`, `assets/banner.png` | banner del `README.md` e sdist pip | copie di `marchi/logo.png` e `marchi/banner.png` |
| `packaging/icons/favella1.ico` | PyInstaller (`favella1.spec`) e NSIS (`installer.nsi`) | derivato dal marchio |

### Rigenerare gli asset di consumo dal master

```bash
cp branding/marchi/banner.png assets/banner.png
cp branding/marchi/logo.png   assets/logo.png
```
