/**
 * Verifica che tutti i film del pool siano validi su TMDb.
 *
 * Uso:
 *   TMDB_API_KEY=... npm run verify:pool
 *
 * Stampa per ogni film: ID, titolo previsto nel pool e titolo reale su TMDb.
 * Evidenzia gli ID che non esistono (404) o che puntano a un film diverso,
 * così puoi correggere o rimuovere le voci errate.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const poolPath = join(here, '..', 'app', 'lib', 'moviePool.ts');
const src = readFileSync(poolPath, 'utf8');

const idRe = /id:\s*(\d+)/g;
const ids = [...new Set([...src.matchAll(idRe)].map((m) => Number(m[1])))];

const titleMap = new Map();
// estrae coppie { id: N, title: '...' } per associare id -> titolo previsto
const pairRe = /id:\s*(\d+),\s*title:\s*'([^']+)'/g;
for (const m of src.matchAll(pairRe)) {
  titleMap.set(Number(m[1]), m[2]);
}

const key = process.env.TMDB_API_KEY;
if (!key) {
  console.error('Imposta TMDB_API_KEY, es.:  TMDB_API_KEY=xxx npm run verify:pool');
  process.exit(1);
}

const BASE = 'https://api.themoviedb.org/3/movie/';
let ok = 0;
let bad = 0;

console.log(`Verifica di ${ids.length} film unici sul pool curato...\n`);

for (const id of ids) {
  const url = `${BASE}${id}?api_key=${key}&language=it-IT`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`✗ ${id}  (${res.status})  previsto: "${titleMap.get(id) ?? ''}"  -> NON ESISTE su TMDb`);
      bad++;
      continue;
    }
    const data = await res.json();
    const real = data.title || data.original_title || '(senza titolo)';
    const expected = titleMap.get(id) ?? '';
    const match = !expected || expected.toLowerCase() === real.toLowerCase();
    console.log(
      `${match ? '✓' : '? '} ${id}  ${real}${match ? '' : `  <>  previsto: "${expected}"`}`
    );
    match ? ok++ : bad++;
  } catch (err) {
    console.error(`✗ ${id} errore di rete: ${err.message}`);
    bad++;
  }
}

console.log(`\nRisultato: ${ok} ok, ${bad} da controllare`);
if (bad > 0) {
  console.log('Correggi o rimuovi le voci evidenziate dal pool prima di pubblicare.');
  process.exitCode = 1;
} else {
  console.log('Il pool è sano. Buon divertimento con CineClue! 🎬');
}