// ====================================================================
//  «Il Viaggiatore» — TRAILER d'apertura (seconda versione).
// --------------------------------------------------------------------
//  Un cortometraggio di ~88 s in dieci inquadrature (vedi trailer/scaletta.ts
//  per il découpage). Architettura:
//   · UN orologio (rAF) → tempo t. Tutto è funzione di t: canvas, testi,
//     suono. Nessun comando a schermo durante il trailer: Esc lo salta.
//   · Canvas 16:9 in coordinate di progetto 1920×1080 per le immagini
//     (paesaggi procedurali, viandante articolato, mappa, polvere).
//   · Livello DOM, stessa superficie 1920×1080 scalata, per la tipografia
//     (nitida a ogni risoluzione) e il menu d'avvio finale.
//     I testi si animano scrivendo gli stili via ref: niente re-render React
//     a 60 fps.
//   · Colonna sonora: il brano src/assets/intro.mp3 (fa anche da orologio)
//     più il rumorismo sintetizzato; senza brano, tutta sintetizzata. Sul
//     desktop parte da sola; nel browser col primo tasto o clic.
// ====================================================================
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { W, H, BANDA, SCENE, DURATA, presenza, TAPPE_T0, TAPPE_PASSO, CINQUE_T0, CINQUE_PASSO, REGOLA_DUR } from "../trailer/scaletta";
import { disegnaScena, precarica, tappaCorrente, REGOLE, FONT, type Cache } from "../trailer/paesaggi";
import { clamp, seg, easeOut, easeIn, expoOut, inviluppo } from "../trailer/tempo";
import { ColonnaSonora } from "../trailer/audio";
import branoIntro from "../assets/intro.mp3";
import { inDesktop, esciDalGioco } from "../lib/desktop";
import Taccuino from "../gioco/Taccuino";
import { piuRecente, type Salvataggio } from "../lib/salvataggi";
import { etichettaVersione } from "../lib/versione";
import ComeSiGioca from "../gioco/ComeSiGioca";

// --------------------------------------------------------------------
//  Testi (cue): tempi, posizione, tipo d'animazione
// --------------------------------------------------------------------
type Tipo = "maschera" | "dissolvi" | "timbro";
interface Riga { testo: React.ReactNode; stile?: React.CSSProperties }
interface Cue {
  id: string; da: number; a: number; entra?: number; esce?: number; tipo: Tipo;
  box: React.CSSProperties; righe: Riga[]; sfalsa?: number;
}

const serif = (px: number, extra: React.CSSProperties = {}): React.CSSProperties =>
  ({ fontFamily: FONT.serif, fontWeight: 500, fontSize: px, lineHeight: 1.16, letterSpacing: "-0.005em", ...extra });
const display = (px: number, extra: React.CSSProperties = {}): React.CSSProperties =>
  ({ fontFamily: FONT.display, fontWeight: 600, fontSize: px, lineHeight: 1.08, letterSpacing: "-0.02em", ...extra });
const mono = (px: number, extra: React.CSSProperties = {}): React.CSSProperties =>
  ({ fontFamily: FONT.mono, fontWeight: 500, fontSize: px, letterSpacing: "0.32em", textTransform: "uppercase", ...extra });

const centro = (y: number): React.CSSProperties => ({ left: 0, right: 0, top: y, textAlign: "center" });

const regolaScura = { width: 120, height: 2, background: "#3b2415", display: "inline-block" } as const;

