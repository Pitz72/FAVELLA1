# esploratore.py
# Collaudo DINAMICO per FAVELLA 1 (v1.2.0): partite vere, giocate dal motore.
#
# Il collaudo statico (collaudo.py) ragiona sulle frasi senza giocare; questo
# modulo gioca. Due usi, dalla CLI:
#
#   favella1 esplora storia.fav          partite a caso con «caratteri» diversi
#   favella1 collaudo storia.fav --finali  quali finali dichiarati si raggiungono
#
# Metodo nato con «Il Viaggiatore» (collaudo/esploratore.py e finali.py del
# gioco), reso generico: qui non si sa niente della storia, se non quello che il
# motore stesso sa (stanze, uscite, oggetti, personaggi, verbi, dialoghi).
#
# Un giocatore a caso non vince un'avventura lunga. Per arrivare lontano si
# possono dare dei PERCORSI (file di testo, un comando per riga, «#» commenta):
# ogni percorso viene giocato per intero, e l'esploratore parte anche da ogni
# stanza nuova che il percorso tocca, così perlustra tutta la storia.
#
# Il motore è deterministico: stesso seme, stesse partite. Ogni anomalia viene
# riportata con i comandi che la riproducono.

import argparse
import collections
import contextlib
import copy
import io
import random
import re
import sys
import traceback

from strutture import ConseguenzaFinePartita, VERSIONE_MOTORE

# ------------------------------------------------------------------------------
# 1. UNA PARTITA PILOTATA DA PYTHON
# ------------------------------------------------------------------------------


class Partita:
    """Un mondo giocabile più la sua storia: (comando, risposta) e le eccezioni
    del motore, che non interrompono la partita ma vengono registrate."""

    def __init__(self, mondo_base, seme=None):
        from libreria_azioni import LIBRERIA_AZIONI
        self.m = copy.deepcopy(mondo_base)
        self.m.carica_azioni(LIBRERIA_AZIONI)
        self.m.imposta_posizione_iniziale()
        if seme is not None:
            self.m.rng = random.Random(seme)
        self.comandi = []
        self.eccezioni = []
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            from gioco import mostra_stanza
            mostra_stanza(self.m)
        self.risposte = [buf.getvalue()]

    def esegui(self, cmd):
        from gioco import elabora_comando
        buf = io.StringIO()
        try:
            with contextlib.redirect_stdout(buf):
                elabora_comando(self.m, cmd)
        except Exception:
            self.eccezioni.append((cmd, traceback.format_exc()))
            buf.write("\n[ECCEZIONE DEL MOTORE]\n")
        out = buf.getvalue()
        self.comandi.append(cmd)
        self.risposte.append(out)
        return out

    @property
    def in_corso(self):
        return self.m.stato_partita == "in_corso"

    def stanza(self):
        return self.m.trova_stanza(self.m.posizione_giocatore)

    def uscite(self):
        st = self.stanza()
        return list(st.uscite.keys()) if st else []

    def presenti(self):
        st = self.stanza()
        if not st or not self.m.c_e_luce():
            return []
        return list(st.oggetti.values())

    def inventario(self):
        return [self.m.oggetti[o] for o in self.m.inventario if o in self.m.oggetti]

    def opzioni_dialogo(self):
        if not self.m.dialogo_attivo:
            return []
        nodo = self.m.dialogo_nodi.get(self.m.nodo_dialogo)
        if nodo is None:
            return []
        return [o.testo for o in nodo.opzioni if o.disponibile(self.m)]

    def trascrizione(self):
        righe = [self.risposte[0].rstrip("\n")]
        for cmd, out in zip(self.comandi, self.risposte[1:]):
            righe.append("> " + cmd)
            righe.append(out.rstrip("\n"))
        return "\n".join(righe) + "\n"


