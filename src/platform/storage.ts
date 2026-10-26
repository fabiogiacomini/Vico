import { openDatabaseAsync, deleteDatabaseAsync, defaultDatabaseDirectory, type SQLiteDatabase } from 'expo-sqlite';
import { File } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { getRandomBytesAsync } from 'expo-crypto';
import { outingSchema, type Store } from '../core/model';
import { VaultStore, vaultIdSchema, vaultIndexSchema } from '../core/vault';
import { databaseFileUri } from './private-files';

class StorageFailure extends Error {
  constructor(readonly reference: string) { super(`Private storage could not be opened (${reference}). Your saved data has not been replaced.`); }
}
async function step<T>(reference: string, action: () => T | Promise<T>): Promise<T> {
  try { return await action(); } catch (error) { if (error instanceof StorageFailure) throw error; throw new StorageFailure(reference); }
}
const databaseFile = (name: string) => new File(databaseFileUri(defaultDatabaseDirectory, name));

async function openVault(name: string, create: boolean): Promise<SQLiteDatabase> {
  const keyName = `vico.key.${name}`;
  let key = await step('V01', () => SecureStore.getItemAsync(keyName));
  if (!key) {
    // A missing key must never silently create a replacement for existing private data.
    if (!create || await step('V02', () => databaseFile(name).exists)) throw new StorageFailure('V03');
    key = Array.from(await step('V04', () => getRandomBytesAsync(32)), n => n.toString(16).padStart(2, '0')).join('');
    const generatedKey = key;
    await step('V05', () => SecureStore.setItemAsync(keyName, generatedKey, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }));
  }
  if (!/^[a-f0-9]{64}$/.test(key)) throw new Error('Secure storage is unavailable.');
  const connection = await step('V06', () => openDatabaseAsync(`${name}.db`, { useNewConnection: true }));
  try {
    const cipher = await step('V07', () => connection.getFirstAsync<Record<string, string>>('PRAGMA cipher_version'));
    if (!cipher || !Object.values(cipher).some(Boolean)) throw new StorageFailure('V08');
    await step('V09', () => connection.execAsync(`PRAGMA key = "x'${key}'"; PRAGMA cipher_memory_security = ON; PRAGMA secure_delete = ON; PRAGMA journal_mode = DELETE;`));
    await step('V10', () => connection.execAsync('CREATE TABLE IF NOT EXISTS payload (id INTEGER PRIMARY KEY CHECK(id = 1), value TEXT NOT NULL)'));
    return connection;
  } catch (error) { await connection.closeAsync(); throw error; }
}
async function readPayload(name: string, create = false): Promise<unknown | undefined> {
  const db = await openVault(name, create);
  try { const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM payload WHERE id = 1'); return row ? JSON.parse(row.value) : undefined; }
  finally { await db.closeAsync(); }
}
async function writePayload(name: string, data: unknown) {
  const db = await openVault(name, true);
  try { await db.runAsync('INSERT INTO payload (id, value) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value', JSON.stringify(data)); }
  finally { await db.closeAsync(); }
}
const vaultName = (id: string) => `outing.${vaultIdSchema.parse(id)}`;
const vault = new VaultStore({
  async readIndex() { const raw = await readPayload('index.v1', true); return raw === undefined ? undefined : vaultIndexSchema.parse(raw); },
  async writeIndex(index) { await writePayload('index.v1', index); },
  async readOuting(id) { return outingSchema.parse(await readPayload(vaultName(id))); },
  async writeOuting(outing) { await writePayload(vaultName(outing.id), outing); },
  async eraseOuting(id) {
    const name = vaultName(id);
    // Key erasure comes before file removal; retries are idempotent.
    await SecureStore.deleteItemAsync(`vico.key.${name}`);
    if (databaseFile(name).exists) await deleteDatabaseAsync(`${name}.db`);
  },
});
let serial: Promise<unknown> = Promise.resolve();
function serialized<T>(operation: () => Promise<T>): Promise<T> {
  const next = serial.then(operation); serial = next.catch(() => {}); return next;
}
export function readStore(): Promise<Store> { return serialized(() => vault.load(Date.now())).catch(error => { if (error instanceof StorageFailure) throw error; throw new Error('Could not open encrypted private storage. Keep existing data intact and reopen Vico.'); }); }
export function writeStore(store: Store): Promise<Store> { return serialized(() => vault.save(store, Date.now())).catch(() => { throw new Error('Could not complete private storage changes. No success has been confirmed. Reopen Vico to retry pending cleanup.'); }); }
export const storageDescription = 'Encrypted on this device with a separate key for each outing. Deleting an outing removes its key and app-managed files.';
