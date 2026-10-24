import {
  VIAGGIATORE_DESKTOP_VERSION,
  VIAGGIATORE_PAGES_URL,
  VIAGGIATORE_RELEASE_URL,
  VIAGGIATORE_REPO_URL,
  VIAGGIATORE_WEB_VERSION,
} from "../constants";

// ====================================================================
//  Banner di «Il Viaggiatore» nella Galleria.
// --------------------------------------------------------------------
//  In testa la key art del gioco (1.35.0): il guado di Acquamorta al
//  tramonto, il sole dietro il campanile, i due fratelli di controluce sul
//  greto. Viene da grafica/branding/ del repository del gioco (CC BY-SA 4.0;
//  i marchi di Runtime Multimedia e di FAVELLA 1 restano dei titolari),
//  ridotta in webp in public/viaggiatore/: il 21:9 da md in su, il 16:9 sui
//  telefoni. Tipografia del gioco: Sora per il titolo spaziato, Lora per la
//  prosa, Source Code Pro per le etichette.
//
//  Sotto, le due versioni: la web (1.23.0, definitiva) si gioca su GitHub
//  Pages (pitz72.github.io/il-viaggiatore-favella), con un vero <a href> che
//  apre il gioco in una scheda nuova; la desktop (1.35.0, la più completa) si
//  scarica dalla sua release.
// ====================================================================

const FATTI = ["7 zone", "39 luoghi", "14 personaggi", "6 finali"];

// Ciò che ha in più la versione desktop (le note della release v1.35.0).
const PIU_DESKTOP = [
  "le opzioni a schede: volumi, accessibilità, finestra e qualità della grafica",
  "la pausa, i salvataggi con nome e quelli rapidi (F5 e F9)",
  "trenta trofei",
  "la musica di ogni zona, e la colonna sonora da scaricare",
  "la sequenza finale, con i titoli di coda e la loro canzone",
];

const KEYART = `${import.meta.env.BASE_URL}viaggiatore/il-viaggiatore`;

// La key art, anche per la notizia in evidenza. `sizes` è la larghezza a cui la
// si mostra (il riquadro che la contiene), per scegliere il file giusto.
export const ViaggiatoreKeyArt = ({ sizes, className = "" }: { sizes: string; className?: string }) => (
  <picture>
    <source
      media="(min-width: 768px)"
      type="image/webp"
      srcSet={`${KEYART}-21x9-1260.webp 1260w, ${KEYART}-21x9-2520.webp 2520w`}
      sizes={sizes}
      width={2520}
      height={1080}
    />
    <img
      src={`${KEYART}-16x9-960.webp`}
      srcSet={`${KEYART}-16x9-960.webp 960w, ${KEYART}-16x9-1920.webp 1920w`}
      sizes={sizes}
      width={1920}
      height={1080}
      loading="lazy"
      decoding="async"
      alt="Il Viaggiatore, un esperimento in FAVELLA 1, un gioco di Simone Pizzi: il guado di Acquamorta al tramonto, il sole dietro il campanile e i due fratelli di controluce sul greto, uno per parte. Scritto a mano: «Non è il caso di tornare.»"
      className={`block h-auto w-full ${className}`}
    />
  </picture>
);

