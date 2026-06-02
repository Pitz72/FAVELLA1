// Logica di preposizione concordata per le frasi di posizione/spostamento.
// Estratta da ObjectsEditor (6a.4/6c) per essere condivisa con RuleForm (6c.3,
// conseguenza di spostamento `move`). Il sidecar Python è la verità unica per la
// serializzazione; qui calcoliamo solo prep+place (come fa già l'op 'position').
import type { ObjectKind } from '../../../shared/protocol'

/** Toglie l'articolo iniziale dal nome (per «è in <stanza>» senza doppio articolo). */
export function nucleo(nome: string): string {
  return nome.replace(/^\s*(l'|un'|uno\s+|una\s+|gli\s+|il\s+|lo\s+|la\s+|le\s+|un\s+|i\s+)/i, '').trim()
}

/** Articolo iniziale del nome (normalizzato), o null se assente. */
export function articoloDi(nome: string): string | null {
  const m = nome.match(/^\s*(l'|un'|uno|una|gli|il|lo|la|le|un|i)\b/i)
  if (!m) return null
  return m[1].toLowerCase()
}

// Articolo → preposizione articolata «in»/«su». Il serializzatore (prep articolata)
// assorbe già l'articolo del luogo → «nella scatola», «sul tavolo».
const PREP_IN: Record<string, string> = {
  "l'": "nell'", "un'": "nell'", il: 'nel', lo: 'nello', uno: 'nello',
  la: 'nella', una: 'nella', le: 'nelle', i: 'nei', gli: 'negli', un: 'nel'
}
const PREP_SU: Record<string, string> = {
  "l'": "sull'", "un'": "sull'", il: 'sul', lo: 'sullo', uno: 'sullo',
  la: 'sulla', una: 'sulla', le: 'sulle', i: 'sui', gli: 'sugli', un: 'sul'
}

export type PosTarget = { name: string; kind: 'stanza' | ObjectKind }

/** prep+place concordati verso un bersaglio (stanza, contenitore o supporto):
 * «in <stanza>», «nella scatola» (contenitore), «sul tavolo» (supporto).
 * Fallback a prep nuda + nucleo se l'articolo non è riconosciuto. */
export function prepPlace(target: PosTarget): { prep: string; place: string } {
  if (target.kind === 'stanza') {
    return { prep: 'in', place: nucleo(target.name) }
  }
  const base = target.kind === 'supporto' ? PREP_SU : PREP_IN
  const art = articoloDi(target.name)
  if (art && base[art]) {
    // place = nome completo: la prep articolata gli toglie l'articolo lato sidecar.
    return { prep: base[art], place: target.name }
  }
  const nuda = target.kind === 'supporto' ? 'su' : 'in'
  return { prep: nuda, place: nucleo(target.name) }
}

/** Spec della frase di posizione di `objName` verso un bersaglio. */
export function specPosizione(
  objName: string,
  target: PosTarget
): { op: 'position'; name: string; prep: string; place: string } {
  return { op: 'position', name: objName, ...prepPlace(target) }
}
