import React from "react";
import { Link } from "../router";
import { PageHero } from "../ui/primitives";
import { AUTHOR_NAME, AUTHOR_EMAIL, GITHUB_URL, PYPI_URL } from "../constants";

export const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mb-3 mt-12 font-display text-[24px] font-bold tracking-[-0.02em] text-favella-text-primary">{children}</h2>
);
export const P = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-4 font-serif text-[17px] leading-[1.75] text-favella-text-secondary">{children}</p>
);

const PrivacyPage = () => (
  <>
    <PageHero eyebrow="Informativa" title="Privacy." lead="Il sito non usa cookie di profilazione, non installa strumenti di analisi e non traccia i visitatori." />
    <section className="px-6 pb-16">
      <article className="mx-auto max-w-[760px]">
        <p className="mb-8 font-mono text-[12px] uppercase tracking-[0.16em] text-favella-text-muted">Ultimo aggiornamento: ottobre 2026</p>

        <P>
          Questa informativa è resa ai sensi dell'art. 13 del Regolamento (UE) 2016/679 (GDPR) e descrive come vengono trattati i dati di chi visita{" "}
          <strong className="text-favella-text-primary">favella.eu</strong>. In breve: il sito{" "}
          <strong className="text-favella-text-primary">non usa cookie di profilazione, non installa strumenti di analisi statistica e non traccia i visitatori</strong>.
        </P>

        <H>Titolare del trattamento</H>
        <P>
          Il titolare è {AUTHOR_NAME}, raggiungibile all'indirizzo{" "}
          <a href={`mailto:${AUTHOR_EMAIL}`} className="text-favella-cyan hover:underline">
            {AUTHOR_EMAIL}
          </a>
          .
        </P>

        <H>Dati di navigazione</H>
        <P>
          Come ogni sito web, il server che ospita favella.eu (il fornitore di hosting Aruba S.p.A.) può registrare per finalità tecniche e di sicurezza alcuni dati
          trasmessi automaticamente dal tuo browser: indirizzo IP, tipo di browser e dispositivo, data e ora della richiesta, pagine consultate. La base giuridica è il
          legittimo interesse del titolare a garantire la sicurezza e il corretto funzionamento del sito (art. 6.1.f GDPR). Questi dati non sono usati per profilarti e
          sono conservati secondo le policy del fornitore di hosting.
        </P>

        <H>Niente cookie di profilazione, niente analytics</H>
        <P>
          Il sito non utilizza Google Analytics né strumenti analoghi, e non installa cookie di profilazione propri o di terze parti. I caratteri tipografici (font) sono{" "}
          <strong className="text-favella-text-primary">ospitati direttamente sul nostro dominio</strong>: non viene effettuata alcuna chiamata a Google Fonts, quindi nessun
          dato è trasmesso a Google al caricamento delle pagine. Per i dettagli sui cookie vedi l'
          <Link to="/cookie" className="text-favella-cyan hover:underline">
            informativa sui cookie
          </Link>
          .
        </P>

        <H>Strumenti interattivi (corso, programma, galleria, Il Viaggiatore)</H>
        <P>
          Le pagine che permettono di scrivere ed eseguire storie nel browser funzionano grazie a un motore Python (Pyodide) che viene scaricato da una rete di
          distribuzione pubblica (CDN jsDelivr, gestita da terzi), e a una libreria Python (Lark) che viene scaricata da PyPI (<em>pypi.org</em> e{" "}
          <em>files.pythonhosted.org</em>). Questi download avvengono{" "}
          <strong className="text-favella-text-primary">solo quando avvii volontariamente questi strumenti</strong> e comportano una richiesta ai server di quei servizi, che per
          natura tecnica ricevono il tuo indirizzo IP. Non vengono trasmessi altri dati e nulla viene salvato sui loro server a tuo nome.
        </P>

        <H>Memoria locale del browser</H>
        <P>
          Il sito può salvare nella memoria locale del tuo browser (localStorage) informazioni tecniche: il fatto che tu abbia già chiuso l'avviso informativo sulla privacy
          e, nelle pagine interattive, le partite salvate da te nel browser. Non sono cookie, non ti identificano e non vengono trasmesse a nessuno.
        </P>

        <H>Link esterni</H>
        <P>
          Il sito contiene collegamenti a servizi esterni come{" "}
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-favella-cyan hover:underline">
            GitHub
          </a>
          ,{" "}
          <a href={PYPI_URL} target="_blank" rel="noopener noreferrer" className="text-favella-cyan hover:underline">
            PyPI
          </a>{" "}
          e Amazon.it. Una volta che li visiti, valgono le rispettive informative sulla privacy, sulle quali il titolare non ha controllo.
        </P>

        <H>I tuoi diritti</H>
        <P>
          In quanto interessato puoi esercitare in qualsiasi momento i diritti previsti dagli artt. 15-22 del GDPR: accesso ai tuoi dati, rettifica, cancellazione,
          limitazione e opposizione al trattamento, portabilità. Puoi inoltre proporre reclamo all'Autorità Garante per la protezione dei dati personali (
          <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-favella-cyan hover:underline">
            garanteprivacy.it
          </a>
          ). Per esercitarli scrivi a{" "}
          <a href={`mailto:${AUTHOR_EMAIL}`} className="text-favella-cyan hover:underline">
            {AUTHOR_EMAIL}
          </a>
          .
        </P>

        <H>Modifiche</H>
        <P>Questa informativa può essere aggiornata nel tempo. La data in alto indica l'ultima revisione.</P>
      </article>
    </section>
  </>
);

export default PrivacyPage;
