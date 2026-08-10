import {
  GITHUB_URL,
  GITHUB_DISCUSSIONS_URL,
  GITHUB_SITO_URL,
  GITHUB_IDE_URL,
  GITHUB_MANUALE_URL,
  GITHUB_ESEMPI_URL,
  GITHUB_BRANDING_URL,
  TELEGRAM_URL,
  TELEGRAM_HANDLE,
  AUTHOR_EMAIL,
  AUTHOR_NAME,
  FACEBOOK_GROUP_URL,
} from "../constants";

// Le cartelle del repository, per chi arriva e non sa da dove cominciare.
const CARTELLE = [
  {
    path: "/",
    title: "Il motore",
    body: "Compilatore, interprete, libreria delle azioni e i 681 test che li tengono onesti. Python e nient'altro: l'unica dipendenza è Lark.",
    href: GITHUB_URL,
  },
  {
    path: "/landingpage",
    title: "Questo sito",
    body: "Il sorgente completo di favella.eu: React, Vite, il corso interattivo e il motore vero che gira nel browser via Pyodide.",
    href: GITHUB_SITO_URL,
  },
  {
    path: "/studio",
    title: "Favella Studio",
    body: "L'IDE desktop, fermo alla 0.9 e senza nessuno che lo mantenga. Aperto con licenza MIT proprio perché qualcuno possa riprenderlo.",
    href: GITHUB_IDE_URL,
  },
  {
    path: "/documentazione/manuale",
    title: "Il manuale",
    body: "Sorgenti Typst dei 21 capitoli, i font e l'ebook PDF pronto da scaricare. Si ricompila con un comando.",
    href: GITHUB_MANUALE_URL,
  },
  {
    path: "/esempi",
    title: "Le avventure",
    body: "Le storie ufficiali e gli stress-test di genere: guida, sopravvivenza, gioco di ruolo, appuntamenti. Tutte vincibili.",
    href: GITHUB_ESEMPI_URL,
  },
  {
    path: "/branding",
    title: "Il marchio",
    body: "Logo, banner, icone e favicon. Ci sono anche i master a piena risoluzione, non soltanto le versioni compresse che usa il sito.",
    href: GITHUB_BRANDING_URL,
  },
];

const WAYS = [
  { n: "01", title: "Testa il linguaggio", body: "Scrivi storie, rompi il parser, segnala gli attriti: ogni frizione è una possibile parola nuova." },
  { n: "02", title: "Scrivi avventure", body: "Porta una tua storia nella galleria: in italiano, giocabile, condivisa con un link." },
  { n: "03", title: "Migliora i tool", body: "Playground, CLI, collaudatore, documentazione: c'è spazio per ogni tipo di contributo." },
  { n: "04", title: "Proponi idee", body: "Il linguaggio è chiuso, ma l'ecosistema cresce: idee, moduli, pattern sono benvenuti." },
];

const CONTACTS = [
  { kind: "repository", label: "GitHub · Pitz72/FAVELLA1", href: GITHUB_URL },
  { kind: "discuti", label: "Discussions & Issues", href: GITHUB_DISCUSSIONS_URL },
  { kind: "telegram", label: TELEGRAM_HANDLE, href: TELEGRAM_URL },
  { kind: "scrivi a", label: AUTHOR_NAME, href: `mailto:${AUTHOR_EMAIL}` },
  { kind: "community", label: "Gruppo Facebook", href: FACEBOOK_GROUP_URL },
];

