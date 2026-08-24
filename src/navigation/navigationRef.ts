import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** Navigates to a request's detail screen from outside the React tree (e.g.
 * a notification-tap handler registered in App.tsx). No-ops if a route by
 * this name doesn't exist on whichever stack is currently mounted (e.g. the
 * admin is signed in, which has no RequestDetail screen). */
export function navigateToRequestDetail(requestId: string) {
  if (!navigationRef.isReady()) return;
  try {
    navigationRef.navigate('RequestDetail', { requestId });
  } catch {
    // Current stack (e.g. admin) doesn't have this route — ignore.
  }
}
