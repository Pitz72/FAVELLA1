// ====================================================================
//  «Il Viaggiatore» — dati dell'esperimento
// --------------------------------------------------------------------
//  Un'avventura di sopravvivenza/GDR scritta in FAVELLA 1 (7 zone, 39
//  location, 15 personaggi, ~44 oggetti, 4 finali). Qui vivono: la
//  mappa stanza→zona, il TEMA CROMATICO di ogni zona (la palette cambia
//  mentre cammini) e i contenuti della presentazione d'intro.
// ====================================================================

export const VIAGGIATORE_GAME = {
  gameId: "galleria/il-viaggiatore",
  entry: "il-viaggiatore.fav",
  files: [
    "il-viaggiatore.fav",
    "sistemi.fav",
    "z1-acquaviva.fav",
    "z2-piana.fav",
    "z3-invaso.fav",
    "z4-statale.fav",
    "z5-paese.fav",
    "z6-colline.fav",
    "z7-guado.fav",
  ],
};

export type ZoneKey = "z0" | "z1" | "z2" | "z3" | "z4" | "z5" | "z6" | "z7";

// Ogni stanza del gioco appartiene a una zona: serve a virare la palette.
export const ROOM_ZONE: Record<string, ZoneKey> = {
  stazione: "z1", piazza: "z1", bar: "z1", casa: "z1", margine: "z1",
  tratto: "z2", masseria: "z2", pozzo: "z2", serra: "z2", sterrata: "z2",
  conca: "z3", diga: "z3", casotto: "z3", fondale: "z3", relitto: "z3", "torre di presa": "z3", condotta: "z3",
  rampa: "z4", casello: "z4", piazzola: "z4", "area di servizio": "z4", sottopasso: "z4", discesa: "z4",
  porta: "z5", piazzetta: "z5", osteria: "z5", mercato: "z5", vicolo: "z5", cortile: "z5", salita: "z5",
  sentiero: "z6", pianoro: "z6", grotta: "z6", sorgente: "z6", cappella: "z6", valico: "z6",
  guado: "z7", strada: "z7", soglia: "z7",
};

export interface ZoneTheme {
  nome: string;          // etichetta della zona, mostrata nella scheda LUOGO
  accent: string;        // colore-guida (titoli, barre, bordi)
  accentSoft: string;    // rgba tenue per glow/sfondi
  bg: string;            // gradiente di fondo dello schermo di gioco
}

// La palette di ogni zona. Scelta personale: ogni tappa ha il suo clima
// cromatico, dal teal polveroso della partenza al cremisi del guado.
export const ZONE_THEME: Record<ZoneKey, ZoneTheme> = {
  z0: { nome: "—", accent: "#e0a96d", accentSoft: "rgba(224,169,109,0.16)",
        bg: "radial-gradient(120% 120% at 50% -10%, #0c0a07 0%, #05060b 60%, #03040a 100%)" },
  z1: { nome: "Acquaviva · il capolinea", accent: "#7fc8bd", accentSoft: "rgba(127,200,189,0.15)",
        bg: "radial-gradient(120% 120% at 70% -10%, #0a1614 0%, #05090e 55%, #03060b 100%)" },
  z2: { nome: "La piana · il sole", accent: "#e6a85a", accentSoft: "rgba(230,168,90,0.16)",
        bg: "radial-gradient(130% 120% at 60% -15%, #1a1206 0%, #0b0a07 55%, #05050a 100%)" },
  z3: { nome: "L'invaso morto · il sale", accent: "#a9dbe4", accentSoft: "rgba(169,219,228,0.14)",
        bg: "radial-gradient(120% 120% at 50% -10%, #0d1820 0%, #070d14 55%, #04070d 100%)" },
  z4: { nome: "La statale · il casello", accent: "#f2ad45", accentSoft: "rgba(242,173,69,0.15)",
        bg: "radial-gradient(120% 120% at 40% -10%, #14130f 0%, #0a0a0c 55%, #050609 100%)" },
  z5: { nome: "Il paese · i vivi", accent: "#ec7d54", accentSoft: "rgba(236,125,84,0.17)",
        bg: "radial-gradient(130% 120% at 65% -12%, #1c0f08 0%, #0d0805 55%, #060509 100%)" },
  z6: { nome: "Le colline · la pietra", accent: "#9aa6e0", accentSoft: "rgba(154,166,224,0.15)",
        bg: "radial-gradient(120% 120% at 45% -10%, #0e1020 0%, #080912 55%, #050610 100%)" },
  z7: { nome: "Il guado · il fratello", accent: "#df5f78", accentSoft: "rgba(223,95,120,0.16)",
        bg: "radial-gradient(120% 120% at 50% -8%, #1a0b12 0%, #0c060d 55%, #060509 100%)" },
};

