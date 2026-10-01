import React, { useState } from "react";
import { Link } from "../router";
import {
  STUDIO_VERSION,
  DOWNLOAD_STUDIO_WINDOWS,
  DOWNLOAD_STUDIO_LINUX,
  STUDIO_RELEASE_URL,
  STUDIO_MAC_URL,
  STUDIO_SOURCE_URL,
} from "../constants";

// Le schermate dell'app, nell'ordine in cui si scrive una storia.
const SCHERMATE = [
  {
    id: "storia",
    nome: "Storia",
    img: "/studio/storia.webp",
    alt: "La sezione Storia di Favella Studio: il testo di un'avventura con le parole del linguaggio in ciano e i punti in ambra",
    testo: "Il testo della tua avventura, frase per frase, con i colori del manuale: le parole del linguaggio in ciano, i testi in smeraldo, i punti in ambra. Il motore controlla mentre scrivi e ti dice dove c'è un problema.",
  },
  {
    id: "mappa",
    nome: "Mappa",
    img: "/studio/mappa.webp",
    alt: "La mappa delle stanze di un'avventura: riquadri collegati da frecce con la direzione sopra",
    testo: "Le stanze diventano una mappa. Trascini da una stanza all'altra per collegarle e il testo si scrive da solo.",
  },
  {
    id: "oggetti",
    nome: "Oggetti",
    img: "/studio/oggetti.webp",
    alt: "L'editor degli oggetti: l'elenco a sinistra, il modulo a destra con tipo, posizione e proprietà",
    testo: "Un oggetto alla volta: che cos'è, dove sta, se si può prendere, se si apre o si accende. Scegli dall'elenco, il modulo scrive la frase giusta.",
  },
  {
    id: "personaggi",
    nome: "Personaggi",
    img: "/studio/personaggi.webp",
    alt: "L'editor dei dialoghi: personaggi, nodi di conversazione, battute e risposte modificabili sul posto",
    testo: "Chi vive nella storia e che cosa dice. Le conversazioni sono un copione che si modifica sul posto: battute, risposte, dove porta ogni scelta.",
  },
  {
    id: "regole",
    nome: "Regole",
    img: "/studio/regole.webp",
    alt: "L'editor delle regole: schede con «invece di», la condizione, la risposta e le conseguenze",
    testo: "Che cosa succede quando il giocatore agisce. «Invece di», «Prima di», «Dopo di» e «altrimenti», con le condizioni composte come blocchi: logica senza scrivere codice.",
  },
  {
    id: "parole",
    nome: "Parole e comandi",
    img: "/studio/parole.webp",
    alt: "Il pannello Parole e comandi: come comanda il giocatore, i verbi inventati e i sinonimi",
    testo: "I verbi che inventi, le parole che valgono come un'altra azione, e il modo in cui chi gioca dà i comandi: scrivendo, toccando i pulsanti, o tutti e due.",
  },
  {
    id: "prova",
    nome: "Prova",
    img: "/studio/prova.webp",
    alt: "La Prova: la partita a sinistra con i pulsanti-verbo, lo stato del mondo a destra",
    testo: "Provi la storia senza uscire dall'app, con i pulsanti-verbo che vedrà chi la riceve. A destra lo stato del mondo, la mappa e il passo passo, turno per turno.",
  },
] as const;

const SEZIONI = [
  ["Storia", "Il testo, con la sua struttura a vista."],
  ["Mondo", "Stanze, oggetti e la mappa che li collega."],
  ["Personaggi", "Chi parla, e che cosa dice."],
  ["Regole", "Che cosa succede, e le parole del giocatore."],
  ["Prova", "La partita, con lo stato accanto."],
] as const;

const Btn = ({ href, children, primary = false }: { href: string; children: React.ReactNode; primary?: boolean }) => (
  <a
    href={href}
    className={
      "flex items-center justify-between gap-4 rounded-lg border px-4 py-3 transition-colors " +
      (primary
        ? "border-favella-emerald/40 bg-favella-emerald/10 hover:border-favella-emerald hover:bg-favella-emerald/20"
        : "border-favella-cyan/25 bg-favella-panel/40 hover:border-favella-cyan hover:bg-favella-cyan/10")
    }
  >
    {children}
  </a>
);

