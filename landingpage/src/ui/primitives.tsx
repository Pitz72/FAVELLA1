import React, { useEffect, useRef, useState } from "react";
import { Link } from "../router";
import { skipMotion, useInView } from "./hooks";

// ====================================================================
//  Primitive del design 2026: ingresso allo scorrimento, luce che segue il
//  puntatore, etichette, bottoni, numeri che salgono, strisce che scorrono.
//  Palette e font restano quelli del marchio (tailwind.config.js).
// ====================================================================

/** Fa comparire il contenuto con una salita morbida quando entra nello schermo. */
export const Reveal = ({
  children,
  delay = 0,
  y = 28,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) => {
  const [ref, seen] = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(.2,.7,.2,1)] ${
        seen ? "opacity-100" : "opacity-0"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms`, transform: seen ? "none" : `translateY(${y}px)` }}
    >
      {children}
    </div>
  );
};

/** Una scheda con bordo sfumato e una luce che insegue il puntatore. */
export const Spot = ({
  children,
  className = "",
  as: Tag = "div",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
} & Record<string, unknown>) => {
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <Tag onPointerMove={onMove} className={`spot ${className}`} {...rest}>
      {children}
    </Tag>
  );
};

/** Etichetta in maiuscolo mono, con un filetto. */
export const Eyebrow = ({
  children,
  tone = "cyan",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "cyan" | "emerald" | "amber";
  className?: string;
}) => {
  const color = { cyan: "text-favella-cyan", emerald: "text-favella-emerald", amber: "text-favella-amber" }[tone];
  const line = { cyan: "bg-favella-cyan", emerald: "bg-favella-emerald", amber: "bg-favella-amber" }[tone];
  return (
    <p className={`flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em] ${color} ${className}`}>
      <span className={`h-px w-8 ${line} opacity-70`} />
      {children}
    </p>
  );
};

/** Testata di sezione: occhiello, titolo grande, frase d'apertura. */
export const SectionHead = ({
  eyebrow,
  title,
  lead,
  tone = "cyan",
  align = "left",
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  tone?: "cyan" | "emerald" | "amber";
  align?: "left" | "center";
}) => (
  <div className={`mb-12 max-w-[760px] ${align === "center" ? "mx-auto text-center" : ""}`}>
    <Eyebrow tone={tone} className={`mb-5 ${align === "center" ? "justify-center" : ""}`}>
      {eyebrow}
    </Eyebrow>
    <h2 className="font-display text-[clamp(32px,4.8vw,60px)] font-bold leading-[1.02] tracking-[-0.035em] text-favella-text-primary">
      {title}
    </h2>
    {lead && (
      <p className="mt-5 font-serif text-[clamp(17px,1.7vw,20px)] leading-[1.65] text-favella-text-secondary">{lead}</p>
    )}
  </div>
);

/** La parola in corsivo col gradiente di marca. */
export const Ink = ({ children }: { children: React.ReactNode }) => (
  <span className="font-serif font-medium italic tracking-[-0.02em] text-ink-accent">{children}</span>
);

type BtnProps = {
  children: React.ReactNode;
  to?: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "amber";
  className?: string;
  size?: "md" | "lg";
  target?: string;
  rel?: string;
};

/** Bottone (o link) con tre varianti: pieno col gradiente, trasparente, ambra. */
export const Btn = ({
  children,
  to,
  href,
  onClick,
  variant = "primary",
  className = "",
  size = "md",
  target,
  rel,
}: BtnProps) => {
  const pad = size === "lg" ? "px-8 py-4 text-[16px]" : "px-6 py-3.5 text-[15px]";
  const base = `btn-shine group relative inline-flex items-center justify-center gap-2.5 rounded-full font-display font-bold transition-all duration-300 ${pad}`;
  const look = {
    primary:
      "bg-brand-gradient text-favella-void shadow-[0_18px_50px_-18px_rgba(34,211,238,0.7)] hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-16px_rgba(34,211,238,0.85)]",
    amber:
      "bg-[linear-gradient(110deg,#f59e0b,#fbbf24)] text-favella-void shadow-[0_18px_50px_-18px_rgba(245,158,11,0.75)] hover:-translate-y-0.5",
    ghost:
      "border border-favella-cyan/30 bg-favella-surface/30 font-semibold text-favella-text-primary backdrop-blur hover:border-favella-cyan/70 hover:bg-favella-cyan/10",
  }[variant];
  const cls = `${base} ${look} ${className}`;
  if (to) return <Link to={to} className={cls}>{children}</Link>;
  if (href) {
    const isAnchor = href.startsWith("#");
    const isExternal = /^https?:\/\//.test(href);
    const computedTarget = target ?? (isAnchor ? undefined : isExternal ? "_blank" : undefined);
    const computedRel = rel ?? (computedTarget === "_blank" ? "noopener noreferrer" : undefined);
    return (
      <a href={href} target={computedTarget} rel={computedRel} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button onClick={onClick} className={cls}>
      {children}
    </button>
  );
};

/** Una pillola con un puntino acceso. */
export const Pill = ({ children, tone = "emerald" }: { children: React.ReactNode; tone?: "cyan" | "emerald" | "amber" }) => {
  const c = {
    cyan: "border-favella-cyan/30 text-favella-cyan bg-favella-cyan/8",
    emerald: "border-favella-emerald/30 text-favella-emerald bg-favella-emerald/8",
    amber: "border-favella-amber/35 text-favella-amber bg-favella-amber/8",
  }[tone];
  const dot = { cyan: "bg-favella-cyan", emerald: "bg-favella-emerald", amber: "bg-favella-amber" }[tone];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] ${c}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot} shadow-[0_0_10px_currentColor]`} />
      {children}
    </span>
  );
};

