// ====================================================================
//  FAVELLA 1 — Self-hosting dei font (GDPR: niente chiamate a Google)
// --------------------------------------------------------------------
//  Scarica i woff2 dei font usati dal sito da Google Fonts e riscrive il
//  CSS perché punti a file locali in /fonts/. Così il browser non contatta
//  più fonts.googleapis.com / fonts.gstatic.com: nessun trasferimento
//  dell'IP a terzi al caricamento della pagina.
//
//  Uso (una tantum / quando cambiano i font):  node scripts/fetch-fonts.mjs
// ====================================================================
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "..", "public", "fonts");
mkdirSync(OUT_DIR, { recursive: true });

// Stessa identica richiesta che era nell'index.html.
const CSS_URL =
  "https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600&family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Source+Code+Pro:wght@400;500;600&display=swap";

// UA da browser moderno → Google serve woff2 (il default sarebbe ttf).
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

console.log("Scarico il CSS di Google Fonts…");
let css = await (await fetch(CSS_URL, { headers: { "User-Agent": UA } })).text();

const urls = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/g)].map((m) => m[1]);
const unique = [...new Set(urls)];
console.log(`Trovati ${unique.length} file woff2.`);

for (const url of unique) {
  const name = url.split("/").pop();
  const buf = Buffer.from(await (await fetch(url, { headers: { "User-Agent": UA } })).arrayBuffer());
  writeFileSync(resolve(OUT_DIR, name), buf);
  css = css.split(url).join(`/fonts/${name}`);
  console.log(`  ✓ ${name} (${(buf.length / 1024).toFixed(1)} KB)`);
}

writeFileSync(resolve(OUT_DIR, "fonts.css"), css, "utf8");
console.log(`\nScritto public/fonts/fonts.css (${unique.length} font self-hosted).`);
