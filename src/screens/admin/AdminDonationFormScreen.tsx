import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Text from '../../components/Text';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../../constants/theme';
import { DonationType, RequestStatus } from '../../constants/appConstants';
import { formatDate } from '../../utils/formatters';
import { required, validateUnits } from '../../utils/validators';
import { useAuth } from '../../context/AuthContext';
import { watchAllUsers } from '../../services/userService';
import { watchAllRequests } from '../../services/bloodRequestService';
import { addRecord } from '../../services/donationHistoryService';
import AppTextField from '../../components/AppTextField';
import PrimaryButton from '../../components/PrimaryButton';
import KeyboardAwareScreen from '../../components/KeyboardAwareScreen';
import type { AppUser, BloodRequest, DonationTypeValue } from '../../types/models';
import type { RootScreenProps } from '../../types/navigation';

export default function AdminDonationFormScreen({ route, navigation }: RootScreenProps<'AdminDonationForm'>) {
  const preselectedUserId = route.params?.preselectedUserId;
  const { appUser: admin } = useAuth();

  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [allRequests, setAllRequests] = useState<BloodRequest[]>([]);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [userPickerOpen, setUserPickerOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  const [type, setType] = useState<DonationTypeValue>(DonationType.donated);
  const [units, setUnits] = useState('1');
  const [hospitalName, setHospitalName] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [linkedRequestId, setLinkedRequestId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => watchAllUsers(setAllUsers), []);
  useEffect(() => watchAllRequests(setAllRequests), []);

  useEffect(() => {
    if (preselectedUserId && allUsers.length && !selectedUser) {
      const u = allUsers.find((x) => x.uid === preselectedUserId);
      if (u) setSelectedUser(u);
    }
  }, [preselectedUserId, allUsers, selectedUser]);

  const matchingRequests = allRequests.filter(
    (r) => r.status === RequestStatus.pending && (!selectedUser || r.bloodType === selectedUser.bloodType),
  );

  const submit = async () => {
    const newErrors = { units: validateUnits(units), hospitalName: required(hospitalName, 'Hospital name') };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;
    if (!selectedUser) {
      Alert.alert('User required', 'Please select a user.');
      return;
    }

    setLoading(true);
    try {
      await addRecord({
        userId: selectedUser.uid,
        type,
        date,
        units: parseInt(units, 10),
        hospitalName: hospitalName.trim(),
        note: note.trim() || null,
        linkedRequestId,
        addedByAdminUid: admin?.uid || '',
      });
      Alert.alert('Saved', 'Donation record saved.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Failed', (e as Error).message || 'Failed to save record.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = allUsers.filter(
    (u) => u.role === 'user' && (u.fullName.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())),
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <KeyboardAwareScreen contentContainerStyle={styles.container}>
        <Text style={styles.label}>User</Text>
        <Pressable style={styles.field} onPress={() => setUserPickerOpen(true)}>
          <Text style={selectedUser ? styles.fieldValue : styles.fieldPlaceholder}>
            {selectedUser ? `${selectedUser.fullName} (${selectedUser.bloodType}) — ${selectedUser.email}` : 'Tap to select a user'}
          </Text>
        </Pressable>

        <Text style={[styles.label, { marginTop: 20 }]}>Type</Text>
        <View style={styles.segmentRow}>
          <Segment label="Donated" selected={type === DonationType.donated} onPress={() => setType(DonationType.donated)} />
          <Segment label="Received" selected={type === DonationType.received} onPress={() => setType(DonationType.received)} />
        </View>

        <View style={{ height: 20 }} />
        <AppTextField label="Units" value={units} onChangeText={setUnits} keyboardType="number-pad" error={errors.units} />
        <View style={{ height: 14 }} />
        <AppTextField label="Hospital / Location" value={hospitalName} onChangeText={setHospitalName} error={errors.hospitalName} />
        <View style={{ height: 14 }} />

        <Pressable style={styles.field} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.fieldValue}>{formatDate(date)}</Text>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            maximumDate={new Date()}
            onChange={(_e, selected) => { setShowDatePicker(false); if (selected) setDate(selected); }}
          />
        )}

        <View style={{ height: 14 }} />
        <AppTextField label="Note (optional)" value={note} onChangeText={setNote} multiline numberOfLines={3} />

        <Text style={[styles.label, { marginTop: 20 }]}>Link to a blood request (optional)</Text>
        <Text style={styles.hint}>Linking a request will automatically mark it as fulfilled.</Text>
        {matchingRequests.length === 0 ? (
          <Text style={styles.hint}>No matching pending requests</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            <Pressable style={[styles.reqChip, !linkedRequestId && styles.reqChipSelected]} onPress={() => setLinkedRequestId(null)}>
              <Text style={!linkedRequestId ? styles.reqChipTextSelected : styles.reqChipText}>None</Text>
            </Pressable>
            {matchingRequests.map((r) => (
              <Pressable
                key={r.id}
                style={[styles.reqChip, linkedRequestId === r.id && styles.reqChipSelected]}
                onPress={() => setLinkedRequestId(r.id)}
              >
                <Text style={linkedRequestId === r.id ? styles.reqChipTextSelected : styles.reqChipText} numberOfLines={1}>
                  {r.patientName} — {r.hospitalName}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <PrimaryButton label="Save Record" onPress={submit} loading={loading} style={{ marginTop: 28 }} />
      </KeyboardAwareScreen>

      <Modal visible={userPickerOpen} transparent animationType="slide" onRequestClose={() => setUserPickerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <TextInput
              style={styles.search}
              placeholder="Search users"
              placeholderTextColor={Colors.textSecondary}
              value={userSearch}
              onChangeText={setUserSearch}
            />
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.uid}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.userOption}
                  onPress={() => { setSelectedUser(item); setUserPickerOpen(false); }}
                >
                  <Text style={{ fontWeight: '600', color: Colors.textPrimary }}>{item.fullName || item.email}</Text>
                  <Text style={{ fontSize: 12, color: Colors.textSecondary }}>{item.bloodType} • {item.email}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Segment({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.segment, selected && styles.segmentSelected]} onPress={onPress}>
      <Text style={selected ? styles.segmentTextSelected : styles.segmentText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  label: { fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 },
  hint: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  field: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: Colors.divider, paddingHorizontal: 14, paddingVertical: 14 },
  fieldValue: { color: Colors.textPrimary, fontSize: 14 },
  fieldPlaceholder: { color: Colors.textSecondary, fontSize: 14 },
  segmentRow: { flexDirection: 'row', gap: 10 },
  segment: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.primary, alignItems: 'center' },
  segmentSelected: { backgroundColor: Colors.primary },
  segmentText: { color: Colors.primary, fontWeight: '600' },
  segmentTextSelected: { color: '#fff', fontWeight: '600' },
  reqChip: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.divider, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, maxWidth: 220 },
  reqChipSelected: { backgroundColor: Colors.primary + '2A', borderColor: Colors.primary },
  reqChipText: { fontSize: 12, color: Colors.textSecondary },
  reqChipTextSelected: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '75%', padding: 16 },
  search: { backgroundColor: Colors.background, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10 },
  userOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.divider },
});
