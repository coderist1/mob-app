import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';

const C = {
  primary:   '#3F9B84',
  primaryDk: '#2d7a67',
  primaryLt: '#ecfdf5',
  navy:      '#1a2c5e',
  danger:    '#ef4444',
  warning:   '#f59e0b',
  success:   '#22c55e',
  g50:  '#f9fafb',
  g100: '#f3f4f6',
  g200: '#e5e7eb',
  g400: '#9ca3af',
  g500: '#6b7280',
  g700: '#374151',
  white: '#ffffff',
};

function getStrength(pw) {
  if (!pw) return { level: 0, text: '', color: C.g200 };
  let s = 0;
  if (pw.length >= 8)           s++;
  if (/[A-Z]/.test(pw))         s++;
  if (/[a-z]/.test(pw))         s++;
  if (/[0-9]/.test(pw))         s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors = [C.g200, C.danger, C.warning, C.warning, C.primary, C.success];
  return { level: s, text: labels[s], color: colors[s] };
}

export default function RegisterScreen() {
  const router = useRouter();
  const [role, setRole] = useState('owner');
  const [form, setForm] = useState({
    firstName: '', lastName: '', middleName: '',
    sex: '', email: '', password: '', confirmPassword: '',
  });
  const [showPw,  setShowPw]  = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); if (error) setError(''); };
  const strength = getStrength(form.password);

  const handleRegister = () => {
    setError('');
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError('Please fill in all required fields.'); return;
    }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace(role === 'owner' ? '/dashboard' : '/renter');
    }, 900);
  };

  const Field = ({ label, required, children }) => (
    <View style={s.fieldWrap}>
      <Text style={s.label}>
        {label}{required && <Text style={{ color: C.danger }}> *</Text>}
      </Text>
      {children}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View style={s.logoBox}><Text style={s.logoIcon}>🚗</Text></View>
          <Text style={s.appTitle}>Create Account</Text>
          <Text style={s.appSub}>Join CarRental today</Text>
        </View>

        {/* ── ROLE SELECTOR ── */}
        <View style={s.roleSection}>
          <Text style={s.roleSectionLabel}>I want to:</Text>
          <View style={s.roleRow}>
            {[
              { key: 'owner',  icon: '🚘', title: 'List My Car',  desc: 'Rent out your vehicle and earn' },
              { key: 'renter', icon: '👤', title: 'Rent a Car',   desc: 'Browse and rent available vehicles' },
            ].map(r => (
              <TouchableOpacity
                key={r.key}
                style={[s.roleCard, role === r.key && s.roleCardActive]}
                onPress={() => setRole(r.key)}
                activeOpacity={0.8}
              >
                <Text style={s.roleCardIcon}>{r.icon}</Text>
                <Text style={[s.roleCardTitle, role === r.key && s.roleCardTitleActive]}>{r.title}</Text>
                <Text style={s.roleCardDesc}>{r.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── FORM ── */}
        <View style={s.formPanel}>

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={s.sectionHead}>Personal Information</Text>

          <View style={s.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Field label="First Name" required>
                <TextInput style={s.input} placeholder="First Name" placeholderTextColor={C.g400}
                  value={form.firstName} onChangeText={v => set('firstName', v)} />
              </Field>
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Field label="Last Name" required>
                <TextInput style={s.input} placeholder="Last Name" placeholderTextColor={C.g400}
                  value={form.lastName} onChangeText={v => set('lastName', v)} />
              </Field>
            </View>
          </View>

          <Field label="Middle Name">
            <TextInput style={s.input} placeholder="Optional" placeholderTextColor={C.g400}
              value={form.middleName} onChangeText={v => set('middleName', v)} />
          </Field>

          {/* Sex picker */}
          <Field label="Sex" required>
            <View style={s.segRow}>
              {['Male', 'Female', 'Prefer not to say'].map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[s.segBtn, form.sex === opt.toLowerCase().replace(/ /g, '_') && s.segBtnActive]}
                  onPress={() => set('sex', opt.toLowerCase().replace(/ /g, '_'))}
                >
                  <Text style={[s.segBtnText, form.sex === opt.toLowerCase().replace(/ /g, '_') && s.segBtnTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <Text style={[s.sectionHead, { marginTop: 8 }]}>Account Information</Text>

          <Field label="Email" required>
            <TextInput style={s.input} placeholder="name@example.com" placeholderTextColor={C.g400}
              value={form.email} onChangeText={v => set('email', v)}
              keyboardType="email-address" autoCapitalize="none" />
          </Field>

          <Text style={s.pwHint}>
            Password must be at least 8 characters, including uppercase, lowercase, numbers, and symbols.
          </Text>

          {/* Password */}
          <Field label="Password" required>
            <View>
              <View style={s.pwWrap}>
                <TextInput
                  style={[s.input, { paddingRight: 48, marginBottom: 0 }]}
                  placeholder="Min. 8 characters" placeholderTextColor={C.g400}
                  value={form.password} onChangeText={v => set('password', v)}
                  secureTextEntry={!showPw}
                />
                <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPw(p => !p)}>
                  <Text style={s.eyeIcon}>{showPw ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              {form.password ? (
                <View style={s.strengthWrap}>
                  <View style={s.strengthTrack}>
                    <View style={[s.strengthBar, { width: `${strength.level * 20}%`, backgroundColor: strength.color }]} />
                  </View>
                  <Text style={[s.strengthLabel, { color: strength.color }]}>
                    Strength: {strength.text}
                  </Text>
                </View>
              ) : null}
            </View>
          </Field>

          {/* Confirm password */}
          <Field label="Confirm Password" required>
            <View style={s.pwWrap}>
              <TextInput
                style={[s.input, { paddingRight: 48 }]}
                placeholder="Repeat password" placeholderTextColor={C.g400}
                value={form.confirmPassword} onChangeText={v => set('confirmPassword', v)}
                secureTextEntry={!showCPw}
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowCPw(p => !p)}>
                <Text style={s.eyeIcon}>{showCPw ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </Field>

          {/* Submit */}
          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Create Account</Text>}
          </TouchableOpacity>

          <Text style={s.footer}>
            Already have an account?{' '}
            <Text style={s.footerLink} onPress={() => router.push('/login')}>Sign In</Text>
          </Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll:      { flexGrow: 1, backgroundColor: C.g50 },

  header: {
    backgroundColor: C.g100,
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: C.g200,
  },
  logoBox: {
    backgroundColor: C.primary,
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoIcon:  { fontSize: 26 },
  appTitle:  { fontSize: 24, fontWeight: '800', color: C.navy, marginBottom: 2 },
  appSub:    { fontSize: 14, color: C.g500 },

  roleSection:      { padding: 20 },
  roleSectionLabel: { fontSize: 13, fontWeight: '700', color: C.g700, marginBottom: 12 },
  roleRow:          { flexDirection: 'row', gap: 12 },
  roleCard: {
    flex: 1,
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.g200,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  roleCardActive: { borderColor: C.primary, backgroundColor: C.primaryLt },
  roleCardIcon:   { fontSize: 28, marginBottom: 8 },
  roleCardTitle:  { fontSize: 14, fontWeight: '700', color: C.g700, marginBottom: 4, textAlign: 'center' },
  roleCardTitleActive: { color: C.primary },
  roleCardDesc:   { fontSize: 11, color: C.g500, textAlign: 'center', lineHeight: 16 },

  formPanel: {
    backgroundColor: C.white,
    margin: 16,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: C.danger, fontSize: 13, fontWeight: '600' },

  sectionHead: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: C.g500,
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.g100,
  },

  row:       { flexDirection: 'row' },
  fieldWrap: { marginBottom: 16 },
  label:     { fontSize: 13, fontWeight: '600', color: C.g700, marginBottom: 6 },

  input: {
    backgroundColor: C.g50,
    borderWidth: 1.5,
    borderColor: C.g200,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: C.navy,
  },

  segRow:         { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  segBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: C.g200,
    borderRadius: 999,
    backgroundColor: C.white,
  },
  segBtnActive:     { borderColor: C.primary, backgroundColor: C.primaryLt },
  segBtnText:       { fontSize: 13, color: C.g500, fontWeight: '500' },
  segBtnTextActive: { color: C.primary, fontWeight: '700' },

  pwHint: { fontSize: 11, color: C.g500, marginBottom: 12, lineHeight: 16 },

  pwWrap:  { position: 'relative' },
  eyeBtn:  { position: 'absolute', right: 14, top: 12 },
  eyeIcon: { fontSize: 18 },

  strengthWrap: { marginTop: 8, marginBottom: 4 },
  strengthTrack: { height: 5, backgroundColor: C.g200, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  strengthBar:   { height: '100%', borderRadius: 3 },
  strengthLabel: { fontSize: 11 },

  btn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
    shadowColor: C.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: { opacity: 0.65 },
  btnText:     { color: C.white, fontSize: 16, fontWeight: '700' },

  footer:     { textAlign: 'center', fontSize: 13, color: C.g500 },
  footerLink: { color: C.primary, fontWeight: '700' },
});