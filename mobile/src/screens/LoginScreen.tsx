import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { MailIcon, LockIcon, EyeIcon } from '../components/icons';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    clearError();
    setSubmitting(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch {
      // error surfaced via context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.logo}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoIconText}>$</Text>
            </View>
            <Text style={styles.title}>ExpenseTracker</Text>
            <Text style={styles.subtitle}>Track every expense, stay in control.</Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.field}>
            <View style={styles.fieldIcon}><MailIcon size={16} color={colors.textMuted} /></View>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.field}>
            <View style={styles.fieldIcon}><LockIcon size={16} color={colors.textMuted} /></View>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity style={styles.toggleVisibility} onPress={() => setShowPassword((v) => !v)}>
              <EyeIcon size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={onSubmit}
            disabled={submitting || !email || !password}
          >
            {submitting ? (
              <ActivityIndicator color={colors.accentContrast} />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Sign up free</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%', maxWidth: 380, backgroundColor: colors.surface,
    borderRadius: 22, padding: 26, borderWidth: 1, borderColor: colors.border,
  },
  logo: { alignItems: 'center', marginBottom: 22, gap: 6 },
  logoIcon: {
    width: 46, height: 46, borderRadius: 14, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  logoIconText: { color: colors.accentContrast, fontWeight: '800', fontSize: 20 },
  title: { color: colors.text, fontSize: 20, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 13 },
  error: { color: colors.danger, fontSize: 13, marginBottom: 10, textAlign: 'center' },
  field: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg,
    borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, marginBottom: 12,
  },
  fieldIcon: { marginRight: 8 },
  input: { flex: 1, color: colors.text, paddingVertical: 12, fontSize: 15 },
  toggleVisibility: { padding: 6 },
  button: {
    backgroundColor: colors.accent, borderRadius: 999, paddingVertical: 13,
    alignItems: 'center', marginTop: 6,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.accentContrast, fontWeight: '700', fontSize: 15 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  footerText: { color: colors.textMuted, fontSize: 13 },
  footerLink: { color: colors.accent, fontWeight: '700', fontSize: 13 },
});
