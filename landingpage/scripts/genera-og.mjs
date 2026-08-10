// ====================================================================
//  FAVELLA 1 — Generatore di anteprime Open Graph (1200×630)
// --------------------------------------------------------------------
//  Ogni pagina del sito ha la sua immagine anteprima per i social e per
//  Google. Le disegniamo qui, una per pagina, nello stile del banner
//  1.0.0 (navy-teal, logo libro-fiamma, wordmark FAVELLA 1, nome pagina,
//  icona tematica). Renderizziamo con Chromium headless così i font di
//  marca (Sora/Lora) sono quelli veri, poi salviamo PNG in public/og/.
//
//  Uso:  node scripts/genera-og.mjs
// ====================================================================
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { readFileSync, mkdirSync } from "node:fs";
import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_DIR = resolve(ROOT, "public/og");
mkdirSync(OUT_DIR, { recursive: true });

// Logo ufficiale come data-URI (così è disponibile offline nel render).
const logoB64 = readFileSync(resolve(ROOT, "src/assets/logo.png")).toString("base64");
const LOGO = `data:image/png;base64,${logoB64}`;

// Palette di marca (da tailwind.config.js).
const C = {
  void: "#03060d",
  panel: "#0b1726",
  surface: "#0f2032",
  cyan: "#22d3ee",
  cyanBright: "#5cf3ff",
  emerald: "#34d399",
  teal: "#2dd4bf",
  amber: "#f59e0b",
  textPrimary: "#e8f0f8",
  textSecondary: "#9fb4c9",
  textMuted: "#5a728a",
};

// Icone tematiche (SVG stroke, viewBox 0 0 24 24). Una per pagina.
const ICONS = {
  home: `<path d="M4 19V8l8-4 8 4v11" /><path d="M9 19v-6h6v6" /><circle cx="12" cy="9.5" r="1.4" />`,
  progetto: `<circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /><circle cx="12" cy="12" r="1" />`,
  aggiornamenti: `<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /><circle cx="12" cy="12" r="3.2" />`,
  manuale: `<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v16h5.5A2.5 2.5 0 0 1 20 21.5z" />`,
  corso: `<rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="8.5" cy="12" r="2" /><circle cx="15.5" cy="12" r="2" /><path d="M10.5 12h3" /><path d="M6.5 18l1.2-2M17.5 18l-1.2-2" />`,
  programma: `<rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9l3 3-3 3M13 15h4" />`,
  galleria: `<rect x="3" y="4" width="18" height="16" rx="2" /><path d="M10 9l5 3-5 3z" />`,
  libreria: `<path d="M5 4h3v16H5zM10 4h3v16h-3z" /><path d="M15.5 4.5l3 .8-3.5 14.5-3-.8z" />`,
  download: `<path d="M12 3v11" /><path d="M8 10l4 4 4-4" /><path d="M4 19h16" />`,
  collabora: `<path d="M4 5h10v7H8l-3 3v-3H4z" /><path d="M10 12v2a2 2 0 0 0 2 2h4l3 3v-3h1V9a2 2 0 0 0-2-2h-3" />`,
};

// Definizione delle anteprime: chiave file, nome grande, occhiello, icona, accento.
const PAGES = [
  { key: "home", eyebrow: "Il linguaggio è completo · v1.0.0", title: "Scrivi storie,\nnon codice", icon: "home", accent: C.cyan },
  { key: "progetto", eyebrow: "Il progetto", title: "L'italiano è\nil codice", icon: "progetto", accent: C.teal },
  { key: "aggiornamenti", eyebrow: "Novità & Roadmap", title: "A che punto\nsiamo", icon: "aggiornamenti", accent: C.amber },
  { key: "manuale", eyebrow: "Guida rapida", title: "Impara a\nscrivere storie", icon: "manuale", accent: C.cyan },
  { key: "corso", eyebrow: "Corso interattivo · 21 cassette", title: "Il corso\nsu cassetta", icon: "corso", accent: C.emerald },
  { key: "programma", eyebrow: "Laboratorio nel browser", title: "Programma\nsenza installare", icon: "programma", accent: C.cyanBright },
  { key: "galleria", eyebrow: "Galleria di storie", title: "Avventure da\ngiocare", icon: "galleria", accent: C.teal },
  { key: "libreria", eyebrow: "Libreria di moduli", title: "Moduli pronti\nda includere", icon: "libreria", accent: C.emerald },
  { key: "download", eyebrow: "Tutto in un posto solo", title: "Scarica\nFAVELLA 1", icon: "download", accent: C.cyan },
  { key: "collabora", eyebrow: "Open source", title: "Un progetto\naperto", icon: "collabora", accent: C.amber },
];

