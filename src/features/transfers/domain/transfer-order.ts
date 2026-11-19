export type TransferOrder = Readonly<{
  recipientDocument: string;
  amountMinor: number;
  fractionDigits: number;
  currency: string;
  date: string;
}>;
