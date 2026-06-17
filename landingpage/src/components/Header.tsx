import React, { useState } from "react";
import BrandMark from "./BrandMark";
import { GitHubIcon } from "./icons";
import { GITHUB_URL, VERSION } from "../constants";

const navItems = [
  { name: "Home", href: "#/" },
  { name: "Il Progetto", href: "#/progetto" },
  { name: "Novità", href: "#/aggiornamenti" },
  { name: "Guida rapida", href: "#/manuale" },
  { name: "Manuale interattivo", href: "#/corso" },
  { name: "Programma", href: "#/programma" },
  { name: "Galleria", href: "#/galleria" },
  { name: "Libreria", href: "#/libreria" },
  { name: "Collabora", href: "#/collabora" },
];

const Wordmark = ({ onClick }: { onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void }) => (
  <a href="#/" onClick={onClick} className="flex items-center gap-3 group cursor-pointer">
    <BrandMark size={44} glow={false} className="transition-transform duration-300 group-hover:scale-105" />
    <span className="leading-none">
      <span className="block font-display font-extrabold text-xl tracking-tight text-white">
        FAVELLA<span className="text-favella-cyan">1</span>
      </span>
      <span className="block text-[10px] font-mono tracking-[0.18em] text-favella-text-secondary/70 mt-1">
        IL CODICE È PROSA
      </span>
    </span>
  </a>
);

const Header = () => {
  const [open, setOpen] = useState(false);
  const currentHash = window.location.hash || "#/";

  const nav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    window.location.hash = href;
    setOpen(false);
  };

  const Links = ({ big = false }: { big?: boolean }) => (
    <nav className={`flex flex-col ${big ? "items-center gap-2" : "gap-1.5"}`}>
      {navItems.map((item) => {
        const active = currentHash === item.href;
        return (
          <a
            key={item.name}
            href={item.href}
            onClick={(e) => nav(e, item.href)}
            className={`relative group flex items-center rounded-lg transition-all duration-300 ${
              big ? "text-2xl font-display py-3" : "px-3 py-2 text-[15px] font-display"
            } ${active ? "text-favella-cyan" : "text-favella-text-secondary hover:text-favella-text-primary"}`}
          >
            {!big && (
              <span
                className={`absolute left-0 h-5 w-[3px] rounded-full bg-brand-gradient transition-all duration-300 ${
                  active ? "opacity-100 scale-y-100" : "opacity-0 scale-y-50 group-hover:opacity-60"
                }`}
              />
            )}
            <span className={`${!big ? "ml-3" : ""} ${active ? "translate-x-0.5" : "group-hover:translate-x-0.5"} transition-transform`}>
              {item.name}
            </span>
          </a>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="fixed top-0 left-0 h-screen w-64 hidden md:flex flex-col z-50 p-6 glass border-r border-favella-cyan/10">
        <Wordmark onClick={(e) => nav(e, "#/")} />

        <div className="mt-10">
          <Links />
        </div>

        <div className="mt-auto space-y-4">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-favella-cyan/25 text-favella-text-primary hover:text-favella-dark hover:bg-favella-cyan hover:border-favella-cyan transition-all duration-300 text-sm font-medium"
          >
            <GitHubIcon className="w-4 h-4" />
            <span>Progetto su GitHub</span>
          </a>
          <div className="flex items-center justify-between text-[10px] font-mono text-favella-text-muted px-1">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-favella-emerald animate-pulse-slow" />
              v{VERSION}
            </span>
            <span>open source</span>
          </div>
        </div>
      </aside>

      {/* Header mobile */}
      <header className="md:hidden sticky top-0 z-50 glass border-b border-favella-cyan/10">
        <div className="px-4 flex items-center justify-between h-16">
          <Wordmark onClick={(e) => nav(e, "#/")} />
          <button onClick={() => setOpen(!open)} className="text-favella-text-primary p-2" aria-label="Apri menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>

        <div
          className={`fixed inset-0 bg-favella-void/95 backdrop-blur-xl p-8 flex flex-col z-50 transition-transform duration-300 ease-in-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex justify-end">
            <button onClick={() => setOpen(false)} className="text-favella-text-secondary p-2" aria-label="Chiudi menu">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center">
            <BrandMark size={84} rings className="mb-8" />
            <Links big />
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 flex items-center gap-2 text-favella-cyan font-medium"
            >
              <GitHubIcon className="w-5 h-5" /> GitHub
            </a>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
