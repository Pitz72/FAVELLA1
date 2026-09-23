// ====================================================================
//  La versione di questa build (vedi sviluppo/VERSIONI.md).
//  gioco: SemVer del gioco · motore: FAVELLA · formatoSalvataggi: intero
//  che cresce a ogni cambiamento incompatibile dei file di salvataggio.
// ====================================================================
export const VERSIONE = __VERSIONE__;

/** «1.2.0» · con il commit per chi deve riconoscere una build precisa. */
export const etichettaVersione = (conCommit = false) =>
  conCommit ? `${VERSIONE.gioco} · ${VERSIONE.commit}` : VERSIONE.gioco;
