// Set di icone leggere (stroke = currentColor) usate nel sito.
import React from "react";

type P = React.SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  ...p,
});

export const GitHubIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.5v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.6.8.5 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5Z" />
  </svg>
);

export const ArrowRight = (p: P) => (
  <svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

export const Spark = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M12 2c.5 4.5 2.5 6.5 7 7-4.5.5-6.5 2.5-7 7-.5-4.5-2.5-6.5-7-7 4.5-.5 6.5-2.5 7-7Z" />
  </svg>
);

export const BookProse = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 6c-2-1.3-4.3-2-7-2v13c2.7 0 5 .7 7 2 2-1.3 4.3-2 7-2V4c-2.7 0-5 .7-7 2Z" />
    <path d="M12 6v13" />
  </svg>
);

export const LogicIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="12" r="2.5" />
    <path d="M8.4 7.2 15.6 11M8.4 16.8 15.6 13" />
  </svg>
);

export const DialogIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 5h11a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H9l-4 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
    <path d="M20 9v7a1 1 0 0 1-1 1h-1" />
  </svg>
);

export const ParserIcon = (p: P) => (
  <svg {...base(p)}><path d="M8 6 3 12l5 6M16 6l5 6-5 6M13 4l-2 16" /></svg>
);

export const OpenIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3a9 9 0 1 0 9 9" /><path d="M21 3 12 12M21 8V3h-5" />
  </svg>
);

export const PlayIcon = (p: P) => (
  <svg {...base(p)}><path d="M6 4.5 19 12 6 19.5v-15Z" /></svg>
);

export const MailIcon = (p: P) => (
  <svg {...base(p)}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>
);

export const TelegramIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M21.94 4.6 18.9 19c-.23 1.02-.84 1.27-1.7.79l-4.7-3.47-2.27 2.18c-.25.25-.46.46-.94.46l.33-4.78 8.7-7.86c.38-.34-.08-.53-.59-.19L7.28 13.1l-4.64-1.45c-1-.32-1.02-1.01.21-1.5l18.15-7c.84-.31 1.57.2 1.3 1.45Z" />
  </svg>
);

export const FacebookIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
  </svg>
);

export const ChatIcon = DialogIcon;

// Il «logo di versione» del sito: un badge SVG autoconclusivo (targhetta con
// la tacca di marca e il numero), usato nel footer. Si aggiorna passando la
// versione: il numero arriva da SITE_VERSION in constants.tsx.
export const SiteVersionBadge = ({ version, className = "" }: { version: string; className?: string }) => (
  <svg
    viewBox="0 0 150 30"
    role="img"
    aria-label={`Sito versione ${version}`}
    className={`inline-block h-[22px] w-auto ${className}`}
  >
    <defs>
      <linearGradient id="svb-grad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#22d3ee" />
        <stop offset="100%" stopColor="#34d399" />
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="148" height="28" rx="14" fill="#0b0b10" stroke="#22d3ee" strokeOpacity="0.35" />
    <rect x="1" y="1" width="56" height="28" rx="14" fill="url(#svb-grad)" fillOpacity="0.14" />
    <text x="29" y="20" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="11" letterSpacing="1.5" fill="#22d3ee">
      SITO
    </text>
    <circle cx="62" cy="15" r="2" fill="#34d399" />
    <text x="73" y="20" fontFamily="ui-monospace, monospace" fontSize="12.5" fill="#e7e7ef">
      v{version}
    </text>
  </svg>
);

// Il grande punto interrogativo del teaser «Prossimamente»: un'illustrazione
// responsive (riempie la larghezza del contenitore, viewBox fisso) nei colori
// di marca, con anelli concentrici e bagliore. Quando il progetto misterioso
// verrà annunciato, questa lascerà il posto alla sua immagine vera.
export const QuestionMarkArt = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 240 240"
    role="img"
    aria-label="Punto interrogativo: annuncio in arrivo"
    className={`block h-auto w-full ${className}`}
  >
    <defs>
      <linearGradient id="qm-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#22d3ee" />
        <stop offset="55%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#fbbf24" />
      </linearGradient>
      <radialGradient id="qm-halo" cx="0.5" cy="0.45" r="0.55">
        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* alone + anelli concentrici */}
    <circle cx="120" cy="120" r="118" fill="url(#qm-halo)" />
    <circle cx="120" cy="120" r="96" fill="none" stroke="#22d3ee" strokeOpacity="0.18" strokeWidth="1.5" />
    <circle cx="120" cy="120" r="74" fill="none" stroke="#22d3ee" strokeOpacity="0.10" strokeWidth="1.5" strokeDasharray="3 7" />

    {/* il «?»: gancio + punto, tracciato a mano nei pesi del marchio */}
    <path
      d="M84 86c2-26 20-40 38-40s36 13 36 36c0 17-9 25-20 33-9 7-14 12-14 26"
      fill="none"
      stroke="url(#qm-grad)"
      strokeWidth="17"
      strokeLinecap="round"
    />
    <circle cx="124" cy="180" r="11" fill="url(#qm-grad)" />
  </svg>
);

export const iconByName: Record<string, (p: P) => React.JSX.Element> = {
  prose: BookProse,
  logic: LogicIcon,
  dialog: DialogIcon,
  parser: ParserIcon,
  open: OpenIcon,
  play: PlayIcon,
};
