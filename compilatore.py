# compilatore.py
# Micro-Compilatore Formale per FAVELLA 1 (v0.6.2)
# Usa Lark (parser LALR(1), pipeline a due passate) per generare un AST senza regex.

import re
from lark import Lark, Transformer, v_args
from lark.exceptions import UnexpectedInput
from strutture import (
    Mondo, Stanza, Oggetto, Regola,
    Condizione, CondizionePossesso, CondizioneProprieta,
    CondizioneAnd, CondizioneOr, CondizioneNot,
    Conseguenza, ConseguenzaProprieta, ConseguenzaSpostamento,
)
from libreria_azioni import LIBRERIA_AZIONI
from utils import normalizza_nome, normalizza_tipografia, ARTICOLI
import sys

# Vocabolario chiuso dei verbi riconosciuti dal motore di gioco. Serve per
# validare a compile-time i verbi delle regole "Invece di" (un verbo non in
# questo insieme genera una regola morta che non si attiverà mai a runtime).
VERBI_VALIDI = {verbo for azione in LIBRERIA_AZIONI.values() for verbo in azione.nomi}

# ==============================================================================
# 0. PAROLE RISERVATE E SCANNER DELLE DICHIARAZIONI (Passata 1) — Livello 2.5
# ==============================================================================
#
# La disambiguazione strutturale (G1) si fonda su una compilazione a DUE PASSATE:
#   Passata 1 (questo blocco): scansiona il sorgente e costruisce la SYMBOL TABLE
#       di tutti i nomi-entità dichiarati (stanze e oggetti).
#   Passata 2 (grammatica + transformer): le entità diventano token CHIUSI risolti
#       per longest-match contro i simboli noti, eliminando alla radice l'ambiguità
#       del vecchio `entita: WORD+` aperto.
#
# Questo blocco implementa la Passata 1 ed è, in v0.6.1, ISOLATO e unit-testato
# ma NON ancora cablato nel parsing (che avverrà in v0.6.2).

# Vocabolario STRUTTURALE del linguaggio: parole che la grammatica interpreta
# come keyword e che pertanto NON possono costituire da sole un nome-entità.
# (Documentato nel manuale autore; 'e'/'o' restano sia congiunzioni sia
# abbreviazioni di direzione — quirk noto, vedi roadmap G4.)
PAROLE_RISERVATE = frozenset({
    # copula e definizioni base
    "è", "una", "un", "uno", "stanza", "cosa", "prendibile",
    # descrizione e relative preposizioni articolate
    "la", "il", "lo", "i", "gli", "le", "l'", "un'",
    "descrizione", "di", "del", "della", "dell'", "degli", "delle",
    # preposizioni di luogo
    "in", "nel", "nella", "negli", "nelle", "nell'",
    "sul", "sulla", "sullo", "sui", "sugli", "sulle",
    # connessioni e posizione iniziale del giocatore
    "collega", "a", "giocatore", "comincia", "inizia", "parte",
    # regole, condizioni, conseguenze
    "invece", "se", "dire", "e", "adesso", "oppure", "non", "ha",
    # preposizioni d'azione
    "su", "con", "contro",
    # direzioni (estese e abbreviate)
    "nord", "sud", "est", "ovest", "n", "s", "o",
    # destinazione speciale
    "nulla",
})


class TabellaSimboli:
    """Symbol table prodotta dalla Passata 1: i nomi-entità dichiarati nel
    sorgente, già normalizzati (lowercase, senza articolo iniziale)."""

    def __init__(self):
        self.stanze = set()    # id normalizzati delle stanze
        self.oggetti = set()   # id normalizzati degli oggetti

    @property
    def tutti(self):
        """Tutti i nomi referenziabili (stanze ∪ oggetti)."""
        return self.stanze | self.oggetti

    def __repr__(self):
        return f"TabellaSimboli(stanze={sorted(self.stanze)}, oggetti={sorted(self.oggetti)})"


