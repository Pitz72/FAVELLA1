// ====================================================================
//  Ponte con la versione desktop (Electron).
// --------------------------------------------------------------------
//  Il preload di desktop/ espone window.viaggiatoreDesktop. Nel browser non
//  esiste: tutte le funzioni qui ricadono sul comportamento web, così la
//  stessa app gira identica nei due mondi.
// ====================================================================

interface PonteDesktop {
  versione: string;
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
