@echo off
echo Deploying Firestore Rules for inevents project...
echo.

echo Step 1: Checking Firebase CLI...
firebase --version
if %errorlevel% neq 0 (
    echo Firebase CLI not found. Installing...
    npm install -g firebase-tools
)

echo.
echo Step 2: Logging in to Firebase...
firebase login

echo.
echo Step 3: Deploying Firestore rules...
firebase deploy --only firestore:rules

echo.
echo Firestore rules deployment complete!
echo The admin panel should now have access to services and tickets.
pause
