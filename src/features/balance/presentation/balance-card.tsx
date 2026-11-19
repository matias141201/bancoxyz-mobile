import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ResourceState } from '@/shared/presentation/use-private-resource';
import { colors, spacing } from '@/theme';

import type { Balance } from '../domain/balance';

type Props = Readonly<{ state: ResourceState<Balance>; onReload: () => void }>;

function formatAmount({ amount, currency }: Balance) {
  const { minimumFractionDigits, maximumFractionDigits } = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
  }).resolvedOptions();

  return new Intl.NumberFormat('es-AR', { minimumFractionDigits, maximumFractionDigits }).format(amount);
}

export function BalanceCard({ state, onReload }: Props) {
  const actionLabel = state.status === 'error' ? 'Reintentar' : 'Actualizar saldo';
  const refreshing = state.status === 'ready' && state.refreshing;

  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>
        {state.status === 'ready' && state.message ? 'Último saldo consultado' : 'Saldo de la cuenta'}
      </Text>
      {state.status === 'loading' ? (
        <View style={styles.loading} accessibilityLiveRegion="polite">
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.message}>Consultando tu saldo…</Text>
        </View>
      ) : (
        <>
          {state.status === 'ready' && (
            <View style={styles.amountRow}>
              <Text style={styles.amount}>{formatAmount(state.data)}</Text>
              <Text style={styles.currency}>{state.data.currency}</Text>
            </View>
          )}
          {state.message && <Text accessibilityRole="alert" style={styles.message}>{state.message}</Text>}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            accessibilityState={{ disabled: refreshing, busy: refreshing }}
            disabled={refreshing}
            onPress={onReload}
            style={styles.action}
          >
            <Text style={styles.actionLabel}>{refreshing ? 'Actualizando…' : actionLabel}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.primary, borderRadius: 24, padding: spacing.lg, gap: spacing.md },
  title: { color: colors.accent, fontWeight: '600', fontSize: 16 },
  loading: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', minHeight: 56 },
  message: { color: colors.onPrimary, fontSize: 15, lineHeight: 22 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, flexWrap: 'wrap' },
  amount: { color: colors.onPrimary, fontSize: 40, fontWeight: '700', fontVariant: ['tabular-nums'] },
  currency: { color: colors.accent, fontSize: 17, fontWeight: '700' },
  action: { alignSelf: 'flex-start', minHeight: 48, justifyContent: 'center' },
  actionLabel: { color: colors.onPrimary, fontSize: 15, fontWeight: '600', textDecorationLine: 'underline' },
});
