# FAVELLA 1 — Specifica formale della grammatica (v0.18.0)

> Documento **tecnico** versionato. Fissa lo *scheletro statico* della grammatica
> di FAVELLA 1 e il modello dei *terminali chiusi generati per-file*. **Non** è il
> manuale d'autore: descrive il linguaggio dal punto di vista del compilatore.
>
> Fonte di verità del codice: `compilatore._GRAMMAR_TEMPLATE`.
> Un test della suite (`test_spec_ebnf_allineata_alla_grammatica`) verifica che
> questa spec resti allineata ai nomi di regola della grammatica reale.
>
> **Versione.** Dalla v0.18.0 grammatica, compilatore e motore condividono **una
> sola linea di versione**: questa specifica avanza in lockstep col motore (non
> esiste più uno schema «Grammatica vX» separato). Versione corrente: **0.18.0**.
>
> **Novità v0.18.0 — «Consolidamento del linguaggio»** (integrazioni che tolgono
> ogni workaround residuo dalle storie; vedi §7):
> - **A1** Le regole a DUE oggetti (`usa X PREP Y`) ora valutano la clausola `se`
>   (prima la ignoravano: vinceva la prima dichiarata). Solo runtime, grammatica
>   invariata.
> - **A2** Genitivo `dei` ammesso in `_PREP_DESCR` (`La descrizione dei pilastri…`).
> - **A3** Normalizzazione **NFC** degli accenti (sorgente e input runtime): i nomi
>   accentati (`comò`) si risolvono in modo affidabile. Solo `utils`, grammatica
>   invariata.
> - **A4** `PREP_AZIONE` **articolata** (`usa la batteria sul pannello`,
>   `metti la spada nella teca`): basta con la stonatura `su il`/`su la`.
> - **A5** **Copula plurale** `sono` (regola inline `_copula: "è" | "sono"`):
>   `Le tacche sono una cosa`, `Le tacche sono vergini`, `se le tacche sono segnate`.
> - **B4** Confronto `al massimo N` (≤) sui contatori (`cond_contatore_lte`).
> - **B5** Disuguaglianza numerica `non è N` (≠) sui contatori (`cond_contatore_neq`).
> - **B3** Testo d'esito per `vinci`/`perdi`/`termina` (`cons_vinci` & c. con
>   `TESTO_QUOTATO` opzionale).
> - **B7** Negazione di un **gruppo** booleano: `non ( A e B )` (`cond_non_gruppo`).
> - **B1** Condizione di **posizione del giocatore**: `se il giocatore è in X`
>   (`cond_posizione_giocatore`, con negazione `cond_posizione_giocatore_neg`).
> - **B2** Conseguenza di **teletrasporto** del giocatore: `e adesso il giocatore
>   è in X` (`cons_giocatore_sposta`).
> - **B6** **Verbi personalizzati multi-parola** (`"fai scattare" è un comando.`):
>   il parser runtime riconosce il verbo più lungo. Grammatica invariata.

## 1. Modello di compilazione (due passate + preprocessore)

La compilazione di un file `.fav` avviene in tre fasi:

- **Passata 0 — Preprocessore degli import** (`espandi_inclusioni`): espande le
  direttive `Includi "file.fav".` in un unico sorgente, **prima** del parsing.
  La direttiva non raggiunge mai il parser, quindi non incide sulla grammatica.
  In questa fase il sorgente è normalizzato in forma **NFC** (A3) e nella
  tipografia (apostrofi/virgolette curve → dritte).
- **Passata 1 — Scanner / symbol table** (`costruisci_symbol_table`): raccoglie i
  nomi dichiarati di stanze e oggetti (**ENTITÀ**), di stati e contatori
  (**VARIABILE**) e le coppie di direzioni personalizzate. Riconosce sia la copula
  `è` sia `sono` (A5).
- **Passata 2 — Parsing LALR(1)** (`costruisci_parser` + `FavellaTransformer`): la
  grammatica concreta viene generata per-file sostituendo i terminali chiusi, poi
  un parser **LALR(1)** produce l'AST, trasformato nell'oggetto `Mondo`.

