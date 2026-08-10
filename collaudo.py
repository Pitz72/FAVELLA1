# collaudo.py
# FAVELLA 1 — Il collaudatore automatico di storie (B1, Fase B1.1: analisi statica)
#
# «Il differenziatore»: verificare senza playthrough manuali che una storia sia
# vincibile e che il contenuto sia raggiungibile. Questa fase implementa SOLO il
# LIVELLO 1 (analisi statica, «la catena della vittoria»). NB: il robot dinamico
# (BFS sullo spazio degli stati, Fase B1.2) è stato TENTATO e ACCANTONATO il
# 2026-06-14 (automated planning illimitato e fragile, rischio di falsi «non
# vincibile»): il valore di collaudo lo dà questa analisi statica di Livello 1.
#
# PRINCIPIO ARCHITETTURALE: collaudo.py è un CONSUMATORE del Mondo compilato.
# Non tocca la grammatica né il loop di gioco; importa le strutture dati da
# strutture.py e RIUSA il linter esistente (FavellaTransformer.analisi_statica)
# invece di reinventarlo. Nessuna modifica al motore: i test del linguaggio non
# regrediscono.
#
# Uso da riga di comando:
#     python collaudo.py storia.fav
#
# API (riusabile dal sidecar/IDE):
#     analizza_vincibilita(mondo) -> dict   (report strutturato)
#     rendi_report_testuale(report) -> str  (resa leggibile)
#
# Spec completa: documentazione/progettazione-collaudo.md

import sys

from strutture import (
    VERSIONE_MOTORE,
    Condizione, CondizionePossesso, CondizioneProprieta, CondizioneVariabile,
    CondizioneContatore, CondizionePosizioneGiocatore,
    CondizioneNot, CondizioneAnd, CondizioneOr,
    Conseguenza, ConseguenzaProprieta, ConseguenzaVariabile, ConseguenzaSceltaStato,
    ConseguenzaContatore,
    ConseguenzaFinePartita, ConseguenzaSpostamento, ConseguenzaSpostamentoGiocatore,
)
from favella_utils import radice_proprieta

# Tetto di profondità della risalita a ritroso: protegge da catene patologiche
# e dall'esplosione combinatoria di alternative. Largamente sufficiente per le
# storie reali (la catena di «La Casa» è profonda 3-4 passi).
MAX_PROFONDITA = 16

# Il LIMITE ONESTO, dichiarato testualmente nel report. L'analisi statica dà
# CONDIZIONI NECESSARIE + EURISTICHE, non una prova di vincibilità: la
# soddisfacibilità di condizioni AND/OR/NOT su contatori con aritmetica è
# indecidibile in generale, e qui le strutture And/Or sono appiattite in atomi
# (si perde la differenza fra «serve A e B» e «basta A o B»). Il robot dinamico
# che darebbe la parola definitiva (Fase B1.2) è stato accantonato: vedi l'header.
LIMITE_ONESTO = (
    "Analisi STATICA: fornisce condizioni necessarie ed euristiche, non una "
    "prova di vincibilità. La struttura logica delle condizioni (e/oppure/non) "
    "è appiattita in atomi e la soddisfacibilità dei contatori è approssimata. "
    "Un avviso qui è un INDIZIO da verificare, non una sentenza."
)


# ==============================================================================
# 1. DESCRIZIONE LEGGIBILE DI CONDIZIONI E COMANDI
# ==============================================================================

def _op_in_parole(operatore: str) -> str:
    return {
        "==": "è", ">=": "è almeno", ">": "è più di",
        "<": "è meno di", "<=": "è al massimo",
    }.get(operatore, operatore)


