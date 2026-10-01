import { useState } from "react";
import { NEWS, UPDATE_LOGS, RELEASES_URL, VERSION } from "../constants";
import type { NewsItem } from "../constants";
import ManualBanner from "../components/ManualBanner";
import { Link } from "../router";
import { Btn, Ink, PageHero, Reveal, SectionHead, Spot } from "../ui/primitives";

// Colore del «pill» del tag.
const tagStyle = (tag: string): string => {
  const t = tag.toLowerCase();
  if (["nuovo", "disponibile", "galleria"].includes(t)) return "text-favella-emerald border-favella-emerald/40 bg-favella-emerald/8";
  if (["strumenti", "prossimamente", "traguardo", "studio"].includes(t)) return "text-favella-amber border-favella-amber/40 bg-favella-amber/8";
  return "text-favella-cyan border-favella-cyan/40 bg-favella-cyan/8"; // Linguaggio, Da provare, …
};

const CtaLink = ({ label, href }: { label: string; href: string }) => {
  const cls =
    "inline-flex items-center gap-1.5 font-display text-[14px] font-semibold text-favella-cyan transition-all hover:gap-2.5 hover:text-favella-cyan-bright";
  return href.startsWith("/") ? (
    <Link to={href} className={cls}>
      {label} →
    </Link>
  ) : (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {label} →
    </a>
  );
};

const NewsCard = ({ item }: { item: NewsItem }) => (
  <Spot className="flex h-full flex-col p-7">
    <div className="mb-4 flex items-center gap-3">
      <span className={`rounded-full border px-2.5 py-[3px] font-mono text-[10px] uppercase tracking-[0.14em] ${tagStyle(item.tag)}`}>{item.tag}</span>
      <span className="font-mono text-[11px] text-favella-text-muted">{item.date}</span>
    </div>
    <h3 className="mb-3 font-display text-[21px] font-bold leading-[1.2] tracking-[-0.025em] text-favella-text-primary">{item.title}</h3>
    <p className="m-0 flex-1 text-[14.5px] leading-[1.7] text-favella-text-secondary">{item.body}</p>
    {item.cta && (
      <div className="mt-5">
        <CtaLink label={item.cta.label} href={item.cta.href} />
      </div>
    )}
  </Spot>
);

const UpdatesPage = () => {
  const [tutti, setTutti] = useState(false);
  const featured = NEWS.find((n) => n.emphasis === "primary");
  const rest = NEWS.filter((n) => n !== featured);
  const visibili = tutti ? UPDATE_LOGS : UPDATE_LOGS.slice(0, 8);

  return (
    <>
      <PageHero
        eyebrow="Novità e roadmap"
        title={
          <>
            Quello che è stato, e come <Ink>finisce.</Ink>
          </>
        }
        lead={`Il diario del progetto: come FAVELLA è arrivata alla 1.0, che cosa è venuto dopo, e perché adesso, con la ${VERSION}, è finita.`}
      />

      {/* ═════════ IN EVIDENZA ═════════ */}
      {featured && (
        <section className="px-6 pb-8">
          <div className="mx-auto max-w-[1180px]">
            <Reveal>
              <div className="relative overflow-hidden rounded-[32px] border border-favella-cyan/25 bg-[radial-gradient(70%_120%_at_100%_0%,rgba(34,211,238,0.16),transparent_60%),radial-gradient(60%_90%_at_0%_100%,rgba(245,158,11,0.10),transparent_60%),linear-gradient(180deg,#0b1a28,#060d17)] px-8 py-11 md:px-14 md:py-14">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-brand-gradient px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-favella-void">
                    {featured.tag}
                  </span>
                  <span className="font-mono text-[12px] text-favella-text-muted">{featured.date}</span>
                </div>
                <h2 className="mb-5 max-w-[860px] font-display text-[clamp(30px,4.4vw,54px)] font-bold leading-[1.04] tracking-[-0.04em] text-favella-text-primary">
                  {featured.title}
                </h2>
                <p className="mb-7 max-w-[820px] font-serif text-[17.5px] leading-[1.75] text-[#c4d3e2]">{featured.body}</p>
                {featured.cta && <CtaLink label={featured.cta.label} href={featured.cta.href} />}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ═════════ IL LIBRO ═════════ */}
      <section className="px-6 pb-8">
        <div className="mx-auto max-w-[1180px]">
          <ManualBanner variant="compact" />
        </div>
      </section>

      {/* ═════════ ALTRE NOTIZIE ═════════ */}
      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-[1180px] gap-5 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((item, i) => (
            <Reveal key={item.title} delay={(i % 3) * 80}>
              <NewsCard item={item} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═════════ CHANGELOG ═════════ */}
      <section className="px-6 pb-12">
        <div className="mx-auto max-w-[1180px]">
          <SectionHead eyebrow="Changelog" tone="emerald" title={<>La strada fino alla <Ink>{VERSION}.</Ink></>} />
          <div className="relative ml-2 border-l border-favella-cyan/20 pl-8 md:pl-12">
            {visibili.map((log, i) => (
              <Reveal key={log.version + log.title} className="relative pb-10">
                <span
                  className={`absolute -left-[41px] top-1.5 h-3 w-3 rounded-full border-2 md:-left-[57px] ${
                    i === 0 ? "border-favella-amber bg-favella-amber shadow-[0_0_16px_rgba(245,158,11,0.8)]" : "border-favella-cyan/60 bg-favella-void"
                  }`}
                />
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 font-mono text-[12.5px] ${
                      i === 0 ? "bg-brand-gradient font-semibold text-favella-void" : "border border-favella-cyan/30 text-favella-cyan"
                    }`}
                  >
                    {log.version}
                  </span>
                  <h3 className="font-display text-[19px] font-bold tracking-[-0.02em] text-favella-text-primary">{log.title}</h3>
                </div>
                <p className="m-0 max-w-[860px] text-[15px] leading-[1.7] text-favella-text-secondary">{log.content}</p>
              </Reveal>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            {!tutti && UPDATE_LOGS.length > 8 && (
              <Btn onClick={() => setTutti(true)} variant="ghost">
                Mostra le altre {UPDATE_LOGS.length - 8} versioni
              </Btn>
            )}
            <a
              href={RELEASES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display text-[14px] font-semibold text-favella-cyan transition-colors hover:text-favella-cyan-bright"
            >
              Tutte le release su GitHub →
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default UpdatesPage;
