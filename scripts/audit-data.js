import { catalog } from '../src/data/catalog.js';
import { auditProduct, todayKST } from '../src/engine.js';
const day = process.argv.find(a => a.startsWith('--date='))?.slice(7) ?? todayKST();
let failures = 0;
for (const p of catalog) {
  const errors = auditProduct(p, day);
  console.log(`${errors.length ? 'REVIEW' : 'OK'} ${p.name}: ${errors.join('; ') || 'known facts have sources; dates within 90 days'}`);
  failures += errors.length;
}
console.log(`Audit date (KST): ${day}; ${catalog.length} products. HTTP and factual accuracy require human review.`);
process.exitCode = failures ? 1 : 0;
