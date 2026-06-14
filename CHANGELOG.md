# Registro delle Versioni (Changelog) - FAVELLA 1

Tutti i cambiamenti significativi a questo progetto saranno documentati in questo file.

---

## [0.26.0] - 2026-06-14
### Sinonimi di verbo (Asse A — A6) 🗣️
Sesta e ultima voce dell'**Asse A** di `progettazione-oltre-0.18.md`: con questa il
linguaggio chiude il gruppo «Il mondo vivo» (A4+A5+A6).

- **Sinonimo di verbo**: `"ghermisci" è come prendi.` (`def_sinonimo`,
  `TESTO_QUOTATO "è" "come" VERBO "."`) — rimappa una parola-nuova (quotata, come
  i verbi custom e gli alias) a un **verbo di libreria**. A differenza di un verbo
  personalizzato (che richiede una regola `Invece di` per ogni oggetto), il
  sinonimo eredita tutto il comportamento del bersaglio: il parser dei comandi lo
  **riscrive nel canonico** prima di ogni trattamento, così funzionano regole
  `Invece di prendi …`, anafora e logica di default.
- **Modello**: `Mondo.sinonimi_verbo` (parola → verbo canonico). Serve l'input del
  giocatore; nelle regole d'autore vale il canonico (come per gli alias di oggetto).
  Il bersaglio dev'essere un verbo noto (`VERBI_VALIDI`): altrimenti il sinonimo è
  morto e si emette un **warning non bloccante** (e non viene registrato).
- **LALR(1) 0-ambiguo**: `def_sinonimo` è distinta da `def_verbo` sul lookahead
  `come` vs `un` (dopo `"…" è`). Riservata aggiunta: `come`.
- **Test**: **+12 asserzioni** (6 test: registrazione, comportamento identico al
  verbo bersaglio, attivazione delle regole del canonico, coesistenza col verbo
  originale, warning su bersaglio ignoto, più sinonimi). Suite del linguaggio a
  **549** (era 537); collaudatore invariato a **33**; demo `vincibile-staticamente`.
  Spec EBNF **`grammatica-0.26.0.md`** (§12); puntatore `_SPEC_EBNF` 0.25.0 → 0.26.0.
  Versioni allineate a **0.26.0**.

> **Asse A completato.** Con A6 il linguaggio FAVELLA chiude l'Asse A di
> `progettazione-oltre-0.18.md` (A1–A9). Prossimo passo della roadmap: il
> **manuale completo** rigenerato sul linguaggio finale.

---

## [0.25.0] - 2026-06-14
### Movimento degli NPC (Asse A — A5) 🚶
Quinta voce dell'**Asse A** di `progettazione-oltre-0.18.md`. I personaggi erano
statici: il mondo sembrava un museo. I demoni (Livello 8) fornivano già il
*quando*; mancava la conseguenza di *movimento*.

- **Due conseguenze nuove** (classe `ConseguenzaMovimentoPNG`), usabili in regole,
  eventi, demoni e opzioni di dialogo:
  - **Deterministica**: `la guardia va nel corridoio` (`cons_png_va`,
    `ENTITA "va" PREP_LUOGO ENTITA`) — destinazione fissa, validata come stanza
    esistente a compile-time.
  - **Casuale**: `il gatto cambia stanza` (`cons_png_cambia`,
    `ENTITA "cambia" "stanza"`) — una stanza **adiacente** a caso fra le uscite,
    pescata da `mondo.rng` (riproducibile e ANNULLA-safe, come le varianti A2).
    Senza uscite, l'NPC resta dov'è.
- **Annunci**: se la mossa coinvolge la stanza del giocatore, il motore lo segnala
  — uscita «La guardia se ne va verso nord.» (con la direzione se la destinazione
  è adiacente) / ingresso «Il gatto arriva.». Le conseguenze restano **pure**:
  accodano in `Mondo.annunci`, e il loop di gioco (`_stampa_annunci`) svuota la
  coda dopo ogni blocco di conseguenze (eventi/demoni a fine turno, regole del
  giocatore, scelte di dialogo). `annunci` è stato di sessione (escluso da ANNULLA).
- **Scelta di design LALR-safe**: la forma casuale **non** usa `va in una stanza
  adiacente` (collide col lessico su `PREP_LUOGO` `in`, romperebbe l'invariante
  0-conflitti); `cambia stanza` è l'equivalente naturale e privo di collisioni.
  Riservate aggiunte: `va`, `cambia`. **LALR(1) 0-ambiguo** (dopo ENTITA il
  lookahead `va`/`cambia` vs `_copula`).
- **Linter**: `_lint_oggetti_orfani` riconosce un NPC introdotto da un movimento
  deterministico (niente falso «mai collocato»).
- **Test**: **+17 asserzioni** (10 test: parsing delle due forme, movimento
  deterministico e casuale-riproducibile, annunci di uscita/ingresso, nessun
  annuncio fuori scena, movimento via evento e via regola del giocatore, no-op
  senza uscite, destinazione non-stanza = errore). Suite del linguaggio a **537**
  (era 520); collaudatore invariato a **33**; le demo restano `vincibile-
  staticamente`. Spec EBNF **`grammatica-0.25.0.md`** (§11); puntatore `_SPEC_EBNF`
  0.24.0 → 0.25.0. Versioni allineate a **0.25.0**.

---

## [0.24.0] - 2026-06-14
### Buio e luce come primitiva (Asse A — A4) 🔦
Quarta voce dell'**Asse A** di `progettazione-oltre-0.18.md` (la prima del gruppo
«Il mondo vivo»). Il pattern «stanza buia finché non hai una luce», universale
nell'interactive fiction, diventa una primitiva del motore invece di un esercizio
di regole.

- **Stanza al buio**: `La cantina è buia.` — `buia` è una **proprietà speciale**
  della stanza (come `prendibile`), riconosciuta nel transformer per **radice**
  (`bui-` → buia/buio/buie), che imposta `Stanza.buia`. **Nessuna nuova regola di
  grammatica** per questa forma.
- **Fonte di luce**: `La torcia illumina.` — nuova regola di capacità
  **`def_illumina`** (`ENTITA "illumina" "."`), additiva e order-independent
  (crea-su-riferimento), che imposta `Oggetto.illumina`. Riservate aggiunte:
  `buia`, `buio`, `illumina`.
- **Visibilità centralizzata**: `Mondo.c_e_luce()` — vero se la stanza non è buia
  **oppure** è raggiungibile una fonte `illumina` **accesa** (`illumina` e non
  «spenta», folding per radice `spent-`: l'interazione con le opposte accesa/spenta
  è automatica; una torcia senza stato illumina sempre). Riusa
  `oggetti_raggiungibili()`: una fonte in un **contenitore chiuso** non illumina;
  una in mano o che brilla a terra sì.
- **Runtime**: in una stanza buia senza luce, `guarda`/`mostra_stanza` stampano
  «È buio pesto.» (niente descrizione/oggetti/uscite) ed `esamina`/`prendi`/`metti`
  rispondono «È troppo buio per vederci.». Le **uscite restano percorribili** (si
  cammina alla cieca). Le regole d'autore (`Invece di esamina X`) mantengono la
  precedenza sulla logica di default: si può rendere qualcosa percepibile al buio.
- **LALR(1) 0-ambiguo** per costruzione (`def_illumina` distinta dopo ENTITA sul
  lookahead `illumina`). Spec EBNF aggiornata: **`grammatica-0.24.0.md`** (§10);
  puntatore test `_SPEC_EBNF` da 0.22.0 → 0.24.0.
- **Test**: **+28 asserzioni** (15 test dedicati: buio blocca esamina/prendi,
  luce in mano / a terra rischiara, spenta non illumina, contenitore chiuso vs
  aperto, demone che spegne la luce, uscite percorribili, regola d'autore
  prioritaria, concordanza `buio`/`buia`, order-independence). Suite del linguaggio
  a **520** (era 492); collaudatore invariato a **33**; le demo restano
  `vincibile-staticamente`. Versioni allineate a **0.24.0** (header core, suite,
  `Mondo.__str__`, sidecar `VERSIONE_MOTORE`).

---

## [0.23.0] - 2026-06-13
### Il collaudatore automatico di storie — `collaudo.py` (B1.1) 🤖
Prima voce dell'**Asse B** di `progettazione-oltre-0.18.md`: «il differenziatore».
Verificare che una storia sia **vincibile** e che il contenuto sia
**raggiungibile** senza playthrough manuali. Questa release implementa il
**Livello 1 — analisi statica** (la «catena della vittoria»); il robot dinamico
(BFS sullo spazio degli stati) è la fase B1.2, successiva. Spec completa in
`documentazione/progettazione-collaudo.md`.

- **Nuovo modulo `collaudo.py`**, *consumatore* del Mondo compilato: **non tocca
  la grammatica né il loop di gioco** (la grammatica resta `grammatica-0.22.0.md`).
  - `analizza_vincibilita(mondo)` → report **strutturato (dict)** riusabile dal
    sidecar/IDE; `rendi_report_testuale(report)` → resa leggibile per la CLI.
  - CLI: `python collaudo.py storia.fav`.
- **Catena della vittoria (a ritroso)**: raccoglie ogni conseguenza «vinci»
  (in regole, eventi, demoni, opzioni di dialogo) e risale i prerequisiti fino
  allo stato iniziale, scomponendo le condizioni in atomi (possesso, proprietà,
  stato, contatore, posizione) e trovando, per ciascuno, **quale conseguenza —
  o quale azione standard (`prendi`) o movimento (`collega`) — lo rende vero**.
  Esito: `vincibile-staticamente` / `ostruzione-possibile` / `nessuna-vittoria`.
- **Diagnostica**: riusa il **linter del compilatore** (`analisi_statica`) per
  stanze isolate, oggetti orfani, regole morte e stati/contatori inutilizzati —
  niente reinvenzione; aggiunge le **regole potenzialmente irraggiungibili**
  (condizione mai soddisfacibile), controllo distinto dal «regola morta».
- **Limite onesto dichiarato nel report**: l'analisi dà condizioni *necessarie*
  ed *euristiche* (le strutture e/oppure/non sono appiattite, l'aritmetica dei
  contatori è approssimata), **non una prova** di vincibilità: quella spetta al
  robot della fase B1.2.
- **Test**: nuova suite **`test_collaudo.py`** (33 asserzioni) — catena su una
  storia vincibile, rilevamenti su una storia rotta, ostruzione su una vittoria
  irraggiungibile, e verifica end-to-end sulle tre demo reali (La Casa, Il
  Relitto Silente, Salerno-Reggio), tutte `vincibile-staticamente`.

Suite del linguaggio invariata a **492 asserzioni** verdi (nessuna regressione:
collaudo è additivo). Versione-ombrello del progetto a **0.23.0**; la grammatica
del sorgente resta `grammatica-0.22.0.md`.

---

## [0.22.0] - 2026-06-13
### Varietà nelle risposte: descrizioni alternate 🎲
Una descrizione può ora avere **più varianti**, così il mondo non si ripete
identico a ogni sguardo — la cosa che più «data» un gioco testuale. Terza voce
dell'Asse A di `progettazione-oltre-0.18.md`. Suite del linguaggio: **492
asserzioni** (era 484), tutte verdi; invariante LALR(1) 0-ambiguo intatto.

- **Due politiche dichiarabili**:
  - `La descrizione del mare è una di: "…", "…", "…".` — **casuale**, senza
    ripetere mai due volte di fila la stessa variante.
  - `La descrizione del faro è in sequenza: "…", "…".` — **rotazione**: le
    varianti si susseguono e l'ultima resta (descrizioni che «si consumano»).
