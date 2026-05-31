# Registro delle Versioni (Changelog) - FAVELLA 1

Tutti i cambiamenti significativi a questo progetto saranno documentati in questo file.

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
