import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import Text from '../../components/Text';
import { Colors } from '../../constants/theme';
import { formatDate } from '../../utils/formatters';
import { watchUser, setVerified, setSuspended } from '../../services/userService';
import BloodTypeBadge from '../../components/BloodTypeBadge';
import VerifiedBadge from '../../components/VerifiedBadge';
import PrimaryButton from '../../components/PrimaryButton';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import type { AppUser } from '../../types/models';
import type { RootScreenProps } from '../../types/navigation';

export default function AdminUserDetailScreen({ route, navigation }: RootScreenProps<'AdminUserDetail'>) {
  const { uid } = route.params;
  const [user, setUser] = useState<AppUser | null | undefined>(undefined);
  // Tracks *which* action is running, not just that one is: a single shared
  // flag put a spinner on every button at once, so the admin couldn't tell
  // which one they had actually pressed.
  const [busy, setBusy] = useState<'verify' | 'suspend' | null>(null);

  useEffect(() => watchUser(uid, setUser), [uid]);

  if (user === undefined) return <LoadingIndicator />;
  if (user === null) {
    return <View style={styles.center}><Text>This user no longer exists.</Text></View>;
  }

  const toggleVerified = async () => {
    setBusy('verify');
    try {
      await setVerified(uid, !user.isVerified);
    } catch (e) {
      // Previously this rejected silently - the spinner stopped and nothing
      // changed, with no way to tell a failed write from a slow one.
      Alert.alert('Could not update verification', (e as Error).message || 'Please try again.');
    } finally {
      setBusy(null);
    }
  };
  const toggleSuspended = async () => {
    setBusy('suspend');
    try {
      await setSuspended(uid, !user.isSuspended);
    } catch (e) {
      Alert.alert('Could not update account status', (e as Error).message || 'Please try again.');
    } finally {
      setBusy(null);
    }
  };
  const isPdf = user.idCardUrl && user.idCardUrl.toLowerCase().includes('.pdf');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.center}>
        {user.profilePhotoUrl ? (
          <Image source={{ uri: user.profilePhotoUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}><Text style={{ fontSize: 36 }}>👤</Text></View>
        )}
        <Text style={styles.name}>{user.fullName || '(no name)'}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.badgeRow}>
          {user.isVerified ? (
            <VerifiedBadge />
          ) : (
            <View style={styles.pendingBadge}><Text style={styles.pendingText}>⏳ Pending Verification</Text></View>
          )}
          {user.isSuspended ? <View style={styles.suspendedBadge}><Text style={styles.suspendedText}>Suspended</Text></View> : null}
        </View>
      </View>

      <View style={styles.card}>
        <InfoRow label="Blood Type" value={<BloodTypeBadge bloodType={user.bloodType} size={26} />} />
        <Divider /><InfoRow label="Gender" value={user.gender || '—'} />
        <Divider /><InfoRow label="Phone" value={user.phone || '—'} />
        <Divider /><InfoRow label="City / Area" value={user.city || '—'} />
        <Divider /><InfoRow label="Date of Birth" value={user.dob ? formatDate(user.dob) : '—'} />
        <Divider /><InfoRow label="Registered" value={formatDate(user.createdAt)} />
      </View>

      <Text style={styles.sectionTitle}>ID Card</Text>
      {user.idCardUrl ? (
        isPdf ? (
          <View style={styles.pdfBox}><Text>📄 PDF document uploaded</Text></View>
        ) : (
          <Image source={{ uri: user.idCardUrl }} style={styles.idImage} />
        )
      ) : (
        <Text style={{ color: Colors.textSecondary }}>No ID card uploaded</Text>
      )}

      <Text style={styles.sectionTitle}>Actions</Text>
      <View style={styles.actionsWrap}>
        <PrimaryButton
          label={user.isVerified ? 'Reject Verification' : 'Verify ID'}
          outlined
          onPress={toggleVerified}
          loading={busy === 'verify'}
          disabled={busy !== null}
          style={{ borderColor: user.isVerified ? Colors.warning : Colors.success, flexBasis: '48%' }}
        />
        <PrimaryButton
          label={user.isSuspended ? 'Reactivate Account' : 'Suspend Account'}
          outlined
          onPress={toggleSuspended}
          loading={busy === 'suspend'}
          disabled={busy !== null}
          style={{ borderColor: Colors.warning, flexBasis: '48%' }}
        />
        <PrimaryButton
          label="Add Donation Record"
          outlined
          onPress={() => navigation.navigate('AdminDonationForm', { preselectedUserId: uid })}
          disabled={busy !== null}
          style={{ flexBasis: '100%' }}
        />
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ color: Colors.textSecondary }}>{label}</Text>
      {typeof value === 'string' ? <Text style={{ fontWeight: '600', color: Colors.textPrimary }}>{value}</Text> : value}
    </View>
  );
}
function Divider() { return <View style={{ height: 1, backgroundColor: Colors.divider, marginVertical: 12 }} />; }

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  center: { alignItems: 'center' },
  avatar: { width: 84, height: 84, borderRadius: 42 },
  avatarPlaceholder: { backgroundColor: Colors.primary + '1F', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 19, fontWeight: 'bold', marginTop: 10, color: Colors.textPrimary },
  email: { color: Colors.textSecondary },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  suspendedBadge: { backgroundColor: Colors.danger + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  suspendedText: { color: Colors.danger, fontWeight: '600', fontSize: 12 },
  pendingBadge: { backgroundColor: Colors.pending + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pendingText: { color: Colors.pending, fontWeight: '600', fontSize: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 20 },
  sectionTitle: { fontWeight: 'bold', marginTop: 24, marginBottom: 8, color: Colors.textPrimary },
  pdfBox: { backgroundColor: Colors.primary + '0F', borderRadius: 12, padding: 30, alignItems: 'center' },
  idImage: { width: '100%', height: 220, borderRadius: 12, resizeMode: 'contain', backgroundColor: '#fff' },
  actionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