- Vale sia per la descrizione di base sia per le varianti condizionali (`se …`),
  e i segnaposto `[var]` continuano a funzionare dentro ogni variante.
- **Casualità riproducibile**: il mondo ha un generatore con **seme fisso**
  (`Mondo.rng`, `SEME_CASUALE_DEFAULT`). Le partite sono deterministiche e —
  punto chiave — **ANNULLA riavvolge anche la casualità** (il generatore e gli
  indici delle varianti sono catturati dalle istantanee di stato). Pronto per il
  futuro giocatore-robot (B1).

**Modifica di grammatica** (la prima dalla 0.19.0; 0.20.0 e 0.21.0 erano solo
runtime): `def_descrizione` delega a `descr_valore`
(`descr_singola`/`descr_casuale`/`descr_sequenza`). Nuova classe
`strutture.VariantiDescrizione`. Riservata aggiunta: `sequenza`. Spec EBNF
**`grammatica-0.22.0.md`** (puntatore test 0.19.0→0.22.0). Validazione segnaposto,
linter e serializzazione IDE aggiornati per ispezionare ogni variante.

---

## [0.21.0] - 2026-06-13
### Comandi di servizio: ANNULLA, ANCORA, TRASCRIZIONE ↩️
Le tre comodità standard dell'interactive fiction dal 1985 (Infocom). Seconda
voce dell'Asse A di `progettazione-oltre-0.18.md`. **Solo runtime: grammatica
del sorgente invariata** (spec EBNF resta `grammatica-0.19.0.md`). Suite del
linguaggio: **484 asserzioni** (era 474), tutte verdi.

- **ANNULLA** (anche `disfa`): disfa l'ultimo turno. Implementato con istantanee
  profonde dello stato del mondo prima di ogni turno (`Mondo.cattura_stato` /
  `ripristina_stato`): un «time-machine» fedele che riavvolge posizioni,
  inventario, stati, contatori, turni ed eventi/demoni — niente replay. Pila
  fino a `_MAX_ANNULLA` (100) turni. «Non c'è niente da annullare.» quando vuota.
- **ANCORA** (anche `ripeti`, `g`): ripete l'ultimo comando che ha consumato un
  turno (`Mondo.ultimo_comando`).
- **TRASCRIZIONE**: avvia/ferma il salvataggio della partita su
  `trascrizione-favella.txt` (comandi del giocatore + output del motore). È una
  funzione della sessione da riga di comando (un `_Tee` su `sys.stdout` nel loop
  di `gioca`); non disponibile nei driver headless/web.

I comandi di servizio NON consumano un turno. `aiuto` ora li elenca, insieme ai
pronomi (0.20.0). Versioni core e suite a **0.21.0**.

---

## [0.20.0] - 2026-06-13
### Pronomi e anafora 🗣️
Il giocatore può ora usare i **pronomi** per riferirsi all'ultimo oggetto
nominato — la singola cosa che più fa sembrare «sveglio» un parser italiano.
Prima voce dell'Asse A del documento `progettazione-oltre-0.18.md` (era marcata
⭐ priorità massima). **Solo runtime: la grammatica del sorgente NON cambia**
(la spec EBNF resta `grammatica-0.19.0.md`), quindi l'invariante LALR(1) non è
nemmeno sfiorato. Suite del linguaggio: **474 asserzioni** (era 467), tutte verdi.

- **Clitici suffissi**: `esamina la torcia` → `prendila`; `aprilo`, `esaminale`,
  `usali`. Il clitico si stacca dal verbo se il resto è un comando noto.
- **Pronomi tonici / nudi**: `prendi quella`, `apri quello`, `usa lo`.
- **Concordanza di genere e numero**: il riferito è indicizzato per
  `m_sing`/`f_sing`/`m_plur`/`f_plur` (dedotto dall'articolo del nome). Un
  pronome del genere sbagliato non trova riferente: «Cosa vorresti prendere?».
- **Riferito = ultima azione *o* ultimo nominato**: vale sia l'oggetto su cui hai
  appena agito (`esamina la torcia`), sia un oggetto elencato dalla stanza
  (`entri… → prendila`).
- **Riferito non più raggiungibile**: se l'oggetto è stato preso da altri o
  lasciato indietro, «Non la vedi più.».

Implementazione in `gioco.py` (`_risolvi_anafora`) + `strutture.Mondo`
(`ultimo_riferito`, `registra_riferito`/`registra_riferiti_da_stanza`) +
`utils.chiave_genere_numero`. Versioni core e suite a **0.20.0**.

---

## [0.19.0] - 2026-06-13
### Lezioni dallo stress-test di genere 🚗
Tre integrazioni al linguaggio nate costruendo un genere fuori dall'asse del
design originale — un **simulatore di guida testuale** («Salerno-Reggio
Calabria», in `esempi/demo/salerno-reggio/`). I punti d'attrito incontrati sono
diventati primitive. Suite del linguaggio: **467 asserzioni** (era 446), tutte
verdi; invariante LALR(1) 0-ambiguo intatto (guardia estesa ai tre costrutti);
`analizza_file` invariata.

- **A7 — Verbi intransitivi.** `"accelera" è un comando senza oggetto.` dichiara
  un comando che il giocatore digita da solo, gestito da una regola GLOBALE
  `Invece di accelera: …` (con condizioni e conseguenze, incluso `vinci`/`perdi`;
  vale anche multi-parola). La dichiarazione si sdoppia in `verbo_con_oggetto`
  (storico) e `verbo_senza_oggetto`; in `carica_azioni` i verbi custom si dividono
  fra `_personalizzata` (transitivi) e `_personalizzata_intransitiva`.
- **A8 — Inventario iniziale.** `Il giocatore ha la torcia.` mette l'oggetto in
  inventario all'avvio (`def_giocatore_inventario`, applicato in `valida_post`,
  order-independent). Un oggetto per frase; oggetto inesistente = errore bloccante.
- **A9 — «Tick» silenziosi.** La battuta `dire "…"` di eventi e demoni è ora
  **opzionale**, purché ci sia almeno una conseguenza:
  `Ogni 3 turni: diminuisci il carburante.` muta lo stato senza stampare nulla
  (regola inline `_esito_temporale`).

Nuove riservate: `senza`, `oggetto`. Spec EBNF `documentazione/grammatica-0.19.0.md`.
Versioni allineate a **0.19.0** (header core, suite, `VERSIONE_MOTORE`). La demo
di guida è inclusa in due tempi: la sfida (fattibilità sul motore 0.18.0) e la
riscrittura idiomatica resa possibile da A7/A8/A9.

---

## [Manutenzione] - 2026-06-11
### Pulizia interna del motore 🧹
Nessun cambiamento al linguaggio. Suite sempre a **446 test** verdi.
- **Versione in un punto solo:** nuova costante `VERSIONE_MOTORE` in
  `strutture.py`; il sidecar e il report di compilazione (`Mondo.__str__`) la
  importano invece di cablare il numero in proprio.
- **Deduplicato il preprocessore:** `espandi_inclusioni` ora accetta un
  `sorgente_radice` opzionale (il buffer in memoria dell'IDE) e la copia
  parallela `_espandi_inclusioni_seedable` è diventata un semplice alias.
- **Diagnostica dei crash:** un errore interno del compilatore ora stampa lo
  stack trace completo (prima solo il messaggio), per individuare il punto
  esatto del bug.

---

## [Export HTML] - 2026-06-05
### Esporta il gioco come pagina HTML autoportante 📦
Nuova funzione `esporta_html` nel compilatore (op `game.exportHtml` del
sidecar): impacchetta una storia `.fav` in **un singolo file HTML giocabile nel
browser**, con il motore Python eseguito via **Pyodide** (nessuna installazione
per chi gioca).
- Sorgente espanso (inclusioni risolte) e moduli del motore incapsulati nel
  JSON dei dati; il driver Python vive nel JSON, non in un template literal
  (robusto rispetto a backtick e `${}` nei testi delle storie).
- Robusto al bundle congelato di PyInstaller (`_MEIPASS`): i sorgenti del
  motore vengono letti dal bundle quando il sidecar gira impacchettato.

---

## [Manuale] - 2026-06-04
### Manuale d'autore completo — PDF tipografico 📖
Riscritto da zero il **Manuale di Programmazione** (`documentazione/manuale/`),
allineato alla **v0.18.0** e focalizzato esclusivamente sul linguaggio. 17
capitoli (dalle stanze ai personaggi, ai demoni, ai moduli) più appendici, con
**ogni costrutto illustrato da esempi reali** presi parola per parola da «La Casa
di Via Stradivari» (`esempi/materiale-didattico/`).
- Composto con **Typst**: copertina di marca, dedica, indice, colophon, e un
  evidenziatore di sintassi `.fav` dedicato. Sorgente modulare (un file per
  capitolo) + `build.ps1` + `README`.
- Font di marca (Sora, Source Code Pro) inclusi sotto licenza SIL OFL 1.1.
- Sostituisce il vecchio `manuale.md` (datato ≈0.0.9.2), ora rimosso.

---

## [0.18.0] - 2026-06-03
### Consolidamento del linguaggio — «linguaggio al massimo» 🏁
Sessione dedicata a **colmare ogni buco e asimmetria** emersi scrivendo le demo,
senza più workaround: il linguaggio è ora completo ed eccellente allo stato
attuale delle conoscenze. Grammatica sempre **LALR(1) 0-ambigua**. Suite da 386 a
**446 test** verdi.

**Correzioni di limiti/asimmetrie (A):**
- **A1 — Le regole a DUE oggetti valutano il `se`.** `usa X PREP Y` ora sceglie,
  fra le regole che combaciano, la prima **condizionale soddisfatta**, poi la
  prima **semplice** (esatto come le regole a un oggetto), con fallback
  prep-tollerante. Prima il `se` era ignorato: vinceva sempre la prima dichiarata.
- **A2 — Genitivo `dei`** nelle descrizioni: `La descrizione dei pilastri è "…"`.
- **A3 — Accenti NFC.** Sorgente e input del giocatore sono normalizzati in forma
  NFC: i nomi accentati (`comò`) si risolvono in modo affidabile anche se digitati
  in forma decomposta. Cade la convenzione «niente accenti nei nomi».
- **A4 — Preposizioni d'azione articolate.** `usa la batteria sul pannello`,
  `metti la spada nella teca`: niente più la stonatura `su il`/`su la`.
- **A5 — Copula plurale `sono`.** `Le tacche sono una cosa`, `Le tacche sono
  vergini`, `se le tacche sono segnate`: l'italiano corretto sui nomi plurali (era
  obbligatorio scrivere `Le tacche È una cosa`).

**Nuovi costrutti di design (B):**
- **B1 — `se il giocatore è in [stanza]`** (+ negazione).
- **B2 — Teletrasporto:** `e adesso il giocatore è in [stanza]` (mostra la nuova
  stanza; destinazione validata a compile-time).
- **B3 — Testo d'esito personalizzato:** `… e adesso vinci "Sei libero!"` (anche
  `perdi`/`termina`), al posto del banner fisso.
- **B4 — Confronto `al massimo N`** (≤) sui contatori, simmetrico ad `almeno` (≥).
- **B5 — Disuguaglianza numerica `non è N`** (≠) sui contatori.
- **B6 — Verbi personalizzati multi-parola:** `"fai scattare" è un comando.`
  (terminale chiuso `VERBO_MULTI` + longest-match a runtime).
- **B7 — Negazione di un gruppo:** `non ( A e B )`.

**Consolidamento:** versioni allineate a **0.18.0** (moduli core, suite, sidecar,
`Mondo.__str__`); spec EBNF `documentazione/grammatica-0.18.0.md`; demo
naturalizzate (`su il`→`sul`). Sidecar `VERSIONE_MOTORE` → 0.18.0. Dettaglio in
`documentazione/0.18.0.md`.

