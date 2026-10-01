import { Btn, Eyebrow, Ink, PageHero, Reveal, SectionHead, Spot } from "../ui/primitives";
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
  STATS_NUMERI,
  STUDIO_VERSION,
  VERSION,
} from "../constants";

// Le cartelle del repository, per chi arriva e non sa da dove cominciare.
const CARTELLE = [
  {
    path: "/",
    title: "Il motore",
    body: `Compilatore, interprete, libreria delle azioni e i ${STATS_NUMERI.test} test che li tengono onesti. Python e nient'altro: l'unica dipendenza è Lark.`,
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
    body: `L'ambiente di scrittura visuale, versione ${STUDIO_VERSION}: Windows e Linux (su Mac si costruisce da sé), con licenza MIT.`,
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
  { n: "01", title: "Scrivi avventure", body: "Il linguaggio è completo e stabile: ciò che scrivi oggi funzionerà uguale fra dieci anni. Scrivi storie in italiano e condividile con un link." },
  { n: "02", title: "Studia il codice", body: "Un compilatore a due passate con parser LALR(1) non ambiguo, in Python e nient'altro: un riferimento per chi vuole costruire un linguaggio." },
  { n: "03", title: "Riprendi il lavoro", body: "Licenza MIT: forka, estendi, traduci. Un'altra lingua, un altro motore, un'altra idea: il repository è a disposizione." },
  { n: "04", title: "Raccontaci cosa ne hai fatto", body: "Non servono permessi: se scrivi qualcosa con FAVELLA, ci fa piacere saperlo. I contatti sono qui sotto." },
];

const CONTACTS = [
  { kind: "repository", label: "GitHub · Pitz72/FAVELLA1", href: GITHUB_URL },
  { kind: "discuti", label: "Discussions e Issues", href: GITHUB_DISCUSSIONS_URL },
  { kind: "telegram", label: TELEGRAM_HANDLE, href: TELEGRAM_URL },
  { kind: "scrivi a", label: AUTHOR_NAME, href: `mailto:${AUTHOR_EMAIL}` },
  { kind: "community", label: "Gruppo Facebook", href: FACEBOOK_GROUP_URL },
];

const CollaboratePage = () => (
  <>
    <PageHero
      tone="emerald"
      eyebrow="Collabora"
      title={
        <>
          Un progetto concluso, aperto a <Ink>chiunque.</Ink>
        </>
      }
      lead={`FAVELLA 1 è finito: la ${VERSION} è la versione definitiva e non verrà più modificata. Ma è interamente pubblico su GitHub, con licenza MIT: codice, grammatica, documentazione, esempi e Favella Studio. Se l'idea ti accende, prendila: leggila, imparaci, portala dove vuoi.`}
    >
      <Btn href={GITHUB_URL} size="lg">
        Apri il repository
      </Btn>
    </PageHero>

    {/* Modi per contribuire */}
    <section className="px-6 pb-20">
      <div className="mx-auto grid max-w-[1180px] gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {WAYS.map((w, i) => (
          <Reveal key={w.n} delay={i * 80}>
            <Spot className="h-full p-7">
              <div className="mb-4 font-display text-[44px] font-bold leading-none tracking-[-0.05em] text-ink-accent">{w.n}</div>
              <h3 className="mb-2 font-display text-[19px] font-bold tracking-[-0.02em] text-favella-text-primary">{w.title}</h3>
              <p className="m-0 text-[14.5px] leading-[1.65] text-favella-text-secondary">{w.body}</p>
            </Spot>
          </Reveal>
        ))}
      </div>
    </section>

    {/* Dove sta cosa nel repository */}
    <section className="px-6 pb-20">
      <div className="mx-auto max-w-[1180px]">
        <SectionHead
          eyebrow="Dove sta cosa"
          title={
            <>
              Un repository, <Ink>tutto dentro.</Ink>
            </>
          }
          lead="Motore, sito, Studio, manuale, avventure, marchio: dall'agosto 2026 stanno tutti nello stesso repository. Prima erano sparsi fra tre posti diversi, e qualcuno non era pubblico affatto."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CARTELLE.map((c, i) => (
            <Reveal key={c.path} delay={(i % 3) * 70}>
              <Spot as="a" href={c.href} target="_blank" rel="noopener noreferrer" className="group block h-full p-6">
                <div className="mb-2 font-mono text-[12px] text-favella-cyan">{c.path}</div>
                <div className="mb-2 flex items-center justify-between font-display text-[18px] font-bold tracking-[-0.02em] text-favella-text-primary">
                  {c.title}
                  <span className="text-favella-text-muted transition-transform group-hover:translate-x-1 group-hover:text-favella-cyan">↗</span>
                </div>
                <p className="m-0 text-[14px] leading-[1.6] text-favella-text-secondary">{c.body}</p>
              </Spot>
            </Reveal>
          ))}
        </div>
      </div>
    </section>

    {/* Appello maintainer */}
    <section className="px-6 pb-20">
      <Reveal>
        <div className="mx-auto max-w-[900px] rounded-[32px] border border-favella-amber/25 bg-[radial-gradient(80%_120%_at_50%_0%,rgba(245,158,11,0.13),transparent_60%),linear-gradient(180deg,#14100a,#0a0806)] px-8 py-12 text-center md:px-14">
          <p className="m-0 font-serif text-[clamp(19px,2.2vw,24px)] leading-[1.6] text-favella-text-primary">
            E se qualcuno volesse <strong className="font-semibold text-favella-cyan">dare una mano sul serio</strong> — o addirittura{" "}
            <strong className="font-semibold text-favella-emerald">prendere in carico il progetto</strong> e portarlo avanti — sarebbe la cosa più bella che possa capitargli.
          </p>
        </div>
      </Reveal>
    </section>

    {/* Contatti */}
    <section className="px-6 pb-8">
      <div className="mx-auto max-w-[1180px]">
        <Eyebrow tone="emerald" className="mb-6">
          Mettiti in contatto
        </Eyebrow>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {CONTACTS.map((c) => (
            <Spot
              as="a"
              key={c.kind}
              href={c.href}
              target={c.href.startsWith("mailto:") ? undefined : "_blank"}
              rel={c.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
              className="block p-5"
            >
              <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-favella-text-muted">{c.kind}</div>
              <div className="font-display text-[15px] font-semibold text-favella-text-primary">{c.label}</div>
            </Spot>
          ))}
        </div>
      </div>
    </section>
  </>
);

export default CollaboratePage;
