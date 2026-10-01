// ====================================================================
//  Le scene del trailer, disegnate su canvas in coordinate di progetto
//  1920×1080. Ogni scena vive in un suo file (trailer/scene/…): questo è
//  il regista, che sa quali scene ci sono, le prepara tutte all'avvio e
//  chiama quella giusta per il tempo t.
//
//  Ogni funzione di disegno è pura rispetto al tempo globale t: si può
//  saltare, mettere in pausa o riavviare senza stati nascosti. Le parti
//  pesanti (nuvole, monti, legno, carta, fango, sale, cemento, rilievo) si
//  dipingono UNA volta sola in tele fuori schermo (la cache), a pezzi,
//  mentre girano i loghi d'apertura: a ogni fotogramma restano copie e
//  qualche bagliore.
// ====================================================================
import type { IdScena } from "./scaletta";
import { cacheTrailer, type Cache } from "./cache";
import { disegnaAlba, preparaAlba } from "./scene/alba";
import { disegnaGuado, preparaGuado } from "./scene/guado";
import { disegnaInvaso, preparaInvaso } from "./scene/invaso";
import { disegnaLettere, preparaLettere } from "./scene/lettere";
import { disegnaMappa, preparaMappa } from "./scene/mappa";
import { disegnaCinque, disegnaNumeri, disegnaRegole } from "./scene/regole";
import { disegnaTerra, preparaTerra } from "./scene/terra";
import { FONT } from "./font";

export type { Cache } from "./cache";
export { cacheTrailer } from "./cache";
export { ZONE, REGOLE } from "./zone";
export { FONT } from "./font";
export { tappaCorrente } from "./scene/mappa";

const PASSI: [string, (c: Cache) => Promise<void>][] = [
  ["lettere", preparaLettere],
  ["alba", preparaAlba],
  ["terra", preparaTerra],
  ["invaso", preparaInvaso],
  ["mappa", preparaMappa],
  ["guado", preparaGuado],
];

let inCorso: Promise<void> | null = null;
let avanzamento = 0;
const ascoltatori = new Set<(k: number) => void>();

/** Segue l'avanzamento della preparazione (0…1). Risponde subito con lo stato di ora; restituisce la funzione per smettere. */
export function seguiPreparazione(f: (k: number) => void): () => void {
  ascoltatori.add(f);
  f(avanzamento);
  return () => { ascoltatori.delete(f); };
}

/**
 * Prepara le tele di tutte le scene, una per volta, lasciando respirare il browser fra l'una e
 * l'altra (i loghi continuano a dissolversi). Si può chiamare più volte: parte una volta sola.
 * Aspetta i caratteri, perché i testi dipinti nelle tele (la carta, la busta) li usano.
 */
export function avviaPreparazione(c: Cache = cacheTrailer, avanza?: (k: number) => void): Promise<void> {
  if (inCorso) return inCorso;
  inCorso = (async () => {
    const famiglie = [`500 24px ${FONT.serif}`, `italic 500 24px ${FONT.serif}`, `700 24px ${FONT.display}`, `800 24px ${FONT.display}`, `600 24px ${FONT.display}`, `500 24px ${FONT.mono}`, `600 24px ${FONT.mono}`, `700 24px ${FONT.mono}`];
    const attesa = Promise.all(famiglie.map((f) => document.fonts?.load(f).catch(() => null)));
    await Promise.race([attesa, new Promise((r) => setTimeout(r, 2500))]);
    const tempi: string[] = [];
    for (let i = 0; i < PASSI.length; i++) {
      const t0 = performance.now();
      await PASSI[i][1](c);
      tempi.push(`${PASSI[i][0]} ${Math.round(performance.now() - t0)} ms`);
      avanzamento = (i + 1) / PASSI.length;
      avanza?.(avanzamento);
      ascoltatori.forEach((f) => f(avanzamento));
      await new Promise<void>((r) => setTimeout(r, 0));
    }
    if (import.meta.env.DEV) console.info("[trailer] tele pronte: " + tempi.join(", "));
  })();
  return inCorso;
}

// --------------------------------------------------------------------
//  Regia: disegna la scena richiesta
// --------------------------------------------------------------------
export function disegnaScena(ctx: CanvasRenderingContext2D, id: IdScena, t: number, c: Cache) {
  switch (id) {
    case "lettere": return disegnaLettere(ctx, t, c);
    case "alba": return disegnaAlba(ctx, t, c, false);
    case "terra": return disegnaTerra(ctx, t, c);
    case "invaso": return disegnaInvaso(ctx, t, c);
    case "mappa": return disegnaMappa(ctx, t, c);
    case "cinque": return disegnaCinque(ctx, t);
    case "guado": return disegnaGuado(ctx, t, c);
    case "regole": return disegnaRegole(ctx, t);
    case "numeri": return disegnaNumeri(ctx, t, c);
    case "titolo": return disegnaAlba(ctx, t, c, true);
  }
}
