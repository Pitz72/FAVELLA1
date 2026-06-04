#import "../lib/manuale-template.typ": *

#let kw(s) = text(font: font-mono, size: 8pt, fill: c.cyan-dark)[#s]
#let rip(s) = text(font: font-mono, size: 8.5pt, fill: c.ink)[#s]

= Riepilogo del linguaggio

Questo capitolo è da consultazione, non da lettura. Tieni la dita qui quando
scrivi: trovi le parole che FAVELLA si tiene per sé, tutti i costrutti in una
pagina, e i comandi che il giocatore ha a disposizione.

== Le parole riservate

Hanno un significato per la grammatica e non possono fare *da sole* il nome di una
stanza o di un oggetto. Possono però comparire *dentro* un nome più lungo (`la
porta a est` è un nome valido, anche se `est` è riservata).

#table(
  columns: (auto, 1fr),
  stroke: 0.4pt + c.rule,
  inset: 6pt,
  align: (left + top, left + top),
  table.header([*Categoria*], [*Parole*]),
  [Definizioni], [#kw[è · sono · una · un · uno · stanza · cosa · contenitore · supporto · personaggio · comando · stato · contatore · prendibile]],
  [Articoli], [#kw[il · lo · la · i · gli · le · l' · un']],
  [Preposizioni], [#kw[di · del · dei · della · dell' · degli · delle · dello · in · nel · nella · nello · negli · nelle · nell' · su · sul · sulla · sullo · sui · sugli · sulle · con · contro · a]],
  [Mondo], [#kw[descrizione · collega · giocatore · comincia · inizia · parte]],
  [Trasporto], [#kw[può · portare · oggetti · dà · spazi]],
  [Regole e logica], [#kw[Invece · se · dire · e · adesso · oppure · non · ha]],
  [Stati e contatori], [#kw[aumenta · diminuisci · diventa · da · almeno · massimo · meno · più]],
  [Fine partita], [#kw[vinci · perdi · termina]],
  [Opposte e alias], [#kw[opposte · direzioni · si · chiama · anche]],
  [Tempo e demoni], [#kw[Al · turno · turni · Ogni · Quando · vera]],
  [Dialoghi], [#kw[dialogo · nodo · dice · opzione · conduce · chiude]],
  [Moduli], [#kw[Includi]],
  [Nomi speciali], [#kw[nulla · inventario]],
  [Direzioni di base], [#kw[nord · sud · est · ovest · n · s · e · o]],
)

#nota[
  Il vocabolario *nuovo* — alias, verbi personalizzati, etichette dei nodi e testi
  delle opzioni, percorsi di `Includi` — si introduce sempre fra virgolette, e per
  questo non entra mai in conflitto con le parole riservate.
]

== I costrutti in breve

*Mondo*
#fav(```
La cucina è una stanza.
La descrizione della cucina è "...".
La descrizione della cucina se [condizione] è "...".
La cucina collega est a il giardino.
Alto e basso sono direzioni opposte.
Il giocatore comincia in ingresso.
```)

*Oggetti, proprietà, contenitori*
#fav(```
La torcia è una cosa.
La torcia è prendibile.
La torcia è sul tavolino.
La torcia è spenta.
La torcia si chiama anche "pila".
Accesa e spenta sono opposte.
La credenza è un contenitore.
Il tavolino è un supporto.
"accendi" è un comando.
```)

*Stati e contatori*
#fav(```
La verita è uno stato.
La verita è ignota.
Gli indizi è un contatore.
La calma parte da 3.
```)

*Regole e conseguenze*
#fav(```
Invece di [verbo] [oggetto] se [condizione]: dire "..." e adesso [conseguenza].
Invece di usa [ogg1] su [ogg2] se [condizione]: dire "...".
# conseguenze: [ogg] è [proprietà] · [ogg] è in [luogo] · [ogg] è nel nulla ·
#              aumenta/diminuisci [contatore] · [contatore] diventa N ·
#              [stato] è [valore] · il giocatore è in [stanza] ·
#              vinci/perdi/termina "...".
# condizioni:  il giocatore ha [ogg] · [ogg] è [proprietà] · [stato] è [valore] ·
#              [contatore] è almeno/al massimo/più di/meno di/non è N ·
#              A e B · A oppure B · non [...] · non ( A e B ).
```)

*Tempo, demoni, dialoghi, moduli*
#fav(```
Al turno 8: dire "..." e adesso [conseguenza].
Ogni 5 turni: dire "...".
Ogni turno se [condizione]: dire "..." e adesso [conseguenza].
Quando [condizione] diventa vera: dire "...".
Il notaio è un personaggio.
Il dialogo del notaio comincia con "tavolo".
Il notaio al nodo "tavolo" dice "...".
Al nodo "tavolo" l'opzione "..." se [condizione] conduce al nodo "..." e adesso [conseguenza].
Includi "oggetti.fav".
```)

== I comandi del giocatore

Sono i verbi che chi gioca può digitare. Molti hanno sinonimi, e ai loro effetti
puoi sovrapporti con le regole `Invece di`.

#table(
  columns: (auto, 1fr),
  stroke: 0.4pt + c.rule,
  inset: 6pt,
  align: (left + top, left + top),
  table.header([*Comando*], [*Effetto*]),
  [#rip[nord, sud, est, ovest]], [Spostarsi (anche `n`, `s`, `e`, `o`, e le direzioni personalizzate).],
  [#rip[prendi / lascia]], [Raccogliere o posare un oggetto prendibile.],
  [#rip[esamina]], [Guardare da vicino un oggetto e leggerne la descrizione.],
  [#rip[guarda]], [Rivedere la descrizione della stanza e cosa c'è.],
  [#rip[inventario]], [Vedere cosa porti con te (anche `i`).],
  [#rip[usa X con Y]], [Far interagire due oggetti.],
  [#rip[metti X in/su Y]], [Posare un oggetto dentro un contenitore o su un supporto.],
  [#rip[parla con X]], [Avviare il dialogo con un personaggio.],
  [#rip[aiuto]], [Elenco dei comandi disponibili.],
  [#rip[esci]], [Chiudere il dialogo in corso, o uscire dal gioco.],
)

== La storia guida

Tutti gli esempi di questo manuale vengono da *La Casa di Via Stradivari*, che
trovi per intero in `esempi/materiale-didattico/`, divisa nei suoi tre file:
`storia.fav` (stanze, stati, eventi, demoni, regole), `oggetti.fav` (oggetti,
proprietà, alias, verbi) e `dialoghi.fav` (i due personaggi). È un'avventura
completa e vincibile: leggerla intera, ora che conosci il linguaggio, è il modo
migliore per vedere come i pezzi stanno insieme.

Buona scrittura. Adesso la casa è tua.
