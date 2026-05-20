import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

import { HapticTab } from '@/components/navigation/haptic-tab';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: { display: 'none' },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Report' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', href: null }} />
    </Tabs>
  );
}
