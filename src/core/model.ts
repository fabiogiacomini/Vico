import { z } from 'zod';

export const coordinateSchema = z.object({ latitude: z.number().finite().min(-90).max(90), longitude: z.number().finite().min(-180).max(180) });
export type Coordinate = z.infer<typeof coordinateSchema>;
export const pointSchema = coordinateSchema.extend({ elevation: z.number().finite().optional(), observedAt: z.number().finite().optional() });
export type RoutePoint = z.infer<typeof pointSchema>;
export const routeSchema = z.object({
  id: z.string().min(1), name: z.string().min(1).max(120), version: z.number().int().positive(),
  importedAt: z.number().finite(), fileName: z.string().max(200), synthetic: z.boolean(),
  segments: z.array(z.array(pointSchema).min(1).max(20000)).min(1).max(2000),
}).refine(route => route.segments.reduce((n, s) => n + s.length, 0) <= 20000, 'Route exceeds 20,000 points');
export type Route = z.infer<typeof routeSchema>;
export const positionSchema = coordinateSchema.extend({ observedAt: z.number().finite(), accuracy: z.number().finite().nonnegative() });
export type Position = z.infer<typeof positionSchema>;
export const weatherSchema = z.object({
  provider: z.literal('Open-Meteo'), retrievedAt: z.number().finite(), validAt: z.number().finite(),
  location: coordinateSchema, temperature: z.number().nullable(), precipitationProbability: z.number().min(0).max(100).nullable(),
  wind: z.number().nonnegative().nullable(), gusts: z.number().nonnegative().nullable(),
});
export type Weather = z.infer<typeof weatherSchema>;
export const outingSchema = z.object({
  id: z.string().min(1), title: z.string().min(1).max(80), createdAt: z.number().finite(), endsAt: z.number().finite(),
  route: routeSchema.optional(), meeting: coordinateSchema.extend({ name: z.string().min(1).max(80), version: z.number().int().positive(), setAt: z.number().finite() }).optional(),
  pack: z.object({ savedAt: z.number().finite(), routeVersion: z.number().int().positive(), meetingVersion: z.number().int().positive().nullable() }).optional(),
  weather: weatherSchema.optional(),
  reports: z.array(z.object({ id: z.string(), level: z.enum(['quiet', 'moderate', 'busy']), observedAt: z.number().finite(), expiresAt: z.number().finite() })).max(200),
});
export type Outing = z.infer<typeof outingSchema>;
export const storeSchema = z.object({
  version: z.literal(1), outings: z.array(outingSchema).max(100),
  preferences: z.object({ units: z.enum(['metric', 'imperial']), paceKmh: z.number().min(1).max(10), weatherConsent: z.boolean() }),
});
export type Store = z.infer<typeof storeSchema>;
export const emptyStore = (): Store => ({ version: 1, outings: [], preferences: { units: 'metric', paceKmh: 4, weatherConsent: false } });
export const RETENTION_MS = 24 * 60 * 60 * 1000;
export function cleanStore(store: Store, now: number): Store {
  return { ...store, outings: store.outings.filter(o => now < o.endsAt + RETENTION_MS).map(o => ({ ...o, reports: o.reports.filter(r => now < r.expiresAt && r.observedAt <= now) })) };
}
export function packState(outing: Outing): 'missing' | 'outdated' | 'ready' {
  if (!outing.pack || !outing.route) return 'missing';
  return outing.pack.routeVersion === outing.route.version && outing.pack.meetingVersion === (outing.meeting?.version ?? null) ? 'ready' : 'outdated';
}
