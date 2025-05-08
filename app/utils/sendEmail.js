const express = require('express');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(express.json());

admin.initializeApp();
const db = admin.firestore();

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Endpoint to manually trigger email (simulate Firestore trigger)
app.post('/send-join-request-email', async (req, res) => {
  try {
    const { requestId } = req.body;

    const requestSnap = await db.collection('tripJoinRequests').doc(requestId).get();
    if (!requestSnap.exists) return res.status(404).send('Join request not found');

    const { tripId, userId, message } = requestSnap.data();

    const tripDoc = await db.collection('Trips').doc(tripId).get();
    if (!tripDoc.exists) return res.status(404).send('Trip not found');
    const trip = tripDoc.data();

    const hostDoc = await db.collection('users').doc(trip.userId).get();
    if (!hostDoc.exists) return res.status(404).send('Host not found');
    const host = hostDoc.data();

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return res.status(404).send('User not found');
    const user = userDoc.data();

    const mailOptions = {
      from: '"Travel Buddy App" <noreply@travelbuddy.com>',
      to: host.email,
      subject: `New Join Request for Trip: ${trip.title}`,
      html: `
        <h2>Hello ${host.name || 'Trip Host'},</h2>
        <p>Someone is interested in joining your trip!</p>
        <h3>Trip Details:</h3>
        <p><strong>Title:</strong> ${trip.title || 'Untitled Trip'}</p>
        <p><strong>Destination:</strong> ${trip.destination?.address || 'Location not specified'}</p>
        <p><strong>Dates:</strong> ${trip.startDate ? new Date(trip.startDate.toDate()).toLocaleDateString() : 'Not specified'} 
          to ${trip.endDate ? new Date(trip.endDate.toDate()).toLocaleDateString() : 'Not specified'}</p>
        <h3>User Details:</h3>
        <p><strong>Name:</strong> ${user.name || 'Unnamed User'}</p>
        <p><strong>Email:</strong> ${user.email || 'No email provided'}</p>
        <p><strong>To add this user to your trip, use the email address:</strong> ${user.email || 'No email provided'}</p>
        ${message ? `<h3>Message from User:</h3><p>${message}</p>` : ''}
        <p>Log in to the Travel Buddy app to review and approve this request.</p>
        <p>Happy traveling!</p>
        <p>The Travel Buddy Team</p>
      `
    };

    await transporter.sendMail(mailOptions);
    await requestSnap.ref.update({
      emailSent: true,
      emailSentAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Email sent to ${host.email}`);
    res.status(200).send('Email sent');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal server error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