export function zoneOf(roomId: string | null): ZoneKey {
  if (!roomId) return "z0";
  return ROOM_ZONE[roomId] ?? "z0";
}

// --------------------------------------------------------------------
//  CONTENUTI DELLA PRESENTAZIONE
// --------------------------------------------------------------------

export const INTRO_STATS = [
  { n: 7, label: "zone" },
  { n: 39, label: "luoghi" },
  { n: 15, label: "personaggi" },
  { n: 44, label: "oggetti" },
  { n: 4, label: "finali" },
];

export const INTRO_ZONES: { k: ZoneKey; nome: string; sub: string; testo: string }[] = [
  { k: "z1", nome: "Acquaviva", sub: "il capolinea", testo: "L'ultima cittadina mezza-allacciata alla rete. Da qui si parte a piedi: si impara a bere, mangiare, barattare. È l'ultima volta che l'acqua è facile." },
  { k: "z2", nome: "La piana", sub: "il sole non perdona", testo: "Distesa agricola abbandonata. Il primo cammino esposto, dove la sete morde. Saverio fa la guardia a un pozzo; un cane difende ciò che resta." },
  { k: "z3", nome: "L'invaso morto", sub: "acqua ovunque, niente da bere", testo: "Un bacino prosciugato, crepato in lastre di sale. Un paradosso: l'acqua abbonda ed è veleno. Iole custodisce il modo di renderla potabile." },
  { k: "z4", nome: "La statale", sub: "chi tiene la strada", testo: "Un casello presidiato. Vito fa pagare il pedaggio. Quattro modi per passare: pagare, aggirare, combattere, o bluffare con una pistola scarica." },
  { k: "z5", nome: "Il paese", sub: "il posto dove si potrebbe restare", testo: "L'unico centro ancora vivo. Rosaria tiene l'osteria; arriva la notizia che incrina il viaggio. Qui le scelte fanno male: curare un malato, portare via un ragazzo, vendere un anello." },
  { k: "z6", nome: "Le colline", sub: "l'ultima salita", testo: "La pietra, il freddo, l'isolamento. Onofrio, l'eremita, conobbe la tua famiglia. Ti dà la verità a pezzi e una scelta: una lettera, o un fucile." },
  { k: "z7", nome: "Il guado", sub: "cosa sei tornato a trovare", testo: "L'ultimo passaggio prima di casa. Lo tiene Cosimo, il fratello rimasto. Non lo sconfiggi: lo riconosci, o lo abbatti. E poi, Acquamorta." },
];

export const INTRO_CHARS: { nome: string; ruolo: string }[] = [
  { nome: "Saverio", ruolo: "il massaro del pozzo — custodire" },
  { nome: "Iole", ruolo: "la donna della diga — aspettare" },
  { nome: "Vito", ruolo: "il guardiano del casello — predare" },
  { nome: "Rosaria", ruolo: "la locandiera — restare" },
  { nome: "Onofrio", ruolo: "l'eremita — rinunciare" },
  { nome: "Cosimo", ruolo: "il fratello rimasto — il guado" },
  { nome: "Peppe", ruolo: "il ragazzo che vuole partire" },
  { nome: "Concetta", ruolo: "la vecchia che ricorda" },
];

export const INTRO_LOGICS: { titolo: string; testo: string }[] = [
  { titolo: "La sete è la spina dorsale", testo: "Quattro contatori del corpo e delle scorte: vita, sete, fame, acqua, cibo. Camminare costa; il tempo logora. Si beve e si mangia per non cedere." },
  { titolo: "L'acqua è la moneta", testo: "In un mondo secco l'acqua è risorsa e valuta insieme. Ogni baratto è una scelta che costa: dare acqua oggi è sete domani." },
  { titolo: "La fiducia apre le porte", testo: "Cinque personaggi maggiori, un contatore di fiducia ciascuno. Doni e favori la alzano; minacce e furti la abbassano. Decide cosa ti viene concesso." },
  { titolo: "La violenza costa, ed è evitabile", testo: "GDR leggero e narrativo. Pochi scontri, quasi sempre aggirabili. Combattere è la carta più dura, mai la più comoda." },
  { titolo: "Le scelte viaggiano fino in fondo", testo: "Curare o no, portare via un ragazzo o no, tenere o vendere un ricordo: ogni gesto pesa, e si raccoglie alla fine, in uno dei quattro finali." },
];
