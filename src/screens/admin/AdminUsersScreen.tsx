import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Text from '../../components/Text';
import { Colors, colorForBloodType } from '../../constants/theme';
import { BLOOD_TYPES } from '../../constants/appConstants';
import { watchAllUsers } from '../../services/userService';
import BloodTypeBadge from '../../components/BloodTypeBadge';
import VerifiedBadge from '../../components/VerifiedBadge';
import { LoadingIndicator, EmptyState } from '../../components/LoadingIndicator';
import type { AppUser } from '../../types/models';
import type { RootScreenProps } from '../../types/navigation';

type VerifiedFilter = 'any' | 'verified' | 'unverified';

export default function AdminUsersScreen({ navigation }: RootScreenProps<'AdminUsers'>) {
  const [users, setUsers] = useState<AppUser[] | null>(null);
  const [search, setSearch] = useState('');
  const [bloodFilter, setBloodFilter] = useState<string | null>(null);
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedFilter>('any');

  useEffect(() => watchAllUsers(setUsers), []);

  if (users === null) return <LoadingIndicator />;

  let filtered = users.filter((u) => u.role !== 'admin');
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(
      (u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) ||
        u.phone.includes(q) || u.city.toLowerCase().includes(q),
    );
  }
  if (bloodFilter) filtered = filtered.filter((u) => u.bloodType === bloodFilter);
  if (verifiedFilter === 'verified') filtered = filtered.filter((u) => u.isVerified);
  if (verifiedFilter === 'unverified') filtered = filtered.filter((u) => !u.isVerified);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <TextInput
        style={styles.search}
        placeholder="Search by name, email, phone or city"
        placeholderTextColor={Colors.textSecondary}
        value={search}
        onChangeText={setSearch}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={{ paddingHorizontal: 16 }}>
        <Chip label="All Types" selected={!bloodFilter} onPress={() => setBloodFilter(null)} />
        {BLOOD_TYPES.map((t) => (
          <Chip
            key={t}
            label={t}
            color={colorForBloodType(t)}
            selected={bloodFilter === t}
            onPress={() => setBloodFilter(bloodFilter === t ? null : t)}
          />
        ))}
        <Chip label="Verified" selected={verifiedFilter === 'verified'} onPress={() => setVerifiedFilter(verifiedFilter === 'verified' ? 'any' : 'verified')} />
        <Chip label="Unverified" selected={verifiedFilter === 'unverified'} onPress={() => setVerifiedFilter(verifiedFilter === 'unverified' ? 'any' : 'unverified')} />
      </ScrollView>

      {filtered.length === 0 ? (
        <EmptyState title="No users match your filters" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable style={styles.userCard} onPress={() => navigation.navigate('AdminUserDetail', { uid: item.uid })}>
              <BloodTypeBadge bloodType={item.bloodType} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.userName}>{item.fullName || '(no name)'}</Text>
                <Text style={styles.userSub}>{item.email}</Text>
                <Text style={styles.userSub}>{item.city || 'City not set'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {item.isVerified ? <VerifiedBadge small /> : (
                  <Text style={styles.pending}>⏳ Pending</Text>
                )}
                {item.isSuspended ? <Text style={styles.suspended}>Suspended</Text> : null}
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function Chip({
  label, selected, onPress, color = Colors.primary,
}: { label: string; selected: boolean; onPress: () => void; color?: string }) {
  return (
    <Pressable
      style={[styles.chip, selected && { backgroundColor: color + '2A', borderColor: color }]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && { color, fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  search: {
    margin: 16, marginBottom: 8, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1,
    borderColor: Colors.divider, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
  },
  chipsRow: { flexGrow: 0, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#fff', marginRight: 8, borderWidth: 1, borderColor: Colors.divider },
  chipText: { fontSize: 12, color: Colors.textSecondary },
  list: { padding: 12 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 8 },
  userName: { fontWeight: '600', color: Colors.textPrimary },
  userSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  suspended: { color: Colors.danger, fontSize: 11, marginTop: 4 },
  pending: { color: Colors.pending, fontSize: 11, fontWeight: '600' },
});
