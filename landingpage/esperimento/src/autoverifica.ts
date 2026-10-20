// ====================================================================
//  Autoverifica: avvia il gioco vero (Pyodide + motore + avventura),
//  gioca qualche comando e controlla le risposte; prova anche la voce del
//  doppiaggio (indice, una parte per voce, il trailer). Si apre con
//  ?autoverifica; nella versione desktop la lancia `--autoverifica`, e la
//  CI la esegue sul pacchetto appena costruito prima di pubblicarlo.
// ====================================================================
import { avviaGioco } from "./lib/favellaRuntime";
import { VIAGGIATORE_GAME } from "./data/viaggiatore";
import { riferisciAutoverifica } from "./lib/desktop";
import branoIntro from "./assets/intro.mp3";
import { analizza } from "./gioco/testo";
import { tabella, partiDelBlocco, type Testi } from "./gioco/parti";

/** La voce del doppiaggio: l'indice, una parte decodificata per ogni voce che il pacchetto contiene, la
 *  traccia del trailer, e le parti del testo d'avvio ritrovate dal testo stampato. */
async function provaLaVoce(testoAvvio: string, nota: (r: string) => void): Promise<boolean> {
  const base = `${import.meta.env.BASE_URL}voce/`;
  const r = await fetch(`${base}indice.json`);
  if (!r.ok) { nota(`KO voce: indice HTTP ${r.status}`); return false; }
  type Indice = { estensione: string; parti: Record<string, number>; cartelle?: string[]; testi: Testi };
  const indice = await r.json() as Indice;
  let ok = true;
  // dove sta ogni parte: la cartella principale e quelle che l'indice nomina (le voci fuori dalla licenza libera)
  const dove = new Map<string, { url: string; ms: number }>();
  for (const [id, ms] of Object.entries(indice.parti)) dove.set(id, { url: `${base}${id}${indice.estensione}`, ms });
  for (const c of indice.cartelle ?? []) {
    const rc = await fetch(`${base}${c}/indice.json`);
    if (!rc.ok) { ok = false; nota(`KO voce: manca ${c}/indice.json (HTTP ${rc.status})`); continue; }
    const altro = await rc.json() as Indice;
    for (const [id, ms] of Object.entries(altro.parti)) dove.set(id, { url: `${base}${c}/${id}${altro.estensione}`, ms });
  }
  // una parte per voce, decodificata davvero: la durata deve essere quella dell'indice
  const perVoce = new Map<string, string>();
  for (const id of dove.keys()) {
    const v = indice.testi[id]?.[0];
    if (v && !perVoce.has(v)) perVoce.set(v, id);
  }
  const ctx = new OfflineAudioContext(1, 1, 48000);
  for (const [v, id] of perVoce) {
    const d = dove.get(id)!;
    try {
      const b = await ctx.decodeAudioData(await (await fetch(d.url)).arrayBuffer());
      if (Math.abs(b.duration * 1000 - d.ms) > 60) { ok = false; nota(`KO voce ${v}: ${id} dura ${Math.round(b.duration * 1000)} ms, l'indice ${d.ms}`); }
    } catch (e) {
      ok = false; nota(`KO voce ${v}: ${id} non si decodifica (${e instanceof Error ? e.message : e})`);
    }
  }
  if (ok) nota(`ok voce: ${dove.size} parti, ${perVoce.size} voci, una per voce decodificata`);
  // il testo d'avvio: ogni sua parte si ritrova ed esiste
  const tab = tabella(indice.testi);
  const blocchi = analizza(testoAvvio).map((b) => partiDelBlocco(b, tab));
  const senza = blocchi.flatMap((x) => x.mancano.map((m) => m.testo)).concat(blocchi.flatMap((x) => x.ids).filter((id) => !dove.has(id)));
  const trovate = blocchi.reduce((n, x) => n + x.ids.length, 0);
  if (senza.length || !trovate) { ok = false; nota(`KO voce: il testo d'avvio non ritrova le parti: ${JSON.stringify(senza).slice(0, 200)}`); }
  else nota(`ok voce: il testo d'avvio ritrova le sue ${trovate} parti`);
  // la traccia del trailer
  try {
    const sc = await (await fetch(`${base}trailer.json`)).json() as { durata: number; file: string; frasi: unknown[] };
    const b = await ctx.decodeAudioData(await (await fetch(`${base}${sc.file}`)).arrayBuffer());
    if (Math.abs(b.duration - sc.durata) > 0.1) { ok = false; nota(`KO voce del trailer: dura ${b.duration.toFixed(2)} s invece di ${sc.durata}`); }
    else nota(`ok voce del trailer: ${sc.frasi.length} frasi, ${b.duration.toFixed(1)} s`);
  } catch (e) {
    ok = false; nota(`KO voce del trailer: ${e instanceof Error ? e.message : e}`);
  }
  return ok;
}

type Prova = { cmd: string; attese: string[] };

