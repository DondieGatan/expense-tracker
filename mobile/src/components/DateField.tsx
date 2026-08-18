import React, { useState } from 'react';
import { Platform, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../theme/colors';
import { formatDate } from '../utils/format';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

function toDateObj(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function toIsoString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DateField({ value, onChange }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  if (Platform.OS === 'web') {
    return React.createElement('input', {
      type: 'date',
      value,
      onChange: (e: { target: { value: string } }) => onChange(e.target.value),
      style: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        padding: '12px 14px',
        fontSize: 14,
        fontFamily: 'inherit',
        width: '100%',
        colorScheme: 'dark',
      },
    });
  }

  return (
    <>
      <TouchableOpacity style={styles.input} onPress={() => setShowPicker(true)}>
        <Text style={styles.value}>{formatDate(value, { year: 'numeric', month: 'short', day: 'numeric' })}</Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={toDateObj(value)}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onValueChange={(_event, selectedDate) => {
            setShowPicker(Platform.OS === 'ios');
            if (selectedDate) onChange(toIsoString(selectedDate));
          }}
          onDismiss={() => setShowPicker(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  value: { color: colors.text, fontSize: 14 },
});
