// ====================================================================
//  FAVELLA 1 — SEO per-pagina (sorgente unica)
// --------------------------------------------------------------------
//  Qui vivono titolo, descrizione, anteprima Open Graph e dati
//  strutturati (JSON-LD) di OGNI pagina. La funzione `applySeo()` scrive
//  questi valori nel <head> con logica "trova-o-crea": non duplica i tag,
//  aggiorna quelli esistenti. Gira sia a runtime (la tab cambia titolo
//  navigando) sia durante il pre-rendering headless: Puppeteer fotografa
//  l'<head> già popolato, quindi ogni file HTML statico nasce con i suoi
//  metadati corretti senza bisogno di iniezioni lato Node.
// ====================================================================

// Host CANONICO = quello che Aruba serve davvero: forza il www (favella.eu → 301
// → www.favella.eu). Allineiamo canonical/OG al www per coerenza SEO, senza dover
// toccare il pannello Aruba. Chi digita favella.eu arriva comunque (redirect).
export const SITE_URL = "https://www.favella.eu";
export const SITE_NAME = "FAVELLA 1";

export interface SeoEntry {
  /** Titolo della scheda/tab e og:title */
  title: string;
  /** Meta description e og:description */
  description: string;
  /** Anteprima social, percorso assoluto-dal-sito, es. "/og/progetto.png" */
  og: string;
  /** og:type (website | article) */
  type: "website" | "article";
}

// Ordine canonico delle rotte del sito (usato anche da sitemap e prerender).
export const ROUTE_PATHS = [
  "/",
  "/progetto",
  "/aggiornamenti",
  "/manuale",
  "/corso",
  "/programma",
  "/galleria",
  "/libreria",
  "/download",
  "/collabora",
  "/privacy",
  "/cookie",
] as const;

export type RoutePath = (typeof ROUTE_PATHS)[number];

export const SEO_BY_PATH: Record<RoutePath, SeoEntry> = {
  "/": {
    title: "FAVELLA 1 — Scrivi storie, non codice",
    description:
      "FAVELLA 1 è un linguaggio di programmazione open-source in cui l'italiano È il codice: scrivi avventure testuali con frasi in italiano. Versione 1.0.0, il linguaggio è completo. Parser LALR(1), 681 test.",
    og: "/og/home.png",
    type: "website",
  },
  "/progetto": {
    title: "Il progetto — FAVELLA 1",
    description:
      "La visione dietro FAVELLA 1: un linguaggio in cui l'italiano è il codice. Ingegneria vera — parser LALR(1) a zero ambiguità, 681 test — al servizio della narrativa interattiva.",
    og: "/og/progetto.png",
    type: "article",
  },
  "/aggiornamenti": {
    title: "Novità e roadmap — FAVELLA 1",
    description:
      "Le ultime novità di FAVELLA 1, il changelog e la roadmap: dalla v1.0.0 (linguaggio completo) all'ecosistema con pacchetto pip, libreria di moduli e galleria di storie.",
    og: "/og/aggiornamenti.png",
    type: "website",
  },
  "/manuale": {
    title: "Guida rapida — FAVELLA 1",
    description:
      "Impara a scrivere avventure testuali in italiano con FAVELLA 1: stanze, oggetti, regole «Invece di», stati, casualità e mondo dinamico. La guida rapida completa al linguaggio.",
    og: "/og/manuale.png",
    type: "article",
  },
  "/corso": {
    title: "Corso interattivo — FAVELLA 1",
    description:
      "Il corso su cassetta di FAVELLA 1: 21 lezioni interattive per imparare a programmare storie in italiano, dal primo saluto al mondo che cambia. Si gioca direttamente nel browser.",
    og: "/og/corso.png",
    type: "article",
  },
  "/programma": {
    title: "Programma nel browser — FAVELLA 1",
    description:
      "Scrivi ed esegui storie FAVELLA 1 direttamente nel browser, senza installare nulla: l'editor e il motore completo girano in locale grazie a Pyodide.",
    og: "/og/programma.png",
    type: "website",
  },
  "/galleria": {
    title: "Galleria di storie — FAVELLA 1",
    description:
      "Gioca le avventure testuali scritte in FAVELLA 1 direttamente nel browser: storie ufficiali e stress-test di genere, tutte vincibili dall'inizio alla fine.",
    og: "/og/galleria.png",
    type: "website",
  },
  "/libreria": {
    title: "Libreria di moduli — FAVELLA 1",
    description:
      "Moduli .fav pronti da includere nelle tue storie: sinonimi, proprietà e verbi riutilizzabili per scrivere più in fretta con FAVELLA 1.",
    og: "/og/libreria.png",
    type: "website",
  },
  "/download": {
    title: "Download — FAVELLA 1",
    description:
      "Tutto quello che puoi scaricare di FAVELLA 1 in un posto solo: il pacchetto Python (pip install favella1), le app desktop per Windows, macOS e Linux, e il Manuale di Programmazione in PDF.",
    og: "/og/download.png",
    type: "website",
  },
  "/collabora": {
    title: "Collabora — FAVELLA 1",
    description:
      "FAVELLA 1 è open-source e aperto ai contributi: codice, storie, segnalazioni e idee. Scopri come dare una mano al linguaggio in cui l'italiano è il codice.",
    og: "/og/collabora.png",
    type: "article",
  },
  "/privacy": {
    title: "Privacy — FAVELLA 1",
    description:
      "Informativa sulla privacy di favella.eu: nessun cookie di profilazione, nessun tracciamento, font ospitati in proprio. Diritti dell'interessato ai sensi del GDPR.",
    og: "/og/home.png",
    type: "article",
  },
  "/cookie": {
    title: "Informativa sui cookie — FAVELLA 1",
    description:
      "Cookie policy di favella.eu: il sito non usa cookie di profilazione né strumenti di tracciamento. Solo storage tecnico, secondo le linee guida del Garante.",
    og: "/og/home.png",
    type: "article",
  },
};

