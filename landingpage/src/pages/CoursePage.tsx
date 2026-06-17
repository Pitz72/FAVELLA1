import { useState } from "react";
import BrandMark from "../components/BrandMark";
import LessonPlayer from "../components/LessonPlayer";
import GamePlayer from "../components/GamePlayer";
import { COURSE_CASSETTES, COURSE_GAMES, LESSONS } from "../data/course";
import type { CassetteRef, GameCassette } from "../data/course";

const Cassette = ({ c, onPlay }: { c: CassetteRef; onPlay: (id: string) => void }) => {
  const attiva = c.stato === "attiva";
  return (
    <button
      disabled={!attiva}
      onClick={() => attiva && c.lessonId && onPlay(c.lessonId)}
      className={`group relative w-full overflow-hidden rounded-xl border p-4 text-left transition-all duration-300 ${
        attiva
          ? "glass glow-border cursor-pointer border-favella-cyan/20 hover:-translate-y-1"
          : "cursor-not-allowed border-dashed border-favella-text-secondary/15 bg-favella-panel/30"
      }`}
    >
      <div className={`rounded-lg border p-3 ${attiva ? "border-favella-cyan/20 bg-favella-void/50" : "border-favella-text-secondary/10 bg-favella-void/30"}`}>
        <div className="flex items-center justify-between">
          <span className={`font-mono text-[11px] tracking-[0.18em] ${attiva ? "text-favella-cyan" : "text-favella-text-muted"}`}>
            CASSETTA {String(c.numero).padStart(2, "0")}
          </span>
          <span className="flex gap-3">
            <span className={`h-3 w-3 rounded-full border ${attiva ? "border-favella-cyan/40 bg-favella-void" : "border-favella-text-secondary/20 bg-favella-void/60"}`} />
            <span className={`h-3 w-3 rounded-full border ${attiva ? "border-favella-cyan/40 bg-favella-void" : "border-favella-text-secondary/20 bg-favella-void/60"}`} />
          </span>
        </div>
        <p className={`mt-2 font-display text-lg leading-tight ${attiva ? "text-favella-text-primary" : "text-favella-text-secondary/70"}`}>
          {c.titolo}
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-favella-text-muted">{c.fonte}</p>
        <div className={`mt-3 h-1 rounded-full ${attiva ? "bg-gradient-to-r from-favella-cyan/50 to-favella-emerald/40" : "bg-favella-text-secondary/15"}`} />
      </div>
      <div className="mt-3 flex items-center justify-between px-1">
        {attiva ? (
          <span className="inline-flex items-center gap-2 text-sm font-medium text-favella-cyan">▶ Riproduci</span>
        ) : (
          <span className="font-mono text-[11px] uppercase tracking-wider text-favella-text-muted">In arrivo</span>
        )}
      </div>
    </button>
  );
};

const GameCassetteCard = ({ g, onPlay }: { g: GameCassette; onPlay: (id: string) => void }) => (
  <button
    onClick={() => onPlay(g.gameId)}
    className="group glass glow-border relative w-full overflow-hidden rounded-xl border border-favella-emerald/25 p-5 text-left transition-all duration-300 hover:-translate-y-1"
  >
    <div className="flex items-center justify-between">
      <span className="font-mono text-[11px] tracking-[0.18em] text-favella-emerald">CASSETTA-GIOCO {String(g.numero).padStart(2, "0")}</span>
      <span className="flex gap-3">
        <span className="h-3 w-3 rounded-full border border-favella-emerald/40 bg-favella-void" />
        <span className="h-3 w-3 rounded-full border border-favella-emerald/40 bg-favella-void" />
      </span>
    </div>
    <p className="mt-2 font-display text-xl leading-tight text-favella-text-primary">{g.titolo}</p>
    <p className="mt-0.5 font-mono text-[11px] text-favella-text-muted">{g.fonte}</p>
    <p className="mt-3 text-sm leading-relaxed text-favella-text-secondary">{g.intro}</p>
    <div className="mt-3 h-1 rounded-full bg-gradient-to-r from-favella-emerald/60 to-favella-cyan/40" />
    <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-favella-emerald">▶ Gioca · motore reale nel browser</span>
  </button>
);

