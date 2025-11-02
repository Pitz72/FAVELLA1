# compilatore.py
# Micro-Compilatore per FAVELLA 1 (v0.4) - Corretto

from strutture import Mondo, Stanza, Oggetto, Regola # Aggiungi Regola
from utils import normalizza_nome
import sys
import re

def analizza_file(percorso_file: str) -> Mondo:
    mondo = Mondo()
    
    # --- Grammatica v0.4 ---
    # CORREZIONE: Usiamo (.*?) non-greedy per il verbo per evitare che catturi parte dell'oggetto.
    p_regola_invece_di = re.compile(r"^Invece di (.*?) (.*): dire \"(.*)\"\.$", re.IGNORECASE)

    # Regex della v0.3
    p_stanza = re.compile(r"^(.*?) è una stanza\.(?:\s*#.*)?$", re.IGNORECASE)
    p_descrizione = re.compile(r"^La descrizione (?:di|della|del|dell'|degli|delle) (.*?) è \"(.*?)\"\.(?:\s*#.*)?$", re.IGNORECASE)
    p_oggetto_in_stanza = re.compile(r"^(.*?) è (?:in|nel|nella|negli|nelle|nell') (.*?)\.(?:\s*#.*)?$", re.IGNORECASE)
    p_oggetto = re.compile(r"^(.*?) è una cosa\.(?:\s*#.*)?$", re.IGNORECASE)
    p_proprieta = re.compile(r"^(.*?) è (?!una cosa|in |nel |nella |negli |nelle |nell')(.*?)\.(?:\s*#.*)?$", re.IGNORECASE)

    with open(percorso_file, 'r', encoding='utf-8') as file:
        for numero_riga, riga in enumerate(file, 1):
            riga_originale = riga
            riga = riga.strip()
            if not riga or riga.startswith('#'):
                continue

            # --- Logica di Parsing ---

            match_regola = p_regola_invece_di.match(riga)
            if match_regola:
                verbo, ogg_grezzo, risposta = match_regola.groups()
                id_ogg = normalizza_nome(ogg_grezzo)

                if mondo.trova_oggetto(id_ogg):
                    nuova_regola = Regola(verbo.lower(), id_ogg, risposta)
                    mondo.aggiungi_regola(nuova_regola)
                else:
                    print(f"[ERRORE] Riga {numero_riga}: Stai creando una regola per un oggetto inesistente: '{id_ogg}'")
                continue

            # --- Logica di parsing della v0.3 ---

            match_descrizione = p_descrizione.match(riga)
            if match_descrizione:
                nome_grezzo, testo = match_descrizione.groups()
                id_entita = normalizza_nome(nome_grezzo)
                stanza = mondo.trova_stanza(id_entita)
                if stanza:
                    stanza.descrizione = testo
                else:
                    print(f"[ERRORE] Riga {numero_riga}: Stai descrivendo una stanza inesistente: '{id_entita}'")
                continue

            match_oggetto_in_stanza = p_oggetto_in_stanza.match(riga)
            if match_oggetto_in_stanza:
                nome_ogg, nome_sta = match_oggetto_in_stanza.groups()
                id_ogg, id_sta = normalizza_nome(nome_ogg), normalizza_nome(nome_sta)
                
                oggetto = mondo.trova_oggetto(id_ogg)
                stanza = mondo.trova_stanza(id_sta)

                if oggetto and stanza:
                    oggetto.posizione = id_sta
                    stanza.oggetti[id_ogg] = oggetto
                elif not stanza:
                    print(f"[ERRORE] Riga {numero_riga}: Stanza inesistente '{id_sta}'")
                else:
                    print(f"[ERRORE] Riga {numero_riga}: Oggetto inesistente '{id_ogg}'")
                continue

            match_stanza = p_stanza.match(riga)
            if match_stanza:
                id_sta = normalizza_nome(match_stanza.group(1))
                if not mondo.trova_stanza(id_sta):
                    mondo.aggiungi_stanza(Stanza(id_sta))
                continue
            
            match_oggetto = p_oggetto.match(riga)
            if match_oggetto:
                id_ogg = normalizza_nome(match_oggetto.group(1))
                if not mondo.trova_oggetto(id_ogg):
                    mondo.aggiungi_oggetto(Oggetto(id_ogg))
                continue

            match_proprieta = p_proprieta.match(riga)
            if match_proprieta:
                nome_ogg, nome_prop = match_proprieta.groups()
                id_ogg = normalizza_nome(nome_ogg)
                id_prop = normalizza_nome(nome_prop.strip())
                oggetto = mondo.trova_oggetto(id_ogg)
                if oggetto:
                    oggetto.aggiungi_proprieta(id_prop)
                else:
                    print(f"[ERRORE] Riga {numero_riga}: Stai assegnando una proprietà a un oggetto inesistente: '{id_ogg}'")
                continue

            print(f"[ERRORE DI SINTASSI] Riga {numero_riga}: Non capisco la frase -> '{riga_originale.strip()}'")

    return mondo

# La funzione main ora serve solo per il debug del compilatore
def main():
    print("Eseguire 'gioco.py' per avviare l'interprete.")

if __name__ == "__main__":
    main()
