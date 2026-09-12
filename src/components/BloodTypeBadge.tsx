import React from 'react';
import { StyleSheet, View } from 'react-native';
import Text from './Text';
import { colorForBloodType } from '../constants/theme';

interface Props {
  bloodType: string;
  size?: number;
}

export default function BloodTypeBadge({ bloodType, size = 40 }: Props) {
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colorForBloodType(bloodType) },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.34, lineHeight: size * 0.44 }]}>{bloodType || '?'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: '#fff', fontWeight: '700', includeFontPadding: false, textAlign: 'center' },
});
