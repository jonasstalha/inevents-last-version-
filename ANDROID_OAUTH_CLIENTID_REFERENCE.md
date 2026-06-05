# 🎯 ANDROID OAUTH CLIENT ID - QUICK REFERENCE

## Where to Find It

After regenerating `google-services.json` in Firebase Console (Step 1 of the guide), your file will look like this:

```json
{
  "project_info": {
    "project_number": "780609459655",
    "project_id": "inevents-2fe56",
    "storage_bucket": "inevents-2fe56.firebasestorage.app"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:780609459655:android:c4535e1323f166ef7f75e2",
        "android_client_info": {
          "package_name": "com.jonass7896.InEvent"  // ← CORRECT PACKAGE!
        }
      },
      "oauth_client": [
        {
          "client_id": "YOUR_ANDROID_OAUTH_CLIENT_ID_WILL_BE_HERE_SOMETHING_LIKE_780609459655-xxxxx.apps.googleusercontent.com",
          "client_type": 1,
          "android_info": {
            "package_name": "com.jonass7896.InEvent",
            "certificate_hash": "5e8f16062ea3cd2c4a0d547876baa6f38cabf625"  // ✓ Your SHA-1
          }
        },
        {
          "client_id": "780609459655-33kqf1801palf7v922atpse13ictumgr.apps.googleusercontent.com",
          "client_type": 3  // This is Web client, don't use for Android!
        }
      ]
    }
  ]
}
```

## What to Copy

**COPY THIS VALUE:**
```
The first "client_id" with client_type": 1 (Android)
```

**Example:**
```
780609459655-kctbaqpefjhspp8amoibgtvs8m82knop.apps.googleusercontent.com
```

## What NOT to Copy

**DO NOT USE:** 
```
The "client_id" with "client_type": 3 (Web)
780609459655-33kqf1801palf7v922atpse13ictumgr.apps.googleusercontent.com ❌
```

---

## Updated auth.tsx Code

Once you have the Android OAuth Client ID, update `app/auth.tsx` line ~197:

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

Replace `PASTE_YOUR_ANDROID_CLIENT_ID_HERE` with your actual Android Client ID.

---

## Validation Checklist

Before testing, verify:

- [ ] New google-services.json downloaded from Firebase Console
- [ ] Package name in google-services.json is `com.jonass7896.InEvent`
- [ ] SHA-1 is `5e8f16062ea3cd2c4a0d547876baa6f38cabf625`
- [ ] Android OAuth Client ID (type 1) is in the file
- [ ] auth.tsx has the correct Android OAuth Client ID
- [ ] app.json still has `"package": "com.jonass7896.InEvent"`
- [ ] build.gradle still has `namespace 'com.jonass7896.InEvent'`

