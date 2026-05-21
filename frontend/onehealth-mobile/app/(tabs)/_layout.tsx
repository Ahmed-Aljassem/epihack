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
          borderTopWidth: 0.5,
          borderTopColor: '#EEEEEE',
          height: 84,
          paddingBottom: 28,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500', marginTop: 2 },
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
          <TouchableOpacity activeOpacity={0.85}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/report-modal'); }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', top: -6 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="add" size={24} color="#FFF" />
            </View>
          </TouchableOpacity>
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
