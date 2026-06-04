#import "../lib/manuale-template.typ": *

= Fine partita

Una storia, prima o poi, finisce. In FAVELLA la fine è una conseguenza come le
altre: la metti in coda a una regola, o a una scelta di dialogo, e la partita si
chiude. Le parole sono tre, e dicono come finisce.

#sintassi[
  `e adesso vinci.` — finale di vittoria \
  `e adesso perdi.` — finale di sconfitta \
  `e adesso termina.` — fine neutra, né vinta né persa
]

La distinzione non è solo cosmetica: è il modo in cui dici che senso ha quel
finale. La Casa ne ha tre, e ognuno usa una parola diversa.

Chi firma l'atto e se ne va sceglie la via più comoda, e la storia la legge come
una resa: *perdi*.

#esempio[
#fav(```
Invece di firma l'atto di vendita: dire "Una firma sulla riga in fondo, un'altra di fianco. Il notaio asciuga le carte con il tampone e se ne va prima di te. Esci anche tu, con un assegno e niente più." e adesso perdi.
```)
]

Chi brucia le lettere cancella il segreto per sempre. Non è una sconfitta, ma non
è nemmeno una vittoria: è una scelta che chiude, e basta. *Termina*.

#esempio[
#fav(```
Invece di brucia le lettere con la torcia se la torcia è accesa: dire "Le tieni sotto il fascio finché la carta non prende. Brucia in fretta, era già asciutta. Te ne torni con le mani sporche di cenere, e nessuno saprà mai." e adesso termina.
```)
]

Il finale buono non sta in una regola, ma in fondo a un dialogo: lo raccoglie chi
ha capito tutto e decide di farsi custode. Lo vedremo per intero nel capitolo sui
personaggi; per ora nota la conseguenza `e adesso vinci` agganciata alla scelta.

#esempio[
#fav(```
Al nodo "soglia" l'opzione "Continuerò io." se il giocatore ha le lettere e la verita non è ignota chiude il dialogo e adesso vinci.
```)
]

== Il testo del finale

Nei casi della Casa, il messaggio del finale è già nella clausola `dire` della
regola. Quando invece vuoi che sia la parola d'esito a portare il proprio testo —
per esempio in una conseguenza che non ha un `dire` davanti — puoi scriverlo
subito dopo, fra virgolette.

#sintassi[
  `e adesso vinci "[testo del finale]".` (vale anche per `perdi` e `termina`)
]

#esempio[
#fav(```
# Forma con testo d'esito esplicito:
Invece di esci dalla porta se il giocatore ha le lettere: dire "Chiudi la porta piano." e adesso vinci "Le porterai con te. Qualcuno, finalmente, le aprirà.".
```)
]

#tranello[
  Una volta che la partita è finita, è finita: FAVELLA smette di accettare comandi
  e non avanza più i turni. Assicurati quindi che il finale scatti davvero quando
  deve, e che il giocatore possa raggiungerlo — un finale irraggiungibile è un
  vicolo cieco, non un epilogo.
]

#prova[
  Aggiungi un quarto finale alla Casa: una regola sul verbo `scappa` nell'ingresso
  che chiude la storia con `termina` e un testo tuo. Poi giocala e verifica che
  compaia il messaggio giusto.
]
