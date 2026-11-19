import type { TransferOrder } from '../domain/transfer-order';

export type { TransferOrder } from '../domain/transfer-order';

export type TransferError = 'invalid' | 'unauthorized' | 'rejected' | 'uncertain' | 'misconfigured';

export type TransferResult = { ok: true } | { ok: false; error: TransferError; httpStatus?: number };

export type SubmitTransfer = (order: TransferOrder) => Promise<TransferResult>;
