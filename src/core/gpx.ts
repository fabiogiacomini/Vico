import { SaxesParser } from 'saxes';
import { coordinateSchema, type Route, type RoutePoint } from './model';
export const MAX_GPX_BYTES = 2 * 1024 * 1024;
export function parseGpx(xml: string, fileName: string, id: string, now: number): Route {
  if (new TextEncoder().encode(xml).byteLength > MAX_GPX_BYTES) throw new Error('Choose a GPX file smaller than 2 MB.');
  if (/<!\s*(DOCTYPE|ENTITY)/i.test(xml)) throw new Error('GPX files with document types or entities are not supported.');
  const parser = new SaxesParser({ xmlns: true });
  const segments: RoutePoint[][] = [];
  let segment: RoutePoint[] | undefined, point: RoutePoint | undefined;
  let count = 0, name = '', text = '', rootSeen = false;
  const stack: string[] = [];
  const attr = (tag: { attributes: Record<string, { value: string }> }, key: string) => tag.attributes[key]?.value;
  parser.on('opentag', tag => {
    const local = tag.local;
    if (!stack.length) { if (local !== 'gpx' || (tag.uri && !/^http:\/\/www\.topografix\.com\/GPX\/1\/[01]$/.test(tag.uri))) throw new Error('This file is not a supported GPX document.'); rootSeen = true; }
    stack.push(local); text = '';
    if (stack.length > 24) throw new Error('GPX nesting is too deep.');
    const parent = stack.at(-2);
    if ((local === 'trkseg' && parent === 'trk') || (local === 'rte' && parent === 'gpx')) {
      segment = []; segments.push(segment);
      if (segments.length > 2000) throw new Error('GPX contains too many segments.');
    }
    if ((local === 'trkpt' && parent === 'trkseg') || (local === 'rtept' && parent === 'rte')) {
      if (!segment) throw new Error('GPX point has no segment.');
      const lat = attr(tag, 'lat'), lon = attr(tag, 'lon');
      if (!lat?.trim() || !lon?.trim()) throw new Error('A route point is missing coordinates.');
      const valid = coordinateSchema.safeParse({ latitude: Number(lat), longitude: Number(lon) });
      if (!valid.success) throw new Error('GPX contains an invalid coordinate.');
      point = valid.data; segment.push(point);
      if (++count > 20000) throw new Error('Choose a GPX with at most 20,000 points.');
    }
  });
  parser.on('text', value => { text += value; });
  parser.on('cdata', value => { text += value; });
  parser.on('closetag', tag => {
    const parent = stack.at(-2), local = tag.local;
    if (point && (parent === 'trkpt' || parent === 'rtept')) {
      if (local === 'ele' && text.trim()) { const n = Number(text); if (!Number.isFinite(n) || n < -12000 || n > 100000) throw new Error('GPX contains an invalid elevation.'); point.elevation = n; }
      if (local === 'time' && text.trim()) { const n = Date.parse(text.trim()); if (!Number.isFinite(n)) throw new Error('GPX contains an invalid time.'); point.observedAt = n; }
    }
    if (local === 'name' && !name && (parent === 'trk' || parent === 'rte' || parent === 'metadata')) name = text.trim().slice(0, 120);
    if (local === 'trkpt' || local === 'rtept') point = undefined;
    if (local === 'trkseg' || local === 'rte') segment = undefined;
    stack.pop(); text = '';
  });
  parser.on('error', () => { throw new Error('The GPX file is malformed.'); });
  parser.write(xml).close();
  const nonempty = segments.filter(s => s.length > 0);
  if (!rootSeen || count < 2 || !nonempty.length) throw new Error('This GPX contains no usable track or route.');
  return { id, name: name || fileName.replace(/\.gpx$/i, '').slice(0, 120) || 'Imported route', fileName: fileName.slice(0, 200), version: 1, importedAt: now, segments: nonempty, synthetic: false };
}