// Il primo tratto della partita: stazione → piazza → casa, la mappa al suo
// posto iniziale, la presa, e la stanza che non la descrive più. Poi un giro
// di salvataggio e ricaricamento dentro il motore vero.
const PROVE: Prova[] = [
  { cmd: "esamina il biglietto", attese: ["Non è il caso di tornare"] },
  { cmd: "nord", attese: ["La piazza"] },
  { cmd: "nord", attese: ["La casa", "Su un mobile, una MAPPA"] },
  { cmd: "prendi la mappa", attese: ["Preso"] },
  { cmd: "guarda", attese: ["In un cassetto rimasto aperto"] },
  { cmd: "stato", attese: ["Vita"] },
];

export async function autoverifica(scrivi: (riga: string) => void) {
  const righe: string[] = [];
  const nota = (r: string) => { righe.push(r); scrivi(r); };
  let ok = true;
  const t0 = performance.now();
  try {
    const brano = await fetch(branoIntro);
    const byte = (await brano.arrayBuffer()).byteLength;
    if (!brano.ok || byte < 500_000) { ok = false; nota(`KO colonna sonora: HTTP ${brano.status}, ${byte} byte`); }
    else nota(`ok colonna sonora (${(byte / 1048576).toFixed(1)} MB)`);

    const s = await avviaGioco(VIAGGIATORE_GAME, (m) => nota(`… ${m}`));
    const avvio = s.boot();
    if (avvio.stato === "errore" || !avvio.text.includes("La stazione")) {
      ok = false; nota(`KO avvio: ${avvio.text.slice(0, 300)}`);
    } else nota(`ok avvio del motore (${((performance.now() - t0) / 1000).toFixed(1)} s)`);
    if (!(await provaLaVoce(avvio.text, nota))) ok = false;

    for (const p of PROVE) {
      const r = s.step(p.cmd);
      const manca = p.attese.filter((a) => !r.text.includes(a));
      const errore = r.text.includes("[ERRORE");
      if (manca.length || errore) { ok = false; nota(`KO «${p.cmd}»: manca ${JSON.stringify(manca)} → ${r.text.slice(0, 240)}`); }
      else nota(`ok «${p.cmd}»`);
    }
    // la mappa, presa, non deve più comparire nella descrizione della casa
    const guarda = s.step("guarda");
    if (guarda.text.includes("Su un mobile")) { ok = false; nota("KO il posto della mappa resta dopo la presa"); }
    else nota("ok il posto della mappa sparisce dopo la presa");
    const st = s.stato();
    if (!st.inventory.some((n) => /mappa/i.test(n))) { ok = false; nota("KO la mappa non è in bisaccia"); }

    // i pulsanti: l'anteprima di un comando (senza farlo), bere a dosi, «mangia» solo
    for (let i = 0; i < 12; i++) s.step("aspetta");
    const prima = s.stato().counters;
    const ante = s.anteprima("bevi due sorsi");
    if (!ante.ok || !ante.capito || ante.delta.acqua !== -2) { ok = false; nota(`KO anteprima di «bevi due sorsi»: ${JSON.stringify(ante.delta)}`); }
    else nota("ok l'anteprima dice cosa costa bere due sorsi");
    if (s.stato().counters.acqua !== prima.acqua) { ok = false; nota("KO l'anteprima ha toccato il mondo"); }
    else nota("ok l'anteprima non tocca il mondo");
    const beve = s.step("bevi due sorsi");
    if (!beve.text.includes("due sorsi lenti") || s.stato().counters.acqua !== prima.acqua - 2) { ok = false; nota(`KO «bevi due sorsi»: ${beve.text.slice(0, 120)}`); }
    else nota("ok si beve a dosi: due sorsi in un turno");
    const mangia = s.step("mangia");
    if (!mangia.text.includes("Mastichi piano")) { ok = false; nota(`KO «mangia» solo: ${mangia.text.slice(0, 120)}`); }
    else nota("ok «mangia» solo mangia una porzione");
    if (!Array.isArray(s.azioni().soli)) { ok = false; nota("KO le azioni di contesto"); }
    if ((s.stato().undo ?? 0) < 1) { ok = false; nota("KO lo stato non dice quanti turni si possono annullare"); }

    // salvataggio e ricaricamento: la partita ricostruita dev'essere identica
    s.step("annulla");   // disfa l'ultimo turno («mangia»)…
    s.step("guarda");    // …e ne fa un altro: la sequenza salvata deve contenere i turni una volta sola
    const salvata = s.salva();
    const esito = s.carica(salvata);
    if (!esito.ok || !esito.identica) { ok = false; nota(`KO ricaricamento: ${esito.errore ?? "impronta diversa"}`); }
    else nota(`ok salvataggio ricaricato identico (${salvata.comandi.length} comandi, impronta ${salvata.impronta.slice(0, 12)}…)`);
    if (s.stato().roomId !== st.roomId) { ok = false; nota("KO dopo il ricaricamento il luogo è diverso"); }
    const disfa = s.step("annulla");
    if (/niente da annullare/i.test(disfa.text)) { ok = false; nota("KO dopo il ricaricamento ANNULLA non ha passi"); }
    else nota("ok ANNULLA funziona anche dopo il ricaricamento");
  } catch (e) {
    ok = false;
    nota(`KO eccezione: ${e instanceof Error ? e.stack ?? e.message : String(e)}`);
  }
  nota(ok ? "AUTOVERIFICA SUPERATA" : "AUTOVERIFICA FALLITA");
  riferisciAutoverifica(ok, righe.join("\n"));
  return ok;
}
