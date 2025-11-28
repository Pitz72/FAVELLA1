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
    
    # Priorità 0: Direzioni (anche con "a " davanti)
    nome_pulito = nome_parziale
    if nome_pulito.startswith("a ") and len(nome_pulito) > 2:
        nome_pulito = nome_pulito[2:].strip()
        
    if nome_pulito in ["nord", "sud", "est", "ovest"]:
        return nome_pulito

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

PREPOSIZIONI = ["su", "con", "contro", "in"]

def elabora_comando(mondo: Mondo, comando_grezzo: str) -> bool:
    """
    Esegue un singolo comando di gioco.
    Restituisce True se il gioco deve continuare, False se il giocatore vuole uscire.
    """
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
                        if regola.conseguenza_testo:
                            applica_conseguenza(mondo, regola.conseguenza_testo)
                        regola_movimento_applicata = True
                        break
            
            # FASE 2: Regole Semplici
            if not regola_movimento_applicata:
                for regola in mondo.regole:
                    if (regola.verbo == "vai" and regola.id_oggetto_bersaglio == direzione_normalizzata):
                        if not regola.condizione:
                            print(regola.risposta)
                            if regola.conseguenza_testo:
                                applica_conseguenza(mondo, regola.conseguenza_testo)
                            regola_movimento_applicata = True
                            break

            if regola_movimento_applicata:
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
            if regola_da_eseguire and regola_da_eseguire.conseguenza_testo:
                applica_conseguenza(mondo, regola_da_eseguire.conseguenza_testo)
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

def applica_conseguenza(mondo: Mondo, testo: str):
    """
    Esegue una conseguenza di cambio stato (v0.1.2).
    Supporta:
    - [OGGETTO] è [PROPRIETÀ] (es. "la porta è aperta")
    - [OGGETTO] è in [LUOGO] (es. "la chiave è in inventario", "la mela è nel nulla")
    """
    import re
    
    # Pattern per proprietà: [OGGETTO] è [PROPRIETÀ]
    # Esclude "in", "nel", ecc. per non confondersi con la posizione
    p_proprieta = re.compile(r"^(.*?) è (?!in |nel |nella |negli |nelle |nell'|sul |sulla |sullo |sui |sugli |sulle )(.*?)$", re.IGNORECASE)
    
    # Pattern per posizione: [OGGETTO] è in [LUOGO]
    p_posizione = re.compile(r"^(.*?) è (?:in|nel|nella|negli|nelle|nell'|sul|sulla|sullo|sui|sugli|sulle) (.*?)$", re.IGNORECASE)

    match_pos = p_posizione.match(testo)
    if match_pos:
        nome_ogg, nome_luogo = match_pos.groups()
        id_ogg = normalizza_nome(nome_ogg)
        id_luogo = normalizza_nome(nome_luogo)
        
        oggetto = mondo.trova_oggetto(id_ogg)
        if not oggetto:
            print(f"[ERRORE CONSEGUENZA] Oggetto '{id_ogg}' non trovato.")
            return

        # Rimozione dal gioco ("nel nulla")
        if id_luogo in ["nulla", "nessun luogo", "nessuno"]:
            # Rimuovi dalla posizione attuale
            if oggetto.posizione == "inventario":
                mondo.inventario.remove(id_ogg)
            elif oggetto.posizione and oggetto.posizione in mondo.stanze:
                del mondo.stanze[oggetto.posizione].oggetti[id_ogg]
            
            oggetto.posizione = None
            # print(f"[DEBUG] {oggetto.nome} rimosso dal gioco.")
            return

        # Spostamento in Inventario
        if id_luogo == "inventario":
            # Rimuovi da vecchia pos
            if oggetto.posizione and oggetto.posizione in mondo.stanze:
                del mondo.stanze[oggetto.posizione].oggetti[id_ogg]
            
            mondo.inventario.add(id_ogg)
            oggetto.posizione = "inventario"
            return

        # Spostamento in Stanza
        stanza_dest = mondo.trova_stanza(id_luogo)
        if stanza_dest:
            # Rimuovi da vecchia pos
            if id_ogg in mondo.inventario:
                mondo.inventario.remove(id_ogg)
            elif oggetto.posizione and oggetto.posizione in mondo.stanze:
                del mondo.stanze[oggetto.posizione].oggetti[id_ogg]
            
            stanza_dest.oggetti[id_ogg] = oggetto
            oggetto.posizione = id_luogo
        else:
            print(f"[ERRORE CONSEGUENZA] Luogo '{id_luogo}' non trovato.")
        return

    match_prop = p_proprieta.match(testo)
    if match_prop:
        nome_ogg, nome_prop = match_prop.groups()
        id_ogg = normalizza_nome(nome_ogg)
        id_prop = normalizza_nome(nome_prop)
        
        oggetto = mondo.trova_oggetto(id_ogg)
        if oggetto:
            oggetto.aggiungi_proprieta(id_prop)
            # Logica speciale per stati opposti (opzionale ma utile)
            if id_prop == "aperta" and "chiusa" in oggetto.proprieta:
                oggetto.proprieta.remove("chiusa")
            elif id_prop == "chiusa" and "aperta" in oggetto.proprieta:
                oggetto.proprieta.remove("aperta")
        else:
            print(f"[ERRORE CONSEGUENZA] Oggetto '{id_ogg}' non trovato.")
        return

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
    if nome_azione not in ["guarda", "aiuto", "esaminare", "prendere", "usare"]:
        mostra_stanza(mondo)
    
    return True

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