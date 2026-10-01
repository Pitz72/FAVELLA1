import React from "react";
import ManualBanner from "../components/ManualBanner";
import LivingBook, { evidenzia } from "../ui/LivingBook";
import { Btn, Counter, Eyebrow, GlyphField, Ink, Marquee, Pill, Reveal, SectionHead, Spot } from "../ui/primitives";
import { Link } from "../router";
import { GALLERY_STORIES } from "../data/course";
import {
  ENGINE_VERSION,
  GITHUB_URL,
  PYPI_URL,
  STATS_NUMERI,
  STUDIO_VERSION,
  MANUAL_PDF_PAGES,
} from "../constants";

// ──────────────────────────────────────────────────────────────────────
//  Home — design 2026. Una testata che si scrive da sola, strisce di frasi,
//  tre mosse, un mosaico di ciò che c'è, il libro, la galleria, i numeri.
// ──────────────────────────────────────────────────────────────────────

const FRASI = [
  "La biblioteca è una stanza.",
  "La spada antica è prendibile.",
  'Invece di prendi la statua: dire "È troppo pesante.".',
  "La cantina è buia.",
  "La torcia illumina.",
  "Il gatto è un personaggio.",
  "Il giocatore comincia in cucina.",
  'Al turno 3: dire "Qualcuno ti osserva da lontano.".',
  "La forza parte da 3.",
  "La porta di ferro è chiusa.",
  "Il tavolo è un supporto.",
  'Quando la tensione è almeno 8: dire "Il portale ti risucchia." e adesso perdi.',
];

const Frase = ({ s }: { s: string }) => (
  <span className="whitespace-nowrap rounded-full border border-favella-cyan/12 bg-favella-panel/60 px-5 py-2.5 font-mono text-[13.5px] text-favella-text-primary">
    {evidenzia(s)}
  </span>
);

const Passo = ({ n, titolo, testo, children }: { n: string; titolo: string; testo: string; children: React.ReactNode }) => (
  <Spot className="flex h-full flex-col p-7 md:p-8">
    <div className="mb-6 flex items-baseline gap-4">
      <span className="font-display text-[56px] font-bold leading-none tracking-[-0.05em] text-ink-accent">{n}</span>
      <h3 className="font-display text-[22px] font-bold tracking-[-0.025em] text-favella-text-primary">{titolo}</h3>
    </div>
    <p className="mb-6 font-serif text-[16.5px] leading-[1.65] text-favella-text-secondary">{testo}</p>
    <div className="mt-auto rounded-2xl border border-favella-cyan/10 bg-favella-void/60 p-4 font-mono text-[12.5px] leading-[1.9]">{children}</div>
  </Spot>
);

const Token = ({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "cyan" | "amber" | "emerald" }) => {
  const cls = {
    plain: "border-white/10 text-favella-text-primary",
    cyan: "border-favella-cyan/40 text-favella-cyan bg-favella-cyan/8",
    amber: "border-favella-amber/45 text-favella-amber bg-favella-amber/8",
    emerald: "border-favella-emerald/40 text-favella-emerald bg-favella-emerald/8",
  }[tone];
  return <span className={`inline-block rounded-md border px-2 py-0.5 ${cls}`}>{children}</span>;
};

