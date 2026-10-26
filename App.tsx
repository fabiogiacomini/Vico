import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import { randomUUID } from 'expo-crypto';
import { ArrowDownToLine, ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronRight, Compass, Flag, Footprints, Layers3, LocateFixed, Map as MapIcon, MapPin, Mountain, Plus, Route as RouteIcon, Settings, ShieldCheck, Signal, Trash2, Users, WifiOff, Wind, X, CloudSun, Clock3, FileUp, LockKeyhole, ExternalLink } from 'lucide-react-native';
import type { Coordinate, Outing, Position, Store } from './src/core/model';
import { cleanStore, coordinateSchema, emptyStore, packState, RETENTION_MS } from './src/core/model';
import { distance, formatDistance, passageTime, positionAge, routeDistance, routeLength } from './src/core/geo';
import { parseGpx } from './src/core/gpx';
import { crowdCoverage } from './src/core/sources';
import { registry } from './src/data/registry';
import { practiceRoute } from './src/data/practice';
import { fetchWeather } from './src/data/weather';
import { readStore, storageDescription, writeStore } from './src/platform/storage';
import { pickGpx } from './src/platform/files';
import RouteMap from './src/components/RouteMap';
import { Badge, Button, Detail, IconButton } from './src/components/Primitives';
import { colors, ui } from './src/components/theme';

type Tab = 'outings' | 'map' | 'group' | 'context' | 'offline';
type Dialog = 'create' | 'meeting' | 'settings' | 'delete' | 'weather' | null;
const tabs = [{ id: 'outings' as const, label: 'Outings', icon: Compass }, { id: 'map' as const, label: 'Map', icon: MapIcon }, { id: 'group' as const, label: 'Group', icon: Users }, { id: 'context' as const, label: 'Context', icon: Layers3 }, { id: 'offline' as const, label: 'Saved', icon: ArrowDownToLine }];
const time = (n: number) => new Date(n).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const hour = (n: number) => new Date(n).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
const errorText = (e: unknown) => e instanceof Error ? e.message : 'This action could not be completed. Please try again.';

