import { z } from 'zod';
import { cleanStore, emptyStore, outingSchema, storeSchema, type Outing, type Store } from './model';
export const vaultIdSchema = z.string().uuid();
export const vaultIndexSchema = z.object({
  version: z.literal(1),
  erasedIds: z.array(vaultIdSchema),
  entries: z.array(z.object({ id: vaultIdSchema, state: z.enum(['active', 'pending_write', 'pending_delete']) })),
  preferences: storeSchema.shape.preferences,
}).refine(index => new Set(index.entries.map(e => e.id)).size === index.entries.length, 'Duplicate vault IDs');
export type VaultIndex = z.infer<typeof vaultIndexSchema>;
export interface VaultDriver {
  readIndex(): Promise<VaultIndex | undefined>;
  writeIndex(index: VaultIndex): Promise<void>;
  readOuting(id: string): Promise<Outing>;
  writeOuting(outing: Outing): Promise<void>;
  eraseOuting(id: string): Promise<void>;
}
// Persist deletion intent before removing a key. Recovery never reactivates a tombstone.
export class VaultStore {
  constructor(private driver: VaultDriver) {}
  private async index(): Promise<VaultIndex> {
    return vaultIndexSchema.parse(await this.driver.readIndex() ?? { version: 1, entries: [], erasedIds: [], preferences: emptyStore().preferences });
  }
  private async recover(index: VaultIndex): Promise<VaultIndex> {
    for (const entry of index.entries) if (entry.state !== 'active') await this.driver.eraseOuting(entry.id);
    const erasedIds = [...new Set([...index.erasedIds, ...index.entries.filter(e => e.state !== 'active').map(e => e.id)])];
    const clean = { ...index, erasedIds, entries: index.entries.filter(e => e.state === 'active') };
    if (clean.entries.length !== index.entries.length) await this.driver.writeIndex(clean);
    return clean;
  }
  async load(now: number): Promise<Store> {
    const index = await this.recover(await this.index());
    const outings: Outing[] = [];
    for (const entry of index.entries) {
      const outing = outingSchema.parse(await this.driver.readOuting(entry.id));
      if (outing.id !== entry.id) throw new Error('Private storage identity mismatch.');
      outings.push(outing);
    }
    const store = cleanStore({ version: 1, outings, preferences: index.preferences }, now);
    return this.save(store, now);
  }
  async save(value: Store, now: number): Promise<Store> {
    const old = await this.recover(await this.index());
    const sanitized = storeSchema.parse(value);
    const store = cleanStore({ ...sanitized, outings: sanitized.outings.filter(o => !old.erasedIds.includes(o.id)) }, now);
    const ids = new Set(store.outings.map(o => vaultIdSchema.parse(o.id)));
    if (ids.size !== store.outings.length) throw new Error('Duplicate outing IDs.');
    const currentIds = new Set(old.entries.map(e => e.id));
    const removed = old.entries.filter(e => !ids.has(e.id)).map(e => e.id);
    const erasedIds = [...new Set([...old.erasedIds, ...removed])];
    const staged: VaultIndex = { ...old, erasedIds, entries: [
      ...old.entries.map(e => ids.has(e.id) ? e : { ...e, state: 'pending_delete' as const }),
      ...store.outings.filter(o => !currentIds.has(o.id)).map(o => ({ id: o.id, state: 'pending_write' as const })),
    ] };
    await this.driver.writeIndex(staged);
    for (const entry of staged.entries) if (entry.state === 'pending_delete') await this.driver.eraseOuting(entry.id);
    for (const outing of store.outings) await this.driver.writeOuting(outing);
    await this.driver.writeIndex({ version: 1, erasedIds, entries: store.outings.map(o => ({ id: o.id, state: 'active' })), preferences: store.preferences });
    return store;
  }
}
