// ====================================================================
//  Il panorama del gioco: una striscia di paesaggio viva in cima allo
//  schermo, stesso linguaggio del trailer. Ogni zona ha cielo, luce e
//  segni propri; quando il giocatore cambia luogo il viandante cammina e il
//  paesaggio scorre, poi si ferma e respira. Dentro una stanza, una grotta, una
//  galleria (vedi INTERNI) la scena cambia: stessa tavolozza, ma niente
//  orizzonte, e la luce di una finestra, di una lampada, di un cunicolo.
// ====================================================================
import { useEffect, useLayoutEffect, useRef } from "react";
import { crinale, rng, mix, rgba, clamp } from "../trailer/tempo";
import { disegnaViandante } from "../trailer/viandante";
import type { ZoneKey } from "../data/viaggiatore";

export type Clima = ZoneKey | "vinta" | "persa";

const PW = 1280, PH = 200;
const ORIZ = 132;

interface Tavolozza {
  cielo: [number, string][];
  sole?: { x: number; y: number; r: number; col: string; alone: string; forza: number };
  strati: [string, number, number, number][];     // colore, base, ampiezza, scala
  suolo: string;
  figura: string;
  bordo: string;
  polvere: string;
  segni: (ctx: CanvasRenderingContext2D, off: number, t: number) => void;
}

// --- segni del paesaggio, zona per zona ------------------------------
const casette = (ctx: CanvasRenderingContext2D, x0: number, x1: number, base: number, seme: number, col: string, finestre?: string, t = 0) => {
  const r = rng(seme);
  let x = x0;
  while (x < x1) {
    const w = 22 + r() * 30, h = 16 + r() * 26;
    ctx.fillStyle = col;
    ctx.fillRect(x, base - h, w, h + 4);
    ctx.beginPath(); ctx.moveTo(x - 2, base - h); ctx.lineTo(x + w / 2, base - h - 9 - r() * 5); ctx.lineTo(x + w + 2, base - h); ctx.fill();
    if (finestre && r() < 0.7) {
      const acc = 0.55 + 0.45 * Math.sin(t * (0.8 + r()) + x);
      ctx.fillStyle = rgba(finestre, 0.55 + 0.35 * acc);
      ctx.fillRect(x + w * 0.3, base - h * 0.6, 3.5, 4.5);
    } else r();
    x += w + r() * 10;
  }
};

