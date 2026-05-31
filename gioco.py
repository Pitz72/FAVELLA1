# gioco.py
# Interprete Interattivo per FAVELLA 1 (v0.8.1)

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

    print(f"\n--- {stanza_corrente.nome_visualizzato.capitalize()} ---")
    print(stanza_corrente.descrizione)
    
    oggetti_nella_stanza = list(stanza_corrente.oggetti.values())
    if oggetti_nella_stanza:
        nomi_oggetti = [ogg.nome_visualizzato for ogg in oggetti_nella_stanza]
        print(f"Puoi vedere qui: {', '.join(nomi_oggetti)}.")

    # Mostra le uscite disponibili
    if stanza_corrente.uscite:
        uscite_str = ", ".join([f"{d.capitalize()} ({mondo.trova_stanza(id_s).nome_visualizzato.capitalize()})" for d, id_s in stanza_corrente.uscite.items()])
        print(f"Uscite: {uscite_str}.")

def risolvi_nome_oggetto(mondo: Mondo, nome_parziale: str) -> str | None:
    """Cerca di risolvere un nome parziale in un ID oggetto univoco nello scope attuale."""
    if not nome_parziale:
        return None

    stanza_corrente = mondo.trova_stanza(mondo.posizione_giocatore)
    if not stanza_corrente:
        return None

    oggetti_in_scope = list(stanza_corrente.oggetti.keys()) + list(mondo.inventario)
    
    # Priorità 0: Direzioni (anche con "a " davanti)
    nome_pulito = nome_parziale.strip().lower()
    if nome_pulito.startswith("a ") and len(nome_pulito) > 2:
        nome_pulito = nome_pulito[2:].strip()
        
    if nome_pulito in ["nord", "sud", "est", "ovest", "n", "s", "e", "o"]:
        mappa_direzioni = {"n": "nord", "s": "sud", "e": "est", "o": "ovest"}
        return mappa_direzioni.get(nome_pulito, nome_pulito)

    # Normalizza l'input per trovare gli oggetti del gioco
    nome_normalizzato = normalizza_nome(nome_parziale)

    # [Livello 4] Risoluzione alias: un nome alternativo dichiarato dall'autore
    # ('La torcia si chiama anche "lanterna".') rimanda all'id canonico. Il nome
    # proprio dell'oggetto ha comunque la precedenza (controllato dopo).
    alias = getattr(mondo, "alias", {})
    nome_risolto = alias.get(nome_normalizzato, nome_normalizzato)

    # Priorità 1: Corrispondenza esatta (sul nome, poi sull'alias risolto)
    if nome_normalizzato in oggetti_in_scope:
        return nome_normalizzato
    if nome_risolto in oggetti_in_scope:
        return nome_risolto

    # Priorità 2: Corrispondenza parziale univoca. Il pool di candidati include
    # gli id in scope e gli alias (parziali) che rimandano a oggetti in scope.
    candidati = [id_ogg for id_ogg in oggetti_in_scope if nome_normalizzato in id_ogg]
    for ali, canonico in alias.items():
        if canonico in oggetti_in_scope and nome_normalizzato in ali and canonico not in candidati:
            candidati.append(canonico)

    if len(candidati) == 1:
        return candidati[0]
    elif len(candidati) > 1:
        print(f"Quale intendi di preciso? ({', '.join(candidati)})")
        return "<ambiguo>"
    else:
        return None


PREPOSIZIONI = ["su", "con", "contro", "in"]


def partita_finita(mondo: Mondo) -> bool:
    """[Livello 3] Controlla lo stato della partita dopo l'esecuzione delle
    conseguenze. Se una conseguenza di fine partita l'ha terminata, stampa
    l'esito e restituisce True (il loop di gioco deve fermarsi)."""
    stato = getattr(mondo, "stato_partita", "in_corso")
    if stato == "in_corso":
        return False
    if stato == "vinta":
        print("\n*** HAI VINTO! ***")
    elif stato == "persa":
        print("\n*** HAI PERSO. ***")
    else:
        print("\n*** La partita è terminata. ***")
    return True

