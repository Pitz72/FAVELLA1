// ====================================================================
//  «Il Viaggiatore» — TRAILER d'apertura (direzione «Sete»).
// --------------------------------------------------------------------
//  Porting 1:1 del design Claude Design «Il Viaggiatore - Intro», direzione
//  Sete (il DNA favella: void blu-nerissimo, scanline CRT, accento ciano che
//  vira per zona, monospazio elevato). È un FILMATO interamente in CSS-
//  keyframe: ogni beat anima da solo via animation-delay (nessuna timeline
//  condivisa → nessuna sovrapposizione). Una sola scena continua: deserto a
//  parallax con camera in pan + push-in, il viandante che cammina, e
//  l'orizzonte che si ricolora del colore di ogni zona. Letterbox, vignetta,
//  HUD da terminale. Barra di avanzamento + tasto «salta». Si chiude sul
//  pulsante d'avvio che apre il full-game.
// ====================================================================
import { useEffect, useMemo, useRef, useState } from "react";

const SETE = {
  bg: "#03060d", text: "#e8f0f8", soft: "#9fb4c9", muted: "#5a728a",
  accent: "#22d3ee", glow: "rgba(34,211,238,.5)",
  fSerif: "'Lora',Georgia,serif", fMono: "'Source Code Pro',ui-monospace,monospace",
};

const ZONES = [
  { n: "Acquaviva", s: "il capolinea", a: "#7fc8bd" },
  { n: "La piana", s: "il sole non perdona", a: "#e6a85a" },
  { n: "L'invaso morto", s: "acqua ovunque, niente da bere", a: "#a9dbe4" },
  { n: "La statale", s: "chi tiene la strada", a: "#f2ad45" },
  { n: "Il paese", s: "il posto dove restare", a: "#ec7d54" },
  { n: "Le colline", s: "l'ultima salita", a: "#9aa6e0" },
  { n: "Il guado", s: "tuo fratello", a: "#df5f78" },
];
const VERBS = ["custodire", "aspettare", "predare", "restare", "rinunciare"];
const LOGICS = ["La sete è la spina dorsale", "L'acqua è la moneta", "La fiducia apre le porte", "La violenza costa, ed è evitabile", "Le scelte arrivano fino in fondo"];
const STATS = [{ n: 7, l: "zone" }, { n: 39, l: "luoghi" }, { n: 15, l: "personaggi" }, { n: 44, l: "oggetti" }, { n: 4, l: "finali" }];

// Timeline a tempi assoluti (secondi): ogni beat sa quando partire e quanto vive.
interface Beat { start: number; life: number }
interface TL {
  open: Beat; log1: Beat; log2: Beat; secca: Beat; quest: Beat; zonesTitle: Beat;
  _zones: Beat[]; peoTitle: Beat;
  verbs: { start: number; life: number; stag: number; vIn: number };
  brother: Beat; _logics: Beat[]; numbers: Beat; title: { start: number };
  total: number; numbersStart: number;
}

function buildTL(): TL {
  const IN = 0.9, OUT = 0.7, OV = 0.35;
  const b: Record<string, Beat> = {};
  let t = 0.6;
  const add = (key: string, hold: number, inn = IN, out = OUT) => {
    const start = t, life = inn + hold + out;
    b[key] = { start, life }; t = start + life - OV;
  };
  add("open", 2.0); add("log1", 2.0); add("log2", 1.6); add("secca", 1.1); add("quest", 2.4); add("zonesTitle", 1.0);
  const _zones: Beat[] = [];
  for (let i = 0; i < 7; i++) { const start = t, life = 0.8 + 0.8 + 0.55; _zones.push({ start, life }); t = start + life - 0.35; }
  add("peoTitle", 1.4);
  const vStart = t, stag = 0.42, vIn = 0.5, vLife = vIn + stag * 4 + 1.0 + 0.7;
  const verbs = { start: vStart, life: vLife, stag, vIn }; t = vStart + vLife - OV;
  add("brother", 1.8);
  const _logics: Beat[] = [];
  for (let i = 0; i < 5; i++) { const start = t, life = 0.6 + 0.5 + 0.45; _logics.push({ start, life }); t = start + life - 0.3; }
  const nStart = t, nLife = 0.8 + 2.0 + 0.7;
  const numbers = { start: nStart, life: nLife }; const numbersStart = nStart + 0.25; t = nStart + nLife - 0.3;
  const tiStart = t; const title = { start: tiStart }; t = tiStart + 3.2;
  return {
    open: b.open, log1: b.log1, log2: b.log2, secca: b.secca, quest: b.quest, zonesTitle: b.zonesTitle,
    _zones, peoTitle: b.peoTitle, verbs, brother: b.brother, _logics, numbers, title,
    total: t + 0.4, numbersStart,
  };
}

