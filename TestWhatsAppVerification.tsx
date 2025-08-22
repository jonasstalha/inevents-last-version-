// TestWhatsAppVerification.tsx
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { initiatePhoneVerification, verifyCode } from './src/firebase/phoneVerificationService';

export default function TestWhatsAppVerification() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [sentCode, setSentCode] = useState('');
  const [message, setMessage] = useState('');

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setIsVerifying(true);
    setMessage('Sending verification code...');

    try {
      const result = await initiatePhoneVerification(phoneNumber);
      setIsCodeSent(true);
      setSentCode(result.code); // This is only for development/testing
      setMessage(`Code sent to ${result.formattedPhone}`);
    } catch (error) {
      console.error('Error sending verification code:', error);
      setMessage('Failed to send code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }

    setIsVerifying(true);
    setMessage('Verifying code...');

    try {
      const isValid = await verifyCode(phoneNumber, verificationCode);
      if (isValid) {
        setMessage('✅ Phone number verified successfully!');
      } else {
        setMessage('❌ Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      setMessage('Error verifying code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>WhatsApp Verification Test</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter phone number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          editable={!isVerifying && !isCodeSent}
        />
        {!isCodeSent && (
          <Button
            title="Send Verification Code"
            onPress={handleSendCode}
            disabled={isVerifying || !phoneNumber}
          />
        )}
      </View>

      {isCodeSent && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Verification Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="number-pad"
            maxLength={6}
            editable={!isVerifying}
          />
          <Button
            title="Verify Code"
            onPress={handleVerifyCode}
            disabled={isVerifying || !verificationCode || verificationCode.length !== 6}
          />
        </View>
      )}

      {/* Development mode display */}
      {sentCode && (
        <View style={styles.devContainer}>
          <Text style={styles.devTitle}>DEVELOPMENT MODE</Text>
          <Text style={styles.devCode}>Your verification code: {sentCode}</Text>
        </View>
      )}

      {isVerifying && <ActivityIndicator size="large" color="#007bff" />}
      
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  message: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 16,
    color: '#333',
  },
  devContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  devTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#dc3545',
  },
  devCode: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: 'bold',
  },
});
