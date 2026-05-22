import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { getLocalProfile, setLocalProfile } from '@/utils/storage';
import * as api from '@/utils/api';

const t = {
  bg: '#FAFAFA', card: '#FFFFFF', text: '#111', sub: '#888',
  hint: '#B0B0B0', line: '#EEEEEE', fill: '#F2F2F2',
  accent: '#0B6623', accentSoft: '#F0F7F1', accentMid: '#D5E8D4', inv: '#FFF',
};

const SEXES = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'other', label: 'Other' },
];

export default function ProfileSetup() {
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [occupation, setOccupation] = useState('');
  const [household, setHousehold] = useState('');
  const [zip, setZip] = useState('');
  const [phone, setPhone] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Prefill from anything already collected (Profile screen → edit later).
  useEffect(() => {
    (async () => {
      const p = await getLocalProfile();
      if (p.age) setAge(p.age);
      if (p.sex) setSex(p.sex);
      if (p.occupation) setOccupation(p.occupation);
      if (p.household) setHousehold(p.household);
      if (p.zip) setZip(p.zip);
      if (p.phone) setPhone(p.phone);
      if (p.lat != null && p.lng != null) setCoords({ lat: p.lat, lng: p.lng });
    })();
  }, []);

  const detectLocation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Enable location to auto-detect your area.'); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      const g = await Location.reverseGeocodeAsync(pos.coords);
      if (g[0]?.postalCode) setZip(g[0].postalCode);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Could not detect your location.');
    } finally {
      setLocating(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      // Persist everything locally (covers fields Cognito has no column for yet).
      await setLocalProfile({
        age: age.trim() || undefined,
        sex: sex || undefined,
        occupation: occupation.trim() || undefined,
        household: household.trim() || undefined,
        zip: zip.trim() || undefined,
        phone: phone.trim() || undefined,
        lat: coords?.lat,
        lng: coords?.lng,
      });

      // Age is stored server-side as `birthday` (Cognito's typed `birthdate`),
      // because the pool's custom:age attribute has no type and would fail the
      // whole update. We send an approximate birthdate (Jan 1 of the birth year);
      // the exact age the user typed is kept locally for display.
      const ageNum = parseInt(age, 10);
      const birthday = age && !isNaN(ageNum) ? `${new Date().getFullYear() - ageNum}-01-01` : undefined;

      // Push attributes to the backend (best-effort). `address` carries geo
      // as "<lat>, <lng>"; `sex` is "male"/"female".
      try {
        await api.updateUserAttributes({
          sex: sex || undefined,
          birthday,
          occupation: occupation.trim() || undefined,
          address: coords ? `${coords.lat}, ${coords.lng}` : undefined,
          num_household_members: household ? parseInt(household, 10) : undefined,
          home_zips: zip.trim() || undefined,
          phone_number: phone.trim() || undefined,
        });
      } catch (e) {
        console.log('updateUserAttributes skipped:', e);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Could not save', err?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const Label = ({ children, icon }: { children: string; icon?: keyof typeof Ionicons.glyphMap }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 22, marginBottom: 10 }}>
      {icon && <Ionicons name={icon} size={13} color={t.sub} />}
      <Text style={{ color: t.sub, fontSize: 11, fontFamily: 'Manrope_600SemiBold', textTransform: 'uppercase', letterSpacing: 1.2 }}>{children}</Text>
    </View>
  );

  const field = {
    backgroundColor: t.card, borderRadius: 12, paddingHorizontal: 16,
    flexDirection: 'row' as const, alignItems: 'center' as const,
  };
  const fieldInput = { flex: 1, color: t.text, fontSize: 16, paddingVertical: 14, fontFamily: 'Manrope_500Medium' };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 8 }}>
              <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={{ paddingVertical: 8, paddingLeft: 16 }}>
                <Text style={{ color: t.sub, fontSize: 14, fontFamily: 'Manrope_500Medium' }}>Skip</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 28, fontFamily: 'Manrope_700Bold', color: t.text, letterSpacing: -0.6, marginTop: 8 }}>
              Complete your profile
            </Text>
            <Text style={{ fontSize: 14, fontFamily: 'Manrope_400Regular', color: t.sub, marginTop: 6, lineHeight: 20 }}>
              This helps us understand health signals in your area. You can change it anytime.
            </Text>

            {/* Age */}
            <Label icon="calendar-outline">Age</Label>
            <View style={field}>
              <Ionicons name="calendar-outline" size={16} color={t.hint} style={{ marginRight: 10 }} />
              <TextInput style={fieldInput} placeholder="e.g. 35" placeholderTextColor={t.hint}
                value={age} onChangeText={(v) => setAge(v.replace(/\D/g, '').slice(0, 3))} keyboardType="number-pad" />
            </View>

            {/* Sex */}
            <Label icon="male-female-outline">Sex</Label>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {SEXES.map(s => {
                const on = sex === s.id;
                return (
                  <TouchableOpacity key={s.id} activeOpacity={0.7}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSex(s.id); }}
                    style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12,
                      backgroundColor: on ? t.accentSoft : t.card, borderWidth: 1.5, borderColor: on ? t.accent : 'transparent' }}>
                    <Text style={{ color: on ? t.accent : t.sub, fontSize: 14, fontFamily: 'Manrope_600SemiBold' }}>{s.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Occupation */}
            <Label icon="briefcase-outline">Occupation</Label>
            <View style={field}>
              <Ionicons name="briefcase-outline" size={16} color={t.hint} style={{ marginRight: 10 }} />
              <TextInput style={fieldInput} placeholder="e.g. Teacher" placeholderTextColor={t.hint}
                value={occupation} onChangeText={setOccupation} autoCapitalize="words" />
            </View>

            {/* Household members */}
            <Label icon="people-outline">Household members</Label>
            <View style={field}>
              <Ionicons name="people-outline" size={16} color={t.hint} style={{ marginRight: 10 }} />
              <TextInput style={fieldInput} placeholder="e.g. 4" placeholderTextColor={t.hint}
                value={household} onChangeText={(v) => setHousehold(v.replace(/\D/g, '').slice(0, 2))} keyboardType="number-pad" />
            </View>

            {/* Phone */}
            <Label icon="call-outline">Phone number</Label>
            <View style={field}>
              <Ionicons name="call-outline" size={16} color={t.hint} style={{ marginRight: 10 }} />
              <TextInput style={fieldInput} placeholder="e.g. 555-1234" placeholderTextColor={t.hint}
                value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </View>

            {/* Zip + auto detect */}
            <Label icon="location-outline">Zip code</Label>
            <View style={field}>
              <Ionicons name="navigate-outline" size={16} color={t.hint} style={{ marginRight: 10 }} />
              <TextInput style={fieldInput} placeholder="e.g. 85719" placeholderTextColor={t.hint}
                value={zip} onChangeText={(v) => setZip(v.replace(/\D/g, '').slice(0, 5))} keyboardType="number-pad" maxLength={5} />
            </View>

            {/* Geo detect */}
            <Label icon="map-outline">Location</Label>
            <TouchableOpacity activeOpacity={0.7} onPress={detectLocation} disabled={locating}
              style={{ backgroundColor: t.card, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {locating ? <ActivityIndicator size="small" color={t.accent} />
                : <Ionicons name={coords ? 'checkmark-circle' : 'locate-outline'} size={18} color={coords ? t.accent : t.sub} />}
              <Text style={{ flex: 1, color: coords ? t.accent : t.sub, fontSize: 14, fontFamily: 'Manrope_500Medium' }}>
                {coords ? `Detected · ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Detect my location'}
              </Text>
            </TouchableOpacity>

            {/* Save */}
            <TouchableOpacity activeOpacity={0.85} onPress={save} disabled={saving}
              style={{ backgroundColor: t.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 32, opacity: saving ? 0.6 : 1 }}>
              <Text style={{ color: t.inv, fontSize: 16, fontFamily: 'Manrope_600SemiBold' }}>{saving ? 'Saving…' : 'Save & Continue'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
