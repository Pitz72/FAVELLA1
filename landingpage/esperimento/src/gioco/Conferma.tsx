// ====================================================================
//  La conferma di una scelta che costa.
// --------------------------------------------------------------------
//  Si apre PRIMA che il comando parta: dice cosa si dà e cosa si riceve,
//  come resterebbero le scorte, e lascia la mano libera di ripensarci. Il
//  «No» è il pulsante che ha il fuoco: un Invio distratto non baratta niente.
//  Tasti: S conferma, N o Esc rinunciano.
// ====================================================================
import { useEffect, useRef } from "react";
import type { Conferma as DatiConferma } from "./azioni";

interface Props {
  conferma: DatiConferma;
  /** ciò che il giocatore ha toccato o scritto («Ti do l'orologio per dell'acqua.») */
  etichetta: string;
  puoAnnullare: boolean;
  onSi: () => void;
  onNo: () => void;
}

const Elenco = ({ titolo, voci, tono }: { titolo: string; voci: string[]; tono: "meno" | "piu" | "pesa" }) => (
  <div className={`vg-conf-col vg-conf-${tono}`}>
    <span className="vg-conf-titolo">{titolo}</span>
    <ul>{voci.map((v) => <li key={v}>{v}</li>)}</ul>
  </div>
);

export default function Conferma({ conferma: c, etichetta, puoAnnullare, onSi, onNo }: Props) {
  const no = useRef<HTMLButtonElement>(null);
  useEffect(() => { no.current?.focus(); }, []);
  useEffect(() => {
    const tasto = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "escape" || k === "n") { e.preventDefault(); e.stopPropagation(); onNo(); }
      else if (k === "s") { e.preventDefault(); e.stopPropagation(); onSi(); }
    };
    window.addEventListener("keydown", tasto, true);
    return () => window.removeEventListener("keydown", tasto, true);
  }, [onSi, onNo]);

  return (
    <div className="vg-conf-velo" role="alertdialog" aria-modal="true" aria-labelledby="vg-conf-domanda" onClick={onNo}>
      <div className={`vg-conf vg-conf-tipo-${c.tipo}`} onClick={(e) => e.stopPropagation()}>
        <p className="vg-sopratitolo">{c.segno}</p>
        <p className="vg-conf-quota">{etichetta}</p>
        <h2 id="vg-conf-domanda">{c.domanda}</h2>
        {(c.perdi.length > 0 || c.ottieni.length > 0) && (
          <div className="vg-conf-conti">
            {c.perdi.length > 0 && <Elenco titolo={c.tipo === "danno" ? "ti costa" : "dai"} voci={c.perdi} tono="meno" />}
            {c.perdi.length > 0 && c.ottieni.length > 0 && <span className="vg-conf-freccia" aria-hidden="true">→</span>}
            {c.ottieni.length > 0 && <Elenco titolo="ricevi" voci={c.ottieni} tono="piu" />}
          </div>
        )}
        {c.pesa.length > 0 && <p className="vg-conf-pesa">Ti pesa: {c.pesa.join(", ")}.</p>}
        {c.spreco && <p className="vg-conf-pesa vg-conf-spreco" role="note">{c.spreco}</p>}
        {(c.perdi.length > 0 || c.ottieni.length > 0) && <p className="vg-conf-dopo">Ti resterebbero: {c.dopo}</p>}
        <div className="vg-conf-azioni">
          <button ref={no} className="vg-bottone" onClick={onNo}>No, ci ripenso <kbd>N</kbd></button>
          <button className="vg-bottone vg-pieno" onClick={onSi}>Sì, procedo <kbd>S</kbd></button>
        </div>
        {puoAnnullare && <p className="vg-conf-nota">Dopo, se ti pesa, puoi tornare indietro con ↶ annulla.</p>}
      </div>
    </div>
  );
}
