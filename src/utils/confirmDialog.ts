import { Alert, Platform } from 'react-native';

/**
 * Cross-platform confirm dialog. react-native-web's Alert.alert does not
 * reliably wire up multi-button `onPress` callbacks (varies by RN Web
 * version, but commonly the buttons array is ignored or only a single OK
 * is shown) — every screen that used Alert.alert(title, message, [Cancel,
 * Confirm]) directly for a destructive action was silently non-functional
 * on the web build. window.confirm is the reliable equivalent on web.
 */
export function confirmAsync(
  title: string,
  message: string,
  confirmLabel = 'Confirm',
  destructive = true,
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(
      typeof window !== 'undefined' ? window.confirm(`${title}\n\n${message}`) : false,
    );
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
