# Changelog — Favella Studio

> ⚠️ **Favella Studio è un esperimento in fase primordiale**, pubblicato così com'è.
> Vedi l'avviso in testa a [README.md](README.md).

Tutte le versioni rilevanti dell'IDE Favella Studio. Il versioning è indipendente
da quello del linguaggio/motore FAVELLA (attualmente **v1.0.1**).
Schema: [SemVer](https://semver.org/lang/it/) 0.x (pre-1.0).

## [0.9.29] — 2026-08-10 — L'IDE diventa pubblico (e resta un esperimento)

Nessuna modifica funzionale all'app. Cambia dove vive e a che condizioni.

### Cambiato
- **Favella Studio esce dal repository privato** (`Ecosystem-Runtime/favella-studio`)
  ed entra nel repository pubblico di FAVELLA 1, sotto `studio/`. Il `.git` annidato è
  stato rimosso: da qui in avanti un repo solo, un commit solo. La storia precedente
  resta come bundle d'archivio ed è consultabile nel repo privato archiviato.
- **Licenza MIT propria** (`studio/LICENSE`). Prima l'IDE non ne aveva nessuna, il che
  in pratica significa «tutti i diritti riservati»: incompatibile con l'idea di
  metterlo a disposizione.
- **Avviso di stato** in testa a `README.md` e qui: l'IDE è un **tentativo incompiuto**,
  non supportato e senza data di uscita. Se a qualcuno interessa riprenderlo, è a
  disposizione. Il *linguaggio* FAVELLA 1, al contrario, è completo e stabile.
- Allineamento al motore **1.0.1** (`utils` → `favella_utils`): già fatto in `0d212fc`
  per l'`--add-data` della Action di build.

## [0.9.28] — 2026-06-18 — Build multipiattaforma + GitHub Action (manuale)

Packaging reso **cross-platform** e automatizzabile: l'IDE si costruisce per **Windows,
macOS e Linux**. La semantica dell'app non cambia.

### Aggiunto
- **GitHub Action `Build IDE (Windows / macOS / Linux)`** (`.github/workflows/build.yml`,
  repo privato), **avvio solo manuale** (`workflow_dispatch`, nessun trigger automatico):
  matrice 3 OS che fa il checkout del motore pubblico, **congela il sidecar** con PyInstaller
  (separatore `--add-data` per-OS, `chmod +x` su mac/linux), `npm ci` + `npm run dist`, e
  carica gli **artefatti** (NSIS / dmg+zip / AppImage). Build non firmati
  (`CSC_IDENTITY_AUTO_DISCOVERY=false`).
- **Icone di marca** agganciate al build (`branding/icone/`): `win.icon` (`.ico`),
  `mac.icon` (`.icns`), `linux.icon` (`icon.png`).

### Cambiato
- `package.json build`: target per piattaforma (**win** NSIS · **mac** dmg+zip · **linux**
  AppImage) e `extraResources` per-OS col nome corretto del sidecar (`favella_engine.exe`
  su Windows, `favella_engine` su macOS/Linux).
- `src/main/sidecar.ts`: in produzione risolve il binario del sidecar **per piattaforma**
  (`.exe` solo su Windows) — prima era cablato a `favella_engine.exe`.
- `predist`: il controllo pre-build verifica il binario giusto per l'OS corrente.

### Note
- Il sidecar è una copia congelata del motore al `ref_motore` scelto nel workflow: per
  aggiornarlo si rilancia l'Action. Gli eseguibili del **linguaggio** FAVELLA 1 restano i
  loro: l'Action costruisce l'**IDE**, non il linguaggio.

## [0.9.27] — 2026-06-18 — Revisione UX/IA degli editor (tappe T6-T7) — revisione COMPLETA

Ultimo blocco della revisione (vedi `UX-EDITOR-REVISIONE.md`): con questo i **6 principi
della visione sono tutti applicati**. **Solo renderer: motore, backend e frasi `.fav`
invariati.** typecheck + build verdi (802 moduli).

### Cambiato
- **Feedback degli errori dove l'azione nasce** (T6 — principio 6): gli errori di un editor
  (serializzazione fallita, frase in un file incluso, direzione non valida…) non finiscono
  più solo nel toast globale, ma in un **banner inline in cima al dock**, sopra l'editor che
  li ha generati, con ✕ per nasconderlo. Si pulisce da solo alla prima azione riuscita. Nuovo
  canale `editError` nello store, separato da `gameNotice` (che resta per i messaggi globali:
  salvataggi, riordino, esportazione).
- **Affordance del valore iniziale degli stati** (T7 / #13): sotto i valori di uno stato una
  nota «Clicca un valore per renderlo quello iniziale (★)» rende esplicito il gesto, prima
  solo intuibile dal tooltip.
- **La larghezza del dock si ricorda fra le sessioni** (T7 / #15): prima ripartiva sempre da
  440px; ora è persistita in `localStorage` (clamp 320–900).

### Note
- Rifiniture #12 (etichetta «Contenuto»/«Sopra») e #14 (nodo «senza battuta») valutate e
  **lasciate invariate**: il contesto le rende già chiare (il corpo del nodo spiega «Questo
  nodo è citato ma non ha battuta»). #16 (naming `editMode`) già risolto da T5.

## [0.9.26] — 2026-06-17 — Revisione UX/IA degli editor (tappe T4-T5)

Secondo blocco della revisione (vedi `UX-EDITOR-REVISIONE.md`). **Solo renderer: motore,
backend e frasi `.fav` invariati.** Uniforma i pattern fra editor e toglie un modello
mentale superfluo. typecheck + build verdi (802 moduli).

### Cambiato
- **La Mappa è sempre editabile nel dock** (T5): rimosso l'interruttore «✏️ Modifica», che
  era l'unico editor «a stato» dell'IDE. Ora — come 📦 Oggetti e ⚖ Stati — si trascina per
  collegare le stanze e si clicca una connessione per eliminarla senza un gesto preliminare.
  «➕ Stanza» e «⤢ Riallinea» sono sempre in barra. Resta in sola lettura solo nella finestra
  di gioco (prop `editable=false`). Rimosso lo stato morto `mapEditMode` dallo store.
- **Creazione di stanze dal dock** (T4): la scheda 🏠 Stanze ha ora il ➕ (riga in-linea col
  nome, come 📦 Oggetti e ⚖ Stati), oltre alla Mappa. Una stanza nuova si crea da dove si sta
  già lavorando.

### Note di design
- L'**eliminazione** di una stanza (e di un oggetto) resta volutamente assente dalle schede:
  toglierla qui lascerebbe connessioni, posizioni e regole orfane. Si fa nel testo, come la
  rinomina. È coerente con 📦 Oggetti (che già non elimina l'intera entità); l'eliminazione
  diretta resta solo dove è sicura (⚖ Stati, nodi/opzioni di 💬 Dialoghi, ⚙ Regole).

## [0.9.25] — 2026-06-17 — Revisione UX/IA degli editor (tappe T1-T3)

Primo blocco a basso rischio della revisione olistica degli editor visuali (analisi e
visione complete in `UX-EDITOR-REVISIONE.md`). **Solo renderer (repo privato): nessun
cambio di backend, motore o round-trip; le frasi `.fav` generate sono identiche.** Tutte
modifiche di etichette, raggruppamento e ordinamento — il *cosa* è invariato, cambia il
*come* l'autore-narratore lo trova.

### Cambiato
- **Vocabolario unico della logica** in Regole, Eventi, Demoni e Dialoghi: l'innesco è
  «Quando il giocatore…», la condizione è sempre «Solo se…», gli effetti «Fai questo…».
  Spariscono i dialetti divergenti («E adesso…», «Mostrala solo se…», «Condizione
  sorvegliata»).
- **Menu degli effetti raggruppato** (progressive disclosure): le 10 conseguenze, prima
  in un elenco piatto, ora in tre gruppi — *Effetti comuni* (proprietà, stato, contatore,
  sposta oggetto/giocatore, fine partita), *Il mondo cambia* (buio, sposta personaggio),
  *Il caso e gli stati che si parlano* (sorteggia, copia). Sorgente unica condivisa
  (`CONS_GROUPS` in `logicBuilder`), così le due form non divergono mai.
- **Atomi di condizione raggruppati**: *Le più usate* (il giocatore ha / è in, un oggetto
  è, uno stato è) e *Avanzate* (contatore, «stato come stato», «càpita»).
- **Etichette degli effetti più parlanti**: «cambia una proprietà di un oggetto», «cambia
  il valore di uno stato», «aumenta o diminuisci un contatore», «una stanza diventa buia o
  si illumina».
- **Schede della titlebar riorganizzate in due gruppi** con separatore: *Costruisci il
  mondo* (🗺 Mappa · 🏠 Stanze · 📦 Oggetti · 💬 Dialoghi · ⚖ Stati · ⚙ Regole) e *Prova e
  osserva* (▶ Gioca · 🔎 Partita · 🐞 Debug). Stesso ordine nei titoli del dock.
- **Rinominata «🔎 Stato» → «🔎 Partita»**: l'ispettore mostra lo stato del gioco in corso;
  il nuovo nome lo distingue senza ambiguità dall'editor «⚖ Stati». Chiave interna
  (`rightTab: 'stato'`) invariata.
- **Default coerente fra form gemelle**: la prima conseguenza proposta è «proprietà» sia
  in Regole sia nelle opzioni di Dialogo (prima era «stato» nei dialoghi).

## [0.9.24] — 2026-06-17 — Editor del movimento dei personaggi (A5) — copertura COMPLETA

Ultimo costrutto del linguaggio senza editor visuale. Con questo **ogni costrutto di
FAVELLA 1.0.0 è componibile dalle form**: non resta più nulla a `op:'unknown'`.

### Aggiunto
- **Movimento di un personaggio** come conseguenza in ⚙ Regole e 💬 Dialoghi
  («+ conseguenza» → «sposta un personaggio»): si sceglie il personaggio e se **va in
  una stanza** (destinazione fissa → `la guardia va in corridoio`) o **cambia stanza**
  (una adiacente a caso → `il gatto cambia stanza`). Round-trip testo↔visuale completo;
  display nelle card («→ <stanza>» / «→ cambia stanza»).

### Backend (repo pubblico, additivo — motore byte-stabile, 681 test verdi)
- `compilatore.py`: `_conseq_to_json` espone `ConseguenzaMovimentoPNG` come
  `{op:'movePNG', png, name, adjacent, dest, destName}` (non più `unknown`);
  `_serializza_conseguenza` serializza l'op `movePNG` (forma deterministica con prep
  concordata e forma `cambia stanza`). **Sidecar 0.9.11**. Round-trip verificato per
  entrambe le forme.

### Note
- **Copertura completa**: ogni `Condizione*`/`Conseguenza*` del motore ha ora un
  mapping in lettura (`_cond/_conseq_to_json`) e scrittura (serializzatori) + un editor
  visuale. Il fallback «✎ testo» resta solo per le condizioni booleane troppo annidate
  (scelta di design), non più per singoli costrutti.
- Typecheck + build verdi.

## [0.9.23] — 2026-06-17 — Editor del buio commutabile (Tema 4a)

### Aggiunto
- **Buio di una stanza** come conseguenza nelle form di ⚙ Regole e 💬 Dialoghi
  («+ conseguenza» → «buio di una stanza»): si sceglie la stanza e se **diventa buia**
  o **si illumina**, generando `la radura diventa buia` / `… diventa illuminata`
  (Tema 4a, `ConseguenzaBuioStanza`). Round-trip testo↔visuale completo; display
  leggibile nelle card («→ buia» / «→ illuminata»).

### Backend (repo pubblico, additivo — motore byte-stabile, 681 test verdi)
- `compilatore.py`: `_conseq_to_json` espone `ConseguenzaBuioStanza` come `{op:'dark',
  room, name, dark}` (non più `unknown`); `_serializza_conseguenza` serializza l'op
  `dark`. **Sidecar 0.9.10**. Round-trip verificato (serializza→compila→rileggi) anche
  in combinazione con operando, chance, pick, varCopy.

### Note
- Resta ora **un solo** costrutto fuori dall'editor visuale (in «✎ testo»): il
  **movimento dei personaggi** (`va nel corridoio`, A5, `ConseguenzaMovimentoPNG`),
  ancora `op:'unknown'`. È l'ultimo tassello di copertura del linguaggio.
- Typecheck + build verdi.

## [0.9.22] — 2026-06-17 — Editor visuali NATIVI per i Temi 1-5

Completa l'allineamento a FAVELLA 1.0.0: i costrutti dei Temi che la 0.9.21 aveva
solo messo in sicurezza (sola lettura «✎ testo») ora sono **modificabili dalle
form** di ⚙ Regole e 💬 Dialoghi, con round-trip testo↔visuale completo.

### Aggiunto (editor della logica)
- **Quantità dinamiche dei contatori** (Tema 1): il valore di un confronto o di una
  mutazione (`aumenta`/`diminuisci`/`diventa`) si sceglie ora fra **un numero**, **il
  valore di un altro contatore** (`[forza]`) o — solo nelle conseguenze — **un numero
  a caso fra A e B**. Widget condiviso `OperandoInput` (nei confronti di condizione la
  forma casuale non è offerta, com'è nella grammatica `operando_confronto`).
- **Confronto stato↔stato** (Tema 3): condizione «**uno stato è come un altro**»
  (`X è come Y`), con negazione «non è come».
- **Probabilità** (Tema 2c): condizione «**càpita (N su M)**».
- **Copia stato↔stato** (Tema 3): conseguenza «**copia uno stato in un altro**»
  (`X diventa Y`).
- **Sorteggio di stato** (Tema 2b): conseguenza «**sorteggia il valore di uno stato**»
  (`X diventa uno fra a, b, c`); i valori si digitano separati da virgola (commit
  all'uscita dal campo, così la punteggiatura non viene mangiata).
- Negazione infissa estesa a `varEq` (`NEGATABLE`), coerente con la grammatica.
- La guardia di rappresentabilità torna permissiva: solo i costrutti ancora non
  coperti (buio commutabile e movimento PNG, `op:'unknown'`) restano «✎ testo».

### Backend (repo pubblico, additivo — motore byte-stabile, 681 test verdi)
- `compilatore.py`: helper `_serializza_operando` (`[contatore]`, `un numero fra A e
  B`); `_serializza_condizione` ora serializza `chance` e i confronti con operando;
  `_serializza_conseguenza` serializza `pick` e i contatori con operando. **Sidecar
  0.9.9**. Round-trip verificato re-serializzando e ricompilando «La cripta del lich»
  (operando-variabile) e «Notte di gara» (chance + pick): conteggi R/E/D invariati.

### Note
- Restano **fuori dall'editor visuale** (e quindi in sola lettura «✎ testo»): il
  **buio commutabile** (`la radura diventa buia/illuminata`, Tema 4a) e il **movimento
  PNG** (`va nel corridoio`, A5), che il backend espone come `unknown`. Sono i due
  unici costrutti del linguaggio ancora senza editor: candidati per una prossima minor.
- Typecheck + build verdi.

## [0.9.21] — 2026-06-17 — Allineamento a FAVELLA 1.0.0: guardia anti-corruzione sui Temi 1-5

Il linguaggio è cresciuto da 0.18.0 a **1.0.0** (cassetto A + Temi 1-5: quantità
dinamiche, casualità, indirezione fra stati, mondo dinamico). Gli editor visuali
della logica (⚙ Regole, 💬 Dialoghi) erano nati per la grammatica 0.18.0 e non
conoscevano i nuovi costrutti: aprirne uno nella form e risalvarlo poteva
**corrompere il sorgente** (in particolare i contatori con quantità dinamica
`aumenta X di [contatore]`, che venivano letti come un oggetto al posto di un numero).

### Corretto (sicurezza del round-trip)
- **Guardia di rappresentabilità estesa**: una regola/evento/demone/opzione di
  dialogo che contiene un costrutto dei Temi non ancora ricostruibile dalla form
  resta in **sola lettura** con **«✎ testo»** (salto al sorgente), come già per le
  regole troppo complesse. Niente più apertura nella modale → **nessun rischio di
  corruzione**. Copre: contatori con **quantità dinamica** (`di [contatore]`,
  `un numero fra A e B`), confronto/copia **stato↔stato** (`è come`, `diventa` —
  Tema 3), **estrazione** (`diventa uno fra …` — Tema 2b), **probabilità**
  (`càpita (N su M)` — Tema 2c). Helper condiviso `conseqRepresentable`.

### Aggiunto (visibilità in lettura)
- I costrutti dei Temi ora si **leggono correttamente** nei riassunti delle card
  (prima comparivano come «…» o `[object Object]`): `càpita (N su M)`, `X è come Y`,
  `X → (come) Y`, `X → uno fra a, b, c`, e le quantità dinamiche dei contatori
  (`di [contatore]`, `un numero fra A e B`). Tipo `Operando` e helper `operandoText`
  in `protocol.ts`/`logicBuilder.tsx`.

### Note
- **Frontend-only**: nessuna modifica al motore o al sidecar (il backend di analisi
  già emetteva i nuovi costrutti — era il renderer a non gestirli). 681+43 test del
  motore invariati. Typecheck + build verdi.
- **Lavoro residuo (Asse IDE)**: costruire gli **editor visuali veri** per i Temi 1-5
  (campi per operando dinamico, `è come`/`diventa`, `uno fra`, `càpita`) così che
  anche questi costrutti siano modificabili dalla form, non solo dal testo. Con la
  guardia attuale l'IDE è comunque **sicuro e completo** su qualunque file 1.0.0.

## [0.9.20] — 2026-06-11 — Bonifica bug: robustezza di sidecar, file e round-trip

Esito della revisione accurata dell'IDE (vedi `PROGETTAZIONE.md`, Blocchi 1-2).
Nessuna feature nuova: solo eliminazione di bug e rischi. Typecheck e build verdi.

### Corretto
- **CRLF nel round-trip** (il rischio peggiore): un `.fav` con fine-riga Windows
  (editor esterno, `git autocrlf`) poteva far slittare gli splice degli editor
  visuali e corrompere il sorgente in silenzio. Ora il contenuto è normalizzato a
  LF all'apertura (store) e il modello Monaco è forzato a LF (cintura e bretelle);
  al salvataggio i `.fav` restano LF per convenzione.
- **Scritture atomiche**: i salvataggi (`.favsave`), l'export HTML e `fs:write`
  (i `.fav` stessi) ora scrivono su file temporaneo + `rename`: un crash a metà
  scrittura non può più troncare il file di destinazione.
- **Sidecar zombie**: l'arresto è ora graduale con escalation (EOF su stdin →
  attesa 2s → `taskkill /T /F` su Windows / SIGKILL altrove) e `before-quit`
  attende la fine dello stop: niente più processi Python orfani alla chiusura.
- **Backpressure su stdin del sidecar**: le scritture RPC passano per una coda
  che rispetta `drain`: con payload grossi (export HTML) il framing NDJSON non
  può più interlacciarsi o perdere frame.
- **Errori del motore non più opachi**: il toast di crash include la causa
  (ultima riga del traceback Python, dal nuovo buffer di stderr); il traceback
  completo è in console DevTools e via la nuova API `sidecarLastError()`.
- **`.favsave` corrotti**: il caricamento valida la forma del file e mostra un
  dialogo d'errore esplicito invece di fallire in silenzio.
- **Motore mancante nell'app installata**: se `favella_engine.exe` non c'è
  (build fatto senza il passo PyInstaller), errore fatale chiaro
  («Installazione danneggiata…») invece del retry infinito su «Motore non pronto».
  In più, `npm run dist` ora FALLISCE in partenza (`predist`) se il sidecar
  congelato non esiste: impossibile produrre per sbaglio un installer rotto.

### Sicurezza (difesa in profondità)
- **`fs:read`/`fs:write`/`fs:exists`/`project:tree` confinati alla cartella del
  progetto aperto**: il main non fa più da proxy verso il filesystem globale
  anche nell'ipotesi di renderer compromesso (sandbox già attiva).

## [0.9.19] — 2026-06-05 — Fix export HTML: driver Python rotto dal template literal

### Corretto
- **Export gioco (📦) non partiva** — `SyntaxError: unterminated string literal` nel driver
  Python embedded. Causa: il driver era incorporato in un **template literal JS** (backtick),
  che interpretava i `\n` del driver come a-capo reali, spezzando le stringhe Python. Ora il
  driver viaggia nel **JSON dei dati** (`DATA.driver`), che fa l'escaping corretto. Verificato:
  il driver è Python sintatticamente valido, `</script>` resta unico, la storia appiattita
  compila. Fix nel backend condiviso (`compilatore.esporta_html`); 446 test motore verdi.

## [0.9.18] — 2026-06-05 — Fase 7: configurazione dell'installer IDE (electron-builder)

### Aggiunto
- **Config dell'installer Windows** (`build` in `package.json`: appId, NSIS con scelta
  cartella, `extraResources` che copia il sidecar congelato in
  `resources/engine/favella_engine.exe` — il path che `sidecar.ts` già usa in prod).
- **`PACKAGING.md`**: ricetta completa in due passi — (1) congelare il sidecar con
  **PyInstaller** (`--onefile --collect-all lark` + i 5 `.py` del motore come *datas*),
  (2) `npm run dist` per l'installer. Con caveat (firma, dimensioni, aggiornamento motore).
- **Fix per il bundle congelato**: `esporta_html` cerca i moduli del motore in
  `sys._MEIPASS` quando l'app è pacchettizzata (i `.py` sono inclusi come datas), così
  l'export HTML del gioco funziona anche nell'IDE installato.
- ⚠️ Il build effettivo dell'installer va eseguito su Windows con la `.venv` (non
  verificabile in CI headless): vedi `PACKAGING.md`. Motore **byte-stabile, 446 test**.

## [0.9.17] — 2026-06-05 — Fase 7: Esporta gioco come HTML autoportante

### Aggiunto
- **📦 Esporta** (titlebar): genera **un singolo file `.html`** che gioca l'avventura
  **nel browser**, col motore FAVELLA VERO eseguito via **Pyodide** (stesso contratto
  headless del sidecar e delle cassette-gioco della landing page). Incorpora i 5 moduli
  del motore + la **storia appiattita** (`Includi` risolti) + un terminale retrò. Il
  giocatore **non installa nulla** (serve un browser e, al primo avvio, la rete per
  scaricare Pyodide). Dialogo di salvataggio nativo (`<titolo>.html`).
- Backend additivo: `esporta_html` (compilatore.py) — appiattisce la storia, incorpora
  motore + storia in JSON (con escaping di `</` per non rompere l'HTML) e un player
  Pyodide; RPC **`game.exportHtml`** (sidecar **0.9.8**) + IPC `game:writeExport`.
  Motore byte-stabile, **446 test verdi**; verificato: HTML valido (un solo `</script>`),
  storia appiattita compila, DATA JSON valido coi 5 moduli; smoke NDJSON OK.

## [0.9.16] — 2026-06-05 — Autoformat: riordino canonico del sorgente

### Aggiunto
- **↕ Riordina** (titlebar): riorganizza le frasi del file in un **ordine canonico
  leggibile** (impostazioni → stanze → oggetti → stati/contatori → regole/eventi/demoni
  → dialoghi), **raggruppando le frasi di ogni entità** (definizione + descrizione +
  posizione + proprietà…). NON rigenera nulla: sposta **blocchi di testo verbatim**,
  con i commenti adiacenti, quindi regole/dialoghi/prosa restano intatti. Sostituisce
  l'intero buffer in un solo edit (undo nativo). **Idempotente** e byte-safe (la storia
  riordinata produce lo STESSO mondo). Solo file **singoli**: con `Includi` avvisa che il
  riordino non è disponibile (l'ordine d'un file con riferimenti esterni non è isolabile).
- Backend additivo: `riordina_sorgente` (compilatore.py) + RPC **`source.reorder`**
  (sidecar **0.9.7**). Motore byte-stabile, **446 test verdi**; round-trip e idempotenza
  verificati; smoke NDJSON OK.
- **Toast nell'IDE**: gli avvisi degli editor visuali (`gameNotice`: riordino, errori di
  serializzazione, edit cross-file…) ora compaiono come toast anche nella finestra
  principale (prima erano visibili solo nella finestra di gioco).

## [0.9.15] — 2026-06-05 — Mappa: posizioni delle stanze persistenti (drag)

### Aggiunto
- **Drag dei nodi mappa con persistenza** (🗺 Mappa, IDE): trascinando una stanza la
  sua posizione viene **salvata per-file** (`localStorage`) e mantenuta fra reload e
  riavvii. Le stanze senza posizione manuale usano ancora il layout automatico a
  griglia. Funziona anche con la modifica disattivata (posizioni libere prima ancora
  di collegare). Nuovo pulsante **⤢ Riallinea** per azzerare le posizioni manuali e
  tornare al layout automatico. Frontend-only (react-flow `useNodesState` +
  `onNodeDragStop`); nessun impatto su motore/test.

## [0.9.14] — 2026-06-05 — Capacità di trasporto (Livello 7) nell'editor Oggetti

### Aggiunto
- **Capacità di trasporto** nella scheda **📦 Oggetti** (completa l'allineamento dei
  costrutti del linguaggio):
  - in cima al pannello, il **limite globale** «🎒 Il giocatore può portare **N**
    oggetti» (campo numerico; **vuoto = illimitato**, il default). Scrive/rimuove
    `Il giocatore può portare N oggetti.`;
  - nella scheda del singolo oggetto, il **bonus** «Capacità (zaino): **dà N spazi**»
    (0 = nessuno). Scrive/rimuove `X dà N spazi.`.
  Entrambi round-trip (salva al blur, sostituisce o rimuove la frase via span).
- Backend additivo (`compilatore.py`): `analizza_outline` espone `carryBase`/
  `carryBaseSpan` e, per oggetto, `carryBonus`/`carryBonusSpan`; op serializzatore
  `carry_base` e `carry_bonus`. Sidecar invariato (0.9.6). Motore **byte-stabile,
  446 test verdi**; round-trip verificato. **Con questo l'IDE copre tutti i costrutti
  del linguaggio v0.18.0.**

## [0.9.13] — 2026-06-05 — Editor dei DEMONI (Livello 8) nella scheda ⚙ Regole

### Aggiunto
- **Demoni (sentinelle)** nella scheda **⚙ Regole**: il pulsante ➕ ha ora un terzo
  tipo **«Demone»** accanto a Regola ed Evento. Un demone **sorveglia una condizione**
  a ogni turno e scatta da solo:
  - **«appena la condizione diventa vera» (una volta)** → `Quando [cond] diventa vera: …`;
  - **«ogni turno in cui è vera» (ripetuto)** → `Ogni turno se [cond]: …`.
  Si compone la **condizione** (obbligatoria, costruttore annidato completo), la
  **risposta** (`dire "…"`) e le **conseguenze** (`e adesso …`). I demoni esistenti
  appaiono come card (bordo viola) con ✎ (riapre precompilato se rappresentabile,
  altrimenti «✎ testo») e × per eliminarli.
- Backend additivo: `analizza_regole` ora restituisce anche `demons[]` (con span +
  condizione/conseguenze in JSON); op serializzatore **`demon`** (`_serializza_demone`).
  Sidecar invariato (0.9.6). Motore **byte-stabile, 446 test verdi**; round-trip
  (serializza→compila→rileggi) verificato per entrambi i tipi di demone; smoke NDJSON
  `world.rules` legge i 3 demoni del «Relitto Silente». **Chiude il blocco «logica»:
  ogni costrutto del linguaggio ha ora un editor visuale.**

## [0.9.12] — 2026-06-05 — Builder allineati ai costrutti v0.18.0 + valore iniziale contatori

### Aggiunto
- **Costrutti v0.18.0 nei costruttori di logica** (condivisi da ⚙ Regole e 💬 Dialoghi,
  via `logicBuilder`):
  - **Condizione «il giocatore è in [stanza]»** (B1), con la negazione «non»;
  - **Contatori**: nuovi confronti «**non è**» (≠, B5) e «**è al massimo**» (≤, B4);
  - **Conseguenza «sposta il giocatore»** (teletrasporto in una stanza, B2);
  - **«fine partita»** con **testo d’esito** opzionale (`vinci "…"`, B3).
- **Valore iniziale dei contatori** (⚖ Stati): ogni contatore mostra un «**parte da N**»
  modificabile sul posto (0 = default, nessuna frase); la modale di creazione contatore
  ha il campo «valore iniziale». Op serializzatore `counter_init` (`X parte da N.`);
  `analizza_variabili` espone `initial`/`initialSpan` sui contatori.
- Backend additivo (`compilatore.py`): `_cond_to_json`/`_conseq_to_json` ora mappano
  posizione giocatore, teletrasporto, ≠ (NOT(==)→cmp '!='), ≤, e il messaggio d’esito;
  `_serializza_condizione`/`_serializza_conseguenza` generano le frasi corrispondenti.
  Sidecar invariato (0.9.6). Motore **byte-stabile, 446 test verdi**; round-trip
  (serializza→compila→rileggi) verificato per tutti i nuovi costrutti.

## [0.9.11] — 2026-06-05 — Fase 6b: Editor dei DIALOGHI/NPC (copione in-place)

### Aggiunto
- **Editor dei DIALOGHI** (nuova scheda **💬 Dialoghi**, titlebar + dock): **chiude la
  Fase 6 degli editor visuali**. Pensato come un **copione modificabile sul posto**,
  ordinato dall’alto in basso (niente più finestre sparse), con round-trip testo↔visuale
  completo via splice Monaco e **undo nativo**.
  - **① Personaggi**: gli NPC con il loro **nodo d’ingresso** (tendina) e un comando per
    **promuovere** un oggetto a personaggio.
  - **② Copione (nodi)**: ogni nodo è una **scheda editabile in-place**:
    - **battuta** modificabile direttamente nel campo (salva uscendo dal campo);
    - **risposte** del giocatore in lista, ognuna con **testo** e **esito** (*chiude* /
      *→ nodo*) editabili sul posto; **«+ risposta»** aggiunge una riga;
    - **rinomina del nodo** (✎ sull’etichetta) **propagata** a TUTTE le frasi che lo
      citano — battuta, risposte del nodo, nodo d’ingresso e ogni `conduce al nodo`;
    - **★** marca il nodo d’ingresso del personaggio; **🗑** elimina l’intero nodo
      (battuta + risposte + eventuale «comincia con»); **chi parla** cambiabile da tendina;
    - le **parti avanzate** della risposta (condizione `se …`, conseguenze `e adesso …`)
      si aprono con **⚙** in una modalina (riusa i costruttori delle Regole), restando
      fuori dal flusso comune.
  - **Creazione nodo** (➕): unica modale che resta (chi parla + etichetta + prima battuta
    + «è il nodo d’ingresso»), perché è il momento in cui il nodo «nasce» dalla battuta.
- Backend additivo (**sidecar 0.9.6**): RPC **`world.dialogues`** + funzione
  **`analizza_dialoghi`** (secondo parse posizionato per gli **span** di
  `def_personaggio`/`def_dialogo_inizio`/`def_battuta`/`def_opzione`; struttura
  autorevole dal mondo compilato; condizioni/conseguenze in JSON ricorsivo). Multi-file:
  ogni ancora è uno span `{file, line, endLine}`.
- **Op del serializzatore**: `npc_decl`, `dialogue_start` (con preposizione articolata
  concordata: *del mercante*, *dell’anziano*), `node_line`, `dialogue_option`. Round-trip
  verificato: le frasi generate (incluse opzioni con condizioni AND e conseguenze) e un
  file dopo una **rinomina propagata** ricompilano puliti, senza nodi appesi.
- **Refactor**: i costruttori di condizioni/conseguenze (`CondGroup`/`ConsRow` +
  helper) estratti da `RuleForm` in **`logicBuilder.tsx`** condiviso, riusati identici
  dall’editor dei dialoghi (zero duplicazione).
- Nuove azioni store: **`appendStatements`** (N frasi in un solo edit → niente span che
  slittano), **`renameDialogueNode`** (rinomina propagata, replace a riga singola) e
  **`deleteDialogueNode`** (elimina l’intero nodo, dal basso verso l’alto).
- Motore **byte-stabile, 446 test verdi** (solo funzioni additive in `compilatore.py`);
  typecheck + build puliti. **Resta il test visivo GUI di Simone.**

## [0.9.10] — 2026-06-03 — Editor delle stanze + fix ordine posizioni

### Aggiunto
- **Editor delle STANZE** (nuova scheda **🏠 Stanze**, titlebar + dock): lista delle stanze
  + form per la stanza selezionata. Modifica la **descrizione** (textarea + Salva, round-trip
  via `descSpan`; le descrizioni condizionali restano «modificale nel testo» con salto alla riga).
  Imposta la **posizione iniziale del giocatore** (checkbox ★): scrive `Il giocatore comincia in
  <stanza>.` (nome senza articolo → «in cucina») **sostituendo** l'eventuale partenza precedente
  invece di accumularne. Mostra anche le **uscite** (sola lettura: si collegano dalla Mappa). Il
  **nome** è in sola lettura (rinominare cambia l'id → si fa nel testo).
- Backend additivo: `world.outline` ora espone **`startSpan`** (span della frase «Il giocatore
  comincia in X.»), per sostituirla in modo pulito. Sidecar **0.9.4**. Motore byte-stabile, **344 test verdi**.

### Corretto
- **Ordine delle posizioni** nell'editor Oggetti: spostando un oggetto in una **stanza creata da
  poco** (definita in fondo al file), la frase di posizione veniva sostituita *in loco* finendo
  PRIMA della definizione della stanza → errore «stanza inesistente». Ora l'IDE controlla se la
  destinazione è definita prima del punto della frase: se sì sostituisce in loco (preserva il
  layout), se è definita dopo **appende in fondo** (come già per i contenitori). Stessa
  salvaguardia ordine-dipendenze del transformer.

## [0.9.9] — 2026-06-03 — Fase 6c.4: Eventi visuali + avviso «Invece di»

### Aggiunto
- **Creazione/modifica visuale di EVENTI** nella stessa modale di RuleForm. Il pulsante ➕
  della scheda ⚙ Regole ora apre una modale con un **toggle «Regola» / «Evento»**.
  Scegliendo **Evento**: tempistica **«al turno N» (una volta)** o **«ogni N turni»
  (ripetuto)** + numero, la frase `dire`, e le **stesse conseguenze** delle regole
  (proprietà/stato/contatore/sposta/fine partita). Genera `Al turno N: …` / `Ogni N turni: …`
  (op serializzatore `event`, già esistente da 6c.2). Gli eventi nella lista hanno ora **✎**
  per riaprirli precompilati (prima solo ×). Frontend-only: **sidecar invariato (0.9.3),
  motore byte-stabile, 344 test verdi.**
- **Avviso «Invece di sostituisce l'azione normale»** nel builder di regole: quando il verbo
  ha un **effetto di default** (prendi, lascia, metti, apri… + sinonimi) compare un riquadro
  che ricorda che `Invece di` viene eseguito **al posto** dell'azione normale, e che per
  mantenere l'effetto (es. l'oggetto in inventario) va aggiunto come conseguenza
  (es. **sposta → in inventario**). Previene il tranello classico dell'IF (regola che blocca
  silenziosamente la presa di un oggetto).

