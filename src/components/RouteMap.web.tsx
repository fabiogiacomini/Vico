import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { View, Text } from 'react-native';
import { RouteSketch, type RouteMapProps } from './RouteSketch';
import { pointGeoJSON, routeGeoJSON } from '../core/geo';
import { colors } from './theme';
const styleUrl = process.env.EXPO_PUBLIC_MAP_STYLE_URL;
export default function RouteMap(props: RouteMapProps) {
  const container = useRef<HTMLDivElement>(null), map = useRef<maplibregl.Map | null>(null);
  const latest = useRef(props); latest.current = props;
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!styleUrl || !container.current) return;
    try {
      const center = props.route?.segments[0]?.[0] ?? props.meeting ?? props.position ?? { longitude: 0, latitude: 0 };
      const instance = new maplibregl.Map({ container: container.current, style: styleUrl, center: [center.longitude, center.latitude], zoom: 13, attributionControl: { compact: true }, transformRequest: url => ({ url, credentials: 'same-origin' }) });
      map.current = instance;
      instance.addControl(new maplibregl.NavigationControl(), 'top-right');
      instance.on('load', () => {
        instance.addSource('route', { type: 'geojson', data: routeGeoJSON(latest.current.route) });
        instance.addLayer({ id: 'route', source: 'route', type: 'line', paint: { 'line-color': colors.green, 'line-width': 5 } });
        for (const [id, point, color] of [['meeting', latest.current.meeting, colors.orange], ['position', latest.current.position, '#2869A0']] as const) {
          instance.addSource(id, { type: 'geojson', data: pointGeoJSON(point) });
          instance.addLayer({ id, source: id, type: 'circle', paint: { 'circle-color': color, 'circle-radius': 8, 'circle-stroke-width': 3, 'circle-stroke-color': '#ffffff' } });
        }
        setReady(true);
      });
      instance.on('click', e => latest.current.onSelect?.({ latitude: e.lngLat.lat, longitude: e.lngLat.lng }));
      instance.on('error', () => setFailed(true));
      return () => { instance.remove(); map.current = null; };
    } catch { setFailed(true); }
  }, []);
  useEffect(() => {
    const m = map.current; if (!ready || !m) return;
    (m.getSource('route') as maplibregl.GeoJSONSource)?.setData(routeGeoJSON(props.route));
    (m.getSource('meeting') as maplibregl.GeoJSONSource)?.setData(pointGeoJSON(props.meeting));
    (m.getSource('position') as maplibregl.GeoJSONSource)?.setData(pointGeoJSON(props.position));
    const points = props.route?.segments.flat();
    if (points?.length) { const bounds = new maplibregl.LngLatBounds(); points.forEach(p => bounds.extend([p.longitude, p.latitude])); m.fitBounds(bounds, { padding: 40, maxZoom: 16, duration: 0 }); }
  }, [ready, props.route, props.meeting, props.position]);
  if (!styleUrl) return <RouteSketch {...props} />;
  return <View>{failed && <Text style={{ color: colors.amber, padding: 10 }}>Basemap unavailable. Saved route information remains below.</Text>}<div ref={container} style={{ width: '100%', height: 320 }} /></View>;
}
