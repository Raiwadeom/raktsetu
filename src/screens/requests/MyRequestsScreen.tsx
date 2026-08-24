import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { watchMyRequests } from '../../services/bloodRequestService';
import RequestCard from '../../components/RequestCard';
import { LoadingIndicator, EmptyState } from '../../components/LoadingIndicator';
import type { BloodRequest } from '../../types/models';
import type { HomeStackScreenProps } from '../../types/navigation';

export default function MyRequestsScreen({ navigation }: HomeStackScreenProps<'MyRequests'>) {
  const { appUser } = useAuth();
  const [requests, setRequests] = useState<BloodRequest[] | null>(null);

  useEffect(() => {
    if (!appUser) return undefined;
    return watchMyRequests(appUser.uid, setRequests);
  }, [appUser?.uid]);

  if (requests === null) return <LoadingIndicator />;
  if (requests.length === 0) {
    return <EmptyState title="You haven't posted any requests" subtitle="Requests you post will appear here with their status." />;
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={styles.container}
      data={requests}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={{ marginBottom: 10 }}>
          <RequestCard request={item} onPress={() => navigation.navigate('RequestDetail', { requestId: item.id })} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({ container: { padding: 16 } });
