
# compilatore.py
# Micro-Compilatore per FAVELLA 1 (v0.2)

from strutture import Mondo, Stanza, Oggetto
from utils import normalizza_nome
import sys
import re

def analizza_file(percorso_file: str) -> Mondo:
    """
    Analizza un file sorgente .fav e costruisce un oggetto Mondo.
    """
    mondo = Mondo()
    
    # --- Grammatica v0.2 ---
    p_stanza = re.compile(r"^(.*) è una stanza\.$", re.IGNORECASE)
    # Regex più flessibile per la descrizione
    p_descrizione = re.compile(r"^La descrizione (?:di|della|del|dell'|degli|delle) (.*) è \"(.*)\"\.$", re.IGNORECASE)
    p_oggetto_in_stanza = re.compile(r"^(.*) è (?:in|nel|nella|negli|nelle|nell') (.*)\.$", re.IGNORECASE)
    p_oggetto = re.compile(r"^(.*) è una cosa\.$", re.IGNORECASE)

    with open(percorso_file, 'r', encoding='utf-8') as file:
        for numero_riga, riga in enumerate(file, 1):
            riga = riga.strip()
            if not riga or riga.startswith('#'): # Ignora righe vuote e commenti
                continue

            # Tenta di matchare ogni regola della grammatica
            match_stanza = p_stanza.match(riga)
            if match_stanza:
                nome_grezzo = match_stanza.group(1)
                id_stanza = normalizza_nome(nome_grezzo)
                if not mondo.trova_stanza(id_stanza):
                    mondo.aggiungi_stanza(Stanza(id_stanza))
                else:
                    print(f"[ATTENZIONE] Riga {numero_riga}: La stanza '{id_stanza}' è già stata definita.")
                continue

            match_descrizione = p_descrizione.match(riga)
            if match_descrizione:
                nome_grezzo_stanza = match_descrizione.group(1)
                testo_descrizione = match_descrizione.group(2)
                id_stanza = normalizza_nome(nome_grezzo_stanza)
                
                stanza_trovata = mondo.trova_stanza(id_stanza)
                if stanza_trovata:
                    stanza_trovata.descrizione = testo_descrizione
                else:
                    print(f"[ERRORE] Riga {numero_riga}: Stai cercando di descrivere una stanza inesistente: '{id_stanza}'")
                continue

            match_oggetto_in_stanza = p_oggetto_in_stanza.match(riga)
            if match_oggetto_in_stanza:
                nome_grezzo_oggetto = match_oggetto_in_stanza.group(1)
                nome_grezzo_stanza = match_oggetto_in_stanza.group(2)
                id_oggetto = normalizza_nome(nome_grezzo_oggetto)
                id_stanza = normalizza_nome(nome_grezzo_stanza)
                
                if not mondo.oggetti.get(id_oggetto):
                    print(f"[ATTENZIONE] Riga {numero_riga}: L'oggetto '{id_oggetto}' viene collocato prima di essere definito come 'una cosa'. Lo definisco implicitamente.")
                    mondo.aggiungi_oggetto(Oggetto(id_oggetto))

                mondo.oggetti[id_oggetto].posizione = id_stanza
                if mondo.trova_stanza(id_stanza):
                     mondo.stanze[id_stanza].oggetti[id_oggetto] = mondo.oggetti[id_oggetto]
                else:
                     print(f"[ERRORE] Riga {numero_riga}: Stai collocando un oggetto in una stanza inesistente: '{id_stanza}'")
                continue
            
            match_oggetto = p_oggetto.match(riga)
            if match_oggetto:
                nome_grezzo_oggetto = match_oggetto.group(1)
                id_oggetto = normalizza_nome(nome_grezzo_oggetto)
                if not mondo.oggetti.get(id_oggetto):
                    mondo.aggiungi_oggetto(Oggetto(id_oggetto))
                else:
                    print(f"[ATTENZIONE] Riga {numero_riga}: L'oggetto '{id_oggetto}' è già stato definito.")
                continue

            print(f"[ERRORE DI SINTASSI] Riga {numero_riga}: Non capisco la frase -> '{riga}'")

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
