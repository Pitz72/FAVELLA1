import { NEWS, UPDATE_LOGS, RELEASES_URL } from "../constants";
import type { NewsItem } from "../constants";
import ManualBanner from "../components/ManualBanner";
import { navigate } from "../router";

const goHash = (href: string) => {
  navigate(href);
};

// Colore del «pill» del tag, sulla falsariga del redesign.
const tagStyle = (tag: string): string => {
  const t = tag.toLowerCase();
  if (["nuovo", "disponibile"].includes(t)) return "text-favella-emerald border-favella-emerald/40";
  if (["strumenti", "prossimamente", "traguardo"].includes(t)) return "text-favella-amber border-favella-amber/40";
  return "text-favella-cyan border-favella-cyan/40"; // Linguaggio, Da provare, …
};

const CtaLink = ({ label, href }: { label: string; href: string }) => {
  const internal = href.startsWith("/");
  const cls = "inline-flex items-center gap-1.5 font-display text-[13.5px] font-semibold text-favella-cyan transition-colors hover:text-favella-cyan-bright";
  return internal ? (
    <a href={href} onClick={(e) => { e.preventDefault(); goHash(href); }} className={`cursor-pointer ${cls}`}>
      {label} →
    </a>
  ) : (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {label} →
    </a>
  );
};

const NewsCard = ({ item }: { item: NewsItem }) => {
  const question = item.art === "question";
  return (
    <div
      className={`flex flex-col rounded-[18px] p-7 ${
        question
          ? "border border-dashed border-favella-amber/35 bg-gradient-to-b from-[rgba(40,30,12,0.4)] to-[rgba(20,15,8,0.25)]"
          : "border border-favella-cyan/12 bg-gradient-to-b from-favella-surface/50 to-favella-panel/30"
      }`}
    >
      <div className="mb-3.5 flex items-center gap-2.5">
        <span className={`rounded-full border px-2.5 py-[3px] font-mono text-[10px] uppercase tracking-[0.12em] ${tagStyle(item.tag)}`}>
          {item.tag}
        </span>
        <span className="font-mono text-[11px] text-favella-text-muted">{item.date}</span>
      </div>
      {question && <div className="mb-2.5 font-serif text-[48px] italic leading-none text-favella-amber/50">?</div>}
      <h3 className="mb-3 font-serif text-[21px] font-semibold leading-[1.25] text-favella-text-primary">{item.title}</h3>
      <p className="m-0 text-[14.5px] leading-[1.65] text-favella-text-secondary">{item.body}</p>
      {item.cta && (
        <div className="mt-4">
          <CtaLink label={item.cta.label} href={item.cta.href} />
        </div>
      )}
    </div>
  );
};

const UpdatesPage = () => {
  const featured = NEWS.find((n) => n.emphasis === "primary");
  const rest = NEWS.filter((n) => n.emphasis !== "primary");

  return (
    <section className="px-6 pb-28 pt-[74px]">
      <div className="mx-auto max-w-[1080px]">
        {/* Header */}
        <div className="max-w-[760px]">
          <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.26em] text-favella-cyan">Novità &amp; Roadmap</p>
          <h1 className="mb-[22px] font-serif text-[clamp(36px,5.4vw,62px)] font-medium leading-[1.08] tracking-[-0.02em] text-favella-text-primary">
            Cosa è successo,<br />e cosa <span className="italic text-ink-accent">viene</span>.
          </h1>
          <p className="font-serif text-[20px] leading-[1.6] text-favella-text-secondary">
            Il diario del progetto: il traguardo della 1.0.0, l'ecosistema che gli è cresciuto intorno, e la rotta
            oltre la chiusura del linguaggio.
          </p>
        </div>

        {/* Featured */}
        {featured && (
          <div className="relative mt-14 overflow-hidden rounded-[22px] border border-favella-cyan/20 bg-gradient-to-br from-favella-surface/70 to-favella-panel/50 px-10 py-11">
            <div className="pointer-events-none absolute -right-16 -top-24 h-[360px] w-[360px] rounded-full bg-favella-cyan/10 blur-[110px]" />
            <div className="relative mb-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-brand-gradient px-3 py-[5px] font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-favella-void">
                {featured.tag}
              </span>
              <span className="font-mono text-[12px] text-favella-text-muted">{featured.date}</span>
            </div>
            <h2 className="relative mb-4 font-serif text-[clamp(26px,3.6vw,40px)] font-semibold leading-[1.15] text-favella-text-primary">
              {featured.title}
            </h2>
            <p className="relative mb-6 max-w-[760px] font-serif text-[17px] leading-[1.7] text-[#c4d3e2]">{featured.body}</p>
            {featured.cta && (
              <div className="relative">
                <CtaLink label={featured.cta.label} href={featured.cta.href} />
              </div>
            )}
          </div>
        )}

        {/* Banner: il manuale cartaceo è uscito */}
        <ManualBanner className="mt-6" />

        {/* News grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((item) => (
            <NewsCard key={item.title} item={item} />
          ))}
        </div>

        {/* Changelog */}
        <div className="mt-24">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.24em] text-favella-emerald">Changelog</p>
          <h2 className="mb-10 font-serif text-[clamp(26px,3.6vw,38px)] font-medium text-favella-text-primary">
            La strada fino alla 1.0.0
          </h2>
          <div className="pl-2">
            {UPDATE_LOGS.map((log, i) => (
              <div
                key={log.version}
                className={`grid grid-cols-[110px_1fr] gap-6 border-t border-favella-cyan/14 py-[22px] md:grid-cols-[130px_1fr] ${
                  i === UPDATE_LOGS.length - 1 ? "border-b" : ""
                }`}
              >
                <div
                  className={`self-start justify-self-start rounded-[7px] px-2.5 py-1 font-mono text-[13px] ${
                    i === 0
                      ? "bg-brand-gradient font-semibold text-favella-void"
                      : "border border-favella-cyan/30 text-favella-cyan"
                  }`}
                >
                  {log.version}
                </div>
                <div>
                  <h3 className="mb-1.5 font-display text-[17px] font-semibold text-favella-text-primary">{log.title}</h3>
                  <p className="m-0 text-[14px] leading-[1.6] text-favella-text-secondary">{log.content}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-9 text-center">
            <a
              href={RELEASES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display text-[14px] font-semibold text-favella-cyan transition-colors hover:text-favella-cyan-bright"
            >
              Tutte le release su GitHub →
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default UpdatesPage;
