# libreria_azioni.py
# Libreria Standard delle Azioni per FAVELLA 1 (v0.27.0)

from strutture import Mondo, Azione
from utils import rendi_testo, frase_indeterminativa, prima_maiuscola

def _elenca_contenuto(mondo: Mondo, oggetto):
    """[Livello 4 / M1] Stampa il contenuto di un contenitore/supporto, se ne è
    uno e (per i contenitori) se è aperto."""
    if oggetto.is_contenitore and not mondo.contenitore_aperto(oggetto):
        print("È chiuso.")
        return
    if oggetto.is_contenitore or oggetto.is_supporto:
        nomi = [mondo.oggetti[c].nome_visualizzato
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
    else:
        print("Non vedi nulla del genere qui.")

def prendi_logica_default(mondo: Mondo, id_oggetto: str):
    """Logica di default per l'azione PRENDERE."""
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
    if not oggetto.prendibile:
        print("Non puoi prenderlo.")
        return
    # [Livello 7] Capacità di trasporto opzionale: se l'autore l'ha dichiarata,
    # l'inventario non può superarla (la base più i bonus degli oggetti già
    # portati, es. uno zaino). Senza dichiarazione → illimitato.
    if not mondo.puo_portare_altro():
        print("Hai le mani troppo piene: lascia qualcosa prima di prenderlo.")
        return

    # [Livello 4 / M1] Rimuove l'oggetto da dove si trova (stanza, contenitore o
    # supporto) e lo mette nell'inventario.
    mondo.rimuovi_da_posizione(oggetto)
    mondo.inventario.add(id_oggetto)
    oggetto.posizione = "inventario"
    print(f"Preso: {oggetto.nome_visualizzato}.")

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
        print(f"In {dest.nome_visualizzato} non ci puoi mettere niente.")
        return
    if dest.is_contenitore and not mondo.contenitore_aperto(dest):
        print(f"{prima_maiuscola(dest.nome_visualizzato)} è chiuso.")
        return

    mondo.rimuovi_da_posizione(oggetto)
    dest.contenuto.add(id_oggetto1)
    oggetto.posizione = id_oggetto2
    dove = "su" if dest.is_supporto else "in"
    print(f"Hai messo {oggetto.nome_visualizzato} {dove} {dest.nome_visualizzato}.")

def lascia_logica_default(mondo: Mondo, id_oggetto: str):
    """Logica di default per l'azione LASCIARE."""
    # [0.27.0 / C] Al buio non si manipola nulla, coerente con prendi/metti/esamina
    # (prima 'lascia' sfuggiva al blocco). Una fonte di luce accesa in mano rende
    # comunque 'c_e_luce' vero, quindi posarla per illuminare resta possibile.
    if not mondo.c_e_luce():
        print("È troppo buio per vederci.")
        return
    if id_oggetto not in mondo.inventario:
        print("Non ce l'hai.")
        return
    
    oggetto = mondo.trova_oggetto(id_oggetto)
    stanza_corrente = mondo.trova_stanza(mondo.posizione_giocatore)
    
    mondo.inventario.remove(id_oggetto)
    oggetto.posizione = stanza_corrente.nome
    stanza_corrente.oggetti[id_oggetto] = oggetto
    print(f"Lasciato: {oggetto.nome_visualizzato}.")

def inventario_logica_default(mondo: Mondo):
    """Logica di default per l'azione INVENTARIO."""
    # [Livello 7] Se l'autore ha dichiarato una capacità, mostriamo «(usati/max)».
    cap = mondo.capacita_attuale()
    suffisso = f" ({len(mondo.inventario)}/{cap})" if cap is not None else ""
    if not mondo.inventario:
        print(f"Non stai portando nulla.{suffisso}")
    else:
        print(f"Stai portando:{suffisso}")
        for id_ogg in sorted(list(mondo.inventario)):
            # Prendiamo il nome originale dell'oggetto per una visualizzazione più gradevole
            nome_visualizzato = mondo.oggetti[id_ogg].nome_visualizzato
            print(f"  - {nome_visualizzato}")

def muovi_logica_default(mondo: Mondo, direzione: str):
    """Logica di default per l'azione di MOVIMENTO."""
    stanza_corrente = mondo.trova_stanza(mondo.posizione_giocatore)
    if direzione in stanza_corrente.uscite:
        nuova_stanza_id = stanza_corrente.uscite[direzione]
        mondo.posizione_giocatore = nuova_stanza_id
        # La descrizione della nuova stanza verrà mostrata da gioco.py
    else:
        print("Non puoi andare in quella direzione.")

def guarda_logica_default(mondo: Mondo):
    """Logica di default per l'azione GUARDA (ristampa la descrizione della stanza)."""
    stanza_corrente = mondo.trova_stanza(mondo.posizione_giocatore)
    if not stanza_corrente:
        print("[ERRORE INTERNO] La posizione del giocatore non corrisponde a nessuna stanza!")
        return

    print(f"\n--- {prima_maiuscola(stanza_corrente.nome_visualizzato)} ---")

    # [0.24.0 / A4] Buio: nessuna descrizione né elenco oggetti (vedi gioco.mostra_stanza).
    if not mondo.c_e_luce():
        print("È buio pesto.")
        return

    print(rendi_testo(mondo, stanza_corrente.descrizione_attuale(mondo)))

    oggetti_nella_stanza = list(stanza_corrente.oggetti.values())
    if oggetti_nella_stanza:
        # [Livello 5] Articolo indeterminativo concordato (vedi gioco.mostra_stanza).
        nomi_oggetti = [frase_indeterminativa(ogg.nome_visualizzato) for ogg in oggetti_nella_stanza]
        print(f"Puoi vedere qui: {', '.join(nomi_oggetti)}.")

    # [0.20.0 / A1] Gli oggetti elencati diventano riferibili dai pronomi.
    mondo.registra_riferiti_da_stanza()

def aiuto_logica_default(mondo: Mondo):
    """Logica di default per l'azione AIUTO."""
    print("\n--- AIUTO ---")
    print("Comandi disponibili:")
    print("  - Movimento: nord, sud, est, ovest (o n, s, e, o)")
    print("  - Interazione: esamina <oggetto>, prendi <oggetto>, lascia <oggetto>")
    print("  - Informazioni: inventario (o i, zaino), guarda, aiuto")
    print("  - Pronomi: puoi dire 'prendila', 'aprilo', 'esaminale'…")
    print("  - Servizio: annulla (disfa l'ultimo turno), ancora (ripeti), trascrizione")
    print("  - Sistema: esci")
    print("\nCerca di usare verbi semplici e nomi di oggetti.")

def usare_con_logica_default(mondo: Mondo, id_oggetto1: str, id_oggetto2: str = None):
    """Logica di default per l'azione USARE [ogg1] CON [ogg2]."""
    if id_oggetto2:
        print(f"Usare {mondo.trova_oggetto(id_oggetto1).nome_visualizzato} con {mondo.trova_oggetto(id_oggetto2).nome_visualizzato} non ha alcun effetto particolare.")
    else:
        print("Con cosa vuoi usarlo?")

# --- DEFINIZIONE DELLA LIBRERIA ---
LIBRERIA_AZIONI = {
    "esaminare": Azione(
        nomi=["esamina", "esaminare", "guarda", "guardare", "osserva", "osservare", "leggi", "leggere"],
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
    "guarda": Azione(
        nomi=["guarda", "osserva", "descrivi"], # Alias per ristampare la descrizione della stanza
        logica=guarda_logica_default,
        richiede_oggetto=False
    ),
    "aiuto": Azione(
        nomi=["aiuto", "help", "?"],
        logica=aiuto_logica_default,
        richiede_oggetto=False
    ),
    "usare": Azione(
        nomi=["usa", "usare", "apri", "aprire", "mangia", "mangiare", "sposta", "spostare"],
        logica=usare_con_logica_default,
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
}