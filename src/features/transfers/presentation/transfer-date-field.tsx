import { Text, TextInput, View } from 'react-native';

import { colors } from '@/theme';

import { styles } from './transfer-styles';

export type TransferDateFieldProps = Readonly<{
  value: string;
  minimum: Date;
  onChange: (value: string) => void;
}>;

export function TransferDateField({ value, onChange }: TransferDateFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>Fecha de transferencia</Text>
      <TextInput
        accessibilityLabel="Fecha de transferencia"
        value={value}
        onChangeText={onChange}
        autoCorrect={false}
        autoCapitalize="none"
        placeholder="AAAA-MM-DD"
        placeholderTextColor={colors.muted}
        maxLength={10}
        style={styles.input}
      />
      <Text style={styles.description}>Ingresá la fecha con el formato AAAA-MM-DD.</Text>
    </View>
  );
}
