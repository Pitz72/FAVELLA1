// ====================================================================
//  Dal testo del motore ai blocchi dell'interfaccia.
// --------------------------------------------------------------------
//  Il motore stampa testo semplice. Qui lo si riconosce riga per riga:
//  titolo di stanza, prosa, battuta di un personaggio, sensazioni del corpo,
//  risposte di sistema, finale. Le righe «Uscite:» e «Puoi vedere qui:» non
//  finiscono nella prosa: l'interfaccia le mostra già come pulsanti.
// ====================================================================

export type Blocco =
  | { tipo: "stanza"; titolo: string }
  | { tipo: "prosa"; testo: string }
  | { tipo: "battuta"; chi: string; testo: string }
  | { tipo: "corpo"; testo: string }
  | { tipo: "sistema"; testo: string }
  | { tipo: "finale"; testo: string }
  | { tipo: "comando"; testo: string };

export const PERSONAGGI = [
  "Nunzio", "Saverio", "Iole", "Rocco", "Vito", "Rosaria", "Concetta",
  "Pasquale", "Peppe", "Ciro", "Tore", "Onofrio", "Cosimo", "Imma",
];

// Messaggi del corpo e dell'ambiente (demoni del gioco): vanno in margine,
// come sensazioni, non nella narrazione.
const CORPO = [
  "Hai la lingua impastata", "La lingua ti si incolla", "Le mani tremano", "Lo stomaco",
  "La debolezza ti rallenta", "Il corpo, per una volta", "Il sole picchia", "Il riverbero del sale",
  "Quassù il vento passa", "Il cane ti azzanna", "Stavolta i denti", "Vito cala il tubo",
  "Un colpo ti prende", "La tanica è piena", "Tanica e damigiana", "Dividi un boccone",
  "Non c'è niente da dividere", "Peppe beve un sorso",
];

