import { z } from 'zod';
import type { Coordinate } from './model';
export const sourceSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/), name: z.string().min(1), documentation: z.url(),
  kind: z.enum(['weather', 'crowd']), state: z.enum(['candidate', 'pilot', 'active', 'degraded', 'retired']),
  metric: z.enum(['detected_devices', 'pedestrian_passages', 'forecast']), unit: z.string().min(1),
  license: z.string().min(1), attribution: z.string().min(1),
  coverage: z.object({ west: z.number().min(-180).max(180), east: z.number().min(-180).max(180), south: z.number().min(-90).max(90), north: z.number().min(-90).max(90) }).refine(b => b.south <= b.north),
  updateSeconds: z.number().positive(), maxAgeSeconds: z.number().positive(), lastValidated: z.iso.datetime().nullable(), limitations: z.array(z.string()).min(1),
});
export type Source = z.infer<typeof sourceSchema>;
export const registrySchema = z.object({ version: z.literal(1), revision: z.number().int().positive(), sources: z.array(sourceSchema) }).refine(r => new Set(r.sources.map(s => s.id)).size === r.sources.length, 'Source IDs must be unique');
export function covers(s: Source, p: Coordinate) {
  const b = s.coverage;
  return p.latitude >= b.south && p.latitude <= b.north && (b.west <= b.east ? p.longitude >= b.west && p.longitude <= b.east : p.longitude >= b.west || p.longitude <= b.east);
}
export function crowdCoverage(sources: Source[], point?: Coordinate): 'not_checked' | 'no_coverage' | 'available' {
  if (!point) return 'not_checked';
  return sources.some(s => s.kind === 'crowd' && s.state === 'active' && covers(s, point)) ? 'available' : 'no_coverage';
}
export type EvidenceState = 'valid' | 'stale' | 'insufficient_samples' | 'provider_failure' | 'not_checked';
export function observationState(value: number | null, observedAt: number | null, now: number, maxAgeMs: number, failed = false): EvidenceState {
  if (failed) return 'provider_failure';
  if (value === null || observedAt === null || !Number.isFinite(value) || value < 0 || !Number.isFinite(observedAt) || observedAt > now + 30000) return 'insufficient_samples';
  return now - observedAt >= maxAgeMs ? 'stale' : 'valid';
}
