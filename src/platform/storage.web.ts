import { cleanStore, emptyStore, storeSchema, type Store } from '../core/model';
// Browser preview is deliberately memory-only. Private plans never enter localStorage.
let memory = emptyStore();
export async function readStore(): Promise<Store> { return cleanStore(memory, Date.now()); }
export async function writeStore(store: Store): Promise<Store> { memory = cleanStore(storeSchema.parse(store), Date.now()); return memory; }
export const storageDescription = 'Browser preview: memory only. Reloading closes your local session. Install a native development build for encrypted offline storage.';
