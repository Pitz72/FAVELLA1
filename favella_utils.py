# favella_utils.py
# Modulo per le funzioni di utilità di FAVELLA 1

import re
import sys
import unicodedata


def assicura_console_utf8():
    """Riconfigura stdout/stderr a UTF-8 con errors='replace' quando il flusso
    lo permette. Senza questo, un carattere fuori da Windows-1252 in un testo
    della storia (es. '★', '─', frecce, emoji) fa terminare il gioco con un
    UnicodeEncodeError sulla console Windows (cp1252): la logica è corretta, a
    cadere è solo la stampa. errors='replace' degrada il carattere invece di
    far crashare la partita. No-op su flussi non riconfigurabili o assenti.
    Idempotente: chiamarla più volte non fa danni. Fonte unica condivisa da
    favella.py (CLI) e gioco.py (avvio del ciclo interattivo)."""
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass

# Articoli italiani riconosciuti come prefisso opzionale dei nomi-entità.
# Fonte unica: usata sia da normalizza_nome (rimozione) sia dalla grammatica
# della Passata 2 (prefisso opzionale del terminale ENTITA).
ARTICOLI = ["l'", "un'", "uno", "una", "il", "lo", "la", "i", "gli", "le", "un"]


def prima_maiuscola(s: str) -> str:
    """[0.27.0 / M4] Maiuscola SOLO sull'iniziale, preservando il resto. A
    differenza di str.capitalize() (che minuscola tutto il resto), non rovina le
    maiuscole interne dei nomi propri: 'La Guardia Reale' resta tale, non diventa
    'La guardia reale'. Usata per intestazioni di stanza, nomi NPC e annunci."""
    if not s:
        return s
    return s[:1].upper() + s[1:]

# [Livello 4 / L1] DIREZIONI DI BASE — fonte UNICA condivisa da compilatore e
# runtime (prima erano cablate in 4 punti). Mappa: direzione canonica -> forme
# accettate in input (la prima è la canonica, la seconda l'abbreviazione storica).
# Nota quirk noto (G4): l'abbreviazione "e" di est coincide con la congiunzione
# "e"; il lexer contestuale le distingue per posizione.
DIREZIONI_BASE = {
    "nord": ("nord", "n"),
    "sud": ("sud", "s"),
    "est": ("est", "e"),
    "ovest": ("ovest", "o"),
    # [1.3.0 / G-4] Su e giù e le direzioni intermedie. Niente abbreviazioni
    # ('ne', 'no', 'se', 'so'): 'se' e 'no' sono parole del linguaggio e del
    # giocatore. 'su' non si poteva nemmeno dichiarare (parola riservata).
    "su": ("su",),
    "giù": ("giù", "giu"),
    "nordest": ("nordest", "nord-est"),
    "nordovest": ("nordovest", "nord-ovest"),
    "sudest": ("sudest", "sud-est"),
    "sudovest": ("sudovest", "sud-ovest"),
}

# Coppie di direzioni opposte di base (per l'auto-ritorno delle connessioni).
DIREZIONI_OPPOSTE_BASE = {
    "nord": "sud", "sud": "nord",
    "est": "ovest", "ovest": "est",
    "su": "giù", "giù": "su",
    "nordest": "sudovest", "sudovest": "nordest",
    "nordovest": "sudest", "sudest": "nordovest",
}


# [Livello 5] INTERPOLAZIONE DI TESTO DINAMICO — segnaposto [nome] nelle stringhe
# d'autore. Vengono sostituiti a render-time (al momento della stampa) con il
# valore corrente di uno 'stato'/contatore oppure con il nome di un oggetto.
# Vivono DENTRO le virgolette: sono del tutto invisibili alla grammatica LALR,
# quindi non introducono alcun rischio di ambiguità. È il fondamento su cui si
# appoggiano le descrizioni condizionali e la concordanza (Livello 5).
_RE_PLACEHOLDER = re.compile(r"\[([^\[\]]+)\]")