const ViaggiatoreBanner = () => (
  <div className="relative mt-[44px] overflow-hidden rounded-[18px] border border-[#f3b37a]/20 bg-[#0c0706] shadow-[0_30px_80px_-30px_rgba(232,137,79,0.35)]">
    <ViaggiatoreKeyArt sizes="(min-width: 1288px) 1240px, calc(100vw - 48px)" />

    <div className="relative grid gap-9 border-t border-[#f3b37a]/15 bg-[linear-gradient(180deg,#140b0d_0%,#0c0706_100%)] px-6 pb-9 pt-8 md:px-12 md:pb-12 md:pt-10 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
      <div className="flex flex-col gap-4">
        <p className="m-0 font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#f0b27a]">
          Il gioco completo · scritto in FAVELLA 1 · doppiato per intero
        </p>
        <div>
          <h2 className="m-0 font-display text-[clamp(28px,3.6vw,40px)] font-semibold uppercase leading-none tracking-[0.14em] text-[#f7f1e7]">
            Il Viaggiatore
          </h2>
          <p className="mb-0 mt-3 font-serif text-[clamp(19px,2.2vw,22px)] italic text-[#f3c89a]">Si parte a piedi.</p>
        </div>
        <p className="m-0 max-w-[520px] font-serif text-[16px] leading-[1.65] text-[#d9cfc2]">
          Un sud rimasto senz'acqua e la strada per tornare a casa. La sete detta il passo, l'acqua è la
          moneta, e chi incontri ricorda come l'hai trattato.
        </p>
        <p className="m-0 max-w-[520px] font-serif text-[16px] leading-[1.65] text-[#f3c89a]">
          E si ascolta: il narratore, i quattordici personaggi e il trailer hanno la loro voce, circa
          un'ora di parlato.
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
        {/* La versione web: definitiva, su GitHub Pages. */}
        <div className="rounded-[14px] border border-[#f3b37a]/15 bg-[#0c0706]/70 p-5">
          <p className="m-0 font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#f0b27a]">
            Nel browser · {VIAGGIATORE_WEB_VERSION} · definitiva
          </p>
          <p className="mb-4 mt-2 font-serif text-[15.5px] leading-[1.6] text-[#d9cfc2]">
            La storia intera, doppiata, col suo trailer. Si gioca nel browser, senza installare
            nulla, su GitHub Pages: resta così com'è.
          </p>
          <a
            href={VIAGGIATORE_PAGES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2.5 rounded-full border border-[#f0b27a]/50 bg-[#0c0706]/60 px-5 py-2.5 font-display text-[14px] font-semibold text-[#f3c89a] transition-colors hover:border-[#f3c89a] hover:text-[#fff3e2]"
          >
            Gioca nel browser
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
          </a>
        </div>

        {/* La versione desktop: la più completa. */}
        <div className="rounded-[14px] border border-[#f3b37a]/40 bg-[linear-gradient(160deg,rgba(242,168,106,0.12),rgba(12,7,6,0.7)_60%)] p-5 shadow-[0_18px_50px_-24px_rgba(246,183,116,0.45)]">
          <p className="m-0 font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#fbe0b4]">
            Windows e Linux · {VIAGGIATORE_DESKTOP_VERSION} · la più completa
          </p>
          <p className="mb-2 mt-2 font-serif text-[15.5px] leading-[1.6] text-[#d9cfc2]">
            La stessa storia, con le stesse voci; e in più:
          </p>
          <ul className="m-0 mb-5 grid list-none gap-1.5 p-0 font-serif text-[15px] leading-[1.5] text-[#e9e2d6]">
            {PIU_DESKTOP.map((p) => (
              <li key={p} className="flex gap-2.5">
                <span aria-hidden="true" className="text-[#f0b27a]">·</span>
                {p}
              </li>
            ))}
          </ul>
          <a
            href={VIAGGIATORE_RELEASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2.5 rounded-full px-6 py-3 font-display text-[14px] font-bold text-[#1a0f0a] shadow-[0_10px_30px_-10px_rgba(246,183,116,0.7)] transition-transform hover:scale-[1.03]"
            style={{ background: "linear-gradient(135deg, #fbe0b4 0%, #f2a86a 55%, #e0804c 100%)" }}
          >
            Scarica la {VIAGGIATORE_DESKTOP_VERSION.replace(/\.0$/, "")} per Windows e Linux
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
          </a>
        </div>
      </div>

      <div className="grid gap-1.5 lg:col-span-2">
        <p className="m-0 font-mono text-[10.5px] tracking-[0.08em] text-[#d9cfc2]/55">
          Gratis e open source ·{" "}
          <a
            href={VIAGGIATORE_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#d9cfc2]/75 underline decoration-[#f0b27a]/40 underline-offset-4 transition-colors hover:text-[#f3c89a]"
          >
            il sorgente
          </a>
        </p>
        <p className="m-0 max-w-[820px] font-mono text-[10.5px] leading-[1.6] tracking-[0.04em] text-[#d9cfc2]/55">
          Codice MIT · storia, testi, musica dell'intro, grafica e voci Google Gemini CC BY-SA 4.0 · fuori dalla
          licenza libera: le voci ElevenLabs di Imma, Rosaria, Tore e Vito (elevenlabs.io), solo per uso non
          commerciale, e nella versione desktop le musiche di The Runtimers, generate con Lyria 3.5 di Google
        </p>
      </div>
    </div>
  </div>
);

export default ViaggiatoreBanner;