const TAV: Record<Clima, Tavolozza> = {
  z0: {
    cielo: [[0, "#05070d"], [0.7, "#101626"], [1, "#1b2236"]], strati: [["#0c101c", 0, 14, 260], ["#080b14", 22, 10, 180]],
    suolo: "#05070c", figura: "#020306", bordo: "#6f86a8", polvere: "#9fb4c9", segni: () => {},
  },
  z1: {
    cielo: [[0, "#0b1a22"], [0.55, "#274650"], [0.9, "#9cc7b8"], [1, "#d8e3c8"]],
    sole: { x: 1030, y: 120, r: 16, col: "#fff4dc", alone: "#bfe6d6", forza: 0.45 },
    strati: [["#1d3a3e", 0, 12, 300], ["#132a2e", 18, 9, 200]], suolo: "#0b1719", figura: "#050b0c", bordo: "#d8f0e2", polvere: "#d8f0e2",
    segni: (ctx, off) => {
      const x = 760 - off * 0.4;
      casette(ctx, x - 260, x + 120, ORIZ + 2, 11, "#0f2124");
      ctx.fillStyle = "#0f2124";
      ctx.fillRect(x + 160, ORIZ - 30, 150, 5); ctx.fillRect(x + 168, ORIZ - 30, 4, 32); ctx.fillRect(x + 296, ORIZ - 30, 4, 32);  // pensilina
      ctx.fillRect(x + 360, ORIZ - 62, 5, 64); ctx.beginPath(); ctx.ellipse(x + 362, ORIZ - 70, 18, 12, 0, 0, Math.PI * 2); ctx.fill(); // serbatoio
    },
  },
  z2: {
    cielo: [[0, "#6f5a3e"], [0.5, "#c89a62"], [0.85, "#f1d3a0"], [1, "#fbe9c6"]],
    sole: { x: 640, y: 18, r: 22, col: "#fffaf0", alone: "#fff0cc", forza: 0.8 },
    strati: [["#9a7650", 0, 6, 400], ["#7c5c3c", 20, 5, 260]], suolo: "#5a4029", figura: "#1c120a", bordo: "#fff0cc", polvere: "#f3dcb4",
    segni: (ctx, off) => {
      const x = 820 - off * 0.45;
      ctx.fillStyle = "#6a4d33"; ctx.fillRect(x, ORIZ - 26, 110, 28);                     // masseria
      ctx.strokeStyle = "rgba(90,66,44,.9)"; ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(x - 160 + i * 22, ORIZ, 18, Math.PI, 0); ctx.stroke(); } // serra
      ctx.fillStyle = "#6a4d33"; ctx.fillRect(x + 160, ORIZ - 10, 26, 12); ctx.fillRect(x + 158, ORIZ - 26, 3, 16); ctx.fillRect(x + 185, ORIZ - 26, 3, 16); ctx.fillRect(x + 156, ORIZ - 28, 34, 3);
    },
  },
  z3: {
    cielo: [[0, "#3a4a60"], [0.55, "#93a6b8"], [0.9, "#e3eae8"], [1, "#f6f8f4"]],
    sole: { x: 300, y: 50, r: 18, col: "#ffffff", alone: "#eef6f6", forza: 0.6 },
    strati: [["#8f9aa6", 0, 5, 500], ["#c9d1d0", 16, 3, 400]], suolo: "#cdd4d1", figura: "#20242c", bordo: "#ffffff", polvere: "#ffffff",
    segni: (ctx, off) => {
      const x = 900 - off * 0.35;
      ctx.fillStyle = "#6c7584";
      ctx.beginPath(); ctx.moveTo(x, ORIZ + 4); ctx.lineTo(x + 20, ORIZ - 54); ctx.lineTo(x + 420, ORIZ - 62); ctx.lineTo(x + 420, ORIZ + 4); ctx.fill();
      ctx.fillRect(x - 90, ORIZ - 34, 9, 36); ctx.fillRect(x - 96, ORIZ - 38, 21, 5);
    },
  },
  z4: {
    cielo: [[0, "#1a1a2a"], [0.5, "#5a4454"], [0.85, "#e09a58"], [1, "#f6c27e"]],
    sole: { x: 1120, y: 124, r: 20, col: "#ffe2b0", alone: "#ffa45c", forza: 0.6 },
    strati: [["#3a2a34", 0, 8, 300], ["#241b24", 20, 6, 220]], suolo: "#150f14", figura: "#07050a", bordo: "#ffc58a", polvere: "#ffd0a0",
    segni: (ctx, off) => {
      const x = 700 - off * 0.5;
      ctx.fillStyle = "#1e161d";
      ctx.fillRect(x, ORIZ - 40, 180, 7); ctx.fillRect(x + 10, ORIZ - 34, 5, 36); ctx.fillRect(x + 165, ORIZ - 34, 5, 36); // casello
      ctx.fillRect(x + 70, ORIZ - 22, 40, 24);
      ctx.fillRect(x + 200, ORIZ - 6, 120, 3);                                                                         // sbarra
      for (let i = -3; i < 6; i++) { const px = ((i * 260 - off * 0.8) % 2080 + 2080) % 2080 - 200; ctx.fillRect(px, ORIZ - 58, 3, 60); ctx.fillRect(px - 14, ORIZ - 54, 30, 2); }
    },
  },
  z5: {
    cielo: [[0, "#1c1020"], [0.5, "#5a2c2c"], [0.85, "#d6784a"], [1, "#f0a468"]],
    sole: { x: 180, y: 128, r: 18, col: "#ffd6a0", alone: "#ff9a5c", forza: 0.55 },
    strati: [["#3a1e22", 0, 16, 240], ["#26151a", 22, 10, 200]], suolo: "#140a0d", figura: "#070305", bordo: "#ffb58a", polvere: "#ffc8a0",
    segni: (ctx, off, t) => {
      const x = 560 - off * 0.4;
      casette(ctx, x, x + 520, ORIZ + 4, 51, "#2a141a", "#ffc070", t);
      ctx.fillStyle = "#2a141a"; ctx.fillRect(x + 240, ORIZ - 78, 16, 80); ctx.beginPath(); ctx.moveTo(x + 236, ORIZ - 78); ctx.lineTo(x + 248, ORIZ - 96); ctx.lineTo(x + 260, ORIZ - 78); ctx.fill();
      for (let i = 0; i < 6; i++) {                                                                                     // fumo dal camino
        const k = ((t * 0.25 + i / 6) % 1);
        ctx.fillStyle = `rgba(200,170,160,${0.18 * (1 - k)})`;
        ctx.beginPath(); ctx.arc(x + 120 + k * 30 + Math.sin(k * 6) * 6, ORIZ - 40 - k * 70, 5 + k * 12, 0, Math.PI * 2); ctx.fill();
      }
    },
  },
  z6: {
    cielo: [[0, "#0c0e22"], [0.55, "#2c3160"], [0.9, "#8a8fc8"], [1, "#c2c4e8"]],
    sole: { x: 1060, y: 40, r: 11, col: "#f4f4ff", alone: "#b8bff0", forza: 0.3 },
    strati: [["#262a4e", -30, 40, 220], ["#1a1d3a", -8, 30, 170], ["#121430", 14, 18, 140]], suolo: "#0c0d20", figura: "#04040c", bordo: "#c2c8ff", polvere: "#d8dcff",
    segni: (ctx, off) => {
      const x = 880 - off * 0.35;
      ctx.fillStyle = "#1e2146";
      ctx.fillRect(x, ORIZ - 50, 60, 42); ctx.fillStyle = "#2c3160"; ctx.fillRect(x + 22, ORIZ - 36, 14, 28);          // cappella senza tetto
      ctx.fillStyle = "#1e2146"; ctx.beginPath(); ctx.moveTo(x - 4, ORIZ - 50); ctx.lineTo(x + 18, ORIZ - 66); ctx.lineTo(x + 24, ORIZ - 50); ctx.fill();
      ctx.strokeStyle = "rgba(40,44,90,.9)"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x - 300, ORIZ + 10); for (let i = 0; i <= 20; i++) ctx.lineTo(x - 300 + i * 14, ORIZ + 10 - (i % 2) * 3); ctx.stroke();
    },
  },
  z7: {
    cielo: [[0, "#12060c"], [0.45, "#4a1424"], [0.85, "#d4604a"], [1, "#f09a6a"]],
    sole: { x: 150, y: 132, r: 20, col: "#ffcaa0", alone: "#ff7a55", forza: 0.6 },
    strati: [["#2a0c16", 0, 8, 300], ["#1a0810", 18, 6, 200]], suolo: "#1e0c12", figura: "#070205", bordo: "#ff9d7a", polvere: "#ffb49a",
    segni: (ctx, off) => {
      const x = 240 - off * 0.3;
      casette(ctx, x, x + 460, ORIZ + 2, 61, "#1a0810");
      ctx.fillStyle = "#1a0810"; ctx.fillRect(x + 200, ORIZ - 70, 14, 72); ctx.beginPath(); ctx.moveTo(x + 196, ORIZ - 70); ctx.lineTo(x + 207, ORIZ - 88); ctx.lineTo(x + 218, ORIZ - 70); ctx.fill();
    },
  },
  vinta: {
    cielo: [[0, "#1a1420"], [0.5, "#6a5048"], [0.85, "#f0c070"], [1, "#fde2a8"]],
    sole: { x: 640, y: 128, r: 26, col: "#fff4d8", alone: "#ffd27a", forza: 0.75 },
    strati: [["#4a3430", 0, 10, 300], ["#2e211e", 18, 8, 200]], suolo: "#1a120e", figura: "#080504", bordo: "#ffe0a8", polvere: "#ffe8c0",
    segni: (ctx, off) => casette(ctx, 900 - off * 0.3, 1200 - off * 0.3, ORIZ + 2, 71, "#2e211e"),
  },
  persa: {
    cielo: [[0, "#0a0b0e"], [0.6, "#2a2d34"], [1, "#4a4d54"]],
    strati: [["#1c1e24", 0, 8, 300], ["#131519", 18, 6, 200]], suolo: "#0b0c0f", figura: "#040405", bordo: "#8a90a0", polvere: "#9aa0b0",
    segni: () => {},
  },
};

