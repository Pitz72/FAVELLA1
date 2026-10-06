// ====================================================================
//  FAVELLA 1 — Banner e infografiche di marca (ottobre 2026)
// --------------------------------------------------------------------
//  Disegna in HTML e fotografa con Chromium headless, a doppia densità:
//  font di marca veri (Sora, Lora, Inter, Source Code Pro, gli stessi del
//  sito, incorporati), logo ufficiale, schermate vere di Favella Studio
//  (public/studio/*.webp, rifatte con scripts/foto-studio.mjs) e la
//  copertina vera del manuale (pagina 1 del PDF, via ImageMagick).
//
//  Scrive:
//    branding/materiale/banner-favella1-v<motore>.png         2520×1080
//    branding/materiale/banner-favella-studio-v<studio>.png   2520×1080
//    branding/materiale/social-preview-github.jpg             2560×1280
//    branding/materiale/infografica-favella1-v<motore>.png    2160×3840
//    branding/materiale/infografica-manuale-terza-edizione.png 2160×3840
//    branding/materiale/infografica-sito-favella-eu-v<sito>.png 3840×2160
//    assets/banner.png                       (= banner FAVELLA, per README e pip)
//    studio/branding/favella-studio-banner.jpg e
//    landingpage/public/studio/favella-studio-banner.jpg       1920×1080
//
//  Uso:  node scripts/genera-grafiche.mjs   (dalla cartella landingpage/)
// ====================================================================
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { readFileSync, writeFileSync, copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import puppeteer from "puppeteer";

const qui = dirname(fileURLToPath(import.meta.url));
const SITO = resolve(qui, "..");
const REPO = resolve(SITO, "..");
const MAT = join(REPO, "branding", "materiale");

// --- I numeri, da un posto solo: le costanti del sito ---------------------------------
const costanti = readFileSync(join(SITO, "src", "constants.tsx"), "utf8");
const leggi = (re, nome) => {
  const m = costanti.match(re);
  if (!m) throw new Error(`non trovo ${nome} in constants.tsx`);
  return m[1];
};
const MOTORE = leggi(/export const ENGINE_VERSION = "([^"]+)"/, "ENGINE_VERSION");
const STUDIO = leggi(/export const STUDIO_VERSION = "([^"]+)"/, "STUDIO_VERSION");
const VERSIONE_SITO = leggi(/export const SITE_VERSION = "([^"]+)"/, "SITE_VERSION");
const TEST = leggi(/STATS_NUMERI = \{ test: (\d+)/, "STATS_NUMERI.test");
const COLLAUDO = leggi(/STATS_NUMERI = \{[^}]*collaudo: (\d+)/, "STATS_NUMERI.collaudo");
const AVVENTURE = leggi(/STATS_NUMERI = \{[^}]*avventure: (\d+)/, "STATS_NUMERI.avventure");
const CASSETTE = leggi(/STATS_NUMERI = \{[^}]*cassette: (\d+)/, "STATS_NUMERI.cassette");
const PAGINE_MANUALE = execFileSync("pdfinfo", [join(REPO, "documentazione", "manuale", "manuale.pdf")], { encoding: "utf8" }).match(/Pages:\s+(\d+)/)[1];

// --- Risorse incorporate (data URI: il render non dipende da rete né da percorsi) -----
const dataUri = (percorso, tipo) => `data:${tipo};base64,${readFileSync(percorso).toString("base64")}`;
const LOGO = dataUri(join(REPO, "documentazione", "manuale", "assets", "logo.png"), "image/png");
const LOGO_STUDIO = dataUri(join(REPO, "studio", "branding", "favella-studio-logo.svg"), "image/svg+xml");
const FOTO = (nome) => dataUri(join(SITO, "public", "studio", `${nome}.webp`), "image/webp");

const tmp = mkdtempSync(join(tmpdir(), "favella-grafiche-"));
const copertinaPng = join(tmp, "copertina.jpg");
execFileSync("magick", ["-density", "220", `${join(REPO, "documentazione", "manuale", "manuale.pdf")}[0]`, "-background", "white", "-alpha", "remove", "-resize", "x1500", "-depth", "8", "-quality", "92", copertinaPng]);
const COPERTINA = dataUri(copertinaPng, "image/jpeg");

// Solo i font «latin» del sito, incorporati.
const FONT_CSS = (() => {
  const css = readFileSync(join(SITO, "public", "fonts", "fonts.css"), "utf8");
  const blocchi = css.split(/(?=\/\* [a-z-]+ \*\/)/);
  return blocchi
    .filter((b) => b.startsWith("/* latin */"))
    .map((b) =>
      b.replace(/url\(\/fonts\/([^)]+)\)/, (_, f) => `url(data:font/woff2;base64,${readFileSync(join(SITO, "public", "fonts", f)).toString("base64")})`)
    )
    .join("\n");
})();

