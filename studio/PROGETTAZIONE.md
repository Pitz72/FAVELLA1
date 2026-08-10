# Favella Studio — Progettazione post-0.9.19

> Documento di progettazione, 2026-06-11, esito della revisione accuratissima
> dell'IDE (architettura/sicurezza, round-trip degli editor, packaging e
> completezza prodotto). Stato alla stesura: **IDE v0.9.19, Fasi 0–7
> complete**; residuo operativo = build dell'installer (PACKAGING.md).
>
> Il documento gemello per linguaggio/toolchain/ecosistema è
> `documentazione/progettazione-oltre-0.18.md` nella repo pubblica FAVELLA1.
>
> Giudizio di partenza: **fondamenta eccellenti** (isolation Electron
> impeccabile, protocollo NDJSON robusto, round-trip con source map e
> degradazione graziosa), **rifiniture da prodotto a pagamento mancanti**.
> Questo documento elenca cosa fare, perché, e in che ordine.

---

> **AGGIORNAMENTO 2026-06-11 (v0.9.20):** TUTTO il Blocco 1 (1.1–1.7) e il punto
> 2.2 sono stati **implementati** (typecheck+build verdi). Nota su 1.2: fix
> applicato lato IDE (normalizzazione LF all'apertura + EOL del modello Monaco);
> lato motore Python la lettura usa già gli universal newlines, quindi gli span
> sono coerenti. Decisione di Simone (2026-06-11): la questione 1.0/vendita è
> RINVIATA (Blocco 3 congelato salvo eccezioni) e il **branding è ancora da
> definire** (quindi anche 2.1 icona resta in attesa del branding).

## BLOCCO 1 — Bug e rischi concreti (prima del rilascio) — ✅ FATTO in v0.9.20

### 1.1 Salvataggi `.favsave` non atomici — 🔴

**Dove:** `src/main/index.ts` (~riga 145, handler del salvataggio partita).
**Problema:** `writeFile` scrive direttamente sul path di destinazione: un
crash o uno spegnimento a metà scrittura **tronca il salvataggio del
giocatore**, irrecuperabile.
**Fix (pattern standard):** scrivere su `<path>.tmp` e poi `rename` (atomico
su NTFS). Applicare lo stesso pattern a OGNI scrittura di file utente
dell'IDE (anche `fs:write` dei `.fav` in `fsapi.ts` — un sorgente troncato è
anche peggio di un save perso).
**Verifica:** test manuale con kill del processo durante un salvataggio
grande; il file precedente deve restare intatto.

### 1.2 CRLF non normalizzato nel round-trip — 🔴 (il più insidioso)

**Dove:** `src/renderer/src/store.ts` (~righe 86–98, `applicaBufferEdit` usa
`split('\n')` nudo) e lettura file lato sidecar (Python converte i newline di
default).
**Problema:** se un `.fav` arriva con CRLF (editor esterno, git con
`autocrlf`, copia da Windows), gli span calcolati dal sidecar e le righe
viste dal renderer possono divergere → **gli splice degli editor visuali
scrivono nel punto sbagliato, corrompendo il sorgente in silenzio**. È il
rischio peggiore perché non dà errore: degrada il file dell'autore.
**Fix in due strati:**
1. **Normalizzazione all'ingresso (autoritativa):** quando l'IDE apre un
   file, normalizza `\r\n` → `\n` nel buffer Monaco (Monaco ha
   `setEOL`/opzione `defaultEOL`) e salva sempre LF. Documentare che i `.fav`
   sono LF (aggiungere `*.fav text eol=lf` al `.gitattributes` dei progetti
   generati).
2. **Difesa nel motore:** verificare il comportamento di `compilatore.py`
   sulle source map con input CRLF e aggiungere un test nel repo pubblico
   (un `.fav` CRLF con `Includi` → span identici alla versione LF).
**Verifica:** test automatico round-trip su file CRLF: apri → modifica da
editor visuale → il diff tocca SOLO la frase prevista.

### 1.3 Sidecar potenzialmente zombie all'uscita — 🔴

