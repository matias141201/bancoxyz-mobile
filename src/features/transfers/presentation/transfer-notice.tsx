import { Text } from 'react-native';

import { styles } from './transfer-styles';

export function TransferNotice({ notice }: { notice: string }) {
  return notice ? (
    <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{notice}</Text>
  ) : null;
}
