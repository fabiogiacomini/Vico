import { describe, expect, it } from 'vitest';
import { databaseFileUri } from '../src/platform/private-files';

describe('private database paths across native platforms', () => {
  it('converts the raw Android SQLite directory to a local file URI', () => {
    expect(databaseFileUri('/data/user/0/org.vico.prototype/files/SQLite', 'index.v1')).toBe('file:///data/user/0/org.vico.prototype/files/SQLite/index.v1.db');
  });
  it('preserves an iOS file URI and handles trailing slashes', () => {
    expect(databaseFileUri('file:///var/mobile/Application/test/Documents/SQLite/', 'outing.123')).toBe('file:///var/mobile/Application/test/Documents/SQLite/outing.123.db');
  });
  it('rejects nonlocal directories and traversal names', () => {
    expect(() => databaseFileUri('content://provider/storage', 'index.v1')).toThrow();
    expect(() => databaseFileUri('/private/storage', '../elsewhere')).toThrow();
  });
});
