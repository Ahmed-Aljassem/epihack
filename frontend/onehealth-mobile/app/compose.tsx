import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

const GREEN = '#0B6623';
const TEXT = '#111111';
const SUB = '#777777';
const HINT = '#B0B0B0';
const LINE = '#F0F0F0';
const FILL = '#F5F5F5';

export default function ComposeScreen() {
  const [text, setText] = useState('');

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}>
              <Ionicons name="close" size={22} color={TEXT} />
            </TouchableOpacity>
            <TouchableOpacity disabled={!text.trim()} onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.back(); }}
              style={{ backgroundColor: text.trim() ? GREEN : FILL, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 8 }}>
              <Text style={{ color: text.trim() ? '#FFF' : HINT, fontSize: 14, fontFamily: 'Manrope_600SemiBold' }}>Post</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, paddingHorizontal: 20 }}>
            <TextInput style={{ color: TEXT, fontSize: 16, lineHeight: 24, flex: 1, textAlignVertical: 'top' }}
              placeholder="What are you noticing in your area?"
              placeholderTextColor={HINT} value={text} onChangeText={setText} multiline autoFocus />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 0.5, borderColor: LINE }}>
            <TouchableOpacity onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <Ionicons name="camera-outline" size={20} color={HINT} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Ionicons name="location" size={10} color={HINT} />
              <Text style={{ fontFamily: 'Manrope_400Regular',  color: HINT, fontSize: 12 }}>85719</Text>
            </View>
            <View style={{ flex: 1 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Ionicons name="lock-closed-outline" size={10} color={HINT} />
              <Text style={{ fontFamily: 'Manrope_400Regular',  color: HINT, fontSize: 11 }}>Anonymous</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