def _descrivi_atomo(atomo, negato: bool) -> str:
    """Rende un atomo-condizione in italiano leggibile (con la sua negazione)."""
    if isinstance(atomo, CondizionePossesso):
        verbo = "non ha" if negato else "ha"
        return f"il giocatore {verbo} «{atomo.id_oggetto}»"
    if isinstance(atomo, CondizioneProprieta):
        verbo = "non è" if negato else "è"
        return f"«{atomo.id_oggetto}» {verbo} {atomo.proprieta}"
    if isinstance(atomo, CondizioneVariabile):
        verbo = "non è" if negato else "è"
        return f"lo stato «{atomo.nome}» {verbo} {atomo.valore}"
    if isinstance(atomo, CondizioneContatore):
        testo = f"il contatore «{atomo.nome}» {_op_in_parole(atomo.operatore)} {atomo.valore}"
        return f"non ({testo})" if negato else testo
    if isinstance(atomo, CondizionePosizioneGiocatore):
        verbo = "non è" if negato else "è"
        return f"il giocatore {verbo} in «{atomo.id_stanza}»"
    # Fallback difensivo per eventuali atomi non previsti.
    base = type(atomo).__name__
    return f"non ({base})" if negato else base


def descrivi_condizione(cond) -> str:
    """Rende una condizione (anche composita) in italiano, preservando la
    struttura logica e/oppure/non. Usata per il riassunto dello sblocco."""
    if cond is None:
        return "sempre (nessuna condizione)"
    if isinstance(cond, CondizioneNot):
        return f"non ({descrivi_condizione(cond.condizione)})"
    if isinstance(cond, CondizioneAnd):
        return " e ".join(descrivi_condizione(c) for c in cond.condizioni)
    if isinstance(cond, CondizioneOr):
        return "(" + " oppure ".join(descrivi_condizione(c) for c in cond.condizioni) + ")"
    return _descrivi_atomo(cond, False)


def _descrivi_comando(verbo, bersaglio, preposizione, secondario) -> str:
    """Ricostruisce il comando-tipo che il giocatore digiterebbe per una regola."""
    parti = [verbo]
    if bersaglio:
        parti.append(f"«{bersaglio}»")
    if preposizione:
        parti.append(preposizione)
    if secondario:
        parti.append(f"«{secondario}»")
    return " ".join(parti)


# ==============================================================================
# 2. SCOMPOSIZIONE IN ATOMI E PRODUTTORI
# ==============================================================================

def _atomi(cond, negato: bool = False):
    """Appiattisce una condizione (anche And/Or/Not) nella lista dei suoi atomi,
    ciascuno con il flag di negazione che lo raggiunge. EURISTICA dichiarata: la
    differenza fra congiunzione e disgiunzione si perde (vedi LIMITE_ONESTO)."""
    if cond is None:
        return []
    if isinstance(cond, CondizioneNot):
        return _atomi(cond.condizione, not negato)
    if isinstance(cond, (CondizioneAnd, CondizioneOr)):
        out = []
        for sub in cond.condizioni:
            out += _atomi(sub, negato)
        return out
    return [(cond, negato)]


def _chiave_atomo(atomo, negato: bool):
    """Chiave d'identità di un atomo (per la guardia anti-ciclo della risalita)."""
    ident = (getattr(atomo, "id_oggetto", None)
             or getattr(atomo, "nome", None)
             or getattr(atomo, "id_stanza", None))
    return (type(atomo).__name__, ident,
            getattr(atomo, "proprieta", None),
            getattr(atomo, "valore", None),
            getattr(atomo, "operatore", None),
            negato)


def _vero_all_avvio(atomo, negato: bool, mondo) -> bool:
    """Valuta l'atomo sullo stato INIZIALE del mondo, riusando il valutatore del
    motore stesso (mondo non ancora giocato)."""
    valore = atomo.valuta(mondo)
    return (not valore) if negato else valore


