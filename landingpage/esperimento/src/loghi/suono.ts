// ====================================================================
//  Il suono dei loghi d'apertura: Web Audio, tutto sintetizzato.
// --------------------------------------------------------------------
//  Ogni suono è scritto sugli istanti delle due regie (REGIA_RUNTIME,
//  REGIA_FAVELLA) e si programma TUTTO all'inizio sul clock dell'audio:
//  immagini e suono partono insieme e non si separano più.
//   · Runtime: il televisore che si accende (tonfo, scarica, ronzio del
//     tubo), lo schermo che si apre, la testina che scorre e scrive a bip,
//     il triangolo che si chiude con una zip e colpisce (cassa e accordo),
//     i pixel come scintille verso destra, il riflesso, lo spegnimento.
//   · FAVELLA: la scintilla della gemma, il tonfo del libro che si apre, le
//     pagine che frusciano su un arpeggio d'arpa, le graffe che si scrivono,
//     la scritta che arriva su un soffio grave, il motto a tasti, un rintocco;
//     sotto, un accordo caldo che si apre con la luce e sfuma col logo.
//  La stessa partitura si suona dal vivo (AudioContext) o si rende in un
//  file (OfflineAudioContext: così si esportano i video dei loghi).
//  Sul desktop parte da sola (Electron permette l'autoplay); nel browser
//  solo se la pagina ha già avuto un gesto: altrimenti i loghi restano muti.
// ====================================================================
import { REGIA_RUNTIME as R, PASSA_RUNTIME, PASSA_MULTIMEDIA, ORDINE_PIXEL, DURATA_RUNTIME } from "./LogoRuntime";
import { REGIA_FAVELLA as F, BATTUTE, MOTTO } from "./LogoFavella";
import { RUNTIME_RIQUADRI, MULTIMEDIA_RIQUADRI, PIXEL } from "./forme";
import { inDesktop } from "../lib/desktop";

const LIVELLO = 0.8;            // volume generale (la colonna del trailer resta più forte)
const ZERO = 0.0001;

interface Banco { ac: BaseAudioContext; master: GainNode; secco: GainNode; riv: GainNode; rumore: AudioBuffer }

/** Una risposta all'impulso sintetica: rumore stereo che si spegne (una stanza ampia, morbida). */
function impulso(ac: BaseAudioContext, durata = 2.6, decadimento = 0.48) {
  const n = Math.floor(ac.sampleRate * durata), buf = ac.createBuffer(2, n, ac.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let basso = 0;
    for (let i = 0; i < n; i++) {
      const t = i / ac.sampleRate;
      basso += (Math.random() * 2 - 1 - basso) * 0.35;           // un po' più scura in alto
      d[i] = basso * Math.exp(-t / decadimento) * (t < 0.012 ? t / 0.012 : 1);
    }
  }
  return buf;
}

function banco(ac: BaseAudioContext, uscita: AudioNode): Banco {
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 3.2; comp.attack.value = 0.004; comp.release.value = 0.25;
  // e in fondo un limitatore: nessun picco oltre −1 dB, nemmeno sul colpo del «play»
  const limite = ac.createDynamicsCompressor();
  limite.threshold.value = -4; limite.knee.value = 0; limite.ratio.value = 20; limite.attack.value = 0.001; limite.release.value = 0.12;
  const master = ac.createGain(); master.gain.value = LIVELLO;
  master.connect(comp).connect(limite).connect(uscita);
  const conv = ac.createConvolver(); conv.buffer = impulso(ac);
  const ritorno = ac.createGain(); ritorno.gain.value = 0.5;
  conv.connect(ritorno).connect(master);
  const riv = ac.createGain(); riv.connect(conv);
  const secco = ac.createGain(); secco.connect(master);
  const n = ac.sampleRate * 2, rumore = ac.createBuffer(1, n, ac.sampleRate), d = rumore.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return { ac, master, secco, riv, rumore };
}

/** L'uscita di una voce: posizione nello stereo e quanto va nel riverbero. */
function voce(b: Banco, pan = 0, mandata = 0.15): AudioNode {
  const g = b.ac.createGain();
  const p = b.ac.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan));
  g.connect(p); p.connect(b.secco);
  if (mandata > 0) { const m = b.ac.createGain(); m.gain.value = mandata; p.connect(m).connect(b.riv); }
  return g;
}

