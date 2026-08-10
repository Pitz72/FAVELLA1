// ====================================================================
//  Manuale interattivo — «Il corso su cassetta»
//  Omaggio a «Conoscere il Computer direttamente dal Computer»
//  (Edizioni Beatrice d'Este) e ai corsi BASIC su cassetta dei primi
//  anni '80: ogni capitolo del manuale è una «cassetta», ogni cassetta
//  è una lezione che si forma una riga alla volta.
//
//  NOTA DI DESIGN — modalità «guidata/verificata»: i checkpoint
//  confrontano la riga digitata con quella attesa (vedi verificaRiga in
//  LessonPlayer). Il formato è però predisposto per innestare in futuro
//  l'ESECUZIONE VERA del motore (Pyodide): basterà aggiungere ai blocchi
//  checkpoint un campo opzionale `esegui` e far girare il .fav digitato.
// ====================================================================

/** Un checkpoint: chiede all'utente di scrivere una riga di .fav. */
export interface CheckpointBlock {
  tipo: "checkpoint";
  /** La consegna mostrata all'utente. */
  consegna: string;
  /** La riga .fav attesa (confronto normalizzato). */
  attesa: string;
  /** Aiuto mostrato quando la riga non combacia. */
  suggerimento: string;
  /** Conferma di sistema mostrata al superamento. */
  esito: string;
}

// --------------------------------------------------------------------
//  Esecuzione VERA dei checkpoint (Fase 2).
//  Quasi tutte le righe-checkpoint, da sole, non compilano: referenziano
//  entità che vanno dichiarate prima. Per ogni riga attesa diamo qui il
//  «mondo-base» — le righe di contesto in cui innestarla — così il motore
//  FAVELLA (Pyodide, via favellaRuntime) può compilarla davvero e dare il
//  suo verdetto/errori REALI. Chiave = la riga attesa esatta. Verificato
//  offline col motore (scripts/valida_checkpoint.py): 53/53 compilano ok.
// --------------------------------------------------------------------
export const CHECKPOINT_BASE: Record<string, string[]> = {
  // Cassetta 01 — Apri la porta
  "L'ingresso è una stanza.": [],
  "La torcia è una cosa.": [],
  "La torcia è prendibile.": ["La torcia è una cosa."],
  // Cassetta 02 — Le stanze
  "Lo studio è una stanza.": [],
  'La descrizione del giardino è "Erba, ghiaia, due piante di alloro.".': ["Il giardino è una stanza."],
  'La descrizione della cantina se la torcia è spenta è "Sotto la scala è cieco.".': [
    "La cantina è una stanza.",
    "La torcia è una cosa.",
  ],
  // Cassetta 03 — Muoversi tra le stanze
  "La cucina collega est a il giardino.": ["La cucina è una stanza.", "Il giardino è una stanza."],
  "Il giocatore comincia in ingresso.": ["L'ingresso è una stanza."],
  "Alto e basso sono direzioni opposte.": [],
  // Cassetta 04 — Gli oggetti
  "Il portaombrelli è una cosa.": [],
  "Il portaombrelli è in ingresso.": ["Il portaombrelli è una cosa.", "L'ingresso è una stanza."],
  "Il portaombrelli è prendibile.": ["Il portaombrelli è una cosa."],
  // Cassetta 05 — Proprietà e stati
  "La torcia è spenta.": ["La torcia è una cosa."],
  "Accesa e spenta sono opposte.": [],
  "La porta della cantina è chiusa.": ["La porta della cantina è una cosa."],
  // Cassetta 06 — Contenitori e supporti
  "Il tavolino è un supporto.": [],
  "La torcia è sul tavolino.": ["La torcia è una cosa.", "Il tavolino è un supporto."],
  'La torcia si chiama anche "pila".': ["La torcia è una cosa."],
  // Cassetta 07 — Stati e contatori
  "La verita è uno stato.": [],
  "La verita è ignota.": ["La verita è uno stato."],
  "La calma parte da 3.": ["La calma è un contatore."],
  // Cassetta 08 — Le regole «Invece di»
  'Invece di sposta il vaso di gerani: dire "Sposti il vaso. Nulla di nuovo.".': ["Il vaso di gerani è una cosa."],
  'Invece di accendi la torcia se la torcia è spenta: dire "Devi averla in mano per caricarla.".': [
    '"accendi" è un comando.',
    "La torcia è una cosa.",
  ],
  '"accendi" è un comando.': [],
  // Cassetta 09 — Logica e conseguenze
  'Invece di brucia le lettere se la torcia è spenta oppure il giocatore non ha le lettere: dire "Non così, non adesso.".': [
    '"brucia" è un comando.',
    "Le lettere è una cosa.",
    "La torcia è una cosa.",
  ],
  'Invece di spegni la torcia se la torcia è accesa: dire "Premi l\'interruttore. Buio." e adesso la torcia è spenta.': [
    '"spegni" è un comando.',
    "La torcia è una cosa.",
  ],
  // Cassetta 10 — Fine partita
  '"scappa" è un comando.': [],
  'Invece di scappa: dire "Esci di corsa, senza voltarti." e adesso termina "Forse era meglio non sapere.".': [
    '"scappa" è un comando.',
  ],
  // Cassetta 11 — Eventi a turni
  'Al turno 4: dire "Sui colli si sente un tuono basso. Vento alle imposte." e adesso il temporale è vicino.': [
    "Il temporale è uno stato.",
    "Il temporale è lontano.",
  ],
  'Ogni 5 turni: dire "L\'orologio batte ma il pendolo no: si è fermato alle quattro e ventidue.".': [],
  // Cassetta 12 — I demoni
  'Ogni turno se il temporale è scoppiato: dire "Dal soffitto cade una goccia, poi un\'altra." e adesso diminuisci la calma.': [
    "Il temporale è uno stato.",
    "Il temporale è lontano.",
    "La calma è un contatore.",
  ],
  'Quando la calma è meno di 1 diventa vera: dire "Le mani ti tremano.".': ["La calma è un contatore."],
  // Cassetta 13 — Buio e luce
  "La cantina è buia.": ["La cantina è una stanza."],
  "La torcia illumina.": ["La torcia è una cosa."],
  // Cassetta 14 — Personaggi e dialoghi
  "Il notaio è un personaggio.": [],
  'Il dialogo del notaio comincia con "tavolo".': [
    "Il notaio è un personaggio.",
    'Il notaio al nodo "tavolo" dice "Le carte sono sul tavolo.".',
  ],
  'Al nodo "tavolo" l\'opzione "Di cosa è morta?" conduce al nodo "salute".': [
    "Il notaio è un personaggio.",
    'Il dialogo del notaio comincia con "tavolo".',
    'Il notaio al nodo "tavolo" dice "Le carte sono sul tavolo.".',
    'Il notaio al nodo "salute" dice "Cuore.".',
  ],
  'Al nodo "tavolo" l\'opzione "Firmo subito." chiude il dialogo e adesso perdi.': [
    "Il notaio è un personaggio.",
    'Il dialogo del notaio comincia con "tavolo".',
    'Il notaio al nodo "tavolo" dice "Le carte sono sul tavolo.".',
  ],
  // Cassetta 15 — La capacità di trasporto
  "Il giocatore può portare 5 oggetti.": [],
  "Lo zaino dà 15 spazi.": ["Lo zaino è una cosa."],
  // Cassetta 16 — Moduli
  'Includi "oggetti.fav".': [],
  'Includi "dialoghi.fav".': [],
  // Cassetta 18 — Le quantità che si parlano (Tema 1)
  'Invece di attacca il troll: dire "Lo colpisci!" e adesso diminuisci la vita del troll di [forza].': [
    '"attacca" è un comando.',
    "La cripta è una stanza.",
    "Il troll è una cosa.",
    "Il troll è in cripta.",
    "La vita del troll è un contatore.",
    "La forza è un contatore.",
  ],
  'Invece di incanta il drago: dire "Magia!" e adesso diminuisci la vita del drago di un numero fra 2 e 6.': [
    '"incanta" è un comando.',
    "La caverna è una stanza.",
    "Il drago è una cosa.",
    "Il drago è in caverna.",
    "La vita del drago è un contatore.",
  ],
  [`Ogni turno se l'oro è almeno [prezzo]: dire "Te lo puoi permettere.".`]: [
    "L'oro è un contatore.",
    "Il prezzo è un contatore.",
  ],
  // Cassetta 19 — Il caso (Tema 2)
  "Ogni 3 turni: il meteo diventa uno fra sereno, pioggia, nebbia.": [
    "Il meteo è uno stato.",
    "Il meteo è sereno.",
  ],
  [`Ogni turno se càpita (1 su 4): dire "Un'auto sbuca dal nulla!" e adesso diminuisci la salute di 1.`]: [
    "La salute è un contatore.",
  ],
  // Cassetta 20 — Il mondo che cambia, gli stati che si parlano (Temi 4 e 3)
  'Al turno 5: dire "Cala la notte." e adesso la cantina diventa buia.': ["La cantina è una stanza."],
  "Al turno 2: il corteggiato diventa il preferito.": [
    "Il corteggiato è uno stato.",
    "Il corteggiato è nessuno.",
    "Il preferito è uno stato.",
    "Il preferito è anna.",
  ],
  'Invece di esamina lo specchio se il corteggiato è come il preferito: dire "Sono la stessa persona.".': [
    "La sala è una stanza.",
    "Lo specchio è una cosa.",
    "Lo specchio è in sala.",
    "Il corteggiato è uno stato.",
    "Il preferito è uno stato.",
  ],
  // Cassetta 21 — Riepilogo del linguaggio
  "La camera è una stanza.": [],
  "Il bicchiere di grappa è prendibile.": ["Il bicchiere di grappa è una cosa."],
  "Gli indizi è un contatore.": [],
};

/** Il mondo-base per una riga attesa (vuoto se la riga compila da sola). */
export const baseDiCheckpoint = (attesa: string): string[] => CHECKPOINT_BASE[attesa.trim()] ?? [];

/** Un blocco di una lezione, rivelato un'unità alla volta. */
export type LessonBlock =
  | { tipo: "narr"; testo: string }
  | { tipo: "codice"; righe: string[] }
  | { tipo: "sistema"; testo: string }
  | { tipo: "tranello"; testo: string }
  | CheckpointBlock;

export interface Lesson {
  id: string;
  numero: number;
  titolo: string;
  fonte: string;
  durata: string;
  sommario: string;
  blocchi: LessonBlock[];
}

/** Voce dello scaffale: una cassetta del corso. */
export interface CassetteRef {
  numero: number;
  titolo: string;
  fonte: string;
  stato: "attiva" | "in-arrivo";
  lessonId?: string;
}

/** Una «cassetta-gioco»: un'avventura giocabile col motore vero (Pyodide). */
export interface GameCassette {
  numero: number;
  titolo: string;
  fonte: string;
  gameId: string; // cartella in favella-engine/<gameId>/
  entry: string; // file d'ingresso (.fav)
  files: string[]; // tutti i .fav da caricare nel filesystem virtuale
  intro: string;
  comandiEsempio: string[]; // suggerimenti mostrati prima di iniziare
  cover?: string; // nome file copertina in public/covers/ (es. "cover-il-faro.webp")
}

// --------------------------------------------------------------------
//  Le cassette-gioco (avventure giocabili nel browser via Pyodide).
// --------------------------------------------------------------------
export const COURSE_GAMES: GameCassette[] = [
  {
    numero: 1,
    titolo: "La Casa di Via Stradivari",
    fonte: "Avventura · tre finali",
    gameId: "casa",
    entry: "storia.fav",
    files: ["storia.fav", "oggetti.fav", "dialoghi.fav"],
    intro:
      "Tua zia Adele è morta da tre giorni. Sei venuto per firmare le carte e chiudere la casa. Solo che la casa non torna. Sta a te capire cos'è successo — e decidere cosa farne.",
    comandiEsempio: ["guarda", "esamina il tavolino", "nord", "inventario"],
  },
  {
    numero: 2,
    titolo: "Il Relitto Silente",
    fonte: "Demo ufficiale · 15 stanze",
    gameId: "relitto",
    entry: "relitto.fav",
    files: ["relitto.fav", "stanze.fav", "oggetti.fav", "regole.fav", "traduci.fav", "echi.fav", "dialoghi.fav"],
    intro:
      "Ti risvegli alla deriva su un relitto silenzioso, in mezzo al nulla. Quindici stanze, artefatti da decifrare, una lingua aliena da tradurre e qualcosa che, nel silenzio, ti osserva.",
    comandiEsempio: ["guarda", "esamina l'oblò", "ovest", "inventario"],
  },
];

// --------------------------------------------------------------------
//  La Galleria: TUTTE le avventure complete e vincibili che abbiamo,
//  scritte in italiano e giocabili qui col motore vero (Pyodide). I .fav
//  sono vendorati in public/favella-engine/ (galleria/<id>/, oltre a
//  casa/ e relitto/). Tutte VINCIBILI (collaudo statico) e bootano sul
//  motore v1.0.0. `fonte` = "difficoltà · genere". Vedi SYNC.md.
// --------------------------------------------------------------------
export const GALLERY_STORIES: GameCassette[] = [
  // — Le tre brevi ufficiali —
  {
    numero: 1,
    titolo: "Il Faro Spento",
    fonte: "⭐ facile · mistero atmosferico",
    gameId: "galleria/il-faro",
    cover: "cover-il-faro.webp",
    entry: "il-faro.fav",
    files: ["il-faro.fav"],
    intro:
      "Una nave cerca la costa nel buio, e il faro è morto. Sali la scala di ferro, apri la botola, riaccendi la grande lampada prima che sia tardi. Mostra: direzioni custom, contenitore con chiave, regola a due oggetti, buio e luce.",
    comandiEsempio: ["guarda", "esamina la cassapanca", "nord", "inventario"],
  },
  {
    numero: 2,
    titolo: "Il Forziere dei Tre Sigilli",
    fonte: "⭐⭐ media · enigma gotico",
    gameId: "galleria/i-tre-sigilli",
    cover: "cover-i-tre-sigilli.webp",
    entry: "i-tre-sigilli.fav",
    files: ["i-tre-sigilli.fav"],
    intro:
      "Tre incavi vuoti su un forziere di ferro, e tre sigilli nascosti in una rovina: la biblioteca, la cappella, la cripta. Raccoglili tutti e apri. Mostra: contatori con valore iniziale e interpolazione, demoni, sentinelle contro il farming.",
    comandiEsempio: ["guarda", "esamina il tomo", "nord", "inventario"],
  },
  {
    numero: 3,
    titolo: "Il Giardino Murato",
    fonte: "⭐⭐ media · fiaba / enigma",
    gameId: "galleria/il-giardino-murato",
    cover: "cover-il-giardino-murato.webp",
    entry: "il-giardino-murato.fav",
    files: ["il-giardino-murato.fav"],
    intro:
      "Un giardino perfetto e senza uscita, un giardiniere che sa più di quanto dice, e una rosa d'oro sotto una campana di vetro. Parlagli nel modo giusto. Mostra: dialogo a nodi, opzione condizionale che porta alla vittoria, regola a due oggetti.",
    comandiEsempio: ["guarda", "parla con il giardiniere", "nord", "inventario"],
  },
  // — Le due storie del manuale —
  {
    numero: 4,
    titolo: "La Casa di Via Stradivari",
    fonte: "⭐ facile · mistero domestico",
    gameId: "casa",
    cover: "cover-casa.webp",
    entry: "storia.fav",
    files: ["storia.fav", "oggetti.fav", "dialoghi.fav"],
    intro:
      "Tua zia Adele è morta da tre giorni. Sei venuto per firmare le carte e chiudere la casa. Solo che la casa non torna. È la storia-guida del manuale, costruita un costrutto alla volta, dall'inizio alla fine — con tre finali diversi.",
    comandiEsempio: ["guarda", "esamina il tavolino", "nord", "inventario"],
  },
  {
    numero: 5,
    titolo: "Il Relitto Silente",
    fonte: "⭐⭐⭐ ampia · fantascienza",
    gameId: "relitto",
    cover: "cover-relitto.webp",
    entry: "relitto.fav",
    files: ["relitto.fav", "stanze.fav", "oggetti.fav", "regole.fav", "traduci.fav", "echi.fav", "dialoghi.fav"],
    intro:
      "Ti risvegli alla deriva su un relitto silenzioso, in mezzo al nulla. Quindici stanze, artefatti da decifrare, una lingua aliena da tradurre e qualcosa che, nel silenzio, ti osserva. La demo ufficiale, esaustiva, vincibile dall'inizio alla fine.",
    comandiEsempio: ["guarda", "esamina l'oblò", "ovest", "inventario"],
  },
  // — Gli stress-test di genere —
  {
    numero: 6,
    titolo: "La Cripta del Lich",
    fonte: "⭐⭐⭐ ampia · fantasy / GDR",
    gameId: "galleria/cripta-del-lich",
    cover: "cover-cripta-del-lich.webp",
    entry: "la-cripta-del-lich.fav",
    files: ["la-cripta-del-lich.fav", "bottega.fav"],
    intro:
      "Il banco di prova più severo: statistiche, un mercante con cui commerciare, combattimento a turni e crescita di livello. Compra la spada, abbatti il troll nella cripta, sali di livello e col vigore nuovo affronta il Lich.",
    comandiEsempio: ["guarda", "scheda", "parla con il mercante", "attacca il troll"],
  },
  {
    numero: 7,
    titolo: "Cuori al Caffè",
    fonte: "⭐⭐ media · sentimentale",
    gameId: "galleria/cuori-al-caffe",
    cover: "cover-cuori-al-caffe.webp",
    entry: "cuori-al-caffe.fav",
    files: ["cuori-al-caffe.fav"],
    intro:
      "Una serata in un caffè. Due persone interessanti: Anna, libraia schiva, e Bea, alpinista solare. Hai tempo fino alla chiusura per conquistare un appuntamento: parla, ascolta, fai il regalo giusto. Ma corteggiarle entrambe ti si ritorce contro.",
    comandiEsempio: ["guarda", "parla con anna", "parla con bea", "aspetta"],
  },
  {
    numero: 8,
    titolo: "Notte di Gara",
    fonte: "⭐⭐⭐ ampia · corsa / guida",
    gameId: "galleria/notte-di-gara",
    cover: "cover-notte-di-gara.webp",
    entry: "notte-di-gara.fav",
    files: ["notte-di-gara.fav"],
    intro:
      "Una corsa notturna a cronometro con quattro sistemi che girano insieme — carburante, gomme, calore motore, lucidità — un bivio che apre due percorsi diversi, e un meteo che cambia mentre guidi. Il motore spinto oltre il suo design.",
    comandiEsempio: ["guarda", "accelera", "rallenta", "accosta"],
  },
  {
    numero: 9,
    titolo: "Salerno-Reggio",
    fonte: "⭐⭐⭐ ampia · viaggio / memoria",
    gameId: "galleria/salerno-reggio",
    cover: "cover-salerno-reggio.webp",
    entry: "salerno-reggio.fav",
    files: ["salerno-reggio.fav", "strada.fav", "oggetti.fav", "guida.fav"],
    intro:
      "Un viaggio in macchina lungo la vecchia A3, dal casello di Salerno fino allo Stretto. Si guida avanti di tratto in tratto; col comando «ricorda» lo stesso luogo si rivive nell'infanzia, sul sedile di dietro, con papà alla guida. Due tempi sullo stesso asfalto.",
    comandiEsempio: ["guarda", "accelera", "ricorda", "accosta"],
  },
  {
    numero: 10,
    titolo: "La Notte Lunga",
    fonte: "⭐⭐ media · sopravvivenza",
    gameId: "galleria/la-notte-lunga",
    cover: "cover-la-notte-lunga.webp",
    entry: "la-notte-lunga.fav",
    files: ["la-notte-lunga.fav"],
    intro:
      "Sei nel bosco, è il tardo pomeriggio, e tra poco farà freddo e buio. Devi arrivare all'alba vivo: gestire fame, sete, caldo e salute, accendere un fuoco, trovare riparo. Porti solo 3 cose alla volta, e la morte è definitiva.",
    comandiEsempio: ["guarda", "esamina lo zaino", "mangia", "bevi"],
  },
];

