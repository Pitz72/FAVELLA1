# strumenti_ide.py
# Strumenti d'autore di FAVELLA 1 (v1.4.2), costruiti sopra il nucleo del
# compilatore: ciò che serve agli editor visuali di Favella Studio e al riordino
# del sorgente.
#
# [1.4.0 / L-7] Fino alla 1.3.0 queste funzioni stavano in compilatore.py. Sono
# state spostate qui senza cambiarle:
#   - analizza_outline, analizza_regole, analizza_variabili, analizza_dialoghi:
#     la metà in LETTURA degli editor visuali (il modello editabile, con lo span
#     di ogni frase nel sorgente);
#   - riordina_sorgente: il riordino canonico del file (formattatore);
#   - serializza_frase: la metà in SCRITTURA (la frase .fav canonica).
# `from compilatore import analizza_regole` continua a funzionare (import pigro).

import re
from lark import Token, Tree
from strutture import (
    QUI, descrizione_display,
    CondizioneAnd, CondizioneContatore, CondizioneNot, CondizioneOr, CondizionePngHa,
    CondizionePosizioneGiocatore, CondizionePosizioneOggetto, CondizionePossesso,
    CondizioneProbabilita, CondizioneProprieta, CondizioneVariabile,
    CondizioneVariabileUguali,
    ConseguenzaBuioStanza, ConseguenzaCollegamento, ConseguenzaContatore,
    ConseguenzaFinePartita, ConseguenzaMovimentoPNG, ConseguenzaPngRiceve,
    ConseguenzaProprieta, ConseguenzaSceltaStato, ConseguenzaSpostamento,
    ConseguenzaSpostamentoGiocatore, ConseguenzaTogliProprieta, ConseguenzaVariabile,
    ConseguenzaVariabileCopia,
    OperandoCasuale, OperandoNumero, OperandoVariabile,
)
from favella_utils import normalizza_nome, _scomponi_articolo, QUADRA_APERTA, QUADRA_CHIUSA
from compilatore import (
    VERBI_VALIDI, costruisci_symbol_table, costruisci_parser, valida_direzioni_dichiarate,
    espandi_inclusioni, _espandi_inclusioni_seedable, analizza_file_strutturato,
    compila_mondo,
)


# ==============================================================================
# OUTLINE STRUTTURATO PER GLI EDITOR VISUALI (Favella Studio — Fase 6)
# ------------------------------------------------------------------------------
# analizza_outline restituisce un modello EDITABILE di stanze e oggetti in cui
# OGNI campo è ancorato alla/e frase/i sorgente che lo definiscono (span di riga).
# È la metà in LETTURA del round-trip testo↔visuale: l'IDE rende le form, e per
# applicare una modifica rigenera la SINGOLA frase canonica e la rimpiazza nel
# buffer usando lo span qui restituito (editing chirurgico per-frase). Tutto il
# resto del file (commenti, prosa, ordine, altre entità) resta byte-identico.
#
# ADDITIVA: non tocca analizza_file/compila_mondo né il motore (suite di test salva).
# Combina la VERITÀ SEMANTICA (compila_mondo: id normalizzati, nomi visualizzati,
# uscite con auto-ritorno, proprietà) con le POSIZIONI ricavate da un secondo
# parse con propagate_positions=True, correlando le frasi alle entità per nome.
# ==============================================================================

def _norm_token(tok) -> str:
    """Nome normalizzato (id canonico) da un token ENTITA grezzo (con articolo)."""
    return normalizza_nome(str(tok))


def _tokens_per_tipo(nodo):
    """Raccoglie i Token di un sottoalbero raggruppati per tipo (ENTITA, DIREZIONE,
    PROPRIETA, TESTO_QUOTATO, ...). L'ordine di apparizione è preservato."""
    per_tipo = {}
    for figlio in nodo.scan_values(lambda v: isinstance(v, Token)):
        per_tipo.setdefault(figlio.type, []).append(figlio)
    return per_tipo


def analizza_outline(percorso_file, sorgente=None):
    """[Favella Studio / Fase 6] Modello editabile di stanze e oggetti con lo span
    sorgente di ogni frase, per gli editor visuali. 'sorgente' (opzionale) compila
    il buffer live non salvato, risolvendo gli 'Includi' dal disco.

    Ritorna un dict serializzabile in JSON:
      {ok, rooms[], objects[], errors[]}
    room   = {id, name, isStart, defSpan, descSpan, descConditional, description,
              exits[{direction, to, toName, span, implicit}]}
    object = {id, name, kind, prendibile, defSpan, descSpan, descConditional,
              description, location{id,name,prep,span}|None,
              properties[{name,span}], aliases[{name,span}]}
    Ogni 'span' = {file, line, endLine} nel sorgente ORIGINALE (rimappato dagli
    Includi: file E riga, perché in multi-file un solo numero non basta); None se
    il campo non ha una frase propria (es. l'auto-ritorno di una connessione, che
    si edita sulla frase 'collega' di origine → implicit=True, span=quello
    d'origine). Difensiva: su errore di compilazione restituisce ok=False +
    errors; non solleva mai verso il protocollo."""
    # 1. Verità semantica: il Mondo compilato. Se non compila, niente outline.
    diag = analizza_file_strutturato(percorso_file, sorgente=sorgente)
    if not diag.get("ok"):
        return {"ok": False, "rooms": [], "objects": [],
                "directions": [], "oppositeDirections": {}, "opposites": [], "startSpan": None,
                "carryBase": None, "carryBaseSpan": None,
                "errors": diag.get("errors", [])}
    mondo = compila_mondo(percorso_file, sorgente)
    if mondo is None:
        return {"ok": False, "rooms": [], "objects": [],
                "directions": [], "oppositeDirections": {}, "opposites": [], "startSpan": None,
                "carryBase": None, "carryBaseSpan": None,
                "errors": diag.get("errors", [])}

    # 2. Posizioni: secondo parse con propagate_positions, mappa riga→(file, riga).
    try:
        if sorgente is not None:
            testo, mappa_righe, _err = _espandi_inclusioni_seedable(percorso_file, sorgente)
        else:
            testo, mappa_righe, _err = espandi_inclusioni(percorso_file)
        simboli = costruisci_symbol_table(testo)
        coppie_dir, nomi_dir, _de = valida_direzioni_dichiarate(
            simboli.coppie_direzioni, simboli)
        parser = costruisci_parser(simboli.tutti, simboli.variabili, nomi_dir,
                                   propagate_positions=True,
                                   verbi_multi=simboli.verbi_multi)
        tree = parser.parse(testo)
    except Exception:
        # Il Mondo c'è ma le posizioni no: outline senza span (editing degradato).
        tree, mappa_righe = None, []

    def _riga_orig(linea_espansa):
        """(file, riga) originali dalla source map: una frase espansa può vivere in
        un file Incluso diverso dal radice. Per editare la frase giusta lo splicer
        ha bisogno SIA del file SIA della riga (un solo numero non basta in
        multi-file). Fallback al file radice se la mappa non copre la riga."""
        if (mappa_righe and isinstance(linea_espansa, int)
                and 1 <= linea_espansa <= len(mappa_righe)):
            f_o, r_o = mappa_righe[linea_espansa - 1]
            return f_o, r_o
        return percorso_file, linea_espansa

    def _span(line_exp, end_exp):
        """Ancora sorgente {file, line, endLine} di una frase (None se ignota).
        line ed endLine sono nello stesso file (una frase non attraversa Includi)."""
        if line_exp is None:
            return None
        f_o, r_o = _riga_orig(line_exp)
        _f2, r_end = _riga_orig(end_exp) if end_exp is not None else (f_o, r_o)
        return {"file": f_o, "line": r_o, "endLine": r_end}

    # 3. Indicizza le frasi sorgente per (tipo, entità) → span e dettagli.
    #    Una stessa entità può avere più frasi (più proprietà, più connessioni):
    #    raccogliamo liste, non singoli valori.
    frasi = []  # {data, span:{file,line,endLine}, tokens(per tipo)}
    if tree is not None:
        for nodo in tree.children:
            if not isinstance(nodo, Tree):
                continue
            meta = getattr(nodo, "meta", None)
            line = getattr(meta, "line", None) if meta else None
            end = getattr(meta, "end_line", line) if meta else None
            frasi.append({
                "data": nodo.data,
                "span": _span(line, end),
                "tok": _tokens_per_tipo(nodo),
            })

    def _prima(data, id_entita, indice_entita=0):
        """Span della prima frase di tipo 'data' la cui ENTITA all'indice dato
        corrisponde a id_entita (None se assente)."""
        for f in frasi:
            if f["data"] != data:
                continue
            ents = f["tok"].get("ENTITA", [])
            if len(ents) > indice_entita and _norm_token(ents[indice_entita]) == id_entita:
                return f["span"]
        return None

    # 4. STANZE.
    start = mondo.posizione_iniziale if mondo.posizione_iniziale in mondo.stanze \
        else next(iter(mondo.stanze), None)
    rooms = []
    for rid, st in mondo.stanze.items():
        # Uscite: per ognuna cerca una frase 'collega' che la dichiara
        # esplicitamente (from=rid, dir, to). L'opposta (auto-ritorno) non ha
        # frase propria → implicit, ancorata alla connessione d'origine.
        exits = []
        for direzione, dest in getattr(st, "uscite", {}).items():
            span, implicit = None, True
            for f in frasi:
                if f["data"] != "def_connessione":
                    continue
                ents = f["tok"].get("ENTITA", [])
                dirs = f["tok"].get("DIREZIONE", [])
                if len(ents) >= 2 and dirs and _norm_token(ents[0]) == rid:
                    forma = str(dirs[0]).lower()
                    if mondo.direzione_canonica(forma) == direzione \
                            and _norm_token(ents[1]) == dest:
                        span, implicit = f["span"], False
                        break
            if span is None:
                # Origine dell'auto-ritorno: la connessione inversa (dest→rid).
                for f in frasi:
                    if f["data"] != "def_connessione":
                        continue
                    ents = f["tok"].get("ENTITA", [])
                    if len(ents) >= 2 and _norm_token(ents[0]) == dest \
                            and _norm_token(ents[1]) == rid:
                        span = f["span"]
                        break
            exits.append({
                "direction": direzione,
                "to": dest,
                "toName": mondo.stanze[dest].nome_visualizzato if dest in mondo.stanze else dest,
                "span": span,
                "implicit": implicit,
            })
        rooms.append({
            "id": rid,
            "name": st.nome_visualizzato,
            "isStart": rid == start,
            "defSpan": _prima("def_stanza", rid),
            "descSpan": _prima("def_descrizione", rid),
            "descConditional": _ha_descr_condizionale(frasi, rid),
            "description": descrizione_display(st.descrizione),
            "exits": exits,
        })

    # 5. OGGETTI.
    def _kind(o):
        if getattr(o, "is_personaggio", False):
            return "personaggio"
        if getattr(o, "is_contenitore", False):
            return "contenitore"
        if getattr(o, "is_supporto", False):
            return "supporto"
        return "oggetto"

    _DEF_PER_KIND = {
        "oggetto": "def_oggetto", "contenitore": "def_contenitore",
        "supporto": "def_supporto", "personaggio": "def_personaggio",
    }

    objects = []
    for oid, o in mondo.oggetti.items():
        kind = _kind(o)
        # Proprietà: ogni 'X è PROPRIETA.' (incl. 'prendibile') con il suo span.
        properties = []
        for f in frasi:
            if f["data"] != "def_proprieta":
                continue
            ents = f["tok"].get("ENTITA", [])
            props = f["tok"].get("PROPRIETA", [])
            if ents and props and _norm_token(ents[0]) == oid:
                properties.append({"name": str(props[0]), "span": f["span"]})
        # Alias dichiarati per questo oggetto.
        aliases = []
        for f in frasi:
            if f["data"] != "def_alias":
                continue
            ents = f["tok"].get("ENTITA", [])
            quotati = f["tok"].get("TESTO_QUOTATO", [])
            if ents and quotati and _norm_token(ents[0]) == oid:
                aliases.append({"name": _spoglia_quotato(str(quotati[0])), "span": f["span"]})
        # Posizione: 'X è PREP_LUOGO Y.' (ENTITA[0]=oggetto, ENTITA[1]=luogo).
        location = None
        pos = getattr(o, "posizione", None)
        if pos and pos not in (None, "inventario"):
            span = None
            prep = None
            for f in frasi:
                if f["data"] != "def_posizione":
                    continue
                ents = f["tok"].get("ENTITA", [])
                if len(ents) >= 2 and _norm_token(ents[0]) == oid:
                    span = f["span"]
                    preps = f["tok"].get("PREP_LUOGO", [])
                    prep = str(preps[0]) if preps else None
                    break
            nome_luogo = (mondo.stanze[pos].nome_visualizzato if pos in mondo.stanze
                          else mondo.oggetti[pos].nome_visualizzato if pos in mondo.oggetti
                          else pos)
            location = {"id": pos, "name": nome_luogo, "prep": prep, "span": span}
        # [Livello 7] Bonus di capacità: 'X dà N spazi.' (0 = nessuno).
        carry_bonus_span = None
        for f in frasi:
            if f["data"] != "def_capacita_oggetto":
                continue
            ents = f["tok"].get("ENTITA", [])
            if ents and _norm_token(ents[0]) == oid:
                carry_bonus_span = f["span"]
                break
        objects.append({
            "id": oid,
            "name": o.nome_visualizzato,
            "kind": kind,
            "prendibile": getattr(o, "prendibile", False),
            "carryBonus": getattr(o, "bonus_capacita", 0),
            "carryBonusSpan": carry_bonus_span,
            "defSpan": _prima(_DEF_PER_KIND[kind], oid),
            "descSpan": _prima("def_descrizione", oid),
            "descConditional": _ha_descr_condizionale(frasi, oid),
            "description": descrizione_display(o.descrizione),
            # [1.1.0] posto iniziale (None se non dichiarato) e la sua frase.
            "initialAppearance": getattr(o, "posto", None),
            "initialAppearanceSpan": _prima("def_posto", oid),
            "location": location,
            "properties": properties,
            "aliases": aliases,
        })

    # Direzioni canoniche VALIDE in questo mondo (base nord/sud/est/ovest + quelle
    # personalizzate dichiarate dall'autore): l'IDE offre solo queste nel selettore
    # di connessione, così non genera frasi con direzioni non dichiarate.
    directions = sorted(set(getattr(mondo, "direzioni", {}).values()))

    # Coppie di proprietà OPPOSTE (mutuamente esclusive): aperta↔chiusa (default
    # del motore, controlla il contenuto visibile dei contenitori) + quelle
    # dichiarate dall'autore con 'X e Y sono opposte.'. L'IDE le offre come
    # selettori a due stati nell'inspector oggetti (non come tag liberi). La mappa
    # mondo.opposti è simmetrica (a→{b}, b→{a}): dedup in coppie canoniche ordinate.
    opposites = []
    _visti_opp = set()
    for prop_a, controparti in getattr(mondo, "opposti", {}).items():
        for prop_b in controparti:
            chiave = tuple(sorted((str(prop_a), str(prop_b))))
            if chiave in _visti_opp or chiave[0] == chiave[1]:
                continue
            _visti_opp.add(chiave)
            opposites.append({"a": chiave[0], "b": chiave[1]})
    opposites.sort(key=lambda p: (p["a"], p["b"]))

    # Span della frase di partenza ('Il giocatore comincia in X.'), se presente:
    # permette all'editor stanze di SOSTITUIRLA (non accumularne di nuove).
    start_span = next((f["span"] for f in frasi if f["data"] == "def_giocatore"), None)

    # [Livello 7] Capacità di trasporto BASE del giocatore ('Il giocatore può
    # portare N oggetti.'). None = illimitata (default storico).
    carry_base = getattr(mondo, "capacita_base", None)
    carry_base_span = next(
        (f["span"] for f in frasi if f["data"] == "def_giocatore_capacita"), None)

    # [Studio 1.1] Per ogni direzione la sua opposta (nord↔sud, est↔ovest, le
    # personalizzate in coppia): serve a riscrivere il ritorno di un'uscita quando
    # se ne cambia la direzione dal pannello della stanza.
    opposte_dir = {d: o for d, o in getattr(mondo, "opposte_direzioni", {}).items()}

    return {"ok": True, "rooms": rooms, "objects": objects,
            "directions": directions, "oppositeDirections": opposte_dir,
            "opposites": opposites,
            "startSpan": start_span,
            "carryBase": carry_base, "carryBaseSpan": carry_base_span,
            "errors": []}