def finali_dichiarati(mondo):
    """Le conseguenze di fine partita scritte nella storia, ovunque stiano
    (regole, eventi, demoni, opzioni di dialogo): [(esito, messaggio, dove)],
    una voce per coppia esito/messaggio."""
    sedi = [(f"regola «Invece di {r.verbo}»", r.conseguenze) for r in mondo.regole]
    sedi += [(f"evento «{e.tipo} {e.n} turni»", e.conseguenze) for e in mondo.eventi]
    from collaudo import descrivi_condizione
    sedi += [(f"demone «{descrivi_condizione(d.condizione)}»", d.conseguenze) for d in mondo.demoni]
    for etichetta, nodo in mondo.dialogo_nodi.items():
        sedi += [(f"dialogo, nodo «{etichetta}»", o.conseguenze) for o in nodo.opzioni]
    visti, out = set(), []
    for dove, conseguenze in sedi:
        for c in conseguenze:
            if isinstance(c, ConseguenzaFinePartita):
                chiave = (c.esito, c.messaggio or "")
                if chiave not in visti:
                    visti.add(chiave)
                    out.append((c.esito, c.messaggio or "", dove))
    return out


def leggi_percorso(percorso):
    """Un file di percorso: un comando per riga; righe vuote e «#…» ignorate."""
    with open(percorso, encoding="utf-8") as f:
        return [r.strip() for r in f if r.strip() and not r.strip().startswith("#")]


# ------------------------------------------------------------------------------
# 2. I CARATTERI DEI GIOCATORI
# ------------------------------------------------------------------------------
# errore: quanto spesso sbaglia a scrivere; novita: quanto preferisce ciò che non
# ha ancora provato; lingua: voglia di parlare; annulla: quanto usa ANNULLA.
CARATTERI = {
    "curioso":       dict(errore=0.05, novita=3.0, lingua=1.0, annulla=0.01),
    "maldestro":     dict(errore=0.45, novita=1.0, lingua=1.0, annulla=0.05),
    "chiacchierone": dict(errore=0.05, novita=1.5, lingua=3.0, annulla=0.02),
    "frettoloso":    dict(errore=0.10, novita=0.5, lingua=0.3, annulla=0.00),
}

VERBI_SEMPLICI = ["guarda", "inventario", "aiuto", "ancora", "aspetta"]
VERBI_SULLE_COSE = ["esamina", "prendi", "lascia", "apri", "chiudi", "leggi", "usa", "mangia", "sposta"]
PAROLE_A_CASO = ["xyzzy", "vola", "salta", "piangi", "canta", "dormi", "prega", "scava", "nuota"]
COSE_INESISTENTI = ["la luna", "un cammello", "il telefono", "la chiave d'oro", "il treno"]


def _nome(o):
    return o.nome_visualizzato.lower()


def _refuso(rng, s):
    if len(s) < 4:
        return s + s[-1:]
    i = rng.randrange(1, len(s) - 1)
    op = rng.randrange(4)
    if op == 0:
        return s[:i] + s[i + 1] + s[i] + s[i + 2:]
    if op == 1:
        return s[:i] + s[i + 1:]
    if op == 2:
        return s[:i] + s[i] + s[i:]
    return s.upper() if rng.random() < 0.5 else s.replace("'", "’")


