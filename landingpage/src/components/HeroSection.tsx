import React, { useState, useEffect } from "react";
import TerminalDemo from "./TerminalDemo";
import BrandMark from "./BrandMark";
import { GitHubIcon, ArrowRight, Spark } from "./icons";
import { GITHUB_URL, VERSION_LABEL, STATS } from "../constants";

const SLOGAN = "Scrivi storie, non codice.";

const HeroSection = () => {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let i = 0;
    const start = setTimeout(() => {
      const id = setInterval(() => {
        i++;
        setTyped(SLOGAN.slice(0, i));
        if (i >= SLOGAN.length) clearInterval(id);
      }, 70);
    }, 350);
    return () => clearTimeout(start);
  }, []);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    window.location.hash = href;
  };

  return (
    <section className="relative pt-6 md:pt-12 pb-4">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">
        {/* Colonna testo */}
        <div className="text-center lg:text-left order-2 lg:order-1">
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-5">
            <BrandMark size={56} rings className="shrink-0" />
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-favella-cyan text-xs font-mono tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-favella-emerald animate-pulse-slow" />
              {VERSION_LABEL}
            </span>
          </div>

          {/* Annuncio grande del traguardo 1.0.0 */}
          <div className="mb-5">
            <p className="font-display font-extrabold text-5xl md:text-7xl leading-none tracking-tight">
              <span className="text-favella-text-primary">FAVELLA</span>{" "}
              <span className="text-gradient-brand">1.0.0</span>
            </p>
            <p className="mt-2 font-display font-semibold text-base md:text-lg text-favella-emerald tracking-wide">
              Il linguaggio è completo.
            </p>
          </div>

          <h1 className="font-display font-extrabold text-3xl md:text-5xl leading-[1.05] tracking-tight mb-6 min-h-[2.4em] md:min-h-[1.2em]">
            <span className="text-gradient-brand">{typed}</span>
            <span className="inline-block w-[3px] h-[0.9em] bg-favella-amber align-middle ml-1 animate-caret-blink" />
          </h1>

          <p className="text-lg md:text-xl text-favella-text-secondary leading-relaxed max-w-xl mx-auto lg:mx-0 font-serif mb-4">
            <strong className="text-favella-text-primary">FAVELLA 1</strong> è il linguaggio in cui
            l'italiano <em className="text-favella-cyan not-italic font-semibold">è</em> il codice.
            Descrivi un mondo con frasi normali e diventa un'avventura testuale giocabile.
          </p>

          <p className="text-sm text-favella-text-muted mb-8 max-w-xl mx-auto lg:mx-0">
            Open-source, scritto in dialogo con l'IA. Motore completo, parser non ambiguo, 681 test.
            <span className="text-favella-emerald"> Su GitHub, aperto a chi vuole contribuire.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <a
              href="#/manuale"
              onClick={(e) => go(e, "#/manuale")}
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-gradient bg-[length:200%_auto] hover:bg-[position:100%] text-favella-dark font-bold py-3.5 px-7 rounded-xl shadow-glow-cyan-sm hover:shadow-glow-cyan transition-all duration-500"
            >
              <Spark className="w-4 h-4" />
              Inizia subito
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-7 rounded-xl glass text-favella-text-primary hover:text-favella-cyan transition-all duration-300"
            >
              <GitHubIcon className="w-5 h-5" />
              Vedi su GitHub
            </a>
          </div>
        </div>

        {/* Colonna demo */}
        <div className="order-1 lg:order-2 w-full animate-float">
          <TerminalDemo />
          <p className="text-center text-xs text-favella-text-muted mt-4 font-mono">
            Simulazione: scrivi → compila → gioca, in tempo reale.
          </p>
        </div>
      </div>

      {/* Statistiche */}
      <div className="max-w-4xl mx-auto mt-16 md:mt-20 grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="glass rounded-xl p-5 text-center glow-border transition-transform duration-300 hover:-translate-y-1"
          >
            <div className="font-display font-extrabold text-3xl md:text-4xl text-gradient-brand">{s.value}</div>
            <div className="text-sm text-favella-text-primary mt-1">{s.label}</div>
            <div className="text-[11px] text-favella-text-muted mt-0.5">{s.hint}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
