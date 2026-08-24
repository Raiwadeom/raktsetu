// firebase/auth's package.json has a flat (non-conditional) "typings" entry
// that doesn't route through its React Native export condition, so
// TypeScript can't see getReactNativePersistence even though it's genuinely
// exported at runtime (Metro *does* resolve the "react-native" condition
// correctly — this is a static-analysis gap only). Augment the module
// declaration so the real, working import type-checks.
export {};

declare module 'firebase/auth' {
  export function getReactNativePersistence(
    storage: unknown,
  ): import('firebase/auth').Persistence;
}
