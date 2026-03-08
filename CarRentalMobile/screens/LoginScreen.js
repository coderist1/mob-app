import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';

// ── colour tokens (mirrors web) ──────────────────────────────────────────────
const C = {
  primary:   '#3F9B84',
  primaryDk: '#2d7a67',
  navy:      '#1a2c5e',
  danger:    '#ef4444',
  g50:  '#f9fafb',
  g100: '#f3f4f6',
  g200: '#e5e7eb',
  g400: '#9ca3af',
  g500: '#6b7280',
  g700: '#374151',
  white: '#ffffff',
};

const DEMO = [
  { role: 'Owner',  cred: 'owner@test.com / password' },
  { role: 'Renter', cred: 'renter@test.com / password' },
  { role: 'Admin',  cred: 'admin@test.com / admin123'  },
];

export default function LoginScreen() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    // ── Simulate auth (replace with your real auth hook) ──
    setTimeout(() => {
      setLoading(false);
      const e = email.trim().toLowerCase();
      if (e === 'owner@test.com')  router.replace('/dashboard');
      else if (e === 'admin@test.com')  router.replace('/admin');
      else if (e === 'renter@test.com') router.replace('/renter');
      else setError('Invalid email or password.');
    }, 900);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* ── TOP PANEL (mirrors left panel) ── */}
        <View style={s.topPanel}>
          {/* Car logo */}
          <View style={s.logoBox}>
            <Text style={s.logoIcon}>🚗</Text>
          </View>
          <Text style={s.appTitle}>Welcome Back</Text>
          <Text style={s.appSub}>Sign in to continue to CarRental</Text>

          {/* Demo accounts */}
          <View style={s.demoBox}>
            <Text style={s.demoTitle}>Quick Demo Access:</Text>
            {DEMO.map(d => (
              <Text key={d.role} style={s.demoLine}>
                <Text style={s.demoRole}>{d.role}: </Text>{d.cred}
              </Text>
            ))}
          </View>
        </View>

        {/* ── FORM PANEL ── */}
        <View style={s.formPanel}>
          <Text style={s.formTitle}>Sign In</Text>
          <Text style={s.formSub}>Enter your account details below</Text>

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Email */}
          <Text style={s.label}>Email Address</Text>
          <TextInput
            style={s.input}
            placeholder="name@example.com"
            placeholderTextColor={C.g400}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Password */}
          <View style={s.pwRow}>
            <Text style={s.label}>Password</Text>
            <TouchableOpacity onPress={() => {}}>
              <Text style={s.forgotLink}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
          <View style={s.pwWrap}>
            <TextInput
              style={[s.input, { paddingRight: 48 }]}
              placeholder="••••••••"
              placeholderTextColor={C.g400}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPw(v => !v)}>
              <Text style={s.eyeIcon}>{showPw ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Sign In</Text>}
          </TouchableOpacity>

          {/* Footer */}
          <Text style={s.footer}>
            Don't have an account?{' '}
            <Text style={s.footerLink} onPress={() => router.push('/register')}>
              Create Account
            </Text>
          </Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: C.g50,
  },

  /* top panel */
  topPanel: {
    backgroundColor: C.primary,
    paddingTop: 60,
    paddingBottom: 36,
    paddingHorizontal: 28,
  },
  logoBox: {
    backgroundColor: C.white,
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  logoIcon:  { fontSize: 28 },
  appTitle:  { fontSize: 26, fontWeight: '800', color: C.white, marginBottom: 4 },
  appSub:    { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 20 },

  demoBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    padding: 14,
  },
  demoTitle: { color: C.white, fontWeight: '700', fontSize: 13, marginBottom: 6 },
  demoLine:  { color: 'rgba(255,255,255,0.85)', fontSize: 12, lineHeight: 20 },
  demoRole:  { fontWeight: '700' },

  /* form panel */
  formPanel: {
    backgroundColor: C.white,
    margin: 16,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  formTitle: { fontSize: 22, fontWeight: '800', color: C.navy, marginBottom: 4 },
  formSub:   { fontSize: 13, color: C.g500, marginBottom: 24 },

  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: C.danger, fontSize: 13, fontWeight: '600' },

  label: { fontSize: 13, fontWeight: '600', color: C.g700, marginBottom: 6 },

  input: {
    backgroundColor: C.g50,
    borderWidth: 1.5,
    borderColor: C.g200,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: C.navy,
    marginBottom: 16,
  },

  pwRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forgotLink: { fontSize: 12, color: C.primary, fontWeight: '600', marginBottom: 6 },

  pwWrap:  { position: 'relative' },
  eyeBtn:  { position: 'absolute', right: 14, top: 13 },
  eyeIcon: { fontSize: 18 },

  btn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
    shadowColor: C.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: { opacity: 0.65 },
  btnText: { color: C.white, fontSize: 16, fontWeight: '700' },

  footer:     { textAlign: 'center', fontSize: 13, color: C.g500 },
  footerLink: { color: C.primary, fontWeight: '700' },
});