const CUES: Cue[] = [
  { id: "alba1", da: 10.6, a: 16.9, tipo: "maschera", box: centro(250), righe: [{ testo: "Un uomo torna a casa.", stile: serif(88, { color: "#f4ece0" }) }] },
  { id: "alba2", da: 12.3, a: 16.9, tipo: "maschera", box: centro(360), righe: [{ testo: "A piedi.", stile: serif(88, { color: "#f6b77c", fontStyle: "italic" }) }] },
  { id: "terra", da: 18.3, a: 22.4, tipo: "maschera", sfalsa: 0.16, box: { left: 170, top: 196 },
    righe: [{ testo: "Attraverso una terra", stile: serif(70, { color: "#2c1a0e" }) }, { testo: "che l'acqua ha svuotato.", stile: serif(70, { color: "#2c1a0e" }) }] },
  { id: "secca", da: 22.6, a: 25.1, entra: 0.3, tipo: "timbro", box: { left: 170, top: 400 },
    righe: [
      { testo: <span style={{ display: "inline-flex", alignItems: "center", gap: 30 }}>la secca<i style={regolaScura} /></span>, stile: mono(34, { color: "#3b2415", letterSpacing: "0.62em", fontWeight: 600 }) },
      { testo: "dieci anni senza pioggia", stile: serif(34, { color: "#4a3020", fontStyle: "italic", marginTop: 18 }) },
    ] },
  { id: "dom1", da: 27.2, a: 32.9, tipo: "maschera", box: centro(260), righe: [{ testo: "A cosa stai tornando —", stile: serif(72, { color: "#eef2f8", fontStyle: "italic" }) }] },
  { id: "dom2", da: 28.7, a: 32.9, tipo: "maschera", box: centro(356), righe: [{ testo: "e cosa resterà di te quando ci arrivi?", stile: serif(72, { color: "#eef2f8", fontStyle: "italic" }) }] },
  { id: "mappa", da: 33.6, a: 36.1, tipo: "dissolvi", box: centro(190), righe: [{ testo: "Sette tappe fino a casa.", stile: serif(64, { color: "#e8eef6" }) }] },
  { id: "cinque", da: 49.3, a: 52.4, tipo: "maschera", sfalsa: 0.18, box: centro(420),
    righe: [{ testo: "Cinque modi di stare", stile: serif(78, { color: "#eef2f8" }) }, { testo: "in un mondo che muore.", stile: serif(78, { color: "#eef2f8", fontStyle: "italic" }) }] },
  { id: "guado1", da: 61.8, a: 67.5, tipo: "maschera", box: centro(214), righe: [{ testo: "E al guado, ad aspettarti,", stile: serif(76, { color: "#f6e6e2" }) }] },
  { id: "guado2", da: 63.7, a: 67.5, tipo: "maschera", box: centro(318), righe: [{ testo: "tuo fratello.", stile: serif(76, { color: "#ff8f8f", fontStyle: "italic" }) }] },
  ...REGOLE.map((r, i): Cue => ({
    id: "regola" + i, da: 67.8 + i * REGOLA_DUR + 0.06, a: 67.8 + (i + 1) * REGOLA_DUR - 0.04, entra: 0.35, esce: 0.12, tipo: "maschera",
    box: { left: 150, top: 390, width: 980 },
    righe: [
      { testo: `0${i + 1} — 05`, stile: mono(20, { color: r.a, marginBottom: 26 }) },
      { testo: r.testo, stile: display(76, { color: "#f2f4f8", whiteSpace: "pre-line" }) },
    ],
  })),
  { id: "numeritag", da: 78.9, a: 81.7, tipo: "dissolvi", box: centro(760),
    righe: [{ testo: "Un'avventura testuale in italiano, scritta e giocata col motore vero.", stile: serif(34, { color: "#b9c4d4", fontStyle: "italic" }) }] },
];

const STATS = [{ n: 7, l: "tappe" }, { n: 39, l: "luoghi" }, { n: 13, l: "personaggi" }, { n: 6, l: "finali" }];

const CINQUE = [
  { nome: "Saverio", luogo: "il pozzo", verbo: "custodire", a: "#e6a85a",
    d: ["M28 72 H92 V102 H28 Z", "M34 72 V38", "M86 72 V38", "M24 38 H96", "M60 38 V60", "M51 60 H69 L66 74 H54 Z"] },
  { nome: "Iole", luogo: "la diga", verbo: "aspettare", a: "#a9dbe4",
    d: ["M60 104 V36", "M46 104 H74", "M60 46 L96 30", "M60 62 H38 V72", "M38 82 V86", "M38 94 V96"] },
  { nome: "Vito", luogo: "il casello", verbo: "predare", a: "#f2ad45",
    d: ["M28 104 V44", "M18 104 H40", "M28 54 L104 40", "M48 51 L54 50", "M66 48 L72 47", "M84 44 L90 43"] },
  { nome: "Rosaria", luogo: "l'osteria", verbo: "restare", a: "#ec7d54",
    d: ["M42 36 L50 100 H70 L78 36 Z", "M45 60 H75", "M32 104 H88"] },
  { nome: "Onofrio", luogo: "la grotta", verbo: "rinunciare", a: "#9aa6e0",
    d: ["M26 94 L64 56", "M64 56 L84 42 L76 62 Z", "M58 102 Q70 76 96 70", "M36 104 Q42 98 48 104", "M86 96 Q92 90 98 96"] },
];