// --------------------------------------------------------------------
//  Lo scaffale delle cassette (i capitoli del manuale)
//  Solo la 01 è giocabile nella fetta verticale; le altre rappresentano
//  l'arco del corso, ancora «in arrivo».
// --------------------------------------------------------------------
export const COURSE_CASSETTES: CassetteRef[] = [
  { numero: 1, titolo: "Apri la porta", fonte: "Capitoli 1 e 3", stato: "attiva", lessonId: "apri-la-porta" },
  { numero: 2, titolo: "Le stanze", fonte: "Capitolo 4", stato: "attiva", lessonId: "le-stanze" },
  { numero: 3, titolo: "Muoversi tra le stanze", fonte: "Capitolo 5", stato: "attiva", lessonId: "muoversi" },
  { numero: 4, titolo: "Gli oggetti", fonte: "Capitolo 6", stato: "attiva", lessonId: "gli-oggetti" },
  { numero: 5, titolo: "Proprietà e stati", fonte: "Capitolo 7", stato: "attiva", lessonId: "proprieta" },
  { numero: 6, titolo: "Contenitori e supporti", fonte: "Capitolo 8", stato: "attiva", lessonId: "contenitori" },
  { numero: 7, titolo: "Stati e contatori", fonte: "Capitolo 9", stato: "attiva", lessonId: "stati-contatori" },
  { numero: 8, titolo: "Le regole «Invece di»", fonte: "Capitolo 10", stato: "attiva", lessonId: "regole" },
  { numero: 9, titolo: "Logica e conseguenze", fonte: "Capitolo 11", stato: "attiva", lessonId: "conseguenze" },
  { numero: 10, titolo: "Fine partita", fonte: "Capitolo 12", stato: "attiva", lessonId: "fine-partita" },
  { numero: 11, titolo: "Eventi a turni", fonte: "Capitolo 13", stato: "attiva", lessonId: "eventi-turni" },
  { numero: 12, titolo: "I demoni", fonte: "Capitolo 14", stato: "attiva", lessonId: "demoni" },
  { numero: 13, titolo: "Buio e luce", fonte: "Capitolo 15", stato: "attiva", lessonId: "buio-luce" },
  { numero: 14, titolo: "Personaggi e dialoghi", fonte: "Capitolo 16", stato: "attiva", lessonId: "dialoghi" },
  { numero: 15, titolo: "La capacità di trasporto", fonte: "Capitolo 17", stato: "attiva", lessonId: "trasporto" },
  { numero: 16, titolo: "Moduli", fonte: "Capitolo 18", stato: "attiva", lessonId: "moduli" },
  { numero: 17, titolo: "Comandi del giocatore", fonte: "Capitolo 19", stato: "attiva", lessonId: "comandi-giocatore" },
  { numero: 18, titolo: "Le quantità che si parlano", fonte: "Cap. 20 · I Temi", stato: "attiva", lessonId: "quantita" },
  { numero: 19, titolo: "Il caso", fonte: "Cap. 20 · I Temi", stato: "attiva", lessonId: "il-caso" },
  { numero: 20, titolo: "Il mondo che cambia", fonte: "Cap. 20 · I Temi", stato: "attiva", lessonId: "mondo-dinamico" },
  { numero: 21, titolo: "Riepilogo del linguaggio", fonte: "Capitolo 21", stato: "attiva", lessonId: "riepilogo" },
];