def avanza_turno_e_processa(mondo: Mondo) -> bool:
    """[Livello 3] Avanza il contatore dei turni di un'unità e attiva gli eventi
    temporali che scattano a quel turno. Restituisce True se un evento ha
    terminato la partita (il loop deve fermarsi)."""
    mondo.turno_corrente += 1
    t = mondo.turno_corrente
    for evento in mondo.eventi:
        if evento.scatta_a(t):
            print(evento.risposta)
            evento.esegui_conseguenze(mondo)
            if partita_finita(mondo):
                return True
    return False


def elabora_comando(mondo: Mondo, comando_grezzo: str) -> bool:
    """
    Esegue un singolo comando di gioco e, se il comando rappresenta un turno,
    avanza il contatore dei turni elaborando gli eventi temporali (Livello 3).
    Restituisce True se il gioco deve continuare, False se deve terminare
    (uscita del giocatore, fine partita o evento terminale).
    """
    comando_pulito = comando_grezzo.strip().lower()
    if not comando_pulito:
        return True
    if comando_pulito in ["esci", "quit"]:
        print("A presto!")
        return False

    # Un comando non vuoto e diverso da 'esci' conta come un turno di gioco.
    continua = _esegui_comando(mondo, comando_grezzo)
    if not continua:
        return False
    if avanza_turno_e_processa(mondo):
        return False
    return True


