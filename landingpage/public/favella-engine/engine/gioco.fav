# gioco.py
# Interprete Interattivo per FAVELLA 1 (v1.3.0)

import contextlib
import copy
import io
import json
import os
import re
import sys
import traceback
from compilatore import analizza_file
from strutture import Mondo
from favella_utils import (normalizza_nome, rendi_testo, frase_indeterminativa, prima_maiuscola,
                           assicura_console_utf8, nome_in_frase, con_preposizione,
                           radice_proprieta, messaggio)
from libreria_azioni import LIBRERIA_AZIONI, muovi_logica_default # Importa anche muovi_logica_default

def mostra_stanza(mondo: Mondo):
    """Stampa la descrizione completa della stanza corrente del giocatore."""
    stanza_corrente = mondo.trova_stanza(mondo.posizione_giocatore)
    if not stanza_corrente:
        print("[ERRORE INTERNO] La posizione del giocatore non corrisponde a nessuna stanza!")
        return

    print(f"\n--- {prima_maiuscola(stanza_corrente.nome_visualizzato)} ---")

    # [0.24.0 / A4] Stanza al buio senza fonte di luce accesa raggiungibile: non si
    # vede nulla (né descrizione, né oggetti, né uscite). Le uscite restano
    # comunque percorribili: il giocatore può muoversi alla cieca.
    if not mondo.c_e_luce():
        print(messaggio(mondo, "buio pesto", "È buio pesto."))
        return

    print(rendi_testo(mondo, stanza_corrente.descrizione_attuale(mondo)))

    # [1.1.0] Gli oggetti ancora al loro posto iniziale si presentano con la frase
    # d'autore e restano fuori dall'elenco generico. Le frasi sono raccolte in UN
    # capoverso sotto la descrizione, nell'ordine di collocazione degli oggetti:
    # l'autore le scrive autonome («Sul sedile, un DIARIO…»), così ciascuna regge
    # anche quando le altre sono sparite.
    posti = [rendi_testo(mondo, o.posto) for o in stanza_corrente.oggetti.values() if o.al_suo_posto()]
    if posti:
        print(" ".join(posti))

    # [1.3.0 / M-8] Gli oggetti DI SCENA non si elencano (si esaminano); quelli
    # presenti anche in altre stanze ('Il cielo è anche nel cortile.') sì.
    in_vista = list(stanza_corrente.oggetti.values()) + mondo.oggetti_anche_qui()
    oggetti_nella_stanza = [o for o in in_vista if not o.al_suo_posto() and not o.di_scena]
    if oggetti_nella_stanza:
        # [Livello 5] Articolo indeterminativo concordato (genere/numero inferiti
        # dal nome dichiarato): "Puoi vedere qui: una torcia, un tavolo.".
        nomi_oggetti = [frase_indeterminativa(ogg.nome_visualizzato) for ogg in oggetti_nella_stanza]
        print(f"Puoi vedere qui: {', '.join(nomi_oggetti)}.")

    # [1.3.0 / M-5] Si vede anche ciò che sta su un supporto o in un contenitore
    # aperto: «Sul tavolo: una mela.». Prima la mela appoggiata si scopriva solo
    # esaminando il tavolo.
    nominati = []
    for ogg in list(stanza_corrente.oggetti.values()):
        _elenca_appoggiati(mondo, ogg, nominati, set())

    # [0.20.0 / A1] Gli oggetti elencati sono ora «nominati»: diventano riferibili
    # dai pronomi ('entri… → prendila').
    mondo.registra_riferiti_da_stanza()
    for id_ogg in nominati:
        mondo.registra_riferito(id_ogg)

    # Mostra le uscite disponibili. [1.3.0 / M-8] Con 'Le uscite nominano solo
    # le stanze visitate.' una stanza mai vista resta senza nome.
    mondo.stanze_visitate.add(stanza_corrente.nome)
    if stanza_corrente.uscite:
        voci = []
        for d, id_s in stanza_corrente.uscite.items():
            dest = mondo.trova_stanza(id_s)
            if dest is None or (mondo.uscite_solo_visitate and id_s not in mondo.stanze_visitate):
                voci.append(prima_maiuscola(d))
            else:
                voci.append(f"{prima_maiuscola(d)} ({prima_maiuscola(dest.nome_visualizzato)})")
        print(f"Uscite: {', '.join(voci)}.")

def _elenca_appoggiati(mondo: Mondo, oggetto, nominati, visti):
    """[1.3.0 / M-5] Stampa «Sul tavolo: una mela, un coltello.» per un supporto
    o un contenitore aperto, poi scende nel suo contenuto."""
    if oggetto.nome in visti or oggetto.is_personaggio:
        return
    visti.add(oggetto.nome)
    if not (oggetto.is_supporto or (oggetto.is_contenitore and mondo.contenitore_aperto(oggetto))):
        return
    figli = [mondo.oggetti[c] for c in mondo.oggetti if c in oggetto.contenuto]
    da_elencare = figli   # la frase di posto vale solo in una stanza (1.1.0)
    if da_elencare:
        dove = "su" if oggetto.is_supporto else "in"
        elenco = ", ".join(frase_indeterminativa(f.nome_visualizzato) for f in da_elencare)
        print(f"{prima_maiuscola(con_preposizione(dove, oggetto.nome_visualizzato))}: {elenco}.")
        nominati.extend(f.nome for f in da_elencare)
    for figlio in figli:
        _elenca_appoggiati(mondo, figlio, nominati, visti)


AMBIGUO = "<ambiguo>"


def risolvi_in_silenzio(mondo: Mondo, nome_parziale: str):
    """[1.3.0] Il nucleo della ricerca di un oggetto, SENZA stampare nulla.
    Restituisce (id, candidati): id è l'oggetto (o la direzione canonica)
    trovato, AMBIGUO se più oggetti combaciano (allora `candidati` li elenca),
    None se nulla combacia. Usato dal parser per provare più letture dello
    stesso comando prima di rispondere."""
    if not nome_parziale:
        return None, []

    stanza_corrente = mondo.trova_stanza(mondo.posizione_giocatore)
    if not stanza_corrente:
        return None, []

    # [Livello 4 / M1] Lo scope include il contenuto dei contenitori aperti e dei
    # supporti raggiungibili, non solo gli oggetti direttamente nella stanza.
    oggetti_in_scope = list(mondo.oggetti_raggiungibili())

    # Priorità 0: Direzioni (anche con "a " davanti). [Livello 4 / L1] La mappa
    # forma->canonica vive sul mondo (base + personalizzate).
    nome_pulito = nome_parziale.strip().lower()
    if nome_pulito.startswith("a ") and len(nome_pulito) > 2:
        nome_pulito = nome_pulito[2:].strip()

    if nome_pulito in mondo.direzioni:
        return mondo.direzioni[nome_pulito], []

    # Normalizza l'input per trovare gli oggetti del gioco
    nome_normalizzato = normalizza_nome(nome_parziale)

    # [Livello 4] Risoluzione alias: un nome alternativo dichiarato dall'autore
    # ('La torcia si chiama anche "lanterna".') rimanda all'id canonico. Il nome
    # proprio dell'oggetto ha comunque la precedenza (controllato dopo).
    alias = getattr(mondo, "alias", {})
    nome_risolto = alias.get(nome_normalizzato, nome_normalizzato)

    # Priorità 1: Corrispondenza esatta (sul nome, poi sull'alias risolto)
    if nome_normalizzato in oggetti_in_scope:
        return nome_normalizzato, []
    if nome_risolto in oggetti_in_scope:
        return nome_risolto, []

    # Priorità 2: Corrispondenza parziale univoca. Il pool di candidati include
    # gli id in scope e gli alias (parziali) che rimandano a oggetti in scope.
    candidati = [id_ogg for id_ogg in oggetti_in_scope if _combacia_parziale(nome_normalizzato, id_ogg)]
    for ali, canonico in alias.items():
        if (canonico in oggetti_in_scope and _combacia_parziale(nome_normalizzato, ali)
                and canonico not in candidati):
            candidati.append(canonico)

    if len(candidati) == 1:
        return candidati[0], candidati
    if len(candidati) > 1:
        # [1.3.0] Nell'ordine della storia (prima: alfabetico sugli id).
        return AMBIGUO, [c for c in mondo.oggetti if c in candidati]
    return None, []


# [1.3.0 / M-5] Parole che non distinguono un oggetto da un altro: articoli e
# «di» ('la chiave DI ferro', 'l'uomo').
_PAROLE_VUOTE = frozenset(("il", "lo", "la", "l", "i", "gli", "le", "un", "uno", "una",
                           "di", "del", "dello", "della", "dei", "degli", "delle", "d"))
_RE_PAROLA = re.compile(r"[a-z0-9à-ÿ]+")


def _parole_di(testo: str):
    return _RE_PAROLA.findall(testo.lower())


def _combacia_parziale(cercato: str, nome: str) -> bool:
    """Corrispondenza parziale fra quanto scritto dal giocatore e un nome.
    [1.3.0 / M-5] Per PAROLE, non più per sottostringa: ogni parola scritta
    (articoli esclusi) deve essere una parola del nome o l'inizio di una parola
    del nome di almeno tre lettere. 'chiave' e 'rossa' trovano la chiave rossa,
    'chiav' anche; 'a' e 'ave' non trovano più tutto ciò che contiene una a."""
    cercate = [p for p in _parole_di(cercato) if p not in _PAROLE_VUOTE]
    if not cercate:
        return False
    del_nome = _parole_di(nome)
    return all(any(p == n or (len(p) >= 3 and n.startswith(p)) for n in del_nome)
               for p in cercate)


def _elenco_con_o(nomi) -> str:
    """'a', 'b', 'c' -> 'a, b o c'."""
    nomi = list(nomi)
    if len(nomi) == 1:
        return nomi[0]
    return f"{', '.join(nomi[:-1])} o {nomi[-1]}"


def _domanda_ambiguita(mondo: Mondo, candidati) -> str:
    """[1.3.0 / M-4] La domanda con i nomi della storia, non con gli id interni:
    «Quale intendi: la chiave rossa o la chiave blu?»."""
    nomi = [nome_in_frase(mondo.oggetti[c].nome_visualizzato) if c in mondo.oggetti else c
            for c in candidati]
    return f"Quale intendi: {_elenco_con_o(nomi)}?"


def risolvi_nome_oggetto(mondo: Mondo, nome_parziale: str) -> str | None:
    """Cerca di risolvere un nome parziale in un ID oggetto univoco nello scope
    attuale. Se il nome è ambiguo pone la domanda e restituisce AMBIGUO.
    [1.3.0 / M-5] La domanda ha un seguito: la risposta del giocatore ('rossa')
    completa il comando rimasto in sospeso (vedi elabora_comando)."""
    id_trovato, candidati = risolvi_in_silenzio(mondo, nome_parziale)
    if id_trovato == AMBIGUO:
        print(_domanda_ambiguita(mondo, candidati))
        mondo._ambiguita = {"candidati": candidati, "frammento": nome_parziale}
    return id_trovato