export function seoFor(path: string): SeoEntry {
  return SEO_BY_PATH[path as RoutePath] ?? SEO_BY_PATH["/"];
}

/** URL canonico assoluto per una rotta. */
export function canonicalUrl(path: string): string {
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

// --------------------------------------------------------------------
//  Manipolazione del <head> — trova-o-crea (niente duplicati)
// --------------------------------------------------------------------
function setMeta(attr: "name" | "property", key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/** Dati strutturati specifici di pagina (oltre al WebSite globale in index.html). */
function jsonLdFor(path: string, entry: SeoEntry, url: string): object {
  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      ...(path === "/"
        ? []
        : [{ "@type": "ListItem", position: 2, name: entry.title.split(" — ")[0], item: url }]),
    ],
  };

  if (path === "/corso") {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Course",
          name: "Corso interattivo di FAVELLA 1",
          description: entry.description,
          url,
          inLanguage: "it",
          provider: { "@type": "Organization", name: SITE_NAME, url: `${SITE_URL}/` },
          isAccessibleForFree: true,
        },
        breadcrumb,
      ],
    };
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: entry.title,
        description: entry.description,
        url,
        inLanguage: "it",
        isPartOf: { "@type": "WebSite", name: SITE_NAME, url: `${SITE_URL}/` },
        primaryImageOfPage: `${SITE_URL}${entry.og}`,
      },
      breadcrumb,
    ],
  };
}

function setJsonLd(data: object) {
  let el = document.getElementById("ld-page") as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = "ld-page";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/**
 * Applica i metadati della rotta corrente al documento. Idempotente: chiamabile
 * a ogni navigazione SPA. Espone anche `window.__SEO__` come segnale di "pagina
 * pronta" per il pre-rendering headless.
 */
export function applySeo(path: string): void {
  if (typeof document === "undefined") return;
  const entry = seoFor(path);
  const url = canonicalUrl(path);
  const image = `${SITE_URL}${entry.og}`;

  document.title = entry.title;
  setMeta("name", "description", entry.description);
  setLink("canonical", url);

  setMeta("property", "og:type", entry.type);
  setMeta("property", "og:url", url);
  setMeta("property", "og:title", entry.title);
  setMeta("property", "og:description", entry.description);
  setMeta("property", "og:image", image);
  setMeta("property", "og:image:width", "1200");
  setMeta("property", "og:image:height", "630");
  setMeta("property", "og:image:alt", entry.title);
  setMeta("property", "og:site_name", SITE_NAME);
  setMeta("property", "og:locale", "it_IT");

  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", entry.title);
  setMeta("name", "twitter:description", entry.description);
  setMeta("name", "twitter:image", image);

  setJsonLd(jsonLdFor(path, entry, url));

  (window as unknown as { __SEO__?: object }).__SEO__ = { path, ...entry, url, image };
}
