#import "../lib/guida.typ": *

= Installare e aggiornare

Favella Studio è gratuito e open source. Gli installer per Windows e Linux sono sul sito,
alla pagina #link("https://www.favella.eu/studio")[www.favella.eu/studio], e su GitHub,
fra le «Release» del progetto (quelle che si chiamano «Favella Studio»). Su macOS l'app
si costruisce sul proprio computer con un comando.

== Windows

#passi(
  [Scarica #fav("FavellaStudio-Setup-" + STUDIO + ".exe") e aprilo.],
  [L'installer non è firmato con un certificato a pagamento: se compare «Windows ha
    protetto il PC», scegli #ui[Ulteriori informazioni] e poi #ui[Esegui comunque].],
  [Scegli dove installarlo (va bene la cartella proposta) e conferma. Studio compare nel
    menu Start.],
)

== Linux

Scarica #fav("FavellaStudio-" + STUDIO + ".AppImage"): è l'app intera in un file solo, che va bene
per qualunque distribuzione a 64 bit. Rendila eseguibile e aprila:

#righe[
  chmod +x FavellaStudio-#STUDIO;.AppImage \
  ./FavellaStudio-#STUDIO;.AppImage
]

Su alcune distribuzioni serve il pacchetto FUSE (di solito si chiama `libfuse2`).

== macOS

Per macOS non c'è un installer già pronto: un'app non firmata da Apple verrebbe bloccata
dal sistema. La si costruisce in pochi minuti sul proprio Mac, e l'app che ne esce è tua
e il Mac si fida. Le istruzioni sono nel repository, nel file `studio/BUILD-MACOS.md`
(anche dalla pagina del sito).

== La prima volta: gli aggiornamenti

Al primo avvio Studio fa una domanda sola: #ui[Vuoi sapere quando esce una versione
nuova?] Se rispondi #ui[Sì, controlla], a ogni avvio chiede a GitHub qual è l'ultima
versione di Favella Studio; non manda niente di tuo. Se rispondi #ui[No, grazie], non si
collega mai a internet da solo.

Puoi cambiare idea quando vuoi dal menu #puntini in alto a destra, nella parte
#ui[Applicazione]: la voce #ui[Controlla da solo a ogni avvio] si spunta e si toglie. La
voce #ui[Controlla gli aggiornamenti…] controlla subito, una volta.

== Quando esce una versione nuova

Se c'è una versione nuova, in alto compare una pillola col suo numero (per esempio
#ui[Versione 1.2.1]). Un clic apre la finestra degli aggiornamenti, con le novità.

#passi(
  [Scegli #ui[Scarica e aggiorna]. Puoi continuare a lavorare: la pillola mostra a che
    punto è lo scaricamento.],
  [Quando il file è scaricato, Studio controlla la sua *impronta* (SHA-256): deve essere
    identica a quella che GitHub pubblica per quella versione. Se non lo è, il file non si
    installa.],
  [La pillola diventa #ui[Aggiornamento pronto]. Quando vuoi, scegli #ui[Chiudi Studio e
    aggiorna]: prima di chiudere, Studio ti chiede dei file che non hai salvato, poi parte
    l'installazione e Studio si riapre aggiornato.],
)

Su Windows parte l'installer nuovo; su Linux Studio sostituisce l'AppImage che stai
usando e la riapre. Su macOS l'aggiornamento si scarica e si installa a mano dalla
pagina della versione: la finestra te lo dice e ti porta lì.

#nota[
  Le tue storie non c'entrano con l'aggiornamento: stanno nelle loro cartelle e non
  vengono toccate. Una storia scritta con una versione di Studio si apre con tutte le
  altre.
]
