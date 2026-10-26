import { parseGpx } from '../core/gpx';
export function practiceRoute(id: string, now: number) {
  const route = parseGpx('<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1"><trk><name>Practice route</name><trkseg>' + [[45.831,10.003],[45.832,10.004],[45.8325,10.007],[45.834,10.008],[45.835,10.007],[45.836,10.009],[45.8375,10.01],[45.839,10.009]].map(([lat,lon]) => `<trkpt lat="${lat}" lon="${lon}"/>`).join('') + '</trkseg></trk></gpx>', 'synthetic-practice.gpx', id, now);
  return { ...route, synthetic: true };
}