def _ha_descr_condizionale(frasi, id_entita) -> bool:
    """True se l'entità ha almeno una descrizione CONDIZIONALE (clausola 'se'):
    rilevata dalla presenza di un sottoalbero condizione nella frase def_descrizione.
    Round-trip prudente: l'IDE non riscrive le descrizioni condizionali in v1."""
    for f in frasi:
        if f["data"] != "def_descrizione":
            continue
        ents = f["tok"].get("ENTITA", [])
        if ents and _norm_token(ents[0]) == id_entita:
            # Una descrizione condizionale cita almeno un'altra ENTITA/VARIABILE
            # nella condizione, oppure un PROPRIETA/NUMERO di confronto.
            if (len(ents) > 1 or f["tok"].get("VARIABILE")
                    or f["tok"].get("NUMERO")):
                return True
    return False


def _spoglia_quotato(s: str) -> str:
    """Rimuove le virgolette esterne da un TESTO_QUOTATO e scioglie gli escape."""
    if len(s) >= 2 and s[0] == '"' and s[-1] == '"':
        s = s[1:-1]
    return s.replace('\\"', '"').replace("\\\\", "\\")


# ==============================================================================
# LETTURA DELLE REGOLE/EVENTI (Favella Studio — Fase 6c, «logica senza codice»)
# ------------------------------------------------------------------------------
# analizza_regole è il lato LETTURA dell'editor visuale di regole. Riusa la
# stessa strategia di analizza_outline: compila il Mondo (verità semantica) e da
# un secondo parse posizionato ricava lo SPAN di ogni frase 'Invece di…' / 'Al
# turno…'. Le Regola/Evento compilate portano già condizione e conseguenze come
# OGGETTI strutturati: li serializzo in JSON ricorsivo (shape simmetrica a quella
# che il serializzatore 'rule'/'event' riaccetterà in scrittura). Lo span lo
# aggancio per (verbo, risposta) / (tipo, n, risposta). ADDITIVA: motore intatto.
# ==============================================================================

def _nome_entita(mondo, eid):
    """ID normalizzato → nome visualizzato (oggetto o stanza); l'ID stesso se
    ignoto o se è uno pseudo-simbolo (inventario/nulla)."""
    if eid in getattr(mondo, "oggetti", {}):
        return mondo.oggetti[eid].nome_visualizzato
    if eid in getattr(mondo, "stanze", {}):
        return mondo.stanze[eid].nome_visualizzato
    return eid


def _kind_variabile(mondo, nome):
    """'contatore' se il valore corrente è int (i contatori nascono a 0), 'stato'
    altrimenti (gli stati nascono None o stringa). Distinzione usata dall'editor."""
    return "contatore" if isinstance(mondo.variabili.get(nome), int) else "stato"


# [Favella Studio / Stati] Commento canonico che persiste l'elenco dei valori
# ammessi di uno stato: '# valori di <nome>: a, b, c'. Il motore lo ignora (è un
# commento); il sidecar lo legge per popolare i dropdown anche con valori non
# ancora usati in alcuna regola. Vedi serializza_frase op 'state_values_comment'.
_RE_VALORI_COMMENTO = re.compile(
    r"^\s*#\s*valori\s+di\s+(?P<nome>.+?)\s*:\s*(?P<lista>.+?)\s*$", re.IGNORECASE)


def _raccogli_valori_cond(cond, acc):
    """Accumula in acc (dict id-stato -> set di valori) i valori-stato citati in una
    condizione JSON (ricorsiva: not/and/or)."""
    if not cond:
        return
    op = cond.get("op")
    if op == "var" and cond.get("value"):
        acc.setdefault(cond["name"], set()).add(cond["value"])
    elif op == "not":
        _raccogli_valori_cond(cond.get("term"), acc)
    elif op in ("and", "or"):
        for t in cond.get("terms", []):
            _raccogli_valori_cond(t, acc)


def _raccogli_valori_conseq(conseguenze, acc):
    """Accumula in acc i valori-stato impostati da una lista di conseguenze JSON."""
    for c in conseguenze or []:
        if c.get("op") == "var" and c.get("value"):
            acc.setdefault(c["name"], set()).add(c["value"])


def _valori_commento(testo):
    """Scansiona il sorgente espanso per i commenti '# valori di X: …'. Ritorna
    una lista di (nome_grezzo, [valori], linea_espansa). Nessun filtro qui sui
    nomi: il chiamante normalizza e tiene solo gli stati realmente dichiarati."""
    fuori = []
    for i, riga in enumerate(testo.splitlines(), start=1):
        m = _RE_VALORI_COMMENTO.match(riga)
        if not m:
            continue
        valori = [v.strip().lower() for v in m.group("lista").split(",") if v.strip()]
        fuori.append((m.group("nome").strip(), valori, i))
    return fuori


def _nome_stanza(mondo, sid):
    """Nome visualizzato di una stanza (con articolo), o l'id se assente."""
    st = mondo.stanze.get(sid) if mondo else None
    return st.nome_visualizzato if st else sid


def _nucleo_nome(nome):
    """Nucleo del nome senza articolo iniziale (per «in cucina», non «in la cucina»)."""
    _art, nucleo = _scomponi_articolo(nome or "")
    return nucleo or nome


def _operando_to_json(op):
    """[0.31.0] Serializza un Operando (il termine-quantità di un confronto o di
    una mutazione di contatore) in una forma JSON. Un letterale resta un INT
    semplice (forma storica, retrocompatibile con l'IDE); le forme dinamiche
    introdotte in 0.31.0 diventano un oggetto con 'kind'."""
    if isinstance(op, OperandoNumero):
        return op.n
    if isinstance(op, OperandoVariabile):
        return {"kind": "var", "name": op.nome}
    if isinstance(op, OperandoCasuale):
        return {"kind": "rand", "min": op.minimo, "max": op.massimo}
    if isinstance(op, int):           # difensivo: eventuale int grezzo
        return op
    return None


def _cond_to_json(c, mondo):
    """Serializza una Condizione (albero) in JSON ricorsivo. None → None."""
    if c is None:
        return None
    if isinstance(c, CondizioneNot):
        # [0.18.0 / B5] '≠ N' sul contatore è modellato come NOT(== N): lo ripresento
        # come un confronto count con cmp '!=' (round-trip pulito col builder).
        inner = c.condizione
        if isinstance(inner, CondizioneContatore) and inner.operatore == "==":
            return {"op": "count", "name": inner.nome, "cmp": "!=", "value": _operando_to_json(inner.valore)}
        return {"op": "not", "term": _cond_to_json(inner, mondo)}
    if isinstance(c, CondizioneAnd):
        return {"op": "and", "terms": [_cond_to_json(x, mondo) for x in c.condizioni]}
    if isinstance(c, CondizioneOr):
        return {"op": "or", "terms": [_cond_to_json(x, mondo) for x in c.condizioni]}
    if isinstance(c, CondizionePossesso):
        return {"op": "has", "id": c.id_oggetto, "name": _nome_entita(mondo, c.id_oggetto)}
    if isinstance(c, CondizioneProprieta):
        return {"op": "prop", "id": c.id_oggetto,
                "name": _nome_entita(mondo, c.id_oggetto), "prop": c.proprieta}
    if isinstance(c, CondizioneVariabile):
        return {"op": "var", "name": c.nome, "value": c.valore,
                "kind": _kind_variabile(mondo, c.nome)}
    if isinstance(c, CondizioneVariabileUguali):
        # [0.34.0 / Tema 3] Confronto stato↔stato: 'X è Y' (entrambi stati).
        return {"op": "varEq", "name": c.nome, "other": c.altro}
    if isinstance(c, CondizioneContatore):
        return {"op": "count", "name": c.nome, "cmp": c.operatore, "value": _operando_to_json(c.valore)}
    if isinstance(c, CondizionePosizioneGiocatore):
        # [0.18.0 / B1] 'se il giocatore è in [stanza]'.
        return {"op": "playerIn", "room": c.id_stanza, "name": _nome_stanza(mondo, c.id_stanza)}
    if isinstance(c, CondizioneProbabilita):
        # [0.32.0 / Tema 2c] 'càpita (N su M)'.
        return {"op": "chance", "num": c.numeratore, "den": c.denominatore}
    if isinstance(c, CondizionePosizioneOggetto):
        # [1.3.0 / G-6] 'X è in Y' / 'X è qui'.
        luogo = "qui" if c.luogo == QUI else c.luogo
        return {"op": "objIn", "id": c.id_oggetto, "name": _nome_entita(mondo, c.id_oggetto),
                "place": luogo, "placeName": _nome_entita(mondo, luogo)}
    if isinstance(c, CondizionePngHa):
        # [1.3.0 / M-10] 'il personaggio ha X'.
        return {"op": "npcHas", "npc": c.id_png, "npcName": _nome_entita(mondo, c.id_png),
                "id": c.id_oggetto, "name": _nome_entita(mondo, c.id_oggetto)}
    return {"op": "unknown"}


def _conseq_to_json(c, mondo):
    """Serializza una Conseguenza in JSON. Shape simmetrica al serializzatore."""
    if isinstance(c, ConseguenzaProprieta):
        return {"op": "prop", "id": c.id_oggetto,
                "name": _nome_entita(mondo, c.id_oggetto), "prop": c.proprieta}
    if isinstance(c, ConseguenzaVariabile):
        return {"op": "var", "name": c.nome, "value": c.valore,
                "kind": _kind_variabile(mondo, c.nome)}
    if isinstance(c, ConseguenzaVariabileCopia):
        # [0.34.0 / Tema 3] Copia stato↔stato: 'X diventa Y' (entrambi stati).
        return {"op": "varCopy", "name": c.nome, "from": c.sorgente}
    if isinstance(c, ConseguenzaSceltaStato):
        # [0.32.0 / Tema 2b] 'il meteo diventa uno fra sereno, pioggia, nebbia'.
        return {"op": "pick", "name": c.nome, "values": list(c.valori),
                "kind": _kind_variabile(mondo, c.nome)}
    if isinstance(c, ConseguenzaBuioStanza):
        # [0.33.0 / Tema 4a] 'la radura diventa buia' / '… diventa illuminata'.
        return {"op": "dark", "room": c.id_stanza,
                "name": _nome_stanza(mondo, c.id_stanza), "dark": c.buio}
    if isinstance(c, ConseguenzaMovimentoPNG):
        # [0.25.0 / A5] '<png> va <prep> <stanza>' (deterministico) o '<png> cambia
        # stanza' (adiacente, casuale). 'name' è il PNG con articolo (ENTITA).
        return {"op": "movePNG", "png": c.id_png, "name": _nome_entita(mondo, c.id_png),
                "adjacent": bool(c.adiacente),
                "dest": c.destinazione,
                "destName": _nome_stanza(mondo, c.destinazione) if c.destinazione else None}
    if isinstance(c, ConseguenzaContatore):
        return {"op": "count", "name": c.nome, "mode": c.modo, "value": _operando_to_json(c.valore)}
    if isinstance(c, ConseguenzaSpostamento):
        dest = c.destinazione
        dest_name = dest if dest in ("inventario", "nulla") else _nome_entita(mondo, dest)
        return {"op": "move", "id": c.id_oggetto,
                "name": _nome_entita(mondo, c.id_oggetto),
                "dest": dest, "destName": dest_name}
    if isinstance(c, ConseguenzaSpostamentoGiocatore):
        # [0.18.0 / B2] Teletrasporto: 'e adesso il giocatore è in [stanza]'.
        return {"op": "teleport", "room": c.id_stanza, "name": _nome_stanza(mondo, c.id_stanza)}
    if isinstance(c, ConseguenzaTogliProprieta):
        # [1.3.0 / M-2] 'X non è più P'.
        return {"op": "unprop", "id": c.id_oggetto,
                "name": _nome_entita(mondo, c.id_oggetto), "prop": c.proprieta}
    if isinstance(c, ConseguenzaCollegamento):
        # [1.3.0 / M-8] 'X collega D a Y' / 'X non collega più D'.
        voce = {"op": "link" if c.destinazione else "unlink", "room": c.id_stanza,
                "name": _nome_stanza(mondo, c.id_stanza), "direction": c.direzione}
        if c.destinazione:
            voce.update(dest=c.destinazione, destName=_nome_stanza(mondo, c.destinazione))
        return voce
    if isinstance(c, ConseguenzaPngRiceve):
        # [1.3.0 / M-10] 'il personaggio ha X'.
        return {"op": "give", "npc": c.id_png, "npcName": _nome_entita(mondo, c.id_png),
                "id": c.id_oggetto, "name": _nome_entita(mondo, c.id_oggetto)}
    if isinstance(c, ConseguenzaFinePartita):
        _esiti = {"vinta": "vinci", "persa": "perdi", "terminata": "termina"}
        # [0.18.0 / B3] Testo d'esito opzionale (None se non personalizzato).
        return {"op": "end", "outcome": _esiti.get(c.esito, c.esito),
                "message": getattr(c, "messaggio", None)}
    return {"op": "unknown"}


