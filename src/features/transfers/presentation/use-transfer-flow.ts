import { useEffect, useRef, useState } from 'react';
import { BackHandler } from 'react-native';

import { localCalendarDate } from '@/shared/domain/calendar-date';

import type { SubmitTransfer, TransferError, TransferResult } from '../application/transfer';
import { validateTransferDraft, type TransferDraft } from '../domain/transfer-draft';
import type { TransferOrder } from '../domain/transfer-order';

type TransferStep =
  | { stage: 'draft'; notice: string }
  | { stage: 'review' | 'sending' | 'success' | 'uncertain'; order: TransferOrder; notice: string };

type FlowDependencies = Readonly<{
  currency: string;
  clock: () => Date;
  submit: SubmitTransfer;
  onUnauthorized: () => void;
}>;

const initialDraft: TransferDraft = { recipientDocument: '', amount: '', timing: 'now', date: '' };
const fieldNotice = {
  recipientDocument: 'Ingresá un documento válido.',
  amount: 'Ingresá un monto mayor que cero con los decimales de la moneda.',
  date: 'Elegí una fecha posterior a hoy.',
} as const;
const submitNotice: Record<Exclude<TransferError, 'uncertain'>, string> = {
  invalid: 'El banco indicó que los datos no son válidos. Revisalos antes de volver a enviar.',
  unauthorized: 'Tu sesión venció. Ingresá de nuevo.',
  rejected: 'El banco rechazó la transferencia. Revisá los datos e intentá de nuevo.',
  misconfigured: 'La conexión para transferencias requiere configuración.',
};

function stepFromResult(result: TransferResult, order: TransferOrder): TransferStep {
  if (result.ok) return { stage: 'success', order, notice: '' };
  const httpDetail = result.httpStatus === undefined ? '' : `Respuesta del servidor: HTTP ${result.httpStatus}.`;
  if (result.error === 'uncertain') return { stage: 'uncertain', order, notice: httpDetail };
  const notice = [submitNotice[result.error], httpDetail].filter(Boolean).join(' ');
  return { stage: 'review', order, notice };
}

async function send(transfer: TransferOrder, submit: SubmitTransfer): Promise<TransferResult> {
  try {
    return await submit(transfer);
  } catch {
    return { ok: false, error: 'uncertain' };
  }
}

export function useTransferFlow({ currency, clock, submit, onUnauthorized }: FlowDependencies) {
  const [draft, setDraft] = useState(initialDraft);
  const [step, setStep] = useState<TransferStep>({ stage: 'draft', notice: '' });
  const sending = useRef(false);

  useEffect(() => {
    if (step.stage !== 'sending' || process.env.EXPO_OS !== 'android') return;
    const listener = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => listener.remove();
  }, [step.stage]);

  function update(value: TransferDraft) {
    setDraft(value);
    setStep({ stage: 'draft', notice: '' });
  }

  function review() {
    const result = validateTransferDraft(draft, currency, localCalendarDate(clock()));
    setStep(result.ok
      ? { stage: 'review', order: result.order, notice: '' }
      : { stage: 'draft', notice: fieldNotice[result.field] });
  }

  async function confirm() {
    if (sending.current || step.stage !== 'review') return;

    const result = validateTransferDraft(draft, currency, localCalendarDate(clock()));
    if (!result.ok) {
      setStep({ stage: 'draft', notice: fieldNotice[result.field] });
      return;
    }

    const order = result.order;
    if (order.date !== step.order.date || order.currency !== step.order.currency) {
      setStep({ stage: 'review', order, notice: 'Los datos cambiaron. Revisá el detalle antes de confirmar.' });
      return;
    }

    sending.current = true;
    setStep({ stage: 'sending', order, notice: '' });
    try {
      const outcome = await send(order, submit);
      setStep(stepFromResult(outcome, order));
      if (!outcome.ok && outcome.error === 'unauthorized') onUnauthorized();
    } finally {
      sending.current = false;
    }
  }

  return { draft, step, update, review, confirm };
}
