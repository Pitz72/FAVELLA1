# gioco.py
# Interprete Interattivo per FAVELLA 1 (v0.4)

import sys
from compilatore import analizza_file
from strutture import Mondo
from utils import normalizza_nome

def gioca(mondo: Mondo):
    """Avvia il ciclo di gioco interattivo."""
    print("\n--- FAVELLA 1 ---")
    print("Benvenuto. Scrivi 'esci' per terminare.")

    while True:
        try:
            comando_grezzo = input("> ")
        except EOFError: # Gestisce la fine dell'input (es. Ctrl+D)
            print("\nA presto!")
            break

        comando_pulito = comando_grezzo.strip().lower()

        if comando_pulito == "esci" or comando_pulito == "quit":
            print("A presto!")
            break

        parti = comando_pulito.split(maxsplit=1)
        if len(parti) < 2:
            print("Non capisco. Prova con un comando del tipo 'verbo oggetto' (es. 'prendi la mela').")
            continue

        verbo_giocatore = parti[0]
        oggetto_giocatore_grezzo = parti[1]
        id_oggetto_giocatore = normalizza_nome(oggetto_giocatore_grezzo)

        # --- Motore delle Regole ---
        regola_applicata = False
        for regola in mondo.regole:
            if regola.verbo == verbo_giocatore and regola.id_oggetto_bersaglio == id_oggetto_giocatore:
                print(regola.risposta)
                regola_applicata = True
                break

        if not regola_applicata:
            # Comportamento di default se nessuna regola corrisponde
            print("Non succede niente di speciale.")

def main():
    if len(sys.argv) != 2:
        print("Uso: python gioco.py <percorso_file.fav>")
        sys.exit(1)

    percorso_file = sys.argv[1]

    try:
        print(f"[FAVELLA 1] Compilazione di '{percorso_file}' in corso...")
        mondo_compilato = analizza_file(percorso_file)
        print(str(mondo_compilato))

        # Se la compilazione ha successo, avvia il gioco
        gioca(mondo_compilato)

    except FileNotFoundError:
        print(f"[ERRORE] Il file '{percorso_file}' non è stato trovato.")
    except Exception as e:
        print(f"[ERRORE FATALE] Si è verificato un errore imprevisto: {e}")

if __name__ == "__main__":
    main()
