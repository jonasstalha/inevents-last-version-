const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
admin.initializeApp();

// Email sending function
exports.sendEmail = functions.https.onRequest(async (req, res) => {
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
exports.sendNotification = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { userId, name } = req.body;
  if (!userId || !name) return res.status(400).send('Missing parameters');
  try {
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const fcmToken = userDoc.data().fcmToken;
    if (!fcmToken) return res.status(400).send({ error: 'No FCM token' });
    const message = {
      token: fcmToken,
      notification: {
        title: 'Admin Notification',
        body: `Hello ${name}, you have a new notification from admin.`,
      },
    };
    await admin.messaging().send(message);
    res.status(200).send({ success: true });
  } catch (e) {
    res.status(500).send({ error: e.toString() });
  }
});
