# FAVELLA 1 — Analisi critica del linguaggio

> Motore **1.2.1**, grammatica **1.2.0**. Analisi del 25 settembre 2026.
>
> Documento di lavoro: elenca criticità, limiti, implementazioni mancanti e
> possibili evoluzioni del **linguaggio** (grammatica d'autore, semantica,
> interprete, libreria dei verbi, parser del giocatore). Sito, Studio e
> packaging entrano solo dove toccano il linguaggio.

---

## 0. Metodo e scala di gravità

**Fonti.** Specifica `grammatica-1.2.0.md`; codice di `compilatore.py`,
`gioco.py`, `strutture.py`, `libreria_azioni.py`, `favella_utils.py`; la libreria
standard (`favella1/libreria/`); i capitoli 10, 16 e 19 del manuale; le storie
ufficiali in `esempi/` e `favella1/galleria/`.

**Verifica.** Le suite esistenti sono verdi (735 asserzioni del linguaggio, 50
del collaudatore). Ogni ipotesi è stata poi messa alla prova con una storia-sonda
minima, compilata con `analizza_file` e giocata turno per turno con
`gioco.elabora_comando`. Le criticità marcate **✅** sono state riprodotte e ne è
riportata l'uscita osservata; quelle marcate **📖** si ricavano con certezza dal
codice, ma non hanno una sonda dedicata.

**Scala di gravità.**

| Livello | Criterio |
|---|---|
| **Gravissima** | Il motore fa silenziosamente altro rispetto a ciò che l'autore ha scritto, su costrutti comuni: un enigma si rompe e né il compilatore, né il linter, né il collaudo se ne accorgono. |
| **Grave** | Difetto funzionale o trappola frequente. L'errore si vede, ma per capirlo o aggirarlo serve conoscere l'interno del motore; oppure manca una capacità che il resto del linguaggio dà per scontata. |
| **Media** | Limite espressivo o incoerenza con un rimedio ragionevole. |
| **Lieve** | Difetti estetici, prestazioni non urgenti, documentazione non allineata. |

---

## 1. Il linguaggio in una pagina

FAVELLA compila un sorgente `.fav` in tre passate:

1. **Passata 0**: `Includi "…".` è espanso testualmente, con normalizzazione NFC e tipografica.
2. **Passata 1**: uno scanner a espressioni regolari spezza il testo sui punti e
   raccoglie i nomi dichiarati (stanze, oggetti, stati, contatori, direzioni,
   verbi di più parole).
3. **Passata 2**: una grammatica **LALR(1)** generata per ogni file, in cui quei
   nomi diventano **terminali chiusi**, produce l'albero; il transformer lo
   traduce nel `Mondo`, `valida_post` risolve i riferimenti differiti e il linter
   aggiunge gli avvisi.

