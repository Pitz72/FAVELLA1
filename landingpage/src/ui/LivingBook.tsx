import React, { useEffect, useRef, useState } from "react";
import { skipMotion, useInView } from "./hooks";

// Il cuore della Home: una frase italiana si scrive da sola e il mondo risponde.
// Le tre scene sono storie vere di FAVELLA 1: le risposte sono quelle che il motore
// stampa davvero (provate con favella_server, versione 1.4.2).

interface Passo {
  cmd: string;
  out: { t: "titolo" | "testo" | "dim" | "ok"; s: string }[];
}
interface Scena {
  file: string;
  code: string[];
  play: Passo[];
}

const SCENE: Scena[] = [
  {
    file: "cucina.fav",
    code: [
      "La cucina è una stanza.",
      'La descrizione della cucina è "Una cucina piccola, con la finestra aperta sul cortile.".',
      "Il tavolo è un supporto.",
      "Il tavolo è nella cucina.",
      "La chiave è una cosa.",
      "La chiave è sul tavolo.",
      "La chiave è prendibile.",
    ],
    play: [
      {
        cmd: "guarda",
        out: [
          { t: "titolo", s: "La cucina" },
          { t: "testo", s: "Una cucina piccola, con la finestra aperta sul cortile." },
          { t: "dim", s: "Puoi vedere qui: un tavolo." },
          { t: "dim", s: "Sul tavolo: una chiave." },
        ],
      },
      { cmd: "prendi la chiave", out: [{ t: "ok", s: "Preso: la chiave." }] },
    ],
  },
  {
    file: "studio.fav",
    code: [
      "La porta è chiusa.",
      "Il giocatore ha la chiave.",
      "Invece di apri la porta se il giocatore ha la chiave:",
      '  dire "La serratura scatta." e adesso la porta è aperta.',
    ],
    play: [
      { cmd: "apri la porta", out: [{ t: "ok", s: "La serratura scatta." }] },
    ],
  },
  {
    file: "cantina.fav",
    code: [
      "Il gatto è un personaggio.",
      'Il dialogo del gatto comincia con "saluto".',
      'Il gatto al nodo "saluto" dice "Miao. Hai portato il pesce?".',
      'Al nodo "saluto" l\'opzione "Forse." chiude il dialogo.',
    ],
    play: [
      {
        cmd: "parla con il gatto",
        out: [
          { t: "testo", s: "Il gatto: «Miao. Hai portato il pesce?»" },
          { t: "dim", s: "1. Forse." },
        ],
      },
      { cmd: "1", out: [{ t: "dim", s: "(Fine della conversazione.)" }] },
    ],
  },
];

// ── colorazione della sintassi ────────────────────────────────────────
const RE_TOKEN =
  /"[^"]*"?|Invece di|e adesso|è una stanza|è un supporto|è una cosa|è un personaggio|è prendibile|è nella|è sul|è nello|è chiusa|è aperta|comincia con|al nodo|chiude il dialogo|Il giocatore ha|La descrizione|Il dialogo|\b(?:se|dire|dice)\b|[.:]/g;

export const evidenzia = (riga: string): React.ReactNode[] => {
  const out: React.ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of riga.matchAll(RE_TOKEN)) {
    const i = m.index ?? 0;
    if (i > last) out.push(riga.slice(last, i));
    const t = m[0];
    const cls = t.startsWith('"') ? "text-favella-emerald" : t === "." || t === ":" ? "text-favella-amber" : "text-favella-cyan";
    out.push(
      <span key={k++} className={cls}>
        {t}
      </span>
    );
    last = i + t.length;
  }
  if (last < riga.length) out.push(riga.slice(last));
  return out;
};

const Dots = () => (
  <span className="flex gap-1.5">
    <span className="h-2.5 w-2.5 rounded-full bg-favella-flame/80" />
    <span className="h-2.5 w-2.5 rounded-full bg-favella-amber/80" />
    <span className="h-2.5 w-2.5 rounded-full bg-favella-emerald/80" />
  </span>
);

