import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatCalendarDate, localCalendarDate } from '@/shared/domain/calendar-date';
import { CalendarPicker } from '@/shared/presentation/calendar-picker';
import { colors, spacing } from '@/theme';

import type { HistoryDateFilterProps } from './history-date-filter';

export function HistoryDateFilter({ value, invalid, onChange }: HistoryDateFilterProps) {
  const [open, setOpen] = useState(false);
  const maximumDate = new Date();
  maximumDate.setHours(23, 59, 59, 999);
  const today = localCalendarDate(maximumDate);
  const label = value ? formatCalendarDate(value) : 'Elegir fecha';

  function onSelect(date: Date) {
    const selected = localCalendarDate(date);
    if (selected <= today) onChange(selected);
    setOpen(false);
  }

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={value ? `Cambiar fecha. ${label}` : label}
        accessibilityState={{ expanded: open }}
        onPress={() => {
          Keyboard.dismiss();
          setOpen(previous => !previous);
        }}
        style={[styles.trigger, invalid && styles.invalid]}
      >
        <Text style={styles.label}>{label}</Text>
      </Pressable>
      {open && (
        <CalendarPicker
          value={value && value < today ? new Date(`${value}T12:00:00`) : maximumDate}
          maximumDate={maximumDate}
          onSelect={onSelect}
          onDismiss={() => setOpen(false)}
          testID="history-date-picker"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  trigger: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.xs,
  },
  invalid: { borderColor: colors.danger },
  label: { color: colors.ink, fontSize: 16 },
});
