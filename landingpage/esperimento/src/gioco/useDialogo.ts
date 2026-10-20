// ====================================================================
//  I dialoghi modali (guida, taccuino): il fuoco entra, resta dentro e torna.
// --------------------------------------------------------------------
//  Alla comparsa il fuoco passa al dialogo (così il lettore di schermo ne dice
//  il nome); Tab e Maiusc+Tab girano fra i suoi controlli senza uscirne; alla
//  chiusura il fuoco torna dov'era (se quel controllo c'è ancora). Con `onEsc`
//  il tasto Esc chiude il dialogo, dovunque stia il fuoco: l'evento si ferma qui
//  e non arriva alla partita né al trailer.
// ====================================================================
import { useEffect, useRef } from "react";

const FOCALIZZABILI = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useDialogo<T extends HTMLElement>(onEsc?: () => void) {
  const ref = useRef<T>(null);
  const esc = useRef(onEsc);
  esc.current = onEsc;

  useEffect(() => {
    const el = ref.current;
    const prima = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    el?.focus({ preventScroll: true });

    const tasto = (e: KeyboardEvent) => {
      if (!el) return;
      if (e.key === "Escape" && esc.current) { e.preventDefault(); e.stopPropagation(); esc.current(); return; }
      if (e.key !== "Tab") return;
      const dentro = Array.from(el.querySelectorAll<HTMLElement>(FOCALIZZABILI)).filter((x) => x.getClientRects().length > 0);
      if (dentro.length === 0) { e.preventDefault(); return; }
      const primo = dentro[0], ultimo = dentro[dentro.length - 1], attivo = document.activeElement;
      if (!el.contains(attivo) || attivo === el) { e.preventDefault(); (e.shiftKey ? ultimo : primo).focus(); }
      else if (e.shiftKey && attivo === primo) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && attivo === ultimo) { e.preventDefault(); primo.focus(); }
    };
    window.addEventListener("keydown", tasto, true);
    return () => {
      window.removeEventListener("keydown", tasto, true);
      if (prima?.isConnected) prima.focus({ preventScroll: true });
    };
  }, []);

  return ref;
}
