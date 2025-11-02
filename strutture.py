# strutture.py
# Modulo per le strutture dati di base di FAVELLA 1 (v0.2)

class Stanza:
    """Rappresenta una singola stanza nel mondo di gioco."""
    def __init__(self, nome: str, descrizione: str = "Non vedi nulla di particolare."):
        self.nome = nome
        self.descrizione = descrizione
        self.oggetti = {} # Usiamo un dizionario per un accesso più rapido

    def __repr__(self):
        return f"Stanza(nome='{self.nome}')"

class Oggetto:
    """Rappresenta un oggetto nel mondo di gioco."""
    def __init__(self, nome: str, posizione: str = None):
        self.nome = nome
        self.posizione = posizione # ID normalizzato della stanza in cui si trova

    def __repr__(self):
        return f"Oggetto(nome='{self.nome}', posizione='{self.posizione}')"

class Mondo:
    """Rappresenta l'intero mondo di gioco, contenitore di stanze e oggetti."""
    def __init__(self):
        self.stanze = {} # Dizionario per mappare id_stanza -> oggetto Stanza
        self.oggetti = {} # Dizionario per mappare id_oggetto -> oggetto Oggetto

    def aggiungi_stanza(self, stanza: Stanza):
        self.stanze[stanza.nome] = stanza

    def aggiungi_oggetto(self, oggetto: Oggetto):
        self.oggetti[oggetto.nome] = oggetto
        if oggetto.posizione and oggetto.posizione in self.stanze:
            self.stanze[oggetto.posizione].oggetti[oggetto.nome] = oggetto

    def trova_stanza(self, nome_stanza: str) -> Stanza | None:
        """Cerca una stanza per ID normalizzato."""
        return self.stanze.get(nome_stanza)

    def __str__(self) -> str:
        """Genera il report testuale del mondo analizzato."""
        report = ["[FAVELLA 1] Analisi completata con successo.",
                  "Mondo di Gioco Riconosciuto:"]
        
        if not self.stanze:
            report.append("  (Nessuna stanza definita)")
        else:
            report.append("  - Stanze:")
            for nome, stanza in self.stanze.items():
                report.append(f"    - '{nome}': \"{stanza.descrizione}\"")
                if stanza.oggetti:
                    nomi_oggetti = ", ".join(f"'{o}'" for o in stanza.oggetti.keys())
                    report.append(f"      (Contiene: {nomi_oggetti})")

        return "\n".join(report)