class Esploratore:
    def __init__(self, carattere, rng, provati):
        self.c = CARATTERI[carattere]
        self.rng = rng
        self.provati = provati     # Counter globale (stanza, comando) -> volte

    def candidati(self, p):
        rng, c, m = self.rng, self.c, p.m
        cand = []
        if m.dialogo_attivo:
            opz = p.opzioni_dialogo()
            for i, testo in enumerate(opz, 1):
                cand.append((str(i), 3.0))
                parole = testo.split()
                if len(parole) > 1 and rng.random() < 0.3:
                    cand.append((rng.choice(parole), 0.5))   # testo parziale
            cand += [("esci", 0.3), (str(len(opz) + 1), 0.2)]
            return cand
        stanza = m.posizione_giocatore
        presenti, inv = p.presenti(), p.inventario()
        for d in p.uscite():
            cand.append((d, 2.0))
        for o in presenti:
            n = _nome(o)
            cand.append((f"esamina {n}", 1.0))
            if o.is_personaggio:
                cand.append((f"parla con {n}", 1.5 * c["lingua"]))
            else:
                cand.append((f"prendi {n}", 1.5 if o.prendibile else 0.3))
                if o.is_contenitore:
                    cand += [(f"apri {n}", 0.8), (f"chiudi {n}", 0.2)]
        for o in inv:
            n = _nome(o)
            cand += [(f"esamina {n}", 0.4), (f"lascia {n}", 0.3)]
            for bersaglio in presenti:
                cand.append((f"usa {n} su {_nome(bersaglio)}", 0.6))
            if rng.random() < 0.2:
                cand.append((f"{rng.choice(VERBI_SULLE_COSE)} {n}", 0.3))
        for v in VERBI_SEMPLICI:
            cand.append((v, 0.25))
        bersagli = presenti + inv
        for v in sorted(m.verbi_personalizzati):
            if v in m.verbi_intransitivi or not bersagli:
                cand.append((v, 0.4))
            else:
                cand.append((f"{v} {_nome(rng.choice(bersagli))}", 0.4))
        cand.append(("annulla", c["annulla"] * 10))
        return [(cmd, w * (1.0 + c["novita"] / (1 + self.provati[(stanza, cmd)])))
                for cmd, w in cand]

    def sbaglio(self, p, buono):
        rng = self.rng
        tipo = rng.randrange(6)
        if tipo == 0:
            return _refuso(rng, buono)
        if tipo == 1:
            return rng.choice(PAROLE_A_CASO)
        if tipo == 2:
            return f"{rng.choice(['prendi', 'esamina', 'usa', 'parla con'])} {rng.choice(COSE_INESISTENTI)}"
        if tipo == 3:
            altrove = [o for o in p.m.oggetti.values()
                       if o.posizione not in (p.m.posizione_giocatore, "inventario")]
            return f"prendi {_nome(rng.choice(altrove))}" if altrove else "prendi tutto"
        if tipo == 4:
            return rng.choice(["", "   ", "?", "...", "vai", "prendi", "usa", "1", "0", "-3"])
        return buono + " " + rng.choice(["subito", "per favore", "adesso"])

    def scegli(self, p):
        cand = self.candidati(p)
        tot = sum(w for _, w in cand)
        x = self.rng.random() * tot
        cmd = cand[-1][0]
        for cmd, w in cand:
            x -= w
            if x <= 0:
                break
        if self.rng.random() < self.c["errore"]:
            return self.sbaglio(p, cmd)
        return cmd


# ------------------------------------------------------------------------------
# 3. I CONTROLLI DOPO OGNI COMANDO
# ------------------------------------------------------------------------------
_RE_SEGNAPOSTO = re.compile(r"\[[a-zà-ù_ ']{2,}\]", re.IGNORECASE)
_RIFIUTO_USCITA = "Non puoi andare in quella direzione."

# Anomalie gravi (fanno uscire con codice 1) e segnalazioni da guardare a mano.
GRAVI = ("ECCEZIONE", "ERRORE", "SEGNAPOSTO", "INVISIBILE", "USCITA")


class Registro:
    def __init__(self):
        self.anomalie = collections.OrderedDict()   # firma -> dict

    def segnala(self, tipo, descrizione, p, firma=None):
        firma = firma or (tipo, descrizione)
        a = self.anomalie.get(firma)
        if a:
            a["volte"] += 1
            return
        self.anomalie[firma] = dict(tipo=tipo, descrizione=descrizione, volte=1,
                                    comandi=list(p.comandi),
                                    trascrizione=p.trascrizione())


def controlla(p, cmd, out, reg, prima):
    m = p.m
    if len(p.eccezioni) > prima["eccezioni"]:
        ultima = p.eccezioni[-1][1].strip().splitlines()[-1]
        reg.segnala("ECCEZIONE", f"«{cmd}» -> {ultima}", p, ("ECCEZIONE", ultima))
    if "[ERRORE" in out:
        reg.segnala("ERRORE", f"«{cmd}» -> {out.strip()[:160]}", p, ("ERRORE", out.strip()[:80]))
    for s in _RE_SEGNAPOSTO.findall(out):
        reg.segnala("SEGNAPOSTO", f"{s} nel testo dopo «{cmd}»", p, ("SEGNAPOSTO", s.lower()))
    for k, v in (m.variabili.items() if p.in_corso else ()):
        if isinstance(v, int) and not isinstance(v, bool) and v < 0 and prima["contatori"].get(k, 0) >= 0:
            reg.segnala("NEGATIVO", f"il contatore «{k}» scende a {v} dopo «{cmd}»", p, ("NEGATIVO", k))
    try:
        cap = m.capacita_attuale()
    except Exception:
        cap = None
    if cap is not None and len(m.inventario) > cap:
        reg.segnala("CAPIENZA", f"{len(m.inventario)} oggetti su {cap} posti dopo «{cmd}»", p,
                    ("CAPIENZA", cmd.split()[0] if cmd.split() else ""))
    if cmd.startswith("esamina ") and cmd[8:] in prima["presenti"] and out.lstrip().startswith("Non vedo"):
        reg.segnala("INVISIBILE", f"«{cmd[8:]}» è fra i presenti ma il parser non lo vede", p,
                    ("INVISIBILE", cmd[8:]))
    if cmd in prima["uscite"] and out.strip().startswith(_RIFIUTO_USCITA):
        reg.segnala("USCITA", f"uscita «{cmd}» da «{prima['stanza']}» elencata ma rifiutata", p,
                    ("USCITA", prima["stanza"], cmd))
    if cmd.strip() and not out.strip() and p.in_corso:
        reg.segnala("SILENZIO", f"«{cmd}» non produce testo (in «{m.posizione_giocatore}»)", p,
                    ("SILENZIO", cmd.split()[0]))


