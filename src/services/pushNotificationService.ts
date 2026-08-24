import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Show notifications with a banner + sound while the app is in the
// foreground (by default Expo suppresses the OS banner for a foregrounded app).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Requests notification permission and returns this device's Expo push
 * token, or null if permission was denied or this is a simulator/emulator
 * without push capability. The token is what the shared Cloud Function
 * (functions/src/index.ts) uses to send pushes via Expo's push API
 * (https://exp.host/--/api/v2/push/send) — no FCM/APNs setup needed on
 * the client side at all.
 *
 * NOTE: Expo Go on SDK 53+ no longer supports *receiving* remote push
 * notifications (Android) — see README → "Testing push notifications" for
 * the development-build workaround. Local/foreground notification display
 * and everything else in this app works fine in Expo Go regardless.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device (or platform that supports them).');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Rakt Setu Notifications',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#B71C1C',
    });
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return tokenResponse.data;
  } catch (e) {
    console.warn('Failed to get Expo push token:', e);
    return null;
  }
}

export function addNotificationResponseListener(
  handler: (requestId: string | undefined) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as { requestId?: string } | undefined;
    handler(data?.requestId);
  });
}

export async function getLastNotificationResponseRequestId(): Promise<string | undefined> {
  const response = await Notifications.getLastNotificationResponseAsync();
  const data = response?.notification.request.content.data as { requestId?: string } | undefined;
  return data?.requestId;
}
