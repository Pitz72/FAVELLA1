import { useState } from "react";
import BrandMark from "../components/BrandMark";
import LessonPlayer from "../components/LessonPlayer";
import GamePlayer from "../components/GamePlayer";
import { Link } from "../router";
import { Ink, PageHero, Reveal, SectionHead, Spot } from "../ui/primitives";
import { COURSE_CASSETTES, COURSE_GAMES, LESSONS } from "../data/course";
import type { CassetteRef, GameCassette } from "../data/course";

// --- Scheda cassetta (lezione) ---
const CassetteCard = ({ c, onPlay }: { c: CassetteRef; onPlay: (id: string) => void }) => {
  const attiva = c.stato === "attiva";
  const nn = String(c.numero).padStart(2, "0");
  return (
    <Spot
      as="button"
      disabled={!attiva}
      onClick={() => attiva && c.lessonId && onPlay(c.lessonId)}
      className={`group block h-full w-full !rounded-[18px] p-4 text-left ${attiva ? "cursor-pointer" : "cursor-not-allowed opacity-55"}`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="whitespace-nowrap font-mono text-[9px] tracking-[0.16em] text-favella-amber">FAVELLA · LEZIONE</span>
        <span className="font-mono text-[11px] text-favella-text-muted">{nn}</span>
      </div>
      <div className="mb-4 flex items-center justify-center gap-[18px] rounded-xl border border-favella-cyan/10 bg-favella-void px-3 py-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-favella-text-secondary/40 transition-transform duration-700 group-hover:rotate-[360deg]">
          <span className="h-[7px] w-[7px] rounded-full bg-favella-text-muted" />
        </span>
        <span className="h-0.5 flex-1 [background:repeating-linear-gradient(90deg,rgba(159,180,201,0.3)_0_4px,transparent_4px_8px)]" />
        <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-favella-text-secondary/40 transition-transform duration-700 group-hover:rotate-[360deg]">
          <span className="h-[7px] w-[7px] rounded-full bg-favella-text-muted" />
        </span>
      </div>
      <div className="flex items-baseline gap-2.5">
        <span className="bg-cyan-emerald bg-clip-text font-display text-[26px] font-extrabold leading-none tracking-[-0.04em] text-transparent">{nn}</span>
        <h3 className="font-display text-[14px] font-semibold leading-[1.3] text-favella-text-primary">{c.titolo}</h3>
      </div>
    </Spot>
  );
};

// --- Scheda cassetta-gioco (avventura giocabile col motore vero) ---
const GameCard = ({ g, onPlay }: { g: GameCassette; onPlay: (id: string) => void }) => (
  <Spot as="button" onClick={() => onPlay(g.gameId)} className="group flex h-full w-full flex-col p-8 text-left">
    <div className="mb-3 flex items-center justify-between">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-favella-amber">Cassetta-gioco {String(g.numero).padStart(2, "0")}</span>
      <span className="font-mono text-[11px] text-favella-emerald">● motore reale</span>
    </div>
    <h3 className="font-display text-[26px] font-bold tracking-[-0.03em] text-favella-text-primary">{g.titolo}</h3>
    <p className="mt-1 font-mono text-[11px] text-favella-text-muted">{g.fonte}</p>
    <p className="mt-4 flex-1 font-serif text-[15.5px] leading-[1.65] text-favella-text-secondary">{g.intro}</p>
    <span className="mt-5 inline-flex items-center gap-2 font-display text-[14.5px] font-semibold text-favella-amber transition-transform group-hover:translate-x-1">
      ▶ Gioca nel browser
    </span>
  </Spot>
);

const CoursePage = () => {
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const lesson = lessonId ? LESSONS[lessonId] : null;
  const game = gameId ? COURSE_GAMES.find((g) => g.gameId === gameId) ?? null : null;

  // --- Player attivo: esperienza immersiva (logica INTOCCATA), in overlay ---
  if (lesson || game) {
    return (
      <div className="fixed inset-0 z-[200] overflow-y-auto bg-favella-void">
        <div className="aurora aurora-cyan" />
        <div className="aurora aurora-emerald" />
        <div className="pointer-events-none fixed inset-0 bg-vignette" />
        <header className="relative z-10 flex items-center justify-between px-5 py-4 md:px-8">
          <button
            onClick={() => { setLessonId(null); setGameId(null); }}
            className="group flex items-center gap-3"
          >
            <BrandMark size={36} glow={false} className="transition-transform duration-300 group-hover:scale-105" />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-favella-text-secondary transition-colors group-hover:text-favella-cyan">
              ← Torna allo scaffale
            </span>
          </button>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-favella-cyan">Manuale interattivo</span>
        </header>
        <div className="relative z-10 flex min-h-[calc(100vh-72px)] items-center justify-center px-4 pb-8 md:px-8">
          {game ? (
            <GamePlayer game={game} onExit={() => setGameId(null)} />
          ) : (
            lesson && <LessonPlayer lesson={lesson} onExit={() => setLessonId(null)} />
          )}
        </div>
      </div>
    );
  }

  // --- Scaffale: pagina in-chrome ---
  return (
    <>
      <PageHero
        tone="amber"
        eyebrow="Manuale interattivo"
        title={
          <>
            Ventuno cassette, e sotto gira <Ink>FAVELLA davvero.</Ink>
          </>
        }
        lead="Un omaggio ai corsi di programmazione su cassetta dei primi anni '80, ma vivo. Una «cassetta» per ogni capitolo del manuale: quando una lezione ti chiede una frase, è il motore vero a compilarla."
      />

      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {COURSE_CASSETTES.map((c, i) => (
            <Reveal key={c.numero} delay={(i % 5) * 50}>
              <CassetteCard c={c} onPlay={setLessonId} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Cassette-gioco */}
      <section className="px-6 pb-12">
        <div className="mx-auto max-w-[1240px]">
          <SectionHead
            eyebrow="Si gioca anche"
            tone="amber"
            title={
              <>
                Due avventure complete, <Ink>dentro la pagina.</Ink>
              </>
            }
            lead="«La Casa di Via Stradivari» e «Il Relitto Silente», le storie-guida del manuale, giocabili col motore vero. Il corso ti porta fino ai Temi: il caso, le quantità, il mondo che cambia, gli stati che si parlano. La prima volta il «nastro» è un po' lungo da caricare."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            {COURSE_GAMES.map((g, i) => (
              <Reveal key={g.gameId} delay={i * 100}>
                <GameCard g={g} onPlay={setGameId} />
              </Reveal>
            ))}
          </div>
          <p className="mt-8 font-mono text-[12px] text-favella-text-muted">
            Cerchi altre storie da giocare?{" "}
            <Link to="/galleria" className="text-favella-cyan hover:text-favella-cyan-bright">
              Vai alla galleria →
            </Link>
          </p>
        </div>
      </section>
    </>
  );
};

export default CoursePage;
