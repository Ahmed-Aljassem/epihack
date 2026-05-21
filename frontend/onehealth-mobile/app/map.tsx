import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { buildMapHTML, SUB_COLOR } from '@/lib/leafletMap';
import { aggregateMarkers, generateDummyPoints, getSubmittedPoints, type ReportType } from '@/lib/reports';

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
  const router = useRouter();
  const scheme = useColorScheme();
  const t = scheme === 'dark' ? TH.dark : TH.light;

  const webRef = useRef<WebView>(null);
  const [visible, setVisible] = useState<Record<ReportType, boolean>>({
    human: true,
    animal: true,
    environment: true,
  });

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

      <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }} pointerEvents="box-none">
        {/* Back button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
          style={{
            marginTop: 8, marginLeft: 16, width: 40, height: 40, borderRadius: 20,
            backgroundColor: t.card, alignItems: 'center', justifyContent: 'center',
            shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3,
          }}>
          <Ionicons name="chevron-back" size={22} color={t.text} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Layer panel */}
      <SafeAreaView style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} pointerEvents="box-none">
        <View style={{
          margin: 16, padding: 8, borderRadius: 16, backgroundColor: t.card,
          shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 4,
        }}>
          <Text style={{ color: t.sub, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 10, marginTop: 6, marginBottom: 4 }}>
            Report Layers
          </Text>
          {LAYERS.map(({ type, label, swatches }, i) => {
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
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}
