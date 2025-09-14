import { Stack } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="contacts" />
      <Stack.Screen name="search" />
      <Stack.Screen name="export" />
      <Stack.Screen name="explore" />
    </Stack>
  );
}
