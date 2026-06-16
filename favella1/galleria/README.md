# Galleria di FAVELLA 1

Avventure **brevi, complete e vincibili**, con il sorgente commentato. Servono a
due cose: divertirsi in cinque-dieci minuti e imparare leggendo come sono fatte.

| Storia | Genere | Difficoltà | Mostra |
|--------|--------|:---------:|--------|
| [**Il Faro Spento**](il-faro/il-faro.fav) | mistero atmosferico | ⭐ | direzioni custom, chiave in contenitore, regola a due oggetti, verbo custom |
| [**Il Giardino Murato**](il-giardino-murato/il-giardino-murato.fav) | fiaba / enigma | ⭐⭐ | dialogo a nodi, opzione condizionale che vince, proprietà opposte |
| [**Il Forziere dei Tre Sigilli**](i-tre-sigilli/i-tre-sigilli.fav) | enigma gotico | ⭐⭐ | contatore, demone a fronte di salita, evento a turni, interpolazione |

## Come si giocano

### Se hai clonato il repo

```sh
python favella.py gioca favella1/galleria/il-faro/il-faro.fav
```

### Se hai installato FAVELLA con pip

```sh
favella1 galleria                  # elenca le storie
favella1 galleria gioca il-faro    # gioca una storia per id
favella1 galleria copia il-faro    # copia il sorgente nella cartella corrente
```

## Vuoi qualcosa di più grande?

Queste sono storie da una seduta. Per avventure più ampie e articolate — più
stanze, più enigmi, più finali — guarda le **demo ufficiali** in
[`esempi/demo/`](../../esempi/demo/): «Il Relitto Silente» (sci-fi, 15 stanze),
«La Casa di Via Stradivari», «Notte di Gara», «La Notte Lunga», e altre.

## Soluzioni rapide (spoiler)

<details>
<summary>Il Faro Spento</summary>

`nord` · `apri cassapanca` · `prendi chiave della botola` · `prendi fiammiferi` ·
`usa chiave della botola con botola` · `vai sopra` · `accendi grande lampada`
</details>

<details>
<summary>Il Giardino Murato</summary>

`sposta panchina` · `prendi chiave di ottone` · `nord` ·
`usa chiave di ottone con porta di vetro` · `est` · `prendi rosa d'oro` ·
`ovest` · `parla giardiniere` → opzione «Ho una rosa d'oro per te.» → «Attraversi il varco».
</details>

<details>
<summary>Il Forziere dei Tre Sigilli</summary>

`nord` · `esamina tomo` · `sud` · `sotto` · `apri sarcofago` · `sopra` · `est` ·
`suona campana` · `ovest` · `apri forziere`
</details>
