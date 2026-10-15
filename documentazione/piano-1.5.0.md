# FAVELLA 1.5.0 — Il piano

Versione 1, 15 ottobre 2026. Motore di partenza: 1.4.4 (test: 1180 passati e 0 falliti, collaudo 50).

La 1.5.0 raccoglie in una versione sola tre cose:

1. le correzioni e le frasi nuove venute dal remake de «Il Relitto Silente», così come le ha verificate il
   rapporto `05b-verifica-delle-lezioni.md` (nella cartella del Relitto, `progettazione/`);
2. le idee di evoluzione rimaste aperte nella documentazione di lavoro di FAVELLA (§7);
3. il rilascio: GitHub, PyPI, favella.eu, e un documento per chi lavora al Relitto.

Si chiama 1.5.0 e non 1.4.5 perché aggiunge frasi nuove al linguaggio.

## Le regole del lavoro

- **Compatibilità.** Le frasi valide nella 1.4 restano valide e significano la stessa cosa. Il testo che
  il motore scrive per le storie esistenti non cambia, salvo le correzioni dichiarate qui e nella specifica.
- **Grammatica.** Resta LALR(1) senza ambiguità. Ogni frase nuova entra nella guardia della suite.
- **Prove.** Il cancello è `python test_linguaggio.py` più `python test_collaudo.py`. Ogni correzione e
  ogni frase nuova ha i suoi test. Le sonde del 05b si ripetono sul motore nuovo.
- **Storie ufficiali.** Le dieci storie ufficiali e Il Viaggiatore si giocano con il motore 1.4.4 e con il
  1.5.0, confrontando l'impronta e il testo a ogni comando. Il Viaggiatore è concluso: deve restare
  identico, comando per comando.
- **Copie del motore.** Sito (`landingpage/`) e Studio (`studio/`) hanno copie del motore: restano
  identiche alla radice (un test lo controlla). L'editor di Studio deve reggere le frasi nuove.

---

## 1. Le decisioni che sono tue

Te le chiedo tutte insieme, una volta sola. Per ognuna dico che cosa consiglio.

> **Approvato da Simone il 15 ottobre 2026**, con le quattro scelte consigliate: le parole del §3 così
> come sono (C2 nella forma `La protezione è attiva quando …`); «per la prima volta» vale finché la regola
> non è scattata; il pacchetto D è il comportamento predefinito se le storie ufficiali restano identiche,
> altrimenti una frase d'autore; il pacchetto E e le idee lasciate fuori restano fuori.

1. **Le parole delle frasi nuove.** Sono scritte qui sotto, al §3, una per una. Consiglio di approvarle
   così; se una non ti piace, dimmi quale e come la vuoi.
2. **La regola di «per la prima volta».** Consiglio: «la prima volta che la regola scatta». È semplice e
   prevedibile. L'alternativa è «la prima volta che il giocatore fa quell'azione», anche se allora la
   regola non scattava (per esempio perché la sua condizione era falsa).
3. **I cambi di semantica del pacchetto D** (i demoni che guardano la fine del turno e la chiusura del
   dialogo). Consiglio: comportamento predefinito, se la prova sulle storie ufficiali non cambia niente;
   se cambia qualcosa (e Il Viaggiatore non può cambiare), una frase d'autore che lo accende.
4. **Il pacchetto E e le idee che propongo di lasciare fuori** (§8). Consiglio di lasciarli fuori dalla
   1.5.0.

---

## 2. Le correzioni (pacchetto A)

Non aggiungono frasi, tranne il marcatore `(voluto)` di L4. Colpiscono ogni autore, non solo il Relitto.

- **L18 — Il punto di partenza dei salvataggi.** La stanza di partenza entra fra le stanze viste prima
  che il motore fissi il punto da cui CARICA rigioca. Oggi, con «Le uscite nominano solo le stanze
  visitate», un salvataggio fatto dopo la prima stanza si carica dicendo che «la storia è cambiata», ed è
  falso. Correzione in `imposta_posizione_iniziale`.
