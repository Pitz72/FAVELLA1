# favella_playground.py
# Playground locale di FAVELLA 1: un editor nel browser collegato al motore VERO.
#
# A differenza dell'export HTML (che gira via Pyodide e richiede la rete), questo
# playground usa il motore NATIVO incluso nella distribuzione: è completamente
# OFFLINE, alla velocità di Python, con la diagnostica reale del compilatore.
#
# Architettura: un mini-server http.server (solo stdlib, nessuna dipendenza nuova)
# in ascolto su 127.0.0.1; serve una singola pagina (editor + terminale) e tre
# endpoint JSON che chiamano direttamente le funzioni del motore. Mono-utente,
# locale: pensato per essere lanciato da `favella1 playground`.

import json
import os
import sys
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# Il motore stampa molto su stdout: lo catturiamo per-chiamata e non lo lasciamo
# trapelare sul terminale del server.
import contextlib
import io

from compilatore import analizza_file_strutturato, compila_mondo
from gioco import elabora_comando, mostra_stanza
from libreria_azioni import LIBRERIA_AZIONI
from strutture import VERSIONE_MOTORE
from favella_utils import rendi_testo


# --------------------------------------------------------------------------
# Stato di sessione (mono-utente, come il sidecar dell'IDE)
# --------------------------------------------------------------------------
class _Sessione:
    def __init__(self):
        self.mondo = None
        self.percorso = "playground.fav"


_SESSIONE = _Sessione()


def _stato_partita(mondo):
    """Istantanea read-only per la UI (eco del contratto del sidecar):
    fine partita + esito, dialogo in corso con le opzioni proponibili."""
    stato = getattr(mondo, "stato_partita", "in_corso")
    in_dialogo = mondo.in_dialogo()
    opzioni = []
    if in_dialogo:
        nodo = mondo.dialogo_nodi.get(mondo.nodo_dialogo)
        if nodo is not None:
            disponibili = [o for o in nodo.opzioni if o.disponibile(mondo)]
            opzioni = [{"index": i, "text": rendi_testo(mondo, o.testo)}
                       for i, o in enumerate(disponibili, 1)]
    stanza = mondo.trova_stanza(mondo.posizione_giocatore)
    return {
        "gameOver": stato != "in_corso",
        "outcome": None if stato == "in_corso" else stato,
        "inDialogue": in_dialogo,
        "dialogueOptions": opzioni,
        "room": stanza.nome_visualizzato if stanza else None,
        "turn": getattr(mondo, "turno_corrente", 0),
    }


def _avvia_partita(sorgente):
    """Compila il buffer dell'editor e avvia una partita. Su errore di
    compilazione restituisce le diagnostiche d'autore (canale strutturato)."""
    percorso = _SESSIONE.percorso
    mondo = compila_mondo(percorso, sorgente)
    if mondo is None:
        _SESSIONE.mondo = None
        diag = analizza_file_strutturato(percorso, sorgente=sorgente)
        return {"ok": False, "output": "", "running": False, "state": None,
                "errors": diag.get("errors", []), "warnings": diag.get("warnings", [])}
    mondo.carica_azioni(LIBRERIA_AZIONI)
    mondo.imposta_posizione_iniziale()
    if not mondo.posizione_giocatore:
        _SESSIONE.mondo = None
        return {"ok": False, "output": "", "running": False, "state": None,
                "errors": [{"message": "Nessuna stanza definita: impossibile "
                                       "avviare il gioco.", "severity": "error"}]}
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        print("--- BENVENUTO IN FAVELLA 1 ---")
        print("Scrivi un comando qui sotto. Comandi utili: ANNULLA, ANCORA.")
        mostra_stanza(mondo)
    _SESSIONE.mondo = mondo
    return {"ok": True, "output": buf.getvalue(), "running": True,
            "state": _stato_partita(mondo)}


def _invia_comando(comando):
    """Esegue un comando sulla partita attiva e restituisce l'output catturato."""
    mondo = _SESSIONE.mondo
    if mondo is None:
        return {"ok": False, "output": "Nessuna partita attiva. Premi «Compila e "
                "gioca».", "running": False, "state": None}
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        continua = elabora_comando(mondo, comando)
    return {"ok": True, "output": buf.getvalue(), "running": bool(continua),
            "state": _stato_partita(mondo)}


def _valida(sorgente):
    """Compilazione di sola diagnostica (errori veri + avvisi del linter)."""
    diag = analizza_file_strutturato(_SESSIONE.percorso, sorgente=sorgente)
    return {"ok": diag.get("ok", False), "errors": diag.get("errors", []),
            "warnings": diag.get("warnings", [])}


