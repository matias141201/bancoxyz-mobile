import { useState } from 'react';
import { Text, View } from 'react-native';

import { formatCalendarDate, isCalendarDate, localCalendarDate } from '@/shared/domain/calendar-date';
import { CalendarPicker } from '@/shared/presentation/calendar-picker';

import { TransferButton } from './transfer-button';
import type { TransferDateFieldProps } from './transfer-date-field';
import { styles } from './transfer-styles';

function parseLocalDate(value: string, minimum: Date): Date {
  if (!isCalendarDate(value) || value < localCalendarDate(minimum)) return minimum;

  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function TransferDateField({ value, minimum, onChange }: TransferDateFieldProps) {
  const isAndroid = process.env.EXPO_OS === 'android';
  const [open, setOpen] = useState(false);
  const selected = parseLocalDate(value, minimum);

  function handleChange(date: Date) {
    setOpen(false);
    onChange(localCalendarDate(date));
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>Fecha de transferencia</Text>
      {isAndroid && (
        <TransferButton
          title={`Elegir fecha · ${formatCalendarDate(localCalendarDate(selected))}`}
          secondary
          onPress={() => setOpen(true)}
        />
      )}
      {(!isAndroid || open) && (
        <CalendarPicker
          display="compact"
          value={selected}
          minimumDate={minimum}
          onSelect={handleChange}
          onDismiss={() => setOpen(false)}
          testID="transfer-date-picker"
        />
      )}
    </View>
  );
}