def _produttori(mondo):
    """Indicizza OGNI conseguenza del mondo con il suo contesto di sblocco. Una
    voce = {conseguenza, contesto, condizione_sblocco, comando}. Copre le quattro
    sedi in cui una conseguenza può vivere: regole, eventi, demoni, opzioni di
    dialogo (le stesse di FavellaTransformer._tutte_le_conseguenze)."""
    voci = []
    for r in mondo.regole:
        comando = _descrivi_comando(r.verbo, r.id_oggetto_bersaglio,
                                    r.preposizione, r.id_oggetto_secondario)
        ctx = f"regola «Invece di {comando}»"
        for cons in r.conseguenze:
            voci.append({"conseguenza": cons, "contesto": ctx,
                         "condizione_sblocco": r.condizione, "comando": comando})
    for e in mondo.eventi:
        ctx = f"evento «{e.tipo} {e.n} turni»"
        for cons in e.conseguenze:
            # Gli eventi a tempo scattano col passare dei turni: nessuna
            # precondizione di stato (condizione_sblocco = None).
            voci.append({"conseguenza": cons, "contesto": ctx,
                         "condizione_sblocco": None, "comando": None})
    for d in mondo.demoni:
        ctx = f"demone «{descrivi_condizione(d.condizione)}»"
        for cons in d.conseguenze:
            voci.append({"conseguenza": cons, "contesto": ctx,
                         "condizione_sblocco": d.condizione, "comando": None})
    for etichetta, nodo in mondo.dialogo_nodi.items():
        for opz in nodo.opzioni:
            ctx = f"dialogo, opzione «{opz.testo}» (nodo «{etichetta}»)"
            for cons in opz.conseguenze:
                voci.append({"conseguenza": cons, "contesto": ctx,
                             "condizione_sblocco": opz.condizione,
                             "comando": f"scegli «{opz.testo}»"})
    return voci


def _produce(cons, atomo, negato: bool, mondo) -> bool:
    """Vero se la conseguenza `cons` può rendere VERO l'atomo (tenuto conto della
    negazione). Criterio mirato per tipo; per i contatori è EURISTICO (qualunque
    mutazione dello stesso contatore è considerata potenzialmente utile)."""
    if isinstance(atomo, CondizionePossesso):
        if not isinstance(cons, ConseguenzaSpostamento) or cons.id_oggetto != atomo.id_oggetto:
            return False
        in_inventario = cons.destinazione == "inventario"
        return (not in_inventario) if negato else in_inventario
    if isinstance(atomo, CondizioneProprieta):
        if not isinstance(cons, ConseguenzaProprieta) or cons.id_oggetto != atomo.id_oggetto:
            return False
        stessa = radice_proprieta(cons.proprieta) == radice_proprieta(atomo.proprieta)
        if not negato:
            return stessa
        # Negato: rende vero «X non è P» chi assegna a X una proprietà OPPOSTA.
        return radice_proprieta(cons.proprieta) in mondo.radici_opposte(atomo.proprieta)
    if isinstance(atomo, CondizioneVariabile):
        # [0.32.0 / Tema 2b] La scelta casuale fra valori ('il meteo diventa uno
        # fra sereno, pioggia, nebbia') può produrre QUALUNQUE valore dell'elenco:
        # se l'atteso vi compare, lo sblocco è (staticamente) possibile.
        if isinstance(cons, ConseguenzaSceltaStato) and cons.nome == atomo.nome:
            puo = atomo.valore in cons.valori
            return (not puo) if negato else puo
        if not isinstance(cons, ConseguenzaVariabile) or cons.nome != atomo.nome:
            return False
        coincide = cons.valore == atomo.valore
        return (not coincide) if negato else coincide
    if isinstance(atomo, CondizioneContatore):
        # Euristica: una qualunque conseguenza che muta questo contatore può
        # avvicinarlo al valore-soglia. Non proviamo l'aritmetica.
        return isinstance(cons, ConseguenzaContatore) and cons.nome == atomo.nome
    if isinstance(atomo, CondizionePosizioneGiocatore):
        if not isinstance(cons, ConseguenzaSpostamentoGiocatore):
            return False
        stessa = cons.id_stanza == atomo.id_stanza
        return (not stessa) if negato else stessa
    return False


