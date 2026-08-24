import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Text from '../../components/Text';
import { Colors } from '../../constants/theme';
import { BLOOD_TYPES } from '../../constants/appConstants';
import { required } from '../../utils/validators';
import { broadcastAnnouncement } from '../../services/adminService';
import AppTextField from '../../components/AppTextField';
import PrimaryButton from '../../components/PrimaryButton';

export default function AdminBroadcastScreen() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [bloodType, setBloodType] = useState<string | null>(null); // null = all users
  const [errors, setErrors] = useState<{ title?: string | null; body?: string | null }>({});
  const [loading, setLoading] = useState(false);

  const send = () => {
    const newErrors = { title: required(title, 'Title'), body: required(body, 'Message') };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    Alert.alert(
      'Send Announcement',
      bloodType
        ? `This will send a push + in-app notification to all ${bloodType} users. Continue?`
        : 'This will send a push + in-app notification to ALL registered users. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send', onPress: async () => {
            setLoading(true);
            try {
              await broadcastAnnouncement({ title: title.trim(), body: body.trim(), bloodType });
              setTitle('');
              setBody('');
              Alert.alert('Sent', 'Announcement sent.');
            } catch (e) {
              Alert.alert('Failed', (e as Error).message || 'Failed to send announcement.');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.subtitle}>e.g. announce a college blood-donation camp</Text>
        <View style={{ height: 20 }} />
        <AppTextField label="Title" value={title} onChangeText={setTitle} error={errors.title} />
        <View style={{ height: 14 }} />
        <AppTextField label="Message" value={body} onChangeText={setBody} multiline numberOfLines={4} error={errors.body} />

        <Text style={styles.label}>Audience</Text>
        <View style={styles.chipsWrap}>
          <Chip label="All Users" selected={!bloodType} onPress={() => setBloodType(null)} />
          {BLOOD_TYPES.map((t) => (
            <Chip key={t} label={t} selected={bloodType === t} onPress={() => setBloodType(t)} />
          ))}
        </View>

        <PrimaryButton label="Send Announcement" onPress={send} loading={loading} style={{ marginTop: 28 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, selected && styles.chipSelected]} onPress={onPress}>
      <Text style={selected ? styles.chipTextSelected : styles.chipText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  subtitle: { color: Colors.textSecondary },
  label: { fontWeight: '600', color: Colors.textPrimary, marginTop: 20, marginBottom: 10 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.divider },
  chipSelected: { backgroundColor: Colors.primary + '2A', borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary },
  chipTextSelected: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
});
