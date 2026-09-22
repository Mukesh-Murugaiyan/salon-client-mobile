import React from 'react';
import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0284C7',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: '#F3F4F6',
        },
      }}
    >
      <Stack.Screen
        name="dashboard"
        options={{
          title: 'Salon Dashboard',
          headerShown: false, // Custom header inside Dashboard
        }}
      />
      <Stack.Screen
        name="appointments"
        options={{
          title: "Today's Appointments",
          headerBackTitle: 'Dashboard',
        }}
      />
    </Stack>
  );
}
