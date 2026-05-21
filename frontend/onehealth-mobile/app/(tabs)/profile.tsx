import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, ActionSheetIOS, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { getUserProfile, getReportStats, getMyReports, clearAuth, getNotifsOn, setNotifsOn, SavedReport, getLang, setLang, getThemeMode, setThemeMode } from '@/utils/storage';

const t = {
  bg: '#FAFAFA', card: '#FFFFFF', text: '#111', sub: '#888',
  hint: '#B0B0B0', line: '#EEEEEE', fill: '#F2F2F2',
  accent: '#0B6623', accentSoft: '#F0F7F1', accentMid: '#D5E8D4',
};

const LANG_MAP: Record<string, string> = { EN: 'English', ES: 'Español', TO: "O'odham ñiok" };
const THEME_MAP: Record<string, string> = { light: 'Light', dark: 'Dark', auto: 'Auto' };

export default function ProfileScreen() {
  const [profile, setProfile] = useState<{ name: string | null; email: string | null; token: string | null }>({ name: null, email: null, token: null });
  const [stats, setStats] = useState({ count: 0, streak: 0 });
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [notifsOn, setNotifsState] = useState(true);
  const [lang, setLangState] = useState('EN');
  const [theme, setThemeState] = useState('light');

  const load = useCallback(async () => {
    setProfile(await getUserProfile());
    setStats(await getReportStats());
    setReports(await getMyReports());
    setNotifsState(await getNotifsOn());
    setLangState(await getLang());
    setThemeState(await getThemeMode());
  }, []);

  useEffect(() => { load(); }, []);
  const isLoggedIn = !!profile.token;

  const pick = (title: string, labels: string[], keys: string[], setter: (k: string) => void, saver: (k: string) => Promise<void>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [...labels, 'Cancel'], cancelButtonIndex: labels.length, title },
        (i) => { if (i < labels.length) { setter(keys[i]); saver(keys[i]); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } }
      );
    } else {
      Alert.alert(title, '', [
        ...keys.map((k, i) => ({ text: labels[i], onPress: () => { setter(k); saver(k); } })),
        { text: 'Cancel', style: 'cancel' as const },
      ]);
    }
  };

  const handleLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await clearAuth();
    setProfile({ name: null, email: null, token: null });
  };

  const SLabel = ({ children, icon }: { children: string; icon?: keyof typeof Ionicons.glyphMap }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 28, marginBottom: 10 }}>
      {icon && <Ionicons name={icon} size={13} color={t.sub} />}
      <Text style={{ color: t.sub, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.2 }}>{children}</Text>
    </View>
  );

  const Row = ({ icon, label, right, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; right?: string; onPress?: () => void }) => (
    <TouchableOpacity activeOpacity={0.7}
      onPress={() => { if (onPress) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); } }}
      disabled={!onPress}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: t.card, borderRadius: 14,
        paddingVertical: 14, paddingHorizontal: 16, marginBottom: 8,
      }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: t.fill, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={16} color={t.sub} />
      </View>
      <Text style={{ flex: 1, fontSize: 15, color: t.text, fontWeight: '500' }}>{label}</Text>
      {right && <Text style={{ fontSize: 13, color: t.hint, marginRight: 4 }}>{right}</Text>}
      {onPress && <Ionicons name="chevron-forward" size={14} color={t.hint} />}
    </TouchableOpacity>
  );

  const catIcon = (cats: string[]): keyof typeof Ionicons.glyphMap =>
    cats?.includes('animals') ? 'paw-outline' : cats?.includes('environment') ? 'leaf-outline' : 'person-outline';

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}>

          <Text style={{ fontSize: 28, fontWeight: '700', color: t.text, letterSpacing: -0.6, paddingTop: 8 }}>Profile</Text>

          {/* Avatar */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 14,
            backgroundColor: t.card, borderRadius: 14, padding: 16, marginTop: 20,
          }}>
            <View style={{
              width: 52, height: 52, borderRadius: 15,
              backgroundColor: isLoggedIn ? t.accentMid : t.fill,
              alignItems: 'center', justifyContent: 'center',
            }}>
              {isLoggedIn
                ? <Text style={{ color: t.accent, fontSize: 22, fontWeight: '700' }}>{(profile.name || 'R')[0].toUpperCase()}</Text>
                : <Ionicons name="person" size={22} color={t.hint} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: t.text }}>
                {isLoggedIn ? (profile.name || 'Reporter') : 'Anonymous Reporter'}
              </Text>
              <Text style={{ fontSize: 12, color: t.sub, marginTop: 2 }}>Tucson, AZ</Text>
            </View>
            {!isLoggedIn && (
              <TouchableOpacity activeOpacity={0.8}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push({ pathname: '/auth-modal', params: { mode: 'signup' } }); }}
                style={{ backgroundColor: t.accent, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 }}>
                <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '600' }}>Sign Up</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Stats */}
          <SLabel icon="trophy-outline">Your impact</SLabel>
          <View style={{ backgroundColor: t.card, borderRadius: 14, paddingVertical: 18, alignItems: 'center' }}>
            <Text style={{ color: t.hint, fontSize: 10, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Reports submitted</Text>
            <Text style={{ color: t.text, fontSize: 32, fontWeight: '700' }}>{stats.count}</Text>
            <Text style={{ color: t.sub, fontSize: 12, marginTop: 4 }}>
              {stats.streak > 0 ? `${stats.streak} week streak` : 'Start reporting weekly'}
            </Text>
          </View>

          {/* Recent Reports */}
          <SLabel icon="time-outline">Recent reports</SLabel>
          {reports.length === 0 ? (
            <View style={{ backgroundColor: t.card, borderRadius: 14, padding: 20, alignItems: 'center' }}>
              <Ionicons name="document-outline" size={22} color={t.hint} />
              <Text style={{ color: t.hint, fontSize: 13, marginTop: 6 }}>No reports yet</Text>
            </View>
          ) : (
            reports.slice(0, 3).map((r, i) => (
              <View key={i} style={{
                flexDirection: 'row', alignItems: 'center', gap: 14,
                backgroundColor: t.card, borderRadius: 14,
                paddingVertical: 14, paddingHorizontal: 16, marginBottom: 8,
              }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: t.fill, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={catIcon(r.category)} size={14} color={t.hint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, color: t.text, fontWeight: '500' }}>
                    {r.symptoms?.slice(0, 2).join(', ') || r.observations?.slice(0, 2).join(', ') || r.feeling}
                  </Text>
                  <Text style={{ fontSize: 11, color: t.hint, marginTop: 2 }}>{r.date}</Text>
                </View>
                <View style={{ backgroundColor: t.accentSoft, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1.5, borderColor: t.accent }}>
                  <Text style={{ color: t.accent, fontSize: 10, fontWeight: '600' }}>Sent</Text>
                </View>
              </View>
            ))
          )}

          {/* Settings */}
          <SLabel icon="settings-outline">Settings</SLabel>
          <Row icon="globe-outline" label="Language" right={LANG_MAP[lang] || lang}
            onPress={() => pick('Select Language', ['English', 'Español', "O'odham ñiok"], ['EN', 'ES', 'TO'], setLangState, setLang)} />
          <Row icon="location-outline" label="Location" right="85719" onPress={() => {}} />

          {/* Notifications toggle */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 14,
            backgroundColor: t.card, borderRadius: 14,
            paddingVertical: 12, paddingHorizontal: 16, marginBottom: 8,
          }}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: t.fill, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="notifications-outline" size={16} color={t.sub} />
            </View>
            <Text style={{ flex: 1, fontSize: 15, color: t.text, fontWeight: '500' }}>Notifications</Text>
            <Switch value={notifsOn}
              onValueChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNotifsState(v); setNotifsOn(v); }}
              trackColor={{ true: t.accent, false: '#E0E0E0' }} thumbColor="#FFF"
              style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }} />
          </View>

          <Row icon="moon-outline" label="Appearance" right={THEME_MAP[theme] || theme}
            onPress={() => pick('Appearance', ['Light', 'Dark', 'Auto'], ['light', 'dark', 'auto'], setThemeState, setThemeMode)} />

          {/* About */}
          <SLabel icon="information-circle-outline">About</SLabel>
          <Row icon="help-circle-outline" label="How OneHealth Works" onPress={() => {}} />
          <Row icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => {}} />
          <Row icon="sparkles-outline" label="How Our AI Works" onPress={() => {}} />
          <Row icon="chatbubble-ellipses-outline" label="Send Feedback" onPress={() => {}} />

          {isLoggedIn && (
            <TouchableOpacity onPress={handleLogout}
              style={{ backgroundColor: t.card, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 20 }}>
              <Text style={{ color: '#E53935', fontSize: 14, fontWeight: '500' }}>Log Out</Text>
            </TouchableOpacity>
          )}

          <Text style={{ color: t.hint, fontSize: 10, textAlign: 'center', marginTop: 28, lineHeight: 16 }}>
            v1.0 · Ending Pandemics Academy × UofA{'\n'}Made for Arizona
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
