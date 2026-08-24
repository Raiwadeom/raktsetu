import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Text from './Text';
import { Colors } from '../constants/theme';
import { Fonts } from '../constants/fonts';
import { useAuth } from '../context/AuthContext';
import AppTextField from './AppTextField';
import PrimaryButton from './PrimaryButton';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/**
 * Self-service account deletion. Asks for the password both because
 * Firebase requires a fresh credential to delete an Auth account
 * (auth/requires-recent-login) and because it doubles as a genuine
 * "are you sure" gate for a destructive, unrecoverable action.
 */
export default function DeleteAccountModal({ visible, onClose }: Props) {
  const { deleteOwnAccount } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (loading) return;
    setPassword('');
    setError(null);
    onClose();
  };

  const confirm = async () => {
    if (!password) {
      setError('Enter your password to confirm.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await deleteOwnAccount(password);
      // No further navigation needed — deleting the Auth account signs the
      // user out, and RootNavigator's auth watcher lands back on Login
      // automatically, same as every other sign-out path in this app.
    } catch (e) {
      setLoading(false);
      setError((e as Error).message || 'Failed to delete account. Please try again.');
      return;
    }
    setLoading(false);
    setPassword('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Delete Your Account</Text>
          <Text style={styles.message}>
            This permanently deletes your profile, ID card, and login access. This cannot be undone.
            Enter your password to confirm.
          </Text>

          <View style={{ height: 16 }} />
          <AppTextField
            label="Password"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              if (error) setError(null);
            }}
            secureTextEntry
            error={error}
          />

          <View style={styles.actions}>
            <Pressable onPress={handleClose} style={styles.cancelBtn} disabled={loading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <PrimaryButton label="Delete" onPress={confirm} loading={loading} style={styles.deleteBtn} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
  },
  icon: { fontSize: 34, textAlign: 'center' },
  title: {
    fontFamily: Fonts.poppinsSemiBold,
    fontSize: 18,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: 10,
  },
  message: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  cancelBtn: {
    paddingHorizontal: 18,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  cancelText: { color: Colors.textSecondary, fontWeight: '600' },
  deleteBtn: { backgroundColor: Colors.danger },
});