def estrai_placeholder(testo: str) -> list:
    """Restituisce i nomi-segnaposto grezzi presenti in una stringa (il contenuto
    tra parentesi quadre, ripulito dagli spazi ai lati). Usata dal compilatore
    per segnalare a compile-time i segnaposto che non risolveranno nulla."""
    if not testo:
        return []
    return [m.group(1).strip() for m in _RE_PLACEHOLDER.finditer(testo)]


def rendi_testo(mondo, testo: str) -> str:
    """
    [Livello 5] Sostituisce i segnaposto [nome] nel testo con il loro valore
    corrente. Ordine di risoluzione:
      1. uno 'stato'/contatore dichiarato (mondo.variabili): il valore corrente
         (la parola-stato, o il numero del contatore; uno stato non ancora
         impostato vale None -> stringa vuota);
      2. un oggetto dichiarato: il suo nome visualizzato.
    Un segnaposto non risolvibile è lasciato INVARIATO (letterale [nome]), così
    il testo resta leggibile e il refuso è visibile (oltre al warning a
    compile-time). Duck-typed sul mondo: non importa strutture (evita cicli).
    """
    if not testo or "[" not in testo:
        return testo

    def _sostituisci(match):
        grezzo = match.group(1).strip()
        norm = normalizza_nome(grezzo)
        # [1.3.0 / M-4] Maiuscola se l'autore ha scritto il segnaposto con la
        # maiuscola ('[Mela]') o se apre la frase; altrimenti il nome va a metà
        # frase: «c'è la mela rossa», non più «c'è La mela rossa».
        maiuscolo = grezzo[:1].isupper()
        a_inizio = maiuscolo or _apre_la_frase(testo, match.start())
        variabili = getattr(mondo, "variabili", {})
        if norm in variabili:
            valore = variabili[norm]
            valore = "" if valore is None else str(valore)
            return prima_maiuscola(valore) if maiuscolo else valore
        trova = getattr(mondo, "trova_oggetto", None)
        ogg = trova(norm) if trova else None
        if ogg is not None:
            nome = nome_in_frase(ogg.nome_visualizzato)
            return prima_maiuscola(nome) if a_inizio else nome
        return match.group(0)  # sconosciuto: resta il letterale [nome]

    return _RE_PLACEHOLDER.sub(_sostituisci, testo)


def _apre_la_frase(testo: str, posizione: int) -> bool:
    """[1.3.0] Il segnaposto in `posizione` apre una frase: prima c'è solo
    spazio, oppure la fine di una frase (. ! ?) o un a capo, anche seguiti
    da virgolette o trattino di dialogo."""
    prima = testo[:posizione].rstrip(" \t«\"'“—-")
    return not prima or prima[-1] in ".!?\n"


# [Livello 5] CONCORDANZA GRAMMATICALE ITALIANA (genere/numero) — minima.
# L'autore scrive già l'articolo nel nome ("La torcia", "Il tavolo"): da lì
# inferiamo genere e numero, senza nuova sintassi, e generiamo articoli corretti
# negli elenchi di output ("Puoi vedere qui: una torcia, un tavolo, delle chiavi").
# Tabella articolo iniziale -> (genere, numero). 'l'' è ambiguo nel genere
# (l'albero m / l'ape f): genere None, numero singolare.
_ARTICOLO_GN = {
    "il": ("m", "s"), "lo": ("m", "s"), "un": ("m", "s"), "uno": ("m", "s"),
    "la": ("f", "s"), "una": ("f", "s"), "un'": ("f", "s"),
    "i": ("m", "p"), "gli": ("m", "p"),
    "le": ("f", "p"),
    "l'": (None, "s"),
}