// --------------------------------------------------------------------
//  Le lezioni giocabili (per id). Testi fedeli al manuale, esempi
//  «La Casa di Via Stradivari» parola per parola.
// --------------------------------------------------------------------
export const LESSONS: Record<string, Lesson> = {
  "apri-la-porta": {
    id: "apri-la-porta",
    numero: 1,
    titolo: "Apri la porta",
    fonte: "Capitoli 1 e 3 · La Casa di Via Stradivari",
    durata: "~8 min",
    sommario:
      "Le prime frasi: come FAVELLA legge l'italiano, il punto che chiude ogni frase, e come dichiarare la tua prima stanza e i tuoi primi oggetti.",
    blocchi: [
      { tipo: "sistema", testo: "FAVELLA CORSO · CASSETTA 01" },
      { tipo: "sistema", testo: '"Apri la porta"' },
      {
        tipo: "narr",
        testo:
          "Benvenuto. Mettiti comodo: il nastro è partito e non c'è fretta. Se non hai mai programmato in vita tua, sei nel posto giusto — qui non serve sapere niente di computer. Serve solo un po' di italiano, quello che usi tutti i giorni.",
      },
      {
        tipo: "narr",
        testo:
          "Questa prima cassetta dura una manciata di minuti. Alla fine avrai costruito, con le tue mani, le prime stanze e i primi oggetti di una storia vera. La storia si chiama «La Casa di Via Stradivari», e la ritroverai in ogni lezione del corso.",
      },
      {
        tipo: "narr",
        testo:
          "Cominciamo da un'idea che ribalta tutto. Quasi tutti i linguaggi di programmazione ti chiedono di pensare come pensa la macchina: variabili, cicli, parentesi graffe da bilanciare. FAVELLA fa l'esatto contrario.",
      },
      {
        tipo: "narr",
        testo:
          "Ti chiede di scrivere in italiano — frasi vere, con il punto in fondo — e si occupa lei di trasformarle in un mondo che si può esplorare. La regola che tiene insieme tutto il resto è una sola, e vale la pena impararla a memoria: il tuo codice è una storia.",
      },
      { tipo: "narr", testo: "Guarda queste due righe, prese dalla Casa:" },
      {
        tipo: "codice",
        righe: [
          "La cucina è una stanza.",
          'La descrizione della cucina è "Pavimentazione di graniglia. Il bicchiere e il flacone sono dove li ha lasciati.".',
        ],
      },
      {
        tipo: "narr",
        testo:
          "Leggile ad alta voce. È italiano normale, vero? Eppure è esattamente ciò che il computer capisce. Non stai «dichiarando un oggetto di tipo stanza con un attributo descrizione»: stai dicendo che esiste una cucina, e com'è fatta. Tutto qui.",
      },
      { tipo: "sistema", testo: "— Il punto: la cosa più importante di tutte —" },
      {
        tipo: "narr",
        testo:
          "Hai notato il punto in fondo a ogni riga? Non è un vezzo da maestrina. In FAVELLA ogni istruzione è una frase, e ogni frase finisce con un punto. È il punto a dire al compilatore dove finisce un'idea e ne comincia un'altra.",
      },
      {
        tipo: "narr",
        testo:
          "Tienilo a mente fin da subito, perché è l'errore numero uno di chi comincia: si scrive la frase giusta e ci si dimentica il punto. Da bravi, mettiamolo sempre.",
      },
      {
        tipo: "narr",
        testo:
          "C'è poi un altro segno utile: il cancelletto #. Tutto ciò che lo segue, fino a fine riga, è un commento — una nota per te, che FAVELLA legge e ignora. Serve a ordinare il lavoro, come i fogli con le linguette colorate.",
      },
      {
        tipo: "codice",
        righe: [
          "# ============================",
          "# 1. STANZE",
          "# ============================",
          "L'ingresso è una stanza.",
        ],
      },
      {
        tipo: "narr",
        testo:
          "Bene. Basta guardarmi lavorare: adesso tocca a te. Non aver paura di sbagliare, il nastro aspetta. Scrivi tu la prima frase del tuo mondo.",
      },
      {
        tipo: "checkpoint",
        consegna:
          "Dichiara l'ingresso della Casa come stanza. (Comincia con «L'ingresso»… e ricordati il punto!)",
        attesa: "L'ingresso è una stanza.",
        suggerimento:
          "Quasi: scrivi «L'ingresso è una stanza» e chiudi con il punto «.».",
        esito: "OK · Stanza «ingresso» creata. Il giocatore potrà entrarci.",
      },
      {
        tipo: "narr",
        testo:
          "Visto com'è stato facile? Hai appena creato una stanza scrivendo una frase italiana. Da questo momento «l'ingresso» è un posto vero, in cui il giocatore potrà entrare e guardarsi intorno.",
      },
      { tipo: "sistema", testo: "— Dichiara prima, usa dopo —" },
      {
        tipo: "narr",
        testo:
          "Una cosa importante sul modo in cui FAVELLA ti legge. Lo fa in due passaggi: prima scorre tutto il testo e prende nota dei nomi che esistono — le tue stanze, i tuoi oggetti; poi torna indietro e interpreta le frasi una per una.",
      },
      {
        tipo: "narr",
        testo:
          "La regola d'oro che ne nasce è semplice: ogni stanza e ogni oggetto va dichiarato prima di usarlo altrove. E se sbagli a scrivere un nome, FAVELLA non tira a indovinare: ti ferma subito e — come un insegnante paziente — ti propone il nome giusto.",
      },
      {
        tipo: "narr",
        testo:
          "Scrivendo «la chave» al posto di «la chiave», ti risponderà: «Entità sconosciuta: chave non è mai stata dichiarata. Forse intendevi: chiave?». L'errore arriva subito, non a gioco avviato.",
      },
      { tipo: "sistema", testo: "— Nomi lunghi, proprietà corte —" },
      {
        tipo: "narr",
        testo:
          "Un nome può essere lungo quanto vuoi: «la chiave della cantina», «il flacone di medicine», «il tavolo del salotto». FAVELLA li prende per intero, ed è così che la Casa può avere due chiavi diverse senza confonderle.",
      },
      {
        tipo: "narr",
        testo:
          "Una proprietà di stato, invece — un aggettivo che dice com'è una cosa adesso — è sempre di una parola sola: «chiusa», «accesa», «spenta», «scarica». Le incontreremo per bene più avanti; per ora tienilo nell'orecchio.",
      },
      {
        tipo: "tranello",
        testo:
          'Non si scrive «La torcia è quasi scarica.»: «quasi scarica» sono due parole, e FAVELLA accetta una proprietà sola. Se ti serve quello stato, scegli una parola unica («scarica») oppure userai un contatore per il livello di carica.',
      },
      {
        tipo: "narr",
        testo:
          "Mettiamo in pratica. Nella Casa, al buio della cantina, servirà una torcia. Dichiariamola — non come stanza, stavolta, ma come oggetto con cui si può interagire. In FAVELLA un oggetto si chiama, semplicemente, «una cosa».",
      },
      {
        tipo: "checkpoint",
        consegna: "Dichiara la torcia come oggetto («una cosa»).",
        attesa: "La torcia è una cosa.",
        suggerimento: "«La torcia è una cosa.» — una cosa, al singolare, con il punto in fondo.",
        esito: "OK · Oggetto «torcia» creato.",
      },
      {
        tipo: "narr",
        testo:
          "Perfetto. C'è però una differenza: una cosa esiste nel mondo, ma non è detto che il giocatore possa raccoglierla. Un tavolo non te lo metti in tasca; una torcia sì. Per dire che un oggetto si può prendere, gli si dà la proprietà «prendibile».",
      },
      {
        tipo: "narr",
        testo: "Ultima frase di questa cassetta, e te la lascio tutta. Rendi la torcia raccoglibile.",
      },
      {
        tipo: "checkpoint",
        consegna: "Fai in modo che la torcia si possa raccogliere.",
        attesa: "La torcia è prendibile.",
        suggerimento: "«La torcia è prendibile.» — l'aggettivo è «prendibile», e in fondo il solito punto.",
        esito: "OK · Ora il giocatore può raccogliere la torcia e portarla con sé.",
      },
      {
        tipo: "narr",
        testo:
          "E con questo, un'ultima rassicurazione. L'ordine delle frasi non conta: FAVELLA sistema posizioni e collegamenti solo alla fine, quando il mondo è completo. Puoi mettere un oggetto dentro un cassettone che dichiarerai dieci righe più sotto — funziona lo stesso.",
      },
      { tipo: "sistema", testo: "FINE CASSETTA 01 · PRONTO." },
      {
        tipo: "narr",
        testo:
          "Fermiamoci qui. In pochi minuti hai scritto una stanza e un oggetto raccoglibile: per quanto piccolo, è già un mondo. Nella prossima cassetta arrederemo le stanze, daremo loro una descrizione e impareremo a collegarle, così il giocatore potrà passare dall'una all'altra. Riavvolgi il nastro quando vuoi.",
      },
    ],
  },

  "le-stanze": {
    id: "le-stanze",
    numero: 2,
    titolo: "Le stanze",
    fonte: "Capitolo 4 · La Casa di Via Stradivari",
    durata: "~7 min",
    sommario:
      "Arredare il mondo: dare un volto alle stanze con le descrizioni, e farle cambiare insieme alla storia con le descrizioni condizionali.",
    blocchi: [
      { tipo: "sistema", testo: "FAVELLA CORSO · CASSETTA 02" },
      { tipo: "sistema", testo: '"Le stanze"' },
      {
        tipo: "narr",
        testo:
          "Bentornato. Hai reinserito il nastro: il rullo gira di nuovo. Nella cassetta scorsa hai creato l'ingresso e una torcia — due frasi, e già un mondo. Oggi quel mondo lo arrediamo.",
      },
      {
        tipo: "narr",
        testo:
          "Le stanze sono le ambientazioni della storia: i luoghi in cui il giocatore si trova, si guarda intorno, decide dove andare. Sono anche la prima cosa che si costruisce, perché tutto il resto — oggetti, personaggi, regole — vive dentro una stanza.",
      },
      {
        tipo: "narr",
        testo:
          "Crearne una è una riga, l'hai già fatto. La Casa ne ha sette, una frase a testa. Guardale tutte insieme, fanno una bella pianta:",
      },
      {
        tipo: "codice",
        righe: [
          "L'ingresso è una stanza.",
          "Il salotto è una stanza.",
          "Lo studio è una stanza.",
          "La cucina è una stanza.",
          "La camera è una stanza.",
          "La soffitta è una stanza.",
          "La cantina è una stanza.",
        ],
      },
      {
        tipo: "narr",
        testo:
          "L'articolo iniziale fa parte del nome e lo aiuta a suonare naturale; FAVELLA lo riconosce e non se ne preoccupa quando più avanti scriverai «la cucina». Da quel nome ricava anche il genere e il numero, e li userà per concordare gli articoli quando elencherà ciò che il giocatore ha davanti.",
      },
      { tipo: "narr", testo: "Aggiungine una tu: ne manca ancora qualcuna alla Casa." },
      {
        tipo: "checkpoint",
        consegna: "Dichiara lo studio di Adele come stanza.",
        attesa: "Lo studio di Adele è una stanza.",
        suggerimento: "«Lo studio di Adele è una stanza.» — con l'articolo «Lo» e il punto in fondo.",
        esito: "OK · Stanza «studio di Adele» creata.",
      },
      { tipo: "sistema", testo: "— Dare un volto a una stanza —" },
      {
        tipo: "narr",
        testo:
          "Una stanza senza descrizione è una scatola vuota. La descrizione è il testo che il giocatore legge appena entra: il primo sguardo, l'atmosfera, gli appigli. Si scrive così — «La descrizione della cucina è “…”.» — e la preposizione si accorda con il nome, come faresti parlando: della cucina, dello studio, dell'ingresso.",
      },
      {
        tipo: "codice",
        righe: [
          `La descrizione della cucina è "Pavimentazione di graniglia. Lo schienale della sedia è ancora sguarnito. Il bicchiere e il flacone sono dove li ha lasciati. L'hanno trovata seduta, hanno detto, non riversa.".`,
          `La descrizione dello studio è "Una scrivania ordinata. Un cassetto chiuso a chiave. Sotto i piedi un kilim. Alle pareti, due foto di gruppo da cui qualcuno è stato ritagliato.".`,
        ],
      },
      {
        tipo: "narr",
        testo:
          "Il testo sta sempre fra virgolette dritte. Nota che la descrizione non spiega tutto: lascia in vista un bicchiere, un flacone, un cassetto chiuso a chiave. Sono ami. Il giocatore abboccherà.",
      },
      {
        tipo: "narr",
        testo:
          "Tocca a te dare un volto a una stanza. Te lo rendo facile: il testo te lo passo io, tu monta la frase intorno. Descrivi il giardino così — «Erba, ghiaia, due piante di alloro.».",
      },
      {
        tipo: "checkpoint",
        consegna:
          'Scrivi la descrizione del giardino, con questo testo fra virgolette: «Erba, ghiaia, due piante di alloro.»',
        attesa: `La descrizione del giardino è "Erba, ghiaia, due piante di alloro.".`,
        suggerimento:
          'La forma è: La descrizione del giardino è "Erba, ghiaia, due piante di alloro.". — occhio al punto dentro le virgolette e al punto della frase.',
        esito: "OK · Il giardino adesso ha un suo volto.",
      },
      {
        tipo: "narr",
        testo:
          "Bravo. Avrai notato due punti vicini in fondo: uno chiude la frase del testo, dentro le virgolette; l'altro chiude la frase di FAVELLA, fuori. Sembra strano a vedersi, ma è giusto così.",
      },
      { tipo: "sistema", testo: "— Descrizioni che cambiano —" },
      {
        tipo: "narr",
        testo:
          "Una stanza non è sempre uguale a sé stessa. Quando scoppia il temporale, l'ingresso prende acqua; quando la torcia è spenta, la soffitta è solo buio. FAVELLA lo gestisce con le descrizioni condizionali: aggiungi una clausola «se», e quella descrizione varrà soltanto quando la condizione è vera.",
      },
      {
        tipo: "narr",
        testo: "La soffitta ha due volti. Al buio mostri il primo; con la torcia accesa, il secondo:",
      },
      {
        tipo: "codice",
        righe: [
          `La descrizione della soffitta se la torcia è spenta è "Buio fitto sotto la trave. Distingui solo l'angolo del lucernario, e non basta.".`,
          `La descrizione della soffitta è "Travi a vista, polvere a centimetri. Una scatola di latta tra due vecchie valigie vuote. Adele saliva qui ancora, di rado.".`,
        ],
      },
      {
        tipo: "narr",
        testo:
          "Il motore valuta le varianti nell'ordine in cui le scrivi e prende la prima la cui condizione è vera. Se nessuna lo è, ripiega sulla descrizione base, quella senza «se». Per questo la riga generica fa sempre da rete di sicurezza.",
      },
      {
        tipo: "tranello",
        testo:
          "Scrivi sempre una descrizione base, senza «se», anche se hai mille varianti condizionali. È il ripiego: senza, una stanza in cui per caso nessuna condizione è vera resterebbe muta, e il giocatore entrerebbe nel nulla.",
      },
      {
        tipo: "narr",
        testo:
          "Prova tu una variante al buio. La cantina, senza luce, è cieca. Scrivila con la clausola giusta e questo testo breve — «Sotto la scala è cieco.».",
      },
      {
        tipo: "checkpoint",
        consegna:
          'Dài alla cantina la sua descrizione al buio (quando «la torcia è spenta»), con il testo: «Sotto la scala è cieco.»',
        attesa: `La descrizione della cantina se la torcia è spenta è "Sotto la scala è cieco.".`,
        suggerimento:
          'La «se» va in mezzo: La descrizione della cantina se la torcia è spenta è "Sotto la scala è cieco.".',
        esito: "OK · Adesso la cantina, senza torcia, sarà solo buio.",
      },
      { tipo: "sistema", testo: "FINE CASSETTA 02 · PRONTO." },
      {
        tipo: "narr",
        testo:
          "Hai dato un volto alle stanze e hai imparato a farle cambiare con la storia. Per ora, però, sono ancora sette stanze isolate: non c'è modo di passare dall'una all'altra. Nella prossima cassetta tracciamo le porte. Riavvolgi quando vuoi.",
      },
    ],
  },

  muoversi: {
    id: "muoversi",
    numero: 3,
    titolo: "Muoversi tra le stanze",
    fonte: "Capitolo 5 · La Casa di Via Stradivari",
    durata: "~7 min",
    sommario:
      "Le porte: collegare le stanze con le direzioni, il ritorno automatico, da dove parte il giocatore e come inventare direzioni nuove.",
    blocchi: [
      { tipo: "sistema", testo: "FAVELLA CORSO · CASSETTA 03" },
      { tipo: "sistema", testo: '"Muoversi tra le stanze"' },
      {
        tipo: "narr",
        testo:
          "Sette stanze isolate non fanno una casa. Servono le porte: i collegamenti che permettono al giocatore di passare da un luogo all'altro. In FAVELLA si tracciano con una parola, «collega», e con una direzione.",
      },
      {
        tipo: "narr",
        testo:
          "La forma è semplice: «[Stanza A] collega [direzione] a [Stanza B].». Le direzioni di base sono nord, sud, est, ovest (con le abbreviazioni n, s, e, o).",
      },
      {
        tipo: "narr",
        testo:
          "E qui c'è una comodità che ti risparmia metà del lavoro: il collegamento di ritorno nasce da solo. Se l'ingresso porta a nord nel salotto, dal salotto si torna a sud nell'ingresso senza che tu lo scriva. Tu tracci una porta, FAVELLA la rende a due sensi.",
      },
      { tipo: "narr", testo: "Ecco la pianta completa della Casa, sette righe:" },
      {
        tipo: "codice",
        righe: [
          "L'ingresso collega nord a il salotto.",
          "L'ingresso collega ovest a lo studio.",
          "L'ingresso collega est a la cucina.",
          "L'ingresso collega basso a la cantina.",
          "Il salotto collega nord a la camera.",
          "La camera collega sopra a la soffitta.",
          "La cucina collega est a il giardino.",
        ],
      },
      {
        tipo: "narr",
        testo:
          "L'ingresso è lo snodo centrale, da cui si raggiungono salotto, studio e cucina; dal salotto si sale in camera, dalla camera in soffitta, dalla cucina si esce in giardino.",
      },
      {
        tipo: "tranello",
        testo:
          "Dopo la «a» il nome della stanza conserva il suo articolo: si scrive «a il salotto», «a lo studio», «a la cucina» — non «al salotto» o «allo studio». La parola di collegamento è la «a» semplice, e la stanza arriva col suo nome per intero, articolo compreso.",
      },
      { tipo: "narr", testo: "Traccia tu una porta. Dalla cucina, a est, si esce in giardino." },
      {
        tipo: "checkpoint",
        consegna: "Collega la cucina, verso est, al giardino.",
        attesa: "La cucina collega est a il giardino.",
        suggerimento:
          "«La cucina collega est a il giardino.» — ricorda l'articolo dopo la «a»: «a il giardino», non «al giardino».",
        esito: "OK · Cucina ↔ giardino collegate (e il ritorno è automatico).",
      },
      { tipo: "sistema", testo: "— Da dove parte il giocatore —" },
      {
        tipo: "narr",
        testo:
          "Le stanze ci sono, sono collegate, ma da dove comincia la storia? Lo decidi tu con una frase. Senza, FAVELLA farebbe partire il giocatore dalla prima stanza che ha incontrato: un caso, non una scelta.",
      },
      {
        tipo: "narr",
        testo:
          "La Casa si apre dove deve aprirsi: sull'uscio, con il soprabito di Adele ancora appeso. Diglielo. (Al posto di «comincia» puoi usare «inizia» o «parte», se ti suonano meglio.)",
      },
      {
        tipo: "checkpoint",
        consegna: "Fai cominciare il giocatore nell'ingresso.",
        attesa: "Il giocatore comincia in ingresso.",
        suggerimento: "«Il giocatore comincia in ingresso.» — qui «in ingresso» va senza articolo.",
        esito: "OK · La partita si aprirà sull'uscio della Casa.",
      },
      { tipo: "sistema", testo: "— Direzioni tue —" },
      {
        tipo: "narr",
        testo:
          "I quattro punti cardinali bastano per muoversi in piano, ma una casa ha anche un sopra e un sotto: la soffitta, la cantina. Le parole «su» e «giù» sono però riservate ad altri usi, e non si possono prendere come direzioni. La soluzione è dichiarare direzioni nuove, sempre in coppia.",
      },
      {
        tipo: "narr",
        testo:
          "Dichiararle in coppia garantisce il ritorno automatico, come per i punti cardinali. La Casa ne usa due distinte, e la distinzione è voluta:",
      },
      {
        tipo: "codice",
        righe: [
          "Alto e basso sono direzioni opposte.",
          "Sopra e sotto sono direzioni opposte.",
        ],
      },
      {
        tipo: "narr",
        testo:
          "Perché due coppie e non una? Perché alto/basso collegano l'ingresso alla cantina, mentre sopra/sotto collegano la camera alla soffitta. Tenendole separate potrai sbarrare un solo percorso alla volta — la porta della cantina bloccherà chi scende «basso», senza toccare chi sale «sopra». Quel tipo di blocco lo costruiremo nel capitolo sulle regole.",
      },
      { tipo: "narr", testo: "Dichiara tu la prima coppia: «alto» e «basso», opposte." },
      {
        tipo: "checkpoint",
        consegna: "Dichiara «alto» e «basso» come direzioni opposte.",
        attesa: "Alto e basso sono direzioni opposte.",
        suggerimento: "«Alto e basso sono direzioni opposte.» — al plurale: «sono», «direzioni», «opposte».",
        esito: "OK · Ora puoi collegare le stanze anche in verticale.",
      },
      { tipo: "sistema", testo: "FINE CASSETTA 03 · PRONTO." },
      {
        tipo: "narr",
        testo:
          "La mappa è in piedi e il giocatore sa da dove partire. Hai una casa vera, percorribile. Ma una casa che si attraversa e basta si visita una volta sola: servono le cose da toccare. Nella prossima cassetta, gli oggetti.",
      },
    ],
  },

  "gli-oggetti": {
    id: "gli-oggetti",
    numero: 4,
    titolo: "Gli oggetti",
    fonte: "Capitolo 6 · La Casa di Via Stradivari",
    durata: "~7 min",
    sommario:
      "Popolare il mondo: creare un oggetto, collocarlo in una stanza, decidere cosa si può raccogliere e dargli una descrizione.",
    blocchi: [
      { tipo: "sistema", testo: "FAVELLA CORSO · CASSETTA 04" },
      { tipo: "sistema", testo: '"Gli oggetti"' },
      {
        tipo: "narr",
        testo:
          "Una stanza vuota si visita una volta sola. Sono gli oggetti a darti qualcosa da fare: una torcia da accendere, una leva da impugnare, lettere da leggere o da bruciare. In FAVELLA un oggetto si crea come una stanza, con una frase, e poi lo si colloca nel mondo.",
      },
      {
        tipo: "narr",
        testo:
          "«Cosa» è la parola generica per qualunque elemento con cui il giocatore può interagire. Più avanti incontrerai parenti più specializzati — contenitori, supporti, personaggi — ma la maggior parte di ciò che popola una storia è, semplicemente, una cosa.",
      },
      {
        tipo: "narr",
        testo:
          "Costruiamone uno insieme, dall'inizio: il portaombrelli dell'ingresso. Ferro battuto, pesante. Servirà da leva, più avanti. Per prima cosa, dichiaralo come oggetto.",
      },
      {
        tipo: "checkpoint",
        consegna: "Dichiara il portaombrelli come oggetto («una cosa»).",
        attesa: "Il portaombrelli è una cosa.",
        suggerimento: "«Il portaombrelli è una cosa.» — una cosa, al singolare, con il punto.",
        esito: "OK · Oggetto «portaombrelli» creato.",
      },
      { tipo: "sistema", testo: "— Collocare un oggetto —" },
      {
        tipo: "narr",
        testo:
          "Appena creato, un oggetto non sta da nessuna parte: esiste, ma è in un limbo. Per metterlo in scena gli dài una posizione, e la preposizione si accorda con la stanza, come quando parli: in ingresso, in cucina, nel giardino.",
      },
      { tipo: "narr", testo: "Mettilo dov'è di casa: nell'ingresso, accanto alla porta." },
      {
        tipo: "checkpoint",
        consegna: "Colloca il portaombrelli nell'ingresso.",
        attesa: "Il portaombrelli è in ingresso.",
        suggerimento: "«Il portaombrelli è in ingresso.» — qui basta «in ingresso».",
        esito: "OK · Adesso il portaombrelli sta nell'ingresso.",
      },
      { tipo: "sistema", testo: "— Prendere o non prendere —" },
      {
        tipo: "narr",
        testo:
          "C'è una riga che merita attenzione. Di norma gli oggetti NON si possono raccogliere: il tavolo del salotto resta dov'è, la porta della cantina non te la metti in tasca. Solo ciò che dichiari esplicitamente prendibile finisce nell'inventario del giocatore.",
      },
      {
        tipo: "tranello",
        testo:
          "Se un oggetto importante «non si lascia prendere», la prima cosa da controllare è proprio questa: hai dimenticato la riga «è prendibile». FAVELLA, di sua iniziativa, non lascia raccogliere nulla.",
      },
      {
        tipo: "narr",
        testo:
          "Il portaombrelli deve poter finire in mano al giocatore — gli servirà per fare leva sul cassetto. Rendilo raccoglibile.",
      },
      {
        tipo: "checkpoint",
        consegna: "Fai in modo che il portaombrelli si possa raccogliere.",
        attesa: "Il portaombrelli è prendibile.",
        suggerimento: "«Il portaombrelli è prendibile.» — l'aggettivo è «prendibile».",
        esito: "OK · Il giocatore può raccogliere il portaombrelli e portarlo con sé.",
      },
      {
        tipo: "narr",
        testo:
          "Tre righe sullo stesso oggetto: cos'è, dove si trova, se si prende. Le puoi scrivere in qualunque ordine — la Casa lo fa di continuo — ma tenerle vicine, raggruppate per oggetto, rende il file molto più leggibile.",
      },
      { tipo: "sistema", testo: "— Descrivere un oggetto —" },
      {
        tipo: "narr",
        testo:
          "Vale quanto detto per le stanze: la descrizione è ciò che il giocatore legge quando esamina l'oggetto, la preposizione si accorda, e anche qui puoi avere una versione che cambia con lo stato del mondo. Guarda la torcia, che racconta due cose diverse a seconda che sia spenta o accesa:",
      },
      {
        tipo: "codice",
        righe: [
          `La descrizione della torcia è "Una di quelle torce a manovella che teneva accanto al letto. Vernice rossa, mezza pelata.".`,
          `La descrizione della torcia se la torcia è accesa è "Il fascio è giallo e tremante, ma tiene.".`,
        ],
      },
      {
        tipo: "narr",
        testo:
          "Spenta o accesa: per dirlo ci serviva una proprietà — accesa, spenta. Ed è proprio l'argomento della prossima cassetta.",
      },
      { tipo: "sistema", testo: "FINE CASSETTA 04 · PRONTO." },
      {
        tipo: "narr",
        testo:
          "Hai costruito il tuo primo oggetto pezzo per pezzo: dichiarato, collocato, reso prendibile. La Casa ne ha una cinquantina, ma il metodo è sempre questo. Nella prossima cassetta diamo agli oggetti uno stato — aperto o chiuso, acceso o spento — che è il primo mattone di ogni enigma.",
      },
    ],
  },

  proprieta: {
    id: "proprieta",
    numero: 5,
    titolo: "Proprietà e stati",
    fonte: "Capitolo 7 · La Casa di Via Stradivari",
    durata: "~7 min",
    sommario:
      "Gli aggettivi che dicono com'è una cosa adesso — chiusa, accesa, scavata — e le coppie di opposti che si escludono a vicenda. La materia prima di ogni enigma.",
    blocchi: [
      { tipo: "sistema", testo: "FAVELLA CORSO · CASSETTA 05" },
      { tipo: "sistema", testo: '"Proprietà e stati a due valori"' },
      {
        tipo: "narr",
        testo:
          "Una porta è chiusa o aperta. Una torcia è spenta o accesa. La terra del giardino è compatta finché non la scavi. Queste sono proprietà: aggettivi che dicono com'è un oggetto in questo momento, e che possono cambiare durante la partita. Sono la materia prima di ogni enigma.",
      },
      {
        tipo: "narr",
        testo:
          "Assegnarle è facilissimo, e la forma la conosci già: «[oggetto] è [proprietà].». La scrivi una volta, per fissare lo stato di partenza dell'oggetto. Ricordi la regola della cassetta 01? La proprietà è sempre una parola sola.",
      },
      {
        tipo: "codice",
        righe: [
          "La torcia è spenta.",
          "La credenza è chiusa.",
          "Il cassetto è chiuso.",
          "La terra smossa è compatta.",
        ],
      },
      {
        tipo: "narr",
        testo:
          "Da quel momento puoi chiedere al gioco se quella proprietà vale — «se la torcia è spenta» — e una conseguenza potrà cambiarla. Per ora fissiamo lo stato iniziale, e basta. La torcia di Adele, quando comincia la storia, è spenta. Diglielo.",
      },
      {
        tipo: "checkpoint",
        consegna: "Fissa lo stato iniziale della torcia: è spenta.",
        attesa: "La torcia è spenta.",
        suggerimento: "«La torcia è spenta.» — una proprietà, una parola, il punto.",
        esito: "OK · La torcia parte spenta.",
      },
      { tipo: "sistema", testo: "— Le coppie di opposti —" },
      {
        tipo: "narr",
        testo:
          "Quasi sempre una proprietà ha il suo contrario, e i due si escludono: una torcia accesa non è spenta. FAVELLA conosce già la coppia più comune, «aperta» e «chiusa». Le altre gliele insegni tu, dichiarandole opposte.",
      },
      {
        tipo: "codice",
        righe: ["Accesa e spenta sono opposte.", "Compatta e scavata sono opposte."],
      },
      {
        tipo: "narr",
        testo:
          "Il vantaggio è automatico: quando una conseguenza renderà la torcia accesa, la proprietà spenta cadrà da sola, senza che tu debba toglierla. Lo stesso per la terra, che passa da compatta a scavata una volta sola e non si lascia scavare due volte.",
      },
      {
        tipo: "narr",
        testo:
          "Insegna a FAVELLA la coppia della torcia: «accesa» e «spenta», opposte. (Il maschile o femminile della prima parola non conta: contano le due radici.)",
      },
      {
        tipo: "checkpoint",
        consegna: "Dichiara «accesa» e «spenta» come proprietà opposte.",
        attesa: "Accesa e spenta sono opposte.",
        suggerimento: "«Accesa e spenta sono opposte.» — al plurale: «sono opposte».",
        esito: "OK · D'ora in poi accesa esclude spenta, e viceversa.",
      },
      { tipo: "sistema", testo: "— Maschile, femminile: ci pensa il motore —" },
      {
        tipo: "narr",
        testo:
          "Forse l'hai notato: la torcia è spenta, il cassetto è chiuso. Stessa idea, desinenza diversa, perché l'italiano concorda l'aggettivo col genere. FAVELLA non ti obbliga a starci attento: confronta le proprietà per la loro radice, così «chiuso» e «chiusa» sono per lui la stessa cosa.",
      },
      {
        tipo: "tranello",
        testo:
          "Quel che cambia la radice, però, FAVELLA lo intercetta: un vero refuso come «chiuao» ti viene segnalato. La tolleranza vale sulla desinenza (chiuso/chiusa), non sugli errori di battitura. Scrivere l'accordo giusto resta buona regola: il testo si legge meglio.",
      },
      {
        tipo: "narr",
        testo:
          "Un'ultima, perché ti torni comoda quando faremo gli enigmi: da sole, le proprietà non fanno succedere niente. Dicono uno stato, e basta. Sono l'aggancio. La porta della cantina parte chiusa; una regola controllerà quella proprietà per decidere se lasciarti scendere, e un'altra la renderà aperta quando giri la chiave giusta.",
      },
      {
        tipo: "narr",
        testo:
          "Mettiamo in scena quella porta. All'inizio della storia è sbarrata: dichiarala chiusa.",
      },
      {
        tipo: "checkpoint",
        consegna: "Fai partire la porta della cantina come chiusa.",
        attesa: "La porta della cantina è chiusa.",
        suggerimento:
          "«La porta della cantina è chiusa.» — il nome è lungo per intero, la proprietà è una parola.",
        esito: "OK · La cantina, per ora, è inaccessibile. Servirà la chiave.",
      },
      { tipo: "sistema", testo: "FINE CASSETTA 05 · PRONTO." },
      {
        tipo: "narr",
        testo:
          "Hai dato agli oggetti uno stato che può cambiare: il perno di ogni puzzle. Ma certe cose non stanno semplicemente «in una stanza»: stanno dentro o sopra altre cose. La chiave nella credenza, la torcia sul tavolino. Nella prossima cassetta: contenitori e supporti.",
      },
    ],
  },

  contenitori: {
    id: "contenitori",
    numero: 6,
    titolo: "Contenitori e supporti",
    fonte: "Capitolo 8 · La Casa di Via Stradivari",
    durata: "~7 min",
    sommario:
      "Le cose che ne contengono altre — dentro o sopra — e perché un contenitore chiuso nasconde. Più gli alias: lo stesso oggetto con più nomi.",
    blocchi: [
      { tipo: "sistema", testo: "FAVELLA CORSO · CASSETTA 06" },
      { tipo: "sistema", testo: '"Contenitori e supporti"' },
      {
        tipo: "narr",
        testo:
          "Non tutto sta semplicemente «in una stanza». Certe cose stanno dentro altre — la chiave nella credenza, le lettere nel cassetto — o sopra altre — la torcia sul tavolino. FAVELLA distingue questi due ruoli con due parole: contenitore e supporto.",
      },
      {
        tipo: "narr",
        testo:
          "Un contenitore tiene cose dentro di sé e può essere aperto o chiuso; un supporto tiene cose sopra, in vista. La credenza del salotto è un contenitore; il tavolino dell'ingresso, un supporto.",
      },
      {
        tipo: "codice",
        righe: [
          "La credenza è un contenitore.",
          "La credenza è in salotto.",
          "La credenza è chiusa.",
          "",
          "Il tavolino è un supporto.",
          "Il tavolino è in ingresso.",
        ],
      },
      {
        tipo: "narr",
        testo:
          "Per il resto si comportano come oggetti qualsiasi: hanno una posizione, una descrizione, eventuali proprietà. Dichiara tu il tavolino dell'ingresso come supporto.",
      },
      {
        tipo: "checkpoint",
        consegna: "Dichiara il tavolino come supporto.",
        attesa: "Il tavolino è un supporto.",
        suggerimento: "«Il tavolino è un supporto.» — un supporto, al singolare.",
        esito: "OK · Il tavolino può reggere oggetti in vista.",
      },
      { tipo: "sistema", testo: "— Metterci dentro qualcosa —" },
      {
        tipo: "narr",
        testo:
          "Per collocare un oggetto dentro un contenitore o sopra un supporto usi la stessa frase di posizione vista per le stanze, scegliendo la preposizione giusta: nella credenza, nel cassetto, sul tavolino.",
      },
      {
        tipo: "codice",
        righe: [
          "La chiave della cantina è nella credenza.",
          "Le lettere è nel cassetto.",
          "La torcia è sul tavolino.",
        ],
      },
      {
        tipo: "narr",
        testo:
          "E qui torna comoda la robustezza d'ordine di cui parlavamo: puoi mettere la torcia sul tavolino anche prima di aver dichiarato che il tavolino è un supporto. FAVELLA sistema tutto a fine lettura. Posa tu la torcia sul tavolino.",
      },
      {
        tipo: "checkpoint",
        consegna: "Metti la torcia sul tavolino.",
        attesa: "La torcia è sul tavolino.",
        suggerimento: "«La torcia è sul tavolino.» — sopra un supporto si usa «sul/sulla».",
        esito: "OK · La torcia è appoggiata sul tavolino dell'ingresso.",
      },
      { tipo: "sistema", testo: "— Un contenitore chiuso nasconde —" },
      {
        tipo: "narr",
        testo:
          "C'è un motivo se la credenza nasce chiusa. Un contenitore chiuso non mostra il suo contenuto: finché il giocatore non lo apre, la chiave lì dentro è come se non ci fosse. È esattamente ciò che rende la credenza un piccolo enigma invece di uno scaffale.",
      },
      {
        tipo: "tranello",
        testo:
          "Se metti un oggetto-chiave dentro un contenitore e ti dimentichi di renderlo apribile con una regola, il giocatore non lo troverà mai. Un contenitore chiuso senza modo di aprirlo è un vicolo cieco. (Le regole di apertura arrivano fra due cassette.)",
      },
      { tipo: "sistema", testo: "— Alias: lo stesso oggetto, più nomi —" },
      {
        tipo: "narr",
        testo:
          "Tu chiami un oggetto «flacone di medicine»; il giocatore digiterà «medicine». Per non costringerlo a indovinare il tuo nome esatto, gli dài degli alias: sinonimi che valgono solo per ciò che lui scrive. Essendo vocabolario nuovo, l'alias va tra virgolette.",
      },
      {
        tipo: "codice",
        righe: [
          `La torcia si chiama anche "pila".`,
          `Le lettere si chiama anche "corrispondenza".`,
          `L'atto di vendita si chiama anche "carte".`,
        ],
      },
      {
        tipo: "narr",
        testo:
          "Nelle tue regole continuerai a usare il nome canonico (la torcia, non «pila»): l'alias è una cortesia verso chi gioca, non un secondo nome per te. Dài tu alla torcia il suo alias «pila».",
      },
      {
        tipo: "checkpoint",
        consegna: 'Fai in modo che la torcia risponda anche al nome «pila».',
        attesa: `La torcia si chiama anche "pila".`,
        suggerimento: 'La forma è: La torcia si chiama anche "pila". — il sinonimo tra virgolette.',
        esito: "OK · Ora «prendi la pila» funzionerà come «prendi la torcia».",
      },
      { tipo: "sistema", testo: "FINE CASSETTA 06 · PRONTO." },
      {
        tipo: "narr",
        testo:
          "Hai imparato a innestare le cose le une nelle altre e a dare più nomi a un oggetto. Finora però la storia non tiene il conto di niente: non sa quanto il giocatore ha capito, né a che punto è il temporale. Nella prossima cassetta diamo alla storia una memoria: stati e contatori.",
      },
    ],
  },

  "stati-contatori": {
    id: "stati-contatori",
    numero: 7,
    titolo: "Stati e contatori",
    fonte: "Capitolo 9 · La Casa di Via Stradivari",
    durata: "~8 min",
    sommario:
      "La memoria astratta della storia: gli stati a più valori, i contatori con il loro valore iniziale, i confronti numerici e l'interpolazione [tra parentesi quadre].",
    blocchi: [
      { tipo: "sistema", testo: "FAVELLA CORSO · CASSETTA 07" },
      { tipo: "sistema", testo: '"Stati e contatori"' },
      {
        tipo: "narr",
        testo:
          "Le proprietà raccontano com'è un oggetto. Ma una storia deve tenere il conto anche di cose che non stanno in nessun oggetto: a che punto è il temporale, quanto sa il giocatore, quanti indizi ha raccolto. Per questo ci sono gli stati e i contatori — la memoria astratta della tua avventura.",
      },
      {
        tipo: "narr",
        testo:
          "Uno stato è una variabile che può assumere uno fra più valori, come un interruttore a più posizioni. Lo dichiari, poi ne fissi il valore iniziale. Nella Casa la verità sul conto di Adele attraversa più stadi, e il temporale pure:",
      },
      {
        tipo: "codice",
        righe: [
          "La verita è uno stato.",
          "La verita è ignota.",
          "",
          "Il temporale è uno stato.",
          "Il temporale è lontano.",
        ],
      },
      {
        tipo: "narr",
        testo:
          "I valori — ignota, sospetta, svelata per la verità — non si elencano in anticipo: li introduci usandoli. Da quel momento puoi interrogare lo stato in una condizione («se la verita è svelata») e cambiarlo con una conseguenza. Dichiara tu lo stato «verita», per cominciare.",
      },
      {
        tipo: "tranello",
        testo:
          "Avrai notato: nella Casa lo stato si chiama «verita», senza accento. È solo la grafia scelta da chi ha scritto la storia. FAVELLA oggi accetta benissimo gli accenti nei nomi, e «La verità è uno stato.» compila senza problemi. L'unica cosa da ricordare è la coerenza: «verita» e «verità» restano due nomi diversi, quindi una volta deciso come scrivere uno stato, scrivilo sempre allo stesso modo. Qui seguiamo la Casa alla lettera.",
      },
      {
        tipo: "checkpoint",
        consegna: "Dichiara «la verita» come stato, scritto come nella Casa (senza accento).",
        attesa: "La verita è uno stato.",
        suggerimento: "«La verita è uno stato.» — la parola chiave è «uno stato»; il nome ricalcalo dalla Casa: «verita».",
        esito: "OK · Stato «verita» creato. Più avanti gli daremo un valore iniziale.",
      },
      {
        tipo: "narr",
        testo:
          "Appena dichiarato, uno stato vuole un valore di partenza. All'inizio della storia, della verità non si sa nulla: è ignota. Fissalo.",
      },
      {
        tipo: "checkpoint",
        consegna: "Fissa il valore iniziale della verita: è ignota.",
        attesa: "La verita è ignota.",
        suggerimento: "«La verita è ignota.» — il valore «ignota» lo stai introducendo proprio ora.",
        esito: "OK · La storia parte con la verità ancora da scoprire.",
      },
      { tipo: "sistema", testo: "— I contatori —" },
      {
        tipo: "narr",
        testo:
          "Un contatore tiene un numero. Parte da zero, se non dici altro, e lo fai salire o scendere nel corso della partita. Gli indizi raccolti, la fiducia della vicina: due contatori.",
      },
      {
        tipo: "codice",
        righe: ["Gli indizi è un contatore.", "La fiducia è un contatore."],
      },
      {
        tipo: "tranello",
        testo:
          "Nota la copula nel dichiarare uno stato o un contatore: resta sempre «è», anche con un nome plurale come «gli indizi» (Gli indizi è un contatore). La forma plurale «sono» vale per gli oggetti, non per questa dichiarazione.",
      },
      {
        tipo: "narr",
        testo:
          "A volte zero non è il punto di partenza giusto. La calma del protagonista parte piena e cala man mano che la casa svela ciò che nasconde: la dichiari con un valore iniziale, «parte da».",
      },
      {
        tipo: "codice",
        righe: ["La calma è un contatore.", "La calma parte da 3."],
      },
      {
        tipo: "narr",
        testo: "Fai partire tu la calma da 3 (il contatore «calma» è già dichiarato qui sopra).",
      },
      {
        tipo: "checkpoint",
        consegna: "Fai partire il contatore «calma» dal valore 3.",
        attesa: "La calma parte da 3.",
        suggerimento: "«La calma parte da 3.» — «parte da» e poi il numero.",
        esito: "OK · La calma comincia piena, a 3, pronta a essere intaccata.",
      },
      { tipo: "sistema", testo: "— Confrontare un numero —" },
      {
        tipo: "narr",
        testo:
          "Il bello di un numero è che lo puoi confrontare. FAVELLA mette a disposizione tutta la scala, da usare nelle condizioni: «è N» (esatto), «non è N» (diverso), «è almeno N» (≥), «è al massimo N» (≤), «è più di N» (>), «è meno di N» (<).",
      },
      {
        tipo: "narr",
        testo:
          "La Casa li usa per far maturare gli eventi: certe rivelazioni si sbloccano solo quando hai raccolto abbastanza indizi, e la tensione monta quando la calma scende sotto una soglia.",
      },
      { tipo: "sistema", testo: "— Far parlare i numeri: l'interpolazione —" },
      {
        tipo: "narr",
        testo:
          "Uno stato o un contatore non resta chiuso nella logica: puoi mostrarne il valore dentro qualunque testo, scrivendone il nome fra parentesi quadre. A gioco avviato, FAVELLA sostituisce il segnaposto con il valore corrente.",
      },
      {
        tipo: "codice",
        righe: [
          `Invece di ricorda se la verita è svelata: dire "Hai messo insieme [indizi] frammenti, e bastano.".`,
        ],
      },
      {
        tipo: "narr",
        testo:
          "Se al momento giusto il contatore vale quattro, il giocatore leggerà «Hai messo insieme 4 frammenti, e bastano». La stessa interpolazione funziona nelle descrizioni, nelle risposte delle regole, nelle battute dei personaggi: ovunque ci sia un testo fra virgolette.",
      },
      { tipo: "sistema", testo: "FINE CASSETTA 07 · PRONTO." },
      {
        tipo: "narr",
        testo:
          "Adesso il tuo mondo ha una memoria: sa contare, ricordare, misurare. Hai messo a terra tutti i mattoni — stanze, oggetti, proprietà, stati. Da qui in avanti il gioco smette di descrivere e comincia a reagire. Nella prossima cassetta, il cuore di FAVELLA: le regole «Invece di».",
      },
    ],
  },

  regole: {
    id: "regole",
    numero: 8,
    titolo: "Le regole «Invece di»",
    fonte: "Capitolo 10 · La Casa di Via Stradivari",
    durata: "~9 min",
    sommario:
      "Il cuore di FAVELLA: l'unica forma di regola. Cosa vuol dire «al posto di», le condizioni con «se», i verbi inventati, le regole a due oggetti e quelle globali.",
    blocchi: [
      { tipo: "sistema", testo: "FAVELLA CORSO · CASSETTA 08" },
      { tipo: "sistema", testo: '"Le regole: Invece di"' },
      {
        tipo: "narr",
        testo:
          "Finora hai costruito un mondo: stanze, oggetti, stati. Ma un mondo che non risponde non è ancora una storia. Le regole sono il punto in cui FAVELLA smette di descrivere e comincia a reagire: dicono al gioco cosa fare quando il giocatore prova ad aprire, a prendere, a usare qualcosa.",
      },
      {
        tipo: "narr",
        testo:
          "Tieni a mente una cosa, perché è la più importante del corso: in FAVELLA esiste un'unica forma di regola, e si apre sempre con le stesse due parole — «Invece di». Il nome non è casuale.",
      },
      { tipo: "sistema", testo: "— «Invece di» vuol dire «al posto di» —" },
      {
        tipo: "narr",
        testo:
          "Quando una regola scatta, il motore esegue la regola al posto di ciò che avrebbe fatto normalmente. Non in aggiunta: al posto di. La frase che scrivi tu sostituisce in pieno il comportamento predefinito del verbo. Il verbo va all'imperativo, come lo digiterebbe il giocatore: apri (non «aprire»), prendi (non «prendere»).",
      },
      {
        tipo: "narr",
        testo:
          "La regola più semplice possibile è una falsa pista onesta. Nello studio di Adele, il giocatore solleva il tappeto sperando in una botola; non c'è nulla, e glielo diciamo:",
      },
      {
        tipo: "codice",
        righe: [
          `Invece di sposta il tappeto dello studio: dire "Sollevi un angolo. Parquet, polvere, niente. Adele non era una che nascondeva sotto i tappeti.".`,
        ],
      },
      {
        tipo: "tranello",
        testo:
          'Se scrivi «Invece di prendi la torcia: dire "Scotta!".», il giocatore vedrà il messaggio E la torcia NON finirà nell\'inventario: hai sostituito l\'intera azione «prendi», compreso il suo effetto. «Invece di» spegne il comportamento di default. Per conservarlo dovrai ricrearlo con una conseguenza «e adesso» — la prossima cassetta.',
      },
      {
        tipo: "narr",
        testo:
          "Proviamo la forma semplice, dove sostituire non fa danni perché il verbo non cambiava nulla. Nel giardino, spostare il vaso una seconda volta non rivela altro. Scrivi la regola — il testo è «Sposti il vaso. Nulla di nuovo.».",
      },
      {
        tipo: "checkpoint",
        consegna:
          'Scrivi una regola «Invece di» per «sposta il vaso di gerani», col testo: «Sposti il vaso. Nulla di nuovo.»',
        attesa: `Invece di sposta il vaso di gerani: dire "Sposti il vaso. Nulla di nuovo.".`,
        suggerimento:
          'La forma è: Invece di sposta il vaso di gerani: dire "Sposti il vaso. Nulla di nuovo.". — due punti dopo l\'azione, poi «dire».',
        esito: "OK · Spostare il vaso ora ha una risposta tua.",
      },
      { tipo: "sistema", testo: "— La parola «se» —" },
      {
        tipo: "narr",
        testo:
          "Una regola può aspettare il momento giusto. Aggiungendo una clausola «se», scatta solo quando la condizione è vera; altrimenti il motore prosegue e cerca un'altra regola applicabile.",
      },
      {
        tipo: "narr",
        testo:
          "La torcia di Adele è a manovella: per accenderla devi averla in mano. Servono due regole, una per «ci riesco» e una per «non ci riesco». La prima usa una condizione composta con «e» (la logica completa è nella prossima cassetta):",
      },
      {
        tipo: "codice",
        righe: [
          `Invece di accendi la torcia se la torcia è spenta e il giocatore ha la torcia: dire "Carichi la manovella per dieci secondi. Il fascio è giallo e tremante, ma tiene." e adesso la torcia è accesa.`,
          `Invece di accendi la torcia se la torcia è spenta: dire "Devi averla in mano per caricarla.".`,
        ],
      },
      {
        tipo: "tranello",
        testo:
          "Le regole condizionali hanno la precedenza su quelle semplici, e fra due condizionali vince la prima dichiarata che risulta vera. Per questo la riga con la condizione più stringente va scritta PRIMA del ripiego più generico: il motore le prova nell'ordine.",
      },
      {
        tipo: "narr",
        testo:
          "Scrivi tu il ripiego, quello generico: se provi ad accendere la torcia spenta ma non l'hai in mano, ti dice cosa manca. Il testo è «Devi averla in mano per caricarla.».",
      },
      {
        tipo: "checkpoint",
        consegna:
          'Scrivi la regola condizionale «Invece di accendi la torcia se la torcia è spenta», col testo: «Devi averla in mano per caricarla.»',
        attesa: `Invece di accendi la torcia se la torcia è spenta: dire "Devi averla in mano per caricarla.".`,
        suggerimento:
          'La «se» sta fra l\'azione e i due punti: Invece di accendi la torcia se la torcia è spenta: dire "Devi averla in mano per caricarla.".',
        esito: "OK · Una regola che scatta solo a torcia spenta.",
      },
      { tipo: "sistema", testo: "— Verbi che inventi tu —" },
      {
        tipo: "narr",
        testo:
          "accendi, spegni, forza, scava, brucia: non sono verbi che FAVELLA conosce da sé, li hai inventati tu per questa storia. Un verbo nuovo è vocabolario nuovo, e come ogni vocabolario nuovo si dichiara tra virgolette: «\"accendi\" è un comando.». Da quel momento il giocatore può digitarlo e tu puoi intercettarlo con «Invece di».",
      },
      {
        tipo: "narr",
        testo:
          "Dichiara tu il primo dei verbi della Casa: «accendi». (Un comando può anche essere di più parole, come \"fai scattare\": il motore riconosce l'intera espressione.)",
      },
      {
        tipo: "checkpoint",
        consegna: "Dichiara «accendi» come comando.",
        attesa: `"accendi" è un comando.`,
        suggerimento: 'Tra virgolette: "accendi" è un comando. — il verbo è vocabolario nuovo.',
        esito: "OK · Ora «accendi» è un verbo che il giocatore può digitare.",
      },
      { tipo: "sistema", testo: "— Regole a due oggetti —" },
      {
        tipo: "narr",
        testo:
          "Molti enigmi nascono dall'incontro di due cose: una chiave e una porta, una leva e un cassetto. FAVELLA lo scrive con una preposizione fra i due oggetti — su, con, contro, in (anche articolate: sulla, nella…). La porta della cantina si apre con la sua chiave:",
      },
      {
        tipo: "codice",
        righe: [
          `Invece di usa la chiave della cantina sulla porta della cantina se la porta della cantina è chiusa: dire "La doppia mappa gira due volte, di scatto. La porta si apre verso il basso." e adesso la porta della cantina è aperta.`,
        ],
      },
      {
        tipo: "tranello",
        testo:
          "Il motore è tollerante sulla preposizione: se i due oggetti individuano una sola interazione possibile, «usa la chiave con la porta» funziona anche se la regola era scritta con «sulla». Così il giocatore non deve indovinare la preposizione «giusta».",
      },
      { tipo: "sistema", testo: "— Regole globali: senza bersaglio —" },
      {
        tipo: "narr",
        testo:
          "A volte la reazione non riguarda un oggetto, ma lo stato della storia. Una regola può fare a meno dell'oggetto e scattare sul solo verbo. Il verbo «ricorda», in fondo alla Casa, tira le somme degli indizi raccolti:",
      },
      {
        tipo: "codice",
        righe: [
          `Invece di ricorda se la verita è svelata: dire "Tua zia. Le lettere chiuse. Il bambino consegnato. Le mensilità mai cessate. Hai messo insieme [indizi] frammenti, e bastano.".`,
          `Invece di ricorda: dire "Non hai abbastanza pezzi per cucirli insieme. Non ancora.".`,
        ],
      },
      {
        tipo: "narr",
        testo:
          "Una regola specifica, legata a un oggetto, vince comunque su una globale: prima il motore cerca la regola puntuale, poi ripiega su quella generale. Mettendo più regole sullo stesso verbo, dalla più esigente alla più generica, ottieni una «catena di ripiego» — il pattern più utile di tutti, che vedremo all'opera scavando la terra del giardino.",
      },
      { tipo: "sistema", testo: "FINE CASSETTA 08 · PRONTO." },
      {
        tipo: "narr",
        testo:
          "Hai imparato l'unico tipo di regola che esiste, e quante cose sa fare. Le hai viste cambiare il mondo con quel «e adesso» in coda, ma l'abbiamo solo sfiorato. Nella prossima cassetta lo apriamo per bene: le condizioni composte e tutte le conseguenze.",
      },
    ],
  },

  conseguenze: {
    id: "conseguenze",
    numero: 9,
    titolo: "Logica e conseguenze",
    fonte: "Capitolo 11 · La Casa di Via Stradivari",
    durata: "~8 min",
    sommario:
      "Le due metà che rendono una regola potente: le condizioni composte (e, oppure, non) e le conseguenze «e adesso» che cambiano davvero il mondo.",
    blocchi: [
      { tipo: "sistema", testo: "FAVELLA CORSO · CASSETTA 09" },
      { tipo: "sistema", testo: '"Logica e conseguenze"' },
      {
        tipo: "narr",
        testo:
          "Nella cassetta scorsa hai visto la parte sinistra di una regola: il verbo, la condizione. Ora guardiamo le due metà che la rendono davvero potente: le condizioni composte, che decidono con precisione quando scattare, e le conseguenze, che cambiano il mondo dopo che è scattata.",
      },
      { tipo: "sistema", testo: "— Comporre le condizioni —" },
      {
        tipo: "narr",
        testo:
          "Una condizione semplice controlla un fatto solo. Spesso la realtà ne richiede diversi insieme. FAVELLA le combina con tre parole: «[A] e [B]» (vere entrambe), «[A] oppure [B]» (vera almeno una), «non […]» (la negazione, infilata nella frase).",
      },
      {
        tipo: "narr",
        testo:
          "L'«e» lo hai già incontrato accendendo la torcia. L'«oppure» regge invece il finale più amaro della Casa: bruciare le lettere è impedito se la torcia è spenta oppure se non hai le lettere in mano.",
      },
      {
        tipo: "codice",
        righe: [
          `Invece di brucia le lettere se la torcia è spenta oppure il giocatore non ha le lettere: dire "Non così, non adesso.".`,
        ],
      },
      {
        tipo: "narr",
        testo:
          "La negazione, in italiano, sta dentro la frase: «il giocatore non ha le lettere», «il medaglione non è notato». È il modo naturale di scriverla, ed è anche quello che FAVELLA capisce.",
      },
      {
        tipo: "tranello",
        testo:
          "Per l'O logico usa sempre la parola intera «oppure», mai la lettera «o» (che vale «ovest»). Allo stesso modo l'E logico è «e», da non confondere con «est» quando scrivi una direzione.",
      },
      {
        tipo: "narr",
        testo:
          "Tocca a te. Scrivi la regola che impedisce di bruciare le lettere quando non è il momento — il testo è «Non così, non adesso.». Usa «oppure» e la negazione «non ha».",
      },
      {
        tipo: "checkpoint",
        consegna:
          'Scrivi: «Invece di brucia le lettere se la torcia è spenta oppure il giocatore non ha le lettere», col testo «Non così, non adesso.»',
        attesa: `Invece di brucia le lettere se la torcia è spenta oppure il giocatore non ha le lettere: dire "Non così, non adesso.".`,
        suggerimento:
          'Tutto in fila: Invece di brucia le lettere se la torcia è spenta oppure il giocatore non ha le lettere: dire "Non così, non adesso.".',
        esito: "OK · Due condizioni in O: basta che una sia vera e la regola scatta.",
      },
      {
        tipo: "narr",
        testo:
          "Quando ti serve negare un intero gruppo, lo racchiudi tra parentesi e gli premetti «non». È una forma disponibile, che la Casa non usa ma è perfettamente valida:",
      },
      {
        tipo: "codice",
        righe: [
          `Invece di esci se non ( il giocatore ha le lettere e la verita è svelata ): dire "Non puoi andartene così.".`,
        ],
      },
      { tipo: "sistema", testo: "— Cambiare il mondo: «e adesso» —" },
      {
        tipo: "narr",
        testo:
          "Una regola che dice soltanto qualcosa è muta sul mondo. Per farle cambiare lo stato delle cose, aggiungi in coda una o più conseguenze, introdotte da «e adesso». Sono di pochi tipi, e li hai già visti sparsi qua e là.",
      },
      {
        tipo: "narr",
        testo:
          "La prima cambia una proprietà: è quella che apre porte e spegne torce. Premi l'interruttore, e la torcia accesa diventa spenta.",
      },
      {
        tipo: "codice",
        righe: [
          `Invece di spegni la torcia se la torcia è accesa: dire "Premi l'interruttore. Buio." e adesso la torcia è spenta.`,
        ],
      },
      {
        tipo: "narr",
        testo:
          "Scrivila tu, questa: spegnere la torcia accesa la rende spenta. Il testo è «Premi l'interruttore. Buio.», e in coda la conseguenza «e adesso la torcia è spenta».",
      },
      {
        tipo: "checkpoint",
        consegna:
          'Scrivi: «Invece di spegni la torcia se la torcia è accesa», testo «Premi l\'interruttore. Buio.», e in coda «e adesso la torcia è spenta».',
        attesa: `Invece di spegni la torcia se la torcia è accesa: dire "Premi l'interruttore. Buio." e adesso la torcia è spenta.`,
        suggerimento:
          'La conseguenza va DOPO la frase «dire», fuori dalle virgolette: … dire "Premi l\'interruttore. Buio." e adesso la torcia è spenta.',
        esito: "OK · Ora spegnere la torcia cambia davvero il suo stato.",
      },
      {
        tipo: "narr",
        testo:
          "Gli altri tipi di conseguenza sono pochi e li riconosci a colpo d'occhio: spostare un oggetto (in una stanza, in un contenitore, nell'inventario) o farlo sparire mandandolo «nel nulla»; muovere un contatore («aumenta», «diminuisci», oppure «diventa N»); cambiare uno stato. Una sola azione può farne più d'una di seguito, ciascuna col suo «e adesso»:",
      },
      {
        tipo: "codice",
        righe: [
          `Invece di esamina la fotografia se la verita è ignota: dire "Adele a vent'anni, con in braccio un neonato. Sul retro: 'novembre del trentanove, prima di portarlo via'." e adesso aumenta gli indizi e adesso la verita è sospetta e adesso diminuisci la calma.`,
        ],
      },
      {
        tipo: "narr",
        testo:
          "Una sola occhiata alla foto fa salire gli indizi, sposta la verità da ignota a sospetta e intacca la calma. Le conseguenze si eseguono nell'ordine in cui le scrivi.",
      },
      {
        tipo: "tranello",
        testo:
          "Esiste anche la conseguenza che sposta il giocatore: «e adesso il giocatore è in [stanza]». La Casa non ne ha bisogno (ci si muove con le direzioni), ma è utile per botole, teletrasporti, cadute. Mostrerà al giocatore la nuova stanza, come se ci fosse entrato.",
      },
      { tipo: "sistema", testo: "FINE CASSETTA 09 · PRONTO." },
      {
        tipo: "narr",
        testo:
          "Adesso le tue regole non parlano soltanto: agiscono. Aprono, spostano, contano, ricordano. C'è una conseguenza che non abbiamo ancora nominato, e chiude tutto: quella che fa finire la storia. Nella prossima cassetta, i finali.",
      },
    ],
  },

  "fine-partita": {
    id: "fine-partita",
    numero: 10,
    titolo: "Fine partita",
    fonte: "Capitolo 12 · La Casa di Via Stradivari",
    durata: "~7 min",
    sommario:
      "Come si chiude una storia: le tre parole del finale — vinci, perdi, termina — e il testo d'esito. Inventiamo insieme un quarto finale per la Casa.",
    blocchi: [
      { tipo: "sistema", testo: "FAVELLA CORSO · CASSETTA 10" },
      { tipo: "sistema", testo: '"Fine partita"' },
      {
        tipo: "narr",
        testo:
          "Una storia, prima o poi, finisce. In FAVELLA la fine è una conseguenza come le altre: la metti in coda a una regola, o a una scelta di dialogo, e la partita si chiude. Le parole sono tre, e dicono come finisce: «e adesso vinci.» (vittoria), «e adesso perdi.» (sconfitta), «e adesso termina.» (fine neutra, né vinta né persa).",
      },
      {
        tipo: "narr",
        testo:
          "La distinzione non è solo cosmetica: è il modo in cui dici che senso ha quel finale. La Casa ne ha tre, e ognuno usa una parola diversa. Chi firma l'atto e se ne va sceglie la via più comoda, e la storia la legge come una resa: perdi.",
      },
      {
        tipo: "codice",
        righe: [
          `Invece di firma l'atto di vendita: dire "Una firma sulla riga in fondo, un'altra di fianco. Il notaio asciuga le carte e se ne va prima di te. Esci anche tu, con un assegno e niente più." e adesso perdi.`,
        ],
      },
      {
        tipo: "narr",
        testo:
          "Chi brucia le lettere cancella il segreto per sempre. Non è una sconfitta, ma non è nemmeno una vittoria: è una scelta che chiude, e basta. Termina.",
      },
      {
        tipo: "codice",
        righe: [
          `Invece di brucia le lettere con la torcia se la torcia è accesa: dire "Le tieni sotto il fascio finché la carta non prende. Te ne torni con le mani sporche di cenere, e nessuno saprà mai." e adesso termina.`,
        ],
      },
      {
        tipo: "narr",
        testo:
          "Il finale buono, invece, non sta in una regola ma in fondo a un dialogo: lo raccoglie chi ha capito tutto e decide di farsi custode. Lo vedremo per intero nella cassetta sui personaggi; per ora nota soltanto la conseguenza «e adesso vinci» agganciata a una scelta di conversazione.",
      },
      { tipo: "sistema", testo: "— Il testo del finale —" },
      {
        tipo: "narr",
        testo:
          "Nei casi qui sopra il messaggio del finale è già nella clausola «dire» della regola. Quando invece vuoi che sia la parola d'esito a portare il proprio testo, lo scrivi subito dopo, fra virgolette: «e adesso vinci \"…\".» (e così per perdi e termina).",
      },
      {
        tipo: "codice",
        righe: [
          `Invece di esci dalla porta se il giocatore ha le lettere: dire "Chiudi la porta piano." e adesso vinci "Le porterai con te. Qualcuno, finalmente, le aprirà.".`,
        ],
      },
      {
        tipo: "tranello",
        testo:
          "Una volta che la partita è finita, è finita: FAVELLA smette di accettare comandi e non avanza più i turni. Assicurati che il finale scatti davvero quando deve, e che il giocatore possa raggiungerlo — un finale irraggiungibile è un vicolo cieco, non un epilogo.",
      },
      { tipo: "sistema", testo: "— Inventiamo un quarto finale —" },
      {
        tipo: "narr",
        testo:
          "Mettiamo in pratica. Diamo alla Casa un'uscita di scena tutta nuova: chi non regge l'aria di quella casa, scappa. Prima ci serve il verbo. Dichiara «scappa» come comando.",
      },
      {
        tipo: "checkpoint",
        consegna: "Dichiara «scappa» come comando.",
        attesa: `"scappa" è un comando.`,
        suggerimento: 'Tra virgolette: "scappa" è un comando.',
        esito: "OK · «scappa» è ora un verbo digitabile.",
      },
      {
        tipo: "narr",
        testo:
          "Adesso la regola che lo chiude. Scappare finisce la storia in modo neutro — termina — e porta il proprio testo d'esito fra virgolette. Usa la frase «Esci di corsa, senza voltarti.» e l'esito «Forse era meglio non sapere.».",
      },
      {
        tipo: "checkpoint",
        consegna:
          'Scrivi: «Invece di scappa: dire "Esci di corsa, senza voltarti."» e in coda «e adesso termina» col testo d\'esito «Forse era meglio non sapere.».',
        attesa: `Invece di scappa: dire "Esci di corsa, senza voltarti." e adesso termina "Forse era meglio non sapere.".`,
        suggerimento:
          'Il testo d\'esito sta dopo «termina», fra virgolette: … e adesso termina "Forse era meglio non sapere.".',
        esito: "OK · La Casa ha un quarto finale, scritto da te.",
      },
      { tipo: "sistema", testo: "FINE CASSETTA 10 · PRONTO." },
      {
        tipo: "narr",
        testo:
          "Sai aprire e sai chiudere una storia. Quello che hai in mano basta già a fare un'avventura intera. Le prossime cassette aggiungono il tempo e la vita: eventi che scattano da soli, sentinelle che vegliano, personaggi con cui parlare. Cominciamo dal tempo.",
      },
    ],
  },

  "eventi-turni": {
    id: "eventi-turni",
    numero: 11,
    titolo: "Eventi a turni",
    fonte: "Capitolo 13 · La Casa di Via Stradivari",
    durata: "~6 min",
    sommario:
      "Far muovere la storia da sola: eventi agganciati al contatore dei turni, una volta sola («Al turno N») o a ripetizione («Ogni N turni»).",
    blocchi: [
      { tipo: "sistema", testo: "FAVELLA CORSO · CASSETTA 11" },
      { tipo: "sistema", testo: '"Il tempo: gli eventi a turni"' },
      {
        tipo: "narr",
        testo:
          "Finora tutto ciò che accade nella Casa parte da un'azione del giocatore. Ma il tempo passa anche quando lui esita, e una storia viva deve poter muoversi da sola. FAVELLA conta i turni — un turno per ogni comando — e ti lascia agganciare eventi a quel conteggio.",
      },
      {
        tipo: "narr",
        testo:
          "La prima forma scatta una volta sola, quando il contatore dei turni raggiunge N: «Al turno [N]: dire \"…\" e adesso [conseguenza].». Nella Casa è così che arriva il temporale — prima un tuono lontano, poi la pioggia vera:",
      },
      {
        tipo: "codice",
        righe: [
          `Al turno 4: dire "Sui colli si sente un tuono basso. Vento alle imposte." e adesso il temporale è vicino.`,
          `Al turno 8: dire "Comincia a piovere forte. La grondaia ha un buco da anni, si sente." e adesso il temporale è scoppiato.`,
        ],
      },
      {
        tipo: "narr",
        testo:
          "Le conseguenze funzionano come in una regola: ogni evento sposta lo stato «temporale» di un gradino, e quei cambiamenti, a loro volta, accendono le descrizioni alternative delle stanze che hai scritto qualche cassetta fa. Tutto si tiene.",
      },
      {
        tipo: "narr",
        testo:
          "Scrivi tu il primo scroscio. Al turno 4 si sente il tuono e il temporale si fa vicino. Testo: «Sui colli si sente un tuono basso. Vento alle imposte.», e in coda «e adesso il temporale è vicino».",
      },
      {
        tipo: "checkpoint",
        consegna:
          'Scrivi l\'evento del turno 4: testo «Sui colli si sente un tuono basso. Vento alle imposte.» e poi «e adesso il temporale è vicino».',
        attesa: `Al turno 4: dire "Sui colli si sente un tuono basso. Vento alle imposte." e adesso il temporale è vicino.`,
        suggerimento:
          'Comincia con «Al turno 4:» e chiudi con la conseguenza fuori dalle virgolette: … e adesso il temporale è vicino.',
        esito: "OK · Al quarto turno arriverà il primo tuono.",
      },
      { tipo: "sistema", testo: "— Un evento che si ripete —" },
      {
        tipo: "narr",
        testo:
          "La seconda forma scatta ogni N turni, all'infinito: «Ogni [N] turni: …». Serve per il battito di fondo, le cose che tornano. Nella Casa è l'orologio fermo che, ogni tanto, ricorda di esserlo:",
      },
      {
        tipo: "codice",
        righe: [
          `Ogni 5 turni: dire "L'orologio batte ma il pendolo no: si è fermato alle quattro e ventidue.".`,
        ],
      },
      {
        tipo: "narr",
        testo:
          "Anche senza conseguenze, come qui, un evento ripetuto fa atmosfera: tiene presente che il tempo scorre e che la casa, intorno a te, non è immobile. Scrivilo tu.",
      },
      {
        tipo: "checkpoint",
        consegna:
          'Scrivi un evento che ogni 5 turni dice: «L\'orologio batte ma il pendolo no: si è fermato alle quattro e ventidue.»',
        attesa: `Ogni 5 turni: dire "L'orologio batte ma il pendolo no: si è fermato alle quattro e ventidue.".`,
        suggerimento:
          'La forma è «Ogni 5 turni: dire "…".» — senza conseguenza, qui basta la frase.',
        esito: "OK · Ogni cinque turni l'orologio ricorderà di essersi fermato.",
      },
      {
        tipo: "tranello",
        testo:
          "«Al turno N» e «Ogni N turni» si somigliano ma sono opposti: il primo accade una volta, il secondo a ripetizione. Attento a non scrivere «Ogni 8 turni» quando intendevi «Al turno 8», o un evento che doveva essere unico tornerà a ogni giro.",
      },
      { tipo: "sistema", testo: "FINE CASSETTA 11 · PRONTO." },
      {
        tipo: "narr",
        testo:
          "La tua storia ora ha un orologio interno: cose che succedono al passare dei turni, da sole. Ma il tempo è solo un modo di far scattare gli eventi. Ce n'è un altro, più sottile: far reagire la storia quando una condizione diventa vera, chiunque l'abbia resa tale. Nella prossima cassetta, i demoni.",
      },
    ],
  },

  demoni: {
    id: "demoni",
    numero: 12,
    titolo: "I demoni",
    fonte: "Capitolo 14 · La Casa di Via Stradivari",
    durata: "~7 min",
    sommario:
      "Sentinelle che a ogni turno controllano una condizione e agiscono da sole: il demone «a livello» (a ripetizione) e quello «sul fronte di salita» (una volta sola).",
    blocchi: [
      { tipo: "sistema", testo: "FAVELLA CORSO · CASSETTA 12" },
      { tipo: "sistema", testo: '"I demoni"' },
      {
        tipo: "narr",
        testo:
          "Gli eventi a turni reagiscono al tempo. Le regole reagiscono alle azioni. Ma a volte vuoi che qualcosa scatti quando una condizione diventa vera, chiunque l'abbia resa tale e in qualunque turno. È il compito dei demoni: sentinelle che, a ogni turno, controllano una condizione e agiscono da sole.",
      },
      {
        tipo: "narr",
        testo:
          "Vale la pena fermarsi un attimo, perché ora hai in mano tutti i modi di collegare una condizione a una reazione. Innescato da un'azione: «Invece di [azione] se [condizione]». Globale: lo stesso, senza oggetto. A tempo: «Al turno N» / «Ogni N turni». E il pezzo che mancava — autonomo: il «quando» è la sola condizione, senza verbo né turno fisso. Quello è il demone.",
      },
      { tipo: "sistema", testo: "— Il demone a livello —" },
      {
        tipo: "narr",
        testo:
          "La prima forma — «Ogni turno se [condizione]: …» — scatta a ogni turno in cui la condizione è vera, e torna a scattare finché resta vera. È fatta per gli effetti continui: il veleno che consuma, la fame che cresce, o — nella Casa — la pioggia che, una goccia dopo l'altra, logora la calma di chi resta.",
      },
      {
        tipo: "codice",
        righe: [
          `Ogni turno se il temporale è scoppiato: dire "Dal soffitto cade una goccia, poi un'altra. La casa, intorno a te, sembra disfarsi piano." e adesso diminuisci la calma.`,
        ],
      },
      {
        tipo: "narr",
        testo:
          "Da quando scoppia il temporale, ogni turno passato in casa toglie un punto di calma. Non c'è un'azione che lo provochi: succede perché le condizioni ci sono. Scrivilo tu.",
      },
      {
        tipo: "checkpoint",
        consegna:
          'Scrivi un demone a livello: «Ogni turno se il temporale è scoppiato», testo «Dal soffitto cade una goccia, poi un\'altra.», e «e adesso diminuisci la calma».',
        attesa: `Ogni turno se il temporale è scoppiato: dire "Dal soffitto cade una goccia, poi un'altra." e adesso diminuisci la calma.`,
        suggerimento:
          'Comincia con «Ogni turno se …»: Ogni turno se il temporale è scoppiato: dire "Dal soffitto cade una goccia, poi un\'altra." e adesso diminuisci la calma.',
        esito: "OK · Finché piove, ogni turno costerà un po' di calma.",
      },
      { tipo: "sistema", testo: "— Il demone sul fronte di salita —" },
      {
        tipo: "narr",
        testo:
          "La seconda forma — «Quando [condizione] diventa vera: …» — scatta una volta sola, nell'istante in cui la condizione passa da falsa a vera. È fatta per le soglie e le scoperte: il momento in cui un conto raggiunge un limite, e tu vuoi segnarlo una volta e non più.",
      },
      {
        tipo: "codice",
        righe: [
          `Quando gli indizi è almeno 4 diventa vera: dire "(Per un attimo i pezzi stanno insieme da soli: le lettere chiuse, le mensilità mai cessate, la valigia mai partita. Manca solo un nome.)".`,
        ],
      },
      {
        tipo: "narr",
        testo:
          "Questo demone fa il punto degli indizi appena ne hai raccolti abbastanza, poi tace per sempre, anche se la condizione resta vera nei turni seguenti. Prova tu una soglia diversa, più breve: quando la calma crolla sotto 1, segnalalo una volta. Testo: «Le mani ti tremano.».",
      },
      {
        tipo: "checkpoint",
        consegna:
          'Scrivi un demone sul fronte di salita: «Quando la calma è meno di 1 diventa vera», col testo «Le mani ti tremano.»',
        attesa: `Quando la calma è meno di 1 diventa vera: dire "Le mani ti tremano.".`,
        suggerimento:
          'La forma è «Quando [condizione] diventa vera: dire "…".»: Quando la calma è meno di 1 diventa vera: dire "Le mani ti tremano.".',
        esito: "OK · Scatterà una volta sola, nel momento esatto del crollo.",
      },
      {
        tipo: "tranello",
        testo:
          "Un demone sul fronte di salita non spara all'avvio se la condizione è già vera da subito: FAVELLA fotografa lo stato iniziale e considera quello il punto di partenza, così non rischi un falso scatto al primo turno. I demoni, inoltre, si valutano a fine turno, dopo gli eventi a tempo, una volta ciascuno. «diventa vera» si può anche sottintendere, ma scriverlo rende chiaro che il demone scatta sul passaggio.",
      },
      { tipo: "sistema", testo: "FINE CASSETTA 12 · PRONTO." },
      {
        tipo: "narr",
        testo:
          "Ora la tua casa è viva anche quando il giocatore sta fermo: piove, la calma cala, le soglie suonano da sole. C'è però un'altra cosa che la rende viva, e finora la Casa l'ha solo finta con descrizioni diverse a torcia accesa o spenta: il buio. Nella prossima cassetta accendi e spegni la luce sul serio.",
      },
    ],
  },

  "buio-luce": {
    id: "buio-luce",
    numero: 13,
    titolo: "Buio e luce",
    fonte: "Capitolo 15 · oltre «La Casa»",
    durata: "~5 min",
    sommario:
      "Spegnere la luce sul serio: «La cantina è buia.» e «La torcia illumina.». Il pattern più antico dell'avventura testuale, con una riga sola — e come la Casa lo faceva a mano.",
    blocchi: [
      { tipo: "sistema", testo: "FAVELLA CORSO · CASSETTA 13" },
      { tipo: "sistema", testo: '"Buio e luce"' },
      {
        tipo: "narr",
        testo:
          "C'è una cantina, c'è una torcia: l'avventura testuale gira intorno al buio da sempre. La Casa di Via Stradivari lo mette in scena, ma con un trucco — descrizioni diverse a seconda che la torcia sia accesa o spenta, scritte una per una. Funziona, e l'hai già visto. Ma FAVELLA sa fare il buio da sé, e basta una parola.",
      },
      {
        tipo: "narr",
        testo:
          "Per dichiarare una stanza al buio scrivi «[stanza] è buia.». È una proprietà speciale del luogo: appena entri in una stanza buia, la sua descrizione sparisce, e al suo posto leggi che non vedi nulla. Non puoi esaminare gli oggetti, né prenderli, né posarli. Una cosa resta possibile, però: muoverti. Le uscite si percorrono lo stesso — al buio si va a tentoni.",
      },
      {
        tipo: "codice",
        righe: ["La cantina è una stanza.", "La cantina è buia."],
      },
      {
        tipo: "narr",
        testo:
          "Il buio, da solo, è un vicolo cieco: serve un rimedio. Lo dài al giocatore con una sorgente di luce, e si scrive «[oggetto] illumina.». Quando una sorgente accesa è a portata — in mano, o comunque raggiungibile nella stanza — il buio si dirada e la stanza torna a mostrarsi normalmente.",
      },
      {
        tipo: "codice",
        righe: ["La torcia è una cosa.", "La torcia illumina."],
      },
      {
        tipo: "narr",
        testo:
          "Tocca a te. Prima rendi buia la cantina: dichiarala stanza, poi dille che è buia.",
      },
      {
        tipo: "checkpoint",
        consegna: "Rendi buia la cantina.",
        attesa: "La cantina è buia.",
        suggerimento: "«La cantina è buia.» — «è buia», come una qualsiasi proprietà della stanza.",
        esito: "OK · Adesso, senza luce, in cantina non si vede niente.",
      },
      {
        tipo: "narr",
        testo: "Ora la via d'uscita dal buio: fai in modo che la torcia illumini.",
      },
      {
        tipo: "checkpoint",
        consegna: "Fai sì che la torcia illumini.",
        attesa: "La torcia illumina.",
        suggerimento: "«La torcia illumina.» — il verbo «illumina» da solo, e il punto in fondo.",
        esito: "OK · Con la torcia a portata, la cantina si rischiara.",
      },
      {
        tipo: "tranello",
        testo:
          "Una sorgente fa luce solo se è «accesa»: se la torcia «illumina» ma è «spenta», resti al buio finché non l'accendi. E una sorgente chiusa in un contenitore non illumina niente. Il vecchio metodo della Casa — descrizioni condizionali «se la torcia è spenta» — resta valido e a volte è quello che vuoi, perché ti lascia scegliere parola per parola cosa si intravede nel buio. La primitiva «è buia» è la scorciatoia onesta per il caso più comune.",
      },
      { tipo: "sistema", testo: "FINE CASSETTA 13 · PRONTO." },
      {
        tipo: "narr",
        testo:
          "La tua casa adesso ha le sue ombre, e una luce per scacciarle. Le manca ancora una voce: nella prossima cassetta entrano i personaggi, e con loro i dialoghi.",
      },
    ],
  },

  dialoghi: {
    id: "dialoghi",
    numero: 14,
    titolo: "Personaggi e dialoghi",
    fonte: "Capitolo 16 · La Casa di Via Stradivari",
    durata: "~9 min",
    sommario:
      "Dare una voce alla storia: creare un personaggio, costruire un dialogo a nodi, ramificare con le opzioni e legare scelte a condizioni e conseguenze — fino al finale che si guadagna parlando.",
    blocchi: [
      { tipo: "sistema", testo: "FAVELLA CORSO · CASSETTA 14" },
      { tipo: "sistema", testo: '"Personaggi e dialoghi"' },
      {
        tipo: "narr",
        testo:
          "Una casa vuota la esplori; una casa con qualcuno dentro la interroghi. I personaggi portano nella storia l'unica cosa che gli oggetti non hanno: una voce, e la possibilità di mentire, sviare, rivelare. Nella Casa ce ne sono due — il notaio che vuole solo la firma, e la vicina che ti misura prima di parlare — e il finale buono passa per loro.",
      },
      {
        tipo: "narr",
        testo:
          "Creare un personaggio è come creare un oggetto: una frase. Per il resto ha una posizione e una descrizione, come tutti. Dichiara il notaio.",
      },
      {
        tipo: "checkpoint",
        consegna: "Dichiara il notaio come personaggio.",
        attesa: "Il notaio è un personaggio.",
        suggerimento: "«Il notaio è un personaggio.» — un personaggio, al singolare.",
        esito: "OK · Il notaio è in scena. Ora gli serve una voce.",
      },
      {
        tipo: "narr",
        testo:
          "Il giocatore avvia la conversazione con «parla con [personaggio]». Da quel momento entra in una modalità a parte, fatta di battute e scelte, e ne esce con «esci» (oppure «addio», «basta»). Parlare non consuma un turno: il tempo della storia si ferma mentre conversi.",
      },
      { tipo: "sistema", testo: "— Il dialogo e il nodo d'avvio —" },
      {
        tipo: "narr",
        testo:
          "Un dialogo è una rete di nodi: ogni nodo è una battuta del personaggio con le risposte che il giocatore può dare. Per prima cosa dichiari da quale nodo si parte. I nomi dei nodi («tavolo», «salute»…) sono vocabolario nuovo, quindi stanno tra virgolette, e non li vedrà mai il giocatore: servono solo a te.",
      },
      {
        tipo: "narr",
        testo:
          "Il dialogo del notaio comincia dal nodo «tavolo». Diglielo.",
      },
      {
        tipo: "checkpoint",
        consegna: 'Fai cominciare il dialogo del notaio dal nodo «tavolo».',
        attesa: `Il dialogo del notaio comincia con "tavolo".`,
        suggerimento: 'La forma è: Il dialogo del notaio comincia con "tavolo". — il nodo fra virgolette.',
        esito: "OK · La conversazione partirà dal nodo «tavolo».",
      },
      { tipo: "sistema", testo: "— Le battute e le opzioni —" },
      {
        tipo: "narr",
        testo:
          "A ogni nodo dài una battuta — «[personaggio] al nodo \"[nodo]\" dice \"…\".» — e sotto ci metti le risposte possibili. Ogni opzione mostra un testo e dice dove porta: a un altro nodo, o fuori dal dialogo.",
      },
      {
        tipo: "codice",
        righe: [
          `Il notaio al nodo "tavolo" dice "Lei è il nipote. Bene. Le carte sono sul tavolo. Una firma e ho un altro appuntamento.".`,
          `Al nodo "tavolo" l'opzione "Di cosa è morta?" conduce al nodo "salute".`,
          `Al nodo "tavolo" l'opzione "Più tardi." chiude il dialogo.`,
        ],
      },
      {
        tipo: "narr",
        testo:
          "«conduce al nodo» porta alla battuta successiva; «chiude il dialogo» riporta nella stanza. I nodi possono rimandarsi a vicenda, anche in cerchio. Scrivi tu la prima opzione del nodo «tavolo»: «Di cosa è morta?» porta al nodo «salute».",
      },
      {
        tipo: "checkpoint",
        consegna:
          'Al nodo «tavolo», scrivi l\'opzione «Di cosa è morta?» che conduce al nodo «salute».',
        attesa: `Al nodo "tavolo" l'opzione "Di cosa è morta?" conduce al nodo "salute".`,
        suggerimento:
          'Sia il testo dell\'opzione sia i nodi vanno fra virgolette: Al nodo "tavolo" l\'opzione "Di cosa è morta?" conduce al nodo "salute".',
        esito: "OK · Una prima ramificazione del dialogo.",
      },
      { tipo: "sistema", testo: "— Opzioni che chiedono e che fanno —" },
      {
        tipo: "narr",
        testo:
          "Un'opzione può comparire solo a certe condizioni e può avere conseguenze, esattamente come una regola. Un'opzione la cui condizione è falsa non viene nemmeno mostrata: il giocatore vede solo le risposte che può davvero dare. E una scelta può anche chiudere la partita: firmare subito, qui, è la sconfitta.",
      },
      {
        tipo: "narr",
        testo:
          "Scrivi l'opzione fatale: «Firmo subito.» chiude il dialogo e fa perdere la partita.",
      },
      {
        tipo: "checkpoint",
        consegna:
          'Al nodo «tavolo», scrivi l\'opzione «Firmo subito.» che chiude il dialogo e fa perdere.',
        attesa: `Al nodo "tavolo" l'opzione "Firmo subito." chiude il dialogo e adesso perdi.`,
        suggerimento:
          'Dopo «chiude il dialogo» metti la conseguenza: … chiude il dialogo e adesso perdi.',
        esito: "OK · Firmare subito, adesso, è una resa: fine della partita.",
      },
      { tipo: "sistema", testo: "— Il finale che si guadagna parlando —" },
      {
        tipo: "narr",
        testo:
          "Mettendo insieme condizioni e conseguenze, una scelta di dialogo diventa la chiave del finale buono. Con la vicina, l'opzione che vince esiste soltanto se hai le lettere e hai scoperto la verità: due cose che si ottengono esplorando tutta la casa e parlando con entrambi.",
      },
      {
        tipo: "codice",
        righe: [
          `La vicina al nodo "soglia" dice "Lei chi è? ...Ah. Il nipote. Adele parlava di voi. Poco.".`,
          `Al nodo "soglia" l'opzione "Continuerò io." se il giocatore ha le lettere e la verita non è ignota chiude il dialogo e adesso vinci.`,
        ],
      },
      {
        tipo: "tranello",
        testo:
          'Etichette dei nodi e testi delle opzioni vanno sempre tra virgolette. E se scrivi «conduce al nodo "valigia"» ma non hai mai definito una battuta «al nodo "valigia"», il giocatore arriverà in un nodo muto: controlla che ogni nodo a cui rimandi esista davvero.',
      },
      { tipo: "sistema", testo: "FINE CASSETTA 14 · PRONTO." },
      {
        tipo: "narr",
        testo:
          "Adesso la tua casa parla, e dietro le sue parole si nasconde un finale. Con questo hai in mano tutto il cuore del linguaggio. Restano alcune rifiniture: la capacità di trasporto, i moduli per ordinare un progetto grande, i comandi che il giocatore ha sempre a disposizione, e il riepilogo di tutto.",
      },
    ],
  },

  trasporto: {
    id: "trasporto",
    numero: 15,
    titolo: "La capacità di trasporto",
    fonte: "Capitolo 17 · La Casa di Via Stradivari",
    durata: "~5 min",
    sommario:
      "Mettere un tetto a ciò che il giocatore porta con sé — e oggetti come lo zaino che fanno spazio. Un costrutto del tutto facoltativo: la Casa lascia l'inventario illimitato.",
    blocchi: [
      { tipo: "sistema", testo: "FAVELLA CORSO · CASSETTA 15" },
      { tipo: "sistema", testo: '"La capacità di trasporto"' },
      {
        tipo: "narr",
        testo:
          "Di norma il giocatore può raccogliere quanti oggetti vuole: l'inventario non ha fondo. Per molte storie va benissimo, ed è la scelta che la Casa stessa adotta. Ma se vuoi che «cosa porti con te» diventi una decisione — lasciare una cosa per prenderne un'altra — puoi mettere un tetto.",
      },
      {
        tipo: "narr",
        testo:
          "La forma è una sola riga: «Il giocatore può portare [N] oggetti.». Da quel momento l'inventario tiene al massimo N oggetti; quando è pieno, prendere qualcosa di nuovo non riesce, e il gioco lo dice. Il comando «inventario» mostra quanti slot stai usando sul totale.",
      },
      {
        tipo: "narr",
        testo:
          "La Casa non lo usa, ma proviamo la forma. Dài al giocatore un limite di 5 oggetti.",
      },
      {
        tipo: "checkpoint",
        consegna: "Metti un limite: il giocatore può portare 5 oggetti.",
        attesa: "Il giocatore può portare 5 oggetti.",
        suggerimento: "«Il giocatore può portare 5 oggetti.» — «può portare», poi il numero, poi «oggetti».",
        esito: "OK · L'inventario adesso tiene al massimo 5 oggetti.",
      },
      { tipo: "sistema", testo: "— Oggetti che fanno spazio —" },
      {
        tipo: "narr",
        testo:
          "Un limite secco sarebbe rigido. Per questo un oggetto può aggiungere capacità mentre lo porti con te: lo zaino, la borsa, la sacca. Si scrive «[oggetto] dà [N] spazi.». Finché lo zaino è nell'inventario i suoi spazi si sommano al limite di base; se lo posi, te li riprendi.",
      },
      {
        tipo: "narr",
        testo: "Dài tu a uno zaino quindici spazi in più.",
      },
      {
        tipo: "checkpoint",
        consegna: "Fai sì che lo zaino dia 15 spazi.",
        attesa: "Lo zaino dà 15 spazi.",
        suggerimento: "«Lo zaino dà 15 spazi.» — il verbo è «dà», con l'accento.",
        esito: "OK · Con lo zaino addosso, il limite sale di 15.",
      },
      {
        tipo: "tranello",
        testo:
          "La capacità è del tutto facoltativa e additiva: se non scrivi mai «Il giocatore può portare …», l'inventario resta illimitato, come è sempre stato. La Casa fa proprio così: preferisce non distrarre con la contabilità delle tasche e lascia il giocatore concentrato sulla storia. Mettere un limite è una scelta di design, non un obbligo.",
      },
      { tipo: "sistema", testo: "FINE CASSETTA 15 · PRONTO." },
      {
        tipo: "narr",
        testo:
          "Una rifinitura in tasca. La prossima riguarda l'ordine: quando una storia cresce — e la Casa ha sette stanze, cinquanta oggetti, due personaggi — tenerla in un file solo diventa scomodo. Nella prossima cassetta impari a spezzarla e ricucirla.",
      },
    ],
  },

  moduli: {
    id: "moduli",
    numero: 16,
    titolo: "Moduli",
    fonte: "Capitolo 18 · La Casa di Via Stradivari",
    durata: "~5 min",
    sommario:
      "Spezzare un progetto grande in più file e ricucirli con una riga: «Includi». Come la Casa, divisa in storia, oggetti e dialoghi.",
    blocchi: [
      { tipo: "sistema", testo: "FAVELLA CORSO · CASSETTA 16" },
      { tipo: "sistema", testo: '"Organizzare un progetto: i moduli"' },
      {
        tipo: "narr",
        testo:
          "Una storia piccola sta in un file solo. Ma «La Casa di Via Stradivari» ha sette stanze, una cinquantina di oggetti, due personaggi con i loro dialoghi: tutto in un unico file diventerebbe un muro difficile da leggere. Per questo FAVELLA permette di spezzare un progetto in più file e ricucirli con una riga.",
      },
      {
        tipo: "narr",
        testo:
          "La riga è «Includi \"[nome del file]\".», col percorso fra virgolette. Prima ancora di interpretare il linguaggio, FAVELLA sostituisce ogni «Includi» con il contenuto del file indicato, come se l'avessi incollato lì a mano. Da quel momento è tutto un sorgente solo.",
      },
      {
        tipo: "narr",
        testo:
          "La Casa è divisa in tre file: storia.fav tiene stanze, stati, eventi e regole; oggetti.fav raccoglie oggetti, proprietà, alias e verbi; dialoghi.fav i due personaggi. In testa a storia.fav, dopo le stanze, ci sono queste due righe:",
      },
      {
        tipo: "codice",
        righe: [`Includi "oggetti.fav".`, `Includi "dialoghi.fav".`],
      },
      {
        tipo: "narr",
        testo:
          "Scrivi tu la prima inclusione: porta dentro «oggetti.fav».",
      },
      {
        tipo: "checkpoint",
        consegna: 'Includi il file «oggetti.fav».',
        attesa: `Includi "oggetti.fav".`,
        suggerimento: 'La forma è: Includi "oggetti.fav". — il nome del file fra virgolette, e il punto in fondo.',
        esito: "OK · Tutto il contenuto di oggetti.fav è ora parte del sorgente.",
      },
      {
        tipo: "narr",
        testo: "E adesso l'altra: i dialoghi. Includi «dialoghi.fav».",
      },
      {
        tipo: "checkpoint",
        consegna: 'Includi il file «dialoghi.fav».',
        attesa: `Includi "dialoghi.fav".`,
        suggerimento: 'Come prima: Includi "dialoghi.fav".',
        esito: "OK · Anche i due personaggi sono entrati nel progetto.",
      },
      {
        tipo: "tranello",
        testo:
          "I percorsi sono relativi al file che scrive «Includi». Lo stesso file viene incluso una volta sola: se due file includono lo stesso terzo, FAVELLA non lo espande due volte. Le inclusioni a catena sono ammesse — un file incluso può a sua volta includerne altri — purché non si formino cicli.",
      },
      {
        tipo: "narr",
        testo:
          "L'ordine, qui, conta per la leggibilità, non per il funzionamento: grazie alla robustezza d'ordine, un oggetto in oggetti.fav può riferirsi a una stanza dichiarata in storia.fav anche se il file è incluso dopo. La Casa mette «Includi» dopo le stanze per tenere le cose in ordine logico, non per necessità del compilatore.",
      },
      { tipo: "sistema", testo: "FINE CASSETTA 16 · PRONTO." },
      {
        tipo: "narr",
        testo:
          "Sai tenere in ordine anche un progetto grande. E con questo hai imparato tutto ciò che si scrive in una storia: non manca un costrutto. Restano due cassette. La prossima cambia prospettiva — passa dalla parte di chi gioca, coi comandi che ha sempre a portata di mano — e poi il riepilogo, da tenere accanto mentre scrivi.",
      },
    ],
  },

  "comandi-giocatore": {
    id: "comandi-giocatore",
    numero: 17,
    titolo: "Comandi del giocatore",
    fonte: "Capitolo 19 · dalla parte di chi gioca",
    durata: "~5 min",
    sommario:
      "Una cassetta diversa: niente codice da scrivere. I comandi che FAVELLA regala a ogni storia — pronomi, ANNULLA, ANCORA, trascrizione — e che il tuo giocatore avrà sempre.",
    blocchi: [
      { tipo: "sistema", testo: "FAVELLA CORSO · CASSETTA 17" },
      { tipo: "sistema", testo: '"Comandi del giocatore"' },
      {
        tipo: "narr",
        testo:
          "Finora hai scritto il mondo. Questa cassetta guarda dall'altra parte del vetro: a chi quel mondo lo gioca. Perché FAVELLA mette in mano al giocatore una manciata di comandi che tu non devi programmare. Ci sono già, in ogni storia, e vale la pena conoscerli — anche per scriverne di migliori.",
      },
      {
        tipo: "narr",
        testo:
          "I comandi di base li hai incontrati giocando: «guarda» per rivedere la stanza, «esamina [cosa]» per i dettagli, «prendi» e «lascia», «inventario» (o «zaino») per quello che porti, le direzioni per muoverti («nord», «n», «vai nord»), «parla con [chi]» per i dialoghi, «esci» per chiudere. Sono il vocabolario minimo che ogni avventura testuale dà per scontato.",
      },
      { tipo: "sistema", testo: "— Pronomi: la casa che ti capisce —" },
      {
        tipo: "narr",
        testo:
          "La differenza che fa sembrare il parser «sveglio» sono i pronomi. Dopo «esamina la torcia» puoi dire semplicemente «prendila»: FAVELLA ricorda l'ultimo oggetto nominato e lo riconosce dal pronome, con genere e numero giusti. «Aprilo», «esaminale», «usali» — e anche la forma tonica, «prendi quella». Se il pronome non concorda con nulla di recente, o l'oggetto non è più a portata, te lo dice invece di indovinare.",
      },
      { tipo: "sistema", testo: "— Tornare indietro —" },
      {
        tipo: "narr",
        testo:
          "Tre comodità da veri smanettoni. «ANNULLA» (o «disfa») disfa l'ultimo turno e riporta il mondo esattamente com'era: una macchina del tempo a un passo. «ANCORA» (o «ripeti», o «g») ripete l'ultimo comando, utile quando aspetti che qualcosa succeda. «TRASCRIZIONE» comincia a salvare la partita su un file di testo, per rileggersela poi — questa vale quando giochi da riga di comando.",
      },
      {
        tipo: "tranello",
        testo:
          "Questi comandi non si dichiarano: sono regalati a ogni storia, gratis, e non puoi sbagliarli perché non li scrivi tu. «ANNULLA» riavvolge tutto, perfino il caso — se una descrizione ha varianti casuali, tornando indietro ritrovi quella di prima, non una nuova. E i pronomi non barano: se la cosa a cui pensi è uscita di scena, leggi «Non la vedi più» invece di un riferimento sbagliato.",
      },
      {
        tipo: "narr",
        testo:
          "Avrai notato: in questa cassetta non c'è un solo checkpoint da scrivere. È voluto. Questi comandi vivono nel gioco, non nel codice, e il posto giusto per provarli sono le due cassette-gioco: apri «La Casa», esamina qualcosa e prova a dire «prendila», poi «annulla».",
      },
      { tipo: "sistema", testo: "FINE CASSETTA 17 · PRONTO." },
      {
        tipo: "narr",
        testo:
          "Adesso conosci la storia da chi la scrive e da chi la gioca. Restano tre cassette per chi vuole spingersi oltre «La Casa»: i Temi, le aggiunte più recenti del linguaggio. Aprono la porta al caso, ai numeri che si parlano, al mondo che cambia da sé. Poi, l'ultima cassetta: il riepilogo.",
      },
    ],
  },

  quantita: {
    id: "quantita",
    numero: 18,
    titolo: "Le quantità che si parlano",
    fonte: "I Temi · Il caso e le quantità",
    durata: "~6 min",
    sommario:
      "I contatori smettono di essere celle isolate: una quantità può valere quanto un'altra statistica («di [forza]»), o uscire a sorte come un dado («un numero fra 2 e 6»), e una soglia può confrontarsi con un altro contatore.",
    blocchi: [
      { tipo: "sistema", testo: "FAVELLA CORSO · CASSETTA 18" },
      { tipo: "sistema", testo: '"Le quantità che si parlano"' },
      {
        tipo: "narr",
        testo:
          "Finora i contatori li hai cambiati di passi fissi: «aumenta il punteggio di 5», «diminuisci la calma». Numeri scritti a mano. Va benissimo per molte storie, ma se provi a scrivere un combattimento — o un gioco di ruolo — ti accorgi presto di un limite: il danno è sempre lo stesso, e i contatori non si guardano fra loro. I Temi sciolgono proprio questo nodo.",
      },
      { tipo: "sistema", testo: "— Una quantità che vale quanto una statistica —" },
      {
        tipo: "narr",
        testo:
          "Dove prima scrivevi un numero, ora puoi mettere il valore di un contatore fra parentesi quadre: «di [forza]». Sono le stesse parentesi dell'interpolazione nei testi, e significano la stessa cosa — «il valore di questo contatore». Così il danno scala da sé: sali di livello, la forza cresce, e colpisci più forte, senza riscrivere una riga.",
      },
      {
        tipo: "codice",
        righe: [
          'Invece di attacca il troll: dire "Lo colpisci!" e adesso diminuisci la vita del troll di [forza].',
        ],
      },
      {
        tipo: "narr",
        testo:
          "Tocca a te. Nella cripta c'è un troll con la sua vita, e il giocatore ha una «forza». Scrivi la regola che, quando attacca il troll, gli toglie tanti punti vita quant'è la forza.",
      },
      {
        tipo: "checkpoint",
        consegna: "Quando il giocatore «attacca il troll», togli alla vita del troll un danno pari alla [forza].",
        attesa: 'Invece di attacca il troll: dire "Lo colpisci!" e adesso diminuisci la vita del troll di [forza].',
        suggerimento:
          "La quantità in fondo è «[forza]», con le parentesi quadre: «… diminuisci la vita del troll di [forza].».",
        esito: "OK · Adesso il colpo vale quanto la tua forza, non un numero fisso.",
      },
      { tipo: "sistema", testo: "— I dadi: un numero a caso —" },
      {
        tipo: "narr",
        testo:
          "Una quantità può anche essere estratta a sorte, come un tiro di dado: «di un numero fra 2 e 6». A ogni colpo esce un valore diverso nell'intervallo. L'estrazione è riproducibile e ANNULLA la riavvolge: se disfi il turno, il «dado» torna com'era, non ne tira uno nuovo.",
      },
      {
        tipo: "narr",
        testo:
          "Prova con un incantesimo dal danno variabile: quando il giocatore «incanta il drago», togligli un numero a caso fra 2 e 6 di vita.",
      },
      {
        tipo: "checkpoint",
        consegna: "Quando il giocatore «incanta il drago», sottrai alla vita del drago un numero casuale fra 2 e 6.",
        attesa: 'Invece di incanta il drago: dire "Magia!" e adesso diminuisci la vita del drago di un numero fra 2 e 6.',
        suggerimento:
          "La forma del dado è «un numero fra 2 e 6», al posto della quantità: «… diminuisci la vita del drago di un numero fra 2 e 6.».",
        esito: "OK · Magia imprevedibile: ogni lancio è un tiro diverso.",
      },
      { tipo: "sistema", testo: "— Due contatori che si confrontano —" },
      {
        tipo: "narr",
        testo:
          "E i contatori ora si guardano davvero. In un confronto, dove mettevi un numero, puoi mettere un altro contatore fra parentesi quadre: «se l'oro è almeno [prezzo]». La soglia diventa dinamica — cambia se cambia il prezzo — e puoi modellare cose come «te lo puoi permettere» senza fissare un numero.",
      },
      {
        tipo: "narr",
        testo:
          "Scrivi un demone che, a ogni turno, se il tuo oro è almeno quanto il prezzo, ti dice che puoi permettertelo.",
      },
      {
        tipo: "checkpoint",
        consegna: "Ogni turno, se «l'oro» è almeno «[prezzo]», fai dire «Te lo puoi permettere.».",
        attesa: `Ogni turno se l'oro è almeno [prezzo]: dire "Te lo puoi permettere.".`,
        suggerimento:
          "Il termine di confronto è un contatore fra parentesi: «… se l'oro è almeno [prezzo]: …».",
        esito: "OK · La soglia ora vive: confronta due contatori, non un contatore e un numero.",
      },
      {
        tipo: "tranello",
        testo:
          "Le parentesi quadre fanno sempre la stessa cosa — «il valore di quel contatore» — sia in un testo, sia in una quantità, sia in un confronto. Senza parentesi, «forza» o «prezzo» verrebbero letti come parole, non come numeri. E ricorda: tutto questo vale per i contatori (i numeri); gli stati, che sono parole, hanno i loro modi, e li vedrai fra due cassette.",
      },
      { tipo: "sistema", testo: "FINE CASSETTA 18 · PRONTO." },
      {
        tipo: "narr",
        testo:
          "I numeri adesso si parlano. Manca l'altra metà del caso: non quanto, ma SE. Nella prossima cassetta entra la probabilità — le cose che càpitano ogni tanto.",
      },
    ],
  },

  "il-caso": {
    id: "il-caso",
    numero: 19,
    titolo: "Il caso",
    fonte: "I Temi · Il caso e le quantità",
    durata: "~5 min",
    sommario:
      "La casualità che non è un numero: uno stato che pesca un valore da un elenco («diventa uno fra…») e un evento che càpita solo ogni tanto, con una probabilità («se càpita (1 su 4)»).",
    blocchi: [
      { tipo: "sistema", testo: "FAVELLA CORSO · CASSETTA 19" },
      { tipo: "sistema", testo: '"Il caso"' },
      {
        tipo: "narr",
        testo:
          "Il dado della cassetta scorsa estraeva un numero. Ma il caso, in una storia, non è solo questione di quanto: a volte vuoi che cambi il tempo, che un incontro càpiti o no, che una cosa succeda una volta su tre. È la casualità simbolica — quella fatta di parole e di eventi — ed è il cuore di ciò che rende un simulatore davvero rigiocabile.",
      },
      { tipo: "sistema", testo: "— Uno stato che pesca da un elenco —" },
      {
        tipo: "narr",
        testo:
          "Uno stato, oltre a prendere un valore fisso, può pescarlo a sorte da un elenco: «diventa uno fra sereno, pioggia, nebbia». A ogni scatto ne esce uno, scelto a caso. È la gemella dell'estrazione numerica «un numero fra…», ma per i valori-parola degli stati.",
      },
      {
        tipo: "codice",
        righe: ["Il meteo è uno stato.", "Il meteo è sereno.", "Ogni 3 turni: il meteo diventa uno fra sereno, pioggia, nebbia."],
      },
      {
        tipo: "narr",
        testo:
          "Hai già un «meteo» che parte sereno. Scrivi l'evento che, ogni 3 turni, lo fa diventare uno fra sereno, pioggia, nebbia.",
      },
      {
        tipo: "checkpoint",
        consegna: "Ogni 3 turni, fai diventare «il meteo» uno a caso fra sereno, pioggia, nebbia.",
        attesa: "Ogni 3 turni: il meteo diventa uno fra sereno, pioggia, nebbia.",
        suggerimento:
          "La forma è «[stato] diventa uno fra A, B, C», i valori separati da virgola: «… il meteo diventa uno fra sereno, pioggia, nebbia.».",
        esito: "OK · Il cielo ora cambia idea da solo, ogni tre turni.",
      },
      { tipo: "sistema", testo: "— Qualcosa che càpita una volta ogni tanto —" },
      {
        tipo: "narr",
        testo:
          "L'altra faccia del caso è una condizione: «càpita (1 su 4)» è vera, in media, una volta su quattro. La metti dove va una condizione qualsiasi — in una regola, in un demone, in un dialogo — e si combina con «e», «oppure», «non». «3 su 3» càpita sempre, «0 su 5» mai.",
      },
      {
        tipo: "narr",
        testo:
          "Scrivi un demone di guida: a ogni turno, una volta su quattro, un'auto sbuca dal nulla e ti toglie un punto di salute.",
      },
      {
        tipo: "checkpoint",
        consegna: "Ogni turno, con probabilità 1 su 4, fai dire «Un'auto sbuca dal nulla!» e togli 1 alla salute.",
        attesa: `Ogni turno se càpita (1 su 4): dire "Un'auto sbuca dal nulla!" e adesso diminuisci la salute di 1.`,
        suggerimento:
          "La condizione di probabilità è «càpita (1 su 4)», fra parentesi tonde: «Ogni turno se càpita (1 su 4): …».",
        esito: "OK · Adesso la strada è imprevedibile, come dev'essere.",
      },
      {
        tipo: "tranello",
        testo:
          "Anche il caso è seedato: ANNULLA lo riavvolge. Un imprevisto disfatto si ripresenta identico — non puoi «ritirare il dado» tornando indietro, e questo è voluto: rende la partita coerente. Nota l'accento di «càpita», che il motore vuole preciso. E «1 su 4» è una media: su pochi turni potresti vederla scattare due volte di fila o mai — è normale.",
      },
      { tipo: "sistema", testo: "FINE CASSETTA 19 · PRONTO." },
      {
        tipo: "narr",
        testo:
          "Hai dato alla storia il caso. Resta da darle il cambiamento: un mondo che si trasforma in scena, e stati che si parlano fra loro. È l'ultima cassetta dei Temi.",
      },
    ],
  },

  "mondo-dinamico": {
    id: "mondo-dinamico",
    numero: 20,
    titolo: "Il mondo che cambia",
    fonte: "I Temi · il mondo dinamico",
    durata: "~6 min",
    sommario:
      "Il mondo che si trasforma durante la partita: una stanza che «diventa buia» a metà gioco, e gli stati che si copiano e si confrontano fra loro — per impersonare qualcuno o ricordare una scelta.",
    blocchi: [
      { tipo: "sistema", testo: "FAVELLA CORSO · CASSETTA 20" },
      { tipo: "sistema", testo: '"Il mondo che cambia"' },
      {
        tipo: "narr",
        testo:
          "Nella cassetta sul buio hai imparato a dichiarare una stanza buia all'avvio. Ma il mondo non è fermo: cala la notte, una torcia si spegne, una stanza che era chiara diventa cieca. Questi due ultimi Temi danno alla storia la capacità di trasformarsi mentre la giochi.",
      },
      { tipo: "sistema", testo: "— Il buio che scende a metà partita —" },
      {
        tipo: "narr",
        testo:
          "Una stanza può «diventare buia» (o «illuminata») durante il gioco, come conseguenza di un evento. È stato del mondo a tutti gli effetti, quindi ANNULLA lo riavvolge. La forma è la stessa di tante conseguenze: «… e adesso [stanza] diventa buia.».",
      },
      {
        tipo: "codice",
        righe: ['Al turno 5: dire "Cala la notte." e adesso la cantina diventa buia.'],
      },
      {
        tipo: "narr",
        testo:
          "Scrivi l'evento: al turno 5 cala la notte, e la cantina diventa buia.",
      },
      {
        tipo: "checkpoint",
        consegna: "Al turno 5, fai dire «Cala la notte.» e fai diventare buia la cantina.",
        attesa: 'Al turno 5: dire "Cala la notte." e adesso la cantina diventa buia.',
        suggerimento:
          "La conseguenza è «… e adesso la cantina diventa buia.» — «diventa buia», come un cambiamento di stato della stanza.",
        esito: "OK · Da quel turno, senza una luce, in cantina è buio pesto.",
      },
      {
        tipo: "tranello",
        testo:
          "«diventa buia» spegne la luce; «diventa illuminata» (o «chiara») la riaccende. Per un esterno la notte spesso non è buio totale — ci sono le stelle, e vuoi mostrare le uscite: lì conviene ancora uno stato «momento» con descrizioni condizionali. Il buio commutabile è per quando la luce deve davvero mancare.",
      },
      { tipo: "sistema", testo: "— Gli stati che si parlano —" },
      {
        tipo: "narr",
        testo:
          "Ultimo Tema, il più astratto e il più potente: uno stato può prendere il valore di un altro stato. Serve a impersonare un personaggio, o a ricordare una scelta. La copia usa «diventa»: «il corteggiato diventa il preferito» mette nel corteggiato il valore che ha adesso il preferito.",
      },
      {
        tipo: "narr",
        testo:
          "Hai due stati, «il corteggiato» e «il preferito». Scrivi l'evento che, al turno 2, copia nel corteggiato il valore del preferito.",
      },
      {
        tipo: "checkpoint",
        consegna: "Al turno 2, fai sì che «il corteggiato» prenda il valore di «il preferito».",
        attesa: "Al turno 2: il corteggiato diventa il preferito.",
        suggerimento:
          "La copia è «il corteggiato diventa il preferito» — nessuna virgoletta, è uno stato che ne copia un altro.",
        esito: "OK · Ora il corteggiato «è» chi era il preferito.",
      },
      {
        tipo: "narr",
        testo:
          "E due stati si confrontano col marcatore «è come»: «se il corteggiato è come il preferito». Serve il «come» per non confonderlo con «è» seguito da una parola scritta a mano. Scrivi la regola: esaminando lo specchio, se il corteggiato è come il preferito, dici «Sono la stessa persona.».",
      },
      {
        tipo: "checkpoint",
        consegna: "Quando si «esamina lo specchio», se «il corteggiato è come il preferito», fai dire «Sono la stessa persona.».",
        attesa: 'Invece di esamina lo specchio se il corteggiato è come il preferito: dire "Sono la stessa persona.".',
        suggerimento:
          "Il confronto fra stati usa «è come»: «… se il corteggiato è come il preferito: …».",
        esito: "OK · Lo specchio riconosce: i due stati ora valgono uguale.",
      },
      {
        tipo: "tranello",
        testo:
          "La copia e il confronto «è come» valgono solo fra stati (le variabili-parola). Per copiare o confrontare due contatori usi il valore fra parentesi quadre — «il punteggio diventa [bonus]», «se la vita è [soglia]». Mescolare uno stato e un contatore è un errore gentile: il motore te lo dice. Il «come» è obbligatorio nel confronto, perché senza, «se il corteggiato è anna» resterebbe il confronto con la parola «anna».",
      },
      { tipo: "sistema", testo: "FINE CASSETTA 20 · PRONTO." },
      {
        tipo: "narr",
        testo:
          "E con questo i Temi sono completi: il caso, le quantità, il mondo che si trasforma, gli stati che si parlano. Hai visto tutto il linguaggio, fino all'ultima parola. Resta solo da raccoglierlo: l'ultima cassetta è il riepilogo.",
      },
    ],
  },

  riepilogo: {
    id: "riepilogo",
    numero: 21,
    titolo: "Riepilogo del linguaggio",
    fonte: "Capitolo 21 · La Casa di Via Stradivari",
    durata: "~6 min",
    sommario:
      "L'ultima cassetta: un giro veloce su tutto ciò che hai imparato, le parole che FAVELLA si tiene per sé, e un piccolo esame finale. Poi la casa è tua.",
    blocchi: [
      { tipo: "sistema", testo: "FAVELLA CORSO · CASSETTA 21" },
      { tipo: "sistema", testo: '"Riepilogo del linguaggio"' },
      {
        tipo: "narr",
        testo:
          "Eccoci all'ultima cassetta. Questa non insegna niente di nuovo: è da consultazione, e un po' da festa. Tieni a mente che tutto il linguaggio, dall'inizio alla fine, sta in una manciata di forme che ormai conosci.",
      },
      {
        tipo: "narr",
        testo:
          "Il mondo: una stanza, la sua descrizione (anche condizionale, con «se»), i collegamenti con «collega», le direzioni opposte, il punto di partenza del giocatore. Gli oggetti: «una cosa», la posizione, «prendibile», le proprietà a parola sola, le coppie «opposte», contenitori e supporti, gli alias «si chiama anche».",
      },
      {
        tipo: "narr",
        testo:
          "La memoria: stati e contatori, il valore iniziale, i confronti (almeno, al massimo, più di, meno di), l'interpolazione fra parentesi quadre. La reazione: l'unica regola «Invece di», con «se», le conseguenze «e adesso», i finali vinci/perdi/termina. Il tempo e la vita: «Al turno N», «Ogni N turni», i demoni, i personaggi coi dialoghi a nodi. E «Includi», per tenere tutto in ordine.",
      },
      {
        tipo: "narr",
        testo:
          "E i Temi, le aggiunte più recenti: il caso e le quantità (una quantità che vale «[forza]», il dado «un numero fra 2 e 6», la soglia che confronta due contatori); la casualità simbolica (uno stato che «diventa uno fra…», una condizione che «càpita (1 su N)»); il mondo che cambia (una stanza che «diventa buia»); gli stati che si parlano (la copia «X diventa Y», il confronto «X è come Y»). Tutto riproducibile, e ANNULLA riavvolge anche il caso.",
      },
      { tipo: "sistema", testo: "— Le parole che FAVELLA si tiene per sé —" },
      {
        tipo: "narr",
        testo:
          "Alcune parole hanno un significato per la grammatica e non possono fare DA SOLE il nome di una stanza o di un oggetto: è, sono, stanza, cosa, collega, dire, se, e adesso, vinci… Possono però comparire DENTRO un nome più lungo: «la porta a est» è un nome valido, anche se «est» è riservata. E il vocabolario nuovo — alias, verbi, nodi, percorsi — sta sempre fra virgolette, così non entra mai in conflitto.",
      },
      { tipo: "sistema", testo: "— Un piccolo esame —" },
      {
        tipo: "narr",
        testo:
          "Tre frasi, per chiudere in bellezza. Niente di nuovo: solo per sentire che ti vengono ormai naturali. La prima: dichiara la camera della Casa come stanza.",
      },
      {
        tipo: "checkpoint",
        consegna: "Dichiara la camera come stanza.",
        attesa: "La camera è una stanza.",
        suggerimento: "«La camera è una stanza.» — come la primissima frase del corso.",
        esito: "OK · Una stanza, come il primo giorno.",
      },
      {
        tipo: "narr",
        testo: "La seconda: in cucina c'è un bicchiere di grappa, e si può raccogliere. Rendilo prendibile.",
      },
      {
        tipo: "checkpoint",
        consegna: "Fai in modo che il bicchiere di grappa si possa raccogliere.",
        attesa: "Il bicchiere di grappa è prendibile.",
        suggerimento: "«Il bicchiere di grappa è prendibile.» — il nome lungo per intero, poi «prendibile».",
        esito: "OK · Il giocatore potrà portarsi via il bicchiere.",
      },
      {
        tipo: "narr",
        testo:
          "L'ultima, e poi ti lascio andare. La storia tiene il conto di quanti indizi hai messo insieme: dichiara «gli indizi» come contatore. (Attento alla copula: resta «è», anche se il nome è plurale.)",
      },
      {
        tipo: "checkpoint",
        consegna: "Dichiara «gli indizi» come contatore.",
        attesa: "Gli indizi è un contatore.",
        suggerimento: "«Gli indizi è un contatore.» — «è», non «sono», pur con il plurale «gli indizi».",
        esito: "OK · L'ultimo mattone è al suo posto.",
      },
      { tipo: "sistema", testo: "FINE CORSO · GRAZIE." },
      {
        tipo: "narr",
        testo:
          "E così ci siamo. Venti cassette fa non avevi mai scritto una riga; adesso conosci ogni costrutto di FAVELLA — fino ai Temi — e hai costruito, pezzo per pezzo, le fondamenta di una storia vera. «La Casa di Via Stradivari» la trovi tutta intera nel materiale del progetto: leggerla ora, da capo, è il modo migliore per vedere come i pezzi stanno insieme.",
      },
      {
        tipo: "narr",
        testo:
          "Se ti va, torna allo scaffale e gioca le due cassette-gioco: «La Casa» e «Il Relitto Silente» girano col motore vero, qui nel browser. Vedrai dall'altra parte ciò che hai imparato a scrivere. Buona scrittura — adesso la casa è tua.",
      },
    ],
  },
};
