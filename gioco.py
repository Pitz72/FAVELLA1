# gioco.py
# Interprete Interattivo per FAVELLA 1 (v0.5)

import sys
from compilatore import analizza_file
from strutture import Mondo
from utils import normalizza_nome
from libreria_azioni import LIBRERIA_AZIONI

def gioca(mondo: Mondo):
    """Avvia il ciclo di gioco interattivo basato sulle azioni."""
    mondo.carica_azioni(LIBRERIA_AZIONI)
    print("\n--- FAVELLA 1 ---")
    print("Benvenuto. Scrivi 'esci' per terminare.")

    while True:
        try:
            comando_grezzo = input("> ")
        except EOFError:
            print("\nA presto!")
            break

        comando_pulito = comando_grezzo.strip().lower()
        if not comando_pulito:
            continue

        if comando_pulito in ["esci", "quit"]:
            print("A presto!")
            break

        parti = comando_pulito.split(maxsplit=1)
        verbo_input = parti[0]

        if len(parti) < 2:
            print(f"Cosa vuoi {verbo_input}?")
            continue
        
        id_oggetto = normalizza_nome(parti[1])

        # --- Motore di Gioco (v0.5) ---
        # 1. Trova l'azione standard corrispondente al verbo di input
        nome_azione = mondo.mappa_verbi_giocatore.get(verbo_input)

        # 2. Cerca una regola che corrisponda esattamente al verbo di input del giocatore
        regola_trovata = None
        for regola in mondo.regole:
            if regola.verbo == verbo_input and regola.id_oggetto_bersaglio == id_oggetto:
                regola_trovata = regola
                break
        
        if regola_trovata:
            print(regola_trovata.risposta)
            continue

        # 3. Se non c'è una regola specifica per il verbo di input, e abbiamo un'azione standard,
        #    cerca una regola che corrisponda al nome canonico dell'azione.
        if nome_azione:
            azione = mondo.azioni[nome_azione]
            for regola in mondo.regole:
                if regola.verbo == nome_azione and regola.id_oggetto_bersaglio == id_oggetto:
                    regola_trovata = regola
                    break
        
        if regola_trovata:
            print(regola_trovata.risposta)
            continue

        # 4. Se non è stata trovata nessuna regola specifica e abbiamo un'azione standard,
        #    esegui la logica di default dell'azione.
        if nome_azione:
            azione = mondo.azioni[nome_azione]
            if azione.logica_di_default:
                azione.logica_di_default(mondo, id_oggetto)
            else:
                # Questo accade per azioni che esistono ma non hanno un comportamento di default (es. prendere)
                print("Non succede niente di speciale.")
        else:
            # Se non è un'azione standard e non c'era una regola specifica per il verbo di input
            print("Non capisco cosa vuoi fare.")

def main():
    if len(sys.argv) != 2:
        print("Uso: python gioco.py <percorso_file.fav>")
        sys.exit(1)

    percorso_file = sys.argv[1]

    print(f"[FAVELLA 1] Compilazione di '{percorso_file}' in corso...")
    mondo_compilato = analizza_file(percorso_file)

    if mondo_compilato is None:
        print("\n[FAVELLA 1] Compilazione fallita. Correggi gli errori nel file di storia e riprova.")
        sys.exit(1)
    
    print(str(mondo_compilato))
    gioca(mondo_compilato)

if __name__ == "__main__":
    main()