# Pattern delle SOLE forme dichiarative che introducono un nome-entità.
# Tutto il resto (proprietà, posizione, descrizione, regole) si limita a
# *referenziare* entità già dichiarate e quindi non popola la symbol table.
_RE_DEF_STANZA = re.compile(r"^(?P<nome>.+?)\s+è\s+una\s+stanza$", re.IGNORECASE)
_RE_DEF_OGGETTO = re.compile(r"^(?P<nome>.+?)\s+è\s+una\s+cosa$", re.IGNORECASE)
# 'X collega <direzione> a Y' introduce (o conferma) due stanze.
_RE_DEF_CONNESSIONE = re.compile(
    r"^(?P<x>.+?)\s+collega\s+\S+\s+a\s+(?P<y>.+)$", re.IGNORECASE)
# Stringhe quotate e commenti vanno rimossi prima di spezzare sui punti.
_RE_QUOTATO = re.compile(r'"(\\.|[^"\\])*"')
_RE_COMMENTO = re.compile(r"#[^\n]*")


def costruisci_symbol_table(testo: str) -> TabellaSimboli:
    """
    PASSATA 1 — Scanner delle dichiarazioni.

    Estrae dal sorgente .fav i nomi di tutte le stanze e gli oggetti DICHIARATI,
    senza eseguire il parsing completo. È deliberatamente robusto e tollerante:
    ignora il contenuto delle stringhe quotate e dei commenti, e considera solo
    le tre forme che *introducono* un nome (`è una stanza`, `è una cosa`,
    `collega ... a ...`).

    Restituisce una TabellaSimboli con i nomi già normalizzati.
    """
    tab = TabellaSimboli()
    if not testo:
        return tab

    # Normalizzazione tipografica + rimozione di stringhe e commenti, così i
    # punti (".") interni a descrizioni o note non spezzino erroneamente le frasi.
    pulito = normalizza_tipografia(testo)
    pulito = _RE_QUOTATO.sub('""', pulito)
    pulito = _RE_COMMENTO.sub("", pulito)

    for frase in pulito.split("."):
        frase = frase.strip()
        if not frase:
            continue

        m = _RE_DEF_STANZA.match(frase)
        if m:
            tab.stanze.add(normalizza_nome(m.group("nome")))
            continue

        m = _RE_DEF_OGGETTO.match(frase)
        if m:
            tab.oggetti.add(normalizza_nome(m.group("nome")))
            continue

        m = _RE_DEF_CONNESSIONE.match(frase)
        if m:
            tab.stanze.add(normalizza_nome(m.group("x")))
            tab.stanze.add(normalizza_nome(m.group("y")))
            continue

    return tab


# ==============================================================================
# 1. LA GRAMMATICA EBNF DI FAVELLA 1 (La Costituzione) — Passata 2, LALR(1)
# ==============================================================================
#
# [Livello 2.5] La grammatica non è più statica: il terminale ENTITA viene
# GENERATO per-file dalla symbol-table (Passata 1) come alternanza CHIUSA dei
# soli nomi dichiarati (longest-match, articolo opzionale). Questo elimina alla
# radice l'ambiguità del vecchio `entita: WORD+` aperto e permette di usare il
# parser LALR(1), unambiguo PER COSTRUZIONE (i conflitti emergono a build-time).
#
# Conseguenza di design: le PROPRIETÀ coniate (`è chiusa`) sono un terminale
# SEPARATO `PROPRIETA`, di una sola parola e a priorità bassa, così non possono
# inghiottire i keyword che le seguono (`e`, `oppure`, `:`). I nomi multiparola
# restano pienamente supportati, ma solo per le ENTITÀ (es. "cella di
# contenimento"), non per le proprietà di stato (sempre monoparola).
#
# Sparite, finalmente, tutte le priorità-cerotto `.2`/`.1` della v0.6.x: con i
# nomi come token chiusi non servono più.

# Pseudo-simboli SEMPRE risolvibili come ENTITA (destinazioni speciali delle
# conseguenze di spostamento), oltre ai nomi dichiarati dall'autore.
SIMBOLI_SPECIALI = ("inventario", "nulla")

