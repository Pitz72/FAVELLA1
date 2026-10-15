// ====================================================================
//  La Libreria standard di FAVELLA 1 — moduli .fav riusabili.
//  Copia fedele dei moduli del pacchetto (favella1/libreria/*.fav): qui
//  sono mostrati, copiabili e scaricabili. Si includono con
//  `Includi "nome.fav".` dopo aver dichiarato le stanze; con pip,
//  `favella1 libreria copia <nome>`. Includere tutto è sicuro: le voci
//  non usate non danno errori né avvisi.
// ====================================================================

export interface LibraryModule {
  id: string;
  file: string;
  titolo: string;
  blurb: string;
  /** Etichette delle parole chiave aggiunte, per un colpo d'occhio. */
  esempi: string[];
  /** Contenuto integrale del modulo .fav (copiabile/scaricabile). */
  codice: string;
}

export const LIBRARY_MODULES: LibraryModule[] = [
  {
    id: "sinonimi",
    file: "sinonimi.fav",
    titolo: "Sinonimi di verbo",
    blurb:
      "Un ventaglio di sinonimi per i verbi di libreria, così il giocatore può scrivere più naturalmente («scruta la targa», «arraffa la chiave») senza che tu debba una regola per ogni parola. Ogni riga rimappa una parola nuova al verbo canonico, che resta identico (regole «Invece di», anafora e default compresi).",
    esempi: ["scruta", "arraffa", "spalanca", "riponi", "dirigiti"],
    codice: `# sinonimi.fav — Libreria standard di FAVELLA 1
# Modulo «Sinonimi di verbo»
#
# Aggiunge un ventaglio di sinonimi ai verbi di libreria, così che il giocatore
# possa scrivere più naturalmente ("scruta la targa", "arraffa la chiave") senza
# che tu debba scrivere una regola per ogni parola. Ogni riga rimappa una parola
# NUOVA al verbo canonico, che si comporta in tutto e per tutto come l'originale
# (regole "Invece di …", anafora e logica di default comprese).
#
# Uso:  metti questa riga nel tuo file, dopo aver dichiarato le stanze:
#         Includi "sinonimi.fav".
#       (in un'installazione pip:  favella1 libreria copia sinonimi)
#
# È sicuro includerlo per intero: i sinonimi non usati non danno alcun avviso.

# --- ESAMINA (guardare un oggetto da vicino) --------------------------------
"ispeziona" è come esamina.
"scruta" è come esamina.
"analizza" è come esamina.
"controlla" è come esamina.
"studia" è come esamina.
"esplora" è come esamina.

# --- PRENDI (raccogliere un oggetto) ----------------------------------------
"arraffa" è come prendi.
"agguanta" è come prendi.
"ghermisci" è come prendi.
"acchiappa" è come prendi.

# --- LASCIA (posare/abbandonare un oggetto) ---------------------------------
"deposita" è come lascia.
"abbandona" è come lascia.
"getta" è come lascia.

# --- USA (adoperare un oggetto, anche "usa X con Y") ------------------------
"adopera" è come usa.
"utilizza" è come usa.
"impiega" è come usa.
"maneggia" è come usa.

# --- APRI (aprire contenitori, porte, ante) ---------------------------------
"spalanca" è come apri.
"schiudi" è come apri.
"scoperchia" è come apri.

# --- METTI (riporre un oggetto in un contenitore o su un supporto) ----------
"riponi" è come metti.
"colloca" è come metti.
"sistema" è come metti.

# --- VAI (muoversi in una direzione) ----------------------------------------
"spostati" è come vai.
"dirigiti" è come vai.
"procedi" è come vai.
`,
  },
  {
    id: "proprieta",
    file: "proprieta.fav",
    titolo: "Proprietà opposte comuni",
    blurb:
      "Le coppie di proprietà opposte (mutuamente esclusive) più frequenti nelle avventure. Assegnando una proprietà, la sua opposta viene tolta da sé: così «se è bagnata» e «se è asciutta» non possono mai essere vere insieme. Le coppie aperta↔chiusa e accesa↔spenta sono già nel motore.",
    esempi: ["rotta/integra", "bagnata/asciutta", "piena/vuota", "viva/morta"],
    codice: `# proprieta.fav — Libreria standard di FAVELLA 1
# Modulo «Proprietà opposte comuni»
#
# Dichiara le coppie di proprietà opposte (mutuamente esclusive) più frequenti
# nelle avventure. Assegnando una proprietà a un oggetto, la sua opposta viene
# automaticamente tolta: così "se la lampada è accesa" e "se la lampada è spenta"
# non possono mai essere vere insieme.
#
# (Le coppie aperta↔chiusa e accesa↔spenta sono già precaricate dal motore: qui
#  NON vanno ridichiarate, le trovi pronte all'uso senza includere nulla.)
#
# Uso:  Includi "proprieta.fav".
#       (in un'installazione pip:  favella1 libreria copia proprieta)
#
# Includi pure tutto: le coppie non usate non producono avvisi. Tieni solo le
# righe che ti servono se preferisci un file più snello.

# --- INTEGRITÀ ---------------------------------------------------------------
Rotta e integra sono opposte.

# --- PULIZIA -----------------------------------------------------------------
Sporca e pulita sono opposte.

# --- UMIDITÀ -----------------------------------------------------------------
Bagnata e asciutta sono opposte.

# --- RIEMPIMENTO -------------------------------------------------------------
Piena e vuota sono opposte.

# --- LEGAME ------------------------------------------------------------------
Legata e slegata sono opposte.

# --- VISIBILITÀ --------------------------------------------------------------
Nascosta e visibile sono opposte.

# --- ATTIVAZIONE -------------------------------------------------------------
Attiva e inattiva sono opposte.

# --- ALIMENTAZIONE -----------------------------------------------------------
Carica e scarica sono opposte.

# --- TEMPERATURA -------------------------------------------------------------
Calda e fredda sono opposte.

# --- SIGILLO -----------------------------------------------------------------
Sigillata e dissigillata sono opposte.

# --- STATO DI VITA (utile per piante, fuochi, creature) ---------------------
Viva e morta sono opposte.
`,
  },
  {
    id: "verbi",
    file: "verbi.fav",
    titolo: "Verbi d'azione comuni",
    blurb:
      "I verbi d'azione che il motore non conosce da sé («brucia», «scava», «bussa», «suona»…), così non scrivi ogni volta «\"brucia\" è un comando.». Dopo l'inclusione basta scrivere le regole («Invece di brucia la lettera se …: …»). Include anche verbi senza oggetto («salta», «urla») per le regole globali. Accendi, spegni, bevi, tocca, aspetta e gli altri verbi di libreria il motore li conosce già dalla 1.3.0: non vanno dichiarati, o perderebbero il loro effetto.",
    esempi: ["brucia", "scava", "bussa", "suona", "salta"],
    codice: `# verbi.fav — Libreria standard di FAVELLA 1
# Modulo «Verbi d'azione comuni»
#
# Dichiara una scorta di verbi personalizzati molto usati nelle avventure, così
# non devi scrivere ogni volta '"brucia" è un comando.'. Dopo l'inclusione,
# basta scrivere le regole: 'Invece di brucia la lettera se …: …'.
#
# Uso:  Includi "verbi.fav".
#       (in un'installazione pip:  favella1 libreria copia verbi)
#
# I verbi dichiarati ma senza una regola non danno errore: semplicemente non
# faranno nulla finché non scrivi la regola corrispondente. Puoi includere tutto
# o tenere solo le righe che ti servono.
#
# Dalla 1.3.0 il motore conosce da sé accendi, spegni, bevi, aspetta, tocca,
# spingi, tira, premi, gira, rompi, colpisci, indossa, togli, dai, mostra,
# annusa e ascolta (vedi il manuale): qui restano solo i verbi che il motore
# non ha. Dichiarare di nuovo uno di quei verbi lo renderebbe tuo, e perderebbe
# il comportamento di libreria (accendi non accenderebbe più la lampada).

# --- LUCE E FUOCO ------------------------------------------------------------
"brucia" è un comando.

# --- FORZA FISICA ------------------------------------------------------------
"scava" è un comando.

# --- CONTATTO E SENSI --------------------------------------------------------
"bussa" è un comando.
"assaggia" è un comando.

# --- SUONO E VOCE ------------------------------------------------------------
"suona" è un comando.
"grida" è un comando.
"chiama" è un comando.

# --- AZIONI SENZA OGGETTO (intransitive) ------------------------------------
# Si digitano da sole ('salta', 'urla') e si gestiscono con una regola
# globale: 'Invece di salta: dire "…".'.
"salta" è un comando senza oggetto.
"urla" è un comando senza oggetto.
`,
  },
];
