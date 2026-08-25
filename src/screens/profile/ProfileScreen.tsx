import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import Text from '../../components/Text';
import { Colors } from '../../constants/theme';
import { DonationType } from '../../constants/appConstants';
import { formatDate } from '../../utils/formatters';
import { confirmAsync } from '../../utils/confirmDialog';
import { useAuth } from '../../context/AuthContext';
import { watchForUser } from '../../services/donationHistoryService';
import BloodTypeBadge from '../../components/BloodTypeBadge';
import VerifiedBadge from '../../components/VerifiedBadge';
import PrimaryButton from '../../components/PrimaryButton';
import { LoadingIndicator, EmptyState } from '../../components/LoadingIndicator';
import DeleteAccountModal from '../../components/DeleteAccountModal';
import type { DonationRecord } from '../../types/models';
import type { ProfileStackScreenProps } from '../../types/navigation';

export default function ProfileScreen({ navigation }: ProfileStackScreenProps<'ProfileMain'>) {
  const { appUser, signOut } = useAuth();
  const [history, setHistory] = useState<DonationRecord[] | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  useEffect(() => {
    if (!appUser) return undefined;
    return watchForUser(appUser.uid, setHistory);
  }, [appUser?.uid]);

  if (!appUser) return <LoadingIndicator />;

  const confirmSignOut = async () => {
    const ok = await confirmAsync('Sign Out', 'Are you sure you want to sign out?', 'Sign Out');
    if (ok) signOut();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.center}>
        {appUser.profilePhotoUrl ? (
          <Image source={{ uri: appUser.profilePhotoUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={{ fontSize: 40 }}>👤</Text>
          </View>
        )}
        <Text style={styles.name}>{appUser.fullName || '(no name)'}</Text>
        <Text style={styles.email}>{appUser.email}</Text>
        {appUser.isVerified ? <View style={{ marginTop: 8 }}><VerifiedBadge /></View> : null}
      </View>

      <View style={{ height: 20 }} />
      <PrimaryButton label="Edit Profile" outlined onPress={() => navigation.navigate('CompleteProfile', { isEditing: true })} />

      <View style={styles.infoCard}>
        <InfoRow label="Blood Type" value={<BloodTypeBadge bloodType={appUser.bloodType} size={28} />} />
        <Divider />
        <InfoRow label="Gender" value={appUser.gender || '—'} />
        <Divider />
        <InfoRow label="Phone" value={appUser.phone || '—'} />
        <Divider />
        <InfoRow label="City / Area" value={appUser.city || '—'} />
        <Divider />
        <InfoRow label="Date of Birth" value={appUser.dob ? formatDate(appUser.dob) : '—'} />
      </View>

      <Text style={styles.sectionTitle}>Donation History</Text>
      <Text style={styles.sectionSubtitle}>Added by the admin after a verified donation or collection.</Text>
      <View style={{ height: 12 }} />

      {history === null ? (
        <LoadingIndicator />
      ) : history.length === 0 ? (
        <EmptyState title="No donation history yet" subtitle="Records will appear here once the admin logs a donation for you." />
      ) : (
        history.map((r) => {
          const donated = r.type === DonationType.donated;
          return (
            <View key={r.id} style={styles.historyCard}>
              <Text style={{ fontSize: 20 }}>{donated ? '🤝' : '🩸'}</Text>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.historyType}>{donated ? 'Donated' : 'Received'}</Text>
                <Text style={styles.historyDetail}>{r.units} unit(s) • {r.hospitalName}</Text>
                <Text style={styles.historyDetail}>{formatDate(r.date)}</Text>
                {r.note ? <Text style={styles.historyDetail}>{r.note}</Text> : null}
              </View>
            </View>
          );
        })
      )}

      <View style={{ height: 28 }} />
      <PrimaryButton label="Sign Out" outlined onPress={confirmSignOut} style={{ borderColor: Colors.danger }} />
      <PrimaryButton
        label="Delete My Account"
        outlined
        onPress={() => setDeleteModalVisible(true)}
        style={{ marginTop: 12, borderColor: Colors.danger }}
      />
      <Text style={styles.deleteHint}>
        Permanently removes your profile, ID card, and login access. This cannot be undone.
      </Text>

      <DeleteAccountModal visible={deleteModalVisible} onClose={() => setDeleteModalVisible(false)} />
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      {typeof value === 'string' ? <Text style={styles.infoValue}>{value}</Text> : value}
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: Colors.divider, marginVertical: 12 }} />;
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  center: { alignItems: 'center' },
  avatar: { width: 92, height: 92, borderRadius: 46 },
  avatarPlaceholder: { backgroundColor: Colors.primary + '1F', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 20, fontWeight: 'bold', marginTop: 12, color: Colors.textPrimary },
  email: { color: Colors.textSecondary, marginTop: 2 },
  infoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { color: Colors.textSecondary },
  infoValue: { fontWeight: '600', color: Colors.textPrimary },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 24, color: Colors.textPrimary },
  sectionSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  historyCard: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, alignItems: 'flex-start',
  },
  historyType: { fontWeight: '600', color: Colors.textPrimary },
  historyDetail: { color: Colors.textSecondary, fontSize: 12.5, marginTop: 2 },
  deleteHint: { fontSize: 11.5, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },
});