// --- Stile comune ----------------------------------------------------------------------
const BASE = `
${FONT_CSS}
:root{
  --void:#03060d; --navy:#06101d; --panel:#0b1726; --surface:#0f2032;
  --cyan:#22d3ee; --cyan2:#5cf3ff; --emerald:#34d399; --teal:#2dd4bf; --amber:#f59e0b; --amber2:#fbbf24;
  --text:#e8f0f8; --text2:#a9bdd0; --muted:#6a8299; --line:rgba(120,190,220,.16);
}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:var(--void);overflow:hidden}
body{font-family:Inter,sans-serif;color:var(--text);-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
.tela{position:relative;width:100vw;height:100vh;overflow:hidden;
  background:
    radial-gradient(42% 62% at 16% 46%, rgba(34,211,238,.15), transparent 64%),
    radial-gradient(42% 60% at 62% -8%, rgba(52,211,153,.10), transparent 62%),
    radial-gradient(48% 70% at 100% 108%, rgba(245,158,11,.11), transparent 62%),
    linear-gradient(170deg,#081626 0%,#050c17 55%,#03070f 100%);}
.griglia{position:absolute;inset:0;
  background-image:linear-gradient(rgba(140,200,235,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(140,200,235,.055) 1px,transparent 1px);
  background-size:38px 38px;
  -webkit-mask-image:radial-gradient(70% 90% at 30% 50%,#000 10%,transparent 78%);}
.grana{position:absolute;inset:0;opacity:.09;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");}
.cornice{position:absolute;inset:14px;border:1px solid var(--line);border-radius:24px;pointer-events:none}
.cornice::after{content:"";position:absolute;left:28px;right:28px;top:-1px;height:1px;
  background:linear-gradient(90deg,transparent,rgba(34,211,238,.7) 30%,rgba(52,211,153,.6) 60%,rgba(245,158,11,.55) 85%,transparent)}
.occhiello{font-family:'Source Code Pro',monospace;font-weight:600;text-transform:uppercase;letter-spacing:.3em;color:var(--cyan)}
.ink{background:linear-gradient(100deg,var(--cyan2) 0%,var(--cyan) 38%,var(--emerald) 78%);-webkit-background-clip:text;background-clip:text;color:transparent}
.ink-caldo{background:linear-gradient(100deg,var(--cyan2) 0%,var(--cyan) 30%,var(--emerald) 55%,var(--amber2) 80%,var(--amber) 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.marchio{font-family:Sora,sans-serif;font-weight:800;letter-spacing:-.035em;line-height:.92;
  background:linear-gradient(180deg,#ffffff 0%,#dcebf6 55%,#a9c6dc 100%);-webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 0 28px rgba(34,211,238,.22))}
.serif{font-family:Lora,serif;font-style:italic;color:var(--text2)}
.chip{display:inline-flex;align-items:center;gap:.5em;font-family:'Source Code Pro',monospace;font-weight:600;letter-spacing:.14em;text-transform:uppercase;
  border:1px solid rgba(52,211,153,.45);background:rgba(52,211,153,.08);color:var(--emerald);border-radius:999px;padding:.55em 1.1em;line-height:1}
.chip.ciano{border-color:rgba(34,211,238,.45);background:rgba(34,211,238,.08);color:var(--cyan)}
.chip.ambra{border-color:rgba(245,158,11,.5);background:rgba(245,158,11,.08);color:var(--amber2)}
.meta{font-family:'Source Code Pro',monospace;font-weight:500;letter-spacing:.08em;color:var(--muted)}
.meta b{color:var(--text2);font-weight:600}
.alone{position:absolute;border-radius:50%;filter:blur(40px);pointer-events:none}
.finestra{position:absolute;border-radius:14px;overflow:hidden;border:1px solid rgba(34,211,238,.28);
  box-shadow:0 60px 120px -30px rgba(0,0,0,.95),0 0 0 1px rgba(0,0,0,.6),0 0 90px -30px rgba(34,211,238,.35)}
.finestra img{display:block;width:100%;height:auto}
`;

const pagina = (corpo, css = "") => `<!doctype html><html lang="it"><head><meta charset="utf-8"><style>${BASE}${css}</style></head><body><div class="tela"><div class="griglia"></div>${corpo}<div class="grana"></div><div class="cornice"></div></div></body></html>`;

