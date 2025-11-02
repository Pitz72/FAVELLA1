# utils.py
# Modulo per le funzioni di utilità di FAVELLA 1

import re

def normalizza_nome(nome: str) -> str:
    """
    Prende una stringa grezza (es. "La Mela Rossa") e la normalizza in un ID
    univoco (es. "mela rossa").

    Esegue i seguenti passaggi:
    1. Converte tutto in minuscolo.
    2. Rimuove gli articoli determinativi e indeterminativi italiani all'inizio.
    3. Rimuove spazi bianchi extra.

    Args:
        nome: La stringa da normalizzare.

    Returns:
        L'ID normalizzato della stringa.
    """
    # 1. Converti in minuscolo
    nome_processato = nome.lower()

    # 2. Rimuovi articoli
    # Lista di articoli da rimuovere, inclusi quelli con apostrofo.
    # L'ordine è importante per gestire "l'" prima di "il", "la", etc.
    articoli = [
        "l'", "un'", "uno ", "una ", "il ", "lo ", "la ",
        "i ", "gli ", "le ", "un "
    ]
    
    for articolo in articoli:
        if nome_processato.startswith(articolo):
            # Rimuove l'articolo e il relativo spazio/apostrofo
            nome_processato = nome_processato[len(articolo):]
            break # Trovato e rimosso l'articolo, esci dal ciclo

    # 3. Rimuovi spazi bianchi extra ai lati
    nome_processato = nome_processato.strip()

    return nome_processato

# --- Sezione di Test ---
# Puoi eseguire questo file direttamente per testare la funzione
if __name__ == '__main__':
    nomi_test = [
        "La cucina",
        "cucina",
        "Il salotto",
        "uno gnomo",
        "Un'anatra",
        "L'albero maestro",
        "  spada arrugginita  "
    ]

    print("--- Test della funzione normalizza_nome ---")
    for nome in nomi_test:
        print(f"'{nome}' -> '{normalizza_nome(nome)}'")
