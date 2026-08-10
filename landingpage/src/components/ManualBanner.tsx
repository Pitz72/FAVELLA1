// Banner premium «Il manuale è uscito» — l'edizione cartacea a colori su Amazon.
// Tutto vettoriale (SVG): sfondo di marca navy-teal con graffe in filigrana +
// il volume del manuale renderizzato in 3D con la copertina reale (logo
// libro-fiamma, wordmark, 1.0.0). Usato in Home, Notizie e Guida rapida.
import logo from "../assets/logo.png";
import { AMAZON_PAPERBACK_URL, MANUAL_PRICE } from "../constants";

// ── Il volume: copertina del manuale resa come libro 3D ──────────────
const BookCover = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 300 392"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="mb-cover" x1="0" y1="0" x2="0.25" y2="1">
        <stop offset="0%" stopColor="#0f2740" />
        <stop offset="48%" stopColor="#0a1a2c" />
        <stop offset="100%" stopColor="#05101c" />
      </linearGradient>
      <linearGradient id="mb-spine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#03080f" />
        <stop offset="100%" stopColor="#0a1c2e" />
      </linearGradient>
      <linearGradient id="mb-pages" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#dfe9f2" />
        <stop offset="14%" stopColor="#aab9c8" />
        <stop offset="28%" stopColor="#e8eef4" />
        <stop offset="42%" stopColor="#9fb0c0" />
        <stop offset="58%" stopColor="#e8eef4" />
        <stop offset="74%" stopColor="#a7b6c5" />
        <stop offset="100%" stopColor="#cfdae5" />
      </linearGradient>
      <linearGradient id="mb-num" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#5cf3ff" />
        <stop offset="55%" stopColor="#34d399" />
        <stop offset="120%" stopColor="#f59e0b" />
      </linearGradient>
      <linearGradient id="mb-rule" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#5cf3ff" stopOpacity="0" />
        <stop offset="50%" stopColor="#34d399" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="mb-gloss" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
        <stop offset="22%" stopColor="#ffffff" stopOpacity="0.04" />
        <stop offset="50%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      <radialGradient id="mb-drop" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#000000" stopOpacity="0.55" />
        <stop offset="70%" stopColor="#000000" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="mb-cover-glow" cx="50%" cy="22%" r="62%">
        <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.16" />
        <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* ombra a terra */}
    <ellipse cx="150" cy="376" rx="116" ry="15" fill="url(#mb-drop)" />

    <g transform="rotate(-3 150 196)">
      {/* spessore delle pagine, lato destro */}
      <path d="M232 44 L252 58 L252 350 L232 338 Z" fill="url(#mb-pages)" />
      {/* dorso, lato sinistro */}
      <path d="M68 40 L60 50 L60 344 L68 336 Z" fill="url(#mb-spine)" />

      {/* faccia della copertina */}
      <rect x="68" y="36" width="164" height="304" rx="7" fill="url(#mb-cover)" />
      <rect x="68" y="36" width="164" height="304" rx="7" fill="url(#mb-cover-glow)" />
      <rect
        x="68"
        y="36"
        width="164"
        height="304"
        rx="7"
        fill="none"
        stroke="#2dd4bf"
        strokeOpacity="0.22"
        strokeWidth="1"
      />
      {/* riflesso lucido */}
      <path d="M68 43 q0 -7 7 -7 H180 L96 200 H75 q-7 0 -7 -7 Z" fill="url(#mb-gloss)" />

      {/* logo libro-fiamma di marca */}
      <image href={logo} x="110" y="58" width="80" height="80" preserveAspectRatio="xMidYMid meet" />

      {/* occhiello */}
      <text
        x="150"
        y="166"
        textAnchor="middle"
        fontFamily="'Source Code Pro', monospace"
        fontSize="5.5"
        letterSpacing="1"
        fill="#7fe9d8"
        opacity="0.92"
      >
        MOTORE DI NARRATIVA INTERATTIVA
      </text>

      {/* wordmark */}
      <text
        x="150"
        y="206"
        textAnchor="middle"
        fontFamily="'Sora', sans-serif"
        fontSize="28"
        fontWeight="700"
        letterSpacing="0.8"
        fill="#eef5fb"
      >
        FAVELLA 1
      </text>

      {/* versione */}
      <text
        x="150"
        y="240"
        textAnchor="middle"
        fontFamily="'Sora', sans-serif"
        fontSize="19"
        fontWeight="700"
        letterSpacing="2"
        fill="url(#mb-num)"
      >
        1.0.0
      </text>

      {/* filetto */}
      <rect x="104" y="256" width="92" height="2" rx="1" fill="url(#mb-rule)" />

      {/* titolo */}
      <text
        x="150"
        y="284"
        textAnchor="middle"
        fontFamily="'Sora', sans-serif"
        fontSize="10.5"
        fontWeight="600"
        fill="#dce7f1"
      >
        Manuale di Programmazione
      </text>

      {/* autore */}
      <text
        x="150"
        y="316"
        textAnchor="middle"
        fontFamily="'Lora', serif"
        fontSize="11"
        fontStyle="italic"
        fill="#9fb4c9"
      >
        Simone Pizzi
      </text>
    </g>
  </svg>
);

