import React from "react";
import BrandMark from "../components/BrandMark";
import ManualBanner from "../components/ManualBanner";
import { STATS, FEATURES, GITHUB_URL } from "../constants";
import { navigate } from "../router";

const go = (href: string) => {
  navigate(href);
};

const Diamond = () => (
  <div className="mx-auto flex max-w-[560px] items-center justify-center gap-4">
    <span className="h-px flex-1 bg-gradient-to-r from-transparent to-favella-text-secondary/30" />
    <span className="h-[7px] w-[7px] rotate-45 bg-favella-amber shadow-[0_0_14px_rgba(245,158,11,0.7)]" />
    <span className="h-px flex-1 bg-gradient-to-l from-transparent to-favella-text-secondary/30" />
  </div>
);

const PrimaryCta = ({ onClick, href, children }: { onClick?: () => void; href?: string; children: React.ReactNode }) =>
  href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-xl bg-brand-gradient px-[30px] py-[15px] font-display text-[15px] font-bold text-favella-void shadow-[0_16px_44px_-16px_rgba(34,211,238,0.6)] transition-transform duration-300 hover:-translate-y-0.5"
    >
      {children}
    </a>
  ) : (
    <button
      onClick={onClick}
      className="rounded-xl bg-brand-gradient px-[30px] py-[15px] font-display text-[15px] font-bold text-favella-void shadow-[0_16px_44px_-16px_rgba(34,211,238,0.6)] transition-transform duration-300 hover:-translate-y-0.5"
    >
      {children}
    </button>
  );

const GhostCta = ({ onClick, href, children }: { onClick?: () => void; href?: string; children: React.ReactNode }) => {
  const cls =
    "rounded-xl border border-favella-cyan/25 bg-favella-surface/40 px-[30px] py-[15px] font-display text-[15px] font-semibold text-favella-text-primary transition-colors duration-300 hover:border-favella-cyan/50";
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {children}
    </a>
  ) : (
    <button onClick={onClick} className={cls}>
      {children}
    </button>
  );
};

