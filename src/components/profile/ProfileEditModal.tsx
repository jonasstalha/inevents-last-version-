import { Theme } from '@/src/constants/theme';
import { ProfileUpdateData, updateUserProfile, uploadProfileImage } from '@/src/firebase/profileService';
import * as ImagePicker from 'expo-image-picker';
import { getAuth } from 'firebase/auth';
import { AlertCircle, Briefcase, Camera, CheckCircle, Eye, EyeOff, FileText, Lock, Mail, MapPin, Phone, Tag, User, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface ProfileEditModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: {
    name?: string;
    email?: string;
    phone?: string;
    photoURL?: string;
    bio?: string;
    location?: string;
    categories?: string[];
    specialization?: string;
  };
  userRole?: 'client' | 'artist';
  onSuccess: () => void;
}

interface ValidationState {
  isValid: boolean;
  message: string;
}

const SPECIALIZATION_OPTIONS = [
  'Corporate Events',
  'Wedding Planning',
  'Audio/Visual Services',
  'Catering',
  'Photography',
  'Music',
  'Entertainment',
  'Decoration',
  'Other'
];

const CATEGORY_OPTIONS = [
  'Business',
  'Corporate',
  'Weddings',
  'Planning',
  'Technology',
  'A/V',
  'Food',
  'Catering',
  'Photography',
  'Visual Arts',
  'Music',
  'Entertainment',
  'Performance',
  'Decoration',
  'Design',
  'General Services'
];

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  visible,
  onClose,
  currentUser,
  userRole = 'client',
  onSuccess
}) => {
  // Form state
  const [name, setName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(currentUser.photoURL || null);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [location, setLocation] = useState(currentUser.location || '');
  const [categories, setCategories] = useState<string[]>(currentUser.categories || []);
  const [specialization, setSpecialization] = useState(currentUser.specialization || '');
  
  // UI state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0: Basic Info, 1: Artist Details (if artist), 2: Password Change
  
  // Validation state
  const [nameValidation, setNameValidation] = useState<ValidationState>({ isValid: true, message: '' });
  const [emailValidation, setEmailValidation] = useState<ValidationState>({ isValid: true, message: '' });
  const [phoneValidation, setPhoneValidation] = useState<ValidationState>({ isValid: true, message: '' });
  const [passwordValidation, setPasswordValidation] = useState<ValidationState>({ isValid: true, message: '' });
  const [bioValidation, setBioValidation] = useState<ValidationState>({ isValid: true, message: '' });
  const [locationValidation, setLocationValidation] = useState<ValidationState>({ isValid: true, message: '' });
  
  // Animation
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnimation, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnimation.setValue(0);
      scaleAnimation.setValue(0.9);
    }
  }, [visible]);

  // Real-time validation
  const validateName = (text: string) => {
    setName(text);
    if (text.trim().length < 2) {
      setNameValidation({ isValid: false, message: 'Name must be at least 2 characters' });
    } else if (text.trim().length > 50) {
      setNameValidation({ isValid: false, message: 'Name must be less than 50 characters' });
    } else {
      setNameValidation({ isValid: true, message: '✓ Valid name' });
    }
  };

  const validateEmail = (text: string) => {
    setEmail(text);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!text.trim()) {
      setEmailValidation({ isValid: false, message: 'Email is required' });
    } else if (!emailRegex.test(text)) {
      setEmailValidation({ isValid: false, message: 'Please enter a valid email address' });
    } else {
      setEmailValidation({ isValid: true, message: '✓ Valid email' });
    }
  };

  const validatePhone = (text: string) => {
    setPhone(text);
    if (text && text.length > 0) {
      const phoneRegex = /^[\+]?[\d\s\-\(\)]{8,}$/;
      if (!phoneRegex.test(text)) {
        setPhoneValidation({ isValid: false, message: 'Please enter a valid phone number' });
      } else {
        setPhoneValidation({ isValid: true, message: '✓ Valid phone number' });
      }
    } else {
      setPhoneValidation({ isValid: true, message: '' });
    }
  };

  const validateBio = (text: string) => {
    setBio(text);
    if (text.length > 500) {
      setBioValidation({ isValid: false, message: 'Bio must be less than 500 characters' });
    } else if (text.length > 0 && text.length < 10) {
      setBioValidation({ isValid: false, message: 'Bio should be at least 10 characters' });
    } else {
      setBioValidation({ isValid: true, message: text.length > 0 ? '✓ Valid bio' : '' });
    }
  };

  const validateLocation = (text: string) => {
    setLocation(text);
    if (text.length > 100) {
      setLocationValidation({ isValid: false, message: 'Location must be less than 100 characters' });
    } else {
      setLocationValidation({ isValid: true, message: text.length > 0 ? '✓ Valid location' : '' });
    }
  };

  const validatePassword = () => {
    if (newPassword) {
      if (newPassword.length < 6) {
        setPasswordValidation({ isValid: false, message: 'Password must be at least 6 characters' });
      } else if (newPassword !== confirmPassword) {
        setPasswordValidation({ isValid: false, message: 'Passwords do not match' });
      } else if (!currentPassword) {
        setPasswordValidation({ isValid: false, message: 'Current password is required' });
      } else {
        setPasswordValidation({ isValid: true, message: '✓ Password looks good' });
      }
    } else {
      setPasswordValidation({ isValid: true, message: '' });
    }
  };

  useEffect(() => {
    validatePassword();
  }, [newPassword, confirmPassword, currentPassword]);

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const toggleCategory = (category: string) => {
    setCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const isFormValid = () => {
    const basicValid = nameValidation.isValid &&
           emailValidation.isValid &&
           phoneValidation.isValid &&
           passwordValidation.isValid;

    if (userRole === 'client') {
      return basicValid;
    } else {
      return basicValid &&
             bioValidation.isValid &&
             locationValidation.isValid;
    }
  };

  const handleSave = async () => {
    if (!isFormValid()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving.');
      return;
    }

    try {
      setLoading(true);

      // Prepare update data
      const updates: ProfileUpdateData = {
        name: name.trim(),
        email: email.trim(),
      };

      if (phone.trim()) {
        updates.phone = phone.trim();
      }

      if (bio.trim()) {
        updates.bio = bio.trim();
      }

      if (location.trim()) {
        updates.location = location.trim();
      }

      if (categories.length > 0) {
        updates.categories = categories;
      }

      if (specialization) {
        updates.specialization = specialization;
      }

      if (newPassword) {
        updates.password = newPassword;
      }

      // Handle profile image upload if changed
      if (profileImage && profileImage !== currentUser.photoURL) {
        // Check if it's a new local image (starts with file://) that needs uploading
        if (profileImage.startsWith('file://') || profileImage.startsWith('content://')) {
          const auth = getAuth();
          const currentUserId = auth.currentUser?.uid;
          if (currentUserId) {
            const uploadedImageUrl = await uploadProfileImage(currentUserId, profileImage);
            updates.profileImage = uploadedImageUrl;
          }
        } else {
          // It's already a URL, just update it
          updates.profileImage = profileImage;
        }
      }

      // Update profile
      await updateUserProfile(updates);

      Alert.alert(
        'Success! 🎉',
        'Your profile has been updated successfully',
        [
          {
            text: 'Great!',
            onPress: () => {
              onSuccess();
              onClose();
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      let errorMessage = 'Failed to update profile. Please try again.';
      
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'For security reasons, please log out and log back in before updating sensitive information.';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use by another account.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect.';
      }

      Alert.alert('Update Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName(currentUser.name || '');
    setEmail(currentUser.email || '');
    setPhone(currentUser.phone || '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setProfileImage(currentUser.photoURL || null);
    setBio(currentUser.bio || '');
    setLocation(currentUser.location || '');
    setCategories(currentUser.categories || []);
    setSpecialization(currentUser.specialization || '');
    setCurrentStep(0);
    setNameValidation({ isValid: true, message: '' });
    setEmailValidation({ isValid: true, message: '' });
    setPhoneValidation({ isValid: true, message: '' });
    setPasswordValidation({ isValid: true, message: '' });
    setBioValidation({ isValid: true, message: '' });
    setLocationValidation({ isValid: true, message: '' });
  };

  const renderValidationIcon = (validation: ValidationState) => {
    if (validation.message === '') return null;
    return validation.isValid ? 
      <CheckCircle size={16} color={Theme.colors.success} /> : 
      <AlertCircle size={16} color={Theme.colors.error} />;
  };

  const renderValidationMessage = (validation: ValidationState) => {
    if (validation.message === '') return null;
    return (
      <Text style={[
        styles.validationMessage,
        { color: validation.isValid ? Theme.colors.success : Theme.colors.error }
      ]}>
        {validation.message}
      </Text>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleContainer}>
              <User size={24} color={Theme.colors.primary} />
              <Text style={styles.modalTitle}>Edit Profile</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                resetForm();
                onClose();
              }}
              style={styles.closeButton}
            >
              <X size={24} color={Theme.colors.textLight} />
            </TouchableOpacity>
          </View>

          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <TouchableOpacity
              style={styles.stepContainer}
              onPress={() => setCurrentStep(0)}
            >
              <View style={[styles.stepCircle, currentStep === 0 && styles.stepCircleActive]}>
                <Text style={[styles.stepText, currentStep === 0 && styles.stepTextActive]}>1</Text>
              </View>
              <Text style={styles.stepLabel}>Basic Info</Text>
            </TouchableOpacity>

            {userRole === 'artist' && (
              <>
                <View style={[styles.stepLine, currentStep >= 1 && styles.stepLineActive]} />
                <TouchableOpacity
                  style={styles.stepContainer}
                  onPress={() => setCurrentStep(1)}
                >
                  <View style={[styles.stepCircle, currentStep === 1 && styles.stepCircleActive]}>
                    <Text style={[styles.stepText, currentStep === 1 && styles.stepTextActive]}>2</Text>
                  </View>
                  <Text style={styles.stepLabel}>Artist Details</Text>
                </TouchableOpacity>
                <View style={[styles.stepLine, currentStep >= 2 && styles.stepLineActive]} />
                <TouchableOpacity
                  style={styles.stepContainer}
                  onPress={() => setCurrentStep(2)}
                >
                  <View style={[styles.stepCircle, currentStep === 2 && styles.stepCircleActive]}>
                    <Text style={[styles.stepText, currentStep === 2 && styles.stepTextActive]}>{userRole === 'artist' ? '3' : '2'}</Text>
                  </View>
                  <Text style={styles.stepLabel}>Security</Text>
                </TouchableOpacity>
              </>
            )}

            {userRole === 'client' && (
              <>
                <View style={[styles.stepLine, currentStep >= 1 && styles.stepLineActive]} />
                <TouchableOpacity
                  style={styles.stepContainer}
                  onPress={() => setCurrentStep(1)}
                >
                  <View style={[styles.stepCircle, currentStep === 1 && styles.stepCircleActive]}>
                    <Text style={[styles.stepText, currentStep === 1 && styles.stepTextActive]}>2</Text>
                  </View>
                  <Text style={styles.stepLabel}>Security</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <ScrollView 
            style={styles.modalContent} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {currentStep === 0 ? (
              // Basic Information Step
              <View style={styles.stepContent}>
                <Text style={styles.sectionTitle}>📝 Personal Information</Text>
                
                {/* Profile Image */}
                <View style={styles.imageSection}>
                  <TouchableOpacity onPress={handleImagePicker} style={styles.imageContainer}>
                    {profileImage ? (
                      <Image source={{ uri: profileImage }} style={styles.profileImageLarge} />
                    ) : (
                      <View style={styles.placeholderImage}>
                        <Camera size={32} color={Theme.colors.textLight} />
                      </View>
                    )}
                    <View style={styles.imageOverlay}>
                      <Camera size={20} color={Theme.colors.secondary} />
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.imageHint}>Tap to change profile picture</Text>
                </View>

                {/* Name Field */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelContainer}>
                    <User size={16} color={Theme.colors.textDark} />
                    <Text style={styles.inputLabel}>Full Name *</Text>
                    {renderValidationIcon(nameValidation)}
                  </View>
                  <TextInput
                    style={[styles.input, !nameValidation.isValid && styles.inputError]}
                    value={name}
                    onChangeText={validateName}
                    placeholder="Enter your full name"
                    placeholderTextColor={Theme.colors.textLight}
                  />
                  {renderValidationMessage(nameValidation)}
                </View>

                {/* Email Field */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelContainer}>
                    <Mail size={16} color={Theme.colors.textDark} />
                    <Text style={styles.inputLabel}>Email Address *</Text>
                    {renderValidationIcon(emailValidation)}
                  </View>
                  <TextInput
                    style={[styles.input, !emailValidation.isValid && styles.inputError]}
                    value={email}
                    onChangeText={validateEmail}
                    placeholder="Enter your email"
                    placeholderTextColor={Theme.colors.textLight}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {renderValidationMessage(emailValidation)}
                </View>

                {/* Phone Field */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelContainer}>
                    <Phone size={16} color={Theme.colors.textDark} />
                    <Text style={styles.inputLabel}>Phone Number</Text>
                    {renderValidationIcon(phoneValidation)}
                  </View>
                  <TextInput
                    style={[styles.input, !phoneValidation.isValid && styles.inputError]}
                    value={phone}
                    onChangeText={validatePhone}
                    placeholder="Enter your phone number"
                    placeholderTextColor={Theme.colors.textLight}
                    keyboardType="phone-pad"
                  />
                  {renderValidationMessage(phoneValidation)}
                </View>
              </View>
            ) : userRole === 'artist' && currentStep === 1 ? (
              // Artist Details Step (only for artists)
              <View style={styles.stepContent}>
                <Text style={styles.sectionTitle}>🎨 Artist Information</Text>
                <Text style={styles.sectionSubtitle}>Tell clients about your services</Text>
                
                {/* Bio Field */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelContainer}>
                    <FileText size={16} color={Theme.colors.textDark} />
                    <Text style={styles.inputLabel}>Bio</Text>
                    {renderValidationIcon(bioValidation)}
                  </View>
                  <TextInput
                    style={[styles.input, styles.multilineInput, !bioValidation.isValid && styles.inputError]}
                    value={bio}
                    onChangeText={validateBio}
                    placeholder="Tell clients about yourself, your experience, and your services..."
                    placeholderTextColor={Theme.colors.textLight}
                    multiline
                    numberOfLines={4}
                    maxLength={500}
                  />
                  <Text style={styles.charCount}>{bio.length}/500</Text>
                  {renderValidationMessage(bioValidation)}
                </View>

                {/* Location Field */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelContainer}>
                    <MapPin size={16} color={Theme.colors.textDark} />
                    <Text style={styles.inputLabel}>Location</Text>
                    {renderValidationIcon(locationValidation)}
                  </View>
                  <TextInput
                    style={[styles.input, !locationValidation.isValid && styles.inputError]}
                    value={location}
                    onChangeText={validateLocation}
                    placeholder="City, Region, Country"
                    placeholderTextColor={Theme.colors.textLight}
                  />
                  {renderValidationMessage(locationValidation)}
                </View>

                {/* Specialization Field */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelContainer}>
                    <Briefcase size={16} color={Theme.colors.textDark} />
                    <Text style={styles.inputLabel}>Specialization</Text>
                  </View>
                  <View style={styles.optionsContainer}>
                    {SPECIALIZATION_OPTIONS.map((spec) => (
                      <TouchableOpacity
                        key={spec}
                        style={[
                          styles.optionChip,
                          specialization === spec && styles.optionChipSelected
                        ]}
                        onPress={() => setSpecialization(spec)}
                      >
                        <Text style={[
                          styles.optionText,
                          specialization === spec && styles.optionTextSelected
                        ]}>
                          {spec}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Categories Field */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelContainer}>
                    <Tag size={16} color={Theme.colors.textDark} />
                    <Text style={styles.inputLabel}>Categories</Text>
                  </View>
                  <Text style={styles.helperText}>Select all that apply</Text>
                  <View style={styles.optionsContainer}>
                    {CATEGORY_OPTIONS.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.optionChip,
                          categories.includes(category) && styles.optionChipSelected
                        ]}
                        onPress={() => toggleCategory(category)}
                      >
                        <Text style={[
                          styles.optionText,
                          categories.includes(category) && styles.optionTextSelected
                        ]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            ) : (
              // Password Change Step
              <View style={styles.stepContent}>
                <Text style={styles.sectionTitle}>🔐 Security Settings</Text>
                <Text style={styles.sectionSubtitle}>Change your password (optional)</Text>
                
                {/* Current Password */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelContainer}>
                    <Lock size={16} color={Theme.colors.textDark} />
                    <Text style={styles.inputLabel}>Current Password</Text>
                  </View>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      placeholder="Enter current password"
                      placeholderTextColor={Theme.colors.textLight}
                      secureTextEntry={!showCurrentPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                      style={styles.eyeButton}
                    >
                      {showCurrentPassword ? 
                        <EyeOff size={20} color={Theme.colors.textLight} /> : 
                        <Eye size={20} color={Theme.colors.textLight} />
                      }
                    </TouchableOpacity>
                  </View>
                </View>

                {/* New Password */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelContainer}>
                    <Lock size={16} color={Theme.colors.textDark} />
                    <Text style={styles.inputLabel}>New Password</Text>
                    {renderValidationIcon(passwordValidation)}
                  </View>
                  <View style={[styles.passwordInputContainer, !passwordValidation.isValid && styles.inputError]}>
                    <TextInput
                      style={styles.passwordInput}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Enter new password (min 6 chars)"
                      placeholderTextColor={Theme.colors.textLight}
                      secureTextEntry={!showNewPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      style={styles.eyeButton}
                    >
                      {showNewPassword ? 
                        <EyeOff size={20} color={Theme.colors.textLight} /> : 
                        <Eye size={20} color={Theme.colors.textLight} />
                      }
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelContainer}>
                    <Lock size={16} color={Theme.colors.textDark} />
                    <Text style={styles.inputLabel}>Confirm New Password</Text>
                  </View>
                  <View style={[styles.passwordInputContainer, !passwordValidation.isValid && styles.inputError]}>
                    <TextInput
                      style={styles.passwordInput}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm new password"
                      placeholderTextColor={Theme.colors.textLight}
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeButton}
                    >
                      {showConfirmPassword ? 
                        <EyeOff size={20} color={Theme.colors.textLight} /> : 
                        <Eye size={20} color={Theme.colors.textLight} />
                      }
                    </TouchableOpacity>
                  </View>
                </View>
                
                {renderValidationMessage(passwordValidation)}
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            {currentStep === 0 ? (
              <View style={styles.footerButtons}>
                <TouchableOpacity
                  onPress={() => {
                    resetForm();
                    onClose();
                  }}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setCurrentStep(userRole === 'artist' ? 1 : 1)}
                  style={styles.nextButton}
                  disabled={!nameValidation.isValid || !emailValidation.isValid || !phoneValidation.isValid}
                >
                  <Text style={styles.nextButtonText}>Next →</Text>
                </TouchableOpacity>
              </View>
            ) : userRole === 'artist' && currentStep === 1 ? (
              <View style={styles.footerButtons}>
                <TouchableOpacity
                  onPress={() => setCurrentStep(0)}
                  style={styles.backButton}
                >
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setCurrentStep(2)}
                  style={styles.nextButton}
                  disabled={!bioValidation.isValid || !locationValidation.isValid}
                >
                  <Text style={styles.nextButtonText}>Next →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.footerButtons}>
                <TouchableOpacity
                  onPress={() => setCurrentStep(userRole === 'artist' ? 1 : 0)}
                  style={styles.backButton}
                >
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSave}
                  style={[styles.saveButton, (loading || !isFormValid()) && styles.saveButtonDisabled]}
                  disabled={loading || !isFormValid()}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={Theme.colors.secondary} />
                  ) : (
                    <Text style={styles.saveButtonText}>💾 Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '95%',
    height: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F8F8F8',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#111111',
    marginLeft: 8,
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
  },
  
  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.xl,
    backgroundColor: Theme.colors.background,
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  stepCircleActive: {
    backgroundColor: Theme.colors.primary,
  },
  stepText: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
  },
  stepTextActive: {
    color: Theme.colors.secondary,
  },
  stepLabel: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textLight,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Theme.colors.border,
    marginHorizontal: Theme.spacing.md,
  },
  stepLineActive: {
    backgroundColor: Theme.colors.primary,
  },
  
  // Content
  modalContent: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Theme.spacing.lg,
  },
  stepContent: {
    padding: 20,
    flex: 1,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#111111',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
    marginBottom: Theme.spacing.lg,
  },
  
  // Image Section
  imageSection: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: Theme.spacing.sm,
  },
  profileImageLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Theme.colors.primary,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Theme.colors.textLight,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Theme.colors.card,
  },
  imageHint: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textLight,
    textAlign: 'center',
  },
  
  // Input Groups
  inputGroup: {
    marginBottom: 20,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontWeight: '600',
    fontSize: 14,
    color: '#111111',
    marginLeft: 8,
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111111',
    backgroundColor: '#F8F8F8',
    minHeight: 48,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: Theme.colors.error,
    borderWidth: 2,
  },
  charCount: {
    alignSelf: 'flex-end',
    color: Theme.colors.textLight,
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textLight,
    marginBottom: Theme.spacing.sm,
  },
  
  // Password Inputs
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.background,
    minHeight: 48,
  },
  passwordInput: {
    flex: 1,
    padding: Theme.spacing.md,
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textDark,
  },
  eyeButton: {
    padding: Theme.spacing.md,
  },
  
  // Options (Specialization & Categories)
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.background,
  },
  optionChipSelected: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  optionText: {
    fontSize: 14,
    color: Theme.colors.textDark,
  },
  optionTextSelected: {
    color: Theme.colors.secondary,
    fontWeight: '600',
  },
  
  // Validation
  validationMessage: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.xs,
    marginTop: Theme.spacing.xs,
    marginLeft: Theme.spacing.sm,
  },
  
  // Footer
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#F8F8F8',
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 8,
    minHeight: 48,
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#111111',
    textAlign: 'center',
  },
  backButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8A2BE2',
    marginRight: 8,
    minHeight: 48,
    justifyContent: 'center',
  },
  backButtonText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#8A2BE2',
    textAlign: 'center',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#8A2BE2',
    padding: 16,
    borderRadius: 12,
    marginLeft: 8,
    minHeight: 48,
    justifyContent: 'center',
  },
  nextButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#8A2BE2',
    padding: 16,
    borderRadius: 12,
    marginLeft: 8,
    minHeight: 48,
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
