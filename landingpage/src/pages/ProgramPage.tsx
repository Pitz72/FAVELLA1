import { useState } from "react";
import Playground from "../components/Playground";
import { Btn, Ink, PageHero, Reveal, Spot } from "../ui/primitives";
import { evidenzia } from "../ui/LivingBook";
import { ENGINE_VERSION } from "../constants";

const FEATURES = [
  { n: "01", title: "Errori autentici", body: "Se sbagli, leggi l'errore vero del compilatore, con il numero di riga. È lo stesso motore della CLI." },
  { n: "02", title: "La tua storia viaggia con te", body: "Scarichi il file .fav e lo apri con la CLI, o lo esporti in una pagina web da regalare a chi vuoi." },
  { n: "03", title: "Zero installazione", body: "Tutto gira nel browser. Apri, scrivi, gioca: la prima avventura in pochi minuti." },
];

const CODICE = [
  "L'Atrio Polveroso è una stanza.",
  "Una lanterna è una cosa.",
  "La lanterna è nell'atrio.",
  "La lanterna è prendibile.",
  'Invece di accendi la lanterna: dire "Un alone caldo riempie l\'atrio.".',
];

const ProgramPage = () => {
  const [aperto, setAperto] = useState(false);

  // Editor vero in overlay immersivo (logica INTOCCATA: componente Playground).
  if (aperto) {
    return (
      <div className="fixed inset-0 z-[200] overflow-y-auto bg-favella-void">
        <Playground onExit={() => setAperto(false)} />
      </div>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Il laboratorio"
        title={
          <>
            Programma con FAVELLA 1, <Ink>nel browser.</Ink>
          </>
        }
        lead={
          <>
            Non devi installare niente. La pagina «Programma» è il motore vero di FAVELLA: scrivi a sinistra, premi «Compila e gioca», provi a destra. Quando la storia
            ti piace, la scarichi come file <code className="rounded-md bg-favella-cyan/10 px-1.5 py-px font-mono text-favella-cyan-bright">.fav</code>.
          </>
        }
      >
        <Btn onClick={() => setAperto(true)} size="lg">
          Apri il laboratorio
        </Btn>
      </PageHero>

      {/* finestra d'esempio */}
      <section className="overflow-x-clip px-6 pb-16">
        <Reveal>
          <div className="relative mx-auto max-w-[1180px] [perspective:1800px]">
            <div aria-hidden="true" className="absolute -inset-10 -z-10 rounded-[48px] bg-[radial-gradient(60%_60%_at_50%_30%,rgba(34,211,238,0.18),transparent_70%)] blur-2xl" />
            <div className="overflow-hidden rounded-[24px] border border-favella-cyan/25 bg-favella-panel shadow-[0_60px_140px_-50px_rgba(0,0,0,0.95)] md:[transform:rotateX(2.5deg)]">
              <div className="flex items-center justify-between border-b border-favella-cyan/10 bg-favella-void/70 px-5 py-3.5">
                <div className="flex gap-2">
                  <span className="h-3 w-3 rounded-full bg-favella-flame/80" />
                  <span className="h-3 w-3 rounded-full bg-favella-amber/80" />
                  <span className="h-3 w-3 rounded-full bg-favella-emerald/80" />
                </div>
                <span className="font-mono text-[12px] text-favella-text-secondary">favella1 playground · la-mia-storia.fav</span>
                <span className="font-mono text-[11px] text-favella-emerald">● locale</span>
              </div>
              <div className="grid md:grid-cols-2">
                <div className="flex flex-col border-b border-favella-cyan/12 md:border-b-0 md:border-r">
                  <div className="border-b border-favella-cyan/8 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-favella-text-muted">Editor</div>
                  <div className="flex flex-1 p-5">
                    <div className="select-none pr-4 text-right font-mono text-[13px] leading-[1.95] text-[#3c536b]">
                      1<br />2<br />3<br />4<br />5
                    </div>
                    <pre className="m-0 whitespace-pre-wrap font-mono text-[13px] leading-[1.95] text-favella-text-primary">
                      {CODICE.map((r, i) => (
                        <div key={i}>{evidenzia(r)}</div>
                      ))}
                    </pre>
                  </div>
                  <div className="border-t border-favella-cyan/8 p-4">
                    <button
                      onClick={() => setAperto(true)}
                      className="btn-shine relative inline-flex items-center gap-2 rounded-full bg-brand-gradient px-5 py-2.5 font-display text-[13.5px] font-bold text-favella-void"
                    >
                      ▶ Compila e gioca
                    </button>
                  </div>
                </div>
                <div className="flex flex-col bg-favella-surface">
                  <div className="border-b border-favella-cyan/8 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-favella-text-muted">Terminale</div>
                  <div className="flex-1 p-5 font-mono text-[13.5px] leading-[1.9]">
                    <div className="text-favella-emerald">✓ Compilato — 0 errori, 0 ambiguità</div>
                    <div className="mt-3 text-favella-text-muted">&gt; guarda</div>
                    <div className="mt-0.5 font-display font-semibold text-favella-cyan">Atrio Polveroso</div>
                    <div className="text-favella-text-secondary">Puoi vedere qui: una lanterna.</div>
                    <div className="mt-3 text-favella-text-muted">&gt; accendi la lanterna</div>
                    <div className="mt-0.5 font-serif italic text-favella-text-primary">Un alone caldo riempie l'atrio.</div>
                    <div className="caret mt-3 text-favella-cyan">&gt;</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* tre punti */}
      <section className="px-6 pb-16">
        <div className="mx-auto grid max-w-[1180px] gap-5 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 90}>
              <Spot className="h-full p-8">
                <div className="mb-4 font-display text-[44px] font-bold leading-none tracking-[-0.05em] text-ink-accent">{f.n}</div>
                <h3 className="mb-2 font-display text-[20px] font-bold tracking-[-0.02em] text-favella-text-primary">{f.title}</h3>
                <p className="m-0 font-serif text-[15.5px] leading-[1.65] text-favella-text-secondary">{f.body}</p>
              </Spot>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="px-6 pb-8 text-center">
        <Btn onClick={() => setAperto(true)} size="lg">
          Apri il laboratorio
        </Btn>
        <p className="mt-6 font-mono text-[12px] text-favella-text-muted">
          motore FAVELLA v{ENGINE_VERSION} reale nel browser · il file .fav scaricato si apre con la CLI favella1
        </p>
      </section>
    </>
  );
};

export default ProgramPage;
