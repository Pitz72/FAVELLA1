import { useState } from "react";
import { UPDATE_LOGS, NEWS, NEXT_EVOLUTIONS, DONE_EVOLUTIONS, GITHUB_URL, VERSION } from "../constants";
import AnimatedSection from "../components/AnimatedSection";
import { GitHubIcon, Spark, QuestionMarkArt } from "../components/icons";

// Etichette e colori per le aree della roadmap «oltre la 0.18».
const AREA_STYLE: Record<string, string> = {
  linguaggio: "bg-favella-cyan/10 text-favella-cyan",
  strumenti: "bg-favella-emerald/10 text-favella-emerald",
  ecosistema: "bg-favella-amber/15 text-favella-amber",
};

const UpdatesPage = () => {
  const [open, setOpen] = useState<number | null>(0);
  const roadmap = NEWS.filter((n) => n.emphasis === "primary" || n.emphasis === "secondary");

  return (
    <AnimatedSection>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="font-mono text-xs tracking-[0.2em] text-favella-cyan uppercase mb-3">Novità</p>
          <h1 className="font-display font-extrabold text-4xl md:text-5xl text-favella-text-primary">
            Stato del progetto & log
          </h1>
        </div>

        {/* Versione corrente */}
        <div className="glass glow-border rounded-2xl p-8 mb-10 text-center relative overflow-hidden">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-favella-cyan/10 blur-[110px] pointer-events-none" />
          <div className="relative">
            <p className="text-xs uppercase tracking-widest text-favella-text-secondary">Versione corrente</p>
            <p className="font-display font-extrabold text-5xl my-3 text-gradient-brand">v{VERSION}</p>
            <p className="text-favella-text-secondary max-w-xl mx-auto">
              Il traguardo: il linguaggio è completo e definitivo. Intorno, un ecosistema —
              installer per Windows, macOS e Linux, «pip install favella1», libreria di moduli e
              galleria di storie. 681 test verdi più 43 di collaudo, grammatica non ambigua.
            </p>
          </div>
        </div>

        {/* Roadmap */}
        <div className="grid sm:grid-cols-2 gap-4 mb-14">
          {roadmap.map((r) => {
            const primary = r.emphasis === "primary";
            return (
              <div
                key={r.title}
                className={`rounded-2xl p-6 ${
                  primary ? "glass border-favella-amber/20" : "bg-favella-panel/40 border border-dashed border-favella-text-secondary/20"
                }`}
              >
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full mb-3 ${
                    primary ? "bg-favella-amber/15 text-favella-amber" : "bg-favella-text-secondary/10 text-favella-text-secondary"
                  }`}
                >
                  {primary && <Spark className="w-3 h-3" />} {r.tag}
                </span>
                <h3 className={`font-display font-semibold mb-2 ${primary ? "text-white text-lg" : "text-favella-text-secondary"}`}>
                  {r.title}
                </h3>
                {r.art === "question" && (
                  <div className="mx-auto mb-3 w-full max-w-[140px]">
                    <QuestionMarkArt />
                  </div>
                )}
                <p className="text-sm text-favella-text-muted leading-relaxed">{r.body}</p>
                {r.cta && (
                  <a
                    href={r.cta.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-favella-amber hover:text-favella-amber/80 text-sm font-medium"
                  >
                    <Spark className="w-4 h-4" /> {r.cta.label}
                  </a>
                )}
              </div>
            );
          })}
        </div>

        {/* Già realizzato — evoluzioni passate dalla bacheca al motore */}
        <div className="mb-14">
          <h2 className="font-display font-semibold text-xl text-favella-text-primary mb-2">
            Già realizzato
          </h2>
          <p className="text-sm text-favella-text-secondary mb-5">
            Molte delle evoluzioni che fino a poco fa erano «in arrivo» sono ora dentro il motore.
            Un riepilogo di ciò che è entrato dalla v0.18 in poi.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DONE_EVOLUTIONS.map((e) => (
              <div key={e.title} className="rounded-2xl bg-favella-panel/40 border border-favella-emerald/15 p-5">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full mb-2.5 bg-favella-emerald/10 text-favella-emerald">
                  ✓ fatto · {e.area}
                </span>
                <h3 className="font-display font-semibold text-favella-text-primary mb-1.5">{e.title}</h3>
                <p className="text-sm text-favella-text-muted leading-relaxed">{e.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Prossime evoluzioni — la direzione oltre la v1.0.0 */}
        <div className="mb-14">
          <h2 className="font-display font-semibold text-xl text-favella-text-primary mb-2">
            Prossime evoluzioni
          </h2>
          <p className="text-sm text-favella-text-secondary mb-5">
            Il linguaggio è completo, ma il progetto non è finito: la rotta ora guarda
            all'ecosistema intorno alle storie. L'ordine non è una promessa, è un piano.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {NEXT_EVOLUTIONS.map((e) => (
              <div key={e.title} className="rounded-2xl glass p-5">
                <span
                  className={`inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full mb-2.5 ${AREA_STYLE[e.area]}`}
                >
                  {e.area}
                </span>
                <h3 className="font-display font-semibold text-favella-text-primary mb-1.5">{e.title}</h3>
                <p className="text-sm text-favella-text-muted leading-relaxed">{e.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline changelog */}
        <h2 className="font-display font-semibold text-xl text-favella-text-primary mb-4">Log di sviluppo</h2>
        <div className="relative pl-6 border-l border-favella-cyan/15">
          {UPDATE_LOGS.map((log, i) => {
            const isOpen = open === i;
            return (
              <div key={log.version} className="relative mb-2">
                <span className="absolute -left-[31px] top-5 w-3 h-3 rounded-full bg-favella-cyan ring-4 ring-favella-void" />
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full text-left py-4 flex items-start justify-between gap-4 group"
                  aria-expanded={isOpen}
                >
                  <span className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-favella-cyan/10 text-favella-cyan border border-favella-cyan/20">
                      v{log.version}
                    </span>
                    <span className="font-display text-favella-text-primary group-hover:text-favella-cyan transition-colors">
                      {log.title}
                    </span>
                  </span>
                  <svg
                    className={`w-4 h-4 mt-1 shrink-0 text-favella-text-secondary transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    <p className="pb-5 pr-4 text-favella-text-secondary leading-relaxed">{log.content}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-favella-cyan/10 border border-favella-cyan/30 text-favella-cyan font-medium py-3 px-7 rounded-xl hover:bg-favella-cyan hover:text-favella-dark transition-all duration-300"
          >
            <GitHubIcon className="w-5 h-5" /> Changelog completo su GitHub
          </a>
        </div>
      </div>
    </AnimatedSection>
  );
};

export default UpdatesPage;
