#import "../lib/manuale-template.typ": *

= Le regole: «Invece di»

Finora hai costruito un mondo: stanze, oggetti, stati. Ma un mondo che non
risponde non è ancora una storia. Le *regole* sono il punto in cui FAVELLA
smette di descrivere e comincia a reagire: dicono al gioco cosa fare quando il
giocatore prova ad #emph[aprire], a #emph[prendere], a #emph[usare] qualcosa.

In FAVELLA esiste un'unica forma di regola, e si apre sempre con le stesse due
parole: *Invece di*. Il nome non è casuale, e nasconde l'idea più importante di
tutto il capitolo.

== «Invece di» vuol dire «al posto di»

Quando una regola scatta, il motore esegue la regola #emph[al posto di] ciò che
avrebbe fatto normalmente. Non #emph[in aggiunta]: #emph[al posto di]. La frase
che scrivi tu sostituisce in pieno il comportamento predefinito del verbo.

#sintassi[
  `Invece di [verbo all'imperativo] [oggetto]: dire "[testo]".`

  Il verbo va scritto *all'imperativo*, esattamente come lo digiterebbe il
  giocatore: `apri` (non «aprire»), `prendi` (non «prendere»).
]

Ecco la regola più semplice possibile, tratta dallo studio di Adele: una falsa
pista, onesta. Il giocatore sposta il tappeto sperando in una botola; non c'è
nulla, e glielo diciamo.

