import React from "react";
import { PROJECT_TEXT, GITHUB_URL } from "../constants";
import AnimatedSection from "../components/AnimatedSection";
import { GitHubIcon, ArrowRight } from "../components/icons";

const Step: React.FC<{ n: string; title: string; desc: string }> = ({ n, title, desc }) => (
  <div className="relative pl-12">
    <span className="absolute left-0 top-0 w-8 h-8 rounded-lg bg-brand-gradient text-favella-dark font-display font-bold text-sm flex items-center justify-center">
      {n}
    </span>
    <h4 className="font-display font-semibold text-favella-text-primary">{title}</h4>
    <p className="text-sm text-favella-text-secondary mt-1">{desc}</p>
  </div>
);

const ProjectPage = () => {
  const paragraphs = PROJECT_TEXT.split("\n\n");
  const go = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    window.location.hash = href;
  };

  return (
    <AnimatedSection>
      <div className="max-w-6xl mx-auto">
        <div className="glass rounded-3xl p-8 md:p-16 shadow-glow-card relative overflow-hidden">
          <div className="absolute -top-32 -right-24 w-96 h-96 rounded-full bg-favella-emerald/10 blur-[130px] pointer-events-none" />

          <div className="relative text-center mb-14">
            <p className="font-mono text-xs tracking-[0.2em] text-favella-cyan uppercase mb-3">Il Progetto</p>
            <h1 className="font-display font-extrabold text-4xl md:text-5xl text-favella-text-primary">
              La genesi di <span className="text-gradient-brand">FAVELLA 1</span>
            </h1>
            <div className="w-24 h-1 bg-brand-gradient rounded-full mx-auto mt-6" />
          </div>

          <div className="relative grid lg:grid-cols-12 gap-12">
            <article className="lg:col-span-7 space-y-6 text-lg leading-relaxed text-favella-text-secondary font-serif">
              {paragraphs.map((p, i) => (
                <p
                  key={i}
                  className={
                    i === 0
                      ? "first-letter:text-6xl first-letter:font-display first-letter:font-bold first-letter:text-favella-cyan first-letter:mr-3 first-letter:float-left first-letter:leading-[0.8]"
                      : ""
                  }
                >
                  {p}
                </p>
              ))}
            </article>

            <aside className="lg:col-span-5">
              <div className="sticky top-8 bg-favella-void/40 rounded-2xl p-8 border border-favella-cyan/10">
                <h3 className="text-center font-mono text-xs uppercase tracking-[0.2em] text-favella-cyan mb-8">
                  Il workflow ibrido
                </h3>
                <div className="space-y-7">
                  <Step n="1" title="Visione umana" desc="Idea, design del linguaggio e decisioni di campo restano all'autore." />
                  <Step n="2" title="Dialogo con l'IA" desc="Specifiche, alternative di grammatica e brainstorming a quattro mani." />
                  <Step n="3" title="Grammatica LALR(1)" desc="Costrutti additivi, non ambigui per costruzione, in EBNF (Lark)." />
                  <Step n="4" title="Implementazione" desc="Compilatore a due passate, object model e interprete in Python." />
                  <Step n="5" title="Suite di test" desc="681 asserzioni a guardia, più 43 di collaudo: nessuna regressione, nessuna ambiguità." />
                </div>
              </div>
            </aside>
          </div>

          <div className="relative mt-14 pt-10 border-t border-favella-text-secondary/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-favella-text-secondary text-sm">
              Tutto il percorso, versione per versione, è pubblico nel repository.
            </p>
            <div className="flex gap-3">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-favella-cyan/10 text-favella-cyan border border-favella-cyan/30 hover:bg-favella-cyan hover:text-favella-dark py-2.5 px-5 rounded-lg transition-all duration-300 text-sm"
              >
                <GitHubIcon className="w-4 h-4" /> Esplora il codice
              </a>
              <a
                href="#/aggiornamenti"
                onClick={(e) => go(e, "#/aggiornamenti")}
                className="inline-flex items-center gap-2 text-favella-text-primary hover:text-favella-cyan py-2.5 px-5 rounded-lg transition-colors text-sm"
              >
                Le tappe <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
};

export default ProjectPage;
