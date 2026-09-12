import React, { type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import Text from './Text';
import { useKeyboardAware } from './KeyboardAwareScreen';
import { Colors } from '../constants/theme';

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string | null;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  numberOfLines?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  rightElement?: ReactNode;
  editable?: boolean;
}

export default function AppTextField({
  label,
  value,
  onChangeText,
  error,
  secureTextEntry,
  keyboardType,
  multiline,
  numberOfLines,
  autoCapitalize,
  rightElement,
  editable = true,
}: Props) {
  // Lets the enclosing KeyboardAwareScreen scroll this field clear of the
  // keyboard — including when moving between fields while it's already open,
  // which fires no keyboard event of its own.
  const { notifyFocus } = useKeyboardAware();

  return (
    <View style={styles.wrap}>
      <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
        <TextInput
          style={[styles.input, multiline ? { height: 22 * (numberOfLines || 3), textAlignVertical: 'top' } : null]}
          placeholder={label}
          placeholderTextColor={Colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          autoCapitalize={autoCapitalize || 'sentences'}
          editable={editable}
          onFocus={notifyFocus}
        />
        {rightElement}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    paddingHorizontal: 14,
  },
  inputRowError: {
    borderColor: Colors.danger,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  error: {
    color: Colors.danger,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
