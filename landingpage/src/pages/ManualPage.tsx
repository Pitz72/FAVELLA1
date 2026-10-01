import React from "react";
import { MANUAL_CONTENT, MANUAL_PDF_URL, ENGINE_VERSION, MANUAL_PDF_PAGES } from "../constants";
import CodeBlock from "../components/CodeBlock";
import ManualBanner from "../components/ManualBanner";
import { Btn, Ink, PageHero, Reveal } from "../ui/primitives";

// Inline: **grassetto**, *corsivo* e `codice`.
const parseInline = (line: string): React.ReactNode => {
  const parts = line
    .split(/(\*\*.*?\*\*|`.*?`|\*[^*\s][^*]*?\*)/g)
    .filter(Boolean)
    .map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return (
          <strong key={i} className="font-semibold text-favella-text-primary">
            {part.slice(2, -2)}
          </strong>
        );
      if (part.length > 2 && part.startsWith("*") && part.endsWith("*"))
        return (
          <em key={i} className="italic text-favella-text-primary">
            {part.slice(1, -1)}
          </em>
        );
      if (part.startsWith("`") && part.endsWith("`"))
        return (
          <code key={i} className="rounded-[6px] border border-favella-cyan/15 bg-favella-cyan/10 px-1.5 py-0.5 font-mono text-[0.9em] text-favella-cyan-bright">
            {part.slice(1, -1)}
          </code>
        );
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  return <>{parts}</>;
};

const slug = (t: string): string =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// Render markdown editoriale del MANUAL_CONTENT (fonte di verità).
const render = (content: string): React.ReactNode[] => {
  const parts = content.split(/(```favella[\s\S]*?```)/g);
  const els: React.ReactNode[] = [];
  let k = 0;

  parts.forEach((part) => {
    if (part.startsWith("```favella")) {
      const code = part.replace(/```favella\n?/g, "").replace(/```/g, "").trim();
      els.push(
        <div key={`cw-${k++}`} className="my-8 overflow-hidden rounded-2xl border border-favella-cyan/15 bg-favella-panel shadow-[0_30px_70px_-40px_rgba(0,0,0,0.9)]">
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
            <ul key={`ul-${k++}`} className="mb-6 space-y-2.5 text-favella-text-secondary">{listItems}</ul>
          ) : (
            <ol key={`ol-${k++}`} className="mb-6 list-decimal space-y-2.5 pl-6 text-favella-text-secondary">{listItems}</ol>
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
            <h2 key={`h1-${k++}`} className="mb-5 mt-16 font-display text-[clamp(26px,3.2vw,38px)] font-bold tracking-[-0.03em] text-favella-text-primary">
              {parseInline(text)}
            </h2>
          );
        } else if (level === 2) {
          const m = text.match(/^(\d+)\.\s*(.*)/);
          const marker = m ? m[1].padStart(2, "0") : text.toLowerCase().includes("domande") ? "?" : "§";
          const title = m ? m[2] : text;
          els.push(
            <div key={`h2-${k++}`} id={slug(text.replace(/\s*\(FAQ\)\s*$/, ""))} className="mb-5 mt-16 flex scroll-mt-28 items-baseline gap-4">
              <span className="font-mono text-[14px] text-favella-amber">{marker}</span>
              <h2 className="m-0 font-display text-[clamp(26px,3.2vw,38px)] font-bold tracking-[-0.03em] text-favella-text-primary">{parseInline(title)}</h2>
            </div>
          );
        } else if (level === 3) {
          els.push(
            <h3 key={`h3-${k++}`} className="mb-2.5 mt-10 font-display text-[18px] font-bold tracking-[-0.01em] text-favella-text-primary">
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
        els.push(<hr key={`hr-${k++}`} className="my-12 border-favella-text-secondary/10" />);
        return;
      }

      if (t.startsWith(">")) {
        flush();
        els.push(
          <blockquote key={`bq-${k++}`} className="my-8 border-l-2 border-favella-amber/50 pl-6 font-serif text-[18px] italic leading-[1.65] text-favella-text-secondary">
            {parseInline(t.substring(1).trim())}
          </blockquote>
        );
        return;
      }

      if (t.startsWith("* ")) {
        if (listType !== "ul") { flush(); listType = "ul"; }
        listItems.push(
          <li key={`li-${k++}`} className="relative pl-6 text-[16px] leading-[1.7]">
            <span className="absolute left-0 top-[11px] h-1.5 w-1.5 rounded-full bg-favella-cyan" />
            {parseInline(t.substring(2))}
          </li>
        );
        return;
      }

      const ol = t.match(/^(\d+)\.\s+(.*)/);
      if (ol) {
        if (listType !== "ol") { flush(); listType = "ol"; }
        listItems.push(<li key={`li-${k++}`} className="pl-1 text-[16px] leading-[1.7]">{parseInline(ol[2])}</li>);
        return;
      }

      flush();
      els.push(
        <p key={`p-${k++}`} className="mb-5 font-serif text-[18px] leading-[1.75] text-[#c4d3e2]">
          {parseInline(line.trim())}
        </p>
      );
    });
    flush();
  });
  return els;
};