def _risolvi_per_azione(mondo: Mondo, nome_azione: str, nome_parziale: str):
    """[1.3.0 / M-5] Come risolvi_nome_oggetto, ma fra più candidati sceglie da
    sé quando l'azione lo dice: 'prendi la chiave' con una chiave già in mano e
    una a terra prende quella a terra; 'lascia la chiave' posa quella in mano."""
    id_trovato, candidati = risolvi_in_silenzio(mondo, nome_parziale)
    if id_trovato == AMBIGUO and nome_azione in ("prendere", "lasciare", "mettere"):
        voglio_in_mano = nome_azione != "prendere"
        adatti = [c for c in candidati if mondo.giocatore_possiede(c) == voglio_in_mano]
        if len(adatti) == 1:
            return adatti[0]
    return risolvi_nome_oggetto(mondo, nome_parziale)


def _scegli_fra_candidati(mondo: Mondo, risposta: str, candidati):
    """[1.3.0 / M-5] La risposta alla domanda «Quale intendi…?»: un numero
    d'ordine o parole che distinguono un candidato. Restituisce i candidati che
    la risposta indica (uno solo = scelta fatta; nessuno = è un altro comando)."""
    parole = risposta.split()
    if len(parole) == 1 and parole[0].isdigit():
        n = int(parole[0])
        return [candidati[n - 1]] if 1 <= n <= len(candidati) else []
    scelti = []
    for c in candidati:
        visualizzato = mondo.oggetti[c].nome_visualizzato if c in mondo.oggetti else c
        if _combacia_parziale(risposta, c) or _combacia_parziale(risposta, visualizzato):
            scelti.append(c)
    return scelti


# [0.18.0 / A4] Le preposizioni d'azione del parser runtime includono le forme
# ARTICOLATE (simmetriche alla grammatica): 'usa la batteria sul pannello',
# 'metti la spada nella teca'. [1.3.0 / G-7] Anche quelle di TERMINE e di
# PROVENIENZA e le locative improprie: 'dai la mela alla guardia', 'prendi la
# mela dal tavolo', 'metti il vaso sopra il mobile'. Il punto in cui dividere il
# comando lo sceglie _dividi_argomenti.
PREPOSIZIONI = [
    "su", "sul", "sullo", "sulla", "sui", "sugli", "sulle", "sull'",
    "con", "contro",
    "in", "nel", "nello", "nella", "nei", "negli", "nelle", "nell'",
    "a", "al", "allo", "alla", "ai", "agli", "alle", "all'",
    "da", "dal", "dallo", "dalla", "dai", "dagli", "dalle", "dall'",
    "sopra", "sotto", "dentro", "dietro", "verso",
]
_PREP_APOSTROFATE = ("sull'", "nell'", "all'", "dall'")
_PREPOSIZIONI_STORICHE = frozenset(PREPOSIZIONI[:18])   # fino alla 1.2.2
_PREP_DA = ("da", "dal", "dallo", "dalla", "dai", "dagli", "dalle", "dall'")


def _separa_apostrofi(parole):
    """"sull'altare" -> "sull'", "altare": la preposizione apostrofata è una
    parola a sé, come quando il giocatore la scrive staccata."""
    risultato = []
    for p in parole:
        for prep in _PREP_APOSTROFATE:
            if p.startswith(prep) and len(p) > len(prep):
                risultato += [prep, p[len(prep):]]
                break
        else:
            risultato.append(p)
    return risultato


def _nomina(mondo: Mondo, testo: str) -> bool:
    """Il testo nomina qualcosa: un oggetto, una direzione, 'tutto' o un elenco
    di oggetti ('la mela e la chiave')."""
    if testo in _TUTTO or risolvi_in_silenzio(mondo, testo)[0] is not None:
        return True
    parti = [p for p in _RE_ELENCO.split(testo) if p]
    return len(parti) > 1 and all(risolvi_in_silenzio(mondo, p)[0] is not None for p in parti)


def _dividi_argomenti(mondo: Mondo, parole_arg):
    """[1.3.0 / M-5] Divide gli argomenti del comando in (oggetto, preposizione,
    secondo oggetto). Fino alla 1.2.2 si divideva sulla PRIMA preposizione, e un
    nome che ne contiene una ('la tazza con il manico', 'l'uomo in nero')
    funzionava solo per caso. Ora: se tutto il testo nomina un oggetto non si
    divide; altrimenti si sceglie la prima preposizione per cui entrambe le metà
    nominano qualcosa (la sinistra può mancare: 'guarda sotto il letto'); poi
    la prima per cui almeno la sinistra nomina qualcosa (della destra si dirà
    che non c'è); infine, come fino alla 1.2.2, la prima delle preposizioni
    storiche (su, con, in… e articolate). Le nuove ('a', 'da', 'sopra'…)
    dividono solo quando servono: 'l'orologio a pendolo' resta un nome."""
    intero = " ".join(parole_arg)
    posizioni = [i for i, p in enumerate(parole_arg) if p in PREPOSIZIONI]
    if not posizioni or _nomina(mondo, intero):
        return intero, None, ""
    for i in posizioni:
        sx = " ".join(parole_arg[:i])
        dx = " ".join(parole_arg[i + 1:])
        if not dx:
            continue
        if ((not sx or _nomina(mondo, sx))
                and risolvi_in_silenzio(mondo, dx)[0] is not None):
            return sx, parole_arg[i], dx
    for i in posizioni:
        sx = " ".join(parole_arg[:i])
        if sx and i < len(parole_arg) - 1 and _nomina(mondo, sx):
            return sx, parole_arg[i], " ".join(parole_arg[i + 1:])
    for i in posizioni:
        if parole_arg[i] in _PREPOSIZIONI_STORICHE and i < len(parole_arg) - 1:
            return " ".join(parole_arg[:i]), parole_arg[i], " ".join(parole_arg[i + 1:])
    return intero, None, ""


# [1.3.0 / G-4] Verbi di movimento senza direzione: 'entra', 'sali', 'scendi',
# 'esci dalla stanza'. Valgono se l'autore non li ha dichiarati come verbi.
_MOVIMENTI_IMPLICITI = {
    "entra": "dentro", "entrare": "dentro",
    "sali": "su", "salire": "su",
    "scendi": "giù", "scendere": "giù",
    "esci": "fuori", "uscire": "fuori",
}

# [1.3.0 / M-5] 'prendi tutto', 'lascia tutto', 'metti tutto nella cassa'.
_TUTTO = ("tutto", "ogni cosa", "tutte le cose", "tutti gli oggetti", "tutta la roba")
_AZIONI_CON_TUTTO = ("prendere", "lasciare", "mettere")
_RE_ELENCO = re.compile(r"\s*,\s*|\s+e\s+")


def _infinito(verbo: str, nome_azione: str | None) -> str | None:
    """L'infinito del verbo per le domande del motore ('Cosa vuoi prendere?').
    None se non lo si conosce (un verbo d'autore all'imperativo)."""
    for forma in (nome_azione or "", verbo):
        if not forma.startswith("_") and forma.endswith(("are", "ere", "ire")):
            return forma
    return None


def _chiedi_oggetto(verbo: str, nome_azione: str | None = None):
    """[1.3.0 / M-4] «Cosa vuoi prendere?» invece di «Cosa vorresti prendi?»."""
    infinito = _infinito(verbo, nome_azione)
    if nome_azione == "vai":
        print("Dove vuoi andare?")
    elif infinito:
        print(f"Cosa vuoi {infinito}?")
    else:
        print(f"{prima_maiuscola(verbo)} che cosa?")


def _match_verbo_multiparola(mondo: Mondo, parole) -> str | None:
    """[0.18.0 / B6] Se il comando del giocatore inizia con un verbo personalizzato
    MULTI-PAROLA dichiarato, restituisce quel verbo (il più lungo che combacia come
    prefisso, in numero di parole); altrimenti None. I verbi monoparola non sono
    considerati qui (li gestisce il normale parole[0]). [1.2.0] Valgono anche i
    sinonimi di più parole ('"lancia il cibo" è come "getta il cibo".')."""
    verbi = set(getattr(mondo, "verbi_personalizzati", None) or ())
    verbi |= set(getattr(mondo, "sinonimi_verbo", None) or ())
    candidati = sorted((v for v in verbi if " " in v),
                       key=lambda v: len(v.split()), reverse=True)
    for v in candidati:
        n = len(v.split())
        if len(parole) >= n and " ".join(parole[:n]) == v:
            return v
    return None


# [0.20.0 / A1] Pronomi anaforici. I clitici si attaccano al verbo ('prendiLA');
# i pronomi tonici e i clitici nudi sono un argomento a sé ('prendi quella').
_PRON_GN = {  # forma del pronome -> chiave genere/numero in mondo.ultimo_riferito
    "lo": "m_sing", "la": "f_sing", "li": "m_plur", "le": "f_plur",
    "quello": "m_sing", "quella": "f_sing", "quelli": "m_plur", "quelle": "f_plur",
}
_CLITICI = ("lo", "la", "li", "le")
_PRON_DISPLAY = {"m_sing": "lo", "f_sing": "la", "m_plur": "li", "f_plur": "le"}


def _risolvi_anafora(mondo: Mondo, verbo: str, argomento: str):
    """[0.20.0 / A1] Risolve un eventuale pronome anaforico nel comando.

    Restituisce ('ok', verbo, id_oggetto) col riferito risolto; ('vuoto', verbo,
    None) se il pronome non ha un riferente di quel genere/numero o non è più
    raggiungibile (il messaggio è già stampato); None se non c'è alcun pronome.
    Il riferito è l'ultimo oggetto di quel genere/numero su cui il giocatore ha
    agito o che il motore ha nominato (vedi mondo.ultimo_riferito)."""
    gn = None
    nuovo_verbo = verbo
    noto = mondo.mappa_verbi_giocatore
    # (a) clitico suffisso: 'prendila' = verbo noto + clitico, senza altri argomenti.
    if not argomento and verbo not in noto and verbo not in mondo.direzioni:
        for cl in _CLITICI:
            if verbo.endswith(cl) and len(verbo) > len(cl) and verbo[:-len(cl)] in noto:
                gn = _PRON_GN[cl]
                nuovo_verbo = verbo[:-len(cl)]
                break
    # (b) pronome (tonico o clitico) come argomento intero: 'prendi quella', 'usa lo'.
    if gn is None and argomento in _PRON_GN:
        gn = _PRON_GN[argomento]
    if gn is None:
        return None
    rif = mondo.ultimo_riferito.get(gn)
    if not rif:
        # Nessun riferente di quel genere/numero (anche per mismatch di genere).
        _chiedi_oggetto(nuovo_verbo, noto.get(nuovo_verbo))
        return ("vuoto", nuovo_verbo, None)
    if rif not in mondo.oggetti_raggiungibili():
        print(f"Non {_PRON_DISPLAY[gn]} vedi più.")
        return ("vuoto", nuovo_verbo, None)
    return ("ok", nuovo_verbo, rif)


def _senza_turno(mondo: Mondo):
    """[1.3.0] Il comando in corso non fa passare il tempo (errore del parser o
    comando fuori dal mondo, come AIUTO): vedi elabora_comando."""
    mondo._turno_libero = True


