import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** Navigates to a request's detail screen from outside the React tree (e.g.
 * a notification-tap handler registered in App.tsx). No-ops if a route by
 * this name doesn't exist on whichever stack is currently mounted (e.g. the
 * admin is signed in, which has no RequestDetail screen).
 *
 * On a cold start (app launched by tapping a notification, not already
 * running), the navigator genuinely isn't mounted yet at the moment this is
 * first called — RootNavigator shows its own ~2.2s splash, plus auth-state
 * resolution, before the real stack exists. Retries briefly instead of
 * silently dropping the navigation intent; a warm/backgrounded-app tap is
 * already ready immediately and returns on the first check. */
export function navigateToRequestDetail(requestId: string) {
  const tryNavigate = (): boolean => {
    if (!navigationRef.isReady()) return false;
    try {
      navigationRef.navigate('RequestDetail', { requestId });
    } catch {
      // Current stack (e.g. admin) doesn't have this route — ignore.
    }
    return true;
  };

  if (tryNavigate()) return;

  const interval = setInterval(() => {
    if (tryNavigate()) clearInterval(interval);
  }, 300);
  setTimeout(() => clearInterval(interval), 15000);
}
