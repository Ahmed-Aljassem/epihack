import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { setAuth } from '@/utils/storage';
import { supabase } from '@/utils/supabase';

const t = {
  bg: '#FAFAFA', card: '#FFFFFF', text: '#111', sub: '#888',
  hint: '#B0B0B0', line: '#EEEEEE', fill: '#F2F2F2',
  accent: '#0B6623', accentSoft: '#F0F7F1', accentMid: '#D5E8D4',
  inv: '#FFF',
};

export default function AuthModal() {
  const { mode: initialMode } = useLocalSearchParams<{ mode: string }>();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const canSubmit = email.includes('@') && pass.length >= 6 && (!isSignUp || name.trim().length > 1);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: { data: { full_name: name.trim() } }
        });
        if (error) throw error;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Check your email for the confirmation link!');
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: pass,
        });
        if (error) throw error;
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (data.session) {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/');
          }
        }
      }
    } catch (err: any) {
      Alert.alert('Login Error', err.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const skip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }], flex: 1 }}>

              {/* Skip at top */}
              <TouchableOpacity activeOpacity={0.7} onPress={skip} style={{ alignSelf: 'flex-end', marginTop: 8, paddingVertical: 8, paddingLeft: 16 }}>
                <Text style={{ color: t.sub, fontSize: 14, fontFamily: 'Manrope_500Medium' }}>Skip</Text>
              </TouchableOpacity>

              {/* Logo */}
              <View style={{ alignItems: 'center', marginTop: 32, marginBottom: 48 }}>
                <Text style={{ fontFamily: 'Manrope_400Regular',  fontSize: 36, letterSpacing: -1.2 }}>
                  <Text style={{ color: t.hint, fontFamily: 'Manrope_300Light' }}>One</Text>
                  <Text style={{ color: t.accent, fontFamily: 'Manrope_800ExtraBold' }}>Health</Text>
                </Text>
              </View>

              {/* Name (Sign Up Only) */}
              {isSignUp && (
                <View style={{
                  backgroundColor: t.card, borderRadius: 14, paddingHorizontal: 16,
                  flexDirection: 'row', alignItems: 'center', marginBottom: 12,
                  borderWidth: 1.5, borderColor: 'transparent'
                }}>
                  <Ionicons name="person-outline" size={18} color={t.hint} style={{ marginRight: 10 }} />
                  <TextInput style={{ flex: 1, color: t.text, fontSize: 16, paddingVertical: 16, fontFamily: 'Manrope_500Medium' }}
                    placeholder="Full Name" placeholderTextColor={t.hint}
                    value={name} onChangeText={setName}
                    autoCapitalize="words" autoCorrect={false} />
                </View>
              )}

              {/* Email */}
              <View style={{
                backgroundColor: t.card, borderRadius: 14, paddingHorizontal: 16,
                flexDirection: 'row', alignItems: 'center', marginBottom: 12,
                borderWidth: 1.5, borderColor: 'transparent'
              }}>
                <Ionicons name="mail-outline" size={18} color={t.hint} style={{ marginRight: 10 }} />
                <TextInput style={{ flex: 1, color: t.text, fontSize: 16, paddingVertical: 16, fontFamily: 'Manrope_500Medium' }}
                  placeholder="Email" placeholderTextColor={t.hint}
                  value={email} onChangeText={setEmail}
                  keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
              </View>

              {/* Password */}
              <View style={{
                backgroundColor: t.card, borderRadius: 14, paddingHorizontal: 16,
                flexDirection: 'row', alignItems: 'center', marginBottom: 24,
                borderWidth: 1.5, borderColor: 'transparent'
              }}>
                <Ionicons name="lock-closed-outline" size={18} color={t.hint} style={{ marginRight: 10 }} />
                <TextInput style={{ flex: 1, color: t.text, fontSize: 16, paddingVertical: 16, fontFamily: 'Manrope_500Medium' }}
                  placeholder="Password" placeholderTextColor={t.hint}
                  value={pass} onChangeText={setPass}
                  secureTextEntry={!showPass} autoCapitalize="none" />
                <TouchableOpacity onPress={() => setShowPass(p => !p)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={t.hint} />
                </TouchableOpacity>
              </View>

              {/* Sign In / Sign Up Button */}
              <TouchableOpacity activeOpacity={0.8} onPress={handleSubmit} disabled={!canSubmit || loading} style={{
                backgroundColor: canSubmit && !loading ? t.accent : t.fill, borderRadius: 14, paddingVertical: 16, alignItems: 'center',
              }}>
                <Text style={{ color: canSubmit && !loading ? t.inv : t.hint, fontSize: 16, fontFamily: 'Manrope_600SemiBold' }}>
                  {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.7} onPress={() => setIsSignUp(!isSignUp)} style={{ marginTop: 16, alignItems: 'center' }}>
                <Text style={{ color: t.sub, fontSize: 14, fontFamily: 'Manrope_500Medium' }}>
                  {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                  <Text style={{ color: t.accent, fontFamily: 'Manrope_600SemiBold' }}>
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </Text>
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 24 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: t.line }} />
                <Text style={{ fontFamily: 'Manrope_400Regular',  color: t.hint, fontSize: 12, marginHorizontal: 14 }}>or</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: t.line }} />
              </View>

              {/* Social icons + Anonymous */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
                <TouchableOpacity activeOpacity={0.7} onPress={handleSubmit} style={{
                  width: 56, height: 56, borderRadius: 16, backgroundColor: t.card,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="logo-apple" size={24} color={t.text} />
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} onPress={handleSubmit} style={{
                  width: 56, height: 56, borderRadius: 16, backgroundColor: t.card,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Svg width={24} height={24} viewBox="0 0 48 48">
                    <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </Svg>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} onPress={handleSubmit} style={{
                  width: 56, height: 56, borderRadius: 16, backgroundColor: t.card,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="logo-facebook" size={26} color="#1877F2" />
                </TouchableOpacity>
              </View>

            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
