import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const t = {
  bg: '#FAFAFA', card: '#FFFFFF', text: '#111', sub: '#888',
  hint: '#B0B0B0', line: '#EEEEEE', fill: '#F2F2F2',
  accent: '#0B6623', accentSoft: '#F0F7F1', accentMid: '#D5E8D4',
};
const { width, height } = Dimensions.get('window');

const FILTERS = ['All', 'People', 'Animals', 'Environment'];

const AREAS = [
  { name: 'UofA Campus', zip: '85719', count: 13, top: 'Flu A', lat: 32.248, lng: -110.950 },
  { name: 'Midtown', zip: '85712', count: 6, top: 'Stomach', lat: 32.245, lng: -110.870 },
  { name: 'West Tucson', zip: '85705', count: 5, top: 'Cough', lat: 32.260, lng: -110.995 },
  { name: 'Downtown', zip: '85701', count: 3, top: 'Fever', lat: 32.222, lng: -110.927 },
  { name: 'Green Valley', zip: '85614', count: 2, top: 'Mosquitoes', lat: 31.830, lng: -110.970 },
];

function toScreen(lat: number, lng: number) {
  const cLat = 32.22, cLng = -110.97, scale = 2800;
  return { x: width / 2 + (lng - cLng) * scale, y: height * 0.22 - (lat - cLat) * scale };
}

export default function MapScreen() {
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState<string | null>(null);
  const mapH = height * 0.45;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* Map */}
        <View style={{ height: mapH, backgroundColor: t.accentSoft, position: 'relative', overflow: 'hidden' }}>
          {/* Grid */}
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={`h${i}`} style={{ position: 'absolute', top: i * (mapH / 7), left: 0, right: 0, height: 0.5, backgroundColor: t.accentMid }} />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={`v${i}`} style={{ position: 'absolute', left: i * (width / 5), top: 0, bottom: 0, width: 0.5, backgroundColor: t.accentMid }} />
          ))}

          {/* Roads */}
          <View style={{ position: 'absolute', top: mapH * 0.38, left: 0, right: 0, height: 2, backgroundColor: t.accentMid }} />
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: width * 0.45, width: 2, backgroundColor: t.accentMid }} />

          {/* Markers */}
          {AREAS.map((a, i) => {
            const pos = toScreen(a.lat, a.lng);
            const isOn = selected === a.zip;
            const size = a.count >= 10 ? 36 : a.count >= 5 ? 28 : 20;
            return (
              <React.Fragment key={i}>
                {isOn && (
                  <View style={{
                    position: 'absolute', top: pos.y - size, left: pos.x - size,
                    width: size * 2, height: size * 2, borderRadius: size,
                    backgroundColor: t.accent + '18',
                  }} />
                )}
                <TouchableOpacity activeOpacity={0.8}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelected(isOn ? null : a.zip); }}
                  style={{
                    position: 'absolute', top: pos.y - size / 2, left: pos.x - size / 2,
                    width: size, height: size, borderRadius: size / 2,
                    backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center',
                    borderWidth: 2.5, borderColor: '#FFF',
                  }}>
                  <Text style={{ color: '#FFF', fontSize: size > 30 ? 12 : 9, fontWeight: '800' }}>{a.count}</Text>
                </TouchableOpacity>
              </React.Fragment>
            );
          })}

          {/* Callout */}
          {selected && (() => {
            const a = AREAS.find(x => x.zip === selected);
            if (!a) return null;
            const pos = toScreen(a.lat, a.lng);
            return (
              <View style={{
                position: 'absolute', top: pos.y - 52, left: Math.min(Math.max(pos.x - 70, 10), width - 160),
                backgroundColor: t.card, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, minWidth: 140,
              }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: t.text }}>{a.name}</Text>
                <Text style={{ fontSize: 11, color: t.sub, marginTop: 2 }}>{a.count} reports · {a.top}</Text>
              </View>
            );
          })()}

          {/* Header */}
          <View style={{ position: 'absolute', top: 8, left: 20 }}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: t.text, letterSpacing: -0.6 }}>Map</Text>
            <Text style={{ color: t.sub, fontSize: 12 }}>Tucson, AZ</Text>
          </View>
        </View>

        {/* Filters — same Chip style as ReportFlow */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 12, gap: 8 }}>
          {FILTERS.map(f => {
            const on = filter === f;
            return (
              <TouchableOpacity key={f} activeOpacity={0.7}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilter(f); }}
                style={{
                  paddingVertical: 10, paddingHorizontal: 16, borderRadius: 100,
                  backgroundColor: on ? t.fill : t.card,
                  borderWidth: 1.5, borderColor: on ? t.text : 'transparent',
                }}>
                <Text style={{ color: on ? t.text : t.sub, fontSize: 14, fontWeight: on ? '600' : '500' }}>{f}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Area list — same card style as ReportFlow category cards */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}>
          {AREAS.sort((a, b) => b.count - a.count).map((a, i) => {
            const isOn = selected === a.zip;
            return (
              <TouchableOpacity key={i} activeOpacity={0.7}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelected(isOn ? null : a.zip); }}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 14,
                  backgroundColor: isOn ? t.accentSoft : t.card, borderRadius: 14,
                  paddingVertical: 14, paddingHorizontal: 16, marginBottom: 8,
                  borderWidth: 1.5, borderColor: isOn ? t.accent : 'transparent',
                }}>
                <View style={{
                  width: 34, height: 34, borderRadius: 10,
                  backgroundColor: isOn ? t.accentMid : t.fill,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="location-outline" size={16} color={isOn ? t.accent : t.sub} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, color: t.text, fontWeight: '500' }}>{a.name}</Text>
                  <Text style={{ fontSize: 11, color: t.sub, marginTop: 2 }}>{a.zip} · {a.top}</Text>
                </View>
                <Text style={{ fontSize: 15, color: isOn ? t.accent : t.text, fontWeight: '700' }}>{a.count}</Text>
                <Ionicons name="chevron-forward" size={14} color={t.hint} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
