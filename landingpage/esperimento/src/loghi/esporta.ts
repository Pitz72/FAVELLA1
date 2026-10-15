// ====================================================================
//  Solo in sviluppo: l'audio dei loghi reso in un file, per esportarne i
//  video (le immagini si fotografano a ?loghi=… spostando window.__loghiT).
//  window.__rendiSuonoLoghi("runtime" | "favella", inizio, durata) rende la
//  partitura di quel logo con un OfflineAudioContext, da `inizio` secondi
//  (tempo del logo) per `durata` secondi, e restituisce un WAV stereo a
//  48 kHz in virgola mobile a 32 bit, codificato base64.
// ====================================================================
import { scriviPartitura } from "./suono";

function wavFloat(buf: AudioBuffer): Uint8Array {
  const canali = buf.numberOfChannels, n = buf.length, sr = buf.sampleRate;
  const dati = n * canali * 4, out = new DataView(new ArrayBuffer(44 + dati));
  const scrivi = (o: number, s: string) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  scrivi(0, "RIFF"); out.setUint32(4, 36 + dati, true); scrivi(8, "WAVE");
  scrivi(12, "fmt "); out.setUint32(16, 16, true); out.setUint16(20, 3, true); out.setUint16(22, canali, true);
  out.setUint32(24, sr, true); out.setUint32(28, sr * canali * 4, true); out.setUint16(32, canali * 4, true); out.setUint16(34, 32, true);
  scrivi(36, "data"); out.setUint32(40, dati, true);
  const ch = Array.from({ length: canali }, (_, c) => buf.getChannelData(c));
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < canali; c++) { out.setFloat32(o, ch[c][i], true); o += 4; }
  return new Uint8Array(out.buffer);
}

function base64(byte: Uint8Array) {
  let s = "";
  for (let i = 0; i < byte.length; i += 0x8000) s += String.fromCharCode(...byte.subarray(i, i + 0x8000));
  return btoa(s);
}

export function installa() {
  (window as unknown as Record<string, unknown>).__rendiSuonoLoghi = async (parte: "runtime" | "favella", inizio: number, durata: number) => {
    const sr = 48000;
    const ac = new OfflineAudioContext(2, Math.ceil(sr * durata), sr);
    scriviPartitura(ac, ac.destination, parte === "runtime" ? { runtime: -inizio } : { favella: -inizio });
    const buf = await ac.startRendering();
    let picco = 0;
    for (let c = 0; c < buf.numberOfChannels; c++) for (const v of buf.getChannelData(c)) picco = Math.max(picco, Math.abs(v));
    return { wav: base64(wavFloat(buf)), picco };
  };
}