# ==============================================================================
# 3. RAGGIUNGIBILITÀ DELLE STANZE (grafo `collega` + teletrasporti)
# ==============================================================================

def _stanza_di_partenza(mondo) -> str | None:
    """La stanza iniziale: quella dichiarata, in mancanza la prima definita
    (stesso criterio di imposta_posizione_iniziale e del linter)."""
    if mondo.posizione_iniziale and mondo.posizione_iniziale in mondo.stanze:
        return mondo.posizione_iniziale
    if mondo.stanze:
        return next(iter(mondo.stanze))
    return None


def _stanze_raggiungibili(mondo, partenza) -> set:
    """Stanze raggiungibili dal punto di partenza percorrendo le uscite
    (`collega`), più — euristicamente — ogni destinazione di un teletrasporto
    del giocatore (`adesso il giocatore è in X`)."""
    raggiunte = set()
    coda = [partenza] if partenza else []
    while coda:
        corrente = coda.pop()
        if corrente in raggiunte or corrente is None:
            continue
        raggiunte.add(corrente)
        stanza = mondo.trova_stanza(corrente)
        if stanza:
            for dest in stanza.uscite.values():
                if dest not in raggiunte:
                    coda.append(dest)
    # Teletrasporti: una conseguenza può spostare il giocatore in una stanza non
    # connessa dalle uscite. La consideriamo raggiungibile (euristica).
    for cons in _tutte_le_conseguenze(mondo):
        if isinstance(cons, ConseguenzaSpostamentoGiocatore):
            raggiunte.add(cons.id_stanza)
    return raggiunte


def _tutte_le_conseguenze(mondo):
    """Tutte le conseguenze del mondo (regole, eventi, demoni, opzioni)."""
    return [v["conseguenza"] for v in _produttori(mondo)]


# ==============================================================================
# 4. RISALITA A RITROSO — la «catena della vittoria»
# ==============================================================================

def _produttori_per(atomo, negato, mondo, produttori, raggiungibili):
    """I produttori che possono rendere vero questo atomo. La posizione del
    giocatore è prodotta anche dal movimento (uscite/teletrasporto)."""
    res = []
    if isinstance(atomo, CondizionePosizioneGiocatore) and not negato:
        if atomo.id_stanza in raggiungibili:
            res.append({"contesto": "spostamento del giocatore (uscite/collega)",
                        "condizione_sblocco": None,
                        "comando": f"raggiungi «{atomo.id_stanza}»"})
    if isinstance(atomo, CondizionePossesso) and not negato:
        # Il possesso si ottiene anche con l'azione STANDARD «prendi» su un
        # oggetto dichiarato prendibile — non solo via conseguenze d'autore.
        oggetto = mondo.trova_oggetto(atomo.id_oggetto)
        if oggetto is not None and oggetto.prendibile:
            res.append({"contesto": "raccolta dell'oggetto (comando «prendi»)",
                        "condizione_sblocco": None,
                        "comando": f"prendi «{atomo.id_oggetto}»"})
    for p in produttori:
        if _produce(p["conseguenza"], atomo, negato, mondo):
            res.append(p)
    return res


