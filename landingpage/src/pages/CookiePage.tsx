import React from "react";
import { Link } from "../router";
import { AUTHOR_EMAIL } from "../constants";

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mb-2.5 mt-9 font-serif text-[22px] font-semibold text-favella-text-primary">{children}</h2>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-3 text-[15px] leading-[1.7] text-favella-text-secondary">{children}</p>
);

const CookiePage = () => (
  <article className="mx-auto max-w-[760px]">
    <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.24em] text-favella-cyan">Cookie</p>
    <h1 className="mb-2 font-serif text-[clamp(32px,4.6vw,48px)] font-medium leading-[1.1] text-favella-text-primary">
      Cookie Policy
    </h1>
    <p className="mb-2 text-[13px] text-favella-text-muted">Ultimo aggiornamento: giugno 2026</p>

    <P>
      Documento redatto secondo il GDPR, la Direttiva ePrivacy e le «Linee guida sull'uso dei cookie
      e di altri strumenti di tracciamento» del Garante per la protezione dei dati personali
      (10 giugno 2021).
    </P>

    <H>In sintesi</H>
    <P>
      <strong>favella.eu non utilizza cookie di profilazione</strong>, non usa cookie di terze parti
      a fini di tracciamento o marketing, e non impiega strumenti di analisi statistica. Per questo
      non è presente alcun banner di richiesta del consenso: non c'è nulla per cui chiederlo.
    </P>

    <H>Strumenti tecnici utilizzati</H>
    <P>
      Il sito si limita a salvare nella memoria locale del browser (localStorage) un'informazione
      tecnica: la chiusura dell'avviso informativo, per non riproporlo a ogni visita. Si tratta di
      uno strumento strettamente necessario, esente dal consenso ai sensi dell'art. 122 del Codice
      Privacy. Non è un cookie di tracciamento e non consente di identificarti.
    </P>

    <H>Font ospitati in proprio</H>
    <P>
      I caratteri tipografici sono serviti dal nostro dominio e non da Google Fonts: di conseguenza
      nessun cookie o richiesta verso server di Google viene generato al caricamento delle pagine.
    </P>

    <H>Componenti di terze parti su tua azione</H>
    <P>
      Le pagine interattive (corso, programma, galleria) caricano il motore Python da una CDN pubblica
      (jsDelivr) <strong>soltanto quando le avvii</strong>. Tale richiesta non installa cookie sul tuo
      dispositivo; per i dettagli vedi l'<Link to="/privacy" className="text-favella-cyan hover:underline">Informativa sulla privacy</Link>.
    </P>

    <H>Come gestire o eliminare gli strumenti</H>
    <P>
      Poiché non vengono installati cookie di profilazione, non è necessaria alcuna gestione del
      consenso. Puoi comunque cancellare in qualsiasi momento i dati salvati dal sito (incluso il
      localStorage) dalle impostazioni del tuo browser. Per qualunque domanda:{" "}
      <a href={`mailto:${AUTHOR_EMAIL}`} className="text-favella-cyan hover:underline">{AUTHOR_EMAIL}</a>.
    </P>
  </article>
);

export default CookiePage;
