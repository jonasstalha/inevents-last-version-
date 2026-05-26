import { useAuth } from '@/src/context/AuthContext';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth, db } from '@/src/firebase/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import PhoneVerificationModal from '../src/components/auth/PhoneVerificationModal';

const { width, height } = Dimensions.get('window');

// Modern Input Component
const ModernInput = ({ 
  label, 
  value, 
  onChangeText, 
  secureTextEntry = false, 
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error = '',
  placeholder = ''
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  error?: string;
  placeholder?: string;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={[
          styles.input, 
          isFocused && styles.inputFocused,
          error ? styles.inputError : null
        ]}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholder={placeholder || label}
        placeholderTextColor="#B0B8C1"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

// Modern Button Component
const ModernButton = ({ 
  title, 
  onPress, 
  loading = false,
  variant = 'primary',
  style = {}
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: any;
}) => {
  const buttonStyles = [
    styles.button,
    variant === 'primary' && styles.buttonPrimary,
    variant === 'secondary' && styles.buttonSecondary,
    variant === 'outline' && styles.buttonOutline,
    style
  ];
  
  const textStyles = [
    styles.buttonText,
    variant === 'outline' && styles.buttonTextOutline
  ];
  
  return (
    <TouchableOpacity 
      style={buttonStyles} 
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#6366F1' : '#fff'} />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

// Role Selection Card
const RoleCard = ({ 
  role, 
  title, 
  description,
  icon, 
  active, 
  onPress 
}: {
  role: string;
  title: string;
  description: string;
  icon: string;
  active: boolean;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity 
      style={[styles.roleCard, active && styles.roleCardActive]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.roleIconContainer}>
        <FontAwesome5 name={icon} size={26} color={active ? '#6366F1' : '#6B7280'} />
      </View>
      <View style={styles.roleContent}>
        <Text style={[styles.roleTitle, active && styles.roleTitleActive]}>{title}</Text>
        <Text style={styles.roleDescription}>{description}</Text>
      </View>
      {active && (
        <View style={styles.roleCheckmark}>
          <FontAwesome5 name="check" size={14} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
};

// Category Tag Component (deprecated - now using inline chips)

export default function AuthScreen() {
  const { login, register } = useAuth();
  const router = useRouter();

  // Verify redirect URI for Google Sign-In
  console.log('REDIRECT URI:', AuthSession.makeRedirectUri());

  // Form states
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('+212');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [city, setCity] = useState('');
  const [userRole, setUserRole] = useState<'client' | 'artist'>('client');
  const [loading, setLoading] = useState(false);
  
  // Google Sign-In states
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [googleUserData, setGoogleUserData] = useState<any>(null);
  const [showGoogleArtistForm, setShowGoogleArtistForm] = useState(false);
  
  // Phone verification states
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [pendingRegistrationData, setPendingRegistrationData] = useState<any>(null);
  
  // Google Sign-In hook - CORRECTED for Native Android
  // NOTE: androidClientId MUST match the OAuth 2.0 credential registered in Firebase Console
  // for package: com.jonass7896.InEvent with SHA-1: 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
  const [request, response, promptAsync] = Google.useAuthRequest({
    // After regenerating google-services.json, androidClientId will be auto-populated
    // from your Firebase Android OAuth client. For now, use the Web Client ID as fallback.
    androidClientId: 'WILL_BE_REPLACED_AFTER_STEP_1_BELOW',
    iosClientId: '780609459655-33kqf1801palf7v922atpse13ictumgr.apps.googleusercontent.com',
    webClientId: '780609459655-33kqf1801palf7v922atpse13ictumgr.apps.googleusercontent.com',
    scopes: ['profile', 'email', 'openid'],
    redirectUrl: AuthSession.makeRedirectUri({
      useProxy: true,
      scheme: 'com.jonass7896.InEvent',
    }),
  });

  // Error states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Artist-specific states
  const [storeName, setStoreName] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // City selection states
  const [showCityModal, setShowCityModal] = useState(false);

  // Available categories for artists - matching search page filters
  const availableCategories = [
    { id: 'mariage', name: 'Mariage', icon: 'heart' as const },
    { id: 'anniversaire', name: 'Anniversaire', icon: 'gift' as const },
    { id: 'traiteur', name: 'Traiteur', icon: 'coffee' as const },
    { id: 'musique', name: 'Musique', icon: 'music' as const },
    { id: 'neggafa', name: 'Neggafa', icon: 'user' as const },
    { id: 'conference', name: 'Conference', icon: 'briefcase' as const },
    { id: 'evenement', name: "Evenement d'entreprise", icon: 'users' as const },
    { id: 'kermesse', name: 'Kermesse', icon: 'smile' as const },
    { id: 'henna', name: 'Henna', icon: 'award' as const },
    { id: 'photographie', name: 'Photographie', icon: 'camera' as const },
    { id: 'animation', name: 'Animation', icon: 'film' as const },
    { id: 'decoration', name: 'Decoration', icon: 'award' as const },
    { id: 'buffet', name: 'Buffet', icon: 'coffee' as const },
  ];

  const countryOptions = [
    { name: 'Morocco', code: '+212', flag: '🇲🇦' }
  ];

  const moroccanCities = [
    'Casablanca',
    'Rabat',
    'Marrakech',
    'Fès',
    'Tanger',
    'Agadir',
    'Meknès',
    'Oujda',
    'Kenitra',
    'Tétouan',
    'El Jadida',
    'Safi',
    'Mohammédia',
    'Béni Mellal',
    'Khénifra',
    'Nador',
    'Essaouira',
    'Ouarzazate',
    'Al Hoceïma',
    'Taroudant',
  ];

  const formatPhoneForRegistration = (rawPhone: string) => {
    const trimmed = rawPhone.trim();
    if (!trimmed) return trimmed;

    if (trimmed.startsWith('+')) {
      return trimmed;
    }

    const local = trimmed.replace(/^0+/, '');
    return `${selectedCountryCode}${local}`;
  };

  // Function to add a category
  const addCategory = (categoryName: string) => {
    if (categoryName && !categories.includes(categoryName)) {
      setCategories([...categories, categoryName]);
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
    StatusBar.setBarStyle('dark-content', true);
  }, []);

  // Handle Google Sign-In response
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleGoogleSignIn(authentication);
    }
  }, [response]);

  // Google Sign-In Handler - authenticates with Firebase
  const handleGoogleSignIn = async (authentication: any) => {
    try {
      setGoogleLoading(true);
      
      // Get user info from Google
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/userinfo/v2/me',
        {
          headers: { Authorization: `Bearer ${authentication.accessToken}` },
        }
      );
      
      const googleUser = await userInfoResponse.json();
      
      console.log('✅ Google user info:', googleUser);
      
      // Create Firebase credential from Google ID token or access token
      try {
        const credential = GoogleAuthProvider.credential(authentication.idToken, authentication.accessToken);
        
        // Sign in with Firebase using the credential
        const firebaseResult = await signInWithCredential(auth, credential);
        const firebaseUser = firebaseResult.user;
        
        console.log('✅ Firebase user created/authenticated:', firebaseUser.uid);
        
        // Check if user already exists in Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          // User exists - this is a login
          console.log('✅ Existing user logged in with Google');
          const userData = userDocSnap.data();
          if (userData?.role === 'artist') {
            router.replace('/(artist)');
          } else {
            router.replace('/(client)');
          }
          setGoogleLoading(false);
          return;
        }
        
        // User doesn't exist - this is a sign up, show role selection
        console.log('📝 New user - showing role selection');
        setGoogleUserData({
          email: googleUser.email,
          name: googleUser.name,
          photoURL: googleUser.picture,
          googleId: googleUser.id,
          isNewUser: true,
          firebaseUid: firebaseUser.uid,
        });
        setShowRoleSelection(true);
        
      } catch (firebaseError: any) {
        console.error('Firebase authentication error:', firebaseError);
        
        // If credential is invalid, fall back to showing role selection for new signup
        setGoogleUserData({
          email: googleUser.email,
          name: googleUser.name,
          photoURL: googleUser.picture,
          googleId: googleUser.id,
          isNewUser: true,
        });
        setShowRoleSelection(true);
      }
      
      setGoogleLoading(false);
      
    } catch (error) {
      console.error('Google Sign-In error:', error);
      setGoogleLoading(false);
      Alert.alert('Error', 'Failed to sign in with Google. Please try again.');
    }
  };

  // Helper function to create Google user in Firestore
  const createGoogleUserInFirestore = async (
    uid: string,
    email: string,
    name: string,
    role: 'client' | 'artist',
    artistDetails?: {
      storeName?: string;
      city?: string;
      categories?: string[];
    }
  ) => {
    try {
      const userDocRef = doc(db, 'users', uid);
      
      const userData = {
        uid,
        email,
        name,
        phoneNumber: '',
        isPhoneVerified: false,
        role,
        createdAt: new Date().toISOString(),
        authProvider: 'google',
        ...(role === 'artist' && artistDetails ? {
          storeName: artistDetails.storeName,
          city: artistDetails.city,
          categories: artistDetails.categories,
        } : {}),
      };
      
      await setDoc(userDocRef, userData);
      console.log('✅ User created in Firestore:', uid);
    } catch (error) {
      console.error('Error creating user in Firestore:', error);
      throw error;
    }
  };

  // Handle Google Role Selection
  const handleGoogleRoleSelection = async () => {
    try {
      setShowRoleSelection(false);
      
      // If artist role is selected, show artist form
      if (userRole === 'artist') {
        setShowGoogleArtistForm(true);
        return;
      }
      
      // For client role, register immediately
      setLoading(true);
      
      // Create user in Firestore with Google data
      await createGoogleUserInFirestore(
        googleUserData.firebaseUid || googleUserData.email,
        googleUserData.email,
        googleUserData.name,
        userRole,
        undefined
      );
      
      setLoading(false);
      console.log(`✅ Google account created in Firestore! User role: ${userRole}`);
      
      // Navigate based on role
      router.replace('/(client)');
      
    } catch (error: any) {
      setLoading(false);
      console.error('Google registration error:', error);
      Alert.alert('Error', 'Failed to create account with Google. Please try again.');
    }
  };

  // Handle Google Artist Registration
  const handleGoogleArtistRegistration = async () => {
    try {
      // Validate artist form
      if (!storeName.trim()) {
        Alert.alert('Validation Error', 'Please enter your store/business name');
        return;
      }
      if (!city.trim()) {
        Alert.alert('Validation Error', 'Please enter your city');
        return;
      }
      if (categories.length === 0) {
        Alert.alert('Validation Error', 'Please select at least one category');
        return;
      }

      setLoading(true);
      setShowGoogleArtistForm(false);
      
      // Create artist user in Firestore with Google data
      await createGoogleUserInFirestore(
        googleUserData.firebaseUid || googleUserData.email,
        googleUserData.email,
        googleUserData.name,
        'artist',
        {
          storeName: storeName.trim(),
          city: city.trim(),
          categories: categories,
        }
      );
      
      setLoading(false);
      console.log(`✅ Google artist account created in Firestore!`);
      
      // Reset artist form
      setStoreName('');
      setCity('');
      setCategories([]);
      
      // Navigate to artist dashboard
      router.replace('/(artist)');
      
    } catch (error: any) {
      setLoading(false);
      console.error('Google registration error:', error);
      Alert.alert('Error', 'Failed to create account with Google. Please try again.');
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
        
        // Check if admin credentials - direct redirect to admin page
        if (email === 'admin@inevents.com' && password === 'admin123456') {
          await login(email, password);
          setLoading(false);
          console.log('✅ Admin login successful! Redirecting to admin page...');
          router.replace('/(admin)');
          return;
        }
        
        const userData = await login(email, password);
        setLoading(false);
        
        console.log('✅ Login successful!');
        
        // Navigate based on user role
        if (userData?.role === 'admin') {
          router.replace('/(admin)');
        } else if (userData?.role === 'artist') {
          router.replace('/(artist)');
        } else {
          router.replace('/(client)');
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

        // Check if phone number is provided for verification
        if (!phone.trim()) {
          Alert.alert('Validation Error', 'Please enter your phone number for verification');
          return;
        }

        // Store registration data and show phone verification
        const artistDetails = userRole === 'artist' ? {
          storeName,
          city,
          categories,
        } : undefined;

        const fullPhone = formatPhoneForRegistration(phone);

        setPendingRegistrationData({
          email,
          password,
          name,
          phone: fullPhone,
          userRole,
          artistDetails
        });

        setShowPhoneVerification(true);
      }
    } catch (error: any) {
      setLoading(false);
      console.error('Authentication error:', error);
      const errorMessage = error.message || 'An unexpected error occurred. Please try again.';
      Alert.alert('Authentication Error', errorMessage);
    }
  };

  // Handle back button
  const handleBack = () => {
    router.replace('/');
  };

  // Toggle Auth Mode
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    // Clear form errors when switching modes
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
  };

  // Handle successful phone verification and complete registration
  const handlePhoneVerificationSuccess = async (verifiedPhone: string) => {
    if (!pendingRegistrationData) return;

    try {
      setLoading(true);
      setShowPhoneVerification(false);

      const { email, password, name, userRole, artistDetails } = pendingRegistrationData;

      await register(email, password, name, verifiedPhone, true, userRole, artistDetails);
      setLoading(false);

      console.log(`✅ Registration successful! User role: ${userRole}`);

      // Clear pending data
      setPendingRegistrationData(null);

      // Navigate based on role
      if (userRole === 'artist') {
        router.replace('/(artist)');
      } else {
        router.replace('/(client)');
      }
    } catch (error: any) {
      setLoading(false);
      console.error('Registration error after phone verification:', error);
      Alert.alert('Registration Error', error.message || 'Failed to complete registration');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Decorative circle — top right accent */}
      <View style={styles.decorCircle} />

      {/* Top nav bar */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleAuthMode} activeOpacity={0.7}>
          <Text style={styles.navToggleText}>{isLogin ? 'Register' : 'Sign In'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAwareScrollView
          enableOnAndroid={true}
          keyboardOpeningTime={Number.MAX_SAFE_INTEGER}
          extraScrollHeight={Platform.OS === 'ios' ? 64 : 100}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={true}
        >
          {/* Page Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {isLogin ? 'Welcome Back' : 'Create Your Account'}
            </Text>
            <Text style={styles.subtitle}>
              {isLogin
                ? 'Sign in to access amazing events and opportunities'
                : 'Join our community of creators and event seekers'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>

          {!isLogin && (
            <ModernInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Full name"
            />
          )}

          <ModernInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
            placeholder="Email address"
          />

          <ModernInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
            error={passwordError}
            placeholder="Password"
          />

          {!isLogin && (
            <ModernInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={true}
              error={confirmPasswordError}
              placeholder="Confirm password"
            />
          )}

          {!isLogin && (
            <View style={styles.phoneInputGroup}>
              <TouchableOpacity
                style={styles.countrySelector}
                onPress={() => setShowCountryPicker(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.countryText}>
                  {countryOptions.find((item) => item.code === selectedCountryCode)?.flag || '🌍'} {selectedCountryCode}
                </Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.phoneInput, styles.input]}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="Phone number"
                placeholderTextColor="#B0B8C1"
              />
            </View>
          )}

          <Modal
            visible={showCountryPicker}
            animationType="slide"
            transparent={true}
          >
            <TouchableWithoutFeedback onPress={() => setShowCountryPicker(false)}>
              <View style={styles.countryModalOverlay} />
            </TouchableWithoutFeedback>
            <View style={styles.countryPickerModal}>
              <Text style={styles.countryModalTitle}>Select country code</Text>
              {countryOptions.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={styles.countryOption}
                  onPress={() => {
                    setSelectedCountryCode(country.code);
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={styles.countryOptionText}>{country.flag} {country.name} ({country.code})</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Modal>

          {/* Forgot password — login only */}
          {isLogin && (
            <TouchableOpacity style={styles.forgotContainer} activeOpacity={0.7}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          {/* Role Selection */}
          {!isLogin && (
            <View style={styles.roleSection}>
              <Text style={styles.sectionTitle}>I want to...</Text>
              <View style={styles.roleContainer}>
                <RoleCard
                  role="client"
                  title="Find Events"
                  description="Discover and book amazing experiences"
                  icon="bullseye"
                  active={userRole === 'client'}
                  onPress={() => setUserRole('client')}
                />
                <RoleCard
                  role="artist"
                  title="Create Events"
                  description="Share your talent with the world"
                  icon="palette"
                  active={userRole === 'artist'}
                  onPress={() => setUserRole('artist')}
                />
              </View>
            </View>
          )}

          {/* Artist-specific fields */}
          {!isLogin && userRole === 'artist' && (
            <>
              <ModernInput
                label="Store/Business Name"
                value={storeName}
                onChangeText={setStoreName}
                placeholder="Store or business name"
              />

              {/* City Selector */}
              <View style={styles.citySection}>
                <Text style={styles.inputLabel}>City</Text>
                <TouchableOpacity
                  style={[styles.cityInput, !city && styles.cityInputEmpty]}
                  onPress={() => setShowCityModal(true)}
                  activeOpacity={0.8}
                >
                  {city ? (
                    <Text style={styles.citySelectedText}>{city}</Text>
                  ) : (
                    <Text style={styles.cityPlaceholder}>Select your city</Text>
                  )}
                  <FontAwesome5 name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Categories */}
              <View style={styles.categorySection}>
                <Text style={styles.inputLabel}>Categories</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryScroll}
                >
                  {availableCategories.map((cat) => {
                    const isSelected = categories.includes(cat.name);
                    return (
                      <TouchableOpacity
                        key={cat.name}
                        style={[
                          styles.categoryChip,
                          isSelected && styles.categoryChipActive,
                        ]}
                        onPress={() => {
                          if (isSelected) {
                            removeCategory(cat.name);
                          } else {
                            addCategory(cat.name);
                          }
                        }}
                      >
                        <FontAwesome5 
                          name={cat.icon} 
                          size={13} 
                          color={isSelected ? '#ffffff' : '#6366F1'}
                          style={styles.categoryChipIcon}
                        />
                        <Text
                          style={[
                            styles.categoryChipText,
                            isSelected && styles.categoryChipTextActive,
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                {categories.length > 0 && (
                  <View style={styles.selectedCategoriesRow}>
                    {categories.map((cat, index) => (
                      <View key={index} style={styles.selectedCategoryTag}>
                        <Text style={styles.selectedCategoryText}>{cat}</Text>
                        <TouchableOpacity onPress={() => removeCategory(cat)}>
                          <FontAwesome5 name="times" size={12} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
                </View>
              </>
            )}

            {/* City Selection Modal */}
            <Modal
              visible={showCityModal}
              animationType="slide"
              transparent={true}
            >
              <TouchableWithoutFeedback onPress={() => setShowCityModal(false)}>
                <View style={styles.modalOverlay} />
              </TouchableWithoutFeedback>
              <View style={styles.cityModalContent}>
                <Text style={styles.modalTitle}>Select City</Text>
                <ScrollView style={styles.cityList}>
                  {moroccanCities.map((cityName) => (
                    <TouchableOpacity
                      key={cityName}
                      style={styles.cityOption}
                      onPress={() => {
                        setCity(cityName);
                        setShowCityModal(false);
                      }}
                    >
                      <Text style={styles.cityOptionText}>{cityName}</Text>
                      {city === cityName && (
                        <FontAwesome5 name="check" size={16} color="#6366F1" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </Modal>

            {/* Padding spacer before submit button */}
            <View style={styles.submitButtonSpacer} />

           {/* Primary Submit Button */}
           <ModernButton
             title={isLogin ? 'Sign In' : 'Create Account'}
             onPress={handleAuthentication}
             loading={loading}
             style={styles.submitButton}
           />

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign-In — card style with arrow */}
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => promptAsync()}
            disabled={!request || googleLoading}
            activeOpacity={0.85}
          >
            {googleLoading ? (
              <ActivityIndicator color="#4285F4" size="small" />
            ) : (
              <>
                <Image
                  source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                  style={styles.socialIcon}
                />
                <Text style={styles.socialButtonText}>Continue with Google</Text>
                <Ionicons name="arrow-forward" size={18} color="#9CA3AF" style={styles.socialArrow} />
              </>
            )}
          </TouchableOpacity>

          {/* Bottom toggle */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
            </Text>
            <TouchableOpacity onPress={toggleAuthMode}>
              <Text style={styles.toggleLink}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
      <PhoneVerificationModal
        visible={showPhoneVerification}
        onClose={() => {
          setShowPhoneVerification(false);
          setPendingRegistrationData(null);
        }}
        phoneNumber={pendingRegistrationData?.phone || ''}
        onVerificationSuccess={handlePhoneVerificationSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Shell ──────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Decorative circle in top-right (like the yellow quarter-circle in the image)
  decorCircle: {
    position: 'absolute',
    top: -width * 0.18,
    right: -width * 0.18,
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: width * 0.275,
    backgroundColor: '#EEF2FF',   // soft indigo tint — matches brand palette
    zIndex: 0,
  },

  // ── Top Nav ────────────────────────────────────────
  topNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: 24,
    zIndex: 10,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  navToggleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6366F1',
    letterSpacing: 0.2,
  },

  // ── Scroll / Header ────────────────────────────────
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 120,
    paddingBottom: 120,
  },

  header: {
    marginBottom: 42,
    paddingBottom: 8,
  },

  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: '#E0E7FF',
  },

  logoImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },

  title: {
    fontSize: 40,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 14,
    letterSpacing: -1.2,
    lineHeight: 44,
  },

  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    maxWidth: '90%',
    fontWeight: '500',
  },

  // ── Form ───────────────────────────────────────────
  formContainer: {
    // flat — no card shadow, matches the image's open layout
  },

  inputContainer: {
    marginBottom: 18,
  },

  inputLabel: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 8,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    color: '#1F2937',
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    fontWeight: '500',
  },

  inputFocused: {
    borderColor: '#6366F1',
    backgroundColor: '#FFFFFF',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },

  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 4,
  },

  phoneInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  countrySelector: {
    minWidth: 110,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginRight: 12,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
  },

  countryText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '600',
  },

  phoneInput: {
    flex: 1,
  },

   countryPickerModal: {
     position: 'absolute',
     bottom: 0,
     left: 0,
     right: 0,
     backgroundColor: '#FFFFFF',
     padding: 20,
     borderTopLeftRadius: 24,
     borderTopRightRadius: 24,
     maxHeight: height * 0.5,
   },

   countryModalOverlay: {
     flex: 1,
     backgroundColor: 'rgba(15, 23, 42, 0.4)',
   },

   countryModalTitle: {
     fontSize: 18,
     fontWeight: '800',
     color: '#0F172A',
     marginBottom: 16,
   },

  countryOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  countryOptionText: {
    fontSize: 16,
    color: '#111827',
  },

  // Forgot password
  forgotContainer: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 28,
  },

  forgotText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Buttons ────────────────────────────────────────
  button: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },

  buttonPrimary: {
    backgroundColor: '#1F2937',
    shadowColor: '#1F2937',
    shadowOpacity: 0.15,
  },

  buttonSecondary: {
    backgroundColor: '#E0E7FF',
  },

  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2.5,
    borderColor: '#6366F1',
  },

  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  buttonTextOutline: {
    color: '#6366F1',
  },

  submitButton: {
    marginBottom: 24,
  },

  // ── Divider ────────────────────────────────────────
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F3F4F6',
  },

  dividerText: {
    marginHorizontal: 14,
    fontSize: 13,
    color: '#D1D5DB',
    fontWeight: '600',
  },

  // ── Social Button (Google) ─────────────────────────
  // Matches image: outlined row card with arrow on right
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 17,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  socialIcon: {
    width: 24,
    height: 24,
    marginRight: 16,
  },

  socialButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },

  socialArrow: {
    marginLeft: 8,
  },

  // ── Toggle ─────────────────────────────────────────
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },

  toggleText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '500',
  },

  toggleLink: {
    color: '#6366F1',
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 4,
  },

  // ── Role Cards ─────────────────────────────────────
  roleSection: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 17,
    color: '#0F172A',
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -0.3,
  },

  roleContainer: {
    gap: 14,
  },

  roleCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },

  roleCardActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
    shadowColor: '#6366F1',
    shadowOpacity: 0.08,
  },

  roleIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  roleIcon: {
    fontSize: 26,
  },

  roleContent: {
    flex: 1,
  },

  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },

  roleTitleActive: {
    color: '#6366F1',
  },

  roleDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    fontWeight: '500',
  },

  roleCheckmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },

  checkmarkIcon: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },

  // ── Artist Section ─────────────────────────────────
   artistSection: {
     marginBottom: 20,
   },

   // ── Modals ─────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: height * 0.72,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },

  modalCloseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalCloseIconText: {
    fontSize: 22,
    color: '#6B7280',
    lineHeight: 26,
  },

  categoryList: {
    maxHeight: 400,
  },

  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: '#F9FAFB',
  },

  categoryOptionSelected: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#6366F1',
  },

  categoryOptionIcon: {
    fontSize: 22,
    marginRight: 14,
  },

  categoryOptionText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },

  categoryOptionTextSelected: {
    color: '#6366F1',
    fontWeight: '700',
  },

  categoryCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },

  categoryCheckmarkText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },

  modalDoneButton: {
    marginTop: 16,
  },

  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalCloseText: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: '600',
  },

   modalSubtitle: {
     fontSize: 14,
     color: '#9CA3AF',
     textAlign: 'center',
     marginBottom: 20,
     lineHeight: 20,
   },

   roleSelectionContainer: {
     marginBottom: 20,
     gap: 10,
   },

   // ── Submit Button Spacing ───────────────────────────
   submitButtonSpacer: {
     height: 24,
   },

   submitButtonContainer: {
     marginHorizontal: 0,
   },

   // ── Artist Section ─────────────────────────────────
   citySection: {
     marginBottom: 20,
   },

   cityInput: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     backgroundColor: '#F9FAFB',
     borderRadius: 16,
     borderWidth: 1.5,
     borderColor: '#E5E7EB',
     paddingHorizontal: 20,
     paddingVertical: 18,
   },

   cityInputEmpty: {
     borderColor: '#E5E7EB',
   },

   citySelectedText: {
     fontSize: 16,
     color: '#1F2937',
     fontWeight: '500',
   },

   cityPlaceholder: {
     fontSize: 16,
     color: '#B0B8C1',
   },

   categorySection: {
     marginTop: 8,
   },

   categoryScroll: {
     gap: 10,
     paddingRight: 20,
   },

   categoryChip: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#EEF2FF',
     borderRadius: 24,
     paddingHorizontal: 18,
     paddingVertical: 12,
     borderWidth: 1.5,
     borderColor: '#C7D2FE',
   },

   categoryChipActive: {
     backgroundColor: '#6366F1',
     borderColor: '#6366F1',
   },

   categoryChipIcon: {
     marginRight: 8,
   },

   categoryChipText: {
     fontSize: 14,
     fontWeight: '600',
     color: '#6366F1',
   },

   categoryChipTextActive: {
     color: '#ffffff',
   },

   selectedCategoriesRow: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     gap: 8,
     marginTop: 12,
   },

   selectedCategoryTag: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#6366F1',
     borderRadius: 20,
     paddingHorizontal: 14,
     paddingVertical: 8,
     gap: 8,
   },

   selectedCategoryText: {
     color: '#fff',
     fontSize: 13,
     fontWeight: '600',
   },

   // ── City Modal ─────────────────────────────────────
   cityModalContent: {
     backgroundColor: '#fff',
     borderTopLeftRadius: 24,
     borderTopRightRadius: 24,
     padding: 24,
     maxHeight: height * 0.6,
   },

   cityList: {
     maxHeight: 400,
   },

   cityOption: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     padding: 16,
     borderRadius: 12,
     marginBottom: 6,
     backgroundColor: '#F9FAFB',
   },

   cityOptionSelected: {
     backgroundColor: '#EEF2FF',
   },

   cityOptionText: {
     fontSize: 16,
     color: '#374151',
     fontWeight: '500',
   },

   cityOptionTextSelected: {
     color: '#6366F1',
     fontWeight: '700',
   },
});