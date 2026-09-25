# libreria_azioni.py
# Libreria Standard delle Azioni per FAVELLA 1 (v1.2.2)

from strutture import Mondo, Azione, ConseguenzaProprieta
from favella_utils import (rendi_testo, frase_indeterminativa, prima_maiuscola, nome_in_frase,
                           con_preposizione, accorda, pronome_oggetto, radice_proprieta)

def _riuscita(mondo: Mondo):
    """[1.3.0] L'azione di default ha fatto ciò che doveva (preso, aperto,
    spostato…): le regole 'Dopo di' possono scattare (vedi gioco.py)."""
    mondo._azione_riuscita = True


def _nome(oggetto) -> str:
    """Il nome dell'oggetto a metà frase ('la mela', non 'La mela')."""
    return nome_in_frase(oggetto.nome_visualizzato)


def _Nome(oggetto) -> str:
    """Il nome dell'oggetto a inizio frase."""
    return prima_maiuscola(nome_in_frase(oggetto.nome_visualizzato))


def _ha(oggetto, proprieta: str) -> bool:
    """L'oggetto ha la proprietà (per radice: 'aperto' vale 'aperta')."""
    r = radice_proprieta(proprieta)
    return any(radice_proprieta(p) == r for p in oggetto.proprieta)


def _imposta(mondo: Mondo, oggetto, proprieta: str):
    """Assegna la proprietà togliendo le opposte, come una conseguenza d'autore."""
    ConseguenzaProprieta(oggetto.nome, proprieta).esegui(mondo)


def _elenca_contenuto(mondo: Mondo, oggetto):
    """[Livello 4 / M1] Stampa il contenuto di un contenitore/supporto, se ne è
    uno e (per i contenitori) se è aperto."""
    if oggetto.is_contenitore and not mondo.contenitore_aperto(oggetto):
        print(f"È {accorda(oggetto.nome_visualizzato, 'chiuso')}.")
        return
    if oggetto.is_contenitore or oggetto.is_supporto:
        nomi = [frase_indeterminativa(mondo.oggetti[c].nome_visualizzato)
                for c in sorted(oggetto.contenuto) if c in mondo.oggetti]
        if nomi:
            dove = "Sopra" if oggetto.is_supporto else "Dentro"
            print(f"{dove} vedi: {', '.join(nomi)}.")

def esamina_logica_default(mondo: Mondo, id_oggetto: str):
    """Logica di default per l'azione ESAMINARE."""
    # [0.24.0 / A4] Al buio non si esamina nulla (una regola d'autore 'Invece di
    # esamina X' ha comunque la precedenza: è valutata prima della logica di default).
    if not mondo.c_e_luce():
        print("È troppo buio per vederci.")
        return
    oggetto = mondo.trova_oggetto(id_oggetto)
    if oggetto and mondo.oggetto_raggiungibile(id_oggetto):
        print(rendi_testo(mondo, oggetto.descrizione_attuale(mondo)))
        _elenca_contenuto(mondo, oggetto)
        _riuscita(mondo)
    else:
        print("Non vedi nulla del genere qui.")

