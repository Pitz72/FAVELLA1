// ====================================================================
//  «Vuoi bere?» «Vuoi mangiare?» — il pannello delle scorte.
// --------------------------------------------------------------------
//  Si apre toccando l'acqua o il cibo fra le scorte, o la tanica nella
//  bisaccia. Ogni dose è un comando del gioco («bevi due sorsi», «mangia tre
//  porzioni»): quello che c'è scritto sul pulsante lo si potrebbe anche
//  digitare. Cosa fa ciascuna lo dice il motore stesso, con un'anteprima:
//  qui non c'è nessun numero scritto a mano (quanta sete toglie un sorso
//  lo decide il gioco).
// ====================================================================
import { useMemo } from "react";
import type { Anteprima, StatoMondo } from "../lib/favellaRuntime";
import { PASTI, previsioni } from "./azioni";

interface Props {
  tipo: "bere" | "mangiare";
  mondo: StatoMondo;
  anteprima: (cmd: string) => Anteprima;
  onScegli: (cmd: string) => void;
  onChiudi: () => void;
}

const Goccia = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 C8 9 6 12 6 15 A6 6 0 0 0 18 15 C18 12 16 9 12 3 Z" /></svg>
);
const Ciotola = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13 C4 8 8 6 12 6 C16 6 20 8 20 13 V17 H4 Z M8 9 L9 12 M12 8 V12 M16 9 L15 12" /></svg>
);

export default function PannelloScorta({ tipo, mondo, anteprima, onScegli, onChiudi }: Props) {
  const p = PASTI[tipo];
  const { dosi, motivo } = useMemo(() => previsioni(p, mondo, anteprima), [p, mondo, anteprima]);
  const c = mondo.counters;
  return (
    <div className="vg-pannello" role="group" aria-label={p.titolo}>
      <div className="vg-pannello-testa">
        <span className="vg-pannello-icona">{tipo === "bere" ? <Goccia /> : <Ciotola />}</span>
        <div>
          <b>{p.titolo}</b>
          <span>{p.bisogno} {c[p.bisogno] ?? 0} · {p.risorsa} {c[p.risorsa] ?? 0}</span>
        </div>
      </div>
      {dosi.length > 0 ? (
        <div className="vg-dosi">
          {dosi.map(({ dose, buona, quanto, motivo: perche }) => (
            <button key={dose.cmd} className="vg-dose" disabled={!buona} title={buona ? dose.cmd : perche}
              onClick={() => onScegli(dose.cmd)}>
              <span>{dose.etichetta}</span>
              <small>{buona ? quanto : perche}</small>
            </button>
          ))}
        </div>
      ) : (
        <p className="vg-pannello-nota">{motivo || "Niente da fare, adesso."}</p>
      )}
      <button className="vg-chip vg-chiudi" onClick={onChiudi} aria-label="Chiudi">✕</button>
    </div>
  );
}
