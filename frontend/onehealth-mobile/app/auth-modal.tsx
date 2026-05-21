import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Animated, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

const API_BASE = 'https://jimgh22yohvh6gpfilo4bcqxp40huyhw.lambda-url.us-east-2.on.aws';
const CLIENT_ID = '6mbhoc1p6d1egrfq4o2hu2a9sc';

const t = {
  bg: '#FAFAFA', card: '#FFFFFF', text: '#111', sub: '#888',
  hint: '#B0B0B0', line: '#EEEEEE', fill: '#F2F2F2',
  accent: '#0B6623', accentSoft: '#F0F7F1', accentMid: '#D5E8D4',
  inv: '#FFF',
};

type AuthMode = 'signin' | 'signup' | 'confirm';

export default function AuthModal() {
  const { mode: initialMode } = useLocalSearchParams<{ mode: string }>();
  const { signInUser } = useAuth();

  // ─── State ──────────────────────────────────────────
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode === 'signin' ? 'signin' : 'signup');
  const [identity, setIdentity] = useState(''); // email OR phone
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Confirmation code
  const [otpCode, setOtpCode] = useState('');

  // ─── Animations ─────────────────────────────────────
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  // ─── Validation ─────────────────────────────────────
  const emailValid = identity.includes('@') && identity.includes('.');
  const passValid = pass.length >= 6;

  const canSubmit = emailValid && passValid && (authMode === 'signin' || name.trim().length > 0);
  const canVerifyOtp = otpCode.length === 6;

  // ─── Email Auth ─────────────────────────────────────
  const handleAuth = async () => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      if (authMode === 'signup') {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: CLIENT_ID,
            email: identity.trim(),
            password: pass,
            name: name,
            role: 'citizen',
          }),
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail?.[0]?.msg || errorData.detail || 'Registration failed');
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setAuthMode('confirm');
      } else if (authMode === 'signin') {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: CLIENT_ID,
            email: identity.trim(),
            password: pass,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail?.[0]?.msg || errorData.detail || 'Login failed');
        }

        const data = await res.json();
        if (!data.access_token) throw new Error('No access token received');
        await signInUser(data.access_token, 'Reporter', identity.trim());

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyConfirm = async () => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await fetch(`${API_BASE}/auth/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          email: identity.trim(),
          code: otpCode,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail?.[0]?.msg || errorData.detail || 'Confirmation failed');
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Automatically login after confirm
      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          email: identity.trim(),
          password: pass,
        }),
      });
      if (loginRes.ok) {
        const data = await loginRes.json();
        if (!data.access_token) throw new Error('No access token received from auto-login');
        await signInUser(data.access_token, name, identity.trim());
        router.back();
      } else {
        setAuthMode('signin');
      }

    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };


  const skip = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); };

  // ─── Shared Styles ──────────────────────────────────
  const inputBox = (mb = 12) => ({
    backgroundColor: t.card, borderRadius: 14, paddingHorizontal: 16,
    flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: mb,
  });
  const inputStyle = { flex: 1, color: t.text, fontSize: 16, paddingVertical: 16, fontFamily: 'Manrope_500Medium' };

  // ─── Render ─────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }], flex: 1 }}>

              {/* Skip */}
              <TouchableOpacity activeOpacity={0.7} onPress={skip} style={{ alignSelf: 'flex-end', marginTop: 8, paddingVertical: 8, paddingLeft: 16 }}>
                <Text style={{ color: t.sub, fontSize: 14, fontFamily: 'Manrope_500Medium' }}>Skip</Text>
              </TouchableOpacity>

              {/* Logo */}
              <View style={{ alignItems: 'center', marginTop: 32, marginBottom: 40 }}>
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 36, letterSpacing: -1.2 }}>
                  <Text style={{ color: t.hint, fontFamily: 'Manrope_300Light' }}>One</Text>
                  <Text style={{ color: t.accent, fontFamily: 'Manrope_800ExtraBold' }}>Health</Text>
                </Text>
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: t.sub, marginTop: 8 }}>
                  {authMode === 'signup' ? 'Create your account' : (authMode === 'signin' ? 'Welcome back' : 'Verify your email')}
                </Text>
              </View>

              {/* ─────────────────── OTP VERIFY SCREEN ─────────────────── */}
              {authMode === 'confirm' ? (
                <>
                  <View style={{ alignItems: 'center', marginBottom: 24 }}>
                    <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                      <Ionicons name="mail-outline" size={22} color={t.accent} />
                    </View>
                    <Text style={{ color: t.text, fontSize: 16, fontFamily: 'Manrope_600SemiBold' }}>Enter the 6-digit code</Text>
                    <Text style={{ color: t.sub, fontSize: 13, fontFamily: 'Manrope_400Regular', marginTop: 4 }}>Sent to {identity}</Text>
                  </View>

                  <View style={inputBox(24)}>
                    <Ionicons name="keypad-outline" size={18} color={t.hint} style={{ marginRight: 10 }} />
                    <TextInput style={{ ...inputStyle, letterSpacing: 8, textAlign: 'center', fontSize: 22, fontFamily: 'Manrope_700Bold' }}
                      placeholder="000000" placeholderTextColor={t.hint}
                      value={otpCode} onChangeText={v => setOtpCode(v.replace(/\D/g, '').slice(0, 6))}
                      keyboardType="number-pad" autoFocus />
                  </View>

                  <TouchableOpacity activeOpacity={0.8} onPress={handleVerifyConfirm} disabled={!canVerifyOtp || loading}
                    style={{
                      backgroundColor: canVerifyOtp ? t.accent : t.fill, borderRadius: 14, paddingVertical: 16,
                      alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
                    }}>
                    {loading && <ActivityIndicator size="small" color={canVerifyOtp ? t.inv : t.hint} />}
                    <Text style={{ color: canVerifyOtp ? t.inv : t.hint, fontSize: 16, fontFamily: 'Manrope_600SemiBold' }}>Verify & Sign In</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => { setAuthMode('signup'); setOtpCode(''); }} style={{ alignSelf: 'center', marginTop: 16 }}>
                    <Text style={{ color: t.accent, fontSize: 13, fontFamily: 'Manrope_500Medium' }}>Change email</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* ─────────────────── MAIN FORM ─────────────────── */}

                  {/* Name (signup only, email only) */}
                  {authMode === 'signup' && (
                    <View style={inputBox()}>
                      <Ionicons name="person-outline" size={18} color={t.hint} style={{ marginRight: 10 }} />
                      <TextInput style={inputStyle}
                        placeholder="Full name" placeholderTextColor={t.hint}
                        value={name} onChangeText={setName}
                        autoCapitalize="words" autoCorrect={false} />
                    </View>
                  )}

                  {/* Email */}
                  <View style={inputBox()}>
                    <Ionicons name="mail-outline" size={18} color={t.hint} style={{ marginRight: 10 }} />
                    <TextInput style={inputStyle}
                      placeholder="Email" placeholderTextColor={t.hint}
                      value={identity} onChangeText={setIdentity}
                      keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                  </View>

                  {/* Password */}
                  <View style={inputBox(4)}>
                    <Ionicons name="lock-closed-outline" size={18} color={t.hint} style={{ marginRight: 10 }} />
                    <TextInput style={inputStyle}
                      placeholder="Password" placeholderTextColor={t.hint}
                      value={pass} onChangeText={setPass}
                      secureTextEntry={!showPass} autoCapitalize="none" />
                    <TouchableOpacity onPress={() => setShowPass(p => !p)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={t.hint} />
                    </TouchableOpacity>
                  </View>

                  {/* Hint text */}
                  {identity.length > 3 && (
                    <Text style={{ color: t.hint, fontSize: 11, fontFamily: 'Manrope_400Regular', marginBottom: 20, marginTop: 4, marginLeft: 4 }}>
                      {passValid ? '' : 'Password must be at least 6 characters'}
                    </Text>
                  )}

                  {/* Submit */}
                  <TouchableOpacity activeOpacity={0.8}
                    onPress={handleAuth}
                    disabled={!canSubmit || loading}
                    style={{
                      backgroundColor: canSubmit ? t.accent : t.fill, borderRadius: 14, paddingVertical: 16,
                      alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 4,
                    }}>
                    {loading && <ActivityIndicator size="small" color={canSubmit ? t.inv : t.hint} />}
                    <Text style={{ color: canSubmit ? t.inv : t.hint, fontSize: 16, fontFamily: 'Manrope_600SemiBold' }}>
                      {authMode === 'signup' ? 'Create Account' : 'Sign In'}
                    </Text>
                  </TouchableOpacity>

                  {/* ─── Toggle Sign In / Sign Up ─── */}
                  <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 32, gap: 4 }}>
                    <Text style={{ color: t.sub, fontSize: 14, fontFamily: 'Manrope_400Regular' }}>
                      {authMode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
                    </Text>
                    <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAuthMode(m => m === 'signup' ? 'signin' : 'signup'); }}>
                      <Text style={{ color: t.accent, fontSize: 14, fontFamily: 'Manrope_600SemiBold' }}>
                        {authMode === 'signup' ? 'Sign In' : 'Sign Up'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Footer */}
                  <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 20 }}>
                    <Text style={{ color: t.hint, fontSize: 11, fontFamily: 'Manrope_400Regular', textAlign: 'center', lineHeight: 16 }}>
                      By continuing, you agree to OneHealth's{'\n'}Terms of Service and Privacy Policy
                    </Text>
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
