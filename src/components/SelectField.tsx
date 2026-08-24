import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import Text from './Text';
import { Colors } from '../constants/theme';

interface Props {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  error?: string | null;
}

/** A simple bottom-sheet-style single-select, used instead of the native
 * Picker for a consistent look across iOS/Android and easier error styling. */
export default function SelectField({ label, value, options, onChange, error }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View style={{ marginBottom: 4 }}>
      <Pressable style={[styles.field, error ? styles.fieldError : null]} onPress={() => setOpen(true)}>
        <Text style={value ? styles.valueText : styles.placeholderText}>{value || label}</Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options as string[]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, item === value && styles.optionTextSelected]}>{item}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  fieldError: { borderColor: Colors.danger },
  placeholderText: { color: Colors.textSecondary, fontSize: 15 },
  valueText: { color: Colors.textPrimary, fontSize: 15 },
  chevron: { color: Colors.textSecondary },
  error: { color: Colors.danger, fontSize: 12, marginTop: 4, marginLeft: 4 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '60%', padding: 16 },
  sheetTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10, color: Colors.textPrimary },
  option: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  optionText: { fontSize: 15, color: Colors.textPrimary },
  optionTextSelected: { color: Colors.primary, fontWeight: '700' },
});
