import React from "react";
import CodeBlock from "../components/CodeBlock";
import { Link } from "../router";
import {
  PYPI_URL,
  RELEASES_URL,
  MANUAL_PDF_URL,
  GITHUB_URL,
  VERSION,
  DOWNLOAD_WINDOWS,
  DOWNLOAD_MACOS,
  DOWNLOAD_LINUX,
} from "../constants";

// Download diretto di un eseguibile per sistema operativo.
const OsDownload = ({ os, ext, href }: { os: string; ext: string; href: string }) => (
  <a
    href={href}
    className="flex items-center justify-between rounded-lg border border-favella-emerald/25 bg-favella-panel/40 px-3.5 py-2.5 transition-colors hover:border-favella-emerald hover:bg-favella-emerald/10"
  >
    <span className="font-display text-[13.5px] font-semibold text-favella-text-primary">{os}</span>
    <span className="font-mono text-[11px] text-favella-emerald">↓ {ext}</span>
  </a>
);

// Pulsante esterno (apre in nuova scheda).
const ExtBtn = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 rounded-lg border border-favella-cyan/35 bg-favella-cyan/10 px-5 py-2.5 font-display text-[14px] font-semibold text-favella-cyan-bright transition-colors hover:border-favella-cyan hover:bg-favella-cyan hover:text-favella-dark"
  >
    {children}
  </a>
);

// Riga "altro da scaricare" (link secondari, interni o esterni).
const Secondary = ({
  to,
  href,
  title,
  desc,
}: {
  to?: string;
  href?: string;
  title: string;
  desc: string;
}) => {
  const inner = (
    <>
      <span className="font-display text-[15px] font-semibold text-favella-text-primary">{title}</span>
      <span className="mt-1 block text-[13.5px] leading-snug text-favella-text-secondary">{desc}</span>
    </>
  );
  const cls =
    "block rounded-[14px] border border-favella-cyan/12 bg-favella-panel/40 px-5 py-4 transition-colors hover:border-favella-cyan/35 hover:bg-favella-surface/40";
  return to ? (
    <Link to={to} className={cls}>
      {inner}
    </Link>
  ) : (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  );
};

