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
}