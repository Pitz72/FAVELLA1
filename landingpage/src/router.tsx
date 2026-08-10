// ====================================================================
//  FAVELLA 1 — Router in "history mode" (URL puliti, senza #)
// --------------------------------------------------------------------
//  Sostituisce il vecchio hash-routing (favella.eu/#/progetto) con
//  indirizzi reali (favella.eu/progetto). Niente librerie: usiamo
//  history.pushState + popstate. Ogni navigazione applica i metadati
//  SEO della pagina (vedi seo.ts) e riporta lo scroll in cima.
// ====================================================================
import React, { useState, useEffect, useCallback } from "react";
import { applySeo, ROUTE_PATHS, type RoutePath } from "./seo";

const NAV_EVENT = "favella:navigate";

// Espone l'elenco canonico delle rotte al pre-rendering headless (single source
// of truth: ROUTE_PATHS in seo.ts), così lo script di build non lo duplica.
if (typeof window !== "undefined") {
  (window as unknown as { __ROUTES__?: readonly string[] }).__ROUTES__ = ROUTE_PATHS;
}

/** Pathname normalizzato (senza slash finale, default "/"). */
export function currentPath(): RoutePath {
  if (typeof window === "undefined") return "/";
  let p = window.location.pathname || "/";
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return (ROUTE_PATHS as readonly string[]).includes(p) ? (p as RoutePath) : "/";
}

/** Naviga a una rotta interna senza ricaricare la pagina. */
export function navigate(to: string): void {
  const path = to.startsWith("/") ? to : `/${to}`;
  if (path !== window.location.pathname) {
    window.history.pushState({}, "", path);
  }
  window.dispatchEvent(new Event(NAV_EVENT));
  window.scrollTo(0, 0);
}

/** Hook: restituisce la rotta corrente e applica i metadati SEO a ogni cambio. */
export function useRoute(): RoutePath {
  const [path, setPath] = useState<RoutePath>(() => currentPath());

  useEffect(() => {
    const update = () => setPath(currentPath());
    window.addEventListener("popstate", update);
    window.addEventListener(NAV_EVENT, update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener(NAV_EVENT, update);
    };
  }, []);

  useEffect(() => {
    applySeo(path);
  }, [path]);

  return path;
}

type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
};

/**
 * Ancora interna: rende un vero <a href> (buono per SEO e per il
 * ctrl/cmd-click che apre in nuova scheda) ma intercetta il click sinistro
 * semplice per navigare senza reload.
 */
export function Link({ to, children, onClick, ...rest }: LinkProps) {
  const handle = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e);
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      e.preventDefault();
      navigate(to);
    },
    [to, onClick]
  );

  return (
    <a href={to} onClick={handle} {...rest}>
      {children}
    </a>
  );
}
