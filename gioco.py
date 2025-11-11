# gioco.py
# Interprete Interattivo per FAVELLA 1 (v0.9)

import sys
import traceback
from compilatore import analizza_file
from strutture import Mondo
from utils import normalizza_nome
from libreria_azioni import LIBRERIA_AZIONI, muovi_logica_default # Importa anche muovi_logica_default

DIREZIONI_VALIDI = {
    "nord": "nord", "n": "nord",
    "sud": "sud", "s": "sud",
    "est": "est", "e": "est",
    "ovest": "ovest", "o": "ovest"
}

def mostra_stanza(mondo: Mondo):
    """Stampa la descrizione completa della stanza corrente del giocatore."""
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

    # Mostra le uscite disponibili
    if stanza_corrente.uscite:
        uscite_str = ", ".join([f"{d.capitalize()} ({mondo.trova_stanza(id_s).nome.capitalize()})" for d, id_s in stanza_corrente.uscite.items()])
        print(f"Uscite: {uscite_str}.")

def risolvi_nome_oggetto(mondo: Mondo, nome_parziale: str) -> str | None:
    """Cerca di risolvere un nome parziale in un ID oggetto univoco nello scope attuale."""
    if not nome_parziale:
        return None

    stanza_corrente = mondo.trova_stanza(mondo.posizione_giocatore)
    if not stanza_corrente:
        return None

    oggetti_in_scope = list(stanza_corrente.oggetti.keys()) + list(mondo.inventario)
    
    # Priorità 1: Corrispondenza esatta
    if nome_parziale in oggetti_in_scope:
        return nome_parziale

    # Priorità 2: Corrispondenza parziale univoca
    candidati = [id_ogg for id_ogg in oggetti_in_scope if nome_parziale in id_ogg]
    
    if len(candidati) == 1:
        return candidati[0]
    elif len(candidati) > 1:
        print(f"Quale intendi di preciso? ({', '.join(candidati)})")
        return "<ambiguo>"
    else:
        return None

def gioca(mondo: Mondo):
    """Avvia il ciclo di gioco interattivo."""
    mondo.carica_azioni(LIBRERIA_AZIONI)
    mondo.imposta_posizione_iniziale()
    
    if not mondo.posizione_giocatore:
        print("[ERRORE FATALE] Nessuna stanza definita. Impossibile avviare il gioco.")
        return

    print("\n--- BENVENUTO IN FAVELLA 1 ---")
    print("Scrivi 'esci' per terminare.")
    mostra_stanza(mondo)
    
    while True:
        print("")
        try:
            comando_grezzo = input("> ")
        except EOFError:
            print("\nA presto!"); break
            
        comando_pulito = comando_grezzo.strip().lower()
        if not comando_pulito:
            continue
        if comando_pulito in ["esci", "quit"]:
            print("A presto!"); break
        
        parti = comando_pulito.split(maxsplit=1)
        verbo_giocatore = parti[0]
        argomento_comando = parti[1] if len(parti) > 1 else ""

        # --- Gestione Movimento ---
        direzione_normalizzata = DIREZIONI_VALIDI.get(verbo_giocatore)
        if direzione_normalizzata:
            vecchia_posizione = mondo.posizione_giocatore
            muovi_logica_default(mondo, direzione_normalizzata)
            if mondo.posizione_giocatore != vecchia_posizione: # Se il movimento è avvenuto
                mostra_stanza(mondo)
            continue

        # --- Gestione Azioni Standard ---
        nome_azione = mondo.mappa_verbi_giocatore.get(verbo_giocatore)
        if not nome_azione:
            print("Non capisco questo verbo.")
            continue
        azione = mondo.azioni[nome_azione]

        id_oggetto_risolto = None
        if azione.richiede_oggetto:
            if not argomento_comando:
                print(f"Cosa vorresti {verbo_giocatore}?")
                continue
            id_oggetto_risolto = risolvi_nome_oggetto(mondo, argomento_comando)
            if not id_oggetto_risolto or id_oggetto_risolto == "<ambiguo>":
                if id_oggetto_risolto is None:
                    print("Non vedo nulla del genere qui.")
                continue

        # --- MOTORE DI GIOCO v0.9.1 ---
        # 1. Controllo Regole "Invece di" con Valutazione Condizioni
        # PRIORITÀ: Prima le regole condizionali, poi quelle senza condizione
        regola_applicata = False
        if azione.richiede_oggetto:
            verbi_da_controllare = {verbo_giocatore, nome_azione}
            
            # FASE 1: Cerca regole CON condizione che si applicano
            for regola in mondo.regole:
                if regola.verbo in verbi_da_controllare and regola.id_oggetto_bersaglio == id_oggetto_risolto:
                    if regola.condizione and regola.condizione.valuta(mondo):
                        print(regola.risposta)
                        regola_applicata = True
                        break
            
            # FASE 2: Se nessuna regola condizionale si applica, cerca regole SENZA condizione
            if not regola_applicata:
                for regola in mondo.regole:
                    if regola.verbo in verbi_da_controllare and regola.id_oggetto_bersaglio == id_oggetto_risolto:
                        if not regola.condizione:
                            print(regola.risposta)
                            regola_applicata = True
                            break
        
        if regola_applicata:
            continue

        # 2. Esecuzione Logica di Default
        if azione.richiede_oggetto:
            azione.logica_di_default(mondo, id_oggetto_risolto)
        else:
            azione.logica_di_default(mondo)
        
        # Se l'azione era "guarda" o "aiuto", la descrizione è già stata stampata dalla logica di default
        # Altrimenti, se l'azione ha modificato lo stato del mondo (es. prendi/lascia), ristampa la stanza
        if nome_azione not in ["guarda", "aiuto", "esaminare", "prendere"]:
            mostra_stanza(mondo)


def main():
    if len(sys.argv) != 2:
        print("Uso: python gioco.py <percorso_file.fav>")
        sys.exit(1)
    percorso_file = sys.argv[1]
    try:
        print(f"[FAVELLA 1] Compilazione di '{percorso_file}' in corso...")
        mondo_compilato = analizza_file(percorso_file)
        if mondo_compilato is None:
            print("\n[FAVELLA 1] Compilazione fallita. Correggi gli errori e riprova.")
            sys.exit(1)
        print(str(mondo_compilato))
        gioca(mondo_compilato)
    except FileNotFoundError:
        print(f"[ERRORE FATALE] Il file '{percorso_file}' non è stato trovato.")
    except Exception as e:
        print(f"[ERRORE FATALE] Si è verificato un errore imprevisto: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    main()