export default function Panorama({ clima, luogo, camminaDa }: { clima: Clima; luogo: string | null; camminaDa: number }) {
  const telaRef = useRef<HTMLCanvasElement>(null);
  const stato = useRef({ fase: 0, off: 0, passo: 0, ultimo: performance.now(), clima, luogo, prec: clima, precLuogo: luogo, mix: 1, camminaDa });
  stato.current.camminaDa = camminaDa;
  // il luogo effettivo di questo momento (in sviluppo si può forzare dalla console: window.__panorama.imposta)
  const prop = useRef({ clima, luogo });
  prop.current = { clima, luogo };
  const forzato = useRef<{ clima: Clima; luogo: string | null } | null>(null);

  useLayoutEffect(() => {
    const tela = telaRef.current;
    if (!tela) return;
    const ro = new ResizeObserver(() => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      tela.width = Math.round(tela.clientWidth * dpr);
      tela.height = Math.round(tela.clientHeight * dpr);
    });
    ro.observe(tela);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let raf = 0;
    const buf = document.createElement("canvas");
    const disegna = (ora: number) => {
      const s = stato.current, tela = telaRef.current;
      const dt = Math.min(0.1, (ora - s.ultimo) / 1000); s.ultimo = ora;
      // un cambio di clima o d'ambiente (all'aperto ↔ dentro una stanza) dissolve la scena vecchia nella nuova
      const { clima: c, luogo: l } = forzato.current ?? prop.current;
      if (c !== s.clima || ambienteDi(c, l) !== ambienteDi(s.clima, s.luogo)) {
        s.prec = s.clima; s.precLuogo = s.luogo; s.clima = c; s.luogo = l; s.mix = 0;
      } else s.luogo = l;
      if (tela && tela.width > 0) {
        const t = ora / 1000;
        // cammina per ~2.4 s dopo un cambio di luogo, poi si ferma con un passo morbido
        const dopo = t - s.camminaDa / 1000;
        const cammina = clamp(1 - (dopo - 2.0) / 0.5) * (dopo >= 0 ? 1 : 0);
        s.passo = cammina;
        s.fase += dt * 1.05 * cammina;
        s.off += dt * 60 * cammina;
        s.mix = Math.min(1, s.mix + dt / 1.2);
        const ctx = tela.getContext("2d")!;
        const k = tela.width / PW;
        if (s.mix < 1 && ambienteDi(s.prec, s.precLuogo) !== ambienteDi(s.clima, s.luogo)) {
          if (buf.width !== tela.width) { buf.width = tela.width; buf.height = tela.height; }
          const b = buf.getContext("2d")!;
          b.setTransform(k, 0, 0, k, 0, 0); scena(b, s.prec, s.precLuogo, s, t);
          ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(buf, 0, 0);
          ctx.globalAlpha = s.mix;
          b.setTransform(k, 0, 0, k, 0, 0); scena(b, s.clima, s.luogo, s, t);
          ctx.drawImage(buf, 0, 0); ctx.globalAlpha = 1;
        } else {
          ctx.setTransform(k, 0, 0, k, 0, 0);
          scena(ctx, s.clima, s.luogo, s, t);
        }
      }
    };
    const passo = (ora: number) => { disegna(ora); raf = requestAnimationFrame(passo); };
    raf = requestAnimationFrame(passo);

    // solo in sviluppo: forzare clima e luogo per guardare ogni scena, e misurare quanto costa un fotogramma
    // (la sincronia passa da WebGL: leggere i pixel dal canvas 2D farebbe passare Chrome al disegno su CPU e falserebbe la misura;
    //  con sincro=false si misura solo il tempo di registrazione dei comandi; con "fine" un solo controllo dopo n fotogrammi,
    //  utile quando lo schermo impone la sua cadenza e il controllo a ogni fotogramma misura sempre 16,6 ms)
    let via: (() => void) | null = null;
    if (import.meta.env.DEV) {
      const w = window as unknown as { __panorama?: object };
      w.__panorama = {
        imposta: (c: Clima | null, l: string | null = null) => { forzato.current = c ? { clima: c, luogo: l } : null; },
        prova: (n = 60, sincro: boolean | "fine" = true) => {
          const tela = telaRef.current;
          const gl = document.createElement("canvas").getContext("webgl");
          if (!tela || !gl) return null;
          const tex = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, tex);
          const px = new Uint8Array(4);
          const ms: number[] = [];
          let ora = performance.now();
          const inizio = ora;
          for (let i = 0; i < n; i++) {
            const a = performance.now();
            ora += 16; disegna(ora);
            if (sincro === true) { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tela); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); }
            ms.push(performance.now() - a);
          }
          if (sincro === "fine") {   // un solo controllo alla fine: il tempo medio per fotogramma non dipende dalla cadenza dello schermo
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tela); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
            const media = +((performance.now() - inizio) / n).toFixed(2);
            stato.current.ultimo = performance.now();
            return { media };
          }
          stato.current.ultimo = performance.now();
          ms.sort((x, y) => x - y);
          return { mediana: +ms[Math.floor(n / 2)].toFixed(2), p95: +ms[Math.floor(n * 0.95)].toFixed(2), max: +ms[n - 1].toFixed(2) };
        },
      };
      via = () => { delete w.__panorama; };
    }
    return () => { cancelAnimationFrame(raf); via?.(); };
  }, []);

  return <canvas ref={telaRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />;
}

