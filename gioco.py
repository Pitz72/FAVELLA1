# gioco.py
# Interprete Interattivo per FAVELLA 1 (v0.28.0)

import sys
import traceback
from compilatore import analizza_file
from strutture import Mondo
from utils import normalizza_nome, rendi_testo, frase_indeterminativa, prima_maiuscola
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
        print("È buio pesto.")
        return

    print(rendi_testo(mondo, stanza_corrente.descrizione_attuale(mondo)))

    oggetti_nella_stanza = list(stanza_corrente.oggetti.values())
    if oggetti_nella_stanza:
        # [Livello 5] Articolo indeterminativo concordato (genere/numero inferiti
        # dal nome dichiarato): "Puoi vedere qui: una torcia, un tavolo.".
        nomi_oggetti = [frase_indeterminativa(ogg.nome_visualizzato) for ogg in oggetti_nella_stanza]
        print(f"Puoi vedere qui: {', '.join(nomi_oggetti)}.")

    # [0.20.0 / A1] Gli oggetti elencati sono ora «nominati»: diventano riferibili
    # dai pronomi ('entri… → prendila').
    mondo.registra_riferiti_da_stanza()

    # Mostra le uscite disponibili
    if stanza_corrente.uscite:
        uscite_str = ", ".join([f"{prima_maiuscola(d)} ({prima_maiuscola(mondo.trova_stanza(id_s).nome_visualizzato)})" for d, id_s in stanza_corrente.uscite.items()])
        print(f"Uscite: {uscite_str}.")

def risolvi_nome_oggetto(mondo: Mondo, nome_parziale: str) -> str | None:
    """Cerca di risolvere un nome parziale in un ID oggetto univoco nello scope attuale."""
    if not nome_parziale:
        return None

    stanza_corrente = mondo.trova_stanza(mondo.posizione_giocatore)
    if not stanza_corrente:
        return None

    # [Livello 4 / M1] Lo scope include il contenuto dei contenitori aperti e dei
    # supporti raggiungibili, non solo gli oggetti direttamente nella stanza.
    oggetti_in_scope = list(mondo.oggetti_raggiungibili())

    # Priorità 0: Direzioni (anche con "a " davanti). [Livello 4 / L1] La mappa
    # forma->canonica vive sul mondo (base + personalizzate).
    nome_pulito = nome_parziale.strip().lower()
    if nome_pulito.startswith("a ") and len(nome_pulito) > 2:
        nome_pulito = nome_pulito[2:].strip()

    if nome_pulito in mondo.direzioni:
        return mondo.direzioni[nome_pulito]

    # Normalizza l'input per trovare gli oggetti del gioco
    nome_normalizzato = normalizza_nome(nome_parziale)

    # [Livello 4] Risoluzione alias: un nome alternativo dichiarato dall'autore
    # ('La torcia si chiama anche "lanterna".') rimanda all'id canonico. Il nome
    # proprio dell'oggetto ha comunque la precedenza (controllato dopo).
    alias = getattr(mondo, "alias", {})
    nome_risolto = alias.get(nome_normalizzato, nome_normalizzato)

    # Priorità 1: Corrispondenza esatta (sul nome, poi sull'alias risolto)
    if nome_normalizzato in oggetti_in_scope:
        return nome_normalizzato
    if nome_risolto in oggetti_in_scope:
        return nome_risolto

    # Priorità 2: Corrispondenza parziale univoca. Il pool di candidati include
    # gli id in scope e gli alias (parziali) che rimandano a oggetti in scope.
    candidati = [id_ogg for id_ogg in oggetti_in_scope if nome_normalizzato in id_ogg]
    for ali, canonico in alias.items():
        if canonico in oggetti_in_scope and nome_normalizzato in ali and canonico not in candidati:
            candidati.append(canonico)

    if len(candidati) == 1:
        return candidati[0]
    elif len(candidati) > 1:
        print(f"Quale intendi di preciso? ({', '.join(candidati)})")
        return "<ambiguo>"
    else:
        return None


# [0.18.0 / A4] Le preposizioni d'azione del parser runtime includono ora le
# forme ARTICOLATE (simmetriche alla grammatica): il giocatore può digitare
# 'usa la batteria sul pannello' o 'metti la spada nella teca'. Le forme semplici
# (su/con/contro/in) restano valide. Lo split sceglie la prima parola-preposizione
# trovata; la risoluzione dell'oggetto a destra ignora comunque l'articolo.
PREPOSIZIONI = [
    "su", "sul", "sullo", "sulla", "sui", "sugli", "sulle", "sull'",
    "con", "contro",
    "in", "nel", "nello", "nella", "nei", "negli", "nelle", "nell'",
]


