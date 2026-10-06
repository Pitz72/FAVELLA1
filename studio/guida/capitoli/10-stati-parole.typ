#import "../lib/guida.typ": *

= Stati, contatori e parole

== Stati e contatori

Il mondo di una storia ricorda delle cose. Uno *stato* ricorda una parola: la verità è
«ignota» o «svelata», il temporale è «lontano» o «scoppiato». Un *contatore* ricorda un
numero che sale e scende: la calma della vicina, gli indizi raccolti. Le regole li
leggono nelle condizioni e li cambiano con le conseguenze.

#schermata("stati.png",
  alt: "La linguetta Stati e contatori: gli stati temporale (lontano) e verità (ignota) e il contatore calma, che parte da 3.",
  didascalia: [Due stati e un contatore della Casa di Via Stradivari.])

*Uno stato* mostra i suoi valori come gettoni; quello con la stellina è il valore con cui
la storia comincia. Un clic su un altro valore lo fa diventare quello iniziale. Il campo
in basso aggiunge un valore (#ui[\+ valore]), la #ui[×] su un gettone lo toglie. I valori
che elenchi qui sono quelli che i menu delle regole ti propongono.

*Un contatore* ha il numero da cui parte (#ui[parte da]); nelle regole si usa con
#ui[aumenta], #ui[diminuisci] e #ui[diventa].

#ui[Nuovo stato o contatore] chiede il #ui[Tipo] (#ui[Stato (a parole)] o #ui[Contatore
(numero)]), il #ui[Nome], il #ui[Valore iniziale] e, per uno stato, se vuoi, gli altri
valori ammessi. La #ui[×] in alto a destra di una scheda elimina lo stato o il contatore.

== Parole e comandi

La linguetta #ui[Parole e comandi] riguarda il modo in cui il giocatore comanda.

#schermata("parole.png",
  alt: "La linguetta Parole e comandi: Come comanda il giocatore con tre scelte, e l'elenco dei verbi inventati: accendi, spegni, forza, scava, brucia, firma.",
  didascalia: [Come comanda il giocatore, e i verbi inventati.])

*Come comanda il giocatore.* Tre modi:

- #ui[Scrivere o toccare]: chi gioca scrive i comandi, oppure li compone con i
  pulsanti-verbo (è il modo predefinito, se non dici niente);
- #ui[Solo scrivere]: niente pulsanti, come nelle avventure testuali di una volta;
- #ui[Solo pulsanti]: ogni frase si compone toccando verbi e oggetti; ideale per il
  telefono.

Scegliere una voce aggiunge alla storia la frase che lo dice.

*I verbi inventati da te.* Un verbo che il motore non conosce («lancia», «accelera»,
«firma») si dichiara qui: scrivilo, spunta #ui[senza oggetto] se si usa da solo
(«ricorda»), e scegli #ui[Aggiungi il verbo]. Poi gli serve una regola che dica che cosa
succede (capitolo 9). #ui[Nel testo] porta alla frase che lo dichiara.

*Parole che valgono come un'altra.* I sinonimi: «ghermisci» vale «prendi». Scrivi una
regola per «prendi» e funziona anche per «ghermisci». Se cambi apposta il significato di
una parola che il motore conosce già, spunta #ui[voluto]: così il motore non te lo
segnala come un possibile errore.
