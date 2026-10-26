import { describe, expect, it } from 'vitest';
import { emptyStore, RETENTION_MS, type Outing } from '../src/core/model';
import { VaultStore, type VaultDriver, type VaultIndex } from '../src/core/vault';
const A = '6e079da2-8cad-4df8-a5b8-70f2837ea94f', B = 'f40e2df4-89dd-47f2-9620-8bb701780f5b';
const now = 1000000;
const outing = (id: string): Outing => ({ id, title: 'Private walk', createdAt: now, endsAt: now + 3600000, reports: [] });
function memoryDriver() {
  let index: VaultIndex | undefined;
  const content = new Map<string, Outing>(), keys = new Set<string>(), events: string[] = [];
  const faults = { erase: false, index: false, content: false };
  const driver: VaultDriver = {
    async readIndex() { return index && structuredClone(index); },
    async writeIndex(value) { if (faults.index) throw new Error('index write failed'); index = structuredClone(value); events.push('index'); },
    async readOuting(id) { if (!keys.has(id) || !content.has(id)) throw new Error('Missing key'); return structuredClone(content.get(id)!); },
    async writeOuting(value) { if (faults.content) throw new Error('content write failed'); content.set(value.id, structuredClone(value)); keys.add(value.id); events.push(`write:${value.id}`); },
    async eraseOuting(id) { if (faults.erase) throw new Error('deletion interrupted'); keys.delete(id); content.delete(id); events.push(`erase:${id}`); },
  };
  return { driver, content, keys, events, faults, getIndex: () => index! };
}
describe('per-outing key deletion and crash recovery — A18', () => {
  it('deletes the selected key and content while preserving another outing', async () => { const m = memoryDriver(), vault = new VaultStore(m.driver); await vault.save({ ...emptyStore(), outings: [outing(A), outing(B)] }, now); m.events.length = 0; await vault.save({ ...emptyStore(), outings: [outing(B)] }, now); expect(m.events[0]).toBe('index'); expect(m.keys.has(A)).toBe(false); expect(m.content.has(A)).toBe(false); expect(m.keys.has(B)).toBe(true); expect((await vault.load(now)).outings.map(o => o.id)).toEqual([B]); });
  it('records deletion intent before key erasure and completes after restart', async () => { const m = memoryDriver(), vault = new VaultStore(m.driver); await vault.save({ ...emptyStore(), outings: [outing(A)] }, now); m.faults.erase = true; await expect(vault.save(emptyStore(), now)).rejects.toThrow(); expect(m.getIndex().entries[0].state).toBe('pending_delete'); m.faults.erase = false; expect((await new VaultStore(m.driver).load(now)).outings).toEqual([]); expect(m.keys.size).toBe(0); });
  it('does not resurrect erased content from a stale in-memory mutation', async () => { const m = memoryDriver(), vault = new VaultStore(m.driver), stale = { ...emptyStore(), outings: [outing(A)] }; await vault.save(stale, now); await vault.save(emptyStore(), now); await vault.save(stale, now); expect((await vault.load(now)).outings).toEqual([]); expect(m.keys.size).toBe(0); });
  it('performs no key erasure if deletion intent could not be persisted', async () => { const m = memoryDriver(), vault = new VaultStore(m.driver); await vault.save({ ...emptyStore(), outings: [outing(A)] }, now); m.faults.index = true; await expect(vault.save(emptyStore(), now)).rejects.toThrow(); expect(m.keys.has(A)).toBe(true); });
  it('cleans up interrupted new vault writes instead of recovering hidden content', async () => { const m = memoryDriver(), vault = new VaultStore(m.driver); m.faults.content = true; await expect(vault.save({ ...emptyStore(), outings: [outing(A)] }, now)).rejects.toThrow(); m.faults.content = false; expect((await new VaultStore(m.driver).load(now)).outings).toEqual([]); expect(m.getIndex().erasedIds).toContain(A); });
  it('erases expired outing keys when the app next loads', async () => { const m = memoryDriver(), vault = new VaultStore(m.driver), o = outing(A); await vault.save({ ...emptyStore(), outings: [o] }, now); expect((await vault.load(o.endsAt + RETENTION_MS)).outings).toEqual([]); expect(m.keys.size).toBe(0); });
  it('rejects unsafe IDs before generating a file name', async () => { const m = memoryDriver(), vault = new VaultStore(m.driver); await expect(vault.save({ ...emptyStore(), outings: [outing('../escape')] }, now)).rejects.toThrow(); expect(m.keys.size).toBe(0); });
  it('does not replace an active vault when its key has been lost', async () => { const m = memoryDriver(), vault = new VaultStore(m.driver); await vault.save({ ...emptyStore(), outings: [outing(A)] }, now); m.keys.delete(A); await expect(vault.load(now)).rejects.toThrow('Missing key'); expect(m.content.has(A)).toBe(true); });
});
