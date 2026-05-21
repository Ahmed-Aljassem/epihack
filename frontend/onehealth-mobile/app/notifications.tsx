import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

const t = {
  bg: '#FAFAFA', card: '#FFFFFF', text: '#111', sub: '#888',
  hint: '#B0B0B0', fill: '#F2F2F2', accent: '#0B6623',
  accentSoft: '#F0F7F1', accentMid: '#D5E8D4',
};

const NOTIFS = [
  { icon: 'warning-outline' as const, title: 'Respiratory activity elevated in 85719', body: '225% above seasonal baseline', time: '3 hours ago', link: true },
  { icon: 'checkmark-circle-outline' as const, title: 'Report received', body: 'Your report was submitted. Thank you.', time: 'Yesterday' },
  { icon: 'bar-chart-outline' as const, title: 'Weekly health digest', body: '34 reports in your area. No anomalies.', time: '3 days ago' },
  { icon: 'paw-outline' as const, title: 'Animal sentinel alert', body: 'Dead bird reports elevated near Rillito Creek', time: '5 days ago' },
  { icon: 'leaf-outline' as const, title: 'Valley Fever watch', body: 'Dust event May 16. Watch for symptoms through June 5.', time: '6 days ago' },
];

export default function NotificationsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 }}>
          <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
            style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: t.fill, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color={t.text} />
          </TouchableOpacity>
          <Text style={{ color: t.text, fontSize: 28, fontFamily: 'Manrope_700Bold', letterSpacing: -0.6, marginLeft: 12 }}>Notifications</Text>
        </View>

        <FlatList
          data={NOTIFS} keyExtractor={(_, i) => String(i)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.7}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); if (item.link) router.push('/alert-detail'); }}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 14,
                backgroundColor: t.card, borderRadius: 14,
                paddingVertical: 14, paddingHorizontal: 16, marginBottom: 8,
              }}>
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: t.fill, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={item.icon} size={16} color={t.sub} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: t.text, fontFamily: 'Manrope_500Medium' }}>{item.title}</Text>
                <Text style={{ fontFamily: 'Manrope_400Regular',  fontSize: 12, color: t.sub, marginTop: 2 }}>{item.body}</Text>
                <Text style={{ fontFamily: 'Manrope_400Regular',  fontSize: 11, color: t.hint, marginTop: 4 }}>{item.time}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </View>
  );
}
