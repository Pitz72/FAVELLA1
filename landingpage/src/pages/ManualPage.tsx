import React from "react";
import { MANUAL_CONTENT, MANUAL_PDF_URL } from "../constants";
import CodeBlock from "../components/CodeBlock";
import ManualBanner from "../components/ManualBanner";
import { navigate } from "../router";

const goHash = (href: string) => {
  navigate(href);
};

// Inline: **grassetto** e `codice`.
const parseInline = (line: string): React.ReactNode => {
  const parts = line
    .split(/(\*\*.*?\*\*|`.*?`)/g)
    .filter(Boolean)
    .map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return (
          <strong key={i} className="font-semibold text-favella-text-primary">
            {part.slice(2, -2)}
          </strong>
        );
      if (part.startsWith("`") && part.endsWith("`"))
        return (
          <code key={i} className="rounded-[5px] border border-favella-cyan/15 bg-favella-cyan/10 px-1.5 py-0.5 font-mono text-[0.9em] text-favella-cyan-bright">
            {part.slice(1, -1)}
          </code>
        );
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  return <>{parts}</>;
};

// Render markdown editoriale del MANUAL_CONTENT (fonte di verità).
const render = (content: string): React.ReactNode[] => {
  const parts = content.split(/(```favella[\s\S]*?```)/g);
  const els: React.ReactNode[] = [];
  let k = 0;

  parts.forEach((part) => {
    if (part.startsWith("```favella")) {
      const code = part.replace(/```favella\n?/g, "").replace(/```/g, "").trim();
      els.push(
        <div key={`cw-${k++}`} className="my-7 overflow-hidden rounded-[14px] border border-favella-cyan/14 bg-favella-panel">
          <CodeBlock>{code}</CodeBlock>
        </div>
      );
      return;
    }

    let listItems: React.ReactNode[] = [];
    let listType: "ul" | "ol" | null = null;
    const flush = () => {
      if (listItems.length) {
        els.push(
          listType === "ul" ? (
            <ul key={`ul-${k++}`} className="mb-6 space-y-2 text-favella-text-secondary">{listItems}</ul>
          ) : (
            <ol key={`ol-${k++}`} className="mb-6 list-decimal space-y-2 pl-6 text-favella-text-secondary">{listItems}</ol>
          )
        );
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
        if (level === 1) {
          els.push(
            <h2 key={`h1-${k++}`} className="mb-5 mt-14 font-serif text-[clamp(24px,3vw,32px)] font-semibold text-favella-text-primary">
              {parseInline(text)}
            </h2>
          );
        } else if (level === 2) {
          const m = text.match(/^(\d+)\.\s*(.*)/);
          const marker = m ? m[1].padStart(2, "0") : text.toLowerCase().includes("domande") ? "?" : "§";
          const title = m ? m[2] : text;
          els.push(
            <div key={`h2-${k++}`} className="mb-[18px] mt-14 flex items-baseline gap-3.5">
              <span className="font-mono text-[13px] text-favella-amber">{marker}</span>
              <h2 className="m-0 font-serif text-[clamp(24px,3vw,32px)] font-semibold text-favella-text-primary">{parseInline(title)}</h2>
            </div>
          );
        } else if (level === 3) {
          els.push(
            <h3 key={`h3-${k++}`} className="mb-2 mt-8 font-display text-[16px] font-semibold text-favella-text-primary">
              {parseInline(text)}
            </h3>
          );
        } else {
          els.push(
            <h4 key={`h4-${k++}`} className="mb-2 mt-5 font-mono text-[13px] uppercase tracking-wider text-favella-emerald">
              {parseInline(text)}
            </h4>
          );
        }
        return;
      }

      if (t === "---") {
        flush();
        els.push(<hr key={`hr-${k++}`} className="my-10 border-favella-text-secondary/10" />);
        return;
      }

      if (t.startsWith(">")) {
        flush();
        els.push(
          <blockquote key={`bq-${k++}`} className="my-7 border-l-2 border-favella-amber/50 pl-6 font-serif text-[17px] italic leading-[1.6] text-favella-text-secondary">
            {parseInline(t.substring(1).trim())}
          </blockquote>
        );
        return;
      }

      if (t.startsWith("* ")) {
        if (listType !== "ul") { flush(); listType = "ul"; }
        listItems.push(
          <li key={`li-${k++}`} className="relative pl-6 text-[15px] leading-[1.65]">
            <span className="absolute left-0 top-[10px] h-1.5 w-1.5 rounded-full bg-favella-cyan" />
            {parseInline(t.substring(2))}
          </li>
        );
        return;
      }

      const ol = t.match(/^(\d+)\.\s+(.*)/);
      if (ol) {
        if (listType !== "ol") { flush(); listType = "ol"; }
        listItems.push(<li key={`li-${k++}`} className="pl-1 text-[15px] leading-[1.65]">{parseInline(ol[2])}</li>);
        return;
      }

      flush();
      els.push(
        <p key={`p-${k++}`} className="mb-5 font-serif text-[17px] leading-[1.7] text-[#c4d3e2]">
          {parseInline(line.trim())}
        </p>
      );
    });
    flush();
  });
  return els;
};

