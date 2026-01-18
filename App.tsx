import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppNavigator />
      {/* Status bar uses primary color defined in HomeScreen/AddEditScreen header */}
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}