def prendi_logica_default(mondo: Mondo, id_oggetto: str, id_da: str = None):
    """Logica di default per l'azione PRENDERE. [1.3.0 / G-7] Con un secondo
    oggetto ('prendi la mela DAL tavolo') controlla che la mela sia davvero lì."""
    # [0.24.0 / A4] Al buio non si raccoglie nulla a tentoni (le regole d'autore
    # restano prioritarie). Un oggetto luminoso a terra rischiara la stanza, quindi
    # 'c_e_luce' è già vero in quel caso: lo si può prendere senza problemi.
    if not mondo.c_e_luce():
        print("È troppo buio per vederci.")
        return
    oggetto = mondo.trova_oggetto(id_oggetto)
    if not oggetto or not mondo.oggetto_raggiungibile(id_oggetto):
        print("Non vedi nulla del genere qui.")
        return
    if id_oggetto in mondo.inventario:
        print("Ce l'hai già.")
        return
    da = mondo.trova_oggetto(id_da) if id_da else None
    if da is not None and oggetto.posizione != id_da:
        dove = "su" if da.is_supporto else "in"
        print(f"{_Nome(oggetto)} non è {con_preposizione(dove, da.nome_visualizzato)}.")
        return
    if not oggetto.prendibile:
        # [1.3.0 / M-4] Il pronome si accorda: 'Non puoi prenderla.'
        print(f"Non puoi prender{pronome_oggetto(oggetto.nome_visualizzato)}.")
        return
    # [Livello 7] Capacità di trasporto opzionale: se l'autore l'ha dichiarata,
    # l'inventario non può superarla (la base più i bonus degli oggetti già
    # portati, es. uno zaino). Senza dichiarazione → illimitato.
    # [1.2.2] Conta tutto ciò che il giocatore ha addosso, anche dentro zaini e
    # borse, e il contenuto dell'oggetto preso (Mondo.puo_prendere).
    if not mondo.puo_prendere(oggetto):
        print(f"Hai le mani troppo piene: lascia qualcosa prima di prender{pronome_oggetto(oggetto.nome_visualizzato)}.")
        return

    # [Livello 4 / M1] Rimuove l'oggetto da dove si trova (stanza, contenitore o
    # supporto) e lo mette nell'inventario.
    mondo.rimuovi_da_posizione(oggetto)
    mondo.inventario.add(id_oggetto)
    oggetto.posizione = "inventario"
    print(f"Preso: {_nome(oggetto)}.")
    _riuscita(mondo)

def metti_logica_default(mondo: Mondo, id_oggetto1: str, id_oggetto2: str = None):
    """[Livello 4 / M1] Logica di default per METTERE [ogg1] in/su [ogg2]."""
    # [0.24.0 / A4] Al buio non si manipola nulla.
    if not mondo.c_e_luce():
        print("È troppo buio per vederci.")
        return
    if not id_oggetto2:
        print("Dove vuoi metterlo?")
        return
    oggetto = mondo.trova_oggetto(id_oggetto1)
    dest = mondo.trova_oggetto(id_oggetto2)
    if not oggetto or not mondo.oggetto_raggiungibile(id_oggetto1):
        print("Non ce l'hai e non lo vedi qui.")
        return
    if not dest or not mondo.oggetto_raggiungibile(id_oggetto2):
        print("Non vedi nulla del genere qui.")
        return
    if id_oggetto1 == id_oggetto2:
        print("Non puoi metterlo dentro se stesso.")
        return
    if not (dest.is_contenitore or dest.is_supporto):
        print(f"{prima_maiuscola(con_preposizione('in', dest.nome_visualizzato))} "
              f"non ci puoi mettere niente.")
        return
    if dest.is_contenitore and not mondo.contenitore_aperto(dest):
        print(f"{_Nome(dest)} è {accorda(dest.nome_visualizzato, 'chiuso')}.")
        return
    # [1.2.2] Mettere qualcosa da terra in uno zaino che si porta significa
    # portarlo: pesa sulla capienza come prenderlo (fino alla 1.2.1 uno zaino
    # contenitore portava oggetti senza limite).
    cap = mondo.capacita_attuale()
    if (cap is not None and mondo.giocatore_possiede(id_oggetto2)
            and not mondo.giocatore_possiede(id_oggetto1)
            and mondo.numero_oggetti_portati() + 1 + len(mondo.racchiusi_in(id_oggetto1)) > cap):
        print("Porti già troppe cose: non c'è posto per altro.")
        return

    mondo.rimuovi_da_posizione(oggetto)
    dest.contenuto.add(id_oggetto1)
    oggetto.posizione = id_oggetto2
    dove = "su" if dest.is_supporto else "in"
    print(f"Hai messo {_nome(oggetto)} {con_preposizione(dove, dest.nome_visualizzato)}.")
    _riuscita(mondo)

