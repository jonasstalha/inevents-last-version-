import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Yup from 'yup';

// Firebase imports
import { getApps, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getFirestore,
  setDoc
} from 'firebase/firestore';

// Firebase Configuration - Updated to match inevents-2fe56 project
const firebaseConfig = {
  apiKey: 'AIzaSyA4d4sIGVIDfhMOuG75qDK_rUZiPsugcYE',
  authDomain: 'inevents-2fe56.firebaseapp.com',
  projectId: 'inevents-2fe56',
  storageBucket: 'inevents-2fe56.appspot.com',
  messagingSenderId: '780609459655',
  appId: '1:780609459655:android:c4535e1323f166ef7f75e2',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

// Firebase Auth Functions
const registerWithEmail = async (email, password, name) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Save comprehensive user profile in Firestore users collection
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    id: userCredential.user.uid,
    uid: userCredential.user.uid,
    name: name,
    email: email,
    phone: '', // Will be updated in createUserProfile
    role: 'client', // Default role, will be updated in createUserProfile
    status: 'active',
    signupDate: new Date(),
    createdAt: new Date(),
    lastLogin: new Date(),
    revenue: 0,
    region: 'Unknown',
    // Additional fields for inevents project
    eventsAttended: 0,
    eventsOrganized: 0,
    favoriteCategory: '',
    specialization: '',
  });

  console.log('✅ User created in Firestore users collection:', userCredential.user.uid);
  return userCredential;
};

const loginWithEmail = async (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

const createUserProfile = async (uid, email, phone, role) => {
  await setDoc(
    doc(db, 'users', uid),
    {
      id: uid,
      uid: uid,
      email: email,
      phone: phone,
      role: role,
      status: 'active',
      signupDate: new Date(),
      createdAt: new Date(),
      lastLogin: new Date(),
      revenue: 0,
      region: 'Unknown',
      // Role-specific fields
      ...(role === '(artist)' ? {
        eventsOrganized: 0,
        specialization: '',
      } : {
        eventsAttended: 0,
        favoriteCategory: '',
      }),
    },
    { merge: true } // This will update existing fields while keeping others
  );
  
  console.log(`✅ User profile updated in Firestore: ${uid} as ${role}`);
};

const getUserRole = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data().role;
    }
    return 'client'; // default role
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'client';
  }
};

const logout = async () => {
  return signOut(auth);
};

// Theme object
const Theme = {
  colors: {
    primary: '#3B82F6',
    secondary: '#FFFFFF',
    background: '#F8FAFC',
    textDark: '#1F2937',
    textLight: '#6B7280',
    border: '#E5E7EB',
    error: '#EF4444',
    success: '#10B981',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 32,
    },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
};

// Custom Input Component
const CustomInput = ({ label, leftIcon, error, style, ...props }) => (
  <View style={[styles.inputContainer, style]}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={[styles.inputWrapper, error && styles.inputError]}>
      {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
      <TextInput
        style={[styles.textInput, leftIcon && styles.textInputWithIcon]}
        placeholderTextColor={Theme.colors.textLight}
        {...props}
      />
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// Custom Button Component
const CustomButton = ({ title, onPress, loading, fullWidth, variant = 'primary', style }) => (
  <TouchableOpacity
    style={[
      styles.button,
      variant === 'primary' ? styles.primaryButton : styles.outlineButton,
      fullWidth && styles.fullWidthButton,
      loading && styles.disabledButton,
      style,
    ]}
    onPress={onPress}
    disabled={loading}
  >
    {loading ? (
      <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : Theme.colors.primary} />
    ) : (
      <Text style={[
        styles.buttonText,
        variant === 'primary' ? styles.primaryButtonText : styles.outlineButtonText,
      ]}>
        {title}
      </Text>
    )}
  </TouchableOpacity>
);

// Custom Card Component
const CustomCard = ({ children, style }) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

// Icon Components
const ArrowLeftIcon = () => <Text style={styles.icon}>←</Text>;
const UserIcon = () => <Text style={styles.icon}>👤</Text>;
const MailIcon = () => <Text style={styles.icon}>📧</Text>;
const LockIcon = () => <Text style={styles.icon}>🔒</Text>;
const PhoneIcon = () => <Text style={styles.icon}>📱</Text>;

// Validation Schemas
const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const RegisterSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  phone: Yup.string().required('Phone number is required'),
  role: Yup.string().oneOf(['(artist)', 'client'], 'Invalid role').required('Role is required'),
});