def _espandi_atomo(atomo, negato, mondo, produttori, raggiungibili, percorso, prof):
    """Costruisce il nodo della catena per un atomo: vero all'avvio? altrimenti
    quali conseguenze lo producono, e a quali prerequisiti queste sono a loro
    volta subordinate (ricorsione con guardia anti-ciclo e tetto di profondità)."""
    nodo = {
        "requisito": _descrivi_atomo(atomo, negato),
        "vero_all_avvio": _vero_all_avvio(atomo, negato, mondo),
        "produttori": [],
        "bloccante": False,
        "ciclico": False,
    }
    if nodo["vero_all_avvio"]:
        return nodo

    chiave = _chiave_atomo(atomo, negato)
    if chiave in percorso:
        # Dipendenza circolare lungo questo ramo: ci si appoggia all'espansione
        # già in corso più in alto. Non un blocco.
        nodo["ciclico"] = True
        return nodo

    prods = _produttori_per(atomo, negato, mondo, produttori, raggiungibili)
    if not prods:
        # Né vero all'avvio né producibile da alcuna conseguenza: potenziale
        # ostruzione (necessaria, da confermare col robot).
        nodo["bloccante"] = True
        return nodo

    if prof <= 0:
        # Budget di profondità esaurito: elenca i produttori senza espanderli.
        for p in prods:
            nodo["produttori"].append({
                "dove": p["contesto"], "comando": p.get("comando"),
                "prerequisiti": [], "troncato": True})
        return nodo

    nuovo_percorso = percorso | {chiave}
    for p in prods:
        prereq = []
        for (a2, n2) in _atomi(p["condizione_sblocco"]):
            prereq.append(_espandi_atomo(a2, n2, mondo, produttori,
                                         raggiungibili, nuovo_percorso, prof - 1))
        nodo["produttori"].append({
            "dove": p["contesto"], "comando": p.get("comando"),
            "prerequisiti": prereq, "troncato": False})
    return nodo


def _raccogli_bloccanti(nodo, fuori):
    """Visita ricorsiva: raccoglie i requisiti marcati bloccanti nella catena."""
    if nodo.get("bloccante"):
        fuori.append(nodo["requisito"])
    for p in nodo.get("produttori", []):
        for sub in p.get("prerequisiti", []):
            _raccogli_bloccanti(sub, fuori)


def _sorgenti_vittoria(mondo, produttori, raggiungibili):
    """Ogni ConseguenzaFinePartita esito 'vinta', con la sua catena a ritroso."""
    sorgenti = []
    for p in produttori:
        cons = p["conseguenza"]
        if not (isinstance(cons, ConseguenzaFinePartita) and cons.esito == "vinta"):
            continue
        catena = [_espandi_atomo(a, n, mondo, produttori, raggiungibili,
                                 frozenset(), MAX_PROFONDITA)
                  for (a, n) in _atomi(p["condizione_sblocco"])]
        bloccanti = []
        for n in catena:
            _raccogli_bloccanti(n, bloccanti)
        sorgenti.append({
            "tipo": _tipo_sorgente(p["contesto"]),
            "contesto": p["contesto"],
            "comando": p.get("comando"),
            "condizione": descrivi_condizione(p["condizione_sblocco"]),
            "catena": catena,
            "bloccanti": bloccanti,
            "ostruzione_sospetta": bool(bloccanti),
        })
    return sorgenti


def _tipo_sorgente(contesto: str) -> str:
    for prefisso, tipo in (("regola", "regola"), ("evento", "evento"),
                           ("demone", "demone"), ("dialogo", "dialogo")):
        if contesto.startswith(prefisso):
            return tipo
    return "altro"


# ==============================================================================
# 5. REGOLE POTENZIALMENTE IRRAGGIUNGIBILI (nuovo controllo, euristico)
# ==============================================================================

def _regole_irraggiungibili(mondo, produttori, raggiungibili) -> list:
    """Regole la cui condizione contiene un atomo né vero all'avvio né producibile
    da alcuna conseguenza: la regola non scatterebbe mai. DISTINTO dal «regola
    morta» del linter (che riguarda l'oscuramento per firma identica)."""
    fuori = []
    for r in mondo.regole:
        if r.condizione is None:
            continue
        mancanti = []
        for (atomo, negato) in _atomi(r.condizione):
            if _vero_all_avvio(atomo, negato, mondo):
                continue
            prods = _produttori_per(atomo, negato, mondo, produttori, raggiungibili)
            if not prods:
                mancanti.append(_descrivi_atomo(atomo, negato))
        if mancanti:
            comando = _descrivi_comando(r.verbo, r.id_oggetto_bersaglio,
                                        r.preposizione, r.id_oggetto_secondario)
            fuori.append({
                "comando": comando,
                "condizione": descrivi_condizione(r.condizione),
                "atomi_mai_soddisfacibili": mancanti,
            })
    return fuori


