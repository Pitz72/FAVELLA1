import { useEffect, useRef, useState } from "react";

// Piccoli strumenti condivisi dal design 2026 del sito.

/** True quando la pagina è aperta dal pre-render (Chromium headless): lì le
 *  animazioni d'ingresso non devono nascondere nulla, perché l'HTML salvato è
 *  quello che leggono i crawler. */
export const isPrerender = (): boolean => typeof navigator !== "undefined" && navigator.webdriver === true;

/** True se la persona ha chiesto meno movimento al sistema operativo. */
export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** True se le animazioni vanno saltate (pre-render o movimento ridotto). */
export const skipMotion = (): boolean => isPrerender() || prefersReducedMotion();

/** Diventa true la prima volta che l'elemento entra nello schermo. */
export function useInView<T extends HTMLElement>(margin = "0px 0px -8% 0px"): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState<boolean>(() => typeof window === "undefined" || skipMotion());
  useEffect(() => {
    if (seen) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: margin, threshold: 0.06 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, margin]);
  return [ref, seen];
}