def lascia_logica_default(mondo: Mondo, id_oggetto: str):
    """Logica di default per l'azione LASCIARE."""
    # [0.27.0 / C] Al buio non si manipola nulla, coerente con prendi/metti/esamina
    # (prima 'lascia' sfuggiva al blocco). Una fonte di luce accesa in mano rende
    # comunque 'c_e_luce' vero, quindi posarla per illuminare resta possibile.
    if not mondo.c_e_luce():
        print("È troppo buio per vederci.")
        return
    if not mondo.giocatore_possiede(id_oggetto):
        print("Non ce l'hai.")
        return

    oggetto = mondo.trova_oggetto(id_oggetto)
    stanza_corrente = mondo.trova_stanza(mondo.posizione_giocatore)

    if id_oggetto in mondo.inventario:
        mondo.inventario.remove(id_oggetto)
    else:
        # [1.2.2] È dentro o sopra qualcosa che il giocatore porta (la chiave
        # nello zaino): lo si tira fuori e lo si posa.
        mondo.rimuovi_da_posizione(oggetto)
    oggetto.posizione = stanza_corrente.nome
    stanza_corrente.oggetti[id_oggetto] = oggetto
    print(f"Lasciato: {_nome(oggetto)}.")
    _riuscita(mondo)

def inventario_logica_default(mondo: Mondo):
    """Logica di default per l'azione INVENTARIO."""
    # [Livello 7] Se l'autore ha dichiarato una capacità, mostriamo «(usati/max)».
    # [1.2.2] Il conteggio include ciò che sta negli zaini e nelle borse portati,
    # e l'elenco lo mostra rientrato sotto il suo contenitore (se è aperto: di un
    # contenitore chiuso si vede solo il contenitore).
    cap = mondo.capacita_attuale()
    suffisso = f" ({mondo.numero_oggetti_portati()}/{cap})" if cap is not None else ""
    if not mondo.inventario:
        print(f"Non stai portando nulla.{suffisso}")
    else:
        print(f"Stai portando:{suffisso}")
        for id_ogg in sorted(list(mondo.inventario)):
            _stampa_portato(mondo, id_ogg, 1, set())
    _riuscita(mondo)


def _stampa_portato(mondo: Mondo, id_ogg: str, livello: int, visti: set):
    """[1.2.2] Una riga dell'inventario e, rientrato, il contenuto visibile."""
    if id_ogg in visti or id_ogg not in mondo.oggetti:
        return
    visti.add(id_ogg)
    oggetto = mondo.oggetti[id_ogg]
    rientro = "  " + "    " * (livello - 1)   # livello 1: '  - ' come sempre
    print(f"{rientro}- {oggetto.nome_visualizzato}")
    if oggetto.is_supporto or (oggetto.is_contenitore and mondo.contenitore_aperto(oggetto)):
        for figlio in sorted(oggetto.contenuto):
            _stampa_portato(mondo, figlio, livello + 1, visti)

def muovi_logica_default(mondo: Mondo, direzione: str):
    """Logica di default per l'azione di MOVIMENTO."""
    stanza_corrente = mondo.trova_stanza(mondo.posizione_giocatore)
    if direzione in stanza_corrente.uscite:
        nuova_stanza_id = stanza_corrente.uscite[direzione]
        mondo.posizione_giocatore = nuova_stanza_id
        _riuscita(mondo)
        # La descrizione della nuova stanza verrà mostrata da gioco.py
    else:
        print("Non puoi andare in quella direzione.")

def guarda_logica_default(mondo: Mondo):
    """Logica di default per l'azione GUARDA: ristampa la stanza corrente.
    [0.29.0] Delega a gioco.mostra_stanza (FONTE UNICA): prima questa funzione ne
    duplicava intestazione/descrizione/elenco oggetti/buio, ma OMETTEVA le uscite
    che invece compaiono entrando in una stanza — incoerenza ora risolta. Import
    differito per evitare il ciclo gioco↔libreria_azioni."""
    from gioco import mostra_stanza
    mostra_stanza(mondo)
    _riuscita(mondo)

