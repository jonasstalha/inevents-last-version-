import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  getCurrentUserProfile,
  updateProfileWithImage,
  uploadProfileImage,
} from '../../../src/firebase/profileService';

/* ============================================================================
   DESIGN TOKENS — change one value, restyle the whole screen
   ========================================================================== */
const T = {
  // Brand
  primary: '#6a0dad',
  primaryLight: '#8b5cf6',
  primarySoft: '#f3e6ff',
  primaryBorder: '#e4c6ff',

  // Neutrals
  bg: '#f8fafc',
  surface: '#ffffff',
  border: '#e5e7eb',
  borderSoft: '#f1f5f9',

  // Text
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  placeholder: '#cbd5e1',

  // Status
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',

  // Radii
  rSm: 8,
  rMd: 12,
  rLg: 16,
  rXl: 20,
  rFull: 999,

  // Spacing
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 20,
  s6: 24,
  s8: 32,
} as const;

const SPECIALIZATION_OPTIONS = [
  'Corporate Events',
  'Wedding Planning',
  'Audio/Visual Services',
  'Catering',
  'Photography',
  'Music',
  'Entertainment',
  'Decoration',
  'Other',
] as const;

const CATEGORY_OPTIONS = [
  'Business', 'Corporate', 'Weddings', 'Planning', 'Technology', 'A/V',
  'Food', 'Catering', 'Photography', 'Visual Arts', 'Music', 'Entertainment',
  'Performance', 'Decoration', 'Design', 'General Services',
] as const;

type ProfileState = {
  name: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  profileImage: string;
  specialization: string;
  categories: string[];
};

const EMPTY_PROFILE: ProfileState = {
  name: '', email: '', phone: '', bio: '', location: '',
  profileImage: '', specialization: '', categories: [],
};

// Lightweight validators — kept pragmatic, not RFC-compliant
const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
const isValidPhone = (p: string) => /^[+\d][\d\s()-]{6,}$/.test(p.trim());

/* ============================================================================
   TOAST — non-blocking feedback (replaces Alert for success cases)
   ========================================================================== */
type ToastKind = 'success' | 'error' | 'info';
const useToast = () => {
  const [toast, setToast] = useState<{ msg: string; kind: ToastKind } | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(-20)).current;

  const show = useCallback((msg: string, kind: ToastKind = 'info') => {
    setToast({ msg, kind });
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translate, { toValue: 0, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translate, { toValue: -20, duration: 200, useNativeDriver: true }),
      ]).start(() => setToast(null));
    }, 2400);
  }, [opacity, translate]);

  const node = toast ? (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        toast.kind === 'success' && styles.toastSuccess,
        toast.kind === 'error' && styles.toastError,
        toast.kind === 'info' && styles.toastInfo,
        { opacity, transform: [{ translateY: translate }] },
      ]}
    >
      <Ionicons
        name={toast.kind === 'success' ? 'checkmark-circle' : toast.kind === 'error' ? 'alert-circle' : 'information-circle'}
        size={20}
        color="#fff"
      />
      <Text style={styles.toastText}>{toast.msg}</Text>
    </Animated.View>
  ) : null;

  return { show, node };
};

/* ============================================================================
   INITIALS AVATAR — offline-safe fallback (no third-party placeholder)
   ========================================================================== */
const InitialsAvatar = ({ name, size = 130 }: { name: string; size?: number }) => {
  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase();
  }, [name]);

  return (
    <LinearGradient
      colors={[T.primary, T.primaryLight]}
      style={{
        width: size, height: size, borderRadius: size / 2,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 4, borderColor: '#fff',
      }}
    >
      <Text style={{ color: '#fff', fontSize: size * 0.32, fontWeight: '700', letterSpacing: 1 }}>
        {initials}
      </Text>
    </LinearGradient>
  );
};

/* ============================================================================
   MAIN
   ========================================================================== */
