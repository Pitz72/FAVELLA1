import CodeBlock from "../components/CodeBlock";
import { GITHUB_URL } from "../constants";
import { LIBRARY_MODULES } from "../data/library";

const scaricaModulo = (file: string, codice: string) => {
  const blob = new Blob([codice], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const LibraryPage = () => (
  <section className="px-6 pb-28 pt-[74px]">
    {/* Hero */}
    <div className="mx-auto max-w-[840px]">
      <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.26em] text-favella-cyan">La Libreria standard</p>
      <h1 className="mb-[22px] font-serif text-[clamp(36px,5.4vw,62px)] font-medium leading-[1.08] tracking-[-0.02em] text-favella-text-primary">
        Pezzi di mondo,<br /><span className="italic text-ink-accent">pronti da includere</span>.
      </h1>
      <p className="mb-[22px] font-serif text-[20px] leading-[1.6] text-favella-text-secondary">
        Moduli <code className="rounded-[5px] bg-favella-cyan/10 px-1.5 py-px font-mono text-favella-cyan-bright">.fav</code> riusabili:
        li includi dopo aver dichiarato le stanze. Includere tutto è sicuro — le voci non usate non danno errori né avvisi.
      </p>
      <div className="flex flex-wrap items-center gap-[18px] rounded-[12px] border border-favella-cyan/14 bg-favella-panel px-5 py-4">
        <code className="font-mono text-[13.5px] text-favella-text-primary">
          <span className="text-favella-cyan">Includi</span> <span className="text-favella-emerald">"sinonimi.fav"</span>.
        </code>
        <span className="text-[13px] text-favella-text-muted">oppure, con pip:</span>
        <code className="font-mono text-[13.5px] text-favella-emerald">favella1 libreria copia sinonimi</code>
      </div>
    </div>

    {/* Moduli */}
    <div className="mx-auto mt-[46px] flex max-w-[840px] flex-col gap-7">
      {LIBRARY_MODULES.map((m) => (
        <div key={m.id} className="overflow-hidden rounded-[18px] border border-favella-cyan/14 bg-gradient-to-b from-favella-surface/45 to-favella-panel/30">
          <div className="px-7 pb-[22px] pt-[26px]">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h2 className="m-0 font-serif text-[23px] font-semibold text-favella-text-primary">{m.titolo}</h2>
              <code className="font-mono text-[12px] text-favella-text-muted">{m.file}</code>
              <button
                onClick={() => scaricaModulo(m.file, m.codice)}
                className="ml-auto rounded-lg border border-favella-emerald/30 px-3 py-1.5 font-mono text-[11px] text-favella-emerald transition-colors hover:border-favella-emerald hover:bg-favella-emerald hover:text-favella-dark"
              >
                ⬇ Scarica
              </button>
            </div>
            <p className="mb-4 text-[14.5px] leading-[1.65] text-favella-text-secondary">{m.blurb}</p>
            <div className="flex flex-wrap gap-[7px]">
              {m.esempi.map((e) => (
                <span key={e} className="rounded-full border border-favella-emerald/25 px-2.5 py-1 font-mono text-[11px] text-favella-emerald">
                  {e}
                </span>
              ))}
            </div>
          </div>
          <div className="border-t border-favella-cyan/10 bg-favella-panel">
            <CodeBlock>{m.codice}</CodeBlock>
          </div>
        </div>
      ))}

      <p className="mt-2 text-center">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-display text-[14px] font-semibold text-favella-cyan transition-colors hover:text-favella-cyan-bright"
        >
          I moduli completi su GitHub →
        </a>
      </p>
    </div>
  </section>
);

export default LibraryPage;