def aiuto_logica_default(mondo: Mondo):
    """Logica di default per l'azione AIUTO."""
    print("\n--- AIUTO ---")
    print("Comandi disponibili:")
    print("  - Movimento: nord, sud, est, ovest (o n, s, e, o), su, giù, nordest...; entra, esci, sali, scendi")
    print("  - Interazione: esamina (x) <oggetto>, prendi, lascia, apri, chiudi, accendi, spegni, metti <oggetto> in <oggetto>")
    print("  - Anche più cose insieme: prendi tutto, prendi la chiave e la torcia")
    print("  - Informazioni: inventario (o i, zaino), guarda (l), aspetta (z), aiuto")
    print("  - Pronomi: puoi dire 'prendila', 'aprilo', 'esaminale'...")
    print("  - Servizio: annulla (disfa l'ultimo turno), ancora (ripeti), salva e carica (anche con un nome: salva mattina), trascrizione")
    print("  - Sistema: ricomincia, esci (chiedono conferma)")
    print("\nCerca di usare verbi semplici e nomi di oggetti.")

def usare_con_logica_default(mondo: Mondo, id_oggetto1: str, id_oggetto2: str = None):
    """Logica di default per l'azione USARE [ogg1] CON [ogg2]."""
    if id_oggetto2:
        print(f"Usare {_nome(mondo.trova_oggetto(id_oggetto1))} con "
              f"{_nome(mondo.trova_oggetto(id_oggetto2))} non ha alcun effetto particolare.")
    else:
        oggetto = mondo.trova_oggetto(id_oggetto1)
        pron = pronome_oggetto(oggetto.nome_visualizzato) if oggetto else "lo"
        print(f"Con cosa vuoi usar{pron}?")


# --- [1.3.0 / G-4] Azioni con una logica propria -------------------------------
# Il modello del mondo conosce contenitori aperti e chiusi, luci accese e spente,
# ma fino alla 1.2.2 la libreria non sapeva aprire, chiudere, accendere né
# spegnere nulla ('apri la porta' → «Con cosa vuoi usarlo?»). Ora lo fa, ma solo
# per gli oggetti che l'autore dichiara APRIBILI, ACCENDIBILI, COMMESTIBILI o
# BEVIBILI, come già si fa con 'prendibile': una porta chiusa a chiave, di cui
# l'autore gestisce l'apertura con le sue regole, non si apre da sola.

def aprire_logica_default(mondo: Mondo, id_oggetto: str, id_oggetto2: str = None):
    oggetto = mondo.trova_oggetto(id_oggetto)
    if not _ha(oggetto, "apribile"):
        print("Non si apre.")
        return
    if not _ha(oggetto, "chiusa"):
        print(f"È già {accorda(oggetto.nome_visualizzato, 'aperto')}.")
        return
    _imposta(mondo, oggetto, "aperta")
    print(f"Apri {_nome(oggetto)}.")
    if oggetto.is_contenitore:
        _elenca_contenuto(mondo, oggetto)
    _riuscita(mondo)


def chiudere_logica_default(mondo: Mondo, id_oggetto: str, id_oggetto2: str = None):
    oggetto = mondo.trova_oggetto(id_oggetto)
    if not _ha(oggetto, "apribile"):
        print("Non si chiude.")
        return
    if _ha(oggetto, "chiusa"):
        print(f"È già {accorda(oggetto.nome_visualizzato, 'chiuso')}.")
        return
    _imposta(mondo, oggetto, "chiusa")
    print(f"Chiudi {_nome(oggetto)}.")
    _riuscita(mondo)


def accendere_logica_default(mondo: Mondo, id_oggetto: str, id_oggetto2: str = None):
    oggetto = mondo.trova_oggetto(id_oggetto)
    if not _ha(oggetto, "accendibile"):
        print("Non succede nulla di particolare.")
        return
    if _ha(oggetto, "accesa"):
        print(f"È già {accorda(oggetto.nome_visualizzato, 'acceso')}.")
        return
    _imposta(mondo, oggetto, "accesa")
    print(f"Accendi {_nome(oggetto)}.")
    _riuscita(mondo)


def spegnere_logica_default(mondo: Mondo, id_oggetto: str, id_oggetto2: str = None):
    oggetto = mondo.trova_oggetto(id_oggetto)
    if not _ha(oggetto, "accendibile"):
        print("Non succede nulla di particolare.")
        return
    if not _ha(oggetto, "accesa"):
        print(f"È già {accorda(oggetto.nome_visualizzato, 'spento')}.")
        return
    _imposta(mondo, oggetto, "spenta")
    print(f"Spegni {_nome(oggetto)}.")
    _riuscita(mondo)