def _stampa_annunci(mondo: Mondo):
    """[0.25.0 / A5] Svuota e stampa la coda degli annunci di movimento degli NPC
    accumulati dalle conseguenze appena eseguite (le conseguenze restano «pure»:
    accodano, non stampano). Va chiamato dopo ogni blocco di esecuzione di
    conseguenze (eventi, demoni, regole)."""
    annunci = getattr(mondo, "annunci", None)
    if annunci:
        for messaggio in annunci:
            print(rendi_testo(mondo, messaggio))
        annunci.clear()


def partita_finita(mondo: Mondo) -> bool:
    """[Livello 3] Controlla lo stato della partita dopo l'esecuzione delle
    conseguenze. Se una conseguenza di fine partita l'ha terminata, stampa
    l'esito e restituisce True (il loop di gioco deve fermarsi)."""
    stato = getattr(mondo, "stato_partita", "in_corso")
    if stato == "in_corso":
        return False
    # [0.18.0 / B3] Se una conseguenza ha fornito un testo d'esito, lo si stampa
    # al posto del banner fisso (interpolando gli eventuali segnaposto [var]).
    messaggio = getattr(mondo, "messaggio_esito", None)
    if messaggio:
        print("\n" + rendi_testo(mondo, messaggio))
    elif stato == "vinta":
        print("\n*** HAI VINTO! ***")
    elif stato == "persa":
        print("\n*** HAI PERSO. ***")
    else:
        print("\n*** La partita è terminata. ***")
    return True

def avanza_turno_e_processa(mondo: Mondo) -> bool:
    """[Livello 3] Avanza il contatore dei turni di un'unità e attiva gli eventi
    temporali che scattano a quel turno. [Livello 8] Poi valuta i DEMONI (eventi
    condizionali). Restituisce True se un evento/demone ha terminato la partita
    (il loop deve fermarsi)."""
    mondo.turno_corrente += 1
    t = mondo.turno_corrente
    # Prima gli eventi a TEMPO: così un 'Ogni turno: aumenta tensione' è già
    # applicato quando i demoni valutano le loro condizioni in questo stesso turno.
    for evento in mondo.eventi:
        if evento.scatta_a(t):
            # [0.19.0 / A9] La battuta è opzionale (tick silenzioso): stampa solo
            # se c'è del testo, poi applica comunque le conseguenze.
            if evento.risposta:
                print(rendi_testo(mondo, evento.risposta))
            evento.esegui_conseguenze(mondo)
            if partita_finita(mondo):
                _stampa_annunci(mondo)   # [A5] eventuali movimenti prima della fine
                return True
    finita = _processa_demoni(mondo)
    # [0.25.0 / A5] Annuncia i movimenti degli NPC avvenuti in eventi e demoni di
    # questo turno (l'NPC entra/esce dalla stanza del giocatore).
    _stampa_annunci(mondo)
    return finita


def _processa_demoni(mondo: Mondo) -> bool:
    """[Livello 8] Valuta i demoni (eventi condizionali) UNA volta per turno, in
    un SOLO passaggio in ordine di dichiarazione. Un demone che scatta può mutare
    lo stato e quindi influenzare i demoni SUCCESSIVI nello stesso passaggio
    (cascata deterministica e utile), ma nessuno viene ri-valutato: i loop infiniti
    sono impossibili per costruzione («un demone, una valutazione per turno»).
    Restituisce True se un demone ha terminato la partita."""
    for demone in mondo.demoni:
        ora_vera = demone.condizione.valuta(mondo)
        if demone.tipo == "ogni_turno":
            # A LIVELLO: scatta a OGNI turno in cui la condizione è vera.
            scatta = ora_vera
        elif demone.tipo == "dopo":
            # [1.3.0 / M-7] 'N turni dopo che …': il fronte di salita apre un
            # conto alla rovescia; scatta quando arriva a zero (una volta per
            # fronte; un nuovo fronte durante il conto non lo riapre).
            scatta = False
            if ora_vera and not demone.era_vera and demone.conto is None:
                demone.conto = demone.ritardo
            elif demone.conto is not None:
                demone.conto -= 1
            if demone.conto is not None and demone.conto <= 0:
                demone.conto = None
                scatta = True
        else:
            # 'quando': sul FRONTE di salita (falso -> vero), una sola volta.
            scatta = ora_vera and not demone.era_vera
        demone.era_vera = ora_vera
        if scatta:
            # [0.19.0 / A9] Battuta opzionale (tick silenzioso).
            if demone.risposta:
                print(rendi_testo(mondo, demone.risposta))
            demone.esegui_conseguenze(mondo)
            if partita_finita(mondo):
                return True
    return False


def elabora_comando(mondo: Mondo, comando_grezzo: str) -> bool:
    """
    Esegue un singolo comando di gioco e, se il comando rappresenta un turno,
    avanza il contatore dei turni elaborando gli eventi temporali (Livello 3).
    Restituisce True se il gioco deve continuare, False se deve terminare
    (uscita del giocatore, fine partita o evento terminale).
    """
    comando_pulito = comando_grezzo.strip().lower()
    # [Audit 0.17.0] A partita conclusa non passano turni né scattano eventi o
    # demoni. [1.3.0] Ma si può ancora tornare indietro: ANNULLA, RICOMINCIA,
    # CARICA; FINE chiude. Qualunque altro comando ricorda queste possibilità.
    if getattr(mondo, "stato_partita", "in_corso") != "in_corso":
        return _dopo_la_fine(mondo, comando_pulito)
    if not comando_pulito:
        return True
    era_in_dialogo = mondo.in_dialogo()

    # [1.3.0] Una domanda di conferma in sospeso (uscire, ricominciare): «sì» la
    # esegue, «no» la annulla, ogni altro comando la lascia cadere e vale da sé.
    in_sospeso = getattr(mondo, "_in_conferma", None)
    if in_sospeso:
        mondo._in_conferma = None
        if comando_pulito in _RISPOSTE_SI:
            if in_sospeso == "esci":
                print("A presto!")
                mondo._uscita_richiesta = True
                return False
            return _ricomincia(mondo)
        if comando_pulito in _RISPOSTE_NO:
            print("(Si continua.)")
            return True

    # [1.3.0 / M-5] La risposta a «Quale intendi…?» completa il comando rimasto
    # in sospeso ('prendi la chiave' → 'rossa' = 'prendi la chiave rossa'). Una
    # risposta che non nomina nessuno dei candidati è un comando nuovo.
    amb = getattr(mondo, "_ambiguita", None)
    mondo._ambiguita = None
    if amb and "comando" in amb and not era_in_dialogo:
        scelti = _scegli_fra_candidati(mondo, comando_pulito, amb["candidati"])
        if len(scelti) == 1:
            comando_grezzo = comando_pulito = _completa_comando_ambiguo(amb, scelti[0])
        elif scelti:
            amb["candidati"] = scelti
            mondo._ambiguita = amb
            print(_domanda_ambiguita(mondo, scelti))
            return True

    # [Livello 5b] Durante una conversazione 'esci' chiude il dialogo (gestito in
    # _esegui_comando), NON il gioco: l'uscita dal gioco vale solo fuori dialogo.
    # [1.3.0] Fuori dialogo 'esci' è un movimento se qui c'è un'uscita «fuori»;
    # altrimenti chiede conferma prima di chiudere la partita (prima la chiudeva
    # subito, e chi scriveva 'esci' per lasciare una stanza perdeva la partita).
    if not era_in_dialogo and comando_pulito in ("esci", "quit"):
        stanza = mondo.trova_stanza(mondo.posizione_giocatore)
        if comando_pulito == "esci" and stanza and "fuori" in stanza.uscite:
            comando_grezzo = comando_pulito = "fuori"
        else:
            mondo._in_conferma = "esci"
            print("Vuoi davvero chiudere la partita? (sì/no) "
                  "Se vuoi riprenderla più tardi, prima scrivi SALVA.")
            return True
    if not era_in_dialogo and comando_pulito in _VERBI_RICOMINCIA:
        mondo._in_conferma = "ricomincia"
        print("Vuoi davvero ricominciare da capo? (sì/no)")
        return True

    # [1.2.0] SALVA / CARICA: comandi di servizio, validi anche durante una
    # conversazione; non consumano un turno e non entrano nella sequenza salvata.
    parole_servizio = comando_pulito.split()
    archivio = _comando_di_archivio(mondo, parole_servizio)
    if archivio == "salva":
        _gestisci_salva(mondo, _nome_salvataggio(parole_servizio))
        return True
    if archivio == "carica":
        _gestisci_carica(mondo, _nome_salvataggio(parole_servizio))
        return True

    # [0.21.0 / A3] Comandi di SERVIZIO (fuori dialogo): non sono azioni sul
    # mondo, agiscono sulla sessione e NON consumano un turno.
    if not era_in_dialogo:
        if comando_pulito in ("annulla", "disfa"):
            _gestisci_annulla(mondo)
            return True
        if comando_pulito in ("ancora", "ripeti", "g"):
            if not mondo.ultimo_comando:
                print("Non hai ancora fatto nulla da ripetere.")
                return True
            # Si rigioca l'ultimo comando come se il giocatore l'avesse ridigitato.
            comando_grezzo = mondo.ultimo_comando
            comando_pulito = comando_grezzo.strip().lower()

    # [0.21.0 / A3] Istantanea PRIMA del turno, per l'ANNULLA. Si cattura solo
    # fuori dialogo (le interazioni di dialogo non consumano un turno); l'istantanea
    # è conservata solo se il comando effettivamente avanza il tempo.
    # [1.2.0] Durante CARICA la testa della sequenza si rigioca senza istantanee.
    snap = (mondo.cattura_stato()
            if not era_in_dialogo and not mondo._senza_istantanee else None)
    lunghezza_registro = len(mondo._registro_comandi)

    mondo._turno_libero = False
    try:
        continua = _esegui_comando(mondo, comando_grezzo)
    except Exception:
        # [0.27.0 / E] Turno ATOMICO: una conseguenza/azione che solleva a metà
        # non deve lasciare il mondo a metà strada né far scattare turno/eventi/
        # demoni su uno stato incoerente. Si ripristina l'istantanea pre-turno (se
        # c'era; fuori dialogo è sempre presente) e il turno diventa un no-op.
        # La diagnostica è già stata stampata da _esegui_comando.
        if snap is not None:
            mondo.ripristina_stato(snap)
        return True
    # [1.3.0] Un comando che il parser non ha capito (verbo ignoto, oggetto che
    # non c'è, nome ambiguo) o che non riguarda il mondo (AIUTO) non fa passare
    # il tempo: niente turno, niente eventi né demoni, niente istantanea. Fino
    # alla 1.2.2 un refuso costava un turno, e nelle storie a tempo un sorso d'acqua.
    if getattr(mondo, "_turno_libero", False):
        mondo._turno_libero = False
        return continua
    # [1.2.0] Il comando è andato a buon fine: entra nella sequenza salvabile
    # (ANCORA vi entra già risolto nel comando che ripete).
    mondo._registro_comandi.append(comando_grezzo)
    if not continua:
        if getattr(mondo, "stato_partita", "in_corso") != "in_corso":
            # [1.3.0] La partita è finita con questo comando: il turno entra
            # comunque nella pila di ANNULLA, così lo si può disfare.
            if snap is not None:
                _registra_istantanea(mondo, snap, lunghezza_registro)
            elif mondo._snap_dialogo is not None:
                ingresso = mondo._reg_ingresso_dialogo
                _registra_istantanea(mondo, mondo._snap_dialogo,
                                     lunghezza_registro if ingresso is None else ingresso)
                mondo._snap_dialogo = None
                mondo._reg_ingresso_dialogo = None
            print(_INVITO_DOPO_LA_FINE)
        return False
    # [Livello 5b] Le interazioni di dialogo non consumano un turno: il tempo del
    # mondo non avanza mentre si conversa.
    # [0.27.0 / D-dialogo] Ma le opzioni POSSONO mutare il mondo ('e adesso …'):
    # per non perdere l'annullabilità, l'INTERA conversazione è un solo passo di
    # ANNULLA. L'istantanea pre-dialogo si mette da parte all'ingresso e si registra
    # all'uscita (un solo undo riporta a prima di 'parla con …').
    appena_entrato = (not era_in_dialogo) and mondo.in_dialogo()
    appena_uscito = era_in_dialogo and (not mondo.in_dialogo())
    if appena_entrato:
        mondo._snap_dialogo = snap
        mondo._reg_ingresso_dialogo = lunghezza_registro
        return True
    if appena_uscito:
        if mondo._snap_dialogo is not None:
            ingresso = mondo._reg_ingresso_dialogo
            _registra_istantanea(mondo, mondo._snap_dialogo,
                                 lunghezza_registro if ingresso is None else ingresso)
            mondo._snap_dialogo = None
        mondo._reg_ingresso_dialogo = None
        # ultimo_comando NON aggiornato: ANCORA non deve ripetere un comando di dialogo.
        return True
    if mondo.in_dialogo():
        return True   # scelta intermedia: ancora in conversazione
    # Turno consumato: registra l'istantanea (per ANNULLA) e il comando (per ANCORA).
    if snap is not None:
        _registra_istantanea(mondo, snap, lunghezza_registro)
    if not era_in_dialogo:
        mondo.ultimo_comando = comando_grezzo
    if avanza_turno_e_processa(mondo):
        print(_INVITO_DOPO_LA_FINE)
        return False
    return True


