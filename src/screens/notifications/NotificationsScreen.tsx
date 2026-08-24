import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Text from '../../components/Text';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { markAllAsRead, markAsRead, watchNotifications } from '../../services/notificationService';
import NotificationTile from '../../components/NotificationTile';
import { LoadingIndicator, EmptyState } from '../../components/LoadingIndicator';
import type { AppNotification } from '../../types/models';
import type { NotificationsStackScreenProps } from '../../types/navigation';

export default function NotificationsScreen({ navigation }: NotificationsStackScreenProps<'NotificationsMain'>) {
  const { appUser } = useAuth();
  const [items, setItems] = useState<AppNotification[] | null>(null);

  useEffect(() => {
    if (!appUser) return undefined;
    return watchNotifications(appUser.uid, setItems);
  }, [appUser?.uid]);

  useEffect(() => {
    const uid = appUser?.uid;
    navigation.setOptions({
      headerRight: () =>
        items && items.some((n) => !n.isRead) && uid ? (
          <Pressable
            onPress={() => markAllAsRead(uid, items.filter((n) => !n.isRead).map((n) => n.id))}
            hitSlop={8}
          >
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        ) : null,
    });
  }, [navigation, items, appUser?.uid]);

  if (items === null) return <LoadingIndicator />;
  if (items.length === 0) {
    return <EmptyState title="No notifications yet" subtitle="Blood match alerts and announcements will appear here." />;
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: '#fff' }}
      data={items}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => (
        <NotificationTile
          notification={item}
          onPress={() => {
            if (!item.isRead && appUser) markAsRead(appUser.uid, item.id);
            if (item.relatedRequestId) {
              navigation.navigate('RequestDetail', { requestId: item.relatedRequestId });
            }
          }}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  separator: { height: 1, backgroundColor: Colors.divider },
  markAllText: { color: '#fff', fontSize: 13, fontWeight: '600', marginRight: 16 },
});