# --------------------------------------------------------------------------
# Server HTTP
# --------------------------------------------------------------------------
class _Handler(BaseHTTPRequestHandler):
    # Silenzia il logging di default (una riga per richiesta sul terminale).
    def log_message(self, *_args):
        pass

    def _invia(self, codice, corpo, content_type="application/json; charset=utf-8"):
        dati = corpo.encode("utf-8") if isinstance(corpo, str) else corpo
        self.send_response(codice)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(dati)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(dati)

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            self._invia(200, _PAGINA_HTML, "text/html; charset=utf-8")
        else:
            self._invia(404, json.dumps({"error": "non trovato"}))

    def do_POST(self):
        lunghezza = int(self.headers.get("Content-Length", 0))
        try:
            corpo = self.rfile.read(lunghezza) if lunghezza else b"{}"
            params = json.loads(corpo.decode("utf-8") or "{}")
        except (ValueError, UnicodeDecodeError):
            self._invia(400, json.dumps({"error": "JSON non valido"}))
            return
        try:
            if self.path == "/api/avvia":
                ris = _avvia_partita(params.get("source", ""))
            elif self.path == "/api/comando":
                ris = _invia_comando(params.get("command", ""))
            elif self.path == "/api/valida":
                ris = _valida(params.get("source", ""))
            elif self.path == "/api/versione":
                ris = {"version": VERSIONE_MOTORE}
            else:
                self._invia(404, json.dumps({"error": "endpoint sconosciuto"}))
                return
        except Exception as e:  # difensivo: non far cadere il server
            self._invia(500, json.dumps({"ok": False, "error": str(e)}))
            return
        self._invia(200, json.dumps(ris, ensure_ascii=False))


def _carica_iniziale(percorso_iniziale):
    """Restituisce (sorgente, percorso_di_lavoro). Se l'autore ha indicato una
    storia, la carichiamo e usiamo la SUA cartella come radice (così gli Includi
    si risolvono); altrimenti partiamo dal template di esempio in cwd."""
    if percorso_iniziale and os.path.isfile(percorso_iniziale):
        with open(percorso_iniziale, encoding="utf-8") as f:
            return f.read(), os.path.abspath(percorso_iniziale)
    return _STORIA_TEMPLATE, os.path.join(os.getcwd(), "playground.fav")


def avvia_playground(percorso_iniziale=None, porta=0, apri_browser=True):
    """Avvia il server del playground e (opzionale) apre il browser. Blocca
    finché l'utente non interrompe con Ctrl+C."""
    sorgente, _SESSIONE.percorso = _carica_iniziale(percorso_iniziale)

    server = ThreadingHTTPServer(("127.0.0.1", porta), _Handler)
    porta_reale = server.server_address[1]
    url = f"http://127.0.0.1:{porta_reale}/"

    print(f"[FAVELLA 1] Playground avviato su {url}")
    print("[FAVELLA 1] Motore nativo offline. Premi Ctrl+C per chiudere.")

    if apri_browser:
        # Apri il browser dopo che il server è in ascolto.
        threading.Timer(0.4, lambda: webbrowser.open(url)).start()

    # La pagina chiede /api/sorgente-iniziale via querystring? No: la iniettiamo
    # nel JS della pagina sostituendo il segnaposto al primo GET.
    global _SORGENTE_INIZIALE
    _SORGENTE_INIZIALE = sorgente
    _aggiorna_pagina(sorgente)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[FAVELLA 1] Playground chiuso.")
    finally:
        server.server_close()
    return 0


_SORGENTE_INIZIALE = ""


def _aggiorna_pagina(sorgente):
    """Inietta la sorgente iniziale e la versione nel template della pagina."""
    global _PAGINA_HTML
    _PAGINA_HTML = (_PAGINA_TEMPLATE
                    .replace("/*__VERSIONE__*/", VERSIONE_MOTORE)
                    .replace("/*__SORGENTE__*/", json.dumps(sorgente)))


# --------------------------------------------------------------------------
# Contenuti incorporati
# --------------------------------------------------------------------------
_STORIA_TEMPLATE = """\
# Benvenuto nel playground di FAVELLA 1!
# Scrivi la tua storia qui a sinistra, poi premi «Compila e gioca».
# Prova: «est», «prendi mela», «esamina mela».

La cucina è una stanza.
La descrizione della cucina è "Una piccola cucina che profuma di pane. A EST c'è il giardino.".

Il giardino è una stanza.
La descrizione del giardino è "Un giardino soleggiato. La cucina è a OVEST.".

La cucina collega est a il giardino.

Il giocatore comincia in cucina.

La mela è una cosa.
La mela è nel giardino.
La descrizione della mela è "Una mela rossa e lucida, perfetta da raccogliere.".
La mela è prendibile.

Invece di esamina mela se il giocatore ha la mela: dire "La osservi bene: è la mela più bella che tu abbia mai visto." e adesso vinci "Hai raccolto la mela. Hai vinto!".
"""


