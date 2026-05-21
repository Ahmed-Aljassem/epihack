import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, Animated, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { getReportStats, getUserZip, setFirstReportComplete, incrementReportCount } from '@/utils/storage';
import ReportFlow from '@/components/flows/ReportFlow';

// ─── Exact same palette from ReportFlow ──────────────────────
const t = {
  bg: '#FAFAFA', card: '#FFFFFF', text: '#111', sub: '#888',
  hint: '#B0B0B0', line: '#EEEEEE', fill: '#F2F2F2',
  accent: '#0B6623', accentSoft: '#F0F7F1', accentMid: '#D5E8D4',
};

const DISEASES = [
  { name: 'Influenza', status: 'Normal', icon: 'fitness-outline' as const },
  { name: 'Stomach Bug', status: 'Elevated', icon: 'medical-outline' as const, warn: true },
  { name: 'COVID-19', status: 'Low', icon: 'shield-checkmark-outline' as const },
  { name: 'Valley Fever', status: 'Watch', icon: 'alert-circle-outline' as const, alert: true },
  { name: 'West Nile', status: 'No signals', icon: 'bug-outline' as const },
];

const VITALS = [
  { icon: 'thermometer-outline' as const, label: 'Temperature', value: '95°F' },
  { icon: 'cloud-outline' as const, label: 'Air Quality', value: 'Good (42)' },
  { icon: 'flower-outline' as const, label: 'Pollen', value: '6.2 mod' },
  { icon: 'sunny-outline' as const, label: 'UV Index', value: '8 high' },
  { icon: 'water-outline' as const, label: 'Humidity', value: '18%' },
];

const RECENT = [
  { icon: 'person-outline' as const, title: 'Cough, Fever', sub: 'Moderate · 85719', time: '2h ago' },
  { icon: 'paw-outline' as const, title: 'Dead birds spotted', sub: 'Rillito Creek', time: '5h ago' },
  { icon: 'leaf-outline' as const, title: 'Mosquito surge', sub: 'Green Valley', time: '1d ago' },
];

