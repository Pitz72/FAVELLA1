#import "../lib/guida.typ": *

= Benvenuto in Favella Studio

Favella Studio è il posto dove si scrive una storia in FAVELLA 1. In FAVELLA il codice
è una frase italiana col punto in fondo: scrivi `La cucina è una stanza.` e la cucina
esiste, pronta da esplorare. Studio ti aiuta a scrivere quelle frasi, a vederle
diventare un mondo e a provarle come le giocherebbe chi riceve la tua avventura.

Dentro c'è il motore vero del linguaggio, lo stesso del terminale e del sito: quello che
provi qui è quello che giocherà il tuo lettore. Non serve installare Python né altro.

== Il testo e i pannelli sono la stessa cosa

Una storia di FAVELLA è un file di testo con l'estensione `.fav`. Studio te lo fa
scrivere in due modi, che si possono mescolare come vuoi:

- *nel testo*, frase per frase, nella sezione #ui[Storia];
- *dai pannelli*: stanze, oggetti, mappa, personaggi, dialoghi, regole. Ogni volta che
  crei o cambi qualcosa da un pannello, Studio scrive (o riscrive) la frase giusta nel
  file.

Per esempio, creare dal pannello una stanza che si chiama «La cantina» aggiunge al file
la riga `La cantina è una stanza.` Non ci sono formati nascosti né database: la tua
storia è sempre e solo testo, che puoi aprire con qualunque editor, copiare, spedire,
tenere sotto controllo di versione. L'interruttore #ui[Testo accanto] (capitolo 5) mostra
il testo vicino a qualunque pannello, così vedi nascere le frasi mentre lavori.

#nota[
  Questa guida spiega l'app. Il linguaggio — come si scrive una regola, che cosa può fare
  un demone, come si costruisce un dialogo — lo spiega il *Manuale di Programmazione* di
  FAVELLA 1, gratuito in PDF su #link("https://www.favella.eu/manuale")[www.favella.eu]. Le
  due cose vanno bene insieme: i pannelli ti fanno vedere quali frasi esistono, il
  manuale ti dice tutto quello che possono dire.
]

== La storia d'esempio

Gli esempi di questa guida usano «La Casa di Via Stradivari», la stessa storia del
manuale: tua zia Adele è morta da tre giorni, sei venuto per firmare e chiudere, ma la
casa ha ancora qualcosa da dire. Ha otto stanze, una ventina di oggetti, due personaggi
con i loro dialoghi, regole, eventi e tre finali.

Per seguire la guida passo per passo, aprila anche tu:

#passi(
  [Nella prima schermata di Studio scegli #ui[Prova con la storia d'esempio]; se hai già
    un progetto aperto, apri il menu #puntini in alto a destra e scegli #ui[Apri la storia
    d'esempio].],
  [Studio la copia, la prima volta, nella cartella *Documenti › Favella Studio › La Casa
    di Via Stradivari* e la apre.],
  [Le volte dopo riapre la stessa copia, con le modifiche che ci hai fatto. Se vuoi
    ripartire da capo, cancella quella cartella: la prossima volta Studio ne fa una
    copia nuova.],
)

== Come leggere questa guida

- I nomi che vedi sullo schermo — pulsanti, voci di menu, campi — sono scritti così:
  #ui[Prova la storia].
- I tasti sono disegnati come tasti: #tasto("Ctrl", "S") vuol dire «tieni premuto Ctrl e
  premi S». Su macOS, al posto di #tasto("Ctrl") si usa #tasto("Cmd").
- Le frasi della storia sono scritte come codice: `Il giocatore comincia nell'ingresso.`
- I riquadri #text(fill: c.cyan-dark, weight: 700)[Da tastiera] dicono come fare la
  stessa cosa senza mouse: in Studio tutto si raggiunge dalla tastiera.

Le schermate sono state prese da Favella Studio #STUDIO col tema chiaro, «carta»: sulla
pagina bianca si leggono meglio. Studio si apre col tema scuro, «notte»; nel capitolo 13
vedi come cambiarlo e come ingrandire tutta l'interfaccia.
