import { rank as rankOld, Searchable } from './src/lib/ui-icons/search';

const items = Array.from({ length: 10000 }, (_, i) => ({
  name: `icon-${i}`,
  title: `Icon ${i}`,
  extra: ['tag1', 'tag2'],
  weak: ['category']
}));

function pick(it: any): Searchable {
  return it;
}

function rankNew<T>(query: string, items: T[], pick: (t: T) => Searchable, limit: number): T[] {
  // ⚡ Bolt: Optimize chained `.map().filter().sort().slice().map()` into single pass
  const scored = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const s = scoreEntryNew(query, pick(it));
    if (s > 0) {
      scored.push({ it, s });
    }
  }
  scored.sort((a, b) => b.s - a.s);

  const end = Math.min(scored.length, limit);
  const result: T[] = [];
  for (let i = 0; i < end; i++) {
    result.push(scored[i].it);
  }
  return result;
}

import { scoreEntry } from './src/lib/ui-icons/search';
function scoreEntryNew(query: string, e: Searchable): number {
  return scoreEntry(query, e);
}

const N = 100;
console.time('Old rank');
for (let i = 0; i < N; i++) {
  rankOld('icon-123', items, pick, 10);
}
console.timeEnd('Old rank');

console.time('New rank');
for (let i = 0; i < N; i++) {
  rankNew('icon-123', items, pick, 10);
}
console.timeEnd('New rank');
