import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Animated, Dimensions, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import ReportFlow from '@/components/flows/ReportFlow';

const { width } = Dimensions.get('window');
const GREEN = '#0B6623';
const LIGHT_GREEN = '#E8F5E9';

// ═══════════════════════════════════════════════════════════════
export default function HomeScreen() {
  const [phase, setPhase] = useState<'splash' | 'app' | 'login'>('splash');

  // ─── Splash ─────────────────────────────────────
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(12)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;
  const pulse1 = useRef(new Animated.Value(0.5)).current;
  const pulse2 = useRef(new Animated.Value(0.3)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse1, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse1, { toValue: 0.5, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(pulse2, { toValue: 0.8, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse2, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(textSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
    Animated.sequence([
      Animated.delay(900),
      Animated.timing(tagOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.delay(2600),
      Animated.timing(screenOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => setPhase('app'));
  }, []);

  if (phase === 'app') return <ReportFlow onSignUp={() => setPhase('login')} />;

  if (phase === 'login') return <LoginScreen onContinue={() => setPhase('app')} />;

  // ─── Splash render ──────────────────────────────
  return (
    <Animated.View style={{
      flex: 1, backgroundColor: '#FAFAFA', alignItems: 'center',
      justifyContent: 'center', opacity: screenOpacity,
    }}>
      <StatusBar style="dark" />
      <Animated.View style={{
        position: 'absolute', width: 140, height: 140, borderRadius: 70,
        backgroundColor: LIGHT_GREEN, opacity: pulse2, transform: [{ scale: pulse2 }],
      }} />
      <Animated.View style={{
        position: 'absolute', width: 100, height: 100, borderRadius: 50,
        backgroundColor: LIGHT_GREEN, opacity: pulse1, transform: [{ scale: pulse1 }],
      }} />
      <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textSlide }] }}>
        <Text style={{ fontSize: 42, letterSpacing: -1.5, textAlign: 'center' }}>
          <Text style={{ color: '#BBB', fontWeight: '300' }}>One</Text>
          <Text style={{ color: GREEN, fontWeight: '800' }}>Health</Text>
        </Text>
      </Animated.View>
      <Animated.View style={{ opacity: tagOpacity, marginTop: 8 }}>
        <Text style={{ color: '#AAA', fontSize: 13, fontWeight: '400', letterSpacing: 0.3 }}>
          Participatory Health Surveillance
        </Text>
      </Animated.View>
      <Animated.View style={{ position: 'absolute', bottom: 56, opacity: tagOpacity, alignItems: 'center' }}>
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: GREEN, marginBottom: 12, opacity: 0.5 }} />
        <Text style={{ color: '#CCC', fontSize: 10, fontWeight: '500', letterSpacing: 1.5, textTransform: 'uppercase' }}>
          EpiHack'26 · Arizona
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════
function LoginScreen({ onContinue }: { onContinue: () => void }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const tap = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onContinue(); };

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }], flex: 1 }}>

              {/* Skip at top */}
              <TouchableOpacity activeOpacity={0.7} onPress={tap} style={{ alignSelf: 'flex-end', marginTop: 8, paddingVertical: 8, paddingLeft: 16 }}>
                <Text style={{ color: '#999', fontSize: 14, fontWeight: '500' }}>Skip</Text>
              </TouchableOpacity>

              {/* Logo */}
              <View style={{ alignItems: 'center', marginTop: 32, marginBottom: 48 }}>
                <Text style={{ fontSize: 36, letterSpacing: -1.2 }}>
                  <Text style={{ color: '#BBB', fontWeight: '300' }}>One</Text>
                  <Text style={{ color: GREEN, fontWeight: '800' }}>Health</Text>
                </Text>
              </View>

              {/* Email */}
              <View style={{
                backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 16,
                flexDirection: 'row', alignItems: 'center', marginBottom: 10,
              }}>
                <Ionicons name="mail-outline" size={16} color="#C0C0C0" style={{ marginRight: 10 }} />
                <TextInput style={{ flex: 1, color: '#111', fontSize: 15, paddingVertical: 14 }}
                  placeholder="Email" placeholderTextColor="#C0C0C0"
                  value={email} onChangeText={setEmail}
                  keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
              </View>

              {/* Password */}
              <View style={{
                backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 16,
                flexDirection: 'row', alignItems: 'center', marginBottom: 20,
              }}>
                <Ionicons name="lock-closed-outline" size={16} color="#C0C0C0" style={{ marginRight: 10 }} />
                <TextInput style={{ flex: 1, color: '#111', fontSize: 15, paddingVertical: 14 }}
                  placeholder="Password" placeholderTextColor="#C0C0C0"
                  value={pass} onChangeText={setPass}
                  secureTextEntry={!showPass} autoCapitalize="none" />
                <TouchableOpacity onPress={() => setShowPass(p => !p)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="#C0C0C0" />
                </TouchableOpacity>
              </View>

              {/* Sign In */}
              <TouchableOpacity activeOpacity={0.8} onPress={tap} style={{
                backgroundColor: GREEN, borderRadius: 14, paddingVertical: 15, alignItems: 'center',
              }}>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Sign In</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: '#EBEBEB' }} />
                <Text style={{ color: '#CCC', fontSize: 11, marginHorizontal: 14 }}>or</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: '#EBEBEB' }} />
              </View>

              {/* Social icons + Anonymous */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
                <TouchableOpacity activeOpacity={0.7} onPress={tap} style={{
                  width: 52, height: 52, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E5E5',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="logo-apple" size={22} color="#111" />
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} onPress={tap} style={{
                  width: 52, height: 52, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E5E5',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="logo-google" size={20} color="#444" />
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} onPress={tap} style={{
                  width: 52, height: 52, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E5E5',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                    <Path d="M17.5,12 C19.9852814,12 22,14.0147186 22,16.5 C22,18.9852814 19.9852814,21 17.5,21 C15.3591076,21 13.5674006,19.5049595 13.1119514,17.5019509 L10.8880486,17.5019509 C10.4325994,19.5049595 8.64089238,21 6.5,21 C4.01471863,21 2,18.9852814 2,16.5 C2,14.0147186 4.01471863,12 6.5,12 C8.81637876,12 10.7239814,13.7501788 10.9725684,16.000297 L13.0274316,16.000297 C13.2760186,13.7501788 15.1836212,12 17.5,12 Z M6.5,13.5 C4.84314575,13.5 3.5,14.8431458 3.5,16.5 C3.5,18.1568542 4.84314575,19.5 6.5,19.5 C8.15685425,19.5 9.5,18.1568542 9.5,16.5 C9.5,14.8431458 8.15685425,13.5 6.5,13.5 Z M17.5,13.5 C15.8431458,13.5 14.5,14.8431458 14.5,16.5 C14.5,18.1568542 15.8431458,19.5 17.5,19.5 C19.1568542,19.5 20.5,18.1568542 20.5,16.5 C20.5,14.8431458 19.1568542,13.5 17.5,13.5 Z M12,9.25 C15.3893368,9.25 18.5301001,9.58954198 21.4217795,10.2699371 C21.8249821,10.3648083 22.0749341,10.7685769 21.9800629,11.1717795 C21.8851917,11.5749821 21.4814231,11.8249341 21.0782205,11.7300629 C18.3032332,11.0771247 15.2773298,10.75 12,10.75 C8.72267018,10.75 5.69676679,11.0771247 2.9217795,11.7300629 C2.51857691,11.8249341 2.11480832,11.5749821 2.01993712,11.1717795 C1.92506593,10.7685769 2.17501791,10.3648083 2.5782205,10.2699371 C5.46989988,9.58954198 8.61066315,9.25 12,9.25 Z M15.7002538,3.25 C16.7230952,3.25 17.6556413,3.81693564 18.1297937,4.71158956 L18.2132356,4.88311922 L19.6853587,8.19539615 C19.8535867,8.57390929 19.683117,9.0171306 19.3046038,9.18535866 C18.9576335,9.33956772 18.5562903,9.20917654 18.3622308,8.89482229 L18.3146413,8.80460385 L16.8425183,5.49232692 C16.6601304,5.08195418 16.2735894,4.80422037 15.8336777,4.75711483 L15.7002538,4.75 L8.29974618,4.75 C7.85066809,4.75 7.43988259,4.99042719 7.21817192,5.37329225 L7.15748174,5.49232692 L5.68535866,8.80460385 C5.5171306,9.18311699 5.07390929,9.35358672 4.69539615,9.18535866 C4.34842577,9.03114961 4.17626965,8.64586983 4.27956492,8.29117594 L4.31464134,8.19539615 L5.78676442,4.88311922 C6.20217965,3.94843495 7.09899484,3.32651789 8.10911143,3.25658537 L8.29974618,3.25 L15.7002538,3.25 Z" fill="#444" fillRule="nonzero" />
                  </Svg>
                </TouchableOpacity>
              </View>

            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