const Home = () => {
  const copertine = GALLERY_STORIES.filter((g) => g.cover);
  return (
    <>
      {/* ═════════ TESTATA ═════════ */}
      <section className="hero-aurora relative overflow-hidden px-6 pb-24 pt-36 md:pt-44">
        <div aria-hidden="true" className="grid-lines absolute inset-0" />
        <GlyphField />
        <div className="relative mx-auto max-w-[1240px]">
          <Reveal>
            <Pill tone="emerald">FAVELLA 1 · {ENGINE_VERSION} · la versione definitiva</Pill>
          </Reveal>
          <Reveal delay={90}>
            <h1 className="mt-8 font-display text-[clamp(52px,10.4vw,164px)] font-bold leading-[0.9] tracking-[-0.06em] text-favella-text-primary">
              Il tuo codice
              <br />
              è una <Ink>storia.</Ink>
            </h1>
          </Reveal>

          <div className="mt-14 grid items-start gap-14 lg:mt-10 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="lg:pt-10">
              <Reveal delay={180}>
                <p className="max-w-[560px] font-serif text-[clamp(19px,1.9vw,23px)] leading-[1.6] text-favella-text-secondary">
                  <strong className="font-semibold text-favella-text-primary">FAVELLA 1</strong> è il linguaggio in cui l'italiano{" "}
                  <em className="not-italic text-favella-cyan">è</em> il codice. Descrivi un mondo con frasi normali e diventa
                  un'avventura testuale che si gioca.
                </p>
              </Reveal>
              <Reveal delay={270}>
                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <Btn to="/programma" size="lg">
                    Provala nel browser <span aria-hidden="true">→</span>
                  </Btn>
                  <Btn to="/studio" variant="ghost" size="lg">
                    Scopri Favella Studio
                  </Btn>
                </div>
                <p className="mt-7 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11.5px] uppercase tracking-[0.16em] text-favella-text-muted">
                  <span>Nessuna installazione</span>
                  <span>·</span>
                  <span>Windows · macOS · Linux</span>
                  <span>·</span>
                  <span>Licenza MIT</span>
                </p>
              </Reveal>
            </div>
            <Reveal delay={200} y={44}>
              <LivingBook />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═════════ STRISCE DI FRASI ═════════ */}
      <section aria-label="Alcune frasi di FAVELLA" className="relative space-y-4 py-6">
        <Marquee duration={70}>
          {FRASI.map((f) => (
            <Frase key={f} s={f} />
          ))}
        </Marquee>
        <Marquee duration={85} reverse>
          {[...FRASI].reverse().map((f) => (
            <Frase key={f} s={f} />
          ))}
        </Marquee>
      </section>

      {/* ═════════ TRE MOSSE ═════════ */}
      <section className="relative px-6 py-28">
        <div className="mx-auto max-w-[1240px]">
          <SectionHead
            eyebrow="Come funziona"
            title={
              <>
                Tre mosse, <Ink>nessuna sintassi da imparare.</Ink>
              </>
            }
            lead="Se sai descrivere una scena, sai programmarla. Il resto lo fa il motore."
          />
          <div className="grid gap-5 md:grid-cols-3">
            <Reveal>
              <Passo n="01" titolo="Scrivi" testo="Frasi normali, col punto in fondo. Niente graffe da bilanciare, niente punti e virgola da ricordare.">
                <div>{evidenzia("La cucina è una stanza.")}</div>
                <div>{evidenzia("Il tavolo è nella cucina.")}</div>
              </Passo>
            </Reveal>
            <Reveal delay={110}>
              <Passo n="02" titolo="Il motore capisce" testo="Un compilatore vero, non un trucco di espressioni regolari: i nomi diventano simboli e la grammatica non è mai ambigua.">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Token tone="cyan">La cucina</Token>
                  <Token tone="amber">è una stanza</Token>
                  <Token>.</Token>
                </div>
                <div className="mt-1.5 text-favella-text-muted">→ nasce una stanza nel mondo</div>
              </Passo>
            </Reveal>
            <Reveal delay={220}>
              <Passo n="03" titolo="Gioca" testo="La stessa storia gira nel terminale, nel browser, in Favella Studio o in una pagina web tutta tua da regalare.">
                <div className="text-favella-text-muted">› guarda</div>
                <div className="text-favella-cyan">La cucina</div>
                <div className="text-favella-text-secondary">Puoi vedere qui: un tavolo.</div>
              </Passo>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═════════ MOSAICO ═════════ */}
      <section className="relative px-6 pb-28">
        <div className="mx-auto max-w-[1240px]">
          <SectionHead
            eyebrow="Tutto ciò che c'è"
            tone="emerald"
            title={
              <>
                Un linguaggio, <Ink>e tutto intorno.</Ink>
              </>
            }
            lead="Un ambiente di scrittura, un corso che compila davvero, una galleria di avventure, un manuale. Tutto gratuito, tutto aperto."
          />
          <div className="grid auto-rows-[minmax(210px,auto)] gap-5 md:grid-cols-12">
            {/* Studio */}
            <Reveal className="md:col-span-7 md:row-span-2">
              <Spot as={Link} to="/studio" className="group flex h-full flex-col overflow-hidden p-8 md:p-10">
                <Eyebrow tone="emerald" className="mb-4">
                  Nuovo · versione {STUDIO_VERSION}
                </Eyebrow>
                <h3 className="font-display text-[clamp(28px,3.2vw,42px)] font-bold leading-[1.04] tracking-[-0.035em] text-favella-text-primary">
                  Favella <Ink>Studio</Ink>: scrivi senza perderti.
                </h3>
                <p className="mt-4 max-w-[520px] font-serif text-[16.5px] leading-[1.65] text-favella-text-secondary">
                  Il testo, le stanze su una mappa da trascinare, gli oggetti, i personaggi, le regole e la prova della storia, in
                  un'app sola. Ogni gesto si scrive nel testo.
                </p>
                <div className="relative mt-8 flex-1 overflow-hidden rounded-t-2xl border border-b-0 border-favella-cyan/20 shadow-[0_-20px_80px_-30px_rgba(34,211,238,0.35)]">
                  <img
                    src="/studio/mappa.webp"
                    alt="La mappa delle stanze in Favella Studio"
                    width={1600}
                    height={1000}
                    loading="lazy"
                    className="w-full translate-y-1 transition-transform duration-700 group-hover:-translate-y-2 group-hover:scale-[1.02]"
                  />
                </div>
              </Spot>
            </Reveal>

            {/* Corso */}
            <Reveal delay={80} className="md:col-span-5">
              <Spot as={Link} to="/corso" className="group flex h-full flex-col p-8">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex gap-2">
                    <span className="reel-spin h-6 w-6 rounded-full border-[3px] border-favella-amber/70 border-t-transparent" />
                    <span className="reel-spin h-6 w-6 rounded-full border-[3px] border-favella-amber/70 border-t-transparent" />
                  </span>
                  <Eyebrow tone="amber">Il corso</Eyebrow>
                </div>
                <h3 className="font-display text-[26px] font-bold leading-[1.08] tracking-[-0.03em] text-favella-text-primary">
                  Ventuno cassette, e sotto gira <Ink>FAVELLA davvero.</Ink>
                </h3>
                <p className="mt-3 font-serif text-[15.5px] leading-[1.6] text-favella-text-secondary">
                  Ogni lezione ti fa scrivere una frase, e a compilarla è il motore vero.
                </p>
                <span className="mt-auto pt-5 font-display text-[14px] font-semibold text-favella-cyan transition-transform group-hover:translate-x-1">
                  Entra nel corso →
                </span>
              </Spot>
            </Reveal>

            {/* Programma */}
            <Reveal delay={140} className="md:col-span-5">
              <Spot as={Link} to="/programma" className="group flex h-full flex-col p-8">
                <Eyebrow tone="cyan" className="mb-5">
                  Nel browser
                </Eyebrow>
                <h3 className="font-display text-[26px] font-bold leading-[1.08] tracking-[-0.03em] text-favella-text-primary">
                  Scrivi a sinistra, <Ink>gioca a destra.</Ink>
                </h3>
                <div className="mt-5 rounded-xl border border-favella-cyan/12 bg-favella-void/60 p-3.5 font-mono text-[12px] leading-[1.8]">
                  <div>{evidenzia("La grotta è una stanza.")}</div>
                  <div className="text-favella-emerald">✓ Compilato dal motore FAVELLA</div>
                </div>
                <span className="mt-auto pt-5 font-display text-[14px] font-semibold text-favella-cyan transition-transform group-hover:translate-x-1">
                  Apri il laboratorio →
                </span>
              </Spot>
            </Reveal>

            {/* Galleria */}
            <Reveal delay={60} className="md:col-span-4">
              <Spot as={Link} to="/galleria" className="group flex h-full flex-col overflow-hidden p-8">
                <Eyebrow tone="emerald" className="mb-5">
                  Galleria
                </Eyebrow>
                <h3 className="font-display text-[24px] font-bold leading-[1.1] tracking-[-0.03em] text-favella-text-primary">
                  Dieci avventure, <Ink>tutte vincibili.</Ink>
                </h3>
                <div className="relative mt-6 flex h-[120px] items-end">
                  {copertine.slice(0, 4).map((c, i) => (
                    <img
                      key={c.gameId}
                      src={`/covers/${c.cover}`}
                      alt=""
                      width={1000}
                      height={558}
                      loading="lazy"
                      className="absolute h-[96px] w-auto rounded-lg border border-white/10 object-cover shadow-[0_14px_30px_-10px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:-translate-y-2"
                      style={{ left: `${i * 56}px`, zIndex: i, transitionDelay: `${i * 40}ms`, transform: `rotate(${(i - 1.5) * 3}deg)` }}
                    />
                  ))}
                </div>
              </Spot>
            </Reveal>

            {/* Motore */}
            <Reveal delay={120} className="md:col-span-4">
              <Spot className="flex h-full flex-col p-8">
                <Eyebrow tone="cyan" className="mb-5">
                  Il motore
                </Eyebrow>
                <div className="font-display text-[64px] font-bold leading-none tracking-[-0.05em] text-ink-accent">
                  <Counter value={STATS_NUMERI.test} />
                </div>
                <p className="mt-2 font-display text-[18px] font-semibold text-favella-text-primary">test verdi</p>
                <p className="mt-2 font-serif text-[15px] leading-[1.6] text-favella-text-secondary">
                  Parser LALR(1) senza ambiguità, più {STATS_NUMERI.collaudo} prove di collaudo. Ciò che scrivi oggi gira uguale fra
                  dieci anni.
                </p>
              </Spot>
            </Reveal>

            {/* Aperto */}
            <Reveal delay={180} className="md:col-span-4">
              <Spot className="flex h-full flex-col p-8">
                <Eyebrow tone="amber" className="mb-5">
                  Aperto
                </Eyebrow>
                <h3 className="font-display text-[24px] font-bold leading-[1.1] tracking-[-0.03em] text-favella-text-primary">
                  Libero, <Ink>per davvero.</Ink>
                </h3>
                <div className="mt-5 rounded-xl border border-favella-cyan/12 bg-favella-void/60 px-4 py-3 font-mono text-[13px] text-favella-text-primary">
                  <span className="text-favella-text-muted">$</span> pip install <span className="text-favella-cyan">favella1</span>
                </div>
                <p className="mt-4 font-serif text-[15px] leading-[1.6] text-favella-text-secondary">
                  Licenza MIT. Motore, sito, Studio, manuale ed esempi sono pubblici su{" "}
                  <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-favella-cyan hover:underline">
                    GitHub
                  </a>{" "}
                  e{" "}
                  <a href={PYPI_URL} target="_blank" rel="noopener noreferrer" className="text-favella-cyan hover:underline">
                    PyPI
                  </a>
                  .
                </p>
              </Spot>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═════════ IL LIBRO ═════════ */}
      <section className="relative px-4 pb-28 sm:px-6">
        <div className="mx-auto max-w-[1240px]">
          <ManualBanner />
        </div>
      </section>

      {/* ═════════ GALLERIA ═════════ */}
      <section className="relative pb-28">
        <div className="mx-auto mb-10 flex max-w-[1240px] flex-wrap items-end justify-between gap-4 px-6">
          <SectionHead
            eyebrow="La galleria"
            tone="amber"
            title={
              <>
                Storie vere, <Ink>da giocare adesso.</Ink>
              </>
            }
          />
          <Btn to="/galleria" variant="ghost" className="mb-12">
            Vedi tutte →
          </Btn>
        </div>
        <Marquee duration={95}>
          {copertine.map((c) => (
            <Link
              key={c.gameId}
              to="/galleria"
              className="group relative block h-[220px] w-[392px] shrink-0 overflow-hidden rounded-2xl border border-white/10 sm:h-[250px] sm:w-[448px]"
            >
              <img
                src={`/covers/${c.cover}`}
                alt={`Copertina di ${c.titolo}`}
                width={1000}
                height={558}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(3,6,13,0.92))]" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="font-display text-[20px] font-bold tracking-[-0.02em] text-favella-text-primary">{c.titolo}</p>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-favella-text-secondary">{c.fonte.replace(/⭐/g, "★")}</p>
              </div>
            </Link>
          ))}
        </Marquee>
      </section>

      {/* ═════════ NUMERI ═════════ */}
      <section className="relative px-6 pb-28">
        <div className="mx-auto grid max-w-[1240px] gap-px overflow-hidden rounded-[28px] border border-favella-cyan/15 bg-favella-cyan/10 md:grid-cols-4">
          {[
            { n: STATS_NUMERI.test, l: "test verdi", h: `+ ${STATS_NUMERI.collaudo} di collaudo` },
            { n: STATS_NUMERI.avventure, l: "avventure vincibili", h: "in galleria, giocabili nel browser" },
            { n: STATS_NUMERI.cassette, l: "cassette di corso", h: "con il motore vero sotto" },
            { n: MANUAL_PDF_PAGES, l: "pagine di manuale", h: "PDF gratuito, in carta a colori" },
          ].map((s, i) => (
            <Reveal key={s.l} delay={i * 90} className="bg-favella-dark px-8 py-10">
              <div className="font-display text-[clamp(44px,5vw,68px)] font-bold leading-none tracking-[-0.05em] text-ink-accent">
                <Counter value={s.n} />
              </div>
              <p className="mt-3 font-display text-[17px] font-semibold text-favella-text-primary">{s.l}</p>
              <p className="mt-1 text-[13.5px] text-favella-text-muted">{s.h}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═════════ CHIUSURA ═════════ */}
      <section className="relative overflow-hidden px-6 pb-12 pt-10">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-1/2 h-[420px] -translate-y-1/2 bg-[radial-gradient(50%_60%_at_50%_50%,rgba(34,211,238,0.14),transparent_70%)]"
        />
        <div className="relative mx-auto max-w-[940px] text-center">
          <Reveal>
            <h2 className="font-display text-[clamp(38px,6.4vw,88px)] font-bold leading-[0.98] tracking-[-0.05em] text-favella-text-primary">
              In FAVELLA, l'italiano <Ink>è il codice.</Ink>
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="mx-auto mt-8 max-w-[600px] font-serif text-[19px] leading-[1.62] text-favella-text-secondary">
              Un progetto aperto, in cerca di compagni. Codice, grammatica, documentazione ed esempi sono tutti pubblici. Se
              l'idea ti accende, c'è tanto da giocare, e da fare.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Btn to="/programma" size="lg">
                Comincia adesso
              </Btn>
              <Btn to="/collabora" variant="ghost" size="lg">
                Come contribuire
              </Btn>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
};

export default Home;
