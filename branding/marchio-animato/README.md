# Marchio esteso di FAVELLA 1 — animazione e sorgenti

Il marchio esteso (simbolo + **FAVELLA1** + motto «Programmare storie interattive
in linguaggio naturale italiano») che appare nell'**animazione d'apertura** e nei
**titoli di coda** del gioco *Il Relitto Silente*, portato qui come archivio di
branding. Il simbolo è il marchio ufficiale (`branding/marchi/`) ridisegnato in
vettoriale per poterne animare le parti: graffe del codice, libro, sei foglie
(tre, specchiate) e gemma.

## File

| File | Che cos'è |
|---|---|
| `LogoFavella.tsx` | **L'animazione** (React, SVG): la gemma si accende, il libro si apre, le pagine salgono a ventaglio, le graffe si disegnano, la scritta appare lettera per lettera e il motto è battuto a macchina. Durata ~6,8 s. Espone `DURATA_FAVELLA`, `REGIA_FAVELLA` (i tempi), `MOTTO`, `BATTUTE`. Implementa `Animabile` (`prepara()` + `aggiorna(t)`). |
| `Marchi.tsx` | Le **versioni ferme** (statiche) in bianco per i titoli di coda: `MarchioFavella` e `MarchioRuntime`. Da `MarchioFavella` è derivato l'SVG statico in `branding/marchi/`. |
| `forme.ts` | I **tracciati** vettoriali (graffe, libro, foglie, gemma; più il marchio Runtime) e le costanti di posa. «Le coordinate vengono dai disegni, non si ritoccano a mano.» |
| `tempo.ts` | Le **curve** pure del tempo (easing, `seg`, `lerp`, `mix`, `rng`). |
| `tipi.ts` | L'interfaccia `Animabile` che l'orologio chiama su ogni logo. |

## Come si monta (nel gioco)

Un solo orologio (`t` in secondi) guida tutto. In sostanza:

```tsx
import LogoFavella, { DURATA_FAVELLA } from "./LogoFavella";

const logo = useRef<Animabile>(null);
// a caratteri caricati: logo.current.prepara();
// a ogni frame:        logo.current.aggiorna(t);
// <LogoFavella ref={logo} />
```

Nel Relitto l'orologio, il montaggio dei due loghi in sequenza e l'audio stanno
in `app/src/loghi/Loghi.tsx` e `suono.ts` (non inclusi qui).

## Caratteri

Scritta in **Sora** (700), motto in **Inter** (400) — i caratteri del marchio,
già nel repository del motore (`fonts/`, `documentazione/manuale/fonts/`).

## Versioni ferme in `branding/marchi/`

- `favella1-marchio-esteso.svg` — bianco su fondo scuro (come i titoli di coda).
- `favella1-marchio-esteso-colore.svg` — a colori, con le sfumature (lo stato a
  riposo dell'animazione: foglie verdi/teal, gemma oro, libro e graffe blu).
- `favella1-marchio-esteso-colore-flat.svg` — a colori piatti, senza sfumature.

## Provenienza e licenza

Ricavato da `C:\Users\Utente\Documents\SVILUPPO\VIDEOGIOCHI\Il Relitto`
(`app/src/loghi/`, `app/src/trailer/tempo.ts`). Il marchio Favella1 è dell'autore
del progetto; il marchio Runtime Multimedia, presente in `forme.ts`/`Marchi.tsx`,
è di Runtime Multimedia (resta fuori dalle licenze del motore).
