# Registro delle Versioni (Changelog) - FAVELLA 1

Tutti i cambiamenti significativi a questo progetto saranno documentati in questo file.

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