**Invariante fondamentale:** la grammatica è **LALR(1), non ambigua per
costruzione**. I nomi (ENTITÀ/VARIABILE/DIREZIONE) sono *terminali chiusi*
(alternanza dei soli simboli dichiarati). Ogni eventuale conflitto emerge a
build-time come `GrammarError`, mai come scelta silenziosa a runtime.

## 2. Scheletro statico (EBNF)

Le `__ENTITA__`, `__VARIABILE__`, `__DIREZIONE_ALT__` sono **segnaposto**
sostituiti per-file con le regex dei simboli noti (vedi §3). La sintassi è quella
di Lark (EBNF con azioni `-> nome`).

```ebnf
    start: dichiarazione+

    ?dichiarazione: def_stanza
                  | def_oggetto
                  | def_verbo
                  | def_descrizione
                  | def_posizione
                  | def_proprieta
                  | def_opposti
                  | def_alias
                  | def_connessione
                  | def_regola
                  | def_giocatore
                  | def_stato
                  | def_stato_valore
                  | def_contatore
                  | def_contatore_iniziale
                  | def_contenitore
                  | def_supporto
                  | def_personaggio
                  | def_dialogo_inizio
                  | def_battuta
                  | def_opzione
                  | def_direzioni
                  | def_evento
                  | def_demone
                  | def_giocatore_capacita
                  | def_capacita_oggetto

    // --- COPULA FLESSIBILE NEL NUMERO (A5) ---
    // Regola INLINE: non produce figli, i metodi del transformer restano identici.
    // Vale ovunque il soggetto sia un'ENTITA, così i nomi plurali usano l'italiano
    // corretto ('Le tacche SONO una cosa'). 'sono' resta riservata anche per
    // 'sono opposte'/'sono direzioni opposte' (contesti distinti per token precedente).
    _copula: "è" | "sono"

    // --- DEFINIZIONI BASE ---
    def_stanza: ENTITA _copula "una" "stanza" "."
    def_oggetto: ENTITA _copula "una" "cosa" "."
    def_contenitore: ENTITA _copula "un" "contenitore" "."
    def_supporto: ENTITA _copula "un" "supporto" "."
    def_personaggio: ENTITA _copula "un" "personaggio" "."
    def_verbo: TESTO_QUOTATO "è" "un" "comando" "."
    def_descrizione: "La" "descrizione" _PREP_DESCR ENTITA ( "se" condizione )? "è" TESTO_QUOTATO "."
    def_posizione: ENTITA _copula PREP_LUOGO ENTITA "."
    def_proprieta: ENTITA _copula PROPRIETA "."
    def_opposti: PROPRIETA "e" PROPRIETA "sono" "opposte" "."
    def_alias: ENTITA "si" "chiama" "anche" TESTO_QUOTATO "."
    def_connessione: ENTITA "collega" DIREZIONE "a" ENTITA "."
    def_giocatore: "Il" "giocatore" ( "comincia" | "inizia" | "parte" ) PREP_LUOGO ENTITA "."

    // --- CAPACITÀ DI TRASPORTO (Livello 7) ---
    def_giocatore_capacita: "Il" "giocatore" "può" "portare" NUMERO "oggetti" "."
    def_capacita_oggetto: ENTITA "dà" NUMERO "spazi" "."

    // --- STATO ASTRATTO (stati e contatori) ---
    def_stato: VARIABILE "è" "uno" "stato" "."
    def_stato_valore: VARIABILE "è" PROPRIETA "."
    def_contatore: VARIABILE "è" "un" "contatore" "."
    def_contatore_iniziale: VARIABILE "parte" "da" NUMERO "."

    // --- TOPOLOGIA: DIREZIONI PERSONALIZZATE ---
    def_direzioni: DIREZIONE "e" DIREZIONE "sono" "direzioni" "opposte" "."

    // --- EVENTI A TURNI ---
    def_evento: "Al" "turno" NUMERO ":" "dire" TESTO_QUOTATO ( "e" "adesso" conseguenza ( "e" "adesso"? conseguenza )* )? "." -> evento_al
              | "Ogni" NUMERO ( "turno" | "turni" ) ":" "dire" TESTO_QUOTATO ( "e" "adesso" conseguenza ( "e" "adesso"? conseguenza )* )? "." -> evento_ogni

    // --- DEMONI / EVENTI CONDIZIONALI (Livello 8) ---
    def_demone: "Ogni" "turno" "se" condizione ":" "dire" TESTO_QUOTATO ( "e" "adesso" conseguenza ( "e" "adesso"? conseguenza )* )? "." -> demone_ogni
              | "Quando" condizione ( "diventa" "vera" )? ":" "dire" TESTO_QUOTATO ( "e" "adesso" conseguenza ( "e" "adesso"? conseguenza )* )? "." -> demone_quando

    // --- NPC E DIALOGHI ---
    def_dialogo_inizio: "Il" "dialogo" _PREP_DESCR ENTITA "comincia" "con" TESTO_QUOTATO "."
    def_battuta: ENTITA "al" "nodo" TESTO_QUOTATO "dice" TESTO_QUOTATO "."
    def_opzione: "Al" "nodo" TESTO_QUOTATO "l'" "opzione" TESTO_QUOTATO ( "se" condizione )? opzione_esito ( "e" "adesso" conseguenza ( "e" "adesso"? conseguenza )* )? "."
    opzione_esito: "conduce" "al" "nodo" TESTO_QUOTATO -> esito_conduce
                 | "chiude" "il" "dialogo"             -> esito_chiude

    // --- REGOLE (INVECE DI) ---
    def_regola: "Invece" "di" VERBO regola_target? ( "se" condizione )? ":" "dire" TESTO_QUOTATO ( "e" "adesso" conseguenza ( "e" "adesso"? conseguenza )* )? "."
    regola_target: ( ENTITA | DIREZIONE ) ( PREP_AZIONE ENTITA )?

    // --- CONDIZIONI (logica booleana: OR < AND < atomo) ---
    ?condizione: cond_or
    ?cond_or: cond_and ( "oppure" cond_and )+ -> make_or
            | cond_and
    ?cond_and: cond_base ( "e" cond_base )+ -> make_and
             | cond_base
    ?cond_base: cond_possesso
              | cond_possesso_neg
              | cond_posizione_giocatore
              | cond_posizione_giocatore_neg
              | cond_proprieta
              | cond_proprieta_neg
              | cond_variabile
              | cond_variabile_neg
              | cond_contatore_eq
              | cond_contatore_neq
              | cond_contatore_gte
              | cond_contatore_gt
              | cond_contatore_lt
              | cond_contatore_lte
              | cond_non_gruppo
              | "(" cond_or ")"
    cond_possesso: "il" "giocatore" "ha" ENTITA
    cond_possesso_neg: "il" "giocatore" "non" "ha" ENTITA
    // [B1] Posizione del giocatore. Dopo 'il giocatore' il lookahead distingue
    // "ha"/"non ha" (possesso) dalla copula è/sono (posizione). 0-ambiguo.
    cond_posizione_giocatore: "il" "giocatore" _copula PREP_LUOGO ENTITA
    cond_posizione_giocatore_neg: "il" "giocatore" "non" _copula PREP_LUOGO ENTITA
    cond_proprieta: ENTITA _copula PROPRIETA
    cond_proprieta_neg: ENTITA "non" _copula PROPRIETA
    cond_variabile: VARIABILE "è" PROPRIETA
    cond_variabile_neg: VARIABILE "non" "è" PROPRIETA
    cond_contatore_eq: VARIABILE "è" NUMERO
    // [B5] '≠ N' sui contatori. Dopo 'VARIABILE non è' il lookahead NUMERO (≠) vs
    // PROPRIETA (stato, cond_variabile_neg) distingue → LALR(1) 0-ambiguo.
    cond_contatore_neq: VARIABILE "non" "è" NUMERO
    cond_contatore_gte: VARIABILE "è" "almeno" NUMERO
    cond_contatore_gt: VARIABILE "è" "più" "di" NUMERO
    cond_contatore_lt: VARIABILE "è" "meno" "di" NUMERO
    // [B4] '≤ N' sui contatori ('al massimo'), simmetrico ad 'almeno' (≥). Dopo
    // 'VARIABILE è' il lookahead "al" distingue dagli altri confronti. 0-ambiguo.
    cond_contatore_lte: VARIABILE "è" "al" "massimo" NUMERO
    // [B7] Negazione di un GRUPPO booleano: 'non ( A e B )'. È l'unico cond_base
    // che inizia con "non" → riconosciuto al primo token, 0-ambiguo.
    cond_non_gruppo: "non" "(" cond_or ")"

    // --- CONSEGUENZE (clausola 'e adesso') ---
    ?conseguenza: ENTITA _copula PREP_LUOGO ENTITA -> cons_spostamento
                | ENTITA _copula PROPRIETA          -> cons_proprieta
                | "il" "giocatore" _copula PREP_LUOGO ENTITA -> cons_giocatore_sposta
                | VARIABILE "è" PROPRIETA        -> cons_variabile
                | "aumenta" VARIABILE ( "di" NUMERO )?    -> cons_aumenta
                | "diminuisci" VARIABILE ( "di" NUMERO )? -> cons_diminuisci
                | VARIABILE "diventa" NUMERO     -> cons_contatore_set
                | "vinci" TESTO_QUOTATO?         -> cons_vinci
                | "perdi" TESTO_QUOTATO?         -> cons_perdi
                | "termina" TESTO_QUOTATO?       -> cons_termina
```

