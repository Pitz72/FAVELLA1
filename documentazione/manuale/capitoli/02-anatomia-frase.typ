#import "../lib/manuale-template.typ": *

= Anatomia di una frase

Prima di costruire qualunque cosa, vale la pena fermarsi un momento su come
FAVELLA legge ciò che scrivi. Sono poche regole, valgono per tutto il linguaggio,
e tenerle a mente ti eviterà la maggior parte degli intoppi.

== Il punto e il cancelletto

Ogni istruzione di FAVELLA è una *frase*, e ogni frase finisce con un *punto*.
Non è decorazione: è il punto a dire al compilatore dove un'idea si chiude e ne
comincia un'altra.

#esempio[
#fav(```
L'ingresso è una stanza.
La descrizione dell'ingresso è "Anticamera stretta, parquet che scricchiola. Soprabito di Adele ancora al gancio.".
```)
]

Tutto ciò che segue un cancelletto `#`, fino a fine riga, è un *commento*: serve a
te, non al compilatore, che lo ignora. Nella Casa i commenti marcano le sezioni e
spiegano le scelte difficili.

#esempio[
#fav(```
# ============================================================
# 1. STANZE
# ============================================================
L'ingresso è una stanza.
```)
]

== Dichiara prima, usa dopo

FAVELLA legge il tuo file in due passaggi. Nel primo si limita a censire i *nomi*
che esistono — le tue stanze e i tuoi oggetti; nel secondo interpreta le frasi.
Grazie a questo, il compilatore sa sempre se un nome che incontri è davvero una
cosa del tuo mondo o solo un refuso.

La conseguenza pratica è una regola d'oro: ogni stanza e ogni oggetto va
*dichiarato* (`… è una stanza.`, `… è una cosa.`) prima di usarlo altrove. Se
nomini qualcosa che non hai mai dichiarato, FAVELLA non tira a indovinare: te lo
dice, e se è solo una lettera sbagliata ti propone il nome giusto.

#nota[
  Scrivendo `la chave` al posto di `la chiave`, otterrai un messaggio del tipo:
  «Entità sconosciuta: «chave» non è mai stata dichiarata. Forse intendevi:
  chiave?». L'errore arriva subito, non a gioco avviato.
]

== Nomi lunghi, proprietà corte

Un *nome* può essere lungo quanto vuoi. `la chiave della cantina`, `il flacone di
medicine`, `il tavolo del salotto`: per FAVELLA sono tutti nomi validi, presi per
intero. È ciò che permette alla Casa di avere due chiavi diverse senza confonderle.

Una *proprietà* di stato, invece, è sempre di *una parola sola*: `chiusa`,
`accesa`, `spenta`, `compatta`. Servono a dire com'è fatto un oggetto adesso, e le
incontreremo nel capitolo sulle proprietà.

#tranello[
  Non si scrive `La torcia è quasi scarica.`: «quasi scarica» sono due parole, e
  FAVELLA accetta una proprietà sola. Se ti serve uno stato del genere, scegli una
  parola unica (`scarica`) oppure usa un contatore per il livello di carica.
]

== Le parole riservate

Alcune parole hanno un significato preciso per la grammatica e *non possono fare
da sole il nome* di una stanza o di un oggetto. Possono però comparire dentro un
nome più lungo: `est` è riservata come direzione, ma `via Stradivari` no, e `la
porta a est` neppure.

Le principali parole riservate sono `è` e `sono`; gli articoli; le preposizioni
(`di`, `del`, `della`, `in`, `nel`, `su`, `sul`, `con`…); `una`, `un`, `stanza`,
`cosa`, `contenitore`, `supporto`, `personaggio`, `stato`, `contatore`,
`prendibile`; `collega` e le direzioni; `giocatore`, `comincia`; `Invece`, `se`,
`dire`, `adesso`, `oppure`, `non`, `ha`; `Al`, `turno`, `Ogni`, `Quando`. La
tabella completa è in appendice.

#tranello[
  La lettera `e` è insieme la congiunzione «e» e l'abbreviazione di «est»; la `o`
  è «oppure» e «ovest». Per l'OR logico nelle condizioni usa sempre la parola
  intera `oppure`, mai la lettera `o`.
]

== L'ordine delle frasi non conta

Potresti aspettarti di dover dichiarare le cose in un ordine preciso: prima il
contenitore, poi ciò che contiene. Non è così. FAVELLA risolve posizioni,
proprietà e collegamenti solo alla fine, quando il mondo è completo. Puoi quindi
mettere un oggetto dentro un cassettone che dichiarerai più avanti.

Nella Casa questo è fatto apposta, per mostrarlo: il medaglione è collocato dentro
il cassettone *prima* che il cassettone esista.

#esempio[
#fav(```
Il medaglione è una cosa.
Il medaglione è nel cassettone.

# ...più avanti nel file...
Il cassettone è un contenitore.
Il cassettone è in camera.
```)
]

Sposta pure quelle righe a piacere e ricompila: il risultato non cambia. L'unico
errore che resta è nominare qualcosa che non hai dichiarato *da nessuna parte* —
quello, giustamente, FAVELLA continua a segnalartelo.
