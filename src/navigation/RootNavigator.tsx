import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { navigationRef } from './navigationRef';
import type { RootStackParamList } from '../types/navigation';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import AdminLoginScreen from '../screens/auth/AdminLoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import TermsScreen from '../screens/auth/TermsScreen';
import HelpAboutScreen from '../screens/HelpAboutScreen';
import CompleteProfileScreen from '../screens/profile/CompleteProfileScreen';
import VerificationPendingScreen from '../screens/profile/VerificationPendingScreen';
import MainTabs from './MainTabs';
import RequestDetailScreen from '../screens/requests/RequestDetailScreen';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminUserDetailScreen from '../screens/admin/AdminUserDetailScreen';
import AdminRequestsScreen from '../screens/admin/AdminRequestsScreen';
import AdminDonationFormScreen from '../screens/admin/AdminDonationFormScreen';
import AdminBroadcastScreen from '../screens/admin/AdminBroadcastScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const headerOptions = {
  headerStyle: { backgroundColor: Colors.primary },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '600' as const },
};

export default function RootNavigator() {
  const { status, isSignedIn, isAdmin, needsProfileCompletion, needsVerification, appUser } = useAuth();
  const [minSplashElapsed, setMinSplashElapsed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinSplashElapsed(true), 2200);
    return () => clearTimeout(t);
  }, []);

  if (status === 'unknown' || !minSplashElapsed) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={headerOptions}>
        {/* Every branch below is wrapped in a Stack.Group with its own
            `navigationKey`. This is load-bearing, not cosmetic: when the
            rendered screen set changes, StackRouter.getStateForRouteNamesChange
            KEEPS any existing route whose name still exists in the new set —
            it only drops routes whose name disappeared or whose navigationKey
            changed. `CompleteProfile` deliberately appears in two branches
            (mandatory onboarding, and "Edit Profile" from VerificationPending),
            so without distinct keys the router considered the currently-focused
            CompleteProfile route still valid after `profileComplete` flipped
            true and simply left the user sitting on it — the Save & Continue
            transition to VerificationPending silently never happened. (A cold
            restart "fixed" it only because the navigator then initialised from
            scratch onto the group's first screen.) Distinct per-branch keys
            make the router discard routes carried over from a different branch
            and fall back to that branch's first screen. */}
        {!isSignedIn ? (
          <Stack.Group navigationKey="auth">
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Create Account' }} />
            <Stack.Screen name="AdminLogin" component={AdminLoginScreen} options={{ title: 'Admin Login' }} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Reset Password' }} />
            <Stack.Screen name="Terms" component={TermsScreen} options={{ title: 'Terms & Conditions' }} />
            <Stack.Screen name="HelpAbout" component={HelpAboutScreen} options={{ title: 'Help & About' }} />
          </Stack.Group>
        ) : appUser === null ? (
          <Stack.Group navigationKey="loading">
            <Stack.Screen name="Loading" component={SplashScreen} options={{ headerShown: false }} />
          </Stack.Group>
        ) : isAdmin ? (
          <Stack.Group navigationKey="admin">
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Admin Dashboard' }} />
            <Stack.Screen name="AdminUsers" component={AdminUsersScreen} options={{ title: 'User Management' }} />
            <Stack.Screen name="AdminUserDetail" component={AdminUserDetailScreen} options={{ title: 'User Details' }} />
            <Stack.Screen name="AdminRequests" component={AdminRequestsScreen} options={{ title: 'Blood Requests' }} />
            <Stack.Screen name="AdminDonationForm" component={AdminDonationFormScreen} options={{ title: 'Add Donation Record' }} />
            <Stack.Screen name="AdminBroadcast" component={AdminBroadcastScreen} options={{ title: 'Broadcast Announcement' }} />
          </Stack.Group>
        ) : needsProfileCompletion ? (
          <Stack.Group navigationKey="onboarding">
            <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} options={{ title: 'Complete Your Profile', headerLeft: () => null }} />
          </Stack.Group>
        ) : needsVerification ? (
          <Stack.Group navigationKey="verification">
            <Stack.Screen
              name="VerificationPending"
              component={VerificationPendingScreen}
              options={{ title: 'Verification Pending', headerLeft: () => null }}
            />
            <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} options={{ title: 'Edit Profile' }} />
          </Stack.Group>
        ) : (
          <Stack.Group navigationKey="main">
            <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="RequestDetail" component={RequestDetailScreen} options={{ title: 'Request Details' }} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
