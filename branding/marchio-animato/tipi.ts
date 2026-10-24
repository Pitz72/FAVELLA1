// Il contratto che l'orologio dell'animazione (Loghi.tsx, nel gioco "Il
// Relitto") chiama su ogni logo: prima `prepara()` a caratteri caricati, poi
// `aggiorna(t)` a ogni frame, con t in secondi. Nell'originale questo tipo
// vive in LogoRuntime.tsx; qui è isolato per rendere la cartella autoportante.
export interface Animabile {
  prepara(): void;
  aggiorna(t: number): void;
}
