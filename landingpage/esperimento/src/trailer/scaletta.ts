// ====================================================================
//  SCALETTA del trailer «Il Viaggiatore» — l'unica fonte dei tempi.
// --------------------------------------------------------------------
//  Principio narrativo invariato rispetto alla prima intro (le lettere,
//  l'uomo a piedi, la Secca, la domanda, le sette tappe, i cinque modi di
//  restare, il fratello, le regole, i numeri, il titolo), ma tradotto in
//  inquadrature: ogni frase ha un correlativo visivo, ogni scena cambia di
//  segno un valore (legame → rottura, fermo → cammino, giorno → notte…).
//
//  DÉCOUPAGE (secondi, 16:9, letterbox 2.39:1 fino al titolo)
//   A  0.0– 9.6  DETTAGLIO dall'alto: sul tavolo arrivano lettere in corsivo,
//                poi il vuoto, poi il biglietto in stampatello. Legame → rottura.
//   B  9.6–17.6  CAMPO LUNGHISSIMO all'alba: il viandante va verso ovest, la
//                propria ombra davanti. Fermo → cammino.
//   C 17.6–25.2  DETTAGLIO in carrellata: piedi, tanica, terra crepata, polvere.
//                Correlativo di «una terra che l'acqua ha svuotato» / la Secca.
//   D 25.2–33.4  CAMPO LUNGO sull'invaso di sale: giorno → notte, la domanda.
//   E 33.4–49.0  LA MAPPA: la rotta si disegna tappa per tappa, colore per zona.
//   F 49.0–59.6  CINQUE MODI: cinque segni (pozzo, pompa, sbarra, bicchiere,
//                legno intagliato) per cinque verbi di chi è rimasto.
//   G 59.6–67.8  CAMPO LUNGO al guado, controluce cremisi: il viandante si ferma
//                davanti a una figura immobile. Cammino → arresto.
//   H 67.8–77.0  MONTAGGIO SERRATO: le cinque regole, ognuna col suo segno.
//   I 77.0–81.6  I NUMERI.
//   J 81.6–88.5  L'ALBA, di nuovo: il titolo; il letterbox si apre. → avvio.
// ====================================================================

export const W = 1920;
export const H = 1080;
/** Fasce del letterbox 2.39:1 dentro il quadro 16:9. */
export const BANDA = Math.round((H - W / 2.39) / 2); // ≈ 138

export type IdScena = "lettere" | "alba" | "terra" | "invaso" | "mappa" | "cinque" | "guado" | "regole" | "numeri" | "titolo";

export interface Scena { id: IdScena; da: number; a: number; entra: number; esce: number }

// `entra`/`esce`: durata della dissolvenza (0 = stacco netto).
export const SCENE: Scena[] = [
  { id: "lettere", da: 0.0,  a: 9.6,  entra: 0.8, esce: 0.7 },
  { id: "alba",    da: 9.6,  a: 17.6, entra: 1.0, esce: 0 },
  // terra → invaso è un incrocio vero, centrato sul taglio nominale (25,2): la terra resta piena (e sotto) finché l'invaso,
  // che le entra sopra da 24,8 a 25,6, non è tutto opaco. Prima le due si dissolvevano insieme sul nero e a 25,0 il quadro
  // perdeva quasi metà della luce.
  { id: "terra",   da: 17.6, a: 25.6, entra: 0,   esce: 0 },
  { id: "invaso",  da: 24.8, a: 33.4, entra: 0.8, esce: 1.2 },
  { id: "mappa",   da: 32.8, a: 49.0, entra: 1.4, esce: 0.8 },
  { id: "cinque",  da: 48.8, a: 59.6, entra: 0.8, esce: 0.5 },
  { id: "guado",   da: 59.6, a: 67.8, entra: 0.6, esce: 0 },
  { id: "regole",  da: 67.8, a: 77.0, entra: 0,   esce: 0.3 },
  { id: "numeri",  da: 77.0, a: 81.8, entra: 0.3, esce: 0.8 },
  { id: "titolo",  da: 81.4, a: 1e9,  entra: 1.2, esce: 0 },
];

export const DURATA = 88.5;

/** Capitoli per la barra d'avanzamento. */
export const CAPITOLI = [
  { t: 0.0, nome: "le lettere" },
  { t: 9.6, nome: "il cammino" },
  { t: 17.6, nome: "la Secca" },
  { t: 33.4, nome: "sette tappe" },
  { t: 49.0, nome: "chi è rimasto" },
  { t: 59.6, nome: "il guado" },
  { t: 67.8, nome: "le regole" },
  { t: 81.4, nome: "il titolo" },
];

/** Opacità di una scena al tempo t (dissolvenze incluse). */
export function presenza(s: Scena, t: number) {
  if (t < s.da || t > s.a) return 0;
  const a = s.entra > 0 ? Math.min(1, (t - s.da) / s.entra) : 1;
  const b = s.esce > 0 ? Math.min(1, (s.a - t) / s.esce) : 1;
  return Math.max(0, Math.min(a, b));
}