# ------------------------------------------------------------------------------
# 4. PARTITE
# ------------------------------------------------------------------------------

def gioca_percorso(mondo_base, comandi, reg=None):
    """Gioca un percorso scritto a mano. Restituisce la Partita e, per ogni
    stanza toccata per la prima volta, una copia della partita in quel punto
    (sono le partenze dell'esploratore)."""
    p = Partita(mondo_base, seme=1)
    partenze = {p.m.posizione_giocatore: copy.deepcopy(p)}
    for cmd in comandi:
        if not p.in_corso:
            break
        prima = _prima(p)
        out = p.esegui(cmd)
        if reg is not None:
            controlla(p, cmd, out, reg, prima)
        s = p.m.posizione_giocatore
        if p.in_corso and s not in partenze and not p.m.dialogo_attivo:
            partenze[s] = copy.deepcopy(p)
    return p, partenze


def _prima(p):
    return dict(eccezioni=len(p.eccezioni),
                presenti={_nome(o) for o in p.presenti()},
                uscite=set(p.uscite()),
                stanza=p.m.posizione_giocatore,
                contatori={k: v for k, v in p.m.variabili.items()
                           if isinstance(v, int) and not isinstance(v, bool)})


def gioca_a_caso(partenza, carattere, seme, turni, provati, reg, cop):
    rng = random.Random(seme)
    p = copy.deepcopy(partenza)
    p.m.rng = random.Random(seme)
    es = Esploratore(carattere, rng, provati)
    visitati, ultimo_nuovo, stallo = set(), 0, False
    for n in range(turni):
        if not p.in_corso:
            break
        prima = _prima(p)
        cmd = es.scegli(p)
        provati[(p.m.posizione_giocatore, cmd)] += 1
        out = p.esegui(cmd)
        controlla(p, cmd, out, reg, prima)
        s = p.m.posizione_giocatore
        cop["luoghi"].add(s)
        if s not in visitati:
            visitati.add(s)
            ultimo_nuovo = n
        if p.m.nodo_dialogo:
            cop["nodi"].add(p.m.nodo_dialogo)
        cop["presi"].update(p.m.inventario)
        if not stallo and p.in_corso and not p.m.dialogo_attivo and n - ultimo_nuovo > 150:
            stallo = True
            cop["stalli"].append(s)
    return p


def _chiave_esito(m):
    return (m.stato_partita, getattr(m, "messaggio_esito", None) or "")


