import AnimatedSection from "../components/AnimatedSection";
import CodeBlock from "../components/CodeBlock";
import { GitHubIcon, Spark } from "../components/icons";
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
  <AnimatedSection>
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <p className="font-mono text-xs tracking-[0.2em] text-favella-cyan uppercase mb-3">Ecosistema</p>
        <h1 className="font-display font-extrabold text-4xl md:text-5xl text-favella-text-primary">
          La Libreria standard
        </h1>
        <p className="mt-4 text-favella-text-secondary max-w-2xl mx-auto leading-relaxed">
          Pezzi di mondo già pronti: moduli <span className="font-mono text-favella-text-primary">.fav</span> con
          sinonimi, proprietà e verbi che ricorrono in quasi ogni avventura. Li includi nella tua storia e non li
          riscrivi ogni volta. Includere un modulo per intero è sicuro: le voci che non usi non danno errori né avvisi.
        </p>
      </div>

      {/* Come si usano */}
      <div className="glass glow-border rounded-2xl p-6 mb-10">
        <h2 className="font-display font-semibold text-lg text-favella-text-primary mb-3">Come si usano</h2>
        <p className="text-sm text-favella-text-secondary leading-relaxed mb-4">
          Un modulo è un frammento di sorgente: il preprocessore lo espande nel tuo file prima della compilazione.
          Metti le direttive <strong className="text-favella-text-primary">dopo</strong> aver dichiarato le stanze.
          Se hai i file accanto alla tua storia:
        </p>
        <div className="rounded-lg bg-favella-void/60 border border-favella-cyan/10">
          <CodeBlock>{`Includi "sinonimi.fav".\nIncludi "proprieta.fav".\nIncludi "verbi.fav".`}</CodeBlock>
        </div>
        <p className="text-sm text-favella-text-secondary leading-relaxed mt-4">
          Se hai installato FAVELLA con <span className="font-mono text-favella-text-primary">pip</span>, i moduli
          vivono dentro il pacchetto: copiali nella cartella del tuo gioco con un comando, poi includili come sopra.
        </p>
        <div className="rounded-lg bg-favella-void/60 border border-favella-cyan/10 mt-3">
          <CodeBlock>{`favella1 libreria                 # elenca i moduli disponibili\nfavella1 libreria copia sinonimi  # copia sinonimi.fav nella cartella corrente\nfavella1 libreria copia --tutti   # copia tutti i moduli`}</CodeBlock>
        </div>
      </div>

      {/* I moduli */}
      <div className="space-y-8">
        {LIBRARY_MODULES.map((m) => (
          <div key={m.id} className="glass rounded-2xl overflow-hidden border border-favella-emerald/15">
            <div className="p-6 border-b border-favella-emerald/10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-favella-emerald">
                    {m.file}
                  </span>
                  <h3 className="font-display font-bold text-xl text-favella-text-primary mt-1">{m.titolo}</h3>
                </div>
                <button
                  onClick={() => scaricaModulo(m.file, m.codice)}
                  className="shrink-0 inline-flex items-center justify-center gap-2 bg-favella-emerald/15 border border-favella-emerald/40 text-favella-emerald font-medium py-2.5 px-5 rounded-xl hover:bg-favella-emerald hover:text-favella-dark transition-all duration-300 whitespace-nowrap"
                >
                  <Spark className="w-4 h-4" /> Scarica {m.file}
                </button>
              </div>
              <p className="mt-3 text-sm text-favella-text-secondary leading-relaxed">{m.blurb}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {m.esempi.map((e) => (
                  <span
                    key={e}
                    className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-favella-cyan/10 text-favella-cyan border border-favella-cyan/15"
                  >
                    {e}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-favella-void/40">
              <CodeBlock>{m.codice}</CodeBlock>
            </div>
          </div>
        ))}
      </div>

      {/* Nota direzioni */}
      <div className="mt-10 rounded-xl bg-favella-amber/10 border border-favella-amber/20 p-5">
        <p className="text-sm text-favella-text-secondary leading-relaxed">
          <strong className="text-favella-text-primary">Una nota.</strong> Per dare un nome a una{" "}
          <em>direzione</em> non si usa <span className="font-mono text-favella-text-primary">è come</span> (rimappa
          solo i verbi): dichiara una coppia di direzioni opposte, ad esempio{" "}
          <span className="font-mono text-favella-text-primary">Sinistra e destra sono direzioni opposte.</span>
        </p>
      </div>

      <div className="mt-10 text-center">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-favella-cyan/10 border border-favella-cyan/30 text-favella-cyan font-medium py-3 px-7 rounded-xl hover:bg-favella-cyan hover:text-favella-dark transition-all duration-300"
        >
          <GitHubIcon className="w-5 h-5" /> I moduli nel repository
        </a>
      </div>
    </div>
  </AnimatedSection>
);

export default LibraryPage;
