import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
  // id of the request currently being written to, so its row shows progress
  // and cannot be double-tapped into two conflicting writes.
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => watchAllRequests(setRequests), []);

  if (requests === null) return <LoadingIndicator />;

  const filtered = filter ? requests.filter((r) => r.status === filter) : requests;

  // These were fire-and-forget: a rejected write (offline, or rules) surfaced
  // as nothing at all - the row simply never changed.
  const setStatus = async (id: string, status: RequestStatusValue) => {
    setBusyId(id);
    try {
      await updateStatus(id, status);
    } catch (e) {
      Alert.alert('Could not update request', (e as Error).message || 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async (id: string) => {
    const ok = await confirmAsync(
      'Delete Request',
      'Delete this blood request permanently? This is meant for spam or fake requests.',
      'Delete',
    );
    if (!ok) return;
    setBusyId(id);
    try {
      await deleteRequest(id);
    } catch (e) {
      Alert.alert('Could not delete request', (e as Error).message || 'Please try again.');
    } finally {
      setBusyId(null);
    }
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
                {busyId === item.id ? (
                  <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 4 }} />
                ) : (
                  <>
                    {item.status !== RequestStatus.fulfilled && (
                      <Action
                        label="Mark Fulfilled"
                        color={Colors.success}
                        onPress={() => setStatus(item.id, RequestStatus.fulfilled)}
                      />
                    )}
                    {item.status !== RequestStatus.cancelled && (
                      <Action
                        label="Cancel"
                        color={Colors.warning}
                        onPress={() => setStatus(item.id, RequestStatus.cancelled)}
                      />
                    )}
                    <Action label="Delete" color={Colors.danger} onPress={() => confirmDelete(item.id)} />
                  </>
                )}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

/** The bare <Text> these used to be gave a ~16px tap target with no pressed
 *  state - easy to miss, and no feedback when you did hit it. */
function Action({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <Pressable
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.5 }]}
    >
      <Text style={[styles.actionText, { color }]}>{label}</Text>
    </Pressable>
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
  chipsRow: { flexGrow: 0, marginVertical: 10, paddingVertical: 2 },
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
  actionsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  actionBtn: { paddingVertical: 6, paddingRight: 12 },
  actionText: { fontWeight: '600', fontSize: 13, lineHeight: 18 },
});
