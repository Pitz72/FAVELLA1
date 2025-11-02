# compilatore.py
# Micro-Compilatore per FAVELLA 1 (v0.3) - Correzione Finale e Definitiva

from strutture import Mondo, Stanza, Oggetto
from utils import normalizza_nome
import sys
import re

def analizza_file(percorso_file: str) -> Mondo:
    mondo = Mondo()
    
    # --- Grammatica v0.3 (con regex specifiche e non-greedy) ---
    p_stanza = re.compile(r"^(.*?) è una stanza\.(?:\s*#.*)?$", re.IGNORECASE)
    p_descrizione = re.compile(r"^La descrizione (?:di|della|del|dell'|degli|delle) (.*?) è \"(.*?)\"\.(?:\s*#.*)?$", re.IGNORECASE)
    p_oggetto_in_stanza = re.compile(r"^(.*?) è (?:in|nel|nella|negli|nelle|nell') (.*?)\.(?:\s*#.*)?$", re.IGNORECASE)
    p_oggetto = re.compile(r"^(.*?) è una cosa\.(?:\s*#.*)?$", re.IGNORECASE)
    # REGEX FINALE: Escludiamo "una cosa" e le preposizioni di luogo in modo esplicito e non ambiguo.
    p_proprieta = re.compile(r"^(.*?) è (?!una cosa|in |nel |nella |negli |nelle |nell')(.*?)\.(?:\s*#.*)?$", re.IGNORECASE)

    with open(percorso_file, 'r', encoding='utf-8') as file:
        for numero_riga, riga in enumerate(file, 1):
            riga_originale = riga
            riga = riga.strip()
            if not riga or riga.startswith('#'):
                continue

            # La logica di match è cruciale, testiamo prima i casi più specifici.

            if p_descrizione.match(riga):
                match = p_descrizione.match(riga)
                nome_grezzo, testo = match.groups()
                id_entita = normalizza_nome(nome_grezzo)
                stanza = mondo.trova_stanza(id_entita)
                if stanza:
                    stanza.descrizione = testo
                else:
                    print(f"[ERRORE] Riga {numero_riga}: Stai descrivendo una stanza inesistente: '{id_entita}'")
                continue

            if p_oggetto_in_stanza.match(riga):
                match = p_oggetto_in_stanza.match(riga)
                nome_ogg, nome_sta = match.groups()
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

            if p_stanza.match(riga):
                match = p_stanza.match(riga)
                id_sta = normalizza_nome(match.group(1))
                if not mondo.trova_stanza(id_sta):
                    mondo.aggiungi_stanza(Stanza(id_sta))
                continue
            
            if p_oggetto.match(riga):
                match = p_oggetto.match(riga)
                id_ogg = normalizza_nome(match.group(1))
                if not mondo.trova_oggetto(id_ogg):
                    mondo.aggiungi_oggetto(Oggetto(id_ogg))
                continue

            if p_proprieta.match(riga):
                match = p_proprieta.match(riga)
                nome_ogg, nome_prop = match.groups()
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

def main():
    if len(sys.argv) != 2:
        print("Uso: python compilatore.py <percorso_file.fav>")
        sys.exit(1)
    percorso_file = sys.argv[1]
    try:
        mondo_compilato = analizza_file(percorso_file)
        print("\n" + str(mondo_compilato))
    except FileNotFoundError:
        print(f"Errore: Il file '{percorso_file}' non è stato trovato.")
    except Exception as e:
        print(f"Si è verificato un errore imprevisto: {e}")

if __name__ == "__main__":
    main()