## 3. Terminali

### 3.1 Terminali fissi

```ebnf
    PREP_LUOGO: "in" | "nel" | "nella" | "negli" | "nelle" | "nell'" | "sul" | "sulla" | "sullo" | "sui" | "sugli" | "sulle"
    PREP_AZIONE: "sull'" | "sul" | "sullo" | "sulla" | "sui" | "sugli" | "sulle" | "su" | "con" | "contro" | "nell'" | "nel" | "nello" | "nella" | "nei" | "negli" | "nelle" | "in"
    _PREP_DESCR: "di" | "del" | "dei" | "della" | "dell'" | "degli" | "delle"
    VERBO: WORD
    WORD: /[a-zA-ZÀ-ÿ0-9']+/
    NUMERO.2: /[0-9]+/
    PROPRIETA.-1: /[a-zA-ZÀ-ÿ0-9']+/
    TESTO_QUOTATO: /"(\\.|[^"\\])*"/
```

Note di disambiguazione lessicale:

- **`PROPRIETA`** è un aggettivo di stato coniato, **monoparola**, a priorità
  **bassa** (`.-1`): i keyword strutturali vincono sempre la contesa lessicale.
- **`NUMERO`** ha priorità **alta** (`.2`): un token tutto-cifre si risolve a
  numero (contatori e capacità), non a proprietà. È ciò che rende possibile B5
  (`non è 3` → confronto numerico, non stato).