const ManualPage = () => {
  // Salta il titolo + l'intro del markdown (li sostituisce la testata): tutto dopo il primo «---».
  const sep = MANUAL_CONTENT.indexOf("\n---\n");
  const body = sep >= 0 ? MANUAL_CONTENT.slice(sep + 5).trim() : MANUAL_CONTENT;

  // Indice: i titoli di 2° livello del corpo.
  const chips = body
    .split("\n")
    .filter((l) => /^##\s/.test(l))
    .map((l) => l.replace(/^##\s+/, "").replace(/\s*\(FAQ\)\s*$/, ""));

  return (
    <>
      <PageHero
        eyebrow={`Guida rapida · v${ENGINE_VERSION}`}
        title={
          <>
            La sintassi, in <Ink>una panoramica.</Ink>
          </>
        }
        lead={
          <>
            La filosofia è una sola: <strong className="font-semibold text-favella-text-primary">il tuo codice è una storia.</strong> Scrivi frasi in italiano,
            ognuna chiusa da un punto <code className="rounded-md bg-favella-cyan/10 px-1.5 py-px font-mono text-favella-cyan-bright">.</code>; i commenti iniziano con{" "}
            <code className="rounded-md bg-favella-cyan/10 px-1.5 py-px font-mono text-favella-cyan-bright">#</code>.
          </>
        }
      >
        <p className="m-0 max-w-[620px] text-[15px] leading-[1.65] text-favella-text-muted">
          Per la trattazione organica di tutti i costrutti c'è il Manuale di Programmazione completo: {MANUAL_PDF_PAGES} pagine, 21 capitoli, in PDF su GitHub.
        </p>
      </PageHero>

      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-[1180px] gap-14 lg:grid-cols-[250px_1fr]">
          {/* indice */}
          <nav aria-label="In questa pagina" className="hidden lg:block">
            <div className="sticky top-28">
              <p className="mb-4 font-mono text-[10.5px] uppercase tracking-[0.24em] text-favella-text-muted">In questa pagina</p>
              <ul className="space-y-1 border-l border-favella-cyan/15">
                {chips.map((c) => (
                  <li key={c}>
                    <a
                      href={`#${slug(c)}`}
                      className="-ml-px block border-l border-transparent py-1.5 pl-4 text-[14px] text-favella-text-secondary transition-colors hover:border-favella-cyan hover:text-favella-cyan-bright"
                    >
                      {c}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="min-w-0 max-w-[820px]">
            {/* indice per telefono */}
            <div className="mb-10 flex flex-wrap gap-2 lg:hidden">
              {chips.map((c) => (
                <a key={c} href={`#${slug(c)}`} className="rounded-full border border-favella-cyan/20 px-3 py-1.5 font-mono text-[12px] text-favella-text-secondary hover:border-favella-cyan/60">
                  {c}
                </a>
              ))}
            </div>
            <article>{render(body)}</article>
          </div>
        </div>
      </section>

      {/* Il libro */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-[1180px]">
          <ManualBanner variant="compact" />
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-8">
        <Reveal>
          <div className="mx-auto max-w-[900px] rounded-[32px] border border-favella-cyan/20 bg-[radial-gradient(80%_120%_at_50%_0%,rgba(34,211,238,0.12),transparent_60%),linear-gradient(180deg,#0b1a28,#060d17)] px-8 py-14 text-center">
            <h2 className="mb-4 font-display text-[clamp(28px,4vw,46px)] font-bold tracking-[-0.04em] text-favella-text-primary">
              Vai più <Ink>a fondo.</Ink>
            </h2>
            <p className="mx-auto mb-8 max-w-[560px] font-serif text-[17px] leading-[1.65] text-favella-text-secondary">
              Il Manuale di Programmazione completo — {MANUAL_PDF_PAGES} pagine, 21 capitoli — tratta ogni costrutto nel dettaglio, con la Casa di Via Stradivari come
              esempio dall'inizio alla fine.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Btn href={MANUAL_PDF_URL} size="lg">
                Scarica il manuale (PDF)
              </Btn>
              <Btn to="/corso" variant="ghost" size="lg">
                Impara col corso
              </Btn>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
};

export default ManualPage;
