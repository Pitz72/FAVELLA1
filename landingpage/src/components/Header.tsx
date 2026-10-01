import React, { useEffect, useRef, useState } from "react";
import BrandMark from "./BrandMark";
import { GitHubIcon } from "./icons";
import { GITHUB_URL } from "../constants";
import { navigate, useRoute } from "../router";

// Barra del design 2026: una pillola di vetro che galleggia in alto. Le voci
// principali sono sempre sotto gli occhi; il resto sta in «Altro». Su telefono
// diventa un menu a tutto schermo con le voci in grande.

const primary = [
  { name: "Progetto", href: "/progetto" },
  { name: "Guida rapida", href: "/manuale" },
  { name: "Corso", href: "/corso" },
  { name: "Programma", href: "/programma" },
  { name: "Studio", href: "/studio" },
  { name: "Galleria", href: "/galleria" },
];
const more = [
  { name: "Novità", href: "/aggiornamenti", hint: "Che cosa è cambiato" },
  { name: "Libreria", href: "/libreria", hint: "Moduli pronti da includere" },
  { name: "Collabora", href: "/collabora", hint: "Dai una mano" },
  { name: "Download", href: "/download", hint: "Tutto ciò che si scarica" },
];
const allItems = [{ name: "Inizio", href: "/" }, ...primary, ...more];

const Header = () => {
  const [open, setOpen] = useState(false);
  const [altro, setAltro] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const route = useRoute();
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 16);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // Il menu «Altro» si chiude cliccando fuori o con Esc.
  useEffect(() => {
    if (!altro) return;
    const down = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setAltro(false);
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && setAltro(false);
    window.addEventListener("mousedown", down);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("mousedown", down);
      window.removeEventListener("keydown", key);
    };
  }, [altro]);

  // Il menu a tutto schermo blocca lo scorrimento della pagina sotto.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    navigate(href);
    setOpen(false);
    setAltro(false);
  };

  const inAltro = more.some((m) => m.href === route);

  return (
    <header className="fixed inset-x-0 top-0 z-[100] px-3 pt-3 sm:px-5 sm:pt-4">
      <div
        className={`mx-auto flex max-w-[1260px] items-center justify-between gap-3 rounded-full border px-3 py-2 pl-4 backdrop-blur-2xl transition-all duration-500 ${
          scrolled
            ? "border-favella-cyan/20 bg-favella-void/80 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.9)]"
            : "border-white/[0.07] bg-favella-void/40"
        }`}
      >
        {/* marchio */}
        <a href="/" onClick={(e) => go(e, "/")} className="group flex shrink-0 items-center gap-2.5">
          <BrandMark size={34} glow={false} className="transition-transform duration-500 group-hover:rotate-[-6deg] group-hover:scale-110" />
          <span className="font-display text-[17px] font-extrabold tracking-[-0.03em] text-favella-text-primary">
            FAVELLA<span className="text-favella-cyan"> 1</span>
          </span>
        </a>

        {/* voci */}
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Principale">
          {primary.map((item) => {
            const active = route === item.href;
            return (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => go(e, item.href)}
                className={`relative rounded-full px-3.5 py-2 font-display text-[13.5px] font-medium transition-colors duration-200 ${
                  active ? "bg-favella-cyan/12 text-favella-cyan-bright" : "text-favella-text-secondary hover:bg-white/[0.04] hover:text-favella-text-primary"
                }`}
              >
                {item.name}
              </a>
            );
          })}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setAltro((v) => !v)}
              aria-expanded={altro}
              aria-haspopup="menu"
              className={`flex items-center gap-1 rounded-full px-3.5 py-2 font-display text-[13.5px] font-medium transition-colors ${
                inAltro || altro ? "bg-favella-cyan/12 text-favella-cyan-bright" : "text-favella-text-secondary hover:bg-white/[0.04] hover:text-favella-text-primary"
              }`}
            >
              Altro
              <svg className={`h-3.5 w-3.5 transition-transform ${altro ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8l5 5 5-5" />
              </svg>
            </button>
            {altro && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+14px)] w-[290px] rounded-3xl border border-favella-cyan/20 bg-favella-panel/95 p-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
              >
                {more.map((m) => (
                  <a
                    key={m.name}
                    role="menuitem"
                    href={m.href}
                    onClick={(e) => go(e, m.href)}
                    className={`block rounded-2xl px-4 py-3 transition-colors hover:bg-favella-cyan/10 ${route === m.href ? "bg-favella-cyan/10" : ""}`}
                  >
                    <span className="block font-display text-[14.5px] font-semibold text-favella-text-primary">{m.name}</span>
                    <span className="block text-[12.5px] text-favella-text-muted">{m.hint}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* azioni */}
        <div className="flex items-center gap-2">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="FAVELLA 1 su GitHub"
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-white/10 text-favella-text-secondary transition-colors hover:border-favella-cyan/40 hover:text-favella-cyan sm:flex"
          >
            <GitHubIcon className="h-[18px] w-[18px]" />
          </a>
          <a
            href="/download"
            onClick={(e) => go(e, "/download")}
            className="btn-shine relative hidden rounded-full bg-brand-gradient px-5 py-2.5 font-display text-[13.5px] font-bold text-favella-void shadow-[0_10px_30px_-10px_rgba(34,211,238,0.7)] transition-transform hover:-translate-y-px sm:inline-flex"
          >
            Scarica
          </a>
          <button
            onClick={() => setOpen(true)}
            aria-label="Apri il menu"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-favella-text-primary lg:hidden"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h10" />
            </svg>
          </button>
        </div>
      </div>

      {/* menu a tutto schermo (telefono e tablet) */}
      {open && (
        <div className="fixed inset-0 z-[300] overflow-y-auto bg-favella-void/97 px-6 pb-10 pt-5 backdrop-blur-2xl lg:hidden">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_20%_0%,rgba(34,211,238,0.18),transparent_70%),radial-gradient(50%_40%_at_90%_100%,rgba(245,158,11,0.14),transparent_70%)]" />
          <div className="relative mx-auto max-w-[520px]">
            <div className="mb-8 flex items-center justify-between">
              <span className="font-display text-[17px] font-extrabold tracking-[-0.03em]">
                FAVELLA<span className="text-favella-cyan"> 1</span>
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Chiudi il menu"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col" aria-label="Menu">
              {allItems.map((item, i) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => go(e, item.href)}
                  className={`flex items-baseline gap-4 border-b border-white/[0.06] py-3.5 font-display text-[clamp(26px,7vw,34px)] font-bold tracking-[-0.03em] transition-colors ${
                    route === item.href ? "text-favella-cyan-bright" : "text-favella-text-primary hover:text-favella-cyan"
                  }`}
                >
                  <span className="font-mono text-[11px] font-normal tracking-[0.2em] text-favella-text-muted">{String(i + 1).padStart(2, "0")}</span>
                  {item.name}
                </a>
              ))}
            </nav>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/download"
                onClick={(e) => go(e, "/download")}
                className="rounded-full bg-brand-gradient px-7 py-3.5 font-display text-[15px] font-bold text-favella-void"
              >
                Scarica
              </a>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-favella-cyan/30 px-6 py-3.5 font-display text-[15px] font-semibold"
              >
                <GitHubIcon className="h-4 w-4" /> GitHub
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