## [0.17.0] - 2026-06-03
### Robustezza d'ordine + audit dei Livelli 1-8 🧱
Due lavori della sequenza «linguaggio al massimo»: rendere il linguaggio
**indipendente dall'ordine** delle frasi e una **rassegna** dei livelli 1-8.

**Robustezza d'ordine.** Finora una frase che *usa* un'entità doveva venire DOPO
la sua definizione: `La gemma è nella scatola.` falliva se `La scatola è un
contenitore.` arrivava dopo. Ora la risoluzione delle entità per nome è
**differita a fine compilazione** (`valida_post`, a mondo completo), così l'ordine
non conta più. Vale per:
- **posizioni** (`X è in/nella/sul Y`), incluse le collocazioni in contenitori/supporti;
- **proprietà** (`X è chiusa`);
- **descrizioni** (`La descrizione di X è "…"`);
- **conseguenze** (`… e adesso la chiave è in inventario`) che citano entità definite dopo;
- **bersaglio delle regole** (`Invece di apri la porta: …` con `la porta` dichiarata dopo).

Gli errori veri restano: una destinazione/bersaglio **mai** definito fallisce
ancora la compilazione (solo il *momento* del controllo è cambiato, non l'esito).
È una modifica **semantica**: la grammatica è invariata (spec
`documentazione/grammatica-0.16.0.md` resta valida).

**Audit — due bug corretti:**
1. **No-op a partita conclusa.** Dopo `vinci`/`perdi`/`termina`, un ulteriore
   comando non avanza più il turno né fa scattare eventi/demoni (prima, un
   chiamante che ignorava il valore di ritorno poteva far ripartire gli eventi).
2. **Linter cieco ai demoni.** Le analisi statiche «variabile inutilizzata» e
   «oggetto orfano» non guardavano dentro i demoni (Livello 8): una variabile o un
   oggetto usati *solo* in un demone venivano falsamente segnalati. Ora
   `_tutte_le_condizioni`/`_tutte_le_conseguenze`/`_tutti_i_testi` includono i demoni.

- Suite linguaggio: **386 asserzioni** (era 364), tutte verdi; 11 nuovi test
  (8 di robustezza d'ordine, 1 no-op fine partita, 2 linter+demoni). `analizza_file`
  invariata. Sidecar `VERSIONE_MOTORE` → 0.17.0. Dettaglio in
  `documentazione/0.17.0.md`.

## [0.16.0] - 2026-06-03
### Valore iniziale configurabile dei contatori 🔢
Finora un contatore partiva **sempre da 0**: per dargli un valore di partenza
(forza, vita, mana iniziali per una storia in stile GDR) bisognava alzarlo a mano
con una conseguenza. Da questa versione basta una frase:

    La forza è un contatore.
    La forza parte da 3.

- **Additivo e order-independent.** La frase `parte da N` imposta il valore; può
  comparire prima o dopo `è un contatore.` (la dichiarazione usa `setdefault` e non
  sovrascrive). Richiede comunque che il contatore sia dichiarato nel file.
- **Grammatica.** Nuova produzione `def_contatore_iniziale` (`VARIABILE "parte"
  "da" NUMERO "."`): inizia con VARIABILE, il lookahead `parte` vs `è` la distingue
  dagli altri costrutti su variabile → **LALR(1) 0-ambiguo**. Nuova riservata: `da`.
- **Capacità di trasporto invariata.** Conferma del modello "moltiplicatore" del
  Livello 7 (`Il giocatore può portare N oggetti.` + `Lo zaino dà N spazi.`):
  inventario piatto, nessun contenitore-zaino, nessuno slot "indossato".
- Suite linguaggio: **364 asserzioni** (era 360), tutte verdi; guardia
  anti-ambiguità estesa. Spec EBNF `documentazione/grammatica-0.16.0.md`. Sidecar
  `VERSIONE_MOTORE` → 0.16.0. Dettaglio in `documentazione/0.16.0.md`.

## [0.15.0] - 2026-06-03
### Roadmap del Linguaggio — Livello 8: REATTIVITÀ / DEMONI 👁️
L'ultima capacità mancante del linguaggio: gli **eventi condizionali** (i
«demoni»). Finora un *if-then* in FAVELLA era sempre ancorato a qualcosa — a un
verbo del giocatore (`Invece di …`) o a un turno fisso (`Al turno N` / `Ogni N
turni`, timer **senza** `se`). Mancava la sentinella **autonoma**: qualcosa che
sorveglia una condizione a ogni turno e scatta da sola quando si avvera.

Due forme nuove, entrambe **additive** e **LALR(1) 0-ambigue** per costruzione:

- **A livello** — `Ogni turno se [condizione]: dire "…" e adesso […].`
  Scatta a **ogni** turno in cui la condizione è vera (effetti continui: veleno,
  fame, un allarme che pulsa). Si distingue da `Ogni N turni` sul primo token dopo
  «Ogni» (un numero = timer, la parola «turno» = demone).
- **Sul fronte di salita** — `Quando [condizione] (diventa vera)?: dire "…" e adesso […].`
  Scatta **una sola volta**, nel turno in cui la condizione passa da falsa a vera
  (soglie, scadenze, punti di non ritorno). La chiusura `diventa vera` è
  **opzionale**: `Quando X:` e `Quando X diventa vera:` sono sinonimi.

L'esempio prima impossibile, ora nativo:

    La tensione è un contatore.
    Ogni 1 turno: dire "La tensione cresce." e adesso aumenta la tensione di 2.
    Quando la tensione è almeno 8: dire "Il portale ti risucchia." e adesso perdi.

- **Riusano tutto il già esistente**: l'albero `condizione` completo
  (proprietà/stati/contatori + AND/OR/NOT/parentesi) e la coda di conseguenze
  `e adesso …`.
- **Anti-loop per costruzione**: i demoni sono valutati **una volta per turno**,
  in un solo passaggio in ordine di dichiarazione, **dopo** gli eventi a tempo. Un
  demone può innescare a cascata i demoni *successivi* nello stesso passaggio, ma
  nessuno viene ri-valutato → loop infiniti impossibili.
- **Fronte di salita corretto**: ogni demone `Quando` ricorda il valore precedente
  (`Demone.era_vera`), inizializzato a fine compilazione sul mondo iniziale → una
  condizione già vera alla partenza non genera un falso fronte.
- **Byte-stabile**: classe `Demone` e lista `Mondo.demoni` distinte dagli eventi a
  tempo (la serializzazione degli eventi resta intatta). Nuove riservate: `quando`,
  `vera` (`diventa` era già riservata). `analizza_file` invariata.
- Suite linguaggio: **360 asserzioni** (era 344), tutte verdi; guardia
  anti-ambiguità estesa a entrambe le forme. Spec EBNF
  `documentazione/grammatica-0.15.0.md`. Sidecar `VERSIONE_MOTORE` → 0.15.0.
  Dettaglio in `documentazione/0.15.0.md`.

## [0.14.0] - 2026-06-03
### Concordanza di genere/numero sulle proprietà di stato 🇮🇹
In un linguaggio d'autore italiano, `aperto` e `aperta` devono valere uguale.
Finora le proprietà erano confrontate **alla lettera**: `il portale è aperto` NON
rimuoveva `chiusa`, così il contenitore restava chiuso pur dicendo «si apre».

Da questa versione il motore confronta le proprietà di stato per **RADICE**,
ignorando la desinenza regolare `-o/-a/-i/-e`:

    aperto = aperta = aperti = aperte   ->  apert
    chiuso = chiusa                     ->  chius
    spento = spenta                     ->  spent
    bloccato = bloccata                 ->  bloccat

Il folding (nuova `utils.radice_proprieta`) si applica nei **quattro punti** che
contano: condizioni (`se X è aperto` combacia con `aperta`), conseguenze opposte
(`è aperto` rimuove `chiusa`/`chiuso`), apertura dei contenitori
(`Mondo.contenitore_aperto`) e il linter dei refusi. Le coppie opposte dichiarate
al maschile valgono anche al femminile e viceversa (`acceso/spento` ⇄ `accesa/spenta`).

- **Le proprietà restano scritte come le ha messe l'autore** (display/IDE/serializzazione
  invariati): la normalizzazione è solo interna al confronto.
- **I refusi veri restano segnalati**: cambiano la radice (`chuisa` ≠ `chiusa`), quindi
  il linter li intercetta ancora.
- Pochi termini invariabili (colori come `rosa`, `viola`, `blu`) sono esclusi dal troncamento.
- **Grammatica invariata** rispetto a 0.13.0 (modifica solo semantica): la spec EBNF
  `documentazione/grammatica-0.13.0.md` resta valida.
- Suite linguaggio: **344 asserzioni** (era 334), tutte verdi. `analizza_file` invariata.
- Sidecar `VERSIONE_MOTORE` → 0.14.0. Dettaglio in `documentazione/0.14.0.md`.

## [0.13.0] - 2026-06-02
### Roadmap del Linguaggio — Livello 7: CAPACITÀ DI TRASPORTO 🎒
Primo costrutto del **Livello 7**. Aggiunge un limite **opzionale** di oggetti
trasportabili, configurabile dall'autore e **additivo**:

    Il giocatore può portare 5 oggetti.     # capacità base
    Lo zaino dà 15 spazi.                    # bonus mentre lo zaino è nell'inventario

La capacità attuale è `base + somma dei bonus degli oggetti portati`
(`Mondo.capacita_attuale()`); l'azione `prendi` rifiuta un oggetto se
l'inventario è pieno («Hai le mani troppo piene…»). **Senza dichiarazione
l'inventario resta illimitato** (default storico invariato): la feature non è
vincolante. L'azione `inventario` mostra «(usati/max)» quando una capacità è
dichiarata.

**Grammatica** (LALR(1) 0-ambiguo, per costruzione): due regole nuove —
`def_giocatore_capacita` (`"Il giocatore può portare" NUMERO "oggetti"`,
distinta da `def_giocatore` sul lookahead `può` vs `comincia/inizia/parte`) e
`def_capacita_oggetto` (`ENTITA "dà" NUMERO "spazi"`, unico costrutto `ENTITA "dà"`).
Nuove parole riservate: `può`, `portare`, `oggetti`, `dà`, `spazi`.

**Modello**: `Mondo.capacita_base` (None = illimitata), `Oggetto.bonus_capacita`.
L'IDE espone `carryUsed`/`carryMax` nello snapshot (`world.snapshot`); l'inspector
mostra «Inventario (n/max)».

Suite: **334 asserzioni** (era 321), tutte verdi; la guardia anti-ambiguità copre
i nuovi costrutti (1 albero / 0 conflitti LALR). Spec EBNF aggiornata in
**`documentazione/grammatica-0.13.0.md`**. Header core (compilatore/strutture/gioco/
libreria_azioni/suite) + `Mondo.__str__` a **v0.13.0**. Doc: `documentazione/0.13.0.md`.

---

## [0.11.3] - 2026-05-31
### Roadmap del Linguaggio — Livello 6: SPEC EBNF FORMALE VERSIONATA 📐
Terza patch del Livello 6 (verso `0.12.0`). Aggiunge il documento tecnico
**`documentazione/grammatica-0.12.0.md`**: la specifica formale versionata della
grammatica di FAVELLA 1 — scheletro statico in EBNF (Lark) + modello dei
**terminali chiusi generati per-file** (`ENTITA`/`VARIABILE`/`DIREZIONE`),
priorità lessicali (`PROPRIETA`, `NUMERO`, `_PREP_DESCR`) e invariante LALR(1).
Non è il manuale d'autore: descrive il linguaggio dal lato compilatore.

