import React from "react";
import AnimatedSection from "./AnimatedSection";
import { NEWS } from "../constants";
import { GitHubIcon, ArrowRight, Spark, QuestionMarkArt } from "./icons";

const NewsSection = () => {
  const go = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    window.location.hash = href;
  };

  return (
    <section className="max-w-7xl mx-auto">
      <AnimatedSection>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-favella-cyan uppercase mb-3">Novità & Roadmap</p>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-favella-text-primary">
              A che punto siamo
            </h2>
          </div>
          <a
            href="#/aggiornamenti"
            onClick={(e) => go(e, "#/aggiornamenti")}
            className="inline-flex items-center gap-2 text-favella-cyan hover:text-favella-cyan-bright transition-colors text-sm font-medium"
          >
            Tutti gli aggiornamenti <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </AnimatedSection>

      <div className="grid lg:grid-cols-3 gap-5">
        {NEWS.map((n, i) => {
          const primary = n.emphasis === "primary";
          const secondary = n.emphasis === "secondary";
          return (
            <AnimatedSection key={n.title} delay={i * 90} className={primary ? "lg:col-span-2" : ""}>
              <article
                className={`h-full rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 ${
                  primary
                    ? "glass glow-border border-favella-cyan/20"
                    : secondary
                    ? "bg-favella-panel/40 border border-dashed border-favella-text-secondary/20"
                    : "glass"
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      primary
                        ? "bg-favella-amber/15 text-favella-amber"
                        : secondary
                        ? "bg-favella-text-secondary/10 text-favella-text-secondary"
                        : "bg-favella-emerald/10 text-favella-emerald"
                    }`}
                  >
                    {primary && <Spark className="w-3 h-3" />}
                    {n.tag}
                  </span>
                  <span className="text-[11px] text-favella-text-muted font-mono">{n.date}</span>
                </div>

                <h3
                  className={`font-display font-semibold mb-3 ${
                    primary ? "text-2xl text-white" : secondary ? "text-lg text-favella-text-secondary" : "text-lg text-favella-text-primary"
                  }`}
                >
                  {n.title}
                </h3>
                {n.art === "question" && (
                  <div className="mx-auto mb-4 w-full max-w-[180px]">
                    <QuestionMarkArt />
                  </div>
                )}

                <p className={`leading-relaxed ${primary ? "text-favella-text-secondary" : "text-sm text-favella-text-muted"}`}>
                  {n.body}
                </p>

                {n.cta &&
                  (n.cta.href.startsWith("#") ? (
                    <a
                      href={n.cta.href}
                      onClick={(e) => go(e, n.cta!.href)}
                      className="mt-5 inline-flex items-center gap-2 text-favella-cyan hover:text-favella-cyan-bright text-sm font-medium"
                    >
                      {n.cta.label} <ArrowRight className="w-4 h-4" />
                    </a>
                  ) : (
                    <a
                      href={n.cta.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex items-center gap-2 text-favella-cyan hover:text-favella-cyan-bright text-sm font-medium"
                    >
                      <GitHubIcon className="w-4 h-4" /> {n.cta.label}
                    </a>
                  ))}
              </article>
            </AnimatedSection>
          );
        })}
      </div>
    </section>
  );
};

export default NewsSection;
