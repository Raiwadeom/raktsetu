import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { navigateToRequestDetail } from './src/navigation/navigationRef';
import { addNotificationResponseListener, getLastNotificationResponseRequestId } from './src/services/pushNotificationService';

// Keep the native splash (app.json's expo-splash-screen plugin) visible
// until we explicitly hide it below — otherwise it can flash away before
// our own custom animated SplashScreen component takes over, and before
// the custom fonts below are ready (which would otherwise show a visible
// system-font flash for a frame or two).
ExpoSplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (!fontsLoaded) return;

    // Our own RootNavigator renders a custom animated splash for its first
    // ~2.2s regardless of auth state, so the native (static) splash can be
    // handed off to it as soon as fonts are ready.
    ExpoSplashScreen.hideAsync().catch(() => undefined);

    // If the app was cold-started by tapping a notification, route straight
    // to that request once navigation is mounted.
    getLastNotificationResponseRequestId().then((requestId) => {
      if (requestId) navigateToRequestDetail(requestId);
    });

    const sub = addNotificationResponseListener((requestId) => {
      if (requestId) navigateToRequestDetail(requestId);
    });
    return () => sub.remove();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    // Native splash (from app.json) is still showing at this point.
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
