import { catalog } from '../src/data/catalog.js';
const sources = [...new Map(catalog.flatMap(p => p.sources).map(s => [s.url, s])).values()];
let failures = 0;
for (let i = 0; i < sources.length; i += 3) {
  await Promise.all(sources.slice(i, i + 3).map(async s => {
    try {
      const response = await fetch(s.url, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'FirstPick-LinkCheck/0.1 (manual source maintenance)' } });
      console.log(`${response.status} ${s.title} ${response.url}`);
      await response.body?.cancel();
      if (!response.ok) failures++;
    } catch (error) {
      failures++; console.log(`UNVERIFIED ${s.title}: ${error.name}`);
    }
  }));
}
console.log('Reachability only. This does not verify page content, price, availability, or update checkedAt.');
process.exitCode = failures ? 1 : 0;
