# compilatore.py
# Micro-Compilatore Formale per FAVELLA 1 (v0.9.2)
# Usa Lark (parser LALR(1), pipeline a due passate) per generare un AST senza regex.

import re
import difflib
from lark import Lark, Transformer, v_args
from lark.exceptions import UnexpectedInput
from strutture import (
    Mondo, Stanza, Oggetto, Regola, Evento,
    Condizione, CondizionePossesso, CondizioneProprieta,
    CondizioneAnd, CondizioneOr, CondizioneNot, CondizioneVariabile,
    CondizioneContatore,
    Conseguenza, ConseguenzaProprieta, ConseguenzaSpostamento,
    ConseguenzaFinePartita, ConseguenzaVariabile, ConseguenzaContatore,
)
from libreria_azioni import LIBRERIA_AZIONI
from utils import (
    normalizza_nome, normalizza_tipografia, ARTICOLI,
    DIREZIONI_BASE, estrai_placeholder,
)
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
# Questo blocco implementa la Passata 1; la Passata 2 è cablata in analizza_file.

# Vocabolario STRUTTURALE del linguaggio: parole che la grammatica interpreta
# come keyword e che pertanto NON possono costituire da sole un nome-entità.
# (Documentato nel manuale autore; 'e'/'o' restano sia congiunzioni sia
# abbreviazioni di direzione — quirk noto, vedi roadmap G4.)
PAROLE_RISERVATE = frozenset({
    # copula e definizioni base
    "è", "una", "un", "uno", "stanza", "cosa", "prendibile",
    # stato astratto (Livello 3 / G3): 'X è uno stato.'
    "stato",
    # contatori numerici (Livello 3 / G3): dichiarazione, confronti, mutazioni
    "contatore", "almeno", "più", "meno",
    "aumenta", "diminuisci", "diventa",
    # eventi a turni (Livello 3)
    "al", "turno", "turni", "ogni",
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
    # proprietà opposte (Livello 3 / M5)
    "sono", "opposte",
    # alias/sinonimi di oggetti (Livello 4)
    "si", "chiama", "anche",
    # verbi personalizzati (Livello 4 / M1)
    "comando",
    # direzioni personalizzate (Livello 4 / L1)
    "direzioni",
    # contenitori e supporti (Livello 4 / M1)
    "contenitore", "supporto",
    # fine partita (Livello 3)
    "vinci", "perdi", "termina",
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
        self.stanze = set()      # id normalizzati delle stanze
        self.oggetti = set()     # id normalizzati degli oggetti
        self.variabili = set()   # [Livello 3] id normalizzati degli 'stati'
        # [Livello 4 / L1] Coppie di direzioni personalizzate dichiarate
        # ('Alto e basso sono direzioni opposte.'), come tuple (a, b) normalizzate.
        self.coppie_direzioni = []

    @property
    def tutti(self):
        """Nomi-ENTITÀ referenziabili (stanze ∪ oggetti). Gli 'stati' sono una
        classe di simboli SEPARATA (terminale VARIABILE) e non rientrano qui."""
        return self.stanze | self.oggetti

    def __repr__(self):
        return (f"TabellaSimboli(stanze={sorted(self.stanze)}, "
                f"oggetti={sorted(self.oggetti)}, variabili={sorted(self.variabili)})")


# Pattern delle SOLE forme dichiarative che introducono un nome-entità.
# Tutto il resto (proprietà, posizione, descrizione, regole) si limita a
# *referenziare* entità già dichiarate e quindi non popola la symbol table.
_RE_DEF_STANZA = re.compile(r"^(?P<nome>.+?)\s+è\s+una\s+stanza$", re.IGNORECASE)
_RE_DEF_OGGETTO = re.compile(r"^(?P<nome>.+?)\s+è\s+una\s+cosa$", re.IGNORECASE)
# 'X è uno stato' introduce uno 'stato' (variabile globale del mondo). [Livello 3]
_RE_DEF_FLAG = re.compile(r"^(?P<nome>.+?)\s+è\s+uno\s+stato$", re.IGNORECASE)
# 'X è un contatore' introduce un contatore numerico. [Livello 3]
_RE_DEF_CONTATORE = re.compile(r"^(?P<nome>.+?)\s+è\s+un\s+contatore$", re.IGNORECASE)
# 'X è un contenitore' / 'X è un supporto' introducono un OGGETTO. [Livello 4 / M1]
_RE_DEF_CONTENITORE = re.compile(r"^(?P<nome>.+?)\s+è\s+un\s+contenitore$", re.IGNORECASE)
_RE_DEF_SUPPORTO = re.compile(r"^(?P<nome>.+?)\s+è\s+un\s+supporto$", re.IGNORECASE)
# 'X collega <direzione> a Y' introduce (o conferma) due stanze.
_RE_DEF_CONNESSIONE = re.compile(
    r"^(?P<x>.+?)\s+collega\s+\S+\s+a\s+(?P<y>.+)$", re.IGNORECASE)
# 'A e B sono direzioni opposte' introduce una coppia di direzioni custom. [Livello 4]
# Le due direzioni sono parole singole (un solo token-comando di movimento).
_RE_DEF_DIREZIONI = re.compile(
    r"^(?P<a>\S+)\s+e\s+(?P<b>\S+)\s+sono\s+direzioni\s+opposte$", re.IGNORECASE)
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

        m = _RE_DEF_FLAG.match(frase)
        if m:
            tab.variabili.add(normalizza_nome(m.group("nome")))
            continue

        m = _RE_DEF_CONTATORE.match(frase)
        if m:
            tab.variabili.add(normalizza_nome(m.group("nome")))
            continue

        m = _RE_DEF_CONTENITORE.match(frase) or _RE_DEF_SUPPORTO.match(frase)
        if m:
            # Un contenitore/supporto è a tutti gli effetti un OGGETTO.
            tab.oggetti.add(normalizza_nome(m.group("nome")))
            continue

        m = _RE_DEF_DIREZIONI.match(frase)
        if m:
            a = normalizza_nome(m.group("a"))
            b = normalizza_nome(m.group("b"))
            if a and b:
                tab.coppie_direzioni.append((a, b))
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
                  | def_verbo
                  | def_descrizione
                  | def_posizione
                  | def_proprieta
                  | def_opposti
                  | def_alias
                  | def_connessione
                  | def_regola
                  | def_giocatore
                  | def_stato
                  | def_stato_valore
                  | def_contatore
                  | def_contenitore
                  | def_supporto
                  | def_direzioni
                  | def_evento

    // --- DEFINIZIONI BASE ---
    def_stanza: ENTITA "è" "una" "stanza" "."
    def_oggetto: ENTITA "è" "una" "cosa" "."
    // [Livello 4 / M1] Contenitore e supporto: oggetti speciali. Si distinguono
    // da def_proprieta (ENTITA "è" PROPRIETA) sul token "un" (PROPRIETA, a
    // priorità bassa, non può essere la keyword "un"): stesso schema di def_contatore.
    def_contenitore: ENTITA "è" "un" "contenitore" "."
    def_supporto: ENTITA "è" "un" "supporto" "."
    // [Livello 4 / M1] Verbo personalizzato. La parola-comando è quotata (come
    // gli alias: vocabolario nuovo, non ancora un token noto), così non collide
    // con ENTITA al primo token di una dichiarazione. Nessun'altra dichiarazione
    // inizia con TESTO_QUOTATO: LALR la distingue subito.
    def_verbo: TESTO_QUOTATO "è" "un" "comando" "."
    def_descrizione: "La" "descrizione" ( "di" | "del" | "della" | "dell'" | "degli" | "delle" ) ENTITA "è" TESTO_QUOTATO "."
    def_posizione: ENTITA "è" PREP_LUOGO ENTITA "."
    // 'è prendibile' è una proprietà speciale gestita nel transformer (vedi
    // def_proprieta): niente regola separata, così la grammatica è 0-ambigua.
    def_proprieta: ENTITA "è" PROPRIETA "."
    // [Livello 3 / M5] Dichiarazione di proprietà opposte (mutuamente esclusive).
    // Inizia con PROPRIETA (priorità bassa): nessun'altra dichiarazione parte con
    // PROPRIETA, quindi LALR distingue questo costrutto al primo token.
    def_opposti: PROPRIETA "e" PROPRIETA "sono" "opposte" "."
    // [Livello 4] Alias/sinonimo di un oggetto: il nome alternativo è una
    // stringa quotata (non un token ENTITA, perché per definizione non è ancora
    // un nome dichiarato). Si distingue dalle altre dichiarazioni che iniziano
    // con ENTITA grazie al keyword "si" (nessun'altra usa ENTITA "si").
    def_alias: ENTITA "si" "chiama" "anche" TESTO_QUOTATO "."
    def_connessione: ENTITA "collega" DIREZIONE "a" ENTITA "."
    def_giocatore: "Il" "giocatore" ( "comincia" | "inizia" | "parte" ) PREP_LUOGO ENTITA "."

    // --- STATO ASTRATTO (Livello 3 / G3) ---
    // 'X è uno stato.' dichiara una variabile globale (uno 'stato'); 'X è valore.'
    // ne imposta il valore iniziale. VARIABILE è un terminale CHIUSO disgiunto da
    // ENTITA: LALR distingue questi costrutti da quelli su oggetti al PRIMO token.
    def_stato: VARIABILE "è" "uno" "stato" "."
    def_stato_valore: VARIABILE "è" PROPRIETA "."
    // Contatori numerici: 'X è un contatore.' (valore iniziale 0). Distinto da
    // def_stato per il lookahead "un" vs "uno".
    def_contatore: VARIABILE "è" "un" "contatore" "."

    // --- TOPOLOGIA: DIREZIONI PERSONALIZZATE (Livello 4 / L1) ---
    // 'Alto e basso sono direzioni opposte.' dichiara una coppia di direzioni
    // (sempre opposte, per garantire l'auto-ritorno). Entrambi gli operandi sono
    // token DIREZIONE (generati per-file dallo scanner). Nessun'altra
    // dichiarazione inizia con DIREZIONE: LALR la distingue al primo token.
    def_direzioni: DIREZIONE "e" DIREZIONE "sono" "direzioni" "opposte" "."

    // --- EVENTI A TURNI (Livello 3) ---
    // 'Al turno N: ...' scatta una sola volta; 'Ogni N turni: ...' a ogni
    // multiplo di N. Riusano la stessa coda di conseguenze delle regole.
    def_evento: "Al" "turno" NUMERO ":" "dire" TESTO_QUOTATO ( "e" "adesso" conseguenza ( "e" "adesso"? conseguenza )* )? "." -> evento_al
              | "Ogni" NUMERO ( "turno" | "turni" ) ":" "dire" TESTO_QUOTATO ( "e" "adesso" conseguenza ( "e" "adesso"? conseguenza )* )? "." -> evento_ogni

    // --- REGOLE (INVECE DI) ---
    // Il bersaglio del verbo può essere un'entità OPPURE una direzione (es. "vai
    // nord"), con un eventuale secondo oggetto. [Livello 5] Il bersaglio è ora
    // OPZIONALE: una regola senza bersaglio è GLOBALE, scatta sul solo verbo (con
    // la sua condizione) — utile per verifiche su stati/contatori non legate a un
    // oggetto (es. "Invece di guarda se il punteggio è almeno 3: ..."). Il
    // bersaglio è incapsulato in 'regola_target' così, quando manca, l'unica
    // stringa nuda residua è la risposta (il transformer non confonde i due str).
    // Dopo VERBO il lookahead distingue nettamente ENTITA/DIREZIONE dal "se" o ":".
    def_regola: "Invece" "di" VERBO regola_target? ( "se" condizione )? ":" "dire" TESTO_QUOTATO ( "e" "adesso" conseguenza ( "e" "adesso"? conseguenza )* )? "."
    regola_target: ( ENTITA | DIREZIONE ) ( PREP_AZIONE ENTITA )?

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
              | cond_variabile
              | cond_variabile_neg
              | cond_contatore_eq
              | cond_contatore_gte
              | cond_contatore_gt
              | cond_contatore_lt
              | "(" cond_or ")"
    cond_possesso: "il" "giocatore" "ha" ENTITA
    cond_possesso_neg: "il" "giocatore" "non" "ha" ENTITA
    cond_proprieta: ENTITA "è" PROPRIETA
    cond_proprieta_neg: ENTITA "non" "è" PROPRIETA
    // 'se [stato] è [valore]' — il terminale VARIABILE distingue dallo stato di
    // un oggetto (cond_proprieta), senza ambiguità.
    cond_variabile: VARIABILE "è" PROPRIETA
    cond_variabile_neg: VARIABILE "non" "è" PROPRIETA
    // Confronti su contatore. Dopo 'VARIABILE è' il lookahead distingue:
    // PROPRIETA (stato) | NUMERO (==) | "almeno"/"più"/"meno" (>=, >, <).
    cond_contatore_eq: VARIABILE "è" NUMERO
    cond_contatore_gte: VARIABILE "è" "almeno" NUMERO
    cond_contatore_gt: VARIABILE "è" "più" "di" NUMERO
    cond_contatore_lt: VARIABILE "è" "meno" "di" NUMERO

    // --- CONSEGUENZE ---
    // La destinazione dello spostamento è un'ENTITA: include i nomi dichiarati e
    // gli pseudo-simboli "inventario"/"nulla" iniettati nella regex.
    ?conseguenza: ENTITA "è" PREP_LUOGO ENTITA -> cons_spostamento
                | ENTITA "è" PROPRIETA          -> cons_proprieta
                | VARIABILE "è" PROPRIETA        -> cons_variabile
                | "aumenta" VARIABILE ( "di" NUMERO )?    -> cons_aumenta
                | "diminuisci" VARIABILE ( "di" NUMERO )? -> cons_diminuisci
                | VARIABILE "diventa" NUMERO     -> cons_contatore_set
                | "vinci"                        -> cons_vinci
                | "perdi"                        -> cons_perdi
                | "termina"                      -> cons_termina

    // --- TERMINALI LESSICALI ---
    PREP_LUOGO: "in" | "nel" | "nella" | "negli" | "nelle" | "nell'" | "sul" | "sulla" | "sullo" | "sui" | "sugli" | "sulle"
    PREP_AZIONE: "su" | "con" | "contro" | "in"
    // [Livello 4 / L1] DIREZIONE è generata per-file: le forme di base
    // (utils.DIREZIONI_BASE) più le direzioni personalizzate dichiarate.
    // È una regex con confine di parola (\b) e priorità ALTA (.2): serve a
    // vincere il longest-match contro le keyword di cui una direzione custom
    // potrebbe condividere il prefisso (es. 'alto' vs 'al' di "Al turno").
    // Sicuro per l'invariante "e"=est vs congiunzione: il lexer contestuale non
    // pone mai DIREZIONE e la congiunzione "e" come candidati nello stesso stato.
    DIREZIONE.2: /(?:__DIREZIONE_ALT__)\b/i

    VERBO: WORD
    WORD: /[a-zA-ZÀ-ÿ0-9']+/

    // NUMERO: intero non negativo. Priorità ALTA: PROPRIETA include le cifre, ma
    // un token tutto-cifre deve risolversi a NUMERO (per i contatori).
    NUMERO.2: /[0-9]+/

    // ENTITA: alternanza CHIUSA dei nomi noti (generata per-file). Vedi
    // costruisci_grammatica(). Il flag /i la rende case-insensitive.
    ENTITA: /__ENTITA__/i

    // VARIABILE: alternanza CHIUSA degli 'stati' dichiarati (Livello 3), anch'essa
    // generata per-file e disgiunta da ENTITA. Vuota -> regex che non matcha mai.
    VARIABILE: /__VARIABILE__/i

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


def _costruisci_regex_nomi(nomi) -> str:
    """Costruisce una regex di alternanza CHIUSA dei nomi dati, ordinata per
    lunghezza decrescente per garantire il LONGEST-MATCH (re usa leftmost-first,
    non longest), con articolo iniziale opzionale e confine di parola finale.
    Se l'insieme è vuoto, restituisce una regex che non matcha mai."""
    nomi = set(nomi)
    if not nomi:
        # Nessun nome: una regex che non matcha MAI ma di larghezza 1 (Lark
        # rifiuta i terminali a larghezza zero come '(?!)'). Qualunque
        # riferimento produrrà un errore di parsing intercettabile.
        return r"[^\s\S]"
    alternanza = "|".join(sorted((_pattern_nome(n) for n in nomi),
                                  key=len, reverse=True))
    art_con_spazio = [a for a in ARTICOLI if not a.endswith("'")]
    art_apostrofo = [a for a in ARTICOLI if a.endswith("'")]
    sp = "|".join(sorted((re.escape(a) for a in art_con_spazio), key=len, reverse=True))
    ap = "|".join(sorted((re.escape(a) for a in art_apostrofo), key=len, reverse=True))
    prefisso_articolo = rf"(?:(?:{sp})\s+|(?:{ap}))?"
    return rf"{prefisso_articolo}(?:{alternanza})\b"


def _costruisci_regex_entita(simboli) -> str:
    """Regex del terminale ENTITA: i nomi dichiarati + gli pseudo-simboli
    speciali (inventario/nulla)."""
    return _costruisci_regex_nomi(set(simboli) | set(SIMBOLI_SPECIALI))


def _costruisci_alt_direzioni(direzioni_extra=()) -> str:
    """[Livello 4 / L1] Costruisce il corpo regex dell'alternanza del terminale
    DIREZIONE: tutte le forme di base (utils.DIREZIONI_BASE) più i nomi delle
    direzioni personalizzate dichiarate, ordinate per lunghezza decrescente per
    garantire il longest-match (es. 'ovest' prima di 'o')."""
    forme = []
    for varianti in DIREZIONI_BASE.values():
        forme.extend(varianti)
    forme.extend(direzioni_extra)
    ordinate = sorted(set(forme), key=len, reverse=True)
    return "|".join(re.escape(f) for f in ordinate)


def costruisci_grammatica(simboli, variabili=(), direzioni=()) -> str:
    """Restituisce la grammatica concreta per questo file, con i terminali
    ENTITA, VARIABILE e DIREZIONE risolti dai simboli noti (Passata 2). VARIABILE
    è la classe degli 'stati' (Livello 3); DIREZIONE include le direzioni
    personalizzate dichiarate (Livello 4)."""
    grammatica = _GRAMMAR_TEMPLATE.replace("__ENTITA__", _costruisci_regex_entita(simboli))
    grammatica = grammatica.replace("__VARIABILE__", _costruisci_regex_nomi(variabili))
    grammatica = grammatica.replace("__DIREZIONE_ALT__", _costruisci_alt_direzioni(direzioni))
    return grammatica


def costruisci_parser(simboli, variabili=(), direzioni=()) -> Lark:
    """Istanzia il parser LALR(1) per i simboli dati. LALR è unambiguo per
    costruzione: un'eventuale ambiguità grammaticale emergerebbe qui come
    GrammarError a build-time, non come scelta silenziosa a runtime."""
    return Lark(costruisci_grammatica(simboli, variabili, direzioni),
                start="start", parser="lalr")


def diagnostica_entita_sconosciuta(testo, errore, simboli) -> str | None:
    """
    [Livello 2.5] Beneficio collaterale dei nomi come token chiusi: quando il
    parsing fallisce perché l'autore riferisce un'entità MAI dichiarata, possiamo
    dare un errore chiaro ("entità sconosciuta 'X'") invece di un parse error
    criptico. Esamina la parola alla posizione d'errore; se assomiglia a un nome
    (non è riservata) ma non è nella symbol-table, propone una diagnosi mirata.
    Restituisce il messaggio, oppure None se l'errore è di altra natura.
    """
    linea = getattr(errore, "line", None)
    colonna = getattr(errore, "column", None)
    if not linea or not colonna:
        return None
    righe = testo.split("\n")
    if linea - 1 >= len(righe):
        return None
    frammento = righe[linea - 1][colonna - 1:]
    # Isola la frase fino alla prossima punteggiatura forte, poi raccogli le
    # parole candidate al nome: salta un eventuale articolo iniziale e fermati al
    # primo keyword strutturale (es. "è", "di", ":").
    testa = re.match(r"[A-Za-zÀ-ÿ0-9' ]+", frammento)
    if not testa:
        return None
    parole = testa.group(0).split()
    if parole and parole[0].lower() in ARTICOLI:
        parole = parole[1:]
    candidate = []
    for p in parole:
        if p.lower() in PAROLE_RISERVATE:
            break
        candidate.append(p)
    if not candidate:
        return None  # qui c'è una keyword fuori posto: messaggio generico
    parola = " ".join(candidate)
    norm = normalizza_nome(parola)
    if not norm or norm in simboli.tutti:
        return None  # entità nota: l'errore è altrove (es. punto mancante)

    suggerimenti = difflib.get_close_matches(norm, sorted(simboli.tutti), n=3, cutoff=0.6)
    msg = f"Entità sconosciuta: «{parola}» non è mai stata dichiarata."
    if suggerimenti:
        msg += f" Forse intendevi: {', '.join(suggerimenti)}?"
    else:
        msg += (f" Dichiarala prima dell'uso, ad es. «{parola} è una cosa.» "
                f"oppure «{parola} è una stanza.».")
    return msg

# ==============================================================================
# 2. IL TRANSFORMER DELL'AST
# ==============================================================================

class RegolaTarget:
    """[Livello 5] Bersaglio di una regola 'Invece di', prodotto dalla sottoregola
    'regola_target'. Incapsula l'oggetto bersaglio (grezzo) e l'eventuale secondo
    oggetto con la sua preposizione. Esiste per distinguere — nel transformer di
    def_regola — il bersaglio (ora opzionale) dalla stringa di risposta: senza
    questo wrapper, con bersaglio assente, le due stringhe sarebbero confondibili."""
    __slots__ = ("bersaglio", "preposizione", "secondario")

    def __init__(self, bersaglio, preposizione=None, secondario=None):
        self.bersaglio = bersaglio
        self.preposizione = preposizione
        self.secondario = secondario

@v_args(inline=True) # Passa i figli dei nodi come argomenti singoli ai metodi
class FavellaTransformer(Transformer):
    """
    Visita l'albero sintattico generato da Lark e popola l'oggetto Mondo.
    """
    def __init__(self, coppie_direzioni=()):
        super().__init__()
        self.mondo = Mondo()
        self.errori = []        # Errori bloccanti: la compilazione fallisce
        self.warnings = []      # Avvisi non bloccanti: la compilazione prosegue
        self.start_dichiarato_raw = None  # Nome grezzo della stanza di partenza
        # [Livello 4 / L1] Le direzioni personalizzate sono raccolte in Passata 1
        # e pre-popolate qui, così l'auto-ritorno delle connessioni non dipende
        # dall'ordine in cui compaiono dichiarazione e 'collega'.
        for dir_a, dir_b in coppie_direzioni:
            self.mondo.dichiara_direzione_opposta(dir_a, dir_b)

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

    def VARIABILE(self, token):
        # Nome di uno 'stato' globale (Livello 3); preserva il grezzo, la
        # normalizzazione a ID avviene nei metodi di regola.
        return token.value

    def NUMERO(self, token):
        # Intero dei contatori (Livello 3).
        return int(token.value)

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

    def _crea_o_trova_oggetto(self, nome_grezzo):
        """Restituisce l'oggetto con quel nome, creandolo se non esiste ancora."""
        id_oggetto = normalizza_nome(nome_grezzo)
        oggetto = self.mondo.trova_oggetto(id_oggetto)
        if not oggetto:
            oggetto = Oggetto(id_oggetto)
            oggetto.nome_visualizzato = nome_grezzo
            self.mondo.aggiungi_oggetto(oggetto)
        return oggetto

    def def_contenitore(self, nome_grezzo):
        # [Livello 4 / M1] 'X è un contenitore.': è un oggetto che può contenere
        # altri oggetti al suo interno (visibili solo se aperto).
        self._crea_o_trova_oggetto(nome_grezzo).is_contenitore = True
        return None

    def def_supporto(self, nome_grezzo):
        # [Livello 4 / M1] 'X è un supporto.': un oggetto su cui se ne posano altri
        # (sempre visibili, senza apertura).
        self._crea_o_trova_oggetto(nome_grezzo).is_supporto = True
        return None

    def def_verbo(self, testo_quotato):
        # [Livello 4 / M1] '"spingi" è un comando.'. La parola-comando deve essere
        # singola (il parser dei comandi a runtime tratta come verbo solo la prima
        # parola digitata): un comando multiparola non sarebbe mai riconosciuto.
        verbo = testo_quotato.strip().lower()
        if not verbo:
            self.warnings.append("Comando vuoto ignorato.")
            return None
        if " " in verbo:
            self.warnings.append(
                f"Comando personalizzato '{verbo}' multiparola ignorato: usa una "
                f"sola parola (il giocatore digita un solo verbo)."
            )
            return None
        self.mondo.dichiara_verbo(verbo)
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
        contenitore = self.mondo.trova_oggetto(id_luogo)

        if not oggetto:
            self.errori.append(f"Oggetto inesistente '{ogg_grezzo}' da posizionare")
        elif stanza:
            oggetto.posizione = id_luogo
            stanza.oggetti[id_ogg] = oggetto
        elif contenitore and (contenitore.is_contenitore or contenitore.is_supporto):
            # [Livello 4 / M1] Collocazione iniziale dentro/su un contenitore o
            # supporto: l'oggetto "vive" nel contenitore, che a sua volta è in una
            # stanza. La visibilità a runtime risolve la catena (vedi 0.8.5).
            oggetto.posizione = id_luogo
            contenitore.contenuto.add(id_ogg)
        elif contenitore:
            self.errori.append(
                f"'{luogo_grezzo}' non è un contenitore né un supporto: non puoi "
                f"collocarci dentro '{ogg_grezzo}'."
            )
        else:
            self.errori.append(f"Stanza inesistente '{luogo_grezzo}' per posizionare '{ogg_grezzo}'")
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

    def def_stato(self, var_grezzo):
        # [Livello 3] Dichiarazione di uno 'stato' globale (valore iniziale None).
        self.mondo.dichiara_variabile(normalizza_nome(var_grezzo))
        return None

    def def_stato_valore(self, var_grezzo, valore_grezzo):
        # [Livello 3] Valore iniziale di uno 'stato' a livello di dichiarazione.
        nome = normalizza_nome(var_grezzo)
        self.mondo.dichiara_variabile(nome)  # idempotente, per sicurezza
        self.mondo.variabili[nome] = normalizza_nome(valore_grezzo)
        return None

    def def_contatore(self, var_grezzo):
        # [Livello 3] Dichiarazione di un contatore numerico (valore iniziale 0).
        self.mondo.dichiara_contatore(normalizza_nome(var_grezzo))
        return None

    def def_direzioni(self, dir_a, dir_b):
        # [Livello 4 / L1] La coppia è già stata raccolta in Passata 1 e applicata
        # al mondo nel costruttore (vedi __init__): qui niente da fare.
        return None

    def def_opposti(self, prop_a_grezzo, prop_b_grezzo):
        # [Livello 3 / M5] Registra una coppia di proprietà mutuamente esclusive.
        # I nomi delle proprietà sono monoparola; li normalizziamo come gli altri
        # aggettivi di stato per coerenza (lowercase).
        prop_a = normalizza_nome(prop_a_grezzo)
        prop_b = normalizza_nome(prop_b_grezzo)
        if prop_a == prop_b:
            self.warnings.append(
                f"Proprietà dichiarata opposta a se stessa: '{prop_a}'. Ignorata."
            )
            return None
        self.mondo.dichiara_opposte(prop_a, prop_b)
        return None

    def def_alias(self, ent_grezzo, alias_testo):
        # [Livello 4] 'La torcia si chiama anche "lanterna".'. Il primo token è
        # un'ENTITA dichiarata (l'oggetto canonico); il secondo è la stringa
        # quotata con il nome alternativo. Normalizziamo entrambi come ID. La
        # verifica che il bersaglio sia un oggetto esistente è in valida_post
        # (l'alias può comparire prima della dichiarazione dell'oggetto).
        id_canonico = normalizza_nome(ent_grezzo)
        alias = normalizza_nome(alias_testo)
        if not alias:
            self.warnings.append("Alias vuoto ignorato.")
            return None
        if alias == id_canonico:
            self.warnings.append(
                f"Alias '{alias}' uguale al nome dell'oggetto: ignorato."
            )
            return None
        self.mondo.dichiara_alias(alias, id_canonico)
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

        # [Livello 4 / L1] Direzioni data-driven: canonicalizzazione e auto-ritorno
        # consultano le mappe del mondo (base + personalizzate), non più dict cablati.
        direzione_norm = self.mondo.direzione_canonica(direzione) or direzione
        stanza1.uscite[direzione_norm] = id_sta2

        # Connessione automatica di ritorno, se la direzione ha un'opposta nota.
        direzione_opposta = self.mondo.opposta_di(direzione_norm)
        if direzione_opposta:
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

    def cond_variabile(self, var_grezzo, valore_grezzo):
        return CondizioneVariabile(normalizza_nome(var_grezzo), normalizza_nome(valore_grezzo))

    def cond_variabile_neg(self, var_grezzo, valore_grezzo):
        return CondizioneNot(CondizioneVariabile(normalizza_nome(var_grezzo), normalizza_nome(valore_grezzo)))

    def cond_contatore_eq(self, var_grezzo, numero):
        return CondizioneContatore(normalizza_nome(var_grezzo), "==", numero)

    def cond_contatore_gte(self, var_grezzo, numero):
        return CondizioneContatore(normalizza_nome(var_grezzo), ">=", numero)

    def cond_contatore_gt(self, var_grezzo, numero):
        return CondizioneContatore(normalizza_nome(var_grezzo), ">", numero)

    def cond_contatore_lt(self, var_grezzo, numero):
        return CondizioneContatore(normalizza_nome(var_grezzo), "<", numero)

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

    def cons_variabile(self, var_grezzo, valore_grezzo):
        return ConseguenzaVariabile(normalizza_nome(var_grezzo), normalizza_nome(valore_grezzo))

    def cons_aumenta(self, var_grezzo, *resto):
        # resto: (NUMERO,) se è presente 'di N', altrimenti vuoto (delta = 1).
        valore = resto[0] if resto else 1
        return ConseguenzaContatore(normalizza_nome(var_grezzo), "aumenta", valore)

    def cons_diminuisci(self, var_grezzo, *resto):
        valore = resto[0] if resto else 1
        return ConseguenzaContatore(normalizza_nome(var_grezzo), "diminuisci", valore)

    def cons_contatore_set(self, var_grezzo, numero):
        return ConseguenzaContatore(normalizza_nome(var_grezzo), "diventa", numero)

    # Conseguenze di fine partita: nessun figlio (keyword nuda dopo 'e adesso').
    def cons_vinci(self):
        return ConseguenzaFinePartita("vinta")

    def cons_perdi(self):
        return ConseguenzaFinePartita("persa")

    def cons_termina(self):
        return ConseguenzaFinePartita("terminata")

    # --- Eventi a turni (Livello 3) ---

    def _valida_conseguenze(self, conseguenze):
        """Validazione a compile-time condivisa da regole ed eventi: l'oggetto di
        una conseguenza (se presente) e la destinazione di uno spostamento devono
        esistere."""
        for c in conseguenze:
            id_cons = getattr(c, "id_oggetto", None)
            if id_cons is not None and not self.mondo.trova_oggetto(id_cons):
                self.errori.append(f"Oggetto inesistente nella conseguenza: '{id_cons}'")
            if isinstance(c, ConseguenzaSpostamento) and c.destinazione not in ["nulla", "inventario"]:
                # [Livello 4 / M1] La destinazione può essere una stanza OPPURE un
                # contenitore/supporto (vi si sposta l'oggetto dentro/sopra).
                dest = self.mondo.trova_stanza(c.destinazione)
                dest_ogg = self.mondo.trova_oggetto(c.destinazione)
                if not dest and not (dest_ogg and (dest_ogg.is_contenitore or dest_ogg.is_supporto)):
                    self.errori.append(f"Luogo inesistente nella conseguenza: '{c.destinazione}'")

    def _crea_evento(self, tipo, args):
        # args: (NUMERO, TESTO_QUOTATO, conseguenza*)
        numero = args[0]
        risposta = args[1]
        conseguenze = [a for a in args[2:] if isinstance(a, Conseguenza)]
        if numero < 1:
            self.warnings.append(
                f"Evento '{tipo} ... {numero}': il numero di turni deve essere "
                f"almeno 1; evento ignorato."
            )
            return None
        self._valida_conseguenze(conseguenze)
        self.mondo.aggiungi_evento(Evento(tipo, numero, risposta, conseguenze))
        return None

    def evento_al(self, *args):
        return self._crea_evento("al", args)

    def evento_ogni(self, *args):
        return self._crea_evento("ogni", args)

    # --- La Regola Complessa ---

    def regola_target(self, bersaglio, *resto):
        # [Livello 5] Bersaglio della regola: (ENTITA|DIREZIONE) [PREP_AZIONE ENTITA].
        # 'resto' contiene 0 o 2 elementi (preposizione + secondo oggetto).
        prep = resto[0] if len(resto) >= 2 else None
        secondario = resto[1] if len(resto) >= 2 else None
        return RegolaTarget(bersaglio, prep, secondario)

    def def_regola(self, *args):
        # args (ordine): verbo, [RegolaTarget], [condizione], risposta, [conseguenza...]
        # [Livello 5] il bersaglio è opzionale (incapsulato in RegolaTarget): se
        # assente, la regola è GLOBALE (scatta sul solo verbo). [v0.6.0] la
        # condizione può essere composita e le conseguenze possono essere più di una.
        args_puliti = [a for a in args if a is not None]

        verbo = args_puliti[0]

        # Estrai i componenti per tipo (l'ordine grammaticale è garantito).
        target = None
        condizione = None
        risposta = ""
        conseguenze = []
        for a in args_puliti[1:]:
            if isinstance(a, RegolaTarget):
                target = a
            elif isinstance(a, Condizione):
                condizione = a
            elif isinstance(a, Conseguenza):
                conseguenze.append(a)
            elif isinstance(a, str):
                risposta = a   # unica stringa nuda residua: la risposta

        # --- Regola GLOBALE (senza bersaglio) ---
        if target is None:
            self._valida_conseguenze(conseguenze)
            self.mondo.aggiungi_regola(Regola(
                verbo=verbo,
                id_oggetto_bersaglio=None,
                risposta=risposta,
                condizione=condizione,
                conseguenze=conseguenze,
            ))
            return None

        # --- Regola con bersaglio (comportamento storico) ---
        ogg1_grezzo = target.bersaglio
        ogg2_grezzo = target.secondario
        prep_azione = target.preposizione

        id_ogg1 = normalizza_nome(ogg1_grezzo)
        id_ogg2 = normalizza_nome(ogg2_grezzo) if ogg2_grezzo else None

        # [Livello 4 / L1] Se il bersaglio è una direzione (anche abbreviata o
        # personalizzata), canonicalizzalo: così 'Invece di vai n' e 'vai nord'
        # sono la stessa regola e combaciano con il movimento a runtime.
        if id_ogg1 in self.mondo.direzioni:
            id_ogg1 = self.mondo.direzioni[id_ogg1]

        # Verifica entità principali della regola
        if self.mondo.trova_oggetto(id_ogg1) or id_ogg1 in self.mondo.opposte_direzioni:
            if id_ogg2 and not self.mondo.trova_oggetto(id_ogg2):
                self.errori.append(f"Regola per secondo oggetto inesistente: '{ogg2_grezzo}'")
            else:
                # Valida ogni conseguenza a compile-time (logica condivisa con
                # gli eventi). Non tutte agiscono su un oggetto (es. fine partita).
                self._valida_conseguenze(conseguenze)

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

        # 1bis. [Livello 4] Ogni alias deve puntare a un OGGETTO esistente,
        #    altrimenti è morto (il giocatore non potrà mai risolverlo). Un alias
        #    che coincide con l'id di un'entità esistente è ambiguo e va segnalato.
        for alias, id_canonico in m.alias.items():
            if not m.trova_oggetto(id_canonico):
                self.warnings.append(
                    f"Alias '{alias}' per oggetto inesistente '{id_canonico}': "
                    f"il sinonimo non risolverà mai nulla."
                )
            if m.trova_oggetto(alias) or m.trova_stanza(alias):
                self.warnings.append(
                    f"L'alias '{alias}' coincide con il nome di un'entità "
                    f"esistente: il nome proprio ha la precedenza."
                )

        # 2. [GG3] Il verbo di ogni regola deve appartenere al vocabolario noto,
        #    altrimenti la regola è "morta" (non si attiverà mai a runtime).
        for regola in m.regole:
            if regola.verbo not in VERBI_VALIDI and regola.verbo not in m.verbi_personalizzati:
                self.warnings.append(
                    f"Verbo '{regola.verbo}' non riconosciuto in una regola "
                    f"'Invece di': la regola non si attiverà mai. Usa un verbo noto "
                    f"al motore (es. usa, apri, prendi, esamina, mangia, sposta, vai) "
                    f"oppure dichiaralo con '\"{regola.verbo}\" è un comando.'."
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

        # 4. [Livello 5] Segnaposto di testo dinamico [nome] che non risolvono
        #    nulla. L'interpolazione (utils.rendi_testo) sostituisce [nome] con uno
        #    stato/contatore o col nome di un oggetto; un segnaposto che non
        #    corrisponde a nessuno dei due resterà letterale a runtime: quasi
        #    sempre un refuso. Lo segnaliamo qui, non bloccante. I nomi noti sono
        #    gli 'stati'/contatori (m.variabili) e gli oggetti (m.oggetti); le
        #    stanze NON sono interpolabili (non hanno un valore testuale da rendere).
        nomi_interpolabili = set(m.variabili.keys()) | set(m.oggetti.keys())
        testi_autore = [s.descrizione for s in m.stanze.values()]
        testi_autore += [o.descrizione for o in m.oggetti.values()]
        testi_autore += [r.risposta for r in m.regole]
        testi_autore += [e.risposta for e in m.eventi]
        segnaposto_sconosciuti = set()
        for testo in testi_autore:
            for ph in estrai_placeholder(testo):
                if normalizza_nome(ph) not in nomi_interpolabili:
                    segnaposto_sconosciuti.add(ph)
        for ph in sorted(segnaposto_sconosciuti):
            self.warnings.append(
                f"Segnaposto '[{ph}]' non corrisponde ad alcuno stato, contatore "
                f"od oggetto: resterà invariato nel testo (possibile refuso)."
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

def valida_direzioni_dichiarate(coppie, simboli):
    """
    [Livello 4 / L1] Valida le coppie di direzioni personalizzate raccolte in
    Passata 1. Il nome di una direzione NON può coincidere con una parola
    riservata né con un nome di entità/variabile: sarebbe un'ambiguità lessicale
    (il terminale DIREZIONE, a priorità alta, oscurerebbe l'altro uso). Un tale
    conflitto è un ERRORE bloccante. I nomi già di base sono accettati
    silenziosamente (no-op). Restituisce (coppie_ok, nomi_extra, errori).
    """
    base_forme = {f for forme in DIREZIONI_BASE.values() for f in forme}
    base_forme |= set(DIREZIONI_BASE.keys())
    coppie_ok = []
    nomi_extra = set()
    errori = []
    for dir_a, dir_b in coppie:
        problemi = []
        for d in (dir_a, dir_b):
            if d in base_forme:
                continue  # già una direzione di base: ok
            if d in PAROLE_RISERVATE or d in simboli.tutti or d in simboli.variabili:
                problemi.append(d)
        if problemi:
            errori.append(
                f"Direzione personalizzata in conflitto con una parola riservata "
                f"o un nome esistente: «{', '.join(problemi)}». Scegli un nome "
                f"diverso per la direzione."
            )
            continue
        coppie_ok.append((dir_a, dir_b))
        nomi_extra |= ({dir_a, dir_b} - base_forme)
    return coppie_ok, nomi_extra, errori


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
        # [Livello 4 / L1] Direzioni personalizzate: valida le coppie raccolte e
        # ricava i nomi da iniettare nel terminale DIREZIONE. Un conflitto con una
        # parola riservata o un'entità è un errore bloccante: lo segnaliamo qui,
        # con un messaggio chiaro, prima ancora di costruire il parser.
        coppie_dir, nomi_dir, dir_errori = valida_direzioni_dichiarate(
            simboli.coppie_direzioni, simboli)
        if dir_errori:
            print("\n[FAVELLA 1] Errore nelle direzioni personalizzate:")
            for err in dir_errori:
                print(f" - {err}")
            return None

        # 2. PASSATA 2 — Parsing formale LALR(1) con ENTITA, VARIABILE e DIREZIONE chiusi.
        parser = costruisci_parser(simboli.tutti, simboli.variabili, nomi_dir)
        tree = parser.parse(testo)

        # 3. TRASFORMAZIONE (AST -> Oggetti Python)
        transformer = FavellaTransformer(coppie_dir)
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
        # [Livello 2.5] Prima del messaggio generico, prova la diagnosi mirata:
        # spesso l'errore è semplicemente un'entità mai dichiarata.
        diagnosi = diagnostica_entita_sconosciuta(testo, e, simboli)
        if diagnosi:
            print("\n[FAVELLA 1] Errore: entità non dichiarata")
            print(f"Riga {e.line}, Colonna {e.column}")
            print(f" - {diagnosi}")
            return None

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