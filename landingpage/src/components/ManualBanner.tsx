// «Il manuale è un libro vero» — l'edizione cartacea a colori su Amazon.it.
// Design 2026: un volume in 3D che segue il puntatore, su un palcoscenico di luce
// ambra e ciano. Usato in Home, Novità e Guida rapida (variante compatta).
import { AMAZON_PAPERBACK_URL, MANUAL_PDF_URL, MANUAL_PRICE, MANUAL_PDF_PAGES, PAPERBACK } from "../constants";
import Libro3D from "../ui/Libro3D";
import { Btn, Eyebrow, GlyphField, Ink, Reveal } from "../ui/primitives";

interface Props {
  /** margine esterno, per adattarsi ai diversi contesti (Home/Notizie/Guida). */
  className?: string;
  variant?: "stage" | "compact";
}

const Nota = () =>
  PAPERBACK.next ? (
    <p className="mt-6 max-w-[520px] border-l-2 border-favella-amber/50 pl-4 font-serif text-[14.5px] leading-[1.6] text-favella-text-secondary">
      In vendita c'è la <strong className="font-semibold text-favella-text-primary">{PAPERBACK.edition.toLowerCase()}</strong> (FAVELLA{" "}
      {PAPERBACK.version}). La {PAPERBACK.next.edition.toLowerCase()}, aggiornata alla {PAPERBACK.next.version}, è in preparazione: il PDF
      gratuito è già quello nuovo.
    </p>
  ) : null;

const ManualBanner = ({ className = "", variant = "stage" }: Props) => {
  if (variant === "compact") {
    return (
      <div
        className={`relative overflow-hidden rounded-[28px] border border-favella-amber/25 bg-[linear-gradient(120deg,rgba(245,158,11,0.10),rgba(8,17,29,0.9)_46%,rgba(34,211,238,0.08))] ${className}`}
      >
        <div className="grid items-center gap-6 px-7 py-6 md:grid-cols-[auto_1fr_auto] md:gap-9 md:px-10">
          <div className="mx-auto flex h-[230px] w-[190px] shrink-0 items-center justify-center md:mx-0">
            <Libro3D etichette={false} scala={0.52} className="!py-0" />
          </div>
          <div className="text-center md:text-left">
            <Eyebrow tone="amber" className="mb-3 justify-center md:justify-start">
              Edizione cartacea · Amazon.it
            </Eyebrow>
            <h3 className="font-display text-[clamp(22px,2.6vw,30px)] font-bold leading-[1.1] tracking-[-0.03em] text-favella-text-primary">
              Il manuale, <Ink>in un libro vero</Ink>
            </h3>
            <p className="mt-2 font-serif text-[15px] leading-[1.6] text-favella-text-secondary">
              {PAPERBACK.pages} pagine a colori, copertina flessibile. L'ebook PDF ({MANUAL_PDF_PAGES} pagine) resta gratuito.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 md:items-end">
            <span className="font-display text-[34px] font-bold leading-none tracking-[-0.03em] text-favella-text-primary">{MANUAL_PRICE}</span>
            <Btn href={AMAZON_PAPERBACK_URL} variant="amber">
              Acquista su Amazon →
            </Btn>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section
      className={`relative overflow-hidden rounded-[36px] border border-favella-amber/20 bg-[radial-gradient(90%_120%_at_85%_30%,rgba(34,211,238,0.14),transparent_60%),radial-gradient(70%_90%_at_8%_100%,rgba(245,158,11,0.16),transparent_62%),linear-gradient(180deg,#09131f,#050a14)] shadow-[0_60px_140px_-60px_rgba(245,158,11,0.35)] ${className}`}
    >
      <div aria-hidden="true" className="grid-lines absolute inset-0 opacity-70" />
      <GlyphField />
      <div className="relative grid items-center gap-6 px-7 py-12 md:px-14 md:py-16 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="text-center lg:text-left">
          <Reveal>
            <Eyebrow tone="amber" className="mb-6 justify-center lg:justify-start">
              Ora anche su carta
            </Eyebrow>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="font-display text-[clamp(38px,5.6vw,76px)] font-bold leading-[0.98] tracking-[-0.045em] text-favella-text-primary">
              Il manuale,<br />
              <Ink>tra le mani.</Ink>
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-7 max-w-[540px] font-serif text-[clamp(17px,1.6vw,19.5px)] leading-[1.65] text-favella-text-secondary lg:mx-0">
              Il <strong className="font-semibold text-favella-text-primary">Manuale di Programmazione</strong> di FAVELLA 1 in edizione
              cartacea a colori: {PAPERBACK.pages} pagine, copertina flessibile, stampato quando lo ordini. Un bell'oggetto da tenere sullo
              scaffale e un modo per sostenere il progetto. L'ebook resta gratuito, per sempre.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-5 lg:justify-start">
              <span className="font-display text-[clamp(44px,5vw,64px)] font-bold leading-none tracking-[-0.04em] text-ink-accent">{MANUAL_PRICE}</span>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Btn href={AMAZON_PAPERBACK_URL} variant="amber" size="lg">
                  Acquista su Amazon →
                </Btn>
                <Btn href={MANUAL_PDF_URL} variant="ghost" size="lg">
                  PDF gratuito
                </Btn>
              </div>
            </div>
            <div className="mx-auto lg:mx-0 lg:max-w-[540px]">
              <Nota />
            </div>
          </Reveal>
        </div>
        <Reveal delay={120}>
          <Libro3D className="min-h-[470px]" />
        </Reveal>
      </div>
    </section>
  );
};

export default ManualBanner;
