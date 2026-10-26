import { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import type { Coordinate, Position, Route } from '../core/model';
import { wrapLongitude } from '../core/geo';
import { colors } from './theme';
export interface RouteMapProps { route?: Route; meeting?: Coordinate; position?: Position; onSelect?: (p: Coordinate) => void }
export function RouteSketch({ route, meeting, position, onSelect }: RouteMapProps) {
  const [width, setWidth] = useState(350), height = 320;
  const all = [...(route?.segments.flat() ?? []), ...(meeting ? [meeting] : []), ...(position ? [position] : [])];
  const origin = all[0] ?? { latitude: 0, longitude: 0 };
  const project = (p: Coordinate) => ({ x: wrapLongitude(p.longitude - origin.longitude) * Math.max(0.01, Math.cos(origin.latitude * Math.PI / 180)), y: p.latitude - origin.latitude });
  const pts = all.map(project), xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const minX = Math.min(0, ...xs), maxX = Math.max(0.004, ...xs), minY = Math.min(0, ...ys), maxY = Math.max(0.004, ...ys);
  const scale = Math.min((width - 90) / (maxX - minX), (height - 100) / (maxY - minY));
  const px = (p: Coordinate) => 45 + (width - 90 - (maxX - minX) * scale) / 2 + (project(p).x - minX) * scale;
  const py = (p: Coordinate) => 50 + (height - 100 - (maxY - minY) * scale) / 2 + (maxY - project(p).y) * scale;
  return <View onLayout={e => setWidth(Math.max(180, e.nativeEvent.layout.width))} style={{ height, backgroundColor: '#E8ECDD', overflow: 'hidden' }} accessibilityLabel="Route diagram. Use meeting point coordinates to set a destination.">
    <Svg width={width} height={height}>
      {[0, 1, 2, 3, 4, 5, 6].map(i => <Line key={`v${i}`} x1={i * width / 6} y1={0} x2={i * width / 6} y2={height} stroke="#D8DFCE" strokeWidth={1} />)}
      {[0, 1, 2, 3, 4, 5].map(i => <Line key={`h${i}`} x1={0} y1={i * height / 5} x2={width} y2={i * height / 5} stroke="#D8DFCE" strokeWidth={1} />)}
      <SvgText x={width - 25} y={32} fontSize={12} fill={colors.ink} fontWeight="bold">N</SvgText>
      <Line x1={width - 21} y1={42} x2={width - 21} y2={61} stroke={colors.ink} strokeWidth={2} />
      {route?.segments.map((segment, i) => <Polyline key={i} points={segment.map(p => `${px(p)},${py(p)}`).join(' ')} stroke={colors.green} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" fill="none" />)}
      {route?.segments[0]?.[0] && <Circle cx={px(route.segments[0][0])} cy={py(route.segments[0][0])} r={6} fill={colors.paper} stroke={colors.green} strokeWidth={3} />}
      {meeting && <Circle cx={px(meeting)} cy={py(meeting)} r={9} fill={colors.orange} stroke={colors.paper} strokeWidth={3} />}
      {position && <Circle cx={px(position)} cy={py(position)} r={8} fill="#2869A0" stroke={colors.paper} strokeWidth={3} />}
    </Svg>
    <View style={{ position: 'absolute', bottom: 14, left: 14, right: 14, gap: 3 }}>
      <Text style={{ color: colors.ink, fontWeight: '700', fontSize: 11 }}>ROUTE DIAGRAM · NO BASEMAP</Text>
      <Text style={{ color: colors.muted, fontSize: 11 }}>{all.length ? `${origin.latitude.toFixed(4)}°, ${origin.longitude.toFixed(4)}° · saved geometry` : 'Import a GPX or locate your position to begin.'}</Text>
    </View>
  </View>;
}
