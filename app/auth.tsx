import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function AuthScreen() {
  const router = useRouter();
  const { login, register, loading, user, verifyPhoneNumber, confirmVerificationCode } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [developmentCode, setDevelopmentCode] = useState('');
  
  // This comment replaces duplicate animation values that were here
  const [userRole, setUserRole] = useState<'artist' | 'client' | 'admin'>('client');
  
  // Additional fields for artists
  const [city, setCity] = useState('');
  const [storeName, setStoreName] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Animation refs
  const logoAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  
  // Available categories for artists
  const availableCategories = [
    'Music', 
    'Visual Arts', 
    'Performing Arts', 
    'Dance', 
    'Photography', 
    'Culinary Arts',
    'Digital Art',
    'Fashion',
    'Crafts',
    'Literature',
    'Film & Video',
    'Other'
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

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(300),
        Animated.spring(formAnim, {
          toValue: 1,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        })
      ]),
    ]).start();
  }, []);

  // Function to send verification code
  const handleSendVerificationCode = async () => {
    // Enhanced validation
    if (!phoneNumber) {
      setVerificationError('Please enter your WhatsApp number');
      return;
    }
    
    const cleanedNumber = phoneNumber.replace(/\D/g, '');
    if (cleanedNumber.length < 10) {
      setVerificationError('Please enter a valid WhatsApp number with at least 10 digits');
      return;
    }
    
    try {
      setVerificationLoading(true);
      setVerificationError('');
      setVerificationCode(''); // Clear any existing code
      
      // Call the verification service
      const result = await verifyPhoneNumber(phoneNumber);
      
      // For development only - set the actual verification code for testing
      setDevelopmentCode(result.verificationCode);
      
      setIsVerificationSent(true);
      
      // Don't show an alert (better UX) - instead the UI will update to show code input field
      // Clear any previous errors since we successfully sent the code
      setVerificationError('');
      
      // Auto-focus on code input (handled in the component via autoFocus)
    } catch (error) {
      console.error('Failed to send verification code:', error);
      setVerificationError('Unable to send verification code. Please check your number and try again.');
    } finally {
      setVerificationLoading(false);
    }
  };
  
  // Function to verify the code
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setVerificationError('Please enter a valid 6-digit WhatsApp verification code');
      return;
    }
    
    try {
      setVerificationLoading(true);
      setVerificationError('');
      
      // Verify the code from WhatsApp
      const isValid = await confirmVerificationCode(phoneNumber, verificationCode);
      
      if (isValid) {
        setIsPhoneVerified(true);
        // No alert for better UX, just show visual confirmation
      } else {
        // First attempt - give a helpful message
        if (!verificationError) {
          setVerificationError('The WhatsApp code entered is not valid. Please check and try again.');
        } else {
          // Second or subsequent attempt - give more options
          setVerificationError('WhatsApp verification failed. Double-check the code or request a new one.');
        }
        // Automatically clear the code field for better UX
        setVerificationCode('');
      }
    } catch (error) {
      console.error('Failed to verify WhatsApp code:', error);
      setVerificationError('WhatsApp verification failed. Please try again or request a new code.');
      setVerificationCode('');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleAuthentication = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      console.log(`Attempting to ${isLogin ? 'login' : 'register'} with email: ${email}`);
      
      if (isLogin) {
        // Perform login - now returns the role directly
        const userRole = await login(email, password);
        console.log('Login successful - got user role:', userRole);
        
        // Simple navigation based on role
        if (userRole === 'admin') {
          console.log('Navigating to admin area');
          router.push('/(admin)');
        } else if (userRole === 'artist') {
          console.log('Navigating to artist area');
          router.push('/(artist)');
        } else {
          console.log('Navigating to client area (default)');
          router.push('/(client)');
        }
      } else {
        // Registration flow
        if (!name) {
          Alert.alert('Error', 'Please enter your name');
          return;
        }
        
        // Check phone verification
        if (!isPhoneVerified) {
          Alert.alert('Error', 'Please verify your phone number before registration');
          return;
        }
        
        // Prepare artist details if needed
        if (userRole === 'artist') {
          if (!storeName) {
            Alert.alert('Error', 'Please enter your store name');
            return;
          }
          if (!city) {
            Alert.alert('Error', 'Please enter your city');
            return;
          }
          if (categories.length === 0) {
            Alert.alert('Error', 'Please select at least one category');
            return;
          }
        }
        
        // Register with selected role and additional info for artists
        const artistDetails = userRole === 'artist' ? { storeName, city, categories } : undefined;
        await register(email, password, name, phoneNumber, isPhoneVerified, userRole, artistDetails);
        console.log('Registration successful, navigating to appropriate route');
        
        // Navigate immediately based on the role selected during registration
        try {
          console.log(`Registered as ${userRole}, navigating to appropriate route`);
          
          // Use simple conditional navigation
          if (userRole === 'admin') {
            router.push('/(admin)');
          } else if (userRole === 'artist') {
            router.push('/(artist)');
          } else {
            router.push('/(client)');
          }
        } catch (error) {
          console.error('Navigation error:', error);
          
          // Try one more time after a short delay
          setTimeout(() => {
            try {
              console.log(`Retry navigation as ${userRole}`);
              if (userRole === 'artist') {
                router.push('/(artist)');
              } else if (userRole === 'admin') {
                router.push('/(admin)');
              } else {
                router.push('/(client)');
              }
            } catch (retryError) {
              console.error('Retry navigation failed:', retryError);
              // Last resort - just navigate to the root
              router.push('/');
            }
          }, 500);
        }
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      
      // Extract a user-friendly error message
      let errorMessage = 'Failed to authenticate';
      
      if (error.message) {
        if (error.message.includes('auth/email-already-in-use')) {
          errorMessage = 'This email is already registered. Please log in instead.';
        } else if (error.message.includes('auth/invalid-email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('auth/weak-password')) {
          errorMessage = 'Password is too weak. Please use at least 6 characters.';
        } else if (error.message.includes('auth/wrong-password') || error.message.includes('auth/user-not-found')) {
          errorMessage = 'Invalid email or password.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Authentication Error', errorMessage);
    }
  };

  const toggleAuthMode = () => {
    // First animate out
    Animated.timing(formAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Change state
      setIsLogin(!isLogin);
      
      // Then animate back in
      Animated.timing(formAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/indexpage/mainpic.png')} 
        style={styles.heroImage} 
        resizeMode="cover" 
      />
      <View style={styles.overlayContainer} />
      
      <View style={styles.content}>
        <Animated.Image
            source={require('../assets/indexpage/welcomepage.png')}
            style={[
              styles.logo,
              {
                opacity: logoAnim,
                transform: [
                  { 
                    translateY: logoAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    })
                  },
                ],
              },
            ]}
          />
          
          <Animated.View 
            style={[
              styles.formContainer,
              {
                opacity: formAnim,
                transform: [
                  {
                    translateY: formAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                  {
                    scale: formAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1]
                    })
                  }
                ],
              }
            ]}
          >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
          <Text style={styles.formTitle}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
          
          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#aaa"
              value={name}
              onChangeText={setName}
            />
          )}
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          {!isLogin && (
            <View style={styles.phoneVerificationContainer}>
              <Text style={styles.verificationTitle}>
                {isPhoneVerified ? "✓ Phone Verified" : "Phone Verification (WhatsApp)"}
              </Text>
              
              <View style={styles.phoneInputContainer}>
                <TextInput
                  style={[styles.input, styles.phoneInput, isPhoneVerified && styles.verifiedInput]}
                  placeholder="WhatsApp Number"
                  placeholderTextColor="#aaa"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  editable={!isPhoneVerified}
                />
                
                {!isPhoneVerified && (
                  <TouchableOpacity 
                    style={[styles.verificationButton, isVerificationSent && styles.verificationSentButton]} 
                    onPress={handleSendVerificationCode}
                    disabled={verificationLoading || !phoneNumber || phoneNumber.length < 10}
                  >
                    {verificationLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text style={[styles.verificationButtonText, {marginRight: 5}]}>
                          {isVerificationSent ? 'Resend to' : 'Send to'}
                        </Text>
                        <Text style={{color: '#ffffff', fontSize: 16, fontWeight: 'bold'}}>WhatsApp</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
                
                {isPhoneVerified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>✓ Verified</Text>
                  </View>
                )}
              </View>
              
              {isVerificationSent && !isPhoneVerified && (
                <>
                  <View style={styles.whatsappVerificationBox}>
                    <View style={styles.whatsappIcon}>
                      <Text style={styles.whatsappIconText}>✓</Text>
                    </View>
                    <Text style={styles.codeSentText}>
                      Enter the 6-digit verification code sent to your WhatsApp
                    </Text>
                    
                    <View style={styles.codeVerificationContainer}>
                      <TextInput
                        style={[styles.input, styles.codeInput]}
                        placeholder="- - - - - -"
                        placeholderTextColor="#aaa"
                        value={verificationCode}
                        onChangeText={setVerificationCode}
                        keyboardType="number-pad"
                        maxLength={6}
                        autoFocus
                      />
                      
                      <TouchableOpacity 
                        style={[
                          styles.verifyCodeButton,
                          (!verificationCode || verificationCode.length !== 6) && styles.disabledButton
                        ]}
                        onPress={handleVerifyCode}
                        disabled={verificationLoading || !verificationCode || verificationCode.length !== 6}
                      >
                        {verificationLoading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <View style={{flexDirection: 'row', alignItems: 'center'}}>
                          <Text style={[styles.verificationButtonText, {marginRight: 5}]}>Verify</Text>
                          <Text style={{color: '#ffffff', fontSize: 16, fontWeight: 'bold'}}>WhatsApp</Text>
                        </View>
                        )}
                      </TouchableOpacity>
                    </View>
                    
                    <Text style={styles.whatsappNote}>
                      Please check your WhatsApp for a message containing your verification code
                    </Text>
                    
                    {developmentCode ? (
                      <View style={styles.developmentCodeContainer}>
                        <Text style={styles.developmentCodeTitle}>DEVELOPMENT MODE</Text>
                        <Text style={styles.developmentCodeText}>
                          Verification Code: <Text style={styles.codeHighlight}>{developmentCode}</Text>
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            setVerificationCode(developmentCode);
                          }}
                          style={styles.copyCodeButton}
                        >
                          <Text style={styles.copyCodeButtonText}>Use This Code</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                </>
              )}
              
              {verificationError ? (
                <Text style={styles.errorText}>{verificationError}</Text>
              ) : null}
              
              {isPhoneVerified && (
                <View style={styles.verificationSuccessContainer}>
                  <View style={styles.whatsappIcon}>
                    <Text style={{fontSize: 24, color: '#25D366'}}>✓</Text>
                  </View>
                  <Text style={styles.successText}>
                    Your WhatsApp number has been successfully verified
                  </Text>
                  <Text style={styles.verificationSuccessNote}>
                    You can now proceed with account creation
                  </Text>
                </View>
              )}
            </View>
          )}
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          {!isLogin && (
            <View style={styles.roleSelector}>
              <Text style={styles.roleTitle}>I want to join as:</Text>
              <View style={styles.roleButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    userRole === 'client' && styles.activeRoleButton
                  ]}
                  onPress={() => setUserRole('client')}
                >
                  <Text style={[
                    styles.roleButtonText,
                    userRole === 'client' && styles.activeRoleButtonText
                  ]}>Client</Text>
                  <Text style={styles.roleDescription}>
                    Book services & events
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    userRole === 'artist' && styles.activeRoleButton
                  ]}
                  onPress={() => setUserRole('artist')}
                >
                  <Text style={[
                    styles.roleButtonText,
                    userRole === 'artist' && styles.activeRoleButtonText
                  ]}>Artist</Text>
                  <Text style={styles.roleDescription}>
                    Offer services & tickets
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* Additional fields for artists */}
          {!isLogin && userRole === 'artist' && (
            <View style={styles.artistDetailsContainer}>
              <Text style={styles.sectionTitle}>Artist Details</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Store/Business Name"
                placeholderTextColor="#aaa"
                value={storeName}
                onChangeText={setStoreName}
              />
              
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor="#aaa"
                value={city}
                onChangeText={setCity}
              />
              
              <Text style={styles.categoryLabel}>Categories</Text>
              
              <View style={styles.categorySelector}>
                <TouchableOpacity 
                  style={[styles.input, { flex: 1, marginRight: 10, justifyContent: 'center' }]}
                  onPress={() => setShowCategoryModal(true)}
                >
                  <Text style={{color: selectedCategory ? '#333' : '#aaa'}}>
                    {selectedCategory || "Select a category"}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={addCategory}
                  disabled={!selectedCategory}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
              
              {/* Category selection modal */}
              <Modal
                visible={showCategoryModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowCategoryModal(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select a Category</Text>
                    
                    <ScrollView style={styles.categoryList}>
                      {availableCategories.map((category, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.categoryOption}
                          onPress={() => {
                            setSelectedCategory(category);
                            setShowCategoryModal(false);
                          }}
                        >
                          <Text style={styles.categoryOptionText}>{category}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setShowCategoryModal(false)}
                    >
                      <Text style={styles.closeButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
              
              {/* Show selected categories */}
              <View style={styles.categoriesContainer}>
                {categories.map((category, index) => (
                  <View key={index} style={styles.categoryTag}>
                    <Text style={styles.categoryText}>{category}</Text>
                    <TouchableOpacity
                      onPress={() => removeCategory(category)}
                      style={styles.removeButton}
                    >
                      <Text style={styles.removeButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          <TouchableOpacity 
            style={[
              styles.button, 
              (!isLogin && (!isArtistFormValid() || !isPhoneVerified)) && styles.disabledButton
            ]}
            onPress={handleAuthentication}
            disabled={loading || (!isLogin && (!isArtistFormValid() || !isPhoneVerified))}
          >
            {loading ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isLogin ? 'Log In' : 'Create Account'}
                {!isLogin && !isPhoneVerified ? ' (Verify Phone First)' : ''}
              </Text>
            )}
          </TouchableOpacity>
          
          {/* Sign up / Login toggle */}
          <TouchableOpacity onPress={toggleAuthMode} style={styles.toggleAuthContainer}>
            <Text style={styles.toggleAuthText}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Text style={styles.toggleAuthTextBold}>
                {isLogin ? "Sign up" : "Log in"}
              </Text>
            </Text>
          </TouchableOpacity>
          </ScrollView>
        </Animated.View>
        
        <TouchableOpacity
          style={[styles.adminButton]}
          onPress={() => {
            try {
              console.log('Attempting to navigate to admin panel');
              router.push('/(admin)');
            } catch (error) {
              console.error('Navigation error:', error);
              Alert.alert('Navigation Error', 'Could not navigate to admin panel');
            }
          }}
        >
          <Text style={styles.adminButtonText}>Admin Access</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Artist details styles
  artistDetailsContainer: {
    width: '100%',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#d0d0d0',
    borderRadius: 16,
    padding: 18,
    backgroundColor: 'rgba(250, 250, 255, 0.9)',
    shadowColor: '#6a0dad',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6a0dad',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  categoryLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4361EE',
    marginTop: 16,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(245, 240, 255, 0.3)',
    padding: 10,
    borderRadius: 16,
  },
  addButton: {
    backgroundColor: '#6a0dad',
    borderRadius: 14,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6a0dad',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 80,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    marginTop: 10,
    backgroundColor: 'rgba(245, 245, 255, 0.5)',
    padding: 10,
    borderRadius: 16,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(106, 13, 173, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(106, 13, 173, 0.3)',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
    marginBottom: 10,
    shadowColor: '#6a0dad',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryText: {
    color: '#6a0dad',
    marginRight: 8,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  removeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
    backgroundColor: 'rgba(106, 13, 173, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(106, 13, 173, 0.3)',
  },
  removeButtonText: {
    color: '#6a0dad',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: -2, // Adjust vertical alignment of the "×" character
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    padding: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#6a0dad',
    letterSpacing: 0.5,
  },
  categoryList: {
    maxHeight: 300,
  },
  categoryOption: {
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
    marginVertical: 2,
    borderRadius: 10,
  },
  categoryOptionText: {
    fontSize: 17,
    color: '#333',
    fontWeight: '500',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  closeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#6a0dad',
  },
  heroImage: {
    width: width,
    height: height,
    position: 'absolute',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 30,
    maxHeight: '85%',
    padding: 36,
    marginBottom: 24,
    elevation: 12,
    shadowColor: '#4361EE',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  formTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#6a0dad',
    marginBottom: 36,
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(106, 13, 173, 0.25)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  input: {
    backgroundColor: '#f8f9ff',
    borderWidth: 2,
    borderColor: '#e0e0ff',
    borderRadius: 15,
    height: 60,
    padding: 18,
    marginBottom: 20,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    shadowColor: '#4361EE',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    backgroundColor: '#6a0dad', // vibrant violet
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#6a0dad',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
    marginBottom: 20,
    transform: [{ scale: 1 }],
  },
  disabledButton: {
    backgroundColor: '#b5b5b5',
    opacity: 0.6,
    elevation: 2,
    shadowOpacity: 0.1,
    borderColor: 'transparent',
  },
  // Phone verification styles
  phoneVerificationContainer: {
    width: '100%',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#d0d0d0',
    borderRadius: 16,
    padding: 18,
    backgroundColor: 'rgba(250, 250, 255, 0.9)',
    shadowColor: '#6a0dad',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    backgroundColor: 'rgba(245, 240, 255, 0.5)',
    padding: 10,
    borderRadius: 18,
  },
  phoneInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 12,
    backgroundColor: '#f8f9ff',
    borderColor: '#6a0dad',
    borderWidth: 1.5,
    borderRadius: 14,
  },
  verificationButton: {
    backgroundColor: '#6a0dad',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    elevation: 5,
    shadowColor: '#6a0dad',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  verificationSentButton: {
    backgroundColor: '#4361EE',
  },
  verificationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  verifiedBadge: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#388E3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  verifiedText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  codeVerificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  codeInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 10,
    letterSpacing: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    backgroundColor: 'rgba(37, 211, 102, 0.1)',
    borderColor: '#25D366',
    borderWidth: 2,
    color: '#075E54',
  },
  verifyCodeButton: {
    backgroundColor: '#25D366',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
    elevation: 4,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  verifiedInput: {
    backgroundColor: '#f0fff0',
    borderColor: '#4CAF50',
    color: '#333',
  },
  codeSentText: {
    color: '#4361EE',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    color: '#25D366',
    fontSize: 16,
    marginTop: 5,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '600',
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.3)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  logo: {
    width: 250, // Fixed width, increased for better visibility
    height: 90,
    marginBottom: 30,
    alignSelf: 'center',
    resizeMode: 'contain',
  },
  switchModeText: {
    color: '#6a0dad',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  roleSelector: {
    marginBottom: 24,
    marginTop: 5,
  },
  roleTitle: {
    fontSize: 17,
    marginBottom: 10,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  roleButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleButton: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    borderWidth: 1.5,
    borderColor: '#ddd',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  activeRoleButton: {
    backgroundColor: '#f0e6ff',
    borderColor: '#6a0dad',
    elevation: 3,
    shadowColor: '#6a0dad',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  roleButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
  },
  activeRoleButtonText: {
    color: '#6a0dad',
    fontWeight: '700',
  },
  roleDescription: {
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
  },
  adminButton: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    marginTop: 10,
  },
  adminButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  toggleAuthContainer: {
    marginTop: 15,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(250, 250, 255, 0.9)',
    borderRadius: 30,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(106, 13, 173, 0.2)',
  },
  toggleAuthText: {
    color: '#444',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  toggleAuthTextBold: {
    color: '#6a0dad',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 10,
  },
  whatsappVerificationBox: {
    backgroundColor: 'rgba(37, 211, 102, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(37, 211, 102, 0.3)',
    borderRadius: 16,
    padding: 20,
    marginVertical: 15,
    alignItems: 'center',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  whatsappIcon: {
    width: 50,
    height: 50,
    marginBottom: 10,
    backgroundColor: '#e6f9ef',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#25D366',
  },
  whatsappIconText: {
    fontSize: 24,
    color: '#25D366',
  },
  whatsappNote: {
    fontSize: 14,
    color: '#555',
    marginTop: 15,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  developmentCodeContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#FFECB3',
    borderWidth: 1,
    borderColor: '#FF9800',
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  developmentCodeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 8,
  },
  developmentCodeText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  codeHighlight: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF5722',
    letterSpacing: 2,
  },
  copyCodeButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 5,
  },
  copyCodeButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  verificationSuccessContainer: {
    backgroundColor: 'rgba(37, 211, 102, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(37, 211, 102, 0.3)',
    borderRadius: 16,
    padding: 20,
    marginVertical: 15,
    alignItems: 'center',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  verificationSuccessNote: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
    textAlign: 'center',
  },
});