# Iniziali che richiedono 'uno'/'gli' (s impura, z, gn, pn, ps, x, y, i+vocale).
_RE_S_IMPURA = re.compile(r"^(?:s[^aeiouàèéìòù]|z|gn|pn|ps|x|y|i[aeiouàèéìòù])", re.IGNORECASE)
_VOCALI = "aeiouàèéìòùAEIOUÀÈÉÌÒÙ"


def _scomponi_articolo(nome_visualizzato: str):
    """Separa l'eventuale articolo iniziale dal resto del nome. Restituisce
    (articolo_lower | None, nucleo). Gli articoli apostrofati ('l'', 'un'') sono
    attaccati al nome; gli altri sono seguiti da uno spazio."""
    nome = (nome_visualizzato or "").strip()
    basso = nome.lower()
    for art in ("l'", "un'"):
        if basso.startswith(art):
            return art, nome[len(art):].strip()
    for art in ("uno", "una", "gli", "il", "lo", "la", "le", "un", "i"):
        if basso.startswith(art + " "):
            return art, nome[len(art) + 1:].strip()
    return None, nome


def genere_numero(nome_visualizzato: str):
    """[Livello 5] Inferisce (genere, numero) dal nome visualizzato leggendo
    l'articolo che l'autore ha scritto. genere ∈ {'m','f',None}; numero ∈
    {'s','p',None}. Senza articolo riconoscibile: (None, None)."""
    art, _ = _scomponi_articolo(nome_visualizzato)
    if art is None:
        return (None, None)
    return _ARTICOLO_GN.get(art, (None, None))


def chiave_genere_numero(nome_visualizzato: str):
    """[0.20.0 / A1] Restituisce la chiave 'm_sing'/'f_sing'/'m_plur'/'f_plur'
    dedotta dall'articolo del nome, o None se genere o numero non sono inferibili
    (nome senza articolo, o 'l'…' ambiguo). Serve a indicizzare l'ultimo oggetto
    riferito per la risoluzione dei pronomi anaforici ('prendila', 'aprilo')."""
    g, n = genere_numero(nome_visualizzato)
    if g in ("m", "f") and n in ("s", "p"):
        return f"{g}_{'sing' if n == 's' else 'plur'}"
    return None


def frase_indeterminativa(nome_visualizzato: str) -> str:
    """[Livello 5] Restituisce il nome introdotto dall'articolo INDETERMINATIVO
    concordato ('una torcia', 'un tavolo', 'uno specchio', 'un'ascia') o, al
    plurale, dal partitivo ('dei tavoli', 'delle chiavi', 'degli specchi').
    Se il nome non porta un articolo riconoscibile (genere ignoto), lo si lascia
    invariato: meglio nessun articolo che uno sbagliato."""
    genere, numero = genere_numero(nome_visualizzato)
    art, nucleo = _scomponi_articolo(nome_visualizzato)
    if art is None or not nucleo:
        return nome_visualizzato  # nessuna info affidabile: non inventare articoli

    inizia_vocale = nucleo[0] in _VOCALI
    s_impura = bool(_RE_S_IMPURA.match(nucleo))

    if numero == "p":
        if genere == "f":
            return f"delle {nucleo}"
        # maschile (o ignoto trattato come maschile): 'degli' davanti a vocale/s impura
        return f"{'degli' if (inizia_vocale or s_impura) else 'dei'} {nucleo}"

    # singolare (o numero ignoto)
    if genere == "f":
        return f"un'{nucleo}" if inizia_vocale else f"una {nucleo}"
    # maschile, oppure genere ignoto ("l'..."): 'uno' davanti a s impura, 'un' altrove
    return f"uno {nucleo}" if s_impura else f"un {nucleo}"


# [1.3.0 / M-4] L'ITALIANO DEI MESSAGGI DEL MOTORE
# Il nome visualizzato conserva l'articolo come l'autore l'ha scritto, cioè
# quasi sempre maiuscolo (ogni dichiarazione apre una frase: «La mela è una
# cosa.»). A metà frase il motore stampava quindi «Preso: La mela.», «Hai messo
# La chiave in Lo zaino.». Queste funzioni rendono l'articolo minuscolo a metà
# frase, contraggono le preposizioni (nello, sul, dall'…) e accordano aggettivi
# e pronomi con genere e numero del nome.

