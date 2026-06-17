// ====================================================================
//  FAVELLA 1 — dati e contenuti del sito (aggiornati alla v1.0.0)
// ====================================================================

export const VERSION = "1.0.0";
export const VERSION_LABEL = "v1.0.0 — Il linguaggio è completo";

// Indirizzo ufficiale del progetto.
export const SITE_URL = "https://favella.eu";

// Versione del SITO (indipendente da quella del motore):
// 1.0 = lancio con il corso su cassetta · 1.1 = «Programma con FAVELLA 1»
// · 1.2 = grande allineamento alla v0.29.0 (distribuzione, manuale 2ª ed.).
// · 1.3 = FAQ nella Guida rapida (dalle domande reali dei primi autori).
// · 2.0 = traguardo v1.0.0 (linguaggio completo), ecosistema (pip/libreria/
//   galleria), manuale v1.0.0 (92 pp.) e casa ufficiale su favella.eu.
export const SITE_VERSION = "2.0.0";

export const GITHUB_URL = "https://github.com/Pitz72/FAVELLA1";
export const RELEASES_URL = "https://github.com/Pitz72/FAVELLA1/releases/latest";
export const GITHUB_DISCUSSIONS_URL = "https://github.com/Pitz72/FAVELLA1/discussions";
export const GITHUB_ISSUES_URL = "https://github.com/Pitz72/FAVELLA1/issues";
export const DEMO_PATH = "esempi/demo/relitto-silente/";

// Manuale di Programmazione completo (PDF tipografico, su GitHub)
export const MANUAL_PDF_URL = "https://github.com/Pitz72/FAVELLA1/raw/main/documentazione/manuale/manuale.pdf";

export const AUTHOR_NAME = "Simone Pizzi";
export const AUTHOR_EMAIL = "simonepizzi.1972@proton.me";
export const TELEGRAM_HANDLE = "@SimonePizz";
export const TELEGRAM_URL = "https://t.me/SimonePizz";
export const FACEBOOK_GROUP_URL = "https://www.facebook.com/groups/1678487103427555";

// Retro-compatibilità con vecchi import
export const YOUR_NAME = AUTHOR_NAME;
export const YOUR_EMAIL = AUTHOR_EMAIL;

// --------------------------------------------------------------------
//  Statistiche di colpo d'occhio
// --------------------------------------------------------------------
export const STATS = [
  { value: "681", label: "test verdi", hint: "+ 43 di collaudo" },
  { value: "1.0.0", label: "linguaggio completo", hint: "grammatica chiusa" },
  { value: "0", label: "ambiguità", hint: "grammatica LALR(1)" },
  { value: "100%", label: "italiano", hint: "le frasi SONO il codice" },
];

// --------------------------------------------------------------------
//  Caratteristiche (home)
// --------------------------------------------------------------------
export interface Feature {
  icon: "prose" | "logic" | "dialog" | "parser" | "open" | "play";
  title: string;
  body: string;
}

export const FEATURES: Feature[] = [
  {
    icon: "prose",
    title: "Il codice è prosa",
    body: "Niente parentesi né punti e virgola: scrivi «La biblioteca è una stanza.» e il mondo prende vita. Se sai descrivere una scena, sai programmarla.",
  },
  {
    icon: "logic",
    title: "Logica narrativa completa",
    body: "Stati, contatori, condizioni con e / oppure / non, fine partita, eventi a turni e «demoni» che sorvegliano il mondo e scattano da soli.",
  },
  {
    icon: "dialog",
    title: "Personaggi e dialoghi",
    body: "NPC con conversazioni ramificate, opzioni condizionali e conseguenze sulle scelte — un sistema di dialogo da interactive fiction.",
  },
  {
    icon: "parser",
    title: "Un motore solido",
    body: "Compilatore a due passate con parser LALR(1) non ambiguo per costruzione, in Python. Una suite di 681 test, più 43 di collaudo, garantisce ogni costrutto.",
  },
  {
    icon: "open",
    title: "Aperto e libero",
    body: "FAVELLA 1 è open-source su GitHub. Toolchain, documentazione ed esempi sono pubblici: chiunque può leggere, usare, forkare e contribuire.",
  },
  {
    icon: "play",
    title: "Una demo che si gioca",
    body: "«Il Relitto Silente» è l'avventura ufficiale: 15 stanze, enigmi a catena, traduzioni aliene e un finale. Vincibile dall'inizio alla fine.",
  },
];

// --------------------------------------------------------------------
//  News & Roadmap
// --------------------------------------------------------------------
export interface NewsItem {
  tag: string;
  date: string;
  title: string;
  body: string;
  emphasis?: "primary" | "secondary" | "normal";
  cta?: { label: string; href: string };
  // Illustrazione opzionale della card (es. il punto interrogativo del teaser).
  art?: "question";
}

