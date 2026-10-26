import fs from 'node:fs';
import path from 'node:path';
const found = new Map();
function visit(dir) {
 if (!fs.existsSync(dir)) return;
 for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
  if (entry.name.startsWith('.')) continue;
  const location = path.join(dir, entry.name);
  if (entry.name.startsWith('@')) { visit(location); continue; }
  const file = path.join(location, 'package.json');
  if (!fs.existsSync(file)) continue;
  const p = JSON.parse(fs.readFileSync(file,'utf8'));
  found.set(`${p.name}@${p.version}`, {name:p.name, version:p.version, license:p.license ?? 'UNKNOWN', repository:typeof p.repository === 'string' ? p.repository : p.repository?.url ?? null});
  visit(path.join(location, 'node_modules'));
 }
}
visit('node_modules');
fs.writeFileSync('docs/dependency-inventory.json', JSON.stringify({generatedAt:'2026-10-26',scope:'Installed JavaScript package metadata; native transitive artifacts require separate review', packages:[...found.values()].sort((a,b)=>a.name.localeCompare(b.name)||a.version.localeCompare(b.version))},null,2)+'\n');
console.log(`Recorded ${found.size} installed packages.`);