// Le risposte che il motore dà da sé, non la storia: servizio, rifiuti, domande. Il motore le
// manda tutte come testo semplice (l'evento «testo» comprende anche le descrizioni
// dell'autore, quindi non basta il tipo a separarle): si riconoscono dalla forma.
// collaudo/testo.py le prova tutte, e prova che nessuna riga della storia ne somigli una.
export const SISTEMA = [
  /^Preso:/, /^Lasciato:/, /^Non vedo /, /^Non capisco/, /^Non puoi /, /^Non ce l'hai/,
  /^Hai le mani troppo piene/, /^Stai portando/, /^\s+- /, /^Non stai portando/, /^\(Fine della conversazione\.\)/,
  /^Non è una scelta valida/, /^Concludi la conversazione/, /^\(La conversazione si chiude\.\)/,
  /^Annullato/, /^Non c'è niente da annullare/, /^Con chi vuoi parlare/,
  // le domande del motore quando il comando è incompleto («Cosa vuoi esaminare?», «Attacca che cosa?»)
  /^(Cosa|Che cosa|Dove|Con cosa|Con chi|A chi) vuoi [a-zà-ÿ' ]+\?$/, /^[A-ZÀ-Ý][a-zà-ÿ]+ che cosa\?$/,
  /^Vuoi davvero .+\((sì|si)\/no\)/,
  // il tempo, i sensi, ciò che non si può fare con una cosa
  /^Il tempo passa\.$/, /^Non senti /, /^Non succede nulla/, /^Non si (apre|chiude|mangia|beve|può)/, /^Ce l'hai già\./,
  /^Non vedi nulla/, /^Nel(la|lo|l')\s?[\wà-ÿ' ]+ non ci puoi mettere niente\./,
  /^Usare .+ non ha alcun effetto particolare\./,
  // l'aiuto, il riepilogo dello stato, i servizi (annulla, ancora, salva, carica, esci)
  /^Comandi disponibili:/, /^Cerca di usare verbi semplici/, /^Vita \d+\/10 · Sete /,
  /^Non hai ancora fatto nulla/, /^Qui non c'è nessuno/, /^A presto!/, /^\((Si continua|Non c'è nessun salvataggio)/,
  /^\[ERRORE/,
];

export function analizza(testo: string): Blocco[] {
  const out: Blocco[] = [];
  const righe = testo.replace(/\r/g, "").split("\n");
  for (const r0 of righe) {
    const r = r0.trimEnd();
    if (!r.trim()) continue;
    const t = r.trim();
    let m: RegExpMatchArray | null;
    if ((m = t.match(/^--- (.+) ---$/))) { out.push({ tipo: "stanza", titolo: m[1] }); continue; }
    if (/^Puoi vedere qui:/.test(t) || /^Uscite:/.test(t)) continue;
    if (/^\d+\. /.test(t) && /^\s+\d+\./.test(r)) continue;     // opzioni di dialogo: diventano pulsanti
    if (/^FINALE/.test(t)) { out.push({ tipo: "finale", testo: t.replace(/^FINALE\s*—\s*/, "") }); continue; }
    if ((m = t.match(/^([A-ZÀ-Ý][a-zà-ÿ]+): (.+)$/)) && PERSONAGGI.includes(m[1])) {
      out.push({ tipo: "battuta", chi: m[1], testo: m[2] }); continue;
    }
    if (CORPO.some((p) => t.startsWith(p))) { out.push({ tipo: "corpo", testo: t }); continue; }
    if (SISTEMA.some((re) => re.test(r))) { out.push({ tipo: "sistema", testo: t }); continue; }
    out.push({ tipo: "prosa", testo: t });
  }
  return out;
}

/** Quello che si dice di te, a lato dello schermo, quando qualcuno te lo ha riferito.
 *  Le chiavi sono gli stati «stato della voce …» della storia (il-viaggiatore.fav); la riga
 *  è come la direbbe chi la racconta, non come la conta il gioco. collaudo/testo.py verifica
 *  che ogni voce dichiarata nei .fav ne abbia una, e che nessuna sia di troppo. */
export const VOCI: Record<string, string> = {
  "del sangue": "che alzi le mani",
  "della generosità": "che lasci qualcosa a chi resta",
  "del bluff": "che al casello hai puntato una pistola scarica",
};

/** Che cosa hai fatto a chi, sotto la fiducia, a lato dello schermo. Le chiavi sono «persona:gesto»,
 *  come le espone il ponte (ponte.py, _GESTI); la riga è detta a chi gioca, al passato: sono gesti
 *  compiuti, non conti. La soglia della generosità e quante persone servono restano nascoste.
 *  collaudo/testo.py verifica che il ponte e questa tabella coincidano. */
export const GESTI: Record<string, string> = {
  "Saverio:cibo": "gli hai lasciato da mangiare",
  "Iole:dono": "le hai lasciato qualcosa del tuo",
  "Iole:pompa": "le hai legato il filtro alla pompa",
  "Vito:pagato": "gli hai pagato il passaggio",
  "Vito:bluff": "gli hai puntato una pistola scarica",
  "Vito:terra": "l'hai lasciato a terra",
  "Rosaria:acqua": "le hai lasciato dell'acqua",
  "Onofrio:ricordo": "gli hai mostrato qualcosa di tuo",
  "Imma:cibo": "l'hai fatta mangiare",
  "Pasquale:cura": "l'hai curato con le tue medicine",
};

/** Testo di una descrizione: MAIUSCOLE (oggetti notevoli), parentesi (suggerimenti), «dialoghi». */
export type Pezzo = { k: "t" | "chiave" | "aiuto"; s: string };

export function spezza(testo: string): Pezzo[] {
  const out: Pezzo[] = [];
  // prima i suggerimenti tra parentesi, poi le parole in maiuscolo dentro il resto
  const parti = testo.split(/(\([^()]*\))/g);
  for (const p of parti) {
    if (!p) continue;
    if (/^\(.*\)$/.test(p) && /[A-ZÀ-Ý]{3,}/.test(p)) { out.push({ k: "aiuto", s: p.slice(1, -1) }); continue; }
    const sub = p.split(/(\b[A-ZÀ-Ý][A-ZÀ-Ý']{2,}(?:\s+[A-ZÀ-Ý]{2,})*\b)/g);
    for (const q of sub) {
      if (!q) continue;
      if (/^[A-ZÀ-Ý][A-ZÀ-Ý' ]{2,}$/.test(q)) out.push({ k: "chiave", s: q });
      else out.push({ k: "t", s: q });
    }
  }
  return out;
}
