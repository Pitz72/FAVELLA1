import CodeBlock from "../components/CodeBlock";
import { Link } from "../router";
import { Btn, Eyebrow, Ink, PageHero, Reveal, Spot } from "../ui/primitives";
import {
  PYPI_URL,
  RELEASES_URL,
  MANUAL_PDF_URL,
  GITHUB_URL,
  VERSION,
  STUDIO_VERSION,
  MANUAL_PDF_PAGES,
  MANUAL_PDF_EDITION,
  DOWNLOAD_WINDOWS,
  DOWNLOAD_MACOS,
  DOWNLOAD_LINUX,
} from "../constants";

// Download diretto di un eseguibile per sistema operativo.
const OsDownload = ({ os, ext, href }: { os: string; ext: string; href: string }) => (
  <a
    href={href}
    className="group flex items-center justify-between rounded-2xl border border-favella-emerald/25 bg-favella-void/40 px-4 py-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-favella-emerald hover:bg-favella-emerald/10"
  >
    <span className="font-display text-[15px] font-semibold text-favella-text-primary">{os}</span>
    <span className="font-mono text-[11.5px] text-favella-emerald">↓ {ext}</span>
  </a>
);

// Riga "altro da scaricare" (link secondari, interni o esterni).
const Secondary = ({ to, href, title, desc }: { to?: string; href?: string; title: string; desc: string }) => {
  const inner = (
    <>
      <span className="flex items-center justify-between font-display text-[17px] font-bold tracking-[-0.02em] text-favella-text-primary">
        {title}
        <span className="text-favella-cyan transition-transform group-hover:translate-x-1">→</span>
      </span>
      <span className="mt-2 block text-[14px] leading-snug text-favella-text-secondary">{desc}</span>
    </>
  );
  return to ? (
    <Spot as={Link} to={to} className="group block px-6 py-5">
      {inner}
    </Spot>
  ) : (
    <Spot as="a" href={href} target="_blank" rel="noopener noreferrer" className="group block px-6 py-5">
      {inner}
    </Spot>
  );
};

