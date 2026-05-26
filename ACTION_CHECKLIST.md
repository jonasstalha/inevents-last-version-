# ✅ QUICK ACTION CHECKLIST

## YOUR IMMEDIATE NEXT STEPS

### PHASE 1: Firebase Console Setup (5 minutes)

- [ ] Open Firebase Console: https://console.firebase.google.com/
- [ ] Select project: `inevents-2fe56`
- [ ] Go to **Project Settings** → **Your apps**
- [ ] Click existing Android app OR click **Add app** → **Android**
- [ ] Enter package name: **`com.jonass7896.InEvent`**
- [ ] Paste SHA-1: **`5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`**
- [ ] Click **Register app**
- [ ] Download **google-services.json**
- [ ] Save it to: `android/app/google-services.json`

### PHASE 2: Extract Android OAuth Client ID (2 minutes)

- [ ] Open the **new** `android/app/google-services.json`
- [ ] Find `"oauth_client"` array
- [ ] Look for entry with `"client_type": 1` (Android)
- [ ] Copy the `"client_id"` value
- [ ] Example: `780609459655-kctbaqpefjhspp8amoibgtvs8m82knop.apps.googleusercontent.com`

### PHASE 3: Update auth.tsx (2 minutes)

- [ ] Open `app/auth.tsx`
- [ ] Go to line ~197 (search for "Google Sign-In hook")
- [ ] Find `androidClientId: 'WILL_BE_REPLACED_AFTER_STEP_1_BELOW'`
- [ ] Replace with your Android OAuth Client ID from Phase 2
- [ ] Save file

### PHASE 4: Rebuild App (3 minutes)

```bash
cd C:\Users\younesstalha\Desktop\IN-EVENT-FINALMENT-main
npx expo prebuild --clean
npx expo run:android
```

- [ ] Wait for build to complete
- [ ] Device shows app starting

### PHASE 5: Verify OAuth Consent Screen (2 minutes)

Go to [Google Cloud OAuth Consent Screen](https://console.cloud.google.com/apis/consent):

- [ ] Check **User Type** = "External"
- [ ] Check **App name** = filled
- [ ] Check **User support email** = `talhayouness2025@gmail.com`
- [ ] Go to **Scopes** tab
- [ ] Ensure `profile`, `email`, `openid` are added
- [ ] Go to **Test users** tab
- [ ] Add test user: `talhayouness2025@gmail.com`

### PHASE 6: Test on Device (2 minutes)

On your Android device/emulator:

- [ ] Open the app
- [ ] Go to Sign In / Registration page
- [ ] Click "Sign in with Google" button
- [ ] Should NOT see "Access blocked" error
- [ ] Should see Gmail account selection
- [ ] Select account and complete sign-in
- [ ] Should see success and redirect to dashboard

---

## ⏱️ TOTAL TIME: ~15 minutes

Plus 5-15 minutes waiting for Google Cloud propagation.

---

## 🚨 IF SOMETHING GOES WRONG

### Still seeing "Access blocked"?

1. **Wait 10 minutes** - Google Cloud takes time to sync
2. **Check package name** in `android/app/build.gradle`:
   ```bash
   grep applicationId android/app/build.gradle
   ```
   Should show: `com.jonass7896.InEvent`

3. **Verify SHA-1** in `android/app/google-services.json`:
   ```bash
   grep certificate_hash android/app/google-services.json
   ```
   Should show: `5e8f16062ea3cd2c4a0d547876baa6f38cabf625`

4. **Check OAuth Consent Screen** - go to Google Cloud Console
   - Verify app name is filled
   - Verify scopes include profile, email, openid
   - Verify test user is added

5. **Clear app cache**:
   ```bash
   adb shell pm clear com.jonass7896.InEvent
   ```

6. **Rebuild from scratch**:
   ```bash
   npx expo prebuild --clean
   npx expo run:android
   ```

---

## 📝 NOTES

- **Android OAuth Client ID** is different from Web Client ID
- **Web Client ID** (the one you have) only works for web/backend
- **Android OAuth Client ID** (from google-services.json) is needed for native Android
- **DO NOT** use the old google-services.json - regenerate new one
- **DO NOT** skip the rebuild step - Expo needs to detect new config

---

## 💾 FILES MODIFIED

1. ✅ `android/app/google-services.json` - WILL BE REPLACED (from Firebase)
2. ✅ `app/auth.tsx` - ALREADY UPDATED (waiting for Android Client ID)
3. ✅ `android/gradle.properties` - ALREADY SET (Java home)
4. ✅ `android/local.properties` - ALREADY SET (SDK path)

---

## 📞 NEED HELP?

1. Check **GOOGLE_OAUTH_FIX_GUIDE.md** for detailed steps
2. Check **ANDROID_OAUTH_CLIENTID_REFERENCE.md** for what to look for
3. Check **GOOGLE_OAUTH_AUDIT_REPORT.md** for full analysis

---

**You are 30 seconds away from successful Google OAuth! Just follow these steps exactly. 🚀**