**Guardia anti-drift**: nuovi test verificano che la spec citi tutte le regole
`def_/cond_/cons_` della grammatica reale (`_GRAMMAR_TEMPLATE`) e documenti i
terminali chiusi — così la spec non potrà divergere dal codice senza far fallire
la suite.

Suite: **321 asserzioni** (era 314), tutte verdi. Header `test_linguaggio.py` a
**v0.11.3** (il compilatore non cambia in questa patch).

---

## [0.11.2] - 2026-05-31
### Roadmap del Linguaggio — Livello 6: MODULI / IMPORT MULTI-.FAV 📦
Seconda patch del Livello 6 (verso `0.12.0`). Introduce gli **import multi-file**
come **preprocessore (Passata 0)** testuale: la direttiva

    Includi "file.fav".

viene espansa in un unico sorgente **prima** delle due passate, quindi **non
raggiunge mai il parser** → invariante LALR(1) 0-ambiguo intatto per costruzione.

Il preprocessore (`compilatore.espandi_inclusioni`) gestisce:
- **Path relativi** al file che include (anche in sottocartelle).
- **Deduplica** — lo stesso file incluso più volte (diamanti) è espanso una sola volta.
- **Rilevamento dei cicli** — un'inclusione circolare è un **errore bloccante**.
- **File incluso mancante** — errore bloccante con il nome del file.
- **Source map** riga-espansa → (file, riga): gli errori di sintassi e le
  diagnosi d'entità sono **attribuiti al file e alla riga originali**.
- Il path quotato è *vocabolario nuovo tra virgolette* (come alias/verbi); le
  direttive dentro stringhe/commenti non vengono interpretate.

Suite: **314 asserzioni** (era 302), tutte verdi; guardia anti-ambiguità
invariata. Superficie pubblica `analizza_file()` intatta. Header `compilatore.py`
e `test_linguaggio.py` a **v0.11.2**.

---

## [0.11.1] - 2026-05-31
### Roadmap del Linguaggio — Livello 6 «Maturità toolchain»: LINTER SEMANTICO 🔍
Prima patch del Livello 6 (verso la release `0.12.0`). Introduce un **linter
semantico** nel compilatore: analisi statica **non bloccante** sul mondo
compilato, che emette avvisi sul canale `warnings` già esistente. **Nessuna
modifica alla grammatica** → invariante LALR(1) 0-ambiguo intatto per costruzione.

Quattro controlli (in `FavellaTransformer.analisi_statica`, eseguita in coda a
`valida_post`):
- **Stanze irraggiungibili** — reachability (BFS) dal punto di partenza sulle
  uscite (`collega`); una stanza non raggiunta è segnalata.
- **Oggetti orfani** — oggetti (NPC/contenitori/supporti inclusi) mai collocati
  e mai introdotti da una conseguenza di spostamento.
- **Regole morte** — regole oscurate da una precedente con identica firma
  (verbo, bersaglio, secondario, preposizione) che scatta sempre; criterio
  conservativo allineato all'ordine delle fasi del runtime (zero falsi positivi).
- **Stati/contatori inutilizzati** — variabili dichiarate ma mai lette in una
  condizione, conseguenza o interpolazione `[var]`.

Suite: **302 asserzioni** (era 287), tutte verdi; guardia anti-ambiguità
invariata. Superficie pubblica `analizza_file()` intatta. Header `compilatore.py`
e `test_linguaggio.py` a **v0.11.1**.

---

## [0.11.0] - 2026-05-31
### Roadmap del Linguaggio — Livello 5b «NPC e dialoghi ramificati» COMPLETATO 🗣️
Release minore che consolida le patch `0.10.1` → `0.10.4` e aggiunge al linguaggio
un **sistema di dialogo completo da interactive fiction**. In sintesi (dettaglio
per-patch sotto e nel documento tecnico `documentazione/0.11.0.md`):

- **NPC** (`0.10.1`): `Il mercante è un personaggio.`, `parla con X`, conversazione
  modale con battute e opzioni numerate (scelta per numero o testo).
- **Ramificazione** (`0.10.2`): `l'opzione "…" conduce al nodo "…"` — alberi di
  dialogo con cicli e ritorni.
- **Conseguenze sulle scelte** (`0.10.3`): `… e adesso …` — una scelta dà oggetti,
  muta stati/contatori, può vincere/perdere la partita.
- **Opzioni condizionali** (`0.10.4`): `l'opzione "…" se [condizione] …` — scelte
  che compaiono solo a requisiti soddisfatti.

Le battute e le opzioni passano per l'interpolazione `[var]` (Livello 5); le
interazioni di dialogo non consumano un turno di gioco.

**Principio LALR-safe del livello**: etichette dei nodi e testi delle opzioni sono
*sempre quotati* (vocabolario nuovo, come alias/verbi del Livello 4), quindi non
entrano in contesa con i terminali chiusi; si sono evitati di proposito `porta` e
`parla` come keyword (collidono con nomi-oggetto comuni). Vincoli mantenuti:
grammatica **LALR(1) non ambigua per costruzione**, guardia permanente (1 albero /
0 conflitti) estesa a ogni costrutto di dialogo, superficie pubblica
`analizza_file()` invariata. Suite del linguaggio: **287 asserzioni**, tutte verdi
(erano 247 a inizio livello). Header core e `Mondo.__str__` a **v0.11.0**.

> **Prossimo**: Livello 6 (Maturità linguaggio/toolchain) verso **v0.12.0** —
> linter semantico, moduli/import multi-`.fav`, spec EBNF formale versionata.

---

## [0.10.4] - 2026-05-31
### Aggiunto (Roadmap Livello 5b «NPC e dialoghi ramificati» — verso 0.11.0)
- **Opzioni di dialogo condizionali** (`[Livello 5b]`). Una scelta può essere
  subordinata a una condizione e comparire **solo se è vera**:
  - `Al nodo "saluto" l'opzione "Ecco la chiave!" se il giocatore ha la chiave
    conduce al nodo "grazie".`
  - Le condizioni sono quelle complete del linguaggio (possesso, proprietà, stati,
    contatori, `e`/`oppure`/`non`). Una scelta non disponibile non viene mostrata
    né numerata; la numerazione segue sempre le sole opzioni disponibili.
- **Grammatica**: clausola `( "se" condizione )?` tra il testo dell'opzione e
  l'esito in `def_opzione`. Dopo il testo, il lookahead `se` la distingue da
  `conduce`/`chiude` → **LALR(1) 0-ambiguo**. Il transformer estrae per-tipo
  condizione, esito e conseguenze (tutti opzionali e in qualsiasi combinazione).
  Guardia anti-ambiguità estesa con un'opzione che combina `se` + `conduce` +
  conseguenza nello stesso costrutto.
- **Suite del linguaggio**: **287 asserzioni** (erano 281). Header core a **v0.10.4**.
- Con questa patch il sistema di dialogo è **completo** (ramificazione +
  conseguenze + condizioni): pronto per la release **v0.11.0**.

---

## [0.10.3] - 2026-05-31
### Aggiunto (Roadmap Livello 5b «NPC e dialoghi ramificati» — verso 0.11.0)
- **Conseguenze sulle scelte di dialogo** (`[Livello 5b]`). Un'opzione può ora
  cambiare lo stato del mondo, con la clausola `e adesso …` riusata da regole ed
  eventi (Livello 3):
  - `Al nodo "saluto" l'opzione "Sì!" conduce al nodo "fine" e adesso la gemma è
    in inventario e adesso aumenta l'oro di 5.`
  - `Al nodo "fine" l'opzione "Addio." chiude il dialogo e adesso vinci.`
  - Le conseguenze valgono sia con `conduce` sia con `chiude`; una scelta può dare
    oggetti, mutare stati/contatori e perfino **vincere/perdere** la partita.
    Vengono eseguite *prima* della transizione, così la battuta del nodo d'arrivo
    riflette già il nuovo stato (interpolazione `[var]`).
- **Grammatica**: coda `( "e" "adesso" conseguenza … )?` in `def_opzione`,
  identica a quella di regole/eventi. Nessun nuovo terminale → **LALR(1)
  0-ambiguo**. Le conseguenze sono validate a compile-time come le altre. Guardia
  estesa con conseguenze su un'opzione (mutazione + fine partita).
- **Suite del linguaggio**: **281 asserzioni** (erano 274). Header core a **v0.10.3**.

---

## [0.10.2] - 2026-05-31
### Aggiunto (Roadmap Livello 5b «NPC e dialoghi ramificati» — verso 0.11.0)
- **Ramificazione dei dialoghi** (`[Livello 5b]`). Un'opzione può ora **condurre a
  un altro nodo**, non solo chiudere la conversazione:
  - `Al nodo "saluto" l'opzione "Chi sei?" conduce al nodo "presentazione".`
  - `Al nodo "saluto" l'opzione "Addio." chiude il dialogo.`
  - A runtime, scegliere un'opzione con transizione mostra la battuta e le opzioni
    del nodo di arrivo; si possono creare cicli (tornare a un nodo precedente).
- **Grammatica**: l'opzione ha un **esito** (`opzione_esito`): `conduce al nodo
  "X"` oppure `chiude il dialogo`. Dopo il testo dell'opzione il lookahead
  `conduce` vs `chiude` distingue le alternative → **LALR(1) 0-ambiguo**. Nuova
  parola riservata `conduce` (si evita `porta`, che è un nome-oggetto comune).
- **Validazione**: un'opzione che conduce a un nodo **inesistente** genera un
  avviso non bloccante (ramificazione morta). Guardia anti-ambiguità estesa con
  un dialogo a più nodi e una transizione.
- **Suite del linguaggio**: **274 asserzioni** (erano 267). Header core a **v0.10.2**.

---

## [0.10.1] - 2026-05-31
### Aggiunto (Roadmap Livello 5b «NPC e dialoghi ramificati» — verso 0.11.0)
- **NPC e dialoghi, fondazione** (`[Livello 5b]`). Prima patch del sistema di
  dialogo: personaggi e conversazione modale minima.
  - **Personaggi**: `Il mercante è un personaggio.` introduce un NPC (un oggetto
    speciale che vive in una stanza ed è raggiungibile).
  - **Nodo d'ingresso**: `Il dialogo del mercante comincia con "saluto".`
  - **Battuta**: `Il mercante al nodo "saluto" dice "Benvenuto, viaggiatore!".`
  - **Opzione di uscita**: `Al nodo "saluto" l'opzione "Addio." chiude il dialogo.`
  - **Runtime**: `parla con X` avvia una conversazione modale; la battuta dell'NPC
    e le opzioni numerate vengono mostrate; il giocatore sceglie per **numero** o
    per **testo**; `esci`/`addio`/`basta` chiudono la conversazione (non il gioco).
    Le interazioni di dialogo **non consumano un turno** di gioco. Le battute e le
    opzioni passano per l'interpolazione `[var]` (Livello 5).
- **Principio LALR-safe**: etichette dei nodi e testi delle opzioni sono *sempre
  quotati* (vocabolario nuovo, come alias/verbi del Livello 4) → non entrano in
  contesa con i terminali chiusi. Si evitano di proposito `porta`/`parla` come
  keyword di grammatica (collidono con nomi-oggetto comuni: «la porta»). Guardia
  anti-ambiguità estesa con un NPC e un dialogo completo: **1 albero / 0 conflitti**.
- **Suite del linguaggio**: **267 asserzioni** (erano 247). Header core a **v0.10.1**.

---

