import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, ActionSheetIOS, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { getMyReports, getNotifsOn, setNotifsOn, SavedReport, getThemeMode, setThemeMode, getLocalProfile, clearLocalProfile } from '@/utils/storage';
import { useLang, updateLang } from '@/utils/i18n';
import * as api from '@/utils/api';

const t = {
  bg: '#FAFAFA', card: '#FFFFFF', text: '#111', sub: '#888',
  hint: '#B0B0B0', line: '#EEEEEE', fill: '#F2F2F2',
  accent: '#0B6623', accentSoft: '#F0F7F1', accentMid: '#D5E8D4',
};

const LANG_MAP: Record<string, string> = { EN: 'English', ES: 'Español', TO: "O'odham ñiok" };
const THEME_MAP: Record<string, string> = { light: 'Light', dark: 'Dark', auto: 'Auto' };

interface ProfileState {
  loggedIn: boolean;
  name: string | null; email: string | null;
  phone: string | null; age: string | null; sex: string | null;
  occupation: string | null; household: string | null; zip: string | null;
}
const EMPTY: ProfileState = { loggedIn: false, name: null, email: null, phone: null, age: null, sex: null, occupation: null, household: null, zip: null };

const cap = (s: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : null);

export default function ProfileScreen() {
  const [profile, setProfile] = useState<ProfileState>(EMPTY);
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [notifsOn, setNotifsState] = useState(true);
  const { lang, loc } = useLang();
  const [theme, setThemeState] = useState('light');

  const load = useCallback(async () => {
    const loggedIn = await api.isLoggedIn();
    const local = await getLocalProfile();
    let name = local.name || null;
    let email = local.email || null;

    if (loggedIn) {
      // Pull the latest identity claims; tolerate unknown response shapes.
      try {
        const me: any = await api.getMe();
        if (me && typeof me === 'object') {
          name = me.name || me['cognito:username'] || name;
          email = me.email || email;
        }
      } catch (e) {
        console.log('getMe skipped:', e);
      }
    }

    setProfile({
      loggedIn,
      name: loggedIn ? (name || 'Reporter') : null,
      email,
      phone: local.phone || null,
      age: local.age || null,
      sex: cap(local.sex || null),
      occupation: local.occupation || null,
      household: local.household || null,
      zip: local.zip || null,
    });
    setReports(await getMyReports());
    setNotifsState(await getNotifsOn());
    setThemeState(await getThemeMode());
  }, []);

  // Reload whenever the tab is focused (after login, profile-setup, or a report).
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const isLoggedIn = profile.loggedIn;

  const pick = (title: string, labels: string[], keys: string[], setter: (k: string) => void, saver: (k: string) => Promise<void> | void) => {
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

  const editProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/profile-setup');
  };

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    // Instantly clear UI so it feels snappy; do the network bits in the background.
    setProfile(EMPTY);
    api.logout().catch((e) => console.log('logout error:', e));
    clearLocalProfile().catch(() => {});
  };

  const SLabel = ({ children, icon }: { children: string; icon?: keyof typeof Ionicons.glyphMap }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 28, marginBottom: 10 }}>
      {icon && <Ionicons name={icon} size={13} color={t.sub} />}
      <Text style={{ color: t.sub, fontSize: 11, fontFamily: 'Manrope_600SemiBold', textTransform: 'uppercase', letterSpacing: 1.2 }}>{children}</Text>
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
      <Text style={{ flex: 1, fontSize: 15, color: t.text, fontFamily: 'Manrope_500Medium' }}>{label}</Text>
      {right && <Text style={{ fontFamily: 'Manrope_400Regular',  fontSize: 13, color: t.hint, marginRight: 4 }}>{right}</Text>}
      {onPress && <Ionicons name="chevron-forward" size={14} color={t.hint} />}
    </TouchableOpacity>
  );

  const catIcon = (cats: string[]): keyof typeof Ionicons.glyphMap =>
    cats?.includes('animals') ? 'paw-outline' : cats?.includes('environment') ? 'leaf-outline' : 'person-outline';

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}>

          <Text style={{ fontSize: 28, fontFamily: 'Manrope_700Bold', color: t.text, letterSpacing: -0.6, paddingTop: 8 }}>{loc.p_prof}</Text>

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
                ? <Text style={{ color: t.accent, fontSize: 22, fontFamily: 'Manrope_700Bold' }}>{(profile.name || 'R')[0].toUpperCase()}</Text>
                : <Ionicons name="person" size={22} color={t.hint} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontFamily: 'Manrope_600SemiBold', color: t.text }}>
                {isLoggedIn ? (profile.name || 'Reporter') : loc.p_anon}
              </Text>
              <Text style={{ fontFamily: 'Manrope_400Regular',  fontSize: 12, color: t.sub, marginTop: 2 }}>{profile.email || 'Tucson, AZ'}</Text>
            </View>
            {!isLoggedIn && (
              <TouchableOpacity activeOpacity={0.8}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push({ pathname: '/auth-modal', params: { mode: 'signup' } }); }}
                style={{ backgroundColor: t.accent, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 }}>
                <Text style={{ color: '#FFF', fontSize: 13, fontFamily: 'Manrope_600SemiBold' }}>{loc.p_signup}</Text>
              </TouchableOpacity>
            )}
          </View>


          {/* Personal Info — tap any row to edit the full profile form */}
          {isLoggedIn && (
            <>
              <SLabel icon="person-outline">Personal Info</SLabel>
              <Row icon="call-outline" label="Phone Number" right={profile.phone || 'Add'} onPress={editProfile} />
              <Row icon="calendar-outline" label="Age" right={profile.age || 'Add'} onPress={editProfile} />
              <Row icon="male-female-outline" label="Sex" right={profile.sex || 'Add'} onPress={editProfile} />
              <Row icon="briefcase-outline" label="Occupation" right={profile.occupation || 'Add'} onPress={editProfile} />
              <Row icon="people-outline" label="Household" right={profile.household || 'Add'} onPress={editProfile} />
              <Row icon="navigate-outline" label="Zip Code" right={profile.zip || 'Add'} onPress={editProfile} />
            </>
          )}

          {/* Recent Reports */}
          <SLabel icon="time-outline">{loc.p_rec}</SLabel>
          {reports.length === 0 ? (
            <View style={{ backgroundColor: t.card, borderRadius: 14, padding: 20, alignItems: 'center' }}>
              <Ionicons name="document-outline" size={22} color={t.hint} />
              <Text style={{ fontFamily: 'Manrope_400Regular',  color: t.hint, fontSize: 13, marginTop: 6 }}>{loc.p_no_rep}</Text>
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
                  <Text style={{ fontSize: 14, color: t.text, fontFamily: 'Manrope_500Medium' }}>
                    {r.symptoms?.slice(0, 2).join(', ') || r.observations?.slice(0, 2).join(', ') || r.feeling}
                  </Text>
                  <Text style={{ fontFamily: 'Manrope_400Regular',  fontSize: 11, color: t.hint, marginTop: 2 }}>{r.date}</Text>
                </View>
                <View style={{ backgroundColor: t.accentSoft, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1.5, borderColor: t.accent }}>
                  <Text style={{ color: t.accent, fontSize: 10, fontFamily: 'Manrope_600SemiBold' }}>{loc.p_sent}</Text>
                </View>
              </View>
            ))
          )}

          {/* Settings */}
          <SLabel icon="settings-outline">{loc.p_set}</SLabel>
          <Row icon="globe-outline" label={loc.p_lang} right={LANG_MAP[lang] || lang}
            onPress={() => pick(loc.sel_lang || 'Select Language', ['English', 'Español', "O'odham ñiok"], ['EN', 'ES', 'TO'], (k) => updateLang(k as 'EN' | 'ES' | 'TO'), () => {})} />
          <Row icon="location-outline" label={loc.p_loc} right={profile.zip || '85719'} onPress={isLoggedIn ? editProfile : undefined} />

          {/* Notifications toggle */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 14,
            backgroundColor: t.card, borderRadius: 14,
            paddingVertical: 12, paddingHorizontal: 16, marginBottom: 8,
          }}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: t.fill, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="notifications-outline" size={16} color={t.sub} />
            </View>
            <Text style={{ flex: 1, fontSize: 15, color: t.text, fontFamily: 'Manrope_500Medium' }}>{loc.p_notif}</Text>
            <Switch value={notifsOn}
              onValueChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNotifsState(v); setNotifsOn(v); }}
              trackColor={{ true: t.accent, false: '#E0E0E0' }} thumbColor="#FFF"
              style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }} />
          </View>

          <Row icon="moon-outline" label={loc.p_app} right={THEME_MAP[theme] || theme}
            onPress={() => pick(loc.appearance || 'Appearance', [loc.light || 'Light', loc.dark || 'Dark', 'Auto'], ['light', 'dark', 'auto'], setThemeState, setThemeMode)} />

          {/* About */}
          <SLabel icon="information-circle-outline">{loc.p_about}</SLabel>
          <Row icon="help-circle-outline" label={loc.p_how} onPress={() => {}} />
          <Row icon="shield-checkmark-outline" label={loc.p_priv} onPress={() => {}} />
          <Row icon="sparkles-outline" label={loc.p_ai} onPress={() => {}} />
          <Row icon="chatbubble-ellipses-outline" label={loc.p_feed} onPress={() => {}} />

          {isLoggedIn && (
            <TouchableOpacity onPress={handleLogout}
              style={{ backgroundColor: '#FFEBEE', paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 24, marginBottom: 12 }}>
              <Text style={{ color: '#E53935', fontSize: 14, fontFamily: 'Manrope_500Medium' }}>{loc.p_logout}</Text>
            </TouchableOpacity>
          )}

          <Text style={{ fontFamily: 'Manrope_400Regular',  color: t.hint, fontSize: 10, textAlign: 'center', marginTop: 28, lineHeight: 16 }}>
            v1.0 · Ending Pandemics Academy × UofA{'\n'}Made for Arizona
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