export const NEWS: NewsItem[] = [
  {
    tag: "Traguardo",
    date: "Giugno 2026",
    emphasis: "primary",
    title: "FAVELLA 1.0.0 — il linguaggio è completo",
    body: "Ci siamo: FAVELLA raggiunge la versione 1.0.0. È un traguardo, non solo un numero. Dopo i Temi — il caso e le quantità, il mondo che si trasforma in scena, gli stati che si parlano fra loro — il linguaggio è dichiarato chiuso e definitivo: nessuna nuova grammatica, solo un anno di costrutti che si sono consolidati l'uno nell'altro. La rete di sicurezza è cresciuta a 681 test verdi più 43 di collaudo, e la grammatica resta non ambigua per costruzione. Da oggi quello che scrivi oggi continuerà a funzionare domani.",
    cta: { label: "Vedi le novità", href: "#/aggiornamenti" },
  },
  {
    tag: "Nuovo",
    date: "Giugno 2026",
    emphasis: "normal",
    title: "Un ecosistema: pip, una libreria di moduli, una galleria di storie",
    body: "Intorno al linguaggio è nato il suo contorno. Ora il motore è un pacchetto Python ufficiale: «pip install favella1», e ce l'hai ovunque, da usare come programma o come libreria. C'è una libreria di moduli .fav pronti da includere nelle tue storie, e una galleria di tre avventure complete e vincibili, da leggere come esempi e da rigiocare — qui sul sito, col motore vero, o dalla riga di comando con «favella1 libreria» e «favella1 galleria».",
    cta: { label: "Gioca la galleria", href: "#/galleria" },
  },
  {
    tag: "Disponibile",
    date: "Giugno 2026",
    emphasis: "normal",
    title: "Il Manuale di Programmazione, allineato a v1.0.0",
    body: "Il manuale d'autore cresce con il linguaggio: 92 pagine, 21 capitoli, con un capitolo nuovo dedicato al caso e alle quantità (i Temi 1 e 2) e gli inserti sui costrutti più recenti — il mondo che si trasforma, gli stati che si copiano e si confrontano. La Casa di Via Stradivari resta l'esempio-guida dall'inizio alla fine. Impaginato per la stampa, oltre che per lo schermo, con la nuova copertina di marca.",
    cta: { label: "Scarica il manuale (PDF)", href: MANUAL_PDF_URL },
  },
  {
    tag: "Linguaggio",
    date: "Fatto",
    emphasis: "normal",
    title: "I Temi: il caso, le quantità, gli stati che si parlano",
    body: "L'ultima ondata di costrutti prima della chiusura. I contatori ora si parlano (danno che scala con la forza, soglie relative, dadi: «un numero fra 2 e 6»); la casualità entra anche negli stati («il meteo diventa uno fra sereno, pioggia, nebbia») e negli eventi («se càpita (1 su 4)»); il mondo si trasforma in scena (cala la notte e una stanza diventa buia); e uno stato può copiare o confrontare un altro stato, per impersonare un personaggio o ricordare una scelta. Tutto riproducibile, tutto annullabile.",
  },
  {
    tag: "Linguaggio",
    date: "Fatto",
    emphasis: "normal",
    title: "Il mondo vivo: l'Asse A è completo",
    body: "Una serie di aggiunte che rendono le storie più naturali da scrivere e da giocare. La casa ora può avere stanze buie e oggetti che le illuminano; i personaggi possono spostarsi da soli di stanza in stanza; il giocatore può dire «prendila» dopo «esamina la torcia», disfare l'ultimo turno con ANNULLA, e ritrovare descrizioni che variano a ogni sguardo. Niente workaround: ogni attrito emerso scrivendo le demo è diventato una parola del linguaggio.",
  },
  {
    tag: "Strumenti",
    date: "Fatto",
    emphasis: "normal",
    title: "FAVELLA 1 si installa: un programma vero per Windows, macOS e Linux",
    body: "Per usare FAVELLA fuori dal browser non servono più Python e pazienza: c'è un installer pronto per ognuno dei tre sistemi, e dentro un comando solo, «favella1». Con quello giochi una storia («favella1 gioca storia.fav»), la controlli prima di pubblicarla («favella1 compila»), apri un piccolo studio con editor e motore che gira tutto in locale, senza rete («favella1 playground»), o trasformi l'avventura in una pagina web da regalare a chi vuoi («favella1 esporta»). Le build escono da sole a ogni versione.",
    cta: { label: "Scarica l'ultima versione", href: RELEASES_URL },
  },
  {
    tag: "Da provare",
    date: "Giugno 2026",
    emphasis: "normal",
    title: "Programma con FAVELLA 1 — il laboratorio nel browser",
    body: "Non devi installare niente per scrivere la tua prima avventura: la pagina «Programma» è il motore vero di FAVELLA, che gira nel tuo browser. Scrivi a sinistra, premi «Compila e gioca», provi a destra; se sbagli, leggi l'errore autentico del compilatore, con il numero di riga. Quando la storia ti piace, la scarichi come file .fav e la apri con la CLI: la tua storia viaggia con te.",
    cta: { label: "Apri il laboratorio", href: "#/programma" },
  },
  {
    tag: "Da provare",
    date: "Giugno 2026",
    emphasis: "normal",
    title: "Il corso interattivo: ventuno cassette, e sotto gira FAVELLA davvero",
    body: "Un omaggio ai corsi di programmazione su cassetta dei primi anni '80, ma vivo: ventuno «cassette», una per capitolo del manuale, che ti insegnano FAVELLA facendoti scrivere — fino ai Temi, le aggiunte più recenti (il caso, le quantità, il mondo che cambia, gli stati che si parlano). Quando una lezione ti chiede una frase, è il motore vero a compilarla. In più due avventure complete — «La Casa di Via Stradivari» e «Il Relitto Silente» — giocabili dentro la pagina.",
    cta: { label: "Entra nel corso interattivo", href: "#/corso" },
  },
  {
    tag: "Prossimamente",
    date: "?",
    emphasis: "secondary",
    art: "question",
    title: "C'è un cantiere di cui non parliamo ancora",
    body: "Qualcosa di grosso sta prendendo forma in officina. Chi scrive storie con FAVELLA lo troverà… familiare. L'annuncio arriverà qui.",
  },
];