def esplora(mondo_base, partite=10, turni=200, seme=1, percorsi=()):
    """Il giro completo: percorsi a mano + partite a caso da ogni partenza.
    Restituisce un dizionario con anomalie, copertura, finali raggiunti."""
    reg = Registro()
    provati = collections.Counter()
    cop = dict(luoghi=set(), nodi=set(), presi=set(), stalli=[])
    raggiunti = {}            # (esito, messaggio) -> comandi della prima partita
    partenze = {}
    comandi_giocati = 0
    for nome, comandi in percorsi:
        p, tappe = gioca_percorso(mondo_base, comandi, reg)
        comandi_giocati += len(p.comandi)
        cop["luoghi"].update(tappe)
        for s, snap in tappe.items():
            partenze.setdefault(s, snap)
        if not p.in_corso:
            raggiunti.setdefault(_chiave_esito(p.m), (f"percorso «{nome}»", list(p.comandi)))
    if not partenze:
        partenze = {"inizio": Partita(mondo_base, seme=1)}
    nomi = list(partenze)
    esiti = collections.Counter()
    for ci, carattere in enumerate(CARATTERI):
        for i in range(partite):
            s = seme * 100000 + ci * 1000 + i
            partenza = partenze[nomi[i % len(nomi)]]
            p = gioca_a_caso(partenza, carattere, s, turni, provati, reg, cop)
            comandi_giocati += len(p.comandi) - len(partenza.comandi)
            esiti[p.m.stato_partita] += 1
            if not p.in_corso:
                chiave = _chiave_esito(p.m)
                if chiave not in raggiunti or len(p.comandi) < len(raggiunti[chiave][1]):
                    raggiunti[chiave] = (f"partita a caso ({carattere}, seme {s})", list(p.comandi))
    m0 = Partita(mondo_base).m
    return dict(anomalie=list(reg.anomalie.values()), copertura=cop, esiti=esiti,
                raggiunti=raggiunti, comandi=comandi_giocati,
                partite=partite * len(CARATTERI), partenze=nomi,
                luoghi_tot=set(m0.stanze), nodi_tot=set(m0.dialogo_nodi),
                prendibili={o.nome for o in m0.oggetti.values() if o.prendibile},
                finali=finali_dichiarati(m0))


# ------------------------------------------------------------------------------
# 5. RAPPORTI
# ------------------------------------------------------------------------------

def _elenco(insieme, massimo=12):
    voci = sorted(insieme)
    testo = ", ".join(voci[:massimo])
    return testo + (f" e altri {len(voci) - massimo}" if len(voci) > massimo else "")


def _stato_finale(esito, messaggio):
    parole = {"vinta": "vittoria", "persa": "sconfitta", "terminata": "fine"}
    testo = parole.get(esito, esito)
    return f"{testo} «{messaggio[:70]}»" if messaggio else f"{testo} (messaggio predefinito)"


def rapporto_finali(r):
    """Quali finali dichiarati sono stati raggiunti, e come."""
    R = ["=" * 70, f"COLLAUDO DEI FINALI — FAVELLA 1 (motore v{VERSIONE_MOTORE})", "=" * 70]
    R.append(f"{r['partite']} partite a caso ({len(CARATTERI)} caratteri) e "
             f"{r['comandi']} comandi in tutto.")
    R.append("")
    mancanti = 0
    for esito, messaggio, dove in r["finali"]:
        trovato = r["raggiunti"].get((esito, messaggio))
        if trovato:
            chi, comandi = trovato
            R.append(f"[OK] {_stato_finale(esito, messaggio)}")
            R.append(f"     dichiarato in: {dove}")
            R.append(f"     raggiunto da: {chi}, in {len(comandi)} comandi")
            R.append(f"     comandi: {' | '.join(comandi[-12:])}"
                     + (" (ultimi 12)" if len(comandi) > 12 else ""))
        else:
            mancanti += 1
            R.append(f"[??] {_stato_finale(esito, messaggio)}")
            R.append(f"     dichiarato in: {dove}")
            R.append("     MAI RAGGIUNTO: controllalo, o scrivi un percorso che lo raggiunga "
                     "(--percorso).")
        R.append("")
    if not r["finali"]:
        R.append("La storia non dichiara nessun finale («vinci», «perdi», «fine»).")
    R.append(f"Finali dichiarati: {len(r['finali'])}; raggiunti: {len(r['finali']) - mancanti}.")
    R.append("Un finale mai raggiunto non è per forza irraggiungibile: le partite a caso "
             "arrivano di rado in fondo a una storia lunga. I percorsi scritti a mano sì.")
    R.append("=" * 70)
    return "\n".join(R), mancanti


