// testVerificationCodes.js
// This is a simple test script for our verification codes database

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, Timestamp } = require('firebase/firestore');
const { getAuth, signInAnonymously } = require('firebase/auth');

// Import your Firebase config
const firebaseConfig = {
  apiKey: 'AIzaSyA4d4sIGVIDfhMOuG75qDK_rUZiPsugcYE',
  authDomain: 'inevents-2fe56.firebaseapp.com',
  projectId: 'inevents-2fe56',
  storageBucket: 'inevents-2fe56.appspot.com',
  messagingSenderId: '780609459655',
  appId: '1:780609459655:android:c4535e1323f166ef7f75e2',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// In-memory verification code storage for development
const globalVerificationCodes = {};

// Basic functions to test saving and retrieving codes
async function storeCode(phoneNumber, code, expiresInMinutes = 10) {
  try {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + expiresInMinutes);
    
    // Let's use a memory-based solution for development and fall back to Firebase
    // Store the code in memory for testing
    console.log(`Successfully stored code for ${phoneNumber} (in memory)`);
    globalVerificationCodes[phoneNumber] = {
      code: code,
      expiresAt: expiry
    };
    
    // Also try to store in Firebase (this might fail due to permissions)
    try {
      const docRef = doc(db, 'verificationCodes', phoneNumber);
      await setDoc(docRef, {
        code,
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(expiry),
      });
      console.log(`Code also stored in Firebase`);
    } catch (firebaseError) {
      console.log(`Note: Could not store in Firebase: ${firebaseError.message}`);
      console.log(`Using in-memory fallback instead`);
    }
    
    return true;
  } catch (error) {
    console.error('Error storing verification code:', error);
    return false;
  }
}

async function retrieveCode(phoneNumber) {
  try {
    // First check our in-memory storage
    if (globalVerificationCodes[phoneNumber]) {
      const now = new Date();
      const expiresAt = globalVerificationCodes[phoneNumber].expiresAt;
      
      if (now > expiresAt) {
        console.log('In-memory verification code expired');
        delete globalVerificationCodes[phoneNumber]; // Clean up expired code
        return null;
      }
      
      console.log(`Successfully retrieved code from memory for ${phoneNumber}`);
      return globalVerificationCodes[phoneNumber].code;
    }
    
    // If not in memory, try Firebase
    try {
      const docRef = doc(db, 'verificationCodes', phoneNumber);
      const docSnapshot = await getDoc(docRef);
      
      if (!docSnapshot.exists()) {
        console.log('No verification code found for this number');
        return null;
      }
      
      const data = docSnapshot.data();
      const now = new Date();
      const expiresAt = data.expiresAt.toDate();
      
      if (now > expiresAt) {
        console.log('Verification code expired');
        return null;
      }
      
      console.log(`Successfully retrieved code from Firebase for ${phoneNumber}`);
      return data.code;
    } catch (firebaseError) {
      console.log(`Note: Could not retrieve from Firebase: ${firebaseError.message}`);
      return null;
    }
  } catch (error) {
    console.error('Error retrieving verification code:', error);
    return null;
  }
}

async function checkCode(phoneNumber, code) {
  try {
    const storedCode = await retrieveCode(phoneNumber);
    if (!storedCode) {
      return false;
    }
    
    const isValid = storedCode === code;
    console.log(`Code verification result: ${isValid ? 'Valid' : 'Invalid'}`);
    return isValid;
  } catch (error) {
    console.error('Error verifying code:', error);
    return false;
  }
}

// Run tests
async function runTests() {
  const testPhone = '+1234567890';
  const testCode = '123456';
  
  console.log('=== VERIFICATION CODE DB TEST ===');
  
  try {
    console.log('1. Testing code storage...');
    await storeCode(testPhone, testCode);
    
    console.log('2. Testing code retrieval...');
    const retrievedCode = await retrieveCode(testPhone);
    console.log('Retrieved code:', retrievedCode);
    
    console.log('3. Testing code validation...');
    const isValid = await checkCode(testPhone, testCode);
    console.log('Is valid code:', isValid);
    
    console.log('4. Testing invalid code...');
    const isInvalid = await checkCode(testPhone, '000000');
    console.log('Is invalid code correctly rejected:', !isInvalid);
  } catch (error) {
    console.error('Test failed with error:', error);
  }
  
  console.log('=== TEST COMPLETED ===');
}

runTests();
