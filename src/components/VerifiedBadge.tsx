import React from 'react';
import { StyleSheet, View } from 'react-native';
import Text from './Text';
import { Colors } from '../constants/theme';

export default function VerifiedBadge({ small }: { small?: boolean }) {
  return (
    <View style={[styles.badge, small ? styles.badgeSmall : null]}>
      <Text style={[styles.text, small ? styles.textSmall : null]}>✓ Verified</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeSmall: { paddingHorizontal: 6, paddingVertical: 2 },
  text: { color: Colors.success, fontWeight: '600', fontSize: 12 },
  textSmall: { fontSize: 11 },
});