def rapporto_esplorazione(r):
    cop = r["copertura"]
    R = ["=" * 70, f"ESPLORAZIONE — FAVELLA 1 (motore v{VERSIONE_MOTORE})", "=" * 70]
    R.append(f"{r['partite']} partite a caso ({', '.join(CARATTERI)}), {r['comandi']} comandi.")
    R.append(f"Partenze: {_elenco(r['partenze'])}.")
    R.append("")
    R.append("--- COPERTURA ---")
    for titolo, visti, tutti in (("Luoghi visitati", cop["luoghi"], r["luoghi_tot"]),
                                 ("Nodi di dialogo toccati", cop["nodi"], r["nodi_tot"]),
                                 ("Oggetti presi almeno una volta", cop["presi"], r["prendibili"])):
        riga = f"  {titolo}: {len(visti & tutti)}/{len(tutti)}"
        if tutti - visti:
            riga += f" (mai: {_elenco(tutti - visti)})"
        R.append(riga)
    R.append("  Esiti delle partite: " + ", ".join(f"{k} {v}" for k, v in r["esiti"].most_common()))
    R.append("")
    R.append(f"--- ANOMALIE ({len(r['anomalie'])}) ---")
    if not r["anomalie"]:
        R.append("  (nessuna)")
    for a in r["anomalie"]:
        grave = " [GRAVE]" if a["tipo"] in GRAVI else ""
        R.append(f"  - {a['tipo']}{grave} x{a['volte']}: {a['descrizione']}")
        R.append(f"      per riprodurla: {' | '.join(a['comandi'][-10:])}"
                 + (" (ultimi 10)" if len(a["comandi"]) > 10 else ""))
    R.append("")
    R.append(f"--- STALLI ({len(cop['stalli'])}) ---")
    if cop["stalli"]:
        R.append("  Partite vive per oltre 150 comandi senza luoghi nuovi: di solito un giocatore "
                 "che gira a vuoto, a volte un vicolo cieco.")
        for s, v in collections.Counter(cop["stalli"]).most_common(10):
            R.append(f"  - {v} x {s}")
    else:
        R.append("  (nessuno)")
    R.append("")
    R.append("Legenda: ECCEZIONE errore Python del motore · ERRORE messaggio d'errore interno · "
             "SEGNAPOSTO [nome] non sostituito · INVISIBILE oggetto elencato che il parser non "
             "vede · USCITA uscita elencata ma rifiutata · NEGATIVO contatore sotto zero · "
             "CAPIENZA più oggetti dei posti · SILENZIO comando senza risposta.")
    R.append("=" * 70)
    gravi = sum(1 for a in r["anomalie"] if a["tipo"] in GRAVI)
    return "\n".join(R), gravi


# ------------------------------------------------------------------------------
# 6. CLI
# ------------------------------------------------------------------------------

def _compila(percorso):
    from compilatore import compila_mondo
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        mondo = compila_mondo(percorso)
    if mondo is None:
        print(buf.getvalue())
        print("\n[esplora] Compilazione fallita: niente da giocare.")
    return mondo


def argomenti_comuni(ap):
    ap.add_argument("-n", "--partite", type=int, default=10,
                    help="partite a caso per carattere (predefinito 10)")
    ap.add_argument("-t", "--turni", type=int, default=200,
                    help="comandi massimi per partita (predefinito 200)")
    ap.add_argument("--seme", type=int, default=1,
                    help="seme della sequenza casuale (stesso seme, stesse partite)")
    ap.add_argument("--percorso", action="append", default=[], metavar="FILE",
                    help="file di comandi da giocare per intero (ripetibile)")
    ap.add_argument("--rapporto", default=None, metavar="FILE",
                    help="scrive il rapporto anche in un file di testo")


def esegui(storia, partite=10, turni=200, seme=1, percorsi=(), solo_finali=False, rapporto=None):
    mondo = _compila(storia)
    if mondo is None:
        return 2
    elenco = [(pf, leggi_percorso(pf)) for pf in percorsi]
    r = esplora(mondo, partite=partite, turni=turni, seme=seme, percorsi=elenco)
    if solo_finali:
        testo, problemi = rapporto_finali(r)
    else:
        testo, problemi = rapporto_esplorazione(r)
        testo += "\n\n" + rapporto_finali(r)[0]
    print(testo)
    if rapporto:
        with open(rapporto, "w", encoding="utf-8") as f:
            f.write(testo + "\n")
    return 1 if problemi else 0


def main(argv=None):
    ap = argparse.ArgumentParser(prog="esploratore",
                                 description="Collaudo dinamico: partite a caso su una storia .fav")
    ap.add_argument("storia")
    ap.add_argument("--finali", action="store_true", help="riporta solo i finali")
    argomenti_comuni(ap)
    a = ap.parse_args(argv)
    return esegui(a.storia, a.partite, a.turni, a.seme, a.percorso, a.finali, a.rapporto)


if __name__ == "__main__":
    sys.exit(main())
