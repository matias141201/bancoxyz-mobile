import { ActivityIndicator, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme';

import { TransferButton } from './transfer-button';
import { styles } from './transfer-styles';

type Props = Readonly<{
  state: { status: 'loading' } | { status: 'error'; message: string };
  onReload: () => void;
  onBack: () => void;
}>;

export function TransferCurrencyState({ state, onReload, onBack }: Props) {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <TransferButton title="Volver" onPress={onBack} secondary />
        <Text accessibilityRole="header" style={styles.heading}>Nueva transferencia</Text>
        {state.status === 'loading' ? (
          <>
            <ActivityIndicator color={colors.primary} />
            <Text accessibilityLiveRegion="polite" style={styles.description}>Consultando la moneda de tu cuenta…</Text>
          </>
        ) : (
          <>
            <Text accessibilityRole="alert" style={styles.description}>{state.message}</Text>
            <TransferButton title="Reintentar" onPress={onReload} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
