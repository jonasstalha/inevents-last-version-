#!/bin/bash
echo "Deploying Firestore Rules for inevents project..."
echo

echo "Step 1: Checking Firebase CLI..."
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

echo
echo "Step 2: Logging in to Firebase..."
firebase login

echo
echo "Step 3: Deploying Firestore and Storage rules..."
firebase deploy --only firestore:rules,storage

echo
echo "Firestore rules deployment complete!"
echo "The admin panel should now have access to services and tickets."