// --- 1. Banner FAVELLA 1 -------------------------------------------------------------
const bannerFavella = () =>
  pagina(
    `
  <div class="alone" style="left:110px;top:120px;width:300px;height:300px;background:rgba(34,211,238,.16)"></div>
  <div class="logo"><img src="${LOGO}" alt=""></div>
  <div class="sep"></div>
  <div class="testo">
    <p class="occhiello" style="font-size:13px">Motore di narrativa interattiva · in italiano</p>
    <h1 class="marchio" style="font-size:132px;margin-top:20px">FAVELLA 1</h1>
    <div class="riga">
      <span class="versione ink">${MOTORE}</span>
      <span class="chip" style="font-size:12px">versione definitiva</span>
    </div>
    <p class="serif" style="font-size:27px;margin-top:22px">L'italiano è il linguaggio di programmazione.</p>
    <p class="meta" style="font-size:12.5px;margin-top:26px"><b>${TEST}</b> test · <b>0</b> ambiguità · manuale di <b>${PAGINE_MANUALE}</b> pagine · <b>favella.eu</b></p>
  </div>
  <pre class="codice"><span class="k">La cucina</span> <span class="c">è una stanza</span><span class="p">.</span>
<span class="k">Il tavolo</span> <span class="c">è nella</span> <span class="k">cucina</span><span class="p">.</span>
<span class="k">Il giocatore</span> <span class="c">è nella</span> <span class="k">cucina</span><span class="p">.</span></pre>`,
    `
  .logo{position:absolute;left:84px;top:112px;width:330px}
  .logo img{width:100%;filter:drop-shadow(0 10px 40px rgba(34,211,238,.35)) drop-shadow(0 0 2px rgba(0,0,0,.6))}
  .sep{position:absolute;left:478px;top:116px;bottom:116px;width:1px;background:linear-gradient(180deg,transparent,rgba(34,211,238,.45),rgba(52,211,153,.3),transparent)}
  .testo{position:absolute;left:530px;top:96px;right:60px}
  .riga{display:flex;align-items:center;gap:22px;margin-top:10px}
  .versione{font-family:Sora,sans-serif;font-weight:700;font-size:72px;letter-spacing:-.02em;line-height:1}
  .codice{position:absolute;right:46px;bottom:40px;font-family:'Source Code Pro',monospace;font-size:11.5px;line-height:1.7;color:var(--text);opacity:.34;text-align:left}
  .codice .c{color:var(--cyan)} .codice .p{color:var(--amber)}
  `
  );

// --- 2. Banner Favella Studio (2520×1080 e 1920×1080) --------------------------------
const bannerStudio = (largo) =>
  pagina(
    `
  <div class="alone" style="left:-40px;top:40px;width:520px;height:420px;background:rgba(52,211,153,.13)"></div>
  <div class="testo">
    <div class="intesta"><img class="icona" src="${LOGO_STUDIO}" alt=""><p class="occhiello" style="font-size:12.5px">L'ambiente di scrittura<br>per FAVELLA 1</p></div>
    <h1 class="marchio" style="font-size:${largo ? 90 : 84}px;margin-top:${largo ? 24 : 22}px">Favella<br><span class="ink">Studio</span></h1>
    <div class="riga">
      <span class="versione ink">${STUDIO}</span>
      <span class="chip" style="font-size:11.5px">ridisegno «Scrittoio»</span>
    </div>
    <p class="serif" style="font-size:${largo ? 23 : 21}px;margin-top:18px;max-width:${largo ? 640 : 430}px">Scrivi la tua avventura, guardala diventare un mondo.</p>
    <p class="meta" style="font-size:12px;margin-top:18px">Windows · Linux · macOS da sorgente · <b>gratuito, MIT</b></p>
  </div>
  <div class="scena">
    <div class="finestra davanti"><img src="${FOTO("mappa")}" alt=""></div>
  </div>
  <div class="sfuma"></div>`,
    `
  .testo{position:absolute;left:${largo ? 78 : 60}px;top:${largo ? 56 : 58}px;width:${largo ? 600 : 520}px;z-index:3}
  .intesta{display:flex;align-items:center;gap:18px}
  .icona{width:${largo ? 78 : 70}px;height:${largo ? 78 : 70}px;border-radius:22px;box-shadow:0 18px 50px -12px rgba(0,0,0,.9),0 0 40px -6px rgba(245,158,11,.35)}
  .occhiello{line-height:1.6}
  .marchio span{filter:none}
  .riga{display:flex;align-items:center;gap:18px;margin-top:14px}
  .versione{font-family:Sora,sans-serif;font-weight:700;font-size:${largo ? 52 : 46}px;letter-spacing:-.02em;line-height:1}
  .scena{position:absolute;left:${largo ? 640 : 520}px;top:0;right:0;bottom:0;perspective:1800px;z-index:2}
  .finestra.davanti{width:${largo ? 800 : 640}px;left:${largo ? 40 : 30}px;top:${largo ? 70 : 96}px;transform:rotateY(-16deg) rotateX(5deg) rotateZ(.6deg);transform-origin:left center}
  .finestra.dietro{width:${largo ? 640 : 520}px;left:${largo ? 300 : 230}px;top:${largo ? 26 : 50}px;transform:rotateY(-16deg) rotateX(5deg);transform-origin:left center;opacity:.5;filter:saturate(.8) brightness(.8)}
  .sfuma{position:absolute;inset:0;z-index:2;pointer-events:none;background:linear-gradient(90deg,transparent 78%,rgba(3,6,13,.75) 100%),linear-gradient(0deg,rgba(3,6,13,.8) 0%,transparent 22%)}
  `
  );