# Template della grammatica: __ENTITA__ verrà sostituito a runtime con la regex
# generata dai simboli noti.
_GRAMMAR_TEMPLATE = r"""
    start: dichiarazione+

    ?dichiarazione: def_stanza
                  | def_oggetto
                  | def_descrizione
                  | def_posizione
                  | def_proprieta
                  | def_connessione
                  | def_regola
                  | def_giocatore

    // --- DEFINIZIONI BASE ---
    def_stanza: ENTITA "è" "una" "stanza" "."
    def_oggetto: ENTITA "è" "una" "cosa" "."
    def_descrizione: "La" "descrizione" ( "di" | "del" | "della" | "dell'" | "degli" | "delle" ) ENTITA "è" TESTO_QUOTATO "."
    def_posizione: ENTITA "è" PREP_LUOGO ENTITA "."
    // 'è prendibile' è una proprietà speciale gestita nel transformer (vedi
    // def_proprieta): niente regola separata, così la grammatica è 0-ambigua.
    def_proprieta: ENTITA "è" PROPRIETA "."
    def_connessione: ENTITA "collega" DIREZIONE "a" ENTITA "."
    def_giocatore: "Il" "giocatore" ( "comincia" | "inizia" | "parte" ) PREP_LUOGO ENTITA "."

    // --- REGOLE (INVECE DI) ---
    // Il bersaglio del verbo può essere un'entità OPPURE una direzione (es. "vai nord").
    def_regola: "Invece" "di" VERBO ( ENTITA | DIREZIONE ) ( PREP_AZIONE ENTITA )? ( "se" condizione )? ":" "dire" TESTO_QUOTATO ( "e" "adesso" conseguenza ( "e" "adesso"? conseguenza )* )? "."

    // --- CONDIZIONI (logica booleana) ---
    // Precedenza: OR (più bassa) < AND < atomo. Parentesi per raggruppare.
    // OR usa "oppure" (NON "o", abbreviazione di "ovest"). AND usa "e".
    // La negazione è infissa: "non ha", "non è". Con ENTITA chiuso il token
    // "non" non può più essere assorbito: niente più priorità di regola.
    ?condizione: cond_or
    ?cond_or: cond_and ( "oppure" cond_and )+ -> make_or
            | cond_and
    ?cond_and: cond_base ( "e" cond_base )+ -> make_and
             | cond_base
    ?cond_base: cond_possesso
              | cond_possesso_neg
              | cond_proprieta
              | cond_proprieta_neg
              | "(" cond_or ")"
    cond_possesso: "il" "giocatore" "ha" ENTITA
    cond_possesso_neg: "il" "giocatore" "non" "ha" ENTITA
    cond_proprieta: ENTITA "è" PROPRIETA
    cond_proprieta_neg: ENTITA "non" "è" PROPRIETA

    // --- CONSEGUENZE ---
    // La destinazione dello spostamento è un'ENTITA: include i nomi dichiarati e
    // gli pseudo-simboli "inventario"/"nulla" iniettati nella regex.
    ?conseguenza: ENTITA "è" PREP_LUOGO ENTITA -> cons_spostamento
                | ENTITA "è" PROPRIETA          -> cons_proprieta

    // --- TERMINALI LESSICALI ---
    PREP_LUOGO: "in" | "nel" | "nella" | "negli" | "nelle" | "nell'" | "sul" | "sulla" | "sullo" | "sui" | "sugli" | "sulle"
    PREP_AZIONE: "su" | "con" | "contro" | "in"
    DIREZIONE: "nord" | "sud" | "est" | "ovest" | "n" | "s" | "e" | "o"

    VERBO: WORD
    WORD: /[a-zA-ZÀ-ÿ0-9']+/

    // ENTITA: alternanza CHIUSA dei nomi noti (generata per-file). Vedi
    // costruisci_grammatica(). Il flag /i la rende case-insensitive.
    ENTITA: /__ENTITA__/i

    // PROPRIETA: aggettivo di stato coniato. UNA sola parola, priorità BASSA
    // (-1): i keyword strutturali vincono sempre la contesa lessicale.
    PROPRIETA.-1: /[a-zA-ZÀ-ÿ0-9']+/

    // Testo tra virgolette doppie, con supporto per escape (\" e \\)
    TESTO_QUOTATO: /"(\\.|[^"\\])*"/

    %import common.WS
    %ignore WS
    COMMENT: /#[^\n]*/
    %ignore COMMENT
"""


