const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const https = require('https');
admin.initializeApp();

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

// Notification sending function
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
    const fcmToken = userData.fcmToken;
    const expoPushToken = userData.expoPushToken || userData.pushToken;

    const notificationTitle = title || 'Admin Notification';
    const fallbackName = name || userData.name || 'there';
    const notificationBody = body || `Hello ${fallbackName}, you have a new notification.`;

    if (!fcmToken && !expoPushToken) {
      return res.status(400).send({ error: 'No push token available for user' });
    }

    // Prefer Expo Push if available for managed workflow compatibility.
    if (expoPushToken && String(expoPushToken).startsWith('ExponentPushToken[')) {
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
            response.on('data', (chunk) => {
              responseBody += chunk;
            });
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

      return res.status(200).send({ success: true, provider: 'expo' });
    }

    if (!fcmToken) {
      return res.status(400).send({ error: 'No FCM token available for user' });
    }

    const message = {
      token: fcmToken,
      notification: {
        title: notificationTitle,
        body: notificationBody,
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          channelId: 'default',
          sound: 'default',
        },
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
        payload: {
          aps: {
            sound: 'default',
            contentAvailable: true,
          },
        },
      },
    };

    await admin.messaging().send(message);
    res.status(200).send({ success: true, provider: 'fcm' });
  } catch (e) {
    res.status(500).send({ error: e.toString() });
  }
});
