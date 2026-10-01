import React, { useRef } from "react";
import logo from "../assets/logo.png";
import { PAPERBACK } from "../constants";
import { skipMotion } from "./hooks";
import { evidenzia } from "./LivingBook";

// Il manuale cartaceo come oggetto: un volume in 3D vero (facce nello spazio)
// che segue il puntatore. La copertina è disegnata in HTML con la grafica reale
// del libro in vendita su Amazon.it (edizione e versione stanno in PAPERBACK).

const Cover = () => (
  <div className="relative flex h-full w-full flex-col items-center overflow-hidden bg-[#06101c] px-5 pb-5 pt-6 text-center">
    {/* alone dietro il marchio */}
    <div
      aria-hidden="true"
      className="absolute left-1/2 top-[11%] h-[210px] w-[210px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(204,236,240,0.92),rgba(34,211,238,0.30)_46%,transparent_72%)] blur-[2px]"
    />
    {/* mappa in filigrana */}
    <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[44%] opacity-60">
      <div className="absolute bottom-6 left-3 h-9 w-[68px] rounded-md border border-favella-cyan/20 bg-favella-cyan/[0.04]" />
      <div className="absolute bottom-16 left-[92px] h-9 w-[68px] rounded-md border border-favella-emerald/30 bg-favella-emerald/[0.07]" />
      <div className="absolute bottom-3 right-4 h-9 w-[68px] rounded-md border border-favella-cyan/20 bg-favella-cyan/[0.04]" />
      <div className="absolute bottom-[58px] right-[88px] h-px w-10 bg-favella-cyan/25" />
    </div>

    <p className="relative z-10 font-mono text-[7.5px] font-medium uppercase tracking-[0.42em] text-favella-cyan-bright">
      Manuale di programmazione
    </p>
    <img src={logo} alt="" className="relative z-10 mt-3 h-[96px] w-[96px] object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.5)]" draggable={false} />
    <p className="relative z-10 mt-3 font-display text-[44px] font-bold leading-none tracking-[-0.04em] text-white">FAVELLA 1</p>
    <span className="relative z-10 mt-2.5 rounded-full border border-favella-cyan/50 px-3 py-[2px] font-mono text-[9px] font-medium tracking-[0.3em] text-favella-cyan-bright">
      {PAPERBACK.version.split("").join(" ")}
    </span>
    <p className="relative z-10 mt-3 font-display text-[12.5px] font-semibold leading-[1.3] text-favella-text-primary">
      Il linguaggio della narrativa<br />interattiva in italiano
    </p>

    <div className="relative z-10 mt-auto w-full rounded-[7px] border border-favella-amber/45 bg-[#03070e]/90 px-3 py-2.5 text-left font-mono text-[8.5px] leading-[1.7]">
      <div>{evidenzia("La cucina è una stanza.")}</div>
      <div>{evidenzia("Il tavolo è nella cucina.")}</div>
      <div className="mt-1 border-t border-favella-cyan/15 pt-1 text-favella-emerald/90">› La cucina esiste. C'è un tavolo.</div>
    </div>
    <p className="relative z-10 mt-3 font-display text-[11px] font-medium text-favella-text-primary">Simone Pizzi</p>
    <p className="relative z-10 mt-1 font-mono text-[6.5px] uppercase tracking-[0.32em] text-favella-text-muted">
      {PAPERBACK.edition} · 2026
    </p>
    {/* riflesso della luce sulla plastificazione */}
    <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.20),rgba(255,255,255,0.03)_26%,transparent_42%)]" />
    <div aria-hidden="true" className="absolute inset-y-0 left-0 w-[5px] bg-[linear-gradient(90deg,rgba(0,0,0,0.5),transparent)]" />
  </div>
);

const Libro3D = ({ className = "", etichette = true, scala = 1 }: { className?: string; etichette?: boolean; scala?: number }) => {
  const stage = useRef<HTMLDivElement | null>(null);
  const book = useRef<HTMLDivElement | null>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (skipMotion() || !stage.current || !book.current) return;
    const r = stage.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    book.current.classList.add("is-live");
    book.current.style.setProperty("--ry", `${(-28 + px * 38).toFixed(1)}deg`);
    book.current.style.setProperty("--rx", `${(6 - py * 22).toFixed(1)}deg`);
  };
  const onLeave = () => {
    if (!book.current) return;
    book.current.classList.remove("is-live");
    book.current.style.setProperty("--ry", "-28deg");
    book.current.style.setProperty("--rx", "6deg");
  };

  return (
    <div
      ref={stage}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`book-stage relative flex items-center justify-center py-10 ${className}`}
    >
      {/* ombra a terra */}
      <div
        aria-hidden="true"
        className="absolute bottom-3 left-1/2 h-10 w-[320px] -translate-x-1/2 rounded-[50%] bg-black/70 blur-xl"
      />
      <div className="animate-float [transform-style:preserve-3d]">
        <div
          ref={book}
          className="book"
          style={{ "--w": `${270 * scala}px`, "--h": `${380 * scala}px`, "--d": `${34 * scala}px` } as React.CSSProperties}
        >
          <div className="book-front shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]">
            <div style={{ width: 270, height: 380, transform: `scale(${scala})`, transformOrigin: "top left" }}>
              <Cover />
            </div>
          </div>
          <div className="book-back" />
          <div className="book-spine">
            <img src={logo} alt="" className="absolute left-1/2 top-[12%] h-[60%] max-h-[22px] w-auto -translate-x-1/2 rotate-90 opacity-80" draggable={false} />
          </div>
          <div className="book-pages" />
          <div className="book-top" />
          <div className="book-bottom" />
        </div>
      </div>

      {etichette && (
        <>
          <span className="absolute left-0 top-[12%] hidden rounded-full border border-favella-cyan/30 bg-favella-void/70 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-favella-cyan backdrop-blur sm:block">
            {PAPERBACK.pages} pagine
          </span>
          <span className="absolute right-0 top-[34%] hidden rounded-full border border-favella-emerald/30 bg-favella-void/70 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-favella-emerald backdrop-blur sm:block">
            a colori
          </span>
        </>
      )}
    </div>
  );
};

export default Libro3D;