const wayfarerSvg = (color: string) =>
  "<svg width='118' viewBox='-30 -64 60 98' style='overflow:visible'>"
  + "<ellipse cx='2' cy='31' rx='27' ry='4.6' fill='" + color + "' opacity='.3'/>"
  + "<g style='animation:kf-bob .31s ease-in-out infinite'>"
  + "<line x1='-5' y1='-30' x2='-16' y2='-12' stroke='" + color + "' stroke-width='4.4' stroke-linecap='round' style='transform-box:fill-box;transform-origin:50% 0%;animation:kf-walkA .62s ease-in-out infinite'/>"
  + "<line x1='5' y1='-30' x2='15' y2='-15' stroke='" + color + "' stroke-width='4.4' stroke-linecap='round' style='transform-box:fill-box;transform-origin:50% 0%;animation:kf-walkB .62s ease-in-out infinite'/>"
  + "<line x1='-3' y1='-3' x2='-11' y2='25' stroke='" + color + "' stroke-width='5.2' stroke-linecap='round' style='transform-box:fill-box;transform-origin:50% 0%;animation:kf-walkA .62s ease-in-out infinite'/>"
  + "<line x1='3' y1='-3' x2='10' y2='27' stroke='" + color + "' stroke-width='5.2' stroke-linecap='round' style='transform-box:fill-box;transform-origin:50% 0%;animation:kf-walkB .62s ease-in-out infinite'/>"
  + "<path d='M-7 -38 Q-11 -16 -3 -2 L4 -2 Q11 -18 7 -38 Z' fill='" + color + "'/>"
  + "<circle cx='0' cy='-46' r='7.6' fill='" + color + "'/>"
  + "<line x1='15' y1='-44' x2='17' y2='31' stroke='" + color + "' stroke-width='2.1' stroke-linecap='round'/>"
  + "</g></svg>";

const bgSete = (total: number) =>
  "<svg viewBox='0 0 1920 800' preserveAspectRatio='xMidYMid slice' style='position:absolute;inset:0;width:100%;height:100%'>"
  + "<defs>"
  + "<radialGradient id='skS' cx='52%' cy='30%' r='120%'><stop offset='0%' stop-color='#14323e'/><stop offset='40%' stop-color='#0a1822'/><stop offset='100%' stop-color='#03060d'/></radialGradient>"
  + "<radialGradient id='hzS' cx='50%' cy='100%' r='60%'><stop offset='0%' stop-color='#22d3ee' stop-opacity='.4'/><stop offset='100%' stop-color='#22d3ee' stop-opacity='0'/></radialGradient>"
  + "<linearGradient id='gS1' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#102733'/><stop offset='1' stop-color='#070f17'/></linearGradient>"
  + "<linearGradient id='gS2' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#0c1d27'/><stop offset='1' stop-color='#050b12'/></linearGradient>"
  + "<linearGradient id='gS3' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#08141c'/><stop offset='1' stop-color='#03070d'/></linearGradient>"
  + "<filter id='blS'><feGaussianBlur stdDeviation='6'/></filter>"
  + "</defs>"
  + "<g style='--d:-50px;animation:kf-pan " + total + "s linear forwards'><rect x='-200' y='0' width='2400' height='800' fill='url(#skS)'/><ellipse cx='960' cy='470' rx='900' ry='240' fill='url(#hzS)'/><rect x='-200' y='468' width='2400' height='2.4' fill='#5cf3ff' opacity='.65' filter='url(#blS)'/></g>"
  + "<g style='--d:-150px;animation:kf-pan " + total + "s linear forwards'><path d='M-200 478 Q300 444 800 470 T1900 464 T2200 470 V800 H-200 Z' fill='url(#gS1)' opacity='.9'/></g>"
  + "<g style='--d:-280px;animation:kf-pan " + total + "s linear forwards'><path d='M-200 566 Q360 516 950 558 T2000 554 V800 H-200 Z' fill='url(#gS2)'/></g>"
  + "<g style='--d:-440px;animation:kf-pan " + total + "s linear forwards'>"
  + "<path d='M-200 664 Q300 604 800 652 T1800 646 T2200 656 V800 H-200 Z' fill='url(#gS3)'/>"
  + "<g stroke='#1e3a52' stroke-width='3' opacity='.6' fill='none'>"
  + "<line x1='320' y1='638' x2='314' y2='486'/><line x1='296' y1='512' x2='344' y2='510'/>"
  + "<line x1='900' y1='648' x2='894' y2='498'/><line x1='876' y1='524' x2='924' y2='522'/>"
  + "<line x1='1500' y1='646' x2='1494' y2='492'/><line x1='1476' y1='518' x2='1524' y2='516'/>"
  + "</g></g></svg>";

