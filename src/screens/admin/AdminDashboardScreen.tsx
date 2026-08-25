import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, type DocumentData } from 'firebase/firestore';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Text from '../../components/Text';
import { db } from '../../firebase/config';
import { Colors, Palette, colorForBloodType } from '../../constants/theme';
import { BLOOD_TYPES, FS } from '../../constants/appConstants';
import { useAuth } from '../../context/AuthContext';
import { getAllUsersOnce } from '../../services/userService';
import { exportUsersToExcel } from '../../services/excelExportService';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import type { RootScreenProps } from '../../types/navigation';

export default function AdminDashboardScreen({ navigation }: RootScreenProps<'AdminDashboard'>) {
  const { signOut } = useAuth();
  const [users, setUsers] = useState<DocumentData[] | null>(null);
  const [requests, setRequests] = useState<DocumentData[] | null>(null);
  const [donations, setDonations] = useState<DocumentData[] | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const u = onSnapshot(collection(db, FS.users), (snap) => setUsers(snap.docs.map((d) => d.data())));
    const r = onSnapshot(collection(db, FS.bloodRequests), (snap) => setRequests(snap.docs.map((d) => d.data())));
    const d = onSnapshot(collection(db, FS.donationHistory), (snap) => setDonations(snap.docs.map((doc) => doc.data())));
    return () => { u(); r(); d(); };
  }, []);

  if (!users || !requests || !donations) return <LoadingIndicator />;

  const totalUsers = users.length;
  const pending = requests.filter((r) => r.status === 'pending').length;
  const fulfilled = requests.filter((r) => r.status === 'fulfilled').length;
  const totalDonations = donations.length;

  const counts: Record<string, number> = {};
  BLOOD_TYPES.forEach((t) => { counts[t] = 0; });
  users.forEach((u) => { if (counts[u.bloodType] !== undefined) counts[u.bloodType]++; });
  const maxCount = Math.max(1, ...Object.values(counts));

  const exportUsers = async () => {
    setExporting(true);
    try {
      const allUsers = await getAllUsersOnce();
      await exportUsersToExcel(allUsers);
    } catch (e) {
      Alert.alert('Export failed', (e as Error).message || 'Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.statsGrid}>
        <StatCard icon="👥" label="Registered Users" value={totalUsers} color={Palette.blue} />
        <StatCard icon="⏳" label="Pending Requests" value={pending} color={Colors.pending} />
        <StatCard icon="✅" label="Fulfilled Requests" value={fulfilled} color={Colors.success} />
        <StatCard icon="🤝" label="Donations Logged" value={totalDonations} color={Palette.purple} />
      </View>

      <Text style={styles.sectionTitle}>Users by Blood Type</Text>
      <View style={styles.chartCard}>
        {BLOOD_TYPES.map((t) => (
          <View key={t} style={styles.barRow}>
            <Text style={styles.barLabel}>{t}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${(counts[t] / maxCount) * 100}%`, backgroundColor: colorForBloodType(t) },
                ]}
              />
            </View>
            <Text style={styles.barValue}>{counts[t]}</Text>
          </View>
        ))}
      </View>

      <MenuTile icon="👥" color={Palette.blue} title="User Management" subtitle="View, verify or suspend accounts" onPress={() => navigation.navigate('AdminUsers')} />
      <MenuTile icon="🩸" color={Colors.primary} title="Blood Request Management" subtitle="Review, fulfill, cancel or remove requests" onPress={() => navigation.navigate('AdminRequests')} />
      <MenuTile icon="📝" color={Palette.teal} title="Add Donation Record" subtitle="Log a donation or receipt against a user" onPress={() => navigation.navigate('AdminDonationForm')} />
      <MenuTile icon="📤" color={Palette.purple} title="Export Users to Excel" subtitle="Share a .xlsx of all registered users" onPress={exportUsers} loading={exporting} />

      <Pressable style={styles.signOutBtn} onPress={signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuTile({
  icon, color, title, subtitle, onPress, loading,
}: { icon: string; color: string; title: string; subtitle: string; onPress: () => void; loading?: boolean }) {
  return (
    <Pressable style={styles.menuTile} onPress={loading ? undefined : onPress}>
      <View style={[styles.menuIcon, { backgroundColor: color + '1F' }]}><Text style={{ fontSize: 18 }}>{icon}</Text></View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <Text style={{ color: Colors.textSecondary }}>{loading ? '…' : '›'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 14 },
  statValue: { fontSize: 22, fontWeight: 'bold', marginTop: 8 },
  statLabel: { color: Colors.textSecondary, fontSize: 12 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 10, color: Colors.textPrimary },
  chartCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 24 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  barLabel: { width: 32, fontSize: 12, color: Colors.textSecondary },
  barTrack: { flex: 1, height: 10, backgroundColor: Colors.background, borderRadius: 5, marginHorizontal: 8, overflow: 'hidden' },
  barFill: { height: 10, backgroundColor: Colors.primary, borderRadius: 5 },
  barValue: { width: 24, fontSize: 12, color: Colors.textSecondary, textAlign: 'right' },
  menuTile: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10 },
  menuIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary + '1F', alignItems: 'center', justifyContent: 'center' },
  menuTitle: { fontWeight: '600', color: Colors.textPrimary },
  menuSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  signOutBtn: { alignItems: 'center', marginTop: 12, padding: 12 },
  signOutText: { color: Colors.danger, fontWeight: '600' },
});