// --------------------------------------------------------------------
//  Grana: rumore generato una volta e fatto scorrere
// --------------------------------------------------------------------
function faiGrana(): string {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const img = g.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c.toDataURL("image/png");
}

// ====================================================================
const Trailer = ({ startAtEnd = false, onLaunch }: { startAtEnd?: boolean; onLaunch: (carica?: Salvataggio | null) => void }) => {
  const palcoRef = useRef<HTMLDivElement>(null);
  const telaRef = useRef<HTMLCanvasElement>(null);
  const graneRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<Record<string, HTMLDivElement | null>>({});
  const extraRef = useRef<Record<string, HTMLElement | null>>({});
  const tRef = useRef(startAtEnd ? DURATA : 0);
  const pausaRef = useRef(false);
  const cache = useRef<Cache>({});
  const suono = useRef<ColonnaSonora | null>(null);
  const buffer = useRef<HTMLCanvasElement | null>(null);

  const [scala, setScala] = useState(1);
  const [pronto, setPronto] = useState(false);
  const [finito, setFinito] = useState(startAtEnd);
  const [audio, setAudio] = useState(false);
  const [taccuino, setTaccuino] = useState(false);
  const [ultimo, setUltimo] = useState<Salvataggio | null>(null);
  const [guida, setGuida] = useState(false);
  const grana = useMemo(faiGrana, []);
  const ridotto = useMemo(() => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false, []);

  // palco 16:9 → scala della superficie di progetto + risoluzione del canvas
  useLayoutEffect(() => {
    const el = palcoRef.current, tela = telaRef.current;
    if (!el || !tela) return;
    const adatta = () => {
      const s = el.clientWidth / W;
      setScala(s);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const bw = Math.max(320, Math.min(Math.round(el.clientWidth * dpr), 2560));
      const bh = Math.round(bw * H / W);
      if (tela.width !== bw) { tela.width = bw; tela.height = bh; }
      if (!buffer.current) buffer.current = document.createElement("canvas");
      if (buffer.current.width !== bw) { buffer.current.width = bw; buffer.current.height = bh; }
    };
    const ro = new ResizeObserver(adatta);
    ro.observe(el);
    adatta();
    return () => ro.disconnect();
  }, []);

  // font (servono al canvas) + tele precalcolate, poi si parte
  useEffect(() => {
    let vivo = true;
    const famiglie = [`500 24px ${FONT.serif}`, `italic 500 24px ${FONT.serif}`, `700 24px ${FONT.display}`, `600 24px ${FONT.display}`, `500 24px ${FONT.mono}`, `600 24px ${FONT.mono}`];
    const attesa = Promise.all(famiglie.map((f) => document.fonts?.load(f).catch(() => null)));
    Promise.race([attesa, new Promise((r) => setTimeout(r, 2500))]).then(() => {
      if (!vivo) return;
      precarica(cache.current);
      setPronto(true);
    });
    return () => { vivo = false; };
  }, []);

  // la colonna si crea subito, così il brano si precarica prima del tasto audio
  useEffect(() => {
    suono.current = new ColonnaSonora(branoIntro);
    // Sul desktop l'audio parte da solo (Electron permette l'autoplay): il
    // trailer è il primo schermo del gioco, non una pagina web.
    if (inDesktop()) { suono.current.attiva(); setAudio(true); }
    return () => { suono.current?.chiudi(); suono.current = null; };
  }, []);

  // solo in sviluppo: posizionare il tempo per controllare le inquadrature
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as { __trailer?: object };
    w.__trailer = {
      vai: (t: number) => { tRef.current = t; pausaRef.current = true; setFinito(t >= DURATA); },
      riprendi: () => { pausaRef.current = false; },
      t: () => tRef.current,
      brano: () => suono.current?.diagnosi(),
    };
    return () => { delete w.__trailer; };
  }, []);

  // ── il fotogramma ──────────────────────────────────────────────────
  const disegna = useCallback((t: number) => {
    const tela = telaRef.current, buf = buffer.current;
    if (!tela || !buf) return;
    const ctx = tela.getContext("2d")!;
    const k = tela.width / W;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, tela.width, tela.height);
    const bctx = buf.getContext("2d")!;
    for (const s of SCENE) {
      const p = presenza(s, t);
      if (p <= 0) continue;
      if (p >= 1) {
        ctx.save(); ctx.setTransform(k, 0, 0, k, 0, 0);
        disegnaScena(ctx, s.id, t, cache.current);
        ctx.restore();
      } else {
        // dissolvenza: la scena si compone a parte e si posa con la sua opacità
        bctx.setTransform(1, 0, 0, 1, 0, 0);
        bctx.clearRect(0, 0, buf.width, buf.height);
        bctx.save(); bctx.setTransform(k, 0, 0, k, 0, 0);
        disegnaScena(bctx, s.id, t, cache.current);
        bctx.restore();
        ctx.save(); ctx.globalAlpha = p; ctx.drawImage(buf, 0, 0); ctx.restore();
      }
    }

    // testi
    for (const c of CUES) {
      const el = cueRef.current[c.id];
      if (!el) continue;
      const v = inviluppo(t, c.da, c.a, c.entra ?? 0.7, c.esce ?? 0.5);
      if (v <= 0) { if (el.style.visibility !== "hidden") el.style.visibility = "hidden"; continue; }
      el.style.visibility = "visible";
      const uscita = easeIn(seg(t, c.a - (c.esce ?? 0.5), c.a));
      el.style.opacity = String(c.tipo === "maschera" ? 1 - uscita : v);
      el.style.filter = uscita > 0 ? `blur(${uscita * 6}px)` : "none";
      el.style.transform = uscita > 0 ? `translateY(${-uscita * 14}px)` : "none";
      el.querySelectorAll<HTMLElement>("[data-riga]").forEach((r, i) => {
        const t0 = c.da + i * (c.sfalsa ?? 0.12);
        const e = expoOut(seg(t, t0, t0 + (c.entra ?? 0.9)));
        if (c.tipo === "maschera") r.style.transform = `translateY(${(1 - e) * 105}%)`;
        else if (c.tipo === "timbro") { r.style.transform = `scale(${1 + (1 - e) * 0.18})`; r.style.opacity = String(e); }
        else { r.style.transform = `translateY(${(1 - e) * 18}px)`; r.style.filter = e < 1 ? `blur(${(1 - e) * 8}px)` : "none"; }
      });
    }

    // A · la didascalia battuta a macchina
    const dida = extraRef.current.dida, testo = extraRef.current.didaTesto;
    if (dida && testo) {
      const frase = "Le lettere hanno smesso di arrivare.";
      dida.style.opacity = String(inviluppo(t, 4.9, 9.2, 0.2, 0.6));
      const n = Math.floor(clamp(seg(t, 5.0, 6.6)) * frase.length);
      if (testo.textContent !== frase.slice(0, n)) testo.textContent = frase.slice(0, n);
    }

    // E · il contatore delle tappe
    const cont = extraRef.current.tappe;
    if (cont) {
      cont.style.opacity = String(inviluppo(t, TAPPE_T0 - 0.2, 48.7, 0.5, 0.5));
      const n = tappaCorrente(t);
      const txt = t > TAPPE_T0 + 7 * TAPPE_PASSO ? "casa" : `tappa 0${Math.max(1, n)} · 07`;
      if (cont.textContent !== txt) cont.textContent = txt;
    }

    // F · le cinque colonne: salgono, poi i segni si disegnano
    CINQUE.forEach((_, i) => {
      const col = extraRef.current["col" + i];
      if (!col) return;
      const t0 = CINQUE_T0 + i * CINQUE_PASSO;
      const e = expoOut(seg(t, t0, t0 + 0.9));
      col.style.opacity = String(e * (1 - easeIn(seg(t, 58.9, 59.5))));
      col.style.transform = `translateY(${(1 - e) * 60}px)`;
      const tratto = easeOut(seg(t, t0 + 0.1, t0 + 1.3));
      col.querySelectorAll<SVGPathElement>("path").forEach((p) => { p.style.strokeDashoffset = String(1 - tratto); });
    });

    // I · i numeri che contano
    const num = extraRef.current.numeri;
    if (num) {
      num.style.opacity = String(inviluppo(t, 77.2, 81.7, 0.5, 0.6));
      const e = easeOut(seg(t, 77.5, 79.0));
      STATS.forEach((s, i) => {
        const el = extraRef.current["n" + i];
        const txt = String(Math.round(s.n * e));
        if (el && el.textContent !== txt) el.textContent = txt;
      });
    }

    // J · il titolo: il tracking si stringe, la luce ci passa sopra
    const tit = extraRef.current.titolo, sub = extraRef.current.sottotitolo;
    if (tit && sub) {
      const e = expoOut(seg(t, 82.3, 84.6));
      tit.style.opacity = String(clamp(seg(t, 82.3, 83.2)));
      tit.style.letterSpacing = `${0.5 - e * 0.36}em`;
      tit.style.filter = e < 1 ? `blur(${(1 - e) * 14}px)` : "none";
      tit.style.backgroundPosition = `${100 - seg(t, 83.4, 85.8) * 100}% 0`;
      sub.style.opacity = String(clamp(seg(t, 84.3, 85.4)));
    }

    // letterbox: si apre sul titolo
    const apre = easeOut(seg(t, 81.8, 84.2));
    const bs = extraRef.current.bandaSu, bg = extraRef.current.bandaGiu;
    if (bs && bg) {
      const h = BANDA * (1 - apre) * clamp(seg(t, 0, 0.9) + (startAtEnd ? 1 : 0));
      bs.style.height = h + "px"; bg.style.height = h + "px";
    }
    const ctr = extraRef.current.controlli;
    if (ctr) ctr.style.opacity = String(1 - apre);
    const barra = extraRef.current.barra;
    if (barra) barra.style.transform = `scaleX(${clamp(t / DURATA)})`;

    // la grana della pellicola si muove a ogni fotogramma
    const gr = graneRef.current;
    if (gr) gr.style.backgroundPosition = `${Math.floor(Math.random() * 256)}px ${Math.floor(Math.random() * 256)}px`;
  }, [startAtEnd]);

  // ── l'orologio ────────────────────────────────────────────────────
  useEffect(() => {
    if (!pronto) return;
    if (ridotto) { tRef.current = DURATA; setFinito(true); disegna(DURATA); return; }
    let raf = 0, prec = performance.now(), finePrec = startAtEnd;
    const passo = (ora: number) => {
      const dt = Math.min(0.1, (ora - prec) / 1000);
      prec = ora;
      const fermo = pausaRef.current || document.hidden;
      if (!fermo) {
        // con il brano in riproduzione è lui l'orologio: la pellicola lo insegue.
        // Uno scarto grande vuol dire un salto appena comandato (rivedi, salta):
        // allora vale il tempo della pellicola e aggiorna() riposiziona il brano.
        const tm = suono.current?.orologio();
        tRef.current = tm != null && Math.abs(tm - tRef.current) < 0.5 ? tm : tRef.current + dt;
      }
      const t = tRef.current;
      disegna(t);
      suono.current?.aggiorna(t, fermo);
      if (!finePrec && t >= DURATA) { finePrec = true; setFinito(true); }
      if (finePrec && t < DURATA) finePrec = false;
      raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [pronto, disegna, ridotto, startAtEnd]);

  // ── comandi ───────────────────────────────────────────────────────
  const salta = useCallback(() => {
    tRef.current = Math.max(tRef.current, DURATA);
    pausaRef.current = false;
    setFinito(true);
  }, []);
  const rivedi = () => { tRef.current = 0; pausaRef.current = false; setFinito(false); };
  const commutaAudio = useCallback(() => {
    if (!suono.current) suono.current = new ColonnaSonora();
    if (suono.current.attivo) { suono.current.spegni(); setAudio(false); }
    else { suono.current.attiva(); setAudio(true); }
  }, []);

  // Durante il trailer un solo tasto: Esc lo salta. Nel browser, il primo gesto
  // (tasto o clic) accende anche la musica: i browser non la lasciano partire da sola.
  useEffect(() => {
    const tasto = (e: KeyboardEvent) => {
      if (taccuino) return;   // il taccuino gestisce Esc da sé
      if (e.key === "Escape" && guida) { setGuida(false); return; }
      if (e.key === "Escape" && !finito) { e.preventDefault(); salta(); }
    };
    window.addEventListener("keydown", tasto);
    return () => window.removeEventListener("keydown", tasto);
  }, [finito, salta, guida, taccuino]);

  useEffect(() => {
    if (inDesktop()) return;
    const accendi = () => {
      if (suono.current && !suono.current.attivo) { suono.current.attiva(); setAudio(true); }
      window.removeEventListener("keydown", accendi); window.removeEventListener("pointerdown", accendi);
    };
    window.addEventListener("keydown", accendi); window.addEventListener("pointerdown", accendi);
    return () => { window.removeEventListener("keydown", accendi); window.removeEventListener("pointerdown", accendi); };
  }, []);

  // il salvataggio più recente, per «continua»
  useEffect(() => { if (finito) piuRecente().then(setUltimo).catch(() => setUltimo(null)); }, [finito, taccuino]);

  const reg = (id: string) => (el: HTMLElement | null) => { extraRef.current[id] = el; };
  // palco molto piccolo (telefono in verticale): i comandi escono dal palco, a misura d'uomo
  const compatto = scala < 0.5;
  const bottoneCompatto: React.CSSProperties = {
    cursor: "pointer", border: "1px solid rgba(255,255,255,.2)", background: "rgba(255,255,255,.04)",
    color: "#c9d2de", fontFamily: FONT.mono, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", padding: "10px 16px", borderRadius: 999,
  };
  const pulsantePrincipale: React.CSSProperties = {
    cursor: "pointer", border: "none", display: "inline-flex", alignItems: "center", gap: 18, borderRadius: 999,
    padding: "24px 60px", ...display(28, { fontWeight: 700, letterSpacing: "0.01em" }), color: "#140c06", background: "#f0b77e",
    ["--gl" as string]: "rgba(240,183,126,.55)", animation: "kf-pulse 1.9s ease-in-out infinite",
  } as React.CSSProperties;
  const bottone: React.CSSProperties = {
    cursor: "pointer", border: "1px solid rgba(255,255,255,.18)", background: "rgba(255,255,255,.03)",
    color: "#c9d2de", ...mono(15, { letterSpacing: "0.22em" }), padding: "11px 20px", borderRadius: 999,
  };

  return (
    <div style={{ position: "relative", height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#000", overflow: "hidden" }}>
      <div ref={palcoRef} style={{ position: "relative", overflow: "hidden", width: "min(100vw, calc(100dvh * 16 / 9))", height: "min(100dvh, calc(100vw * 9 / 16))", background: "#000" }}>
        <canvas ref={telaRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />

        {/* superficie di progetto 1920×1080 per testi e controlli */}
        <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transform: `scale(${scala})`, transformOrigin: "0 0", pointerEvents: "none" }}>
          {/* la pellicola: vignetta e grana */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 95% at 50% 48%, transparent 55%, rgba(0,0,0,.55) 100%)" }} />
          <div ref={graneRef} style={{ position: "absolute", inset: 0, backgroundImage: `url(${grana})`, opacity: 0.075, mixBlendMode: "overlay" }} />

          {/* testi */}
          {CUES.map((c) => (
            <div key={c.id} ref={(el) => { cueRef.current[c.id] = el; }} style={{ position: "absolute", visibility: "hidden", ...c.box }}>
              {c.righe.map((r, i) => (
                <div key={i} style={{ overflow: c.tipo === "maschera" ? "hidden" : "visible", paddingBottom: c.tipo === "maschera" ? "0.14em" : 0 }}>
                  <div data-riga style={{ ...r.stile, willChange: "transform" }}>{r.testo}</div>
                </div>
              ))}
            </div>
          ))}

          {/* A · didascalia a macchina */}
          <div ref={reg("dida")} style={{ position: "absolute", left: 0, right: 0, top: 860, textAlign: "center", opacity: 0, ...mono(26, { letterSpacing: "0.04em", textTransform: "none", color: "#d7c6ae" }) }}>
            <span style={{ color: "#f0a867", marginRight: 16 }}>&gt;</span>
            <span ref={reg("didaTesto")} />
            <span style={{ display: "inline-block", width: 14, height: 30, marginLeft: 6, verticalAlign: -5, background: "#f0a867", animation: "kf-caret 1s step-end infinite" }} />
          </div>

          {/* E · contatore delle tappe */}
          <div ref={reg("tappe")} style={{ position: "absolute", left: 150, top: BANDA + 44, opacity: 0, ...mono(18, { color: "rgba(214,224,238,.6)" }) }} />

          {/* F · cinque colonne */}
          <div style={{ position: "absolute", left: 0, right: 0, top: 318, display: "flex", justifyContent: "center", gap: 26 }}>
            {CINQUE.map((c, i) => (
              <div key={c.nome} ref={reg("col" + i)} style={{ width: 300, textAlign: "center", opacity: 0, borderLeft: i ? "1px solid rgba(255,255,255,.07)" : "none" }}>
                <svg viewBox="0 0 120 120" width={150} height={150} style={{ display: "block", margin: "0 auto", overflow: "visible", filter: `drop-shadow(0 0 12px ${c.a}55)` }}>
                  {c.d.map((d, j) => <path key={j} d={d} pathLength={1} fill="none" stroke={c.a} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 1, strokeDashoffset: 1 }} />)}
                </svg>
                <div style={mono(17, { color: c.a, marginTop: 34 })}>{c.nome}</div>
                <div style={serif(62, { color: "#f1f3f7", fontStyle: "italic", marginTop: 16 })}>{c.verbo}</div>
                <div style={serif(26, { color: "rgba(214,224,238,.55)", marginTop: 14 })}>{c.luogo}</div>
              </div>
            ))}
          </div>

          {/* I · i numeri */}
          <div ref={reg("numeri")} style={{ position: "absolute", left: 0, right: 0, top: 360, display: "flex", justifyContent: "center", opacity: 0 }}>
            {STATS.map((s, i) => (
              <div key={s.l} style={{ width: 330, textAlign: "center", borderLeft: i ? "1px solid rgba(255,255,255,.1)" : "none" }}>
                <div ref={reg("n" + i)} style={display(170, { fontWeight: 700, color: "#f4f1ea", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.04em" })}>0</div>
                <div style={mono(20, { color: "rgba(214,224,238,.6)", marginTop: 18 })}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* J · il titolo */}
          <div style={{ position: "absolute", left: 0, right: 0, top: finito ? 176 : 262, textAlign: "center", transition: "top 1.1s cubic-bezier(.2,.7,.2,1)" }}>
            <h1 ref={reg("titolo")} style={{
              // nowrap: all'inizio la spaziatura (0.5em) supera la larghezza del quadro;
              // senza, il titolo andrebbe a capo e tornerebbe su una riga (il «glitch»)
              margin: 0, ...display(156, { fontWeight: 800, letterSpacing: "0.14em" }), opacity: 0, whiteSpace: "nowrap",
              backgroundImage: "linear-gradient(100deg, #f4ece0 0%, #f4ece0 42%, #fffaf0 50%, #f4ece0 58%, #f4ece0 100%)",
              backgroundSize: "300% 100%", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
              textShadow: "0 0 60px rgba(255,190,130,.18)", paddingLeft: "0.14em",
            }}>IL VIAGGIATORE</h1>
            <div ref={reg("sottotitolo")} style={mono(22, { color: "#ffd2a4", letterSpacing: "0.5em", marginTop: 26, opacity: 0, textShadow: "0 1px 18px rgba(0,0,0,.8)" })}>un esperimento in favella 1</div>
          </div>

          {/* letterbox */}
          <div ref={reg("bandaSu")} style={{ position: "absolute", left: 0, right: 0, top: 0, height: BANDA, background: "#000" }} />
          <div ref={reg("bandaGiu")} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: BANDA, background: "#000" }} />
          {/* schermata d'avvio */}
          {finito && !compatto && (
            <section style={{ position: "absolute", left: 0, right: 0, top: 470, textAlign: "center", pointerEvents: "auto", animation: "kf-launch 1.2s ease .3s both" }}>
              <div style={{ position: "absolute", left: "50%", top: -140, width: 1500, height: 720, transform: "translateX(-50%)", background: "radial-gradient(50% 50% at 50% 50%, rgba(6,5,10,.78) 0%, rgba(6,5,10,.5) 50%, rgba(6,5,10,0) 100%)", pointerEvents: "none", zIndex: -1 }} />
              <p style={{ margin: 0, ...serif(40, { color: "#f4ece0" }) }}>Si parte a piedi.</p>
              <p style={{ margin: "22px auto 0", maxWidth: 820, ...serif(27, { color: "rgba(230,222,208,.72)", lineHeight: 1.5 }) }}>
                Da qui in poi scrivi tu i comandi, in italiano. Bevi quando hai sete, parla con chi incontri, decidi cosa portare fino a casa.
              </p>
              <div style={{ marginTop: 46, display: "flex", justifyContent: "center", alignItems: "center", gap: 22 }}>
                {ultimo && (
                  <button onClick={() => onLaunch(ultimo)} style={{ ...pulsantePrincipale, flexDirection: "column", gap: 4, padding: "16px 54px" } as React.CSSProperties}>
                    <span>Continua il viaggio →</span>
                    <span style={serif(19, { color: "rgba(20,12,6,.72)", fontWeight: 500 })}>{ultimo.riassunto.luogo} · turno {ultimo.riassunto.turno}</span>
                  </button>
                )}
                <button onClick={() => onLaunch(null)} style={ultimo ? { ...bottone, ...display(24, { fontWeight: 600, letterSpacing: "0.01em" }), textTransform: "none", padding: "22px 40px", color: "#f4ece0", borderColor: "rgba(240,183,126,.45)" } : pulsantePrincipale}>
                  {ultimo ? "Nuovo viaggio" : <>Inizia il viaggio <span>→</span></>}
                </button>
              </div>
              <div style={{ marginTop: 30, display: "flex", justifyContent: "center", gap: 18 }}>
                <button onClick={() => setGuida(true)} style={{ ...bottone, color: "#f0b77e", borderColor: "rgba(240,183,126,.5)" }}>? come si gioca</button>
                <button onClick={() => setTaccuino(true)} style={bottone}>carica</button>
                <button onClick={rivedi} style={bottone}>↺ rivedi il trailer</button>
                <button onClick={commutaAudio} style={bottone} aria-pressed={audio}>{audio ? "♪ audio sì" : "♪ audio no"}</button>
                {inDesktop() && <button onClick={esciDalGioco} style={bottone}>✕ esci</button>}
              </div>
            </section>
          )}
          {finito && !compatto && (
            <div style={{ position: "absolute", right: 60, bottom: 46, ...mono(14, { color: "rgba(214,224,238,.34)", letterSpacing: "0.14em", textTransform: "none" }) }}>
              v{etichettaVersione(true)}
            </div>
          )}
          {guida && !compatto && <ComeSiGioca base={19} onChiudi={() => setGuida(false)} />}
          {taccuino && !compatto && (
            <Taccuino base={19} modo="carica" puoSalvare={false} onCarica={(d) => { setTaccuino(false); onLaunch(d); }} onChiudi={() => setTaccuino(false)} />
          )}
        </div>
      </div>
      {guida && compatto && <ComeSiGioca base={14} compatto onChiudi={() => setGuida(false)} />}

      {/* telefono in verticale: comandi e avvio fuori dal palco, a dimensione normale */}
      {compatto && pronto && (
        <div style={{ position: "absolute", left: 16, right: 16, bottom: "max(24px, env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
          {finito ? (
            <>
              <p style={{ margin: 0, fontFamily: FONT.serif, fontSize: 17, lineHeight: 1.45, color: "rgba(230,222,208,.8)", maxWidth: 340 }}>
                Si parte a piedi. Da qui in poi scrivi tu i comandi, in italiano. Il gioco rende meglio in orizzontale.
              </p>
              <button onClick={() => onLaunch(ultimo)} style={{ cursor: "pointer", border: "none", borderRadius: 999, padding: "14px 30px", fontFamily: FONT.display, fontWeight: 700, fontSize: 17, color: "#140c06", background: "#f0b77e", ["--gl" as string]: "rgba(240,183,126,.55)", animation: "kf-pulse 1.9s ease-in-out infinite" } as React.CSSProperties}>{ultimo ? "Continua il viaggio →" : "Inizia il viaggio →"}</button>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setGuida(true)} style={{ ...bottoneCompatto, color: "#f0b77e" }}>? come si gioca</button>
                <button onClick={rivedi} style={bottoneCompatto}>↺ rivedi</button>
                <button onClick={commutaAudio} style={bottoneCompatto} aria-pressed={audio}>{audio ? "♪ sì" : "♪ no"}</button>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default Trailer;
