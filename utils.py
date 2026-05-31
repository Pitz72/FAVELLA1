# utils.py
# Modulo per le funzioni di utilità di FAVELLA 1

import re

# Articoli italiani riconosciuti come prefisso opzionale dei nomi-entità.
# Fonte unica: usata sia da normalizza_nome (rimozione) sia dalla grammatica
# della Passata 2 (prefisso opzionale del terminale ENTITA).
ARTICOLI = ["l'", "un'", "uno", "una", "il", "lo", "la", "i", "gli", "le", "un"]

# [Livello 4 / L1] DIREZIONI DI BASE — fonte UNICA condivisa da compilatore e
# runtime (prima erano cablate in 4 punti). Mappa: direzione canonica -> forme
# accettate in input (la prima è la canonica, la seconda l'abbreviazione storica).
# Nota quirk noto (G4): l'abbreviazione "e" di est coincide con la congiunzione
# "e"; il lexer contestuale le distingue per posizione.
DIREZIONI_BASE = {
    "nord": ("nord", "n"),
    "sud": ("sud", "s"),
    "est": ("est", "e"),
    "ovest": ("ovest", "o"),
}

# Coppie di direzioni opposte di base (per l'auto-ritorno delle connessioni).
DIREZIONI_OPPOSTE_BASE = {
    "nord": "sud", "sud": "nord",
    "est": "ovest", "ovest": "est",
}


def normalizza_tipografia(testo: str) -> str:
    """
    Normalizza apostrofi e virgolette "curve" (tipici di copia-incolla da
    editor di testo) nelle versioni dritte attese dalla grammatica [L2].
    Idempotente: applicarla più volte non cambia il risultato.
    """
    return (testo
            .replace('’', "'").replace('‘', "'")
            .replace('“', '"').replace('”', '"'))


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

    # 2. Rimuovi l'articolo iniziale. Gli articoli con apostrofo ("l'", "un'")
    #    sono attaccati al nome; gli altri richiedono lo spazio separatore.
    #    L'ordine di ARTICOLI gestisce "l'"/"un'" prima di "il"/"un".
    for articolo in ARTICOLI:
        prefisso = articolo if articolo.endswith("'") else articolo + " "
        if nome_processato.startswith(prefisso):
            nome_processato = nome_processato[len(prefisso):]
            break  # Trovato e rimosso l'articolo, esci dal ciclo

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
