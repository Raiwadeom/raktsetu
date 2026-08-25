import React from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import Text from '../../components/Text';
import { Colors } from '../../constants/theme';
import { formatDate } from '../../utils/formatters';
import { confirmAsync } from '../../utils/confirmDialog';
import { useAuth } from '../../context/AuthContext';
import BloodTypeBadge from '../../components/BloodTypeBadge';
import PrimaryButton from '../../components/PrimaryButton';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import type { RootScreenProps } from '../../types/navigation';

export default function VerificationPendingScreen({ navigation }: RootScreenProps<'VerificationPending'>) {
  const { appUser, signOut } = useAuth();

  if (!appUser) return <LoadingIndicator />;

  const confirmSignOut = async () => {
    const ok = await confirmAsync('Sign Out', 'Are you sure you want to sign out?', 'Sign Out');
    if (ok) signOut();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.badge}>
        <Text style={{ fontSize: 40 }}>⏳</Text>
      </View>
      <Text style={styles.title}>Verification Pending</Text>
      <Text style={styles.message}>
        Your ID is under review by the college admin — you'll get full access to Rakt Setu (posting and
        responding to blood requests) once approved. You can still view and edit your submitted profile below.
      </Text>

      <View style={styles.center}>
        {appUser.profilePhotoUrl ? (
          <Image source={{ uri: appUser.profilePhotoUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={{ fontSize: 36 }}>👤</Text>
          </View>
        )}
        <Text style={styles.name}>{appUser.fullName || '(no name)'}</Text>
        <Text style={styles.email}>{appUser.email}</Text>
        <View style={styles.pendingChip}>
          <Text style={styles.pendingChipText}>⏳ Pending Verification</Text>
        </View>
      </View>

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
        <Divider />
        <InfoRow label="ID Card" value={appUser.idCardUrl ? '✓ Uploaded' : 'Not uploaded'} />
      </View>

      <PrimaryButton
        label="Edit Profile"
        outlined
        onPress={() => navigation.navigate('CompleteProfile', { isEditing: true })}
        style={{ marginTop: 20 }}
      />
      <PrimaryButton
        label="Sign Out"
        outlined
        onPress={confirmSignOut}
        style={{ marginTop: 12, borderColor: Colors.danger }}
      />
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
function Divider() {
  return <View style={{ height: 1, backgroundColor: Colors.divider, marginVertical: 12 }} />;
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  badge: {
    alignSelf: 'center', width: 76, height: 76, borderRadius: 38,
    backgroundColor: Colors.pending + '20', alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: Colors.textPrimary, textAlign: 'center', marginTop: 14 },
  message: { color: Colors.textSecondary, textAlign: 'center', marginTop: 8, fontSize: 13.5, lineHeight: 20, paddingHorizontal: 8 },
  center: { alignItems: 'center', marginTop: 24 },
  avatar: { width: 84, height: 84, borderRadius: 42 },
  avatarPlaceholder: { backgroundColor: Colors.primary + '1F', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: 'bold', marginTop: 10, color: Colors.textPrimary },
  email: { color: Colors.textSecondary },
  pendingChip: {
    marginTop: 8, backgroundColor: Colors.pending + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  pendingChipText: { color: Colors.pending, fontWeight: '600', fontSize: 12 },
  infoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 24 },
});