// --- 3. Anteprima social del repository (GitHub, 1280×640) ---------------------------
const social = () =>
  pagina(
    `
  <div class="alone" style="left:30px;top:60px;width:420px;height:380px;background:rgba(34,211,238,.17)"></div>
  <div class="testo">
    <div class="intesta"><img class="logo" src="${LOGO}" alt=""><p class="occhiello" style="font-size:13px">Narrativa interattiva<br>in italiano</p></div>
    <h1 class="marchio" style="font-size:118px;margin-top:30px">FAVELLA 1</h1>
    <p class="serif" style="font-size:28px;margin-top:20px">L'italiano è il linguaggio<br>di programmazione.</p>
    <div class="chips">
      <span class="chip ciano" style="font-size:12.5px">motore ${MOTORE}</span>
      <span class="chip" style="font-size:12.5px">Favella Studio ${STUDIO}</span>
      <span class="chip ambra" style="font-size:12.5px">manuale · ${PAGINE_MANUALE} pp.</span>
    </div>
    <p class="meta" style="font-size:13px;margin-top:26px"><b>favella.eu</b> · github.com/Pitz72/FAVELLA1 · open source, MIT</p>
  </div>
  <div class="scena"><div class="finestra"><img src="${FOTO("storia")}" alt=""></div></div>
  <div class="sfuma"></div>`,
    `
  .testo{position:absolute;left:70px;top:70px;width:640px;z-index:3}
  .intesta{display:flex;align-items:center;gap:18px}
  .logo{width:110px;filter:drop-shadow(0 8px 30px rgba(34,211,238,.35))}
  .occhiello{line-height:1.6}
  .chips{display:flex;gap:12px;margin-top:30px;flex-wrap:wrap}
  .scena{position:absolute;left:700px;top:0;right:0;bottom:0;perspective:1800px;z-index:2}
  .finestra{width:780px;left:10px;top:96px;transform:rotateY(-18deg) rotateX(5deg);transform-origin:left center}
  .sfuma{position:absolute;inset:0;z-index:2;pointer-events:none;background:linear-gradient(90deg,transparent 80%,rgba(3,6,13,.8) 100%),linear-gradient(0deg,rgba(3,6,13,.85) 0%,transparent 25%)}
  `
  );

// --- Icone a tratto (le stesse delle anteprime del sito) ---------------------------------
const IC = {
  home: `<path d="M4 19V8l8-4 8 4v11" /><path d="M9 19v-6h6v6" /><circle cx="12" cy="9.5" r="1.4" />`,
  progetto: `<circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /><circle cx="12" cy="12" r="1" />`,
  aggiornamenti: `<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /><circle cx="12" cy="12" r="3.2" />`,
  manuale: `<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v16h5.5A2.5 2.5 0 0 1 20 21.5z" />`,
  corso: `<rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="8.5" cy="12" r="2" /><circle cx="15.5" cy="12" r="2" /><path d="M10.5 12h3" /><path d="M6.5 18l1.2-2M17.5 18l-1.2-2" />`,
  studio: `<rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16M3 9h6M3 14h6" /><path d="M13 9h5M13 13h3" />`,
  programma: `<rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9l3 3-3 3M13 15h4" />`,
  galleria: `<rect x="3" y="4" width="18" height="16" rx="2" /><path d="M10 9l5 3-5 3z" />`,
  libreria: `<path d="M5 4h3v16H5zM10 4h3v16h-3z" /><path d="M15.5 4.5l3 .8-3.5 14.5-3-.8z" />`,
  download: `<path d="M12 3v11" /><path d="M8 10l4 4 4-4" /><path d="M4 19h16" />`,
  collabora: `<path d="M4 5h10v7H8l-3 3v-3H4z" /><path d="M10 12v2a2 2 0 0 0 2 2h4l3 3v-3h1V9a2 2 0 0 0-2-2h-3" />`,
  viaggio: `<circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />`,
};
const icona = (k, colore) => `<svg viewBox="0 0 24 24" fill="none" stroke="${colore}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${IC[k]}</svg>`;