# ==============================================================================
# 6. RIUSO DEL LINTER ESISTENTE (FavellaTransformer.analisi_statica)
# ==============================================================================

def _avvisi_linter(mondo) -> dict:
    """Esegue i quattro controlli del linter semantico del compilatore, ciascuno
    isolato, per ottenere liste GIÀ categorizzate. Non reinventa nulla: chiama i
    metodi esistenti iniettando il mondo già compilato."""
    from compilatore import FavellaTransformer

    def _esegui(nome_metodo):
        t = FavellaTransformer()
        t.mondo = mondo
        t.warnings = []
        getattr(t, nome_metodo)()
        return list(t.warnings)

    return {
        "stanze_isolate": _esegui("_lint_stanze_irraggiungibili"),
        "oggetti_orfani": _esegui("_lint_oggetti_orfani"),
        "regole_morte": _esegui("_lint_regole_morte"),
        "stati_inutilizzati": _esegui("_lint_variabili_inutilizzate"),
    }


# ==============================================================================
# 7. API PRINCIPALE
# ==============================================================================

def analizza_vincibilita(mondo) -> dict:
    """Analisi statica di vincibilità (Livello 1) sul Mondo compilato. Restituisce
    un report strutturato (dizionario) riusabile dal sidecar/IDE. Non gioca la
    storia: vedi LIMITE_ONESTO."""
    # Lo stato iniziale del giocatore è impostato dal chiamante del motore
    # (gioco/server), non da analizza_file. Lo facciamo qui, in modo idempotente,
    # così le condizioni di posizione si valutano sullo stato di partenza reale.
    if mondo.posizione_giocatore is None:
        mondo.imposta_posizione_iniziale()

    partenza = _stanza_di_partenza(mondo)
    produttori = _produttori(mondo)
    raggiungibili = _stanze_raggiungibili(mondo, partenza)

    sorgenti = _sorgenti_vittoria(mondo, produttori, raggiungibili)
    if not sorgenti:
        esito = "nessuna-vittoria"
    elif any(not s["ostruzione_sospetta"] for s in sorgenti):
        esito = "vincibile-staticamente"
    else:
        esito = "ostruzione-possibile"

    return {
        "versione_motore": VERSIONE_MOTORE,
        "livello": 1,
        "limite_onesto": LIMITE_ONESTO,
        "partenza": partenza,
        "vittoria": {
            "n_sorgenti": len(sorgenti),
            "esito": esito,
            "sorgenti": sorgenti,
        },
        "linter": _avvisi_linter(mondo),
        "regole_irraggiungibili": _regole_irraggiungibili(mondo, produttori, raggiungibili),
    }


# ==============================================================================
# 8. RESA TESTUALE LEGGIBILE (cp1252-safe: niente frecce o box-drawing)
# ==============================================================================

def _rendi_catena(nodo, righe, livello):
    rientro = "  " * livello
    if nodo["vero_all_avvio"]:
        marca = "[OK]"
    elif nodo["bloccante"]:
        marca = "[!!]"
    elif nodo["ciclico"]:
        marca = "[..]"
    else:
        marca = "[->]"
    righe.append(f"{rientro}{marca} {nodo['requisito']}")
    for p in nodo["produttori"]:
        com = f"  (comando: {p['comando']})" if p.get("comando") else ""
        tronc = "  [troncato: profondità]" if p.get("troncato") else ""
        righe.append(f"{rientro}    da: {p['dove']}{com}{tronc}")
        for sub in p.get("prerequisiti", []):
            _rendi_catena(sub, righe, livello + 3)


