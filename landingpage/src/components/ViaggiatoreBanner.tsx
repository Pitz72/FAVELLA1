import { VIAGGIATORE_RELEASE_URL, VIAGGIATORE_REPO_URL } from "../constants";

// ====================================================================
//  Banner di «Il Viaggiatore» nella Galleria.
// --------------------------------------------------------------------
//  La scena è quella dell'icona e del trailer del gioco: cielo al tramonto dal
//  viola alla brace, il sole pallido che tocca l'orizzonte, il viandante col
//  cappello a tesa larga, lo zaino e la tanica, la terra secca spaccata, i pali
//  della corrente senza più corrente. Tipografia del gioco: Sora per il titolo
//  spaziato, Lora per la prosa, Source Code Pro per le etichette.
//
//  Tutta la card porta all'esperimento (link «steso» con ::after sul pulsante
//  principale); il download e il sorgente stanno sopra con z-index proprio,
//  così non ci sono <a> annidati. /esperimento/ è un'app separata: serve un
//  vero <a href> con ricarica completa, non il router della SPA.
// ====================================================================

const FATTI = ["7 zone", "39 luoghi", "13 personaggi", "6 finali"];

// Il viandante, piedi a y=0, alto circa 150 unità. Stesse forme dell'icona.
const Viandante = () => (
  <g fill="#0b0706">
    <ellipse cx="0" cy="-139" rx="27" ry="5" />
    <path d="M-12 -139 Q-12 -152 0 -152 Q12 -152 12 -139 Z" />
    <circle cx="0" cy="-126" r="11" />
    <rect x="-4" y="-117" width="8" height="7" />
    {/* zaino */}
    <rect x="6" y="-111" width="22" height="48" rx="11" />
    {/* cappotto */}
    <path d="M-13 -112 Q-19 -84 -21 -50 L17 -50 Q17 -84 12 -112 Z" />
    {/* braccio e tanica */}
    <path d="M-10 -106 L-22 -70" stroke="#0b0706" strokeWidth="7" strokeLinecap="round" />
    <rect x="-34" y="-72" width="19" height="27" rx="2.5" />
    <rect x="-30" y="-78" width="9" height="7" rx="1.5" fill="none" stroke="#0b0706" strokeWidth="2.5" />
    {/* gambe in cammino */}
    <path d="M-8 -52 L-21 -4" stroke="#0b0706" strokeWidth="10" strokeLinecap="round" />
    <path d="M7 -52 L17 -4" stroke="#0b0706" strokeWidth="10" strokeLinecap="round" />
    <ellipse cx="-24" cy="-2.5" rx="9" ry="3.6" />
    <ellipse cx="21" cy="-2.5" rx="9" ry="3.6" />
  </g>
);

// Un palo della corrente: x alla base, altezza, spessore.
const palo = (x: number, h: number, s: number) => (
  <g key={x} fill="#150c10">
    <rect x={x - s / 2} y={300 - h} width={s} height={h} />
    <rect x={x - h * 0.16} y={300 - h + h * 0.1} width={h * 0.32} height={Math.max(1.5, s * 0.6)} />
  </g>
);
// Da destra verso il sole: i più lontani si stagliano sul disco.
const PALI: [number, number, number][] = [[1152, 190, 7], [1012, 118, 5], [940, 78, 3.6], [902, 52, 2.6], [880, 35, 1.8]];