## [0.10.0] - 2026-05-31
### Roadmap del Linguaggio — Livello 5 «Espressività narrativa» COMPLETATO
Release minore che consolida le patch `0.9.1` → `0.9.4` e porta a compimento la
promessa di copertina del progetto — *«il codice è prosa»* — sul versante della
resa narrativa. In sintesi (dettaglio per-patch sotto e nel documento tecnico
`documentazione/0.10.0.md`):

- **Interpolazione di testo dinamico** (`0.9.1`): segnaposto `[punteggio]`,
  `[semaforo]`, `[chiave]` nelle stringhe d'autore, risolti a render-time.
- **Regole globali senza oggetto** (`0.9.2`): `Invece di guarda se il punteggio è
  almeno 3: …` — risolve il limite noto del Livello 3, sbloccando verifiche
  globali su stati e contatori.
- **Descrizioni condizionali** (`0.9.3`): `La descrizione della torcia se il
  semaforo è verde è "…".`, con varianti in ordine e fallback alla base.
- **Concordanza grammaticale italiana minima** (`0.9.4`): genere/numero inferiti
  dall'articolo del nome; articoli concordati negli elenchi di output.

Vincoli mantenuti per tutto il livello: grammatica **LALR(1) non ambigua per
costruzione** (guardia permanente 1 albero / 0 conflitti, estesa a ogni nuovo
costrutto) e superficie pubblica `analizza_file()` invariata. La 0.9.3 ha inoltre
**corretto un'ambiguità latente preesistente** di `def_descrizione` (terminale
unico filtrato `_PREP_DESCR`), rendendo le descrizioni *genuinamente* 0-ambigue.
Suite del linguaggio: **247 asserzioni**, tutte verdi (erano 192 a inizio livello).
Header dei moduli core e `Mondo.__str__` allineati a **v0.10.0**.

> **Ambito della release**: NPC e dialoghi ramificati — la seconda metà del
> Livello 5 — sono volutamente rinviati a una **v0.11.0** dedicata (Livello 5b),
> dove l'alta complessità della macchina a stati dei dialoghi potrà essere
> affrontata con il margine per rinviare i costrutti che non superano puliti il
> gate anti-ambiguità.

---

## [0.9.4] - 2026-05-31
### Aggiunto (Roadmap Livello 5 «Espressività narrativa» — verso 0.10.0)
- **Concordanza grammaticale italiana (minima)** (`[Livello 5]`). Genere e numero
  vengono **inferiti dall'articolo che l'autore già scrive** nel nome (`La torcia`
  → femminile singolare, `Il tavolo` → maschile singolare, `Le chiavi` → femminile
  plurale): nessuna nuova sintassi.
  - L'elenco degli oggetti in una stanza usa ora l'**articolo indeterminativo
    concordato** (o il partitivo al plurale): *«Puoi vedere qui: una torcia, un
    tavolo, uno specchio, delle chiavi.»* — al posto del nome grezzo con l'articolo
    determinativo maiuscolo.
  - Gestiti i casi della fonologia italiana: `uno`/`gli` davanti a *s* impura, *z*,
    *gn*, *ps*…; `un'` femminile davanti a vocale; partitivi `dei`/`degli`/`delle`.
  - Nuovi helper `utils.genere_numero()` / `utils.frase_indeterminativa()` e
    `Oggetto.concordanza()`. Un nome senza articolo riconoscibile resta invariato
    (non si inventano articoli: meglio nessuno che uno sbagliato); `l'…` è ambiguo
    nel genere e ripiega sul maschile.
- **Grammatica invariata**: è tutta logica di *render* + inferenza dai metadati,
  nessun impatto su parsing o ambiguità.
- **Suite del linguaggio**: **247 asserzioni** (erano 225). Header core a **v0.9.4**.

---

## [0.9.3] - 2026-05-31
### Aggiunto (Roadmap Livello 5 «Espressività narrativa» — verso 0.10.0)
- **Descrizioni condizionali** (`[Livello 5]`). La descrizione di una stanza o di
  un oggetto può ora variare in base allo stato del mondo, con una clausola `se`:
  - `La descrizione della torcia è "Una torcia spenta.".` (base/fallback)
  - `La descrizione della torcia se il semaforo è verde è "Una torcia che brilla.".`
  - Più varianti per la stessa entità sono valutate **in ordine di dichiarazione**:
    vince la prima la cui condizione è vera; se nessuna lo è, vale la descrizione
    di base. Le condizioni sono quelle complete del linguaggio (stati, contatori,
    proprietà, possesso, `e`/`oppure`/`non`).
  - Si combinano con l'interpolazione `[var]` (0.9.1): una variante può contenere
    segnaposto.
- **Grammatica**: `def_descrizione` accetta una clausola `( "se" condizione )?`
  opzionale tra l'entità e `"è"` (lookahead netto `se` vs `è` → LALR(1) 0-ambiguo).
  Nuovi `Stanza.descrizione_attuale(mondo)` / `Oggetto.descrizione_attuale(mondo)`.

### Corretto
- **Ambiguità latente preesistente di `def_descrizione`** (`[Livello 5]`). Le
  preposizioni articolate (`del`/`della`/…) erano terminali anonimi inline: il
  lexer dinamico poteva spezzare `della` in `del` + `la` (con `la` assorbito
  dall'articolo opzionale di `ENTITA`), rendendo `def_descrizione` formalmente
  ambiguo (mascherato finora dal determinismo di LALR e mai esercitato dalla
  guardia). Ora sono un **terminale unico filtrato** `_PREP_DESCR` (maximal-munch,
  come già `PREP_LUOGO`): la grammatica delle descrizioni è **genuinamente
  0-ambigua**. La guardia anti-ambiguità include ora una descrizione condizionale.

### Note
- **Suite del linguaggio**: **225 asserzioni** (erano 216). Header core a **v0.9.3**.

---

## [0.9.2] - 2026-05-31
### Aggiunto (Roadmap Livello 5 «Espressività narrativa» — verso 0.10.0)
- **Regole globali senza oggetto** (`[Livello 5]`) — risolve il limite noto del
  Livello 3. Una regola `Invece di` può ora **omettere il bersaglio** e scattare
  sul solo verbo, valutando la sua condizione:
  - `Invece di guarda se il punteggio è almeno 3: dire "Una luce pulsa.".`
  - Sblocca le **verifiche globali su stati e contatori**, finora agganciabili
    solo a regole su oggetto o agli eventi a turni.
  - **Precedenza**: una regola specifica (con bersaglio) vince sempre su una
    globale; le globali scattano solo se nessuna specifica si è attivata, e
    valgono anche per le azioni senza oggetto (`guarda`, `aiuto`, `inventario`).
  - Una globale senza condizione scatta sempre (sostituisce il comportamento di
    default del verbo).
- **Grammatica**: il bersaglio di `def_regola` è ora opzionale, incapsulato nella
  sottoregola `regola_target`. Questo mantiene la grammatica **LALR(1) 0-ambigua**
  (dopo `VERBO` il lookahead distingue nettamente `ENTITA`/`DIREZIONE` dal `se`/`:`)
  e permette al transformer di non confondere il bersaglio con la risposta quando
  il primo manca. Guardia anti-ambiguità estesa con una regola globale.
- **Limite residuo** (minore): per un verbo che richiede un oggetto, una regola
  globale non scatta se il giocatore digita il verbo *senza* oggetto (l'azione
  chiede prima l'oggetto). Le globali danno il meglio con verbi senza oggetto.
- **Suite del linguaggio**: **216 asserzioni** (erano 204). Header core a **v0.9.2**.

---

## [0.9.1] - 2026-05-31
### Aggiunto (Roadmap Livello 5 «Espressività narrativa» — verso 0.10.0)
- **Interpolazione di testo dinamico** (`[Livello 5]`) — *prima patch del livello*.
  Le stringhe d'autore possono ora contenere **segnaposto** `[nome]` che vengono
  sostituiti, al momento della stampa, con il valore corrente del mondo:
  - **Stati e contatori**: `dire "Hai [punteggio] punti."` → il numero corrente;
    `"Il semaforo è [semaforo]."` → la parola-stato attuale (uno stato non ancora
    impostato rende stringa vuota).
  - **Oggetti**: `[chiave]` → il nome visualizzato dell'oggetto.
  - Vale per **descrizioni** (di stanze e oggetti), **risposte delle regole** e
    **messaggi degli eventi a turni**: ogni testo d'autore passa per
    `utils.rendi_testo(mondo, testo)`.
  - Un segnaposto che non corrisponde a nessuno stato/contatore/oggetto resta
    **invariato** a runtime (letterale `[nome]`) e genera un **avviso non
    bloccante** a compile-time (possibile refuso).
- **Vincoli invariati**: l'interpolazione vive *dentro* le virgolette
  (`TESTO_QUOTATO`), quindi è del tutto invisibile alla grammatica: **nessun
  rischio di ambiguità**. Guardia LALR (1 albero / 0 conflitti) estesa con un
  costrutto che usa segnaposto. Superficie pubblica `analizza_file()` invariata.
- **Suite del linguaggio**: **204 asserzioni** (erano 192), tutte verdi. Header dei
  moduli core allineati a **v0.9.1**.

---

## [0.9.0] - 2026-05-31
### Roadmap del Linguaggio — Livello 4 «Estendibilità vocabolario e topologia» COMPLETATO
Release minore che consolida le patch 0.8.1 → 0.8.5. L'autore può ora **estendere
il vocabolario e la topologia** del mondo, finora in parte cablati nel motore. In
sintesi (dettaglio per-patch sotto e in `documentazione/0.9.0.md`):
- **Alias/sinonimi di oggetti** (`0.8.1`): `La torcia si chiama anche "lanterna".`
- **Verbi personalizzati** (`M1`, `0.8.2`): `"spingi" è un comando.`
- **Direzioni estese data-driven** (`L1`, `0.8.3`): `Alto e basso sono direzioni
  opposte.` con fonte unica per le direzioni (prima cablate in 4 punti).
- **Contenitori e supporti** (`M1`, `0.8.4`–`0.8.5`): `La scatola è un
  contenitore.`, `La gemma è nella scatola.`, verbo `metti`, visibilità a catena.

Vincoli mantenuti per tutto il livello: grammatica **LALR(1) non ambigua per
costruzione** (guardia permanente: 1 albero / 0 conflitti, estesa a ogni nuovo
costrutto) e superficie pubblica `analizza_file()` invariata. Header dei moduli
core allineati a **v0.9.0** (`compilatore`, `strutture`, `gioco`,
`libreria_azioni`, suite). Suite del linguaggio: **192 asserzioni**, tutte verdi
(erano 133 a inizio livello).

> Nota di design: il *vocabolario nuovo* (alias e verbi) si introduce **tra
> virgolette**, perché non è ancora un token noto e così non intacca l'invariante
> dei nomi come simboli chiusi (Livello 2.5). Le direzioni custom usano invece un
> terminale `DIREZIONE` generato per-file (regex con `\b`, priorità alta) per
> vincere il prefix-clash con le keyword, senza toccare la disambiguazione `e`=est.

---

## [0.8.5] - 2026-05-31
### Aggiunto (Roadmap Livello 4 — verso 0.9.0)
- **Contenitori e supporti** (`[M1]`) — *runtime*. La meccanica di gioco completa
  il modello introdotto in 0.8.4:
  - **Visibilità a catena**: un oggetto è raggiungibile se è nella stanza,
    nell'inventario, o dentro/sopra un contenitore/supporto a sua volta
    raggiungibile. Un **contenitore chiuso** (`è chiusa`) nasconde il contenuto;
    aprirlo lo rivela. I supporti sono sempre accessibili.
  - **Nuovo verbo `metti`** (`metti`, `poni`, `inserisci`, `infila`, `appoggia`…):
    `metti la gemma in la scatola`, `metti la tazza sul tavolo`. Rifiuta i
    contenitori chiusi e gli oggetti che non sono contenitori/supporti.
  - **`esamina`** di un contenitore aperto/supporto ne elenca il contenuto
    (`Dentro vedi: …` / `Sopra vedi: …`); chiuso, dice «È chiuso.».
  - **`prendi`** funziona anche su oggetti dentro contenitori aperti / sui supporti.
  - Le **conseguenze di spostamento** accettano ora un contenitore/supporto come
    destinazione: `… e adesso la gemma è nella scatola.`
- `strutture.py`: `Mondo.oggetto_raggiungibile()`, `oggetti_raggiungibili()`,
  `contenitore_aperto()`, `rimuovi_da_posizione()` (centralizza la rimozione da
  stanza/inventario/contenitore); `ConseguenzaSpostamento` gestisce le
  destinazioni contenitore/supporto.
- `libreria_azioni.py`: `esamina`/`prendi` riscritte sulla raggiungibilità; nuova
  azione `mettere` con la sua logica di default; helper `_elenca_contenuto`.
- `compilatore.py`: `_valida_conseguenze` accetta destinazioni contenitore/supporto.
- `gioco.py`: lo scope di `risolvi_nome_oggetto` usa `oggetti_raggiungibili()`;
  `mettere` escluso dalla ristampa automatica della stanza.
- `test_linguaggio.py`: sei nuovi test runtime (scope contenitore aperto,
  chiuso↔apertura, metti in contenitore/su supporto, rifiuto chiuso, conseguenza
  di spostamento in contenitore). Suite a **192 asserzioni** (era 174).

---

## [0.8.4] - 2026-05-31
### Aggiunto (Roadmap Livello 4 — verso 0.9.0)
- **Contenitori e supporti** (`[M1]`) — *modello e grammatica* (il runtime arriva
  in 0.8.5). Si dichiarano oggetti capaci di contenere o reggere altri oggetti, e
  si possono collocare oggetti al loro interno/sopra fin dalla definizione:
  ```
  Una scatola è un contenitore.
  La scatola è in cella.
  Una gemma è una cosa.
  La gemma è nella scatola.

  Un tavolo è un supporto.
  La tazza è sul tavolo.
  ```
  Un contenitore tiene gli oggetti *dentro* (visibili solo se aperto, semantica a
  runtime in 0.8.5); un supporto li regge *sopra* (sempre visibili). Collocare un
  oggetto dentro qualcosa che non è né contenitore né supporto è un **errore
  bloccante** chiaro.
- `strutture.py`: `Oggetto.is_contenitore`, `Oggetto.is_supporto`,
  `Oggetto.contenuto: Set[str]`. L'oggetto collocato ha `posizione` = id del
  contenitore/supporto (la catena fino alla stanza sarà risolta dal runtime).
- `compilatore.py`: scanner `_RE_DEF_CONTENITORE`/`_RE_DEF_SUPPORTO` (un
  contenitore/supporto è a tutti gli effetti un oggetto); regole `def_contenitore`
  e `def_supporto` (distinte da `def_proprieta` sul token `un`, come
  `def_contatore`); `def_posizione` accetta come luogo anche un contenitore/
  supporto; parole riservate `contenitore`, `supporto`.
- `test_linguaggio.py`: sei nuovi test (dichiarazione contenitore/supporto,
  collocazione dentro/sopra, errore su non-contenitore, scanner); corpus della
  guardia esteso con contenitore, supporto e una collocazione. Suite a **174
  asserzioni** (era 162).

---

## [0.8.3] - 2026-05-31
### Aggiunto / Modificato (Roadmap Livello 4 — verso 0.9.0)
- **Direzioni estese, data-driven** (`[L1]`). Le direzioni del mondo (finora
  cablate in 4 punti del codice) hanno ora un'**unica fonte di verità** e sono
  **estendibili dall'autore**:
  ```
  Alto e basso sono direzioni opposte.
  La torre collega basso a cantina.
  ```
  Le direzioni personalizzate si dichiarano sempre **in coppia opposta**, così
  l'auto-ritorno della connessione è garantito (qui `cantina` torna a `torre` con
  `alto`). Funzionano sia nelle connessioni sia come comando di movimento a
  runtime. Il nome di una direzione non può coincidere con una parola riservata o
  un'entità: è un **errore bloccante** con messaggio chiaro.
- Miglioria collaterale: nelle regole il bersaglio-direzione è ora
  **canonicalizzato** (`Invece di vai n` equivale a `vai nord`); le direzioni
  sono riconosciute **case-insensitive**.
- `utils.py`: `DIREZIONI_BASE` e `DIREZIONI_OPPOSTE_BASE` come **fonte unica**.
- `strutture.py`: `Mondo.direzioni` (forma → canonica) e `opposte_direzioni`
  (canonica → opposta), precaricate dalle basi; `dichiara_direzione_opposta()`,
  `direzione_canonica()`, `opposta_di()`.
- `compilatore.py`: scanner Passata 1 `_RE_DEF_DIREZIONI`
  (`TabellaSimboli.coppie_direzioni`); regola `def_direzioni`; il terminale
  **`DIREZIONE` è generato per-file** (base + custom) come regex con `\b` e
  priorità `.2` — vince il longest-match contro le keyword di cui una direzione
  custom condivide il prefisso (es. `alto` vs `al` di «Al turno»), senza intaccare
  l'invariante `e`=est / congiunzione (il lexer contestuale non le mette mai nello
  stesso stato). `def_connessione` e `def_regola` consultano le mappe del mondo
  invece dei dict cablati. `valida_direzioni_dichiarate()` blocca i conflitti.
  Parola riservata `direzioni`.
