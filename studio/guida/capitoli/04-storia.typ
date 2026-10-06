#import "../lib/guida.typ": *

= Storia: il testo

La sezione #ui[Storia] è il testo della tua avventura. Qui scrivi le frasi direttamente,
vedi i file che compongono la storia e i problemi che il motore trova mentre scrivi.

== I file della storia

A sinistra c'è #ui[Esplora]. In alto, quattro pulsanti piccoli: #ui[Rileggi i file] (se
hai cambiato qualcosa nella cartella fuori da Studio), #ui[Nuova storia], #ui[Apri una
storia], #ui[Apri una cartella].

#grid(
  columns: (36%, 1fr),
  column-gutter: 16pt,
  [#schermata("esplora.png",
    alt: "Il pannello Esplora: il riquadro «La storia · 3 file» con storia.fav principale, oggetti.fav e dialoghi.fav, e sotto l'albero della cartella materiale-didattico.",
    didascalia: [#ui[Esplora]: la storia e la cartella.])],
  [
    #v(2pt)
    Il riquadro #ui[La storia] elenca i file che fanno parte della storia:

    - il file *principale*, quello da cui la storia comincia;
    - i *moduli* che il principale include. La #ui[×] accanto a un modulo lo toglie dalla
      storia: sparisce la riga che lo include, il file resta sul disco.
    - #ui[Nuovo file] crea un file nuovo e lo include nella storia; #ui[Includi un file…]
      aggiunge un file che c'è già nella cartella.

    Il punto interrogativo in alto a destra apre una breve spiegazione di come si divide
    una storia in più file.

    Sotto c'è la cartella del progetto, con tutti i suoi file. Un clic apre un file.
  ],
)

== Una storia in più file

Quando una storia diventa lunga conviene dividerla: per esempio un file per le stanze,
uno per gli oggetti, uno per i dialoghi. «La Casa di Via Stradivari» è fatta così:
`storia.fav` è il principale e include gli altri due con due righe, di solito in cima.

#righe[
  #text(fill: c.cyan-bright)[Includi] #text(fill: c.emerald)["oggetti.fav"]#text(fill: c.amber)[.] \
  #text(fill: c.cyan-bright)[Includi] #text(fill: c.emerald)["dialoghi.fav"]#text(fill: c.amber)[.]
]

Stanze, oggetti, regole e dialoghi possono stare in qualunque file: il motore li legge
come una storia sola. Provare, riordinare, esportare e salvare lavorano sempre su tutta
la storia, qualunque file tu abbia davanti.

Quando crei qualcosa da un pannello, dove va a finire? Nel file indicato in alto a
destra nei pannelli, alla voce #ui[Le cose nuove vanno in] (capitolo 5). Le cose già
scritte, invece, si cambiano nel file in cui stanno.

#grid(
  columns: (1fr, 34%),
  column-gutter: 16pt,
  [
    #v(2pt)
    Per passare da un file all'altro senza Esplora c'è il nome del file nella barra in
    alto: un clic apre l'elenco #ui[File di questa storia], col principale segnato, e
    sotto gli eventuali #ui[Altri file del progetto].
  ],
  [#schermata("menu-file.png",
    alt: "L'elenco dei file della storia aperto dalla barra in alto: storia.fav principale, oggetti.fav, dialoghi.fav.",
    didascalia: [I file della storia, dalla barra in alto.])],
)

== Il testo

Il testo usa i colori del manuale: le parole del linguaggio in ciano, i testi fra
virgolette in verde, i punti in ambra, i commenti (le righe che cominciano con `#`) in
corsivo grigio. Funziona come un editor normale: #tasto("Ctrl", "F") cerca,
#tasto("Ctrl", "H") sostituisce, #tasto("Ctrl", "Z") annulla l'ultima cosa scritta.

I file aperti stanno nelle *schede* sopra il testo. Un pallino accanto al nome dice che
quel file ha modifiche non salvate; la #ui[×] chiude la scheda (se ci sono modifiche,
Studio chiede prima).

#tastiera[
  Sulle schede: le frecce #tasto("←") #tasto("→") passano da una all'altra,
  #tasto("Canc") chiude quella scelta.
]

== I problemi

Il motore controlla la storia mentre scrivi. Se qualcosa non va, la barra di stato in
basso lo dice (#ui[1 errore], #ui[2 avvisi]) e sulla sezione #ui[Storia] compare un
numero rosso. Un clic sulla barra di stato apre il pannello #ui[Problemi].

#schermata("problemi-pannello.png",
  alt: "Il pannello Problemi con un errore: «Proprietà 'sopra' per oggetto inesistente: 'La soffitta'», storia.fav, riga 209.",
  didascalia: [Il pannello #ui[Problemi]: che cosa non va, in quale file, a quale riga.])

Ogni problema dice che cosa non va, in quale file e a quale riga; un clic ti porta lì.
Gli *errori* (in rosso) impediscono alla storia di compilare: finché ci sono, i pannelli
mostrano #ui[La storia ha degli errori] con #ui[Vedi i problemi], e la prova non parte.
Gli *avvisi* (in ambra) sono consigli: la storia funziona, ma forse non come pensi (un
verbo che nessuna regola usa, un oggetto che nessuno potrà mai prendere…).

#consiglio[
  Nell'esempio della figura c'è una frase scritta apposta male: `La soffitta è sopra.`
  La soffitta è una stanza, e «sopra» non è una cosa che una stanza può essere. Il motore
  lo dice, e indica la riga giusta.
]

== Riordina

Dopo tanto lavoro, specie dai pannelli, il testo può essere in disordine: una stanza in
fondo, la sua descrizione in cima. #ui[Riordina] (#tasto("Ctrl", "Alt", "R")) rimette
tutto al suo posto, in ogni file della storia: le stanze con le loro descrizioni e
uscite, poi gli oggetti, le regole, i dialoghi. Le frasi non cambiano, cambia solo
l'ordine: la storia si gioca esattamente come prima.

Come ogni modifica, il riordino si annulla: con #ui[Annulla] in alto quando sei in un
pannello, con #tasto("Ctrl", "Z") quando sei nel testo.
