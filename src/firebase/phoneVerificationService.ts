// src/firebase/phoneVerificationService.ts
import { signInWithPhoneNumber, ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { storeCode, verifyCode as verifyStoredCode } from './verificationCodesDB';

// Store confirmation results for verification
const confirmationResults: Record<string, ConfirmationResult> = {};

// Generate a random 6-digit verification code (fallback)
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Initialize reCAPTCHA verifier for Expo (simplified for development)
export const initializeRecaptcha = (): RecaptchaVerifier | null => {
  try {
    // For Expo/React Native, reCAPTCHA setup is complex
    // In production, you'd need to configure this properly
    // For now, we'll use invisible reCAPTCHA
    const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: (response: string) => {
        console.log('reCAPTCHA solved:', response);
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
      }
    });
    return recaptchaVerifier;
  } catch (error) {
    console.error('Error initializing reCAPTCHA:', error);
    return null;
  }
};

const normalizePhoneNumber = (phoneNumber: string): string => {
  let formattedPhone = phoneNumber.replace(/[\s()-]/g, '');

  if (formattedPhone.startsWith('00')) {
    formattedPhone = `+${formattedPhone.slice(2)}`;
  }

  if (!formattedPhone.startsWith('+')) {
    // Treat local Moroccan numbers without a country prefix as +212
    if (formattedPhone.length === 9 || (formattedPhone.length === 10 && formattedPhone.startsWith('0'))) {
      const local = formattedPhone.startsWith('0') ? formattedPhone.slice(1) : formattedPhone;
      formattedPhone = `+212${local}`;
    } else {
      formattedPhone = `+${formattedPhone}`;
    }
  }

  return formattedPhone;
};

// Send verification code using Firebase Phone Auth
export const initiatePhoneVerification = async (phoneNumber: string): Promise<{formattedPhone: string, verificationId?: string, code?: string}> => {
  let formattedPhone = '';
  try {
    // Normalize the phone number for verification
    formattedPhone = normalizePhoneNumber(phoneNumber);

    console.log(`Sending verification code to ${formattedPhone}`);

    // For development/testing, skip Firebase phone auth and use mock
    // In production, uncomment the code below and configure reCAPTCHA properly
    /*
    const recaptchaVerifier = initializeRecaptcha();
    if (!recaptchaVerifier) {
      throw new Error('Failed to initialize reCAPTCHA');
    }

    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
    confirmationResults[formattedPhone] = confirmationResult;
    */

    const code = generateVerificationCode();
    await storeCode(formattedPhone, code);
    console.log(`Using mock verification for development; code=${code}`);

    return {
      formattedPhone,
      verificationId: 'mock-verification-id',
      code,
    };
  } catch (error) {
    console.error('Error sending verification code:', error);

    // Fallback to mock verification for development
    console.log('Falling back to mock verification');
    const code = generateVerificationCode();
    console.log(`MOCK: Verification code ${code} for ${phoneNumber}`);

    return {
      formattedPhone,
      verificationId: 'mock-verification-id'
    };
  }
};

// Verify the code using Firebase Phone Auth
export const verifyPhoneCode = async (phoneNumber: string, code: string): Promise<boolean> => {
  try {
    const formattedPhone = normalizePhoneNumber(phoneNumber);

    // For development, use mock verification
    // In production, uncomment the code below
    /*
    const confirmationResult = confirmationResults[formattedPhone];
    if (!confirmationResult) {
      throw new Error('No verification in progress for this number');
    }

    const result = await confirmationResult.confirm(code);
    if (result.user) {
      console.log('Phone verification successful');
      return true;
    }
    return false;
    */

    const isValid = await verifyStoredCode(formattedPhone, code);
    if (isValid) {
      console.log('Mock phone verification successful');
      return true;
    }

    console.log('Mock phone verification failed - invalid code');
    return false;
  } catch (error) {
    console.error('Error verifying code:', error);
    return false;
  }
};

// Legacy function for backward compatibility
export const verifyCode = async (phoneNumber: string, code: string): Promise<boolean> => {
  return verifyPhoneCode(phoneNumber, code);
};

// Mock function to send WhatsApp message (kept for compatibility)
export const sendWhatsAppVerification = async (
  phoneNumber: string,
  code: string
): Promise<{success: boolean, code: string}> => {
  console.log(`MOCK: Sending verification code ${code} to ${phoneNumber} via WhatsApp`);
  return { success: true, code: code };
};