- `gioco.py`: rimosso il dict cablato `DIREZIONI_VALIDI`; movimento e
  `risolvi_nome_oggetto` usano `mondo.direzioni`.
- `test_linguaggio.py`: cinque nuovi test (connessione+auto-ritorno custom,
  movimento runtime, canonicalizzazione abbreviazione, conflitto bloccante,
  scanner); corpus della guardia esteso con una `def_direzioni` e una connessione
  che la usa; le chiamate della guardia passano ora le direzioni dichiarate. Suite
  a **162 asserzioni** (era 151).

---

## [0.8.2] - 2026-05-31
### Aggiunto (Roadmap Livello 4 — verso 0.9.0)
- **Verbi personalizzati** (`[M1]`): l'autore può introdurre nuove parole-comando
  che il giocatore potrà digitare e usare nelle regole `Invece di`.
  ```
  "spingi" è un comando.
  Invece di spingi la pietra: dire "La pietra rotola via.".
  ```
  Il verbo è una **stringa quotata** monoparola (coerente con gli alias: il
  vocabolario nuovo si introduce tra virgolette). Una regola che usa un verbo
  dichiarato non è più segnalata come "morta". A runtime il comando attiva la
  regola corrispondente; se nessuna regola si applica, il motore risponde con un
  messaggio neutro (`Non succede nulla di particolare.`) anziché "Non capisco
  questo verbo.". Come gli altri verbi, un comando custom agisce su un oggetto.
- `strutture.py`: `Mondo.verbi_personalizzati: Set[str]` + `dichiara_verbo()`;
  `carica_azioni()` instrada i verbi custom a un'azione generica `_personalizzata`
  (priva di logica di default; `setdefault` → non scavalca i verbi di libreria).
- `compilatore.py`: regola `def_verbo` (`TESTO_QUOTATO "è" "un" "comando" "."`),
  unica dichiarazione che inizia con `TESTO_QUOTATO` → 0 conflitti LALR; parola
  riservata `comando`; un comando multiparola genera un *warning* ed è ignorato;
  il check dei verbi delle regole ora accetta anche i verbi personalizzati.
- `gioco.py`: un'azione con `logica_di_default is None` (verbo custom senza regola)
  stampa il messaggio neutro; `_personalizzata` escluso dalla ristampa stanza.
- `test_linguaggio.py`: quattro nuovi test (dichiarazione+niente warning, runtime
  con regola, runtime senza regola, multiparola); corpus della guardia esteso con
  un `def_verbo` e una regola che lo usa. Suite a **151 asserzioni** (era 142).

---

## [0.8.1] - 2026-05-31
### Aggiunto (Roadmap Livello 4 — verso 0.9.0)
- **Alias/sinonimi di oggetti**: l'autore può dare a un oggetto un nome
  alternativo con cui il giocatore potrà riferirlo.
  ```
  La torcia si chiama anche "lanterna".
  ```
  Il sinonimo è una **stringa quotata** (può essere multiparola, es.
  `"vecchia lanterna"`); a runtime il parser dei comandi lo risolve all'oggetto
  canonico (corrispondenza esatta e parziale). Il nome proprio dell'oggetto ha
  sempre la precedenza. Gli alias servono l'input del **giocatore**: nelle regole
  d'autore (`Invece di …`) vale il nome canonico.
- `strutture.py`: `Mondo.alias: Dict[str, str]` (alias normalizzato → id canonico)
  + `dichiara_alias()`. Header e report a v0.8.1.
- `compilatore.py`: regola `def_alias`
  (`ENTITA "si" "chiama" "anche" TESTO_QUOTATO "."`); si distingue dalle altre
  dichiarazioni che iniziano con `ENTITA` grazie al keyword `si`, senza conflitti
  LALR. Parole riservate `si`/`chiama`/`anche`. Validazione non bloccante: alias
  verso oggetto inesistente o verso una non-entità-oggetto → *warning*.
- `gioco.py`: `risolvi_nome_oggetto` consulta `mondo.alias` (esatto e parziale).
- `test_linguaggio.py`: quattro nuovi test (risoluzione esatta, multiparola,
  parziale, warning su bersaglio non-oggetto); corpus della guardia esteso con
  una `def_alias`. Suite a **142 asserzioni** (era 133); guardia anti-ambiguità
  (1 albero / 0 conflitti LALR) verde.

---

## [0.8.0] - 2026-05-31
### Roadmap del Linguaggio — Livello 3 «Stato di gioco e meccaniche» COMPLETATO
Release minore che consolida le patch 0.7.1 → 0.7.5. Il linguaggio FAVELLA passa
da descrittore di mondi statici a motore di **avventure complete**, con stato
astratto e meccaniche temporali. In sintesi (dettaglio per-patch sotto e in
`documentazione/0.8.0.md`):
- **Proprietà opposte dichiarabili** (`M5`): `Accesa e spenta sono opposte.`
- **Fine partita**: conseguenze `vinci` / `perdi` / `termina`.
- **Stato astratto** (`G3`): **stati** enum-like (`Il semaforo è uno stato.` →
  `… è rosso`, `se … è verde`) e **contatori** numerici (`Il punteggio è un
  contatore.`, `aumenta … di N`, `diventa N`, confronti `almeno`/`più di`/`meno di`).
- **Eventi a turni**: `Al turno N: …`, `Ogni N turni: …`.

Vincoli mantenuti per tutto il livello: grammatica **LALR(1) non ambigua per
costruzione** (guardia permanente: 1 albero / 0 conflitti) e superficie pubblica
`analizza_file()` invariata. Header dei moduli core allineati a **v0.8.0**
(`compilatore`, `strutture`, `gioco`, `libreria_azioni`, suite). Suite del
linguaggio: **133 asserzioni**, tutte verdi (erano 65 a inizio livello).

> Nota architetturale chiave: stati e contatori sono una **terza classe di
> simboli chiusi** (terminale `VARIABILE`) disgiunta da `ENTITA`/`PROPRIETA`,
> raccolta in Passata 1. È questa separazione a garantire **zero ambiguità** tra
> i costrutti su variabili e quelli su oggetti.

---

