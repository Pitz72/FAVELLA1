// ====================================================================
//  Rifà le schermate di Favella Studio per il sito (public/studio/*.webp).
// --------------------------------------------------------------------
//  Pilota il banco di prova nel browser (ponte col motore vero + interfaccia)
//  con Chromium headless e fotografa ogni sezione sulla storia d'esempio
//  «La Casa di Via Stradivari». Non scrive niente nel progetto d'esempio.
//
//  Prima:   node studio/dev-web/bridge.mjs            (ponte su :5301, progetto d'esempio)
//           npm --prefix studio run dev:web           (interfaccia su :5310)
//  Poi:     node scripts/foto-studio.mjs [http://localhost:5310]
// ====================================================================
import puppeteer from "puppeteer";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const qui = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(qui, "..", "public", "studio");
const URL = process.argv[2] ?? "http://localhost:5310";
const W = 1600;
const H = 1000;

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });

// Clic su un elemento per testo (contenuto che include `testo`).
const clicca = async (selettore, testo, indice = 0) => {
  const ok = await page.evaluate(
    (sel, t, i) => {
      const els = [...document.querySelectorAll(sel)].filter((e) => e.textContent.trim().includes(t));
      if (!els[i]) return false;
      els[i].click();
      return true;
    },
    selettore,
    testo,
    indice
  );
  if (!ok) console.warn(`  ! non trovo «${testo}» in ${selettore}`);
  return ok;
};
const scatta = async (nome) => {
  await pausa(900);
  await page.screenshot({ path: join(OUT, `${nome}.webp`), type: "webp", quality: 84 });
  console.log("  ✓", nome);
};

await page.goto(URL, { waitUntil: "networkidle2", timeout: 60000 });
await page.waitForFunction(() => window.favella, { timeout: 30000 });
await pausa(2500); // il motore deve essere pronto

// 1 · accoglienza
await scatta("accoglienza");

// 2 · apre il progetto e il file della storia
await clicca("button", "Apri una cartella");
await pausa(1800);
await clicca(".accoglienza-file", "storia.fav");
await pausa(2500);
await scatta("storia");

// 3 · Mondo → Stanze
await clicca(".sezione", "Mondo");
await pausa(1800);
await clicca(".elenco-voce", "L'ingresso");
await pausa(900);
await scatta("stanze");

// 4 · Mondo → Mappa (con la scheda delle uscite di una stanza)
await clicca(".linguetta", "Mappa");
await pausa(2200);
await clicca(".react-flow__node", "L'ingresso");
await pausa(900);
await scatta("mappa");

// 5 · Mondo → Oggetti
await clicca(".linguetta", "Oggetti");
await pausa(1500);
await clicca(".elenco-voce", "La torcia");
await pausa(900);
await scatta("oggetti");

// 6 · Personaggi → Personaggi, poi Dialoghi
await clicca(".sezione", "Personaggi");
await pausa(1800);
await clicca(".elenco-voce", "Il notaio");
await pausa(900);
await scatta("personaggi");
await clicca(".linguetta", "Dialoghi");
await pausa(1800);
await scatta("dialoghi");

// 7 · Regole → Regole ed eventi, poi Parole e comandi
await clicca(".sezione", "Regole");
await pausa(1800);
await scatta("regole");
await clicca(".linguetta", "Parole e comandi");
await pausa(1500);
await scatta("parole");

// 8 · Prova: la partita coi pulsanti-verbo
await clicca(".sezione", "Prova");
await pausa(800);
await clicca(".btn-prova", "Prova la storia");
await pausa(3000);
await clicca("button", "Guarda");
await pausa(1500);
await scatta("prova");

await browser.close();
console.log("Fatto: schermate in", OUT);
