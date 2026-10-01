import { Link } from "../router";
import { PageHero } from "../ui/primitives";
import { AUTHOR_EMAIL } from "../constants";
import { H, P } from "./PrivacyPage";

const CookiePage = () => (
  <>
    <PageHero eyebrow="Cookie" title="Cookie." lead="favella.eu non utilizza cookie di profilazione: per questo non c'è un banner di consenso." />
    <section className="px-6 pb-16">
      <article className="mx-auto max-w-[760px]">
        <p className="mb-8 font-mono text-[12px] uppercase tracking-[0.16em] text-favella-text-muted">Ultimo aggiornamento: ottobre 2026</p>

        <P>
          Documento redatto secondo il GDPR, la Direttiva ePrivacy e le «Linee guida sull'uso dei cookie e di altri strumenti di tracciamento» del Garante per la protezione
          dei dati personali (10 giugno 2021).
        </P>

        <H>In sintesi</H>
        <P>
          <strong className="text-favella-text-primary">favella.eu non utilizza cookie di profilazione</strong>, non usa cookie di terze parti a fini di tracciamento o marketing,
          e non impiega strumenti di analisi statistica. Per questo non è presente alcun banner di richiesta del consenso: non c'è nulla per cui chiederlo.
        </P>

        <H>Strumenti tecnici utilizzati</H>
        <P>
          Il sito si limita a salvare nella memoria locale del browser (localStorage) informazioni tecniche: la chiusura dell'avviso informativo, per non riproporlo a ogni
          visita, e le partite che salvi tu nelle pagine interattive. Si tratta di strumenti strettamente necessari, esenti dal consenso ai sensi dell'art. 122 del Codice
          Privacy. Non sono cookie di tracciamento e non consentono di identificarti.
        </P>

        <H>Font ospitati in proprio</H>
        <P>
          I caratteri tipografici sono serviti dal nostro dominio e non da Google Fonts: di conseguenza nessun cookie o richiesta verso server di Google viene generato al
          caricamento delle pagine.
        </P>

        <H>Componenti di terze parti su tua azione</H>
        <P>
          Le pagine interattive (corso, programma, galleria) caricano il motore Python da una CDN pubblica (jsDelivr) e la libreria Lark da PyPI{" "}
          <strong className="text-favella-text-primary">soltanto quando le avvii</strong>. Tali richieste non installano cookie sul tuo dispositivo; per i dettagli vedi l'
          <Link to="/privacy" className="text-favella-cyan hover:underline">
            informativa sulla privacy
          </Link>
          .
        </P>

        <H>Come gestire o eliminare gli strumenti</H>
        <P>
          Poiché non vengono installati cookie di profilazione, non è necessaria alcuna gestione del consenso. Puoi comunque cancellare in qualsiasi momento i dati salvati
          dal sito (incluso il localStorage) dalle impostazioni del tuo browser. Per qualunque domanda:{" "}
          <a href={`mailto:${AUTHOR_EMAIL}`} className="text-favella-cyan hover:underline">
            {AUTHOR_EMAIL}
          </a>
          .
        </P>
      </article>
    </section>
  </>
);

export default CookiePage;
