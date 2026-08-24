import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Text from '../../components/Text';
import { Colors } from '../../constants/theme';
import { validateEmail } from '../../utils/validators';
import { useAuth } from '../../context/AuthContext';
import AppTextField from '../../components/AppTextField';
import PrimaryButton from '../../components/PrimaryButton';
import BrandHeader from '../../components/BrandHeader';
import type { RootScreenProps } from '../../types/navigation';

export default function LoginScreen({ navigation }: RootScreenProps<'Login'>) {
  const { signIn } = useAuth();
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
      await signIn(email, password);
      // Navigation on success is driven by RootNavigator watching auth state.
    } catch (e) {
      Alert.alert('Sign In Failed', (e as Error).message);
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
        <View style={styles.header}>
          <BrandHeader theme="light" logoSize={80} />
        </View>

        <View style={styles.tabs}>
          <View style={[styles.tab, styles.tabActive]}>
            <Text style={styles.tabTextActive}>Sign In</Text>
          </View>
          <Pressable style={styles.tab} onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.tabText}>Sign Up</Text>
          </Pressable>
        </View>

        <AppTextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />
        <View style={{ height: 14 }} />
        <AppTextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={errors.password}
        />

        <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotBtn}>
          <Text style={styles.link}>Forgot Password?</Text>
        </Pressable>

        <PrimaryButton label="Sign In" onPress={submit} loading={loading} style={{ marginTop: 8 }} />

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.divider} />
        </View>

        <PrimaryButton label="Admin Login" outlined onPress={() => navigation.navigate('AdminLogin')} />

        <View style={styles.footerLinks}>
          <Pressable onPress={() => navigation.navigate('Terms')}>
            <Text style={styles.link}>Terms & Conditions</Text>
          </Pressable>
          <Text style={styles.footerDot}>·</Text>
          <Pressable onPress={() => navigation.navigate('HelpAbout')}>
            <Text style={styles.link}>Help & About</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 40, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 32 },
  tabs: {
    flexDirection: 'row', backgroundColor: '#F1F3F4', borderRadius: 30,
    padding: 4, marginBottom: 24,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 26, alignItems: 'center' },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  tabText: { color: Colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  forgotBtn: { alignSelf: 'flex-end', marginTop: 8, marginBottom: 8 },
  link: { color: Colors.primary, fontWeight: '600', fontSize: 13 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divider: { flex: 1, height: 1, backgroundColor: Colors.divider },
  dividerText: { marginHorizontal: 10, color: Colors.textSecondary },
  footerLinks: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  footerDot: { color: Colors.textSecondary, marginHorizontal: 10 },
});
