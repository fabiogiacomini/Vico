// SQLite exposes an absolute filesystem path on Android. FileSystem requires a URI.
export function databaseFileUri(directory: string, name: string): string {
  if (!/^[a-zA-Z0-9.-]+$/.test(name)) throw new Error('Invalid private database name.');
  const base = directory.replace(/\/+$/, '');
  if (base.startsWith('file:///')) return `${base}/${name}.db`;
  if (base.startsWith('/')) return `file://${base}/${name}.db`;
  throw new Error('Private database directory must be an absolute local path.');
}