export default function HomeScreen() {
  const [showSuccess, setShowSuccess] = useState(false);
  const successAnim = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);
  const [zip, setZip] = useState('85719');
  const [stats, setStats] = useState({ count: 0, streak: 0 });

  // App Open Flow States
  const [showForm, setShowForm] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  
  // ─── Splash Animations ───
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(12)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;
  const pulse1 = useRef(new Animated.Value(0.5)).current;
  const pulse2 = useRef(new Animated.Value(0.3)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  const load = useCallback(async () => {
    setZip(await getUserZip());
    setStats(await getReportStats());
  }, []);

  useEffect(() => { 
    load(); 
    
    // Splash Screen Sequence
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse1, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse1, { toValue: 0.5, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse2, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulse2, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
    Animated.parallel([
      Animated.timing(textOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(textSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.delay(900),
      Animated.timing(tagOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.delay(2600),
      Animated.timing(screenOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => setShowSplash(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await load(); setRefreshing(false);
  }, []);

  const showSuccessToast = () => {
    setShowSuccess(true);
    Animated.sequence([
      Animated.spring(successAnim, { toValue: 1, useNativeDriver: true, friction: 8 }),
      Animated.delay(2500),
      Animated.timing(successAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setShowSuccess(false));
  };



  // ─── Shared helpers (matches ReportFlow exactly) ───────────
  const SLabel = ({ children, icon }: { children: string; icon?: keyof typeof Ionicons.glyphMap }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 28, marginBottom: 10 }}>
      {icon && <Ionicons name={icon} size={13} color={t.sub} />}
      <Text style={{ color: t.sub, fontSize: 12, fontFamily: 'Manrope_700Bold', textTransform: 'uppercase', letterSpacing: 1.5 }}>{children}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {/* ─── App Open Flow (Splash -> Form) ─── */}
      <Modal visible={showForm} animationType="fade" presentationStyle="fullScreen">
        <View style={{ flex: 1, backgroundColor: t.bg }}>
          <ReportFlow onSubmitComplete={() => {
            setShowForm(false);
            setTimeout(() => showSuccessToast(), 400);
            load(); // Reload dashboard stats
          }} />
          
          {showSplash && (
            <Animated.View style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: '#FAFAFA', alignItems: 'center', justifyContent: 'center',
              opacity: screenOpacity, zIndex: 999
            }}>
              <StatusBar style="dark" backgroundColor="transparent" translucent={true} />
              <Animated.View style={{
                position: 'absolute', width: 140, height: 140, borderRadius: 70,
                backgroundColor: '#E8F5E9', opacity: pulse2, transform: [{ scale: pulse2 }],
              }} />
              <Animated.View style={{
                position: 'absolute', width: 100, height: 100, borderRadius: 50,
                backgroundColor: '#E8F5E9', opacity: pulse1, transform: [{ scale: pulse1 }],
              }} />
              <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textSlide }] }}>
                <Text style={{ fontFamily: 'Manrope_400Regular',  fontSize: 48, letterSpacing: -1.5, color: '#111' }}>
                  <Text style={{ color: '#B0B0B0', fontFamily: 'Manrope_300Light' }}>One</Text>
                  <Text style={{ fontFamily: 'Manrope_800ExtraBold', color: '#0B6623' }}>Health</Text>
                </Text>
              </Animated.View>
              <Animated.Text style={{ fontFamily: 'Manrope_400Regular',  opacity: tagOpacity, color: '#888', marginTop: 8, fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Arizona
              </Animated.Text>
            </Animated.View>
          )}
        </View>
      </Modal>

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StatusBar style="dark" backgroundColor="transparent" translucent={true} />

        <ScrollView showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />}>

          {/* ─── Header ──────────────────────────────────────── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 }}>
            <View>
              <Text style={{ fontFamily: 'Manrope_400Regular',  fontSize: 32, letterSpacing: -1.5 }}>
                <Text style={{ color: t.hint, fontFamily: 'Manrope_300Light' }}>One</Text>
                <Text style={{ color: t.accent, fontFamily: 'Manrope_800ExtraBold' }}>Health</Text>
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Ionicons name="location-outline" size={12} color={t.sub} />
                <Text style={{ fontFamily: 'Manrope_400Regular',  color: t.sub, fontSize: 13 }}>Tucson, AZ · {zip}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF3E0', paddingHorizontal: 10, height: 38, borderRadius: 11, borderWidth: 1.5, borderColor: '#FFE0B2' }}>
                <Ionicons name="flame" size={16} color="#F57C00" />
                <Text style={{ fontSize: 14, fontFamily: 'Manrope_800ExtraBold', color: '#F57C00' }}>3</Text>
              </View>

              <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/notifications'); }}
                style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: t.fill, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="notifications-outline" size={18} color={t.sub} />
                <View style={{ position: 'absolute', top: 8, right: 9, width: 6, height: 6, borderRadius: 3, backgroundColor: '#E53935' }} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ─── Environment Vitals ──────────────────────────── */}
          <View style={{ paddingHorizontal: 24 }}>
            <SLabel icon="leaf-outline">Environment</SLabel>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}>
            {VITALS.map((v, i) => (
              <View key={i} style={{
                backgroundColor: t.card, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14,
                flexDirection: 'row', alignItems: 'center', gap: 10,
              }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: t.fill, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={v.icon} size={16} color={t.sub} />
                </View>
                <View>
                  <Text style={{ color: t.text, fontSize: 15, fontFamily: 'Manrope_700Bold', letterSpacing: -0.3 }}>{v.value}</Text>
                  <Text style={{ color: t.hint, fontSize: 11, fontFamily: 'Manrope_500Medium', marginTop: 1 }}>{v.label}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* ─── Health Status ────────────────────────────────── */}
          <View style={{ paddingHorizontal: 24 }}>
            <SLabel icon="pulse-outline">Health near you</SLabel>
            {DISEASES.map((d, i) => {
              const on = d.alert;
              return (
                <TouchableOpacity key={i} activeOpacity={0.7}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/map'); }}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 14,
                    backgroundColor: on ? t.accentSoft : t.card, borderRadius: 14,
                    paddingVertical: 14, paddingHorizontal: 16, marginBottom: 8,
                    borderWidth: 1.5, borderColor: on ? t.accent : 'transparent',
                  }}>
                  <View style={{
                    width: 34, height: 34, borderRadius: 10,
                    backgroundColor: on ? t.accentMid : t.fill,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons name={d.icon} size={16} color={on ? t.accent : t.sub} />
                  </View>
                  <Text style={{ flex: 1, color: t.text, fontSize: 16, fontFamily: 'Manrope_600SemiBold', letterSpacing: -0.3 }}>{d.name}</Text>
                  <Text style={{ color: d.alert ? t.accent : d.warn ? '#C07900' : t.hint, fontSize: 14, fontFamily: d.alert || d.warn ? 'Manrope_700Bold' : 'Manrope_500Medium' }}>{d.status}</Text>
                </TouchableOpacity>
              );
            })}
            <Text style={{ fontFamily: 'Manrope_400Regular',  color: t.hint, fontSize: 11, marginTop: 4, paddingHorizontal: 4 }}>Based on 47 reports this week</Text>
          </View>

          {/* ─── Alert ────────────────────────────────────────── */}
          <View style={{ paddingHorizontal: 24 }}>
            <SLabel icon="warning-outline">Alert</SLabel>
            <TouchableOpacity activeOpacity={0.7}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/alert-detail'); }}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 14,
                backgroundColor: t.card, borderRadius: 14,
                paddingVertical: 16, paddingHorizontal: 16,
              }}>
              <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="warning" size={18} color="#E65100" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, color: t.text, fontFamily: 'Manrope_700Bold', letterSpacing: -0.4 }}>Respiratory anomaly in {zip}</Text>
                <Text style={{ fontSize: 13, color: '#E65100', fontFamily: 'Manrope_500Medium', marginTop: 2 }}>225% above baseline · Accelerating</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={t.hint} />
            </TouchableOpacity>
          </View>

          {/* ─── Forecast ────────────────────────────────────── */}
          <View style={{ paddingHorizontal: 24 }}>
            <SLabel icon="analytics-outline">Forecast</SLabel>
            <View style={{ backgroundColor: t.card, borderRadius: 14, padding: 16 }}>
              <Text style={{ color: t.sub, fontSize: 15, lineHeight: 22, fontFamily: 'Manrope_400Regular', letterSpacing: -0.2 }}>
                Stomach illness historically rises during finals week. Last year saw a 180% increase.
              </Text>
              <Text style={{ color: t.accent, fontSize: 14, fontFamily: 'Manrope_600SemiBold', marginTop: 8 }}>Elevated risk — next 5 days</Text>
            </View>
          </View>

          {/* ─── Quick Report ────────────────────────────────── */}
          <View style={{ paddingHorizontal: 24 }}>
            <SLabel icon="create-outline">Quick report</SLabel>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[
                { icon: 'camera-outline' as const, label: 'Photo', onPress: async () => {
                  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6 });
                  if (!r.canceled) router.push('/report-modal');
                }},
                { icon: 'mic-outline' as const, label: 'Voice', onPress: () => Alert.alert('Coming Soon', 'Voice reporting is coming soon.') },
                { icon: 'people-outline' as const, label: 'Family', onPress: () => router.push('/report-modal') },
              ].map((a, i) => (
                <TouchableOpacity key={i} activeOpacity={0.7}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); a.onPress(); }}
                  style={{
                    flex: 1, backgroundColor: t.card, borderRadius: 14,
                    paddingVertical: 18, alignItems: 'center', gap: 8,
                  }}>
                  <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: t.fill, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={a.icon} size={18} color={t.sub} />
                  </View>
                  <Text style={{ fontSize: 13, color: t.sub, fontFamily: 'Manrope_600SemiBold' }}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ─── Your Impact ─────────────────────────────────── */}
          <View style={{ paddingHorizontal: 24 }}>
            <SLabel icon="trophy-outline">Your impact</SLabel>
            <View style={{ backgroundColor: t.card, borderRadius: 14, paddingVertical: 18, alignItems: 'center' }}>
              <Text style={{ color: t.hint, fontSize: 11, fontFamily: 'Manrope_700Bold', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 }}>Reports submitted</Text>
              <Text style={{ color: t.text, fontSize: 40, fontFamily: 'Manrope_800ExtraBold', letterSpacing: -1.5 }}>{stats.count || 0}</Text>
              <Text style={{ color: t.sub, fontSize: 13, fontFamily: 'Manrope_500Medium', marginTop: 4 }}>
                {stats.streak > 0 ? `${stats.streak} week streak` : 'Start reporting weekly'}
              </Text>
            </View>
          </View>

          {/* ─── Recent ──────────────────────────────────────── */}
          <View style={{ paddingHorizontal: 24 }}>
            <SLabel icon="time-outline">Recent near you</SLabel>
            {RECENT.map((r, i) => (
              <View key={i} style={{
                flexDirection: 'row', alignItems: 'center', gap: 14,
                backgroundColor: t.card, borderRadius: 14,
                paddingVertical: 14, paddingHorizontal: 16, marginBottom: 8,
              }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: t.fill, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={r.icon} size={15} color={t.hint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, color: t.text, fontFamily: 'Manrope_600SemiBold', letterSpacing: -0.3 }}>{r.title}</Text>
                  <Text style={{ fontSize: 12, color: t.hint, fontFamily: 'Manrope_500Medium', marginTop: 2 }}>{r.sub}</Text>
                </View>
                <Text style={{ fontFamily: 'Manrope_400Regular',  fontSize: 11, color: t.hint }}>{r.time}</Text>
              </View>
            ))}
            <TouchableOpacity style={{ paddingHorizontal: 4, marginTop: 4 }}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <Text style={{ color: t.accent, fontSize: 13, fontFamily: 'Manrope_500Medium' }}>See all reports</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>



        {/* ─── Success Toast ─────────────────────────────────── */}
        {showSuccess && (
          <Animated.View style={{
            position: 'absolute', top: 60, left: 24, right: 24,
            backgroundColor: t.accent, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16,
            flexDirection: 'row', alignItems: 'center', gap: 10,
            transform: [{ translateY: successAnim.interpolate({ inputRange: [0, 1], outputRange: [-80, 0] }) }],
            opacity: successAnim,
          }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="checkmark" size={16} color={t.accent} />
            </View>
            <View>
              <Text style={{ color: '#FFF', fontSize: 14, fontFamily: 'Manrope_600SemiBold' }}>Report submitted!</Text>
              <Text style={{ fontFamily: 'Manrope_400Regular',  color: t.accentMid, fontSize: 11, marginTop: 1 }}>Thank you for protecting your community</Text>
            </View>
          </Animated.View>
        )}

      </SafeAreaView>
    </View>
  );
}