const CoursePage = () => {
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const lesson = lessonId ? LESSONS[lessonId] : null;
  const game = gameId ? COURSE_GAMES.find((g) => g.gameId === gameId) ?? null : null;

  const esciDalCorso = () => {
    window.location.hash = "#/";
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Sfondo immersivo */}
      <div className="aurora aurora-cyan" />
      <div className="aurora aurora-emerald" />
      <div className="pointer-events-none absolute inset-0 bg-vignette" />

      {/* Barra superiore minimale (l'unico residuo di «sito») */}
      <header className="relative z-10 flex items-center justify-between px-5 py-4 md:px-8">
        <a href="#/" onClick={(e) => { e.preventDefault(); esciDalCorso(); }} className="flex items-center gap-3 group">
          <BrandMark size={36} glow={false} className="transition-transform duration-300 group-hover:scale-105" />
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-favella-text-secondary group-hover:text-favella-cyan transition-colors">
            ← Esci dal corso
          </span>
        </a>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-favella-cyan">Manuale interattivo</span>
      </header>

      {game ? (
        // --- Cassetta-gioco: avventura giocabile col motore vero ---
        <div className="relative z-10 flex min-h-[calc(100vh-72px)] items-center justify-center px-4 pb-8 md:px-8">
          <GamePlayer game={game} onExit={() => setGameId(null)} />
        </div>
      ) : lesson ? (
        // --- Lezione: il monitor è il protagonista, centrato ---
        <div className="relative z-10 flex min-h-[calc(100vh-72px)] items-center justify-center px-4 pb-8 md:px-8">
          <LessonPlayer lesson={lesson} onExit={() => setLessonId(null)} />
        </div>
      ) : (
        // --- Scaffale delle cassette ---
        <div className="relative z-10 mx-auto max-w-5xl px-5 pb-16 md:px-8">
          <div className="mt-4 flex items-center gap-5">
            <BrandMark size={64} />
            <div>
              <h1 className="font-display text-3xl font-extrabold text-white md:text-4xl">Il corso su cassetta</h1>
              <p className="font-mono text-sm text-favella-cyan">ogni capitolo è una cassetta · ogni cassetta è una lezione</p>
            </div>
          </div>

          <p className="mt-6 max-w-2xl leading-7 text-favella-text-secondary">
            Un omaggio ai corsi di programmazione su cassetta dei primi anni '80 — su tutti
            <em> «Conoscere il Computer direttamente dal Computer»</em> (Edizioni Beatrice d'Este).
            Inserisci una cassetta e la lezione si forma una riga alla volta, come allora. Ogni tanto
            toccherà a te scrivere una frase di FAVELLA.
          </p>
          <p className="mt-2 font-mono text-xs text-favella-text-muted">
            Le ventuno cassette del corso sono tutte giocabili: comincia dalla 01 e prosegui in ordine.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {COURSE_CASSETTES.map((c) => (
              <Cassette key={c.numero} c={c} onPlay={setLessonId} />
            ))}
          </div>

          {/* Sezione cassette-gioco */}
          <div className="mt-12">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-2xl font-bold text-favella-text-primary">🎮 Cassette-gioco</h2>
              <span className="rounded-full border border-favella-emerald/30 bg-favella-emerald/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-favella-emerald">
                motore reale
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-favella-text-secondary">
              Come le cassette dell'epoca, che oltre alle lezioni contenevano un gioco: qui giochi
              un'avventura vera: il motore FAVELLA gira nel tuo browser. La prima volta il nastro è
              un po' lungo da caricare.
            </p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {COURSE_GAMES.map((g) => (
                <GameCassetteCard key={g.gameId} g={g} onPlay={setGameId} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursePage;