function inviluppo(g: AudioParam, t: number, picco: number, attacco: number, durata: number) {
  g.setValueAtTime(ZERO, t);
  g.exponentialRampToValueAtTime(Math.max(picco, ZERO * 2), t + attacco);
  g.exponentialRampToValueAtTime(ZERO, t + Math.max(durata, attacco + 0.01));
}

interface OpzTono { f: number; f1?: number; dur: number; g: number; tipo?: OscillatorType; att?: number; pan?: number; riv?: number; lp?: number; lp1?: number; det?: number }
function tono(b: Banco, t: number, o: OpzTono) {
  const ac = b.ac, osc = ac.createOscillator();
  osc.type = o.tipo ?? "sine";
  osc.frequency.setValueAtTime(o.f, t);
  if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);
  if (o.det) osc.detune.value = o.det;
  const g = ac.createGain(); inviluppo(g.gain, t, o.g, o.att ?? 0.005, o.dur);
  let nodo: AudioNode = osc;
  if (o.lp) {
    const fl = ac.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.setValueAtTime(o.lp, t);
    if (o.lp1) fl.frequency.exponentialRampToValueAtTime(o.lp1, t + o.dur);
    osc.connect(fl); nodo = fl;
  }
  nodo.connect(g).connect(voce(b, o.pan, o.riv));
  osc.start(t); osc.stop(t + o.dur + 0.05);
}

interface OpzRumore { dur: number; g: number; tipo?: BiquadFilterType; f: number; f1?: number; q?: number; att?: number; pan?: number; riv?: number }
function rumore(b: Banco, t: number, o: OpzRumore) {
  const ac = b.ac, s = ac.createBufferSource();
  s.buffer = b.rumore;
  const fl = ac.createBiquadFilter(); fl.type = o.tipo ?? "bandpass"; fl.Q.value = o.q ?? 1;
  fl.frequency.setValueAtTime(o.f, t);
  if (o.f1) fl.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);
  const g = ac.createGain(); inviluppo(g.gain, t, o.g, o.att ?? Math.min(0.01, o.dur / 4), o.dur);
  s.connect(fl).connect(g).connect(voce(b, o.pan, o.riv));
  s.start(t, Math.random() * 1.2, o.dur + 0.05);
}

/** Una campana: parziali inarmoniche che si spengono prima le alte. */
function campana(b: Banco, t: number, f: number, g: number, dur = 1.4, pan = 0, riv = 0.5) {
  [[1, 1, 1], [2.76, 0.42, 0.6], [5.4, 0.22, 0.35], [8.93, 0.1, 0.2]].forEach(([r, a, d]) =>
    tono(b, t, { f: f * r, dur: dur * d, g: g * a, att: 0.002, pan, riv }));
}

/** Una corda pizzicata (arpa): triangolo con un filtro che si chiude in fretta. */
function pizzico(b: Banco, t: number, f: number, g: number, dur = 1.6, pan = 0, riv = 0.45) {
  tono(b, t, { f, dur, g, tipo: "triangle", att: 0.003, lp: f * 9, lp1: f * 1.6, pan, riv });
  tono(b, t, { f: f * 2, dur: dur * 0.4, g: g * 0.22, att: 0.002, pan, riv });
}

/** Un tonfo grave (cassa): seno che scende, con un piccolo clic in testa. */
function colpo(b: Banco, t: number, g: number, f0 = 120, f1 = 42, dur = 0.42, riv = 0.12) {
  tono(b, t, { f: f0, f1, dur, g, att: 0.002, riv });
  rumore(b, t, { dur: 0.018, g: g * 0.22, tipo: "highpass", f: 2600, riv: 0.05 });
}

/** Un tasto: clic di plastica e un piccolo «toc» di legno; la barra spaziatrice è più sorda. */
function tasto(b: Banco, t: number, g: number, pan = 0, spazio = false) {
  rumore(b, t, { dur: spazio ? 0.03 : 0.016, g, tipo: "bandpass", f: spazio ? 1300 : 2900 + Math.random() * 900, q: 2.2, pan, riv: 0.08 });
  tono(b, t, { f: spazio ? 140 : 190 + Math.random() * 30, dur: 0.035, g: g * 0.5, att: 0.001, pan, riv: 0.05 });
}