export default function App() { return <SafeAreaProvider><Vico /></SafeAreaProvider>; }
function Vico() {
  const [store, setStore] = useState<Store>(emptyStore), storeRef = useRef(store);
  const mutations = useRef<Promise<unknown>>(Promise.resolve());
  const [loaded, setLoaded] = useState(false), [fatal, setFatal] = useState<string | null>(null), loadedRef = useRef(false);
  const [selectedId, setSelectedId] = useState<string | null>(null), [tab, setTab] = useState<Tab>('outings');
  const [dialog, setDialog] = useState<Dialog>(null), [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false), busyRef = useRef(false), [now, setNow] = useState(Date.now()), [connected, setConnected] = useState<boolean | undefined>();
  const [title, setTitle] = useState(''), [duration, setDuration] = useState(6), [lat, setLat] = useState(''), [lon, setLon] = useState(''), [meetingName, setMeetingName] = useState('Meeting point');
  const [deleteWord, setDeleteWord] = useState(''), [position, setPosition] = useState<Position>(), [locating, setLocating] = useState(false), [weatherTime, setWeatherTime] = useState<'now' | 'arrival'>('now');
  const watch = useRef<Location.LocationSubscription | undefined>(undefined), locationGeneration = useRef(0);
  const outing = store.outings.find(o => o.id === selectedId), ended = outing ? now >= outing.endsAt : false;
  const units = store.preferences.units;
  const stopLocation = useCallback(() => { locationGeneration.current++; watch.current?.remove(); watch.current = undefined; setLocating(false); setPosition(undefined); }, []);
  const commit = useCallback((change: (s: Store) => Store) => {
    const next = mutations.current.then(async () => {
      const updated = cleanStore(change(storeRef.current), Date.now());
      const saved = await writeStore(updated);
      storeRef.current = saved; setStore(saved);
    });
    mutations.current = next.catch(() => {}); return next;
  }, []);
  useEffect(() => {
    let mounted = true;
    readStore().then(s => { if (mounted) { storeRef.current = s; setStore(s); loadedRef.current = true; setLoaded(true); } }).catch(e => { if (mounted) setFatal(errorText(e)); });
    const ticker = setInterval(() => setNow(Date.now()), 1000);
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active') stopLocation();
      else if (loadedRef.current) { setNow(Date.now()); void commit(s => cleanStore(s, Date.now())).catch(() => setFatal('Could not complete private data cleanup. Close and reopen Vico.')); }
    });
    Network.getNetworkStateAsync().then(s => setConnected(s.isInternetReachable ?? s.isConnected)).catch(() => setConnected(undefined));
    const net = Network.addNetworkStateListener(s => setConnected(s.isInternetReachable ?? s.isConnected));
    return () => { mounted = false; clearInterval(ticker); sub.remove(); net.remove(); stopLocation(); };
  }, [commit, stopLocation]);
  useEffect(() => { stopLocation(); }, [selectedId, stopLocation]);
  useEffect(() => { if (ended) stopLocation(); }, [ended, stopLocation]);
  useEffect(() => {
    if (!loaded || !store.outings.some(o => now >= o.endsAt + RETENTION_MS || o.reports.some(r => now >= r.expiresAt))) return;
    void commit(s => cleanStore(s, now)).catch(() => setFatal('Private data cleanup failed. Close and reopen Vico.'));
  }, [now, loaded, store.outings, commit]);

  const act = async (fn: () => Promise<void>) => { if (busyRef.current) return; busyRef.current = true; setBusy(true); setNotice(null); try { await fn(); } catch (e) { setNotice(errorText(e)); } finally { busyRef.current = false; setBusy(false); } };
  const updateOuting = (fn: (o: Outing) => Outing) => commit(s => ({ ...s, outings: s.outings.map(o => o.id === selectedId ? fn(o) : o) }));
  async function create(practice = false) {
    const id = randomUUID(), at = Date.now();
    const route = practice ? practiceRoute(randomUUID(), at) : undefined;
    const newOuting: Outing = { id, title: practice ? 'A little further, together' : title.trim(), createdAt: at, endsAt: at + duration * 3600000, reports: [], ...(route ? { route, meeting: { ...route.segments.at(-1)!.at(-1)!, name: 'Practice meeting point', version: 1, setAt: at } } : {}) };
    if (!newOuting.title) throw new Error('Give your outing a name.');
    if (storeRef.current.outings.length >= 100) throw new Error('Remove an older outing before creating another.');
    await commit(s => ({ ...s, outings: [newOuting, ...s.outings] }));
    setSelectedId(id); setDialog(null); setTitle(''); setTab('map');
  }
  async function importGpx() {
    if (!outing || ended) return;
    const selected = await pickGpx(); if (!selected) return;
    const route = parseGpx(selected.xml, selected.name, randomUUID(), Date.now());
    await updateOuting(o => ({ ...o, route: { ...route, version: (o.route?.version ?? 0) + 1 } }));
    setNotice('Route imported. Check its source and surroundings before following it.');
  }
  function openMeeting(p?: Coordinate) {
    setMeetingName(outing?.meeting?.name ?? 'Meeting point');
    setLat(String(p?.latitude ?? outing?.meeting?.latitude ?? '')); setLon(String(p?.longitude ?? outing?.meeting?.longitude ?? '')); setDialog('meeting');
  }
  async function saveMeeting() {
    if (!outing || ended) return;
    if (!lat.trim() || !lon.trim() || !meetingName.trim()) throw new Error('Enter a name, latitude and longitude.');
    const point = coordinateSchema.safeParse({ latitude: Number(lat), longitude: Number(lon) });
    if (!point.success) throw new Error('Use a latitude from −90 to 90 and a longitude from −180 to 180.');
    await updateOuting(o => ({ ...o, meeting: { ...point.data, name: meetingName.trim(), version: (o.meeting?.version ?? 0) + 1, setAt: Date.now() } })); setDialog(null);
  }
  async function locate() {
    if (!outing || ended) return;
    if (locating) return stopLocation();
    const generation = ++locationGeneration.current;
    const permission = await Location.requestForegroundPermissionsAsync();
    if (generation !== locationGeneration.current) return;
    if (!permission.granted) throw new Error(permission.canAskAgain ? 'Location permission was not granted. Your saved route remains available.' : 'Enable location for Vico in your device settings to use your position.');
    if (!(await Location.hasServicesEnabledAsync())) throw new Error('Turn on location services in your device settings.');
    if (generation !== locationGeneration.current || Date.now() >= outing.endsAt) return;
    setLocating(true);
    let subscription: Location.LocationSubscription;
    try { subscription = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 5000 }, p => {
      if (generation !== locationGeneration.current || Date.now() >= outing.endsAt || AppState.currentState !== 'active') return;
      setPosition({ latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: Math.max(0, p.coords.accuracy ?? 999), observedAt: p.timestamp });
    }, () => { stopLocation(); setNotice('Positioning stopped. Check your location permission and device settings.'); });
    } catch { stopLocation(); throw new Error('Could not start positioning. Your saved route remains available.'); }
    if (generation !== locationGeneration.current || Date.now() >= outing.endsAt) subscription.remove();
    else watch.current = subscription;
  }
  async function loadWeather() {
    if (!outing) return;
    const point = outing.meeting ?? outing.route?.segments.at(-1)?.at(-1) ?? position;
    if (!point) throw new Error('Set a meeting point, import a route or locate your position first.');
    const requestedAt = Date.now(), validAt = weatherTime === 'arrival' && outing.route ? passageTime(routeLength(outing.route), store.preferences.paceKmh, requestedAt) : requestedAt;
    const forecast = await fetchWeather(point, validAt, requestedAt);
    await updateOuting(o => ({ ...o, weather: forecast }));
  }
  const noOuting = <View style={ui.card}><Compass color={colors.green} size={30} /><Text style={ui.h2}>Your next outing starts here.</Text><Text style={ui.text}>Create a local plan, add a route and choose where to meet.</Text><Button label="Create an outing" onPress={() => setDialog('create')} icon={Plus} /></View>;
  const length = outing?.route ? routeLength(outing.route) : undefined;
  const point = outing?.meeting ?? outing?.route?.segments[0]?.[0] ?? position;
  const coverage = crowdCoverage(registry.sources, point);
  const expiredPrivate = outing && now >= outing.endsAt + RETENTION_MS;
  const usable = outing && !expiredPrivate;

  return <SafeAreaView style={ui.page} edges={['top', 'bottom']}>
    <StatusBar style="dark" />
    <View style={styles.shell}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Vico outings" onPress={() => setTab('outings')} style={ui.row}><View style={styles.brandMark}><Footprints size={23} color={colors.paper} /></View><Text style={styles.brand}>vico<Text style={{ color: colors.green }}>.</Text></Text></Pressable>
        <View style={ui.row}><Badge>LOCAL PROTOTYPE</Badge><IconButton label="Settings" icon={Settings} onPress={() => { if (loaded && !fatal) setDialog('settings'); }} /></View>
      </View>
      <View style={styles.statusBar}>
        <View style={[ui.row, { gap: 6 }]}>{connected === false ? <WifiOff size={13} color={colors.amber} /> : <Signal size={13} color={colors.muted} />}<Text style={styles.statusText}>{connected === false ? 'Offline' : connected ? 'Network available' : 'Network unconfirmed'}</Text></View>
        <Text style={styles.statusText}>Location sharing off · on this device only</Text>
      </View>
      {!loaded || fatal ? <View style={ui.content}><Text style={ui.h2}>{fatal ? 'Private storage unavailable' : 'Opening Vico…'}</Text><Text style={ui.text}>{fatal ?? 'Preparing your local plans.'}</Text>{fatal && <Text style={ui.small}>Your saved data has not been replaced. A native development build with SQLCipher is required on Android and iOS.</Text>}</View> : <ScrollView style={{ flex: 1 }} contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
        {Platform.OS === 'web' && <Text style={ui.small}>Development preview · session only. Changes are cleared on reload.</Text>}
        {notice && <View accessibilityRole="alert" style={ui.notice}><View style={ui.between}><Text style={[ui.text, { flex: 1 }]}>{notice}</Text><IconButton label="Dismiss message" icon={X} onPress={() => setNotice(null)} /></View></View>}
        {tab === 'outings' && <>
          <View style={{ gap: 10, paddingTop: 10 }}><Text style={ui.eyebrow}>GOOD COMPANY. OPEN POSSIBILITIES.</Text><Text style={styles.hero}>Stay together.{"\n"}Go a little further.</Text><Text style={ui.text}>Your people, your route, your next meeting point.</Text></View>
          <View style={ui.dark}><View style={ui.between}><View style={styles.darkIcon}><Mountain size={27} color={colors.orange} /></View><Text style={{ color: '#B5C6B6', fontSize: 12 }}>MADE FOR THE WAY OUT</Text></View><Text style={{ color: 'white', fontSize: 23, fontWeight: '600', lineHeight: 30 }}>A shared adventure starts{"\n"}with a simple plan.</Text><Button label="Plan an outing" icon={Plus} secondary onPress={() => setDialog('create')} /></View>
          <View style={ui.between}><Text style={ui.h2}>Your outings</Text><Text style={ui.small}>{store.outings.length} saved locally</Text></View>
          {store.outings.filter(o => now < o.endsAt + RETENTION_MS).map(o => <Pressable key={o.id} accessibilityRole="button" accessibilityLabel={`Open ${o.title}`} onPress={() => { setSelectedId(o.id); setTab('map'); }} style={ui.card}>
            <View style={ui.between}><Badge amber={now >= o.endsAt}>{now >= o.endsAt ? 'ENDED' : 'LOCAL PLAN'}</Badge><ChevronRight color={colors.green} size={20} /></View><Text style={ui.h2}>{o.title}</Text><View style={ui.row}><Clock3 size={15} color={colors.muted} /><Text style={ui.small}>Until {time(o.endsAt)}</Text></View><Text style={ui.small}>{o.route ? `${formatDistance(routeLength(o.route), units)} · ${o.route.synthetic ? 'synthetic practice route' : 'imported GPX'}` : 'Add a GPX to prepare your route.'}</Text>
          </Pressable>)}
          {!store.outings.length && <View style={ui.card}><Text style={ui.h3}>Try the flow first</Text><Text style={ui.small}>Explore an example with a synthetic route. It is for testing the app and must not be used for navigation.</Text><Button label="Explore the practice outing" secondary icon={ArrowRight} disabled={busy} onPress={() => void act(() => create(true))} /></View>}
          <View style={[ui.row, { alignItems: 'flex-start', padding: 4 }]}><ShieldCheck size={22} color={colors.green} /><View style={{ flex: 1, gap: 3 }}><Text style={ui.h3}>Built in the open</Text><Text style={ui.small}>Open source tools. Clear data sources. Your location stays yours.</Text></View></View>
        </>}
        {tab === 'map' && (usable ? <>
          <View style={ui.between}><View style={{ flex: 1, gap: 7 }}><Text style={ui.eyebrow}>YOUR ACTIVE PLAN</Text><Text style={ui.title}>{outing.title}</Text></View><IconButton label="Show all outings" icon={ArrowLeft} onPress={() => setTab('outings')} /></View>
          <View style={ui.row}><Badge amber={ended}>{ended ? 'Outing ended' : `Until ${hour(outing.endsAt)}`}</Badge><Badge>Only you · local plan</Badge></View>
          {outing.route?.synthetic && <View style={ui.notice}><Text style={[ui.small, { color: colors.amber }]}>Synthetic practice route. These points do not describe a verified walking path.</Text></View>}
          <View style={styles.mapCard}><RouteMap route={outing.route} meeting={outing.meeting} position={position} onSelect={ended ? undefined : p => openMeeting(p)} /><View style={{ padding: 17, gap: 14 }}><View style={ui.between}><View style={ui.row}><RouteIcon size={21} color={colors.green} /><Text style={ui.h3}>{outing.route?.name ?? 'Your route, ready to add'}</Text></View></View><View style={ui.row}><Detail label="Saved trace" value={length === undefined ? 'No GPX yet' : formatDistance(length, units)} /><Detail label="Segments" value={String(outing.route?.segments.length ?? 0)} /><Detail label="Route version" value={outing.route ? `v${outing.route.version}` : '—'} /></View></View></View>
          {outing.route && <Text style={ui.small}>A recorded trace is not a safety assessment or turn-by-turn directions. Gaps remain gaps.</Text>}
          <View style={ui.row}><Button style={{ flex: 1 }} label={locating ? 'Stop positioning' : 'Locate me'} icon={LocateFixed} disabled={busy || ended} onPress={() => void act(locate)} /><Button style={{ flex: 1 }} label="Import GPX" icon={FileUp} secondary disabled={busy || ended} onPress={() => void act(importGpx)} /></View>
          <View style={ui.card}><View style={ui.between}><Text style={ui.h3}>Your position</Text><Badge>{locating ? 'Positioning · app open' : 'Positioning off'}</Badge></View>{position ? <><Text style={ui.text}>{position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}</Text><Text style={ui.small}>{positionAge(position, now)} · accuracy ±{formatDistance(position.accuracy, units)}</Text>{outing.route && <Text style={ui.small}>{position.accuracy > 100 ? 'Accuracy is too low to assess distance from the trace.' : `${formatDistance(routeDistance(position, outing.route), units)} from the saved trace`}</Text>}</> : <Text style={ui.small}>Your position is shown only after you choose “Locate me”. Positioning stops when Vico goes into the background.</Text>}</View>
          <View style={ui.card}><View style={ui.row}><View style={styles.meetingIcon}><Flag size={20} color={colors.ink} /></View><View style={{ flex: 1 }}><Text style={ui.small}>MEET HERE</Text><Text style={ui.h3}>{outing.meeting?.name ?? 'Choose a meeting point'}</Text></View></View>{outing.meeting && <><Text style={ui.text}>{outing.meeting.latitude.toFixed(5)}, {outing.meeting.longitude.toFixed(5)}</Text><Text style={ui.small}>Version {outing.meeting.version} · saved {time(outing.meeting.setAt)}</Text>{position && <Text style={ui.small}>{formatDistance(distance(position, outing.meeting), units)} straight-line distance. A walking route has not been calculated.</Text>}</>}<Button label={outing.meeting ? 'Change meeting point' : 'Set meeting point'} icon={MapPin} secondary disabled={ended} onPress={() => openMeeting()} /></View>
          <View style={ui.card}><View style={ui.between}><Text style={ui.h3}>Before you set off</Text><Footprints size={20} color={colors.green} /></View>{[[!!outing.route, 'GPX route imported'], [!!outing.meeting, 'Meeting point saved'], [packState(outing) === 'ready', 'Local route pack checked'], [false, 'Basemap download — provider required']].map(([ok, label]) => <View key={String(label)} style={ui.row}>{ok ? <CheckCircle2 size={18} color={colors.green} /> : <View style={styles.unchecked} />}<Text style={ui.text}>{label}</Text></View>)}<Button label="Review offline plan" secondary icon={ArrowRight} onPress={() => setTab('offline')} /></View>
          <Text style={ui.small}>Local history is removed after {time(outing.endsAt + RETENTION_MS)} when Vico next runs. You can delete it earlier in Settings.</Text>
        </> : noOuting)}
        {tab === 'group' && <><Text style={ui.eyebrow}>TRAVEL TOGETHER</Text><Text style={ui.title}>Your people.</Text><View style={ui.dark}><LockKeyhole size={34} color={colors.orange} /><Text style={{ color: 'white', fontSize: 24, fontWeight: '600' }}>Private by design.</Text><Text style={{ color: '#D5E0D4', fontSize: 15, lineHeight: 24 }}>Private group connection is being built. Your current plan stays on this device.</Text></View><View style={ui.card}><Text style={ui.h2}>Group messaging is not connected yet</Text><Text style={ui.text}>Invitations, chat and live positions will become available after the encryption and membership integrations pass their security checks.</Text><Text style={ui.small}>This build does not send messages or locations to other people.</Text></View><View style={ui.card}><Trash2 size={24} color={colors.green} /><Text style={ui.h3}>Permanent deletion is part of the design</Text><Text style={ui.text}>Chat deletion will remove app-managed history and its dedicated encryption key. Copies outside Vico remain under their owner's control.</Text><Text style={ui.small}>A deletion request to another device needs delivery and confirmation. An offline device cannot confirm immediately.</Text></View></>}
        {tab === 'context' && <><Text style={ui.eyebrow}>KNOW WHAT IS AHEAD</Text><Text style={ui.title}>Context, with evidence.</Text><Text style={ui.text}>Weather and crowd information belong with their source, place and time.</Text>
          <View style={ui.card}><View style={ui.between}><View style={ui.row}><CloudSun size={25} color={colors.green} /><Text style={ui.h2}>Weather</Text></View><Badge>FORECAST</Badge></View>
          {outing?.weather ? <><Text style={{ fontSize: 42, fontWeight: '600', color: colors.ink }}>{outing.weather.temperature === null ? 'Unavailable' : `${units === 'metric' ? Math.round(outing.weather.temperature) : Math.round(outing.weather.temperature * 9 / 5 + 32)}°${units === 'metric' ? 'C' : 'F'}`}</Text><View style={ui.row}><Detail label="Rain probability" value={outing.weather.precipitationProbability === null ? 'Unavailable' : `${outing.weather.precipitationProbability}%`} /><Detail label="Wind" value={outing.weather.wind === null ? 'Unavailable' : `${Math.round(outing.weather.wind * (units === 'metric' ? 1 : 0.621371))} ${units === 'metric' ? 'km/h' : 'mph'}`} /></View><Text style={ui.small}>Valid {time(outing.weather.validAt)} · retrieved {time(outing.weather.retrievedAt)}</Text><Text style={ui.small}>Area {outing.weather.location.latitude.toFixed(2)}, {outing.weather.location.longitude.toFixed(2)} · Open-Meteo · CC BY 4.0</Text><Badge amber={connected === false || now - outing.weather.retrievedAt > 21600000 || outing.weather.validAt < now - 3600000}>{connected === false ? 'Saved forecast · offline' : now - outing.weather.retrievedAt > 21600000 || outing.weather.validAt < now - 3600000 ? 'Older forecast · check valid time' : 'Retrieved forecast · not a measurement'}</Badge></> : <Text style={ui.text}>No forecast downloaded. Choose a location and request a forecast when you need one.</Text>}
          {usable && <><View style={ui.row}><Button style={{ flex: 1 }} label="Now" secondary={weatherTime !== 'now'} onPress={() => setWeatherTime('now')} /><Button style={{ flex: 1 }} label="Route arrival" secondary={weatherTime !== 'arrival'} disabled={!outing.route} onPress={() => setWeatherTime('arrival')} /></View>{weatherTime === 'arrival' && <Text style={ui.small}>Estimate from the route start, leaving now at {store.preferences.paceKmh} km/h. Gaps and elevation are not included in walking time.</Text>}<Button label={busy ? 'Retrieving forecast…' : 'Get area forecast'} icon={CloudSun} disabled={busy || connected === false} onPress={() => { if (!store.preferences.weatherConsent) setDialog('weather'); else void act(loadWeather); }} /></>}
          <Pressable accessibilityRole="link" onPress={() => void Linking.openURL('https://open-meteo.com/en/docs')}><Text style={[ui.small, { textDecorationLine: 'underline' }]}>Open-Meteo · data and attribution</Text></Pressable></View>
          <View style={ui.card}><View style={ui.row}><Users size={25} color={colors.green} /><Text style={ui.h2}>Crowding</Text></View><Badge amber>{coverage === 'not_checked' ? 'Choose a location first' : 'No verified crowd data for this area'}</Badge><Text style={ui.text}>{coverage === 'not_checked' ? 'Set a meeting point or import a route to check source coverage.' : 'No active source in this build covers this location. Missing data does not mean the area is quiet.'}</Text><Text style={ui.small}>Detected devices, pedestrian passages and people present are different measurements. Vico does not turn one into another.</Text></View>
          {usable && !ended && <View style={ui.card}><Text style={ui.h3}>Your own observation</Text><Text style={ui.small}>Record a local note, separate from public measurements. It expires within two hours or when the outing ends, and is not shared in this build.</Text><View style={ui.row}>{(['quiet', 'moderate', 'busy'] as const).map(level => <Button key={level} style={{ flex: 1, paddingHorizontal: 8 }} label={level[0].toUpperCase() + level.slice(1)} secondary disabled={busy} onPress={() => void act(async () => { if (outing.reports.length >= 200) throw new Error('This outing has reached its local report limit.'); const at = Date.now(); await updateOuting(o => ({ ...o, reports: [...o.reports, { id: randomUUID(), level, observedAt: at, expiresAt: Math.min(o.endsAt, at + 7200000) }] })); })} />)}</View>{outing.reports.filter(r => r.expiresAt > now).slice(-3).reverse().map(r => <Text key={r.id} style={ui.small}>Your report: {r.level} · {time(r.observedAt)} · expires {hour(r.expiresAt)}</Text>)}</View>}
          <Text style={ui.h2}>Open data source registry</Text><Text style={ui.small}>Candidate sources remain inactive until their data, coverage and reuse rights have been checked.</Text>{registry.sources.map(s => <View key={s.id} style={ui.card}><View style={ui.between}><Text style={[ui.h3, { flex: 1 }]}>{s.name}</Text><Badge amber>{s.state.toUpperCase()}</Badge></View><Text style={ui.small}>{s.unit}</Text><Text style={ui.small}>{s.limitations.join(' ')}</Text><Text style={ui.small}>{s.attribution} · {s.license}</Text><Button label="Read source documentation" secondary icon={ExternalLink} onPress={() => void Linking.openURL(s.documentation)} /></View>)}
        </>}
        {tab === 'offline' && <><Text style={ui.eyebrow}>PREPARE BEFORE YOU GO</Text><Text style={ui.title}>A plan that stays with you.</Text><Text style={ui.text}>Saved routes and meeting points remain useful when the connection does not.</Text>{usable ? <><View style={ui.card}><View style={ui.between}><RouteIcon size={30} color={colors.green} /><Badge amber={packState(outing) !== 'ready'}>{packState(outing) === 'ready' ? 'Route pack checked' : packState(outing) === 'outdated' ? 'Route pack needs updating' : 'Not checked yet'}</Badge></View><Text style={ui.h2}>{outing.title}</Text><Text style={ui.small}>{outing.route ? `${formatDistance(routeLength(outing.route), units)} · ${outing.route.segments.length} segment(s) · route v${outing.route.version}` : 'Import a GPX to save a local route pack.'}</Text><Text style={ui.small}>{outing.meeting ? `Meeting point v${outing.meeting.version} included` : 'Meeting point missing'}</Text>{outing.pack && <Text style={ui.small}>Last checked {time(outing.pack.savedAt)}</Text>}<Button label="Check and save local route pack" icon={ArrowDownToLine} disabled={!outing.route || busy || ended} onPress={() => void act(async () => { await updateOuting(o => ({ ...o, pack: { savedAt: Date.now(), routeVersion: o.route!.version, meetingVersion: o.meeting?.version ?? null } })); setNotice(Platform.OS === 'web' ? 'Route pack checked for this browser session. Native storage is required to reopen it after restart.' : 'Route and meeting point are saved in encrypted local storage. Basemap resources are not included.'); })} /><Text style={ui.small}>{storageDescription}</Text></View><View style={ui.notice}><Text style={ui.h3}>Basemap not downloaded</Text><Text style={ui.text}>The current build can show your GPX geometry without a basemap. Downloadable map areas need a provider with explicit offline rights.</Text></View><View style={ui.card}><Text style={ui.h3}>When the network goes away</Text><Text style={ui.text}>Your phone may still find its own position. New messages, other people's positions and fresh forecasts need a working connection.</Text><Text style={ui.small}>A saved weather forecast keeps its original valid time. It does not become a new forecast while offline.</Text></View></> : noOuting}</>}
      </ScrollView>}
      <View style={styles.tabs}>{tabs.map(t => <Pressable key={t.id} accessibilityRole="tab" accessibilityState={{ selected: tab === t.id }} accessibilityLabel={t.label} onPress={() => setTab(t.id)} style={styles.tab}><View style={[styles.tabIcon, tab === t.id && { backgroundColor: colors.softGreen }]}><t.icon size={21} strokeWidth={tab === t.id ? 2.5 : 1.7} color={tab === t.id ? colors.green : colors.muted} /></View><Text style={{ color: tab === t.id ? colors.green : colors.muted, fontSize: 10, fontWeight: tab === t.id ? '700' : '400' }}>{t.label}</Text></Pressable>)}</View>
    </View>
    <Modal visible={dialog !== null} animationType="slide" transparent onRequestClose={() => setDialog(null)}>
      <View style={styles.modalBackdrop}><SafeAreaView style={styles.modalCard}><View style={ui.between}><Text style={ui.h2}>{dialog === 'create' ? 'Plan an outing' : dialog === 'meeting' ? 'Meeting point' : dialog === 'delete' ? 'Delete permanently' : dialog === 'weather' ? 'Request a forecast' : 'Settings'}</Text><IconButton label="Close dialog" icon={X} onPress={() => setDialog(null)} /></View><ScrollView contentContainerStyle={{ gap: 18, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        {notice && <Text accessibilityRole="alert" style={{ color: colors.red }}>{notice}</Text>}
        {dialog === 'create' && <><Text style={ui.text}>Start with a name and an end time. This plan is private to your device.</Text><Text style={ui.h3}>Outing name</Text><TextInput accessibilityLabel="Outing name" placeholder="Sunday, a little off the beaten track" value={title} onChangeText={setTitle} maxLength={80} style={ui.input} /><Text style={ui.h3}>Ends in</Text><View style={ui.row}>{[3, 6, 12].map(h => <Button key={h} label={`${h} hours`} style={{ flex: 1 }} secondary={duration !== h} onPress={() => setDuration(h)} />)}</View><Text style={ui.small}>Local history expires 24 hours after the outing ends. Nothing is shared automatically.</Text><Button label="Create local outing" icon={Plus} disabled={busy || !title.trim()} onPress={() => void act(() => create())} /></>}
        {dialog === 'meeting' && <><Text style={ui.text}>Use coordinates from a trusted map or route. Vico will not invent a walking path to this point.</Text><TextInput accessibilityLabel="Meeting point name" value={meetingName} onChangeText={setMeetingName} maxLength={80} style={ui.input} /><TextInput accessibilityLabel="Latitude" placeholder="Latitude, e.g. 45.8310" value={lat} onChangeText={setLat} keyboardType="numbers-and-punctuation" style={ui.input} /><TextInput accessibilityLabel="Longitude" placeholder="Longitude, e.g. 10.0030" value={lon} onChangeText={setLon} keyboardType="numbers-and-punctuation" style={ui.input} /><Button label="Save meeting point" icon={Flag} disabled={busy || ended} onPress={() => void act(saveMeeting)} /></>}
        {dialog === 'weather' && <><CloudSun size={32} color={colors.green} /><Text style={ui.text}>Vico will send the selected area, rounded to two decimal places, directly to Open-Meteo. The provider also sees your network address. No group history is sent.</Text><Text style={ui.small}>This opt-in applies to forecast requests. You can turn it off in Settings. The public endpoint is for permitted non-commercial use; hosting terms must be reviewed before release.</Text><Button label="Allow weather requests and continue" disabled={busy} onPress={() => void act(async () => { await commit(s => ({ ...s, preferences: { ...s.preferences, weatherConsent: true } })); setDialog(null); await loadWeather(); })} /></>}
        {dialog === 'settings' && <><Badge>VICO 0.1 · DEVELOPMENT</Badge><Text style={ui.text}>A free mobile project built with open source tools. Repository documentation and the interface are in English.</Text><Text style={ui.h3}>Distance units</Text><View style={ui.row}>{(['metric', 'imperial'] as const).map(u => <Button key={u} label={u === 'metric' ? 'Metric' : 'Imperial'} style={{ flex: 1 }} secondary={units !== u} onPress={() => void act(() => commit(s => ({ ...s, preferences: { ...s.preferences, units: u } })))} />)}</View><Text style={ui.h3}>Walking pace · {store.preferences.paceKmh} km/h</Text><View style={ui.row}>{[3, 4, 5].map(p => <Button key={p} label={`${p} km/h`} secondary={p !== store.preferences.paceKmh} style={{ flex: 1 }} onPress={() => void act(() => commit(s => ({ ...s, preferences: { ...s.preferences, paceKmh: p } })))} />)}</View><View style={ui.between}><Text style={[ui.text, { flex: 1 }]}>Allow requests to Open-Meteo</Text><Switch accessibilityLabel="Allow requests to Open-Meteo" value={store.preferences.weatherConsent} onValueChange={v => { if (v) { setDialog('weather'); return; } void act(() => commit(s => ({ ...s, preferences: { ...s.preferences, weatherConsent: false } }))); }} /></View><View style={ui.divider} /><Text style={ui.h3}>Your data</Text><Text style={ui.small}>{storageDescription}</Text><Text style={ui.small}>Positioning is foreground only in this prototype. Chat, invitations and location sharing are not yet connected. Vico's original code is licensed under MIT; third-party components retain their own licenses.</Text><Button label="Open source notices" icon={ExternalLink} secondary onPress={() => void act(async () => { await Linking.openURL('https://github.com/fabiogiacomini/Vico/blob/main/THIRD_PARTY_NOTICES.md'); })} />{usable && <><Text style={ui.h3}>{outing.title}</Text><Text style={ui.small}>Remove this outing, its route, meeting point, reports and saved context from Vico on this device.</Text><Button label="Delete this outing permanently" icon={Trash2} danger secondary onPress={() => { setDeleteWord(''); setNotice(null); setDialog('delete'); }} /></>}</>}
        {dialog === 'delete' && <><Trash2 size={30} color={colors.red} /><Text style={ui.text}>Delete “{outing?.title}” and all of its app-managed local content? This includes its encryption key on native devices. This action cannot be undone in Vico.</Text><Text style={ui.small}>Files you exported, screenshots and copies outside Vico are not removed. This prototype has no remote participants.</Text><Text style={ui.h3}>Type DELETE to confirm</Text><TextInput accessibilityLabel="Type DELETE to confirm" autoCapitalize="characters" value={deleteWord} onChangeText={setDeleteWord} style={ui.input} /><Button label="Permanently delete" icon={Trash2} danger disabled={deleteWord !== 'DELETE' || busy} onPress={() => void act(async () => { stopLocation(); await commit(s => ({ ...s, outings: s.outings.filter(o => o.id !== selectedId) })); setSelectedId(null); setDialog(null); setTab('outings'); setNotice('The outing and its app-managed local content have been deleted.'); })} /></>}
      </ScrollView></SafeAreaView></View>
    </Modal>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  shell: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center', backgroundColor: colors.canvas, borderLeftWidth: Platform.OS === 'web' ? 1 : 0, borderRightWidth: Platform.OS === 'web' ? 1 : 0, borderColor: colors.line },
  header: { paddingHorizontal: 22, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  brand: { fontSize: 35, letterSpacing: -2, fontWeight: '800', color: colors.ink }, brandMark: { width: 36, height: 36, borderRadius: 13, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-8deg' }] },
  statusBar: { marginHorizontal: 22, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6 },
  statusText: { fontSize: 10, color: colors.muted }, hero: { fontSize: 40, fontWeight: '600', lineHeight: 45, letterSpacing: -1.6, color: colors.ink },
  darkIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#2A4C40', alignItems: 'center', justifyContent: 'center' },
  meetingIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.orange, justifyContent: 'center', alignItems: 'center' },
  mapCard: { borderRadius: 22, borderWidth: 1, borderColor: colors.line, overflow: 'hidden', backgroundColor: colors.paper },
  unchecked: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#B0BEB1' },
  tabs: { flexDirection: 'row', borderTopWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, paddingTop: 9, paddingBottom: 10 },
  tab: { flex: 1, alignItems: 'center', gap: 3, minHeight: 53 }, tabIcon: { width: 46, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: '#10291F88', justifyContent: 'flex-end' }, modalCard: { maxHeight: '90%', backgroundColor: colors.canvas, padding: 24, gap: 20, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxWidth: 760, width: '100%', alignSelf: 'center' },
});
