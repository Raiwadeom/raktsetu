import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  AdminLogin: undefined;
  ForgotPassword: undefined;
  Terms: undefined;
  HelpAbout: undefined;
  Loading: undefined;
  CompleteProfile: { isEditing?: boolean } | undefined;
  VerificationPending: undefined;
  MainTabs: undefined;
  RequestDetail: { requestId: string };
  AdminDashboard: undefined;
  AdminUsers: undefined;
  AdminUserDetail: { uid: string };
  AdminRequests: undefined;
  AdminDonationForm: { preselectedUserId?: string } | undefined;
  AdminBroadcast: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  RequestDetail: { requestId: string };
  RequestBlood: undefined;
  MyRequests: undefined;
};

export type NotificationsStackParamList = {
  NotificationsMain: undefined;
  RequestDetail: { requestId: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  CompleteProfile: { isEditing?: boolean } | undefined;
  HelpAbout: undefined;
};

export type MainTabsParamList = {
  Home: undefined;
  Alerts: undefined;
  Profile: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, T>,
  BottomTabScreenProps<MainTabsParamList>
>;

export type NotificationsStackScreenProps<T extends keyof NotificationsStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<NotificationsStackParamList, T>,
    BottomTabScreenProps<MainTabsParamList>
  >;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, T>,
  BottomTabScreenProps<MainTabsParamList>
>;