# [1.3.0] Conferme, fine partita e RICOMINCIA.
_RISPOSTE_SI = ("sì", "si", "s", "y", "yes")
_RISPOSTE_NO = ("no", "n")
_VERBI_RICOMINCIA = ("ricomincia", "ricominciare", "riavvia")
_COMANDI_FINE = ("fine", "esci", "quit", "basta")
_INVITO_DOPO_LA_FINE = ("\n(La partita è finita. Scrivi ANNULLA per tornare indietro di un "
                        "turno, RICOMINCIA per ripartire da capo, CARICA per riprendere "
                        "un salvataggio o FINE per uscire.)")


def _dopo_la_fine(mondo: Mondo, comando: str) -> bool:
    """[1.3.0] A partita finita: ANNULLA, RICOMINCIA e CARICA la riaprono (True);
    FINE chiude; qualunque altro comando ricorda le possibilità (False, senza
    turni né eventi). Prima ogni comando era un no-op muto."""
    if comando in ("annulla", "disfa"):
        if not mondo._storia_stati:
            print("Non c'è niente da annullare.")
            return False
        _gestisci_annulla(mondo)
        return mondo.stato_partita == "in_corso"
    if comando in _VERBI_RICOMINCIA:
        return _ricomincia(mondo)
    parole = comando.split()
    if _comando_di_archivio(mondo, parole) == "carica":
        _gestisci_carica(mondo, _nome_salvataggio(parole))
        return mondo.stato_partita == "in_corso"
    if comando in _COMANDI_FINE:
        print("A presto!")
        mondo._uscita_richiesta = True
        return False
    if comando:
        print(_INVITO_DOPO_LA_FINE.strip())
    return False


def _ricomincia(mondo: Mondo) -> bool:
    """[1.3.0] Riporta la partita al mondo iniziale (come un CARICA di una
    sequenza vuota): pila di ANNULLA e sequenza salvabile ripartono da zero."""
    dati = {"formato": FORMATO_SALVATAGGIO, "versione": VERSIONE_FORMATO_SALVATAGGIO,
            "storia": mondo._impronta_iniziale, "comandi": [], "ultimo": None}
    ok, messaggio = carica_da_dati(mondo, dati)
    if not ok:
        print(f"({messaggio})")
        return mondo.stato_partita == "in_corso"
    print("(Si ricomincia da capo.)")
    mostra_stanza(mondo)
    return True


# [0.21.0 / A3] Profondità massima della pila di ANNULLA: si possono disfare
# fino a N turni. Tetto di memoria (ogni passo è un'istantanea del mondo).
_MAX_ANNULLA = 100


def _registra_istantanea(mondo: Mondo, snap: dict, pos_registro: int = 0):
    """[0.27.0] Mette un'istantanea sulla pila di ANNULLA, rispettando il tetto di
    memoria (_MAX_ANNULLA): si scorda la più vecchia. Condiviso dal turno normale
    e dalla chiusura di un dialogo (vedi elabora_comando). [1.2.0] Accanto
    all'istantanea si ricorda la lunghezza della sequenza salvabile prima del
    turno: ANNULLA la riporta lì."""
    mondo._storia_stati.append(snap)
    mondo._pos_registro.append(pos_registro)
    if len(mondo._storia_stati) > _MAX_ANNULLA:
        mondo._storia_stati.pop(0)
    while len(mondo._pos_registro) > len(mondo._storia_stati):
        mondo._pos_registro.pop(0)


def _gestisci_annulla(mondo: Mondo):
    """[0.21.0 / A3] Riporta il mondo allo stato precedente l'ultimo turno."""
    if not mondo._storia_stati:
        print("Non c'è niente da annullare.")
        return
    mondo.ripristina_stato(mondo._storia_stati.pop())
    if mondo._pos_registro:   # [1.2.0] il turno disfatto esce dalla sequenza
        del mondo._registro_comandi[mondo._pos_registro.pop():]
    print("(Hai annullato l'ultimo turno.)")
    mostra_stanza(mondo)


# ==============================================================================
# [1.2.0] SALVA / CARICA
# ------------------------------------------------------------------------------
# Il salvataggio NON contiene il mondo (oggetti Python: serializzarli vorrebbe
# dire pickle, fragile fra versioni e pericoloso con file altrui). Contiene la
# sequenza EFFETTIVA dei comandi (Mondo._registro_comandi: i turni disfatti con
# ANNULLA ne sono tolti, ANCORA vi entra col comando che ripete), l'ultimo
# comando per ANCORA e un'impronta SHA-256 dello stato. Il motore è
# deterministico (il caso passa da mondo.rng, seme fisso): caricare = ripartire
# dal mondo iniziale e rigiocare la sequenza, poi confrontare l'impronta.
# Metodo nato e collaudato con «Il Viaggiatore» (app/src/lib/ponte.py).
# ==============================================================================

FORMATO_SALVATAGGIO = "favella-salvataggio"
VERSIONE_FORMATO_SALVATAGGIO = 1
# Quanti comandi, in coda alla sequenza, si rigiocano con le istantanee di
# ANNULLA accese: dopo un caricamento si può disfare come nella partita
# originale. La testa si rigioca senza istantanee (nessuna copia profonda).
CODA_ANNULLA = 40
_VERBI_SALVA = ("salva", "salvare")
_VERBI_CARICA = ("carica", "caricare", "ripristina")


class ArchivioFile:
    """Salvataggi come file di testo «<nome>.salvataggio» in una cartella
    (predefinita: la cartella di lavoro). È l'archivio del terminale e del
    playground locale."""
    ESTENSIONE = ".salvataggio"

    def __init__(self, cartella=None):
        self.cartella = cartella or os.getcwd()

    def _percorso(self, nome):
        return os.path.join(self.cartella, nome + self.ESTENSIONE)

    def scrivi(self, nome, testo):
        with open(self._percorso(nome), "w", encoding="utf-8") as f:
            f.write(testo)
        return self._percorso(nome)

    def leggi(self, nome):
        try:
            with open(self._percorso(nome), encoding="utf-8") as f:
                return f.read()
        except FileNotFoundError:
            return None


class ArchivioBrowser:
    """Salvataggi nel localStorage del browser (motore sotto Pyodide: sito,
    esportazione HTML). La chiave porta l'impronta della storia, così due storie
    diverse aperte dallo stesso sito non si pestano i salvataggi."""

    def __init__(self, impronta_storia):
        from js import localStorage  # disponibile solo sotto Pyodide
        self._ls = localStorage
        self._prefisso = f"favella-salvataggio:{(impronta_storia or '')[:16]}:"

    def scrivi(self, nome, testo):
        self._ls.setItem(self._prefisso + nome, testo)
        return nome

    def leggi(self, nome):
        valore = self._ls.getItem(self._prefisso + nome)
        return None if valore is None else str(valore)


def archivio_di(mondo: Mondo):
    """L'archivio dei salvataggi di questa partita: quello dato dall'host
    (mondo.archivio_salvataggi) o quello naturale del posto in cui gira."""
    archivio = getattr(mondo, "archivio_salvataggi", None)
    if archivio is not None:
        return archivio
    if sys.platform == "emscripten":
        return ArchivioBrowser(getattr(mondo, "_impronta_iniziale", None))
    return ArchivioFile()


def dati_salvataggio(mondo: Mondo) -> dict:
    """Il contenuto di un salvataggio (un dizionario serializzabile in JSON)."""
    from strutture import VERSIONE_MOTORE
    return {
        "formato": FORMATO_SALVATAGGIO,
        "versione": VERSIONE_FORMATO_SALVATAGGIO,
        "motore": VERSIONE_MOTORE,
        "storia": mondo._impronta_iniziale,
        # [1.3.0 / L-6] Come si chiama la storia: se l'impronta cambia (una
        # correzione dopo il salvataggio) il salvataggio si carica lo stesso.
        "nome": _nome_della_storia(mondo),
        "turno": mondo.turno_corrente,
        "comandi": list(mondo._registro_comandi),
        # Ciò che ANCORA ripeterebbe: stato di sessione, non ricostruibile dalla
        # sequenza (dopo un ANNULLA può essere proprio il comando disfatto).
        "ultimo": mondo.ultimo_comando,
        "impronta": mondo.impronta_stato(),
    }