/** Il fruscio di una pagina: tre sfioramenti in fila. */
function fruscio(b: Banco, t: number, g: number, pan = 0) {
  [0, 0.03, 0.065].forEach((d, i) =>
    rumore(b, t + d, { dur: 0.05, g: g * [1, 0.7, 0.45][i], tipo: "bandpass", f: 2400 + Math.random() * 900, q: 0.8, pan, riv: 0.25 }));
}

/** Un accordo sostenuto: per ogni nota due seghe appena stonate, dentro un passa-basso;
 *  le note si dividono fra sinistra e destra per dare larghezza. */
function accordo(b: Banco, t0: number, t1: number, o: { note: number[]; g: number; att: number; ril: number; lp: number; lp1?: number; tlp?: number; stacco?: boolean; riv?: number; onda?: OscillatorType }) {
  const ac = b.ac;
  const lati = [-0.35, 0.35].map((pan) => {
    const fl = ac.createBiquadFilter(); fl.type = "lowpass"; fl.Q.value = 0.6;
    fl.frequency.setValueAtTime(o.lp, t0);
    if (o.lp1) fl.frequency.exponentialRampToValueAtTime(o.lp1, t0 + (o.tlp ?? 1));
    const g = ac.createGain();
    g.gain.setValueAtTime(ZERO, t0);
    if (o.stacco) {                     // attacco secco e caduta: un colpo d'accordo che resta sotto
      g.gain.exponentialRampToValueAtTime(o.g, t0 + o.att);
      g.gain.exponentialRampToValueAtTime(o.g * 0.22, t0 + o.att + 0.7);
      g.gain.setValueAtTime(o.g * 0.22, t1 - o.ril);
    } else {
      g.gain.linearRampToValueAtTime(o.g, t0 + o.att);
      g.gain.setValueAtTime(o.g, t1 - o.ril);
    }
    g.gain.exponentialRampToValueAtTime(ZERO, t1);
    fl.connect(g).connect(voce(b, pan, o.riv ?? 0.35));
    return fl;
  });
  o.note.forEach((f, i) => {
    const gn = ac.createGain(); gn.gain.value = 2 / o.note.length;
    [-6, 6].forEach((det) => {
      const osc = ac.createOscillator(); osc.type = o.onda ?? "sawtooth"; osc.frequency.value = f; osc.detune.value = det;
      osc.connect(gn); osc.start(t0); osc.stop(t1 + 0.05);
    });
    gn.connect(lati[i % 2]);
  });
}

/** Il ronzio del tubo catodico: rete a 50 Hz con le armoniche e un fruscio sottile. */
function ronzio(b: Banco, t0: number, t1: number, g: number) {
  const ac = b.ac, gg = ac.createGain();
  gg.gain.setValueAtTime(ZERO, t0);
  gg.gain.exponentialRampToValueAtTime(g, t0 + 0.4);
  gg.gain.setValueAtTime(g, t1 - 0.12);
  gg.gain.exponentialRampToValueAtTime(ZERO, t1);
  gg.connect(voce(b, 0, 0.05));
  [[50, 0.35], [100, 0.6], [150, 0.45], [250, 0.2]].forEach(([f, a]) => {
    const o = ac.createOscillator(); o.frequency.value = f;
    const ga = ac.createGain(); ga.gain.value = a;
    o.connect(ga).connect(gg); o.start(t0); o.stop(t1 + 0.05);
  });
  const s = ac.createBufferSource(); s.buffer = b.rumore; s.loop = true;
  const hp = ac.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 6500;
  const gs = ac.createGain(); gs.gain.value = 0.35;
  s.connect(hp).connect(gs).connect(gg); s.start(t0); s.stop(t1 + 0.05);
}

const panX = (x: number, centro: number, mezzo: number, ampiezza = 0.6) => ((x - centro) / mezzo) * ampiezza;

