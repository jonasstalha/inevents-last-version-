# 🔧 COMPLETE GOOGLE OAUTH FIX GUIDE

## 🔴 ROOT CAUSE
**Package Name Mismatch**: Your app runs as `com.jonass7896.InEvent` but Google OAuth is registered for `com.compagny.inevents`.

---

## ✅ STEP-BY-STEP FIX

### **STEP 1: Generate New google-services.json (Firebase Console)**

**1.1 Go to Firebase Console:**
- URL: https://console.firebase.google.com/
- Project: `inevents-2fe56`

**1.2 Add/Update Android App:**
- Click **Project Settings** → **Your apps** → **Add app**
- OR click the existing Android app and update it

**1.3 Configure Android App:**
- **Package name**: `com.jonass7896.InEvent` (EXACT - from build.gradle)
- **App nickname**: `InEvent Android`
- Click **Next**

**1.4 Add SHA-1 Certificate:**
- Copy this exact SHA-1:
```
5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
```
- Paste into **SHA-1 certificate fingerprint** field
- Click **Register app**

**1.5 Download google-services.json:**
- Click **Download google-services.json**
- Save the file

**1.6 Replace in your project:**
```
Delete: android/app/google-services.json (the old one)
Copy new file to: android/app/google-services.json
```

---

### **STEP 2: Get Android OAuth Client ID from google-services.json**

After downloading in Step 1:

**2.1 Open the new google-services.json**

**2.2 Find the Android OAuth Client:**
```json
"oauth_client": [
  {
    "client_id": "YOUR_ANDROID_CLIENT_ID_HERE",
    "client_type": 1,
    "android_info": {
      "package_name": "com.jonass7896.InEvent",
      "certificate_hash": "5e8f16062ea3cd2c4a0d547876baa6f38cabf625"
    }
  }
]
```

**2.3 Copy the `client_id` value**

---

### **STEP 3: Update auth.tsx with Android OAuth Client ID**

**3.1 Open**: `app/auth.tsx`

**3.2 Find this section** (around line 197):
```typescript
const [request, response, promptAsync] = Google.useAuthRequest({
  androidClientId: 'WILL_BE_REPLACED_AFTER_STEP_1_BELOW',
  // ...
});
```

**3.3 Replace with your Android OAuth Client ID from Step 2:**
```typescript
const [request, response, promptAsync] = Google.useAuthRequest({
  androidClientId: 'PASTE_YOUR_ANDROID_CLIENT_ID_HERE',
  iosClientId: '780609459655-33kqf1801palf7v922atpse13ictumgr.apps.googleusercontent.com',
  webClientId: '780609459655-33kqf1801palf7v922atpse13ictumgr.apps.googleusercontent.com',
  scopes: ['profile', 'email', 'openid'],
  redirectUrl: AuthSession.makeRedirectUri({
    useProxy: true,
    scheme: 'com.jonass7896.InEvent',
  }),
});
```

---

### **STEP 4: Verify Google Cloud Console OAuth Consent Screen**

**4.1 Go to**: [Google Cloud Console OAuth Consent Screen](https://console.cloud.google.com/apis/consent)

**4.2 Make sure:**
- ✓ **User Type**: External
- ✓ **App name**: `InEvent` or similar
- ✓ **User support email**: `talhayouness2025@gmail.com`
- ✓ **Scopes**: profile, email, openid

**4.3 Go to Test users tab:**
- ✓ Add: `talhayouness2025@gmail.com`

---

### **STEP 5: Verify Credentials in Google Cloud**

**5.1 Go to**: [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)

**5.2 Find your Android OAuth 2.0 Client:**
- Should show package: `com.jonass7896.InEvent`
- Should show SHA-1: `5e8f16062ea3cd2c4a0d547876baa6f38cabf625`

**5.3 If missing, create it manually:**
1. Click **+ Create Credentials** → **OAuth client ID**
2. Choose **Android**
3. Enter:
   - **Package name**: `com.jonass7896.InEvent`
   - **SHA-1**: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
4. Click **Create**
5. The Client ID will appear - use this in auth.tsx

---

### **STEP 6: Rebuild and Test**

**6.1 Clear caches:**
```bash
cd C:\Users\younesstalha\Desktop\IN-EVENT-FINALMENT-main
npx expo prebuild --clean
```

**6.2 Run on Android device:**
```bash
npx expo run:android
```

**6.3 Test Google Sign-In:**
- Click "Sign in with Google" button
- Should NOT see "Access blocked" error
- Should see YOUR app name (not generic error)
- Should be able to select your Gmail account

---

## 🧪 TROUBLESHOOTING

### If you still see "Access blocked":

**Check 1: Verify package name**
```bash
# In Android Studio or terminal:
cat android/app/build.gradle | grep "applicationId"
# Should output: applicationId 'com.jonass7896.InEvent'
```

**Check 2: Verify SHA-1 in google-services.json**
```bash
# Extract SHA-1 from google-services.json:
cat android/app/google-services.json | grep -A2 "certificate_hash"
# Should show: "5e8f16062ea3cd2c4a0d547876baa6f38cabf625"
```

**Check 3: Verify OAuth Client exists in Google Cloud**
- Go to Google Cloud Console → Credentials
- Filter by project: `inevents-2fe56`
- Should see an Android OAuth 2.0 client ID for `com.jonass7896.InEvent`

**Check 4: Wait for Google to sync**
- Sometimes takes 5-15 minutes for Google to apply changes
- Try again after 10 minutes

**Check 5: Clear app cache on device**
```bash
adb shell pm clear com.jonass7896.InEvent
```

---

## 📋 SUMMARY OF FILES CHANGED

1. ✅ `android/app/google-services.json` - REGENERATED with correct package
2. ✅ `app/auth.tsx` - Updated with Android OAuth Client ID

---

## ✨ EXPECTED RESULT

After following all steps:
- ✓ Google Sign-In button visible
- ✓ No "Access blocked" error
- ✓ Can select Gmail account
- ✓ Successfully authenticates to Firebase
- ✓ User data saved in Firestore
- ✓ Redirects to client or artist dashboard

