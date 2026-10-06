// ====================================================================
//  Le schermate della «Guida di Favella Studio» (studio/guida/immagini/).
// --------------------------------------------------------------------
//  Pilota il banco di prova nel browser (ponte col motore vero + interfaccia)
//  con Chromium headless, sulla storia d'esempio «La Casa di Via Stradivari».
//  Tema «carta» (chiaro: sulla pagina bianca si legge meglio), 1440×900 a
//  densità 2. Scrive anche immagini/posizioni.json: i riquadri degli elementi
//  della finestra, che la guida usa per i numeri sopra le figure.
//
//  ⚠ Fa delle modifiche (un errore scritto apposta, un'eliminazione annullata)
//  senza mai salvare: usare comunque una COPIA del progetto d'esempio.
//
//  Prima:   node studio/dev-web/bridge.mjs <copia>/materiale-didattico   (:5301)
//           npm --prefix studio run dev:web                              (:5310)
//  Poi:     node scripts/foto-guida-studio.mjs [http://localhost:5310]
//  (FAVELLA_FOTO_OUT=<cartella> scrive altrove, per rifare una sola schermata.)
// ====================================================================
import puppeteer from "puppeteer";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync } from "node:fs";

const qui = dirname(fileURLToPath(import.meta.url));
const OUT = process.env.FAVELLA_FOTO_OUT ? resolve(process.env.FAVELLA_FOTO_OUT) : resolve(qui, "..", "..", "studio", "guida", "immagini");
mkdirSync(OUT, { recursive: true });
const URL = process.argv[2] ?? "http://localhost:5310";
const W = 1440;
const H = 900;

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
page.on("dialog", (d) => d.accept());
await page.setViewport({ width: W, height: H, deviceScaleFactor: 2 });

let aspetto = { tema: "carta", contrasto: "normale" };
await page.evaluateOnNewDocument((a) => {
  localStorage.setItem("favella.aspetto", a);
}, JSON.stringify(aspetto));

const posizioni = { finestra: { w: W, h: H } };

// --- Aiuti -------------------------------------------------------------------------
const el = async (sel, testo = null, i = 0) => {
  const h = await page.evaluateHandle(
    (s, t, i) => [...document.querySelectorAll(s)].filter((e) => !t || e.textContent.includes(t))[i] ?? null,
    sel,
    testo,
    i
  );
  const e = h.asElement();
  if (!e) console.warn(`  ! non trovo «${testo ?? ""}» in ${sel}`);
  return e;
};
const clicca = async (sel, testo = null, i = 0) => {
  const e = await el(sel, testo, i);
  if (e) {
    await e.evaluate((x) => x.scrollIntoView({ block: "nearest" }));
    await e.click();
  }
  return !!e;
};
const riquadro = async (e) => (e ? await e.boundingBox() : null);
const unione = (boxes, pad = 0) => {
  const b = boxes.filter(Boolean);
  const x0 = Math.max(0, Math.min(...b.map((r) => r.x)) - pad);
  const y0 = Math.max(0, Math.min(...b.map((r) => r.y)) - pad);
  const x1 = Math.min(W, Math.max(...b.map((r) => r.x + r.width)) + pad);
  const y1 = Math.min(H, Math.max(...b.map((r) => r.y + r.height)) + pad);
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
};
const inCima = () =>
  page.evaluate(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });
