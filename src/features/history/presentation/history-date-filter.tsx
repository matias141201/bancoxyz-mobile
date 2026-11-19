import { localCalendarDate } from '@/shared/domain/calendar-date';
import { colors, spacing } from '@/theme';

export type HistoryDateFilterProps = Readonly<{
  value: string;
  invalid: boolean;
  onChange: (date: string) => void;
}>;

export function HistoryDateFilter({ value, invalid, onChange }: HistoryDateFilterProps) {
  return (
    <input
      type="date"
      aria-label="Fecha"
      aria-invalid={invalid}
      max={localCalendarDate(new Date())}
      value={value}
      onChange={event => onChange(event.currentTarget.value)}
      style={{
        minHeight: 48,
        minWidth: 0,
        boxSizing: 'border-box',
        paddingInline: spacing.sm,
        border: `1px solid ${invalid ? colors.danger : colors.border}`,
        borderRadius: spacing.xs,
        backgroundColor: colors.surface,
        color: colors.ink,
        font: 'inherit',
        fontSize: 16,
      }}
    />
  );
}
