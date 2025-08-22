// src/firebase/phoneVerificationService.ts
import { verifyCode as checkCode, storeCode } from './verificationCodesDB';

// Generate a random 6-digit verification code
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store verification code using our reliable storage
export const storeVerificationCode = async (
  phoneNumber: string, 
  code: string,
  expiresIn: number = 10 * 60 * 1000 // 10 minutes in milliseconds
): Promise<void> => {
  try {
    // Convert to minutes
    const expiresInMinutes = Math.floor(expiresIn / (60 * 1000));
    await storeCode(phoneNumber, code, expiresInMinutes);
  } catch (error) {
    console.error('Error storing verification code:', error);
    throw new Error('Failed to store verification code');
  }
};

// Verify a code against what's stored
export const verifyCode = async (phoneNumber: string, code: string): Promise<boolean> => {
  try {
    return await checkCode(phoneNumber, code);
  } catch (error) {
    console.error('Error verifying code:', error);
    return false;
  }
};

// Mock function to send WhatsApp message 
// In production, this would integrate with WhatsApp Business API
export const sendWhatsAppVerification = async (
  phoneNumber: string, 
  code: string
): Promise<{success: boolean, code: string}> => {
  // In a real app, this would call WhatsApp Business API
  // For this demo, we'll just log the code and simulate success
  console.log(`MOCK: Sending verification code ${code} to ${phoneNumber} via WhatsApp`);
  
  // For development purposes, we'll show the code in the UI and simulate success
  // In production, you would check the API response
  return { success: true, code: code };
};

// Function that combines code generation, storage, and sending
export const initiatePhoneVerification = async (phoneNumber: string): Promise<{formattedPhone: string, code: string}> => {
  try {
    // Format the phone number to a standard format (remove spaces, dashes, etc.)
    const formattedPhone = phoneNumber.replace(/\s+|-|\(|\)/g, '');
    
    // Generate a verification code
    const code = generateVerificationCode();
    
    try {
      // Store the code in our system (Firebase or memory fallback)
      await storeVerificationCode(formattedPhone, code);
    } catch (error) {
      console.error("Error storing code, but will continue with verification process:", error);
      // We'll continue even if storage fails - the in-memory fallback should work
    }
    
    // Send the code via WhatsApp
    const result = await sendWhatsAppVerification(formattedPhone, code);
    
    if (!result.success) {
      throw new Error('Failed to send verification code');
    }
    
    // Return both the formatted phone and the code (in development mode)
    return { formattedPhone, code };
  } catch (error) {
    console.error("Error in phone verification process:", error);
    throw new Error('Verification process failed');
  }
};