def _pattern_nome(nome: str) -> str:
    """Trasforma un nome (eventualmente multiparola) in un pattern regex con
    spazi flessibili: 'porta blindata' -> 'porta\\s+blindata'."""
    return r"\s+".join(re.escape(parola) for parola in nome.split())


def _costruisci_regex_entita(simboli) -> str:
    """Costruisce la regex del terminale ENTITA come alternanza CHIUSA dei nomi
    noti (+ pseudo-simboli speciali), ordinata per lunghezza decrescente per
    garantire il LONGEST-MATCH (re usa leftmost-first, non longest), con
    articolo iniziale opzionale e confine di parola finale."""
    nomi = set(simboli) | set(SIMBOLI_SPECIALI)
    if not nomi:
        # Nessun nome dichiarato: una regex che non matcha mai (qualunque
        # riferimento a entità produrrà un errore di parsing intercettabile).
        return r"(?!)"
    alternanza = "|".join(sorted((_pattern_nome(n) for n in nomi),
                                  key=len, reverse=True))
    art_con_spazio = [a for a in ARTICOLI if not a.endswith("'")]
    art_apostrofo = [a for a in ARTICOLI if a.endswith("'")]
    sp = "|".join(sorted((re.escape(a) for a in art_con_spazio), key=len, reverse=True))
    ap = "|".join(sorted((re.escape(a) for a in art_apostrofo), key=len, reverse=True))
    prefisso_articolo = rf"(?:(?:{sp})\s+|(?:{ap}))?"
    return rf"{prefisso_articolo}(?:{alternanza})\b"


def costruisci_grammatica(simboli) -> str:
    """Restituisce la grammatica concreta per questo file, con il terminale
    ENTITA risolto dai simboli noti (Passata 2)."""
    return _GRAMMAR_TEMPLATE.replace("__ENTITA__", _costruisci_regex_entita(simboli))


def costruisci_parser(simboli) -> Lark:
    """Istanzia il parser LALR(1) per i simboli dati. LALR è unambiguo per
    costruzione: un'eventuale ambiguità grammaticale emergerebbe qui come
    GrammarError a build-time, non come scelta silenziosa a runtime."""
    return Lark(costruisci_grammatica(simboli), start="start", parser="lalr")

# ==============================================================================
# 2. IL TRANSFORMER DELL'AST
# ==============================================================================