// --------------------------------------------------------------------
//  CAMMINATE: dove il viandante cammina, e a che cadenza (passi/s ÷ 2).
//  Servono al disegno (fase del passo) e al suono (i passi a terra).
// --------------------------------------------------------------------
/** Su che cosa si cammina: dà ai passi la loro materia (è solo un dato: nessun tempo dipende da lui). */
export type Terreno = "asfalto" | "crosta" | "sale" | "sassi";
export interface Camminata { da: number; a: number; cad: number; vol: number; terreno: Terreno }
export const CAMMINATE: Camminata[] = [
  { da: 9.6,  a: 17.6, cad: 1.05, vol: 0.35, terreno: "asfalto" },   // la provinciale all'alba
  { da: 17.6, a: 25.2, cad: 0.92, vol: 1.0,  terreno: "crosta" },    // il fango screpolato della secca
  { da: 25.2, a: 32.6, cad: 1.0,  vol: 0.18, terreno: "sale" },      // la piana di sale dell'invaso
  { da: 59.6, a: 64.0, cad: 0.9,  vol: 0.55, terreno: "sassi" },     // il greto del guado (si ferma sul colpo grave del brano, a 64,0)
  { da: 81.4, a: 1e9,  cad: 1.0,  vol: 0.25, terreno: "asfalto" },   // la provinciale, di nuovo, sul titolo
];

export const faseDiPasso = (t: number, c: Camminata) => (t - c.da) * c.cad;

/** Istanti in cui un piede tocca terra (fasi .25 e .75 del ciclo). */
export function appoggi(c: Camminata, fino = 200): number[] {
  const out: number[] = [];
  const fine = Math.min(c.a, c.da + fino);
  for (let k = 0; ; k++) {
    const t = c.da + (0.25 + k * 0.5) / c.cad;
    if (t > fine) break;
    out.push(t);
  }
  return out;
}

// --------------------------------------------------------------------
//  EVENTI SONORI puntuali (i passi si aggiungono da CAMMINATE).
// --------------------------------------------------------------------
export type TipoSuono = "carta" | "timbro" | "tasto" | "soffio" | "tonfo" | "passo" | "rintocco";
/** `terreno` e `piede` (0 sinistro, 1 destro) servono solo ai passi: ne dicono la materia e il lato. */
export interface Evento { t: number; tipo: TipoSuono; vol?: number; terreno?: Terreno; piede?: 0 | 1 }

const LETTERE_ARRIVI = [0.7, 1.8, 2.9, 4.0];
export const BIGLIETTO = { arriva: 6.7, scrive: 7.25, perCarattere: 0.034, testo: ["NON È IL CASO", "DI TORNARE."] };

function eventiBase(): Evento[] {
  const e: Evento[] = [];
  LETTERE_ARRIVI.forEach((t) => e.push({ t: t + 0.55, tipo: "carta", vol: 0.8 }));
  e.push({ t: BIGLIETTO.arriva + 0.5, tipo: "carta", vol: 1 });
  let n = 0;
  BIGLIETTO.testo.forEach((riga) => {
    for (const ch of riga) { if (ch !== " ") e.push({ t: BIGLIETTO.scrive + n * BIGLIETTO.perCarattere, tipo: "tasto", vol: 0.5 }); n++; }
    n += 4;
  });
  e.push({ t: 17.6, tipo: "soffio", vol: 0.6 });
  e.push({ t: 22.6, tipo: "timbro", vol: 0.7 });
  // la mappa: un rintocco per tappa
  for (let i = 0; i < 7; i++) e.push({ t: TAPPE_T0 + i * TAPPE_PASSO, tipo: "rintocco", vol: 0.45 + i * 0.05 });
  e.push({ t: TAPPE_T0 + 7 * TAPPE_PASSO, tipo: "tonfo", vol: 0.5 });
  // i cinque segni
  for (let i = 0; i < 5; i++) e.push({ t: CINQUE_T0 + i * CINQUE_PASSO, tipo: "rintocco", vol: 0.3 });
  e.push({ t: 64.0, tipo: "tonfo", vol: 1 });                 // il colpo grave del brano è a 63,99: «tuo fratello» entra con lui
  for (let i = 0; i < 5; i++) e.push({ t: 67.8 + i * REGOLA_DUR, tipo: "soffio", vol: 0.55 });
  e.push({ t: 77.0, tipo: "soffio", vol: 0.4 });
  e.push({ t: 82.3, tipo: "tonfo", vol: 0.8 });
  return e;
}

export const TAPPE_T0 = 35.2;     // prima tappa sulla mappa
export const TAPPE_PASSO = 1.72;  // tappa ogni…
export const CINQUE_T0 = 52.3;
export const CINQUE_PASSO = 0.42;
export const REGOLA_DUR = 1.84;

export const EVENTI: Evento[] = (() => {
  const e = eventiBase();
  CAMMINATE.forEach((c) => appoggi(c, 60).forEach((t, i) => e.push({ t, tipo: "passo", vol: c.vol, terreno: c.terreno, piede: (i % 2) as 0 | 1 })));
  return e.sort((a, b) => a.t - b.t);
})();

export const LETTERE = LETTERE_ARRIVI;