def _consuma(mondo: Mondo, id_oggetto: str, proprieta: str, verbo: str, rifiuto: str):
    oggetto = mondo.trova_oggetto(id_oggetto)
    if not _ha(oggetto, proprieta):
        print(rifiuto)
        return
    mondo.rimuovi_da_posizione(oggetto)
    oggetto.posizione = None
    print(f"{verbo} {_nome(oggetto)}.")
    _riuscita(mondo)


def mangiare_logica_default(mondo: Mondo, id_oggetto: str, id_oggetto2: str = None):
    _consuma(mondo, id_oggetto, "commestibile", "Mangi", "Non si mangia.")


def bere_logica_default(mondo: Mondo, id_oggetto: str, id_oggetto2: str = None):
    _consuma(mondo, id_oggetto, "bevibile", "Bevi", "Non si beve.")


def aspettare_logica_default(mondo: Mondo):
    print("Il tempo passa.")
    _riuscita(mondo)


def niente_logica_default(mondo: Mondo, id_oggetto: str = None, id_oggetto2: str = None):
    """Verbi che il motore riconosce ma a cui non dà un effetto proprio: ci
    pensano le regole d'autore."""
    print("Non succede nulla di particolare.")


def annusare_intorno_logica_default(mondo: Mondo):
    print("Non senti odori particolari.")


def ascoltare_intorno_logica_default(mondo: Mondo):
    print("Non senti nulla di particolare.")


def spostare_logica_default(mondo: Mondo, id_oggetto: str, id_oggetto2: str = None):
    print("Non succede nulla di particolare.")


