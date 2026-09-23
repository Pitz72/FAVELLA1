// ====================================================================
//  «Come si gioca»: la guida, un solo componente per il menu d'avvio del
//  trailer e per il gioco. Misure in em: la dimensione base arriva da fuori
//  (`base`), così si adatta alla superficie 1920 del trailer, alla 1280 del
//  gioco e al telefono.
// ====================================================================
const SERIF = "'Lora', Georgia, serif";
const DISPLAY = "'Sora', 'Inter', sans-serif";
const MONO = "'Source Code Pro', ui-monospace, monospace";

interface Scheda { titolo: string; segno: string; testo: string; esempi?: string[] }

const SCHEDE: Scheda[] = [
  { titolo: "Scrivi quello che fai", segno: "M4 18 L16 6 M13 5 L17 9 M4 18 L3 21 L6 20",
    testo: "Si gioca a parole, in italiano. Scrivi un comando e premi Invio: il mondo risponde. Uscite, cose e persone del luogo sono anche pulsanti da toccare.",
    esempi: ["guarda", "nord", "esamina la mappa", "prendi il coltello", "parla con Nunzio"] },
  { titolo: "Il corpo", segno: "M12 3 C8 9 6 12 6 15 A6 6 0 0 0 18 15 C18 12 16 9 12 3 Z",
    testo: "La sete sale col tempo e sotto il sole; la fame più piano. Oltre certe soglie la vita cala, e torna poco. Bevi e mangia quando serve: senza bisogno non si spreca niente.",
    esempi: ["bevi", "mangia qualcosa", "stato"] },
  { titolo: "Acqua, cibo, baratto", segno: "M5 9 H19 L17 20 H7 Z M9 9 V6 A3 3 0 0 1 15 6 V9",
    testo: "Acqua e cibo sono scorte che si contano. Si barattano parlando con le persone, si trovano attingendo dove l'acqua c'è ancora: un pozzo, una pompa, una sorgente.",
    esempi: ["attingi", "parla con Ciro"] },
  { titolo: "Parlare", segno: "M4 5 H20 V15 H10 L6 19 V15 H4 Z",
    testo: "Nei dialoghi scegli una risposta col numero o toccandola. I doni fanno crescere la fiducia, e la fiducia apre porte, pozzi, sentieri.",
    esempi: ["1", "2"] },
  { titolo: "La bisaccia", segno: "M6 8 H18 L19 20 H5 Z M9 8 A3 3 0 0 1 15 8",
    testo: "Porti sette cose: la tanica e il biglietto di casa, più cinque a scelta. Quando è piena, lascia ciò che non serve. Alcune cose si usano su altre.",
    esempi: ["inventario", "lascia la batteria", "usa le pastiglie su la pompa"] },
  { titolo: "Leggere il mondo", segno: "M3 12 C6 6 18 6 21 12 C18 18 6 18 3 12 Z M12 9 A3 3 0 1 0 12 15 A3 3 0 1 0 12 9",
    testo: "Le parole in MAIUSCOLO sono cose con cui fare qualcosa; tra parentesi ci sono i suggerimenti. Se sbagli una mossa, puoi tornare indietro. Sei finali: come arrivi decide quale.",
    esempi: ["annulla"] },
];

export default function ComeSiGioca({ base, accento = "#f0b77e", onChiudi, compatto = false }:
  { base: number; accento?: string; onChiudi: () => void; compatto?: boolean }) {
  return (
    <div role="dialog" aria-modal="true" aria-label="Come si gioca"
      style={{ fontSize: base, position: "absolute", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(4,4,8,.72)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", animation: "kf-launch .35s ease both", pointerEvents: "auto" }}
      onClick={onChiudi}>
      <div onClick={(e) => e.stopPropagation()} className="gv-scroll"
        style={{ width: compatto ? "100%" : "min(74em, 94%)", maxHeight: compatto ? "100%" : "94%", overflowY: "auto", boxSizing: "border-box",
          padding: compatto ? "1.6em 1.2em 2em" : "2.4em 2.6em", borderRadius: compatto ? 0 : "1.2em",
          background: "linear-gradient(180deg, rgba(20,18,24,.96), rgba(10,10,14,.97))", border: compatto ? "none" : "1px solid rgba(255,255,255,.08)",
          boxShadow: "0 2em 6em rgba(0,0,0,.6)" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "1em" }}>
          <div>
            <p style={{ margin: 0, fontFamily: MONO, fontSize: ".72em", letterSpacing: ".3em", textTransform: "uppercase", color: accento }}>prima di partire</p>
            <h2 style={{ margin: ".25em 0 0", fontFamily: SERIF, fontWeight: 500, fontSize: "2.2em", color: "#f4ece0", letterSpacing: "-.01em" }}>Come si gioca</h2>
          </div>
          <button onClick={onChiudi} aria-label="Chiudi la guida"
            style={{ cursor: "pointer", flexShrink: 0, border: "1px solid rgba(255,255,255,.16)", background: "transparent", color: "#c9d2de", borderRadius: 999,
              fontFamily: MONO, fontSize: ".75em", letterSpacing: ".18em", textTransform: "uppercase", padding: ".7em 1.2em" }}>chiudi ✕</button>
        </div>
        <div style={{ marginTop: "1.8em", display: "grid", gridTemplateColumns: compatto ? "1fr" : "1fr 1fr 1fr", gap: "1.1em" }}>
          {SCHEDE.map((s) => (
            <section key={s.titolo} style={{ padding: "1.2em 1.2em 1.3em", borderRadius: ".8em", background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.06)" }}>
              <svg viewBox="0 0 24 24" width="1.7em" height="1.7em" fill="none" stroke={accento} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={s.segno} />
              </svg>
              <h3 style={{ margin: ".55em 0 0", fontFamily: DISPLAY, fontWeight: 600, fontSize: "1.05em", color: "#f1f3f7" }}>{s.titolo}</h3>
              <p style={{ margin: ".5em 0 0", fontFamily: SERIF, fontSize: ".92em", lineHeight: 1.55, color: "rgba(226,220,208,.78)" }}>{s.testo}</p>
              {s.esempi && (
                <div style={{ marginTop: ".8em", display: "flex", flexWrap: "wrap", gap: ".4em" }}>
                  {s.esempi.map((e) => (
                    <code key={e} style={{ fontFamily: MONO, fontSize: ".74em", color: accento, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: ".45em", padding: ".3em .6em" }}>{e}</code>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
        <p style={{ margin: "1.6em 0 0", fontFamily: SERIF, fontStyle: "italic", fontSize: ".95em", color: "rgba(226,220,208,.6)", textAlign: "center" }}>
          Non c'è fretta. Il tempo passa solo quando fai qualcosa.
        </p>
      </div>
    </div>
  );
}
