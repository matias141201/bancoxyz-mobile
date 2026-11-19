import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, spacing } from '@/theme';

import { type HistoryFilters as Filters, type InvalidHistoryFilter } from '../domain/history';

type HistoryFiltersProps = Readonly<{
  draft: Filters;
  invalidField: InvalidHistoryFilter | null;
  onChange: (field: keyof Filters, value: string) => void;
  onApply: () => void;
  onClear: () => void;
}>;

const fieldErrors = {
  amount: 'Ingresá un monto válido sin separador de miles.',
  date: 'Ingresá una fecha válida en formato AAAA-MM-DD.',
};

type FilterFieldProps = Readonly<{
  label: string;
  invalid?: boolean;
}> & Pick<TextInputProps, 'keyboardType' | 'maxLength' | 'onChangeText' | 'placeholder' | 'value'>;

function FilterField({ label, invalid, ...inputProps }: FilterFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...inputProps}
        accessibilityLabel={label}
        style={[styles.input, invalid && styles.invalidInput]}
        autoCorrect={false}
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}

export function HistoryFilters({ draft, invalidField, onChange, onApply, onClear }: HistoryFiltersProps) {
  return (
    <View style={styles.panel}>
      <Text accessibilityRole="header" style={styles.title}>Filtros</Text>
      <FilterField
        label="Destinatario"
        placeholder="Nombre del destinatario"
        value={draft.recipient}
        maxLength={120}
        onChangeText={value => onChange('recipient', value)}
      />
      <View style={styles.fieldRow}>
        <FilterField
          label="Monto exacto"
          placeholder="Ej. 125,50"
          keyboardType="decimal-pad"
          maxLength={24}
          value={draft.amount}
          invalid={invalidField === 'amount'}
          onChangeText={value => onChange('amount', value)}
        />
        <FilterField
          label="Fecha"
          placeholder="AAAA-MM-DD"
          maxLength={10}
          value={draft.date}
          invalid={invalidField === 'date'}
          onChangeText={value => onChange('date', value)}
        />
      </View>
      {invalidField && (
        <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>
          {fieldErrors[invalidField]}
        </Text>
      )}
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onApply} style={styles.apply}>
          <Text style={styles.applyText}>Aplicar filtros</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onClear} style={styles.clear}>
          <Text style={styles.clearText}>Limpiar filtros</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: spacing.md,
    backgroundColor: colors.surface,
  },
  title: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  field: { flex: 1, minWidth: 112, gap: spacing.xs },
  fieldRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  label: { color: colors.ink, fontSize: 14, fontWeight: '600' },
  input: {
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.xs,
    color: colors.ink,
    fontSize: 16,
  },
  invalidInput: { borderColor: colors.danger },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs },
  apply: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: spacing.xs,
  },
  applyText: { color: colors.onPrimary, fontWeight: '700' },
  clear: { minHeight: 48, justifyContent: 'center', padding: spacing.sm },
  clearText: { color: colors.primary, fontWeight: '700' },
  error: { color: colors.danger },
});
