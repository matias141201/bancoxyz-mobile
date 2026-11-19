import { Text, View } from 'react-native';

import { formatCalendarDate } from '@/shared/domain/calendar-date';
import { formatMoney } from '@/shared/domain/money';

import type { TransferOrder } from '../domain/transfer-order';
import { styles } from './transfer-styles';

export function TransferSummary({ order }: { order: TransferOrder }) {
  return (
    <View style={styles.summary}>
      <View style={styles.field}>
        <Text style={styles.label}>Monto</Text>
        <Text style={styles.summaryAmount}>{formatMoney(order.amountMinor, order.currency)}</Text>
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Documento del destinatario</Text>
        <Text style={styles.summaryValue}>{order.recipientDocument}</Text>
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Fecha de transferencia</Text>
        <Text style={styles.summaryValue}>{formatCalendarDate(order.date)}</Text>
      </View>
    </View>
  );
}