// --- 4. Infografica del sito (1920×1080) ---------------------------------------------
const SEZIONI = [
  ["home", "Inizio", "Il linguaggio in cui l'italiano è il codice."],
  ["progetto", "Il progetto", `La visione e l'ingegneria: parser LALR(1), ${TEST} test.`],
  ["aggiornamenti", "Novità e roadmap", `Ogni versione, fino alla ${MOTORE} definitiva.`],
  ["manuale", "Guida rapida", `La sintassi essenziale, e il manuale di ${PAGINE_MANUALE} pagine.`],
  ["corso", "Corso interattivo", `${CASSETTE} lezioni su cassetta, con il motore vero.`],
  ["programma", "Programma", "Scrivi e gioca le tue storie nel browser."],
  ["studio", "Favella Studio", `L'ambiente di scrittura ${STUDIO}, per Windows e Linux.`],
  ["galleria", "Galleria", `${AVVENTURE} avventure da giocare, tutte vincibili.`],
  ["viaggio", "Il Viaggiatore", "Il gioco completo scritto in FAVELLA, nel browser."],
  ["libreria", "Libreria", "Moduli .fav pronti da includere nelle storie."],
  ["download", "Download", "pip install favella1, le app desktop, il manuale."],
  ["collabora", "Collabora", "Open source, licenza MIT: codice, storie, idee."],
];
const COLORI = ["#22d3ee", "#2dd4bf", "#f59e0b", "#22d3ee", "#34d399", "#5cf3ff", "#34d399", "#2dd4bf", "#f59e0b", "#34d399", "#22d3ee", "#f59e0b"];
const infograficaSito = () =>
  pagina(
    `
  <div class="alone" style="left:560px;top:20px;width:800px;height:300px;background:rgba(34,211,238,.10)"></div>
  <header>
    <p class="occhiello" style="font-size:18px;letter-spacing:.42em;color:var(--text2)">Il sito ufficiale · FAVELLA ${MOTORE} · Studio ${STUDIO}</p>
    <h1 class="dominio ink-caldo">FAVELLA.EU</h1>
    <p class="serif" style="font-size:34px">L'italiano è il linguaggio di programmazione.</p>
  </header>
  <h2>Tutto quello che trovi nel sito</h2>
  <ul>${SEZIONI.map(
    ([k, t, d], i) => `<li><span class="ico" style="border-color:${COLORI[i]}55;background:${COLORI[i]}14">${icona(k, COLORI[i])}</span><span><b>${t}</b><em>${d}</em></span></li>`
  ).join("")}</ul>
  <footer><b>${TEST}</b> test verdi · <b>${COLLAUDO}</b> di collaudo · <b>0</b> ambiguità · <b>100%</b> italiano · sito pre-renderizzato · open source</footer>`,
    `
  .griglia{-webkit-mask-image:radial-gradient(80% 60% at 50% 20%,#000 10%,transparent 80%)}
  header{position:absolute;top:84px;left:0;right:0;text-align:center}
  .dominio{font-family:Sora,sans-serif;font-weight:800;font-size:196px;letter-spacing:-.04em;line-height:1;margin:22px 0 14px;filter:drop-shadow(0 0 40px rgba(34,211,238,.18))}
  h2{position:absolute;top:470px;left:0;right:0;text-align:center;font-family:'Source Code Pro',monospace;font-weight:600;font-size:20px;letter-spacing:.34em;text-transform:uppercase;color:var(--text)}
  h2::before,h2::after{content:"";display:inline-block;width:120px;height:1px;vertical-align:middle;margin:0 26px;background:linear-gradient(90deg,transparent,rgba(34,211,238,.6))}
  h2::after{background:linear-gradient(90deg,rgba(34,211,238,.6),transparent)}
  ul{position:absolute;top:540px;left:110px;right:110px;list-style:none;display:grid;grid-template-columns:repeat(3,1fr);gap:18px 26px}
  li{display:flex;align-items:center;gap:20px;padding:18px 22px;border-radius:18px;background:linear-gradient(180deg,rgba(15,32,50,.72),rgba(11,23,38,.55));border:1px solid rgba(120,190,220,.13)}
  .ico{flex:0 0 58px;height:58px;border-radius:15px;border:1px solid;display:grid;place-items:center}
  .ico svg{width:30px;height:30px}
  li b{display:block;font-family:Sora,sans-serif;font-weight:700;font-size:25px;letter-spacing:-.01em;color:var(--text)}
  li em{display:block;font-style:normal;font-size:17.5px;color:var(--text2);margin-top:4px;line-height:1.35}
  footer{position:absolute;bottom:54px;left:0;right:0;text-align:center;font-family:'Source Code Pro',monospace;font-weight:500;font-size:19px;letter-spacing:.06em;color:var(--muted)}
  footer b{color:var(--cyan);font-weight:600}
  `
  );

