# esportazione.py
# Esportazione di una storia FAVELLA 1 (v1.4.0) in una pagina HTML giocabile.
#
# [1.4.0 / L-7] Fino alla 1.3.0 stava in compilatore.py (che così conteneva
# anche la pagina HTML, e la incorporava in ogni pagina esportata). Ora ha un
# modulo suo; `from compilatore import esporta_html` continua a funzionare.

import json
import os
import sys

from compilatore import (espandi_inclusioni, _espandi_inclusioni_seedable,
                         analizza_file_strutturato, compila_mondo)


# ==============================================================================
# ESPORTAZIONE DEL GIOCO — HTML AUTOPORTANTE (Favella Studio — Fase 7, packaging)
# ------------------------------------------------------------------------------
# esporta_html produce UN file .html che gioca l'avventura nel browser, col motore
# FAVELLA VERO eseguito via Pyodide (stesso contratto headless del sidecar e delle
# cassette-gioco della landing page). Incorpora i 5 moduli del motore + la storia
# APPIATTITA (Includi risolti) + un terminale retrò. Il giocatore non installa
# nulla (serve solo un browser e, al primo avvio, la rete per scaricare Pyodide).
#
# [1.4.0] La pagina mostra ciò che il motore dice come EVENTI (titoli di stanza,
# domande, battute, messaggi di servizio hanno ciascuno il suo stile) e, accanto
# al campo di testo, i PULSANTI-VERBO: il giocatore può comporre la frase
# toccando un verbo, un oggetto e un secondo oggetto (gioco.pulsanti). L'autore
# sceglie con 'I comandi si scrivono.' (niente pulsanti) o 'I comandi si
# scelgono con i pulsanti.' (niente campo di testo); il predefinito è entrambi.
# ==============================================================================

_ENGINE_FILES = ["favella_utils.py", "strutture.py", "libreria_azioni.py", "compilatore.py", "gioco.py"]

_EXPORT_DRIVER_PY = r'''
import json, sys
if '/engine' not in sys.path:
    sys.path.insert(0, '/engine')
from compilatore import compila_mondo
from gioco import elabora_comando, mostra_stanza, intestazione, pulsanti
from libreria_azioni import LIBRERIA_AZIONI
from favella_utils import raccogli_uscita, UscitaRaccolta
_mondo = None
def _risposta(uscita, continua, errore=None):
    eventi = uscita.come_dizionari()
    testo = uscita.testo()
    if errore:
        eventi.append({"tipo": "errore", "testo": errore, "stacco": True})
        testo += "\n" + errore + "\n"
    stato = getattr(_mondo, "stato_partita", "in_corso") if _mondo is not None else "errore"
    d = {"text": testo, "eventi": eventi, "continua": bool(continua), "stato": stato,
         "uscita": bool(getattr(_mondo, "_uscita_richiesta", False))}
    if _mondo is not None and errore is None:
        d["pulsanti"] = pulsanti(_mondo)
    return json.dumps(d, ensure_ascii=False)
def fav_boot(entry):
    global _mondo
    uscita = UscitaRaccolta()
    try:
        _mondo = compila_mondo(entry)
        if _mondo is None:
            return _risposta(uscita, False, "[ERRORE DI COMPILAZIONE] La storia non compila.")
        _mondo.carica_azioni(LIBRERIA_AZIONI)
        _mondo.imposta_posizione_iniziale()
        with raccogli_uscita(_mondo, uscita):
            if getattr(_mondo, "titolo", None) or getattr(_mondo, "prologo", None):
                intestazione(_mondo)
            mostra_stanza(_mondo)
    except Exception as e:
        return _risposta(uscita, False, "[ERRORE DI COMPILAZIONE] " + str(e))
    return _risposta(uscita, True)
def fav_step(cmd):
    uscita = UscitaRaccolta()
    if _mondo is None:
        return _risposta(uscita, False, "[ERRORE] Nessuna partita in corso.")
    try:
        with raccogli_uscita(_mondo, uscita):
            continua = elabora_comando(_mondo, cmd)
    except Exception as e:
        return _risposta(uscita, True, "[ERRORE] " + str(e))
    return _risposta(uscita, continua)
'''


