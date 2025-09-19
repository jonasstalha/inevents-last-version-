/**
 * Test the logout functionality
 */

const { performCompleteLogout, emergencyLogout } = require('./src/utils/logoutUtil');

async function testLogout() {
  console.log('🧪 Testing logout functionality...');
  
  try {
    // Test complete logout
    console.log('\n1. Testing complete logout...');
    const result = await performCompleteLogout({
      clearAllStorage: true,
      showSuccessMessage: true
    });
    
    console.log('Complete logout result:', result);
    
    // Test emergency logout
    console.log('\n2. Testing emergency logout...');
    const emergencyResult = await emergencyLogout();
    
    console.log('Emergency logout result:', emergencyResult);
    
    console.log('\n✅ All logout tests completed');
    
  } catch (error) {
    console.error('❌ Logout test failed:', error);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  testLogout();
}
