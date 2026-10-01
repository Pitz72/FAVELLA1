import CodeBlock from "../components/CodeBlock";
import { GITHUB_URL } from "../constants";
import { LIBRARY_MODULES } from "../data/library";
import { Ink, PageHero, Reveal, Spot } from "../ui/primitives";
import { evidenzia } from "../ui/LivingBook";

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
  <>
    <PageHero
      eyebrow="La libreria standard"
      title={
        <>
          Pezzi di mondo, <Ink>pronti da includere.</Ink>
        </>
      }
      lead={
        <>
          Moduli <code className="rounded-md bg-favella-cyan/10 px-1.5 py-px font-mono text-favella-cyan-bright">.fav</code> riusabili: li includi dopo aver dichiarato le
          stanze. Includere tutto è sicuro: le voci non usate non danno errori né avvisi.
        </>
      }
    >
      <div className="flex max-w-[760px] flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-favella-cyan/15 bg-favella-panel/70 px-6 py-5 backdrop-blur">
        <code className="font-mono text-[14px] text-favella-text-primary">{evidenzia('Includi "sinonimi.fav".').map((n, i) => <span key={i}>{n}</span>)}</code>
        <span className="text-[13px] text-favella-text-muted">oppure, con pip:</span>
        <code className="font-mono text-[14px] text-favella-emerald">favella1 libreria copia sinonimi</code>
      </div>
    </PageHero>

    <section className="px-6 pb-16">
      <div className="mx-auto flex max-w-[1000px] flex-col gap-7">
        {LIBRARY_MODULES.map((m, i) => (
          <Reveal key={m.id} delay={i * 80}>
            <Spot className="overflow-hidden !rounded-[28px]">
              <div className="px-8 pb-6 pt-8">
                <div className="mb-4 flex flex-wrap items-center gap-4">
                  <h2 className="m-0 font-display text-[28px] font-bold tracking-[-0.03em] text-favella-text-primary">{m.titolo}</h2>
                  <code className="font-mono text-[12.5px] text-favella-text-muted">{m.file}</code>
                  <button
                    onClick={() => scaricaModulo(m.file, m.codice)}
                    className="ml-auto rounded-full border border-favella-emerald/35 px-4 py-2 font-mono text-[11.5px] text-favella-emerald transition-colors hover:border-favella-emerald hover:bg-favella-emerald hover:text-favella-dark"
                  >
                    ⬇ Scarica
                  </button>
                </div>
                <p className="mb-5 max-w-[760px] font-serif text-[16px] leading-[1.7] text-favella-text-secondary">{m.blurb}</p>
                <div className="flex flex-wrap gap-2">
                  {m.esempi.map((e) => (
                    <span key={e} className="rounded-full border border-favella-emerald/25 px-3 py-1 font-mono text-[11.5px] text-favella-emerald">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
              <div className="border-t border-favella-cyan/10 bg-favella-void/50">
                <CodeBlock>{m.codice}</CodeBlock>
              </div>
            </Spot>
          </Reveal>
        ))}

        <p className="mt-2 text-center">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display text-[15px] font-semibold text-favella-cyan transition-colors hover:text-favella-cyan-bright"
          >
            I moduli completi su GitHub →
          </a>
        </p>
      </div>
    </section>
  </>
);

export default LibraryPage;
