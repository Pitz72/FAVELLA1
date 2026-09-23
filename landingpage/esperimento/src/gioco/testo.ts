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
  "Pasquale", "Peppe", "Ciro", "Tore", "Onofrio", "Cosimo",
];

// Messaggi del corpo e dell'ambiente (demoni del gioco): vanno in margine,
// come sensazioni, non nella narrazione.
const CORPO = [
  "Hai la lingua impastata", "La lingua ti si incolla", "La testa martella", "Lo stomaco",
  "La debolezza ti rallenta", "Il corpo, per una volta", "Il sole picchia", "Il riverbero del sale",
  "Quassù il vento taglia", "Il cane ti azzanna", "Stavolta affonda", "Vito cala il tubo",
  "Un colpo ti prende", "La tanica è piena", "Tanica e damigiana", "Dividi un boccone",
  "Non c'è niente da dividere", "Peppe beve un sorso",
];

const SISTEMA = [
  /^Preso:/, /^Lasciato:/, /^Non vedo /, /^Non capisco/, /^Non puoi /, /^Non ce l'hai/,
  /^Hai le mani troppo piene/, /^Stai portando/, /^\s+- /, /^Non stai portando/, /^\(Fine della conversazione\.\)/,
  /^Non è una scelta valida/, /^Concludi la conversazione/, /^\(La conversazione si chiude\.\)/,
  /^Annullato/, /^Non c'è niente da annullare/, /^Con chi vuoi parlare/,
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
