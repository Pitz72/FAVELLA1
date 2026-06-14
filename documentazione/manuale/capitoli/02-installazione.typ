#import "../lib/manuale-template.typ": *

#let cmd(s) = text(font: font-mono, size: 8.5pt, fill: c.ink)[#s]

= Installare e avviare FAVELLA

Prima di scrivere una storia serve avere FAVELLA sul computer. La buona notizia è
che non devi installare Python, clonare niente, né capire una riga di codice
altrui: c'è un solo file da scaricare, ed è già tutto dentro.

== Da dove si scarica

FAVELLA si distribuisce come *installer* pronto, uno per ogni sistema operativo.
Li trovi nella pagina delle versioni del progetto, sotto «Releases»: prendi quello
del tuo computer e basta.

#table(
  columns: (auto, 1fr),
  stroke: 0.4pt + c.rule,
  inset: 6pt,
  align: (left + top, left + top),
  table.header([*Sistema*], [*File da scaricare*]),
  [Windows], [#cmd[favella1-setup-«versione»-windows-x64.exe]],
  [macOS (Apple Silicon)], [#cmd[favella1-«versione»-macos-arm64.dmg]],
  [Linux], [#cmd[favella1-«versione»-linux-x86_64.AppImage]],
)

Su Windows lancia l'installer e segui i passi: al termine trovi FAVELLA nel menu
Start, con una scorciatoia già pronta per il laboratorio. Su macOS apri il `.dmg` e
trascini la cartella fra le Applicazioni. Su Linux rendi eseguibile il file
`.AppImage` e lo avvii.

#tranello[
  Gli installer non sono firmati con un certificato a pagamento. La prima volta che
  apri FAVELLA, Windows (SmartScreen) o macOS (Gatekeeper) potrebbero mostrarti un
  avviso che non conoscono l'autore: è normale. Scegli «esegui comunque» (su macOS,
  tasto destro #sym.arrow.r «Apri») e non lo rivedrai più.
]

== Il comando `favella1`

Dopo l'installazione hai a disposizione un solo programma, `favella1`, che fa
diverse cose a seconda della parola che gli metti dopo. Si usa dal terminale,
nella cartella dove tieni le tue storie.

#table(
  columns: (auto, 1fr),
  stroke: 0.4pt + c.rule,
  inset: 6pt,
  align: (left + top, left + top),
  table.header([*Comando*], [*Cosa fa*]),
  [#cmd[favella1 gioca storia.fav]], [Compila la storia e la fa partire nel terminale.],
  [#cmd[favella1 compila storia.fav]], [Controlla la storia e segnala errori e avvisi, senza giocarla.],
  [#cmd[favella1 collaudo storia.fav]], [Verifica che la storia sia vincibile (lo vedremo più avanti).],
  [#cmd[favella1 playground]], [Apre il laboratorio nel browser: scrivi e provi sul posto.],
  [#cmd[favella1 esporta storia.fav]], [Crea un singolo file `.html` giocabile, da regalare a chi vuoi.],
)

Una storia, qui, è semplicemente un file di testo con estensione `.fav`: lo puoi
scrivere con qualunque editor. Quando una storia è fatta di più file legati da
`Includi` (lo vedremo nel capitolo sui moduli), a `favella1` indichi sempre il file
principale, quello che tiene insieme gli altri.

== Il laboratorio nel browser

Se preferisci non passare dal terminale, `favella1 playground` è il modo più
diretto per cominciare. Apre nel browser una pagina divisa in due: a sinistra
scrivi la storia, a destra la giochi. Premi «Compila e gioca» e parte subito; se
hai sbagliato qualcosa, l'errore compare lì sotto, con la riga indicata.

#nota[
  Il laboratorio funziona *senza connessione*: il motore vero gira sul tuo computer,
  non su un sito. Quello che scrivi resta a te — lo salvi sul disco col pulsante
  «Scarica .fav» e lo riapri quando vuoi. Non c'è salvataggio automatico nel
  browser, quindi tieni l'abitudine di scaricare il tuo lavoro.
]

#prova[
  Apri il laboratorio e lascia la storia d'esempio che trovi già scritta. Premi
  «Compila e gioca», poi prova un paio di comandi (`est`, `prendi mela`). Hai appena
  giocato una storia FAVELLA senza scrivere una riga: nei prossimi capitoli
  imparerai a scriverne una tua.
]

Hai lo strumento in mano. Ora vediamo di cosa è fatta una frase.