def _match_verbo_multiparola(mondo: Mondo, parole) -> str | None:
    """[0.18.0 / B6] Se il comando del giocatore inizia con un verbo personalizzato
    MULTI-PAROLA dichiarato, restituisce quel verbo (il più lungo che combacia come
    prefisso, in numero di parole); altrimenti None. I verbi monoparola non sono
    considerati qui (li gestisce il normale parole[0])."""
    verbi = getattr(mondo, "verbi_personalizzati", None) or ()
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
        print(f"Cosa vorresti {nuovo_verbo}?")
        return ("vuoto", nuovo_verbo, None)
    if rif not in mondo.oggetti_raggiungibili():
        print(f"Non {_PRON_DISPLAY[gn]} vedi più.")
        return ("vuoto", nuovo_verbo, None)
    return ("ok", nuovo_verbo, rif)


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
    # [Audit 0.17.0] A partita conclusa il comando è un no-op: niente turni, niente
    # eventi/demoni. Difende dai chiamanti che ignorano il False di ritorno (in un
    # loop corretto non si arriva mai qui dopo la fine). Si controlla lo stato
    # SENZA passare da partita_finita(), che ristamperebbe l'esito.
    if getattr(mondo, "stato_partita", "in_corso") != "in_corso":
        return False
    comando_pulito = comando_grezzo.strip().lower()
    if not comando_pulito:
        return True
    # [Livello 5b] Durante una conversazione 'esci' chiude il dialogo (gestito in
    # _esegui_comando), NON il gioco: l'uscita dal gioco vale solo fuori dialogo.
    era_in_dialogo = mondo.in_dialogo()
    if not era_in_dialogo and comando_pulito in ["esci", "quit"]:
        print("A presto!")
        return False

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
    snap = mondo.cattura_stato() if not era_in_dialogo else None

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
    if not continua:
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
        return True
    if appena_uscito:
        if mondo._snap_dialogo is not None:
            _registra_istantanea(mondo, mondo._snap_dialogo)
            mondo._snap_dialogo = None
        # ultimo_comando NON aggiornato: ANCORA non deve ripetere un comando di dialogo.
        return True
    if mondo.in_dialogo():
        return True   # scelta intermedia: ancora in conversazione
    # Turno consumato: registra l'istantanea (per ANNULLA) e il comando (per ANCORA).
    if snap is not None:
        _registra_istantanea(mondo, snap)
        mondo.ultimo_comando = comando_grezzo
    if avanza_turno_e_processa(mondo):
        return False
    return True


# [0.21.0 / A3] Profondità massima della pila di ANNULLA: si possono disfare
# fino a N turni. Tetto di memoria (ogni passo è un'istantanea del mondo).
_MAX_ANNULLA = 100


def _registra_istantanea(mondo: Mondo, snap: dict):
    """[0.27.0] Mette un'istantanea sulla pila di ANNULLA, rispettando il tetto di
    memoria (_MAX_ANNULLA): si scorda la più vecchia. Condiviso dal turno normale
    e dalla chiusura di un dialogo (vedi elabora_comando)."""
    mondo._storia_stati.append(snap)
    if len(mondo._storia_stati) > _MAX_ANNULLA:
        mondo._storia_stati.pop(0)


def _gestisci_annulla(mondo: Mondo):
    """[0.21.0 / A3] Riporta il mondo allo stato precedente l'ultimo turno."""
    if not mondo._storia_stati:
        print("Non c'è niente da annullare.")
        return
    mondo.ripristina_stato(mondo._storia_stati.pop())
    print("(Hai annullato l'ultimo turno.)")
    mostra_stanza(mondo)


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
    if nodo.battuta:
        print(f"\n{nome}: {rendi_testo(mondo, nodo.battuta)}")
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
        return True
    id_npc = risolvi_nome_oggetto(mondo, bersaglio_grezzo)
    if not id_npc or id_npc == "<ambiguo>":
        if id_npc is None:
            print(f"Non vedo '{bersaglio_grezzo}' qui.")
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


