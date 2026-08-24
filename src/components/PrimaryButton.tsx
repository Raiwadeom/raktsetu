import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Text from './Text';
import { Colors } from '../constants/theme';

interface Props {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  outlined?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function PrimaryButton({ label, onPress, loading, outlined, disabled, style }: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        outlined ? styles.outlined : styles.filled,
        isDisabled && styles.disabled,
        pressed && !isDisabled && { opacity: 0.85 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={outlined ? Colors.primary : '#fff'} />
      ) : (
        <Text style={[styles.label, outlined ? styles.labelOutlined : styles.labelFilled]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  filled: {
    backgroundColor: Colors.primary,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1.4,
    borderColor: Colors.primary,
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  labelFilled: {
    color: '#fff',
  },
  labelOutlined: {
    color: Colors.primary,
  },
});