@v_args(inline=True) # Passa i figli dei nodi come argomenti singoli ai metodi
class FavellaTransformer(Transformer):
    """
    Visita l'albero sintattico generato da Lark e popola l'oggetto Mondo.
    """
    def __init__(self):
        super().__init__()
        self.mondo = Mondo()
        self.errori = []        # Errori bloccanti: la compilazione fallisce
        self.warnings = []      # Avvisi non bloccanti: la compilazione prosegue
        self.start_dichiarato_raw = None  # Nome grezzo della stanza di partenza

    # --- Nodi Entità e Testo ---

    def ENTITA(self, token):
        # Il terminale ENTITA è un singolo token risolto dalla symbol-table; il
        # suo valore preserva il nome ORIGINALE dell'autore (articolo e
        # maiuscole) per i nomi visualizzati. La normalizzazione a ID avviene
        # nei metodi di regola tramite normalizza_nome().
        return token.value

    def PROPRIETA(self, token):
        # Aggettivo di stato coniato (monoparola).
        return token.value

    def TESTO_QUOTATO(self, token):
        # Rimuove le virgolette iniziali e finali e applica l'unescape (\" -> ", \\ -> \)
        contenuto = token.value[1:-1]
        return re.sub(r'\\(.)', r'\1', contenuto)
        
    def VERBO(self, token):
        return token.value.lower()
        
    def DIREZIONE(self, token):
        return token.value.lower()

    def PREP_AZIONE(self, token):
        return token.value.lower()

    # --- Dichiarazioni Semplici ---

    def def_stanza(self, nome_grezzo):
        id_stanza = normalizza_nome(nome_grezzo)
        stanza = self.mondo.trova_stanza(id_stanza)
        if not stanza:
            stanza = Stanza(id_stanza)
            stanza.nome_visualizzato = nome_grezzo
            self.mondo.aggiungi_stanza(stanza)
        return None

    def def_oggetto(self, nome_grezzo):
        id_oggetto = normalizza_nome(nome_grezzo)
        oggetto = self.mondo.trova_oggetto(id_oggetto)
        if not oggetto:
            oggetto = Oggetto(id_oggetto)
            oggetto.nome_visualizzato = nome_grezzo
            self.mondo.aggiungi_oggetto(oggetto)
        return None

    def def_descrizione(self, *tokens):
        # I token attesi non ignorati: l'entità e il testo
        testo = tokens[-1]
        nome_grezzo = tokens[0] 
        if len(tokens) > 2:
            nome_grezzo = tokens[-2] # In caso ci fosse un token preposizione catturato

        id_entita = normalizza_nome(nome_grezzo)
        stanza = self.mondo.trova_stanza(id_entita)
        if stanza:
            stanza.descrizione = testo
            return None

        oggetto = self.mondo.trova_oggetto(id_entita)
        if oggetto:
            oggetto.descrizione = testo
            return None

        self.errori.append(f"Descrizione per entità inesistente: '{nome_grezzo}'")
        return None

    def def_posizione(self, ogg_grezzo, prep, luogo_grezzo):
        id_ogg = normalizza_nome(ogg_grezzo)
        id_luogo = normalizza_nome(luogo_grezzo)
        oggetto = self.mondo.trova_oggetto(id_ogg)
        stanza = self.mondo.trova_stanza(id_luogo)

        if oggetto and stanza:
            oggetto.posizione = id_luogo
            stanza.oggetti[id_ogg] = oggetto
        elif not stanza:
            self.errori.append(f"Stanza inesistente '{luogo_grezzo}' per posizionare '{ogg_grezzo}'")
        else:
            self.errori.append(f"Oggetto inesistente '{ogg_grezzo}' da posizionare")
        return None

    def def_proprieta(self, ogg_grezzo, proprieta_grezzo):
        # [Livello 2.5] 'è prendibile' è confluito qui come PROPRIETÀ SPECIALE:
        # avere una regola def_prendibile separata creava l'unica vera collisione
        # lessicale residua (`è prendibile` = keyword vs proprietà). Trattando
        # 'prendibile' come proprietà speciale, la grammatica diventa 0-ambigua.
        id_ogg = normalizza_nome(ogg_grezzo)
        proprieta = normalizza_nome(proprieta_grezzo)
        oggetto = self.mondo.trova_oggetto(id_ogg)
        if not oggetto:
            self.errori.append(f"Proprietà '{proprieta_grezzo}' per oggetto inesistente: '{ogg_grezzo}'")
            return None
        if proprieta == "prendibile":
            oggetto.prendibile = True
        else:
            oggetto.aggiungi_proprieta(proprieta)
        return None

    def def_connessione(self, sta1_grezzo, direzione, sta2_grezzo):
        id_sta1 = normalizza_nome(sta1_grezzo)
        id_sta2 = normalizza_nome(sta2_grezzo)
        
        if not self.mondo.trova_stanza(id_sta1):
            stanza1 = Stanza(id_sta1)
            stanza1.nome_visualizzato = sta1_grezzo
            self.mondo.aggiungi_stanza(stanza1)
        if not self.mondo.trova_stanza(id_sta2):
            stanza2 = Stanza(id_sta2)
            stanza2.nome_visualizzato = sta2_grezzo
            self.mondo.aggiungi_stanza(stanza2)
        
        stanza1 = self.mondo.trova_stanza(id_sta1)
        stanza2 = self.mondo.trova_stanza(id_sta2)

        # Normalizza la direzione al suo nome completo
        DIREZIONI_MAP = {
            "n": "nord", "nord": "nord",
            "s": "sud", "sud": "sud",
            "e": "est", "est": "est",
            "o": "ovest", "ovest": "ovest"
        }
        direzione_norm = DIREZIONI_MAP.get(direzione, direzione)

        stanza1.uscite[direzione_norm] = id_sta2

        # Connessione automatica di ritorno
        direzione_opposta = {
            "nord": "sud", "sud": "nord",
            "est": "ovest", "ovest": "est"
        }[direzione_norm]
        stanza2.uscite[direzione_opposta] = id_sta1
        return None

    def def_giocatore(self, *tokens):
        # tokens: (PREP_LUOGO, entita_stanza) — l'ultimo è il nome della stanza.
        # La stanza potrebbe non essere ancora stata definita a questo punto del
        # transform: la validazione di esistenza è rimandata a valida_post().
        nome_grezzo = tokens[-1]
        self.start_dichiarato_raw = nome_grezzo
        self.mondo.posizione_iniziale = normalizza_nome(nome_grezzo)
        return None


    # --- Condizioni e Conseguenze (Sub-Alberi) ---

    def cond_possesso(self, ogg_grezzo):
        return CondizionePossesso(normalizza_nome(ogg_grezzo))

    def cond_possesso_neg(self, ogg_grezzo):
        return CondizioneNot(CondizionePossesso(normalizza_nome(ogg_grezzo)))

    def cond_proprieta(self, ogg_grezzo, proprieta_grezzo):
        return CondizioneProprieta(normalizza_nome(ogg_grezzo), normalizza_nome(proprieta_grezzo))

    def cond_proprieta_neg(self, ogg_grezzo, proprieta_grezzo):
        return CondizioneNot(CondizioneProprieta(normalizza_nome(ogg_grezzo), normalizza_nome(proprieta_grezzo)))

    def make_and(self, *condizioni):
        return CondizioneAnd(list(condizioni))

    def make_or(self, *condizioni):
        return CondizioneOr(list(condizioni))

    def cons_spostamento(self, ogg_grezzo, prep, dest_grezzo):
        # dest_grezzo è un'ENTITA: un nome di stanza dichiarato oppure uno
        # pseudo-simbolo speciale ("inventario", "nulla").
        id_oggetto = normalizza_nome(ogg_grezzo)
        destinazione = normalizza_nome(dest_grezzo)
        if destinazione in ["nulla", "nessun luogo", "nessuno"]:
            destinazione = "nulla"
        return ConseguenzaSpostamento(id_oggetto, destinazione)

    def cons_proprieta(self, ogg_grezzo, proprieta_grezzo):
        return ConseguenzaProprieta(normalizza_nome(ogg_grezzo), normalizza_nome(proprieta_grezzo))

    # --- La Regola Complessa ---
    
    def def_regola(self, *args):
        # args (ordine): verbo, ogg1, [prep, ogg2], [condizione], risposta, [conseguenza...]
        # [v0.6.0] la condizione può essere composita (Condizione base/And/Or/Not)
        # e le conseguenze possono essere più di una.
        args_puliti = [a for a in args if a is not None]

        verbo = args_puliti[0]
        ogg1_grezzo = args_puliti[1]

        # Inizializza opzionali
        prep_azione = None
        ogg2_grezzo = None
        condizione = None
        risposta = ""
        conseguenze = []

        idx = 2

        # Check per preposizione + secondo oggetto
        if (idx + 1 < len(args_puliti)
                and isinstance(args_puliti[idx], str)
                and args_puliti[idx] in ("su", "con", "contro", "in")):
            prep_azione = args_puliti[idx]
            ogg2_grezzo = args_puliti[idx + 1]
            idx += 2

        # Check per condizione (qualsiasi sottotipo di Condizione, anche composito)
        if idx < len(args_puliti) and isinstance(args_puliti[idx], Condizione):
            condizione = args_puliti[idx]
            idx += 1

        # Stringa di risposta
        if idx < len(args_puliti) and isinstance(args_puliti[idx], str):
            risposta = args_puliti[idx]
            idx += 1

        # Conseguenze: zero o più, in coda
        while idx < len(args_puliti) and isinstance(args_puliti[idx], Conseguenza):
            conseguenze.append(args_puliti[idx])
            idx += 1

        id_ogg1 = normalizza_nome(ogg1_grezzo)
        id_ogg2 = normalizza_nome(ogg2_grezzo) if ogg2_grezzo else None

        # Verifica entità principali della regola
        if self.mondo.trova_oggetto(id_ogg1) or id_ogg1 in ["nord", "sud", "est", "ovest", "n", "s", "e", "o"]:
            if id_ogg2 and not self.mondo.trova_oggetto(id_ogg2):
                self.errori.append(f"Regola per secondo oggetto inesistente: '{ogg2_grezzo}'")
            else:
                # Valida ogni conseguenza a compile-time
                for conseguenza in conseguenze:
                    if not self.mondo.trova_oggetto(conseguenza.id_oggetto):
                        self.errori.append(f"Oggetto inesistente nella conseguenza: '{conseguenza.id_oggetto}'")
                    if isinstance(conseguenza, ConseguenzaSpostamento) and conseguenza.destinazione not in ["nulla", "inventario"]:
                        if not self.mondo.trova_stanza(conseguenza.destinazione):
                            self.errori.append(f"Luogo inesistente nella conseguenza: '{conseguenza.destinazione}'")

                nuova_regola = Regola(
                    verbo=verbo,
                    id_oggetto_bersaglio=id_ogg1,
                    risposta=risposta,
                    condizione=condizione,
                    preposizione=prep_azione,
                    id_oggetto_secondario=id_ogg2,
                    conseguenze=conseguenze
                )
                self.mondo.aggiungi_regola(nuova_regola)
        else:
            self.errori.append(f"Regola per oggetto principale inesistente: '{ogg1_grezzo}'")

        return None

    # --- Validazione semantica globale (dopo il transform completo) ---

    def valida_post(self):
        """
        Esegue i controlli che richiedono la visione dell'intero mondo, una
        volta che tutte le dichiarazioni sono state processate. Popola errori
        (bloccanti) e warnings (non bloccanti).
        """
        m = self.mondo

        # 1. [GG1] La stanza di partenza dichiarata deve esistere.
        if self.start_dichiarato_raw is not None:
            if not m.trova_stanza(m.posizione_iniziale):
                self.errori.append(
                    f"Stanza di partenza inesistente: 'Il giocatore comincia in "
                    f"{self.start_dichiarato_raw}' (la stanza '{m.posizione_iniziale}' "
                    f"non è definita)."
                )

        # 2. [GG3] Il verbo di ogni regola deve appartenere al vocabolario noto,
        #    altrimenti la regola è "morta" (non si attiverà mai a runtime).
        for regola in m.regole:
            if regola.verbo not in VERBI_VALIDI:
                self.warnings.append(
                    f"Verbo '{regola.verbo}' non riconosciuto in una regola "
                    f"'Invece di': la regola non si attiverà mai. Usa un verbo noto "
                    f"al motore (es. usa, apri, prendi, esamina, mangia, sposta, vai)."
                )

        # 3. [GG2] Una condizione 'se [oggetto] è [proprietà]' che controlla una
        #    proprietà mai assegnata a quell'oggetto (né come stato iniziale né
        #    via conseguenza) è quasi sempre un refuso: resterebbe sempre falsa.
        #    [v0.6.0] Le condizioni possono essere composite: estraiamo
        #    ricorsivamente tutti gli atomi CondizioneProprieta.
        proprieta_assegnabili = set()  # insieme di tuple (id_oggetto, proprieta)
        for id_ogg, ogg in m.oggetti.items():
            for prop in ogg.proprieta:
                proprieta_assegnabili.add((id_ogg, prop))
        for regola in m.regole:
            for cons in regola.conseguenze:
                if isinstance(cons, ConseguenzaProprieta):
                    proprieta_assegnabili.add((cons.id_oggetto, cons.proprieta))

        for regola in m.regole:
            for cond in self._atomi_proprieta(regola.condizione):
                if not m.trova_oggetto(cond.id_oggetto):
                    self.warnings.append(
                        f"Condizione su oggetto inesistente: '{cond.id_oggetto}'."
                    )
                elif (cond.id_oggetto, cond.proprieta) not in proprieta_assegnabili:
                    self.warnings.append(
                        f"La proprietà '{cond.proprieta}' di '{cond.id_oggetto}' non "
                        f"è mai assegnata da nessuna parte: possibile refuso? La "
                        f"condizione resterà sempre falsa."
                    )

    def _atomi_proprieta(self, condizione):
        """Estrae ricorsivamente tutti gli atomi CondizioneProprieta annidati in
        una condizione (anche dentro And/Or/Not). Restituisce una lista."""
        if condizione is None:
            return []
        if isinstance(condizione, CondizioneProprieta):
            return [condizione]
        if isinstance(condizione, CondizioneNot):
            return self._atomi_proprieta(condizione.condizione)
        if isinstance(condizione, (CondizioneAnd, CondizioneOr)):
            atomi = []
            for sub in condizione.condizioni:
                atomi.extend(self._atomi_proprieta(sub))
            return atomi
        return []