// ── RUNTIME MULTIMEDIA ────────────────────────────────────────────────
function partituraRuntime(b: Banco, s: number) {
  const at = (x: number) => s + x;
  // il televisore si accende: tonfo, scarica, e il tubo che ronza fino allo spegnimento
  colpo(b, at(R.rigaDa), 0.42, 95, 38, 0.36);
  rumore(b, at(R.rigaDa), { dur: 0.16, g: 0.16, tipo: "highpass", f: 1800, f1: 7000, riv: 0.2 });
  tono(b, at(R.rigaDa + 0.02), { f: 7800, f1: 9400, dur: 0.32, g: 0.012, att: 0.02, riv: 0.1 });
  ronzio(b, at(R.rigaDa + 0.05), at(R.spentaA), 0.018);
  // lo schermo si apre: un soffio che sale
  rumore(b, at(R.rigaA - 0.04), { dur: 0.42, g: 0.3, tipo: "bandpass", f: 380, f1: 3600, q: 1.1, att: 0.12, riv: 0.3 });
  // la testina compare e scorre: un tono che sale piano, appena sotto le lettere
  tono(b, at(R.testina), { f: 880, f1: 1320, dur: 0.09, g: 0.08, att: 0.003, pan: -0.55, riv: 0.2 });
  const corsa = R.corsaA - R.corsaDa;
  tono(b, at(R.corsaDa), { f: 196, f1: 587, dur: corsa + 0.1, g: 0.05, tipo: "triangle", att: 0.15, lp: 900, lp1: 2600, pan: 0, riv: 0.25 });
  rumore(b, at(R.corsaDa), { dur: corsa, g: 0.035, tipo: "bandpass", f: 2000, f1: 6000, q: 3, att: 0.2, riv: 0.2 });
  // RUNTIME: un bip per lettera, su una scala che sale (Re maggiore pentatonica)
  const scala = [587.3, 659.3, 740, 880, 987.8, 1174.7, 1318.5];
  PASSA_RUNTIME.forEach((tp, i) => {
    const [x0, x1] = RUNTIME_RIQUADRI[i];
    tono(b, at(tp + 0.02), { f: scala[i], f1: scala[i] * 0.985, dur: 0.12, g: 0.13, tipo: "triangle", att: 0.002, lp: 5000, pan: panX((x0 + x1) / 2, 478, 420), riv: 0.25 });
  });
  // MULTIMEDIA: ticchettii più fini, dati che si scrivono
  PASSA_MULTIMEDIA.forEach((tp, i) => {
    const [x0, x1] = MULTIMEDIA_RIQUADRI[i];
    rumore(b, at(tp + 0.03), { dur: 0.024, g: 0.085, tipo: "highpass", f: 4200 + i * 120, pan: panX((x0 + x1) / 2, 478, 420), riv: 0.12 });
  });
  // il triangolo si chiude: una zip che sale
  const dis = R.disegnoA - R.disegnoDa;
  tono(b, at(R.disegnoDa), { f: 170, f1: 760, dur: dis, g: 0.055, tipo: "sawtooth", att: 0.04, lp: 700, lp1: 3800, pan: 0.35, riv: 0.2 });
  rumore(b, at(R.disegnoDa), { dur: dis, g: 0.05, tipo: "bandpass", f: 900, f1: 5200, q: 2, att: 0.05, pan: 0.35, riv: 0.2 });
  // … e colpisce: cassa, accordo che si apre e resta sotto fino allo spegnimento
  const colpoT = R.pienoDa + 0.06;
  colpo(b, at(colpoT), 0.95, 130, 40, 0.55, 0.15);
  accordo(b, at(colpoT), at(R.spegneDa + 0.06), { note: [146.8, 220, 293.7, 370, 440, 659.3], g: 0.22, att: 0.006, ril: 0.25, lp: 5200, lp1: 1100, tlp: 0.7, stacco: true, riv: 0.5 });
  campana(b, at(colpoT + 0.01), 1318.5, 0.05, 1.6, 0.3, 0.6);
  // il triangolo interno: un «pop»
  tono(b, at(R.internoDa + 0.04), { f: 523.3, f1: 880, dur: 0.12, g: 0.06, att: 0.003, pan: 0.3, riv: 0.3 });
  // i pixel: scintille che volano a destra
  const alte = [1174.7, 1318.5, 1480, 1760, 1975.5, 2349.3, 2637, 2960];
  ORDINE_PIXEL.forEach((i, n) => {
    const p = PIXEL[i];
    campana(b, at(R.pixelDa + n * R.pixelPasso + 0.03), alte[n], 0.06, 0.7, 0.25 + (p.x - 78) / 112 * 0.6, 0.55);
  });
  // il riflesso: un velo luminoso
  const rif = R.riflessoA - R.riflessoDa;
  rumore(b, at(R.riflessoDa), { dur: rif, g: 0.05, tipo: "bandpass", f: 2600, f1: 9500, q: 2.5, att: rif * 0.4, pan: -0.2, riv: 0.6 });
  tono(b, at(R.riflessoDa + 0.1), { f: 2637, f1: 3951, dur: 0.5, g: 0.012, att: 0.15, pan: 0.2, riv: 0.7 });
  // lo spegnimento: tutto scende in un attimo, la riga, il punto
  tono(b, at(R.spegneDa), { f: 1400, f1: 70, dur: 0.3, g: 0.11, att: 0.004, riv: 0.25 });
  rumore(b, at(R.spegneDa), { dur: 0.26, g: 0.09, tipo: "lowpass", f: 4200, f1: 220, riv: 0.2 });
  colpo(b, at(R.spentaA), 0.26, 80, 36, 0.24, 0.1);
  tono(b, at(R.spentaA + 0.02), { f: 5200, f1: 2400, dur: 0.22, g: 0.016, att: 0.004, riv: 0.4 });
}

