import { Tabs } from 'expo-router';
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

const GREEN = '#0B6623';
const MUTED = '#B0B0B0';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: GREEN,
        tabBarInactiveTintColor: MUTED,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: 88,
          paddingBottom: 30,
          paddingTop: 8,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.04,
          shadowRadius: 12,
        },
        tabBarLabelStyle: { fontSize: 10, fontFamily: 'Manrope_600SemiBold', marginTop: 2 },
      }}
    >
      <Tabs.Screen name="index" options={{
        title: 'Home',
        tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={21} color={color} />,
      }} />
      <Tabs.Screen name="map" options={{
        title: 'Map',
        tabBarIcon: ({ color }) => <Ionicons name="map-outline" size={21} color={color} />,
      }} />
      <Tabs.Screen name="report-tab" options={{
        title: '',
        tabBarButton: () => (
          <View style={{ flex: 1, alignItems: 'center' }}>
            <TouchableOpacity activeOpacity={0.85}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/report-modal'); }}
              style={{
                top: -22,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: GREEN,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
                elevation: 6,
              }}>
              <View style={{
                width: 60, height: 60, borderRadius: 30,
                backgroundColor: GREEN,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 4, borderColor: '#FAFAFA'
              }}>
                <Ionicons name="add" size={32} color="#FFF" />
              </View>
            </TouchableOpacity>
          </View>
        ),
      }} />
      <Tabs.Screen name="community" options={{
        title: 'Community',
        tabBarIcon: ({ color }) => <Ionicons name="chatbubbles-outline" size={21} color={color} />,
      }} />
      <Tabs.Screen name="profile" options={{
        title: 'Profile',
        tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={21} color={color} />,
      }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
