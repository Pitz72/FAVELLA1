# libreria_azioni.py
# Libreria Standard delle Azioni per FAVELLA 1 (v0.2)

from strutture import Mondo, Azione

def esamina_logica_default(mondo: Mondo, id_oggetto: str):
    """Logica di default per l'azione ESAMINARE."""
    oggetto = mondo.trova_oggetto(id_oggetto)
    if oggetto and (oggetto.posizione == mondo.posizione_giocatore or id_oggetto in mondo.inventario):
        print(oggetto.descrizione)
    else:
        print("Non vedi nulla del genere qui.")

def prendi_logica_default(mondo: Mondo, id_oggetto: str):
    """Logica di default per l'azione PRENDERE."""
    oggetto = mondo.trova_oggetto(id_oggetto)
    if not oggetto or oggetto.posizione != mondo.posizione_giocatore:
        print("Non vedi nulla del genere qui.")
        return
    if id_oggetto in mondo.inventario:
        print("Ce l'hai già.")
        return
    if not oggetto.prendibile:
        print("Non puoi prenderlo.")
        return
    
    mondo.inventario.add(id_oggetto)
    oggetto.posizione = "inventario"
    # Rimuovi l'oggetto dalla stanza in cui si trovava
    del mondo.stanze[mondo.posizione_giocatore].oggetti[id_oggetto]
    print(f"Preso: {oggetto.nome}.")

def lascia_logica_default(mondo: Mondo, id_oggetto: str):
    """Logica di default per l'azione LASCIARE."""
    if id_oggetto not in mondo.inventario:
        print("Non ce l'hai.")
        return
    
    oggetto = mondo.trova_oggetto(id_oggetto)
    stanza_corrente = mondo.trova_stanza(mondo.posizione_giocatore)
    
    mondo.inventario.remove(id_oggetto)
    oggetto.posizione = stanza_corrente.nome
    stanza_corrente.oggetti[id_oggetto] = oggetto
    print(f"Lasciato: {oggetto.nome}.")

def inventario_logica_default(mondo: Mondo):
    """Logica di default per l'azione INVENTARIO."""
    if not mondo.inventario:
        print("Non stai portando nulla.")
    else:
        print("Stai portando:")
        for id_ogg in sorted(list(mondo.inventario)):
            # Prendiamo il nome originale dell'oggetto per una visualizzazione più gradevole
            nome_visualizzato = mondo.oggetti[id_ogg].nome
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

    print(f"\n--- {stanza_corrente.nome.capitalize()} ---")
    print(stanza_corrente.descrizione)
    
    oggetti_nella_stanza = list(stanza_corrente.oggetti.values())
    if oggetti_nella_stanza:
        nomi_oggetti = [ogg.nome for ogg in oggetti_nella_stanza]
        print(f"Puoi vedere qui: {', '.join(nomi_oggetti)}.")

def aiuto_logica_default(mondo: Mondo):
    """Logica di default per l'azione AIUTO."""
    print("\n--- AIUTO ---")
    print("Comandi disponibili:")
    print("  - Movimento: nord, sud, est, ovest (o n, s, e, o)")
    print("  - Interazione: esamina <oggetto>, prendi <oggetto>, lascia <oggetto>")
    print("  - Informazioni: inventario (o i, zaino), guarda, aiuto")
    print("  - Sistema: esci")
    print("\nCerca di usare verbi semplici e nomi di oggetti.")

def usare_con_logica_default(mondo: Mondo, id_oggetto1: str, id_oggetto2: str = None):
    """Logica di default per l'azione USARE [ogg1] CON [ogg2]."""
    if id_oggetto2:
        print("Non sembra avere alcun effetto.")
    else:
        print("Come vorresti usarlo?")

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
        nomi=["usa", "usare", "apri", "aprire"],
        logica=usare_con_logica_default,
        richiede_oggetto=True
    ),
}