- **L19 — Caricare segna come vista la stanza.** Dopo CARICA il motore rimostra la stanza senza
  cambiare la partita (niente stanza vista, niente pronomi). Oggi una stanza raggiunta in silenzio diventa
  vista solo nella partita caricata, e le impronte divergono.
- **N1 — Un'opzione di dialogo con `collega` non compila.** Lo scanner della prima passata salta le
  frasi che cominciano con «Al nodo». Oggi l'errore dice «nome non valido» e indica la riga 1.
- **N2 — `[se]` sbilanciati.** Un `[se]` senza `[fine]`, o un `[fine]` di troppo, è un errore di
  compilazione con la riga giusta. Oggi il giocatore legge pezzi di codice. (L'annidamento vero è al §3,
  C8.)
- **N3 — Uno stato letto solo dentro un `[se]`.** Il linter conta anche le condizioni dei testi. Oggi
  risulta «dichiarato ma mai usato».
- **L3 — Oggetti che entrano in inventario senza essere prendibili.** Avviso del linter: «X può finire in
  inventario (regola …) ma non è prendibile: se il giocatore lo lascia, non potrà riprenderlo». Non cambia
  nessuna storia.
- **L4 — Stati e contatori scritti e mai letti.** Il linter separa le letture (condizioni, segnaposto,
  testi condizionali, quantità, copie) dalle scritture, e avvisa per ciò che si scrive e non si legge mai.
  Per uno stato che legge solo l'interfaccia (il visore dell'aria nell'app), l'autore lo dice:
  `L'aria è un contatore (voluto).`, come per i sinonimi. L'avviso è nuovo; nessuna storia smette di
  compilare.

---

## 3. Il linguaggio nuovo (pacchetto C)

Ogni frase è additiva: chi non la scrive non vede differenze. Per ognuna: la forma, un esempio, il motivo.

**C1 — Il vincolo che ferma (L1).** Una regola `Prima di` che finisce con **`e basta`** ferma l'azione.
I vincoli si controllano prima di tutte le altre regole, nell'ordine in cui sono scritti, qualunque sia il
loro bersaglio (un oggetto, `qualcosa`, `qualcosa di P`, nessuno). Il turno passa, come per ogni regola che
scatta.

```
Prima di sintonizza qualcosa se la protezione è attiva: dire "PROTEZIONE VITALE." e basta.
Prima di vai nord se la porta è chiusa: dire "La porta non cede." e basta.
```

Motivo: oggi un divieto che vale per tutti gli oggetti va scritto una volta per oggetto, perché la regola
su un oggetto preciso vince sempre su quella per categoria. Nel Relitto, 44 regole diventano tre. `e
basta` vale solo nelle regole `Prima di`: altrove è un errore con un consiglio.

**C2 — Le condizioni con un nome (L17).** Uno **stato calcolato**: il motore ne ricava il valore da una
condizione, a ogni lettura.

```
La protezione è attiva quando l'aria è meno di 30 e la fuga è lontana.
Prima di ascolta qualcosa se la protezione è attiva: …
La descrizione del visore è "[se la protezione è attiva]ROSSO.[altrimenti]Verde.[fine]".
```

Si legge come ogni stato (`se la protezione è attiva`, `se la protezione non è attiva`, `[protezione]`),
anche nei demoni (`Quando la protezione è attiva: …`). Più frasi con valori diversi sono ammesse (`La
protezione è spenta quando …`): vale la prima vera. Assegnarlo è un errore («è uno stato calcolato»); un
ciclo fra stati calcolati è un errore. Motivo: nel Relitto la stessa soglia era scritta in due modi e
differiva di un punto (C10); «e la fuga è lontana» compare 46 volte.

*Alternativa*, se preferisci la forma del 05b: `Il rosso è quando l'aria è meno di 30.` e `se il rosso`.
La consiglio meno: la negazione verrebbe «se non il rosso», che in italiano vuol dire un'altra cosa.

**C3 — «per la prima volta» (L6).** Sulle regole, subito dopo il bersaglio; sui demoni `Quando`, dopo la
condizione.

