import type { Coordinate, Position, Route } from './model';
const R = 6371008.8;
const rad = (degrees: number) => degrees * Math.PI / 180;
export const wrapLongitude = (n: number) => ((n + 540) % 360 + 360) % 360 - 180;
export function distance(a: Coordinate, b: Coordinate): number {
  const dLat = rad(b.latitude - a.latitude), dLon = rad(wrapLongitude(b.longitude - a.longitude));
  const v = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(Math.min(1, v)), Math.sqrt(Math.max(0, 1 - v)));
}
export function routeLength(route: Route): number {
  return route.segments.reduce((sum, points) => sum + points.slice(1).reduce((n, p, i) => n + distance(points[i], p), 0), 0);
}
export function routeGeoJSON(route?: Route) {
  return { type: 'Feature' as const, properties: {}, geometry: { type: 'MultiLineString' as const, coordinates: route?.segments.filter(s => s.length >= 2).map(s => s.map(p => [p.longitude, p.latitude])) ?? [] } };
}
export function pointGeoJSON(point?: Coordinate) {
  return { type: 'FeatureCollection' as const, features: point ? [{ type: 'Feature' as const, properties: {}, geometry: { type: 'Point' as const, coordinates: [point.longitude, point.latitude] } }] : [] };
}
// Distances are measured only against supplied segments. Gaps never become paths.
export function routeDistance(position: Coordinate, route: Route): number {
  let best = Infinity;
  for (const segment of route.segments) {
    if (segment.length === 1) best = Math.min(best, distance(position, segment[0]));
    for (let i = 1; i < segment.length; i++) {
      const a = segment[i - 1], b = segment[i];
      const scale = Math.cos(rad(position.latitude));
      const ax = rad(wrapLongitude(a.longitude - position.longitude)) * R * scale;
      const ay = rad(a.latitude - position.latitude) * R;
      const bx = ax + rad(wrapLongitude(b.longitude - a.longitude)) * R * scale;
      const by = rad(b.latitude - position.latitude) * R;
      const dx = bx - ax, dy = by - ay;
      const t = dx * dx + dy * dy === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy)));
      best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy));
    }
  }
  return best;
}
export function passageTime(meters: number, paceKmh: number, startsAt: number): number {
  if (!Number.isFinite(meters) || meters < 0 || !Number.isFinite(paceKmh) || paceKmh < 1 || paceKmh > 10) throw new Error('Invalid walking pace or distance.');
  return startsAt + meters / (paceKmh * 1000) * 3600000;
}
export function formatDistance(m: number, units: 'metric' | 'imperial') {
  if (!Number.isFinite(m)) return 'Unavailable';
  if (units === 'imperial') return m < 160.9344 ? `${Math.round(m * 3.28084)} ft` : `${(m / 1609.344).toFixed(1)} mi`;
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}
export function positionAge(p: Position, now: number) {
  if (p.observedAt > now + 30000) return 'Timestamp needs checking';
  const minutes = Math.max(0, Math.floor((now - p.observedAt) / 60000));
  return minutes < 1 ? 'Less than a minute ago' : `${minutes} min ago`;
}
