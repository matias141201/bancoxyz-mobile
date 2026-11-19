import { useLayoutEffect } from 'react';
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
  availableBalance: number;
  submit: SubmitTransfer;
  onSuccess: () => void;
  onUnauthorized: () => void;
  onBack: () => void;
  onReviewBackChange?: (action: (() => void) | null) => void;
  onViewHistory?: () => void;
  clock?: () => Date;
}>;

const systemClock = () => new Date();

export function TransferScreen({ clock = systemClock, onReviewBackChange, ...props }: TransferScreenProps) {
  const flow = useTransferFlow({ ...props, clock });
  const { step, edit } = flow;
  const isReview = step.stage === 'review';

  useLayoutEffect(() => {
    if (!isReview || !onReviewBackChange) return;
    onReviewBackChange(edit);
    return () => onReviewBackChange(null);
  }, [edit, isReview, onReviewBackChange]);

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.screen} behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TransferContent {...props} flow={flow} today={clock()} />
        </ScrollView>
        <TransferActions flow={flow} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type ContentProps = Pick<TransferScreenProps, 'currency' | 'onBack' | 'onSuccess' | 'onViewHistory'> & {
  flow: ReturnType<typeof useTransferFlow>;
  today: Date;
};

function TransferContent({ currency, onBack, onSuccess, onViewHistory, flow, today }: ContentProps) {
  const { draft, step, update, edit } = flow;
  if (step.stage === 'draft') {
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 12);
    return (
      <>
        <TransferButton title="Volver" onPress={onBack} secondary />
        <TransferForm currency={currency} draft={draft} tomorrow={tomorrow} update={update} />
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

  return (
    <View style={styles.stack}>
      {step.stage === 'review' && <TransferButton title="Volver" onPress={edit} secondary />}
      <Text accessibilityRole="header" style={styles.heading}>Revisá los datos</Text>
      <TransferSummary order={step.order} />
      <TransferNotice notice={step.notice} />
    </View>
  );
}

function TransferActions({ flow }: { flow: ReturnType<typeof useTransferFlow> }) {
  const { draft, step, edit, review, confirm } = flow;
  if (step.stage === 'draft') {
    return (
      <View style={styles.footer}>
        <TransferNotice notice={step.notice} />
        <TransferButton
          title={draft.timing === 'future' ? 'Programar transferencia' : 'Enviar transferencia'}
          onPress={() => {
            Keyboard.dismiss();
            review();
          }}
        />
      </View>
    );
  }

  if (step.stage !== 'review' && step.stage !== 'sending') return null;
  const isSending = step.stage === 'sending';
  return (
    <View style={styles.footer}>
      <TransferButton title="Editar datos" onPress={edit} disabled={isSending} secondary centered />
      <TransferButton title="Confirmar transferencia" onPress={() => void confirm()} disabled={isSending} busy={isSending} />
    </View>
  );
}