// --- 5. Infografica del manuale (1080×1920) ------------------------------------------
const CAPITOLI = [
  "Introduzione", "Installare e avviare FAVELLA", "Anatomia di una frase", "Le stanze", "Muoversi tra le stanze",
  "Gli oggetti", "Proprietà e stati a due valori", "Contenitori e supporti", "Stati e contatori", "Le regole: «Invece di»",
  "Logica e conseguenze", "Il caso e le quantità", "Fine partita", "Il tempo: gli eventi a turni", "I demoni",
  "Buio e luce", "Personaggi e dialoghi", "La capacità di trasporto", "Organizzare un progetto: i moduli", "I comandi del giocatore",
  "Riepilogo del linguaggio",
];
const NOVITA_MANUALE = [
  ["«Prima di» e «Dopo di»", "accanto a «Invece di»"],
  ["Le partite si salvano", "salva, carica, e annulla dopo il caricamento"],
  ["Il collaudo che gioca", "favella1 esplora e collaudo --finali"],
  ["I pulsanti-verbo", "si gioca anche toccando, non solo scrivendo"],
  ["Il posto iniziale", "un oggetto che si presenta dentro la scena"],
];
const infograficaManuale = () =>
  pagina(
    `
  <div class="alone" style="left:40px;top:80px;width:520px;height:620px;background:rgba(34,211,238,.13)"></div>
  <div class="libro"><img src="${COPERTINA}" alt=""></div>
  <div class="testa">
    <p class="occhiello" style="font-size:15px;color:var(--text2)">Guida ufficiale</p>
    <h1 class="titolo">Manuale di<br><span class="ink">Programmazione</span></h1>
    <p class="ed">Terza edizione · 2026</p>
    <ul class="punti">
      <li><b>${PAGINE_MANUALE}</b> pagine, <b>${CAPITOLI.length}</b> capitoli</li>
      <li>allineato al motore <b>${MOTORE}</b>, la versione definitiva</li>
      <li>un esempio dall'inizio alla fine: <i>La Casa di Via Stradivari</i></li>
      <li>PDF <b>gratuito</b> · anche su carta, su Amazon.it</li>
    </ul>
  </div>
  <h2>I ${CAPITOLI.length === 21 ? "ventuno" : CAPITOLI.length} capitoli</h2>
  <ol class="capitoli">${CAPITOLI.map((c, i) => `<li><span>${String(i + 1).padStart(2, "0")}</span>${c}</li>`).join("")}</ol>
  <section class="nuovo">
    <p class="occhiello" style="font-size:15px;color:var(--emerald)">Novità della terza edizione</p>
    <ul>${NOVITA_MANUALE.map(([t, d]) => `<li><span class="spunta">${icona("download", "#34d399").replace(IC.download, '<path d="M5 12.5l4.5 4.5L19 7.5" />')}</span><b>${t}</b><em>${d}</em></li>`).join("")}</ul>
  </section>
  <div class="cta">Scaricalo gratis da favella.eu</div>
  <p class="piede">favella.eu/manuale · github.com/Pitz72/FAVELLA1</p>`,
    `
  .griglia{-webkit-mask-image:radial-gradient(80% 40% at 40% 18%,#000 10%,transparent 80%)}
  .libro{position:absolute;left:72px;top:96px;width:400px;perspective:1400px}
  .libro img{display:block;width:100%;border-radius:6px 14px 14px 6px;transform:rotateY(14deg) rotateZ(-1deg);transform-origin:left center;
    box-shadow:-10px 0 0 -4px #0b1726,0 50px 90px -24px rgba(0,0,0,.95),0 0 80px -20px rgba(34,211,238,.4);outline:1px solid rgba(34,211,238,.25)}
  .testa{position:absolute;left:528px;top:116px;right:70px}
  .titolo{font-family:Sora,sans-serif;font-weight:800;font-size:56px;letter-spacing:-.035em;line-height:1.02;margin-top:16px;color:var(--text)}
  .ed{font-family:Sora,sans-serif;font-weight:600;font-size:25px;color:var(--emerald);margin-top:16px}
  .punti{list-style:none;margin-top:26px;display:grid;gap:13px}
  .punti li{position:relative;padding-left:26px;font-size:21px;line-height:1.4;color:var(--text2)}
  .punti li::before{content:"";position:absolute;left:2px;top:11px;width:9px;height:9px;border-radius:50%;background:var(--cyan);box-shadow:0 0 12px var(--cyan)}
  .punti b{color:var(--text);font-weight:600} .punti i{font-family:Lora,serif;color:var(--text)}
  h2{position:absolute;top:770px;left:0;right:0;text-align:center;font-family:'Source Code Pro',monospace;font-weight:600;font-size:21px;letter-spacing:.34em;text-transform:uppercase}
  h2::before,h2::after{content:"";display:inline-block;width:110px;height:1px;vertical-align:middle;margin:0 22px;background:linear-gradient(90deg,transparent,rgba(34,211,238,.6))}
  h2::after{background:linear-gradient(90deg,rgba(34,211,238,.6),transparent)}
  .capitoli{position:absolute;top:836px;left:80px;right:80px;list-style:none;columns:2;column-gap:46px}
  .capitoli li{break-inside:avoid;display:flex;align-items:baseline;gap:16px;font-size:22.5px;line-height:1;padding:12px 0;border-bottom:1px solid rgba(120,190,220,.09);color:var(--text)}
  .capitoli span{font-family:'Source Code Pro',monospace;font-weight:600;font-size:19px;color:var(--cyan);flex:0 0 30px}
  .nuovo{position:absolute;top:1392px;left:80px;right:80px;padding:30px 36px;border-radius:22px;border:1px solid rgba(52,211,153,.32);background:linear-gradient(180deg,rgba(52,211,153,.07),rgba(11,23,38,.5))}
  .nuovo ul{list-style:none;margin-top:18px;display:grid;gap:12px}
  .nuovo li{display:flex;align-items:baseline;gap:12px;font-size:21px;line-height:1.3}
  .nuovo b{color:var(--text);font-weight:600;white-space:nowrap} .nuovo em{font-style:normal;color:var(--text2)} .nuovo em::before{content:"— ";color:var(--muted)}
  .spunta{flex:0 0 24px;align-self:center;display:grid} .spunta svg{width:24px;height:24px}
  .cta{position:absolute;top:1748px;left:50%;transform:translateX(-50%);padding:22px 54px;border-radius:999px;font-family:Sora,sans-serif;font-weight:700;font-size:28px;color:#03111a;
    background:linear-gradient(100deg,var(--cyan2),var(--cyan) 35%,var(--emerald) 70%,var(--amber2));box-shadow:0 20px 60px -16px rgba(34,211,238,.6)}
  .piede{position:absolute;bottom:40px;left:0;right:0;text-align:center;font-family:'Source Code Pro',monospace;font-size:17px;letter-spacing:.06em;color:var(--muted)}
  `
  );

