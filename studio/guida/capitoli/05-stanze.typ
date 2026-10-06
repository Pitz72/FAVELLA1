#import "../lib/guida.typ": *

= Mondo: le stanze

La sezione #ui[Mondo] ha tre linguette: #ui[Stanze], #ui[Oggetti] e #ui[Mappa]. Le
sezioni con i pannelli (#ui[Mondo], #ui[Personaggi], #ui[Regole]) sono fatte tutte allo
stesso modo, e quello che impari qui vale anche per le altre.

#schermata("stanze.png",
  alt: "La sezione Mondo, linguetta Stanze: a sinistra l'elenco delle otto stanze con L'ingresso scelta, a destra la sua scheda con i riquadri Nome e Punto di partenza.",
  didascalia: [#ui[Mondo] › #ui[Stanze], con la scheda dell'ingresso.])

== Com'è fatto un pannello

- *In alto*, il titolo della sezione con una riga che dice a che cosa serve, e le
  linguette.
- *A destra in alto*, #ui[Le cose nuove vanno in]: il file della storia dove Studio
  scrive le cose che crei (capitolo 4). Le cose che esistono già si cambiano nel file in
  cui stanno, qualunque sia questa scelta.
- *Sempre a destra*, l'interruttore #ui[Testo accanto]: mostra il testo della storia
  vicino al pannello, così vedi le frasi cambiare mentre lavori.
- *A sinistra*, l'elenco: quante sono, il pulsante per crearne una nuova e, quando sono
  più di otto, un campo #ui[Cerca…].
- *A destra*, la scheda di quella che hai scelto, divisa in riquadri; in fondo, quando
  serve, il riquadro per eliminarla.

#schermata("testo-accanto.png",
  alt: "La scheda di una stanza con, accanto, il testo della storia aperto alla stessa stanza.",
  didascalia: [Con #ui[Testo accanto] acceso, il testo sta vicino al pannello.])

#tastiera[
  Nell'elenco: #tasto("↑") e #tasto("↓") scorrono le voci, #tasto("Home") e
  #tasto("Fine") vanno alla prima e all'ultima. Le linguette si cambiano con le frecce
  quando hanno il fuoco.
]

== Creare una stanza

#passi(
  [Scegli #ui[Nuova stanza].],
  [Scrivi il nome *con l'articolo*: «La cantina», «Lo studio», «L'ingresso». L'articolo
    serve al motore per scrivere frasi giuste («nella cantina», «dallo studio»).],
  [Se vuoi, collegala subito a una stanza che c'è già: #ui[Collegala a] e #ui[Da lì,
    verso] (per esempio: da L'ingresso, verso basso).],
  [Scegli #ui[Crea la stanza].],
)

#schermata("nuova-stanza.png",
  alt: "Il riquadro Nuova stanza: il nome con l'articolo, Collegala a, Da lì verso, e i pulsanti Annulla e Crea la stanza.",
  didascalia: [Una stanza nuova, già collegata.], larghezza: 80%)

Se il nome è già usato da un'altra stanza, da un oggetto o da un personaggio, Studio lo
dice e non crea niente: in FAVELLA due cose con lo stesso nome diventerebbero una sola.

== La scheda di una stanza

*Nome.* Cambia il nome e scegli #ui[Rinomina]: Studio lo cambia in tutte le frasi che
citano la stanza, anche negli altri file della storia. I testi che scrivi tu (le
descrizioni, le risposte dei personaggi) non si toccano: se dentro c'è il vecchio nome,
lì resta.

*Punto di partenza.* La casella #ui[Il giocatore comincia in questa stanza]. La stanza
di partenza ha la bandierina nell'elenco e il segno #ui[partenza]. Per spostare la
partenza, scegli un'altra stanza e spunta la sua casella.

*Descrizione.* Quello che il giocatore legge quando entra. Scrivi e poi scegli #ui[Scrivi
la descrizione]; #ui[Lascia com'era] rimette il testo di prima. Se la stanza ha una
descrizione che cambia (una frase con «se…», come l'ingresso quando scoppia il temporale),
il pannello non la tocca: ti mostra #ui[Vai al testo] e la cambi lì.

== Le uscite

#schermata("uscite.png",
  alt: "Il riquadro Uscite dell'ingresso: nord verso Il salotto, ovest verso Lo studio, est verso La cucina, basso verso La cantina; sotto, la riga per aggiungere un'uscita.",
  didascalia: [Le uscite dell'ingresso.])

Ogni riga è un'uscita: una *direzione* e la *stanza* dove porta. Si cambiano dai due
menu, si tolgono con la #ui[×]. Per aggiungerne una scegli la direzione e la stanza
nell'ultima riga e poi #ui[Aggiungi l'uscita].

Il ritorno si scrive da solo: se dall'ingresso vai a nord nel salotto, dal salotto torni
a sud nell'ingresso. Un'uscita scritta dall'altra parte ha il segno #ui[ritorno].

Le direzioni di sempre sono nord, sud, est, ovest, le diagonali, su e giù. Se ne vuoi
un'altra puoi inventarla (la Casa ha due coppie sue, «alto» e «basso», «sopra» e
«sotto», ed è per questo che le trovi nel menu): nel menu della direzione scegli
#ui[nuova direzione…] e scrivi la parola per andare e la sua opposta per tornare,
per esempio «botola» e «scala».

== Eliminare una stanza

In fondo alla scheda c'è #ui[Elimina la stanza…]. Prima di eliminare, Studio cerca tutte
le frasi che la citano e te le mostra, divise per tipo e col nome del file.

#schermata("elimina.png",
  alt: "La finestra Eliminare «La soffitta»?: le cinque frasi che vanno via insieme alla stanza, divise in Dove si trovano, Definizione, Descrizione, Uscite; in fondo Annulla ed Elimina 5 frasi.",
  didascalia: [Prima di eliminare, che cosa se ne va.])

Sotto l'elenco, le conseguenze da sapere: le cose che stavano nella stanza restano senza
posto e vanno rimesse da qualche parte; se era la partenza, la partita comincerà dalla
prima stanza; il nome scritto nei testi resta. #ui[Elimina 5 frasi] conferma.

#consiglio[
  Un'eliminazione si annulla subito: in basso compare un avviso con #ui[Annulla]
  (capitolo 12).
]
