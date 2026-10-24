#import "../lib/manuale-template.typ": *

= Muoversi tra le stanze

Otto stanze isolate non fanno una casa. Servono le porte: i collegamenti che
permettono al giocatore di passare da un luogo all'altro. In FAVELLA si tracciano
con una parola, `collega`, e con una direzione.

== Collegare due stanze

#sintassi[
  `[Stanza A] collega [direzione] a [Stanza B].`
]

Le direzioni di base sono `nord`, `sud`, `est`, `ovest` (con le abbreviazioni
`n`, `s`, `e`, `o`). La cosa comoda è che il collegamento di ritorno nasce da
solo: se l'ingresso porta a nord nel salotto, dal salotto si torna a sud
nell'ingresso senza che tu debba scriverlo.

Ecco la pianta completa della Casa. Vi compaiono `basso` e `sopra`: sono due
direzioni *tue*, che la Casa dichiara più avanti (la sezione «Direzioni tue»); per
ora leggile come parole qualunque.

#esempio[
#fav(```
L'ingresso collega nord a il salotto.
L'ingresso collega ovest a lo studio.
L'ingresso collega est a la cucina.
L'ingresso collega basso a la cantina.
Il salotto collega nord a la camera.
La camera collega sopra a la soffitta.
La cucina collega est a il giardino.
```)
]

Sette righe, e l'intera mappa è in piedi: l'ingresso è lo snodo centrale, da cui
si raggiungono salotto, studio e cucina; dal salotto si sale in camera, dalla
camera in soffitta, dalla cucina si esce in giardino.

#nota[
  Dopo `a` il nome della stanza conserva il suo articolo: si scrive `a il salotto`,
  `a lo studio`, `a la cucina`. È voluto. La parola di collegamento è la `a`
  semplice, e la stanza arriva con il suo nome per intero, articolo compreso.
]

== Dove comincia il giocatore

Le stanze ci sono, sono collegate, ma da dove parte la storia? Lo decidi tu con
una frase. Senza di essa, FAVELLA farebbe partire il giocatore dalla prima stanza
che ha incontrato, e sarebbe un caso, non una scelta.

#sintassi[
  `Il giocatore comincia in [stanza].`
]

#esempio[
#fav(```
Il giocatore comincia in ingresso.
```)
]

La Casa si apre dove deve aprirsi: sull'uscio, con il soprabito di Adele ancora
appeso. Al posto di `comincia` puoi usare `inizia` o `parte`, se ti suonano
meglio.

== Direzioni tue

I quattro punti cardinali bastano per muoversi in piano, ma una casa ha anche un
sopra e un sotto: la soffitta, la cantina. Le parole `su` e `giù` sono però
riservate ad altri usi, e non si possono prendere come direzioni. La soluzione è
*dichiarare direzioni nuove*, sempre in coppia.

#sintassi[
  `[Direzione] e [direzione opposta] sono direzioni opposte.`
]

Dichiararle in coppia garantisce il ritorno automatico, come per i punti
cardinali. La Casa ne usa due distinte, e la distinzione è deliberata:

#esempio[
#fav(```
Alto e basso sono direzioni opposte.
Sopra e sotto sono direzioni opposte.
```)
]

Perché due coppie e non una? Perché `alto`/`basso` collegano l'ingresso alla
cantina, mentre `sopra`/`sotto` collegano la camera alla soffitta. Tenendole
separate, puoi sbarrare un solo percorso alla volta: la porta della cantina
bloccherà chi scende `basso`, senza toccare chi sale `sopra` verso la soffitta.
Quel tipo di blocco — una regola che intercetta un movimento — lo costruiremo nel
capitolo sulle regole.

== Su, giù e le direzioni intermedie

Dalla versione 1.3 FAVELLA conosce da sé anche `su` e `giù` (opposte fra loro) e le
quattro direzioni intermedie: `nordest`, `nordovest`, `sudest`, `sudovest`, con le
loro opposte. Si collegano come le altre:

#esempio(da: "un esempio")[
#fav(```
La cucina collega giù a la cantina.
La soglia collega nordest a il frutteto.
```)
]

Prima `su` era vietata, perché è anche una preposizione: `Su e giù sono direzioni
opposte.` non compilava e bisognava ripiegare su `alto`/`basso`. Adesso si può
scrivere, e le coppie personalizzate restano libere per i casi in cui servono
percorsi distinti, come nella Casa.

== Passaggi che si aprono e si chiudono

Le uscite possono cambiare durante la partita. Una conseguenza apre un passaggio
(con il ritorno, come la dichiarazione) o lo chiude:

#esempio(da: "un esempio")[
#fav(```
Invece di tira la leva: dire "Uno scaffale ruota su se stesso." e adesso la biblioteca collega est a la stanza segreta.
Invece di spingi la leva: dire "Lo scaffale torna al suo posto." e adesso la biblioteca non collega più est.
```)
]

Le stanze nominate in una conseguenza devono essere dichiarate con
`è una stanza.`. La riga «Uscite:» di solito dice anche il nome della stanza a cui
porta ogni uscita; per non rivelare i luoghi che il giocatore non ha ancora visto
basta una frase:

#sintassi[
  `Le uscite nominano solo le stanze visitate.`
]

== Uscite che dipendono da qualcosa

Una porta che si apre solo a una condizione si può scrivere direttamente nel
collegamento. Finché la condizione è falsa l'uscita non compare fra le «Uscite» e non
si passa, in tutte e due le direzioni; con `altrimenti` scegli che cosa leggere chi
prova a passare comunque:

#esempio(da: "un esempio")[
#fav(```
La cucina collega giù a la cantina se la botola è aperta; altrimenti "La botola è chiusa.".
La sala collega est a la serra se il giocatore ha la chiave della serra.
```)
]

Senza `altrimenti`, chi prova a passare legge la risposta di un'uscita che non c'è,
e il turno non passa. Una conseguenza `collega` o `non collega più` sulla stessa uscita
toglie la condizione. È la forma da preferire a una regola `Invece di vai` che fa da
porta: l'uscita chiusa non si vede, e il collaudo la conosce.

== Passaggi a senso unico

Finora ogni collegamento si percorre nei due versi: dichiarato `L'ingresso collega
nord a il salotto.`, il ritorno a sud nasce da solo. A volte però vuoi un passaggio
da cui non si torna indietro — ci si cala in un pozzo, si scivola in una botola.
Dalla versione 1.6 lo dici aggiungendo `senza ritorno` in coda al collegamento.

#sintassi[
  `[Stanza A] collega [direzione] a [Stanza B] senza ritorno.`
]

#esempio(da: "un esempio")[
#fav(```
La botola collega giù a il pozzo senza ritorno.
La soglia collega nord a l'abisso se il sigillo è rotto senza ritorno.
```)
]

Si crea la sola uscita dalla botola verso il pozzo; dal pozzo non si risale per la
botola, a meno che tu non apra un altro passaggio. Il `senza ritorno` sta sempre
*in fondo*, anche dopo una condizione `se …; altrimenti "…"`. Le conseguenze
`collega` e `non collega più` non cambiano: il senso unico è una scelta della sola
dichiarazione.

#tranello[
  È facile tagliare fuori il giocatore senza accorgersene: un `senza ritorno` verso
  una stanza da cui non parte nessun'altra uscita è una trappola a tutti gli effetti.
  Il collaudo di vincibilità (`favella1 collaudo`) se ne accorge e ti segnala le
  stanze che diventano irraggiungibili.
]

#prova[
  Aggiungi una nuova stanza, il `sottoscala`, e collegala alla cantina con una
  coppia di direzioni tutta tua (per esempio `dentro` e `fuori`). Poi parti
  dall'ingresso e prova a raggiungerla: se il ritorno funziona, la coppia è
  dichiarata bene.
]
