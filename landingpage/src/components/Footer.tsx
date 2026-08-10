import React from "react";
import BrandMark from "./BrandMark";
import { GITHUB_URL, PYPI_URL, AUTHOR_NAME, VERSION } from "../constants";
import { Link } from "../router";

const Col = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="mb-3.5 font-mono text-[10px] uppercase tracking-[0.2em] text-favella-text-muted">{label}</p>
    <div className="flex flex-col gap-2.5">{children}</div>
  </div>
);

const HashLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link
    to={href}
    className="cursor-pointer text-sm text-favella-text-secondary transition-colors hover:text-favella-cyan"
  >
    {children}
  </Link>
);

const ExtLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="text-sm text-favella-text-secondary transition-colors hover:text-favella-cyan"
  >
    {children}
  </a>
);

const Footer = () => (
  <footer className="border-t border-favella-cyan/12 bg-favella-dark px-6 pb-10 pt-14">
    <div className="mx-auto grid max-w-[1120px] grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-9">
      <div>
        <div className="mb-4 flex items-center gap-3">
          <BrandMark size={36} glow={false} />
          <span className="font-display text-[17px] font-extrabold text-favella-text-primary">
            FAVELLA<span className="text-favella-cyan">1</span>
          </span>
        </div>
        <p className="max-w-[280px] font-serif text-[15px] italic leading-relaxed text-favella-text-secondary">
          «Il tuo codice è una storia.» Il linguaggio in cui l'italiano è il codice.
        </p>
      </div>

      <Col label="Esplora">
        <HashLink href="/progetto">Il Progetto</HashLink>
        <HashLink href="/aggiornamenti">Novità &amp; Roadmap</HashLink>
        <HashLink href="/manuale">Guida rapida</HashLink>
        <HashLink href="/galleria">Galleria</HashLink>
      </Col>

      <Col label="Costruisci">
        <HashLink href="/corso">Corso interattivo</HashLink>
        <HashLink href="/programma">Programma nel browser</HashLink>
        <HashLink href="/libreria">Libreria di moduli</HashLink>
        <HashLink href="/collabora">Collabora</HashLink>
      </Col>

      <Col label="Progetto">
        <ExtLink href={GITHUB_URL}>GitHub</ExtLink>
        <ExtLink href={PYPI_URL}>PyPI</ExtLink>
        <HashLink href="/download">Download</HashLink>
        <span className="text-sm text-favella-text-muted">favella.eu</span>
      </Col>
    </div>

    <div className="mx-auto mt-10 flex max-w-[1120px] flex-wrap items-center justify-between gap-x-5 gap-y-3 border-t border-favella-text-secondary/10 pt-5 font-mono text-xs text-favella-text-muted">
      <span>© 2026 {AUTHOR_NAME} · open-source</span>
      <span className="flex items-center gap-4">
        <Link to="/privacy" className="cursor-pointer transition-colors hover:text-favella-cyan">Privacy</Link>
        <Link to="/cookie" className="cursor-pointer transition-colors hover:text-favella-cyan">Cookie</Link>
      </span>
      <span>FAVELLA 1 — v{VERSION} · scritto in dialogo con l'IA</span>
    </div>
  </footer>
);

export default Footer;
