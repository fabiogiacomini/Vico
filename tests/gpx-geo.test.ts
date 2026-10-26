import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { MAX_GPX_BYTES, parseGpx } from '../src/core/gpx';
import { distance, passageTime, routeDistance, routeGeoJSON, routeLength } from '../src/core/geo';
const xml = readFileSync(new URL('../fixtures/practice.gpx', import.meta.url), 'utf8');
const parse = (s: string) => parseGpx(s, 'test.gpx', 'route-test', 1000);
describe('GPX integrity — A07', () => {
  it('imports an ordinary namespaced track and elevation', () => { const r = parse(xml); expect(r.segments).toHaveLength(1); expect(r.segments[0]).toHaveLength(8); expect(r.segments[0][0].elevation).toBe(800); });
  it('preserves separate track segments and never draws across their gaps', () => {
    const route = parse('<gpx><trk><trkseg><trkpt lat="0" lon="0"/><trkpt lat="0" lon="0.01"/></trkseg><trkseg><trkpt lat="0" lon="1"/><trkpt lat="0" lon="1.01"/></trkseg></trk></gpx>');
    expect(route.segments).toHaveLength(2); expect(routeGeoJSON(route).geometry.coordinates).toHaveLength(2); expect(routeLength(route)).toBeLessThan(2300); expect(routeDistance({ latitude: 0, longitude: 0.5 }, route)).toBeGreaterThan(50000);
  });
  it('supports GPX routes and their point timestamps', () => { const r = parse('<gpx><rte><name>Walk</name><rtept lat="0" lon="0"><time>2026-10-26T08:00:00Z</time></rtept><rtept lat="1" lon="1"/></rte></gpx>'); expect(r.name).toBe('Walk'); expect(r.segments[0][0].observedAt).toBe(Date.parse('2026-10-26T08:00:00Z')); });
  it.each([
    '<gpx><trk>', '<html/>', '<gpx><trk><trkseg><trkpt lat="91" lon="1"/><trkpt lat="1" lon="1"/></trkseg></trk></gpx>',
    '<gpx><trk><trkseg><trkpt lat="" lon="1"/><trkpt lat="1" lon="1"/></trkseg></trk></gpx>',
    '<!DOCTYPE gpx [<!ENTITY location SYSTEM "file:///etc/passwd">]><gpx/>',
    '<gpx xmlns="https://untrusted.example"><trk/></gpx>',
    '<gpx><wpt lat="0" lon="0"/></gpx>',
  ])('rejects unsafe or unusable input', s => expect(() => parse(s)).toThrow());
  it('bounds file size before parsing', () => expect(() => parse(' '.repeat(MAX_GPX_BYTES + 1))).toThrow('2 MB'));
  it('bounds point count', () => expect(() => parse('<gpx><rte>' + '<rtept lat="0" lon="0"/>'.repeat(20001) + '</rte></gpx>')).toThrow('20,000'));
});
describe('navigation limits — A08', () => {
  it('uses the short distance across the international date line', () => expect(distance({ latitude: 0, longitude: 179.99 }, { latitude: 0, longitude: -179.99 })).toBeCloseTo(2223.9, 0));
  it('returns zero for identical coordinates', () => expect(distance({ latitude: 45, longitude: 10 }, { latitude: 45, longitude: 10 })).toBe(0));
  it('estimates passage time from an explicit pace', () => { expect(passageTime(4000, 4, 1000)).toBe(3601000); expect(passageTime(4000, 2, 1000)).toBe(7201000); });
  it.each([0, -1, Infinity, NaN, 11])('rejects unusable pace %s', pace => expect(() => passageTime(1000, pace, 0)).toThrow());
});
