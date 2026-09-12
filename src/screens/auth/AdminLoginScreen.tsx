import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import Text from '../../components/Text';
import { Colors } from '../../constants/theme';
import { validateEmail } from '../../utils/validators';
import { useAuth } from '../../context/AuthContext';
import AppTextField from '../../components/AppTextField';
import PrimaryButton from '../../components/PrimaryButton';
import KeyboardAwareScreen from '../../components/KeyboardAwareScreen';

export default function AdminLoginScreen() {
  const { adminSignIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const emailErr = validateEmail(email);
    const passErr = password ? null : 'Password is required';
    setErrors({ email: emailErr, password: passErr });
    if (emailErr || passErr) return;

    setLoading(true);
    try {
      await adminSignIn(email, password);
    } catch (e) {
      Alert.alert('Admin Login Failed', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScreen backgroundColor={Colors.primaryDark} contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>🛡️</Text>
        <Text style={styles.title}>Rakt Setu — Admin</Text>
        <Text style={styles.subtitle}>Restricted access for verified administrators only.</Text>

        <View style={{ height: 20 }} />
        <AppTextField
          label="Admin Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />
        <View style={{ height: 14 }} />
        <AppTextField label="Password" value={password} onChangeText={setPassword} secureTextEntry error={errors.password} />

        <PrimaryButton label="Login as Admin" onPress={submit} loading={loading} style={{ marginTop: 20 }} />
      </View>
    </KeyboardAwareScreen>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%' },
  icon: { fontSize: 40, textAlign: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginTop: 6, color: Colors.textPrimary },
  subtitle: { fontSize: 12.5, color: Colors.textSecondary, textAlign: 'center', marginTop: 4 },
});