def rendi_report_testuale(report: dict) -> str:
    """Resa leggibile del report per la CLI."""
    R = []
    R.append("=" * 70)
    R.append(f"COLLAUDO STATICO — FAVELLA 1 (motore v{report['versione_motore']})")
    R.append("Livello 1: analisi statica della vincibilità")
    R.append("=" * 70)
    R.append(f"Stanza di partenza: «{report['partenza']}»")
    R.append("")

    vitt = report["vittoria"]
    esiti = {
        "vincibile-staticamente":
            "VINCIBILE (staticamente plausibile): trovata almeno una via senza "
            "ostruzioni evidenti.",
        "ostruzione-possibile":
            "OSTRUZIONE POSSIBILE: ogni via verso la vittoria contiene un "
            "requisito che non risulta producibile.",
        "nessuna-vittoria":
            "NESSUNA VITTORIA: nessuna conseguenza «vinci» trovata. La storia "
            "non sembra vincibile.",
    }
    R.append("--- CATENA DELLA VITTORIA ---")
    R.append(esiti.get(vitt["esito"], vitt["esito"]))
    R.append(f"Sorgenti di vittoria (conseguenze «vinci»): {vitt['n_sorgenti']}")
    R.append("")
    for i, s in enumerate(vitt["sorgenti"], 1):
        R.append(f"[{i}] {s['contesto']}")
        if s.get("comando"):
            R.append(f"    comando di attivazione: {s['comando']}")
        R.append(f"    si sblocca quando: {s['condizione']}")
        if s["ostruzione_sospetta"]:
            R.append(f"    OSTRUZIONE SOSPETTA su: {', '.join(s['bloccanti'])}")
        if s["catena"]:
            R.append("    prerequisiti (a ritroso):")
            for nodo in s["catena"]:
                _rendi_catena(nodo, R, 3)
        else:
            R.append("    (nessun prerequisito: vittoria incondizionata)")
        R.append("")
    R.append("    Legenda: [OK] vero all'avvio  [->] producibile  "
             "[!!] mai producibile  [..] dipendenza circolare")
    R.append("")

    R.append("--- AVVISI DEL LINTER (riuso del controllo del compilatore) ---")
    lint = report["linter"]
    etichette = [
        ("stanze_isolate", "Stanze isolate"),
        ("oggetti_orfani", "Oggetti orfani"),
        ("regole_morte", "Regole morte (oscurate)"),
        ("stati_inutilizzati", "Stati/contatori inutilizzati"),
    ]
    qualcosa = False
    for chiave, titolo in etichette:
        for w in lint[chiave]:
            qualcosa = True
            R.append(f"  - [{titolo}] {w}")
    if not qualcosa:
        R.append("  (nessun avviso del linter)")
    R.append("")

    R.append("--- REGOLE POTENZIALMENTE IRRAGGIUNGIBILI (euristica) ---")
    if report["regole_irraggiungibili"]:
        for r in report["regole_irraggiungibili"]:
            R.append(f"  - «Invece di {r['comando']}» (se {r['condizione']})")
            R.append(f"      mai soddisfacibile: {', '.join(r['atomi_mai_soddisfacibili'])}")
    else:
        R.append("  (nessuna)")
    R.append("")

    R.append("--- LIMITE ONESTO ---")
    R.append(report["limite_onesto"])
    R.append("=" * 70)
    return "\n".join(R)


# ==============================================================================
# 9. CLI
# ==============================================================================

def main(argv=None):
    argv = list(sys.argv[1:] if argv is None else argv)
    if len(argv) != 1 or argv[0] in ("-h", "--help"):
        print("Uso: python collaudo.py storia.fav")
        print("Collauda STATICAMENTE una storia .fav (Livello 1: catena della "
              "vittoria + avvisi del linter).")
        return 1

    from compilatore import analizza_file
    mondo = analizza_file(argv[0])
    if mondo is None:
        print("\n[collaudo] Compilazione fallita: niente da analizzare.")
        return 2

    report = analizza_vincibilita(mondo)
    print(rendi_report_testuale(report))
    return 0


if __name__ == "__main__":
    sys.exit(main())
