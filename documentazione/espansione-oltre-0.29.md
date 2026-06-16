# FAVELLA 1 — Espansione «oltre la 0.29»

> **STATO DI ATTUAZIONE.** Il **Cassetto A** (sessione S1 del piano di
> completamento) è stato **realizzato in v0.30.0** (2026-06-16): A1 diagnostica
> nomi non validi ✅, A3 `dire` opzionale nelle regole ✅ (unica modifica di
> grammatica → spec `grammatica-0.30.0.md`), A4 idioma di direzione ✅ (avviso
> mirato; idioma `… sono direzioni opposte` confermato), A2 punto-dentro-virgolette
> **RIMANDATO** (buco nero di falsi positivi, vedi §6c). Il crash cp1252 (§6a) era
> già stato chiuso in 0.29.1.
>
> **Il TEMA 1 del Cassetto B (sessione S2) è stato realizzato in v0.31.0**
> (2026-06-16) → spec `grammatica-0.31.0.md`. **1a** (contatore come operando,
> `di [forza]`) ✅, **1b** (confronto grandezza↔grandezza, `è meno di [soglia]`) ✅,
> e — **accorpata** perché della stessa famiglia grammaticale (operando-quantità) —
> la **sola estrazione numerica casuale** del Tema 2 (`di un numero fra A e B`,
> `il dado diventa un numero fra 1 e 6`) ✅. **1c** («valore successivo» di uno
> stato ordinato, `sali di una marcia`) **scartato** come previsto: le N regole
> esplicite sono più leggibili di un nuovo concetto di «scala».
>
> **Il TEMA 2 è stato COMPLETATO in v0.32.0** (2026-06-16, sessione S3) → spec
> `grammatica-0.32.0.md`. Oltre all'estrazione numerica (già 0.31.0), entrano i due
> costrutti casuali **non numerici**: **2b** scelta casuale fra valori di stato
> (`il meteo diventa uno fra sereno, pioggia, nebbia`, `ConseguenzaSceltaStato`) ✅
> e **2c** condizione probabilistica (`Ogni turno se càpita (1 su 4): …`,
> `CondizioneProbabilita`) ✅. Entrambi riusano `Mondo.rng` (seedato, ANNULLA-safe).
> La demo di guida ha ora un meteo davvero imprevedibile (attrito D1 risolto). I
> temi 3–5 restano da pesare (sessioni S4+).
>
> **Il TEMA 4 è stato realizzato in v0.33.0** (S4) → spec `grammatica-0.33.0.md`
> §16: 4a buio commutabile + 4b battuta di nodo condizionale; 4c (creazione oggetti)
> pesata e rimandata.
>
> **Il TEMA 3 è stato realizzato in v0.34.0** (2026-06-16, sessione S5) → spec
> `grammatica-0.34.0.md` §17: l'**indirezione fra stati**. Copia
> `il corteggiato diventa il preferito` (`ConseguenzaVariabileCopia`, forma nuda) e
> confronto `se il corteggiato è come il preferito` (`CondizioneVariabileUguali`,
> marcatore `come` obbligatorio per 0-ambiguità). Riservato agli STATI (i contatori
> hanno già `[nome]`, Tema 1); mismatch stato↔contatore = errore d'autore gentile,
> validazione differita; ANNULLA-safe. **Il TEMA 5a (quantità/scorte) è NO-GO**: la
> versione ridotta non richiede codice (una scorta è già un contatore col Tema 1) e
> la versione piena apre i plurali/concordanza, fuori spirito; resta un idioma
> documentato (vedi §5a). Tema 5b (template): sconsigliato. **Con S5 il linguaggio è
> sostanzialmente chiuso**; resta l'ecosistema (S6).
>
> Documento di progettazione, **2026-06-16**. Stato del motore alla stesura:
> **v0.29.0, suite verde** (≈582 asserzioni di linguaggio + 43 di collaudo),
> LALR(1) a zero ambiguità, deliberatamente **congelato**. Asse A completo,
> manuale 2ª edizione pronto.
>
> Questo documento nasce da uno **stress-test di genere a tappeto**: quattro
> «fette verticali» di generi *non nativi* di FAVELLA, costruite per portare il
> linguaggio al suo limite e vedere dove si piega. Non sostituisce
> `progettazione-oltre-0.18.md` (che guarda alla toolchain e all'ecosistema): lo
> **completa dal lato dell'espressività del linguaggio**, con dati raccolti sul
> campo. Il metodo è quello collaudato con la demo di guida (v0.19.0): *un
> attrito incontrato scrivendo una storia è un dato; una primitiva mancante è
> un'ipotesi di lavoro.*
>
> **Decisione di metodo (vale per tutto il documento).** Il motore è congelato.
> Qui si **progetta** l'espansione, non la si implementa. La scelta di toccare
> il motore è di Simone, voce per voce (principio *integrare-non-aggirare*: di
> fronte a un limite si integra, ma è una scelta, non un automatismo). E come
> insegna l'accantonamento di B1.2 (il robot dinamico), **non tutto va
> inseguito**: alcune richieste sono buchi neri di complessità.

## Le quattro fette verticali (i banchi di prova)

| Demo | Cartella | Genere | Cosa ha esercitato |
|---|---|---|---|
| **Notte di Gara** | `esempi/demo/guida-overhaul/` | guida «a soqquadro» | sistemi simultanei, bivio, meteo dinamico, demoni a soglia |
| **La Notte Lunga** | `esempi/demo/sopravvivenza/` | sopravvivenza | fame/sete/caldo/salute, ciclo giorno/notte, crafting, capacità, permadeath |
| **Cuori al Caffè** | `esempi/demo/appuntamenti/` | dating sim | affinità per personaggio, dialoghi gated, gelosia, agenda |
| **La Cripta del Lich** | `esempi/demo/ruolo/` | gioco di ruolo | statistiche, mercante, combattimento a turni, level-up |

Tutte e quattro sono **vincibili e perdibili end-to-end**, verificate dal vivo.
Ognuna ha un README con la sua tabella attrito→primitiva; questo documento le
**unifica per tema**.

## Princìpi non negoziabili (invariati)

1. **L'italiano È il codice.** Ogni costrutto si legge come una frase italiana.
2. **LALR(1) a zero ambiguità.** Niente che richieda lookahead illimitato; se
   serve, si chiude il terminale (come ENTITA, VERBO_MULTI, VARIABILE).
3. **Integrare, non aggirare** — ma è una decisione, non un riflesso.
4. **Additività.** Nessuna feature regredisce la suite né cambia la semantica
   delle storie esistenti. Le demo devono continuare a vincere senza modifiche.
5. **Una feature, una sessione.** Impl + test + spec + CHANGELOG, atomica.
6. **La semplicità è una feature.** Ogni aggiunta paga un costo in superficie
   cognitiva per l'autore. Il cassetto B esiste apposta: alcune cose è **giusto
   che FAVELLA non le faccia**, per restare una lingua che si legge.

---

# I due cassetti

- **Cassetto A — fix cheap / alto valore.** Soprattutto **diagnostica e
  robustezza**: il motore fa già la cosa giusta, o quasi; si tratta di non
  rompersi e di spiegarsi meglio. Basso rischio, alto ritorno. *Candidati a
  scongelare il motore.*
- **Cassetto B — espressività da pesare.** Nuovi poteri del linguaggio. Vanno
  soppesati contro il principio 6. Alcuni sono quasi obbligati (la casualità);
  altri sono trappole di complessità (i template). *Da decidere, non da fare.*

---

# TEMA 1 — Aritmetica e confronti fra grandezze ⭐ (il limite n°1) — ✅ FATTO (v0.31.0)

> **✅ Realizzato in v0.31.0 (S2).** 1a + 1b + estrazione casuale accorpata; 1c
> scartato. Sintassi finale: il letterale resta **nudo** (`di 3`), il riferimento
> a contatore è **fra parentesi** (`di [forza]`, `è meno di [soglia]`) per marcare
> il «valore dinamico» — coerente con l'interpolazione `[nome]` dei testi. Spec
> `grammatica-0.31.0.md` §14; vedi anche il CHANGELOG 0.31.0.

**È il limite strutturale più importante emerso, e l'unico comparso in TUTTE e
quattro le demo.** FAVELLA tratta ogni contatore come una **cella isolata** su
cui si fa aritmetica con **costanti letterali**, mai fra celle.

Le tre facce dello stesso limite:

| Faccia | Dove è emerso | Oggi |
|---|---|---|
| **1a. Contatore come operando** | guida D2 (consumo ∝ andatura), sopravvivenza S4 (danno ∝ freddo), GDR **R2** (danno ∝ forza) | `di N` è solo un numero. `diminuisci la vita di [forza]` **non esiste**. |
| **1b. Confronto grandezza↔grandezza** | guida D3, dating **A1** (gelosia relativa), GDR R3 | `se X è almeno Y` con Y contatore **non esiste** (Y è letto come oggetto). |
| **1c. «Valore successivo» di uno stato ordinato** | guida D4 (cambio marcia) | servono N regole, una per valore. |

**Perché è grave.** Senza 1a/1b non esiste *nessun* sistema di gioco numerico
non banale: il danno non può scalare con una statistica (GDR), il consumo non
può dipendere dalla velocità (guida), la gelosia non può essere *relativa*
(dating). Sono i casi in cui si è dovuti ripiegare su **batterie di demoni a
soglia** o **regole duplicate a numero fisso** — verbose, fragili, e che
tradiscono la promessa «il codice è prosa».

### Cassetto e proposta

**Cassetto B**, ma in cima alla lista: è il moltiplicatore di espressività con
il miglior rapporto valore/costo, perché un solo costrutto sblocca quattro
generi.

Sintassi idiomatica proposta (resta prosa):

```
# 1a — un contatore/valore come quantità, tra parentesi quadre come i [var]
diminuisci la vita del lich di [forza].
aumenta il calore di [andatura].

# 1b — confronto fra due grandezze
se la vita del troll è meno di la vita: dire "...".
se l'affinità di Bea è più di l'affinità di Anna: dire "Bea si ingelosisce.".
```

**Nodo LALR.** 1a è il pezzo facile: `di [forza]` riusa il lessico dei
segnaposto `[…]`, già chiuso e non ambiguo. 1b è più delicato — il secondo
operando è un VARIABILE (terminale chiuso già esistente), quindi distinguibile;
va verificato che `è più di [VARIABILE]` non collida con `è più di [NUMERO]`
(lookahead sul tipo di token, fattibile). 1c (stati ordinati, `sali di una
marcia`) è il più invasivo e probabilmente **non vale**: le N regole esplicite
sono più leggibili di un nuovo concetto di «scala».

---

# TEMA 2 — Casualità d'autore ⭐ (il secondo grande assente) — ✅ FATTO (v0.31.0 + v0.32.0)

> **✅ COMPLETATO.** L'estrazione **numerica** è entrata in v0.31.0 (S2), accorpata
> al Tema 1a come terzo operando-quantità: `il dado diventa un numero fra 1 e 6.`,
> `diminuisci la vita di un numero fra 2 e 6.`. Il **resto** è entrato in v0.32.0
> (S3): **2b** scelta casuale fra valori di stato — `e adesso il meteo diventa uno
> fra sereno, pioggia, nebbia.` (`ConseguenzaSceltaStato`) — e **2c** condizione
> probabilistica — `Ogni turno se càpita (1 su 4): …` (`CondizioneProbabilita`,
> vera con probabilità N/M). Tutti e tre i costrutti pescano da `Mondo.rng`
> (seedato, riproducibile, ANNULLA-safe). LALR(1) 0-ambiguo; spec
> `grammatica-0.32.0.md` §15. Riservata aggiunta: `càpita`.

**Emerso in:** guida D1 (meteo/eventi imprevedibili), GDR R1 (danno, critici,
mancati). I due generi-simulazione lo chiedono a gran voce.

Oggi la casualità esiste **solo dentro il motore** e non è esposta all'autore:
le descrizioni a varianti (`è una di:`, A2/0.22.0) e il movimento NPC casuale
(`cambia stanza`, A5) usano `Mondo.rng`, un RNG **seedato e riproducibile** che
ANNULLA sa riavvolgere. *L'infrastruttura c'è già:* manca solo la superficie
d'autore.

**Perché è importante.** Un combattimento senza dadi non è un combattimento; un
meteo deterministico, alla seconda partita, è un copione. La rigiocabilità di
interi generi dipende da questo.

### Cassetto e proposta

**Cassetto B, alto valore.** Il rischio è contenuto perché l'RNG riproducibile +
ANNULLA-safe esiste già (è la parte difficile, ed è fatta).

Sintassi idiomatica proposta:

```
# estrazione numerica (riusa l'RNG seedato; ANNULLA la riavvolge)
diminuisci la vita del lich di un numero fra 2 e 6.
il dado diventa un numero fra 1 e 6.

# scelta fra valori di stato
e adesso il meteo diventa uno fra sereno, pioggia, nebbia.

# condizione probabilistica (demoni/eventi)
Ogni turno se càpita (1 su 4): dire "Un'auto sbuca dal nulla!" e adesso ...
```

Da combinare bene con il **Tema 1a**: `di un numero fra [min] e [max]` è un
operando-quantità come `di [forza]`, stessa famiglia grammaticale.

---

# TEMA 3 — Stato↔stato: assegnazione e indirezione — ✅ FATTO (v0.34.0)

> **✅ Realizzato in v0.34.0 (S5).** Forma finale: copia NUDA
> `il corteggiato diventa il preferito` (`cons_variabile_copia`, nessun
> `diventa PROPRIETA` compete) e confronto col marcatore `come`
> `se il corteggiato è come il preferito` / `… non è come …`
> (`cond_variabile_uguali`/`_neg`). Il `come` è OBBLIGATORIO nel confronto perché
> `VARIABILE è VARIABILE` collide con `VARIABILE è PROPRIETA` (un nome di stato è
> anche un valore-letterale lecito) → ambiguità reale eliminata strutturalmente. La
> proposta iniziale `il nome di Anna` è stata scartata (più verbosa e fuori modello:
> gli stati non sono «posseduti» da un'entità). Riservato agli STATI; mismatch
> stato↔contatore = errore d'autore gentile; validazione differita; ANNULLA-safe.
> Spec `grammatica-0.34.0.md` §17.

**Emerso in:** dating A2; e già col **tester reale Pietro** (gioco «La Talpa»,
«impersonare un personaggio»). Distinto dal Tema 1: lì erano numeri, qui sono
**valori simbolici copiati da una cella all'altra**.

Oggi si assegna/confronta sempre contro un **valore letterale**
(`il corteggiato è Anna`), mai contro il contenuto di un'altra variabile
(`il corteggiato diventa [chi ha l'affinità più alta]`). FAVELLA non ha
puntatori né indirezione.

### Cassetto e proposta

**Cassetto B, ma da pesare con prudenza.** L'indirezione è potente *e* è la
porta della complessità (è mezzo passo verso le variabili dei linguaggi veri).
Il caso d'uso reale è ristretto (impersonare, ricordare una scelta); spesso una
**bandiera esplicita** (lo `stato` workaround) è più leggibile e va benissimo.
Sintassi *se* si decidesse di farlo:

```
e adesso il corteggiato diventa il nome di Anna.   # copia di valore
se il corteggiato è il nome di Bea: dire "...".     # confronto fra valori
```

**Raccomandazione:** tenere in cassetto B *basso*. Il valore/costo è inferiore a
Tema 1 e 2. Rivedere se più tester reali lo chiedono (Pietro è il primo).

---

# TEMA 4 — Contenuti e mondo dinamici

Tre piccoli «non si può» dal lato della *messa in scena*, indipendenti fra loro.
**Stato (v0.33.0, S4):** 4a e 4b ✅ FATTI; 4c 🛑 PESATO E RIMANDATO.

### 4a. Buio dinamico (sopravvivenza S1) — ✅ FATTO (0.33.0)
Realizzato: la conseguenza `ConseguenzaBuioStanza` (`ENTITA "diventa" PROPRIETA`)
commuta `Stanza.buia` in scena. `e adesso la radura diventa buia.` spegne la luce,
`… diventa illuminata.`/`chiara.` la riaccende. Proprietà classificata per radice
(`bui-` / `illuminat-`/`chiar-`), ANNULLA-safe senza RNG, diagnostica gentile
(bersaglio non-stanza o proprietà non di luce). Spec `grammatica-0.33.0.md` §16.
*(Testo storico sotto.)*
La proprietà `è buia` è **statica**: una conseguenza `e adesso la radura è buia`
è rifiutata (le conseguenze agiscono su oggetti, non su stanze). Il ciclo
giorno/notte — battito di ogni survival — non può spegnere la luce delle stanze.
- **Workaround usato:** stato `momento` + descrizioni condizionali; il buio
  «vero» del motore confinato a una grotta statica.
- **Cassetto B.** Proposta: consentire una proprietà di stanza mutabile, o un
  `momento` globale che il motore lega alla luce:
  `Quando il momento è notte: tutte le stanze all'aperto sono buie.` (ambizioso),
  oppure il più semplice `e adesso la radura diventa buia.`.

### 4b. Battuta di nodo condizionale (dating A3) — ✅ FATTO (0.33.0)
Realizzato: `def_battuta` estesa con `( "se" condizione )?` opzionale; `NodoDialogo`
accumula `battute_condizionali` e `battuta_attuale(mondo)` sceglie la prima vera
(altrimenti la base), riuso del meccanismo delle descrizioni. Demo: il saluto di
Anna in `cuori-al-caffe.fav` si scalda con l'affinità. Spec §16. *(Storico sotto.)*

La battuta di un nodo di dialogo non ammette varianti `se`:
`… al nodo "x" dice "…" se [cond]` è **rifiutato** — eppure le descrizioni di
oggetti/stanze le hanno (`La descrizione di X se … è "…"`). È un'**asimmetria**.
- **Workaround usato:** sdoppiare l'*opzione* (stessa etichetta, due condizioni,
  due nodi-destinazione).
- **Cassetto A/B (basso costo, alta coerenza).** Proposta: portare le varianti
  `se` anche sui nodi, per parità con le descrizioni:
  `Anna al nodo "x" dice "…" se il doppiogioco è palese.`. Il meccanismo
  «più varianti, prima vera vince» è già implementato per le descrizioni → in
  buona parte riuso.

### 4c. Creazione di oggetti (sopravvivenza S2) — 🛑 PESATO E RIMANDATO (0.33.0)
Confermata la raccomandazione: creare un oggetto non dichiarato sfida il terminale
chiuso `ENTITA`; il pattern «dichiara nel nulla e rivela» resta sufficiente e più
semplice. Non realizzato in S4; resta workaround documentato (vedi
`debiti-motore-da-integrare`). *(Testo storico sotto.)*

`usa X su Y` sposta oggetti **già esistenti** (anche dal «nulla»), ma non può
*creare* un oggetto nuovo. Il crafting «due bastoni → una torcia nuova» non è
esprimibile; va pre-collocato tutto nel «nulla» e rivelato.
- **Workaround usato:** il fuoco è uno *stato*, non un oggetto creato.
- **Cassetto B.** Spesso il pattern «rivela dal nulla» è sufficiente e più
  semplice. Proposta solo se il crafting diventa un caso d'uso ricorrente:
  `e adesso crea una torcia in inventario.`.

---

# TEMA 5 — Scala: quantità e template

Due limiti di **scala**, non di espressività atomica. Entrambi **cassetto B, da
valutare con sospetto** (sono i più vicini a trasformare FAVELLA in un
linguaggio di programmazione «vero», contro il principio 6).

### 5a. Quantità / scorte (sopravvivenza S6, GDR R6) — 🛑 NO-GO (v0.34.0)
Non esistono oggetti con molteplicità: «3 pozioni» sono 3 oggetti separati, o un
oggetto ricomprabile solo dopo l'uso. Proposta eventuale:
`Il giocatore ha 3 pozioni.` + `consuma una pozione`. Utile, ma apre la
questione plurali/concordanza.

> **🛑 Pesato e NO-GO in v0.34.0 (S5).** La «versione ridotta sui contatori» (una
> scorta = un contatore associato) **non richiede alcun codice motore**: col Tema 1
> è già esprimibile in modo pulito —
> `Le pozioni sono un contatore.` / `Le pozioni partono da 3.`,
> `Invece di bevi se le pozioni è almeno 1: dire "Bevi una pozione." e adesso
> diminuisci le pozioni.`. Inventare `consuma una pozione` sarebbe o zucchero banale
> (una nuova parola riservata per `diminuisci … di 1`) o il buco nero della
> pluralizzazione automatica (concordanza dei nomi generati), fuori dallo spirito di
> FAVELLA (principio 6). Decisione: **idioma da documentare**, non primitiva. Vedi il
> nodo di memoria `debiti-motore-da-integrare`.

### 5b. Template di entità (dating A4, GDR R5)
Non c'è modo di dichiarare un «tipo» e istanziarlo: ogni personaggio/mostro è un
blocco di righe ricopiato. Dieci goblin = dieci copie; una terza pretendente
raddoppia il codice. Proposta eventuale:
`Un goblin è un nemico con vita 4 e danno 1.` (definizione di tipo) +
`Ci sono 3 goblin nella cripta.`.
**Forte raccomandazione di prudenza:** i template sono un buco nero di design
(ereditarietà? override? concordanza dei nomi generati?). Probabilmente **fuori
dallo spirito di FAVELLA**. Tenere in fondo al cassetto B.

---

# TEMA 6 — Robustezza e diagnostica (cassetto A — i veri candidati)

Qui non si tratta di nuovi poteri, ma di **non rompersi** e **spiegarsi**. È il
cassetto a più alto rapporto valore/costo, e tocca *ogni* storia, non un genere.

### 6a. ⭐ Crash su caratteri fuori da Windows-1252 (GDR R8) — ✅ FATTO (0.29.1)
Un carattere non rappresentabile in cp1252 (es. `★` U+2605, `─` U+2500) **nel
testo stampato** fa terminare il gioco con un **traceback fatale** sulla console
Windows. La logica era corretta: a cadere è solo la `print`. Su Windows — dove
sono i tester reali, Pietro incluso — un singolo carattere «fantasia» in una
descrizione uccide la partita a metà.
- **Cassetto A, priorità alta.** La stampa dovrebbe degradare (`errors="replace"`
  o forzare uno stream UTF-8) invece di crashare. Eventualmente un **warning di
  compilazione** che segnala caratteri non-cp1252 nelle stringhe, così l'autore
  lo sa prima di pubblicare. *Già verificato: i caratteri box-drawing nei
  commenti sono innocui (non stampati); solo le stringhe contano.*

### 6b. `/` nei nomi di stato → errore interno grezzo (da [[stress-test-talpa-pietro]]) — ✅ FATTO (0.30.0, A1)
Uno `/` in un nome produce `Errore interno del compilatore: GrammarError`,
non un errore d'autore gentile.
- **Cassetto A.** Intercettare prima di Lark con un messaggio comprensibile.
- **✅ Realizzato in 0.30.0.** `valida_nomi_dichiarati` (Passata 1) intercetta i
  nomi con caratteri non ammessi prima del parser, con errore localizzato (riga,
  colonna, carattere) e codice `nome-non-valido`. Ammessi: lettere, cifre, spazi,
  apostrofo. Cablata in entrambe le pipeline (`analizza_file` e `analizza_file_strutturato`).

### 6c. Riga sbagliata sul «punto dentro le virgolette» (da Pietro) — 🛑 RIMANDATO (0.30.0, A2)
Lo scanner Passata-1 è tollerante per design: il punto-fine-frase finito *dentro*
le virgolette fonde due frasi e fa cascare l'errore su una riga lontana.
- **Cassetto A (delicato).** Già mitigato nel manuale (regola «punto fuori dalle
  virgolette», commit `a5558b5`). Una diagnostica vera nella Passata-1 va pesata
  per non introdurre falsi positivi.
- **🛑 Indagato e rimandato in 0.30.0.** È un buco nero di falsi positivi: la
  continuazione **legittima** `dire "X."` seguita a capo da `e adesso …` è
  indistinguibile, in Passata 1, dall'errore (`dire "X."` come fine-frase con il
  punto interno). Distinguerle richiederebbe il parser, che la Passata 1
  deliberatamente non è. Non forzato (lezione [[b1-giocatore-robot]]): resta la
  regola d'autore nel manuale.

