// ====================================================================
//  Ponte con la versione desktop (Electron).
// --------------------------------------------------------------------
//  Il preload di desktop/ espone window.viaggiatoreDesktop. Nel browser non
//  esiste: tutte le funzioni qui ricadono sul comportamento web, così la
//  stessa app gira identica nei due mondi.
// ====================================================================

export interface StatoAggiornamento { stato: "fermo" | "scarico" | "pronto"; versione?: string; percento?: number }

interface PonteDesktop {
  versione: string;
  registro: (livello: "info" | "warn" | "error", testo: string) => void;
  aggiornamento: {
    stato: () => Promise<StatoAggiornamento>;
    quandoCambia: (fn: (s: StatoAggiornamento) => void) => () => void;
    installa: () => void;
  };
  esci: () => void;
  commutaSchermoIntero: () => Promise<boolean>;
  schermoIntero: () => Promise<boolean>;
  esitoAutoverifica: (ok: boolean, dettagli: string) => void;
}

const ponte = (): PonteDesktop | undefined =>
  (window as unknown as { viaggiatoreDesktop?: PonteDesktop }).viaggiatoreDesktop;

/** True dentro l'app desktop. */
export const inDesktop = (): boolean => !!ponte();

/** Chiude l'applicazione (solo desktop). */
export const esciDalGioco = () => ponte()?.esci();

/** Schermo intero: nel desktop è la finestra, nel browser la Fullscreen API. */
export async function commutaSchermoIntero(el: HTMLElement | null): Promise<boolean> {
  const p = ponte();
  if (p) return p.commutaSchermoIntero();
  if (document.fullscreenElement) { await document.exitFullscreen?.().catch(() => {}); return false; }
  await el?.requestFullscreen?.().catch(() => {});
  return !!document.fullscreenElement;
}

export async function statoSchermoIntero(): Promise<boolean> {
  const p = ponte();
  return p ? p.schermoIntero() : !!document.fullscreenElement;
}

/** Riferisce al processo principale l'esito dell'autoverifica (solo desktop). */
export const riferisciAutoverifica = (ok: boolean, dettagli: string) =>
  ponte()?.esitoAutoverifica(ok, dettagli);

/** Una riga nel registro tecnico (solo desktop; nel browser va in console). */
export function annota(livello: "info" | "warn" | "error", testo: string) {
  const p = ponte();
  if (p) p.registro(livello, testo);
  else if (livello !== "info") console[livello === "warn" ? "warn" : "error"](testo);
}

/** Segue l'aggiornamento automatico (solo desktop). Restituisce come smettere. */
export function seguiAggiornamento(fn: (s: StatoAggiornamento) => void): () => void {
  const p = ponte();
  if (!p) return () => {};
  p.aggiornamento.stato().then(fn).catch(() => {});
  return p.aggiornamento.quandoCambia(fn);
}

export const installaAggiornamento = () => ponte()?.aggiornamento.installa();
