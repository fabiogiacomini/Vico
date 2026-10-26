import { readFileSync } from 'node:fs';
import { registrySchema } from '../src/core/sources';
const registry = registrySchema.parse(JSON.parse(readFileSync(new URL('../registry/sources.json', import.meta.url), 'utf8')));
for (const source of registry.sources) {
  if (source.state === 'active' && !source.lastValidated) throw new Error(`Active source ${source.id} requires validation evidence.`);
}
console.log(`Registry revision ${registry.revision}: ${registry.sources.length} validated records; ${registry.sources.filter(s => s.state === 'active').length} active sources.`);
