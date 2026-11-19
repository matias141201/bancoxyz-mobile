import { Keyboard, Pressable, Text, TextInput, View } from 'react-native';

import { localCalendarDate } from '@/shared/domain/calendar-date';
import { currencyFractionDigits } from '@/shared/domain/money';
import { colors } from '@/theme';

import { maximumDocumentLength, type TransferDraft } from '../domain/transfer-draft';
import { TransferButton } from './transfer-button';
import { TransferDateField } from './transfer-date-field';
import { TransferNotice } from './transfer-notice';
import { styles } from './transfer-styles';

type Props = Readonly<{
  currency: string;
  draft: TransferDraft;
  tomorrow: Date;
  update: (draft: TransferDraft) => void;
  review: () => void;
  notice: string;
}>;

export function TransferForm({ currency, draft, tomorrow, update, review, notice }: Props) {
  const amountLabel = `Monto en ${currency}`;
  const fractionDigits = currencyFractionDigits(currency) ?? 0;
  const amountPlaceholder = fractionDigits > 0 ? `0,${'0'.repeat(fractionDigits)}` : '0';

  function selectTiming(timing: TransferDraft['timing']) {
    Keyboard.dismiss();
    update({ ...draft, timing, date: draft.date || localCalendarDate(tomorrow) });
  }

  return (
    <View style={styles.stack}>
      <Text accessibilityRole="header" style={styles.heading}>Nueva transferencia</Text>
      <View style={styles.field}>
        <Text style={styles.label}>Documento del destinatario</Text>
        <TextInput
          accessibilityLabel="Documento del destinatario"
          value={draft.recipientDocument}
          onChangeText={recipientDocument => update({ ...draft, recipientDocument })}
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
          onChangeText={amount => update({ ...draft, amount })}
          inputMode="decimal"
          placeholder={amountPlaceholder}
          placeholderTextColor={colors.muted}
          maxLength={20}
          style={styles.input}
        />
      </View>
      <TimingChoices timing={draft.timing} onSelect={selectTiming} />
      {draft.timing === 'future' && (
        <TransferDateField value={draft.date} minimum={tomorrow} onChange={date => update({ ...draft, date })} />
      )}
      <TransferNotice notice={notice} />
      <TransferButton title="Revisar transferencia" onPress={review} />
    </View>
  );
}

function TimingChoices({ timing, onSelect }: {
  timing: TransferDraft['timing'];
  onSelect: (value: TransferDraft['timing']) => void;
}) {
  const choices = [
    { value: 'now', title: 'Enviar hoy' },
    { value: 'future', title: 'Programar' },
  ] as const;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>¿Cuándo?</Text>
      <View style={styles.choices}>
        {choices.map(({ value, title }) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityState={{ selected: timing === value }}
            onPress={() => onSelect(value)}
            style={[styles.choice, timing === value && styles.activeChoice]}
          >
            <Text style={styles.label}>{title}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
