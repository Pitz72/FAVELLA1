# strutture.py
# Modulo per le strutture dati di base di FAVELLA 1 (v0.5.0)
from typing import Callable, List, Dict, Set, Optional

class Mondo: # Forward declaration per i type hint
    pass

# --- NUOVA Gerarchia delle Condizioni e Conseguenze ---
class Condizione:
    """Classe base astratta per tutte le condizioni."""
    def valuta(self, mondo: 'Mondo') -> bool:
        raise NotImplementedError("La valutazione deve essere implementata da una sottoclasse.")

class CondizionePossesso(Condizione):
    """Rappresenta la condizione 'se il giocatore ha [oggetto]'."""
    def __init__(self, id_oggetto: str):
        self.id_oggetto = id_oggetto
    
    def valuta(self, mondo: 'Mondo') -> bool:
        return self.id_oggetto in mondo.inventario

class CondizioneProprieta(Condizione):
    """Rappresenta la condizione 'se [oggetto] è [proprietà]'."""
    def __init__(self, id_oggetto: str, proprieta: str):
        self.id_oggetto = id_oggetto
        self.proprieta = proprieta
    
    def valuta(self, mondo: 'Mondo') -> bool:
        oggetto = mondo.trova_oggetto(self.id_oggetto)
        return oggetto is not None and self.proprieta in oggetto.proprieta

class Conseguenza:
    """Classe base astratta per tutte le conseguenze."""
    def esegui(self, mondo: 'Mondo'):
        raise NotImplementedError("L'esecuzione deve essere implementata da una sottoclasse.")

class ConseguenzaProprieta(Conseguenza):
    """Rappresenta un cambio di proprietà (es. 'la porta è aperta')."""
    def __init__(self, id_oggetto: str, proprieta: str):
        self.id_oggetto = id_oggetto
        self.proprieta = proprieta

    def esegui(self, mondo: 'Mondo'):
        oggetto = mondo.trova_oggetto(self.id_oggetto)
        if oggetto:
            oggetto.aggiungi_proprieta(self.proprieta)
            if self.proprieta == "aperta" and "chiusa" in oggetto.proprieta:
                oggetto.proprieta.remove("chiusa")
            elif self.proprieta == "chiusa" and "aperta" in oggetto.proprieta:
                oggetto.proprieta.remove("aperta")

class ConseguenzaSpostamento(Conseguenza):
    """Rappresenta uno spostamento di un oggetto (es. verso l'inventario, una stanza o il nulla)."""
    def __init__(self, id_oggetto: str, destinazione: str):
        self.id_oggetto = id_oggetto
        self.destinazione = destinazione

    def esegui(self, mondo: 'Mondo'):
        oggetto = mondo.trova_oggetto(self.id_oggetto)
        if not oggetto:
            return

        vecchia_posizione = oggetto.posizione
        
        # Rimozione da stanza o inventario pregressi
        if vecchia_posizione == "inventario":
            mondo.inventario.discard(self.id_oggetto)
        elif vecchia_posizione and vecchia_posizione in mondo.stanze:
            mondo.stanze[vecchia_posizione].oggetti.pop(self.id_oggetto, None)

        if self.destinazione == "nulla":
            oggetto.posizione = None
        elif self.destinazione == "inventario":
            mondo.inventario.add(self.id_oggetto)
            oggetto.posizione = "inventario"
        else:
            stanza_dest = mondo.trova_stanza(self.destinazione)
            if stanza_dest:
                stanza_dest.oggetti[self.id_oggetto] = oggetto
                oggetto.posizione = self.destinazione

# --- Classi Esistenti (con modifiche) ---

class Azione:
    """Rappresenta un'azione standard, la sua logica e se richiede un oggetto."""
    def __init__(self, nomi: List[str], logica: Callable[..., None], richiede_oggetto: bool = True):
        self.nomi = nomi
        self.logica_di_default = logica
        self.richiede_oggetto = richiede_oggetto

class Regola:
    """Rappresenta una regola 'Invece di', ora con supporto per due oggetti e conseguenze compilarte."""
    def __init__(self, verbo: str, id_oggetto_bersaglio: str, risposta: str, 
                 condizione: Optional[Condizione] = None,
                 preposizione: Optional[str] = None,
                 id_oggetto_secondario: Optional[str] = None,
                 conseguenza: Optional[Conseguenza] = None):
        self.verbo = verbo
        self.id_oggetto_bersaglio = id_oggetto_bersaglio
        self.risposta = risposta
        self.condizione = condizione
        self.preposizione = preposizione
        self.id_oggetto_secondario = id_oggetto_secondario
        self.conseguenza = conseguenza

class Stanza:
    """Rappresenta una singola stanza nel mondo di gioco."""
    def __init__(self, nome: str, descrizione: str = "Non vedi nulla di particolare."):
        self.nome = nome  # ID normalizzato (es. "cella di contenimento")
        self.nome_visualizzato = nome  # Nome originale visualizzabile (es. "La cella di contenimento")
        self.descrizione = descrizione
        self.oggetti: Dict[str, 'Oggetto'] = {}
        self.uscite: Dict[str, str] = {}

class Oggetto:
    """Rappresenta un oggetto nel mondo di gioco."""
    def __init__(self, nome: str, posizione: str = None):
        self.nome = nome  # ID normalizzato (es. "keycard magnetica")
        self.nome_visualizzato = nome  # Nome originale visualizzabile (es. "Una keycard magnetica")
        self.posizione = posizione
        self.proprieta: Set[str] = set()
        self.descrizione: str = "È un oggetto come tanti."
        self.prendibile: bool = False

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
        self.posizione_giocatore: str | None = None
        # ID della stanza di partenza dichiarata esplicitamente dall'autore
        # tramite "Il giocatore comincia in [stanza].". None se non dichiarata.
        self.posizione_iniziale: str | None = None
        self.inventario: Set[str] = set()

    def imposta_posizione_iniziale(self):
        """Imposta la posizione iniziale del giocatore.

        Usa la stanza dichiarata esplicitamente dall'autore ('Il giocatore
        comincia in X.'); in mancanza, ripiega sulla prima stanza definita.
        """
        if self.posizione_iniziale and self.posizione_iniziale in self.stanze:
            self.posizione_giocatore = self.posizione_iniziale
        elif self.stanze:
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
            f"[FAVELLA 1] Report di compilazione (v0.5.0):\n"
            f"  - Stanze: {len(self.stanze)}\n"
            f"  - Oggetti: {len(self.oggetti)}\n"
            f"  - Regole: {len(self.regole)}\n"
        )
        if self.posizione_giocatore:
            report += f"  - Posizione iniziale: '{self.posizione_giocatore}'"
        return report
