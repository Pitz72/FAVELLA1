import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Primo, Pulsantiera, Secondo, VerboPulsante } from "../lib/favellaRuntime";

// ====================================================================
//  Pulsanti-verbo (motore 1.4.0): il giocatore compone la frase toccando
//  un verbo, un oggetto e, se serve, un secondo oggetto. Le frasi arrivano
//  dal motore già scritte in italiano ('alla guardia', 'nella cassa'): qui
//  si accostano e si mandano come un comando qualunque. Vedi gioco.pulsanti.
// ====================================================================

type Scelta = { verbo: VerboPulsante; primo: Primo | null } | null;

const base =
  "rounded-md border px-2.5 py-1 font-mono text-[12px] transition-colors md:text-[13px]";
const normale = `${base} border-favella-cyan/25 bg-favella-void/40 text-favella-text-primary hover:border-favella-cyan/60 hover:text-favella-cyan`;
const attivo = `${base} border-favella-cyan bg-favella-cyan text-favella-dark`;
const tenue = `${base} border-favella-text-secondary/20 text-favella-text-secondary hover:text-favella-text-primary`;

const Gruppo = ({ titolo, children }: { titolo?: string; children: ReactNode[] }) =>
  children.length === 0 ? null : (
    <div className="flex flex-wrap items-center gap-1.5">
      {titolo && (
        <span className="w-full font-mono text-[10px] uppercase tracking-[0.16em] text-favella-text-muted">
          {titolo}
        </span>
      )}
      {children}
    </div>
  );

const secondiDi = (v: VerboPulsante, primo: Primo): Secondo[] => {
  const lista = v.secondi_per ? v.secondi_per[primo.id] ?? [] : v.secondi ?? [];
  return lista.filter((s) => s.id === undefined || s.id !== primo.id);
};

const TITOLI_FASE: Record<string, string> = {
  dialogo: "Rispondi",
  conferma: "Conferma",
  scelta: "Quale intendi?",
  fine: "La partita è finita",
};

const PulsantiVerbo = ({ p, onComando }: { p: Pulsantiera; onComando: (cmd: string) => void }) => {
  const [scelta, setScelta] = useState<Scelta>(null);

  // Un turno nuovo porta pulsanti nuovi: la frase a metà si lascia cadere.
  useEffect(() => setScelta(null), [p]);

  const invia = (cmd: string) => {
    setScelta(null);
    onComando(cmd);
  };

  if (p.fase !== "gioco") {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-favella-text-muted">
          {TITOLI_FASE[p.fase] ?? ""}
        </span>
        {p.scelte.map((s) => (
          <button key={s.comando} onClick={() => invia(s.comando)} className={`${normale} text-left`}>
            {s.etichetta}
          </button>
        ))}
      </div>
    );
  }

  const oggetto = (id: string) => p.oggetti.find((o) => o.id === id);
  const scegliVerbo = (v: VerboPulsante) => {
    if (!v.oggetto) return invia(v.verbo);
    setScelta(scelta && scelta.verbo === v ? null : { verbo: v, primo: null });
  };
  const scegliPrimo = (v: VerboPulsante, primo: Primo) => {
    const secondi = secondiDi(v, primo);
    if (v.secondo === "no" || secondi.length === 0) return invia(`${v.verbo} ${primo.testo}`);
    setScelta({ verbo: v, primo });
  };

  let oggetti: ReactNode[] = [];
  let titoloOggetti = "";
  if (scelta && scelta.primo) {
    const { verbo: v, primo } = scelta;
    titoloOggetti = "Con che cosa?";
    oggetti = secondiDi(v, primo).map((s) => (
      <button key={s.testo} onClick={() => invia(`${v.verbo} ${primo.testo} ${s.testo}`)} className={normale}>
        {s.testo}
      </button>
    ));
    if (v.secondo === "facoltativo")
      oggetti.push(
        <button key="_basta" onClick={() => invia(`${v.verbo} ${primo.testo}`)} className={tenue}>
          … e basta
        </button>
      );
  } else if (scelta) {
    const v = scelta.verbo;
    titoloOggetti = "Che cosa?";
    oggetti = v.primi.map((pr) => {
      const o = oggetto(pr.id);
      return (
        <button key={pr.id} onClick={() => scegliPrimo(v, pr)} className={`${normale} ${o?.con_te ? "border-dashed" : ""}`}>
          {o ? o.etichetta : pr.testo}
        </button>
      );
    });
    if (v.da_solo)
      oggetti.push(
        <button key="_solo" onClick={() => invia(v.verbo)} className={tenue}>
          {v.verbo} e basta
        </button>
      );
  }
  // Senza un verbo scelto, toccare un oggetto lo esamina.
  const esamina = p.verbi.find((v) => v.verbo === "esamina");
  const bottoneOggetto = (o: Pulsantiera["oggetti"][number]) => {
    const pr = esamina?.primi.find((x) => x.id === o.id);
    return (
      <button
        key={o.id}
        title={pr ? "Esamina" : undefined}
        onClick={() => pr && invia(`esamina ${pr.testo}`)}
        className={`${normale} ${o.con_te ? "border-dashed" : ""}`}
      >
        {o.etichetta}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-2.5">
      {scelta && (
        <div className="flex items-center gap-2 font-mono text-sm text-favella-cyan">
          <span className="flex-1">
            {scelta.verbo.verbo} {scelta.primo ? `${scelta.primo.testo} …` : "…"}
          </span>
          <button onClick={() => setScelta(null)} className={tenue} aria-label="Annulla la frase">
            ✕
          </button>
        </div>
      )}
      <Gruppo titolo="Azioni">
        {p.verbi.map((v) => (
          <button key={v.verbo} onClick={() => scegliVerbo(v)} className={scelta?.verbo === v ? attivo : normale}>
            {v.etichetta}
          </button>
        ))}
      </Gruppo>
      {scelta ? (
        <Gruppo titolo={titoloOggetti}>{oggetti}</Gruppo>
      ) : (
        <>
          <Gruppo titolo="Qui">{p.oggetti.filter((o) => !o.con_te).map(bottoneOggetto)}</Gruppo>
          <Gruppo titolo="Con te">{p.oggetti.filter((o) => o.con_te).map(bottoneOggetto)}</Gruppo>
        </>
      )}
      <Gruppo titolo="Uscite">
        {p.uscite.map((u) => (
          <button key={u.comando} onClick={() => invia(u.comando)} className={normale}>
            {u.etichetta}
            {u.stanza ? ` · ${u.stanza}` : ""}
          </button>
        ))}
      </Gruppo>
      <Gruppo>
        {p.servizio.map((s) => (
          <button key={s.comando} onClick={() => invia(s.comando)} className={tenue}>
            {s.etichetta}
          </button>
        ))}
      </Gruppo>
    </div>
  );
};

export default PulsantiVerbo;
