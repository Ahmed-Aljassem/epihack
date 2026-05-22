import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';

import { useFocusEffect } from 'expo-router';

import { buildMapHTML, SUB_COLOR, type ToggleKey } from '@/lib/leafletMap';
import { aggregateMarkers, generateDummyPoints, getSubmittedPoints, getLatestReport, getZipCentroid } from '@/lib/reports';
import { RESOURCE_GROUPS, fetchResources, type ResourceGroup } from '@/lib/resources';
import { SYMPTOM_LABELS, SYMPTOM_COLORS, type Symptom } from '@/lib/reports';


// Centered on when GPS is denied/unavailable — ZIP 85721 (University of
// Arizona, Tucson). The opening animation zooms in to this point. [lat, lng].
const FALLBACK_CENTER: [number, number] = [32.2290, -110.9508];

// Persists for the app session (resets on restart) so the zoom intro plays
// only on the first map open of a session.
let introPlayed = false;

// LayoutAnimation needs an explicit opt-in on Android for the panel collapse.
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Minimal palette mirroring ReportFlow's brand colors.
const TH = {
  light: { bg: '#FAFAFA', card: '#FFFFFF', text: '#111', sub: '#888', line: '#EEEEEE', accent: '#0B6623', bar: 'dark' as const },
  dark: { bg: '#000', card: '#111', text: '#EEE', sub: '#888', line: '#1A1A1A', accent: '#4CAF50', bar: 'light' as const },
};

// Each toggle row maps 1:1 to a heat sub-layer.
const LAYERS: { type: ToggleKey; label: string; swatches: string[] }[] = [
  { type: 'humanSick', label: 'Human (sick)', swatches: [SUB_COLOR.humanSick] },
  { type: 'humanHealthy', label: 'Human (healthy)', swatches: [SUB_COLOR.humanHealthy] },
  { type: 'animal', label: 'Animal', swatches: [SUB_COLOR.animal] },
  { type: 'environment', label: 'Environment', swatches: [SUB_COLOR.environment] },
];

