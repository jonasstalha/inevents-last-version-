const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const https = require('https');
admin.initializeApp();

const deleteMatchingDocuments = async (firestore, collectionName, fieldName, value) => {
  const snapshot = await firestore.collection(collectionName).where(fieldName, '==', value).get();
  if (snapshot.empty) return;

  let batch = firestore.batch();
  let batchSize = 0;
  for (const document of snapshot.docs) {
    batch.delete(document.ref);
    batchSize += 1;
    if (batchSize === 400) {
      await batch.commit();
      batch = firestore.batch();
      batchSize = 0;
    }
  }
  if (batchSize > 0) await batch.commit();
};

const deleteMatchingDocumentsForFields = async (firestore, collectionName, fields, value) => {
  const documentIds = new Set();
  for (const fieldName of fields) {
    const snapshot = await firestore.collection(collectionName).where(fieldName, '==', value).get();
    snapshot.docs.forEach((document) => documentIds.add(document.id));
  }

  if (documentIds.size === 0) return;
  let batch = firestore.batch();
  let batchSize = 0;
  for (const documentId of documentIds) {
    batch.delete(firestore.doc(`${collectionName}/${documentId}`));
    batchSize += 1;
    if (batchSize === 400) {
      await batch.commit();
      batch = firestore.batch();
      batchSize = 0;
    }
  }
  if (batchSize > 0) await batch.commit();
};

exports.deleteAccount = functions
  .runWith({ invoker: 'public' })
  .https.onRequest(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const authorization = req.headers.authorization || req.headers.Authorization || '';
  const tokenMatch = String(authorization).match(/^Bearer\s+(.+)$/i);
  if (!tokenMatch) {
    return res.status(401).json({
      error: 'Missing authorization token',
      code: 'account-delete-authenticate',
    });
  }

  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(tokenMatch[1].trim());
  } catch (error) {
    console.error('Account deletion token verification failed:', error);
    return res.status(401).json({
      error: 'Invalid or expired authorization token',
      code: 'account-delete-authenticate',
      cause: error?.code || 'auth/invalid-id-token',
    });
  }

  const userId = decodedToken.uid;
  try {
    const firestore = admin.firestore();
    const cleanupResults = await Promise.allSettled([
      firestore.recursiveDelete(firestore.doc(`users/${userId}`)),
      firestore.doc(`userStatistics/${userId}`).delete(),
      deleteMatchingDocuments(firestore, 'services', 'artistId', userId),
      deleteMatchingDocuments(firestore, 'tickets', 'artistId', userId),
      deleteMatchingDocumentsForFields(firestore, 'orders', ['artistId', 'clientId'], userId),
      deleteMatchingDocumentsForFields(firestore, 'customOrders', ['artistId', 'clientId'], userId),
      deleteMatchingDocumentsForFields(firestore, 'incomingCustomOrders', ['artistId', 'clientId'], userId),
    ]);

    const cleanupWarnings = cleanupResults
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason?.code || result.reason?.message || 'unknown-cleanup-error');
    if (cleanupWarnings.length > 0) {
      console.error('Account cleanup completed with warnings:', cleanupWarnings);
    }

    try {
      await admin.auth().deleteUser(userId);
    } catch (authError) {
      if (authError?.code !== 'auth/user-not-found') throw authError;
    }

    return res.status(200).json({
      success: true,
      cleanupWarnings: cleanupWarnings.length > 0 ? cleanupWarnings : undefined,
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    return res.status(500).json({
      error: 'Unable to delete account',
      code: 'account-delete-delete-auth-user',
      cause: error?.code || 'unknown',
    });
  }
  });

const projectId =
  process.env.GCLOUD_PROJECT ||
  (() => {
    try {
      const cfg = process.env.FIREBASE_CONFIG
        ? JSON.parse(process.env.FIREBASE_CONFIG)
        : null;
      return cfg?.projectId;
    } catch {
      return undefined;
    }
  })();
const defaultFunctionServiceAccount = projectId
  ? `${projectId}@appspot.gserviceaccount.com`
  : undefined;

// Email sending function
exports.sendEmail = functions
  .runWith(defaultFunctionServiceAccount ? { serviceAccount: defaultFunctionServiceAccount } : {})
  .https.onRequest(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { to, name, userId } = req.body;
  if (!to || !name) return res.status(400).send('Missing parameters');
  // Configure your email transport (use your real credentials or environment variables)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'your-email@gmail.com', // TODO: Replace with your email
      pass: 'your-app-password',    // TODO: Replace with your app password
    },
  });
  const mailOptions = {
    from: 'your-email@gmail.com',
    to,
    subject: 'Admin Message',
    text: `Hello ${name},\n\nThis is a message from the admin panel.`,
  };
  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send({ success: true });
  } catch (e) {
    res.status(500).send({ error: e.toString() });
  }
});

