# strutture.py
# Modulo per le strutture dati di base di FAVELLA 1 (v0.6)
from typing import Callable, List, Dict, Set

class Mondo: # Forward declaration per i type hint
    pass

class Azione:
    """Rappresenta un'azione standard, la sua logica e se richiede un oggetto."""
    def __init__(self, nomi: List[str], logica: Callable[..., None], richiede_oggetto: bool = True):
        self.nomi = nomi
        self.logica_di_default = logica
        self.richiede_oggetto = richiede_oggetto

class Regola:
    """Rappresenta una regola 'Invece di' che sovrascrive un'azione."""
    def __init__(self, verbo: str, id_oggetto_bersaglio: str, risposta: str):
        self.verbo = verbo
        self.id_oggetto_bersaglio = id_oggetto_bersaglio
        self.risposta = risposta

class Stanza:
    """Rappresenta una singola stanza nel mondo di gioco."""
    def __init__(self, nome: str, descrizione: str = "Non vedi nulla di particolare."):
        self.nome = nome
        self.descrizione = descrizione
        self.oggetti: Dict[str, 'Oggetto'] = {}

class Oggetto:
    """Rappresenta un oggetto nel mondo di gioco."""
    def __init__(self, nome: str, posizione: str = None):
        self.nome = nome
        self.posizione = posizione
        self.proprieta: Set[str] = set()
        self.descrizione: str = "È un oggetto come tanti."
        self.prendibile: bool = False # Nuovo: di default gli oggetti non sono prendibili

    def aggiungi_proprieta(self, prop: str):
        """Aggiunge una proprietà (aggettivo) all'oggetto."""
        self.proprieta.add(prop)

class Mondo:
    """Contenitore per l'intero stato del mondo di gioco."""
    def __init__(self):
        self.stanze: Dict[str, Stanza] = {}
        self.oggetti: Dict[str, Oggetto] = {}
        self.regole: List[Regola] = []
        self.azioni: Dict[str, Azione] = {}
        self.mappa_verbi_giocatore: Dict[str, str] = {}
        self.posizione_giocatore: str | None = None # Nuovo: ID della stanza corrente
        self.inventario: Set[str] = set() # Nuovo: Set di ID degli oggetti posseduti

    def imposta_posizione_iniziale(self):
        """Imposta la posizione iniziale del giocatore nella prima stanza definita."""
        if self.stanze:
            self.posizione_giocatore = list(self.stanze.keys())[0]

    def carica_azioni(self, libreria: Dict[str, Azione]):
        """Carica la libreria di azioni e costruisce la mappa di ricerca inversa."""
        self.azioni = libreria
        for nome_azione, azione_obj in libreria.items():
            for verbo in azione_obj.nomi:
                self.mappa_verbi_giocatore[verbo] = nome_azione

    def aggiungi_regola(self, regola: Regola):
        self.regole.append(regola)

    def aggiungi_stanza(self, stanza: Stanza):
        self.stanze[stanza.nome] = stanza

    def aggiungi_oggetto(self, oggetto: Oggetto):
        self.oggetti[oggetto.nome] = oggetto

    def trova_stanza(self, nome: str) -> Stanza | None:
        return self.stanze.get(nome)

    def trova_oggetto(self, nome: str) -> Oggetto | None:
        return self.oggetti.get(nome)

    def __str__(self) -> str:
        report = (
            f"[FAVELLA 1] Report di compilazione (v0.6):\n"
            f"  - Stanze: {len(self.stanze)}\n"
            f"  - Oggetti: {len(self.oggetti)}\n"
            f"  - Regole: {len(self.regole)}\n"
        )
        if self.posizione_giocatore:
            report += f"  - Posizione iniziale: '{self.posizione_giocatore}'"
        return report