def analizza_regole(percorso_file, sorgente=None):
    """[Favella Studio / Fase 6c] Modello editabile di REGOLE ed EVENTI con lo span
    sorgente di ogni frase. Ritorna:
      {ok, rules[], events[], menu{verbs,objects,rooms,directions,states,counters},
       errors[]}
    rule  = {span, verb, target|None{kind:'object'|'direction', id, name, prep,
             secondaryId, secondaryName}, condition|None, response, consequences[]}
    event = {span, mode:'al'|'ogni', n, response, consequences[]}
    condition/consequence = JSON ricorsivo (vedi _cond_to_json/_conseq_to_json).
    Difensiva: su errore restituisce ok=False + errors, non solleva."""
    diag = analizza_file_strutturato(percorso_file, sorgente=sorgente)
    vuoto_menu = {"verbs": [], "objects": [], "rooms": [],
                  "directions": [], "states": [], "counters": []}
    if not diag.get("ok"):
        return {"ok": False, "rules": [], "events": [], "demons": [], "menu": vuoto_menu,
                "errors": diag.get("errors", [])}
    mondo = compila_mondo(percorso_file, sorgente)
    if mondo is None:
        return {"ok": False, "rules": [], "events": [], "demons": [], "menu": vuoto_menu,
                "errors": diag.get("errors", [])}

    # Span: secondo parse posizionato (come analizza_outline).
    try:
        if sorgente is not None:
            testo, mappa_righe, _err = _espandi_inclusioni_seedable(percorso_file, sorgente)
        else:
            testo, mappa_righe, _err = espandi_inclusioni(percorso_file)
        simboli = costruisci_symbol_table(testo)
        _cp, nomi_dir, _de = valida_direzioni_dichiarate(simboli.coppie_direzioni, simboli)
        parser = costruisci_parser(simboli.tutti, simboli.variabili, nomi_dir,
                                   propagate_positions=True,
                                   verbi_multi=simboli.verbi_multi)
        tree = parser.parse(testo)
    except Exception:
        tree, mappa_righe = None, []

    def _riga_orig(linea_espansa):
        if (mappa_righe and isinstance(linea_espansa, int)
                and 1 <= linea_espansa <= len(mappa_righe)):
            return mappa_righe[linea_espansa - 1]
        return percorso_file, linea_espansa

    def _span(line_exp, end_exp):
        if line_exp is None:
            return None
        f_o, r_o = _riga_orig(line_exp)
        _f2, r_end = _riga_orig(end_exp) if end_exp is not None else (f_o, r_o)
        return {"file": f_o, "line": r_o, "endLine": r_end}

    # Indicizza le frasi-regola/evento con il loro span e i token utili al match.
    frasi_regola = []   # {span, verbo, risposta}
    frasi_evento = []   # {span, tipo, n, risposta}
    frasi_demone = []   # {span, mode, risposta}
    if tree is not None:
        for nodo in tree.children:
            if not isinstance(nodo, Tree):
                continue
            meta = getattr(nodo, "meta", None)
            line = getattr(meta, "line", None) if meta else None
            end = getattr(meta, "end_line", line) if meta else None
            span = _span(line, end)
            tok = _tokens_per_tipo(nodo)
            if nodo.data == "def_regola":
                verbi = tok.get("VERBO", [])
                quotati = tok.get("TESTO_QUOTATO", [])
                frasi_regola.append({
                    "span": span,
                    "verbo": str(verbi[0]).lower() if verbi else None,
                    "risposta": _spoglia_quotato(str(quotati[0])) if quotati else None,
                })
            elif nodo.data in ("evento_al", "evento_ogni"):
                numeri = tok.get("NUMERO", [])
                quotati = tok.get("TESTO_QUOTATO", [])
                frasi_evento.append({
                    "span": span,
                    "tipo": "al" if nodo.data == "evento_al" else "ogni",
                    "n": int(str(numeri[0])) if numeri else None,
                    "risposta": _spoglia_quotato(str(quotati[0])) if quotati else None,
                })
            elif nodo.data in ("demone_ogni", "demone_quando", "demone_dopo"):
                quotati = tok.get("TESTO_QUOTATO", [])
                frasi_demone.append({
                    "span": span,
                    "mode": {"demone_ogni": "ogni", "demone_quando": "quando"}.get(nodo.data, "dopo"),
                    "risposta": _spoglia_quotato(str(quotati[0])) if quotati else None,
                })

    def _span_regola(verbo, risposta, usate):
        for i, f in enumerate(frasi_regola):
            if i in usate:
                continue
            if f["verbo"] == verbo and f["risposta"] == risposta:
                usate.add(i)
                return f["span"]
        return None

    def _span_evento(tipo, n, risposta, usate):
        for i, f in enumerate(frasi_evento):
            if i in usate:
                continue
            if f["tipo"] == tipo and f["n"] == n and f["risposta"] == risposta:
                usate.add(i)
                return f["span"]
        return None

    def _span_demone(mode, risposta, usate):
        for i, f in enumerate(frasi_demone):
            if i in usate:
                continue
            if f["mode"] == mode and f["risposta"] == risposta:
                usate.add(i)
                return f["span"]
        return None

    # REGOLE compilate → JSON.
    rules = []
    usate_r = set()
    for r in getattr(mondo, "regole", []):
        target = None
        bid = getattr(r, "id_oggetto_bersaglio", None)
        if bid:
            if bid in getattr(mondo, "direzioni", {}).values() or bid in getattr(mondo, "opposte_direzioni", {}):
                target = {"kind": "direction", "id": bid, "name": bid,
                          "prep": None, "secondaryId": None, "secondaryName": None}
            else:
                sec = getattr(r, "id_oggetto_secondario", None)
                target = {"kind": "object", "id": bid, "name": _nome_entita(mondo, bid),
                          "prep": getattr(r, "preposizione", None),
                          "secondaryId": sec,
                          "secondaryName": _nome_entita(mondo, sec) if sec else None}
        # [1.3.0 / M-9] Regola per categoria: 'qualcosa (di …)'.
        if getattr(r, "categoria", None) is not None or getattr(r, "categoria_secondaria", None) is not None:
            def _cat(radice, oid):
                if radice is None:
                    return _nome_entita(mondo, oid) if oid else None
                return "qualcosa" + (f" di {radice}" if radice else "")
            target = {"kind": "category", "id": r.id_oggetto_bersaglio,
                      "name": _cat(r.categoria, r.id_oggetto_bersaglio),
                      "category": r.categoria,
                      "prep": getattr(r, "preposizione", None),
                      "secondaryId": r.id_oggetto_secondario,
                      "secondaryName": _cat(r.categoria_secondaria, r.id_oggetto_secondario),
                      "secondaryCategory": r.categoria_secondaria}
        altrimenti = getattr(r, "altrimenti", None)
        rules.append({
            "span": _span_regola(r.verbo, r.risposta, usate_r),
            "phase": getattr(r, "fase", "invece"),
            "verb": r.verbo,
            "target": target,
            "condition": _cond_to_json(getattr(r, "condizione", None), mondo),
            "response": r.risposta,
            "consequences": [_conseq_to_json(c, mondo) for c in getattr(r, "conseguenze", [])],
            "otherwise": ({"response": altrimenti[0],
                           "consequences": [_conseq_to_json(c, mondo) for c in altrimenti[1]]}
                          if altrimenti else None),
        })

    # EVENTI compilati → JSON.
    events = []
    usate_e = set()
    for e in getattr(mondo, "eventi", []):
        events.append({
            "span": _span_evento(e.tipo, e.n, e.risposta, usate_e),
            "mode": e.tipo,
            "n": e.n,
            "response": e.risposta,
            "consequences": [_conseq_to_json(c, mondo) for c in getattr(e, "conseguenze", [])],
        })

    # DEMONI compilati → JSON (Livello 8: 'Ogni turno se …' / 'Quando … diventa vera').
    demons = []
    usate_d = set()
    for d in getattr(mondo, "demoni", []):
        mode = {"ogni_turno": "ogni", "quando": "quando"}.get(d.tipo, d.tipo)
        demons.append({
            "span": _span_demone(mode, d.risposta, usate_d),
            "mode": mode,
            "n": getattr(d, "ritardo", 0),   # [1.3.0 / M-7] solo per 'dopo' 
            "condition": _cond_to_json(getattr(d, "condizione", None), mondo),
            "response": d.risposta,
            "consequences": [_conseq_to_json(c, mondo) for c in getattr(d, "conseguenze", [])],
        })

    # Menu per i costruttori (6c.2+): verbi validi, entità, stanze, direzioni,
    # stati e contatori dichiarati.
    states, counters = [], []
    for nome in mondo.variabili:
        (counters if _kind_variabile(mondo, nome) == "contatore" else states).append(nome)

    # [Stati] Valori ammessi per ogni stato: OSSERVATI (valore iniziale + valori
    # citati in condizioni/conseguenze) ∪ DICHIARATI (commento '# valori di X: …').
    # Alimenta il dropdown del valore-stato nel builder di regole.
    valori_acc = {}
    for nome in states:
        iniziale = mondo.variabili.get(nome)
        if isinstance(iniziale, str) and iniziale:
            valori_acc.setdefault(nome, set()).add(iniziale)
    for r in rules:
        _raccogli_valori_cond(r.get("condition"), valori_acc)
        _raccogli_valori_conseq(r.get("consequences"), valori_acc)
    for e in events:
        _raccogli_valori_conseq(e.get("consequences"), valori_acc)
    set_states = set(states)
    for nome_grezzo, valori_c, _linea in _valori_commento(testo if tree is not None else ""):
        nid = normalizza_nome(nome_grezzo)
        if nid in set_states:
            valori_acc.setdefault(nid, set()).update(valori_c)
    state_values = {nome: sorted(valori_acc.get(nome, set())) for nome in states}

    menu = {
        "verbs": sorted(VERBI_VALIDI),
        "objects": [{"id": oid, "name": o.nome_visualizzato,
                     "kind": ("personaggio" if getattr(o, "is_personaggio", False)
                              else "contenitore" if getattr(o, "is_contenitore", False)
                              else "supporto" if getattr(o, "is_supporto", False)
                              else "oggetto")}
                    for oid, o in mondo.oggetti.items()],
        "rooms": [{"id": rid, "name": st.nome_visualizzato} for rid, st in mondo.stanze.items()],
        "directions": sorted(set(getattr(mondo, "direzioni", {}).values())),
        "states": sorted(states),
        "counters": sorted(counters),
        "stateValues": state_values,
    }

    return {"ok": True, "rules": rules, "events": events, "demons": demons, "menu": menu, "errors": []}


def analizza_variabili(percorso_file, sorgente=None):
    """[Favella Studio / Stati] Modello editabile di STATI e CONTATORI con lo span
    sorgente delle frasi rilevanti, per il pannello «Stati & Contatori». Ritorna:
      {ok,
       states[{name, initial|None, initialSpan|None, declSpan|None,
                values[], valuesComment{span,values}|None}],
       counters[{name, declSpan|None}],
       errors[]}
    'values' è l'elenco curato dei valori ammessi = valore iniziale ∪ commento
    canonico '# valori di X: …'. Difensiva: su errore ritorna ok=False, non solleva."""
    diag = analizza_file_strutturato(percorso_file, sorgente=sorgente)
    if not diag.get("ok"):
        return {"ok": False, "states": [], "counters": [],
                "errors": diag.get("errors", [])}
    mondo = compila_mondo(percorso_file, sorgente)
    if mondo is None:
        return {"ok": False, "states": [], "counters": [],
                "errors": diag.get("errors", [])}

    # Span: secondo parse posizionato (come analizza_regole/analizza_outline).
    try:
        if sorgente is not None:
            testo, mappa_righe, _err = _espandi_inclusioni_seedable(percorso_file, sorgente)
        else:
            testo, mappa_righe, _err = espandi_inclusioni(percorso_file)
        simboli = costruisci_symbol_table(testo)
        _cp, nomi_dir, _de = valida_direzioni_dichiarate(simboli.coppie_direzioni, simboli)
        parser = costruisci_parser(simboli.tutti, simboli.variabili, nomi_dir,
                                   propagate_positions=True,
                                   verbi_multi=simboli.verbi_multi)
        tree = parser.parse(testo)
    except Exception:
        tree, mappa_righe, testo = None, [], ""

    def _riga_orig(linea_espansa):
        if (mappa_righe and isinstance(linea_espansa, int)
                and 1 <= linea_espansa <= len(mappa_righe)):
            return mappa_righe[linea_espansa - 1]
        return percorso_file, linea_espansa

    def _span(line_exp, end_exp=None):
        if line_exp is None:
            return None
        f_o, r_o = _riga_orig(line_exp)
        _f2, r_end = _riga_orig(end_exp) if end_exp is not None else (f_o, r_o)
        return {"file": f_o, "line": r_o, "endLine": r_end}

    # Indicizza le frasi di dichiarazione/valore-iniziale con il loro span.
    decl_stato, decl_cont, init_stato, init_cont = {}, {}, {}, {}
    if tree is not None:
        for nodo in tree.children:
            if not isinstance(nodo, Tree):
                continue
            meta = getattr(nodo, "meta", None)
            line = getattr(meta, "line", None) if meta else None
            end = getattr(meta, "end_line", line) if meta else None
            span = _span(line, end)
            tok = _tokens_per_tipo(nodo)
            vlist = tok.get("VARIABILE", [])
            if not vlist:
                continue
            nome = normalizza_nome(str(vlist[0]))
            if nodo.data == "def_stato":
                decl_stato[nome] = span
            elif nodo.data == "def_contatore":
                decl_cont[nome] = span
            elif nodo.data == "def_stato_valore":
                props = tok.get("PROPRIETA", [])
                valore = normalizza_nome(str(props[0])) if props else None
                init_stato[nome] = (valore, span)  # l'ultima vince (come il motore)
            elif nodo.data == "def_contatore_iniziale":
                # [0.16.0] 'La forza parte da N.' — valore iniziale del contatore.
                nums = tok.get("NUMERO", [])
                init_cont[nome] = (int(str(nums[0])) if nums else None, span)

    # Commenti '# valori di X: …' → mappa id-stato -> (valori, span). Ultima vince.
    commenti = {}
    for nome_grezzo, valori_c, linea in _valori_commento(testo if tree is not None else ""):
        nid = normalizza_nome(nome_grezzo)
        commenti[nid] = (valori_c, _span(linea))

    states, counters = [], []
    for nome in mondo.variabili:
        if _kind_variabile(mondo, nome) == "contatore":
            val = mondo.variabili.get(nome)
            counters.append({
                "name": nome,
                "declSpan": decl_cont.get(nome),
                # [0.16.0 / B.2] valore iniziale (default 0) + span della frase 'parte da'.
                "initial": val if isinstance(val, int) else 0,
                "initialSpan": (init_cont.get(nome) or (None, None))[1],
            })
            continue
        iniziale = mondo.variabili.get(nome)
        iniziale = iniziale if isinstance(iniziale, str) and iniziale else None
        cval, cspan = commenti.get(nome, (None, None))
        valori = set(cval or [])
        if iniziale:
            valori.add(iniziale)
        states.append({
            "name": nome,
            "initial": iniziale,
            "initialSpan": (init_stato.get(nome) or (None, None))[1],
            "declSpan": decl_stato.get(nome),
            "values": sorted(valori),
            "valuesComment": ({"span": cspan, "values": cval} if cval is not None else None),
        })

    states.sort(key=lambda s: s["name"])
    counters.sort(key=lambda c: c["name"])
    return {"ok": True, "states": states, "counters": counters, "errors": []}


