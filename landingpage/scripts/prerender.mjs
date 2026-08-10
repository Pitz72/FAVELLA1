// ====================================================================
//  FAVELLA 1 — Pre-rendering statico del sito (SEO)
// --------------------------------------------------------------------
//  Trasforma la SPA in un sito di file HTML veri: per ogni rotta apre la
//  pagina in Chromium headless, aspetta che React abbia renderizzato il
//  contenuto e applicato i metadati (window.__SEO__), poi salva l'HTML
//  finito in dist/<rotta>/index.html. Così i crawler ricevono HTML pieno
//  e ogni URL ha i suoi <title>/description/Open Graph/JSON-LD.
//
//  Da lanciare DOPO `vite build`.  Uso:  node scripts/prerender.mjs
// ====================================================================
import { fileURLToPath } from "node:url";
import { dirname, resolve, join, extname } from "node:path";
import { readFileSync, existsSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");

if (!existsSync(join(DIST, "index.html"))) {
  console.error("dist/index.html non trovato: lancia prima `vite build`.");
  process.exit(1);
}

// --------------------------------------------------------------------
//  Server statico minimale su dist/, con fallback SPA.
//  Una richiesta a /progetto (file non ancora esistente) serve index.html,
//  così il router lato client renderizza la pagina giusta dal pathname.
// --------------------------------------------------------------------
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".wasm": "application/wasm",
  ".map": "application/json",
};

const indexHtml = readFileSync(join(DIST, "index.html"));

const server = createServer((req, res) => {
  let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  let filePath = join(DIST, urlPath);
  try {
    if (existsSync(filePath) && statSync(filePath).isFile()) {
      const ext = extname(filePath);
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
      res.end(readFileSync(filePath));
      return;
    }
  } catch {
    /* ignora, cade nel fallback */
  }
  // Fallback SPA: ogni rotta sconosciuta riceve l'index.
  res.writeHead(200, { "Content-Type": MIME[".html"] });
  res.end(indexHtml);
});

await new Promise((r) => server.listen(0, "127.0.0.1", r));
const PORT = server.address().port;
const base = `http://127.0.0.1:${PORT}`;

// --------------------------------------------------------------------
//  Crawl + snapshot
// --------------------------------------------------------------------
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();

// L'elenco rotte arriva dall'app stessa (window.__ROUTES__ = ROUTE_PATHS).
// Usiamo `domcontentloaded` (veloce e affidabile) e poi aspettiamo il render:
// le pagine col motore Pyodide possono non raggiungere mai `networkidle`.
await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForFunction(() => !!window.__ROUTES__, { timeout: 30000 });
const routes = await page.evaluate(() => window.__ROUTES__ || ["/"]);
console.log(`Rotte da pre-renderizzare: ${routes.join(", ")}`);

let count = 0;
for (const route of routes) {
  const url = `${base}${route}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
  // Aspetta che React abbia popolato #root e applicato i metadati SEO.
  await page
    .waitForFunction(
      () => {
        const root = document.getElementById("root");
        return !!window.__SEO__ && !!root && root.childElementCount > 0;
      },
      { timeout: 30000 }
    )
    .catch(() => console.warn(`  ! ${route}: timeout sul render, salvo comunque`));
  // Piccolo assestamento per animazioni/effetti di primo paint.
  await new Promise((r) => setTimeout(r, 400));

  const html = await page.evaluate(() => document.documentElement.outerHTML);
  const full = `<!DOCTYPE html>\n${html}\n`;

  const outDir = route === "/" ? DIST : join(DIST, route);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), full, "utf8");
  count++;
  console.log(`  ✓ ${route === "/" ? "/index.html" : route + "/index.html"}`);
}

await browser.close();
server.close();
console.log(`\nPre-renderizzate ${count} pagine in dist/.`);

// --------------------------------------------------------------------
//  sitemap.xml — elenco di tutte le rotte con data di build.
// --------------------------------------------------------------------
const SITE = "https://www.favella.eu";
const today = new Date().toISOString().slice(0, 10);
const urls = routes
  .map((r) => {
    const loc = r === "/" ? `${SITE}/` : `${SITE}${r}`;
    const priority = r === "/" ? "1.0" : "0.8";
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  })
  .join("\n");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
writeFileSync(join(DIST, "sitemap.xml"), sitemap, "utf8");
console.log(`  ✓ sitemap.xml (${routes.length} URL)`);
