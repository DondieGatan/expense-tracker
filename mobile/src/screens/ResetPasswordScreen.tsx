import React, { useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet, Image, ImageBackground,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, { FadeInUp, FadeIn, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeOffIcon, ArrowRightIcon } from '../components/icons';
import GlowBlob from '../components/GlowBlob';
import AnimatedPressable from '../components/AnimatedPressable';
import { useWebAutofillFix } from '../hooks/useWebAutofillFix';
import { useWebFont, webFontFamily } from '../hooks/useWebFont';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

const notFocusable = { tabIndex: -1 } as any;

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  useWebAutofillFix('transparent', colors.text);
  useWebFont();
  const { resetPassword, forgotPassword, error, retryStatus, clearError } = useAuth();
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [focusedField, setFocusedField] = useState<'code' | 'password' | null>(null);
  const codeRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const onSubmit = async () => {
    clearError();
    setSubmitting(true);
    try {
      await resetPassword(email, code.trim(), password);
      navigation.navigate('Login');
    } catch {
      // error surfaced via context
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    clearError();
    setResending(true);
    try {
      await forgotPassword(email);
    } catch {
      // error surfaced via context
    } finally {
      setResending(false);
    }
  };

  const canSubmit = !submitting && !!code && password.length >= 6;

  const content = (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Animated.View entering={FadeInUp.duration(500).springify().damping(16)} style={styles.card}>
        <GlowBlob size={170} color={colors.accent} style={styles.glow} />

        <View style={styles.cardContent}>
          <Animated.View entering={FadeIn.duration(500).delay(100)} style={styles.header}>
            <View style={styles.logoIcon}>
              <Image source={require('../../assets/logo-mark.png')} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text style={styles.title}>Reset password</Text>
            <Text style={styles.subtitle}>Enter the code sent to {email} and choose a new password.</Text>
          </Animated.View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {retryStatus ? <Text style={styles.retryStatus}>{retryStatus}</Text> : null}

          <Pressable
            style={[styles.field, focusedField === 'code' && styles.fieldFocused]}
            onPress={() => codeRef.current?.focus()}
            {...notFocusable}
          >
            <Text style={styles.fieldLabel}>Reset code</Text>
            <TextInput
              ref={codeRef}
              style={styles.fieldInput}
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              autoComplete="off"
              value={code}
              onChangeText={setCode}
              onFocus={() => setFocusedField('code')}
              onBlur={() => setFocusedField((f) => (f === 'code' ? null : f))}
            />
          </Pressable>

          <Pressable
            style={[styles.field, focusedField === 'password' && styles.fieldFocused]}
            onPress={() => passwordRef.current?.focus()}
            {...notFocusable}
          >
            <View style={styles.passwordRow}>
              <View style={styles.passwordCol}>
                <Text style={styles.fieldLabel}>New password</Text>
                <TextInput
                  ref={passwordRef}
                  style={styles.fieldInput}
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                  value={password}
                  onChangeText={setPassword}
                  onSubmitEditing={canSubmit ? onSubmit : undefined}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField((f) => (f === 'password' ? null : f))}
                />
              </View>
              <AnimatedPressable style={styles.toggleVisibility} onPress={() => setShowPassword((v) => !v)}>
                <Animated.View key={showPassword ? 'off' : 'on'} entering={ZoomIn.duration(180)}>
                  {showPassword ? (
                    <EyeOffIcon size={16} color={colors.textMuted} />
                  ) : (
                    <EyeIcon size={16} color={colors.textMuted} />
                  )}
                </Animated.View>
              </AnimatedPressable>
              <AnimatedPressable
                style={[styles.submitCircle, !canSubmit && styles.submitCircleDisabled]}
                onPress={onSubmit}
                disabled={!canSubmit}
              >
                <LinearGradient
                  colors={[colors.accent, colors.accentStrong]}
                  start={{ x: 0.15, y: 0 }}
                  end={{ x: 0.85, y: 1 }}
                  style={styles.submitCircleGradient}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color={colors.accentContrast} />
                  ) : (
                    <ArrowRightIcon size={16} color={colors.accentContrast} />
                  )}
                </LinearGradient>
              </AnimatedPressable>
            </View>
          </Pressable>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Didn&apos;t get a code? </Text>
            <TouchableOpacity onPress={onResend} disabled={resending}>
              <Text style={styles.footerLink}>{resending ? 'Sending…' : 'Resend'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.footerRow}>
            <TouchableOpacity onPress={() => { clearError(); navigation.navigate('Login'); }}>
              <Text style={styles.footerLink}>Back to sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {isDark ? (
        <ImageBackground
          source={require('../../assets/auth-background.jpg')}
          style={styles.flex}
          imageStyle={styles.backgroundImage}
          resizeMode="cover"
        >
          {content}
        </ImageBackground>
      ) : (
        <View style={[styles.flex, { backgroundColor: colors.bg }]}>{content}</View>
      )}
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  flex: { flex: 1 },
  backgroundImage: { width: '100%', height: '100%' },
  scroll: { flex: 1 },
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%', maxWidth: 380, backgroundColor: colors.bg,
    borderRadius: 28, borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 30, shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  glow: { position: 'absolute', top: -45, left: -45 },
  cardContent: { padding: 26 },
  header: { marginBottom: 20, gap: 6, alignItems: 'center' },
  logoIcon: {
    width: 42, height: 42, borderRadius: 13, backgroundColor: '#07090D',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  logoImage: { width: 26, height: 26 },
  title: {
    color: colors.text, fontFamily: webFontFamily, fontSize: 26, fontWeight: '800',
    letterSpacing: -0.4, textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted, fontFamily: webFontFamily, fontSize: 14, textAlign: 'center', paddingHorizontal: 6,
  },
  error: { color: colors.danger, fontFamily: webFontFamily, fontSize: 13, marginBottom: 10 },
  retryStatus: { color: colors.textMuted, fontFamily: webFontFamily, fontSize: 13, marginBottom: 10 },
  field: {
    backgroundColor: colors.fieldFill, borderWidth: 1, borderColor: colors.border,
    borderRadius: 20, paddingHorizontal: 18, paddingVertical: 12, marginBottom: 12,
  },
  fieldFocused: { borderColor: colors.accent, borderWidth: 1.5 },
  fieldLabel: {
    color: colors.textMuted, fontFamily: webFontFamily, fontSize: 11, fontWeight: '600',
    letterSpacing: 0.2, marginBottom: 2,
  },
  fieldInput: {
    color: colors.text, fontFamily: webFontFamily, fontSize: 15.5, padding: 0, backgroundColor: 'transparent',
    outlineWidth: 0, outlineColor: 'transparent', outlineStyle: 'solid',
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  passwordCol: { flex: 1 },
  toggleVisibility: { padding: 6, marginLeft: 2 },
  submitCircle: {
    width: 38, height: 38, borderRadius: 19, overflow: 'hidden', marginLeft: 6,
  },
  submitCircleGradient: {
    width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center',
  },
  submitCircleDisabled: { opacity: 0.5 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
  footerText: { color: colors.textMuted, fontFamily: webFontFamily, fontSize: 13 },
  footerLink: {
    color: colors.accent, fontFamily: webFontFamily, fontWeight: '700', fontSize: 13,
    textDecorationLine: 'underline',
  },
});