- **`PREP_AZIONE`** (A4) include ora le forme articolate, simmetriche a
  `PREP_LUOGO`. La sovrapposizione fra i due terminali è innocua: non sono mai
  validi nello stesso stato LALR (PREP_AZIONE solo in `regola_target`; PREP_LUOGO
  solo in posizione/spostamento), come già accadeva per `in`.
- **`_PREP_DESCR`** (A2) include ora `dei` (genitivo plurale maschile davanti a
  consonante). È un terminale unico filtrato (maximal-munch).

### 3.2 Terminali CHIUSI generati per-file

Sostituiti in Passata 2 dai simboli raccolti in Passata 1
(`costruisci_grammatica`):

```ebnf
    DIREZIONE.2: /(?:__DIREZIONE_ALT__)\b/i
    VERBO_MULTI.3: /(?:__VERBI_MULTI__)\b/i
    ENTITA: /__ENTITA__/i
    VARIABILE: /__VARIABILE__/i
```

- **`ENTITA`** — alternanza chiusa dei nomi di stanze e oggetti dichiarati (più
  gli pseudo-simboli `inventario` e `nulla`). Articolo iniziale **opzionale**,
  confine di parola finale `\b`, ordinamento per lunghezza decrescente
  (longest-match). Supporta nomi **multiparola**.
- **`VARIABILE`** — alternanza chiusa degli «stati»/contatori dichiarati,
  **disgiunta** da `ENTITA`.
