import { describe, expect, it } from 'vitest';
import { crowdCoverage, observationState, registrySchema } from '../src/core/sources';
import manifest from '../registry/sources.json';
import { weatherFromResponse } from '../src/data/weather';
const now = Date.parse('2026-10-26T10:00:00Z');
describe('honest crowd evidence — A01/A09/A10/A11', () => {
  const registry = registrySchema.parse(manifest);
  it('does not activate a candidate even inside its bounding box', () => expect(crowdCoverage(registry.sources, { latitude: 44.5, longitude: 11.3 })).toBe('no_coverage'));
  it('distinguishes an unchecked location from no coverage', () => expect(crowdCoverage(registry.sources)).toBe('not_checked'));
  it('keeps the original measurement types', () => expect(registry.sources.map(s => s.metric)).toEqual(['detected_devices', 'pedestrian_passages']));
  it('accepts a measured zero', () => expect(observationState(0, now, now, 1000)).toBe('valid'));
  it('does not turn a missing record into zero', () => expect(observationState(null, now, now, 1000)).toBe('insufficient_samples'));
  it('reports provider failure separately', () => expect(observationState(null, null, now, 1000, true)).toBe('provider_failure'));
  it('labels old observations as stale', () => expect(observationState(3, now - 1000, now, 1000)).toBe('stale'));
  it('rejects a future observation as insufficient evidence', () => expect(observationState(3, now + 60000, now, 1000)).toBe('insufficient_samples'));
  it('rejects duplicated source IDs', () => expect(() => registrySchema.parse({ ...registry, sources: [registry.sources[0], registry.sources[0]] })).toThrow());
});
describe('forecast time and missing values — A12', () => {
  const data = { hourly: { time: [now / 1000, now / 1000 + 3600], temperature_2m: [8, 10], precipitation_probability: [null, 20], wind_speed_10m: [7, 8], wind_gusts_10m: [10, 12] } };
  it('preserves provider valid time, retrieval time and null probability', () => { const w = weatherFromResponse(data, { latitude: 45, longitude: 10 }, now + 2000, now + 3000); expect(w.validAt).toBe(now); expect(w.retrievedAt).toBe(now + 3000); expect(w.precipitationProbability).toBeNull(); expect(w).not.toHaveProperty('issuedAt'); });
  it('does not serve a forecast for an unsupported requested date', () => expect(() => weatherFromResponse(data, { latitude: 0, longitude: 0 }, now + 86400000, now)).toThrow());
  it('rejects incomplete provider arrays', () => expect(() => weatherFromResponse({ hourly: { ...data.hourly, temperature_2m: [] } }, { latitude: 0, longitude: 0 }, now, now)).toThrow());
});
