import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from './Text';
import { Colors } from '../constants/theme';
import { timeAgo } from '../utils/formatters';
import BloodTypeBadge from './BloodTypeBadge';
import StatusChip from './StatusChip';
import type { BloodRequest } from '../types/models';

export default function RequestCard({ request, onPress }: { request: BloodRequest; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]} onPress={onPress}>
      <BloodTypeBadge bloodType={request.bloodType} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>{request.patientName}</Text>
          <StatusChip status={request.status} />
        </View>
        <Text style={styles.hospital} numberOfLines={1}>🏥 {request.hospitalName}</Text>
        <View style={styles.row}>
          <Text style={styles.meta}>{request.unitsRequired} unit(s) needed</Text>
          <Text style={styles.meta}>{timeAgo(request.createdAt)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  body: { flex: 1, marginLeft: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontWeight: '700', fontSize: 15, flex: 1, marginRight: 8, color: Colors.textPrimary },
  hospital: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
  meta: { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },
});
