import React from "react";
import { PROJECT_TEXT, AUTHOR_NAME } from "../constants";

// Converte l'emfasi markdown «*testo*» in <em> (l'unica nel PROJECT_TEXT).
const emph = (text: string): React.ReactNode =>
  text.split(/(\*[^*]+\*)/g).map((seg, i) =>
    seg.startsWith("*") && seg.endsWith("*") ? (
      <em key={i} className="italic text-favella-cyan">
        {seg.slice(1, -1)}
      </em>
    ) : (
      <React.Fragment key={i}>{seg}</React.Fragment>
    )
  );

const ENGINEERING = [
  { tag: "parser", title: "LALR(1) non ambiguo", body: "Grammatica formale Lark/EBNF, deterministica per costruzione." },
  { tag: "compilatore", title: "Due passate", body: "L'ordine delle frasi non conta: il mondo si risolve a fine compilazione." },
  { tag: "symbol-table", title: "Token «chiusi»", body: "Stanze e oggetti diventano simboli: l'italiano resta naturale." },
  { tag: "qualità", title: "681 + 43 test", body: "Una rete di sicurezza che cresce a ogni costrutto del linguaggio." },
];

const ProjectPage = () => {
  const paragraphs = PROJECT_TEXT.split("\n\n");

  return (
    <section className="bg-[radial-gradient(100%_55%_at_50%_0%,rgba(34,211,238,0.05),transparent_55%)] px-6 pb-28 pt-[74px]">
      {/* Intro */}
      <div className="mx-auto max-w-[760px]">
        <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.26em] text-favella-cyan">Il Progetto</p>
        <h1 className="mb-6 font-serif text-[clamp(36px,5.4vw,64px)] font-medium leading-[1.08] tracking-[-0.02em] text-favella-text-primary">
          Un sogno nel cassetto,<br />diventato <span className="italic text-ink-accent">linguaggio</span>.
        </h1>
        <p className="font-serif text-[clamp(18px,2.1vw,22px)] leading-[1.6] text-favella-text-secondary">
          Da Zork e Inform 7 a un'idea radicale: e se l'italiano, invece di{" "}
          <em className="italic text-favella-cyan">commentare</em> il codice,{" "}
          <em className="italic text-favella-text-primary">fosse</em> il codice?
        </p>

        {/* Divider */}
        <div className="my-12 flex items-center gap-3.5">
          <span className="h-[7px] w-[7px] rotate-45 bg-favella-amber shadow-[0_0_12px_rgba(245,158,11,0.7)]" />
          <span className="h-px flex-1 bg-gradient-to-r from-favella-text-secondary/30 to-transparent" />
        </div>

        {/* Prose, coi paragrafi canonici da PROJECT_TEXT */}
        <div className="font-serif text-[18px] leading-[1.8] text-[#c4d3e2]">
          {/* §1 con capolettera */}
          <p className="mb-7">
            <span className="float-left bg-[linear-gradient(135deg,#22d3ee,#34d399)] bg-clip-text pr-3.5 pt-1.5 font-serif text-[64px] font-semibold leading-[0.78] text-transparent">
              {paragraphs[0].charAt(0)}
            </span>
            {emph(paragraphs[0].slice(1))}
          </p>
          {/* §2 */}
          {paragraphs[1] && <p className="mb-7">{emph(paragraphs[1])}</p>}

          {/* Pull-quote */}
          <blockquote className="my-11 border-l-2 border-favella-cyan pl-7 [border-image:linear-gradient(180deg,#22d3ee,#f59e0b)_1]">
            <p className="m-0 font-serif text-[clamp(22px,3vw,30px)] font-medium italic leading-[1.4] text-favella-text-primary">
              «E se l'italiano non fosse usato per commentare il codice, ma fosse il codice stesso?»
            </p>
          </blockquote>

          {/* §3+ */}
          {paragraphs.slice(2).map((p, i) => (
            <p key={i} className={i === paragraphs.slice(2).length - 1 ? "mb-0" : "mb-7"}>
              {emph(p)}
            </p>
          ))}
        </div>
      </div>

      {/* Ingegneria vera */}
      <div className="mx-auto mt-20 max-w-[1000px] rounded-[20px] border border-favella-cyan/14 bg-gradient-to-b from-favella-surface/50 to-favella-panel/35 px-9 py-10">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.24em] text-favella-emerald">Sotto la prosa</p>
        <h2 className="mb-7 font-serif text-[clamp(24px,3vw,32px)] font-medium text-favella-text-primary">Ingegneria vera</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ENGINEERING.map((e) => (
            <div key={e.tag}>
              <div className="mb-1.5 font-mono text-[12px] text-favella-cyan">{e.tag}</div>
              <h3 className="mb-1.5 font-display text-[16px] font-semibold text-favella-text-primary">{e.title}</h3>
              <p className="m-0 text-[13.5px] leading-[1.6] text-favella-text-secondary">{e.body}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="mx-auto mt-12 text-center font-mono text-[12px] tracking-[0.1em] text-favella-text-muted">
        Un progetto di {AUTHOR_NAME} · scritto in dialogo con l'IA · favella.eu
      </p>
    </section>
  );
};

export default ProjectPage;
