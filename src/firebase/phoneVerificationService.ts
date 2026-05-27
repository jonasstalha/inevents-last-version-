// src/firebase/phoneVerificationService.ts
import { Platform } from 'react-native';
import {
  signInWithPhoneNumber,
  ConfirmationResult,
  RecaptchaVerifier,
  signOut as jsSignOut,
} from 'firebase/auth';
import { auth } from './firebaseConfig';
import { storeCode, verifyCode as verifyStoredCode } from './verificationCodesDB';

const confirmationResults: Record<string, ConfirmationResult> = {};
const verificationSessions: Record<string, string> = {};

export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

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

export const initializeRecaptcha = (): RecaptchaVerifier | null => {
  if (Platform.OS !== 'web') return null;

  try {
    const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: (response: string) => {
        console.log('reCAPTCHA solved:', response);
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
      },
    });
    return recaptchaVerifier;
  } catch (error) {
    console.error('Error initializing reCAPTCHA:', error);
    return null;
  }
};

const storeVerificationSession = (formattedPhone: string, verificationId: string) => {
  verificationSessions[formattedPhone] = verificationId;
};

const clearVerificationSession = (formattedPhone: string) => {
  delete verificationSessions[formattedPhone];
  delete confirmationResults[formattedPhone];
};

export const initiatePhoneVerification = async (phoneNumber: string): Promise<{formattedPhone: string, verificationId: string}> => {
  const formattedPhone = normalizePhoneNumber(phoneNumber);

  try {
    if (Platform.OS === 'web') {
      const recaptchaVerifier = initializeRecaptcha();
      if (!recaptchaVerifier) {
        throw new Error('Unable to initialize reCAPTCHA for phone verification');
      }

      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      confirmationResults[formattedPhone] = confirmationResult;
      storeVerificationSession(formattedPhone, confirmationResult.verificationId);
      return {
        formattedPhone,
        verificationId: confirmationResult.verificationId,
      };
    }

    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      const code = generateVerificationCode();
      await storeCode(formattedPhone, code);
      storeVerificationSession(formattedPhone, `local-${Date.now()}`);
      return {
        formattedPhone,
        verificationId: 'local-fallback',
      };
    }

    throw new Error('Phone verification is only supported in web mode without native Firebase setup.');
  } catch (error) {
    console.error('Error initiating phone verification:', error);
    throw error;
  }
};

export const verifyPhoneCode = async (phoneNumber: string, code: string): Promise<boolean> => {
  const formattedPhone = normalizePhoneNumber(phoneNumber);
  const verificationId = verificationSessions[formattedPhone];

  if (!verificationId) {
    throw new Error('No active verification session. Please resend the code.');
  }

  try {
    if (Platform.OS === 'web') {
      const confirmationResult = confirmationResults[formattedPhone];
      if (!confirmationResult) {
        throw new Error('No active confirmation result for this phone number');
      }

      const result = await confirmationResult.confirm(code);
      await jsSignOut(auth);
      clearVerificationSession(formattedPhone);
      return !!result.user;
    }

    const isValid = await verifyStoredCode(formattedPhone, code);
    if (isValid) {
      clearVerificationSession(formattedPhone);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error verifying phone code:', error);
    return false;
  }
};

export const verifyCode = async (phoneNumber: string, code: string): Promise<boolean> => {
  return verifyPhoneCode(phoneNumber, code);
};

export const sendWhatsAppVerification = async (
  phoneNumber: string,
  code: string
): Promise<{success: boolean, code: string}> => {
  console.log(`Send verification code ${code} to ${phoneNumber} via WhatsApp is not supported by default.`);
  return { success: false, code };
};
