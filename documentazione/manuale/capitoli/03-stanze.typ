#import "../lib/manuale-template.typ": *

= Le stanze

Le stanze sono le ambientazioni della tua storia: i luoghi in cui il giocatore si
trova, si guarda intorno, decide dove andare. Sono anche la prima cosa che si
costruisce, perché tutto il resto — oggetti, personaggi, regole — vive dentro una
stanza.

== Creare una stanza

#sintassi[
  `[Nome della stanza] è una stanza.`
]

Una riga, e il luogo esiste. La Casa ne ha sette, una per frase:

#esempio[
#fav(```
L'ingresso è una stanza.
Il salotto è una stanza.
Lo studio è una stanza.
La cucina è una stanza.
La camera è una stanza.
La soffitta è una stanza.
La cantina è una stanza.
```)
]

L'articolo iniziale fa parte del nome e lo aiuta a suonare naturale; FAVELLA lo
riconosce e non se ne preoccupa quando più avanti scriverai «la cucina». Da quel
nome il motore ricava anche il genere e il numero, e li userà per concordare gli
articoli quando elencherà ciò che il giocatore ha davanti.

== Descrivere una stanza

Una stanza senza descrizione è una scatola vuota. La descrizione è il testo che il
giocatore legge appena entra.

#sintassi[
  `La descrizione di/del/della [stanza] è "[testo]".`
]

La preposizione si accorda con il nome, come faresti parlando: *della* cucina,
*dello* studio, *dell'*ingresso.

#esempio[
#fav(```
La descrizione della cucina è "Pavimentazione di graniglia. Lo schienale della sedia è ancora sguarnito. Il bicchiere e il flacone sono dove li ha lasciati. L'hanno trovata seduta, hanno detto, non riversa.".
La descrizione dello studio è "Una scrivania ordinata. Un cassetto chiuso a chiave. Sotto i piedi un kilim. Alle pareti, due foto di gruppo da cui qualcuno è stato ritagliato.".
```)
]

Il testo sta sempre fra virgolette dritte `"..."`. Se ti serve una virgoletta
dentro la descrizione, falla precedere da una barra rovescia (`\"`); è un caso
raro, ma sapere che si può torna utile.

== Descrizioni che cambiano

Una stanza non è sempre uguale a sé stessa. Quando scoppia il temporale, l'ingresso
prende acqua; quando la torcia è spenta, la soffitta è solo buio. FAVELLA lo
gestisce con le *descrizioni condizionali*: aggiungi una clausola `se`, e quella
descrizione varrà soltanto quando la condizione è vera.

#sintassi[
  `La descrizione di [stanza] se [condizione] è "[testo]".`
]

La soffitta ha due volti. Al buio mostri il primo; con la torcia accesa, il
secondo.

#esempio[
#fav(```
La descrizione della soffitta se la torcia è spenta è "Buio fitto sotto la trave. Distingui solo l'angolo del lucernario, e non basta.".
La descrizione della soffitta è "Travi a vista, polvere a centimetri. Una scatola di latta tra due vecchie valigie vuote. Adele saliva qui ancora, di rado.".
```)
]

Il motore valuta le varianti *nell'ordine in cui le scrivi*: prende la prima la
cui condizione è vera. Se nessuna lo è, ripiega sulla descrizione *base*, quella
senza `se`. Per questo la riga generica fa sempre da rete di sicurezza, e puoi
scriverne quante ne vuoi prima di lei.

Lo stesso vale per i cambi di stato della storia. Quando la verità sul conto di
Adele viene a galla, il salotto smette di essere un salotto qualunque:

#esempio[
#fav(```
La descrizione del salotto è "Tre poltrone, una credenza, un orologio a pendolo fermo. Sul tavolo, una cartelletta aperta. Il notaio aspetta seduto, non si è alzato quando sei entrato.".
La descrizione del salotto se la verita è svelata è "Le stesse poltrone, la stessa credenza. Adesso lo vedi: tutto disposto come se qualcuno dovesse venire a riprenderla. Solo non è venuto nessuno.".
```)
]

#nota[
  Dentro una descrizione puoi anche inserire valori vivi del gioco, scrivendo il
  nome di uno stato o di un contatore fra parentesi quadre: `[indizi]` diventerà
  il numero di indizi raccolti. Questa interpolazione la vedremo per bene nel
  capitolo sugli stati; per ora basta sapere che le descrizioni non sono per forza
  fisse.
]

#prova[
  Dài alla cantina una descrizione al buio (`se la torcia è spenta`) e una normale.
  Poi entra una volta senza torcia e una con la torcia accesa: la stessa stanza ti
  accoglierà in due modi diversi.
]
