import React from "react";
import BrandMark from "./BrandMark";
import { GITHUB_URL, PYPI_URL, AUTHOR_NAME, VERSION, STUDIO_VERSION, SITE_VERSION } from "../constants";
import { Link } from "../router";

const Col = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="mb-5 font-mono text-[10.5px] uppercase tracking-[0.24em] text-favella-text-muted">{label}</p>
    <div className="flex flex-col gap-3">{children}</div>
  </div>
);

const linkCls = "w-fit text-[15px] text-favella-text-secondary transition-colors hover:text-favella-cyan-bright";

const Int = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link to={href} className={linkCls}>
    {children}
  </Link>
);

const Ext = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={linkCls}>
    {children} <span className="text-favella-text-muted">↗</span>
  </a>
);

const Footer = () => (
  <footer className="relative mt-24 overflow-hidden border-t border-favella-cyan/12 bg-favella-dark">
    <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(34,211,238,0.6),rgba(245,158,11,0.5),transparent)]" />
    <div aria-hidden="true" className="absolute -top-40 left-1/2 h-80 w-[70%] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(34,211,238,0.10),transparent)]" />

    <div className="relative mx-auto max-w-[1240px] px-6 pb-8 pt-20">
      <div className="grid gap-12 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div>
          <div className="mb-5 flex items-center gap-3">
            <BrandMark size={44} glow={false} />
            <span className="font-display text-[22px] font-extrabold tracking-[-0.03em] text-favella-text-primary">
              FAVELLA<span className="text-favella-cyan"> 1</span>
            </span>
          </div>
          <p className="max-w-[330px] font-serif text-[17px] italic leading-[1.6] text-favella-text-secondary">
            «Il tuo codice è una storia.» Il linguaggio in cui l'italiano è il codice.
          </p>
          <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.2em] text-favella-text-muted">
            Open source · licenza MIT
          </p>
        </div>

        <Col label="Esplora">
          <Int href="/progetto">Il progetto</Int>
          <Int href="/aggiornamenti">Novità e roadmap</Int>
          <Int href="/manuale">Guida rapida</Int>
          <Int href="/galleria">Galleria</Int>
        </Col>

        <Col label="Costruisci">
          <Int href="/studio">Favella Studio</Int>
          <Int href="/corso">Corso interattivo</Int>
          <Int href="/programma">Programma nel browser</Int>
          <Int href="/libreria">Libreria di moduli</Int>
        </Col>

        <Col label="Progetto">
          <Ext href={GITHUB_URL}>GitHub</Ext>
          <Ext href={PYPI_URL}>PyPI</Ext>
          <Int href="/download">Download</Int>
          <Int href="/collabora">Collabora</Int>
        </Col>
      </div>

      {/* la scritta gigante */}
      <div
        aria-hidden="true"
        className="pointer-events-none mt-16 select-none whitespace-nowrap bg-[linear-gradient(180deg,rgba(147,197,224,0.16),rgba(147,197,224,0.02)_78%)] bg-clip-text text-center font-display text-[clamp(56px,14.4vw,210px)] font-extrabold leading-[0.86] tracking-[-0.06em] text-transparent"
      >
        FAVELLA 1
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-white/[0.07] pt-6 font-mono text-[11.5px] text-favella-text-muted">
        <span>© 2026 {AUTHOR_NAME}</span>
        <span className="flex items-center gap-5">
          <Link to="/privacy" className="transition-colors hover:text-favella-cyan">Privacy</Link>
          <Link to="/cookie" className="transition-colors hover:text-favella-cyan">Cookie</Link>
        </span>
        <span>
          FAVELLA 1 v{VERSION} · Studio v{STUDIO_VERSION} · sito v{SITE_VERSION} · scritto in dialogo con l'IA
        </span>
      </div>
    </div>
  </footer>
);

export default Footer;
