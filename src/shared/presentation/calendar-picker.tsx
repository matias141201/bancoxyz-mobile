import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';

export type CalendarPickerProps = Readonly<{
  value: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  display?: 'inline' | 'compact';
  onSelect: (date: Date) => void;
  onDismiss: () => void;
  testID?: string;
}>;

export function CalendarPicker({
  value, minimumDate, maximumDate, display = 'inline', onSelect, testID,
}: CalendarPickerProps) {
  return (
    <View style={styles.inset}>
      <DateTimePicker
        mode="date"
        display={display}
        locale="es-AR"
        value={value}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        accentColor={colors.primary}
        onValueChange={(_event, date) => onSelect(date)}
        testID={testID}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  inset: { paddingHorizontal: spacing.xs, paddingVertical: spacing.xs },
});
