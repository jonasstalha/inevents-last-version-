import { useAuth } from '@/src/context/AuthContext';
<<<<<<< HEAD
import { checkPhoneNumberExists, storePhoneVerification } from '@/src/firebase/firebaseAuth';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { getAuth } from 'firebase/auth';
=======
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
>>>>>>> 32ac7b3b02828e0bccb61f3208175ce5f3557bff
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
<<<<<<< HEAD
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
=======
  Image,
  Modal,
  ScrollView,
>>>>>>> 32ac7b3b02828e0bccb61f3208175ce5f3557bff
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
<<<<<<< HEAD
  TouchableWithoutFeedback,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

// Design System Tokens
const COLORS = {
  primary: '#667eea',
  primaryDark: '#5a6fd6',
  secondary: '#764ba2',
  accent: '#f093fb',
  success: '#2ed573',
  error: '#ff4757',
  warning: '#ffa502',
  info: '#1e90ff',
  
  // Neutral
  white: '#ffffff',
  gray50: '#fafafa',
  gray100: '#f5f5f5',
  gray200: '#eeeeee',
  gray300: '#e0e0e0',
  gray400: '#bdbdbd',
  gray500: '#9e9e9e',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',
  black: '#000000',
};

const TYPOGRAPHY = {
  h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '600' as const, lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  body1: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  body2: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const SHADOWS = {
  small: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999,
};

// Enhanced Input Component with Progressive Disclosure
const EnhancedInput = ({ 
=======
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Simple Input Component without animations
const SimpleInput = ({ 
>>>>>>> 32ac7b3b02828e0bccb61f3208175ce5f3557bff
  label, 
  value, 
  onChangeText, 
  secureTextEntry = false, 
  keyboardType = 'default',
  autoCapitalize = 'sentences',
<<<<<<< HEAD
  error = '',
  success = '',
  icon = '',
  placeholder = '',
  helperText = '',
  required = false,
  disabled = false,
  onFocus = () => {},
  onBlur = () => {},
=======
  error = ''
>>>>>>> 32ac7b3b02828e0bccb61f3208175ce5f3557bff
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  error?: string;
<<<<<<< HEAD
  success?: string;
  icon?: string;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    setTouched(true);
    onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur();
  };

  const getBorderColor = () => {
    if (error && touched) return COLORS.error;
    if (success && touched) return COLORS.success;
    if (isFocused) return COLORS.primary;
    if (disabled) return COLORS.gray300;
    return COLORS.gray300;
  };

  const getBackgroundColor = () => {
    if (disabled) return COLORS.gray100;
    return COLORS.white;
  };

  return (
    <View style={stylesEnhanced.inputContainer}>
      <View style={stylesEnhanced.labelContainer}>
        <Text style={[
          stylesEnhanced.inputLabel,
          disabled && stylesEnhanced.inputLabelDisabled
        ]}>
          {label}
          {required && <Text style={stylesEnhanced.required}> *</Text>}
        </Text>
        {touched && error ? (
          <Text style={stylesEnhanced.errorIndicator}>✗</Text>
        ) : touched && success ? (
          <Text style={stylesEnhanced.successIndicator}>✓</Text>
        ) : null}
      </View>
      
      <View style={[
        stylesEnhanced.inputWrapper,
        {
          borderColor: getBorderColor(),
          backgroundColor: getBackgroundColor(),
        },
        isFocused && stylesEnhanced.inputWrapperFocused,
        disabled && stylesEnhanced.inputWrapperDisabled,
      ]}>
        {icon && (
          <Icon 
            name={icon} 
            size={20} 
            color={isFocused ? COLORS.primary : COLORS.gray500} 
            style={stylesEnhanced.inputIcon}
          />
        )}
        <TextInput
          style={[
            stylesEnhanced.input,
            icon && stylesEnhanced.inputWithIcon,
            disabled && stylesEnhanced.inputDisabled,
          ]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray400}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor={COLORS.primary}
          editable={!disabled}
          accessible={true}
          accessibilityLabel={label}
          accessibilityHint={placeholder}
        />
        
        {secureTextEntry && value.length > 0 && (
          <TouchableOpacity 
            style={stylesEnhanced.passwordToggle}
            onPress={() => setShowPassword(!showPassword)}
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
          >
            <Icon 
              name={showPassword ? "eye-off" : "eye"} 
              size={18} 
              color={COLORS.gray500} 
            />
          </TouchableOpacity>
        )}
      </View>
      
      {(helperText || error || success) && (
        <Text style={[
          stylesEnhanced.helperText,
          error && stylesEnhanced.helperTextError,
          success && stylesEnhanced.helperTextSuccess,
        ]}>
          {error || success || helperText}
        </Text>
      )}
=======
}) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
>>>>>>> 32ac7b3b02828e0bccb61f3208175ce5f3557bff
    </View>
  );
};

<<<<<<< HEAD
// Enhanced Button with Loading and States
const EnhancedButton = ({ 
  title, 
  onPress, 
  loading = false,
  variant = 'primary',
  size = 'medium',
  icon = '',
  iconPosition = 'left',
  disabled = false,
  style = {},
  accessibilityLabel = '',
=======
// Simple Button Component
const SimpleButton = ({ 
  title, 
  onPress, 
  loading = false,
  style = {}
>>>>>>> 32ac7b3b02828e0bccb61f3208175ce5f3557bff
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
<<<<<<< HEAD
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'google';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  style?: any;
  accessibilityLabel?: string;
}) => {
  const getButtonStyle = () => {
    const baseStyle = stylesEnhanced.button;
    const sizeStyle = stylesEnhanced[`button${size.charAt(0).toUpperCase() + size.slice(1)}`];
    const variantStyle = stylesEnhanced[`button${variant.charAt(0).toUpperCase() + variant.slice(1)}`];
    const disabledStyle = disabled && stylesEnhanced.buttonDisabled;
    
    return [baseStyle, sizeStyle, variantStyle, disabledStyle, style];
  };

  const getTextStyle = () => {
    const variantStyle = stylesEnhanced[`buttonText${variant.charAt(0).toUpperCase() + variant.slice(1)}`];
    const disabledStyle = disabled && stylesEnhanced.buttonTextDisabled;
    return [stylesEnhanced.buttonText, variantStyle, disabledStyle];
  };

  return (
    <TouchableOpacity 
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessible={true}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? COLORS.white : COLORS.primary} 
          size="small" 
        />
      ) : (
        <View style={stylesEnhanced.buttonContent}>
          {icon && iconPosition === 'left' && (
            <Icon 
              name={icon} 
              size={18} 
              color={variant === 'primary' ? COLORS.white : COLORS.primary} 
              style={stylesEnhanced.buttonIcon}
            />
          )}
          <Text style={getTextStyle()}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Icon 
              name={icon} 
              size={18} 
              color={variant === 'primary' ? COLORS.white : COLORS.primary} 
              style={[stylesEnhanced.buttonIcon, stylesEnhanced.buttonIconRight]}
            />
          )}
        </View>
=======
  style?: any;
}) => {
  return (
    <TouchableOpacity 
      style={[styles.button, style]} 
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
>>>>>>> 32ac7b3b02828e0bccb61f3208175ce5f3557bff
      )}
    </TouchableOpacity>
  );
};

