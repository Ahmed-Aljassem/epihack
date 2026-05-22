import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Animated, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { setLocalProfile } from '@/utils/storage';
import * as api from '@/utils/api';

const t = {
  bg: '#FAFAFA', card: '#FFFFFF', text: '#111', sub: '#888',
  hint: '#B0B0B0', line: '#EEEEEE', fill: '#F2F2F2',
  accent: '#0B6623', accentSoft: '#F0F7F1', accentMid: '#D5E8D4',
  inv: '#FFF',
};

const SEXES = [{ id: 'male', label: 'Male' }, { id: 'female', label: 'Female' }, { id: 'other', label: 'Other' }];

export default function AuthModal() {
  const { mode: initialMode } = useLocalSearchParams<{ mode: string }>();
  // credentials
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [step, setStep] = useState<'auth' | 'details' | 'code'>('auth');
  const [loading, setLoading] = useState(false);

  // profile details (collected during account creation)
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [occupation, setOccupation] = useState('');
  const [household, setHousehold] = useState('');
  const [phone, setPhone] = useState('');
  const [zip, setZip] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const canSubmit = email.includes('@') && pass.length >= 6 && (!isSignUp || name.trim().length > 1);
  const canVerify = code.trim().length >= 4;

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const dismiss = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

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

  // Save the collected details locally (so they survive leaving for the email code).
  const saveCollectedLocally = () => setLocalProfile({
    email: email.trim(), name: name.trim() || undefined,
    age: age.trim() || undefined, sex: sex || undefined,
    occupation: occupation.trim() || undefined, household: household.trim() || undefined,
    phone: phone.trim() || undefined, zip: zip.trim() || undefined,
    lat: coords?.lat, lng: coords?.lng,
  });

  // Push the supported attributes to the backend (best-effort).
  const pushAttributes = async () => {
    // age → birthday (the pool's custom:age has no type; birthday is typed).
    const ageNum = parseInt(age, 10);
    const birthday = age && !isNaN(ageNum) ? `${new Date().getFullYear() - ageNum}-01-01` : undefined;
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
  };

  // Step 1 — sign in, or advance sign-up to the details step.
  const handleAuth = async () => {
    if (!canSubmit || loading) return;
    if (isSignUp) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStep('details'); return; }
    setLoading(true);
    try {
      await api.login(email.trim(), pass);
      await setLocalProfile({ email: email.trim() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      dismiss();
    } catch (err: any) {
      Alert.alert('Login Error', err?.message || 'Something went wrong.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — create the account with the collected profile, then ask for the email code.
  const handleCreate = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.register({ name: name.trim(), email: email.trim(), password: pass });
      await saveCollectedLocally();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (res?.needs_confirmation === false) {
        await api.login(email.trim(), pass);
        await pushAttributes();
        dismiss();
      } else {
        setStep('code');
      }
    } catch (err: any) {
      Alert.alert('Sign Up Error', err?.message || 'Something went wrong.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  // Step 3 — verify email, log in, save the profile attributes.
  const handleVerify = async () => {
    if (!canVerify || loading) return;
    setLoading(true);
    try {
      await api.confirm(email.trim(), code.trim());
      await api.login(email.trim(), pass);
      await pushAttributes();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      dismiss();
    } catch (err: any) {
      Alert.alert('Verification Error', err?.message || 'Could not verify the code.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.resendConfirmation(email.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Code sent', 'We sent a new verification code to your email.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not resend the code.');
    }
  };

  const inputWrap = {
    backgroundColor: t.card, borderRadius: 14, paddingHorizontal: 16,
    flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: 12,
    borderWidth: 1.5, borderColor: 'transparent',
  };
  const inputStyle = { flex: 1, color: t.text, fontSize: 16, paddingVertical: 16, fontFamily: 'Manrope_500Medium' };

  const Label = ({ children }: { children: string }) => (
    <Text style={{ color: t.sub, fontSize: 11, fontFamily: 'Manrope_600SemiBold', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 16, marginBottom: 8 }}>{children}</Text>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }], flex: 1 }}>

              {/* Top bar: Skip (auth) or Back (details/code) */}
              {step === 'auth' ? (
                <TouchableOpacity activeOpacity={0.7} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); dismiss(); }} style={{ alignSelf: 'flex-end', marginTop: 8, paddingVertical: 8, paddingLeft: 16 }}>
                  <Text style={{ color: t.sub, fontSize: 14, fontFamily: 'Manrope_500Medium' }}>Skip</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity activeOpacity={0.7} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStep(step === 'code' ? 'details' : 'auth'); }} style={{ alignSelf: 'flex-start', marginTop: 8, paddingVertical: 8, paddingRight: 16, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="chevron-back" size={18} color={t.sub} />
                  <Text style={{ color: t.sub, fontSize: 14, fontFamily: 'Manrope_500Medium' }}>Back</Text>
                </TouchableOpacity>
              )}

              {/* Logo */}
              <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 36 }}>
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 36, letterSpacing: -1.2 }}>
                  <Text style={{ color: t.hint, fontFamily: 'Manrope_300Light' }}>One</Text>
                  <Text style={{ color: t.accent, fontFamily: 'Manrope_800ExtraBold' }}>Health</Text>
                </Text>
              </View>

              {step === 'code' ? (
                /* ─── Email verification ─── */
                <>
                  <Text style={{ color: t.text, fontSize: 22, fontFamily: 'Manrope_700Bold', textAlign: 'center', marginBottom: 6 }}>Verify your email</Text>
                  <Text style={{ color: t.sub, fontSize: 14, fontFamily: 'Manrope_400Regular', textAlign: 'center', marginBottom: 28 }}>Enter the code we sent to {email}</Text>
                  <View style={inputWrap}>
                    <Ionicons name="keypad-outline" size={18} color={t.hint} style={{ marginRight: 10 }} />
                    <TextInput style={[inputStyle, { letterSpacing: 4, fontFamily: 'Manrope_700Bold' }]}
                      placeholder="123456" placeholderTextColor={t.hint}
                      value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 8))} keyboardType="number-pad" autoFocus />
                  </View>
                  <TouchableOpacity activeOpacity={0.8} onPress={handleVerify} disabled={!canVerify || loading} style={{ backgroundColor: canVerify && !loading ? t.accent : t.fill, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 12 }}>
                    <Text style={{ color: canVerify && !loading ? t.inv : t.hint, fontSize: 16, fontFamily: 'Manrope_600SemiBold' }}>{loading ? 'Please wait...' : 'Verify & Finish'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.7} onPress={handleResend} style={{ marginTop: 16, alignItems: 'center' }}>
                    <Text style={{ color: t.sub, fontSize: 14, fontFamily: 'Manrope_500Medium' }}>Didn&apos;t get it? <Text style={{ color: t.accent, fontFamily: 'Manrope_600SemiBold' }}>Resend code</Text></Text>
                  </TouchableOpacity>
                </>
              ) : step === 'details' ? (
                /* ─── Profile details (part of account creation) ─── */
                <>
                  <Text style={{ color: t.text, fontSize: 22, fontFamily: 'Manrope_700Bold', textAlign: 'center', marginBottom: 6 }}>A bit about you</Text>
                  <Text style={{ color: t.sub, fontSize: 14, fontFamily: 'Manrope_400Regular', textAlign: 'center', marginBottom: 12 }}>This helps detect health signals in your area.</Text>

                  <Label>Age</Label>
                  <View style={inputWrap}>
                    <Ionicons name="calendar-outline" size={18} color={t.hint} style={{ marginRight: 10 }} />
                    <TextInput style={inputStyle} placeholder="e.g. 35" placeholderTextColor={t.hint} value={age} onChangeText={(v) => setAge(v.replace(/\D/g, '').slice(0, 3))} keyboardType="number-pad" />
                  </View>

                  <Label>Sex</Label>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {SEXES.map(s => {
                      const on = sex === s.id;
                      return (
                        <TouchableOpacity key={s.id} activeOpacity={0.7} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSex(s.id); }}
                          style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: on ? t.accentSoft : t.card, borderWidth: 1.5, borderColor: on ? t.accent : 'transparent' }}>
                          <Text style={{ color: on ? t.accent : t.sub, fontSize: 14, fontFamily: 'Manrope_600SemiBold' }}>{s.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Label>Occupation</Label>
                  <View style={inputWrap}>
                    <Ionicons name="briefcase-outline" size={18} color={t.hint} style={{ marginRight: 10 }} />
                    <TextInput style={inputStyle} placeholder="e.g. Teacher" placeholderTextColor={t.hint} value={occupation} onChangeText={setOccupation} autoCapitalize="words" />
                  </View>

                  <Label>Household members</Label>
                  <View style={inputWrap}>
                    <Ionicons name="people-outline" size={18} color={t.hint} style={{ marginRight: 10 }} />
                    <TextInput style={inputStyle} placeholder="e.g. 4" placeholderTextColor={t.hint} value={household} onChangeText={(v) => setHousehold(v.replace(/\D/g, '').slice(0, 2))} keyboardType="number-pad" />
                  </View>

                  <Label>Phone number</Label>
                  <View style={inputWrap}>
                    <Ionicons name="call-outline" size={18} color={t.hint} style={{ marginRight: 10 }} />
                    <TextInput style={inputStyle} placeholder="e.g. 555-1234" placeholderTextColor={t.hint} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                  </View>

                  <Label>Zip code</Label>
                  <View style={inputWrap}>
                    <Ionicons name="navigate-outline" size={18} color={t.hint} style={{ marginRight: 10 }} />
                    <TextInput style={inputStyle} placeholder="e.g. 85719" placeholderTextColor={t.hint} value={zip} onChangeText={(v) => setZip(v.replace(/\D/g, '').slice(0, 5))} keyboardType="number-pad" maxLength={5} />
                  </View>

                  <Label>Location</Label>
                  <TouchableOpacity activeOpacity={0.7} onPress={detectLocation} disabled={locating} style={{ backgroundColor: t.card, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {locating ? <ActivityIndicator size="small" color={t.accent} /> : <Ionicons name={coords ? 'checkmark-circle' : 'locate-outline'} size={18} color={coords ? t.accent : t.hint} />}
                    <Text style={{ flex: 1, color: coords ? t.accent : t.sub, fontSize: 14, fontFamily: 'Manrope_500Medium' }}>
                      {coords ? `Detected · ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Detect my location'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity activeOpacity={0.8} onPress={handleCreate} disabled={loading} style={{ backgroundColor: t.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 28, marginBottom: 24, opacity: loading ? 0.6 : 1 }}>
                    <Text style={{ color: t.inv, fontSize: 16, fontFamily: 'Manrope_600SemiBold' }}>{loading ? 'Creating account...' : 'Create Account'}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                /* ─── Credentials (sign in / start sign up) ─── */
                <>
                  {isSignUp && (
                    <View style={inputWrap}>
                      <Ionicons name="person-outline" size={18} color={t.hint} style={{ marginRight: 10 }} />
                      <TextInput style={inputStyle} placeholder="Full Name" placeholderTextColor={t.hint} value={name} onChangeText={setName} autoCapitalize="words" autoCorrect={false} />
                    </View>
                  )}
                  <View style={inputWrap}>
                    <Ionicons name="mail-outline" size={18} color={t.hint} style={{ marginRight: 10 }} />
                    <TextInput style={inputStyle} placeholder="Email" placeholderTextColor={t.hint} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                  </View>
                  <View style={[inputWrap, { marginBottom: 24 }]}>
                    <Ionicons name="lock-closed-outline" size={18} color={t.hint} style={{ marginRight: 10 }} />
                    <TextInput style={inputStyle} placeholder="Password" placeholderTextColor={t.hint} value={pass} onChangeText={setPass} secureTextEntry={!showPass} autoCapitalize="none" />
                    <TouchableOpacity onPress={() => setShowPass(p => !p)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={t.hint} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity activeOpacity={0.8} onPress={handleAuth} disabled={!canSubmit || loading} style={{ backgroundColor: canSubmit && !loading ? t.accent : t.fill, borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}>
                    <Text style={{ color: canSubmit && !loading ? t.inv : t.hint, fontSize: 16, fontFamily: 'Manrope_600SemiBold' }}>
                      {loading ? 'Please wait...' : (isSignUp ? 'Continue' : 'Sign In')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity activeOpacity={0.7} onPress={() => setIsSignUp(!isSignUp)} style={{ marginTop: 16, alignItems: 'center' }}>
                    <Text style={{ color: t.sub, fontSize: 14, fontFamily: 'Manrope_500Medium' }}>
                      {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                      <Text style={{ color: t.accent, fontFamily: 'Manrope_600SemiBold' }}>{isSignUp ? 'Sign In' : 'Sign Up'}</Text>
                    </Text>
                  </TouchableOpacity>

                  <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 24 }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: t.line }} />
                    <Text style={{ fontFamily: 'Manrope_400Regular', color: t.hint, fontSize: 12, marginHorizontal: 14 }}>or</Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: t.line }} />
                  </View>

                  {/* Social icons (OAuth — dummy) */}
                  <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
                    <TouchableOpacity activeOpacity={0.7} onPress={handleAuth} style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: t.card, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="logo-apple" size={24} color={t.text} />
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.7} onPress={handleAuth} style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: t.card, alignItems: 'center', justifyContent: 'center' }}>
                      <Svg width={24} height={24} viewBox="0 0 48 48">
                        <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      </Svg>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.7} onPress={handleAuth} style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: t.card, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="logo-facebook" size={26} color="#1877F2" />
                    </TouchableOpacity>
                  </View>
                </>
              )}

            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