// ── FAVELLA 1 ─────────────────────────────────────────────────────────
function partituraFavella(b: Banco, s: number) {
  const at = (x: number) => s + x;
  const fine = at(F.esceA + 0.15);
  // la scintilla della gemma
  campana(b, at(F.scintillaDa), 2349.3, 0.09, 1.5, -0.25, 0.6);
  campana(b, at(F.scintillaDa + 0.05), 3520, 0.03, 1.0, -0.25, 0.7);
  rumore(b, at(F.scintillaDa - 0.06), { dur: 0.34, g: 0.03, tipo: "highpass", f: 5200, att: 0.2, pan: -0.25, riv: 0.5 });
  // l'accordo caldo: entra con la gemma, si apre con la luce delle pagine, sfuma col logo
  accordo(b, at(F.scintillaDa + 0.1), fine, { note: [110, 146.8, 185, 220, 329.6, 440], g: 0.09, att: 1.3, ril: 0.75, lp: 480, lp1: 1700, tlp: 2.4, riv: 0.5, onda: "triangle" });
  tono(b, at(F.scintillaDa + 0.2), { f: 73.4, dur: F.esceA - F.scintillaDa, g: 0.04, att: 1.2, riv: 0.1 });
  tono(b, at(F.scintillaDa + 0.08), { f: 293.7, dur: 1.8, g: 0.04, att: 0.35, pan: -0.25, riv: 0.5 });
  // il libro si apre: tonfo morbido e soffio di carta
  colpo(b, at(F.libroDa), 0.42, 110, 48, 0.4, 0.2);
  rumore(b, at(F.libroDa), { dur: 0.5, g: 0.2, tipo: "lowpass", f: 1100, f1: 260, att: 0.03, riv: 0.3 });
  // le pagine: fruscii a destra e a sinistra, sopra un arpeggio d'arpa che sale
  for (let i = 2; i >= 0; i--) {
    const t0 = F.foglieDa + (2 - i) * F.fogliePasso;
    fruscio(b, at(t0 + 0.02), 0.11, -0.55);
    fruscio(b, at(t0 + 0.035), 0.11, 0.55);
  }
  [293.7, 370, 440, 587.3, 659.3, 880, 1108.7].forEach((f, n) =>
    pizzico(b, at(F.foglieDa + 0.02 + n * 0.075), f, 0.12, 1.7, n % 2 ? 0.45 : -0.45, 0.5));
  // le graffe si scrivono, una a sinistra e una a destra, e si posano con un rintocco
  const gr = F.graffeA - F.graffeDa;
  [-0.75, 0.75].forEach((pan) => {
    tono(b, at(F.graffeDa), { f: 1180, f1: 1760, dur: gr, g: 0.024, att: 0.2, pan, riv: 0.4 });
    rumore(b, at(F.graffeDa), { dur: gr, g: 0.028, tipo: "bandpass", f: 5200, f1: 8200, q: 4, att: 0.25, pan, riv: 0.3 });
  });
  campana(b, at(F.graffePiene), 587.3, 0.06, 1.5, -0.6, 0.55);
  campana(b, at(F.graffePiene + 0.03), 880, 0.05, 1.5, 0.6, 0.55);
  // FAVELLA1: un soffio per lettera, poi un fondo grave che si apre
  for (let i = 0; i < 8; i++) {
    const t0 = F.scrittaDa + i * F.scrittaPasso;
    rumore(b, at(t0), { dur: 0.16, g: 0.055, tipo: "bandpass", f: 1500, f1: 650, q: 1.4, att: 0.05, pan: 0.15 + i * 0.07, riv: 0.25 });
  }
  const pieno = F.scrittaDa + 7 * F.scrittaPasso + 0.15;
  tono(b, at(pieno), { f: 73.4, dur: 1.6, g: 0.18, att: 0.06, riv: 0.3 });
  campana(b, at(pieno), 1174.7, 0.06, 1.8, 0.35, 0.6);
  // il motto, battuto a tasti morbidi (gli stessi istanti dei caratteri sullo schermo)
  const km = F.mottoA - F.mottoDa;
  [...MOTTO].forEach((c, j) => {
    const t = F.mottoDa + BATTUTE[j] * km;
    tasto(b, at(t), 0.05, 0.05 + (j / MOTTO.length) * 0.6, c === " ");
  });
  campana(b, at(F.mottoA + 0.05), 1318.5, 0.055, 1.6, 0.55, 0.6);
  campana(b, at(F.mottoA + 0.09), 1760, 0.03, 1.2, 0.55, 0.65);
  // il riflesso sulla scritta
  const rif = F.riflessoA - F.riflessoDa;
  rumore(b, at(F.riflessoDa), { dur: rif, g: 0.04, tipo: "bandpass", f: 3000, f1: 9000, q: 2.5, att: rif * 0.4, pan: 0.4, riv: 0.6 });
}