# ==============================================================================
# 3. MOTORE PRINCIPALE DI COMPILAZIONE (due passate)
# ==============================================================================

def analizza_file(percorso_file: str) -> Mondo | None:
    """
    Legge un file .fav e lo compila in un Mondo popolato, con la pipeline a
    DUE PASSATE (Livello 2.5):
      Passata 1  costruisce la symbol-table dei nomi dichiarati;
      Passata 2  istanzia il parser LALR(1) con ENTITA risolto dai simboli,
                 genera l'AST, lo trasforma in oggetti e valida la semantica.
    """
    errori = []

    try:
        with open(percorso_file, 'r', encoding='utf-8') as file:
            testo = file.read()

        if not testo.strip():
            return Mondo() # File vuoto

        # 0. NORMALIZZAZIONE TIPOGRAFICA [L2]
        # Sostituisce apostrofi e virgolette "curve" (tipici di copia-incolla da
        # editor di testo) con le versioni dritte attese dalla grammatica.
        testo = normalizza_tipografia(testo)

        # 1. PASSATA 1 — Symbol-table dei nomi dichiarati.
        simboli = costruisci_symbol_table(testo)

        # 2. PASSATA 2 — Parsing formale LALR(1) con ENTITA chiuso (Testo -> AST).
        parser = costruisci_parser(simboli.tutti)
        tree = parser.parse(testo)

        # 3. TRASFORMAZIONE (AST -> Oggetti Python)
        transformer = FavellaTransformer()
        transformer.transform(tree)

        # 4. VALIDAZIONE SEMANTICA GLOBALE
        transformer.valida_post()

        # Estrae i log dal transformer
        errori.extend(transformer.errori)

        # Avvisi non bloccanti: mostrati sempre, ma non interrompono la build
        if transformer.warnings:
            print("\n[FAVELLA 1] Avvisi (non bloccanti):")
            for w in transformer.warnings:
                print(f" - {w}")

        if errori:
            print("\n[FAVELLA 1] Trovati errori di logica durante la costruzione:")
            for err in errori:
                print(f" - {err}")
            return None

        return transformer.mondo

    except UnexpectedInput as e:
        # Errore sintattico formale sollevato da Lark (Es: manca punto, ortografia)
        print("\n[ERRORE DI SINTASSI FAVELLA]")
        print(f"Riga {e.line}, Colonna {e.column}")
        
        # Mostra il frammento di codice errato
        contesto = e.get_context(testo, span=40)
        print("-" * 40)
        print(contesto.strip())
        print("-" * 40)
        
        # Prova a suggerire cosa si aspettava il parser
        attesi = e.expected if hasattr(e, 'expected') else None
        if attesi:
            print(f"Mi aspettavo: {', '.join(attesi)}")
            
        return None
        
    except FileNotFoundError:
        print(f"[ERRORE FATALE] Il file '{percorso_file}' non è stato trovato.")
        return None
        
    except Exception as ex:
        print(f"[ERRORE INTERNO] Crash durante la compilazione: {ex}")
        return None

def main():
    print("FAVELLA 1 COMPILER TEST")
    if len(sys.argv) > 1:
        m = analizza_file(sys.argv[1])
        if m:
            print("Compilazione AST + Transform completata con successo!")
            print(str(m))

if __name__ == "__main__":
    main()