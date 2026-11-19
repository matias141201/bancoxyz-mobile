import { fireEvent, render, screen } from '@testing-library/react-native';

import { CalendarPicker } from './calendar-picker.android';

jest.mock('@expo/ui/community/datetime-picker', () => {
  const { Pressable, Text } = jest.requireActual('react-native');

  return {
    DateTimePicker: ({ onValueChange }: { onValueChange: (event: unknown, date: Date) => void }) => (
      <Pressable accessibilityRole="button" onPress={() => onValueChange({}, new Date(2026, 10, 17, 12))}>
        <Text>17 de noviembre</Text>
      </Pressable>
    ),
  };
});

it('mantiene la fecha seleccionada dentro del diálogo hasta confirmar', async () => {
  const onSelect = jest.fn();
  const onDismiss = jest.fn();
  await render(
    <CalendarPicker value={new Date(2026, 10, 19, 12)} onSelect={onSelect} onDismiss={onDismiss} />,
  );

  expect(screen.getByRole('header', { name: 'Elegí una fecha' })).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: '17 de noviembre' }));
  expect(onSelect).not.toHaveBeenCalled();

  await fireEvent.press(screen.getByRole('button', { name: 'Elegir' }));
  expect(onSelect).toHaveBeenCalledWith(new Date(2026, 10, 17, 12));
  expect(onDismiss).not.toHaveBeenCalled();

  await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
  expect(onDismiss).toHaveBeenCalledTimes(1);
});
