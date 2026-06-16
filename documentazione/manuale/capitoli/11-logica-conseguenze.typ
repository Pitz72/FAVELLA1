#import "../lib/manuale-template.typ": *

= Logica e conseguenze

Nel capitolo sulle regole hai visto la parte sinistra di una regola: il verbo, la
condizione. Ora guardiamo le due metà che rendono una regola davvero potente: le
*condizioni composte*, che decidono con precisione quando scattare, e le
*conseguenze*, che cambiano il mondo dopo che è scattata.

== Comporre le condizioni

Una condizione semplice controlla un fatto solo. Spesso però la realtà ne richiede
diversi insieme: per accendere la torcia devi averla in mano *e* la torcia dev'essere
spenta. FAVELLA combina le condizioni con tre parole.

#sintassi[
  `[A] e [B]` — vere entrambe (E logico) \
  `[A] oppure [B]` — vera almeno una (O logico) \
  `non [...]` — la negazione, infissa nella frase
]

L'E lo hai già incontrato accendendo la torcia. L'O regge invece il finale più
amaro della Casa: bruciare le lettere è impedito se la torcia è spenta *oppure* se
non hai le lettere in mano.

#esempio[
#fav(```
Invece di brucia le lettere se la torcia è spenta oppure il giocatore non ha le lettere: dire "Non così, non adesso.".
```)
]

La negazione, in italiano, sta dentro la frase: `il giocatore non ha le lettere`,
`il medaglione non è notato`. È il modo naturale di scriverla, ed è anche quello
che FAVELLA capisce.

#tranello[
  Per l'O logico usa sempre la parola intera `oppure`, mai la lettera `o` (che vale
  «ovest»). Allo stesso modo, l'E logico è `e`, da non confondere con «est» quando
  scrivi una direzione.
]

Quando ti serve negare un *intero gruppo*, lo racchiudi tra parentesi e gli premetti
`non`:

#esempio[
#fav(```
# Forma disponibile (la Casa non la usa, ma è perfettamente valida):
Invece di esci se non ( il giocatore ha le lettere e la verita è svelata ): dire "Non puoi andartene così.".
```)
]

== Cambiare il mondo: `e adesso`

Una regola che dice soltanto qualcosa è muta sul mondo. Per farle *cambiare* lo
stato delle cose, aggiungi in coda una o più conseguenze, introdotte da `e adesso`.

#sintassi[
  `Invece di [...]: dire "[testo]" e adesso [conseguenza].`
]

Le conseguenze sono di pochi tipi, e li hai già visti sparsi qua e là. Eccoli in
fila.

*Cambiare una proprietà.* È quella che apre porte e accende torce:

#esempio[
#fav(```
Invece di accendi la torcia se la torcia è spenta e il giocatore ha la torcia: dire "Carichi la manovella per dieci secondi. Il fascio è giallo e tremante, ma tiene." e adesso la torcia è accesa.
```)
]

*Spostare un oggetto* (in una stanza, in un contenitore, nell'inventario) o
*farlo sparire* mandandolo `nel nulla`:

#esempio[
#fav(```
Invece di bevi il bicchiere di grappa: dire "Ne resta poca. Ti riempie la bocca di legno bruciato." e adesso il bicchiere di grappa è nel nulla.
```)
]

*Muovere un contatore* (`aumenta`, `diminuisci`, oppure `diventa [N]`) o *cambiare
uno stato* — fissandone il valore (`la verita è sospetta`) o copiandolo da un altro
stato (`il corteggiato diventa il preferito`, come nel capitolo «Stati e
contatori»). Spesso una regola ne fa più d'una di seguito, ciascuna con il suo
`e adesso`:

#esempio[
#fav(```
Invece di esamina la fotografia se la verita è ignota: dire "Adele a vent'anni, di tre quarti, con in braccio un neonato. Il retro a matita: 'novembre del trentanove, prima di portarlo via'. Non c'è mai stato un cugino in casa nostra." e adesso aumenta gli indizi e adesso la verita è sospetta e adesso diminuisci la calma.
```)
]

Una sola azione del giocatore — esaminare una foto — fa salire gli indizi, sposta
lo stato della verità da `ignota` a `sospetta` e intacca la calma. Le conseguenze
si eseguono nell'ordine in cui le scrivi.

#nota[
  `aumenta` e `diminuisci`, da soli, muovono il contatore di uno. Ma puoi dire
  anche *di quanto*: `aumenta gli indizi di 2`. E quel «quanto» non deve restare
  fisso — può essere il valore di un altro contatore o un numero estratto a caso.
  È il cuore del capitolo «Il caso e le quantità»; qui ti basti sapere che la
  quantità non è per forza un numero scritto a mano.
]

#nota[
  Esiste anche la conseguenza che *sposta il giocatore* in un'altra stanza:
  `e adesso il giocatore è in [stanza]`. La Casa non ne ha bisogno (ci si muove con
  le direzioni), ma è utile per botole, teletrasporti, cadute. Mostrerà al
  giocatore la nuova stanza, come se ci fosse entrato.
]

#prova[
  Scrivi una regola sul `flacone di medicine`: esaminandolo, fai aumentare gli
  indizi *e* diminuire la calma, con due `e adesso` in coda. Poi controlla che la
  seconda volta non conti di nuovo (ti servirà una proprietà-sentinella, come
  `notata`).
]
