# strutture.py
# Modulo per le strutture dati di base di FAVELLA 1 (v0.4)

class Regola:
    """Rappresenta una regola 'Invece di' che sovrascrive un'azione."""
    def __init__(self, verbo: str, id_oggetto_bersaglio: str, risposta: str):
        self.verbo = verbo
        self.id_oggetto_bersaglio = id_oggetto_bersaglio
        self.risposta = risposta

    def __repr__(self):
        return f"Regola(Invece di {self.verbo} {self.id_oggetto_bersaglio})"

class Stanza:
    """Rappresenta una singola stanza nel mondo di gioco."""
    def __init__(self, nome: str, descrizione: str = "Non vedi nulla di particolare."):
        self.nome = nome
        self.descrizione = descrizione
        self.oggetti = {}

    def __repr__(self):
        return f"Stanza(nome='{self.nome}')"

class Oggetto:
    """Rappresenta un oggetto nel mondo di gioco."""
    def __init__(self, nome: str, posizione: str = None):
        self.nome = nome
        self.posizione = posizione
        self.proprieta = set()

    def aggiungi_proprieta(self, proprieta: str):
        """Aggiunge una proprietà all'oggetto."""
        self.proprieta.add(proprieta)

    def __repr__(self):
        return f"Oggetto(nome='{self.nome}', posizione='{self.posizione}')"

class Mondo:
    """Rappresenta l'intero mondo di gioco."""
    def __init__(self):
        self.stanze = {}
        self.oggetti = {}
        self.regole = [] # Nuovo: una lista per contenere tutte le regole

    def aggiungi_regola(self, regola: Regola):
        self.regole.append(regola)

    def aggiungi_stanza(self, stanza: Stanza): self.stanze[stanza.nome] = stanza
    def aggiungi_oggetto(self, oggetto: Oggetto): self.oggetti[oggetto.nome] = oggetto
    def trova_stanza(self, nome_stanza: str) -> Stanza | None: return self.stanze.get(nome_stanza)
    def trova_oggetto(self, nome_oggetto: str) -> Oggetto | None: return self.oggetti.get(nome_oggetto)

    def __str__(self) -> str:
        """Genera il report testuale del mondo analizzato (solo per debug)."""
        report = ["[FAVELLA 1] Report di compilazione (v0.4):"]
        report.append(f"  - Stanze definite: {len(self.stanze)}")
        report.append(f"  - Oggetti definiti: {len(self.oggetti)}")
        report.append(f"  - Regole definite: {len(self.regole)}")
        return "\n".join(report)