def analizza_parole(percorso_file, sorgente=None):
    """[Favella Studio 1.0 / motore 1.4] Modello editabile delle PAROLE e dei COMANDI
    del giocatore, con lo span sorgente di ogni frase. Ritorna:
      {ok,
       mode 'entrambi'|'testo'|'pulsanti', modeSpan|None,
       verbs[{word, noObject, span}],            # '"lancia" è un comando.'
       synonyms[{word, target, voluto, span}],   # '"ghermisci" è come prendi (voluto).'
       errors[]}
    Difensiva: su errore ritorna ok=False, non solleva."""
    diag = analizza_file_strutturato(percorso_file, sorgente=sorgente)
    if not diag.get("ok"):
        return {"ok": False, "mode": "entrambi", "modeSpan": None, "verbs": [],
                "synonyms": [], "errors": diag.get("errors", [])}
    try:
        if sorgente is not None:
            testo, mappa_righe, _err = _espandi_inclusioni_seedable(percorso_file, sorgente)
        else:
            testo, mappa_righe, _err = espandi_inclusioni(percorso_file)
        simboli = costruisci_symbol_table(testo)
        _cp, nomi_dir, _de = valida_direzioni_dichiarate(simboli.coppie_direzioni, simboli)
        parser = costruisci_parser(simboli.tutti, simboli.variabili, nomi_dir,
                                   propagate_positions=True,
                                   verbi_multi=simboli.verbi_multi)
        tree = parser.parse(testo)
    except Exception:
        return {"ok": False, "mode": "entrambi", "modeSpan": None, "verbs": [],
                "synonyms": [], "errors": diag.get("errors", [])}

    def _riga_orig(linea_espansa):
        if (mappa_righe and isinstance(linea_espansa, int)
                and 1 <= linea_espansa <= len(mappa_righe)):
            return mappa_righe[linea_espansa - 1]
        return percorso_file, linea_espansa

    def _span(line_exp, end_exp=None):
        if line_exp is None:
            return None
        f_o, r_o = _riga_orig(line_exp)
        _f2, r_end = _riga_orig(end_exp) if end_exp is not None else (f_o, r_o)
        return {"file": f_o, "line": r_o, "endLine": r_end}

    def _tutti_i_dati(nodo):
        dati = [nodo.data]
        for figlio in nodo.children:
            if isinstance(figlio, Tree):
                dati.extend(_tutti_i_dati(figlio))
        return dati

    mode, mode_span = "entrambi", None
    verbs, synonyms = [], []
    for nodo in tree.children:
        if not isinstance(nodo, Tree):
            continue
        meta = getattr(nodo, "meta", None)
        line = getattr(meta, "line", None) if meta else None
        end = getattr(meta, "end_line", line) if meta else None
        span = _span(line, end)
        dati = _tutti_i_dati(nodo)
        tok = _tokens_per_tipo(nodo)
        if nodo.data in ("verbo_con_oggetto", "verbo_senza_oggetto"):
            quotati = tok.get("TESTO_QUOTATO", [])
            if quotati:
                verbs.append({"word": _spoglia_quotato(str(quotati[0])),
                              "noObject": nodo.data == "verbo_senza_oggetto", "span": span})
        elif nodo.data == "def_sinonimo":
            quotati = tok.get("TESTO_QUOTATO", [])
            verbo = tok.get("VERBO", [])
            if quotati:
                if len(quotati) > 1:
                    target = _spoglia_quotato(str(quotati[1]))
                elif verbo:
                    target = str(verbo[0])
                else:
                    continue
                synonyms.append({"word": _spoglia_quotato(str(quotati[0])), "target": target,
                                 "voluto": "voluto" in dati, "span": span})
        elif nodo.data == "def_comandi":
            if "modo_pulsanti" in dati:
                mode = "pulsanti"
            elif "modo_entrambi" in dati:
                mode = "entrambi"
            else:
                mode = "testo"
            mode_span = span
    return {"ok": True, "mode": mode, "modeSpan": mode_span, "verbs": verbs,
            "synonyms": synonyms, "errors": []}


def analizza_dialoghi(percorso_file, sorgente=None):
    """[Favella Studio / Fase 6b] Modello editabile di NPC e DIALOGHI con lo span
    sorgente di ogni frase, per l'editor visuale dei dialoghi (round-trip
    testo↔visuale). Ritorna:
      {ok,
       npcs[{id, name, startNode|None, defSpan|None, startSpan|None}],
       nodes[{label, speaker{id,name}|None, line, lineSpan|None,
              options[{text, span|None, condition|None, outcome:'conduce'|'chiude',
                        dest|None(etichetta nodo), consequences[]}]}],
       menu{npcs[{id,name}], nodeLabels[], objects, rooms, directions, states,
            counters, stateValues},
       errors[]}
    condizione/conseguenze usano la shape JSON di analizza_regole
    (_cond_to_json/_conseq_to_json). Difensiva: su errore ritorna ok=False."""
    diag = analizza_file_strutturato(percorso_file, sorgente=sorgente)
    vuoto_menu = {"npcs": [], "nodeLabels": [], "objects": [], "rooms": [],
                  "directions": [], "states": [], "counters": [], "stateValues": {}}
    if not diag.get("ok"):
        return {"ok": False, "npcs": [], "nodes": [], "menu": vuoto_menu,
                "errors": diag.get("errors", [])}
    mondo = compila_mondo(percorso_file, sorgente)
    if mondo is None:
        return {"ok": False, "npcs": [], "nodes": [], "menu": vuoto_menu,
                "errors": diag.get("errors", [])}

    # Span: secondo parse posizionato (come analizza_regole/analizza_variabili).
    try:
        if sorgente is not None:
            testo, mappa_righe, _err = _espandi_inclusioni_seedable(percorso_file, sorgente)
        else:
            testo, mappa_righe, _err = espandi_inclusioni(percorso_file)
        simboli = costruisci_symbol_table(testo)
        _cp, nomi_dir, _de = valida_direzioni_dichiarate(simboli.coppie_direzioni, simboli)
        parser = costruisci_parser(simboli.tutti, simboli.variabili, nomi_dir,
                                   propagate_positions=True,
                                   verbi_multi=simboli.verbi_multi)
        tree = parser.parse(testo)
    except Exception:
        tree, mappa_righe, testo = None, [], ""

    def _riga_orig(linea_espansa):
        if (mappa_righe and isinstance(linea_espansa, int)
                and 1 <= linea_espansa <= len(mappa_righe)):
            return mappa_righe[linea_espansa - 1]
        return percorso_file, linea_espansa

    def _span(line_exp, end_exp=None):
        if line_exp is None:
            return None
        f_o, r_o = _riga_orig(line_exp)
        _f2, r_end = _riga_orig(end_exp) if end_exp is not None else (f_o, r_o)
        return {"file": f_o, "line": r_o, "endLine": r_end}

    # Indicizza le frasi di dialogo con il loro span e i token utili al match.
    def_npc, start_npc = {}, {}      # npc_id -> span
    node_speaker = {}                # etichetta nodo -> npc_id (chi vi parla)
    frasi_battuta = []               # {span, etichetta, battuta}
    frasi_opzione = []               # {span, etichetta, testo}
    if tree is not None:
        for nodo in tree.children:
            if not isinstance(nodo, Tree):
                continue
            meta = getattr(nodo, "meta", None)
            line = getattr(meta, "line", None) if meta else None
            end = getattr(meta, "end_line", line) if meta else None
            span = _span(line, end)
            tok = _tokens_per_tipo(nodo)
            ent = tok.get("ENTITA", [])
            quotati = tok.get("TESTO_QUOTATO", [])
            if nodo.data == "def_personaggio" and ent:
                def_npc[normalizza_nome(str(ent[0]))] = span
            elif nodo.data == "def_dialogo_inizio" and ent:
                start_npc[normalizza_nome(str(ent[0]))] = span
            elif nodo.data == "def_battuta" and ent and len(quotati) >= 2:
                etich = _spoglia_quotato(str(quotati[0]))
                battuta = _spoglia_quotato(str(quotati[1]))
                node_speaker[etich] = normalizza_nome(str(ent[0]))
                frasi_battuta.append({"span": span, "etichetta": etich, "battuta": battuta})
            elif nodo.data == "def_opzione" and len(quotati) >= 2:
                etich = _spoglia_quotato(str(quotati[0]))
                testo_opz = _spoglia_quotato(str(quotati[1]))
                frasi_opzione.append({"span": span, "etichetta": etich, "testo": testo_opz})

    def _span_battuta(etichetta, battuta, usate):
        for i, f in enumerate(frasi_battuta):
            if i in usate:
                continue
            if f["etichetta"] == etichetta and f["battuta"] == battuta:
                usate.add(i)
                return f["span"]
        return None

    def _span_opzione(etichetta, testo_opz, usate):
        for i, f in enumerate(frasi_opzione):
            if i in usate:
                continue
            if f["etichetta"] == etichetta and f["testo"] == testo_opz:
                usate.add(i)
                return f["span"]
        return None

    # NPC compilati → JSON.
    npcs = []
    for oid, o in mondo.oggetti.items():
        if not getattr(o, "is_personaggio", False):
            continue
        npcs.append({
            "id": oid,
            "name": o.nome_visualizzato,
            "startNode": getattr(o, "dialogo_iniziale", None),
            "defSpan": def_npc.get(oid),
            "startSpan": start_npc.get(oid),
        })

    # NODI di dialogo compilati → JSON (struttura autorevole dal mondo).
    nodes = []
    usate_b, usate_o = set(), set()
    for etichetta, nodo in mondo.dialogo_nodi.items():
        options = []
        for opz in nodo.opzioni:
            options.append({
                "text": opz.testo,
                "span": _span_opzione(etichetta, opz.testo, usate_o),
                "condition": _cond_to_json(getattr(opz, "condizione", None), mondo),
                "outcome": "chiude" if opz.chiude else "conduce",
                "dest": opz.destinazione,
                "consequences": [_conseq_to_json(c, mondo)
                                 for c in getattr(opz, "conseguenze", [])],
            })
        sp_id = node_speaker.get(etichetta)
        nodes.append({
            "label": etichetta,
            "speaker": ({"id": sp_id, "name": _nome_entita(mondo, sp_id)}
                        if sp_id else None),
            "line": nodo.battuta,
            "lineSpan": _span_battuta(etichetta, nodo.battuta, usate_b),
            "options": options,
        })

    # Menu per i costruttori (6b.2+): NPC, etichette nodi, entità, stanze, direzioni,
    # stati e contatori (per condizioni/conseguenze delle opzioni).
    states, counters = [], []
    for nome in mondo.variabili:
        (counters if _kind_variabile(mondo, nome) == "contatore" else states).append(nome)

    valori_acc = {}
    for nome in states:
        iniziale = mondo.variabili.get(nome)
        if isinstance(iniziale, str) and iniziale:
            valori_acc.setdefault(nome, set()).add(iniziale)
    for nd in nodes:
        for opz in nd["options"]:
            _raccogli_valori_cond(opz.get("condition"), valori_acc)
            _raccogli_valori_conseq(opz.get("consequences"), valori_acc)
    set_states = set(states)
    for nome_grezzo, valori_c, _linea in _valori_commento(testo if tree is not None else ""):
        nid = normalizza_nome(nome_grezzo)
        if nid in set_states:
            valori_acc.setdefault(nid, set()).update(valori_c)
    state_values = {nome: sorted(valori_acc.get(nome, set())) for nome in states}

    menu = {
        "npcs": [{"id": n["id"], "name": n["name"]} for n in npcs],
        "nodeLabels": [nd["label"] for nd in nodes],
        "objects": [{"id": oid, "name": o.nome_visualizzato,
                     "kind": ("personaggio" if getattr(o, "is_personaggio", False)
                              else "contenitore" if getattr(o, "is_contenitore", False)
                              else "supporto" if getattr(o, "is_supporto", False)
                              else "oggetto")}
                    for oid, o in mondo.oggetti.items()],
        "rooms": [{"id": rid, "name": st.nome_visualizzato} for rid, st in mondo.stanze.items()],
        "directions": sorted(set(getattr(mondo, "direzioni", {}).values())),
        "states": sorted(states),
        "counters": sorted(counters),
        "stateValues": state_values,
    }

    return {"ok": True, "npcs": npcs, "nodes": nodes, "menu": menu, "errors": []}


