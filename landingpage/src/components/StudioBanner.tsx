import { Link } from "../router";
import { STUDIO_VERSION } from "../constants";

// Il banner di Favella Studio, per la home: il marchio, due righe, il bottone.
const StudioBanner = ({ className = "" }: { className?: string }) => (
  <div
    className={
      "overflow-hidden rounded-[20px] border border-favella-cyan/20 bg-gradient-to-br from-favella-surface/70 via-favella-panel/60 to-favella-void/60 " +
      className
    }
  >
    <div className="grid items-center gap-8 p-7 md:grid-cols-[1.1fr_1fr] md:p-9">
      <div>
        <div className="mb-4 flex items-center gap-4">
          <img src="/studio/favella-studio-logo-256.png" alt="" width={64} height={64} className="rounded-2xl" />
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-favella-emerald">Nuovo · versione {STUDIO_VERSION}</span>
        </div>
        <h2 className="mb-3 font-serif text-[clamp(26px,3.2vw,36px)] font-medium leading-[1.12] text-favella-text-primary">
          Favella <span className="italic text-ink-accent">Studio</span>: scrivi senza perderti.
        </h2>
        <p className="mb-6 text-[15px] leading-[1.7] text-favella-text-secondary">
          Il testo, le stanze, i personaggi, le regole e la prova della tua avventura, in un'app sola. Per Windows e Linux; per
          Mac, un comando e te la costruisci da te.
        </p>
        <Link
          to="/studio"
          className="inline-flex rounded-lg bg-favella-cyan px-5 py-2.5 font-display text-[14.5px] font-semibold text-favella-dark transition-colors hover:bg-favella-cyan-bright"
        >
          Scopri Favella Studio
        </Link>
      </div>
      <img
        src="/studio/mappa.webp"
        alt="La mappa delle stanze in Favella Studio"
        width={1600}
        height={1000}
        loading="lazy"
        className="hidden rounded-xl border border-favella-cyan/15 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] md:block"
      />
    </div>
  </div>
);

export default StudioBanner;