A runtime il comando del giocatore **non** passa per la grammatica: lo analizza a
mano `gioco._esegui_comando` (verbo in testa, prima preposizione nota, ricerca
dell'oggetto per sottostringa). Le azioni di default sono nove, scritte in Python
(`LIBRERIA_AZIONI`). L'unico tipo di regola è `Invece di`, con quattro fasi di
precedenza. Eventi e demoni scattano a fine turno. ANNULLA fa una copia profonda
del mondo a ogni turno, SALVA registra la sequenza dei comandi e CARICA la rigioca.

**Punti di forza reali.** La grammatica è non ambigua per costruzione e una
guardia Earley lo controlla a ogni versione; l'ordine delle frasi non conta; il
caso è deterministico e ANNULLA lo riavvolge; per le entità sconosciute la
diagnostica propone il nome giusto; il linter è utile; i test sono tanti. La
disciplina «solo aggiunte» dalla 1.0 in poi è stata rispettata.

**Tesi di fondo.** In FAVELLA convivono tre modi diversi di leggere una frase:

- lo scanner a regex della Passata 1;
- la grammatica LALR della Passata 2;
- il parser del giocatore, scritto a mano.

La parte d'autore è rigorosa. Le criticità più serie nascono **nei punti in cui
queste tre letture non coincidono**, e soprattutto nel passaggio da ciò che
l'autore scrive (`Invece di prendi…`, `Al nodo "saluto"…`, `il giocatore ha…`) a
ciò che il giocatore digita (`raccogli…`, `guarda…`, `dai … alla guardia`). Lì la
promessa «se sai descrivere una scena, sai programmarla» cede, e il più delle
volte senza alcun avviso.

---

## 2. Criticità gravissime

### GS-1 — Le regole si agganciano alla parola, non all'azione ✅

**Cosa.** `Invece di prendi la mela: …` scatta solo se il giocatore digita
esattamente `prendi`. Con `raccogli`, `afferra` o `prendere`, sinonimi che la
libreria riconosce da sé, parte la logica di default e **la regola viene
saltata**. Vale per ogni famiglia di verbi: `esamina`/`leggi`/`osserva`,
`lascia`/`molla`/`posa`/`butta`, `metti`/`inserisci`/`infila`/`appoggia`.

```
La mela avvelenata è una cosa.   La mela avvelenata è in cucina.
La mela avvelenata è prendibile.
Invece di prendi la mela avvelenata: dire "Non la tocchi: è avvelenata.".
```
```
> prendi mela       → Non la tocchi: è avvelenata.
> raccogli mela     → Preso: La mela avvelenata.        ← regola scavalcata
```

**Anche nella demo ufficiale.** In *Il Relitto Silente*, `prendi il disco` stampa
il testo d'autore, mentre `raccogli il disco` risponde soltanto «Preso: Il
disco.». Lo stesso vale per il seme, la stele e il nucleo, tutti prendibili.

**L'inverso è altrettanto sbagliato.** Una regola scritta col **nome
dell'azione** (`Invece di usare la porta`) cattura `apri`, `mangia`, `sposta` e
`usa`, perché la libreria li raggruppa tutti nell'azione «usare». Invece
`Invece di aprire la porta` scatta soltanto su `aprire`.

**Perché.** La regola conserva il verbo così come l'autore l'ha scritto
(`Regola.verbo = "prendi"`). A runtime il confronto avviene con
`{verbo_giocatore, nome_azione}` (`gioco.py:891`, `:967`), cioè con la parola
digitata e col nome interno dell'azione («prendere»). La forma canonica usata
dall'autore («prendi») non vi compare mai.

**Aggravante.** Il manuale (cap. 10, «Sinonimi di un verbo») consiglia proprio
di dichiarare `"raccogli" è come prendi.` e la dichiarazione **corregge**
davvero il difetto: prima dell'analisi il sinonimo riscrive `raccogli` in
`prendi`. Il compilatore però la etichetta come «superflua»
(`compilatore.py:1187`), cioè dice all'autore di togliere l'unica cosa che lo
protegge. `afferra` intanto resta scoperto.

**Impatto.** Ogni blocco d'autore su un oggetto `prendibile`, e ogni testo
narrativo legato a `esamina` o `lascia`, si aggira con un sinonimo che il motore
stesso conosce. Il collaudo dinamico non lo trova: i suoi «caratteri» non usano
mai `raccogli`, `afferra` o `guarda X`, e non confrontano l'esito di verbi
equivalenti sullo stesso oggetto (`esploratore.py:147-148`).

**Correzione.** In `def_regola`, portare a forma canonica i verbi di libreria
(`regola.verbo` → nome dell'azione), e a runtime confrontare le azioni fra loro.
I verbi dichiarati dall'autore restano letterali. A parte, dividere l'azione
«usare» in `aprire`, `mangiare`, `spostare` e `usare`: oggi mettono insieme
significati che non hanno nulla in comune (vedi G-4).

---

### GS-2 — «guarda X» e «osserva X» non guardano X ✅

**Cosa.** `guarda il quadro` e `osserva il quadro` ignorano l'oggetto e
ristampano la stanza. Le regole `Invece di guarda il quadro: …` e `Invece di
osserva …` **non scattano mai**, e il compilatore non avverte.

```
Invece di guarda il quadro: dire "Ti sembra di vedere un volto.".
```
```
> guarda il quadro   → --- La cucina --- Non vedi nulla di particolare. …
> esamina il quadro  → Un paesaggio marino.
```

**Perché.** `guarda` e `osserva` compaiono sia nell'azione «esaminare» sia
nell'azione «guarda» (`libreria_azioni.py:174` e `:191`). `carica_azioni`
costruisce la mappa verbo → azione con un'assegnazione semplice
(`strutture.py:1070`), quindi vince l'ultima, cioè «guarda», che non richiede un
oggetto. Senza oggetto le fasi 0–2 delle regole non vengono nemmeno valutate
(`gioco.py:890`). Resta la sola fase globale.

**Impatto.** `guarda X` è il modo più naturale in italiano per esaminare
qualcosa. Il manuale insegna `esamina`, ma nessuno può tenere a bada ciò che
scrive il giocatore. Le regole morte passano per valide, perché `guarda` sta in
`VERBI_VALIDI`.

**Correzione.** Scegliere l'azione dopo aver separato gli argomenti: se c'è un
argomento, `guarda`/`osserva` equivalgono a esaminare; senza argomento
ristampano la stanza. Aggiungere poi un test che vieti verbi presenti in due
azioni.

---

### GS-3 — I nodi di dialogo sono globali: due personaggi si fondono ✅

**Cosa.** Le etichette dei nodi appartengono a un unico spazio globale. Se due
personaggi usano lo stesso nodo (`"saluto"`, `"inizio"`, `"fine"`, cioè le
etichette più ovvie), le battute si sovrascrivono e le opzioni si sommano,
**senza alcun avviso**.

```
Anna al nodo "saluto" dice "Ciao, sono Anna.".
Al nodo "saluto" l'opzione "Chi sei?" chiude il dialogo.
Marco al nodo "saluto" dice "Salve, sono Marco.".
Al nodo "saluto" l'opzione "Hai visto Anna?" chiude il dialogo.
```
```
> parla con anna
Anna: Salve, sono Marco.
  1. Chi sei?
  2. Hai visto Anna?
```

**Perché.** `Mondo.nodo_dialogo_di(etichetta)` (`strutture.py:877`) usa la sola
etichetta come chiave. `_nodo_speaker[etichetta]` (`compilatore.py:1101` e
seguenti) conserva solo l'ultimo personaggio che vi ha parlato, quindi il
controllo «chi parla a questo nodo» non vede il conflitto. Le opzioni
(`Al nodo "x" l'opzione …`) non nominano nemmeno il personaggio.

**Impatto.** In una storia con più personaggi, o con moduli presi da altri, i
dialoghi si corrompono senza segnali. Il manuale non avverte che le etichette
devono essere uniche in tutta la storia.

**Correzione.** Il minimo è un **errore** quando un'etichetta ha due
personaggi. Meglio ancora dare ai nodi un campo per personaggio: la chiave
diventa `(personaggio, etichetta)`, e un'opzione appartiene al personaggio che
possiede il nodo. Per i nodi già unici non cambia nulla.

---

### GS-4 — «Il giocatore ha» non guarda nello zaino, e la capienza si aggira con un contenitore ✅

**Cosa.** Se la chiave è dentro lo zaino che il giocatore porta,
`se il giocatore ha la chiave` risulta **falso**. Inoltre con
`Il giocatore può portare 1 oggetti.` basta mettere tutto in uno zaino-contenitore
per portare una quantità illimitata di oggetti.

```
> prendi chiave → metti chiave nello zaino → prendi zaino
> nord          → Serve la chiave.          ← la chiave è nello zaino, in mano
> metti mela nello zaino → Hai messo La mela in Lo zaino.   (capienza 1/1)
```

**Perché.** `CondizionePossesso.valuta` controlla solo `id in mondo.inventario`
(`strutture.py:99`). `capacita_attuale` conta solo gli oggetti diretti
dell'inventario.

**Impatto.** Con un contenitore portatile, gli enigmi che dipendono dal possesso
diventano irrisolvibili agli occhi del giocatore. La capienza, introdotta al
Livello 7 e irrobustita nella 1.1.0, perde senso non appena esiste uno zaino
contenitore.

**Correzione.** Il possesso deve valere per la chiusura transitiva
dell'inventario (inventario → contenuto dei contenitori portati → …). La
capienza deve contare anche gli oggetti annidati, oppure i contenitori devono
avere una capienza propria (`Lo zaino contiene al massimo 5 oggetti.`).

---

## 3. Criticità gravi

### G-1 — Parole chiave che spezzano gli aggettivi ✅

**Cosa.** Alcune proprietà molto comuni non compilano, e l'errore indica la
parte sbagliata della frase:

| Frase | Esito |
|---|---|
| `La padella è unta.` | «Entità sconosciuta: «ta»» |
| `La moneta è unica.` / `… è unita.` | «Entità sconosciuta: «ica»» / «ita» |
| `Il livello è unico.` | idem |
| `… se il livello è alto: …` (stato) | «Entità sconosciuta: «to»» |
| `… se il livello è allegro / allarme / cometa / menomato: …` | idem |

Su 80 aggettivi provati in sei contesti (dichiarazione, condizione e conseguenza,
per oggetti e per stati), cadono sistematicamente quelli che iniziano con
**`un`** (quattro contesti su sei: tutti quelli sugli oggetti e la dichiarazione
degli stati) e, nelle condizioni sugli stati, quelli che iniziano con **`al`**.
Altre sonde mostrano lo stesso difetto per **`come`** e **`meno`** (`cometa`,
`menomato`).

**Perché.** `PROPRIETA` ha priorità −1 (`compilatore.py:777`), le parole chiave
hanno priorità 0. Il lexer prova i terminali in ordine di priorità e non di
lunghezza, quindi `un` batte `unta`. È lo stesso difetto che la 0.28.0 aveva
risolto **solo** per `PREP_LUOGO` (`incisa` letto come `in` + `cisa`) mettendo un
confine destro nell'espressione regolare. Le altre parole chiave non hanno
ricevuto la stessa cura.

**Correzione.** Dare un confine di parola a tutte le parole chiave che possono
aprire un aggettivo (`un`, `una`, `uno`, `al`, `come`, `più`, `meno`, `in`, `e`
…), come si è già fatto per `PREP_LUOGO`. Aggiungere un test di regressione con
una lista di aggettivi italiani comuni moltiplicata per i sei contesti (la sonda
usata per questa analisi ne è un buon punto di partenza).

---

### G-2 — La diagnostica non è pensata per chi non programma ✅

Il pubblico dichiarato sono scrittori e game designer, ma gli errori di sintassi
parlano la lingua di Lark:

| Frase | Messaggio |
|---|---|
| `invece di prendi la mela: …` | `Mi aspettavo: E` |
| `… se Il giocatore ha la mela: …` | `Mi aspettavo: LPAR, VARIABILE, ENTITA, NON, __ANON_2, CÀPITA` |
| `Invece di esamina la mela: e adesso …` | `Mi aspettavo: VARIABILE, PERDI, DIMINUISCI, __ANON_2, VINCI, DIRE, …` |
| `La luce è una cosa.` + `La luce è uno stato.` | `Mi aspettavo: PROPRIETA, UN, PREP_LUOGO, UNA` |
| `La mela è rossa!` | nessun suggerimento |

Ci sono inoltre tre problemi strutturali:

- **L'euristica «Entità sconosciuta» scatta su qualunque parola imprevista.** Ne
  escono diagnosi sbagliate: `La mela è molto rossa.` → «rossa non è mai stata
  dichiarata»; `Il giardino è un luogo.` → «giardino non è mai stato
  dichiarato»; `Il giocatore può portare tre oggetti.` → «tre non è mai stata
  dichiarata. Dichiarala: «tre è una cosa.»».
- **Si vede un errore alla volta.** Il parser LALR si ferma al primo e non
  riprende, quindi dieci refusi significano dieci compilazioni.
- **Le parole chiave distinguono maiuscole e minuscole, in modo incoerente.**
  Nelle dichiarazioni servono `Invece`, `La descrizione`, `Il giocatore`,
  `Il posto`, `Al turno`, `Ogni`, `Quando`; nelle condizioni invece `il
  giocatore` va in minuscolo. I nomi delle entità, al contrario, sono
  insensibili al maiuscolo. Una frase che comincia a metà riga o una maiuscola
  dimenticata producono un errore criptico.

**Correzione.** Tradurre i nomi dei terminali in italiano leggibile
(`DOT` → «il punto finale», `PROPRIETA` → «una proprietà (una parola sola)»,
`__ANON_2` → «il giocatore» …). Riservare la diagnosi «entità sconosciuta» ai
punti in cui la grammatica si aspettava davvero un `ENTITA`. Rendere le parole
chiave insensibili al maiuscolo (i letterali Lark `"invece"i`). Recuperare dagli
errori saltando al punto successivo, per mostrarli tutti in una volta: il parser
interattivo di Lark lo permette.

---

### G-3 — Un solo spazio di nomi e fusioni silenziose ✅

Il modello del mondo non protegge le proprie invarianti:

| Situazione | Comportamento osservato |
|---|---|
| Stesso oggetto dichiarato due volte con due descrizioni (tipico di due moduli `Includi`) | vale l'ultima, nessun avviso |
| `Il punteggio parte da 5.` … `Il punteggio parte da 0.` | vale l'ultima, nessun avviso |
| `La mela è in cucina.` + `La mela è nel giardino.` | la mela **compare in cucina ma non si può prendere** («Non vedi nulla del genere qui»), nel giardino sì. Il mondo è incoerente e il compilatore tace |
| `La cucina è una stanza.` + `La cucina è una cosa.` | accettato: una cucina dentro la cucina |
| Refuso in `La cucina collega nord a il giardno.` | crea una **stanza nuova** «giardno»; l'unico avviso riguarda il vero giardino, che risulta irraggiungibile |
| `Il pozzo collega sud a la mela.` | la mela diventa **anche** una stanza |
| `Il posto è una cosa.` | accettato, ma rompe **ogni altra** frase `Il posto di …` con un errore criptico. La spec (§18) dichiara `posto` riservata, ma la regola non è applicata |
| Entità chiamate `giocatore`, `nulla`, `inventario`, `dialogo`, `e` | accettate senza avvisi |
| Stessa parola come oggetto e come stato | errore di sintassi incomprensibile (vedi G-2) |

**Perché.** `valida_nomi_dichiarati` (`compilatore.py:2372`) controlla solo i
caratteri e non `PAROLE_RISERVATE`. `_applica_posizione` scrive in
`stanza.oggetti` senza togliere l'oggetto dalla posizione precedente. Le
dichiarazioni si fondono per nome. Lo scanner tratta ogni nome che compare in
`collega` come una stanza.

**Correzione.** Per ogni entità tenere una sola posizione iniziale, e dare errore
su posizioni o valori iniziali contraddittori. Dare errore su una stanza e un
oggetto con lo stesso nome, su un'entità e uno stato con lo stesso nome, e su un
nome riservato usato da solo. Dare un avviso quando `collega` introduce una
stanza mai dichiarata con `è una stanza`. Rendere visibile la fusione fra moduli
(«la chiave è dichiarata in A.fav:12 e in B.fav:3»).

---

### G-4 — La libreria dei verbi non è coerente col modello del mondo ✅

Il modello del mondo conosce contenitori aperti e chiusi, luci accese e spente,
porte chiuse. La libreria non sa **aprire, chiudere, accendere o spegnere**
niente.

```
> apri la porta     → Con cosa vuoi usarlo?
> mangia la mela    → Con cosa vuoi usarlo?
> apri la cassa     → Con cosa vuoi usarlo?      (la cassa è un contenitore chiuso)
> chiudi la cassa   → Non capisco questo verbo.
```

Mancano del tutto (risposta «Non capisco questo verbo.»): `chiudi`, `accendi`,
`spegni`, `aspetta`/`z`, `x` (esamina), `l` (guarda), `entra`, `esci` (come
movimento), `sali`, `scendi`, `tocca`, `dai`, `mostra`, `indossa`, `bevi`,
`spingi`, `tira`, e le direzioni `nordest`, `nordovest`, `sudest`, `sudovest`.

- **Su e giù non si possono dichiarare.** `Su e giù sono direzioni opposte.` è
  rifiutata perché `su` è una parola riservata (preposizione d'azione).
  L'autore deve ripiegare su `sopra`/`sotto` o `alto`/`basso`.
- **La libreria standard non risolve il problema.** `verbi.fav` dichiara
  `accendi` e `spegni` come verbi personalizzati, ma **senza logica**: ogni torcia
  e ogni lampada richiedono comunque la propria regola.
- **Senza una regola, un contenitore chiuso resta chiuso per sempre.**

**Correzione.** Aggiungere logiche di default per aprire, chiudere, accendere,
spegnere e aspettare, collegate a `aperta`/`chiusa` e `accesa`/`spenta`, che
sono già opposte nel motore, e con messaggi accordati nel genere. Dividere
l'azione «usare». Aggiungere le abbreviazioni classiche, le direzioni
intercardinali, `su`/`giù` (come forme di direzione, fuori dal contesto della
preposizione) e `entra`/`esci` come movimenti.

---

### G-5 — Il tempo scorre anche sui comandi non capiti ✅

Ogni comando fa avanzare il turno, compresi `Non capisco questo verbo.`,
`Non vedo 'x' qui.` e le richieste di disambiguazione. Scattano quindi eventi a
tempo, demoni, movimenti casuali dei personaggi ed estrazioni `càpita`.

```
> chiudi la cassa  [turno 5] → Non capisco questo verbo.
> aspetta          [turno 7] → Non capisco questo verbo.
```

In un gioco di sopravvivenza come *Il Viaggiatore* un refuso costa una sorsata
d'acqua: 36 `inventario` di fila bastano a morire di sete. Che `inventario`
consumi un turno è una convenzione accettata; che lo faccia un **errore del
parser** no, e Inform non lo fa. Paradossalmente, visto che manca `aspetta`,
l'unico modo di far passare il tempo è sbagliare un comando.

**Correzione.** `_esegui_comando` deve dire se il turno è stato consumato davvero.
I fallimenti del parser (verbo ignoto, oggetto non visibile, ambiguità) non
devono registrare l'istantanea né far avanzare il tempo.

---

### G-6 — Nessuna condizione sulla posizione di oggetti e personaggi ✅

Si può chiedere dove sta il **giocatore** (`se il giocatore è in cucina`), ma non
dove sta **qualunque altra cosa**:

```
Invece di esamina la guardia se la guardia è in cucina: …   → errore di sintassi
```

Non esistono nemmeno «X è qui» (nella stanza del giocatore), «la chiave è nella
scatola» o «la mela è sul tavolo». La mancanza pesa perché dalla 0.25.0 i
personaggi si **muovono**, anche a caso (`il gatto cambia stanza`), e l'autore
non ha modo di sapere dove siano finiti, se non tenendo a mano uno stato
parallelo aggiornato a ogni mossa.

**Correzione.** Aggiungere `cond_posizione_oggetto`:
`ENTITA _copula PREP_LUOGO ENTITA` e la sua negazione, più la forma
`ENTITA _copula "qui"`. Dopo `ENTITA è` il lookahead `PREP_LUOGO` è già
disgiunto da `PROPRIETA`, e la stessa sequenza esiste già come conseguenza. Il
conflitto LALR è quindi improbabile, ma va confermato dalla guardia Earley.

---

### G-7 — Comandi a due oggetti senza «a» e «da» ✅

Il parser del giocatore divide il comando sulla prima preposizione della lista
`su/sul/…/con/contro/in/nel/…` (`gioco.py:118`). Ne restano fuori
`a/al/alla/allo/ai/agli/alle`, `da/dal/dalla/…`, `sopra`, `sotto`, `dentro`,
`dietro`.

```
> dai la mela alla guardia      → Non vedo 'la mela alla guardia' qui.
> prendi la mela dal tavolo     → Non vedo 'la mela dal tavolo' qui.
> metti la mela sopra il tavolo → Non vedo 'la mela sopra il tavolo' qui.
> dai la mela con la guardia    → La guardia ringrazia.     ← unica forma che funziona
```

Lo stesso vale lato autore: `Invece di dai la mela alla guardia` non compila.
**Dare o mostrare un oggetto a un personaggio**, un gesto classico della
narrativa interattiva, si può scrivere solo in un italiano sgrammaticato.

**Correzione.** Aggiungere a `PREP_AZIONE` e a `PREPOSIZIONI`, in modo
simmetrico, le preposizioni di termine e di provenienza e quelle locative
improprie. Separare poi la preposizione «di ruolo» (a chi, da dove) da quella
«di luogo» (in, su).

---

### G-8 — Sessione: «esci» chiude il gioco, e dopo la fine non si torna indietro ✅

- **`esci` termina il programma subito e senza conferma** (`gioco.py:289`), anche
  quando la storia ha una direzione `fuori`. In italiano «esci» si usa di
  continuo per uscire da un luogo, e la partita non salvata va persa.
- **A partita finita** (`vinci`/`perdi`/`termina`) `elabora_comando` restituisce
  `False` a qualunque comando (`gioco.py:281`): nessun `annulla` dopo la morte,
  nessun `ricomincia`, nessun `carica`. Il motore non ha affatto un comando
  RICOMINCIA: per rigiocare bisogna rilanciare il programma.

**Correzione.** Chiudere il gioco con `fine`/`basta` e chiedere conferma, e
lasciare che `esci` sia un movimento quando esiste un'uscita adatta. Dopo la
fine della partita, offrire «ANNULLA, RICOMINCIA, CARICA o FINE?». Aggiungere
`ricomincia`, che riparte da `_stato_iniziale`, già disponibile dalla 1.2.0.

---

### G-9 — «Quando» scatta al primo turno se la condizione è già vera in partenza ✅

```
Il giocatore comincia in cucina.
Quando il giocatore è in cucina: dire "[DEMONE] Sei in cucina!".
```
```
> guarda   → … [DEMONE] Sei in cucina!        ← falso fronte al turno 1
```

**Perché.** Il valore di partenza di `era_vera` si calcola alla fine di
`valida_post` (`compilatore.py:2088`), **prima** di `imposta_posizione_iniziale`,
quando `posizione_giocatore` vale ancora `None`. Ne segue che ogni `Quando` che
dipende dalla posizione del giocatore e che è vero all'avvio scatta al primo
turno. La spec, al §6, dice esattamente il contrario: «una condizione già vera
alla partenza non produce un fronte».

**Correzione.** Calcolare il valore di partenza dentro
`imposta_posizione_iniziale`, dopo aver collocato il giocatore.

---

## 4. Criticità medie

**M-1 — `e adesso` è vietato sulla prima conseguenza ✅.**
`Invece di esamina la mela: e adesso la mela è rossa.` non compila; bisogna
scrivere `…: la mela è rossa.`. Dopo `dire "…"` invece `e adesso` è
obbligatorio. È un'asimmetria di `_esito_temporale` (`compilatore.py:470`) che
va contro l'idioma insegnato ovunque. Accettare un `"e"? "adesso"?` iniziale non
crea conflitti.

**M-2 — Le proprietà si aggiungono ma non si tolgono ✅.**
`e adesso il panno è asciutto` lascia il panno anche `bagnato`, a meno che la
coppia non sia stata dichiarata opposta (le coppie predefinite sono solo
`aperta`/`chiusa` e `accesa`/`spenta`). La condizione vince poi la prima regola
scritta: si arriva a stati contraddittori senza avvisi. Manca una forma per
togliere una proprietà (`e adesso il panno non è più bagnato`). Inoltre
`prendibile` è un campo booleano e non una proprietà: `se la mela è prendibile`
è **sempre falsa** e il linter lo segnala come refuso.

**M-3 — Il linter segnala il falso e tace il vero ✅.**
- Una proprietà assegnata da un **evento, un demone o un'opzione di dialogo**
  viene segnalata come «mai assegnata… resterà sempre falsa», perché il
  controllo GG2 (`compilatore.py:1977`) guarda solo le conseguenze delle regole.
  L'avviso è sbagliato, e la condizione in realtà funziona.
- I segnaposto `[x]` vengono controllati in descrizioni, posti, regole ed eventi,
  ma **non** nelle risposte dei demoni né nei testi di `vinci`/`perdi`: un
  `[refuso]` in quei testi compila senza avvisi e resta letterale in partita.
- Il «superflua» di GS-1 spinge l'autore a togliere la dichiarazione che lo
  protegge.
- Le criticità gravissime (sinonimi, `guarda X`, nodi duplicati) non producono
  alcun avviso.

**M-4 — L'italiano che scrive il motore ✅.**
Il nome visualizzato conserva l'articolo maiuscolo della dichiarazione, perché
ogni dichiarazione inizia una frase. A metà frase escono quindi «Preso: La
chiave.», «Lasciato: Lo zaino.», «Hai messo La chiave in Lo zaino.» (invece di
«nello zaino»), «Hai messo La mela su Il tavolo.», e l'interpolazione `[mela
rossa]` diventa «c'è La mela rossa». I messaggi non concordano col genere
(«Non puoi prenderlo.» per una moneta). La disambiguazione elenca gli **id
interni** («Quale intendi di preciso? (chiave rossa, chiave blu)»). Per un
linguaggio il cui motto è «l'italiano è il linguaggio di programmazione», sono
errori che si vedono in ogni partita. Il README mostra «Preso: chiave
arrugginita.», ma non è ciò che il motore stampa oggi.

**M-5 — Il parser del giocatore ✅.**
- Nessun `tutto` e nessun elenco di oggetti (`prendi la chiave e la torcia`).
- La disambiguazione non ha seguito: rispondere `rossa` dà «Non capisco questo
  verbo.».
- L'oggetto si cerca **per sottostringa**, per cui `prendi a` propone quattro
  oggetti e `prendi ave` trova le chiavi.
- I nomi che contengono una preposizione (`la tazza con il manico`, `l'uomo in
  nero`) funzionano **per caso**: il comando viene spezzato su `con`/`in` ed
  entrambe le metà ritrovano lo stesso oggetto per sottostringa. Basta un
  secondo oggetto con «manico» nel nome perché smetta di funzionare.
- Del contenuto di supporti e contenitori aperti la stanza non dice nulla («Puoi
  vedere qui: un tavolo»); la mela appoggiata si scopre solo esaminando il
  tavolo.

**M-6 — Testo e presentazione ✅.**
- `\n` nelle stringhe diventa una semplice `n`, perché l'escape toglie il
  backslash da qualunque carattere (`compilatore.py:1019`).
- Non si possono scrivere parentesi quadre letterali: ogni `[…]` è un
  segnaposto.
- L'interpolazione copre solo stati, contatori e nomi di oggetti: niente
  `[turno]`, niente stanza corrente, niente maiuscola iniziale di un valore di
  stato, niente testo condizionale dentro la frase
  (`"[se la porta è aperta]…[altrimenti]…[fine]"`).
- **Non esiste un prologo, né titolo, autore o metadati**: `Al turno 0` viene
  ignorato e `Al turno 1` scatta dopo il primo comando. L'intestazione «---
  BENVENUTO IN FAVELLA 1 ---» e tutti i messaggi della libreria non sono
  personalizzabili.

**M-7 — Numeri e tempo ✅.**
- Niente letterali negativi (`parte da -3` non compila), benché
  `diminuisci` porti tranquillamente un contatore sotto zero.
- Niente moltiplicazione, divisione, resto, minimo o massimo, niente limiti a un
  intervallo («fra 0 e 10»).
- Il numero del turno non si legge né nelle condizioni né nei testi.
- Gli eventi sono solo **assoluti** (`Al turno N`, `Ogni N turni` contati
  dall'inizio): un timer che parte da un fatto («tre turni dopo aver innescato
  la miccia») richiede un contatore e un demone.

**M-8 — Topologia statica e oggetti di scena 📖✅.**
- Le uscite non cambiano durante la partita: nessuna conseguenza apre un
  passaggio o lo richiude. Una porta si simula con regole su `vai nord`.
- La riga «Uscite:» elenca **i nomi delle stanze di destinazione**, anche di
  quelle mai visitate: una stanza segreta collegata si rivela da sola.
- Non esistono porte come oggetti visibili dai due lati, né oggetti presenti in
  più luoghi (cielo, mare, muri), né un modo pulito per avere oggetti **di
  scena** da esaminare senza che finiscano in «Puoi vedere qui». Il trucco
  `Il posto della finestra è "".` funziona, ma lascia una riga vuota.

**M-9 — Un solo tipo di regola 📖.**
C'è solo `Invece di`, che sostituisce sempre l'azione:

- non esistono regole «prima» e «dopo»;
- non si può proseguire con l'azione di default;
- non c'è un `altrimenti`;
- non esistono regole per categorie di oggetti.

Per aggiungere una frase alla presa di un oggetto bisogna **riscrivere** la
presa (`e adesso X è in inventario`), perdendo il controllo della capienza, del
buio e il messaggio «Preso». Il numero di regole cresce come oggetti × verbi.

**M-10 — Personaggi 📖.**
Un personaggio non può tenere oggetti (non è un contenitore e non ha un
inventario) e non compie azioni sugli oggetti. Il dialogo è solo a menù, senza
«chiedi a X di Y» o «parla di Y». Le etichette dei nodi sono globali (GS-3).

**M-11 — Moduli (`Includi`) 📖.**
- Non c'è un percorso di ricerca per la libreria standard: chi l'ha installata
  con pip deve copiarne i moduli accanto alla storia.
- Non ci sono spazi di nomi (G-3), e nulla indica ciò che un modulo aggiunge o
  ridefinisce.
- La prima stanza dichiarata diventa quella di partenza se manca `Il giocatore
  comincia`, per cui l'ordine degli `Includi` può spostare l'inizio del gioco.

---

## 5. Criticità lievi

- **L-1 Numero grammaticale nelle frasi fisse ✅.** `Il giocatore può portare 1
  oggetto.` e `Lo zaino dà 1 spazio.` non compilano: sono richiesti «oggetti» e
  «spazi». I numeri scritti in lettere non sono accettati.
- **L-2 Concordanza per radice imperfetta 📖.** `radice_proprieta` toglie
  l'ultima vocale, per cui `bianco`/`bianca` (radice «bianc») non concorda con
  `bianchi`/`bianche` («bianch»), né `vecchio` con `vecchi`. Il problema tocca
  tutti i plurali in -chi/-ghi/-che/-ghe e le parole in -io.
- **L-3 Comandi di servizio invadenti 📖.** Se l'autore non li dichiara,
  `salva`, `carica` e `ripristina` sono intercettati anche in frasi come
  «ripristina il generatore» o «carica il carro», che finiscono per caricare un
  salvataggio chiamato «il-generatore».
- **L-4 Il valore di partenza dei demoni consuma il caso 📖.** Calcolato a fine
  compilazione, avanza `mondo.rng` se la condizione contiene `càpita`.
- **L-5 Istantanee pesanti 📖✅.** `cattura_stato` copia a fondo **tutto** il
  mondo, regole e descrizioni comprese, anche se non cambiano mai. Sul
  Viaggiatore ogni istantanea pesa circa 96 KiB e un turno circa 1,5 ms: per ora
  non è un problema, ma cresce con la storia.
- **L-6 Salvataggi legati alla forma del mondo 📖.** L'impronta iniziale include
  oggetti, variabili e posizioni. Una patch che aggiunge un oggetto invalida
  tutti i salvataggi dei giocatori; correggere un refuso in una descrizione
  invece no.
- **L-7 Architettura 📖.**
  - `compilatore.py` (4.690 righe) tiene insieme compilatore, analisi per l'IDE,
    formattatore, serializzatore e esportazione HTML.
  - Il motore scrive con `print()` e non ha un'astrazione dell'uscita: IDE,
    sito e playground devono dirottare `stdout`, e i messaggi non si possono
    tradurre né stilizzare.
  - Il motore è copiato a mano in `landingpage/public/favella-engine/engine/`.
    Oggi le copie sono identiche, ma nessun controllo automatico lo garantisce.
- **L-8 Documentazione non allineata ✅.**
  - Il README dice «coperto da 681 test» in un punto e 735 asserzioni altrove,
    e il manuale ha 84 pagine in un punto e 86 in un altro; mostra inoltre
    «Preso: chiave arrugginita.».
  - La spec §10 dice che il buio «è statico», cosa superata dalla 0.33.0.
  - La spec §18 dichiara `posto` riservata, ma la regola non è applicata.
  - La spec §6 promette un comportamento di partenza dei demoni che il codice
    non rispetta (G-9).
  - Il manuale (cap. 10) presenta come necessario il sinonimo che il compilatore
    chiama superfluo.
- **L-9 `o` non vale come «oppure»** (quirk noto G4, perché `o` sta per ovest).
  L'errore che ne esce è criptico: `Mi aspettavo: CHIUDE, DIVENTA, RPAR, …`.

---

## 6. Limitazioni strutturali (scelte di progetto)

Non sono difetti: sono scelte dichiarate. Vanno però pesate, perché definiscono
fin dove può arrivare il linguaggio.

| Limite | Conseguenza pratica |
|---|---|
| **Mondo chiuso**: ogni nome va dichiarato prima di usarlo, e a runtime non nascono oggetti nuovi (4c rimandata) | Gli oggetti «generati» (una fetta di pane, una freccia) vanno dichiarati in anticipo e tenuti nel «nulla» |
| **Niente tipi né modelli** (Tema 5b sconsigliato) | Dieci guardie significano dieci blocchi di frasi identiche |
| **Niente quantità o plurali** (Tema 5a NO-GO) | «3 frecce» è un contatore staccato dall'oggetto «le frecce» |
| **Stati e contatori solo globali** | «La vita del lich» è una variabile globale col nome composto; non esistono attributi numerici degli oggetti |
| **Proprietà di una parola** | Niente «chiusa a chiave», «mezza vuota» |
| **Un fatto per frase, nome intero ogni volta** | Niente pronomi nel sorgente («La mela è rossa. È in cucina.»), quindi molte ripetizioni con i nomi lunghi |
| **Solo italiano, con parole chiave fisse** | L'internazionalizzazione è in roadmap ma non è progettata; le parole chiave sono sparse nel codice della grammatica |
| **Un solo protagonista, un solo punto di vista** | Niente cambio di personaggio giocante |
| **Regole solo su verbo + oggetto dichiarato** | Niente regole per stanza o per contesto («in cucina, `annusa` fa…») se non con condizioni ripetute |

---

## 7. Implementazioni non effettuate

| Voce | Stato | Fonte |
|---|---|---|
| 4c — creazione di oggetti a runtime | pesata e rimandata | spec, nota v0.33.0 |
| 5a — quantità e plurali | NO-GO | spec §17, `espansione-oltre-0.29.md` |
| 5b — modelli e tipi di entità | sconsigliato | idem |
| 1c — scala ordinata di stati («sali di una marcia») | scartato | spec §14 |
| A2 — diagnosi del punto dentro le virgolette | rimandato | spec §13 |
| Internazionalizzazione | in roadmap, non progettata | README |
| Favella Studio | esperimento fermo alla 0.9.x; il ritorno dall'IDE al sorgente perde battute condizionali e opzioni avanzate | README, spec §16 |
| RICOMINCIA, ANNULLA dopo la fine | assenti | G-8 |
| Aprire, chiudere, accendere, spegnere, aspettare con logica propria | assenti | G-4 |
| `tutto`, più oggetti, domanda di disambiguazione | assenti | M-5 |
| Porte, oggetti di scena, oggetti in più luoghi, uscite dinamiche o nascoste | assenti | M-8 |
| Titolo, autore, prologo, IFID, riga di stato | assenti | M-6 |
| Messaggi della libreria personalizzabili | assenti | M-6 |
| Regole «prima» e «dopo», prosecuzione dell'azione | assenti | M-9 |
| Inventario dei personaggi, dialogo a tema | assenti | M-10 |

---

## 8. Possibili evoluzioni

Le proposte sono ordinate per **valore/rischio**. La compatibilità segue la regola
della casa («dopo la 1.0 si cresce solo aggiungendo»); dove una correzione
**cambia** un comportamento, la tabella lo dice.

### 8.1 Patch di correttezza (1.2.2): difetti, nessuna frase nuova

| # | Intervento | Dove | Compatibilità | Sforzo |
|---|---|---|---|---|
| 1 | Regole confrontate per **azione** e non per parola; «superflua» diventa un'informazione e non un invito a cancellare (GS-1) | `def_regola`, `gioco._esegui_comando`, `def_sinonimo` | Cambia il comportamento **nel senso voluto dall'autore**: le regole su `prendi` intercettano anche `raccogli`/`afferra` | S |
| 2 | `guarda X`/`osserva X` = esamina; test «nessun verbo in due azioni» (GS-2) | `libreria_azioni`, `carica_azioni` | Rende vive regole finora morte | S |
| 3 | Errore su un nodo di dialogo con due personaggi (GS-3) | `valida_post` | Solo le storie già corrotte smettono di compilare | S |
| 4 | Possesso transitivo e capienza con gli oggetti annidati (GS-4) | `CondizionePossesso`, `capacita_attuale` | Cambia l'esito solo con contenitori portati | S |
| 5 | Confine di parola sulle parole chiave (G-1) + test su una lista di aggettivi | `_GRAMMAR_TEMPLATE` | Solo aggiunte: compilano frasi prima rifiutate | S–M |
| 6 | Valore di partenza dei demoni `Quando` dopo aver collocato il giocatore (G-9) | `imposta_posizione_iniziale` | Allinea il codice alla spec §6 | S |
| 7 | I fallimenti del parser non consumano turni (G-5) | `elabora_comando` | Cambia il ritmo delle storie a tempo, **a favore** del giocatore | S |
| 8 | `esci` con conferma o come movimento; RICOMINCIA; ANNULLA e CARICA dopo la fine (G-8) | `gioco.py` | Solo aggiunte | S |
| 9 | Invarianti del mondo: posizione unica, nomi riservati, collisioni fra entità, stati e stanze, avviso sulle stanze nate da `collega` (G-3) | `valida_post`, `valida_nomi_dichiarati` | Nuovi errori solo su storie già incoerenti | M |
| 10 | Linter: proprietà assegnate da eventi, demoni e opzioni; segnaposto in tutti i testi (M-3) | `valida_post` | Meno falsi avvisi | S |
| 11 | `\n` e `\[` come escape veri nei testi (M-6) | `TESTO_QUOTATO`, `rendi_testo` | `\n` oggi produce una «n»: difficile che qualcuno ci conti | S |

### 8.2 1.3 — «Il parser che capisce» (lato giocatore)

- **Libreria di verbi con semantica** (G-4): aprire e chiudere contenitori e porte,
  accendere e spegnere le fonti `illumina`, aspettare (`z`), `x`/`l`, le
  direzioni intercardinali, `su`/`giù`, `entra`/`esci`; poi indossare e togliere,
  mangiare e bere con una proprietà `commestibile`.
- **Preposizioni complete** (G-7): `a/da` e le loro forme articolate,
  `sopra/sotto/dentro/dietro`, e da lì `dai X a Y` e `mostra X a Y`.
- **Disambiguazione vera** (M-5): una domanda con i nomi visualizzati e una
  risposta breve («la rossa»), confronto per parole intere invece che per
  sottostringa, `tutto` ed elenchi con «e».
- **Output in italiano corretto** (M-4): nomi con l'articolo in minuscolo a metà
  frase, preposizioni articolate («nello zaino»), messaggi accordati nel genere.
- **Messaggi della libreria personalizzabili**: una frase del tipo
  `Il messaggio «non capisco» è "Eh?".`.

### 8.3 1.4 — «Il mondo che si sa descrivere» (lato autore)

Ogni punto richiede nuova grammatica, da confermare con la guardia LALR/Earley.

- **Condizioni di posizione per ogni entità** (G-6): `se la guardia è nel
  corridoio`, `se la chiave è qui`, `se la mela è sul tavolo`.
- **Stanze visitate**: `se la cripta è visitata`, e una descrizione alla prima
  visita (`La prima descrizione della cripta è "…".`).
- **Togliere una proprietà** (M-2): `e adesso il panno non è più bagnato.`.
  Accettare anche `e adesso` sulla prima conseguenza (M-1).
- **Regole «Dopo di»** (M-9): `Dopo di prendi la mela: dire "È fresca.".` —
  l'azione di default avviene e poi si aggiunge il testo. Da sola eliminerebbe
  buona parte delle regole che riscrivono la presa.
- **Uscite dinamiche e nascoste** (M-8): `e adesso la cucina collega nord a la
  cantina.`, `e adesso l'uscita nord della cucina è chiusa.`, e una frase per
  nascondere dall'elenco le uscite non ancora scoperte.
- **Oggetti di scena**: `La finestra è di scena.` — si può esaminare, non
  compare nell'elenco e non si può prendere.
- **Testo condizionale inline e prologo**: `"[se …]…[altrimenti]…[fine]"`,
  `[turno]`, e poi `Il titolo è "…".`, `L'autore è "…".`, `Il prologo è "…".`.
- **Timer relativi** (M-7): `Fra 3 turni: …` come conseguenza (un evento armato
  da una regola); letterali negativi; `moltiplica`/`dividi`; limiti a un
  intervallo (`la vita resta fra 0 e 10`).
- **Nodi di dialogo per personaggio** (GS-3, versione completa) e **inventario dei
  personaggi** (`La guardia ha la chiave.`, `se la guardia ha la chiave`).

### 8.4 Ecosistema e architettura

- **Diagnostica** (G-2): nomi dei terminali in italiano, recupero dagli errori
  (tutti gli errori in una compilazione), parole chiave insensibili al maiuscolo,
  e «forse intendevi» anche per le parole chiave (`invece` → `Invece`).
- **Uscita del motore come flusso di eventi** (titolo di stanza, testo, messaggio
  di sistema, fine partita) invece di `print()`. Ne guadagnerebbero IDE e sito
  (niente più dirottamento di `stdout`), la traduzione e lo stile.
- **Dividere `compilatore.py`** in nucleo (grammatica, transformer, validazione)
  e strumenti (IDE, formattatore, esportazione).
- **`Includi` con un percorso di ricerca per la libreria standard**
  (`Includi la libreria "verbi".`) e un resoconto delle ridefinizioni fra moduli.
- **Un controllo in CI** che confronti le copie del motore in `landingpage/` con
  la radice.
- **Collaudo dinamico più avversario**: dare all'esploratore i sinonimi di
  libreria e `guarda X`, e confrontare l'esito di verbi equivalenti sullo stesso
  oggetto. Avrebbe trovato GS-1 e GS-2 da solo.
- **Un server LSP**: completamento dei nomi dichiarati e diagnostica in tempo
  reale in qualunque editor, riusando `analizza_file_strutturato`.

### 8.5 Test di regressione suggeriti

Uno per criticità, ricavati dalle sonde di questa analisi:

1. `raccogli`/`afferra`/`prendere` X intercettati da `Invece di prendi X`.
2. `guarda X` → descrizione di X; `Invece di guarda X` scatta.
3. Stessa etichetta di nodo per due personaggi → errore.
4. Chiave in uno zaino portato → `il giocatore ha la chiave` è vera; capienza con
   annidamento.
5. Proprietà `unta`, `unica`, `unito`, e `alto`/`allegro` nelle condizioni sugli
   stati: compilano.
6. `Quando il giocatore è in <partenza>` non scatta al turno 1.
7. `Non capisco questo verbo.` non fa avanzare `turno_corrente`.
8. Un oggetto collocato in due stanze → errore.

---

## Appendice — Riepilogo

| ID | Gravità | Titolo | Verifica |
|---|---|---|---|
| GS-1 | Gravissima | Regole agganciate alla parola, non all'azione | ✅ (anche sulla demo *Relitto*) |
| GS-2 | Gravissima | `guarda X` / `osserva X` ignorano l'oggetto; regole morte | ✅ |
| GS-3 | Gravissima | Nodi di dialogo globali: personaggi fusi | ✅ |
| GS-4 | Gravissima | Possesso non transitivo; capienza aggirabile | ✅ |
| G-1 | Grave | Parole chiave che spezzano gli aggettivi (`un-`, `al-`) | ✅ |
| G-2 | Grave | Diagnostica per addetti ai lavori; un errore alla volta; maiuscole | ✅ |
| G-3 | Grave | Spazio di nomi unico, fusioni e incoerenze silenziose | ✅ |
| G-4 | Grave | Libreria di verbi senza aprire, chiudere, accendere, aspettare; niente su/giù | ✅ |
| G-5 | Grave | Gli errori del parser consumano turni | ✅ |
| G-6 | Grave | Nessuna condizione sulla posizione di oggetti e personaggi | ✅ |
| G-7 | Grave | Niente «a/da» nei comandi a due oggetti | ✅ |
| G-8 | Grave | `esci` senza conferma; niente annulla o ricomincia dopo la fine | ✅ |
| G-9 | Grave | `Quando` scatta al turno 1 se la condizione è vera all'avvio | ✅ |
| M-1…M-11 | Media | Asimmetrie, limiti espressivi, output, parser, moduli | ✅/📖 |
| L-1…L-9 | Lieve | Concordanze, prestazioni, architettura, documentazione | ✅/📖 |