def carica_da_dati(mondo: Mondo, dati: dict):
    """Riporta `mondo` alla partita descritta da `dati` (vedi dati_salvataggio).
    Restituisce (ok, messaggio). Se il caricamento fallisce, la partita in corso
    resta com'era. Con ok=True il messaggio avverte anche quando l'impronta non
    coincide (storia cambiata dopo il salvataggio)."""
    if not isinstance(dati, dict) or dati.get("formato") != FORMATO_SALVATAGGIO:
        return False, "Questo non è un salvataggio di FAVELLA."
    if dati.get("versione", 0) > VERSIONE_FORMATO_SALVATAGGIO:
        return False, "Il salvataggio viene da una versione più recente di FAVELLA."
    if mondo._stato_iniziale is None:
        return False, "Questa partita non ha un punto di partenza da cui ricaricare."
    stessa_versione = dati.get("storia") == mondo._impronta_iniziale
    if not stessa_versione:
        # [1.3.0 / L-6] Fino alla 1.2 un salvataggio valeva solo per la versione
        # esatta della storia: una correzione che aggiungeva un oggetto rendeva
        # inutili tutti i salvataggi dei giocatori. Ora, se la storia è la stessa
        # (stesso titolo o stesso file), si rigioca la partita sulla nuova
        # versione e lo si dice.
        nome = _nome_della_storia(mondo)
        if not nome or dati.get("nome") != nome:
            return False, "Il salvataggio appartiene a un'altra storia (o a una versione diversa di questa)."
    comandi = dati.get("comandi")
    if not isinstance(comandi, list) or not all(isinstance(c, str) for c in comandi):
        return False, "Il salvataggio è danneggiato: manca la sequenza dei comandi."

    # Copia di riserva della partita in corso, stato di sessione compreso.
    riserva = mondo.cattura_stato()
    sessione = {k: copy.copy(mondo.__dict__.get(k)) for k in (
        "_storia_stati", "_pos_registro", "_registro_comandi",
        "_reg_ingresso_dialogo", "_snap_dialogo", "ultimo_comando")}

    mondo.ripristina_stato(copy.deepcopy(mondo._stato_iniziale))
    mondo._storia_stati = []
    mondo._pos_registro = []
    mondo._registro_comandi = []
    mondo._reg_ingresso_dialogo = None
    mondo._snap_dialogo = None
    mondo.ultimo_comando = None
    mondo.annunci = []
    inizio_coda = max(0, len(comandi) - CODA_ANNULLA)
    buf = io.StringIO()
    try:
        mondo._senza_istantanee = True
        with contextlib.redirect_stdout(buf):
            for i, c in enumerate(comandi):
                if mondo.stato_partita != "in_corso":
                    break
                # La coda comincia sempre FUORI da una conversazione: una
                # conversazione è un solo passo di ANNULLA, preso all'ingresso.
                if mondo._senza_istantanee and i >= inizio_coda and not mondo.in_dialogo():
                    mondo._senza_istantanee = False
                elabora_comando(mondo, c)
    except Exception as e:
        mondo._senza_istantanee = False
        mondo.ripristina_stato(riserva)
        mondo.__dict__.update(sessione)
        return False, f"Il caricamento si è interrotto ({type(e).__name__}): la partita in corso non è cambiata."
    finally:
        mondo._senza_istantanee = False
    mondo.ultimo_comando = dati.get("ultimo")
    if not stessa_versione:
        return True, (f"Partita caricata sulla nuova versione della storia (turno "
                      f"{mondo.turno_corrente}): la storia è cambiata dopo il salvataggio, "
                      f"controlla che tutto sia come lo ricordi.")
    if dati.get("impronta") and mondo.impronta_stato() != dati["impronta"]:
        return True, ("Partita caricata, ma non è identica a quella salvata: "
                      "la storia è cambiata dopo il salvataggio.")
    return True, f"Partita caricata: turno {mondo.turno_corrente}."


def _nome_della_storia(mondo: Mondo) -> str | None:
    """[1.3.0 / L-6] Il titolo dichiarato o, in mancanza, il nome del file."""
    return getattr(mondo, "titolo", None) or getattr(mondo, "file_storia", None) or None


def _nome_salvataggio(parole) -> str:
    grezzo = "-".join(parole[1:]) if len(parole) > 1 else "partita"
    nome = re.sub(r"[^0-9a-zàèéìòù_-]", "", grezzo.lower())
    return nome[:40] or "partita"


def _gestisci_salva(mondo: Mondo, nome: str):
    if mondo._impronta_iniziale is None:
        print("(Questa partita non si può salvare.)")
        return
    testo = json.dumps(dati_salvataggio(mondo), ensure_ascii=False, indent=1)
    try:
        archivio_di(mondo).scrivi(nome, testo)
    except Exception as e:
        print(f"(Salvataggio non riuscito: {e})")
        return
    print(f"(Partita salvata come «{nome}», al turno {mondo.turno_corrente}. "
          f"Per riprenderla: CARICA {nome}.)")


def _gestisci_carica(mondo: Mondo, nome: str):
    try:
        testo = archivio_di(mondo).leggi(nome)
    except Exception as e:
        print(f"(Caricamento non riuscito: {e})")
        return
    if testo is None:
        print(f"(Non c'è nessun salvataggio chiamato «{nome}».)")
        return
    try:
        dati = json.loads(testo)
    except ValueError:
        print("(Il salvataggio è danneggiato: non si riesce a leggerlo.)")
        return
    ok, messaggio = carica_da_dati(mondo, dati)
    print(f"({messaggio})")
    if ok:
        if mondo.in_dialogo():
            _mostra_nodo(mondo)
        else:
            mostra_stanza(mondo)


def _comando_di_archivio(mondo: Mondo, parole):
    """'salva [nome]' / 'carica [nome]', purché l'autore non abbia dato a quel
    verbo un significato suo ('"carica" è un comando.' per un fucile)."""
    if not parole or len(parole) > 3:
        return None
    verbo = parole[0]
    if verbo not in _VERBI_SALVA and verbo not in _VERBI_CARICA:
        return None
    if verbo in getattr(mondo, "verbi_personalizzati", ()) or verbo in getattr(mondo, "sinonimi_verbo", {}):
        return None
    # [1.3.0] 'ripristina il generatore', 'carica il carro': se il resto nomina un
    # oggetto presente non è un salvataggio, ma un'azione sul mondo.
    if len(parole) > 1 and mondo.posizione_giocatore:
        trovato, _ = risolvi_in_silenzio(mondo, " ".join(parole[1:]))
        if trovato is not None and (trovato == AMBIGUO or trovato in mondo.oggetti):
            return None
    return "salva" if verbo in _VERBI_SALVA else "carica"


# [Livello 5b] Parole che, durante una conversazione, la concludono comunque.
USCITE_DIALOGO = ("esci", "basta", "addio", "arrivederci", "smetti")


def _opzioni_disponibili(mondo: Mondo, nodo):
    """Opzioni del nodo attualmente proponibili (filtrate per condizione)."""
    return [o for o in nodo.opzioni if o.disponibile(mondo)]


def _mostra_nodo(mondo: Mondo):
    """Stampa la battuta dell'NPC al nodo corrente e l'elenco numerato delle
    opzioni disponibili. Un nodo senza opzioni chiude la conversazione."""
    npc = mondo.trova_oggetto(mondo.dialogo_attivo)
    nodo = mondo.dialogo_nodi.get(mondo.nodo_dialogo)
    if nodo is None:
        mondo.termina_dialogo()
        return
    nome = prima_maiuscola(npc.nome_visualizzato) if npc else "?"
    # [0.33.0 / Tema 4b] La battuta può variare con una condizione ('… dice "…"
    # se …'): si sceglie la prima battuta condizionale vera, altrimenti la base.
    battuta = nodo.battuta_attuale(mondo)
    if battuta:
        print(f"\n{nome}: {rendi_testo(mondo, battuta)}")
    opzioni = _opzioni_disponibili(mondo, nodo)
    if not opzioni:
        print("(La conversazione si chiude.)")
        mondo.termina_dialogo()
        return
    for i, opz in enumerate(opzioni, 1):
        print(f"  {i}. {rendi_testo(mondo, opz.testo)}")


def _avvia_dialogo(mondo: Mondo, bersaglio_grezzo: str) -> bool:
    """Avvia una conversazione con un NPC raggiungibile, posizionandosi sul suo
    nodo d'ingresso. Restituisce sempre True (il gioco continua)."""
    if not bersaglio_grezzo:
        print("Con chi vuoi parlare?")
        _senza_turno(mondo)
        return True
    id_npc = risolvi_nome_oggetto(mondo, bersaglio_grezzo)
    if not id_npc or id_npc == "<ambiguo>":
        if id_npc is None:
            print(f"Non vedo '{bersaglio_grezzo}' qui.")
        _senza_turno(mondo)
        return True
    npc = mondo.trova_oggetto(id_npc)
    if not npc or not npc.is_personaggio:
        print("Non puoi parlarci.")
        return True
    if not npc.dialogo_iniziale or npc.dialogo_iniziale not in mondo.dialogo_nodi:
        print(f"{prima_maiuscola(npc.nome_visualizzato)} non ha nulla da dire.")
        return True
    mondo.dialogo_attivo = id_npc
    mondo.nodo_dialogo = npc.dialogo_iniziale
    _mostra_nodo(mondo)
    return True


def _seleziona_opzione(comando: str, opzioni):
    """Risolve il comando del giocatore in un'opzione: per numero, poi per testo
    esatto, infine per corrispondenza parziale univoca. None se nessuna combacia."""
    if comando.isdigit():
        idx = int(comando)
        if 1 <= idx <= len(opzioni):
            return opzioni[idx - 1]
        return None
    for opz in opzioni:
        if opz.testo.strip().lower() == comando:
            return opz
    parziali = [o for o in opzioni if comando in o.testo.strip().lower()]
    return parziali[0] if len(parziali) == 1 else None


def _gestisci_scelta_dialogo(mondo: Mondo, comando: str) -> bool:
    """Gestisce un comando mentre è in corso una conversazione: seleziona
    un'opzione, ne esegue le conseguenze e transita al nodo successivo, oppure
    chiude il dialogo. Restituisce False solo se una conseguenza termina la partita."""
    if comando in USCITE_DIALOGO:
        print("Concludi la conversazione.")
        mondo.termina_dialogo()
        return True

    nodo = mondo.dialogo_nodi.get(mondo.nodo_dialogo)
    if nodo is None:
        mondo.termina_dialogo()
        return True

    opzioni = _opzioni_disponibili(mondo, nodo)
    scelta = _seleziona_opzione(comando, opzioni)
    if scelta is None:
        print("Non è una scelta valida. Indica il numero di un'opzione (o 'esci').")
        return True

    # Conseguenze della scelta (riuso della coda del Livello 3), poi transizione.
    for conseguenza in scelta.conseguenze:
        conseguenza.esegui(mondo)
    _stampa_annunci(mondo)   # [A5] movimenti NPC dalle conseguenze di una scelta
    if partita_finita(mondo):
        mondo.termina_dialogo()
        return False

    if scelta.chiude or not scelta.destinazione:
        mondo.termina_dialogo()
        print("(Fine della conversazione.)")
        return True

    if scelta.destinazione not in mondo.dialogo_nodi:
        # Nodo successivo inesistente: chiudi con grazia (già segnalato a compile-time).
        mondo.termina_dialogo()
        return True

    mondo.nodo_dialogo = scelta.destinazione
    _mostra_nodo(mondo)
    return True


