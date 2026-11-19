import { Pressable, Text } from 'react-native';

import { styles } from './transfer-styles';

type TransferButtonProps = Readonly<{
  title: string;
  onPress: () => void;
  secondary?: boolean;
  centered?: boolean;
  disabled?: boolean;
  busy?: boolean;
}>;

export function TransferButton({ title, onPress, secondary, centered, disabled, busy }: TransferButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      onPress={onPress}
      style={[secondary ? styles.secondary : styles.action, centered && styles.centered, disabled && styles.disabled]}
    >
      <Text style={secondary ? styles.secondaryLabel : styles.actionLabel}>{busy ? 'Enviando…' : title}</Text>
    </Pressable>
  );
}
