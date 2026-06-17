import React from "react";
import { MANUAL_CONTENT, GITHUB_URL, MANUAL_PDF_URL } from "../constants";
import CodeBlock from "../components/CodeBlock";
import AnimatedSection from "../components/AnimatedSection";
import BrandMark from "../components/BrandMark";
import { Spark, GitHubIcon } from "../components/icons";

const ManualPage = () => {
  const parseInline = (line: string): React.ReactNode => {
    const parts = line
      .split(/(\*\*.*?\*\*|`.*?`)/g)
      .filter(Boolean)
      .map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**"))
          return <strong key={index} className="text-favella-text-primary font-semibold">{part.slice(2, -2)}</strong>;
        if (part.startsWith("`") && part.endsWith("`"))
          return <code key={index} className="bg-favella-cyan/10 text-favella-cyan-bright px-1.5 py-0.5 rounded text-sm font-mono border border-favella-cyan/20">{part.slice(1, -1)}</code>;
        return part;
      });
    return <>{parts}</>;
  };

  const render = (content: string) => {
    const parts = content.split(/(```favella[\s\S]*?```)/g);
    const els: React.ReactNode[] = [];
    let k = 0;

    parts.forEach((part) => {
      if (part.startsWith("```favella")) {
        const code = part.replace(/```favella\n?/g, "").replace(/```/g, "").trim();
        els.push(
          <div key={`cw-${k}`} className="my-7 rounded-xl overflow-hidden glow-border transition-transform duration-300 hover:-translate-y-0.5">
            <div className="flex items-center justify-between px-4 py-2 bg-favella-void/70 border-b border-favella-cyan/10">
              <span className="text-xs font-mono text-favella-text-secondary">esempio.fav</span>
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-favella-flame/60" />
                <span className="w-2 h-2 rounded-full bg-favella-amber/60" />
                <span className="w-2 h-2 rounded-full bg-favella-emerald/60" />
              </div>
            </div>
            <div className="bg-favella-void/40">
              <CodeBlock key={`c-${k++}`}>{code}</CodeBlock>
            </div>
          </div>
        );
      } else {
        let listItems: React.ReactNode[] = [];
        let listType: "ul" | "ol" | null = null;
        const flush = () => {
          if (listItems.length) {
            if (listType === "ul")
              els.push(<ul key={`ul-${k++}`} className="space-y-2 mb-6 text-favella-text-secondary">{listItems}</ul>);
            else els.push(<ol key={`ol-${k++}`} className="list-decimal pl-6 space-y-2 mb-6 text-favella-text-secondary">{listItems}</ol>);
            listItems = [];
            listType = null;
          }
        };

        part.trim().split("\n").forEach((line) => {
          const t = line.trim();
          if (!t) return;

          if (t.startsWith("#")) {
            flush();
            const level = t.match(/^#+/)?.[0].length || 1;
            const text = t.substring(level).trim();
            if (level === 1)
              els.push(
                <h1 key={`h1-${k++}`} className="font-display font-extrabold text-3xl md:text-4xl text-white tracking-tight mt-4 mb-6">
                  {parseInline(text)}
                </h1>
              );
            else if (level === 2)
              els.push(
                <h2 key={`h2-${k++}`} className="font-display text-2xl mt-12 mb-5 text-favella-text-primary flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-favella-cyan/10 text-favella-cyan text-sm flex items-center justify-center font-mono">#</span>
                  {parseInline(text)}
                </h2>
              );
            else if (level === 3)
              els.push(<h3 key={`h3-${k++}`} className="font-display text-lg mt-7 mb-3 text-favella-cyan font-semibold">{parseInline(text)}</h3>);
            else
              els.push(<h4 key={`h4-${k++}`} className="font-mono mt-5 mb-2 text-favella-emerald">{parseInline(text)}</h4>);
            return;
          }

          if (t === "---") {
            flush();
            els.push(<hr key={`hr-${k++}`} className="border-favella-text-secondary/10 my-10" />);
            return;
          }

          if (t.startsWith(">")) {
            flush();
            els.push(
              <blockquote key={`bq-${k++}`} className="my-7 pl-5 border-l-2 border-favella-amber/50 text-favella-text-secondary italic font-serif bg-favella-amber/5 py-3 pr-4 rounded-r-lg">
                {parseInline(t.substring(1).trim())}
              </blockquote>
            );
            return;
          }

          if (t.startsWith("* ")) {
            if (listType !== "ul") { flush(); listType = "ul"; }
            listItems.push(
              <li key={`li-${k++}`} className="relative pl-6">
                <span className="absolute left-0 top-2.5 w-1.5 h-1.5 bg-favella-cyan rounded-full" />
                {parseInline(t.substring(2))}
              </li>
            );
            return;
          }

          const ol = t.match(/^(\d+)\.\s+(.*)/);
          if (ol) {
            if (listType !== "ol") { flush(); listType = "ol"; }
            listItems.push(<li key={`li-${k++}`} className="pl-1">{parseInline(ol[2])}</li>);
            return;
          }

          flush();
          els.push(<p key={`p-${k++}`} className="mb-4 text-favella-text-secondary leading-7 text-[17px]">{parseInline(line)}</p>);
        });
        flush();
      }
    });
    return els;
  };

  return (
    <AnimatedSection>
      <div className="max-w-4xl mx-auto">
        <div className="glass rounded-3xl shadow-glow-card overflow-hidden">
          {/* Banner */}
          <div className="relative p-8 md:p-12 border-b border-favella-cyan/10 overflow-hidden">
            <div className="absolute -top-16 right-0 w-72 h-72 rounded-full bg-favella-emerald/10 blur-[110px] pointer-events-none" />
            <div className="relative flex items-center gap-5">
              <BrandMark size={72} />
              <div>
                <p className="font-mono text-favella-cyan text-sm">DOCUMENTAZIONE</p>
                <h1 className="font-display font-extrabold text-3xl text-white">Guida rapida</h1>
              </div>
            </div>

            {/* Avviso manuale completo */}
            <div className="relative mt-7 flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl bg-favella-emerald/10 border border-favella-emerald/20 p-4">
              <div className="flex items-start gap-3">
                <Spark className="w-5 h-5 text-favella-emerald shrink-0 mt-0.5 animate-flame-flicker" />
                <p className="text-sm text-favella-text-secondary">
                  <strong className="text-favella-text-primary">Il Manuale di Programmazione completo è disponibile.</strong>{" "}
                  Un PDF tipografico di 92 pagine — 21 capitoli — su tutti i costrutti. Questa pagina ne è la
                  guida rapida: l'essenziale della v1.0.0 per cominciare subito.
                </p>
              </div>
              <a
                href={MANUAL_PDF_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center justify-center gap-2 bg-favella-emerald/15 border border-favella-emerald/40 text-favella-emerald font-medium py-2.5 px-5 rounded-xl hover:bg-favella-emerald hover:text-favella-dark transition-all duration-300 whitespace-nowrap"
              >
                <Spark className="w-4 h-4" /> Scarica il PDF
              </a>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <article className="max-w-none">{render(MANUAL_CONTENT)}</article>

            <div className="mt-12 pt-8 border-t border-favella-text-secondary/10 text-center">
              <p className="text-favella-text-secondary text-sm mb-4">
                Specifica della grammatica, esempi e la demo «Il Relitto Silente» sono nel repository.
              </p>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-favella-cyan/10 border border-favella-cyan/30 text-favella-cyan font-medium py-3 px-7 rounded-xl hover:bg-favella-cyan hover:text-favella-dark transition-all duration-300"
              >
                <GitHubIcon className="w-5 h-5" /> Apri il repository
              </a>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
};

export default ManualPage;
