import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, useColorScheme, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { buildMapHTML, SUB_COLOR } from '@/lib/leafletMap';
import { aggregateMarkers, generateDummyPoints, getSubmittedPoints, type ReportType } from '@/lib/reports';
import { RESOURCE_GROUPS, fetchResources, type ResourceGroup } from '@/lib/resources';

// Minimal palette mirroring ReportFlow's brand colors.
const TH = {
  light: { bg: '#FAFAFA', card: '#FFFFFF', text: '#111', sub: '#888', line: '#EEEEEE', accent: '#0B6623', bar: 'dark' as const },
  dark: { bg: '#000', card: '#111', text: '#EEE', sub: '#888', line: '#1A1A1A', accent: '#4CAF50', bar: 'light' as const },
};

// Each toggle row; the Human row shows two swatches (sick + healthy).
const LAYERS: { type: ReportType; label: string; swatches: string[] }[] = [
  { type: 'human', label: 'Human (sick / healthy)', swatches: [SUB_COLOR.humanSick, SUB_COLOR.humanHealthy] },
  { type: 'animal', label: 'Animal', swatches: [SUB_COLOR.animal] },
  { type: 'environment', label: 'Environment', swatches: [SUB_COLOR.environment] },
];

export default function MapScreen() {
  const scheme = useColorScheme();
  const t = scheme === 'dark' ? TH.dark : TH.light;

  const webRef = useRef<WebView>(null);
  const [visible, setVisible] = useState<Record<ReportType, boolean>>({
    human: true,
    animal: true,
    environment: true,
  });

  // Resources panel: which tab is shown, which groups are on, and which are loading.
  const [panelTab, setPanelTab] = useState<'reports' | 'resources'>('reports');
  const [resourceOn, setResourceOn] = useState<Record<ResourceGroup, boolean>>({
    coolingCenters: false,
    hydrationStations: false,
    respiteCenters: false,
  });
  const [loadingRes, setLoadingRes] = useState<Partial<Record<ResourceGroup, boolean>>>({});
  const loadedRef = useRef<Set<ResourceGroup>>(new Set()); // groups already fetched this session

  const html = useMemo(() => buildMapHTML(), []);

  const send = useCallback((msg: object) => {
    const raw = JSON.stringify(msg);
    webRef.current?.injectJavaScript(`window.handleMessage(${JSON.stringify(raw)}); true;`);
  }, []);

  // The WebView posts { kind: 'READY' } once Leaflet is initialized.
  const onMessage = useCallback(
    (e: { nativeEvent: { data: string } }) => {
      try {
        const msg = JSON.parse(e.nativeEvent.data);
        if (msg.kind === 'READY') {
          const points = [...generateDummyPoints(), ...getSubmittedPoints()];
          send({ kind: 'SET_DATA', points, markers: aggregateMarkers(points) });
        }
      } catch {}
    },
    [send]
  );

  const toggle = useCallback(
    (type: ReportType) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setVisible((prev) => {
        const on = !prev[type];
        send({ kind: 'TOGGLE', layer: type, on });
        return { ...prev, [type]: on };
      });
    },
    [send]
  );

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
        // Heatmap rendering benefits from hardware acceleration on Android.
        androidLayerType="hardware"
      />

      {/* Title chip — replaces the back button, since this is now a tab. */}
      <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }} pointerEvents="box-none">
        <View
          style={{
            alignSelf: 'flex-start', marginTop: 8, marginLeft: 16,
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
            backgroundColor: t.card,
            shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3,
          }}>
          <Ionicons name="map" size={16} color={t.accent} />
          <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }}>Report Heatmap</Text>
        </View>
      </SafeAreaView>

      {/* Layer panel. Plain absolute View (not bottom SafeAreaView) so it sits
          just above the tab bar without double-counting the home-indicator inset. */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} pointerEvents="box-none">
        <View style={{
          margin: 16, padding: 8, borderRadius: 16, backgroundColor: t.card,
          shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 4,
        }}>
          {/* Segmented [ Report Layers | Resources ] switcher. */}
          <View style={{ flexDirection: 'row', backgroundColor: t.line, borderRadius: 10, padding: 3, marginBottom: 4 }}>
            {([['reports', 'Report Layers'], ['resources', 'Resources']] as const).map(([key, label]) => {
              const active = panelTab === key;
              return (
                <TouchableOpacity
                  key={key}
                  activeOpacity={0.8}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPanelTab(key); }}
                  style={{
                    flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
                    backgroundColor: active ? t.card : 'transparent',
                    shadowColor: '#000', shadowOpacity: active ? 0.1 : 0, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: active ? 2 : 0,
                  }}>
                  <Text style={{ color: active ? t.accent : t.sub, fontSize: 13, fontWeight: active ? '700' : '500' }}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {panelTab === 'reports'
            ? LAYERS.map(({ type, label, swatches }, i) => {
                const on = visible[type];
                return (
                  <TouchableOpacity
                    key={type}
                    activeOpacity={0.7}
                    onPress={() => toggle(type)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 12,
                      paddingVertical: 12, paddingHorizontal: 10,
                      borderTopWidth: i === 0 ? 0 : 1, borderTopColor: t.line,
                    }}>
                    <View style={{ flexDirection: 'row', gap: 3, width: 32 }}>
                      {swatches.map((c) => (
                        <View key={c} style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: c }} />
                      ))}
                    </View>
                    <Text style={{ flex: 1, color: t.text, fontSize: 15, fontWeight: '500' }}>{label}</Text>
                    <View style={{
                      width: 22, height: 22, borderRadius: 6, borderWidth: 1.5,
                      borderColor: on ? t.accent : t.sub,
                      backgroundColor: on ? t.accent : 'transparent',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      {on && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                  </TouchableOpacity>
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
                      flexDirection: 'row', alignItems: 'center', gap: 12,
                      paddingVertical: 12, paddingHorizontal: 10,
                      borderTopWidth: i === 0 ? 0 : 1, borderTopColor: t.line,
                    }}>
                    <View style={{
                      width: 22, height: 22, borderRadius: 6, backgroundColor: color,
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Text style={{ fontSize: 12 }}>{glyph}</Text>
                    </View>
                    <Text style={{ flex: 1, color: t.text, fontSize: 15, fontWeight: '500' }}>{label}</Text>
                    {loading ? (
                      <ActivityIndicator size="small" color={t.accent} style={{ width: 22, height: 22 }} />
                    ) : (
                      <View style={{
                        width: 22, height: 22, borderRadius: 6, borderWidth: 1.5,
                        borderColor: on ? t.accent : t.sub,
                        backgroundColor: on ? t.accent : 'transparent',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        {on && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
        </View>
      </View>
    </View>
  );
}