# ==============================================================================
# AUTOFORMAT / RIORDINO CANONICO (Favella Studio — blocco C)
# ------------------------------------------------------------------------------
# riordina_sorgente riorganizza le frasi del file in un ordine canonico leggibile
# (impostazioni → stanze → oggetti → stati → regole/eventi/demoni → dialoghi),
# RAGGRUPPANDO le frasi di ogni entità. NON rigenera nulla: sposta blocchi di TESTO
# VERBATIM (commenti adiacenti inclusi), così niente — regole, dialoghi, prosa — va
# perso. riordina_sorgente lavora su file SINGOLI (senza Includi): l'ordine d'un file
# con riferimenti a entità di altri file non è parsabile in isolamento. Per le storie
# a più file c'è riordina_storia (Studio 1.1), più sotto: parsa la storia intera e
# riordina ogni file nel suo file. ADDITIVA: motore intatto.
# ==============================================================================

_RE_HA_INCLUDI = re.compile(r"(?im)^\s*Includi\s")


def _autoformat_classifica(data, tok, mondo):
    """(categoria, gruppo, ordine-interno) di una frase top-level. La categoria
    dà l'ordine macro; il gruppo raccoglie le frasi della stessa entità; l'ordine
    interno mette la definizione prima dei dettagli."""
    ents = tok.get("ENTITA", [])
    eid = normalizza_nome(str(ents[0])) if ents else None
    vs = tok.get("VARIABILE", [])
    vid = normalizza_nome(str(vs[0])) if vs else None
    # 0 — impostazioni globali ([1.3.0] prima di tutto la presentazione)
    if data in ("def_titolo", "def_autore", "def_prologo"):
        return (0, "", -2)
    if data in ("def_messaggio", "def_uscite_anonime", "def_comandi"):
        return (0, "", -1)
    if data == "def_direzioni":
        return (0, "", 0)
    if data == "def_opposti":
        return (0, "", 1)
    if data == "def_giocatore":
        return (0, "", 2)
    if data == "def_giocatore_capacita":
        return (0, "", 3)
    if data == "def_verbo":
        return (0, "", 4)
    # 1 — stanze (raggruppate per stanza)
    if data == "def_stanza":
        return (1, "r:" + (eid or ""), 0)
    if data == "def_connessione":
        return (1, "r:" + (eid or ""), 2)
    # 2 — oggetti (raggruppati per oggetto)
    if data in ("def_oggetto", "def_contenitore", "def_supporto", "def_personaggio"):
        return (2, "o:" + (eid or ""), 0)
    if data in ("def_posizione", "def_posto"):
        return (2, "o:" + (eid or ""), 2)
    if data == "def_proprieta":
        return (2, "o:" + (eid or ""), 3)
    if data == "def_capacita_oggetto":
        return (2, "o:" + (eid or ""), 4)
    if data == "def_alias":
        return (2, "o:" + (eid or ""), 5)
    # descrizione: appartiene alla stanza o all'oggetto omonimo
    if data == "def_descrizione":
        if eid and eid in mondo.stanze:
            return (1, "r:" + eid, 1)
        return (2, "o:" + (eid or ""), 1)
    # 3 — stati e contatori (raggruppati per variabile)
    if data in ("def_stato", "def_contatore"):
        return (3, "v:" + (vid or ""), 0)
    if data in ("def_stato_valore", "def_contatore_iniziale"):
        return (3, "v:" + (vid or ""), 1)
    # 4 — logica
    if data == "def_regola":
        return (4, "", 0)
    if data in ("evento_al", "evento_ogni"):
        return (4, "", 1)
    if data in ("demone_ogni", "demone_quando", "demone_dopo"):
        return (4, "", 2)
    if data == "def_argomento":
        return (5, "", 1)
    if data in ("def_png_ha", "def_di_scena", "def_anche_in"):
        return (2, "o:" + (eid or ""), 6)
    # 5 — dialoghi
    if data in ("def_dialogo_inizio", "def_battuta", "def_opzione"):
        return (5, "", 0)
    return (8, "", 0)  # sconosciuto → verso il fondo, mai perso


# Una direttiva d'inclusione occupa un'intera riga ('Includi "x.fav".' o
# 'Includi la libreria "verbi".'): il preprocessore la toglie prima del parser,
# quindi qui la si riconosce dal testo. Nel riordino resta in cima, nell'ordine in
# cui l'autore l'ha scritta (l'ordine degli Includi decide anche da dove parte il
# gioco, se la partenza non è dichiarata).
_RE_RIGA_INCLUDI = re.compile(r'^\s*Includi\s+(?:la\s+libreria\s+)?"(?:\\.|[^"\\])*"\s*\.\s*$',
                              re.IGNORECASE)


def _riordina_righe(righe, frasi):
    """Cuore del riordino: dalle righe di UN file e dalle sue frasi classificate
    ({start, end, cls}, righe 1-based) rimonta il testo in ordine canonico. Sposta
    blocchi VERBATIM (la frase con i commenti che la precedono): non rigenera nulla."""
    frasi = sorted(frasi, key=lambda f: f["start"])

    # I gruppi (entità) si ordinano per PRIMA apparizione, non alfabeticamente.
    group_order = {}
    for f in frasi:
        grp = f["cls"][1]
        if grp and grp not in group_order:
            group_order[grp] = len(group_order)

    n = len(righe)
    by_start = {f["start"]: i for i, f in enumerate(frasi)}

    def _trim(blocco):
        b = blocco[:]
        while b and b[0].strip() == "":
            b.pop(0)
        while b and b[-1].strip() == "":
            b.pop()
        return b

    # Costruisce i BLOCCHI: ogni frase con i commenti/righe adiacenti che la
    # precedono (le righe non-frase si attaccano alla frase seguente).
    blocchi = []
    pending = []
    i = 1
    while i <= n:
        if i in by_start:
            f = frasi[by_start[i]]
            lead = _trim(pending)
            body = righe[f["start"] - 1:f["end"]]
            cat, grp, wi = f["cls"]
            go = group_order.get(grp, -1) if grp else -1
            blocchi.append({"text": lead + body,
                            "key": (cat, go, wi, by_start[i])})
            pending = []
            i = f["end"] + 1
        elif _RE_RIGA_INCLUDI.match(righe[i - 1]):
            # [Studio 1.1] Una direttiva d'inclusione: sta in cima a tutto.
            lead = _trim(pending)
            blocchi.append({"text": lead + [righe[i - 1]],
                            "key": (-1, -1, 0, i)})
            pending = []
            i += 1
        else:
            pending.append(righe[i - 1])
            i += 1
    coda = _trim(pending)
    if coda:
        blocchi.append({"text": coda, "key": (9, 9, 9, 10 ** 9)})

    blocchi.sort(key=lambda b: b["key"])  # stabile, chiave totale

    # Riassembla: una riga vuota fra entità/categorie diverse, frasi tight dentro.
    out = []
    prev_sig = None
    for b in blocchi:
        sig = (b["key"][0], b["key"][1])
        if out and sig != prev_sig:
            out.append("")
        out.extend(b["text"])
        prev_sig = sig
    testo = "\n".join(out)
    if not testo.endswith("\n"):
        testo += "\n"
    return testo


def riordina_sorgente(percorso_file, sorgente=None):
    """[Autoformat] Riordino canonico del file. Ritorna {ok, text} o
    {ok:False, reason}. Idempotente, byte-safe (sposta testo verbatim)."""
    if sorgente is None:
        try:
            with open(percorso_file, encoding="utf-8") as f:
                sorgente = f.read()
        except OSError as e:
            return {"ok": False, "reason": f"Impossibile leggere il file: {e}"}
    if _RE_HA_INCLUDI.search(sorgente):
        return {"ok": False,
                "reason": "Il riordino è disponibile solo per file singoli (senza «Includi»)."}
    diag = analizza_file_strutturato(percorso_file, sorgente=sorgente)
    if not diag.get("ok"):
        return {"ok": False, "reason": "Correggi gli errori del file prima di riordinare."}
    mondo = compila_mondo(percorso_file, sorgente)
    if mondo is None:
        return {"ok": False, "reason": "Il file non compila."}
    try:
        simboli = costruisci_symbol_table(sorgente)
        _cp, nomi_dir, _de = valida_direzioni_dichiarate(simboli.coppie_direzioni, simboli)
        parser = costruisci_parser(simboli.tutti, simboli.variabili, nomi_dir,
                                   propagate_positions=True, verbi_multi=simboli.verbi_multi)
        tree = parser.parse(sorgente)
    except Exception as e:  # pragma: no cover - difensivo
        return {"ok": False, "reason": f"Riordino non riuscito: {e}"}

    # Frasi top-level ordinate per riga, con la chiave di ordinamento.
    frasi = []
    for nodo in tree.children:
        if not isinstance(nodo, Tree):
            continue
        meta = getattr(nodo, "meta", None)
        line = getattr(meta, "line", None) if meta else None
        if line is None:
            continue
        end = getattr(meta, "end_line", line) if meta else line
        frasi.append({"start": int(line), "end": int(end or line),
                      "cls": _autoformat_classifica(nodo.data, _tokens_per_tipo(nodo), mondo)})
    if not frasi:
        return {"ok": True, "text": sorgente}
    return {"ok": True, "text": _riordina_righe(sorgente.split("\n"), frasi)}



# ==============================================================================
# SERIALIZZATORE CANONICO PER-FRASE (Favella Studio — Fase 6a, scrittura)
# ------------------------------------------------------------------------------
# serializza_frase è la metà in SCRITTURA del round-trip: data una specifica
# strutturata (op + campi) restituisce LA frase .fav canonica. L'IDE la compone
# dalle modifiche delle form e la inserisce/sostituisce nel buffer usando lo span
# di analizza_outline (editing chirurgico per-frase). I nomi sono passati come
# nome_visualizzato (con articolo), così le frasi rispecchiano lo stile d'autore
# (es. «L'ingresso collega nord a il salotto.»). Fonte di verità unica delle forme
# canoniche, in Python. ADDITIVA: non tocca motore/test.
# ==============================================================================

def _articolo_in_minuscolo(nome: str) -> str:
    """Un nome con l'articolo maiuscolo («La cucina») scritto a metà frase: «la cucina».
    Se il nome non comincia con un articolo (un nome proprio) resta com'è."""
    art, _nucleo = _scomponi_articolo(nome)
    if art and nome[:1].isupper():
        return nome[:1].lower() + nome[1:]
    return nome


def _quota(testo: str) -> str:
    """Avvolge il testo tra virgolette doppie con escape canonico (\\\" e \\\\)."""
    interno = (testo or "").replace("\\", "\\\\").replace('"', '\\"')
    # [1.3.0 / M-6] A capo e parentesi quadre letterali tornano escape.
    interno = (interno.replace("\n", "\\n").replace(QUADRA_APERTA, "\\[")
               .replace(QUADRA_CHIUSA, "\\]"))
    return f'"{interno}"'


# Articolo iniziale del nome -> preposizione 'di' articolata + se è attaccata
# (apostrofo) al nucleo. Gli indeterminativi sono mappati alla forma determinativa
# corrispondente (una->della, un'->dell', uno->dello, un->del best-effort).
_PREP_DI = {
    "l'": ("dell'", True), "un'": ("dell'", True),
    "il": ("del", False), "lo": ("dello", False), "uno": ("dello", False),
    "la": ("della", False), "una": ("della", False),
    "le": ("delle", False), "i": ("dei", False), "gli": ("degli", False),
    "un": ("del", False),
}


def _frase_descrizione(nome_visualizzato: str, testo: str) -> str:
    """«La descrizione <di articolata><nome> è "<testo>".» con la preposizione
    concordata sull'articolo del nome (dell'ingresso, della cucina, del salotto).
    Se l'articolo è ignoto ripiega su «di <nome completo>» (sempre parsabile)."""
    art, nucleo = _scomponi_articolo(nome_visualizzato)
    info = _PREP_DI.get(art) if art else None
    if info and nucleo:
        prep, attaccata = info
        testa = f"{prep}{nucleo}" if attaccata else f"{prep} {nucleo}"
    else:
        testa = f"di {nome_visualizzato}"
    return f"La descrizione {testa} è {_quota(testo)}."


def _frase_dialogo_inizio(nome_visualizzato: str, etichetta: str) -> str:
    """[Fase 6b] «Il dialogo <di articolata><npc> comincia con "<etichetta>".» con
    la preposizione concordata sull'articolo dell'NPC (del mercante, dell'anziano).
    Stesso schema di _frase_descrizione; ripiego su «di <nome>» se l'articolo è ignoto."""
    art, nucleo = _scomponi_articolo(nome_visualizzato)
    info = _PREP_DI.get(art) if art else None
    if info and nucleo:
        prep, attaccata = info
        testa = f"{prep}{nucleo}" if attaccata else f"{prep} {nucleo}"
    else:
        testa = f"di {nome_visualizzato}"
    return f"Il dialogo {testa} comincia con {_quota(etichetta)}."


def _serializza_opzione(spec) -> str:
    """[Fase 6b] Opzione di dialogo JSON → «Al nodo "N" l'opzione "T" [se COND]
    (conduce al nodo "D" | chiude il dialogo) [e adesso …].». L'ordine dei
    costituenti rispetta la grammatica def_opzione (testo · se-cond · esito · e adesso)."""
    parti = [f"Al nodo {_quota(spec['node'])} l'opzione {_quota(spec['text'])}"]
    cond = spec.get("condition")
    if cond:
        parti.append(" se " + _serializza_condizione(cond))
    if spec.get("outcome") == "chiude":
        parti.append(" chiude il dialogo")
    else:
        dest = spec.get("dest")
        if not dest:
            raise ValueError("L'opzione che «conduce» richiede un nodo di destinazione.")
        parti.append(f" conduce al nodo {_quota(dest)}")
    for c in spec.get("consequences", []):
        parti.append(" e adesso " + _serializza_conseguenza(c))
    parti.append(".")
    return "".join(parti)


