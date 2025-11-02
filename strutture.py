# strutture.py
# Modulo per le strutture dati di base di FAVELLA 1 (v0.3)

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
        self.proprieta = set() # Nuovo: un set per contenere le proprietà (es. 'pesante', 'commestibile')

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

    def aggiungi_stanza(self, stanza: Stanza):
        self.stanze[stanza.nome] = stanza

    def aggiungi_oggetto(self, oggetto: Oggetto):
        self.oggetti[oggetto.nome] = oggetto
        if oggetto.posizione and oggetto.posizione in self.stanze:
            self.stanze[oggetto.posizione].oggetti[oggetto.nome] = oggetto

    def trova_stanza(self, nome_stanza: str) -> Stanza | None:
        return self.stanze.get(nome_stanza)

    def trova_oggetto(self, nome_oggetto: str) -> Oggetto | None:
        """Cerca un oggetto per ID normalizzato."""
        return self.oggetti.get(nome_oggetto)

    def __str__(self) -> str:
        """Genera il report testuale del mondo analizzato."""
        report = ["[FAVELLA 1] Analisi completata con successo.",
                  "Mondo di Gioco Riconosciuto (v0.3):"]
        
        if self.stanze:
            report.append("  - Stanze:")
            for nome, stanza in self.stanze.items():
                report.append(f"    - '{nome}': \"{stanza.descrizione}\"")
                if stanza.oggetti:
                    oggetti_descr = []
                    for nome_ogg, ogg in stanza.oggetti.items():
                        prop_str = f" ({', '.join(sorted(ogg.proprieta))})" if ogg.proprieta else ""
                        oggetti_descr.append(f"'{nome_ogg}'{prop_str}")
                    report.append(f"      (Contiene: {', '.join(oggetti_descr)})")

        return "\n".join(report)
