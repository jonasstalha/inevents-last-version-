// Test file for WhatsApp verification
import { initiatePhoneVerification, verifyCode } from './src/firebase/phoneVerificationService';

// Test phone verification
async function testPhoneVerification() {
  try {
    console.log('=== Testing WhatsApp Verification ===');
    
    // Step 1: Test phone number format
    const testPhone = '+1234567890';
    console.log(`Testing with phone number: ${testPhone}`);
    
    // Step 2: Initiate verification
    console.log('Initiating phone verification...');
    const result = await initiatePhoneVerification(testPhone);
    console.log('Verification initiated successfully!');
    console.log('Formatted phone:', result.formattedPhone);
    console.log('Verification ID:', result.verificationId);
    
    // Note: A real SMS code was sent to the phone number above.
    console.log('Enter the 6-digit SMS code to verify the phone manually.');
    
    console.log('=== Test completed ===');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testPhoneVerification();

// Export for ES module compatibility
export { };

