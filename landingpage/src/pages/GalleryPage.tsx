import { useState } from "react";
import BrandMark from "../components/BrandMark";
import GamePlayer from "../components/GamePlayer";
import { GALLERY_STORIES } from "../data/course";
import { GITHUB_URL } from "../constants";
import type { GameCassette } from "../data/course";

// ── Banner dell'esperimento «Il Viaggiatore» — scena desertica in SVG ──
// NB: porta all'APP SEPARATA (proprio entry/build sotto /esperimento/), non a
// una rotta della SPA: serve un FULL RELOAD, quindi un vero <a href> (niente
// Link interno del router). Apertura a pagina piena.
const ViaggiatoreBanner = () => (
  <a
    href="/esperimento/"
    className="group relative mt-[44px] block overflow-hidden rounded-[18px] border border-favella-amber/25 bg-favella-void shadow-glow-card transition-all hover:border-favella-amber/55"
  >
    {/* arte: il deserto, i pali, il viandante che cammina */}
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 360"
      preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="gb-sky" cx="70%" cy="6%" r="100%">
          <stop offset="0%" stopColor="#2a1c10" />
          <stop offset="45%" stopColor="#130d0a" />
          <stop offset="100%" stopColor="#05060b" />
        </radialGradient>
        <radialGradient id="gb-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f6c97d" stopOpacity="0.95" />
          <stop offset="38%" stopColor="#e6a85a" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#e6a85a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="gb-d1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1c130a" /><stop offset="100%" stopColor="#0a0807" />
        </linearGradient>
        <linearGradient id="gb-d2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#120d0b" /><stop offset="100%" stopColor="#070609" />
        </linearGradient>
        <linearGradient id="gb-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#05060b" stopOpacity="0.96" />
          <stop offset="52%" stopColor="#05060b" stopOpacity="0.62" />
          <stop offset="100%" stopColor="#05060b" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <rect width="1200" height="360" fill="url(#gb-sky)" />
      <circle cx="880" cy="120" r="190" fill="url(#gb-sun)" />
      <circle cx="880" cy="120" r="40" fill="#f3bd6f" opacity="0.85" />
      {/* dune lontane / vicine */}
      <path d="M0 232 Q320 196 600 226 T1200 214 V360 H0 Z" fill="url(#gb-d2)" opacity="0.85" />
      <path d="M0 280 Q280 250 560 278 T1040 268 T1200 286 V360 H0 Z" fill="url(#gb-d1)" />
      {/* pali della corrente, scheletrici, con un filo cascante */}
      <g stroke="#2a2018" strokeWidth="3" opacity="0.55" fill="none">
        <line x1="360" y1="262" x2="360" y2="150" /><line x1="343" y1="172" x2="377" y2="172" />
        <line x1="620" y1="272" x2="620" y2="168" /><line x1="603" y1="188" x2="637" y2="188" />
        <path d="M360 172 Q490 230 620 188" strokeWidth="1.5" opacity="0.5" />
      </g>
      {/* il viandante: una figura sola che cammina verso il sole */}
      <g fill="#0c0a09" transform="translate(470 252)">
        <circle cx="0" cy="-44" r="7.5" />
        <path d="M-6 -36 Q-9 -16 -3 -2 L3 -2 Q9 -18 6 -36 Z" />
        <path d="M-3 -2 L-10 22 M3 -2 L9 24" stroke="#0c0a09" strokeWidth="5" strokeLinecap="round" />
        <path d="M-5 -28 L-15 -12 M5 -28 L16 -16" stroke="#0c0a09" strokeWidth="4.5" strokeLinecap="round" />
        {/* il fagotto sulle spalle */}
        <circle cx="10" cy="-26" r="5" fill="#1a140d" />
      </g>
    </svg>
    {/* velo per la leggibilità del testo a sinistra */}
    <div className="absolute inset-0" style={{ background: "linear-gradient(90deg,#05060b 0%, rgba(5,6,11,0.6) 52%, rgba(5,6,11,0.08) 100%)" }} />

    <div className="relative z-10 flex flex-col gap-4 px-7 py-9 md:px-10 md:py-12">
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-favella-amber">
        Esperimento · il motore al limite
      </p>
      <h2 className="max-w-[640px] font-serif text-[clamp(28px,4vw,46px)] font-semibold leading-[1.05] text-favella-text-primary">
        Il Viaggiatore
      </h2>
      <p className="max-w-[540px] font-serif text-[16px] leading-[1.6] text-favella-text-secondary">
        Un sud svuotato dall'acqua che ha smesso di tornare. Sopravvivenza, baratto, fiducia, scelte che pesano
        e quattro finali — tutto scritto in italiano, tutto nel browser. Spingiamo FAVELLA dove di solito non va.
      </p>
      <div className="mt-1">
        <span className="inline-flex items-center gap-2.5 rounded-full bg-brand-gradient px-6 py-2.5 font-display text-[14px] font-bold text-favella-void shadow-glow-cyan transition-transform group-hover:scale-[1.03]">
          Prova l'esperimento
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </span>
      </div>
    </div>
  </a>
);

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
