// screens/ProfileScreen.js
// Unified profile screen — works for owner, renter, and admin roles.
// Redesigned with modern aesthetics matching BookingsScreen, FeedbackScreen, etc.

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Modern color palette matching other screens
const C = {
  primary: '#2D6A4F',
  primaryLight: '#40916C',
  primaryLighter: '#D8F3DC',
  primaryBg: '#F0F9F4',
  navy: '#1B2E35',
  danger: '#E63946',
  warning: '#F4A261',
  success: '#2A9D8F',
  info: '#4A9FF5',
  white: '#FFFFFF',
  black: '#0A0A0A',
  gray50: '#F8F9FA',
  gray100: '#F1F3F5',
  gray200: '#E9ECEF',
  gray300: '#DEE2E6',
  gray400: '#CED4DA',
  gray500: '#ADB5BD',
  gray600: '#6C757D',
  gray700: '#495057',
  gray800: '#343A40',
  gray900: '#212529',
};

const ROLE_META = {
  owner:  { label: 'Vehicle Owner',  color: C.warning, bg: '#FFF3E0', dot: C.warning },
  renter: { label: 'Renter',         color: C.info,    bg: '#E3F2FD', dot: C.info },
  admin:  { label: 'Administrator',  color: C.danger,  bg: '#FFEBEE', dot: C.danger },
};