def _frase_posizione(nome: str, prep: str, luogo: str) -> str:
    """«<nome> è <prep> <luogo>.» evitando il doppio articolo: le preposizioni
    articolate (nel/nella/sul/…, e le apostrofate nell'/sull') ASSORBONO già
    l'articolo, quindi dal nome del luogo lo si toglie (sul «il tavolo» → «sul
    tavolo»; nell' «l'ingresso» → «nell'ingresso»). Le preposizioni nude (in/su/a)
    conservano l'articolo del luogo, con uno spazio."""
    p = (prep or "").strip()
    if p.lower() == "su":  # «su» nudo non è una preposizione di luogo valida: «sul»
        p = "sul"
    nuda = p.lower() in ("in", "su", "a", "con", "per", "tra", "fra", "di", "da")
    if not nuda:
        _art, nucleo = _scomponi_articolo(luogo)
        luogo = nucleo or luogo
    sep = "" if p.endswith("'") else " "
    return f"{nome} è {p}{sep}{luogo}."


_DEF_KIND_TESTO = {
    "oggetto": "una cosa", "contenitore": "un contenitore",
    "supporto": "un supporto", "personaggio": "un personaggio",
}


def _serializza_operando(v):
    """[v1.0.0 / Tema 1] Quantità di un contatore (JSON) → testo .fav. Un numero è
    un letterale; le forme dinamiche rispecchiano la grammatica operando:
    {kind:'var'} → '[contatore]' (valore corrente), {kind:'rand'} → 'un numero fra
    A e B' (estrazione). NB: nei CONFRONTI di condizione (operando_confronto) la
    forma 'rand' non è ammessa dalla grammatica → l'editor non la offre lì."""
    if isinstance(v, dict):
        if v.get("kind") == "var":
            return f"[{v['name']}]"
        if v.get("kind") == "rand":
            return f"un numero fra {v['min']} e {v['max']}"
        raise ValueError(f"Operando non serializzabile: {v!r}.")
    return str(v)


def _serializza_condizione(c):
    """[Fase 6c] Condizione JSON (ricorsiva) → testo .fav canonico. Vincoli della
    grammatica: NOT solo su has/prop/var/varEq (infisso «non»); contatori/gruppi non
    negabili; AND='e', OR='oppure'; i gruppi composti dentro un altro composto
    vanno fra parentesi. Solleva ValueError su forme non ammesse."""
    op = c["op"]
    if op == "has":
        return f"il giocatore ha {c['name']}"
    if op == "prop":
        return f"{c['name']} è {c['prop']}"
    if op == "var":
        return f"{c['name']} è {c['value']}"
    if op == "varEq":
        # [0.34.0 / Tema 3] Confronto stato↔stato: 'X è come Y' (Y è un altro stato).
        return f"{c['name']} è come {c['other']}"
    if op == "playerIn":
        # [0.18.0 / B1] 'il giocatore è in [stanza]' (prep nuda + nucleo).
        return f"il giocatore è in {_nucleo_nome(c['name'])}"
    if op == "chance":
        # [v1.0.0 / Tema 2c] Probabilità: 'càpita (N su M)'.
        return f"càpita ({c['num']} su {c['den']})"
    if op == "objIn":
        # [1.3.0 / G-6] 'X è in <luogo>' / 'X è qui'.
        return f"{c['name']} è {_luogo_di_condizione(c)}"
    if op == "npcHas":
        # [1.3.0 / M-10] 'il personaggio ha X'.
        return f"{c['npcName']} ha {c['name']}"
    if op == "count":
        cmp, v = c["cmp"], _serializza_operando(c["value"])
        if cmp == "==":
            return f"{c['name']} è {v}"
        if cmp == "!=":  # [0.18.0 / B5] ≠
            return f"{c['name']} non è {v}"
        if cmp == ">=":
            return f"{c['name']} è almeno {v}"
        if cmp == ">":
            return f"{c['name']} è più di {v}"
        if cmp == "<":
            return f"{c['name']} è meno di {v}"
        if cmp == "<=":  # [0.18.0 / B4] ≤
            return f"{c['name']} è al massimo {v}"
        raise ValueError(f"Confronto contatore sconosciuto: {cmp!r}.")
    if op == "not":
        t = c["term"]
        if t["op"] == "has":
            return f"il giocatore non ha {t['name']}"
        if t["op"] == "prop":
            return f"{t['name']} non è {t['prop']}"
        if t["op"] == "var":
            return f"{t['name']} non è {t['value']}"
        if t["op"] == "varEq":
            # [0.34.0 / Tema 3] Negazione del confronto stato↔stato.
            return f"{t['name']} non è come {t['other']}"
        if t["op"] == "playerIn":
            return f"il giocatore non è in {_nucleo_nome(t['name'])}"
        if t["op"] == "objIn":
            return f"{t['name']} non è {_luogo_di_condizione(t)}"
        if t["op"] == "npcHas":
            return f"{t['npcName']} non ha {t['name']}"
        raise ValueError("La negazione è ammessa solo su possesso, proprietà, stato o posizione.")
    if op in ("and", "or"):
        sep = " e " if op == "and" else " oppure "
        def _grp(x):
            s = _serializza_condizione(x)
            return f"({s})" if x["op"] in ("and", "or") else s
        return sep.join(_grp(t) for t in c["terms"])
    raise ValueError(f"Condizione non serializzabile: {op!r}.")


def _luogo_di_condizione(c) -> str:
    """[1.3.0 / G-6] 'qui', 'in inventario', 'nel nulla' o 'in <nucleo>'."""
    luogo = c.get("place")
    if luogo == "qui":
        return "qui"
    if luogo == "inventario":
        return "in inventario"
    if luogo == "nulla":
        return "nel nulla"
    return f"in {_nucleo_nome(c.get('placeName') or luogo)}"


def _serializza_conseguenza(c):
    """[Fase 6c] Conseguenza JSON → testo .fav canonico. 'move' (spostamento) è
    rimandato a 6c.3 (preposizione concordata): per ora solleva ValueError."""
    op = c["op"]
    if op == "prop":
        return f"{c['name']} è {c['prop']}"
    if op == "var":
        return f"{c['name']} è {c['value']}"
    if op == "varCopy":
        # [0.34.0 / Tema 3] Copia stato↔stato: 'X diventa Y' (Y è un altro stato).
        return f"{c['name']} diventa {c['from']}"
    if op == "pick":
        # [0.32.0 / Tema 2b] Estrazione: 'X diventa uno fra a, b, c'.
        valori = [v for v in c.get("values", []) if str(v).strip()]
        if not valori:
            raise ValueError("«diventa uno fra …» richiede almeno un valore.")
        return f"{c['name']} diventa uno fra {', '.join(valori)}"
    if op == "dark":
        # [0.33.0 / Tema 4a] Buio commutabile: '<stanza> diventa buia/illuminata'.
        # 'name' è il nome con articolo (ENTITA) → 'la radura diventa buia'.
        return f"{c['name']} diventa {'buia' if c.get('dark') else 'illuminata'}"
    if op == "movePNG":
        # [0.25.0 / A5] Movimento di un personaggio. Adiacente → 'X cambia stanza';
        # deterministico → 'X va <prep> <stanza>' (prep articolata anti-doppio-articolo
        # come _frase_posizione; le stanze usano la prep nuda 'in' + nucleo).
        nome = c["name"]
        if c.get("adjacent"):
            return f"{nome} cambia stanza"
        prep = c.get("prep")
        place = c.get("place")
        if prep is None or place is None:
            _art, nucleo = _scomponi_articolo(c.get("destName") or c.get("dest") or "")
            prep, place = "in", (nucleo or (c.get("dest") or ""))
        if not place:
            raise ValueError("Movimento PNG senza destinazione (stanza).")
        nuda = prep.strip().lower() in ("in", "su", "a", "con", "per", "tra", "fra", "di", "da")
        if not nuda:
            _art, nucleo = _scomponi_articolo(place)
            place = nucleo or place
        sep = "" if prep.endswith("'") else " "
        return f"{nome} va {prep}{sep}{place}"
    if op == "count":
        mode, v = c["mode"], c.get("value", 1)
        if mode == "diventa":
            return f"{c['name']} diventa {_serializza_operando(v)}"
        base = "aumenta" if mode == "aumenta" else "diminuisci"
        # Ometti 'di 1' (default); ogni operando dinamico è esplicito.
        return f"{base} {c['name']}" + ("" if v == 1 else f" di {_serializza_operando(v)}")
    if op == "unprop":
        # [1.3.0 / M-2] 'X non è più P'.
        return f"{c['name']} non è più {c['prop']}"
    if op == "link":
        # [1.3.0 / M-8] 'X collega D a Y'.
        return f"{c['name']} collega {c['direction']} a {c['destName']}"
    if op == "unlink":
        return f"{c['name']} non collega più {c['direction']}"
    if op == "give":
        # [1.3.0 / M-10] 'il personaggio ha X'.
        return f"{c['npcName']} ha {c['name']}"
    if op == "playerIn" or op == "teleport":
        # [0.18.0 / B2] Teletrasporto del giocatore: 'il giocatore è in [stanza]'.
        return f"il giocatore è in {_nucleo_nome(c['name'])}"
    if op == "end":
        esiti = {"vinci": "vinci", "perdi": "perdi", "termina": "termina"}
        if c["outcome"] not in esiti:
            raise ValueError(f"Esito di fine partita sconosciuto: {c['outcome']!r}.")
        # [0.18.0 / B3] Testo d'esito opzionale: 'vinci "..."'.
        msg = c.get("message")
        if msg:
            return f"{esiti[c['outcome']]} {_quota(msg)}"
        return esiti[c["outcome"]]
    if op == "move":
        # [Fase 6c.3] Spostamento: «<oggetto> è <prep_luogo> <dest>» (stessa forma
        # di una posizione, senza il punto: lo aggiunge _serializza_regola/_evento).
        # La UI calcola già la preposizione concordata e la passa in prep/place
        # (come per l'op 'position'): inventario→«in inventario», nulla→«nel nulla»,
        # stanza→«in <nucleo>», contenitore/supporto→«nella/sul <nucleo>».
        nome = c["name"]
        prep = c.get("prep")
        place = c.get("place")
        if prep is not None and place is not None:
            frase = _frase_posizione(nome, prep, place)
            return frase[:-1] if frase.endswith(".") else frase
        # Ripiego (spec senza prep/place, es. round-trip da lettura): deduco dal
        # dest grezzo. Stanza/contenitore/supporto → prep nuda «in» + nucleo (sempre
        # parsabile come ENTITA, anche se perde lo stile articolato).
        dest = (c.get("dest") or "").strip()
        if dest == "inventario":
            return f"{nome} è in inventario"
        if dest == "nulla":
            return f"{nome} è nel nulla"
        if not dest:
            raise ValueError("Spostamento senza destinazione.")
        _art, nucleo = _scomponi_articolo(c.get("destName") or dest)
        return f"{nome} è in {nucleo or dest}"
    raise ValueError(f"Conseguenza non serializzabile: {op!r}.")


def _serializza_regola(spec):
    """[Fase 6c] Regola JSON → «Invece di VERBO [bersaglio] [se COND]: dire "…"
    [e adesso …].»."""
    verbo = str(spec["verb"]).strip()
    fase = {"prima": "Prima", "dopo": "Dopo"}.get(spec.get("phase"), "Invece")   # [1.3.0 / M-9]
    parti = [f"{fase} di {verbo}"]
    target = spec.get("target")
    if target:
        parti.append(" " + str(target["name"]))
        if target.get("prep") and target.get("secondaryName"):
            parti.append(f" {target['prep']} {target['secondaryName']}")
    cond = spec.get("condition")
    if cond:
        parti.append(" se " + _serializza_condizione(cond))
    parti.append(f": dire {_quota(spec.get('response', ''))}")
    for c in spec.get("consequences", []):
        parti.append(" e adesso " + _serializza_conseguenza(c))
    altrimenti = spec.get("otherwise")   # [1.3.0 / M-9]
    if altrimenti:
        parti.append(f" altrimenti dire {_quota(altrimenti.get('response', ''))}")
        for c in altrimenti.get("consequences", []):
            parti.append(" e adesso " + _serializza_conseguenza(c))
    parti.append(".")
    return "".join(parti)


def _serializza_evento(spec):
    """[Fase 6c] Evento JSON → «Al turno N: dire "…" […].» / «Ogni N turni: …»."""
    mode = spec["mode"]
    n = int(spec["n"])
    testa = f"Al turno {n}" if mode == "al" else f"Ogni {n} turni"
    parti = [f"{testa}: dire {_quota(spec.get('response', ''))}"]
    for c in spec.get("consequences", []):
        parti.append(" e adesso " + _serializza_conseguenza(c))
    parti.append(".")
    return "".join(parti)


def _serializza_demone(spec):
    """[Livello 8] Demone JSON → «Ogni turno se [cond]: dire "…" […].» (a livello)
    oppure «Quando [cond] diventa vera: dire "…" […].» (fronte di salita). La
    condizione è obbligatoria (un demone sorveglia sempre una condizione)."""
    cond = spec.get("condition")
    if not cond:
        raise ValueError("Un demone richiede una condizione.")
    if spec["mode"] == "ogni":
        testa = "Ogni turno se " + _serializza_condizione(cond)
    elif spec["mode"] == "dopo":   # [1.3.0 / M-7]
        n = int(spec.get("n", 0))
        testa = f"{n} {'turno' if n == 1 else 'turni'} dopo che " + _serializza_condizione(cond)
    else:
        testa = "Quando " + _serializza_condizione(cond) + " diventa vera"
    parti = [f"{testa}: dire {_quota(spec.get('response', ''))}"]
    for c in spec.get("consequences", []):
        parti.append(" e adesso " + _serializza_conseguenza(c))
    parti.append(".")
    return "".join(parti)


