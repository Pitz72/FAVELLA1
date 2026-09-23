import { useState } from "react";
import BrandMark from "../components/BrandMark";
import GamePlayer from "../components/GamePlayer";
import { GALLERY_STORIES } from "../data/course";
import { GITHUB_URL } from "../constants";
import ViaggiatoreBanner from "../components/ViaggiatoreBanner";
import type { GameCassette } from "../data/course";

// Stili di «copertina» (trama a righe) variati per scheda.
const COVERS = [
  { stripe: "repeating-linear-gradient(135deg,#0e2230 0 14px,#0b1a26 14px 28px)", accent: "text-favella-cyan", border: "border-favella-cyan/12" },
  { stripe: "repeating-linear-gradient(135deg,#10221a 0 14px,#0b1a16 14px 28px)", accent: "text-favella-emerald", border: "border-favella-emerald/12" },
  { stripe: "repeating-linear-gradient(135deg,#23190e 0 14px,#1a1208 14px 28px)", accent: "text-favella-amber", border: "border-favella-amber/18" },
];

const StoryCard = ({ s, i, onPlay }: { s: GameCassette; i: number; onPlay: (id: string) => void }) => {
  const cov = COVERS[i % COVERS.length];
  // fonte es. «⭐ facile · mistero atmosferico» → difficoltà + genere
  const [diff, genere] = s.fonte.split("·").map((x) => x.trim());
  return (
    <div className="group flex flex-col overflow-hidden rounded-[18px] border border-favella-cyan/14 bg-gradient-to-b from-favella-surface/50 to-favella-panel/35">
      <div className={`relative aspect-video overflow-hidden border-b ${cov.border}`}>
        {s.cover ? (
          <img
            src={`${import.meta.env.BASE_URL}covers/${s.cover}`}
            alt={`Copertina di ${s.titolo}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2" style={{ background: cov.stripe }}>
            <span className={`font-mono text-[10px] uppercase tracking-[0.18em] ${cov.accent}`}>★ avventura ufficiale</span>
            <span className="font-mono text-[11px] text-favella-text-muted">[ {s.titolo.toLowerCase()} ]</span>
          </div>
        )}
        {s.cover && (
          <>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-favella-panel/75 via-transparent to-favella-void/20" />
            <span className={`absolute left-3 top-3 rounded-full bg-favella-void/65 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] backdrop-blur-sm ${cov.accent}`}>
              ★ ufficiale
            </span>
          </>
        )}
      </div>
      <div className="flex flex-1 flex-col p-7">
        <span className={`mb-2.5 font-mono text-[10px] uppercase tracking-[0.12em] ${cov.accent}`}>{genere}</span>
        <h3 className="mb-2.5 font-serif text-[24px] font-semibold text-favella-text-primary">{s.titolo}</h3>
        <p className="mb-[18px] flex-1 text-[14.5px] leading-[1.6] text-favella-text-secondary">{s.intro}</p>
        <div className="mb-5 flex gap-3 font-mono text-[11px] text-favella-text-muted">
          <span>{diff}</span>
          <span>·</span>
          <span className="text-favella-emerald">vincibile</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onPlay(s.gameId)}
            className="flex-1 rounded-[10px] bg-brand-gradient py-2.5 text-center font-display text-[13.5px] font-bold text-favella-void"
          >
            Gioca ora
          </button>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[10px] border border-favella-cyan/22 px-4 py-2.5 font-display text-[13.5px] font-semibold text-favella-text-primary transition-colors hover:border-favella-cyan/50"
          >
            Codice
          </a>
        </div>
      </div>
    </div>
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

  // Vetrina in-chrome, stile redesign.
  return (
    <section className="px-6 pb-28 pt-[74px]">
      <div className="mx-auto max-w-[1080px]">
        <div className="max-w-[760px]">
          <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.26em] text-favella-cyan">La Galleria ufficiale</p>
          <h1 className="mb-[22px] font-serif text-[clamp(36px,5.4vw,62px)] font-medium leading-[1.08] tracking-[-0.02em] text-favella-text-primary">
            Tutte le avventure,<br /><span className="italic text-ink-accent">tutte vincibili</span>.
          </h1>
          <p className="font-serif text-[20px] leading-[1.6] text-favella-text-secondary">
            Le tre brevi ufficiali, le due storie del manuale e gli stress-test di genere: ogni avventura che abbiamo,
            da leggere come esempio e da rigiocare — qui sul sito col motore vero, o dalla riga di comando con{" "}
            <code className="rounded-[5px] bg-favella-cyan/10 px-1.5 py-px font-mono text-favella-cyan-bright">favella1 galleria</code>.
          </p>
        </div>

        <ViaggiatoreBanner />

        <div className="mt-[54px] grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {GALLERY_STORIES.map((s, i) => (
            <StoryCard key={s.gameId} s={s} i={i} onPlay={setGameId} />
          ))}
        </div>

        <div className="mt-11 flex flex-wrap items-center justify-between gap-3.5 rounded-[14px] border border-favella-cyan/12 bg-favella-panel px-6 py-5">
          <p className="m-0 text-[14.5px] text-favella-text-secondary">
            Hai scritto una storia? La galleria è aperta: scrivi in italiano, condividi un link.
          </p>
          <code className="rounded-lg bg-favella-cyan/10 px-3.5 py-[7px] font-mono text-[13px] text-favella-cyan-bright">favella1 galleria</code>
        </div>
      </div>
    </section>
  );
};

export default GalleryPage;