def nome_in_frase(nome_visualizzato: str) -> str:
    """Il nome come va scritto a metà frase: articolo iniziale in minuscolo,
    il resto intatto ('La Guardia Reale' -> 'la Guardia Reale'). Un nome senza
    articolo (un nome proprio: 'Anna') resta com'è."""
    art, nucleo = _scomponi_articolo(nome_visualizzato)
    if art is None:
        return nome_visualizzato
    if art.endswith("'"):
        return f"{art}{nucleo}"
    return f"{art} {nucleo}"


_PREPOSIZIONI_ARTICOLATE = {
    # preposizione -> {articolo: forma contratta}
    "di": {"il": "del", "lo": "dello", "la": "della", "l'": "dell'", "i": "dei", "gli": "degli", "le": "delle"},
    "a": {"il": "al", "lo": "allo", "la": "alla", "l'": "all'", "i": "ai", "gli": "agli", "le": "alle"},
    "da": {"il": "dal", "lo": "dallo", "la": "dalla", "l'": "dall'", "i": "dai", "gli": "dagli", "le": "dalle"},
    "in": {"il": "nel", "lo": "nello", "la": "nella", "l'": "nell'", "i": "nei", "gli": "negli", "le": "nelle"},
    "su": {"il": "sul", "lo": "sullo", "la": "sulla", "l'": "sull'", "i": "sui", "gli": "sugli", "le": "sulle"},
}


def con_preposizione(prep: str, nome_visualizzato: str) -> str:
    """'in' + 'Lo zaino' -> 'nello zaino'; 'su' + "L'altare" -> "sull'altare";
    con un articolo indeterminativo o senza articolo la preposizione resta
    staccata ('in una scatola', 'a Anna')."""
    art, nucleo = _scomponi_articolo(nome_visualizzato)
    forma = _PREPOSIZIONI_ARTICOLATE.get(prep, {}).get(art) if art else None
    if forma is None:
        return f"{prep} {nome_in_frase(nome_visualizzato)}"
    return f"{forma}{nucleo}" if forma.endswith("'") else f"{forma} {nucleo}"


def accorda(nome_visualizzato: str, aggettivo: str) -> str:
    """Accorda un aggettivo in -o col nome: 'chiuso' -> 'chiusa', 'chiusi',
    'chiuse'. Genere o numero ignoti: resta maschile singolare."""
    genere, numero = genere_numero(nome_visualizzato)
    if not aggettivo.endswith("o"):
        return aggettivo
    radice = aggettivo[:-1]
    if numero == "p":
        return radice + ("e" if genere == "f" else "i")
    return radice + ("a" if genere == "f" else "o")


def pronome_oggetto(nome_visualizzato: str) -> str:
    """Il clitico oggetto del nome: lo, la, li, le ('prenderla')."""
    genere, numero = genere_numero(nome_visualizzato)
    if numero == "p":
        return "le" if genere == "f" else "li"
    return "la" if genere == "f" else "lo"


# Aggettivi-proprietà invarianti o irregolari che NON vanno troncati sulla
# desinenza finale: lo si farebbe accorpare a parole diverse con la stessa radice
# (colori invariabili e simili). Lista volutamente piccola ed estendibile.
_PROPRIETA_INVARIANTI = {
    "blu", "rosa", "viola", "lilla", "beige", "ciano", "amaranto", "pari", "dispari",
}