/** Un numero che sale fino al valore quando entra nello schermo. */
export const Counter = ({ value, suffix = "", className = "" }: { value: number; suffix?: string; className?: string }) => {
  const [ref, seen] = useInView<HTMLSpanElement>();
  const [n, setN] = useState(() => (typeof window === "undefined" || skipMotion() ? value : 0));
  const done = useRef(false);
  useEffect(() => {
    if (!seen || done.current) return;
    done.current = true;
    if (skipMotion()) {
      setN(value);
      return;
    }
    const t0 = performance.now();
    const dur = 1600;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 4);
      setN(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, value]);
  return (
    <span ref={ref} className={className}>
      {n.toLocaleString("it-IT")}
      {suffix}
    </span>
  );
};

/** Una striscia che scorre senza fine; si ferma quando ci si passa sopra. */
export const Marquee = ({
  children,
  reverse = false,
  duration = 60,
  className = "",
}: {
  children: React.ReactNode;
  reverse?: boolean;
  duration?: number;
  className?: string;
}) => (
  <div className={`marquee-mask group relative flex overflow-hidden ${className}`}>
    {[0, 1].map((i) => (
      <div
        key={i}
        aria-hidden={i === 1}
        className="marquee-track flex shrink-0 items-center gap-4 pr-4 group-hover:[animation-play-state:paused]"
        style={{ animationDuration: `${duration}s`, animationDirection: reverse ? "reverse" : "normal" }}
      >
        {children}
      </div>
    ))}
  </div>
);

/** Le graffe e le scintille del marchio, che fluttuano in un angolo di sfondo. */
export const GlyphField = ({ className = "" }: { className?: string }) => (
  <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
    <span className="glyph absolute left-[6%] top-[18%] text-[120px] text-favella-cyan/[0.07]" style={{ animationDelay: "0s" }}>{"{"}</span>
    <span className="glyph absolute right-[8%] top-[10%] text-[160px] text-favella-cyan/[0.06]" style={{ animationDelay: "-3s" }}>{"}"}</span>
    <span className="glyph absolute left-[42%] top-[62%] text-[90px] text-favella-amber/[0.08]" style={{ animationDelay: "-5s" }}>✦</span>
    <span className="glyph absolute right-[26%] top-[70%] text-[70px] text-favella-emerald/[0.08]" style={{ animationDelay: "-2s" }}>✦</span>
  </div>
);

/** La testata comune delle pagine interne. */
export const PageHero = ({
  eyebrow,
  title,
  lead,
  tone = "cyan",
  children,
  aside,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  tone?: "cyan" | "emerald" | "amber";
  children?: React.ReactNode;
  aside?: React.ReactNode;
}) => {
  const glow = {
    cyan: "rgba(34,211,238,0.16)",
    emerald: "rgba(52,211,153,0.15)",
    amber: "rgba(245,158,11,0.15)",
  }[tone];
  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-32 md:pt-40">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: `radial-gradient(70% 90% at 14% 0%, ${glow}, transparent 62%), radial-gradient(50% 60% at 96% 20%, rgba(245,158,11,0.07), transparent 60%)` }}
      />
      <div aria-hidden="true" className="grid-lines absolute inset-0" />
      <GlyphField />
      <div className="relative mx-auto max-w-[1180px]">
        <div className={aside ? "grid items-center gap-12 lg:grid-cols-[1.25fr_0.9fr]" : ""}>
          <div>
            <Reveal>
              <Eyebrow tone={tone} className="mb-6">
                {eyebrow}
              </Eyebrow>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="font-display text-[clamp(40px,6.6vw,92px)] font-bold leading-[0.98] tracking-[-0.045em] text-favella-text-primary">
                {title}
              </h1>
            </Reveal>
            {lead && (
              <Reveal delay={160}>
                <p className="mt-7 max-w-[680px] font-serif text-[clamp(18px,1.9vw,22px)] leading-[1.62] text-favella-text-secondary">{lead}</p>
              </Reveal>
            )}
            {children && (
              <Reveal delay={240} className="mt-9">
                {children}
              </Reveal>
            )}
          </div>
          {aside && <Reveal delay={200}>{aside}</Reveal>}
        </div>
      </div>
    </section>
  );
};
