# FAVELLA 1 — Evoluzione oltre la 1.5.0

> 24 ottobre 2026. Motore **1.5.0**. Companion aggiornato di
> `Visione-Evoluzioni-Future-FAVELLA.md` (giugno 2026, scritto quando il motore era
> 1.0.0) e di `Confronto-FAVELLA-vs-Dialogo-HyperFable3.md`. Due scopi:
> **(A)** indicare la migliore espansione del *linguaggio*; **(B)** fare il punto
> sulle integrazioni da altri progetti, ricalibrato su ciò che la 1.5.0 ha già
> assorbito.

---

## Premessa: dove siamo davvero, oggi

La visione di giugno è stata in gran parte **realizzata** fra la 1.0.0 e la 1.5.0.
Prima di decidere il prossimo passo conviene vedere che cosa non è più «futuro»:

| Idea della visione (giugno) | Stato nel motore 1.5.0 |
|---|---|
| A1 — pipeline d'azione (`Prima di`/`Dopo di`) | **Fatto** (1.3.0): tre fasi `Invece di`/`Prima di`/`Dopo di` + `e basta` (vincoli, 1.5.0) |
| C4 — comprensione del parser (`Capisci … come …`) | **In parte** (1.5.0): `si chiama anche` / `si chiamano anche` (alias d'autore) |
| C5 — ricchezza testuale alla Ink | **In parte**: varianti `è una di:`, testo condizionale `[se]…[fine]` annidato (1.5.0), testi con un nome |
| stato↔stato, casualità, contatore-operando (Temi 1–3) | **Fatto** (0.31–0.34): `di [grandezza]`, `càpita N su M`, copie fra stati |
| mondo che cambia (uscite dinamiche/condizionali) | **Fatto** (0.33 + 1.5.0 C13): uscite con una condizione, in due direzioni |
| riga di stato, IFID, prologo/titolo/autore | **Fatto** (1.3.0 + 1.5.0) |
| L2 — collaudo/vincibilità (lato motore) | **Fatto**: `collaudo.py` → `analizza_vincibilita`; `favella1 collaudo --percorsi` (1.5.0) |
| L3 — export a file unico; playground web | **Fatto**: export HTML via Pyodide; `favella_playground.py` |
| L3 — assist al parser (parole/oggetti cliccabili) | **Sostanzialmente coperto** (1.4.0): pulsanti-verbo SCUMM (si compone «verbo + oggetto + preposizione + 2° oggetto») |

**Restano aperte, come *linguaggio*:** le tre riaperture B1/B2/**B3**, le procedure
nominate (C1), le scene (C2), le tabelle (C3), e — fra gli import — `senza ritorno`
(Dialogo) e le dichiarazioni a elenco. Fra queste, una sola è un *salto di
categoria*.

---

# PARTE A — La migliore espansione del linguaggio

## Raccomandazione: **relazioni di prima classe (B3)**

È la **migliore e più funzionale** espansione del linguaggio, e la sola che resta
ancora un *salto di categoria* dopo tutto ciò che la 1.5.0 ha chiuso. La bussola
del vecchio backlog («il passo n°1 sono i contatori che si parlano») è stata
raggiunta: i Temi 1–3 sono fatti. Il prossimo vertice espressivo, idiomatico in
italiano e compatibile con il paradigma (mondo chiuso, LALR(1), solo aggiunte), è
dichiarare **legami fra entità come fatti del mondo, interrogabili**.

### Perché è *la* mossa, non una fra tante

1. **Assorbe dolori concreti che oggi si scrivono a mano.** Tre pattern ricorrenti
   del progetto diventano una frase:
   - **mappe sociali** — la `fiducia di [PG]` del Viaggiatore è oggi *N contatori
     globali col nome composto*; con le relazioni è un legame solo:
     `Il giocatore si fida di Saverio.` / `se il giocatore si fida di qualcuno che è qui: …`;
   - **chiave→serratura** — oggi è una regola `Invece di usa X su Y` per coppia; con
     le relazioni: `La chiave di ottone apre la cella.` / `Il passe-partout apre ogni porta.`;
   - **contenimento e posizione relativa oltre il built-in** — «X è nascosto sotto
     Y», «A è legato a B», «la lettera è dentro il libro».
2. **Si legge benissimo in italiano** — più di qualunque altra feature avanzata. È
   il punto dove «il codice è prosa» regge anche su una logica di gioco profonda.
3. **È additiva e dentro i paletti.** Non riapre i NO-GO (non è quantità/plurali,
   non è un modello di entità con ereditarietà): è un *fatto binario con un nome*.
4. **Chiude il vuoto che i rivali presidiano.** È la feature più potente di
   Inform 7 (*relations*) e **non è mai stata toccata** in FAVELLA; nessun motore
   di IF italiano ce l'ha.

### Il taglio giusto (minimo, per non spalancare la teoria dei grafi)

Non tutta la teoria delle relazioni di Inform: un **sottoinsieme disciplinato**,
da consacrare su una fetta verticale reale (il Viaggiatore, le `fiducia di …`).

- **Relazione binaria con un nome, dichiarata una volta.** Un verbo/locuzione di
  relazione (`si fida di`, `apre`, `è nascosto sotto`) legato a una coppia di
  entità. La dichiarazione fissa nome e *arietà delle due parti* (uno-a-uno,
  uno-a-molti, molti-a-molti), così il motore sa come interrogarla.
- **Si asserisce, si toglie, si interroga.**
  `All'inizio il giocatore si fida di Saverio.` ·
  `e adesso il giocatore si fida di Iole.` · `e adesso il giocatore non si fida più di Vito.` ·
  `se il giocatore si fida di Saverio: …` · `se qualcuno si fida del giocatore: …`.
- **Una direzione per volta** (la reciproca è esplicita: `… ed è reciproco.`), per
  non trascinare l'autore nella simmetria implicita.
- **Interpolazione a corredo** (scatola di vetro): `[chi si fida del giocatore]`
  rende l'elenco concordato, come già fa `[contatore]`.
- **Niente quantificatori complessi nella prima versione**: `qualcuno`/`qualcosa`
  (esiste), `ogni` nelle asserzioni (`apre ogni porta`), ma non ancora conteggi o
  «al più due».

### Rischi e come tenerli (è il costrutto più ambizioso)

- **LALR(1).** Le locuzioni di relazione sono verbi/locuzioni *dichiarate*
  (terminali chiusi per-file, come `VERBO_MULTI` e le direzioni): entrano senza
  ambiguità se lo scanner le raccoglie in Passata 1, esattamente come già fa per i
  verbi multi-parola e gli alias. La guardia Earley resta il cancello.
- **La terza lettura (parser del giocatore).** Decidere da subito se una relazione
  è solo d'autore (asserita da regole) o anche *azionabile* dal giocatore
  (`lega il cane al palo`). Consiglio: **prima solo d'autore e interrogabile**, poi
  — su domanda reale — l'azione del giocatore. Questo dimezza il rischio.
- **Round-trip in Studio dal giorno uno** (regola della casa): un editor
  «relazioni» (una griglia di coppie) che serializza in frasi `.fav` canoniche.
  Le relazioni sono *il* dato che vive bene come griglia (asse-3 della visione).

### Roadmap consigliata (additiva, una fetta verticale alla volta)

1. **Quick win — l'invariante di clamp** (piccolo, indipendente, alto valore).
   Emerso dalla revisione 1.5.0: oggi `X resta fra A e B` è una *conseguenza* da
   richiamare a ogni modifica, e dimenticarla manda i contatori sotto zero (la
   vecchia trappola del Viaggiatore). Una **dichiarazione-invariante** —
   `La sete resta sempre fra 0 e 100.` — che il motore applica dopo ogni scrittura
   toglie un'intera classe di dimenticanze. Costo minimo, nessuna ambiguità, puro
   guadagno. Ottimo primo passo per riscaldare il cantiere.
2. **`senza ritorno`** (da Dialogo) — connessione a senso unico: suffisso opzionale
   a bassissimo costo, l'unica aggiunta di Dialogo genuinamente assente (le uscite
   condizionali del 1.5.0 coprono le *porte*, non i *dirupi*).
3. **B3 nucleo** — relazioni binarie nominate, asserzione/rimozione/interrogazione
   d'autore + interpolazione + editor Studio. Prototipo sul Viaggiatore
   (`fiducia di …` → relazione; chiave→porta → relazione `apre`).
4. **B3 estensioni** — reciprocità, `ogni`, relazioni azionabili dal giocatore, se
   e quando una storia reale le chiede.

### I due secondi posti (se non B3 ora)

- **C1 — procedure nominate** (`Definisci «far passare la notte» come: …`): toglie
  la duplicazione di blocchi di conseguenze (curarsi, consumare una razione) che
  cresce coi giochi grandi. Piccola, sicura, molto utile; buon riscaldamento prima
  di B3. Senza parametri nella prima versione.
- **B1 — oggetti contabili** (`La pozione, plurale «pozioni», è contabile.`): sblocca
  inventari con quantità ed economie (le razioni/acqua del Viaggiatore, oggi un
  contatore «nudo»). Il buco nero dei plurali si evita con la **concordanza
  dichiarata, non indovinata**. Più grande e più delicata di C1, più contenuta di B3.

> **Sintesi Parte A.** Quick win (clamp-invariante) → `senza ritorno` → **B3
> relazioni** come cuore di una FAVELLA 2.0, con C1/B1 come alternative di secondo
> piano. B3 è il massimo espressivo ancora fattibile dentro il paradigma, ed è la
> feature che si legge meglio in italiano di tutte.

---

# PARTE B — Integrazioni da altri progetti

Fonte: `Confronto-FAVELLA-vs-Dialogo-HyperFable3.md` (giugno), **ricalibrato sul
motore 1.5.0**. Il messaggio di quel confronto regge e anzi si rafforza: dai rivali
si prende **poco e di contorno**; il vero valore è interno. La novità è che molta
parte di quel «poco» è **già stata presa**.

### Già integrato dalla 1.0 alla 1.5

- **`Prima di` / `Dopo di`** (da Dialogo, era ★★ «la più sostanziosa») → **fatto**
  (1.3.0), con in più i vincoli `e basta` (1.5.0). Chiuso.
- **Assist al parser / oggetti cliccabili** (da HyperFable, era ★★★ «l'unica
  chiara») → **sostanzialmente coperto** dai pulsanti-verbo SCUMM (1.4.0): il
  giocatore compone «verbo + oggetto + preposizione + 2° oggetto» toccando. Stessa
  frizione risolta (meno «non capisco»), forma a pulsanti anziché parole in prosa.
- **Export a file unico** (il tratto più forte di HyperFable) → **fatto** (Pyodide).
- **Playground web scrivi-compila-gioca** → **fatto** (`favella_playground.py`).
- **Grammatica IT delle preposizioni nei testi** → già nel motore.
- **Collaudo/vincibilità lato motore** → **fatto** (`analizza_vincibilita`,
  `favella1 collaudo`).

### Ancora da catturare (il poco che resta)

| # | Cosa | Provenienza | Livello | Giudizio |
|---|---|---|---|---|
| 1 | **`senza ritorno`** (connessione a senso unico) | Dialogo | Linguaggio | ★★ candidata legittima, a basso costo; vedi Parte A |
| 2 | **Overlay del grafo di vincibilità sulla mappa** (il motore già calcola; manca la *vista* in Studio) | originale (Blocco 5) | IDE | ★★★ il differenziante che nessun rivale ha — la mossa-bandiera dell'IDE |
| 3 | **Guard-rail dell'IDE sulle trappole del motore** (avviso non-clamp, verbi riservati) | originale | IDE | ★★ (il clamp-invariante della Parte A lo rende in parte superfluo nel linguaggio) |
| 4 | **Dichiarazioni a elenco** (`X, Y e Z sono cose`) | Dialogo | Linguaggio | ★ bassa: invisibile all'autore-IDE; utile solo per la mano o per l'LLM |
| 5 | **Checklist dei 13 tipi-oggetto** (come *domanda*, non specifica) | HyperFable | IDE | ★ serve a chiedersi se manca un tipo utile (es. «sequenza»/cutscene) |

### La sola integrazione «grande» non è un import: è un'**ispirazione**

Il salto più grande catturabile dal mondo IF **non è una feature di Dialogo o
HyperFable**, ma il concetto delle **relazioni di Inform 7** (Parte A, B3). Vale
più di tutti gli import della tabella messi insieme, ed è idiomatico in italiano in
un modo che Inform non è. È lì che conviene guardare.

### Paletti confermati (non prendere)

Invariati e ribaditi dallo stato 1.5.0: **niente scatola nera** (Studio salva
`.fav`, non un blob); **niente backend esterno** (l'indipendenza del motore è il
vantaggio chiave — Dialogo ne è prigioniero); **niente internazionalizzazione**
(l'italiano *è* l'identità); **niente plurali/quantità automatiche né template di
entità con ereditarietà** (B1 solo con concordanza dichiarata; B2 resta
sconsigliato); **niente choice-based/drag-drop come default di gioco** (al massimo
l'assist, già fatto a pulsanti); **niente sinonimia all'infinito** nella grammatica.

---

## Appendice — le tre scommesse della visione, oggi

| Scommessa (giugno) | Livello | Stato 1.5.0 | Dove sta nel piano |
|---|---|---|---|
| **B3 — relazioni di prima classe** | Linguaggio | aperta | **Parte A: la raccomandazione** |
| **S1 — autoring assistito da LLM in Studio** | IDE | aperta | fuori dal *linguaggio*, ma la 1.5.0 la rende più facile: più il `.fav` è leggibile, meglio un LLM lo genera e l'autore lo verifica nella scatola di vetro. La sola che *solo* FAVELLA può fare bene |
| **F2 — export librogame a stampa (KDP)** | Output | aperta | fuori dal *linguaggio*; ponte unico con il mondo editoriale; si appoggia al know-how Typst |

Le tre restano valide e distinte per livello. Per la domanda posta — *la migliore
espansione del linguaggio* — la risposta è **B3**. S1 e F2 sono i vertici degli
altri due livelli (IDE e prodotto), non del linguaggio.