## [0.7.5] - 2026-05-31
### Aggiunto (Roadmap Livello 3 — verso 0.8.0)
- **Eventi a turni**: costrutti temporali a livello di mondo.
  - `Al turno 3: dire "..." e adesso ...` — scatta **una sola volta** al turno N.
  - `Ogni 5 turni: dire "..." e adesso ...` — scatta a **ogni multiplo** di N.
  Riusano la stessa coda di conseguenze delle regole (incluse fine partita,
  stati e contatori), così si può far perdere allo scadere del tempo o
  incrementare un contatore a ogni turno.
- `strutture.py`: classe `Evento` (`scatta_a()`, `esegui_conseguenze()`),
  `Mondo.eventi` + `turno_corrente` + `aggiungi_evento()`.
- `gioco.py`: contatore dei turni nel loop. `elabora_comando` è ora un wrapper
  che, dopo un comando reale, chiama `avanza_turno_e_processa(mondo)` (avanza il
  turno e attiva gli eventi scattati, terminando se un evento chiude la partita);
  la logica del comando è in `_esegui_comando`. Header allineato a v0.7.5.
  Policy: ogni comando non vuoto e diverso da `esci` conta come un turno.
- `compilatore.py`: regola `def_evento` (forme `evento_al`/`evento_ogni`), parole
  riservate `al`/`turno`/`turni`/`ogni`; validazione conseguenze condivisa
  (`_valida_conseguenze`, usata anche da `def_regola`); un numero di turni < 1 è
  un warning e l'evento è ignorato. Suite a **133 asserzioni** (era 119), con
  test d'integrazione del loop e guardia anti-ambiguità estesa agli eventi.

---

## [0.7.4] - 2026-05-31
### Aggiunto (Roadmap Livello 3 — verso 0.8.0)
- **Contatori numerici** (completano `[G3]`), sulla stessa classe di simboli
  degli stati (`VARIABILE`):
  - dichiarazione: `Il punteggio è un contatore.` (valore iniziale 0)
  - mutazioni: `e adesso aumenta il punteggio` (+1), `... aumenta il punteggio di 5`,
    `... diminuisci il punteggio (di N)`, `... il punteggio diventa 10`
  - confronti: `se il punteggio è almeno 3` (≥), `... è più di 2` (>),
    `... è meno di 5` (<), `... è 0` (=)
- `strutture.py`: `CondizioneContatore` (operatori `==`/`>=`/`>`/`<`),
  `ConseguenzaContatore` (modi `aumenta`/`diminuisci`/`diventa`),
  `Mondo.dichiara_contatore()`. `compilatore.py`: scanner `è un contatore`,
  terminale `NUMERO` (priorità alta su `PROPRIETA`, che include le cifre),
  regole `def_contatore`, `cond_contatore_*`, `cons_aumenta`/`cons_diminuisci`/
  `cons_contatore_set`; parole riservate `contatore`/`almeno`/`più`/`meno`/
  `aumenta`/`diminuisci`/`diventa`. I confronti dopo `VARIABILE è` si
  distinguono dal valore-stato per il lookahead (NUMERO/`almeno`/`più`/`meno`
  vs PROPRIETA) → nessuna ambiguità. Suite a **119 asserzioni** (era 102).

> **Limite noto** (non risolto in questo livello): una regola `Invece di [verbo] …`
> richiede sempre un **oggetto bersaglio**; non esistono ancora regole senza
> oggetto del tipo `Invece di guarda se il punteggio è almeno 3: …`. Le verifiche
> globali su contatori/stati vanno per ora agganciate a una regola su oggetto
> (o agli eventi a turni, 0.7.5).

---

## [0.7.3] - 2026-05-31
### Aggiunto (Roadmap Livello 3 — verso 0.8.0)
- **Stato astratto del mondo** (criticità `[G3]`): gli **stati**, variabili globali
  con nome non legate ad alcun oggetto. Uno stato contiene una *parola-stato*
  (modello enum-like, più potente di un booleano):
  - dichiarazione: `Il semaforo è uno stato.`
  - valore iniziale: `Il semaforo è rosso.`
  - condizione: `... se il semaforo è verde` (e negazione `... non è verde`)
  - conseguenza: `... e adesso il semaforo è verde.`
- Architettura: gli stati sono una **terza classe di simboli chiusi** (terminale
  `VARIABILE`), raccolta in Passata 1 e **disgiunta** da `ENTITA`/`PROPRIETA`.
  LALR distingue i costrutti su stato da quelli su oggetto al primo token →
  **zero ambiguità** anche con parole-stato omonime a proprietà di oggetti.
- `strutture.py`: `CondizioneVariabile`, `ConseguenzaVariabile`, `Mondo.variabili`
  + `dichiara_variabile()`. `compilatore.py`: scanner `è uno stato`, terminale
  `VARIABILE` iniettato per-file, regole `def_stato`/`def_stato_valore`/
  `cond_variabile(_neg)`/`cons_variabile`; parola riservata `stato`. Corretto un
  bug latente: il terminale "vuoto" ora è `[^\s\S]` (larghezza 1) invece di `(?!)`
  (zero-width, rifiutato da Lark). Suite a **102 asserzioni** (era 84), guardia
  anti-ambiguità estesa agli stati.

---

## [0.7.2] - 2026-05-31
### Aggiunto (Roadmap Livello 3 — verso 0.8.0)
- **Condizioni di fine partita**: nuove conseguenze `vinci` / `perdi` / `termina`,
  usabili in coda a una regola (`... dire "..." e adesso vinci.`). Impostano lo
  stato globale della partita; il messaggio narrativo è quello della clausola
  `dire`. Combinabili con altre conseguenze nella stessa regola
  (es. `... e adesso la porta è aperta e adesso vinci.`).
- `strutture.py`: nuova `ConseguenzaFinePartita` (esiti `vinta`/`persa`/`terminata`)
  e `Mondo.stato_partita` (default `in_corso`).
- `gioco.py`: il loop interattivo controlla `partita_finita(mondo)` dopo ogni
  conseguenza e termina con il banner di esito. Header allineato a v0.7.2.
- Grammatica: tre nuove alternative di `conseguenza`, parole riservate
  `vinci`/`perdi`/`termina`. Validazione conseguenze resa robusta alle
  conseguenze prive di oggetto. Guardia anti-ambiguità estesa (corpus con
  `vinci`). Suite a **84 asserzioni** (era 72).

---

## [0.7.1] - 2026-05-31
### Aggiunto (Roadmap Livello 3 — Stato di gioco e meccaniche, in lavorazione verso 0.8.0)
- **Proprietà opposte dichiarabili** (generalizza la criticità `[M5]`): l'autore può
  dichiarare coppie di proprietà mutuamente esclusive con la frase
  `Accesa e spenta sono opposte.`. Assegnare una proprietà a un oggetto rimuove
  automaticamente tutte le sue opposte. La coppia `aperta`↔`chiusa`, prima
  cablata in `ConseguenzaProprieta.esegui`, è ora una semplice **coppia
  precaricata di default** (retro-compatibilità totale con le storie esistenti).
- Nuova regola di grammatica `def_opposti` (`PROPRIETA "e" PROPRIETA "sono" "opposte" "."`),
  nuove parole riservate `sono`/`opposte`. La guardia anti-ambiguità (1 albero / 0
  conflitti LALR) copre il nuovo costrutto. Suite a **72 asserzioni** (era 65).

Dettaglio tecnico cumulativo del livello: `documentazione/0.8.0.md`.

---

## [0.2.1] - 2026-05-21
### Risolto (Criticità Gravissime)
- **Normalizzazione dell'input dell'utente:** Risolto il bug gravissimo che impediva la risoluzione degli oggetti in scope quando digitati con articoli (es. `prendi la keycard` falliva mentre `prendi keycard` funzionava). Ora l'input dell'utente viene normalizzato tramite `normalizza_nome` prima del confronto in `risolvi_nome_oggetto`.
- **Risoluzione movimenti con direzioni abbreviate:** 
  - Risolto il blocco della navigazione quando le connessioni erano definite con abbreviazioni nel file `.fav` (es. `collega n a il corridoio`). Ora vengono normalizzate a compile-time a nomi interi (`nord`, `sud`, etc.).
  - Abilitato il supporto per direzioni abbreviate inserite con il verbo `vai` (es. `vai n` o `vai s` ora si risolvono correttamente a `nord` e `sud`).

---

## [0.3.0] - 2026-05-21
### Risolto (Criticità Gravi)
- **Conservazione del nome visualizzato originale:** Ristrutturazione delle classi `Oggetto` e `Stanza` in `strutture.py` e della logica del transformer in `compilatore.py` per preservare la capitalizzazione e gli articoli originali scritti dall'autore (es. `"Una keycard magnetica"`, `"La cella di contenimento"`), mantenendo gli ID normalizzati in minuscolo solo per la logica interna del gioco. Aggiornato l'interprete in `gioco.py` e le azioni in `libreria_azioni.py` per visualizzare questi bellissimi nomi originali.
- **Corrispondenza flessibile delle preposizioni nelle regole a due oggetti:** Implementazione di una logica di tolleranza e fallback in `gioco.py` (`elabora_comando`, FASE 0): se non si trova una corrispondenza esatta con la preposizione specificata nella regola (es. `usa chiave su porta`), il motore tenta un fallback tollerante ignorando la preposizione (es. accettando `usa chiave con porta`) a patto che i due oggetti coincidano univocamente con la regola.

---

## [0.4.0] - 2026-05-21
### Aggiunto & Ottimizzato (Criticità Medie)
- **Rendering asincrono e ottimizzato della mappa:** Spostato il calcolo pesante delle posizioni dei nodi del grafo (`nx.spring_layout`) all'interno di un thread secondario dedicato (`LayoutWorker` ereditato da `QThread`) in `favella_studio.py`. In questo modo si previene efficacemente il congelamento (UI freeze) dell'intera interfaccia utente di PySide6 durante la compilazione di storie di grandi dimensioni. Lo sfondo della figura Matplotlib si armonizza ora con la Dark Mode.
- **Design System Premium "Cyber-Scrittore" (Dark Mode):** Sviluppato e applicato un foglio di stile QSS completo, scuro e moderno (`CYBER_STYLESHEET`) per tutta l'interfaccia dell'IDE. Coinvolge menu, toolbar, splitter, schede (tab), barre di scorrimento, bottoni e dialoghi `QMessageBox`, curando la tipografia monospazio e i feedback di hover.
- **Marker visivi degli errori di sintassi nell'editor:** Integrato un sistema dinamico che, al fallimento della compilazione di Lark, estrae tramite regex la riga d'errore dal log, evidenzia con uno sfondo rosso scuro soffuso (`#4a1515`) la riga esatta nell'editor sfruttando `QTextEdit.ExtraSelection` e posiziona automaticamente il cursore per agevolare il debug.

### Risolto (Criticità Lievi)
- **Generazione di righe vuote superflue nella console:** Ottimizzato l'intercettore di standard output in `GameSession` filtrando le stringhe che, dopo la rimozione dei caratteri di spaziatura finali (`.rstrip()`), risultano vuote, risolvendo il problema dei doppi a capo fastidiosi nella console dell'IDE.
- **Feedback visivo se il gioco non è avviato:** Aggiornata la gestione dell'input in `on_console_input` di `FavellaStudio` per visualizzare un messaggio informativo elegante e colorato direttamente nella console di gioco se l'utente tenta di inviare comandi quando non c'è una sessione attiva.

---