def _cerca_regola(mondo: Mondo, verbi, con_oggetto: bool, id_oggetto1=None,
                  id_oggetto2=None, preposizione=None, fase: str = "invece"):
    """La regola della `fase` ('invece', 'prima', 'dopo') da applicare fra
    quelle scritte con uno dei `verbi`: (regola, altrimenti) oppure (None, False).
    `altrimenti` è vero quando vale il ramo 'altrimenti' della regola (la sua
    condizione è falsa). Precedenza (invariata dalla 0.18.0):
      FASE 0  regole a DUE oggetti (preposizione esatta, poi qualunque; in
              ciascun gruppo le condizionali soddisfatte prima delle semplici);
      FASE 1  regole a un oggetto con condizione soddisfatta;
      FASE 2  regole a un oggetto senza condizione (o col ramo 'altrimenti');
      [1.3.0] poi le stesse fasi per le regole per CATEGORIA ('qualcosa di
              pesante'): un oggetto preciso vince sempre su una categoria;
      GLOBALE regole senza bersaglio (anche per le azioni senza oggetto, es.
              'Invece di guarda se …'), nell'ordine in cui sono scritte.
    Le fasi 0–2 valgono solo se l'azione richiede un oggetto. Ogni condizione è
    valutata al più una volta per ricerca ('càpita' non pesca due volte)."""
    valutate = {}

    def vera(regola):
        chiave = id(regola)
        if chiave not in valutate:
            valutate[chiave] = regola.condizione.valuta(mondo)
        return valutate[chiave]

    def scegli(gruppo):
        for regola in gruppo:            # condizionali soddisfatte
            if regola.condizione and vera(regola):
                return regola, False
        for regola in gruppo:            # poi semplici e rami 'altrimenti'
            if not regola.condizione:
                return regola, False
            if regola.altrimenti and not vera(regola):
                return regola, True
        return None

    candidate = [r for r in mondo.regole
                 if getattr(r, "fase", "invece") == fase and r.verbo in verbi]
    if con_oggetto:
        for per_categoria in (False, True):
            def combacia(regola, id_ogg, slot_id, slot_cat):
                if per_categoria:
                    if slot_cat is not None:
                        return _nella_categoria(mondo, id_ogg, slot_cat)
                    return slot_id == id_ogg
                return slot_cat is None and slot_id == id_ogg

            def categorica(regola):
                return (getattr(regola, "categoria", None) is not None
                        or getattr(regola, "categoria_secondaria", None) is not None)

            gruppo_base = [r for r in candidate if categorica(r) == per_categoria]
            if id_oggetto2:
                for prep_esatta in (True, False):
                    gruppo = [r for r in gruppo_base
                              if combacia(r, id_oggetto1, r.id_oggetto_bersaglio, r.categoria)
                              and (r.id_oggetto_secondario is not None or r.categoria_secondaria is not None)
                              and combacia(r, id_oggetto2, r.id_oggetto_secondario, r.categoria_secondaria)
                              and (not prep_esatta or r.preposizione == preposizione)]
                    trovata = scegli(gruppo)
                    if trovata:
                        return trovata
            gruppo = [r for r in gruppo_base
                      if combacia(r, id_oggetto1, r.id_oggetto_bersaglio, r.categoria)
                      and r.id_oggetto_secondario is None and r.categoria_secondaria is None]
            trovata = scegli(gruppo)
            if trovata:
                return trovata

    for regola in candidate:
        if regola.globale:
            if regola.condizione is None or vera(regola):
                return regola, False
            if regola.altrimenti:
                return regola, True
    return None, False


def _nella_categoria(mondo: Mondo, id_oggetto, proprieta: str) -> bool:
    """[1.3.0 / M-9] L'oggetto appartiene alla categoria: 'qualcosa' ("") è
    ogni oggetto; 'qualcosa di pesante' ogni oggetto con quella proprietà (per
    radice: 'pesanti' vale 'pesante')."""
    oggetto = mondo.trova_oggetto(id_oggetto) if id_oggetto else None
    if oggetto is None:
        return False
    if proprieta == "":
        return True
    if proprieta == "prendibile":
        return bool(oggetto.prendibile)
    radice = radice_proprieta(proprieta)
    return any(radice_proprieta(p) == radice for p in oggetto.proprieta)


def _applica_regola(mondo: Mondo, regola, altrimenti: bool, mostra: bool = True) -> bool:
    """Stampa la risposta della regola (o del suo ramo 'altrimenti'), ne esegue
    le conseguenze, annuncia i movimenti; se il giocatore si è spostato mostra
    la nuova stanza. Restituisce False se la partita è finita."""
    risposta = regola.risposta_di(altrimenti)
    if risposta:   # [0.30.0/A3] regola muta: niente riga vuota
        print(rendi_testo(mondo, risposta))
    pos_prima = mondo.posizione_giocatore
    regola.esegui_conseguenze(mondo, altrimenti)
    _stampa_annunci(mondo)   # [A5] movimenti NPC dalle conseguenze della regola
    if partita_finita(mondo):
        return False
    if mostra and mondo.posizione_giocatore != pos_prima:
        mostra_stanza(mondo)
    return True


def _cerca_regola_movimento(mondo: Mondo, direzione: str, fase: str):
    """Le regole 'vai <direzione>' della fase: prima quelle con condizione
    vera, poi le semplici e i rami 'altrimenti' (come per un oggetto)."""
    valutate = {}
    gruppo = [r for r in mondo.regole if r.verbo == "vai"
              and r.id_oggetto_bersaglio == direzione and getattr(r, "fase", "invece") == fase]
    for regola in gruppo:
        if regola.condizione:
            valutate[id(regola)] = regola.condizione.valuta(mondo)
            if valutate[id(regola)]:
                return regola, False
    for regola in gruppo:
        if not regola.condizione:
            return regola, False
        if regola.altrimenti and not valutate.get(id(regola), True):
            return regola, True
    return None, False


# [1.2.2] Argomenti che, dopo 'guarda'/'osserva', non nominano un oggetto: il
# giocatore si guarda intorno ('guarda intorno' ristampa la stanza). Sono
# esclusi PRIMA di cercare l'oggetto, perché la ricerca per sottostringa li
# troverebbe dentro altri nomi ('qui' in 'liquido').
_GUARDARSI_INTORNO = ("intorno", "attorno", "qui", "qua", "tutto", "tutto intorno", "tutt'intorno")


def _ripiego_senza_oggetto(mondo: Mondo, verbo: str, id_risolto):
    """[1.2.2] Per un verbo che ha anche un'azione SENZA oggetto ('guarda',
    'osserva'): se l'argomento non nomina un oggetto presente — non trovato, o una
    direzione — il comando vale come quell'azione. 'guarda adesso', 'guarda bene',
    'guarda nord' guardano la stanza, come fino alla 1.2.1; solo 'guarda <oggetto
    presente>' esamina l'oggetto. Un nome ambiguo resta ambiguo (la domanda
    «Quale intendi?» è già stata posta). None se non c'è ripiego."""
    if id_risolto == "<ambiguo>" or (id_risolto is not None and id_risolto in mondo.oggetti):
        return None
    for nome in mondo.azioni_del_verbo.get(verbo, ()):
        azione = mondo.azioni.get(nome)
        if azione is not None and not azione.richiede_oggetto:
            return nome
    return None


