import { useState } from "react";
import Playground from "../components/Playground";

const FEATURES = [
  { color: "border-favella-cyan/40", title: "Errori autentici", body: "Se sbagli, leggi l'errore vero del compilatore, con il numero di riga. È lo stesso motore della CLI." },
  { color: "border-favella-emerald/40", title: "La tua storia viaggia con te", body: "Scarichi il file .fav e lo apri con la CLI, o lo esporti in una pagina web da regalare a chi vuoi." },
  { color: "border-favella-amber/40", title: "Zero installazione", body: "Tutto gira nel browser. Apri, scrivi, gioca — la prima avventura in pochi minuti." },
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

  // Vetrina in-chrome, stile redesign.
  return (
    <section className="px-6 pb-28 pt-[74px]">
      <div className="mx-auto max-w-[1080px]">
        {/* Hero */}
        <div className="max-w-[760px]">
          <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.26em] text-favella-cyan">Il laboratorio</p>
          <h1 className="mb-[22px] font-serif text-[clamp(36px,5.4vw,62px)] font-medium leading-[1.08] tracking-[-0.02em] text-favella-text-primary">
            Programma con FAVELLA 1,<br /><span className="italic text-ink-accent">nel browser</span>.
          </h1>
          <p className="font-serif text-[20px] leading-[1.6] text-favella-text-secondary">
            Non devi installare niente. La pagina «Programma» è il motore vero di FAVELLA: scrivi a sinistra, premi
            «Compila e gioca», provi a destra. Quando la storia ti piace, la scarichi come file{" "}
            <code className="rounded-[5px] bg-favella-cyan/10 px-1.5 py-px font-mono text-favella-cyan-bright">.fav</code>.
          </p>
        </div>

        {/* IDE mock */}
        <div className="mt-12 overflow-hidden rounded-[18px] border border-favella-cyan/16 bg-[#0b1726] shadow-[0_50px_120px_-50px_rgba(0,0,0,0.85)]">
          <div className="flex items-center justify-between border-b border-favella-cyan/10 bg-favella-void/70 px-[18px] py-3">
            <div className="flex gap-2">
              <span className="h-[11px] w-[11px] rounded-full bg-favella-flame/80" />
              <span className="h-[11px] w-[11px] rounded-full bg-favella-amber/80" />
              <span className="h-[11px] w-[11px] rounded-full bg-favella-emerald/80" />
            </div>
            <span className="font-mono text-[12px] text-favella-text-secondary">favella1 playground — la-mia-storia.fav</span>
            <span className="font-mono text-[11px] text-favella-emerald">● locale</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* editor */}
            <div className="flex flex-col border-b border-favella-cyan/12 md:border-b-0 md:border-r">
              <div className="border-b border-favella-cyan/8 px-[18px] py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-favella-text-muted">Editor</div>
              <div className="flex flex-1 p-4">
                <div className="select-none pr-3.5 text-right font-mono text-[13px] leading-[1.9] text-[#3c536b]">
                  1<br />2<br />3<br />4<br />5<br />6
                </div>
                <pre className="m-0 whitespace-pre-wrap font-mono text-[13px] leading-[1.9] text-favella-text-primary">
L'Atrio Polveroso <span className="text-favella-cyan">è una stanza</span>.{"\n"}
Una lanterna <span className="text-favella-cyan">è una cosa</span>.{"\n"}
La lanterna <span className="text-favella-cyan">è nell'</span>atrio.{"\n"}
La lanterna <span className="text-favella-cyan">è prendibile</span>.{"\n"}
<span className="text-favella-cyan">Invece di</span> accendi la lanterna<span className="text-favella-amber">:</span>{"\n"}
{"  "}<span className="text-favella-cyan">dire</span> <span className="text-favella-emerald">"Un alone caldo riempie l'atrio."</span>.
                </pre>
              </div>
              <div className="border-t border-favella-cyan/8 p-4">
                <button
                  onClick={() => setAperto(true)}
                  className="inline-flex items-center gap-2 rounded-[9px] bg-brand-gradient px-[18px] py-2.5 font-display text-[13px] font-bold text-favella-void"
                >
                  ▶ Compila e gioca
                </button>
              </div>
            </div>
            {/* output */}
            <div className="flex flex-col bg-favella-surface">
              <div className="border-b border-favella-cyan/8 px-[18px] py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-favella-text-muted">Terminale</div>
              <div className="flex-1 p-[18px] font-mono text-[13.5px] leading-[1.85]">
                <div className="text-favella-emerald">✓ Compilato — 0 errori, 0 ambiguità</div>
                <div className="mt-3 text-favella-text-muted">&gt; guarda</div>
                <div className="mt-0.5 font-display font-semibold text-favella-cyan">Atrio Polveroso</div>
                <div className="text-favella-text-secondary">Puoi vedere qui: una lanterna.</div>
                <div className="mt-3 text-favella-text-muted">&gt; accendi la lanterna</div>
                <div className="mt-0.5 font-serif italic text-favella-text-primary">Un alone caldo riempie l'atrio.</div>
                <div className="mt-3 flex items-center">
                  <span className="mr-1.5 text-favella-cyan">&gt;</span>
                  <span className="inline-block h-[15px] w-2 bg-favella-amber" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className={`border-l-2 ${f.color} p-6`}>
              <h3 className="mb-2 font-display text-[16px] font-semibold text-favella-text-primary">{f.title}</h3>
              <p className="m-0 text-[14px] leading-[1.6] text-favella-text-secondary">{f.body}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <button
            onClick={() => setAperto(true)}
            className="inline-block rounded-xl bg-brand-gradient px-8 py-[15px] font-display text-[15px] font-bold text-favella-void shadow-[0_16px_44px_-16px_rgba(34,211,238,0.6)] transition-transform duration-300 hover:-translate-y-0.5"
          >
            Apri il laboratorio
          </button>
          <p className="mt-5 font-mono text-[12px] text-favella-text-muted">
            motore FAVELLA v1.0.0 reale nel browser · il file .fav scaricato si apre con la CLI favella1
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProgramPage;