// --------------------------------------------------------------------
//  Evoluzioni del linguaggio e dell'ecosistema (dal documento di
//  progettazione pubblico del repository). DONE = già realizzate dalla
//  v0.18 in poi; NEXT = la direzione di marcia oltre la v0.29.
// --------------------------------------------------------------------
export interface RoadmapItem {
  area: "linguaggio" | "strumenti" | "ecosistema";
  title: string;
  body: string;
}

// Già realizzate (erano «prossime evoluzioni», ora sono nel motore).
export const DONE_EVOLUTIONS: RoadmapItem[] = [
  {
    area: "linguaggio",
    title: "Pronomi e anafora",
    body: "«Esamina la torcia», poi «prendila»: il motore ricorda l'ultimo oggetto nominato, con genere e numero. La singola aggiunta che più ha fatto sembrare vivo il parser.",
  },
  {
    area: "linguaggio",
    title: "Risposte che variano",
    body: "Descrizioni alternative («La descrizione del mare è una di: …»), in rotazione o casuali: esaminare due volte la stessa cosa non dà più due volte la stessa frase.",
  },
  {
    area: "linguaggio",
    title: "ANNULLA, ANCORA, trascrizione",
    body: "I comandi di servizio classici dell'avventura testuale: disfare l'ultimo turno, ripetere l'ultimo comando, registrare la partita su file.",
  },
  {
    area: "linguaggio",
    title: "Buio e luce",
    body: "«La cantina è buia.» e «La torcia illumina.»: il pattern più universale dell'interactive fiction è ora una primitiva del linguaggio.",
  },
  {
    area: "linguaggio",
    title: "Personaggi che si muovono",
    body: "«La guardia va nel corridoio.», «Il gatto cambia stanza.»: gli NPC ora camminano da soli, annunciati a chi sta nella stanza. Il mondo non è più un museo.",
  },
  {
    area: "strumenti",
    title: "Installer multipiattaforma",
    body: "Un programma pronto per Windows, macOS e Linux, con la CLI unica «favella1» e un playground che gira tutto in locale. Le build escono da sole a ogni versione.",
  },
  {
    area: "strumenti",
    title: "Il collaudatore di storie",
    body: "Un controllo statico che legge la storia e segnala se la vittoria è raggiungibile, quali regole non scattano mai, quali oggetti non servono a niente — senza giocare a mano.",
  },
  {
    area: "linguaggio",
    title: "Il caso e le quantità",
    body: "I contatori si parlano: danno che scala con la forza, soglie relative, dadi («un numero fra 2 e 6»). E la casualità entra negli stati e negli eventi («uno fra…», «se càpita (1 su 4)»). Tutto riproducibile e annullabile.",
  },
  {
    area: "linguaggio",
    title: "Il mondo che si trasforma",
    body: "Cala la notte e una stanza diventa buia; una battuta di dialogo cambia in base a ciò che è successo; uno stato copia o confronta un altro stato, per impersonare un personaggio o ricordare una scelta.",
  },
  {
    area: "ecosistema",
    title: "pip install favella1",
    body: "Il motore è un pacchetto Python ufficiale su PyPI: lo installi con un comando in qualunque ambiente, e lo usi come libreria oltre che come programma.",
  },
  {
    area: "ecosistema",
    title: "Libreria di moduli",
    body: "Pezzi di mondo pronti da includere nelle proprie storie, esplorabili con «favella1 libreria». Si imparano i pattern usandoli.",
  },
  {
    area: "ecosistema",
    title: "La galleria delle storie",
    body: "Tre avventure complete e vincibili, da leggere come esempi e rigiocare, sfogliabili con «favella1 galleria». La vetrina della community parte da qui.",
  },
];

// Da fare: la rotta oltre la v1.0.0 — il linguaggio è chiuso, cresce il contorno.
export const NEXT_EVOLUTIONS: RoadmapItem[] = [
  {
    area: "ecosistema",
    title: "favella.eu, la casa del progetto",
    body: "Un indirizzo tutto suo: documentazione, manuale, laboratorio nel browser e la galleria giocabile, raccolti sotto un solo dominio facile da ricordare.",
  },
  {
    area: "ecosistema",
    title: "La galleria cresce",
    body: "Le avventure scritte dagli autori, giocabili qui sul sito: scrivi in italiano, condividi un link. Le prime tre storie ufficiali sono solo l'inizio della vetrina.",
  },
];