```
Invece di prendi il disco per la prima volta: dire "Il disco è tiepido."; altrimenti: dire "Il disco."
Quando il giocatore è nella serra per la prima volta: dire "Un odore dolciastro."
```

Sulle regole vale finché la regola non è scattata una volta (vedi la decisione 2); con `altrimenti`, dalla
seconda volta vale il ramo `altrimenti`. Sui demoni vuol dire «una volta sola in tutta la partita». La
memoria sta nel mondo: entra in ANNULLA, nei salvataggi e nell'impronta (solo per le storie che la usano,
così le impronte delle altre non cambiano). Motivo: nel Relitto nove stati esistono solo per fare da
guardia, e dove la guardia mancava il testo della prima volta tornava ogni volta (C6).

**C4 — Spostare il giocatore, mostrando o no la stanza (L8).** Due forme esplicite accanto a quella di
oggi, che non cambia:

```
e adesso il giocatore va nella gola           → mostra sempre la stanza d'arrivo
e adesso il giocatore si ritrova nella gola   → non la mostra mai
e adesso il giocatore è nella gola            → come oggi (la mostra dopo una regola su un oggetto,
                                                 non dopo una regola «vai», un demone, un evento, un'opzione)
```

La stanza si mostra dopo i testi e le conseguenze della regola (o del demone). Motivo: nel Relitto le due
strade per la gola del ritorno (`vai giù` ed `entra il buio`) danno due partite diverse.

**C5 — `e poi dire` (L9).** Un testo scritto dopo le conseguenze, che legge i valori nuovi.

```
Invece di usa la cella: dire "Inserisci la cella." e adesso aumenta l'aria di 20 e poi dire "Aria: [aria]."
```

Vale nelle regole, negli eventi, nei demoni e negli argomenti di conversazione. Motivo: oggi `[aria]`
mostra il valore di prima, e il testo non può dire la cifra giusta.

**C6 — `si chiamano anche` e l'elenco su una riga (L12).**

```
I ganci si chiamano anche "casse", "uncini".
La matrice si chiama anche "arnese", "macchina" e "stampo".
```

Motivo: nel Relitto 219 righe `si chiama anche`, e con i plurali la frase era sgrammaticata.

**C7 — La tipografia italiana passa intatta (L13).** Dentro le stringhe il compilatore conserva `’`, `‘`,
`“` e `”`: «po’» esce «po’», e `"Il cartello dice “ATTENZIONE”."` compila. Fuori dalle stringhe tutto
resta come oggi (virgolette curve usate come delimitatori comprese). Nei nomi, nei segnaposto, negli alias
e nei testi che il giocatore scrive per scegliere (le opzioni di dialogo) i confronti normalizzano come
prima, così `l'aria` e `l’aria` restano la stessa cosa. Nessuna frase nuova. Verificato: nessuna storia
ufficiale, Il Viaggiatore e il Relitto compresi, ha caratteri tipografici dentro le stringhe, quindi il
loro testo non cambia. Si controlla anche il serializzatore di Studio, che riscrive i `.fav`.

**C8 — `[se]` annidati (L14).** Un analizzatore a pila sostituisce l'espressione regolare di oggi:
`[se A]…[se B]…[altrimenti]…[fine]…[fine]` funziona a ogni profondità. Nessuna frase nuova.

**C9 — Testi con un nome e regole su più verbi (L10).**

```
Il testo "presa di servizio" è "Una voce, poi il silenzio.".
Invece di esamina il registro: dire "[presa di servizio]".
Invece di usa oppure accendi il faro di prua: dire "Il faro si accende."
```

Il testo con un nome si richiama con il segnaposto `[nome]` dentro qualunque stringa (può contenere altri
segnaposto e `[se]`). Un nome usato da un testo e da uno stato o da un oggetto è un errore. La regola su
più verbi diventa una regola per verbo (si usa `oppure`, perché `o` vuol dire ovest). Motivo: nel Relitto
62 copie di 32 testi.

**C10 — La consultazione che non fa passare il tempo (L5).**

```
"esamina" non fa passare il tempo.
"inventario" non fa passare il tempo.
```

