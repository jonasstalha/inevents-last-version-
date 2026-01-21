import { useAuth } from '@/src/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const { width, height } = Dimensions.get('window');

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
      outputRange: [20, 0],
    }),
    fontSize: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['#666', isFocused ? '#667eea' : '#999'],
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
            color={isFocused ? '#667eea' : '#999'} 
            style={styles.inputIcon}
          />
        )}
        <Animated.Text style={[styles.floatingLabel, labelStyle]}>
          {label}
        </Animated.Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          placeholder={isFocused ? placeholder : ''}
          placeholderTextColor="#999"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor="#667eea"
        />
      </View>
      {error ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={14} color="#ff4757" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

// Elegant Button Component
const ElegantButton = ({ 
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
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: string;
  style?: any;
}) => {
  return (
    <TouchableOpacity 
      style={[
        styles.elegantButton,
        variant === 'primary' && styles.primaryElegantButton,
        variant === 'secondary' && styles.secondaryElegantButton,
        variant === 'ghost' && styles.ghostElegantButton,
        style
      ]} 
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#667eea'} />
      ) : (
        <>
          {icon && (
            <Icon 
              name={icon} 
              size={20} 
              color={variant === 'primary' ? '#fff' : '#667eea'} 
              style={styles.buttonIcon}
            />
          )}
          <Text style={[
            styles.elegantButtonText,
            variant === 'primary' && styles.primaryButtonText,
            variant === 'secondary' && styles.secondaryButtonText,
            variant === 'ghost' && styles.ghostButtonText,
          ]}>
            {title}
          </Text>
          {variant === 'ghost' && (
            <Icon name="arrow-right" size={20} color="#667eea" style={styles.buttonRightIcon} />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

// Role Card with Premium Design
const PremiumRoleCard = ({ 
  role, 
  title, 
  subtitle, 
  icon, 
  active, 
  onPress 
}: {
  role: string;
  title: string;
  subtitle: string;
  icon: string;
  active: boolean;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity 
      style={[styles.premiumCard, active && styles.activePremiumCard]} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={active ? ['#667eea', '#764ba2'] : ['#fff', '#fff']}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.cardIconContainer, active && styles.activeCardIconContainer]}>
          <Text style={[styles.cardIcon, active && styles.activeCardIcon]}>{icon}</Text>
        </View>
        <Text style={[styles.cardTitle, active && styles.activeCardTitle]}>{title}</Text>
        <Text style={[styles.cardSubtitle, active && styles.activeCardSubtitle]}>{subtitle}</Text>
        {active && (
          <View style={styles.cardBadge}>
            <Icon name="check" size={16} color="#fff" />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Category Chip Component
const CategoryChip = ({ 
  category, 
  onRemove,
  showRemove = true
}: {
  category: string;
  onRemove: () => void;
  showRemove?: boolean;
}) => {
  const getCategoryIcon = (name: string) => {
    const icons: {[key: string]: string} = {
      'Music': '🎵',
      'Visual Arts': '🎨',
      'Performing Arts': '🎭',
      'Dance': '💃',
      'Photography': '📸',
      'Culinary Arts': '👨‍🍳',
      'Digital Art': '💻',
      'Fashion': '👗',
      'Crafts': '🔨',
      'Literature': '📚',
      'Film & Video': '🎬',
      'Other': '✨'
    };
    return icons[name] || '✨';
  };

  return (
    <View style={styles.chipContainer}>
      <View style={styles.chipContent}>
        <Text style={styles.chipIcon}>{getCategoryIcon(category)}</Text>
        <Text style={styles.chipText}>{category}</Text>
      </View>
      {showRemove && (
        <TouchableOpacity onPress={onRemove} style={styles.chipRemove}>
          <Icon name="x" size={14} color="#667eea" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function AuthScreen() {
  const { login, register } = useAuth();
  const router = useRouter();

  // Animation states
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

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
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Available categories
  const availableCategories = [
    'Music', 'Visual Arts', 'Performing Arts', 'Dance',
    'Photography', 'Culinary Arts', 'Digital Art', 'Fashion',
    'Crafts', 'Literature', 'Film & Video', 'Other'
  ];

  const addCategory = (category: string) => {
    if (!categories.includes(category) && categories.length < 5) {
      setCategories([...categories, category]);
    }
  };
  
  const removeCategory = (category: string) => {
    setCategories(categories.filter(c => c !== category));
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
    createHardcodedAdminAccount();

    // Animations
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

  const createHardcodedAdminAccount = async () => {
    // ... (keep your existing implementation)
  };

  const handleAuthentication = async () => {
    try {
      const isEmailValid = validateEmail(email);
      const isPasswordValid = validatePassword(password);
      const isConfirmPasswordValid = validateConfirmPassword(confirmPassword, password);
      
      if (!isEmailValid || !isPasswordValid || (!isLogin && !isConfirmPasswordValid)) {
        return;
      }

      setLoading(true);
      
      if (isLogin) {
        const userRole = await login(email, password);
        setLoading(false);
        
        if (userRole) {
          if (userRole === 'admin') {
            router.replace('/(admin)');
          } else if (userRole === 'artist') {
            router.replace('/(artist)');
          } else {
            router.replace('/(client)');
          }
        }
      } else {
        if (!name.trim()) {
          Alert.alert('Validation Error', 'Please enter your full name');
          setLoading(false);
          return;
        }

        if (userRole === 'artist' && (!storeName.trim() || !city.trim() || categories.length === 0)) {
          Alert.alert('Validation Error', 'Please fill in all artist information including business name, city, and at least one category');
          setLoading(false);
          return;
        }

        await register(email, password, name, phone, false, userRole);
        setLoading(false);
        
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
      Alert.alert('Authentication Error', error.message || 'An unexpected error occurred');
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
  };

  return (
    <View style={styles.container}>
      {/* Brand Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Icon name="chevron-left" size={28} color="#333" />
        </TouchableOpacity>
        <View style={styles.brandContainer}>
          <Text style={styles.brandLogo}>🎭</Text>
          <Text style={styles.brandName}>EventFlow</Text>
        </View>
      </View>

      <Animated.View 
        style={[
          styles.content, 
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            {isLogin ? 'Welcome Back!' : 'Join EventFlow'}
          </Text>
          <Text style={styles.heroSubtitle}>
            {isLogin 
              ? 'Sign in to access your event dashboard' 
              : 'Create your account and start your event journey'
            }
          </Text>
        </View>

        {/* Form Container */}
        <ScrollView 
          style={styles.formScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.formContent}
        >
          {!isLogin && (
            <FloatingInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              icon="user"
              placeholder="Enter your full name"
            />
          )}
          
          <FloatingInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
            icon="mail"
            placeholder="you@example.com"
          />
          
          <FloatingInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
            error={passwordError}
            icon="lock"
            placeholder="Enter your password"
          />
          
          {!isLogin && (
            <FloatingInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={true}
              error={confirmPasswordError}
              icon="lock"
              placeholder="Confirm your password"
            />
          )}
          
          {!isLogin && (
            <FloatingInput
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              icon="phone"
              placeholder="+1 (555) 123-4567"
            />
          )}
          
          {!isLogin && (
            <>
              {/* Role Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Your Role</Text>
                <View style={styles.roleGrid}>
                  <PremiumRoleCard
                    role="client"
                    title="Event Seeker"
                    subtitle="Discover & book events"
                    icon="🎯"
                    active={userRole === 'client'}
                    onPress={() => setUserRole('client')}
                  />
                  <PremiumRoleCard
                    role="artist"
                    title="Event Creator"
                    subtitle="Host & manage events"
                    icon="🎨"
                    active={userRole === 'artist'}
                    onPress={() => setUserRole('artist')}
                  />
                </View>
              </View>

              {/* Artist Specific Fields */}
              {userRole === 'artist' && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Business Details</Text>
                    <View style={styles.sectionBadge}>
                      <Text style={styles.sectionBadgeText}>Artist</Text>
                    </View>
                  </View>
                  
                  <FloatingInput
                    label="Business Name"
                    value={storeName}
                    onChangeText={setStoreName}
                    icon="briefcase"
                    placeholder="Your business or brand name"
                  />
                  
                  <FloatingInput
                    label="City"
                    value={city}
                    onChangeText={setCity}
                    icon="map-pin"
                    placeholder="Your business location"
                  />

                  {/* Categories */}
                  <View style={styles.categorySection}>
                    <View style={styles.categoryHeader}>
                      <Text style={styles.categoryLabel}>Specialties</Text>
                      <TouchableOpacity 
                        style={styles.addCategory}
                        onPress={() => setShowCategoryModal(true)}
                      >
                        <Icon name="plus-circle" size={20} color="#667eea" />
                        <Text style={styles.addCategoryText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {categories.length > 0 ? (
                      <View style={styles.categoryGrid}>
                        {categories.map((category, index) => (
                          <CategoryChip
                            key={index}
                            category={category}
                            onRemove={() => removeCategory(category)}
                          />
                        ))}
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={styles.emptyCategories}
                        onPress={() => setShowCategoryModal(true)}
                      >
                        <Icon name="tag" size={24} color="#ddd" />
                        <Text style={styles.emptyCategoriesText}>
                          Add up to 5 specialties
                        </Text>
                      </TouchableOpacity>
                    )}
                    <Text style={styles.categoryHint}>
                      {categories.length}/5 categories selected
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}
          
          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <ElegantButton
              title={isLogin ? 'Sign In to Account' : 'Create Account'}
              onPress={handleAuthentication}
              loading={loading}
              icon={isLogin ? 'log-in' : 'user-plus'}
              style={styles.mainActionButton}
            />
            
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <ElegantButton
              title={isLogin ? 'Create New Account' : 'Sign In Instead'}
              onPress={toggleAuthMode}
              variant="ghost"
              icon={isLogin ? 'user-plus' : 'log-in'}
            />
          </View>
          
          <Text style={styles.agreementText}>
            By continuing, you agree to EventFlow's{' '}
            <Text style={styles.linkText}>Terms of Service</Text> and{' '}
            <Text style={styles.linkText}>Privacy Policy</Text>
          </Text>
        </ScrollView>
      </Animated.View>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Specialties</Text>
              <Text style={styles.modalSubtitle}>Choose your areas of expertise</Text>
              <TouchableOpacity 
                style={styles.modalClose}
                onPress={() => setShowCategoryModal(false)}
              >
                <Icon name="x" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll}>
              <View style={styles.modalGrid}>
                {availableCategories.map((category, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.modalItem,
                      categories.includes(category) && styles.modalItemSelected
                    ]}
                    onPress={() => {
                      if (categories.includes(category)) {
                        removeCategory(category);
                      } else if (categories.length < 5) {
                        addCategory(category);
                      }
                    }}
                    disabled={categories.length >= 5 && !categories.includes(category)}
                  >
                    <CategoryChip
                      category={category}
                      onRemove={() => {}}
                      showRemove={false}
                    />
                    {categories.includes(category) && (
                      <View style={styles.selectedCheck}>
                        <Icon name="check" size={16} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <Text style={styles.selectionCount}>
                {categories.length} of 5 selected
              </Text>
              <ElegantButton
                title="Done"
                onPress={() => setShowCategoryModal(false)}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  brandLogo: {
    fontSize: 28,
    marginRight: 12,
  },
  
  brandName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    letterSpacing: -0.5,
  },
  
  content: {
    flex: 1,
  },
  
  heroSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#fff',
  },
  
  heroTitle: {
    fontSize: 32,
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
  
  formScroll: {
    flex: 1,
  },
  
  formContent: {
    padding: 24,
  },
  
  inputContainer: {
    marginBottom: 20,
  },
  
  inputWrapper: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
    position: 'relative',
  },
  
  inputWrapperFocused: {
    borderColor: '#667eea',
    backgroundColor: '#fff',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  
  inputWrapperError: {
    borderColor: '#ff4757',
  },
  
  inputIcon: {
    marginRight: 12,
    marginTop: 4,
  },
  
  floatingLabel: {
    position: 'absolute',
    left: icon ? 48 : 16,
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
  
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  
  errorText: {
    color: '#ff4757',
    fontSize: 13,
    fontWeight: '500',
  },
  
  section: {
    marginBottom: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    letterSpacing: -0.3,
  },
  
  sectionBadge: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  
  sectionBadgeText: {
    color: '#667eea',
    fontSize: 12,
    fontWeight: '600',
  },
  
  roleGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  
  premiumCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  
  activePremiumCard: {
    shadowColor: '#667eea',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  
  cardGradient: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 16,
  },
  
  cardIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  
  activeCardIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  cardIcon: {
    fontSize: 28,
  },
  
  activeCardIcon: {
    color: '#fff',
  },
  
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  
  activeCardTitle: {
    color: '#fff',
  },
  
  cardSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  
  activeCardSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  
  cardBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  categorySection: {
    marginTop: 8,
  },
  
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  
  addCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  
  addCategoryText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  
  emptyCategories: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    borderStyle: 'dashed',
    gap: 12,
  },
  
  emptyCategoriesText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  
  categoryHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    gap: 8,
  },
  
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  
  chipIcon: {
    fontSize: 14,
  },
  
  chipText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '600',
  },
  
  chipRemove: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  actionSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  
  mainActionButton: {
    marginBottom: 20,
  },
  
  elegantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
  },
  
  primaryElegantButton: {
    backgroundColor: '#667eea',
  },
  
  secondaryElegantButton: {
    backgroundColor: '#f0f0f0',
  },
  
  ghostElegantButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  
  elegantButtonText: {
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
  
  ghostButtonText: {
    color: '#667eea',
  },
  
  buttonIcon: {
    marginRight: 8,
  },
  
  buttonRightIcon: {
    marginLeft: 8,
  },
  
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  
  dividerText: {
    marginHorizontal: 16,
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  
  agreementText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 24,
  },
  
  linkText: {
    color: '#667eea',
    fontWeight: '600',
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  
  modalHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    position: 'relative',
  },
  
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  
  modalClose: {
    position: 'absolute',
    right: 20,
    top: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  modalScroll: {
    padding: 20,
  },
  
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  
  modalItem: {
    position: 'relative',
  },
  
  modalItemSelected: {
    opacity: 0.9,
  },
  
  selectedCheck: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  selectionCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  
  modalButton: {
    paddingHorizontal: 32,
  },
});