// --- 6. Infografica della versione definitiva (1080×1920) ----------------------------
const TAPPE = [
  ["Parser LALR(1) non ambiguo", "L'italiano diventa codice deterministico, per costruzione.", ""],
  ["Logica e conseguenze", "Condizioni con e / oppure / non, conseguenze multiple.", ""],
  ["Stati e contatori", "La memoria della storia: ciò che il mondo ricorda.", ""],
  ["Regole «Invece di»", "L'azione del giocatore, intercettata e riscritta.", ""],
  ["Personaggi e dialoghi", "Conversazioni ramificate, scelte con condizioni.", ""],
  ["Demoni ed eventi a turni", "Il mondo che si muove da solo, turno dopo turno.", ""],
  ["Un mondo vivo", "Buio e luce, pronomi, personaggi che camminano.", ""],
  ["Il linguaggio completo", "Il caso, le quantità, il mondo che si trasforma.", "1.0"],
  ["Salvataggi e collaudo", "Le partite si salvano; il collaudo gioca da solo.", "1.2"],
  ["«Prima di», pulsanti-verbo", "Regole più fini; si gioca anche toccando.", "1.3 · 1.4"],
];
const infograficaVersione = () =>
  pagina(
    `
  <div class="alone" style="left:200px;top:60px;width:680px;height:400px;background:rgba(34,211,238,.12)"></div>
  <header>
    <img class="logo" src="${LOGO}" alt="">
    <p class="occhiello" style="font-size:17px;letter-spacing:.42em;color:var(--text2)">FAVELLA 1 · versione definitiva</p>
    <h1 class="numero ink-caldo">${MOTORE}</h1>
    <p class="sotto">Il linguaggio è completo · Favella Studio ${STUDIO} · manuale in terza edizione</p>
  </header>
  <h2>Dieci tappe che hanno fatto FAVELLA</h2>
  <ol>${TAPPE.map(
    ([t, d, v], i) => `<li><span class="n">${String(i + 1).padStart(2, "0")}</span><span class="c"><b>${t}</b><em>${d}</em></span>${v ? `<span class="v">${v}</span>` : ""}</li>`
  ).join("")}</ol>
  <footer><p><b>${TEST}</b> test verdi · <b>${COLLAUDO}</b> di collaudo · <b>0</b> ambiguità · <b>100%</b> italiano</p><p class="url">favella.eu · github.com/Pitz72/FAVELLA1 · open source, MIT</p></footer>`,
    `
  .griglia{-webkit-mask-image:radial-gradient(80% 30% at 50% 12%,#000 10%,transparent 80%)}
  header{position:absolute;top:70px;left:0;right:0;text-align:center}
  .logo{width:210px;filter:drop-shadow(0 8px 34px rgba(34,211,238,.4));margin-bottom:10px}
  .numero{font-family:Sora,sans-serif;font-weight:800;font-size:230px;letter-spacing:-.05em;line-height:1;margin:10px 0 18px;filter:drop-shadow(0 0 40px rgba(34,211,238,.2))}
  .sotto{font-family:Sora,sans-serif;font-weight:600;font-size:23px;color:var(--text2)}
  h2{position:absolute;top:668px;left:0;right:0;text-align:center;font-family:'Source Code Pro',monospace;font-weight:600;font-size:20px;letter-spacing:.3em;text-transform:uppercase}
  ol{position:absolute;top:728px;left:76px;right:76px;list-style:none;display:grid;gap:12px}
  li{display:flex;align-items:center;gap:24px;padding:12px 22px;border-radius:18px;background:linear-gradient(180deg,rgba(15,32,50,.7),rgba(11,23,38,.5));border:1px solid rgba(120,190,220,.12)}
  .n{flex:0 0 58px;height:58px;border-radius:16px;display:grid;place-items:center;font-family:Sora,sans-serif;font-weight:800;font-size:26px;color:#03111a;background:linear-gradient(140deg,var(--cyan2),var(--emerald))}
  .c{flex:1}
  .c b{display:block;font-family:Sora,sans-serif;font-weight:700;font-size:26px;letter-spacing:-.01em}
  .c em{display:block;font-style:normal;font-size:19px;color:var(--text2);margin-top:3px}
  .v{font-family:'Source Code Pro',monospace;font-weight:600;font-size:16px;letter-spacing:.1em;color:var(--amber2);border:1px solid rgba(245,158,11,.45);border-radius:999px;padding:7px 14px}
  footer{position:absolute;bottom:58px;left:0;right:0;text-align:center;font-family:'Source Code Pro',monospace;font-size:19px;letter-spacing:.05em;color:var(--muted)}
  footer b{color:var(--cyan);font-weight:600} footer .url{margin-top:12px;font-size:17px}
  `
  );