// --- gli interni -------------------------------------------------------
// Dentro una stanza, una grotta o una galleria non c'è orizzonte: niente sole né colline. La tavolozza della
// zona si fa più scura e la luce entra da una finestra, da una lampada, dal fondo di un cunicolo; sotto i piedi
// scorre un pavimento. Il viandante resta quello di sempre.
interface Interno {
  tipo: "stanza" | "serra" | "grotta" | "galleria" | "torre";
  arredo?: "bar" | "casa" | "osteria" | "casotto";
  luce?: string;            // luce propria della stanza (lampada, fuoco); altrimenti quella del cielo della zona
  pozza?: boolean;          // acqua sul pavimento
}
const INTERNI = new Map<string, Interno>([
  ["bar", { tipo: "stanza", arredo: "bar", luce: "#ffc070" }],
  ["casa", { tipo: "stanza", arredo: "casa" }],
  ["osteria", { tipo: "stanza", arredo: "osteria", luce: "#ffb060" }],
  ["casotto", { tipo: "stanza", arredo: "casotto" }],
  ["serra", { tipo: "serra" }],
  ["grotta", { tipo: "grotta" }],
  ["condotta", { tipo: "galleria" }],
  ["sottopasso", { tipo: "galleria", pozza: true }],
  ["torre di presa", { tipo: "torre" }],
]);
// nelle schermate di fine (vinta, persa) il panorama torna all'aperto, ovunque sia finito il viaggio
const internoDi = (clima: Clima, luogo: string | null) => (luogo && clima !== "vinta" && clima !== "persa" ? INTERNI.get(luogo) : undefined);

/** Dentro una stanza il panorama cambia scena anche restando nella stessa zona: la chiave dice «dove» siamo. */
function ambienteDi(clima: Clima, luogo: string | null): string { return internoDi(clima, luogo) ? `${clima}|${luogo}` : clima; }

const VX = 610;                 // dove sta il viandante
const YF = ORIZ + 26;           // dove il muro tocca il pavimento
const NERO = "#05060a";
type Ctx = CanvasRenderingContext2D;
type Scorrere = { fase: number; off: number; passo: number };

const modulo = (x: number, m: number) => ((x % m) + m) % m;
const caso = (n: number) => modulo(Math.sin(n * 127.1 + 311.7) * 43758.5453, 1);
const ultimo = (p: Tavolozza) => p.cielo[p.cielo.length - 1][1];
const crinali = new Map<number, (x: number) => number>();
const crinaleDi = (seme: number) => { let f = crinali.get(seme); if (!f) { f = crinale(seme); crinali.set(seme, f); } return f; };