_PAGINA_TEMPLATE = r"""<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Programma con FAVELLA 1</title>
<style>
  :root { --bg:#0c1018; --panel:#0a0e16; --fg:#cfe3ff; --dim:#5b6b85;
          --accent:#7ad0ff; --line:#1d2740; --err:#ff8a8a; --warn:#ffce73;
          --ok:#8ee6a0; }
  * { box-sizing:border-box; }
  html,body { margin:0; height:100%; background:var(--bg); color:var(--fg);
    font-family:"Cascadia Code","Consolas",ui-monospace,monospace; }
  header { display:flex; align-items:center; gap:12px; padding:10px 16px;
    border-bottom:1px solid var(--line); }
  header h1 { font-size:14px; color:var(--accent); margin:0; font-weight:600;
    letter-spacing:.04em; }
  header .v { color:var(--dim); font-size:11px; }
  header .sp { flex:1; }
  button { background:#15233e; color:var(--fg); border:1px solid #2a3a5c;
    border-radius:7px; padding:7px 13px; font:inherit; font-size:12.5px; cursor:pointer; }
  button:hover { border-color:var(--accent); }
  button.primary { background:#1d3a5c; border-color:#33597f; }
  #main { display:flex; height:calc(100% - 49px); }
  #left, #right { flex:1; min-width:0; display:flex; flex-direction:column; }
  #left { border-right:1px solid var(--line); }
  .pane-h { padding:6px 12px; font-size:11px; color:var(--dim);
    border-bottom:1px solid var(--line); display:flex; align-items:center; gap:10px; }
  #editor { flex:1; width:100%; resize:none; border:0; outline:0; background:var(--panel);
    color:var(--fg); font:inherit; font-size:13.5px; line-height:1.5; padding:12px;
    white-space:pre; tab-size:2; }
  #out { flex:1; overflow:auto; white-space:pre-wrap; line-height:1.5; font-size:13.5px;
    padding:12px; background:var(--panel); }
  #out .cmd { color:var(--accent); }
  #out .sys { color:var(--dim); }
  #out .err { color:var(--err); }
  #out .ok  { color:var(--ok); }
  #opts { display:flex; flex-wrap:wrap; gap:6px; padding:0 12px; }
  #opts button { font-size:12px; }
  #bar { display:flex; gap:8px; padding:10px 12px; border-top:1px solid var(--line); }
  #bar input { flex:1; background:var(--panel); border:1px solid var(--line);
    color:var(--fg); padding:8px 11px; border-radius:7px; font:inherit; }
  #bar input:disabled { opacity:.5; }
  #diag { font-size:11.5px; padding:0 12px 8px; }
  #diag .err { color:var(--err); }
  #diag .warn { color:var(--warn); }
  .banner { font-weight:600; padding:6px 12px; }
  .banner.win { color:var(--ok); } .banner.lose { color:var(--err); }
</style>
</head>
<body>
<header>
  <h1>Programma con FAVELLA 1</h1>
  <span class="v">motore v/*__VERSIONE__*/ · offline</span>
  <span class="sp"></span>
  <button id="btn-open">Apri .fav</button>
  <button id="btn-save">Scarica .fav</button>
  <button id="btn-check">Verifica</button>
  <button id="btn-run" class="primary">Compila e gioca ▶</button>
  <input id="file" type="file" accept=".fav,.txt" style="display:none">
</header>
<div id="main">
  <div id="left">
    <div class="pane-h">EDITOR — la tua storia (.fav)</div>
    <textarea id="editor" spellcheck="false"></textarea>
    <div id="diag"></div>
  </div>
  <div id="right">
    <div class="pane-h">GIOCO</div>
    <div id="out"><span class="sys">Premi «Compila e gioca» per iniziare.</span></div>
    <div id="opts"></div>
    <div id="bar">
      <input id="cmd" type="text" placeholder="scrivi un comando…" disabled autocomplete="off">
      <button id="btn-send" disabled>Invio</button>
    </div>
  </div>
</div>
<script>
const SORGENTE_INIZIALE = /*__SORGENTE__*/;
const ed = document.getElementById('editor');
const out = document.getElementById('out');
const opts = document.getElementById('opts');
const cmd = document.getElementById('cmd');
const diag = document.getElementById('diag');
ed.value = SORGENTE_INIZIALE;

function append(text, cls) {
  const span = document.createElement('span');
  if (cls) span.className = cls;
  span.textContent = text;
  out.appendChild(span);
  out.scrollTop = out.scrollHeight;
}
function clearOut() { out.textContent = ''; }

async function post(url, body) {
  const r = await fetch(url, {method:'POST', headers:{'Content-Type':'application/json'},
                            body: JSON.stringify(body)});
  return r.json();
}

function mostraDiagnostica(res) {
  diag.innerHTML = '';
  (res.errors || []).forEach(d => {
    const e = document.createElement('div'); e.className = 'err';
    e.textContent = '✖ ' + d.message + (d.line ? ' (riga ' + d.line + ')' : '');
    diag.appendChild(e);
  });
  (res.warnings || []).forEach(d => {
    const w = document.createElement('div'); w.className = 'warn';
    w.textContent = '⚠ ' + d.message + (d.line ? ' (riga ' + d.line + ')' : '');
    diag.appendChild(w);
  });
  if (res.ok && !(res.warnings || []).length) {
    const o = document.createElement('div'); o.className = 'ok'; o.style.color='var(--ok)';
    o.textContent = '✔ La storia compila.';
    diag.appendChild(o);
  }
}

function aggiornaStato(st) {
  opts.innerHTML = '';
  cmd.disabled = false; document.getElementById('btn-send').disabled = false;
  if (!st) return;
  if (st.inDialogue && st.dialogueOptions.length) {
    st.dialogueOptions.forEach(o => {
      const b = document.createElement('button');
      b.textContent = o.index + '. ' + o.text;
      b.onclick = () => inviaComando(String(o.index));
      opts.appendChild(b);
    });
  }
  if (st.gameOver) {
    cmd.disabled = true; document.getElementById('btn-send').disabled = true;
    const cls = st.outcome === 'vinta' ? 'win' : (st.outcome === 'persa' ? 'lose' : '');
    const b = document.createElement('div'); b.className = 'banner ' + cls;
    b.textContent = st.outcome === 'vinta' ? '★ Partita vinta' :
                    (st.outcome === 'persa' ? '☠ Partita persa' : '■ Partita terminata');
    out.appendChild(b); out.scrollTop = out.scrollHeight;
  }
}

async function avvia() {
  clearOut(); opts.innerHTML = ''; diag.innerHTML = '';
  append('Compilazione…\n', 'sys');
  const res = await post('/api/avvia', {source: ed.value});
  clearOut();
  if (!res.ok) {
    append('La storia non parte: correggi gli errori.\n', 'err');
    mostraDiagnostica(res);
    cmd.disabled = true; document.getElementById('btn-send').disabled = true;
    return;
  }
  append(res.output);
  aggiornaStato(res.state);
  cmd.focus();
}

async function inviaComando(testo) {
  const c = testo !== undefined ? testo : cmd.value;
  if (!c.trim()) return;
  append('\n> ' + c + '\n', 'cmd');
  if (testo === undefined) cmd.value = '';
  const res = await post('/api/comando', {command: c});
  append(res.output);
  aggiornaStato(res.state);
  if (!res.running && (!res.state || !res.state.gameOver)) {
    cmd.disabled = true; document.getElementById('btn-send').disabled = true;
    append('\n(Sessione terminata.)\n', 'sys');
  }
}

document.getElementById('btn-run').onclick = avvia;
document.getElementById('btn-send').onclick = () => inviaComando();
cmd.addEventListener('keydown', e => { if (e.key === 'Enter') inviaComando(); });
document.getElementById('btn-check').onclick = async () => {
  diag.innerHTML = '<span class="sys">Verifica…</span>';
  mostraDiagnostica(await post('/api/valida', {source: ed.value}));
};
document.getElementById('btn-save').onclick = () => {
  const blob = new Blob([ed.value], {type:'text/plain'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'storia.fav'; a.click();
  URL.revokeObjectURL(a.href);
};
document.getElementById('btn-open').onclick = () => document.getElementById('file').click();
document.getElementById('file').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => { ed.value = r.result; diag.innerHTML=''; };
  r.readAsText(f);
};
window.addEventListener('beforeunload', e => { e.preventDefault(); e.returnValue = ''; });
</script>
</body>
</html>
"""

# Pagina effettivamente servita (riempita da _aggiorna_pagina allo startup; un
# valore di fallback evita una pagina vuota se servita prima dell'avvio).
_PAGINA_HTML = (_PAGINA_TEMPLATE
                .replace("/*__VERSIONE__*/", VERSIONE_MOTORE)
                .replace("/*__SORGENTE__*/", json.dumps(_STORIA_TEMPLATE)))


if __name__ == "__main__":
    raise SystemExit(avvia_playground())
