import { rankTiered as rankTieredOld, Searchable } from './src/lib/ui-icons/search';

const items = Array.from({ length: 10000 }, (_, i) => ({
  name: `icon-${i}`,
  title: `Icon ${i}`,
  extra: ['tag1', 'tag2'],
  weak: ['category']
}));

function pick(it: any): Searchable {
  return it;
}

function rankTieredNew<T>(query: string, items: T[], pick: (t: T) => Searchable): { best: T[]; related: T[] } {
  // ⚡ Bolt: Optimize chained `.map().filter().sort()` into single pass
  const scored = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const s = scoreEntryNew(query, pick(it));
    if (s > 0) {
      scored.push({ it, s });
    }
  }
  scored.sort((a, b) => b.s - a.s);

  const top = scored[0]?.s ?? 0;
  const cut = Math.max(40, top * 0.5);

  const best: T[] = [];
  const related: T[] = [];
  for (let i = 0; i < scored.length; i++) {
    const r = scored[i];
    if (r.s >= cut) best.push(r.it);
    else related.push(r.it);
  }
  return { best, related };
}

// We need to copy scoreEntry and its dependencies to test standalone, or better just use the exported one
import { scoreEntry } from './src/lib/ui-icons/search';
function scoreEntryNew(query: string, e: Searchable): number {
  return scoreEntry(query, e);
}

const N = 100;
console.time('Old rankTiered');
for (let i = 0; i < N; i++) {
  rankTieredOld('icon-123', items, pick);
}
console.timeEnd('Old rankTiered');

console.time('New rankTiered');
for (let i = 0; i < N; i++) {
  rankTieredNew('icon-123', items, pick);
}
console.timeEnd('New rankTiered');