interface Props {
  /** margine esterno, per adattarsi ai diversi contesti (Home/Notizie/Guida). */
  className?: string;
}

const ManualBanner = ({ className = "" }: Props) => (
  <a
    href={AMAZON_PAPERBACK_URL}
    target="_blank"
    rel="noopener noreferrer"
    className={`group relative block overflow-hidden rounded-[22px] border border-favella-amber/25 bg-favella-void shadow-[0_40px_110px_-50px_rgba(0,0,0,0.9)] transition-all duration-300 hover:border-favella-amber/55 hover:shadow-[0_50px_120px_-46px_rgba(245,158,11,0.28)] ${className}`}
  >
    {/* ── sfondo di marca, vettoriale ── */}
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1200 440"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="mb-bg" cx="26%" cy="0%" r="120%">
          <stop offset="0%" stopColor="#0c2236" />
          <stop offset="46%" stopColor="#071425" />
          <stop offset="100%" stopColor="#04060d" />
        </radialGradient>
        <radialGradient id="mb-teal" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mb-amber" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1200" height="440" fill="url(#mb-bg)" />
      <circle cx="940" cy="70" r="320" fill="url(#mb-teal)" />
      <circle cx="120" cy="430" r="300" fill="url(#mb-amber)" />
      {/* graffe in filigrana — la cifra di marca */}
      <text
        x="600"
        y="430"
        textAnchor="middle"
        fontFamily="'Sora', sans-serif"
        fontSize="560"
        fontWeight="300"
        fill="#5cf3ff"
        opacity="0.04"
      >
        {"{ }"}
      </text>
      {/* righe sottili a sinistra, eco di un editor */}
      <g stroke="#2dd4bf" strokeOpacity="0.08" strokeWidth="1">
        <line x1="64" y1="120" x2="150" y2="120" />
        <line x1="64" y1="150" x2="124" y2="150" />
        <line x1="64" y1="320" x2="138" y2="320" />
      </g>
    </svg>
    {/* velo per leggibilità del testo a sinistra */}
    <div
      className="absolute inset-0"
      style={{ background: "linear-gradient(90deg,#04060d 0%, rgba(4,6,13,0.74) 40%, rgba(4,6,13,0.18) 72%, rgba(4,6,13,0.45) 100%)" }}
    />

    {/* ── contenuto ── */}
    <div className="relative z-10 flex flex-col items-center gap-9 px-8 py-10 md:flex-row md:items-center md:justify-between md:gap-6 md:px-12 md:py-12">
      {/* testo */}
      <div className="max-w-[560px] text-center md:text-left">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.3em] text-favella-amber">
          Novità · ora anche un libro vero
        </p>
        <h2 className="mb-4 font-serif text-[clamp(27px,3.6vw,42px)] font-semibold leading-[1.08] text-favella-text-primary">
          Il Manuale di FAVELLA 1,<br className="hidden sm:block" /> ora <span className="italic text-ink-accent">tra le mani</span>.
        </h2>
        <p className="mb-7 font-serif text-[15.5px] leading-[1.62] text-favella-text-secondary">
          L'edizione cartacea <strong className="font-semibold text-favella-text-primary">a colori</strong> — 84 pagine,
          copertina flessibile — per chi ama i bei manuali. L'ebook resta gratuito: il volume è un piccolo oggetto da
          collezione, e il suo prezzo aiuta a sostenere il progetto.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-4 md:justify-start">
          <span className="inline-flex items-center gap-2.5 rounded-full bg-brand-gradient px-7 py-3 font-display text-[14.5px] font-bold text-favella-void shadow-[0_16px_40px_-14px_rgba(245,158,11,0.55)] transition-transform group-hover:scale-[1.03]">
            Acquista su Amazon
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </span>
          <span className="flex items-baseline gap-1.5">
            <span className="font-serif text-[34px] font-semibold leading-none text-ink-accent">{MANUAL_PRICE}</span>
          </span>
        </div>

        <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-favella-text-muted">
          Copertina flessibile · a colori · su Amazon.it
        </p>
      </div>

      {/* il volume */}
      <div className="shrink-0">
        <BookCover className="h-[230px] w-auto drop-shadow-[0_24px_50px_rgba(0,0,0,0.55)] transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-[1deg] md:h-[300px]" />
      </div>
    </div>
  </a>
);

export default ManualBanner;
