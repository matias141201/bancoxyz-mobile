import { Keyboard, KeyboardAvoidingView, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { SubmitTransfer } from '../application/transfer';
import { TransferButton } from './transfer-button';
import { TransferForm } from './transfer-form';
import { TransferNotice } from './transfer-notice';
import { styles } from './transfer-styles';
import { TransferSummary } from './transfer-summary';
import { useTransferFlow } from './use-transfer-flow';

type TransferScreenProps = Readonly<{
  currency: string;
  submit: SubmitTransfer;
  onSuccess: () => void;
  onUnauthorized: () => void;
  onBack: () => void;
  onViewHistory?: () => void;
  clock?: () => Date;
}>;

const systemClock = () => new Date();

export function TransferScreen({ clock = systemClock, ...props }: TransferScreenProps) {
  const flow = useTransferFlow({ ...props, clock });

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.screen} behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TransferContent {...props} flow={flow} today={clock()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type ContentProps = Pick<TransferScreenProps, 'currency' | 'onBack' | 'onSuccess' | 'onViewHistory'> & {
  flow: ReturnType<typeof useTransferFlow>;
  today: Date;
};

function TransferContent({ currency, onBack, onSuccess, onViewHistory, flow, today }: ContentProps) {
  const { draft, step, update, review, confirm } = flow;
  if (step.stage === 'draft') {
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 12);
    return (
      <>
        <TransferButton title="Volver" onPress={onBack} secondary />
        <TransferForm currency={currency} draft={draft} tomorrow={tomorrow} update={update} notice={step.notice}
          review={() => {
            Keyboard.dismiss();
            review();
          }}
        />
      </>
    );
  }

  if (step.stage === 'success') {
    return (
      <View style={styles.stack}>
        <Text accessibilityRole="header" style={styles.heading}>
          {draft.timing === 'future' ? 'Solicitud de programación aceptada' : 'Solicitud aceptada'}
        </Text>
        <Text style={styles.description}>
          Consultá el historial para verificar si el banco registró el movimiento.
        </Text>
        <TransferSummary order={step.order} />
        {onViewHistory && <TransferButton title="Ver historial" onPress={onViewHistory} />}
        <TransferButton title="Volver al inicio" onPress={onSuccess} secondary={Boolean(onViewHistory)} />
      </View>
    );
  }

  if (step.stage === 'uncertain') {
    return (
      <View style={styles.stack}>
        <Text accessibilityRole="header" style={styles.heading}>Resultado pendiente</Text>
        <Text style={styles.description}>
          No pudimos confirmar el envío. Revisá tus movimientos antes de intentar otra transferencia.
        </Text>
        <TransferNotice notice={step.notice} />
        <TransferSummary order={step.order} />
        {onViewHistory && <TransferButton title="Ver movimientos" onPress={onViewHistory} />}
        <TransferButton title="Volver al inicio" onPress={onBack} secondary={Boolean(onViewHistory)} />
      </View>
    );
  }

  const isSending = step.stage === 'sending';
  return (
    <View style={styles.stack}>
      <Text accessibilityRole="header" style={styles.heading}>Revisá los datos</Text>
      <TransferSummary order={step.order} />
      <TransferNotice notice={step.notice} />
      <TransferButton title="Confirmar transferencia" onPress={() => void confirm()} disabled={isSending} busy={isSending} />
      <TransferButton title="Editar datos" onPress={() => update(draft)} disabled={isSending} secondary />
    </View>
  );
}