export interface Parti { runtime?: number | null; favella?: number | null }

/** Scrive la partitura su un contesto (dal vivo o offline). Gli istanti sono sul clock del contesto. */
export function scriviPartitura(ac: BaseAudioContext, uscita: AudioNode, parti: Parti) {
  const b = banco(ac, uscita);
  if (parti.runtime != null) partituraRuntime(b, parti.runtime);
  if (parti.favella != null) partituraFavella(b, parti.favella);
  return b;
}

/** Il suono dal vivo dei loghi. `avvia` restituisce null se qui l'audio non può partire da solo. */
export class SuonoLoghi {
  private constructor(private ac: AudioContext, private b: Banco, readonly anticipo: number) {}

  static avvia(): SuonoLoghi | null {
    const sbloccato = !!(navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive;
    if (!inDesktop() && !sbloccato) return null;
    try {
      const ac = new AudioContext({ latencyHint: "interactive" });
      if (ac.state !== "running") ac.resume().catch(() => {});
      const anticipo = 0.12;                                   // il tempo di programmare tutto
      const t0 = ac.currentTime + anticipo;
      const b = scriviPartitura(ac, ac.destination, { runtime: t0, favella: t0 + DURATA_RUNTIME });
      const ritardo = (ac.outputLatency || ac.baseLatency || 0);
      return new SuonoLoghi(ac, b, anticipo + ritardo);
    } catch {
      return null;
    }
  }

  /** Sfuma e chiude (fine dei loghi, o Esc). */
  sfuma(secondi = 0.35) {
    const { ac, b } = this;
    if (ac.state === "closed") return;
    const ora = ac.currentTime;
    b.master.gain.cancelScheduledValues(ora);
    b.master.gain.setValueAtTime(b.master.gain.value, ora);
    b.master.gain.linearRampToValueAtTime(0, ora + secondi);
    setTimeout(() => { ac.close().catch(() => {}); }, (secondi + 0.1) * 1000);
  }
}
