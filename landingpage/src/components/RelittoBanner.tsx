import { RELITTO_DEMO_WINDOWS, RELITTO_DEMO_LINUX } from "../constants";

// ====================================================================
//  Banner di «Il Relitto Silente» nella Galleria (sotto Il Viaggiatore).
// --------------------------------------------------------------------
//  Il Relitto Silente è diventato un gioco a sé: un remake desktop (app
//  Tauri) con la storia scritta in FAVELLA 1. In testa la key art del
//  gioco, ridotta in webp in public/relitto/ (il 21:9 da md in su, il 16:9
//  sui telefoni), dalle copertine del repository del gioco.
//
//  Sotto, il download della DEMO dell'atto I: Windows e Linux, download
//  DIRETTI (il clic scarica il file), SENZA mostrare il link o il nome di
//  GitHub e senza link al repository (scelta di Simone, 26/11/2026). Il
//  gioco è in sviluppo (0.2.x → 1.0.0).
// ====================================================================

const FATTI = ["23 stanze", "93 oggetti", "6 finali", "fantascienza"];

// Che cosa c'è nella demo / nel gioco.
const NEL_GIOCO = [
  "l'atto I giocabile dall'inizio alla fine, a pulsanti o a comandi scritti",
  "l'interfaccia desktop: la lamina del testo, il ramo e il fiore delle azioni, il diario",
  "la musica e i suoni del mondo — le stanze, le macchine, il Sintonizzatore",
  "le voci, registrate o generate, e la cinematica d'apertura",
];

const KEYART = `${import.meta.env.BASE_URL}relitto/relitto`;

const RelittoKeyArt = ({ sizes, className = "" }: { sizes: string; className?: string }) => (
  <picture>
    <source
      media="(min-width: 768px)"
      type="image/webp"
      srcSet={`${KEYART}-21x9-1260.webp 1260w, ${KEYART}-21x9-2520.webp 2520w`}
      sizes={sizes}
      width={2520}
      height={1055}
    />
    <img
      src={`${KEYART}-16x9-960.webp`}
      srcSet={`${KEYART}-16x9-960.webp 960w, ${KEYART}-16x9-1920.webp 1920w`}
      sizes={sizes}
      width={1920}
      height={1072}
      loading="lazy"
      decoding="async"
      alt="Il Relitto Silente, un'avventura di fantascienza scritta in FAVELLA 1: la nave da carico Santa Maria nel vuoto e, davanti, il relitto alieno silenzioso."
      className={`block h-auto w-full ${className}`}
    />
  </picture>
);

const RelittoBanner = () => (
  <div className="relative mt-[44px] overflow-hidden rounded-[18px] border border-[#f3b37a]/20 bg-[#0c0706] shadow-[0_30px_80px_-30px_rgba(232,137,79,0.35)]">
    <RelittoKeyArt sizes="(min-width: 1288px) 1240px, calc(100vw - 48px)" />

    <div className="relative grid gap-9 border-t border-[#f3b37a]/15 bg-[linear-gradient(180deg,#140b0d_0%,#0c0706_100%)] px-6 pb-9 pt-8 md:px-12 md:pb-12 md:pt-10 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
      <div className="flex flex-col gap-4">
        <p className="m-0 font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#f0b27a]">
          Un gioco a sé · scritto in FAVELLA 1 · demo dell'atto I
        </p>
        <div>
          <h2 className="m-0 font-display text-[clamp(28px,3.6vw,40px)] font-semibold uppercase leading-none tracking-[0.14em] text-[#f7f1e7]">
            Il Relitto Silente
          </h2>
          <p className="mb-0 mt-3 font-serif text-[clamp(19px,2.2vw,22px)] italic text-[#f3c89a]">
            Qualcosa ti osserva, nel silenzio.
          </p>
        </div>
        <p className="m-0 max-w-[520px] font-serif text-[16px] leading-[1.65] text-[#d9cfc2]">
          A bordo della Santa Maria, una nave da carico, davanti a un relitto alieno che non dovrebbe
          essere lì. Ventitré stanze, una lingua da decifrare, e scelte che pesano fino a uno dei sei finali.
        </p>
        <p className="m-0 max-w-[520px] font-serif text-[16px] leading-[1.65] text-[#f3c89a]">
          È un'app desktop, con la sua interfaccia: si gioca col mouse, sui pulsanti, o scrivendo i
          comandi come nelle avventure testuali di una volta. Con la musica, i suoni e le voci.
        </p>
        <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 p-0 font-mono text-[11.5px] uppercase tracking-[0.14em] text-[#e9e2d6]/75">
          {FATTI.map((f, i) => (
            <li key={f} className="flex items-center gap-3">
              {i > 0 && <span aria-hidden="true" className="text-[#f0b27a]/60">·</span>}
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid content-start gap-4">
        {/* La demo dell'atto I si scarica: Windows e Linux, download diretti. */}
        <div className="rounded-[14px] border border-[#f3b37a]/40 bg-[linear-gradient(160deg,rgba(242,168,106,0.12),rgba(12,7,6,0.7)_60%)] p-5 shadow-[0_18px_50px_-24px_rgba(246,183,116,0.45)]">
          <p className="m-0 font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#fbe0b4]">
            Demo dell'atto I · Windows e Linux · gioco in sviluppo
          </p>
          <p className="mb-2 mt-2 font-serif text-[15.5px] leading-[1.6] text-[#d9cfc2]">
            Il primo rilascio intero sarà la 1.0.0; intanto l'atto I si scarica e si gioca già. Dentro:
          </p>
          <ul className="m-0 mb-5 grid list-none gap-1.5 p-0 font-serif text-[15px] leading-[1.5] text-[#e9e2d6]">
            {NEL_GIOCO.map((p) => (
              <li key={p} className="flex gap-2.5">
                <span aria-hidden="true" className="text-[#f0b27a]">·</span>
                {p}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <a
              href={RELITTO_DEMO_WINDOWS}
              className="group inline-flex items-center gap-2.5 rounded-full px-6 py-3 font-display text-[14px] font-bold text-[#1a0f0a] shadow-[0_10px_30px_-10px_rgba(246,183,116,0.7)] transition-transform hover:scale-[1.03]"
              style={{ background: "linear-gradient(135deg, #fbe0b4 0%, #f2a86a 55%, #e0804c 100%)" }}
            >
              Scarica la demo — Windows
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">↓</span>
            </a>
            <a
              href={RELITTO_DEMO_LINUX}
              className="group inline-flex items-center gap-2.5 rounded-full border border-[#f3b37a]/45 px-6 py-3 font-display text-[14px] font-semibold text-[#f7f1e7] transition-colors hover:border-[#f3b37a]/80 hover:text-[#fbe0b4]"
            >
              Linux (AppImage)
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">↓</span>
            </a>
          </div>
        </div>
      </div>

      <div className="grid gap-1.5 lg:col-span-2">
        <p className="m-0 font-mono text-[10.5px] tracking-[0.08em] text-[#d9cfc2]/55">
          Gratis · remake desktop (Tauri) · la storia è scritta in FAVELLA 1
        </p>
        <p className="m-0 max-w-[820px] font-mono text-[10.5px] leading-[1.6] tracking-[0.04em] text-[#d9cfc2]/55">
          Il suono del mondo è sintetizzato dal motore audio del gioco; la musica è generata, tranne il
          tema dell'intro; le voci sono registrate o generate. Windows e macOS non sono firmati: al
          primo avvio accetta l'avviso di SmartScreen / Gatekeeper (è atteso).
        </p>
      </div>
    </div>
  </div>
);

export default RelittoBanner;