/** Chiama f per ogni elemento di una fila che scorre col passo; n è l'indice nel mondo (la forma non salta al giro). */
const scorri = (passo: number, par: number, f: (x: number, n: number) => void) => {
  const n0 = Math.floor(par / passo), d = par - n0 * passo;
  for (let k = -1; k * passo - d < PW; k++) f(k * passo - d, n0 + k);
};
/** Alone di luce che si somma al buio. */
const alone = (ctx: Ctx, x: number, y: number, r: number, col: string, a: number) => {
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.globalCompositeOperation = "source-over";
};
/** Fascio di luce da una finestra o da una feritoia: parte da y0 e cade sul pavimento. */
const fascio = (ctx: Ctx, x0: number, x1: number, y0: number, p0: number, p1: number, col: string, a: number) => {
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createLinearGradient(0, y0, 0, PH);
  g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, a * 0.3));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.lineTo(p1, PH); ctx.lineTo(p0, PH); ctx.closePath(); ctx.fill();
  ctx.globalCompositeOperation = "source-over";
};
const finestra = (ctx: Ctx, x: number, y: number, w: number, h: number, col: string) => {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, rgba(col, 0.6)); g.addColorStop(1, rgba(col, 0.95));
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "rgba(5,6,10,.85)"; ctx.fillRect(x + w / 2 - 1.5, y, 3, h); ctx.fillRect(x, y + h * 0.45, w, 3);
  ctx.strokeStyle = "rgba(5,6,10,.9)"; ctx.lineWidth = 4; ctx.strokeRect(x, y, w, h);
};
/** Pavimento: un colore, i giunti che scorrono sotto i piedi, due corsi di assi. */
const pavimento = (ctx: Ctx, col: string, s: Scorrere, passo: number, a: number) => {
  ctx.fillStyle = col; ctx.fillRect(0, YF, PW, PH - YF);
  ctx.strokeStyle = `rgba(0,0,0,${a})`; ctx.lineWidth = 1.4;
  ctx.beginPath();
  scorri(passo, s.off * 0.9, (x) => { ctx.moveTo(x, YF); ctx.lineTo(PW / 2 + (x - PW / 2) * 1.25, PH); });
  ctx.moveTo(0, YF + 12); ctx.lineTo(PW, YF + 12); ctx.moveTo(0, YF + 28); ctx.lineTo(PW, YF + 28);
  ctx.stroke();
};
const scaffale = (ctx: Ctx, x0: number, x1: number, y: number, muro: string, seme: number) => {
  const r = rng(seme);
  ctx.fillStyle = mix(muro, "#000000", 0.4); ctx.fillRect(x0, y, x1 - x0, 3);
  for (let x = x0 + 6; x < x1 - 8; x += 11 + r() * 6) {
    const h = 13 + r() * 7;
    ctx.fillStyle = mix(muro, "#ffffff", 0.16); ctx.fillRect(x, y - h, 6, h); ctx.fillRect(x + 1.5, y - h - 4, 3, 4);
    ctx.fillStyle = "rgba(255,230,190,.45)"; ctx.fillRect(x + 1, y - h * 0.55, 4, 4);          // l'etichetta, in avanti
  }
};
const banco = (ctx: Ctx, x0: number, x1: number, muro: string) => {
  ctx.fillStyle = mix(muro, "#000000", 0.3); ctx.fillRect(x0, YF - 34, x1 - x0, 44);
  ctx.fillStyle = "rgba(255,220,170,.16)"; ctx.fillRect(x0, YF - 34, x1 - x0, 4);
};

