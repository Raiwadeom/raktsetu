import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import Text from '../../components/Text';
import { Colors } from '../../constants/theme';
import { validateEmail } from '../../utils/validators';
import { useAuth } from '../../context/AuthContext';
import AppTextField from '../../components/AppTextField';
import PrimaryButton from '../../components/PrimaryButton';
import type { RootScreenProps } from '../../types/navigation';

export default function ForgotPasswordScreen({ navigation }: RootScreenProps<'ForgotPassword'>) {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    const err = validateEmail(email);
    setError(err);
    if (err) return;

    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (e) {
      Alert.alert('Failed', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.successIcon}>📧</Text>
        <Text style={styles.successText}>A password reset link has been sent to {email.trim()}.</Text>
        <PrimaryButton label="Back to Sign In" onPress={() => navigation.goBack()} style={{ marginTop: 24, width: '100%' }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot your password?</Text>
      <Text style={styles.subtitle}>Enter your registered email and we'll send you a link to reset it.</Text>
      <View style={{ height: 20 }} />
      <AppTextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={error} />
      <PrimaryButton label="Send Reset Link" onPress={submit} loading={loading} style={{ marginTop: 20 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 24, paddingTop: 32 },
  title: { fontSize: 20, fontWeight: 'bold', color: Colors.textPrimary },
  subtitle: { color: Colors.textSecondary, marginTop: 6 },
  centerContainer: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  successIcon: { fontSize: 56 },
  successText: { textAlign: 'center', marginTop: 16, color: Colors.textPrimary },
});
