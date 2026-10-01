import { useState } from "react";
import BrandMark from "../components/BrandMark";
import GamePlayer from "../components/GamePlayer";
import { GALLERY_STORIES } from "../data/course";
import { GITHUB_ESEMPI_URL } from "../constants";
import { Ink, PageHero, Reveal, Spot } from "../ui/primitives";
import ViaggiatoreBanner from "../components/ViaggiatoreBanner";
import type { GameCassette } from "../data/course";

const ACCENTI = ["text-favella-cyan", "text-favella-emerald", "text-favella-amber"];

const StoryCard = ({ s, i, onPlay }: { s: GameCassette; i: number; onPlay: (id: string) => void }) => {
  const accent = ACCENTI[i % ACCENTI.length];
  // fonte es. «⭐ facile · mistero atmosferico» → difficoltà + genere
  const [diff, genere] = s.fonte.split("·").map((x) => x.trim());
  return (
    <Spot className="group flex h-full flex-col overflow-hidden !rounded-[26px]">
      <div className="relative aspect-video overflow-hidden">
        {s.cover && (
          <img
            src={`${import.meta.env.BASE_URL}covers/${s.cover}`}
            alt={`Copertina di ${s.titolo}`}
            width={1000}
            height={558}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-favella-panel via-favella-panel/10 to-transparent" />
        <span className={`absolute left-4 top-4 rounded-full bg-favella-void/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] backdrop-blur ${accent}`}>
          {genere}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-7">
        <h3 className="mb-2.5 font-display text-[25px] font-bold leading-[1.1] tracking-[-0.03em] text-favella-text-primary">{s.titolo}</h3>
        <p className="mb-5 flex-1 font-serif text-[15px] leading-[1.65] text-favella-text-secondary">{s.intro}</p>
        <div className="mb-5 flex gap-3 font-mono text-[11px] uppercase tracking-[0.1em] text-favella-text-muted">
          <span>{diff.replace(/⭐/g, "★")}</span>
          <span>·</span>
          <span className="text-favella-emerald">vincibile</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onPlay(s.gameId)}
            className="btn-shine relative flex-1 rounded-full bg-brand-gradient py-3 text-center font-display text-[14px] font-bold text-favella-void transition-transform hover:-translate-y-0.5"
          >
            Gioca ora
          </button>
          <a
            href={GITHUB_ESEMPI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-favella-cyan/25 px-5 py-3 font-display text-[14px] font-semibold text-favella-text-primary transition-colors hover:border-favella-cyan/60"
          >
            Codice
          </a>
        </div>
      </div>
    </Spot>
  );
};

const GalleryPage = () => {
  const [gameId, setGameId] = useState<string | null>(null);
  const game = gameId ? GALLERY_STORIES.find((g) => g.gameId === gameId) ?? null : null;

  // Player attivo: storia giocabile col motore vero (logica INTOCCATA), in overlay.
  if (game) {
    return (
      <div className="fixed inset-0 z-[200] overflow-y-auto bg-favella-void">
        <div className="aurora aurora-amber" />
        <div className="aurora aurora-cyan" />
        <div className="pointer-events-none fixed inset-0 bg-vignette" />
        <header className="relative z-10 flex items-center justify-between px-5 py-4 md:px-8">
          <button onClick={() => setGameId(null)} className="group flex items-center gap-3">
            <BrandMark size={36} glow={false} className="transition-transform duration-300 group-hover:scale-105" />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-favella-text-secondary transition-colors group-hover:text-favella-cyan">
              ← Torna alla galleria
            </span>
          </button>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-favella-amber">Galleria ufficiale</span>
        </header>
        <div className="relative z-10 flex min-h-[calc(100vh-72px)] items-center justify-center px-4 pb-8 md:px-8">
          <GamePlayer game={game} onExit={() => setGameId(null)} />
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHero
        tone="amber"
        eyebrow="La galleria ufficiale"
        title={
          <>
            Tutte le avventure, <Ink>tutte vincibili.</Ink>
          </>
        }
        lead={
          <>
            Le tre brevi ufficiali, le due storie del manuale e gli stress-test di genere: ogni avventura che abbiamo, da leggere come esempio e da rigiocare, qui sul sito
            col motore vero o dalla riga di comando con{" "}
            <code className="rounded-md bg-favella-cyan/10 px-1.5 py-px font-mono text-favella-cyan-bright">favella1 galleria</code>.
          </>
        }
      />

      <section className="px-6 pb-14">
        <div className="mx-auto max-w-[1240px]">
          <ViaggiatoreBanner />
        </div>
      </section>

      <section className="px-6 pb-14">
        <div className="mx-auto grid max-w-[1240px] gap-6 md:grid-cols-2 lg:grid-cols-3">
          {GALLERY_STORIES.map((s, i) => (
            <Reveal key={s.gameId} delay={(i % 3) * 90}>
              <StoryCard s={s} i={i} onPlay={setGameId} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="px-6 pb-8">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 rounded-[24px] border border-favella-cyan/15 bg-favella-panel/60 px-7 py-6">
          <p className="m-0 font-serif text-[16.5px] text-favella-text-secondary">Hai scritto una storia? Scrivi in italiano, condividi un link.</p>
          <code className="rounded-full bg-favella-cyan/10 px-4 py-2 font-mono text-[13px] text-favella-cyan-bright">favella1 galleria</code>
        </div>
      </section>
    </>
  );
};

export default GalleryPage;
