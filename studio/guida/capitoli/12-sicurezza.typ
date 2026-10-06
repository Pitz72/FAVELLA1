#import "../lib/guida.typ": *

= Lavorare senza paura

Studio è fatto perché tu possa provare: cambiare, eliminare, tornare indietro. Questo
capitolo raccoglie le reti di sicurezza.

== Annullare

Ci sono due modi di annullare, secondo dove sei.

- *Nel testo* (sezione #ui[Storia]), #tasto("Ctrl", "Z") annulla l'ultima cosa scritta,
  come in qualunque editor.
- *Nei pannelli*, in alto compare #ui[Annulla]: annulla l'ultima modifica fatta da un
  pannello — una stanza creata, un'uscita cambiata, una regola eliminata, un riordino —
  anche se ha toccato file che non hai aperto. Passandoci sopra col mouse leggi che cosa
  annullerà. Lo stesso fa #tasto("Ctrl", "Z") quando non stai scrivendo in un campo.

Dopo un'eliminazione compare in basso a destra un avviso, con il suo #ui[Annulla] a
portata di mano.

#schermata("avviso.png",
  alt: "L'avviso «Il vaso di gerani» eliminato, con il pulsante Annulla.",
  didascalia: [Eliminato. E se non volevi, #ui[Annulla].])

#nota[
  Se dopo una modifica dai pannelli hai cambiato a mano lo stesso testo, #ui[Annulla] non
  può più tornare indietro senza cancellare quello che hai scritto: Studio te lo dice e
  ti suggerisce di usare #tasto("Ctrl", "Z") nel testo.
]

== Le modifiche non salvate

Studio non perde il lavoro non salvato. Se provi a chiudere l'app, ad aprire o creare
un'altra storia, o a chiudere una scheda con delle modifiche, prima te lo chiede.

#schermata("non-salvati.png",
  alt: "La finestra Ci sono modifiche che non hai ancora salvato, con i pulsanti Annulla, Non salvare e Salva.",
  didascalia: [Prima di andare oltre, Studio chiede.])

- #ui[Salva] salva tutto e prosegue;
- #ui[Non salvare] prosegue e le modifiche vanno perse;
- #ui[Annulla] (o #tasto("Esc")) non fa niente e ti lascia dov'eri.

Anche un aggiornamento di Studio passa da questa domanda prima di installarsi.

== Quando qualcosa va storto

Se un pannello incontra un errore, l'errore resta chiuso lì: il resto di Studio continua
a funzionare. Al posto del pannello leggi che cosa è successo e trovi tre pulsanti:
#ui[Salva tutto] (per mettere al sicuro il lavoro), #ui[Riprova] e #ui[Torna al testo].

Se la storia ha degli errori, i pannelli non possono leggerla: mostrano #ui[La storia ha
degli errori] con #ui[Vedi i problemi]. Correggi nel testo (capitolo 4) e i pannelli
tornano.

== Rinominare in sicurezza

#ui[Rinomina] (stanze, oggetti, personaggi, nodi di dialogo) cambia il nome in tutte le
frasi che lo usano, in tutti i file della storia, e poi ricompila per controllare che
tutto torni. Non tocca i testi tra virgolette — descrizioni, battute, risposte — perché
lì il nome potrebbe essere scritto in un altro modo («la vecchia cucina», «in cucina»):
se serve, cambialo tu.

== Dove sono le tue storie

Una storia è una cartella con dei file `.fav`. Non c'è nient'altro: niente database,
niente file nascosti di Studio. Quindi:

- per fare una *copia di sicurezza*, copia la cartella;
- per *lavorare su una versione nuova* senza toccare la vecchia, usa #ui[Salva il
  progetto come…] (freccia accanto a #ui[Salva], o menu #puntini): copia tutta la
  cartella, comprese le modifiche non ancora salvate, in una cartella nuova e vuota, e
  continua a lavorare lì;
- #ui[Salva con nome…] (#tasto("Ctrl", "Maiusc", "S")) fa invece una copia del *solo
  file* che hai davanti, dentro lo stesso progetto.

#schermata("menu-salva.png",
  alt: "Il menu accanto a Salva: Salva con nome e Salva il progetto come, con la spiegazione.",
  didascalia: [I due modi di salvare altrove.], larghezza: 46%)
