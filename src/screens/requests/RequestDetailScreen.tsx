import React, { useEffect, useRef, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import Text from '../../components/Text';
import { Colors } from '../../constants/theme';
import { RequestStatus } from '../../constants/appConstants';
import { formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { incrementView, markResponded, watchRequest } from '../../services/bloodRequestService';
import BloodTypeBadge from '../../components/BloodTypeBadge';
import StatusChip from '../../components/StatusChip';
import PrimaryButton from '../../components/PrimaryButton';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import type { BloodRequest } from '../../types/models';

interface Props {
  route: { params: { requestId: string } };
}

export default function RequestDetailScreen({ route }: Props) {
  const { requestId } = route.params;
  const { appUser } = useAuth();
  const [request, setRequest] = useState<BloodRequest | null | undefined>(undefined);
  const viewCounted = useRef(false);

  useEffect(() => watchRequest(requestId, setRequest), [requestId]);

  useEffect(() => {
    if (request && appUser && request.requesterUid !== appUser.uid && !viewCounted.current) {
      viewCounted.current = true;
      incrementView(request.id);
    }
  }, [request, appUser]);

  if (request === undefined) return <LoadingIndicator />;
  if (request === null) {
    return (
      <View style={styles.center}>
        <Text>This request no longer exists.</Text>
      </View>
    );
  }

  const isOwner = request.requesterUid === appUser?.uid;

  const callDonor = async () => {
    if (appUser) markResponded(request.id, appUser.uid);
    const url = `tel:${request.contactNumber}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert('Unable to call', 'Unable to open the dialer on this device.');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background }} contentContainerStyle={styles.container}>
      <View style={[styles.card, styles.heroCard]}>
        <BloodTypeBadge bloodType={request.bloodType} size={64} />
        <Text style={styles.heading}>{request.bloodType} needed — {request.unitsRequired} unit(s)</Text>
        <View style={{ marginTop: 8 }}><StatusChip status={request.status} /></View>
      </View>

      <View style={styles.card}>
        <Row label="Patient" value={request.patientName} />
        <Divider />
        <Row label="Hospital" value={request.hospitalName} />
        <Divider />
        <Row label="Location" value={request.location} />
        <Divider />
        <Row label="Posted by" value={request.requesterName} />
        <Divider />
        <Row label="Posted" value={formatDateTime(request.createdAt)} />
      </View>

      {isOwner ? (
        <View style={[styles.card, styles.heroCard]}>
          <Text style={styles.statsTitle}>Response Stats</Text>
          <View style={styles.statsRow}>
            <Stat label="Views" value={request.viewCount} />
            <Stat label="Responded" value={request.respondedUids.length} />
          </View>
        </View>
      ) : request.status === RequestStatus.pending ? (
        <PrimaryButton label="📞 Can you help? Call Now" onPress={callDonor} style={{ marginTop: 4 }} />
      ) : null}
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}
function Divider() {
  return <View style={{ height: 1, backgroundColor: Colors.divider, marginVertical: 12 }} />;
}
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 16,
  },
  heroCard: { alignItems: 'center' },
  heading: { fontSize: 18, fontWeight: 'bold', marginTop: 10, textAlign: 'center', color: Colors.textPrimary },
  rowLabel: { fontSize: 12, color: Colors.textSecondary },
  rowValue: { fontSize: 14.5, fontWeight: '600', color: Colors.textPrimary, marginTop: 2 },
  statsTitle: { fontWeight: 'bold', color: Colors.textPrimary },
  statsRow: { flexDirection: 'row', marginTop: 10, width: '100%' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: Colors.primary },
  statLabel: { fontSize: 12, color: Colors.textSecondary },
});