Vale per il verbo e i suoi sinonimi, e anche per le regole d'autore su quel verbo che non cambiano niente
(solo `dire`): nel Relitto `esamina il visore` non costerà più aria. Una regola su quel verbo che cambia il
mondo fa passare il turno, come oggi, perché deve entrare in ANNULLA e nei salvataggi. È ammessa per i
verbi della libreria che di loro non cambiano il mondo (esamina, guarda, inventario, ascolta, annusa,
tocca) e per i verbi d'autore (liberi quando nessuna regola cambia niente); per un verbo come `prendi` è un
errore con la spiegazione. La specifica dirà anche, chiaramente, che parlare con un personaggio non
consuma turni.

**C11 — `segnala` (N6).** Una conseguenza che manda un segnale a chi ospita il motore (l'app, la
pagina) e nel terminale tace.

```
Ogni turno se càpita (1 su 8): dire "La nave geme." e adesso segnala "gemito".
```

Il segnale è un evento `segnale` nel flusso d'uscita (§23.3 della specifica). Motivo: oggi l'app del Relitto
riconosce cinque testi dal loro inizio per far sentire un suono.

**C12 — L'arrivo in una stanza (L16).** Un aggancio che scatta quando il giocatore arriva, prima della
descrizione della stanza; se chiude la partita, la stanza non si stampa.

```
Quando il giocatore entra nella stiva se il risuonatore è in inventario: dire "…" e adesso vinci.
Quando il giocatore entra nella serra per la prima volta: dire "Un odore dolciastro ti accoglie."
```