// --------------------------------------------------------------------
//  Il Progetto — testo esteso
// --------------------------------------------------------------------
export const PROJECT_TEXT = `FAVELLA 1 nasce da una duplice passione: quella per la narrativa interattiva — sulla scia di capolavori come Zork e le avventure testuali di Infocom — e quella per i linguaggi di programmazione. Per anni il punto di riferimento del settore è stato Inform 7: potente, ma legato all'inglese e a una sintassi che intimorisce chi non è programmatore. L'idea di un'alternativa italiana, intuitiva e moderna, è rimasta a lungo un sogno nel cassetto.

L'intuizione che muove FAVELLA è radicale nella sua semplicità: e se l'italiano non fosse usato per *commentare* il codice, ma fosse il codice stesso? In FAVELLA non esistono parentesi graffe da bilanciare né punti e virgola da ricordare. Si scrive «La porta di ferro è chiusa.» e quella frase, così com'è, diventa una regola del mondo. La promessa di copertina del progetto è proprio questa: il tuo codice è una storia.

Con l'avvento dei Large Language Models quel sogno è diventato un progetto concreto. FAVELLA 1 non è stato scritto in solitudine, ma in un dialogo costante con un'intelligenza artificiale: non un semplice strumento, ma un partner di sviluppo con cui definire le specifiche, esplorare il design della grammatica, generare codice e fare refactoring. Un approccio ibrido che lascia all'autore umano la visione e le decisioni, e accelera tutto il resto.

Sotto la prosa c'è ingegneria vera. Il primo motore a espressioni regolari è stato sostituito da un compilatore a due passate con un parser formale LALR(1) (Lark/EBNF), reso non ambiguo per costruzione: i nomi di stanze e oggetti diventano token "chiusi" raccolti da una symbol-table, così l'italiano resta naturale ma la grammatica resta deterministica. Da lì il linguaggio è cresciuto per livelli — logica composita, stato di gioco, estendibilità, espressività narrativa, NPC e dialoghi, maturità della toolchain, capacità di trasporto, reattività dei "demoni" — fino a un mondo che si comporta da vivo: buio e luce, personaggi che camminano, pronomi, descrizioni che variano, il caso e le quantità, gli stati che si parlano. Ogni passo è protetto da una suite oggi a 681 test, più 43 di collaudo.

Con la versione 1.0.0 il linguaggio si dichiara completo e definitivo: chiuso, non per stanchezza, ma perché ogni costrutto ha trovato il suo posto. Ha il suo manuale — un «Manuale di Programmazione» tipografico di 92 pagine che racconta ogni costrutto con una storia d'esempio dall'inizio alla fine — e tutto un ecosistema intorno: un installer per Windows, macOS e Linux con la riga di comando «favella1», un playground che funziona offline, il pacchetto «pip install favella1», una libreria di moduli da includere e una galleria di avventure giocabili. La casa ufficiale del progetto è favella.eu; il codice è su GitHub, pubblico e aperto, e chiunque voglia dare una mano, o addirittura prendere in carico il progetto, è il benvenuto.`;

// --------------------------------------------------------------------
//  Changelog (sintesi delle release recenti)
// --------------------------------------------------------------------
export interface UpdateLog {
  version: string;
  title: string;
  content: string;
}