def esporta_html(percorso_file, sorgente=None, titolo=None):
    """[Fase 7] Genera un HTML autoportante che gioca la storia via Pyodide.
    Ritorna {ok, html, title} oppure {ok:False, reason}. La storia viene
    APPIATTITA (Includi risolti) e incorporata col motore. Richiede che compili.
    [1.4.0] Il titolo della pagina è quello della storia ('Il titolo è "…".'),
    se non se ne passa uno; la pagina sa da subito come si danno i comandi."""
    diag = analizza_file_strutturato(percorso_file, sorgente=sorgente)
    if not diag.get("ok"):
        return {"ok": False, "reason": "La storia non compila: correggi gli errori prima di esportare."}
    # Storia appiattita (Includi risolti in un unico .fav).
    try:
        if sorgente is not None:
            testo, _mappa, _err = _espandi_inclusioni_seedable(percorso_file, sorgente)
        else:
            testo, _mappa, _err = espandi_inclusioni(percorso_file)
    except Exception as e:
        return {"ok": False, "reason": f"Appiattimento non riuscito: {e}"}
    mondo = compila_mondo(percorso_file, sorgente)
    # Moduli del motore: stessa cartella di questo file in sviluppo, oppure la
    # cartella di estrazione di PyInstaller (_MEIPASS) nell'IDE pacchettizzato (i .py
    # sorgenti vanno inclusi come 'datas' nello spec, vedi documentazione/PACKAGING.md).
    base = getattr(sys, "_MEIPASS", None) or os.path.dirname(os.path.abspath(__file__))
    engine = {}
    for nome in _ENGINE_FILES:
        try:
            with open(os.path.join(base, nome), encoding="utf-8") as f:
                engine[nome] = f.read()
        except OSError as e:
            return {"ok": False, "reason": f"Modulo del motore mancante ({nome}): {e}"}
    tit = (titolo or getattr(mondo, "titolo", None)
           or os.path.splitext(os.path.basename(percorso_file))[0] or "Avventura FAVELLA")
    modo = getattr(mondo, "modo_comandi", "entrambi") or "entrambi"
    # Il driver Python va incorporato nel JSON dei DATI (non in un template literal
    # JS): json.dumps fa l'escaping corretto di \n, \\, " — in un backtick JS invece
    # «\n» diventerebbe un a-capo reale e spezzerebbe le stringhe Python del driver.
    # NB: il motore e la storia possono contenere «</script>» o «<!--», che
    # dentro un blocco <script> confonderebbero il parser HTML. Fuori dalle
    # stringhe JSON non compare mai «<», quindi lo si scrive ovunque come <:
    # per JavaScript è lo stesso carattere, per il parser HTML non è un tag.
    dati = json.dumps({"engine": engine, "story": testo, "title": tit, "modo": modo,
                       "driver": _EXPORT_DRIVER_PY},
                      ensure_ascii=False).replace("<", "\\u003c")
    html = _HTML_EXPORT_TEMPLATE.replace("/*__TITLE__*/", _escape_html(tit))
    html = html.replace("/*__DATA__*/", dati)
    return {"ok": True, "html": html, "title": tit}


