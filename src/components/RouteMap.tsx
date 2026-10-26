import { Map, Camera, GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import { View, Text } from 'react-native';
import { RouteSketch, type RouteMapProps } from './RouteSketch';
import { pointGeoJSON, routeGeoJSON } from '../core/geo';
import { colors } from './theme';
const styleUrl = process.env.EXPO_PUBLIC_MAP_STYLE_URL;
export default function RouteMap(props: RouteMapProps) {
  if (!styleUrl) return <RouteSketch {...props} />;
  const points = props.route?.segments.flat() ?? [], origin = points[0] ?? props.meeting ?? props.position ?? { longitude: 0, latitude: 0 };
  const bounds: [number, number, number, number] | undefined = points.length > 1 ? [Math.min(...points.map(p => p.longitude)), Math.min(...points.map(p => p.latitude)), Math.max(...points.map(p => p.longitude)), Math.max(...points.map(p => p.latitude))] : undefined;
  return <View style={{ height: 320 }}>
    <Map mapStyle={styleUrl} style={{ flex: 1 }} attribution onPress={e => props.onSelect?.({ longitude: e.nativeEvent.lngLat[0], latitude: e.nativeEvent.lngLat[1] })}>
      <Camera key={props.route?.id ?? `${origin.latitude},${origin.longitude}`} initialViewState={bounds ? { bounds, padding: { top: 40, bottom: 40, left: 40, right: 40 } } : { center: [origin.longitude, origin.latitude], zoom: 13 }} />
      <GeoJSONSource id="route" data={routeGeoJSON(props.route)}><Layer id="route-line" type="line" paint={{ 'line-color': colors.green, 'line-width': 5 }} /></GeoJSONSource>
      <GeoJSONSource id="meeting" data={pointGeoJSON(props.meeting)}><Layer id="meeting-dot" type="circle" paint={{ 'circle-color': colors.orange, 'circle-radius': 9, 'circle-stroke-width': 3, 'circle-stroke-color': '#ffffff' }} /></GeoJSONSource>
      <GeoJSONSource id="position" data={pointGeoJSON(props.position)}><Layer id="own-dot" type="circle" paint={{ 'circle-color': '#2869A0', 'circle-radius': 8, 'circle-stroke-width': 3, 'circle-stroke-color': '#ffffff' }} /></GeoJSONSource>
    </Map>
    {process.env.EXPO_PUBLIC_MAP_ATTRIBUTION && <Text style={{ fontSize: 10, color: colors.muted }}>{process.env.EXPO_PUBLIC_MAP_ATTRIBUTION}</Text>}
  </View>;
}
