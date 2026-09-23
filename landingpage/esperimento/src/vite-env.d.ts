/// <reference types="vite/client" />

/** Identità della build, iniettata da vite.config.ts (vedi sviluppo/VERSIONI.md). */
declare const __VERSIONE__: {
  gioco: string;
  motore: string;
  formatoSalvataggi: number;
  commit: string;
  data: string;
};
