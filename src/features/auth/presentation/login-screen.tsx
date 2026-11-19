import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

import type { SignInError } from '../application/sign-in';
import { validateCredentials } from '../domain/credentials';
import { useAuth } from './auth-context';

const errorMessage: Record<SignInError, string> = {
  'invalid-credentials': 'Revisá el correo y la contraseña.',
  unavailable: 'El servicio no está disponible. Intentá de nuevo.',
  'invalid-response': 'El servicio devolvió una respuesta inesperada. Intentá de nuevo.',
  misconfigured: 'El acceso requiere configurar la conexión con BancoXYZ.',
};

export function LoginScreen() {
  const { authenticate, notice: authNotice } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState('');
  const submitting = useRef(false);

  async function submit() {
    if (submitting.current) return;

    const result = validateCredentials({ email, password });
    if (!result.ok) {
      setNotice(result.field === 'email' ? 'Ingresá un correo electrónico válido.' : 'Ingresá tu contraseña.');
      return;
    }

    submitting.current = true;
    setPending(true);
    setNotice('');
    try {
      const attempt = await authenticate(result.credentials);
      if (!attempt.ok) setNotice(errorMessage[attempt.error]);
    } catch {
      setNotice(errorMessage.unavailable);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  const visibleNotice = pending ? '' : notice || authNotice;

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.screen} behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <View style={styles.brand}>
              <Text style={styles.brandName}>BancoXYZ<Text style={styles.brandAccent}>.</Text></Text>
              <Text style={styles.brandCaption}>Banca móvil</Text>
            </View>
            <View style={styles.form}>
              <Text accessibilityRole="header" style={styles.title}>Ingresá a tu cuenta</Text>
              <View style={styles.field}>
                <Text style={styles.label}>Correo electrónico</Text>
                <TextInput
                  accessibilityLabel="Correo electrónico"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  editable={!pending}
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="nombre@ejemplo.com"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  value={email}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                  accessibilityLabel="Contraseña"
                  autoCapitalize="none"
                  autoComplete="current-password"
                  editable={!pending}
                  onChangeText={setPassword}
                  onSubmitEditing={() => void submit()}
                  returnKeyType="go"
                  secureTextEntry
                  style={styles.input}
                  value={password}
                />
              </View>
              {visibleNotice !== '' && (
                <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>
                  {visibleNotice}
                </Text>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ingresar"
                accessibilityState={{ disabled: pending, busy: pending }}
                disabled={pending}
                onPress={() => void submit()}
                style={[styles.button, pending && styles.pending]}
              >
                <Text style={styles.buttonLabel}>{pending ? 'Ingresando…' : 'Ingresar'}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  content: { width: '100%', maxWidth: 460, alignSelf: 'center', gap: spacing.lg },
  brand: {
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    minHeight: 146,
    padding: spacing.lg,
    gap: spacing.xs,
    borderRadius: 24,
    backgroundColor: colors.primary,
  },
  brandName: { color: colors.onPrimary, fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  brandAccent: { color: colors.accent },
  brandCaption: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  form: { gap: spacing.md },
  title: { color: colors.ink, fontSize: 29, fontWeight: '700', letterSpacing: -0.8 },
  field: { gap: spacing.xs },
  label: { color: colors.ink, fontSize: 15, fontWeight: '600' },
  input: {
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.ink,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.sm,
    fontSize: 16,
  },
  error: { color: colors.danger, fontSize: 14, lineHeight: 20 },
  button: {
    minHeight: 52,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pending: { backgroundColor: colors.muted },
  buttonLabel: { color: colors.onPrimary, fontWeight: '700', fontSize: 16 },
});