const scatta = async (nome, clip = null, attesa = 700) => {
  await page.mouse.move(1, 1); // niente evidenziazioni da puntatore
  await inCima();
  await pausa(attesa);
  const o = { path: join(OUT, `${nome}.png`), type: "png" };
  if (clip) o.clip = clip;
  await page.screenshot(o);
  console.log("  ✓", nome, clip ? `(${Math.round(clip.width)}×${Math.round(clip.height)})` : "");
};
// Un elemento solo: lo fotografa Chromium, che lo porta in vista da sé (un ritaglio a
// coordinate sbaglia quando la pagina è scorsa).
const scattaEl = async (nome, sel, testo = null) => {
  const e = await el(sel, testo);
  if (!e) return;
  await page.mouse.move(1, 1);
  await pausa(400);
  await e.screenshot({ path: join(OUT, `${nome}.png`), type: "png" });
  await inCima();
  console.log("  ✓", nome);
};
// Un menu a tendina: sta in cima alla finestra e si chiude se la pagina scorre, quindi
// si ritaglia dove sta, senza portarlo in vista.
const scattaMenu = async (nome, sel) => {
  const e = await el(sel);
  if (!e) return;
  // L'animazione d'entrata (opacità da 0) a volte resta al primo fotogramma: per la
  // fotografia il menu si mostra già fermo.
  await e.evaluate((m) => {
    m.style.animation = "none";
    m.style.opacity = "1";
  });
  await pausa(300);
  const b = await e.boundingBox();
  await page.screenshot({ path: join(OUT, `${nome}.png`), type: "png", clip: unione([b], 12) });
  console.log("  ✓", nome);
};
const ricorda = async (nome, sel, testo = null) => {
  const b = await riquadro(await el(sel, testo));
  if (b) posizioni[nome] = { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) };
};
const sezione = async (nome) => {
  await clicca(".sezione", nome);
  await pausa(1600);
};
const linguetta = async (nome) => {
  await clicca(".linguetta", nome);
  await pausa(1400);
};
const esc = async () => {
  await page.keyboard.press("Escape");
  await pausa(400);
};
const apriStoria = async () => {
  await page.goto(URL, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForFunction(() => window.favella, { timeout: 30000 });
  await pausa(2500);
};
const apriProgetto = async () => {
  await clicca("button", "Apri una cartella");
  await pausa(3000);
};

// === 1. Accoglienza e finestra ======================================================
await apriStoria();
await scatta("accoglienza");
await apriProgetto();
await scatta("finestra");
await ricorda("barra", "header.barra");
await ricorda("sezioni", "nav.sezioni");
await ricorda("esplora", ".esplora");
await ricorda("schede", ".file-schede");
await ricorda("editor", ".monaco-editor");
await ricorda("stato", ".stato");
await ricorda("prova", ".btn-prova");
await ricorda("salva", ".gruppo-salva");
await ricorda("altre", 'button[aria-label="Altre azioni"]');
await ricorda("selettore", ".selettore-file");
await scattaEl("barra", "header.barra", null);

await clicca('button[aria-label="Altre azioni"]');
await pausa(500);
await scattaMenu("menu-altre-azioni", ".menu-largo");
await esc();
await clicca('button[aria-label="Altri modi di salvare"]');
await pausa(500);
await scattaMenu("menu-salva", ".gruppo-salva .menu");
await esc();
await clicca(".selettore-file");
await pausa(500);
await scattaMenu("menu-file", ".menu-sinistra");
await esc();

await scattaEl("esplora", ".esplora", null);
await clicca('button[aria-label="Come si divide una storia in più file"]');
await pausa(500);
await scattaEl("esplora-guida", ".esplora", null);
await clicca('button[aria-label="Come si divide una storia in più file"]');

// === 2. Mondo: stanze, oggetti, mappa =================================================
await sezione("Mondo");
await clicca(".elenco-voce", "L'ingresso");
await pausa(800);
await scatta("stanze");
await ricorda("m-testa", ".lavoro-testa");
await ricorda("m-linguette", ".linguette");
await ricorda("m-elenco", ".elenco");
await ricorda("m-dove", ".lavoro-controlli");
await scattaEl("uscite", "section.riquadro", "Uscite");
await clicca(".lavoro-controlli .interruttore", null);
await pausa(1500);
await scatta("testo-accanto");
await clicca(".lavoro-controlli .interruttore", null);
await pausa(800);

await clicca("button", "Nuova stanza");
await pausa(700);
await scattaEl("nuova-stanza", "section.riquadro", "Nuova stanza");
await clicca("section.riquadro button", "Annulla");
await pausa(500);

await clicca(".elenco-voce", "La soffitta");
await pausa(800);
await clicca("button", "Elimina la stanza");
await pausa(2000);
await scattaEl("elimina", ".finestra", null);
await clicca(".finestra button", "Annulla");
await pausa(500);

await linguetta("Oggetti");
await clicca(".elenco-voce", "La torcia");
await pausa(800);
await scatta("oggetti");
await scattaEl("oggetti-stati", "section.riquadro", "Stati a due valori");
await scattaEl("oggetti-nomi", "section.riquadro", "Altri nomi");
await clicca(".elenco-voce", "La credenza");
await pausa(800);
await scattaEl("contenitore", "section.riquadro", "Che cosa c");

await linguetta("Mappa");
await pausa(1200);
await clicca(".react-flow__node", "L'ingresso");
await pausa(900);
await scatta("mappa");
await esc();
await clicca('button[aria-label="Chiudi la scheda"]');
await pausa(500);
{
  // Un collegamento dritto in verticale: il centro del suo riquadro sta sulla linea.
  const ok = await page.evaluate(() => {
    const archi = [...document.querySelectorAll(".react-flow__edge")];
    const a = archi.find((e) => {
      const r = e.getBoundingClientRect();
      return r.width < 12 && r.height > 40;
    });
    if (!a) return null;
    const r = a.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (ok) {
    await page.mouse.click(ok.x, ok.y);
    await pausa(900);
    await scatta("mappa-collegamento");
    await esc();
  } else console.warn("  ! nessun collegamento verticale da cliccare");
}

// === 3. Personaggi e dialoghi ===========================================================
await sezione("Personaggi");
await clicca(".elenco-voce", "Il notaio");
await pausa(800);
await scatta("personaggi");
await linguetta("Dialoghi");
await pausa(800);
await scatta("dialoghi");
await clicca('button[aria-label="Condizione e conseguenze"]');
await pausa(900);
await scattaEl("risposta", ".finestra", null);
await clicca(".finestra button", "Annulla");
await pausa(400);
await clicca("button", "Nuovo nodo");
await pausa(900);
await scattaEl("nuovo-nodo", ".finestra", null);
await clicca(".finestra button", "Annulla");
await pausa(400);

// === 4. Regole, stati, parole ===========================================================
await sezione("Regole");
await scatta("regole");
await clicca("button", "Modifica");
await pausa(900);
await scattaEl("regola", ".finestra", null);
await page.evaluate(() => {
  const c = document.querySelector(".finestra-corpo");
  if (c) c.scrollTop = c.scrollHeight;
});
await pausa(500);
await scattaEl("regola-fine", ".finestra", null);
await clicca(".finestra button", "Annulla");
await pausa(400);
await clicca("button", "Nuova regola");
await pausa(900);
await scattaEl("nuova-regola", ".finestra", null);
await clicca(".finestra button", "Evento");
await pausa(500);
await scattaEl("nuovo-evento", ".finestra", null);
await clicca(".finestra button", "Demone");
await pausa(500);
await scattaEl("nuovo-demone", ".finestra", null);
await clicca(".finestra button", "Annulla");
await pausa(400);
await linguetta("Stati e contatori");
await scatta("stati");
await linguetta("Parole e comandi");
await scatta("parole");

// === 5. Prova ===========================================================================
await sezione("Prova");
await scatta("prova-vuota");
await clicca(".btn-prova", "Prova la storia");
await pausa(3000);
await scatta("prova");
await clicca(".pg button", "Prendi");
await pausa(600);
await scattaEl("pulsanti-frase", ".pg", null);
await clicca(".pg button", "Torcia");
await pausa(1500);
await scatta("prova-presa");
await scattaEl("prova-partita", ".prova-lato", null);
await clicca(".prova-lato .linguetta", "Mappa");
await pausa(1500);
await scattaEl("prova-mappa", ".prova-lato", null);
await clicca(".prova-lato .linguetta", "Passo passo");
await pausa(1200);
await scattaEl("prova-passo", ".prova-lato", null);
await clicca(".prova-lato .linguetta", "Partita");

// === 6. Lavorare senza paura ===========================================================
await sezione("Mondo");
await linguetta("Oggetti");
await clicca(".elenco-voce", "Il vaso di gerani");
await pausa(800);
await clicca("button", "Elimina l’oggetto");
await pausa(2000);
await clicca(".finestra .btn-pericolo");
await pausa(2500);
await scatta("avviso-annulla");
await ricorda("avvisi", ".avvisi");
await scattaEl("avviso", ".avvisi", null);
await clicca(".avvisi button", "Annulla");
await pausa(2500);

// Un errore scritto apposta (mai salvato), per i problemi e per la domanda sui file.
await sezione("Storia");
await page.click(".monaco-editor .view-lines");
await page.keyboard.down("Control");
await page.keyboard.press("End");
await page.keyboard.up("Control");
await page.keyboard.press("Enter");
await page.keyboard.type("La soffitta è sopra.", { delay: 20 });
await pausa(3500);
await clicca(".stato-problemi");
await pausa(1200);
await scatta("problemi");
await scattaEl("problemi-pannello", ".problemi");
await clicca('button[aria-label="Altre azioni"]');
await pausa(500);
await clicca(".menu-largo [role=menuitem]", "Apri una cartella");
await pausa(1200);
await scattaEl("non-salvati", ".finestra", null);
await clicca(".finestra button", "Annulla");
await pausa(500);

// === 7. I quattro aspetti =============================================================
for (const [tema, contrasto] of [
  ["notte", "normale"],
  ["carta", "normale"],
  ["notte", "alto"],
  ["carta", "alto"],
]) {
  await page.evaluate((a) => localStorage.setItem("favella.aspetto", a), JSON.stringify({ tema, contrasto }));
  await page.evaluateOnNewDocument((a) => localStorage.setItem("favella.aspetto", a), JSON.stringify({ tema, contrasto }));
  await apriStoria();
  await apriProgetto();
  await sezione("Mondo");
  await clicca(".elenco-voce", "L'ingresso");
  await pausa(900);
  await scatta(`aspetto-${tema}${contrasto === "alto" ? "-alto" : ""}`, { x: 0, y: 0, width: 1100, height: 690 });
}

writeFileSync(join(OUT, "posizioni.json"), JSON.stringify(posizioni, null, 2));
await browser.close();
console.log("Fatto: schermate in", OUT);
