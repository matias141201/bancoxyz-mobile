import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

import type { CalendarPickerProps } from './calendar-picker';

export function CalendarPicker({
  value, minimumDate, maximumDate, onSelect, onDismiss, testID,
}: CalendarPickerProps) {
  const [selected, setSelected] = useState(value);

  return (
    <Modal transparent animationType="fade" onRequestClose={onDismiss}>
      <SafeAreaView style={styles.backdrop}>
        <Pressable aria-hidden accessible={false} onPress={onDismiss} style={StyleSheet.absoluteFill} />
        <View accessibilityViewIsModal style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>Elegí una fecha</Text>
          <ScrollView style={styles.scroll}>
            <DateTimePicker
              mode="date"
              presentation="inline"
              value={value}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              accentColor={colors.primary}
              onValueChange={(_event, date) => setSelected(date)}
              testID={testID}
            />
          </ScrollView>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={onDismiss} style={styles.action}>
              <Text style={styles.actionText}>Cancelar</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => onSelect(selected)} style={styles.action}>
              <Text style={styles.actionText}>Elegir</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.scrim,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '100%',
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: spacing.lg,
  },
  title: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    color: colors.ink,
    fontSize: 20,
    fontWeight: '700',
  },
  scroll: { flexGrow: 0, flexShrink: 1 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  action: { minHeight: 48, justifyContent: 'center', paddingHorizontal: spacing.sm },
  actionText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
});