const LivingBook = ({ className = "" }: { className?: string }) => {
  const statico = typeof window === "undefined" || skipMotion();
  const [scena, setScena] = useState(0);
  const [code, setCode] = useState<string>(() => (statico ? SCENE[0].code.join("\n") : ""));
  const [giocate, setGiocate] = useState<Passo[]>(() => (statico ? SCENE[0].play : []));
  const [digitando, setDigitando] = useState("");
  const [scrivendo, setScrivendo] = useState(false);
  const [wrap, visibile] = useInView<HTMLDivElement>("0px");
  const box = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (statico || !visibile) return;
    let morto = false;
    const attendi = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    (async () => {
      let i = 0;
      while (!morto) {
        const sc = SCENE[i % SCENE.length];
        setScena(i % SCENE.length);
        setCode("");
        setGiocate([]);
        setDigitando("");
        await attendi(500);
        setScrivendo(true);
        const intero = sc.code.join("\n");
        for (let k = 1; k <= intero.length && !morto; k++) {
          setCode(intero.slice(0, k));
          await attendi(intero[k - 1] === "\n" ? 260 : 22);
        }
        setScrivendo(false);
        await attendi(700);
        for (const passo of sc.play) {
          if (morto) return;
          for (let k = 1; k <= passo.cmd.length && !morto; k++) {
            setDigitando(passo.cmd.slice(0, k));
            await attendi(70);
          }
          await attendi(280);
          setDigitando("");
          setGiocate((g) => [...g, passo]);
          await attendi(1500);
        }
        await attendi(2600);
        i++;
      }
    })();
    return () => {
      morto = true;
    };
  }, [statico, visibile]);

  // Inclinazione 3D che segue il puntatore.
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = box.current;
    if (!el || statico) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateY(${(px * 9).toFixed(2)}deg) rotateX(${(-py * 7).toFixed(2)}deg)`;
  };
  const onLeave = () => {
    if (box.current) box.current.style.transform = "rotateY(-4deg) rotateX(2deg)";
  };

  const righe = code.split("\n");
  const attuale = SCENE[scena];

  return (
    <div ref={wrap} className={`relative [perspective:1600px] ${className}`} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div
        ref={box}
        className="relative transition-transform duration-300 ease-out [transform-style:preserve-3d]"
        style={{ transform: "rotateY(-4deg) rotateX(2deg)" }}
      >
        {/* alone dietro le finestre */}
        <div
          aria-hidden="true"
          className="absolute -inset-10 -z-10 rounded-[48px] bg-[radial-gradient(60%_60%_at_40%_40%,rgba(34,211,238,0.22),transparent_70%)] blur-2xl"
        />

        {/* editor */}
        <div className="relative rounded-[22px] border border-favella-cyan/25 bg-favella-panel/95 shadow-[0_50px_120px_-40px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.03)_inset] backdrop-blur">
          <div className="flex items-center gap-3 border-b border-favella-cyan/10 px-5 py-3.5">
            <Dots />
            <span className="ml-1 rounded-md bg-favella-void/60 px-3 py-1 font-mono text-[11.5px] text-favella-text-secondary">
              {attuale.file}
            </span>
            <span className="ml-auto font-mono text-[10.5px] uppercase tracking-[0.2em] text-favella-text-muted">si scrive così</span>
          </div>
          <pre className="m-0 min-h-[236px] whitespace-pre-wrap px-5 pb-12 pt-5 font-mono text-[12.5px] leading-[1.9] text-favella-text-primary sm:text-[13px]">
            {righe.map((r, i) => (
              <div key={i} className={scrivendo && i === righe.length - 1 ? "caret" : ""}>
                {evidenzia(r)}
                {r === "" && i < righe.length - 1 ? " " : ""}
              </div>
            ))}
          </pre>
        </div>

        {/* gioco */}
        <div className="relative z-10 -mt-7 ml-auto w-[92%] rounded-[22px] border border-favella-emerald/25 bg-favella-surface/95 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95)] backdrop-blur [transform:translateZ(46px)]">
          <div className="flex items-center gap-3 border-b border-favella-emerald/12 px-5 py-3">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-favella-text-muted">e si gioca così</span>
            <span className="ml-auto h-2 w-2 rounded-full bg-favella-emerald shadow-[0_0_12px_#34d399]" />
          </div>
          <div className="min-h-[148px] space-y-2 p-5 text-[13.5px] leading-[1.7]">
            {giocate.map((g, i) => (
              <div key={i}>
                <div className="font-mono text-favella-text-muted">› {g.cmd}</div>
                {g.out.map((o, j) => (
                  <div
                    key={j}
                    className={
                      o.t === "titolo"
                        ? "mt-0.5 font-display font-semibold text-favella-cyan"
                        : o.t === "ok"
                          ? "text-favella-emerald"
                          : o.t === "dim"
                            ? "text-favella-text-muted"
                            : "font-serif italic text-favella-text-primary"
                    }
                  >
                    {o.s}
                  </div>
                ))}
              </div>
            ))}
            {digitando !== "" && (
              <div className="caret font-mono text-favella-text-muted">› {digitando}</div>
            )}
            {giocate.length === 0 && digitando === "" && (
              <div className="font-mono text-favella-text-muted/60">{scrivendo ? "…" : "›"}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivingBook;