### 6d. `dire` obbligatorio nelle regole (guida D7, sopravvivenza S5) — ✅ FATTO (0.30.0, A3)
I «tick silenziosi» (A9) valgono per eventi e demoni, **non** per le regole: un
gesto del giocatore che muta solo lo stato deve comunque «dire» qualcosa.
- **Cassetto A/B basso.** Rendere `dire` opzionale anche nelle regole con ≥1
  conseguenza, per simmetria con A9. Modifica piccola, coerente.
- **✅ Realizzato in 0.30.0.** `def_regola` riusa l'inline `_esito_temporale` di
  eventi/demoni: `Invece di riposa: aumenta la forza.` è ora valido. LALR(1)
  0-ambiguo (corpus della guardia esteso); a runtime una regola muta non stampa
  righe vuote. Unica modifica di grammatica della sessione → spec `grammatica-0.30.0.md`.

### 6e. Sinonimi di direzione (guida D6) — ✅ FATTO (0.30.0, A4, opzione b)
`"sinistra" è come est.` non funziona: `è come` rimappa solo i **verbi**.
- **Cassetto A basso (o solo doc).** L'idioma corretto esiste già (`Sinistra e
  destra sono direzioni opposte.`), anzi è più pulito. Forse basta documentarlo;
  oppure estendere `è come` alle direzioni.
- **✅ Scelta in 0.30.0: opzione (b).** Si mantiene l'idioma esistente (più pulito,
  e l'auto-ritorno fra opposte è una proprietà che l'aliasing a un punto cardinale
  non darebbe) e si **migliora l'avviso**: quando il bersaglio di `è come` è una
  direzione, il warning lo dice e indica `… sono direzioni opposte`, invece del
  generico «non è un verbo noto». Nessuna modifica di grammatica.

---

# Sintesi: priorità ragionata

Ordine per rapporto **valore / (costo × rischio)**, pensato per scongelare il
motore in modo additivo se e quando Simone deciderà:

1. **Tema 6a — crash cp1252** *(cassetto A)*. Robustezza pura, tocca tutti,
   rischio ~zero. Il fix più ovvio.
2. **Tema 6b/6c — diagnostica Talpa** *(cassetto A)*. Errori d'autore gentili.
3. **Tema 1a — contatore come operando** *(cassetto B)*. Un costrutto, quattro
   generi sbloccati. Il singolo salto di espressività più alto.
4. **Tema 2 — casualità d'autore** *(cassetto B)*. Infrastruttura già pronta;
   sblocca la rigiocabilità dei simulatori. Naturale gemello di 1a.
5. **Tema 1b — confronto grandezza↔grandezza** *(cassetto B)*. Completa il Tema
   1; abilita relazioni *relative* (gelosie, soglie dinamiche).
6. **Tema 4b — battuta di nodo condizionale** *(cassetto A/B)*. Coerenza interna,
   riuso alto.
7. **Tema 6d/6e** *(cassetto A/B basso)*. Rifiniture di simmetria.
8. **Temi 3, 4a, 4c, 5a** *(cassetto B, da pesare)*. Valore reale ma minore, o
   workaround già accettabili.
9. **Tema 5b — template** *(cassetto B, sconsigliato)*. Probabilmente fuori
   dallo spirito di FAVELLA. Non inseguire senza una domanda reale e ripetuta.

**La bussola.** Tre attriti su quattro generi puntano allo **stesso posto**: i
contatori non si parlano (Tema 1) e non c'è caso (Tema 2). Se un giorno FAVELLA
dovesse fare *un solo* passo oltre la 0.29, quel passo è **`di [grandezza]` e
`di un numero fra A e B`**: due operandi-quantità della stessa famiglia, che da
soli trasformano guida, sopravvivenza e GDR da «scenografie con contatori» a
«sistemi». Tutto il resto è rifinitura — o è giusto che resti fuori, perché
FAVELLA vale finché si legge come una storia.

---

## Riferimenti

- Demo: `esempi/demo/guida-overhaul/`, `.../sopravvivenza/`, `.../appuntamenti/`,
  `.../ruolo/` (ciascuna con README + tabella attrito).
- Documento gemello (toolchain/ecosistema): `documentazione/progettazione-oltre-0.18.md`.
- Metodo: la demo di guida `esempi/demo/salerno-reggio/` e la v0.19.0 (lo
  stress-test di genere come fonte di primitive).
- Backlog robustezza/diagnostica: nodo di memoria `debiti-motore-da-integrare`.
- Tester reale: nodo di memoria `stress-test-talpa-pietro` (Temi 3 e 6).
