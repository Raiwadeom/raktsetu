import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Text from '../../components/Text';
import { Colors } from '../../constants/theme';
import { RequestStatus } from '../../constants/appConstants';
import { timeAgo } from '../../utils/formatters';
import { confirmAsync } from '../../utils/confirmDialog';
import { deleteRequest, updateStatus, watchAllRequests } from '../../services/bloodRequestService';
import BloodTypeBadge from '../../components/BloodTypeBadge';
import StatusChip from '../../components/StatusChip';
import { LoadingIndicator, EmptyState } from '../../components/LoadingIndicator';
import type { BloodRequest, RequestStatusValue } from '../../types/models';

export default function AdminRequestsScreen() {
  const [requests, setRequests] = useState<BloodRequest[] | null>(null);
  const [filter, setFilter] = useState<RequestStatusValue | null>(null);

  useEffect(() => watchAllRequests(setRequests), []);

  if (requests === null) return <LoadingIndicator />;

  const filtered = filter ? requests.filter((r) => r.status === filter) : requests;

  const confirmDelete = async (id: string) => {
    const ok = await confirmAsync(
      'Delete Request',
      'Delete this blood request permanently? This is meant for spam or fake requests.',
      'Delete',
    );
    if (ok) deleteRequest(id);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={{ paddingHorizontal: 16 }}>
        <Chip label="All" selected={!filter} onPress={() => setFilter(null)} />
        <Chip label="Pending" selected={filter === RequestStatus.pending} onPress={() => setFilter(RequestStatus.pending)} />
        <Chip label="Fulfilled" selected={filter === RequestStatus.fulfilled} onPress={() => setFilter(RequestStatus.fulfilled)} />
        <Chip label="Cancelled" selected={filter === RequestStatus.cancelled} onPress={() => setFilter(RequestStatus.cancelled)} />
      </ScrollView>

      {filtered.length === 0 ? (
        <EmptyState title="No requests found" />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <BloodTypeBadge bloodType={item.bloodType} size={36} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.patient}>{item.patientName}</Text>
                  <Text style={styles.meta}>{item.hospitalName} • {item.unitsRequired} unit(s)</Text>
                </View>
                <StatusChip status={item.status} />
              </View>
              <Text style={styles.metaSmall}>Requested by {item.requesterName} • {timeAgo(item.createdAt)}</Text>
              <Text style={styles.metaSmall}>Views: {item.viewCount} • Responded: {item.respondedUids.length}</Text>
              <View style={styles.actionsRow}>
                {item.status !== RequestStatus.fulfilled && (
                  <Pressable onPress={() => updateStatus(item.id, RequestStatus.fulfilled)}>
                    <Text style={[styles.actionText, { color: Colors.success }]}>Mark Fulfilled</Text>
                  </Pressable>
                )}
                {item.status !== RequestStatus.cancelled && (
                  <Pressable onPress={() => updateStatus(item.id, RequestStatus.cancelled)}>
                    <Text style={[styles.actionText, { color: Colors.warning }]}>Cancel</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => confirmDelete(item.id)}>
                  <Text style={[styles.actionText, { color: Colors.danger }]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, selected && styles.chipSelected]} onPress={onPress}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chipsRow: { flexGrow: 0, marginVertical: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#fff', marginRight: 8, borderWidth: 1, borderColor: Colors.divider },
  chipSelected: { backgroundColor: Colors.primary + '2A', borderColor: Colors.primary },
  chipText: { fontSize: 12, color: Colors.textSecondary },
  chipTextSelected: { color: Colors.primary, fontWeight: '600' },
  list: { padding: 12 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  patient: { fontWeight: '700', color: Colors.textPrimary },
  meta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  metaSmall: { fontSize: 11.5, color: Colors.textSecondary, marginTop: 6 },
  actionsRow: { flexDirection: 'row', gap: 16, marginTop: 10 },
  actionText: { fontWeight: '600', fontSize: 13 },
});
