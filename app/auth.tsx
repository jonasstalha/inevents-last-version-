import { useAuth } from '@/src/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { checkPhoneNumberExists, storePhoneVerification } from '@/src/firebase/firebaseAuth';
import { getAuth } from 'firebase/auth';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

// Brand Colors
const BRAND_PRIMARY = '#667eea';
const BRAND_SECONDARY = '#764ba2';
const BRAND_ACCENT = '#f093fb';
const SUCCESS_COLOR = '#2ed573';
const ERROR_COLOR = '#ff4757';

// Enhanced Input Component with Floating Labels
const FloatingInput = ({ 
  label, 
  value, 
  onChangeText, 
  secureTextEntry = false, 
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error = '',
  icon = '',
  placeholder = ''
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  error?: string;
  icon?: string;
  placeholder?: string;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [labelAnim] = useState(new Animated.Value(value ? 1 : 0));

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const labelStyle = {
    top: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [18, -8],
    }),
    fontSize: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['#999', isFocused ? BRAND_PRIMARY : '#666'],
    }),
  };

  return (
    <View style={styles.inputContainer}>
      <View style={[
        styles.inputWrapper,
        isFocused && styles.inputWrapperFocused,
        error && styles.inputWrapperError
      ]}>
        {icon && (
          <Icon 
            name={icon} 
            size={20} 
            color={isFocused ? BRAND_PRIMARY : '#999'} 
            style={styles.inputIcon}
          />
        )}
        <Animated.Text style={[styles.floatingLabel, labelStyle]}>
          {label}
        </Animated.Text>
        <TextInput
          style={[styles.input, icon && styles.inputWithIcon]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          placeholder={isFocused ? placeholder : ''}
          placeholderTextColor="#bbb"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={BRAND_PRIMARY}
        />
      </View>
      {error ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={14} color={ERROR_COLOR} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

// Enhanced Button Component
const EnhancedButton = ({ 
  title, 
  onPress, 
  loading = false,
  variant = 'primary',
  icon = '',
  style = {}
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'google' | 'ghost';
  icon?: string;
  style?: any;
}) => {
  const getButtonStyle = () => {
    switch(variant) {
      case 'primary':
        return styles.primaryButton;
      case 'secondary':
        return styles.secondaryButton;
      case 'google':
        return styles.googleButton;
      case 'ghost':
        return styles.ghostButton;
      default:
        return styles.primaryButton;
    }
  };

  const getTextStyle = () => {
    switch(variant) {
      case 'primary':
        return styles.primaryButtonText;
      case 'secondary':
        return styles.secondaryButtonText;
      case 'google':
        return styles.googleButtonText;
      case 'ghost':
        return styles.ghostButtonText;
      default:
        return styles.primaryButtonText;
    }
  };

  return (
    <TouchableOpacity 
      style={[getButtonStyle(), style]} 
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : BRAND_PRIMARY} />
      ) : (
        <View style={styles.buttonContent}>
          {icon && (
            <Icon 
              name={icon} 
              size={18} 
              color={variant === 'primary' ? '#fff' : BRAND_PRIMARY} 
              style={styles.buttonIcon}
            />
          )}
          <Text style={[styles.buttonText, getTextStyle()]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Role Selection Card
const RoleCard = ({ 
  role, 
  title, 
  subtitle, 
  icon, 
  active, 
  onPress 
}: any) => {
  return (
    <TouchableOpacity 
      style={[styles.roleCard, active && styles.activeRoleCard]} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={active ? [BRAND_PRIMARY, BRAND_SECONDARY] : ['#fff', '#fff']}
        style={styles.roleCardGradient}
      >
        <Text style={styles.roleCardIcon}>{icon}</Text>
        <Text style={[styles.roleCardTitle, active && styles.activeRoleCardTitle]}>{title}</Text>
        <Text style={[styles.roleCardSubtitle, active && styles.activeRoleCardSubtitle]}>{subtitle}</Text>
        {active && (
          <View style={styles.roleCardBadge}>
            <Icon name="check" size={14} color="#fff" />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Phone Verification Modal
const PhoneVerificationModal = ({ 
  visible, 
  onClose, 
  onSubmit, 
  loading 
}: any) => {
  const [code, setCode] = useState('');

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={styles.verificationModal}>
          <TouchableOpacity 
            style={styles.modalClose} 
            onPress={onClose}
          >
            <Icon name="x" size={24} color="#333" />
          </TouchableOpacity>

          <Text style={styles.verificationTitle}>Verify Your Phone</Text>
          <Text style={styles.verificationSubtitle}>
            Enter the 6-digit code sent to your phone
          </Text>

          <TextInput
            style={styles.verificationCodeInput}
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
            selectionColor={BRAND_PRIMARY}
          />

          <EnhancedButton
            title="Verify Code"
            onPress={() => onSubmit(code)}
            loading={loading}
            style={styles.verificationButton}
          />

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.resendCode}>Didn't receive a code? Resend</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function AuthScreen() {
  const { login, register } = useAuth();
  const router = useRouter();

  // Google Auth
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
    scopes: ['profile', 'email'],
  });

  // Animation states
  const [fadeAnim] = useState(new Animated.Value(0));

  // Form states
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [userRole, setUserRole] = useState<'client' | 'artist'>('client');
  const [loading, setLoading] = useState(false);
  const [useGoogle, setUseGoogle] = useState(false);

  // Phone verification
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [phoneVerifying, setPhoneVerifying] = useState(false);

  // Error states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    StatusBar.setBarStyle('dark-content', true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // Handle Google Sign-in
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      console.log('Google Auth Success:', authentication?.accessToken);
      handleGoogleSignIn();
    }
  }, [response]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual Google sign-in with Firebase
      // For now, we'll navigate to the next step
      if (!isLogin && userRole === 'artist') {
        // Need to collect additional info for artist
        setShowPhoneVerification(true);
      } else if (!isLogin) {
        // Regular user
        setShowPhoneVerification(true);
      } else {
        // Login
        router.replace('/(client)/');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phone) {
      setPhoneError('Phone number is required');
      return false;
    }
    if (!phoneRegex.test(phone)) {
      setPhoneError('Please enter a valid phone number');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handlePhoneSubmit = async (code: string) => {
    try {
      setPhoneVerifying(true);

      // Check if phone already exists
      const phoneExists = await checkPhoneNumberExists(phone);
      if (phoneExists) {
        Alert.alert('Error', 'This phone number is already registered');
        setPhoneVerifying(false);
        return;
      }

      // TODO: Verify code with actual SMS provider
      if (code.length !== 6) {
        Alert.alert('Error', 'Please enter a valid 6-digit code');
        return;
      }

      const auth = getAuth();
      if (auth.currentUser) {
        await storePhoneVerification(auth.currentUser.uid, phone, true);
      }

      setShowPhoneVerification(false);

      // If artist, go to complete artist profile
      if (!isLogin && userRole === 'artist') {
        Alert.alert('Success', 'Please complete your artist profile');
        // Navigate to artist onboarding
        router.replace('/(artist)/');
      } else {
        Alert.alert('Success', 'Registration complete!');
        router.replace('/(client)/');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setPhoneVerifying(false);
    }
  };

  const handleAuthSubmit = async () => {
    try {
      setLoading(true);

      if (isLogin) {
        // Login flow
        if (!validateEmail(email) || !validatePassword(password)) {
          setLoading(false);
          return;
        }

        await login(email, password);
        router.replace('/(client)/');
      } else {
        // Registration flow
        if (!validateEmail(email) || !validatePassword(password)) {
          setLoading(false);
          return;
        }

        if (confirmPassword !== password) {
          setPasswordError('Passwords do not match');
          setLoading(false);
          return;
        }

        // Check phone
        if (!validatePhone(phone)) {
          setLoading(false);
          return;
        }

        const phoneExists = await checkPhoneNumberExists(phone);
        if (phoneExists) {
          Alert.alert('Error', 'This phone number is already registered');
          setLoading(false);
          return;
        }

        // Register user
        await register(email, password, name, phone, userRole);

        // Show phone verification
        setShowPhoneVerification(true);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Icon name="arrow-left" size={24} color={BRAND_PRIMARY} />
      </TouchableOpacity>

      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <Text style={styles.brandLogo}>✨</Text>
          <Text style={styles.brandTitle}>InEvents</Text>
          <Text style={styles.brandTagline}>Your Creative Marketplace</Text>
        </View>

        {/* Hero Text */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            {isLogin ? 'Welcome Back! 👋' : 'Join Our Community ✨'}
          </Text>
          <Text style={styles.heroSubtitle}>
            {isLogin 
              ? 'Sign in to continue your creative journey' 
              : 'Create your account to get started'
            }
          </Text>
        </View>

        {/* Role Selection (Registration only) */}
        {!isLogin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose Your Role</Text>
            <View style={styles.roleGrid}>
              <RoleCard
                role="client"
                title="Client"
                subtitle="Hire & Book"
                icon="👤"
                active={userRole === 'client'}
                onPress={() => setUserRole('client')}
              />
              <RoleCard
                role="artist"
                title="Artist"
                subtitle="Sell & Earn"
                icon="🎨"
                active={userRole === 'artist'}
                onPress={() => setUserRole('artist')}
              />
            </View>
          </View>
        )}

        {/* Auth Method Selection */}
        {!isLogin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose Auth Method</Text>
            <View style={styles.authMethodGrid}>
              <TouchableOpacity
                style={[styles.authMethodCard, !useGoogle && styles.activeAuthMethod]}
                onPress={() => setUseGoogle(false)}
              >
                <Icon name="mail" size={24} color={useGoogle ? '#999' : BRAND_PRIMARY} />
                <Text style={[styles.authMethodText, !useGoogle && styles.activeAuthMethodText]}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.authMethodCard, useGoogle && styles.activeAuthMethod]}
                onPress={() => setUseGoogle(true)}
              >
                <Text style={styles.googleIcon}>G</Text>
                <Text style={[styles.authMethodText, useGoogle && styles.activeAuthMethodText]}>Google</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Form Section */}
        <View style={styles.formSection}>
          {!isLogin && (
            <FloatingInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              icon="user"
              placeholder="John Doe"
            />
          )}

          <FloatingInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail"
            placeholder="your@email.com"
            error={emailError}
          />

          {!useGoogle && (
            <>
              <FloatingInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                icon="lock"
                placeholder="••••••••"
                error={passwordError}
              />

              {!isLogin && (
                <FloatingInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  icon="lock"
                  placeholder="••••••••"
                />
              )}
            </>
          )}

          {!isLogin && (
            <FloatingInput
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              icon="phone"
              placeholder="+1 (555) 000-0000"
              error={phoneError}
            />
          )}

          {!isLogin && userRole === 'artist' && !useGoogle && (
            <FloatingInput
              label="Store/Brand Name"
              value={storeName}
              onChangeText={setStoreName}
              icon="briefcase"
              placeholder="Your Business Name"
            />
          )}
        </View>

        {/* Primary Auth Button */}
        <EnhancedButton
          title={useGoogle ? 'Continue with Google' : (isLogin ? 'Sign In' : 'Create Account')}
          onPress={useGoogle ? () => promptAsync() : handleAuthSubmit}
          loading={loading}
          variant={useGoogle ? 'google' : 'primary'}
          icon={useGoogle ? 'arrow-right' : 'arrow-right'}
          style={styles.primaryAuthButton}
        />

        {/* Divider */}
        {!isLogin && !useGoogle && (
          <>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign-in Button */}
            <EnhancedButton
              title="Sign up with Google"
              onPress={() => {
                setUseGoogle(true);
                promptAsync();
              }}
              variant="google"
              icon="arrow-right"
            />
          </>
        )}

        {/* Toggle Auth Mode */}
        <View style={styles.toggleSection}>
          <Text style={styles.toggleText}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
          </Text>
          <TouchableOpacity onPress={() => {
            setIsLogin(!isLogin);
            setEmailError('');
            setPasswordError('');
          }}>
            <Text style={styles.toggleLink}>
              {isLogin ? 'Sign Up' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <Text style={styles.termsText}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </Animated.ScrollView>

      {/* Phone Verification Modal */}
      <PhoneVerificationModal
        visible={showPhoneVerification}
        onClose={() => setShowPhoneVerification(false)}
        onSubmit={handlePhoneSubmit}
        loading={phoneVerifying}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandHeader: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 24,
  },

  brandLogo: {
    fontSize: 48,
    marginBottom: 8,
  },

  brandTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
    letterSpacing: -0.5,
  },

  brandTagline: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },

  heroSection: {
    marginBottom: 32,
  },

  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    letterSpacing: -0.5,
  },

  heroSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    letterSpacing: -0.3,
  },

  roleGrid: {
    flexDirection: 'row',
    gap: 12,
  },

  roleCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#f0f0f0',
    backgroundColor: '#fff',
  },

  activeRoleCard: {
    borderColor: BRAND_PRIMARY,
  },

  roleCardGradient: {
    padding: 20,
    alignItems: 'center',
  },

  roleCardIcon: {
    fontSize: 32,
    marginBottom: 12,
  },

  roleCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },

  activeRoleCardTitle: {
    color: '#fff',
  },

  roleCardSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },

  activeRoleCardSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
  },

  roleCardBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  authMethodGrid: {
    flexDirection: 'row',
    gap: 12,
  },

  authMethodCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    backgroundColor: '#fff',
  },

  activeAuthMethod: {
    borderColor: BRAND_PRIMARY,
    backgroundColor: 'rgba(102, 126, 234, 0.05)',
  },

  authMethodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },

  activeAuthMethodText: {
    color: BRAND_PRIMARY,
  },

  googleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BRAND_PRIMARY,
  },

  formSection: {
    marginBottom: 24,
    gap: 0,
  },

  inputContainer: {
    marginBottom: 16,
  },

  inputWrapper: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
    position: 'relative',
    backgroundColor: '#fff',
  },

  inputWrapperFocused: {
    borderColor: BRAND_PRIMARY,
    shadowColor: BRAND_PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  inputWrapperError: {
    borderColor: ERROR_COLOR,
  },

  inputIcon: {
    marginRight: 12,
    marginBottom: 12,
  },

  floatingLabel: {
    position: 'absolute',
    left: 16,
    fontWeight: '500',
    zIndex: 1,
  },

  input: {
    color: '#333',
    fontSize: 16,
    paddingVertical: 8,
    paddingRight: 16,
    minHeight: 24,
  },

  inputWithIcon: {
    paddingLeft: 8,
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },

  errorText: {
    color: ERROR_COLOR,
    fontSize: 13,
    fontWeight: '500',
  },

  primaryAuthButton: {
    marginBottom: 16,
  },

  primaryButton: {
    backgroundColor: BRAND_PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },

  secondaryButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },

  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#f0f0f0',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },

  ghostButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: BRAND_PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },

  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonIcon: {
    marginRight: 8,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },

  primaryButtonText: {
    color: '#fff',
  },

  secondaryButtonText: {
    color: '#333',
  },

  googleButtonText: {
    color: '#333',
  },

  ghostButtonText: {
    color: BRAND_PRIMARY,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#f0f0f0',
  },

  dividerText: {
    marginHorizontal: 12,
    color: '#999',
    fontSize: 14,
  },

  toggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 24,
  },

  toggleText: {
    color: '#666',
    fontSize: 14,
  },

  toggleLink: {
    color: BRAND_PRIMARY,
    fontWeight: '600',
    fontSize: 14,
  },

  termsText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    lineHeight: 18,
  },

  termsLink: {
    color: BRAND_PRIMARY,
    fontWeight: '600',
  },

  // Phone Verification Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  verificationModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 40,
  },

  modalClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  verificationTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },

  verificationSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },

  verificationCodeInput: {
    borderWidth: 2,
    borderColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },

  verificationButton: {
    marginBottom: 16,
  },

  resendCode: {
    textAlign: 'center',
    color: BRAND_PRIMARY,
    fontSize: 14,
    fontWeight: '600',
  },
});
