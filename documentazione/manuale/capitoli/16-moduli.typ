#import "../lib/manuale-template.typ": *

= Organizzare un progetto: i moduli

Una storia piccola sta in un file solo. Ma «La Casa di Via Stradivari» ha sette
stanze, una cinquantina di oggetti, due personaggi con i loro dialoghi: tutto in un
unico file diventerebbe un muro difficile da leggere. Per questo FAVELLA permette
di spezzare un progetto in più file e ricucirli con una riga.

== Includere un file

#sintassi[
  `Includi "[nome del file]".`
]

Il percorso del file va *tra virgolette*. Prima ancora di interpretare il
linguaggio, FAVELLA sostituisce ogni `Includi` con il contenuto del file indicato,
come se l'avessi incollato lì a mano. Da quel momento è tutto un sorgente solo.

La Casa è divisa in tre file, per argomento:

#esempio[
#fav(```
# In testa a storia.fav, dopo aver dichiarato le stanze:
Includi "oggetti.fav".
Includi "dialoghi.fav".
```)
]

Il file principale, `storia.fav`, tiene le stanze, gli stati, gli eventi e le
regole; `oggetti.fav` raccoglie oggetti, proprietà, alias e verbi; `dialoghi.fav`
i due personaggi con le loro conversazioni. Chi legge sa subito dove cercare, e
ogni file resta di una lunghezza ragionevole.

== Qualche accortezza

L'ordine conta per leggibilità, non per il funzionamento: grazie alla robustezza
d'ordine (capitolo sull'anatomia della frase), un oggetto in `oggetti.fav` può
riferirsi a una stanza dichiarata in `storia.fav` anche se il file è incluso dopo.
La Casa include `oggetti.fav` *dopo* aver dichiarato le stanze proprio per tenere
le cose in ordine logico, non per necessità del compilatore.

#nota[
  I percorsi sono relativi al file che scrive `Includi`. Lo stesso file può essere
  incluso una volta sola: se due file includono lo stesso terzo, FAVELLA non lo
  espande due volte. E le inclusioni a catena sono ammesse — un file incluso può a
  sua volta includerne altri — purché non si formino cicli.
]

#prova[
  Sposta tutti gli eventi a turni e i demoni della Casa in un nuovo file
  `tempo.fav`, e includilo da `storia.fav`. Ricompila: la storia deve comportarsi
  esattamente come prima, ma ora il «motore del tempo» vive tutto in un posto solo.
]