function pageHtml({ eyebrow, title, icon, accent }) {
  const titleHtml = title.replace(/\n/g, "<br/>");
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Source+Code+Pro:wght@500;600&display=swap" rel="stylesheet"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html,body { width:1200px; height:630px; }
    body {
      font-family:'Sora',sans-serif; color:${C.textPrimary};
      background:
        radial-gradient(120% 130% at 12% 10%, rgba(34,211,238,0.16), transparent 45%),
        radial-gradient(120% 130% at 100% 100%, rgba(52,211,153,0.14), transparent 50%),
        linear-gradient(135deg, ${C.void} 0%, ${C.panel} 55%, ${C.surface} 100%);
      position:relative; overflow:hidden;
    }
    /* griglia tenue */
    body::before {
      content:""; position:absolute; inset:0;
      background-image:
        linear-gradient(rgba(159,180,201,0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(159,180,201,0.05) 1px, transparent 1px);
      background-size:48px 48px; mask-image:radial-gradient(110% 110% at 30% 40%, #000 35%, transparent 80%);
    }
    .frame { position:absolute; inset:26px; border:1px solid rgba(34,211,238,0.16); border-radius:22px; }
    .wrap { position:relative; height:100%; padding:64px 72px; display:flex; flex-direction:column; justify-content:space-between; }
    .top { display:flex; align-items:center; gap:18px; }
    .logo { width:74px; height:74px; filter:drop-shadow(0 4px 22px rgba(34,211,238,0.4)); }
    .wm { line-height:1; }
    .wm b { display:block; font-weight:800; font-size:30px; letter-spacing:-0.5px; }
    .wm b span { color:${C.cyan}; }
    .wm small { display:block; margin-top:6px; font-family:'Source Code Pro',monospace; font-size:12px; letter-spacing:4px; color:${C.textMuted}; }
    .mid { display:flex; align-items:center; justify-content:space-between; gap:40px; }
    .copy { max-width:680px; }
    .eyebrow { display:inline-block; font-family:'Source Code Pro',monospace; font-size:18px; letter-spacing:3px; text-transform:uppercase; color:${accent}; margin-bottom:22px; }
    .title { font-weight:800; font-size:78px; line-height:1.02; letter-spacing:-1.5px; }
    .icon { flex-shrink:0; width:230px; height:230px; }
    .icon svg { width:100%; height:100%; }
    .glow { position:absolute; right:90px; top:50%; transform:translateY(-30%); width:320px; height:320px; border-radius:50%;
      background:radial-gradient(circle, ${accent}33, transparent 65%); filter:blur(8px); }
    .bottom { display:flex; align-items:center; justify-content:space-between; font-family:'Source Code Pro',monospace; }
    .slogan { font-size:20px; color:${C.textSecondary}; }
    .url { font-size:20px; font-weight:600; color:${C.cyan}; }
  </style></head>
  <body>
    <div class="frame"></div>
    <div class="glow"></div>
    <div class="wrap">
      <div class="top">
        <img class="logo" src="${LOGO}" alt=""/>
        <div class="wm"><b>FAVELLA<span> 1</span></b><small>IL CODICE È PROSA</small></div>
      </div>
      <div class="mid">
        <div class="copy">
          <span class="eyebrow">${eyebrow}</span>
          <div class="title">${titleHtml}</div>
        </div>
        <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="${accent}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">${ICONS[icon]}</svg></div>
      </div>
      <div class="bottom">
        <span class="slogan">L'italiano è il linguaggio di programmazione</span>
        <span class="url">favella.eu</span>
      </div>
    </div>
  </body></html>`;
}

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });

for (const p of PAGES) {
  await page.setContent(pageHtml(p), { waitUntil: "load", timeout: 60000 });
  // Attendi che i font di marca siano effettivamente pronti, poi un breve
  // assestamento per il layout. Evitiamo networkidle0: i font Google tengono
  // connessioni aperte e farebbero scadere il timeout.
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 250));
  const out = resolve(OUT_DIR, `${p.key}.png`);
  await page.screenshot({ path: out, type: "png" });
  console.log(`  ✓ og/${p.key}.png`);
}

await browser.close();
console.log(`\nGenerate ${PAGES.length} anteprime in public/og/`);