const DownloadsPage = () => (
  <>
    <PageHero
      eyebrow="Tutto in un posto solo"
      title={
        <>
          Scarica <Ink>FAVELLA&nbsp;1.</Ink>
        </>
      }
      lead="Il linguaggio si usa in tre modi, e sono tutti gratuiti e open source: un comando nel terminale, un'app da installare, o il manuale da leggere."
    />

    {/* I tre canali principali */}
    <section className="px-6 pb-12">
      <div className="mx-auto grid max-w-[1240px] gap-5 md:grid-cols-3">
        {/* 1 — Pacchetto Python */}
        <Reveal>
          <Spot className="flex h-full flex-col p-8">
            <Eyebrow className="mb-5">Per chi usa Python</Eyebrow>
            <h2 className="mb-3 font-display text-[28px] font-bold tracking-[-0.03em] text-favella-text-primary">Pacchetto Python</h2>
            <p className="mb-5 flex-1 font-serif text-[16px] leading-[1.65] text-favella-text-secondary">
              Il motore ufficiale su PyPI. Un comando e ce l'hai ovunque, da usare come programma o come libreria.
            </p>
            <div className="mb-6 overflow-hidden rounded-xl border border-favella-cyan/12">
              <CodeBlock>pip install favella1</CodeBlock>
            </div>
            <Btn href={PYPI_URL} variant="ghost">
              Vai a favella1 su PyPI ↗
            </Btn>
          </Spot>
        </Reveal>

        {/* 2 — App desktop */}
        <Reveal delay={100}>
          <Spot className="flex h-full flex-col p-8">
            <Eyebrow tone="emerald" className="mb-5">
              Senza installare Python
            </Eyebrow>
            <h2 className="mb-3 font-display text-[28px] font-bold tracking-[-0.03em] text-favella-text-primary">App desktop</h2>
            <p className="mb-5 font-serif text-[16px] leading-[1.65] text-favella-text-secondary">
              L'eseguibile pronto all'uso per il tuo sistema (release {VERSION}). Niente prerequisiti: scarichi e avvii.{" "}
              <a href="#avvio" className="text-favella-emerald underline-offset-2 hover:underline">
                Note di avvio ↓
              </a>
            </p>
            <div className="mt-auto flex flex-col gap-2.5">
              <OsDownload os="Windows" ext=".exe" href={DOWNLOAD_WINDOWS} />
              <OsDownload os="macOS (Apple Silicon)" ext=".dmg" href={DOWNLOAD_MACOS} />
              <OsDownload os="Linux" ext=".AppImage" href={DOWNLOAD_LINUX} />
            </div>
          </Spot>
        </Reveal>

        {/* 3 — Manuale */}
        <Reveal delay={200}>
          <Spot className="flex h-full flex-col p-8">
            <Eyebrow tone="amber" className="mb-5">
              Per imparare
            </Eyebrow>
            <h2 className="mb-3 font-display text-[28px] font-bold tracking-[-0.03em] text-favella-text-primary">Manuale (PDF)</h2>
            <p className="mb-5 flex-1 font-serif text-[16px] leading-[1.65] text-favella-text-secondary">
              Il Manuale di Programmazione completo: {MANUAL_PDF_PAGES} pagine, 21 capitoli, dalla prima frase al mondo che cambia.
            </p>
            <div className="mb-6">
              <span className="rounded-full border border-favella-amber/30 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-favella-amber">
                {MANUAL_PDF_PAGES} pp · 21 capp · {MANUAL_PDF_EDITION.toLowerCase()}
              </span>
            </div>
            <Btn href={MANUAL_PDF_URL} variant="ghost">
              ↓ Scarica il manuale
            </Btn>
          </Spot>
        </Reveal>
      </div>
    </section>

    {/* Favella Studio */}
    <section className="px-6 pb-12">
      <div className="mx-auto max-w-[1240px]">
        <Reveal>
          <Spot
            as={Link}
            to="/studio"
            className="group flex flex-col items-start gap-6 p-7 sm:flex-row sm:items-center md:p-9"
          >
            <img src="/studio/favella-studio-logo-256.png" alt="" width={84} height={84} className="rounded-[22px] shadow-[0_20px_50px_-16px_rgba(34,211,238,0.5)]" />
            <span className="flex-1">
              <span className="block font-display text-[24px] font-bold tracking-[-0.03em] text-favella-text-primary">
                Cerchi un ambiente per scrivere? Favella Studio {STUDIO_VERSION}
              </span>
              <span className="mt-1.5 block font-serif text-[16px] leading-snug text-favella-text-secondary">
                Testo, mappa, oggetti, personaggi, regole e prova della storia in un'app sola. Windows e Linux; su Mac te la costruisci da te.
              </span>
            </span>
            <span className="font-display text-[15px] font-semibold text-favella-emerald transition-transform group-hover:translate-x-1">Scopri →</span>
          </Spot>
        </Reveal>
      </div>
    </section>

    {/* Note di avvio / disclaimer per OS */}
    <section id="avvio" className="scroll-mt-24 px-6 pb-12">
      <div className="mx-auto max-w-[1240px]">
        <div className="rounded-[28px] border border-favella-amber/25 bg-favella-amber/[0.05] p-8 md:p-10">
          <h2 className="mb-3 font-display text-[26px] font-bold tracking-[-0.03em] text-favella-text-primary">Note di avvio</h2>
          <p className="mb-7 max-w-[760px] font-serif text-[16px] leading-[1.65] text-favella-text-secondary">
            Gli eseguibili sono sicuri ma <strong className="text-favella-text-primary">non sono firmati con un certificato a pagamento</strong>: è normale per un
            progetto open source indipendente. La prima volta il sistema potrebbe avvisarti. Ecco come procedere.
          </p>
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <p className="mb-2 font-display text-[15px] font-bold text-favella-cyan">Windows</p>
              <p className="text-[14px] leading-[1.65] text-favella-text-secondary">
                Se compare «Windows ha protetto il PC» (SmartScreen): clicca su <strong>«Ulteriori informazioni»</strong> e poi <strong>«Esegui comunque»</strong>.
              </p>
            </div>
            <div>
              <p className="mb-2 font-display text-[15px] font-bold text-favella-cyan">macOS</p>
              <p className="text-[14px] leading-[1.65] text-favella-text-secondary">
                Il <code className="font-mono text-[12.5px] text-favella-emerald">.dmg</code> è per Mac Apple Silicon. Se appare «impossibile verificare lo sviluppatore»:{" "}
                <strong>tasto destro sull'app → Apri</strong>, oppure Impostazioni → Privacy e sicurezza → «Apri comunque».
              </p>
            </div>
            <div>
              <p className="mb-2 font-display text-[15px] font-bold text-favella-cyan">Linux</p>
              <p className="text-[14px] leading-[1.65] text-favella-text-secondary">
                Rendi eseguibile l'AppImage: <code className="font-mono text-[12.5px] text-favella-emerald">chmod +x favella1-*.AppImage</code> (o Proprietà → Permessi →
                «Consenti esecuzione»), poi avviala. Su alcune distro serve <strong>FUSE</strong>.
              </p>
            </div>
          </div>
          <p className="mt-7 text-[14px] text-favella-text-muted">
            Preferisci non installare nulla? Usa il pacchetto Python (<code className="font-mono text-favella-cyan">pip install favella1</code>) o prova le storie
            direttamente nel browser. Tutti gli eseguibili sono anche su{" "}
            <a href={RELEASES_URL} target="_blank" rel="noopener noreferrer" className="text-favella-cyan hover:underline">
              GitHub Releases
            </a>
            .
          </p>
        </div>
      </div>
    </section>

    {/* Altro da scaricare / esplorare */}
    <section className="px-6 pb-12">
      <div className="mx-auto max-w-[1240px]">
        <Eyebrow className="mb-6 text-favella-text-muted">E poi c'è altro</Eyebrow>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Secondary to="/libreria" title="Libreria di moduli" desc="File .fav pronti da includere: sinonimi, proprietà, verbi. Si copiano e si scaricano." />
          <Secondary to="/galleria" title="Galleria di storie" desc="Avventure complete e vincibili, giocabili nel browser o da scaricare e rigiocare." />
          <Secondary href={GITHUB_URL} title="Codice sorgente" desc="Tutto il progetto su GitHub, licenza MIT. Clona, leggi, contribuisci." />
          <Secondary href={RELEASES_URL} title="Tutte le release" desc="Lo storico delle versioni con note di rilascio ed eseguibili per ogni sistema." />
        </div>
      </div>
    </section>

    <p className="px-6 text-center font-serif text-[16px] italic text-favella-text-muted">Tutto gratuito, tutto open source. «Il tuo codice è una storia.»</p>
  </>
);

export default DownloadsPage;