## [0.5.0] - 2026-05-31
### Roadmap del Linguaggio — Livello 1: Consolidamento e Robustezza
Primo passo della roadmap evolutiva del linguaggio FAVELLA: mettere in sicurezza
i costrutti esistenti prima di estenderli. L'obiettivo è impedire all'autore di
scrivere una storia "rotta" senza ricevere alcun feedback. Nessuna funzionalità
narrativa nuova, ma fondamenta molto più solide e diagnostica d'autore.

### Risolto (Criticità Gravissime)
- **[GG1] Posizione iniziale esplicita del giocatore.** Introdotta la primitiva di linguaggio `Il giocatore comincia in [stanza].` (accetta anche *inizia* / *parte*). Prima la stanza di partenza era implicitamente la prima nell'ordine di parsing (`list(stanze.keys())[0]`), fragile e non controllabile dall'autore. Ora `Mondo.posizione_iniziale` è dichiarabile; in sua assenza resta il fallback alla prima stanza. Una stanza di partenza inesistente è un **errore bloccante**.
- **[GG2] Rilevamento refusi nelle proprietà.** Una condizione `se [oggetto] è [proprietà]` che controlla una proprietà mai assegnata a quell'oggetto (né come stato iniziale né tramite conseguenza) emette ora un **avviso di possibile refuso** (es. `chuisa` per `chiusa`), invece di fallire silenziosamente lasciando il puzzle morto.
- **[GG3] Validazione dei verbi delle regole.** Il verbo di ogni regola `Invece di` viene confrontato a compile-time con il vocabolario noto al motore (`VERBI_VALIDI`). Un verbo sconosciuto (regola che non si attiverebbe mai) genera ora un **avviso esplicito**.

### Aggiunto & Migliorato
- **[G1] Disambiguazione esplicita della grammatica.** Aggiunte priorità di regola (`def_*.2` vs `def_proprieta.1`): la scelta del parser Earley sulle frasi formalmente ambigue (`X è una cosa` vs proprietà) è ora deterministica e documentata, non più affidata al tie-break interno di Lark.
- **Suite di test del linguaggio (`test_linguaggio.py`).** 12 test / 28 asserzioni che "congelano" disambiguazione, posizione iniziale, validazioni e parsing della storia di esempio. Garanzia anti-regressione (`python test_linguaggio.py`).
- **[M6] Escape nelle stringhe.** `TESTO_QUOTATO` supporta ora `\"` e `\\`: è finalmente possibile inserire virgolette dentro le battute (`dire "Lui disse \"ciao\"."`).
- **Avvisi non bloccanti.** Nuovo canale diagnostico: gli avvisi (`[FAVELLA 1] Avvisi`) informano l'autore senza interrompere la compilazione, distinti dagli errori fatali.

### Risolto (Criticità Lievi)
- **[L2] Normalizzazione tipografica.** Apostrofi e virgolette "curve" (`'` `'` `"` `"`), tipiche del copia-incolla da editor di testo, vengono convertite nelle versioni dritte attese dalla grammatica, evitando errori di sintassi oscuri.
- **[L5] Rimosso il refuso di versione "v0.8"** nel report di `Mondo.__str__`; allineati gli header di versione di tutti i moduli core a `v0.5.0`.

---

## [0.6.0] - 2026-05-31
### Roadmap del Linguaggio — Livello 2: Logica Composita
Le regole `Invece di` passano da un singolo trigger a vere espressioni logiche.
Questo sblocca i puzzle multi-stato senza dover duplicare le regole.

### Aggiunto (Criticità Gravi)
- **[G2] Condizioni booleane composite.** Le condizioni supportano ora `e` (AND) e `oppure` (OR), con precedenza `OR < AND < atomo` e raggruppamento tramite parentesi. Esempio: `se la porta è chiusa e il giocatore ha la chiave`. (Si usa `oppure` e non `o`, che resta l'abbreviazione di *ovest*.)
- **[M3] Negazione infissa.** Nuove forme negate, idiomatiche in italiano: `se il giocatore non ha [oggetto]` e `se [oggetto] non è [proprietà]`. Internamente generano una `CondizioneNot`.
- **[G2] Conseguenze multiple.** Una regola può applicare più conseguenze in sequenza: `... e adesso la porta è aperta e adesso la chiave è nel nulla` (accettata anche la forma breve `e adesso X e Y`). `Regola.conseguenza` (singola) diventa `Regola.conseguenze` (lista) con il nuovo metodo `esegui_conseguenze()`.

### Modifiche Architetturali
- Nuove classi in `strutture.py`: `CondizioneAnd`, `CondizioneOr`, `CondizioneNot` (gerarchia `Condizione` polimorfica, valutazione ricorsiva).
- Grammatica delle condizioni stratificata (`cond_or` / `cond_and` / `cond_base`) con priorità di regola: le forme negate (`.2`) battono quelle affermative, impedendo che il token `non` venga assorbito dentro `entita` invertendo la semantica.
- Il rilevamento refusi `[GG2]` ora attraversa ricorsivamente le condizioni composite (`_atomi_proprieta`) per trovare i refusi annidati dentro AND/OR/NOT.
- Suite `test_linguaggio.py` estesa: **44 asserzioni** (era 28), inclusi AND/OR, negazioni, conseguenze multiple ed end-to-end.

---

## [0.6.1] - 2026-05-31
### Roadmap del Linguaggio — Livello 2.5 (Disambiguazione strutturale): Fondamenta
Primo commit incrementale verso la **risoluzione definitiva dell'ambiguità grammaticale [G1]** (target `v0.7.0`). La causa radice è il terminale aperto `entita: WORD+`, che rende la grammatica formalmente ambigua: oggi ogni dichiarazione genera più alberi di parsing (misurato: da 1 a 7 nodi `_ambig` per frase) e il parser Earley "indovina" tramite priorità di regola — deterministico ma fragile. La cura, decisa al massimo livello di robustezza, è un compilatore a **due passate** con `ENTITA` come token *chiuso* risolto da una symbol-table + parser **LALR(1)**, unambiguo per costruzione.

Questo commit introduce le **fondamenta isolate** (ancora non cablate nel parsing, che cambierà in `0.6.2`):

### Aggiunto
- **Passata 1 — scanner della symbol-table** (`costruisci_symbol_table` in `compilatore.py`). Estrae dal sorgente i nomi di tutte le stanze e gli oggetti *dichiarati* (`è una stanza`, `è una cosa`, `collega … a …`) senza eseguire il parsing completo; robusto ai punti dentro le stringhe e ai commenti. Restituisce una `TabellaSimboli` con i nomi già normalizzati (supporta i nomi multiparola, es. `cella di contenimento`).
- **Set di parole riservate esplicito** (`PAROLE_RISERVATE`): vocabolario strutturale del linguaggio, base per la futura risoluzione delle entità e per la documentazione d'autore.
- **`utils.normalizza_tipografia`**: estratta la normalizzazione di apostrofi/virgolette tipografiche `[L2]` in un helper condiviso (usato sia da `analizza_file` sia dallo scanner). `utils.ARTICOLI`: lista unica degli articoli, ora condivisa con `normalizza_nome` (eliminata la duplicazione).
- Suite `test_linguaggio.py`: **54 asserzioni** (era 44), con 10 nuovi controlli su scanner e parole riservate.

---

## [0.6.2] - 2026-05-31
### Roadmap del Linguaggio — Livello 2.5 (Disambiguazione strutturale): Il refactor del cuore
Il compilatore passa da single-pass **Earley** (grammatica formalmente ambigua, salvata solo da priorità di regola) a **due passate + LALR(1)**, unambiguo per costruzione. L'ambiguità `[G1]` è eliminata **alla radice**, non più mitigata.

### Modifiche Architetturali
- **Terminale `ENTITA` chiuso, generato per-file.** Sparisce `entita: WORD+` (la causa radice). Le entità sono ora un terminale risolto per **longest-match** contro la symbol-table della Passata 1 (con articolo iniziale opzionale, nomi multiparola come `cella di contenimento`). Le parole-chiave non possono più collidere coi nomi.
- **Migrazione a `parser='lalr'`.** Il parser si costruisce per-file da `costruisci_parser(simboli)`; un'eventuale ambiguità emergerebbe come `GrammarError` a build-time anziché come scelta silenziosa a runtime. Più veloce di Earley.
- **Proprietà coniate = terminale `PROPRIETA` separato**, di **una sola parola** e a priorità lessicale bassa: non può inghiottire i keyword che la seguono (`e`, `oppure`, `:`). *Conseguenza author-facing:* le proprietà di stato sono ora monoparola (i nomi multiparola restano supportati per le entità). Nessuna storia/test esistente ne è impattato.
- **`è prendibile` unificato in `def_proprieta`** come proprietà speciale: rimossa la regola `def_prendibile`, che era l'unica collisione lessicale residua. La grammatica è ora **0-ambigua** anche sotto Earley, non solo risolta da LALR.
- **Rimosse tutte le priorità-cerotto `.2`/`.1`**: con i nomi come token chiusi non servono più (né per le definizioni base né per le forme negate delle condizioni).

### Aggiunto
- **Guardia anti-ambiguità permanente** in `test_linguaggio.py`: un corpus che in `v0.6.0` generava da 1 a 7 alberi per frase ora ne produce **esattamente uno** (0 nodi `_ambig`), e si verifica che **LALR(1) si costruisca senza conflitti**. Rete di sicurezza definitiva contro le regressioni di `[G1]`.
- Suite a **58 asserzioni** (era 54).

---

## [0.7.0] - 2026-05-31
### Roadmap del Linguaggio — Livello 2.5: Disambiguazione strutturale COMPLETATA
Rilascio che chiude il Livello 2.5: la grammatica di FAVELLA è ora **non ambigua per costruzione** (parser LALR(1), nomi come token chiusi). La criticità `[G1]` — la grammatica formalmente ambigua salvata solo dal tie-break di Earley — è **risolta in via definitiva**, non più mitigata. Questo rilascio raccoglie le fondamenta (`0.6.1`) e il refactor del cuore (`0.6.2`) e vi aggiunge la rifinitura della diagnostica d'autore.

### Aggiunto
- **Errori d'autore mirati per le entità non dichiarate.** Sfruttando i nomi come token chiusi, un riferimento a un'entità mai dichiarata non produce più un parse error criptico ma un messaggio chiaro: *«Entità sconosciuta: "porta" non è mai stata dichiarata. Dichiarala prima dell'uso…»*. In caso di refuso vicino a un nome noto, viene proposta la **correzione** (es. `chave` → *«Forse intendevi: chiave?»*) tramite `difflib`. Un vero errore di sintassi (es. punto mancante) continua a ricevere il messaggio generico, senza falsi positivi.

### Documentazione
- Nuova sezione **«Parole riservate»** e nota sulle **proprietà monoparola** nel manuale autore (`documentazione/manuale/manuale.md`).
- `documentazione/0.7.0.md`: dettaglio tecnico del Livello 2.5 (due passate, ENTITA chiuso, LALR, guardia).

### Riepilogo del Livello 2.5 (0.6.1 → 0.6.2 → 0.7.0)
- Compilatore a **due passate**: Passata 1 = symbol-table dei nomi; Passata 2 = parsing LALR(1) con `ENTITA` chiuso (longest-match).
- Eliminato `entita: WORD+` e **tutte** le priorità-cerotto `.2`/`.1`.
- Proprietà coniate = terminale `PROPRIETA` separato, **monoparola** (i nomi multiparola restano per le entità).
- **Guardia anti-ambiguità permanente**: corpus a 1 albero (0 `_ambig`) + LALR senza conflitti.
- Suite del linguaggio a **65 asserzioni** (era 44 a inizio livello), tutte verdi.
- Allineati a `v0.7.0` gli header dei moduli core del linguaggio (`compilatore`, `strutture`, `test_linguaggio`) e il report di `Mondo.__str__`.
