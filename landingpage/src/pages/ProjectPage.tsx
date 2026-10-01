import React from "react";
import { PROJECT_TEXT, AUTHOR_NAME, STATS_NUMERI } from "../constants";
import { Counter, Eyebrow, Ink, PageHero, Reveal, SectionHead, Spot } from "../ui/primitives";

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
  { tag: "parser", big: "LALR(1)", title: "Non ambiguo", body: "Grammatica formale Lark/EBNF, deterministica per costruzione." },
  { tag: "compilatore", big: "2", title: "Passate", body: "L'ordine delle frasi non conta: il mondo si risolve a fine compilazione." },
  { tag: "symbol-table", big: "«»", title: "Token chiusi", body: "Stanze e oggetti diventano simboli: l'italiano resta naturale." },
  { tag: "qualità", big: null, title: "Test verdi", body: `Più ${STATS_NUMERI.collaudo} di collaudo: una rete di sicurezza che cresce a ogni costrutto.` },
];

const ProjectPage = () => {
  const paragraphs = PROJECT_TEXT.split("\n\n");

  return (
    <>
      <PageHero
        eyebrow="Il progetto"
        title={
          <>
            Un sogno nel cassetto, diventato <Ink>linguaggio.</Ink>
          </>
        }
        lead={
          <>
            Da Zork e Inform 7 a un'idea radicale: e se l'italiano, invece di <em className="text-favella-cyan">commentare</em> il codice,{" "}
            <em className="text-favella-text-primary">fosse</em> il codice?
          </>
        }
      />

      {/* ═════════ LA STORIA ═════════ */}
      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-[1180px] gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="lg:sticky lg:top-32 lg:self-start">
            <Reveal>
              <blockquote className="relative border-l-2 border-favella-cyan pl-7 [border-image:linear-gradient(180deg,#22d3ee,#34d399,#f59e0b)_1]">
                <p className="m-0 font-serif text-[clamp(24px,2.8vw,34px)] font-medium italic leading-[1.35] text-favella-text-primary">
                  «E se l'italiano non fosse usato per commentare il codice, ma fosse il codice stesso?»
                </p>
              </blockquote>
              <p className="mt-8 font-mono text-[11.5px] uppercase tracking-[0.2em] text-favella-text-muted">
                Un progetto di {AUTHOR_NAME}
                <br />
                scritto in dialogo con l'IA
              </p>
            </Reveal>
          </aside>

          <div className="font-serif text-[19px] leading-[1.82] text-[#c4d3e2]">
            {paragraphs.map((p, i) => (
              <Reveal key={i} className="mb-7" delay={0}>
                {i === 0 ? (
                  <p className="m-0">
                    <span className="float-left bg-[linear-gradient(135deg,#22d3ee,#34d399)] bg-clip-text pr-4 pt-2 font-display text-[88px] font-bold leading-[0.74] tracking-[-0.05em] text-transparent">
                      {p.charAt(0)}
                    </span>
                    {emph(p.slice(1))}
                  </p>
                ) : (
                  <p className="m-0">{emph(p)}</p>
                )}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════ INGEGNERIA VERA ═════════ */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-[1180px]">
          <SectionHead eyebrow="Sotto la prosa" tone="emerald" title={<>Ingegneria <Ink>vera.</Ink></>} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ENGINEERING.map((e, i) => (
              <Reveal key={e.tag} delay={i * 90}>
                <Spot className="h-full p-7">
                  <Eyebrow tone="emerald" className="mb-6">
                    {e.tag}
                  </Eyebrow>
                  <div className="font-display text-[48px] font-bold leading-none tracking-[-0.05em] text-ink-accent">
                    {e.big === null ? <Counter value={STATS_NUMERI.test} /> : e.big}
                  </div>
                  <h3 className="mb-2 mt-3 font-display text-[19px] font-bold text-favella-text-primary">{e.title}</h3>
                  <p className="text-[14.5px] leading-[1.6] text-favella-text-secondary">{e.body}</p>
                </Spot>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <p className="px-6 pb-4 text-center font-mono text-[12px] tracking-[0.1em] text-favella-text-muted">
        Un progetto di {AUTHOR_NAME} · scritto in dialogo con l'IA · favella.eu
      </p>
    </>
  );
};

export default ProjectPage;