def _esegui_comando(mondo: Mondo, comando_grezzo: str) -> bool:
    """Elabora un singolo comando (parsing + applicazione di regole/azioni),
    senza gestire l'avanzamento dei turni. Restituisce True per continuare."""
    try:
        comando_pulito = comando_grezzo.strip().lower()
        if not comando_pulito:
            return True
        if comando_pulito in ["esci", "quit"]:
            print("A presto!")
            return False

        # --- PARSING INTELLIGENTE v0.2 ---
        # Cerchiamo preposizioni per spezzare il comando
        verbo_giocatore = ""
        argomento_sx = ""
        preposizione_trovata = None
        argomento_dx = ""

        # Tokenizzazione semplice
        parole = comando_pulito.split()
        if not parole:
            return True
        
        verbo_giocatore = parole[0]
        
        # Cerca la prima preposizione nota
        indice_prep = -1
        for i, parola in enumerate(parole):
            if parola in PREPOSIZIONI:
                indice_prep = i
                preposizione_trovata = parola
                break
        
        if indice_prep > 0: # Trovata preposizione (non come prima parola)
            # Ricostruisci le parti
            # Esempio: "usa chiave con porta" -> verbo="usa", arg_sx="chiave", prep="con", arg_dx="porta"
            argomento_sx = " ".join(parole[1:indice_prep])
            argomento_dx = " ".join(parole[indice_prep+1:])
        else:
            # Parsing classico SVO (Verbo + Oggetto)
            argomento_sx = " ".join(parole[1:])

        # --- Gestione Movimento ---
        direzione_normalizzata = DIREZIONI_VALIDI.get(verbo_giocatore)
        if direzione_normalizzata:
            # Check per regole "Invece di vai a [direzione]"
            # Simuliamo un'azione "vai" con oggetto "direzione"
            regola_movimento_applicata = False
            
            # FASE 1: Regole Condizionali
            for regola in mondo.regole:
                if (regola.verbo == "vai" and regola.id_oggetto_bersaglio == direzione_normalizzata):
                    if regola.condizione and regola.condizione.valuta(mondo):
                        print(regola.risposta)
                        regola.esegui_conseguenze(mondo)
                        regola_movimento_applicata = True
                        break
            
            # FASE 2: Regole Semplici
            if not regola_movimento_applicata:
                for regola in mondo.regole:
                    if (regola.verbo == "vai" and regola.id_oggetto_bersaglio == direzione_normalizzata):
                        if not regola.condizione:
                            print(regola.risposta)
                            regola.esegui_conseguenze(mondo)
                            regola_movimento_applicata = True
                            break

            if regola_movimento_applicata:
                if partita_finita(mondo):
                    return False
                return True

            vecchia_posizione = mondo.posizione_giocatore
            muovi_logica_default(mondo, direzione_normalizzata)
            if mondo.posizione_giocatore != vecchia_posizione: # Se il movimento è avvenuto
                mostra_stanza(mondo)
            return True

        # --- Gestione Azioni Standard ---
        nome_azione = mondo.mappa_verbi_giocatore.get(verbo_giocatore)
        if not nome_azione:
            print("Non capisco questo verbo.")
            return True
        azione = mondo.azioni[nome_azione]

        id_oggetto1 = None
        id_oggetto2 = None

        if azione.richiede_oggetto:
            if not argomento_sx:
                print(f"Cosa vorresti {verbo_giocatore}?")
                return True
            
            id_oggetto1 = risolvi_nome_oggetto(mondo, argomento_sx)
            if not id_oggetto1 or id_oggetto1 == "<ambiguo>":
                if id_oggetto1 is None:
                    print(f"Non vedo '{argomento_sx}' qui.")
                return True
            
            if preposizione_trovata and argomento_dx:
                id_oggetto2 = risolvi_nome_oggetto(mondo, argomento_dx)
                if not id_oggetto2 or id_oggetto2 == "<ambiguo>":
                    if id_oggetto2 is None:
                        print(f"Non vedo '{argomento_dx}' qui.")
                    return True

        # --- MOTORE DI GIOCO v0.9.5 (Supporto 2 Oggetti) ---
        regola_applicata = False
        regola_da_eseguire = None # Memorizza la regola trovata per eseguirne la conseguenza
        
        if azione.richiede_oggetto:
            verbi_da_controllare = {verbo_giocatore, nome_azione}
            
            # FASE 0: Regole a DUE OGGETTI (Priorità Massima)
            if id_oggetto2:
                for regola in mondo.regole:
                    if (regola.verbo in verbi_da_controllare and 
                        regola.id_oggetto_bersaglio == id_oggetto1 and
                        regola.preposizione == preposizione_trovata and
                        regola.id_oggetto_secondario == id_oggetto2):
                        
                        print(regola.risposta)
                        regola_applicata = True
                        regola_da_eseguire = regola
                        break
                
                # FALLBACK tollerante per le preposizioni nelle regole a due oggetti
                if not regola_applicata:
                    for regola in mondo.regole:
                        if (regola.verbo in verbi_da_controllare and 
                            regola.id_oggetto_bersaglio == id_oggetto1 and
                            regola.id_oggetto_secondario == id_oggetto2):
                            
                            print(regola.risposta)
                            regola_applicata = True
                            regola_da_eseguire = regola
                            break
            
            # FASE 1: Regole Condizionali (1 Oggetto)
            if not regola_applicata:
                for regola in mondo.regole:
                    if (regola.verbo in verbi_da_controllare and 
                        regola.id_oggetto_bersaglio == id_oggetto1 and
                        regola.id_oggetto_secondario is None): # Importante: solo regole a 1 oggetto
                        
                        if regola.condizione and regola.condizione.valuta(mondo):
                            print(regola.risposta)
                            regola_applicata = True
                            regola_da_eseguire = regola
                            break
            
            # FASE 2: Regole Semplici (1 Oggetto)
            if not regola_applicata:
                for regola in mondo.regole:
                    if (regola.verbo in verbi_da_controllare and 
                        regola.id_oggetto_bersaglio == id_oggetto1 and
                        regola.id_oggetto_secondario is None):
                        
                        if not regola.condizione:
                            print(regola.risposta)
                            regola_applicata = True
                            regola_da_eseguire = regola
                            break
        
        if regola_applicata:
            if regola_da_eseguire:
                regola_da_eseguire.esegui_conseguenze(mondo)
                if partita_finita(mondo):
                    return False
            return True

        # 2. Esecuzione Logica di Default
        if azione.richiede_oggetto:
            # Passiamo anche il secondo oggetto se presente (la logica dell'azione deve supportarlo)
            try:
                azione.logica_di_default(mondo, id_oggetto1, id_oggetto2)
            except TypeError:
                # Fallback per azioni che non accettano il secondo argomento
                azione.logica_di_default(mondo, id_oggetto1)
        else:
            azione.logica_di_default(mondo)
        
        # Se l'azione era "guarda" o "aiuto", la descrizione è già stata stampata dalla logica di default
        # Altrimenti, se l'azione ha modificato lo stato del mondo (es. prendi/lascia), ristampa la stanza
        if nome_azione not in ["guarda", "aiuto", "esaminare", "prendere", "usare", "inventario"]:
            mostra_stanza(mondo)
        
        return True
    except Exception as e:
        print(f"[ERRORE CRITICO] Si è verificato un errore durante l'esecuzione del comando: {e}")
        traceback.print_exc()
        return True # Non crashare il gioco, continua


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
            
        if not elabora_comando(mondo, comando_grezzo):
            break


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