function stanza(ctx: Ctx, p: Tavolozza, i: Interno, s: Scorrere, t: number) {
  const luce = i.luce ?? ultimo(p), cielo = ultimo(p);
  const muro = mix(p.strati[0][0], NERO, 0.46);
  const g = ctx.createLinearGradient(0, 0, 0, YF);
  g.addColorStop(0, mix(muro, NERO, 0.55)); g.addColorStop(1, muro);
  ctx.fillStyle = g; ctx.fillRect(0, 0, PW, YF);
  ctx.fillStyle = mix(muro, NERO, 0.35); ctx.fillRect(0, YF - 5, PW, 5);                       // zoccolo
  pavimento(ctx, mix(muro, NERO, 0.3), s, 150, 0.3);
  const sfarf = 0.86 + 0.14 * Math.sin(t * 9.1) * Math.sin(t * 5.3 + 1);
  let lx = 900;
  switch (i.arredo) {
    case "bar": {                                                                                // il banco, le bottiglie, una lampada
      finestra(ctx, 210, 34, 64, 70, cielo); fascio(ctx, 210, 274, 104, 90, 330, cielo, 0.12);
      scaffale(ctx, 760, 1210, 56, muro, 3); scaffale(ctx, 780, 1190, 92, muro, 4);
      banco(ctx, 720, 1250, muro);
      ctx.strokeStyle = "rgba(5,6,10,.9)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(900, 0); ctx.lineTo(900, 38); ctx.stroke();
      ctx.fillStyle = "#0b0a0c"; ctx.beginPath(); ctx.moveTo(886, 38); ctx.lineTo(914, 38); ctx.lineTo(924, 52); ctx.lineTo(876, 52); ctx.fill();
      alone(ctx, 900, 60, 280, luce, 0.36 * sfarf); fascio(ctx, 880, 920, 52, 760, 1040, luce, 0.13 * sfarf);
      break;
    }
    case "casa": {                                                                               // una finestra, la foto storta, il cassettone
      finestra(ctx, 850, 30, 84, 86, cielo); fascio(ctx, 850, 934, 116, 460, 760, cielo, 0.14);
      ctx.save(); ctx.translate(374, 62); ctx.rotate(-0.13);
      ctx.fillStyle = "rgba(5,6,10,.85)"; ctx.fillRect(-19, -15, 38, 30);
      ctx.fillStyle = mix(muro, "#ffffff", 0.2); ctx.fillRect(-15, -11, 30, 22);
      ctx.restore();
      ctx.fillStyle = mix(muro, "#000000", 0.3); ctx.fillRect(1040, YF - 46, 150, 52);           // cassettone coi cassetti aperti
      ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(1040, YF - 31, 150, 2); ctx.fillRect(1040, YF - 16, 150, 2);
      ctx.fillStyle = mix(muro, "#ffffff", 0.1); ctx.fillRect(1062, YF - 29, 38, 8); ctx.fillRect(1118, YF - 14, 44, 8);
      lx = 890;
      break;
    }
    case "osteria": {                                                                            // il camino acceso, il banco, travi basse
      ctx.fillStyle = mix(muro, NERO, 0.55); ctx.fillRect(0, 0, PW, 26);
      scorri(210, s.off * 0.3, (x) => ctx.fillRect(x, 0, 24, 36));
      finestra(ctx, 470, 40, 46, 44, cielo);
      ctx.fillStyle = mix(muro, "#000000", 0.4); ctx.beginPath(); ctx.moveTo(140, YF + 4); ctx.lineTo(140, YF - 56); ctx.arc(215, YF - 56, 75, Math.PI, 0); ctx.lineTo(290, YF + 4); ctx.fill();   // il camino
      alone(ctx, 215, YF - 26, 260, "#ff8a3c", 0.5 * sfarf);
      ctx.fillStyle = "#ffb050";
      for (let k = 0; k < 3; k++) {                                                              // tre fiammelle
        const a = 0.5 + 0.5 * Math.sin(t * (6 + k * 2.1) + k), x = 196 + k * 20;
        ctx.beginPath(); ctx.moveTo(x - 7, YF + 1); ctx.quadraticCurveTo(x - 3, YF - 14 - a * 9, x + (k - 1) * 3, YF - 24 - a * 12); ctx.quadraticCurveTo(x + 4, YF - 12, x + 7, YF + 1); ctx.fill();
      }
      banco(ctx, 850, 1250, muro);
      ctx.fillStyle = mix(muro, "#ffffff", 0.14);
      for (let k = 0; k < 4; k++) { const x = 890 + k * 64; ctx.beginPath(); ctx.ellipse(x, YF - 44, 9, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(x - 3, YF - 58, 6, 6); }   // brocche
      lx = 215;
      break;
    }
    default: {                                                                                   // casotto: una branda, un fornello, gli attrezzi
      finestra(ctx, 240, 40, 54, 46, cielo); fascio(ctx, 240, 294, 86, 120, 420, cielo, 0.16);
      ctx.strokeStyle = mix(muro, "#ffffff", 0.18); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(430, 52); ctx.lineTo(530, 52); ctx.stroke();    // l'asse coi chiodi
      ctx.fillStyle = mix(muro, "#ffffff", 0.18);
      for (let k = 0; k < 5; k++) { const x = 440 + k * 20, h = 16 + caso(k) * 22; ctx.fillRect(x, 54, 2.5, h); ctx.fillRect(x - 3, 54 + h - 5, 9, 5); }   // gli attrezzi appesi
      ctx.fillStyle = mix(muro, "#000000", 0.3); ctx.fillRect(830, YF - 22, 6, 24); ctx.fillRect(994, YF - 22, 6, 24); ctx.fillRect(830, YF - 28, 170, 7);   // la branda
      ctx.fillStyle = mix(muro, "#ffffff", 0.12); ctx.fillRect(834, YF - 33, 150, 6);            // la coperta, ben tirata
      ctx.fillStyle = mix(muro, "#000000", 0.35); ctx.fillRect(1080, YF - 24, 50, 26); ctx.fillRect(1103, 0, 5, YF - 24);   // il fornello e la canna
      lx = 267;
    }
  }
  return { lx, col: i.luce ?? p.bordo };
}

function serra(ctx: Ctx, p: Tavolozza, s: Scorrere) {
  const luce = ultimo(p), muro = mix(p.strati[0][0], NERO, 0.55);
  const g = ctx.createLinearGradient(0, 0, 0, YF);                                               // vetri opachi di salsedine: la luce arriva sfocata, dall'alto
  g.addColorStop(0, mix(luce, NERO, 0.8)); g.addColorStop(1, mix(luce, NERO, 0.62));
  ctx.fillStyle = g; ctx.fillRect(0, 0, PW, YF);
  alone(ctx, 640, -30, 600, luce, 0.22);
  ctx.fillStyle = "rgba(5,6,10,.7)"; ctx.fillRect(0, 56, PW, 4); ctx.fillRect(0, 106, PW, 4);
  ctx.strokeStyle = "rgba(5,6,10,.7)"; ctx.lineWidth = 3; ctx.beginPath();
  scorri(96, s.off * 0.5, (x) => { ctx.moveTo(x, 0); ctx.lineTo(x, YF); ctx.moveTo(x, 0); ctx.lineTo(x + 48, 38); ctx.moveTo(x + 96, 0); ctx.lineTo(x + 48, 38); });
  ctx.stroke();
  pavimento(ctx, mix(p.suolo, NERO, 0.66), s, 120, 0.3);
  ctx.strokeStyle = "rgba(30,22,12,.9)"; ctx.lineWidth = 1.4; ctx.beginPath();                    // i filari secchi
  scorri(34, s.off * 0.9, (x, n) => { const h = 7 + caso(n) * 10; ctx.moveTo(x, YF + 18); ctx.lineTo(x + (caso(n + 9) - 0.5) * 8, YF + 18 - h); });
  ctx.stroke();
  ctx.fillStyle = mix(muro, "#000000", 0.2);                                                     // le casse di conserve
  ctx.fillRect(900, YF - 26, 50, 28); ctx.fillRect(908, YF - 52, 40, 26); ctx.fillRect(1010, YF - 26, 56, 28);
  ctx.fillStyle = "rgba(255,230,190,.12)"; for (const y of [YF - 18, YF - 44]) ctx.fillRect(902, y, 46, 2); ctx.fillRect(1012, YF - 18, 52, 2);
  return { lx: 640, col: p.bordo };
}

function grotta(ctx: Ctx, p: Tavolozza, s: Scorrere) {
  const luce = ultimo(p), roccia = mix(p.strati[0][0], NERO, 0.5);
  const fondo = ctx.createLinearGradient(0, 0, 0, YF);
  fondo.addColorStop(0, mix(roccia, NERO, 0.5)); fondo.addColorStop(0.6, roccia); fondo.addColorStop(1, mix(roccia, "#ffffff", 0.05));
  ctx.fillStyle = fondo; ctx.fillRect(0, 0, PW, PH);
  const f = crinaleDi(210), h = crinaleDi(217);
  ctx.fillStyle = mix(roccia, NERO, 0.72);
  ctx.beginPath(); ctx.moveTo(0, 0);                                                              // la volta
  for (let x = 0; x <= PW; x += 8) ctx.lineTo(x, 22 + f(x / 170) * 40);
  ctx.lineTo(PW, 0); ctx.closePath(); ctx.fill();
  const r = rng(31);
  for (let x = 30; x < PW; x += 70 + r() * 60) {                                                  // le stalattiti
    const y = 22 + f(x / 170) * 40, w = 5 + r() * 6;
    ctx.beginPath(); ctx.moveTo(x - w, y - 2); ctx.lineTo(x + w, y - 2); ctx.lineTo(x + r() * 4 - 2, y + 8 + r() * 18); ctx.fill();
  }
  const px = 1160;                                                                                // il muro a secco e la porta di tavole, da cui trapela il giorno
  alone(ctx, px + 30, YF - 50, 360, luce, 0.2);
  ctx.fillStyle = mix(roccia, "#ffffff", 0.08); ctx.fillRect(px - 40, 40, 170, YF - 36);
  ctx.fillStyle = "rgba(0,0,0,.35)";
  for (let y = 54, k = 0; y < YF; y += 14, k++) { ctx.fillRect(px - 40, y, 170, 1.5); for (let x = px - 30 + (k % 2) * 18; x < px + 130; x += 36) ctx.fillRect(x, y - 13, 1.5, 13); }
  ctx.fillStyle = rgba(luce, 0.92); ctx.fillRect(px, 52, 58, YF - 52);
  ctx.fillStyle = "#0b0a10"; for (let k = 0; k < 4; k++) ctx.fillRect(px + 1 + k * 14.5, 52, 11.5, YF - 52);
  ctx.fillStyle = mix(roccia, NERO, 0.45);                                                        // il suolo di roccia, che scorre sotto i piedi
  ctx.beginPath(); ctx.moveTo(0, PH);
  for (let x = 0; x <= PW; x += 8) ctx.lineTo(x, YF - 3 + h((x + s.off * 0.9) / 70) * 8);
  ctx.lineTo(PW, PH); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.translate(px - 190, YF + 18); ctx.scale(2.6, 0.34); alone(ctx, 0, 0, 160, luce, 0.34); ctx.restore();   // la luce sul pavimento
  return { lx: px, col: p.bordo };
}

function galleria(ctx: Ctx, p: Tavolozza, i: Interno, s: Scorrere, t: number) {
  const luce = ultimo(p), muro = mix(p.strati[0][0], NERO, 0.6);
  const g = ctx.createLinearGradient(0, 0, 0, YF);
  g.addColorStop(0, mix(muro, NERO, 0.6)); g.addColorStop(0.22, muro); g.addColorStop(1, mix(muro, "#ffffff", 0.04));
  ctx.fillStyle = g; ctx.fillRect(0, 0, PW, YF);
  ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.fillRect(0, 30, PW, 2);                              // il bordo della volta
  scorri(170, s.off * 0.5, (x, n) => {                                                            // giunti di getto e macchie, che scorrono col passo
    ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.fillRect(x, 32, 2, YF - 32);
    ctx.fillStyle = "rgba(255,255,255,.04)"; ctx.fillRect(x + 2, 32, 1, YF - 32);
    ctx.fillStyle = "rgba(0,0,0,.14)"; ctx.fillRect(x + 20, 46 + caso(n) * 70, 60 + caso(n + 5) * 70, 3);
  });
  pavimento(ctx, mix(muro, NERO, 0.3), s, 140, 0.22);
  if (i.pozza) {                                                                                  // l'acqua piovana raggrumata sul fondo
    ctx.save(); ctx.translate(470, YF + 16); ctx.scale(1, 0.055); ctx.fillStyle = rgba(luce, 0.16); ctx.beginPath(); ctx.arc(0, 0, 300, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  const riverbero = 0.92 + 0.08 * Math.sin(t * 2.2);                                              // in fondo, lontano, l'uscita
  ctx.globalCompositeOperation = "lighter";
  const m = ctx.createLinearGradient(0, 0, 560, 0);
  m.addColorStop(0, rgba(luce, 0.5 * riverbero)); m.addColorStop(1, rgba(luce, 0));
  ctx.fillStyle = m; ctx.fillRect(0, 0, 560, PH);
  ctx.globalCompositeOperation = "source-over";
  const b = ctx.createLinearGradient(0, 0, 90, 0);
  b.addColorStop(0, rgba(luce, 0.96 * riverbero)); b.addColorStop(0.55, rgba(luce, 0.7 * riverbero)); b.addColorStop(1, rgba(luce, 0));
  ctx.fillStyle = b; ctx.fillRect(0, 34, 90, YF - 34);
  return { lx: 0, col: p.bordo };
}

function torre(ctx: Ctx, p: Tavolozza, s: Scorrere) {
  const luce = ultimo(p), muro = mix(p.strati[0][0], NERO, 0.6);
  const g = ctx.createLinearGradient(0, 0, PW, 0);                                                // la parete tonda: più chiara al centro
  g.addColorStop(0, mix(muro, NERO, 0.6)); g.addColorStop(0.5, mix(muro, "#ffffff", 0.05)); g.addColorStop(1, mix(muro, NERO, 0.6));
  ctx.fillStyle = g; ctx.fillRect(0, 0, PW, YF);
  ctx.fillStyle = "rgba(0,0,0,.28)"; for (const y of [46, 92, 138]) ctx.fillRect(0, y, PW, 2);   // le riprese di getto
  for (const x of [230, 420, 790]) { fascio(ctx, x, x + 7, 96, x - 160, x - 70, luce, 0.2); ctx.fillStyle = rgba(luce, 0.95); ctx.fillRect(x, 26, 7, 70); }   // le feritoie
  const ferro = mix(muro, "#ffffff", 0.14);                                                       // la scala di ferro
  ctx.fillStyle = ferro; ctx.fillRect(1010, 0, 4, YF); ctx.fillRect(1042, 0, 4, YF);
  for (let y = 6; y < YF; y += 13) ctx.fillRect(1014, y, 28, 2.5);
  ctx.fillStyle = "rgba(255,255,255,.1)"; ctx.fillRect(1010, 0, 1.5, YF); ctx.fillRect(1042, 0, 1.5, YF);
  pavimento(ctx, mix(muro, NERO, 0.3), s, 60, 0.3);
  return { lx: 420, col: p.bordo };
}

function interno(ctx: Ctx, p: Tavolozza, i: Interno, s: Scorrere, t: number) {
  const r = i.tipo === "stanza" ? stanza(ctx, p, i, s, t) : i.tipo === "serra" ? serra(ctx, p, s)
    : i.tipo === "grotta" ? grotta(ctx, p, s) : i.tipo === "galleria" ? galleria(ctx, p, i, s, t) : torre(ctx, p, s);
  const v = ctx.createRadialGradient(PW / 2, 100, 280, PW / 2, 100, 780);                        // la vignetta: gli angoli s'oscurano
  v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.5)");
  ctx.fillStyle = v; ctx.fillRect(0, 0, PW, PH);
  return { lato: r.lx > VX ? 1 : -1, bordo: r.col };
}

// --- il panorama all'aperto: cielo, sole, crinali, segni della zona ---
function aperto(ctx: Ctx, p: Tavolozza, s: Scorrere, t: number) {
  const g = ctx.createLinearGradient(0, 0, 0, ORIZ + 10);
  p.cielo.forEach(([o, c]) => g.addColorStop(o, c));
  ctx.fillStyle = g; ctx.fillRect(0, 0, PW, PH);

  if (p.sole) {
    const { x, y, r, col, alone: al, forza } = p.sole;
    ctx.globalCompositeOperation = "lighter";
    const a = ctx.createRadialGradient(x, y, 0, x, y, 420);
    a.addColorStop(0, rgba(al, forza * 0.6)); a.addColorStop(0.3, rgba(al, forza * 0.2)); a.addColorStop(1, rgba(al, 0));
    ctx.fillStyle = a; ctx.fillRect(0, 0, PW, PH);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  p.strati.forEach(([col, base, amp, scala], i) => {
    const f = crinaleDi(100 + i * 7);
    const par = s.off * (0.15 + i * 0.2);
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(0, PH);
    for (let x = 0; x <= PW; x += 8) ctx.lineTo(x, ORIZ + base - f((x + par) / scala) * amp);
    ctx.lineTo(PW, PH); ctx.closePath(); ctx.fill();
  });

  p.segni(ctx, s.off, t);

  // suolo e sentiero
  ctx.fillStyle = p.suolo; ctx.fillRect(0, ORIZ + 26, PW, PH);
  ctx.fillStyle = mix(p.suolo, "#ffffff", 0.06);
  ctx.fillRect(0, ORIZ + 34, PW, 3);
  return { lato: p.sole && p.sole.x > VX ? 1 : -1, bordo: p.bordo };
}

function scena(ctx: Ctx, clima: Clima, luogo: string | null, s: Scorrere, t: number) {
  const p = TAV[clima], dentro = internoDi(clima, luogo);
  const { lato, bordo } = dentro ? interno(ctx, p, dentro, s, t) : aperto(ctx, p, s, t);

  // polvere nella luce
  const r = rng(9), alto = dentro ? YF - 40 : ORIZ + 10;
  for (let i = 0; i < 38; i++) {
    const x = ((r() * PW + t * (6 + r() * 12) + s.off * 0.6) % PW);
    const y = 20 + r() * alto + Math.sin(t + i) * 5;
    ctx.fillStyle = rgba(p.polvere, 0.12 + 0.15 * (0.5 + 0.5 * Math.sin(t * 1.4 + i)));
    ctx.fillRect(x, y, 1.6, 1.6);
  }

  // il viandante: cammina verso ovest, oppure resta fermo e respira
  disegnaViandante(ctx, VX, ORIZ + 36, 64, s.fase, {
    colore: p.figura, bordo, latoLuce: lato, verso: -1,
    fermo: 1 - s.passo, respiro: t, tanica: true, fagotto: true, cappello: true,
  });
  // ombra corta sotto i piedi
  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.beginPath(); ctx.ellipse(VX, ORIZ + 37, 18, 3, 0, 0, Math.PI * 2); ctx.fill();
}