## [0.9.8] — 2026-06-03 — Pannello «Stati & Contatori» (parametri di stato)

### Aggiunto
- **Nuova scheda ⚖ Stati** (titlebar + dock): crea, modifica ed elimina i **parametri
  di stato** del mondo — gli **stati** (variabili a parole, enum-like: `atmosfera` =
  tranquilla/inquieta/ostile) e i **contatori** (numeri che salgono e scendono, partono
  da 0: `sospetto`, `punteggio`). Finora si dichiaravano solo a mano nel testo, e i menu
  a tendina del builder di regole restavano vuoti finché non lo si faceva.
- **Creazione** in una **modale ampia**: tipo (stato/contatore), nome, e per gli stati
  il **valore iniziale** + l'**elenco dei valori ammessi**. Scrive le frasi canoniche
  `X è uno stato.` / `X è un contatore.` / `X è valore.`
- **Persistenza dei valori ammessi** via un **commento canonico** `# valori di X: a, b, c`
  scritto sotto la dichiarazione: il **motore lo ignora** (è un commento → semantica
  byte-stabile, 344 test intatti) ma il sidecar lo legge per popolare i menu **subito**,
  anche con valori non ancora usati in alcuna regola.
- **Modifica inline** di uno stato nella lista: **chip dei valori** cliccabili (clic =
  imposta come **valore iniziale ★**, **×** = togli dall'elenco), campo **+valore** per
  aggiungerne, **×** per eliminare lo stato/contatore. Ogni operazione riscrive una sola
  frase via lo span (undo nativo); l'eliminazione rimuove dichiarazione + valore iniziale
  + commento dal basso verso l'alto (le righe superiori non slittano).
- **Builder di regole più ricco**: il campo «valore» di una condizione/conseguenza su uno
  stato ora **suggerisce i valori noti** (datalist) restando comunque digitabile. Alimentato
  dal nuovo `menu.stateValues` (valori **osservati** nel sorgente ∪ **dichiarati** nel commento).

### Backend (additivo — motore byte-stabile, 344 test verdi)
- `compilatore.py`: 4 op del serializzatore (`state_decl`, `state_init`, `counter_decl`,
  `state_values_comment`); funzione `analizza_variabili(path, source)` (stati/contatori con
  gli **span** di dichiarazione/valore iniziale/commento, per l'editing chirurgico);
  `menu.stateValues` in `analizza_regole`.
- Sidecar **0.9.3**: nuova RPC **`world.variables`**.

## [0.9.7] — 2026-06-02 — Fase 6c.3: Condizioni annidate, modifica regole, spostamento

### Aggiunto
- **Costruttore di CONDIZIONI booleane annidate** nella stessa modale di RuleForm
  (sezione **«Solo se…»**): gruppi `e` («tutte vere») / `oppure` («almeno una») con
  **parentesi a piacere** (sotto-gruppi annotabili senza limiti di profondità). Ogni
  atomo è di quattro tipi — **il giocatore ha** un oggetto · **un oggetto è** una
  proprietà · **uno stato è** un valore · **un contatore** confronta un numero
  (`è / è almeno / è più di / è meno di`). **Negazione infissa** (casella «non») offerta
  **solo** su possesso/proprietà/stato, mai sui contatori né sui gruppi — esattamente i
  vincoli della grammatica. Un gruppo annidato con un solo termine si collassa da sé.
- **Modifica delle regole esistenti**: pulsante **✎** sulla scheda di ogni regola
  **rappresentabile** → riapre la modale **precompilata** (verbo, bersaglio, condizione,
  risposta, conseguenze) e **sostituisce** la frase via lo span (undo nativo). Le regole
  troppo complesse per l'editor mostrano **«✎ testo»**, che salta alla riga nel sorgente
  (come già per le descrizioni condizionali).
- **Conseguenza di SPOSTAMENTO** (`move`) nel builder: «sposta un oggetto → **nel nulla**
  (sparisce) / **in inventario** / una **stanza** / dentro un **contenitore** / sopra un
  **supporto**», con la **preposizione concordata** (`nel nulla`, `in inventario`,
  `in cucina`, `nella scatola`, `sul tavolo`). È la conseguenza che fa «buttare/perdere»
  un oggetto. Forme verificate in round-trip (compila e gira).
- Sidecar **0.9.2**: completato `_serializza_conseguenza` per `move` (prima sollevava
  `ValueError`); riusa `_frase_posizione` con prep/place calcolati dalla UI, con ripiego
  da `dest`/`destName` per il round-trip da lettura. Motore byte-stabile, **334 test verdi**.

### Cambiato
- Logica di preposizione concordata estratta in `renderer/src/utils/posizione.ts`
  (`nucleo`/`articoloDi`/`prepPlace`/`specPosizione`), condivisa fra ObjectsEditor e
  RuleForm (comportamento invariato).

## [0.9.6] — 2026-06-02 — Fase 6c.2: Creazione di regole (builder in modale ampia)

### Aggiunto
- **Creazione visuale di regole** dalla scheda ⚙ Regole (pulsante ➕): un **builder in
  finestra modale ampia e centrata** (non più incastrato nel dock), con sezioni spaziate:
  - **«Quando il giocatore fa…»**: verbo (menu dei verbi validi) + bersaglio (— globale —,
    un oggetto o una direzione); se oggetto, preposizione `con/su/contro/in` + **secondo
    oggetto** (regole a due oggetti).
  - **«Di' al giocatore»**: testo della risposta (obbligatorio).
  - **«E adesso…»**: lista di **conseguenze** (proprietà di un oggetto · valore di uno stato ·
    contatore `aumenta/diminuisci/diventa N` · fine partita `vinci/perdi/termina`), ognuna su una
    riga editabile con rimozione. (Lo **spostamento** di oggetti arriva con 6c.3.)
  - **Crea regola** appende la frase `Invece di …: dire "…" e adesso …` in fondo al file
    (round-trip via `outline.serialize`, undo nativo); Esc/click-fuori chiudono.
- Sidecar **0.9.1**: nuove op del serializzatore **`rule`** ed **`event`** (+ sub-serializer
  ricorsivi di **condizione** e **conseguenza**, shape simmetrica a `world.rules`). Le condizioni
  annidate (AND/OR/NOT con parentesi) sono già supportate in scrittura; resta da fare la UfI di
  costruzione (6c.3). Rispetta i vincoli grammaticali (NOT infisso solo su has/prop/var). Motore
  byte-stabile, **334 test verdi**.

### Cambiato
- **UX**: il builder di regole non è più un blocco con scrollbar interna nel dock stretto, ma una
  **modale dedicata** (separazione panoramica/lista nel dock ↔ editing in modale).

## [0.9.5] — 2026-06-02 — Fase 6c.1: Editor di regole/eventi (lettura + elimina)

### Aggiunto
- **Nuova scheda ⚙ Regole** (titlebar + dock): elenca **regole** (`Invece di …`) ed
  **eventi** (`Al turno N` / `Ogni N turni`) del file come card leggibili — verbo + bersaglio
  (o «globale»), eventuale condizione **«se …»** (anche annidata: `… e …`, `… oppure …`, `non …`),
  la risposta **di' "…"** e i **chip delle conseguenze** (`porta → aperta`, `diminuisci carica`,
  `sposta X → inventario`, `vinci/perdi/termina`). **×** elimina la frase dal sorgente (undo nativo).
- Sidecar **0.9.0**: nuovo RPC **`world.rules`** + funzione additiva **`analizza_regole`**: compila
  il Mondo (verità semantica) e dal secondo parse posizionato ricava lo **span** di ogni frase
  `def_regola`/`def_evento`; condizione e conseguenze sono serializzate in **JSON ricorsivo**
  (shape simmetrica, pronta per la scrittura di 6c.2/6c.3); include i **menu** per i costruttori
  (verbi validi, oggetti, stanze, direzioni, stati, contatori). Span agganciato per `(verbo, risposta)`
  / `(tipo, n, risposta)`. Motore byte-stabile, **334 test verdi**.

### Note
- Primo dei 4 sotto-step dell'editor regole («logica senza codice»): **6c.1 lettura+elimina** (questo),
  6c.2 creazione regole, 6c.3 condizioni annidate + modifica, 6c.4 eventi.

## [0.9.4] — 2026-06-02 — Contenuto di contenitori/supporti (Posizione estesa)

### Aggiunto
- **Posizione verso contenitori e supporti**: il menu Posizione dell'inspector oggetti
  è ora raggruppato — **Stanze** · **Dentro un contenitore** · **Sopra un supporto**.
  Scegliendo un contenitore/supporto genera la frase con **preposizione articolata
  concordata** dall'articolo del bersaglio: `nella scatola`, `sul tavolo`, `nell'armadio`.
- **Sezione «Contenuto»** sulla scheda di un contenitore (o «Sopra (contenuto)» per i
  supporti): elenca gli oggetti contenuti, **×** per toglierne uno, e un menu
  **«+ metti un oggetto qui…»** per aggiungerne (entrambe le vie scrivono la frase di
  posizione dell'oggetto contenuto — un contenitore può contenerne quanti se ne vuole).

### Corretto
- **Ordine del sorgente per le posizioni in contenitore** (il transformer tipa le frasi
  nell'ordine del file): collocare un oggetto *dentro* un contenitore/supporto ora
  **appende** la frase in fondo (dopo ogni definizione) ed elimina l'eventuale posizione
  precedente, invece di sostituirla in loco. Evita l'errore «Stanza inesistente '<contenitore>'
  per posizionare '<oggetto>'» quando la posizione precedeva la definizione del contenitore.
  Per le **stanze** (definite prima) resta la sostituzione in loco, che preserva il layout.

### Note
- Nessuna modifica al sidecar (riusa l'op `position` e `world.outline` esistenti): resta 0.8.3.

## [0.9.3] — 2026-06-02 — Proprietà come coppie opposte / condizioni a due stati

### Aggiunto
- **Inspector oggetti — sezione «Stati (proprietà a due valori)»**: le proprietà che
  formano una **coppia opposta** non sono più tag liberi, ma **selettori segmentati**
  a tre vie `[lato A] [lato B] [—]`, col valore attivo evidenziato.
  - Le coppie offerte sono **aperta↔chiusa** (default del motore, governa il contenuto
    visibile dei contenitori) più tutte quelle **dichiarate dall'autore**.
  - Clic su un lato: se l'altro era attivo ne **sostituisce** la frase (così il sorgente
    non resta contraddittorio con entrambe le proprietà); se nessuno era attivo,
    **aggiunge** `Oggetto è <lato>.`; **—** rimuove lo stato.
  - **+ coppia opposta**: due campi (es. `accesa` / `spenta`) → scrive
    `accesa e spenta sono opposte.` in fondo al file; subito dopo la coppia è disponibile
    come selettore per **tutti** gli oggetti.
  - I membri delle coppie non compaiono più tra i tag liberi di «Proprietà» (niente doppione).
- Sidecar **0.8.3**: `world.outline` espone `opposites[{a,b}]` (coppie note nel mondo,
  default + dichiarate, dedotte da `mondo.opposti` con dedup canonico); nuova op del
  serializzatore **`opposite_decl {a,b}`** → `a e b sono opposte.`. Additive: motore byte-stabile.

### Note
- Questo è il primo dei tre livelli di «proprietà» individuati: (1) condizioni a due stati
  note al motore, (2) coppie opposte custom, (3) **comportamento = regole** (prossimo grande
  passo: editor visuale di regole/eventi). Vedi roadmap.

## [0.9.2] — 2026-06-02 — Fase 6a.4: Inspector oggetti (crea + modifica)

### Aggiunto
- **Scheda 📦 Oggetti**: lista degli oggetti del file e form di modifica del selezionato.
  - **➕ Nuovo oggetto** (nome + tipo: oggetto/contenitore/supporto/personaggio).
  - Campi editabili: **Tipo**, **Prendibile**, **Posizione** (stanza), **Descrizione**,
    **Proprietà** (aggiungi/rimuovi), **Sinonimi/alias** (aggiungi/rimuovi).
  - Tutto round-trip: ogni modifica genera/sostituisce/elimina la frase `.fav` canonica
    via `outline.serialize` + splice in Monaco (**undo nativo**), poi ricarica l'outline.
- Nuovo edit `replaceLines` (oltre ad append/deleteLines) e azioni store generiche
  `applyStatement(spec, span?)` / `deleteStatement(span)`.

### Note
- La modifica di frasi GIÀ esistenti agisce sul **file attivo**; in multi-file le aggiunte
  funzionano sempre, mentre per cambiare una frase di un file Incluso l'IDE invita ad aprirlo.
- Limite di design noto (prossimo lavoro): le **proprietà** sono ancora «tag» liberi. Alcune
  sono in realtà **condizioni a due stati** che il motore conosce (aperta↔chiusa) o che vanno
  rese tali (accesa↔spenta) + **regole** di comportamento. Vedi roadmap.

## [0.9.1] — 2026-06-02 — Pannelli live + direzioni custom dalla mappa

### Aggiunto
- **Pannelli che si aggiornano da soli durante il gioco**: la finestra di gioco
  dedicata avvisa l'IDE a ogni turno (IPC `game:advanced` → `game-advanced`); l'IDE
  ricarica Stato/Debug/Mappa leggendo dal **sidecar condiviso**. `loadWorldSnapshot`
  non dipende più dallo stato di gioco *locale* della finestra IDE (interroga sempre
  il sidecar), così riflette la partita giocata nella finestra dedicata.
- **Mappa che segue il testo**: con la Mappa aperta, modificando il `.fav`
  nell'editor la topologia si ridisegna da sola (debounce ~500ms, come l'auto-compile),
  senza riaprire la scheda. Solo in anteprima (nessuna partita in corso).
- **➕ Nuova direzione** dal selettore di connessione: l'autore indica una direzione
  custom e la sua **opposta** (es. «botola» ↔ «scala»); l'IDE scrive
  `Botola e scala sono direzioni opposte.` e crea la connessione. Le direzioni offerte
  ora sono solo quelle **valide nel file** (`world.outline` espone `directions`) più le
  verticali comuni (alto/basso), auto-dichiarate se mancanti. Op `direction_decl` nel
  serializzatore. Sidecar `0.8.2`.

### Corretto
- **Direzioni non native rompevano la mappa**: scegliendo «alto» (non dichiarata)
  veniva scritta una frase non valida e la mappa andava in errore. Ora le direzioni
  non native sono auto-dichiarate (verticali) o gestite via ➕ Nuova direzione; quelle
  non dichiarabili vengono **rifiutate con avviso, senza toccare il file**.

## [0.9.0] — 2026-06-02 — Fase 6 (parte 1): mappa editabile + migliorie IDE

Primo pezzo VISIBILE degli editor visuali: la mappa diventa modificabile e le
modifiche si riversano nel sorgente `.fav` canonico (round-trip testo↔visuale).
Più un giro di rifiniture all'IDE emerse dal test d'uso.

### Aggiunto
- **Mappa editabile** (dock 🗺 Mappa, pulsante **✏️ Modifica**):
  - **Trascina** da una stanza all'altra → scegli la direzione → scrive
    `X collega DIR a Y.` (il ritorno opposto è automatico). Pallini di aggancio
    resi grandi e dorati per scopribilità.
  - **➕ Stanza**: crea `Nome è una stanza.` dal nome digitato.
  - **Clic su una connessione** → conferma → rimuove la frase `collega`.
  - Le modifiche passano per Monaco (**undo nativo** + diagnostica) e la mappa si
    ridisegna. Se una frase vive in un file Incluso diverso, viene segnalato.
  - Tipi `Outline*`/`Serialize*` (protocol), `worldOutline`/`serializeStatement`
    (preload), azioni `loadOutline`/`mapAddConnection`/`mapDeleteConnection`/
    `mapAddRoom` + `pendingEdit` applicato da EditorPane (`executeEdits`).
- **Nuovo progetto** (Esplora → ✚ / «Nuovo progetto…»): scegli cartella e nome,
  crea un `.fav` vuoto e lo apre. RPC `project:new`.
- **Dock destro ridimensionabile**: maniglia sul bordo sinistro (larghezza 320–900px).

### Cambiato
- **Tab unificate (niente più doppioni)**: le schede Mappa/Stato/Debug vivono SOLO
  nella titlebar — si evidenziano quando attive e, ricliccando l'attiva, chiudono il
  pannello. Il dock mostra solo titolo + ✕ (rimossa la fila di tab duplicata).

### Corretto
- **Chiusura scheda con file modificato**: la tab mostrava il pallino ● *al posto*
  della ×, e sembrava non chiudibile. Ora (stile VS Code) il pallino diventa **×** al
  passaggio del mouse; il clic chiude sempre (con la guardia Salva/Non salvare/Annulla).

## [Fase 6a.2] — 2026-06-02 — Serializzatore canonico (round-trip, scrittura)

*Sidecar `0.8.1`; versione IDE invariata a `0.8.1` (nessuna UI ancora: è la base motore).*

### Aggiunto
- **`serializza_frase` + RPC `outline.serialize`**: data una specifica strutturata
  (op + campi) genera **la frase `.fav` canonica** nello stile d'autore (es.
  `L'ingresso collega nord a il salotto.`, `La descrizione della cucina è "…".`).
  È la metà in **scrittura** del round-trip: l'IDE comporrà le frasi dalle modifiche
  delle form e le inserirà/sostituirà nel buffer usando gli span di `world.outline`.
  Op: room/object def, description (con preposizione articolata concordata),
  connection, position (niente doppio articolo: `sul tavolo`, `nell'astuccio`),
  property, prendibile, alias, start.

### Corretto
- **`world.outline` multi-file**: ogni ancora è ora uno **span `{file, line, endLine}`**
  (prima solo la riga). In progetti con `Includi`, una frase può vivere in un file
  diverso dal radice: senza il `file` lo splicer avrebbe editato il file sbagliato.
  Verificato: `tavolino` risolto a `oggetti.fav:25`, non più `storia.fav:25`.
  (Rinominati i campi: `defLine`/`descLine`/`line` → `defSpan`/`descSpan`/`span`.)

## [0.8.1] — 2026-06-02 — Guardia «modifiche non salvate» + fondazione editor visuali

### Aggiunto
- **Avviso di salvataggio in uscita**: chiudendo una scheda o l'app con un `.fav`
  modificato, ora compare un dialogo **Salva / Non salvare / Annulla** (prima le
  modifiche si perdevano in silenzio). Vale sia per la singola scheda sia per la
  finestra (un solo avviso riepilogativo con N file). Esc = Annulla, Invio = Salva.
- Il dialogo è un **modal integrato nello stile dell'IDE** (sfondo scurito, card
  arrotondata, titolo oro, pulsanti primary/ghost/danger), non più la finestra
  nativa di Windows. Handshake `before-close` main↔renderer: il main intercetta la
  chiusura, il renderer mostra il modal e conferma.
