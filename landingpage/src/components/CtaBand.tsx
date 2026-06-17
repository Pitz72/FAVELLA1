import React from "react";
import AnimatedSection from "./AnimatedSection";
import { GitHubIcon, ArrowRight, Spark } from "./icons";
import { GITHUB_URL } from "../constants";

const CtaBand = () => {
  const go = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    window.location.hash = href;
  };

  return (
    <AnimatedSection>
      <section className="max-w-5xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl glass glow-border p-10 md:p-14 text-center">
          {/* bagliore di fondo */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[480px] h-[480px] rounded-full bg-favella-cyan/10 blur-[120px] pointer-events-none" />
          <div className="relative">
            <Spark className="w-8 h-8 text-favella-amber mx-auto mb-5 animate-flame-flicker" />
            <h2 className="font-display font-bold text-3xl md:text-4xl text-favella-text-primary mb-4">
              Un progetto aperto, <span className="text-gradient-brand">in cerca di compagni</span>
            </h2>
            <p className="text-favella-text-secondary max-w-2xl mx-auto leading-relaxed mb-3 font-serif">
              FAVELLA 1 è interamente pubblico su GitHub: codice, grammatica, documentazione ed esempi.
              Se l'idea ti accende, ci sarebbe tanto da fare — testare il linguaggio, scrivere storie,
              proporre costrutti, migliorare i tool.
            </p>
            <p className="text-favella-text-primary max-w-2xl mx-auto leading-relaxed mb-8">
              E se qualcuno volesse <strong className="text-favella-cyan">dare una mano sul serio</strong> — o
              addirittura <strong className="text-favella-emerald">prendere in carico il progetto</strong> e
              portarlo avanti — sarebbe la cosa più bella che possa capitargli.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-gradient bg-[length:200%_auto] hover:bg-[position:100%] text-favella-dark font-bold py-3.5 px-7 rounded-xl shadow-glow-cyan-sm hover:shadow-glow-cyan transition-all duration-500"
              >
                <GitHubIcon className="w-5 h-5" />
                Apri il repository
              </a>
              <a
                href="#/collabora"
                onClick={(e) => go(e, "#/collabora")}
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-7 rounded-xl glass text-favella-text-primary hover:text-favella-cyan transition-all duration-300"
              >
                Come contribuire <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
};

export default CtaBand;