def serializza_frase(spec):
    """[Favella Studio / Fase 6a] Genera la frase .fav canonica da una specifica
    strutturata. Ritorna {ok, text} oppure {ok:False, error}. Le op supportate:
      room_def    {name}
      object_def  {name, kind:oggetto|contenitore|supporto|personaggio}
      description {name, text}
      connection  {from, direction, to}
      position    {name, prep, place}
      property    {name, property}
      prendibile  {name}
      alias       {name, alias}
      start       {name}
      direction_decl {a, b}   →  'A e B sono direzioni opposte.'
      opposite_decl  {a, b}   →  'a e b sono opposte.' (coppia di proprietà)
      state_decl     {name}          →  'X è uno stato.'
      state_init     {name, value}   →  'X è valore.' (valore iniziale dello stato)
      counter_decl   {name}          →  'X è un contatore.'
      state_values_comment {name, values[]} → '# valori di X: a, b' (commento, ignorato dal motore)
      rule  {verb, target?, condition?, response, consequences[]} → 'Invece di …'
      event {mode:'al'|'ogni', n, response, consequences[]}        → 'Al turno N: …'
      verb_decl      {word, noObject?}       → '"w" è un comando [senza oggetto].'
      synonym        {word, target, voluto?} → '"w" è come t [(voluto)].'
      commands_mode  {mode:'testo'|'pulsanti'|'entrambi'} → 'I comandi si scrivono…'
      npc_decl       {name}                  → 'X è un personaggio.'
      dialogue_start {name, node}            → 'Il dialogo di X comincia con "n".'
      node_line      {speaker, node, line}   → 'X al nodo "n" dice "battuta".'
      dialogue_option {node, text, condition?, outcome:'conduce'|'chiude', dest?,
                       consequences[]}        → 'Al nodo "n" l'opzione "t" …'
    'name'/'from'/'to'/'place' sono nomi VISUALIZZATI (con articolo); condizione e
    conseguenze usano la shape JSON di analizza_regole."""
    try:
        op = (spec or {}).get("op")
        if op == "room_def":
            return {"ok": True, "text": f"{spec['name']} è una stanza."}
        if op == "verb_decl":
            parola = str(spec["word"]).strip()
            coda = " senza oggetto" if spec.get("noObject") else ""
            return {"ok": True, "text": f"{_quota(parola)} è un comando{coda}."}
        if op == "synonym":
            parola = str(spec["word"]).strip()
            bersaglio = str(spec["target"]).strip()
            if " " in bersaglio:
                bersaglio = _quota(bersaglio)   # un comando di più parole va fra virgolette
            voluto = " (voluto)" if spec.get("voluto") else ""
            return {"ok": True, "text": f"{_quota(parola)} è come {bersaglio}{voluto}."}
        if op == "commands_mode":
            frasi = {"testo": "I comandi si scrivono.",
                     "pulsanti": "I comandi si scelgono con i pulsanti.",
                     "entrambi": "I comandi si scrivono oppure si scelgono con i pulsanti."}
            return {"ok": True, "text": frasi.get(spec.get("mode"), frasi["entrambi"])}
        if op == "object_def":
            kind = spec.get("kind", "oggetto")
            coda = _DEF_KIND_TESTO.get(kind, "una cosa")
            return {"ok": True, "text": f"{spec['name']} è {coda}."}
        if op == "description":
            return {"ok": True, "text": _frase_descrizione(spec["name"], spec.get("text", ""))}
        if op == "connection":
            return {"ok": True,
                    "text": f"{spec['from']} collega {spec['direction']} a "
                            f"{_articolo_in_minuscolo(spec['to'])}."}
        if op == "position":
            return {"ok": True, "text": _frase_posizione(
                spec["name"], spec["prep"], spec["place"])}
        if op == "property":
            return {"ok": True, "text": f"{spec['name']} è {spec['property']}."}
        if op == "prendibile":
            return {"ok": True, "text": f"{spec['name']} è prendibile."}
        if op == "carry_base":
            # [Livello 7] 'Il giocatore può portare N oggetti.' — limite base globale.
            return {"ok": True,
                    "text": f"Il giocatore può portare {int(spec['value'])} oggetti."}
        if op == "carry_bonus":
            # [Livello 7] 'X dà N spazi.' — bonus di capacità dell'oggetto.
            return {"ok": True,
                    "text": f"{spec['name']} dà {int(spec['value'])} spazi."}
        if op == "alias":
            return {"ok": True,
                    "text": f"{spec['name']} si chiama anche {_quota(spec['alias'])}."}
        if op == "start":
            return {"ok": True, "text": f"Il giocatore comincia in {spec['name']}."}
        if op == "direction_decl":
            a = str(spec["a"]).strip()
            b = str(spec["b"]).strip()
            a = a[:1].upper() + a[1:]  # prima lettera maiuscola (stile d'autore)
            return {"ok": True, "text": f"{a} e {b} sono direzioni opposte."}
        if op == "opposite_decl":
            # Coppia di proprietà opposte: 'aperta e chiusa sono opposte.'. Sono
            # PROPRIETA (aggettivi minuscoli), niente maiuscola iniziale.
            a = str(spec["a"]).strip()
            b = str(spec["b"]).strip()
            return {"ok": True, "text": f"{a} e {b} sono opposte."}
        if op == "state_decl":
            # [Favella Studio / Stati] 'X è uno stato.' — dichiara una variabile
            # globale enum-like. Il nome è scritto verbatim (il regex VARIABILE
            # tollera l'articolo opzionale, come per le ENTITA).
            return {"ok": True, "text": f"{str(spec['name']).strip()} è uno stato."}
        if op == "state_init":
            # 'X è valore.' — valore iniziale di uno stato (def_stato_valore). Vale
            # anche per CAMBIARE il valore iniziale. Il valore è una PROPRIETA
            # (monoparola, minuscola).
            return {"ok": True,
                    "text": f"{str(spec['name']).strip()} è {str(spec['value']).strip()}."}
        if op == "counter_decl":
            # 'X è un contatore.' — contatore numerico (valore iniziale 0).
            return {"ok": True, "text": f"{str(spec['name']).strip()} è un contatore."}
        if op == "counter_init":
            # [0.16.0 / B.2] 'X parte da N.' — valore iniziale di un contatore.
            return {"ok": True,
                    "text": f"{str(spec['name']).strip()} parte da {int(spec['value'])}."}
        if op == "state_values_comment":
            # Commento canonico per persistere l'elenco dei valori ammessi di uno
            # stato, inclusi quelli non ancora usati in nessuna regola. Il motore lo
            # IGNORA (è un commento) → semantica byte-stabile; il sidecar lo legge in
            # analizza_variabili per popolare i dropdown. Forma: '# valori di X: a, b'.
            valori = [str(v).strip() for v in (spec.get("values") or []) if str(v).strip()]
            return {"ok": True,
                    "text": f"# valori di {str(spec['name']).strip()}: {', '.join(valori)}"}
        if op == "rule":
            return {"ok": True, "text": _serializza_regola(spec)}
        if op == "event":
            return {"ok": True, "text": _serializza_evento(spec)}
        if op == "demon":
            return {"ok": True, "text": _serializza_demone(spec)}
        if op == "npc_decl":
            # [Fase 6b] 'X è un personaggio.' — promuove un oggetto a NPC.
            return {"ok": True, "text": f"{spec['name']} è un personaggio."}
        if op == "dialogue_start":
            # [Fase 6b] 'Il dialogo di X comincia con "nodo".' — nodo d'ingresso.
            return {"ok": True,
                    "text": _frase_dialogo_inizio(spec["name"], spec["node"])}
        if op == "node_line":
            # [Fase 6b] 'X al nodo "n" dice "battuta".' — battuta dell'NPC al nodo.
            return {"ok": True,
                    "text": f"{spec['speaker']} al nodo {_quota(spec['node'])} "
                            f"dice {_quota(spec.get('line', ''))}."}
        if op == "dialogue_option":
            # [Fase 6b] 'Al nodo "n" l'opzione "t" [se …] conduce/chiude […].'
            return {"ok": True, "text": _serializza_opzione(spec)}
        return {"ok": False, "error": f"Operazione di serializzazione sconosciuta: {op!r}."}
    except KeyError as e:
        return {"ok": False, "error": f"Campo mancante per l'op {spec.get('op')!r}: {e}."}
    except ValueError as e:
        return {"ok": False, "error": str(e)}


# ==============================================================================
# STUDIO 1.1 — STORIE A PIÙ FILE, RIORDINO DI TUTTA LA STORIA, RINOMINA ED ELIMINA
# ------------------------------------------------------------------------------
# Quattro strumenti per l'editor visuale, tutti additivi (il nucleo non cambia):
#   - sorgenti_vive: per la durata di una chiamata, i file elencati si leggono dal
#     buffer dell'editor invece che dal disco. Così una storia a più file si
#     compila e si legge con TUTTE le modifiche non ancora salvate;
#   - riordina_storia: il riordino canonico di ogni file della storia (Includi
#     compresi), ciascuno nel proprio file;
#   - rinomina_entita: cambia il nome di una stanza o di un oggetto in tutte le
#     frasi che lo citano, leggendo i token del parser (mai il testo delle
#     descrizioni), e controlla che la storia compili ancora;
#   - riferimenti_entita: l'elenco delle frasi che citano un'entità, per sapere
#     che cosa porterebbe via un'eliminazione.
# ==============================================================================

import builtins
import contextlib
import io
import os
import sys

from compilatore import PAROLE_RISERVATE
from favella_utils import normalizza_tipografia


def _chiave_percorso(percorso):
    return os.path.normcase(os.path.abspath(percorso))


@contextlib.contextmanager
def sorgenti_vive(sorgenti):
    """Per la durata del blocco, la lettura dei file indicati ({percorso: testo})
    dà il testo dato invece di quello su disco. Vale per il compilatore (gli
    'Includi'), per questo modulo e per l'esportazione. Annidabile: il livello
    interno vince su quello esterno. Senza sorgenti non fa nulla."""
    if not sorgenti:
        yield
        return
    vive = {_chiave_percorso(p): t for p, t in sorgenti.items() if isinstance(t, str)}
    moduli = [m for m in (sys.modules.get("compilatore"), sys.modules.get(__name__),
                          sys.modules.get("esportazione")) if m is not None]
    salvati = []

    def _fabbrica(precedente):
        def _apri(file, mode="r", *args, **kwargs):
            if (isinstance(file, (str, os.PathLike)) and "r" in mode
                    and not any(c in mode for c in "wax+b")):
                testo = vive.get(_chiave_percorso(os.fspath(file)))
                if testo is not None:
                    return io.StringIO(testo)
            return precedente(file, mode, *args, **kwargs)
        return _apri

    for m in moduli:
        c_era = "open" in m.__dict__
        precedente = m.__dict__.get("open", builtins.open)
        salvati.append((m, c_era, precedente))
        m.open = _fabbrica(precedente)
    try:
        yield
    finally:
        for m, c_era, precedente in reversed(salvati):
            if c_era:
                m.open = precedente
            else:
                try:
                    del m.open
                except AttributeError:
                    pass


def _analizza_storia(percorso_radice, sorgente=None):
    """(mondo, albero, mappa_righe) della storia intera: il Mondo compilato più
    l'albero del parser con le posizioni, e la mappa riga-espansa → (file, riga).
    None se la storia non compila."""
    diag = analizza_file_strutturato(percorso_radice, sorgente=sorgente)
    if not diag.get("ok"):
        return None
    mondo = compila_mondo(percorso_radice, sorgente)
    if mondo is None:
        return None
    try:
        testo, mappa, _err = _espandi_inclusioni_seedable(percorso_radice, sorgente)
        simboli = costruisci_symbol_table(testo)
        _cp, nomi_dir, _de = valida_direzioni_dichiarate(simboli.coppie_direzioni, simboli)
        parser = costruisci_parser(simboli.tutti, simboli.variabili, nomi_dir,
                                   propagate_positions=True, verbi_multi=simboli.verbi_multi)
        albero = parser.parse(testo)
    except Exception:
        return None
    return mondo, albero, mappa


def _dentro_la_cartella(percorso, radice):
    """True se 'percorso' sta nella cartella del file radice (o sotto): solo quei
    file sono della storia; la libreria standard no."""
    base = os.path.normcase(os.path.dirname(os.path.abspath(radice)))
    p = os.path.normcase(os.path.abspath(percorso))
    return p == base or p.startswith(base + os.sep)


def _leggi_file(percorso, radice, sorgente_radice):
    """Il testo di un file della storia: il buffer per la radice (se dato), il
    disco (o una sorgente viva) per gli altri. Fine riga normalizzati a LF."""
    if sorgente_radice is not None and _chiave_percorso(percorso) == _chiave_percorso(radice):
        return sorgente_radice.replace("\r\n", "\n")
    with open(percorso, encoding="utf-8") as f:
        return f.read().replace("\r\n", "\n")


def _frasi_di_primo_livello(albero, mappa, percorso_radice):
    """Le frasi di primo livello dell'albero, ognuna col file e la riga in cui sta
    davvero (la mappa le riporta dal testo unito ai singoli file). Solo i file
    della cartella della storia: la libreria standard resta fuori."""
    frasi = []
    for nodo in albero.children:
        if not isinstance(nodo, Tree):
            continue
        meta = getattr(nodo, "meta", None)
        riga = getattr(meta, "line", None) if meta else None
        if riga is None or not (1 <= riga <= len(mappa)):
            continue
        fine = getattr(meta, "end_line", riga) or riga
        f_o, r_o = mappa[riga - 1]
        _f2, r_fine = mappa[min(max(fine, 1), len(mappa)) - 1]
        if not _dentro_la_cartella(f_o, percorso_radice):
            continue
        frasi.append({"nodo": nodo, "file": f_o, "start": int(r_o), "end": int(r_fine)})
    return frasi


def riordina_storia(percorso_radice, sorgente=None):
    """[Studio 1.1] Riordino canonico di TUTTI i file di una storia, ciascuno nel
    suo file: dove prima c'era solo il file singolo, ora anche le storie con
    'Includi'. Ritorna {ok, files:[{path, text, changed}], reason}: 'files' elenca
    ogni file della storia con il testo riordinato; 'changed' dice se è diverso da
    com'era. Non scrive niente: il chiamante decide che farne."""
    analizzata = _analizza_storia(percorso_radice, sorgente)
    if analizzata is None:
        return {"ok": False, "files": [],
                "reason": "Correggi gli errori della storia prima di riordinare."}
    mondo, albero, mappa = analizzata

    per_file = {}
    for f in _frasi_di_primo_livello(albero, mappa, percorso_radice):
        per_file.setdefault(f["file"], []).append({
            "start": f["start"], "end": f["end"],
            "cls": _autoformat_classifica(f["nodo"].data, _tokens_per_tipo(f["nodo"]), mondo)})

    # Il file radice c'è sempre, anche se contiene solo degli Includi.
    per_file.setdefault(percorso_radice, [])
    files = []
    for percorso, frasi in per_file.items():
        try:
            originale = _leggi_file(percorso, percorso_radice, sorgente)
        except OSError as e:
            return {"ok": False, "files": [],
                    "reason": f"Impossibile leggere «{os.path.basename(percorso)}»: {e}"}
        if frasi or any(_RE_RIGA_INCLUDI.match(r) for r in originale.split("\n")):
            nuovo = _riordina_righe(originale.split("\n"), frasi)
        else:
            nuovo = originale   # solo commenti: non c'è niente da riordinare
        files.append({"path": percorso, "text": nuovo,
                      "changed": nuovo.rstrip("\n") != originale.rstrip("\n")})
    return {"ok": True, "files": files, "reason": None}


