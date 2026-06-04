#import "../lib/manuale-template.typ": *

= Personaggi e dialoghi

Una casa vuota la esplori; una casa con qualcuno dentro la *interroghi*. I
personaggi portano nella storia l'unica cosa che gli oggetti non hanno: una voce,
e la possibilità di mentire, sviare, rivelare. Nella Casa ce ne sono due — il
notaio che vuole solo la firma, e la vicina che ti misura prima di parlare — e il
finale buono passa per loro.

== Creare un personaggio

#sintassi[
  `[Nome] è un personaggio.`
]

Per il resto è un oggetto come gli altri: ha una posizione e una descrizione.

#esempio[
#fav(```
Il notaio è un personaggio.
Il notaio è in salotto.
La descrizione del notaio è "Cinquant'anni, cravatta stretta, una cartelletta di pelle sulle ginocchia. Non si è alzato quando sei entrato.".
```)
]

Il giocatore avvia la conversazione con `parla con [personaggio]`. Da quel momento
entra in una modalità a parte, fatta di battute e scelte, e ne esce con `esci`
(oppure `addio`, `basta`). Parlare non consuma un turno: il tempo della storia si
ferma mentre conversi.

== Il dialogo e il nodo d'avvio

Un dialogo è una rete di *nodi*: ogni nodo è una battuta del personaggio con le
risposte che il giocatore può dare. Per prima cosa dichiari da quale nodo si parte.

#sintassi[
  `Il dialogo di [personaggio] comincia con "[nodo iniziale]".`
]

#esempio[
#fav(```
Il dialogo del notaio comincia con "tavolo".
```)
]

I nomi dei nodi (`"tavolo"`, `"salute"`, `"lettere"`…) sono vocabolario nuovo, e
come ogni vocabolario nuovo stanno *tra virgolette*. Non li vedrà mai il giocatore:
servono solo a te, per cucire insieme la conversazione.

== Le battute

#sintassi[
  `[personaggio] al nodo "[nodo]" dice "[battuta]".`
]

#esempio[
#fav(```
Il notaio al nodo "tavolo" dice "Lei è il nipote. Bene. Le carte sono sul tavolo. Una firma e ho un altro appuntamento.".
```)
]

== Le opzioni: ramificare

Sotto ogni battuta metti le risposte possibili. Ogni opzione mostra un testo e
dice dove porta: a un altro nodo, o fuori dal dialogo.

#sintassi[
  `Al nodo "[nodo]" l'opzione "[testo]" conduce al nodo "[altro nodo]".` \
  `Al nodo "[nodo]" l'opzione "[testo]" chiude il dialogo.`
]

#esempio[
#fav(```
Al nodo "tavolo" l'opzione "Di cosa è morta?" conduce al nodo "salute".
Al nodo "tavolo" l'opzione "Perché tanta fretta?" conduce al nodo "fretta".
Al nodo "tavolo" l'opzione "Più tardi." chiude il dialogo.
```)
]

Il giocatore sceglie per numero o digitando la risposta; `conduce al nodo` lo
porta alla battuta successiva, `chiude il dialogo` lo riporta nella stanza. I nodi
possono rimandarsi a vicenda, anche in cerchio: «Torno a sedermi» riporta al nodo
di partenza, e la conversazione gira finché il giocatore non decide di chiudere.

== Opzioni che chiedono e che fanno

Un'opzione può comparire *solo a certe condizioni*, e può avere *conseguenze*,
esattamente come una regola. È qui che il dialogo si intreccia col resto del gioco.

#sintassi[
  `Al nodo "[nodo]" l'opzione "[testo]" se [condizione] conduce al nodo "[...]" e adesso [conseguenza].`
]

Col notaio, parlare delle lettere è possibile solo se le hai trovate, e farlo ti
frutta un indizio:

#esempio[
#fav(```
Al nodo "tavolo" l'opzione "So delle lettere." se il giocatore ha le lettere conduce al nodo "lettere" e adesso aumenta gli indizi.
```)
]

Un'opzione la cui condizione è falsa non viene nemmeno mostrata: il giocatore vede
solo le risposte che può davvero dare. E una scelta può anche chiudere la partita:
firmare subito, qui, è la sconfitta.

#esempio[
#fav(```
Al nodo "tavolo" l'opzione "Firmo subito." chiude il dialogo e adesso perdi.
```)
]

== Il finale che si guadagna parlando

Mettendo insieme condizioni e conseguenze, una scelta di dialogo diventa la chiave
del finale buono. Con la vicina, l'opzione che vince esiste soltanto se hai le
lettere *e* hai scoperto la verità: due cose che si ottengono esplorando tutta la
casa e parlando con entrambi.

#esempio[
#fav(```
La vicina al nodo "soglia" dice "Lei chi è? ...Ah. Il nipote. Adele parlava di voi. Poco.".
Al nodo "soglia" l'opzione "Continuerò io." se il giocatore ha le lettere e la verita non è ignota chiude il dialogo e adesso vinci.
Al nodo "soglia" l'opzione "Devo andare." chiude il dialogo.
```)
]

Finché non hai fatto il lavoro, l'opzione «Continuerò io.» non c'è: la vedrai
comparire solo quando la storia è pronta a lasciartela scegliere. Le battute, come
ogni testo, possono contenere interpolazioni `[indizi]` per riflettere ciò che hai
raccolto.

#tranello[
  Etichette dei nodi e testi delle opzioni vanno sempre tra virgolette. Se scrivi
  `conduce al nodo "valigia"` ma non hai mai definito una battuta `al nodo
  "valigia"`, il giocatore arriverà in un nodo muto: controlla che ogni nodo a cui
  rimandi esista davvero.
]

#prova[
  Dài al notaio un nuovo nodo `"certificato"`, raggiungibile dal nodo `"salute"`
  solo `se gli indizi è almeno 2`. Scrivi la sua battuta e un'opzione che riporti
  al nodo `"tavolo"`. Poi parla con lui prima e dopo aver raccolto indizi, e
  guarda l'opzione comparire.
]