const ManualPage = () => {
  // Salta il titolo + l'intro del markdown (li sostituisce l'hero del redesign):
  // tutto dopo il primo divisore «---».
  const sep = MANUAL_CONTENT.indexOf("\n---\n");
  const body = sep >= 0 ? MANUAL_CONTENT.slice(sep + 5).trim() : MANUAL_CONTENT;

  // Indice: i titoli di 2° livello del corpo.
  const chips = body
    .split("\n")
    .filter((l) => /^##\s/.test(l))
    .map((l) => l.replace(/^##\s+/, "").replace(/\s*\(FAQ\)\s*$/, ""));

  return (
    <section className="px-6 pb-28 pt-[74px]">
      {/* Hero */}
      <div className="mx-auto max-w-[820px]">
        <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.26em] text-favella-cyan">Guida rapida · v1.0.0</p>
        <h1 className="mb-[22px] font-serif text-[clamp(36px,5.4vw,62px)] font-medium leading-[1.08] tracking-[-0.02em] text-favella-text-primary">
          La sintassi, in <span className="italic text-ink-accent">una panoramica</span>.
        </h1>
        <p className="mb-[18px] font-serif text-[20px] leading-[1.6] text-favella-text-secondary">
          La filosofia è una sola: <strong className="font-semibold text-favella-text-primary">il tuo codice è una storia.</strong>{" "}
          Scrivi frasi in italiano, ognuna chiusa da un punto{" "}
          <code className="rounded-[5px] bg-favella-cyan/10 px-1.5 py-px font-mono text-favella-cyan-bright">.</code> ; i commenti
          iniziano con <code className="rounded-[5px] bg-favella-cyan/10 px-1.5 py-px font-mono text-favella-cyan-bright">#</code>.
        </p>
        <p className="m-0 text-[14.5px] leading-[1.6] text-favella-text-muted">
          Per la trattazione organica di tutti i costrutti c'è il Manuale di Programmazione completo — 84 pagine, 21
          capitoli, in PDF su GitHub.
        </p>

        {/* Indice */}
        <div className="mb-2.5 mt-9 flex flex-wrap gap-2">
          {chips.map((c) => (
            <span key={c} className="rounded-full border border-favella-cyan/18 px-3 py-1.5 font-mono text-[12px] text-favella-text-secondary">
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Banner: il manuale cartaceo è uscito */}
      <div className="mx-auto mt-12 max-w-[820px]">
        <ManualBanner />
      </div>

      {/* Corpo */}
      <div className="mx-auto mt-14 max-w-[820px]">
        <article>{render(body)}</article>

        {/* CTA */}
        <div className="mt-14 rounded-[20px] border border-favella-cyan/14 bg-gradient-to-b from-favella-surface/50 to-favella-panel/35 px-8 py-11 text-center">
          <h2 className="mb-3.5 font-serif text-[clamp(22px,3vw,30px)] font-medium text-favella-text-primary">Vai più a fondo.</h2>
          <p className="mx-auto mb-7 max-w-[520px] text-[15px] leading-[1.6] text-favella-text-secondary">
            Il Manuale di Programmazione completo — 84 pagine, 21 capitoli — tratta ogni costrutto nel dettaglio, con la
            Casa di Via Stradivari come esempio dall'inizio alla fine.
          </p>
          <div className="flex flex-wrap justify-center gap-3.5">
            <a
              href={MANUAL_PDF_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-brand-gradient px-[26px] py-3.5 font-display text-[15px] font-bold text-favella-void transition-transform duration-300 hover:-translate-y-0.5"
            >
              Scarica il manuale (PDF)
            </a>
            <a
              href="/corso"
              onClick={(e) => { e.preventDefault(); goHash("/corso"); }}
              className="cursor-pointer rounded-xl border border-favella-cyan/25 bg-favella-surface/40 px-[26px] py-3.5 font-display text-[15px] font-semibold text-favella-text-primary transition-colors hover:border-favella-cyan/50"
            >
              Impara col corso
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ManualPage;
