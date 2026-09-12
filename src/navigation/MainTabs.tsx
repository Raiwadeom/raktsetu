import React, { useEffect, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/Text';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { watchUnreadCount } from '../services/notificationService';
import type { HomeStackParamList, MainTabsParamList, NotificationsStackParamList, ProfileStackParamList } from '../types/navigation';

import HomeScreen from '../screens/home/HomeScreen';
import RequestDetailScreen from '../screens/requests/RequestDetailScreen';
import RequestBloodScreen from '../screens/requests/RequestBloodScreen';
import MyRequestsScreen from '../screens/requests/MyRequestsScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import CompleteProfileScreen from '../screens/profile/CompleteProfileScreen';
import HelpAboutScreen from '../screens/HelpAboutScreen';

const Tab = createBottomTabNavigator<MainTabsParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const NotificationsStack = createNativeStackNavigator<NotificationsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

const headerOptions = {
  headerStyle: { backgroundColor: Colors.primary },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '600' as const },
};

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={headerOptions}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'Rakt Setu' }} />
      <HomeStack.Screen name="RequestDetail" component={RequestDetailScreen} options={{ title: 'Request Details' }} />
      <HomeStack.Screen name="RequestBlood" component={RequestBloodScreen} options={{ title: 'Request Blood' }} />
      <HomeStack.Screen name="MyRequests" component={MyRequestsScreen} options={{ title: 'My Requests' }} />
    </HomeStack.Navigator>
  );
}

function NotificationsStackNavigator() {
  return (
    <NotificationsStack.Navigator screenOptions={headerOptions}>
      <NotificationsStack.Screen name="NotificationsMain" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <NotificationsStack.Screen name="RequestDetail" component={RequestDetailScreen} options={{ title: 'Request Details' }} />
    </NotificationsStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={headerOptions}>
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={({ navigation }) => ({
          title: 'My Profile',
          headerRight: () => (
            <Pressable onPress={() => navigation.navigate('HelpAbout')} hitSlop={10} style={{ marginRight: 4 }}>
              <Ionicons name="help-circle-outline" size={24} color="#fff" />
            </Pressable>
          ),
        })}
      />
      <ProfileStack.Screen name="CompleteProfile" component={CompleteProfileScreen} options={{ title: 'Edit Profile' }} />
      <ProfileStack.Screen name="HelpAbout" component={HelpAboutScreen} options={{ title: 'Help & About' }} />
    </ProfileStack.Navigator>
  );
}

export default function MainTabs() {
  const { appUser } = useAuth();
  const [unread, setUnread] = useState(0);
  // Android 15 forces apps edge-to-edge, so the tab bar is drawn *under*
  // the system navigation bar unless we reserve its height ourselves. The
  // inset is 0 on full-gesture navigation and ~48dp with 3-button nav, so it
  // has to be measured rather than hardcoded per platform.
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!appUser) return undefined;
    return watchUnreadCount(appUser.uid, setUnread);
  }, [appUser?.uid]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 8,
          borderTopColor: Colors.divider,
          backgroundColor: Colors.surface,
        },
        tabBarLabelStyle: { fontSize: 11.5, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }) => <TabIcon name="home" color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={NotificationsStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="notifications" color={color} focused={focused} badge={unread} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }) => <TabIcon name="person" color={color} focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

/** Outline when inactive, solid when active — the standard iOS/Android tab
 *  convention, and far crisper than the emoji glyphs this used to render
 *  (those picked up the platform's own emoji font and ignored the tint color). */
function TabIcon({
  name, color, focused, badge,
}: { name: 'home' | 'notifications' | 'person'; color: string; focused: boolean; badge?: number }) {
  return (
    <View>
      <Ionicons name={focused ? name : (`${name}-outline` as const)} size={24} color={color} />
      {badge && badge > 0 ? (
        <View style={{
          position: 'absolute', top: -5, right: -10, backgroundColor: Colors.primary,
          borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
          paddingHorizontal: 4, borderWidth: 1.5, borderColor: Colors.surface,
        }}>
          <Text style={{ color: '#fff', fontSize: 10, lineHeight: 13, fontWeight: '700' }}>
            {badge > 9 ? '9+' : badge}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
