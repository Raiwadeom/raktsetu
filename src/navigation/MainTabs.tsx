import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
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
              <Text style={{ color: '#fff', fontSize: 20 }}>❓</Text>
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
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{ tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} /> }}
      />
      <Tab.Screen
        name="Alerts"
        component={NotificationsStackNavigator}
        options={{
          tabBarIcon: ({ color }) => <TabIcon icon="🔔" color={color} badge={unread} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{ tabBarIcon: ({ color }) => <TabIcon icon="👤" color={color} /> }}
      />
    </Tab.Navigator>
  );
}

function TabIcon({ icon, badge }: { icon: string; color?: string; badge?: number }) {
  return (
    <View>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      {badge && badge > 0 ? (
        <View style={{
          position: 'absolute', top: -4, right: -8, backgroundColor: Colors.primary,
          borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
        }}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </View>
  );
}