def _esegui_comando(mondo: Mondo, comando_grezzo: str, ristampa: bool = True) -> bool:
    """Elabora un singolo comando (parsing + applicazione di regole/azioni),
    senza gestire l'avanzamento dei turni. Restituisce True per continuare.
    [1.3.0] ristampa=False: comando di un elenco ('prendi tutto'), la stanza si
    ristampa una volta sola alla fine."""
    try:
        comando_pulito = comando_grezzo.strip().lower()
        if not comando_pulito:
            return True

        # [Livello 5b] Se è in corso una conversazione, il comando è una scelta di
        # dialogo (numero o testo dell'opzione, oppure un'uscita): instradalo lì.
        if mondo.in_dialogo():
            return _gestisci_scelta_dialogo(mondo, comando_pulito)

        if comando_pulito in ["esci", "quit"]:
            print("A presto!")
            return False

        # --- PARSING DEL COMANDO DEL GIOCATORE ---
        # Cerchiamo preposizioni per spezzare il comando
        verbo_giocatore = ""
        argomento_sx = ""
        preposizione_trovata = None
        argomento_dx = ""

        # Tokenizzazione semplice ([1.3.0] "sull'altare" -> "sull'", "altare")
        parole = _separa_apostrofi(comando_pulito.split())
        if not parole:
            return True

        # [0.18.0 / B6] Verbo personalizzato MULTI-PAROLA: se il comando inizia con
        # un verbo dichiarato di più parole ('fai scattare'), lo si tratta come un
        # unico verbo (longest-match) e si ricompone 'parole' con la frase-verbo in
        # testa, così il resto del parsing (preposizioni, argomenti) non cambia.
        verbo_multi = _match_verbo_multiparola(mondo, parole)
        if verbo_multi:
            n = len(verbo_multi.split())
            parole = [verbo_multi] + parole[n:]

        verbo_giocatore = parole[0]

        # [0.26.0 / A6] Sinonimo di verbo dichiarato ('"ghermisci" è come prendi.'):
        # lo riscriviamo nel verbo di libreria canonico PRIMA di ogni altro
        # trattamento, così si comporta IDENTICAMENTE al verbo bersaglio (regole
        # 'Invece di prendi …', anafora, logica di default comprese).
        sinonimi = getattr(mondo, "sinonimi_verbo", None)
        if sinonimi and verbo_giocatore in sinonimi:
            verbo_giocatore = sinonimi[verbo_giocatore]

        # [1.3.0 / M-10] 'chiedi alla guardia della chiave': gli argomenti di
        # conversazione ('Se chiedi alla guardia di "chiave": …').
        if (verbo_giocatore in _VERBI_CHIEDI
                and verbo_giocatore not in mondo.mappa_verbi_giocatore):
            return _chiedi(mondo, parole[1:])

        # [Livello 5b] 'parla con X' (o 'parla X') avvia un dialogo con un NPC.
        if verbo_giocatore in ("parla", "parlare", "conversa", "conversare"):
            bersaglio = " ".join(p for p in parole[1:] if p != "con")
            return _avvia_dialogo(mondo, bersaglio)
        
        # [1.3.0 / G-7, M-5] Divisione degli argomenti: vedi _dividi_argomenti.
        argomento_sx, preposizione_trovata, argomento_dx = _dividi_argomenti(mondo, parole[1:])

        # [0.20.0 / A1] ANAFORA: 'prendila', 'aprilo', 'esaminale', 'prendi quella'
        # → l'ultimo oggetto riferito (del genere/numero giusto). Riscrive il verbo
        # (clitico staccato) e sostituisce l'argomento con l'id risolto, così il
        # resto del flusso prosegue come per un comando esplicito. [1.3.0] Vale
        # anche nei comandi a due oggetti: 'mettila nello zaino'.
        anafora = _risolvi_anafora(mondo, verbo_giocatore, argomento_sx)
        if anafora is not None:
            esito, verbo_giocatore, rif = anafora
            if esito == "vuoto":
                _senza_turno(mondo)
                return True
            argomento_sx = rif
        elif not argomento_sx and argomento_dx:
            # [1.3.0] Un solo oggetto, introdotto da una preposizione: 'guarda
            # nel cassetto', 'sali sulla scala'. Prima il cassetto andava perso.
            argomento_sx, preposizione_trovata, argomento_dx = argomento_dx, None, ""

        # [1.3.0 / G-4] 'entra', 'sali', 'scendi', 'esci dalla stanza': movimenti
        # verso dentro, su, giù, fuori (se l'autore non ne ha fatto dei verbi).
        if (verbo_giocatore in _MOVIMENTI_IMPLICITI
                and verbo_giocatore not in mondo.mappa_verbi_giocatore
                and verbo_giocatore not in mondo.direzioni):
            verso = _MOVIMENTI_IMPLICITI[verbo_giocatore]
            verbo_giocatore = verso if verso in mondo.direzioni else verbo_giocatore
            if verbo_giocatore not in mondo.direzioni:
                print(messaggio(mondo, "direzione", "Non puoi andare in quella direzione."))
                return True

        # --- Gestione Movimento ---
        # [Livello 4 / L1] La mappa forma->canonica vive sul mondo (base + custom).
        direzione_normalizzata = mondo.direzioni.get(verbo_giocatore)
        if direzione_normalizzata:
            # [1.3.0 / M-9] 'Prima di vai nord': scatta, poi il movimento prosegue.
            regola, altrimenti = _cerca_regola_movimento(mondo, direzione_normalizzata, "prima")
            if regola is not None and not _applica_regola(mondo, regola, altrimenti, mostra=False):
                return False
            # Regole 'Invece di vai <direzione>': prima le condizionali vere,
            # poi le semplici (e i rami 'altrimenti'). Come sempre, una regola
            # 'vai' che sposta il giocatore non ristampa la stanza.
            regola, altrimenti = _cerca_regola_movimento(mondo, direzione_normalizzata, "invece")
            if regola is not None:
                return _applica_regola(mondo, regola, altrimenti, mostra=False)

            vecchia_posizione = mondo.posizione_giocatore
            muovi_logica_default(mondo, direzione_normalizzata)
            if mondo.posizione_giocatore != vecchia_posizione: # Se il movimento è avvenuto
                mostra_stanza(mondo)
                # [1.3.0 / M-9] 'Dopo di vai nord': dopo che ci si è mossi.
                regola, altrimenti = _cerca_regola_movimento(mondo, direzione_normalizzata, "dopo")
                if regola is not None:
                    return _applica_regola(mondo, regola, altrimenti)
            return True

        # --- Gestione Azioni Standard ---
        # [1.2.2] Un verbo elencato da due azioni ('guarda', 'osserva') compie
        # quella indicata dall'argomento: 'guarda il quadro' esamina il quadro;
        # 'guarda', 'guarda intorno' o un argomento che non nomina un oggetto
        # presente ('guarda adesso') ristampano la stanza, come prima.
        if (argomento_sx in _GUARDARSI_INTORNO
                and len(mondo.azioni_del_verbo.get(verbo_giocatore, ())) > 1):
            argomento_sx = ""
        nome_azione = mondo.azione_del_verbo(verbo_giocatore, con_oggetto=bool(argomento_sx))
        if not nome_azione:
            print(messaggio(mondo, "non capisco", "Non capisco questo verbo."))
            _senza_turno(mondo)
            return True
        azione = mondo.azioni[nome_azione]

        id_oggetto1 = None
        id_oggetto2 = None

        if azione.richiede_oggetto:
            if not argomento_sx:
                _chiedi_oggetto(verbo_giocatore, nome_azione)
                _senza_turno(mondo)
                return True

            # [1.3.0 / M-5] 'prendi tutto', 'prendi la chiave e la torcia': un
            # comando per oggetto, tutti nello stesso turno.
            elenco = _comandi_di_elenco(mondo, verbo_giocatore, nome_azione, argomento_sx,
                                        preposizione_trovata, argomento_dx)
            if elenco is not None:
                return _esegui_elenco(mondo, elenco, nome_azione, ristampa)

            mondo._ambiguita = None
            id_oggetto1 = _risolvi_per_azione(mondo, nome_azione, argomento_sx)
            _ricorda_comando_ambiguo(mondo, parole, "sx")
            # [1.2.2] 'guarda adesso' non nomina un oggetto: si guarda la stanza.
            ripiego = _ripiego_senza_oggetto(mondo, verbo_giocatore, id_oggetto1)
            if ripiego:
                nome_azione, azione, id_oggetto1 = ripiego, mondo.azioni[ripiego], None

        if azione.richiede_oggetto:
            if not id_oggetto1 or id_oggetto1 == "<ambiguo>":
                if id_oggetto1 is None:
                    print(messaggio(mondo, "non vedo", f"Non vedo '{argomento_sx}' qui.",
                                    cosa=argomento_sx))
                _senza_turno(mondo)
                return True

            if preposizione_trovata and argomento_dx:
                id_oggetto2 = risolvi_nome_oggetto(mondo, argomento_dx)
                _ricorda_comando_ambiguo(mondo, parole, "dx")
                if not id_oggetto2 or id_oggetto2 == "<ambiguo>":
                    if id_oggetto2 is None:
                        print(messaggio(mondo, "non vedo", f"Non vedo '{argomento_dx}' qui.",
                                        cosa=argomento_dx))
                    _senza_turno(mondo)
                    return True

            # [0.20.0 / A1] Gli oggetti effettivamente nominati diventano i riferiti
            # per i pronomi successivi ('esamina la torcia' → 'prendila'). L'ultimo
            # nominato vince il proprio slot (qui ogg2 dopo ogg1).
            mondo.registra_riferito(id_oggetto1)
            if id_oggetto2:
                mondo.registra_riferito(id_oggetto2)

        # --- MOTORE DI GIOCO (Supporto 2 Oggetti; il 'se' è valutato, 0.18.0/A1) ---
        # Prima le regole scritte con la parola digitata o col nome dell'azione
        # (la ricerca di sempre: dove una regola scattava, scatta identica).
        # [1.2.2] Se nessuna si applica, quelle scritte col VERBO PRINCIPALE
        # dell'azione: 'Invece di prendi la mela' vale anche per 'raccogli la
        # mela', 'afferra la mela', 'prendere la mela'. Fino alla 1.2.1 questi
        # sinonimi, che la libreria conosce da sé, scavalcavano la regola e
        # facevano partire l'azione di default. I verbi d'autore non hanno
        # sinonimi impliciti (verbo_principale → None).
        verbi_scritti = {verbo_giocatore, nome_azione}

        def regola_della_fase(fase):
            trovata = _cerca_regola(mondo, verbi_scritti, azione.richiede_oggetto,
                                    id_oggetto1, id_oggetto2, preposizione_trovata, fase)
            if trovata[0] is None:
                principale = mondo.verbo_principale(nome_azione)
                if principale and principale not in verbi_scritti:
                    trovata = _cerca_regola(mondo, {principale}, azione.richiede_oggetto,
                                            id_oggetto1, id_oggetto2, preposizione_trovata, fase)
            return trovata

        # [1.3.0 / M-9] 'Prima di': scatta, poi l'azione prosegue (a meno che la
        # regola non abbia chiuso la partita o spostato il giocatore).
        regola, altrimenti = regola_della_fase("prima")
        if regola is not None:
            pos_prima = mondo.posizione_giocatore
            if not _applica_regola(mondo, regola, altrimenti):
                return False
            if mondo.posizione_giocatore != pos_prima:
                return True

        # [0.18.0 / B2] Se una conseguenza teletrasporta il giocatore, dopo
        # l'esecuzione mostriamo la nuova stanza (vedi _applica_regola).
        regola, altrimenti = regola_della_fase("invece")
        if regola is not None:
            return _applica_regola(mondo, regola, altrimenti)

        # 2. Esecuzione Logica di Default
        mondo._azione_riuscita = False
        if azione.logica_di_default is None:
            # [Livello 4] Verbo personalizzato senza alcuna regola applicabile:
            # non esiste una logica di default, quindi un messaggio neutro.
            print(messaggio(mondo, "niente", "Non succede nulla di particolare."))
        elif azione.richiede_oggetto:
            # [1.3.0 / G-7] 'lascia la mela sul tavolo' è 'metti la mela sul
            # tavolo'; 'prendi la mela dal tavolo' controlla da dove la si prende
            # (con altre preposizioni il secondo oggetto non conta per 'prendi').
            if nome_azione == "lasciare" and id_oggetto2 and "mettere" in mondo.azioni:
                azione = mondo.azioni["mettere"]
            elif nome_azione == "prendere" and preposizione_trovata not in _PREP_DA:
                id_oggetto2 = None
            # Passiamo anche il secondo oggetto se presente (la logica dell'azione deve supportarlo)
            try:
                azione.logica_di_default(mondo, id_oggetto1, id_oggetto2)
            except TypeError:
                # Fallback per azioni che non accettano il secondo argomento
                azione.logica_di_default(mondo, id_oggetto1)
        else:
            azione.logica_di_default(mondo)
            if nome_azione == "aiuto":
                _senza_turno(mondo)   # [1.3.0] AIUTO non è un'azione nel mondo
        
        # Se l'azione era "guarda" o "aiuto", la descrizione è già stata stampata dalla logica di default
        # Altrimenti, se l'azione ha modificato lo stato del mondo (es. prendi/lascia), ristampa la stanza
        if ristampa and _ristampa_dopo(nome_azione):
            mostra_stanza(mondo)

        # [1.3.0 / M-9] 'Dopo di': l'azione di default è riuscita (ha preso,
        # aperto, mangiato…): la regola aggiunge il suo seguito.
        if getattr(mondo, "_azione_riuscita", False):
            mondo._azione_riuscita = False
            regola, altrimenti = regola_della_fase("dopo")
            if regola is not None:
                return _applica_regola(mondo, regola, altrimenti)
        return True
    except Exception as e:
        # [0.27.0 / E] Diagnostica qui, ma l'eccezione RISALE a elabora_comando:
        # è lì che vive l'istantanea pre-turno, e il chiamante la ripristina per
        # rendere il turno ATOMICO (niente stato mutato a metà, niente avanzamento
        # del tempo su uno stato incoerente). Il gioco non crasha comunque.
        print(f"[ERRORE CRITICO] Si è verificato un errore durante l'esecuzione del comando: {e}")
        traceback.print_exc()
        raise


# [1.3.0 / M-10] ARGOMENTI DI CONVERSAZIONE
_VERBI_CHIEDI = ("chiedi", "chiedere", "domanda", "domandare")
_PAROLE_DI_RACCORDO = (_PAROLE_VUOTE | frozenset(p.rstrip("'") for p in PREPOSIZIONI)
                       | frozenset(("ad", "dell", "nell", "sull", "all", "dall",
                                    "riguardo", "circa", "informazioni", "notizie")))


def _chiedi(mondo: Mondo, parole) -> bool:
    """[1.3.0 / M-10] 'chiedi alla guardia della chiave', 'chiedi ad Anna di
    Bea', 'chiedi della chiave' (se qui c'è un solo personaggio). Cerca, fra
    gli argomenti del personaggio la cui condizione è vera, il primo che
    combacia con le parole scritte."""
    parole = _parole_di(" ".join(parole))
    raggiungibili = mondo.oggetti_raggiungibili()
    presenti = [o for o in mondo.oggetti.values() if o.is_personaggio and o.nome in raggiungibili]
    png = None
    for o in sorted(presenti, key=lambda o: -len(o.nome)):
        del_nome = [p for p in _parole_di(o.nome) if p not in _PAROLE_VUOTE]
        if del_nome and all(p in parole for p in del_nome):
            png = o
            for p in del_nome:
                parole.remove(p)
            break
    if png is None:
        if len(presenti) != 1:
            print("A chi vuoi chiedere?" if presenti else "Qui non c'è nessuno a cui chiedere.")
            _senza_turno(mondo)
            return True
        png = presenti[0]
    mondo.registra_riferito(png.nome)
    argomento = [p for p in parole if p not in _PAROLE_DI_RACCORDO]
    if not argomento:
        print(f"Cosa vuoi chiedere {con_preposizione('a', png.nome_visualizzato)}?")
        _senza_turno(mondo)
        return True
    for arg in mondo.argomenti:
        if arg.id_png != png.nome:
            continue
        if arg.condizione is not None and not arg.condizione.valuta(mondo):
            continue
        if any(_parla_di(argomento, chiave) for chiave in arg.chiavi):
            if arg.risposta:
                print(rendi_testo(mondo, arg.risposta))
            pos_prima = mondo.posizione_giocatore
            arg.esegui_conseguenze(mondo)
            _stampa_annunci(mondo)
            if partita_finita(mondo):
                return False
            if mondo.posizione_giocatore != pos_prima:
                mostra_stanza(mondo)
            return True
    print(f"{prima_maiuscola(nome_in_frase(png.nome_visualizzato))} non sa niente di questo.")
    return True