export default function MapScreen() {
  // The map overlay (title chip, search bar, layer panel) is always light/white
  // — it sits over a light OSM map, so a dark theme would clash.
  const t = TH.light;

  const webRef = useRef<WebView>(null);
  const [visible, setVisible] = useState<Record<ToggleKey, boolean>>({
    humanSick: true,
    humanHealthy: true,
    animal: true,
    environment: true,
  });
const [symptomsOpen, setSymptomsOpen] = useState(false);
const [selectedSymptoms, setSelectedSymptoms] = useState<Set<Symptom>>(new Set());

  // Resources panel: which tab is shown, which groups are on, and which are loading.
  const [panelTab, setPanelTab] = useState<'reports' | 'resources'>('reports');
  const [resourceOn, setResourceOn] = useState<Record<ResourceGroup, boolean>>({
    coolingCenters: false,
    hydrationStations: false,
    respiteCenters: false,
  });
  const [loadingRes, setLoadingRes] = useState<Partial<Record<ResourceGroup, boolean>>>({});
  const loadedRef = useRef<Set<ResourceGroup>>(new Set()); // groups already fetched this session
  const [panelOpen, setPanelOpen] = useState(true); // bottom layers/resources panel expanded?
  const [search, setSearch] = useState(''); // ZIP search box

  const togglePanel = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPanelOpen((o) => !o);
  }, []);

  const html = useMemo(() => buildMapHTML(), []);
  const readyRef = useRef(false); // becomes true once the WebView reports READY
  const lastSeqRef = useRef(0);   // seq of the latest report we've already flown to
  const initSentRef = useRef(false);          // INIT_VIEW sent once per mount
  const coordsRef = useRef<[number, number] | null>(null); // resolved GPS, or null
  const [locResolved, setLocResolved] = useState(false);   // GPS attempt finished

  // Generate the AZ dummy backdrop once so re-pushing data (on focus) doesn't
  // reshuffle the heatmap — only the submitted points change between pushes.
  const dummyPoints = useMemo(() => generateDummyPoints(), []);

  const send = useCallback((msg: object) => {
    const raw = JSON.stringify(msg);
    webRef.current?.injectJavaScript(`window.handleMessage(${JSON.stringify(raw)}); true;`);
  }, []);

  // Zoom + filter the map to a ZIP (centroid resolved from the table). Takes the
  // value directly so it can run from onChangeText without waiting on state.
  const doSearch = useCallback((raw: string) => {
    const zip = raw.trim();
    if (!zip.length) { send({ kind: 'SEARCH_ZIP', zip: null, center: null }); return; }
    send({ kind: 'SEARCH_ZIP', zip, center: getZipCentroid(zip) });
  }, [send]);

  // Auto-search as soon as a full 5-digit ZIP is entered (the number-pad has no
  // return key, so we don't rely on submit), and reset when the box is cleared.
  const onSearchChange = useCallback((v: string) => {
    setSearch(v);
    const z = v.trim();
    if (z.length === 5) doSearch(z);
    else if (z.length === 0) doSearch('');
  }, [doSearch]);

  const clearSearch = useCallback(() => {
    setSearch('');
    send({ kind: 'SEARCH_ZIP', zip: null, center: null });
  }, [send]);

  // Push current data (dummy + live submitted reports) and the latest-report
  // marker into the map. Safe to call repeatedly once the WebView is ready.
  const pushData = useCallback(() => {
    const points = [...dummyPoints, ...getSubmittedPoints()];
    send({ kind: 'SET_DATA', points, markers: aggregateMarkers(points) });
    // Fly to the report only if it's one we haven't centered on yet.
    const latest = getLatestReport();
    const focus = !!latest && latest.seq !== lastSeqRef.current;
    if (latest) lastSeqRef.current = latest.seq;
    send({ kind: 'SET_LATEST', point: latest, focus });
  }, [dummyPoints, send]);

  // Resolve the user's location once on mount: try GPS, fall back to null
  // (denied/error) so maybeInit can use FALLBACK_CENTER.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!cancelled && status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({});
          coordsRef.current = [pos.coords.latitude, pos.coords.longitude];
        }
      } catch {
        // ignore — fall back below
      } finally {
        if (!cancelled) setLocResolved(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Center the map once both the WebView is ready and the GPS attempt is done.
  // A freshly-submitted report's fly-to (SET_LATEST) takes precedence over the
  // intro, so skip INIT_VIEW entirely when there's a latest report.
  const maybeInit = useCallback(() => {
    if (initSentRef.current || !readyRef.current || !locResolved) return;
    initSentRef.current = true;
    if (getLatestReport()) return; // report fly-to will handle the view
    const center = coordsRef.current ?? FALLBACK_CENTER;
    const intro = !introPlayed;
    introPlayed = true;
    send({ kind: 'INIT_VIEW', center, intro });
  }, [locResolved, send]);

  // Fire maybeInit when the GPS attempt completes after READY.
  useEffect(() => { maybeInit(); }, [maybeInit]);

  // The WebView posts { kind: 'READY' } once Leaflet is initialized.
  const onMessage = useCallback(
    (e: { nativeEvent: { data: string } }) => {
      try {
        const msg = JSON.parse(e.nativeEvent.data);
        if (msg.kind === 'READY') {
          readyRef.current = true;
          pushData();
          maybeInit();
        }
      } catch {}
    },
    [pushData, maybeInit]
  );

  // Re-push whenever the map tab regains focus, so reports submitted elsewhere
  // (the WebView stays mounted, so READY won't fire again) show up live.
  useFocusEffect(
    useCallback(() => {
      if (readyRef.current) pushData();
    }, [pushData])
  );

  const toggle = useCallback(
    (type: ToggleKey) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setVisible((prev) => {
        const on = !prev[type];
        send({ kind: 'TOGGLE', layer: type, on });
        return { ...prev, [type]: on };
      });
    },
    [send]
  );

  const toggleSymptom = useCallback((symptom: Symptom) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  setSelectedSymptoms(prev => {
    const next = new Set(prev);
    if (next.has(symptom)) next.delete(symptom);
    else next.add(symptom);
    const symptoms = next.size > 0 ? Array.from(next) : null;
    send({
      kind: 'SET_SYMPTOM_FILTER',
      symptoms,
      colors: SYMPTOM_COLORS,
    });
    return next;
  });
}, [send]);

  // Toggle a resource group. On first enable, lazily fetch its locations
  // (with bundled fallback) and push them to the WebView before showing.
  const toggleResource = useCallback(
    async (group: ResourceGroup) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const on = !resourceOn[group];
      setResourceOn((prev) => ({ ...prev, [group]: on }));

      if (on && !loadedRef.current.has(group)) {
        setLoadingRes((prev) => ({ ...prev, [group]: true }));
        try {
          const points = await fetchResources(group);
          loadedRef.current.add(group);
          send({ kind: 'SET_RESOURCES', group, points });
        } finally {
          setLoadingRes((prev) => ({ ...prev, [group]: false }));
        }
      }
      send({ kind: 'TOGGLE_RESOURCE', group, on });
    },
    [resourceOn, send]
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style={t.bar} />

      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={onMessage}
        style={{ flex: 1, backgroundColor: t.bg }}
        androidLayerType="hardware"
      />

      <SafeAreaView
        style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
        pointerEvents="box-none"
      >
        <View
          style={{
            alignSelf: 'flex-start',
            marginTop: 8,
            marginLeft: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: 20,
            backgroundColor: t.card,
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
          }}
        >
          <Ionicons name="map" size={16} color={t.accent} />
          <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }}>
            Report Heatmap
          </Text>
        </View>

        {/* Search bar — pinned at the top. Tap the icon (or submit) to fly to +
            filter the map to a ZIP or a place / tribal-district name. */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginHorizontal: 16,
            marginTop: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: t.card,
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 4,
          }}
        >
          <TouchableOpacity onPress={() => doSearch(search)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="search" size={16} color={t.sub} />
          </TouchableOpacity>
          <TextInput
            value={search}
            onChangeText={onSearchChange}
            onSubmitEditing={() => doSearch(search)}
            placeholder="Search ZIP code"
            placeholderTextColor={t.sub}
            keyboardType="number-pad"
            returnKeyType="search"
            maxLength={5}
            style={{ flex: 1, color: t.text, fontSize: 15, padding: 0 }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={t.sub} />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} pointerEvents="box-none">
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 16,
            padding: 8,
            borderRadius: 16,
            backgroundColor: t.card,
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 3 },
            elevation: 4,
          }}
        >
          {/* Grab handle — tap to collapse/expand the whole panel. */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={togglePanel}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingTop: 2,
              paddingBottom: panelOpen ? 6 : 2,
            }}
          >
            {!panelOpen && (
              <Text style={{ color: t.sub, fontSize: 13, fontWeight: '600' }}>Layers & Resources</Text>
            )}
            <Ionicons name={panelOpen ? 'chevron-down' : 'chevron-up'} size={16} color={t.sub} />
          </TouchableOpacity>

          {panelOpen && (
          <>
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: t.line,
              borderRadius: 10,
              padding: 3,
              marginBottom: 4,
            }}
          >
            {([
              ['reports', 'Report Layers'],
              ['resources', 'Resources'],
            ] as const).map(([key, label]) => {
              const active = panelTab === key;
              return (
                <TouchableOpacity
                  key={key}
                  activeOpacity={0.8}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPanelTab(key); send({ kind: 'SET_VIEW', view: key }); }}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 8,
                    alignItems: 'center',
                    backgroundColor: active ? t.card : 'transparent',
                    shadowColor: '#000',
                    shadowOpacity: active ? 0.1 : 0,
                    shadowRadius: 3,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: active ? 2 : 0,
                  }}
                >
                  <Text
                    style={{
                      color: active ? t.accent : t.sub,
                      fontSize: 13,
                      fontWeight: active ? '700' : '500',
                    }}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {panelTab === 'reports'
            ? LAYERS.map(({ type, label, swatches }, i) => {
                const on = visible[type];

                return (
                  <View key={type}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => toggle(type)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        paddingVertical: 12,
                        paddingHorizontal: 10,
                        borderTopWidth: i === 0 ? 0 : 1,
                        borderTopColor: t.line,
                      }}
                    >
                      <View style={{ flexDirection: 'row', gap: 3, width: 32 }}>
                        {swatches.map((c) => (
                          <View
                            key={c}
                            style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: c }}
                          />
                        ))}
                      </View>

                      <Text style={{ flex: 1, color: t.text, fontSize: 15, fontWeight: '500' }}>
                        {label}
                      </Text>

                      {type === 'humanSick' && (
                        <TouchableOpacity
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSymptomsOpen((o) => !o);
                          }}
                          style={{ padding: 4 }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons
                            name={symptomsOpen ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color={t.sub}
                          />
                        </TouchableOpacity>
                      )}

                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          borderWidth: 1.5,
                          borderColor: on ? t.accent : t.sub,
                          backgroundColor: on ? t.accent : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {on && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                    </TouchableOpacity>

                    {type === 'humanSick' && symptomsOpen && (
                      <View style={{ borderTopWidth: 1, borderTopColor: t.line, paddingBottom: 4 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                          }}
                        >
                          <Text style={{ fontSize: 12, color: t.sub }}>
                            {selectedSymptoms.size === 0
                              ? 'None selected — showing all sick reports'
                              : `${selectedSymptoms.size} symptom${selectedSymptoms.size > 1 ? 's' : ''} selected`}
                          </Text>

                          {selectedSymptoms.size > 0 && (
                            <TouchableOpacity
                              onPress={() => {
                                setSelectedSymptoms(new Set());
                                send({
                                  kind: 'SET_SYMPTOM_FILTER',
                                  symptoms: null,
                                  colors: SYMPTOM_COLORS,
                                });
                              }}
                            >
                              <Text style={{ fontSize: 12, color: t.accent }}>Clear all</Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                          {(Object.keys(SYMPTOM_LABELS) as Symptom[]).map((symptom) => {
                            const checked = selectedSymptoms.has(symptom);
                            const color = SYMPTOM_COLORS[symptom];

                            return (
                              <TouchableOpacity
                                key={symptom}
                                activeOpacity={0.7}
                                onPress={() => toggleSymptom(symptom)}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 10,
                                  paddingVertical: 9,
                                  paddingHorizontal: 10,
                                }}
                              >
                                <View
                                  style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: 5,
                                    backgroundColor: color,
                                  }}
                                />
                                <Text style={{ flex: 1, fontSize: 13, color: t.text }}>
                                  {SYMPTOM_LABELS[symptom]}
                                </Text>
                                <View
                                  style={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: 4,
                                    borderWidth: 1.5,
                                    borderColor: checked ? color : t.sub,
                                    backgroundColor: checked ? color : 'transparent',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  {checked && <Ionicons name="checkmark" size={11} color="#fff" />}
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                );
              })
            : (Object.keys(RESOURCE_GROUPS) as ResourceGroup[]).map((group, i) => {
                const { label, color, glyph } = RESOURCE_GROUPS[group];
                const on = resourceOn[group];
                const loading = loadingRes[group];

                return (
                  <TouchableOpacity
                    key={group}
                    activeOpacity={0.7}
                    disabled={loading}
                    onPress={() => toggleResource(group)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingVertical: 12,
                      paddingHorizontal: 10,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: t.line,
                    }}
                  >
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        backgroundColor: color,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 12 }}>{glyph}</Text>
                    </View>

                    <Text style={{ flex: 1, color: t.text, fontSize: 15, fontWeight: '500' }}>
                      {label}
                    </Text>

                    {loading ? (
                      <ActivityIndicator size="small" color={t.accent} style={{ width: 22, height: 22 }} />
                    ) : (
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          borderWidth: 1.5,
                          borderColor: on ? t.accent : t.sub,
                          backgroundColor: on ? t.accent : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {on && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
          </>
          )}
        </View>
      </View>
    </View>
  );
}