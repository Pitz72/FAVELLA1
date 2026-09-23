// ====================================================================
//  Il panorama del gioco: una striscia di paesaggio viva in cima allo
//  schermo, stesso linguaggio del trailer. Ogni zona ha cielo, luce e
//  segni propri; quando il giocatore cambia luogo il viandante cammina e il
//  paesaggio scorre, poi si ferma e respira.
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
  const stato = useRef({ fase: 0, off: 0, passo: 0, ultimo: performance.now(), clima, prec: clima, mix: 1, camminaDa });
  stato.current.camminaDa = camminaDa;
  if (stato.current.clima !== clima) { stato.current.prec = stato.current.clima; stato.current.clima = clima; stato.current.mix = 0; }

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
    const passo = (ora: number) => {
      const s = stato.current, tela = telaRef.current;
      const dt = Math.min(0.1, (ora - s.ultimo) / 1000); s.ultimo = ora;
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
        if (s.mix < 1 && s.prec !== s.clima) {
          if (buf.width !== tela.width) { buf.width = tela.width; buf.height = tela.height; }
          const b = buf.getContext("2d")!;
          b.setTransform(k, 0, 0, k, 0, 0); scena(b, TAV[s.prec], s, t, luogo);
          ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(buf, 0, 0);
          ctx.globalAlpha = s.mix;
          b.setTransform(k, 0, 0, k, 0, 0); scena(b, TAV[s.clima], s, t, luogo);
          ctx.drawImage(buf, 0, 0); ctx.globalAlpha = 1;
        } else {
          ctx.setTransform(k, 0, 0, k, 0, 0);
          scena(ctx, TAV[s.clima], s, t, luogo);
        }
      }
      raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [luogo]);

  return <canvas ref={telaRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />;
}

function scena(ctx: CanvasRenderingContext2D, p: Tavolozza, s: { fase: number; off: number; passo: number }, t: number, _luogo: string | null) {
  const g = ctx.createLinearGradient(0, 0, 0, ORIZ + 10);
  p.cielo.forEach(([o, c]) => g.addColorStop(o, c));
  ctx.fillStyle = g; ctx.fillRect(0, 0, PW, PH);

  if (p.sole) {
    const { x, y, r, col, alone, forza } = p.sole;
    ctx.globalCompositeOperation = "lighter";
    const a = ctx.createRadialGradient(x, y, 0, x, y, 420);
    a.addColorStop(0, rgba(alone, forza * 0.6)); a.addColorStop(0.3, rgba(alone, forza * 0.2)); a.addColorStop(1, rgba(alone, 0));
    ctx.fillStyle = a; ctx.fillRect(0, 0, PW, PH);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  p.strati.forEach(([col, base, amp, scala], i) => {
    const f = crinale(100 + i * 7);
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

  // polvere nella luce
  const r = rng(9);
  for (let i = 0; i < 38; i++) {
    const x = ((r() * PW + t * (6 + r() * 12) + s.off * 0.6) % PW);
    const y = 20 + r() * (ORIZ + 10) + Math.sin(t + i) * 5;
    ctx.fillStyle = rgba(p.polvere, 0.12 + 0.15 * (0.5 + 0.5 * Math.sin(t * 1.4 + i)));
    ctx.fillRect(x, y, 1.6, 1.6);
  }

  // il viandante: cammina verso ovest, oppure resta fermo e respira
  const VX = 610;
  disegnaViandante(ctx, VX, ORIZ + 36, 64, s.fase, {
    colore: p.figura, bordo: p.bordo, latoLuce: p.sole && p.sole.x > VX ? 1 : -1, verso: -1,
    fermo: 1 - s.passo, respiro: t, tanica: true, fagotto: true, cappello: true,
  });
  // ombra corta sotto i piedi
  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.beginPath(); ctx.ellipse(VX, ORIZ + 37, 18, 3, 0, 0, Math.PI * 2); ctx.fill();
}
