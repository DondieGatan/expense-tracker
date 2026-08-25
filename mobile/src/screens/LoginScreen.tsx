import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, ArrowRightIcon } from '../components/icons';
import GlowBlob from '../components/GlowBlob';
import AnimatedPressable from '../components/AnimatedPressable';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { login, error, retryStatus, clearError } = useAuth();
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

  const canSubmit = !submitting && !!email && !!password;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View entering={FadeInUp.duration(500).springify().damping(16)} style={styles.card}>
          <GlowBlob size={200} color={colors.accent} style={styles.glow} />

          <View style={styles.cardContent}>
            <Animated.View entering={FadeIn.duration(500).delay(100)} style={styles.header}>
              <View style={styles.logoIcon}>
                <Image source={require('../../assets/logo-mark.png')} style={styles.logoImage} resizeMode="contain" />
              </View>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in to your account</Text>
            </Animated.View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {retryStatus ? <Text style={styles.retryStatus}>{retryStatus}</Text> : null}

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.field}>
              <View style={styles.passwordRow}>
                <View style={styles.passwordCol}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onSubmitEditing={canSubmit ? onSubmit : undefined}
                  />
                </View>
                <TouchableOpacity style={styles.toggleVisibility} onPress={() => setShowPassword((v) => !v)}>
                  <EyeIcon size={16} color={colors.textMuted} />
                </TouchableOpacity>
                <AnimatedPressable
                  style={[styles.submitCircle, !canSubmit && styles.submitCircleDisabled]}
                  onPress={onSubmit}
                  disabled={!canSubmit}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color={colors.accentContrast} />
                  ) : (
                    <ArrowRightIcon size={18} color={colors.accentContrast} />
                  )}
                </AnimatedPressable>
              </View>
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don&apos;t have an account yet? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.footerLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%', maxWidth: 380, backgroundColor: colors.surface,
    borderRadius: 28, borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  glow: { position: 'absolute', top: -60, left: -60 },
  cardContent: { padding: 28 },
  header: { marginBottom: 22, gap: 6 },
  logoIcon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#07090D',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  logoImage: { width: 28, height: 28 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { color: colors.textMuted, fontSize: 14 },
  error: { color: colors.danger, fontSize: 13, marginBottom: 10 },
  retryStatus: { color: colors.textMuted, fontSize: 13, marginBottom: 10 },
  field: {
    backgroundColor: colors.bg, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 16, paddingVertical: 10, marginBottom: 14,
  },
  fieldLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 2 },
  fieldInput: { color: colors.text, fontSize: 16, padding: 0 },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  passwordCol: { flex: 1 },
  toggleVisibility: { padding: 6, marginLeft: 4 },
  submitCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center', marginLeft: 6,
  },
  submitCircleDisabled: { opacity: 0.5 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
  footerText: { color: colors.textMuted, fontSize: 13 },
  footerLink: { color: colors.accent, fontWeight: '700', fontSize: 13, textDecorationLine: 'underline' },
});
