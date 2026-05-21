import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

const GREEN = '#0B6623';
const BG = '#FAFAFA';
const CARD = '#FFFFFF';
const TEXT = '#111111';
const SUB = '#777777';
const HINT = '#B0B0B0';
const LINE = '#F0F0F0';
const FILL = '#F5F5F5';

const CONTEXT_DATA = [
  { icon: 'thermometer-outline' as const, label: 'Temperature', val: '95\u00B0F' },
  { icon: 'water-outline' as const, label: 'Wind', val: '12 mph' },
  { icon: 'flower-outline' as const, label: 'Pollen', val: '6.2 (moderate)' },
  { icon: 'cloud-outline' as const, label: 'AQI', val: '45 (good)' },
  { icon: 'partly-sunny-outline' as const, label: 'Dust Advisory', val: 'None' },
  { icon: 'bug-outline' as const, label: 'Mosquito Risk', val: 'Low' },
];

const RECS = [
  'Stay home if symptomatic',
  'Wash hands frequently',
  'Avoid crowded indoor spaces',
  'Seek care if fever persists 48+ hours',
  'Report again if symptoms change',
];

const HISTORY = [
  { year: '2023', count: 4, max: 13 },
  { year: '2024', count: 3, max: 13 },
  { year: '2025', count: 5, max: 13 },
  { year: 'Now', count: 13, max: 13 },
];

export default function AlertDetailScreen() {
  const Section = ({ label, children }: any) => (
    <View style={{ marginTop: 24 }}>
      <Text style={{ color: HINT, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10, paddingHorizontal: 2 }}>{label}</Text>
      {children}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
          <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: FILL, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color={TEXT} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '600', color: TEXT, marginLeft: 12 }}>Alert Detail</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>

          {/* Severity */}
          <View style={{ backgroundColor: CARD, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: LINE }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#D97706' }} />
              <Text style={{ fontSize: 17, fontWeight: '600', color: TEXT }}>Significant Anomaly</Text>
            </View>
            <Text style={{ fontSize: 13, color: SUB }}>85719 · UofA Campus Area</Text>
          </View>

          {/* Stats */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            {[
              { num: '225%', label: 'above baseline' },
              { num: '3.1', label: 'z-score' },
              { num: '\u2191', label: 'accelerating' },
            ].map((s, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: CARD, borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: LINE }}>
                <Text style={{ color: TEXT, fontSize: 18, fontWeight: '700' }}>{s.num}</Text>
                <Text style={{ color: HINT, fontSize: 10, marginTop: 4 }}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* AI Explanation */}
          <Section label="AI Explanation">
            <View style={{ backgroundColor: CARD, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: LINE }}>
              <Text style={{ color: SUB, fontSize: 14, lineHeight: 22 }}>
                Respiratory reports in the UofA area increased from 4/week to 13 — a 225% spike.
                This exceeds 3.1 standard deviations above the CDC seasonal norm. Pollen and air quality
                are within normal ranges, so this spike is not explained by environmental factors.
                7 of 13 reports include professionally diagnosed influenza. Trend is accelerating.
              </Text>
            </View>
          </Section>

          {/* Environment */}
          <Section label="Environmental context">
            <View style={{ backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: LINE, overflow: 'hidden' }}>
              {CONTEXT_DATA.map((c, i) => (
                <React.Fragment key={i}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 }}>
                    <Ionicons name={c.icon} size={15} color={HINT} style={{ marginRight: 12 }} />
                    <Text style={{ fontSize: 14, color: TEXT, flex: 1 }}>{c.label}</Text>
                    <Text style={{ fontSize: 13, color: SUB }}>{c.val}</Text>
                  </View>
                  {i < CONTEXT_DATA.length - 1 && <View style={{ height: 0.5, backgroundColor: LINE, marginLeft: 43 }} />}
                </React.Fragment>
              ))}
            </View>
          </Section>

          {/* Recommendations */}
          <Section label="Recommendations">
            <View style={{ backgroundColor: CARD, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: LINE }}>
              {RECS.map((r, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 10, marginBottom: i < RECS.length - 1 ? 10 : 0 }}>
                  <Text style={{ color: GREEN, fontSize: 13, fontWeight: '600', width: 16 }}>{i + 1}.</Text>
                  <Text style={{ color: SUB, fontSize: 14, flex: 1, lineHeight: 20 }}>{r}</Text>
                </View>
              ))}
            </View>
          </Section>

          <Text style={{ color: HINT, fontSize: 11, textAlign: 'center', marginTop: 14 }}>
            Not medical advice. For emergencies call 911.
          </Text>

          {/* Historical */}
          <Section label="Historical comparison">
            <View style={{ backgroundColor: CARD, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: LINE }}>
              {HISTORY.map((h, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: i < HISTORY.length - 1 ? 10 : 0 }}>
                  <Text style={{ color: h.year === 'Now' ? GREEN : HINT, fontSize: 12, fontWeight: '600', width: 32 }}>{h.year}</Text>
                  <View style={{ flex: 1, height: 16, backgroundColor: FILL, borderRadius: 4, overflow: 'hidden' }}>
                    <View style={{ width: `${(h.count / h.max) * 100}%`, height: '100%', backgroundColor: h.year === 'Now' ? GREEN : '#D5E8D4', borderRadius: 4 }} />
                  </View>
                  <Text style={{ color: h.year === 'Now' ? GREEN : HINT, fontSize: 12, fontWeight: '600', width: 20, textAlign: 'right' }}>{h.count}</Text>
                </View>
              ))}
            </View>
          </Section>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