const DownloadsPage = () => (
  <section className="px-6 pb-28 pt-[74px]">
    {/* Hero */}
    <div className="mx-auto max-w-[840px]">
      <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.26em] text-favella-cyan">
        Tutto in un posto solo
      </p>
      <h1 className="mb-[22px] font-serif text-[clamp(36px,5.4vw,62px)] font-medium leading-[1.08] tracking-[-0.02em] text-favella-text-primary">
        Scarica <span className="italic text-ink-accent">FAVELLA&nbsp;1</span>.
      </h1>
      <p className="mb-2 font-serif text-[20px] leading-[1.6] text-favella-text-secondary">
        Il linguaggio si usa in tre modi, e sono tutti gratuiti e open-source. Scegli quello
        che fa per te: un comando nel terminale, un'app da installare, o il manuale da leggere.
      </p>
    </div>

    {/* I tre canali principali */}
    <div className="mx-auto mt-[46px] grid max-w-[1040px] gap-7 md:grid-cols-3">
      {/* 1 — Pacchetto Python */}
      <div className="flex flex-col rounded-[18px] border border-favella-cyan/16 bg-gradient-to-b from-favella-surface/50 to-favella-panel/30 p-7">
        <span className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-favella-cyan">
          Per chi usa Python
        </span>
        <h2 className="mb-2 font-serif text-[24px] font-semibold text-favella-text-primary">
          Pacchetto Python
        </h2>
        <p className="mb-4 flex-1 text-[14.5px] leading-[1.65] text-favella-text-secondary">
          Il motore ufficiale su PyPI. Un comando e ce l'hai ovunque, da usare come programma
          o come libreria.
        </p>
        <div className="mb-5 overflow-hidden rounded-[10px] border border-favella-cyan/12">
          <CodeBlock>pip install favella1</CodeBlock>
        </div>
        <ExtBtn href={PYPI_URL}>↗ Vai a favella1 su PyPI</ExtBtn>
      </div>

      {/* 2 — App desktop */}
      <div className="flex flex-col rounded-[18px] border border-favella-cyan/16 bg-gradient-to-b from-favella-surface/50 to-favella-panel/30 p-7">
        <span className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-favella-emerald">
          Senza installare Python
        </span>
        <h2 className="mb-2 font-serif text-[24px] font-semibold text-favella-text-primary">
          App desktop
        </h2>
        <p className="mb-4 text-[14.5px] leading-[1.65] text-favella-text-secondary">
          L'eseguibile pronto all'uso per il tuo sistema (release v{VERSION}). Niente prerequisiti:
          scarichi e avvii. <a href="#avvio" className="text-favella-emerald underline-offset-2 hover:underline">Leggi le note di avvio ↓</a>
        </p>
        <div className="mt-auto flex flex-col gap-2">
          <OsDownload os="Windows" ext=".exe" href={DOWNLOAD_WINDOWS} />
          <OsDownload os="macOS (Apple Silicon)" ext=".dmg" href={DOWNLOAD_MACOS} />
          <OsDownload os="Linux" ext=".AppImage" href={DOWNLOAD_LINUX} />
        </div>
      </div>

      {/* 3 — Manuale */}
      <div className="flex flex-col rounded-[18px] border border-favella-cyan/16 bg-gradient-to-b from-favella-surface/50 to-favella-panel/30 p-7">
        <span className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-favella-amber">
          Per imparare
        </span>
        <h2 className="mb-2 font-serif text-[24px] font-semibold text-favella-text-primary">
          Manuale (PDF)
        </h2>
        <p className="mb-4 flex-1 text-[14.5px] leading-[1.65] text-favella-text-secondary">
          Il Manuale di Programmazione completo: 84 pagine, 21 capitoli, dalla prima frase
          al mondo che cambia.
        </p>
        <div className="mb-5">
          <span className="rounded-full border border-favella-amber/25 px-2.5 py-1 font-mono text-[11px] text-favella-amber">
            84 pp · 21 capp · v{VERSION}
          </span>
        </div>
        <ExtBtn href={MANUAL_PDF_URL}>↓ Scarica il manuale</ExtBtn>
      </div>
    </div>

    {/* Note di avvio / disclaimer per OS */}
    <div id="avvio" className="mx-auto mt-12 max-w-[1040px] scroll-mt-24">
      <div className="rounded-[18px] border border-favella-amber/25 bg-favella-amber/[0.06] p-7">
        <h2 className="mb-2 font-serif text-[22px] font-semibold text-favella-text-primary">
          ⚠️ Note di avvio (importante)
        </h2>
        <p className="mb-5 text-[14px] leading-[1.6] text-favella-text-secondary">
          Gli eseguibili sono sicuri ma <strong>non sono firmati con un certificato a pagamento</strong>:
          è normale per un progetto open-source indipendente. La prima volta il sistema potrebbe
          avvisarti. Ecco come procedere.
        </p>
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <p className="mb-1.5 font-display text-[14px] font-semibold text-favella-cyan">Windows</p>
            <p className="text-[13px] leading-[1.6] text-favella-text-secondary">
              Se compare «Windows ha protetto il PC» (SmartScreen): clicca su
              <strong> «Ulteriori informazioni»</strong> e poi <strong>«Esegui comunque»</strong>.
            </p>
          </div>
          <div>
            <p className="mb-1.5 font-display text-[14px] font-semibold text-favella-cyan">macOS</p>
            <p className="text-[13px] leading-[1.6] text-favella-text-secondary">
              Il <code className="font-mono text-[12px] text-favella-emerald">.dmg</code> è per Mac
              Apple Silicon. Se appare «impossibile verificare lo sviluppatore»: <strong>tasto destro
              sull'app → Apri</strong>, oppure Impostazioni → Privacy e sicurezza → «Apri comunque».
            </p>
          </div>
          <div>
            <p className="mb-1.5 font-display text-[14px] font-semibold text-favella-cyan">Linux</p>
            <p className="text-[13px] leading-[1.6] text-favella-text-secondary">
              Rendi eseguibile l'AppImage: <code className="font-mono text-[12px] text-favella-emerald">chmod +x favella1-*.AppImage</code>
              {" "}(o Proprietà → Permessi → «Consenti esecuzione»), poi avviala. Su alcune distro serve
              <strong> FUSE</strong>.
            </p>
          </div>
        </div>
        <p className="mt-5 text-[13px] text-favella-text-muted">
          Preferisci non installare nulla? Usa il pacchetto Python (<code className="font-mono text-favella-cyan">pip install favella1</code>)
          o prova le storie direttamente nel browser. Tutti gli eseguibili sono anche su{" "}
          <a href={RELEASES_URL} target="_blank" rel="noopener noreferrer" className="text-favella-cyan hover:underline">GitHub Releases</a>.
        </p>
      </div>
    </div>

    {/* Altro da scaricare / esplorare */}
    <div className="mx-auto mt-12 max-w-[1040px]">
      <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-favella-text-muted">
        E poi c'è altro
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Secondary
          to="/libreria"
          title="Libreria di moduli"
          desc="File .fav pronti da includere: sinonimi, proprietà, verbi. Si copiano e si scaricano."
        />
        <Secondary
          to="/galleria"
          title="Galleria di storie"
          desc="Avventure complete e vincibili, giocabili nel browser o da scaricare e rigiocare."
        />
        <Secondary
          href={GITHUB_URL}
          title="Codice sorgente"
          desc="Tutto il progetto su GitHub, licenza MIT. Clona, leggi, contribuisci."
        />
        <Secondary
          href={RELEASES_URL}
          title="Tutte le release"
          desc="Lo storico delle versioni con note di rilascio ed eseguibili per ogni sistema."
        />
      </div>
    </div>

    <p className="mx-auto mt-12 max-w-[840px] text-center font-serif text-[15px] italic text-favella-text-muted">
      Tutto gratuito, tutto open-source. «Il tuo codice è una storia.»
    </p>
  </section>
);

export default DownloadsPage;
