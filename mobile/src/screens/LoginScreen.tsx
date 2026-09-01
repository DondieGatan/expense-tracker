import React, { useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet, Image, ImageBackground,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, ArrowRightIcon } from '../components/icons';
import GlowBlob from '../components/GlowBlob';
import AnimatedPressable from '../components/AnimatedPressable';
import { useWebAutofillFix } from '../hooks/useWebAutofillFix';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

// Pressable defaults to tabIndex=0 on web (react-native-web), making the
// whole field wrapper its own keyboard-focusable stop in ADDITION to the
// actual <input> inside it — Tab would land on this empty div first,
// showing the browser's default focus rectangle around the whole field
// (exactly the "rectangle" this was meant to remove), then need a second
// Tab/Enter to actually reach the input. tabIndex isn't in Pressable's own
// RN type (it's a web-only DOM concept the type doesn't know about, even
// though react-native-web reads it directly), hence the cast.
const notFocusable = { tabIndex: -1 } as any;

export default function LoginScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  useWebAutofillFix('transparent', colors.text);
  const { login, error, retryStatus, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

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

  const content = (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Animated.View entering={FadeInUp.duration(500).springify().damping(16)} style={styles.card}>
        <GlowBlob size={170} color={colors.accent} style={styles.glow} />

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

          <Pressable
            style={[styles.field, focusedField === 'email' && styles.fieldFocused]}
            onPress={() => emailRef.current?.focus()}
            {...notFocusable}
          >
            <Text style={styles.fieldLabel}>Email</Text>
            {/* autoComplete="off" asks the browser not to offer/fill saved
                values — this is a per-browser-profile thing, not something the
                page fully controls: it works reliably for ordinary fields, but
                Chrome specifically ignores "off" on password-shaped inputs and
                often on the email field right above one, by design, so a
                browser that already has a credential saved for this site may
                still offer it regardless of this attribute. */}
            <TextInput
              ref={emailRef}
              style={styles.fieldInput}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="off"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField((f) => (f === 'email' ? null : f))}
            />
          </Pressable>

          <Pressable
            style={[styles.field, focusedField === 'password' && styles.fieldFocused]}
            onPress={() => passwordRef.current?.focus()}
            {...notFocusable}
          >
            <View style={styles.passwordRow}>
              <View style={styles.passwordCol}>
                <Text style={styles.fieldLabel}>Password</Text>
                <TextInput
                  ref={passwordRef}
                  style={styles.fieldInput}
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoComplete="off"
                  value={password}
                  onChangeText={setPassword}
                  onSubmitEditing={canSubmit ? onSubmit : undefined}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField((f) => (f === 'password' ? null : f))}
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
                {/* The gradient has to be the element the icon sits INSIDE, not an
                    absolutely-positioned sibling behind it — position:absolute
                    elements paint above normal in-flow siblings regardless of
                    DOM order, which was hiding the arrow behind a solid fill. */}
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
            <Text style={styles.footerText}>Don&apos;t have an account yet? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Sign up</Text>
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
  // react-native-web renders a required local image at its own intrinsic
  // pixel size by default — resizeMode="cover" alone doesn't stretch it,
  // only object-fit does, and that needs an explicit 100%/100% box to
  // actually have something to fit into.
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
  title: { color: colors.text, fontSize: 25, fontWeight: '700', letterSpacing: -0.3, textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontSize: 13.5, textAlign: 'center' },
  error: { color: colors.danger, fontSize: 13, marginBottom: 10 },
  retryStatus: { color: colors.textMuted, fontSize: 13, marginBottom: 10 },
  field: {
    backgroundColor: colors.fieldFill, borderWidth: 1, borderColor: colors.border,
    borderRadius: 20, paddingHorizontal: 18, paddingVertical: 12, marginBottom: 12,
  },
  // Deliberate accent-colored ring while a field is focused, driven by JS
  // state rather than the browser's own :focus outline — the native ring
  // rendered as a plain white/black rectangle regardless of the
  // outlineWidth/outlineColor overrides below (Chromium's default
  // outline-style computes as "auto", which has its own native rendering
  // some engines don't fully suppress at width 0), so this replaces it
  // with something that's actually on-brand instead of fighting it further.
  fieldFocused: { borderColor: colors.accent, borderWidth: 1.5 },
  fieldLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 2 },
  fieldInput: {
    color: colors.text, fontSize: 15, padding: 0, backgroundColor: 'transparent',
    // Still suppressed here too, belt-and-suspenders alongside fieldFocused
    // above — outlineStyle: 'solid' (rather than leaving it at the default
    // "auto") avoids the native-rendering path that ignored width: 0.
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
  footerText: { color: colors.textMuted, fontSize: 13 },
  footerLink: { color: colors.accent, fontWeight: '700', fontSize: 13, textDecorationLine: 'underline' },
});
