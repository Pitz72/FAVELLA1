#import "../lib/guida.typ": *

= Mondo: gli oggetti

Gli oggetti sono le cose della storia: da guardare, da prendere, da aprire, da usare. La
linguetta #ui[Oggetti] è fatta come quella delle stanze: l'elenco a sinistra, con la
ricerca, e la scheda a destra.

#schermata("oggetti.png",
  alt: "La linguetta Oggetti: l'elenco con La torcia scelta e la sua scheda con Nome e Che cos'è e dove sta.",
  didascalia: [La scheda della torcia.])

Nell'elenco, l'icona dice che cos'è (un oggetto, un contenitore, un supporto) e il segno
#ui[senza posto] avverte quando un oggetto non sta da nessuna parte: nessun giocatore lo
troverà finché non gli dai un posto (o finché una regola non lo fa comparire).

== Creare un oggetto

#passi(
  [Scegli #ui[Nuovo oggetto].],
  [Scrivi il nome con l'articolo («La torcia», «Le lettere»).],
  [In #ui[Che cos'è] scegli *Oggetto* (una cosa qualunque), *Contenitore* (ci si mette
    dentro qualcosa: una scatola, un cassetto) o *Supporto* (ci si appoggia sopra
    qualcosa: un tavolo, una mensola).],
  [In #ui[Dove sta] scegli la stanza, oppure lasciala #ui[da nessuna parte].],
  [Scegli #ui[Crea l'oggetto].],
)

== La scheda di un oggetto

*Nome* e #ui[Rinomina], come per le stanze.

*Che cos'è e dove sta.* Il #ui[Tipo], e la #ui[Posizione]: in una stanza, dentro un
contenitore o sopra un supporto (il menu li divide così). La casella #ui[Il giocatore lo
può prendere] lo rende prendibile. #ui[Dà spazi in più (come uno zaino)] dice quanti
oggetti in più il giocatore può portare quando ha questo con sé.

*Che cosa c'è dentro* (o *sopra*), solo per contenitori e supporti: l'elenco di quello
che contengono, con la #ui[×] per toglierlo, e un menu per metterci un oggetto.

#schermata("contenitore.png",
  alt: "Il riquadro «Che cosa c'è dentro» di un contenitore.",
  didascalia: [Quello che c'è dentro un contenitore.])

*Descrizione.* Quello che il giocatore legge quando lo esamina; anche qui, una
descrizione che cambia con «se…» si modifica nel testo.

*Stati a due valori.* Aperta o chiusa, accesa o spenta. Ogni coppia ha tre pulsanti: uno
dei due valori, o #ui[nessuno dei due] se all'oggetto la coppia non interessa. Una coppia
vale per tutti gli oggetti della storia: se ne aggiungi una nuova con #ui[Nuova coppia di
opposti…] (per esempio «compatta» e «scavata»), compare in tutte le schede.

#schermata("oggetti-stati.png",
  alt: "Il riquadro Stati a due valori: accesa/spenta con spenta scelto, aperta/chiusa e compatta/scavata con nessuno dei due, e Nuova coppia di opposti.",
  didascalia: [La torcia è spenta; aperta o chiusa, per lei, non vuol dire niente.])

*Altre proprietà.* Parole libere che le regole possono controllare: «rotta»,
«bagnata», «notata». Si aggiungono col campo in basso e si tolgono con la #ui[×].

*Altri nomi.* Le parole con cui il giocatore può chiamare l'oggetto: «lanterna» per «la
torcia». Più nomi metti, meno il giocatore resta bloccato a cercare la parola giusta.

#schermata("oggetti-nomi.png",
  alt: "Il riquadro Altri nomi, coi nomi già dati e il campo per aggiungerne uno.",
  didascalia: [Gli altri nomi di un oggetto. Il riquadro delle proprietà è fatto allo stesso modo.])

== Quanto porta il giocatore

In fondo all'elenco degli oggetti c'è #ui[Il giocatore ne porta al massimo]: quanti
oggetti può tenere con sé. Vuoto (∞) vuol dire quanti ne vuole. Gli oggetti che «danno
spazi in più» si aggiungono a questo numero.

#nota[
  I personaggi sono oggetti speciali e hanno la loro sezione, #ui[Personaggi]
  (capitolo 8): qui non compaiono.
]