def _parla_di(scritte, chiave: str) -> bool:
    """Le parole scritte dal giocatore toccano l'argomento `chiave`: tutte le
    parole scritte sono (l'inizio di) parole della chiave, o tutte le parole
    della chiave sono fra quelle scritte."""
    della_chiave = [p for p in _parole_di(chiave) if p not in _PAROLE_VUOTE]
    if not della_chiave:
        return False
    tutte_scritte = all(any(p == k or (len(p) >= 3 and k.startswith(p)) for k in della_chiave)
                        for p in scritte)
    return tutte_scritte or all(k in scritte for k in della_chiave)


# Le azioni dopo le quali NON si ristampa la stanza (la risposta basta).
# [1.3.0] Tutte quelle nuove: ristampano solo 'lascia' e poche altre, come sempre.
_SENZA_RISTAMPA = frozenset((
    "guarda", "aiuto", "esaminare", "prendere", "usare",
    "aprire", "mangiare", "spostare",   # [1.2.2] ex «usare»
    "inventario", "_personalizzata", "_personalizzata_intransitiva", "mettere",
    "chiudere", "accendere", "spegnere", "bere", "aspettare", "toccare", "spingere",
    "tirare", "premere", "girare", "rompere", "colpire", "indossare", "togliere",
    "dare", "mostrare", "annusare", "annusare_intorno", "ascoltare", "ascoltare_intorno",
))


def _ristampa_dopo(nome_azione: str) -> bool:
    return nome_azione not in _SENZA_RISTAMPA


def _ricorda_comando_ambiguo(mondo: Mondo, parole, lato: str):
    """[1.3.0 / M-5] Se la risoluzione appena fatta ha posto la domanda «Quale
    intendi…?», ricorda il comando intero: la risposta lo completerà."""
    amb = getattr(mondo, "_ambiguita", None)
    if amb and "comando" not in amb:
        amb["comando"] = " ".join(parole)
        amb["lato"] = lato


def _completa_comando_ambiguo(amb: dict, scelto: str) -> str:
    """Il comando rimasto in sospeso con il frammento ambiguo sostituito dal
    nome dell'oggetto scelto ('prendi la chiave' + 'chiave rossa')."""
    verbo, _, resto = amb["comando"].partition(" ")
    frammento = amb["frammento"]
    if amb.get("lato") == "dx":
        testa, trovato, coda = resto.rpartition(frammento)
    else:
        testa, trovato, coda = resto.partition(frammento)
    if not trovato:
        return f"{verbo} {scelto}"
    return f"{verbo} {testa}{scelto}{coda}".replace("  ", " ")


def _comandi_di_elenco(mondo: Mondo, verbo: str, nome_azione: str, argomento: str,
                       prep: str | None, argomento_dx: str):
    """[1.3.0 / M-5] Se l'argomento è 'tutto' o un elenco di oggetti, i comandi
    singoli da eseguire; None altrimenti. Un nome che contiene «e» ('sale e
    pepe') vince sull'elenco: si divide solo se il tutto non nomina un oggetto."""
    coda = f" {prep} {argomento_dx}" if prep and argomento_dx else ""
    if argomento in _TUTTO and nome_azione in _AZIONI_CON_TUTTO:
        id_dx = risolvi_in_silenzio(mondo, argomento_dx)[0] if argomento_dx else None
        if nome_azione == "prendere":
            ids = [i for i in mondo.oggetti
                   if i in mondo.oggetti_raggiungibili()
                   and not mondo.giocatore_possiede(i)
                   and mondo.oggetti[i].prendibile
                   and not mondo.oggetti[i].is_personaggio
                   and not mondo.oggetti[i].di_scena
                   and (id_dx is None or mondo.oggetti[i].posizione == id_dx)]
            coda = ""   # 'prendi tutto dal tavolo': gli oggetti sono già quelli
            vuoto = "Non c'è niente da prendere."
        else:
            ids = [i for i in mondo.oggetti if i in mondo.inventario and i != id_dx]
            vuoto = "Non hai niente con te."
        if not ids:
            print(vuoto)
            _senza_turno(mondo)
            return []
        return [f"{verbo} {i}{coda}" for i in ids]
    if (" e " not in f" {argomento} " and "," not in argomento) \
            or risolvi_in_silenzio(mondo, argomento)[0] is not None:
        return None
    parti = [p for p in _RE_ELENCO.split(argomento) if p]
    if len(parti) < 2 or any(risolvi_in_silenzio(mondo, p)[0] is None for p in parti):
        return None
    return [f"{verbo} {p}{coda}" for p in parti]


def _esegui_elenco(mondo: Mondo, comandi, nome_azione: str, ristampa: bool) -> bool:
    """[1.3.0 / M-5] Esegue i comandi di un elenco nello stesso turno. Il turno
    passa se almeno uno dei comandi ha agito sul mondo."""
    if not comandi:
        return True
    tutti_liberi = True
    for comando in comandi:
        mondo._turno_libero = False
        continua = _esegui_comando(mondo, comando, ristampa=False)
        if not mondo._turno_libero:
            tutti_liberi = False
        if not continua:
            mondo._turno_libero = False
            return False
    mondo._turno_libero = tutti_liberi
    mondo._ambiguita = None
    if ristampa and not tutti_liberi and _ristampa_dopo(nome_azione):
        mostra_stanza(mondo)
    return True


def intestazione(mondo: Mondo, invito: str = ""):
    """[1.3.0 / M-6] L'apertura della partita: il titolo della storia (o quello
    del motore), l'autore, l'invito sui comandi e il prologo. Condivisa da
    terminale, IDE, playground e pagina esportata."""
    titolo = getattr(mondo, "titolo", None)
    print(f"--- {titolo.upper()} ---" if titolo else "--- BENVENUTO IN FAVELLA 1 ---")
    autore = getattr(mondo, "autore", None)
    if autore:
        print(f"di {autore}")
    if invito:
        print(invito)
    prologo = getattr(mondo, "prologo", None)
    if prologo:
        print("\n" + rendi_testo(mondo, prologo))


# [0.21.0 / A3] TRASCRIZIONE: duplica l'output del gioco su un file di testo,
# così il giocatore può conservare il resoconto della partita. È una funzione
# della SESSIONE da riga di comando (vive nel loop, non nel mondo): scrive sia
# l'output del motore sia i comandi digitati.
class _Tee:
    """Scrive su due flussi (lo schermo e il file della trascrizione)."""
    def __init__(self, primario, secondario):
        self._primario = primario
        self._secondario = secondario

    def write(self, testo):
        self._primario.write(testo)
        self._secondario.write(testo)
        return len(testo)

    def flush(self):
        self._primario.flush()
        self._secondario.flush()


def gioca(mondo: Mondo):
    """Avvia il ciclo di gioco interattivo."""
    # Robustezza console: un carattere fuori da cp1252 in un testo della storia
    # non deve far crashare la partita su Windows. Copre OGNI avvio interattivo
    # (CLI 'favella1', 'python gioco.py', IDE), idempotente.
    assicura_console_utf8()
    mondo.carica_azioni(LIBRERIA_AZIONI)
    mondo.imposta_posizione_iniziale()

    if not mondo.posizione_giocatore:
        print("[ERRORE FATALE] Nessuna stanza definita. Impossibile avviare il gioco.")
        return

    print("")
    intestazione(mondo, "Scrivi 'esci' per terminare. Comandi utili: ANNULLA, ANCORA, "
                        "SALVA, CARICA, RICOMINCIA, TRASCRIZIONE.")
    mostra_stanza(mondo)

    trascrizione = None   # file aperto della trascrizione, o None
    # Flusso (già riconfigurato a UTF-8) a cui tornare quando la trascrizione si
    # chiude: NON sys.__stdout__, che è il flusso grezzo cp1252 e farebbe
    # ricomparire il crash sui caratteri non-Windows-1252.
    stdout_console = sys.stdout
    try:
        while True:
            print("")
            try:
                comando_grezzo = input("> ")
            except EOFError:
                print("\nA presto!"); break

            # [0.21.0 / A3] TRASCRIZIONE: comando di sessione, gestito qui nel loop.
            if comando_grezzo.strip().lower() == "trascrizione":
                if trascrizione is None:
                    trascrizione = open("trascrizione-favella.txt", "w", encoding="utf-8")
                    sys.stdout = _Tee(stdout_console, trascrizione)
                    print("(Trascrizione AVVIATA: la partita viene salvata in "
                          "'trascrizione-favella.txt'.)")
                else:
                    print("(Trascrizione TERMINATA.)")
                    sys.stdout = stdout_console
                    trascrizione.close()
                    trascrizione = None
                continue

            if trascrizione is not None:
                # Il prompt '> ' è già finito nel file (scritto da input() via Tee);
                # qui si aggiunge solo il comando digitato (l'eco del terminale non
                # passa da stdout).
                trascrizione.write(f"{comando_grezzo}\n")

            if not elabora_comando(mondo, comando_grezzo):
                # [1.3.0] A partita finita si resta nel ciclo: il motore ha già
                # detto che si può ANNULLARE, RICOMINCIARE o CARICARE. Si esce
                # quando il giocatore lo chiede (FINE, o SÌ dopo 'esci').
                if (getattr(mondo, "_uscita_richiesta", False)
                        or getattr(mondo, "stato_partita", "in_corso") == "in_corso"):
                    break
    finally:
        if trascrizione is not None:
            sys.stdout = stdout_console
            trascrizione.close()


def main():
    if len(sys.argv) != 2:
        print("Uso: python gioco.py <percorso_file.fav>")
        sys.exit(1)
    percorso_file = sys.argv[1]
    try:
        print(f"[FAVELLA 1] Compilazione di '{percorso_file}' in corso...")
        mondo_compilato = analizza_file(percorso_file)
        if mondo_compilato is None:
            print("\n[FAVELLA 1] Compilazione fallita. Correggi gli errori e riprova.")
            sys.exit(1)
        print(str(mondo_compilato))
        gioca(mondo_compilato)
    except FileNotFoundError:
        print(f"[ERRORE FATALE] Il file '{percorso_file}' non è stato trovato.")
    except Exception as e:
        print(f"[ERRORE FATALE] Si è verificato un errore imprevisto: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    main()