const CollaboratePage = () => (
  <section className="bg-[radial-gradient(110%_60%_at_50%_0%,rgba(52,211,153,0.06),transparent_55%)] px-6 pb-28 pt-[74px]">
    {/* Intro */}
    <div className="mx-auto max-w-[820px] text-center">
      <div className="mb-6 flex justify-center">
        <span className="animate-flame-flicker text-[30px] text-favella-amber">✦</span>
      </div>
      <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.26em] text-favella-emerald">Collabora</p>
      <h1 className="mb-6 font-serif text-[clamp(36px,5.4vw,62px)] font-medium leading-[1.08] tracking-[-0.02em] text-favella-text-primary">
        Un progetto aperto,<br />in cerca di <span className="italic text-ink-accent">compagni</span>.
      </h1>
      <p className="mx-auto max-w-[680px] font-serif text-[20px] leading-[1.62] text-favella-text-secondary">
        FAVELLA 1 è interamente pubblico su GitHub: codice, grammatica, documentazione ed esempi. Se l'idea ti
        accende, ci sarebbe tanto da fare.
      </p>
    </div>

    {/* Modi per contribuire */}
    <div className="mx-auto mt-[54px] grid max-w-[1000px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {WAYS.map((w) => (
        <div key={w.n} className="rounded-2xl border border-favella-cyan/12 bg-gradient-to-b from-favella-surface/50 to-favella-panel/30 p-6">
          <div className="mb-2.5 font-mono text-[12px] text-favella-cyan">{w.n}</div>
          <h3 className="mb-2 font-display text-[17px] font-semibold text-favella-text-primary">{w.title}</h3>
          <p className="m-0 text-[14px] leading-[1.6] text-favella-text-secondary">{w.body}</p>
        </div>
      ))}
    </div>

    {/* Dove sta cosa nel repository */}
    <div className="mx-auto mt-[54px] max-w-[1000px]">
      <p className="mb-2 text-center font-mono text-[11px] uppercase tracking-[0.24em] text-favella-emerald">
        Dove sta cosa
      </p>
      <p className="mx-auto mb-7 max-w-[640px] text-center text-[15px] leading-[1.6] text-favella-text-secondary">
        Motore, sito, IDE, manuale, avventure, marchio: dall'agosto 2026 stanno tutti nello stesso
        repository. Prima erano sparsi fra tre posti diversi, e qualcuno non era pubblico affatto.
      </p>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {CARTELLE.map((c) => (
          <a
            key={c.path}
            href={c.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-[13px] border border-favella-cyan/16 bg-favella-panel p-5 transition-colors hover:border-favella-cyan/40"
          >
            <div className="mb-1.5 font-mono text-[11px] text-favella-cyan">{c.path}</div>
            <div className="mb-1.5 font-display text-[15px] font-semibold text-favella-text-primary">{c.title}</div>
            <p className="m-0 text-[13.5px] leading-[1.55] text-favella-text-secondary">{c.body}</p>
          </a>
        ))}
      </div>
    </div>

    {/* Appello maintainer */}
    <div className="mx-auto mt-10 max-w-[820px] rounded-[20px] border border-favella-amber/20 bg-gradient-to-b from-[rgba(40,30,12,0.35)] to-[rgba(20,15,8,0.2)] px-9 py-10 text-center">
      <p className="m-0 font-serif text-[19px] leading-[1.6] text-favella-text-primary">
        E se qualcuno volesse <strong className="font-semibold text-favella-cyan">dare una mano sul serio</strong> — o
        addirittura <strong className="font-semibold text-favella-emerald">prendere in carico il progetto</strong> e
        portarlo avanti — sarebbe la cosa più bella che possa capitargli.
      </p>
    </div>

    {/* Contatti */}
    <div className="mx-auto mt-[46px] max-w-[820px]">
      <p className="mb-5 text-center font-mono text-[11px] uppercase tracking-[0.24em] text-favella-emerald">
        Mettiti in contatto
      </p>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {CONTACTS.map((c) => (
          <a
            key={c.kind}
            href={c.href}
            target={c.href.startsWith("mailto:") ? undefined : "_blank"}
            rel={c.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
            className="block rounded-[13px] border border-favella-cyan/16 bg-favella-panel p-5 transition-colors hover:border-favella-cyan/40"
          >
            <div className="mb-1.5 font-mono text-[11px] text-favella-text-muted">{c.kind}</div>
            <div className="font-display text-[15px] font-semibold text-favella-text-primary">{c.label}</div>
          </a>
        ))}
      </div>
      <div className="mt-9 text-center">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-xl bg-brand-gradient px-8 py-[15px] font-display text-[15px] font-bold text-favella-void shadow-[0_16px_44px_-16px_rgba(34,211,238,0.6)] transition-transform duration-300 hover:-translate-y-0.5"
        >
          Apri il repository
        </a>
      </div>
    </div>
  </section>
);

export default CollaboratePage;