# --- Rinomina ------------------------------------------------------------------

# Preposizione semplice + articolo → preposizione articolata, e il suo inverso.
_PREP_ARTICOLATE = {
    "di": {"il": "del", "lo": "dello", "la": "della", "l'": "dell'",
           "i": "dei", "gli": "degli", "le": "delle"},
    "a":  {"il": "al", "lo": "allo", "la": "alla", "l'": "all'",
           "i": "ai", "gli": "agli", "le": "alle"},
    "da": {"il": "dal", "lo": "dallo", "la": "dalla", "l'": "dall'",
           "i": "dai", "gli": "dagli", "le": "dalle"},
    "in": {"il": "nel", "lo": "nello", "la": "nella", "l'": "nell'",
           "i": "nei", "gli": "negli", "le": "nelle"},
    "su": {"il": "sul", "lo": "sullo", "la": "sulla", "l'": "sull'",
           "i": "sui", "gli": "sugli", "le": "sulle"},
}
_PREP_ART_INVERSA = {forma: (base, art)
                     for base, tab in _PREP_ARTICOLATE.items() for art, forma in tab.items()}
# Dall'articolo indeterminativo al determinativo che gli corrisponde.
_ART_DETERMINATIVO = {"un'": "l'", "un": "il", "uno": "lo", "una": "la"}
_RE_PREP_ARTICOLATA = re.compile(
    r"(?<![\wÀ-ÿ'])(" + "|".join(re.escape(p) for p in
                                  sorted(_PREP_ART_INVERSA, key=len, reverse=True)) + r")\s*$",
    re.IGNORECASE)
_RE_NOME_VALIDO = re.compile(r"^[A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9' \-]*$")


def _maiuscola(testo, si):
    if not testo:
        return testo
    return (testo[:1].upper() if si else testo[:1].lower()) + testo[1:]


def _trova_entita(mondo, nome):
    """(id, 'stanza'|'oggetto', nome visualizzato) dell'entità indicata (per id o
    per nome con l'articolo), oppure None."""
    vid = normalizza_nome(nome)
    if vid in mondo.stanze:
        return vid, "stanza", mondo.stanze[vid].nome_visualizzato
    if vid in mondo.oggetti:
        return vid, "oggetto", mondo.oggetti[vid].nome_visualizzato
    return None


def _no_rinomina(motivo):
    return {"ok": False, "files": [], "replaced": 0, "mentions": [], "reason": motivo}


def rinomina_entita(percorso_radice, sorgente, nome, nuovo_nome):
    """[Studio 1.1] Cambia il nome di una stanza o di un oggetto in ogni frase che
    lo cita. Lavora sui TOKEN del parser, quindi non tocca mai il testo delle
    descrizioni o delle risposte (se vi compare il vecchio nome, lo dice a parte in
    'mentions'). Se il nuovo articolo è di un altro genere, adatta le preposizioni
    che lo precedono («nella cucina» → «nel tinello»). Prima di restituire il
    risultato ricompila la storia: se non compila più, non cambia niente.

    Ritorna {ok, files:[{path, text}], replaced, mentions:[{file, line, text}],
    reason}: 'files' elenca solo i file modificati, col testo intero."""
    nuovo_nome = (nuovo_nome or "").strip()
    analizzata = _analizza_storia(percorso_radice, sorgente)
    if analizzata is None:
        return _no_rinomina("Correggi gli errori della storia prima di rinominare.")
    mondo, albero, mappa = analizzata
    trovata = _trova_entita(mondo, nome)
    if trovata is None:
        return _no_rinomina(f"Non trovo «{nome}» nella storia.")
    vid, _tipo, visualizzato = trovata

    art_n, nuc_n = _scomponi_articolo(nuovo_nome)
    nuovo_id = normalizza_nome(nuovo_nome)
    if not nuovo_nome or not nuc_n or not _RE_NOME_VALIDO.match(nuovo_nome):
        return _no_rinomina("Il nome può avere lettere, numeri, spazi, apostrofi e trattini.")
    if nuovo_nome.strip().lower() == visualizzato.strip().lower():
        return {"ok": True, "files": [], "replaced": 0, "mentions": [], "reason": None}
    occupati = (set(mondo.stanze) | set(mondo.oggetti) | set(mondo.variabili)
                | set(getattr(mondo, "contatori", {}) or {}))
    if nuovo_id != vid and nuovo_id in occupati:
        return _no_rinomina(f"Esiste già qualcosa che si chiama «{nuovo_id}».")
    if nuovo_id != vid and nuovo_id in PAROLE_RISERVATE:
        return _no_rinomina(f"«{nuovo_id}» è una parola riservata del linguaggio.")
    _art_v, nuc_v = _scomponi_articolo(visualizzato)

    # Ogni token ENTITA che indica questa entità, con la sua posizione vera.
    citazioni = {}   # (file, riga) -> [(colonna0, fine0, grezzo)]
    for tok in albero.scan_values(lambda v: isinstance(v, Token) and v.type == "ENTITA"):
        if normalizza_nome(str(tok)) != vid:
            continue
        if not (1 <= tok.line <= len(mappa)):
            continue
        f_o, r_o = mappa[tok.line - 1]
        if not _dentro_la_cartella(f_o, percorso_radice):
            continue
        citazioni.setdefault((f_o, r_o), []).append((tok.column - 1, tok.end_column - 1, str(tok)))

    testi = {}   # file -> [righe]
    modificati = set()
    sostituiti = 0
    for (f_o, r_o), lista in citazioni.items():
        if f_o not in testi:
            try:
                testi[f_o] = _leggi_file(f_o, percorso_radice, sorgente).split("\n")
            except OSError as e:
                return _no_rinomina(f"Impossibile leggere «{os.path.basename(f_o)}»: {e}")
        righe = testi[f_o]
        riga = righe[r_o - 1]
        if len(normalizza_tipografia(riga)) != len(riga):
            riga = normalizza_tipografia(riga)   # le virgolette curve diventano dritte
        for col, fine, grezzo in sorted(lista, reverse=True):
            if riga[col:fine] != grezzo:
                col = riga.find(grezzo)
                fine = col + len(grezzo)
                if col < 0:
                    return _no_rinomina(f"Non ritrovo «{grezzo}» a riga {r_o} di "
                                        f"{os.path.basename(f_o)}: rinomina dal testo.")
            art_t, _nuc_t = _scomponi_articolo(grezzo)
            sostituzione = None
            inizio = col
            if art_t is None:
                nucleo = nuc_n
                if grezzo[:1].isupper() and not nuc_v[:1].isupper():
                    nucleo = _maiuscola(nuc_n, True)
                m = _RE_PREP_ARTICOLATA.search(riga[:col])
                if m:
                    base, art_p = _PREP_ART_INVERSA[m.group(1).lower()]
                    art_det = _ART_DETERMINATIVO.get(art_n, art_n) if art_n else None
                    if art_det != art_p:
                        prep = _PREP_ARTICOLATE[base][art_det] if art_det else base
                        prep = _maiuscola(prep, m.group(1)[:1].isupper())
                        sostituzione = prep + ("" if prep.endswith("'") else " ") + nucleo
                        inizio = m.start(1)
                if sostituzione is None:
                    sostituzione = nucleo
            elif art_n:
                articolo = _maiuscola(art_n, grezzo[:1].isupper())
                sostituzione = articolo + ("" if articolo.endswith("'") else " ") + nuc_n
            else:
                sostituzione = _maiuscola(nuc_n, grezzo[:1].isupper())
            riga = riga[:inizio] + sostituzione + riga[fine:]
            sostituiti += 1
        righe[r_o - 1] = riga
        modificati.add(f_o)

    nuovi = {f: "\n".join(testi[f]) for f in modificati}
    # La storia deve compilare ancora, e con le stesse entità.
    root_nuovo = nuovi.get(percorso_radice, sorgente)
    with sorgenti_vive({f: t for f, t in nuovi.items() if f != percorso_radice}):
        verifica = analizza_file_strutturato(percorso_radice, sorgente=root_nuovo)
        dopo = compila_mondo(percorso_radice, root_nuovo) if verifica.get("ok") else None
    if (dopo is None or nuovo_id not in (set(dopo.stanze) | set(dopo.oggetti))
            or len(dopo.stanze) != len(mondo.stanze) or len(dopo.oggetti) != len(mondo.oggetti)):
        errori = verifica.get("errors") or []
        motivo = errori[0].get("message") if errori else "la storia non compilerebbe più"
        return _no_rinomina(f"Non rinomino: {motivo}")

    # Il vecchio nome può restare dentro i testi (descrizioni, risposte): non si
    # tocca, ma si segnala dove.
    menzioni = []
    if nuc_v:
        rx = re.compile(r"(?<![\wÀ-ÿ])" + re.escape(nuc_v) + r"(?![\wÀ-ÿ])", re.IGNORECASE)
        rx_testo = re.compile(r'"((?:\\.|[^"\\])*)"')
        for f in sorted({percorso_radice} | modificati | {f for f, _ in citazioni}):
            if not _dentro_la_cartella(f, percorso_radice) or len(menzioni) >= 20:
                continue
            if f in nuovi:
                righe_f = nuovi[f].split("\n")
            else:
                try:
                    righe_f = _leggi_file(f, percorso_radice, sorgente).split("\n")
                except OSError:
                    continue
            for n, r in enumerate(righe_f, 1):
                if any(rx.search(t) for t in rx_testo.findall(r)):
                    menzioni.append({"file": f, "line": n, "text": r.strip()[:120]})
                    if len(menzioni) >= 20:
                        break
    return {"ok": True, "replaced": sostituiti, "mentions": menzioni, "reason": None,
            "files": [{"path": f, "text": t} for f, t in nuovi.items()]}


# --- Riferimenti (per l'eliminazione) --------------------------------------------

_CATEGORIE_FRASE = {
    "def_stanza": "definizione", "def_oggetto": "definizione", "def_contenitore": "definizione",
    "def_supporto": "definizione", "def_personaggio": "definizione",
    "def_descrizione": "descrizione", "def_posto": "descrizione",
    "def_posizione": "posizione", "def_anche_in": "posizione", "def_di_scena": "posizione",
    "def_connessione": "uscita", "def_giocatore": "partenza",
    "def_giocatore_inventario": "inventario", "def_png_ha": "inventario",
    "def_proprieta": "proprietà", "def_alias": "sinonimo", "def_capacita_oggetto": "proprietà",
    "def_illumina": "proprietà",
    "def_regola": "regola", "evento_al": "regola", "evento_ogni": "regola",
    "demone_ogni": "regola", "demone_quando": "regola", "demone_dopo": "regola",
    "def_dialogo_inizio": "dialogo", "def_battuta": "dialogo", "def_opzione": "dialogo",
    "def_argomento": "dialogo",
}


def riferimenti_entita(percorso_radice, sorgente, nome):
    """[Studio 1.1] Tutte le frasi (di primo livello) che citano una stanza o un
    oggetto, ciascuna con la categoria, l'anteprima e lo span: è ciò che porterebbe
    via un'eliminazione. Per un personaggio include anche le risposte dei nodi in
    cui parla. Ritorna {ok, id, kind, name, items:[{category, preview, span}], reason}."""
    analizzata = _analizza_storia(percorso_radice, sorgente)
    if analizzata is None:
        return {"ok": False, "items": [],
                "reason": "Correggi gli errori della storia prima di eliminare."}
    mondo, albero, mappa = analizzata
    trovata = _trova_entita(mondo, nome)
    if trovata is None:
        return {"ok": False, "items": [], "reason": f"Non trovo «{nome}» nella storia."}
    vid, tipo, visualizzato = trovata

    frasi = []
    for f in _frasi_di_primo_livello(albero, mappa, percorso_radice):
        tok = _tokens_per_tipo(f["nodo"])
        frasi.append({"data": f["nodo"].data, "tok": tok,
                      "ids": {normalizza_nome(str(t)) for t in tok.get("ENTITA", [])},
                      "span": {"file": f["file"], "line": f["start"], "endLine": f["end"]}})

    scelte = [f for f in frasi if vid in f["ids"]]
    # Un personaggio: anche le risposte dei nodi in cui parla.
    nodi_suoi = set()
    for f in scelte:
        if f["data"] == "def_battuta":
            quotati = f["tok"].get("TESTO_QUOTATO", [])
            ents = f["tok"].get("ENTITA", [])
            if quotati and ents and normalizza_nome(str(ents[0])) == vid:
                nodi_suoi.add(_spoglia_quotato(str(quotati[0])))
    if nodi_suoi:
        presenti = {(f["span"]["file"], f["span"]["line"]) for f in scelte}
        for f in frasi:
            if f["data"] != "def_opzione" or (f["span"]["file"], f["span"]["line"]) in presenti:
                continue
            quotati = f["tok"].get("TESTO_QUOTATO", [])
            if quotati and _spoglia_quotato(str(quotati[0])) in nodi_suoi:
                scelte.append(f)

    cache = {}
    voci = []
    for f in sorted(scelte, key=lambda x: (x["span"]["file"], x["span"]["line"])):
        sp = f["span"]
        if sp["file"] not in cache:
            try:
                cache[sp["file"]] = _leggi_file(sp["file"], percorso_radice, sorgente).split("\n")
            except OSError:
                cache[sp["file"]] = []
        righe = cache[sp["file"]]
        anteprima = righe[sp["line"] - 1].strip() if 0 < sp["line"] <= len(righe) else ""
        voci.append({"category": _CATEGORIE_FRASE.get(f["data"], "altro"),
                     "preview": anteprima[:140], "span": sp})
    return {"ok": True, "id": vid, "kind": tipo, "name": visualizzato,
            "items": voci, "reason": None}
