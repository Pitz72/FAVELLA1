import React, { useState } from "react";
import BrandMark from "./BrandMark";
import { GitHubIcon } from "./icons";
import { GITHUB_URL } from "../constants";
import { navigate, useRoute } from "../router";

// Nav del redesign: barra orizzontale sticky in alto (al posto della sidebar).
const navItems = [
  { name: "Inizio", href: "/" },
  { name: "Progetto", href: "/progetto" },
  { name: "Novità", href: "/aggiornamenti" },
  { name: "Guida rapida", href: "/manuale" },
  { name: "Corso", href: "/corso" },
  { name: "Programma", href: "/programma" },
  { name: "Galleria", href: "/galleria" },
  { name: "Libreria", href: "/libreria" },
  { name: "Download", href: "/download" },
  { name: "Collabora", href: "/collabora" },
];

const Header = () => {
  const [open, setOpen] = useState(false);
  const currentHash = useRoute();

  const nav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    navigate(href);
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-[100] border-b border-favella-cyan/12 bg-favella-void/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1220px] flex-wrap items-center justify-between gap-4 px-6 py-3">
        {/* Wordmark */}
        <a
          href="/"
          onClick={(e) => nav(e, "/")}
          className="flex shrink-0 items-center gap-3 group cursor-pointer"
        >
          <BrandMark size={38} glow={false} className="transition-transform duration-300 group-hover:scale-105" />
          <span className="leading-none">
            <span className="block font-display text-[18px] font-extrabold tracking-tight text-favella-text-primary">
              FAVELLA<span className="text-favella-cyan">1</span>
            </span>
            <span className="mt-[3px] block font-mono text-[9px] tracking-[0.2em] text-favella-text-muted">
              IL CODICE È PROSA
            </span>
          </span>
        </a>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {navItems.map((item) => {
            const active = currentHash === item.href;
            return (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => nav(e, item.href)}
                className={`cursor-pointer rounded-lg px-2.5 py-1.5 font-display text-[13.5px] font-medium transition-colors duration-200 ${
                  active
                    ? "bg-favella-cyan/10 text-favella-cyan"
                    : "text-favella-text-secondary hover:text-favella-text-primary"
                }`}
              >
                {item.name}
              </a>
            );
          })}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1.5 inline-flex items-center gap-1.5 rounded-lg border border-favella-cyan/25 bg-favella-surface/40 px-3.5 py-2 font-display text-[13px] font-semibold text-favella-text-primary transition-colors duration-200 hover:border-favella-cyan/50 hover:text-favella-cyan"
          >
            <GitHubIcon className="h-4 w-4" /> GitHub
          </a>
        </nav>

        {/* Toggle mobile */}
        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 text-favella-text-primary lg:hidden"
          aria-label="Apri menu"
          aria-expanded={open}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}
            />
          </svg>
        </button>
      </div>

      {/* Dropdown mobile */}
      {open && (
        <div className="border-t border-favella-cyan/10 bg-favella-void/95 px-6 py-4 lg:hidden">
          <nav className="grid grid-cols-2 gap-1.5">
            {navItems.map((item) => {
              const active = currentHash === item.href;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => nav(e, item.href)}
                  className={`rounded-lg px-3 py-2.5 font-display text-[15px] transition-colors ${
                    active ? "bg-favella-cyan/10 text-favella-cyan" : "text-favella-text-secondary hover:text-favella-text-primary"
                  }`}
                >
                  {item.name}
                </a>
              );
            })}
          </nav>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-favella-cyan/25 bg-favella-surface/40 px-4 py-2.5 font-display text-sm font-semibold text-favella-text-primary"
          >
            <GitHubIcon className="h-4 w-4" /> GitHub
          </a>
        </div>
      )}
    </header>
  );
};

export default Header;
