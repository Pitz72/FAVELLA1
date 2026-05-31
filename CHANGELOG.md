# Registro delle Versioni (Changelog) - FAVELLA 1

Tutti i cambiamenti significativi a questo progetto saranno documentati in questo file.

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
