// Test file for WhatsApp verification
import { initiatePhoneVerification, verifyCode } from './src/firebase/phoneVerificationService.ts';

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
    console.log('Verification code:', result.code);
    
    // Step 3: Verify the code
    const isValid = await verifyCode(result.formattedPhone, result.code);
    console.log('Verification result:', isValid ? 'Code is valid! ✅' : 'Code is invalid ❌');
    
    // Step 4: Test with invalid code
    const invalidResult = await verifyCode(result.formattedPhone, '000000');
    console.log('Invalid code test result:', invalidResult ? 'Code accepted ❌' : 'Code rejected as expected ✅');
    
    console.log('=== Test completed ===');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testPhoneVerification();

// Export for ES module compatibility
export { };