**Dove:** `src/main/index.ts` (~193–198) + `src/main/sidecar.ts` (`stop()`).
**Problema:** `stop()` fa `kill()` senza attesa né escalation: se il Python
non termina (es. bloccato in una RPC), resta un processo orfano per ogni
sessione. Su macOS il percorso `window-all-closed`/`before-quit` non
garantisce l'ordine.
**Fix:** `stop()` diventa: chiudi stdin → attendi `exit` max ~2s →
`kill('SIGKILL')` (su Windows: `taskkill /T /F` per l'albero, dato che
PyInstaller può avere processi figli). In `before-quit`: `preventDefault`,
await dello stop, poi `app.quit()`.
**Verifica:** dopo chiusura dell'app, `Get-Process favella_engine` deve
essere vuoto, anche con una partita in corso.

### 1.4 `fs:read`/`fs:write` senza vincolo al progetto — 🟠 (hardening)

**Dove:** `src/main/fsapi.ts` (~85–90).
**Problema:** gli handler IPC accettano qualunque path assoluto. Con
sandbox+contextIsolation il rischio pratico è basso, ma è difesa in
profondità che costa poco e in un prodotto commerciale si dà per scontata.
**Fix:** il main process conosce la cartella progetto aperta; ogni path viene
risolto con `path.resolve` e accettato solo se dentro il project root (più
allowlist esplicita per i dialoghi di sistema: i path restituiti da
`showOpenDialog`/`showSaveDialog` sono fidati perché scelti dall'utente).

### 1.5 Backpressure su stdin del sidecar — 🟠

**Dove:** `src/main/sidecar.ts` (~riga 162).
**Problema:** `stdin.write()` ignora il valore di ritorno; con payload grossi
(export HTML, progetti grandi) il buffer può riempirsi e il framing NDJSON
rischia interleaving/perdite.
**Fix:** helper `writeWithDrain` (se `write()` torna `false`, attendi
l'evento `drain`) + serializzare le scritture in coda (una promise chain).
6–10 righe.

### 1.6 Errori del sidecar opachi per l'utente — 🟠

**Dove:** `src/main/sidecar.ts` (stderr letto ma solo loggato),
`src/renderer/src/App.tsx` (~71, toast generico).
**Problema:** se il motore crasha, l'utente vede «Motore in errore» senza il
traceback Python (che ora, col fix del 2026-06-11 al motore, è completo su
stderr). Debugging cieco, e le segnalazioni degli utenti arriveranno vuote.
**Fix:** bufferizzare le ultime ~100 righe di stderr nel main; nuovo canale
IPC `sidecar:lastError`; pannello «Motore» (o sezione del pannello Problemi)
con il traceback e un bottone «Copia rapporto» (versioni IDE/sidecar/motore +
traceback) da incollare in una segnalazione.

### 1.7 Validazione dei `.favsave` al caricamento — 🟡

**Dove:** `src/main/index.ts` (~167: `JSON.parse` con `catch` → `null`).
**Problema:** un save corrotto fallisce in silenzio: l'utente non sa se il
file è rotto o vuoto.
**Fix:** validazione di forma (campi attesi: versione, percorso storia,
lista comandi), messaggio esplicito («Il salvataggio è danneggiato o di una
versione incompatibile»), e — grazie al formato command-log — recupero
parziale: rigioca i comandi finché valgono, poi avvisa.

---

## BLOCCO 2 — Packaging (sblocca il build dell'installer)

### 2.1 Icona dell'app — 🔴 blocca un rilascio dignitoso

`electron-builder.yml` ha `icon` commentato: l'installer NSIS uscirebbe con
l'icona generica di Electron. **Azione:** produrre `build/icon.ico`
(multi-size, 16→256 px, dal marchio {F1} in Branding2026), decommentare,
verificare icona di: installer, shortcut, exe, taskbar.

### 2.2 Build che non fallisce se manca il sidecar — 🔴

Se si dimentica il passo PyInstaller, `npm run dist` produce comunque un
installer **non funzionante** («Motore non pronto» per sempre).
**Azione doppia:**
1. script `predist` in `package.json` che verifica l'esistenza di
   `../dist/favella_engine.exe` e fallisce con messaggio chiaro;
2. in `sidecar.ts`, quando `app.isPackaged` e il binario non esiste: dialogo
   di errore esplicito («Installazione danneggiata: motore mancante»), non
   retry infinito.

### 2.3 Collaudo del primo installer (checklist)

Su una macchina/VM pulita senza Python: installa → apri progetto demo →
compila → gioca 5 turni → salva/carica partita → esporta HTML e aprilo nel
browser (verifica `_MEIPASS`: i sorgenti del motore devono essere inclusi
nel bundle PyInstaller via `--add-data`, e `esporta_html` deve fallire
RUMOROSAMENTE se non li trova) → disinstalla pulito. Antivirus/SmartScreen:
aspettarsi warning senza firma del codice — la firma (cert. OV) è una
decisione commerciale da prendere prima della vendita.

---

## BLOCCO 3 — Gap da «prodotto a pagamento»

In ordine di quanto un utente pagante ne sentirebbe la mancanza.

### 3.1 Ricerca nel progetto (Ctrl+Shift+F) — ⭐
Oggi solo find di Monaco nel file attivo. Per storie multi-file (il Relitto:
7 file) è la mancanza più sentita. **Design:** pannello ricerca nel dock;
scansione dei `.fav` del progetto nel main process (sono piccoli: ricerca
sincrona semplice, niente indice); risultati raggruppati per file con
riga/contesto; click → apre il file e seleziona. Case-insensitive di default,
toggle parola intera. (Sostituzione globale: fase 2, con anteprima.)

### 3.2 Progetti recenti + riapertura all'avvio
Lista ultimi 10 progetti (persistita in `userData/config.json`, non
localStorage: deve sopravvivere e stare nel main): schermata di benvenuto con
recenti + «Apri» + «Nuovo da modello», e riapertura automatica dell'ultimo
progetto (opzione). Costo basso, beneficio quotidiano.

### 3.3 Auto-update
Senza, chi compra la 0.9 non saprà mai della 1.0. `electron-updater` +
release su repo privata richiede un server/feed: la via pragmatica iniziale è
il **check-only** (GET a un JSON di versione sul sito Runtime → banner
«È disponibile la X.Y» con link al download). Auto-update completo quando
esiste il canale di vendita/distribuzione definitivo. Da decidere insieme al
meccanismo di licensing (vedi memoria strategia-rilascio).

### 3.4 Onboarding: «la prima storia»
L'IDE si apre vuoto. **Azione:** al primo avvio, dialogo «Nuovo progetto da
modello» con 2 template: *Minimo* (una stanza, un oggetto, una regola,
commentatissimo) e *La Casa di Via Stradivari* (la storia del manuale).
Più: tooltip su TUTTI i pulsanti della titlebar e voce Help con le
scorciatoie (oggi Ctrl+S/Ctrl+B non sono documentate da nessuna parte).

### 3.5 Tema chiaro
Solo `favella-dark` oggi. Definire `favella-light` (palette di marca già in
Branding2026), toggle in titlebar, preferenza persistita, e CSS dell'IDE a
variabili (audit dei colori hardcoded nei componenti).

### 3.6 i18n — decisione, non (ancora) lavoro
La UI è hardcoded in italiano. Finché FAVELLA è «l'italiano è il codice», il
mercato È italiano: nessun lavoro ora. La decisione da prendere è solo NON
peggiorare: man mano che si toccano componenti, estrarre le stringhe nuove in
un modulo `strings.ts` per non rendere l'eventuale traduzione futura un
riscrittura.

### 3.7 Telemetria crash — opzionale e trasparente
Con 1.6 (rapporto d'errore copiabile) si copre il 90% del bisogno a costo
zero e senza questioni privacy. Sentry o simili solo se il volume di utenti
lo giustificherà; in tal caso opt-in esplicito.

---

## BLOCCO 4 — Debito tecnico interno

### 4.1 Spaccare `store.ts` (1.140 righe)
Monolite con sessione, file, compilazione, gioco, debug e 5 editor visuali.
**Piano a slice di Zustand** (refactor meccanico, zero cambi di
comportamento): `session.ts`, `files.ts`, `compile.ts`, `game.ts`,
`outline.ts` (round-trip + editor), `dialogues.ts`. Da fare PRIMA di
aggiungere nuovi editor, o il costo cresce.

### 4.2 Deduplicare la logica dei builder
`condRepresentable`/`condText`/`conseqText` duplicate fra `RulesEditor.tsx`,
`DialoguesEditor.tsx` e `logicBuilder.tsx`: centralizzare in
`logicBuilder.tsx` (unica fonte). Ogni nuovo costrutto del linguaggio oggi va
aggiornato in 3 posti: è il bug di domani.

### 4.3 Test automatici del round-trip
Oggi il round-trip è garantito solo dai test del motore + test visivi di
Simone. Aggiungere una suite (vitest) di casi: apri sorgente → applica op →
confronta col testo atteso byte-per-byte; includere i casi CRLF (1.2), frase
in file incluso, span multipli ordinati dal basso. È la rete di sicurezza per
tutto il Blocco 3.

### 4.4 Migliorie minori censite (non bloccanti)
- Messaggio «frase in un altro file» → aggiungere bottone **Apri file**
  (`store.ts` ~889–895).
- Riordino canonico: i commenti *trailing* migrano alla frase successiva —
  documentare nel README o tracciarli separatamente.
- Descrizioni condizionali non editabili visualmente (degradano a testo):
  candidata a «editor mancante» di una futura fase, richiede
  `analizza_outline` esteso con span per ramo condizionale (motore, repo
  pubblica).
- Virtualizzazione liste (react-window) solo se/quando esisteranno progetti
  con centinaia di entità.

---

## BLOCCO 5 — Integrazioni future col motore (dipendono dalla repo pubblica)

Dal documento gemello `progettazione-oltre-0.18.md`:
- **Giocatore-robot (B1):** quando il motore esporrà `collaudo.run`, l'IDE
  aggiunge il pannello «Collaudo» (vincibilità, copertura regole, oggetti
  orfani) e — in prospettiva — l'overlay del **grafo di vincibilità sulla
  mappa** (le frecce «per vincere serve…»). È la feature che da sola motiva
  una major dell'IDE.
- **Seed deterministico (A2):** il pannello Gioca e il debugger devono poter
  fissare il seed (riproducibilità dei bug segnalati dagli autori).
- **Pronomi (A1) e comandi di servizio (A3):** nessun lavoro IDE previsto
  (runtime puro), ma la finestra di gioco va ritestata.

---

## Sequenza consigliata

| Fase | Contenuto | Esito |
|---|---|---|
| **R1 — «Installabile»** | 2.1 icona, 2.2 guardie build, 1.1 atomic write, 1.3 zombie, poi build + checklist 2.3 | il primo installer affidabile (il residuo attuale) |
| **R2 — «Affidabile»** | 1.2 CRLF (+test 4.3), 1.5 backpressure, 1.6 errori visibili, 1.7 favsave validati, 1.4 path | nessuna perdita di dati possibile |
| **R3 — «Da comprare»** | 3.1 ricerca, 3.2 recenti+benvenuto, 3.4 onboarding+help, 3.5 tema chiaro | il gap percepito vs IDE commerciali si chiude |
| **R4 — «Da mantenere»** | 4.1 store a slice, 4.2 dedup builder, 3.3 update check-only | base sana per le feature del Blocco 5 |
| **R5 — «Differenziante»** | Blocco 5 (collaudo, grafo vincibilità, seed) | nessun concorrente ce l'ha |

Nota di metodo (convenzione consolidata): ogni step → test visivo di Simone →
CHANGELOG/README/package.json → commit → push → memoria. I fix che toccano il
motore (CRLF lato Python, `collaudo.py`, span condizionali) vivono nella repo
pubblica e seguono la sua disciplina (446+ test verdi).