// Sends Firebase verification links through the configured SMTP provider.
exports.sendVerificationEmail = functions
  .runWith({
    secrets: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'],
  })
  .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
      const authorization = req.headers.authorization || '';
      if (!authorization.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing authorization token' });
      }

      const decodedToken = await admin.auth().verifyIdToken(authorization.slice(7));
      const email = decodedToken.email;
      if (!email || email.toLowerCase() !== String(req.body?.email || '').toLowerCase()) {
        return res.status(403).json({ error: 'Email does not match authenticated user' });
      }

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT || 587) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      const verificationLink = await admin.auth().generateEmailVerificationLink(email);

      await transporter.sendMail({
        from: 'verefecation@inevent.ma',
        to: email,
        subject: 'Verify your inEvent email address',
        text: `Verify your inEvent email address by opening this link:\n\n${verificationLink}`,
        html: `<p>Verify your inEvent email address:</p><p><a href="${verificationLink}">Verify email address</a></p>`,
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Verification email error:', error);
      return res.status(500).json({ error: 'Unable to send verification email' });
    }
  });

// WhatsApp verification sender function
// Requires environment variables: WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN
exports.sendWhatsAppVerification = functions
  .runWith({
    secrets: ['WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_ACCESS_TOKEN'],
  })
  .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { phoneNumber, code } = req.body;
    if (!phoneNumber || !code) {
      return res.status(400).json({ error: 'Missing phoneNumber or code' });
    }

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      return res.status(500).json({ error: 'WhatsApp API not configured' });
    }

    const message = {
      messaging_product: 'whatsapp',
      to: phoneNumber.replace(/[^0-9]/g, ''),
      type: 'text',
      text: { body: `Your inEvent verification code is: ${code}` },
    };

    try {
      const result = await new Promise((resolve, reject) => {
        const req = https.request(
          `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          },
          (response) => {
            let body = '';
            response.on('data', (chunk) => { body += chunk; });
            response.on('end', () => {
              if (response.statusCode >= 200 && response.statusCode < 300) {
                resolve(JSON.parse(body));
              } else {
                reject(new Error(`WhatsApp API ${response.statusCode}: ${body}`));
              }
            });
          },
        );
        req.on('error', reject);
        req.write(JSON.stringify(message));
        req.end();
      });
      res.status(200).json({ success: true, result });
    } catch (e) {
      res.status(500).json({ error: e.toString() });
    }
  });

// Notification sending function — uses Expo Push API for both platforms
exports.sendNotification = functions
  .runWith(defaultFunctionServiceAccount ? { serviceAccount: defaultFunctionServiceAccount } : {})
  .https.onRequest(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { userId, name, title, body, data } = req.body;
  if (!userId) return res.status(400).send('Missing userId parameter');
  try {
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).send({ error: 'User not found' });
    }

    const userData = userDoc.data() || {};
    const expoPushToken = userData.expoPushToken;

    if (!expoPushToken || !String(expoPushToken).startsWith('ExponentPushToken[')) {
      return res.status(400).send({ error: 'No valid Expo push token available for user' });
    }

    const notificationTitle = title || 'Admin Notification';
    const fallbackName = name || userData.name || 'there';
    const notificationBody = body || `Hello ${fallbackName}, you have a new notification.`;

    const expoPayload = JSON.stringify({
      to: expoPushToken,
      sound: 'default',
      title: notificationTitle,
      body: notificationBody,
      data: data || {},
      priority: 'high',
    });

    await new Promise((resolve, reject) => {
      const request = https.request(
        'https://exp.host/--/api/v2/push/send',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(expoPayload),
          },
        },
        (response) => {
          let responseBody = '';
          response.on('data', (chunk) => { responseBody += chunk; });
          response.on('end', () => {
            if (response.statusCode >= 200 && response.statusCode < 300) {
              resolve(responseBody);
              return;
            }
            reject(new Error(`Expo push failed: ${response.statusCode} ${responseBody}`));
          });
        },
      );
      request.on('error', reject);
      request.write(expoPayload);
      request.end();
    });

    res.status(200).send({ success: true, provider: 'expo' });
  } catch (e) {
    res.status(500).send({ error: e.toString() });
  }
});
