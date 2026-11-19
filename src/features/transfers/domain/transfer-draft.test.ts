import { validateTransferDraft } from './transfer-draft';

const draft = {
  recipientDocument: ' 000123 ',
  amount: '12,35',
  date: '',
  timing: 'now' as const,
};

it('conserva el documento como texto y usa la fecha local para transferencias inmediatas', () => {
  expect(validateTransferDraft(draft, 'ARS', '2026-11-19')).toEqual({
    ok: true,
    order: {
      amountMinor: 1235,
      fractionDigits: 2,
      currency: 'ARS',
      recipientDocument: '000123',
      date: '2026-11-19',
    },
  });
});

it('conserva una fecha futura válida y aplica la precisión de la moneda', () => {
  expect(validateTransferDraft({ ...draft, timing: 'future', date: '2028-02-29', amount: '2.155' }, 'KWD', '2028-02-28'))
    .toMatchObject({ ok: true, order: { amountMinor: 2155, fractionDigits: 3, date: '2028-02-29' } });
  expect(validateTransferDraft({ ...draft, amount: '15' }, 'JPY', '2026-11-19'))
    .toMatchObject({ ok: true, order: { amountMinor: 15, fractionDigits: 0 } });
});

it.each(['', '   ', '00\u0000123'])('rechaza un documento inválido', recipientDocument => {
  expect(validateTransferDraft({ ...draft, recipientDocument }, 'ARS', '2026-11-19')).toEqual({
    ok: false,
    field: 'recipientDocument',
  });
});

it.each(['', '0', '-25', '12.001', '1,200.00', '90071992547409.91'])(
  'rechaza montos no positivos, ambiguos o que no se pueden enviar con exactitud',
  amount => {
    expect(validateTransferDraft({ ...draft, amount }, 'ARS', '2026-11-19')).toEqual({
      ok: false,
      field: 'amount',
    });
  },
);

it.each(['', '2026-02-31', '2026-11-19', '2026-11-18'])(
  'requiere una fecha real estrictamente posterior a hoy',
  date => {
    expect(validateTransferDraft({ ...draft, timing: 'future', date }, 'ARS', '2026-11-19')).toEqual({
      ok: false,
      field: 'date',
    });
  },
);