const HomePage = () => (
  <>
    {/* ===================== HERO ===================== */}
    <section className="relative overflow-hidden bg-[radial-gradient(120%_70%_at_50%_-6%,rgba(245,158,11,0.10),transparent_50%)] px-6 pb-28 pt-20 md:pt-24">
      <div className="mx-auto max-w-[1080px] text-center">
        {/* Logo */}
        <div className="mb-7 flex justify-center">
          <BrandMark size={88} rings />
        </div>

        {/* Eyebrow */}
        <div className="mb-8 flex items-center justify-center gap-4">
          <span className="h-px w-[54px] bg-gradient-to-r from-transparent to-favella-cyan/60" />
          <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-favella-cyan">
            FAVELLA 1 · v1.0.0 — il linguaggio è completo
          </span>
          <span className="hidden h-px w-[54px] bg-gradient-to-l from-transparent to-favella-cyan/60 sm:block" />
        </div>

        <h1 className="mb-7 font-serif text-[clamp(46px,7.4vw,90px)] font-medium leading-[1.03] tracking-[-0.02em] text-favella-text-primary">
          Il tuo codice<br />è una <span className="italic text-ink-accent">storia</span>.
        </h1>

        <p className="mx-auto mb-10 max-w-[660px] font-serif text-[clamp(18px,2.1vw,23px)] leading-[1.62] text-favella-text-secondary">
          <strong className="font-semibold text-favella-text-primary">FAVELLA 1</strong> è il linguaggio in cui
          l'italiano <em className="not-italic text-favella-cyan">è</em> il codice. Descrivi un mondo con frasi normali
          e diventa un'avventura testuale giocabile.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <PrimaryCta onClick={() => go("/programma")}>Inizia subito</PrimaryCta>
          <GhostCta onClick={() => go("/progetto")}>Scopri il progetto</GhostCta>
        </div>

        {/* Banner: il manuale cartaceo è uscito */}
        <ManualBanner className="mx-auto mt-20 max-w-[1000px] text-left" />

        {/* Divider */}
        <div className="mx-auto mt-24 mb-2 max-w-[560px]">
          <Diamond />
        </div>

        {/* La stessa frase, due volte */}
        <p className="mb-3 mt-12 font-mono text-[11px] uppercase tracking-[0.24em] text-favella-emerald">
          La stessa frase, due volte
        </p>
        <h2 className="mb-9 font-serif text-[clamp(26px,3.4vw,38px)] font-medium text-favella-text-primary">
          Come la scrivi. <span className="italic text-favella-text-secondary">Come si gioca.</span>
        </h2>

        {/* Code / game split */}
        <div className="mx-auto grid max-w-[1000px] grid-cols-1 overflow-hidden rounded-[18px] border border-favella-cyan/15 text-left shadow-[0_50px_120px_-50px_rgba(0,0,0,0.85)] md:grid-cols-2">
          {/* editor */}
          <div className="border-b border-favella-cyan/14 bg-favella-panel p-8 md:border-b-0 md:border-r">
            <div className="mb-5 flex items-center gap-2">
              <span className="h-[9px] w-[9px] rounded-full bg-favella-flame/80" />
              <span className="h-[9px] w-[9px] rounded-full bg-favella-amber/80" />
              <span className="h-[9px] w-[9px] rounded-full bg-favella-emerald/80" />
              <span className="ml-auto font-mono text-[11px] text-favella-text-muted">storia.fav</span>
            </div>
            <pre className="m-0 whitespace-pre-wrap font-mono text-[13px] leading-[1.85] text-favella-text-primary">
La Grotta di Cristallo <span className="text-favella-cyan">è una stanza</span>.{"\n"}
La descrizione della grotta <span className="text-favella-cyan">è</span>{" "}
<span className="text-favella-emerald">"Stalattiti luminose pendono dal soffitto."</span>.{"\n"}
Una spada antica <span className="text-favella-cyan">è una cosa</span>.{"\n"}
La spada antica <span className="text-favella-cyan">è nella</span> grotta.{"\n"}
La spada antica <span className="text-favella-cyan">è prendibile</span>.{"\n"}
<span className="text-favella-cyan">Invece di</span> prendi la spada antica<span className="text-favella-amber">:</span>{" "}
<span className="text-favella-cyan">dire</span>{" "}
<span className="text-favella-emerald">"La lama emette un debole ronzio."</span>{" "}
<span className="text-favella-cyan">e adesso</span> la spada antica <span className="text-favella-cyan">è in inventario</span>.
            </pre>
          </div>
          {/* output */}
          <div className="bg-favella-surface p-8">
            <div className="mb-5 flex items-center gap-2">
              <span className="font-mono text-[11px] tracking-[0.1em] text-favella-text-muted">il gioco</span>
              <span className="ml-auto h-[7px] w-[7px] rounded-full bg-favella-emerald shadow-[0_0_10px_#34d399]" />
            </div>
            <div className="text-[14px] leading-[1.9]">
              <div className="font-mono text-favella-text-muted">&gt; guarda</div>
              <div className="mt-1 font-display font-semibold text-favella-cyan">Grotta di Cristallo</div>
              <div className="text-favella-text-secondary">Stalattiti luminose pendono dal soffitto.</div>
              <div className="text-favella-text-secondary">Puoi vedere qui: una spada antica.</div>
              <div className="mt-3.5 font-mono text-favella-text-muted">&gt; prendi spada antica</div>
              <div className="mt-1 font-serif italic text-favella-text-primary">La lama emette un debole ronzio.</div>
              <div className="text-favella-emerald">Preso: spada antica.</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-24 grid max-w-[920px] grid-cols-2 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="border-l border-favella-text-secondary/15 px-[18px] py-3.5 text-left">
              <div className="font-serif text-[clamp(34px,4vw,46px)] font-semibold text-ink-accent">{s.value}</div>
              <div className="mt-1 text-[14px] text-favella-text-primary">{s.label}</div>
              <div className="text-[12px] text-favella-text-muted">{s.hint}</div>
            </div>
          ))}
        </div>

        {/* Cosa sa fare */}
        <div className="mx-auto mt-28 max-w-[980px] text-left">
          <div className="mb-12 text-center">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.24em] text-favella-cyan">Cosa sa fare</p>
            <h2 className="font-serif text-[clamp(28px,4vw,42px)] font-medium text-favella-text-primary">
              Un linguaggio che <span className="italic text-ink-accent">pensa in italiano</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="flex gap-5 border-t border-favella-text-secondary/12 px-[18px] py-6">
                <span className="w-10 shrink-0 font-serif text-[30px] italic leading-none text-favella-text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="mb-2 font-display text-[18px] font-semibold text-favella-text-primary">{f.title}</h3>
                  <p className="m-0 text-[14.5px] leading-[1.6] text-favella-text-secondary">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Closing */}
        <div className="mx-auto mt-28 max-w-[760px]">
          <div className="mb-9">
            <Diamond />
          </div>
          <h2 className="mb-[22px] font-serif text-[clamp(30px,4.4vw,52px)] font-medium leading-[1.15] text-favella-text-primary">
            In FAVELLA, l'italiano <span className="italic text-ink-accent">è il codice</span>.
          </h2>
          <p className="mb-9 font-serif text-[18px] leading-[1.6] text-favella-text-secondary">
            Un progetto aperto, in cerca di compagni. Codice, grammatica, documentazione ed esempi sono tutti pubblici.
            Se l'idea ti accende, c'è tanto da fare.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <PrimaryCta onClick={() => go("/collabora")}>Come contribuire</PrimaryCta>
            <GhostCta href={GITHUB_URL}>Apri il repository</GhostCta>
          </div>
        </div>
      </div>
    </section>
  </>
);

export default HomePage;