- **`DIREZIONE`** — forme di base più le direzioni personalizzate dichiarate.
- **`VERBO_MULTI`** (0.18.0 / B6) — alternanza chiusa dei verbi personalizzati
  **multi-parola** dichiarati (`"fai scattare" è un comando.`), con spazi
  flessibili (`\s+`) e priorità **alta** (`.3`): la frase intera vince il
  longest-match contro il singolo `WORD` del primo token. I verbi monoparola
  restano coperti da `VERBO: WORD` (aperto), così la diagnostica «verbo non
  riconosciuto» dei refusi è preservata.
- Un terminale chiuso **vuoto** diventa la regex `[^\s\S]` (non matcha mai).

```ebnf
    %import common.WS
    %ignore WS
    COMMENT: /#[^\n]*/
    %ignore COMMENT
```

## 4. Lessico ausiliario (fuori grammatica)

Alcuni elementi vivono **dentro** `TESTO_QUOTATO` e sono perciò invisibili alla
grammatica (zero rischio di ambiguità):

- **Interpolazione** `[nome]` — sostituita a render-time con il valore di uno
  stato/contatore o col nome di un oggetto (`utils.rendi_testo`).
- **Direttiva di import** `Includi "file.fav".` — gestita dal preprocessore.
- **Verbi personalizzati multi-parola** (B6) — la parola-comando è una stringa
  quotata (`"fai scattare" è un comando.`); il riconoscimento del verbo più lungo
  avviene nel **parser runtime** (`gioco._esegui_comando`), non nella grammatica.

## 5. Vincoli di stabilità

- La grammatica resta **LALR(1) 0-ambigua**; una guardia permanente nella suite
  (`test_guardia_*`) verifica «1 albero / 0 conflitti» a ogni costrutto.
- Il *vocabolario nuovo* (alias, verbi, etichette di nodo, testi delle opzioni,
  path di import) si introduce **sempre tra virgolette**.

## 6. Semantica dei demoni (Livello 8)

I demoni sono due produzioni di dichiarazione che riusano `condizione` e la coda
di conseguenze. La loro semantica vive nel runtime (`gioco._processa_demoni`),
valutata a **fine turno** dopo gli eventi a tempo.

- **`demone_ogni` — `Ogni turno se [cond]: …`** (a **livello**): scatta a ogni
  turno in cui la condizione è vera (effetti continui).
- **`demone_quando` — `Quando [cond] (diventa vera)?: …`** (sul **fronte di
  salita**): scatta **una sola volta**, quando la condizione passa da falsa a
  vera. `Demone.era_vera` è inizializzato a fine compilazione: una condizione già
  vera alla partenza non genera un falso fronte.

## 7. Consolidamento v0.18.0 — semantica delle integrazioni

- **A1 (regole a 2 oggetti + `se`).** A runtime, per `usa X PREP Y` il motore
  sceglie, fra le regole che combaciano su verbo+ogg1+prep+ogg2, la **prima
  condizionale soddisfatta**, poi la **prima semplice**; prima con preposizione
  esatta, poi col fallback prep-tollerante (stessi due oggetti). Speculare alle
  regole a un oggetto.
- **B1/B2 (posizione/teletrasporto del giocatore).** `cond_posizione_giocatore`
  verifica `mondo.posizione_giocatore`; `cons_giocatore_sposta` la imposta e,
  quando il movimento avviene per una regola del giocatore, mostra la nuova
  stanza. La destinazione dev'essere una stanza esistente (validata in
  `valida_post`); il movimento per direzioni (`collega`) resta la via primaria.
- **B3 (testo d'esito).** `cons_vinci`/`cons_perdi`/`cons_termina` accettano un
  `TESTO_QUOTATO` opzionale: se presente, è il messaggio stampato alla chiusura
  della partita (al posto del testo fisso). Più conseguenze restano separate da
  `e adesso`; il testo, se c'è, appartiene sempre alla parola d'esito che lo
  precede (nessun'altra conseguenza inizia con una stringa quotata → 0-ambiguo).
- **B6 (verbi multi-parola).** `"fai scattare" è un comando.` è accettato: il
  parser runtime, prima di isolare il verbo, cerca la corrispondenza con il
  **verbo dichiarato più lungo** all'inizio del comando del giocatore.

Le riservate aggiunte da questo consolidamento sono `massimo` (B4) e `giocatore`
era già riservata. `sono` (A5) era già riservata per `opposte`/`direzioni`.
