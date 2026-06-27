#import "../lib/manuale-template.typ": *

#let kw(s) = text(font: font-mono, size: 8pt, fill: c.cyan-dark)[#s]
#let rip(s) = text(font: font-mono, size: 8.5pt, fill: c.ink)[#s]

= Riepilogo del linguaggio

Questo capitolo è da consultazione, non da lettura. Tieni il dito qui quando
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
  [Definizioni], [#kw[è · sono · una · un · uno · stanza · cosa · contenitore · supporto · personaggio · comando · senza · oggetto · stato · contatore · prendibile]],
  [Articoli], [#kw[il · lo · la · i · gli · le · l' · un']],
  [Preposizioni], [#kw[di · del · dei · della · dell' · degli · delle · dello · in · nel · nella · nello · negli · nelle · nell' · su · sul · sulla · sullo · sui · sugli · sulle · con · contro · a]],
  [Mondo], [#kw[descrizione · collega · giocatore · comincia · inizia · parte · ha · una · di · sequenza]],
  [Buio e luce], [#kw[buia · buio · illumina]],
  [Trasporto], [#kw[può · portare · oggetti · dà · spazi]],
  [Regole e logica], [#kw[Invece · se · dire · e · adesso · oppure · non · ha · come]],
  [Stati e contatori], [#kw[aumenta · diminuisci · diventa · da · partono · almeno · massimo · meno · più]],
  [Quantità e caso], [#kw[fra · numero · càpita]],
  [Fine partita], [#kw[vinci · perdi · termina]],
  [Opposte, alias, sinonimi], [#kw[opposte · direzioni · si · chiama · anche · come]],
  [Tempo e demoni], [#kw[Al · turno · turni · Ogni · Quando · vera]],
  [Personaggi e dialoghi], [#kw[dialogo · nodo · dice · opzione · conduce · chiude · va · cambia]],
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
La descrizione della cucina è una di: "...", "...".
La descrizione della cucina è in sequenza: "...", "...".
La cucina collega est a il giardino.
Alto e basso sono direzioni opposte.
La cantina è buia.
Il giocatore comincia in ingresso.
```)

*Oggetti, proprietà, contenitori*
#fav(```
La torcia è una cosa.
La torcia è prendibile.
La torcia è sul tavolino.
La torcia è spenta.
La torcia illumina.
La torcia si chiama anche "pila".
Il giocatore ha la torcia.
Accesa e spenta sono opposte.
La credenza è un contenitore.
Il tavolino è un supporto.
"accendi" è un comando.
"accelera" è un comando senza oggetto.
"ghermisci" è come prendi.
```)

*Stati e contatori*
#fav(```
La verità è uno stato.
La verità è ignota.
Gli indizi è un contatore.
La calma parte da 3.
Le vite sono un contatore.
Le vite partono da 3.
```)

*Regole e conseguenze*
#fav(```
Invece di [verbo] [oggetto] se [condizione]: dire "..." e adesso [conseguenza].
Invece di usa [ogg1] su [ogg2] se [condizione]: dire "...".
Invece di [verbo]: [conseguenza].   # il «dire "..."» è facoltativo
# operando (quantità): N · [contatore] · un numero fra A e B
# conseguenze: [ogg] è [proprietà] · [ogg] è in [luogo] · [ogg] è nel nulla ·
#              aumenta/diminuisci [contatore] di [operando] · [contatore] diventa [operando] ·
#              [stato] è [valore] · [stato] diventa [altro stato] ·
#              [stato] diventa uno fra A, B, C · [stanza] diventa buia/illuminata ·
#              il giocatore è in [stanza] · [personaggio] va nel [stanza] ·
#              [personaggio] cambia stanza · vinci/perdi/termina "...".
# condizioni:  il giocatore ha [ogg] · [ogg] è [proprietà] · [stato] è [valore] ·
#              [stato] è come [altro stato] · càpita (N su M) ·
#              [contatore] è almeno/al massimo/più di/meno di/non è N (o [altro contatore]) ·
#              A e B · A oppure B · non [...] · non ( A e B ).
```)

*Tempo, demoni, dialoghi, moduli*
#fav(```
Al turno 8: dire "..." e adesso [conseguenza].
Ogni 5 turni: dire "...".
Ogni 3 turni: diminuisci il carburante.
Ogni turno se [condizione]: dire "..." e adesso [conseguenza].
Quando [condizione] diventa vera: dire "...".
Il notaio è un personaggio.
Il dialogo del notaio comincia con "tavolo".
Il notaio al nodo "tavolo" dice "...".
Il notaio al nodo "tavolo" dice "..." se [condizione].
Al nodo "tavolo" l'opzione "..." se [condizione] conduce al nodo "..." e adesso [conseguenza].
Includi "oggetti.fav".
```)

== I comandi del giocatore

Sono i verbi che chi gioca può digitare. Molti hanno sinonimi, e ai loro effetti
puoi sovrapporti con le regole `Invece di`. Il capitolo «I comandi del giocatore»
li racconta per esteso; qui sono raccolti per consultazione.

#table(
  columns: (auto, 1fr),
  stroke: 0.4pt + c.rule,
  inset: 6pt,
  align: (left + top, left + top),
  table.header([*Comando*], [*Effetto*]),
  [#rip[nord, sud, est, ovest]], [Spostarsi (anche `n`, `s`, `e`, `o`, le direzioni personalizzate, `vai nord`).],
  [#rip[prendi / lascia]], [Raccogliere o posare un oggetto prendibile.],
  [#rip[esamina]], [Guardare da vicino un oggetto e leggerne la descrizione.],
  [#rip[guarda]], [Rivedere la descrizione della stanza e cosa c'è.],
  [#rip[inventario]], [Vedere cosa porti con te (anche `i`).],
  [#rip[usa X con Y]], [Far interagire due oggetti.],
  [#rip[metti X in/su Y]], [Posare un oggetto dentro un contenitore o su un supporto.],
  [#rip[parla con X]], [Avviare il dialogo con un personaggio.],
  [#rip[prendila, aprilo, ...]], [Pronomi: si riferiscono all'ultima cosa nominata (anche `prendi quella`).],
  [#rip[annulla]], [Disfare l'ultimo turno (anche `disfa`).],
  [#rip[ancora]], [Ripetere l'ultimo comando (anche `ripeti`, `g`).],
  [#rip[trascrizione]], [Avviare o fermare il salvataggio della partita su file.],
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
