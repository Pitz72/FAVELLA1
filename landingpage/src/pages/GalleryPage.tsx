import { useState } from "react";
import BrandMark from "../components/BrandMark";
import GamePlayer from "../components/GamePlayer";
import { GALLERY_STORIES } from "../data/course";
import type { GameCassette } from "../data/course";

const StoryCard = ({ s, onPlay }: { s: GameCassette; onPlay: (id: string) => void }) => (
  <button
    onClick={() => onPlay(s.gameId)}
    className="group glass glow-border relative w-full overflow-hidden rounded-xl border border-favella-amber/25 p-5 text-left transition-all duration-300 hover:-translate-y-1"
  >
    <div className="flex items-center justify-between">
      <span className="font-mono text-[11px] tracking-[0.18em] text-favella-amber">
        STORIA {String(s.numero).padStart(2, "0")}
      </span>
      <span className="flex gap-3">
        <span className="h-3 w-3 rounded-full border border-favella-amber/40 bg-favella-void" />
        <span className="h-3 w-3 rounded-full border border-favella-amber/40 bg-favella-void" />
      </span>
    </div>
    <p className="mt-2 font-display text-xl leading-tight text-favella-text-primary">{s.titolo}</p>
    <p className="mt-0.5 font-mono text-[11px] text-favella-text-muted">{s.fonte}</p>
    <p className="mt-3 text-sm leading-relaxed text-favella-text-secondary">{s.intro}</p>
    <div className="mt-3 h-1 rounded-full bg-gradient-to-r from-favella-amber/60 to-favella-cyan/40" />
    <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-favella-amber">
      ▶ Gioca · motore reale nel browser
    </span>
  </button>
);

const GalleryPage = () => {
  const [gameId, setGameId] = useState<string | null>(null);
  const game = gameId ? GALLERY_STORIES.find((g) => g.gameId === gameId) ?? null : null;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Sfondo immersivo */}
      <div className="aurora aurora-amber" />
      <div className="aurora aurora-cyan" />
      <div className="pointer-events-none absolute inset-0 bg-vignette" />

      {/* Barra superiore minimale */}
      <header className="relative z-10 flex items-center justify-between px-5 py-4 md:px-8">
        <a
          href="#/"
          onClick={(e) => {
            e.preventDefault();
            window.location.hash = "#/";
          }}
          className="flex items-center gap-3 group"
        >
          <BrandMark size={36} glow={false} className="transition-transform duration-300 group-hover:scale-105" />
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-favella-text-secondary group-hover:text-favella-cyan transition-colors">
            ← Torna al sito
          </span>
        </a>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-favella-amber">Galleria ufficiale</span>
      </header>

      {game ? (
        <div className="relative z-10 flex min-h-[calc(100vh-72px)] items-center justify-center px-4 pb-8 md:px-8">
          <GamePlayer game={game} onExit={() => setGameId(null)} />
        </div>
      ) : (
        <div className="relative z-10 mx-auto max-w-5xl px-5 pb-16 md:px-8">
          <div className="mt-4 flex items-center gap-5">
            <BrandMark size={64} />
            <div>
              <h1 className="font-display text-3xl font-extrabold text-white md:text-4xl">La Galleria ufficiale</h1>
              <p className="font-mono text-sm text-favella-amber">storie brevi, complete e vincibili · scritte in italiano</p>
            </div>
          </div>

          <p className="mt-6 max-w-2xl leading-7 text-favella-text-secondary">
            Tre avventure pensate come esempi: corte, finibili in pochi minuti, e ognuna mette in mostra
            un angolo diverso del linguaggio. Le giochi qui, nel browser, col motore FAVELLA vero —
            la prima volta il «nastro» è un po' lungo da caricare. Le stesse storie sono nel pacchetto
            <span className="font-mono text-favella-text-primary"> favella1</span> (le sfogli con
            <span className="font-mono text-favella-text-primary"> favella1 galleria</span>): leggerne il
            sorgente è il modo migliore per imparare i pattern.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {GALLERY_STORIES.map((s) => (
              <StoryCard key={s.gameId} s={s} onPlay={setGameId} />
            ))}
          </div>

          <p className="mt-10 font-mono text-xs text-favella-text-muted">
            Vuoi vedere come sono fatte dentro? Il sorgente .fav di ognuna è nel repository, in
            <span className="text-favella-text-secondary"> favella1/galleria/</span>.
          </p>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