const Scena = () => (
  // Sui telefoni la scena sta in alto, larga quanto serve e centrata sul
  // viandante (x=840 su 1200, il 70%); da md in su riempie tutta la card.
  <svg className="absolute left-1/2 top-0 h-[330px] -translate-x-[70%] md:inset-0 md:h-full md:w-full md:translate-x-0"
    style={{ aspectRatio: "1200 / 440" }} viewBox="0 0 1200 440"
    preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="vb-cielo" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#131229" />
        <stop offset="0.42" stopColor="#2a1a3b" />
        <stop offset="0.68" stopColor="#5f2e3f" />
        <stop offset="0.86" stopColor="#a8523e" />
        <stop offset="1" stopColor="#e89a5c" />
      </linearGradient>
      <radialGradient id="vb-sole" cx="0.5" cy="0.62" r="0.62">
        <stop offset="0" stopColor="#fff6e4" />
        <stop offset="0.55" stopColor="#fbe0b4" />
        <stop offset="1" stopColor="#f2bd85" />
      </radialGradient>
      <radialGradient id="vb-alone" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#f6b774" stopOpacity="0.55" />
        <stop offset="0.45" stopColor="#d9784a" stopOpacity="0.2" />
        <stop offset="1" stopColor="#d9784a" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="vb-suolo" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2b1a14" />
        <stop offset="1" stopColor="#0c0706" />
      </linearGradient>
      <linearGradient id="vb-ombra" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#050303" stopOpacity="0" />
        <stop offset="1" stopColor="#050303" stopOpacity="0.75" />
      </linearGradient>
      <clipPath id="vb-sopra"><rect width="1200" height="300" /></clipPath>
      <filter id="vb-grana" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
    </defs>

    {/* cielo, alone, sole che tocca l'orizzonte */}
    <rect width="1200" height="300" fill="url(#vb-cielo)" />
    <circle className="vb-alone" cx="840" cy="300" r="420" fill="url(#vb-alone)" />
    <circle cx="840" cy="300" r="148" fill="url(#vb-sole)" clipPath="url(#vb-sopra)" />

    {/* colline lontane, appena più scure del cielo */}
    <path d="M0 300 L0 284 Q90 272 180 282 T380 278 T560 286 L620 300 Z" fill="#3b1d2c" opacity="0.85" />
    <path d="M1010 300 Q1080 280 1140 286 T1200 282 L1200 300 Z" fill="#3b1d2c" opacity="0.85" />

    {/* terra secca, con le crepe che fuggono verso i piedi del viandante */}
    <rect y="300" width="1200" height="140" fill="url(#vb-suolo)" />
    <g stroke="#6a3a26" strokeWidth="1.6" fill="none" opacity="0.55" strokeLinecap="round">
      <path d="M810 304 L735 364 L640 440" />
      <path d="M735 364 L600 386" />
      <path d="M866 304 L930 360 L1030 440" />
      <path d="M930 360 L1070 378" />
      <path d="M700 392 L560 420" opacity="0.6" />
      <path d="M980 400 L1120 430" opacity="0.6" />
    </g>
    <path d="M812 300 L700 336 L664 330 Z" fill="url(#vb-ombra)" />
    <line x1="0" y1="300" x2="1200" y2="300" stroke="#f3b37a" strokeWidth="1.4" opacity="0.8" />

    {/* pali della corrente che si perdono verso l'orizzonte, col filo che cede */}
    {PALI.map(([x, h, s]) => palo(x, h, s))}
    <g stroke="#150c10" fill="none" strokeWidth="1.1" opacity="0.75">
      <path d="M1150 129 Q1080 178 1012 194" />
      <path d="M1012 194 Q972 224 940 230" />
      <path d="M940 230 Q918 248 902 253" />
      <path d="M902 253 Q888 264 880 268" />
    </g>

    {/* il viandante, sul disco del sole */}
    <g transform="translate(838 300)">
      <g className="vb-passo"><Viandante /></g>
    </g>

    {/* polvere sospesa nella luce */}
    <g fill="#fbe0b4">
      {[[700, 250, 1.3], [760, 212, 1], [905, 236, 1.4], [980, 190, 0.9], [640, 205, 0.8], [1040, 258, 1.1]].map(([x, y, r], i) => (
        <circle key={i} className="vb-polvere" style={{ animationDelay: `${i * -2.3}s` }} cx={x} cy={y} r={r} opacity="0.6" />
      ))}
    </g>

    {/* grana di pellicola */}
    <rect width="1200" height="440" filter="url(#vb-grana)" opacity="0.07" style={{ mixBlendMode: "overlay" }} />
  </svg>
);