const Trailer = ({ startAtEnd = false, onLaunch }: { startAtEnd?: boolean; onLaunch: () => void }) => {
  const tl = useMemo(buildTL, []);
  const th = SETE;
  const [ended, setEnded] = useState(startAtEnd);
  const [runId, setRunId] = useState(0);
  const statRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const clear = () => {
      timersRef.current.forEach(clearTimeout); timersRef.current = [];
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    clear();
    if (startAtEnd) { setEnded(true); return clear; }
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setEnded(true); return clear; }

    let cancelled = false;
    // conta-su dei numeri (rAF), sincronizzato col beat dei numeri
    const startCounter = () => {
      const t0 = performance.now(), dur = 1500;
      const tick = (now: number) => {
        if (cancelled) return;
        const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        STATS.forEach((s, i) => { const el = statRefs.current[i]; if (el) el.textContent = String(Math.round(s.n * e)); });
        if (p < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    };
    timersRef.current.push(setTimeout(startCounter, tl.numbersStart * 1000));
    timersRef.current.push(setTimeout(() => { if (!cancelled) setEnded(true); }, tl.total * 1000));
    return () => { cancelled = true; clear(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, startAtEnd]);

  const rivedi = () => { setEnded(false); setRunId((n) => n + 1); };
  const total = tl.total;

  const serif = (size: string, extra?: React.CSSProperties): React.CSSProperties =>
    ({ fontFamily: th.fSerif, margin: 0, color: th.text, lineHeight: 1.18, fontWeight: 600, fontSize: size, ...extra });
  const mono = (extra?: React.CSSProperties): React.CSSProperties => ({ fontFamily: th.fMono, margin: 0, ...extra });
  const beatStyle = (b: Beat, extra?: React.CSSProperties): React.CSSProperties =>
    ({ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 9%", pointerEvents: "none", opacity: 0, zIndex: 15, animation: `kf-beat ${b.life.toFixed(2)}s ease ${b.start.toFixed(2)}s both`, ...extra });

  const corner = (pos: "tl" | "tr" | "bl" | "br") => {
    const base: React.CSSProperties = { position: "absolute", width: 18, height: 18, pointerEvents: "none", opacity: .6 };
    const b = "1px solid rgba(34,211,238,.5)";
    if (pos === "tl") Object.assign(base, { top: "10.5%", left: 18, borderTop: b, borderLeft: b });
    if (pos === "tr") Object.assign(base, { top: "10.5%", right: 18, borderTop: b, borderRight: b });
    if (pos === "bl") Object.assign(base, { bottom: "14.5%", left: 18, borderBottom: b, borderLeft: b });
    if (pos === "br") Object.assign(base, { bottom: "14.5%", right: 18, borderBottom: b, borderRight: b });
    return <div key={"c" + pos} style={base} />;
  };

  // ── LO STAGE (keyed da runId per riavviare le animazioni CSS) ──
  const stage = (
    <div key={th.bg + "-" + runId} style={{ position: "absolute", inset: 0, overflow: "hidden", background: th.bg }}>
      {/* camera: parallax + push-in */}
      <div style={{ position: "absolute", inset: 0, transformOrigin: "50% 64%", animation: `kf-push ${total}s linear forwards` }}>
        <div style={{ position: "absolute", inset: 0 }} dangerouslySetInnerHTML={{ __html: bgSete(total) }} />
        <div style={{ position: "absolute", bottom: "19%", left: "50%", transform: "translateX(-50%)" }} dangerouslySetInnerHTML={{ __html: wayfarerSvg("#06222b") }} />
      </div>

      {/* atmosfera */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(120% 100% at 50% 42%, transparent 38%, rgba(3,4,9,.72) 100%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "52%", pointerEvents: "none", background: `linear-gradient(to top, ${th.bg}d9, transparent)` }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "repeating-linear-gradient(rgba(34,211,238,.05) 0 1px, transparent 1px 3px)", animation: "kf-flicker 3.5s ease-in-out infinite" }} />

      {/* letterbox */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: "8.5%", background: "#000", transformOrigin: "top", transform: "scaleY(0)", animation: "kf-bar 1.1s ease both", zIndex: 20 }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "8.5%", background: "#000", transformOrigin: "bottom", transform: "scaleY(0)", animation: "kf-bar 1.1s ease both", zIndex: 20 }} />

      {/* veli color-grade + orizzonte ricolorato per zona */}
      {tl._zones.map((z, i) => (
        <div key={"vl" + i} style={{ position: "absolute", inset: 0, pointerEvents: "none", background: ZONES[i].a, opacity: 0, mixBlendMode: "soft-light", animation: `kf-veil ${(z.life + 1.4).toFixed(2)}s ease ${(z.start - 0.2).toFixed(2)}s both` }} />
      ))}
      {tl._zones.map((z, i) => (
        <div key={"hz" + i} style={{ position: "absolute", left: 0, right: 0, top: "46%", height: "12%", pointerEvents: "none", opacity: 0, filter: "blur(22px)", background: `radial-gradient(80% 100% at 50% 100%, ${ZONES[i].a}, transparent 70%)`, animation: `kf-veil ${(z.life + 1.4).toFixed(2)}s ease ${(z.start - 0.2).toFixed(2)}s both` }} />
      ))}

      {!ended ? (
        <>
          {/* HUD da terminale */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 18, opacity: 0, animation: "kf-hud 1.2s ease 1.1s both" }}>
            {corner("tl")}{corner("tr")}{corner("bl")}{corner("br")}
            <div style={{ position: "absolute", left: 24, bottom: "11.2%", display: "flex", alignItems: "center", gap: 9, fontFamily: th.fMono, fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", color: th.muted }}>
              <span style={{ color: th.accent }}>.fav</span><span>il viaggiatore</span>
              <span style={{ width: 7, height: 14, background: th.accent, display: "inline-block", animation: "kf-caret 1s step-end infinite" }} />
            </div>
            <div style={{ position: "absolute", right: 24, bottom: "11.2%", display: "flex", alignItems: "center", gap: 11, fontFamily: th.fMono, fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", color: th.muted }}>
              <span>07 tappe</span>
              <span style={{ display: "flex", gap: 5 }}>
                {ZONES.map((zn, i) => (
                  <span key={"tk" + i} style={{ position: "relative", display: "inline-block", width: 16, height: 3, borderRadius: 2, background: "rgba(255,255,255,.12)" }}>
                    <span style={{ position: "absolute", inset: 0, borderRadius: 2, background: zn.a, boxShadow: `0 0 8px ${zn.a}`, opacity: 0, animation: `kf-on .45s ease ${tl._zones[i].start.toFixed(2)}s both` }} />
                  </span>
                ))}
              </span>
            </div>
          </div>

          {/* ── BEATS ── */}
          <div style={{ position: "absolute", inset: 0 }}>
            <div style={beatStyle(tl.open)}>
              <p style={mono({ fontSize: "clamp(15px,2.1vw,28px)", color: th.soft, lineHeight: 1.5, letterSpacing: ".01em" })}>
                <span style={{ color: th.accent, marginRight: 10 }}>&gt;</span>Le lettere hanno smesso di arrivare.
                <span style={{ display: "inline-block", width: ".5em", height: "1.05em", marginLeft: 6, background: th.accent, verticalAlign: "-0.16em", animation: "kf-caret 1s step-end infinite" }} />
              </p>
            </div>

            <div style={beatStyle(tl.log1)}>
              <p style={serif("clamp(30px,5vw,66px)", { lineHeight: 1.12 })}>Un uomo torna a casa.<br /><span style={{ color: th.accent }}>A piedi.</span></p>
            </div>
            <div style={beatStyle(tl.log2)}>
              <p style={serif("clamp(20px,3.3vw,42px)", { fontWeight: 500, color: th.soft, lineHeight: 1.35 })}>Attraverso una terra che l'acqua ha svuotato.</p>
            </div>
            <div style={beatStyle(tl.secca)}>
              <p style={mono({ fontSize: "clamp(11px,1.4vw,16px)", letterSpacing: ".44em", textTransform: "uppercase", color: th.accent })}>la Secca</p>
            </div>
            <div style={beatStyle(tl.quest)}>
              <p style={serif("clamp(22px,3.6vw,46px)", { fontStyle: "italic", fontWeight: 500, lineHeight: 1.28 })}>A cosa stai tornando — e cosa resterà di te<br />quando ci arrivi?</p>
            </div>
            <div style={beatStyle(tl.zonesTitle)}>
              <p style={serif("clamp(22px,3.6vw,46px)", { fontWeight: 500 })}>Sette tappe fino a casa.</p>
            </div>

            {/* le 7 zone */}
            {ZONES.map((zn, i) => {
              const z = tl._zones[i];
              return (
                <div key={"z" + i} style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 9%", pointerEvents: "none", opacity: 0, zIndex: 15, animation: `kf-beat ${z.life.toFixed(2)}s ease ${z.start.toFixed(2)}s both` }}>
                  <p style={mono({ fontSize: "clamp(10px,1.2vw,13px)", letterSpacing: ".4em", textTransform: "uppercase", color: th.muted })}>tappa {i + 1} di 7</p>
                  <h2 style={{ fontFamily: "'Sora',sans-serif", margin: "14px 0 0", fontWeight: 700, fontSize: "clamp(38px,6.4vw,82px)", letterSpacing: "-.02em", color: zn.a }}>{zn.n}</h2>
                  <p style={serif("clamp(16px,2.3vw,28px)", { margin: "14px 0 0", fontStyle: "italic", fontWeight: 500, color: th.soft })}>{zn.s}</p>
                </div>
              );
            })}

            <div style={beatStyle(tl.peoTitle)}>
              <p style={serif("clamp(24px,3.9vw,50px)", { fontWeight: 500, lineHeight: 1.2 })}>Cinque modi di stare<br />in un mondo che muore.</p>
            </div>

            {/* i 5 verbi-risposta in cascata */}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8%", pointerEvents: "none", opacity: 0, zIndex: 15, animation: `kf-beat ${tl.verbs.life.toFixed(2)}s ease ${tl.verbs.start.toFixed(2)}s both` }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "14px 34px" }}>
                {VERBS.map((v, i) => (
                  <span key={v} style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: "clamp(22px,3.6vw,48px)", color: th.text, opacity: 0, animation: `kf-rise .6s ease ${(tl.verbs.start + 0.4 + i * tl.verbs.stag).toFixed(2)}s both` }}>{v}</span>
                ))}
              </div>
            </div>

            <div style={beatStyle(tl.brother)}>
              <p style={serif("clamp(24px,3.9vw,50px)", { fontWeight: 500, lineHeight: 1.22 })}>E al guado, ad aspettarti,<br /><span style={{ color: "#df5f78" }}>tuo fratello.</span></p>
            </div>

            {/* le logiche */}
            {LOGICS.map((lg, i) => {
              const z = tl._logics[i];
              return (
                <div key={"lg" + i} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 9%", pointerEvents: "none", opacity: 0, zIndex: 15, animation: `kf-beat ${z.life.toFixed(2)}s ease ${z.start.toFixed(2)}s both` }}>
                  <p style={{ fontFamily: "'Sora',sans-serif", margin: 0, fontWeight: 600, fontSize: "clamp(24px,4.2vw,54px)", letterSpacing: "-.01em", color: th.text }}>{lg}<span style={{ color: th.accent }}>.</span></p>
                </div>
              );
            })}

            {/* i numeri (conta-su) */}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 7%", pointerEvents: "none", opacity: 0, zIndex: 15, animation: `kf-beat ${tl.numbers.life.toFixed(2)}s ease ${tl.numbers.start.toFixed(2)}s both` }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "center", gap: "18px clamp(22px,4vw,56px)" }}>
                {STATS.map((s, i) => (
                  <div key={s.l} style={{ textAlign: "center", position: "relative", padding: "0 14px" }}>
                    <span style={{ position: "absolute", left: 0, top: "2%", bottom: "30%", width: 7, borderLeft: `1px solid ${th.accent}66`, borderTop: `1px solid ${th.accent}66`, borderBottom: `1px solid ${th.accent}66` }} />
                    <span style={{ position: "absolute", right: 0, top: "2%", bottom: "30%", width: 7, borderRight: `1px solid ${th.accent}66`, borderTop: `1px solid ${th.accent}66`, borderBottom: `1px solid ${th.accent}66` }} />
                    <div style={{ fontFamily: th.fMono, fontWeight: 700, fontSize: "clamp(42px,6.6vw,82px)", lineHeight: 1, color: th.accent }}>
                      <span ref={(el) => { statRefs.current[i] = el; }}>0</span>
                    </div>
                    <div style={{ fontFamily: th.fMono, marginTop: 8, fontSize: "clamp(9px,1.1vw,12px)", letterSpacing: ".24em", textTransform: "uppercase", color: th.muted }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* title card */}
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 7%", pointerEvents: "none", zIndex: 16 }}>
              <h1 style={{ fontFamily: "'Sora',sans-serif", margin: 0, fontWeight: 800, fontSize: "clamp(40px,8.4vw,108px)", letterSpacing: ".07em", color: th.text, opacity: 0, animation: `kf-title 1.9s cubic-bezier(.2,.7,.2,1) ${tl.title.start.toFixed(2)}s both` }}>IL VIAGGIATORE</h1>
              <p style={{ fontFamily: th.fMono, margin: "22px 0 0", fontSize: "clamp(10px,1.2vw,14px)", letterSpacing: ".42em", textTransform: "uppercase", color: th.accent, opacity: 0, animation: `kf-rise 1s ease ${(tl.title.start + 1.2).toFixed(2)}s both` }}>un esperimento in favella 1</p>
            </div>
          </div>

          {/* barra di avanzamento */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,.06)", zIndex: 40 }}>
            <div style={{ height: "100%", transformOrigin: "left", transform: "scaleX(0)", background: th.accent, opacity: .85, animation: `kf-progress ${total}s linear forwards` }} />
          </div>
          {/* salta */}
          <button onClick={() => setEnded(true)} style={{ position: "absolute", right: 18, bottom: "16.5%", zIndex: 40, cursor: "pointer", border: "1px solid rgba(255,255,255,.16)", background: "rgba(0,0,0,.4)", backdropFilter: "blur(4px)", color: th.soft, fontFamily: th.fMono, fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", padding: "7px 15px", borderRadius: 999 }}>salta →</button>
        </>
      ) : (
        // ── Schermata d'avvio ──
        <section style={{ position: "absolute", inset: 0, zIndex: 30, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 8%", background: `radial-gradient(120% 120% at 50% 0%, ${th.bg}88, ${th.bg} 72%)`, animation: "kf-launch .6s ease both" }}>
          <p style={{ fontFamily: th.fMono, margin: 0, fontSize: "clamp(10px,1.2vw,13px)", letterSpacing: ".3em", textTransform: "uppercase", color: th.accent }}>il motore è pronto</p>
          <h2 style={{ fontFamily: "'Sora',sans-serif", margin: "16px 0 0", fontWeight: 700, fontSize: "clamp(30px,5vw,62px)", letterSpacing: "-.01em", color: th.text }}>Si parte a piedi.</h2>
          <p style={{ fontFamily: th.fSerif, margin: "18px auto 0", maxWidth: 520, fontSize: "clamp(14px,1.7vw,18px)", lineHeight: 1.5, color: th.soft }}>Da qui in poi sei tu a scrivere i comandi, in italiano. Bevi quando hai sete, parla con chi incontri, decidi cosa portare fino a casa.</p>
          <button onClick={onLaunch} style={{ marginTop: 34, cursor: "pointer", border: "none", display: "inline-flex", alignItems: "center", gap: 12, borderRadius: 999, padding: "16px 42px", fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: "clamp(16px,1.8vw,20px)", color: th.bg, background: th.accent, ["--gl" as string]: th.glow, animation: "kf-pulse 1.7s ease-in-out infinite" } as React.CSSProperties}>Inizia il viaggio<span>→</span></button>
          <button onClick={rivedi} style={{ marginTop: 20, cursor: "pointer", border: "none", background: "none", fontFamily: th.fMono, fontSize: 12, letterSpacing: ".14em", color: th.muted }}>↺ rivedi l'intro</button>
        </section>
      )}
    </div>
  );

  return (
    <div style={{ position: "relative", height: "100%", width: "100%", overflow: "hidden", background: "#000" }}>
      {stage}
    </div>
  );
};

export default Trailer;
