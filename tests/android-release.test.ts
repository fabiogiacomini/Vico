import { createRequire } from 'node:module';
import { expect, it } from 'vitest';
const require = createRequire(import.meta.url);
const { unsignedRelease } = require('../plugins/withAndroidRelease.cjs');
it('removes the default debug signer only from release and keeps local debug builds usable', () => {
 const input = 'signingConfigs { debug { } }\nbuildTypes { debug { signingConfig signingConfigs.debug } release { signingConfig signingConfigs.debug } }';
 const out = unsignedRelease(input);
 expect(out).toContain('debug { signingConfig signingConfigs.debug }');
 expect(out).toContain('release { signingConfig null // VICO_LOCAL_SIGNING');
 expect(unsignedRelease(out)).toBe(out);
});
it('fails closed when the release template changes', () => expect(() => unsignedRelease('buildTypes { release {} }')).toThrow());
