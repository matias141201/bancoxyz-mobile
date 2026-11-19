import { Keyboard, Text, TextInput, View } from 'react-native';

import { localCalendarDate } from '@/shared/domain/calendar-date';
import { currencyFractionDigits } from '@/shared/domain/money';
import { colors } from '@/theme';

import { formatTransferAmountInput } from '../domain/transfer-amount';
import { maximumDocumentLength, type TransferDraft } from '../domain/transfer-draft';
import { TransferButton } from './transfer-button';
import { TransferDateField } from './transfer-date-field';
import { styles } from './transfer-styles';

type Props = Readonly<{
  currency: string;
  draft: TransferDraft;
  tomorrow: Date;
  update: (draft: TransferDraft) => void;
}>;

export function TransferForm({ currency, draft, tomorrow, update }: Props) {
  const amountLabel = `Monto en ${currency}`;
  const fractionDigits = currencyFractionDigits(currency) ?? 0;
  const amountPlaceholder = fractionDigits > 0 ? `0,${'0'.repeat(fractionDigits)}` : '0';

  function selectTiming(timing: TransferDraft['timing']) {
    Keyboard.dismiss();
    const firstFutureDate = localCalendarDate(tomorrow);
    update({ ...draft, timing, date: draft.date >= firstFutureDate ? draft.date : firstFutureDate });
  }

  return (
    <View style={styles.stack}>
      <Text accessibilityRole="header" style={styles.heading}>Nueva transferencia</Text>
      <View style={styles.field}>
        <Text style={styles.label}>Documento del destinatario</Text>
        <TextInput
          accessibilityLabel="Documento del destinatario"
          value={draft.recipientDocument}
          onChangeText={value => update({ ...draft, recipientDocument: value.replace(/\D/gu, '').slice(0, maximumDocumentLength) })}
          inputMode="numeric"
          autoCorrect={false}
          autoCapitalize="none"
          maxLength={maximumDocumentLength}
          style={styles.input}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>{amountLabel}</Text>
        <TextInput
          accessibilityLabel={amountLabel}
          value={draft.amount}
          onChangeText={value => update({ ...draft, amount: formatTransferAmountInput(value, draft.amount, fractionDigits) })}
          inputMode={fractionDigits === 0 ? 'numeric' : 'decimal'}
          placeholder={amountPlaceholder}
          placeholderTextColor={colors.muted}
          maxLength={24}
          style={styles.input}
        />
      </View>
      {draft.timing === 'now' ? (
        <TransferButton title="Programar envío" onPress={() => selectTiming('future')} secondary />
      ) : (
        <View style={styles.field}>
          <TransferDateField value={draft.date} minimum={tomorrow} onChange={date => update({ ...draft, date })} />
          <TransferButton title="Cancelar programación" onPress={() => selectTiming('now')} secondary />
        </View>
      )}
    </View>
  );
}
