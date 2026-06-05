// src/firebase/verificationCodesDB.ts
import { deleteDoc, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import app from "./firebaseConfig";

/**
 * In-memory verification codes for development
 * This is used as a backup when Firestore permissions fail
 */
const inMemoryCodes: Record<string, { code: string, expiresAt: number }> = {};

/**
 * Store verification code in Firestore or fallback to memory
 */
export async function storeCode(phoneNumber: string, code: string, expiresInMinutes: number = 10) {
  const db = getFirestore(app);
  const phoneRef = doc(db, "verificationCodes", phoneNumber);
  
  // Prepare code data
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
  
  try {
    // Try to store in Firestore first
    await setDoc(phoneRef, {
      code,
      expiresAt,
      createdAt: Date.now(),
    });
    console.log("Verification code stored in Firestore");
  } catch (error) {
    console.log("Couldn't store code in Firestore, using memory storage", error);
    
    // Fallback to in-memory storage
    inMemoryCodes[phoneNumber] = {
      code,
      expiresAt,
    };
  }
  
  return code;
}

/**
 * Verify code against Firestore or fallback to memory
 */
export async function verifyCode(phoneNumber: string, code: string): Promise<boolean> {
  try {
    // Try Firestore first
    const db = getFirestore(app);
    const phoneRef = doc(db, "verificationCodes", phoneNumber);
    const docSnap = await getDoc(phoneRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const now = Date.now();
      
      // Check if code has expired
      if (data.expiresAt < now) {
        console.log("Code has expired");
        // Clean up
        await deleteDoc(phoneRef);
        return false;
      }
      
      // Check if code matches
      if (data.code === code) {
        // Clean up the code after successful verification
        await deleteDoc(phoneRef);
        return true;
      }
      return false;
    }
  } catch (error) {
    console.log("Couldn't verify code in Firestore, trying memory storage", error);
  }
  
  // Fallback to memory storage
  if (inMemoryCodes[phoneNumber]) {
    const data = inMemoryCodes[phoneNumber];
    const now = Date.now();
    
    // Check expiration
    if (data.expiresAt < now) {
      console.log("Code has expired (in-memory)");
      delete inMemoryCodes[phoneNumber];
      return false;
    }
    
    // Check code
    if (data.code === code) {
      delete inMemoryCodes[phoneNumber];
      return true;
    }
  }
  
  return false;
}
