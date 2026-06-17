// Genera l'infografica 16:9 «FAVELLA.EU — il sito» nello stile delle altre
// (palette di marca, gradienti, chip arrotondati). Output: SVG → poi magick PNG.
import { writeFileSync } from "node:fs";

const W = 1920, H = 1080;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const F = "'Segoe UI','Trebuchet MS',Arial,sans-serif";

const left = [
  ["Inizio", "Il linguaggio in cui l'italiano è il codice."],
  ["Il progetto", "La visione e l'ingegneria: parser LALR(1), 681 test."],
  ["Novità & roadmap", "Changelog, traguardo 1.0.0 e prossimi passi."],
  ["Guida rapida", "Il manuale completo del linguaggio, anche in PDF."],
  ["Corso interattivo", "Ventuno «cassette», con il motore FAVELLA vero."],
];
const right = [
  ["Programma", "Scrivi ed esegui storie nel browser, senza installare."],
  ["Galleria", "Avventure testuali giocabili dal vivo."],
  ["Libreria", "Moduli .fav pronti da includere nelle storie."],
  ["Collabora", "Progetto open source: codice, storie, idee."],
];

const ROW_TOP = 576, STEP = 86, CHIP = 58;

function bullet(chipX, textX, divX2, top, title, sub) {
  const cx = chipX + CHIP / 2, cy = top + CHIP / 2;
  const check = `${cx - 12},${cy + 1} ${cx - 4},${cy + 9} ${cx + 13},${cy - 11}`;
  return `
  <rect x="${chipX}" y="${top}" width="${CHIP}" height="${CHIP}" rx="16" fill="url(#chip)"/>
  <polyline points="${check}" fill="none" stroke="#050a14" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="${textX}" y="${top + 30}" font-family="${F}" font-size="30" font-weight="700" fill="#eaf3fb">${esc(title)}</text>
  <text x="${textX}" y="${top + 58}" font-family="${F}" font-size="21" fill="#9fb3c8">${esc(sub)}</text>
  <rect x="${textX}" y="${top + 74}" width="${divX2 - textX}" height="1" fill="#1e3a52" fill-opacity="0.5"/>`;
}

let bullets = "";
left.forEach((it, i) => { bullets += bullet(140, 224, 940, ROW_TOP + i * STEP, it[0], it[1]); });
right.forEach((it, i) => { bullets += bullet(1016, 1100, 1810, ROW_TOP + i * STEP, it[0], it[1]); });

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
  <stop offset="0" stop-color="#050a14"/><stop offset="0.5" stop-color="#0b1726"/><stop offset="1" stop-color="#0f2032"/>
</linearGradient>
<linearGradient id="ver" x1="0" y1="0" x2="1" y2="0.4">
  <stop offset="0" stop-color="#5cf3ff"/><stop offset="0.42" stop-color="#22d3ee"/>
  <stop offset="0.72" stop-color="#f59e0b"/><stop offset="1" stop-color="#fb923c"/>
</linearGradient>
<linearGradient id="chip" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#34d399"/>
</linearGradient>
<radialGradient id="glowc" cx="0.5" cy="0.5" r="0.5">
  <stop offset="0" stop-color="#22d3ee" stop-opacity="0.40"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/>
</radialGradient>
<radialGradient id="glowa" cx="0.5" cy="0.5" r="0.5">
  <stop offset="0" stop-color="#fb923c" stop-opacity="0.28"/><stop offset="1" stop-color="#fb923c" stop-opacity="0"/>
</radialGradient>
<linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#22d3ee" stop-opacity="0"/><stop offset="0.5" stop-color="#22d3ee" stop-opacity="0.9"/>
  <stop offset="1" stop-color="#fb923c" stop-opacity="0"/>
</linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<ellipse cx="960" cy="180" rx="900" ry="460" fill="url(#glowc)"/>
<ellipse cx="500" cy="380" rx="620" ry="360" fill="url(#glowa)"/>
<rect x="24" y="24" width="${W - 48}" height="${H - 48}" rx="40" fill="none" stroke="#1e3a52" stroke-opacity="0.6" stroke-width="2"/>

<text x="960" y="132" font-family="${F}" font-size="30" letter-spacing="10" text-anchor="middle" fill="#62788d">IL SITO UFFICIALE · FAVELLA 1.0.0</text>
<text x="960" y="318" font-family="${F}" font-size="196" font-weight="800" letter-spacing="2" text-anchor="middle" fill="url(#ver)">FAVELLA.EU</text>
<text x="960" y="392" font-family="${F}" font-size="30" font-weight="600" text-anchor="middle" fill="#9fb3c8">L'italiano è il linguaggio di programmazione</text>
<rect x="360" y="450" width="1200" height="3" rx="1.5" fill="url(#rule)"/>
<text x="960" y="516" font-family="${F}" font-size="30" font-weight="700" letter-spacing="2" text-anchor="middle" fill="#eaf3fb">TUTTO QUELLO CHE TROVI NEL SITO</text>
${bullets}
<rect x="360" y="1006" width="1200" height="3" rx="1.5" fill="url(#rule)"/>
<text x="960" y="1046" font-family="${F}" font-size="24" font-weight="700" text-anchor="middle" fill="#5cf3ff">681 test verdi · 0 ambiguità · 100% italiano · sito pre-renderizzato · open source</text>
</svg>
`;

writeFileSync(new URL("./infografica-sito-favella-eu.svg", import.meta.url), svg, "utf8");
console.log("SVG scritto: infografica-sito-favella-eu.svg");