const StudioPage = () => {
  const [attiva, setAttiva] = useState<(typeof SCHERMATE)[number]["id"]>("storia");
  const s = SCHERMATE.find((x) => x.id === attiva) ?? SCHERMATE[0];

  return (
    <section className="px-6 pb-28 pt-[74px]">
      {/* Hero */}
      <div className="mx-auto max-w-[920px] text-center">
        <img
          src="/studio/favella-studio-logo-256.png"
          alt="Il marchio di Favella Studio: un libro aperto fra due graffe, con una fiamma e il simbolo di avvio"
          width={132}
          height={132}
          className="mx-auto mb-7 rounded-[28px] shadow-[0_20px_80px_-20px_rgba(34,211,238,0.45)]"
        />
        <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.26em] text-favella-cyan">
          L'ambiente di scrittura · versione {STUDIO_VERSION}
        </p>
        <h1 className="mb-[22px] font-serif text-[clamp(38px,5.6vw,66px)] font-medium leading-[1.06] tracking-[-0.02em] text-favella-text-primary">
          Favella <span className="italic text-ink-accent">Studio</span>.
        </h1>
        <p className="mx-auto mb-8 max-w-[700px] font-serif text-[clamp(18px,2vw,22px)] leading-[1.6] text-favella-text-secondary">
          Scrivi la tua avventura in italiano, vedi le stanze diventare una mappa, componi dialoghi e regole senza
          scrivere una riga, e prova la storia come la giocherebbe chi la riceve. Tutto in un posto solo.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="#scarica"
            className="rounded-lg bg-favella-cyan px-6 py-3 font-display text-[15px] font-semibold text-favella-dark transition-colors hover:bg-favella-cyan-bright"
          >
            Scarica per Windows o Linux
          </a>
          <a
            href="#schermate"
            className="rounded-lg border border-favella-cyan/35 px-6 py-3 font-display text-[15px] font-semibold text-favella-cyan-bright transition-colors hover:border-favella-cyan hover:bg-favella-cyan/10"
          >
            Guardalo al lavoro
          </a>
        </div>
      </div>

      {/* Schermate */}
      <div id="schermate" className="mx-auto mt-16 max-w-[1120px] scroll-mt-24">
        <div role="tablist" aria-label="Le schermate di Favella Studio" className="mb-5 flex flex-wrap justify-center gap-2">
          {SCHERMATE.map((x) => (
            <button
              key={x.id}
              role="tab"
              aria-selected={attiva === x.id}
              onClick={() => setAttiva(x.id)}
              className={
                "rounded-full border px-4 py-1.5 font-display text-[13.5px] font-semibold transition-colors " +
                (attiva === x.id
                  ? "border-favella-cyan bg-favella-cyan text-favella-dark"
                  : "border-favella-cyan/25 text-favella-text-secondary hover:border-favella-cyan/60 hover:text-favella-text-primary")
              }
            >
              {x.nome}
            </button>
          ))}
        </div>
        <div className="overflow-hidden rounded-[18px] border border-favella-cyan/18 bg-favella-panel shadow-[0_50px_120px_-50px_rgba(0,0,0,0.85)]">
          <img src={s.img} alt={s.alt} width={1600} height={1000} className="block h-auto w-full" />
        </div>
        <p className="mx-auto mt-5 max-w-[760px] text-center text-[15.5px] leading-[1.7] text-favella-text-secondary">{s.testo}</p>
      </div>

      {/* Cinque sezioni */}
      <div className="mx-auto mt-24 max-w-[1040px]">
        <p className="mb-3 text-center font-mono text-[11px] uppercase tracking-[0.24em] text-favella-emerald">Com'è fatto</p>
        <h2 className="mb-9 text-center font-serif text-[clamp(26px,3.4vw,38px)] font-medium text-favella-text-primary">
          Cinque sezioni, <span className="italic text-favella-text-secondary">nell'ordine in cui si scrive una storia.</span>
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {SEZIONI.map(([nome, desc], i) => (
            <div key={nome} className="rounded-[14px] border border-favella-cyan/14 bg-favella-panel/40 p-5">
              <span className="font-mono text-[11px] text-favella-cyan">{i + 1}</span>
              <h3 className="mt-1 mb-1.5 font-display text-[17px] font-semibold text-favella-text-primary">{nome}</h3>
              <p className="text-[13.5px] leading-[1.6] text-favella-text-secondary">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tre idee */}
      <div className="mx-auto mt-20 grid max-w-[1040px] gap-7 md:grid-cols-3">
        {[
          [
            "Il testo e i pannelli sono la stessa cosa",
            "Ogni modifica dei pannelli visuali si scrive nel testo della storia, frase per frase, e si può disfare. Puoi affiancare il testo a qualunque pannello e vedere che cosa nasce. Niente formati nascosti: la tua storia è un file .fav, leggibile ovunque.",
          ],
          [
            "Dentro c'è il motore vero",
            "Lo stesso motore del linguaggio FAVELLA 1: ciò che provi qui è ciò che giocherà chi riceve la tua storia. E con un comando la esporti come una sola pagina web, che gira in qualunque browser, anche sul telefono.",
          ],
          [
            "Pensato per leggere bene",
            "Grandezza dell'interfaccia regolabile da 80% a 200% (Ctrl + / − / 0), contrasti alti, bersagli grandi, focus sempre visibile, tutto raggiungibile da tastiera. I font sono inclusi: l'app funziona anche senza rete.",
          ],
        ].map(([t, d]) => (
          <div key={t} className="rounded-[18px] border border-favella-cyan/16 bg-gradient-to-b from-favella-surface/50 to-favella-panel/30 p-7">
            <h3 className="mb-3 font-serif text-[21px] font-semibold text-favella-text-primary">{t}</h3>
            <p className="text-[14.5px] leading-[1.7] text-favella-text-secondary">{d}</p>
          </div>
        ))}
      </div>

      {/* Download */}
      <div id="scarica" className="mx-auto mt-24 max-w-[860px] scroll-mt-24">
        <div className="rounded-[20px] border border-favella-cyan/20 bg-gradient-to-b from-favella-surface/60 to-favella-panel/40 p-8 md:p-10">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-favella-emerald">Gratuito · open source (MIT)</p>
          <h2 className="mb-2 font-serif text-[30px] font-semibold text-favella-text-primary">Scarica Favella Studio {STUDIO_VERSION}</h2>
          <p className="mb-7 text-[15px] leading-[1.65] text-favella-text-secondary">
            Non serve installare Python né altro: il motore è dentro l'app.
          </p>
          <div className="flex flex-col gap-3">
            <Btn href={DOWNLOAD_STUDIO_WINDOWS} primary>
              <span>
                <span className="block font-display text-[15px] font-semibold text-favella-text-primary">Windows 10 / 11</span>
                <span className="block text-[12.5px] text-favella-text-muted">installer a 64 bit</span>
              </span>
              <span className="font-mono text-[12px] text-favella-emerald">↓ .exe</span>
            </Btn>
            <Btn href={DOWNLOAD_STUDIO_LINUX} primary>
              <span>
                <span className="block font-display text-[15px] font-semibold text-favella-text-primary">Linux</span>
                <span className="block text-[12.5px] text-favella-text-muted">qualunque distribuzione, x86_64</span>
              </span>
              <span className="font-mono text-[12px] text-favella-emerald">↓ .AppImage</span>
            </Btn>
            <Btn href={STUDIO_MAC_URL}>
              <span>
                <span className="block font-display text-[15px] font-semibold text-favella-text-primary">macOS — costruiscilo tu</span>
                <span className="block text-[12.5px] text-favella-text-muted">un comando, cinque minuti: l'app che ne esce è tua, e il Mac si fida</span>
              </span>
              <span className="font-mono text-[12px] text-favella-cyan">istruzioni ↗</span>
            </Btn>
          </div>

          <div className="mt-8 grid gap-5 text-[13.5px] leading-[1.65] text-favella-text-secondary sm:grid-cols-2">
            <p>
              <strong className="text-favella-text-primary">Windows.</strong> L'installer non è firmato con un certificato a pagamento: se compare
              «Windows ha protetto il PC», clicca <em>Ulteriori informazioni</em> e poi <em>Esegui comunque</em>.
            </p>
            <p>
              <strong className="text-favella-text-primary">Linux.</strong> Rendi eseguibile il file
              (<code className="font-mono text-[12px] text-favella-emerald">chmod +x FavellaStudio-*.AppImage</code>) e avvialo. Su alcune
              distribuzioni serve FUSE.
            </p>
          </div>
          <p className="mt-6 text-[13px] text-favella-text-muted">
            Tutti i file, con le note di versione, sono anche su{" "}
            <a href={STUDIO_RELEASE_URL} target="_blank" rel="noopener noreferrer" className="text-favella-cyan hover:underline">
              GitHub Releases
            </a>
            . Il codice è nella cartella <code className="font-mono text-favella-emerald">studio/</code> del{" "}
            <a href={STUDIO_SOURCE_URL} target="_blank" rel="noopener noreferrer" className="text-favella-cyan hover:underline">
              repository
            </a>
            .
          </p>
        </div>
      </div>

      <p className="mx-auto mt-14 max-w-[760px] text-center font-serif text-[16px] italic leading-[1.7] text-favella-text-muted">
        Preferisci il terminale? <Link to="/download" className="text-favella-cyan not-italic hover:underline">FAVELLA 1 si usa anche con un comando</Link>{" "}
        (<code className="font-mono not-italic">pip install favella1</code>), o{" "}
        <Link to="/programma" className="text-favella-cyan not-italic hover:underline">direttamente nel browser</Link>.
      </p>
    </section>
  );
};

export default StudioPage;