# --- DEFINIZIONE DELLA LIBRERIA ---
# Il PRIMO nome di ogni azione è il suo VERBO PRINCIPALE, cioè l'imperativo che
# il manuale insegna a usare nelle regole: 'esamina', 'prendi', 'lascia', 'metti'…
# [1.2.2] Una regola 'Invece di prendi …' vale per tutti i sinonimi della sua
# azione ('raccogli', 'afferra', 'prendere'…): vedi gioco._cerca_regola. Una
# regola scritta con un altro nome ('Invece di leggi …') resta legata a quella
# sola parola. Perciò due significati diversi non devono stare nella stessa
# azione: ognuno ha la sua, anche se la logica di default è la stessa.
# Un verbo può comparire in due azioni solo se una richiede un oggetto e l'altra
# no ('guarda' = esamina X oppure guarda la stanza): decide l'argomento del
# comando (Mondo.azione_del_verbo). Un test della suite lo verifica.
LIBRERIA_AZIONI = {
    "esaminare": Azione(
        nomi=["esamina", "esaminare", "x", "guarda", "guardare", "osserva", "osservare", "leggi", "leggere"],
        logica=esamina_logica_default
    ),
    "prendere": Azione(
        nomi=["prendi", "prendere", "raccogli", "raccogliere", "afferra", "afferrare"],
        logica=prendi_logica_default
    ),
    "lasciare": Azione(
        nomi=["lascia", "lasciare", "molla", "mollare", "posa", "posare", "butta", "buttare"],
        logica=lascia_logica_default
    ),
    "inventario": Azione(
        nomi=["inventario", "i", "zaino"],
        logica=inventario_logica_default, 
        richiede_oggetto=False
    ),
    # 'guarda' e 'osserva' stanno anche in «esaminare»: senza oggetto ristampano
    # la stanza, con un oggetto lo esaminano ([1.2.2], Mondo.azione_del_verbo).
    "guarda": Azione(
        nomi=["guarda", "osserva", "descrivi", "l"],
        logica=guarda_logica_default,
        richiede_oggetto=False
    ),
    "aiuto": Azione(
        nomi=["aiuto", "help", "?"],
        logica=aiuto_logica_default,
        richiede_oggetto=False
    ),
    # [1.2.2] Fino alla 1.2.1 'apri', 'mangia' e 'sposta' erano nomi dell'azione
    # «usare»: con le regole agganciate all'azione, 'Invece di mangia la mela'
    # sarebbe scattata anche su 'apri la mela'. Ora ognuno ha la sua azione. La
    # logica di default resta quella di prima (nessuna risposta cambia).
    "usare": Azione(
        nomi=["usa", "usare"],
        logica=usare_con_logica_default,
        richiede_oggetto=True
    ),
    "aprire": Azione(
        nomi=["apri", "aprire"],
        logica=aprire_logica_default,
        richiede_oggetto=True
    ),
    "mangiare": Azione(
        nomi=["mangia", "mangiare"],
        logica=mangiare_logica_default,
        richiede_oggetto=True
    ),
    "spostare": Azione(
        nomi=["sposta", "spostare"],
        logica=spostare_logica_default,
        richiede_oggetto=True
    ),
    "mettere": Azione(
        nomi=["metti", "mettere", "poni", "porre", "inserisci", "inserire",
              "infila", "infilare", "appoggia", "appoggiare"],
        logica=metti_logica_default,
        richiede_oggetto=True
    ),
    "vai": Azione(
        nomi=["vai", "andare", "cammina", "corri"],
        logica=muovi_logica_default, # Riutilizziamo la logica di movimento
        richiede_oggetto=True # Richiede la direzione come oggetto
    ),

    # [1.3.0 / G-4] Verbi nuovi. CEDONO a un verbo omonimo dichiarato
    # dall'autore ('"accendi" è un comando.'): una storia che li aveva già
    # dichiarati, con le sue regole, si comporta come prima (Mondo.carica_azioni).
    "chiudere": Azione(nomi=["chiudi", "chiudere"], logica=chiudere_logica_default, cede=True),
    "accendere": Azione(nomi=["accendi", "accendere"], logica=accendere_logica_default, cede=True),
    "spegnere": Azione(nomi=["spegni", "spegnere"], logica=spegnere_logica_default, cede=True),
    "bere": Azione(nomi=["bevi", "bere"], logica=bere_logica_default, cede=True),
    "aspettare": Azione(nomi=["aspetta", "aspettare", "attendi", "attendere", "z"],
                        logica=aspettare_logica_default, richiede_oggetto=False, cede=True),
    "toccare": Azione(nomi=["tocca", "toccare"], logica=niente_logica_default, cede=True),
    "spingere": Azione(nomi=["spingi", "spingere"], logica=niente_logica_default, cede=True),
    "tirare": Azione(nomi=["tira", "tirare"], logica=niente_logica_default, cede=True),
    "premere": Azione(nomi=["premi", "premere"], logica=niente_logica_default, cede=True),
    "girare": Azione(nomi=["gira", "girare"], logica=niente_logica_default, cede=True),
    "rompere": Azione(nomi=["rompi", "rompere"], logica=niente_logica_default, cede=True),
    "colpire": Azione(nomi=["colpisci", "colpire"], logica=niente_logica_default, cede=True),
    "indossare": Azione(nomi=["indossa", "indossare"], logica=niente_logica_default, cede=True),
    "togliere": Azione(nomi=["togli", "togliere"], logica=niente_logica_default, cede=True),
    "dare": Azione(nomi=["dai", "dare", "offri", "offrire"], logica=niente_logica_default, cede=True),
    "mostrare": Azione(nomi=["mostra", "mostrare"], logica=niente_logica_default, cede=True),
    # annusa / ascolta: con o senza oggetto (decide l'argomento, come 'guarda')
    "annusare": Azione(nomi=["annusa", "annusare"], logica=niente_logica_default, cede=True),
    "annusare_intorno": Azione(nomi=["annusa", "annusare"], logica=annusare_intorno_logica_default,
                               richiede_oggetto=False, cede=True),
    "ascoltare": Azione(nomi=["ascolta", "ascoltare"], logica=niente_logica_default, cede=True),
    "ascoltare_intorno": Azione(nomi=["ascolta", "ascoltare"], logica=ascoltare_intorno_logica_default,
                                richiede_oggetto=False, cede=True),
}
