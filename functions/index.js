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
