import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const patterns = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,})\b/],
  ['OpenAI-style key', /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b/],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['credential-bearing URL', /https?:\/\/[^\s/:]+:[^\s/@]+@/],
];
const issues = [];
for (const file of files) {
  if (/(^|\/)\.env($|\.)/.test(file) && !file.endsWith('.env.example')) issues.push(`${file}: environment file tracked`);
  if (/\.(png|jpg|jpeg|webp|ico|woff2?)$/.test(file)) continue;
  const content = readFileSync(file, 'utf8');
  for (const [label, regex] of patterns) {
    if (regex.test(content)) issues.push(`${file}: potential ${label}`);
  }
}
console.log(issues.length ? issues.join('\n') : `PASS: ${files.length} tracked files; no matches for common token/private-key patterns.`);
console.log('Pattern scan is a supplement to manual diff review, not a guarantee. Matched values are never printed.');
process.exitCode = issues.length ? 1 : 0;