const ViaggiatoreBanner = () => (
  <div className="group relative mt-[44px] overflow-hidden rounded-[18px] border border-[#f3b37a]/20 bg-[#0c0706] shadow-[0_30px_80px_-30px_rgba(232,137,79,0.35)] transition-colors hover:border-[#f3b37a]/45">
    <Scena />
    {/* velo per la leggibilità: da sinistra su schermi larghi, dal basso sui telefoni */}
    <div className="absolute inset-0 hidden md:block" style={{ background: "linear-gradient(90deg, rgba(10,7,14,0.94) 0%, rgba(10,7,14,0.78) 34%, rgba(10,7,14,0.25) 58%, rgba(10,7,14,0) 72%)" }} />
    <div className="absolute inset-0 md:hidden" style={{ background: "linear-gradient(180deg, rgba(10,7,14,0) 0px, rgba(10,7,14,0) 230px, rgba(10,7,14,0.9) 320px, #0a070e 340px)" }} />

    <div className="relative z-10 flex flex-col justify-end gap-4 px-6 pb-8 pt-[290px] md:min-h-[440px] md:justify-center md:px-12 md:py-12">
      <p className="m-0 font-mono text-[10.5px] uppercase tracking-[0.3em] text-[#f0b27a]">
        Il gioco completo · scritto in FAVELLA 1
      </p>
      <div>
        <h2 className="m-0 font-display text-[clamp(32px,5vw,56px)] font-semibold uppercase leading-none tracking-[0.14em] text-[#f7f1e7]">
          Il Viaggiatore
        </h2>
        <p className="mb-0 mt-3 font-serif text-[clamp(19px,2.2vw,24px)] italic text-[#f3c89a]">Si parte a piedi.</p>
      </div>
      <p className="m-0 max-w-[500px] font-serif text-[16px] leading-[1.65] text-[#d9cfc2]">
        Un sud rimasto senz'acqua e la strada per tornare a casa. La sete detta il passo, l'acqua è la
        moneta, e chi incontri ricorda come l'hai trattato.
      </p>
      <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 p-0 font-mono text-[11.5px] uppercase tracking-[0.14em] text-[#e9e2d6]/75">
        {FATTI.map((f, i) => (
          <li key={f} className="flex items-center gap-3">
            {i > 0 && <span aria-hidden="true" className="text-[#f0b27a]/60">·</span>}
            {f}
          </li>
        ))}
      </ul>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <a
          href="/esperimento/"
          className="inline-flex items-center gap-2.5 rounded-full px-6 py-3 font-display text-[14px] font-bold text-[#1a0f0a] shadow-[0_10px_30px_-10px_rgba(246,183,116,0.7)] transition-transform after:absolute after:inset-0 after:content-[''] group-hover:scale-[1.03]"
          style={{ background: "linear-gradient(135deg, #fbe0b4 0%, #f2a86a 55%, #e0804c 100%)" }}
        >
          Gioca nel browser
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
        </a>
        <a
          href={VIAGGIATORE_RELEASE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-20 inline-flex items-center rounded-full border border-[#f0b27a]/50 bg-[#0c0706]/60 px-5 py-3 font-display text-[14px] font-semibold text-[#f3c89a] backdrop-blur-sm transition-colors hover:border-[#f3c89a] hover:text-[#fff3e2]"
        >
          Scarica per Windows e Linux
        </a>
        <a
          href={VIAGGIATORE_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-20 px-1 font-mono text-[12px] text-[#d9cfc2]/75 underline decoration-[#f0b27a]/40 underline-offset-4 transition-colors hover:text-[#f3c89a]"
        >
          il sorgente
        </a>
      </div>
      <p className="m-0 font-mono text-[10.5px] tracking-[0.08em] text-[#d9cfc2]/55">
        Gratis e open source · trailer e colonna sonora originali · salvataggi
      </p>
    </div>
  </div>
);

export default ViaggiatoreBanner;