def radice_proprieta(prop: str) -> str:
    """[Concordanza di genere/numero] Riduce una proprietà-aggettivo italiana a una
    RADICE neutra rispetto a genere e numero, togliendo la desinenza regolare finale
    -o/-a/-i/-e ('aperto'/'aperta'/'aperti'/'aperte' → 'apert'; 'chiuso'/'chiusa' →
    'chius'; 'spento'/'spenta' → 'spent'). Serve a far sì che il confronto fra
    proprietà di stato IGNORI la concordanza, com'è naturale in un linguaggio
    d'autore italiano: «il portale è aperto» e «la porta è aperta» devono valere
    uguale. Le parole nella lista delle invarianti, o troppo corte perché resti una
    radice di almeno 3 lettere, sono lasciate intatte (per non accorpare termini
    distinti). Il confronto è sempre fra radici, quindi i refusi veri (che cambiano
    la radice, es. 'chuisa'→'chuis') restano distinti e il linter li intercetta."""
    p = (prop or "").strip().lower()
    if p in _PROPRIETA_INVARIANTI:
        return p
    if len(p) >= 4 and p[-1] in "oaie":
        return p[:-1]
    return p


def normalizza_tipografia(testo: str) -> str:
    """
    Normalizza apostrofi e virgolette "curve" (tipici di copia-incolla da
    editor di testo) nelle versioni dritte attese dalla grammatica [L2].
    [0.18.0 / A3] Normalizza anche la COMPOSIZIONE Unicode in forma NFC, così un
    accento digitato/incollato in forma decomposta (es. 'o'+◌̀) diventa il
    carattere precomposto atteso ('ò'): i nomi-entità accentati ('comò') si
    risolvono in modo affidabile, perché TUTTA la pipeline (symbol-table, regex
    ENTITA, parsing) vede la stessa forma. Idempotente.
    """
    testo = unicodedata.normalize("NFC", testo)
    return (testo
            .replace('’', "'").replace('‘', "'")
            .replace('“', '"').replace('”', '"'))


def normalizza_nome(nome: str) -> str:
    """
    Prende una stringa grezza (es. "La Mela Rossa") e la normalizza in un ID
    univoco (es. "mela rossa").

    Esegue i seguenti passaggi:
    1. Converte tutto in minuscolo.
    2. Rimuove gli articoli determinativi e indeterminativi italiani all'inizio.
    3. Rimuove spazi bianchi extra.

    Args:
        nome: La stringa da normalizzare.

    Returns:
        L'ID normalizzato della stringa.
    """
    # 1. Converti in minuscolo. [0.18.0 / A3] Prima normalizza la composizione
    #    Unicode in NFC, così l'id è indipendente dalla forma (precomposta o
    #    decomposta) con cui gli accenti arrivano dal sorgente o dall'input del
    #    giocatore a runtime: 'comò' digitato come 'o'+◌̀ risolve l'oggetto 'comò'.
    nome_processato = unicodedata.normalize("NFC", nome).lower()

    # 2. Rimuovi l'articolo iniziale. Gli articoli con apostrofo ("l'", "un'")
    #    sono attaccati al nome; gli altri richiedono lo spazio separatore.
    #    L'ordine di ARTICOLI gestisce "l'"/"un'" prima di "il"/"un".
    for articolo in ARTICOLI:
        prefisso = articolo if articolo.endswith("'") else articolo + " "
        if nome_processato.startswith(prefisso):
            nome_processato = nome_processato[len(prefisso):]
            break  # Trovato e rimosso l'articolo, esci dal ciclo

    # 3. Rimuovi spazi bianchi extra ai lati
    nome_processato = nome_processato.strip()

    return nome_processato

# --- Sezione di Test ---
# Puoi eseguire questo file direttamente per testare la funzione
if __name__ == '__main__':
    nomi_test = [
        "La cucina",
        "cucina",
        "Il salotto",
        "uno gnomo",
        "Un'anatra",
        "L'albero maestro",
        "  spada arrugginita  "
    ]

    print("--- Test della funzione normalizza_nome ---")
    for nome in nomi_test:
        print(f"'{nome}' -> '{normalizza_nome(nome)}'")