// Main Component
export default function AuthScreen() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<{ email: string | null; role: string } | null>(null);
  const router = useRouter();

  // Auth state change listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const role = await getUserRole(user.uid);
          setUser({ email: user.email, role });
          
          // Auto-redirect based on role
          if (role === 'admin') {
            console.log('🔄 Redirecting admin to /(admin)');
            router.replace('/(admin)');
          } else if (role === '(artist)') {
            console.log('🎨 Redirecting (artist) to standalone (artist) app');
            // Redirect to separate (artist) application
            router.replace('/(artist)');
          } else {
            console.log('👤 Redirecting client to /(client)/profile');
            router.replace('/(client)/profile');
          }
        } catch (error) {
          console.error('Error getting user role:', error);
          setUser(user ? { email: user.email, role: '' } : null);
        }
      } else {
        setUser(null);
      }
      
      if (initializing) setInitializing(false);
    });

    return unsubscribe; // unsubscribe on unmount
  }, [initializing, router]);

  // Redirect to appropriate page if user is logged in (after initialization)
  useEffect(() => {
    if (!initializing && user) {
      if (user.role === 'admin') {
        console.log('🔄 Auto-redirecting admin to /(admin)');
        router.replace('/(admin)');
      } else if (user.role === '(artist)') {
        console.log('🎨 Auto-redirecting (artist) to standalone (artist) app');
        router.replace('/(artist)');
      } else {
        console.log('👤 Auto-redirecting client to /(client)/profile');
        router.replace('/(client)/profile');
      }
    }
  }, [initializing, user, router]);

  // Show loading screen while initializing
  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const handleLogin = async (
    values: { email: string; password: string },
    { setSubmitting, setErrors }: { setSubmitting: (b: boolean) => void; setErrors: (e: any) => void }
  ) => {
    try {
      setSubmitting(true);
      const userCredential = await loginWithEmail(values.email, values.password);
      const role = await getUserRole(userCredential.user.uid);
      Alert.alert(
        'Success',
        `Welcome back! Logged in as ${role}`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (role === 'admin') {
                console.log('🔄 Login success - redirecting admin to /(admin)');
                router.replace('/(admin)');
              } else if (role === '(artist)') {
                console.log('🎨 Login success - redirecting (artist) to standalone (artist) app');
                router.replace('/(artist)');
              } else {
                console.log('👤 Login success - redirecting client to /(client)/profile');
                router.replace('/(client)/profile');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Invalid email or password';
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'auth/user-not-found') {
          errorMessage = 'No account found with this email';
        } else if (error.code === 'auth/wrong-password') {
          errorMessage = 'Incorrect password';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email address';
        }
      }
      setErrors({
        email: errorMessage,
        password: errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (
    values: { name: string; email: string; password: string; phone: string; role: string },
    { setSubmitting, setErrors }: { setSubmitting: (b: boolean) => void; setErrors: (e: any) => void }
  ) => {
    try {
      setSubmitting(true);
      const userCredential = await registerWithEmail(values.email, values.password, values.name);
      const uid = userCredential.user.uid;
      await createUserProfile(uid, values.email, values.phone, values.role);
      Alert.alert(
        'Success',
        `Account created successfully! Welcome ${values.name}`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (values.role === '(artist)') {
                console.log('🎨 Registration success - redirecting (artist) to standalone (artist) app');
                router.replace('/(artist)');
              } else {
                console.log('👤 Registration success - redirecting client to /(client)/profile');
                router.replace('/(client)/profile');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed';
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'Email is already registered';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'Password is too weak';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email address';
        }
      }
      setErrors({
        email: errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    Alert.alert('Info', 'Google Sign-In would be implemented here with expo-auth-session');
  };

  const toggleMode = () => setIsLoginMode(prev => !prev);

  // Go back to the previous screen/section
  const goBack = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Back Button */}

          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <View style={{
              backgroundColor: '#f3f4f6',
              borderRadius: 20,
              padding: 8,
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 4,
              elevation: 2,
            }}>
              <ArrowLeftIcon />
            </View>
          </TouchableOpacity>

          {/* Header */}

          <Text style={[styles.title, { fontSize: 32, color: '#6a0dad', marginBottom: 4, letterSpacing: 1.2 }]}> 
            {isLoginMode ? 'Welcome Back' : 'Create Account'}
          </Text>
          <Text style={[styles.subtitle, { fontSize: 16, color: '#7c3aed', marginBottom: 28, letterSpacing: 0.5 }]}> 
            {isLoginMode ? 'Sign in to continue' : 'Sign up to get started'}
          </Text>

          {/* Auth Form Card */}
          <CustomCard style={[styles.authCard, { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e5e7eb', shadowOpacity: 0.13, shadowRadius: 12, elevation: 7 }] }>
            {isLoginMode ? (
              // Login Form
              <Formik
                initialValues={{ email: '', password: '' }}
                validationSchema={LoginSchema}
                onSubmit={handleLogin}
              >
                {({
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  values,
                  errors,
                  touched,
                  isSubmitting,
                }) => (
                  <View>
                    <CustomInput
                      label="Email"
                      placeholder="Enter your email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      leftIcon={<MailIcon />}
                      value={values.email}
                      onChangeText={handleChange('email')}
                      onBlur={handleBlur('email')}
                      error={touched.email && errors.email ? errors.email : undefined}
                      style={{ backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb' }}
                    />

                    <CustomInput
                      label="Password"
                      placeholder="Enter your password"
                      secureTextEntry={!showPassword}
                      leftIcon={<LockIcon />}
                      value={values.password}
                      onChangeText={handleChange('password')}
                      onBlur={handleBlur('password')}
                      error={touched.password && errors.password ? errors.password : undefined}
                      style={{ backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb' }}
                    />

                    <TouchableOpacity
                      style={[styles.showPasswordButton, { marginTop: 0, marginBottom: 8 }] }
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Text style={[styles.showPasswordText, { color: '#6a0dad', fontWeight: 'bold' }]}>
                        {showPassword ? 'Hide' : 'Show'} Password
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleSubmit()}
                      style={[
                        styles.button,
                        styles.primaryButton,
                        styles.fullWidthButton,
                        styles.submitButton,
                        { backgroundColor: isSubmitting ? '#a78bfa' : '#6a0dad', borderRadius: 16, shadowColor: '#6a0dad', shadowOpacity: 0.18, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 4 }
                      ]}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={[styles.buttonText, styles.primaryButtonText, { fontSize: 18, fontWeight: '700', letterSpacing: 1 }]}>Login</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </Formik>
            ) : (
              // Register Form
              <Formik
                initialValues={{
                  name: '',
                  email: '',
                  password: '',
                  phone: '',
                  role: 'client',
                }}
                validationSchema={RegisterSchema}
                onSubmit={handleRegister}
              >
                {({
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  values,
                  errors,
                  touched,
                  setFieldValue,
                  isSubmitting,
                }) => (
                  <View>
                    <CustomInput
                      label="Name"
                      placeholder="Enter your full name"
                      leftIcon={<UserIcon />}
                      value={values.name}
                      onChangeText={handleChange('name')}
                      onBlur={handleBlur('name')}
                      error={touched.name && errors.name ? errors.name : undefined}
                      style={undefined}
                    />

                    <CustomInput
                      label="Email"
                      placeholder="Enter your email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      leftIcon={<MailIcon />}
                      value={values.email}
                      onChangeText={handleChange('email')}
                      onBlur={handleBlur('email')}
                      error={touched.email && errors.email ? errors.email : undefined}
                      style={undefined}
                    />

                    <CustomInput
                      label="Phone Number"
                      placeholder="Enter your phone number"
                      keyboardType="phone-pad"
                      leftIcon={<PhoneIcon />}
                      value={values.phone}
                      onChangeText={handleChange('phone')}
                      onBlur={handleBlur('phone')}
                      error={touched.phone && errors.phone ? errors.phone : undefined}
                      style={undefined}
                    />

                    <CustomInput
                      label="Password"
                      placeholder="Enter your password"
                      secureTextEntry={!showPassword}
                      leftIcon={<LockIcon />}
                      value={values.password}
                      onChangeText={handleChange('password')}
                      onBlur={handleBlur('password')}
                      error={touched.password && errors.password ? errors.password : undefined}
                      style={undefined}
                    />

                    <TouchableOpacity
                      style={styles.showPasswordButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Text style={styles.showPasswordText}>
                        {showPassword ? 'Hide' : 'Show'} Password
                      </Text>
                    </TouchableOpacity>

                    {/* Role Selection */}
                    <Text style={styles.roleLabel}>I am a:</Text>
                    <View style={styles.roleContainer}>
                      {['client', '(artist)'].map(role => (
                        <TouchableOpacity
                          key={role}
                          style={[
                            styles.roleButton,
                            values.role === role && styles.selectedRole,
                          ]}
                          onPress={() => setFieldValue('role', role)}
                        >
                          <Text
                            style={[
                              styles.roleText,
                              values.role === role && styles.selectedRoleText,
                            ]}
                          >
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {touched.role && errors.role && (
                      <Text style={styles.errorText}>{errors.role}</Text>
                    )}

                    <CustomButton
                      title="Register"
                      onPress={handleSubmit}
                      loading={isSubmitting}
                      fullWidth
                      style={styles.submitButton}
                    />
                  </View>
                )}
              </Formik>
            )}

            {/* Google Sign In Button */}
            <CustomButton
              title="Sign in with Google"
              onPress={handleGoogleSignIn}
              fullWidth
              variant="outline"
              style={styles.googleButton}
              loading={false}
            />
          </CustomCard>

          {/* Toggle Mode */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isLoginMode ? "Don't have an account?" : 'Already have an account?'}
            </Text>
            <TouchableOpacity onPress={toggleMode}>
              <Text style={styles.toggleLink}>
                {isLoginMode ? 'Sign Up' : 'Login'}
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Styles
const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  loadingText: {
    marginTop: Theme.spacing.md,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textLight,
  },
  accountContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    marginBottom: Theme.spacing.sm,
  },
  userInfoLabel: {
    fontSize: Theme.typography.fontSize.md,
    fontWeight: '500',
    color: Theme.colors.textDark,
  },
  userInfoValue: {
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textLight,
  },
  logoutButton: {
    marginTop: Theme.spacing.sm,
  },
  backButton: {
    paddingTop: Theme.spacing.xl,
    paddingBottom: Theme.spacing.lg,
  },
  title: {
    fontSize: Theme.typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Theme.colors.textDark,
    marginBottom: Theme.spacing.sm,
  },
  subtitle: {
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textLight,
    marginBottom: Theme.spacing.xl,
  },
  authCard: {
    width: '100%',
    marginBottom: Theme.spacing.lg,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: Theme.spacing.md,
  },
  inputLabel: {
    fontSize: Theme.typography.fontSize.sm,
    fontWeight: '500',
    color: Theme.colors.textDark,
    marginBottom: Theme.spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: 'white',
  },
  inputError: {
    borderColor: Theme.colors.error,
    backgroundColor: '#FEF2F2',
  },
  iconContainer: {
    paddingLeft: Theme.spacing.sm,
    paddingRight: Theme.spacing.xs,
  },
  textInput: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.sm,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textDark,
  },
  textInputWithIcon: {
    paddingLeft: 0,
  },
  errorText: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.error,
    marginTop: Theme.spacing.xs,
  },
  showPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: Theme.spacing.md,
  },
  showPasswordText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.primary,
    fontWeight: '500',
  },
  roleLabel: {
    fontSize: Theme.typography.fontSize.sm,
    fontWeight: '500',
    color: Theme.colors.textDark,
    marginBottom: Theme.spacing.xs,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  roleButton: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginHorizontal: Theme.spacing.xs,
    alignItems: 'center',
  },
  selectedRole: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  roleText: {
    fontSize: Theme.typography.fontSize.sm,
    fontWeight: '500',
    color: Theme.colors.textDark,
  },
  selectedRoleText: {
    color: Theme.colors.secondary,
  },
  button: {
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: Theme.colors.primary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  fullWidthButton: {
    width: '100%',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: Theme.typography.fontSize.md,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: Theme.colors.secondary,
  },
  outlineButtonText: {
    color: Theme.colors.textDark,
  },
  submitButton: {
    marginTop: Theme.spacing.md,
  },
  googleButton: {
    marginTop: Theme.spacing.md,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.lg,
  },
  toggleText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
  },
  toggleLink: {
    fontSize: Theme.typography.fontSize.sm,
    fontWeight: '600',
    color: Theme.colors.primary,
    marginLeft: Theme.spacing.xs,
  },
  demoContainer: {
    marginTop: Theme.spacing.xl,
    padding: Theme.spacing.md,
    backgroundColor: '#F3F4F6',
    borderRadius: Theme.borderRadius.md,
  },
  demoTitle: {
    fontSize: Theme.typography.fontSize.sm,
    fontWeight: '600',
    color: Theme.colors.textDark,
    marginBottom: Theme.spacing.xs,
  },
  demoText: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textLight,
    lineHeight: 16,
  },
  icon: {
    fontSize: 16,
    color: Theme.colors.textLight,
  },
});