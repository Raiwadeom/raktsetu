import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Text from '../../components/Text';
import { Colors } from '../../constants/theme';
import { validateConfirmPassword, validateEmail, validatePassword } from '../../utils/validators';
import { useAuth } from '../../context/AuthContext';
import AppTextField from '../../components/AppTextField';
import PrimaryButton from '../../components/PrimaryButton';
import type { RootScreenProps } from '../../types/navigation';

export default function SignUpScreen({ navigation }: RootScreenProps<'SignUp'>) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null; confirm?: string | null }>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const newErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
      confirm: validateConfirmPassword(confirm, password),
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    if (!agreed) {
      Alert.alert('Terms & Conditions', 'Please agree to the Terms & Conditions to continue.');
      return;
    }

    setLoading(true);
    try {
      // signUp() creates the account and signs back out atomically —
      // RootNavigator's auth-state watcher never sees the transient
      // signed-in state, so this never navigates anywhere on its own; the
      // app just stays on the auth stack throughout. First real sign-in
      // routes through Complete Profile automatically.
      await signUp(email, password);
      Alert.alert('Account created!', 'Please sign in to continue.');
    } catch (e) {
      Alert.alert('Sign Up Failed', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Join Rakt Setu</Text>
        <Text style={styles.subtitle}>Create your account, then complete your donor profile.</Text>

        <View style={{ height: 20 }} />
        <AppTextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={errors.email} />
        <View style={{ height: 14 }} />
        <AppTextField label="Password" value={password} onChangeText={setPassword} secureTextEntry error={errors.password} />
        <View style={{ height: 14 }} />
        <AppTextField label="Confirm Password" value={confirm} onChangeText={setConfirm} secureTextEntry error={errors.confirm} />

        <Pressable style={styles.agreeRow} onPress={() => setAgreed(!agreed)}>
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={styles.agreeText}>I agree to the </Text>
          <Pressable onPress={() => navigation.navigate('Terms')}>
            <Text style={styles.link}>Terms & Conditions</Text>
          </Pressable>
        </Pressable>

        <PrimaryButton label="Sign Up" onPress={submit} loading={loading} style={{ marginTop: 12 }} />

        <Pressable style={{ alignSelf: 'center', marginTop: 16 }} onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Already have an account? Sign In</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary },
  subtitle: { color: Colors.textSecondary, marginTop: 4 },
  agreeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 16 },
  checkbox: {
    width: 22, height: 22, borderRadius: 5, borderWidth: 1.6, borderColor: Colors.divider,
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  checkboxChecked: { backgroundColor: Colors.primary },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  agreeText: { fontSize: 13.5, color: Colors.textPrimary },
  link: { color: Colors.primary, fontWeight: '600' },
});