Vale per ogni arrivo: un movimento, una regola che sposta il giocatore, un demone. La differenza con
`Quando il giocatore è nella stiva` (che resta com'è): quello guarda la fine del turno, `entra` scatta
subito, all'arrivo. Motivo: nel Relitto, prima del risveglio, si leggeva «Puoi vedere qui: un kit.».

**C13 — Le uscite con una condizione (L7).** Un collegamento che vale solo mentre la condizione è vera:
finché è falsa l'uscita non si vede e non si passa, in tutte e due le direzioni.

```
La sala delle teche collega est a la gola del ritorno se la fuga è iniziata.
La cucina collega nord a la cantina se la botola è aperta; altrimenti "La botola è chiusa.".
```

Con il testo `altrimenti`, chi prova a passare lo legge (e il turno passa); senza, il motore risponde come
per un'uscita che non c'è. Lo scanner della prima passata, il movimento, l'elenco delle uscite, i pulsanti,
il linter, il collaudo statico e la mappa di Studio vedono la condizione. Una conseguenza `collega` o `non
collega più` sulla stessa uscita la sostituisce. Motivo: nel Relitto 17 regole `Invece di vai` fanno da
porte, e l'uscita est della sala delle teche resta nell'elenco per tutta la partita (C8). È la proposta
più cara della lista.

---

## 4. Strumenti e ospiti (pacchetto B)

Non toccano la grammatica.

- **L15 — Il collaudo che basta per le risorse.** Portati nel motore i prototipi del Relitto
  (`collaudo/trascrivi.py`, `collaudo/regressioni.py`):
  - `favella1 trascrivi storia.fav percorso.txt [-o file]`: la partita come la vede chi gioca;
  - `favella1 collaudo storia.fav --percorsi p1.txt p2.txt`: gioca i percorsi e controlla le loro attese,
    scritte in commento: `# atteso: esito vinta`, `# atteso: stanza …`, `# atteso: aria >= 20`, `#
    atteso: finale «…»`, `# atteso: compare «…»`, `# atteso: mai «…»` (le forme del prototipo, così i
    percorsi del Relitto valgono subito), più una condizione di FAVELLA (`# atteso: l'aria è almeno 20`);
  - `--traccia aria` (anche più nomi): il valore dopo ogni comando;
  - `--riprese`: a ogni cambio di stanza lascia e riprende ogni oggetto portato, su un ramo disfatto, e
    segnala quelli che non si riprendono (avrebbe trovato C1).
- **N4 — Un'interfaccia pubblica per gli ospiti**, in `gioco.py`: `nuova_partita(mondo_base, seme=None)`
  (copia del mondo, seme, apertura e prima stanza, punto di partenza fissato dopo), `prova(mondo, comando)`
  (un comando su un ramo disfatto: impronta, testo, eventi) e `mostra_situazione(mondo)` (la stanza o la
  battuta, senza cambiare la partita). Un test controlla che il ramo copra ogni campo di sessione: se il
  motore ne aggiunge uno, il test fallisce invece di rompere in silenzio gli ospiti. Il terminale, il
  playground, l'esploratore e la pagina esportata usano la stessa apertura.
- **L20, primo passo — I fatti nei pulsanti.** `pulsanti()` aggiunge, per ogni cosa in vista, i verbi che
  hanno una regola scritta su di lei e gli effetti di quelle regole (le proprietà che danno). Il ponte del
  Relitto oggi li ricava da sé in una trentina di righe (`_indicizza`). Il filtro resta all'ospite (vedi E).
- **Collaudo dei sinonimi** (idea di `analisi-critica-1.2.1.md`, §8.4): l'esploratore prova anche i
  sinonimi della libreria e `guarda X` sugli stessi oggetti, e segnala quando due verbi equivalenti portano
  a stati diversi. Avrebbe trovato da solo GS-1 e GS-2.

---

## 5. La semantica che cambia (pacchetto D)

Prima si giocano tutte le storie ufficiali con il motore vecchio e con il nuovo, confrontando l'impronta a
ogni comando (§9). Poi si decide come dice la decisione 3.

- **D1 — I fronti vedono la fine del turno (L2).** Dopo il passaggio dei demoni di oggi, i `Quando` che non
  sono scattati si rivalutano, finché nessuno scatta più; ogni demone scatta al più una volta per turno,
  quindi niente cicli. Una soglia dichiarata prima dei consumi non arriva più in ritardo, e l'ordine degli
  `Includi` smette di essere logica del gioco.
- **D2 — I fronti alla chiusura del dialogo (L11, secondo punto).** Quando un dialogo si chiude, si
  valutano i soli fronti `Quando` (senza turno e senza eventi a tempo). Oggi la voce che segue un dialogo
  arriva solo dopo `aspetta`.

Se servisse la frase d'autore, la proposta è: `I demoni guardano la fine del turno.`

---

## 6. Ordine e numeri

Ordine di lavoro: A (correzioni) → C in ordine di valore (C6, C1+C2, C3, C4+C5, C7, C8, C9, C10, C11, C12,
C13) → B → D (con la prova sulle storie) → le idee del §7 → documentazione → rilascio.

---

## 7. Le idee della documentazione di lavoro (punto 2)

Ho fatto l'inventario in `analisi-critica-1.2.1.md` (§6, §7, §8), `espansione-oltre-0.29.md`,
`progettazione-oltre-0.18.md`, `progettazione-collaudo.md`, nella specifica 1.4.0 e nella memoria del
progetto. Quasi tutto è già stato fatto fra la 1.2.2 e la 1.4.0. Resta aperto questo.

**Le integro nella 1.5.0:**

- **IFID** (§7 dell'analisi: «IFID e riga di stato no»). `L'IFID è "…".` dà alla storia il suo
  identificatore del Treaty of Babel; `favella1 ifid` ne genera uno nuovo da incollare; la pagina esportata
  lo scrive nei metadati. Senza la frase, niente cambia. Piccola, e serve a chi pubblica su IFDB o itch.io.
- **La riga di stato** (stessa voce). `La riga di stato è "[luogo] · Aria [aria]".` Il motore, dopo ogni
  comando, emette un evento `stato` con il testo già interpolato; la pagina esportata e le cassette del sito
  lo mostrano in una barra sopra il testo (testo semplice, leggibile dalla lettura ad alta voce, senza
  annunci a ogni turno); il terminale lo mette davanti al prompt. Senza la frase, niente cambia. Per il
  Relitto è il visore dell'aria.
- **Il collaudo dei sinonimi** (§8.4 dell'analisi), al §4.

**Le lascio fuori, con il motivo:**

- **Regole per stanza o per contesto** (§6 dell'analisi). Si scrivono già (`Invece di annusa se il
  giocatore è in cucina: …`), e con gli stati calcolati (C2) diventano una parola. Una sintassi apposta
  aggiungerebbe un secondo modo per dire la stessa cosa.
- **Internazionalizzazione.** FAVELLA è l'italiano: tradurre le parole chiave è un progetto a sé, non
  progettato, e non va mescolato a questa versione.
- **Server LSP ed estensione per VS Code** (§8.4 dell'analisi, C2 di `progettazione-oltre-0.18.md`). Sono
  strumenti per editor diversi da Studio, con un loro ciclo di rilascio e uno store da gestire; Studio fa
  già la diagnostica. Restano aperti.
- **Rispettati i NO-GO e i rimandi già decisi:** 4c (creare oggetti in partita) rimandato, 5a (quantità e
  plurali) NO-GO, 5b (modelli di entità) sconsigliato, 1c (scala di stati) scartato. Nessuna frase di
  questo piano li riapre: i testi con un nome non sono modelli di entità, gli stati calcolati non sono
  quantità.

---

## 8. Da rinviare (pacchetto E)

Consiglio di lasciarli a FAVELLA 2: le descrizioni «più specifiche» (L2, un cambio di significato grande e
difficile da definire; gli stati calcolati ne tolgono quasi tutto il bisogno), le etichette dei nodi per
personaggio (L11, valore basso: un avviso le protegge già), la marcatura del genere dei testi (N5, costo
grande), il filtro dei pulsanti come comportamento del motore (L20, secondo passo: la specifica dice che i
pulsanti filtrano solo con ciò che il giocatore sa già; un filtro per regole è un suggerimento, e la scelta
deve restare dell'autore o dell'ospite).

---

## 9. Come verifico

- La suite: `python test_linguaggio.py` (oggi 1180) e `python test_collaudo.py` (50), con i test nuovi di
  ogni voce; la guardia LALR e il controllo della specifica comprendono ogni frase nuova.
- Le sonde del 05b (le tre dell'appendice, più quelle descritte nel testo: L1, L3, L5, L8, L9, L11, L13,
  L14, L18, L19, N1, N2, N3), ripetute sul 1.5.0 come prova che i difetti sono chiusi.
- Le storie ufficiali: La Casa, Il Relitto Silente (la demo del repository), Salerno-Reggio, Notte di gara,
  La notte lunga, Cuori al caffè, La cripta del lich, I tre sigilli, Il faro, Il giardino murato, e Il
  Viaggiatore (la versione del sito, con i suoi percorsi di collaudo). Per ognuna: partite dell'esploratore
  a semi fissi, la ricerca dei finali e i percorsi, giocati con il motore 1.4.4 e con il 1.5.0; a ogni
  comando si confrontano l'impronta e il testo. Le differenze ammesse sono solo quelle dichiarate.
- Studio: le copie del motore identiche (test), l'editor e il serializzatore provati con le frasi nuove e
  con la tipografia.

## 10. Documentazione e rilascio

- Specifica `documentazione/grammatica-1.5.0.md`, CHANGELOG, README, manuale Typst con le frasi nuove e il
  PDF rigenerato. Il kit KDP non lo preparo: la terza edizione è appena stata inviata (lo faccio se me lo
  chiedi).
- Rilascio con la procedura della memoria: `VERSIONE_MOTORE`, GitHub Release con gli installer, PyPI,
  sito favella.eu aggiornato e pubblicato, commit e push su `main`. Una Release di Studio a parte la faccio
  solo se me lo dici: nel repository la sua copia del motore si aggiorna comunque.
- Nella cartella del Relitto un documento per chi ci lavora: che cosa c'è di nuovo, quali lezioni sono
  chiuse, quali rimedi del gioco e del ponte si possono togliere, come aggiornare `motore/` e Pyodide, che
  cosa succede ai salvataggi, le due discese di `fuga.fav`. Non tocco il gioco, l'app né `motore/`, e non
  committo lì.
