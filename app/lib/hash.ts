/**
 * Hash deterministico (FNV-1a a 32 bit) usato per selezionare ogni giorno
 * lo stesso film per tutti i giocatori del mondo.
 */
export function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Doppio hash (FNV-1a su due sali diversi) per migliorare la distribuzione
 * dell'indice anche con pool condivisi con multipli di 31.
 */
export function seededInt(seedKey: string, modulo: number): number {
  const a = fnv1a(seedKey + '::alpha');
  const b = fnv1a(seedKey + '::beta');
  const combined = (Math.imul(a, 31) + b) >>> 0;
  return combined % modulo;
}