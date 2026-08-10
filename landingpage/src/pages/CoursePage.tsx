import { useState } from "react";
import BrandMark from "../components/BrandMark";
import LessonPlayer from "../components/LessonPlayer";
import GamePlayer from "../components/GamePlayer";
import { navigate } from "../router";
import { COURSE_CASSETTES, COURSE_GAMES, LESSONS } from "../data/course";
import type { CassetteRef, GameCassette } from "../data/course";

// --- Scheda cassetta (lezione) nello stile del redesign ---
const CassetteCard = ({ c, onPlay }: { c: CassetteRef; onPlay: (id: string) => void }) => {
  const attiva = c.stato === "attiva";
  const nn = String(c.numero).padStart(2, "0");
  return (
    <button
      disabled={!attiva}
      onClick={() => attiva && c.lessonId && onPlay(c.lessonId)}
      className={`group rounded-[13px] border p-3.5 text-left shadow-[0_14px_34px_-20px_rgba(0,0,0,0.8)] transition-transform duration-300 ${
        attiva
          ? "cursor-pointer border-favella-cyan/14 bg-gradient-to-br from-[#10202f] to-[#0a1622] hover:-translate-y-1"
          : "cursor-not-allowed border-dashed border-favella-text-secondary/15 bg-favella-panel/30"
      }`}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <span className="font-mono text-[9px] tracking-[0.14em] text-favella-amber">FAVELLA · LEZIONE</span>
        <span className="font-mono text-[11px] text-favella-text-muted">{nn}</span>
      </div>
      <div className="mb-3 flex items-center justify-center gap-[18px] rounded-lg border border-favella-cyan/10 bg-favella-void px-3 py-3.5">
        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-favella-text-secondary/40">
          <span className="h-[7px] w-[7px] rounded-full bg-favella-text-muted" />
        </span>
        <span className="h-0.5 flex-1 [background:repeating-linear-gradient(90deg,rgba(159,180,201,0.3)_0_4px,transparent_4px_8px)]" />
        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-favella-text-secondary/40">
          <span className="h-[7px] w-[7px] rounded-full bg-favella-text-muted" />
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="bg-cyan-emerald bg-clip-text font-display text-[20px] font-extrabold text-transparent">{nn}</span>
        <h3 className="font-display text-[13.5px] font-semibold leading-[1.3] text-favella-text-primary">{c.titolo}</h3>
      </div>
    </button>
  );
};

// --- Scheda cassetta-gioco (avventura giocabile col motore vero) ---
const GameCard = ({ g, onPlay }: { g: GameCassette; onPlay: (id: string) => void }) => (
  <button
    onClick={() => onPlay(g.gameId)}
    className="group overflow-hidden rounded-[18px] border border-favella-amber/22 bg-gradient-to-b from-[rgba(40,30,12,0.4)] to-[rgba(20,15,8,0.25)] p-6 text-left transition-transform duration-300 hover:-translate-y-1"
  >
    <div className="mb-2 flex items-center justify-between">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-favella-amber">Cassetta-gioco {String(g.numero).padStart(2, "0")}</span>
      <span className="font-mono text-[11px] text-favella-emerald">● motore reale</span>
    </div>
    <h3 className="font-serif text-[22px] font-semibold text-favella-text-primary">{g.titolo}</h3>
    <p className="mt-0.5 font-mono text-[11px] text-favella-text-muted">{g.fonte}</p>
    <p className="mt-3 text-[14px] leading-[1.6] text-favella-text-secondary">{g.intro}</p>
    <span className="mt-4 inline-flex items-center gap-2 font-display text-[14px] font-semibold text-favella-amber">
      ▶ Gioca nel browser
    </span>
  </button>
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

  // --- Scaffale: pagina in-chrome, stile editoriale del redesign ---
  return (
    <section className="bg-[radial-gradient(110%_60%_at_50%_0%,rgba(245,158,11,0.09),transparent_55%)] px-6 pb-28 pt-[74px]">
      <div className="mx-auto max-w-[1080px]">
        <div className="max-w-[760px]">
          <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.26em] text-favella-amber">Manuale interattivo</p>
          <h1 className="mb-[22px] font-serif text-[clamp(36px,5.4vw,62px)] font-medium leading-[1.08] tracking-[-0.02em] text-favella-text-primary">
            Ventuno cassette,<br />e sotto gira <span className="italic text-ink-accent">FAVELLA davvero</span>.
          </h1>
          <p className="font-serif text-[20px] leading-[1.6] text-favella-text-secondary">
            Un omaggio ai corsi di programmazione su cassetta dei primi anni '80, ma vivo. Una «cassetta» per ogni
            capitolo del manuale: quando una lezione ti chiede una frase, è il motore vero a compilarla.
          </p>
        </div>

        {/* Griglia cassette */}
        <div className="mt-[54px] grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {COURSE_CASSETTES.map((c) => (
            <CassetteCard key={c.numero} c={c} onPlay={setLessonId} />
          ))}
        </div>

        {/* Cassette-gioco */}
        <div className="mt-16">
          <div className="max-w-[760px]">
            <h2 className="mb-3.5 font-serif text-[clamp(24px,3vw,32px)] font-medium text-favella-text-primary">
              E due avventure complete, giocabili dentro la pagina.
            </h2>
            <p className="mb-7 text-[15px] leading-[1.65] text-favella-text-secondary">
              «La Casa di Via Stradivari» e «Il Relitto Silente» — le storie-guida del manuale, giocabili col motore
              vero, qui nel browser. Il corso ti porta fino ai Temi: il caso, le quantità, il mondo che cambia, gli
              stati che si parlano. La prima volta il «nastro» è un po' lungo da caricare.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {COURSE_GAMES.map((g) => (
              <GameCard key={g.gameId} g={g} onPlay={setGameId} />
            ))}
          </div>
          <p className="mt-6 font-mono text-[12px] text-favella-text-muted">
            Cerchi altre storie da giocare?{" "}
            <a
              href="/galleria"
              onClick={(e) => { e.preventDefault(); navigate("/galleria"); }}
              className="cursor-pointer text-favella-cyan hover:text-favella-cyan-bright"
            >
              Vai alla galleria →
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default CoursePage;
