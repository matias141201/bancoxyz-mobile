import { useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, Keyboard, Pressable, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatCalendarDate, localCalendarDate } from '@/shared/domain/calendar-date';
import { formatMoney } from '@/shared/domain/money';
import { colors, spacing } from '@/theme';

import {
  filterHistory, validateHistoryFilters, type HistoryEntry, type HistoryFilters as Filters,
  type InvalidHistoryFilter,
} from '../domain/history';
import { FilterPanelMotion } from './filter-panel-motion';
import { HistoryFilters } from './history-filters';

export type HistoryState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; entries: readonly HistoryEntry[]; refreshing?: boolean; message?: string };

type HistoryScreenProps = Readonly<{
  state: HistoryState;
  onReload: () => void;
  onBack: () => void;
}>;

const emptyFilters: Filters = { recipient: '', amount: '', date: '' };
const noEntries: readonly HistoryEntry[] = [];

function HistoryRow({ item }: { item: HistoryEntry }) {
  return (
    <View style={styles.entry}>
      <View style={styles.entryDetails}>
        <Text style={styles.name}>{item.recipientName}</Text>
        <Text style={styles.muted}>{formatCalendarDate(item.date)}</Text>
      </View>
      <Text style={styles.amount}>{formatMoney(item.amountMinor, item.currency)}</Text>
    </View>
  );
}

function HistoryEmptyState({ state, onReload, date }: Pick<HistoryScreenProps, 'state' | 'onReload'> & { date: string }) {
  if (state.status === 'loading') {
    return (
      <View style={styles.feedback} accessibilityLiveRegion="polite">
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.muted}>Cargando transferencias…</Text>
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={styles.feedback}>
        <Text style={styles.name}>No pudimos cargar el historial</Text>
        <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.muted}>{state.message}</Text>
        <Pressable accessibilityRole="button" onPress={onReload} style={styles.action}>
          <Text style={styles.actionLabel}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  const emptyDate = date && !state.entries.some(entry => entry.date === date);
  const hasTransfers = state.entries.length > 0;
  const emptyTitle = emptyDate
    ? `No hay transferencias para el ${formatCalendarDate(date)}`
    : hasTransfers ? 'No hay coincidencias' : 'Todavía no hay transferencias';
  return (
    <View style={styles.feedback} accessibilityLiveRegion="polite">
      <Text style={styles.name}>{emptyTitle}</Text>
      <Text style={styles.muted}>
        {emptyDate || hasTransfers ? 'Probá con otros filtros.' : 'Los movimientos aparecerán acá cuando hagas una transferencia.'}
      </Text>
    </View>
  );
}

export function HistoryScreen({ state, onReload, onBack }: HistoryScreenProps) {
  const [draft, setDraft] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [invalidField, setInvalidField] = useState<InvalidHistoryFilter | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const entries = state.status === 'ready' ? state.entries : noEntries;
  const shown = useMemo(() => filterHistory(entries, applied), [entries, applied]);

  function onApply() {
    const invalid = validateHistoryFilters(draft, localCalendarDate(new Date()));
    setInvalidField(invalid);
    if (!invalid) {
      setApplied({ ...draft, date: draft.date.trim() });
      setFiltersOpen(false);
      Keyboard.dismiss();
    }
  }

  function onClear() {
    setDraft(emptyFilters);
    setApplied(emptyFilters);
    setInvalidField(null);
    Keyboard.dismiss();
  }

  const heading = (
    <View style={styles.heading}>
      <Pressable accessibilityRole="button" accessibilityLabel="Volver al inicio" onPress={onBack} style={styles.action}>
        <Text style={styles.actionLabel}>‹ Inicio</Text>
      </Pressable>
      <Text accessibilityRole="header" style={styles.title}>Historial</Text>
      {state.status === 'ready' && (
        <>
          <View collapsable={false}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Filtro"
              accessibilityState={{ expanded: filtersOpen }}
              style={styles.filterToggle}
              onPress={() => {
                if (filtersOpen) Keyboard.dismiss();
                setFiltersOpen(previous => !previous);
              }}
            >
              <Text style={styles.actionLabel}>Filtro</Text>
              <Text aria-hidden style={[styles.actionLabel, filtersOpen && styles.filterArrowExpanded]}>→</Text>
            </Pressable>
            {filtersOpen && (
              <FilterPanelMotion>
                <HistoryFilters
                  draft={draft}
                  invalidField={invalidField}
                  onChange={(field, value) => setDraft(previous => ({ ...previous, [field]: value }))}
                  onApply={onApply}
                  onClear={onClear}
                />
              </FilterPanelMotion>
            )}
          </View>
          <View style={styles.listHeading}>
            <Text accessibilityRole="header" style={styles.section}>Transferencias</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Actualizar historial"
              accessibilityState={{ disabled: state.refreshing }}
              disabled={state.refreshing}
              onPress={onReload}
              style={styles.action}
            >
              <Text style={styles.actionLabel}>{state.refreshing ? 'Actualizando…' : 'Actualizar'}</Text>
            </Pressable>
          </View>
          {state.message && (
            <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.muted}>
              {state.message}
            </Text>
          )}
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        data={shown}
        keyExtractor={item => item.key}
        renderItem={({ item }) => <HistoryRow item={item} />}
        ListHeaderComponent={heading}
        ListEmptyComponent={<HistoryEmptyState state={state} onReload={onReload} date={applied.date} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  list: { width: '100%', maxWidth: 640, alignSelf: 'center' },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  heading: { gap: spacing.md },
  title: { color: colors.ink, fontSize: 32, fontWeight: '700' },
  section: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  action: { minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start', paddingVertical: spacing.xs },
  actionLabel: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  filterToggle: { minHeight: 48, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: spacing.xs },
  filterArrowExpanded: { transform: [{ rotate: '90deg' }] },
  listHeading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entry: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  entryDetails: { flex: 1, minWidth: 120, gap: spacing.xs },
  name: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 14 },
  amount: { color: colors.ink, fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'], flexShrink: 1 },
  feedback: { paddingVertical: spacing.lg, gap: spacing.xs, alignItems: 'flex-start' },
});