- **Fondazione Fase 6a (editor visuali) — lato lettura**: RPC `world.outline` e
  funzione additiva `analizza_outline` che restituisce un modello editabile di
  stanze e oggetti con lo **span sorgente di ogni frase** (per il futuro round-trip
  testo↔visuale: editing chirurgico per-frase senza toccare commenti/prosa/ordine).
  `costruisci_parser` ha ora un flag `propagate_positions` (default `False`, così
  il percorso del motore e dei test resta byte-stabile). Sidecar a `0.8.0`.
  Nessuna UI ancora: è solo la base, già verificata via NDJSON. **334 test verdi.**

## [0.8.0] — 2026-06-02 — Salvataggio partite (command-log)

### Aggiunto
- **Salva / Carica partita** nella finestra di gioco (💾 / 📂), su file `.favsave`.
  Approccio **command-log**: poiché FAVELLA è deterministico, il salvataggio è la
  semplice **sequenza dei comandi giocati** (+ riferimento alla storia: path e
  sorgente). Il caricamento **ricompila il mondo e ri-esegue i comandi**, riproducendo
  esattamente lo stato e mostrando il transcript fino al punto salvato. Salvataggi
  minuscoli e robusti, senza serializzare il Mondo.
- RPC `session.save` (esporta `{version, path, source, commands, turn}`) e
  `session.load` (ricompila + replay). Dialoghi file nativi gestiti dal processo main
  (`game:writeSave` / `game:readSave`). Sidecar a `0.7.0`.