export const UPDATE_LOGS: UpdateLog[] = [
  {
    version: "1.0.0",
    title: "Il linguaggio è completo",
    content: "Il traguardo: FAVELLA si dichiara chiusa e definitiva. Nessuna modifica di grammatica rispetto alla 0.34.0 — la 1.0.0 sancisce che il linguaggio è completo. Intorno è cresciuto l'ecosistema: il pacchetto «pip install favella1» (motore come programma e come libreria), una libreria di moduli .fav da includere («favella1 libreria») e una galleria di tre avventure vincibili («favella1 galleria»). Il manuale arriva a 92 pagine con la nuova copertina di marca; la rete di sicurezza è a 681 test più 43 di collaudo.",
  },
  {
    version: "0.30.0 – 0.34.0",
    title: "I Temi: il caso, le quantità, gli stati che si parlano",
    content: "L'ultima ondata di espressività prima della chiusura. Le quantità diventano dinamiche: danno che scala con una statistica («di [forza]»), confronti relativi fra contatori, estrazione casuale («un numero fra 2 e 6»). La casualità entra anche negli stati («diventa uno fra sereno, pioggia, nebbia») e negli eventi («se càpita (1 su 4)»), seedata e annullabile. Il mondo si trasforma in scena: una stanza «diventa buia» o si rischiara, una battuta di dialogo cambia secondo lo stato. E uno stato può copiare o confrontare un altro stato («il corteggiato diventa il preferito», «se è come il preferito»). Grammatica sempre LALR(1) non ambigua.",
  },
  {
    version: "0.29.0",
    title: "Distribuzione multipiattaforma",
    content: "FAVELLA esce dal repository: installer nativi per Windows (NSIS), macOS (.dmg) e Linux (AppImage), generati da soli a ogni rilascio via GitHub Actions. Una CLI unica, «favella1», raccoglie gioca, compila, collaudo, playground ed esporta. Il playground gira tutto in locale, senza rete, sul motore nativo.",
  },
  {
    version: "0.27.0 – 0.28.1",
    title: "Revisione totale di solidità",
    content: "Tre tornate di correttezza e robustezza prima del manuale: copula plurale negli stati e contatori, proprietà opposte di genere diverso, turno atomico (una conseguenza che fallisce a metà non lascia il mondo incoerente), dialoghi annullabili, cache del parser. Il motore arriva a 582 test più 43 di collaudo.",
  },
  {
    version: "0.24.0 – 0.26.0",
    title: "Il mondo vivo (Asse A: buio, NPC, sinonimi)",
    content: "Buio e luce come primitive («La cantina è buia.», «La torcia illumina.»); personaggi che si spostano da soli («va nel corridoio», «cambia stanza»), con annuncio a chi è presente; sinonimi di verbo («\"ghermisci\" è come prendi.»). Grammatica sempre LALR(1) non ambigua.",
  },
  {
    version: "0.23.0",
    title: "Il collaudatore statico",
    content: "Un controllo che legge la storia e verifica la «catena della vittoria»: la fine è raggiungibile? quali regole non scattano mai? quali oggetti non servono? Disponibile da riga di comando, senza giocare a mano.",
  },
  {
    version: "0.22.0",
    title: "Risposte che variano",
    content: "Descrizioni a varianti, casuali («è una di: …») o a rotazione («è in sequenza: …»), con interpolazione dei valori dentro ogni variante. La casualità è riproducibile e ANNULLA riavvolge anche quella.",
  },
  {
    version: "0.21.0",
    title: "ANNULLA, ANCORA, trascrizione",
    content: "I comandi di servizio classici dell'avventura testuale: «annulla» disfa l'ultimo turno con una macchina del tempo fedele (posizioni, inventario, stati, contatori, casualità), «ancora» ripete l'ultimo comando, «trascrizione» salva la partita su file.",
  },
  {
    version: "0.20.0",
    title: "Pronomi e anafora",
    content: "Dopo «esamina la torcia» basta «prendila»: il motore ricorda l'ultimo oggetto nominato e lo riconosce dal pronome, con genere e numero, anche dalla forma tonica «prendi quella». Se l'oggetto è uscito di scena, lo dice invece di sbagliare.",
  },
  {
    version: "0.19.0",
    title: "Lezioni dallo stress-test di genere",
    content: "Nate costruendo un genere fuori-asse (un simulatore di guida): verbi senza oggetto («\"accelera\" è un comando senza oggetto.»), inventario iniziale («Il giocatore ha la torcia.»), e tick silenziosi negli eventi e nei demoni (il «dire» diventa facoltativo se c'è già una conseguenza).",
  },
  {
    version: "0.18.0",
    title: "Consolidamento del linguaggio — «linguaggio al massimo»",
    content: "Chiusi i Livelli 1-8. Colmati tutti i buchi emersi scrivendo le demo: regole a due oggetti che valutano il «se», copula plurale «sono», genitivo «dei», accenti affidabili, preposizioni articolate, posizione e teletrasporto del giocatore, testo d'esito personalizzato per vinci/perdi, confronti «al massimo N» e «non è N», verbi personalizzati multi-parola, negazione di gruppi. Suite da 386 a 446 test. Grammatica sempre LALR(1) non ambigua.",
  },
  {
    version: "0.17.0",
    title: "Robustezza d'ordine + audit dei Livelli 1-8",
    content: "L'ordine delle frasi non conta più: posizioni, proprietà, descrizioni, conseguenze e bersagli delle regole sono risolti a fine compilazione, sul mondo completo. «La gemma è nella scatola.» funziona anche prima di dichiarare la scatola. Più due bug corretti dall'audit (no-op a partita conclusa, linter cieco ai demoni).",
  },
  {
    version: "0.16.0",
    title: "Valore iniziale configurabile dei contatori",
    content: "«La forza parte da 3.» — un contatore può avere un valore di partenza, ideale per statistiche in stile GDR (forza, vita, mana) e per il gating delle azioni. Additivo e indipendente dall'ordine.",
  },
  {
    version: "0.15.0",
    title: "Livello 8 — Reattività / Demoni",
    content: "Gli eventi condizionali, l'ultima capacità mancante: «Ogni turno se [condizione]: …» (ri-scatta) e «Quando [condizione]: …» (sul fronte di salita). Sentinelle autonome che sorvegliano il mondo e scattano da sole — veleno, allarmi, soglie, scadenze — con anti-loop per costruzione.",
  },
  {
    version: "0.14.0",
    title: "Concordanza di genere/numero sulle proprietà",
    content: "In un linguaggio italiano «aperto» e «aperta» devono valere uguale: ora le proprietà di stato sono confrontate per radice, ignorando la desinenza. Il portale che «si apre» si apre davvero, qualunque genere usi l'autore.",
  },
  {
    version: "0.13.0",
    title: "Livello 7 — Capacità di trasporto",
    content: "Un limite opzionale agli oggetti trasportabili: «Il giocatore può portare 5 oggetti.» con bonus additivi «Lo zaino dà 15 spazi.». Senza dichiarazione, l'inventario resta illimitato.",
  },
  {
    version: "0.12.0",
    title: "Livello 6 — Maturità della toolchain",
    content: "Linter semantico (stanze irraggiungibili, oggetti orfani, regole morte, variabili inutilizzate), moduli e import multi-file con «Includi \"file.fav\".», e una specifica EBNF formale versionata della grammatica.",
  },
  {
    version: "0.11.0",
    title: "Livello 5b — NPC e dialoghi ramificati",
    content: "Un sistema di dialogo completo da interactive fiction: personaggi, conversazione modale con opzioni numerate, ramificazione tra nodi, conseguenze sulle scelte e opzioni condizionali.",
  },
  {
    version: "0.10.0",
    title: "Livello 5 — Espressività narrativa",
    content: "Interpolazione dinamica «[punteggio]» nei testi, regole globali senza oggetto, descrizioni condizionali in base allo stato e concordanza grammaticale italiana minima negli elenchi di oggetti.",
  },
];

