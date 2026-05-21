import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import ReportFlow from '@/components/flows/ReportFlow';
import { incrementReportCount, setFirstReportComplete } from '@/utils/storage';

const GREEN = '#0B6623';

export default function ReportModal() {
  const [submitted, setSubmitted] = useState(false);
  const [scaleAnim] = useState(() => new Animated.Value(0));

  const showSuccess = () => {
    setSubmitted(true);
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 6, tension: 80 }).start();
  };

  if (submitted) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: GREEN + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Ionicons name="checkmark-circle" size={42} color={GREEN} />
          </View>
          <Text style={{ fontSize: 22, fontFamily: 'Manrope_700Bold', color: '#111', marginBottom: 6 }}>Report Submitted!</Text>
          <Text style={{ fontFamily: 'Manrope_400Regular',  fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 }}>
            Thank you for helping your community stay healthy.
          </Text>
        </Animated.View>

        <View style={{ position: 'absolute', bottom: 50, left: 24, right: 24, gap: 10 }}>
          <TouchableOpacity activeOpacity={0.85}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
            style={{ backgroundColor: GREEN, borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}>
            <Text style={{ color: '#FFF', fontSize: 16, fontFamily: 'Manrope_600SemiBold' }}>Done</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSubmitted(false); }}
            style={{ paddingVertical: 12, alignItems: 'center' }}>
            <Text style={{ color: GREEN, fontSize: 14, fontFamily: 'Manrope_500Medium' }}>Submit Another</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
        style={{
          position: 'absolute', top: 54, left: 16, zIndex: 100,
          width: 30, height: 30, borderRadius: 15,
          backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center',
        }}>
        <Ionicons name="close" size={16} color="#111" />
      </TouchableOpacity>

      <ReportFlow
        onSignUp={() => {}}
        onSubmitComplete={async () => {
          await incrementReportCount();
          await setFirstReportComplete();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showSuccess();
        }}
      />
    </View>
  );
}
