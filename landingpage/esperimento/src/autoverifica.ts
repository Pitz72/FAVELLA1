// ====================================================================
//  Autoverifica: avvia il gioco vero (Pyodide + motore + avventura),
//  gioca qualche comando e controlla le risposte. Si apre con
//  ?autoverifica; nella versione desktop la lancia `--autoverifica`, e la
//  CI la esegue sul pacchetto appena costruito prima di pubblicarlo.
// ====================================================================
import { avviaGioco } from "./lib/favellaRuntime";
import { VIAGGIATORE_GAME } from "./data/viaggiatore";
import { riferisciAutoverifica } from "./lib/desktop";
import branoIntro from "./assets/intro.mp3";

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

    // salvataggio e ricaricamento: la partita ricostruita dev'essere identica
    s.step("annulla");   // disfa l'ultimo turno («guarda»)…
    s.step("guarda");    // …e lo rifà: la sequenza salvata deve contenerlo una volta sola
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
