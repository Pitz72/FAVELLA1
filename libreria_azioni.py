# libreria_azioni.py
# Libreria Standard delle Azioni per FAVELLA 1 (v0.1)

from strutture import Mondo, Azione

def esamina_logica_default(mondo: Mondo, id_oggetto: str):
    """Logica di default per l'azione ESAMINARE."""
    oggetto = mondo.trova_oggetto(id_oggetto)
    if oggetto:
        # Stampa la descrizione dell'oggetto. Se non ne ha una, usa un testo di default.
        print(oggetto.descrizione)
    else:
        # Questo caso non dovrebbe accadere se i controlli preliminari funzionano.
        print("Non vedi nulla del genere qui.")

# --- DEFINIZIONE DELLA LIBRERIA ---
# Un dizionario che mappa il nome dell'azione al suo oggetto Azione.
LIBRERIA_AZIONI = {
    "esaminare": Azione(
        nomi=["esaminare", "esamina", "guarda", "guardare", "osserva", "osservare", "ispeziona", "ispezionare", "leggi", "leggere"],
        logica_di_default=esamina_logica_default
    ),
    # In futuro aggiungeremo qui: "prendere", "lasciare", etc.
}