def _esegui_comando(mondo: Mondo, comando_grezzo: str) -> bool:
    """Elabora un singolo comando (parsing + applicazione di regole/azioni),
    senza gestire l'avanzamento dei turni. Restituisce True per continuare."""
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

        # --- PARSING INTELLIGENTE v0.2 ---
        # Cerchiamo preposizioni per spezzare il comando
        verbo_giocatore = ""
        argomento_sx = ""
        preposizione_trovata = None
        argomento_dx = ""

        # Tokenizzazione semplice
        parole = comando_pulito.split()
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

        # [Livello 5b] 'parla con X' (o 'parla X') avvia un dialogo con un NPC.
        if verbo_giocatore in ("parla", "parlare", "conversa", "conversare"):
            bersaglio = " ".join(p for p in parole[1:] if p != "con")
            return _avvia_dialogo(mondo, bersaglio)
        
        # Cerca la prima preposizione nota
        indice_prep = -1
        for i, parola in enumerate(parole):
            if parola in PREPOSIZIONI:
                indice_prep = i
                preposizione_trovata = parola
                break
        
        if indice_prep > 0: # Trovata preposizione (non come prima parola)
            # Ricostruisci le parti
            # Esempio: "usa chiave con porta" -> verbo="usa", arg_sx="chiave", prep="con", arg_dx="porta"
            argomento_sx = " ".join(parole[1:indice_prep])
            argomento_dx = " ".join(parole[indice_prep+1:])
        else:
            # Parsing classico SVO (Verbo + Oggetto)
            argomento_sx = " ".join(parole[1:])

        # [0.20.0 / A1] ANAFORA: 'prendila', 'aprilo', 'esaminale', 'prendi quella'
        # → l'ultimo oggetto riferito (del genere/numero giusto). Riscrive il verbo
        # (clitico staccato) e sostituisce l'argomento con l'id risolto, così il
        # resto del flusso prosegue come per un comando esplicito. Non si applica ai
        # comandi a due oggetti (con preposizione).
        if not preposizione_trovata:
            anafora = _risolvi_anafora(mondo, verbo_giocatore, argomento_sx)
            if anafora is not None:
                esito, verbo_giocatore, rif = anafora
                if esito == "vuoto":
                    return True
                argomento_sx = rif

        # --- Gestione Movimento ---
        # [Livello 4 / L1] La mappa forma->canonica vive sul mondo (base + custom).
        direzione_normalizzata = mondo.direzioni.get(verbo_giocatore)
        if direzione_normalizzata:
            # Check per regole "Invece di vai a [direzione]"
            # Simuliamo un'azione "vai" con oggetto "direzione"
            regola_movimento_applicata = False
            
            # FASE 1: Regole Condizionali
            for regola in mondo.regole:
                if (regola.verbo == "vai" and regola.id_oggetto_bersaglio == direzione_normalizzata):
                    if regola.condizione and regola.condizione.valuta(mondo):
                        print(rendi_testo(mondo, regola.risposta))
                        regola.esegui_conseguenze(mondo)
                        regola_movimento_applicata = True
                        break
            
            # FASE 2: Regole Semplici
            if not regola_movimento_applicata:
                for regola in mondo.regole:
                    if (regola.verbo == "vai" and regola.id_oggetto_bersaglio == direzione_normalizzata):
                        if not regola.condizione:
                            print(rendi_testo(mondo, regola.risposta))
                            regola.esegui_conseguenze(mondo)
                            regola_movimento_applicata = True
                            break

            if regola_movimento_applicata:
                _stampa_annunci(mondo)   # [A5] movimenti NPC dalle regole 'vai'
                if partita_finita(mondo):
                    return False
                return True

            vecchia_posizione = mondo.posizione_giocatore
            muovi_logica_default(mondo, direzione_normalizzata)
            if mondo.posizione_giocatore != vecchia_posizione: # Se il movimento è avvenuto
                mostra_stanza(mondo)
            return True

        # --- Gestione Azioni Standard ---
        nome_azione = mondo.mappa_verbi_giocatore.get(verbo_giocatore)
        if not nome_azione:
            print("Non capisco questo verbo.")
            return True
        azione = mondo.azioni[nome_azione]

        id_oggetto1 = None
        id_oggetto2 = None

        if azione.richiede_oggetto:
            if not argomento_sx:
                print(f"Cosa vorresti {verbo_giocatore}?")
                return True
            
            id_oggetto1 = risolvi_nome_oggetto(mondo, argomento_sx)
            if not id_oggetto1 or id_oggetto1 == "<ambiguo>":
                if id_oggetto1 is None:
                    print(f"Non vedo '{argomento_sx}' qui.")
                return True
            
            if preposizione_trovata and argomento_dx:
                id_oggetto2 = risolvi_nome_oggetto(mondo, argomento_dx)
                if not id_oggetto2 or id_oggetto2 == "<ambiguo>":
                    if id_oggetto2 is None:
                        print(f"Non vedo '{argomento_dx}' qui.")
                    return True

            # [0.20.0 / A1] Gli oggetti effettivamente nominati diventano i riferiti
            # per i pronomi successivi ('esamina la torcia' → 'prendila'). L'ultimo
            # nominato vince il proprio slot (qui ogg2 dopo ogg1).
            mondo.registra_riferito(id_oggetto1)
            if id_oggetto2:
                mondo.registra_riferito(id_oggetto2)

        # --- MOTORE DI GIOCO (Supporto 2 Oggetti; il 'se' è valutato, 0.18.0/A1) ---
        regola_applicata = False
        regola_da_eseguire = None # Memorizza la regola trovata per eseguirne la conseguenza
        
        if azione.richiede_oggetto:
            verbi_da_controllare = {verbo_giocatore, nome_azione}
            
            # FASE 0: Regole a DUE OGGETTI (Priorità Massima). [0.18.0] Come le
            # regole a un oggetto (FASE 1/2), ora VALUTANO la clausola 'se': fra
            # più regole che combaciano su verbo+ogg1+prep+ogg2 vince la prima
            # CONDIZIONALE soddisfatta; in assenza, la prima SEMPLICE. Prima si
            # privilegia la preposizione esatta, poi (fallback tollerante) si
            # accetta qualunque preposizione sugli stessi due oggetti. Senza
            # questa valutazione del 'se', più 'Invece di usa X su Y se …'
            # collassavano (vinceva sempre la prima dichiarata).
            if id_oggetto2:
                def _combacia_due_oggetti(regola, prep_esatta):
                    if not (regola.verbo in verbi_da_controllare and
                            regola.id_oggetto_bersaglio == id_oggetto1 and
                            regola.id_oggetto_secondario == id_oggetto2):
                        return False
                    if prep_esatta:
                        return regola.preposizione == preposizione_trovata
                    return True

                # Quattro tier, in ordine di precedenza: per la preposizione
                # esatta prima e poi tollerante, dentro ciascuna le condizionali
                # soddisfatte prima delle semplici.
                for prep_esatta in (True, False):
                    if regola_applicata:
                        break
                    for regola in mondo.regole:  # condizionali soddisfatte
                        if (_combacia_due_oggetti(regola, prep_esatta)
                                and regola.condizione
                                and regola.condizione.valuta(mondo)):
                            print(rendi_testo(mondo, regola.risposta))
                            regola_applicata = True
                            regola_da_eseguire = regola
                            break
                    if regola_applicata:
                        break
                    for regola in mondo.regole:  # poi le semplici
                        if _combacia_due_oggetti(regola, prep_esatta) and not regola.condizione:
                            print(rendi_testo(mondo, regola.risposta))
                            regola_applicata = True
                            regola_da_eseguire = regola
                            break
            
            # FASE 1: Regole Condizionali (1 Oggetto)
            if not regola_applicata:
                for regola in mondo.regole:
                    if (regola.verbo in verbi_da_controllare and 
                        regola.id_oggetto_bersaglio == id_oggetto1 and
                        regola.id_oggetto_secondario is None): # Importante: solo regole a 1 oggetto
                        
                        if regola.condizione and regola.condizione.valuta(mondo):
                            print(rendi_testo(mondo, regola.risposta))
                            regola_applicata = True
                            regola_da_eseguire = regola
                            break
            
            # FASE 2: Regole Semplici (1 Oggetto)
            if not regola_applicata:
                for regola in mondo.regole:
                    if (regola.verbo in verbi_da_controllare and 
                        regola.id_oggetto_bersaglio == id_oggetto1 and
                        regola.id_oggetto_secondario is None):
                        
                        if not regola.condizione:
                            print(rendi_testo(mondo, regola.risposta))
                            regola_applicata = True
                            regola_da_eseguire = regola
                            break

        # FASE GLOBALE: Regole senza oggetto bersaglio (Livello 5). Scattano sul
        # solo verbo, se la loro condizione è soddisfatta, quando nessuna regola
        # specifica si è attivata. Valgono anche per le azioni che NON richiedono
        # un oggetto (es. 'Invece di guarda se il punteggio è almeno 3: ...'), per
        # cui le fasi 0–2 sopra non vengono nemmeno eseguite. Una regola specifica
        # ha sempre la precedenza su una globale (questa fase viene dopo).
        if not regola_applicata:
            verbi_da_controllare = {verbo_giocatore, nome_azione}
            for regola in mondo.regole:
                if (regola.id_oggetto_bersaglio is None
                        and regola.verbo in verbi_da_controllare):
                    if regola.condizione is None or regola.condizione.valuta(mondo):
                        print(rendi_testo(mondo, regola.risposta))
                        regola_applicata = True
                        regola_da_eseguire = regola
                        break

        if regola_applicata:
            if regola_da_eseguire:
                # [0.18.0 / B2] Se una conseguenza teletrasporta il giocatore, dopo
                # l'esecuzione mostriamo la nuova stanza (come per il movimento via
                # direzioni), così l'effetto è visibile e non muto.
                pos_prima = mondo.posizione_giocatore
                regola_da_eseguire.esegui_conseguenze(mondo)
                _stampa_annunci(mondo)   # [A5] movimenti NPC dalle conseguenze della regola
                if partita_finita(mondo):
                    return False
                if mondo.posizione_giocatore != pos_prima:
                    mostra_stanza(mondo)
            return True

        # 2. Esecuzione Logica di Default
        if azione.logica_di_default is None:
            # [Livello 4] Verbo personalizzato senza alcuna regola applicabile:
            # non esiste una logica di default, quindi un messaggio neutro.
            print("Non succede nulla di particolare.")
        elif azione.richiede_oggetto:
            # Passiamo anche il secondo oggetto se presente (la logica dell'azione deve supportarlo)
            try:
                azione.logica_di_default(mondo, id_oggetto1, id_oggetto2)
            except TypeError:
                # Fallback per azioni che non accettano il secondo argomento
                azione.logica_di_default(mondo, id_oggetto1)
        else:
            azione.logica_di_default(mondo)
        
        # Se l'azione era "guarda" o "aiuto", la descrizione è già stata stampata dalla logica di default
        # Altrimenti, se l'azione ha modificato lo stato del mondo (es. prendi/lascia), ristampa la stanza
        if nome_azione not in ["guarda", "aiuto", "esaminare", "prendere", "usare", "inventario", "_personalizzata", "_personalizzata_intransitiva", "mettere"]:
            mostra_stanza(mondo)
        
        return True
    except Exception as e:
        # [0.27.0 / E] Diagnostica qui, ma l'eccezione RISALE a elabora_comando:
        # è lì che vive l'istantanea pre-turno, e il chiamante la ripristina per
        # rendere il turno ATOMICO (niente stato mutato a metà, niente avanzamento
        # del tempo su uno stato incoerente). Il gioco non crasha comunque.
        print(f"[ERRORE CRITICO] Si è verificato un errore durante l'esecuzione del comando: {e}")
        traceback.print_exc()
        raise


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
    mondo.carica_azioni(LIBRERIA_AZIONI)
    mondo.imposta_posizione_iniziale()

    if not mondo.posizione_giocatore:
        print("[ERRORE FATALE] Nessuna stanza definita. Impossibile avviare il gioco.")
        return

    print("\n--- BENVENUTO IN FAVELLA 1 ---")
    print("Scrivi 'esci' per terminare. Comandi utili: ANNULLA, ANCORA, TRASCRIZIONE.")
    mostra_stanza(mondo)

    trascrizione = None   # file aperto della trascrizione, o None
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
                    sys.stdout = _Tee(sys.__stdout__, trascrizione)
                    print("(Trascrizione AVVIATA: la partita viene salvata in "
                          "'trascrizione-favella.txt'.)")
                else:
                    print("(Trascrizione TERMINATA.)")
                    sys.stdout = sys.__stdout__
                    trascrizione.close()
                    trascrizione = None
                continue

            if trascrizione is not None:
                # Il prompt '> ' è già finito nel file (scritto da input() via Tee);
                # qui si aggiunge solo il comando digitato (l'eco del terminale non
                # passa da stdout).
                trascrizione.write(f"{comando_grezzo}\n")

            if not elabora_comando(mondo, comando_grezzo):
                break
    finally:
        if trascrizione is not None:
            sys.stdout = sys.__stdout__
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