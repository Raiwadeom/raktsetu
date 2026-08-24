import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from './Text';
import { Colors, Palette } from '../constants/theme';
import { timeAgo } from '../utils/formatters';
import type { AppNotification, NotificationTypeValue } from '../types/models';

const ICONS: Record<NotificationTypeValue, string> = {
  bloodMatch: '🩸',
  announcement: '📢',
  verification: '✅',
  general: '🔔',
};

const ICON_COLORS: Record<NotificationTypeValue, string> = {
  bloodMatch: Palette.red,
  announcement: Palette.blue,
  verification: Palette.green,
  general: Palette.purple,
};

export default function NotificationTile({
  notification,
  onPress,
}: {
  notification: AppNotification;
  onPress: () => void;
}) {
  const unread = !notification.isRead;
  const color = ICON_COLORS[notification.type] || Palette.purple;
  return (
    <Pressable onPress={onPress} style={[styles.row, unread && { backgroundColor: Colors.primary + '0A' }]}>
      <View style={[styles.icon, { backgroundColor: color + '1F' }]}>
        <Text style={{ fontSize: 18 }}>{ICONS[notification.type] || '🔔'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, unread && { fontWeight: '700' }]}>{notification.title}</Text>
        <Text style={styles.body}>{notification.body}</Text>
        <Text style={styles.time}>{timeAgo(notification.createdAt)}</Text>
      </View>
      {unread ? <View style={[styles.dot, { backgroundColor: color }]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', padding: 16, alignItems: 'flex-start' },
  icon: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  title: { fontSize: 14.5, color: Colors.textPrimary, fontWeight: '500' },
  body: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  time: { fontSize: 11.5, color: Colors.textSecondary, marginTop: 4 },
  dot: { width: 9, height: 9, borderRadius: 5, marginTop: 4, marginLeft: 6 },
});
