#import "../lib/guida.typ": *

= Personaggi e dialoghi

La sezione #ui[Personaggi] ha due linguette: #ui[Personaggi], per chi vive nella storia,
e #ui[Dialoghi], per quello che dice.

== I personaggi

#schermata("personaggi.png",
  alt: "La linguetta Personaggi: l'elenco con Il notaio e La vicina, e la scheda del notaio con Nome, Dove si trova, Descrizione.",
  didascalia: [La scheda del notaio.])

#ui[Nuovo personaggio] chiede il nome con l'articolo («Il notaio», «La vicina»), dove sta
e, se vuoi, com'è fatto in una frase. #ui[Crea il personaggio] lo scrive nella storia.

La scheda ha cinque riquadri:

- *Nome*, con #ui[Rinomina], come per stanze e oggetti;
- *Dove si trova*: la stanza (o #ui[da nessuna parte], se deve comparire più tardi);
- *Descrizione*: quello che il giocatore legge guardandolo;
- *Dialogo*: quante battute dice e da quale nodo comincia la conversazione, con
  #ui[Apri i dialoghi] (o #ui[Scrivi il suo dialogo], se non parla ancora);
- *Altri nomi*: le parole con cui il giocatore può chiamarlo («notaio», «uomo»).

Nell'elenco, il segno #ui[parla] indica i personaggi che hanno un dialogo.

== I dialoghi

Un dialogo di FAVELLA è fatto di *nodi*: un nodo è un momento della conversazione, con
la *battuta* del personaggio e le *risposte* che il giocatore può scegliere. Ogni
risposta chiude il dialogo o porta a un altro nodo, e può avere una condizione e delle
conseguenze.

#schermata("dialoghi.png",
  alt: "La linguetta Dialoghi: in alto Chi parla, con Il notaio che comincia da «tavolo» e La vicina da «soglia»; sotto Il copione, col nodo «tavolo», la battuta del notaio e tre risposte.",
  didascalia: [Chi parla, e il primo nodo del copione.])

*Chi parla.* Ogni personaggio con un dialogo e il nodo da cui la conversazione comincia
(#ui[comincia da]). Con #ui[fai parlare un oggetto…] e #ui[Fallo parlare] dai la parola
anche a un oggetto (un pappagallo, una radio, uno specchio): diventa un personaggio. La
#ui[×] fa il contrario: l'oggetto resta, ma non è più un personaggio.

*Il copione.* Un riquadro per ogni nodo:

- in alto l'*etichetta* del nodo (un nome breve che scegli tu, come «tavolo»; la matita
  la rinomina e aggiorna tutti i riferimenti), chi parla, la *stellina* — piena sul nodo
  da cui comincia il dialogo di quel personaggio; un clic la sposta — e il cestino, che
  elimina il nodo;
- la *battuta*, che si scrive direttamente;
- le *risposte*: il testo, poi #ui[chiude] o #ui[→ nodo] con il nome del nodo dove
  porta. L'ingranaggio apre la risposta intera, la #ui[×] la toglie. Le condizioni e le
  conseguenze di una risposta compaiono accanto, come piccole etichette («se il
  giocatore ha Le lettere», «aumenta indizi»);
- #ui[\+ Risposta] ne aggiunge una.

Se una risposta porta a un nodo che non ha ancora una battuta, il nodo compare con
#ui[(senza battuta)] e il pulsante #ui[Aggiungi la battuta].

== Un nodo nuovo, una risposta completa

#coppia("nuovo-nodo.png", "risposta.png",
  alt-a: "La finestra Nuovo nodo: chi parla, l'etichetta del nodo, la battuta.",
  alt-b: "La finestra Modifica la risposta: il testo, chiude il dialogo o porta a un altro nodo, la condizione e le conseguenze.",
  didascalia: [A sinistra un nodo nuovo; a destra una risposta aperta con l'ingranaggio.])

#ui[Nuovo nodo] chiede chi parla, l'etichetta del nodo e la battuta. La finestra di una
risposta ha il testo, #ui[Cosa fa questa scelta] (#ui[chiude il dialogo] o #ui[porta a
un altro nodo]), #ui[Solo se…] per una condizione e #ui[Fai questo…] per le conseguenze:
sono gli stessi mattoni delle regole, spiegati nel prossimo capitolo.

#consiglio[
  Scrivi prima la conversazione principale, poi le deviazioni. Una risposta può portare a
  un nodo che non esiste ancora: scrivi il nome, e il nodo compare nel copione pronto da
  riempire.
]