// --- Render ----------------------------------------------------------------------------
const LAVORI = [
  { html: bannerFavella(), w: 1260, h: 540, out: join(MAT, `banner-favella1-v${MOTORE}.png`), copie: [join(REPO, "assets", "banner.png")] },
  { html: bannerStudio(true), w: 1260, h: 540, out: join(MAT, `banner-favella-studio-v${STUDIO}.png`) },
  {
    html: bannerStudio(false), w: 960, h: 540, tipo: "jpeg", out: join(REPO, "studio", "branding", "favella-studio-banner.jpg"),
    copie: [join(SITO, "public", "studio", "favella-studio-banner.jpg")],
  },
  { html: social(), w: 1280, h: 640, tipo: "jpeg", out: join(MAT, "social-preview-github.jpg") },
  { html: infograficaSito(), w: 1920, h: 1080, out: join(MAT, `infografica-sito-favella-eu-v${VERSIONE_SITO}.png`) },
  { html: infograficaManuale(), w: 1080, h: 1920, out: join(MAT, "infografica-manuale-terza-edizione.png") },
  { html: infograficaVersione(), w: 1080, h: 1920, out: join(MAT, `infografica-favella1-v${MOTORE}.png`) },
];

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
for (const l of LAVORI) {
  await page.setViewport({ width: l.w, height: l.h, deviceScaleFactor: 2 });
  const file = join(tmp, "pagina.html");
  writeFileSync(file, l.html, "utf8");
  await page.goto("file:///" + file.replace(/\\/g, "/"), { waitUntil: "load", timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 400));
  const opzioni = l.tipo === "jpeg" ? { type: "jpeg", quality: 92 } : { type: "png" };
  await page.screenshot({ path: l.out, ...opzioni });
  for (const c of l.copie ?? []) copyFileSync(l.out, c);
  console.log("  ✓", l.out.replace(REPO, "").replace(/\\/g, "/"), (l.copie ?? []).length ? `(+ ${l.copie.length} copia)` : "");
}
await browser.close();
rmSync(tmp, { recursive: true, force: true });
console.log(`Fatto: motore ${MOTORE}, Studio ${STUDIO}, sito ${VERSIONE_SITO}, ${TEST} test, manuale ${PAGINE_MANUALE} pp.`);