const ProfileEditPage = () => {
  const router = useRouter();
  const toast = useToast();

  const [profile, setProfile] = useState<ProfileState>(EMPTY_PROFILE);
  const [original, setOriginal] = useState<ProfileState>(EMPTY_PROFILE);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileState, string>>>({});

  const cameraScale = useRef(new Animated.Value(1)).current;

  /* -------- Derived state -------- */
  const isDirty = useMemo(
    () => JSON.stringify(profile) !== JSON.stringify(original),
    [profile, original]
  );

  const completion = useMemo(() => {
    const fields: (keyof ProfileState)[] = ['name', 'email', 'phone', 'bio', 'location', 'profileImage', 'specialization'];
    const filled = fields.filter(f => {
      const v = profile[f];
      return typeof v === 'string' ? v.trim().length > 0 : false;
    }).length;
    const categoriesFilled = profile.categories.length > 0 ? 1 : 0;
    return Math.round(((filled + categoriesFilled) / (fields.length + 1)) * 100);
  }, [profile]);

  /* -------- Load -------- */
  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const userProfile = await getCurrentUserProfile();
      if (userProfile) {
        const next: ProfileState = {
          name: userProfile.name || '',
          email: userProfile.email || '',
          phone: userProfile.phone || '',
          bio: userProfile.bio || '',
          location: userProfile.location || '',
          profileImage: userProfile.profileImage || '',
          specialization: userProfile.specialization || '',
          categories: userProfile.categories || [],
        };
        setProfile(next);
        setOriginal(next);
      }
    } catch (e) {
      console.error('Error loading profile:', e);
      setLoadError('We couldn\u2019t load your profile. Pull down to retry.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadProfile();
  }, []);

  /* -------- Unsaved changes guard (Android back button) -------- */
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isDirty) { confirmDiscard(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [isDirty]);

  const confirmDiscard = () => {
    Alert.alert(
      'Discard changes?',
      'You have unsaved edits. Leave without saving?',
      [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ],
    );
  };

  const handleBack = () => {
    if (isDirty) confirmDiscard();
    else router.back();
  };

  /* -------- Image picking -------- */
  const animateCameraButton = () => {
    Animated.sequence([
      Animated.timing(cameraScale, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.spring(cameraScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  const launchPicker = async (source: 'camera' | 'library') => {
    try {
      const perm = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        toast.show('Permission denied', 'error');
        return;
      }

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });

      if (result.canceled || !result.assets?.length) return;

      setIsUploading(true);
      const auth = getAuth();
      const uid = auth.currentUser?.uid;
      if (!uid) {
        toast.show('Not signed in', 'error');
        return;
      }

      const url = await uploadProfileImage(uid, result.assets[0].uri);
      setProfile(p => ({ ...p, profileImage: url }));
      toast.show('Photo uploaded', 'success');
    } catch (e) {
      console.error(e);
      toast.show('Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const pickImage = () => {
    animateCameraButton();
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take Photo', 'Choose from Library'], cancelButtonIndex: 0 },
        (idx) => {
          if (idx === 1) launchPicker('camera');
          if (idx === 2) launchPicker('library');
        }
      );
    } else {
      Alert.alert('Update photo', undefined, [
        { text: 'Take Photo', onPress: () => launchPicker('camera') },
        { text: 'Choose from Library', onPress: () => launchPicker('library') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  /* -------- Field helpers -------- */
  const setField = <K extends keyof ProfileState>(key: K, value: ProfileState[K]) => {
    setProfile(p => ({ ...p, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
  };

  const toggleCategory = (c: string) => {
    setProfile(p => ({
      ...p,
      categories: p.categories.includes(c) ? p.categories.filter(x => x !== c) : [...p.categories, c],
    }));
  };

  /* -------- Validation -------- */
  const validate = (): boolean => {
    const e: Partial<Record<keyof ProfileState, string>> = {};
    if (!profile.name.trim()) e.name = 'Name is required';
    if (profile.email && !isValidEmail(profile.email)) e.email = 'Enter a valid email';
    if (profile.phone && !isValidPhone(profile.phone)) e.phone = 'Enter a valid phone';
    if (profile.bio.length > 500) e.bio = 'Bio is too long';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* -------- Save -------- */
  const handleSave = async () => {
    if (!validate()) {
      toast.show('Please fix the highlighted fields', 'error');
      return;
    }
    if (!isDirty) {
      toast.show('No changes to save', 'info');
      return;
    }

    try {
      setIsSaving(true);
      const updates: Partial<ProfileState> = {
        name: profile.name.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
        bio: profile.bio.trim(),
        location: profile.location.trim(),
        specialization: profile.specialization,
        categories: profile.categories,
        profileImage: profile.profileImage,
      };

      await updateProfileWithImage(updates);
      setOriginal(profile); // baseline now matches saved state
      toast.show('Profile saved', 'success');
      setTimeout(() => router.back(), 700);
    } catch (err: any) {
      console.error('Save error:', err);
      let msg = 'Failed to save. Try again.';
      if (err?.code === 'auth/requires-recent-login') msg = 'Please log out and back in to change sensitive info.';
      else if (err?.code === 'auth/email-already-in-use') msg = 'That email is already in use.';
      else if (err?.code === 'auth/invalid-email') msg = 'Invalid email address.';
      toast.show(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  /* -------- Loading state -------- */
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={T.primary} />
        <Text style={styles.loadingText}>Loading profile…</Text>
      </View>
    );
  }

  /* -------- Render -------- */
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={T.primary} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <LinearGradient colors={[T.primary, T.primaryLight]} style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.headerButton} hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Edit Profile</Text>
            <Text style={styles.subtitle}>{completion}% complete</Text>
          </View>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.headerButton, !isDirty && styles.headerButtonDisabled]}
            disabled={isSaving || !isDirty}
            hitSlop={10}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="checkmark" size={22} color="#fff" />
            )}
          </TouchableOpacity>
        </LinearGradient>

        {/* Completion bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: `${completion}%` }]} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={T.primary} />}
        >
          {loadError && (
            <View style={styles.errorBanner}>
              <Ionicons name="warning" size={18} color={T.danger} />
              <Text style={styles.errorBannerText}>{loadError}</Text>
            </View>
          )}

          {/* Avatar */}
          <View style={styles.profileSection}>
            <Animated.View style={{ transform: [{ scale: cameraScale }] }}>
              <View style={styles.imageWrapper}>
                {profile.profileImage ? (
                  <Image source={{ uri: profile.profileImage }} style={styles.profileImage} />
                ) : (
                  <InitialsAvatar name={profile.name || 'User'} />
                )}
                {isUploading && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator color="#fff" />
                    <Text style={styles.uploadingText}>Uploading…</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={pickImage}
                  disabled={isUploading}
                  hitSlop={10}
                >
                  <Ionicons name="camera" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </Animated.View>

            <TouchableOpacity
              style={[styles.changePhotoButton, isUploading && { opacity: 0.5 }]}
              onPress={pickImage}
              disabled={isUploading}
            >
              <Ionicons name="image-outline" size={16} color={T.primary} />
              <Text style={styles.changePhotoText}>{isUploading ? 'Uploading…' : 'Change Photo'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            {/* PERSONAL */}
            <Section title="Personal Information" icon="person-circle-outline">
              <Field
                label="Full Name"
                icon="person"
                value={profile.name}
                onChange={(v) => setField('name', v)}
                placeholder="Enter your full name"
                required
                error={errors.name}
                focused={focusedField === 'name'}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />
              <Field
                label="Bio"
                icon="create-outline"
                value={profile.bio}
                onChange={(v) => setField('bio', v)}
                placeholder="Tell us about yourself and what you do…"
                multiline
                maxLength={500}
                error={errors.bio}
                focused={focusedField === 'bio'}
                onFocus={() => setFocusedField('bio')}
                onBlur={() => setFocusedField(null)}
              />
              <Field
                label="Location"
                icon="location-outline"
                value={profile.location}
                onChange={(v) => setField('location', v)}
                placeholder="City, Region, Country"
                focused={focusedField === 'location'}
                onFocus={() => setFocusedField('location')}
                onBlur={() => setFocusedField(null)}
              />
            </Section>

            {/* CONTACT */}
            <Section title="Contact Information" icon="call-outline">
              <Field
                label="Email"
                icon="mail-outline"
                value={profile.email}
                onChange={(v) => setField('email', v)}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
                focused={focusedField === 'email'}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
              <Field
                label="Phone"
                icon="call-outline"
                value={profile.phone}
                onChange={(v) => setField('phone', v)}
                placeholder="+212 6 12 34 56 78"
                keyboardType="phone-pad"
                maxLength={20}
                error={errors.phone}
                focused={focusedField === 'phone'}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
              />
            </Section>

            {/* ARTIST */}
            <Section title="Artist Details" icon="sparkles-outline">
              <View style={styles.inputGroup}>
                <LabelRow icon="briefcase-outline" text="Specialization" />
                <View style={styles.optionsContainer}>
                  {SPECIALIZATION_OPTIONS.map((s) => (
                    <Chip
                      key={s}
                      label={s}
                      selected={profile.specialization === s}
                      onPress={() => setField('specialization', profile.specialization === s ? '' : s)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <LabelRow icon="pricetags-outline" text="Categories" />
                <Text style={styles.helperText}>
                  {profile.categories.length} selected · tap to toggle
                </Text>
                <View style={styles.optionsContainer}>
                  {CATEGORY_OPTIONS.map((c) => (
                    <Chip
                      key={c}
                      label={c}
                      selected={profile.categories.includes(c)}
                      onPress={() => toggleCategory(c)}
                    />
                  ))}
                </View>
              </View>
            </Section>
          </View>
        </ScrollView>

        {/* Sticky save bar */}
        <View style={styles.stickyBar} pointerEvents="box-none">
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleSave}
            disabled={isSaving || !isDirty}
            style={[styles.saveButton, (!isDirty || isSaving) && { opacity: 0.55 }]}
          >
            <LinearGradient colors={[T.primary, T.primaryLight]} style={styles.saveButtonGradient}>
              {isSaving
                ? <ActivityIndicator color="#fff" />
                : <Ionicons name={isDirty ? 'checkmark-circle' : 'checkmark-done'} size={22} color="#fff" />}
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving…' : isDirty ? 'Save Changes' : 'Up to Date'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {toast.node}
      </KeyboardAvoidingView>
    </>
  );
};

/* ============================================================================
   SUB-COMPONENTS
   ========================================================================== */
const Section = ({ title, icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
  <View style={styles.formSection}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={18} color={T.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const LabelRow = ({ icon, text, required }: { icon: any; text: string; required?: boolean }) => (
  <View style={styles.labelContainer}>
    <Ionicons name={icon} size={14} color={T.primary} style={{ marginRight: 6 }} />
    <Text style={styles.label}>{text}{required && <Text style={{ color: T.danger }}> *</Text>}</Text>
  </View>
);

type FieldProps = {
  label: string;
  icon: any;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  maxLength?: number;
  keyboardType?: any;
  autoCapitalize?: any;
  error?: string;
  focused?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
};

const Field = ({
  label, icon, value, onChange, placeholder, required,
  multiline, maxLength, keyboardType, autoCapitalize,
  error, focused, onFocus, onBlur,
}: FieldProps) => (
  <View style={styles.inputGroup}>
    <LabelRow icon={icon} text={label} required={required} />
    <View style={[
      styles.inputContainer,
      focused && styles.inputContainerFocused,
      !!error && styles.inputContainerError,
    ]}>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={T.placeholder}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        maxLength={maxLength}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </View>
    <View style={styles.metaRow}>
      {error
        ? <Text style={styles.errorText}>{error}</Text>
        : <View />}
      {maxLength && (
        <Text style={[styles.charCount, value.length > maxLength * 0.9 && { color: T.warning }]}>
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  </View>
);

const Chip = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.94, duration: 60, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onPress();
  };
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        style={[styles.optionChip, selected && styles.optionChipSelected]}
      >
        {selected && <Ionicons name="checkmark" size={13} color="#fff" style={{ marginRight: 4 }} />}
        <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
};

/* ============================================================================
   STYLES
   ========================================================================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg },
  loadingText: { marginTop: T.s4, fontSize: 15, color: T.textSecondary },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: T.s5,
    paddingVertical: T.s4,
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
  },
  headerCenter: { alignItems: 'center' },
  headerButton: {
    width: 40, height: 40, borderRadius: T.rFull,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerButtonDisabled: { opacity: 0.4 },
  title: { fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  subtitle: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2, fontWeight: '500' },

  // Progress
  progressTrack: { height: 3, backgroundColor: T.borderSoft },
  progressFill: { height: 3, backgroundColor: T.primary },

  // Scroll
  scrollView: { flex: 1 },

  // Error banner
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: T.s2,
    marginHorizontal: T.s5, marginTop: T.s4,
    padding: T.s3, backgroundColor: '#fef2f2',
    borderRadius: T.rMd, borderWidth: 1, borderColor: '#fecaca',
  },
  errorBannerText: { color: T.danger, fontSize: 13, flex: 1 },

  // Profile section
  profileSection: {
    backgroundColor: T.surface,
    alignItems: 'center',
    paddingVertical: T.s8,
    marginBottom: T.s4,
  },
  imageWrapper: { position: 'relative', marginBottom: T.s5 },
  profileImage: {
    width: 130, height: 130, borderRadius: 65,
    borderWidth: 4, borderColor: '#fff',
  },
  uploadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(106,13,173,0.7)',
    borderRadius: 65, justifyContent: 'center', alignItems: 'center',
  },
  uploadingText: { color: '#fff', fontSize: 11, marginTop: 6, fontWeight: '600' },
  cameraButton: {
    position: 'absolute', bottom: 4, right: 4,
    backgroundColor: T.primary,
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#fff',
  },
  changePhotoButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: T.s4, paddingVertical: T.s2,
    backgroundColor: T.primarySoft,
    borderRadius: T.rFull,
    borderWidth: 1, borderColor: T.primaryBorder,
  },
  changePhotoText: { color: T.primary, fontSize: 14, fontWeight: '600' },

  // Form
  formContainer: { paddingHorizontal: T.s5 },
  formSection: {
    backgroundColor: T.surface,
    borderRadius: T.rLg,
    padding: T.s5,
    marginBottom: T.s4,
    borderWidth: 1,
    borderColor: T.borderSoft,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: T.s2,
    marginBottom: T.s4, paddingBottom: T.s3,
    borderBottomWidth: 1, borderBottomColor: T.borderSoft,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: T.textPrimary },

  inputGroup: { marginBottom: T.s4 },
  labelContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: T.s2 },
  label: { fontSize: 13, fontWeight: '600', color: T.textSecondary },

  inputContainer: {
    borderRadius: T.rMd,
    borderWidth: 1.5,
    borderColor: T.border,
    backgroundColor: T.surface,
  },
  inputContainerFocused: {
    borderColor: T.primary,
    backgroundColor: '#fdfaff',
  },
  inputContainerError: { borderColor: T.danger, backgroundColor: '#fef2f2' },
  input: {
    fontSize: 15, color: T.textPrimary,
    paddingHorizontal: T.s4, paddingVertical: T.s3,
    minHeight: 48,
  },
  multilineInput: { height: 100, textAlignVertical: 'top', paddingTop: T.s3 },

  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 4, minHeight: 16,
  },
  errorText: { fontSize: 12, color: T.danger, fontWeight: '500' },
  charCount: { color: T.textMuted, fontSize: 11, fontWeight: '500' },
  helperText: { fontSize: 12, color: T.textMuted, marginBottom: T.s2 },

  // Chips
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: T.rFull,
    borderWidth: 1, borderColor: T.border,
    backgroundColor: T.surface,
  },
  optionChipSelected: {
    backgroundColor: T.primary,
    borderColor: T.primary,
  },
  optionText: { fontSize: 13, color: T.textSecondary, fontWeight: '500' },
  optionTextSelected: { color: '#fff', fontWeight: '600' },

  // Sticky save
  stickyBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: T.s5, paddingTop: T.s3,
    paddingBottom: Platform.OS === 'ios' ? 32 : T.s5,
    backgroundColor: 'rgba(248,250,252,0.96)',
    borderTopWidth: 1, borderTopColor: T.borderSoft,
  },
  saveButton: { borderRadius: T.rLg, overflow: 'hidden' },
  saveButtonGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: 10,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  // Toast
  toast: {
    position: 'absolute', top: Platform.OS === 'ios' ? 100 : 80,
    alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: T.s2,
    paddingHorizontal: T.s4, paddingVertical: T.s3,
    borderRadius: T.rFull,
    maxWidth: '90%',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  toastSuccess: { backgroundColor: T.success },
  toastError: { backgroundColor: T.danger },
  toastInfo: { backgroundColor: T.textPrimary },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});

export default ProfileEditPage;