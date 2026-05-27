import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { initiatePhoneVerification, verifyCode } from '../../firebase/phoneVerificationService';

interface PhoneVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  phoneNumber: string;
  onVerificationSuccess: (verifiedPhone: string) => void;
}

const normalizePhoneNumber = (phoneNumber: string): string => {
  let formattedPhone = phoneNumber.replace(/[\s()-]/g, '');

  if (formattedPhone.startsWith('00')) {
    formattedPhone = `+${formattedPhone.slice(2)}`;
  }

  if (!formattedPhone.startsWith('+')) {
    if (formattedPhone.length === 9 || (formattedPhone.length === 10 && formattedPhone.startsWith('0'))) {
      const local = formattedPhone.startsWith('0') ? formattedPhone.slice(1) : formattedPhone;
      formattedPhone = `+212${local}`;
    } else {
      formattedPhone = `+${formattedPhone}`;
    }
  }

  return formattedPhone;
};

export default function PhoneVerificationModal({
  visible,
  onClose,
  phoneNumber,
  onVerificationSuccess
}: PhoneVerificationModalProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [formattedPhone, setFormattedPhone] = useState('');
  const [countdown, setCountdown] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  const handleSendCode = useCallback(async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    setIsSendingCode(true);
    try {
      const { formattedPhone: normalizedPhone } = await initiatePhoneVerification(phoneNumber);
      setFormattedPhone(normalizedPhone);
      setCodeSent(true);
      setCountdown(60);
      Alert.alert('Code Sent', `Verification code sent to ${normalizedPhone}.`);
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      let message = error?.message || 'Failed to send verification code. Please try again.';
      if (error?.code === 'auth/operation-not-allowed') {
        message = 'Phone authentication is disabled in your Firebase console. Please enable Phone sign-in under Authentication -> Sign-in method.';
      } else if (error?.code === 'auth/invalid-phone-number') {
        message = 'The phone number is invalid. Please enter a valid phone number including country code.';
      }
      Alert.alert('Error', message);
    } finally {
      setIsSendingCode(false);
    }
  }, [phoneNumber]);

  useEffect(() => {
    if (!visible) {
      setVerificationCode('');
      setCodeSent(false);
      setCountdown(0);
      setFormattedPhone('');
    }
  }, [visible]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerifyCode = async () => {
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit verification code');
      return;
    }

    setIsLoading(true);
    try {
      const verified = await verifyCode(formattedPhone || phoneNumber, verificationCode);
      if (verified) {
        onVerificationSuccess(formattedPhone || phoneNumber);
        handleClose();
      } else {
        Alert.alert('Invalid Code', 'The verification code you entered is incorrect. Please try again.');
      }
    } catch (error: any) {
      console.error('Error verifying code:', error);
      Alert.alert('Error', error?.message || 'Failed to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = useCallback(() => {
    if (countdown === 0) {
      handleSendCode();
    }
  }, [countdown, handleSendCode]);

  const handleClose = useCallback(() => {
    setVerificationCode('');
    setCodeSent(false);
    setCountdown(0);
    onClose();
  }, [onClose]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={handleClose}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              { transform: [{ translateY: slideAnim }] }
            ]}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={styles.modalContent}
            >
              <View style={styles.header}>
                <Text style={styles.title}>Verify Phone Number</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Text style={styles.closeIcon}>×</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.content}>
                <Text style={styles.description}>
                  We'll send a real SMS verification code to {phoneNumber}
                </Text>

                {!codeSent ? (
                  <TouchableOpacity
                    style={[styles.button, isSendingCode && styles.buttonDisabled]}
                    onPress={handleSendCode}
                    disabled={isSendingCode}
                  >
                    {isSendingCode ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Send Verification Code</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <>
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Enter 6-digit code</Text>
                      <TextInput
                        style={styles.input}
                        value={verificationCode}
                        onChangeText={setVerificationCode}
                        placeholder="000000"
                        keyboardType="number-pad"
                        maxLength={6}
                        autoFocus
                      />
                    </View>

                    <TouchableOpacity
                      style={[styles.button, (isLoading || verificationCode.length !== 6) && styles.buttonDisabled]}
                      onPress={handleVerifyCode}
                      disabled={isLoading || verificationCode.length !== 6}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.buttonText}>Verify Code</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.resendButton, countdown > 0 && styles.resendButtonDisabled]}
                      onPress={handleResendCode}
                      disabled={countdown > 0}
                    >
                      <Text style={[styles.resendText, countdown > 0 && styles.resendTextDisabled]}>
                        {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 0,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  hiddenRecaptcha: {
    width: 0,
    height: 0,
    opacity: 0,
    position: 'absolute',
    left: -9999,
    top: -9999,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 2,
    backgroundColor: '#f9fafb',
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#d1d5db',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    padding: 12,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
  },
  resendTextDisabled: {
    color: '#9ca3af',
  },
});