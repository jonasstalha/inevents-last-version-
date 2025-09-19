import { useAuth } from '@/src/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Simple Input Component without animations
const SimpleInput = ({ 
  label, 
  value, 
  onChangeText, 
  secureTextEntry = false, 
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error = ''
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  error?: string;
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
    </View>
  );
};

// Simple Button Component
const SimpleButton = ({ 
  title, 
  onPress, 
  loading = false,
  style = {}
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
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
      )}
    </TouchableOpacity>
  );
};

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
  );
};

export default function AuthScreen() {
  const { login, register } = useAuth();
  const router = useRouter();

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
  }, []);

  // Hardcoded Admin Account Creation
  const createHardcodedAdminAccount = async () => {
    try {
      const adminEmail = 'admin@inevents.com';
      const adminPassword = 'admin123456';
      const adminName = 'System Administrator';
      
      console.log('Checking admin account...');
      await register(adminEmail, adminPassword, adminName, '', true, 'admin');
      console.log('✅ Admin account created successfully');
      
    } catch (error: any) {
      if (error.message && error.message.includes('auth/email-already-in-use')) {
        console.log('✅ Admin account already exists and ready');
      } else {
        console.log('⚠️ Admin account setup issue:', error.message);
      }
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
            router.replace('/(admin)');
          } else if (userRole === 'artist') {
            router.replace('/(artist)');
          } else {
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
      
      <View style={styles.content}>
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
      </View>

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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    borderWidth: 2,
    borderColor: 'transparent',
  },

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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