def _escape_html(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


_HTML_EXPORT_TEMPLATE = r"""<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>/*__TITLE__*/ — FAVELLA</title>
<style>
  :root { --bg:#0c1018; --fg:#cfe3ff; --dim:#6b7b95; --accent:#7ad0ff; --panel:#0a0e16;
    --line:#1d2740; --btn:#15233e; --btn-line:#2a3a5c; --warm:#ffd27a; --voce:#e3cfff;
    --ok:#9be39b; --err:#ff8a8a; }
  * { box-sizing:border-box; }
  html,body { margin:0; height:100%; background:var(--bg); color:var(--fg);
    font-family:"Cascadia Code","Consolas",ui-monospace,monospace; }
  #wrap { max-width:860px; margin:0 auto; height:100%; display:flex; flex-direction:column;
    padding:16px; gap:10px; }
  header { display:flex; align-items:center; gap:10px; }
  h1 { flex:1; font-size:15px; color:var(--accent); font-weight:600; margin:0; letter-spacing:.04em; }
  #interruttore { background:none; color:var(--dim); border:1px solid var(--line); border-radius:6px;
    padding:4px 9px; font:inherit; font-size:12px; cursor:pointer; }
  #interruttore[hidden] { display:none; }
  #out { flex:1; min-height:140px; overflow:auto; white-space:pre-wrap; line-height:1.5; font-size:14.5px;
    border:1px solid var(--line); border-radius:8px; padding:14px; background:var(--panel); }
  #out .cmd { color:var(--accent); }
  #out .sys, #out .ev-sistema { color:var(--dim); }
  #out .ev-intestazione { color:var(--warm); }
  #out .ev-stanza { color:var(--accent); font-weight:700; }
  #out .ev-elenco { color:#a9bddb; }
  #out .ev-domanda { color:var(--warm); }
  #out .ev-dialogo, #out .ev-opzione { color:var(--voce); }
  #out .ev-fine { color:var(--ok); font-weight:700; }
  #out .ev-errore { color:var(--err); }
  #bar { display:flex; gap:8px; }
  #bar[hidden] { display:none; }
  #bar input { flex:1; min-width:0; background:var(--panel); border:1px solid var(--line); color:var(--fg);
    padding:9px 12px; border-radius:8px; font:inherit; }
  #bar button { background:var(--btn); color:var(--fg); border:1px solid var(--btn-line);
    border-radius:8px; padding:9px 16px; font:inherit; cursor:pointer; }
  #bar button:disabled { opacity:.5; cursor:default; }
  #pulsanti { border:1px solid var(--line); border-radius:8px; background:var(--panel); padding:10px 12px;
    display:flex; flex-direction:column; gap:8px; max-height:46vh; overflow:auto; }
  #pulsanti[hidden] { display:none; }
  .gruppo { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
  .etichetta { width:100%; color:var(--dim); font-size:11px; text-transform:uppercase; letter-spacing:.08em; }
  .b { background:var(--btn); color:var(--fg); border:1px solid var(--btn-line); border-radius:6px;
    padding:6px 10px; font:inherit; font-size:13px; cursor:pointer; }
  .b:hover, .b:focus-visible { border-color:var(--accent); outline:none; }
  .b.verbo.attivo { background:var(--accent); color:#06121f; border-color:var(--accent); }
  .b.con-te { border-style:dashed; }
  .b.scelta { width:100%; text-align:left; }
  .b.piano { background:none; color:var(--dim); }
  #frase { display:flex; gap:8px; align-items:center; color:var(--accent); min-height:1.6em; }
  #frase span { flex:1; }
  .foot { color:var(--dim); font-size:11px; text-align:center; }
  /* Su un telefono lo schermo non si divide l'altezza con i pulsanti: ha la sua,
     e la pagina scorre. */
  @media (max-width:600px) {
    html,body { height:auto; }
    #wrap { height:auto; min-height:100%; padding:10px; }
    #out { flex:none; height:60vh; font-size:14px; }
    #pulsanti { max-height:none; }
  }
</style>
</head>
<body>
<div id="wrap">
  <header>
    <h1>/*__TITLE__*/</h1>
    <button id="interruttore" type="button" hidden aria-pressed="true">Pulsanti: sì</button>
  </header>
  <div id="out" aria-live="polite"><span class="sys">Caricamento del motore FAVELLA…</span></div>
  <div id="pulsanti" hidden></div>
  <div id="bar">
    <input id="in" type="text" placeholder="Scrivi un comando… (es. guarda, nord, prendi …)" disabled autocomplete="off" aria-label="Comando">
    <button id="send" disabled>Invio</button>
  </div>
  <div class="foot">Motore FAVELLA in esecuzione nel browser (Pyodide). Una creazione con Favella Studio.</div>
</div>
<script>
const DATA = /*__DATA__*/;
const DRIVER = DATA.driver;
const PYBASE = "https://cdn.jsdelivr.net/pyodide/v0.27.2/full/";
const MODO = DATA.modo || "entrambi";   // 'entrambi' | 'pulsanti' | 'testo'
const out = document.getElementById("out");
const inp = document.getElementById("in");
const send = document.getElementById("send");
const bar = document.getElementById("bar");
const pan = document.getElementById("pulsanti");
const interruttore = document.getElementById("interruttore");
const CHIAVE = "favella-pulsanti:" + DATA.title;
let py = null, running = false, P = null, scelta = null;
let mostra = true;
try { mostra = localStorage.getItem(CHIAVE) !== "no"; } catch (e) { /* niente memoria */ }

if (MODO === "pulsanti") bar.hidden = true;
if (MODO === "entrambi") interruttore.hidden = false;

function append(text, cls) {
  if (!text) return;
  const span = document.createElement("span");
  if (cls) span.className = cls;
  span.textContent = text.endsWith("\n") ? text : text + "\n";
  out.appendChild(span); out.scrollTop = out.scrollHeight;
}
// [1.4.0] Ciò che il motore dice arriva come eventi: ognuno ha il suo stile.
function mostraEventi(r) {
  if (!r.eventi) { append(r.text); return; }
  for (const e of r.eventi) {
    if (e.stacco) out.appendChild(document.createTextNode("\n"));
    append(e.testo, "ev-" + e.tipo);
  }
}
function setStatus(t){ out.innerHTML = '<span class="sys">'+t+'</span>'; }

// ---- Pulsanti-verbo ---------------------------------------------------------
function el(tag, cls, testo) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (testo !== undefined) n.textContent = testo;
  return n;
}
function bottone(testo, cls, azione, titolo) {
  const b = el("button", "b " + (cls || ""), testo);
  b.type = "button";
  if (titolo) b.title = titolo;
  b.addEventListener("click", azione);
  return b;
}
function gruppo(etichetta, figli) {
  if (!figli.length) return;   // un gruppo vuoto non si mostra
  const g = el("div", "gruppo");
  if (etichetta) g.appendChild(el("div", "etichetta", etichetta));
  for (const f of figli) g.appendChild(f);
  pan.appendChild(g);
}
function oggetto(id) { return (P.oggetti || []).find(o => o.id === id); }
function secondiDi(v, primo) {
  const lista = v.secondi_per ? (v.secondi_per[primo.id] || []) : (v.secondi || []);
  return lista.filter(s => s.id === undefined || s.id !== primo.id);
}
function scegliVerbo(v) {
  if (!v.oggetto) { invia(v.verbo); return; }
  scelta = (scelta && scelta.verbo === v) ? null : { verbo: v, primo: null };
  disegna();
}
function scegliPrimo(v, primo) {
  const base = v.verbo + " " + primo.testo;
  const secondi = secondiDi(v, primo);
  if (v.secondo === "no" || !secondi.length) { invia(base); return; }
  scelta = { verbo: v, primo: primo };
  disegna();
}
function annullaScelta() { scelta = null; disegna(); }

function disegna() {
  pan.innerHTML = "";
  const visibile = running && P && MODO !== "testo" && (MODO === "pulsanti" || mostra);
  pan.hidden = !visibile;
  if (!visibile) return;
  if (P.fase !== "gioco") {
    const titoli = { dialogo: "Rispondi", conferma: "Conferma", scelta: "Quale intendi?", fine: "La partita è finita" };
    gruppo(titoli[P.fase] || "", (P.scelte || []).map(s =>
      bottone(s.etichetta, "scelta", () => invia(s.comando))));
    return;
  }
  // La frase in composizione.
  if (scelta) {
    const f = el("div", ""); f.id = "frase";
    const v = scelta.verbo;
    f.appendChild(el("span", "", v.verbo + " " + (scelta.primo ? scelta.primo.testo + " …" : "…")));
    f.appendChild(bottone("✕", "piano", annullaScelta, "Annulla la frase"));
    pan.appendChild(f);
  }
  // I verbi.
  gruppo("Azioni", (P.verbi || []).map(v => {
    const b = bottone(v.etichetta, "verbo", () => scegliVerbo(v));
    if (scelta && scelta.verbo === v) b.classList.add("attivo");
    return b;
  }));
  // Gli oggetti: tutti (un tocco li esamina), quelli adatti al verbo, o i secondi.
  if (scelta && scelta.primo) {
    const v = scelta.verbo, primo = scelta.primo;
    const voci = secondiDi(v, primo).map(s =>
      bottone(s.testo, "", () => invia(v.verbo + " " + primo.testo + " " + s.testo)));
    if (v.secondo === "facoltativo")
      voci.push(bottone("… e basta", "piano", () => invia(v.verbo + " " + primo.testo)));
    gruppo("Con che cosa?", voci);
  } else if (scelta) {
    const v = scelta.verbo;
    const voci = v.primi.map(pr => {
      const o = oggetto(pr.id);
      return bottone(o ? o.etichetta : pr.testo, o && o.con_te ? "con-te" : "", () => scegliPrimo(v, pr));
    });
    if (v.da_solo) voci.push(bottone(v.verbo + " e basta", "piano", () => invia(v.verbo)));
    gruppo("Che cosa?", voci);
  } else if ((P.oggetti || []).length) {
    const esamina = (P.verbi || []).find(v => v.verbo === "esamina");
    const qui = [], conTe = [];
    for (const o of P.oggetti) {
      const pr = esamina && esamina.primi.find(p => p.id === o.id);
      const b = bottone(o.etichetta, o.con_te ? "con-te" : "",
                        () => pr ? invia("esamina " + pr.testo) : null, pr ? "Esamina" : "");
      (o.con_te ? conTe : qui).push(b);
    }
    gruppo("Qui", qui);
    gruppo("Con te", conTe);
  }
  gruppo("Uscite", (P.uscite || []).map(u =>
    bottone(u.etichetta + (u.stanza ? " · " + u.stanza : ""), "", () => invia(u.comando))));
  gruppo("", (P.servizio || []).map(s =>
    bottone(s.etichetta, "piano", () => invia(s.comando))));
}
interruttore.addEventListener("click", () => {
  mostra = !mostra;
  try { localStorage.setItem(CHIAVE, mostra ? "si" : "no"); } catch (e) { /* niente memoria */ }
  interruttore.textContent = "Pulsanti: " + (mostra ? "sì" : "no");
  interruttore.setAttribute("aria-pressed", mostra ? "true" : "false");
  disegna();
});
interruttore.textContent = "Pulsanti: " + (mostra ? "sì" : "no");
interruttore.setAttribute("aria-pressed", mostra ? "true" : "false");

// ---- Motore -----------------------------------------------------------------
async function boot() {
  try {
    setStatus("Avvio dell'interprete…");
    await new Promise((res, rej) => { const s=document.createElement("script"); s.src=PYBASE+"pyodide.js"; s.onload=res; s.onerror=()=>rej(new Error("Pyodide non raggiungibile (serve la rete al primo avvio).")); document.head.appendChild(s); });
    py = await loadPyodide({ indexURL: PYBASE });
    setStatus("Installazione di Lark…");
    await py.loadPackage("micropip");
    await py.pyimport("micropip").install("lark");
    setStatus("Caricamento dell'avventura…");
    py.FS.mkdirTree("/engine");
    for (const [n, src] of Object.entries(DATA.engine)) py.FS.writeFile("/engine/"+n, src);
    py.FS.mkdirTree("/game");
    py.FS.writeFile("/game/storia.fav", DATA.story);
    py.runPython(DRIVER);
    py.globals.set("_entry", "/game/storia.fav");
    const r = JSON.parse(py.runPython("fav_boot(_entry)"));
    out.innerHTML = "";
    mostraEventi(r);
    running = r.continua;
    P = r.pulsanti || null;
    inp.disabled = !running; send.disabled = !running;
    disegna();
    if (running && MODO !== "pulsanti") inp.focus();
  } catch (e) {
    setStatus("Errore: " + e.message);
  }
}
function invia(cmd) {
  if (!running || !cmd) return;
  scelta = null;
  append("> " + cmd, "cmd");
  try {
    py.globals.set("_cmd", cmd);
    const r = JSON.parse(py.runPython("fav_step(_cmd)"));
    mostraEventi(r);
    if (r.pulsanti) P = r.pulsanti;
    // [1.3.0] A partita finita si può ancora ANNULLARE, RICOMINCIARE o CARICARE:
    // l'ingresso resta aperto finché il giocatore non chiede di uscire.
    running = r.continua || (r.stato !== "in_corso" && !r.uscita);
    if (!running) { inp.disabled = true; send.disabled = true; append("\n— Fine —", "sys"); }
  } catch (e) { append("[errore] " + e.message, "sys"); }
  disegna();
}
function step() {
  const cmd = inp.value.trim();
  if (!cmd) return;
  inp.value = "";
  invia(cmd);
}
send.addEventListener("click", step);
inp.addEventListener("keydown", (e) => { if (e.key === "Enter") step(); });
boot();
</script>
</body>
</html>
"""
