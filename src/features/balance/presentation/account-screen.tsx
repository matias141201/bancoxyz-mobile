import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ResourceState } from '@/shared/presentation/use-private-resource';
import { colors, spacing } from '@/theme';

import type { Balance } from '../domain/balance';
import { BalanceCard } from './balance-card';

type Props = Readonly<{
  name: string;
  balance: ResourceState<Balance>;
  onReload: () => void;
  onSignOut: () => void;
  onHistory: () => void;
  onTransfer: () => void;
}>;

export function AccountScreen({ name, balance, onReload, onSignOut, onHistory, onTransfer }: Props) {
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

  function closeConfirmation() {
    setConfirmingSignOut(false);
  }

  function confirmSignOut() {
    closeConfirmation();
    onSignOut();
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brand}>BancoXYZ<Text style={styles.accent}>.</Text></Text>
          <Pressable accessibilityRole="button" onPress={() => setConfirmingSignOut(true)} style={styles.button}>
            <Text style={styles.buttonLabel}>Cerrar sesión</Text>
          </Pressable>
        </View>
        <Text accessibilityRole="header" style={styles.heading}>Hola, {name}</Text>
        <BalanceCard state={balance} onReload={onReload} />
        <View style={styles.quickActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Transferir" onPress={onTransfer} style={styles.action}>
            <View aria-hidden style={[styles.actionCircle, styles.primaryAction]}>
              <View style={styles.plusHorizontal} />
              <View style={styles.plusVertical} />
            </View>
            <Text style={styles.buttonLabel}>Transferir</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Historial" onPress={onHistory} style={styles.action}>
            <View aria-hidden style={styles.actionCircle}>
              <View style={styles.historyIcon}>
                <View style={styles.historyArrow} />
                <View style={styles.historyHands} />
              </View>
            </View>
            <Text style={styles.buttonLabel}>Historial</Text>
          </Pressable>
        </View>
      </ScrollView>
      <Modal transparent animationType="fade" visible={confirmingSignOut} onRequestClose={closeConfirmation}>
        <View style={styles.modalBackdrop}>
          <View accessibilityViewIsModal style={styles.modalCard}>
            <Text accessibilityRole="header" style={styles.modalTitle}>¿Cerrar sesión?</Text>
            <View style={styles.modalActions}>
              <Pressable accessibilityRole="button" onPress={closeConfirmation} style={styles.modalButton}>
                <Text style={styles.buttonLabel}>Cancelar</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={confirmSignOut} style={[styles.modalButton, styles.confirmButton]}>
                <Text style={styles.confirmLabel}>Sí, cerrar sesión</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: spacing.lg, padding: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
  brand: { color: colors.ink, fontSize: 21, fontWeight: '800', letterSpacing: -0.4 },
  accent: { color: colors.primary },
  heading: { color: colors.ink, fontSize: 30, fontWeight: '700', letterSpacing: -0.6 },
  button: { minHeight: 48, justifyContent: 'center' },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.xl },
  action: { alignItems: 'center', gap: spacing.xs },
  actionCircle: {
    width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  primaryAction: { backgroundColor: colors.primary },
  plusHorizontal: { position: 'absolute', width: 22, height: 2, borderRadius: 1, backgroundColor: colors.onPrimary },
  plusVertical: { position: 'absolute', width: 2, height: 22, borderRadius: 1, backgroundColor: colors.onPrimary },
  historyIcon: { width: 23, height: 23, borderWidth: 2, borderColor: colors.primary, borderRadius: 12, borderLeftColor: 'transparent' },
  historyArrow: {
    position: 'absolute', top: 1, left: -3, width: 8, height: 8,
    borderLeftWidth: 2, borderBottomWidth: 2, borderColor: colors.primary,
  },
  historyHands: {
    position: 'absolute', top: 4, left: 8, width: 6, height: 7,
    borderLeftWidth: 2, borderBottomWidth: 2, borderColor: colors.primary,
  },
  buttonLabel: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  modalBackdrop: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.scrim, padding: spacing.lg,
  },
  modalCard: { width: '100%', maxWidth: 380, gap: spacing.md, backgroundColor: colors.surface, borderRadius: 20, padding: spacing.lg },
  modalTitle: { color: colors.ink, fontSize: 22, fontWeight: '700' },
  modalActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: spacing.xs },
  modalButton: {
    minHeight: 48, justifyContent: 'center', alignItems: 'center',
    borderRadius: spacing.xs, paddingHorizontal: spacing.sm,
  },
  confirmButton: { backgroundColor: colors.danger },
  confirmLabel: { color: colors.onPrimary, fontSize: 15, fontWeight: '700' },
});
