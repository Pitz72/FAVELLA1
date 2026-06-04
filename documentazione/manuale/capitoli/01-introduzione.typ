#import "../lib/manuale-template.typ": *

= Introduzione

Quasi tutti i linguaggi di programmazione ti chiedono di pensare come pensa la
macchina: variabili, cicli, parentesi graffe. FAVELLA fa il contrario. Ti chiede
di scrivere in italiano — frasi vere, con il punto in fondo — e si occupa lei di
trasformarle in un mondo che si può esplorare.

La regola che tiene insieme tutto il resto è una sola: *il tuo codice è una
storia*. Quando scrivi

#esempio[
#fav(```
La cucina è una stanza.
La descrizione della cucina è "Pavimentazione di graniglia. Il bicchiere e il flacone sono dove li ha lasciati.".
```)
]

non stai «dichiarando un oggetto di tipo stanza con un attributo descrizione».
Stai dicendo che esiste una cucina, e com'è fatta. Il compilatore legge la stessa
frase che leggerebbe una persona, e ne ricava una stanza in cui il giocatore
potrà entrare.

== Di cosa parla questo manuale

Di una cosa sola: il *linguaggio*. Qui non troverai come si installa lo strumento
né come si distribuisce il gioco finito; troverai ogni parola che FAVELLA capisce
e ogni frase che puoi scriverle, dalla prima stanza fino ai personaggi che
rispondono e ai meccanismi che scattano da soli.

Il percorso è progressivo. Si parte dalle stanze e dagli oggetti, si arriva alle
regole, agli stati, ai dialoghi. Ogni capitolo aggiunge un mattone al
precedente, così quando incontrerai un costrutto nuovo avrai già in mano tutto
quello che gli serve intorno.

== La storia che faremo insieme

Per non spiegare il linguaggio a vuoto, ogni esempio di questo manuale viene da
un'unica avventura giocabile: *La Casa di Via Stradivari*. Conviene conoscerne la
premessa fin da subito, perché torneremo nelle sue stanze a ogni capitolo.

#nota[
  Tua zia Adele è morta da tre giorni. Sei venuto per firmare le carte e chiudere
  la casa. Solo che la casa non torna: un soprabito ancora al gancio, le medicine
  mai aperte, una valigia pronta e mai partita. C'è da capire cos'è successo e da
  decidere cosa farne. La storia ha tre finali — fare il custode di un segreto,
  firmare e andarsene, oppure bruciare tutto — e li costruiremo, uno alla volta,
  con i mezzi del linguaggio.
]

Il testo completo dell'avventura è in `esempi/materiale-didattico/`. Ti invito a
tenerlo aperto accanto al manuale: gli esempi che leggerai qui sono presi da lì
parola per parola, e vederli al loro posto, dentro una storia che funziona, vale
più di mille definizioni.

== Come leggere gli esempi

Lungo tutto il manuale ricorrono alcuni riquadri. Riconoscerli ti farà risparmiare
tempo:

#sintassi[
  La forma generale di un costrutto, con le parti da riempire fra parentesi
  quadre. È lo schema da imitare.
]

#esempio[
#fav(```
# Un frammento di codice .fav, sempre tratto da «La Casa».
La torcia è una cosa.
La torcia è prendibile.
```)
]

#tranello[
  Un punto in cui è facile sbagliare, o in cui FAVELLA si comporta in modo diverso
  da come ti aspetteresti. Leggi questi riquadri con attenzione: ti risparmiano
  gli errori che fanno tutti.
]

#prova[
  Un piccolo esercizio da fare sulla Casa, per fissare quello che hai appena
  letto. Non è obbligatorio, ma il linguaggio si impara scrivendolo.
]

Bene. Apriamo la porta.
