import React from 'react';
import { StyleSheet, View } from 'react-native';
import Text from './Text';
import { Colors } from '../constants/theme';
import type { RequestStatusValue } from '../types/models';

function colorFor(status: string): string {
  if (status === 'fulfilled') return Colors.success;
  if (status === 'cancelled') return Colors.textSecondary;
  return Colors.pending;
}

export default function StatusChip({ status }: { status: RequestStatusValue | string }) {
  const color = colorFor(status);
  return (
    <View style={[styles.chip, { backgroundColor: color + '20' }]}>
      <Text style={[styles.text, { color }]}>{status ? status[0].toUpperCase() + status.slice(1) : ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  text: { fontSize: 12, lineHeight: 17, fontWeight: '600', includeFontPadding: false },
});