// SVG Icons (simplified set matching other screens)
const Ic = {
  User: ({ size = 16, color = C.gray500 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><Circle cx="12" cy="7" r="4" />
    </Svg>
  ),
  Mail: ({ size = 16, color = C.gray500 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="2" y="4" width="20" height="16" rx="2" /><Path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </Svg>
  ),
  Phone: ({ size = 16, color = C.gray500 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.6a16 16 0 0 0 6 6l.94-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </Svg>
  ),
  Calendar: ({ size = 16, color = C.gray500 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="4" width="18" height="18" rx="2" /><Path d="M16 2v4M8 2v4M3 10h18" />
    </Svg>
  ),
  Car: ({ size = 16, color = C.primary }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <Circle cx="7" cy="17" r="2" /><Path d="M9 17h6" /><Circle cx="17" cy="17" r="2" />
    </Svg>
  ),
  Booking: ({ size = 16, color = C.gray500 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
    </Svg>
  ),
  Lock: ({ size = 16, color = C.gray500 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="11" width="18" height="11" rx="2" /><Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Svg>
  ),
  Logout: ({ size = 16, color = C.danger }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </Svg>
  ),
  Edit: ({ size = 14, color = C.white }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </Svg>
  ),
  Back: ({ size = 20, color = C.white }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 18l-6-6 6-6" />
    </Svg>
  ),
  Check: ({ size = 14, color = C.white }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 13l4 4L19 7" />
    </Svg>
  ),
  Close: ({ size = 14, color = C.gray500 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 6L6 18M6 6l12 12" />
    </Svg>
  ),
  Camera: ({ size = 14, color = C.white }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <Circle cx="12" cy="13" r="4" />
    </Svg>
  ),
  Trash: ({ size = 16, color = C.danger }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
    </Svg>
  ),
  Gallery: ({ size = 16, color = C.primary }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="3" width="18" height="18" rx="2" />
      <Circle cx="8.5" cy="8.5" r="1.5" />
      <Path d="M21 15l-5-5L5 21" />
    </Svg>
  ),
  Warning: ({ size = 28, color = C.danger }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <Path d="M12 9v4M12 17h.01" />
    </Svg>
  ),
  Go: ({ size = 16, color = C.gray400 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 5l7 7-7 7" />
    </Svg>
  ),
};

function AvatarCircle({ name = '', photoUri = null, size = 72, fontSize = 26, style }) {
  const initials = name.split(' ').slice(0, 2).map(w => (w[0] || '').toUpperCase()).join('');
  return (
    <View style={[{
      width: size, height: size, borderRadius: size / 2,
      overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.primary,
    }, style]}>
      {photoUri
        ? <Image source={{ uri: photoUri }} style={{ width: size, height: size }} resizeMode="cover" />
        : <Text style={{ fontSize, fontWeight: '800', color: C.white, letterSpacing: -0.5 }}>{initials || '?'}</Text>
      }
    </View>
  );
}

function FieldRow({ icon, label, value, placeholder = 'Not set' }) {
  return (
    <View style={styles.fieldRow}>
      <View style={styles.fieldIcon}>{icon}</View>
      <View style={styles.fieldBody}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={[styles.fieldValue, !value && styles.fieldEmpty]}>{value || placeholder}</Text>
      </View>
    </View>
  );
}

async function ensurePermission(type) {
  if (type === 'camera') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  }
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

const MEDIA_IMAGES = ImagePicker.MediaType?.Images || 'images';
const PICKER_OPTIONS = {
  mediaTypes: [MEDIA_IMAGES],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.85,
};

function PhotoModal({ visible, currentUri, onClose, onSave, onRemove }) {
  const [step, setStep] = useState('picker');
  const [pendingUri, setPending] = useState(null);

  const open = (s2 = 'picker') => { setStep(s2); setPending(null); };

  const handlePickLibrary = async () => {
    const ok = await ensurePermission('library');
    if (!ok) { Alert.alert('Permission required', 'Please allow photo library access in Settings.'); return; }
    const r = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (!r.canceled && r.assets?.[0]?.uri) { setPending(r.assets[0].uri); setStep('preview'); }
  };

  const handlePickCamera = async () => {
    const ok = await ensurePermission('camera');
    if (!ok) { Alert.alert('Permission required', 'Please allow camera access in Settings.'); return; }
    const r = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    if (!r.canceled && r.assets?.[0]?.uri) { setPending(r.assets[0].uri); setStep('preview'); }
  };

  const handleSave = () => { onSave(pendingUri); onClose(); };
  const handleDiscard = () => setStep('picker');
  const handleRemoveConfirm = () => { onRemove(); onClose(); };
  const handleClose = () => { setStep('picker'); setPending(null); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={modalStyles.backdrop} />
      </TouchableWithoutFeedback>
      <View style={modalStyles.sheet} pointerEvents="box-none">
        {step === 'picker' && (
          <View style={modalStyles.card}>
            <View style={modalStyles.header}>
              <View style={modalStyles.headerIcon}>
                <Ic.Camera size={18} color={C.primary} />
              </View>
              <Text style={modalStyles.title}>Profile Photo</Text>
              <TouchableOpacity style={modalStyles.closeBtn} onPress={handleClose}>
                <Ic.Close size={15} color={C.gray500} />
              </TouchableOpacity>
            </View>
            <View style={modalStyles.previewRow}>
              <AvatarCircle name="" photoUri={currentUri} size={64} fontSize={22} />
              <Text style={modalStyles.previewLabel}>
                {currentUri ? 'Current photo' : 'No photo set'}
              </Text>
            </View>
            <View style={modalStyles.separator} />
            <TouchableOpacity style={modalStyles.option} onPress={handlePickLibrary}>
              <View style={[modalStyles.optIcon, { backgroundColor: C.primaryLighter }]}>
                <Ic.Gallery size={17} color={C.primary} />
              </View>
              <View style={modalStyles.optBody}>
                <Text style={modalStyles.optLabel}>{currentUri ? 'Replace from Library' : 'Choose from Library'}</Text>
                <Text style={modalStyles.optSub}>Pick a photo from your device</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={modalStyles.option} onPress={handlePickCamera}>
              <View style={[modalStyles.optIcon, { backgroundColor: C.primaryLighter }]}>
                <Ic.Camera size={17} color={C.primary} />
              </View>
              <View style={modalStyles.optBody}>
                <Text style={modalStyles.optLabel}>Take a Photo</Text>
                <Text style={modalStyles.optSub}>Use your camera right now</Text>
              </View>
            </TouchableOpacity>
            {currentUri && (
              <TouchableOpacity style={modalStyles.option} onPress={() => setStep('removeConfirm')}>
                <View style={[modalStyles.optIcon, { backgroundColor: '#FFEBEE' }]}>
                  <Ic.Trash size={17} color={C.danger} />
                </View>
                <View style={modalStyles.optBody}>
                  <Text style={[modalStyles.optLabel, { color: C.danger }]}>Remove Photo</Text>
                  <Text style={modalStyles.optSub}>Revert to initials avatar</Text>
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={handleClose}>
              <Text style={modalStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
        {step === 'preview' && (
          <View style={modalStyles.card}>
            <View style={modalStyles.header}>
              <View style={modalStyles.headerIcon}>
                <Ic.Check size={16} color={C.primary} />
              </View>
              <Text style={modalStyles.title}>Confirm Photo</Text>
              <TouchableOpacity style={modalStyles.closeBtn} onPress={handleClose}>
                <Ic.Close size={15} color={C.gray500} />
              </TouchableOpacity>
            </View>
            <Text style={modalStyles.confirmSubtitle}>Does this look good?</Text>
            <View style={modalStyles.largePreviewWrap}>
              <AvatarCircle name="" photoUri={pendingUri} size={120} style={{ borderWidth: 3, borderColor: C.gray200 }} />
            </View>
            <View style={modalStyles.confirmActions}>
              <TouchableOpacity style={modalStyles.discardBtn} onPress={handleDiscard}>
                <Text style={modalStyles.discardText}>Change</Text>
              </TouchableOpacity>
              <TouchableOpacity style={modalStyles.saveBtn} onPress={handleSave}>
                <Ic.Check size={13} color={C.white} />
                <Text style={modalStyles.saveText}>Save Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {step === 'removeConfirm' && (
          <View style={modalStyles.card}>
            <View style={modalStyles.header}>
              <View style={[modalStyles.headerIcon, { backgroundColor: '#FFEBEE' }]}>
                <Ic.Warning size={18} color={C.danger} />
              </View>
              <Text style={[modalStyles.title, { color: C.danger }]}>Remove Photo?</Text>
              <TouchableOpacity style={modalStyles.closeBtn} onPress={handleClose}>
                <Ic.Close size={15} color={C.gray500} />
              </TouchableOpacity>
            </View>
            <Text style={modalStyles.removeBody}>
              Your profile picture will be removed and replaced with your initials avatar. This cannot be undone.
            </Text>
            <View style={[modalStyles.largePreviewWrap, { marginBottom: 8 }]}>
              <AvatarCircle name="" photoUri={currentUri} size={88} style={{ opacity: 0.5, borderWidth: 3, borderColor: C.danger + '55' }} />
              <View style={modalStyles.removeBadge}>
                <Ic.Close size={14} color={C.white} />
              </View>
            </View>
            <View style={modalStyles.confirmActions}>
              <TouchableOpacity style={modalStyles.discardBtn} onPress={() => setStep('picker')}>
                <Text style={modalStyles.discardText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[modalStyles.saveBtn, { backgroundColor: C.danger }]} onPress={handleRemoveConfirm}>
                <Ic.Trash size={13} color={C.white} />
                <Text style={modalStyles.saveText}>Yes, Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateUser, updatePhoto, logout } = useAuth();
  const u = user || {};

  React.useEffect(() => {
    if (!user) router.replace('/login');
  }, [router, user]);

  const roleMeta = ROLE_META[u.role] || ROLE_META.renter;
  const displayName = u.fullName || [u.firstName, u.middleName, u.lastName].filter(Boolean).join(' ') || 'User';

  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [focused, setFocused] = useState(null);
  const [editError, setEditError] = useState('');

  const [draft, setDraft] = useState({
    firstName: u.firstName || '',
    lastName: u.lastName || '',
    middleName: u.middleName || '',
    phone: u.phone || '',
    email: u.email || '',
  });

  React.useEffect(() => {
    setDraft({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      middleName: user?.middleName || '',
      phone: user?.phone || '',
      email: user?.email || '',
    });
  }, [user]);

  const setD = (k, v) => setDraft(d => ({ ...d, [k]: v }));

  const cancelEdit = () => {
    setDraft({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      middleName: user?.middleName || '',
      phone: user?.phone || '',
      email: user?.email || '',
    });
    setEditError('');
    setEditing(false);
  };

  const saveEdit = () => {
    if (!draft.firstName.trim() || !draft.lastName.trim() || !draft.email.trim()) {
      setEditError('First name, last name, and email are required.');
      return;
    }
    
    setSaving(true);
    setEditError('');
    
    // Only send fields that the backend accepts
    const updates = {
      first_name: draft.firstName.trim(),
      last_name: draft.lastName.trim(),
      middle_name: draft.middleName.trim(),
      email: draft.email.trim().toLowerCase(),
      username: draft.email.trim().toLowerCase(),
    };

    // Only include phone if it has a value
    if (draft.phone && draft.phone.trim()) {
      updates.phone = draft.phone.trim();
    }
    
    console.log('Saving profile with updates:', updates);
    
    updateUser(updates)
      .then(() => {
        setSaving(false);
        setEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      })
      .catch((error) => {
        setSaving(false);
        console.error('Save error:', error);
        
        let errorMessage = 'Failed to update profile. Please try again.';
        if (error && error.message) {
          errorMessage = error.message;
        }
        
        setEditError(errorMessage);
      });
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => { await logout(); } },
    ]);
  };

  const joinedLabel = u.joinedAt
    ? new Date(u.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';
  const dobLabel = u.dob
    ? new Date(u.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
  const sexLabel = u.sex === 'prefer_not' ? 'Prefer not to say' : (u.sex ? u.sex.charAt(0).toUpperCase() + u.sex.slice(1) : '');

  const inputStyle = (field) => [styles.input, focused === field && styles.inputFocused];

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      <PhotoModal
        visible={photoModalOpen}
        currentUri={u.photoUri}
        onClose={() => setPhotoModalOpen(false)}
        onSave={(uri) => updatePhoto(uri)}
        onRemove={() => updatePhoto(null)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ic.Back size={20} color={C.white} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>My Profile</Text>
            <Text style={styles.headerSubtitle}>Manage your account information</Text>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.avatarContainer}>
            <AvatarCircle name={displayName} photoUri={u.photoUri} size={100} fontSize={34} />
            <TouchableOpacity style={styles.cameraBadge} onPress={() => setPhotoModalOpen(true)}>
              <Ic.Camera size={12} color={C.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.heroName}>{displayName}</Text>
          <Text style={styles.heroEmail}>{u.email}</Text>
          <View style={[styles.rolePill, { backgroundColor: roleMeta.bg }]}>
            <View style={[styles.roleDot, { backgroundColor: roleMeta.dot }]} />
            <Text style={[styles.roleLabel, { color: roleMeta.color }]}>{roleMeta.label}</Text>
          </View>
          
          {/* Edit Button moved here - below the role badge */}
          <TouchableOpacity style={styles.editButtonHero} onPress={() => (editing ? cancelEdit() : setEditing(true))}>
            <Ic.Edit size={14} color={C.white} />
            <Text style={styles.editButtonHeroText}>{editing ? 'Cancel' : 'Edit Profile'}</Text>
          </TouchableOpacity>
        </View>

        {/* Success Toast */}
        {saved && (
          <View style={styles.toast}>
            <Ic.Check size={14} color={C.success} />
            <Text style={styles.toastText}>Profile updated successfully</Text>
          </View>
        )}

        {/* Personal Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{editing ? 'Edit Profile' : 'Personal Information'}</Text>
          </View>

          {editing ? (
            <View style={styles.form}>
              {!!editError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{editError}</Text>
                </View>
              )}

              <View style={styles.formRow}>
                <View style={styles.formHalf}>
                  <Text style={styles.formLabel}>First Name <Text style={styles.req}>*</Text></Text>
                  <TextInput
                    style={inputStyle('firstName')}
                    value={draft.firstName}
                    onChangeText={v => { setD('firstName', v); setEditError(''); }}
                    placeholder="First name"
                    placeholderTextColor={C.gray400}
                    autoCapitalize="words"
                    onFocus={() => setFocused('firstName')} onBlur={() => setFocused(null)}
                  />
                </View>
                <View style={styles.formHalf}>
                  <Text style={styles.formLabel}>Last Name <Text style={styles.req}>*</Text></Text>
                  <TextInput
                    style={inputStyle('lastName')}
                    value={draft.lastName}
                    onChangeText={v => { setD('lastName', v); setEditError(''); }}
                    placeholder="Last name"
                    placeholderTextColor={C.gray400}
                    autoCapitalize="words"
                    onFocus={() => setFocused('lastName')} onBlur={() => setFocused(null)}
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>Middle Name <Text style={styles.opt}>(optional)</Text></Text>
              <TextInput
                style={[inputStyle('middleName'), { marginBottom: 16 }]}
                value={draft.middleName} onChangeText={v => setD('middleName', v)}
                placeholder="Middle name" placeholderTextColor={C.gray400} autoCapitalize="words"
                onFocus={() => setFocused('middleName')} onBlur={() => setFocused(null)}
              />

              <Text style={styles.formLabel}>Email Address <Text style={styles.req}>*</Text></Text>
              <TextInput
                style={[inputStyle('email'), { marginBottom: 16 }]}
                value={draft.email}
                onChangeText={v => { setD('email', v); setEditError(''); }}
                placeholder="Email" placeholderTextColor={C.gray400}
                keyboardType="email-address" autoCapitalize="none"
                onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
              />

              <Text style={styles.formLabel}>Phone Number <Text style={styles.opt}>(optional)</Text></Text>
              <TextInput
                style={[inputStyle('phone'), { marginBottom: 16 }]}
                value={draft.phone} onChangeText={v => setD('phone', v)}
                placeholder="+63 9XX XXX XXXX" placeholderTextColor={C.gray400} keyboardType="phone-pad"
                onFocus={() => setFocused('phone')} onBlur={() => setFocused(null)}
              />

              <View style={styles.formActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={cancelEdit}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.75 }]} onPress={saveEdit} disabled={saving}>
                  {saving ? <ActivityIndicator color={C.white} size="small" /> : <><Ic.Check size={13} color={C.white} /><Text style={styles.saveBtnText}>Save Changes</Text></>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.viewFields}>
              <FieldRow icon={<Ic.User size={15} color={C.primary} />} label="Full Name" value={displayName} />
              <FieldRow icon={<Ic.Mail size={15} color={C.primary} />} label="Email Address" value={u.email} />
              <FieldRow icon={<Ic.Phone size={15} color={C.primary} />} label="Phone Number" value={u.phone} placeholder="Not set" />
              <FieldRow icon={<Ic.Calendar size={15} color={C.primary} />} label="Date of Birth" value={dobLabel} placeholder="Not set" />
              <FieldRow icon={<Ic.User size={15} color={C.primary} />} label="Sex" value={sexLabel} placeholder="Not set" />
              <FieldRow icon={<Ic.Car size={15} color={C.primary} />} label="Member Since" value={joinedLabel} />
            </View>
          )}
        </View>

        {/* Account Quick Links */}
        {!editing && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Account</Text>
            </View>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push(u.role === 'owner' ? '/dashboard' : u.role === 'admin' ? '/admin' : '/renter')}>
              <View style={styles.menuIcon}>
                <Ic.Car size={16} color={C.primary} />
              </View>
              <Text style={styles.menuLabel}>{u.role === 'owner' ? 'My Dashboard' : u.role === 'admin' ? 'Admin Dashboard' : 'Browse Vehicles'}</Text>
              <Ic.Go size={14} color={C.gray400} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/bookings')}>
              <View style={[styles.menuIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ic.Booking size={16} color={C.info} />
              </View>
              <Text style={styles.menuLabel}>{u.role === 'owner' ? 'Rental Requests' : u.role === 'admin' ? 'Booking Summary' : 'My Bookings'}</Text>
              <Ic.Go size={14} color={C.gray400} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/change-password')}>
              <View style={[styles.menuIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ic.Lock size={16} color={C.warning} />
              </View>
              <Text style={styles.menuLabel}>Change Password</Text>
              <Ic.Go size={14} color={C.gray400} />
            </TouchableOpacity>

            {u.role === 'admin' && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/email-log')}>
                  <View style={[styles.menuIcon, { backgroundColor: C.primaryLighter }]}>
                    <Ic.Mail size={15} color={C.primary} />
                  </View>
                  <Text style={styles.menuLabel}>Email Log</Text>
                  <Ic.Go size={14} color={C.gray400} />
                </TouchableOpacity>
              </>
            )}

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <View style={[styles.menuIcon, { backgroundColor: '#FFEBEE' }]}>
                <Ic.Logout size={16} color={C.danger} />
              </View>
              <Text style={[styles.menuLabel, { color: C.danger }]}>Log Out</Text>
              <Ic.Go size={14} color={C.danger} />
            </TouchableOpacity>
          </View>
        )}

        {/* Role Info Card */}
        {!editing && (
          <View style={styles.roleCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{u.role === 'owner' ? 'Owner Details' : u.role === 'admin' ? 'Admin Details' : 'Renter Details'}</Text>
            </View>
            <View style={styles.roleContent}>
              {u.role === 'owner' ? (
                <>
                  <Text style={styles.roleInfoText}>
                    As a <Text style={styles.roleInfoBold}>Vehicle Owner</Text>, you can list your cars
                    for rent and manage incoming booking requests from renters.
                  </Text>
                  <View style={[styles.roleInfoChip, { backgroundColor: C.primaryLighter, borderColor: C.primaryLight + '40' }]}>
                    <Ic.Car size={14} color={C.primary} />
                    <Text style={[styles.roleInfoChipText, { color: C.primary }]}>Active fleet management</Text>
                  </View>
                </>
              ) : u.role === 'admin' ? (
                <>
                  <Text style={styles.roleInfoText}>
                    As an <Text style={styles.roleInfoBold}>Administrator</Text>, you can monitor platform
                    analytics and oversee system-level activity for the mobile app.
                  </Text>
                  <View style={[styles.roleInfoChip, { backgroundColor: '#F3E5F5', borderColor: '#CE93D8' }]}>
                    <Ic.User size={14} color={C.danger} />
                    <Text style={[styles.roleInfoChipText, { color: C.danger }]}>Analytics and operations</Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.roleInfoText}>
                    As a <Text style={styles.roleInfoBold}>Renter</Text>, you can browse available vehicles
                    and submit booking requests to vehicle owners.
                  </Text>
                  <View style={[styles.roleInfoChip, { backgroundColor: '#E3F2FD', borderColor: '#90CAF9' }]}>
                    <Ic.Booking size={14} color={C.info} />
                    <Text style={[styles.roleInfoChipText, { color: C.info }]}>Instant booking requests</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.gray50,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.navy,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.primary,
    borderWidth: 2,
    borderColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: {
    fontSize: 24,
    fontWeight: '800',
    color: C.navy,
    marginBottom: 4,
  },
  heroEmail: {
    fontSize: 14,
    color: C.gray600,
    marginBottom: 10,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 30,
    marginBottom: 16,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  editButtonHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.primaryLight,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
  },
  editButtonHeroText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.white,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
  },
  toastText: {
    fontSize: 13,
    color: C.success,
    fontWeight: '600',
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.gray100,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
    backgroundColor: C.gray50,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.navy,
  },
  viewFields: {
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
  },
  fieldIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldBody: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '600',
    color: C.gray800,
  },
  fieldEmpty: {
    color: C.gray400,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  form: {
    padding: 18,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  formHalf: {
    flex: 1,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.gray700,
    marginBottom: 7,
    marginTop: 4,
  },
  req: {
    color: C.danger,
  },
  opt: {
    color: C.gray400,
    fontWeight: '400',
  },
  input: {
    borderWidth: 1.5,
    borderColor: C.gray200,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 14,
    color: C.gray800,
    fontWeight: '500',
    backgroundColor: C.gray50,
    marginBottom: 4,
  },
  inputFocused: {
    borderColor: C.primary,
    backgroundColor: C.primaryLighter,
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    color: C.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: C.gray300,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: C.white,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.gray600,
  },
  saveBtn: {
    flex: 2,
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.white,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: C.gray700,
  },
  divider: {
    height: 1,
    backgroundColor: C.gray100,
    marginLeft: 66,
  },
  roleCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.gray100,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  roleContent: {
    padding: 18,
  },
  roleInfoText: {
    fontSize: 13,
    color: C.gray600,
    lineHeight: 20,
    marginBottom: 14,
  },
  roleInfoBold: {
    fontWeight: '700',
    color: C.gray800,
  },
  roleInfoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  roleInfoChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: C.navy,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: C.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  previewLabel: {
    fontSize: 13,
    color: C.gray500,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: C.gray100,
    marginHorizontal: 18,
    marginBottom: 6,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  optIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optBody: {
    flex: 1,
  },
  optLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: C.gray800,
    marginBottom: 1,
  },
  optSub: {
    fontSize: 12,
    color: C.gray400,
  },
  cancelBtn: {
    marginHorizontal: 18,
    marginTop: 6,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.gray200,
    alignItems: 'center',
    backgroundColor: C.gray50,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.gray500,
  },
  confirmSubtitle: {
    fontSize: 13,
    color: C.gray400,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: -4,
  },
  largePreviewWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  discardBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.gray200,
    alignItems: 'center',
    backgroundColor: C.gray50,
  },
  discardText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.gray600,
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.white,
  },
  removeBody: {
    fontSize: 13,
    color: C.gray500,
    lineHeight: 20,
    paddingHorizontal: 18,
    paddingBottom: 16,
    textAlign: 'center',
  },
  removeBadge: {
    position: 'absolute',
    bottom: 0,
    right: '32%',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.danger,
    borderWidth: 2,
    borderColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});