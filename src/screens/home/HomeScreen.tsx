import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Text from '../../components/Text';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { watchOpenRequests } from '../../services/bloodRequestService';
import BloodTypeBadge from '../../components/BloodTypeBadge';
import RequestCard from '../../components/RequestCard';
import { LoadingIndicator, EmptyState } from '../../components/LoadingIndicator';
import type { BloodRequest } from '../../types/models';
import type { HomeStackScreenProps } from '../../types/navigation';

export default function HomeScreen({ navigation }: HomeStackScreenProps<'HomeMain'>) {
  const { appUser } = useAuth();
  const [requests, setRequests] = useState<BloodRequest[] | null>(null);

  useEffect(() => watchOpenRequests(setRequests), []);

  const firstName = appUser?.fullName ? appUser.fullName.split(' ')[0] : 'there';

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={styles.container}
      data={requests || []}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={{ marginBottom: 10 }}>
          <RequestCard request={item} onPress={() => navigation.navigate('RequestDetail', { requestId: item.id })} />
        </View>
      )}
      ListHeaderComponent={
        <>
          <View style={styles.heroCard}>
            <BloodTypeBadge bloodType={appUser?.bloodType || ''} size={52} />
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={styles.heroGreeting}>Hi, {firstName} 👋</Text>
              <Text style={styles.heroSubtitle}>
                {appUser?.bloodType ? `Your blood type: ${appUser.bloodType}` : 'Complete your profile to get matched'}
              </Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <ActionTile icon="🩸" label="Request Blood" onPress={() => navigation.navigate('RequestBlood')} />
            <ActionTile icon="📋" label="My Requests" onPress={() => navigation.navigate('MyRequests')} />
          </View>

          <Text style={styles.sectionTitle}>Open Blood Requests</Text>
          {requests === null ? <LoadingIndicator /> : null}
          {requests && requests.length === 0 ? (
            <EmptyState title="No active blood requests" subtitle="When someone posts a request, it will show up here." />
          ) : null}
        </>
      }
    />
  );
}

function ActionTile({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.actionTile} onPress={onPress}>
      <Text style={{ fontSize: 26 }}>{icon}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 100 },
  heroCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary,
    borderRadius: 16, padding: 18, marginBottom: 16,
  },
  heroGreeting: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  heroSubtitle: { color: '#ffffffb3', fontSize: 13, marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionTile: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 18, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  actionLabel: { fontWeight: '600', fontSize: 13, marginTop: 8, color: Colors.textPrimary },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: Colors.textPrimary },
});