<<<<<<< HEAD
// Progress Indicator Component
const ProgressIndicator = ({ currentStep, totalSteps }: { currentStep: number, totalSteps: number }) => {
  return (
    <View style={stylesEnhanced.progressContainer}>
      <Text style={stylesEnhanced.progressText}>
        Step {currentStep} of {totalSteps}
      </Text>
      <View style={stylesEnhanced.progressBar}>
        <View 
          style={[
            stylesEnhanced.progressFill,
            { width: `${(currentStep / totalSteps) * 100}%` }
          ]} 
        />
      </View>
    </View>
  );
};

// Info Card Component for Progressive Disclosure
const InfoCard = ({ 
  title, 
  children, 
  icon = 'info',
  type = 'info'
}: {
  title: string;
  children: React.ReactNode;
  icon?: string;
  type?: 'info' | 'warning' | 'success' | 'error';
}) => {
  const getIconColor = () => {
    switch(type) {
      case 'warning': return COLORS.warning;
      case 'success': return COLORS.success;
      case 'error': return COLORS.error;
      default: return COLORS.primary;
    }
  };

  return (
    <View style={[
      stylesEnhanced.infoCard,
      stylesEnhanced[`infoCard${type.charAt(0).toUpperCase() + type.slice(1)}`]
    ]}>
      <View style={stylesEnhanced.infoCardHeader}>
        <Icon name={icon} size={20} color={getIconColor()} />
        <Text style={stylesEnhanced.infoCardTitle}>{title}</Text>
      </View>
      <Text style={stylesEnhanced.infoCardContent}>{children}</Text>
    </View>
=======
// Simple Role Button
const SimpleRoleButton = ({ 
  role, 
  label, 
  icon, 
  active, 
  onPress 
}: {
  role: string;
  label: string;
  icon: string;
  active: boolean;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity 
      style={[styles.roleButton, active && styles.activeRoleButton]} 
      onPress={onPress}
    >
      <Text style={styles.roleIcon}>{icon}</Text>
      <Text style={[styles.roleLabel, active && styles.activeRoleLabel]}>{label}</Text>
    </TouchableOpacity>
>>>>>>> 32ac7b3b02828e0bccb61f3208175ce5f3557bff
  );
};

export default function AuthScreen() {
  const { login, register } = useAuth();
  const router = useRouter();

<<<<<<< HEAD
  // Google Auth
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
    scopes: ['profile', 'email'],
  });

  // Animation states
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  // Form states with clear hierarchy
  const [currentStep, setCurrentStep] = useState(1);
  const [isLogin, setIsLogin] = useState(true);
  const [useGoogle, setUseGoogle] = useState(false);
  
  // User data (grouped for clarity)
  const [userData, setUserData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    storeName: '',
  });

  const [userRole, setUserRole] = useState<'client' | 'artist'>('client');
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formTouched, setFormTouched] = useState<Record<string, boolean>>({});

  // Phone verification
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [phoneVerifying, setPhoneVerifying] = useState(false);

  // Update user data
  const updateUserData = (field: string, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }));
    setFormTouched(prev => ({ ...prev, [field]: true }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validation functions
  const validateField = (field: string, value: string): string => {
    switch(field) {
      case 'email':
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== userData.password) return 'Passwords do not match';
        return '';
      case 'name':
        if (!value && !isLogin) return 'Full name is required';
        return '';
      case 'phone':
        if (!value && !isLogin) return 'Phone number is required';
        if (!/^[0-9+\-\s()]+$/.test(value) && !isLogin) return 'Please enter a valid phone number';
        return '';
      default:
        return '';
    }
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Common validation
    errors.email = validateField('email', userData.email);
    errors.password = validateField('password', userData.password);
    
    if (!isLogin) {
      errors.name = validateField('name', userData.name);
      errors.phone = validateField('phone', userData.phone);
      errors.confirmPassword = validateField('confirmPassword', userData.confirmPassword);
      
      if (userRole === 'artist') {
        if (!userData.storeName) {
          errors.storeName = 'Store name is required for artists';
        }
      }
    }
    
    setFormErrors(errors);
    return !Object.values(errors).some(error => error !== '');
  };

  // Animation on mount
  useEffect(() => {
    StatusBar.setBarStyle('dark-content', true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Handle Google response
  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleSignIn();
    }
  }, [response]);

  // Handle Google Sign-in
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      // For demo purposes - implement actual Google sign-in
      if (!isLogin) {
        setCurrentStep(2); // Move to phone verification step
      } else {
        router.replace('/(client)/');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  // Handle phone verification
  const handlePhoneSubmit = async (code: string) => {
    try {
      setPhoneVerifying(true);

      if (code.length !== 6) {
        Alert.alert('Error', 'Please enter a valid 6-digit code');
        return;
      }

      // TODO: Implement actual phone verification
      const auth = getAuth();
      if (auth.currentUser) {
        await storePhoneVerification(auth.currentUser.uid, userData.phone, true);
      }

      setShowPhoneVerification(false);
      Alert.alert('Success', 'Phone number verified successfully');

      // Navigate based on role
      const route = userRole === 'artist' ? '/(artist)/' : '/(client)/';
      router.replace(route);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setPhoneVerifying(false);
    }
  };

  // Main authentication handler
  const handleAuthSubmit = async () => {
    // Close keyboard
    Keyboard.dismiss();
    
    if (!validateForm()) {
      Alert.alert('Please fix errors', 'Some fields require your attention');
      return;
    }

    try {
      setLoading(true);

      if (isLogin) {
        await login(userData.email, userData.password);
        router.replace('/(client)/');
      } else {
        // Check if phone exists
        const phoneExists = await checkPhoneNumberExists(userData.phone);
        if (phoneExists) {
          Alert.alert('Phone Number Taken', 'This phone number is already registered');
          setLoading(false);
          return;
        }

        // Register user
        await register(
          userData.email, 
          userData.password, 
          userData.name, 
          userData.phone, 
          userRole
        );

        // Show phone verification
        setShowPhoneVerification(true);
      }
    } catch (error: any) {
      Alert.alert(
        'Authentication Error',
        error.message || 'Something went wrong. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Toggle auth mode
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setFormErrors({});
    setFormTouched({});
    setCurrentStep(1);
  };

  // Calculate total steps
  const totalSteps = isLogin ? 1 : (userRole === 'artist' ? 3 : 2);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={stylesEnhanced.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        
        <Animated.ScrollView 
          style={[stylesEnhanced.scrollView, { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={stylesEnhanced.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={stylesEnhanced.header}>
            <TouchableOpacity 
              style={stylesEnhanced.backButton}
              onPress={() => router.back()}
              accessibilityLabel="Go back"
              accessibilityRole="button"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="arrow-left" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            
            <View style={stylesEnhanced.brandContainer}>
              <Text style={stylesEnhanced.brandLogo}>🎭</Text>
              <Text style={stylesEnhanced.brandTitle}>EventFlow</Text>
              <Text style={stylesEnhanced.brandSubtitle}>Where Events Come Alive</Text>
            </View>
          </View>

          {/* Progress Indicator */}
          {!isLogin && (
            <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />
          )}

          {/* Welcome Section */}
          <View style={stylesEnhanced.heroSection}>
            <Text style={stylesEnhanced.heroTitle}>
              {isLogin ? 'Welcome Back!' : 'Join EventFlow'}
            </Text>
            <Text style={stylesEnhanced.heroSubtitle}>
              {isLogin 
                ? 'Sign in to continue your event journey' 
                : 'Create your account to discover amazing events'
              }
            </Text>
          </View>

          {/* Role Selection - Registration Only */}
          {!isLogin && currentStep === 1 && (
            <>
              <InfoCard 
                title="Choose Your Role" 
                type="info"
                icon="user"
              >
                Select how you want to use EventFlow
              </InfoCard>
              
              <View style={stylesEnhanced.roleGrid}>
                <TouchableOpacity 
                  style={[
                    stylesEnhanced.roleCard,
                    userRole === 'client' && stylesEnhanced.roleCardActive
                  ]}
                  onPress={() => setUserRole('client')}
                  accessibilityLabel="Client role: Discover and attend events"
                  accessibilityRole="button"
                  accessibilityState={{ selected: userRole === 'client' }}
                >
                  <Text style={stylesEnhanced.roleIcon}>👤</Text>
                  <Text style={stylesEnhanced.roleTitle}>Client</Text>
                  <Text style={stylesEnhanced.roleDescription}>
                    Discover and attend events
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    stylesEnhanced.roleCard,
                    userRole === 'artist' && stylesEnhanced.roleCardActive
                  ]}
                  onPress={() => setUserRole('artist')}
                  accessibilityLabel="Artist role: Create and host events"
                  accessibilityRole="button"
                  accessibilityState={{ selected: userRole === 'artist' }}
                >
                  <Text style={stylesEnhanced.roleIcon}>🎨</Text>
                  <Text style={stylesEnhanced.roleTitle}>Artist</Text>
                  <Text style={stylesEnhanced.roleDescription}>
                    Create and host events
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Auth Method - Registration Only */}
          {!isLogin && currentStep === 1 && (
            <>
              <InfoCard 
                title="Choose How to Sign Up" 
                type="info"
                icon="log-in"
              >
                You can use email or continue with Google
              </InfoCard>
              
              <View style={stylesEnhanced.authMethodGrid}>
                <TouchableOpacity
                  style={[
                    stylesEnhanced.authMethodCard,
                    !useGoogle && stylesEnhanced.authMethodCardActive
                  ]}
                  onPress={() => setUseGoogle(false)}
                  accessibilityLabel="Sign up with email"
                  accessibilityRole="button"
                  accessibilityState={{ selected: !useGoogle }}
                >
                  <Icon 
                    name="mail" 
                    size={24} 
                    color={useGoogle ? COLORS.gray500 : COLORS.primary} 
                  />
                  <Text style={[
                    stylesEnhanced.authMethodText,
                    !useGoogle && stylesEnhanced.authMethodTextActive
                  ]}>
                    Email
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    stylesEnhanced.authMethodCard,
                    useGoogle && stylesEnhanced.authMethodCardActive
                  ]}
                  onPress={() => setUseGoogle(true)}
                  accessibilityLabel="Sign up with Google"
                  accessibilityRole="button"
                  accessibilityState={{ selected: useGoogle }}
                >
                  <Icon 
                    name="chrome" 
                    size={24} 
                    color={useGoogle ? COLORS.primary : COLORS.gray500} 
                  />
                  <Text style={[
                    stylesEnhanced.authMethodText,
                    useGoogle && stylesEnhanced.authMethodTextActive
                  ]}>
                    Google
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Form Fields */}
          <View style={stylesEnhanced.formSection}>
            {!isLogin && currentStep >= 1 && !useGoogle && (
              <EnhancedInput
                label="Full Name"
                value={userData.name}
                onChangeText={(value) => updateUserData('name', value)}
                icon="user"
                placeholder="Enter your full name"
                error={formErrors.name}
                required={true}
                helperText="We'll use this name for your account"
                onBlur={() => {
                  const error = validateField('name', userData.name);
                  if (error && formTouched.name) {
                    setFormErrors(prev => ({ ...prev, name: error }));
                  }
                }}
              />
            )}

            {currentStep >= 1 && (
              <EnhancedInput
                label="Email Address"
                value={userData.email}
                onChangeText={(value) => updateUserData('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                icon="mail"
                placeholder="your@email.com"
                error={formErrors.email}
                required={true}
                helperText="We'll never share your email"
                onBlur={() => {
                  const error = validateField('email', userData.email);
                  if (error && formTouched.email) {
                    setFormErrors(prev => ({ ...prev, email: error }));
                  }
                }}
              />
            )}

            {(!useGoogle || isLogin) && currentStep >= 1 && (
              <EnhancedInput
                label="Password"
                value={userData.password}
                onChangeText={(value) => updateUserData('password', value)}
                secureTextEntry
                icon="lock"
                placeholder="Create a strong password"
                error={formErrors.password}
                required={true}
                helperText="At least 8 characters"
                onBlur={() => {
                  const error = validateField('password', userData.password);
                  if (error && formTouched.password) {
                    setFormErrors(prev => ({ ...prev, password: error }));
                  }
                }}
              />
            )}

            {!isLogin && !useGoogle && currentStep >= 1 && (
              <EnhancedInput
                label="Confirm Password"
                value={userData.confirmPassword}
                onChangeText={(value) => updateUserData('confirmPassword', value)}
                secureTextEntry
                icon="lock"
                placeholder="Confirm your password"
                error={formErrors.confirmPassword}
                required={true}
                onBlur={() => {
                  const error = validateField('confirmPassword', userData.confirmPassword);
                  if (error && formTouched.confirmPassword) {
                    setFormErrors(prev => ({ ...prev, confirmPassword: error }));
                  }
                }}
              />
            )}

            {!isLogin && currentStep >= 2 && (
              <EnhancedInput
                label="Phone Number"
                value={userData.phone}
                onChangeText={(value) => updateUserData('phone', value)}
                keyboardType="phone-pad"
                icon="phone"
                placeholder="+1 (555) 000-0000"
                error={formErrors.phone}
                required={true}
                helperText="We'll verify this number"
                onBlur={() => {
                  const error = validateField('phone', userData.phone);
                  if (error && formTouched.phone) {
                    setFormErrors(prev => ({ ...prev, phone: error }));
                  }
                }}
              />
            )}

            {!isLogin && userRole === 'artist' && currentStep >= 2 && !useGoogle && (
              <EnhancedInput
                label="Store/Business Name"
                value={userData.storeName}
                onChangeText={(value) => updateUserData('storeName', value)}
                icon="briefcase"
                placeholder="Your business or brand name"
                error={formErrors.storeName}
                required={true}
                helperText="This will be visible to clients"
              />
            )}
          </View>

          {/* Action Buttons */}
          <View style={stylesEnhanced.actionsSection}>
            {/* Primary Action */}
            {useGoogle && !isLogin ? (
              <EnhancedButton
                title="Continue with Google"
                onPress={() => promptAsync()}
                loading={loading}
                variant="google"
                size="large"
                icon="chrome"
                style={stylesEnhanced.primaryAction}
                accessibilityLabel="Sign up with Google account"
              />
            ) : (
              <EnhancedButton
                title={isLogin ? 'Sign In' : 'Continue'}
                onPress={handleAuthSubmit}
                loading={loading}
                variant="primary"
                size="large"
                icon={isLogin ? 'log-in' : 'arrow-right'}
                iconPosition="right"
                style={stylesEnhanced.primaryAction}
                accessibilityLabel={isLogin ? 'Sign in to account' : 'Continue to next step'}
              />
            )}

            {/* Divider */}
            {!isLogin && !useGoogle && (
              <View style={stylesEnhanced.dividerContainer}>
                <View style={stylesEnhanced.dividerLine} />
                <Text style={stylesEnhanced.dividerText}>or continue with</Text>
                <View style={stylesEnhanced.dividerLine} />
              </View>
            )}

            {/* Secondary Actions */}
            <View style={stylesEnhanced.secondaryActions}>
              {!isLogin && !useGoogle && (
                <EnhancedButton
                  title="Sign up with Google"
                  onPress={() => {
                    setUseGoogle(true);
                    promptAsync();
                  }}
                  variant="outline"
                  size="medium"
                  icon="chrome"
                  style={stylesEnhanced.secondaryButton}
                />
              )}
            </View>

            {/* Mode Toggle */}
            <TouchableOpacity 
              style={stylesEnhanced.modeToggle}
              onPress={toggleAuthMode}
              accessibilityLabel={isLogin ? 'Switch to sign up' : 'Switch to sign in'}
              accessibilityRole="button"
            >
              <Text style={stylesEnhanced.modeToggleText}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Text style={stylesEnhanced.modeToggleLink}>
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Terms and Security Info */}
          <View style={stylesEnhanced.footerSection}>
            <InfoCard 
              title="Security & Privacy" 
              type="info"
              icon="shield"
            >
              Your data is encrypted and secure. We never share your personal information.
            </InfoCard>
            
            <Text style={stylesEnhanced.termsText}>
              By continuing, you agree to our{' '}
              <Text style={stylesEnhanced.termsLink}>Terms of Service</Text>,{' '}
              <Text style={stylesEnhanced.termsLink}>Privacy Policy</Text>, and{' '}
              <Text style={stylesEnhanced.termsLink}>Cookie Policy</Text>.
            </Text>
          </View>
        </Animated.ScrollView>

        {/* Phone Verification Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showPhoneVerification}
          onRequestClose={() => setShowPhoneVerification(false)}
        >
          <View style={stylesEnhanced.modalOverlay}>
            <View style={stylesEnhanced.verificationModal}>
              <TouchableOpacity 
                style={stylesEnhanced.modalCloseButton}
                onPress={() => setShowPhoneVerification(false)}
                accessibilityLabel="Close verification modal"
                accessibilityRole="button"
              >
                <Icon name="x" size={24} color={COLORS.gray700} />
              </TouchableOpacity>

              <Text style={stylesEnhanced.modalTitle}>Verify Your Phone</Text>
              <Text style={stylesEnhanced.modalSubtitle}>
                We've sent a 6-digit code to {userData.phone}
              </Text>

              <View style={stylesEnhanced.codeInputContainer}>
                <TextInput
                  style={stylesEnhanced.codeInput}
                  placeholder="000000"
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus={true}
                  selectionColor={COLORS.primary}
                  accessibilityLabel="Enter verification code"
                />
              </View>

              <Text style={stylesEnhanced.codeHint}>
                Enter the 6-digit verification code
              </Text>

              <EnhancedButton
                title="Verify & Continue"
                onPress={() => handlePhoneSubmit('123456')} // Demo code
                loading={phoneVerifying}
                variant="primary"
                size="large"
                style={stylesEnhanced.verifyButton}
                accessibilityLabel="Verify phone number"
              />

              <TouchableOpacity style={stylesEnhanced.resendContainer}>
                <Text style={stylesEnhanced.resendText}>
                  Didn't receive the code?{' '}
                  <Text style={stylesEnhanced.resendLink}>Resend SMS</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const stylesEnhanced = StyleSheet.create({
  // Base Container
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },

  // Header
  header: {
    paddingTop: SPACING.xxl,
    marginBottom: SPACING.lg,
  },

  backButton: {
    position: 'absolute',
    left: 0,
    top: SPACING.xxl,
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  brandContainer: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },

  brandLogo: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },

  brandTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.gray900,
    textAlign: 'center',
  },

  brandSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray600,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },

  // Progress
  progressContainer: {
    marginBottom: SPACING.lg,
  },

  progressText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray600,
    marginBottom: SPACING.xs,
  },

  progressBar: {
    height: 4,
    backgroundColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.round,
  },

  // Hero Section
  heroSection: {
    marginBottom: SPACING.xl,
  },

  heroTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.gray900,
    marginBottom: SPACING.xs,
  },

  heroSubtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.gray600,
    lineHeight: 22,
  },

  // Info Card
  infoCard: {
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },

  infoCardWarning: {
    backgroundColor: '#fffaf0',
    borderLeftColor: COLORS.warning,
  },

  infoCardSuccess: {
    backgroundColor: '#f0fff4',
    borderLeftColor: COLORS.success,
  },

  infoCardError: {
    backgroundColor: '#fff5f5',
    borderLeftColor: COLORS.error,
  },

  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },

  infoCardTitle: {
    ...TYPOGRAPHY.body2,
    fontWeight: '600',
    color: COLORS.gray900,
    marginLeft: SPACING.sm,
  },

  infoCardContent: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray600,
    lineHeight: 18,
  },

  // Role Selection
  roleGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },

  roleCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.gray200,
    ...SHADOWS.small,
  },

  roleCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#f8faff',
  },

  roleIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },

  roleTitle: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.gray900,
    marginBottom: SPACING.xs,
  },

  roleDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray600,
    textAlign: 'center',
  },

  // Auth Method
  authMethodGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },

  authMethodCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.gray300,
    backgroundColor: COLORS.white,
  },

  authMethodCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#f8faff',
  },

  authMethodText: {
    ...TYPOGRAPHY.body2,
    fontWeight: '500',
    color: COLORS.gray600,
  },

  authMethodTextActive: {
    color: COLORS.primary,
  },

  // Form Section
  formSection: {
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },

  inputContainer: {
    gap: SPACING.xs,
  },

  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  inputLabel: {
    ...TYPOGRAPHY.body2,
    fontWeight: '600',
    color: COLORS.gray800,
  },

  inputLabelDisabled: {
    color: COLORS.gray400,
  },

  required: {
    color: COLORS.error,
  },

  errorIndicator: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: 'bold',
  },

  successIndicator: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: 'bold',
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.gray300,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    minHeight: 56,
  },

  inputWrapperFocused: {
    ...SHADOWS.small,
  },

  inputWrapperDisabled: {
    backgroundColor: COLORS.gray100,
  },

  inputIcon: {
    marginRight: SPACING.sm,
  },

  input: {
    flex: 1,
    ...TYPOGRAPHY.body1,
    color: COLORS.gray900,
    paddingVertical: SPACING.sm,
  },

  inputWithIcon: {
    marginLeft: 0,
  },

  inputDisabled: {
    color: COLORS.gray400,
  },

  passwordToggle: {
    padding: SPACING.xs,
  },

  helperText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray600,
    marginTop: 2,
  },

  helperTextError: {
    color: COLORS.error,
  },

  helperTextSuccess: {
    color: COLORS.success,
  },

  // Actions Section
  actionsSection: {
    marginBottom: SPACING.xl,
  },

  primaryAction: {
    marginBottom: SPACING.md,
  },

  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray200,
  },

  dividerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray500,
    marginHorizontal: SPACING.sm,
  },

  secondaryActions: {
    gap: SPACING.sm,
  },

  secondaryButton: {
    // Inherits from button styles
  },

  modeToggle: {
    alignItems: 'center',
    marginTop: SPACING.lg,
    padding: SPACING.sm,
  },

  modeToggleText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.gray600,
  },

  modeToggleLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Footer
  footerSection: {
    marginTop: SPACING.lg,
  },

  termsText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray500,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: SPACING.md,
  },

  termsLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Button System
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
=======
  // Animation state
  const [fadeAnim] = useState(new Animated.Value(0));

  // Form states
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [userRole, setUserRole] = useState<'client' | 'artist' | 'admin'>('client');
  const [loading, setLoading] = useState(false);

  // Error states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Artist-specific states
  const [storeName, setStoreName] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Available categories for artists
  const availableCategories = [
    { name: 'Music', icon: '🎵' },
    { name: 'Visual Arts', icon: '🎨' },
    { name: 'Performing Arts', icon: '🎭' },
    { name: 'Dance', icon: '💃' },
    { name: 'Photography', icon: '📸' },
    { name: 'Culinary Arts', icon: '👨‍🍳' },
    { name: 'Digital Art', icon: '💻' },
    { name: 'Fashion', icon: '👗' },
    { name: 'Crafts', icon: '🔨' },
    { name: 'Literature', icon: '📚' },
    { name: 'Film & Video', icon: '🎬' },
    { name: 'Other', icon: '✨' }
  ];

  // Function to add a category
  const addCategory = () => {
    if (selectedCategory && !categories.includes(selectedCategory)) {
      setCategories([...categories, selectedCategory]);
      setSelectedCategory('');
    }
  };
  
  // Function to remove a category
  const removeCategory = (category: string) => {
    setCategories(categories.filter(c => c !== category));
  };
  
  // Check if artist form is valid
  const isArtistFormValid = () => {
    if (userRole !== 'artist') return true;
    return storeName.trim() !== '' && 
           city.trim() !== '' && 
           categories.length > 0;
  };

  // Validation functions
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

  const validateConfirmPassword = (confirmPassword: string, password: string) => {
    if (!isLogin) {
      if (!confirmPassword) {
        setConfirmPasswordError('Please confirm your password');
        return false;
      }
      if (confirmPassword !== password) {
        setConfirmPasswordError('Passwords do not match');
        return false;
      }
    }
    setConfirmPasswordError('');
    return true;
  };

  useEffect(() => {
    StatusBar.setBarStyle('light-content', true);
    createHardcodedAdminAccount();

    // Trigger animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // Hardcoded Admin Account Creation
  const createHardcodedAdminAccount = async () => {
    try {
      const adminEmail = 'admin@inevents.com';
      const adminPassword = 'admin123456';
      const adminName = 'System Administrator';
      
      console.log('Checking admin account...');
      
      // First, try to login to see if the account exists
      try {
        const testCredential = await login(adminEmail, adminPassword);
        if (testCredential === 'admin') {
          console.log('✅ Admin account already exists with correct role');
          return;
        } else {
          console.log('⚠️ Admin account exists but role is wrong:', testCredential);
          // Account exists but role is wrong, let's fix it
          await fixAdminAccountRole();
          return;
        }
      } catch (loginError: any) {
        console.log('Admin account does not exist or has wrong credentials, creating new one...');
      }
      
      // If we get here, the account doesn't exist, so create it
      await register(adminEmail, adminPassword, adminName, '', false, 'admin');
      console.log('✅ Admin account created successfully');
      
    } catch (error: any) {
      if (error.message && error.message.includes('auth/email-already-in-use')) {
        console.log('✅ Admin account already exists, checking Firestore data...');
        await fixAdminAccountRole();
      } else {
        console.log('⚠️ Admin account setup issue:', error.message);
      }
    }
  };

  // Fix admin account role in Firestore
  const fixAdminAccountRole = async () => {
    try {
      console.log('🔧 Fixing admin account role in Firestore...');
      
      // Import Firestore functions
      const { getFirestore, doc, setDoc, getDoc, Timestamp } = await import('firebase/firestore');
      
      const db = getFirestore();
      
      // Try to get the admin user by email first
      // Since we know the admin email, we can try to find the user
      const adminEmail = 'admin@inevents.com';
      
      // First, let's login to get the user ID
      const { loginWithEmail } = await import('@/src/firebase/firebaseAuth');
      
      try {
        const userCredential = await loginWithEmail(adminEmail, 'admin123456');
        const adminUserId = userCredential.user.uid;
        
        console.log('Found admin user ID:', adminUserId);
        
        // Now update/create the Firestore document with admin role
        const userRef = doc(db, 'users', adminUserId);
        
        // Check if document exists
        const userDoc = await getDoc(userRef);
        
        const adminData = {
          email: adminEmail,
          name: 'System Administrator',
          phoneNumber: '',
          isPhoneVerified: false,
          role: 'admin',
          createdAt: userDoc.exists() ? userDoc.data()?.createdAt || Timestamp.now() : Timestamp.now(),
          signupDate: userDoc.exists() ? userDoc.data()?.signupDate || Timestamp.now() : Timestamp.now(),
        };
        
        await setDoc(userRef, adminData, { merge: true });
        
        console.log('✅ Admin account role fixed in Firestore');
        
      } catch (authError) {
        console.error('Failed to authenticate admin user for role fix:', authError);
      }
      
    } catch (error) {
      console.error('Failed to fix admin account role:', error);
    }
  };

  // Main Authentication Handler
  const handleAuthentication = async () => {
    try {
      // Validate form inputs
      const isEmailValid = validateEmail(email);
      const isPasswordValid = validatePassword(password);
      const isConfirmPasswordValid = validateConfirmPassword(confirmPassword, password);
      
      if (!isEmailValid || !isPasswordValid || (!isLogin && !isConfirmPasswordValid)) {
        return;
      }

      console.log(`Attempting to ${isLogin ? 'login' : 'register'} with email: ${email}`);
      
      if (isLogin) {
        // Perform login
        setLoading(true);
        const userRole = await login(email, password);
        setLoading(false);
        
        if (userRole) {
          console.log(`✅ Login successful! User role: ${userRole}`);
          
          // Navigate based on role
          if (userRole === 'admin') {
            console.log(`🚀 Navigating to admin panel...`);
            router.replace('/(admin)');
          } else if (userRole === 'artist') {
            console.log(`🚀 Navigating to artist panel...`);
            router.replace('/(artist)');
          } else {
            console.log(`🚀 Navigating to client panel...`);
            router.replace('/(client)');
          }
        }
      } else {
        // Perform registration
        if (!name.trim()) {
          Alert.alert('Validation Error', 'Please enter your full name');
          return;
        }

        if (userRole === 'artist' && !isArtistFormValid()) {
          Alert.alert('Validation Error', 'Please fill in all artist information including store name, city, and at least one category');
          return;
        }

        setLoading(true);
        await register(email, password, name, phone, false, userRole);
        setLoading(false);
        
        console.log(`✅ Registration successful! User role: ${userRole}`);
        
        // Navigate based on role
        if (userRole === 'admin') {
          router.replace('/(admin)');
        } else if (userRole === 'artist') {
          router.replace('/(artist)');
        } else {
          router.replace('/(client)');
        }
      }
    } catch (error: any) {
      setLoading(false);
      console.error('Authentication error:', error);
      const errorMessage = error.message || 'An unexpected error occurred. Please try again.';
      Alert.alert('Authentication Error', errorMessage);
    }
  };

  // Toggle Auth Mode
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    // Clear form errors when switching modes
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
  };

  return (
    <View style={styles.container}>
      {/* Static Background */}
      <View style={styles.backgroundContainer}>
        <Image 
          source={require('../assets/indexpage/mainpic.png')} 
          style={styles.heroImage} 
          resizeMode="cover" 
        />
        <LinearGradient
          colors={['rgba(102, 126, 234, 0.8)', 'rgba(118, 75, 162, 0.9)']}
          style={styles.gradientOverlay}
        />
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}> 
        {/* Form Container */}
        <View style={styles.formContainer}>
          <View style={styles.blurContainer}>
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>
                  {isLogin ? 'Welcome Back! 👋' : 'Join Our Community ✨'}
                </Text>
                <Text style={styles.formSubtitle}>
                  {isLogin 
                    ? 'Sign in to continue your journey' 
                    : 'Create your account to get started'
                  }
                </Text>
              </View>
              
              {!isLogin && (
                <SimpleInput
                  label="Full Name"
                  value={name}
                  onChangeText={setName}
                />
              )}
              
              <SimpleInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                error={emailError}
              />
              
              <SimpleInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                error={passwordError}
              />
              
              {!isLogin && (
                <SimpleInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={true}
                  error={confirmPasswordError}
                />
              )}
              
              {!isLogin && (
                <SimpleInput
                  label="Phone Number"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              )}
              
              {!isLogin && (
                <>
                  <View style={styles.roleSection}>
                    <Text style={styles.sectionTitle}>Choose Your Role</Text>
                    <View style={styles.roleContainer}>
                      <SimpleRoleButton
                        role="client"
                        label="Event Seeker"
                        icon="🎯"
                        active={userRole === 'client'}
                        onPress={() => setUserRole('client')}
                      />
                      <SimpleRoleButton
                        role="artist"
                        label="Event Creator"
                        icon="🎨"
                        active={userRole === 'artist'}
                        onPress={() => setUserRole('artist')}
                      />
                    </View>
                  </View>

                  {userRole === 'artist' && (
                    <View style={styles.artistSection}>
                      <Text style={styles.sectionTitle}>Artist Information</Text>
                      
                      <SimpleInput
                        label="Store/Business Name"
                        value={storeName}
                        onChangeText={setStoreName}
                      />
                      
                      <SimpleInput
                        label="City"
                        value={city}
                        onChangeText={setCity}
                      />

                      <View style={styles.categorySection}>
                        <Text style={styles.inputLabel}>Categories</Text>
                        <TouchableOpacity 
                          style={styles.categoryButton}
                          onPress={() => setShowCategoryModal(true)}
                        >
                          <Text style={styles.categoryButtonText}>Add Category +</Text>
                        </TouchableOpacity>
                        
                        {categories.length > 0 && (
                          <View style={styles.selectedCategories}>
                            {categories.map((category, index) => (
                              <View key={index} style={styles.categoryTag}>
                                <Text style={styles.categoryTagText}>{category}</Text>
                                <TouchableOpacity onPress={() => removeCategory(category)}>
                                  <Text style={styles.categoryRemove}>×</Text>
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </>
              )}
              
              <SimpleButton
                title={isLogin ? 'Sign In' : 'Create Account'}
                onPress={handleAuthentication}
                loading={loading}
                style={styles.primaryButton}
              />
              
              <TouchableOpacity onPress={toggleAuthMode} style={styles.switchButton}>
                <Text style={styles.switchText}>
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <Text style={styles.switchLink}>
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </Text>
                </Text>
              </TouchableOpacity>
              
            </ScrollView>
          </View>
        </View>
      </Animated.View>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <ScrollView style={styles.categoryList}>
              {availableCategories.map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.categoryOption}
                  onPress={() => {
                    setSelectedCategory(category.name);
                    addCategory();
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.categoryOptionIcon}>{category.icon}</Text>
                  <Text style={styles.categoryOptionText}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },

  heroImage: {
    width: '100%',
    height: '100%',
  },

  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  formContainer: {
    backgroundColor: 'rgba(82, 74, 74, 0.5)',
    borderRadius: 20,
    padding: 20,
    backdropFilter: 'blur(10px)',
  },

  blurContainer: {
    backgroundColor: 'transparent',
  },

  scrollContent: {
    paddingVertical: 10,
  },

  formHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },

  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },

  formSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },

  inputContainer: {
    marginBottom: 20,
  },

  inputLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    fontWeight: '500',
  },

  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  inputError: {
    borderColor: '#ff6b6b',
  },

  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginTop: 5,
  },

  button: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  primaryButton: {
    marginTop: 20,
    marginBottom: 20,
  },

  switchButton: {
    alignItems: 'center',
    padding: 10,
  },

  switchText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },

  switchLink: {
    color: '#667eea',
    fontWeight: 'bold',
  },

  roleSection: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 15,
  },

  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },

  roleButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
>>>>>>> 32ac7b3b02828e0bccb61f3208175ce5f3557bff
    borderWidth: 2,
    borderColor: 'transparent',
  },

<<<<<<< HEAD
  buttonSmall: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    minHeight: 40,
  },

  buttonMedium: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    minHeight: 48,
  },

  buttonLarge: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    minHeight: 56,
  },

  buttonPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  buttonSecondary: {
    backgroundColor: COLORS.gray100,
    borderColor: COLORS.gray100,
  },

  buttonOutline: {
    backgroundColor: 'transparent',
    borderColor: COLORS.gray300,
  },

  buttonGhost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },

  buttonGoogle: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.gray300,
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonIcon: {
    marginRight: SPACING.xs,
  },

  buttonIconRight: {
    marginRight: 0,
    marginLeft: SPACING.xs,
  },

  buttonText: {
    ...TYPOGRAPHY.button,
    textAlign: 'center',
  },

  buttonTextPrimary: {
    color: COLORS.white,
  },

  buttonTextSecondary: {
    color: COLORS.gray800,
  },

  buttonTextOutline: {
    color: COLORS.gray800,
  },

  buttonTextGhost: {
    color: COLORS.primary,
  },

  buttonTextGoogle: {
    color: COLORS.gray800,
  },

  buttonTextDisabled: {
    color: COLORS.gray400,
  },

  // Modal
=======
  activeRoleButton: {
    borderColor: '#667eea',
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
  },

  roleIcon: {
    fontSize: 24,
    marginBottom: 8,
  },

  roleLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },

  activeRoleLabel: {
    color: '#fff',
  },

  artistSection: {
    marginBottom: 20,
  },

  categorySection: {
    marginTop: 15,
  },

  categoryButton: {
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
  },

  categoryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },

  selectedCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  categoryTag: {
    backgroundColor: '#667eea',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  categoryTagText: {
    color: '#fff',
    fontSize: 14,
  },

  categoryRemove: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

>>>>>>> 32ac7b3b02828e0bccb61f3208175ce5f3557bff
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
<<<<<<< HEAD
    padding: SPACING.lg,
  },

  verificationModal: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    ...SHADOWS.large,
  },

  modalCloseButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.gray900,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },

  modalSubtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.gray600,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },

  codeInputContainer: {
    marginBottom: SPACING.sm,
  },

  codeInput: {
    ...TYPOGRAPHY.h2,
    color: COLORS.gray900,
    textAlign: 'center',
    letterSpacing: 8,
    borderWidth: 2,
    borderColor: COLORS.gray300,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },

  codeHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray500,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },

  verifyButton: {
    marginBottom: SPACING.md,
  },

  resendContainer: {
    alignItems: 'center',
  },

  resendText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.gray600,
  },

  resendLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
=======
  },

  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: width * 0.9,
    maxHeight: height * 0.7,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },

  categoryList: {
    maxHeight: 400,
  },

  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  categoryOptionIcon: {
    fontSize: 20,
    marginRight: 15,
  },

  categoryOptionText: {
    fontSize: 16,
    color: '#333',
  },

  modalCloseButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },

  modalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
>>>>>>> 32ac7b3b02828e0bccb61f3208175ce5f3557bff