// --------------------------------------------------------------------
//  Guida rapida (panoramica; il manuale completo è il PDF su GitHub)
// --------------------------------------------------------------------
export const MANUAL_CONTENT = `# Guida rapida a FAVELLA 1

Una panoramica essenziale della sintassi alla **v1.0.0**, pensata per cominciare subito. Per la trattazione organica di tutti i costrutti c'è il **Manuale di Programmazione** completo — 92 pagine, 21 capitoli, scaricabile in PDF da GitHub. La filosofia è una sola: **il tuo codice è una storia**. Scrivi frasi in italiano, ognuna chiusa da un **punto \`.\`**; i commenti iniziano con \`#\`.

---

## Installare e avviare FAVELLA

Per scrivere una storia hai tre strade, dalla più immediata alla più completa.

**Nel browser, subito.** La pagina «Programma» di questo sito è il motore vero di FAVELLA, che gira nel tuo browser: scrivi a sinistra, premi «Compila e gioca», provi a destra. Non devi installare niente, e la storia te la porti via come file \`.fav\`.

**Sul tuo computer, con l'installer.** Dalle Release su GitHub scarichi l'installer per il tuo sistema — \`.exe\` per Windows, \`.dmg\` per macOS, \`.AppImage\` per Linux. Ti dà un unico comando, \`favella1\`:

* \`favella1 gioca storia.fav\` — avvia l'avventura nel terminale.
* \`favella1 compila storia.fav\` — controlla la storia e ne segnala errori e avvisi.
* \`favella1 playground\` — apre un editor col motore, in locale e senza rete.
* \`favella1 esporta storia.fav\` — crea una pagina HTML autoportante da condividere.

**Il codice aperto.** Se vuoi il motore Python — per studiarlo, estenderlo o usarlo come libreria — il repository è pubblico su GitHub.

---

## 1. Il mondo: stanze e oggetti

Una **stanza** è un luogo; una **cosa** è un oggetto con cui interagire.

\`\`\`favella
La Grotta di Cristallo è una stanza.
La descrizione della grotta è "Stalattiti luminose pendono dal soffitto.".

Una spada antica è una cosa.
La spada antica è nella grotta.
La spada antica è prendibile.
\`\`\`

### Collegare le stanze
FAVELLA crea da sé il collegamento di ritorno.

\`\`\`favella
La grotta collega nord a la Sala del Trono.
\`\`\`

---

## 2. Proprietà e stato

Una **proprietà** è un aggettivo di stato; le proprietà opposte si escludono.

\`\`\`favella
La porta di ferro è chiusa.
Accesa e spenta sono opposte.
\`\`\`

Per la logica più ricca ci sono **stati** e **contatori**:

\`\`\`favella
Il semaforo è uno stato.
Il punteggio è un contatore.
La forza è un contatore.
La forza parte da 3.
\`\`\`

---

## 3. Le regole: «Invece di»

Una regola intercetta un'azione del giocatore e la sostituisce. Il verbo va all'**imperativo**, come lo digiterebbe il giocatore (\`apri\`, non \`aprire\`).

\`\`\`favella
Invece di prendi la statua: dire "È troppo pesante.".
\`\`\`

### Regole condizionali
Si attivano solo se la condizione è vera (e hanno priorità sulle semplici):

\`\`\`favella
Invece di apri la porta di ferro se il giocatore ha la chiave: dire "La porta si apre!".
\`\`\`

Le condizioni si combinano con **e** / **oppure** / **non** e le parentesi:

\`\`\`favella
Invece di esci se non ( il giocatore ha la chiave e la torcia è accesa ): dire "Ti manca qualcosa.".
\`\`\`

---

## 4. Conseguenze dinamiche: «e adesso»

Una regola può cambiare il mondo aggiungendo \`e adesso …\`:

\`\`\`favella
Invece di usa la chiave su la porta: dire "Click!" e adesso la porta è aperta.
\`\`\`

Tra le conseguenze: spostare un oggetto (\`e adesso la chiave è in inventario\`), mutare uno stato o un contatore (\`e adesso aumenta il punteggio di 5\`), teletrasportare il giocatore (\`e adesso il giocatore è in la Sala del Trono\`) e chiudere la partita con un testo (\`e adesso vinci "Sei libero!"\`).

---

## 5. Reazioni autonome: i «demoni»

Sentinelle che sorvegliano il mondo a ogni turno e scattano da sole:

\`\`\`favella
La tensione è un contatore.
Ogni 1 turno: dire "La tensione cresce." e adesso aumenta la tensione.
Quando la tensione è almeno 8: dire "Il portale ti risucchia." e adesso perdi.
\`\`\`

---

## 6. Personaggi e dialoghi

\`\`\`favella
L'Anziano è un personaggio.
Il dialogo dell'Anziano comincia con "saluto".
L'Anziano al nodo "saluto" dice "Sei tu, finalmente.".
Al nodo "saluto" l'opzione "Chi sei?" conduce al nodo "verità".
Al nodo "saluto" l'opzione "Addio." chiude il dialogo.
\`\`\`

---

## Domande frequenti (FAQ)

*Domande raccolte da chi sta davvero scrivendo storie con FAVELLA. Riferite alla **v1.0.0** (la grammatica è la stessa dalla 0.34.0).*

### Posso far comparire un messaggio quando voglio, senza legarlo a un comando del giocatore?
Sì. FAVELLA ha tre modi per mostrare testo durante il gioco senza agganciarlo a un verbo o a un oggetto:
\`\`\`favella
Al turno 3: dire "Qualcuno ti osserva da lontano.".
Ogni 5 turni: dire "Da qualche parte un orologio batte le ore.".
Quando lo smascheramento è sì diventa vera: dire "Adesso sei tu la talpa!".
\`\`\`
Il primo scatta a un turno preciso, il secondo a intervalli regolari, il terzo quando si avvera una condizione che decidi tu (basta accendere uno stato).

### Uno stato può prendere il valore di un altro stato?
Sì, dalla **v0.34.0**. Uno stato può **copiare** il valore corrente di un altro stato, ed essere **confrontato** con un altro stato — utile per impersonare un personaggio o ricordare una scelta:
\`\`\`favella
e adesso il corteggiato diventa il preferito.
Invece di esamina lo specchio se il corteggiato è come il preferito: dire "Sono la stessa persona.".
\`\`\`
La **copia** usa \`diventa\`; il **confronto** usa il marcatore \`è come\` (\`se X è come Y\`), per non confonderlo con \`è\` + un valore scritto a mano (\`se il corteggiato è anna\` resta il confronto con la *parola* «anna»). Vale solo fra **stati**: per copiare/confrontare due **contatori** usa il valore fra parentesi (\`il punteggio diventa [bonus]\`, \`se la vita è [soglia]\`). Mescolare uno stato e un contatore è segnalato come errore.

### Lo stato è una «variabile», come negli altri linguaggi?
Sì, e ne esistono due tipi. Lo **stato** è una variabile *simbolica*: contiene un valore di **una sola parola**, confrontabile solo per uguaglianza (come un'etichetta o un enum). Il **contatore** è la variabile *numerica*: ci fai aritmetica (\`aumenta\`, \`diminuisci\`, \`… diventa 5\`) e confronti d'ordine (\`almeno\`, \`più di\`, \`meno di\`, \`al massimo\`).

### Ricevo «Entità sconosciuta» su una riga che mi sembra corretta. Perché?
Quasi sempre l'errore vero è nella riga **precedente**: una descrizione con il punto messo *dentro* le virgolette. Scrivi \`"…testo".\` (punto **fuori**), non \`"…testo."\`. Il punto interno viene rimosso insieme al testo, la frase si fonde con quella successiva e quest'ultima «sparisce», facendo scattare l'errore più in basso.

### I nomi degli stati vanno messi tra virgolette?
No. Le virgolette \`"…"\` servono **solo** ai testi mostrati al giocatore (descrizioni, dialoghi). Un nome di stato si scrive nudo: \`Il nome di Backy è uno stato.\` — non \`Il "nome di Backy" è uno stato.\`

### Che valori può avere uno stato?
Una sola parola, senza spazi né \`/\`. Quindi \`Nord Italia\` diventa \`NordItalia\` (oppure \`settentrionale\`), e \`non tatuato\` diventa \`nontatuato\`. Se ti serve un numero, usa un **contatore**.

### Come faccio un combattimento a turni, con un nemico che attacca da solo?
Modella il combattimento come **presenza nella stanza**: il nemico ha un contatore di vita, e un **demone** lo fa colpire a ogni turno finché è vivo e tu sei lì. Tu attacchi con un verbo tuo.
\`\`\`favella
La vita del troll è un contatore.
La vita del troll parte da 6.
La forza è un contatore.
La forza parte da 2.
"attacca" è un comando.
Invece di attacca il troll: dire "Lo colpisci!" e adesso diminuisci la vita del troll di [forza].
Ogni turno se il giocatore è in la cripta e la vita del troll è più di 0: dire "Il troll ti colpisce!" e adesso diminuisci la vita di 2.
Quando la vita del troll è al massimo 0: dire "Il troll crolla!" e adesso aumenta l'esperienza di 10.
\`\`\`
Due accorgimenti: usa \`al massimo 0\` (non \`è 0\`) per la morte, così regge anche se l'ultimo colpo «sfonda» lo zero; e ricorda che fuggire dalla stanza ti sottrae ai colpi. Lo vedi all'opera nella demo «La Cripta del Lich» su GitHub.

### Il danno può variare a caso, o dipendere dalla forza del personaggio?
Sì, dalla **v0.31.0**. Una quantità (\`di …\`) può essere un numero scritto a mano, il **valore di un contatore** fra parentesi quadre, oppure un'**estrazione casuale**:
\`\`\`favella
Invece di attacca il drago: dire "Colpisci!" e adesso diminuisci la vita del drago di [forza].
Invece di incanta il drago: dire "Magia!" e adesso diminuisci la vita del drago di un numero fra 2 e 6.
\`\`\`
Le parentesi \`[forza]\` significano «il valore di questo contatore» — proprio come quando interpoli \`[forza]\` dentro un testo. Così il danno **scala con la statistica** (sali di livello → colpisci più forte) e i dadi sono finalmente possibili. L'estrazione casuale è riproducibile e **ANNULLA la riavvolge**.

### Posso confrontare due contatori fra loro? (es. «se la mia vita è meno di quella del nemico»)
Sì, dalla **v0.31.0**. Il termine di confronto, oltre a un numero, può essere un altro contatore fra parentesi quadre:
\`\`\`favella
Quando la vita del troll è meno di [vita] diventa vera: dire "Il troll esita: è più malconcio di te.".
Ogni turno se l'oro è almeno [prezzo]: dire "Te lo puoi permettere.".
\`\`\`
Il confronto è **dinamico**: se la cella di destra cambia, cambia anche il risultato. Abilita soglie *relative* (gelosie, difficoltà che si adatta) senza batterie di regole a numero fisso.

### Come gestisco una scorta (3 pozioni, le munizioni, le razioni…)?
Con un **contatore**. FAVELLA non ha oggetti «in molteplicità» (e non li avrà: i plurali e la concordanza automatica la trasformerebbero in un linguaggio di programmazione, contro lo spirito del progetto). Una scorta è semplicemente un numero che cala quando consumi:
\`\`\`favella
Le pozioni sono un contatore.
Le pozioni partono da 3.
"bevi" è un comando.
Invece di bevi se le pozioni è almeno 1: dire "Bevi una pozione. (Ne restano [pozioni].)" e adesso aumenta la salute di 5 e adesso diminuisci le pozioni.
Invece di bevi se le pozioni è 0: dire "Non hai più pozioni.".
\`\`\`
Il testo della scorta lo scrivi tu (\`[pozioni]\` interpola la quantità): così resta in italiano corretto, senza pluralizzazioni inventate dal motore.

### Posso far cambiare il meteo (o un altro stato) a caso?
Sì, dalla **v0.32.0**. Oltre a dare a uno stato un valore fisso, puoi farglielo **pescare a caso** da un elenco:
\`\`\`favella
Il meteo è uno stato.
Il meteo è sereno.
Ogni 3 turni: il meteo diventa uno fra sereno, pioggia, nebbia.
\`\`\`
A ogni scatto il meteo diventa *uno fra* i valori elencati, scelto a sorte. È la casualità *simbolica* (valori di stato), gemella dell'estrazione *numerica* \`un numero fra 2 e 6\` dei contatori. Come per quella, la scelta è riproducibile e **ANNULLA la riavvolge**.

### Posso far succedere qualcosa solo «ogni tanto», con una probabilità?
Sì, dalla **v0.32.0**, con la condizione \`càpita (N su M)\` — vera *N volte su M*:
\`\`\`favella
Ogni turno se càpita (1 su 4): dire "Un'auto sbuca dal nulla!" e adesso diminuisci la salute di 1.
Invece di scava se càpita (1 su 3): dire "Hai trovato una moneta!" e adesso aumenta l'oro.
\`\`\`
\`1 su 4\` scatta circa una volta ogni quattro; \`3 su 3\` sempre, \`0 su 5\` mai. Si combina con \`e\`/\`oppure\`/\`non\` come ogni altra condizione, e si usa in regole, demoni e dialoghi. Anche qui la pesca è seedata e **ANNULLA la riavvolge**: un imprevisto disfatto si ripresenta identico. È ciò che rende un simulatore (guida, sopravvivenza, GDR) davvero *rigiocabile*.

### Posso far scendere la notte e spegnere la luce delle stanze?
Sì, dalla **v0.33.0**. Oltre al buio dichiarato all'avvio (\`La grotta è buia.\` + un oggetto che \`illumina\`), ora puoi **commutarlo in scena**: una stanza diventa buia o si rischiara a metà partita.
\`\`\`favella
Al turno 5: dire "Cala la notte." e adesso la cantina diventa buia.
Quando l'alba arriva diventa vera: dire "Sorge il sole." e adesso la cantina diventa illuminata.
\`\`\`
\`diventa buia\` spegne la luce (senza una torcia accesa, «È buio pesto.»); \`diventa illuminata\` (o \`chiara\`) la riaccende. È stato del mondo, quindi **ANNULLA lo riavvolge**. *Nota:* per uno spazio **all'aperto** la notte spesso non è buio pesto (ci sono le stelle, e vuoi mostrare le uscite): lì conviene ancora uno **stato** \`momento\` con descrizioni condizionali. Usa il buio commutabile quando la luce deve davvero mancare (una cantina, una torcia che si spegne).

### La battuta di un personaggio può cambiare in base a quello che è successo?
Sì, dalla **v0.33.0**. Come le descrizioni, anche la battuta di un nodo di dialogo ammette varianti \`se\`: vince la prima la cui condizione è vera, e quella senza \`se\` fa da ripiego.
\`\`\`favella
Anna al nodo "incontro" dice "Sei tornato, finalmente." se l'affinità di Anna è almeno 4.
Anna al nodo "incontro" dice "Oh. Ciao.".
\`\`\`
Prima dovevi sdoppiare l'*opzione* (due righe con la stessa etichetta); ora puoi far variare direttamente ciò che il personaggio *dice*, senza toccare le scelte del giocatore.

### Il gioco si chiude di colpo con un errore su un «carattere» (codec/charmap). Perché?
Capita su **Windows** se in un testo mostrato al giocatore metti un carattere «fantasia» fuori dal set occidentale standard — per esempio \`★\`, \`─\`, certe frecce o emoji. La console di Windows non riesce a stamparlo e la partita si interrompe. Soluzione: nelle stringhe usa lettere accentate, \`«»\`, trattini \`—\` (questi vanno bene) ed evita simboli decorativi esotici; in alternativa \`>>\`, \`===\`, \`*\`. (Nei **commenti** \`#\` puoi scrivere qualsiasi cosa: non vengono mai stampati.)

### Come do un nome a una direzione? «"sinistra" è come est.» non funziona.
\`è come\` serve per i **verbi** (\`"ghermisci" è come prendi.\`), non per le direzioni: con una direzione dà solo un avviso e non fa nulla. Per le direzioni l'idioma — più pulito — è dichiarare una **coppia di opposte**, che il motore tiene in coppia (andata e ritorno automatici):
\`\`\`favella
Sinistra e destra sono direzioni opposte.
La piazza collega sinistra al vicolo.
\`\`\`
Da quel momento il giocatore può digitare \`sinistra\` per muoversi, e \`destra\` lo riporta indietro.

### Una regola «Invece di» deve sempre «dire» qualcosa?
No (dalla v0.30.0). Se una regola cambia solo lo stato del mondo, puoi **omettere il testo**, esattamente come per eventi e demoni:
\`\`\`favella
Invece di riposa: aumenta le forze di 2.
\`\`\`
Niente riga vuota a schermo: il gesto agisce in silenzio. Se invece vuoi una risposta, la metti come prima: \`… : dire "Ti riposi." e adesso aumenta le forze di 2.\`.

### Ho usato un carattere strano in un nome (es. «doppio/gioco») e il compilatore protesta. Cosa posso usare?
Nei **nomi** (di stanze, oggetti, stati, contatori) puoi usare solo lettere — anche accentate — cifre, spazi e l'apostrofo. Caratteri come \`/\`, \`-\`, \`%\` non sono ammessi: dalla v0.30.0 il compilatore te lo dice con un messaggio chiaro, riga e colonna del carattere incriminato (prima dava un errore interno oscuro). Scrivi \`doppiogioco\` o \`doppio gioco\`.

---

> Questa è solo la punta dell'iceberg. Il **Manuale di Programmazione** completo (92 pagine, 21 capitoli, in PDF) tratta ogni costrutto nel dettaglio; codice, specifica della grammatica e la demo «Il Relitto Silente» sono tutti pubblici su GitHub.`;