- Notifica transitoria in finestra di gioco («Partita salvata/caricata (turno N)»).

## [0.7.0] — 2026-06-02 — Fase 5: Debugger passo-passo

### Aggiunto
- **RPC `session.history`** nel sidecar: la sessione registra **uno snapshot per
  turno** (più il comando che l'ha prodotto, `null` per lo stato iniziale). Sidecar
  a `0.6.0`.
- **Scheda «🐞 Debug»** nel dock destro: timeline turno-per-turno con il **diff dello
  stato** calcolato fra snapshot consecutivi — spostamenti del giocatore, oggetti
  presi/lasciati, cambi di **variabili** (stati/contatori), spostamenti di oggetti,
  cambi di **proprietà** (es. porta chiusa → aperta) ed esito della partita. Ogni passo
  mostra turno, comando e i cambiamenti; più recente in cima; ⟳ per aggiornare.
- La history si rilegge dal **sidecar condiviso**, quindi il debugger nell'IDE
  riflette anche le partite giocate nella **finestra di gioco** (⟳ per aggiornare).
- Pulsante **🐞 Debug** in barra del titolo (apre il dock sulla scheda Debug).

### Corretto
- **Bug critico di digitazione nell'editor**: modificando la riga di un errore dopo
  averci cliccato sopra nel pannello Problemi, il testo si scriveva **al contrario**.
  Causa: l'effetto di "salto al cursore" (reveal) dipendeva da `active`, che cambia
  identità a ogni battitura, e rispingeva il cursore alla posizione del reveal a ogni
  tasto. Ora dipende solo dalla richiesta di reveal (nonce) e da `activePath`.
  L'editor passa inoltre a `defaultValue` (uncontrolled) per non reimpostare il buffer.

### Aggiunto (UX)
- **Pulsante Salva** in barra del titolo: **● Salva** (ambra) quando ci sono modifiche,
  **✓ Salvato** a riposo. Affianca le scorciatoie esistenti `Ctrl+S` / `Ctrl+Shift+S`.

## [0.6.0] — 2026-06-02 — Finestra di gioco dedicata

### Aggiunto
- **Finestra di gioco separata** (stile Godot): **▶ Gioca** e **F5** ora aprono una
  finestra dedicata al solo gioco, con **font grande** e layout **a blocchi**:
  - **Storia** — il racconto, in serif e corpo grande, con auto-scroll ed eco dei comandi;
  - **Parser** — input dei comandi e bottoni delle opzioni di dialogo, banner di esito;
  - **Inventario** — sempre visibile, con la capacità di trasporto «(usati/max)»;
  - **Stato** — variabili (stati/contatori) live;
  - **Mappa** — la mappa react-flow con la stanza corrente evidenziata.
- **L'IDE non cambia**: Editor, Problemi e il dock Gioca/Mappa/Stato restano come
  prima (anteprima/ispezione). Le due finestre hanno store indipendenti ma parlano
  allo **stesso sidecar** (un'unica partita, posseduta dalla finestra di gioco).
- Ponte main↔finestra: `game:open` (l'IDE passa path + buffer live), `game:launchPayload`
  (la finestra lo recupera all'avvio), evento `game-relaunch` (ri-pressione di ▶ Gioca).
  La finestra carica la stessa build del renderer con hash `#game`.

### Note
- L'avvio del gioco compila e gioca il **buffer live** del file `.fav` attivo
  (anche non salvato), come per l'anteprima.
- Le **opzioni di dialogo** non sono più duplicate: l'elenco numerato del motore è
  filtrato dal log (`righeConsole`) perché reso come **bottoni**; la battuta dell'NPC resta.
- Mappa della finestra in modalità **compatta** (`MapView compact`: niente minimappa,
  che in un riquadro piccolo copriva il grafo) e con **più spazio** (colonna a 430px,
  la mappa cresce, lo Stato limitato).

## [0.5.1] — 2026-06-02 — Capacità di trasporto nell'inspector

### Aggiunto
- `world.snapshot` ora riporta **`carryUsed`/`carryMax`** (capacità di trasporto del
  giocatore, Livello 7 del linguaggio / motore v0.13.0); l'ispettore di stato mostra
  «Inventario (n/max)». `carryMax` è `null` se l'autore non ha dichiarato una capacità
  (inventario illimitato). Sidecar a `0.5.1`, motore riportato a `0.13.0`.

## [0.5.0] — 2026-06-02 — Fase 4: Mappa & Stato

### Aggiunto
- **RPC `world.graph`** nel sidecar: topologia del mondo (stanze = nodi, uscite =
  archi direzionati con la direzione, stanza di partenza marcata). Senza `path` usa
  il mondo della partita attiva; con `path`/`source` compila il buffer per
  un'anteprima della mappa **senza giocare**.
- **RPC `world.snapshot`**: stato **live** della partita attiva — posizione e nome
  della stanza, turno, esito, dialogo in corso, **variabili** (stati e contatori con
  valore), **inventario**, e tutti gli **oggetti** con posizione (stanza/contenitore/
  inventario) e proprietà.
- **Dock destro a schede** (`RightDock`): **▶ Gioca · 🗺 Mappa · 🔎 Stato** in un unico
  pannello. Il pannello Gioca della Fase 3 è ora una scheda.
- **Mappa del mondo** (react-flow): le stanze sono disposte su una **griglia che segue
  le direzioni** (nord/sud/est/ovest → su/giù/destra/sinistra; le verticali e le
  direzioni custom ripiegano su celle libere), archi reciproci uniti in un solo arco
  bidirezionale etichettato con la direzione. Pan/zoom, minimappa, controlli; la
  **stanza corrente è evidenziata** (oro) e quella di **partenza** (verde) durante il gioco.
- **Ispettore di stato**: contatori, stati, inventario e oggetti (per posizione e
  proprietà) aggiornati a **ogni turno**; intestazione con stanza/turno/esito.

### Note
- Lo `snapshot` è ricaricato dopo ogni comando (e al riavvio), così Mappa e Inspector
  restano sincronizzati con la partita. La Mappa, fuori partita, compila il `.fav`
  attivo per l'anteprima della topologia.
- Nuova dipendenza front-end: `reactflow` (^11). Build/typecheck puliti, **321 test
  del motore invariati** (le aggiunte vivono solo nel sidecar).

## [0.4.0] — 2026-06-02 — Fase 3: Gioca

### Aggiunto
- **Sessione di gioco** nel sidecar (`favella_server.py`): RPC `session.start`,
  `session.send`, `session.reset`. Avvolgono `elabora_comando` del motore — già
  *headless* (prende una stringa, non chiama `input()`, dialoghi a turni) — sotto
  **cattura di stdout**, restituendo all'IDE il testo della console e un'istantanea
  di stato `{gameOver, outcome, inDialogue, dialogueOptions, room, turn}`.
- **Compilazione giocabile** additiva in `compilatore.py`:
  `compila_mondo(percorso, sorgente=None)` — stessa pipeline di `analizza_file`,
  ma **restituisce il Mondo** invece di stamparne il riepilogo, e compila il
  **buffer live** (gli `Includi` risolti dal disco). `analizza_file` resta
  byte-stabile (**321 test invariati**).
- **Pannello «Gioca»**: console testuale con auto-scroll ed eco dei comandi,
  riga di input (Invio per inviare), **bottoni per le opzioni di dialogo** (numerate,
  filtrate per condizione), **banner di esito** (vinta/persa/terminata), indicatore di
  stanza e turno, **↻ Riavvia**. Si apre dal pulsante **▶ Gioca** in barra del titolo
  o con **F5**; gioca il file `.fav` attivo (buffer live).

### Note
- Il **riavvio** rigioca lo *stesso* sorgente da cui è nata la partita (le modifiche
  live dell'editor non rientrano a metà partita; per giocarle, ▶ Gioca riparte dal
  buffer aggiornato).
- Su errore di compilazione, `session.start` restituisce `ok=false` con le
  diagnostiche d'autore (dal canale strutturato della Fase 2), mostrate nel pannello.
- **Prossimo (Fase 4)**: chiusa questa fase, si elimina il vecchio `favella_studio.py`.

## [0.3.0] — 2026-06-01 — Fase 2: Compile & diagnostica

### Aggiunto
- **Compilazione strutturata** del motore esposta all'IDE: nuova funzione additiva
  `analizza_file_strutturato(percorso, sorgente=None)` in `compilatore.py` che
  rispecchia la pipeline di `analizza_file` (espansione `Includi` → symbol table →
  parser LALR → transformer → validazione + linter) ma **raccoglie** le diagnostiche
  invece di stamparle. `analizza_file` resta byte-stabile (321 test invariati).
- **RPC `compile`** nel sidecar (`favella_server.py`): compila un `.fav` e restituisce
  `{ok, errors, warnings, worldSummary}`. Accetta `source` opzionale per compilare il
  **buffer live** non ancora salvato (gli `Includi` sono risolti dal disco).
- **Pannello Problemi**: elenco di errori e avvisi con conteggi, file, riga:colonna e
  codice; click su una voce → **salto alla posizione** nell'editor.
- **Marker inline in Monaco** (`setModelMarkers`): sottolineatura rossa/gialla nel punto
  esatto, con il messaggio del compilatore al passaggio del mouse.
- **Auto-compile**: a ogni modifica (debounce 600 ms), all'apertura di un file e quando
  il motore diventa pronto — diagnostica sempre fresca senza dover salvare.
  `Ctrl+B` forza una compilazione.

### Note
- Posizioni **sintattiche precise** via source map dell'espansione `Includi`
  (l'errore è attribuito al file e alla riga originali anche con i moduli multi-file).
- Posizioni **semantiche best-effort**: gli errori del transformer non portano una
  riga; si individua il nome citato nel sorgente. Quando non è localizzabile, la voce è
  marcata *approssimata* (`~`) e non produce un salto preciso.

## [0.2.1] — 2026-06-01 — Fix Explorer

### Corretto
- **File di root non visibili** nel Project Explorer: le cartelle di primo livello
  erano auto-espanse e il loro contenuto spingeva i file della root (inclusi i
  `.fav`) sotto la piega. Ora le cartelle sono **chiuse di default** (stile VS Code),
  così i file della root restano subito visibili in cima.

## [0.2.0] — 2026-06-01 — Fase 1: Editor

### Aggiunto
- **Editor di codice Monaco** (il motore editor di VS Code) integrato e bundlato
  offline (nessuna CDN).
- **Lingua `favella`** registrata in Monaco: tokenizer Monarch alimentato da
  `engine.lexicon` (verbi, parole riservate, direzioni del motore) + commenti `#`
  e stringhe `"…"`; tema scuro coordinato `favella-dark`.
- **Completamento base**: keyword/verbi/direzioni del linguaggio.
- **Project Explorer**: apertura di una cartella-progetto, albero dei file, i
  file `.fav` evidenziati; apertura su click.
- **Editor a schede** con indicatore di modifiche non salvate e salvataggio
  (Ctrl+S / Salva tutto).
- **IPC file system** nel processo main: dialog di apertura cartella, lettura
  ricorsiva dell'albero, lettura/scrittura file (tutto via `contextBridge`).
- **Barra di stato** con percorso file, posizione cursore e stato sidecar.

## [0.1.0] — 2026-06-01 — Fase 0: Spina dorsale

### Aggiunto
- Scaffold **Electron + React + Vite + TypeScript** (electron-vite) con split
  main/preload/renderer.
- **Sidecar Python** (`favella_server.py`): ponte JSON-RPC su NDJSON che importa
  il motore FAVELLA esistente; metodi `ping`, `engine.version`, `engine.lexicon`;
  disciplina stdout rigorosa.
- **Supervisione del sidecar** (`src/main/sidecar.ts`): spawn dalla `.venv` in
  dev / exe PyInstaller in prod, timeout per-metodo, riavvio con backoff, kill pulito.
- **Bridge IPC sicuro** (`window.favella`): rpc, eventi del motore, stato/riavvio sidecar.
- UI di benvenuto con versioni, lessico, ping e toast di stato.
- `electron-builder.yml` predisposto per installer NSIS Windows.

### Corretto
- Crash in chiusura ("Object has been destroyed"): l'emit degli eventi ora
  verifica che la finestra non sia distrutta.
