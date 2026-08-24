import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Text from './Text';
import { Colors } from '../constants/theme';

export function LoadingIndicator({ message }: { message?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={Colors.primary} size="large" />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  message: { marginTop: 12, color: Colors.textSecondary },
  title: { fontSize: 16, fontWeight: '600', textAlign: 'center', color: Colors.textPrimary },
  subtitle: { marginTop: 6, color: Colors.textSecondary, textAlign: 'center', fontSize: 13 },
});