#esempio[
#fav(```
Invece di sposta il tappeto dello studio: dire "Sollevi un angolo. Parquet, polvere, niente. Adele non era una che nascondeva sotto i tappeti.".
```)
]

Qui il verbo `sposta` non aveva comunque un effetto sul mondo, quindi
«sostituirlo» con un messaggio è innocuo. Con i verbi che #emph[cambiano
qualcosa] — `prendi`, `lascia`, `metti`, `apri` — la faccenda è più delicata.

#tranello[
  Se scrivi `Invece di prendi la torcia: dire "Scotta!".`, il giocatore vedrà il
  messaggio #emph[e la torcia non finirà nell'inventario]: hai sostituito l'intera
  azione «prendi», compreso il suo effetto. Per conservare l'effetto normale devi
  #emph[ricrearlo] con una conseguenza `e adesso` (il capitolo successivo,
  «Conseguenze: e adesso»). È un tranello in cui cade chiunque, almeno una volta:
  «Invece di» #emph[spegne] il comportamento di default.
]

Per questo, quando una regola apre qualcosa, l'apertura va dichiarata a parte.
Guarda il cassettone della camera: la regola intercetta `apri`, racconta la
scena #emph[e] aggiorna lo stato dell'oggetto.

#esempio[
#fav(```
Invece di apri il cassettone se il cassettone è chiuso: dire "Il primo cassetto cede subito: era solo accostato. Dentro, avvolto in un fazzoletto, qualcosa di piccolo e pesante." e adesso il cassettone è aperto.
```)
]

== Regole condizionali: la parola `se`

Una regola può aspettare il momento giusto. Aggiungendo una clausola `se`, scatta
*solo quando la condizione è vera*; altrimenti il motore prosegue e cerca
un'altra regola applicabile.

#sintassi[
  `Invece di [azione] se [condizione]: dire "[testo]".`
]

La torcia di Adele è a manovella: per accenderla devi averla in mano. Servono due
regole, una per il caso «ci riesco» e una per il caso «non ci riesco»; la prima
usa una condizione composta con `e` (la logica booleana completa è nel capitolo
«Conseguenze: e adesso»).

#esempio[
#fav(```
Invece di accendi la torcia se la torcia è spenta e il giocatore ha la torcia: dire "Carichi la manovella per dieci secondi. Il fascio è giallo e tremante, ma tiene." e adesso la torcia è accesa.
Invece di accendi la torcia se la torcia è spenta: dire "Devi averla in mano per caricarla.".
```)
]

#nota[
  Le regole *condizionali hanno la precedenza su quelle semplici*, e fra due
  condizionali vince la prima dichiarata che risulta vera. Per questo la riga con
  la condizione più stringente (`… e il giocatore ha la torcia`) va scritta
  #emph[prima] del ripiego più generico: il motore le prova nell'ordine.
]

== Verbi personalizzati

`accendi`, `spegni`, `forza`, `scava`, `brucia`: non sono verbi che FAVELLA
conosce da sé, li hai inventati tu per questa storia. Un verbo nuovo è
#emph[vocabolario nuovo], e come ogni vocabolario nuovo si dichiara *tra
virgolette*.

#sintassi[
  `"[verbo]" è un comando.`
]

#esempio[
#fav(```
"accendi" è un comando.
"spegni" è un comando.
"forza" è un comando.
"scava" è un comando.
"brucia" è un comando.
```)
]

Da quel momento il giocatore può digitarli e tu puoi intercettarli con `Invece
di`, esattamente come i verbi predefiniti. Un comando può anche essere di *più
parole*: in quel caso si dichiara `"fai scattare" è un comando.` e il motore
riconosce l'intera espressione all'inizio del comando.

== Comandi senza oggetto

Alcuni verbi non reggono un oggetto: si #emph[accelera], si #emph[aspetta], si
#emph[salta], e basta. Per questi dichiari il comando come *senza oggetto*, così la
regola globale scatta anche quando il giocatore digita il verbo da solo.

#sintassi[
  `"[verbo]" è un comando senza oggetto.`
]

#esempio[
#fav(```
# Forma disponibile:
"accelera" è un comando senza oggetto.
Invece di accelera: dire "Premi a fondo. Il motore sale di giri, il paesaggio si fa liquido ai lati.".
```)
]

== Sinonimi di un verbo

Chi gioca non indovina sempre la tua parola. Dove tu hai previsto `prendi`, qualcuno
scriverà `afferra` o `raccogli`. Invece di duplicare le regole, dichiari che una
parola nuova vale *come* un verbo che FAVELLA conosce già: ne eredita tutto — il
comportamento di default, le tue regole `Invece di`, perfino i pronomi.

#sintassi[
  `"[parola nuova]" è come [verbo].`
]

#esempio[
#fav(```
# Forma disponibile:
"ghermisci" è come prendi.
```)
]

Da qui `ghermisci la torcia` fa esattamente quel che farebbe `prendi la torcia`. Il
verbo a destra dev'essere uno di quelli che il motore riconosce; se non lo è,
FAVELLA te lo segnala con un avviso.

== Regole a due oggetti

Molti enigmi nascono dall'incontro di due cose: una chiave e una porta, una leva
e un cassetto. FAVELLA lo scrive con una preposizione fra i due oggetti — `su`,
`con`, `contro`, `in` (anche articolate: `sulla`, `nella`…).

#sintassi[
  `Invece di [verbo] [oggetto 1] [su/con/contro/in] [oggetto 2] se [condizione]: dire "[testo]".`
]

La porta della cantina si apre con la sua chiave:

#esempio[
#fav(```
Invece di usa la chiave della cantina sulla porta della cantina se la porta della cantina è chiusa: dire "La doppia mappa gira due volte, di scatto. La porta si apre verso il basso." e adesso la porta della cantina è aperta.
```)
]

E lo stesso cassetto dello studio si può forzare: qui un verbo personalizzato e
due oggetti collaborano, con il portaombrelli che fa da leva.

#esempio[
#fav(```
Invece di forza il cassetto con il portaombrelli se il cassetto è chiuso: dire "Il ferro del portaombrelli scivola sotto il piano. Una pressione asciutta, il legno cede. Hai aperto male, ma hai aperto." e adesso il cassetto è aperto.
```)
]

#nota[
  Il motore è tollerante sulla preposizione: se i due oggetti individuano una
  sola interazione possibile, `usa la chiave con la porta` funziona anche se la
  regola era scritta con `sulla`. Così il giocatore non deve indovinare la
  preposizione «giusta».
]

== Regole globali: senza bersaglio

A volte la reazione non riguarda un oggetto, ma lo stato della storia. Una regola
può fare a meno dell'oggetto e scattare *sul solo verbo* (con o senza
condizione). Il verbo `ricorda`, in fondo alla Casa, tira le somme degli indizi
raccolti:

#esempio[
#fav(```
Invece di ricorda se la verita è svelata: dire "Tua zia. Le lettere chiuse. Il bambino consegnato. Le mensilità mai cessate. Hai messo insieme [indizi] frammenti, e bastano.".
Invece di ricorda: dire "Non hai abbastanza pezzi per cucirli insieme. Non ancora.".
```)
]

Le `[indizi]` fra parentesi quadre sono un'#emph[interpolazione]: a gioco avviato
vengono sostituite dal valore corrente del contatore. Una *regola specifica*,
legata a un oggetto, vince comunque su una globale: prima il motore cerca la
regola puntuale, poi ripiega su quella generale.

== La catena di ripiego

Mettendo insieme questi pezzi ottieni il pattern più utile di tutti: più regole
sullo stesso verbo, dalla più esigente alla più generica, che formano una
*catena di ripiego*. Scavare la terra del giardino ne è l'esempio migliore.

#esempio[
#fav(```
Invece di scava la terra smossa se il giocatore ha il portaombrelli e la terra smossa è compatta: dire "Con il puntale del portaombrelli arrivi sotto. Tre colpi, e la chiave dello studio è lì." e adesso la chiave dello studio è in giardino e adesso la terra smossa è scavata.
Invece di scava la terra smossa se la terra smossa è compatta: dire "A mani nude no. Servirebbe qualcosa con cui smuovere.".
Invece di scava la terra smossa: dire "Hai già rivoltato la terra qui sotto. Non c'è altro.".
```)
]

Il motore le valuta dall'alto verso il basso: se hai la leva e la terra è ancora
intatta, scavi davvero; se ti manca lo strumento, ti dice cosa ti serve; una
volta scavata, la terza riga chiude la questione. Tre esiti per lo stesso verbo,
nessuna ambiguità.

#prova[
  Aggiungi alla Casa una reazione per il verbo `bussa` sulla porta della cantina:
  un messaggio diverso a seconda che la porta sia `chiusa` o `aperta`. Ti bastano
  due regole e la parola `se` — ricordando di metterle nell'ordine giusto.
]
